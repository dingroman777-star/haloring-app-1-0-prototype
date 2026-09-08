/* CHN-11: local query simulation. Querying never decides an application result. */
(() => {
  window.HALO_CHANNEL_PROGRESS = {
    create({ state, persist, synchronize, next, restart, actions, feedback, escape: e }) {
      let context = {}, timer = null, error = "", lastPage = "", lastId = "", formScope = null;
      const session = () => context.applicationContext?.() || {};
      const id = () => typeof state.applicationSnapshot?.id === "string" ? state.applicationSnapshot.id : "";
      const unknown = () => ({ stage: "unknown", title: "申请状态待核对", detail: "已保存的资料仍然保留，请联系客服核对当前进度。", label: "联系客服核对", route: "HELP-03" });
      function current() {
        const result = next(), status = state.applicationStatus, identity = state.channelIdentity;
        if (state.applicationSnapshot && !id()) return unknown();
        if (!id() && (!["none", "draft", undefined, null].includes(status) || !["inactive", undefined, null].includes(identity))) return unknown();
        if (id() && state.trainingApplicationId && state.trainingApplicationId !== id()) return unknown();
        const pairs = { reviewing: "application", "needs-info": "needs-info", rejected: "rejected", withdrawn: "inactive" };
        if (id() && !["active", "paused", "terminated", "activation-pending"].includes(identity)) {
          if (pairs[status] && identity !== pairs[status]) return unknown();
          if (status === "approved" && identity !== "approved") return unknown();
          if (identity === "approved" && status !== "approved") return unknown();
        }
        return result;
      }
      const reviewing = () => Boolean(id() && current().stage === "reviewing");
      const canWithdraw = () => Boolean(id() && ["training", "assessment", "reviewing", "needs-info"].includes(current().stage) && ["training", "reviewing", "needs-info"].includes(state.applicationStatus) && state.channelIdentity === (state.applicationStatus === "needs-info" ? "needs-info" : "application") && !state.applicationSnapshot?.reviewDecision && !state.applicationSnapshot?.withdrawal && state.activationReady !== true);
      const query = () => state.applicationReviewQuery;
      const relevantQuery = () => query()?.applicationId === id() && query()?.sessionKey === session().key ? query() : null;
      const busy = () => relevantQuery()?.status === "pending";
      function wrap(body) {
        const form = ["CHN-12", "CHN-14"].includes(session().page);
        if (form && (!id() || formScope?.id !== id() || formScope?.session !== session().key)) return `${feedback("申请已变化", "请先返回核对当前申请，原记录没有被修改。", "plain")}${actions([["查看当前申请", "go:CHN-11", "primary"]])}`;
        return `<div data-application-progress="${e(form ? formScope.id : id())}" data-progress-session="${e(form ? formScope.session : session().key || "")}">${body}</div>`;
      }
      function matches(page) {
        const node = document.querySelector("[data-application-progress]");
        return session().signedIn && document.getElementById("screen")?.dataset.page === page && node?.dataset.applicationProgress === id() && node.dataset.progressSession === session().key;
      }
      function repaint() { if (session().signedIn && session().page === "CHN-11") context.render?.(); }
      function date(value) {
        if (!value) return "";
        if (typeof value !== "string") return "";
        if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) return value;
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? "" : parsed.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false });
      }
      function observe(ctx) {
        context = { ...context, ...ctx };
        if (lastId !== id()) { error = ""; lastId = id(); }
        if (lastPage !== session().page) { formScope = ["CHN-12", "CHN-14"].includes(session().page) ? { id: id(), session: session().key } : null; lastPage = session().page; }
        const request = query();
        if (request?.status !== "pending") return;
        if (!session().signedIn || request.sessionKey !== session().key || request.applicationId !== id() || !reviewing()) {
          clearTimeout(timer); timer = null;
          state.applicationReviewQuery = { ...request, status: "cancelled" }; persist(); return;
        }
        if (!timer) timer = setTimeout(() => finish(request.id), Math.max(0, Math.min(700, Number(request.readyAt) - Date.now() || 0)));
      }
      function finish(requestId) {
        timer = null; synchronize();
        const request = query();
        if (!request || request.id !== requestId || request.status !== "pending") return;
        if (!session().signedIn || request.sessionKey !== session().key || request.applicationId !== id() || !reviewing()) {
          state.applicationReviewQuery = { ...request, status: "cancelled" }; persist(); repaint(); return;
        }
        state.applicationReviewQuery = { ...request, status: navigator.onLine ? "completed" : "failed", error: navigator.onLine ? "" : "offline", ...(navigator.onLine ? { checkedAt: new Date().toISOString() } : {}) };
        if (!persist()) { state.applicationReviewQuery = { ...request, status: "failed", error: "storage" }; error = "查询记录暂未保存，原申请没有改变，请重试。"; }
        else error = "";
        repaint();
      }
      function render(item) {
        const status = current(), pending = busy(), request = relevantQuery();
        const inReview = reviewing();
        const title = inReview ? "申请正在审核" : status.title || "还没有申请记录";
        const detail = inReview ? "资料已提交，正在等待审核。你可以先离开，稍后回来查看。" : status.detail;
        const timeline = inReview ? `<ol class="application-review-steps" aria-label="申请进度"><li class="done"><span aria-hidden="true">✓</span>已提交</li><li class="current" aria-current="step"><span aria-hidden="true">2</span>审核中</li><li><span aria-hidden="true">3</span>审核结果</li></ol>` : "";
        const record = state.applicationSnapshot;
        const rows = id() ? [["申请编号", id()], ["资料提交", date(record.submittedAt)], ["提交审核", date(record.reviewSubmittedAt)], ["撤回时间", status.stage === "withdrawn" && record.withdrawal?.applicationId === id() ? date(record.withdrawal.withdrawnAt) : ""]].filter(([, value]) => value) : [];
        const facts = rows.length ? `<dl class="application-review-facts">${rows.map(([key, value]) => `<div><dt>${key}</dt><dd>${e(value)}</dd></div>`).join("")}</dl>` : "";
        const queryNote = pending ? "正在查询最新进度…" : error || (request?.status === "failed" ? request.error === "offline" ? "网络暂不可用，当前显示已保存的进度。联网后可重试。" : "查询记录暂未保存，请重试。" : request?.status === "completed" && inReview ? "仍在审核，暂时没有新结果。" : "");
        const lastCheck = request?.checkedAt ? `<small>上次查询：${e(date(request.checkedAt))}</small>` : "";
        const queryFeedback = queryNote || lastCheck ? `<div class="application-query-note" role="status"><p>${e(queryNote)}</p>${lastCheck}</div>` : "";
        const primary = inReview ? [pending ? "查询中…" : request?.status === "failed" || error ? "重试查询" : "刷新审核进度", "commercial:application-check", "primary", pending] : [status.stage === "withdrawn" ? "重新申请" : status.label || "开始申请", "commercial:application-progress-next", "primary"];
        const body = `<div class="application-review" aria-busy="${pending}"><section class="application-review-status"><span class="application-review-symbol" aria-hidden="true">${inReview ? "◷" : ["approved", "active"].includes(status.stage) ? "✓" : "○"}</span><h2>${e(title)}</h2><p>${e(detail || "完成身份核验并提交资料后，可在这里查看进度。")}</p></section>${timeline}${facts}${queryFeedback}${actions([primary, ...(id() ? [["查看已提交资料", "go:CHN-07", "secondary"]] : [])])}<div class="application-review-links"><button class="text-button" data-action="go:HELP-03">联系企业微信客服</button>${canWithdraw() ? '<button class="text-button" data-action="commercial:application-progress-withdraw">撤回申请</button>' : ""}</div></div>`;
        const historyRows = (state.applicationHistory || []).filter(row => row?.ownerAccount === session().accountRef && row.id);
        const historyList = historyRows.length ? `<details class="disclosure"><summary>历史申请（${historyRows.length}）</summary><div>${historyRows.slice().reverse().map(row => `<button class="setting-row" data-action="commercial:history-open:${e(row.id)}"><span><strong>${e(row.id)}</strong><small>${({ withdrawn: "已撤回", rejected: "未通过", approved: "已通过" })[row.status] || "已归档"} · ${e(date(row.submittedAt))}</small></span><span aria-hidden="true">›</span></button>`).join("")}</div></details>` : "";
        return `<header class="screen-head commercial-head"><div><button class="back" data-action="go:CHN-01" aria-label="返回体验顾问入口">← 返回</button><span class="page-context">体验顾问</span><h1>申请进度</h1></div></header><div class="stack commercial-stack">${wrap(body)}${historyList}</div>`;
      }
      function handleAction(command, ctx) {
        if (!["application-check", "application-progress-next", "application-progress-withdraw"].includes(command)) return false;
        context = { ...context, ...ctx };
        if (synchronize()) { context.render(); context.flash("申请进度已更新，请按当前状态继续"); return true; }
        const page = "CHN-11";
        if (!matches(page)) { context.render(); context.flash("请从当前申请页面继续"); return true; }
        if (command === "application-progress-next") {
          const target = current();
          if (target.stage === "withdrawn") restart(context);
          else context.go(target.route === "CHN-11" ? "HELP-03" : target.route);
          return true;
        }
        if (command === "application-progress-withdraw") { if (canWithdraw()) context.go("CHN-14"); else context.render(); return true; }
        if (!reviewing()) { context.render(); context.flash("请按当前申请状态继续"); return true; }
        if (busy()) return true;
        const previous = query(), now = Date.now();
        state.applicationReviewQuery = { id: `AQ-${now}-${Math.random().toString(36).slice(2, 7)}`, applicationId: id(), sessionKey: session().key, status: "pending", startedAt: new Date(now).toISOString(), readyAt: now + 700, checkedAt: relevantQuery()?.checkedAt || "" };
        if (!persist()) { state.applicationReviewQuery = previous; error = "查询未开始，原申请没有改变，请重试。"; context.render(); return true; }
        error = ""; context.render(); return true;
      }
      return { observe, render, wrap, handleAction, current };
    }
  };
})();
