/* CHN-15 is a read-only result, not consent, account verification or activation. */
(() => {
  window.HALO_CHANNEL_APPROVAL = {
    create({ state, synchronize, current, copy, actions, feedback, escape: e }) {
      let context = {}, lastPage = "", pageScope = "";
      const session = () => context.applicationContext?.() || {};
      const id = () => typeof state.applicationSnapshot?.id === "string" ? state.applicationSnapshot.id.trim() : "";
      const scope = () => JSON.stringify([session().signedIn, session().accountRef, session().key, id()]);
      const stamp = () => JSON.stringify([scope(), state.applicationSnapshot, state.applicationStatus, state.channelIdentity, state.trainingApplicationId, state.activationReady, state.channelAgreementConfirmed, state.activationRequest]);
      const decision = () => state.applicationSnapshot?.reviewDecision;
      const validDecision = () => !decision() || Boolean(typeof decision().id === "string" && decision().id.trim() && decision().applicationId === id() && decision().status === "approved");
      const time = value => typeof value === "string" && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false }) : "";
      function valid() {
        const request = state.activationRequest;
        return Boolean(session().signedIn && id() && state.applicationStatus === "approved" && ["approved", "activation-pending", "active", "paused", "terminated"].includes(state.channelIdentity) && current().stage === state.channelIdentity && !state.applicationSnapshot?.withdrawal && validDecision() && (!request || (typeof request.id === "string" && request.id.trim() && request.applicationId === id() && ["processing", "submitted", "failed", "completed"].includes(request.status))));
      }
      const canOpenActivation = () => valid() && ["approved", "activation-pending"].includes(state.channelIdentity);
      function observe(ctx) {
        context = { ...context, ...ctx };
        if (lastPage !== session().page) { pageScope = session().page === "CHN-15" ? scope() : ""; lastPage = session().page; }
      }
      const matches = () => valid() && session().page === "CHN-15" && pageScope === scope() && document.querySelector("[data-approval-scope]")?.dataset.approvalScope === stamp();
      function model() {
        const phase = state.channelIdentity;
        if (phase === "activation-pending") return { title: "开通资料已提交", detail: "顾问身份尚未生效，可查看当前开通进度。", label: "查看开通进度", route: "CHN-16", step: 2 };
        if (phase === "active") return { title: "顾问身份已生效", detail: "可进入经营中心，查看服务订单与顾问工具。", label: "进入经营中心", route: "CHN-19", step: 3 };
        if (phase === "paused") return { title: "经营已暂停", detail: "历史订单与结算仍可查看，需要帮助可联系客服。", label: "查看历史结算", route: "CHN-22" };
        if (phase === "terminated") return { title: "合作已结束", detail: "历史结算与待处理事项仍保留。", label: "查看历史结算", route: "CHN-22" };
        return { title: "申请审核通过", detail: "下一步确认合作协议和收款资料。身份生效后，即可使用顾问工具。", label: state.activationReady === true ? "核对协议与收款资料" : "联系客服了解进度", route: state.activationReady === true ? "CHN-16" : "HELP-03", step: 1 };
      }
      function render() {
        const pageTitle = valid() && pageScope === scope() ? ({ approved: "审核通过", "activation-pending": "开通进度", active: "顾问身份", paused: "经营状态", terminated: "经营状态" })[state.channelIdentity] : "申请结果";
        const head = `<header class="screen-head commercial-head"><div><button class="back" data-action="go:CHN-11" aria-label="返回申请进度">← 返回</button><span class="page-context">体验顾问</span><h1>${pageTitle}</h1></div></header>`;
        if (!valid() || pageScope !== scope()) {
          const changed = pageScope !== scope(), conflict = state.applicationStatus === "approved" || ["approved", "activation-pending", "active", "paused", "terminated"].includes(state.channelIdentity);
          return `${head}<div class="stack commercial-stack">${feedback(changed ? "申请已变化" : conflict ? "审核信息待核对" : "请查看当前申请进度", changed ? "请先核对当前申请，原资料仍然保留。" : conflict ? "这条结果暂时无法与当前申请对应，请联系客服核对。" : "当前不是审核通过状态，请从申请进度继续。", "plain")}${actions([[conflict && !changed ? "联系客服核对" : "查看申请进度", conflict && !changed ? "go:HELP-03" : "go:CHN-11", "primary"], ...(conflict && !changed ? [["返回申请进度", "go:CHN-11", "secondary"]] : [])])}</div>`;
        }
        const view = model(), approvedAt = time(decision()?.decidedAt), preparing = state.channelIdentity === "approved" && state.activationReady !== true;
        const steps = typeof view.step === "number" ? `<ol class="approval-steps" aria-label="开通进度">${["审核通过", "协议与收款", "身份生效"].map((label, index) => `<li class="${index < view.step ? "done" : index === view.step ? "current" : ""}" ${index === view.step ? 'aria-current="step"' : ""}><span aria-hidden="true">${index < view.step ? "✓" : index + 1}</span>${label}</li>`).join("")}</ol>` : "";
        const preparation = preparing ? '<section class="approval-preparing"><h3>开通资料准备中</h3><p>协议与收款资料还在准备，暂时无需重复提交申请。</p></section>' : "";
        const facts = `<dl class="approval-facts"><div><dt>申请编号</dt><dd>${e(id())}<button class="text-button" data-action="commercial:approval-copy" aria-label="复制申请编号">复制</button></dd></div>${approvedAt ? `<div><dt>审核通过时间</dt><dd>${e(approvedAt)}<small>北京时间</small></dd></div>` : ""}</dl>`;
        return `${head}<div class="stack commercial-stack"><div class="approval-page" data-approval-scope="${e(stamp())}"><section class="approval-result ${["paused", "terminated"].includes(state.channelIdentity) ? "is-neutral" : ""}" role="status"><span aria-hidden="true">${["paused", "terminated"].includes(state.channelIdentity) ? "—" : "✓"}</span><h2>${e(view.title)}</h2><p>${e(view.detail)}</p></section>${steps}${preparation}${facts}${actions([[view.label, "commercial:approval-continue", "primary"], ["查看本次申请", "commercial:approval-details", "secondary"]])}${view.route === "HELP-03" ? "" : '<button class="text-button approval-help" data-action="commercial:approval-help">有疑问？联系客服</button>'}</div></div>`;
      }
      function handleAction(command, ctx) {
        if (!command.startsWith("approval-")) return false;
        context = { ...context, ...ctx };
        if (synchronize() || !matches()) { if (session().page === "CHN-15") context.render?.(); context.flash?.("申请进度已更新，请从当前页面继续"); return true; }
        if (command === "approval-copy") {
          const original = stamp();
          copy(id(), "申请编号已复制", { ...context, flash: message => { if (matches() && stamp() === original) context.flash?.(message); } }); return true;
        }
        const destination = command === "approval-details" ? "CHN-07" : command === "approval-help" ? "HELP-03" : command === "approval-progress" ? "CHN-11" : command === "approval-continue" ? model().route : "";
        if (destination) context.go(destination);
        return true;
      }
      return { observe, render, handleAction, canOpenActivation, validResult: valid };
    }
  };
})();
