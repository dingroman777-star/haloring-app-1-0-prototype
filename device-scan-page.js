(function () {
  // Local prototype only. Native adapters own real scan cancellation, deduplication and freshness.
  window.createHaloDeviceScan = function ({ state, go, render, persist, track, blocker, modalRoot, closeModal, showPermissionHelp }) {
    const fixtures = { ring7a21: { id: "ring7a21", suffix: "7A21", signal: "strong" }, ring8c54: { id: "ring8c54", suffix: "8C54", signal: "strong" }, ring2f09: { id: "ring2f09", suffix: "2F09", signal: "weak" } };
    const outcomes = [["single", "一枚戒指"], ["multiple", "多枚戒指"], ["weak", "信号较弱"], ["empty", "未找到"], ["failed", "查找失败"], ["bluetooth-off", "蓝牙关闭"], ["denied", "权限撤回"]];
    let timer = null, reviewOutcome = "single";
    const saved = state.deviceScan;
    state.deviceScan = saved?.version === 1 && ["idle", "scanning", "found", "empty", "failed", "cancelled", "interrupted"].includes(saved.status)
      ? { ...saved, results: Array.isArray(saved.results) ? [...new Set(saved.results)].filter(id => fixtures[id]) : [] }
      : { version: 1, status: "idle", request: null, results: [], selectedId: "", handoff: false };
    const scan = () => state.deviceScan;
    if (!scan().results.includes(scan().selectedId)) { scan().selectedId = ""; scan().handoff = false; }
    if (scan().status === "scanning" && (!Number.isFinite(scan().request?.readyAt) || !outcomes.some(([id]) => id === scan().request?.outcome))) {
      scan().status = "failed"; scan().request = null; scan().results = []; scan().selectedId = ""; scan().handoff = false;
    }
    function unavailable() {
      const busy = blocker();
      if (busy) return { reason: "busy", title: busy[0], body: busy[1], action: "scan-back", label: "返回连接准备" };
      if (state.connectionIntro.permission === "denied") return { reason: "denied", title: "还未允许使用蓝牙", body: "允许 Halo 使用蓝牙后，再继续查找。", action: "scan-permission", label: "查看开启方法" };
      if (state.connectionIntro.permission === "bluetooth-off" || state.connectionIntro.permission === "granted" && !state.toggles.bluetooth) return { reason: "bluetooth-off", title: "手机蓝牙已关闭", body: "开启手机蓝牙后，再继续查找。", action: "scan-permission", label: "查看开启方法" };
      if (state.connectionIntro.permission !== "granted" || state.connectionIntro.request?.status === "checking") return { reason: "permission", title: "先检查蓝牙", body: "准备好连接权限后，就可以查找附近的戒指。", action: "scan-back", label: "返回连接准备" };
      return null;
    }
    function clearSelection() { scan().results = []; scan().selectedId = ""; scan().handoff = false; }
    function interrupt(reason) {
      if (scan().status === "interrupted" && scan().reason === reason) return;
      scan().status = "interrupted"; scan().reason = reason; clearSelection();
      track("device_scan_interrupted", { source_page: "DEV-02", reason, simulated: true }); persist();
    }
    function prepare() {
      if (state.current !== "DEV-02") return;
      const issue = unavailable();
      if (issue && ["scanning", "found"].includes(scan().status)) interrupt(issue.reason);
      else if (scan().status === "found" && !fresh()) interrupt("stale");
    }
    function fresh() { return Number.isFinite(scan().finishedAt) && Date.now() - scan().finishedAt < 60000; }
    function selected() { return scan().results.includes(scan().selectedId) ? fixtures[scan().selectedId] : null; }
    function start() {
      if (!state.signedIn || unavailable() || scan().status === "scanning") return false;
      const now = Date.now();
      state.deviceScan = { version: 1, status: "scanning", results: [], selectedId: "", handoff: false, request: { id: `scan-${now}-${Math.random().toString(36).slice(2, 7)}`, startedAt: now, readyAt: now + 1600, outcome: reviewOutcome } };
      track("device_scan_started", { source_page: "DEV-02", request_id: scan().request.id, simulated: true }); persist(); return true;
    }
    function resume() {
      clearTimeout(timer); timer = null;
      if (scan().status !== "scanning") return;
      const request = scan().request;
      timer = setTimeout(() => {
        timer = null;
        if (scan().status !== "scanning" || scan().request?.id !== request.id) return;
        const issue = unavailable();
        if (issue) interrupt(issue.reason);
        else if (["denied", "bluetooth-off"].includes(request.outcome)) {
          state.connectionIntro.permission = request.outcome; state.toggles.bluetooth = false; interrupt(request.outcome);
        } else {
          scan().results = ({ single: ["ring7a21"], multiple: ["ring7a21", "ring8c54", "ring2f09"], weak: ["ring2f09"] })[request.outcome] || [];
          scan().status = request.outcome === "failed" ? "failed" : scan().results.length ? "found" : "empty";
          // A delayed/cold-start callback must not turn old nearby-device results into fresh ones.
          scan().finishedAt = request.readyAt;
          track("device_scan_completed", { source_page: "DEV-02", request_id: request.id, result: scan().status, result_count: scan().results.length, simulated: true }); persist();
        }
        if (state.current === "DEV-02") render();
      }, Math.max(0, request.readyAt - Date.now()));
    }
    function cancel() {
      clearTimeout(timer); timer = null;
      if (scan().status === "scanning") track("device_scan_cancelled", { source_page: "DEV-02", request_id: scan().request.id, simulated: true });
      scan().status = "cancelled"; clearSelection(); persist();
    }
    function back(permissionHelp = false) {
      cancel();
      const stack = state.tabStacks["MY-01"];
      if (stack?.at(-1) === "DEV-02") stack.pop();
      if (permissionHelp) { closeModal(); go("DEV-01", false); showPermissionHelp(); return; }
      if (history.state?.trail?.at(-2) === "DEV-01") { history.back(); return; }
      go("DEV-01", false);
    }
    function body() {
      const issue = unavailable(), status = scan().status, found = !issue && status === "found", searching = !issue && status === "scanning";
      const copy = issue || ({
        idle: { title: "查找你的戒指", body: "把戒指放在手机旁，再开始查找。" },
        scanning: { title: "正在查找戒指", body: "请把戒指放在手机旁。" },
        found: { title: "选择你的戒指", body: "请核对设备尾号，再继续。" },
        empty: { title: "暂时没找到戒指", body: "确认戒指有电，放近手机后再试一次。" },
        failed: { title: "这次查找未完成", body: "请重新查找，已有记录不会受影响。" },
        cancelled: { title: "已停止查找", body: "准备好后，可以重新查找。" },
        interrupted: { title: "请重新查找", body: "附近设备可能已变化，请更新后再选择。" }
      })[status];
      const icon = `<img src="assets/HALORING_super_symbol_copper.png" alt="" width="54" height="72">`;
      const list = found ? `<section class="device-scan-results" aria-label="附近戒指"><div class="device-scan-result-heading"><span>找到 ${scan().results.length} 枚戒指</span><button type="button" class="text-button" data-action="scan-retry">重新查找</button></div><div role="group" aria-label="选择戒指">${scan().results.map(id => {
        const device = fixtures[id], checked = scan().selectedId === id;
        return `<button type="button" class="device-scan-option" data-action="scan-select:${id}" aria-pressed="${checked}" aria-label="选择 Halo Ring，尾号 ${device.suffix}"><span class="device-scan-option-mark">${icon}</span><span class="device-scan-option-copy"><strong>Halo Ring</strong><span>尾号 ${device.suffix}</span><small>${device.signal === "weak" ? "信号较弱 · 请把戒指放近" : "信号较强"}</small></span><span class="device-scan-radio" aria-hidden="true"></span></button>`;
      }).join("")}</div></section>` : `<div class="device-scan-visual ${searching ? "is-searching" : ""}" aria-hidden="true">${icon}</div>`;
      return `<section class="device-scan-page" data-scan-state="${issue ? issue.reason : status}" aria-labelledby="device-scan-title"><button type="button" class="device-guide-back" data-action="scan-back" aria-label="返回连接准备"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5-7 7 7 7"/></svg></button><header class="device-guide-heading" role="status"><h1 id="device-scan-title">${copy.title}</h1><p>${copy.body}</p></header>${list}<footer class="device-guide-actions">${found ? `<button type="button" class="primary" data-action="scan-continue" ${selected() ? "" : "disabled"}>${selected() ? "继续" : "选择后继续"}</button>` : searching ? '<button type="button" class="secondary" data-action="scan-stop">停止查找</button>' : `<button type="button" class="primary" data-action="${issue?.action || "scan-retry"}">${issue?.label || (status === "idle" ? "开始查找" : "重新查找")}</button>`}<button type="button" class="text-button" data-action="scan-help">连接帮助</button></footer></section>`;
    }
    function handleAction(action) {
      if (action.startsWith("scan-review:")) {
        const value = action.slice(12);
        if (outcomes.some(([id]) => id === value) && scan().status !== "scanning") { reviewOutcome = value; render(); }
        return true;
      }
      if (!action.startsWith("scan-")) return false;
      if (state.current !== "DEV-02" || !state.signedIn) return true;
      if (action === "scan-back") back();
      if (action === "scan-permission") back(true);
      if (action === "scan-stop") { cancel(); render(); }
      if (action === "scan-retry") { start(); render(); }
      if (action.startsWith("scan-select:")) {
        prepare(); const id = action.slice(12);
        if (!unavailable() && scan().status === "found" && scan().results.includes(id) && fresh()) {
          scan().selectedId = id; scan().handoff = false;
          track("device_scan_selected", { source_page: "DEV-02", request_id: scan().request.id, simulated: true });
        }
        render();
      }
      if (action === "scan-continue") {
        prepare();
        if (unavailable() || !selected() || scan().status !== "found" || !fresh()) { render(); return true; }
        scan().handoff = true; persist();
        track("device_scan_selection_confirmed", { source_page: "DEV-02", destination: "DEV-03", simulated: true });
        go("DEV-03");
      }
      if (action === "scan-help") {
        track("device_scan_help_opened", { source_page: "DEV-02", simulated: true });
        modalRoot.innerHTML = '<div class="modal-backdrop"><section class="modal info-modal connection-permission-modal" role="dialog" aria-modal="true" aria-labelledby="device-scan-help-title"><h2 id="device-scan-help-title">找不到自己的戒指？</h2><ul class="device-guide-help-list"><li><strong>把戒指放近手机</strong><p>确认戒指有电，并保持在手机旁。</p></li><li><strong>附近有多枚戒指</strong><p>尾号用于区分设备。若不确定，先把其他戒指移远，再重新查找。</p></li><li><strong>检查蓝牙</strong><p>确认手机蓝牙已开启，并允许 Halo 使用蓝牙。</p></li></ul><div class="connection-permission-actions"><button class="primary" data-action="close-modal">返回查找</button><button class="text-button" data-action="scan-back">返回连接准备</button></div></section></div>';
      }
      if (["scan-back", "scan-stop", "scan-retry"].includes(action)) closeModal();
      return true;
    }
    function reviewControls(item) {
      if (item.id !== "DEV-02") return "";
      return `<section class="review-controls"><p>SCAN REVIEW</p><h3>扫描结果审阅</h3><small>仅本地模拟；不会扫描真实蓝牙。选择下一次结果后，在手机内重新查找。演示用时 1.6 秒，结果 60 秒后需更新；生产以适配器回调为准。</small><div class="review-control-group"><strong>下一次查找结果</strong><div>${outcomes.map(([id, label]) => `<button data-action="scan-review:${id}" class="${reviewOutcome === id ? "active" : ""}" ${scan().status === "scanning" ? "disabled" : ""}>${label}</button>`).join("")}</div></div></section>`;
    }
    return { start, prepare, resume, body, handleAction, reviewControls, back, selected, fresh, unavailable, canConfirm: () => Boolean(scan().handoff && selected() && fresh() && !unavailable()) };
  };
})();
