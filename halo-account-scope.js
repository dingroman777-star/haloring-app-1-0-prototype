/* Local prototype account partitions. Active aliases remain compatible with page controllers.
 * Inactive accounts are archived only at a verified account switch, never reloaded over live edits.
 * This is not a substitute for server-side authorization in the production App. */
(() => {
  const clone = value => JSON.parse(JSON.stringify(value));
  const defaults = () => ({
    conversations: [], haloMemories: [], haloMemoryDrafts: {}, chat: [],
    activeConversationId: '', conversationStatus: 'new', conversationQuery: '',
    haloDraft: '', haloSource: null, haloContext: 'none', haloFeeling: '', haloFeelingNote: '',
    haloPreferences: { tone: 'direct', length: 'short' }, haloQuota: { day: '', used: 0 },
    haloSettingsView: null, haloPrivacyView: null, haloMemoryCleared: false,
    haloDataDeletionStatus: 'none', memoryProposalConfirmed: false,
    aiCorrection: { status: 'none', reason: '', reasonLabel: '', note: '', memoryReview: false, savedAt: '' },
    aiCorrectionDraft: null, aiCorrectionHistory: []
  });
  const toggleDefaults = { memory: true, haloBody: true, inspiration: true };
  function capture(state) {
    const value = defaults();
    for (const key of Object.keys(value)) if (state[key] !== undefined) value[key] = clone(state[key]);
    value.accountToggles = Object.fromEntries(Object.keys(toggleDefaults).map(key => [key, state.toggles?.[key] ?? toggleDefaults[key]]));
    return value;
  }
  function restore(state, value) {
    const { accountToggles, ...fields } = value || {};
    Object.assign(state, defaults(), clone(fields));
    state.toggles = { ...state.toggles, ...toggleDefaults, ...accountToggles };
  }
  function select(state, target) {
    target = String(target || '');
    let root = state.haloAccountScope;
    if (!root || root.version !== 1 || !root.accounts) {
      const legacyOwner = String(state.dataPrivacy?.ownerAccount || state.authPhone || '');
      root = { version: 1, activeOwner: legacyOwner, accounts: {} };
      const legacy = capture(state);
      const bucket = owner => root.accounts[owner] || (root.accounts[owner] = defaults());
      // Unknown ownership is retained in a quarantine bucket, never assigned to a new login.
      const ownerKey = legacyOwner || '__unassigned__';
      root.accounts[ownerKey] = legacy;
      for (const field of ['conversations', 'haloMemories', 'aiCorrectionHistory']) {
        root.accounts[ownerKey][field] = [];
        for (const record of state[field] || []) {
          const owner = String(record.ownerAccount || record.accountRef || ownerKey);
          bucket(owner)[field].push({ ...clone(record), ownerAccount: owner });
        }
      }
      root.accounts[ownerKey].haloMemoryDrafts = {};
      for (const [id, draft] of Object.entries(state.haloMemoryDrafts || {})) {
        const owner = String(draft.ownerAccount || ownerKey);
        bucket(owner).haloMemoryDrafts[id] = { ...clone(draft), ownerAccount: owner };
      }
      state.haloAccountScope = root;
      restore(state, root.accounts[ownerKey]);
    }
    if (!target || target === root.activeOwner) {
      if (target) delete root.accounts[target];
      return;
    }
    if (root.activeOwner) root.accounts[root.activeOwner] = capture(state);
    restore(state, root.accounts[target]);
    // Do not keep a duplicate of active data that could resurrect deleted records.
    delete root.accounts[target];
    root.activeOwner = target;
  }
  window.HaloAccountScope = { select };
  window.HALO_INSPIRATION_DESCRIPTION = '幸运色、今日数字和穿衣配色，是给日常生活的小灵感。当前使用通用内容，不会根据生日或健康数据生成个性化结果。吉级和配色只是文化表达，不预测结果，也不保证改变心情、合作或收益，无需为此购买新衣服。不用于医疗、投资等重要决定。关闭后只隐藏今日首页的灵感板块，不影响其他功能。';
})();
