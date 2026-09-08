/* ACC-02: local session controls, without deleting account records or simulating remote devices. */
(() => {
  window.createHaloAccountSecurity = function ({ state, go, write, readSession, hasUnmergedChanges, invalidateAuth, track, esc, modalRoot, closeModal }) {
    let intent = null, saving = false;
    const owner = source => String(source.authPhone || "");
    const session = source => String(source.authForm?.login?.id || source.agreementAcceptance?.acceptedAt || "verified-session");
    const signedIn = () => state.signedIn === true && state.authVerified === true;
    const deleting = () => state.accountDeletionStatus === "submitted";
    function phone() {
      const value = String(state.authPhone || "").replace(/^\+?86(?=1\d{10}$)/, "");
      return /^1[3-9]\d{9}$/.test(value) ? `${value.slice(0, 3)} **** ${value.slice(-4)}` : "暂未获取";
    }
    function page() {
      return `<div class="as-page"><header class="as-header"><button type="button" data-action="previous" aria-label="${deleting() ? "返回处理页面" : "返回上一页"}">‹</button><h1>账号与安全</h1><span aria-hidden="true"></span></header><section class="as-account"><h2>当前账号 · 手机号</h2><strong class="as-phone">${esc(phone())}</strong></section><section class="as-session"><h2>本机登录</h2><div class="as-session-row"><strong>当前设备</strong><span>已登录</span></div></section><section class="as-actions"><button type="button" class="secondary" data-action="account-security:logout">退出登录</button><p>只退出本机登录，不会注销账号或删除已保存的记录。</p></section><section class="as-delete"><button type="button" data-action="go:ACC-03"><span><strong>${deleting() ? "查看注销进度" : "注销账号"}</strong><small>${deleting() ? "查看已提交申请的处理状态" : "先查看说明与影响，不会立即注销"}</small></span><i aria-hidden="true">›</i></button></section></div>`;
    }
    function error(message, retryable = true) {
      const node = modalRoot.querySelector(".as-logout-error");
      if (node) node.textContent = message;
      const button = modalRoot.querySelector('[data-action^="account-security:logout-confirm:"]');
      if (button) { button.disabled = !retryable; button.textContent = retryable ? "重试退出" : "确认退出"; }
    }
    function requireRefresh(message) {
      error(message, false);
    }
    function open() {
      if (state.current !== "ACC-02" || !signedIn()) return;
      intent = { id: crypto.randomUUID(), owner: owner(state), session: session(state) };
      modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal as-logout-modal" role="dialog" aria-modal="true" aria-labelledby="account-logout-title" data-logout-token="${intent.id}"><h2 id="account-logout-title">退出本机登录？</h2><p>退出后需要重新登录。账号不会注销，已保存的资料、对话和其他记录不会删除。</p>${deleting() ? '<p>已经提交的注销申请仍按原流程处理。</p>' : ""}<p class="as-logout-error" role="alert"></p><div class="as-modal-actions"><button type="button" class="primary" data-action="account-security:logout-cancel">取消</button><button type="button" class="secondary" data-action="account-security:logout-confirm:${intent.id}">确认退出</button></div></section></div>`;
    }
    function confirm(id) {
      const modal = modalRoot.querySelector(".as-logout-modal");
      if (saving || !intent || id !== intent.id || modal?.dataset.logoutToken !== id || state.current !== "ACC-02" || !signedIn()) return;
      if (intent.owner !== owner(state) || intent.session !== session(state)) { requireRefresh("登录状态已在其他页面更新，请刷新后再操作。"); return; }
      const stored = readSession();
      if (!stored.ok) { error("暂时无法确认本机登录状态。尚未退出，请稍后重试。"); return; }
      if (stored.value.signedIn !== true || stored.value.authVerified !== true || owner(stored.value) !== intent.owner || session(stored.value) !== intent.session) { requireRefresh("登录状态已在其他页面更新，请刷新后再操作。"); return; }
      if (hasUnmergedChanges(stored.value)) { requireRefresh("本机记录已在其他页面更新。为保留最新内容，请刷新后再退出。"); return; }
      saving = true;
      const changes = {
        signedIn: false, authVerified: false, authCodeRequested: false, authReturnRoute: "", welcomeShopping: false,
        authForm: { ...state.authForm, request: null, login: null, code: "", termsAccepted: false, consentScope: "", touched: false, error: "", codeError: "", cooldownUntil: 0, sequence: (Number(state.authForm?.sequence) || 0) + 1 },
        navigationHistory: [], lastVisitedRoute: "AUTH-01"
      };
      const ok = write(changes);
      saving = false;
      if (!ok) { error("这次没能退出登录。当前账号和已保存记录没有改变，请重试。"); return; }
      // Only after the durable session change: cancel the old async challenge and report success.
      invalidateAuth(); intent = null;
      track("account_signed_out", { source_page: "ACC-02", simulated: true });
      closeModal(); go("AUTH-01", false);
    }
    function back() {
      if (state.current !== "ACC-02") return false;
      const prior = history.state?.trail?.at(-2);
      const routes = deleting() ? ["ACC-03", "HELP-03", "LEGAL-02"] : ["MY-01", "ACC-03", "HELP-03", "LEGAL-02"];
      if (routes.includes(prior)) history.back();
      else go(deleting() ? "ACC-03" : "MY-01", false);
      return true;
    }
    function afterRender() {
      if (modalRoot.querySelector(".as-logout-modal") && (state.current !== "ACC-02" || !signedIn() || intent?.owner !== owner(state) || intent?.session !== session(state))) { intent = null; closeModal(); }
    }
    function handle(action) {
      if (action === "logout") { open(); return true; }
      if (action === "logout-confirm" || action?.startsWith?.("logout-confirm:")) return true;
      if (action === "previous" && state.current === "ACC-02") return back();
      if (typeof action !== "string" || !action.startsWith("account-security:")) return false;
      if (action === "account-security:logout") open();
      if (action === "account-security:logout-cancel" && modalRoot.querySelector(".as-logout-modal")) { intent = null; closeModal(); }
      if (action.startsWith("account-security:logout-confirm:")) confirm(action.slice("account-security:logout-confirm:".length));
      return true;
    }
    return { page, handle, back, afterRender };
  };
})();
