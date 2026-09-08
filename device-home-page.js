/* DEV-10: device-scoped facts and resumable prototype operations. No hardware API is called. */
(() => {
  window.createHaloDeviceHome = function ({ state, go, render, persist, track, esc, symbol, modalRoot, closeModal, showInfoModal, binding, showPermissionHelp, operationBlocker, initialSync = () => null, maintenance = () => null }) {
    let timer = null;
    let scheduledId = "";
    let locationIntent = null;
    let detailIntent = null;
    let reviewOutcome = "success";
    let reviewPermission = "granted";
    const objectRecord = value => value !== null && typeof value === "object" && !Array.isArray(value);
    const account = () => String(state.authPhone || state.authForm?.phone || "local-demo");
    const active = () => state.membershipHardwareState === "active";
    const currentId = () => String(state.pairedDevice?.id || (state.devicePaired && state.deviceBindings?.ring7a21?.accountRef === account() ? "ring7a21" : ""));
    const inventory = () => Object.values(state.deviceBindings || {}).filter(item => item && item.accountRef === account() && item.id);
    const owned = id => inventory().find(item => String(item.id) === String(id));
    const validTime = value => typeof value === "string" && value && Number.isFinite(Date.parse(value)) && Date.parse(value) <= Date.now() + 1000;
    const emit = (name, values = {}) => { if (typeof track === "function") track(name, { source_page: state.current === "SET-01" ? "SET-01" : "DEV-10", simulated: true, ...values }); };
    const hub = () => state.deviceHub;
    const data = () => hub().accounts[account()];
    const facts = id => objectRecord(data().facts[id]) ? data().facts[id] : {};
    const batteryLabel = (id = currentId()) => {
      const f = facts(id);
      return typeof f.batteryPercent === "number" && Number.isFinite(f.batteryPercent) && f.batteryPercent >= 0 && f.batteryPercent <= 100 && validTime(f.batteryRecordedAt) ? `${Math.round(f.batteryPercent)}%` : "待更新";
    };
    const needsActivation = item => {
      if (!item) return false;
      if (initialSync()?.needsSetup(item.id)) return true;
      const f = facts(item.id);
      if (validTime(f.activatedAt) || validTime(item.activatedAt)) return false;
      if (validTime(item.boundAt)) return !validTime(f.lastSyncedAt) || Date.parse(f.lastSyncedAt) < Date.parse(item.boundAt);
      const latest = state.deviceBinding;
      if (latest?.kind === "new" && latest.status === "success" && String(latest.target?.id) === String(item.id)) return true;
      return !active();
    };
    const selected = () => owned(data().selectedId) || owned(currentId()) || inventory()[0] || null;
    const isBusy = () => state.deviceHub?.request?.status === "pending";
    const permissionBlocked = () => state.toggles?.bluetooth === false || ["denied", "bluetooth-off"].includes(state.connectionIntro?.permission);
    const actualOtherWork = (allowFirmwareRecovery = false, maintenanceRecoveryId = "") => {
      if (maintenance()?.blocks(maintenanceRecoveryId ? "reconnect" : "other", maintenanceRecoveryId)) return "请先到高级设备操作确认这次结果";
      if (initialSync()?.isBusy()) return "首次设置正在进行，请稍后再试";
      if (binding?.unresolved?.()) return "请先确认这次戒指连接的结果";
      if (state.deviceResetStatus === "pending") return "设备重置还未完成";
      if (["downloading", "verifying"].includes(state.firmwareStatus)) return "固件更新完成后再试";
      const firmwareRecords = state.deviceFirmware?.accounts?.[account()]?.devices || {};
      if (!allowFirmwareRecovery && Object.entries(firmwareRecords).some(([id, d]) => owned(id) && d?.requiresReadback)) return "请先到设备信息页确认更新结果";
      if (state.measurementStatus === "running") return "请先结束当前测量";
      if (state.activitySync?.request?.status === "pending") return "活动记录正在同步，请稍后再试";
      return "";
    };
    const fmt = value => validTime(value) ? new Date(value).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }) : "暂无记录";
    const deviceName = item => item ? `Halo Ring${item.suffix ? ` · ${item.suffix}` : ""}` : "Halo Ring";
    const button = (label, action, style = "primary", disabled = false) => `<button type="button" class="${style}" data-action="${esc(action)}"${disabled ? " disabled" : ""}>${esc(label)}</button>`;
    function prepare() {
      let changed = false;
      if (!objectRecord(state.deviceHub) || state.deviceHub.version !== 1) {
        state.deviceHub = { version: 1, accounts: {}, request: null, lastAccountRef: "" };
        changed = true;
      }
      const h = hub();
      if (Object.prototype.hasOwnProperty.call(h, "wearingReturn")) { delete h.wearingReturn; changed = true; }
      if (!objectRecord(h.accounts)) { h.accounts = {}; changed = true; }
      if (!objectRecord(h.accounts[account()])) {
        h.accounts[account()] = { selectedId: "", facts: {}, locationPermission: "not-requested", locationRequested: !!state.toggles?.location, lastResult: null, observedDeviceId: "", lastObservedSyncAt: "", observedOnce: false };
        changed = true;
      }
      const d = data();
      if (!objectRecord(d.facts)) { d.facts = {}; changed = true; }
      for (const id of Object.keys(d.facts)) {
        if (!objectRecord(d.facts[id])) { d.facts[id] = {}; changed = true; }
      }
      if (h.request) {
        const r = h.request;
        const valid = objectRecord(r) && typeof r.id === "string" && r.id && typeof r.accountRef === "string" && r.accountRef && objectRecord(r.target) && typeof r.target.id === "string" && r.target.id && ["sync", "reconnect"].includes(r.kind) && ["pending", "complete", "failed"].includes(r.status) && Number.isFinite(r.readyAt) && (r.status !== "pending" || (!r.applied && ["success", "failed"].includes(r.outcome) && r.readyAt <= Date.now() + 120000));
        if (!valid) {
          const targetId = typeof r?.target?.id === "string" ? r.target.id : currentId();
          const message = "上次操作记录不完整，请重新确认连接。";
          h.request = { id: typeof r?.id === "string" ? r.id : `devhome-recovered-${Date.now()}`, accountRef: account(), target: { id: targetId }, kind: "reconnect", readyAt: Date.now(), status: "failed", applied: true, message };
          d.lastResult = { requestId: h.request.id, targetId, kind: "reconnect", status: "failed", message, completedAt: new Date().toISOString() };
          changed = true;
        }
      }
      const list = inventory();
      if (!owned(d.selectedId)) { const nextId = owned(currentId())?.id || list[0]?.id || ""; if (d.selectedId !== nextId) { d.selectedId = nextId; changed = true; } }
      const id = currentId();
      const stamp = state.deviceLastSyncedAt || "";
      // A global receipt may be imported once, or when it actually changes. A device
      // switch with an unchanged old receipt must never copy the old device's facts.
      const owner = owned(id);
      const knownReceiptOwner = d.importedReceipt?.deviceId === id && d.importedReceipt?.at === stamp;
      const firstLegacyReceipt = !d.observedOnce && (!h.lastAccountRef || h.lastAccountRef === account());
      if (owner && (!h.lastAccountRef || h.lastAccountRef === account()) && validTime(stamp) && (!validTime(owner.boundAt) || Date.parse(stamp) >= Date.parse(owner.boundAt)) && (firstLegacyReceipt || d.observedOnce && stamp !== d.lastObservedSyncAt || knownReceiptOwner)) {
        const f = d.facts[id] || (d.facts[id] = {});
        if (!validTime(f.lastSyncedAt) || Date.parse(stamp) > Date.parse(f.lastSyncedAt)) { f.lastSyncedAt = stamp; changed = true; }
        if (!knownReceiptOwner) { d.importedReceipt = { deviceId: id, at: stamp }; changed = true; }
      }
      if (id !== d.observedDeviceId || stamp !== d.lastObservedSyncAt || !d.observedOnce) {
        d.observedDeviceId = id; d.lastObservedSyncAt = stamp; d.observedOnce = true; changed = true;
      }
      state.toggles = state.toggles || {};
      if (h.lastAccountRef !== account()) {
        h.lastAccountRef = account();
        state.toggles.location = d.locationPermission === "granted" && d.locationRequested === true;
        locationIntent = null;
        detailIntent = null;
        changed = true;
      } else if (state.toggles.location && d.locationPermission !== "granted") {
        d.locationRequested = true; state.toggles.location = false; changed = true;
      }
      if (changed) persist();
    }
    function canStart(kind, item) {
      if (!state.signedIn || state.accountDeletionStatus === "submitted") return "请先登录有效账号，再管理你的设备";
      if (!item || !owned(item.id)) return "这枚设备已不在当前账号中";
      if (!active()) return "请先完成设备激活";
      if (isBusy()) return "正在处理上一次操作，请稍候";
      const recovery = kind === "reconnect" && state.deviceFirmware?.accounts?.[account()]?.devices?.[item.id]?.requiresReadback;
      const other = actualOtherWork(recovery, kind === "reconnect" ? item.id : "");
      if (other) return other;
      if (permissionBlocked()) return "请先开启蓝牙，并允许 Halo 连接附近设备";
      if (kind === "sync") {
        if (String(item.id) !== currentId()) return "先连接这枚戒指，再同步记录";
        if (needsActivation(item)) return "请先完成这枚戒指的激活";
        return operationBlocker?.("sync") || "";
      }
      return "";
    }
    function start(kind) {
      prepare();
      const item = selected();
      const reason = canStart(kind, item);
      if (reason) {
        if (permissionBlocked() && active() && item && !isBusy() && !actualOtherWork()) showPermissionHelp();
        else showInfoModal("暂时不能继续", reason);
        return;
      }
      const now = Date.now();
      const r = { id: `devhome-${kind}-${now}-${Math.random().toString(36).slice(2, 8)}`, kind, accountRef: account(), target: { ...item }, previousDeviceId: currentId(), previousStatus: state.deviceStatus, startedAt: now, readyAt: now + 1500, outcome: reviewOutcome, status: "pending", applied: false };
      hub().request = r;
      data().lastResult = null;
      if (kind === "sync") state.deviceStatus = "syncing";
      else if (String(item.id) === currentId()) state.deviceStatus = "connecting";
      emit("device_home_operation_started", { operation_id: r.id, kind });
      persist(); render(); resume();
    }
    function finish(id) {
      const r = hub()?.request;
      if (!r || r.id !== id || r.status !== "pending" || r.applied || Date.now() < r.readyAt) return;
      const sameAccount = state.signedIn && state.accountDeletionStatus !== "submitted" && account() === r.accountRef;
      const sameSession = currentId() === r.previousDeviceId;
      const targetOwned = sameAccount && owned(r.target.id);
      const recovery = r.kind === "reconnect" && state.deviceFirmware?.accounts?.[account()]?.devices?.[r.target.id]?.requiresReadback;
      const other = actualOtherWork(recovery, r.kind === "reconnect" ? r.target.id : "");
      let reason = "";
      if (!sameAccount) reason = "登录状态已改变，请重新操作";
      else if (!targetOwned || !active()) reason = "设备归属或激活状态已改变，请重新查看";
      else if (!sameSession) reason = "当前连接设备已改变，请重新操作";
      else if (r.kind === "sync" && state.deviceStatus !== "syncing") reason = "同步期间连接状态已改变，请重新连接后再试";
      else if (r.kind === "reconnect" && String(r.target.id) === r.previousDeviceId && state.deviceStatus !== "connecting") reason = "连接已中断，请重新连接后再试";
      else if (permissionBlocked()) reason = "蓝牙连接中断，请开启后重试";
      else if (other) reason = other;
      else if (r.outcome !== "success") reason = r.outcome === "failed" ? r.kind === "sync" ? "这次没能同步成功，请保持戒指在手机附近后重试" : "暂时没连上，请把戒指放在手机附近后重试" : "暂时无法确认操作结果，请重新确认连接";
      const now = new Date().toISOString();
      r.status = reason ? "failed" : "complete";
      r.completedAt = now;
      r.message = reason || (r.kind === "sync" ? "同步完成，暂无新的记录" : "已重新连接");
      // Mark before writing receipts so re-entering render/resume cannot apply twice.
      r.applied = true;
      const d = hub().accounts[r.accountRef];
      if (reason) {
        if (sameAccount && sameSession && ["syncing", "connecting"].includes(state.deviceStatus)) {
          state.deviceStatus = permissionBlocked() ? "disconnected" : (["syncing", "connecting"].includes(r.previousStatus) ? "disconnected" : r.previousStatus);
        }
      } else {
        const f = d.facts[r.target.id] || (d.facts[r.target.id] = {});
        if (r.kind === "sync") {
          f.lastSyncedAt = now;
          state.deviceLastSyncedAt = now;
          state.deviceStatus = r.previousStatus === "low" ? "low" : "connected";
        } else {
          state.pairedDevice = { ...targetOwned };
          state.devicePaired = true;
          state.deviceStatus = "connected";
          f.lastConnectedAt = now;
          state.deviceLastSyncedAt = validTime(f.lastSyncedAt) ? f.lastSyncedAt : "";
        }
        d.observedDeviceId = currentId(); d.lastObservedSyncAt = state.deviceLastSyncedAt || ""; d.observedOnce = true;
        d.importedReceipt = validTime(state.deviceLastSyncedAt) ? { deviceId: currentId(), at: state.deviceLastSyncedAt } : null;
      }
      if (d) d.lastResult = { requestId: r.id, targetId: r.target.id, kind: r.kind, status: r.status, message: r.message, completedAt: now };
      emit("device_home_operation_completed", { operation_id: r.id, kind: r.kind, status: r.status });
      persist(); render();
    }
    function resume() {
      if (!state.deviceHub) return;
      const r = hub().request;
      if (!r || r.status !== "pending") { if (timer) clearTimeout(timer); timer = null; scheduledId = ""; return; }
      if (!Number.isFinite(r.readyAt)) { r.readyAt = Date.now(); persist(); }
      if (Date.now() >= r.readyAt) { if (timer) clearTimeout(timer); timer = null; scheduledId = ""; finish(r.id); return; }
      if (scheduledId === r.id && timer) return;
      if (timer) clearTimeout(timer);
      scheduledId = r.id;
      timer = setTimeout(() => { timer = null; scheduledId = ""; finish(r.id); }, Math.max(1, r.readyAt - Date.now()));
    }
    function connection(item) {
      const r = hub().request;
      if (r?.status === "pending" && r.accountRef === account() && String(r.target.id) === String(item.id)) return r.kind === "sync" ? "正在同步" : "正在重新连接";
      if (String(item.id) !== currentId()) return "未连接";
      if (permissionBlocked()) return "蓝牙未开启";
      const labels = { connected: "已连接", low: "已连接 · 电量偏低", disconnected: "未连接", syncing: "上次同步结果待确认", connecting: "上次连接结果待确认" };
      return labels[state.deviceStatus] || "连接状态待确认";
    }
    function lastLocation(item) {
      const record = facts(item.id).locationRecord;
      return record && record.accountRef === account() && String(record.deviceId) === String(item.id) && record.source === "connected-phone" && record.permissionGranted === true && typeof record.label === "string" && record.label.trim() && validTime(record.occurredAt) ? record : null;
    }
    function locationSection(item) {
      const enabled = state.toggles.location === true && data().locationPermission === "granted";
      const record = lastLocation(item);
      const message = record ? `${record.label} · ${fmt(record.occurredAt)}` : enabled ? "开启后，连接时可留下手机的位置线索。现在还没有记录。" : data().locationPermission === "denied" ? "位置权限未允许，你仍可正常使用戒指。" : data().locationRequested ? "位置权限待确认，暂未记录位置。" : "可保存连接时手机的位置，帮你回想戒指在哪里。";
      return `<section class="device-home-section"><div class="device-home-row"><div><h3>位置线索</h3><p class="device-home-meta">${record ? "上次记录的位置，不是实时定位" : "非实时定位"}</p></div><button type="button" class="device-home-toggle ${enabled ? "on" : ""}" role="switch" aria-checked="${enabled}" aria-label="记录设备位置线索" data-action="devhome:location"><span></span></button></div><p class="device-home-message">${esc(message)}</p>${record && !enabled ? '<p class="device-home-meta">已关闭，不再记录新的位置。</p>' : ""}</section>`;
    }
    function related(item) {
      const current = String(item.id) === currentId();
      return `<section class="device-home-section device-home-list">${[
        ["设备信息", current ? "型号、固件与设备详情" : "连接这枚戒指后查看", "devhome:info"],
        ["佩戴指南", "看看怎样佩戴更贴合", "devhome:wear"],
        ["高级设备操作", "数据清除、本机连接与账号绑定", "devhome:advanced"]
      ].map(([title, note, action]) => `<button type="button" class="device-home-row" data-action="${action}"><span><strong>${title}</strong><small>${note}</small></span><span aria-hidden="true">›</span></button>`).join("")}</section>`;
    }
    function body() {
      prepare();
      const item = selected();
      const list = inventory();
      const header = `<header class="device-home-header"><button type="button" class="icon-button" aria-label="返回" data-action="previous">‹</button><h1>我的 Halo 硬件</h1>${button("添加", "devhome:add", "text-button", isBusy())}</header>`;
      const entry = (binding?.resumeEntry?.() || "") + (initialSync()?.resumeEntry() || "") + (maintenance()?.resumeEntry() || "");
      if (!active() || !item || needsActivation(item)) {
        const pendingActivation = !!state.devicePaired && !!item && needsActivation(item);
        const current = String(item?.id) === currentId();
        const retained = state.membershipHardwareState === "unbound-retained";
        const title = pendingActivation ? "还差一步，完成激活" : retained ? "当前没有已激活的设备" : "连接你的 Halo Ring";
        const note = pendingActivation ? "继续完成首次同步，就可以开始使用。" : retained ? "之前的记录、会员等级和已获得的权益仍会保留。" : "连接后，在这里查看状态和同步记录。";
        return `<section class="device-home">${header}${entry}${list.length > 1 ? button("查看已绑定设备", "devhome:devices", "text-button") : ""}<div class="device-home-empty"><img class="device-home-symbol" src="${esc(symbol)}" alt=""><h2>${title}</h2><p>${note}</p>${button(pendingActivation ? current ? "继续激活" : "连接后继续激活" : retained ? "重新连接" : "连接戒指", pendingActivation ? current ? "devhome:activate" : "devhome:reconnect" : "devhome:add", "primary", isBusy())}</div></section>`;
      }
      const current = String(item.id) === currentId();
      const r = hub().request;
      const pending = r?.status === "pending" && r.accountRef === account() && String(r.target.id) === String(item.id);
      const recovery = state.deviceFirmware?.accounts?.[account()]?.devices?.[item.id]?.requiresReadback && !(current && ["connected", "low"].includes(state.deviceStatus) && !permissionBlocked());
      const other = actualOtherWork(recovery, current && ["connected", "low"].includes(state.deviceStatus) && !permissionBlocked() ? "" : item.id);
      const stale = current && ["syncing", "connecting"].includes(state.deviceStatus) && !isBusy() && !other;
      const connected = current && ["connected", "low"].includes(state.deviceStatus) && !permissionBlocked();
      const f = facts(item.id);
      const battery = batteryLabel(item.id);
      const result = data().lastResult?.targetId === item.id ? data().lastResult : null;
      const label = pending ? r.kind === "sync" ? "正在同步…" : "正在连接…" : permissionBlocked() ? "开启蓝牙" : connected ? result?.status === "failed" && result.kind === "sync" ? "重试同步" : "同步记录" : stale ? "重新确认连接" : "重新连接";
      const action = permissionBlocked() ? "devhome:permission" : connected ? "devhome:sync" : "devhome:reconnect";
      const hint = pending ? "可以先离开，回来后继续查看结果。" : isBusy() ? "还有一项连接或同步正在进行，完成后就可以操作这枚戒指。" : other || (result?.message) || (stale ? "暂时无法确认上次操作的结果，请重新连接后再试。" : !connected ? "把戒指放在手机附近，再试一次。" : "同步后，你的新记录会出现在 App 中。");
      const fact = (name, value, extra = "") => `<div class="device-home-fact"><span>${name}</span><strong>${esc(value)}</strong>${extra ? `<small>${esc(extra)}</small>` : ""}</div>`;
      return `<section class="device-home">${header}${entry}<button type="button" class="device-home-row device-home-picker" data-action="devhome:devices"><span>已绑定设备 · ${list.length} 枚</span><span>切换查看 <span aria-hidden="true">›</span></span></button><div class="device-home-hero"><img class="device-home-symbol" src="${esc(symbol)}" alt=""><h2 class="device-home-name">${esc(deviceName(item))}</h2><p class="device-home-connection" data-status="${pending ? "pending" : connected ? "connected" : "disconnected"}">${esc(connection(item))}</p></div><div class="device-home-facts">${fact("最近同步", fmt(f.lastSyncedAt))}${fact("设备电量", battery, battery !== "待更新" ? `记录于 ${fmt(f.batteryRecordedAt)}` : "连接后等待设备读取")}${fact("最近连接", fmt(f.lastConnectedAt))}${fact("连接手机", typeof f.phoneLabel === "string" && validTime(f.phoneRecordedAt) ? f.phoneLabel : "暂无记录")}</div><div class="device-home-actions">${button(label, action, "primary", !!pending || !!other || isBusy())}<p class="device-home-message" role="status" aria-live="polite">${esc(hint)}</p></div>${locationSection(item)}${related(item)}</section>`;
    }
    function showDevices() {
      modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal device-home-modal" role="dialog" aria-modal="true" aria-labelledby="device-home-list-title"><h2 id="device-home-list-title">我的设备</h2><p>切换查看不会断开当前连接。</p><div class="device-home-list">${inventory().map(item => `<button type="button" class="device-home-row" data-action="devhome:select:${esc(item.id)}"><span><strong>${esc(deviceName(item))}</strong><small>${esc(connection(item))}</small></span><span>${String(item.id) === String(data().selectedId) ? "已选择" : "查看"}</span></button>`).join("")}</div><div class="device-home-actions">${button("添加设备", "devhome:add", "secondary", isBusy())}${button("完成", "close-modal", "text-button")}</div></section></div>`;
    }
    function toggleLocation() {
      prepare();
      const d = data();
      if (state.toggles.location) {
        state.toggles.location = false; d.locationRequested = false; locationIntent = null;
        emit("device_location_preference_changed", { enabled: false }); persist(); render(); return;
      }
      locationIntent = { accountRef: account(), page: state.current };
      modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal device-home-modal" role="dialog" aria-modal="true" aria-labelledby="device-location-title"><h2 id="device-location-title">记录连接时的位置？</h2><p>允许后，可记录戒指与手机连接时手机所在的位置，帮助你回想戒指放在哪里。</p><p>这不是戒指的实时位置。不开启，也不影响健康记录与日常使用。</p><div class="device-home-actions">${button("允许位置访问", "devhome:location-allow")}${button("暂不开启", "devhome:location-cancel", "text-button")}</div></section></div>`;
    }
    function allowLocation() {
      if (!locationIntent || locationIntent.accountRef !== account() || locationIntent.page !== state.current || !modalRoot.querySelector?.("#device-location-title")) return;
      const d = data();
      d.locationPermission = reviewPermission;
      d.locationRequested = reviewPermission === "granted";
      state.toggles.location = reviewPermission === "granted";
      locationIntent = null;
      emit("device_location_permission_result", { status: reviewPermission });
      closeModal(); persist(); render();
      if (reviewPermission === "denied") showInfoModal("暂未开启位置线索", "位置访问未被允许，其他功能不受影响。需要时可以再次开启。");
    }
    function handleAction(action) {
      if (action === "devhome:wear-done" || (action !== "toggle:location" && !action.startsWith("devhome:"))) return false;
      prepare();
      if (action.startsWith("devhome:review:")) {
        const [, , kind, value] = action.split(":");
        if (kind === "outcome" && ["success", "failed"].includes(value) && !isBusy()) reviewOutcome = value;
        if (kind === "permission" && ["granted", "denied"].includes(value)) reviewPermission = value;
        render(); return true;
      }
      const isLocation = action === "toggle:location" || action.startsWith("devhome:location");
      if (!state.signedIn || state.accountDeletionStatus === "submitted" || !(state.current === "DEV-10" || (isLocation && state.current === "SET-01"))) return true;
      if (action === "toggle:location" || action === "devhome:location") { toggleLocation(); return true; }
      if (action === "devhome:location-allow") { allowLocation(); return true; }
      if (action === "devhome:location-cancel") { locationIntent = null; closeModal(); return true; }
      if (action === "devhome:devices") { showDevices(); return true; }
      if (action.startsWith("devhome:select:")) {
        const id = action.slice("devhome:select:".length);
        if (owned(id)) { data().selectedId = id; emit("device_home_selection_changed"); closeModal(); persist(); render(); }
        return true;
      }
      if (action === "devhome:sync") { start("sync"); return true; }
      if (action === "devhome:reconnect") { start("reconnect"); return true; }
      if (action === "devhome:connect-selected") {
        if (detailIntent?.accountRef === account() && detailIntent.page === state.current && detailIntent.targetId === selected()?.id && modalRoot.querySelector?.('[data-action="devhome:connect-selected"]')) { detailIntent = null; closeModal(); start("reconnect"); }
        return true;
      }
      if (action === "devhome:permission") { showPermissionHelp(); return true; }
      if (action === "devhome:wear") { closeModal(); go("DEV-04"); return true; }
      if (action === "devhome:add" || action === "devhome:activate") {
        const reason = isBusy() ? "当前操作完成后，再继续连接或激活设备" : actualOtherWork();
        if (reason) showInfoModal("请稍候", reason);
        else if (action === "devhome:activate" && (!state.devicePaired || String(selected()?.id) !== currentId())) showInfoModal("先连接这枚戒指", "连接后再继续完成激活。");
        else { closeModal(); go(action === "devhome:activate" ? "DEV-05" : "DEV-01"); }
        return true;
      }
      if (action === "devhome:info" || action === "devhome:advanced") {
        if (action === "devhome:advanced") {
          if (isBusy()) showInfoModal("请稍候", "当前操作完成后，再进行高级设备操作。");
          else if (selected()) maintenance()?.handle(`maintenance:open:${selected().id}`);
        } else if (String(selected()?.id) !== currentId()) { detailIntent = { accountRef: account(), page: state.current, targetId: selected()?.id }; showInfoModal("先连接这枚戒指", "连接后再查看它的详情。", "重新连接", "devhome:connect-selected"); }
        else go("DEV-11");
        return true;
      }
      return false;
    }
    function reviewControls(item) {
      if ((typeof item === "string" ? item : item?.id) !== "DEV-10") return "";
      const group = (kind, title, values, chosen, disabled) => `<div class="review-control-group"><strong>${title}</strong><div>${values.map(([value, label]) => `<button data-action="devhome:review:${kind}:${value}" class="${value === chosen ? "active" : ""}"${disabled ? " disabled" : ""}>${label}</button>`).join("")}</div></div>`;
      return `<section class="review-controls"><p>DEVICE HOME REVIEW</p><h3>设备页交互审阅</h3><small>操作与授权均为本地原型模拟，不连接真实硬件、不读取手机位置。不会补造电量、手机名称或地点；同步不增加健康数据或会员奖励。</small>${group("outcome", "下一次连接 / 同步结果", [["success", "成功"], ["failed", "失败，可重试"]], reviewOutcome, isBusy())}${group("permission", "下一次位置授权结果", [["granted", "允许"], ["denied", "拒绝"]], reviewPermission, false)}</section>`;
    }
    function initialReceiptTarget(at, receipt) {
      prepare();
      const id = currentId(), item = owned(id);
      return state.signedIn && state.authVerified && state.accountDeletionStatus !== "submitted" && item && validTime(at) && receipt?.accountRef === account() && receipt.deviceId === id && String(item.boundAt || "") === receipt.boundAt ? id : "";
    }
    function recordInitialSync(at, receipt) {
      const id = initialReceiptTarget(at, receipt);
      if (!id) return false;
      const f = data().facts[id] || (data().facts[id] = {});
      f.lastSyncedAt = at; state.deviceLastSyncedAt = at;
      data().observedDeviceId = id; data().lastObservedSyncAt = at; data().observedOnce = true;
      data().importedReceipt = { deviceId: id, at };
      persist(); return true;
    }
    function recordActivation(at, receipt) {
      const id = initialReceiptTarget(at, receipt);
      if (!id) return false;
      const f = data().facts[id] || (data().facts[id] = {});
      if (!validTime(f.activatedAt) || receipt.boundAt && Date.parse(f.activatedAt) < Date.parse(receipt.boundAt)) f.activatedAt = at;
      persist(); return true;
    }
    return { body, handleAction, prepare, resume, reviewControls, isBusy, recordActivation, recordInitialSync, batteryLabel };
  };
})();
