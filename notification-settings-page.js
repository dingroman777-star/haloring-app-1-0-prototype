/* SET-02: local settings and drafts; this prototype does not schedule notifications or alarms. */
(() => {
  window.createHaloNotificationSettings = function ({ state, go, render, persist, write, esc, modalRoot, closeModal, flash, track, legacyGoalSaved }) {
    const keys = ["proactive", "nightPrompt", "morningPrompt", "lowBattery", "syncAlert", "reportReady"];
    const fields = { duration: "目标睡眠时长", workdayBedtime: "工作日上床时间", workdayWake: "工作日起床时间", restBedtime: "休息日上床时间", restWake: "休息日起床时间" };
    const defaults = { duration: "8", workdayBedtime: "23:15", workdayWake: "07:15", restBedtime: "23:45", restWake: "08:00" };
    const object = x => x && typeof x === "object" && !Array.isArray(x);
    const account = () => String(state.authPhone || state.authForm?.phone || "");
    const allowed = () => state.signedIn && state.authVerified && state.accountDeletionStatus !== "submitted";
    const root = () => state.sleepNotifications;
    const entry = () => root().accounts[account()];
    const clone = x => JSON.parse(JSON.stringify(x));
    const prefs = () => Object.fromEntries(keys.map(k => [k, !!state.toggles[k]]));
    const validTime = t => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(t));
    const minutes = t => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
    const span = (start, end) => validTime(start) && validTime(end) ? (minutes(end) - minutes(start) + 1440) % 1440 : null;
    const hours = min => Number.isFinite(min) ? `${Math.floor(min / 60)} 小时${min % 60 ? ` ${min % 60} 分` : ""}` : "待设置";
    const period = (start, end) => validTime(start) && validTime(end) && start !== end ? `${start} — ${end < start ? "次日 " : ""}${end}` : "时间待完善";
    const goalFields = goal => Object.fromEntries(Object.keys(fields).map(k => [k, String(goal?.[k] ?? "")]));
    let activeAccount = "", feedback = "", writeFailed = false, outcome = "success", intent = null;
    const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${({ back: "m14 5-7 7 7 7", bell: "M6 9a6 6 0 0 1 12 0v6l2 3H4l2-3V9m4 12h4", moon: "M20 14A8 8 0 0 1 10 4a9 9 0 1 0 10 10", clock: "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18m0 4v5l4 2", arrow: "m10 6 6 6-6 6", sun: "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2" })[name]}"/></svg>`;
    const button = (label, action, style = "primary", disabled = false) => `<button type="button" class="${style}" data-action="settings:${action}"${disabled ? " disabled" : ""}>${esc(label)}</button>`;
    const emit = (event, data = {}) => track?.(event, { source_page: state.current, prototype_only: true, ...data });
    function prepare() {
      if (!allowed()) return;
      let changed = false;
      if (!object(root()) || root().version !== 1) { state.sleepNotifications = { version: 1, ownerAccount: account(), accounts: {} }; changed = true; }
      if (!object(root().accounts)) { root().accounts = {}; changed = true; }
      if (!object(entry())) {
        const legacy = root().ownerAccount === account();
        root().accounts[account()] = { goal: goalFields(legacy ? state.sleepGoal : defaults), configured: legacy && !!legacyGoalSaved, preferences: legacy ? prefs() : Object.fromEntries(keys.map(k => [k, false])), draft: null, savedAt: "" };
        changed = true;
      }
      const p = entry();
      if (p.permissionReturn && state.current !== "PERM-01") { delete p.permissionReturn; changed = true; }
      if (p.detailReturn && !(state.current === "PERM-01" && p.permissionReturn === "HAL-04") && ![p.detailReturn, ...(p.detailReturn === "NIG-06" ? ["NIG-07"] : [])].includes(state.current)) { delete p.detailReturn; changed = true; }
      if (!object(p.quietHours)) { p.quietHours = root().ownerAccount === account() ? { ...state.haloQuietHours } : { start: "23:30", end: "08:00" }; changed = true; }
      state.haloQuietHours = { ...p.quietHours };
      if (!object(p.goal)) { p.goal = { ...defaults }; p.configured = false; changed = true; }
      if (!object(p.preferences)) { p.preferences = prefs(); changed = true; }
      if (p.draft && (!object(p.draft) || p.draft.accountRef !== account() || !object(p.draft.values) || !object(p.draft.base))) { p.draft = null; changed = true; }
      if (activeAccount !== account()) {
        activeAccount = account(); intent = null; feedback = ""; writeFailed = false;
        for (const k of keys) state.toggles[k] = !!p.preferences[k];
        state.sleepGoal = { ...p.goal };
      } else {
        // Existing HAL-04 controls share these fields; preserve their current choices.
        const current = prefs();
        if (JSON.stringify(current) !== JSON.stringify(p.preferences)) { p.preferences = current; changed = true; }
      }
      if (changed) persist();
    }
    function gate() { if (allowed()) return true; closeModal(); go("AUTH-01"); return false; }
    function save(changes) { return outcome !== "failed" && write(changes); }
    function row(name, title, note, action) { return `<button type="button" class="ns-row" data-action="settings:${action}">${icon(name)}<span><strong>${title}</strong><small>${esc(note)}</small></span><i aria-hidden="true">›</i></button>`; }
    function switchRow(key, title, copy, disabled = false) {
      return `<div class="ns-toggle"><div><strong id="ns-label-${key}">${title}</strong><p id="ns-help-${key}">${copy}</p></div><button type="button" class="ns-switch" role="switch" aria-labelledby="ns-label-${key}" aria-describedby="ns-help-${key}" aria-checked="${!!state.toggles[key]}" data-action="settings:toggle:${key}"${disabled ? " disabled" : ""}><span></span></button></div>`;
    }
    function errors(goal) {
      const result = {};
      if (!/^\d+(?:\.\d+)?$/.test(goal.duration) || Number(goal.duration) <= 0 || Number(goal.duration) > 24) result.duration = "请选择有效的目标时长";
      for (const key of Object.keys(fields).filter(k => k !== "duration")) if (!validTime(goal[key])) result[key] = `请填写${fields[key]}`;
      if (validTime(goal.workdayBedtime) && goal.workdayBedtime === goal.workdayWake) result.workdayWake = "上床和起床时间不能相同";
      if (validTime(goal.restBedtime) && goal.restBedtime === goal.restWake) result.restWake = "上床和起床时间不能相同";
      return result;
    }
    function draftChanged() { return !!entry().draft && (!entry().configured || JSON.stringify(goalFields(entry().draft.values)) !== JSON.stringify(goalFields(entry().goal))); }
    function goalPreview(goal) {
      return [["工作日", "workdayBedtime", "workdayWake"], ["休息日", "restBedtime", "restWake"]].map(([label, a, b]) => {
        const length = span(goal[a], goal[b]);
        return length ? `${label}计划在床 ${hours(length)}${Math.abs(length - Number(goal.duration) * 60) > 0.1 ? "，与目标时长不同" : ""}。` : "";
      }).filter(Boolean).join(" ");
    }
    function showEditor() {
      if (!gate()) return;
      if (!entry().draft) {
        const next = clone(root()); next.accounts[account()].draft = { accountRef: account(), values: { ...entry().goal }, base: { ...entry().goal }, updatedAt: new Date().toISOString() };
        if (!write({ sleepNotifications: next })) { root().accounts[account()].draft = next.accounts[account()].draft; writeFailed = true; }
      }
      intent = { accountRef: account(), type: "goal" };
      const values = entry().draft.values;
      const durations = [...new Set(["7.5", "8", "8.5", ...(Number(values.duration) > 0 && Number(values.duration) <= 24 ? [String(values.duration)] : [])])];
      const field = key => `<label class="ns-field">${fields[key]}${key === "duration" ? `<select id="ns-goal-${key}" aria-describedby="ns-error-${key}">${durations.map(v => `<option value="${v}"${String(values[key]) === v ? " selected" : ""}>${hours(Number(v) * 60)}</option>`).join("")}</select>` : `<input id="ns-goal-${key}" type="time" value="${esc(values[key])}" aria-describedby="ns-error-${key}">`}<small id="ns-error-${key}" class="ns-field-error"></small></label>`;
      modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal ns-modal ns-goal-modal" role="dialog" aria-modal="true" aria-labelledby="ns-goal-title"><header class="ns-modal-header"><h2 id="ns-goal-title">${entry().configured ? "调整" : "设置"}睡眠目标</h2>${button("稍后继续", "close", "text-button")}</header><form id="ns-goal-form" novalidate>${field("duration")}<div class="ns-fields-grid">${field("workdayBedtime")}${field("workdayWake")}${field("restBedtime")}${field("restWake")}</div><p class="ns-window-preview"></p><p class="ns-hint">在床时段不等于实际睡眠，也不会自动设置闹钟。</p><p id="ns-goal-feedback" class="ns-feedback" role="status"></p><div class="ns-actions"><button type="submit" class="primary" id="ns-goal-save">保存目标</button>${button("放弃本次修改", "discard", "text-button")}</div></form></section></div>`;
      updateEditor();
    }
    function updateEditor() {
      if (!modalRoot.querySelector(".ns-goal-modal") || !entry()?.draft) return;
      const values = entry().draft.values, problems = errors(values);
      for (const key of Object.keys(fields)) {
        const input = modalRoot.querySelector(`#ns-goal-${key}`), hint = modalRoot.querySelector(`#ns-error-${key}`);
        if (input) input.setAttribute("aria-invalid", String(!!problems[key]));
        if (hint) hint.textContent = problems[key] || "";
      }
      modalRoot.querySelector(".ns-window-preview").textContent = goalPreview(values);
      modalRoot.querySelector("#ns-goal-save").disabled = !!Object.keys(problems).length || !draftChanged();
      modalRoot.querySelector("#ns-goal-feedback").dataset.status = writeFailed ? "failed" : "draft";
      modalRoot.querySelector("#ns-goal-feedback").textContent = writeFailed ? "修改暂时无法保存到本机，请不要关闭或刷新页面。原目标未改变，可重试保存。" : feedback || (draftChanged() ? "修改已暂存，保存后才更新目标。" : "与当前目标一致，无需保存。");
    }
    function input(target) {
      if (!target.id?.startsWith("ns-goal-") || !intent || intent.accountRef !== account() || state.current !== "SET-02" || !modalRoot.querySelector(".ns-goal-modal") || !gate()) return false;
      const key = target.id.slice(8); if (!Object.hasOwn(fields, key)) return false;
      entry().draft.values[key] = target.value; entry().draft.updatedAt = new Date().toISOString(); feedback = "";
      writeFailed = !write({ sleepNotifications: clone(root()) });
      updateEditor(); return true;
    }
    function saveGoal() {
      if (!gate() || !intent || intent.type !== "goal" || intent.accountRef !== account() || state.current !== "SET-02" || !modalRoot.querySelector(".ns-goal-modal") || !entry().draft) return;
      if (Object.keys(errors(entry().draft.values)).length) return updateEditor();
      if (JSON.stringify(goalFields(entry().draft.base)) !== JSON.stringify(goalFields(entry().goal))) { feedback = "已保存目标发生变化，请放弃旧修改后重新调整。"; return updateEditor(); }
      const goal = goalFields(entry().draft.values), next = clone(root());
      Object.assign(next.accounts[account()], { goal, configured: true, draft: null, savedAt: new Date().toISOString() });
      if (!save({ sleepNotifications: next, sleepGoal: goal })) { writeFailed = true; return updateEditor(); }
      writeFailed = false; feedback = "睡眠目标已保存"; intent = null; closeModal(); emit("sleep_goal_saved", { fields_changed: Object.keys(fields) }); render(); flash(feedback);
    }
    function setPreference(key) {
      if (!gate() || !keys.includes(key) || state.current === "SET-02" && ["nightPrompt", "morningPrompt"].includes(key) && !state.toggles.proactive) return;
      const value = !state.toggles[key], toggles = { ...state.toggles, [key]: value }, next = clone(root());
      next.accounts[account()].preferences[key] = value;
      if (!save({ toggles, sleepNotifications: next })) { feedback = "这次设置未保存，原开关保持不变。请稍后再试。"; render(); return; }
      feedback = !state.toggles.proactive && ["nightPrompt", "morningPrompt"].includes(key) ? "偏好已保存，开启主动提醒后才会生效" : state.toggles.notification ? "提醒偏好已保存" : "偏好已保存；通知权限关闭时不会发出提醒";
      emit("notification_preference_saved", { setting: key, enabled: value }); render(); if (state.current === "HAL-04") flash(feedback);
    }
    function wakeSummary() {
      const wake = state.wakeSettings || {};
      const diff = JSON.stringify(state.wakeDraft) !== JSON.stringify(wake);
      const saved = wake.enabled ? validTime(wake.time) ? `已保存 ${wake.time}${state.toggles.notification ? "" : " · 通知权限待开启"}` : "唤醒时间待完善" : "已保存为关闭";
      return `${saved}${diff ? " · 有未保存修改" : ""}`;
    }
    function saveWake() {
      if (!gate() || state.current !== "NIG-06") return;
      const draft = state.wakeDraft;
      if (!validTime(draft?.time) || !["20", "30"].includes(String(draft.window)) || !draft.sound) return flash("请填写有效的唤醒时间、窗口与声音");
      const wakeSettings = { ...draft, enabled: !!draft.enabled };
      if (!save({ wakeSettings, wakeDraft: { ...wakeSettings }, toggles: { ...state.toggles, wake: wakeSettings.enabled }, alarmSound: wakeSettings.sound, wakeSaved: true, snoozeUntil: "" })) { flash("未能保存，原唤醒设置保持不变。你的修改仍在，可重试。"); return; }
      render(); flash("唤醒设置已保存，原型不会实际响铃");
    }
    function page() {
      const p = entry(), goal = p.goal, duration = Number(goal.duration), permitted = !!state.toggles.notification, proactive = !!state.toggles.proactive;
      const quiet = state.haloQuietHours || {};
      return `<section class="notification-settings-page"><header class="ns-header"><button type="button" data-action="previous" aria-label="返回上一页">${icon("back")}</button><h1>通知与夜间设置</h1><span></span></header><section class="ns-notification-status">${icon("bell")}<div><strong>通知权限 · ${permitted ? "已允许" : "已关闭"}</strong><small>${permitted ? "接收哪些提醒，由你选择" : "偏好会保留，暂时不会发出通知"}</small></div>${button("查看", "permissions", "text-button")}</section>${feedback ? `<p class="ns-feedback" data-status="${feedback.startsWith("这次设置未保存") ? "failed" : "saved"}" role="status">${esc(feedback)}</p>` : ""}<section class="ns-section"><h2>睡眠安排</h2><section class="ns-goal-card"><div class="ns-goal-heading"><div><span>睡眠目标</span><strong>${p.configured && duration > 0 ? hours(duration * 60) : "尚未设置"}</strong></div>${button(draftChanged() ? "继续修改" : p.configured ? "调整" : "设置", "edit", "text-button ns-goal-edit")}</div>${p.configured ? `<div class="ns-schedule"><div><span>工作日</span><strong>${period(goal.workdayBedtime, goal.workdayWake)}</strong></div><div><span>休息日</span><strong>${period(goal.restBedtime, goal.restWake)}</strong></div></div>` : ""}<p class="ns-hint">${draftChanged() ? "有未保存的修改，当前目标不变。" : "目标与闹钟分别设置，不会改动睡眠记录。"}</p></section>${row("clock", "Halo 闹钟", wakeSummary(), "wake")}</section><section class="ns-section"><h2>Halo 主动提醒</h2>${switchRow("proactive", "允许主动提醒", proactive ? permitted ? "按下面的偏好与静默时段提醒" : "偏好已开启，通知权限尚未允许" : "关闭后，早晨与睡前选择仍保留")}${switchRow("nightPrompt", "睡前轻提醒", "给睡前放松留一点时间", !proactive)}${switchRow("morningPrompt", "早晨状态提示", "有可用的身体状态时提醒", !proactive)}${row("moon", "静默时段", `${period(quiet.start, quiet.end)} · 仅影响 Halo 主动提醒`, "quiet")}</section><section class="ns-section"><h2>设备与报告</h2>${switchRow("lowBattery", "低电量提醒", "戒指需要充电时提醒")}${switchRow("syncAlert", "同步异常提醒", "需要你处理时提醒")}${switchRow("reportReady", "报告就绪提醒", "有新的健康或 Studio 报告时提醒")}</section><p class="ns-footnote">交互原型不会发送真实通知或响铃。</p></section>`;
    }
    function handle(action) {
      const oldGoal = action === "sleep-goal-save", wakeSave = action === "wake-save";
      const sharedPreference = action.startsWith("toggle:") && keys.includes(action.slice(7)) && ["SET-02", "HAL-04"].includes(state.current);
      const permissionReturn = action === "permission-skip" && state.current === "PERM-01" && ["SET-02", "HAL-04"].includes(root()?.accounts?.[account()]?.permissionReturn);
      const detailReturn = action === "previous" && ["NIG-06", "HAL-04"].includes(state.current) && root()?.accounts?.[account()]?.detailReturn === state.current;
      if (!action.startsWith("settings:") && !oldGoal && !wakeSave && !sharedPreference && !permissionReturn && !detailReturn) return false;
      if (!gate()) return true;
      prepare();
      if (wakeSave) { saveWake(); return true; }
      if (permissionReturn) { const destination = entry().permissionReturn; entry().permissionReturn = ""; persist(); go(destination); return true; }
      if (detailReturn) { delete entry().detailReturn; persist(); go("SET-02", false); return true; }
      if (sharedPreference) { setPreference(action.slice(7)); return true; }
      if (action.startsWith("settings:review:")) { const value = action.slice(16); if (["success", "failed"].includes(value)) outcome = value; render(); return true; }
      if (state.current !== "SET-02") return true;
      if (action === "settings:edit") { feedback = ""; showEditor(); return true; }
      if (action === "settings:close") { intent = null; closeModal(); render(); return true; }
      if (action === "settings:save" || oldGoal) { saveGoal(); return true; }
      if (action.startsWith("settings:toggle:")) { setPreference(action.slice(16)); return true; }
      if (action === "settings:discard") {
        if (!intent || !modalRoot.querySelector(".ns-goal-modal")) return true;
        intent.type = "discard";
        modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal ns-modal" role="dialog" aria-modal="true" aria-labelledby="ns-discard-title"><h2 id="ns-discard-title">放弃本次修改？</h2><p>已保存的睡眠目标不会改变。</p><div class="ns-actions">${button("继续编辑", "edit")}${button("放弃修改", "discard-confirm", "secondary")}</div><p class="ns-feedback" role="status"></p></section></div>`; return true;
      }
      if (action === "settings:discard-confirm") {
        if (!intent || intent.type !== "discard" || intent.accountRef !== account() || !modalRoot.querySelector("#ns-discard-title")) return true;
        const next = clone(root()); next.accounts[account()].draft = null;
        if (!write({ sleepNotifications: next })) { modalRoot.querySelector(".ns-feedback").textContent = "未能保存这次操作，修改仍保留，请稍后重试。"; return true; }
        feedback = "已放弃修改，原目标不变"; writeFailed = false; intent = null; closeModal(); render(); return true;
      }
      if (action === "settings:permissions") { entry().permissionReturn = "SET-02"; persist(); go("PERM-01"); return true; }
      if (action === "settings:wake" || action === "settings:quiet") { const destination = action === "settings:wake" ? "NIG-06" : "HAL-04"; entry().detailReturn = destination; persist(); go(destination); return true; }
      return true;
    }
    modalRoot.addEventListener("input", event => input(event.target));
    modalRoot.addEventListener("change", event => input(event.target));
    modalRoot.addEventListener("submit", event => { if (event.target.id === "ns-goal-form") { event.preventDefault(); saveGoal(); } });
    new MutationObserver(() => { if (intent && !modalRoot.querySelector(".ns-modal")) { intent = null; if (state.current === "SET-02" && allowed()) render(); } }).observe(modalRoot, { childList: true });
    const reviewControls = item => item.id === "SET-02" ? `<section class="review-controls"><p>NOTIFICATION SETTINGS REVIEW</p><h3>设置保存结果</h3><small>仅本机原型，通知权限沿用演示状态；没有调用系统通知授权、闹钟或关键提醒能力。</small><div class="review-control-group">${["success", "failed"].map(v => `<button data-action="settings:review:${v}" class="${v === outcome ? "active" : ""}">${v === "success" ? "保存成功" : "保存失败"}</button>`).join("")}</div></section>` : "";
    return { prepare, page, handle, reviewControls, validTime };
  };
})();
