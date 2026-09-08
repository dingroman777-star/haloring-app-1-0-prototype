(function () {
  window.createHaloStudioPreflight = function ({ state, event, media, preparation, feeling, deviceBlock, go, render, write, readStored, track, esc, icon, screen, modalRoot, closeModal }) {
    let error = "", busy = false, intent = null, shownKey = "", context = "", outcome = "success";
    const id = () => state.selectedStudioEventId;
    const account = () => String(state.authPhone || state.authForm?.phone || "local-demo");
    const record = (eventId = id()) => state.studioRecords?.[eventId];
    const button = (label, action, cls = "studio-preflight-link", disabled = false) => `<button type="button" class="${cls}" data-action="${esc(action)}" ${disabled ? "disabled" : ""}>${esc(label)}${cls === "studio-preflight-link" ? icon("arrow") : ""}</button>`;
    const scopeValid = (r, eventId) => (!r?.accountRef || r.accountRef === account()) && (!r?.sessionAccountRef || r.sessionAccountRef === account())
      && (!r?.sessionScope || r.sessionScope.eventId === eventId && r.sessionScope.bookingId === r.bookingId);
    function baseKey() {
      const r = record();
      return JSON.stringify([id(), r?.bookingId, r?.eventId, r?.eventSnapshot, r?.booked, r?.paid, r?.source,
        r?.refundStatus, r?.refundRequest?.status, r?.paymentRequest?.status, r?.deletionStatus,
        r?.mode, r?.activityConsent, r?.healthConsent, r?.reportReviewState, r?.sessionStarted, r?.sessionDone,
        r?.sessionId, r?.sessionScope, r?.beforeRecordScope, r?.beforeFeeling, r?.beforeVersion,
        account(), state.signedIn, state.authVerified, state.membershipHardwareState, state.deviceStatus, state.toggles.bluetooth, deviceBlock()]);
    }
    function syncStored() {
      const latest = readStored();
      if (!latest.ok) { fail("暂时无法核对本机记录。尚未开始，请重试。"); return false; }
      state.studioRecords = { ...latest.progress.studioRecords };
      // Adopt only the current facts used by this start gate; never restore stale records from this window.
      for (const key of ["signedIn", "authVerified", "authPhone", "authForm", "accountDeletionStatus", "deviceStatus", "firmwareStatus", "deviceResetStatus", "measurementStatus", "measurementType", "deviceMaintenance", "deviceFirmware", "deviceHub", "deviceBindings", "deviceBinding", "initialDeviceSync", "activitySync"])
        if (Object.prototype.hasOwnProperty.call(latest.progress, key)) state[key] = latest.progress[key];
      if (latest.progress.toggles) state.toggles = { ...state.toggles, ...latest.progress.toggles };
      if (latest.hardware) state.membershipHardwareState = latest.hardware;
      return true;
    }
    function problem() {
      return preparation.problem() || (!state.authVerified || state.accountDeletionStatus === "submitted" ? "请先登录当前账号" : "")
        || (record()?.activityConsent !== true ? "请先确认本次活动记录用途" : "")
        || (!scopeValid(record(), id()) ? "这条活动记录与当前预约不一致" : "");
    }
    function readiness() {
      const r = record(), ready = preparation.readiness();
      if (r?.mode === "basic") return { ready: true, title: "不使用戒指", note: "专心参加活动，不记录身体数据。" };
      if (r?.mode !== "ring") return { ready: false, title: "请重新确认参与方式", note: "已有预约和感受仍然保留。" };
      if (r.healthConsent !== true) return { ready: false, title: "尚未确认本次报告用途", note: "可返回调整，也可以不使用戒指参加。" };
      const blocked = deviceBlock();
      return { ready: ready.ready && !blocked, title: blocked && ready.ready ? "戒指暂未就绪" : ready.title.replace("Halo Ring ", ""), note: blocked && ready.ready ? blocked : ready.ready ? (state.deviceStatus === "low" ? "建议提前充电，避免活动中断。" : "活动结束后，按实际记录查看报告。") : ready.note };
    }
    function otherSession() {
      return Object.entries(state.studioRecords || {}).find(([eventId, r]) => eventId !== id() && !preparation.problem(eventId)
        && r.sessionStarted === true && !r.sessionDone && scopeValid(r, eventId));
    }
    function key() { return JSON.stringify([baseKey(), readiness(), otherSession()?.[0], error, busy]); }
    function footer() {
      const blocked = problem(), ready = readiness(), other = otherSession();
      if (blocked) return `${button("返回核对预约", "stux-booking", "primary", busy)}<p>${esc(blocked)}</p>`;
      if (other) return `${button("继续上一场活动", "stux-other", "primary", busy)}<p>先结束正在进行的活动，再开始这一场</p>`;
      return `${error ? `<p class="studio-preflight-error" role="alert">${esc(error)}</p>` : ""}${busy ? button("正在保存开始记录…", "studio-start", "primary", true) : ready.ready ? button(error ? "重试开始活动" : "开始活动", "studio-start", "primary") : button("返回调整参与方式", "stux-settings", "primary")}${!ready.ready && record()?.mode === "ring" ? button("不使用戒指参加", "stux-basic", "studio-preflight-secondary", busy) : ""}<p>${busy ? "保存成功后进入活动" : "仅开始本次记录，不代表已签到"}</p>`;
    }
    function update() {
      const host = screen.querySelector(".studio-preflight"); if (!host) return;
      const footerNode = host.querySelector(".studio-detail-footer"); if (footerNode) footerNode.innerHTML = footer();
      host.setAttribute("aria-busy", String(busy)); host.dataset.preflightKey = key();
    }
    function fail(message) { error = message; update(); }
    function page() {
      const nextContext = `${id()}:${record()?.bookingId}`;
      if (context !== nextContext) { if (!context) error = ""; context = nextContext; intent = null; }
      shownKey = baseKey();
      const e = event(id()), r = record(), blocked = problem(), ready = readiness(), other = otherSession();
      const header = `<header class="studio-detail-header"><button type="button" data-action="stux-back" aria-label="返回活动前的感受">${icon("back")}</button><h1>开始前确认</h1><span aria-hidden="true"></span></header>`;
      const eventRow = `<div class="studio-booking-event studio-preflight-event">${media(id()) ? `<img src="${media(id())}" width="64" height="64" alt="${esc(e.category)}场地示意图">` : ""}<div><h2>${esc(e.title)}</h2><p>${esc(e.date)}</p><p>${esc(e.place)} · ${esc(e.duration)}分钟</p></div></div>`;
      const ringIcon = '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
      const saved = feeling.savedText(r, id()), draft = r?.feelingDraft;
      const draftPresent = draft?.eventId === id() && draft?.bookingId === r?.bookingId && String(draft.text || "").trim() !== saved && Boolean(String(draft.text || "").trim());
      const feelingStatus = saved ? `已保存 · 用户记录${draftPresent ? "；另有未保存草稿" : ""}` : draftPresent ? "有未保存草稿 · 不会带入本次记录" : "未填写 · 不影响参加";
      const body = blocked ? `<section class="studio-preflight-section"><h2>${esc(blocked)}</h2><p>原预约和已保存的记录没有改变。</p></section>` : `${eventRow}<section class="studio-preflight-section"><h2>本次参与</h2><div class="studio-preflight-mode"><span class="studio-preflight-symbol">${r.mode === "ring" ? ringIcon : icon("clock")}</span><div><strong>${r.mode === "ring" ? "用我的 Halo Ring 记录" : "不使用戒指"}</strong>${r.mode === "ring" ? `<p class="studio-preflight-status ${ready.ready ? "is-ready" : "is-warning"}"><i aria-hidden="true"></i>${esc(ready.title)}</p>` : ""}<p>${esc(ready.note)}</p></div>${button("调整", "stux-settings")}</div></section><section class="studio-preflight-feeling"><div><h2>活动前的感受</h2>${button(saved || draftPresent ? "查看" : "记一下", "stux-feeling")}</div><p>${esc(feelingStatus)}</p></section>${other ? `<aside class="studio-preflight-reminder"><span>${icon("clock")}</span><div><strong>还有一场活动未结束</strong><p>${esc(event(other[0]).title)}</p></div></aside>` : `<aside class="studio-preflight-reminder"><span>${icon("clock")}</span><div><strong>到场后再开始</strong><p>跟随带领者的安排，准备好后点击下方按钮。</p></div></aside>`}`;
      return `<article class="studio-preflight studio-detail" data-preflight-key="${esc(key())}" aria-busy="${busy}"><div class="studio-detail-scroll" tabindex="0" aria-label="开始前确认">${header}${body}</div><footer class="studio-detail-footer" aria-live="polite">${footer()}</footer></article>`;
    }
    function navigate(target) {
      if (busy || !syncStored()) return;
      closeModal(); intent = null;
      if (record()?.sessionDone) return go("STU-15");
      if (record()?.sessionStarted && !preparation.problem() && scopeValid(record(), id())) return go("STU-04");
      go(target);
    }
    function showBasic() {
      const oldKey = shownKey;
      if (busy || !syncStored()) return;
      if (oldKey !== baseKey()) { error = "预约或设置有更新，请核对后再选择。"; render(); return; }
      if (problem() || record()?.mode !== "ring" || record()?.sessionStarted || record()?.sessionDone) return;
      const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      intent = { eventId: id(), bookingId: record().bookingId, key: baseKey(), token };
      modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal studio-preflight-modal" data-preflight-confirm="${esc(token)}"><h2>这次不使用戒指？</h2><p>只更改本次活动的参与方式，不读取本次戒指数据，也不生成本次个人报告。已有预约和感受会保留，其他活动的设置不变。</p><div class="button-row">${button("保留原方式", "close-modal", "secondary")}${button("不使用戒指并开始", "studio-start-basic", "primary")}</div></section></div>`;
    }
    async function start(basic = false) {
      if (state.current !== "STU-03" || busy) return;
      const startId = id(), startBooking = record()?.bookingId, startAccount = account(), expected = shownKey, confirmation = intent;
      if (basic && (!confirmation || confirmation.eventId !== startId || confirmation.bookingId !== record()?.bookingId
        || confirmation.token !== modalRoot.querySelector("[data-preflight-confirm]")?.dataset.preflightConfirm)) return;
      if (!navigator.locks?.request) { closeModal(); return fail("浏览器暂时无法安全保存开始记录。请重新打开本地原型后重试，尚未开始。"); }
      busy = true; error = ""; update();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        await navigator.locks.request("halo-studio-session-start", { mode: "exclusive", signal: controller.signal }, async () => {
          if (state.current !== "STU-03" || id() !== startId) return;
          if (!syncStored()) return;
          if (account() !== startAccount || record()?.bookingId !== startBooking) { closeModal(); error = "账号或预约有更新，请返回原预约核对。尚未开始。"; return; }
          if (record()?.sessionDone || record()?.sessionStarted) {
            if (preparation.problem() || !scopeValid(record(), id())) { error = "当前活动记录需要核对，请返回预约查看。"; return; }
            closeModal(); go(record().sessionDone ? "STU-15" : "STU-04"); return;
          }
          if (expected !== baseKey() || basic && confirmation.key !== baseKey()) { closeModal(); error = "预约、参与方式或连接状态有更新。请核对后再次开始。"; return; }
          if (problem()) { closeModal(); error = problem(); return; }
          if (otherSession()) { closeModal(); error = "另一场活动还在进行，这一场尚未开始。"; return; }
          if (!basic && !readiness().ready) { error = readiness().title; return; }
          const r = record(), changes = { sessionStarted: true, startedAt: new Date().toISOString(),
            sessionId: `studio-${encodeURIComponent(id())}-${encodeURIComponent(r.bookingId)}`,
            sessionScope: { eventId: id(), bookingId: r.bookingId }, sessionAccountRef: account() };
          if (basic) Object.assign(changes, { mode: "basic", healthConsent: false, reportStatus: "insufficient", preparationDraft: null });
          // Publish the start and optional one-activity mode change together, or publish neither.
          if (outcome === "fail" || !write(id(), changes)) { closeModal(); error = "开始记录没保存成功，尚未开始。原来的选择和感受都在，请重试。"; return; }
          closeModal(); intent = null;
          track("studio_session_started", { event_id: id(), booking_id: r.bookingId, session_id: changes.sessionId, mode: basic ? "basic" : r.mode, simulated: true });
          go("STU-04");
        });
      } catch { closeModal(); error = "这次没能开始，请重试。不会重复创建本次记录。"; }
      finally { clearTimeout(timeout); busy = false; if (state.current === "STU-03") { if (syncStored()) render(); else update(); } }
    }
    function resumeOther(requestedId) {
      if (busy || !syncStored()) return;
      const other = otherSession();
      if (!other || requestedId && requestedId !== other[0]) { closeModal(); error = "上一场活动状态已更新，请重新核对。"; render(); return; }
      state.selectedStudioEventId = other[0]; closeModal(); intent = null; go("STU-04");
    }
    function handle(action) {
      if (action.startsWith("stux-review:")) { outcome = action.endsWith(":fail") ? "fail" : "success"; render(); return true; }
      const own = action.startsWith("stux-") || ["studio-start", "studio-start-basic"].includes(action) || action.startsWith("studio-resume:");
      if (!own) return false;
      if (state.current !== "STU-03") return true;
      if (action === "studio-start") start();
      else if (action === "studio-start-basic") start(true);
      else if (action === "stux-basic") showBasic();
      else if (action === "stux-other" || action.startsWith("studio-resume:")) resumeOther(action.startsWith("studio-resume:") ? action.slice(14) : "");
      else if (action === "stux-settings") navigate("STU-10");
      else if (["stux-feeling", "stux-back"].includes(action)) navigate("STU-11");
      else if (action === "stux-booking") navigate("STU-18");
      return true;
    }
    function prepare() {
      return state.current !== "STU-03" || syncStored();
    }
    function refresh() {
      if (state.current !== "STU-03" || busy) return;
      const host = screen.querySelector(".studio-preflight");
      if (host && host.dataset.preflightKey !== key()) { error = "状态已更新，请核对后再开始。"; closeModal(); intent = null; render(); }
    }
    function reviewControls(item) {
      return item.id === "STU-03" ? `<section class="review-controls"><h3>开始记录 · 原型验收</h3><small>仅模拟本机保存，不连接真实设备，不提交签到或发放权益。</small><div class="review-control-group"><div>${["success", "fail"].map(value => `<button class="${outcome === value ? "active" : ""}" data-action="stux-review:${value}">${value === "success" ? "保存成功" : "保存失败"}</button>`).join("")}</div></div></section>` : "";
    }
    return { page, handle, prepare, refresh, reviewControls };
  };
})();
