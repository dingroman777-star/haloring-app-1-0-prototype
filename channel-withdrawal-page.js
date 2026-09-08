/* CHN-14 is the confirmation itself. A local commit never implies a server receipt. */
(() => {
  window.HALO_CHANNEL_WITHDRAWAL = {
    create({ state, persist, synchronize, current, actions, feedback, escape: e }) {
      let context = {}, lastPage = "", pageScope = "", error = "";
      const session = () => context.applicationContext?.() || {};
      const id = () => typeof state.applicationSnapshot?.id === "string" ? state.applicationSnapshot.id.trim() : "";
      const stamp = () => JSON.stringify([session().accountRef, session().key, state.applicationSnapshot, state.applicationStatus, state.channelIdentity, state.trainingApplicationId, state.completedCourses, state.assessmentAnswers, state.assessmentPassed]);
      const receipt = () => state.applicationSnapshot?.withdrawal;
      const time = value => typeof value === "string" && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false }) : "";
      const coherent = () => Boolean(session().signedIn && id() && !state.applicationSnapshot?.reviewDecision && state.activationReady !== true);
      const available = () => coherent() && !receipt() && ["training", "assessment", "reviewing", "needs-info"].includes(current().stage) && ["training", "reviewing", "needs-info"].includes(state.applicationStatus) && state.channelIdentity === (state.applicationStatus === "needs-info" ? "needs-info" : "application");
      const complete = () => coherent() && current().stage === "withdrawn" && state.applicationStatus === "withdrawn" && state.channelIdentity === "inactive" && (!receipt() || Boolean(receipt().id && receipt().applicationId === id() && time(receipt().withdrawnAt)));
      const matches = () => session().page === "CHN-14" && pageScope === stamp() && document.querySelector("[data-withdrawal-scope]")?.dataset.withdrawalScope === stamp();
      function observe(ctx) {
        context = { ...context, ...ctx };
        if (lastPage !== session().page) { pageScope = session().page === "CHN-14" ? stamp() : ""; lastPage = session().page; error = ""; }
      }
      function repaint(focus) {
        if (session().page !== "CHN-14") return;
        context.render?.();
        if (focus) document.querySelector(focus)?.focus();
      }
      function render() {
        const head = '<header class="screen-head commercial-head"><div><button class="back" data-action="go:CHN-11" aria-label="返回申请进度">← 返回</button><span class="page-context">体验顾问</span><h1>撤回申请</h1></div></header>';
        if (pageScope !== stamp() || (!available() && !complete())) {
          const changed = pageScope !== stamp(), conflict = current().stage === "unknown" || Boolean(state.applicationSnapshot?.reviewDecision);
          return `${head}<div class="stack commercial-stack">${feedback(changed ? "申请已变化" : conflict ? "申请状态待核对" : "当前申请不能撤回", changed ? "请先查看最新进度，再决定下一步。原记录没有被修改。" : "请从申请进度继续，已保存的资料仍然保留。", "plain")}${actions([["查看申请进度", "go:CHN-11", "primary"], ...(conflict ? [["联系客服核对", "go:HELP-03", "secondary"]] : [])])}</div>`;
        }
        const done = complete(), stage = current().stage;
        const status = done ? "已撤回" : ({ training: "待完成学习", assessment: state.assessmentPassed ? "待提交审核" : "待完成测评", reviewing: "审核中", "needs-info": "待补充资料" })[stage];
        const facts = `<dl class="withdrawal-facts"><div><dt>申请编号</dt><dd>${e(id())}</dd></div><div><dt>当前进度</dt><dd>${e(status)}</dd></div>${done && receipt() ? `<div><dt>撤回时间</dt><dd>${e(time(receipt().withdrawnAt))}<small>北京时间</small></dd></div>` : ""}</dl>`;
        const impact = done ? "本次申请已结束，原资料和学习记录仍然保留。" : stage === "reviewing" ? "撤回后，本次审核会停止。" : stage === "needs-info" ? "撤回后，本次申请会结束，无需再补充资料。" : "撤回后，本次申请会结束，不会提交审核。";
        const notes = done ? '<p class="withdrawal-footnote">需要再次申请时，可从申请进度重新开始。</p>' : '<section class="withdrawal-retained"><span aria-hidden="true">✓</span><div><h3>这些会保留</h3><p>已提交资料、审核及学习记录。<br>会员身份、积分和健康功能不受影响。</p></div></section><p class="withdrawal-footnote">撤回后不能继续本次申请。重新申请需再次完成身份确认、学习与测评。</p>';
        const controls = done ? actions([["查看申请进度", "commercial:withdrawal-progress", "primary"], ["查看本次资料", "commercial:withdrawal-details", "secondary"]]) : `${error ? `<p class="withdrawal-error" role="alert" tabindex="-1">${e(error)}</p>` : ""}${actions([["暂不撤回", "commercial:withdrawal-cancel", "primary"], [error ? "重试撤回" : "确认撤回", "commercial:application-withdraw", "secondary withdrawal-danger"]])}<button class="text-button withdrawal-details" data-action="commercial:withdrawal-details">先查看本次资料</button>`;
        return `${head}<div class="stack commercial-stack"><div class="withdrawal-page" data-withdrawal-scope="${e(stamp())}"><section class="withdrawal-summary ${done ? "is-complete" : ""}" ${done ? 'role="status" tabindex="-1"' : ""}><span aria-hidden="true">${done ? "✓" : "↶"}</span><h2>${done ? "本次申请已撤回" : "确定撤回这次申请？"}</h2><p>${impact}</p></section>${facts}${notes}${controls}</div></div>`;
      }
      function handleAction(command, ctx) {
        if (command !== "application-withdraw" && !command.startsWith("withdrawal-")) return false;
        context = { ...context, ...ctx };
        if (synchronize() || !matches()) { error = ""; repaint(); context.flash?.("申请已变化，请从当前进度继续"); return true; }
        if (command === "withdrawal-cancel" || command === "withdrawal-progress") { error = ""; context.go("CHN-11"); return true; }
        if (!available() && !complete()) { repaint(); return true; }
        if (command === "withdrawal-details") { error = ""; context.go("CHN-07"); return true; }
        if (command !== "application-withdraw" || complete()) { repaint(); return true; }
        if (!navigator.onLine) { error = "网络暂不可用，尚未撤回。原申请仍保留，联网后可重试。"; repaint(".withdrawal-error"); return true; }
        const previous = { applicationSnapshot: state.applicationSnapshot, applicationStatus: state.applicationStatus, channelIdentity: state.channelIdentity };
        const now = new Date().toISOString();
        state.applicationSnapshot = { ...state.applicationSnapshot, withdrawal: { id: `AW-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, applicationId: id(), previousStatus: state.applicationStatus, withdrawnAt: now, simulated: true } };
        state.applicationStatus = "withdrawn"; state.channelIdentity = "inactive";
        if (!persist()) { Object.assign(state, previous); error = "撤回未完成，原申请没有改变。请重试，也可以先返回申请进度。"; repaint(".withdrawal-error"); return true; }
        pageScope = stamp(); error = ""; repaint(".withdrawal-summary"); return true;
      }
      document.addEventListener("click", event => {
        if (event.detail > 1 && event.target.closest?.("[data-action]")?.dataset.action === "commercial:application-withdraw") { event.preventDefault(); event.stopImmediatePropagation(); }
      }, true);
      return { observe, render, handleAction };
    }
  };
})();
