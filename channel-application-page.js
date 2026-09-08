/* CHN-06: local interaction simulation, not a production application API. */
(() => {
  const NOTICE_VERSION = "application-20260907";
  const FIELDS = { "application-region": "region", "application-region-other": "regionOther", "application-experience": "experience", "application-payee-type": "payeeType" };
  window.HALO_CHANNEL_APPLICATION = {
    create({ state, persist, read, storageKey, passedIdentity, next, shell, feedback, actions, escape: e }) {
      state.applicationFlow = { consentKey: "", savedAt: "", request: null, ...state.applicationFlow };
      let context = {}, timer = null, storageError = false, consentChanged = false;
      let pageRevision = 0, lastPage = "", autoContinue = null;
      const flow = () => state.applicationFlow;
      const session = () => context.applicationContext?.() || { signedIn: false, key: "", page: "" };
      const existing = () => Boolean(state.applicationSnapshot || !["none", "draft", undefined, null].includes(state.applicationStatus) || !["inactive", undefined, null].includes(state.channelIdentity));
      const payload = () => ({ region: String(state.applicationDraft.region === "其他地区" ? state.applicationDraft.regionOther || "" : state.applicationDraft.region || "").trim(), experience: state.applicationDraft.experience || "", payeeType: state.applicationDraft.payeeType || "" });
      const consentKey = () => JSON.stringify([NOTICE_VERSION, session().key, state.identityRequestId, payload()]);
      const busy = () => flow().request?.status === "pending";
      const hasConsent = () => state.applicationConsent && flow().consentKey === consentKey();
      function synchronizeSubmission() {
        // A stale open form must adopt the saved application/request, never create another one.
        if (state.applicationSnapshot) return false;
        const saved = read();
        const sharedRequest = saved.applicationFlow?.request;
        const hasApplication = Boolean(saved.applicationSnapshot);
        const pendingElsewhere = sharedRequest?.status === "pending" && sharedRequest.id !== flow().request?.id && sharedRequest.sessionKey === session().key && sharedRequest.verificationId === state.identityRequestId;
        const hasIdentity = ["approved", "activation-pending", "active", "paused", "terminated", "needs-info", "rejected"].includes(saved.channelIdentity) && saved.channelIdentity !== state.channelIdentity;
        if (!hasApplication && !pendingElsewhere && !hasIdentity) return false;
        for (const key of ["applicationSnapshot", "applicationHistory", "applicationStatus", "channelIdentity", "completedCourses", "assessmentAnswers", "assessmentPassed", "assessmentFeedback", "trainingApplicationId", "trainingVisit"]) {
          if (Object.hasOwn(saved, key)) state[key] = saved[key];
        }
        // Legacy saved applications have no training owner yet. Adopt only their own
        // stored cohort, never carry progress from a previously open form.
        state.trainingApplicationId = saved.trainingApplicationId ?? saved.applicationSnapshot?.id ?? "";
        state.trainingVisit = saved.trainingVisit ?? null;
        state.completedCourses = Array.isArray(saved.completedCourses) ? saved.completedCourses : [];
        state.assessmentAnswers = saved.assessmentAnswers ?? {};
        state.assessmentPassed = saved.assessmentPassed ?? false;
        state.assessmentFeedback = saved.assessmentFeedback ?? "";
        if (saved.applicationFlow) state.applicationFlow = saved.applicationFlow;
        if (pendingElsewhere) {
          state.applicationDraft = { ...state.applicationDraft, ...saved.applicationDraft };
          state.applicationConsent = saved.applicationConsent;
        }
        autoContinue = null;
        return true;
      }
      function missing() {
        const draft = state.applicationDraft;
        if (!draft.region) return "请选择主要服务地区。";
        if (draft.region === "其他地区" && !payload().region) return "请填写所在城市。";
        if (!draft.experience) return "请选择相关经验。";
        if (!draft.payeeType) return "请选择收款身份。";
        if (!hasConsent()) return consentChanged ? "资料已更新，请重新勾选申请声明。" : "请阅读并勾选申请声明。";
        return "";
      }
      const valid = () => session().signedIn && passedIdentity() && !existing() && !missing();
      function clearConsent() {
        consentChanged = Boolean(state.applicationConsent || flow().consentKey);
        state.applicationConsent = false; flow().consentKey = "";
      }
      function saveDraft() {
        const previous = flow().savedAt;
        flow().savedAt = new Date().toISOString(); state.applicationDraftSaved = true;
        storageError = !persist();
        if (storageError) { flow().savedAt = previous; state.applicationDraftSaved = false; }
        return !storageError;
      }
      function repaint() {
        if (["CHN-06", "CHN-07", "CHN-08"].includes(session().page) && session().signedIn) context.render?.();
      }
      function fail(request, reason) {
        request.status = "failed"; request.error = reason; request.updatedAt = new Date().toISOString();
        persist(); context.track?.("advisor_application_submit_failed", { request_id: request.id, reason, simulated: true });
        repaint();
      }
      function finish(id) {
        timer = null;
        if (!flow()) return;
        synchronizeSubmission();
        const request = flow().request;
        if (!request || request.id !== id || request.status !== "pending") return;
        if (existing()) { request.status = "superseded"; persist(); repaint(); return; }
        if (!session().signedIn || request.sessionKey !== session().key || request.consentKey !== consentKey() || !passedIdentity() || !hasConsent()) {
          request.status = "cancelled"; clearConsent(); persist(); repaint(); return;
        }
        if (!navigator.onLine) { fail(request, "offline"); return; }
        // Persist the result before showing success. Roll back only this transaction on failure.
        const previous = { applicationSnapshot: state.applicationSnapshot, applicationStatus: state.applicationStatus, channelIdentity: state.channelIdentity, applicationDraftSaved: state.applicationDraftSaved, completedCourses: state.completedCourses, assessmentAnswers: state.assessmentAnswers, assessmentPassed: state.assessmentPassed, trainingApplicationId: state.trainingApplicationId, trainingVisit: state.trainingVisit };
        state.applicationSnapshot = { ...request.payload, ownerAccount: session().accountRef, id: request.id, verificationId: request.verificationId, consentVersion: NOTICE_VERSION, consentedAt: request.consentedAt, submittedAt: new Date().toISOString() };
        state.applicationStatus = "training"; state.channelIdentity = "application"; state.applicationDraftSaved = false;
        state.completedCourses = []; state.assessmentAnswers = {}; state.assessmentPassed = false;
        state.trainingApplicationId = request.id; state.trainingVisit = null;
        request.status = "completed"; request.updatedAt = new Date().toISOString();
        if (!persist()) { Object.assign(state, previous); storageError = true; fail(request, "storage"); return; }
        storageError = false;
        context.track?.("advisor_application_submitted", { request_id: request.id, simulated: true });
        const shouldContinue = autoContinue?.id === request.id && autoContinue.revision === pageRevision && session().page === "CHN-06";
        autoContinue = null;
        if (shouldContinue && context.go) { context.go("CHN-08"); context.flash?.("申请资料已提交"); }
        else repaint();
      }
      function observe(ctx) {
        context = { ...context, ...ctx };
        // Signing out clears the active commercial aliases. There is no request
        // to resume or recreate while that account context is absent.
        if (!flow()) { clearTimeout(timer); timer = null; autoContinue = null; return; }
        synchronizeSubmission();
        const current = session();
        if (lastPage !== current.page) { pageRevision++; lastPage = current.page; }
        if (state.applicationConsent && !hasConsent() && !existing()) clearConsent();
        const request = flow().request;
        if (request?.status === "pending") {
          if (!current.signedIn || request.sessionKey !== current.key || request.consentKey !== consentKey() || !passedIdentity()) {
            clearTimeout(timer); timer = null; request.status = "cancelled"; clearConsent(); persist();
          } else if (!timer) timer = setTimeout(() => finish(request.id), Math.max(0, Math.min(1200, request.readyAt - Date.now())));
        }
      }
      function note() {
        if (storageError) return '暂未保存，请保持本页打开。<button class="text-button" data-action="commercial:application-draft">重试保存</button>';
        return flow().savedAt || state.applicationDraftSaved ? "已自动保存到此设备" : "填写内容会自动保存到此设备";
      }
      function submissionMessage() {
        const request = flow().request;
        if (busy()) return "正在提交，请稍候…";
        if (request?.status === "failed") return request.error === "offline" ? "网络未连接。资料已保留，联网后可重试。" : "暂时未能提交。资料仍在本页，请先重试保存。";
        if (request?.status === "cancelled") return "本次提交已停止，请核对资料并重新确认声明。";
        return "";
      }
      function sync() {
        const button = document.getElementById("application-submit"), hint = document.getElementById("application-hint");
        if (button) { button.disabled = !valid() || busy() || storageError; button.setAttribute("aria-disabled", String(button.disabled)); button.textContent = busy() ? "正在提交…" : flow().request?.status === "failed" ? "重试提交并开始学习" : "提交并开始学习"; }
        if (hint) hint.textContent = submissionMessage() || missing();
        const checkbox = document.querySelector('[data-action="commercial:application-consent"]');
        if (checkbox) { checkbox.checked = Boolean(hasConsent()); checkbox.disabled = busy(); }
        const saved = document.getElementById("application-save-status");
        if (saved) { saved.innerHTML = note(); saved.classList.toggle("is-error", storageError); }
      }
      function render(item, ctx) {
        observe(ctx);
        if (existing()) {
          let progress = next();
          // A legacy snapshot with an incomplete status must not loop back to this form.
          if (progress.route === "CHN-06") progress = { title: "已有申请记录", detail: "请从原申请继续，已完成的学习和测评会保留。", label: "查看申请进度", route: "CHN-11" };
          return shell(item, "体验顾问", `${feedback(progress.title, progress.detail, "plain")}${actions([[progress.label, `go:${progress.route}`, "primary"]])}`);
        }
        if (!session().signedIn || !passedIdentity()) return shell(item, "体验顾问", `${feedback("先确认本次申请身份", "身份核验通过后再填写申请，已填资料会保留。", "plain")}${actions([["确认身份", "go:CHN-02", "primary"]])}`);
        const select = (id, label, choices, value) => {
          const values = [...choices];
          if (value && !values.some(([key]) => key === value)) values.push([value, value]);
          return `<label class="field-label" for="${id}">${label}<select id="${id}" class="field" required ${busy() ? "disabled" : ""}><option value="" ${!value ? "selected" : ""}>请选择</option>${values.map(([key, name]) => `<option value="${e(key)}" ${key === value ? "selected" : ""}>${e(name)}</option>`).join("")}</select></label>`;
        };
        const pairs = values => values.map(value => [value, value]);
        return shell(item, "体验顾问 · 第 2 步", `<div class="channel-application-page" aria-busy="${busy()}">
          <p class="application-intro">填写申请资料，提交后进入必修学习。</p>
          ${select("application-region", "主要服务地区", pairs(["上海市", "北京市", "杭州市", "其他地区"]), state.applicationDraft.region)}
          <label class="field-label application-other" ${state.applicationDraft.region !== "其他地区" ? "hidden" : ""} for="application-region-other">所在城市<input id="application-region-other" class="field" placeholder="填写城市，如成都市" autocomplete="address-level2" value="${e(state.applicationDraft.regionOther)}" ${busy() ? "disabled" : ""}></label>
          ${select("application-experience", "相关经验", pairs(["健康生活方式服务", "零售与客户服务", "内容与社群", "暂无相关经验"]), state.applicationDraft.experience)}
          ${select("application-payee-type", "收款身份", [["自然人", "个人"], ["企业或个体工商户", "企业或个体工商户"]], state.applicationDraft.payeeType)}
          <details class="disclosure application-declaration"><summary>申请声明与服务说明<span aria-hidden="true">＋</span></summary><div><p>请填写真实资料，并在资料变化时及时更新。</p><p>介绍产品时如实说明用途，不夸大健康效果，不承诺诊断、治疗或保证收益。</p><p>客户信息仅用于其同意的服务，不擅自分享或另作他用。</p></div></details>
          <label class="check-line"><input type="checkbox" data-action="commercial:application-consent" ${hasConsent() ? "checked" : ""} ${busy() ? "disabled" : ""}>我已阅读上述说明，确认资料真实并愿意遵守</label>
          <p id="application-save-status" class="application-save-status ${storageError ? "is-error" : ""}" role="status">${note()}</p>
          <div class="button-row"><button id="application-submit" class="primary" data-action="commercial:application-submit" aria-describedby="application-hint" ${!valid() || busy() || storageError ? 'disabled aria-disabled="true"' : ""}>${busy() ? "正在提交…" : flow().request?.status === "failed" ? "重试提交并开始学习" : "提交并开始学习"}</button></div>
          <p id="application-hint" class="application-hint" role="status">${e(submissionMessage() || missing())}</p>
        </div>`);
      }
      function handleAction(command, ctx) {
        if (!["application-consent", "application-submit", "application-draft"].includes(command)) return false;
        observe(ctx);
        if (existing()) { context.flash?.("已有申请记录，请继续原申请"); repaint(); return true; }
        if (!session().signedIn || !passedIdentity()) { context.flash?.("请先确认本次申请身份，已填资料会保留"); repaint(); return true; }
        if (busy()) return true;
        if (command === "application-consent") {
          state.applicationConsent = !hasConsent(); flow().consentKey = state.applicationConsent ? consentKey() : "";
          flow().consentedAt = state.applicationConsent ? new Date().toISOString() : "";
          consentChanged = false; saveDraft(); sync(); return true;
        }
        if (command === "application-draft") { saveDraft(); sync(); return true; }
        if (!valid()) { context.flash?.(missing() || "请先确认本次申请身份"); sync(); return true; }
        if (!saveDraft()) { sync(); return true; }
        const old = flow().request;
        const request = old?.status === "failed" && old.consentKey === consentKey() ? old : {
          id: `ADV-${crypto.randomUUID()}`, payload: payload(), verificationId: state.identityRequestId,
          sessionKey: session().key, consentKey: consentKey(), consentedAt: flow().consentedAt, createdAt: new Date().toISOString()
        };
        request.status = "pending"; request.error = ""; request.readyAt = Date.now() + 1200; flow().request = request;
        if (!persist()) { storageError = true; fail(request, "storage"); return true; }
        autoContinue = { id: request.id, revision: pageRevision };
        context.track?.("advisor_application_submit_started", { request_id: request.id, retry: request === old, simulated: true });
        repaint(); observe(ctx); return true;
      }
      function handleInput(target) {
        const key = FIELDS[target.id];
        if (!key) return false;
        if (synchronizeSubmission()) { repaint(); return true; }
        if (existing() || busy() || !session().signedIn || !passedIdentity()) return true;
        if (state.applicationDraft[key] === target.value) return true;
        state.applicationDraft[key] = target.value; clearConsent();
        if (flow().request) { flow().request = null; autoContinue = null; }
        saveDraft();
        const other = document.querySelector(".application-other");
        if (other) other.hidden = state.applicationDraft.region !== "其他地区";
        sync(); return true;
      }
      function reset() { clearTimeout(timer); timer = null; autoContinue = null; clearConsent(); flow().request = null; }
      window.addEventListener("storage", event => {
        if (event.key === storageKey && synchronizeSubmission()) { observe(context); repaint(); }
      });
      return { observe, render, handleAction, handleInput, reset };
    }
  };
})();
