/* Local prototype persistence for Today/Rhythm. Never use a login attempt or
 * agreement timestamp as an account ID. Server authorization/transactions are
 * still required in the production application. */
(() => {
  const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const fields = () => ({
    recordDraft: { labels: [], note: '' }, recordEditDraft: null, recordEditorMode: 'new', recordEntryContext: null,
    activityRecordDraft: { id: '', feeling: '', note: '' },
    rhythmRecords: {}, rhythmEntryDrafts: {}, rhythmHomeView: null, selectedRhythmDate: '', rhythmMonth: '', rhythmFeeling: '', rhythmNote: '',
    rhythmMode: 'record-only', rhythmStatus: 'empty', rhythmDeleted: false,
    rhythmSettings: {}, rhythmSettingsDraft: {}, rhythmSettingsSaved: false, rhythmSettingsConfirmedAt: '',
    rhythmSettingsEditor: null, rhythmCycleData: null, rhythmSetupReturn: ''
  });
  const protectedKeys = [...Object.keys(fields()), 'todayRhythmScope', 'healthReports', 'shareEditors'];
  const phone = source => String(source.authPhone || (source.signedIn ? source.authForm?.phone : '') || '');
  const accountKey = (account, registration = '') => registration ? `${account}|${registration}` : account || 'legacy-session';
  const ownerKey = state => state.todayRhythmScope?.activeKey || accountKey(phone(state), state.memberCreatedAt || '');
  const capture = state => Object.fromEntries(Object.entries(fields()).map(([key, fallback]) => [key, clone(state[key] ?? fallback)]));

  window.createHaloTodayRhythmStorage = function ({ state, progressKey, recordsKey }) {
    let ready = false, baseline = {}, recordBase = [], issue = '', switching = false;
    const read = (key, fallback) => { const value = JSON.parse(localStorage.getItem(key) || 'null'); return value ?? fallback; };
    const session = value => [value.signedIn === true, value.authVerified === true, phone(value), value.authForm?.login?.id || value.agreementAcceptance?.acceptedAt || ''].join('|');
    const draftKey = () => `haloTodayRhythmDraft:${ownerKey(state)}`;
    function cacheDrafts() {
      if (!ready || !state.signedIn || !state.authVerified) return;
      try { sessionStorage.setItem(draftKey(), JSON.stringify({ scope: ownerKey(state), recordDraft: state.recordDraft, recordEditDraft: state.recordEditDraft, recordEditorMode: state.recordEditorMode, recordEntryContext: state.recordEntryContext })); } catch { /* Durable shared draft writes still report their own failure. */ }
    }
    function restoreDrafts() {
      try {
        const cached = JSON.parse(sessionStorage.getItem(draftKey()) || 'null');
        if (cached?.scope === ownerKey(state)) for (const key of ['recordDraft', 'recordEditDraft', 'recordEditorMode', 'recordEntryContext']) if (cached[key] !== undefined) state[key] = clone(cached[key]);
      } catch { /* A damaged tab draft is not adopted. */ }
    }
    function own(record) {
      if (!state.signedIn || !state.authVerified || !object(record) || typeof record.id !== 'string' || typeof record.label !== 'string') return false;
      const currentAccount = phone(state) || 'legacy-session';
      if (state.todayRhythmScope?.activeAccount !== currentAccount) return false;
      if (record.recordScope) return record.recordScope === ownerKey(state);
      const account = String(record.ownerAccount || record.accountRef || '');
      // Untagged records remain in storage, but cannot be claimed by a later login.
      return !!account && account === currentAccount && !state.todayRhythmScope?.registrations?.[account];
    }
    function visible(records) { return (Array.isArray(records) ? records : []).filter(own); }
    function refreshRecords() {
      const records = read(recordsKey, []);
      if (!Array.isArray(records)) throw new Error('记录存储暂时无法读取，请刷新后重试。');
      state.subjectiveRecords = clone(visible(records));
      state.subjectiveMarkers = [...new Set(state.subjectiveRecords.flatMap(value => value.labels || [value.label]))];
      recordBase = clone(state.subjectiveRecords);
    }
    function migrateReports(oldSession, key, account) {
      for (const field of ['healthReports', 'shareEditors']) {
        const accounts = state[field]?.accounts;
        if (!object(accounts) || !oldSession || oldSession === key || accounts[key] || !accounts[oldSession]) continue;
        const entry = accounts[oldSession];
        if (entry.ownerAccount && entry.ownerAccount !== account) continue;
        // Only the currently verified legacy session establishes this association.
        accounts[key] = { ...clone(entry), ownerAccount: account, recordScope: key };
        delete accounts[oldSession];
      }
    }
    function initialize() {
      const account = phone(state) || (state.signedIn ? 'legacy-session' : ''), registered = String(state.memberCreatedAt || '');
      let root = state.todayRhythmScope;
      if (!object(root) || root.version !== 1) {
        root = { version: 1, activeKey: accountKey(account, registered), activeAccount: account, memberCreatedAtSnapshot: registered, registrations: { [account]: registered }, accounts: {}, quarantine: {} };
        // Split explicit legacy record owners before any new login can reuse a date.
        const ownRecords = {};
        for (const [date, record] of Object.entries(state.rhythmRecords || {})) {
          const savedOwner = String(record?.ownerAccount || record?.accountRef || '');
          if (savedOwner && savedOwner === account) ownRecords[date] = clone(record);
          else if (savedOwner) {
            const key = accountKey(savedOwner);
            root.accounts[key] ||= fields(); root.accounts[key].rhythmRecords[date] = clone(record);
          } else root.quarantine[date] = clone(record);
        }
        state.rhythmRecords = ownRecords;
        for (const key of ['recordDraft', 'recordEditDraft', 'activityRecordDraft']) {
          const draft = state[key];
          if (draft && (draft.note || draft.id || draft.labels?.length) && draft.ownerAccount !== account && draft.recordScope !== root.activeKey) {
            root.quarantine[key] = clone(draft); state[key] = clone(fields()[key]);
          }
        }
        if (!state.recordEditDraft) state.recordEditorMode = 'new';
        // Preserve explicitly owned drafts/cycle books from legacy multi-account data.
        for (const [id, draft] of Object.entries(state.rhythmEntryDrafts || {})) {
          const savedOwner = String(draft?.owner || '');
          if (savedOwner && savedOwner !== account) { root.accounts[accountKey(savedOwner)] ||= fields(); root.accounts[accountKey(savedOwner)].rhythmEntryDrafts[id] = clone(draft); }
        }
        for (const savedOwner of new Set([...Object.keys(state.rhythmCycleData?.accounts || {}), ...Object.keys(state.rhythmSettingsEditor?.accounts || {})])) {
          if (savedOwner === account) continue;
          const bucket = root.accounts[accountKey(savedOwner)] ||= fields();
          if (state.rhythmCycleData?.accounts?.[savedOwner]) bucket.rhythmCycleData = { version: 1, accounts: { [savedOwner]: clone(state.rhythmCycleData.accounts[savedOwner]) } };
          const entry = state.rhythmSettingsEditor?.accounts?.[savedOwner];
          if (entry?.saved?.values) {
            const saved = entry.saved, values = saved.values;
            bucket.rhythmSettingsEditor = { version: 1, activeOwner: savedOwner, accounts: { [savedOwner]: clone(entry) } };
            Object.assign(bucket, { rhythmSettings: clone(values), rhythmSettingsDraft: clone(entry.draft?.values || values), rhythmMode: values.mode, rhythmStatus: saved.status, rhythmDeleted: saved.deleted, rhythmSettingsSaved: saved.confirmed, rhythmSettingsConfirmedAt: saved.confirmedAt });
          }
        }
        state.todayRhythmScope = root;
        if (state.signedIn && state.authVerified) migrateReports(state.agreementAcceptance?.acceptedAt || state.authForm?.login?.id || 'legacy-session', root.activeKey, account);
      } else if (root.activeAccount !== account && state.signedIn) {
        root.accounts ||= {}; root.registrations ||= {};
        root.accounts[root.activeKey] = capture(state);
        const key = accountKey(account, root.registrations[account] || '');
        Object.assign(state, clone(root.accounts[key] || fields())); delete root.accounts[key];
        root.activeKey = key; root.activeAccount = account; root.memberCreatedAtSnapshot = registered;
      } else if (root.activeAccount === account && state.signedIn && registered && root.memberCreatedAtSnapshot !== registered) {
        // Explicit new registration is not a resume of the old account generation.
        root.accounts[root.activeKey] = capture(state);
        root.registrations[account] = registered; root.activeKey = accountKey(account, registered); root.memberCreatedAtSnapshot = registered;
        Object.assign(state, fields());
      }
      root.registrations ||= {}; root.accounts ||= {};
      ready = true;
      baseline = clone(read(progressKey, {}));
      refreshRecords();
      if (state.signedIn && state.authVerified) restoreDrafts();
    }
    function select(account, registration = '') {
      if (!ready) return;
      const root = clone(state.todayRhythmScope), key = accountKey(account, Object.prototype.hasOwnProperty.call(root.registrations, account) ? root.registrations[account] : registration);
      if (root.activeKey !== key) {
        root.accounts[root.activeKey] = capture(state);
        Object.assign(state, clone(root.accounts[key] || fields()));
        delete root.accounts[key];
      }
      root.registrations[account] = Object.prototype.hasOwnProperty.call(root.registrations, account) ? root.registrations[account] : registration;
      root.activeKey = key; root.activeAccount = account; root.memberCreatedAtSnapshot = String(state.memberCreatedAt || '');
      state.todayRhythmScope = root;
      restoreDrafts();
      switching = true;
    }
    function merge(base, desired, latest, path) {
      if (equal(desired, base)) return clone(latest);
      if (equal(latest, base) || equal(latest, desired)) return clone(desired);
      if (object(base) && object(desired) && object(latest)) {
        const result = {};
        for (const key of new Set([...Object.keys(base), ...Object.keys(desired), ...Object.keys(latest)])) {
          const value = merge(base[key], desired[key], latest[key], `${path}.${key}`);
          if (value !== undefined) result[key] = value;
        }
        return result;
      }
      throw new Error('这份内容已在其他页面更新，尚未保存的修改仍在。请返回查看最新记录后再修改。');
    }
    function prepare(snapshot) {
      if (!ready) return snapshot;
      cacheDrafts();
      const latest = read(progressKey, {});
      if (!switching && session(latest) !== session(baseline)) throw new Error('登录状态已在其他页面变化，请重新登录后继续。');
      const result = { ...latest, ...snapshot };
      for (const key of protectedKeys) {
        result[key] = switching ? clone(snapshot[key]) : merge(baseline[key], snapshot[key], latest[key], key);
      }
      return result;
    }
    function accept(snapshot) {
      if (!ready) return;
      for (const key of protectedKeys) if (snapshot[key] !== undefined) state[key] = clone(snapshot[key]);
      baseline = clone(snapshot); switching = false; issue = '';
    }
    function mergeRecords(records, expectedRecord) {
      if (!state.signedIn || !state.authVerified) throw new Error('请先登录，再保存记录。');
      if (session(read(progressKey, {})) !== session(baseline)) throw new Error('登录状态已在其他页面变化，请重新登录后继续。');
      const all = read(recordsKey, []);
      if (!Array.isArray(all)) throw new Error('记录存储暂时无法读取，请稍后重试。');
      const current = visible(all), desired = records.map(value => {
        if (value.recordScope && value.recordScope !== ownerKey(state) || value.ownerAccount && value.ownerAccount !== (phone(state) || 'legacy-session')) throw new Error('不能修改其他账号的记录。');
        return { ...value, ownerAccount: phone(state) || 'legacy-session', recordScope: ownerKey(state) };
      });
      const byId = list => Object.fromEntries(list.map(value => [value.id, value]));
      const normalize = list => list.map(value => ({ ...value, ownerAccount: phone(state) || 'legacy-session', recordScope: ownerKey(state) }));
      const baseRecords = byId(normalize(recordBase));
      if (expectedRecord?.id) baseRecords[expectedRecord.id] = normalize([expectedRecord])[0];
      const merged = Object.values(merge(baseRecords, byId(desired), byId(normalize(current)), 'records'));
      return { all: [...all.filter(value => !own(value)), ...merged], active: merged };
    }
    function acceptRecords(active) { state.subjectiveRecords = clone(active); recordBase = clone(active); state.subjectiveMarkers = [...new Set(active.flatMap(value => value.labels || [value.label]))]; }
    function resolveEdit() {
      const latest = read(progressKey, {});
      if (session(latest) !== session(baseline)) throw new Error('请重新登录后继续。');
      baseline.recordEditDraft = clone(latest.recordEditDraft);
      refreshRecords();
    }
    function accessError() {
      if (!ready) return '';
      try { return session(read(progressKey, {})) !== session(baseline) ? '登录状态已在其他页面变化，请重新登录后继续。' : ''; }
      catch { return '暂时无法读取本机记录，请稍后重试。'; }
    }
    return { initialize, select, prepare, accept, mergeRecords, acceptRecords, refreshRecords, resolveEdit, own, accessError,
      fail: error => { issue = error?.message || '暂时没有保存成功，请稍后重试。'; }, error: () => issue,
      cancelSwitch: () => { switching = false; }, ready: () => ready };
  };
  window.HaloTodayRhythm = { ownerKey };
})();
