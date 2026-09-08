/* DEV-11. Local simulated SDK receipts; no Bluetooth, firmware or network API is called. */
(() => {
  window.createHaloDeviceInfo = function ({ state, go, render, persist, track, esc, symbol, showInfoModal, closeModal, binding, initialSync, maintenance }) {
    let timer = null;
    let scheduled = "";
    let reviewOutcome = "success";
    let reviewBattery = "ready";
    const object = v => v !== null && typeof v === "object" && !Array.isArray(v);
    const account = () => String(state.authPhone || state.authForm?.phone || "local-demo");
    const currentId = () => String(state.pairedDevice?.id || "");
    const owned = (id, ref = account()) => Object.values(state.deviceBindings || {}).find(v => v && String(v.id) === id && v.accountRef === ref);
    const root = () => state.deviceFirmware;
    const devices = () => root().accounts[account()].devices;
    const device = () => devices()[currentId()];
    const validTime = v => typeof v === "string" && Number.isFinite(Date.parse(v)) && Date.parse(v) <= Date.now() + 1000;
    const validVersion = v => typeof v === "string" && /^\d{1,4}\.\d{1,4}\.\d{1,4}$/.test(v);
    const newer = (a, b) => { if (!validVersion(a) || !validVersion(b)) return false; const x = a.split(".").map(Number), y = b.split(".").map(Number); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i]; return false; };
    const hasBattery = d => typeof d?.batteryPercent === "number" && Number.isFinite(d.batteryPercent) && d.batteryPercent >= 0 && d.batteryPercent <= 100;
    // Prototype receipt freshness only. Production freshness/eligibility comes from the SDK.
    const fresh = v => validTime(v) && Date.now() - Date.parse(v) < 5 * 60 * 1000;
    const phases = ["checking", "downloading", "transferring", "installing", "confirming"];
    const durations = { checking: 900, downloading: 1400, transferring: 1800, installing: 1800, confirming: 900 };
    const pending = r => r?.status === "pending";
    const requests = () => Object.values(root()?.accounts || {}).flatMap(a => Object.values(a?.devices || {}).map(d => d?.request).filter(Boolean));
    const isBusy = () => requests().some(r => r.accountRef === account() && pending(r));
    const unresolved = () => Object.entries(root()?.accounts?.[account()]?.devices || {}).some(([id, d]) => owned(id) && d?.requiresReadback);
    const emit = (name, r, values = {}) => track?.(name, { source_page: "DEV-11", simulated: true, operation_id: r?.id, device_id: r?.targetId, phase: r?.phase, ...values });
    const permissionBlocked = () => state.toggles?.bluetooth === false || ["denied", "bluetooth-off", "not-requested"].includes(state.connectionIntro?.permission);
    const battery = d => typeof d?.batteryPercent === "number" && d.batteryPercent >= 0 && d.batteryPercent <= 100 && validTime(d.batteryRecordedAt) ? `${Math.round(d.batteryPercent)}%` : "待读取";
    const button = (text, action, style = "primary", disabled = false) => `<button type="button" class="${style}" data-action="devinfo:${esc(action)}"${disabled ? " disabled" : ""}>${esc(text)}</button>`;
    const icon = type => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${({ back: "m14 5-7 7 7 7", check: "m5 12 4 4L19 6", update: "M12 16V4m-4 4 4-4 4 4M5 15v5h14v-5", clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0", alert: "M12 7v6m0 3v1M12 3 2 21h20Z", heart: "M20 5c-3-3-6-1-8 1-2-2-5-4-8-1-4 4 1 9 8 15 7-6 12-11 8-15", moon: "M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11", wave: "M2 12h4l3-7 5 14 3-7h5", walk: "M13 3h1m-5 9 3-6 4 6h4M12 6v9l-5 6m5-6 5 6" })[type] || "M5 12h14"}"/></svg>`;

    function prepare() {
      let changed = false;
      if (!object(state.deviceFirmware) || state.deviceFirmware.version !== 1) {
        // Legacy global status has no device-owned receipt. Never import it as a version.
        state.deviceFirmware = { version: 1, accounts: {} }; changed = true;
      }
      if (!object(root().accounts)) { root().accounts = {}; changed = true; }
      if (!object(root().accounts[account()])) { root().accounts[account()] = { devices: {} }; changed = true; }
      if (!object(root().accounts[account()].devices)) { root().accounts[account()].devices = {}; changed = true; }
      if (owned(currentId()) && !object(device())) { devices()[currentId()] = { installedVersion: null, checkStatus: "unchecked", eligibility: "unknown", requiresReadback: false, request: null }; changed = true; }
      for (const [ref, a] of Object.entries(root().accounts)) {
        if (!object(a) || !object(a.devices)) { root().accounts[ref] = { devices: {} }; changed = true; continue; }
        for (const [id, d] of Object.entries(a.devices)) {
          if (!object(d)) { delete a.devices[id]; changed = true; continue; }
          const r = d.request;
          if (d.checkStatus === "available" && !newer(d.availableVersion, d.installedVersion)) { d.checkStatus = "unchecked"; d.availableVersion = null; d.eligibility = "unknown"; d.error = "版本信息需要重新读取，请检查更新。"; changed = true; }
          if (r && (!object(r) || r.accountRef !== ref || r.targetId !== id || typeof r.id !== "string" || !r.id || !["check", "update"].includes(r.kind) || !phases.includes(r.phase) || (r.kind === "check" ? r.phase !== "checking" : r.phase === "checking") || !["pending", "complete", "failed", "uncertain"].includes(r.status) || !Number.isFinite(r.readyAt) || r.readyAt > Date.now() + 120000 || !["success", "check-failed", "download-failed", "install-uncertain"].includes(r.outcome) || !["ready", "low", "unknown"].includes(r.batteryFixture) || (r.kind === "update" && !newer(r.targetVersion, r.previousVersion)))) {
            d.request = null; d.checkStatus = "failed"; d.requiresReadback = true;
            d.error = "上次更新的结果还未确认，请先读取设备状态。"; changed = true;
          }
        }
      }
      // Compatibility lock only, never a source for an installed version.
      const lock = isBusy() ? "verifying" : "idle";
      if (state.firmwareStatus !== lock) { state.firmwareStatus = lock; changed = true; }
      if (changed) persist();
    }
    function connectionIssue(targetId = currentId()) {
      if (maintenance?.()?.blocks()) return { text: "请先确认这次设备操作的结果。", label: "查看设备操作", route: "DEV-12" };
      if (!state.signedIn || state.accountDeletionStatus === "submitted") return { text: "请先登录，再管理设备。", label: "返回登录", route: "AUTH-01" };
      if (!owned(targetId) || state.membershipHardwareState !== "active") return { text: "请先连接并激活这枚戒指。", label: "查看我的设备", route: "DEV-10" };
      if (initialSync?.()?.isBusy()) return { text: "首次设置还在进行，完成后再检查更新。", label: "查看首次设置", route: "DEV-05" };
      if (initialSync?.()?.needsSetup(targetId)) return { text: "这枚戒指还未完成首次设置。", label: "继续设置", route: "DEV-05" };
      const item = owned(targetId), f = state.deviceHub?.accounts?.[account()]?.facts?.[targetId] || {};
      const newlyBound = state.deviceBinding?.kind === "new" && state.deviceBinding.status === "success" && state.deviceBinding.target?.id === targetId;
      if (!validTime(f.activatedAt) && !validTime(item.activatedAt) && (validTime(item.boundAt) ? !validTime(f.lastSyncedAt) || Date.parse(f.lastSyncedAt) < Date.parse(item.boundAt) : newlyBound)) return { text: "这枚戒指还未完成首次激活。", label: "继续激活", route: "DEV-05" };
      if (permissionBlocked()) return { text: "蓝牙尚未开启或未获允许。", label: "查看权限设置", route: "PERM-01" };
      if (targetId !== currentId() || !["connected", "low"].includes(state.deviceStatus)) return { text: "戒指暂未连接，请把它放在手机附近。", label: "查看连接", route: "DEV-10" };
      if (state.deviceHub?.request?.status === "pending" || state.activitySync?.request?.status === "pending") return { text: "正在连接或同步，完成后再检查更新。", label: "查看我的设备", route: "DEV-10" };
      if (binding?.unresolved?.()) return { text: "请先确认上次连接的结果。", label: "查看连接结果", route: "DEV-03" };
      if (state.deviceScan?.status === "scanning") return { text: "正在查找戒指，请先完成或退出查找。", label: "查看查找进度", route: "DEV-02" };
      if (state.deviceResetStatus === "pending") return { text: "请先确认设备重置的结果。", label: "查看设备操作", route: "DEV-12" };
      if (state.measurementStatus === "running") return { text: "测量还在进行，结束后再检查更新。", label: "查看当前测量", route: "HLT-03" };
      return null;
    }
    function start(kind) {
      const d = device();
      const issue = connectionIssue();
      if (issue) return showInfoModal("暂时不能继续", issue.text, issue.label, `go:${issue.route}`);
      if (!d || isBusy()) return;
      if (kind === "update" && (unresolved() || d.checkStatus !== "available" || !newer(d.availableVersion, d.installedVersion))) return;
      if (kind === "check" && d.requiresReadback && d.request?.kind === "update") return queryResult();
      if (navigator.onLine === false) return showInfoModal("网络暂未连接", "连接网络后，再检查或下载更新。", "知道了", "close-modal");
      if (kind === "update" && (!fresh(d.checkedAt) || !fresh(d.batteryRecordedAt) || !hasBattery(d))) return showInfoModal("先确认设备状态", "电量或版本信息需要重新读取。", "重新检查", "devinfo:check");
      if (kind === "update" && (d.eligibility !== "ready" || state.deviceStatus === "low")) return showInfoModal("暂时不能更新", d.eligibility === "low" || state.deviceStatus === "low" ? "请先给戒指充电，再重新检查。" : "还没读到完整的电量信息，请重新检查。", "重新检查", "devinfo:check");
      const now = Date.now();
      d.request = { id: `firmware-${now}-${Math.random().toString(36).slice(2, 8)}`, accountRef: account(), targetId: currentId(), kind, phase: kind === "check" ? "checking" : "downloading", targetVersion: kind === "update" ? d.availableVersion : null, previousVersion: d.installedVersion, status: "pending", startedAt: now, readyAt: now + durations[kind === "check" ? "checking" : "downloading"], outcome: reviewOutcome, batteryFixture: reviewBattery };
      d.error = ""; closeModal(); emit("device_firmware_started", d.request); persist(); render();
    }
    function queryResult() {
      const d = device(), r = d?.request, issue = connectionIssue();
      if (issue) return showInfoModal("先连接戒指", issue.text, issue.label, `go:${issue.route}`);
      if (isBusy() || !d?.requiresReadback) return;
      if (!r || r.kind !== "update") return startReadback();
      // Query the same operation, never submit the install a second time.
      r.status = "pending"; r.phase = "confirming"; r.readyAt = Date.now() + durations.confirming;
      r.queryOnly = true; d.error = ""; emit("device_firmware_result_requested", r); persist(); render();
    }
    function startReadback() {
      // A corrupt/legacy record has no safe operation ID; only a fresh device read is allowed.
      const d = device();
      if (!d || isBusy()) return;
      const now = Date.now();
      d.request = { id: `firmware-read-${now}`, accountRef: account(), targetId: currentId(), kind: "check", phase: "checking", targetVersion: null, status: "pending", startedAt: now, readyAt: now + durations.checking, outcome: reviewOutcome, batteryFixture: reviewBattery };
      d.error = ""; persist(); render();
    }
    function stop(d, r, text, uncertain = false) {
      r.status = uncertain ? "uncertain" : "failed";
      r.completedAt = new Date().toISOString();
      d.error = text; d.requiresReadback = uncertain || d.requiresReadback;
      if (r.kind === "check") d.checkStatus = "failed";
      emit("device_firmware_interrupted", r, { status: r.status });
    }
    function receipt(d, r) {
      const now = new Date().toISOString();
      // All values below are local mock SDK responses, not inferred real device facts.
      if (!object(d.mockDevice)) d.mockDevice = { version: validVersion(d.installedVersion) ? d.installedVersion : "1.0.8" };
      const value = d.mockDevice.version;
      if (!validVersion(value)) { stop(d, r, "暂时读不到设备版本，请保持连接后重试。", true); return; }
      d.installedVersion = value; d.versionReadAt = now; d.hardwareVersion = "R01";
      d.batteryPercent = r.batteryFixture === "unknown" ? null : r.batteryFixture === "low" ? 12 : 76;
      d.batteryRecordedAt = r.batteryFixture === "unknown" ? null : now;
      // The boolean eligibility receipt is supplied by the mocked SDK. No production percentage threshold is invented.
      d.eligibility = r.batteryFixture;
      if (r.batteryFixture === "low") state.deviceStatus = "low";
      else if (r.batteryFixture === "ready" && state.deviceStatus === "low") state.deviceStatus = "connected";
      d.checkedAt = now; d.availableVersion = newer("1.1.0", value) ? "1.1.0" : null;
      d.checkStatus = d.availableVersion ? "available" : "current"; d.requiresReadback = false;
      d.capabilities = ["睡眠", "心率", "HRV", "呼吸率", "活动"];
      const f = state.deviceHub?.accounts?.[r.accountRef]?.facts;
      if (object(f)) f[r.targetId] = { ...(object(f[r.targetId]) ? f[r.targetId] : {}), batteryPercent: d.batteryPercent, batteryRecordedAt: d.batteryRecordedAt };
      r.status = "complete"; r.completedAt = now;
      d.error = r.kind === "update" && value !== r.targetVersion ? "已确认设备仍是原版本，可以重新尝试更新。" : "";
      emit("device_firmware_receipt_received", r, { result: d.checkStatus, installed_version: value });
    }
    function advance(ref, id, requestId) {
      const d = root()?.accounts?.[ref]?.devices?.[id], r = d?.request;
      if (!pending(r) || r.id !== requestId) return;
      let issue = ref !== account() ? { text: "登录状态已改变，请重新登录后确认结果。" } : connectionIssue(id);
      if (navigator.onLine === false && ["checking", "downloading"].includes(r.phase)) issue = { text: "网络连接中断，请联网后重试。设备尚未开始安装。" };
      if (r.kind === "update" && r.phase !== "confirming" && state.deviceStatus === "low") issue = { text: "戒指电量不足，请充电后再确认进度。" };
      if (issue) {
        stop(d, r, issue.text, r.kind === "update" && ["installing", "confirming"].includes(r.phase));
        persist(); render(); return;
      }
      if (Date.now() < r.readyAt) return;
      if (r.phase === "checking") {
        if (r.outcome === "check-failed") stop(d, r, "这次没能读到更新信息，请保持连接后重试。");
        else receipt(d, r);
      } else if (r.phase === "downloading" && r.outcome === "download-failed") {
        stop(d, r, "更新文件没有下载完成，请重试。设备尚未开始安装。");
      } else if (r.phase === "confirming") {
        receipt(d, r);
      } else {
        if (r.phase === "installing") {
          d.mockDevice = { ...(d.mockDevice || {}), version: r.targetVersion };
          d.requiresReadback = true;
          if (r.outcome === "install-uncertain" && !r.queryOnly) {
            stop(d, r, "还没收到安装结果，请先确认设备状态，不要重复更新。", true);
            persist(); render(); return;
          }
        }
        r.phase = phases[phases.indexOf(r.phase) + 1];
        r.readyAt = Date.now() + durations[r.phase];
        emit("device_firmware_phase_changed", r);
      }
      persist(); render();
    }
    function resume() {
      if (timer) clearTimeout(timer);
      timer = null; scheduled = "";
      const r = requests().find(pending);
      if (!r) return;
      const invalidContext = r.accountRef !== account() || !state.signedIn || !owned(r.targetId) || r.targetId !== currentId() || permissionBlocked() || !["connected", "low"].includes(state.deviceStatus);
      scheduled = r.id;
      timer = setTimeout(() => { const id = scheduled; scheduled = ""; timer = null; advance(r.accountRef, r.targetId, id); }, invalidContext ? 0 : Math.max(0, r.readyAt - Date.now()));
    }
    function panel(d) {
      const r = d?.request, busy = pending(r), issue = connectionIssue();
      let title = "检查固件更新", copy = "连接戒指后，读取版本和电量。", action = "check", label = "检查更新", status = "unchecked", detail = "", blocked = false;
      if (d?.checkStatus === "available") { title = "有新版本可更新"; copy = "开始前，请把戒指放在手机附近。"; label = "开始更新"; action = "start"; status = "available"; }
      if (d?.checkStatus === "current") { title = "已是最新版本"; copy = "当前没有需要安装的更新。"; label = "再次检查"; status = "current"; }
      if (d?.error) { title = d.requiresReadback ? "需要确认更新结果" : r?.kind === "update" ? "更新未完成" : "暂未检查成功"; copy = d.error; action = d.requiresReadback ? "query" : r?.kind === "update" && d.checkStatus === "available" ? "start" : "check"; label = d.requiresReadback ? "确认更新结果" : action === "start" ? "重新尝试" : "重新检查"; status = "failed"; }
      if (d?.requiresReadback && !d.error) { title = "需要确认设备状态"; copy = "读取当前版本后，再决定是否更新。"; label = "读取设备状态"; action = "query"; status = "failed"; }
      if (!busy && action === "start") {
        if (!fresh(d.checkedAt) || !fresh(d.batteryRecordedAt) || !hasBattery(d) || d.eligibility === "unknown") { copy = "电量或版本信息需要重新读取。"; action = "check"; label = "重新检查"; }
        else if (d.eligibility === "low" || state.deviceStatus === "low") { copy = "请先给戒指充电，再重新检查。"; action = "check"; label = "充电后重新检查"; status = "blocked"; }
      }
      if (!busy && issue) { title = "连接后再检查更新"; copy = issue.text; label = issue.label; action = `route:${issue.route}`; status = "blocked"; }
      if (!busy && !issue && !d?.requiresReadback && navigator.onLine === false) { title = "联网后再检查更新"; copy = "网络暂未连接，联网后可以继续。"; label = "等待网络连接"; blocked = true; status = "blocked"; }
      if (busy) {
        const stages = { checking: ["正在检查更新", "正在读取版本与电量，请稍候。", 0], downloading: ["正在下载更新", "请保持手机联网，稍等片刻。", 20], transferring: ["正在传送到戒指", "请保持蓝牙开启，让戒指靠近手机。", 45], installing: ["正在安装更新", "请保持 App 打开，不要断开戒指。", 75], confirming: ["正在确认设备版本", "读取结果后，会在这里告诉你。", 95] };
        [title, copy] = stages[r.phase];
        label = r.phase === "checking" ? "检查中…" : "更新进行中…"; blocked = true; status = r.phase;
        if (r.phase !== "checking") detail = `<div class="device-info-progress" role="progressbar" aria-label="更新阶段进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${stages[r.phase][2]}"><i style="width:${stages[r.phase][2]}%"></i></div><ol class="device-info-steps">${[["downloading", "下载"], ["transferring", "传送"], ["installing", "安装"], ["confirming", "确认"]].map(([p, text]) => `<li${p === r.phase ? ' aria-current="step"' : ""} data-done="${phases.indexOf(p) < phases.indexOf(r.phase)}">${text}</li>`).join("")}</ol>`;
      }
      const version = validVersion(d?.installedVersion) && !d.requiresReadback ? d.installedVersion : "待读取";
      const comparison = status === "available" ? `<div class="device-info-version"><span>${esc(version)}</span><span aria-hidden="true">→</span><strong>${esc(d.availableVersion)}</strong></div>` : "";
      return `<section class="device-info-update" data-status="${status}" aria-busy="${busy}"><div class="device-info-status"><span class="device-info-status-icon">${icon(busy ? "clock" : status === "current" ? "check" : ["failed", "blocked"].includes(status) ? "alert" : "update")}</span><div><small>固件更新</small><h2>${esc(title)}</h2></div></div><p class="device-info-copy" role="status">${esc(copy)}</p>${comparison}${detail}<div class="device-info-actions">${button(label, action, "primary", blocked)}${button("更新帮助", "help", "text-button")}</div></section>`;
    }
    function body() {
      const d = device(), item = owned(currentId());
      const connection = permissionBlocked() || !["connected", "low"].includes(state.deviceStatus) ? "未连接" : "已连接";
      const version = d?.requiresReadback ? "待确认" : validVersion(d?.installedVersion) ? d.installedVersion : "待读取";
      const capabilities = Array.isArray(d?.capabilities) ? d.capabilities : [];
      return `<section class="device-info"><header class="device-info-header"><button type="button" data-action="previous" aria-label="返回我的设备">${icon("back")}</button><h1>设备信息</h1><span></span></header><section class="device-info-identity"><img src="${symbol}" alt="" width="32" height="44"><div><strong>Halo Ring</strong><span>${item?.suffix ? `尾号 ${esc(item.suffix)}` : "尚未选择设备"}</span></div><small class="connection" data-connected="${connection === "已连接"}">${connection}</small></section><dl class="device-info-facts">${[["戒指电量", battery(d) + (d?.batteryRecordedAt && !fresh(d.batteryRecordedAt) ? " · 待刷新" : "")], ["已安装版本", version], ["硬件型号", d?.hardwareVersion || "待读取"], ["绑定账号", item ? "当前账号" : "待确认"]].map(([title, value]) => `<div><dt>${esc(title)}</dt><dd>${esc(value)}</dd></div>`).join("")}</dl>${panel(d)}<section class="device-info-capabilities"><h2>支持的数据类型</h2>${capabilities.length ? `<div class="device-info-chips">${capabilities.map((name, i) => `<span>${icon(["moon", "heart", "wave", "wave", "walk"][i])}${esc(name)}</span>`).join("")}</div><p class="device-info-footnote">具体记录以设备支持和实际采集为准。</p>` : '<p class="device-info-footnote">检查更新时，一并读取设备支持的数据类型。</p>'}</section></section>`;
    }
    function handleAction(action) {
      // Old stage controls no longer write state, even if invoked from a stale page.
      if (action.startsWith("firmware:")) return true;
      if (!action.startsWith("devinfo:")) return false;
      prepare();
      if (state.current !== "DEV-11") return true;
      if (action.startsWith("devinfo:review:")) {
        const [, , kind, value] = action.split(":");
        if (!isBusy()) {
          if (kind === "outcome" && ["success", "check-failed", "download-failed", "install-uncertain"].includes(value)) reviewOutcome = value;
          if (kind === "battery" && ["ready", "low", "unknown"].includes(value)) reviewBattery = value;
        }
        render(); return true;
      }
      if (!state.signedIn || state.accountDeletionStatus === "submitted") return true;
      if (action === "devinfo:help") {
        showInfoModal("更新帮助", "下载中断时可以重试；传送与安装时，请保持蓝牙开启、戒指靠近手机。若暂时读不到安装结果，请先确认设备状态，不要重复更新。", "知道了", "close-modal");
        emit("device_firmware_help_opened", device()?.request); return true;
      }
      if (action.startsWith("devinfo:route:")) {
        const route = action.slice("devinfo:route:".length);
        if (["DEV-10", "DEV-12", "DEV-02", "DEV-03", "DEV-05", "PERM-01", "HLT-03", "AUTH-01"].includes(route)) go(route);
        return true;
      }
      if (action === "devinfo:check") start("check");
      if (action === "devinfo:start") start("update");
      if (action === "devinfo:query") queryResult();
      return true;
    }
    function reviewControls(item) {
      if (item.id !== "DEV-11") return "";
      const group = (kind, title, values, selected) => `<div class="review-control-group"><strong>${title}</strong><div>${values.map(([v, label]) => `<button data-action="devinfo:review:${kind}:${v}" class="${v === selected ? "active" : ""}"${isBusy() ? " disabled" : ""}>${label}</button>`).join("")}</div></div>`;
      return `<section class="review-controls"><p>DEVICE INFO REVIEW</p><h3>固件回执模拟</h3><small>本地演示，不连接真实硬件。检查约 1 秒，更新约 6 秒；阶段由模拟回执推进。电量 76% / 12% 只是示例，能否升级由模拟 SDK 资格结果决定；真实阈值、后台安装与恢复能力须 SDK 确认。旧全局状态不作为版本依据。</small>${group("outcome", "下一次操作结果", [["success", "正常完成"], ["check-failed", "检查失败"], ["download-failed", "下载失败"], ["install-uncertain", "安装结果待确认"]], reviewOutcome)}${group("battery", "下一次读取电量 / 升级资格", [["ready", "76% · 允许更新"], ["low", "12% · 需要充电"], ["unknown", "未读到电量"]], reviewBattery)}</section>`;
    }
    const onNetworkChange = () => { if (state.current === "DEV-11" || isBusy()) render(); };
    window.addEventListener("online", onNetworkChange);
    window.addEventListener("offline", onNetworkChange);
    return { prepare, resume, body, handleAction, reviewControls, isBusy, unresolved };
  };
})();
