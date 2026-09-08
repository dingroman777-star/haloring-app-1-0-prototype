/* HLT-04 oxygen-only demonstration. No device acquisition or timed fake progress. */
(() => {
  window.createHaloOxygenMeasurement = function ({ state, write, render, go, esc, unavailable, saveUnavailable, returnContext, onReturn, symbol, recovery, requestDiscard, discardIsOpen, closeDiscard }) {
    const copy = value => value == null ? value : JSON.parse(JSON.stringify(value));
    const safe = value => esc(String(value ?? ""));
    const validDate = value => typeof value === "string" && Number.isFinite(Date.parse(value));
    const ownKey = (object, key) => Object.prototype.hasOwnProperty.call(object || {}, key);
    const pending = new Map();
    const messages = new Map();
    let lastOwner = null;
    let sequence = 0;
    let discardIntent = null;

    function owner() {
      if (state.signedIn !== true || state.authVerified !== true || state.accountDeletionStatus === "submitted") return "";
      // Only the signed-in, verified prototype session may use this explicit demo key.
      return String(state.authPhone || state.authForm?.phone || "") || "prototype-session";
    }
    function root() {
      const stored = state.oxygenMeasurements;
      return { accounts: stored?.accounts && typeof stored.accounts === "object" && !Array.isArray(stored.accounts) ? stored.accounts : {}, legacyImported: stored?.legacyImported === true };
    }
    function accountData(key = owner()) {
      const accounts = root().accounts;
      const data = key && ownKey(accounts, key) ? accounts[key] : null;
      return { records: Array.isArray(data?.records) ? data.records : [], request: data?.request || null };
    }
    function rawRequest(key = owner()) {
      const q = accountData(key).request;
      return q && q.ownerAccount === key && typeof q.id === "string" && q.id && ["running", "failed", "complete"].includes(q.status) ? q : null;
    }
    function request() {
      const key = owner();
      if (!key) return null;
      const stored = rawRequest(key);
      const draft = pending.get(key);
      // A successful cancellation/deletion/replacement invalidates an unsaved result too.
      if (draft && stored?.id === draft.id && stored.status !== "complete") return copy(draft);
      if (draft) pending.delete(key);
      return copy(stored);
    }
    function records() {
      const key = owner();
      if (!key) return [];
      const seen = new Set();
      return accountData(key).records.filter(record => {
        if (!record || record.ownerAccount !== key || record.type !== "oxygen" || record.quality !== "valid" || !record.id || !record.requestId || !validDate(record.occurredAt) || !Number.isFinite(Number(record.value)) || Number(record.value) <= 0 || Number(record.value) > 100 || seen.has(record.requestId)) return false;
        seen.add(record.requestId);
        return true;
      }).map(copy);
    }
    const busy = () => request()?.status === "running";
    const message = () => messages.get(owner()) || "";
    function say(text) { messages.set(owner(), text); }
    function patchAccount(key, data, extra = {}) {
      const current = root();
      return { oxygenMeasurements: { ...current, accounts: { ...current.accounts, [key]: data } }, ...extra };
    }
    function commit(changes) {
      // The injected writer must persist the entire patch before mutating shared state.
      try { return write(changes) === true; } catch (_) { return false; }
    }
    function blocker(continuing = false) {
      if (!owner()) return "请先登录并完成账号验证，再进行血氧测量。";
      try {
        const reason = unavailable(continuing);
        return typeof reason === "string" ? reason : reason ? "当前条件不支持测量，请检查戒指连接与权限后重试。" : "";
      } catch (_) { return "暂时无法确认测量条件，请检查戒指连接与权限后重试。"; }
    }
    function saveBlocker() {
      if (typeof saveUnavailable !== "function") return blocker(true);
      if (!owner()) return "请先登录并完成账号验证，再保存这次结果。";
      // A captured result needs local persistence, not a continuing BLE connection.
      // The host can block privacy operations without discarding an already acquired result.
      try {
        const reason = saveUnavailable();
        return typeof reason === "string" ? reason : reason ? "当前暂时不能保存，请稍后重试。" : "";
      } catch (_) { return "暂时无法确认保存条件，请保持页面并稍后重试。"; }
    }
    function legacyOwner(record = state.lastMeasurement) { return String(record?.ownerAccount || record?.accountRef || ""); }
    function legacyNotice() {
      return state.lastMeasurement?.type === "oxygen" && !legacyOwner() ? "旧版血氧记录缺少账号归属，未并入当前账号记录。" : "";
    }
    function importLegacy() {
      const key = owner(), current = root(), old = state.lastMeasurement;
      if (!key || current.legacyImported || old?.type !== "oxygen" || legacyOwner(old) !== key) return;
      const value = Number.parseFloat(old.value ?? old.metrics?.find(metric => metric?.[0] === "血氧")?.[1]);
      const occurredAt = old.occurredAt || old.completedAt;
      if (!validDate(occurredAt) || !Number.isFinite(value) || value <= 0 || value > 100 || old.source !== "prototype-demo") return;
      const id = String(old.id || `oxygen-legacy-${encodeURIComponent(key)}-${Date.parse(occurredAt)}`);
      const requestId = String(old.requestId || id);
      const data = accountData(key);
      const record = { id, requestId, type: "oxygen", value, quality: "valid", occurredAt, completedAt: validDate(old.completedAt) ? old.completedAt : occurredAt, source: "prototype-demo", ownerAccount: key, metrics: [["血氧", String(value), "%"]] };
      const next = data.records.some(r => r?.requestId === requestId && r.ownerAccount === key) ? data.records : [...data.records, record];
      const changes = patchAccount(key, { ...data, records: next });
      changes.oxygenMeasurements.legacyImported = true;
      commit(changes);
    }
    function prepare() {
      const key = owner();
      if (key !== lastOwner) {
        discardIntent = null;
        lastOwner = key;
        if (state.measurementType === "oxygen") { state.measurementStatus = "ready"; state.measured = false; }
      }
      importLegacy();
      const q = request();
      // Compatibility flags are derived; persisted requests and records remain the source of truth.
      if (q?.status === "running" || state.measurementType === "oxygen") {
        state.measurementType = "oxygen";
        state.measurementStatus = q?.status || "ready";
        state.measured = q?.status === "complete" && records().some(r => r.requestId === q.id);
      }
      return q;
    }
    function newId() {
      const random = window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Math.random().toString(36).slice(2, 10)}-${++sequence}`;
      return `oxygen-${Date.now()}-${random}`;
    }
    function start(origin = "HLT-05", previousContext) {
      prepare();
      const key = owner(), existing = request();
      if (existing?.status === "running" || existing?.pendingResult) {
        const flags = { measurementType: "oxygen", measurementStatus: existing.status, measured: false };
        const changes = existing.pendingResult ? patchAccount(key, { ...accountData(key), request: existing }, flags) : flags;
        if (commit(changes)) go("HLT-04");
        else { say("未能保存页面状态，请保持当前页面并重试。"); render(); }
        return false;
      }
      const reason = blocker(false);
      if (reason) { say(reason); render(); return false; }
      const q = { id: newId(), ownerAccount: key, status: "running", origin: origin === "HLT-03" ? "HLT-03" : "HLT-05", context: copy(previousContext ?? returnContext()), startedAt: new Date().toISOString(), pendingResult: null, resultId: "", error: "", failureKind: "" };
      const data = accountData(key);
      if (!commit(patchAccount(key, { ...data, request: q }, { measurementType: "oxygen", measurementStatus: "running", measured: false }))) {
        say("未能保存测量请求，本次尚未开始。请检查浏览器存储后重试。"); render(); return false;
      }
      pending.delete(key); say(""); go("HLT-04"); return true;
    }
    function fail(q, reason, failureKind = "measurement") {
      const key = owner();
      if (!key || q.ownerAccount !== key || rawRequest(key)?.id !== q.id) return false;
      const failed = { ...q, status: "failed", error: reason, failureKind };
      if (!commit(patchAccount(key, { ...accountData(key), request: failed }, { measurementType: "oxygen", measurementStatus: "failed", measured: false }))) {
        pending.set(key, failed);
        say(`${reason} 状态尚未保存，请不要关闭页面，稍后重试。`);
      } else { pending.delete(key); say(reason); }
      return true;
    }
    function saveResult(q) {
      const key = owner();
      if (!key || q.ownerAccount !== key || rawRequest(key)?.id !== q.id || !q.pendingResult || q.pendingResult.ownerAccount !== key || q.pendingResult.requestId !== q.id) return false;
      const reason = saveBlocker();
      if (reason) { say(`${reason} 结果还未保存，请不要关闭页面，重试保存。`); return false; }
      const data = accountData(key);
      const existing = data.records.find(r => r?.requestId === q.id && r.ownerAccount === key);
      const record = existing || q.pendingResult;
      const completed = { ...q, status: "complete", pendingResult: null, resultId: record.id, error: "", failureKind: "", completedAt: record.completedAt };
      if (!commit(patchAccount(key, { ...data, records: existing ? data.records : [...data.records, record], request: completed }, { measurementType: "oxygen", measurementStatus: "complete", measured: true }))) {
        pending.set(key, { ...q, status: "failed", failureKind: "save", error: "结果还未保存，请不要关闭页面，重试保存。" });
        say("结果还未保存，请不要关闭页面，重试保存。"); return false;
      }
      pending.delete(key); say(""); return true;
    }
    function complete(q) {
      if (!q || q.ownerAccount !== owner()) return;
      if (q.status === "complete") return;
      if (q.pendingResult) { saveResult(q); return; }
      if (q.status !== "running") return;
      const reason = blocker(true);
      if (reason) { fail(q, reason); return; }
      const at = new Date().toISOString();
      const record = { id: `${q.id}-result`, requestId: q.id, type: "oxygen", value: 98, quality: "valid", occurredAt: at, completedAt: at, source: "prototype-demo", ownerAccount: q.ownerAccount, metrics: [["血氧", "98", "%"]] };
      const ready = { ...q, status: "failed", failureKind: "save", pendingResult: record, error: "结果还未保存，请不要关闭页面，重试保存。" };
      // Keep the immutable result before either persistence attempt. A retry never resamples time.
      pending.set(q.ownerAccount, ready);
      if (!commit(patchAccount(q.ownerAccount, { ...accountData(q.ownerAccount), request: ready }, { measurementType: "oxygen", measurementStatus: "failed", measured: false }))) {
        say(ready.error); return;
      }
      saveResult(ready);
    }
    function cancel(q) {
      if (!q || q.ownerAccount !== owner() || q.status === "complete") return false;
      if (!commit(patchAccount(q.ownerAccount, { ...accountData(q.ownerAccount), request: null }, { measurementType: "oxygen", measurementStatus: "ready", measured: false }))) {
        say("取消尚未保存，本次请求仍保留。请保持页面并重试取消。"); return false;
      }
      pending.delete(q.ownerAccount); say(""); discardIntent = null; leave({ ...q, pendingResult: null }); return true;
    }
    function leave(q, record) {
      if (q?.pendingResult) { say("结果还未保存，请不要关闭页面，重试保存。"); return; }
      if (record) { onReturn(copy(q?.context), copy(record)); return; }
      if (q?.origin === "HLT-03") go("HLT-03");
      else onReturn(copy(q?.context ?? returnContext()));
    }
    function handle(action) {
      if (typeof action !== "string" || !action.startsWith("oxygen-measure:")) return false;
      const [command, expectedId] = action.slice("oxygen-measure:".length).split(":");
      if (!["start", "complete", "cancel", "discard-confirm", "retry", "save", "review-fail", "return", "view"].includes(command)) return false;
      if (command !== "start" && state.current !== "HLT-04") return true;
      prepare();
      const q = request();
      if (expectedId && q?.id !== expectedId) return true;
      if (command === "start") { start(state.current === "HLT-03" ? "HLT-03" : "HLT-05"); return true; }
      if (command === "complete") complete(q);
      if (command === "save" && q?.pendingResult) saveResult(q);
      if (command === "cancel") {
        if (q?.pendingResult) { discardIntent = { owner: owner(), id: q.id }; requestDiscard?.(q); }
        else { cancel(q); render(); }
        return true;
      }
      if (command === "discard-confirm") {
        if (!q?.pendingResult || !expectedId || discardIntent?.owner !== owner() || discardIntent.id !== q.id || !discardIsOpen?.(q.id)) return true;
        cancel(q); discardIntent = null; closeDiscard?.(); render(); return true;
      }
      if (command === "retry" && q?.status === "failed" && !q.pendingResult) { start(q.origin, q.context); return true; }
      if (command === "review-fail" && q?.status === "running" && !q.pendingResult) fail(q, "本次没有获得可用数据。请确认戒指连接与佩戴后重新测量。");
      if (command === "return") { leave(q); render(); return true; }
      if (command === "view" && q?.status === "complete") {
        const record = records().find(r => r.requestId === q.id && r.id === q.resultId);
        if (record) { leave(q, record); return true; }
        say("这次记录已不可用，请返回血氧查看当前记录。");
      }
      prepare(); render(); return true;
    }
    function deletionChanges() {
      const key = owner(), current = root();
      if (!key) return {};
      const changes = patchAccount(key, { records: [], request: null });
      // Preserve another known owner's unimported legacy record; never reimport the deleted owner's.
      changes.oxygenMeasurements.legacyImported = current.legacyImported || !legacyOwner() || legacyOwner() === key;
      return changes;
    }
    function displayTime(at) {
      if (!validDate(at)) return "时间不可用";
      const date = new Date(Date.parse(at) + 8 * 60 * 60 * 1000).toISOString();
      return `${date.slice(0, 10).replaceAll("-", "/")} ${date.slice(11, 19)} · UTC+8`;
    }
    function button(label, action, type = "primary", q, disabled = false) {
      return `<button type="button" class="${type}" data-action="oxygen-measure:${action}${q ? `:${safe(q.id)}` : ""}"${disabled ? " disabled" : ""}>${safe(label)}</button>`;
    }
    function page(item) {
      const q = prepare(), key = owner(), unsaved = !!q?.pendingResult;
      const record = q?.status === "complete" ? records().find(r => r.requestId === q.id && r.id === q.resultId) : null;
      const missing = q?.status === "complete" && !record;
      const reason = q?.status === "complete" ? "" : unsaved ? saveBlocker() : blocker(q?.status === "running");
      const error = message() || (unsaved ? "" : q?.error || "");
      const heading = record ? "测量完成" : missing ? "这次记录已不可用" : unsaved ? "结果还没保存" : q?.status === "failed" ? "这次没测成功" : q?.status === "running" ? reason ? "暂时无法继续" : "正在测量" : "准备开始";
      const backLabel = q?.origin === "HLT-03" ? "返回主动测量" : "返回血氧";
      const chevron = path => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
      const stage = record ? 3 : unsaved ? 2 : 0;
      const steps = `<ol class="oxygen-measure-steps" aria-label="本次测量步骤">${["测量", "结果", "保存"].map((label, i) => { const done = i < stage, current = !missing && i === stage && !!q; const stepState = done ? "done" : current ? q?.status === "failed" && !unsaved ? "failed" : "current" : "upcoming"; return `<li data-state="${stepState}"${current ? ' aria-current="step"' : ""}><span aria-hidden="true">${done ? "✓" : i+1}</span><small>${label}</small></li>`; }).join("")}</ol>`;
      const shortTime = at => displayTime(at).replace(" · UTC+8", " · 北京时间");
      const visual = (path, image = false) => `<div class="oxygen-measure-visual" aria-hidden="true">${image && symbol ? `<img src="${safe(symbol)}" alt="">` : chevron(path)}</div>`;
      let content = "", actions = "";
      if (record) {
        content = `<div class="oxygen-measure-result"><p>本次血氧</p><strong>${safe(record.value)}<span>%</span></strong><time datetime="${safe(record.occurredAt)}">${safe(shortTime(record.occurredAt))}</time><span class="oxygen-measure-tag">已保存 · 主动测量记录</span></div>`;
        actions = button("查看血氧记录", "view", "primary", q) + button(backLabel, "return", "secondary", q);
      } else if (missing) {
        content = '<p class="oxygen-measure-copy">可以返回查看当前账号的其他记录。</p>';
        actions = button(backLabel, "return", "primary", q);
      } else if (unsaved) {
        content = `<div class="oxygen-measure-result is-pending"><p>本次血氧 · 尚未保存</p><strong>${safe(q.pendingResult.value)}<span>%</span></strong><time datetime="${safe(q.pendingResult.occurredAt)}">${safe(shortTime(q.pendingResult.occurredAt))}</time><span class="oxygen-measure-tag">尚未加入记录</span></div><p class="oxygen-measure-copy">重试只保存这次结果，不会重新测量。保存前请先不要关闭页面。</p>`;
        actions = button("重试保存", "save", "primary", q, !!reason) + button("放弃未保存结果", "cancel", "text-button", q);
      } else if (q?.status === "running") {
        content = visual("M8 12h8", true) + '<p class="oxygen-measure-copy">保持手部安静，让戒指贴合手指。</p><p class="oxygen-measure-caption">这是交互演示，点击下方按钮查看结果。</p>';
        actions = button("完成演示测量", "complete", "primary", q, !!reason) + button("稍后继续", "return", "secondary", q) + button("取消本次测量", "cancel", "text-button", q);
      } else if (q?.status === "failed") {
        content = visual("M12 5v9m0 4h.01") + '<p class="oxygen-measure-copy">本次没有新增记录，已有记录不受影响。</p>';
        actions = button("重新测量", "retry", "primary", q, !!reason) + button(backLabel, "return", "secondary", q);
      } else {
        content = visual("M8 12h8", true) + '<p class="oxygen-measure-copy">佩戴舒适，保持手部安静。</p>';
        actions = button("开始演示测量", "start", "primary", null, !!reason || !key) + button("返回血氧", "return", "secondary");
      }
      const recoveryLink = reason && typeof recovery === "function" ? recovery({ saving: unsaved, reason }) : null;
      const feedback = reason || error;
      const resolution = feedback ? `<div class="oxygen-measure-resolution" role="status"><p>${safe(feedback)}</p>${recoveryLink ? `<button type="button" class="text-button" data-action="${safe(recoveryLink.action)}">${safe(recoveryLink.label)}${chevron("m9 5 7 7-7 7")}</button>` : ""}</div>` : "";
      return `<section class="oxygen-measure-page" aria-labelledby="oxygen-measure-title"><header class="oxygen-measure-toolbar">${button(chevron("m15 5-7 7 7 7"), unsaved ? "cancel" : "return", "oxygen-measure-back", q).replace(safe(chevron("m15 5-7 7 7 7")), chevron("m15 5-7 7 7 7")).replace('type="button"', `type="button" aria-label="${unsaved ? "返回前处理未保存结果" : q?.status === "running" ? "返回，稍后继续测量" : backLabel}"`)}<h1 id="oxygen-measure-title">血氧测量</h1><span class="oxygen-measure-demo">演示</span></header>${steps}<div class="oxygen-measure-body"><div class="oxygen-measure-state" role="status"><h2>${heading}</h2></div>${content}${resolution}</div><div class="oxygen-measure-actions">${actions}</div>${q?.status === "running" && !unsaved ? '<p class="oxygen-measure-caption">稍后继续会保留这次测量；取消则结束本次。</p>' : ""}<details class="oxygen-measure-details"><summary>关于本次测量${chevron("m9 5 7 7-7 7")}</summary><div><p>当前为原型演示，未连接真实采集，不显示预计时长或自动进度。</p><p>保存的演示记录可在当前浏览器的测量记录中查看。主动测量与睡眠平均分开，不单独改变 Body Weather，也不用于诊断。</p>${unsaved ? '<p>若浏览器存储不可用，刷新或关闭页面可能丢失尚未保存的结果。</p>' : ""}${legacyNotice() ? `<p>${safe(legacyNotice())}</p>` : ""}</div></details></section>`;
    }
    function reviewControls(item) {
      const q = request();
      if (item?.id !== "HLT-04" || state.measurementType !== "oxygen" || q?.status !== "running") return "";
      return `<section class="review-controls oxygen-measure-review"><p>OXYGEN MEASUREMENT</p><h3>主动血氧审阅</h3><small>仅桌面审阅使用；不出现在用户测量页。</small><div class="review-control-group"><div>${button("注入测量失败", "review-fail", "secondary", q)}</div></div></section>`;
    }
    return { records, request, busy, start, handle, page, prepare, reviewControls, deletionChanges, message, legacyNotice };
  };
})();
