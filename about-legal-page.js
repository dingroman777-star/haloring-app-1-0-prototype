/* LEGAL-02: public prototype information; consent and legal reading remain shared. */
(() => {
  window.createHaloAboutLegal = function ({ state, go, esc, symbol }) {
    const routes = ["MY-01", "HELP-01", "HELP-03", "ACC-02", "ACC-03"];
    const owner = () => String(state.authPhone || state.authForm?.phone || "local-demo");
    const deleting = () => state.accountDeletionStatus === "submitted";
    function valid(value) {
      return value && value.ownerAccount === owner() && routes.includes(value.sourceRoute) && (!deleting() || ["ACC-02", "ACC-03"].includes(value.sourceRoute)) ? { ownerAccount: owner(), sourceRoute: value.sourceRoute } : null;
    }
    let sourceContext = valid(history.state?.aboutLegalContext);
    function enter(target, source, restore = false) {
      if (!["LEGAL-01", "LEGAL-02"].includes(target)) { sourceContext = null; return; }
      if (restore) { sourceContext = valid(history.state?.aboutLegalContext); return; }
      if (target === "LEGAL-01") {
        if (source !== "LEGAL-02") sourceContext = null;
        return;
      }
      if (source === "LEGAL-01" || source === "LEGAL-02") { sourceContext = valid(sourceContext); return; }
      sourceContext = valid({ ownerAccount: owner(), sourceRoute: source });
    }
    function afterRender() {
      if (!["LEGAL-01", "LEGAL-02"].includes(state.current)) return;
      sourceContext = valid(sourceContext);
      history.replaceState({ ...history.state, aboutLegalContext: sourceContext }, "", location.href);
    }
    function back() {
      if (state.current !== "LEGAL-02") return false;
      const route = valid(sourceContext)?.sourceRoute || (deleting() ? "ACC-02" : "MY-01");
      sourceContext = null;
      // Return to the actual entry route, not the cross-tab stack left by legal reading.
      if (history.state?.trail?.at(-2) === route) history.back();
      else go(route, false);
      return true;
    }
    const row = (title, detail, action) => `<button type="button" class="al-link" data-action="${esc(action)}"><span><strong>${esc(title)}</strong><small>${esc(detail)}</small></span><i aria-hidden="true">›</i></button>`;
    function page() {
      return `<div class="al-page"><header class="al-header"><button type="button" data-action="previous" aria-label="返回上一页">‹</button><h1>关于与协议</h1><span aria-hidden="true"></span></header><section class="al-brand" aria-label="Halo Ring App"><img class="al-symbol" src="${esc(symbol)}" width="50" height="60" alt=""><img class="al-wordmark" src="assets/HALORING_wordmark_with_slogan_ink.png" width="190" height="40" alt="Halo Ring"><p class="al-version">App 1.0</p><p class="al-build">交互原型 · v6.5</p></section><section class="al-links" aria-label="协议与说明">${deleting() ? row("用户协议", "账号使用与服务约定", "legal-read:agreement") + row("隐私政策", "信息的使用、保存与管理", "legal-read:privacy") + row("AI 服务说明", "建议的适用范围与对话记忆", "legal-read:ai") : row("协议与说明", "用户协议、隐私政策与 AI 服务说明", "go:LEGAL-01")}</section><p class="al-preview-note">当前提供原型摘要，非正式法律文本。</p><details class="al-provider"><summary>服务主体信息</summary><div class="al-provider-body"><p>运营主体信息待补充。</p><p>正式版本将展示完整主体信息。</p></div></details><section class="al-health"><h2>健康管理参考</h2><p>Halo Ring 与 App 提供的状态和建议不替代医疗诊断。</p></section></div>`;
    }
    function handle(action) {
      return action === "previous" && state.current === "LEGAL-02" ? back() : false;
    }
    return { page, enter, afterRender, back, handle };
  };
})();
