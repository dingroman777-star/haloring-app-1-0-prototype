/* HELP-03: truthful contact availability; no external handoff or data transport. */
(() => {
  window.createHaloSupportContact = function ({ state, pages, go, persist, esc, closeModal, openFeedback, commercial }) {
    let feedbackEntryPending = false, returningFromFeedback = false;
    const owner = () => String(state.authPhone || state.authForm?.phone || "local-demo");
    const deleting = () => state.accountDeletionStatus === "submitted";
    const allowedSource = route => typeof route === "string" && route !== "HELP-03" && !/^(SYS|AUTH|ONB)-/.test(route) && pages.some(page => page.id === route) && (!deleting() || ["ACC-02", "ACC-03", "LEGAL-02"].includes(route));
    function selectContext(route, saved) {
      if (state.signedIn && /^CHN-\d{2}$/.test(route)) {
        try { return commercial()?.channelSupportContext?.(route, saved) || null; } catch { return null; }
      }
      if (!state.signedIn || !["SEL-09", "SEL-11", "SEL-12", "SEL-13"].includes(route)) return null;
      const data = commercial()?.state;
      if (!data) return null;
      const afterSaleId = saved?.afterSaleId || (route === "SEL-13" ? data.afterSaleSnapshot?.id : null);
      const afterSale = afterSaleId ? data.afterSales?.find(row => row.id === afterSaleId && row.order?.id === (saved?.orderId || data.afterSaleSnapshot?.order?.id)) : null;
      if (afterSaleId && !afterSale) return null;
      const orderId = saved?.orderId || afterSale?.order?.id || (route === "SEL-09" ? data.orderSnapshot?.id : data.selectedOrderId);
      if (!data.orders?.some(row => row.id === orderId)) return null;
      return { ownerAccount: owner(), sourceRoute: route, orderId, afterSaleId: afterSale?.id || null };
    }
    function restoreSelect(source) {
      const selection = source?.commerce && selectContext(source.commerce.sourceRoute, source.commerce);
      if (!selection) return;
      if (selection.kind === "channel") return;
      const data = commercial().state;
      data.selectedOrderId = selection.orderId;
      if (selection.sourceRoute === "SEL-09") data.orderSnapshot = data.orders.find(row => row.id === selection.orderId);
      if (selection.afterSaleId) { data.afterSaleSnapshot = data.afterSales.find(row => row.id === selection.afterSaleId); data.afterSaleStatus = data.afterSaleSnapshot.status; }
    }
    function valid(value) {
      if (!value || value.ownerAccount !== owner() || !allowedSource(value.sourceRoute)) return null;
      const commerce = value.commerce?.ownerAccount === owner() ? selectContext(value.commerce.sourceRoute, value.commerce) : null;
      return { ownerAccount: owner(), sourceRoute: value.sourceRoute, ...(commerce ? { commerce } : {}), ...(typeof value.feedbackId === "string" ? { feedbackId: value.feedbackId } : {}), ...(value.feedbackEntry === true ? { feedbackEntry: true } : {}) };
    }
    function context() {
      const current = valid(state.supportContact);
      if (!current && state.supportContact) state.supportContact = null;
      return current;
    }
    function feedbackTicket() {
      const source = context();
      return source?.sourceRoute === "HELP-02" && source.feedbackId ? (state.feedbackTickets || []).find(ticket => ticket.id === source.feedbackId && ticket.ownerAccount === owner()) : null;
    }
    function enter(target, source, restore = false) {
      if (target !== "HELP-03") {
        if (target === "HELP-02" && restore) { state.supportContact = valid(history.state?.supportFeedbackContext); return; }
        if (target === "HELP-02" && source === "HELP-03" && feedbackEntryPending) {
          state.supportContact = { ...(context() || { ownerAccount: owner(), sourceRoute: "HELP-01" }), feedbackEntry: true };
          feedbackEntryPending = false; return;
        }
        feedbackEntryPending = false; state.supportContact = null; return;
      }
      if (returningFromFeedback) { returningFromFeedback = false; const saved = context(); if (saved) delete saved.feedbackEntry; state.supportContact = saved; return; }
      if (restore) { state.supportContact = valid(history.state?.supportContactContext); return; }
      if (source === "HELP-03") { context(); return; }
      const draft = state.feedbackFlow?.accounts?.[owner()];
      const ticket = source === "HELP-02" && draft?.view === "detail" ? (state.feedbackTickets || []).find(item => item.id === draft.selectedId && item.ownerAccount === owner()) : null;
      const commerce = ticket?.commerceContext?.ownerAccount === owner() ? selectContext(ticket.commerceContext.sourceRoute, ticket.commerceContext) : selectContext(source);
      state.supportContact = allowedSource(source) ? { ownerAccount: owner(), sourceRoute: source, ...(commerce ? { commerce } : {}), ...(ticket ? { feedbackId: ticket.id } : {}) } : null;
    }
    function afterRender() {
      if (state.current === "HELP-02" && context()?.feedbackEntry) {
        history.replaceState({ ...history.state, supportFeedbackContext: context() }, "", location.href); return;
      }
      if (state.current !== "HELP-03") return;
      history.replaceState({ ...history.state, supportContactContext: context() }, "", location.href);
    }
    function open() {
      closeModal();
      if (state.current !== "HELP-03") go("HELP-03");
    }
    function back() {
      if (state.current !== "HELP-03") return false;
      const source = context()?.sourceRoute || (deleting() ? "ACC-02" : "HELP-01");
      if (source === "PTS-04" && !window.haloRedemptionSupportPanel?.(true)) return false;
      restoreSelect(context());
      state.supportContact = null;
      const stack = state.tabStacks?.[state.activeTab];
      if (stack?.at(-1) === "HELP-03") stack.pop();
      persist();
      if (history.state?.trail?.at(-2) === source) history.back();
      else go(source, false);
      return true;
    }
    function backFromFeedback() {
      if (state.current !== "HELP-02" || !context()?.feedbackEntry) return false;
      persist();
      const stack = state.tabStacks?.[state.activeTab];
      if (stack?.at(-1) === "HELP-02") stack.pop();
      if (history.state?.trail?.at(-2) === "HELP-03") history.back();
      else { returningFromFeedback = true; go("HELP-03", false); }
      return true;
    }
    const button = (label, action, className = "secondary") => `<button type="button" class="${className}" data-action="${esc(action)}">${esc(label)}</button>`;
    function identityPanel() {
      if (context()?.sourceRoute === "PTS-04") return window.haloRedemptionSupportPanel?.() || "";
      if (context()?.sourceRoute === "PTS-02") return window.haloPointsSupportPanel?.() || "";
      if (context()?.sourceRoute !== "CHN-04") return "";
      const extension = commercial(), record = extension?.state?.identityVerification;
      const recordOwner = record?.ownerAccount || record?.accountRef;
      const supportOwner = extension?.state?.identitySupportContext?.ownerAccount || extension?.state?.identitySupportContext?.accountRef;
      if (recordOwner === owner() && (!supportOwner || supportOwner === owner())) {
        const panel = extension.identitySupportPanel?.("CHN-04");
        if (panel) return `<div class="sc-context">${panel}</div>`;
      }
      return `<section class="sc-context"><h3>关于身份核验</h3><p>可以返回核验结果页，查看本次结果与处理提示。</p>${button("返回核验结果", "support:source", "text-button")}</section>`;
    }
    function page() {
      const ticket = feedbackTicket();
      const accountNote = deleting() ? "账号注销不影响继续处理订单售后、合同与历史结算事项。" : commercial()?.state?.channelIdentity === "terminated" ? "合作终止后，订单售后、合同与历史结算事项仍可咨询，无需重新激活身份。" : "";
      const commerce = context()?.commerce;
      const returnLabel = ticket ? "返回这条反馈" : commerce?.sourceRoute === "SEL-12" ? "返回售后申请" : commerce?.sourceRoute === "SEL-09" ? "返回支付结果" : commerce?.afterSaleId ? "返回售后进度" : "返回原订单";
      const orderPanel = commerce?.kind === "channel" ? `<section class="sc-context sc-order-context" aria-label="关联渠道记录"><h3>关于这条渠道记录</h3><p>${esc(commerce.recordLabel)}：${esc(commerce.recordId)}</p><p>仅用于核对，尚未发送给客服。</p>${button("返回原记录", "support:source", "text-button")}</section>` : commerce ? `<section class="sc-context sc-order-context" aria-label="关联订单"><h3>${commerce.afterSaleId ? "关于这笔售后" : "关于这笔订单"}</h3><p>订单号：${esc(commerce.orderId)}${commerce.afterSaleId ? `<br>售后单号：${esc(commerce.afterSaleId)}` : ""}</p><p>仅用于核对，尚未发送给客服。</p>${button(returnLabel, "support:source", "text-button")}</section>` : "";
      const main = deleting() ? button(context() ? "返回处理页面" : "返回账号与安全", "support:source", "primary") : ticket ? button("返回这条反馈", "support:feedback-return", "primary") : button("先记下问题", "support:feedback", "primary");
      return `<div class="sc-page"><header class="sc-header"><button type="button" data-action="previous" aria-label="返回上一页">‹</button><h1>人工客服</h1><span aria-hidden="true"></span></header><section class="sc-intro"><span class="sc-symbol" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><path d="M10 27v-5a14 14 0 0 1 28 0v5M10 23H7v12h7V23h-4Zm28 0h3v12h-7V23h4Zm0 12c0 6-7 7-12 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span><h2>Halo 客服</h2><p>企业微信 · 会员、订单、设备与售后</p></section><section class="sc-status" aria-labelledby="support-status-title"><h3 id="support-status-title">客服入口暂不可用</h3><p>${deleting() ? "你可以先返回处理页面，已有记录仍会保留。" : ticket ? "这条反馈已保存在本机，尚未发送给客服。" : "你可以先记下问题，或查看常见解答。"}</p></section>${orderPanel}<div class="sc-actions">${main}${deleting() ? "" : button("查看常见问题", "support:faq", "text-button")}</div>${accountNote ? `<section class="sc-context"><p>${esc(accountNote)}</p></section>` : ""}${identityPanel()}<details class="sc-existing"><summary>已经联系过客服？</summary><div class="sc-existing-body"><p>可以回到原来的企业微信客服会话继续沟通，由你决定提供哪些信息。</p></div></details><p class="sc-privacy">本页不会自动发送反馈、健康数据或 Halo 对话。</p></div>`;
    }
    function handle(action) {
      if (action === "support-handoff" || action === "support-instructions") { open(); return true; }
      if (action === "previous" && state.current === "HELP-03") return back();
      if (typeof action !== "string" || !action.startsWith("support:")) return false;
      if (state.current !== "HELP-03") return true;
      if (action === "support:source") return back();
      if (deleting()) return true;
      if (action === "support:feedback-return") {
        if (feedbackTicket()) back();
        return true;
      }
      if (action === "support:feedback") { const commerce = context()?.commerce; feedbackEntryPending = true; openFeedback(commerce); return true; }
      if (action === "support:faq") { go("HELP-01"); return true; }
      return true;
    }
    return { page, open, back, backFromFeedback, enter, afterRender, handle, commerceContext: () => context()?.commerce || null };
  };
})();
