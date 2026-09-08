/* CHN-13: application result, contact guidance and scoped restart confirmation. */
(() => {
  window.HALO_CHANNEL_REJECTION = {
    create({ state, synchronize, current, restart, copy, actions, feedback, escape: e }) {
      let context = {}, pageScope = "", lastPage = "", confirmation = "", error = "", restarting = false;
      const session = () => context.applicationContext?.() || {};
      const id = () => typeof state.applicationSnapshot?.id === "string" ? state.applicationSnapshot.id.trim() : "";
      const decision = () => state.applicationSnapshot?.reviewDecision;
      const stamp = () => JSON.stringify([id(), session().accountRef, session().key, state.applicationStatus, state.channelIdentity, decision(), state.completedCourses, state.assessmentAnswers, state.assessmentPassed]);
      const validDecision = () => !decision() || Boolean(typeof decision().id === "string" && decision().id.trim() && decision().applicationId === id() && decision().status === "rejected");
      const allowed = () => session().signedIn && id() && current().stage === "rejected" && validDecision();
      const canRestart = () => allowed() && decision()?.canReapply !== false;
      const matches = () => allowed() && session().page === "CHN-13" && pageScope === stamp() && document.querySelector("[data-rejection-scope]")?.dataset.rejectionScope === stamp();
      const time = value => typeof value === "string" && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false }) : "";
      function observe(ctx) {
        context = { ...context, ...ctx };
        if (lastPage !== session().page) { pageScope = session().page === "CHN-13" ? stamp() : ""; lastPage = session().page; confirmation = ""; error = ""; }
        if (confirmation && confirmation !== stamp()) { confirmation = ""; error = "申请结果已更新，请重新核对后再继续。"; }
      }
      function repaint(focus) {
        if (session().page !== "CHN-13") return;
        context.render?.();
        if (focus) document.querySelector(focus)?.focus();
      }
      function render() {
        const head = '<header class="screen-head commercial-head"><div><button class="back" data-action="go:CHN-11" aria-label="返回申请进度">← 返回</button><span class="page-context">体验顾问</span><h1>申请审核结果</h1></div></header>';
        if (!allowed() || pageScope !== stamp()) {
          const inconsistent = current().stage === "rejected" && id();
          return `${head}<div class="stack commercial-stack">${feedback(inconsistent ? "审核信息待核对" : "请查看当前申请进度", inconsistent ? "这条结果暂时无法与当前申请对应，原记录仍保留。" : "当前不是申请未通过状态，请从进度页继续。", "plain")}${actions([[inconsistent ? "联系客服核对" : "查看申请进度", inconsistent ? "go:HELP-03" : "go:CHN-11", "primary"], ["返回申请进度", "go:CHN-11", "secondary"]])}</div>`;
        }
        const known = decision()?.reasonCode === "region-unavailable", decidedAt = time(decision()?.decidedAt);
        const reason = known ? "所选服务地区暂未开放" : "暂未提供具体原因";
        const guidance = known ? "可以联系客服了解该地区的申请安排，再决定下一步。" : "请联系客服核对本次审核说明，无需先重复提交申请。";
        const confirm = confirmation === stamp();
        const controls = confirm ? `<section class="rejection-confirm" tabindex="-1" aria-labelledby="rejection-confirm-title"><h2 id="rejection-confirm-title">重新开始申请？</h2><ul><li>本次已提交资料、审核结果与学习记录会保留。</li><li>新申请从身份确认开始，学习与测评需重新完成。</li><li>现在只开始填写，不会立即提交审核。</li></ul>${error ? `<p class="rejection-error" role="alert">${e(error)}</p>` : ""}${actions([["开始新申请", "commercial:rejection-restart-confirm", "primary"], ["暂不重新申请", "commercial:rejection-restart-cancel", "secondary"]])}</section>` : `${error ? `<p class="rejection-error" role="status">${e(error)}</p>` : ""}${actions([[known ? "联系客服咨询复核" : "联系客服了解原因", "commercial:rejection-contact", "primary"], ["查看本次申请", "commercial:rejection-details", "secondary"]])}<p class="rejection-contact-note">打开客服说明不会自动发起复核。</p>${canRestart() ? '<button class="text-button rejection-restart-link" data-action="commercial:rejection-restart">重新申请</button>' : '<p class="rejection-contact-note">当前不能重新申请，请联系客服确认后续处理。</p>'}`;
        return `${head}<div class="stack commercial-stack"><div class="rejection-page" data-rejection-scope="${e(stamp())}"><section class="rejection-result"><span aria-hidden="true">—</span><h2>本次申请未通过</h2><p>申请资料已保留，可以先了解原因，再决定下一步。</p></section><section class="rejection-reason"><small>审核说明</small><h3>${reason}</h3><p>${guidance}</p></section><dl class="rejection-facts"><div><dt>申请编号</dt><dd>${e(id())}<button class="text-button" data-action="commercial:rejection-copy" aria-label="复制申请编号">复制</button></dd></div>${decidedAt ? `<div><dt>审核时间</dt><dd>${e(decidedAt)}</dd></div>` : ""}</dl>${controls}</div></div>`;
      }
      function handleAction(command, ctx) {
        if (command === "application-new" && (restarting || session().page !== "CHN-13")) return false;
        if (!command.startsWith("rejection-") && !["application-appeal", "application-new"].includes(command)) return false;
        context = { ...context, ...ctx };
        if (synchronize()) { confirmation = ""; error = "申请结果已更新，请重新核对后再继续。"; repaint(); return true; }
        if (!matches()) { confirmation = ""; repaint(); context.flash?.("请从当前申请结果继续"); return true; }
        if (command === "rejection-copy") {
          const original = stamp();
          copy(id(), "申请编号已复制", { ...context, flash: message => { if (matches() && stamp() === original) context.flash?.(message); } }); return true;
        }
        if (command === "application-appeal" || command === "rejection-contact" || command === "rejection-details") {
          confirmation = ""; context.go(command === "rejection-details" ? "CHN-07" : "HELP-03"); return true;
        }
        if (command === "rejection-restart-cancel") { confirmation = ""; error = ""; repaint(".rejection-restart-link"); return true; }
        if (!canRestart()) { confirmation = ""; repaint(); return true; }
        if (command === "rejection-restart" || command === "application-new") { confirmation = stamp(); error = ""; repaint(".rejection-confirm"); return true; }
        if (command === "rejection-restart-confirm") {
          if (confirmation !== stamp()) { error = "请先查看重新申请说明，再确认继续。"; repaint(); return true; }
          const previousId = id();
          restarting = true;
          try { restart({ ...context, flash: message => { error = message; } }); } finally { restarting = false; }
          if (id() === previousId) repaint(".rejection-confirm");
          else { confirmation = ""; error = ""; }
          return true;
        }
        return true;
      }
      document.addEventListener("click", event => {
        if (event.detail > 1 && ["commercial:rejection-restart", "commercial:rejection-restart-confirm"].includes(event.target.closest?.("[data-action]")?.dataset.action)) { event.preventDefault(); event.stopImmediatePropagation(); }
      }, true);
      function reviewChanged() { pageScope = stamp(); confirmation = ""; error = ""; }
      return { observe, render, handleAction, reviewChanged };
    }
  };
})();
