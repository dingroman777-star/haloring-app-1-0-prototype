(function () {
  window.createHaloRhythmSettingsStore = function ({ state, write, validDate, today, hasPeriodRecords = () => false }) {
    const keys = ["mode", "startDate", "cycleLength", "duration", "notice", "prediction", "periodNotice"];
    const routes = ["RHY-00", "RHY-04", "RHY-05"];
    const object = value => value && typeof value === "object" && !Array.isArray(value);
    const clone = value => JSON.parse(JSON.stringify(value));
    let openedOwner = "", issue = { error: "", code: "" };
    const owner = () => state.signedIn ? String(state.authPhone || state.authForm?.phone || "legacy-session") : "";
    const root = () => state.rhythmSettingsEditor;
    const entry = () => root()?.accounts?.[owner()];
    const normalize = value => ({ mode: value?.mode === "cycle" ? "cycle" : "record-only", startDate: String(value?.startDate || ""), cycleLength: String(value?.cycleLength || ""), duration: String(value?.duration || ""), notice: value?.notice === true, prediction: value?.prediction !== false, periodNotice: value?.periodNotice === true });
    const empty = () => ({ values: normalize({}), status: "empty", confirmed: false, confirmedAt: "", deleted: false });
    const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    function fail(error, code = "validation") { issue = { error, code }; return { ok: false, error, code }; }
    function gate() {
      if (!owner()) return "请先登录，再调整节律设置。";
      if (!routes.includes(state.current)) return "请从节律设置页面继续操作。";
      if (state.accountDeletionStatus && state.accountDeletionStatus !== "ready") return "账号正在处理注销，暂时不能调整设置。";
      if (state.healthDeletionStatus && state.healthDeletionStatus !== "ready") return "健康数据正在处理删除，暂时不能调整设置。";
      return "";
    }
    function errors(values) {
      if (values.mode !== "cycle") return {};
      const result = {};
      let valid = false;
      try { valid = validDate(values.startDate) && values.startDate <= today(); } catch { /* Invalid dates remain editable, never confirmed. */ }
      if (!valid) result.startDate = "请选择今天或过去的有效日期。";
      const length = Number(values.cycleLength), duration = Number(values.duration);
      if (!Number.isInteger(length) || length < 20 || length > 45) result.cycleLength = "请填写 20–45 之间的整数，或选择只记录感受。";
      if (!Number.isInteger(duration) || duration < 2 || duration > 10) result.duration = "请填写 2–10 之间的整数，或选择只记录感受。";
      return result;
    }
    function readAliases() {
      const fields = state.rhythmSettings || {}, stamp = Date.parse(state.rhythmSettingsConfirmedAt || "");
      const values = normalize({ ...fields, mode: state.rhythmMode, notice: state.toggles?.rhythmNotice });
      const valid = !Object.keys(errors({ ...values, mode: "cycle" })).length;
      const confirmed = !state.rhythmDeleted && valid && (state.rhythmSettingsSaved === true || Number.isFinite(stamp) && stamp <= Date.now());
      if (state.rhythmDeleted || !confirmed && !values.startDate) {
        values.mode = "record-only"; values.startDate = ""; values.cycleLength = ""; values.duration = "";
      }
      if (!confirmed && values.mode === "cycle") values.mode = "record-only";
      return { values, status: state.rhythmStatus || "empty", confirmed, confirmedAt: confirmed ? String(state.rhythmSettingsConfirmedAt || "") : "", deleted: state.rhythmDeleted === true };
    }
    function current() { return root()?.activeOwner === owner() ? readAliases() : object(entry()?.saved) ? clone(entry().saved) : empty(); }
    function fields(values) { return { startDate: values.startDate, cycleLength: values.cycleLength, duration: values.duration, prediction: values.prediction !== false, periodNotice: values.periodNotice === true }; }
    function aliases(saved) {
      return { rhythmSettings: fields(saved.values), rhythmSettingsDraft: fields(saved.values), rhythmSettingsSaved: saved.confirmed, rhythmSettingsConfirmedAt: saved.confirmedAt,
        rhythmMode: saved.values.mode, rhythmStatus: saved.status, rhythmDeleted: saved.deleted, toggles: { ...state.toggles, rhythmNotice: saved.values.notice } };
    }
    function commit(changes, records) {
      try {
        if (write(changes, records) !== true) return false;
        Object.assign(state, changes);
        if (records !== undefined) state.subjectiveRecords = records;
        return true;
      } catch { return false; }
    }
    function open() {
      const error = gate();
      if (error) return fail(error, "unavailable");
      const account = owner(), first = !object(root()) || root().version !== 1;
      const next = first ? { version: 1, legacyOwner: account, activeOwner: account, accounts: {} } : clone(root());
      if (!object(next.accounts)) next.accounts = {};
      if (next.activeOwner && object(next.accounts[next.activeOwner])) next.accounts[next.activeOwner].saved = readAliases();
      if (!object(next.accounts[account])) {
        const saved = first || next.legacyOwner === account && !next.activeOwner ? readAliases() : empty();
        const old = first && !state.rhythmDeleted && object(state.rhythmSettingsDraft) ? state.rhythmSettingsDraft : null;
        const oldHasInput = old && (String(old.startDate || "") || String(old.cycleLength || "") !== String(state.rhythmSettings?.cycleLength || "") || String(old.duration || "") !== String(state.rhythmSettings?.duration || ""));
        const values = normalize(oldHasInput ? { ...saved.values, ...old, mode: saved.values.mode === "cycle" || !saved.confirmed && old.startDate ? "cycle" : saved.values.mode } : saved.values);
        next.accounts[account] = { saved, draft: { owner: account, values, base: clone(saved) } };
      }
      const own = next.accounts[account];
      if (!object(own.saved)) own.saved = empty();
      if (!object(own.draft) || own.draft.owner !== account || !object(own.draft.values) || !object(own.draft.base)) own.draft = { owner: account, values: normalize(own.saved.values), base: clone(own.saved) };
      else own.draft.values = normalize(own.draft.values);
      // A clean editor has no user changes to protect. Follow a pause/deletion
      // from another rhythm page; only genuine edits require conflict recovery.
      if (own.saved.deleted && own.draft.base.deleted !== true || equal(own.draft.values, normalize(own.draft.base.values))) own.draft = { owner: account, values: normalize(own.saved.values), base: clone(own.saved) };
      const switching = next.activeOwner !== account;
      next.activeOwner = account;
      const changes = { ...(switching ? aliases(own.saved) : {}), rhythmSettingsEditor: next, rhythmSettingsDraft: fields(own.draft.values) };
      if (!commit(changes)) {
        if (switching) { openedOwner = ""; return fail("暂时无法打开当前账号的设置，请稍后重试。", "storage"); }
        state.rhythmSettingsEditor = next;
        state.rhythmSettingsDraft = fields(own.draft.values);
        issue = { code: "storage", error: "修改暂未保存到本机，原设置没有改变。请先不要关闭页面。" };
      } else issue = { error: "", code: "" };
      openedOwner = account;
      const view = inspect();
      return view.conflict ? fail("已保存的设置发生变化，旧修改仍然保留。请查看最新设置后再修改。", "conflict") : { ok: true, error: issue.error };
    }
    function inspect() {
      const accessError = gate();
      const blocked = { canEdit: false, canSave: false, dirty: false, conflict: false, error: accessError, errors: {}, values: normalize({}), currentValues: normalize({}), currentMode: "record-only", currentStatus: "empty", paused: false, confirmed: false, hasDraft: false };
      if (accessError) return blocked;
      if (openedOwner !== owner() || root()?.activeOwner !== owner() || entry()?.draft?.owner !== owner()) return { ...blocked, error: "请重新打开节律设置，继续当前账号的修改。" };
      const saved = current(), values = normalize(entry().draft.values), problems = errors(values);
      if (saved.deleted && entry().draft.base?.deleted !== true) return { ...blocked, error: "原节律记录已删除，请重新打开设置后填写新的日期。" };
      const conflict = !equal(entry().draft.base, saved), dirty = !equal(values, saved.values);
      return { canEdit: true, canSave: dirty && !conflict && !Object.keys(problems).length, dirty, conflict, error: conflict ? "已保存的设置发生变化，旧修改仍然保留。" : issue.error, errors: problems,
        values: clone(values), currentValues: clone(saved.values), currentMode: saved.values.mode, currentStatus: saved.status, paused: saved.status === "paused", confirmed: saved.confirmed, hasDraft: true };
    }
    function change(key, value) {
      const view = inspect();
      if (!view.canEdit) return fail(view.error, "unavailable");
      if (!keys.includes(key) || key === "mode" && !["cycle", "record-only"].includes(value) || ["notice", "prediction", "periodNotice"].includes(key) && typeof value !== "boolean") return fail("这项设置无效，请重新选择。");
      if (key === "startDate" && hasPeriodRecords()) return fail("开始日期已来自经期记录，请回到节律首页修改那次记录。");
      const next = clone(root()); next.accounts[owner()].draft.values[key] = ["notice", "prediction", "periodNotice"].includes(key) ? value : String(value);
      state.rhythmSettingsEditor = next;
      state.rhythmSettingsDraft = fields(next.accounts[owner()].draft.values);
      if (!commit({ rhythmSettingsEditor: next, rhythmSettingsDraft: state.rhythmSettingsDraft })) return fail("修改暂未保存到本机，原设置没有改变。请先不要关闭页面。", "storage");
      issue = { error: "", code: "" };
      return { ok: true, error: "" };
    }
    function restartChanges() {
      const account = owner(), recordOwner = value => String(value?.ownerAccount || value?.accountRef || value?.owner || "");
      const foreign = value => recordOwner(value) && recordOwner(value) !== account;
      const rhythmRecords = Object.fromEntries(Object.entries(state.rhythmRecords || {}).filter(([, value]) => foreign(value)));
      const rhythmEntryDrafts = Object.fromEntries(Object.entries(state.rhythmEntryDrafts || {}).filter(([, value]) => foreign(value)));
      const records = (Array.isArray(state.subjectiveRecords) ? state.subjectiveRecords : []).filter(value => value.category !== "rhythm" || foreign(value));
      // A genuinely new post-deletion draft is not an old retained record. Rebase
      // it against the empty journal so configuring a cycle does not discard it.
      for (const [key, draft] of Object.entries(state.rhythmEntryDrafts || {})) {
        if (draft?.owner === account && draft.restartAfterDeletion === true) rhythmEntryDrafts[key] = { ...draft, baseSavedAt: null, baseSignature: "null" };
      }
      const subjectiveMarkers = [...new Set(records.flatMap(value => Array.isArray(value.labels) ? value.labels : value.label ? [value.label] : []))];
      return { changes: { rhythmRecords, rhythmEntryDrafts, subjectiveMarkers }, records };
    }
    function save() {
      const view = inspect();
      if (!view.canEdit) return fail(view.error, "unavailable");
      if (view.conflict) return fail(view.error, "conflict");
      if (Object.keys(view.errors).length) return fail("请检查周期日期和填写范围。", "validation");
      if (!view.dirty) return { ok: true, error: "", unchanged: true };
      const before = current(), values = normalize(view.values), addingCycle = values.mode === "cycle";
      if (addingCycle) { values.startDate = values.startDate.trim(); values.cycleLength = String(Number(values.cycleLength)); values.duration = String(Number(values.duration)); }
      else Object.assign(values, { startDate: before.values.startDate, cycleLength: before.values.cycleLength, duration: before.values.duration }); // Disabling display never deletes committed parameters.
      if (hasPeriodRecords() && values.startDate !== before.values.startDate) return fail("开始日期已来自经期记录，请先查看最新设置后再修改。");
      const sameCycle = ["startDate", "cycleLength", "duration"].every(key => values[key] === before.values[key]);
      const cycleChanged = !before.confirmed || before.values.mode !== "cycle" || !sameCycle;
      const saved = { values, status: !before.deleted && before.status === "paused" ? "paused" : addingCycle ? before.deleted || cycleChanged ? "ready" : before.status : before.deleted ? "empty" : before.status,
        confirmed: addingCycle || before.confirmed, confirmedAt: addingCycle && (!before.confirmed || !sameCycle) ? new Date().toISOString() : before.confirmedAt, deleted: before.deleted && !addingCycle };
      const next = clone(root()); next.activeOwner = owner(); next.accounts[owner()] = { saved: clone(saved), draft: { owner: owner(), values: clone(values), base: clone(saved) } };
      const clearing = before.deleted && addingCycle ? restartChanges() : null;
      const changes = { ...aliases(saved), rhythmSettingsEditor: next, ...(clearing?.changes || {}) };
      if (!commit(changes, clearing?.records)) return fail("设置暂未保存，原模式、日期和提醒偏好都没有改变。你的修改仍在，可以重试。", "storage");
      issue = { error: "", code: "" };
      return { ok: true, error: "" };
    }
    function discard() {
      const view = inspect();
      if (!view.canEdit) return fail(view.error, "unavailable");
      const saved = current(), next = clone(root());
      next.accounts[owner()] = { saved: clone(saved), draft: { owner: owner(), values: clone(saved.values), base: clone(saved) } };
      if (!commit({ rhythmSettingsEditor: next, rhythmSettingsDraft: fields(saved.values) })) return fail("暂时无法放弃修改，草稿仍然保留。请稍后重试。", "storage");
      issue = { error: "", code: "" };
      return { ok: true, error: "" };
    }
    function resume() {
      const view = inspect();
      if (!view.canEdit) return fail(view.error, "unavailable");
      if (view.conflict || view.dirty) return fail("请先保存或放弃当前修改，再恢复周期展示。", "conflict");
      const before = current();
      if (before.deleted || !before.confirmed || before.values.mode !== "cycle" || !["paused", "ready"].includes(before.status)) return fail("请先确认周期日期，再选择恢复展示。");
      if (before.status === "ready") return { ok: true, error: "", unchanged: true };
      const saved = { ...before, status: "ready" }, next = clone(root());
      next.accounts[owner()] = { saved: clone(saved), draft: { owner: owner(), values: clone(saved.values), base: clone(saved) } };
      if (!commit({ ...aliases(saved), rhythmSettingsEditor: next })) return fail("暂时无法恢复展示，当前仍保持暂停。请稍后重试。", "storage");
      issue = { error: "", code: "" };
      return { ok: true, error: "" };
    }
    function pause() {
      const view = inspect();
      if (!view.canEdit) return fail(view.error, "unavailable");
      if (view.conflict || view.dirty) return fail("请先保存或放弃当前修改，再暂停周期展示。", "conflict");
      const before = current();
      if (before.deleted || !before.confirmed || before.values.mode !== "cycle" || !["ready", "paused"].includes(before.status)) return fail("当前没有正在展示的已确认周期。");
      if (before.status === "paused") return { ok: true, error: "", unchanged: true };
      const saved = { ...before, status: "paused" }, next = clone(root());
      next.accounts[owner()] = { saved: clone(saved), draft: { owner: owner(), values: clone(saved.values), base: clone(saved) } };
      if (!commit({ ...aliases(saved), rhythmSettingsEditor: next })) return fail("暂时无法暂停，原展示状态没有改变。请稍后重试。", "storage");
      issue = { error: "", code: "" };
      return { ok: true, error: "" };
    }
    function deletionChanges() {
      if (!owner()) return {};
      if (!object(root()) || root().version !== 1) return { rhythmSettingsEditor: null };
      const next = clone(root()), account = owner();
      if (!object(next.accounts)) next.accounts = {};
      // The caller also deletes the current account's committed rhythm data.
      // Never import another account's currently active global aliases here.
      const notice = next.activeOwner === account ? state.toggles?.rhythmNotice === true : next.accounts[account]?.saved?.values?.notice === true;
      const saved = { ...empty(), values: normalize({ notice }), deleted: true };
      next.accounts[account] = { saved: clone(saved), draft: { owner: account, values: clone(saved.values), base: clone(saved) } };
      next.activeOwner = account;
      return { rhythmSettingsEditor: next };
    }
    function recordChanges(startDate) {
      const account = owner();
      if (!account || state.current !== "RHY-01" || root()?.activeOwner && root().activeOwner !== account) return null;
      const before = readAliases(), saved = clone(before);
      saved.values.startDate = startDate;
      saved.confirmed = !!startDate && !Object.keys(errors({ ...saved.values, mode: "cycle" })).length;
      saved.confirmedAt = saved.confirmed ? new Date().toISOString() : "";
      saved.status = before.status === "paused" ? "paused" : saved.confirmed ? "ready" : "empty";
      saved.deleted = false;
      const next = object(root()) ? clone(root()) : {version:1,legacyOwner:account,activeOwner:account,accounts:{}};
      next.accounts ||= {}; next.activeOwner = account;
      const oldDraft = next.accounts[account]?.draft;
      const dirty = oldDraft && !equal(normalize(oldDraft.values), normalize(oldDraft.base?.values));
      next.accounts[account] = {saved:clone(saved),draft:dirty?oldDraft:{owner:account,values:clone(saved.values),base:clone(saved)}};
      return {...aliases(saved),rhythmSettingsEditor:next,rhythmSettingsDraft:fields(next.accounts[account].draft.values)};
    }
    return { open, inspect, change, save, discard, pause, resume, deletionChanges, recordChanges };
  };
})();
