(function () {
  window.createHaloRhythmRecordStore = function ({ state, write, validDate, today }) {
    const feelings = ["睡得少", "情绪敏感", "身体轻松", "有精神"];
    const owns = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
    const isObject = value => value && typeof value === "object" && !Array.isArray(value);
    let active = null;
    let issue = { error: "", code: "" };

    function owner() { return state.signedIn ? String(state.authPhone || state.authForm?.phone || "legacy-session") : ""; }
    function key(account, date) { return `${account}|${date}`; }
    function records() { return isObject(state.rhythmRecords) ? state.rhythmRecords : {}; }
    function drafts() { return isObject(state.rhythmEntryDrafts) ? state.rhythmEntryDrafts : {}; }
    function record(date) { return owns(records(), date) && isObject(records()[date]) ? records()[date] : null; }
    function recordOwner(value) { return String(value?.ownerAccount || value?.accountRef || value?.owner || ""); }
    function failure(error, code = "validation") { issue = { error, code }; return { ok: false, error, code }; }
    function allowed(date) {
      if (!owner()) return "请先登录，再记录感受。";
      if (state.accountDeletionStatus && state.accountDeletionStatus !== "ready") return "账号正在处理注销，暂时不能修改记录。";
      if (state.healthDeletionStatus && state.healthDeletionStatus !== "ready") return "健康数据正在处理删除，暂时不能修改记录。";
      let valid = false;
      try { valid = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) && validDate(date) && date <= today(); } catch { /* Invalid dates never become record keys. */ }
      if (!valid) return "请选择今天或过去的有效日期。";
      const saved = record(date), savedOwner = recordOwner(saved);
      if (saved?.date && saved.date !== date || saved?.source && saved.source !== "user-record") return "这条记录的日期或来源需要核对，请返回日历。";
      return savedOwner && savedOwner !== owner() ? "这条记录不属于当前账号，请重新选择日期。" : "";
    }
    // Legacy records have no revision timestamp. Keep a content fingerprint only for
    // conflict detection; new records use savedAt and always carry an owner.
    function revision(value) {
      if (!value) return null;
      return typeof value.savedAt === "string" && value.savedAt ? value.savedAt : `legacy:${JSON.stringify([value.id || "", value.feeling || "", value.note || "", recordOwner(value)])}`;
    }
    function signature(value) { return JSON.stringify(value ? [value.id || "", value.date || "", value.feeling || "", value.note || "", recordOwner(value)] : null); }
    function changed(base, value) { return base.baseSavedAt !== revision(value) || typeof base.baseSignature === "string" && base.baseSignature !== signature(value); }
    function differentBase(first, second) { return first.baseSavedAt !== second.baseSavedAt || typeof first.baseSignature === "string" && typeof second.baseSignature === "string" && first.baseSignature !== second.baseSignature; }
    function storedDraft(date, account = owner()) {
      const value = drafts()[key(account, date)];
      if (!isObject(value) || value.owner !== account || value.date !== date || !owns(value, "baseSavedAt")) return null;
      return { owner: account, date, feeling: typeof value.feeling === "string" ? value.feeling : "", note: String(value.note || ""), baseSavedAt: value.baseSavedAt, ...(typeof value.baseSignature === "string" ? { baseSignature: value.baseSignature } : {}), ...(value.restartAfterDeletion === true ? { restartAfterDeletion: true } : {}) };
    }
    function writeChanges(changes, userRecords) {
      try {
        if (write(changes, userRecords) !== true) return false;
        Object.assign(state, changes);
        if (userRecords !== undefined) state.subjectiveRecords = userRecords;
        return true;
      } catch { return false; }
    }
    function open(date) {
      const error = allowed(date);
      if (error) return failure(error, "unavailable");
      const account = owner(), saved = record(date), cached = storedDraft(date, account), restarting = state.rhythmDeleted === true;
      // Only a draft explicitly started after deletion may resume. Never prefill
      // a newly restarted editor with tombstoned records or legacy cached drafts.
      const prior = restarting && cached?.restartAfterDeletion !== true ? null : cached;
      const entry = prior ? { ...prior, ...(!changed(prior, saved) && typeof prior.baseSignature !== "string" ? { baseSignature: signature(saved) } : {}) } : { owner: account, date, feeling: restarting ? "" : saved?.feeling || "", note: restarting ? "" : String(saved?.note || ""), baseSavedAt: revision(saved), baseSignature: signature(saved), ...(restarting ? { restartAfterDeletion: true } : {}) };
      active = { owner: account, date, baseSavedAt: entry.baseSavedAt, ...(typeof entry.baseSignature === "string" ? { baseSignature: entry.baseSignature } : {}), ...(entry.restartAfterDeletion ? { restartAfterDeletion: true } : {}) };
      state.selectedRhythmDate = date;
      state.rhythmFeeling = entry.feeling;
      state.rhythmNote = entry.note;
      state.rhythmEntryDrafts = { ...drafts(), [key(account, date)]: entry };
      if (prior && changed(prior, saved)) return failure("这一天的记录已更新，旧草稿没有覆盖它。请先查看最新记录，再决定如何修改。", "conflict");
      issue = { error: "", code: "" };
      // Opening remains possible without storage; capture/save must report failures.
      return { ok: true, error: "" };
    }
    function current() {
      const date = state.selectedRhythmDate, error = allowed(date);
      if (error) return failure(error, "unavailable");
      const account = owner(), prior = storedDraft(date, account);
      if (!active && prior) {
        active = { owner: prior.owner, date: prior.date, baseSavedAt: prior.baseSavedAt, ...(typeof prior.baseSignature === "string" ? { baseSignature: prior.baseSignature } : {}), ...(prior.restartAfterDeletion ? { restartAfterDeletion: true } : {}) };
        state.rhythmFeeling = prior.feeling; state.rhythmNote = prior.note;
      }
      if (!active || active.owner !== account || active.date !== date) return failure("编辑账号或日期已经变化，请返回日历重新打开这一天。", "scope");
      if (state.rhythmDeleted && active.restartAfterDeletion !== true) return failure("原节律数据已经删除，请从日历重新开始记录。", "unavailable");
      if (changed(active, record(date)) || prior && differentBase(prior, active)) return failure("这一天的记录已更新，尚未保存的修改仍然保留。请先查看最新记录，再继续编辑。", "conflict");
      const note = String(state.rhythmNote || "");
      if (note.length > 500) return failure("补充感受最多 500 字，请删减后再保存。");
      return { ok: true, entry: { owner: account, date, feeling: String(state.rhythmFeeling || ""), note, baseSavedAt: active.baseSavedAt, ...(typeof active.baseSignature === "string" ? { baseSignature: active.baseSignature } : {}), ...(active.restartAfterDeletion ? { restartAfterDeletion: true } : {}) } };
    }
    function capture() {
      if (state.current !== "RHY-03") return true;
      // A successful commit clears its draft before navigation captures the page.
      if (!active && !storedDraft(state.selectedRhythmDate)) return true;
      const result = current();
      if (!result.ok) {
        if (result.code === "conflict") {
          const value = inspect();
          if (value.canEdit && value.safeNote.length <= 500) {
            const entry = { owner: owner(), date: value.date, feeling: value.safeFeeling, note: value.safeNote, baseSavedAt: active.baseSavedAt, ...(typeof active.baseSignature === "string" ? { baseSignature: active.baseSignature } : {}), ...(active.restartAfterDeletion ? { restartAfterDeletion: true } : {}) };
            state.rhythmEntryDrafts = { ...drafts(), [key(entry.owner, entry.date)]: entry };
            if (!writeChanges({ rhythmEntryDrafts: state.rhythmEntryDrafts })) failure("记录已更新，且草稿暂未写入本机。原记录和本页修改都还在，请先不要关闭页面。", "conflict");
          }
        }
        return false;
      }
      const entry = result.entry;
      state.rhythmEntryDrafts = { ...drafts(), [key(entry.owner, entry.date)]: entry };
      if (!writeChanges({ rhythmEntryDrafts: state.rhythmEntryDrafts })) { failure("草稿暂未保存到本机。内容还在，请先不要关闭页面。", "storage"); return false; }
      issue = { error: "", code: "" };
      return true;
    }
    function inspect() {
      const date = state.selectedRhythmDate, account = owner(), accessError = allowed(date);
      const blank = { canEdit: false, canSave: false, canDelete: false, dirty: false, conflict: false, error: accessError, hasContent: false, record: null, safeFeeling: "", safeNote: "", date };
      if (accessError) return blank;
      const prior = storedDraft(date, account);
      const context = active || prior;
      if (!context || context.owner !== account || context.date !== date) return { ...blank, error: "请返回日历，重新打开这一天的记录。" };
      if (state.rhythmDeleted && context.restartAfterDeletion !== true) return { ...blank, error: "原节律数据已经删除，请从日历重新开始记录。" };
      const saved = record(date), visible = state.rhythmDeleted ? null : saved;
      const safeFeeling = String(active ? state.rhythmFeeling || "" : prior.feeling || "");
      const safeNote = String(active ? state.rhythmNote || "" : prior.note || "");
      const conflict = changed(context, saved) || Boolean(prior && differentBase(prior, context));
      const hasContent = Boolean(safeFeeling || safeNote.trim());
      const validFeeling = safeFeeling === "" || feelings.includes(safeFeeling);
      const dirty = safeFeeling !== String(visible?.feeling || "") || safeNote.trim() !== String(visible?.note || "").trim();
      const error = conflict ? "这一天的记录已更新，未保存的草稿仍然保留。" : safeNote.length > 500 ? "补充感受最多 500 字，请删减后再保存。" : !validFeeling ? "请重新选择一个感受，或取消标签后只写文字。" : "";
      return { canEdit: true, canSave: !conflict && validFeeling && safeNote.length <= 500 && hasContent && dirty, canDelete: !conflict && Boolean(visible), dirty, conflict, error, hasContent, record: visible, safeFeeling, safeNote, date };
    }
    function markers(userRecords) {
      return [...new Set(userRecords.flatMap(value => Array.isArray(value.labels) ? value.labels : value.label ? [value.label] : []))];
    }
    function matches(value, saved, date, account) {
      const own = recordOwner(value);
      return value.category === "rhythm" && (!own || own === account) && (value.id === (saved?.id || `rhythm-${date}`) || value.occurredAt === date);
    }
    function cycleConfirmed() {
      const settings = state.rhythmSettings || {};
      let valid = false;
      try { valid = validDate(settings.startDate) && settings.startDate <= today(); } catch { /* No inferred cycle. */ }
      const length = Number(settings.cycleLength), duration = Number(settings.duration), confirmedAt = Date.parse(state.rhythmSettingsConfirmedAt || "");
      return valid && Number.isInteger(length) && length >= 20 && length <= 45 && Number.isInteger(duration) && duration >= 2 && duration <= 10
        && (state.rhythmSettingsSaved === true || Number.isFinite(confirmedAt) && confirmedAt <= Date.now());
    }
    function save() {
      const result = current();
      if (!result.ok) return result;
      const entry = result.entry;
      if (entry.feeling !== "" && !feelings.includes(entry.feeling)) return failure("请重新选择一个感受，或取消标签后只写文字。");
      if (!entry.feeling && !entry.note.trim()) return failure("选一个感受，或写下想记录的内容。");
      if (!inspect().dirty) {
        const nextDrafts = { ...drafts() }; delete nextDrafts[key(entry.owner, entry.date)];
        if (!writeChanges({ rhythmEntryDrafts: nextDrafts })) return failure("暂时无法结束编辑，原记录没有改变。请稍后重试。", "storage");
        active = null; issue = { error: "", code: "" };
        return { ok: true, error: "", unchanged: true };
      }
      // Retain the latest input in memory even when the durable commit fails.
      state.rhythmEntryDrafts = { ...drafts(), [key(entry.owner, entry.date)]: entry };
      const saved = record(entry.date), userRecords = Array.isArray(state.subjectiveRecords) ? state.subjectiveRecords : [];
      const restarting = state.rhythmDeleted === true;
      const foreign = value => Boolean(recordOwner(value) && recordOwner(value) !== entry.owner);
      // Legacy caches may retain tombstoned data. A restart must not unhide it;
      // keep ordinary user records and explicitly different-account data intact.
      const retained = userRecords.filter(value => (!restarting || value.category !== "rhythm" || foreign(value)) && !matches(value, saved, entry.date, entry.owner));
      let id = saved?.id || `rhythm-${entry.date}`;
      if (!saved && retained.some(value => value.id === id)) id = `${id}-${Date.now().toString(36)}`;
      const savedAt = new Date().toISOString(), note = entry.note.trim();
      const nextRecord = { id, date: entry.date, feeling: entry.feeling, note, source: "user-record", savedAt, ownerAccount: entry.owner };
      const nextUserRecords = [...retained, { id, label: entry.feeling || "感受记录", labels: entry.feeling ? [entry.feeling] : [], original: note, category: "rhythm", source: "user-record", occurredAt: entry.date, recordedAt: savedAt, ownerAccount: entry.owner }];
      const nextDrafts = restarting ? Object.fromEntries(Object.entries(drafts()).filter(([, value]) => foreign(value))) : { ...drafts() };
      delete nextDrafts[key(entry.owner, entry.date)];
      const nextRecords = restarting ? Object.fromEntries(Object.entries(records()).filter(([, value]) => foreign(value))) : { ...records() };
      const confirmed = !state.rhythmDeleted && cycleConfirmed();
      const mode = confirmed && state.rhythmMode === "cycle" ? "cycle" : "record-only";
      const changes = { rhythmRecords: { ...nextRecords, [entry.date]: nextRecord }, rhythmEntryDrafts: nextDrafts, subjectiveMarkers: markers(nextUserRecords), rhythmDeleted: false,
        rhythmMode: mode, rhythmStatus: !restarting && ["paused", "conflict", "insufficient"].includes(state.rhythmStatus) ? state.rhythmStatus : "ready", rhythmFeeling: entry.feeling, rhythmNote: note };
      if (state.rhythmDeleted) Object.assign(changes, { rhythmSettings: { startDate: "", cycleLength: "29", duration: "5" }, rhythmSettingsDraft: { startDate: "", cycleLength: "29", duration: "5" }, rhythmSettingsSaved: false, rhythmSettingsConfirmedAt: "" });
      if (!writeChanges(changes, nextUserRecords)) return failure("这次没能保存，你填写的内容还在。请重试，先不要关闭页面。", "storage");
      active = null;
      issue = { error: "", code: "" };
      return { ok: true, error: "" };
    }
    function remove(date) {
      const error = allowed(date);
      if (error) return failure(error, "unavailable");
      const saved = record(date), account = owner(), prior = storedDraft(date, account);
      if (!saved) return failure("这一天没有已保存的记录。");
      const base = active?.owner === account && active.date === date ? active : prior;
      if (base && changed(base, saved)) return failure("这一天的记录已更新，请查看最新记录后再确认删除。", "conflict");
      const nextRecords = { ...records() }, nextDrafts = { ...drafts() };
      delete nextRecords[date]; delete nextDrafts[key(account, date)];
      const nextUserRecords = (Array.isArray(state.subjectiveRecords) ? state.subjectiveRecords : []).filter(value => !matches(value, saved, date, account));
      const changes = { rhythmRecords: nextRecords, rhythmEntryDrafts: nextDrafts, subjectiveMarkers: markers(nextUserRecords) };
      if (state.selectedRhythmDate === date) Object.assign(changes, { rhythmFeeling: "", rhythmNote: "" });
      if (!writeChanges(changes, nextUserRecords)) return failure("暂时没能删除，原记录仍然保留。请稍后重试。", "storage");
      if (active?.owner === account && active.date === date) active = null;
      issue = { error: "", code: "" };
      return { ok: true, error: "" };
    }
    function discardDraft(date) {
      const error = allowed(date);
      if (error) return failure(error, "unavailable");
      const account = owner(), nextDrafts = { ...drafts() };
      delete nextDrafts[key(account, date)];
      if (!writeChanges({ rhythmEntryDrafts: nextDrafts })) return failure("暂时没能放弃这份修改，草稿仍然保留。请稍后重试。", "storage");
      active = null;
      return open(date);
    }
    return { open, capture, save, remove, discardDraft, inspect, lastIssue: () => ({ ...issue }) };
  };
})();
