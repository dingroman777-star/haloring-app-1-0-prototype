/* DEV-05: local simulator of domain receipts, not a BLE/health implementation. */
(() => {
  window.createHaloInitialSync = function ({ state, pages, go, render, persist, track, esc, symbol, binding, home, firmware = () => null, maintenance = () => null, saveSync, activate, finish, modalRoot, closeModal }) {
    let timer = null;
    let source = "DEV-10";
    let reviewOutcome = "success";
    const steps = ["reading", "saving", "activating"];
    const labels = ["读取戒指", "保存记录", "完成设置"];
    const account = () => String(state.authPhone || state.authForm?.phone || "");
    const deviceId = () => String(state.pairedDevice?.id || "");
    const owner = (id = deviceId()) => state.deviceBindings?.[id];
    const stamp = item => String(item?.boundAt || "");
    const signed = () => state.signedIn && state.authVerified && state.accountDeletionStatus !== "submitted" && !!account();
    const nowISO = () => new Date().toISOString();
    const validDate = at => typeof at === "string" && Number.isFinite(Date.parse(at)) && Date.parse(at) <= Date.now() + 1000;
    const owns = r => signed() && owner(r.deviceId)?.accountRef === account() && r.accountRef === account() && stamp(owner(r.deviceId)) === r.boundAt;
    const current = r => owns(r) && state.devicePaired && r.deviceId === deviceId();
    const emit = (name, r, extra = {}) => track(name, { source_page: "DEV-05", operation_id: r?.id, stage: r?.stage, simulated: true, ...extra });
    const facts = r => state.deviceHub?.accounts?.[r.accountRef]?.facts?.[r.deviceId] || {};
    const afterBinding = (at, r) => validDate(at) && (!r.boundAt || Date.parse(at) >= Date.parse(r.boundAt));
    const confirmedActivation = r => afterBinding(r.activatedAt, r) && afterBinding(facts(r).activatedAt || owner(r.deviceId)?.activatedAt, r);
    const confirmedSync = r => afterBinding(r.syncedAt, r) && afterBinding(facts(r).lastSyncedAt, r) && Date.parse(facts(r).lastSyncedAt) >= Date.parse(r.syncedAt);
    function store() {
      const old = state.initialDeviceSync;
      if (!old || old.version !== 1 || !Array.isArray(old.operations)) state.initialDeviceSync = { version: 1, operations: [] };
      return state.initialDeviceSync;
    }
    function matching(id = deviceId()) {
      return [...store().operations].reverse().find(r => r && r.version === 1 && typeof r.id === "string" && r.id && r.deviceId === id && owns(r));
    }
    const isBusy = () => store().operations.some(r => r?.status === "running" && r.request?.status === "pending");
    const needsSetup = id => { const r = matching(String(id)); return !!r && r.status !== "complete"; };
    function otherWork() {
      if (maintenance()?.blocks()) return "reset";
      if (binding.unresolved()) return "binding";
      if (firmware()?.isBusy() || firmware()?.unresolved()) return "firmware";
      if (state.deviceResetStatus === "pending") return "reset";
      if (["downloading", "verifying", "updating"].includes(state.firmwareStatus)) return "firmware";
      if (state.measurementStatus === "running") return "measurement";
      if (home()?.isBusy() || state.activitySync?.request?.status === "pending" || state.deviceScan?.status === "scanning" || state.connectionIntro?.request?.status === "checking") return "busy";
      return "";
    }
    function blocker(r, kind = r.stage) {
      if (!current(r)) return "identity";
      const other = otherWork();
      if (other) return other;
      // Once reading has a receipt, local saving does not require a continuing BLE connection.
      if (["reading", "reconnect"].includes(kind)) {
        if (!state.toggles.bluetooth || state.connectionIntro.permission !== "granted") return "permission";
        if (kind !== "reconnect" && !["connected", "low"].includes(state.deviceStatus)) return "disconnected";
      }
      if (kind === "activating" && navigator.onLine === false) return "network";
      return "";
    }
    function create() {
      if (!signed() || !state.devicePaired || !deviceId() || owner()?.accountRef !== account()) return null;
      const known = pages.some(p => p.id === source) && !/^(DEV-0[1-5]|ONB-|AUTH-|SYS-)/.test(source);
      const r = { version: 1, id: `initial-sync-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, accountRef: account(), deviceId: deviceId(), boundAt: stamp(owner()), source, returnRoute: known ? source : "DEV-10", createdAt: nowISO(), stage: "reading", status: "ready", request: null, readAt: "", syncedAt: "", activatedAt: "", continuedAt: "", error: "", helpReturn: false, outcome: reviewOutcome };
      const receipt = state.deviceHub?.accounts?.[account()]?.facts?.[r.deviceId];
      const activationAt = receipt?.activatedAt || owner()?.activatedAt;
      if (state.membershipHardwareState === "active" && validDate(activationAt) && (!r.boundAt || Date.parse(activationAt) >= Date.parse(r.boundAt))) {
        r.status = "complete"; r.stage = "complete"; r.activatedAt = activationAt; r.syncedAt = receipt?.lastSyncedAt || "";
      }
      store().operations.push(r); emit("device_initial_sync_viewed", r); return r;
    }
    function block(r, reason) {
      if (r.request?.status === "pending") { r.request.status = "failed"; r.request.reason = reason; }
      r.status = "blocked"; r.error = reason; persist();
    }
    function start(r, kind = r.stage) {
      if (r.status === "complete" || r.status === "running") return;
      const reason = blocker(r, kind);
      if (reason) { block(r, reason); return; }
      const startTime = Date.now();
      const outcome = r.outcome === `${kind}-failed` ? "failed" : "success";
      r.request = { id: `${r.id}-${kind}-${startTime}`, kind, status: "pending", startedAt: startTime, readyAt: startTime + (r.outcome === "slow" ? 6000 : 1600), outcome, applied: false };
      r.status = "running"; r.error = "";
      if (kind === "reconnect") state.deviceStatus = "connecting";
      emit("device_initial_sync_step_started", r, { request_id: r.request.id, kind }); persist();
    }
    function settle(r, requestId) {
      const q = r.request;
      if (r.status !== "running" || !q || q.id !== requestId || q.applied || q.status !== "pending") return;
      const reason = blocker(r, q.kind);
      if (reason) { block(r, reason); return; }
      if (q.outcome !== "success") {
        q.status = "failed"; r.status = "failed"; r.error = q.kind === "reconnect" ? "disconnected" : "failed";
        if (q.kind === "reconnect" && current(r)) state.deviceStatus = "disconnected";
        emit("device_initial_sync_step_failed", r, { request_id: q.id }); persist(); return;
      }
      const at = nowISO();
      if (q.kind === "reconnect") { state.deviceStatus = "connected"; r.status = "ready"; }
      if (q.kind === "reading") { r.readAt = at; r.recordCount = 0; r.stage = "saving"; r.status = "ready"; }
      if (q.kind === "saving") {
        if (!r.readAt || !saveSync(r, at)) { block(r, "identity"); return; }
        r.syncedAt = at; r.stage = "activating"; r.status = "ready";
      }
      if (q.kind === "activating") {
        if (!r.syncedAt || !activate(r, at)) { block(r, "identity"); return; }
        r.activatedAt = at; r.stage = "complete"; r.status = "complete";
      }
      q.applied = true; q.status = "success";
      emit("device_initial_sync_step_completed", r, { request_id: q.id, kind: q.kind, record_count: q.kind === "reading" ? 0 : undefined }); persist();
    }
    function prepare() {
      const s = store();
      for (const r of s.operations) {
        if (!r || r.version !== 1) continue;
        if (owns(r) && !["ready", "running", "blocked", "failed", "complete"].includes(r.status)) {
          r.stage = confirmedSync(r) ? "activating" : afterBinding(r.readAt, r) ? "saving" : "reading"; block(r, "unknown");
        }
        if (owns(r) && ["blocked", "failed"].includes(r.status) && !problems[r.error]) r.error = "unknown";
        if (owns(r) && ((r.status === "complete" || r.stage === "complete") && !confirmedActivation(r) || r.syncedAt && !confirmedSync(r) || r.readAt && !afterBinding(r.readAt, r))) {
          if (!confirmedSync(r)) r.syncedAt = "";
          if (!afterBinding(r.readAt, r)) r.readAt = "";
          r.activatedAt = ""; r.stage = r.syncedAt ? "activating" : r.readAt ? "saving" : "reading"; block(r, "unknown");
        }
        if (r.status !== "running") continue;
        const q = r.request;
        if (!q || ![...steps, "reconnect"].includes(q.kind) || !Number.isFinite(q.readyAt) || q.readyAt > Date.now() + 120000 || q.applied || q.status !== "pending") block(r, "unknown");
        else if (!current(r)) block(r, "identity");
      }
      if (state.current !== "DEV-05") return;
      const r = matching() || create();
      if (!r || r.status === "complete") return;
      if (!steps.includes(r.stage)) { r.stage = r.syncedAt ? "activating" : r.readAt ? "saving" : "reading"; block(r, "unknown"); }
      if (r.status === "ready") start(r);
      if (r.status === "running") { const reason = blocker(r, r.request.kind); if (reason) block(r, reason); }
    }
    function resume() {
      clearTimeout(timer); timer = null;
      const r = store().operations.find(item => item?.status === "running" && item.request?.status === "pending");
      if (!r) return;
      const q = r.request;
      timer = setTimeout(() => {
        settle(r, q.id);
        // A live local page may finish in the background, but it never navigates for the user.
        if (r.status === "ready") start(r);
        if (["DEV-05", "DEV-10", "MY-01", "SYS-01"].includes(state.current)) render(); else { persist(); resume(); }
      }, Math.max(0, q.readyAt - Date.now()));
    }
    function enter(target, from) {
      if (target === "DEV-05" && from !== "SYS-01" && !["HELP-03", "PERM-01"].includes(from)) source = from;
      const r = matching();
      if (!r) return;
      if (target === "DEV-05" && pages.some(p => p.id === from) && !["DEV-05", "SYS-01", "AUTH-01", "AUTH-02", "HELP-03", "PERM-01"].includes(from)) r.viewSource = from;
      if (target === "HELP-03" && from !== "SYS-01") r.helpReturn = from === "DEV-05";
      else if (from === "HELP-03" && target !== "DEV-05") r.helpReturn = false;
      if (target === "PERM-01" && from !== "SYS-01") r.permissionReturn = from === "DEV-05";
      else if (from === "PERM-01" && target !== "DEV-05") r.permissionReturn = false;
    }
    function resumeRoute(prior) { const r = matching(); return r && (prior === "DEV-05" || prior === "HELP-03" && r.helpReturn || prior === "PERM-01" && r.permissionReturn) ? prior : ""; }
    function resumeSummary() {
      const r = matching();
      if (!r || r.continuedAt) return null;
      return { label: r.status === "complete" ? "设置已完成，继续" : r.status === "running" ? "查看首次同步进度" : "继续完成戒指设置", route: "DEV-05", action: "initial-sync:resume", operationId: r.id };
    }
    function resumeEntry() { const info = resumeSummary(); return info ? `<button class="setting-row" data-action="initial-sync:resume"><div><strong>${info.label}</strong><small>查看这枚戒指的设置进度</small></div><span aria-hidden="true">›</span></button>` : ""; }
    function backFromHelp() {
      const r = matching();
      if (!(state.current === "HELP-03" && r?.helpReturn || state.current === "PERM-01" && r?.permissionReturn)) return false;
      r.helpReturn = false; r.permissionReturn = false; closeModal(); go("DEV-05", false); return true;
    }
    function help() {
      modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal connection-permission-modal" role="dialog" aria-modal="true" aria-labelledby="initial-sync-help-title"><h2 id="initial-sync-help-title">同步帮助</h2><p>把戒指放在手机附近，并保持蓝牙开启。连接中断时，重新连接后可以继续。</p><p>已保存的记录会保留。新戒指还没有记录，也可以完成设置。</p><div class="connection-permission-actions"><button class="primary" data-action="initial-sync:support">联系客服</button><button class="text-button" data-action="close-modal">返回同步</button></div></section></div>`;
    }
    const problems = {
      permission: ["先开启蓝牙", "请开启手机蓝牙，并允许 Halo 使用蓝牙或访问附近设备。", "开启蓝牙", "permission"],
      disconnected: ["戒指连接中断了", "把戒指放在手机附近，重新连接后继续。", "重新连接", "reconnect"],
      network: ["还差最后一步", "同步已完成。连接网络后，继续完成设置。", "重试", "retry"],
      identity: ["请确认当前戒指", "当前连接或账号已改变，请回到设备页查看。", "查看我的戒指", "devices"],
      binding: ["连接结果还未确认", "先查看上次连接的结果，再继续设置。", "查看连接结果", "binding"],
      firmware: ["戒指正在更新", "更新完成后，再继续设置。", "重新检查", "retry"],
      measurement: ["测量还未结束", "结束当前测量后，再继续设置。", "重新检查", "retry"],
      reset: ["戒指正在重置", "重置完成后，请重新确认设备状态。", "查看我的戒指", "devices"],
      busy: ["请稍等一下", "当前连接或同步结束后，再继续设置。", "重新检查", "retry"],
      unknown: ["继续上次的设置", "先重新检查当前状态，已保存的记录会保留。", "重新检查", "retry"],
      failed: ["这一步暂时没完成", "可以重试，已完成的部分会保留。", "重试", "retry"]
    };
    function page() {
      const r = matching();
      const complete = r?.status === "complete";
      const pending = r?.status === "running";
      const reconnecting = pending && r.request.kind === "reconnect";
      const error = !r ? problems.identity : problems[r.error];
      const title = complete ? "设置完成" : reconnecting ? "正在连接戒指" : error ? error[0] : r.stage === "activating" ? "正在完成设置" : "正在同步戒指";
      const note = complete ? "Halo Ring 已准备好。" : reconnecting ? "请把戒指放在手机附近。" : error ? error[1] : r.stage === "activating" ? "同步已完成，请稍候。" : "请保持戒指在手机附近。";
      const index = complete ? 3 : steps.indexOf(r?.stage || "reading");
      const action = complete ? "continue" : error ? error[3] : "wait";
      return `<section class="initial-sync-page" data-sync-state="${esc(r?.status || "blocked")}" aria-labelledby="initial-sync-title"><button type="button" class="device-guide-back" data-action="initial-sync:back" aria-label="返回"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5-7 7 7 7"/></svg></button><div class="initial-sync-scroll"><header class="device-guide-heading"><h1 id="initial-sync-title">${title}</h1></header><div class="initial-sync-symbol ${pending ? "working" : ""}" aria-hidden="true"><img src="${symbol}" alt="">${complete ? '<span><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg></span>' : ""}</div><p class="initial-sync-note" role="status" aria-live="polite">${note}</p><ol class="initial-sync-steps" aria-label="设置进度">${labels.map((label, i) => `<li class="${i < index ? "done" : i === index ? "current" : ""}"${i === index ? ' aria-current="step"' : ''}><span class="initial-sync-step-mark" aria-hidden="true">${i < index ? '<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>' : i + 1}</span><span>${label}</span><small>${i < index ? "已完成" : i === index ? pending ? "进行中" : "待继续" : "待开始"}</small></li>`).join("")}</ol></div><footer class="device-guide-actions"><button type="button" class="primary" data-action="initial-sync:${action}"${pending ? ' disabled aria-describedby="initial-sync-title"' : ""}>${complete ? "继续" : error ? error[2] : "正在处理…"}</button>${!complete ? '<button type="button" class="secondary" data-action="initial-sync:later">稍后继续</button>' : ""}<button type="button" class="text-button" data-action="initial-sync:help">同步帮助</button></footer></section>`;
    }
    function reviewControls(item) {
      if (item.id !== "DEV-05") return "";
      return `<section class="review-controls"><p>INITIAL SYNC REVIEW</p><h3>首次同步场景</h3><small>仅原型外审阅。当前模拟空记录，不调用真实硬件；切换只影响下一次未完成步骤，不撤销已保存结果。</small><div class="review-control-group"><div>${[["success", "正常"], ["slow", "慢速"], ["reading-failed", "读取失败"], ["saving-failed", "保存失败"], ["activating-failed", "设置失败"], ["reconnect-failed", "重连失败"]].map(([value, label]) => `<button data-action="initial-sync:review:${value}" class="${matching()?.outcome === value ? "active" : ""}">${label}</button>`).join("")}</div></div></section>`;
    }
    function handle(action) {
      if (!action.startsWith("initial-sync:")) return false;
      const kind = action.slice(13);
      if (kind === "resume") {
        const pending = matching();
        if (!["MY-01", "DEV-10"].includes(state.current) || !signed() || !pending || !current(pending) || pending.continuedAt) return true;
        go("DEV-05"); return true;
      }
      if (state.current !== "DEV-05" || !signed()) return true;
      const r = matching();
      if (kind.startsWith("review:")) {
        const next = kind.slice(7);
        if (!["success", "slow", ...[...steps, "reconnect"].map(s => `${s}-failed`)].includes(next)) return true;
        reviewOutcome = next;
        if (r) { r.outcome = next; if (r.request?.status === "pending") r.request.outcome = next === `${r.request.kind}-failed` ? "failed" : "success"; }
        render(); return true;
      }
      if (kind === "help") { help(); return true; }
      if (kind === "support") { closeModal(); go("HELP-03"); return true; }
      if (kind === "devices") { go("DEV-10"); return true; }
      if (kind === "binding") { go("DEV-03"); return true; }
      if (kind === "permission") { go("PERM-01"); return true; }
      if (kind === "back" || kind === "later") {
        const viewSource = pages.some(p => p.id === r?.viewSource) && !["DEV-05", "SYS-01", "AUTH-01", "AUTH-02", "HELP-03", "PERM-01"].includes(r.viewSource) ? r.viewSource : r?.source === "DEV-04" ? "DEV-04" : r?.returnRoute || "DEV-10";
        closeModal(); go(kind === "later" ? "TOD-01" : viewSource, false); return true;
      }
      if (!r || !current(r)) return true;
      if (kind === "continue" && r.status === "complete" && confirmedActivation(r)) { r.continuedAt ||= nowISO(); emit("device_initial_sync_continued", r); persist(); finish(r); return true; }
      if (["retry", "reconnect"].includes(kind) && !["running", "complete"].includes(r.status)) { start(r, kind === "reconnect" ? "reconnect" : r.stage); render(); }
      return true;
    }
    return { prepare, resume, enter, page, handle, isBusy, needsSetup, resumeSummary, resumeEntry, resumeRoute, backFromHelp, reviewControls };
  };
})();
