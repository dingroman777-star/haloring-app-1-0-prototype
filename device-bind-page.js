(function () {
  // Prototype adapter: no real BLE, clearing, account ownership lookup or binding API is called.
  window.createHaloDeviceBinding = function ({ state, scan, go, render, persist, track, esc, blocker, modalRoot, closeModal }) {
    const statuses = ["checking", "ready", "blocked", "check-failed", "binding", "reconnecting", "uncertain", "querying", "success", "failed"];
    const account = () => String(state.authPhone || state.authForm?.phone || "local-demo");
    const active = () => state.membershipHardwareState === "active";
    let timer = null, clearIntent = null;
    let reviewEligibility = "auto", reviewOutcome = "success", reviewQuery = "success";
    const hadBindingInventory = state.deviceBindings && typeof state.deviceBindings === "object" && !Array.isArray(state.deviceBindings);
    state.deviceBindings = hadBindingInventory ? state.deviceBindings : {};
    if (!hadBindingInventory && (active() || state.devicePaired) && state.deviceResetStatus !== "complete") {
      const previous = state.pairedDevice || { id: "ring7a21", suffix: "7A21" };
      if (!state.deviceBindings[previous.id]) state.deviceBindings[previous.id] = { ...previous, accountRef: account(), legacy: true };
    }
    if (!state.deviceBinding || state.deviceBinding.version !== 1 || !statuses.includes(state.deviceBinding.status) || !state.deviceBinding.target?.id) state.deviceBinding = null;
    const binding = () => state.deviceBinding;
    const unresolved = () => Boolean(binding()?.operation && ["binding", "reconnecting", "uncertain", "querying"].includes(binding().status));
    const sameAccount = () => state.signedIn && binding()?.accountRef === account();
    const resumeRoute = () => sameAccount() && binding()?.operation && (unresolved() || ["success", "failed"].includes(binding().status) && !binding().acknowledged) ? "DEV-03" : "";
    const emit = (name, fields = {}) => track(name, { source_page: "DEV-03", simulated: true, ...fields });
    function connectionProblem() {
      if (!state.signedIn) return "请重新登录后继续。";
      if (state.connectionIntro.permission !== "granted" || !state.toggles.bluetooth) return "请开启蓝牙，并允许 Halo 使用蓝牙。";
      const busy = blocker();
      return busy ? busy[1] : "";
    }
    function selectionKey() { return `${state.deviceScan.request?.id || ""}:${scan.selected()?.id || ""}`; }
    function ownsTarget(target) { return state.deviceBindings[target.id]?.accountRef === account(); }
    function check() {
      if (unresolved() || !state.signedIn || !scan.selected() || !state.deviceScan.handoff) return;
      const now = Date.now(), target = { ...scan.selected() };
      clearIntent = null;
      state.deviceBinding = { version: 1, status: "checking", target, selectionKey: selectionKey(), accountRef: account(), kind: "", clearsData: null, acknowledged: false, operation: null,
        check: { id: `bind-check-${now}-${Math.random().toString(36).slice(2, 7)}`, startedAt: now, readyAt: now + 650, outcome: scan.fresh() ? reviewEligibility : "stale" } };
      emit("device_bind_check_started", { request_id: binding().check.id }); persist();
    }
    function prepare() {
      if (state.current !== "DEV-03" || !state.signedIn) return;
      if (resumeRoute()) return;
      if (!binding() || !sameAccount() || binding().selectionKey !== selectionKey()) check();
    }
    function checkedRecently() { return Number.isFinite(binding()?.checkedAt) && Date.now() >= binding().checkedAt && Date.now() - binding().checkedAt < 60000; }
    function readyToSubmit() {
      return sameAccount() && binding().status === "ready" && binding().selectionKey === selectionKey() && checkedRecently() && !connectionProblem() && ["new", "self"].includes(binding().kind) && typeof binding().clearsData === "boolean";
    }
    function finish(status, reason = "") {
      const item = binding(), operation = item.operation;
      if (!operation) return;
      if (!sameAccount() || operation.accountRef !== account()) { item.status = "uncertain"; item.reason = "登录状态已变化，请使用原账号查看结果。"; persist(); return; }
      if (operation.applied) { item.status = "success"; persist(); return; }
      if (!["success", "failed"].includes(status) || !operation.target?.id || !["new", "self"].includes(operation.kind)) { item.status = "uncertain"; item.reason = "暂时无法确认结果，请稍后再查询。"; persist(); return; }
      if (status === "success") {
        const owner = state.deviceBindings[operation.target.id];
        if (owner && owner.accountRef !== operation.accountRef) { status = "failed"; reason = "这枚戒指的绑定状态已变化，请重新检查。"; }
        else {
          // Only this successful callback applies the chosen device. Do not clear records or award assets.
          state.deviceBindings[operation.target.id] = owner || { ...operation.target, accountRef: operation.accountRef, ...(operation.kind === "new" ? { boundAt: new Date().toISOString() } : { knownOwnership: true }) };
          state.pairedDevice = { ...operation.target }; state.devicePaired = true;
          state.deviceResetStatus = "ready";
          state.deviceStatus = item.status !== "querying" && state.toggles.bluetooth && state.connectionIntro.permission === "granted" ? "connected" : "disconnected";
          operation.applied = true;
          item.destination = operation.kind === "self" && active() ? "DEV-10" : "DEV-04";
        }
      }
      item.status = status; item.reason = reason; operation.status = status;
      emit("device_bind_result", { operation_id: operation.id, kind: operation.kind, result: status }); persist();
    }
    function resume() {
      clearTimeout(timer); timer = null;
      const item = binding();
      if (!item || !sameAccount()) return;
      const request = item.status === "checking" ? item.check : item.status === "querying" ? item.query : ["binding", "reconnecting"].includes(item.status) ? item.operation : null;
      if (!request) return;
      if (!Number.isFinite(request.readyAt)) {
        if (item.operation) { item.status = "uncertain"; item.reason = "暂时无法确认结果，请查询后再继续。"; }
        else { item.status = "check-failed"; item.reason = "请重新检查戒指。"; }
        persist(); if (state.current === "DEV-03") render(); return;
      }
      timer = setTimeout(() => {
        timer = null;
        if (binding() !== item || !sameAccount()) return;
        if (item.status === "checking") {
          const problem = connectionProblem(), outcome = request.outcome;
          const existing = state.deviceBindings[item.target.id];
          if (outcome === "stale") { item.status = "check-failed"; item.reason = "查找结果已过期，请重新选择戒指。"; }
          else if (problem || outcome === "check-failed") { item.status = "check-failed"; item.reason = problem || "暂时无法确认绑定状态，请再试一次。"; }
          else if (outcome === "other" || existing && existing.accountRef !== account()) { item.status = "blocked"; item.reason = "请联系原持有人解除绑定，或向客服寻求帮助。"; }
          else if (!["auto", "new-no-clear", "self"].includes(outcome)) { item.status = "check-failed"; item.reason = "暂时无法确认设备信息，请稍后重试。"; }
          else {
            item.kind = ownsTarget(item.target) || outcome === "self" ? "self" : "new";
            item.clearsData = item.kind === "new" && outcome !== "new-no-clear";
            item.checkedAt = request.readyAt; item.status = "ready"; item.reason = "";
          }
          emit("device_bind_check_completed", { request_id: request.id, result: item.status, kind: item.kind }); persist();
        } else if (item.status === "querying") {
          if (request.outcome === "pending") { item.status = "uncertain"; item.reason = "还没有收到最终结果，可以稍后再查询。"; persist(); }
          else finish(request.outcome, request.outcome === "failed" ? "本次操作未完成。重新检查戒指后再试一次。" : "");
        } else {
          const problem = connectionProblem();
          if (request.outcome === "timeout" || problem || request.outcome === "bluetooth-off") {
            if (request.outcome === "bluetooth-off") { state.toggles.bluetooth = false; state.connectionIntro.permission = "bluetooth-off"; }
            item.status = "uncertain"; item.reason = "暂时没有收到最终结果，先查询进度，再决定下一步。";
            emit("device_bind_result", { operation_id: request.id, result: "uncertain" }); persist();
          } else finish(request.outcome, request.outcome === "failed" ? "本次没有完成，请把戒指放在手机旁，再试一次。" : "");
        }
        if (["DEV-03", "MY-01", "DEV-10"].includes(state.current)) render();
      }, Math.max(0, request.readyAt - Date.now()));
    }
    function submit(clearConfirmed = false) {
      if (!readyToSubmit()) { closeModal(); render(); return; }
      const item = binding(), owner = state.deviceBindings[binding().target.id];
      if (owner && (owner.accountRef !== account() || item.kind !== "self")) { clearIntent = null; closeModal(); check(); render(); return; }
      if (clearConfirmed && !document.getElementById("bind-clear-title")) return;
      if (item.clearsData && (!clearConfirmed || clearIntent !== item.check.id)) {
        clearIntent = item.check.id;
        modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal connection-permission-modal" role="dialog" aria-modal="true" aria-labelledby="bind-clear-title"><h2 id="bind-clear-title">绑定前，请确认</h2><p>首次绑定这枚戒指会清除戒指内的旧数据。已经保存到 App 的记录不会被删除。</p><p>戒指尾号 ${esc(item.target.suffix)}，绑定到当前 Halo 账号。</p><div class="connection-permission-actions"><button type="button" class="primary" data-action="bind-confirm-clear">清除旧数据并绑定</button><button type="button" class="text-button" data-action="close-modal">暂不绑定</button></div></section></div>`;
        return;
      }
      const now = Date.now();
      item.operation = { id: `bind-${now}-${Math.random().toString(36).slice(2, 7)}`, target: { ...item.target }, accountRef: account(), kind: item.kind, clearsData: item.clearsData,
        clearConsent: item.clearsData ? { checkId: item.check.id, confirmedAt: now } : null, startedAt: now, readyAt: now + 1600, outcome: reviewOutcome, status: "pending", applied: false };
      item.status = item.kind === "new" ? "binding" : "reconnecting"; clearIntent = null;
      emit("device_bind_started", { operation_id: item.operation.id, kind: item.kind, clear_confirmed: Boolean(item.operation.clearConsent) });
      persist(); closeModal(); render();
    }
    function back() {
      if (unresolved()) {
        modalRoot.innerHTML = '<div class="modal-backdrop"><section class="modal info-modal connection-permission-modal" role="dialog" aria-modal="true" aria-labelledby="bind-leave-title"><h2 id="bind-leave-title">还在确认结果</h2><p>可以先离开，稍后从“我的”查看。离开页面不会撤销已经发出的操作。</p><div class="connection-permission-actions"><button class="primary" data-action="close-modal">留在此页</button><button class="text-button" data-action="bind-leave">稍后查看</button></div></section></div>';
      } else if (binding()?.status === "success") go("DEV-10");
      else { if (binding()) binding().acknowledged = true; persist(); go("DEV-02", false); }
    }
    function page() {
      const item = binding();
      if (!item) return "";
      const status = item.status, problem = connectionProblem(), needsCheck = status === "ready" && !checkedRecently();
      let title = "绑定这枚戒指", description = "确认后，戒指将绑定到你的 Halo 账号。", label = "确认绑定", action = "bind-submit", disabled = false;
      if (item.kind === "self") { title = "连接你的戒指"; description = "这枚戒指已绑定到你的账号，无需再次绑定。"; label = "连接戒指"; }
      if (status === "checking") { label = "正在检查…"; disabled = true; }
      if (status === "blocked") { title = "这枚戒指已被绑定"; description = item.reason; label = "重新选择戒指"; action = "bind-select"; }
      if (status === "check-failed") { title = "暂时无法确认戒指"; description = item.reason; label = item.check?.outcome === "stale" ? "重新选择戒指" : "重新检查"; action = item.check?.outcome === "stale" ? "bind-select" : "bind-check"; }
      if (["binding", "reconnecting"].includes(status)) { title = status === "binding" ? "正在绑定戒指" : "正在连接戒指"; description = "请把戒指放在手机旁。"; label = "正在处理…"; disabled = true; }
      if (status === "querying") { title = "正在查询结果"; description = "请稍候，正在确认这次操作的进度。"; label = "正在查询…"; disabled = true; }
      if (status === "uncertain") { title = "还在确认结果"; description = item.reason; label = "查询结果"; action = "bind-query"; }
      if (status === "failed") { title = item.kind === "self" ? "暂时没有连上" : "这次绑定未完成"; description = item.reason; label = "重新检查"; action = "bind-check"; }
      if (status === "success") { title = item.kind === "self" ? (state.deviceStatus === "disconnected" ? "已确认你的戒指" : "戒指已连接") : "绑定成功"; description = item.destination === "DEV-10" ? (state.deviceStatus === "disconnected" ? "已确认这次操作完成，请检查蓝牙后重新连接。" : "可以继续使用你的戒指了。") : "接下来，看看怎样佩戴更合适。"; label = item.destination === "DEV-10" ? "查看我的戒指" : "继续"; action = "bind-continue"; }
      const masked = /^1\d{10}$/.test(account()) ? account().replace(/^(\d{3})\d{4}(\d{4})$/, "$1 **** $2") : "当前 Halo 账号";
      let feedback = "";
      if (status === "ready" && (problem || needsCheck)) { feedback = problem || "确认信息已过期，请重新检查这枚戒指。"; label = "重新检查"; action = "bind-check"; }
      else if (status === "ready" && item.clearsData) feedback = "首次绑定会清除戒指内的旧数据，App 中已保存的记录不受影响。";
      const busy = ["checking", "binding", "reconnecting", "querying"].includes(status);
      return `<section class="device-bind-page" data-bind-state="${status}" aria-labelledby="device-bind-title"><button type="button" class="device-guide-back" data-action="bind-back" aria-label="返回"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5-7 7 7 7"/></svg></button><header class="device-guide-heading" role="status"><h1 id="device-bind-title">${title}</h1><p>${esc(description)}</p></header><div class="device-bind-ring"><span class="device-bind-symbol ${busy ? "is-busy" : ""}"><img src="assets/HALORING_super_symbol_copper.png" width="48" height="62" alt=""></span><div><strong>Halo Ring</strong><span>尾号 ${esc(item.target.suffix)}</span></div>${status === "success" ? '<svg class="device-bind-check" viewBox="0 0 24 24" aria-label="成功"><path d="m5 12 4 4L19 6"/></svg>' : ""}</div>${status === "blocked" ? "" : `<div class="device-bind-account"><span>${item.kind === "self" ? "当前账号" : "绑定到当前账号"}</span><strong>${esc(masked)}</strong></div>`}${feedback ? `<p class="device-bind-note" role="status">${esc(feedback)}</p>` : ""}<footer class="device-guide-actions"><button type="button" class="primary" data-action="${action}" ${disabled ? "disabled" : ""}>${label}</button>${status === "blocked" ? '<button type="button" class="text-button" data-action="bind-support">联系客服</button>' : unresolved() ? '<button type="button" class="text-button" data-action="bind-back">稍后查看</button>' : status !== "success" ? '<button type="button" class="text-button" data-action="bind-select">重新选择戒指</button>' : ""}</footer></section>`;
    }
    function handleAction(action) {
      if (action === "close-modal") clearIntent = null;
      if (!action.startsWith("bind-") && action !== "device-pair-confirm") return false;
      if (!state.signedIn) return true;
      if (action === "bind-open") { go("DEV-03"); return true; }
      if (state.current !== "DEV-03") return true;
      if (action.startsWith("bind-review:")) {
        const [type, value] = action.slice(12).split(":");
        if (type === "eligibility" && !unresolved() && ["auto", "new-no-clear", "self", "other", "unknown", "check-failed"].includes(value)) { reviewEligibility = value; check(); render(); }
        if (type === "outcome" && !["binding", "reconnecting", "querying"].includes(binding()?.status) && ["success", "failed", "timeout", "bluetooth-off"].includes(value)) { reviewOutcome = value; render(); }
        if (type === "query" && binding()?.status !== "querying" && ["success", "failed", "pending"].includes(value)) { reviewQuery = value; render(); }
        return true;
      }
      if (action === "bind-submit" || action === "device-pair-confirm") submit();
      if (action === "bind-confirm-clear" && clearIntent) submit(true);
      if (action === "bind-check" && !unresolved()) { check(); render(); }
      if (action === "bind-back") back();
      if (action === "bind-leave" && unresolved()) { closeModal(); go("MY-01"); }
      if (action === "bind-select" && !unresolved()) { clearIntent = null; if (binding()) binding().acknowledged = true; persist(); closeModal(); go("DEV-02", false); }
      if (action === "bind-support") {
        const stack = state.tabStacks["MY-01"] || (state.tabStacks["MY-01"] = ["MY-01"]);
        if (stack.at(-1) !== "DEV-03") stack.push("DEV-03"); go("HELP-03");
      }
      if (action === "bind-query" && sameAccount() && binding().status === "uncertain") {
        binding().query = { readyAt: Date.now() + 900, outcome: reviewQuery }; binding().status = "querying";
        emit("device_bind_result_queried", { operation_id: binding().operation.id }); persist(); render();
      }
      if (action === "bind-continue" && sameAccount() && binding().status === "success") {
        binding().acknowledged = true; persist(); go(binding().destination, false);
      }
      return true;
    }
    function reviewControls(item) {
      if (item.id !== "DEV-03") return "";
      const group = (type, title, values, selected, disabled) => `<div class="review-control-group"><strong>${title}</strong><div>${values.map(([id, text]) => `<button data-action="bind-review:${type}:${id}" class="${selected === id ? "active" : ""}" ${disabled ? "disabled" : ""}>${text}</button>`).join("")}</div></div>`;
      return `<section class="review-controls"><p>BINDING REVIEW</p><h3>绑定状态审阅</h3><small>仅模拟归属、设备能力与异步结果，不扫描、不清除真实戒指。默认首次绑定按已知 Android 清数据能力演示；iOS 需核实能力。账号已拥有的戒指始终走重连，不重复清除。成功后点击继续；没有后台自动跳页。</small>${group("eligibility", "归属与能力检查", [["auto", "按现有归属 / 首绑需清除"], ["new-no-clear", "已确认无需清除"], ["self", "本人已绑定"], ["other", "其他账号占用"], ["unknown", "能力未知"], ["check-failed", "检查失败"]], reviewEligibility, unresolved())}${group("outcome", "下一次执行结果", [["success", "成功"], ["failed", "明确失败"], ["timeout", "结果不确定"], ["bluetooth-off", "蓝牙中断"]], reviewOutcome, ["binding", "reconnecting", "querying"].includes(binding()?.status))}${group("query", "查询原操作结果", [["success", "已成功"], ["failed", "已失败"], ["pending", "仍在处理"]], reviewQuery, binding()?.status === "querying")}</section>`;
    }
    function resumeEntry() {
      return resumeRoute() ? `<button class="setting-row" data-action="bind-open"><div><strong>${binding().status === "success" ? "戒指连接已完成" : "查看戒指连接进度"}</strong><small>${binding().status === "success" ? "继续完成接下来的设置" : "继续查看这次操作，不会重复绑定"}</small></div><span>›</span></button>` : "";
    }
    function forgetCurrent() {
      const id = state.pairedDevice?.id || "ring7a21";
      delete state.deviceBindings[id];
      if (binding()?.target.id === id) { state.deviceBinding = null; clearIntent = null; }
    }
    return { prepare, resume, page, handleAction, reviewControls, unresolved, resumeRoute, resumeEntry, back, forgetCurrent, ownedCount: () => Object.values(state.deviceBindings).filter(item => item.accountRef === account()).length };
  };
})();
