(function () {
  const pages = window.HALO_V5_PAGES || [];
  const groups = ["全部", "首次使用", "设备", "今日", "健康数据", "夜间", "Halo AI", "节律", "我的", "会员与积分", "Halo Select", "渠道经营", "Halo Studio"];
  const MEMBERSHIP_STATE_KEY = "membershipHardwareState";
  const SUBJECTIVE_RECORDS_KEY = "haloSubjectiveRecords";
  const SLEEP_GOAL_KEY = "haloSleepGoal";
  const APP_PROGRESS_KEY = "haloV5AppProgress";
  const MEMBERSHIP_STATES = ["never-bound", "active", "unbound-retained"];
  const MEMBERSHIP_RULE_VERSION = "v1.20";
  const SUBJECTIVE_OPTIONS = ["情绪", "疲惫", "饮酒", "晚睡", "经期不适"];
  const DEFAULT_SLEEP_GOAL = { duration: "8", workdayBedtime: "23:15", workdayWake: "07:15", restBedtime: "23:45", restWake: "08:00" };
  const DEFAULT_AI_CORRECTION = { status: "none", reason: "", reasonLabel: "", note: "", memoryReview: false, savedAt: "" };
  const DEFAULT_NIGHT_REVIEW = { execution: "", helpfulness: "", factors: [], saved: false, counted: false, observationCount: 2 };
  const AI_CORRECTION_REASONS = {
    less: "我没有这里说得这么累",
    more: "我实际比这里更累",
    cause: "数据可能对，但原因不像",
    other: "还有别的地方不准确",
  };
  const JOURNEY_THEMES = {
    boundary: [
      { title: "睡前把工作留在床外", action: "睡前用一段内容结束工作状态", detail: "12 分钟 · 按原计划" },
      { title: "先离开工作消息 5 分钟", action: "打开勿扰，把手机放到伸手够不到的地方", detail: "5 分钟 · 更容易开始" },
      { title: "只做 1 分钟的结束动作", action: "扣下手机，慢慢呼吸 6 次就可以停", detail: "1 分钟 · 最轻版本" },
    ],
    pause: [
      { title: "白天给自己留一个短暂停顿", action: "午后离开屏幕，站起来喝几口水", detail: "5 分钟 · 新主题" },
      { title: "先离开屏幕 2 分钟", action: "看向远处，让肩膀松下来", detail: "2 分钟 · 更容易开始" },
      { title: "只做一次抬头和放松", action: "放下手里的事，慢慢呼气一次", detail: "不到 1 分钟 · 最轻版本" },
    ],
  };
  function readStoredJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }
  const requestedMembershipState = new URLSearchParams(location.search).get(MEMBERSHIP_STATE_KEY);
  const requestedCopyVariant = new URLSearchParams(location.search).get("copyVariant");
  const storedMembershipState = localStorage.getItem(MEMBERSHIP_STATE_KEY);
  const initialMembershipState = MEMBERSHIP_STATES.includes(requestedMembershipState)
    ? requestedMembershipState
    : MEMBERSHIP_STATES.includes(storedMembershipState) ? storedMembershipState : "active";
  const storedSubjectiveRecords = readStoredJson(SUBJECTIVE_RECORDS_KEY, []);
  const storedSleepGoal = readStoredJson(SLEEP_GOAL_KEY, DEFAULT_SLEEP_GOAL);
  const storedAppProgress = readStoredJson(APP_PROGRESS_KEY, {});
  const state = {
    current: "TOD-01",
    group: "全部",
    query: "",
    toggles: { legal: false, aiLegal: false, bluetooth: true, notification: true, rhythm: true, wake: true, proactive: false, memory: true, studioHealth: true, studioActivity: true, haloBody: true, location: false, inspiration: true, trendRecords: true },
    playing: false,
    measured: false,
    booked: false,
    paid: false,
    refundStatus: "none",
    sessionDone: false,
    studioMode: "ring",
    alarmSound: "晨雾",
    previewSound: "",
    deviceStatus: "connected",
    dataLifecycle: "interpretable",
    bodyWeather: "slow",
    trendPeriod: "7",
    firmwareStatus: "available",
    shareBackground: "mist",
    shareZoom: 100,
    sharePhotoUrl: "",
    haloContext: "body",
    haloFeeling: "",
    haloToolsOpen: false,
    chat: [],
    haloMemoryCleared: false,
    haloDataDeletionStatus: "ready",
    rhythmDeleted: false,
    rhythmStatus: "ready",
    healthDeletionStatus: "ready",
    studioDeletionStatus: "ready",
    membershipHardwareState: initialMembershipState,
    subjectiveMarkers: Array.isArray(storedSubjectiveRecords) ? storedSubjectiveRecords.filter((label) => SUBJECTIVE_OPTIONS.includes(label)) : [],
    sleepGoal: { ...DEFAULT_SLEEP_GOAL, ...(storedSleepGoal && typeof storedSleepGoal === "object" ? storedSleepGoal : {}) },
    measurementStatus: "ready",
    accountDeletionStatus: "ready",
    signedIn: true,
    authCodeRequested: false,
    authVerified: false,
    studioBenefitClaimed: false,
    studioBenefitStatus: "pending",
    studioReportStatus: "waiting",
    selectedStudioEventId: "yoga-evening",
    selectedStudioHistoryId: "yoga-evening",
    studioScannerOpen: false,
    studioCode: "HALO-STUDIO-2026",
    studioCodeError: "",
    memoryProposalConfirmed: false,
    aiCorrection: { ...DEFAULT_AI_CORRECTION },
    journeyPaused: false,
    journeyProgress: 2,
    journeyTheme: "boundary",
    journeyVariant: 0,
    journeyMissCount: 1,
    journeyDecision: "active",
    journeyReason: "",
    wakeSaved: false,
    snoozeUntil: "",
    profileSaved: false,
    profile: { nickname: "Halo 用户", birthday: "1992-08-26", height: "165", weight: "55" },
    feedbackSubmitted: false,
    helpQuery: "",
    rhythmFeeling: "",
    rhythmSettings: { startDate: "2026-08-18", cycleLength: "29", duration: "5" },
    rhythmSettingsDraft: null,
    rhythmSettingsSaved: false,
    nightChoice: "scan",
    nightHistory: [],
    nightReview: { ...DEFAULT_NIGHT_REVIEW },
    publicNightChoice: "",
    conversationQuery: "",
    activeConversationId: "today-energy",
    conversationStatus: "active",
    navigationHistory: [],
    newMember: false,
    memberCreatedAt: "",
    activeTab: "TOD-01",
    tabStacks: {},
    pageViews: {},
    subjectiveRecords: [],
    recordDraft: { labels: [], note: "" },
    rhythmRecords: {},
    selectedRhythmDate: "",
    rhythmMonth: "",
  };

  const persistedAppKeys = [
    "playing", "booked", "paid", "refundStatus", "sessionDone", "studioMode", "alarmSound",
    "dataLifecycle", "haloMemoryCleared", "haloDataDeletionStatus", "rhythmDeleted", "rhythmStatus",
    "healthDeletionStatus", "studioDeletionStatus", "accountDeletionStatus", "studioBenefitClaimed",
    "studioBenefitStatus", "studioReportStatus", "selectedStudioEventId", "selectedStudioHistoryId",
    "studioScannerOpen", "studioCode",
    "memoryProposalConfirmed", "aiCorrection", "journeyPaused", "journeyProgress", "journeyTheme", "journeyVariant", "journeyMissCount", "journeyDecision", "journeyReason", "wakeSaved", "snoozeUntil",
    "profileSaved", "profile", "feedbackSubmitted", "helpQuery", "previewSound", "rhythmFeeling", "rhythmSettings", "rhythmSettingsSaved",
    "nightChoice", "nightHistory", "nightReview", "publicNightChoice", "conversationQuery", "activeConversationId",
    "conversationStatus", "signedIn", "authCodeRequested", "authVerified", "authPhone", "lastVisitedRoute",
    "newMember", "memberCreatedAt", "activeTab", "tabStacks", "pageViews", "recordDraft", "rhythmRecords", "selectedRhythmDate", "rhythmMonth", "rhythmNote", "rhythmSetupReturn", "selectedReportMonth", "trendPeriod", "rhythmSettingsDraft",
    "deviceStatus", "firmwareStatus", "devicePaired", "hardwareActivatedAt", "deviceResetStatus", "deviceOperationHistory",
    "measurementStatus", "measurementType", "measured", "lastMeasurement", "feedbackDraft", "feedbackTickets", "activeFeedbackTicketId",
    "studioRecords", "wakeSettings", "wakeDraft", "nightSession", "selectedNightSessionId", "conversations", "haloQuota", "haloFeelingNote",
    "haloFeelingRecords", "haloMemories", "haloQuietHours", "haloPreferences", "journeyRecords", "chat", "haloContext", "haloFeeling",
  ];
  if (storedAppProgress && typeof storedAppProgress === "object") {
    for (const key of persistedAppKeys) {
      if (Object.prototype.hasOwnProperty.call(storedAppProgress, key)) state[key] = storedAppProgress[key];
    }
    if (storedAppProgress.toggles && typeof storedAppProgress.toggles === "object") {
      state.toggles = { ...state.toggles, ...storedAppProgress.toggles };
    }
    state.aiCorrection = { ...DEFAULT_AI_CORRECTION, ...(state.aiCorrection && typeof state.aiCorrection === "object" ? state.aiCorrection : {}) };
    state.nightReview = { ...DEFAULT_NIGHT_REVIEW, ...(state.nightReview && typeof state.nightReview === "object" ? state.nightReview : {}) };
    state.nightReview.factors = Array.isArray(state.nightReview.factors) ? state.nightReview.factors : [];
    if (!JOURNEY_THEMES[state.journeyTheme]) state.journeyTheme = "boundary";
    state.journeyVariant = Math.max(0, Math.min(2, Number(state.journeyVariant) || 0));
    state.journeyMissCount = Math.max(0, Number(state.journeyMissCount) || 0);
    state.profile = { nickname: "Halo 用户", birthday: "1992-08-26", height: "165", weight: "55", ...(state.profile || {}) };
  }
  window.HALO_STUDIO_BENEFIT_CLAIMED = state.studioBenefitStatus === "posted" || state.studioBenefitClaimed;
  function persistAppProgress() {
    const snapshot = Object.fromEntries(persistedAppKeys.map((key) => [key, state[key]]));
    snapshot.toggles = state.toggles;
    try {
      localStorage.setItem(APP_PROGRESS_KEY, JSON.stringify(snapshot));
      localStorage.setItem(SUBJECTIVE_RECORDS_KEY, JSON.stringify(state.subjectiveRecords));
    } catch {
      // The interactive prototype remains usable when storage is unavailable.
    }
  }

  let prototypeEvents = [];
  try {
    const storedPrototypeEvents = JSON.parse(sessionStorage.getItem("haloV5PrototypeEvents") || "[]");
    if (Array.isArray(storedPrototypeEvents)) prototypeEvents = storedPrototypeEvents;
  } catch {
    prototypeEvents = [];
  }
  window.HALO_V5_EVENT_LOG = prototypeEvents;
  function trackPrototypeEvent(eventName, payload = {}) {
    prototypeEvents.push({
      event_name: eventName,
      event_version: "1.0",
      occurred_at: new Date().toISOString(),
      rule_version: MEMBERSHIP_RULE_VERSION,
      hardware_membership_state: state.membershipHardwareState,
      ...payload,
    });
    if (prototypeEvents.length > 500) prototypeEvents.splice(0, prototypeEvents.length - 500);
    try {
      sessionStorage.setItem("haloV5PrototypeEvents", JSON.stringify(prototypeEvents));
    } catch {
      // Prototype analytics remain available in-memory when storage is unavailable.
    }
  }

  const HALO_SYMBOL = "assets/HALORING_super_symbol_copper.png";
  const HALO_SYMBOL_IVORY = "assets/HALORING_super_symbol_ivory.png";
  const HALO_IP_DEFAULT = "assets/halo-everyday-default-v1.png";
  const COPY_ROTATION_SUBJECT = "halo-prototype-member";
  function beijingDateKey(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date).reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
    return `${parts.year}-${parts.month}-${parts.day}`;
  }
  function stableCopyHash(value) {
    let hash = 2166136261;
    for (const character of value) {
      hash ^= character.codePointAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }
  function copyVariantIndex(scope, count) {
    if (count <= 1) return 0;
    const forced = Number(requestedCopyVariant);
    if (requestedCopyVariant !== null && Number.isInteger(forced)) return ((forced % count) + count) % count;
    return stableCopyHash(`${COPY_ROTATION_SUBJECT}|${beijingDateKey()}|${scope}`) % count;
  }
  function rotatingCopy(scope, defaults, variants = []) {
    const options = [defaults, ...variants.map((variant) => ({ ...defaults, ...variant }))];
    const copyVariant = copyVariantIndex(scope, options.length);
    return { ...options[copyVariant], copyVariant };
  }
  const DEVICE_STATUS = {
    connected: { label: "已连接", detail: "连接稳定，最近一次同步已经完成。", action: "查看设备" },
    connecting: { label: "正在连接", detail: "正在连接附近的 Halo Ring。", action: "继续等待" },
    syncing: { label: "正在同步", detail: "戒指记录正在保存到手机，已有记录不会被覆盖。", action: "查看进度" },
    disconnected: { label: "未连接", detail: "暂时没有检测到戒指。已有数据仍可查看；如果今晚开始播放，将改用手机计时渐弱。", action: "重新连接" },
    low: { label: "18%", detail: "电量偏低，建议在今晚使用前充电。", action: "查看充电建议" },
    action: { label: "需要处理", detail: "连续同步失败，需要重新连接后才能继续更新数据。", action: "查看原因" },
  };
  const DATA_LIFECYCLE = {
    none: {
      label: "暂无数据",
      headline: "还没有足够数据",
      summary: "戴着戒指完成一晚记录并同步后，这里就会开始显示。",
      reason: "还没有收到一段完整的戒指记录。",
      needed: "目前 0 / 7 天；完成第一晚后开始积累",
      next: "今晚照常佩戴，起床后打开 App 完成同步。",
      signals: [["睡眠", "等待记录"], ["身体能量", "等待记录"], ["今天怎么动", "按感受"]],
      variants: [
        { headline: "今晚先完成第一晚记录", summary: "戴着戒指睡一晚，明早同步后就会开始积累。", next: "今晚正常佩戴，睡醒后打开 App 看看进度。" },
        { headline: "Body Weather 还在等第一晚数据", summary: "有一晚完整记录后，这里就会告诉你还差几天。", next: "先完成一次夜间佩戴，不需要改变平时作息。" },
        { headline: "戴着戒指睡一晚，就会开始积累", summary: "现在没有足够记录，所以 Halo 暂时不会猜你的状态。", next: "今晚照常睡，明早完成同步即可。" },
      ],
    },
    accumulating: {
      label: "数据积累中",
      headline: "Halo 正在认识你的日常状态",
      summary: "已经记录 3 天，再完成 4 天，就能给你第一版 Body Weather。",
      reason: "现在有 3 天完整记录，还不足以看出你的平常范围。",
      needed: "目前 3 / 7 天，还差 4 天",
      next: "照常佩戴就好，不用为了记录改变作息。",
      signals: [["睡眠", "已有 3 晚"], ["身体能量", "继续观察"], ["今天怎么动", "按感受"]],
      variants: [
        { headline: "还在认识你的平常状态", summary: "已经有 3 天完整记录，再完成 4 天就能开始比较。", next: "继续按平时的方式戴，不需要为数据调整生活。" },
        { headline: "再记录 4 天，Body Weather 就能开始", summary: "前 3 天的数据都在，Halo 还需要几天确认你的常见范围。", next: "每天照常佩戴和同步，进度会自己更新。" },
        { headline: "第一版 Body Weather 正在准备", summary: "目前完成 3 / 7 天。记录越接近日常，之后的比较越有意义。", next: "保持平时的作息和佩戴习惯就好。" },
      ],
    },
    baseline: {
      label: "基线建立中",
      headline: "离第一版 Body Weather 还差 2 天",
      summary: "Halo 已经看见一些规律，还需要两天确认什么更像你的平常状态。",
      reason: "已有 5 天完整记录，可以初步比较，但个人范围还没有稳定。",
      needed: "目前 5 / 7 天，还差 2 天；之后会继续用 14 个有效夜晚校准",
      next: "继续按平时的方式佩戴和生活。",
      signals: [["睡眠", "初步范围"], ["身体能量", "还在校准"], ["今天怎么动", "按感受"]],
      variants: [
        { headline: "再完成 2 天，就能看到第一版", summary: "已经能看见一些规律，还差两天确认你的常见范围。", next: "照常佩戴，别为了记录刻意早睡或增加活动。" },
        { headline: "你的平时范围快建立好了", summary: "目前完成 5 / 7 天。再有两天完整记录，就能开始每天比较。", next: "继续过平常的生活，让记录更接近真实日常。" },
        { headline: "还差两天，Halo 就能开始比较", summary: "已有记录足够看见大致范围，但还需要两天把它确认下来。", next: "继续按原来的方式佩戴，完成后会自动更新。" },
      ],
    },
    interpretable: {
      label: "可以解释",
      headline: "今天的 Body Weather 已准备好",
      summary: "先看今天怎么安排，想知道原因时再展开数据。",
      reason: "今天的记录完整，也已经有你的个人常见范围可供比较。",
      needed: "7 天个人范围已建立；目前 9 / 14 个有效夜晚",
      next: "先看今天的建议，再按自己的真实感受调整。",
      signals: [],
      variants: [
        { headline: "今天的 Body Weather 已更新", summary: "先看今天怎么安排，想知道细节时再往下看。", next: "把建议当作参考，最后仍以自己的感受为准。" },
        { headline: "昨晚记录完整，今天可以看了", summary: "一句话先告诉你今天怎么过，具体数据按需展开。", next: "先看今天最有用的一条建议，再决定是否调整。" },
        { headline: "今天的状态已经整理好", summary: "先看结论和行动，需要时再查看昨晚的记录。", next: "结合自己的感受使用，不需要为了分数改变一天。" },
      ],
    },
    limited: {
      label: "数据质量受限",
      headline: "昨晚少了一段记录",
      summary: "今天的判断会保守一些。照常生活，运动先以自己的感受为准。",
      reason: "最近一次同步未完成，昨晚 02:10–03:00 的记录缺失。",
      needed: "重新同步，或完成下一晚完整记录",
      next: "先试一次同步；仍没有更新，再检查戒指连接。",
      signals: [["睡眠", "缺少 50 分钟"], ["身体能量", "暂不下结论"], ["今天怎么动", "按感受"]],
      variants: [
        { headline: "昨晚的记录缺了 50 分钟", summary: "今天先不做太细的判断，活动安排以你的感受为准。", next: "先重新同步一次；没有补回时再检查连接。" },
        { headline: "今天有一段数据没同步完整", summary: "Halo 会少说一点，避免用不完整记录给出确定结论。", next: "重新同步后再回来看看；日常活动可以照常。" },
        { headline: "昨晚中间少了一段记录", summary: "今天仍能查看已有数据，但不会根据缺失时段进行猜测。", next: "先试着同步；仍有缺口，就完成下一晚完整记录。" },
      ],
    },
  };
  const BODY_WEATHER_STATES = {
    restore: {
      label: "修复日",
      english: "RESTORE DAY",
      homeTitle: "今天先别勉强自己",
      homeBody: "昨晚比平时少睡了不少，夜里也醒得多。日常安排可以继续，运动和加班都先收一点。",
      signals: [["睡眠", "没睡够"], ["身体能量", "比平时低"], ["今天怎么动", "轻松一点"]],
      detailSummary: "昨晚恢复得不够完整。今天正常过就好，别再给自己加一段高强度。",
      why: "昨晚比平时少睡 1 小时 12 分，夜里醒了 3 次；HRV 也低于你近两周的常见范围。",
      pressure: "白天很少真正放松下来",
      trend: "最近一周有 2 天需要多休息",
      actionTitle: "今天正常过，但别硬撑",
      actionBody: "必要的事照常做；运动选散步、拉伸或轻松骑行。困了就早点收尾。",
      nightTitle: "今晚早点收尾",
      nightBody: "先做 18 分钟舒缓练习，再准备睡觉。",
      shareLine: "昨晚没恢复够，今天不勉强自己。",
      variants: [
        {
          homeTitle: "今天先照顾好自己",
          homeBody: "昨晚比平时少睡 1 小时 12 分，夜里醒了 3 次。必要的事照常做，额外消耗先少一点。",
          detailSummary: "昨晚睡得少，也不够连贯。今天把精力先留给必须完成的事。",
          actionTitle: "先完成必要的事，其他可以往后放",
          actionBody: "散步和轻松拉伸没有问题；高强度运动、熬夜和临时加班先缓一缓。",
          nightTitle: "今晚尽量早一点休息",
          nightBody: "先听 18 分钟舒缓练习，再按平时时间准备睡觉。",
          shareLine: "昨晚睡得不够，今天先照顾好自己。",
        },
        {
          homeTitle: "今天把难的事往后放一放",
          homeBody: "昨晚睡眠不足，HRV 也低于近期。日常可以继续，费体力和需要长时间专注的事别排得太密。",
          detailSummary: "今天不是完全不能动，而是不适合再给自己加一段高消耗。",
          actionTitle: "日常照常，高消耗安排先减少",
          actionBody: "工作和出门可以继续。运动选轻松的，困意明显时就提前结束。",
          nightTitle: "今晚别再拖得太晚",
          nightBody: "用一段舒缓练习结束白天，给睡眠留出完整时间。",
          shareLine: "今天少排一点难事，把恢复放回日程里。",
        },
        {
          homeTitle: "今天不用硬撑进度",
          homeBody: "昨晚睡得少，夜间信号也比平时低。先把必须做的完成，其他事情允许自己慢一点。",
          detailSummary: "身体正在补回昨晚没完成的恢复。今天别用额外训练或熬夜继续透支。",
          actionTitle: "做够今天需要做的，不再额外加码",
          actionBody: "运动控制在能轻松说话的强度；晚上比平时早一点结束工作。",
          nightTitle: "今晚把睡觉排在前面",
          nightBody: "18 分钟舒缓练习后，尽量不再处理工作消息。",
          shareLine: "昨晚没睡够，今天不靠硬撑赶进度。",
        },
      ],
    },
    slow: {
      label: "缓行日",
      english: "SLOW DAY",
      homeTitle: "今天别把安排塞太满",
      homeBody: "昨晚睡得不够连贯。工作和日常出门可以照常，运动先别冲强度。",
      signals: [["睡眠", "夜里醒了 2 次"], ["身体能量", "接近平时"], ["今天怎么动", "轻量即可"]],
      detailSummary: "昨晚睡眠被打断了两次。今天照常安排，运动先别冲强度。",
      why: "昨晚比平时少睡 36 分钟，中间醒了 2 次；HRV 和静息心率仍在你的常见范围内。",
      pressure: "白天大多比较平稳",
      trend: "最近一周有 3 天需要放慢一点",
      actionTitle: "照常过，少加一项高消耗安排",
      actionBody: "如果要运动，散步、拉伸或轻松骑行都可以。下午明显犯困，就把高强度训练改天。",
      nightTitle: "今晚早点收尾",
      nightBody: "用 12 分钟身体扫描，从白天切换到休息。",
      shareLine: "昨晚睡得有些碎，今天不把行程排太满。",
      variants: [
        {
          homeTitle: "今天照常过，别临时再加码",
          homeBody: "昨晚比平时少睡了一些。工作和出门照常，高强度运动看下午状态再决定。",
          detailSummary: "日常安排没有问题，但不必把临时增加的任务也塞进今天。",
          actionTitle: "先按原计划，临时加码可以拒绝",
          actionBody: "下午精神还好就照常活动；明显犯困时，把高强度训练换成散步。",
          nightTitle: "今晚按时结束忙碌",
          nightBody: "听 12 分钟身体扫描，让白天在睡前真正停下来。",
          shareLine: "今天照常过，不临时再给自己加码。",
        },
        {
          homeTitle: "今天可以忙，但别把休息挤掉",
          homeBody: "夜里醒了两次，HRV 和静息心率仍接近平时。事情可以照做，中间记得留出休息。",
          detailSummary: "昨晚没有完全睡踏实。今天不用停下来，但也别连续忙到晚上。",
          actionTitle: "给下午留一次真正的休息",
          actionBody: "找十分钟离开屏幕走一走；如果要训练，先从轻量开始。",
          nightTitle: "今晚别把事情带上床",
          nightBody: "睡前用 12 分钟身体扫描，之后不再处理需要费脑的事。",
          shareLine: "今天可以忙，也别把休息从日程里挤掉。",
        },
        {
          homeTitle: "今天不必停下来，也不用硬撑",
          homeBody: "昨晚睡眠被打断了两次。日常活动照常，真正觉得累时就及时减量。",
          detailSummary: "今天的状态能应付日常，但不值得为了完成数字再冲一段强度。",
          actionTitle: "先照常开始，累了就及时减量",
          actionBody: "散步、拉伸或轻松骑行都可以；下午状态不好时，训练改天也没关系。",
          nightTitle: "今晚早点让自己安静下来",
          nightBody: "从 12 分钟身体扫描开始，不用再追赶今天没完成的事。",
          shareLine: "今天照常生活，累了就及时减量。",
        },
      ],
    },
    balance: {
      label: "平衡日",
      english: "BALANCE DAY",
      homeTitle: "今天按平时的节奏来",
      homeBody: "昨晚的睡眠和夜间信号都接近你的平常水平。工作、出门和运动照常即可。",
      signals: [["睡眠", "接近平时"], ["身体能量", "比较稳定"], ["今天怎么动", "照常"]],
      detailSummary: "昨晚的几个信号都接近平时。今天不用特意加量，也不用刻意收着。",
      why: "睡眠时长、HRV 和静息心率都在你近两周的常见范围内，没有持续偏离。",
      pressure: "没有看到持续变化",
      trend: "最近一周大多接近平时",
      actionTitle: "按原计划过一天",
      actionBody: "不需要为了状态分数改变安排。累了就休息，有精神就照常活动。",
      nightTitle: "今晚照平时来",
      nightBody: "按平时的睡前习惯开始。",
      shareLine: "今天和往常差不多，照自己的节奏来。",
      variants: [
        {
          homeTitle: "今天和往常差不多",
          homeBody: "睡眠、HRV 和静息心率都在你的常见范围内。原来怎么安排，今天就怎么来。",
          detailSummary: "没有看到需要特别加量或减量的变化。按原计划过一天即可。",
          actionTitle: "照原来的计划进行",
          actionBody: "工作、出门和运动都不用特意调整；真实感受有变化时再改。",
          nightTitle: "今晚继续平时的习惯",
          nightBody: "到熟悉的时间就开始准备睡觉。",
          shareLine: "今天和往常差不多，按原计划来。",
        },
        {
          homeTitle: "今天不用因为数据改变计划",
          homeBody: "昨晚的几个主要信号都接近平时。想工作、出门或运动，都可以照常。",
          detailSummary: "今天没有特别需要避开或增加的安排，保持正常生活就好。",
          actionTitle: "该做什么就做什么",
          actionBody: "不用为了状态分数多练或少练。累了休息，有精神就继续。",
          nightTitle: "今晚自然结束这一天",
          nightBody: "不额外加任务，按平时方式准备睡觉。",
          shareLine: "今天不用为数据改变计划。",
        },
        {
          homeTitle: "今天按原计划来就好",
          homeBody: "昨晚睡眠和夜间信号没有持续偏离。今天不需要刻意收着，也不必追求更高强度。",
          detailSummary: "今天最合适的安排，就是保持你已经习惯的工作、活动和休息。",
          actionTitle: "保持正常的一天",
          actionBody: "照常工作和活动，休息也照常。不要因为一个分数临时改变全部计划。",
          nightTitle: "今晚保持熟悉的睡前安排",
          nightBody: "在平时的时间放下手机，准备休息。",
          shareLine: "今天按原计划来，不必刻意改变。",
        },
      ],
    },
    active: {
      label: "活力日",
      english: "ACTIVE DAY",
      homeTitle: "今天状态不错，可以动起来",
      homeBody: "昨晚睡得比较完整，HRV 比近期高一些，静息心率也回到你平时较低的水平。想运动的话，可以按原计划进行。",
      signals: [["睡眠", "睡得比较完整"], ["身体能量", "高于近期"], ["今天怎么动", "按计划"]],
      detailSummary: "昨晚睡得比较完整，夜间信号也比近期好。今天有想做的运动，可以按计划进行。",
      why: "睡眠连续性较好，HRV 高于近两周平均，静息心率也回到你的常见较低区间。",
      pressure: "白天大多比较平稳",
      trend: "最近一周有 2 天状态较好",
      actionTitle: "有想做的运动，今天可以安排",
      actionBody: "按原计划进行就好，不用为了状态分数额外加量，也别省掉正常休息。",
      nightTitle: "今晚按时停下来",
      nightBody: "保持平时的睡前习惯，不用再为今天加码。",
      shareLine: "昨晚睡得不错，今天可以按计划动起来。",
      variants: [
        {
          homeTitle: "今天有想做的运动，可以安排",
          homeBody: "昨晚睡得比较完整，HRV 也比近期高一些。按原计划运动即可，不用为了分数多练。",
          detailSummary: "今天的睡眠和夜间信号都不错，原本想做的活动可以正常进行。",
          actionTitle: "按原计划运动，不额外加量",
          actionBody: "选择熟悉的训练内容，结束后保留正常休息和补水。",
          nightTitle: "今晚也按时停下来",
          nightBody: "白天状态不错，也不需要用晚睡继续加码。",
          shareLine: "今天可以按计划运动，不为了分数额外加练。",
        },
        {
          homeTitle: "今天可以把想做的事提上日程",
          homeBody: "睡眠连续性较好，静息心率也回到平时较低的水平。想运动或处理需要专注的事，可以照计划来。",
          detailSummary: "昨晚恢复得比较完整。今天可以积极一点，但不需要把行程排满。",
          actionTitle: "把原本想做的一件事安排上",
          actionBody: "可以训练，也可以处理需要专注的任务；完成原计划就够了。",
          nightTitle: "今晚别因为状态好而熬夜",
          nightBody: "按时结束活动，让明天也有完整睡眠。",
          shareLine: "今天状态不错，把想做的事安排上。",
        },
        {
          homeTitle: "今天精神不错，就照计划动起来",
          homeBody: "昨晚睡得整，HRV 高于近期平均。可以进行原定运动，同时保留正常休息。",
          detailSummary: "今天适合执行已有计划，而不是临时追求更高的训练数字。",
          actionTitle: "完成原计划就好",
          actionBody: "运动强度按原来的安排走，不临时增加组数、时长或训练次数。",
          nightTitle: "今晚正常收尾，不拖晚",
          nightBody: "保持熟悉的睡前时间，把好状态留到明天。",
          shareLine: "今天精神不错，完成原计划就好。",
        },
      ],
    },
  };
  const DAILY_INSPIRATION = {
    keyword: "留白",
    message: "今天给自己留十分钟，不安排事情，也不急着做决定。",
    action: "把一件不着急的事放到明天。",
    color: "鼠尾草绿",
    outfitColor: "大吉 · 黄 / 棕 / 咖 / 卡其",
    outfits: [
      { level: "大吉", colors: "黄色、棕色、咖色、卡其色", meaning: "温暖的大地色，文化寓意是得到支持、心情轻松、做事顺意。", swatches: ["#d6b84c", "#8a6548", "#5f4638", "#b69b72"] },
      { level: "中吉", colors: "红色、粉红色", meaning: "明快的红粉色，文化寓意是更容易靠近彼此、展开交流与合作。", swatches: ["#b95f59", "#d99a9e"] },
      { level: "小吉", colors: "黑色、深蓝色、深灰色", meaning: "沉稳的深色，文化寓意是专注投入、稳步推进，也适合把事情收好尾。", swatches: ["#282725", "#34465f", "#5c5e61"] },
    ],
    outfitQuestion: "今天的大地色旺运穿衣怎么搭？",
    outfitReply: "今天可以用黄色、棕色、咖色或卡其色做主色：比如卡其外套配米白内搭，或用咖色包和鞋做小面积呼应。把它当作文化穿搭灵感就好，优先穿你已有、舒服，也符合今天场合的衣服。",
    number: "6",
  };
  const NIGHT_COPY = {
    title: "今晚早点把忙碌停下来",
    detailIntro: "跟着声音把注意力放回身体，一段一段放松下来。",
    variants: [
      {
        title: "今晚先把事情放下",
        detailIntro: "跟着声音从头到脚慢慢放松，不用再处理今天没做完的事。",
      },
      {
        title: "今晚不用再赶进度",
        detailIntro: "用一段轻声引导把注意力带回身体，让白天慢慢结束。",
      },
      {
        title: "今晚慢慢收尾，准备睡觉",
        detailIntro: "从呼吸和身体感觉开始，把还在转的念头暂时放到明天。",
      },
    ],
  };
  const HALO_COPY = {
    boundOpening: "早上好，想先聊什么？",
    boundSubtitle: "我可以参考今天的状态，也会听你的真实感受",
    unboundOpening: "早上好，我在这里",
    unboundSubtitle: "这次对话不参考身体状态",
    noBodyQuickReply: "这次我不看身体数据。你可以先告诉我今天最累、最烦，或最想理清的是什么。",
    noBodyTypedReply: "这次我不看身体数据，但可以陪你把事情理清楚。先说说现在最占你心思的那一件事。",
    bodyTypedReply: "我听到了。我们先把这件事说清楚，再一起决定今天做什么、先不做什么。",
    variants: [
      {
        boundOpening: "早上好，今天想从哪件事说起？",
        boundSubtitle: "我会参考今天的记录，也以你此刻的感受为准",
        unboundOpening: "早上好，想先说说什么？",
        noBodyQuickReply: "这次不参考身体数据。先说说今天哪件事最让你费心，我们一起把它拆小一点。",
        noBodyTypedReply: "我不会用身体数据来判断。你先说说现在最想解决的一件事，我们从那里开始。",
        bodyTypedReply: "好，我们先把你刚说的这件事理清楚，再看今天哪些要做、哪些可以往后放。",
      },
      {
        boundOpening: "我在。今天最想先理清什么？",
        boundSubtitle: "今天的记录可以作参考，你的感受更重要",
        unboundOpening: "我在，慢慢说就好",
        noBodyQuickReply: "这次我不读取身体状态。你可以从累、烦，或最不想面对的那件事开始说。",
        noBodyTypedReply: "这次对话不参考身体状态，但我可以陪你梳理。现在最占心思的是什么？",
        bodyTypedReply: "我明白了。先不用急着解决全部，我们一起找出今天最值得先做的一步。",
      },
      {
        boundOpening: "早上好，我们先看今天最需要什么",
        boundSubtitle: "我会结合记录和你刚刚说的感受",
        unboundOpening: "早上好，我会先听你说",
        noBodyQuickReply: "今天这次不看身体数据。告诉我你现在更需要安排事情、放松一下，还是先有人听你说。",
        noBodyTypedReply: "我会先听你说，不用一次讲完整。我们从现在最难放下的那件事开始。",
        bodyTypedReply: "收到。我们先照顾眼前最重要的一件事，剩下的可以慢慢排。",
      },
    ],
  };
  function currentDataLifecycle(stage = state.dataLifecycle) {
    const config = DATA_LIFECYCLE[stage] || DATA_LIFECYCLE.interpretable;
    const { variants, ...defaults } = config;
    return rotatingCopy(`data-lifecycle:${stage}`, defaults, variants);
  }
  function currentBodyWeather() {
    const config = BODY_WEATHER_STATES[state.bodyWeather] || BODY_WEATHER_STATES.slow;
    const { variants, ...defaults } = config;
    return rotatingCopy(`body-weather:${state.bodyWeather}`, defaults, variants);
  }
  function currentNightCopy() {
    const { variants, ...defaults } = NIGHT_COPY;
    return rotatingCopy("night:main", defaults, variants);
  }
  function currentHaloCopy() {
    const { variants, ...defaults } = HALO_COPY;
    return rotatingCopy("halo:conversation", defaults, variants);
  }
  const NIGHT_CONTENT = {
    scan: { title: "安静身体扫描", duration: 12, format: "身体扫描", sound: "轻声引导 + 极简环境音", fit: "脑子还停不下来，或身体有些紧" },
    breath: { title: "呼吸慢下来", duration: 8, format: "呼吸节律", sound: "轻声节拍 + 留白", fit: "想先把呼吸放慢，再准备睡觉" },
    sound: { title: "夜间白噪音", duration: 30, format: "无引导声音", sound: "连续柔和环境音", fit: "不想听引导，只想让房间安静一点" },
  };
  const STUDIO_EVENTS = {
    "yoga-evening": { title: "暮色舒展瑜伽", date: "9 月 12 日 19:30", startsAt: "2026-09-12T19:30:00+08:00", place: "静安体验室", duration: 60, category: "瑜伽", price: 99, host: "Lin", seats: 6, cancellationHours: 24 },
    "pilates-morning": { title: "晨间核心普拉提", date: "9 月 13 日 09:30", startsAt: "2026-09-13T09:30:00+08:00", place: "静安体验室", duration: 50, category: "普拉提", price: 0, host: "Mia", seats: 4, cancellationHours: 24 },
    "breath-night": { title: "夜间呼吸与冥想", date: "9 月 12 日 20:00", startsAt: "2026-09-12T20:00:00+08:00", place: "Halo 体验室", duration: 30, category: "冥想", price: 0, host: "Halo Studio", seats: 0, cancellationHours: 24 },
  };
  function currentNightContent() { const base = NIGHT_CONTENT[state.nightChoice] || NIGHT_CONTENT.scan; if (isHardwareActive()) return base; const content = { breath: ["5 分钟睡前呼吸", 5], scan: ["10 分钟身体扫描", 10], sound: ["15 分钟安睡音频", 15] }[state.nightChoice] || ["10 分钟身体扫描", 10]; return { ...base, title: content[0], duration: content[1] }; }
  function selectedStudioEvent(id = state.selectedStudioEventId) { return state.studioRecords?.[id]?.eventSnapshot || STUDIO_EVENTS[id] || STUDIO_EVENTS["yoga-evening"]; }
  function experienceDay() { return new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10); }
  function experienceTime(value) { return new Date(value).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
  function initializeExperienceState() {
    state.wakeSettings = { time: "07:20", window: "30", sound: state.alarmSound || "晨雾", enabled: state.toggles.wake !== false, ...(state.wakeSettings || {}) };
    state.wakeDraft = { ...state.wakeSettings, ...(state.wakeDraft || {}) };
    state.haloFeelingNote = state.haloFeelingNote || "";
    state.haloFeelingRecords = Array.isArray(state.haloFeelingRecords) ? state.haloFeelingRecords : [];
    state.haloQuietHours = { start: "23:30", end: "08:00", ...(state.haloQuietHours || {}) };
    state.haloPreferences = { tone: "direct", length: "short", ...(state.haloPreferences || {}) };
    state.haloQuota = state.haloQuota?.day === experienceDay() ? state.haloQuota : { day: experienceDay(), used: 0 };
    state.conversations = Array.isArray(state.conversations) ? state.conversations : [];
    state.chat = Array.isArray(state.chat) ? state.chat : [];
    if (!state.conversations.length && state.chat.length) state.conversations.push({ id: state.activeConversationId || `hc-${Date.now()}`, title: state.chat.find((m) => m.role === "user")?.text.slice(0, 30) || "当前对话", status: "active", messages: state.chat, updatedAt: new Date().toISOString() });
    const conversation = state.conversations.find((entry) => entry.id === state.activeConversationId && entry.status !== "deleted");
    state.chat = conversation ? conversation.messages : [];
    state.conversationStatus = conversation?.status || "new";
    if (!Array.isArray(state.haloMemories)) state.haloMemories = state.haloMemoryCleared ? [] : [{ id: "brief", text: "你更喜欢简短、直接的建议", confirmed: true }, { id: "quiet", text: "晚上压力大时更偏好无引导声音", confirmed: Boolean(state.memoryProposalConfirmed) }];
    state.journeyRecords = state.journeyRecords && typeof state.journeyRecords === "object" ? state.journeyRecords : {};
    for (const theme of Object.keys(JOURNEY_THEMES)) {
      if (!state.journeyRecords[theme]) state.journeyRecords[theme] = { days: [], entries: [], note: "" };
    }
    state.journeyProgress = state.journeyRecords[state.journeyTheme].days.length;
    state.nightHistory = Array.isArray(state.nightHistory) ? state.nightHistory.filter((entry) => entry.id && entry.startedAt && entry.endedAt) : [];
    if (state.nightSession && !state.nightSession.id) state.nightSession = null;
    state.selectedNightSessionId = state.selectedNightSessionId || state.nightHistory[0]?.id || "";
    state.studioRecords = state.studioRecords && typeof state.studioRecords === "object" ? state.studioRecords : {};
    state.toggles.sleepFade = state.toggles.sleepFade !== false;
    state.playing = Boolean(state.nightSession?.status === "playing");
    syncStudioAliases();
    if (!initializeExperienceState.playbackTimer) initializeExperienceState.playbackTimer = setInterval(() => {
      if (state.current !== "NIG-04" || state.nightSession?.status !== "playing") return;
      const session = state.nightSession;
      const position = nightPosition(session);
      const label = document.querySelector(".player-meta .eyebrow");
      if (label) label.textContent = `正在播放 · ${Math.floor(position / 60)}:${String(position % 60).padStart(2, "0")} / ${session.duration}:00`;
      const bar = document.querySelector(".night-screen .progress i");
      if (bar) bar.style.width = `${Math.round(position / (session.duration * 60) * 100)}%`;
      const part = document.getElementById("night-current-part");
      if (part) part.textContent = position >= session.primaryDuration * 60 ? "接续白噪音 · 20分钟" : `第一段 ${session.primaryDuration}分钟，接白噪音20分钟`;
      if (position >= session.duration * 60) handleAction("night-end");
    }, 1000);
  }
  function studioRecord(id = state.selectedStudioEventId) {
    if (!STUDIO_EVENTS[id]) id = "yoga-evening";
    if (!state.studioRecords) state.studioRecords = {};
    if (!state.studioRecords[id]) state.studioRecords[id] = { bookingId: "", booked: false, paid: false, refundStatus: "none", sessionStarted: false, sessionDone: false, mode: "basic", healthConsent: false, activityConsent: false, contactConsent: false, marketingConsent: false, reportStatus: "waiting", benefitStatus: "pending", beforeFeeling: "", beforeDraft: "", deletionStatus: "ready", useVoucher: false, paidAmount: 0 };
    return state.studioRecords[id];
  }
  function syncStudioAliases() {
    const record = studioRecord();
    state.booked = record.booked; state.paid = record.paid; state.refundStatus = record.refundStatus; state.sessionDone = record.sessionDone;
    state.studioMode = record.mode; state.studioReportStatus = record.reportStatus; state.studioBenefitStatus = record.benefitStatus; state.studioDeletionStatus = record.deletionStatus;
    state.toggles.studioHealth = record.healthConsent; state.toggles.studioActivity = record.activityConsent; state.toggles.studioContact = record.contactConsent; state.toggles.studioMarketing = record.marketingConsent;
  }
  function studioConfirmed(record = studioRecord()) { return record.booked && record.paid && record.refundStatus === "none" && record.deletionStatus !== "deleted"; }
  function studioCanReport(record = studioRecord()) { return record.sessionDone && record.mode === "ring" && record.healthConsent && record.activityConsent && isHardwareActive() && state.dataLifecycle === "interpretable" && record.deletionStatus === "ready"; }
  function experienceRouteGuard(id) {
    if (!id.startsWith("STU-")) return id;
    const record = studioRecord();
    if (["STU-17", "STU-18"].includes(id) && !record.booked) return "STU-16";
    if (["STU-10", "STU-11", "STU-03", "STU-04"].includes(id) && !studioConfirmed(record)) return record.booked ? "STU-18" : "STU-09";
    if (["STU-11", "STU-03", "STU-04"].includes(id) && !record.activityConsent) return "STU-10";
    if (id === "STU-04" && !record.sessionStarted) return "STU-03";
    if (["STU-05", "STU-06"].includes(id) && (!studioCanReport(record) || record.reportStatus !== "generated")) return "STU-12";
    return id;
  }
  function handleExperienceInput(target) {
    const fields = { "wake-time": [state.wakeDraft, "time"], "wake-window": [state.wakeDraft, "window"], "halo-quiet-start": [state.haloQuietHours, "start"], "halo-quiet-end": [state.haloQuietHours, "end"] };
    if (fields[target.id]) { const [object, key] = fields[target.id]; object[key] = target.value; state.wakeSaved = false; persistAppProgress(); return true; }
    if (target.id === "halo-feeling-note") { state.haloFeelingNote = target.value; persistAppProgress(); return true; }
    if (target.id === "studio-before-feeling") { studioRecord().beforeDraft = target.value; persistAppProgress(); return true; }
    if (target.id === "journey-note") { state.journeyRecords[state.journeyTheme].note = target.value; persistAppProgress(); return true; }
    return false;
  }
  function handleExperienceChoice(key, value) {
    if (key === "studioMode") { studioRecord().mode = value === "ring" && isHardwareActive() ? "ring" : "basic"; if (studioRecord().mode === "basic") studioRecord().reportStatus = "withdrawn"; syncStudioAliases(); return true; }
    if (["haloTone", "haloLength"].includes(key)) { state.haloPreferences[key === "haloTone" ? "tone" : "length"] = value; return true; }
    return false;
  }
  function handleExperienceToggle(key) {
    const fields = { studioHealth: "healthConsent", studioActivity: "activityConsent", studioContact: "contactConsent", studioMarketing: "marketingConsent" };
    if (fields[key]) { const record = studioRecord(); record[fields[key]] = !record[fields[key]]; if (["studioHealth", "studioActivity"].includes(key) && !record[fields[key]]) record.reportStatus = "withdrawn"; syncStudioAliases(); return true; }
    if (key === "wake") { state.wakeDraft.enabled = !state.wakeDraft.enabled; state.wakeSaved = false; state.toggles.wake = state.wakeDraft.enabled; return true; }
    if (key === "sleepFade") { state.toggles.sleepFade = !state.toggles.sleepFade; if (state.nightSession && state.nightSession.status !== "ended") state.nightSession.fadeEnabled = isHardwareActive() && state.toggles.sleepFade; return true; }
    return false;
  }
  function ensureHaloQuota() { if (state.haloQuota.day !== experienceDay()) state.haloQuota = { day: experienceDay(), used: 0 }; return state.haloQuota; }
  function saveHaloConversation() {
    let conversation = state.conversations.find((entry) => entry.id === state.activeConversationId && entry.status !== "deleted");
    if (!conversation) { state.activeConversationId = `hc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; conversation = { id: state.activeConversationId, status: "active", messages: [] }; state.conversations.push(conversation); }
    conversation.messages = state.chat.map((message) => ({ ...message }));
    conversation.title = state.chat.find((message) => message.role === "user")?.text.slice(0, 30) || "新的对话";
    conversation.updatedAt = new Date().toISOString(); conversation.status = "active"; state.conversationStatus = "active";
    persistAppProgress();
  }
  function openHaloConversation(id) {
    const conversation = state.conversations.find((entry) => entry.id === id && entry.status !== "deleted");
    if (!conversation) return flash("这条会话已删除或不存在");
    state.activeConversationId = id; state.chat = conversation.messages.map((message) => ({ ...message })); state.conversationStatus = conversation.status; state.haloToolsOpen = false;
    return go("HAL-01");
  }
  function haloSafetySupport() {
    return `<section class="notice warm" role="status"><h3>先照顾眼前的安全</h3><p>如果你正处在危险中，或担心会伤害自己，请立即联系当地急救服务，也可以请一位信任的人过来陪你。Halo 不能提供紧急救援。</p>${buttons([["查看求助方式", "halo-safety-help", "primary"], ["暂停这次对话", "halo-safety-pause", "secondary"]])}</section>`;
  }
  function showHaloPreferences() {
    showInfoModal("表达偏好", "选择后自动保存，只调整说话方式，不改变 Halo 的服务边界。", "完成");
    const options = [["tone", "direct", "直接一点"], ["tone", "gentle", "温和一点"], ["length", "short", "简短回复"], ["length", "detailed", "详细回复"]];
    modalRoot.querySelector(".button-row").insertAdjacentHTML("beforebegin", `<div class="stack">${options.map(([key, value, label]) => `<button class="choice-row ${state.haloPreferences[key] === value ? "selected" : ""}" data-action="halo-preference:${key}:${value}"><strong>${label}</strong><i></i></button>`).join("")}</div>`);
  }
  function appendHaloReply(text, reply) {
    const safety = /不想活|自杀|伤害自己|伤害别人|轻生|结束生命|胸痛|喘不过气|呼吸困难/.test(text) || Boolean(state.chat.at(-1)?.safety);
    const quota = ensureHaloQuota();
    if (!isHardwareActive() && quota.used >= 10 && !safety) return flash("今天的 10 条消息已用完，明日北京时间 00:00 恢复");
    if (!isHardwareActive() && !safety) quota.used += 1;
    const detail = state.haloPreferences.length === "detailed" ? `${reply} 如果这个方向不适合，可以告诉我你最在意的部分，我们再一起调整。` : reply;
    const response = safety ? "听起来你现在很难受。先暂停普通建议，眼前的安全更重要。" : state.haloPreferences.tone === "gentle" ? `我们可以慢慢来。${detail}` : detail;
    state.chat.push({ role: "user", text }, { role: "halo", text: response, safety });
    state.haloToolsOpen = false; saveHaloConversation(); render(); revealLatestHaloMessage();
  }
  function currentNightSession() { return state.nightHistory.find((entry) => entry.id === state.selectedNightSessionId) || state.nightHistory[0] || null; }
  function nightPosition(session = state.nightSession) { return session ? Math.min(session.duration * 60, Math.floor((session.positionSeconds || 0) + (session.status === "playing" ? (Date.now() - new Date(session.resumedAt).getTime()) / 1000 : 0))) : 0; }
  function changeNightPlayback() { const session = state.nightSession; if (!session || session.status === "ended") return flash("请先选择内容并开始播放"); session.positionSeconds = nightPosition(session); session.status = session.status === "playing" ? "paused" : "playing"; session.resumedAt = new Date().toISOString(); state.playing = session.status === "playing"; return render(); }
  function hasBodyContext() { return isHardwareActive() && state.dataLifecycle === "interpretable" && state.toggles.haloBody; }

  const nav = document.getElementById("page-nav");
  const groupNav = document.getElementById("group-nav");
  const screen = document.getElementById("screen");
  const tabbar = document.getElementById("tabbar");
  const search = document.getElementById("search");
  const toast = document.getElementById("toast");
  const modalRoot = document.getElementById("modal-root");

  function esc(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  }
  function filteredPages() {
    return pages.filter((item) => {
      const groupMatch = state.group === "全部" || item.group === state.group;
      const text = [item.id, item.name, item.function, item.note].join(" ").toLowerCase();
      return groupMatch && (!state.query || text.includes(state.query.toLowerCase()));
    });
  }
  const SIGNED_OUT_ROUTES = new Set(["ONB-01", "AUTH-01", "AUTH-02", "LEGAL-01"]);
  const DELETION_STATUS_ROUTES = new Set(["ACC-02", "ACC-03", "HELP-03", "LEGAL-02"]);
  function guardedRoute(id) {
    if (!state.signedIn && !SIGNED_OUT_ROUTES.has(id)) return "AUTH-01";
    if (!state.signedIn && id === "AUTH-02" && !state.authCodeRequested) return "AUTH-01";
    if (!state.signedIn && id === "LEGAL-01" && !state.authVerified) return state.authCodeRequested ? "AUTH-02" : "AUTH-01";
    if (state.signedIn && state.accountDeletionStatus === "submitted" && !DELETION_STATUS_ROUTES.has(id)) return "ACC-03";
    if (typeof accountRouteGuard === "function") id = accountRouteGuard(id);
    if (typeof experienceRouteGuard === "function") id = experienceRouteGuard(id);
    return id;
  }
  function tabForRoute(id) {
    const prefix = String(id).split("-")[0];
    if (["TOD", "HLT"].includes(prefix)) return "TOD-01";
    if (prefix === "NIG") return "NIG-01";
    if (prefix === "HAL") return "HAL-01";
    if (prefix === "RHY") return "RHY-01";
    if (["MY", "ACC", "SET", "HELP", "DEV", "STU", "MEM", "PTS", "REF", "SEL", "CHN"].includes(prefix)) return "MY-01";
    return "";
  }
  function capturePageView() {
    const id = screen.dataset.page;
    if (!id) return;
    state.pageViews[id] = {
      top: screen.scrollTop,
      open: [...screen.querySelectorAll("details")].map((el, index) => el.open ? index : -1).filter(index => index >= 0),
    };
  }
  function go(id, recordHistory = true) {
    const target = guardedRoute(id);
    if (!pages.some((item) => item.id === target)) return;
    capturePageView();
    if (target === "RHY-00" && state.current !== target) state.rhythmSetupReturn = /^DEV-|^ONB-/.test(state.current) ? "ONB-02" : "RHY-01";
    if (recordHistory && state.current !== target) state.navigationHistory.push(state.current);
    if (state.navigationHistory.length > 100) state.navigationHistory.splice(0, state.navigationHistory.length - 100);
    const tab = tabForRoute(target);
    if (tab) {
      state.activeTab = tab;
      const stack = state.tabStacks[tab] || (state.tabStacks[tab] = [tab]);
      if (stack.at(-1) !== target) stack.push(target);
      if (stack.length > 30) stack.splice(1, stack.length - 30);
    }
    const changed = state.current !== target;
    state.current = target;
    const trail = Array.isArray(history.state?.trail) ? history.state.trail : [location.hash.slice(1) || "TOD-01"];
    const nextTrail = changed && recordHistory ? [...trail, target] : [...trail.slice(0, -1), target];
    if (changed && recordHistory) history.pushState({ halo: true, id: target, trail: nextTrail }, "", `#${target}`);
    else history.replaceState({ halo: true, id: target, trail: nextTrail }, "", `#${target}`);
    render();
  }
  function goBack() {
    capturePageView();
    const tab = tabForRoute(state.current);
    const stack = state.tabStacks[tab] || [];
    if (stack.at(-1) === state.current && stack.length > 1) {
      stack.pop();
      const target = stack.at(-1);
      const trail = history.state?.trail || [];
      const index = trail.slice(0, -1).lastIndexOf(target);
      if (index >= 0) { history.go(index - trail.length + 1); return; }
      return go(target, false);
    }
    const item = pages.find((candidate) => candidate.id === state.current);
    const parentId = String(item?.parent || "").match(/[A-Z]+-\d+/)?.[0];
    const fallback = parentId && tabForRoute(parentId) === tab ? parentId : tab || "TOD-01";
    const target = tab ? fallback : state.navigationHistory.pop() || fallback;
    go(target, false);
  }
  function switchTab(tab) {
    capturePageView();
    const currentTab = tabForRoute(state.current);
    if (tab === currentTab) state.tabStacks[tab] = [tab];
    const target = state.tabStacks[tab]?.at(-1) || tab;
    go(target);
  }
  function flash(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(flash.timer);
    flash.timer = setTimeout(() => toast.classList.remove("show"), 1700);
  }
  function copyText(text, successMessage) {
    if (!navigator.clipboard?.writeText) return showInfoModal("复制未完成", "当前浏览器没有开放剪贴板权限。请长按内容后手动复制。", "知道了");
    navigator.clipboard.writeText(text).then(() => flash(successMessage)).catch(() => showInfoModal("复制未完成", "请允许剪贴板权限后重试。", "知道了"));
  }
  function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }
  function shareContent() {
    const ready = isHardwareActive() && state.dataLifecycle === "interpretable";
    const data = currentDataLifecycle();
    const weather = currentBodyWeather();
    return { title: ready ? weather.label : data.label, description: ready ? weather.shareLine : data.summary, background: state.shareBackground, photo: state.sharePhotoUrl, zoom: state.shareZoom };
  }
  function loadShareImage(src) {
    return new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = src; });
  }
  async function buildShareCanvas(content = shareContent()) {
    const canvas = document.createElement("canvas"); canvas.width = 1080; canvas.height = 1350;
    const ctx = canvas.getContext("2d");
    const dark = content.background === "night" || (content.background === "photo" && content.photo);
    ctx.fillStyle = dark ? "#101915" : "#eee9df"; ctx.fillRect(0, 0, 1080, 1350);
    const scale = Math.max(.8, Math.min(1.25, Number(content.zoom) / 100 || 1));
    ctx.save(); ctx.translate(540, 675); ctx.scale(scale, scale); ctx.translate(-540, -675);
    if (content.background === "photo" && content.photo) {
      const photo = await loadShareImage(content.photo);
      const ratio = Math.max(1080 / photo.width, 1350 / photo.height);
      ctx.drawImage(photo, (1080-photo.width*ratio)/2, (1350-photo.height*ratio)/2, photo.width*ratio, photo.height*ratio);
      ctx.fillStyle = "rgba(12,23,17,.55)"; ctx.fillRect(0,0,1080,1350);
    }
    if (window.HALO_SHARE_SYMBOL_DATA) { const symbol = await loadShareImage(window.HALO_SHARE_SYMBOL_DATA); ctx.drawImage(symbol,460,175,160,160); }
    ctx.fillStyle = dark ? "#f6f2e9" : "#343a32"; ctx.textAlign = "center";
    ctx.font = "28px sans-serif"; ctx.fillText("HALO BODY WEATHER",540,425);
    ctx.font = "bold 96px sans-serif"; ctx.fillText(content.title,540,650,920);
    ctx.font = "40px sans-serif";
    const lines = []; let line = "";
    for (const char of content.description) { if (ctx.measureText(line + char).width > 820) { lines.push(line); line = char; } else line += char; }
    if (line) lines.push(line);
    lines.slice(0,4).forEach((text,index) => ctx.fillText(text,540,755+index*62));
    ctx.font = "26px sans-serif"; ctx.fillText("HALORING · 每日身体状态参考",540,1190);
    ctx.restore(); return canvas;
  }
  async function paintShareCards(root = screen) {
    const targets = [...root.querySelectorAll("canvas[data-share-canvas]")];
    if (!targets.length) return;
    try {
      const canvas = await buildShareCanvas();
      for (const target of targets) { if (!target.isConnected) continue; target.width=canvas.width; target.height=canvas.height; target.getContext("2d").drawImage(canvas,0,0); target.dataset.ready="true"; }
    } catch { for (const target of targets) target.setAttribute("aria-label","图片未载入，请重新选择背景"); }
  }
  async function saveShareImage() {
    try { const canvas = await buildShareCanvas(); canvas.toBlob(blob => { if (blob) { downloadBlob("HALORING-Body-Weather.png",blob); flash("已发起分享卡图片下载"); } }, "image/png"); }
    catch { showInfoModal("图片暂时无法生成","请重新选择相册图片，或改用雾白背景后重试。"); }
  }
  function showModal(title, message, confirmLabel, action) {
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal"><h2>${esc(title)}</h2><p>${esc(message)}</p><div class="button-row"><button class="danger-button" data-action="${esc(action)}">${esc(confirmLabel)}</button><button class="secondary" data-action="close-modal">取消</button></div></section></div>`;
  }
  function showInfoModal(title, message, confirmLabel = "知道了", action = "close-modal") {
    const closeButton = action === "close-modal" ? "" : '<button class="text-button" data-action="close-modal">关闭</button>';
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal"><h2>${esc(title)}</h2><p>${esc(message)}</p><div class="button-row"><button class="primary" data-action="${esc(action)}">${esc(confirmLabel)}</button>${closeButton}</div></section></div>`;
  }
  function showOutfitInspirationModal() {
    const tierCards = DAILY_INSPIRATION.outfits.map((outfit) => `<article class="outfit-tier"><div class="outfit-tier-head"><span>${esc(outfit.level)}</span><div class="outfit-swatches" aria-label="${esc(outfit.colors)}">${outfit.swatches.map((color) => `<i style="--outfit-swatch:${esc(color)}" aria-hidden="true"></i>`).join("")}</div></div><strong>${esc(outfit.colors)}</strong><p>${esc(outfit.meaning)}</p></article>`).join("");
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal outfit-modal" role="dialog" aria-modal="true" aria-labelledby="outfit-title"><div class="modal-title-row"><div><span class="modal-eyebrow">五行穿衣 · 文化灵感</span><h2 id="outfit-title">今天的旺运穿衣</h2></div><button class="text-button" data-action="close-modal">关闭</button></div><p>想借颜色给今天换个心情，可以从下面三组里选一组。</p><div class="outfit-tier-list">${tierCards}</div><p class="inspiration-modal-note">这是文化寓意，不预测贵人、合作或收益结果，也不读取健康数据。穿你已有、舒服并适合场合的衣服就好。</p>${buttons([["和 Halo 聊穿搭", "outfit-inspiration-chat", "primary"], ["返回今日", "close-modal", "secondary"]])}</section></div>`;
  }
  function showAiCorrectionModal() {
    trackPrototypeEvent("ai_interpretation_correction_started", { source_page: state.current });
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal correction-modal" role="dialog" aria-modal="true" aria-labelledby="correction-title"><div class="modal-title-row"><div><span class="modal-eyebrow">你的感受更重要</span><h2 id="correction-title">哪里和你不太一样？</h2></div><button class="text-button" data-action="close-modal">关闭</button></div><p>这不会改动戒指记录，只会纠正 Halo 对今天的解释。</p><div class="correction-options">${Object.entries(AI_CORRECTION_REASONS).map(([value, label]) => `<button class="choice-row" data-action="ai-correction-select:${value}"><span><strong>${esc(label)}</strong></span><i aria-hidden="true"></i></button>`).join("")}</div></section></div>`;
  }
  function showAiCorrectionConfirm(reason) {
    const label = AI_CORRECTION_REASONS[reason] || AI_CORRECTION_REASONS.other;
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal correction-modal" role="dialog" aria-modal="true" aria-labelledby="correction-confirm-title"><div class="modal-title-row"><div><span class="modal-eyebrow">确认纠正</span><h2 id="correction-confirm-title">${esc(label)}</h2></div><button class="text-button" data-action="close-modal">关闭</button></div>${notice("戒指数据保持原样", "Halo 会把你的反馈作为用户纠正单独保存，不再把原来的解释当作你的实际感受。", "sage")}<label class="field-label">想补充的话（选填）<textarea id="ai-correction-note" class="field" placeholder="例如：今天精神还可以，只是身体有点酸。">${esc(state.aiCorrection.note || "")}</textarea></label>${buttons([["保存这次纠正", `ai-correction-save:${reason}:current`, "primary"], ["保存并检查 Halo 记忆", `ai-correction-save:${reason}:memory`, "secondary"], ["返回重选", "ai-correction:open", "text-button"]])}</section></div>`;
  }
  function showJourneyDeferModal() {
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal journey-decision-modal" role="dialog" aria-modal="true" aria-labelledby="journey-defer-title"><div class="modal-title-row"><div><span class="modal-eyebrow">今天先不做也可以</span><h2 id="journey-defer-title">这一步卡在哪里？</h2></div><button class="text-button" data-action="close-modal">关闭</button></div><p>只用来帮你调整下一步，不评价是否坚持。</p><div class="correction-options">${[["time","今天没时间"],["hard","这一步还是太难"],["timing","现在不是合适的时候"],["mood","今天不想做"]].map(([value, label]) => `<button class="choice-row" data-action="journey-defer:${value}"><span><strong>${label}</strong></span><i aria-hidden="true"></i></button>`).join("")}</div></section></div>`;
  }
  function showExportModal() {
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal export-modal" data-export-step="choose"><div class="modal-title-row"><div><span class="modal-eyebrow">DATA EXPORT</span><h2>导出当前原型记录</h2></div><button class="text-button" data-action="close-modal">关闭</button></div><p>下载在当前浏览器保存的用户记录和测量演示记录，不包含真实设备健康档案。</p>${notice("文件未加密", "请只在你信任的设备上下载。文件保存后由你管理，App 无法远程撤回。", "warm")}${buttons([["查看本地导出范围", "export:local", "primary"]])}${notice("其他导出方式暂未开放", "身份验证、受保护文件和限时安全链接尚未接入，当前不会生成外部链接。")}</section></div>`;
  }
  function showExportResult(kind, revoked = false) {
    if (kind !== "local") return showInfoModal("安全链接暂未开放", "当前原型没有连接身份验证或安全导出服务，不会创建、复制或撤销虚拟链接。", "返回导出", "export:open");
    const payload = accountExportPayload();
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal export-modal" data-export-step="local"><div class="modal-title-row"><h2>下载前确认</h2><button class="text-button" data-action="close-modal">关闭</button></div>${rows([["文件格式", "JSON · 明文未加密"], ["用户记录", `${payload.user_records.length} 条 · 保留正文与记录时间`], ["主动测量", `${payload.measurement_records.length} 条 · 原型演示`], ["真实设备健康记录", "未接入，不包含"], ["保存后撤回", "不支持，请自行妥善保管"]])}${buttons([["确认下载明文文件", "export-download", "primary"], ["返回", "export:open", "secondary"]])}</section></div>`;
  }
  function accountExportPayload() {
    const records = [
      ...(Array.isArray(state.subjectiveRecords) ? state.subjectiveRecords : []),
      ...(Array.isArray(state.haloFeelingRecords) ? state.haloFeelingRecords : []),
      ...Object.entries(state.studioRecords || {}).filter(([, record]) => record.beforeFeeling && record.deletionStatus !== "deleted").map(([eventId, record]) => ({ id: `studio-user-${eventId}`, eventId, original: record.beforeFeeling, occurredAt: record.beforeSavedAt || null, source: "user-record", category: "studio" })),
    ];
    return { exported_at: new Date().toISOString(), prototype_only: true, encrypted: false, user_records: records, legacy_user_tags: records.length ? [] : state.subjectiveMarkers, measurement_records: state.lastMeasurement ? [state.lastMeasurement] : [], scope_note: "仅当前浏览器原型记录。未接入设备真实健康档案，不包含云端数据。" };
  }
  function showWidgetPreview() {
    const connection = isHardwareActive() ? DEVICE_STATUS[state.deviceStatus] || DEVICE_STATUS.connected : DEVICE_STATUS.disconnected;
    const connectionLabel = state.deviceStatus === "low" ? "低电量" : connection.label;
    const weather = currentBodyWeather();
    const canInterpretWeather = isHardwareActive() && state.dataLifecycle === "interpretable";
    const dataState = currentDataLifecycle();
    const bodyWeather = canInterpretWeather ? weather.label : isHardwareActive() ? dataState.label : "尚未生成";
    const tonight = canInterpretWeather ? `今晚建议：${weather.nightTitle.replace("今晚", "")}` : isHardwareActive() ? "今晚建议：按平时时间准备睡觉" : "今晚可选：手动选择基础内容";
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal widget-modal"><div class="modal-title-row"><div><span class="modal-eyebrow">DESKTOP WIDGET</span><h2>桌面小组件预览</h2></div><button class="text-button" data-action="close-modal">关闭</button></div><section class="widget-preview"><div class="widget-heading"><img src="${HALO_SYMBOL}" alt=""><span>BODY WEATHER</span></div><strong>${esc(bodyWeather)}</strong><div class="widget-status"><i class="${esc(state.deviceStatus)}"></i><span>戒指${esc(connectionLabel)}</span></div><p>${esc(tonight)}</p></section>${notice("隐私边界", "小组件只显示 Body Weather、戒指连接状态和今晚建议，不显示心率、HRV、血氧、温度或其他敏感健康数值。", "sage")}${buttons([["添加到桌面", "widget-add", "primary"], ["暂不添加", "close-modal", "secondary"]])}</section></div>`;
  }
  function showWidgetAdded() {
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal widget-modal"><div class="modal-title-row"><div><span class="modal-eyebrow">DESKTOP WIDGET</span><h2>小组件已准备好</h2></div><button class="text-button" data-action="close-modal">关闭</button></div><section class="widget-added-state"><span aria-hidden="true">✓</span><strong>请在系统面板中完成添加</strong><p>接下来可以选择小组件尺寸和桌面位置。</p></section>${notice("保护屏幕隐私", "添加后只显示 Body Weather、戒指连接状态和今晚建议。", "sage")}${buttons([["完成", "close-modal", "primary"], ["返回预览", "widget-preview", "secondary"]])}</section></div>`;
  }
  function showRecordDetail(label) {
    const record = state.subjectiveRecords.find(item => item.id === label || item.label === label);
    if (!record) return showInfoModal("记录不存在", "这条记录可能已被删除。返回后可以查看其他记录。");
    showInfoModal(`${record.label} · 用户记录`, `${record.occurredAt ? recordDateTime(record.occurredAt) : "原记录未保存日期"}\n${record.original || "仅选择了标签，没有补充原话。"}\n\n这条记录不会改写设备数据，也不代表因果。`);
  }
  function showMembershipRules() {
    const active = isHardwareActive();
    trackPrototypeEvent("membership_rules_viewed", { entry_point: "MY-01" });
    const levels = [
      ["L1", "Halo Member"], ["L2", "Halo Premier"], ["L3", "Halo Signature"],
      ["L4", "Halo Prestige"], ["L5", "Halo Muse"], ["L6", "Halo Luminary"],
    ];
    const growthStatus = active ? "未来成长正在记录" : state.membershipHardwareState === "unbound-retained" ? "已有成长已保留，当前暂停" : "激活 Halo Ring 后开始记录";
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal membership-rules-modal"><div class="modal-title-row"><div><span class="modal-eyebrow">MEMBERSHIP</span><h2>会员说明</h2></div><button class="text-button" data-action="close-modal">关闭</button></div><section class="membership-tier-list">${levels.map(([level, name]) => `<div class="membership-tier-row"><span>${level}</span><strong>${name}</strong></div>`).join("")}</section>${rows([["当前状态", membershipCopy().title], ["成长记录", growthStatus], ["核心健康功能", "不因会员等级受限"], ["Halo Points", "可抵扣或兑换，不可充值、提现或折现"]])}${notice("健康功能的可用条件", "会员等级不会限制核心健康功能；具体功能仍需要支持的 Halo Ring、相应授权和有效数据。", "sage")}${notice("规则发生变化时", "会至少提前 30 天公示。正常获得的等级与资产不会因规则变化被追溯减少；退款、重复奖励或错误记录的更正除外。")}${buttons([["进入会员中心", "go:MEM-01", "primary"], ["查看 Halo Points", "go:PTS-01", "secondary"]])}</section></div>`;
  }
  function showCommerceBoundary() {
    trackPrototypeEvent("commerce_entry_viewed", { channel_status: "pending-confirmation" });
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal membership-rules-modal commerce-boundary-modal"><div class="modal-title-row"><div><span class="modal-eyebrow">HALO SERVICES</span><h2>商城、推荐与体验顾问</h2></div><button class="text-button" data-action="close-modal">关闭</button></div>${rows([["Halo Select", "浏览精选商品、订单与售后"], ["会员推荐", "邀请朋友并查看奖励进度"], ["体验顾问", "先提交申请；身份生效后才能查看服务订单、收益和经营工具"]])}${notice("一个订单只记录一种来源", "订单来源由系统根据有效进入路径和已确认关系判定，用户不需要选择；会员推荐奖励与体验顾问服务收益不会同时产生。", "sage")}${notice("授权彼此独立", "参加活动、接收消息和系统判定的订单来源不会互相自动推导。")} ${buttons([["进入 Halo Select", "go:SEL-01", "primary"], ["会员推荐", "go:REF-01", "secondary"], ["查看体验顾问申请与经营", "go:CHN-01", "secondary"]])}</section></div>`;
  }
  function showAccountDeletionConfirm() {
    trackPrototypeEvent("account_deletion_started", { entry_point: "ACC-03" });
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal account-deletion-modal"><span class="modal-eyebrow">FINAL CONFIRMATION</span><h2>确认提交账号注销？</h2><p>能立即完成的部分会马上处理；需要人工核对时，最长不超过 15 个工作日。再次注册将从 L1 开始，原会员资产不会恢复。</p>${buttons([["确认提交注销", "account-deletion-confirm", "danger-button"], ["返回检查资产", "close-modal", "secondary"]])}</section></div>`;
  }
  function currentMemberAssetSnapshot() {
    return window.HALO_COMMERCIAL_EXTENSION?.getMemberSnapshot({
      hardwareActive: isHardwareActive(),
      membershipState: state.membershipHardwareState,
      newMember: Boolean(state.newMember),
      memberCreatedAt: state.memberCreatedAt || "",
      hardwareActivatedAt: state.hardwareActivatedAt || "",
    }) || {
      level: isHardwareActive() ? "Halo Premier（L2）" : "Halo Member（L1）",
      growth: isHardwareActive() ? 1860 : 0,
      badges: isHardwareActive() ? 1 : 0,
      points: 18800,
      coupons: 2,
      unusedBenefits: 1,
    };
  }
  function accountDeletionPage(item) {
    if (state.accountDeletionStatus === "submitted") {
      return `${head(item, "DELETE ACCOUNT")}<div class="stack"><section class="deletion-result"><span>REQUEST RECEIVED</span><h2>注销申请已受理</h2><p>可以立即完成的部分已经开始处理；需要人工核对时，最长不超过 15 个工作日。</p></section>${rows([["申请状态", "处理中"], ["会员等级与资产", "已停止使用，不可提现或转让"], ["订单、退款与售后", "仍会继续处理"], ["健康及会员数据", "删除或匿名化"], ["必须保留的交易记录", "只用于履约与合规"], ["再次注册", "从 Halo Member（L1）开始"]])}${notice("同时拥有体验顾问身份？", "会员账号注销不会自动结束体验顾问合作。请通过下方客服入口处理合同、历史结算和待办事项，无需重新进入经营中心。")}${buttons([["联系客服查看进度", "go:HELP-03", "primary"], ["处理体验顾问合作", "account-channel-support", "secondary"], ["返回账号与安全", "go:ACC-02", "secondary"]])}</div>`;
    }
    const snapshot = currentMemberAssetSnapshot();
    return `${head(item, "DELETE ACCOUNT")}<div class="stack">${notice("注销前请确认将失效的资产", "未完成的订单、退款、售后或申诉不会阻止你提交注销；提交后这些事项仍会继续处理。", "danger")}<section class="asset-snapshot"><span>ASSET SNAPSHOT</span><h2>注销资产快照</h2>${rows([["会员等级", snapshot.level], ["HALO成长值", snapshot.growth.toLocaleString()], ["徽章", `${snapshot.badges} 枚`], ["Halo Points", snapshot.points.toLocaleString()], ["优惠券", `${snapshot.coupons} 张`], ["未使用权益", snapshot.unusedBenefits ? `${snapshot.unusedBenefits} 项 Studio 体验权益` : "无"]])}</section>${notice("注销后会怎样", "以上资产将失效，不可提现或转让。健康及会员数据会删除或匿名化；法律要求保留的记录只用于履约与合规。再次注册将从 Halo Member（L1）开始。")}${buttons([["提交注销申请", "account-deletion-submit", "danger-button"], ["取消", "go:ACC-02", "secondary"]])}</div>`;
  }
  function showSupportHandoff() {
    trackPrototypeEvent("customer_service_handoff_started", { channel: "enterprise-wechat", ticket_transport: "reference-only" });
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal service-ticket-modal"><div class="modal-title-row"><div><span class="modal-eyebrow">CUSTOMER CARE</span><h2>准备联系企业微信客服</h2></div><button class="text-button" data-action="close-modal">关闭</button></div>${rows([["客服渠道", "企业微信"], ["可协助处理", "会员、订单、设备、权益与售后问题"], ["不会随跳转发送", "健康数据、Halo 对话和其他敏感信息"]])}${notice("联系后仍由你决定提供什么", "客服只会在处理问题所需的范围内向你询问信息。", "sage")}${buttons([["查看企业微信联系指引", "support-instructions", "primary"], ["取消", "close-modal", "secondary"]])}</section></div>`;
  }
  let modalReturnFocus = null;
  function closeModal() {
    modalRoot.innerHTML = "";
    screen.inert = false;
    tabbar.inert = false;
    if (modalReturnFocus?.isConnected) modalReturnFocus.focus({ preventScroll: true });
    modalReturnFocus = null;
  }
  function haloStatus(status = state.deviceStatus, size = "compact", action = "status-detail") {
    const meta = DEVICE_STATUS[status] || DEVICE_STATUS.connected;
    const resolvedAction = action === "status-detail" ? `status-detail:${status}` : action;
    return `<button class="halo-status ${esc(status)} ${esc(size)}" data-action="${esc(resolvedAction)}" aria-label="戒指${esc(meta.label)}"><span class="halo-symbol-wrap"><span class="halo-state-track" aria-hidden="true"></span><img src="${HALO_SYMBOL}" alt=""><i class="halo-state-dot" aria-hidden="true"></i></span><span class="halo-status-copy"><strong>${esc(meta.label)}</strong>${size === "hero" ? `<small>${esc(meta.detail)}</small>` : ""}</span></button>`;
  }
  function head(item, eyebrow, action) {
    const roots = ["TOD-01", "NIG-01", "HAL-01", "RHY-01", "MY-01", "SYS-01", "ONB-01", "STU-08"];
    const back = roots.includes(item.id) ? "" : `<button class="back" data-action="previous">← 返回</button>`;
    const deviceRoots = ["TOD-01", "NIG-01", "HAL-01", "RHY-01", "MY-01"];
    const deviceAction = deviceRoots.includes(item.id) ? haloStatus(state.deviceStatus, "compact") : "";
    const actionLabels = { "NIG-10": "查看最近夜间记录", "HAL-02": "查看最近会话", "HAL-08": "打开 Halo 会话设置", "RHY-04": "打开节律设置" };
    const headAction = Object.entries(actionLabels).reduce((html, [route, label]) => html.replace(`data-action="go:${route}"`, `data-action="go:${route}" aria-label="${label}"`), action || "");
    const visibleName = item.id === "HAL-01" ? "Halo" : item.name;
    return `<header class="screen-head"><div>${back}<span class="eyebrow">${esc(eyebrow || item.group)}</span><h1>${esc(visibleName)}</h1></div><div class="head-actions">${deviceAction}${headAction}</div></header>`;
  }
  function card(title, body, meta, action) {
    const tag = action ? "button" : "section";
    return `<${tag} class="card${action ? " card-button" : ""}"${action ? ` data-action="${esc(action)}"` : ""}><div class="card-top"><span>${esc(meta || "HALO")}</span>${action ? "<strong>›</strong>" : ""}</div><h3>${esc(title)}</h3>${body ? `<p>${esc(body)}</p>` : ""}</${tag}>`;
  }
  function notice(title, body, tone) { return `<section class="notice ${tone || ""}"><strong>${esc(title)}</strong><p>${esc(body)}</p></section>`; }
  function domainIcon(kind) {
    const paths = {
      sleep: '<path d="M15.5 3.8a6.8 6.8 0 1 0 4.7 11.7A7.6 7.6 0 0 1 15.5 3.8Z"/>',
      energy: '<path d="M3 13h4l2.2-5.4 3.2 9 2.1-5H21"/>',
      activity: '<path d="M4 18 10 12l3 3 7-8"/><path d="M15 7h5v5"/>',
      heart: '<path d="M12 20s-7-4.2-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.8-7 10-7 10Z"/>',
      breath: '<path d="M3 8h11c3 0 3-4 .5-4-1.5 0-2.3 1-2.5 2"/><path d="M3 12h16c3 0 3 4 .5 4-1.5 0-2.3-1-2.5-2"/>',
      oxygen: '<circle cx="12" cy="12" r="7"/><path d="M9 12h6M12 9v6"/>',
      temperature: '<path d="M10 5a2 2 0 0 1 4 0v8.2a4 4 0 1 1-4 0Z"/><path d="M12 8v7"/>',
      reward: '<path d="m12 3 2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2Z"/>',
      time: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
      status: '<circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="8" opacity=".35"/>',
    };
    return `<svg class="domain-icon" viewBox="0 0 24 24" aria-hidden="true">${paths[kind] || paths.status}</svg>`;
  }
  function visualMeta(label = "") {
    const text = String(label);
    const kind = /睡眠|夜晚|夜间/.test(text) ? "sleep"
      : /能量|HRV|恢复/.test(text) ? "energy"
      : /活动|步数|热量|佩戴/.test(text) ? "activity"
      : /心率/.test(text) ? "heart"
      : /呼吸/.test(text) ? "breath"
      : /血氧|覆盖|质量/.test(text) ? "oxygen"
      : /温度/.test(text) ? "temperature"
      : /Points|积分|成长|奖励/.test(text) ? "reward"
      : /时间|日期|到期/.test(text) ? "time"
      : "status";
    return [kind, domainIcon(kind)];
  }
  function miniSparkline(values = [42, 54, 48, 64, 58, 72, 68], tone = "sage", label = "近期趋势") {
    const safe = values.map((value) => Number(value) || 0);
    const min = Math.min(...safe);
    const max = Math.max(...safe);
    const range = Math.max(1, max - min);
    const points = safe.map((value, index) => `${(index / Math.max(1, safe.length - 1)) * 100},${30 - ((value - min) / range) * 24}`).join(" ");
    return `<svg class="mini-sparkline ${esc(tone)}" viewBox="0 0 100 34" role="img" aria-label="${esc(label)}"><path d="M0 30H100"/><polyline points="${points}"/><circle cx="100" cy="${30 - ((safe.at(-1) - min) / range) * 24}" r="2.4"/></svg>`;
  }
  function metrics(items) { return `<div class="${items.length === 3 ? "three-column" : "two-column"}">${items.map(([label, value, sub]) => { const [kind, glyph] = visualMeta(label); return `<section class="metric-card visual-metric" data-kind="${kind}"><div class="metric-label"><i aria-hidden="true">${glyph}</i><small>${esc(label)}</small></div><b>${esc(value)}</b><span>${esc(sub || "")}</span></section>`; }).join("")}</div>`; }
  function rows(items) { return `<section class="card">${items.map(([label, value]) => `<div class="status-row"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join("")}</section>`; }
  function radialProgress(value, valueLabel, title, note = "") {
    const safe = Math.max(0, Math.min(100, Number(value) || 0));
    return `<section class="radial-progress-card"><div class="radial-progress" style="--radial-progress:${safe}%"><span><strong>${esc(valueLabel)}</strong><small>${safe}%</small></span></div><div><span>${esc(title)}</span>${note ? `<p>${esc(note)}</p>` : ""}</div></section>`;
  }
  function baselineBand(title, value, position, left = "比平时低", right = "比平时高") {
    const safe = Math.max(4, Math.min(96, Number(position) || 50));
    return `<section class="baseline-band"><div><span>${esc(title)}</span><strong>${esc(value)}</strong></div><div class="baseline-track" role="img" aria-label="${esc(`${title}：${value}`)}"><i style="left:${safe}%"></i></div><footer><span>${esc(left)}</span><b>个人常见范围</b><span>${esc(right)}</span></footer></section>`;
  }
  function visualSignalCards(signals, empty = false) {
    const routes = ["TOD-05", "TOD-06", "TOD-07"];
    return `<div class="three-column visual-signals">${signals.map(([label, value], index) => { const [kind, glyph] = visualMeta(label); const levels = empty ? [18,18,18,18] : [[40,58,46,64],[54,68,62,76],[34,52,48,58]][index]; return `<button class="signal-card" data-kind="${kind}" data-action="go:${routes[index]}"><span class="signal-head"><i aria-hidden="true">${glyph}</i><em>${esc(label)}</em></span><strong>${esc(value)}</strong><span class="micro-bars" aria-hidden="true">${levels.map((height, barIndex) => `<i class="${barIndex === levels.length - 1 ? "active" : ""}" style="height:${height}%"></i>`).join("")}</span></button>`; }).join("")}</div>`;
  }
  function weatherDistribution(items) {
    const total = Math.max(1, items.reduce((sum, item) => sum + item[1], 0));
    return `<section class="weather-distribution"><div class="weather-distribution-bar" role="img" aria-label="身体天气分布">${items.map(([label, value, tone]) => `<i class="${esc(tone)}" style="flex:${value}" title="${esc(`${label} ${value} 天`)}"></i>`).join("")}</div><div class="weather-distribution-legend">${items.map(([label, value, tone]) => `<span><i class="${esc(tone)}"></i><b>${esc(label)}</b><small>${value} 天 · ${Math.round(value / total * 100)}%</small></span>`).join("")}</div></section>`;
  }
  function activityMix(items) {
    const total = Math.max(1, items.reduce((sum, item) => sum + item[1], 0));
    return `<section class="activity-mix"><div class="activity-mix-head"><span>今日活动强度</span><strong>${total} 分钟</strong></div><div class="activity-mix-bar" role="img" aria-label="今日活动强度分布">${items.map(([label, value, tone]) => `<i class="${esc(tone)}" style="flex:${value}" title="${esc(`${label} ${value} 分钟`)}"></i>`).join("")}</div><div class="activity-mix-legend">${items.map(([label, value, tone]) => `<span><i class="${esc(tone)}"></i>${esc(label)} <b>${value}m</b></span>`).join("")}</div></section>`;
  }
  function hrvExplainer() {
    return `<details class="visual-disclosure hrv-disclosure"><summary><span class="record-glyph" aria-hidden="true">i</span><div><strong>42 ms 代表什么</strong><small>先看它和你平时相比</small></div><i aria-hidden="true">＋</i></summary><div class="visual-disclosure-body"><section class="hrv-meaning-card"><span>昨晚 · 42 ms</span><strong>接近你的平时</strong><p>昨晚心跳间隔的变化没有明显偏离近期。只看这一项，不需要改变今天的安排。</p><div class="hrv-meaning-scale" role="img" aria-label="昨晚 HRV 估算接近个人常见范围"><small>比平时低</small><b><i style="left:54%"></i></b><small>比平时高</small></div></section><p class="hrv-plain-definition">在同一个人、同一种测量条件下，数值较大，表示相邻心跳间隔的变化更大；数值较小，表示心跳节奏更均匀。</p><div class="hrv-direction-grid"><article class="higher"><span>高于平时</span><strong>身体可能恢复得不错</strong><p>这常和睡得比较好、压力较小或运动后恢复充分一起出现。</p></article><article class="lower"><span>低于平时</span><strong>身体可能还在恢复</strong><p>没睡够、压力大、饮酒、身体不舒服或前一天运动较重时，都可能偏低。</p></article></div><section class="hrv-medicine-card"><span class="record-glyph" aria-hidden="true">i</span><div><small>一点医学知识</small><strong>它和自主神经有关</strong></div><p>自主神经会自动调节心跳。休息时，迷走神经等副交感调节通常会让心跳间隔出现更多细微变化；紧张、活动或身体负担增加时，这种变化可能减少。</p></section>${notice("不是越高越好", "HRV 的个体差异很大。突然大幅偏高或偏低，也可能和呼吸节奏、记录质量或心律变化有关。连续几晚的方向，比单次数字更有参考价值。")}${notice("身体能量不只看 HRV", "Halo 还会结合静息心率、睡眠连续性和近期活动。HRV 接近平时，不代表昨晚一定睡得好。") }<p class="health-boundary compact">HRV 不能单独判断压力、恢复或疾病。如果同时有持续心慌、胸闷、晕厥或明显不适，请及时寻求专业帮助。</p></div></details>`;
  }
  function waveform(active = true) { return `<div class="audio-wave ${active ? "active" : "paused"}" aria-hidden="true">${[32,52,76,44,68,88,58,38,72,48,64,34].map((height, index) => `<i style="height:${height}%;--delay:${index * 45}ms"></i>`).join("")}</div>`; }
  function buttons(items) { return `<div class="button-row">${items.map(([label, action, kind = "secondary", disabled = false]) => `<button class="${kind}" data-action="${esc(action)}" ${disabled ? "disabled" : ""}>${esc(label)}</button>`).join("")}</div>`; }
  function setting(title, detail, action, value) { const [kind, glyph] = visualMeta(title); return `<button class="setting-row visual-setting" data-kind="${kind}" data-action="${esc(action)}"><span class="setting-glyph" aria-hidden="true">${glyph}</span><div><strong>${esc(title)}</strong><span>${esc(detail || "")}</span></div><i>${esc(value || "›")}</i></button>`; }
  function toggle(key, title, detail) { return `<section class="setting-row"><div><strong>${esc(title)}</strong><span>${esc(detail || "")}</span></div><button class="switch ${state.toggles[key] ? "on" : ""}" data-action="toggle:${esc(key)}" aria-label="切换${esc(title)}"></button></section>`; }
  function choice(key, value, title, body) { return `<button class="choice-row ${state[key] === value ? "selected" : ""}" data-action="choose:${esc(key)}:${esc(value)}"><span><strong>${esc(title)}</strong><p>${esc(body)}</p></span><i></i></button>`; }
  function quality(source = "Halo Ring", qualityText = "数据可用", updated = "08:42 更新") {
    if (/^(TOD|HLT)-/.test(state.current) && !["HLT-03", "HLT-04"].includes(state.current) && state.dataLifecycle !== "interpretable") {
      qualityText = currentDataLifecycle().label;
      updated = state.dataLifecycle === "none" ? "等待首次同步" : "查看同步进度";
    }
    return `<button class="quality-strip" data-action="info:data-quality" aria-label="查看数据来源、完整程度和更新时间"><div><span>来自</span><strong>${esc(source)}</strong></div><div><span>记录</span><strong>${esc(qualityText)}</strong></div><div><span>更新</span><strong>${esc(updated)}</strong></div></button>`;
  }
  function lifecycle(stage = state.dataLifecycle, title = "当前数据状态", override = {}) {
    const data = { ...currentDataLifecycle(stage), ...override };
    const stages = Object.entries(DATA_LIFECYCLE);
    return `<section class="lifecycle-card compact-lifecycle"><div class="lifecycle-heading"><span class="data-symbol ${esc(stage)}" aria-hidden="true"><img src="${HALO_SYMBOL}" alt=""></span><div><strong>${esc(title)}</strong><small>${esc(data.label)}</small></div></div><div class="lifecycle-track">${stages.map(([key, value]) => `<span class="lifecycle-step ${stage === key ? "active" : ""}" title="${esc(value.label)}"><i></i><span>${esc(value.label)}</span></span>`).join("")}</div><dl><div><dt>原因</dt><dd>${esc(data.reason)}</dd></div><div><dt>还需</dt><dd>${esc(data.needed)}</dd></div><div><dt>现在</dt><dd>${esc(data.next)}</dd></div></dl></section>`;
  }
  function isHardwareActive() { return state.membershipHardwareState === "active"; }
  function setMembershipState(value) {
    if (!MEMBERSHIP_STATES.includes(value)) return;
    const previous = state.membershipHardwareState;
    state.membershipHardwareState = value;
    localStorage.setItem(MEMBERSHIP_STATE_KEY, value);
    if (value !== "active") {
      state.deviceStatus = "disconnected";
      state.toggles.haloBody = false;
      state.haloContext = "none";
      state.studioMode = "basic";
      state.toggles.studioHealth = false;
    } else if (state.deviceStatus === "disconnected") {
      state.deviceStatus = "connected";
      state.toggles.haloBody = true;
      state.haloContext = "body";
    }
    if (value === "active" && previous === "never-bound") state.dataLifecycle = "none";
    if (value !== "active" && state.toggles.haloBody) state.toggles.haloBody = false;
    persistAppProgress();
  }
  function membershipCopy() {
    return {
      "never-bound": {
        label: "Halo Member · L1",
        title: "激活 Halo Ring 后开启成长",
        body: "会员身份、Halo Points、商城入口、订单、推荐、Studio、公开内容、手动记录和客服可用；当前不累计 HALO成长值、徽章或晋升进度。",
        device: "尚未绑定设备",
        action: "开始绑定",
      },
      active: {
        label: "硬件增强模式",
        title: "成长累计中",
        body: "戒指临时断开不用担心；7 天内重新同步，佩戴进度仍会补记到当天。",
        device: "已连接 · 电量 76%",
        action: "查看设备",
      },
      "unbound-retained": {
        label: "会员资产已保留",
        title: "硬件已解绑，成长已暂停",
        body: "已获等级、HALO成长值、徽章、Halo Points 和历史权益继续保留；重新激活后只恢复未来累计，暂停期间不补发。",
        device: "已解绑 · 可重新激活",
        action: "重新绑定",
      },
    }[state.membershipHardwareState];
  }
  function membershipPanel() {
    const copy = membershipCopy();
    return `<section class="membership-panel ${esc(state.membershipHardwareState)}"><span>${esc(copy.label)}</span><h2>${esc(copy.title)}</h2><p>${esc(copy.body)}</p>${state.membershipHardwareState === "active" ? "" : `<button class="text-button" data-action="go:DEV-01">${esc(copy.action)} ›</button>`}</section>`;
  }
  function subjectiveMarkers() {
    return `<div class="subjective-markers">${SUBJECTIVE_OPTIONS.map(label => `<button class="${state.recordDraft.labels.includes(label) ? "active" : ""}" data-action="marker:${esc(label)}" aria-pressed="${state.recordDraft.labels.includes(label)}">${esc(label)}</button>`).join("")}</div><label class="field-label">想补充的话（选填）<textarea id="record-note" class="field" maxlength="500" placeholder="用自己的话记下此刻的感受">${esc(state.recordDraft.note)}</textarea></label><p class="caption">当前为草稿。点击保存才会加入“用户记录”，不会改动设备数据。</p>${state.current !== "TOD-02" ? buttons([["保存这条记录", "record-save-inline", "secondary"]]) : ""}`;
  }
  function trendRecordNodes(days) {
    if (!state.toggles.trendRecords) return "";
    const today = Date.parse(beijingDateKey() + "T12:00:00+08:00");
    const records = state.subjectiveRecords.filter(record => record.occurredAt).map(record => ({...record, daysAgo: Math.floor((today - Date.parse(beijingDateKey(new Date(record.occurredAt)) + "T12:00:00+08:00")) / 86400000)})).filter(record => record.daysAgo >= 0 && record.daysAgo < days);
    if (!records.length) return `<div class="trend-record-empty">这段时间还没有用户记录</div>`;
    return `<div class="trend-record-overlay" aria-label="趋势中的用户记录">${records.map(record => {
      const position = Math.max(4, Math.min(96, ((days - record.daysAgo) / days) * 100));
      return `<button class="trend-record-node" style="left:${position}%" data-action="record-detail:${esc(record.id)}" title="${esc(`${recordDateTime(record.occurredAt)} · ${record.label}`)}"><i></i><span>${esc(record.label)}</span></button>`;
    }).join("")}</div>`;
  }
  function trendRecordControl(days) {
    return `${toggle("trendRecords", "用户记录", "在趋势图中显示你主动添加的记录")}${state.toggles.trendRecords ? `<p class="trend-record-caption">记录只表示同时出现，不代表它导致了趋势变化。点击可查看时间和原话。</p>` : ""}`;
  }
  function retainedUserRecords() {
    const content = state.subjectiveRecords.length
      ? `<div class="retained-records">${state.subjectiveRecords.map(record => `<button class="text-button" data-action="record-detail:${esc(record.id)}">${esc(record.label)}<small>用户记录</small></button>`).join("")}</div>`
      : notice("暂无用户记录", "可以补充情绪、疲惫、饮酒、晚睡或经期不适；记录不依赖硬件绑定。", "sage");
    return `${content}<div class="record-editor"><span class="section-label">补充今天的感受</span>${subjectiveMarkers()}</div>`;
  }
  function monthlyReport() {
    return `<section class="monthly-report"><div class="monthly-report-head"><div><span>MONTHLY REPORT</span><h3>${Number((state.selectedReportMonth || "2026-08").split("-")[1])} 月回顾</h3></div><strong>记录 26 天</strong></div>${radialProgress(87, "26 / 30", "本月有记录", "其中 24 晚完整")}<div class="monthly-change-grid"><article><i aria-hidden="true">${domainIcon("sleep")}</i><strong>后半月睡得更整</strong><span>夜醒主要集中在月初</span></article><article><i aria-hidden="true">${domainIcon("energy")}</i><strong>有几天需要放慢</strong><span>常和晚睡、疲惫同时出现</span></article><article><i aria-hidden="true">${domainIcon("activity")}</i><strong>休息后通常会回稳</strong><span>只是同期变化，不能证明因果</span></article></div><details class="visual-disclosure compact-note"><summary><span class="record-glyph" aria-hidden="true">i</span><div><strong>哪些天没算进去</strong><small>4 天记录不完整</small></div><i aria-hidden="true">＋</i></summary><p>戒指没戴好或关键时段缺少记录的 4 天没有纳入；月报不展示敏感的单次健康数值。</p></details>${buttons([["记下这份回顾的感受", "monthly-review-start", "secondary"]])}</section>`;
  }
  function sleepGoalPanel() {
    const goal = state.sleepGoal;
    const durationOptions = [["7.5", "7 小时 30 分"], ["8", "8 小时"], ["8.5", "8 小时 30 分"]];
    return `<section class="sleep-goal-card"><div class="sleep-goal-heading"><div><span>SLEEP GOAL</span><h3>睡眠目标</h3></div><strong>${esc(goal.duration)} 小时</strong></div><label class="field-label">目标睡眠时长<select class="field" id="sleep-duration">${durationOptions.map(([value, label]) => `<option value="${value}" ${String(goal.duration) === value ? "selected" : ""}>${label}</option>`).join("")}</select></label><div class="sleep-goal-grid"><label class="field-label">工作日上床<input class="field" id="sleep-workday-bedtime" type="time" value="${esc(goal.workdayBedtime)}"></label><label class="field-label">工作日起床<input class="field" id="sleep-workday-wake" type="time" value="${esc(goal.workdayWake)}"></label><label class="field-label">休息日上床<input class="field" id="sleep-rest-bedtime" type="time" value="${esc(goal.restBedtime)}"></label><label class="field-label">休息日起床<input class="field" id="sleep-rest-wake" type="time" value="${esc(goal.restWake)}"></label></div>${buttons([["保存睡眠目标", "sleep-goal-save", "primary"]])}<p class="caption">目标只用于睡前建议和回顾，不评价你做得好不好，也不会覆盖实际睡眠记录。</p></section>`;
  }
  function detailSection(title, content, className = "") {
    return `<section class="detail-section ${esc(className)}"><span class="section-label">${esc(title)}</span>${content}</section>`;
  }
  function emptyHealthData() {
    const data = currentDataLifecycle();
    return `<section class="empty-health-data"><span class="data-symbol ${esc(state.dataLifecycle)}" aria-hidden="true"><img src="${HALO_SYMBOL}" alt=""></span><strong>${esc(data.label)}</strong><p>${esc(data.reason)}</p><small>${esc(data.needed)} · ${esc(data.next)}</small></section>`;
  }
  function dataStageActions(stage) {
    if (stage === "limited") return [["重新同步", "toast:已开始重新同步", "primary"], ["查看设备状态", "go:DEV-10", "secondary"]];
    if (stage === "baseline") return [["查看数据进度", "go:TOD-11", "primary"], ["记录今天的感受", "go:TOD-02", "secondary"]];
    return [["查看佩戴与同步", "go:DEV-10", "primary"], ["记录今天的感受", "go:TOD-02", "secondary"]];
  }
  function interpretationCorrectionCard() {
    if (state.aiCorrection.status !== "saved") {
      return `<button class="interpretation-feedback" data-action="ai-correction:open"><span aria-hidden="true">≠</span><span><strong>和我现在的感受不太一样</strong><small>纠正这次解释，不改动戒指数据</small></span><i aria-hidden="true">›</i></button>`;
    }
    const note = state.aiCorrection.note ? ` · ${state.aiCorrection.note}` : "";
    return `<section class="correction-result" role="status"><span class="correction-result-icon" aria-hidden="true">✓</span><div><small>已按你的反馈调整</small><strong>${esc(state.aiCorrection.reasonLabel)}${esc(note)}</strong><p>原解释不会继续作为你的实际感受，也不会自动写入 Halo 记忆。</p><button class="text-button" data-action="ai-correction:open">重新纠正</button></div></section>`;
  }
  function currentJourneyStep() {
    const theme = JOURNEY_THEMES[state.journeyTheme] || JOURNEY_THEMES.boundary;
    return theme[Math.max(0, Math.min(theme.length - 1, state.journeyVariant))];
  }
  function journeyPage(item) {
    const journey = state.journeyRecords[state.journeyTheme];
    state.journeyProgress = journey.days.length;
    const doneToday = journey.days.includes(experienceDay());
    const completed = state.journeyProgress >= 7;
    const step = currentJourneyStep();
    const themeTitle = state.journeyTheme === "pause" ? "白天留一个短暂停顿" : "晚上别把工作带上床";
    if (state.journeyDecision === "unsuitable") {
      return `${head(item, "JOURNEYS")}<div class="stack">${notice("这个主题已经停下", "Halo 不会再提醒你做这组练习。进度仍然保留，你可以换一个方向。", "sage")}<section class="journey-summary-card"><span class="journey-state-label">已标记为不适合</span><h2>${esc(themeTitle)}</h2><p>${esc(state.journeyReason || "这组练习不符合你现在的需要。")}</p></section>${buttons([["换成白天短暂停顿", "journey-replace-theme", "primary"], ["保留记录，返回 Halo", "go:HAL-01", "secondary"]])}</div>`;
    }
    const adjusted = state.journeyVariant > 0;
    const statusTitle = completed ? "这个主题已经完成" : state.journeyDecision === "deferred" ? "今天先放下，没关系" : state.journeyPaused ? "这个主题已暂停" : adjusted ? "这一步已经变简单" : "每天只做一件小事";
    const statusBody = completed
      ? "你完成了 7 天练习，可以回看哪些做法更适合自己。"
      : state.journeyDecision === "deferred"
      ? `${state.journeyReason || "今天不做。"} 下次从更轻的一步开始。`
      : state.journeyPaused
      ? "之前的进度还在，想继续时再回来。"
      : adjusted
      ? "Halo 根据你的选择降低了难度；不追求连续打卡。"
      : "不追求连续打卡，做完今天这一小步就好。";
    const activeActions = completed
      ? [["重新开始这个主题", "journey-reset", "primary"]]
      : state.journeyDecision === "deferred"
      ? [["现在想做了", "journey-resume-today", "primary"], ["再换一个更容易的", "journey-replace", "secondary"], ["这个主题不适合我", "journey-unsuitable", "text-button"]]
      : state.journeyPaused
      ? [["继续这个主题", "journey-resume", "primary"], ["这个主题不适合我", "journey-unsuitable", "text-button"]]
      : [[doneToday ? "今天已记下，明天再继续" : "完成今天这一小步", doneToday ? "" : "journey-step", "primary", doneToday], ["换一个更容易的", "journey-replace", "secondary"], ["今天先不做", "journey-defer-open", "text-button"], ["这个主题不适合我", "journey-unsuitable", "text-button"]];
    return `${head(item, "JOURNEYS")}<div class="stack">${notice(statusTitle, statusBody, "sage")}<section class="journey-summary-card"><div class="journey-summary-head"><span>已记录 ${state.journeyProgress} / 7 天</span><small>${adjusted ? step.detail : "按你的节奏"}</small></div><h2>${esc(step.title)}</h2><p>${esc(step.action)}</p><div class="journey-progress-dots" aria-label="已完成 ${state.journeyProgress} 天">${Array.from({ length: 7 }, (_, index) => `<i class="${index < state.journeyProgress ? "done" : index === state.journeyProgress ? "current" : ""}"></i>`).join("")}</div></section>${completed ? rows([["本次主题", themeTitle], ["你记下的变化", journey.note || "还没有补充感受"], ["已完成日期", journey.days.join("、")]]) : `<label class="field-label">想记下的感受（可选）<textarea class="field" id="journey-note" placeholder="只记录你自己的感受">${esc(journey.note)}</textarea></label>`}${buttons(activeActions)}${!completed && state.journeyDecision !== "deferred" && !state.journeyPaused ? `<button class="journey-pause-link" data-action="journey-pause">暂停整个主题</button>` : ""}</div>`;
  }
  function nightReviewPage(item) {
    const selected = currentNightSession();
    if (!selected) return `${head(item, "NIGHT SUMMARY")}<div class="stack">${notice("还没有可复盘的播放记录", "结束一次播放后，可以记录这一次的感受。", "sage")}${buttons([["选择今晚内容", "go:NIG-01", "primary"]])}</div>`;
    const review = selected.review || (selected.review = { ...DEFAULT_NIGHT_REVIEW, factors: [], observationCount: 0 });
    state.nightReview = review;
    const executionLabels = { complete: "完整做了", partial: "做了一部分", none: "没有执行" };
    const helpfulnessLabels = { helpful: "自己觉得有帮助", neutral: "没什么感觉", unhelpful: "不太适合", unknown: "无法判断" };
    const factorLabels = { late: "比平时晚睡", exercise: "当天有运动", alcohol: "有饮酒", emotion: "情绪有起伏", none: "没有明显变化" };
    if (review.saved) {
      const factorText = review.factors.length ? review.factors.map((value) => factorLabels[value]).filter(Boolean).join("、") : "没有补充";
      const observationText = review.execution === "none"
        ? "昨晚没有执行，因此不会把今天的任何变化和这段内容联系起来。"
        : review.observationCount < 3
        ? `目前只有 ${review.observationCount} 次记录，先继续观察，不判断是否有效。`
        : `已有 ${review.observationCount} 次记录；主观感受和设备变化会分开看，仍不把同时发生当作因果。`;
      return `${head(item, "NIGHT SUMMARY")}<div class="stack">${notice("本次复盘已记下", "你的执行情况和感受会与设备记录分开保存。", "sage")}${rows([["听了什么", selected.title], ["播放结束", experienceTime(selected.endedAt)], ["实际执行", executionLabels[review.execution]], ["你的感受", helpfulnessLabels[review.helpfulness] || "无法判断"], ["同期变化", factorText]])}${notice("设备观察", "本次播放没有关联已核验的睡眠记录，不展示变化结论。")}${notice("现在能说到哪一步", observationText)}${buttons([["修改本次复盘", "night-review-edit", "secondary"], ["查看身体天气", "go:TOD-03", "primary"], ["返回播放历史", "go:NIG-10", "secondary"]])}</div>`;
    }
    const canRateHelp = review.execution && review.execution !== "none";
    const canSave = Boolean(review.execution) && (review.execution === "none" || Boolean(review.helpfulness));
    return `${head(item, "LAST NIGHT SUMMARY")}<div class="stack">${notice("本次播放已经结束", "先确认你实际做了多少，再记录自己的感受。设备变化会单独显示。", "sage")}${rows([["听了什么", selected.title], ["播放记录", selected.detail], ["停止方式", "由你结束播放"], ["自动渐弱", selected.fadeEnabled ? "开启" : "关闭"]])}<section class="reflection-block"><span class="section-label">1 · 本次实际做到多少？</span><div class="reflection-options">${[["complete","完整做了"],["partial","做了一部分"],["none","没有执行"]].map(([value, label]) => `<button class="${review.execution === value ? "active" : ""}" data-action="night-review-execution:${value}" aria-pressed="${review.execution === value}">${label}</button>`).join("")}</div></section>${canRateHelp ? `<section class="reflection-block"><span class="section-label">2 · 你自己觉得呢？</span><div class="reflection-options">${[["helpful","有帮助"],["neutral","没什么感觉"],["unhelpful","不太适合"]].map(([value, label]) => `<button class="${review.helpfulness === value ? "active" : ""}" data-action="night-review-help:${value}" aria-pressed="${review.helpfulness === value}">${label}</button>`).join("")}</div></section>` : ""}<section class="reflection-block"><span class="section-label">3 · 当天还有什么不同？（可多选）</span><div class="reflection-options factors">${[["late","晚睡"],["exercise","有运动"],["alcohol","饮酒"],["emotion","情绪起伏"],["none","没有明显变化"]].map(([value, label]) => `<button class="${review.factors.includes(value) ? "active" : ""}" data-action="night-review-factor:${value}" aria-pressed="${review.factors.includes(value)}">${label}</button>`).join("")}</div></section>${notice("为什么要分开记录", "点击、实际执行、自己觉得有帮助和设备变化是四件不同的事。Halo 不会用一次变化证明某项建议有效。")}${buttons([["保存本次复盘", "night-review-save", "primary", !canSave], ["先不复盘", "go:TOD-01", "secondary"]])}</div>`;
  }
  function healthDetail(item, config) {
    if (!isHardwareActive()) return unboundHealthDetail(item);
    const stage = state.dataLifecycle;
    const dataState = currentDataLifecycle(stage);
    const canInterpret = stage === "interpretable";
    const canShowMeasuredData = stage !== "none";
    const isCorrectedBodyWeather = item.id === "TOD-03" && canInterpret && state.aiCorrection.status === "saved";
    const conclusion = canInterpret ? (isCorrectedBodyWeather ? "今天先按你的真实感受来" : config.conclusion) : dataState.headline;
    const summary = canInterpret ? (isCorrectedBodyWeather ? `你说“${state.aiCorrection.reasonLabel}”。Halo 不再把原来的解读当作你的实际状态。` : config.summary) : dataState.summary;
    const why = canInterpret ? (isCorrectedBodyWeather ? `${config.why} 这些戒指记录保持不变，但不能替代你对当下状态的感受。` : config.why) : dataState.reason;
    const dataContent = canShowMeasuredData ? config.data : emptyHealthData();
    const trendContent = ["none", "accumulating"].includes(stage)
      ? notice("趋势还没形成", `${dataState.needed}。继续正常佩戴，完成同步后会自动更新。`)
      : `${segmented([["7", "7 天"], ["14", "14 天"], ["30", "30 天"]], state.trendPeriod, "trend")}${config.trend}`;
    const currentActions = canInterpret ? config.actions : dataStageActions(stage);
    const [detailKind, detailGlyph] = visualMeta(item.name);
    const sourceSummary = `${config.source || "Halo Ring"} · ${canInterpret ? config.quality || "数据可用" : dataState.label} · ${canInterpret ? config.updated || "刚刚更新" : stage === "none" ? "等待首次同步" : "查看记录进度"}`;
    const statusLabel = canInterpret ? (config.statusLabel || "今天") : dataState.label;
    const dataSummaryLabel = {
      none: "还没有完整记录",
      accumulating: "还在积累记录",
      baseline: "快要完成个人范围",
      interpretable: "昨晚记录完整",
      limited: "昨晚少了一段",
    }[stage] || dataState.label;
    const copyVariant = canInterpret ? config.copyVariant : dataState.copyVariant;
    const correction = canInterpret && config.allowCorrection ? interpretationCorrectionCard() : "";
    return `${head(item, config.eyebrow)}<article class="unified-health-detail visual-health-detail" data-detail-page="${esc(item.id)}" data-copy-variant="${esc(copyVariant)}"><section class="detail-conclusion ${canInterpret ? "ready" : esc(stage)}" data-kind="${detailKind}"><i class="conclusion-glyph" aria-hidden="true">${detailGlyph}</i><span>${esc(isCorrectedBodyWeather ? "已根据你的反馈调整" : statusLabel)}</span><h2>${esc(conclusion)}</h2><p>${esc(summary)}</p></section>${correction}${detailSection(config.whyTitle || "为什么这么说", `<div class="insight-strip" data-kind="${detailKind}"><i aria-hidden="true">${detailGlyph}</i><p>${esc(why)}</p></div>${canInterpret ? config.reasonExtra || "" : ""}`)}${detailSection(config.dataTitle || "今天的几个重点", dataContent)}${config.educationExtra ? detailSection(config.educationTitle || "读懂这个指标", config.educationExtra, "education-section") : ""}${detailSection(config.trendTitle || "和你平时比", trendContent)}${detailSection("数据说明", `<details class="visual-disclosure"><summary><span class="data-symbol ${esc(stage)}" aria-hidden="true"><img src="${HALO_SYMBOL}" alt=""></span><div><strong>${esc(dataSummaryLabel)}</strong><small>${esc(sourceSummary)}</small></div><i aria-hidden="true">＋</i></summary><div class="visual-disclosure-body">${lifecycle(stage, config.lifecycleTitle, canInterpret ? config.lifecycleOverride : undefined)}${quality(config.source, config.quality, config.updated)}<p class="source-priority">Halo Ring 是主要来源；其他来源会单独标明，同一时段不会重复计算。</p></div></details>`)}${detailSection("记下你的感受", `<details class="visual-disclosure user-record-disclosure"><summary><span class="record-glyph" aria-hidden="true">＋</span><div><strong>补充今天的感受</strong><small>${state.subjectiveMarkers.length ? `已有 ${state.subjectiveMarkers.length} 条用户记录` : "保存为用户记录，不会改写戒指数据"}</small></div><i aria-hidden="true">＋</i></summary><div class="visual-disclosure-body">${subjectiveMarkers()}</div></details>`, "subjective-section")}${detailSection(config.actionSectionTitle || "今天可以怎么做", `${notice(canInterpret ? config.actionTitle : dataState.next, canInterpret ? config.actionBody : dataState.needed, "sage")}${buttons(currentActions)}`, "detail-action")}</article><p class="health-boundary">用于日常健康管理，不替代医疗诊断。</p>`;
  }
  function unboundHealthDetail(item) {
    const copy = membershipCopy();
    const retained = state.membershipHardwareState === "unbound-retained";
    return `${head(item, "MEMBER MODE")}<article class="unified-health-detail unbound-detail"><section class="detail-conclusion unbound"><span>${esc(copy.label)}</span><h2>这里还没有身体数据</h2><p>没有足够记录时，Halo 不会猜你的身体状态。</p></section>${detailSection("还差什么", `<p>${retained ? "目前没有已激活的 Halo Ring。以前的会员资产和用户记录还在；重新绑定后，才会继续记录新的身体数据和成长。" : "你已经是 Halo Member。绑定并激活 Halo Ring 后，戴着它完成夜间记录，才会开始生成 Body Weather。"}</p>`)}${detailSection("你记下的感受", retainedUserRecords(), "retained-user-records")}${detailSection("现在可以用", `<ul class="availability-list"><li>会员、Halo Points、Halo Select、订单、推荐和客服</li><li>每天 10 条不读取身体数据的 Halo 对话</li><li>手动记录节律、情绪和睡眠感受</li><li>浏览和预约 Studio，播放 3 项基础睡前内容</li></ul>`)}${detailSection("绑定戒指后会多什么", `<ul class="availability-list"><li>Body Weather 和健康数据详情</li><li>根据身体状态推荐的夜间内容</li><li>7 / 14 / 30 天趋势与身体报告</li><li>会员成长任务、徽章和升级</li></ul>`)}${detailSection("现在先做什么", buttons([[retained ? "重新绑定 Halo Ring" : "绑定 Halo Ring", "go:DEV-01", "primary"], ["先听基础睡前内容", "go:NIG-01", "secondary"]]), "detail-action")}</article>`;
  }
  function unboundToday(item) {
    return `${head(item, "TODAY · MEMBER MODE")}<div class="stack"><button class="body-weather unbound-weather" data-action="go:TOD-03"><img class="weather-symbol" src="${HALO_SYMBOL}" alt=""><span class="label">BODY WEATHER · 等待数据</span><h2>还没有今天的 Body Weather</h2><p>绑定并激活戒指后，戴着它完成夜间记录。</p></button>${visualSignalCards([["睡眠","等待戒指记录"],["身体能量","等待戒指记录"],["今天怎么动","按感受"]], true)}${buttons([[state.membershipHardwareState === "unbound-retained" ? "重新绑定 Halo Ring" : "绑定 Halo Ring", "go:DEV-01", "primary"]])}${setting("记下今天的感受", state.subjectiveMarkers.length ? `已有 ${state.subjectiveMarkers.length} 条用户记录` : "不用绑定戒指", "go:TOD-02")}${dailyInspirationCard()}${card("今晚先听一段", "3 项基础睡前内容", "PUBLIC CONTENT", "go:NIG-01")}${setting("和 Halo 聊聊", "不读取身体数据 · 今天 10 条", "go:HAL-01")}${setting("Halo Studio", "浏览与预约", "go:STU-08")}</div>`;
  }
  function unboundNight(item) {
    return `${head(item, "PUBLIC NIGHT")}<div class="night-screen"><section class="night-hero"><span>HALO MEMBER</span><h2>今晚先选一段喜欢的</h2><p>三项公共内容，不读取身体数据。</p></section><div class="stack public-night-list">${state.nightSession && state.nightSession.status !== "ended" ? setting(state.nightSession.title, state.nightSession.status === "playing" ? "继续查看播放" : "已暂停 · 继续播放", "go:NIG-04") : ""}${setting("5 分钟睡前呼吸", "5 分钟 · 手动播放", "public-play:breath")}${setting("10 分钟身体扫描", "10 分钟 · 手动播放", "public-play:scan")}${setting("15 分钟安睡音频", "15 分钟 · 手动播放", "public-play:sound")}${setting("播放历史", "回看自己的播放与复盘记录", "go:NIG-10")}${notice("无需设备也可使用", "这些公共内容不生成身体结论，不奖励成长、积分或徽章。本地原型只演示播放操作，不输出真实音频。")}</div></div>`;
  }
  function dailyInspirationCard() {
    if (!state.toggles.inspiration) return "";
    return `<section class="daily-inspiration"><div class="inspiration-heading"><div><span>DAILY HALO</span><h3>今日灵感</h3></div><button class="inspiration-info" data-action="info:inspiration" aria-label="了解今日灵感">i</button></div><div class="inspiration-keyword"><span>今日关键词</span><strong>${esc(DAILY_INSPIRATION.keyword)}</strong></div><p>${esc(DAILY_INSPIRATION.message)}</p><span class="daily-cues-label">今日小线索 · DAILY CUES</span><div class="daily-cues"><div class="daily-cue"><span class="cue-swatch" aria-hidden="true"></span><span class="daily-cue-copy"><small>今日色彩</small><strong>${esc(DAILY_INSPIRATION.color)}</strong></span></div><div class="daily-cue"><span class="cue-number">${esc(DAILY_INSPIRATION.number)}</span><span class="daily-cue-copy"><small>今日数字</small><strong>保持简单</strong></span></div><button class="daily-cue daily-cue-button outfit-cue" data-action="open-outfit-inspiration" aria-label="查看今日旺运穿衣：${esc(DAILY_INSPIRATION.outfitColor)}"><span class="cue-palette" aria-hidden="true"><i style="--offset:0px;--swatch:#d6b84c"></i><i style="--offset:8px;--swatch:#8a6548"></i><i style="--offset:16px;--swatch:#5f4638"></i><i style="--offset:24px;--swatch:#b69b72"></i></span><span class="daily-cue-copy"><small>旺运穿衣</small><strong>${esc(DAILY_INSPIRATION.outfitColor)}</strong></span><span class="cue-chevron" aria-hidden="true">›</span></button></div><div class="inspiration-action"><small>轻行动</small><strong>${esc(DAILY_INSPIRATION.action)}</strong></div><button class="inspiration-link" data-action="open-inspiration">和 Halo 聊聊 <span>›</span></button><small class="inspiration-disclaimer">五行穿衣与文化灵感仅供参考，不预测结果、不读取健康数据</small></section>`;
  }
  function haloContextPanel() {
    const compact = state.chat.length > 0;
    const reveal = (pill, content) => compact ? pill : `${pill}${content}`;
    if (state.haloContext === "inspiration") {
      const pill = `<button class="context-pill inspiration-context" data-action="switch-halo-context:body">正在聊：今日灵感　×</button>`;
      return reveal(pill, `${notice(`今天的词：${DAILY_INSPIRATION.keyword}`, DAILY_INSPIRATION.message, "sage")}<div class="suggestions"><button data-action="ask:${esc(DAILY_INSPIRATION.outfitQuestion)}">今天的颜色怎么穿？</button><button data-action="ask:怎么把它用在今天？">怎么把它用在今天？</button><button data-action="ask:给我一个十分钟能做的行动">给我一个十分钟能做的行动</button><button data-action="switch-halo-context:body">聊聊今天的状态</button></div>`);
    }
    if (state.haloContext === "rhythm") {
      if (state.dataLifecycle !== "interpretable") {
        const pill = `<button class="context-pill" data-action="remove-halo-context">参考：你的节律记录　×</button>`;
        return reveal(pill, `${notice("这次只看你主动记录的内容", "身体数据还不能稳定解释，所以不会显示或引用睡眠值与趋势。", "sage")}<div class="suggestions"><button data-action="ask:帮我整理最近的感受">帮我整理最近的感受</button><button data-action="ask:今天不舒服，先做什么？">今天不舒服，先做什么？</button><button data-action="ask:先听我说一会儿">先听我说一会儿</button></div>`);
      }
      const pill = `<button class="context-pill" data-action="remove-halo-context">参考：节律记录和最近 7 天睡眠　×</button>`;
      return reveal(pill, `${notice("最近几天的变化可以一起看", "节律和睡眠可能同时变化，但不能只用周期阶段解释你的感受。", "rose")}<div class="suggestions"><button data-action="ask:最近为什么总是睡不踏实？">最近为什么总是睡不踏实？</button><button data-action="ask:今天不太舒服，先做什么？">今天不太舒服，先做什么？</button><button data-action="ask:先听我说说感受">先听我说说感受</button></div>`);
    }
    if (state.haloContext === "feeling" && state.haloFeeling) {
      const pill = `<button class="context-pill" data-action="remove-halo-context">参考你的记录：${esc(state.haloFeeling)}　×</button>`;
      return reveal(pill, notice("这次感受已带入", "它会和设备数据分开显示，只表示你此刻的记录。", "sage"));
    }
    if (state.haloContext === "correction" && state.aiCorrection.status === "saved") {
      const pill = `<button class="context-pill" data-action="switch-halo-context:body">参考：你对今天解释的纠正　×</button>`;
      return reveal(pill, `${notice("先按你说的来", `你说“${state.aiCorrection.reasonLabel}”。我不会继续把原解释当成你的实际感受，戒指数据仍会单独保留。`, "sage")}<div class="suggestions"><button data-action="ask:按我的真实感受重新安排今天">按我的真实感受重新安排今天</button><button data-action="ask:这次纠正会怎么保存？">这次纠正会怎么保存？</button><button data-action="go:HAL-03">检查 Halo 记忆</button></div>`);
    }
    if (!hasBodyContext() || state.haloContext === "none") {
      const reason = state.dataLifecycle === "none" ? "目前还没有可用身体数据，所以 Halo 不会猜测你的状态。" : state.dataLifecycle !== "interpretable" ? "身体数据还不能稳定解释，所以这次不会带入健康数值或趋势。" : "你已关闭本次身体状态参考。";
      if (compact) return `<button class="context-pill" data-action="go:HAL-07">本次不参考身体状态　设置 ›</button>`;
      return `${notice("这次对话不参考身体状态", `${reason} 你仍可以聊感受、安排和通用的放松方法。`, "sage")}<div class="suggestions"><button data-action="ask:陪我梳理今天的安排">陪我梳理今天的安排</button><button data-action="ask:给我一个通用的放松练习">给我一个通用的放松练习</button><button data-action="ask:先听我说一会儿">先听我说一会儿</button></div>`;
    }
    const weather = currentBodyWeather();
    const canInterpret = state.dataLifecycle === "interpretable";
    const dataState = currentDataLifecycle();
    const pill = `<button class="context-pill" data-action="remove-halo-context">参考今天的 Body Weather · 08:42　×</button>`;
    return reveal(pill, `${notice(canInterpret ? weather.homeTitle : dataState.headline, canInterpret ? weather.homeBody : dataState.summary, "sage")}${canInterpret ? `<button class="interpretation-feedback compact" data-action="ai-correction:open"><span aria-hidden="true">≠</span><span><strong>和我的感受不太一样</strong><small>告诉 Halo 哪里不准确</small></span><i aria-hidden="true">›</i></button>` : ""}<div class="suggestions">${canInterpret ? `<button data-action="ask:为什么建议我今天别冲强度？">为什么建议我今天别冲强度？</button><button data-action="ask:下午事情很多，怎么安排？">下午事情很多，怎么安排？</button><button data-action="ask:今晚怎么早点停下来？">今晚怎么早点停下来？</button>` : `<button data-action="ask:还差几天才能看 Body Weather？">还差几天才能看 Body Weather？</button><button data-action="ask:怎样让今晚的记录更完整？">怎样让今晚的记录更完整？</button><button data-action="ask:今天先怎么安排？">今天先怎么安排？</button>`}<button data-action="ask:先听我说一会儿">先听我说一会儿</button></div>`);
  }
  function segmented(options, selected, prefix) {
    return `<div class="segmented">${options.map(([value, label]) => `<button class="${String(selected) === String(value) ? "active" : ""}" data-action="${esc(prefix)}:${esc(value)}">${esc(label)}</button>`).join("")}</div>`;
  }
  function education(title, body, action = "info:education") {
    return `<button class="education-row" data-action="${esc(action)}"><span>了解这个功能</span><strong>${esc(title)}</strong><p>${esc(body)}</p><i>阅读 ›</i></button>`;
  }
  function initializeAccountState() {
    if (!Object.prototype.hasOwnProperty.call(storedAppProgress, "devicePaired")) state.devicePaired = isHardwareActive();
    if (!isHardwareActive()) state.deviceStatus = "disconnected";
    if (!state.toggles.bluetooth) state.deviceStatus = "disconnected";
    state.deviceResetStatus = ["ready", "pending", "complete"].includes(state.deviceResetStatus) ? state.deviceResetStatus : "ready";
    state.deviceOperationHistory = Array.isArray(state.deviceOperationHistory) ? state.deviceOperationHistory : [];
    state.measurementType = ACCOUNT_MEASUREMENT_TYPES[state.measurementType] ? state.measurementType : "heart";
    state.measurementStatus = ["ready", "running", "failed", "complete"].includes(state.measurementStatus) ? state.measurementStatus : "ready";
    state.feedbackDraft = { type: "设备连接", text: "", ...(state.feedbackDraft || {}) };
    state.feedbackTickets = Array.isArray(state.feedbackTickets) ? state.feedbackTickets : [];
  }
  const ACCOUNT_MEASUREMENT_TYPES = {
    heart: { label: "心率与 HRV", metrics: [["心率", "71", "次/分"], ["HRV", "44", "ms"]], summary: "心率 71 次/分 · HRV 44 ms" },
    oxygen: { label: "血氧", metrics: [["血氧", "98", "%"]], summary: "血氧 98%" },
    temperature: { label: "皮肤温度", metrics: [["皮肤温度相对变化", "+0.2", "℃"]], summary: "皮肤温度相对变化 +0.2℃" },
  };
  function accountRouteGuard(id) {
    if (["DEV-11", "DEV-12"].includes(id) && !isHardwareActive() && !(id === "DEV-12" && state.deviceResetStatus === "complete")) return "DEV-10";
    if (["DEV-04", "DEV-05"].includes(id) && !state.devicePaired && !isHardwareActive()) return "DEV-03";
    if (id === "HLT-04" && state.measurementStatus === "ready") return "HLT-03";
    return id;
  }
  function handleAccountInput(target) {
    if (target.id === "feedback-text") { state.feedbackDraft.text = target.value; persistAppProgress(); return true; }
    if (target.id === "feedback-type") { state.feedbackDraft.type = target.value; persistAppProgress(); return true; }
    return false;
  }
  function handleAccountToggle(key) {
    if (!["bluetooth", "notification"].includes(key)) return false;
    state.toggles[key] = !state.toggles[key];
    if (key === "bluetooth" && !state.toggles.bluetooth) {
      state.deviceStatus = "disconnected";
      if (state.measurementStatus === "running") state.measurementStatus = "failed";
      if (["downloading", "verifying"].includes(state.firmwareStatus)) state.firmwareStatus = "failed";
    }
    return true;
  }
  function deviceOperationUnavailable(operation) {
    if (!isHardwareActive()) return "请先绑定并激活戒指";
    if (!state.toggles.bluetooth) return "请先开启蓝牙权限";
    if (!["connected", "low"].includes(state.deviceStatus)) return state.deviceStatus === "syncing" ? "同步完成后再试" : "请先连接戒指";
    if (state.deviceResetStatus === "pending") return "设备重置尚未完成";
    if (state.measurementStatus === "running") return "请先结束当前测量";
    if (operation !== "firmware" && ["downloading", "verifying"].includes(state.firmwareStatus)) return "固件更新完成后再试";
    if (operation === "firmware" && state.deviceStatus === "low") return "请先充电，再更新固件";
    return "";
  }
  function measurementUnavailable() { return deviceOperationUnavailable("measurement"); }
  function renderMeasurementStart(item) {
    const unavailable = measurementUnavailable();
    const recent = state.lastMeasurement;
    return `${head(item, "MEASURE")}<div class="stack">${haloStatus(state.deviceStatus, "compact", "status-detail")}${unavailable ? notice("暂时不能测量", unavailable, "warm") : notice("保持手部安静", "戒指贴合指腹，测量期间减少移动。", "sage")}${Object.entries(ACCOUNT_MEASUREMENT_TYPES).map(([type, measurement]) => `<button class="setting-row" data-action="measurement-start:${type}" ${unavailable ? "disabled" : ""}><div><strong>${measurement.label}</strong><small>${type === "temperature" ? "读取当前相对变化" : "约 60 秒"} · 原型演示</small></div><span>›</span></button>`).join("")}${state.measurementStatus === "running" ? buttons([["继续本次测量", "go:HLT-04", "primary"], ["取消测量", "measurement-cancel", "secondary"]]) : ""}${unavailable ? buttons([["查看设备状态", "go:DEV-10", "secondary"], ["权限设置", "go:PERM-01", "text-button"]]) : ""}${card("最近一次", recent ? `${ACCOUNT_MEASUREMENT_TYPES[recent.type]?.summary || "测量记录"} · ${new Date(recent.completedAt).toLocaleString("zh-CN")} · 演示记录` : "还没有主动测量记录", "HISTORY")}${education("主动测量何时更稳定", "静坐片刻、手部保持安静并让传感器贴近指腹，更容易获得可用记录。")}</div>`;
  }
  function renderMeasurementResult(item) {
    const measurement = ACCOUNT_MEASUREMENT_TYPES[state.measurementType] || ACCOUNT_MEASUREMENT_TYPES.heart;
    if (state.measurementStatus === "failed") return `${head(item, "MEASUREMENT")}<div class="stack">${notice("本次没有获得可用数据", "连接中断或佩戴不稳，本次不会保存。请确认蓝牙和佩戴后重新测量。", "warm")}${buttons([["重新测量", "measurement-reset", "primary"], ["返回主动测量", "go:HLT-03", "secondary"]])}</div>`;
    if (state.measurementStatus === "complete") return `${head(item, "MEASUREMENT")}<div class="stack">${notice(`${measurement.label}测量完成`, "以下为原型演示结果，已保存在当前浏览器，不是实际设备采集。", "sage")}${metrics(measurement.metrics)}${quality(`本次${measurement.label}主动测量`, "演示记录", state.lastMeasurement ? new Date(state.lastMeasurement.completedAt).toLocaleString("zh-CN") : "未保存")}${notice("怎样看这次结果", "单次主动测量只反映当下，不用于诊断，也不会单独改变今天的 Body Weather。")}${buttons([["完成", "go:HLT-03", "primary"], ["重新测量", "measurement-reset", "secondary"]])}</div>`;
    return `${head(item, "MEASURING")}<div class="gated measuring-state"><span class="data-symbol accumulating" aria-hidden="true"><img src="${HALO_SYMBOL}" alt=""></span><h2>正在测量${measurement.label}</h2><p class="caption">原型演示 · 离开后可返回继续</p></div>${buttons([["完成演示测量", "measure-complete", "primary"], ["取消测量", "measurement-cancel", "text-button"]])}`;
  }
  function showLegalReading(kind) {
    const content = {
      agreement: ["用户协议 · 原型摘要", [["账号与会员", "注册并确认必需说明后成为 Halo Member。未绑定也可使用公开内容、用户记录及会员服务；绑定激活后才开始未来成长。"], ["服务边界", "健康功能不按会员等级锁定。Halo 不提供医疗诊断，不处理急症；具体能力取决于设备支持和有效数据。"], ["资产与退出", "合法获得的会员资产不会因正常不活跃或解绑被收回。账号注销前可查看将失效资产，订单与售后仍可继续处理。"], ["规则与联系", "核心规则变化提前公示，只影响生效后的行为。对记录有疑问可从帮助中心联系企业微信客服。"]]],
      privacy: ["隐私政策 · 原型摘要", [["收集与用途", "设备记录、手动记录与 Halo 解释分别标记来源。只有相关功能所需的信息才用于该功能；健康数据不用于推导商城订单来源。"], ["权限选择", "蓝牙用于连接与同步；通知用于提醒。位置、系统健康数据和 Studio 分享分别控制，拒绝可选权限不影响其他服务。"], ["管理与删除", "在“我的—数据与隐私”查看权限、导出和删除入口。Halo 记忆与节律数据可单独管理。法定留存记录停止用于运营与个性化。"], ["当前原型", "本地输入保存在当前浏览器。本地导出未加密；安全链接、云端删除和身份验证尚未接入真实服务。"]]],
      ai: ["AI 服务说明 · 原型摘要", [["建议不是诊断", "Halo 提供日常健康管理参考，不开处方，也不能代替医生。若感到明显不适，请及时寻求现实中的专业帮助。"], ["以你的感受为准", "设备数值、用户记录和 AI 推断不同。可以指出不准确的解释；一次反馈不会自动成为长期事实。"], ["对话与记忆", "可以停止身体数据带入、暂停主动消息，并管理已确认记忆。关闭某项能力不等于删除历史记录。"], ["演示边界", "当前原型对话用于演示交互，不代表真实模型能力或医疗判断。"]]],
    }[kind];
    if (!content) return;
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal" role="dialog" aria-modal="true" aria-label="${esc(content[0])}"><div class="modal-title-row"><h2>${content[0]}</h2><button class="text-button" data-action="close-modal">关闭</button></div><p class="caption">用于原型审阅，不是正式法律文本；正式上线前需接入经审定的完整版本。</p>${content[1].map(([title, body]) => `<section><h3>${title}</h3><p>${body}</p></section>`).join("")}${buttons([["返回确认", "close-modal", "primary"]])}</section></div>`;
  }
  function firmwarePanel() {
    const unavailable = deviceOperationUnavailable("firmware");
    if (unavailable) return notice("暂时不能更新", unavailable, "warm") + buttons([["查看连接与权限", "go:PERM-01", "secondary"]]);
    const status = {
      available: ["发现新版本 1.1.0", "当前 1.0.8 · 更新约 4 分钟", "开始更新", "firmware:downloading"],
      downloading: ["正在下载固件", "46% · 请保持戒指与手机在 1 米内", "继续到校验", "firmware:verifying"],
      verifying: ["正在校验并安装", "请勿关闭 App 或移开戒指", "完成安装", "firmware:current"],
      current: ["固件已是最新", "1.1.0 · 刚刚完成校验", "再次检查", "firmware:available"],
      failed: ["更新未完成", "连接中断，戒指仍可使用当前版本", "重新尝试", "firmware:downloading"],
    }[state.firmwareStatus] || ["固件状态未知", "稍后再试", "重新检查", "firmware:available"];
    return `<section class="firmware-panel ${esc(state.firmwareStatus)}"><span>FIRMWARE · 原型演示</span><h2>${esc(status[0])}</h2><p>${esc(status[1])}</p>${state.firmwareStatus === "downloading" ? '<div class="progress"><i style="width:46%"></i></div>' : ""}<button class="secondary" data-action="${esc(status[3])}">${esc(status[2])}</button>${state.firmwareStatus !== "failed" ? '<button class="text-button" data-action="firmware:failed">更新没完成？</button>' : ""}</section>`;
  }
  function deviceQualityLabel(status) {
    return {
      connected: "连接稳定",
      connecting: "正在连接",
      syncing: "正在同步",
      disconnected: "等待连接",
      low: "电量较低",
      action: "连续同步失败",
    }[status] || "连接稳定";
  }
  function shareCard(extraClass = "") {
    const content = shareContent();
    return `<section class="share-card canvas-share-card ${esc(extraClass)}"><canvas data-share-canvas role="img" aria-label="${esc(content.title + "：" + content.description)}"></canvas><p class="sr-only">${esc(content.title)} · ${esc(content.description)}</p></section>`;
  }
  function showSharePreview() {
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal share-preview-modal"><div class="modal-title-row"><h2>分享预览</h2><button class="text-button" data-action="close-modal">关闭</button></div>${shareCard("preview")}${notice("隐私已保护", "分享卡不会显示心率、HRV、血氧、温度或其他敏感健康数值。", "sage")}<div class="button-row"><button class="primary" data-action="share-system">分享</button><button class="secondary" data-action="share-save">保存图片</button></div></section></div>`;
  }
  function lineChart(visualKind = "status", title = "个人趋势", summary = "", tone = "sage") {
    const valuesByKind = {
      sleep: [62,58,64,55,67,70,68],
      energy: [48,54,51,60,58,63,61],
      activity: [44,61,53,68,57,64,59],
      heart: [66,59,62,56,60,57,58],
      breath: [55,54,58,56,57,55,56],
      oxygen: [69,70,68,71,70,72,71],
      temperature: [49,52,50,54,53,55,54],
      status: [58,54,67,61,72,65,69],
    };
    const values = valuesByKind[visualKind] || valuesByKind.status;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(1, max - min);
    const points = values.map((value, index) => `${Math.round(index / (values.length - 1) * 320)},${Math.round(96 - (value - min) / range * 68)}`).join(" ");
    const lastPoint = points.split(" ").at(-1).split(",");
    return `<svg viewBox="0 0 320 118" role="img" aria-label="${esc(`${title}：${summary}`)}"><title>${esc(title)}</title><desc>${esc(`${summary}。图中显示相对个人趋势，不提供精确数值读数。`)}</desc><path class="grid-line" d="M0 24H320M0 59H320M0 94H320"/><polygon class="area" points="0,108 ${points} 320,108"/><polyline class="plot ${esc(tone || "sage")}" points="${points}"/><circle class="current-point ${esc(tone || "sage")}" cx="${lastPoint[0]}" cy="${lastPoint[1]}" r="4"/></svg>`;
  }
  function chartCard(title, summary, tone) { const [visualKind, glyph] = visualMeta(title); return `<section class="chart-card visual-chart" data-kind="${visualKind}"><div class="data-heading"><span class="chart-glyph" aria-hidden="true">${glyph}</span><div><strong>${esc(title)}</strong><span>${esc(summary)}</span></div></div>${lineChart(visualKind, title, summary, tone)}<div class="chart-axis"><span>较早</span><b>个人趋势</b><span>现在</span></div></section>`; }
  function generic(item) {
    return head(item, item.group) + `<div class="stack">${notice("本页任务", item.function || item.note, "sage")}${card("页面内容", item.layout || item.note, item.id)}${rows([["主要交互", item.interaction], ["数据与状态", item.data], ["异常处理", item.exception]])}${buttons([["完成并继续", nextId(item.id), "primary"], ["返回上一页", "previous", "secondary"]])}</div>`;
  }
  function nextId(id) { const index = pages.findIndex((item) => item.id === id); return `go:${pages[Math.min(index + 1, pages.length - 1)]?.id || id}`; }
  function previousId(id) { const index = pages.findIndex((item) => item.id === id); return pages[Math.max(0, index - 1)]?.id || id; }

  function firstUse(item) {
    if (item.id === "SYS-01") return `<div class="gated system-loading">${haloStatus("syncing", "hero", "status-detail")}<h1>HALO RING</h1><p class="caption">正在载入你的记录</p><div class="progress" style="margin-top:26px"><i style="width:68%"></i></div></div>${buttons([["查看首次使用流程", "go:ONB-01", "secondary"], ["进入今日", "go:TOD-01", "primary"]])}`;
    if (item.id === "ONB-01") return `<div class="studio-cover" style="min-height:310px"><span>HALO RING</span><h2>看懂昨晚，安排今天</h2><p>从睡眠、活动和夜间身体信号里，找到更适合自己的日常节奏。</p></div><div class="stack" style="margin-top:12px">${notice("使用前先知道", "Halo 用于日常健康管理，不会诊断疾病，也不能替代医生。")}${buttons([["开始使用", "go:AUTH-01", "primary"], ["已有账号", "go:AUTH-01", "text-button"]])}</div>`;
    if (item.id === "AUTH-01") return head(item, "WELCOME") + `<div class="stack"><label class="field-label">手机号<input id="auth-phone" class="field" type="tel" inputmode="tel" value="${esc(state.authPhone || "138 0000 0000")}"></label>${buttons([["获取演示验证码", "auth-code-requested", "primary"]])}<p class="caption">原型不发送短信。获取验证码不代表同意协议，之后会单独请你确认。</p></div>`;
    if (item.id === "AUTH-02") return head(item, "VERIFY") + `<div class="stack"><p class="caption">演示手机号 ${esc((state.authPhone || "13800000000").replace(/^(\d{3})\d{4}(\d{4})$/, "$1 **** $2"))} · 未发送真实短信</p><label class="field-label">演示验证码<input id="auth-code" class="field" inputmode="numeric" value="682106" aria-label="验证码"></label><p class="caption">此原型固定使用 682106，不进行真实身份验证。</p>${buttons([["确认演示登录", "auth-verified", "primary"], ["返回修改手机号", "go:AUTH-01", "text-button"]])}</div>`;
    if (item.id === "LEGAL-01") { const accepted = state.toggles.legal && state.toggles.aiLegal; return head(item, "CONSENT") + `<div class="stack">${notice("先了解，再决定", "Halo 提供日常健康管理参考，不进行疾病诊断或紧急医疗判断。", "sage")}${setting("阅读用户协议", "原型摘要 · 正式版本待审定", "legal-read:agreement")}${setting("阅读隐私政策", "数据用途、权限与管理方式", "legal-read:privacy")}${toggle("legal", "我同意用户协议与隐私政策", "必需；阅读与勾选是独立操作")}${setting("阅读 AI 服务说明", "了解建议与记忆的适用边界", "legal-read:ai")}${toggle("aiLegal", "我同意 AI 服务说明", "必需；身体数据可在之后随时停止带入")}${!accepted ? notice("请先确认两项必需说明", "确认后才能继续设置权限。", "warm") : ""}${buttons([[accepted ? "同意并继续" : "确认后继续", accepted ? "legal-continue" : "", "primary", !accepted]])}</div>`; }
    if (item.id === "PERM-01") return head(item, "PERMISSIONS") + `<div class="stack">${toggle("bluetooth", "蓝牙", "连接戒指与同步数据")}${toggle("notification", "通知", "睡前、唤醒与报告提醒")}${toggle("healthAccess", "健康数据", "仅在你授权后读取或写入")}${!state.toggles.bluetooth ? notice("蓝牙已关闭", "不会扫描、同步或主动测量；已保存的数据和绑定关系仍保留。", "warm") : ""}${!state.toggles.notification ? notice("通知已关闭", "睡前、报告和唤醒提醒不会发出。你仍可在 App 内查看内容。", "warm") : ""}${notice(isHardwareActive() ? "权限不会改变绑定关系" : "可以稍后连接戒指", isHardwareActive() ? "修改权限或返回 App 不会解绑戒指。" : "你已经是 Halo Member，可以先进入 App。激活 Halo Ring 后，再开始记录身体数据和会员成长。", "sage")}${buttons([[isHardwareActive() ? "查看我的戒指" : "连接 Halo Ring", "permission-connect", "primary"], [isHardwareActive() ? "完成，返回 App" : "暂不连接，进入 App", "permission-skip", "secondary"]])}</div>`;
    if (item.id === "ONB-02") {
      const data = currentDataLifecycle("accumulating");
      return `${head(item, "BODY WEATHER")}<div class="stack"><section class="body-weather" style="min-height:210px" data-copy-variant="${esc(data.copyVariant)}"><span class="label">BODY WEATHER · ${esc(data.label)}</span><h2>${esc(data.headline)}</h2><p>${esc(data.summary)}</p></section>${lifecycle("accumulating", "Body Weather 数据状态")}${notice("照常生活就好", "不用为了记录改变作息；每次同步后，进度会自动更新。", "sage")}${buttons([["看看怎样戴得更稳", "go:DEV-10", "primary"], ["先去今日", "go:TOD-01", "secondary"]])}</div>`;
    }
    return generic(item);
  }

  function device(item) {
    if (["DEV-10", "DEV-11", "DEV-12"].includes(item.id) && !isHardwareActive() && !(item.id === "DEV-12" && state.deviceResetStatus === "complete")) {
      const copy = membershipCopy();
    return `${head(item, "MY RING")}<div class="stack"><section class="device-empty-state">${haloStatus("disconnected", "hero", "status-detail")}<h2>${esc(copy.device)}</h2><p>${state.membershipHardwareState === "unbound-retained" ? "设备历史和会员资产仍保留；重新绑定并激活后只恢复未来成长。" : "绑定并激活 Halo Ring 后，才会显示设备数据和健康功能。"}</p></section>${buttons([[copy.action, "go:DEV-01", "primary"]])}${notice("设备数据尚未开始", "绑定前不会显示电量、最后连接、固件或健康数据。")}</div>`;
    }
    const map = {
      "DEV-01": () => `${head(item, "YOUR RING")}<div class="gated device-hero">${haloStatus("disconnected", "hero", "status-detail")}<h2>连接你的 Halo Ring</h2><p class="caption">打开蓝牙，并将戒指放在手机附近。暂时断连不会影响已经保存的数据。</p></div>${buttons([["开始查找", "device-status:connecting", "primary"], ["连接帮助", "go:HELP-01", "secondary"]])}`,
      "DEV-02": () => `${head(item, "SEARCHING")}<div class="stack">${state.toggles.bluetooth ? `${haloStatus("connecting", "hero", "status-detail")}${notice("附近戒指 · 原型演示", "实际产品需通过系统蓝牙扫描，请按设备尾号确认。", "sage")}${setting("HALO RING · 7A21", "演示设备", "go:DEV-03", "选择")}${buttons([["重新扫描", "device-status:connecting", "secondary"]])}` : `${notice("请先开启蓝牙", "蓝牙关闭时无法发现戒指，不会显示扫描结果。", "warm")}${buttons([["设置蓝牙权限", "go:PERM-01", "primary"]])}`}</div>`,
      "DEV-03": () => `${head(item, "BIND")}<div class="stack">${haloStatus("connecting", "hero", "status-detail")}${rows([["设备", "HALO RING · 7A21"], ["账号", (state.authPhone || "13800000000").replace(/^(\d{3})\d{4}(\d{4})$/, "$1 **** $2")], ["系统配对", state.devicePaired ? "演示配对已确认" : "等待确认"]])}${notice("完成系统配对", "确认配对后才能继续。本原型仅演示流程，不会操作真实蓝牙设备。", "sage")}${buttons([["确认演示配对", "device-pair-confirm", "primary"], ["返回选择", "go:DEV-02", "secondary"]])}</div>`,
      "DEV-04": () => `${head(item, "HOW TO WEAR")}<div class="stack"><section class="wearing-guide"><div class="wearing-orbit">${haloStatus("connected", "compact", "status-detail")}</div><ol><li><strong>贴近指腹</strong><span>内侧传感器稳定接触指腹中间，不需要额外勒紧。</span></li><li><strong>方向稳定</strong><span>让内侧标记朝向掌心，夜间与日常都保持同一方向。</span></li><li><strong>清洁干燥</strong><span>洗手或运动后擦干戒指内侧，再继续佩戴即可。</span></li></ol></section>${buttons([["我已佩戴好", "go:DEV-05", "primary"]])}</div>`,
      "DEV-05": () => `${head(item, "FIRST SYNC")}<div class="stack">${haloStatus("syncing", "hero", "status-detail")}${metrics([["同步进度", "72%", "预计还需 1 分钟"]])}<div class="progress"><i style="width:72%"></i></div>${rows([["设备信息", "已完成"], ["最近记录", "同步中"], ["能力确认", "等待中"]])}${buttons([["完成同步并激活", "activate-hardware", "primary"], ["稍后继续", "go:TOD-01", "secondary"]])}</div>`,
      "DEV-10": () => `${head(item, "MY HALO HARDWARE")}<div class="stack">${haloStatus(state.deviceStatus, "hero", "status-detail")}${segmented([["connected","已连接"],["connecting","连接中"],["syncing","同步中"],["disconnected","未连接"],["low","低电量"],["action","需处理"]], state.deviceStatus, "device-status")}${rows([["当前设备", "HALO RING · 7A21"], ["同账号设备", "1 款 · 当前演示设备"], ["电量", state.deviceStatus === "low" ? "18%" : "76%"], ["最后连接", state.deviceStatus === "connecting" ? "正在尝试" : "今天 08:42"], ["连接手机", "本机 iPhone"], ["最后同步", state.deviceStatus === "syncing" ? "正在更新" : "08:43"]])}${notice("多款设备不会重复奖励", "同一账号完成同一项通用任务，只记录一次 HALO成长值、Halo Points 和徽章进度。设备专属任务会在活动页单独说明。", "sage")}${quality("HALO RING · 7A21", deviceQualityLabel(state.deviceStatus), state.deviceStatus === "syncing" ? "正在更新" : "08:43 更新")}${toggle("location", "最后位置线索", "关闭时不申请位置；开启后仅在戒指与 App 连接时记录手机位置")}${state.toggles.location ? notice("位置已单独授权", "最后线索：今天 08:42 · 静安区附近。它不是实时定位，也不能让戒指响铃或亮灯。", "sage") : buttons([["单独授权位置", "request-location", "secondary"]])}${setting("设备信息与固件", "版本、可用数据与更新状态", "go:DEV-11")}${setting("佩戴引导", "方向与日常护理", "go:DEV-04")}${setting("高级设备操作", "清缓存、重置步数、恢复出厂", "go:DEV-12")}</div>`,
      "DEV-11": () => `${head(item, "DEVICE INFO")}<div class="stack">${rows([["设备名称", "HALO RING · 7A21"], ["电量", "76%"], ["固件版本", state.firmwareStatus === "current" ? "1.1.0" : "1.0.8"], ["硬件版本", "R01"], ["绑定状态", "当前账号"]])}${firmwarePanel()}${card("当前可用数据", "睡眠、心率、HRV、呼吸率与活动；血氧和皮肤温度仅在设备支持且数据可用时显示。", "CAPABILITY")}</div>`,
      "DEV-12": () => `${head(item, "ADVANCED")}<div class="stack">${state.deviceResetStatus === "pending" ? `${notice("正在等待设备确认", "本原型不会实际清除戒指，可继续演示设备确认，或取消此次操作。", "warm")}${buttons([["演示设备确认完成", "device-reset-complete", "primary"], ["取消重置", "device-reset-cancel", "secondary"]])}` : state.deviceResetStatus === "complete" ? `${notice("演示重置已完成", "戒指已从当前原型解绑；历史记录和合法会员资产仍保留。真实设备操作需连接设备确认。", "sage")}${buttons([["重新连接戒指", "permission-connect", "primary"]])}` : `${notice("操作前请确认", "以下操作影响戒指内记录或设置。本原型只演示确认流程，不操作真实设备。", "danger")}${setting("清空戒指缓存", "已同步至手机的数据不会删除", "danger:清空戒指缓存:将删除戒指内尚未同步的原始记录，手机本地历史不受影响。:确认清空")}${setting("重置今日步数", "只重置戒指端今日累计", "danger:重置今日步数:此操作会清零戒指端今天的步数，历史天数据不变。:确认重置")}${setting("恢复出厂设置", "解除绑定并清除戒指端设置", "danger:恢复出厂设置:戒指将解除绑定并清除本机设置。手机本地记录和 Halo 账号不会自动删除。:恢复出厂")}`}${state.deviceOperationHistory.length ? card("最近设备操作", state.deviceOperationHistory[0].label, new Date(state.deviceOperationHistory[0].at).toLocaleString("zh-CN")) : ""}</div>`,
    };
    return map[item.id]?.() || generic(item);
  }

  function todayWeatherHome(item) {
    const weather = currentBodyWeather();
    const canInterpret = state.dataLifecycle === "interpretable";
    const dataState = currentDataLifecycle();
    const title = canInterpret ? weather.homeTitle : dataState.headline;
    const body = canInterpret ? weather.homeBody : dataState.summary;
    const signals = canInterpret ? weather.signals : dataState.signals;
    const mainAction = canInterpret ? "看看今天怎么安排" : "看看还差几天";
    const tonightTitle = canInterpret ? weather.nightTitle : "今晚先选一段喜欢的内容";
    const tonightBody = canInterpret ? weather.nightBody : "Body Weather 还没生成，睡前内容仍然可以正常播放。";
    const copyVariant = canInterpret ? weather.copyVariant : dataState.copyVariant;
    return `${head(item, new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", month: "long", day: "numeric", weekday: "short" }).format(new Date()))}<div class="stack"><button class="body-weather visual-weather" data-action="go:TOD-03" data-copy-variant="${esc(copyVariant)}"><img class="weather-symbol" src="${HALO_SYMBOL}" alt=""><span class="label">BODY WEATHER · ${esc(canInterpret ? weather.label : dataState.label)}</span><h2>${esc(title)}</h2><p>${esc(body)}</p>${canInterpret ? miniSparkline([58,54,67,61,72,65,69], "gold", "最近 7 天 Body Weather 变化") : ""}</button>${visualSignalCards(signals)}${buttons([[mainAction, "go:TOD-03", "primary"]])}${dailyInspirationCard()}${card(tonightTitle, canInterpret ? "12 分钟 · 身体扫描" : "3 项基础内容", canInterpret ? "HALO SUGGESTS" : "TONIGHT", "go:NIG-01")}${setting("健康数据", canInterpret ? "6 项趋势与测量" : "查看数据进度与可用项目", "go:HLT-00")}${setting("Halo Studio", "预约与最近体验", "go:STU-08")}</div>`;
  }

  function unreadyHealthPage(item) {
    const data = currentDataLifecycle();
    const recorded = { none: 0, accumulating: 3, baseline: 5, limited: 0 }[state.dataLifecycle] || 0;
    return `${head(item, item.id === "TOD-09" ? "REPORTS" : "DATA PROGRESS")}<div class="stack">${notice(data.headline, data.summary, "sage")}${item.id === "TOD-09" ? radialProgress(Math.round(recorded / 14 * 100), `${recorded} / 14`, "首份 14 晚报告", "完整记录达到要求后生成") : ""}${lifecycle(state.dataLifecycle, "当前记录进度")}${quality("Halo Ring")}${notice("暂不展示健康趋势", "记录不足或不完整时，不用示例值替代你的数据。用户记录仍可查看和补充。")}${retainedUserRecords()}${buttons([["查看设备与同步", "go:DEV-10", "primary"], ["返回今日", "go:TOD-01", "secondary"]])}</div>`;
  }

  function today(item) {
    if (item.id === "TOD-01" && !isHardwareActive()) return unboundToday(item);
    if (["TOD-03", "TOD-04", "TOD-05", "TOD-06", "TOD-07", "TOD-09", "TOD-10", "TOD-11"].includes(item.id) && !isHardwareActive()) return unboundHealthDetail(item);
    if (["TOD-04", "TOD-09", "TOD-11"].includes(item.id) && state.dataLifecycle !== "interpretable") return unreadyHealthPage(item);
    const map = {
      "TOD-01": () => todayWeatherHome(item),
      "TOD-02": () => `${head(item, "QUICK CHECK-IN")}<div class="stack">${notice("此刻更接近哪些感受？", "可多选，只做轻记录，不评价你今天做得好不好。记录在解绑和重新绑定后仍保留。", "sage")}${state.recordDraft.reportMonth ? notice(`${Number(state.recordDraft.reportMonth.slice(5))} 月回顾反馈`, "选一个感受或写下想法，保存后会与这份回顾一起保留。", "sage") : ""}${subjectiveMarkers()}${state.subjectiveMarkers.length ? rows([["已保存的记录标签", state.subjectiveMarkers.join("、")], ["数据作用", "趋势回看 · 不改写设备数据"]]) : ""}${buttons([["保存并返回", "record-save", "primary"], ["返回今日", "go:TOD-01", "secondary"]])}</div>`,
      "TOD-03": () => healthDetail(item, {
        eyebrow: "BODY WEATHER",
        allowCorrection: true,
        copyVariant: currentBodyWeather().copyVariant,
        statusLabel: currentBodyWeather().label,
        conclusion: currentBodyWeather().homeTitle,
        summary: currentBodyWeather().detailSummary,
        why: currentBodyWeather().why,
        reasonExtra: setting("白天的压力变化", `${currentBodyWeather().pressure} · 查看全天记录`, "info:stress"),
        data: rows(currentBodyWeather().signals),
        dataTitle: "今天先看这三件事",
        trend: `${chartCard(`最近 ${state.trendPeriod} 天`, currentBodyWeather().trend, "gold")}${setting("查看完整趋势", "7 / 14 / 30 天与月度回顾", "go:TOD-04")}`,
        lifecycleTitle: "Body Weather 数据状态",
        source: "Halo Ring（用户记录仅用于趋势对照）",
        quality: "昨晚记录完整",
        updated: "07:42",
        actionTitle: currentBodyWeather().actionTitle,
        actionBody: currentBodyWeather().actionBody,
        actions: [["查看今晚建议", "go:NIG-01", "primary"], ["分享今天状态", "go:TOD-10", "secondary"], ["和 Halo 聊聊", "go:HAL-01", "text-button"]],
      }),
      "TOD-04": () => { const days = Number(state.trendPeriod); const bars = days === 30 ? [56,62,52,66,64,71,68,72,69,74] : days === 14 ? [58,63,55,66,61,70,68,72,65,76,71,74,73,78] : [62,48,76,58,83,70,78]; const labels = days === 7 ? ["四","五","六","日","一","二","今"] : bars.map((_,i)=> i === bars.length - 1 ? "今" : `${i+1}`); const distribution = days === 30 ? [["修复",4,"restore"],["缓行",10,"slow"],["平衡",11,"balance"],["活力",5,"active"]] : [["修复",1,"restore"],["缓行",days===14?5:3,"slow"],["平衡",days===14?6:2,"balance"],["活力",days===14?2:1,"active"]]; return `${head(item, `${days} DAY TREND`)}<div class="stack">${segmented([["7","7 天"],["14","14 天"],["30","30 天"]], state.trendPeriod, "trend")}${chartCard("这段时间的 Body Weather", `最近 ${days} 天，平衡日和缓行日最多`, "gold")}${weatherDistribution(distribution)}${trendRecordControl(days)}<div class="trend-chart-wrap"><div class="bar-chart">${bars.map((h,i)=>`<span class="${i===bars.length-1?"active":""}" style="height:${h}%"><i>${labels[i]}</i></span>`).join("")}</div>${trendRecordNodes(days)}</div>${days === 30 ? monthlyReport() : ""}<p class="health-boundary">这张图用来回看近期变化，不代表疾病风险或训练成绩。</p></div>`; },
      "TOD-05": () => healthDetail(item, {
        eyebrow: "LAST NIGHT",
        statusLabel: "昨夜睡眠",
        conclusion: "昨晚睡得不算少，但中间醒了两次",
        summary: "总时长接近平时，睡眠被打断得多一些。今天如果觉得困，先相信自己的感受。",
        why: "总睡眠 6 小时 42 分，比你近两周平均少 36 分钟；夜里清醒 2 次，共 34 分钟。",
        data: `${metrics([["总睡眠", "6h 42m", "比平时少 36 分"], ["睡眠效率", "86%", "记录完整"], ["清醒", "34m", "夜醒 2 次"]])}<section class="card"><div class="data-heading"><strong>睡眠阶段</strong><span>23:41 - 07:18</span></div><div class="sleep-timeline"><span class="light" style="flex:3"></span><span class="deep" style="flex:2"></span><span class="light" style="flex:4"></span><span class="rem" style="flex:2"></span><span class="awake" style="flex:.7"></span><span class="light" style="flex:3"></span><span class="rem" style="flex:2"></span></div><p>深睡 1h 14m · REM 1h 36m · 清醒 34m</p></section>`,
        dataTitle: "昨晚的几个重点",
        trend: chartCard(`最近 ${state.trendPeriod} 晚`, "最近几晚比月初睡得更连贯"),
        trendTitle: "和最近几晚比",
        lifecycleTitle: "睡眠数据状态",
        source: "Halo Ring",
        quality: "昨晚记录完整 93%",
        updated: "07:22",
        actionSectionTitle: "今晚可以怎么做",
        actionTitle: "今晚按平时时间上床",
        actionBody: "睡前少刷一会儿手机就够了，不用为了补觉提前很久躺下。",
        actions: [["进入今晚建议", "go:NIG-01", "primary"], ["调整睡眠目标", "go:SET-02", "secondary"]],
      }),
      "TOD-06": () => healthDetail(item, {
        eyebrow: "BODY ENERGY",
        statusLabel: "今日状态",
        conclusion: "今天可以照常安排",
        summary: "夜间 HRV 估算和静息心率都接近平时。昨晚睡得不够连贯，今天按计划进行，累了再减量。",
        why: "昨晚的夜间 HRV 估算为 42 毫秒，静息心率 58 次/分，都在你的常见范围内；睡眠比平时少 36 分钟。",
        data: `${baselineBand("夜间 HRV 估算", "42 ms", 54)}${metrics([["静息心率", "58 bpm", "和最近几天接近"], ["有效片段", "91%", "已排除明显体动"]])}`,
        dataTitle: "昨晚的几个信号",
        educationTitle: "HRV 怎么看",
        educationExtra: hrvExplainer(),
        trend: chartCard(`最近 ${state.trendPeriod} 天 HRV 估算`, "只和你自己的夜间记录相比"),
        lifecycleTitle: "身体能量数据状态",
        source: "Halo Ring",
        quality: "夜间有效记录 91%",
        updated: "07:22",
        actionTitle: "先按原计划，累了就减量",
        actionBody: "工作和日常活动照常即可。如果下午明显疲惫，把高强度训练换成散步或拉伸。",
        actions: [["记录此刻感受", "go:TOD-02", "primary"], ["查看夜间支持", "go:NIG-01", "secondary"]],
      }),
      "TOD-07": () => healthDetail(item, {
        eyebrow: "ACTIVITY FIT",
        statusLabel: "今日活动",
        conclusion: "今天动一动就好，不用追数字",
        summary: "你已经有 46 分钟轻量活动。接下来散步、拉伸或轻松瑜伽就够了。",
        why: "最近 7 天以中低强度活动为主；昨晚睡眠略少，今天没有必要再补一段高强度训练。",
        data: `${metrics([["步数", "4,862", "日常活动"], ["活动消耗", "284", "千卡"], ["久坐提醒", "1 次", "今日"]])}${activityMix([["轻量",46,"light"],["中等",14,"medium"],["较高",4,"high"]])}`,
        dataTitle: "今天已经动了多少",
        trend: chartCard(`最近 ${state.trendPeriod} 天活动`, "大多数天以中低强度为主", "gold"),
        lifecycleTitle: "活动数据状态",
        lifecycleOverride: { needed: "当前已完成 5 / 7 个有效佩戴日；继续积累日间活动记录。", next: "保持日常佩戴，完成同步后会更新活动趋势。" },
        source: "Halo Ring + 手机",
        quality: "当天记录完整 89%",
        updated: "08:44",
        actionTitle: "选一种舒服的方式动一动",
        actionBody: "散步、拉伸或轻松瑜伽都可以。今天不需要为了完成数字再加练。",
        actions: [["记录完成感受", "go:TOD-02", "primary"], ["查看身体天气", "go:TOD-03", "secondary"]],
      }),
      "TOD-08": () => nightReviewPage(item),
      "TOD-09": () => `${head(item, "REPORTS")}<div class="stack">${radialProgress(64, "9 / 14", "首份 14 晚报告", "还差 5 个完整夜晚")}<details class="visual-disclosure"><summary><span class="data-symbol baseline" aria-hidden="true"><img src="${HALO_SYMBOL}" alt=""></span><div><strong>Body Weather 已经可以看</strong><small>更完整的睡眠回顾还差 5 晚</small></div><i aria-hidden="true">＋</i></summary><div class="visual-disclosure-body">${lifecycle("baseline", "14 晚报告进度", { label: "报告积累中", reason: "已经有 7 天记录，可以生成每天的 Body Weather；14 晚回顾还没有完成。", needed: "还差 5 个完整夜晚。", next: "继续戴着戒指睡觉，早上同步后会自动更新。" })}</div></details>${metrics([["日常状态","已可查看","已有 7 天记录"],["最近 9 晚","91%","记录完整度"]])}${chartCard("睡眠与夜间状态", "还在积累更长的趋势")}${card("8 月回顾", "有 30 天记录后生成", "30 DAY REPORT", "report-month:2026-08")}${buttons([["回看昨晚", "go:TOD-08", "primary"]])}</div>`,
      "TOD-10": () => `${head(item, "SHARE CARD")}<div class="stack">${shareCard()}<section class="share-editor"><span class="section-label">背景</span>${segmented([["mist","雾白"],["night","深夜"],["photo","相册"]], state.shareBackground, "share-bg")}${state.shareBackground === "photo" ? `<input id="share-photo-input" type="file" accept="image/*" hidden><button class="secondary" data-action="share-photo">选择相册图片</button>` : ""}<label class="field-label">缩放 <input id="share-zoom" type="range" min="80" max="125" value="${esc(state.shareZoom)}"></label><p class="caption">卡片只保留状态名称和一句状态说明，不显示心率、HRV、血氧、温度等敏感数值。</p></section>${buttons([["预览并分享", "share-preview", "primary"], ["复制文字", "share-copy", "secondary"]])}</div>`,
      "TOD-11": () => `${head(item, "DATA QUALITY")}<div class="stack">${lifecycle(state.dataLifecycle, "今天的数据进度")}${quality("Halo Ring", state.dataLifecycle === "limited" ? "昨晚缺少一段" : "昨晚记录完整", "08:42")}<section class="source-grid"><span><i>${domainIcon("sleep")}</i><b>睡眠</b><small>记录 93%</small></span><span><i>${domainIcon("energy")}</i><b>HRV</b><small>可查看</small></span><span><i>${domainIcon("activity")}</i><b>活动</b><small>已去重</small></span><span><i>${domainIcon("status")}</i><b>用户记录</b><small>${state.subjectiveMarkers.length ? `${state.subjectiveMarkers.length} 项` : "未带入"}</small></span></section><details class="visual-disclosure"><summary><span class="record-glyph" aria-hidden="true">i</span><div><strong>这些数据从哪来</strong><small>查看缺少的时段和计算方式</small></div><i aria-hidden="true">＋</i></summary><div class="visual-disclosure-body">${rows([["睡眠", "Halo Ring · 记录完整度 93%"], ["HRV", "Halo Ring · 夜间记录可查看"], ["活动", "Halo Ring + 手机 · 重复时段只算一次"], ["用户记录", state.subjectiveMarkers.length ? state.subjectiveMarkers.join("、") : "这次没有带入"]])}${notice("主要来自 Halo Ring", "主动测量、Apple 健康、Health Connect 和用户记录会单独标明，同一时段不会重复计算。", "sage")}${notice("为什么会少一段", "戒指暂时断连、摘下或运动干扰都可能造成缺口。只要没有解绑，7 天内同步成功后会补回实际发生的日期。")}${education("为什么要先了解你的平时水平", "同一个数字对每个人意义不同。Halo 会先看你的常见范围，再说今天有没有变化。")}</div></details>${buttons([["重新同步", "toast:已开始重新同步", "secondary"], ["看看戒指怎么了", "go:DEV-10", "secondary"]])}<p class="health-boundary">用于日常健康管理，不替代医疗诊断。</p></div>`,
    };
    return map[item.id]?.() || generic(item);
  }

  function health(item) {
    if (!isHardwareActive()) return unboundHealthDetail(item);
    const map = {
      "HLT-00": () => { const canInterpret = state.dataLifecycle === "interpretable"; const data = currentDataLifecycle(); const unavailable = `${notice(data.headline, data.summary, state.dataLifecycle === "limited" ? "warm" : "sage")}${lifecycle(state.dataLifecycle, "健康数据进度")}<section class="health-metric-list">${setting("睡眠", "有可用记录后显示", "go:TOD-05", "等待数据")}${setting("心率", "有可用记录后显示", "go:HLT-01", "等待数据")}${setting("活动", "仍可手动记录感受", "go:TOD-02", "暂无趋势")}${setting("主动测量", "需要时可单独测量", "go:HLT-03", "开始")}</section>`; const available = `<section class="health-overview-head"><div><span>今天的数据</span><strong>6 项都已更新</strong></div>${miniSparkline([55,59,57,66,64,70,68], "sage", "最近 7 天有效记录变化")}</section><details class="visual-disclosure"><summary><span class="data-symbol ${esc(state.dataLifecycle)}" aria-hidden="true"><img src="${HALO_SYMBOL}" alt=""></span><div><strong>数据完整，可以查看</strong><small>睡眠与夜间信号已同步</small></div><i aria-hidden="true">＋</i></summary><div class="visual-disclosure-body">${lifecycle(state.dataLifecycle, "Body Weather 数据进度")}${quality("Halo Ring", "睡眠与夜间信号可用", "刚刚同步")}</div></details><section class="health-metric-list">${setting("24 小时心率", "看看今天怎么变化", "go:HLT-01", "72")}${setting("夜间呼吸率", "看看最近几晚", "go:HLT-02", "15.2")}${setting("活动与消耗", "今天已经动了多少", "go:TOD-07", "今日")}${setting("主动测量", "心率 / HRV 等", "go:HLT-03", "开始")}${setting("血氧", "昨晚的变化", "go:HLT-05", "98%")}${setting("皮肤温度", "和你的平时比", "go:HLT-06", "+0.2°")}</section>`; return `${head(item, "HEALTH DATA")}<div class="stack">${canInterpret ? available : unavailable}${setting("我的报告", "14 晚报告与月度回顾", "go:TOD-09")}<p class="health-boundary">连续变化比单个数字更有参考价值。本页不替代医疗诊断。</p></div>`; },
      "HLT-01": () => healthDetail(item, {
        eyebrow: "24H HEART RATE",
        statusLabel: "今日心率",
        conclusion: "今天的心率随活动起落，休息后回到平时范围",
        summary: "走动时升高，坐下休息后回落。先看一整天的变化，不必盯着某一个数字。",
        why: "活动时最高 128 次/分，休息后回到 72 次/分；没有看到持续偏离你常见范围的时段。",
        data: `${metrics([["当前", "72 bpm", "5 分钟前"], ["静息", "61 bpm", "日间"], ["今日范围", "42-128", "次/分"]])}${rows([["夜间平均", "58 次/分"], ["日间静息", "61 次/分"], ["个人常见范围", "56-76 次/分"]])}`,
        dataTitle: "今天的几个数字",
        trend: chartCard(`最近 ${state.trendPeriod} 天同一时段`, "和往常差不多"),
        lifecycleTitle: "心率数据状态",
        lifecycleOverride: { needed: "完成当天主要清醒时段的有效佩戴，才能形成连续趋势。", next: "继续日常佩戴；运动和静息时段会分开解释。" },
        source: "Halo Ring",
        quality: "全天记录完整 91%",
        updated: "08:42",
        actionTitle: "现在没有特别要做的事",
        actionBody: "照常活动即可。如果持续心慌、胸闷或明显不适，请停止活动并及时寻求专业帮助。",
        actions: [["记录此刻感受", "go:TOD-02", "primary"], ["查看数据质量", "go:TOD-11", "secondary"]],
      }),
      "HLT-02": () => healthDetail(item, {
        eyebrow: "RESPIRATION",
        statusLabel: "昨夜呼吸",
        conclusion: "昨晚呼吸率大多在你的常见范围内",
        summary: "夜间平均 15.2 次/分，短时波动没有持续。单晚数据不能判断睡眠呼吸问题。",
        why: "有效记录覆盖 6 小时 18 分，大多数时段在 14.4–16.6 次/分之间。",
        data: metrics([["夜间平均", "15.2", "次/分"], ["夜间范围", "14.4-16.6", "次/分"], ["有效时段", "6h 18m", "覆盖 92%"]]),
        dataTitle: "昨晚的几个数字",
        trend: chartCard(`最近 ${state.trendPeriod} 晚呼吸率`, "大多在你的常见范围内"),
        trendTitle: "和最近几晚比",
        lifecycleTitle: "夜间呼吸率数据状态",
        source: "Halo Ring",
        quality: "昨晚记录完整 92%",
        updated: "07:22",
        actionTitle: "继续戴着睡，看看是不是连续变化",
        actionBody: "鼻塞、饮酒、运动和房间环境都可能让单晚数字变化。连续几晚的趋势更有参考价值。",
        actions: [["查看睡眠详情", "go:TOD-05", "primary"], ["查看数据质量", "go:TOD-11", "secondary"]],
      }),
      "HLT-03": () => renderMeasurementStart(item),
      "HLT-04": () => renderMeasurementResult(item),
      "HLT-05": () => healthDetail(item, {
        eyebrow: "BLOOD OXYGEN",
        statusLabel: "昨夜血氧",
        conclusion: "昨晚大多数血氧记录和往常接近",
        summary: "有效记录覆盖 88%。最低的一次是 94%，单个低点不代表整晚状态。",
        why: "夜间平均 98%，大多数记录没有明显变化；翻身和手部活动较多的时段没有纳入。",
        data: metrics([["夜间平均", "98%", "有效时段"], ["最低记录", "94%", "单次值"], ["有效覆盖", "88%", "已剔除体动"]]),
        dataTitle: "昨晚的几个数字",
        trend: chartCard(`最近 ${state.trendPeriod} 晚血氧`, "多数夜晚变化不大"),
        trendTitle: "和最近几晚比",
        lifecycleTitle: "血氧数据状态",
        source: "Halo Ring · 当前可用",
        quality: "昨晚记录完整 88%",
        updated: "07:22",
        actionTitle: "看连续趋势，别被一个低点吓到",
        actionBody: "这些记录用于日常观察，不能诊断睡眠呼吸暂停。如果持续不适，请及时寻求专业帮助。",
        actions: [["查看夜间呼吸", "go:HLT-02", "primary"], ["查看数据质量", "go:TOD-11", "secondary"]],
      }),
      "HLT-06": () => healthDetail(item, {
        eyebrow: "SKIN TEMPERATURE",
        statusLabel: "昨夜皮肤温度",
        conclusion: "昨晚皮肤温度和你的平时水平接近",
        summary: "相对平时高 0.2°C，仍在最近 7 晚的变化范围内。这里显示的不是体温计读数。",
        why: "昨晚相对变化为 +0.2°C，最近 7 晚在 -0.3°C 到 +0.4°C 之间，没有连续往同一方向变化。",
        data: metrics([["相对基线", "+0.2°C", "夜间皮肤温度"], ["7 夜范围", "-0.3~+0.4", "相对变化"], ["有效时长", "6h 36m", "覆盖 90%"]]),
        dataTitle: "昨晚的几个数字",
        trend: chartCard(`最近 ${state.trendPeriod} 晚皮肤温度`, "仍在你的常见变化范围内", "gold"),
        trendTitle: "和最近几晚比",
        lifecycleTitle: "皮肤温度数据状态",
        source: "Halo Ring · 当前可用",
        quality: "昨晚记录完整 90%",
        updated: "07:22",
        actionTitle: "今天不需要因为这个数字改变安排",
        actionBody: "房间温度和佩戴松紧都会影响皮肤温度。身体不舒服时，请以体温计和专业意见为准。",
        actions: [["记录此刻感受", "go:TOD-02", "primary"], ["查看数据质量", "go:TOD-11", "secondary"]],
      }),
    };
    return map[item.id]?.() || generic(item);
  }

  function night(item) {
    if (!isHardwareActive() && ["NIG-01", "NIG-02", "NIG-03", "NIG-05"].includes(item.id)) return unboundNight(item);
    if (!isHardwareActive() && ["NIG-06", "NIG-07", "NIG-08", "NIG-11", "NIG-12"].includes(item.id)) return `${head(item, "NIGHT SETTINGS")}${notice("先使用公共内容放松一下", "当前未激活硬件，不启用入睡检测或浅睡窗口。播放与历史记录仍可使用。", "sage")}${buttons([["选择公共内容", "go:NIG-01", "primary"]])}`;
    const selected = currentNightContent();
    const wake = state.wakeSettings;
    const wakeLabel = wake.enabled && state.toggles.notification ? `最晚 ${wake.time} · ${wake.sound}` : wake.enabled ? "通知已关闭，请检查唤醒权限" : "已关闭";
    const playing = state.nightSession;
    const position = nightPosition();
    const playerContent = playing ? { duration: playing.duration } : selected;
    const content = {
      "NIG-01": () => `${head(item, "TONIGHT", '<button class="head-action" data-action="go:NIG-10" aria-label="播放历史">⌁</button>')}<div class="night-hero visual-night-hero"><div class="night-orbit"><span class="night-symbol-track" aria-hidden="true"></span><img src="${HALO_SYMBOL_IVORY}" alt=""><strong>CALM · 安静</strong></div><h2>${esc(currentNightCopy().title)}</h2><p>${esc(selected.title)}</p><div class="night-facts"><span><i>${selected.duration}</i>分钟</span><span><i>${domainIcon("sleep")}</i>${selected.format}</span><span><i>${domainIcon("time")}</i>${esc(wakeLabel)}</span></div></div>${buttons([["开始播放", "night-start", "primary"], ["换一段", "go:NIG-03", "secondary"]])}${playing && playing.status !== "ended" ? setting("继续正在听的内容", playing.title, "go:NIG-04") : ""}${setting("了解这段内容", `${selected.duration} 分钟 · ${selected.sound}`, "go:NIG-02")}${setting("今晚播放顺序", selected.title, "go:NIG-05")}${setting("睡着后自动渐弱", state.toggles.sleepFade ? "信号不可用时按计时执行" : "保持当前音量，直到结束", "go:NIG-12", state.toggles.sleepFade ? "已开启" : "已关闭")}${setting("明早怎么叫醒", wakeLabel, "go:NIG-06")}`,
      "NIG-02": () => `${head(item, "CONTENT")}<div class="stack">${card(selected.title, currentNightCopy().detailIntro, `${selected.duration} MIN · ${selected.format}`)}${rows([["怎么听", selected.format], ["多长", `${selected.duration} 分钟`], ["适合什么时候", selected.fit], ["声音", selected.sound]])}${notice("这段内容能做什么", "用于日常放松，不用于治疗失眠或焦虑。")}${buttons([["查看播放演示", "night-preview", "secondary"], ["今晚就听这段", "night-start", "primary"]])}</div>`,
      "NIG-03": () => `${head(item, "CHOOSE ANOTHER")}<div class="stack">${choice("nightChoice", "scan", "安静身体扫描", "12 分钟 · 引导较少")}${choice("nightChoice", "breath", "呼吸慢下来", "8 分钟 · 呼吸节律")}${choice("nightChoice", "sound", "夜间白噪音", "30 分钟 · 无引导声音")}${buttons([["使用这个", "go:NIG-01", "primary"]])}</div>`,
      "NIG-04": () => playing && playing.status !== "ended" ? `${head(item, "NOW PLAYING")}<div class="player-orbit visual-player"><button data-action="toggle-player" aria-label="${state.playing ? "暂停" : "继续播放"}">${state.playing ? "Ⅱ" : "▶"}</button>${waveform(state.playing)}</div><div class="player-meta"><span class="eyebrow">${state.playing ? "正在播放" : "已暂停"} · ${Math.floor(position / 60)}:${String(position % 60).padStart(2, "0")} / ${playerContent.duration}:00</span><h2>${esc(playing.title)}</h2>${playing.appendNoise ? `<p id="night-current-part">${position >= playing.primaryDuration * 60 ? "接续白噪音 · 20分钟" : `第一段 ${playing.primaryDuration}分钟，接白噪音20分钟`}</p>` : ""}<p>${playing.fadeEnabled ? "自动渐弱已开启" : "自动渐弱已关闭"}</p></div><div class="progress" style="margin:18px 0"><i style="width:${Math.round(position / (playerContent.duration * 60) * 100)}%"></i></div>${notice("播放交互演示", "本地原型记录进度和操作，不输出真实音频，也不会设置系统闹钟。")}${buttons([[state.playing ? "暂停" : "继续播放", "toggle-player", "primary"], ["结束本次播放", "night-end", "secondary"]])}` : `${head(item, "NOW PLAYING")}${notice("还没有正在播放的内容", "选一段内容后，再开始播放。")}${buttons([["选择内容", "go:NIG-01", "primary"]])}`,
      "NIG-05": () => `${head(item, "TONIGHT SEQUENCE")}<div class="stack">${rows([["先播放", `${selected.title} · ${selected.duration} 分钟`], ["接下来", state.toggles.nightTail ? "无引导白噪音 · 20 分钟" : "播放结束后停止"]])}${toggle("nightTail", "结束后继续白噪音", "第一段结束后接20分钟白噪音；关闭后只播放第一段")}${buttons([["调整第一段", "go:NIG-03", "secondary"], ["按这个顺序播放", "night-start", "primary"]])}</div>`,
      "NIG-06": () => `${head(item, "WAKE WINDOW")}<div class="stack"><label class="field-label">最晚唤醒时间<input id="wake-time" class="field" type="time" value="${esc(state.wakeDraft.time)}"></label><label class="field-label">浅睡窗口<select id="wake-window" class="field">${["30", "20"].map((v) => `<option value="${v}" ${state.wakeDraft.window === v ? "selected" : ""}>前 ${v} 分钟</option>`).join("")}</select></label>${setting("唤醒声音", "选择声音", "go:NIG-07", state.wakeDraft.sound)}${toggle("wake", "智能唤醒", "设置一个唤醒窗口，并保留最晚时间")}${!state.toggles.notification ? notice("通知权限已关闭", "原型不会创建真实闹钟；正式 App 需开启必要权限后确认是否设置成功。", "warm") : ""}${state.wakeSaved ? notice("唤醒设置已保存", `已保存 ${wake.time}、前 ${wake.window} 分钟窗口和${wake.sound}。本地原型不会实际响铃。`, "sage") : ""}${buttons([["保存设置", "wake-save", "primary"]])}</div>`,
      "NIG-07": () => `${head(item, "WAKE SOUND")}<div class="stack">${["晨雾", "微光", "清泉", "柔和铃音"].map((sound) => `<button class="choice-row ${state.wakeDraft.sound === sound ? "selected" : ""}" data-action="sound:${sound}"><span><strong>${sound}</strong><p>选择这个声音</p></span><i></i></button>`).join("")}${notice("声音选择演示", "当前原型不输出音频。")}${buttons([["使用所选声音", "wake-sound-confirm", "primary"]])}</div>`,
      "NIG-08": () => !wake.enabled || !state.toggles.notification ? `${head(item, "WAKE PREVIEW")}${notice("当前不会发出唤醒提醒", "唤醒设置已保留，请检查开关与通知权限。", "warm")}${buttons([["检查唤醒设置", "go:NIG-06", "primary"]])}` : `<div class="gated" style="padding-top:80px"><span class="eyebrow">WAKE PREVIEW</span><h1 style="font-size:58px;margin:14px 0">${esc(state.snoozeUntil || wake.time)}</h1><p class="caption">唤醒界面演示 · ${state.snoozeUntil ? "已延后 5 分钟" : `最晚 ${wake.time}`}</p></div>${buttons([["关闭闹钟", "go:NIG-09", "primary"], ["再睡 5 分钟", "wake-snooze", "secondary"]])}`,
      "NIG-09": () => `${head(item, "GOOD MORNING")}<div class="stack">${notice("早上好", "有新的同步记录时，今日页面会更新；没有数据时不生成健康结论。", "sage")}${buttons([["看看今天的状态", "go:TOD-01", "primary"], ["回看播放记录", "go:NIG-10", "secondary"]])}</div>`,
      "NIG-10": () => `${head(item, "RECENT NIGHTS")}<div class="stack">${state.nightHistory.length ? state.nightHistory.map((entry) => card(entry.title, `${experienceTime(entry.endedAt)} · 听了 ${Math.floor(entry.positionSeconds / 60)} 分 ${entry.positionSeconds % 60} 秒`, entry.review?.saved ? "已复盘" : "播放已结束", `night-history:${entry.id}`)).join("") : notice("还没有播放记录", "结束一次播放后，会按本次内容与时间保存在这里。", "sage")}${buttons([["选择今晚内容", "go:NIG-01", "secondary"]])}</div>`,
      "NIG-11": () => `${head(item, "NIGHT SUPPORT")}<div class="stack">${haloStatus(state.deviceStatus, "hero", "status-detail")}${notice("连接变化不会删除已保存记录", `当前唤醒设置：${wakeLabel}。渐弱${state.toggles.sleepFade ? "已开启" : "已关闭"}。`, "sage")}${notice("原型能力边界", "锁屏播放、后台音频和系统闹钟需在原生 App 中单独验证。")}${buttons([["继续今晚", "go:NIG-04", "primary"], ["查看连接状态", "go:DEV-10", "secondary"]])}</div>`,
      "NIG-12": () => `${head(item, "SMART SLEEP LINK")}<div class="stack">${toggle("sleepFade", "检测到可能入睡后渐弱", "开启后，信号不可用时按手机计时；关闭后保持音量直到播放结束")}${setting("浅睡窗口唤醒", wakeLabel, "go:NIG-06")}${notice("设置分别生效", "关闭渐弱不会开启或关闭闹钟；修改唤醒时间后，请在唤醒页保存。", "sage")}</div>`,
    };
    return `<div class="night-screen">${content[item.id]?.() || generic(item)}</div>`;
  }

  function haloConversationTitle(id = state.activeConversationId) {
    return state.conversations.find((entry) => entry.id === id && entry.status !== "deleted")?.title || "新的对话";
  }
  function haloConversationStarter(id = state.activeConversationId) {
    return state.conversations.find((entry) => entry.id === id && entry.status !== "deleted")?.messages.map((message) => ({ ...message })) || [];
  }
  function haloHeaderActions() {
    return `<button class="head-action halo-head-icon" data-action="go:HAL-02">${domainIcon("time")}</button><button class="head-action" data-action="go:HAL-08">•••</button>`;
  }
  function haloRecentConversation() {
    if (state.chat.length || !["active", "paused"].includes(state.conversationStatus)) return "";
    return `<button class="halo-resume" data-action="resume-conversation:${esc(state.activeConversationId)}"><span>${domainIcon("time")}</span><span><small>继续上次</small><strong>${esc(haloConversationTitle())}</strong></span><i aria-hidden="true">›</i></button>`;
  }
  function haloJourneyNudge() {
    const resumableConversation = ["active", "paused"].includes(state.conversationStatus);
    if (state.chat.length || resumableConversation || state.journeyPaused || state.journeyDecision === "unsuitable" || state.journeyProgress <= 0 || state.journeyProgress >= 7) return "";
    const step = currentJourneyStep();
    return `<button class="halo-journey-nudge" data-action="go:HAL-06"><span class="journey-nudge-icon" aria-hidden="true">${domainIcon("activity")}</span><span><small>${state.journeyDecision === "deferred" ? "今天已先放下" : `今天的小练习 · 第 ${state.journeyProgress + 1} / 7 天`}</small><strong>${esc(step.title)}</strong></span><i>${state.journeyDecision === "deferred" ? "查看" : "继续"}</i></button>`;
  }
  function haloToolsMenu() {
    if (!state.haloToolsOpen) return "";
    return `<div id="halo-tools" class="halo-tool-menu" role="group" aria-label="对话工具"><button data-action="halo-open-feeling"><span aria-hidden="true">${domainIcon("heart")}</span><strong>记录感受</strong></button><button data-action="halo-open-journey"><span aria-hidden="true">${domainIcon("activity")}</span><strong>我的小计划</strong></button></div>`;
  }
  function haloComposer(placeholder = "和 Halo 说说") {
    return `${haloToolsMenu()}<div class="composer halo-composer"><button class="composer-tool" data-action="halo-tools-toggle" aria-label="打开对话工具" aria-expanded="${state.haloToolsOpen}" aria-controls="halo-tools">＋</button><label class="sr-only" for="chat-input">发给 Halo 的消息</label><input id="chat-input" class="field" placeholder="${esc(placeholder)}"><button class="composer-send" data-action="send-chat">↑</button></div>`;
  }
  function haloMemoryPage(item) {
    const correctionBlock = state.aiCorrection.status === "saved"
      ? `<section class="memory-correction-card"><span>今天的用户纠正</span><strong>${esc(state.aiCorrection.reasonLabel)}</strong><p>原解释已停止作为你的实际感受，也不会自动成为跨会话记忆。</p>${state.aiCorrection.memoryReview ? `<div class="memory-check-result"><i aria-hidden="true">✓</i><div><b>相关记忆已检查</b><small>没有把“今天更容易累”保存成已确认事实；现有偏好记忆不会参与这次身体判断。</small></div></div>` : `<button class="secondary" data-action="ai-correction-check-memory">检查有没有相关记忆</button>`}<button class="text-button" data-action="ai-correction-reset">撤销这次纠正</button></section>`
      : "";
    const memories = !state.haloMemories.length
      ? notice("还没有 Halo 记忆", "新的内容只有在你确认后，才会跨会话使用。", "sage")
      : `${state.haloMemories.map((memory) => `<section class="card"><span class="section-label">${memory.confirmed ? "已确认记忆" : "记忆提案"}</span><h3>${esc(memory.text)}</h3><p>${memory.confirmed ? "由你确认，可以单独纠正或删除。" : "确认前不用于跨会话建议。"}</p>${buttons([...(memory.confirmed ? [] : [["确认这条记忆", `halo-memory-confirm:${memory.id}`, "primary"]]), ["纠正", `halo-memory-edit:${memory.id}`, "secondary"], ["删除这条", `halo-memory-delete:${memory.id}`, "danger-button"]])}</section>`).join("")}${buttons([["清空全部记忆", "danger:清空 Halo 记忆:这会删除已确认的跨会话偏好，不会删除原始健康记录。:确认清空", "danger-button"]])}`;
    return `${head(item, "MEMORY")}<div class="stack">${toggle("memory", "允许 Halo 使用已确认记忆", "只有你确认过的内容会跨会话使用")}${correctionBlock}${memories}</div>`;
  }
  function halo(item) {
    const haloCopy = currentHaloCopy();
    const haloPresence = (opening, subtitle) => `<section class="halo-presence${state.chat.length ? " has-chat" : ""}" data-copy-variant="${esc(haloCopy.copyVariant)}"><div class="halo-ip-portrait"><img src="${HALO_IP_DEFAULT}" width="1254" height="1254" alt="Halo 日常小花团"></div><div class="halo-presence-copy"><span>HALO</span><strong>${esc(opening)}</strong><small>${esc(subtitle)}</small></div></section>`;
    if (item.id === "HAL-01" && !isHardwareActive()) {
      const used = ensureHaloQuota().used;
      return `${head(item, "YOUR HALO", haloHeaderActions())}${haloPresence(haloCopy.unboundOpening, haloCopy.unboundSubtitle)}<div class="stack halo-conversation">${notice("今天还可发送 " + Math.max(0, 10 - used) + " 条消息", "每天北京时间 00:00 恢复为 10 条。Halo 可以陪你梳理想法，但不会判断身体状态或生成个性化报告。", "sage")}${haloRecentConversation()}${state.chat.length ? `<button class="context-pill" data-action="go:HAL-07">本次不参考身体状态　设置 ›</button>` : `<div class="suggestions"><button data-action="ask:陪我梳理一下今天的安排">陪我梳理今天的安排</button><button data-action="ask:给我一个睡前放松练习">给我一个睡前放松练习</button><button data-action="ask:先听我说一会儿">先听我说一会儿</button></div>`}${haloJourneyNudge()}<div id="chat-messages" class="stack">${state.chat.map((message) => `<div class="message ${message.role}">${esc(message.text)}</div>${message.safety ? haloSafetySupport() : ""}`).join("")}</div>${haloComposer("和 Halo 说说")}${buttons([["绑定 Halo Ring，参考身体状态", "go:DEV-01", "secondary"]])}</div>`;
    }
    const map = {
      "HAL-01": () => `${head(item, "YOUR HALO", haloHeaderActions())}${haloPresence(haloCopy.boundOpening, hasBodyContext() ? haloCopy.boundSubtitle : haloCopy.unboundSubtitle)}<div class="stack halo-conversation">${haloRecentConversation()}${haloContextPanel()}${haloJourneyNudge()}<div id="chat-messages" class="stack">${state.chat.map((m)=>`<div class="message ${m.role}">${esc(m.text)}</div>${m.safety ? haloSafetySupport() : ""}`).join("")}</div>${haloComposer()}</div>`,
      "HAL-02": () => { const labels = { active: "可继续", paused: "已暂停", archived: "已归档" }; const conversations = state.conversations.filter((entry) => entry.status !== "deleted" && entry.title.includes(state.conversationQuery)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); return `${head(item, "CONVERSATIONS")}<div class="stack"><label class="field-label">搜索会话<input id="conversation-search" class="field" placeholder="搜索会话" value="${esc(state.conversationQuery)}"></label>${conversations.map((entry) => card(entry.title, `${experienceTime(entry.updatedAt)} · ${labels[entry.status] || "可继续"}`, entry.id === state.activeConversationId ? "当前会话" : "会话", `open-conversation:${entry.id}`)).join("") || notice("这里还没有会话", "发送消息后会保存到这里。删除的会话不会重新出现。", "sage")}${buttons([["开始新对话", "halo-new-conversation", "primary"]])}${conversations.some((entry) => entry.id === state.activeConversationId) ? buttons([[state.conversationStatus === "paused" ? "继续当前会话" : "暂停当前会话", state.conversationStatus === "paused" ? "conversation-state:active" : "conversation-state:paused", "secondary"], ["归档当前会话", "conversation-state:archived", "secondary"], ["删除当前会话", "conversation-state:deleted", "danger-button"]]) : ""}</div>`; },
      "HAL-03": () => haloMemoryPage(item),
      "HAL-04": () => `${head(item, "PROACTIVE SUPPORT")}<div class="stack">${toggle("proactive", "允许 Halo 主动陪伴", "默认关闭，可分别开启早晨与睡前")}${toggle("morningPrompt", "早晨状态提示", "只在有明确状态变化时出现")}${toggle("nightPrompt", "睡前轻提醒", "帮助进入今晚页面，不强制打开 App")}<label class="field-label">静默开始<input id="halo-quiet-start" class="field" type="time" value="${esc(state.haloQuietHours.start)}"></label><label class="field-label">静默结束<input id="halo-quiet-end" class="field" type="time" value="${esc(state.haloQuietHours.end)}"></label>${notice("设置已自动保存", `${state.haloQuietHours.start} 至${state.haloQuietHours.end <= state.haloQuietHours.start ? "次日 " : ""}${state.haloQuietHours.end} 不发送主动陪伴提醒。闹钟与必要服务通知分别管理。`)}${!state.toggles.notification ? notice("通知权限已关闭", "当前不会发送主动陪伴通知；开启前请先检查系统权限。", "warm") : ""}</div>`,
      "HAL-05": () => `${head(item, "FEELINGS")}<div class="stack"><p class="caption">此刻更接近哪些感受？</p><div class="suggestions">${["平静", "疲惫", "紧张", "低落", "有力量"].map((feeling) => `<button class="${state.haloFeeling === feeling ? "active" : ""}" data-action="halo-feeling:${feeling}">${feeling}</button>`).join("")}</div><label class="field-label">身体感受<textarea id="halo-feeling-note" class="field" placeholder="例如：肩颈有些紧，呼吸偏浅">${esc(state.haloFeelingNote)}</textarea></label>${state.haloFeelingRecords.length ? notice("最近一次用户记录", `${experienceTime(state.haloFeelingRecords.at(-1).occurredAt)} · ${state.haloFeelingRecords.at(-1).text}`, "sage") : ""}${buttons([["保存并带入对话", "save-halo-feeling", "primary"], ["返回对话", "go:HAL-01", "secondary"]])}<p class="caption">草稿会保留；点击保存后才加入用户记录。</p></div>`,
      "HAL-06": () => journeyPage(item),
      "HAL-07": () => `${head(item, "DATA & PRIVACY")}<div class="stack">${toggle("haloBody", "允许参考今天的身体状态", "仅在数据可以解释时带入；关闭后会立即从本次对话移除")}${toggle("memory", "允许使用已确认记忆", "可单条删除或全部清空")}${rows([["本次参考", hasBodyContext() ? "Body Weather · 08:42" : "未参考身体状态"], ["云端保存", "必要会话摘要"], ["完整健康明细", "优先保存在手机本地"]])}${!hasBodyContext() ? notice(state.dataLifecycle === "interpretable" ? "身体状态已从本次对话移除" : "目前没有可带入的身体状态", state.dataLifecycle === "interpretable" ? "后续回复不会使用 Body Weather；重新开启前不会自动恢复。" : "数据可以解释前，Halo 不会显示或使用健康值与趋势。", "sage") : ""}${state.haloDataDeletionStatus === "submitted" ? notice("Halo 数据删除申请已提交", "处理进度会在这里更新；戒指健康记录不会随这次申请删除。", "sage") : buttons([[hasBodyContext() ? "不再参考本次身体状态" : "重新允许参考身体状态", hasBodyContext() ? "remove-halo-context" : "restore-halo-context", "secondary", state.dataLifecycle !== "interpretable"], ["删除 Halo 数据", "danger:删除 Halo 数据:将提交云端会话摘要与记忆删除请求，不会自动删除戒指健康记录。:提交删除", "danger-button"]])}</div>`,
      "HAL-08": () => `${head(item, "HALO SETTINGS")}<div class="stack">${setting("表达偏好", "语气与回复长短", "halo-preferences")}${setting("需要紧急帮助", "查看现实求助方式", "halo-safety-help")}${setting("最近会话", "继续、暂停、归档与删除", "go:HAL-02")}${setting("记录此刻感受", "作为用户记录带入 Halo", "go:HAL-05")}${setting("我的小计划", "查看进度或继续下一步", "go:HAL-06")}${toggle("haloVoice", "语音回复", "默认关闭")}${toggle("inspiration", "今日灵感", "首页展示每日固定的文化灵感，可随时关闭")}${setting("今日灵感个性化", "未填写生日时使用通用内容", "info:inspiration", "通用")}${setting("主动陪伴", "早晨、睡前与静默时间", "go:HAL-04")}${setting("Halo 记忆", "查看、纠正与删除", "go:HAL-03")}${setting("数据与隐私", "来源、权限与撤回", "go:HAL-07")}${setting("人工帮助", "安全问题与服务支持", "go:HELP-03")}</div>`,
    };
    return map[item.id]?.() || generic(item);
  }

  function recordDateTime(value) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value} · 按日期记录`;
    return new Date(value).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  }
  function initializeReviewRepairs() {
    state.subjectiveRecords = (Array.isArray(storedSubjectiveRecords) ? storedSubjectiveRecords : []).map((record, index) => typeof record === "string"
      ? { id: `legacy-${index}`, label: record, labels: [record], source: "user-record", occurredAt: null, original: "" }
      : record).filter(record => record && typeof record.id === "string" && typeof record.label === "string");
    state.subjectiveMarkers = [...new Set(state.subjectiveRecords.flatMap(record => record.labels || [record.label]))];
    state.recordDraft = { labels: [], note: "", ...(state.recordDraft || {}) };
    state.recordDraft.labels = Array.isArray(state.recordDraft.labels) ? state.recordDraft.labels.filter(label => SUBJECTIVE_OPTIONS.includes(label)) : [];
    state.recordDraft.note = String(state.recordDraft.note || "");
    state.rhythmRecords = state.rhythmRecords && typeof state.rhythmRecords === "object" ? state.rhythmRecords : {};
    state.rhythmSettingsDraft = { ...state.rhythmSettings, ...(state.rhythmSettingsDraft || {}) };
    state.selectedRhythmDate = state.selectedRhythmDate || beijingDateKey();
    state.rhythmMonth = state.rhythmMonth || state.selectedRhythmDate.slice(0, 7);
    state.tabStacks = state.tabStacks && typeof state.tabStacks === "object" ? state.tabStacks : {};
    state.pageViews = state.pageViews && typeof state.pageViews === "object" ? state.pageViews : {};
    for (const tab of ["TOD-01", "NIG-01", "HAL-01", "RHY-01", "MY-01"]) {
      state.tabStacks[tab] = Array.isArray(state.tabStacks[tab]) ? state.tabStacks[tab].filter(id => pages.some(page => page.id === id) && tabForRoute(id) === tab) : [tab];
    }
  }
  function rhythmSettingsValid(settings = state.rhythmSettings) {
    const { startDate, cycleLength, duration } = settings || {};
    return /^\d{4}-\d{2}-\d{2}$/.test(startDate || "") && startDate <= beijingDateKey() && Number(cycleLength) >= 20 && Number(cycleLength) <= 45 && Number(duration) >= 2 && Number(duration) <= 10;
  }
  function rhythmDay() {
    if (!rhythmSettingsValid() || state.rhythmDeleted) return null;
    const elapsed = Math.floor((Date.parse(beijingDateKey() + "T12:00:00+08:00") - Date.parse(state.rhythmSettings.startDate + "T12:00:00+08:00")) / 86400000);
    return elapsed + 1;
  }
  function rhythmContextSummary() {
    const record = state.rhythmRecords[state.selectedRhythmDate];
    return `${state.rhythmDeleted ? "暂无节律记录" : `最近一次开始日期：${state.rhythmSettings.startDate || "未填写"}`}。${record ? `${record.date} 用户记录：${record.feeling}${record.note ? `；${record.note}` : ""}` : "所选日期还没有填写感受"}。${hasBodyContext() ? "设备数据单独作为参考，不能证明周期导致了变化。" : "当前没有可解释的身体数据，不生成健康趋势或因果判断。"}`;
  }
  function rhythmCalendar() {
    const [year, month] = state.rhythmMonth.split("-").map(Number);
    const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const offset = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
    const cells = [...Array(offset)].map(() => '<span aria-hidden="true"></span>');
    for (let day = 1; day <= days; day++) {
      const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push(`<button class="${state.rhythmRecords[date] ? "active" : ""} ${date === beijingDateKey() ? "today" : ""}" data-action="rhythm-date:${date}" ${date > beijingDateKey() ? "disabled" : ""} aria-label="${date}，记录感受">${day}</button>`);
    }
    return `<div class="calendar-heading">${buttons([["上月", "rhythm-month:-1", "text-button"], [state.rhythmMonth, "", "text-button", true], ["下月", "rhythm-month:1", "text-button", state.rhythmMonth >= beijingDateKey().slice(0,7)]])}</div><div class="calendar">${["一","二","三","四","五","六","日"].map(day => `<small>${day}</small>`).join("")}${cells.join("")}</div>`;
  }
  function rhythmSettingsForm(item, setup = false) {
    return `${head(item, setup ? "RHYTHM SETUP" : "RHYTHM SETTINGS")}<div class="stack">${setup ? notice("从你愿意记录的部分开始", "填写日期和常见周期，也可以先跳过。", "rose") : ""}<label class="field-label">最近一次开始日<input id="rhythm-start-date" class="field" type="date" max="${beijingDateKey()}" value="${esc(state.rhythmSettingsDraft.startDate || "")}"></label><label class="field-label">平均周期（天）<input id="rhythm-cycle-length" class="field" type="number" min="20" max="45" value="${esc(state.rhythmSettingsDraft.cycleLength)}"></label><label class="field-label">平均持续（天）<input id="rhythm-duration" class="field" type="number" min="2" max="10" value="${esc(state.rhythmSettingsDraft.duration)}"></label>${toggle("rhythmNotice", "节律轻提醒", "提醒记录，不判断疾病或避孕安全期")}${state.rhythmSettingsSaved ? notice("设置已保存", "将按你填写的日期展示记录。", "sage") : ""}${buttons([[setup ? "保存并继续" : "保存设置", setup ? "rhythm-setup-save" : "rhythm-settings-save", "primary", !rhythmSettingsValid(state.rhythmSettingsDraft)], ...(setup ? [["暂时跳过", "rhythm-setup-skip", "text-button"]] : [])])}<p class="caption">修改先保留为草稿，点击保存后才会更新记录日期。</p>${setup ? "" : setting("暂停与删除", "管理节律展示和记录", "go:RHY-05")}</div>`;
  }
  function rhythmStatePage(item) {
    const states = {
      empty: ["还没有节律记录", "添加开始日期后，才会显示阶段和回看内容。", [["添加节律记录", "go:RHY-00", "primary"], ["暂时跳过", "rhythm-state:paused", "secondary"]]],
      conflict: ["日期需要核对", "最近一次开始日期与已有记录重叠。请确认正确日期后再继续。", [["修改日期", "go:RHY-04", "primary"], ["稍后处理", "go:MY-01", "secondary"]]],
      paused: ["节律展示已暂停", "已记录的日期和感受仍会保留；重新开启前不显示阶段解释。", [["重新开启", "rhythm-state:ready", "primary"], ["管理记录", "go:RHY-05", "secondary"]]],
      insufficient: ["记录还不足以显示阶段", "还需要最近一次开始日期和常见周期长度。补充后会重新计算。", [["补充记录", "go:RHY-04", "primary"], ["先返回", "go:MY-01", "secondary"]]],
      error: ["暂时无法加载节律记录", "已保存的数据不会丢失。请检查网络后再试。", [["重新加载", "rhythm-state:ready", "primary"], ["稍后再看", "go:MY-01", "secondary"]]],
    };
    const current = states[state.rhythmStatus];
    if (!current) return "";
    return `${head(item, "RHYTHM")}<div class="stack">${notice(current[0], current[1], state.rhythmStatus === "conflict" ? "warm" : "sage")}${buttons(current[2])}</div>`;
  }
  function rhythm(item) {
    if (item.id === "RHY-00") return rhythmSettingsForm(item, true);
    if (item.id === "RHY-04") return rhythmSettingsForm(item);
    const statusPage = item.id === "RHY-01" ? rhythmStatePage(item) : "";
    if (statusPage) return statusPage;
    const map = {
      "RHY-01": () => `${head(item, "YOUR RHYTHM", `<button class="head-action" data-action="go:RHY-04" aria-label="打开节律设置">•••</button>`)}<div class="stack"><section class="rhythm-hero"><span>${rhythmDay() ? `本次记录第 ${rhythmDay()} 天` : "等待你填写日期"}</span><h2>先记下感受，再慢慢看规律</h2><small>${rhythmSettingsValid() ? `开始于 ${esc(state.rhythmSettings.startDate)} · 常见周期 ${esc(state.rhythmSettings.cycleLength)} 天` : "没有日期时，不推测你处在哪个阶段"}</small></section>${rhythmCalendar()}${buttons([["记录今天的感受", `rhythm-date:${beijingDateKey()}`, "primary"], ["这和节律有什么关系？", "go:RHY-02", "secondary"], ["和 Halo 聊聊最近的变化", "go:RHY-06", "text-button"]])}<p class="health-boundary">日期用于回看，不预测排卵、避孕安全期或疾病。</p></div>`,
      "RHY-02": () => `${head(item, "STAGE EXPLANATION")}<div class="stack">${notice("这些变化不一定会发生", "睡眠、情绪和身体感受可能与节律同时变化，也可能来自压力、作息或其他原因。", "rose")}${card("睡眠", "有些人会更晚入睡，或半夜更容易醒。", "可能出现")}${card("情绪", "有些人会更容易觉得烦躁、紧张或低落。", "可能出现")}${card("活动", "如果比平时更累，可以减一点强度，不必硬撑。", "按感受调整")}${buttons([["带着这些记录问 Halo", "go:RHY-06", "primary"]])}</div>`,
      "RHY-03": () => `${head(item, "DAY & FEELING")}<div class="stack"><p class="caption">${esc(state.selectedRhythmDate)} · 用户记录</p><div class="suggestions">${["睡得少","情绪敏感","身体轻松","有精神"].map(feeling => `<button class="${state.rhythmFeeling === feeling ? "active" : ""}" data-action="rhythm-feeling:${feeling}">${feeling}</button>`).join("")}</div><label class="field-label">补充感受（选填）<textarea id="rhythm-note" class="field" maxlength="500">${esc(state.rhythmNote || "")}</textarea></label>${state.rhythmRecords[state.selectedRhythmDate] ? notice("这天已有记录", "保存将更新这一天，不会修改其他日期。", "sage") : ""}${buttons([["保存", "rhythm-feeling-save", "primary", !state.rhythmFeeling]])}</div>`,
      "RHY-05": () => `${head(item, "PAUSE OR DELETE")}<div class="stack">${state.rhythmDeleted ? notice("节律数据已删除", "节律页不再显示你填写的日期和感受记录；Body Weather 的设备数据没有改变。", "sage") : `${notice("暂停节律展示", "首页和节律页不再显示阶段解释，已记录数据保留。", "rose")}${buttons([["暂停展示", "rhythm-state:paused", "secondary"]])}${notice("删除节律数据", "将删除你填写的日期和感受记录。Body Weather 原始健康数据不受影响。", "danger")}${buttons([["删除节律数据", "danger:删除节律数据:日期、周期参数和感受记录会被删除，无法恢复。:确认删除", "danger-button"]])}`}</div>`,
      "RHY-06": () => `${head(item, "WITH HALO")}<div class="stack">${notice("只带入你确认的记录", rhythmContextSummary(), "rose")}${buttons([["带入这些记录", "halo-rhythm-context", "primary"], ["这次不带入", "go:RHY-01", "secondary"]])}</div>`,
    };
    return map[item.id]?.() || generic(item);
  }

  function feedbackPage(item) {
    const ticket = state.feedbackTickets.find((entry) => entry.id === state.activeFeedbackTicketId);
    if (ticket) return `${head(item, "FEEDBACK")}<div class="stack">${notice("反馈已记录", "已保存在当前原型，尚未发送给客服。联系企业微信客服时，可由你决定提供哪些内容。", "sage")}${rows([["记录编号", ticket.id], ["问题类型", ticket.type], ["创建时间", new Date(ticket.createdAt).toLocaleString("zh-CN")], ["当前状态", "待联系客服"], ["设备日志", ticket.logsAllowed ? "允许附加 · 当前未采集" : "不附加"]])}<section class="card"><h3>你描述的问题</h3><p style="white-space:pre-wrap">${esc(ticket.text)}</p></section>${buttons([["联系企业微信客服", "support-handoff", "primary"], ["再反馈一个问题", "feedback-new", "secondary"], ["查看其他反馈", "feedback-list", "text-button"]])}</div>`;
    return `${head(item, "FEEDBACK")}<div class="stack"><label class="field-label">问题类型<select id="feedback-type" class="field">${["设备连接", "数据与解释", "夜间体验", "Halo", "其他"].map((type) => `<option ${state.feedbackDraft.type === type ? "selected" : ""}>${type}</option>`).join("")}</select></label><label class="field-label">问题描述<textarea id="feedback-text" class="field" placeholder="请描述遇到的问题">${esc(state.feedbackDraft.text)}</textarea></label>${toggle("logConsent", "允许附加设备日志", "不包含 Halo 对话正文；原型不采集真实日志")}${buttons([["记录反馈", "feedback-submit", "primary"]])}${state.feedbackTickets.length ? `<section><h3>我的反馈记录</h3>${state.feedbackTickets.map((entry) => setting(entry.type, `${new Date(entry.createdAt).toLocaleDateString("zh-CN")} · 待联系客服`, `feedback-view:${entry.id}`)).join("")}</section>` : ""}</div>`;
  }
  function myHome(item) {
    const copy = membershipCopy();
    const memberEntry = state.membershipHardwareState === "unbound-retained" ? `${currentMemberAssetSnapshot().level} · 已有资产保留；重新激活后恢复未来成长` : isHardwareActive() ? "等级、成长、任务、徽章与权益" : "Halo Member · 激活硬件后开始记录成长";
    const channelState = window.HALO_COMMERCIAL_EXTENSION?.state?.channelIdentity || "inactive";
    const advisorEntry = {
      inactive: ["申请体验顾问", "了解要求并提交申请", "go:CHN-01"],
      application: ["查看申请进度", "体验顾问申请正在审核", "go:CHN-11"],
      "needs-info": ["补充申请资料", "还需要一项资料", "go:CHN-12"],
      approved: ["完成身份开通", "申请已通过，待确认服务协议与收款资料", "go:CHN-15"],
      "activation-pending": ["体验顾问身份待生效", "资料已提交，查看当前状态", "go:CHN-16"],
      active: ["经营中心", "服务订单、收益、学习与工具", "go:CHN-19"],
      paused: ["经营已暂停", "可查看历史订单、账本与服务事项", "go:CHN-22"],
      terminated: ["体验顾问合作已结束", "查看历史结算与待处理事项", "go:CHN-22"],
    }[channelState] || ["申请体验顾问", "了解要求并提交申请", "go:CHN-01"];
    const pointsBalance = currentMemberAssetSnapshot().points;
    const quickActions = `${setting("我的 Halo 硬件", copy.device, "go:DEV-10")}${setting("会员中心", memberEntry, "go:MEM-01")}${setting("Halo Points", `${pointsBalance.toLocaleString()} 可用`, "go:PTS-01")}${setting("Halo Select", "商品、订单与售后", "go:SEL-01")}${setting("Halo Studio", "预约与最近体验", "go:STU-08")}${setting(advisorEntry[0], advisorEntry[1], advisorEntry[2])}`;
    const accountActions = `${setting("个人资料", "昵称、头像与生日", "go:ACC-01")}${setting("账号与安全", "登录设备与注销", "go:ACC-02")}${setting("数据与隐私", "权限、导出与删除", "go:SET-01")}${setting("通知与睡眠目标", "夜间、报告与提醒", "go:SET-02")}${setting("通用设置", "语言、显示与 Halo 语气", "go:SET-03")}`;
    const serviceActions = `${setting("会员说明", "等级、成长与权益", "info:membership-rights")}${setting("会员推荐", "邀请与奖励进度", "go:REF-01")}${setting("服务与订单来源", "Select、推荐与体验顾问", "commerce-entry")}${setting("使用帮助", "FAQ、反馈与客服", "go:HELP-01")}${setting("关于与协议", "版本、主体与健康边界", "go:LEGAL-02")}`;
    return `${head(item, "ACCOUNT")}<div class="stack"><section class="halo-identity"><div class="halo-avatar">H</div><div><strong>你好，${esc(state.profile.nickname || "Halo 用户")}</strong><span>${isHardwareActive() ? state.dataLifecycle === "none" ? "戒指已激活 · 等待首晚记录" : "戒指已激活" : "Halo Member · 会员模式"}</span></div></section>${membershipPanel()}<section class="me-quick-grid">${quickActions}</section><details class="visual-disclosure me-section"><summary><span class="record-glyph" aria-hidden="true">⌁</span><div><strong>账号与偏好</strong><small>资料、安全、隐私与通知</small></div><i aria-hidden="true">＋</i></summary><div class="visual-disclosure-body">${accountActions}</div></details><details class="visual-disclosure me-section"><summary><span class="record-glyph" aria-hidden="true">i</span><div><strong>更多服务与说明</strong><small>推荐、帮助与协议</small></div><i aria-hidden="true">＋</i></summary><div class="visual-disclosure-body">${serviceActions}</div></details></div>`;
  }
  function me(item) {
    if (item.id === "MY-01") return myHome(item);
    const map = {
      "MY-01": () => { const copy = membershipCopy(); const memberEntry = state.membershipHardwareState === "unbound-retained" ? `${currentMemberAssetSnapshot().level} · 已有资产保留；重新激活后恢复未来成长` : isHardwareActive() ? "等级、成长、任务、徽章与权益" : "Halo Member · 激活硬件后开始记录成长"; const channelState = window.HALO_COMMERCIAL_EXTENSION?.state?.channelIdentity || "inactive"; const channelActive = channelState === "active"; const channelPending = channelState === "activation-pending"; return `${head(item, "ACCOUNT")}<div class="stack"><section class="halo-identity"><div class="halo-avatar">H</div><div><strong>你好，${esc(state.profile.nickname || "Halo 用户")}</strong><span>${isHardwareActive() ? state.dataLifecycle === "none" ? "戒指已激活 · 等待首晚记录" : "戒指已激活" : "Halo Member · 会员模式"}</span></div></section>${membershipPanel()}${setting("个人资料", "昵称、头像与生日", "go:ACC-01")}${setting("我的 Halo 硬件", `${copy.device} · 查看连接与设备状态`, "go:DEV-10")}${setting("会员说明", "等级、成长、Halo Points 与权益说明", "info:membership-rights")}${setting("会员中心", memberEntry, "go:MEM-01")}${setting("Halo Points", "余额、临期提醒、明细与兑换", "go:PTS-01")}${setting("Halo Select", "精选商品、购物车、订单与售后", "go:SEL-01")}${setting("会员推荐", "邀请朋友并查看奖励进度", "go:REF-01")}${setting(channelActive ? "经营中心" : channelPending ? "体验顾问身份待生效" : "申请体验顾问", channelActive ? "服务订单、收益、学习与工具" : channelPending ? "查看资料与身份状态" : "了解要求并提交申请", channelActive ? "go:CHN-19" : channelPending ? "go:CHN-16" : "go:CHN-01")}${setting("商城、推荐与体验顾问说明", "了解三类服务与订单来源", "commerce-entry")}${setting("Halo Studio", "预约、体验码与最近体验", "go:STU-08")}${setting("账号与安全", "登录设备与便捷注销", "go:ACC-02")}${setting("数据与隐私", "权限、本地记录与云摘要", "go:SET-01")}${setting("通知、夜间与睡眠目标", "工作日/休息日目标、睡前与报告提醒", "go:SET-02")}${setting("通用设置", "语言、显示、桌面小组件与 Halo 语气", "go:SET-03")}${setting("使用帮助", "FAQ、反馈与企业微信客服", "go:HELP-01")}${setting("关于与协议", "版本、主体与健康边界", "go:LEGAL-02")}</div>`; },
      "ACC-01": () => { const valid = state.profile.nickname.trim().length >= 2 && state.profile.birthday && Number(state.profile.height) >= 100 && Number(state.profile.height) <= 230 && Number(state.profile.weight) >= 25 && Number(state.profile.weight) <= 250; return `${head(item, "PROFILE")}<div class="stack"><label class="field-label">昵称<input id="profile-nickname" class="field" value="${esc(state.profile.nickname)}"></label><label class="field-label">生日<input id="profile-birthday" class="field" type="date" value="${esc(state.profile.birthday)}"></label><label class="field-label">身高（厘米）<input id="profile-height" class="field" type="number" min="100" max="230" inputmode="decimal" value="${esc(state.profile.height)}"></label><label class="field-label">体重（公斤）<input id="profile-weight" class="field" type="number" min="25" max="250" inputmode="decimal" value="${esc(state.profile.weight)}"></label>${notice("这些信息用在哪里", "生日、身高与体重只用于活动消耗、个人常见范围和节律解释的个性化计算。你可以稍后修改；Halo 不公开这些资料。")}${toggle("birthdayBenefit", "生日关怀", "单独同意后，生日可收到 Halo Points 或优惠权益提示")}${state.profileSaved ? notice("个人资料已保存", "新的资料会用于之后的个性化计算。", "sage") : ""}${buttons([[state.profileSaved ? "已保存" : "保存资料", state.profileSaved ? "" : "profile-save", "primary", state.profileSaved || !valid]])}</div>`; },
      "SET-01": () => `${head(item, "DATA & PRIVACY")}<div class="stack">${rows([["完整健康明细", "优先保存在手机本地"], ["云端", "必要摘要与同步状态"], ["数据来源", "Halo Ring + 已授权系统能力"]])}${setting("权限管理", "蓝牙、通知与健康数据", "go:PERM-01")}${toggle("location", "最后位置线索", "位置需要单独授权；关闭后不再记录新的手机位置线索")}${state.toggles.location ? notice("位置权限已开启", "仅在戒指与 App 连接时记录手机位置、时间和戒指电量；不是实时定位。", "sage") : notice("位置权限未开启", "不影响连接、同步、Body Weather 或夜间体验。")}${setting("Halo 数据与隐私", "对话来源、记忆与撤回", "go:HAL-07")}${setting("导出当前原型记录", "本地 JSON · 未加密 · 不含真实设备档案", "export:open")}${state.healthDeletionStatus === "submitted" ? notice("健康记录删除申请已提交", "处理进度会在这里更新；账号和设备绑定不会自动解除。", "sage") : buttons([["删除健康记录", "danger:删除健康记录:将提交本地与云端健康记录删除流程，账号和设备绑定不会自动解除。:继续删除", "danger-button"]])}${notice("戒指内原始记录", "清空戒指缓存请前往“我的戒指 > 高级设备操作”，避免同名操作重复。")}</div>`,
      "SET-02": () => `${head(item, "SLEEP & NOTIFICATIONS")}<div class="stack">${sleepGoalPanel()}${!state.toggles.notification ? notice("系统通知已关闭", "以下提醒偏好会保留，但暂时无法发出通知。", "warm") + buttons([["开启通知权限", "go:PERM-01", "secondary"]]) : ""}<span class="settings-group-label">提醒设置</span>${toggle("nightPrompt", "睡前轻提醒", "只作为通知，不强制打开 App")}${toggle("morningPrompt", "早晨状态提示", "睡眠结束后提醒；没有结束记录时，在首次打开 App 时更新")}${toggle("lowBattery", "低电量提醒", "避免影响夜间记录")}${toggle("syncAlert", "同步异常", "仅在需要处理时提醒")}${toggle("reportReady", "报告生成", "14 晚与 Studio 报告")}${toggle("wake", "Halo 闹钟", "系统关键提醒")}</div>`,
      "SET-03": () => `${head(item, "GENERAL")}<div class="stack">${setting("语言", "简体中文", "toast:语言设置已打开")}${toggle("reduceMotion", "降低动态效果", "减少呼吸动画和页面转场")}${setting("桌面小组件", "Body Weather、戒指连接状态与今晚建议", "widget-preview")}${setting("Halo 表达偏好", "更安静、更温柔、更清楚", "go:HAL-08")}${setting("单位", "公制 · 摄氏度", "toast:单位设置已打开")}</div>`,
      "HELP-01": () => { const items = [["超级符号为什么会变化","连接、同步、低电量与需要处理","status-detail"],["数据为什么还不能解释","查看五种数据状态和当前进度","info:data-quality"],["戒指无法连接","蓝牙与绑定排查","go:DEV-01"],["固件更新没有完成","保持距离与重试方式","go:DEV-11"],["夜间播放与唤醒","锁屏播放、手机计时与系统权限","go:NIG-11"],["健康解释边界","哪些内容不是诊断","go:LEGAL-02"],["问题反馈与记录","查看已记录问题，或添加新反馈","go:HELP-02"],["人工客服","将离开 App","go:HELP-03"]].filter(([title,body]) => `${title}${body}`.includes(state.helpQuery)); return `${head(item, "HELP")}<div class="stack"><input id="help-search" class="field" placeholder="搜索问题" value="${esc(state.helpQuery)}">${items.map(([title,body,action]) => setting(title,body,action)).join("") || notice("没有找到相关问题", "换一个关键词，或直接联系人工客服。", "sage")}</div>`; },
      "HELP-02": () => feedbackPage(item),
      "HELP-03": () => `${head(item, "HUMAN SUPPORT")}<div class="stack">${notice("通过企业微信联系客服", "客服可以协助处理会员、订单、设备、权益和售后问题。", "sage")}${rows([["联系时不会发送", "健康数据、Halo 对话和其他敏感信息"], ["后续补充信息", "由你在对话中决定是否提供"]])}${buttons([["联系企业微信客服", "support-handoff", "primary"], ["返回帮助中心", "go:HELP-01", "secondary"]])}</div>`,
      "LEGAL-02": () => `${head(item, "ABOUT")}<div class="stack">${rows([["App 版本", "1.0.0 (140)"], ["设备固件", "1.0.8"], ["运营主体", "Halo Ring"]])}${setting("用户协议", "阅读原型摘要 · 正式版本待审定", "legal-read:agreement")}${setting("隐私政策", "了解数据保存与删除", "legal-read:privacy")}${setting("健康与 AI 边界", "了解状态与建议的适用范围", "legal-read:ai")}${notice("健康管理参考", "Halo Ring 与 App 提供的状态和建议不替代医疗诊断。")}</div>`,
      "ACC-02": () => `${head(item, "ACCOUNT SECURITY")}<div class="stack">${rows([["手机号", (state.authPhone || "13800000000").replace(/^(\d{3})\d{4}(\d{4})$/, "$1 **** $2")], ["登录设备", state.signedIn ? "本机 iPhone" : "已退出"]])}${buttons([["退出登录", "logout", "secondary"], ["注销账号", "go:ACC-03", "danger-button"]])}</div>`,
      "ACC-03": () => accountDeletionPage(item),
    };
    return map[item.id]?.() || generic(item);
  }

  function studio(item) {
    syncStudioAliases();
    const event = selectedStudioEvent();
    const record = studioRecord();
    const voucher = window.HALO_COMMERCIAL_EXTENSION?.getStudioVoucher?.(state.selectedStudioEventId);
    const eventPrice = event.price ? `¥${event.price}` : "免费会员场";
    const amount = record.useVoucher && voucher?.eligible ? 0 : event.price;
    const eventSummary = card(event.title, `${event.date} · ${event.place} · ${event.duration} 分钟`, `${event.category} · ${eventPrice}`);
    const bookings = Object.entries(state.studioRecords).filter(([, entry]) => entry.booked && !entry.sessionDone && !["refunded", "cancelled"].includes(entry.refundStatus));
    const history = Object.entries(state.studioRecords).filter(([, entry]) => entry.sessionDone && entry.deletionStatus !== "deleted");
    const reportStates = {
      waiting: ["报告正在整理", "活动已完成；你可以离开，稍后回到这次体验查看。", "刷新报告状态", "studio-report-refresh"],
      generated: ["报告已生成", "这份报告只对本人开放。", "查看课后报告", "go:STU-05"],
      insufficient: ["有效记录不足", "本次活动已经完成，但没有足够的有效身体记录，不生成个人报告。", "查看活动权益", "go:STU-13"],
      failed: ["报告暂未生成", "已保存的参与记录仍在，可以重新整理。", "重新整理", "studio-report-retry"],
      withdrawn: ["不生成本次个人报告", "你已关闭本次报告授权；参与记录和合法权益仍然保留。", "查看本次体验", "go:STU-15"],
    };
    const report = reportStates[record.reportStatus] || reportStates.waiting;
    const cancelled = ["refunded", "cancelled"].includes(record.refundStatus);
    const bookingLabel = cancelled ? "已取消" : record.refundStatus === "submitted" ? "取消处理中" : !record.booked ? "未预约" : !record.paid ? "待付款" : record.sessionDone ? "体验已完成" : "已确认";
    const paymentLabel = record.refundStatus === "refunded" ? `已退回 ¥${record.paidAmount}` : record.refundStatus === "submitted" ? "退款处理中" : !record.paid ? "未支付" : record.voucherId ? "体验券已使用" : record.paidAmount ? `已支付 ¥${record.paidAmount}` : "无需支付";
    const map = {
      "STU-08": () => `${head(item, "HALO STUDIO")}<div class="stack"><section class="studio-cover"><span>HALO STUDIO</span><h2>把每次练习，留成一份自己的记录</h2><p>从瑜伽、普拉提和冥想开始。</p></section>${bookings.map(([id, entry]) => card(selectedStudioEvent(id).title, entry.sessionStarted ? "体验进行中 · 继续本次" : entry.paid ? "预约已确认" : "待付款 · 继续完成预约", "我的预约", `studio-booking:${id}`)).join("")}${card("暮色舒展瑜伽", "60 分钟 · 静安体验室 · ¥99", "官方精选", "studio-select:yoga-evening")}${card("晨间核心普拉提", "50 分钟 · 免费会员场", "官方精选", "studio-select:pilates-morning")}${buttons([["扫码或输入体验码", "go:STU-01", "secondary"], ["看看以前的体验", "go:STU-07", "secondary"]])}</div>`,
      "STU-01": () => `${head(item, "EXPERIENCE CODE")}<div class="stack">${notice("体验码只确认本次活动", "不会改变商品订单来源，也不会复制机构订单信息。")}<label class="field-label">体验码<input id="studio-code" class="field" value="${esc(state.studioCode)}" autocomplete="off"></label>${state.studioCodeError ? notice("没有找到这个体验码", state.studioCodeError, "warm") : ""}${state.studioScannerOpen ? `${notice("扫码交互演示", "确认样例二维码后，仍需核对活动信息。", "sage")}${buttons([["识别样例二维码", "studio-scan-result", "primary"], ["关闭扫码", "studio-scan-close", "secondary"]])}` : buttons([["确认体验", "studio-code-confirm", "primary", !state.studioCode.trim()], ["扫码", "studio-scan-open", "secondary"]])}</div>`,
      "STU-09": () => `${head(item, "EXPERIENCE")}<div class="stack">${eventSummary}${notice("演示活动场次", "以下场次用于本地流程验收，不代表真实开放预约。")}${rows([["主理人", event.host], ["剩余名额", `${event.seats} 个`], ["取消规则", "开始前24小时可取消；超过期限联系客服"]])}${notice("个人状态报告", "仅本人的有效戒指记录、活动确认和报告授权均满足时生成。机构看不到个人健康数据。", "sage")}${buttons([[record.booked ? "查看我的预约" : "预约本次体验", record.booked ? "go:STU-18" : "go:STU-16", "primary"], ["已有机构预约", "go:STU-02", "secondary"]])}</div>`,
      "STU-02": () => `${head(item, "CONFIRM")}<div class="stack">${eventSummary}${notice("核对机构预约", "正式 App 需先由业务系统核验预约；这里演示核验通过后的参与流程，不复制机构支付凭证。")}${buttons([["模拟核验预约并继续", "studio-institution-confirm", "primary"]])}</div>`,
      "STU-16": () => `${head(item, "BOOKING")}<div class="stack">${eventSummary}${voucher?.eligible && !record.booked ? setting("使用已兑换的体验券", voucher.title, "studio-voucher-toggle", record.useVoucher ? "已选择" : "未选择") : ""}${rows([["本次应付", `¥${record.booked ? record.dueAmount : amount}`], ["名额确认", amount ? "完成付款后确认" : "确认后预约"]])}${record.booked ? buttons([[record.paid ? "查看预约" : "继续支付", record.paid ? "go:STU-18" : "go:STU-17", "primary"]]) : buttons([[amount ? "锁定名额" : "确认预约", "studio-book", "primary"]])}</div>`,
      "STU-17": () => `${head(item, "PAYMENT")}<div class="stack">${eventSummary}${rows([["活动订单", record.bookingId], ["订单金额", `¥${record.dueAmount || 0}`], ["支付状态", paymentLabel]])}${notice("模拟支付", "本地原型不发起扣款。支付结果和订单状态仅用于交互验收。")}${record.paid || cancelled ? buttons([["查看预约", "go:STU-18", "primary"]]) : buttons([[`模拟支付成功 ¥${record.dueAmount}`, "studio-pay", "primary"], ["暂不支付，保留订单", "go:STU-18", "secondary"]])}</div>`,
      "STU-18": () => `${head(item, "MY BOOKING")}<div class="stack">${eventSummary}${rows([["预约编号", record.bookingId || "尚未预约"], ["预约状态", bookingLabel], ["支付状态", paymentLabel]])}${record.refundStatus === "submitted" ? `${notice("退款申请已保存", "你可以离开并稍后返回查看；此处仅演示处理结果。", "sage")}${buttons([["模拟退款完成", "studio-refund-refresh", "primary"], ["联系活动客服", "go:HELP-03", "secondary"]])}` : cancelled ? buttons([["返回 Studio", "go:STU-08", "primary"]]) : !record.paid ? buttons([["继续支付", "go:STU-17", "primary"], ["取消未付款预约", "studio-refund", "secondary"]]) : record.sessionDone ? buttons([["查看本次体验", "go:STU-15", "primary"]]) : buttons([[record.sessionStarted ? "继续本次体验" : "到场并继续", record.sessionStarted ? "go:STU-04" : "go:STU-10", "primary"], [record.paidAmount ? "取消并申请退款" : "取消预约", "studio-refund", "danger-button"]])}</div>`,
      "STU-10": () => `${head(item, "CONSENT")}<div class="stack">${eventSummary}${isHardwareActive() ? choice("studioMode", "ring", "本人戒指记录", "满足授权与质量后生成个人报告") : notice("当前为基础参与", "不读取身体数据，不生成个人健康报告。", "sage")}${choice("studioMode", "basic", "基础参与", "不读取戒指数据，不生成个人报告")}${toggle("studioActivity", "参与本次活动", "建立本次参与记录，必需")}${record.mode === "ring" && isHardwareActive() ? toggle("studioHealth", "生成本人的状态报告", "只对本人开放，可随时撤回") : ""}${buttons([["继续", "go:STU-11", "primary", !record.activityConsent]])}</div>`,
      "STU-11": () => `${head(item, "BEFORE")}<div class="stack">${eventSummary}${notice("只属于你", "感受只用于本人回看，不发给机构，也不会被写成活动效果。", "sage")}<label class="field-label">此刻更希望得到什么？<textarea id="studio-before-feeling" class="field" placeholder="可跳过">${esc(record.beforeDraft)}</textarea></label>${record.beforeFeeling ? notice("已保存的用户记录", record.beforeFeeling, "sage") : ""}${buttons([["保存并继续", "studio-feeling-save", "primary"], ["跳过，保留草稿", "go:STU-03", "secondary"]])}</div>`,
      "STU-03": () => `${head(item, "PREFLIGHT")}<div class="stack">${eventSummary}${record.mode === "ring" && record.healthConsent ? rows([["本人戒指", isHardwareActive() ? "已绑定" : "未绑定"], ["当前连接", DEVICE_STATUS[state.deviceStatus]?.label || state.deviceStatus], ["数据阶段", currentDataLifecycle().label]]) : notice("基础参与", "不读取戒指数据，不生成个人健康报告。")}${notice("参与流程演示", "开始后会保存本次体验状态；离开或刷新可继续。")}${buttons([["开始本次体验", "studio-start", "primary"]])}</div>`,
      "STU-04": () => `${head(item, "SESSION")}<div class="session-live"><div class="pulse"><i></i></div><h2>${record.sessionDone ? "本次体验已结束" : "本次体验进行中"}</h2><p>${esc(event.title)}</p><p>${record.startedAt ? `开始于 ${experienceTime(record.startedAt)}` : ""}</p></div>${notice("参与交互演示", "当前不采集真实设备数据；结束后可验证报告状态和记录归属。")}${buttons([[record.sessionDone ? "查看报告状态" : "结束本次体验", record.sessionDone ? "go:STU-12" : "studio-complete", "primary"]])}`,
      "STU-12": () => `${head(item, "REPORT STATUS")}<div class="stack">${eventSummary}${!record.sessionDone ? `${notice("体验还未完成", "完成本次体验后，才会核对报告与权益。")}${buttons([["查看预约", record.booked ? "go:STU-18" : "go:STU-09", "primary"]])}` : `${notice(studioCanReport(record) ? report[0] : "本次不生成个人报告", studioCanReport(record) ? report[1] : "基础参与、撤回授权或有效记录不足时，不展示身体数值与结论。", "sage")}${buttons([[studioCanReport(record) ? report[2] : "查看活动权益", studioCanReport(record) ? report[3] : "go:STU-13", "primary"]])}`}</div>`,
      "STU-05": () => `${head(item, "POST REPORT")}<div class="stack">${eventSummary}${notice("个人报告样例", "以下展示合格记录的报告布局，不是本次交互实际采集的健康结果。", "sage")}${chartCard("活动前后记录", "仅用于本人回看，不证明课程效果")}${record.beforeFeeling ? notice("活动前的用户记录", record.beforeFeeling) : notice("没有活动前的用户记录", "未填写的感受不会由 Halo 补写。")}${buttons([["明天再一起看", "go:STU-06", "primary"], ["本次授权与记录", "go:STU-15", "secondary"]])}</div>`,
      "STU-06": () => new Date(new Date(record.completedAt).getTime() + 8 * 3600000).toISOString().slice(0, 10) >= experienceDay() ? `${head(item, "NEXT DAY")}${eventSummary}${notice("明天再一起看", "本次活动还没有次日记录。完成下一晚睡眠同步后，再回来看看。", "sage")}${buttons([["回到本次报告", "go:STU-05", "primary"]])}` : `${head(item, "NEXT DAY")}<div class="stack">${eventSummary}${notice("把活动和第二天分开看", "活动记录不会改写已经生成的 Body Weather，也不会把同期变化当作课程效果。", "sage")}${rows([["活动", event.title], ["今日身体状态", hasBodyContext() ? currentBodyWeather().label : "当前没有可解释记录"]])}${buttons([["查看活动权益", "go:STU-13", "primary"]])}</div>`,
      "STU-13": () => `${head(item, "BENEFIT")}<div class="stack">${eventSummary}${metrics([["有效活动奖励", "100", "Halo Points"], ["活动成长", "40", "HALO 成长值"]])}${rows([["获得条件", "已核验完成的活动，按会员规则发放"], ["本次状态", record.benefitStatus === "posted" ? "已记入会员账本" : !record.sessionDone ? "尚未完成活动" : !record.hardwareEligibleAtCompletion ? "完成时未激活硬件，不累计活动成长奖励" : "等待完成核验"]])}${notice("完成后核对", "同一活动不会重复发放，达到本月上限后不再累计。", "sage")}${buttons([[record.benefitStatus === "posted" ? "查看账本" : "核对到账状态", record.benefitStatus === "posted" ? "go:PTS-02" : "studio-benefit-refresh", "primary", !record.sessionDone || !studioConfirmed(record) || !record.hardwareEligibleAtCompletion], ["查看本次体验", "go:STU-15", "secondary"]])}</div>`,
      "STU-14": () => `${head(item, "CONTACT")}<div class="stack">${eventSummary}${toggle("studioContact", "允许发送本次活动服务消息", "只适用于本次活动；消息由 Halo 转发，不开放联系方式")}${toggle("studioMarketing", "接收该机构后续活动消息", "单独选择，拒绝不影响报告与权益")}${notice("本次选择已保存", "其他活动不会沿用这里的联系授权。")}</div>`,
      "STU-07": () => `${head(item, "HISTORY")}<div class="stack">${history.length ? history.map(([id, entry]) => card(selectedStudioEvent(id).title, `${experienceTime(entry.completedAt)} · ${entry.mode === "ring" ? "本人戒指记录" : "基础参与"}`, entry.reportStatus === "generated" ? "报告已生成" : "查看记录", `studio-history:${id}`)).join("") : notice("还没有完成的体验", "完成活动后，这里会按活动保留记录。", "sage")}${buttons([["看看可预约活动", "go:STU-08", "primary"]])}</div>`,
      "STU-15": () => `${head(item, "EXPERIENCE DETAIL")}<div class="stack">${eventSummary}${rows([["预约状态", bookingLabel], ["参与方式", record.mode === "ring" ? "本人戒指记录" : "基础参与"], ["报告状态", record.deletionStatus !== "ready" ? "已停止展示" : studioCanReport(record) && record.reportStatus === "generated" ? "已生成" : record.sessionDone ? "本次没有可查看的报告" : "体验尚未完成"], ["活动权益", record.benefitStatus === "posted" ? "已发放，可在账本查看" : "未发放"]])}${record.beforeFeeling && record.deletionStatus === "ready" ? notice("你的活动前记录", record.beforeFeeling, "sage") : ""}${record.reportStatus === "generated" && studioCanReport(record) ? buttons([["查看本次报告", "go:STU-05", "primary"]]) : ""}${setting("联系与授权设置", "只管理本次活动", "go:STU-14")}${setting("参与与报告授权", "撤回后停止展示个人报告", "go:STU-10")}${record.deletionStatus !== "ready" ? notice("本次记录已从本地删除", "个人感受和报告不再展示；必要交易履约信息单独保留。", "sage") : record.sessionDone ? buttons([["删除本次体验记录", "danger:删除本次体验记录:只删除当前活动的个人体验内容，不影响其他活动；必要交易履约记录单独保留。:确认删除", "danger-button"]]) : ""}</div>`,
    };
    return map[item.id]?.() || generic(item);
  }

  function pageBody(item) {
    const commercialBody = window.HALO_COMMERCIAL_EXTENSION?.render(item, {
      hardwareActive: isHardwareActive(),
      membershipState: state.membershipHardwareState,
      newMember: Boolean(state.newMember),
      memberCreatedAt: state.memberCreatedAt || "",
      hardwareActivatedAt: state.hardwareActivatedAt || "",
      studioBenefitPosted: state.studioBenefitStatus === "posted",
      studioBenefitEventId: state.selectedStudioEventId,
      render,
      track: trackPrototypeEvent,
    });
    if (commercialBody) return commercialBody;
    if (item.id === "LEGAL-02") return me(item);
    if (["SYS", "ONB", "AUTH", "LEGAL", "PERM"].includes(item.id.split("-")[0])) return firstUse(item);
    if (item.id.startsWith("DEV-")) return device(item);
    if (item.id.startsWith("TOD-")) return today(item);
    if (item.id.startsWith("HLT-")) return health(item);
    if (item.id.startsWith("NIG-")) return night(item);
    if (item.id.startsWith("HAL-")) return halo(item);
    if (item.id.startsWith("RHY-")) return rhythm(item);
    if (["MY", "ACC", "SET", "HELP"].includes(item.id.split("-")[0])) return me(item);
    if (item.id.startsWith("STU-")) return studio(item);
    return generic(item);
  }

  function renderNavigation() {
    groupNav.innerHTML = groups.map((group) => `<button class="group-chip ${state.group === group ? "active" : ""}" data-group="${esc(group)}">${esc(group)}</button>`).join("");
    const list = filteredPages();
    document.getElementById("page-count").textContent = String(list.length);
    const grouped = new Map();
    list.forEach((item) => { if (!grouped.has(item.group)) grouped.set(item.group, []); grouped.get(item.group).push(item); });
    nav.innerHTML = Array.from(grouped.entries()).map(([group, items]) => `<section class="page-group"><h3>${esc(group)} · ${items.length}</h3>${items.map((item) => `<button class="nav-item ${state.current === item.id ? "active" : ""}" data-page="${item.id}"><span>${item.id}</span><strong>${esc(item.name)}</strong></button>`).join("")}</section>`).join("") || notice("没有匹配页面", "请调整搜索条件。", "sage");
  }
  function membershipReviewControls() {
    const options = [["never-bound", "从未绑定"], ["active", "已激活"], ["unbound-retained", "解绑保留"]];
    return `<section class="review-controls"><p>PROTOTYPE STATES</p><h3>会员硬件状态</h3><small>仅供产品、UI、开发与 QA 验收，不会出现在设备界面。</small><div class="review-control-group"><div>${options.map(([value, label]) => `<button class="${state.membershipHardwareState === value ? "active" : ""}" data-action="membership-state:${value}">${label}</button>`).join("")}</div></div></section>`;
  }
  function bodyWeatherReviewControls(item) {
    if (!["TOD-01", "TOD-03", "TOD-04", "TOD-10", "HAL-01", "SET-03", "STU-06"].includes(item.id)) return "";
    const weatherOptions = [["restore", "修复日"], ["slow", "缓行日"], ["balance", "平衡日"], ["active", "活力日"]];
    const lifecycleOptions = Object.entries(DATA_LIFECYCLE).map(([value, data]) => [value, data.label]);
    const optionButtons = (options, prefix, selected) => options.map(([value, label]) => `<button class="${selected === value ? "active" : ""}" data-action="${prefix}:${value}">${esc(label)}</button>`).join("");
    return `<section class="review-controls"><p>BODY WEATHER STATES</p><h3>身体天气审阅状态</h3><small>切换结果只用于评审四种天气与五种数据阶段，不会出现在设备界面。</small><div class="review-control-group"><strong>天气状态</strong><div>${optionButtons(weatherOptions, "body-weather", state.bodyWeather)}</div></div><div class="review-control-group"><strong>数据状态</strong><div>${optionButtons(lifecycleOptions, "lifecycle", state.dataLifecycle)}</div></div></section>`;
  }
  function measurementReviewControls(item) {
    if (item.id !== "HLT-04") return "";
    const options = [["ready", "测量中"], ["complete", "已完成"], ["failed", "未获得数据"]];
    return `<section class="review-controls"><p>MEASUREMENT STATES</p><h3>主动测量审阅状态</h3><small>仅供产品、UI、开发与 QA 检查成功和失败状态，不会出现在设备界面。</small><div class="review-control-group"><div>${options.map(([value, label]) => `<button class="${state.measurementStatus === value ? "active" : ""}" data-action="measurement-state:${value}">${label}</button>`).join("")}</div></div></section>`;
  }
  function rhythmReviewControls(item) {
    if (!item.id.startsWith("RHY-") || item.id === "RHY-00") return "";
    const options = [["ready", "正常"], ["empty", "未设置"], ["conflict", "日期冲突"], ["paused", "已暂停"], ["insufficient", "记录不足"], ["error", "加载失败"]];
    return `<section class="review-controls"><p>RHYTHM STATES</p><h3>节律审阅状态</h3><small>仅供产品、UI、开发与 QA 切换验收状态，不会出现在设备界面。</small><div class="review-control-group"><div>${options.map(([value, label]) => `<button class="${state.rhythmStatus === value ? "active" : ""}" data-action="rhythm-state:${value}">${label}</button>`).join("")}</div></div></section>`;
  }
  function renderInspector(item) {
    document.getElementById("inspect-title").textContent = `${item.id} · ${item.name}`;
    const items = [["优先级", item.priority], ["路由 / 形态", item.route], ["页面任务", item.function], ["显示数据", item.data], ["主要交互", item.interaction], ["业务逻辑", item.logic], ["异常与降级", item.exception], ["SDK / 系统能力", item.sdk], ["自研规则", item.rules], ["责任", item.owner]];
    document.getElementById("inspect-data").innerHTML = items.map(([key, value]) => `<div><dt>${esc(key)}</dt><dd>${esc(value || "按当前规格实现")}</dd></div>`).join("");
    const reviewControls = document.getElementById("review-controls");
    if (reviewControls) reviewControls.innerHTML = `${membershipReviewControls()}${bodyWeatherReviewControls(item)}${measurementReviewControls(item)}${rhythmReviewControls(item)}${window.HALO_COMMERCIAL_EXTENSION?.reviewControls(item) || ""}`;
  }
  function renderTabs(item) {
    const prefix = item.id.split("-")[0];
    const active = ["TOD", "HLT"].includes(prefix) ? "TOD-01" : prefix === "NIG" ? "NIG-01" : prefix === "HAL" ? "HAL-01" : prefix === "RHY" ? "RHY-01" : ["MY", "ACC", "SET", "HELP", "DEV", "STU", "MEM", "PTS", "REF", "SEL", "CHN"].includes(prefix) && !["DEV-01", "DEV-02", "DEV-03", "DEV-04", "DEV-05"].includes(item.id) ? "MY-01" : "";
    tabbar.style.visibility = ["SYS", "ONB", "AUTH", "LEGAL", "PERM"].includes(prefix) || ["DEV-01", "DEV-02", "DEV-03", "DEV-04", "DEV-05", "RHY-00"].includes(item.id) ? "hidden" : "visible";
    tabbar.querySelectorAll("button").forEach((button) => button.classList.toggle("active", button.dataset.tab === active));
  }
  function render() {
    capturePageView();
    const samePage = screen.dataset.page === state.current;
    const focused = document.activeElement;
    const focusId = samePage && screen.contains(focused) ? focused.id : "";
    const focusAction = samePage && screen.contains(focused) ? focused.getAttribute("data-action") : "";
    const selection = focusId && typeof focused.selectionStart === "number" ? [focused.selectionStart, focused.selectionEnd] : null;
    const guarded = guardedRoute(state.current);
    if (guarded !== state.current) {
      state.current = guarded;
      history.replaceState(null, "", `#${guarded}`);
    }
    const item = pages.find((candidate) => candidate.id === state.current) || pages[0];
    if (!item) return;
    document.getElementById("stage-title").textContent = `${item.id} · ${item.name}`;
    renderNavigation();
    renderInspector(item);
    renderTabs(item);
    screen.innerHTML = pageBody(item);
    screen.dataset.page = item.id;
    state.lastVisitedRoute = item.id;
    document.documentElement.classList.toggle("reduce-motion", Boolean(state.toggles.reduceMotion));
    const savedView = state.pageViews[item.id];
    if (savedView) screen.querySelectorAll("details").forEach((el, index) => { el.open = (savedView.open || []).includes(index); });
    const playerButton = screen.querySelector('[data-action="toggle-player"]');
    if (playerButton) playerButton.setAttribute("aria-label", state.playing ? "暂停播放" : "继续播放");
    const chatSendButton = screen.querySelector('[data-action="send-chat"]');
    if (chatSendButton) chatSendButton.setAttribute("aria-label", "发送消息");
    screen.scrollTop = savedView?.top || 0;
    const restoreFocus = focusId ? document.getElementById(focusId) : focusAction ? [...screen.querySelectorAll("[data-action]")].find(el => el.dataset.action === focusAction) : null;
    if (restoreFocus && !restoreFocus.disabled) {
      restoreFocus.focus({ preventScroll: true });
      if (selection && restoreFocus.setSelectionRange) { try { restoreFocus.setSelectionRange(...selection); } catch {} }
    }
    if (typeof paintShareCards === "function") paintShareCards();
    persistAppProgress();
    requestAnimationFrame(() => nav.querySelector(".nav-item.active")?.scrollIntoView({ block: "nearest", inline: "nearest" }));
  }
  function revealLatestHaloMessage() {
    requestAnimationFrame(() => {
      const target = document.querySelector("#chat-messages .message:last-child") || document.querySelector(".halo-composer");
      const reducedMotion = Boolean(state.toggles.reduceMotion) || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      target?.scrollIntoView({ block: "nearest", behavior: reducedMotion ? "auto" : "smooth" });
    });
  }

  function handleAction(action) {
    if (!action) return;
    if (action.startsWith("report-month:")) { state.selectedReportMonth = action.slice(13); state.trendPeriod = "30"; return go("TOD-04"); }
    if (action === "monthly-review-start") {
      if (!isHardwareActive() || state.dataLifecycle !== "interpretable") return flash("有可查看的月度报告后，才能完成回顾");
      state.recordDraft.reportMonth = state.selectedReportMonth || "2026-08";
      return go("TOD-02");
    }
    if (action === "go:HAL-01") { state.haloToolsOpen = false; return go("HAL-01"); }
    if (action === "halo-rhythm-context") { state.haloContext = "rhythm"; state.haloToolsOpen = false; return go("HAL-01"); }
    if (action === "halo-new-conversation") { state.activeConversationId = ""; state.chat = []; state.conversationStatus = "new"; return go("HAL-01"); }
    if (action === "halo-preferences") return showHaloPreferences();
    if (action.startsWith("halo-preference:")) { const [, key, value] = action.split(":"); if (["tone", "length"].includes(key)) state.haloPreferences[key] = value; persistAppProgress(); return showHaloPreferences(); }
    if (action === "halo-safety-help") return showInfoModal("现实中的帮助", "如有紧迫危险，请拨打所在地急救电话，或请身边的人协助求助。在中国大陆可拨打 120（医疗急救）或 110（人身安全）。不在中国大陆时，请使用当地急救号码。\n\n也可以立即联系一位你信任的人，告诉对方你需要陪伴。Halo 客服不是紧急救援机构。", "知道了");
    if (action === "halo-safety-pause") { const conversation = state.conversations.find((entry) => entry.id === state.activeConversationId); if (conversation) conversation.status = "paused"; state.conversationStatus = "paused"; return go("HAL-02"); }
    if (action.startsWith("halo-memory-confirm:")) { const memory = state.haloMemories.find((entry) => entry.id === action.slice(20)); if (memory) memory.confirmed = true; return render(); }
    if (action.startsWith("halo-memory-edit:")) { const id = action.slice(17); const memory = state.haloMemories.find((entry) => entry.id === id); if (!memory) return; showInfoModal("纠正这条记忆", "保存后会替换这条记忆，不修改其他记录。", "保存纠正", `halo-memory-save:${id}`); modalRoot.querySelector(".button-row").insertAdjacentHTML("beforebegin", `<label class="field-label">正确的内容<textarea id="halo-memory-edit" class="field">${esc(memory.text)}</textarea></label>`); return; }
    if (action.startsWith("halo-memory-save:")) { const memory = state.haloMemories.find((entry) => entry.id === action.slice(17)); const text = document.getElementById("halo-memory-edit")?.value.trim(); if (!memory || !text) return flash("请写下正确的内容"); memory.text = text; memory.confirmed = true; closeModal(); return render(); }
    if (action.startsWith("halo-memory-delete:")) return showInfoModal("删除这条记忆？", "只删除选中的记忆，不影响其他记忆和健康记录。", "确认删除", `halo-memory-delete-confirm:${action.slice(19)}`);
    if (action.startsWith("halo-memory-delete-confirm:")) { state.haloMemories = state.haloMemories.filter((entry) => entry.id !== action.slice(27)); closeModal(); return render(); }
    if (action === "halo-tools-toggle") {
      state.haloToolsOpen = !state.haloToolsOpen;
      render();
      if (state.haloToolsOpen) requestAnimationFrame(() => document.getElementById("halo-tools")?.scrollIntoView({ block: "nearest" }));
      return;
    }
    if (action === "halo-open-feeling") { state.haloToolsOpen = false; return go("HAL-05"); }
    if (action === "halo-open-journey") { state.haloToolsOpen = false; return go("HAL-06"); }
    if (action.startsWith("resume-conversation:")) {
      return openHaloConversation(action.slice(20));
    }
    if (action === "remove-halo-context") { state.toggles.haloBody = false; state.haloContext = "none"; return render(); }
    if (action === "restore-halo-context") { if (state.dataLifecycle !== "interpretable") return flash("身体数据可以解释后，才会开放本次参考"); state.toggles.haloBody = true; state.haloContext = "body"; return render(); }
    if (action.startsWith("halo-feeling:")) { state.haloFeeling = action.slice(13); return render(); }
    if (action === "save-halo-feeling") {
      const note = state.haloFeelingNote.trim();
      if (!note && !state.haloFeeling) return flash("先选一个感受，或写下你想记录的话");
      const text = [state.haloFeeling, note].filter(Boolean).join(" · ");
      state.haloFeelingRecords.push({ id: `feeling-${Date.now()}`, label: state.haloFeeling, text, occurredAt: new Date().toISOString(), source: "user-record" });
      state.haloContext = "feeling";
      state.haloToolsOpen = false;
      trackPrototypeEvent("halo_user_record_saved", { source: "user-record" });
      go("HAL-01");
      return flash("已保存为用户记录，并带入这次对话");
    }
    if (action === "ai-correction:open") return showAiCorrectionModal();
    if (action.startsWith("ai-correction-select:")) {
      const reason = action.slice(21);
      state.aiCorrection.reason = reason;
      state.aiCorrection.reasonLabel = AI_CORRECTION_REASONS[reason] || AI_CORRECTION_REASONS.other;
      return showAiCorrectionConfirm(reason);
    }
    if (action.startsWith("ai-correction-save:")) {
      const [, reason, mode] = action.split(":");
      const reasonLabel = AI_CORRECTION_REASONS[reason] || AI_CORRECTION_REASONS.other;
      state.aiCorrection = {
        status: "saved",
        reason,
        reasonLabel,
        note: document.getElementById("ai-correction-note")?.value.trim() || "",
        memoryReview: mode === "memory",
        savedAt: new Date().toISOString(),
      };
      state.haloContext = "correction";
      trackPrototypeEvent("ai_interpretation_correction_saved", { correction_type: reason, memory_review_requested: mode === "memory" });
      closeModal();
      if (mode === "memory") {
        go("HAL-03");
        return flash("已纠正，并完成相关记忆检查");
      }
      render();
      return flash("已按你的感受调整这次解释");
    }
    if (action === "ai-correction-check-memory") {
      state.aiCorrection.memoryReview = true;
      trackPrototypeEvent("ai_correction_memory_checked", { related_confirmed_memory_found: false });
      render();
      return flash("相关记忆已检查");
    }
    if (action === "ai-correction-reset") {
      state.aiCorrection = { ...DEFAULT_AI_CORRECTION };
      state.haloContext = hasBodyContext() ? "body" : "none";
      trackPrototypeEvent("ai_interpretation_correction_withdrawn");
      render();
      return flash("这次纠正已撤销");
    }
    if (action.startsWith("rhythm-state:")) {
      const next = action.slice(13);
      if (next === "ready" && (!rhythmSettingsValid() || state.rhythmDeleted)) { state.rhythmStatus = "empty"; return go("RHY-00"); }
      state.rhythmStatus = next;
      return render();
    }
    if (action.startsWith("rhythm-date:")) {
      const date = action.slice(12);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > beijingDateKey()) return flash("请选择今天或过去的日期");
      state.selectedRhythmDate = date;
      const record = state.rhythmRecords[date];
      state.rhythmFeeling = record?.feeling || "";
      state.rhythmNote = record?.note || "";
      return go("RHY-03");
    }
    if (action.startsWith("rhythm-month:")) {
      const [year, month] = state.rhythmMonth.split("-").map(Number);
      const next = new Date(Date.UTC(year, month - 1 + Number(action.slice(13)), 1)).toISOString().slice(0, 7);
      if (next > beijingDateKey().slice(0, 7)) return;
      state.rhythmMonth = next;
      return render();
    }
    if (action === "rhythm-setup-skip") { state.rhythmStatus = "paused"; return go(state.rhythmSetupReturn || "RHY-01"); }
    if (action === "open-outfit-inspiration") {
      trackPrototypeEvent("daily_outfit_inspiration_open", { palette: DAILY_INSPIRATION.outfitColor, source_page: state.current });
      return showOutfitInspirationModal();
    }
    if (action === "outfit-inspiration-chat") {
      state.haloContext = "inspiration";
      state.haloToolsOpen = false;
      trackPrototypeEvent("daily_outfit_halo_open", { palette: DAILY_INSPIRATION.outfitColor, source_page: state.current });
      closeModal();
      go("HAL-01");
      return appendHaloReply(DAILY_INSPIRATION.outfitQuestion, DAILY_INSPIRATION.outfitReply);
    }
    if (action === "open-inspiration") { state.haloContext = "inspiration"; state.haloToolsOpen = false; trackPrototypeEvent("daily_inspiration_halo_open", { source_page: state.current }); return go("HAL-01"); }
    if (action === "auth-code-requested") {
      const phone = String(document.getElementById("auth-phone")?.value || "").replace(/\s/g, "");
      if (!/^1\d{10}$/.test(phone)) return flash("请填写完整的 11 位手机号");
      state.authPhone = phone;
      state.authCodeRequested = true;
      state.authVerified = false;
      return go("AUTH-02");
    }
    if (action === "auth-verified") {
      if (!state.authCodeRequested) return go("AUTH-01");
      if (document.getElementById("auth-code")?.value.replace(/\s/g, "") !== "682106") return flash("请填写演示验证码 682106");
      state.authVerified = true;
      return go("LEGAL-01");
    }
    if (action === "legal-continue") {
      if (!state.authVerified && !state.signedIn) return go("AUTH-01");
      if (!state.toggles.legal || !state.toggles.aiLegal) return flash("请先确认两项必需说明");
      if (!state.signedIn && state.membershipHardwareState === "never-bound" && !state.memberCreatedAt) { state.newMember = true; state.memberCreatedAt = new Date().toISOString(); state.dataLifecycle = "none"; }
      state.signedIn = true;
      trackPrototypeEvent("required_agreements_accepted", { user_agreement: true, ai_service_notice: true });
      return go("PERM-01");
    }
    if (action.startsWith("legal-read:")) return showLegalReading(action.slice(11));
    if (action === "permission-skip") return go("TOD-01");
    if (action === "permission-connect") { if (!state.toggles.bluetooth) return showInfoModal("请先开启蓝牙", "蓝牙用于连接、同步和主动测量。开启后再连接戒指。", "知道了"); state.deviceResetStatus = "ready"; return go(isHardwareActive() ? "DEV-10" : "DEV-01"); }
    if (action === "device-pair-confirm") { if (!state.toggles.bluetooth) return flash("请先开启蓝牙权限"); state.devicePaired = true; return go("DEV-04"); }
    if (action.startsWith("go:")) { closeModal(); return go(action.slice(3)); }
    if (action === "previous") return goBack();
    if (action === "toast:文字已复制") return copyText(`${currentBodyWeather().label}｜${currentBodyWeather().shareLine}`, "文字已复制");
    if (action === "toast:已开始重新同步") { const unavailable = deviceOperationUnavailable("sync"); if (unavailable) return flash(unavailable); state.deviceStatus = "syncing"; render(); return flash("正在重新同步"); }
    if (action === "toast:语言设置已打开") return showInfoModal("语言", "当前使用简体中文。其他语言将在正式支持后显示在这里。", "知道了");
    if (action === "toast:单位设置已打开") return showInfoModal("单位", "当前使用公制与摄氏度。", "知道了");
    if (action.startsWith("toast:")) { closeModal(); return flash(action.slice(6)); }
    if (window.HALO_COMMERCIAL_EXTENSION?.handleAction(action, {
      go,
      render,
      flash,
      track: trackPrototypeEvent,
      hardwareActive: isHardwareActive(),
      membershipState: state.membershipHardwareState,
      newMember: Boolean(state.newMember),
      memberCreatedAt: state.memberCreatedAt || "",
    })) return;
    if (action === "export:open") return showExportModal();
    if (action === "export:local") return showExportResult("local");
    if (action === "export:secure") return showExportResult("secure");
    if (action === "export:revoke") return showExportResult("secure", true);
    if (action === "export-download") {
      const payload = accountExportPayload();
      downloadBlob(`HALORING-local-prototype-${new Date().toISOString().slice(0, 10)}.json`, new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
      return flash("已发起明文文件下载，请妥善保管");
    }
    if (action === "export-copy-link") return showExportResult("secure");
    if (action === "share-system") {
      const content = shareContent();
      if (navigator.share && navigator.canShare) return buildShareCanvas(content).then(canvas => new Promise(resolve => canvas.toBlob(resolve, "image/png"))).then(blob => {
        const file = new File([blob], "HALORING-Body-Weather.png", { type: "image/png" });
        if (!navigator.canShare({ files: [file] })) return showInfoModal("请先保存图片", "当前浏览器不支持直接分享图片。", "保存图片", "share-save");
        return navigator.share({ title: "Halo Body Weather", text: `${content.title}｜${content.description}`, files: [file] }).catch(() => flash("未完成分享"));
      });
      return showInfoModal("系统分享暂不可用", "当前浏览器没有开放系统分享面板。你可以保存图片后再分享。", "保存图片", "share-save");
    }
    if (action === "share-copy") { const content = shareContent(); return copyText(`${content.title}｜${content.description}`, "已复制分享文字"); }
    if (action === "share-save") { closeModal(); return saveShareImage(); }
    if (action === "support-instructions") return showInfoModal("企业微信联系指引", "请在企业微信中搜索 Halo Ring 官方客服，或扫描正式服务入口提供的二维码。App 不会随跳转发送健康数据、Halo 对话或其他敏感信息。", "知道了");
    if (action === "widget-preview") return showWidgetPreview();
    if (action === "widget-add") return showWidgetAdded();
    if (action.startsWith("record-detail:")) return showRecordDetail(action.slice(14));
    if (action === "info:membership-rights") return showMembershipRules();
    if (action === "commerce-entry") return showCommerceBoundary();
    if (action === "account-deletion-submit") return showAccountDeletionConfirm();
    if (action === "account-channel-support") return showInfoModal("处理体验顾问合作", "注销会员账号不会结束独立渠道合同。请从这里联系企业微信客服，继续处理合同、历史结算和未完成事项；不需要重新开通经营身份。", "查看客服入口", "go:HELP-03");
    if (action === "account-deletion-confirm") {
      state.accountDeletionStatus = "submitted";
      state.navigationHistory = [];
      trackPrototypeEvent("account_deletion_submitted", { processing_sla: "15-business-days" });
      closeModal();
      return render();
    }
    if (action === "support-handoff") return showSupportHandoff();
    if (action === "logout") {
      state.signedIn = false;
      state.authCodeRequested = false;
      state.authVerified = false;
      state.chat = [];
      state.navigationHistory = [];
      trackPrototypeEvent("account_signed_out");
      return go("AUTH-01");
    }
    if (action === "studio-claim-benefit") return handleAction("studio-benefit-refresh");
    if (action === "wake-save") { if (!/^\d{2}:\d{2}$/.test(state.wakeDraft.time)) return flash("请填写有效的唤醒时间"); state.wakeSettings = { ...state.wakeDraft }; state.alarmSound = state.wakeSettings.sound; state.toggles.wake = state.wakeSettings.enabled; state.wakeSaved = true; state.snoozeUntil = ""; render(); return flash("唤醒设置已保存，原型不会实际响铃"); }
    if (action === "memory-confirm") return handleAction("halo-memory-confirm:quiet");
    if (action === "journey-pause") { state.journeyPaused = true; state.journeyDecision = "active"; trackPrototypeEvent("halo_journey_paused"); return render(); }
    if (action === "journey-resume") { state.journeyPaused = false; state.journeyDecision = "active"; trackPrototypeEvent("halo_journey_resumed"); return render(); }
    if (action === "journey-resume-today") { state.journeyPaused = false; state.journeyDecision = "active"; return render(); }
    if (action === "journey-replace") {
      if (state.journeyVariant < 2) state.journeyVariant += 1;
      else { state.journeyTheme = state.journeyTheme === "boundary" ? "pause" : "boundary"; state.journeyVariant = 1; state.journeyProgress = state.journeyRecords[state.journeyTheme].days.length; }
      state.journeyDecision = "active";
      state.journeyPaused = false;
      trackPrototypeEvent("halo_journey_action_replaced", { theme: state.journeyTheme, difficulty: state.journeyVariant });
      render();
      return flash("已经换成更容易开始的一步");
    }
    if (action === "journey-defer-open") return showJourneyDeferModal();
    if (action.startsWith("journey-defer:")) {
      const reason = action.slice(14);
      const reasons = { time: "今天没时间。", hard: "这一步还是太难。", timing: "现在不是合适的时候。", mood: "今天不想做。" };
      state.journeyMissCount += 1;
      state.journeyReason = reasons[reason] || "今天先不做。";
      state.journeyDecision = "deferred";
      state.journeyPaused = false;
      if (reason === "hard" || state.journeyMissCount >= 2) state.journeyVariant = Math.min(2, Math.max(1, state.journeyVariant + 1));
      trackPrototypeEvent("halo_journey_action_deferred", { reason, miss_count: state.journeyMissCount, difficulty_adjusted: state.journeyVariant > 0 });
      closeModal();
      return render();
    }
    if (action === "journey-unsuitable") return showInfoModal("停用这个主题？", "停用后不会再提醒你做这组练习，已有进度会保留。你可以换一个方向。", "停用并换主题", "journey-unsuitable-confirm");
    if (action === "journey-unsuitable-confirm") {
      state.journeyDecision = "unsuitable";
      state.journeyReason = "你已选择“这个主题不适合我”。";
      state.journeyPaused = false;
      trackPrototypeEvent("halo_journey_marked_unsuitable", { theme: state.journeyTheme });
      closeModal();
      return render();
    }
    if (action === "journey-replace-theme") {
      state.journeyTheme = state.journeyTheme === "boundary" ? "pause" : "boundary";
      state.journeyProgress = state.journeyRecords[state.journeyTheme].days.length;
      state.journeyVariant = 1;
      state.journeyDecision = "active";
      state.journeyReason = "";
      state.journeyMissCount = 0;
      state.journeyPaused = false;
      trackPrototypeEvent("halo_journey_theme_replaced", { theme: state.journeyTheme });
      return render();
    }
    if (action === "journey-step") { const journey = state.journeyRecords[state.journeyTheme]; if (journey.days.includes(experienceDay()) || journey.days.length >= 7) return flash("今天已经记下了，明天再继续"); journey.days.push(experienceDay()); journey.entries.push({ day: experienceDay(), action: currentJourneyStep().action, note: journey.note }); state.journeyPaused = false; state.journeyDecision = "active"; state.journeyMissCount = 0; state.journeyProgress = journey.days.length; trackPrototypeEvent("halo_journey_step_completed", { progress: state.journeyProgress, theme: state.journeyTheme, difficulty: state.journeyVariant }); return render(); }
    if (action === "journey-reset") { const previous = state.journeyRecords[state.journeyTheme]; state.journeyRecords[state.journeyTheme] = { days: [], entries: [], note: "", previous: [...(previous.previous || []), { days: previous.days, entries: previous.entries, note: previous.note }] }; state.journeyPaused = false; state.journeyProgress = 0; state.journeyVariant = 0; state.journeyMissCount = 0; state.journeyDecision = "active"; state.journeyReason = ""; trackPrototypeEvent("halo_journey_restarted"); return render(); }
    if (action.startsWith("open-conversation:")) return openHaloConversation(action.slice(18));
    if (action.startsWith("conversation-state:")) { const status = action.slice(19); const conversation = state.conversations.find((entry) => entry.id === state.activeConversationId); if (!conversation || !["active", "paused", "archived", "deleted"].includes(status)) return; conversation.status = status; state.conversationStatus = status; if (status === "deleted") { conversation.messages = []; conversation.title = "已删除会话"; state.chat = []; } trackPrototypeEvent("halo_conversation_state_changed", { conversation_id: state.activeConversationId, status }); return render(); }
    if (action.startsWith("rhythm-feeling:")) { state.rhythmFeeling = action.slice(15); return render(); }
    if (action === "rhythm-feeling-save") {
      if (!state.rhythmFeeling) return;
      const date = state.selectedRhythmDate;
      if (date > beijingDateKey()) return flash("不能为未来日期保存感受");
      const note = String(state.rhythmNote || "").trim();
      const id = `rhythm-${date}`;
      state.rhythmRecords[date] = { id, date, feeling: state.rhythmFeeling, note, source: "user-record", savedAt: new Date().toISOString() };
      state.subjectiveRecords = state.subjectiveRecords.filter(record => record.id !== id);
      state.subjectiveRecords.push({ id, label: state.rhythmFeeling, labels: [state.rhythmFeeling], original: note, category: "rhythm", source: "user-record", occurredAt: date, recordedAt: new Date().toISOString() });
      state.subjectiveMarkers = [...new Set(state.subjectiveRecords.flatMap(record => record.labels || [record.label]))];
      go("RHY-01");
      return flash("已保存为用户记录");
    }
    if (action === "rhythm-settings-save" || action === "rhythm-setup-save") {
      const { startDate, cycleLength, duration } = state.rhythmSettingsDraft;
      if (!rhythmSettingsValid(state.rhythmSettingsDraft)) return flash("请检查日期和周期范围，开始日不能晚于今天");
      state.rhythmSettings = { startDate, cycleLength, duration };
      state.rhythmSettingsSaved = true;
      state.rhythmDeleted = false;
      state.rhythmStatus = "ready";
      trackPrototypeEvent("rhythm_settings_saved", { cycle_length: Number(cycleLength), duration: Number(duration) });
      if (action === "rhythm-setup-save") return go(state.rhythmSetupReturn || "RHY-01");
      return render();
    }
    if (action === "profile-save") { const valid = state.profile.nickname.trim().length >= 2 && state.profile.birthday && Number(state.profile.height) >= 100 && Number(state.profile.height) <= 230 && Number(state.profile.weight) >= 25 && Number(state.profile.weight) <= 250; if (!valid) return flash("请检查昵称、生日、身高和体重"); state.profileSaved = true; trackPrototypeEvent("profile_saved"); return render(); }
    if (action === "feedback-submit") {
      const text = String(document.getElementById("feedback-text")?.value || state.feedbackDraft.text || "").trim();
      if (!text) return flash("请先描述遇到的问题");
      const ticket = { id: `FB-${Date.now().toString(36).toUpperCase()}-${state.feedbackTickets.length + 1}`, type: state.feedbackDraft.type, text, createdAt: new Date().toISOString(), logsAllowed: Boolean(state.toggles.logConsent), status: "local-draft" };
      state.feedbackTickets.unshift(ticket);
      state.activeFeedbackTicketId = ticket.id;
      state.feedbackDraft = { type: "设备连接", text: "" };
      state.feedbackSubmitted = true;
      trackPrototypeEvent("feedback_recorded_locally", { ticket_id: ticket.id, logs_allowed: ticket.logsAllowed });
      return render();
    }
    if (action === "feedback-new" || action === "feedback-list") { state.activeFeedbackTicketId = ""; state.feedbackSubmitted = false; return render(); }
    if (action.startsWith("feedback-view:")) { state.activeFeedbackTicketId = action.slice(14); return render(); }
    if (action === "sleep-goal-save") {
      state.sleepGoal = {
        duration: document.getElementById("sleep-duration")?.value || DEFAULT_SLEEP_GOAL.duration,
        workdayBedtime: document.getElementById("sleep-workday-bedtime")?.value || DEFAULT_SLEEP_GOAL.workdayBedtime,
        workdayWake: document.getElementById("sleep-workday-wake")?.value || DEFAULT_SLEEP_GOAL.workdayWake,
        restBedtime: document.getElementById("sleep-rest-bedtime")?.value || DEFAULT_SLEEP_GOAL.restBedtime,
        restWake: document.getElementById("sleep-rest-wake")?.value || DEFAULT_SLEEP_GOAL.restWake,
      };
      localStorage.setItem(SLEEP_GOAL_KEY, JSON.stringify(state.sleepGoal));
      render();
      return flash("睡眠目标已保存");
    }
    if (action === "record-save" || action === "record-save-inline") {
      const labels = [...state.recordDraft.labels];
      const note = state.recordDraft.note.trim();
      if (!labels.length && !note) return flash("先选一个标签，或写下此刻的感受");
      const occurredAt = new Date().toISOString();
      const reportMonth = state.recordDraft.reportMonth;
      state.subjectiveRecords.push({ id: `record-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, label: labels.join("、") || "感受", labels, original: note, occurredAt, source: "user-record", ...(reportMonth ? { reportMonth } : {}) });
      if (reportMonth && isHardwareActive() && state.dataLifecycle === "interpretable") window.HALO_COMMERCIAL_EXTENSION?.completeTask?.({ taskId: "monthly-review", occurredAt, verified: true, hardwareActive: true, newMember: state.newMember, memberCreatedAt: state.memberCreatedAt });
      state.subjectiveMarkers = [...new Set(state.subjectiveRecords.flatMap(record => record.labels || [record.label]))];
      state.recordDraft = { labels: [], note: "" };
      if (action === "record-save") go("TOD-01"); else render();
      return flash("用户记录已保存");
    }
    if (action.startsWith("toggle:")) {
      const key = action.slice(7);
      const handled = (typeof handleAccountToggle === "function" && handleAccountToggle(key)) || (typeof handleExperienceToggle === "function" && handleExperienceToggle(key));
      if (!handled) state.toggles[key] = !state.toggles[key];
      if (key === "haloBody") state.haloContext = hasBodyContext() ? "body" : "none";
      return render();
    }
    if (action.startsWith("choose:")) {
      const [, key, value] = action.split(":");
      if (!(typeof handleExperienceChoice === "function" && handleExperienceChoice(key, value))) state[key] = value;
      return render();
    }
    if (action.startsWith("membership-state:")) { setMembershipState(action.slice(17)); return render(); }
    if (action.startsWith("member-state:")) {
      const [, value, target] = action.split(":");
      if (state.current !== "PERM-01") setMembershipState(value);
      return go(target || "TOD-01");
    }
    if (action.startsWith("marker:")) {
      const value = action.slice(7);
      if (!SUBJECTIVE_OPTIONS.includes(value)) return;
      state.recordDraft.labels = state.recordDraft.labels.includes(value) ? state.recordDraft.labels.filter(item => item !== value) : [...state.recordDraft.labels, value];
      return render();
    }
    if (action === "activate-hardware") {
      if (!state.devicePaired || !state.toggles.bluetooth) return showInfoModal("请先完成配对", "确认蓝牙已开启并完成戒指配对后，才能同步激活。", "返回配对", "go:DEV-03");
      const firstActivation = state.membershipHardwareState === "never-bound";
      setMembershipState("active");
      state.deviceStatus = "connected";
      state.deviceResetStatus = "ready";
      if (firstActivation) { state.hardwareActivatedAt = new Date().toISOString(); state.dataLifecycle = "none"; }
      const commerce = window.HALO_COMMERCIAL_EXTENSION?.state;
      if (commerce?.resumeAfterDevice) { commerce.resumeAfterDevice = false; commerce.channelIdentity = "application"; return go("CHN-06"); }
      return go("RHY-00");
    }
    if (action.startsWith("measurement-start:")) { const type = action.slice(18); if (!ACCOUNT_MEASUREMENT_TYPES[type]) return; const unavailable = measurementUnavailable(); if (unavailable) return flash(unavailable); state.measurementType = type; state.measurementStatus = "running"; state.measured = false; return go("HLT-04"); }
    if (action === "measurement-reset") { if (state.measurementStatus === "running") state.measurementStatus = "ready"; const unavailable = measurementUnavailable(); if (unavailable) return flash(unavailable); state.measurementStatus = "running"; state.measured = false; return render(); }
    if (action === "measurement-cancel") { state.measurementStatus = "ready"; state.measured = false; return go("HLT-03"); }
    if (action === "measurement-fail") { state.measurementStatus = "failed"; state.measured = false; return render(); }
    if (action.startsWith("measurement-state:")) { state.measurementStatus = action.slice(18); state.measured = state.measurementStatus === "complete"; return render(); }
    if (action.startsWith("public-play:")) { const id = action.slice(12); if (!NIGHT_CONTENT[id]) return; state.publicNightChoice = id; state.nightChoice = id; return handleAction("night-start"); }
    if (action === "public-night-end") return handleAction("night-end");
    if (action === "night-preview") return showInfoModal("播放演示", `${currentNightContent().title}，${currentNightContent().duration} 分钟。当前原型不输出真实声音；开始后可以验证暂停、继续、历史与复盘。`, "开始演示", "night-start");
    if (action === "night-start") { if (state.nightSession && state.nightSession.status !== "ended") { if (state.nightSession.contentId !== state.nightChoice) return showInfoModal("还有一段内容未结束", "请先结束正在听的内容，再开始新的一段。已听进度不会丢失。", "回到正在听的内容", "go:NIG-04"); return go("NIG-04"); } const selected = currentNightContent(); const now = new Date().toISOString(); state.nightSession = { id: `night-${Date.now()}`, contentId: state.nightChoice, title: selected.title, duration: selected.duration + (isHardwareActive() && state.toggles.nightTail ? 20 : 0), primaryDuration: selected.duration, appendNoise: Boolean(isHardwareActive() && state.toggles.nightTail), startedAt: now, resumedAt: now, positionSeconds: 0, status: "playing", fadeEnabled: isHardwareActive() && state.toggles.sleepFade, hardwareEligibleAtStart: isHardwareActive(), personalized: hasBodyContext() }; state.playing = true; closeModal(); trackPrototypeEvent("night_content_started", { content_id: state.nightChoice, session_id: state.nightSession.id }); return go("NIG-04"); }
    if (action === "night-end") { const session = state.nightSession; if (!session || session.status === "ended") return go("NIG-10"); session.positionSeconds = nightPosition(session); session.status = "ended"; session.endedAt = new Date().toISOString(); session.review = { ...DEFAULT_NIGHT_REVIEW, factors: [], observationCount: 0 }; session.detail = `听了 ${Math.floor(session.positionSeconds / 60)} 分 ${session.positionSeconds % 60} 秒 · ${experienceTime(session.endedAt)} 结束`; session.taskVerification = session.hardwareEligibleAtStart && session.personalized && session.positionSeconds >= session.duration * 60 ? "eligible-prototype" : "ineligible"; if (session.taskVerification === "eligible-prototype") window.HALO_COMMERCIAL_EXTENSION?.completeTask?.({ taskId: "night-repair", occurredAt: session.endedAt, verified: true, hardwareActive: session.hardwareEligibleAtStart, newMember: Boolean(state.newMember), memberCreatedAt: state.memberCreatedAt || "" }); state.playing = false; state.nightHistory.unshift({ ...session }); state.selectedNightSessionId = session.id; state.nightReview = state.nightHistory[0].review; trackPrototypeEvent("night_content_completed", { content_id: session.contentId, session_id: session.id }); return go("NIG-10"); }
    if (action.startsWith("night-history:")) { const id = action.slice(14); if (!state.nightHistory.some((entry) => entry.id === id)) return flash("这条记录已不存在"); state.selectedNightSessionId = id; return go("TOD-08"); }
    if (action.startsWith("night-review-execution:")) {
      const execution = action.slice(23);
      state.nightReview.execution = execution;
      state.nightReview.saved = false;
      if (execution === "none") state.nightReview.helpfulness = "unknown";
      else if (state.nightReview.helpfulness === "unknown") state.nightReview.helpfulness = "";
      return render();
    }
    if (action.startsWith("night-review-help:")) { state.nightReview.helpfulness = action.slice(18); state.nightReview.saved = false; return render(); }
    if (action.startsWith("night-review-factor:")) {
      const factor = action.slice(20);
      if (factor === "none") state.nightReview.factors = state.nightReview.factors.includes("none") ? [] : ["none"];
      else {
        const current = state.nightReview.factors.filter((value) => value !== "none");
        state.nightReview.factors = current.includes(factor) ? current.filter((value) => value !== factor) : [...current, factor];
      }
      return render();
    }
    if (action === "night-review-save") {
      const review = state.nightReview;
      if (!review.execution || (review.execution !== "none" && !review.helpfulness)) return flash("请先完成前两项");
      review.observationCount = state.nightHistory.filter((entry) => entry.review?.saved || entry.id === state.selectedNightSessionId).length;
      review.saved = true;
      review.counted = true;
      trackPrototypeEvent("night_reflection_saved", { execution: review.execution, helpfulness: review.helpfulness, factor_count: review.factors.length, observation_count: review.observationCount });
      return render();
    }
    if (action === "night-review-edit") { state.nightReview.saved = false; return render(); }
    if (action === "wake-snooze") { const [hours, minutes] = (state.snoozeUntil || state.wakeSettings.time).split(":").map(Number); const total = (hours * 60 + minutes + 5) % 1440; state.snoozeUntil = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`; trackPrototypeEvent("smart_wake_snoozed", { minutes: 5 }); return render(); }
    if (action.startsWith("device-status:")) {
      const value = action.slice(14);
      if (value !== "disconnected" && !state.toggles.bluetooth) return flash("请先开启蓝牙权限");
      if (value === "syncing") { const unavailable = deviceOperationUnavailable("sync"); if (unavailable) return flash(unavailable); }
      if (value === "disconnected" && state.measurementStatus === "running") state.measurementStatus = "failed";
      if (value === "disconnected" && ["downloading", "verifying"].includes(state.firmwareStatus)) state.firmwareStatus = "failed";
      state.deviceStatus = value;
      if (state.current === "DEV-01" && value === "connecting") return go("DEV-02");
      if (state.current === "DEV-05" && value === "connected") return go("RHY-00");
      return render();
    }
    if (action.startsWith("body-weather:")) { state.bodyWeather = action.slice(13); return render(); }
    if (action.startsWith("lifecycle:")) { state.dataLifecycle = action.slice(10); return render(); }
    if (action.startsWith("trend:")) { state.trendPeriod = action.slice(6); return render(); }
    if (action.startsWith("firmware:")) { const next = action.slice(9); const unavailable = deviceOperationUnavailable("firmware"); if (unavailable) return flash(unavailable); const transitions = { available: ["downloading", "failed"], downloading: ["verifying", "failed"], verifying: ["current", "failed"], current: ["available"], failed: ["downloading"] }; if (!(transitions[state.firmwareStatus] || []).includes(next)) return flash("请按更新步骤继续"); state.firmwareStatus = next; return render(); }
    if (action.startsWith("share-bg:")) { state.shareBackground = action.slice(9); return render(); }
    if (action.startsWith("switch-halo-context:")) { const requested = action.slice(20); state.haloContext = requested === "body" && !hasBodyContext() ? "none" : requested; return render(); }
    if (action === "share-photo") return document.getElementById("share-photo-input")?.click();
    if (action === "share-preview") return showSharePreview();
    if (action === "request-location") { state.toggles.location = true; flash("位置已单独授权"); return render(); }
    if (action === "status-detail" || action.startsWith("status-detail:")) {
      const requestedStatus = action.includes(":") ? action.split(":")[1] : state.deviceStatus;
      const current = DEVICE_STATUS[requestedStatus] || DEVICE_STATUS.connected;
      return showInfoModal("Halo Ring 状态", `${current.label}：${current.detail}\n\n完整符号表示连接稳定；分段闭合表示正在连接；沿圆轨流动表示正在同步；克制缺口表示暂时未连接；琥珀点表示低电量；停止并出现提示点表示需要处理。普通断连不会使用风险色。`);
    }
    if (action === "info:data-quality") {
      const data = currentDataLifecycle();
      return showInfoModal("数据来源与质量", `${data.label}。${data.reason}\n\n还需要：${data.needed}。\n现在可以：${data.next}\n\n每项数据都会标明来源和更新时间。同一时段有多份记录时会避免重复计算。`);
    }
    if (action === "info:stress") { const weather = currentBodyWeather(); return showInfoModal("今天什么时候比较紧绷", `今天${weather.pressure}。Halo 会结合清醒时的 HRV、心率和活动来区分安静、紧绷与运动；运动时心率升高不会被算成压力。\n\n这些记录只用于回看日常变化，不能用于诊断。`, "知道了"); }
    if (action === "info:education") return showInfoModal("Halo 怎样看这些数据", "同一个数字对每个人意义不同。Halo 会先了解你的平时水平，再看连续几天有没有变化，不会因为一次高低就下结论。这些内容用于日常健康管理，不替代医疗诊断。");
    if (action === "info:inspiration") { trackPrototypeEvent("daily_inspiration_info_open", { source_page: state.current }); return showInfoModal("关于今日灵感", "这是一份每日固定的文化灵感，不是预测，也不会读取或解释你的健康数据。旺运穿衣借用五行穿衣的文化表达，颜色分组和吉级只是象征性提示，不保证改变心情、贵人、合作、收益或办事结果，也不会要求你购买新衣服。未填写生日时使用通用内容；授权生日后可以生成更贴近你的表达。它不用于医疗、投资、消费或其他重要决定。"); }
    if (action === "info:agreement") return showInfoModal("用户协议", "当前版本：2026 年 9 月 1 日。这里说明账号使用、服务边界、用户责任和争议处理方式。核心规则发生变化时，会按适用要求提前公示。");
    if (action === "info:privacy-policy") return showInfoModal("隐私政策", "这里说明设备、健康、会员、订单和服务数据的使用范围、保存方式，以及访问、更正、导出和删除入口。法定留存数据不会继续用于运营或个性化。");
    if (action === "info:health-ai-boundary") return showInfoModal("Halo 能做什么、不能做什么", "Halo 可以帮你读懂日常记录，给出生活和运动上的参考；它不会诊断疾病、开处方或处理医疗急症，也不能替代医生和其他专业医疗人员。");
    if (action.startsWith("sound:")) { const sound = action.slice(6); if (!["晨雾", "微光", "清泉", "柔和铃音"].includes(sound)) return; state.wakeDraft.sound = sound; state.wakeSaved = false; return render(); }
    if (action === "wake-sound-confirm") { state.previewSound = ""; return go("NIG-06"); }
    if (action.startsWith("ask:") || action === "send-chat") {
      const text = action.startsWith("ask:") ? action.slice(4) : document.getElementById("chat-input")?.value.trim();
      if (!text) return flash("先写下你想说的内容");
      const copy = currentHaloCopy();
      const reply = state.haloContext === "inspiration"
        ? (text.includes("颜色") || text.includes("穿") ? DAILY_INSPIRATION.outfitReply : "把它当作今天的一点文化灵感就好，不用它替你做重要决定。")
        : state.haloContext === "rhythm"
        ? rhythmContextSummary()
        : state.haloContext === "feeling"
        ? `我看到了你记录的“${state.haloFeelingRecords.at(-1)?.text || state.haloFeeling}”。我们可以先聊聊这份感受；它不会被写成设备测量结果。`
        : state.haloContext === "correction"
        ? `我会以你纠正后的感受为准，不把原解释继续当作事实。${state.aiCorrection.note ? `你补充的“${state.aiCorrection.note}”也只作为用户记录使用。` : ""}`
        : !hasBodyContext() || state.haloContext === "none" ? copy.noBodyTypedReply : copy.bodyTypedReply;
      return appendHaloReply(text, reply);
    }
    if (action === "toggle-player") return changeNightPlayback();
    if (action === "measure-complete") { if (state.measurementStatus !== "running") return flash("请先开始测量"); state.measurementStatus = "ready"; const unavailable = measurementUnavailable(); if (unavailable) { state.measurementStatus = "failed"; return render(); } state.measured = true; state.measurementStatus = "complete"; state.lastMeasurement = { type: state.measurementType, source: "prototype-demo", metrics: ACCOUNT_MEASUREMENT_TYPES[state.measurementType].metrics, completedAt: new Date().toISOString() }; return render(); }
    if (action === "device-reset-cancel") { state.deviceResetStatus = "ready"; return render(); }
    if (action === "device-reset-complete") { if (state.deviceResetStatus !== "pending") return; state.deviceResetStatus = "ready"; const unavailable = deviceOperationUnavailable("reset"); if (unavailable) { state.deviceResetStatus = "pending"; return flash(unavailable); } state.deviceResetStatus = "complete"; state.devicePaired = false; state.deviceOperationHistory.unshift({ label: "恢复出厂设置 · 演示设备确认完成", at: new Date().toISOString() }); setMembershipState("unbound-retained"); return render(); }
    if (action.startsWith("studio-select:")) { const id = action.slice(14); if (!STUDIO_EVENTS[id]) return flash("未找到这场活动"); state.selectedStudioEventId = id; syncStudioAliases(); return go("STU-09"); }
    if (action.startsWith("studio-history:")) { const id = action.slice(15); if (!state.studioRecords[id]?.sessionDone) return flash("还没有这场活动的完成记录"); state.selectedStudioHistoryId = id; state.selectedStudioEventId = id; syncStudioAliases(); return go("STU-15"); }
    if (action.startsWith("studio-booking:")) { const id = action.slice(15); if (!state.studioRecords[id]?.booked) return flash("没有找到这笔预约"); state.selectedStudioEventId = id; syncStudioAliases(); return go("STU-18"); }
    if (action === "studio-voucher-toggle") { const record = studioRecord(); if (record.booked) return flash("预约已创建，不能重复选择体验券"); const voucher = window.HALO_COMMERCIAL_EXTENSION?.getStudioVoucher?.(state.selectedStudioEventId); if (!voucher?.eligible) return flash("当前没有可用于这场活动的体验券"); record.useVoucher = !record.useVoucher; return render(); }
    if (action === "studio-institution-confirm") { const record = studioRecord(); if (record.sessionDone || record.booked) return go("STU-18"); record.eventSnapshot = { ...STUDIO_EVENTS[state.selectedStudioEventId] }; Object.assign(record, { booked: true, paid: true, bookingId: `SI-${state.selectedStudioEventId}-${Date.now()}`, source: "institution", paidAmount: 0, dueAmount: 0 }); syncStudioAliases(); return go("STU-10"); }
    if (action === "studio-feeling-save") { const record = studioRecord(); record.beforeFeeling = record.beforeDraft.trim(); record.beforeSavedAt = new Date().toISOString(); return go("STU-03"); }
    if (action === "studio-start") { const record = studioRecord(); if (!studioConfirmed(record) || !record.activityConsent) return go("STU-10"); const other = Object.entries(state.studioRecords).find(([id, entry]) => id !== state.selectedStudioEventId && entry.sessionStarted && !entry.sessionDone); if (other) return showInfoModal("还有一场体验未结束", "先结束或继续上一场体验，避免两场记录混在一起。", "继续上一场体验", `studio-resume:${other[0]}`); if (record.mode === "ring" && record.healthConsent && (state.deviceStatus !== "connected" || state.dataLifecycle !== "interpretable")) return showInfoModal("当前还不能生成个人报告", "戒指连接或有效记录尚未准备好。你可以先按基础方式参与，不生成个人健康报告。", "基础参与并开始", "studio-start-basic"); if (!record.sessionStarted) { record.startedAt = new Date().toISOString(); record.sessionStarted = true; } return go("STU-04"); }
    if (action.startsWith("studio-resume:")) { const id = action.slice(14); if (!state.studioRecords[id]?.sessionStarted) return; state.selectedStudioEventId = id; syncStudioAliases(); closeModal(); return go("STU-04"); }
    if (action === "studio-start-basic") { const record = studioRecord(); record.mode = "basic"; record.healthConsent = false; record.reportStatus = "insufficient"; syncStudioAliases(); closeModal(); return handleAction("studio-start"); }
    if (action === "studio-code-confirm") { if (state.studioCode.trim().toUpperCase() !== "HALO-STUDIO-2026") { state.studioCodeError = "请检查字母、数字和连字符后重试。"; return render(); } state.studioCodeError = ""; state.selectedStudioEventId = "yoga-evening"; return go("STU-02"); }
    if (action === "studio-scan-open") { state.studioScannerOpen = true; state.studioCodeError = ""; return render(); }
    if (action === "studio-scan-close") { state.studioScannerOpen = false; return render(); }
    if (action === "studio-scan-result") { state.studioScannerOpen = false; state.studioCode = "HALO-STUDIO-2026"; state.studioCodeError = ""; state.selectedStudioEventId = "yoga-evening"; return go("STU-02"); }
    if (action === "studio-book") { const record = studioRecord(); const event = selectedStudioEvent(); if (record.booked) return go("STU-18"); if (!event.seats) return flash("本场已满，请选择其他场次"); const voucher = window.HALO_COMMERCIAL_EXTENSION?.getStudioVoucher?.(state.selectedStudioEventId); if (record.useVoucher && !voucher?.eligible) { record.useVoucher = false; return flash("体验券当前不可用，请重新确认金额"); } record.eventSnapshot = { ...STUDIO_EVENTS[state.selectedStudioEventId] }; record.bookingId = `SB-${state.selectedStudioEventId}-${Date.now()}`; record.dueAmount = record.useVoucher ? 0 : event.price; if (record.useVoucher && !window.HALO_COMMERCIAL_EXTENSION?.consumeStudioVoucher?.(state.selectedStudioEventId, record.bookingId)) return flash("体验券没有锁定成功，请重试"); record.voucherId = record.useVoucher ? voucher.id : ""; record.booked = true; record.source = "app"; record.paid = record.dueAmount === 0; record.paidAmount = 0; syncStudioAliases(); return go(record.paid ? "STU-18" : "STU-17"); }
    if (action === "studio-pay") { const record = studioRecord(); if (!record.booked || record.refundStatus !== "none") return flash("这笔预约当前不能付款"); if (!record.paid) { record.paid = true; record.paidAmount = record.dueAmount; record.paidAt = new Date().toISOString(); } syncStudioAliases(); return go("STU-18"); }
    if (action === "studio-refund") { const record = studioRecord(); if (!record.booked || record.refundStatus !== "none") return flash("这笔预约无需重复取消"); if (record.sessionStarted || record.sessionDone || (record.paid && Date.now() > new Date(selectedStudioEvent().startsAt).getTime() - selectedStudioEvent().cancellationHours * 3600000)) return showInfoModal("已超过自助取消期限", "已开始或距离活动开始不足24小时，请联系活动客服核对可处理方式。", "联系活动客服", "go:HELP-03"); if (record.source === "institution") return showInfoModal("机构预约", "请通过原预约机构处理取消与退款，App 不会替机构确认到账。", "联系活动客服", "go:HELP-03"); record.refundStatus = record.paid && record.paidAmount > 0 ? "submitted" : "cancelled"; record.refundRequestedAt = new Date().toISOString(); if (record.refundStatus === "cancelled") window.HALO_COMMERCIAL_EXTENSION?.restoreStudioVoucher?.(record.bookingId); syncStudioAliases(); return render(); }
    if (action === "studio-refund-refresh") { const record = studioRecord(); if (record.refundStatus !== "submitted") return flash("没有待处理的退款"); record.refundStatus = "refunded"; record.refundedAmount = record.paidAmount; record.refundedAt = new Date().toISOString(); window.HALO_COMMERCIAL_EXTENSION?.restoreStudioVoucher?.(record.bookingId); syncStudioAliases(); return render(); }
    if (action === "studio-complete") { const record = studioRecord(); if (!studioConfirmed(record) || !record.sessionStarted || !record.activityConsent) return flash("请先完成预约确认并开始本次体验"); if (!record.sessionDone) { record.sessionDone = true; record.completedAt = new Date().toISOString(); record.hardwareEligibleAtCompletion = isHardwareActive(); record.reportStatus = studioCanReport(record) ? "waiting" : "insufficient"; record.benefitStatus = "pending"; } state.selectedStudioHistoryId = state.selectedStudioEventId; syncStudioAliases(); trackPrototypeEvent("studio_session_completed", { event_id: state.selectedStudioEventId, booking_id: record.bookingId }); return go("STU-12"); }
    if (action === "studio-report-refresh") { const record = studioRecord(); if (!record.sessionDone) return flash("体验尚未完成"); record.reportStatus = studioCanReport(record) ? "generated" : "insufficient"; syncStudioAliases(); trackPrototypeEvent("studio_report_status_refreshed", { event_id: state.selectedStudioEventId, booking_id: record.bookingId, status: record.reportStatus }); return render(); }
    if (action === "studio-report-retry") { const record = studioRecord(); if (!studioCanReport(record)) return flash("当前不满足个人报告条件"); record.reportStatus = "waiting"; syncStudioAliases(); return render(); }
    if (action === "studio-benefit-refresh") { const record = studioRecord(); if (!record.sessionDone || !studioConfirmed(record) || !record.hardwareEligibleAtCompletion) return flash("本次活动尚不符合奖励条件"); const posted = window.HALO_COMMERCIAL_EXTENSION?.awardStudioBenefit?.({ eventId: state.selectedStudioEventId, bookingId: record.bookingId, completed: record.sessionDone, paid: record.paid, hardwareActive: record.hardwareEligibleAtCompletion, occurredAt: record.completedAt, newMember: Boolean(state.newMember), memberCreatedAt: state.memberCreatedAt || "" }); if (!posted) return flash("暂无新增奖励：请检查本月活动次数或稍后核对"); record.benefitStatus = "posted"; syncStudioAliases(); trackPrototypeEvent("studio_benefit_posted", { event_id: state.selectedStudioEventId, booking_id: record.bookingId, points: 100, growth: 40 }); return render(); }
    if (action.startsWith("danger:")) {
      const [, title, message, label] = action.split(":");
      return showModal(title, message, label, `confirm-danger:${title}`);
    }
    if (action.startsWith("confirm-danger:")) {
      const title = action.slice(15);
      closeModal();
      if (["恢复出厂设置", "清空戒指缓存", "重置今日步数"].includes(title)) { const unavailable = deviceOperationUnavailable("reset"); if (unavailable) return flash(unavailable); if (title === "恢复出厂设置") { state.deviceResetStatus = "pending"; return render(); } state.deviceOperationHistory.unshift({ label: `${title} · 本地演示确认，未操作真实设备`, at: new Date().toISOString() }); render(); return flash("演示操作已记录，真实设备未操作"); }
      if (title === "清空 Halo 记忆") { state.haloMemories = []; state.haloMemoryCleared = true; flash("Halo 记忆已清空"); return render(); }
      if (title === "删除 Halo 数据") { state.haloMemories = []; state.conversations = []; state.chat = []; state.haloFeelingRecords = []; state.haloFeelingNote = ""; state.haloFeeling = ""; state.haloMemoryCleared = true; state.haloDataDeletionStatus = "submitted"; flash("本地 Halo 内容已清空，云端删除需在正式服务中核验"); return render(); }
      if (title === "删除节律数据") {
        state.rhythmDeleted = true; state.rhythmStatus = "empty";
        state.rhythmRecords = {}; state.rhythmFeeling = ""; state.rhythmNote = "";
        state.rhythmSettings = { startDate: "", cycleLength: "29", duration: "5" }; state.rhythmSettingsSaved = false;
        state.rhythmSettingsDraft = { ...state.rhythmSettings };
        state.subjectiveRecords = state.subjectiveRecords.filter(record => record.category !== "rhythm" && !(record.labels || []).includes("经期不适"));
        state.subjectiveMarkers = [...new Set(state.subjectiveRecords.flatMap(record => record.labels || [record.label]))];
        state.recordDraft.labels = state.recordDraft.labels.filter(label => label !== "经期不适");
        state.haloContext = state.haloContext === "rhythm" ? "none" : state.haloContext;
        flash("节律数据已删除"); return render();
      }
      if (title === "删除健康记录") { state.healthDeletionStatus = "submitted"; flash("健康记录删除申请已提交"); return render(); }
      if (title === "删除本次体验记录") { const record = studioRecord(); record.deletionStatus = "deleted"; record.beforeFeeling = ""; record.beforeDraft = ""; record.healthConsent = false; record.reportStatus = "withdrawn"; record.contactConsent = false; record.marketingConsent = false; syncStudioAliases(); flash("本次个人体验内容已从本地删除"); return render(); }
      flash(`${title}已完成`);
      return;
    }
    if (action === "close-modal") return closeModal();
  }

  groupNav.addEventListener("click", (event) => { const button = event.target.closest("[data-group]"); if (!button) return; state.group = button.dataset.group; const first = filteredPages()[0]; if (first) state.current = first.id; render(); });
  nav.addEventListener("click", (event) => { const button = event.target.closest("[data-page]"); if (button) go(button.dataset.page); });
  screen.addEventListener("click", (event) => handleAction(event.target.closest("[data-action]")?.dataset.action));
  screen.addEventListener("input", (event) => {
    if (window.HALO_COMMERCIAL_EXTENSION?.handleInput(event.target, { render, flash, track: trackPrototypeEvent })) return;
    if (typeof handleAccountInput === "function" && handleAccountInput(event.target)) return;
    if (typeof handleExperienceInput === "function" && handleExperienceInput(event.target)) return;
    if (event.target.id === "record-note") { state.recordDraft.note = event.target.value; persistAppProgress(); return; }
    if (event.target.id === "rhythm-note") { state.rhythmNote = event.target.value; persistAppProgress(); return; }
    if (event.target.id === "conversation-search") {
      state.conversationQuery = event.target.value;
      persistAppProgress();
      render();
      requestAnimationFrame(() => { const input = document.getElementById("conversation-search"); if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); } });
      return;
    }
    if (event.target.id === "studio-code") {
      state.studioCode = event.target.value;
      state.studioCodeError = "";
      persistAppProgress();
      const button = screen.querySelector('[data-action="studio-code-confirm"]');
      if (button) { button.disabled = !state.studioCode.trim(); button.setAttribute("aria-disabled", String(!state.studioCode.trim())); }
      return;
    }
    if (["rhythm-start-date", "rhythm-cycle-length", "rhythm-duration"].includes(event.target.id)) {
      const key = event.target.id === "rhythm-start-date" ? "startDate" : event.target.id === "rhythm-cycle-length" ? "cycleLength" : "duration";
      state.rhythmSettingsDraft[key] = event.target.value;
      state.rhythmSettingsSaved = false;
      persistAppProgress();
      const valid = rhythmSettingsValid(state.rhythmSettingsDraft);
      const button = screen.querySelector('[data-action="rhythm-settings-save"], [data-action="rhythm-setup-save"]');
      if (button) { button.disabled = !valid; button.setAttribute("aria-disabled", String(!valid)); }
      return;
    }
    if (["profile-nickname", "profile-birthday", "profile-height", "profile-weight"].includes(event.target.id)) {
      const key = event.target.id.replace("profile-", "");
      state.profile[key] = event.target.value;
      state.profileSaved = false;
      persistAppProgress();
      const valid = state.profile.nickname.trim().length >= 2 && state.profile.birthday && Number(state.profile.height) >= 100 && Number(state.profile.height) <= 230 && Number(state.profile.weight) >= 25 && Number(state.profile.weight) <= 250;
      const button = screen.querySelector('[data-action="profile-save"]');
      if (button) { button.disabled = !valid; button.setAttribute("aria-disabled", String(!valid)); }
      return;
    }
    if (event.target.id === "help-search") {
      state.helpQuery = event.target.value;
      persistAppProgress();
      render();
      requestAnimationFrame(() => { const input = document.getElementById("help-search"); if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); } });
      return;
    }
    if (event.target.id !== "share-zoom") return;
    state.shareZoom = Number(event.target.value);
    paintShareCards();
  });
  screen.addEventListener("change", (event) => {
    if (event.target.id !== "share-photo-input" || !event.target.files?.[0]) return;
    const file = event.target.files[0];
    if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) return flash("请选择小于 8 MB 的图片");
    const reader = new FileReader();
    reader.onload = () => { state.sharePhotoUrl = String(reader.result); state.shareBackground = "photo"; render(); };
    reader.onerror = () => flash("图片读取失败，请重新选择");
    reader.readAsDataURL(file);
  });
  modalRoot.addEventListener("click", (event) => handleAction(event.target.closest("[data-action]")?.dataset.action));
  document.querySelector(".inspector")?.addEventListener("click", (event) => handleAction(event.target.closest("[data-action]")?.dataset.action));
  tabbar.addEventListener("click", (event) => { const button = event.target.closest("[data-tab]"); if (button) switchTab(button.dataset.tab); });
  search.addEventListener("input", () => { state.query = search.value.trim(); const first = filteredPages()[0]; if (first && !filteredPages().some((item) => item.id === state.current)) state.current = first.id; render(); });
  document.getElementById("previous").addEventListener("click", () => go(previousId(state.current)));
  document.getElementById("next").addEventListener("click", () => handleAction(nextId(state.current)));
  window.addEventListener("keydown", (event) => { if (modalRoot.querySelector(".modal") || event.target.matches("input, textarea, select")) return; if (event.key === "ArrowLeft") go(previousId(state.current)); if (event.key === "ArrowRight") handleAction(nextId(state.current)); });
  window.addEventListener("hashchange", () => {
    const id = location.hash.slice(1).toUpperCase();
    if (!pages.some((item) => item.id === id)) return;
    if (id === state.current) return;
    capturePageView();
    const target = guardedRoute(id);
    state.current = target;
    const tab = tabForRoute(target);
    if (tab) {
      state.activeTab = tab;
      const stack = state.tabStacks[tab] || [tab];
      const index = stack.lastIndexOf(target);
      state.tabStacks[tab] = index >= 0 ? stack.slice(0, index + 1) : [...stack, target];
    }
    const trail = Array.isArray(history.state?.trail) ? history.state.trail : [target];
    history.replaceState({ halo: true, id: target, trail: [...trail.slice(0, -1), target] }, "", `#${target}`);
    render();
  });

  initializeReviewRepairs();
  if (typeof initializeAccountState === "function") initializeAccountState();
  if (typeof initializeExperienceState === "function") initializeExperienceState();
  new MutationObserver(() => {
    const modal = modalRoot.querySelector(".modal");
    if (!modal) { screen.inert = false; tabbar.inert = false; return; }
    if (!modalReturnFocus && document.activeElement !== document.body) modalReturnFocus = document.activeElement;
    modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true");
    if (!modal.hasAttribute("aria-label") && !modal.hasAttribute("aria-labelledby")) modal.setAttribute("aria-label", modal.querySelector("h2")?.textContent || "提示");
    screen.inert = true; tabbar.inert = true;
    if (!modal.contains(document.activeElement)) modal.querySelector("button:not([disabled]), input, textarea, select")?.focus();
    if (typeof paintShareCards === "function") paintShareCards(modalRoot);
  }).observe(modalRoot, { childList: true, subtree: true });
  document.addEventListener("keydown", event => {
    const modal = modalRoot.querySelector(".modal");
    if (!modal) return;
    if (event.key === "Escape") { event.preventDefault(); closeModal(); return; }
    if (event.key !== "Tab") return;
    const controls = [...modal.querySelectorAll("button:not([disabled]), input:not([disabled]), textarea, select, a[href], [tabindex='0']")].filter(el => el.getClientRects().length);
    const first = controls[0], last = controls.at(-1);
    if ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) { event.preventDefault(); (event.shiftKey ? last : first)?.focus(); }
  });
  const initial = location.hash.slice(1).toUpperCase() || state.lastVisitedRoute || "TOD-01";
  if (pages.some((item) => item.id === initial)) {
    state.current = guardedRoute(initial);
  }
  const initialTrail = Array.isArray(history.state?.trail) ? history.state.trail : [state.current];
  history.replaceState({ halo: true, id: state.current, trail: [...initialTrail.slice(0, -1), state.current] }, "", `#${state.current}`);
  render();
})();
