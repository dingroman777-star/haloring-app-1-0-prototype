/* SET-01 manages explicit local prototype records; no cloud or real health archive API. */
(() => {
  window.createHaloDataPrivacy = function ({ state, go, render, write, persist, esc, modalRoot, closeModal, exportPayload, download, track, flash, measurementRecords, measurementDeletionChanges, accessError = () => "" }) {
    const account = () => String(state.authPhone || state.authForm?.phone || "");
    const signedIn = () => state.signedIn && state.authVerified && state.accountDeletionStatus !== "submitted";
    const object = x => x && typeof x === "object" && !Array.isArray(x);
    const root = () => state.dataPrivacy;
    const profile = () => root().accounts[account()];
    const ownerOK = () => signedIn() && root().ownerAccount === account();
    const labels = { daily: "日常用户记录", feeling: "Halo 感受记录", measurement: "主动测量演示" };
    const types = Object.keys(labels);
    let timer = null, intent = null, exportIntent = null, saveOutcome = "success", error = "", open = "";
    const clone = x => JSON.parse(JSON.stringify(x));
    const belongs = x => x && (!x.accountRef || x.accountRef === root().ownerAccount) && (!x.ownerAccount || x.ownerAccount === root().ownerAccount || x.ownerAccount === "prototype-session" && root().ownerAccount === "");
    const measurementBelongs = x => Boolean(x && (x.ownerAccount || x.accountRef) && belongs(x));
    const daily = () => (state.subjectiveRecords || []).filter(x => belongs(x) && x.category !== "rhythm");
    const sources = () => ({ daily: daily(), feeling: (Array.isArray(state.haloFeelingRecords) ? state.haloFeelingRecords : []).filter(belongs), measurement: measurementRecords ? measurementRecords().filter(measurementBelongs) : measurementBelongs(state.lastMeasurement) ? [state.lastMeasurement] : [] });
    // Change detection only; this is not an authentication or cryptographic signature.
    const digest = value => { let h = 2166136261; for (const c of JSON.stringify(value)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0).toString(16); };
    const stamp = () => new Date().toISOString();
    const date = value => Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }) : "";
    const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${({ back: "m14 5-7 7 7 7", shield: "m12 3 8 3v6c0 4-8 9-8 9S4 16 4 12V6l8-3m-4 8 3 3 5-6", location: "M12 21s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12m3-12a3 3 0 1 1-6 0 3 3 0 0 1 6 0", halo: "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18m0 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8", export: "M12 3v12m-4-4 4 4 4-4M4 15v5h16v-5", trash: "M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 10v7m4-7v7", ring: "M12 3a8 9 0 1 1 0 18 8 9 0 0 1 0-18m0 4a4 5 0 1 0 0 10 4 5 0 0 0 0-10", help: "M12 16v1m-3-8a3 3 0 1 1 4 3c-1 1-1 1-1 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0" })[name]}"/></svg>`;
    const button = (label, action, style = "primary", disabled = false) => `<button type="button" class="${style}" data-action="privacy:${action}"${disabled ? " disabled" : ""}>${esc(label)}</button>`;
    const row = (name, title, note, action, disabled = false) => `<button type="button" class="pp-row" data-action="${action}"${disabled ? " disabled" : ""}>${icon(name)}<span><strong>${title}</strong><small>${esc(note)}</small></span><i aria-hidden="true">›</i></button>`;
    const emit = (name, extra = {}) => track?.(name, { source_page: "SET-01", prototype_only: true, ...extra });
    function prepare() {
      let changed = false;
      if (!object(root()) || root().version !== 1) {
        state.dataPrivacy = { version: 1, ownerAccount: signedIn() ? account() : "", accounts: {} };
        changed = true;
      }
      if (!object(root().accounts)) { root().accounts = {}; changed = true; }
      if (!root().ownerAccount && signedIn()) { root().ownerAccount = account(); changed = true; }
      if (!object(profile())) { root().accounts[account()] = { draft: [], request: null, legacyNotice: state.healthDeletionStatus === "submitted" }; changed = true; }
      const p = profile();
      if (!Array.isArray(p.draft)) { p.draft = []; changed = true; }
      const r = p.request;
      if (r && (!object(r) || r.accountRef !== account() || !r.id || !Array.isArray(r.scope) || !r.scope.length || new Set(r.scope).size !== r.scope.length || r.scope.some(k => !types.includes(k)) || !object(r.fingerprints) || !object(r.counts) || r.scope.some(k => !Number.isInteger(r.counts[k]) || r.counts[k] < 1 || !/^[0-9a-f]{1,8}$/.test(r.fingerprints[k])) || !["pending", "complete", "failed"].includes(r.status) || !["success", "failed"].includes(r.outcome) || !Number.isFinite(Date.parse(r.consentAt)) || Date.parse(r.consentAt) > Date.now() + 1000 || !Number.isFinite(r.readyAt) || r.readyAt > Date.now() + 60000)) {
        p.request = null; p.legacyNotice = true; changed = true;
      }
      if (changed) persist();
    }
    function currentRequest() { return profile()?.request; }
    function busy() { return currentRequest()?.status === "pending"; }
    function writeRoot(next, changes = {}, records) { return write({ ...changes, dataPrivacy: next }, records); }
    function warning(message) {
      error = message;
      if (open === "select") showDelete();
      else if (open === "confirm") showConfirm();
      else render();
    }
    function gate() {
      if (accessError()) { error = accessError(); closeModal(); render(); return false; }
      if (!signedIn()) { closeModal(); go("AUTH-01"); return false; }
      if (!ownerOK()) { error = "本机记录的所属账号与当前登录不同。请登录原账号后再管理。"; closeModal(); render(); return false; }
      return true;
    }
    function modal(title, body) {
      modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal pp-modal" role="dialog" aria-modal="true" aria-labelledby="privacy-dialog-title"><header class="pp-modal-header"><h2 id="privacy-dialog-title">${title}</h2>${button("关闭", "close", "text-button")}</header>${body}<p class="pp-feedback" role="status">${esc(error)}</p></section></div>`;
    }
    function resetIntent() { intent = null; exportIntent = null; open = ""; error = ""; }
    function showExport() {
      if (!gate() || busy()) return;
      resetIntent(); open = "export";
      exportIntent = { accountRef: account(), payload: clone(exportPayload()), nonce: `export-${Date.now()}` };
      const p = exportIntent.payload;
      p.user_records = p.user_records.filter(belongs); p.measurement_records = p.measurement_records.filter(belongs);
      modal("导出本机记录", `<p>仅导出当前浏览器保存的下列记录，不含云端或真实设备健康档案。</p><dl class="pp-export-scope"><dt>用户记录</dt><dd>${p.user_records.length} 条</dd><dt>主动测量演示</dt><dd>${p.measurement_records.length} 条</dd>${p.legacy_user_tags?.length ? `<dt>旧版用户标签</dt><dd>${p.legacy_user_tags.length} 项</dd>` : ""}</dl><p>用户记录包括日常及节律用户记录、Halo 感受和已保存的 Studio 感受。不含完整节律日历、Halo 对话或记忆。</p><p class="pp-warning">文件为 JSON 明文，未加密。请在可信设备上保存；下载后无法远程撤回。</p><label class="pp-scope"><input id="privacy-export-ack" type="checkbox" data-action="privacy:export-ack"><span>我了解明文文件的保存风险</span></label><div class="pp-actions">${button("暂不导出", "close", "secondary")}${button("下载明文文件", "download", "primary", true)}</div>`);
      emit("privacy_export_confirmation_opened", { user_record_count: p.user_records.length, measurement_count: p.measurement_records.length });
    }
    function downloadExport() {
      if (!gate() || !exportIntent || exportIntent.accountRef !== account() || open !== "export" || !modalRoot.querySelector("#privacy-export-ack")?.checked) return;
      try {
        download(`HALORING-local-records-${new Date().toISOString().slice(0, 10)}.json`, new Blob([JSON.stringify(exportIntent.payload, null, 2)], { type: "application/json" }));
        emit("privacy_export_download_started", { user_record_count: exportIntent.payload.user_records.length, measurement_count: exportIntent.payload.measurement_records.length });
        resetIntent(); closeModal(); flash("已发起文件下载，请妥善保管");
      } catch { error = "未能发起下载，请重试。没有生成可分享的外部链接。"; const status = modalRoot.querySelector(".pp-feedback"); if (status) status.textContent = error; }
    }
    function showDelete() {
      if (!gate() || busy()) return;
      open = "select"; intent = null; exportIntent = null;
      const values = sources();
      const selected = profile().draft.filter(k => types.includes(k) && values[k].length);
      modal("删除哪些本机记录？", `<p>仅处理当前浏览器的演示记录。请选择范围，再核对删除影响。</p><div>${types.map(k => `<label class="pp-scope"><input type="checkbox" data-action="privacy:scope:${k}"${selected.includes(k) ? " checked" : ""}${!values[k].length ? " disabled" : ""}><span><strong>${labels[k]}</strong><small>${values[k].length ? `${values[k].length} 条` : "暂无记录"}${k === "daily" ? " · 不含节律记录" : ""}</small></span></label>`).join("")}</div><p class="pp-preserved">账号、会员资产、戒指绑定、Halo 对话与记忆、Studio 和节律记录均保留。草稿和已引用的历史对话也不会被删除。</p><div class="pp-actions">${button("暂不删除", "close", "secondary")}${button("查看删除影响", "confirm", "primary", !selected.length)}</div>`);
    }
    function selectScope(kind, checked) {
      if (open !== "select" || !gate() || !types.includes(kind) || !sources()[kind].length || busy()) return;
      const p = profile();
      p.draft = checked ? [...new Set([...p.draft, kind])] : p.draft.filter(k => k !== kind);
      error = ""; persist();
      const confirm = modalRoot.querySelector('[data-action="privacy:confirm"]');
      if (confirm) confirm.disabled = !p.draft.some(k => sources()[k]?.length);
    }
    function showConfirm() {
      if (!gate() || busy()) return;
      if (open !== "confirm") {
        const values = sources(), scope = profile().draft.filter(k => types.includes(k) && values[k].length);
        if (!scope.length) return showDelete();
        intent = { id: `privacy-delete-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, accountRef: account(), scope, counts: Object.fromEntries(scope.map(k => [k, values[k].length])), fingerprints: Object.fromEntries(scope.map(k => [k, digest(values[k])])) };
      }
      if (!intent) return;
      open = "confirm";
      modal("确认删除这些记录？", `<ul class="pp-delete-list">${intent.scope.map(k => `<li>${labels[k]}<strong>${intent.counts[k]} 条</strong></li>`).join("")}</ul><p class="pp-warning">删除后无法在本机找回。导出到其他地方的文件不会被一并删除。</p><p>不会清除戒指内记录，也不会删除云端档案。其余记录、账号与会员资产保持原样。</p><label class="pp-scope"><input id="privacy-delete-ack" type="checkbox" data-action="privacy:delete-ack"><span>我已核对范围，了解无法恢复</span></label><div class="pp-actions">${button("返回选择", "select", "secondary")}${button("删除所选记录", "submit", "danger-button", true)}</div>`);
    }
    function sameSources(r) { const values = sources(); return r.scope.every(k => digest(values[k]) === r.fingerprints[k]); }
    function submit() {
      if (!gate() || busy() || !intent || intent.accountRef !== account() || open !== "confirm" || !modalRoot.querySelector("#privacy-delete-ack")?.checked) return;
      if (intent.scope.includes("measurement") && state.measurementStatus === "running") return warning("测量还在进行，请结束测量后再删除记录。");
      if (!sameSources(intent)) { error = "记录发生了变化，请重新选择并确认。"; return showDelete(); }
      const next = clone(root());
      next.accounts[account()].request = { ...intent, status: "pending", submittedAt: stamp(), readyAt: Date.now() + 900, outcome: saveOutcome, consentAt: stamp() };
      next.accounts[account()].legacyNotice = false;
      if (!writeRoot(next)) return warning("未能保存这次操作，记录尚未删除。请保留页面并重试。");
      emit("privacy_delete_submitted", { request_id: intent.id, scopes: intent.scope, counts: intent.counts });
      resetIntent(); closeModal(); render();
    }
    function finish(ref, id) {
      // A callback from a previous login/registration must not write any result.
      if (accessError()) return;
      const r = root()?.accounts?.[ref]?.request;
      if (!r || r.id !== id || r.status !== "pending") return;
      const next = clone(root()), result = next.accounts[ref].request;
      const sameAccount = signedIn() && account() === ref && root().ownerAccount === ref;
      let failure = !sameAccount ? "账号已改变，未删除记录。请使用原账号重新核对。" : r.scope.includes("measurement") && state.measurementStatus === "running" ? "测量正在进行，未删除记录。结束后可重新选择。" : !sameSources(r) ? "记录发生了变化，未删除任何记录。请重新选择。" : r.outcome === "failed" ? "这次未能保存删除结果，原记录都还在。请重试。" : "";
      let records;
      const changes = {};
      if (!failure) {
        const selectedRecords = r.scope.flatMap(k => sources()[k]), deletedIds = new Set(selectedRecords.map(x => x.id).filter(Boolean));
        if (r.scope.includes("daily")) { records = state.subjectiveRecords.filter(x => !daily().includes(x)); changes.subjectiveMarkers = [...new Set(records.flatMap(x => x.labels || []))]; if (deletedIds.has(state.recordEditDraft?.id)) changes.recordEditDraft = null; }
        if (r.scope.includes("feeling")) changes.haloFeelingRecords = state.haloFeelingRecords.filter(x => !belongs(x));
        if (r.scope.includes("measurement")) { if (measurementBelongs(state.lastMeasurement)) changes.lastMeasurement = null; changes.measured = false; changes.measurementStatus = "ready"; Object.assign(changes, measurementDeletionChanges?.() || {}); }
        if (deletedIds.has(state.haloSource?.recordId)) { changes.haloSource = null; changes.haloContext = "none"; }
        if (Array.isArray(state.conversations) && state.conversations.some(c => deletedIds.has(c.source?.recordId))) changes.conversations = state.conversations.map(c => deletedIds.has(c.source?.recordId) ? { ...c, source: null, context: "none" } : c);
      }
      result.status = failure ? "failed" : "complete"; result.completedAt = stamp(); result.message = failure || "所选本机记录已删除。其他记录与账号资产保持原样。";
      if (!failure) next.accounts[ref].draft = [];
      if (!writeRoot(next, changes, records)) {
        result.status = "failed"; result.message = "无法保存删除结果，原记录没有变化。请不要关闭页面，稍后重试。";
        root().accounts[ref].request = result; error = result.message;
      }
      emit("privacy_delete_result", { request_id: id, status: root().accounts[ref].request.status, scopes: r.scope, counts: r.counts });
      render();
    }
    function resume() {
      clearTimeout(timer); timer = null;
      const ref = Object.keys(root()?.accounts || {}).find(k => root().accounts[k]?.request?.status === "pending");
      const r = ref && root().accounts[ref].request;
      if (r) timer = setTimeout(() => { timer = null; finish(ref, r.id); }, Math.max(0, r.readyAt - Date.now()));
    }
    function resultCard() {
      const p = profile(), r = p.request;
      if (!r) return p.legacyNotice ? `<section class="pp-result" data-status="failed"><h2>上次删除结果尚未确认</h2><p>旧记录没有可核对的处理回执。这里不会推断本机或云端已删除。</p>${button("联系支持", "support", "secondary")}</section>` : "";
      return `<section class="pp-result" data-status="${r.status}"><h2>${r.status === "pending" ? "正在删除所选本机记录" : r.status === "complete" ? "所选本机记录已删除" : "这次没有删除记录"}</h2><p role="status">${esc(r.status === "pending" ? "可以稍后回来查看结果。" : r.message)}</p><small>${r.scope.map(k => `${labels[k]} ${r.counts[k]} 条`).join(" · ")}${date(r.completedAt || r.submittedAt) ? ` · ${date(r.completedAt || r.submittedAt)}` : ""}</small>${r.status === "failed" ? button("重新选择并重试", "select", "secondary") : ""}</section>`;
    }
    function locationStatus() {
      const p = state.deviceHub?.accounts?.[account()] || {};
      if (p.locationPermission === "denied") return "系统未允许访问位置，其他功能不受影响";
      if (state.toggles.location && p.locationPermission === "granted") return "已开启 · 仅在连接时记录手机位置";
      return p.locationPermission === "granted" ? "已关闭 · 不再记录新位置，已有线索保留" : "未开启 · 不影响连接与健康记录";
    }
    function page() {
      const values = sources(), count = types.reduce((n, k) => n + values[k].length, 0), enabled = state.toggles.location && state.deviceHub?.accounts?.[account()]?.locationPermission === "granted";
      return `<section class="privacy-page"><header class="pp-header"><button type="button" data-action="previous" aria-label="返回我的">${icon("back")}</button><h1>数据与隐私</h1><span></span></header><p class="pp-summary">管理访问权限，查看、导出或删除记录。</p>${error && !open ? `<p class="pp-feedback" role="alert">${esc(error)}</p>` : ""}${!ownerOK() ? `<section class="pp-result" data-status="failed"><h2>请先核对记录所属账号</h2><p>本机记录与当前账号不匹配，暂不提供导出或删除。</p></section>` : ""}${resultCard()}<section class="pp-section"><h2>权限与使用</h2>${row("shield", "系统权限", "蓝牙、通知与系统健康数据", "go:PERM-01")}<div class="pp-location"><div><strong>位置线索</strong><p>记录连接时手机的位置，非实时定位</p></div><button type="button" class="pp-switch" role="switch" aria-label="记录位置线索" aria-checked="${!!enabled}" data-action="toggle:location"><span></span></button><p class="pp-location-status" role="status">${locationStatus()}</p></div>${row("halo", "Halo 对话与记忆", "查看来源，分别管理或删除", "go:HAL-07")}</section><section class="pp-section"><h2>本机记录</h2>${row("export", "导出记录", "先查看范围，再下载明文文件", "privacy:export", busy() || !ownerOK())}${row("trash", "删除本机记录", count ? `${count} 条可管理 · 先选择范围` : "暂无可删除的本机记录", "privacy:select", busy() || !ownerOK() || !count)}</section><section class="pp-section"><h2>分别管理</h2>${row("ring", "戒指内记录", "选择戒指，查看清除选项", "go:DEV-10")}${row("help", "节律与 Studio 记录", "到相应记录页管理", "privacy:other")}</section><details class="pp-storage"><summary>数据保存说明</summary><dl><dt>本机记录</dt><dd>当前为交互原型，输入的记录保存在此浏览器。</dd><dt>云端与真实健康档案</dt><dd>尚未接入。本页操作不会代表云端或真实设备已完成处理。</dd><dt>不同数据分别管理</dt><dd>删除本机记录不等于清除戒指、删除 Halo 对话或注销账号。</dd></dl></details><p class="pp-footnote"><button type="button" data-action="legal-read:privacy">阅读隐私政策</button></p></section>`;
    }
    function handle(action) {
      const oldDelete = /^(danger|confirm-danger):删除健康记录(?::|$)/.test(action);
      if (!(action.startsWith("privacy:") || action.startsWith("export:") || action === "export-download" || oldDelete)) return false;
      prepare();
      if (action.startsWith("privacy:review:")) { const value = action.split(":")[2]; if (!busy() && ["success", "failed"].includes(value)) saveOutcome = value; render(); return true; }
      if (!signedIn()) { closeModal(); go("AUTH-01"); return true; }
      if (oldDelete) { if (state.current === "SET-01") showDelete(); return true; }
      if (action === "privacy:close") { resetIntent(); closeModal(); return true; }
      if (action === "privacy:export" || action === "export:open" || action === "export:local") { showExport(); return true; }
      if (action === "privacy:download" || action === "export-download") { downloadExport(); return true; }
      if (action.startsWith("export:")) return true;
      if (state.current !== "SET-01") return true;
      if (action.endsWith("-ack")) { const selector = action === "privacy:export-ack" ? "export" : "delete"; const target = modalRoot.querySelector(`[data-action="privacy:${selector === "export" ? "download" : "submit"}"]`); if (target) target.disabled = !modalRoot.querySelector(`#privacy-${selector}-ack`)?.checked; return true; }
      if (action.startsWith("privacy:scope:")) { selectScope(action.slice(14), !!modalRoot.querySelector(`[data-action="${action}"]`)?.checked); return true; }
      if (action === "privacy:select") { error = ""; showDelete(); return true; }
      if (action === "privacy:confirm") { error = ""; showConfirm(); return true; }
      if (action === "privacy:submit") { submit(); return true; }
      if (action === "privacy:support") { resetIntent(); closeModal(); go("HELP-03"); return true; }
      if (action === "privacy:other") { resetIntent(); modal("分别管理其他记录", `<p>这些记录不在本页删除范围内。</p><div class="pp-actions">${button("节律日历", "route:RHY-01")}${button("我的 Studio 体验", "route:STU-08", "secondary")}</div>`); return true; }
      if (action.startsWith("privacy:route:")) { const id = action.slice(14); if (["RHY-01", "STU-08"].includes(id)) { resetIntent(); closeModal(); go(id); } return true; }
      return true;
    }
    function reviewControls(item) {
      return item.id === "SET-01" ? `<section class="review-controls"><p>PRIVACY REVIEW</p><h3>本机删除结果</h3><small>只读写当前浏览器演示记录，不调用云端删除或真实硬件。计数不代表完整健康档案。</small><div class="review-control-group">${["success", "failed"].map(v => `<button data-action="privacy:review:${v}" class="${v === saveOutcome ? "active" : ""}"${busy() ? " disabled" : ""}>${v === "success" ? "保存成功" : "保存失败"}</button>`).join("")}</div></section>` : "";
    }
    // The shared modal controller also closes on Escape, backdrop and navigation.
    // Release the in-memory export body for those paths, not only our close button.
    new MutationObserver(() => { if (open && !modalRoot.querySelector(".pp-modal")) resetIntent(); }).observe(modalRoot, { childList: true });
    return { prepare, resume, page, handle, reviewControls };
  };
})();
