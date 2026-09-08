(() => {
  "use strict";
  window.createHaloStudioHistory = function ({ state, events, status, read, select, go, render, esc, icon }) {
    const filters = ["全部", "待参加", "已完成", "取消与退款"];
    const account = p => String(p.authPhone || p.authForm?.phone || "local-demo");
    let fresh = true, filter = "全部", feedback = "", shown = new Map(), last = "", filterAccount = "";
    function prepare() {
      if (state.current !== "STU-07") return true;
      const p = read()?.progress;
      fresh = Boolean(p && p.studioRecords && typeof p.studioRecords === "object" && !Array.isArray(p.studioRecords)
        && p.signedIn && p.authVerified && p.accountDeletionStatus !== "submitted" && account(p) === account(state));
      if (fresh) state.studioRecords = { ...p.studioRecords };
      if (filterAccount !== account(state)) {
        filterAccount = account(state); filter = "全部";
        try { const saved = sessionStorage.getItem(`haloStudioHistoryFilter:${filterAccount}`); if (filters.includes(saved)) filter = saved; } catch {}
      }
      return fresh;
    }
    function owned(id, r) {
      return r && typeof r === "object" && !Array.isArray(r)
        && (!r.accountRef || r.accountRef === account(state)) && (!r.sessionAccountRef || r.sessionAccountRef === account(state))
        && (!r.eventId || r.eventId === id) && (!r.eventSnapshot?.id || r.eventSnapshot.id === id)
        && (!r.eventSnapshot?.eventId || r.eventSnapshot.eventId === id)
        && (!r.sessionScope || r.sessionScope.eventId === id && r.sessionScope.bookingId === r.bookingId);
    }
    const scope = (id, r) => JSON.stringify([account(state), id, r.bookingId, r.sessionId]);
    function entries() {
      if (!fresh) return [];
      return Object.entries(state.studioRecords).filter(([id, r]) => owned(id, r)
        && (r.booked || r.bookingId || r.sessionStarted || r.sessionDone || r.bookingRequest))
        .map(([id, r]) => {
          const e = r.eventSnapshot || events[id] || { title: "历史活动" };
          const cancelled = ["submitted", "refunded", "cancelled"].includes(r.refundStatus) || ["submitting", "unknown"].includes(r.refundRequest?.status);
          const s = status(id, r);
          if (r.refundStatus === "refunded") s.cta = "查看退款";
          if (r.deletionStatus && r.deletionStatus !== "ready") { s.label = "个人记录已删除"; s.cta = "查看预约记录"; s.route = r.booked && events[id] ? "STU-18" : ""; }
          return { id, r, e, s, group: cancelled ? "取消与退款" : r.sessionDone ? "已完成" : "待参加" };
        }).sort((a, b) => (Date.parse(b.e.startsAt || b.r.completedAt) || 0) - (Date.parse(a.e.startsAt || a.r.completedAt) || 0));
    }
    function card(entry) {
      const { id, r, e, s } = entry, removed = r.deletionStatus && r.deletionStatus !== "ready";
      const detail = r.sessionDone && !removed && !["cancelled", "refunded", "submitted"].includes(r.refundStatus) && events[id];
      const source = r.source === "app" ? "App 预约" : r.source === "institution" ? "机构预约" : "";
      return `<article class="studio-history-card"><div class="studio-history-card-top"><span class="studio-history-status">${esc(s.label)}</span><small>${esc(source)}</small></div><h2>${esc(e.title || "历史活动")}</h2><p>${icon("calendar")}${esc(e.date || "活动时间待核对")}</p>${e.place ? `<p>${icon("pin")}${esc(e.place)}</p>` : ""}<div class="studio-history-actions"><button class="primary" data-action="stuh-open:${esc(id)}">${esc(s.route ? s.cta : "联系 Halo 客服")}${icon("arrow")}</button>${detail ? `<button class="secondary" data-action="stuh-detail:${esc(id)}">记录与奖励</button>` : ""}</div></article>`;
    }
    function page() {
      const all = entries(), list = all.filter(e => filter === "全部" || e.group === filter);
      shown = new Map(list.map(e => [e.id, scope(e.id, e.r)])); last = JSON.stringify([fresh, state.studioRecords]);
      return `<article class="studio-history studio-detail"><div class="studio-detail-scroll" tabindex="0" aria-label="体验记录"><header class="studio-detail-header"><button data-action="stuh-back" aria-label="返回 Halo Studio">${icon("back")}</button><h1>最近体验</h1><button data-action="stuh-reload" aria-label="重新读取体验记录">刷新</button></header>
        ${fresh ? `<div class="studio-history-heading"><span>我的预约与记录</span><strong>${all.length}<small> 条</small></strong></div><div class="studio-history-filters" role="group" aria-label="筛选体验状态">${filters.map(f => `<button data-action="stuh-filter:${f}" aria-pressed="${filter === f}">${f}</button>`).join("")}</div><p class="studio-history-count" role="status">${filter} · ${list.length} 条</p><div class="studio-history-list">${list.length ? list.map(card).join("") : `<section class="studio-history-empty">${icon("calendar")}<h2>${all.length ? "这个分类下还没有记录" : "还没有体验记录"}</h2><p>${all.length ? "换个分类看看，其他记录仍然保留。" : "预约一场喜欢的活动，进度和记录都在这里。"}</p>${all.length ? '<button class="secondary" data-action="stuh-filter:全部">查看全部记录</button>' : ""}</section>`}</div>`
          : `<section class="studio-history-empty">${icon("report")}<h2>暂时读不到体验记录</h2><p>记录未被删除。请重新读取，或联系 Halo 客服核对。</p><button class="secondary" data-action="stuh-reload">重新读取</button><button class="secondary" data-action="stuh-help">联系 Halo 客服</button></section>`}
        </div><footer class="studio-detail-footer"><p class="studio-history-feedback" role="status">${esc(feedback)}</p><button class="primary" data-action="stuh-back">看看可预约活动</button></footer></article>`;
    }
    function handle(action) {
      if (!action.startsWith("stuh-")) return false;
      if (state.current !== "STU-07") return true;
      if (action === "stuh-back") { prepare(); go("STU-08"); return true; }
      if (action === "stuh-help") { go("HELP-03"); return true; }
      if (action === "stuh-reload") { prepare(); feedback = fresh ? "已读取本机最新记录。" : "读取未完成，请稍后重试。"; render(); return true; }
      if (action.startsWith("stuh-filter:")) { const next = action.slice(12); if (filters.includes(next)) { filter = next; feedback = ""; try { sessionStorage.setItem(`haloStudioHistoryFilter:${filterAccount}`, filter); } catch {} render(); } return true; }
      const detail = action.startsWith("stuh-detail:"), id = action.slice(detail ? 12 : 10), before = shown.get(id);
      prepare(); const entry = entries().find(e => e.id === id);
      if (!before || !entry || before !== scope(id, entry.r)) { feedback = "记录有更新，请核对后重新打开。"; render(); return true; }
      if (!entry.s.route) { go("HELP-03"); return true; }
      if (detail && (!entry.r.sessionDone || entry.r.deletionStatus && entry.r.deletionStatus !== "ready" || entry.group === "取消与退款")) { feedback = "记录状态有更新，请查看当前进度。"; render(); return true; }
      select(id); go(detail ? "STU-15" : entry.s.route); return true;
    }
    function refresh() {
      if (document.hidden || state.current !== "STU-07") return;
      prepare(); if (last !== JSON.stringify([fresh, state.studioRecords])) { feedback = fresh ? "记录已更新。" : ""; render(); }
    }
    window.addEventListener("storage", refresh); document.addEventListener("visibilitychange", refresh); setInterval(refresh, 900);
    return { prepare, page, handle, blocksPersist: () => state.current === "STU-07" || !fresh };
  };
})();
