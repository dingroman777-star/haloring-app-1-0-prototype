/* Local account/registration partitions for personal data and Night.
 * Active aliases have no duplicate bucket. Unknown legacy data is retained,
 * never assigned by a login attempt. Production still needs server ownership. */
(() => {
  const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const account = state => String(state.authPhone || '');
  const keyFor = (owner, registration = '') => registration ? `${owner}|${registration}` : owner;
  const today = () => new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10);
  const scope = state => state.todayRhythmScope?.activeAccount === account(state)
    ? state.todayRhythmScope.activeKey : keyFor(account(state), state.memberCreatedAt || '');
  const defaults = () => ({
    profile: { nickname: 'Halo 用户', birthday: '', height: '', weight: '' }, profileSaved: false,
    profileEditor: { draft: null, base: null, touched: {}, savedAt: '' },
    basicProfile: { status: 'not-started', draft: null, touched: {} },
    playing: false, nightChoice: 'scan', publicNightChoice: '', nightPlan: null,
    nightRecommendationGoal: 'relax', nightContentDetail: null, nightSession: null,
    nightHistory: [], selectedNightSessionId: '', nightReviewDrafts: {}, nightReviewEntry: null,
    nightReview: { execution: '', helpfulness: '', factors: [], saved: false, counted: false, observationCount: 0 },
    wakeSettings: { snoozeMinutes: 5, time: '07:20', window: '30', sound: '晨雾', enabled: true },
    wakeDraft: null, alarmSound: '晨雾', previewSound: '', wakeSoundSelection: null,
    wakeSaved: false, wakeSnooze: null, wakeAlarmReceipt: null, snoozeUntil: '',
    sleepGoal: { duration: '8', workdayBedtime: '23:15', workdayWake: '07:15', restBedtime: '23:45', restWake: '08:00' },
    dataLifecycle: 'none', bodyWeather: 'slow', healthDemoRecordDate: today(), healthSelectedDate: today(),
    dataPrivacy: null
  });
  const toggleDefaults = { wake: true, sleepFade: true, nightTail: false, birthdayBenefit: false };
  const fields = Object.keys(defaults());
  const protectedKeys = [...fields, 'personalAccountScope'];
  const session = state => [state.signedIn === true, state.authVerified === true, account(state),
    state.authForm?.login?.id || state.agreementAcceptance?.acceptedAt || '', state.memberCreatedAt || '', state.todayRhythmScope?.activeKey || ''].join('|');
  const capture = state => ({ ...Object.fromEntries(fields.map(key => [key, clone(state[key] ?? defaults()[key])])),
    accountToggles: Object.fromEntries(Object.keys(toggleDefaults).map(key => [key, state.toggles?.[key] ?? toggleDefaults[key]])) });
  function restore(state, value, owner, activeKey) {
    const { accountToggles, ...saved } = clone(value || {});
    Object.assign(state, defaults(), saved);
    state.toggles = { ...state.toggles, ...toggleDefaults, ...accountToggles };
    state.profile = { ...defaults().profile, ...state.profile, ownerAccount: owner, recordScope: activeKey };
    state.basicProfile = { ...defaults().basicProfile, ...state.basicProfile, accountRef: owner, recordScope: activeKey };
    state.wakeDraft ||= clone(state.wakeSettings);
    const privacy = state.dataPrivacy?.accounts?.[owner];
    state.dataPrivacy = { version: 1, ownerAccount: owner, accounts: owner ? { [owner]: privacy || { draft: [], request: null, legacyNotice: false } } : {} };
  }
  function ownsNight(state, record) {
    if (!state.signedIn || !state.authVerified || !record || !account(state)) return false;
    if (record.ownerAccount !== account(state)) return false;
    return record.recordScope ? record.recordScope === scope(state)
      : (record.memberRegistrationId || '') === (state.todayRhythmScope?.registrations?.[account(state)] || '');
  }
  window.createHaloPersonalScope = function ({ state, progressKey }) {
    let ready = false, baseline = {}, switching = false;
    const read = () => { const value = JSON.parse(localStorage.getItem(progressKey) || '{}'); if (!object(value)) throw new Error('本机记录暂时无法读取，请重试。'); return value; };
    function initialize() {
      const owner = account(state), activeKey = scope(state), legacy = capture(state);
      let root = state.personalAccountScope;
      if (!object(root) || root.version !== 1 || !object(root.accounts)) {
        // A stored verified session or explicit profile/privacy owner can identify
        // the old alias snapshot; an editable authForm phone never can.
        const legacyOwner = String(state.profile?.ownerAccount || state.basicProfile?.accountRef || state.dataPrivacy?.ownerAccount || (state.signedIn && state.authVerified ? owner : '') || '');
        const registrations = state.todayRhythmScope?.registrations || {};
        const legacyKey = state.profile?.recordScope || state.basicProfile?.recordScope || keyFor(legacyOwner, registrations[legacyOwner] || '');
        root = { version: 1, activeOwner: owner, activeKey, accounts: {}, quarantine: {}, legacyHealthOwner: legacyOwner };
        const bucket = key => root.accounts[key] || (root.accounts[key] = defaults());
        if (legacyOwner) root.accounts[legacyKey] = { ...legacy, nightHistory: [], nightSession: null, nightReviewDrafts: {}, selectedNightSessionId: '', nightReviewEntry: null };
        else root.quarantine.aliases = legacy;
        for (const record of legacy.nightHistory || []) {
          const savedOwner = String(record?.ownerAccount || record?.accountRef || '');
          if (!savedOwner) { (root.quarantine.nightHistory ||= []).push(clone(record)); continue; }
          const key = record.recordScope || keyFor(savedOwner, Object.prototype.hasOwnProperty.call(record, 'memberRegistrationId') ? record.memberRegistrationId : registrations[savedOwner] || '');
          bucket(key).nightHistory.push({ ...clone(record), ownerAccount: savedOwner, recordScope: key });
          if (legacy.nightReviewDrafts?.[record.id]) bucket(key).nightReviewDrafts[record.id] = clone(legacy.nightReviewDrafts[record.id]);
          if (record.id === legacy.selectedNightSessionId) { bucket(key).selectedNightSessionId = record.id; bucket(key).nightReviewEntry = clone(legacy.nightReviewEntry); }
        }
        for (const [id, draft] of Object.entries(legacy.nightReviewDrafts || {})) {
          if (!(legacy.nightHistory || []).some(record => record.id === id && (record.ownerAccount || record.accountRef))) (root.quarantine.nightReviewDrafts ||= {})[id] = clone(draft);
        }
        if (legacy.nightSession) {
          const record = legacy.nightSession, savedOwner = String(record.ownerAccount || record.accountRef || '');
          if (savedOwner) { const key = record.recordScope || keyFor(savedOwner, Object.prototype.hasOwnProperty.call(record, 'memberRegistrationId') ? record.memberRegistrationId : registrations[savedOwner] || ''); bucket(key).nightSession = { ...clone(record), ownerAccount: savedOwner, recordScope: key }; }
          else root.quarantine.nightSession = clone(record);
        }
        for (const [savedOwner, profile] of Object.entries(legacy.dataPrivacy?.accounts || {})) {
          const key = keyFor(savedOwner, registrations[savedOwner] || '');
          bucket(key).dataPrivacy = { version: 1, ownerAccount: savedOwner, accounts: { [savedOwner]: clone(profile) } };
        }
        state.personalAccountScope = root;
        restore(state, root.accounts[activeKey], owner, activeKey);
        delete root.accounts[activeKey];
      } else if (root.activeKey !== activeKey || root.activeOwner !== owner) {
        root.accounts[root.activeKey] = capture(state);
        restore(state, root.accounts[activeKey], owner, activeKey);
        delete root.accounts[activeKey]; root.activeKey = activeKey; root.activeOwner = owner;
      } else {
        // Never reload an active duplicate: it could resurrect a deleted record.
        delete root.accounts[activeKey];
        restore(state, legacy, owner, activeKey);
      }
      baseline = clone(read()); ready = true;
    }
    function select(owner, activeKey) {
      if (!ready) return;
      const root = clone(state.personalAccountScope);
      if (root.activeKey !== activeKey) {
        root.accounts[root.activeKey] = capture(state);
        restore(state, root.accounts[activeKey], owner, activeKey);
        delete root.accounts[activeKey];
      }
      root.activeOwner = owner; root.activeKey = activeKey;
      state.personalAccountScope = root; switching = true;
    }
    function merge(base, desired, latest, path) {
      if (equal(desired, base)) return clone(latest);
      if (equal(latest, base) || equal(latest, desired)) return clone(desired);
      if (path === 'nightHistory' && [base, desired, latest].every(Array.isArray)) {
        const keyed = rows => Object.fromEntries(rows.map(row => [row.id, row]));
        return Object.values(merge(keyed(base), keyed(desired), keyed(latest), 'nightRecords'));
      }
      if (object(base) && object(desired) && object(latest)) {
        const result = {};
        for (const key of new Set([...Object.keys(base), ...Object.keys(desired), ...Object.keys(latest)])) {
          const value = merge(base[key], desired[key], latest[key], `${path}.${key}`);
          if (value !== undefined) result[key] = value;
        }
        return result;
      }
      throw new Error('资料或夜间记录已在其他页面更新。本次输入仍保留，请重新打开并核对最新记录。');
    }
    function prepare(snapshot) {
      if (!ready) return snapshot;
      const latest = read();
      if (!switching && session(latest) !== session(baseline)) throw new Error('登录账号或注册状态已在其他页面变化，请重新打开页面后继续。');
      const result = { ...snapshot };
      for (const key of protectedKeys) result[key] = switching ? clone(snapshot[key]) : merge(baseline[key], snapshot[key], latest[key], key);
      result.toggles = { ...snapshot.toggles };
      for (const key of Object.keys(toggleDefaults)) result.toggles[key] = switching ? snapshot.toggles[key] : merge(baseline.toggles?.[key], snapshot.toggles?.[key], latest.toggles?.[key], `toggles.${key}`);
      return result;
    }
    function accept(snapshot) {
      if (!ready) return;
      for (const key of protectedKeys) if (snapshot[key] !== undefined) state[key] = clone(snapshot[key]);
      for (const key of Object.keys(toggleDefaults)) if (snapshot.toggles?.[key] !== undefined) state.toggles[key] = snapshot.toggles[key];
      baseline = clone(snapshot); switching = false;
    }
    function accessError() {
      if (!ready) return '';
      try { return session(read()) === session(baseline) ? '' : '登录账号或注册状态已在其他页面变化，请重新打开页面后继续。'; }
      catch { return '本机记录暂时无法读取，请重试。'; }
    }
    return { initialize, select, prepare, accept, accessError, cancelSwitch: () => { switching = false; } };
  };
  window.HaloPersonalScope = { ownsNight, scope, bodyOwner: state => {
    const owner = account(state), id = state.pairedDevice?.id;
    return state.deviceBindings?.[id]?.accountRef === owner ? owner : state.personalAccountScope?.legacyHealthOwner || '';
  } };
})();
