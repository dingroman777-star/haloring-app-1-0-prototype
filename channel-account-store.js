/* Local channel account partitions. Production authorization belongs on the server.
 * Commercial aliases are compatibility views, never the authority for channel records. */
(() => {
  const KEY = "haloChannelAccountsV1", LEGACY = "haloV5CommercialProgress";
  const clone = value => value === undefined ? undefined : structuredClone(value);
  const equal = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  const object = value => value && typeof value === "object" && !Array.isArray(value);
  const channelField = key => /^(channel|identity|application|assessment|training|withdrawal)/.test(key) || ["activationRequest", "activationReady", "completedCourses", "selectedCourseId", "selectedEarningId", "selectedPolicyId", "policiesRead", "policyRead", "uploadSelected", "resumeAfterDevice"].includes(key);
  function appSession() {
    const app = JSON.parse(localStorage.getItem("haloV5AppProgress") || "{}");
    return { signedIn: app.signedIn === true, accountRef: app.authPhone || "", key: app.authForm?.login?.id || app.agreementAcceptance?.acceptedAt || (app.signedIn ? "legacy-session" : "") };
  }
  function stableScope(value, owner) {
    if (typeof value !== "string") return value;
    try { const parts = JSON.parse(value); if (Array.isArray(parts) && parts.length === 6 && parts[0] === owner && parts[5] === "agreement-demo-v1") { parts[1] = "account"; return JSON.stringify(parts); } } catch { /* not an activation scope */ }
    return value;
  }
  function migrateScopes(value, owner) {
    if (Array.isArray(value)) return value.map(item => migrateScopes(item, owner));
    if (!object(value)) return value;
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, key === "scope" ? stableScope(item, owner) : migrateScopes(item, owner)]));
  }
  window.HALO_CHANNEL_STORE = {
    key: KEY, isField: channelField,
    create(state, defaults) {
      let session = appSession(), owner = "", baseline = {}, initialized = false, unreadable = false;
      const project = source => Object.fromEntries(Object.entries(source || {}).filter(([key]) => channelField(key)).map(([key, value]) => [key, clone(value)]));
      const empty = account => ({ ...project(defaults), channelAvailableCents: 0, channelOwnerAccount: account, channelActivation: null, channelWithdrawal: null, channelPromotion: null, channelContentSelection: null, channelContentReads: [], applicationFlow: { consentKey: "", savedAt: "", request: null }, applicationSupplement: null, applicationReviewQuery: null, trainingApplicationId: "", trainingVisit: null, channelHistorySelection: null });
      function root() {
        const saved = JSON.parse(localStorage.getItem(KEY) || "null");
        if (saved !== null) {
          if (!object(saved) || saved.version !== 1 || !object(saved.accounts)) throw new Error("Channel storage unavailable");
          return saved;
        }
        const legacy = JSON.parse(localStorage.getItem(LEGACY) || "{}");
        if (!object(legacy)) throw new Error("Legacy channel storage unavailable");
        const data = project(legacy), proofs = [data.channelOwnerAccount, data.applicationSnapshot?.ownerAccount, data.identityVerification?.ownerAccount, ...(data.applicationHistory || []).map(row => row?.ownerAccount)].filter(value => typeof value === "string" && value);
        try { const parts = JSON.parse(data.channelActivation?.scope || "null"); if (Array.isArray(parts) && parts.length === 6 && typeof parts[0] === "string" && parts[0]) proofs.push(parts[0]); } catch { /* legacy record has no verified owner */ }
        const known = proofs.length > 0 && proofs.every(value => value === proofs[0]) ? proofs[0] : "";
        const result = { version: 1, accounts: {}, legacyQuarantine: null };
        if (known) {
          const migrated = migrateScopes(data, known);
          if (migrated.applicationSnapshot) migrated.applicationSnapshot.ownerAccount = known;
          if (migrated.identityVerification) migrated.identityVerification.ownerAccount = known;
          migrated.applicationHistory = (migrated.applicationHistory || []).map(row => ({ ...row, ownerAccount: known }));
          // Old quotes include the former revision/session. Requote without changing funds.
          if (migrated.channelWithdrawal && !migrated.channelWithdrawal.resultId) migrated.channelWithdrawal.quote = null;
          result.accounts[known] = { revision: 0, data: { ...empty(known), ...migrated, channelOwnerAccount: known } };
        } else if (data.applicationSnapshot || data.identityVerification || data.applicationHistory?.length) result.legacyQuarantine = data;
        localStorage.setItem(KEY, JSON.stringify(result));
        return result;
      }
      function read() {
        const saved = root(), account = session.signedIn ? String(session.accountRef || "") : "";
        const bucket = saved.accounts[account];
        if (bucket && (!object(bucket.data) || bucket.data.channelOwnerAccount !== account)) throw new Error("Channel owner mismatch");
        if (bucket && [bucket.data.applicationSnapshot, bucket.data.identityVerification, ...(bucket.data.applicationHistory || [])].some(record => record && record.ownerAccount !== account)) throw new Error("Channel record owner mismatch");
        const data = { ...empty(account), ...(account && bucket ? clone(bucket.data) : {}) };
        const commercial = JSON.parse(localStorage.getItem(LEGACY) || "{}");
        return { ...Object.fromEntries(Object.entries(commercial).filter(([key]) => !channelField(key))), ...data };
      }
      function select(ctx) {
        session = typeof ctx?.applicationContext === "function" ? ctx.applicationContext() : appSession();
        const next = session.signedIn ? String(session.accountRef || "") : "";
        if (initialized && next === owner && !unreadable) return false;
        owner = next; initialized = true; baseline = {};
        return sync();
      }
      function sync() {
        let data;
        try { data = project(read()); unreadable = false; } catch { data = empty(owner); unreadable = true; }
        if (equal(data, baseline) && !unreadable) return false;
        const changed = !equal(project(state), data);
        for (const key of Object.keys(state).filter(channelField)) delete state[key];
        Object.assign(state, clone(data)); baseline = clone(data);
        return changed;
      }
      function commit(next = state) {
        if (!owner || !session.signedIn || unreadable) throw new Error("Channel session unavailable");
        const current = appSession();
        if (!current.signedIn || current.accountRef !== owner || current.key !== session.key) throw new Error("Channel login changed");
        const saved = root(), currentData = { ...empty(owner), ...clone(saved.accounts[owner]?.data || {}) }, proposed = project(next), patch = {};
        for (const key of new Set([...Object.keys(baseline), ...Object.keys(proposed)])) {
          if (equal(proposed[key], baseline[key])) continue;
          if (!equal(currentData[key], baseline[key]) && !equal(currentData[key], proposed[key])) throw new Error("Channel record changed");
          patch[key] = clone(proposed[key]);
        }
        const merged = { ...currentData, ...patch, channelOwnerAccount: owner };
        if (merged.applicationSnapshot && merged.applicationSnapshot.ownerAccount !== owner) throw new Error("Application owner mismatch");
        if (merged.identityVerification && merged.identityVerification.ownerAccount !== owner) throw new Error("Identity owner mismatch");
        const draft = merged.identityDraft;
        if (draft && !(draft.name === "演示用户" && draft.idNumber === "000000200001010000")) merged.identityDraft = { name: "", idNumber: "" };
        if (!equal(currentData, merged) || !localStorage.getItem(KEY)) {
          saved.accounts[owner] = { revision: (saved.accounts[owner]?.revision || 0) + 1, data: merged };
          localStorage.setItem(KEY, JSON.stringify(saved));
        }
        baseline = clone(merged);
        // Volatile non-demo identity input remains only in the current form.
        const volatileDraft = state.identityDraft;
        Object.assign(state, clone(merged));
        if (volatileDraft && (volatileDraft.name !== "演示用户" || volatileDraft.idNumber !== "000000200001010000")) state.identityDraft = volatileDraft;
        return read();
      }
      const historyFields = target => target === "CHN-07" && history.state?.id === "CHN-07" && history.state.channelHistoryOwner === owner ? { channelHistoricalId: history.state.channelHistoricalId, channelHistoryOwner: owner } : {};
      const api = { select, sync, read, commit, historyFields, dirty: () => !equal(project(state), baseline), owner: () => owner, unavailable: () => unreadable };
      // One-time durable preservation prevents pre-upgrade tabs from replacing the
      // legacy source before the first explicit action in the new account store.
      try { if (!localStorage.getItem(KEY)) localStorage.setItem(KEY, JSON.stringify(root())); } catch { unreadable = true; }
      select();
      return api;
    }
  };
})();
