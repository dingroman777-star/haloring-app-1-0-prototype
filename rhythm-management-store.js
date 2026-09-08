(function () {
  window.createHaloRhythmManagementStore = function ({ state, write, settingsStore, validDate, today, cycleStore }) {
    const object = value => value && typeof value === "object" && !Array.isArray(value);
    const owner = () => state.signedIn ? String(state.authPhone || state.authForm?.phone || "legacy-session") : "";
    const recordOwner = value => String(value?.ownerAccount || value?.accountRef || value?.owner || "");
    const foreign = value => Boolean(recordOwner(value) && recordOwner(value) !== owner());
    const entries = value => Object.entries(object(value) ? value : {});
    const userRecords = () => Array.isArray(state.subjectiveRecords) ? state.subjectiveRecords : [];
    const conversations = () => Array.isArray(state.conversations) ? state.conversations : [];
    const activeConversation = () => conversations().find(entry => entry?.id === state.activeConversationId);
    let confirmation = null, sequence = 0, message = "";
    function fail(error, code = "validation") { message = error; return { ok: false, error, code }; }
    function gate() {
      if (!owner()) return "请先登录，再管理节律记录。";
      if (state.current !== "RHY-05") return "请从节律记录管理页面继续操作。";
      if (state.accountDeletionStatus && state.accountDeletionStatus !== "ready") return "账号正在处理注销，暂时不能修改记录。";
      if (state.healthDeletionStatus && state.healthDeletionStatus !== "ready") return "健康数据正在处理删除，暂时不能修改记录。";
      return "";
    }
    function targets() {
      const records = entries(state.rhythmRecords).filter(([, value]) => !foreign(value));
      const drafts = entries(state.rhythmEntryDrafts).filter(([, value]) => !foreign(value));
      const subjective = userRecords().filter(value => value?.category === "rhythm" && !foreign(value));
      return { records, drafts, subjective };
    }
    function sourceIsOwn(source, container) { return source?.kind === "rhythm" && !foreign(source) && !foreign(container); }
    function validDay(date) {
      try { return typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) && validDate(date) && date <= today(); } catch { return false; }
    }
    function snapshot() {
      return JSON.stringify({ owner: owner(), ...targets(), cycle: cycleStore?.deleteSnapshot(), settings: state.rhythmSettings, settingsDraft: state.rhythmSettingsDraft,
        editor: state.rhythmSettingsEditor?.accounts?.[owner()] || null, activeOwner: state.rhythmSettingsEditor?.activeOwner || "",
        deleted: state.rhythmDeleted, status: state.rhythmStatus, mode: state.rhythmMode, saved: state.rhythmSettingsSaved,
        confirmedAt: state.rhythmSettingsConfirmedAt, notice: state.toggles?.rhythmNotice,
        source: sourceIsOwn(state.haloSource, activeConversation()) ? state.haloSource : null,
        sources: conversations().filter(entry => sourceIsOwn(entry?.source, entry)).map(entry => [entry.id, entry.source]) });
    }
    function inspect() {
      const error = gate();
      const blank = { canManage: false, canPause: false, canResume: false, canDelete: false, paused: false, mode: "record-only", status: "empty", deleted: false, confirmed: false, recordCount: 0, draftCount: 0, hasSettings: false, hasSettingsDraft: false, settingsDirty: false, conflict: false, error };
      if (error) return blank;
      const settings = settingsStore.inspect();
      if (!settings.canEdit) return { ...blank, error: settings.error || "请重新打开记录管理。" };
      const data = targets(), dates = new Set(), deleted = state.rhythmDeleted === true;
      if (!deleted) {
        for (const [date, record] of data.records) { const day = record?.date || date; if (validDay(day)) dates.add(day); }
        for (const record of data.subjective) if (validDay(record?.occurredAt)) dates.add(record.occurredAt);
      }
      const hasSettings = !deleted && Boolean(settings.confirmed || settings.currentValues?.startDate);
      const hasSettingsDraft = settings.dirty;
      const draftCount = data.drafts.filter(([, draft]) => (!deleted || draft?.restartAfterDeletion === true) && (String(draft?.feeling || "") || String(draft?.note || "").trim())).length + (hasSettingsDraft ? 1 : 0);
      const cycle = settings.confirmed && settings.currentMode === "cycle" && !state.rhythmDeleted;
      return { canManage: true, canPause: cycle && settings.currentStatus === "ready" && !settings.dirty && !settings.conflict,
        canResume: cycle && settings.paused && !settings.dirty && !settings.conflict,
        canDelete: (!deleted && data.records.length + data.subjective.length > 0) || draftCount > 0 || hasSettings || !!cycleStore?.hasStoredData(),
        paused: settings.paused, mode: settings.currentMode, status: settings.currentStatus, deleted, confirmed: settings.confirmed, recordCount: dates.size, draftCount, hasSettings, hasSettingsDraft,
        settingsDirty: settings.dirty, conflict: settings.conflict, periodCount: cycleStore?.events().length || 0, error: message || settings.error || "" };
    }
    function open() {
      confirmation = null;
      const error = gate();
      if (error) return fail(error, "unavailable");
      const result = settingsStore.open();
      message = result.error || "";
      return result;
    }
    function changeStatus(kind) {
      const view = inspect();
      if (!view.canManage) return fail(view.error, "unavailable");
      const result = kind === "pause" ? settingsStore.pause() : settingsStore.resume();
      if (!result.ok) return fail(result.error, result.code);
      message = ""; confirmation = null;
      return result;
    }
    function prepareDelete() {
      const view = inspect();
      if (!view.canManage) return fail(view.error, "unavailable");
      if (!view.canDelete) return fail("当前没有需要删除的节律记录或草稿。");
      const token = `${owner()}-${Date.now()}-${++sequence}`;
      confirmation = { token, owner: owner(), snapshot: snapshot() };
      return { ok: true, error: "", token, summary: { recordCount: view.recordCount, draftCount: view.draftCount, hasSettings: view.hasSettings, hasSettingsDraft: view.hasSettingsDraft, confirmed: view.confirmed } };
    }
    function removeAll(token) {
      const view = inspect();
      if (!view.canManage) return fail(view.error, "unavailable");
      if (!confirmation || token !== confirmation.token || confirmation.owner !== owner()) return fail("请重新查看删除范围，再确认删除。", "confirmation");
      if (confirmation.snapshot !== snapshot()) { confirmation = null; return fail("记录或设置刚刚发生变化，请重新核对删除范围。", "conflict"); }
      const data = targets(), retained = userRecords().filter(value => value?.category !== "rhythm" || foreign(value));
      const removedIds = new Set([...data.records.map(([, value]) => value?.id), ...data.subjective.map(value => value?.id)].filter(Boolean));
      const editorChanges = settingsStore.deletionChanges();
      const ownEditor = editorChanges.rhythmSettingsEditor?.accounts?.[owner()];
      if (ownEditor) { ownEditor.saved.values.notice = false; ownEditor.draft.values.notice = false; ownEditor.draft.base.values.notice = false; }
      const clearSource = sourceIsOwn(state.haloSource, activeConversation());
      if (ownEditor) { for (const values of [ownEditor.saved.values, ownEditor.draft.values, ownEditor.draft.base.values]) { values.prediction=false; values.periodNotice=false; } }
      const changes = { ...editorChanges, ...cycleStore?.deletionChanges(), rhythmDeleted: true, rhythmMode: "record-only", rhythmStatus: "empty",
        rhythmSettings: { startDate: "", cycleLength: "", duration: "", prediction:false, periodNotice:false }, rhythmSettingsDraft: { startDate: "", cycleLength: "", duration: "", prediction:false, periodNotice:false },
        rhythmSettingsSaved: false, rhythmSettingsConfirmedAt: "", rhythmFeeling: "", rhythmNote: "",
        rhythmRecords: Object.fromEntries(entries(state.rhythmRecords).filter(([, value]) => foreign(value))),
        rhythmEntryDrafts: Object.fromEntries(entries(state.rhythmEntryDrafts).filter(([, value]) => foreign(value))),
        subjectiveMarkers: [...new Set(retained.flatMap(value => Array.isArray(value?.labels) ? value.labels : value?.label ? [value.label] : []))],
        toggles: { ...state.toggles, rhythmNotice: false },
        conversations: conversations().map(entry => sourceIsOwn(entry?.source, entry) ? { ...entry, source: null, context: "none" } : entry) };
      if (clearSource) Object.assign(changes, { haloSource: null, haloContext: "none" });
      if (state.recordEditDraft?.id && removedIds.has(state.recordEditDraft.id) && !retained.some(value => value?.id === state.recordEditDraft.id)) Object.assign(changes, { recordEditDraft: null, recordEditorMode: "new" });
      // No mutation precedes the transactional writer. Chat message bodies,
      // ordinary notes, explicit foreign data, hardware and membership stay intact.
      try {
        if (write(changes, retained) !== true) return fail("暂时没能删除，原记录和草稿都还在。你可以重试。", "storage");
        Object.assign(state, changes); state.subjectiveRecords = retained;
      } catch { return fail("暂时没能删除，原记录和草稿都还在。你可以重试。", "storage"); }
      confirmation = null; message = "";
      return { ok: true, error: "" };
    }
    return { open, inspect, pause: () => changeStatus("pause"), resume: () => changeStatus("resume"), prepareDelete, removeAll, cancelDelete: () => { confirmation = null; } };
  };
})();
