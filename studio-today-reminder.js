(() => {
  "use strict";
  window.createHaloStudioTodayReminder = function ({ state, report, nextDay, read, select, go, render, esc, icon, screen, modalRoot, closeModal, flash }) {
    const SEEN_KEY = "haloStudioTodaySeenV1", ENTRY_KEY = "haloStudioTodayEntryV1", DAY = 86400000;
    const routes = ["TOD-01", "STU-06", "STU-12", "STU-15"];
    const account = value => String(value.authPhone || value.authForm?.phone || "local-demo");
    const nonempty = value => typeof value === "string" && Boolean(value.trim());
    const day = time => new Date(time + 8 * 3600000).toISOString().slice(0, 10);
    const scope = (r, id) => JSON.stringify([account(state), id, r.bookingId, r.sessionId || "", r.completedAt]);
    let fresh = true, attempted = false, mismatch = false, rendered = new Map(), lastKey = "", entry = null, seenFailure = false;
    try { entry = JSON.parse(sessionStorage.getItem(ENTRY_KEY)); } catch { /* Return context is optional, never health data. */ }

    function prepare() {
      if (state.current !== "TOD-01" && !entry) return true;
      attempted = true;
      const result = read(), source = result?.progress;
      fresh = Boolean(result?.ok && source?.studioRecords && typeof source.studioRecords === "object" && !Array.isArray(source.studioRecords));
      mismatch = fresh && (account(source) !== account(state) || source.signedIn !== state.signedIn || source.authVerified !== state.authVerified || source.accountDeletionStatus === "submitted");
      if (!fresh || mismatch) return false;
      state.studioRecords = { ...source.studioRecords };
      return true;
    }
    function seen(key) {
      try { const saved = JSON.parse(localStorage.getItem(`${SEEN_KEY}:${encodeURIComponent(key)}`)); return saved?.version === 1 ? saved.contentVersion : null; }
      catch { return null; }
    }
    function items() {
      if (!fresh || mismatch || !state.signedIn || !state.authVerified || state.accountDeletionStatus === "submitted") return [];
      const now = Date.now(), today = day(now);
      return Object.entries(state.studioRecords || {}).flatMap(([id, r]) => {
        const completed = nonempty(r?.completedAt) && /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(r.completedAt) ? Date.parse(r.completedAt) : NaN;
        if (!Number.isFinite(completed) || completed < 0 || completed > now || day(completed + DAY) !== today
          || !r.sessionDone || !r.booked || !nonempty(r.bookingId) || !r.paid || r.refundStatus !== "none"
          || r.deletionStatus !== "ready" || !r.activityConsent || r.recordingStoppedAt
          || ["submitting", "accepted", "checking", "unknown"].includes(r.refundRequest?.status)) return [];
        const summary = report.summary(r, id);
        if (["blocked", "deleted", "unfinished", "withdrawn"].includes(summary.kind)) return [];
        const canView = report.canReport(r, id) && r.reportStatus === "generated";
        const review = canView ? nextDay.model(r, id) : null;
        if (review && ["invalid", "waiting"].includes(review.kind)) return [];
        const target = r.mode === "basic" ? "STU-15" : canView ? "STU-06" : "STU-12";
        const ready = review?.kind === "ready";
        const label = r.mode === "basic" ? "昨天的参与记录" : ready ? "次日回顾可查看" : "查看回顾进度";
        const detail = r.mode === "basic" ? "参与记录已保存" : ready ? "睡眠与身体状态已有记录" : review?.kind === "insufficient" ? "身体记录暂不完整" : ["unmatched"].includes(review?.kind) || summary.kind === "review" ? "本次记录待核对" : "身体记录尚未齐全";
        const key = scope(r, id), version = JSON.stringify([target, review?.kind || summary.kind, r.reportStatus, r.nextDayReport?.sourceId || "", r.nextDayReport?.generatedAt || ""]);
        return [{ id, scope: key, version, target, label, detail, ready, title: r.eventSnapshot?.title || "Studio 体验", completed, unread: seen(key) !== version }];
      }).sort((a, b) => Number(b.unread) - Number(a.unread) || Number(b.ready) - Number(a.ready) || b.completed - a.completed || a.id.localeCompare(b.id));
    }
    function page() {
      const list = items(), count = list.filter(item => item.unread).length;
      rendered = new Map(list.map(item => [item.id, item])); lastKey = fingerprint(list);
      if (!list.length) return "";
      const first = list[0], title = list.length === 1 ? first.label : `昨天的 ${list.length} 场 Studio 体验`;
      const detail = list.length === 1 ? `${first.title} · ${first.detail}` : count ? `${count} 条待查看，按场次回顾` : "记录已查看，随时可以再回看";
      return `<section class="today-studio-reminder" aria-label="Studio 次日提醒" data-studio-unread="${count}"><button type="button" data-action="sturem-open"><span class="today-studio-reminder-icon">${icon("calendar")}</span><span class="today-studio-reminder-copy"><span class="today-studio-reminder-meta">Halo Studio${count ? `<span class="today-studio-unread">${list.length === 1 ? "新" : `${count} 条新提醒`}</span>` : '<span class="today-studio-read">已查看</span>'}</span><strong>${esc(title)}</strong><small>${esc(detail)}</small></span>${icon("arrow")}</button>${seenFailure ? '<p role="status">查看状态暂未保存，可稍后重试。</p>' : ""}</section>`;
    }
    function serviceLabel() {
      const list = items(), count = list.filter(item => item.unread).length;
      return count ? `${count} 条新回顾提醒` : list.length ? "昨天的体验已查看" : "预约体验";
    }
    function choose() {
      const list = items(); rendered = new Map(list.map(item => [item.id, item]));
      modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal studio-reminder-picker" role="dialog" aria-modal="true" aria-labelledby="studio-reminder-title"><header><h2 id="studio-reminder-title">昨天的 Studio 体验</h2><button type="button" data-action="close-modal" aria-label="关闭体验列表">${icon("close")}</button></header><div>${list.map(item => `<button type="button" data-action="sturem-select:${encodeURIComponent(item.id)}"><span><strong>${esc(item.title)}</strong><span>${esc(item.label)}${item.unread ? " · 待查看" : " · 已查看"}</span><small>${esc(item.detail)}</small></span>${icon("arrow")}</button>`).join("")}</div></section></div>`;
    }
    function clearEntry() { entry = null; try { sessionStorage.removeItem(ENTRY_KEY); } catch {} }
    function open(item) {
      const before = rendered.get(item.id);
      if (!before || before.scope !== item.scope) { closeModal(); render(); flash("本次活动有更新，请重新选择。"); return; }
      select(item.id);
      entry = { eventId: item.id, scope: item.scope, version: item.version, target: item.target, account: account(state) };
      try { sessionStorage.setItem(ENTRY_KEY, JSON.stringify(entry)); } catch { /* In-memory return still works. */ }
      closeModal(); go(item.target);
      // A route rejected by the existing guard is never marked as viewed.
      if (state.current !== item.target) clearEntry();
    }
    function contextMatches() {
      const r = state.studioRecords?.[entry?.eventId];
      return Boolean(entry && r && entry.account === account(state) && entry.eventId === state.selectedStudioEventId && entry.scope === scope(r, entry.eventId) && state.current === entry.target);
    }
    function afterRender() {
      if (!entry || !contextMatches() || !fresh || mismatch) return;
      const item = items().find(value => value.id === entry.eventId && value.target === state.current && value.scope === entry.scope && value.version === entry.version);
      if (!item || screen.dataset.page !== item.target) return;
      try { if (seen(item.scope) !== item.version) localStorage.setItem(`${SEEN_KEY}:${encodeURIComponent(item.scope)}`, JSON.stringify({ version: 1, contentVersion: item.version, viewedAt: new Date().toISOString() })); seenFailure = false; }
      catch { seenFailure = true; flash("已打开记录，但查看状态暂未保存。"); }
      const back = screen.querySelector('.studio-detail-header > button, [data-action="previous"]');
      if (back) { back.dataset.action = "sturem-back"; back.setAttribute("aria-label", "返回今日"); if (!back.querySelector("svg")) back.textContent = "返回今日"; }
      const footer = screen.querySelector('.studio-detail-footer > button');
      if (footer) { footer.dataset.action = "sturem-back"; footer.textContent = "返回今日"; }
    }
    function handle(action) {
      if (typeof action !== "string" || !action.startsWith("sturem-")) return false;
      if (action === "sturem-back") {
        if (!contextMatches()) return true;
        clearEntry(); go("TOD-01"); return true;
      }
      if (state.current !== "TOD-01") return true;
      if (!prepare()) { closeModal(); render(); flash("提醒暂时无法读取，请稍后再试。"); return true; }
      const list = items();
      if (!list.length) { closeModal(); render(); flash("本次提醒已更新。"); return true; }
      if (action === "sturem-open") { if (list.length > 1) choose(); else open(list[0]); }
      else if (action.startsWith("sturem-select:")) {
        let id; try { id = decodeURIComponent(action.slice(14)); } catch { return true; }
        const item = list.find(value => value.id === id);
        if (item) open(item); else { closeModal(); render(); flash("这场活动的提醒已更新。"); }
      }
      return true;
    }
    function fingerprint(list = items()) { return JSON.stringify([fresh, mismatch, day(Date.now()), list.map(item => [item.scope, item.version, item.unread, item.title])]); }
    function refresh() {
      if (document.hidden || state.current !== "TOD-01") return;
      prepare(); const next = fingerprint();
      if (next !== lastKey) { if (modalRoot.querySelector(".studio-reminder-picker")) closeModal(); render(); }
    }
    function enter(target, from) { if (entry && target !== entry.target && !(from === "TOD-01" && target === entry.target)) clearEntry(); }
    setInterval(refresh, 1000);
    window.addEventListener("storage", refresh); document.addEventListener("visibilitychange", refresh);
    return { prepare, page, serviceLabel, handle, afterRender, enter, items, blocksPersist: () => state.current === "TOD-01" && attempted && (!fresh || mismatch) };
  };
})();
