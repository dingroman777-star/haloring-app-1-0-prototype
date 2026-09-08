(() => {
  "use strict";
  window.createHaloStudioReport = function ({ state, event, media, eligible, readStored, write, go, render, track, esc, icon, screen, flash }) {
    const routes = ["STU-12", "STU-05", "STU-06"];
    const outcomes = ["generated", "waiting", "failed", "unknown"];
    let error = "", errorScope = "", busy = false, settling = false, outcome = "generated", lastView = "";
    const saveFailures = new Set();
    const id = () => state.selectedStudioEventId;
    const account = () => String(state.authPhone || state.authForm?.phone || "local-demo");
    const record = (key = id()) => state.studioRecords?.[key];
    const nonempty = value => typeof value === "string" && Boolean(value.trim());
    const scope = (r, key = id()) => JSON.stringify([key, r?.bookingId, r?.sessionId, r?.startedAt, r?.completedAt, account()]);
    const button = (label, action, cls = "studio-report-link", disabled = false) => `<button type="button" class="${cls}" data-action="${esc(action)}" ${disabled ? "disabled" : ""}>${esc(label)}</button>`;
    function owned(r, key = id()) {
      return Boolean(state.signedIn && state.authVerified && state.accountDeletionStatus !== "submitted" && r?.booked && nonempty(r.bookingId)
        && (!r.source || ["app", "institution"].includes(r.source)) && (!r.eventId || r.eventId === key) && (!r.eventSnapshot?.id || r.eventSnapshot.id === key)
        && (!r.eventSnapshot?.eventId || r.eventSnapshot.eventId === key) && (!r.accountRef || r.accountRef === account())
        && (!r.sessionAccountRef || r.sessionAccountRef === account()) && (!r.sessionScope || r.sessionScope.eventId === key && r.sessionScope.bookingId === r.bookingId));
    }
    function canReport(r, key = id()) {
      if (!owned(r, key) || !r.paid || !r.sessionDone || r.mode !== "ring" || !r.activityConsent || !r.healthConsent || r.recordingStoppedAt || r.reportReviewState === "needs-review" || r.deletionStatus !== "ready") return false;
      // Legacy generated records are read-only history, never evidence for a new report.
      return r.completionSnapshot ? eligible(r, key) : r.reportStatus === "generated";
    }
    function requestValid(r, key = id()) {
      const q = r?.reportRequest;
      return Boolean(q?.version === 1 && nonempty(q.id) && q.scope === scope(r, key) && q.eventId === key && q.bookingId === r.bookingId
        && q.sessionId === r.sessionId && q.accountRef === account() && Number.isFinite(q.readyAt) && Number.isFinite(Date.parse(q.submittedAt))
        && outcomes.includes(q.outcome) && q.simulated === true);
    }
    function summary(r = record(), key = id()) {
      const result = (kind, title, note, label = "查看本次记录", action = "stur-record") => ({ kind, title, note, label, action });
      if (!owned(r, key)) return result("blocked", "暂时无法查看这次活动", "请返回原预约核对，已有记录没有改变。", "查看原预约", "stur-booking");
      if (r.deletionStatus && r.deletionStatus !== "ready") return result("deleted", "本次个人记录已删除", "个人感受与报告已停止展示，预约信息仍可查看。", "查看原预约", "stur-booking");
      if (!r.sessionDone) return result("unfinished", "本次活动还未结束", "结束活动后，可以在这里查看本次记录。", r.sessionStarted ? "继续本次活动" : "查看预约", r.sessionStarted ? "stur-continue" : "stur-booking");
      if (!r.activityConsent || r.recordingStoppedAt || r.mode === "ring" && !r.healthConsent || r.reportStatus === "withdrawn") return result("withdrawn", "本次个人报告已关闭", "参与记录仍在。重新开启设置不会自动恢复这次报告。");
      if (r.mode === "basic") return result("basic", "本次参与已记录", "本次未使用戒指记录，不生成个人身体报告。");
      if (r.reportReviewState === "needs-review") return result("review", "本次报告待核对", "原记录仍然保留，可联系活动客服核对。", "联系活动客服", "stur-help");
      if (!r.completionSnapshot && r.reportStatus !== "generated") return result("review", "本次报告待核对", "已有参与记录，但暂时无法确认本次报告情况。", "联系活动客服", "stur-help");
      if (!canReport(r, key)) return result("insufficient", "本次没有个人报告", "没有足够的有效身体记录，参与记录仍然保留。");
      if (r.reportStatus === "generated") return result("generated", r.completionSnapshot ? "本次报告已准备好" : "历史报告已保存", "报告仅供你本人回看。", "查看本次报告", "stur-open");
      if (r.reportRequest?.status === "checking") return requestValid(r, key)
        ? result("checking", "正在查询报告进度", "可以先离开，回来后继续查看。", "正在查询…", "studio-report-refresh")
        : result("review", "本次报告待核对", "查询信息不完整，请联系活动客服核对。", "联系活动客服", "stur-help");
      if (r.reportRequest?.status === "unknown") return result("unknown", "暂时查不到最新进度", "已保存的记录没有改变，可以稍后再试。", "重新查询", "studio-report-refresh");
      if (r.reportStatus === "waiting") return result("waiting", "报告正在整理", "可以先离开，稍后从「Studio → 我的体验」回来查看。", "查看最新进度", "studio-report-refresh");
      if (r.reportStatus === "failed") return result("failed", "报告暂未整理完成", "参与记录仍在，可以重新整理或联系活动客服。", "重新整理", "studio-report-retry");
      if (r.reportStatus === "insufficient") return result("insufficient", "有效记录不足", "这次未能形成个人身体报告，参与记录仍然保留。");
      return result("review", "本次报告待核对", "暂时无法确认报告状态，已有记录没有改变。", "联系活动客服", "stur-help");
    }
    function sync() {
      const latest = readStored();
      if (!latest.ok) { setError("暂时无法读取本机记录，请重新打开后再试。"); return false; }
      state.studioRecords = { ...latest.progress.studioRecords };
      for (const key of ["signedIn", "authVerified", "authPhone", "authForm", "accountDeletionStatus"])
        if (Object.prototype.hasOwnProperty.call(latest.progress, key)) state[key] = latest.progress[key];
      return true;
    }
    function setError(message) { error = message; errorScope = scope(record()); if (state.current !== "STU-12") flash(message); }
    const currentError = () => errorScope === scope(record()) ? error : "";
    function statusIcon(kind) {
      const badge = ["generated", "basic"].includes(kind) ? '<path d="m26 36 5 5 10-12"/>' : ["waiting", "checking"].includes(kind) ? '<circle cx="34" cy="35" r="11"/><path d="M34 28v8l5 3"/>' : '<circle cx="34" cy="35" r="11"/><path d="M34 29v7m0 4h.01"/>';
      return `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 43H8a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3h16l12 12v7M24 2v12h12"/>${badge}</svg>`;
    }
    function page() {
      const r = record(), s = summary(), e = owned(r) ? event(id()) : null;
      const retrySave = s.kind === "checking" && saveFailures.has(r?.reportRequest?.id);
      const pending = busy || s.kind === "checking" && !retrySave;
      const saved = r?.sessionDone && !["blocked", "deleted"].includes(s.kind);
      const links = saved ? `<nav class="studio-report-links" aria-label="本次活动相关内容">${s.action !== "stur-record" ? `<button data-action="stur-record"><span>本次记录</span>${icon("arrow")}</button>` : ""}<button data-action="stur-benefits"><span>活动权益</span>${icon("arrow")}</button>${["failed", "unknown"].includes(s.kind) ? `<button data-action="stur-help"><span>联系活动客服</span>${icon("arrow")}</button>` : ""}</nav>` : "";
      const at = Date.parse(r?.reportCheckedAt);
      const updated = Number.isFinite(at) ? `<p class="studio-report-updated">上次查询 ${esc(new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(at))}</p>` : "";
      lastView = JSON.stringify([s, r?.reportCheckedAt, currentError(), busy, navigator.onLine]);
      return `<article class="studio-report studio-detail" aria-busy="${pending}"><div class="studio-detail-scroll" tabindex="0" aria-label="本次活动结果"><header class="studio-detail-header"><button type="button" data-action="stur-home" aria-label="返回 Studio">${icon("back")}</button><h1>本次活动</h1><span></span></header>${e ? `<div class="studio-booking-event studio-report-event">${media(id()) ? `<img src="${media(id())}" width="64" height="64" alt="${esc(e.category)}场地示意图">` : ""}<div><h2>${esc(e.title)}</h2><p>${esc(e.date)}</p><p>${esc(e.place)} · ${esc(e.duration)}分钟</p></div></div>` : ""}<section class="studio-report-state" aria-live="polite">${statusIcon(s.kind)}<h2>${esc(s.title)}</h2>${saved && !["basic", "withdrawn"].includes(s.kind) ? '<p class="studio-report-saved">参与记录已保存。</p>' : ""}<p>${esc(s.note)}</p>${updated}${navigator.onLine === false ? '<p class="studio-report-error">当前离线，联网后可查询最新进度。</p>' : ""}${currentError() ? `<p class="studio-report-error" role="alert">${esc(currentError())}</p>` : ""}${button(retrySave ? "重试保存" : pending ? "正在查询…" : s.label, retrySave ? "stur-save-retry" : s.action, "primary", pending)}</section>${links}</div><footer class="studio-detail-footer">${button("返回 Studio", "stur-home", "secondary")}</footer></article>`;
    }
    async function locked(callback) {
      if (!navigator.locks?.request) { setError("暂时无法安全核对记录，请重新打开本地原型后再试。"); return false; }
      const abort = new AbortController(), timer = setTimeout(() => abort.abort(), 8000);
      try { await navigator.locks.request("halo-studio-session-start", { mode: "exclusive", signal: abort.signal }, callback); return true; }
      catch { setError("查询暂未完成，请稍后重试。已有记录没有改变。"); return false; }
      finally { clearTimeout(timer); }
    }
    async function query() {
      if (!routes.includes(state.current) || busy) return;
      const before = scope(record()), pageId = state.current;
      busy = true; error = ""; render();
      await locked(() => {
        if (state.current !== pageId || !sync()) return;
        const r = record(), s = summary();
        if (scope(r) !== before || !r?.completionSnapshot || !canReport(r) || !["waiting", "failed", "unknown"].includes(s.kind)) { setError("本次状态有更新，请按最新页面提示继续。"); return; }
        if (navigator.onLine === false) { setError("当前离线，请联网后重试。已有记录没有改变。"); return; }
        const q = { version: 1, id: `SR-${Date.now()}-${Math.random().toString(36).slice(2,9)}`, eventId: id(), bookingId: r.bookingId,
          sessionId: r.sessionId, accountRef: account(), scope: scope(r), baseStatus: r.reportStatus, status: "checking", submittedAt: new Date().toISOString(), readyAt: Date.now() + 900, outcome, simulated: true };
        if (!write(id(), { reportRequest: q })) return setError("查询请求没能保存，请重试。原记录没有改变。");
        track("studio_report_query_submitted", { event_id: id(), booking_id: r.bookingId, request_id: q.id, simulated: true });
      });
      busy = false; if (state.current === pageId) render();
    }
    async function settle() {
      if (settling || busy || document.hidden) return;
      const latest = readStored();
      if (!latest.ok || !Object.values(latest.progress.studioRecords).some(r => r?.reportRequest?.status === "checking" && r.reportRequest.readyAt <= Date.now())) return;
      settling = true;
      let changed = false;
      await locked(() => {
        if (!sync()) return;
        for (const [key, r] of Object.entries(state.studioRecords)) {
          const q = r?.reportRequest;
          if (q?.status !== "checking" || q.readyAt > Date.now() || saveFailures.has(q.id) || !owned(r, key) || !requestValid(r, key)) continue;
          if (!r.completionSnapshot || !canReport(r, key)) {
            if (!write(key, { reportRequest: { ...q, status: "cancelled" } })) { saveFailures.add(q.id); setError("报告进度没能保存，请稍后重试。"); }
            else changed = true;
            continue;
          }
          const unknown = navigator.onLine === false || q.outcome === "unknown";
          const changes = { reportRequest: { ...q, status: unknown ? "unknown" : "resolved", resolvedAt: new Date().toISOString() }, reportCheckedAt: new Date().toISOString() };
          if (!unknown && r.reportStatus === q.baseStatus) changes.reportStatus = q.outcome;
          if (!write(key, changes)) { saveFailures.add(q.id); setError("报告进度没能保存，请重试保存。原记录没有改变。"); continue; }
          changed = true;
          track("studio_report_status_refreshed", { event_id: key, booking_id: r.bookingId, request_id: q.id, status: unknown ? "unknown" : q.outcome, simulated: true });
        }
      });
      settling = false;
      if ((changed || currentError()) && ["STU-12", "STU-15", "STU-08"].includes(state.current)) render();
    }
    function navigate(target) {
      if (!sync()) { render(); return; }
      const s = summary();
      if (target === "STU-05" && (s.kind !== "generated" || !canReport(record()))) { render(); return; }
      if (!["STU-08", "STU-18"].includes(target) && s.kind === "blocked") { render(); return; }
      go(target);
    }
    function handle(action) {
      if (action.startsWith("stur-review:")) { if (state.current === "STU-12" && outcomes.includes(action.slice(12))) { outcome = action.slice(12); render(); } return true; }
      if (action === "stur-save-retry") { if (state.current === "STU-12") { saveFailures.delete(record()?.reportRequest?.id); error = ""; settle(); render(); } return true; }
      if (["studio-report-refresh", "studio-report-retry"].includes(action)) { query(); return true; }
      if (!action.startsWith("stur-")) return false;
      if (!routes.includes(state.current)) return true;
      const targets = { "stur-home": "STU-08", "stur-record": "STU-15", "stur-booking": "STU-18", "stur-open": "STU-05", "stur-continue": "STU-04", "stur-benefits": "STU-13", "stur-help": "HELP-03" };
      if (targets[action]) navigate(targets[action]);
      return true;
    }
    function prepare() { return !routes.includes(state.current) || sync(); }
    function refresh() {
      if (document.hidden || busy || !routes.includes(state.current)) return;
      const previous = JSON.stringify([record(), state.signedIn, state.authVerified, account(), state.accountDeletionStatus]);
      if (!sync()) return;
      const changed = previous !== JSON.stringify([record(), state.signedIn, state.authVerified, account(), state.accountDeletionStatus]);
      const next = JSON.stringify([summary(), record()?.reportCheckedAt, currentError(), busy, navigator.onLine]);
      if (changed || state.current === "STU-12" && next !== lastView) render();
    }
    function reviewControls(item) { return item.id === "STU-12" ? `<section class="review-controls"><h3>报告查询 · 本地验收</h3><small>0.9 秒是演示延迟，不是报告生成时限。仅匹配本场的既有合格回执可演示正向报告；无 SDK 或真实健康结果。</small><div class="review-control-group">${outcomes.map(value => button(({ generated: "已准备好", waiting: "仍在整理", failed: "整理失败", unknown: "查询无结果" })[value], `stur-review:${value}`, outcome === value ? "primary" : "secondary")).join("")}</div></section>` : ""; }
    setInterval(() => { settle(); refresh(); }, 500);
    window.addEventListener("online", refresh); window.addEventListener("offline", refresh);
    window.addEventListener("storage", refresh);
    return { page, handle, prepare, refresh, reviewControls, summary, canReport };
  };
})();
