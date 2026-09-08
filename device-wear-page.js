(function () {
  // Navigation-only guidance. No wearing detection, BLE command, activation or health write.
  window.createHaloDeviceWear = function ({ state, pages, go, persist, track, modalRoot, closeModal }) {
    const account = () => String(state.authPhone || state.authForm?.phone || "local-demo");
    const device = () => state.pairedDevice?.id || "";
    const knownRoute = id => pages.some(page => page.id === id);
    const context = () => state.deviceWearGuide;
    const bindingMatches = item => state.devicePaired && state.deviceBinding?.status === "success" && state.deviceBinding.accountRef === account() && state.deviceBinding.operation?.id === item.bindingOperationId && state.deviceBinding.operation.accountRef === account() && state.deviceBinding.target?.id === device();
    const valid = item => item?.version === 1 && typeof item.id === "string" && item.accountRef === account() && item.deviceId === device() && ["setup", "review"].includes(item.mode) && knownRoute(item.returnRoute) && item.returnRoute !== "DEV-04" && (item.mode !== "setup" || bindingMatches(item));
    const emit = (name, fields = {}) => track(name, { source_page: "DEV-04", mode: context()?.mode || "review", simulated: true, ...fields });
    function create(source) {
      const binding = state.deviceBinding;
      const setup = source === "DEV-03" && binding?.status === "success" && binding.operation?.id && binding.destination === "DEV-04" && state.devicePaired && binding.target?.id === device();
      const safeSource = knownRoute(source) && !["SYS-01", "AUTH-01", "AUTH-02", "DEV-03", "DEV-04", "DEV-05", "HELP-03"].includes(source);
      return { version: 1, id: `wear-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, accountRef: account(), deviceId: device(), mode: setup ? "setup" : "review", returnRoute: setup ? "DEV-03" : safeSource ? source : state.devicePaired || state.membershipHardwareState === "active" ? "DEV-10" : "MY-01", bindingOperationId: setup ? binding.operation.id : "", helpReturn: false, viewedAt: "", continuedAt: "" };
    }
    function enter(target, source) {
      if (target === "DEV-04") {
        if (["SYS-01", "DEV-05", "HELP-03"].includes(source) && valid(context())) return;
        state.deviceWearGuide = create(source);
      }
      if (target === "HELP-03" && valid(context()) && source !== "SYS-01") context().helpReturn = source === "DEV-04";
      else if (source === "HELP-03" && target !== "DEV-04" && valid(context())) context().helpReturn = false;
    }
    function restore(target, source = "SYS-01") {
      const saved = history.state?.wearGuide;
      if (["DEV-04", "HELP-03"].includes(target) && valid(saved)) state.deviceWearGuide = { ...saved };
      else enter(target, source);
    }
    function historyFields(target) {
      return valid(context()) && (target === "DEV-04" || target === "HELP-03" && context().helpReturn) ? { wearGuide: { ...context() } } : {};
    }
    function prepare() {
      if (state.current !== "DEV-04") return;
      if (!valid(context())) state.deviceWearGuide = create("");
      if (!context().viewedAt) { context().viewedAt = new Date().toISOString(); emit("device_wear_viewed"); }
      history.replaceState({ ...history.state, ...historyFields("DEV-04") }, "");
    }
    function trimStack() {
      const stack = state.tabStacks["MY-01"];
      if (stack?.at(-1) === state.current) stack.pop();
    }
    function back() {
      if (!valid(context())) state.deviceWearGuide = create("");
      closeModal();
      const target = context().returnRoute;
      emit("device_wear_closed", { destination: target }); trimStack(); persist();
      if (history.state?.trail?.at(-2) === target) history.back();
      else go(target, false);
    }
    function canReturnFromHelp() { return state.current === "HELP-03" && valid(context()) && context().helpReturn; }
    function returnFromHelp() {
      if (!canReturnFromHelp()) return;
      closeModal(); trimStack(); context().helpReturn = false; go("DEV-04", false);
    }
    function resumeRoute(prior) { return valid(context()) && (prior === "DEV-04" || prior === "HELP-03" && context().helpReturn) ? prior : ""; }
    function canReturnToBinding() { return valid(context()) && context().mode === "setup" && context().returnRoute === "DEV-03"; }
    function showHelp(care = false) {
      emit("device_wear_help_opened", { topic: care ? "care" : "wearing" });
      modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal connection-permission-modal wear-help-modal" role="dialog" aria-modal="true" aria-labelledby="wear-help-title"><h2 id="wear-help-title">${care ? "佩戴与保养" : "佩戴帮助"}</h2>${care ? '<p>洗手或出汗后，用柔软的布擦干戒指内侧，再继续佩戴。</p><p>具体清洁方式和使用注意事项，请以产品说明为准。</p>' : '<p>不确定尺寸或戴法？可以联系客服，说明戒指款式和遇到的问题。</p><p>如果戴着不舒服，先取下戒指，不要勉强戴紧。</p>'}<div class="connection-permission-actions">${care ? '<button type="button" class="primary" data-action="close-modal">知道了</button>' : '<button type="button" class="primary" data-action="wear-support">联系客服</button><button type="button" class="text-button" data-action="close-modal">返回佩戴引导</button>'}</div></section></div>`;
    }
    function page() {
      const setup = context().mode === "setup";
      return `<section class="device-wear-page" aria-labelledby="device-wear-title" data-wear-mode="${context().mode}"><button type="button" class="device-guide-back" data-action="wear-back" aria-label="返回"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5-7 7 7 7"/></svg></button><header class="device-guide-heading"><h1 id="device-wear-title">戴上你的 Halo Ring</h1></header><figure class="device-wear-photo"><img src="assets/halo-wearing-brand.jpg" alt="Halo Ring 手部佩戴场景图" width="1280" height="1725"></figure><div class="device-wear-tips"><section><span aria-hidden="true">01</span><div><h2>贴合舒适</h2><p>以戴着舒服为准，不要勉强戴紧。</p></div></section><section><span aria-hidden="true">02</span><div><h2>保持干爽</h2><p>洗手或出汗后，擦干戒指内侧。</p></div></section><button type="button" class="wear-care-link" data-action="wear-care">佩戴与保养<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button></div><footer class="device-guide-actions"><button type="button" class="primary" data-action="${setup ? "wear-continue" : "wear-back"}">${setup ? "继续设置" : "知道了"}</button><button type="button" class="text-button" data-action="wear-help">佩戴帮助</button></footer></section>`;
    }
    function handle(action) {
      if (!action.startsWith("wear-")) return false;
      if (state.current !== "DEV-04" || !state.signedIn) return true;
      if (action === "wear-back") back();
      if (action === "wear-help") showHelp();
      if (action === "wear-care") showHelp(true);
      if (action === "wear-support") {
        closeModal();
        const stack = state.tabStacks["MY-01"] || (state.tabStacks["MY-01"] = ["MY-01"]);
        if (stack.at(-1) !== "DEV-04") stack.push("DEV-04");
        go("HELP-03");
      }
      if (action === "wear-continue") {
        if (!valid(context()) || context().mode !== "setup") { back(); return true; }
        context().continuedAt ||= new Date().toISOString();
        emit("device_wear_continue", { destination: "DEV-05" }); persist(); go("DEV-05");
      }
      return true;
    }
    return { enter, restore, historyFields, prepare, page, handle, back, canReturnFromHelp, returnFromHelp, resumeRoute, canReturnToBinding };
  };
})();
