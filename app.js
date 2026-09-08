(function () {
  if (new URLSearchParams(location.search).has("demo") && !window.HaloDemoSessionReady) throw new Error("独立演示尚未加载，请重新加载页面；旧记录未改变。");
  const pages = window.HALO_V5_PAGES || [];
  const groups = ["全部", "首次使用", "设备", "今日", "健康数据", "夜间", "Halo AI", "节律", "我的", "会员与积分", "Halo Select", "渠道经营", "Halo Studio"];
  const MEMBERSHIP_STATE_KEY = "membershipHardwareState";
  const SUBJECTIVE_RECORDS_KEY = "haloSubjectiveRecords";
  const SLEEP_GOAL_KEY = "haloSleepGoal";
  const APP_PROGRESS_KEY = "haloV5AppProgress";
  let todayRhythmStorage = null;
  let personalScope = null;
  let startup = null;
  let deviceHome = null;
  let initialSync = null;
  let deviceInfo = null;
  let deviceMaintenance = null;
  let dataPrivacy = null;
  let notificationSettings = null;
  let systemHealth = null;
  let helpCenter = null;
  let feedbackEditor = null;
  let supportContact = null;
  let aboutLegal = null;
  let accountSecurity = null;
  let accountDeletion = null;
  let haloHistory = null;
  let haloMemory = null;
  let haloProactive = null;
  let haloFeelingEditor = null;
  let haloJourney = null;
  let haloPrivacyControls = null;
  let haloSettingsHub = null;
  let studioTodayReminder = null;
  let studioBenefit = null;
  let studioContact = null;
  let studioHistory = null;
  let studioRecordDetail = null;
  let studioCodeLookup = null;
  let studioInstitution = null;
  let oxygenMeasurement = null;
  const AUTH_DEMO_CODE = "000000";
  const AUTH_CONSENT_SCOPE = "user-privacy-ai-2026-09-07";
  const BASIC_PROFILE_FIELDS = ["birthday", "height", "weight"];
  const PROFILE_EDITOR_FIELDS = ["nickname", "birthday", "height", "weight", "birthdayBenefit"];
  const MEMBERSHIP_STATES = ["never-bound", "active", "unbound-retained"];
  const MEMBERSHIP_RULE_VERSION = "v1.20";
  const SUBJECTIVE_OPTIONS = ["情绪", "疲惫", "饮酒", "晚睡", "经期不适"];
  const ACTIVITY_FEELINGS = ["轻松", "刚刚好", "有点累"];
  const RECORD_FEELINGS = ["有精神", "还好", "有点累", "紧绷", "低落"];
  const RECORD_CIRCUMSTANCES = ["饮酒", "晚睡", "经期不适"];
  const RECORD_OPTIONS = [...new Set([...SUBJECTIVE_OPTIONS, ...RECORD_FEELINGS])];
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
      { title: "睡前，留 12 分钟放松", action: "先结束工作消息，把手机放远，让这段时间不被工作打断。", detail: "12 分钟 · 按原计划" },
      { title: "先离开工作消息 5 分钟", action: "打开勿扰，把手机放到伸手够不到的地方", detail: "5 分钟 · 更容易开始" },
      { title: "放下手机，歇 1 分钟", action: "把手机屏幕朝下放好，舒服地坐着，慢慢呼吸几次。", detail: "1 分钟 · 最轻版本" },
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
  const storedAppProgress = readStoredJson(APP_PROGRESS_KEY, {});
  // Preserve legacy demo hardware; a fresh browser starts without an activated device.
  const defaultMembershipState = storedAppProgress.signedIn === true ? "active" : "never-bound";
  const initialMembershipState = MEMBERSHIP_STATES.includes(requestedMembershipState)
    ? requestedMembershipState
    : MEMBERSHIP_STATES.includes(storedMembershipState) ? storedMembershipState : defaultMembershipState;
  if (!MEMBERSHIP_STATES.includes(storedMembershipState) && !MEMBERSHIP_STATES.includes(requestedMembershipState)) {
    try { localStorage.setItem(MEMBERSHIP_STATE_KEY, initialMembershipState); } catch { /* Keep browsing when storage is unavailable. */ }
  }
  const storedSubjectiveRecords = readStoredJson(SUBJECTIVE_RECORDS_KEY, []);
  const storedSleepGoal = readStoredJson(SLEEP_GOAL_KEY, DEFAULT_SLEEP_GOAL);
  const state = {
    current: "TOD-01",
    group: "全部",
    query: "",
    studioHomeFilter: "全部",
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
    deviceLastSyncedAt: "",
    dataLifecycle: "interpretable",
    bodyWeather: "slow",
    trendPeriod: "7",
    bodyWeatherTrendView: { period: "7", date: "" },
    healthSelectedDate: "",
    healthDemoRecordDate: "",
    healthDetailContext: null,
    heartDeviceReturn: null,
    heartTrendSelection: null,
    respirationWindowEnd: "",
    respirationSleepReturn: null,
    oxygenWindowEnd: "",
    oxygenMode: "day",
    oxygenDaySelection: null,
    oxygenMeasurements: { accounts: {}, legacyImported: false },
    oxygenReviewScenario: "unknown",
    oxygenDemoEntry: "",
    oxygenRelatedReturn: null,
    oxygenDeviceReturn: null,
    temperatureWindowEnd: "",
    temperatureReviewScenario: "unknown",
    temperatureDemoEntry: "",
    temperatureExternalReturn: null,
    recordEntryContext: null,
    sleepStage: "all",
    activityRecordDraft: { id: "", feeling: "", note: "" },
    activityRecordsScope: "day",
    activitySync: { request: null, receipt: null, message: "" },
    firmwareStatus: "available",
    shareEditors: { accounts: {} },
    dataQualityView: null,
    haloContext: "body",
    haloSource: null,
    haloDraft: "",
    haloFeeling: "",
    haloToolsOpen: false,
    chat: [],
    haloMemoryCleared: false,
    haloMemoryDrafts: {},
    haloDataDeletionStatus: "ready",
    rhythmDeleted: false,
    rhythmStatus: "empty",
    rhythmMode: "record-only",
    rhythmHomeView: null,
    rhythmEntryDrafts: {},
    rhythmSettingsConfirmedAt: "",
    healthDeletionStatus: "ready",
    studioDeletionStatus: "ready",
    membershipHardwareState: initialMembershipState,
    subjectiveMarkers: Array.isArray(storedSubjectiveRecords) ? storedSubjectiveRecords.filter((label) => SUBJECTIVE_OPTIONS.includes(label)) : [],
    sleepGoal: { ...DEFAULT_SLEEP_GOAL, ...(storedSleepGoal && typeof storedSleepGoal === "object" ? storedSleepGoal : {}) },
    measurementStatus: "ready",
    measurementCenterFilter: "all",
    measurementHistoryLimit: 5,
    accountDeletionStatus: "ready",
    accountDeletionRequest: null,
    signedIn: false,
    authCodeRequested: false,
    authVerified: false,
    authReturnRoute: "",
    welcomeShopping: false,
    authForm: { phone: "", termsAccepted: false, touched: false, request: null, error: "" },
    agreementAcceptance: null,
    systemHealth: { version: 1, accounts: {} },
    connectionIntro: { permission: "not-requested", request: null, choice: "", completed: false },
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
    aiCorrectionDraft: null,
    aiCorrectionHistory: [],
    journeyPaused: false,
    journeyProgress: 2,
    journeyTheme: "boundary",
    journeyVariant: 0,
    journeyMissCount: 1,
    journeyDecision: "active",
    journeyReason: "",
    wakeSaved: false,
    wakeAlarmReceipt: null,
    snoozeUntil: "",
    profileSaved: false,
    basicProfile: { status: "not-started", draft: null, touched: {} },
    profile: { nickname: "Halo 用户", birthday: "", height: "", weight: "" },
    profileEditor: { draft: null, base: null, touched: {}, savedAt: "" },
    feedbackSubmitted: false,
    helpQuery: "",
    helpCenter: { accounts: {} },
    feedbackFlow: { accounts: {} },
    supportContact: null,
    rhythmFeeling: "",
    rhythmSettings: { startDate: "", cycleLength: "29", duration: "5" },
    rhythmSettingsDraft: null,
    rhythmSettingsEditor: null,
    rhythmSettingsSaved: false,
    nightChoice: "scan",
    nightHistory: [],
    nightReview: { ...DEFAULT_NIGHT_REVIEW },
    nightReviewDrafts: {},
    nightReviewEntry: null,
    healthReports: { accounts: {} },
    healthReportsDemo: null,
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
    recordEditDraft: null,
    recordEditorMode: "new",
    recordEditorError: "",
    rhythmRecords: {},
    selectedRhythmDate: "",
    rhythmMonth: "",
  };

  const persistedAppKeys = [
    "todayRhythmScope",
    "haloAccountScope",
    "personalAccountScope",
    "rhythmHomeView", "rhythmEntryDrafts", "rhythmSettingsConfirmedAt",
    "sleepGoal", "sleepNotifications",
    "dataQualityView",
    "shareEditors",
    "deviceWearGuide", "initialDeviceSync",
    "healthSelectedDate", "healthDemoRecordDate", "healthDetailContext", "sleepStage",
    "heartDeviceReturn", "recordEntryContext",
    "heartTrendSelection",
    "respirationWindowEnd", "respirationSleepReturn",
    "oxygenWindowEnd", "oxygenReviewScenario", "oxygenDemoEntry", "oxygenRelatedReturn", "oxygenDeviceReturn",
    "temperatureWindowEnd", "temperatureReviewScenario", "temperatureDemoEntry", "temperatureExternalReturn",
    "oxygenMode", "oxygenDaySelection", "oxygenMeasurements",
    "activityRecordDraft", "activityRecordsScope", "activitySync",
    "playing", "booked", "paid", "refundStatus", "sessionDone", "studioMode", "alarmSound",
    "dataLifecycle", "haloMemoryCleared", "haloDataDeletionStatus", "rhythmDeleted", "rhythmStatus", "rhythmMode",
    "healthDeletionStatus", "dataPrivacy", "studioDeletionStatus", "accountDeletionStatus", "accountDeletionRequest", "studioBenefitClaimed",
    "studioBenefitStatus", "studioReportStatus", "selectedStudioEventId", "selectedStudioHistoryId",
    "studioScannerOpen", "studioCode", "studioHomeFilter", "studioInstitutionChecks",
    "memoryProposalConfirmed", "aiCorrection", "aiCorrectionDraft", "aiCorrectionHistory", "bodyWeather", "journeyPaused", "journeyProgress", "journeyTheme", "journeyVariant", "journeyMissCount", "journeyDecision", "journeyReason", "wakeSoundSelection", "wakeSaved", "snoozeUntil", "wakeSnooze", "wakeAlarmReceipt",
    "profileSaved", "profile", "profileEditor", "basicProfile", "feedbackSubmitted", "helpQuery", "helpCenter", "previewSound", "rhythmFeeling", "rhythmSettings", "rhythmSettingsSaved",
    "nightChoice", "nightHistory", "nightReview", "nightReviewDrafts", "nightReviewEntry", "publicNightChoice", "conversationQuery", "activeConversationId",
    "nightPlan", "nightRecommendationGoal", "nightContentDetail",
    "healthReports", "healthReportsDemo",
    "systemHealth", "rhythmSettingsEditor", "rhythmCycleData",
    "conversationStatus", "signedIn", "authCodeRequested", "authVerified", "authPhone", "authReturnRoute", "welcomeShopping", "authForm", "agreementAcceptance", "connectionIntro", "lastVisitedRoute",
    "newMember", "memberCreatedAt", "activeTab", "tabStacks", "pageViews", "recordDraft", "recordEditDraft", "recordEditorMode", "rhythmRecords", "selectedRhythmDate", "rhythmMonth", "rhythmNote", "rhythmSetupReturn", "selectedReportMonth", "trendPeriod", "bodyWeatherTrendView", "rhythmSettingsDraft",
    "deviceStatus", "deviceLastSyncedAt", "firmwareStatus", "deviceFirmware", "deviceMaintenance", "devicePaired", "deviceScan", "pairedDevice", "deviceBinding", "deviceBindings", "deviceHub", "hardwareActivatedAt", "deviceResetStatus", "deviceOperationHistory",
    "measurementStatus", "measurementType", "measured", "lastMeasurement", "measurementCenterFilter", "measurementHistoryLimit", "feedbackDraft", "feedbackTickets", "activeFeedbackTicketId", "feedbackFlow", "supportContact",
    "studioRecords", "wakeSettings", "wakeDraft", "nightSession", "selectedNightSessionId", "conversations", "haloQuota", "haloFeelingNote",
    "haloSettingsView", "haloPrivacyView", "haloJourneyStore", "haloFeelingEditor", "haloFeelingRecords", "haloMemories", "haloMemoryDrafts", "haloQuietHours", "haloPreferences", "journeyRecords", "chat", "haloContext", "haloFeeling", "haloSource", "haloDraft",
  ];
  if (storedAppProgress && typeof storedAppProgress === "object") {
    for (const key of persistedAppKeys) {
      if (Object.prototype.hasOwnProperty.call(storedAppProgress, key)) state[key] = storedAppProgress[key];
    }
    if (storedAppProgress.toggles && typeof storedAppProgress.toggles === "object") {
      state.toggles = { ...state.toggles, ...storedAppProgress.toggles };
    }
    state.aiCorrection = { ...DEFAULT_AI_CORRECTION, ...(state.aiCorrection && typeof state.aiCorrection === "object" ? state.aiCorrection : {}) };
    state.aiCorrectionHistory = Array.isArray(state.aiCorrectionHistory) ? state.aiCorrectionHistory.filter(item => item && typeof item === "object") : [];
    state.aiCorrectionDraft = state.aiCorrectionDraft && typeof state.aiCorrectionDraft === "object" ? { ...state.aiCorrectionDraft, note: String(state.aiCorrectionDraft.note || "") } : null;
    state.nightReview = { ...DEFAULT_NIGHT_REVIEW, ...(state.nightReview && typeof state.nightReview === "object" ? state.nightReview : {}) };
    state.nightReview.factors = Array.isArray(state.nightReview.factors) ? state.nightReview.factors : [];
    if (!JOURNEY_THEMES[state.journeyTheme]) state.journeyTheme = "boundary";
    state.journeyVariant = Math.max(0, Math.min(2, Number(state.journeyVariant) || 0));
    state.journeyMissCount = Math.max(0, Number(state.journeyMissCount) || 0);
    state.profile = { nickname: "Halo 用户", birthday: "", height: "", weight: "", ...(state.profile || {}) };
  }
  state.authForm = { phone: "", code: "", termsAccepted: false, touched: false, request: null, login: null, error: "", codeError: "", cooldownUntil: 0, sequence: 0, ...(state.authForm && typeof state.authForm === "object" ? state.authForm : {}) };
  state.authForm.phone = String(state.authForm.phone || "");
  state.authForm.code = String(state.authForm.code || "").replace(/\D/g, "").slice(0, 6);
  // A prior two-document checkbox cannot silently become consent to three documents.
  // Keep existing sessions and form input; require an explicit check of the expanded scope.
  state.authForm.termsAccepted = state.authForm.termsAccepted === true && state.authForm.consentScope === AUTH_CONSENT_SCOPE;
  // Old AUTH-02 requests have no expiry or phone-bound challenge; preserve the draft, not their verification eligibility.
  if (state.authForm.request && (state.authForm.request.version !== 2 || !["sending", "sent", "failed", "used"].includes(state.authForm.request.status) || !Number.isFinite(state.authForm.request.readyAt))) {
    state.authForm.request = null;
    state.authForm.login = null;
    state.authForm.code = "";
    state.authCodeRequested = false;
    state.authVerified = false;
  }
  if (state.authForm.login && (!["verifying", "failed", "complete"].includes(state.authForm.login.status) || !Number.isFinite(state.authForm.login.readyAt))) state.authForm.login = null;
  // Normalize cached demo challenges without renewing expiry or changing an in-flight login.
  if (["sending", "sent"].includes(state.authForm.request?.status) && state.authForm.login?.status !== "verifying") state.authForm.request.demoCode = AUTH_DEMO_CODE;
  // The old default signedIn=true was a demo preset, not a completed login.
  // Only migrate the session flag; keep existing business assets and form drafts.
  state.signedIn = state.signedIn === true && state.authVerified === true;
  if (!state.signedIn && state.authForm.login?.status === "complete") state.authForm.login = null;
  state.welcomeShopping = state.welcomeShopping === true;
  let authRequestTimer = null;
  let authReviewOutcome = "success";
  let authLoginReviewOutcome = "success";
  state.connectionIntro = { permission: "not-requested", request: null, choice: "", completed: false, ...(state.connectionIntro && typeof state.connectionIntro === "object" ? state.connectionIntro : {}) };
  if (!["not-requested", "granted", "denied", "bluetooth-off"].includes(state.connectionIntro.permission)) state.connectionIntro.permission = "not-requested";
  if (state.connectionIntro.request && (!Number.isFinite(state.connectionIntro.request.readyAt) || !["checking", "complete", "failed"].includes(state.connectionIntro.request.status))) state.connectionIntro.request = null;
  // The intro is now navigation only. Retire an old intro-owned callback without granting permission.
  if (state.connectionIntro.request?.status === "checking" && state.connectionIntro.request.sourcePage !== "DEV-01") state.connectionIntro.request = null;
  // Guide completion is independent of registration dates and legacy demo hardware.
  // Preserve explicit skip/connection decisions made before this field existed.
  state.connectionIntro.completed = state.connectionIntro.completed === true || state.connectionIntro.choice === "skipped" || state.connectionIntro.choice === "connect" && state.connectionIntro.permission === "granted";
  state.basicProfile = { status: "not-started", draft: null, touched: {}, ...(state.basicProfile && typeof state.basicProfile === "object" ? state.basicProfile : {}) };
  if (!["not-started", "pending", "completed", "skipped"].includes(state.basicProfile.status)) state.basicProfile.status = "not-started";
  state.basicProfile.touched = { ...(state.basicProfile.touched || {}) };
  if (state.basicProfile.draft) state.basicProfile.draft = Object.fromEntries(BASIC_PROFILE_FIELDS.map(key => [key, String(state.basicProfile.draft[key] || "")]));
  state.profileEditor = { draft: null, base: null, touched: {}, savedAt: "", ...(state.profileEditor && typeof state.profileEditor === "object" && !Array.isArray(state.profileEditor) ? state.profileEditor : {}) };
  state.profileEditor.draft = normalizeProfileEditorSnapshot(state.profileEditor.draft);
  state.profileEditor.base = normalizeProfileEditorSnapshot(state.profileEditor.base);
  state.profileEditor.touched = Object.fromEntries(PROFILE_EDITOR_FIELDS.map(key => [key, state.profileEditor.touched?.[key] === true]));
  state.profileEditor.savedAt = typeof state.profileEditor.savedAt === "string" ? state.profileEditor.savedAt : "";
  let profileConflictReview = null;
  let profileEditorComposing = false;
  let profileDraftRestored = false;
  if (!validHealthDate(state.healthDemoRecordDate)) state.healthDemoRecordDate = beijingDateKey();
  if (!validHealthDate(state.healthSelectedDate)) state.healthSelectedDate = beijingDateKey();
  state.activityRecordDraft = { id: "", feeling: "", note: "", ...(state.activityRecordDraft && typeof state.activityRecordDraft === "object" ? state.activityRecordDraft : {}) };
  state.activityRecordDraft.id = typeof state.activityRecordDraft.id === "string" ? state.activityRecordDraft.id : "";
  state.activityRecordDraft.feeling = ACTIVITY_FEELINGS.includes(state.activityRecordDraft.feeling) ? state.activityRecordDraft.feeling : "";
  state.activityRecordDraft.note = String(state.activityRecordDraft.note || "");
  state.activityRecordsScope = state.activityRecordsScope === "all" ? "all" : "day";
  state.activitySync = { request: null, receipt: null, message: "", ...(state.activitySync && typeof state.activitySync === "object" ? state.activitySync : {}) };
  if (state.activitySync.request && (!state.activitySync.request.id || !Number.isFinite(state.activitySync.request.readyAt) || !["pending", "complete", "failed"].includes(state.activitySync.request.status))) state.activitySync.request = null;
  if (state.activitySync.receipt && (!validHealthDate(state.activitySync.receipt.date) || !Number.isFinite(Date.parse(state.activitySync.receipt.at)))) state.activitySync.receipt = null;
  let activitySyncTimer = null;
  let activitySyncReviewOutcome = "success";
  let activityRecordError = "";
  if (!state.healthDetailContext || !validHealthDate(state.healthDetailContext.date) || !pages.some(item => item.id === state.healthDetailContext.route)) state.healthDetailContext = null;
  let connectionIntroTimer = null;
  let connectionReviewOutcome = "granted";
  window.HALO_STUDIO_BENEFIT_CLAIMED = state.studioBenefitStatus === "posted" || state.studioBenefitClaimed;
  let studioTransactions = null;
  function persistAppProgress() {
    if (!generalSettingsSafe(false)) return;
    if (["STU-17", "STU-18"].includes(state.current)) return;
    if (state.current === "REF-01") return;
    if (haloSettingsHub?.blocksPersist()) return;
    if (haloPrivacyControls?.blocksPersist()) return;
    if (haloJourney?.blocksPersist()) return;
    if (haloFeelingEditor?.blocksPersist()) return;
    if (haloProactive?.blocksPersist()) return;
    if (haloMemory?.blocksPersist()) return;
    if (studioContact?.blocksPersist()) return;
    if (studioHistory?.blocksPersist()) return;
    if (studioRecordDetail?.blocksPersist()) return;
    if (studioCodeLookup?.blocksPersist()) return;
    if (studioInstitution?.blocksPersist()) return;
    if (haloHistory?.blocksPersist()) return;
    if (studioBenefit?.blocksPersist()) return;
    if (studioTodayReminder?.blocksPersist()) return;
    // A read-only next-day report must not restore stale health data when its
    // shared source was removed or cannot be read.
    if (state.current === "STU-06") {
      try {
        const nextDaySource = JSON.parse(localStorage.getItem(APP_PROGRESS_KEY));
        if (!nextDaySource?.studioRecords || typeof nextDaySource.studioRecords !== "object" || Array.isArray(nextDaySource.studioRecords)) return;
      } catch { return; }
    }
    // Refresh shared Studio records without taking over the authentication flow.
    studioTransactions?.sync();
    const snapshot = Object.fromEntries(persistedAppKeys.map((key) => [key, state[key]]));
    snapshot.toggles = state.toggles;
    try {
      writeAppSnapshot(snapshot);
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
      headline: "还没有收到戒指记录",
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
      signals: [["睡眠", "已有 5 晚"], ["身体能量", "还在校准"], ["今天怎么动", "按感受"]],
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
      reason: "最近一次同步未完成，昨晚 02:10–03:00 的记录缺失。这是记录缺口，不代表身体异常；以前的完整记录仍然保留。",
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
  // Shared demo observations: raw readings remain available before personal comparisons.
  // Missing overnight segments must never reuse the complete-night demo aggregates.
  function healthObservation(id) {
    const stage = state.dataLifecycle;
    const labels = { "TOD-05": "睡眠", "TOD-06": "夜间 HRV", "TOD-07": "活动", "HLT-01": "心率", "HLT-02": "夜间呼吸率", "HLT-05": "血氧", "HLT-06": "皮肤温度" };
    const measured = {
      "TOD-05": [["总睡眠", "6h 42m", "最近一晚记录"], ["夜间清醒", "34m", "夜醒 2 次"]],
      "TOD-06": [["夜间 HRV 估算", "42 ms", "暂不与个人范围比较"], ["夜间静息心率", "58 bpm", "最近一晚记录"]],
      "TOD-07": [["步数", "4,862", "截至最近一次同步"], ["活动消耗", "284 千卡", "已同步记录"]],
      "HLT-01": [["最近心率", "72 bpm", "08:38 · 已同步片段"]],
      "HLT-02": [["夜间平均", "15.2 次/分", "最近一晚记录"]],
      "HLT-05": [["夜间平均", "98%", "最近一晚有效片段"]],
      "HLT-06": [],
    };
    if (stage === "none") return { title: labels[id], value: "暂无数据", detail: "还没有收到戒指记录", metrics: [] };
    if (stage === "limited") {
      if (id === "HLT-01") return { title: labels[id], value: "72 bpm", detail: "08:38 已同步片段 · 夜间有缺口", metrics: measured[id] };
      if (id === "TOD-07") return { title: labels[id], value: "4,862 步", detail: "已同步活动 · 不代表全天", metrics: measured[id] };
      return { title: labels[id], value: "记录不完整", detail: "02:10–03:00 缺失，暂不汇总整晚或比较个人范围", metrics: [] };
    }
    return { title: labels[id], value: id === "TOD-07" ? "4,862 步" : measured[id]?.[0]?.[1] || "已有记录", detail: id === "HLT-06" ? "记录已保留，个人范围建立后显示相对变化" : "记录可看，暂不与个人范围比较", metrics: measured[id] || [] };
  }
  function pendingHealthObservations(id) {
    if (state.dataLifecycle === "none") return emptyHealthData();
    if (id === "TOD-03") return `${notice("已有记录可以查看", "Body Weather 需要完整记录和个人范围。现在可先看已同步项目，暂不生成状态评分或比较结论。")}${["TOD-05", "TOD-06", "TOD-07"].map(route => { const observation = healthObservation(route); return setting(observation.title, observation.detail, `go:${route}`, observation.value); }).join("")}`;
    const observation = healthObservation(id);
    return `${observation.metrics.length ? metrics(observation.metrics) : ""}${notice(observation.value, observation.detail, state.dataLifecycle === "limited" ? "warm" : "sage")}`;
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
  function currentNightContent(id = state.nightChoice) { const base = NIGHT_CONTENT[id] || NIGHT_CONTENT.scan; if (isHardwareActive()) return base; const content = { breath: ["5 分钟睡前呼吸", 5], scan: ["10 分钟身体扫描", 10], sound: ["15 分钟安睡音频", 15] }[id] || ["10 分钟身体扫描", 10]; return { ...base, title: content[0], duration: content[1] }; }
  function selectedStudioEvent(id = state.selectedStudioEventId) { return state.studioRecords?.[id]?.eventSnapshot || STUDIO_EVENTS[id] || STUDIO_EVENTS["yoga-evening"]; }
  function studioBookingUnavailable(id = state.selectedStudioEventId) {
    if (!Object.prototype.hasOwnProperty.call(STUDIO_EVENTS, id)) return "暂时无法打开这场活动";
    const event = selectedStudioEvent(id);
    if (!Number.isFinite(Date.parse(event.startsAt))) return "本场时间待确认";
    if (Date.parse(event.startsAt) <= Date.now()) return "本场预约已结束";
    if (!Number.isInteger(event.seats) || event.seats < 0 || !Number.isFinite(event.price) || event.price < 0) return "本场预约信息待确认";
    return event.seats === 0 ? "本场已满" : "";
  }

  function writeAppSnapshot(snapshot) {
    try {
      // Logout writes this compatibility field explicitly; keep subsequent view
      // writes aligned instead of retaining its stale empty value from storage.
      if (!Object.prototype.hasOwnProperty.call(snapshot, "navigationHistory")) snapshot.navigationHistory = state.navigationHistory;
      if (!Object.prototype.hasOwnProperty.call(snapshot, "subjectiveMarkers")) snapshot.subjectiveMarkers = state.subjectiveMarkers;
      let next = todayRhythmStorage ? todayRhythmStorage.prepare(snapshot) : snapshot;
      if (personalScope) next = personalScope.prepare(next);
      localStorage.setItem(APP_PROGRESS_KEY, JSON.stringify(next));
      todayRhythmStorage?.accept(next);
      personalScope?.accept(next);
      return next;
    } catch (error) { todayRhythmStorage?.fail(error); throw error; }
  }
  function writeNotificationProgress(changes) {
    const snapshot = { ...Object.fromEntries(persistedAppKeys.map(key => [key, state[key]])), ...changes, toggles: changes.toggles || state.toggles };
    try { const saved = writeAppSnapshot(snapshot); for (const key of Object.keys(changes)) changes[key] = saved[key]; } catch { return false; }
    Object.assign(state, changes);
    return true;
  }
  function writePrivacyProgress(changes, records) {
    const snapshot = { ...Object.fromEntries(persistedAppKeys.map(key => [key, state[key]])), ...changes, toggles: changes.toggles || state.toggles };
    let oldRecords, mergedRecords;
    try {
      oldRecords = localStorage.getItem(SUBJECTIVE_RECORDS_KEY);
      if (records !== undefined) {
        mergedRecords = todayRhythmStorage?.mergeRecords(records) || { all: records, active: records };
        localStorage.setItem(SUBJECTIVE_RECORDS_KEY, JSON.stringify(mergedRecords.all));
      }
      const latest = JSON.parse(localStorage.getItem(APP_PROGRESS_KEY) || "{}");
      const saved = writeAppSnapshot({ ...latest, ...snapshot });
      for (const key of Object.keys(changes)) changes[key] = saved[key];
    } catch {
      if (records !== undefined) { try { if (oldRecords === null) localStorage.removeItem(SUBJECTIVE_RECORDS_KEY); else if (oldRecords !== undefined) localStorage.setItem(SUBJECTIVE_RECORDS_KEY, oldRecords); } catch { /* No successful deletion is reported. */ } }
      return false;
    }
    Object.assign(state, changes);
    if (records !== undefined) {
      records.splice(0, records.length, ...mergedRecords.active);
      todayRhythmStorage?.acceptRecords(records);
      state.subjectiveRecords = records;
    }
    return true;
  }
  function experienceDay() { return new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10); }
  function experienceTime(value) { return new Date(value).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
  function initializeExperienceState() {
    state.wakeSettings = { snoozeMinutes: 5, time: "07:20", window: "30", sound: state.alarmSound || "晨雾", enabled: state.toggles.wake !== false, ...(state.wakeSettings || {}) };
    state.wakeDraft = { ...state.wakeSettings, ...(state.wakeDraft || {}) };
    state.haloFeelingNote = state.haloFeelingNote || "";
    state.haloFeelingRecords = Array.isArray(state.haloFeelingRecords) ? state.haloFeelingRecords : [];
    state.haloQuietHours = { start: "23:30", end: "08:00", ...(state.haloQuietHours || {}) };
    state.haloPreferences = { tone: state.haloPreferences?.tone === "gentle" ? "gentle" : "direct", length: state.haloPreferences?.length === "detailed" ? "detailed" : "short" };
    state.haloQuota = state.haloQuota?.day === experienceDay() ? state.haloQuota : { day: experienceDay(), used: 0 };
    state.conversations = Array.isArray(state.conversations) ? state.conversations : [];
    state.chat = Array.isArray(state.chat) ? state.chat : [];
    if (!state.conversations.length && state.chat.length) state.conversations.push({ id: state.activeConversationId || `hc-${Date.now()}`, title: state.chat.find((m) => m.role === "user")?.text.slice(0, 30) || "当前对话", status: "active", messages: state.chat, updatedAt: new Date().toISOString() });
    state.conversations.forEach((entry) => {
      entry.messages = Array.isArray(entry.messages) ? entry.messages : [];
      entry.draft = String(entry.draft || "");
      // Legacy chats have no reliable source association. Retain their messages without attributing today's record to them.
      entry.source = cloneHaloSource(entry.source);
      entry.context = entry.source?.kind || "none";
      entry.title = String(entry.title || entry.messages.find((message) => message.role === "user")?.text?.slice(0, 30) || entry.draft.slice(0, 30) || "未命名对话");
      entry.updatedAt = typeof entry.updatedAt === "string" ? entry.updatedAt : "";
    });
    const conversation = state.conversations.find((entry) => entry.id === state.activeConversationId && entry.status !== "deleted");
    state.chat = conversation ? conversation.messages.map((message) => ({ ...message })) : [];
    state.conversationStatus = conversation?.status || "new";
    state.haloDraft = conversation ? conversation.draft : String(state.haloDraft || "");
    state.haloSource = conversation ? cloneHaloSource(conversation.source) : Object.prototype.hasOwnProperty.call(storedAppProgress, "haloSource") ? cloneHaloSource(state.haloSource) : createHaloSource(state.haloContext);
    state.haloContext = state.haloSource?.kind || "none";
    if (!conversation) state.activeConversationId = "";
    if (!Array.isArray(state.haloMemories)) state.haloMemories = [];
    state.journeyRecords = state.journeyRecords && typeof state.journeyRecords === "object" ? state.journeyRecords : {};
    for (const theme of Object.keys(JOURNEY_THEMES)) {
      const journey = state.journeyRecords[theme] || (state.journeyRecords[theme] = { days: [], entries: [], note: "" });
      journey.days = Array.isArray(journey.days) ? journey.days : [];
      journey.entries = Array.isArray(journey.entries) ? journey.entries : [];
      journey.previous = Array.isArray(journey.previous) ? journey.previous : [];
      if (!journey.status) journey.status = journey.days.length >= 7 ? "completed" : theme !== state.journeyTheme ? "active" : state.journeyDecision === "unsuitable" ? "ended" : state.journeyPaused ? "paused" : state.journeyDecision === "deferred" ? "deferred" : "active";
      journey.variant = journey.variant ?? (theme === state.journeyTheme ? state.journeyVariant : 0);
      journey.reason = journey.reason ?? (theme === state.journeyTheme ? state.journeyReason : "");
      journey.missCount = journey.missCount ?? (theme === state.journeyTheme ? state.journeyMissCount : 0);
    }
    syncJourneyAliases();
    state.nightHistory = Array.isArray(state.nightHistory) ? state.nightHistory.filter((entry) => entry.id && entry.startedAt && entry.endedAt) : [];
    if (state.nightSession && !state.nightSession.id) state.nightSession = null;
    state.selectedNightSessionId = state.selectedNightSessionId || state.nightHistory[0]?.id || "";
    state.studioRecords = state.studioRecords && typeof state.studioRecords === "object" ? state.studioRecords : {};
    state.toggles.sleepFade = state.toggles.sleepFade !== false;
    state.playing = Boolean(state.nightSession?.status === "playing");
    syncStudioAliases();
    if (!initializeExperienceState.playbackTimer) initializeExperienceState.playbackTimer = setInterval(() => {
      if (personalScope?.accessError() || todayRhythmStorage?.accessError()) return;
      if (nightSessionDue() && finishNightSession.failedKey !== nightCompletionKey()) render();
      if (["NIG-01", "NIG-04"].includes(state.current)) nightHome.tick();
      if (state.current === "NIG-08") nightWake.tick();
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
  function studioIdentityValid(id = state.selectedStudioEventId) {
    const r = state.studioRecords?.[id];
    return Object.prototype.hasOwnProperty.call(STUDIO_EVENTS, id) && r?.booked === true && typeof r.bookingId === "string" && r.bookingId.trim().length > 0
      && (!r.eventId || r.eventId === id) && (!r.eventSnapshot?.id || r.eventSnapshot.id === id) && (!r.eventSnapshot?.eventId || r.eventSnapshot.eventId === id);
  }
  function studioSessionIdentityValid(record = state.studioRecords?.[state.selectedStudioEventId]) {
    const account = String(state.authPhone || state.authForm?.phone || "local-demo");
    return (!record?.accountRef || record.accountRef === account) && (!record?.sessionAccountRef || record.sessionAccountRef === account)
      && (!record?.sessionScope || record.sessionScope.eventId === state.selectedStudioEventId && record.sessionScope.bookingId === record.bookingId);
  }
  function studioConfirmed(record = state.studioRecords?.[state.selectedStudioEventId]) { return Boolean(record?.booked && typeof record.bookingId === "string" && record.bookingId.trim() && record.paid && (!record.source || ["app", "institution"].includes(record.source)) && record.refundStatus === "none" && !["submitting", "accepted", "checking", "unknown"].includes(record.refundRequest?.status) && !["processing", "checking", "unknown"].includes(record.paymentRequest?.status) && (!record.deletionStatus || record.deletionStatus === "ready")); }
  function studioCanReport(record = studioRecord(), id = state.selectedStudioEventId) { return studioReport.canReport(record, id); }
  function experienceRouteGuard(id) {
    if (!id.startsWith("STU-")) return id;
    if (id === "STU-01") return id;
    if (id === "STU-02") return studioCodeLookup?.receipt()?.eventId === state.selectedStudioEventId ? id : "STU-01";
    if (id === "STU-10") return id; // Exact-booking empty/error states are rendered by preparation itself.
    if (["STU-11", "STU-03", "STU-04", "STU-05", "STU-06", "STU-12", "STU-13", "STU-14"].includes(id) && !studioIdentityValid()) return "STU-18";
    if (id === "STU-18") return id; // This page validates the exact booking; never substitute another event.
    if (id === "STU-17" && !Object.prototype.hasOwnProperty.call(STUDIO_EVENTS, state.selectedStudioEventId)) return id;
    const record = studioRecord();
    if (["STU-17", "STU-18"].includes(id) && !record.booked) return "STU-16";
    if (["STU-05", "STU-06"].includes(id) && studioReport.summary(record).kind === "blocked") return "STU-12";
    if (["STU-10", "STU-11", "STU-03", "STU-04"].includes(id) && !studioConfirmed(record)) return record.booked ? "STU-18" : "STU-09";
    if (["STU-03", "STU-04"].includes(id) && !studioSessionIdentityValid(record)) return "STU-03";
    if (["STU-11", "STU-03", "STU-04"].includes(id) && record.sessionDone) return "STU-15";
    if (["STU-11", "STU-03"].includes(id) && record.sessionStarted) return "STU-04";
    if (["STU-11", "STU-03", "STU-04"].includes(id) && !record.activityConsent && !(id === "STU-04" && record.sessionStarted)) return "STU-10";
    if (id === "STU-04" && !record.sessionStarted) return "STU-03";
    if (["STU-05", "STU-06"].includes(id) && (!studioCanReport(record) || record.reportStatus !== "generated")) return "STU-12";
    if (id === "STU-06" && (typeof record.completedAt !== "string" || !Number.isFinite(Date.parse(record.completedAt)) || Date.parse(record.completedAt) > Date.now())) return "STU-05";
    return id;
  }
  function handleExperienceInput(target) {
    if (nightSound.input(target)) return true;
    if (nightWake.input(target)) return true;
    if (target.id === "chat-input") {
      state.haloDraft = target.value;
      saveHaloConversation();
      if (typeof updateHaloComposer === "function") updateHaloComposer();
      return true;
    }
    const fields = { "wake-time": [state.wakeDraft, "time"], "wake-window": [state.wakeDraft, "window"] };
    if (fields[target.id]) { const [object, key] = fields[target.id]; object[key] = target.value; state.wakeSaved = false; persistAppProgress(); return true; }
    if (target.id === "halo-feeling-note") { haloFeelingEditor.input(target.value); return true; }
    if (target.id === "studio-before-feeling") { studioFeeling.input(target.value); return true; }
    if (target.id === "journey-note") { haloJourney.input(target.value); return true; }
    return false;
  }
  function handleExperienceChoice(key, value) {
    if (["haloTone", "haloLength"].includes(key)) { selectGeneralPreference(key === "haloTone" ? "tone" : "length", value); return true; }
    return false;
  }
  function handleExperienceToggle(key) {
    const fields = { studioContact: "contactConsent", studioMarketing: "marketingConsent" };
    if (fields[key]) { const record = studioRecord(); record[fields[key]] = !record[fields[key]]; syncStudioAliases(); return true; }
    if (key === "wake") { state.wakeDraft.enabled = !state.wakeDraft.enabled; state.wakeSaved = false; return true; }
    return false;
  }
  function ensureHaloQuota() { if (state.haloQuota.day !== experienceDay()) state.haloQuota = { day: experienceDay(), used: 0 }; return state.haloQuota; }
  function cloneHaloSource(source) {
    if (!source || !["body", "feeling", "rhythm", "correction", "inspiration"].includes(source.kind)) return null;
    return { ...source, kind: source.kind, label: String(source.label || "参考来源"), text: String(source.text || "") };
  }
  function rhythmVisibleRecord(date = state.selectedRhythmDate) {
    if (!state.signedIn || state.rhythmDeleted || state.healthDeletionStatus && state.healthDeletionStatus !== "ready" || state.accountDeletionStatus && state.accountDeletionStatus !== "ready" || !validHealthDate(date)) return null;
    const record = state.rhythmRecords?.[date];
    const account = String(state.authPhone || state.authForm?.phone || "legacy-session");
    const recordAccount = record?.ownerAccount || record?.accountRef || record?.owner;
    return record && typeof record === "object" && !Array.isArray(record) && record.date === date && record.source === "user-record"
      && typeof record.id === "string" && record.id && typeof record.feeling === "string"
      && (record.note === undefined || typeof record.note === "string") && Boolean(record.feeling.trim() || record.note?.trim()) && (!recordAccount || String(recordAccount) === account) ? record : null;
  }
  function feelingRecordVisible(record) {
    const owner = record?.ownerAccount || record?.accountRef || state.haloFeelingEditor?.ownerAccount || state.dataPrivacy?.ownerAccount || state.authPhone;
    return Boolean(record && owner === state.authPhone && state.signedIn && state.authVerified);
  }
  function currentHaloSource() {
    const source = cloneHaloSource(state.haloSource);
    if (source?.kind === "feeling" && (source.ownerAccount && source.ownerAccount !== state.authPhone || !state.haloFeelingRecords.some(r => r.id === source.recordId && r.text === source.text && feelingRecordVisible(r)))) return null;
    const correction = activeWeatherCorrection();
    // An old body snapshot stays in history; it must not silently become today's health context.
    if (source?.kind === "body" && (!hasBodyContext() || source.date !== experienceDay())) return null;
    if (source?.kind === "body" && correction) return createHaloSource("correction");
    if (source?.kind === "correction" && (!correction || source.correctionId !== correction.id || source.interpretationId !== correction.interpretationId || source.capturedAt !== correction.savedAt)) return null;
    if (source?.kind === "rhythm" && !createHaloSource("rhythm", source)) return null;
    return source;
  }
  function createHaloSource(kind, snapshot) {
    if (kind === "rhythm") {
      const record = rhythmVisibleRecord(snapshot?.date || state.selectedRhythmDate);
      if (!record) return null;
      const account = String(state.authPhone || state.authForm?.phone || "legacy-session");
      const text = [record.date, record.feeling, record.note].filter(value => typeof value === "string" && value.trim()).join(" · ");
      const recordSavedAt = String(record.savedAt || "");
      if (snapshot && (snapshot.date !== record.date || snapshot.recordId !== record.id || snapshot.text !== text || snapshot.ownerAccount && snapshot.ownerAccount !== account || snapshot.recordSavedAt !== undefined && snapshot.recordSavedAt !== recordSavedAt)) return null;
      return { kind, label: "节律 · 用户记录", text, recordId: record.id, date: record.date, capturedAt: snapshot?.capturedAt || new Date().toISOString(), ownerAccount: account, recordSavedAt };
    }
    if (snapshot) return cloneHaloSource({ ...snapshot, kind, capturedAt: snapshot.capturedAt || new Date().toISOString() });
    const capturedAt = new Date().toISOString();
    if (kind === "body") return hasBodyContext() ? { kind, label: "今天的身体状态", text: currentBodyWeather().homeTitle, date: experienceDay(), capturedAt } : null;
    if (kind === "feeling") {
      const record = state.haloFeelingRecords.filter(feelingRecordVisible).at(-1);
      return record ? { kind, label: "用户记录", text: record.text, recordId: record.id, occurredAt: record.occurredAt, capturedAt, ownerAccount: state.authPhone } : null;
    }
    if (kind === "correction") { const correction = activeWeatherCorrection(); return correction ? { kind, label: "用户反馈 · 对今天解释的纠正", text: [correction.reasonLabel, correction.note].filter(Boolean).join(" · "), correctionId: correction.id, interpretationId: correction.interpretationId, date: correction.date, capturedAt: correction.savedAt } : null; }
    if (kind === "inspiration") return { kind, label: "今日灵感", text: `${DAILY_INSPIRATION.keyword} · ${DAILY_INSPIRATION.message}`, date: experienceDay(), capturedAt };
    return null;
  }
  function startHaloConversation() {
    saveHaloConversation();
    state.activeConversationId = "";
    state.chat = [];
    state.haloDraft = "";
    state.conversationStatus = "new";
    state.haloSource = createHaloSource("body");
    state.haloContext = state.haloSource?.kind || "none";
    state.haloToolsOpen = false;
    persistAppProgress();
  }
  function setHaloSource(kind, snapshot, fromEntry = false) {
    if (fromEntry && ["paused", "archived"].includes(state.conversationStatus)) startHaloConversation();
    state.haloSource = createHaloSource(kind, snapshot);
    state.haloContext = state.haloSource?.kind || "none";
    saveHaloConversation();
  }
  function saveHaloConversation() {
    let conversation = state.conversations.find((entry) => entry.id === state.activeConversationId && entry.status !== "deleted");
    if (!state.chat.length && !state.haloDraft.trim()) {
      if (conversation?.status === "draft") { state.conversations = state.conversations.filter((entry) => entry.id !== conversation.id); state.activeConversationId = ""; state.conversationStatus = "new"; }
      else if (conversation) { conversation.draft = ""; conversation.source = cloneHaloSource(state.haloSource); conversation.context = state.haloContext; }
      persistAppProgress();
      return;
    }
    if (!conversation) { state.activeConversationId = `hc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; conversation = { id: state.activeConversationId, status: state.chat.length ? "active" : "draft", messages: [] }; state.conversations.push(conversation); }
    conversation.messages = state.chat.map((message) => ({ ...message }));
    conversation.draft = state.haloDraft;
    conversation.source = cloneHaloSource(state.haloSource);
    conversation.context = state.haloContext;
    conversation.title = state.chat.find((message) => message.role === "user")?.text.slice(0, 30) || `草稿 · ${state.haloDraft.trim().slice(0, 24)}`;
    conversation.updatedAt = new Date().toISOString();
    if (!["paused", "archived"].includes(conversation.status)) conversation.status = state.chat.length ? "active" : "draft";
    state.conversationStatus = conversation.status;
    persistAppProgress();
  }
  function openHaloConversation(id) {
    const conversation = state.conversations.find((entry) => entry.id === id && entry.status !== "deleted");
    if (!conversation) return flash("这条会话已删除或不存在");
    saveHaloConversation();
    state.activeConversationId = id; state.chat = conversation.messages.map((message) => ({ ...message })); state.conversationStatus = conversation.status; state.haloToolsOpen = false;
    state.haloDraft = String(conversation.draft || ""); state.haloSource = cloneHaloSource(conversation.source); state.haloContext = state.haloSource?.kind || "none";
    return go("HAL-01");
  }
  function haloSafetySupport() {
    return `<section class="notice warm" role="status"><h3>先照顾眼前的安全</h3><p>如果你正处在危险中，或担心会伤害自己，请立即联系当地急救服务，也可以请一位信任的人过来陪你。Halo 不能提供紧急救援。</p>${buttons([["查看求助方式", "halo-safety-help", "primary"], ["暂停这次对话", "halo-safety-pause", "secondary"]])}</section>`;
  }
  let generalPreferenceDraft = null;
  let generalPreferenceOwner = "";
  let generalSettingsMounted = false;
  function generalSettingsSafe(show = true) {
    if (state.current !== "SET-03" || !generalSettingsMounted) return true;
    let error = "";
    try {
      const saved = JSON.parse(localStorage.getItem(APP_PROGRESS_KEY));
      const transient = new Set(["lastVisitedRoute", "navigationHistory", "pageViews", "tabStacks", "activeTab"]);
      if (!saved?.signedIn || !saved.authVerified || saved.authPhone !== state.authPhone) error = "账号状态已变化，请刷新后重新登录。";
      else if ([...new Set([...persistedAppKeys, "toggles", ...Object.keys(saved)])].some(key => !transient.has(key) && JSON.stringify(saved[key]) !== JSON.stringify(state[key]))) error = "其他页面已更新设置或记录。本次未保存，请刷新后按最新内容调整。";
    } catch { error = "暂时无法读取已保存的设置，请稍后重试。"; }
    if (error && show) {
      const target = modalRoot.querySelector('.gs-feedback') || screen.querySelector('#gs-system-motion');
      if (target) { target.textContent = error; target.setAttribute('role', 'alert'); }
    }
    return !error;
  }
  let generalMotionFeedback = "";
  function generalPreferenceSummary(preferences = state.haloPreferences) {
    return `${preferences.tone === "gentle" ? "温和一点" : "直接一点"} · ${preferences.length === "detailed" ? "详细回复" : "简短回复"}`;
  }
  function generalPreferenceExample(preferences) {
    const opening = preferences.tone === "gentle" ? "我们可以慢慢来。" : "";
    const detail = preferences.length === "detailed" ? "可以先把手机放远，给自己留一点安静的时间。如果不合适，我们再换个方式。" : "";
    return `${opening}今晚先选一段喜欢的放松内容。${detail}`;
  }
  function showHaloPreferences(keepDraft = false, feedback = "") {
    if (!keepDraft || !generalPreferenceDraft || generalPreferenceOwner !== state.authPhone) { generalPreferenceDraft = { ...state.haloPreferences }; generalPreferenceOwner = state.authPhone; }
    const group = (key, label, options) => `<fieldset class="gs-fieldset"><legend>${label}</legend><div class="gs-options" role="radiogroup" aria-label="${label}">${options.map(([value, title, description]) => `<button type="button" class="gs-option${generalPreferenceDraft[key] === value ? " selected" : ""}" role="radio" aria-checked="${generalPreferenceDraft[key] === value}" data-action="general:preference:${key}:${value}"><strong>${title}</strong><small>${description}</small></button>`).join("")}</div></fieldset>`;
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal gs-modal" data-general-modal="preferences" role="dialog" aria-modal="true" aria-labelledby="gs-preferences-title"><header class="gs-modal-header modal-title-row"><h2 id="gs-preferences-title">Halo 表达偏好</h2><button class="text-button" data-action="general:preferences/cancel">关闭</button></header><p class="gs-note">只调整之后回复的语气和长短，不改动历史对话。</p>${group("tone", "说话语气", [["direct", "直接一点", "先说重点"], ["gentle", "温和一点", "多一点缓冲"]])}${group("length", "回复长短", [["short", "简短回复", "少一些展开"], ["detailed", "详细回复", "多一些解释"]])}<section class="gs-preview" aria-live="polite"><h3>表达示例</h3><p>${esc(generalPreferenceExample(generalPreferenceDraft))}</p><small>仅为表达示例。</small></section><p class="gs-feedback" data-error="${Boolean(feedback)}" role="status">${esc(feedback || "选好后点击保存；关闭或取消不会生效。")}</p><div class="button-row gs-actions"><button class="primary" data-action="general:preferences/save">${feedback ? "重试保存" : "保存偏好"}</button><button class="secondary" data-action="general:preferences/cancel">取消</button></div></section></div>`;
  }
  function selectGeneralPreference(key, value) {
    const allowed = { tone: ["direct", "gentle"], length: ["short", "detailed"] };
    if (!allowed[key]?.includes(value) || !generalPreferenceDraft || generalPreferenceOwner !== state.authPhone || !state.signedIn || !modalRoot.querySelector('[data-general-modal="preferences"]')) return;
    generalPreferenceDraft[key] = value;
    modalRoot.querySelectorAll(`[data-action^="general:preference:${key}:"]`).forEach(button => {
      const selected = button.dataset.action === `general:preference:${key}:${value}`;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-checked", String(selected));
    });
    modalRoot.querySelector(".gs-preview p").textContent = generalPreferenceExample(generalPreferenceDraft);
  }
  function handleGeneralAction(action) {
    if (action.startsWith("general:") && action !== "general:preferences/cancel" && !generalSettingsSafe()) return true;
    if (action === "general:preferences/open") { showHaloPreferences(); return true; }
    if (action === "general:preferences/cancel") { generalPreferenceDraft = null; closeModal(); return true; }
    if (action === "general:preferences/save") {
      if (!generalPreferenceDraft || !modalRoot.querySelector('[data-general-modal="preferences"]')) return true;
      if (!state.signedIn || generalPreferenceOwner !== state.authPhone) { generalPreferenceDraft = null; closeModal(); flash("账号已变化，请重新打开表达偏好"); return true; }
      if (!writeNotificationProgress({ haloPreferences: { ...generalPreferenceDraft } })) { showHaloPreferences(true, "这次没能保存，原偏好没有变化。已保留你的选择，请重试。"); return true; }
      generalPreferenceDraft = null;
      closeModal(); render(); flash("表达偏好已保存，将用于之后的回复");
      return true;
    }
    if (action.startsWith("general:preference:")) { const [, , key, value] = action.split(":"); selectGeneralPreference(key, value); return true; }
    if (action === "general:motion/toggle") {
      if (state.current !== "SET-03") return true;
      const enabled = !state.toggles.reduceMotion;
      const saved = writeNotificationProgress({ toggles: { ...state.toggles, reduceMotion: enabled } });
      generalMotionFeedback = saved ? `已${enabled ? "开启" : "关闭"} App 内降低动态效果。` : "这次没能保存，开关保持原样。请重试。";
      render();
      return true;
    }
    if (action === "general:widget") { showWidgetPreview(); return true; }
    return action.startsWith("general:");
  }
  function generalSettingsPage() {
    const systemReduced = Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
    return `<div class="gs-page"><header class="gs-header"><button type="button" data-action="go:MY-01" aria-label="返回我的">‹</button><h1>通用设置</h1><span aria-hidden="true"></span></header><section class="gs-section" aria-labelledby="gs-common-title"><h2 id="gs-common-title">常用</h2><div class="gs-list"><div class="gs-row gs-toggle"><span class="gs-row-copy"><strong id="gs-motion-label">降低动态效果</strong><small id="gs-motion-note">减少呼吸动画和页面转场</small></span><button type="button" class="gs-switch" role="switch" aria-checked="${Boolean(state.toggles.reduceMotion)}" aria-labelledby="gs-motion-label" aria-describedby="gs-motion-note gs-system-motion" data-action="general:motion/toggle"><span aria-hidden="true"></span></button></div><button type="button" class="gs-row" data-action="general:widget"><span class="gs-row-copy"><strong>桌面小组件</strong><small>查看显示内容与隐私范围</small></span><em class="gs-value">预览</em><i aria-hidden="true">›</i></button><button type="button" class="gs-row" data-action="general:preferences/open"><span class="gs-row-copy"><strong>Halo 表达偏好</strong><small>${esc(generalPreferenceSummary())}</small></span><i aria-hidden="true">›</i></button></div><p class="gs-note" id="gs-system-motion">${systemReduced ? "系统已开启减少动画。即使关闭此开关，仍会遵循系统设置。" : "也会遵循系统的减少动画设置。"}</p>${generalMotionFeedback ? `<p class="gs-feedback" data-error="${generalMotionFeedback.startsWith("这次没能保存")}" role="status">${esc(generalMotionFeedback)}</p>` : ""}</section><section class="gs-section" aria-labelledby="gs-display-title"><h2 id="gs-display-title">显示信息</h2><div class="gs-list"><div class="gs-row gs-row-static"><span class="gs-row-copy"><strong>语言</strong></span><em class="gs-value">简体中文</em></div><div class="gs-row gs-row-static"><span class="gs-row-copy"><strong>单位</strong></span><em class="gs-value">公制 · 摄氏度</em></div></div><p class="gs-note">当前版本固定使用以上语言和单位，暂不支持切换。</p></section></div>`;
  }
  function appendHaloReply(text, reply, options = {}) {
    if (["paused", "archived"].includes(state.conversationStatus)) return flash("先继续这段对话，再发送消息");
    const safety = /不想活|自杀|伤害自己|伤害别人|轻生|结束生命|胸痛|喘不过气|呼吸困难/.test(text) || Boolean(state.chat.at(-1)?.safety);
    const quota = ensureHaloQuota();
    if (!isHardwareActive() && quota.used >= 10 && !safety) return flash("今天的 10 条消息已用完，明日北京时间 00:00 恢复");
    if (!isHardwareActive() && !safety) quota.used += 1;
    const detail = state.haloPreferences.length === "detailed" ? `${reply} 如果这个方向不适合，可以告诉我你最在意的部分，我们再一起调整。` : reply;
    const response = safety ? "听起来你现在很难受。先暂停普通建议，眼前的安全更重要。" : state.haloPreferences.tone === "gentle" ? `我们可以慢慢来。${detail}` : detail;
    const action = !safety && /放松|呼吸|睡前|停下来|睡不着|安静一会|安静一下/.test(text) ? { route: "NIG-01", label: "去选一段放松内容" } : null;
    state.chat.push({ role: "user", text, source: currentHaloSource() }, { role: "halo", text: response, safety, ...(action ? { action } : {}) });
    if (!options.preserveDraft) state.haloDraft = "";
    state.haloToolsOpen = false; saveHaloConversation(); render(); revealLatestHaloMessage();
  }
  function ownsNightSession(entry) { return window.HaloPersonalScope.ownsNight(state, entry); }
  function currentNightSession() { const records = state.nightHistory.filter(ownsNightSession); return records.find((entry) => entry.id === state.selectedNightSessionId) || records[0] || null; }
  function nightPosition(session = state.nightSession) {
    if (!session) return 0;
    const total = Number(session.duration) * 60, base = Number(session.positionSeconds) || 0, resumed = Date.parse(session.resumedAt);
    if (!Number.isFinite(total) || total <= 0) return 0;
    const elapsed = session.status === "playing" && Number.isFinite(resumed) ? Math.max(0, (Date.now() - resumed) / 1000) : 0;
    return Math.max(0, Math.min(total, Math.floor(base + elapsed)));
  }
  function changeNightPlayback() {
    const session = state.nightSession;
    if (!ownsNightSession(session) || session.status === "ended") return flash("请先选择当前账号的内容并开始播放");
    if (nightPosition(session) >= session.duration * 60) return handleAction("night-end");
    const next = { ...session, positionSeconds: nightPosition(session), status: session.status === "playing" ? "paused" : "playing", resumedAt: new Date().toISOString() };
    if (!writeNotificationProgress({ nightSession: next, playing: next.status === "playing" })) return showInfoModal("这次操作没能保存", "播放状态保持不变，请重试。当前原型没有输出真实音频。");
    return render();
  }
  function nightCompletionKey() { return `${state.authPhone || ""}:${state.nightSession?.id || ""}`; }
  function nightSessionDue() {
    const session = state.nightSession;
    if (personalScope?.accessError() || !ownsNightSession(session) || state.accountDeletionStatus === "submitted" || session.status !== "playing") return false;
    if (session.ownerAccount !== (state.authPhone || "") || session.memberRegistrationId !== (state.memberCreatedAt || "")) return false;
    if (!Number.isFinite(Date.parse(session.resumedAt)) || !Number.isFinite(Date.parse(session.startedAt))) return false;
    const tracks = nightPlaylist.sessionTracks(session), duration = Number(session.duration);
    return duration > 0 && Number.isFinite(duration) && tracks.length > 0 && (!Array.isArray(session.tracks) || tracks.length === session.tracks.length) && Math.abs(tracks.reduce((sum, item) => sum + item.duration, 0) - duration) < .001 && nightPosition(session) >= duration * 60;
  }
  function finishNightSession(navigate = true) {
    const session = state.nightSession;
    if (personalScope?.accessError() || !ownsNightSession(session)) return false;
    if (!session || session.status === "ended") { if (navigate) go("NIG-10"); return false; }
    const seconds = nightPosition(session), completed = seconds >= session.duration * 60;
    const dueAt = Date.parse(session.resumedAt) + Math.max(0, session.duration * 60 - (Number(session.positionSeconds) || 0)) * 1000;
    const endedAt = new Date(completed && Number.isFinite(dueAt) ? Math.min(Date.now(), dueAt) : Date.now()).toISOString();
    let result = { ...session, tracks: nightPlaylist.sessionTracks(session), positionSeconds: seconds, status: "ended", endedAt, stopReason: completed ? "completed" : "stopped", review: { ...DEFAULT_NIGHT_REVIEW, factors: [], observationCount: 0 } };
    result.detail = `${session.skipped ? "播放进度到" : "听了"} ${Math.floor(seconds / 60)} 分 ${seconds % 60} 秒 · ${experienceTime(endedAt)} 结束`;
    result.taskVerification = !session.skipped && session.hardwareEligibleAtStart && session.personalized && completed ? "eligible-prototype" : "ineligible";
    const existing = state.nightHistory.find(item => item.id === result.id), alreadySaved = Boolean(existing);
    const identity = memberTaskIdentity();
    delete result.memberTaskEvidence;
    if (!alreadySaved && result.taskVerification === "eligible-prototype" && identity && session.ownerAccount === identity.accountRef && session.memberRegistrationId === identity.registrationId && (!identity.registrationId || Date.parse(identity.registrationId) <= Date.parse(session.startedAt))) result.memberTaskEvidence = { taskId: "night-repair", ...identity, occurredAt: endedAt, verified: true, hardwareActive: true };
    if (existing) result = existing;
    const historyRecords = alreadySaved ? state.nightHistory : [result, ...state.nightHistory];
    const changes = { nightSession: result, nightHistory: historyRecords, playing: false };
    if (navigate) Object.assign(changes, { selectedNightSessionId: result.id, nightReview: result.review });
    if (!writeNotificationProgress(changes)) {
      if (!navigate) finishNightSession.failedKey = nightCompletionKey();
      if (navigate) showInfoModal("收听记录暂时没能保存", "本次组合和进度还在，请重试后再离开。", "重试保存", "night-end");
      return false;
    }
    finishNightSession.failedKey = "";
    if (!alreadySaved && result.memberTaskEvidence) {
      const evidence = result.memberTaskEvidence, newMember = Boolean(state.newMember);
      Promise.resolve().then(() => window.HALO_COMMERCIAL_EXTENSION?.completeTask?.({ ...evidence, memberCreatedAt: evidence.registrationId, newMember })).catch(() => false).then(posted => {
        if (posted !== true && state.signedIn && (state.authPhone || state.authForm?.phone || "") === evidence.accountRef && state.memberCreatedAt === evidence.registrationId) flash("记录已保存，奖励待同步，可在会员任务重试");
      });
    }
    if (!alreadySaved) trackPrototypeEvent("night_content_completed", { content_id: result.contentId, content_ids: result.tracks.map(item => item.id), session_id: result.id, stop_reason: result.stopReason });
    if (navigate) { closeModal(); go("NIG-10"); }
    return true;
  }
  function hasBodyContext() { return window.HaloPersonalScope.bodyOwner(state) === state.authPhone && isHardwareActive() && state.dataLifecycle === "interpretable" && state.toggles.haloBody; }

  const nav = document.getElementById("page-nav");
  const groupNav = document.getElementById("group-nav");
  const screen = document.getElementById("screen");
  const tabbar = document.getElementById("tabbar");
  const search = document.getElementById("search");
  // TOD-08 commits only after this app snapshot is durably written. Other pages keep their existing persistence behavior.
  const nightReview = window.createHaloNightReview({ state, pages, go, render, track: trackPrototypeEvent, esc, screen,
    write: () => {
      try {
        const snapshot = Object.fromEntries(persistedAppKeys.map(key => [key, state[key]]));
        writeAppSnapshot({ ...snapshot, toggles: state.toggles });
        return true;
      } catch { return false; }
    }
  });
  const healthReports = window.createHaloHealthReports({ state, pages, go, render, persist: persistAppProgress, track: trackPrototypeEvent, esc, screen, symbol: HALO_SYMBOL, active: isHardwareActive, today: beijingDateKey,
    write: changes => {
      const snapshot = { ...Object.fromEntries(persistedAppKeys.map(key => [key, state[key]])), ...changes, toggles: state.toggles };
      try { const saved = writeAppSnapshot(snapshot); for (const key of Object.keys(changes)) changes[key] = saved[key]; } catch { return false; }
      Object.assign(state, changes); return true;
    }
  });
  const toast = document.getElementById("toast");
  const modalRoot = document.getElementById("modal-root");
  const stateShare = window.createHaloStateShare({ state, go, render, screen, esc, write: writeCorrectionState, track: trackPrototypeEvent,
    source: () => {
      const data = bodyWeatherPageState();
      if (!data.ready) return null;
      const weather = currentBodyWeather(), correction = activeWeatherCorrection();
      return { key: [data.date, state.bodyWeather, correction?.id || "original"].join("|"), date: data.date, title: correction ? "听听自己的感受" : weather.label, description: correction ? "身体记录是一份参考，今天也听听自己的感受。" : weather.shareLine };
    }
  });
  const dataQuality = window.createHaloDataQuality({ state, go, render, screen, esc, write: writeCorrectionState, active: isHardwareActive, today: beijingDateKey, validDate: validHealthDate, dateLabel: healthDateLabel,
    readings: date => HEALTH_OVERVIEW_ITEMS.filter(item => item.key !== "energy").map(item => healthOverviewReading(item, date)),
    icon: domainIcon,
    openMetric: (item, date) => {
      state.healthDetailContext = { route: item.route, metric: item.key, date };
      if (item.route === "HLT-02") state.respirationWindowEnd = date;
      if (item.route === "HLT-05") state.oxygenWindowEnd = date;
      delete state.pageViews[item.route]; go(item.route);
    }
  });
  const rhythmRecordStore = window.createHaloRhythmRecordStore({ state, write: writePrivacyProgress, validDate: validHealthDate, today: beijingDateKey });
  let rhythmCycleStore;
  const rhythmSettingsStore = window.createHaloRhythmSettingsStore({ state, write: writePrivacyProgress, validDate: validHealthDate, today: beijingDateKey, hasPeriodRecords: () => rhythmCycleStore?.hasEvents() || false });
  rhythmCycleStore = window.createHaloRhythmCycleStore({ state, write: writePrivacyProgress, validDate: validHealthDate, today: beijingDateKey, hasCycle: rhythmHasConfirmedCycle, settingsChanges: rhythmSettingsStore.recordChanges });
  const rhythmCyclePage = window.createHaloRhythmCyclePage({ state, screen, modalRoot, store: rhythmCycleStore, esc, go, render, closeModal });
  const rhythmSettingsPage = window.createHaloRhythmSettingsPage({ state, screen, esc, today: beijingDateKey, hasPeriodRecords: () => rhythmCycleStore.hasEvents() });
  let rhythmSettingsFeedback = "";
  let rhythmSettingsWriteFailed = false;
  const rhythmSetupPage = window.createHaloRhythmSetupPage({ state, store: rhythmSettingsStore, screen, modalRoot, esc, today: beijingDateKey, hasPeriodRecords: () => rhythmCycleStore.hasEvents(), go, render, flash, showModal, closeModal, track: trackPrototypeEvent });
  const bodyWeatherRoute = window.createHaloBodyWeatherRouteCompat({ state, screen, validDate: validHealthDate, today: beijingDateKey, model: bodyWeatherTrendModel, render, go, persist: persistAppProgress, pages });
  function openRhythmSettings() {
    const result = rhythmSettingsStore.open();
    const view = rhythmSettingsStore.inspect();
    rhythmSettingsWriteFailed = result.code === "storage" || !!result.error && !view.conflict && view.canEdit;
    rhythmSettingsFeedback = result.error || (view.dirty ? "已恢复未保存的修改" : "");
    if (state.current === "RHY-00") rhythmSetupPage.opened(result, view);
  }
  function handleRhythmSettings(action) {
    if (!action?.startsWith("rh-settings:")) return false;
    if (state.current !== "RHY-04") return true;
    const view = rhythmSettingsStore.inspect();
    if (action === "rh-settings:manage") { go("RHY-05"); return true; }
    if (action === "rh-settings:permissions") { go("PERM-01"); return true; }
    if (action === "rh-settings:periods") { go("RHY-01"); return true; }
    if (!view.canEdit) { render(); return true; }
    if (action === "rh-settings:discard") {
      if (view.dirty || view.conflict) showModal("放弃这次修改？", "只放弃尚未保存的设置，已保存的日期、感受记录和提醒偏好都不会删除。", "放弃修改", "rh-settings:discard-confirm");
      return true;
    }
    let result;
    if (action === "rh-settings:discard-confirm") {
      if (!modalRoot.querySelector('[data-action="rh-settings:discard-confirm"]')) return true;
      result = rhythmSettingsStore.discard(); closeModal();
    } else if (action === "rh-settings:resume") {
      if (view.dirty || view.conflict) { rhythmSettingsFeedback = "请先保存或放弃修改，再恢复周期展示。"; rhythmSettingsPage.update(view, rhythmSettingsFeedback); return true; }
      showModal("恢复周期展示？", "将重新展示你已保存的周期日期，感受记录保持不变。", "恢复展示", "rh-settings:resume-confirm"); return true;
    } else if (action === "rh-settings:resume-confirm") {
      if (!modalRoot.querySelector('[data-action="rh-settings:resume-confirm"]')) return true;
      result = rhythmSettingsStore.resume(); closeModal();
    } else if (action === "rh-settings:save") result = rhythmSettingsStore.save();
    else if (action === "rh-settings:notice") result = rhythmSettingsStore.change("notice", !view.values.notice);
    else if (action === "rh-settings:prediction") result = rhythmSettingsStore.change("prediction", !view.values.prediction);
    else if (action === "rh-settings:period-notice") result = rhythmSettingsStore.change("periodNotice", !view.values.periodNotice);
    else if (action.startsWith("rh-settings:mode:")) result = rhythmSettingsStore.change("mode", action.slice("rh-settings:mode:".length));
    if (!result) return true;
    rhythmSettingsWriteFailed = result.code === "storage";
    rhythmSettingsFeedback = !result.ok ? result.error : action === "rh-settings:save" ? result.unchanged ? "没有需要保存的修改" : "设置已保存" : action === "rh-settings:discard-confirm" ? "已回到保存的设置" : action === "rh-settings:resume-confirm" ? "已恢复周期展示" : "修改已保留，保存后生效";
    if (result.ok && !result.unchanged && action === "rh-settings:save") trackPrototypeEvent("rhythm_settings_saved", { mode: rhythmSettingsStore.inspect().currentMode });
    render(); return true;
  }
  let rhythmEditorProblem = "";
  const rhythmManagementStore = window.createHaloRhythmManagementStore({ state, write: writePrivacyProgress, settingsStore: rhythmSettingsStore, validDate: validHealthDate, today: beijingDateKey, cycleStore: rhythmCycleStore });
  const rhythmManagementPage = window.createHaloRhythmManagementPage({ esc });
  let rhythmManagementFeedback = "";
  const rhythmHandoff = window.createHaloRhythmHandoff({ state, createSource: snapshot => createHaloSource("rhythm", snapshot), write: writePrivacyProgress });
  const rhythmHaloPage = window.createHaloRhythmHaloPage({ esc });
  let rhythmHandoffFeedback = "";
  function handleRhythmManagement(action) {
    if (!action?.startsWith("rh-manage:")) return false;
    if (state.current !== "RHY-05") return true;
    if (action === "rh-manage:cancel") { rhythmManagementStore.cancelDelete(); closeModal(); return true; }
    const view = rhythmManagementStore.inspect();
    if (!view.canManage) { rhythmManagementStore.cancelDelete(); closeModal(); render(); return true; }
    if (action === "rh-manage:calendar") { go("RHY-01"); return true; }
    if (action === "rh-manage:settings") { go("RHY-04"); return true; }
    if (action === "rh-manage:delete") {
      const result = rhythmManagementStore.prepareDelete();
      if (!result.ok) { rhythmManagementFeedback = result.error; render(); return true; }
      modalRoot.innerHTML = rhythmManagementPage.confirmation(result.token, result.summary);
      return true;
    }
    if (action === "rh-manage:delete-confirm") {
      const dialog = modalRoot.querySelector(".rh-manage-confirm");
      if (!dialog) return true;
      const result = rhythmManagementStore.removeAll(dialog.dataset.token);
      if (!result.ok) {
        dialog.querySelector(".rh-manage-modal-error").textContent = result.error;
        if (result.code !== "storage") dialog.querySelector('[data-action="rh-manage:delete-confirm"]').disabled = true;
        return true;
      }
      closeModal(); rhythmManagementFeedback = "已清空节律数据，并关闭记录提醒。"; render(); return true;
    }
    if (["rh-manage:pause", "rh-manage:resume"].includes(action)) {
      const result = action.endsWith(":pause") ? rhythmManagementStore.pause() : rhythmManagementStore.resume();
      rhythmManagementFeedback = result.ok ? action.endsWith(":pause") ? "已暂停周期展示，感受记录仍然保留。" : "已恢复周期展示。" : result.error;
      render(); return true;
    }
    return true;
  }
  let rhythmEditorDraftStatus = "";
  const rhythmEditor = window.createHaloRhythmEditor({ screen, esc, today: beijingDateKey });
  const rhythmHome = window.createHaloRhythmHome({ state, go, render, screen, esc, write: writePrivacyProgress, today: beijingDateKey, validDate: validHealthDate, hasCycle: rhythmHasConfirmedCycle, cycleStore: rhythmCycleStore, cyclePage: rhythmCyclePage,
    openRecord: date => {
      const result = rhythmRecordStore.open(date);
      if (result.ok) { rhythmEditorProblem = ""; go("RHY-03"); }
      else if (result.error.includes("记录已更新")) showModal("这一天的记录已更新", "未保存的草稿仍然保留。你可以取消，或放弃这份草稿后查看最新记录；已保存的记录不会删除。", "放弃草稿并查看最新", `rhythm-draft-latest:${date}`);
      return result;
    },
    reload: () => {
      try {
        const saved = JSON.parse(localStorage.getItem(APP_PROGRESS_KEY) || "{}");
        const currentOwner = String(state.authPhone || state.authForm?.phone || "legacy-session");
        const savedOwner = String(saved.authPhone || saved.authForm?.phone || "legacy-session");
        if (savedOwner !== currentOwner || !saved.rhythmRecords || typeof saved.rhythmRecords !== "object" || Array.isArray(saved.rhythmRecords)) throw new Error("invalid-records");
        if (!writePrivacyProgress({ rhythmRecords: saved.rhythmRecords, rhythmStatus: rhythmHasConfirmedCycle() ? "ready" : "empty" })) throw new Error("storage");
        return { ok: true };
      } catch { return { ok: false, error: "暂时无法读取，现有记录仍保留。请稍后再试。" }; }
    }
  });
  function captureRhythmDraft() {
    if (state.current !== "RHY-03") return true;
    const saved = rhythmRecordStore.capture();
    const view = rhythmRecordStore.inspect();
    rhythmEditorProblem = saved ? "" : rhythmRecordStore.lastIssue()?.error || "草稿暂未保存到本机。内容还在，请先不要关闭页面。";
    rhythmEditorDraftStatus = saved && view.dirty ? "草稿已保留" : "";
    rhythmEditor.update(view, rhythmEditorProblem, rhythmEditorDraftStatus);
    return saved;
  }
  function writeBasicProfile(changes) {
    if (!state.signedIn || !state.authVerified || state.accountDeletionStatus === "submitted") return false;
    const snapshot = Object.fromEntries(persistedAppKeys.map(key => [key, state[key]]));
    Object.assign(snapshot, changes); snapshot.toggles = state.toggles;
    try { const saved = writeAppSnapshot(snapshot); for (const key of Object.keys(changes)) changes[key] = saved[key]; } catch { return false; }
    Object.assign(state, changes); return true;
  }
  const basicProfileEditor = window.createHaloBasicProfile({ state, pages, go, write: writeBasicProfile, track: trackPrototypeEvent, esc, today: beijingDateKey, screen, modalRoot, closeModal, flash, activeHardware: isHardwareActive });
  const deviceScan = window.createHaloDeviceScan({ state, go, render, persist: persistAppProgress, track: trackPrototypeEvent, blocker: deviceGuideBlocker, modalRoot, closeModal, showPermissionHelp: () => showConnectionPermission(true) });
  const deviceBinding = window.createHaloDeviceBinding({ state, scan: deviceScan, go, render, persist: persistAppProgress, track: trackPrototypeEvent, esc, blocker: () => deviceGuideBlocker(true), modalRoot, closeModal });
  const deviceWear = window.createHaloDeviceWear({ state, pages, go, persist: persistAppProgress, track: trackPrototypeEvent, modalRoot, closeModal });
  if (window.createHaloDeviceHome) deviceHome = window.createHaloDeviceHome({ state, go, render, persist: persistAppProgress, track: trackPrototypeEvent, esc, symbol: HALO_SYMBOL, modalRoot, closeModal, showInfoModal, binding: deviceBinding, initialSync: () => initialSync, maintenance: () => deviceMaintenance, operationBlocker: deviceOperationUnavailable, showPermissionHelp: () => showInfoModal("开启蓝牙后再连接", "请开启手机蓝牙，并允许 Halo 使用蓝牙或访问附近设备。", "查看权限设置", "go:PERM-01") });
  initialSync = window.createHaloInitialSync({ state, pages, go, render, persist: persistAppProgress, track: trackPrototypeEvent, esc, symbol: HALO_SYMBOL, binding: deviceBinding, home: () => deviceHome, firmware: () => deviceInfo, maintenance: () => deviceMaintenance, modalRoot, closeModal,
    saveSync: (receipt, at) => deviceHome?.recordInitialSync(at, receipt) === true,
    activate: (receipt, at) => {
      if (!deviceHome?.recordActivation(at, receipt)) return false;
      // Activation is not a connection, consent change or a new health result.
      state.membershipHardwareState = "active";
      localStorage.setItem(MEMBERSHIP_STATE_KEY, "active");
      state.hardwareActivatedAt ||= at;
      state.connectionIntro.completed = true;
      persistAppProgress(); return true;
    },
    finish: receipt => {
      // Channel applications no longer depend on hardware; ignore legacy channel destinations.
      if (/^CHN-/.test(receipt.destination || "")) receipt.destination = "";
      if (receipt.destination === "ONB-04" && ["completed", "skipped"].includes(state.basicProfile.status)) receipt.destination = "DEV-10";
      if (!receipt.destination) {
        if (!["completed", "skipped"].includes(state.basicProfile.status)) {
          basicProfileDraft(); state.basicProfile.status = "pending"; receipt.destination = "ONB-04";
        } else receipt.destination = /^CHN-/.test(receipt.returnRoute || "") ? "DEV-10" : receipt.returnRoute || "DEV-10";
      }
      persistAppProgress(); go(receipt.destination, false);
    }
  });
  if (window.createHaloDeviceInfo) deviceInfo = window.createHaloDeviceInfo({ state, go, render, persist: persistAppProgress, track: trackPrototypeEvent, esc, symbol: HALO_SYMBOL, showInfoModal, closeModal, binding: deviceBinding, initialSync: () => initialSync, maintenance: () => deviceMaintenance });
  deviceMaintenance = window.createHaloDeviceMaintenance({ state, go, render, persist: persistAppProgress, track: trackPrototypeEvent, esc, symbol: HALO_SYMBOL, modalRoot, closeModal, showInfoModal, binding: deviceBinding, home: () => deviceHome, firmware: () => deviceInfo, initialSync: () => initialSync });
  dataPrivacy = window.createHaloDataPrivacy({ state, go, render, write: writePrivacyProgress, persist: persistAppProgress, track: trackPrototypeEvent, esc, modalRoot, closeModal, exportPayload: accountExportPayload, download: downloadBlob, flash, measurementRecords: allMeasurementRecords, measurementDeletionChanges: () => oxygenMeasurement?.deletionChanges() || {}, accessError: () => personalScope?.accessError() || todayRhythmStorage?.accessError() || "" });
  notificationSettings = window.createHaloNotificationSettings({ state, go, render, write: writeNotificationProgress, persist: persistAppProgress, track: trackPrototypeEvent, esc, modalRoot, closeModal, flash, legacyGoalSaved: localStorage.getItem(SLEEP_GOAL_KEY) !== null || Object.prototype.hasOwnProperty.call(storedAppProgress || {}, "sleepGoal") });
  haloProactive = window.createHaloProactive({state,screen,modalRoot,esc,go,write:writeNotificationProgress,closeModal,track:trackPrototypeEvent,
    checkSaved: () => {
      let saved; try { saved=JSON.parse(localStorage.getItem(APP_PROGRESS_KEY)); } catch { return "暂时无法读取本机设置，请重试。"; }
      if (!saved || typeof saved!=="object" || Array.isArray(saved)) return "暂时无法读取本机设置，请重试。";
      if (!saved.signedIn || !saved.authVerified || !state.signedIn || !state.authVerified || saved.authPhone!==state.authPhone) return "登录状态已变化，请刷新后重新登录。原设置没有改变。";
      const transient=new Set(["lastVisitedRoute","navigationHistory","pageViews","tabStacks","activeTab"]);
      return [...new Set([...persistedAppKeys,"toggles",...Object.keys(saved)])].some(key=>!transient.has(key)&&JSON.stringify(saved[key])!==JSON.stringify(state[key])) ? "设置已在其他页面更新。请刷新后继续，最新内容会保留。" : "";
    }});
  haloFeelingEditor = window.createHaloFeeling({state,screen,modalRoot,esc,go,write:writeNotificationProgress,closeModal,track:trackPrototypeEvent,
    checkSaved: () => {
      let saved; try { saved=JSON.parse(localStorage.getItem(APP_PROGRESS_KEY)); } catch { return "暂时无法读取本机设置，请重试。"; }
      if (!saved || typeof saved!=="object" || Array.isArray(saved)) return "暂时无法读取本机设置，请重试。";
      if (!saved.signedIn || !saved.authVerified || !state.signedIn || !state.authVerified || saved.authPhone!==state.authPhone) return "登录状态已变化，请刷新后重新登录。原设置没有改变。";
      const transient=new Set(["lastVisitedRoute","navigationHistory","pageViews","tabStacks","activeTab"]);
      return [...new Set([...persistedAppKeys,"toggles",...Object.keys(saved)])].some(key=>!transient.has(key)&&JSON.stringify(saved[key])!==JSON.stringify(state[key])) ? "设置已在其他页面更新。请刷新后继续，最新内容会保留。" : "";
    }});
  haloJourney = window.createHaloJourney({state,screen,modalRoot,esc,go,write:writeNotificationProgress,closeModal,track:trackPrototypeEvent,themes:JOURNEY_THEMES,day:experienceDay,
    checkSaved: () => {
      let saved; try { saved=JSON.parse(localStorage.getItem(APP_PROGRESS_KEY)); } catch { return "暂时无法读取本机计划记录，请重试。"; }
      if (!saved || typeof saved!=="object" || Array.isArray(saved)) return "暂时无法读取本机计划记录，请重试。";
      if (!saved.signedIn || !saved.authVerified || !state.signedIn || !state.authVerified || saved.authPhone!==state.authPhone) return "登录状态已变化，请刷新后重新登录。原计划记录没有改变。";
      const transient=new Set(["lastVisitedRoute","navigationHistory","pageViews","tabStacks","activeTab"]);
      return [...new Set([...persistedAppKeys,"toggles",...Object.keys(saved)])].some(key=>!transient.has(key)&&JSON.stringify(saved[key])!==JSON.stringify(state[key])) ? "计划记录已在其他页面更新。请刷新后继续，最新内容会保留。" : "";
    }});
  haloPrivacyControls = window.createHaloPrivacyPage({state,screen,modalRoot,esc,go,write:writeNotificationProgress,closeModal,track:trackPrototypeEvent,source:currentHaloSource,newBody:()=>createHaloSource("body"),available:()=>window.HaloPersonalScope.bodyOwner(state)===state.authPhone&&isHardwareActive()&&state.dataLifecycle==="interpretable",
    checkSaved: () => {
      let saved; try { saved=JSON.parse(localStorage.getItem(APP_PROGRESS_KEY)); } catch { return "暂时无法读取本机设置与记录，请重试。"; }
      if (!saved || typeof saved!=="object" || Array.isArray(saved)) return "暂时无法读取本机设置与记录，请重试。";
      if (!saved.signedIn || !saved.authVerified || !state.signedIn || !state.authVerified || saved.authPhone!==state.authPhone) return "登录状态已变化，请刷新后重新登录。原设置与记录没有改变。";
      const transient=new Set(["lastVisitedRoute","navigationHistory","pageViews","tabStacks","activeTab"]);
      return [...new Set([...persistedAppKeys,"toggles",...Object.keys(saved)])].some(key=>!transient.has(key)&&JSON.stringify(saved[key])!==JSON.stringify(state[key])) ? "设置与记录已在其他页面更新。请刷新后继续，最新内容会保留。" : "";
    }});
  haloSettingsHub = window.createHaloSettingsPage({state,screen,modalRoot,esc,go,write:writeNotificationProgress,closeModal,track:trackPrototypeEvent,summary:generalPreferenceSummary,example:generalPreferenceExample,showInfoModal,showSafety:()=>handleAction("halo-safety-help"),
    checkSaved: () => {
      let saved; try { saved=JSON.parse(localStorage.getItem(APP_PROGRESS_KEY)); } catch { return "暂时无法读取本机设置与记录，请重试。"; }
      if (!saved || typeof saved!=="object" || Array.isArray(saved)) return "暂时无法读取本机设置与记录，请重试。";
      if (!saved.signedIn || !saved.authVerified || !state.signedIn || !state.authVerified || saved.authPhone!==state.authPhone) return "登录状态已变化，请刷新后重新登录。原设置与记录没有改变。";
      const transient=new Set(["lastVisitedRoute","navigationHistory","pageViews","tabStacks","activeTab"]);
      return [...new Set([...persistedAppKeys,"toggles",...Object.keys(saved)])].some(key=>!transient.has(key)&&JSON.stringify(saved[key])!==JSON.stringify(state[key])) ? "设置与记录已在其他页面更新。请刷新后继续，最新内容会保留。" : "";
    }});
  systemHealth = window.createHaloSystemHealth({ state, write: writeNotificationProgress, render, esc, modalRoot, closeModal, screen });
  helpCenter = window.createHaloHelpCenter({ state, go, persist: persistAppProgress, esc, screen, showInfoModal });
  feedbackEditor = window.createHaloFeedback({ state, write: writeNotificationProgress, go, render, esc, screen, leave: () => supportContact?.backFromFeedback() || helpCenter.back(), commerceContext: () => supportContact?.commerceContext() });
  supportContact = window.createHaloSupportContact({ state, pages, go, persist: persistAppProgress, esc, closeModal, commercial: () => window.HALO_COMMERCIAL_EXTENSION, openFeedback: commerce => { go("HELP-02"); if (commerce) feedbackEditor.prepareCommerce(); else feedbackEditor.handle("feedback:new"); } });
  aboutLegal = window.createHaloAboutLegal({ state, go, esc, symbol: HALO_SYMBOL });
  accountSecurity = window.createHaloAccountSecurity({ state, go, write: writeNotificationProgress, readSession: () => { try { const value = JSON.parse(localStorage.getItem(APP_PROGRESS_KEY)); return { ok: Boolean(value && typeof value === "object"), value }; } catch { return { ok: false }; } },
    hasUnmergedChanges: saved => { const transient = new Set(["signedIn", "authVerified", "authCodeRequested", "authReturnRoute", "authForm", "welcomeShopping", "lastVisitedRoute", "navigationHistory", "pageViews", "tabStacks", "activeTab", "dataQualityView"]); return [...new Set([...persistedAppKeys, "toggles", ...Object.keys(saved)])].some(key => !transient.has(key) && JSON.stringify(saved[key]) !== JSON.stringify(state[key])); },
    invalidateAuth: invalidateAuthRequest, track: trackPrototypeEvent, esc, modalRoot, closeModal });
  accountDeletion = window.createHaloAccountDeletion({ state, go, render, write: writeNotificationProgress, readSession: () => { try { const value = JSON.parse(localStorage.getItem(APP_PROGRESS_KEY)); return { ok: Boolean(value && typeof value === "object"), value }; } catch { return { ok: false }; } },
    hasUnmergedChanges: saved => { const transient = new Set(["lastVisitedRoute", "navigationHistory", "pageViews", "tabStacks", "activeTab"]); return [...new Set([...persistedAppKeys, "toggles", ...Object.keys(saved)])].some(key => !transient.has(key) && JSON.stringify(saved[key]) !== JSON.stringify(state[key])); },
    getAssets: () => window.HALO_COMMERCIAL_EXTENSION?.getDeletionSnapshot({ membershipState: state.membershipHardwareState }), track: trackPrototypeEvent, esc, screen, modalRoot, closeModal });
  haloHistory = window.createHaloHistory({ state, screen, modalRoot, esc, go, write: writeNotificationProgress, newSource: () => createHaloSource("body"), closeModal, track: trackPrototypeEvent,
    checkSaved: () => {
      let saved; try { saved = JSON.parse(localStorage.getItem(APP_PROGRESS_KEY)); } catch { return "暂时无法读取本机记录，请重试。原对话没有改变。"; }
      if (!saved || typeof saved !== "object" || Array.isArray(saved)) return "暂时无法读取本机记录，请重试。原对话没有改变。";
      if (!saved.signedIn || !saved.authVerified || !state.signedIn || !state.authVerified || saved.authPhone !== state.authPhone) return "登录状态已变化，请刷新后重新登录。原对话没有改变。";
      const transient = new Set(["lastVisitedRoute", "navigationHistory", "pageViews", "tabStacks", "activeTab"]);
      return [...new Set([...persistedAppKeys, "toggles", ...Object.keys(saved)])].some(key => !transient.has(key) && JSON.stringify(saved[key]) !== JSON.stringify(state[key])) ? "记录已在其他页面更新。请刷新后再操作，最新内容会保留。" : "";
    } });
  haloMemory = window.createHaloMemory({state,screen,modalRoot,esc,go,write:writeNotificationProgress,closeModal,track:trackPrototypeEvent,
    checkSaved: () => {
      let saved; try { saved=JSON.parse(localStorage.getItem(APP_PROGRESS_KEY)); } catch { return "暂时无法读取本机记录，请重试。原记忆没有改变。"; }
      if (!saved || typeof saved!=="object" || Array.isArray(saved)) return "暂时无法读取本机记录，请重试。原记忆没有改变。";
      if (!saved.signedIn || !saved.authVerified || !state.signedIn || !state.authVerified || saved.authPhone!==state.authPhone) return "登录状态已变化，请刷新后重新登录。原记忆没有改变。";
      const transient=new Set(["lastVisitedRoute","navigationHistory","pageViews","tabStacks","activeTab"]);
      return [...new Set([...persistedAppKeys,"toggles",...Object.keys(saved)])].some(key=>!transient.has(key)&&JSON.stringify(saved[key])!==JSON.stringify(state[key])) ? "记录已在其他页面更新。请刷新后再操作，最新内容会保留。" : "";
    }});
  oxygenMeasurement = window.createHaloOxygenMeasurement({ state, write: writeBasicProfile, render, go, esc, unavailable: oxygenMeasurementUnavailable, saveUnavailable: oxygenSaveUnavailable,
    symbol: HALO_SYMBOL,
    recovery: () => measurementPrivacyBlocked() ? { label: "查看数据与隐私", action: "go:SET-01" } : !isHardwareActive() ? { label: "连接 Halo Ring", action: "go:DEV-01" } : !["supported", "off", "quality"].includes(state.oxygenReviewScenario) ? { label: "查看设备信息", action: "go:DEV-11" } : !state.toggles.bluetooth ? { label: "开启蓝牙权限", action: "go:PERM-01" } : { label: "查看连接与同步", action: "go:DEV-10" },
    requestDiscard: q => {
      modalReturnFocus = document.activeElement;
      showModal("放弃这次未保存的结果？", "放弃后，这次结果不会加入记录，也无法找回。此前已保存的记录不受影响。", "放弃结果", `oxygen-measure:discard-confirm:${q.id}`);
      const dialog = modalRoot.querySelector(".modal"), title = dialog.querySelector("h2");
      title.id = "oxygen-discard-title"; dialog.setAttribute("role", "alertdialog"); dialog.setAttribute("aria-modal", "true"); dialog.setAttribute("aria-labelledby", title.id);
      const keep = dialog.querySelector('[data-action="close-modal"]'); keep.textContent = "继续保留";
      screen.inert = true; tabbar.inert = true; keep.focus();
    },
    discardIsOpen: id => Array.from(modalRoot.querySelectorAll("button[data-action]")).some(button => button.dataset.action === `oxygen-measure:discard-confirm:${id}`), closeDiscard: closeModal,
    returnContext: () => { capturePageView(); return state.current === "HLT-05" ? oxygenReturnContext() : { route: "HLT-03" }; }, onReturn: returnFromOxygenMeasurement });
  const measurementCenter = window.createHaloMeasurementCenter({ state, esc, icon: domainIcon, chevron: healthChevron, oxygen: () => oxygenMeasurement, active: isHardwareActive,
    blocked: type => type === "oxygen" ? oxygenMeasurementUnavailable() : deviceOperationUnavailable("measurement"), privacyBlocked: measurementPrivacyBlocked,
    render, go, persist: persistAppProgress, capture: capturePageView, screen, showInfo: showInfoModal, closeModal, getRecords: allMeasurementRecords, openOxygen: record => returnFromOxygenMeasurement({ route: "HLT-03" }, record, true) });
  studioTransactions = window.createHaloStudioTransactions(state, APP_PROGRESS_KEY);
  const studioPayment = window.createHaloStudioPayment({ state, events: STUDIO_EVENTS, event: selectedStudioEvent, media: id => STUDIO_HOME_MEDIA[id], go, render, transactions: studioTransactions, track: trackPrototypeEvent, esc, icon: studioHomeIcon, screen });
  const studioReservation = window.createHaloStudioReservation({ state, events: STUDIO_EVENTS, event: selectedStudioEvent, media: id => STUDIO_HOME_MEDIA[id], payment: studioPayment, go, render, transactions: studioTransactions, track: trackPrototypeEvent, esc, icon: studioHomeIcon, screen, modalRoot, closeModal });
  function writeStudioPreparation(id, changes) {
    if (!studioIdentityValid(id)) return false;
    const next = { ...state.studioRecords[id], ...changes };
    const snapshot = Object.fromEntries(persistedAppKeys.map(key => [key, state[key]]));
    snapshot.studioRecords = { ...state.studioRecords, [id]: next }; snapshot.toggles = state.toggles;
    try { writeAppSnapshot(snapshot); } catch { return false; }
    Object.assign(state.studioRecords[id], changes); return true;
  }
  const studioPreparation = window.createHaloStudioPreparation({ state, events: STUDIO_EVENTS, event: selectedStudioEvent, media: id => STUDIO_HOME_MEDIA[id], payment: studioPayment, reservation: studioReservation, go, render, persist: persistAppProgress, write: writeStudioPreparation, track: trackPrototypeEvent, esc, icon: studioHomeIcon, screen, modalRoot, closeModal, flash });
  const studioFeeling = window.createHaloStudioFeeling({ state, event: selectedStudioEvent, media: id => STUDIO_HOME_MEDIA[id], preparation: studioPreparation, go, render, write: writeStudioPreparation, readStored: () => { try { return { ok: true, records: JSON.parse(localStorage.getItem(APP_PROGRESS_KEY))?.studioRecords || {} }; } catch { return { ok: false }; } }, track: trackPrototypeEvent, esc, icon: studioHomeIcon, screen, modalRoot, closeModal, flash });
  const studioPreflight = window.createHaloStudioPreflight({ state, event: selectedStudioEvent, media: id => STUDIO_HOME_MEDIA[id], preparation: studioPreparation, feeling: studioFeeling, deviceBlock: () => deviceOperationUnavailable("studio"), go, render, write: writeStudioPreparation, readStored: () => { try { const progress = JSON.parse(localStorage.getItem(APP_PROGRESS_KEY)); return { ok: Boolean(progress && progress.studioRecords && typeof progress.studioRecords === "object"), progress, hardware: localStorage.getItem("membershipHardwareState") }; } catch { return { ok: false }; } }, track: trackPrototypeEvent, esc, icon: studioHomeIcon, screen, modalRoot, closeModal });
  const studioSession = window.createHaloStudioSession({ state, event: selectedStudioEvent, media: id => STUDIO_HOME_MEDIA[id], preparation: studioPreparation, sessionValid: studioSessionIdentityValid, deviceBlock: () => deviceOperationUnavailable("studio"), readStored: () => { try { const progress = JSON.parse(localStorage.getItem(APP_PROGRESS_KEY)); return { ok: Boolean(progress && progress.studioRecords && typeof progress.studioRecords === "object"), progress, hardware: localStorage.getItem("membershipHardwareState") }; } catch { return { ok: false }; } }, write: writeStudioPreparation, go, render, track: trackPrototypeEvent, esc, icon: studioHomeIcon, screen, modalRoot, closeModal, flash });
  const studioReport = window.createHaloStudioReport({ state, event: selectedStudioEvent, media: id => STUDIO_HOME_MEDIA[id], eligible: studioSession.reportEligible, readStored: () => { try { const progress = JSON.parse(localStorage.getItem(APP_PROGRESS_KEY)); return { ok: Boolean(progress && progress.studioRecords && typeof progress.studioRecords === "object"), progress }; } catch { return { ok: false }; } }, write: writeStudioPreparation, go, render, track: trackPrototypeEvent, esc, icon: studioHomeIcon, screen, flash });
  const studioPostReport = window.createHaloStudioPostReport({ state, report: studioReport, event: selectedStudioEvent, media: id => STUDIO_HOME_MEDIA[id], feeling: studioFeeling, go, render, esc, icon: studioHomeIcon, screen, modalRoot, closeModal, flash });
  const studioNextDay = window.createHaloStudioNextDay({ state, report: studioReport, event: selectedStudioEvent, media: id => STUDIO_HOME_MEDIA[id], go, render, esc, icon: studioHomeIcon, screen, flash });
  studioCodeLookup = window.createHaloStudioCode({ state, events: STUDIO_EVENTS,
    read: () => { try { return { progress: JSON.parse(localStorage.getItem(APP_PROGRESS_KEY)) }; } catch { return {}; } },
    select: id => { state.selectedStudioEventId = id; }, go, render, esc, icon: studioHomeIcon, screen });
  studioInstitution = window.createHaloStudioConfirm({ state, events: STUDIO_EVENTS, lookup: () => studioCodeLookup.receipt(), media: id => STUDIO_HOME_MEDIA[id],
    read: () => { try { const raw = localStorage.getItem(APP_PROGRESS_KEY); return { raw, progress: JSON.parse(raw) }; } catch { return {}; } },
    commit: (raw, updates) => { try { const p = JSON.parse(raw); if (!p || localStorage.getItem(APP_PROGRESS_KEY) !== raw) return false; localStorage.setItem(APP_PROGRESS_KEY, JSON.stringify({ ...p, ...updates })); return true; } catch { return false; } },
    recordStatus: studioHomeRecordState, go, render, esc, icon: studioHomeIcon });
  studioRecordDetail = window.createHaloStudioRecord({ state, events: STUDIO_EVENTS, event: selectedStudioEvent, media: id => STUDIO_HOME_MEDIA[id], report: studioReport, feeling: studioFeeling,
    read: () => { try { return { progress: JSON.parse(localStorage.getItem(APP_PROGRESS_KEY)) }; } catch { return {}; } },
    write: (id, expected, changes) => {
      try {
        const p = JSON.parse(localStorage.getItem(APP_PROGRESS_KEY));
        const account = v => String(v.authPhone || v.authForm?.phone || "local-demo");
        if (!p?.signedIn || !p.authVerified || p.accountDeletionStatus === "submitted" || account(p) !== account(state) || JSON.stringify(p.studioRecords?.[id]) !== expected) return false;
        const next = { ...p.studioRecords[id], ...changes };
        localStorage.setItem(APP_PROGRESS_KEY, JSON.stringify({ ...p, studioRecords: { ...p.studioRecords, [id]: next } }));
        state.studioRecords[id] = next; syncStudioAliases(); return true;
      } catch { return false; }
    }, go, render, esc, icon: studioHomeIcon, screen });
  studioHistory = window.createHaloStudioHistory({ state, events: STUDIO_EVENTS, status: studioHomeRecordState,
    read: () => { try { return { progress: JSON.parse(localStorage.getItem(APP_PROGRESS_KEY)) }; } catch { return {}; } },
    select: id => { state.selectedStudioEventId = id; state.selectedStudioHistoryId = id; syncStudioAliases(); }, go, render, esc, icon: studioHomeIcon });
  studioContact = window.createHaloStudioContact({ state, events: STUDIO_EVENTS, event: selectedStudioEvent, media: id => STUDIO_HOME_MEDIA[id],
    read: () => { try { const progress = JSON.parse(localStorage.getItem(APP_PROGRESS_KEY)); return { ok: Boolean(progress), progress }; } catch { return { ok: false }; } },
    write: (id, changes, before, field) => {
      try {
        const progress = JSON.parse(localStorage.getItem(APP_PROGRESS_KEY)), r = progress?.studioRecords?.[id];
        const account = value => String(value.authPhone || value.authForm?.phone || "local-demo");
        if (!r || !progress.signedIn || !progress.authVerified || progress.accountDeletionStatus === "submitted" || account(progress) !== account(state)
          || JSON.stringify([account(progress), id, r.bookingId]) !== before.scope || (r[field] === true) !== before[field]) return false;
        const next = { ...r, ...changes };
        localStorage.setItem(APP_PROGRESS_KEY, JSON.stringify({ ...progress, studioRecords: { ...progress.studioRecords, [id]: next } }));
        state.studioRecords[id] = next; state.toggles.studioContact = next.contactConsent === true; state.toggles.studioMarketing = next.marketingConsent === true; return true;
      } catch { return false; }
    }, render, go, esc, icon: studioHomeIcon });
  studioBenefit = window.createHaloStudioBenefit({ state, event: selectedStudioEvent, media: id => STUDIO_HOME_MEDIA[id],
    read: () => { try { const progress = JSON.parse(localStorage.getItem(APP_PROGRESS_KEY)); return { ok: Boolean(progress), progress }; } catch { return { ok: false }; } },
    write: (id, changes) => {
      try {
        const progress = JSON.parse(localStorage.getItem(APP_PROGRESS_KEY)), current = progress?.studioRecords?.[id], expected = state.studioRecords?.[id];
        const account = value => String(value.authPhone || value.authForm?.phone || "local-demo");
        if (!current || !expected || account(progress) !== account(state) || !progress.signedIn || !progress.authVerified || progress.accountDeletionStatus === "submitted"
          || current.bookingId !== expected.bookingId || current.sessionId !== expected.sessionId || current.completedAt !== expected.completedAt) return false;
        const next = { ...current, ...changes };
        localStorage.setItem(APP_PROGRESS_KEY, JSON.stringify({ ...progress, studioRecords: { ...progress.studioRecords, [id]: next } }));
        state.studioRecords[id] = next; return true;
      } catch { return false; }
    }, go, render, esc, icon: studioHomeIcon, screen, modalRoot, closeModal, flash, track: trackPrototypeEvent });
  studioTodayReminder = window.createHaloStudioTodayReminder({ state, report: studioReport, nextDay: studioNextDay, read: () => { try { const progress = JSON.parse(localStorage.getItem(APP_PROGRESS_KEY)); return { ok: Boolean(progress), progress }; } catch { return { ok: false }; } }, select: id => { state.selectedStudioEventId = id; state.selectedStudioHistoryId = id; syncStudioAliases(); }, go, render, esc, icon: studioHomeIcon, screen, modalRoot, closeModal, flash });

  function esc(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  }
  function filteredPages() {
    return pages.filter((item) => {
      if (item.id === "TOD-04") return false;
      const groupMatch = state.group === "全部" || item.group === state.group;
      const text = [item.id, item.name, item.function, item.note].join(" ").toLowerCase();
      return groupMatch && (!state.query || text.includes(state.query.toLowerCase()));
    });
  }
  const SIGNED_OUT_ROUTES = new Set(["SYS-01", "ONB-01", "AUTH-01", "AUTH-02", "LEGAL-01", "SEL-03"]);
  const DELETION_STATUS_ROUTES = new Set(["SYS-01", "ACC-02", "ACC-03", "HELP-03", "LEGAL-02"]);
  function guardedRoute(id) {
    accountDeletion?.syncStatus();
    if (id === "SEL-08") id = "SEL-05";
    if (id === "CHN-05") id = window.HALO_COMMERCIAL_EXTENSION?.channelJoinNext?.().route || "CHN-01";
    if (id === "AUTH-02") id = "AUTH-01";
    if (id === "AUTH-01" && state.signedIn && state.authForm.login?.status === "complete") id = state.authForm.login.destination === "SEL-03" ? "SEL-03" : state.connectionIntro.completed ? "TOD-01" : "ONB-03";
    if (!state.signedIn && !SIGNED_OUT_ROUTES.has(id)) return "AUTH-01";
    if (!state.signedIn && id === "LEGAL-01") return "AUTH-01";
    if (state.signedIn && state.accountDeletionStatus === "submitted" && !DELETION_STATUS_ROUTES.has(id)) return "ACC-03";
    if (state.signedIn && id === "TOD-01" && !state.connectionIntro.completed) id = "ONB-03";
    if (typeof accountRouteGuard === "function") id = accountRouteGuard(id);
    if (id === "DEV-03" && !deviceBinding.resumeRoute() && !deviceWear.canReturnToBinding() && (!state.deviceScan.handoff || !deviceScan.selected())) id = "DEV-02";
    if (typeof experienceRouteGuard === "function") id = experienceRouteGuard(id);
    if (id === "TOD-04") id = bodyWeatherRoute.legacy();
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
    bodyWeatherRoute.capture();
    feedbackEditor?.capture();
    helpCenter?.capture();
    rhythmHome.capture();
    captureRhythmDraft();
    dataQuality.capture();
    basicProfileEditor.capture();
    const id = screen.dataset.page;
    if (!id) return;
    state.pageViews[id] = {
      top: (id === "RHY-03" ? screen.querySelector(".rh-editor-scroll") || screen : id === "RHY-00" ? screen.querySelector(".rh-setup-scroll") || screen : id === "RHY-04" ? screen.querySelector(".rh-settings-scroll") || screen : id === "RHY-06" ? screen.querySelector(".rh-halo-scroll") || screen : id === "TOD-02" ? screen.querySelector(".record-page-scroll") || screen : ["STU-01", "STU-02", "STU-09", "STU-16", "STU-17", "STU-18", "STU-10", "STU-11", "STU-03", "STU-04", "STU-12", "STU-05", "STU-06", "STU-07", "STU-13", "STU-14", "STU-15"].includes(id) ? screen.querySelector(".studio-detail-scroll") || screen : screen).scrollTop,
      open: [...screen.querySelectorAll("details")].map((el, index) => el.open ? index : -1).filter(index => index >= 0),
      ...(id === "NIG-10" ? nightHistoryPage.capture() : {}),
      ...(["RHY-02", "RHY-06"].includes(id) ? { rhythmDate: state.selectedRhythmDate, rhythmOwner: String(state.authPhone || state.authForm?.phone || "legacy-session") } : {}),
      ...(["RHY-00", "RHY-04", "RHY-05"].includes(id) ? { rhythmOwner: String(state.authPhone || state.authForm?.phone || "legacy-session") } : {}),
      ...(id === "HLT-05" ? { oxygenMode: screen.querySelector(".oxygen-detail")?.dataset.oxygenMode || "day" } : {}),
      ...(id === "TOD-07" ? { activitySections: Object.fromEntries([...screen.querySelectorAll("details[data-activity-section]")].map(el => [el.dataset.activitySection, el.open])) } : {}),
      ...(["STU-09", "STU-16", "STU-17", "STU-18", "STU-10", "STU-11", "STU-03", "STU-04"].includes(id) ? { eventId: state.selectedStudioEventId } : {}),
    };
  }
  function go(id, recordHistory = true) {
    if (!generalSettingsSafe()) return;
    if (state.current === "HAL-08" && id !== "HAL-08" && !haloSettingsHub.canLeave()) return;
    if (state.current === "HAL-07" && id !== "HAL-07" && !haloPrivacyControls.canLeave()) return;
    if (state.current === "NIG-07" && id !== "NIG-07") nightSound.leave();
    if (state.current === "HAL-06" && id !== "HAL-06" && !haloJourney.canLeave()) return;
    if (state.current === "HAL-05" && id !== "HAL-05" && !haloFeelingEditor.canLeave()) return;
    if (state.current === "NIG-06" && id !== "NIG-06" && !nightWake.canLeave()) return;
    if (state.current === "HAL-04" && id !== "HAL-04" && !haloProactive.canLeave()) return;
    if (state.current === "HAL-03" && id !== "HAL-03" && !haloMemory.canLeave()) return;
    if (state.current === "HAL-02" && id !== "HAL-02" && !haloHistory.canLeave()) return;
    if (state.current === "ACC-03" && id !== "ACC-03" && !accountDeletion.canLeave()) return;
    if (state.current === "STU-04" && !studioSession.prepare()) return;
    if (["STU-12", "STU-15", "STU-05", "STU-06"].includes(state.current) && !studioReport.prepare()) return;
    if (state.current === "STU-03" && !studioPreflight.prepare()) return;
    const target = guardedRoute(id);
    haloFeelingEditor?.enter(target, state.current);
    haloJourney?.enter(target, state.current);
    haloPrivacyControls?.enter(target, state.current);
    haloSettingsHub?.enter(target, state.current);
    studioTodayReminder?.enter(target, state.current);
    if (!pages.some((item) => item.id === target)) return;
    if (target !== state.current && (target === "PERM-01" || state.current === "PERM-01")) permissionFeedback = "";
    if (modalRoot.querySelector(".legal-reading-modal, .permission-system-modal, .system-health-modal")) closeModal(true);
    helpCenter?.enter(target, state.current);
    supportContact?.enter(target, state.current);
    aboutLegal?.enter(target, state.current);
    nightReview.enter(target, state.current);
    nightHome.enter(target, state.current);
    healthReports.enter(target, state.current);
    stateShare.enter(target, state.current);
    dataQuality.enter(target, state.current);
    rhythmHome.enter(target, state.current);
    deviceWear.enter(target, state.current);
    initialSync?.enter(target, state.current);
    basicProfileEditor.enter(target, state.current);
    capturePageView();
    if (target === "DEV-10" && state.current !== "DEV-10") state.heartDeviceReturn = state.current === "HLT-01" ? heartReturnContext() : state.current === "HLT-02" ? respirationReturnContext() : null;
    if (["TOD-05", "DEV-10", "DEV-11", "DEV-01"].includes(target)) {
      if (state.current === "HLT-06") state.temperatureExternalReturn = { ...temperatureReturnContext(), destination: target };
      else if (!["TOD-05", "DEV-10", "DEV-11", "DEV-01"].includes(state.current)) state.temperatureExternalReturn = null;
    }
    if (["DEV-10", "DEV-11"].includes(target) && state.current === "HLT-05") state.oxygenDeviceReturn = { ...oxygenReturnContext(), destination: target };
    else if (["DEV-10", "DEV-11"].includes(target) && !/^DEV-/.test(state.current)) state.oxygenDeviceReturn = null;
    if (["TOD-05", "HLT-02"].includes(target) && !["HLT-05", "HLT-02", "TOD-05"].includes(state.current)) state.oxygenRelatedReturn = null;
    if (target === "TOD-05" && !["HLT-02", "TOD-05"].includes(state.current)) state.respirationSleepReturn = null;
    if (target === "TOD-02" && !["HLT-01", "HLT-02", "HLT-05", "HLT-06", "TOD-02"].includes(state.current)) state.recordEntryContext = null;
    if (target === "RHY-00" && state.current !== target) state.rhythmSetupReturn = /^DEV-|^ONB-/.test(state.current) ? "ONB-02" : "RHY-01";
    if (target === "DEV-01" && !["DEV-01", "DEV-02", "DEV-03", "SYS-01"].includes(state.current)) state.connectionIntro.returnRoute = state.current;
    if (target === "HELP-03" && state.current === "DEV-01") {
      // A direct review link may not yet be present in the tab stack.
      const deviceStack = state.tabStacks["MY-01"] || (state.tabStacks["MY-01"] = ["MY-01"]);
      if (deviceStack.at(-1) !== "DEV-01") deviceStack.push("DEV-01");
    }
    if (target === "SYS-01" && state.current !== target) startup?.begin(state.lastVisitedRoute);
    if (recordHistory && state.current !== target && state.current !== "SYS-01") state.navigationHistory.push(state.current);
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
    if (["RHY-00", "RHY-04"].includes(target) && changed) openRhythmSettings();
    if (target === "RHY-03") {
      const result = rhythmRecordStore.open(state.selectedRhythmDate);
      rhythmEditorProblem = result.ok ? "" : result.error; rhythmEditorDraftStatus = result.ok && rhythmRecordStore.inspect().dirty ? "已恢复未保存的草稿" : "";
    }
    const trail = Array.isArray(history.state?.trail) ? history.state.trail : [location.hash.slice(1) || "TOD-01"];
    const nextTrail = bodyWeatherRoute.mapTrail(changed && recordHistory ? [...trail, target] : [...trail.slice(0, -1), target]);
    if (changed && recordHistory) history.pushState({ halo: true, id: target, ...window.HALO_MEMBER_TASKS.historyFields(target), ...window.HALO_COUPON_WALLET?.historyFields?.(target), ...window.HALO_MEMBER_TASK_DETAIL.historyFields(target), trail: nextTrail, ...deviceWear.historyFields(target), ...nightReview.historyFields(target), ...nightHome.historyFields(target), ...healthReports.historyFields(target), ...stateShare.historyFields(target), ...dataQuality.historyFields(target), ...rhythmHome.historyFields(target), ...bodyWeatherRoute.historyFields(target) }, "", `#${target}`);
    else history.replaceState({ halo: true, id: target, ...window.haloChannelStorage?.historyFields(target), ...window.HALO_MEMBER_TASKS.historyFields(target), ...window.HALO_COUPON_WALLET?.historyFields?.(target), ...window.HALO_MEMBER_TASK_DETAIL.historyFields(target), trail: nextTrail, ...window.HALO_MEMBER_LEVELS.historyFields(target), ...window.HALO_MEMBER_UPGRADE.historyFields(target), ...deviceWear.historyFields(target), ...nightReview.historyFields(target), ...nightHome.historyFields(target), ...healthReports.historyFields(target), ...stateShare.historyFields(target), ...dataQuality.historyFields(target), ...rhythmHome.historyFields(target), ...bodyWeatherRoute.historyFields(target) }, "", `#${target}`);
    render();
  }
  function goBack() {
    if (nightFade.back()) return;
    if (nightSupport.back()) return;
    if (state.current === "REF-01") {
      if (history.state?.referralPanel === "share") { history.back(); return; }
      const source = history.state?.trail?.at(-2);
      if (["MEM-01", "MY-01"].includes(source)) { history.back(); return; }
      return go("MY-01", false);
    }
    if (bodyWeatherRoute.back()) return;
    if (["CHN-24", "CHN-17", "HELP-03"].includes(state.current) && history.state?.trail?.at(-2) === "CHN-26") { capturePageView(); persistAppProgress(); history.back(); return; }
    if (state.current === "HELP-03" && history.state?.trail?.at(-2) === "CHN-25") { capturePageView(); persistAppProgress(); history.back(); return; }
    if (["CHN-25", "HELP-03"].includes(state.current) && history.state?.trail?.at(-2) === "CHN-24") { capturePageView(); persistAppProgress(); history.back(); return; }
    if (state.current === "HELP-03" && history.state?.trail?.at(-2) === "CHN-23") { capturePageView(); persistAppProgress(); history.back(); return; }
    if (["CHN-23", "CHN-20", "HELP-03"].includes(state.current) && history.state?.trail?.at(-2) === "CHN-22") { capturePageView(); persistAppProgress(); history.back(); return; }
    if (["CHN-22", "HELP-03"].includes(state.current) && history.state?.trail?.at(-2) === "CHN-21") { capturePageView(); persistAppProgress(); history.back(); return; }
    if (["CHN-21", "CHN-22", "HELP-03"].includes(state.current) && history.state?.trail?.at(-2) === "CHN-20") { capturePageView(); persistAppProgress(); history.back(); return; }
    if (["CHN-20", "CHN-22", "CHN-24", "CHN-26", "HELP-03"].includes(state.current) && history.state?.trail?.at(-2) === "CHN-19") { capturePageView(); persistAppProgress(); history.back(); return; }
    if (["CHN-26", "CHN-24", "CHN-20", "CHN-19", "HELP-03"].includes(state.current) && history.state?.trail?.at(-2) === "CHN-18") { capturePageView(); persistAppProgress(); history.back(); return; }
    if (accountDeletion?.back()) return;
    if (state.current === "RHY-04" && history.state?.trail?.at(-2) === "RHY-05") { capturePageView(); persistAppProgress(); history.back(); return; }
    if (state.current === "RHY-05" && history.state?.trail?.at(-2) === "RHY-04") { capturePageView(); persistAppProgress(); history.back(); return; }
    if (accountSecurity?.back()) return;
    if (aboutLegal?.back()) return;
    if (state.current === "HLT-03") { if (history.state?.trail?.at(-2) === "HLT-00") { persistAppProgress(); history.back(); return; } return go("HLT-00", false); }
    if (supportContact?.back()) return;
    if (["HLT-01", "HLT-05", "HLT-06", "DEV-10", "DEV-11", "PERM-01"].includes(state.current) && history.state?.trail?.at(-2) === "HLT-03") { persistAppProgress(); history.back(); return; }
    if (state.current === "PERM-01") {
      const source = history.state?.trail?.at(-2);
      if (source && source !== "PERM-01" && pages.some(item => item.id === source)) { persistAppProgress(); history.back(); return; }
      return go("SET-01", false);
    }
    if (feedbackEditor?.back()) return;
    capturePageView();
    if (state.current === "LEGAL-01") {
      const source = history.state?.trail?.at(-2);
      if (source && source !== "LEGAL-01" && pages.some(item => item.id === source)) { persistAppProgress(); history.back(); return; }
      return go("LEGAL-02", false);
    }
    if (helpCenter?.back()) return;
    if (state.current === "HLT-04" && state.measurementType === "oxygen") return oxygenMeasurement.handle("oxygen-measure:return");
    if (["DEV-10", "DEV-11"].includes(state.current) && history.state?.trail?.at(-2) === "HLT-04" && state.measurementType === "oxygen" && oxygenMeasurement.request()) { persistAppProgress(); history.back(); return; }
    if ((state.current === "HELP-03" && history.state?.trail?.at(-2) === "CHN-07") || (["CHN-07", "CHN-12", "CHN-14", "HELP-03"].includes(state.current) && history.state?.trail?.at(-2) === "CHN-11") || (["CHN-07", "HELP-03"].includes(state.current) && ["CHN-12", "CHN-13", "CHN-14", "CHN-15", "CHN-16", "CHN-17"].includes(history.state?.trail?.at(-2)))) {
      const applicationHelpStack = state.tabStacks["MY-01"];
      if (applicationHelpStack?.at(-1) === state.current) applicationHelpStack.pop();
      persistAppProgress(); history.back(); return;
    }
    if (state.current === "ONB-02") {
      const source = history.state?.trail?.at(-2);
      if (source && source !== "ONB-02" && !/^(SYS|AUTH)-/.test(source) && pages.some(item => item.id === source)) { persistAppProgress(); history.back(); return; }
      return go("TOD-01", false);
    }
    if (state.current === "ONB-04") return basicProfileEditor.handle("basic-profile:back");
    if (state.current === "TOD-08") return nightReview.back();
    if (state.current === "TOD-09") return healthReports.back();
    if (state.current === "TOD-10") return stateShare.back();
    if (state.current === "TOD-11") return dataQuality.back();
    if (dataQuality.backFromExternal()) return;
    if (["TOD-05", "DEV-10", "DEV-11", "DEV-01"].includes(state.current) && state.temperatureExternalReturn?.destination === state.current) {
      const context = state.temperatureExternalReturn;
      state.temperatureExternalReturn = null;
      if (restoreHealthDetailReturn(context)) {
        const stack = state.tabStacks[tabForRoute(state.current)];
        if (stack?.at(-1) === state.current) stack.pop();
        if (history.state?.trail?.at(-2) === "HLT-06") { persistAppProgress(); history.back(); return; }
        return go("HLT-06", false);
      }
    }
    if (healthReports.backFromExternal()) return;
    if (state.current === "DEV-05") return initialSync.handle("initial-sync:back");
    if (initialSync?.backFromHelp()) return;
    if (["TOD-05", "HLT-02"].includes(state.current) && state.oxygenRelatedReturn?.destination === state.current) {
      const context = state.oxygenRelatedReturn;
      state.oxygenRelatedReturn = null;
      if (restoreHealthDetailReturn(context)) {
        if (state.tabStacks["TOD-01"]?.at(-1) === state.current) state.tabStacks["TOD-01"].pop();
        if (history.state?.trail?.at(-2) === context.route) { persistAppProgress(); history.back(); return; }
        return go(context.route, false);
      }
    }
    if (["DEV-10", "DEV-11"].includes(state.current) && state.oxygenDeviceReturn?.destination === state.current) {
      const context = state.oxygenDeviceReturn;
      state.oxygenDeviceReturn = null;
      if (restoreHealthDetailReturn(context)) {
        if (state.tabStacks["MY-01"]?.at(-1) === state.current) state.tabStacks["MY-01"].pop();
        if (history.state?.trail?.at(-2) === context.route) { persistAppProgress(); history.back(); return; }
        return go(context.route, false);
      }
    }
    if (state.current === "TOD-05" && state.respirationSleepReturn?.route === "HLT-02") {
      const context = state.respirationSleepReturn;
      state.respirationSleepReturn = null;
      if (restoreHealthDetailReturn(context)) {
        if (state.tabStacks["TOD-01"]?.at(-1) === "TOD-05") state.tabStacks["TOD-01"].pop();
        if (history.state?.trail?.at(-2) === context.route) { persistAppProgress(); history.back(); return; }
        return go(context.route, false);
      }
    }
    if (state.current === "DEV-10" && ["HLT-01", "HLT-02"].includes(state.heartDeviceReturn?.route)) {
      const context = state.heartDeviceReturn;
      state.heartDeviceReturn = null;
      if (restoreHealthDetailReturn(context)) {
        if (state.tabStacks["MY-01"]?.at(-1) === "DEV-10") state.tabStacks["MY-01"].pop();
        if (history.state?.trail?.at(-2) === context.route) { persistAppProgress(); history.back(); return; }
        return go(context.route, false);
      }
    }
    if (state.current === "DEV-04") return deviceWear.back();
    if (deviceWear.canReturnFromHelp()) return deviceWear.returnFromHelp();
    if (state.current === "TOD-02" && pages.some(item => item.id === history.state?.trail?.at(-2))) {
      const recordStack = state.tabStacks["TOD-01"];
      if (recordStack?.at(-1) === "TOD-02") recordStack.pop();
      persistAppProgress(); history.back(); return;
    }
    if (state.current === "DEV-03") return deviceBinding.back();
    if (state.current === "DEV-02") return deviceScan.back();
    if (state.current === "DEV-01" && state.connectionIntro.returnRoute !== "DEV-01" && pages.some(item => item.id === state.connectionIntro.returnRoute)) {
      const destination = state.connectionIntro.returnRoute;
      // Returning changes the navigation decision, not a permission already granted by the system.
      // A pending mock result may still be recorded, but cannot complete or navigate this intro.
      if (destination === "ONB-03") {
        state.connectionIntro.choice = "";
        state.connectionIntro.completed = false;
      }
      state.connectionIntro.returnRoute = "";
      const deviceStack = state.tabStacks["MY-01"];
      if (deviceStack?.at(-1) === "DEV-01") deviceStack.pop();
      trackPrototypeEvent(destination === "ONB-03" ? "onboarding_connection_returned" : "device_guide_returned", { source_page: "DEV-01", destination, simulated: true });
      if (history.state?.trail?.at(-2) === destination) { persistAppProgress(); history.back(); return; }
      return go(destination, false);
    }
    if (state.current === "ONB-03") return handleAction("connect-intro-skip");
    if (state.current === "AUTH-01") return go(state.authReturnRoute === "SEL-03" ? "SEL-03" : "ONB-01", false);
    if (["TOD-06", "TOD-07", "HLT-01", "HLT-02", "HLT-05", "HLT-06"].includes(state.current) && ["HLT-00", "TOD-01", "TOD-03", "TOD-05", "TOD-06", "TOD-07", "TOD-08"].includes(history.state?.trail?.at(-2))) {
      // A directly opened health overview may not yet be in the tab stack.
      // Prefer this detail's actual entry so Back does not jump to an unrelated home page.
      const detailStack = state.tabStacks["TOD-01"];
      if (detailStack?.at(-1) === state.current) detailStack.pop();
      persistAppProgress();
      history.back();
      return;
    }
    if (state.current === "HLT-06") return go("HLT-00", false);
    if (["SEL-01", "STU-08"].includes(state.current) && history.state?.trail?.at(-2) === "TOD-01") {
      const selectStack = state.tabStacks["MY-01"];
      if (selectStack?.at(-1) === state.current) selectStack.pop();
      history.back();
      return;
    }
    if (state.current === "SEL-03" && (!state.signedIn || state.welcomeShopping || history.state?.trail?.at(-2) === "ONB-01")) return go("ONB-01", false);
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
  function bodyWeatherInterpretationKey() {
    return ["body-weather", beijingDateKey(), state.healthDemoRecordDate, state.bodyWeather, state.dataLifecycle].join("|");
  }
  function canCorrectBodyWeather() {
    return state.signedIn && isHardwareActive() && state.dataLifecycle === "interpretable" && state.healthDemoRecordDate === beijingDateKey();
  }
  function activeWeatherCorrection() {
    const correction = state.aiCorrection;
    if (!canCorrectBodyWeather() || correction?.status !== "saved" || !correction.id || !Number.isFinite(Date.parse(correction.savedAt))) return null;
    return beijingDateKey(new Date(correction.savedAt)) === beijingDateKey() && correction.interpretationId === bodyWeatherInterpretationKey() ? correction : null;
  }
  function writeCorrectionState(changes) {
    const snapshot = { ...Object.fromEntries(persistedAppKeys.map(key => [key, state[key]])), ...changes, toggles: state.toggles };
    try { const saved = writeAppSnapshot(snapshot); for (const key of Object.keys(changes)) changes[key] = saved[key]; }
    catch { return false; }
    Object.assign(state, changes);
    return true;
  }
  function correctionDraftIsCurrent() {
    return canCorrectBodyWeather() && state.aiCorrectionDraft?.interpretationId === bodyWeatherInterpretationKey() && state.aiCorrectionDraft?.date === beijingDateKey();
  }
  function correctionModalIsCurrent() {
    return correctionDraftIsCurrent() && modalRoot.querySelector("[data-correction-token]")?.dataset.correctionToken === state.aiCorrectionDraft.id;
  }
  function showAiCorrectionModal() {
    if (!canCorrectBodyWeather()) return showInfoModal("暂时没有今天的解释可纠正", "可以先记录此刻感受。今天的身体天气可用后，再告诉 Halo 哪里不准确。", "记下感受", "go:TOD-02");
    if (!correctionDraftIsCurrent()) {
      const correction = activeWeatherCorrection();
      const previousDraft = state.aiCorrectionDraft;
      if (previousDraft && (previousDraft.reason || previousDraft.note)) state.aiCorrectionHistory = [...state.aiCorrectionHistory, { ...previousDraft, status: "draft", archivedAt: new Date().toISOString() }];
      state.aiCorrectionDraft = { id: `correction-draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, date: beijingDateKey(), interpretationId: bodyWeatherInterpretationKey(), reason: correction?.reason || "", note: correction?.note || "" };
    }
    const draft = state.aiCorrectionDraft;
    persistAppProgress();
    trackPrototypeEvent("ai_interpretation_correction_started", { source_page: state.current });
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal correction-modal" data-correction-token="${esc(draft.id)}" role="dialog" aria-modal="true" aria-labelledby="correction-title"><div class="modal-title-row"><div><span class="modal-eyebrow">${esc(draft.date)} · 用户反馈</span><h2 id="correction-title">哪里和你不太一样？</h2></div><button class="text-button" data-action="close-modal">暂不修改</button></div><p>选好后再保存。戒指数据保持原样，未保存的选择不会替换之前的反馈。</p><div class="correction-options">${Object.entries(AI_CORRECTION_REASONS).map(([value, label]) => `<button class="choice-row ${draft.reason === value ? "selected" : ""}" data-action="ai-correction-select:${value}" aria-pressed="${draft.reason === value}"><span><strong>${esc(label)}</strong></span><i aria-hidden="true">${draft.reason === value ? "✓" : ""}</i></button>`).join("")}</div></section></div>`;
  }
  function showAiCorrectionConfirm(reason, error = "") {
    if (!correctionDraftIsCurrent() || !AI_CORRECTION_REASONS[reason]) return;
    const draft = state.aiCorrectionDraft;
    const label = AI_CORRECTION_REASONS[reason];
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal correction-modal" data-correction-token="${esc(draft.id)}" role="dialog" aria-modal="true" aria-labelledby="correction-confirm-title"><div class="modal-title-row"><div><span class="modal-eyebrow">${esc(draft.date)} · 确认反馈</span><h2 id="correction-confirm-title">${esc(label)}</h2></div><button class="text-button" data-action="close-modal">暂不修改</button></div><p>保存为你的反馈，不改动戒指数据，也不会自动加入 Halo 记忆。</p><label class="field-label" for="ai-correction-note">想补充的话（选填）</label><textarea id="ai-correction-note" class="field" maxlength="500" aria-describedby="ai-correction-feedback" placeholder="例如：今天精神还可以，只是身体有点酸。">${esc(draft.note)}</textarea><p id="ai-correction-feedback" class="caption" role="status">${esc(error || "最多 500 字，关闭后草稿会保留。")}</p>${buttons([["保存这次反馈", `ai-correction-save:${reason}:current:${draft.id}`, "primary"], ["保存并查看 Halo 记忆", `ai-correction-save:${reason}:memory:${draft.id}`, "secondary"], ["返回重选", "ai-correction:open", "text-button"]])}</section></div>`;
  }
  function saveAiCorrection(reason, mode, token) {
    if (!correctionModalIsCurrent() || state.aiCorrectionDraft.id !== token || state.aiCorrectionDraft.reason !== reason || !AI_CORRECTION_REASONS[reason] || !["current", "memory"].includes(mode)) {
      if (modalRoot.querySelector("[data-correction-token]")) showInfoModal("这次解释已更新", "未保存的内容仍在草稿中。请返回查看当前状态，再决定是否纠正。", "返回身体天气", "go:TOD-03");
      return;
    }
    const note = String(state.aiCorrectionDraft.note || "").trim();
    if (note.length > 500) return showAiCorrectionConfirm(reason, "最多 500 字，请缩短后再保存。");
    const savedAt = new Date().toISOString();
    const correction = { id: token.replace("draft-", ""), status: "saved", source: "user-correction", reason, reasonLabel: AI_CORRECTION_REASONS[reason], note, savedAt, date: beijingDateKey(), interpretationId: bodyWeatherInterpretationKey(), recordDate: state.healthDemoRecordDate, memoryReview: false };
    const previous = state.aiCorrection;
    const history = previous.status !== "none" ? [...state.aiCorrectionHistory, { ...previous, archivedAt: savedAt }] : state.aiCorrectionHistory;
    if (!writeCorrectionState({ aiCorrection: correction, aiCorrectionDraft: null, aiCorrectionHistory: history })) return showAiCorrectionConfirm(reason, "这次没保存成功，原反馈没有变化，草稿也还在。请稍后重试。");
    setHaloSource("correction", null, true);
    trackPrototypeEvent("ai_interpretation_correction_saved", { correction_type: reason, interpretation_id: correction.interpretationId, memory_view_requested: mode === "memory" });
    closeModal();
    if (mode === "memory") go("HAL-03"); else render();
    return flash(mode === "memory" ? "反馈已保存；你可以逐条查看 Halo 记忆" : "反馈已保存，戒指数据保持原样");
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
      ...Object.entries(state.studioRecords || {}).filter(([eventId, record]) => studioFeeling.savedText(record, eventId)).map(([eventId, record]) => ({ id: `studio-user-${eventId}`, eventId, bookingId: record.bookingId, accountRef: record.accountRef, ownerAccount: record.ownerAccount, original: studioFeeling.savedText(record, eventId), occurredAt: record.beforeSavedAt || null, source: "user-record", category: "studio" })),
    ];
    return { exported_at: new Date().toISOString(), prototype_only: true, encrypted: false, user_records: records, legacy_user_tags: records.length ? [] : state.subjectiveMarkers, measurement_records: allMeasurementRecords(), scope_note: "仅当前浏览器原型记录。未接入设备真实健康档案，不包含云端数据。" };
  }
  function showWidgetPreview() {
    const active = isHardwareActive();
    const connection = active ? DEVICE_STATUS[state.deviceStatus] || DEVICE_STATUS.disconnected : DEVICE_STATUS.disconnected;
    const connectionLabel = !active ? "尚未绑定戒指" : state.deviceStatus === "low" ? "戒指低电量" : `戒指${connection.label}`;
    const weather = currentBodyWeather();
    const canInterpretWeather = active && state.dataLifecycle === "interpretable";
    const dataState = currentDataLifecycle();
    const bodyWeather = canInterpretWeather ? weather.label : active ? dataState.label : "尚未生成";
    const tonight = canInterpretWeather ? `今晚建议：${weather.nightTitle.replace("今晚", "")}` : "有足够数据后再显示今晚建议";
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal widget-modal gs-modal" data-general-modal="widget" role="dialog" aria-modal="true" aria-labelledby="gs-widget-title"><header class="gs-modal-header modal-title-row"><h2 id="gs-widget-title">桌面小组件预览</h2><button class="text-button" data-action="close-modal">关闭</button></header><p class="gs-note">仅预览显示样式；本原型不会向系统桌面添加小组件。</p><section class="widget-preview"><div class="widget-heading"><img src="${HALO_SYMBOL}" alt=""><span>BODY WEATHER</span></div><strong>${esc(bodyWeather)}</strong><div class="widget-status"><i class="${active ? esc(state.deviceStatus) : "disconnected"}"></i><span>${esc(connectionLabel)}</span></div><p>${esc(tonight)}</p></section><section class="gs-preview"><h3>桌面上会显示什么</h3><p>Body Weather、戒指连接状态与今晚建议。不展示心率、HRV、血氧、温度或对话内容。</p><small>桌面内容可能被旁人看到，请按你的隐私需求决定是否使用。当前内容来自原型状态，并非实时设备数据。</small></section><div class="button-row gs-actions"><button class="primary" data-action="close-modal">知道了</button></div></section></div>`;
  }
  function showWidgetAdded() {
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal widget-modal gs-modal" role="dialog" aria-modal="true" aria-labelledby="gs-widget-limit-title"><header class="gs-modal-header modal-title-row"><h2 id="gs-widget-limit-title">当前仅支持预览</h2><button class="text-button" data-action="close-modal">关闭</button></header><p>本原型尚未接入系统小组件，没有向你的桌面添加内容。</p><div class="button-row gs-actions"><button class="primary" data-action="close-modal">知道了</button><button class="secondary" data-action="widget-preview">返回预览</button></div></section></div>`;
  }
  function showRecordDetail(label) {
    const record = state.subjectiveRecords.find(item => item.id === label || item.label === label);
    if (!record) return showInfoModal("记录不存在", "这条记录可能已被删除。返回后可以查看其他记录。");
    if (record.category === "rhythm") return showInfoModal(`${record.label} · 用户记录`, `${record.occurredAt ? recordDateTime(record.occurredAt) : "原记录未保存日期"}\n${record.original || "没有补充文字。"}`, "修改或删除这一天", `rhythm-date:${record.occurredAt}`);
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal record-detail-modal" aria-labelledby="record-detail-title"><header class="modal-title-row"><div><small>用户记录</small><h2 id="record-detail-title">${esc(record.label)}</h2></div><button class="text-button" data-action="close-modal">关闭</button></header><p class="record-detail-date">${esc(record.occurredAt ? recordDateTime(record.occurredAt) : "原记录未保存日期")}${record.updatedAt ? `<br>修改于 ${esc(recordDateTime(record.updatedAt))}` : ""}</p><p class="record-detail-note">${esc(record.original || "没有补充文字。")}</p><details class="record-detail-info"><summary>关于这条记录</summary><p>这是你主动记下的感受，不会改动戒指数据。修改后仍保留原记录时间。</p></details>${buttons([["修改", `record-edit:${record.id}`, "secondary"], ["删除这条记录", `record-delete:${record.id}`, "text-button record-delete-link"]])}</section></div>`;
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
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal membership-rules-modal commerce-boundary-modal"><div class="modal-title-row"><div><span class="modal-eyebrow">HALO SERVICES</span><h2>商城、推荐与体验顾问</h2></div><button class="text-button" data-action="close-modal">关闭</button></div>${rows([["Halo Select", "浏览精选商品、订单与售后"], ["会员推荐", "邀请朋友并查看奖励进度"], ["体验顾问", "先提交申请；身份生效后才能查看服务订单、收益和经营工具"]])} ${buttons([["进入 Halo Select", "go:SEL-01", "primary"], ["会员推荐", "go:REF-01", "secondary"], ["查看体验顾问申请与经营", "go:CHN-01", "secondary"]])}</section></div>`;
  }
  function currentMemberAssetSnapshot() {
    return window.HALO_COMMERCIAL_EXTENSION?.getMemberSnapshot({
      hardwareActive: isHardwareActive(),
      membershipState: state.membershipHardwareState,
      newMember: Boolean(state.newMember),
      memberCreatedAt: state.memberCreatedAt || "",
      hardwareActivatedAt: state.hardwareActivatedAt || "",
      applicationContext: () => ({accountRef: state.authPhone || "", signedIn: state.signedIn === true}),
    }) || {
      level: "会员资料待取得", growth: null, badges: null, points: null,
      coupons: 0, unusedBenefits: 0, pending: 0,
    };
  }
  function showSupportHandoff() {
    supportContact.open();
  }
  let modalReturnFocus = null;
  function closeModal(skipReadingHistory = false) {
    if (haloProactive?.beforeClose() === false) return;
    if (haloMemory?.beforeClose() === false) return;
    if (modalRoot.querySelector(".rc-modal")) rhythmCycleStore.clearIntent();
    if (modalRoot.querySelector(".rh-manage-confirm")) rhythmManagementStore.cancelDelete();
    if (!skipReadingHistory && modalRoot.querySelector(".legal-reading-modal") && legalReadingView()) { history.back(); return; }
    systemHealth?.close();
    modalRoot.innerHTML = "";
    screen.inert = false;
    tabbar.inert = false;
    if (modalReturnFocus?.isConnected) modalReturnFocus.focus({ preventScroll: true });
    else if (/^(legal-read:|perm:open:|health-source:open)/.test(modalReturnFocus?.getAttribute("data-action") || "")) screen.querySelector(`[data-action="${modalReturnFocus.getAttribute("data-action")}"]`)?.focus({ preventScroll: true });
    else if (state.current === "DEV-05" && modalReturnFocus?.getAttribute("data-action") === "initial-sync:help") screen.querySelector('[data-action="initial-sync:help"]')?.focus({ preventScroll: true });
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
    const deviceAction = item.id === "TOD-01" ? `${haloStatus(state.deviceStatus, "compact", "today-device")}<span class="today-sync-label">${esc(todaySyncLabel())}</span>` : deviceRoots.includes(item.id) ? haloStatus(state.deviceStatus, "compact") : "";
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
      body: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="7" r="1.5"/><path d="M7 11h10m-5-2v7m0-2-3 4m3-4 3 4"/>',
      report: '<path d="M6 3h8l4 4v14H6Z M14 3v5h4 M9 12h6 M9 16h6"/>',
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
    return `<div class="three-column visual-signals${empty ? " is-empty" : ""}">${signals.map(([label, value], index) => { const kind = ["sleep", "energy", "activity"][index]; return `<button class="signal-card" data-kind="${kind}" data-action="go:${routes[index]}" aria-label="${esc(label)}：${esc(value)}，查看详情"><span class="signal-head"><i aria-hidden="true">${domainIcon(kind)}</i><em>${esc(label)}</em></span><strong>${esc(value)}</strong><span class="signal-foot">${empty ? "查看说明" : state.dataLifecycle !== "interpretable" ? "查看记录" : index === 2 ? "今天" : "昨晚"}<i aria-hidden="true">›</i></span></button>`; }).join("")}</div>`;
  }
  function weatherDistribution(items) {
    const total = Math.max(1, items.reduce((sum, item) => sum + item[1], 0));
    return `<section class="weather-distribution"><div class="weather-distribution-bar" role="img" aria-label="身体天气分布">${items.map(([label, value, tone]) => `<i class="${esc(tone)}" style="flex:${value}" title="${esc(`${label} ${value} 天`)}"></i>`).join("")}</div><div class="weather-distribution-legend">${items.map(([label, value, tone]) => `<span><i class="${esc(tone)}"></i><b>${esc(label)}</b><small>${value} 天 · ${Math.round(value / total * 100)}%</small></span>`).join("")}</div></section>`;
  }
  function activityMix(items) {
    const total = Math.max(1, items.reduce((sum, item) => sum + item[1], 0));
    return `<section class="activity-mix"><div class="activity-mix-head"><span>今日活动强度</span><strong>${total} 分钟</strong></div><div class="activity-mix-bar" role="img" aria-label="今日活动强度分布">${items.map(([label, value, tone]) => `<i class="${esc(tone)}" style="flex:${value}" title="${esc(`${label} ${value} 分钟`)}"></i>`).join("")}</div><div class="activity-mix-legend">${items.map(([label, value, tone]) => `<span><i class="${esc(tone)}"></i>${esc(label)} <b>${value}m</b></span>`).join("")}</div></section>`;
  }
  function hrvExplainer({ hasReading = false, canCompare = false, date = beijingDateKey() } = {}) {
    return `<details class="hrv-disclosure"><summary>HRV 怎么看${healthChevron()}</summary><div class="energy-hrv-education">${hasReading ? `<p class="energy-hrv-reading"><strong>${esc(healthDateLabel(date))} · 42 ms</strong><br>${canCompare ? "这一晚的数值接近你的平时，不需要仅因这一项改变安排。" : "已有读数，个人范围还在积累中，暂不判断偏高或偏低。"}</p>` : ""}<p class="hrv-plain-definition">在同一个人、同一种测量条件下，数值较大，表示相邻心跳间隔的变化更大；数值较小，表示心跳节奏更均匀。</p><div class="hrv-direction-grid"><article class="higher"><span>高于平时</span><strong>身体可能恢复得不错</strong><p>这常和睡得比较好、压力较小或运动后恢复充分一起出现。</p></article><article class="lower"><span>低于平时</span><strong>身体可能还在恢复</strong><p>没睡够、压力大、饮酒、身体不舒服或前一天运动较重时，都可能偏低。</p></article></div><section class="hrv-medicine-card"><span class="record-glyph" aria-hidden="true">i</span><div><small>一点医学知识</small><strong>它和自主神经有关</strong></div><p>自主神经会自动调节心跳。休息时，迷走神经等副交感调节通常会让心跳间隔出现更多细微变化；紧张、活动或身体负担增加时，这种变化可能减少。</p></section>${notice("不是越高越好", "HRV 的个体差异很大。突然大幅偏高或偏低，也可能和呼吸节奏、记录质量或心律变化有关。连续几晚的方向，比单次数字更有参考价值。")}${notice("身体能量不只看 HRV", "Halo 还会结合静息心率、睡眠连续性和近期活动。HRV 接近平时，不代表这一晚一定睡得好。") }<p class="health-boundary compact">HRV 不能单独判断压力、恢复或疾病。如果同时有持续心慌、胸闷、晕厥或明显不适，请及时寻求专业帮助。</p><p class="energy-hrv-sources"><a href="https://www.health.harvard.edu/blog/heart-rate-variability-new-way-track-well-201711221470" target="_blank" rel="noopener noreferrer">HRV 与自主神经 · Harvard Health</a><a href="https://my.clevelandclinic.org/health/symptoms/21773-heart-rate-variability-hrv" target="_blank" rel="noopener noreferrer">HRV 的使用边界 · Cleveland Clinic</a></p></div></details>`;
  }
  function waveform(active = true) { return `<div class="audio-wave ${active ? "active" : "paused"}" aria-hidden="true">${[32,52,76,44,68,88,58,38,72,48,64,34].map((height, index) => `<i style="height:${height}%;--delay:${index * 45}ms"></i>`).join("")}</div>`; }
  function buttons(items) { return `<div class="button-row">${items.map(([label, action, kind = "secondary", disabled = false]) => `<button class="${kind}" data-action="${esc(action)}" ${disabled ? "disabled" : ""}>${esc(label)}</button>`).join("")}</div>`; }
  function setting(title, detail, action, value) { const [kind, glyph] = visualMeta(title); return `<button class="setting-row visual-setting" data-kind="${kind}" data-action="${esc(action)}"><span class="setting-glyph" aria-hidden="true">${glyph}</span><div><strong>${esc(title)}</strong><span>${esc(detail || "")}</span></div><i>${esc(value || "›")}</i></button>`; }
  function toggle(key, title, detail) { const enabled = key === "rhythmNotice" && state.current === "RHY-00" ? rhythmSettingsStore.inspect().values.notice : key === "wake" && state.current === "NIG-06" ? !!state.wakeDraft.enabled : !!state.toggles[key]; return `<section class="setting-row"><div><strong>${esc(title)}</strong><span>${esc(detail || "")}</span></div><button class="switch ${enabled ? "on" : ""}" data-action="toggle:${esc(key)}" role="switch" aria-checked="${enabled}" aria-label="切换${esc(title)}"></button></section>`; }
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
  function isHardwareActive() {
    if (state.membershipHardwareState !== "active") return false;
    if (!state.personalAccountScope) return true;
    const owner = state.authPhone || "", id = state.pairedDevice?.id, device = state.deviceBindings?.[id];
    const activated = state.deviceHub?.accounts?.[owner]?.facts?.[id]?.activatedAt || device?.activatedAt;
    return state.personalAccountScope.legacyHealthOwner === owner || Boolean(device?.accountRef === owner && activated && Number.isFinite(Date.parse(activated)) && (!device.boundAt || Date.parse(activated) >= Date.parse(device.boundAt)));
  }
  function setMembershipState(value) {
    if (!MEMBERSHIP_STATES.includes(value)) return;
    const previous = state.membershipHardwareState;
    state.membershipHardwareState = value;
    localStorage.setItem(MEMBERSHIP_STATE_KEY, value);
    if (value !== "active") {
      state.deviceStatus = "disconnected";
      state.toggles.haloBody = false;
      if (state.haloContext === "body") setHaloSource("none");
      state.studioMode = "basic";
      state.toggles.studioHealth = false;
    } else if (state.deviceStatus === "disconnected") {
      state.deviceStatus = "connected";
      state.toggles.haloBody = true;
      if (!state.haloSource) setHaloSource("body");
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
  function currentRecordDraft() {
    return state.current === "TOD-02" && state.recordEditorMode === "edit" ? state.recordEditDraft || { labels: [], note: "" } : state.recordDraft;
  }
  function restoreHealthDetailReturn(context) {
    if (!["TOD-07", "HLT-01", "HLT-02", "HLT-05", "HLT-06"].includes(context?.route) || !validHealthDate(context.date)) return false;
    state.healthSelectedDate = context.date;
    state.healthDetailContext = { route: context.route, metric: { "TOD-07": "activity", "HLT-01": "heart", "HLT-02": "breath", "HLT-05": "oxygen", "HLT-06": "temperature" }[context.route], date: context.date };
    if (context.route === "HLT-06") state.temperatureWindowEnd = validHealthDate(context.windowEnd) ? context.windowEnd : context.date;
    if (context.route === "TOD-07") state.activityRecordsScope = context.scope === "all" ? "all" : "day";
    if (context.route === "HLT-01" && Object.prototype.hasOwnProperty.call(context, "trendSelection")) state.heartTrendSelection = context.trendSelection;
    if (context.route === "HLT-02") state.respirationWindowEnd = validHealthDate(context.windowEnd) ? context.windowEnd : context.date;
    if (context.route === "HLT-05") {
      state.oxygenWindowEnd = validHealthDate(context.windowEnd) ? context.windowEnd : context.date;
      state.oxygenMode = context.mode === "night" ? "night" : "day";
      state.oxygenDaySelection = context.daySelection || null;
    }
    if (context.view) state.pageViews[context.route] = { ...context.view };
    return true;
  }
  function recordEditorValidation() {
    const draft = currentRecordDraft();
    const editing = state.recordEditorMode === "edit";
    const record = editing ? state.subjectiveRecords.find(item => item.id === draft.id && item.category !== "rhythm") : null;
    if (editing && !record) return { valid: false, hint: "这条记录已不存在，可以返回查看其他记录。" };
    if (draft.note.length > 500) return { valid: false, hint: "最多写 500 字，请稍微缩短一下。" };
    if (!draft.labels.length && !draft.note.trim()) return { valid: false, hint: "选一项，或写一句再保存。" };
    if (editing && draft.note.trim() === String(record.original || "") && JSON.stringify([...draft.labels].sort()) === JSON.stringify([...(record.labels || [record.label])].sort())) return { valid: false, hint: "还没有修改。" };
    return { valid: true, hint: "" };
  }
  function updateRecordEditorControls() {
    const button = screen.querySelector("#record-save-button");
    if (!button) return;
    const validation = recordEditorValidation();
    button.disabled = !validation.valid;
    screen.querySelector("#record-save-hint").textContent = state.recordEditorError || validation.hint;
    screen.querySelector("#record-note-count").textContent = `${currentRecordDraft().note.length}/500`;
  }
  function recordWeatherIcon(label) {
    // Same visual vocabulary as HAL-05; icons do not change subjective record values.
    const icons = {
      "有精神": '<g class="record-weather-sun"><circle cx="16" cy="16" r="6"/><path d="M16 2v4m0 20v4M2 16h4m20 0h4M6 6l3 3m14 14 3 3M26 6l-3 3M9 23l-3 3"/></g>',
      "还好": '<g class="record-weather-sun"><path d="M12 3v2M4 11H2m3-7 1.5 1.5M19 4l-1.5 1.5"/><circle cx="12" cy="11" r="5"/></g><path class="record-weather-cloud" d="M10 25a4.5 4.5 0 0 1-.5-9 6.5 6.5 0 0 1 12.5 1H24a4 4 0 0 1 0 8Z"/>',
      "有点累": '<path d="M10 13a5.5 5.5 0 0 1 10.5-2H23a4 4 0 0 1 3 6" opacity=".6"/><path class="record-weather-cloud" d="M7 26a5 5 0 0 1-.5-10 6.5 6.5 0 0 1 12.5 1H21a4.5 4.5 0 0 1 0 9Z"/>',
      "紧绷": '<path class="record-weather-wind" d="M3 12h16a4 4 0 1 0-4-4M3 17h23a3 3 0 1 0-3-3M7 22h10a3 3 0 1 1-3 3"/>',
      "低落": '<path class="record-weather-cloud" d="M7 19a4.5 4.5 0 0 1 0-9 6.5 6.5 0 0 1 12.5 0H23a4.5 4.5 0 0 1 0 9Z"/><path class="record-weather-rain" d="m10 24-1 3m8-3-1 3m8-3-1 3"/>'
    };
    return icons[label] ? `<svg class="record-weather-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false">${icons[label]}</svg>` : "";
  }
  function recordEditorPage() {
    const draft = currentRecordDraft();
    const editing = state.recordEditorMode === "edit";
    const record = editing ? state.subjectiveRecords.find(item => item.id === draft.id) : null;
    const activity = record?.category === "activity";
    const feelings = activity ? ACTIVITY_FEELINGS : RECORD_FEELINGS;
    const validation = recordEditorValidation();
    const chip = label => { const weather = !activity && RECORD_FEELINGS.includes(label) ? recordWeatherIcon(label) : ""; return `<button type="button" class="record-choice${weather ? " record-weather-option" : ""}${draft.labels.includes(label) ? " selected" : ""}" data-action="record-option:${esc(label)}" aria-pressed="${draft.labels.includes(label)}">${weather}<span>${esc(label)}</span><i aria-hidden="true">${draft.labels.includes(label) ? "✓" : weather ? "" : "+"}</i></button>`; };
    const legacy = [...new Set([...draft.labels, ...(record?.labels || (record ? [record.label] : []))])].filter(label => !(activity ? ACTIVITY_FEELINGS : [...RECORD_FEELINGS, ...RECORD_CIRCUMSTANCES]).includes(label));
    const context = editing ? record?.occurredAt ? recordDateTime(record.occurredAt) : "原记录未保存日期" : draft.reportMonth ? `${Number(draft.reportMonth.slice(5))} 月回顾反馈` : ["HLT-01", "HLT-02", "HLT-05", "HLT-06"].includes(state.recordEntryContext?.route) ? `${healthDateLabel(beijingDateKey())} · 用户记录` : "用户记录";
    return `<article class="record-page"><header class="record-page-header"><div class="record-page-toolbar"><button type="button" class="record-icon-button" data-action="record-back" aria-label="返回，保留未保存内容">${healthChevron("left")}</button><span>${esc(context)}</span><button type="button" class="record-icon-button record-help-button" data-action="record-help" aria-label="关于用户记录">i</button></div><h1>${activity ? "修改活动感受" : editing ? "修改这条记录" : "记下此刻感受"}</h1></header><div class="record-page-scroll"><fieldset class="record-feelings"><legend>${activity ? "那次活动后，感觉怎么样？" : editing ? "当时感觉怎么样？" : "现在感觉怎么样？"}</legend><p>${activity ? "选一种感受，也可以只写一句。" : "可多选，也可以只写一句。"}</p><div class="record-choice-grid${activity ? "" : " record-weather-grid"}">${feelings.map(chip).join("")}</div></fieldset>${legacy.length ? `<section class="record-legacy"><h2>原记录标签</h2><div class="record-choice-grid">${legacy.map(chip).join("")}</div></section>` : ""}${activity ? "" : `<details class="record-circumstances" ${draft.labels.some(label => RECORD_CIRCUMSTANCES.includes(label)) ? "open" : ""}><summary><span>${editing ? "当时的情况" : "今天的情况"} <small>选填</small></span><i aria-hidden="true">＋</i></summary><div class="record-choice-grid">${RECORD_CIRCUMSTANCES.map(chip).join("")}</div></details>`}<label class="record-note-label" for="record-note">想补充一句吗？ <small>选填</small></label><textarea class="record-note-input" id="record-note" maxlength="500" placeholder="${activity ? "比如：散步回来，感觉轻松了些。" : "比如：今天有点累，想早点休息。"}" aria-describedby="record-note-count">${esc(draft.note)}</textarea><div class="record-note-meta"><span>返回后也能继续写</span><span id="record-note-count">${draft.note.length}/500</span></div></div><footer class="record-page-footer">${editing && state.recordEditorError ? '<button type="button" class="text-button" data-action="record-conflict-review">查看最新记录</button>' : ''}<p id="record-save-hint" aria-live="polite">${esc(state.recordEditorError || validation.hint)}</p><button type="button" class="primary" id="record-save-button" data-action="record-save" aria-describedby="record-save-hint" ${validation.valid ? "" : "disabled"}>${editing ? "保存修改" : "保存"}</button></footer></article>`;
  }
  function startRecordEdit(id) {
    const record = state.subjectiveRecords.find(item => item.id === id && item.category !== "rhythm");
    if (!record) return showInfoModal("记录不存在", "这条记录可能已被删除。可以返回查看其他记录。");
    if (state.recordEditDraft?.id !== id && !recordEditHasChanges()) state.recordEditDraft = null;
    if (state.recordEditDraft && state.recordEditDraft.id !== id) return showInfoModal("还有一条修改未保存", "先继续上一条修改，或返回原记录后再决定。新记录草稿也会保留。", "继续上一条修改", `record-edit:${state.recordEditDraft.id}`);
    state.recordEditDraft = state.recordEditDraft || { id, labels: [...(record.labels || [record.label])], note: String(record.original || ""), returnRoute: state.current === "TOD-02" ? "TOD-01" : state.current };
    if (!state.recordEditDraft.baseRecord) state.recordEditDraft.baseRecord = JSON.parse(JSON.stringify(record));
    if (state.current === "TOD-07") {
      capturePageView();
      state.recordEditDraft.returnRoute = "TOD-07";
      state.recordEditDraft.returnContext = { route: "TOD-07", date: activityRecordDate(), view: { ...state.pageViews["TOD-07"] }, scope: state.activityRecordsScope };
    }
    if (state.current === "HLT-01") {
      capturePageView();
      state.recordEditDraft.returnRoute = "HLT-01";
      state.recordEditDraft.returnContext = heartReturnContext();
    }
    if (state.current === "HLT-02") {
      capturePageView();
      state.recordEditDraft.returnRoute = "HLT-02";
      state.recordEditDraft.returnContext = respirationReturnContext();
    }
    if (state.current === "HLT-05") {
      capturePageView();
      state.recordEditDraft.returnRoute = "HLT-05";
      state.recordEditDraft.returnContext = oxygenReturnContext();
    }
    if (state.current === "HLT-06") {
      capturePageView();
      state.recordEditDraft.returnRoute = "HLT-06";
      state.recordEditDraft.returnContext = temperatureReturnContext();
    }
    state.recordEditorMode = "edit";
    state.recordEditorError = "";
    closeModal(); go("TOD-02");
  }
  function recordEditHasChanges() {
    const draft = state.recordEditDraft;
    const record = draft && state.subjectiveRecords.find(item => item.id === draft.id);
    return Boolean(record && (draft.note.trim() !== String(record.original || "") || JSON.stringify([...draft.labels].sort()) !== JSON.stringify([...(record.labels || [record.label])].sort())));
  }
  let recordConflictSnapshot = null;
  function reviewRecordConflict() {
    if (state.current !== "TOD-02" || state.recordEditorMode !== "edit" || !state.recordEditDraft) return;
    const records = readStoredJson(SUBJECTIVE_RECORDS_KEY, null);
    if (!Array.isArray(records)) return flash("暂时无法读取最新记录，输入仍保留，请稍后重试。");
    const record = records.find(value => todayRhythmStorage.own(value) && value.id === state.recordEditDraft.id);
    recordConflictSnapshot = record ? JSON.parse(JSON.stringify(record)) : null;
    if (!record) return showInfoModal("原记录已不在这里", "当前输入仍然保留。可以将它作为一条今天的新记录继续编辑，不会恢复已删除的原记录。", "另存为新记录", "record-conflict-copy");
    showInfoModal("最新保存的内容", `${record.label}\n\n${record.original || "没有补充文字。"}\n\n你的修改仍保留在输入框。核对后可继续编辑，再决定是否保存。`, "保留我的修改，继续编辑", "record-conflict-rebase");
  }
  function commitUserRecords(records) {
    let merged;
    try {
      merged = todayRhythmStorage?.mergeRecords(records, state.current === "TOD-02" && state.recordEditorMode === "edit" ? state.recordEditDraft?.baseRecord : null) || { all: records, active: records };
      localStorage.setItem(SUBJECTIVE_RECORDS_KEY, JSON.stringify(merged.all));
    }
    catch (error) {
      const context = state.recordEditorMode === "edit" ? state.recordEditDraft?.returnContext : state.recordEntryContext;
      state.recordEditorError = error?.name === "Error" ? error.message : ["HLT-02", "HLT-05", "HLT-06"].includes(context?.route) ? "这次没保存成功，内容仍在本页。请先不要关闭，稍后重试。" : "这次没保存成功，内容还在，请稍后重试。";
      return false;
    }
    records.splice(0, records.length, ...merged.active);
    todayRhythmStorage?.acceptRecords(records);
    state.subjectiveRecords = records;
    state.subjectiveMarkers = [...new Set(records.flatMap(record => record.labels || [record.label]))];
    return true;
  }
  function clearRecordReference(id) {
    if (state.haloSource?.recordId === id) setHaloSource("none");
    state.conversations?.forEach(entry => { if (entry.source?.recordId === id) { entry.source = null; entry.context = "none"; } });
  }
  function memberTaskIdentity() {
    const accountRef = state.authPhone || state.authForm?.phone || "", registrationId = state.memberCreatedAt || "";
    try {
      const app = JSON.parse(localStorage.getItem(APP_PROGRESS_KEY) || "null");
      if (!state.signedIn || !accountRef || app?.signedIn !== true || app.authVerified !== true || (app.authPhone || app.authForm?.phone) !== accountRef || (app.memberCreatedAt || "") !== registrationId) return null;
      if (registrationId) return typeof registrationId === "string" && /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(registrationId) && Number.isFinite(Date.parse(registrationId)) && Date.parse(registrationId) <= Date.now() ? { accountRef, registrationId } : null;
      if (state.newMember === true || app.newMember === true) return null;
      const ledger = JSON.parse(localStorage.getItem("haloV5CommercialProgress") || "null");
      const owners = [ledger?.accountRef, ledger?.memberAssets?.accountRef].filter(value => value !== undefined);
      if (!ledger?.memberAssets || !owners.length || owners.some(owner => owner !== accountRef) || [ledger.registrationId, ledger.memberAssets.registrationId].some(value => value !== undefined && value !== "")) return null;
      return { accountRef, registrationId: "" };
    } catch { return null; }
  }
  function saveRecordEditor() {
    if (state.current !== "TOD-02") return;
    const validation = recordEditorValidation();
    if (!validation.valid) { updateRecordEditorControls(); return; }
    const draft = currentRecordDraft();
    const labels = [...draft.labels];
    const note = draft.note.trim();
    const editing = state.recordEditorMode === "edit";
    const now = new Date().toISOString();
    let record;
    if (editing) {
      const original = state.subjectiveRecords.find(item => item.id === draft.id && item.category !== "rhythm");
      if (!original) return;
      record = { ...original, labels, label: labels.join("、") || "感受", original: note, updatedAt: now };
      if (!commitUserRecords(state.subjectiveRecords.map(item => item.id === record.id ? record : item))) { render(); return; }
      clearRecordReference(record.id);
      const destination = pages.some(item => item.id === draft.returnRoute) && draft.returnRoute !== "TOD-02" ? draft.returnRoute : "TOD-01";
      restoreHealthDetailReturn(draft.returnContext);
      state.recordEditDraft = null; state.recordEditorMode = "new"; state.recordEditorError = "";
      if (state.tabStacks["TOD-01"]?.at(-1) === "TOD-02") state.tabStacks["TOD-01"].pop();
      go(destination, false); showRecordDetail(record.id); flash("修改已保存");
    } else {
      record = { id: `record-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, label: labels.join("、") || "感受", labels, original: note, occurredAt: now, source: "user-record", ...(draft.reportMonth ? { reportMonth: draft.reportMonth } : {}) };
      const identity = memberTaskIdentity();
      if (draft.reportMonth && isHardwareActive() && state.dataLifecycle === "interpretable" && identity) record.memberTaskEvidence = { taskId: "monthly-review", ...identity, occurredAt: now, verified: true, hardwareActive: true };
      if (!commitUserRecords([...state.subjectiveRecords, record])) { render(); return; }
      if (record.memberTaskEvidence) {
        const evidence = record.memberTaskEvidence, newMember = Boolean(state.newMember);
        Promise.resolve().then(() => window.HALO_COMMERCIAL_EXTENSION?.completeTask?.({ ...evidence, memberCreatedAt: evidence.registrationId, newMember })).catch(() => false).then(posted => {
          if (posted !== true && state.signedIn && (state.authPhone || state.authForm?.phone || "") === evidence.accountRef && state.memberCreatedAt === evidence.registrationId) flash("记录已保存，奖励待同步，可在会员任务重试");
        });
      }
      const heartReturn = ["HLT-01", "HLT-02", "HLT-05", "HLT-06"].includes(state.recordEntryContext?.route) && restoreHealthDetailReturn(state.recordEntryContext);
      const destination = heartReturn ? state.recordEntryContext.route : draft.returnRoute === "TOD-03" ? "TOD-03" : "TOD-01";
      state.recordEntryContext = null;
      state.recordDraft = { labels: [], note: "" }; state.recordEditorError = "";
      if (state.tabStacks["TOD-01"]?.at(-1) === "TOD-02") state.tabStacks["TOD-01"].pop();
      go(destination, false); if (heartReturn) showRecordDetail(record.id); flash("用户记录已保存");
    }
  }
  function deleteUserRecord(id) {
    const record = state.subjectiveRecords.find(item => item.id === id && item.category !== "rhythm");
    if (!record) return showInfoModal("记录已不存在", "可以返回查看其他记录。");
    if (!commitUserRecords(state.subjectiveRecords.filter(item => item.id !== id))) return showInfoModal("删除未完成", "这条记录仍然保留，请稍后重试。", "返回这条记录", `record-detail:${id}`);
    if (state.recordEditDraft?.id === id) { state.recordEditDraft = null; state.recordEditorMode = "new"; }
    clearRecordReference(id);
    state.recordEditorError = "";
    closeModal(); render(); flash("这条记录已删除");
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
    return `<section class="monthly-report"><h3>月度回顾</h3><p>在健康报告中，查看已经生成的月度回顾。</p>${buttons([["查看我的报告", "go:TOD-09", "primary"]])}</section>`;
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
    if (!canCorrectBodyWeather()) return "";
    const correction = activeWeatherCorrection();
    if (!correction) {
      return `<button class="interpretation-feedback" data-action="ai-correction:open"><span aria-hidden="true">≠</span><span><strong>和我现在的感受不太一样</strong><small>纠正这次解释，不改动戒指数据</small></span><i aria-hidden="true">›</i></button>`;
    }
    return `<section class="correction-result" role="status"><span class="correction-result-icon" aria-hidden="true">✓</span><div><small>用户反馈 · ${esc(correction.date)}</small><strong>${esc(correction.reasonLabel)}</strong>${correction.note ? '<button class="text-button correction-note-link" data-action="bw-feedback-note">查看补充文字</button>' : ""}<p>这份反馈与戒指记录分开保存。</p><div class="suggestions"><button class="text-button" data-action="ai-correction:open">修改反馈</button><button class="text-button" data-action="ai-correction-reset">撤销反馈</button></div></div></section>`;
  }
  function currentJourneyStep() {
    const theme = JOURNEY_THEMES[state.journeyTheme] || JOURNEY_THEMES.boundary;
    return theme[Math.max(0, Math.min(theme.length - 1, state.journeyVariant))];
  }
  function syncJourneyAliases() {
    const journey = state.journeyRecords[state.journeyTheme];
    state.journeyProgress = journey.days.length;
    state.journeyPaused = journey.status === "paused";
    state.journeyDecision = journey.status === "deferred" ? "deferred" : journey.status === "ended" ? "unsuitable" : "active";
    state.journeyVariant = journey.variant || 0;
    state.journeyReason = journey.reason || "";
    state.journeyMissCount = journey.missCount || 0;
  }
  function updateJourney(patch) {
    Object.assign(state.journeyRecords[state.journeyTheme], patch);
    syncJourneyAliases();
  }
  function journeyHistory(journey) {
    const runs = [...(journey.previous || []), ...(journey.days.length || journey.note ? [journey] : [])];
    if (!runs.length) return notice("还没有完成记录", "完成一步后，这里会保留日期、行动和当时写下的感受。");
    const total = runs.reduce((sum, run) => sum + run.days.length, 0);
    return `<details class="visual-disclosure journey-history"><summary><span class="record-glyph" aria-hidden="true">${domainIcon("time")}</span><div><strong>完成记录与历史</strong><small>${runs.length} 轮 · 累计记录 ${total} 次</small></div><i aria-hidden="true">＋</i></summary><div class="visual-disclosure-body">${runs.map((run, index) => `<section class="card"><h3>第 ${index + 1} 轮 · ${run.days.length} / 7 天</h3><p>${run === journey ? "本轮" : "历史轮次"} · ${({ active: "进行中", paused: "已暂停", deferred: "今天先放下", ended: "已结束", completed: "已完成" })[run.status] || "已保留"}</p>${run.endedAt ? `<p>结束于 ${esc(experienceTime(run.endedAt))}</p>` : ""}${run.entries?.length ? run.entries.map(entry => `<p><strong>${esc(entry.day)}</strong> · ${esc(entry.action)}${entry.note ? `<br>${esc(entry.note)}` : ""}</p>`).join("") : `<p>${esc(run.days.join("、") || "尚未完成练习")}</p>`}${run.note ? `<p>本轮感受：${esc(run.note)}</p>` : ""}</section>`).join("")}</div></details>`;
  }
  function journeyPage(item) {
    const journey = state.journeyRecords[state.journeyTheme];
    syncJourneyAliases();
    const doneToday = journey.days.includes(experienceDay());
    const step = currentJourneyStep();
    const themeTitle = state.journeyTheme === "pause" ? "白天留一个短暂停顿" : "晚上别把工作带上床";
    const themeChoices = segmented([["boundary", "睡前放下工作"], ["pause", "白天短暂停顿"]], state.journeyTheme, "journey-theme");
    if (journey.status === "deleted") return `${head(item, "JOURNEYS")}<div class="stack">${themeChoices}${notice("这个主题的记录已删除", "本主题的完成统计、感受和历史已清空，其他主题保留。", "sage")}${buttons([["开始这个主题的新计划", "journey-reset", "primary"], ["返回 Halo", "go:HAL-01", "secondary"]])}</div>`;
    const stopped = ["ended", "completed"].includes(journey.status);
    const titles = { active: state.journeyVariant > 0 ? "这一步已经变简单" : "每天只做一件小事", paused: "这个主题已暂停", deferred: "今天先放下，没关系", ended: "这个主题已结束", completed: "这个主题已经完成" };
    const descriptions = { active: "不追求连续打卡，做完今天这一小步就好。", paused: "完成记录保留，暂停期间不提醒。继续后从原进度接着做。", deferred: `${journey.reason || "今天先不做。"} 下次从更轻的一步开始。`, ended: "已停止本轮练习和提醒。完成统计与感受仍可回看，重新开始会建立新一轮。", completed: "你完成了 7 天练习，可以回看记录。重新开始时，本轮会保留在历史中。" };
    const actions = stopped ? [["重新开始这个主题", "journey-reset", "primary"]]
      : journey.status === "paused" ? [["继续这个主题", "journey-resume", "primary"]]
      : journey.status === "deferred" ? [["现在想做了", "journey-resume-today", "primary"], ["再换一个更容易的", "journey-replace", "secondary"]]
      : [[doneToday ? "今天已记下，明天再继续" : "完成今天这一小步", "journey-step", "primary", doneToday], ["换一个更容易的", "journey-replace", "secondary"], ["今天先不做", "journey-defer-open", "text-button"]];
    return `${head(item, "JOURNEYS")}<div class="stack">${themeChoices}${notice(titles[journey.status], descriptions[journey.status], "sage")}<section class="journey-summary-card"><div class="journey-summary-head"><span>本轮已记录 ${journey.days.length} / 7 天</span><small>${esc(themeTitle)}</small></div><h2>${esc(step.title)}</h2><p>${esc(step.action)}</p><div class="journey-progress-dots" aria-label="本轮已完成 ${journey.days.length} 天">${Array.from({ length: 7 }, (_, index) => `<i class="${index < journey.days.length ? "done" : !stopped && index === journey.days.length ? "current" : ""}"></i>`).join("")}</div></section>${!stopped ? `<label class="field-label">本轮感受（自动保存，可选）<textarea class="field" id="journey-note" placeholder="只记录你自己的感受">${esc(journey.note || "")}</textarea></label>` : ""}${buttons(actions)}${journeyHistory(journey)}<section class="card"><h3>管理这个主题</h3><p>暂停后可接着做；结束保留统计；删除清空本主题的当前记录和全部历史。</p>${buttons([...(stopped || journey.status === "paused" ? [] : [["暂停这个主题", "journey-pause", "secondary"]]), ...(stopped ? [] : [["结束并保留记录", "journey-end", "secondary"], ["这个主题不适合我", "journey-unsuitable", "text-button"]]), ["删除这个主题的全部记录", "journey-delete", "danger-button"]])}</section></div>`;
  }
  function nightReviewPage() { return nightReview.body(); }
  function healthDetail(item, config) {
    if (!isHardwareActive()) return unboundHealthDetail(item);
    const stage = state.dataLifecycle;
    const dataState = currentDataLifecycle(stage);
    const canInterpret = stage === "interpretable";
    const isCorrectedBodyWeather = item.id === "TOD-03" && canInterpret && state.aiCorrection.status === "saved";
    const conclusion = canInterpret ? (isCorrectedBodyWeather ? "今天先按你的真实感受来" : config.conclusion) : dataState.headline;
    const summary = canInterpret ? (isCorrectedBodyWeather ? `你说“${state.aiCorrection.reasonLabel}”。Halo 不再把原来的解读当作你的实际状态。` : config.summary) : dataState.summary;
    const why = canInterpret ? (isCorrectedBodyWeather ? `${config.why} 这些戒指记录保持不变，但不能替代你对当下状态的感受。` : config.why) : dataState.reason;
    const dataContent = canInterpret ? config.data : pendingHealthObservations(item.id);
    const trendContent = !canInterpret
      ? notice(stage === "limited" ? "本次比较暂缓" : "个人比较还未开放", `${dataState.needed}。${stage === "limited" ? "已有历史记录保留，不用缺失时段推测今天的变化。" : stage === "none" ? "目前没有可显示的测量记录；收到记录后先展示数值，再逐步建立个人范围。" : "已同步的数值可以查看，个人范围建立后再显示比较结论。"}`)
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
    return `${head(item, config.eyebrow)}<article class="unified-health-detail visual-health-detail" data-detail-page="${esc(item.id)}" data-copy-variant="${esc(copyVariant)}"><section class="detail-conclusion ${canInterpret ? "ready" : esc(stage)}" data-kind="${detailKind}"><i class="conclusion-glyph" aria-hidden="true">${detailGlyph}</i><span>${esc(isCorrectedBodyWeather ? "已根据你的反馈调整" : statusLabel)}</span><h2>${esc(conclusion)}</h2><p>${esc(summary)}</p></section>${correction}${detailSection(config.whyTitle || "为什么这么说", `<div class="insight-strip" data-kind="${detailKind}"><i aria-hidden="true">${detailGlyph}</i><p>${esc(why)}</p></div>${canInterpret ? config.reasonExtra || "" : ""}`)}${detailSection(config.dataTitle || "今天的几个重点", dataContent)}${canInterpret && config.educationExtra ? detailSection(config.educationTitle || "读懂这个指标", config.educationExtra, "education-section") : ""}${detailSection(config.trendTitle || "和你平时比", trendContent)}${detailSection("数据说明", `<details class="visual-disclosure"><summary><span class="data-symbol ${esc(stage)}" aria-hidden="true"><img src="${HALO_SYMBOL}" alt=""></span><div><strong>${esc(dataSummaryLabel)}</strong><small>${esc(sourceSummary)}</small></div><i aria-hidden="true">＋</i></summary><div class="visual-disclosure-body">${lifecycle(stage, config.lifecycleTitle, canInterpret ? config.lifecycleOverride : undefined)}${quality(config.source, config.quality, config.updated)}<p class="source-priority">Halo Ring 是主要来源；其他来源会单独标明，同一时段不会重复计算。</p></div></details>`)}${detailSection("记下你的感受", `<details class="visual-disclosure user-record-disclosure"><summary><span class="record-glyph" aria-hidden="true">＋</span><div><strong>补充今天的感受</strong><small>${state.subjectiveMarkers.length ? `已有 ${state.subjectiveMarkers.length} 条用户记录` : "保存为用户记录，不会改写戒指数据"}</small></div><i aria-hidden="true">＋</i></summary><div class="visual-disclosure-body">${subjectiveMarkers()}</div></details>`, "subjective-section")}${detailSection(config.actionSectionTitle || "今天可以怎么做", `${notice(canInterpret ? config.actionTitle : dataState.next, canInterpret ? config.actionBody : dataState.needed, "sage")}${buttons(currentActions)}`, "detail-action")}</article><p class="health-boundary">用于日常健康管理，不替代医疗诊断。</p>`;
  }
  function unboundHealthDetail(item) {
    const copy = membershipCopy();
    const retained = state.membershipHardwareState === "unbound-retained";
    return `${head(item, "MEMBER MODE")}<article class="unified-health-detail unbound-detail"><section class="detail-conclusion unbound"><span>${esc(copy.label)}</span><h2>这里还没有身体数据</h2><p>没有足够记录时，Halo 不会猜你的身体状态。</p></section>${detailSection("还差什么", `<p>${retained ? "目前没有已激活的 Halo Ring。以前的会员资产和用户记录还在；重新绑定后，才会继续记录新的身体数据和成长。" : "你已经是 Halo Member。绑定并激活 Halo Ring 后，戴着它完成夜间记录，才会开始生成 Body Weather。"}</p>`)}${detailSection("你记下的感受", retainedUserRecords(), "retained-user-records")}${detailSection("现在可以用", `<ul class="availability-list"><li>会员、Halo Points、Halo Select、订单、推荐和客服</li><li>每天 10 条不读取身体数据的 Halo 对话</li><li>手动记录节律、情绪和睡眠感受</li><li>浏览和预约 Studio，播放 3 项基础睡前内容</li></ul>`)}${detailSection("绑定戒指后会多什么", `<ul class="availability-list"><li>Body Weather 和健康数据详情</li><li>根据身体状态推荐的夜间内容</li><li>7 / 14 / 30 天趋势与身体报告</li><li>会员成长任务、徽章和升级</li></ul>`)}${detailSection("现在先做什么", buttons([[retained ? "重新绑定 Halo Ring" : "绑定 Halo Ring", "go:DEV-01", "primary"], ["先听基础睡前内容", "go:NIG-01", "secondary"]]), "detail-action")}</article>`;
  }
  function unboundToday(item) {
    return todayWeatherHome(item);
  }
  function unboundNight(item) {
    return `${head(item, "PUBLIC NIGHT")}<div class="night-screen"><section class="night-hero"><span>HALO MEMBER</span><h2>今晚先选一段喜欢的</h2><p>三项公共内容，不读取身体数据。</p></section><div class="stack public-night-list">${state.nightSession && state.nightSession.status !== "ended" ? setting(state.nightSession.title, state.nightSession.status === "playing" ? "继续查看播放" : "已暂停 · 继续播放", "go:NIG-04") : ""}${setting("5 分钟睡前呼吸", "5 分钟 · 手动播放", "public-play:breath")}${setting("10 分钟身体扫描", "10 分钟 · 手动播放", "public-play:scan")}${setting("15 分钟安睡音频", "15 分钟 · 手动播放", "public-play:sound")}${setting("播放历史", "回看自己的播放与复盘记录", "go:NIG-10")}${notice("无需设备也可使用", "这些公共内容不生成身体结论，不奖励成长、积分或徽章。本地原型只演示播放操作，不输出真实音频。")}</div></div>`;
  }
  function dailyInspirationCard() {
    if (!state.toggles.inspiration) return "";
    return `<section class="daily-inspiration today-inspiration"><div class="inspiration-heading"><div><h3>今日灵感 <span class="today-keyword">${esc(DAILY_INSPIRATION.keyword)}</span></h3><small>生活灵感 · 仅供参考</small></div><button class="inspiration-info" data-action="info:inspiration" aria-label="了解今日灵感">i</button></div><div class="daily-cues"><div class="daily-cue"><span class="cue-swatch" aria-hidden="true"></span><span class="daily-cue-copy"><small>幸运色</small><strong>${esc(DAILY_INSPIRATION.color)}</strong></span></div><div class="daily-cue"><span class="cue-number">${esc(DAILY_INSPIRATION.number)}</span><span class="daily-cue-copy"><small>今日数字</small><strong>保持简单</strong></span></div><button class="daily-cue daily-cue-button outfit-cue" data-action="open-outfit-inspiration" aria-label="查看今日旺运穿衣：${esc(DAILY_INSPIRATION.outfitColor)}"><span class="cue-palette" aria-hidden="true"><i style="--offset:0px;--swatch:#d6b84c"></i><i style="--offset:8px;--swatch:#8a6548"></i><i style="--offset:16px;--swatch:#5f4638"></i><i style="--offset:24px;--swatch:#b69b72"></i></span><span class="daily-cue-copy"><small>旺运穿衣</small><strong>${esc(DAILY_INSPIRATION.outfitColor)}</strong></span><span class="cue-chevron" aria-hidden="true">›</span></button></div><details class="today-inspiration-more"><summary><span>展开今日灵感</span><span>收起今日灵感</span><i aria-hidden="true">＋</i></summary><div><p>${esc(DAILY_INSPIRATION.message)}</p><div class="inspiration-action"><small>试试这件小事</small><strong>${esc(DAILY_INSPIRATION.action)}</strong></div><button class="inspiration-link" data-action="open-inspiration">和 Halo 聊聊这份灵感 <span>›</span></button><small class="inspiration-disclaimer">不预测结果，不读取或解释健康数据。</small></div></details></section>`;
  }
  function haloContextPanel() {
    const compact = state.chat.length > 0;
    const correction = activeWeatherCorrection();
    const source = currentHaloSource();
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
    if (source?.kind === "correction" && correction) {
      const pill = `<button class="context-pill" data-action="switch-halo-context:body">参考：你对今天解释的纠正　×</button>`;
      return reveal(pill, `${notice("先听听你的感受", `你反馈“${correction.reasonLabel}”。这是你主动补充的感受，不是戒指测得的结果。`, "sage")}<div class="suggestions"><button data-action="ask:按我的真实感受重新安排今天">按我的真实感受重新安排今天</button><button data-action="ask:这次纠正会怎么保存？">这次纠正会怎么保存？</button><button data-action="go:HAL-03">查看 Halo 记忆</button></div>`);
    }
    if (!hasBodyContext() || state.haloContext === "none" || (state.haloContext === "correction" && !source)) {
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
    // Legacy simulated sessions have no restorable device request; retain their saved results only.
    if (state.measurementType !== "oxygen" && state.measurementStatus === "running") state.measurementStatus = "failed";
    state.feedbackDraft = { type: "设备连接", text: "", ...(state.feedbackDraft || {}) };
    state.feedbackTickets = Array.isArray(state.feedbackTickets) ? state.feedbackTickets : [];
  }
  const ACCOUNT_MEASUREMENT_TYPES = {
    heart: { label: "心率与 HRV", metrics: [["心率", "71", "次/分"], ["HRV", "44", "ms"]], summary: "心率 71 次/分 · HRV 44 ms" },
    oxygen: { label: "血氧", metrics: [["血氧", "98", "%"]], summary: "血氧 98%" },
    temperature: { label: "皮肤温度", metrics: [["皮肤温度相对变化", "+0.2", "℃"]], summary: "皮肤温度相对变化 +0.2℃" },
  };
  function accountRouteGuard(id) {
    if (id === "DEV-05" && deviceBinding.unresolved()) return "DEV-03";
    if (["DEV-11", "DEV-12"].includes(id) && !isHardwareActive() && !(id === "DEV-12" && deviceMaintenance?.canView())) return "DEV-10";
    if (id === "DEV-05" && !state.devicePaired && !isHardwareActive()) return "DEV-03";
    if (id === "HLT-04" && (state.measurementType !== "oxygen" || !oxygenMeasurement?.request() || measurementPrivacyBlocked())) return "HLT-03";
    return id;
  }
  function handleAccountInput(target) {
    if (feedbackEditor?.input({ target })) return true;
    return false;
  }
  function handleAccountToggle(key) {
    if (state.current === "PERM-01" && ["bluetooth", "notification", "healthAccess"].includes(key)) return true;
    if (!["bluetooth", "notification"].includes(key)) return false;
    state.toggles[key] = !state.toggles[key];
    if (key === "bluetooth") state.connectionIntro.permission = state.toggles.bluetooth ? "granted" : "bluetooth-off";
    if (key === "bluetooth" && !state.toggles.bluetooth) {
      state.deviceStatus = "disconnected";
      if (state.measurementStatus === "running") state.measurementStatus = "failed";
      if (["downloading", "verifying"].includes(state.firmwareStatus)) state.firmwareStatus = "failed";
    }
    return true;
  }
  let permissionIntent = null, permissionFeedback = "", permissionCheckFails = false;
  function bluetoothPermissionLabel() {
    const value = state.connectionIntro.permission;
    if (value === "not-requested") return "尚未允许";
    if (value === "denied") return "未允许";
    if (value === "bluetooth-off" || value === "granted" && !state.toggles.bluetooth) return "手机蓝牙已关闭";
    return value === "granted" ? "已允许" : "状态待确认";
  }
  function permissionPage() {
    const row = (kind, title, status, copy, note, path) => `<section class="permission-item"><div class="permission-item-heading"><span class="permission-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="${path}"/></svg></span><div><h2>${title}</h2><span class="permission-state" data-ready="${status === "已允许"}">${status}</span></div><button type="button" class="permission-manage" data-action="perm:open:${kind}" aria-label="${title}：${status === "尚未允许" ? "开启" : "管理"}">${status === "尚未允许" ? "开启" : "管理"}</button></div><p>${copy}</p><small>${note}</small></section>`;
    return `<section class="permission-page"><header class="permission-header"><button type="button" data-action="permission-skip" aria-label="返回上一页">←</button><h1>系统权限</h1><span></span></header><p class="permission-intro">按需要开启，随时可以调整。</p>${permissionFeedback ? `<p class="permission-feedback" role="status">${esc(permissionFeedback)}</p>` : ""}${row("bluetooth", "蓝牙与附近设备", bluetoothPermissionLabel(), "查找 Halo Ring，并同步戒指里的记录。", bluetoothPermissionLabel() === "已允许" ? "允许访问不代表戒指已连接。" : "暂不开启，也能查看已保存的记录。", "m7 7 10 10-5 4V3l5 4L7 17")}${row("notification", "通知", state.toggles.notification ? "已允许" : "未允许", "接收你选择的睡前、设备和报告提醒。", "关闭通知不会删除已设置的提醒。", "M6 9a6 6 0 0 1 12 0v6l2 3H4l2-3V9m4 12h4")}${systemHealth.card()}<p class="permission-note">位置等可选权限，会在使用对应功能时单独说明。</p><button type="button" class="primary permission-done" data-action="permission-skip">完成，返回上一页</button></section>`;
  }
  function openPermissionEditor(kind) {
    if (!["bluetooth", "notification"].includes(kind) || state.current !== "PERM-01" || !state.signedIn || !state.authVerified) return;
    if (kind === "bluetooth" && state.connectionIntro.request?.status === "checking") return showInfoModal("蓝牙检查还在进行", "请等这次检查结束后，再调整蓝牙权限。", "返回");
    permissionIntent = { kind, account: state.authPhone };
    permissionFeedback = "";
    const bt = kind === "bluetooth", off = bt && bluetoothPermissionLabel() === "手机蓝牙已关闭";
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal permission-system-modal" role="dialog" aria-modal="true" aria-labelledby="permission-modal-title"><header><span>系统设置 · 原型演示</span><button type="button" class="text-button" data-action="close-modal" aria-label="取消权限设置">取消</button></header><h2 id="permission-modal-title">${bt ? "Halo 的蓝牙访问" : "Halo 的通知权限"}</h2><p>${bt ? "允许后，可以查找附近的戒指并同步记录。" : "允许后，可以接收你选择的提醒。提醒内容仍在 App 内设置。"}${off ? " 手机蓝牙目前已关闭，需要同时开启。" : ""}</p><p class="permission-demo-note">这里只演示系统返回结果，不会更改手机设置。</p><p class="permission-dialog-error" role="alert"></p><div class="permission-dialog-actions"><button type="button" class="primary" data-action="perm:result:granted">${off ? "允许并开启蓝牙" : "允许"}</button><button type="button" class="secondary" data-action="perm:result:denied">不允许</button></div></section></div>`;
  }
  function handlePermissionAction(action) {
    if (!action?.startsWith("perm:")) return false;
    if (state.current !== "PERM-01" || !state.signedIn || !state.authVerified || state.accountDeletionStatus === "submitted") return true;
    if (action.startsWith("perm:open:")) { openPermissionEditor(action.slice(10)); return true; }
    if (action.startsWith("perm:review:")) { permissionCheckFails = action.endsWith(":failed"); render(); return true; }
    if (!action.startsWith("perm:result:")) return true;
    const intent = permissionIntent, modal = modalRoot.querySelector(".permission-system-modal");
    if (!intent || !modal || intent.account !== state.authPhone || !["granted", "denied"].includes(action.slice(12))) return true;
    const fail = message => { modal.querySelector(".permission-dialog-error").textContent = message; };
    if (permissionCheckFails) { fail("暂时无法确认设置结果，原状态未更新。请稍后重试。"); return true; }
    if (intent.kind === "bluetooth" && state.connectionIntro.request?.status === "checking") { fail("蓝牙检查仍在进行，请结束后再试。"); return true; }
    const granted = action.endsWith(":granted"), changes = { toggles: { ...state.toggles, [intent.kind]: granted } };
    if (intent.kind === "bluetooth") {
      changes.connectionIntro = { ...state.connectionIntro, permission: granted ? "granted" : "denied" };
      if (!granted) {
        changes.deviceStatus = "disconnected";
        if (state.measurementStatus === "running") changes.measurementStatus = "failed";
        if (["downloading", "verifying"].includes(state.firmwareStatus)) changes.firmwareStatus = "failed";
      }
    }
    if (!writeNotificationProgress(changes)) { fail("这次设置未能保存，原状态未更新。请重试。"); return true; }
    permissionFeedback = `${intent.kind === "bluetooth" ? "蓝牙访问" : "通知"}${granted ? "已允许" : "未允许"}${intent.kind === "bluetooth" && granted ? "，可返回继续连接。" : "。"}`;
    render(); closeModal(); return true;
  }
  function deviceOperationUnavailable(operation) {
    if (deviceMaintenance?.blocks()) return "请先确认这次设备操作的结果";
    if (initialSync?.isBusy()) return "首次设置正在进行，请稍后再试";
    if (deviceInfo?.isBusy() || operation !== "firmware" && deviceInfo?.unresolved()) return "请先确认固件更新结果，再进行设备操作";
    if (deviceHome?.isBusy()) return "戒指正在连接或同步，请等待本次操作完成";
    if (state.activitySync.request?.status === "pending") return "活动记录正在同步，请等待本次操作完成";
    if (deviceBinding.unresolved()) return "请先确认这次戒指连接的结果";
    if (!isHardwareActive()) return "请先绑定并激活戒指";
    if (!state.toggles.bluetooth) return "请先开启蓝牙权限";
    if (!["connected", "low"].includes(state.deviceStatus)) return state.deviceStatus === "syncing" ? "同步完成后再试" : "请先连接戒指";
    if (state.deviceResetStatus === "pending") return "设备重置尚未完成";
    if (state.measurementStatus === "running" && !(operation === "oxygen-continuation" && state.measurementType === "oxygen" && oxygenMeasurement?.request())) return "请先结束当前测量";
    if (operation !== "firmware" && ["downloading", "verifying"].includes(state.firmwareStatus)) return "固件更新完成后再试";
    if (operation === "firmware" && state.deviceStatus === "low") return "请先充电，再更新固件";
    return "";
  }
  function oxygenMeasurementUnavailable(continuing = false) {
    if (measurementPrivacyBlocked()) return "测量记录正在处理，请到数据与隐私查看状态";
    if (!state.signedIn || !state.authVerified || state.accountDeletionStatus === "submitted") return "请先登录当前账号";
    if (state.oxygenReviewScenario === "unknown") return "暂时无法确认这款戒指是否支持主动测血氧";
    if (!["supported", "off", "quality"].includes(state.oxygenReviewScenario)) return "当前戒指不支持主动测血氧";
    if (Object.values(state.dataPrivacy?.accounts || {}).some(account => account.request?.status === "pending" && account.request.scope?.includes("measurement"))) return "正在处理测量记录，请稍后再试";
    return deviceOperationUnavailable(continuing ? "oxygen-continuation" : "measurement");
  }
  function oxygenSaveUnavailable() {
    if (measurementPrivacyBlocked()) return "测量记录正在处理，请到数据与隐私查看状态";
    if (!state.signedIn || !state.authVerified || state.accountDeletionStatus === "submitted") return "请先登录取得这次结果的账号";
    if (Object.values(state.dataPrivacy?.accounts || {}).some(account => account.request?.status === "pending" && account.request.scope?.includes("measurement"))) return "正在处理测量记录，请稍后保存";
    return "";
  }
  function measurementPrivacyBlocked() {
    const account = String(state.authPhone || state.authForm?.phone || "prototype-session");
    const request = state.dataPrivacy?.accounts?.[account]?.request;
    return !state.signedIn || !state.authVerified || state.healthDeletionStatus !== "ready" || state.accountDeletionStatus !== "ready" || Boolean(request?.status === "pending" && request.scope?.includes("measurement"));
  }
  function measurementUnavailable(type = state.measurementType) { return type === "oxygen" ? oxygenMeasurementUnavailable() : "这项主动测量能力待确认，暂不能开始。"; }
  function allMeasurementRecords() {
    if (!state.signedIn || !state.authVerified) return [];
    const account = String(state.authPhone || state.authForm?.phone || "prototype-session");
    const valid = record => {
      const time = Date.parse(record?.occurredAt || record?.completedAt);
      return record && Number.isFinite(time) && time <= Date.now() &&
        String(record.ownerAccount || record.accountRef || "") === account &&
        (!record.ownerAccount || record.ownerAccount === account) && (!record.accountRef || record.accountRef === account) &&
        record.quality !== "invalid" && record.status !== "failed";
    };
    const records = (oxygenMeasurement?.records() || []).filter(valid);
    const old = state.lastMeasurement;
    const imported = records.some(record => record.requestId === old?.requestId || old?.id && record.id === old.id || old?.type === "oxygen" && Date.parse(record.occurredAt) === Date.parse(old.occurredAt || old.completedAt));
    if (valid(old) && Object.hasOwn(ACCOUNT_MEASUREMENT_TYPES, old.type) && !imported && Array.isArray(old.metrics) && old.metrics.length) {
      records.push({ ...old, id: String(old.id || `legacy-${old.type}-${Date.parse(old.occurredAt || old.completedAt)}`), legacy: true });
    }
    return records.sort((a, b) => Date.parse(a.occurredAt || a.completedAt) - Date.parse(b.occurredAt || b.completedAt));
  }
  function renderMeasurementStart(item) { return measurementCenter.page(); }
  function renderMeasurementResult(item) {
    if (state.measurementType === "oxygen") return oxygenMeasurement.page(item);
    const measurement = ACCOUNT_MEASUREMENT_TYPES[state.measurementType] || ACCOUNT_MEASUREMENT_TYPES.heart;
    if (state.measurementStatus === "failed") return `${head(item, "MEASUREMENT")}<div class="stack">${notice("本次没有获得可用数据", "连接中断或佩戴不稳，本次不会保存。请确认蓝牙和佩戴后重新测量。", "warm")}${buttons([["重新测量", "measurement-reset", "primary"], ["返回主动测量", "go:HLT-03", "secondary"]])}</div>`;
    if (state.measurementStatus === "complete") return `${head(item, "MEASUREMENT")}<div class="stack">${notice(`${measurement.label}测量完成`, "以下为原型演示结果，已保存在当前浏览器，不是实际设备采集。", "sage")}${metrics(measurement.metrics)}${quality(`本次${measurement.label}主动测量`, "演示记录", state.lastMeasurement ? new Date(state.lastMeasurement.completedAt).toLocaleString("zh-CN") : "未保存")}${notice("怎样看这次结果", "单次主动测量只反映当下，不用于诊断，也不会单独改变今天的 Body Weather。")}${buttons([["完成", "go:HLT-03", "primary"], ["重新测量", "measurement-reset", "secondary"]])}</div>`;
    return `${head(item, "MEASURING")}<div class="gated measuring-state"><span class="data-symbol accumulating" aria-hidden="true"><img src="${HALO_SYMBOL}" alt=""></span><h2>正在测量${measurement.label}</h2><p class="caption">原型演示 · 离开后可返回继续</p></div>${buttons([["完成演示测量", "measure-complete", "primary"], ["取消测量", "measurement-cancel", "text-button"]])}`;
  }
  function legalReadingView() {
    const view = history.state?.legalReading;
    return view && view.route === state.current && pages.some(item => item.id === view.route) && ["agreement", "privacy", "ai"].includes(view.kind) ? view : null;
  }
  function showLegalReading(kind, restoring = false) {
    const content = {
      agreement: ["用户协议 · 原型摘要", [["账号与会员", "注册并确认必需说明后成为 Halo Member。未绑定也可使用公开内容、用户记录及会员服务；绑定激活后才开始未来成长。"], ["服务边界", "健康功能不按会员等级锁定。Halo 不提供医疗诊断，不处理急症；具体能力取决于设备支持和有效数据。"], ["资产与退出", "合法获得的会员资产不会因正常不活跃或解绑被收回。账号注销前可查看将失效资产，订单与售后仍可继续处理。"], ["规则与联系", "核心规则变化提前公示，只影响生效后的行为。对记录有疑问可从帮助中心联系企业微信客服。"]]],
      privacy: ["隐私政策 · 原型摘要", [["收集与用途", "设备记录、手动记录与 Halo 解释分别标记来源。只有相关功能所需的信息才用于该功能。"], ["权限选择", "蓝牙用于连接与同步；通知用于提醒。位置、系统健康数据和 Studio 分享分别控制，拒绝可选权限不影响其他服务。"], ["管理与删除", "在“我的—数据与隐私”查看权限、导出和删除入口。Halo 记忆与节律数据可单独管理。法定留存记录停止用于运营与个性化。"], ["当前原型", "本地输入保存在当前浏览器。本地导出未加密；安全链接、云端删除和身份验证尚未接入真实服务。"]]],
      ai: ["AI 服务说明 · 原型摘要", [["建议不是诊断", "Halo 提供日常健康管理参考，不开处方，也不能代替医生。若感到明显不适，请及时寻求现实中的专业帮助。"], ["以你的感受为准", "设备数值、用户记录和 AI 推断不同。可以指出不准确的解释；一次反馈不会自动成为长期事实。"], ["对话与记忆", "可以停止身体数据带入、暂停主动消息，并管理已确认记忆。关闭某项能力不等于删除历史记录。"], ["演示边界", "当前原型对话用于演示交互，不代表真实模型能力或医疗判断。"]]],
    }[kind];
    if (!content) return;
    if (!pages.some(item => item.id === state.current)) return;
    const view = restoring ? legalReadingView() : { kind, route: state.current, top: 0 };
    if (!view) return;
    if (!restoring) history.pushState({ ...history.state, legalReading: view }, "", location.href);
    modalReturnFocus = screen.querySelector(`[data-action="legal-read:${kind}"]`);
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal legal-reading-modal" role="dialog" aria-modal="true" aria-labelledby="legal-reading-title"><header class="legal-reading-header"><div><h2 id="legal-reading-title">${esc(content[0].split(" · ")[0])}</h2><p>原型摘要 · 非正式法律文本</p></div><button type="button" class="text-button" data-action="close-modal" aria-label="关闭${esc(content[0].split(" · ")[0])}">关闭</button></header><div class="legal-reading-body" tabindex="0" aria-label="说明正文">${content[1].map(([title, body]) => `<section><h3>${esc(title)}</h3><p>${esc(body)}</p></section>`).join("")}</div><footer class="legal-reading-footer"><button type="button" class="primary" data-action="close-modal">${state.current === "AUTH-01" ? "返回登录" : "返回说明列表"}</button></footer></section></div>`;
    const body = modalRoot.querySelector(".legal-reading-body");
    body.scrollTop = Math.max(0, Number(view.top) || 0);
    body.addEventListener("scroll", () => {
      if (legalReadingView()?.kind === kind) history.replaceState({ ...history.state, legalReading: { ...view, top: body.scrollTop } }, "", location.href);
    }, { passive: true });
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
  function nextId(id) { const visible = pages.filter(item => item.id !== "TOD-04"), index = visible.findIndex(item => item.id === id); return `go:${visible[Math.min(index + 1, visible.length - 1)]?.id || id}`; }
  function previousId(id) { const visible = pages.filter(item => item.id !== "TOD-04"), index = visible.findIndex(item => item.id === id); return visible[Math.max(0, index - 1)]?.id || id; }

  function normalizedAuthPhone(value = state.authForm.phone) {
    const digits = String(value).replace(/\D/g, "");
    return digits.length === 13 && digits.startsWith("86") ? digits.slice(2) : digits;
  }
  function authUiState() {
    const phone = normalizedAuthPhone();
    const valid = /^1\d{10}$/.test(phone);
    const request = state.authForm.request;
    const sending = request?.status === "sending";
    const verifying = state.authForm.login?.status === "verifying";
    const busy = sending || verifying;
    const sent = request?.status === "sent" && request.phone === phone && state.authCodeRequested;
    const expired = sent && Date.now() >= request.expiresAt;
    const locked = sent && request.attempts >= 5;
    const seconds = Math.max(0, Math.ceil(((Number(state.authForm.cooldownUntil) || 0) - Date.now()) / 1000));
    const phoneError = state.authForm.touched && !valid ? "请输入正确的 11 位中国大陆手机号" : "";
    const codeError = expired ? "验证码已过期，请重新获取。" : locked ? "尝试次数较多，请重新获取验证码。" : state.authForm.codeError;
    const codeHint = codeError || state.authForm.error || (sending ? "正在发送验证码…" : sent ? `验证码已发送至 ${phone.replace(/^(\d{3})\d{4}(\d{4})$/, "$1 **** $2")}` : "");
    const hint = busy ? "" : !valid ? "填写手机号、验证码并勾选协议后可登录" : !state.authForm.termsAccepted ? "请先阅读并勾选协议" : expired || locked || codeError || state.authForm.error ? "" : !sent ? "" : !/^\d{6}$/.test(state.authForm.code) ? "填写 6 位验证码后可登录" : "";
    const sendLabel = sending ? "发送中…" : seconds ? `${seconds}s 后重发` : request ? "重新获取" : "获取验证码";
    return { phone, valid, sending, verifying, busy, sent, expired, locked, seconds, phoneError, codeError, codeHint, hint, sendLabel,
      sendDisabled: busy || !valid || !state.authForm.termsAccepted || seconds > 0,
      disabled: busy || !valid || !state.authForm.termsAccepted || !sent || expired || locked || !/^\d{6}$/.test(state.authForm.code) };
  }
  function authLoginPage() {
    const ui = authUiState();
    return `<section class="auth-page" aria-labelledby="auth-title">
      <header class="auth-header"><button class="auth-back" data-action="previous" aria-label="返回"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5-7 7 7 7"/></svg></button><h1 id="auth-title">手机号登录</h1></header>
      <form id="auth-login-form" class="auth-login-form" novalidate aria-busy="${ui.busy}">
        <div class="auth-fields">
          <div class="auth-phone-section"><label for="auth-phone" class="sr-only">手机号</label><div class="auth-phone-control ${ui.phoneError ? "invalid" : ""}"><span class="auth-phone-prefix" aria-label="中国大陆，区号加八六">+86</span><input id="auth-phone" class="auth-phone-input" type="tel" inputmode="numeric" autocomplete="tel-national" enterkeyhint="next" maxlength="24" placeholder="请输入手机号" value="${esc(state.authForm.phone)}" aria-describedby="auth-phone-error" aria-invalid="${Boolean(ui.phoneError)}" ${ui.busy ? "disabled" : ""}></div><p id="auth-phone-error" class="auth-phone-error" aria-live="polite">${esc(ui.phoneError)}</p></div>
          <div class="auth-code-section"><label for="auth-code" class="sr-only">验证码</label><div class="auth-code-control ${ui.codeError ? "invalid" : ""}"><input id="auth-code" class="auth-code-input" type="text" inputmode="numeric" autocomplete="one-time-code" enterkeyhint="go" maxlength="6" placeholder="请输入验证码" value="${esc(state.authForm.code)}" aria-describedby="auth-code-hint" aria-invalid="${Boolean(ui.codeError)}" ${ui.busy ? "disabled" : ""}><button id="auth-send" class="auth-send" type="button" data-action="auth-code-requested" aria-describedby="auth-action-hint auth-code-hint" ${ui.sendDisabled ? "disabled" : ""}>${ui.sendLabel}</button></div><p id="auth-code-hint" class="auth-code-hint ${ui.codeError || state.authForm.error ? "error" : ""}" aria-live="polite">${esc(ui.codeHint)}</p></div>
        </div>
        <div class="auth-actions">
          <div class="auth-consent"><label class="auth-consent-toggle"><input id="auth-terms" type="checkbox" ${state.authForm.termsAccepted ? "checked" : ""} ${ui.busy ? "disabled" : ""}><span class="sr-only">我已阅读并同意用户协议、隐私政策和 AI 服务说明</span></label><div class="auth-consent-copy"><span>我已阅读并同意</span><div><button type="button" data-action="legal-read:agreement" ${ui.busy ? "disabled" : ""}>《用户协议》</button><button type="button" data-action="legal-read:privacy" ${ui.busy ? "disabled" : ""}>《隐私政策》</button><button type="button" data-action="legal-read:ai" ${ui.busy ? "disabled" : ""}>《AI 服务说明》</button></div></div></div>
          <button id="auth-submit" class="primary auth-submit" type="submit" aria-describedby="auth-action-hint auth-code-hint" ${ui.disabled ? "disabled" : ""}>${ui.verifying ? "登录中…" : "登录"}</button>
          <p id="auth-action-hint" class="auth-action-hint" aria-live="polite">${esc(ui.hint)}</p>
          <p class="auth-registration-note">${state.authReturnRoute === "SEL-03" ? "登录后回到商品；首次登录自动创建账号。" : "首次登录将自动创建账号。"}</p>
        </div>
      </form>
    </section>`;
  }
  function updateAuthControls() {
    if (state.current !== "AUTH-01") return;
    const ui = authUiState();
    const input = document.getElementById("auth-phone");
    const button = document.getElementById("auth-submit");
    if (!input || !button) return;
    input.setAttribute("aria-invalid", String(Boolean(ui.phoneError)));
    input.closest(".auth-phone-control").classList.toggle("invalid", Boolean(ui.phoneError));
    document.getElementById("auth-phone-error").textContent = ui.phoneError;
    const code = document.getElementById("auth-code");
    if (code.value !== state.authForm.code) code.value = state.authForm.code;
    code.setAttribute("aria-invalid", String(Boolean(ui.codeError)));
    code.closest(".auth-code-control").classList.toggle("invalid", Boolean(ui.codeError));
    const codeHint = document.getElementById("auth-code-hint");
    if (codeHint.textContent !== ui.codeHint) codeHint.textContent = ui.codeHint;
    codeHint.classList.toggle("error", Boolean(ui.codeError || state.authForm.error));
    const send = document.getElementById("auth-send");
    send.disabled = ui.sendDisabled;
    send.textContent = ui.sendLabel;
    button.disabled = ui.disabled;
    button.textContent = ui.verifying ? "登录中…" : "登录";
    for (const field of [input, code, document.getElementById("auth-terms")]) field.disabled = ui.busy;
    document.getElementById("auth-login-form").setAttribute("aria-busy", String(ui.busy));
    const hint = document.getElementById("auth-action-hint");
    if (hint.textContent !== ui.hint) hint.textContent = ui.hint;
  }
  function invalidateAuthRequest() {
    if (authRequestTimer) clearTimeout(authRequestTimer);
    authRequestTimer = null;
    state.authForm.request = null;
    state.authForm.login = null;
    state.authForm.code = "";
    state.authForm.error = "";
    state.authForm.codeError = "";
    state.authCodeRequested = false;
    state.authVerified = false;
  }
  function finishAuthLogin(login, request) {
    if (state.authForm.login !== login || state.authForm.request !== request || login?.status !== "verifying" || request?.status !== "sent" || login.requestId !== request.id) return;
    const reason = !state.authForm.termsAccepted || normalizedAuthPhone() !== request.phone ? "changed" : Date.now() >= request.expiresAt ? "expired" : login.outcome === "offline" ? "offline" : state.authForm.code !== request.demoCode ? "wrong" : "";
    if (reason) {
      login.status = "failed";
      if (reason === "wrong") request.attempts += 1;
      request.demoCode = AUTH_DEMO_CODE;
      state.authForm.codeError = { changed: "手机号或协议状态已变更，请重新获取验证码。", expired: "验证码已过期，请重新获取。", offline: "暂时无法登录，请检查网络后再点登录。", wrong: "验证码不正确，请核对后重试。" }[reason];
      trackPrototypeEvent("auth_login_failed", { attempt_id: login.id, reason, simulated: true });
    } else {
      const knownAccount = Object.prototype.hasOwnProperty.call(state.todayRhythmScope?.registrations || {}, request.phone);
      const firstLogin = !knownAccount && !state.signedIn && state.membershipHardwareState === "never-bound" && !state.memberCreatedAt;
      const beforeLogin = JSON.parse(JSON.stringify(state));
      window.HaloAccountScope.select(state, request.phone);
      if (firstLogin) { state.newMember = true; state.memberCreatedAt = new Date().toISOString(); state.dataLifecycle = "none"; }
      todayRhythmStorage?.select(request.phone, firstLogin ? state.memberCreatedAt : "");
      state.memberCreatedAt = state.todayRhythmScope.registrations[request.phone] || "";
      state.todayRhythmScope.memberCreatedAtSnapshot = state.memberCreatedAt;
      personalScope?.select(request.phone, state.todayRhythmScope.activeKey);
      login.status = "complete";
      login.destination = state.authReturnRoute === "SEL-03" ? "SEL-03" : state.connectionIntro.completed ? "TOD-01" : "ONB-03";
      state.authReturnRoute = "";
      request.status = "used";
      request.demoCode = "";
      state.authForm.code = "";
      state.authForm.codeError = "";
      state.authCodeRequested = false;
      state.authVerified = true;
      state.authPhone = request.phone;
      state.toggles.legal = true;
      state.toggles.aiLegal = true;
      state.agreementAcceptance = { source: "AUTH-01", scope: AUTH_CONSENT_SCOPE, acceptedAt: new Date().toISOString(), documents: ["user_agreement", "privacy_policy", "ai_service_notice"], simulated: true };
      state.signedIn = true;
      if (!writeNotificationProgress({})) {
        Object.assign(state, beforeLogin);
        todayRhythmStorage?.cancelSwitch();
        personalScope?.cancelSwitch();
        state.authForm.login.status = "failed";
        state.authForm.codeError = "登录状态没能保存，请重试。原账号的记录没有改变。";
        if (state.current === "AUTH-01") render();
        return;
      }
      todayRhythmStorage?.refreshRecords();
      trackPrototypeEvent("required_agreements_accepted", { source_page: "AUTH-01", consent_scope: AUTH_CONSENT_SCOPE, user_agreement: true, privacy_policy: true, ai_service_notice: true, accepted_at: state.agreementAcceptance.acceptedAt, simulated: true });
      trackPrototypeEvent("auth_login_completed", { attempt_id: login.id, new_account: firstLogin, user_agreement: true, privacy_policy: true, ai_service_notice: true, simulated: true });
    }
    persistAppProgress();
    if (state.current === "AUTH-01") {
      if (login.status === "complete") { go(login.destination); flash("登录成功"); }
      else render();
    }
  }
  function resumeAuthRequest() {
    if (authRequestTimer) clearTimeout(authRequestTimer);
    authRequestTimer = null;
    const request = state.authForm.request;
    const login = state.authForm.login;
    if (login?.status === "verifying" && request?.status === "sent") {
      authRequestTimer = setTimeout(() => { authRequestTimer = null; if (state.authForm.login?.id === login.id && state.authForm.request?.id === login.requestId) finishAuthLogin(login, request); }, Math.max(0, login.readyAt - Date.now()));
      return;
    }
    if (request?.status !== "sending") {
      if (state.current === "AUTH-01" && (state.authForm.cooldownUntil > Date.now() || request?.status === "sent" && request.expiresAt > Date.now())) {
        authRequestTimer = setTimeout(() => { authRequestTimer = null; updateAuthControls(); resumeAuthRequest(); }, 1000);
      }
      return;
    }
    authRequestTimer = setTimeout(() => {
      authRequestTimer = null;
      if (state.authForm.request?.id !== request.id || state.authForm.request.status !== "sending") return;
      if (!state.authForm.termsAccepted || request.phone !== normalizedAuthPhone()) {
        invalidateAuthRequest();
        persistAppProgress();
        if (state.current === "AUTH-01") render();
        return;
      }
      if (request.outcome !== "success") {
        request.status = "failed";
        state.authForm.error = request.outcome === "limited" ? "获取次数较多，请稍后再试。" : "连接失败，请检查网络后重试。";
        if (request.outcome === "limited") state.authForm.cooldownUntil = request.readyAt + 60000;
        trackPrototypeEvent("auth_code_request_failed", { request_id: request.id, reason: request.outcome, simulated: true });
      } else {
        request.status = "sent";
        state.authForm.error = "";
        // Requesting a code does not switch the authenticated account or its data.
        state.authCodeRequested = true;
        state.authVerified = false;
        state.authForm.cooldownUntil = request.readyAt + 60000;
        trackPrototypeEvent("auth_code_request_completed", { request_id: request.id, simulated: true });
      }
      persistAppProgress();
      if (state.current === "AUTH-01") {
        render();
        if (request.status === "sent" && !modalRoot.textContent.trim()) document.getElementById("auth-code")?.focus();
      }
    }, Math.max(0, request.readyAt - Date.now()));
  }
  function authReviewControls(item) {
    if (item.id !== "AUTH-01") return "";
    const ui = authUiState();
    return `<section class="review-controls"><p>AUTH REVIEW</p><h3>登录测试状态</h3><small>本地模拟，不发送短信、不验证真实身份。模拟码固定为 ${AUTH_DEMO_CODE}，重发不变。仅此面板显示模拟规则。</small><div class="review-control-group"><strong>本轮模拟码：${ui.sent ? esc(state.authForm.request.demoCode) : "获取后显示"}</strong></div><div class="review-control-group"><strong>下一次验证码请求</strong><div>${[["success", "正常"], ["offline", "网络失败"], ["limited", "请求过多"]].map(([value, label]) => `<button data-action="auth-review:${value}" class="${authReviewOutcome === value ? "active" : ""}" ${ui.busy ? "disabled" : ""}>${label}</button>`).join("")}</div></div><div class="review-control-group"><strong>下一次登录请求</strong><div>${[["success", "正常登录"], ["offline", "登录网络失败"]].map(([value, label]) => `<button data-action="auth-login-review:${value}" class="${authLoginReviewOutcome === value ? "active" : ""}" ${ui.busy ? "disabled" : ""}>${label}</button>`).join("")}</div></div><div class="review-control-group"><strong>时间状态</strong><div><button data-action="auth-review:cooldown-end" ${ui.busy ? "disabled" : ""}>结束等待</button><button data-action="auth-review:expire" ${ui.busy || !ui.sent ? "disabled" : ""}>验证码过期</button></div></div></section>`;
  }

  function connectionIntroPage() {
    return `<section class="connect-intro-page" aria-labelledby="connect-intro-title">
      <div class="connect-intro-content"><figure class="connect-intro-photo"><img src="assets/ring-porcelain-onboarding.jpg" alt="Halo Ring 瓷白色戒指，内侧为传感器" width="1267" height="1241"></figure><h1 id="connect-intro-title">连接你的 Halo Ring</h1><p class="connect-intro-description" id="connect-intro-description">连接后，开始记录你的睡眠<br>和日常身体状态。</p></div>
      <div class="connect-intro-actions"><button type="button" class="primary connect-intro-primary" data-action="connect-intro-start" aria-describedby="connect-intro-description">连接 Halo Ring</button><button type="button" class="secondary connect-intro-later" data-action="connect-intro-skip" aria-describedby="connect-intro-note">暂不连接，先看看</button><p class="connect-intro-note" id="connect-intro-note">之后可在「我的」中连接。</p></div>
    </section>`;
  }
  function deviceGuideBlocker(ignoreBinding = false) {
    if (deviceMaintenance?.blocks()) return ["设备操作尚未确认", "请到高级设备操作查看这次结果。", "先确认设备操作"];
    if (initialSync?.isBusy()) return ["首次设置正在进行", "设置完成后，再查找戒指。", "等待设置完成"];
    if (deviceInfo?.isBusy() || deviceInfo?.unresolved()) return ["戒指更新尚未确认", "请先到设备信息页确认更新结果。", "先确认更新结果"];
    if (deviceHome?.isBusy()) return ["戒指正在处理", "本次连接或同步完成后，再查找戒指。", "等待本次操作完成"];
    if (state.activitySync.request?.status === "pending") return ["活动记录正在同步", "同步完成后，再查找戒指。", "等待同步完成"];
    if (!ignoreBinding && deviceBinding.unresolved()) return ["戒指连接尚未确认", "请从“我的”查看这次连接的结果。", "等待结果确认"];
    if (["downloading", "verifying"].includes(state.firmwareStatus)) return ["戒指正在更新", "更新完成后，再查找戒指。", "等待更新完成"];
    if (state.deviceStatus === "syncing") return ["戒指正在同步", "同步完成后，再查找戒指。", "等待同步完成"];
    if (state.measurementStatus === "running") return ["测量还未结束", "完成当前测量后，再查找戒指。", "等待测量结束"];
    if (state.deviceResetStatus === "pending") return ["戒指正在重置", "重置完成后，再查找戒指。", "等待重置完成"];
    return null;
  }
  function deviceGuideState() {
    if (state.connectionIntro.request?.status === "checking") return "checking";
    if (state.connectionIntro.request?.status === "failed") return "failed";
    if (state.connectionIntro.permission === "denied") return "denied";
    if (state.connectionIntro.permission === "bluetooth-off" || state.connectionIntro.permission === "granted" && !state.toggles.bluetooth) return "bluetooth-off";
    return state.connectionIntro.permission === "granted" ? "ready" : "not-requested";
  }
  function deviceGuidePage() {
    const status = deviceGuideState(), blocker = deviceGuideBlocker();
    const busy = status === "checking", disabled = busy || Boolean(blocker);
    const feedback = blocker || ({
      denied: ["还未允许使用蓝牙", "允许 Halo 使用蓝牙或访问附近设备后，才能查找戒指。", "查看开启方法"],
      "bluetooth-off": ["手机蓝牙尚未开启", "在手机设置中开启蓝牙，再回来继续。", "查看开启方法"],
      failed: ["暂时无法检查蓝牙", "请再试一次，已有记录不会受影响。", "重新检查"]
    })[status];
    const icons = [
      '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4"/>',
      '<rect x="2" y="6" width="17" height="12" rx="3"/><path d="M22 10v4M6 10v4m4-4v4"/>',
      '<path d="m7 7 10 10-5 4V3l5 4L7 17"/>'
    ];
    return `<section class="device-guide-page ${feedback ? "has-feedback" : ""}" aria-labelledby="device-guide-title" data-guide-state="${status}" aria-busy="${busy}"><button type="button" class="device-guide-back" data-action="previous" aria-label="返回"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5-7 7 7 7"/></svg></button><header class="device-guide-heading"><h1 id="device-guide-title">准备连接</h1><p>准备好后，查找附近的 Halo Ring。</p></header><figure class="device-guide-photo"><img src="assets/ring-porcelain-onboarding.jpg" width="1267" height="1241" alt="Halo Ring 戒指"></figure><ul class="device-guide-steps">${["把戒指放在手机旁", "确保戒指有电", "开启手机蓝牙"].map((text, index) => `<li><svg viewBox="0 0 24 24" aria-hidden="true">${icons[index]}</svg><span>${text}</span></li>`).join("")}</ul>${feedback && !busy ? `<div class="device-guide-feedback" role="status"><strong>${feedback[0]}</strong><p>${feedback[1]}</p></div>` : ""}<footer class="device-guide-actions"><button type="button" class="primary" data-action="device-status:connecting" ${disabled ? "disabled" : ""}>${busy ? "正在检查蓝牙…" : feedback?.[2] || "开始查找"}</button><button type="button" class="text-button" data-action="device-guide-help" ${busy ? "disabled" : ""}>连接帮助</button></footer></section>`;
  }
  function showDeviceGuideHelp() {
    if (state.current !== "DEV-01" || deviceGuideState() === "checking") return;
    trackPrototypeEvent("device_guide_help_opened", { source_page: "DEV-01", simulated: true });
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal connection-permission-modal" role="dialog" aria-modal="true" aria-labelledby="device-guide-help-title"><h2 id="device-guide-help-title">连接前可以这样检查</h2><ul class="device-guide-help-list"><li><strong>戒指放近一点</strong><p>把戒指和手机放在一起，再开始查找。</p></li><li><strong>确认戒指有电</strong><p>如果不确定，可以先给戒指充电。</p></li><li><strong>检查蓝牙设置</strong><p>打开手机蓝牙，并允许 Halo 使用蓝牙或访问附近设备。</p></li></ul><div class="connection-permission-actions"><button class="primary" data-action="close-modal">返回继续</button><button class="text-button" data-action="go:HELP-03">联系客服</button></div></section></div>`;
  }
  function showConnectionPermission(help = false) {
    const off = state.connectionIntro.permission === "bluetooth-off" || state.connectionIntro.permission === "granted" && !state.toggles.bluetooth;
    const title = help ? off ? "开启手机蓝牙" : "允许 Halo 使用蓝牙" : "连接前，需要使用蓝牙";
    const body = help ? off ? "在手机系统设置中开启蓝牙，再回到这里继续。" : "在手机系统设置中，找到 Halo 的应用权限，允许使用蓝牙或访问附近设备，再回到这里继续。" : "蓝牙用于查找附近的 Halo Ring，并同步戒指里的记录。暂不开启，也可以先使用 App。";
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal connection-permission-modal" role="dialog" aria-modal="true" aria-labelledby="connection-permission-title"><svg class="connection-bluetooth-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10-5 4V3l5 4L7 17"/></svg><h2 id="connection-permission-title">${title}</h2><p>${body}</p><div class="connection-permission-actions"><button class="primary" data-action="connect-intro-request">${help ? "我已开启，重新检查" : "继续"}</button><button class="text-button" data-action="close-modal">暂不开启</button></div></section></div>`;
  }
  function resumeConnectionIntro() {
    if (connectionIntroTimer) clearTimeout(connectionIntroTimer);
    connectionIntroTimer = null;
    const request = state.connectionIntro.request;
    if (request?.status !== "checking") return;
    connectionIntroTimer = setTimeout(() => {
      connectionIntroTimer = null;
      if (state.connectionIntro.request?.id !== request.id || request.status !== "checking") return;
      if (!["granted", "denied", "bluetooth-off"].includes(request.outcome)) {
        request.status = "failed";
        trackPrototypeEvent("onboarding_bluetooth_result", { request_id: request.id, source_page: "DEV-01", result: "failed", simulated: true });
        persistAppProgress();
        if (state.current === "DEV-01") render();
        return;
      }
      request.status = "complete";
      state.connectionIntro.permission = ["granted", "denied", "bluetooth-off"].includes(request.outcome) ? request.outcome : "denied";
      if (state.connectionIntro.permission === "granted" && state.connectionIntro.choice === "connect") state.connectionIntro.completed = true;
      state.toggles.bluetooth = state.connectionIntro.permission === "granted";
      trackPrototypeEvent("onboarding_bluetooth_result", { request_id: request.id, source_page: "DEV-01", result: state.connectionIntro.permission, simulated: true });
      persistAppProgress();
      if (state.current === "DEV-01") {
        if (state.connectionIntro.permission === "granted") return handleAction("device-status:connecting");
        render();
      }
    }, Math.max(0, request.readyAt - Date.now()));
  }
  function connectionIntroReviewControls(item) {
    if (item.id === "DEV-10") return `<section class="review-controls"><p>DEVICE REVIEW</p><h3>设备状态审阅</h3><small>仅审阅面板模拟设备回调；App 内只显示当前状态，不让用户选择连接状态。</small><div class="review-control-group"><strong>模拟当前状态</strong><div>${Object.entries(DEVICE_STATUS).map(([value, meta]) => `<button data-action="device-status:${value}" class="${state.deviceStatus === value ? "active" : ""}">${esc(meta.label)}</button>`).join("")}</div></div></section>`;
    if (item.id !== "DEV-01") return "";
    const busy = state.connectionIntro.request?.status === "checking";
    return `<section class="review-controls"><p>CONNECTION REVIEW</p><h3>连接权限审阅</h3><small>点击“开始查找”后才模拟检查；不操作真实蓝牙、系统设置或绑定资产。未检查不能推断手机蓝牙已关闭。</small><div class="review-control-group"><strong>下一次权限检查结果</strong><div>${[["granted", "允许使用"], ["denied", "未允许"], ["bluetooth-off", "手机蓝牙关闭"], ["failed", "检查失败"]].map(([value, label]) => `<button data-action="connect-review:${value}" class="${connectionReviewOutcome === value ? "active" : ""}" ${busy ? "disabled" : ""}>${label}</button>`).join("")}</div></div></section>`;
  }
  function normalizeProfileEditorSnapshot(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    return Object.fromEntries(PROFILE_EDITOR_FIELDS.map(key => [key, key === "birthdayBenefit" ? value[key] === true : String(value[key] ?? "")]));
  }
  function savedProfileEditorSnapshot() {
    return normalizeProfileEditorSnapshot({ ...state.profile, birthdayBenefit: state.toggles.birthdayBenefit === true });
  }
  function profileEditorDraft() {
    const editor = state.profileEditor;
    const saved = savedProfileEditorSnapshot();
    if (!editor.draft) { editor.draft = { ...saved }; editor.base = { ...saved }; }
    if (!editor.base) editor.base = { ...saved };
    for (const key of PROFILE_EDITOR_FIELDS) {
      // Follow independently saved values only where this editor has no local change.
      if (editor.draft[key] === editor.base[key] || editor.draft[key] === saved[key]) {
        editor.draft[key] = saved[key]; editor.base[key] = saved[key];
      }
    }
    return editor.draft;
  }
  function profileEditorDirty() {
    const draft = profileEditorDraft();
    const saved = savedProfileEditorSnapshot();
    return PROFILE_EDITOR_FIELDS.some(key => draft[key] !== saved[key]);
  }
  function profileEditorHasSaved() {
    return state.profileSaved === true || Boolean(state.profileEditor.savedAt);
  }
  function profileEditorErrors() {
    const draft = profileEditorDraft();
    const date = /^\d{4}-\d{2}-\d{2}$/.test(draft.birthday) ? new Date(`${draft.birthday}T12:00:00Z`) : null;
    const validBirthday = date && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === draft.birthday && draft.birthday <= beijingDateKey();
    const inRange = (value, minimum, maximum) => !value.trim() || /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim()) && Number.isFinite(Number(value)) && Number(value) >= minimum && Number(value) <= maximum;
    return {
      nickname: !draft.nickname.trim() ? "请填写昵称" : "",
      birthday: draft.birthday && !validBirthday ? "请核对出生日期，不能晚于今天" : "",
      height: inRange(draft.height, 100, 230) ? "" : "请填写 100–230 cm 范围内的身高",
      weight: inRange(draft.weight, 25, 250) ? "" : "请填写 25–250 kg 范围内的体重",
      birthdayBenefit: "",
    };
  }
  function profileEditorConflicts() {
    const draft = profileEditorDraft();
    const saved = savedProfileEditorSnapshot();
    return PROFILE_EDITOR_FIELDS.filter(key => draft[key] !== state.profileEditor.base[key] && saved[key] !== state.profileEditor.base[key] && draft[key] !== saved[key]);
  }
  function saveProfileEditor(confirmConflicts = false) {
    if (!state.signedIn || state.current !== "ACC-01" || state.accountDeletionStatus === "submitted") return;
    if (confirmConflicts && !profileConflictReview) return;
    const errors = profileEditorErrors();
    if (Object.values(errors).some(Boolean)) {
      state.profileEditor.touched = Object.fromEntries(PROFILE_EDITOR_FIELDS.map(key => [key, true]));
      if (typeof updateProfileEditorControls === "function") updateProfileEditorControls();
      document.getElementById(`profile-${PROFILE_EDITOR_FIELDS.find(key => errors[key])}`)?.focus();
      persistAppProgress();
      return flash("请检查标出的信息");
    }
    if (!profileEditorDirty() && profileEditorHasSaved()) return flash("没有需要保存的修改");
    const draft = { ...profileEditorDraft() };
    const saved = savedProfileEditorSnapshot();
    const reviewSignature = JSON.stringify([draft, saved]);
    if (confirmConflicts && profileConflictReview !== reviewSignature) {
      profileConflictReview = null; closeModal(); render();
      return flash("资料有更新，请重新检查并保存");
    }
    const conflicts = profileEditorConflicts();
    if (conflicts.length && !confirmConflicts) {
      const labels = { nickname: "昵称", birthday: "出生日期", height: "身高", weight: "体重", birthdayBenefit: "生日权益提醒" };
      profileConflictReview = reviewSignature;
      showInfoModal("资料已在其他页面更新", `${conflicts.map(key => labels[key]).join("、")}已有新保存的内容。这次草稿仍然保留；继续保存会用这次修改替换这些字段，其他资料不变。`, "保留这次修改并保存", "profile-save-confirm-conflicts");
      modalRoot.querySelector('[data-action="close-modal"]').textContent = "继续编辑";
      return;
    }
    const changedFields = PROFILE_EDITOR_FIELDS.filter(key => draft[key] !== saved[key]);
    const hasOnboardingDraft = Boolean(state.basicProfile.draft) && ["pending", "skipped"].includes(state.basicProfile.status) && BASIC_PROFILE_FIELDS.some(key => String(state.basicProfile.draft[key] ?? "") !== saved[key]);
    const updates = Object.fromEntries(changedFields.filter(key => key !== "birthdayBenefit").map(key => [key, draft[key].trim()]));
    const nextProfile = { ...state.profile, ...updates };
    const nextToggles = { ...state.toggles, ...(changedFields.includes("birthdayBenefit") ? { birthdayBenefit: draft.birthdayBenefit } : {}) };
    let nextBasicProfile = state.basicProfile;
    const bodyComplete = BASIC_PROFILE_FIELDS.every(key => String(nextProfile[key] ?? "").trim() && !errors[key]);
    if (changedFields.some(key => BASIC_PROFILE_FIELDS.includes(key)) && bodyComplete && !hasOnboardingDraft) {
      nextBasicProfile = { ...state.basicProfile, status: "completed", draft: Object.fromEntries(BASIC_PROFILE_FIELDS.map(key => [key, String(nextProfile[key])])), touched: {} };
    }
    const latest = normalizeProfileEditorSnapshot({ ...nextProfile, birthdayBenefit: nextToggles.birthdayBenefit === true });
    const nextEditor = { draft: { ...latest }, base: { ...latest }, touched: {}, savedAt: new Date().toISOString() };
    if (!writeNotificationProgress({ profile: nextProfile, profileSaved: true, toggles: nextToggles, basicProfile: nextBasicProfile, profileEditor: nextEditor })) {
      return flash("个人资料未能保存，输入仍保留。请重试；若其他页面已有更新，请重新打开并核对。");
    }
    profileDraftRestored = false;
    profileConflictReview = null;
    trackPrototypeEvent("profile_saved", { source_page: "ACC-01", fields: changedFields });
    closeModal(); render(); return flash("个人资料已保存");
  }
  function basicProfileDraft() { return basicProfileEditor.draft(); }
  function basicProfilePage() { return basicProfileEditor.page(); }
  function updateBasicProfileControls() { basicProfileEditor.update(); }
  function firstUse(item) {
    if (item.id === "ONB-04") return basicProfilePage();
    if (item.id === "ONB-03") return connectionIntroPage();
    if (item.id === "SYS-01") return startup.page();
    if (item.id === "ONB-01") return `<section class="welcome-page" aria-label="欢迎使用 Halo">
      <header class="welcome-brand">
        <img class="welcome-symbol" src="${HALO_SYMBOL}" alt="" width="96" height="114">
        <img class="welcome-wordmark" src="assets/HALORING_wordmark_with_slogan_ink.png" alt="HALORING · IN TUNE WITH YOU" width="184" height="39">
      </header>
      <footer class="welcome-actions">
        <button class="primary welcome-continue" data-action="go:AUTH-01">登录</button>
        <button class="secondary welcome-shop" data-action="commercial:product-open:ring">还没有 Halo Ring？立即购买</button>
      </footer>
    </section>`;
    if (item.id === "AUTH-01") return authLoginPage();
    if (item.id === "AUTH-02") return authLoginPage(); // Compatibility ID; guardedRoute resolves it to AUTH-01.
    if (item.id === "LEGAL-01") return `<section class="legal-overview"><header class="legal-overview-header"><button type="button" class="back" data-action="previous" aria-label="返回上一页">← 返回</button><h1>协议与说明</h1><p>了解服务约定，以及你的信息如何使用。</p></header><div class="legal-document-list">${[["agreement", "用户协议", "账号使用与服务约定"], ["privacy", "隐私政策", "信息的使用、保存与管理"], ["ai", "AI 服务说明", "建议的适用范围与对话记忆"]].map(([kind, title, detail]) => `<button type="button" class="legal-document-row" data-action="legal-read:${kind}"><span><strong>${title}</strong><small>${detail}</small></span><span aria-hidden="true">›</span></button>`).join("")}</div><p class="legal-health-note">Halo 的健康建议仅供日常参考，不能代替医生诊断或急救。</p><p class="legal-preview-note">当前为原型摘要，非正式法律文本。</p></section>`;
    if (item.id === "PERM-01") return permissionPage();
    if (item.id === "ONB-02") {
      return window.renderHaloBodyWeatherIntro({ state, active: isHardwareActive(), ready: bodyWeatherPageState().ready, symbol: HALO_SYMBOL, esc, icon: domainIcon });
    }
    return generic(item);
  }

  function device(item) {
    if (item.id === "DEV-12" && deviceMaintenance) return deviceMaintenance.page();
    if (item.id === "DEV-10") return deviceHome ? deviceHome.body() : head(item) + notice("设备页面暂未加载", "请刷新页面后再试，已有记录仍会保留。");
    if (["DEV-10", "DEV-11", "DEV-12"].includes(item.id) && !isHardwareActive() && !(item.id === "DEV-12" && state.deviceResetStatus === "complete")) {
      const copy = membershipCopy();
    return `${head(item, "MY RING")}<div class="stack"><section class="device-empty-state">${haloStatus("disconnected", "hero", "status-detail")}<h2>${esc(copy.device)}</h2><p>${state.membershipHardwareState === "unbound-retained" ? "设备历史和会员资产仍保留；重新绑定并激活后只恢复未来成长。" : "绑定并激活 Halo Ring 后，才会显示设备数据和健康功能。"}</p></section>${buttons([[copy.action, "go:DEV-01", "primary"]])}${notice("设备数据尚未开始", "绑定前不会显示电量、最后连接、固件或健康数据。")}</div>`;
    }
    const map = {
      "DEV-01": () => deviceGuidePage(),
      "DEV-02": () => deviceScan.body(),
      "DEV-03": () => deviceBinding.page(),
      "DEV-04": () => deviceWear.page(),
      "DEV-05": () => initialSync.page(),
      "DEV-11": () => deviceInfo ? deviceInfo.body() : head(item) + notice("设备信息暂未加载", "请刷新页面后再试，已有记录仍会保留。"),
      "DEV-12": () => head(item) + notice("设备操作页面暂未加载", "请刷新页面后再试。已有记录仍保留。"),
    };
    return map[item.id]?.() || generic(item);
  }

  function todaySyncLabel() {
    if (!isHardwareActive()) return state.membershipHardwareState === "unbound-retained" ? "戒指已解绑" : "尚未连接戒指";
    if (state.dataLifecycle === "none" && state.toggles.bluetooth === false) return "手机蓝牙未开启";
    const labels = { syncing: "正在同步…", connecting: "正在连接…", disconnected: "暂未连接", low: "戒指电量偏低", action: "同步需要处理" };
    if (labels[state.deviceStatus]) return labels[state.deviceStatus];
    const synced = new Date(state.deviceLastSyncedAt);
    if (!state.deviceLastSyncedAt || !Number.isFinite(synced.getTime()) || synced.getTime() > Date.now()) return state.dataLifecycle === "none" ? "戒指已连接" : "已连接 · 同步时间待确认";
    const sameDay = beijingDateKey(synced) === beijingDateKey();
    const time = new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", ...(sameDay ? {} : { month: "numeric", day: "numeric" }), hour: "2-digit", minute: "2-digit", hour12: false }).format(synced);
    return `${state.dataLifecycle === "none" ? "设备" : ""}${sameDay ? "已同步" : "上次同步"} ${time}`;
  }
  function todayUserRecords() {
    return state.subjectiveRecords.filter(record => record.occurredAt && Number.isFinite(Date.parse(record.occurredAt)) && beijingDateKey(new Date(record.occurredAt)) === beijingDateKey()).slice().reverse();
  }
  function todayRecordEntry() {
    const records = todayUserRecords();
    const editing = state.recordEditorMode === "edit" && state.recordEditDraft;
    const draft = state.recordDraft.labels.length || state.recordDraft.note.trim();
    const title = editing ? "继续修改记录" : draft ? "继续未保存的记录" : records.length ? "今天已记录 · 查看" : "记下今天的感受";
    return `<button class="today-record-entry" data-action="${editing || draft || !records.length ? "go:TOD-02" : "today-records"}"><span class="today-record-icon" aria-hidden="true">${domainIcon("body")}</span><span><strong>${title}</strong><small>用户记录${records.length ? ` · 今天 ${records.length} 条` : ""}</small></span><i aria-hidden="true">›</i></button>`;
  }
  function showTodayRecords() {
    const records = todayUserRecords();
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal today-records-modal" aria-labelledby="today-records-title"><div class="modal-title-row"><h2 id="today-records-title">今天的用户记录</h2><button class="text-button" data-action="close-modal">关闭</button></div>${records.length ? records.map(record => setting(record.label, `用户记录 · ${recordDateTime(record.occurredAt)}`, `record-detail:${record.id}`)).join("") : notice("今天还没有记录", "想记的时候再写，随时可以回来。")}${buttons([["再记一条", "record-new", "primary"]])}</section></div>`;
  }
  function todayNightCard() {
    const session = state.nightSession?.status !== "ended" ? state.nightSession : null;
    if (session) {
      const seconds = Math.max(0, nightPosition(session));
      const total = Math.max(1, session.duration * 60);
      const position = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
      const completed = seconds >= total;
      return `<button class="card today-night-card" data-action="today-night"><div class="card-top"><span>${completed ? "本次收听" : session.status === "paused" ? "已暂停" : "正在播放"}</span><span aria-hidden="true">${domainIcon("sleep")}</span></div><h3>${esc(session.title)}</h3><p>${session.skipped ? "播放进度" : "已听"} ${position} / ${session.duration} 分钟</p><progress value="${seconds}" max="${total}" aria-label="本次收听进度"></progress><strong class="today-card-link">${completed ? "查看本次收听" : session.status === "paused" ? "继续收听" : "打开播放器"} <i aria-hidden="true">›</i></strong></button>`;
    }
    if (!isHardwareActive()) return card("选一段睡前内容", "呼吸 · 身体扫描 · 安静声音", "睡前可选", "go:NIG-01");
    const selected = nightPlaylist.plan();
    return `<button class="card today-night-card" data-action="go:NIG-01"><div class="card-top"><span>睡前可选</span><span aria-hidden="true">${domainIcon("sleep")}</span></div><h3>${esc(selected.title || "选一组睡前内容")}</h3><p>${selected.tracks.length ? `${selected.tracks.length} 段 · 共 ${selected.total} 分钟` : "呼吸 · 身体扫描 · 安静声音"}</p><strong class="today-card-link">查看播放组合 <i aria-hidden="true">›</i></strong></button>`;
  }
  function todayServices() {
    const bag = '<path d="M5 7h14l1 14H4L5 7Z M8 8V6a4 4 0 0 1 8 0v2"/>';
    const booking = '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-13 5 3 3 5-5"/>';
    return `<div class="today-services" aria-label="精选与体验">${[["Halo Select", "精选好物", "SEL-01", bag], ["Halo Studio", studioTodayReminder.serviceLabel(), "STU-08", booking]].map(([title, subtitle, route, glyph]) => `<button class="today-service" data-action="go:${route}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${glyph}</svg><strong>${title}</strong><span>${subtitle}<i aria-hidden="true">›</i></span></button>`).join("")}</div>`;
  }
  function todayFirstUseView() {
    const active = isHardwareActive();
    if (active && state.dataLifecycle !== "none") return null;
    if (!active) {
      const retained = state.membershipHardwareState === "unbound-retained";
      return {
        title: retained ? "连接戒指，继续记录" : state.devicePaired ? "连接还差一步" : "连接戒指，开始记录",
        body: retained ? "已有记录仍保留。重新连接后，再继续记录你的日常。" : "连接并激活后，开始接收身体记录。感受记录和睡前内容现在就能用。",
        label: "等待连接", copyVariant: 0,
        main: [state.devicePaired ? "继续连接戒指" : retained ? "重新连接 Halo Ring" : "连接 Halo Ring", state.devicePaired ? "go:DEV-10" : "go:DEV-01", "primary"],
      };
    }
    const copy = rotatingCopy("today-firstuse:none", { title: "还没有可用的身体记录", body: "今晚照常佩戴，醒来后打开 App 同步。有可用记录后，这里会更新。" }, [
      { title: "还没收到身体记录", body: "今晚戴着戒指照常睡觉，醒来后同步。不需要为了记录改变作息。" },
      { title: "从今晚的记录开始", body: "戴着戒指照常睡，醒来后打开 App 同步。有可用记录后再看身体状态。" },
    ]);
    const deviceHints = {
      disconnected: ["戒指暂未连接", "把戒指放在手机附近，检查连接后再同步。", "查看连接与同步"],
      action: ["这次同步没有完成", "检查戒指连接后可以重试，不用重新设置个人资料。", "查看连接与同步"],
      low: [copy.title, "戒指电量偏低，先充电，再照常佩戴记录。", "查看戒指电量"],
      connecting: ["正在连接戒指", "可以先浏览其他内容，连接完成后再查看。", "查看连接进度"],
      syncing: ["正在同步戒指", "可以先浏览其他内容，有可用的身体记录后这里会更新。", "查看同步进度"],
    };
    const hint = state.toggles.bluetooth === false ? ["手机蓝牙未开启", "连接和同步需要手机蓝牙。可以先照常佩戴，需要同步时再开启。", "查看连接与同步"] : deviceHints[state.deviceStatus];
    const session = state.nightSession?.status !== "ended" ? state.nightSession : null;
    const sessionComplete = session && nightPosition(session) >= session.duration * 60;
    return {
      ...copy, label: "等待身体记录",
      ...(hint ? { title: hint[0], body: hint[1] } : {}),
      main: hint ? [hint[2], "go:DEV-10", "primary"] : session ? [sessionComplete ? "查看本次收听" : session.status === "paused" ? "继续收听" : "打开播放器", "today-night", "primary"] : ["选一段睡前内容", "go:NIG-01", "primary"],
    };
  }
  function todayWeatherHome(item) {
    const weather = currentBodyWeather();
    const active = isHardwareActive();
    const canInterpret = active && state.dataLifecycle === "interpretable";
    const correction = activeWeatherCorrection();
    const dataState = currentDataLifecycle();
    const firstUseView = todayFirstUseView();
    const title = firstUseView ? firstUseView.title : !active ? "还没有今天的身体天气" : correction ? "你的感受已补充" : canInterpret ? weather.homeTitle : dataState.headline;
    const titleMarkup = title.split(/(?<=，)/).map(part => `<span class="today-title-clause">${esc(part)}</span>`).join("");
    const body = firstUseView ? firstUseView.body : !active ? "连接戒指后，开始记录睡眠与日常状态。" : correction ? "戒指记录保留，今天怎么安排也听听你的感受。" : canInterpret ? `${weather.homeBody.split("。")[0]}。` : dataState.summary;
    const signals = !active ? [["睡眠", "等待记录"], ["身体能量", "等待记录"], ["今天怎么动", "按感受"]] : canInterpret ? weather.signals.map(([label, value]) => [label, correction && label === "今天怎么动" ? "按感受" : value]) : dataState.signals;
    const main = firstUseView ? firstUseView.main : canInterpret ? ["看看今天怎么安排", "today-advice", "primary"] : ["查看记录进度", "go:TOD-11", "primary"];
    const copyVariant = firstUseView ? firstUseView.copyVariant : canInterpret ? weather.copyVariant : dataState.copyVariant;
    return `${head(item, new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", month: "long", day: "numeric", weekday: "short" }).format(new Date()))}<div class="stack today-stack${firstUseView ? " today-first-use" : ""}"><button class="body-weather visual-weather" data-action="${firstUseView ? "go:ONB-02" : "today-weather-details"}" data-copy-variant="${esc(copyVariant)}"><img class="weather-symbol" src="${HALO_SYMBOL}" alt="">${canInterpret ? `<span class="label today-weather-heading"><span>BODY WEATHER</span><strong class="today-weather-state">${esc(weather.label)}</strong></span>` : `<span class="label">BODY WEATHER · ${esc(firstUseView ? firstUseView.label : dataState.label)}</span>`}<h2>${titleMarkup}</h2><p>${esc(body)}</p><span class="today-card-link">${firstUseView ? "怎么开始记录" : canInterpret ? "查看状态与原因" : "了解记录条件"} <i aria-hidden="true">›</i></span></button><section class="today-health-links" aria-label="今天的身体信号">${visualSignalCards(signals, !active || state.dataLifecycle === "none")}<button class="today-all-health" data-action="go:HLT-00">查看全部健康数据 <i aria-hidden="true">›</i></button></section>${buttons([main])}${studioTodayReminder.page()}${todayRecordEntry()}${dailyInspirationCard()}${todayNightCard()}${todayServices()}</div>`;
  }





  function unreadyHealthPage(item) {
    const data = currentDataLifecycle();
    const recorded = { none: 0, accumulating: 3, baseline: 5, limited: 9 }[state.dataLifecycle] || 0;
    return `${head(item, item.id === "TOD-09" ? "REPORTS" : "DATA PROGRESS")}<div class="stack">${notice(data.headline, data.summary, "sage")}${item.id === "TOD-09" ? radialProgress(Math.round(recorded / 14 * 100), `${recorded} / 14`, "首份 14 晚报告", "完整记录达到要求后生成") : ""}${lifecycle(state.dataLifecycle, "当前记录进度")}${quality("Halo Ring")}${notice("暂不展示健康趋势", "记录不足或不完整时，不用示例值替代你的数据。用户记录仍可查看和补充。")}${retainedUserRecords()}${buttons([["查看设备与同步", "go:DEV-10", "primary"], ["返回今日", "go:TOD-01", "secondary"]])}</div>`;
  }

  function bodyWeatherPageState() {
    const active = isHardwareActive();
    const stage = state.dataLifecycle;
    const date = state.healthDemoRecordDate;
    const hasRecords = active && stage !== "none";
    const fresh = date === beijingDateKey();
    return { active, stage, date, hasRecords, fresh, ready: active && fresh && stage === "interpretable", limited: active && stage === "limited" };
  }
  function bodyWeatherEvidence(data) {
    const sleep = sleepReviewRecord();
    const fullNight = data.hasRecords && !data.limited;
    const rows = [
      { key: "sleep", title: "睡眠", icon: "sleep", value: fullNight ? sleepDuration(sleep.asleep) : data.limited ? "记录不完整" : "—", note: fullNight ? `清醒 ${sleep.awakenings} 次 · 共 ${sleep.totals.awake} 分钟` : data.limited ? "缺少时段，暂不汇总整晚" : "等待夜间记录" },
      { key: "energy", title: "身体能量", icon: "energy", value: fullNight ? data.stage === "interpretable" ? "接近平时" : "积累中" : data.limited ? "暂不判断" : "—", note: fullNight ? "查看夜间 HRV 与静息心率" : data.limited ? "夜间记录有缺口" : "有记录后开始了解你的平时水平" },
      { key: "activity", title: "活动", icon: "activity", value: data.hasRecords ? "4,862 步" : "—", note: data.hasRecords ? "已同步的步数 · 不代表全天" : "等待活动记录" },
    ];
    return `<section class="bw-evidence"><h2>${data.ready ? "这次参考的记录" : data.hasRecords ? "已有记录" : "等待记录的项目"}</h2><div class="bw-evidence-list">${rows.map(row => `<button type="button" class="bw-evidence-row" data-action="bw-open:${row.key}"><span class="bw-row-icon" aria-hidden="true">${domainIcon(row.icon)}</span><span class="bw-row-copy"><strong>${row.title}</strong><small>${esc(row.note)}</small></span><span class="bw-row-value">${esc(row.value)}</span>${healthChevron()}</button>`).join("")}</div></section>`;
  }
  function bodyWeatherRecordLinks() {
    const todayCount = todayUserRecords().length;
    const total = state.subjectiveRecords.length;
    const hasDraft = state.recordDraft.labels.length || state.recordDraft.note.trim();
    return `<section class="bw-records"><h2>你的感受</h2><button type="button" class="bw-link-row" data-action="record-new"><span class="bw-row-icon" aria-hidden="true">＋</span><span class="bw-row-copy"><strong>${hasDraft ? "继续未保存的记录" : "记下此刻感受"}</strong><small>用户记录 · ${todayCount ? `今天 ${todayCount} 条` : "今天还没有记录"}</small></span>${healthChevron()}</button>${total ? `<button type="button" class="bw-link-row bw-record-history" data-action="bw-records"><span>查看我的记录</span><span>${total} 条 ${healthChevron()}</span></button>` : ""}${state.recordEditDraft ? `<button type="button" class="text-button" data-action="record-edit:${esc(state.recordEditDraft.id)}">继续上次未保存的修改</button>` : ""}</section>`;
  }
  function showBodyWeatherRecords() {
    const records = state.subjectiveRecords.filter(record => !["HLT-01", "HLT-02", "HLT-05", "HLT-06"].includes(state.current) || record.category !== "rhythm").slice().sort((a, b) => (Date.parse(b.occurredAt) || 0) - (Date.parse(a.occurredAt) || 0));
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal bw-records-modal" aria-labelledby="bw-records-title"><header class="modal-title-row"><h2 id="bw-records-title">我的感受记录</h2><button class="text-button" data-action="close-modal">关闭</button></header><p>共 ${records.length} 条 · 用户记录</p><div class="bw-records-list">${records.map(record => setting(record.label, record.occurredAt ? recordDateTime(record.occurredAt) : "原记录未保存日期", `record-detail:${record.id}`)).join("") || "<p>还没有记录，想记的时候再写。</p>"}</div>${buttons([["记下一条", "record-new", "primary"]])}</section></div>`;
  }
  function bodyWeatherTrendModel() {
    const data = bodyWeatherPageState();
    if (!data.ready) return null;
    const view = state.bodyWeatherTrendView || {};
    const days = [7, 14, 30].includes(Number(view.period)) ? Number(view.period) : 7;
    // Explicit prototype fixture, not derived health scores. All ranges share the same dated series.
    const fixture = ["balance", "slow", "restore", "slow", "balance", "active", "balance", "slow", "balance", "active", "balance", "slow", "restore", "slow", "balance", "active", "balance", "slow", "balance", "restore", "slow", "balance", "active", "restore", "slow", "balance", "slow", "active", "balance", "slow"];
    const end = Date.parse(`${data.date}T12:00:00+08:00`);
    const daily = fixture.map((status, index) => {
      const date = beijingDateKey(new Date(end - (fixture.length - 1 - index) * 86400000));
      const records = state.subjectiveRecords.filter(record => record.occurredAt && Number.isFinite(Date.parse(record.occurredAt)) && beijingDateKey(new Date(record.occurredAt)) === date);
      return { date, status: index === fixture.length - 1 && BODY_WEATHER_STATES[state.bodyWeather] ? state.bodyWeather : status, records };
    }).slice(-days);
    const selected = daily.find(day => day.date === view.date) || daily.at(-1);
    const distribution = ["restore", "slow", "balance", "active"].map(key => [BODY_WEATHER_STATES[key].label.slice(0, -1), daily.filter(day => day.status === key).length, key]);
    return { days, daily, recent: daily.slice(-7), selected, distribution };
  }
  function bodyWeatherTrendGraph(model) {
    const { daily, selected } = model;
    const padding = getComputedStyle(screen);
    const width = Math.max(240, Math.round(screen.clientWidth - parseFloat(padding.paddingLeft) - parseFloat(padding.paddingRight)));
    const left = 38, right = width - 12, top = 20, bottom = 152;
    const states = ["active", "balance", "slow", "restore"];
    const color = { restore: "#6c574d", slow: "#a77c3b", balance: "#789575", active: "#284b37" };
    const step = (right - left) / (daily.length - 1);
    const points = daily.map((day, i) => ({ ...day, x: left + i * step, y: top + states.indexOf(day.status) * (bottom - top) / 3 }));
    const selectedPoint = points.find(day => day.date === selected.date);
    const tickCount = width < 310 ? 3 : 4;
    const ticks = [...new Set(Array.from({ length: tickCount }, (_, i) => Math.round(i * (daily.length - 1) / (tickCount - 1))))];
    // Shape-preserving interpolation for equally spaced days: keep every observation,
    // flatten tangents at reversals, and avoid adding peaks between adjacent states.
    const slopes = points.slice(1).map((point, i) => (point.y - points[i].y) / (point.x - points[i].x));
    const tangents = points.map((_, i) => {
      if (i === 0) return slopes[0];
      if (i === points.length - 1) return slopes.at(-1);
      const before = slopes[i - 1], after = slopes[i];
      return before * after <= 0 ? 0 : 2 * before * after / (before + after);
    });
    const path = points.map((point, i) => {
      if (i === 0) return `M${point.x.toFixed(2)},${point.y.toFixed(2)}`;
      const previous = points[i - 1], third = (point.x - previous.x) / 3;
      return `C${(previous.x + third).toFixed(2)},${(previous.y + tangents[i - 1] * third).toFixed(2)} ${(point.x - third).toFixed(2)},${(point.y - tangents[i] * third).toFixed(2)} ${point.x.toFixed(2)},${point.y.toFixed(2)}`;
    }).join(" ");
    return `<svg class="bw-trend-chart" width="${width}" height="196" viewBox="0 0 ${width} 196" role="img" aria-labelledby="bw-trend-chart-title bw-trend-chart-desc"><title id="bw-trend-chart-title">最近 ${model.days} 天身体天气趋势 · 示例数据</title><desc id="bw-trend-chart-desc">横轴为日期，纵轴为活力、平衡、缓行、修复四种状态，不是健康分数。已选 ${selected.date}，${BODY_WEATHER_STATES[selected.status].label}。可以点选图表，或用下方日期控件查看每一天。</desc>${states.map((status, i) => { const y = top + i * (bottom - top) / 3; return `<g class="bw-chart-axis"><text x="0" y="${y + 4}">${BODY_WEATHER_STATES[status].label.slice(0, -1)}</text><line x1="${left}" x2="${right}" y1="${y}" y2="${y}"/></g>`; }).join("")}<line class="bw-chart-selection" x1="${selectedPoint.x}" x2="${selectedPoint.x}" y1="${top - 8}" y2="${bottom + 8}"/><path class="bw-chart-line" d="${path}"/>${points.map(point => `<circle class="bw-chart-point" data-date="${point.date}" data-status="${point.status}" cx="${point.x}" cy="${point.y}" r="${daily.length > 14 ? 2.5 : 3.5}" fill="${color[point.status]}"/>${state.toggles.trendRecords && point.records.length ? `<path class="bw-chart-record-mark" d="M${point.x},162 l4,4 l-4,4 l-4,-4 Z"/>` : ""}`).join("")}<circle class="bw-chart-current" cx="${selectedPoint.x}" cy="${selectedPoint.y}" r="6"/>${ticks.map(i => `<text class="bw-chart-date" x="${points[i].x}" y="190" text-anchor="${i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}">${Number(points[i].date.slice(5, 7))}/${Number(points[i].date.slice(8))}</text>`).join("")}<g aria-hidden="true">${points.map(point => `<rect class="bw-chart-hit" data-action="bw-trend-day:${point.date}" x="${Math.max(left - 6, point.x - step / 2)}" y="${top - 10}" width="${Math.min(right + 6, point.x + step / 2) - Math.max(left - 6, point.x - step / 2)}" height="166" fill="transparent"/>`).join("")}</g></svg>`;
  }
  function bodyWeatherTrendInspector(model) {
    const index = model.daily.findIndex(day => day.date === model.selected.date);
    return `<div class="bw-trend-inspector"><button type="button" id="bw-trend-prev" class="bw-trend-step" data-action="bw-trend-step:-1" aria-label="前一天" ${index === 0 ? "disabled" : ""}>${healthChevron("left")}</button><select id="bw-trend-date" aria-label="选择趋势日期">${model.daily.map(day => `<option value="${day.date}" ${day.date === model.selected.date ? "selected" : ""}>${Number(day.date.slice(5, 7))}月${Number(day.date.slice(8))}日 · ${BODY_WEATHER_STATES[day.status].label}</option>`).join("")}</select><button type="button" id="bw-trend-next" class="bw-trend-step" data-action="bw-trend-step:1" aria-label="后一天" ${index === model.daily.length - 1 ? "disabled" : ""}>${healthChevron()}</button></div>`;
  }
  function bodyWeatherTrendSection() {
    const model = bodyWeatherTrendModel();
    const heading = '<header class="bw-trend-header"><h2>完整状态趋势</h2>';
    if (!model) return `<section class="bw-trend">${heading}</header><p class="bw-unready-note">有足够完整记录后，再显示身体天气趋势。</p></section>`;
    const { days, daily, selected, distribution } = model;
    const dateLabel = date => `${Number(date.slice(5, 7))}/${Number(date.slice(8))}`;
    const visibleRecords = Boolean(state.toggles.trendRecords);
    const corrected = selected.date === beijingDateKey() && activeWeatherCorrection();
    const recordsInRange = daily.reduce((sum, day) => sum + day.records.length, 0);
    const most = distribution.reduce((a, b) => a[1] >= b[1] ? a : b);
    return `<section class="bw-trend" aria-label="完整状态趋势">${heading}<span>示例数据</span></header><p class="bw-trend-range">${daily[0].date.replaceAll("-", "/")} — ${daily.at(-1).date.replaceAll("-", "/")}</p><div class="bw-trend-periods" role="group" aria-label="趋势时间范围">${[7, 14, 30].map(period => `<button type="button" data-action="bw-trend-period:${period}" aria-pressed="${period === days}">${period} 天</button>`).join("")}</div><div class="bw-trend-graph">${bodyWeatherTrendGraph(model)}</div>${bodyWeatherTrendInspector(model)}${weatherDistribution(distribution)}<h3 class="bw-recent-heading">最近 7 天</h3><div class="bw-trend-days" role="group" aria-label="最近7天每日身体天气">${model.recent.map(day => `<button type="button" id="bw-day-${day.date}" class="bw-trend-day ${day.status}" data-action="bw-trend-day:${day.date}" aria-pressed="${day.date === selected.date}" aria-label="${day.date}，${BODY_WEATHER_STATES[day.status].label}${visibleRecords && day.records.length ? `，${day.records.length} 条用户记录` : ""}"><span>${day.date === beijingDateKey() ? "今天" : dateLabel(day.date)}</span><strong>${BODY_WEATHER_STATES[day.status].label.slice(0, -1)}</strong>${visibleRecords && day.records.length ? '<i aria-hidden="true"></i>' : ""}</button>`).join("")}</div><label class="bw-trend-toggle"><input id="bw-trend-records" type="checkbox" ${visibleRecords ? "checked" : ""}>显示用户记录 <small>图中 ◆ · 卡片圆点</small></label><div class="bw-trend-selected" aria-live="polite"><header><span>${esc(healthDateLabel(selected.date))}</span><strong>${BODY_WEATHER_STATES[selected.status].label}</strong></header>${corrected ? '<p>你已补充不同感受，原状态记录仍保留。</p>' : ""}${visibleRecords ? selected.records.length ? selected.records.map(record => `<button type="button" class="bw-trend-record" data-action="record-detail:${esc(record.id)}"><span>${esc(record.label)}<br><small>用户记录 · ${esc(/^\d{4}-\d{2}-\d{2}$/.test(record.occurredAt) ? "按日期记录" : new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(record.occurredAt)))}</small></span>${healthChevron()}</button>`).join("") : '<p>这一天没有用户记录。</p>' : '<p>用户记录已隐藏，随时可以打开。</p>'}</div>${days === 30 ? `<section class="bw-trend-summary"><h3>这 30 天的回顾</h3><p>${most[0]}日最多，共 ${most[1]} 天。你在这段时间记下了 ${recordsInRange} 条感受。</p><button type="button" class="text-button" data-action="record-new">记下看完后的感受 ${healthChevron()}</button><button type="button" class="text-button" data-action="go:TOD-09">查看健康报告 ${healthChevron()}</button></section>` : ""}<p class="bw-trend-caption">状态不是分数；用户记录与状态同时出现，不代表因果。</p></section>`;
  }
  function bodyWeatherDetailPage() {
    const data = bodyWeatherPageState();
    const weather = currentBodyWeather();
    const correction = activeWeatherCorrection();
    const record = sleepReviewRecord();
    const title = !data.active ? "连接戒指，开始了解自己" : !data.hasRecords ? "还没有收到身体记录" : !data.fresh ? "今天的记录还没更新" : data.limited ? "昨晚少了一段记录" : !data.ready ? "正在了解你的平时水平" : correction ? "先按你现在的感受来" : weather.homeTitle;
    const summary = !data.active ? "戴着 Halo Ring 睡一晚，醒来后同步。" : !data.hasRecords ? "今晚照常佩戴，睡醒后打开 App 同步。" : !data.fresh ? "下面保留最近的记录，不用它判断今天。" : data.limited ? "02:10–03:00 缺少记录，暂不判断身体状态。" : !data.ready ? "已经收到的记录可以看，暂不与平时比较。" : correction ? "你的反馈已单独记下，戒指记录保持原样。" : `睡眠 ${sleepDuration(record.asleep)}，夜里清醒 ${record.awakenings} 次。身体能量接近平时。`;
    const status = !data.active ? "尚未连接" : !data.hasRecords ? "等待记录" : !data.fresh ? "等待更新" : data.limited ? "记录不完整" : !data.ready ? "积累中" : correction ? "感受已补充" : weather.label;
    const main = !data.active ? [state.membershipHardwareState === "unbound-retained" ? "重新连接 Halo Ring" : "连接 Halo Ring", "go:DEV-01", "primary"] : !data.hasRecords || data.limited || !data.fresh ? ["查看连接与同步", "go:DEV-10", "primary"] : !data.ready ? ["查看建立进度", "go:HLT-00", "primary"] : correction ? ["按我的感受聊聊", "bw-halo", "primary"] : ["看看今晚的放松内容", "go:NIG-01", "primary"];
    const actions = {
      restore: ["今天少安排一点", "先做必要的事，其他可以往后放。"],
      slow: ["照常安排，留出休息时间", "先做重要的事，觉得累了就歇一会儿。"],
      balance: ["按自己的节奏过今天", "安排可以照常，也记得给休息留时间。"],
      active: ["做一件一直想做的事", "有精神时推进计划，累了也可以调整。"],
    };
    const action = correction ? ["下一步，先听听你的感受", "想继续、想休息，或有别的感觉，都可以和 Halo 说。"] : actions[state.bodyWeather] || actions.slow;
    const dateText = data.hasRecords ? `${healthDateLabel(data.date)} · ${data.fresh ? "本次记录" : "最近记录"}` : "Body Weather";
    const syncText = data.hasRecords ? todaySyncLabel() : "等待首次有效记录";
    return `<article class="bw-detail"><header class="health-overview-header"><button type="button" data-action="previous" aria-label="返回">${healthChevron("left")}</button><h1>身体天气</h1><button type="button" data-action="bw-help" aria-label="关于身体天气">i</button></header><p class="bw-record-date">${esc(dateText)}</p><section class="bw-hero detail-conclusion ${data.ready ? "ready" : "pending"}"><div class="bw-state"><span>${esc(status)}</span><img src="${HALO_SYMBOL}" alt=""></div><h2>${esc(title)}</h2><p>${esc(summary)}</p></section>${data.ready ? interpretationCorrectionCard() : ""}<section class="bw-action detail-action" aria-label="下一步">${data.ready ? `<div><span>今天可以怎么做</span><h2>${esc(action[0])}</h2><p>${esc(action[1])}</p></div>` : data.limited ? '<p>记录缺口不代表身体异常，已同步内容仍然保留。</p>' : ""}${buttons([main])}</section>${bodyWeatherEvidence(data)}${bodyWeatherTrendSection()}${bodyWeatherRecordLinks()}<section class="bw-more"><h2>再了解一点</h2><button type="button" class="bw-link-row" data-action="bw-pressure"><span>了解压力变化</span>${healthChevron()}</button><details class="bw-source"><summary><span>数据来源与说明</span>${healthChevron()}</summary><div><p>${data.hasRecords ? `Halo Ring · ${esc(healthDateLabel(data.date))}的记录` : "尚无可用的身体记录"}<br>${esc(syncText)}</p><p>${data.limited ? "夜间记录有缺口，暂不汇总整晚；已同步的活动片段可以查看。" : data.hasRecords ? "睡眠按醒来日期归档；活动仅统计已同步的部分。" : "没有收到数据时，不用示例数值代替你的记录。"}</p><p>你主动记下的感受会单独标注，不改动戒指测量。身体天气是日常参考，不是诊断。</p><button class="text-button" data-action="go:TOD-11">查看数据来源与质量</button><button class="text-button" data-action="go:DEV-10">查看连接与同步</button></div></details></section>${data.ready ? `<div class="bw-secondary-actions">${buttons([["分享这次状态", "go:TOD-10", "secondary"], ["和 Halo 聊聊", "bw-halo", "secondary"]])}</div>` : ""}<p class="health-overview-boundary">用于日常健康管理，不替代医疗诊断。</p></article>`;
  }
  function today(item) {
    if (item.id === "TOD-10") return stateShare.body();
    if (item.id === "TOD-09") return healthReports.body();
    if (item.id === "TOD-03") return bodyWeatherDetailPage();
    if (item.id === "TOD-01" && !isHardwareActive()) return unboundToday(item);
    if (["TOD-03", "TOD-04", "TOD-05", "TOD-06", "TOD-07", "TOD-09", "TOD-10", "TOD-11"].includes(item.id) && !isHardwareActive()) return unboundHealthDetail(item);
    if (["TOD-04", "TOD-09", "TOD-11"].includes(item.id) && state.dataLifecycle !== "interpretable") return unreadyHealthPage(item);
    const map = {
      "TOD-01": () => todayWeatherHome(item),
      "TOD-02": recordEditorPage,
      "TOD-05": () => sleepDetailPage(),
      "TOD-06": () => energyDetailPage(),
      "TOD-07": () => activityDetailPage(),
      "TOD-08": () => nightReviewPage(item),
    };
    return map[item.id]?.() || generic(item);
  }

  // One explicit review night. All durations, intervals and chart widths derive from this fixture.
  // 00:02–07:18 = 436 minutes: 402 asleep + 34 awake; no fabricated multi-night trend.
  const SLEEP_STAGE_META = {
    light: { label: "浅睡", color: "#a4b39b", explanation: "浅睡是睡眠的正常组成部分，不等于没睡好。" },
    deep: { label: "深睡", color: "#526d5c", explanation: "深睡也叫慢波睡眠，通常在前半夜更多。" },
    rem: { label: "REM", color: "#90aebb", explanation: "快速眼动睡眠时大脑较活跃，梦常出现在这个阶段。" },
    awake: { label: "清醒", color: "#bb8d57", explanation: "睡眠周期之间可能短暂醒来，不一定每次都记得。" },
  };
  function sleepReviewRecord() {
    let minute = 2;
    const segments = [["light",24],["deep",34],["light",26],["rem",18],["awake",16],["light",40],["deep",40],["light",36],["rem",28],["awake",18],["light",54],["rem",30],["light",52],["rem",20]].map(([stage, duration]) => {
      const segment = { stage, duration, start: minute, end: minute + duration };
      minute += duration;
      return segment;
    });
    const totals = Object.fromEntries(Object.keys(SLEEP_STAGE_META).map(stage => [stage, segments.filter(item => item.stage === stage).reduce((sum, item) => sum + item.duration, 0)]));
    return { segments, totals, start: segments[0].start, end: minute, asleep: totals.light + totals.deep + totals.rem, awakenings: segments.filter(item => item.stage === "awake").length };
  }
  function sleepTime(minute) { return `${String(Math.floor(minute / 60) % 24).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`; }
  function sleepDuration(minutes) { return minutes < 60 ? `${minutes}分` : `${Math.floor(minutes / 60)}小时${minutes % 60 ? `${minutes % 60}分` : ""}`; }
  function sleepRecordDate() { return state.healthDetailContext?.route === "TOD-05" ? state.healthDetailContext.date : beijingDateKey(); }
  function selectSleepDate(date) {
    if (!validHealthDate(date) || state.current !== "TOD-05") return;
    state.healthSelectedDate = date;
    state.healthDetailContext = { date, metric: "sleep", route: "TOD-05" };
    state.sleepStage = "all";
    render();
    screen.scrollTop = 0;
    capturePageView();
    persistAppProgress();
  }
  function healthDetailDateHeader(title, date, namespace) {
    return `<header class="health-overview-header"><button data-action="previous" aria-label="返回">${healthChevron("left")}</button><h1>${esc(title)}</h1><span></span></header><div class="health-date-rail"><button data-action="${namespace}-date:previous" aria-label="前一天" ${date <= "1900-01-01" ? "disabled" : ""}>${healthChevron("left")}</button><label class="health-date-picker"><span>${esc(healthDateLabel(date))}</span><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4m8-4v4M4 11h16"/></svg><input id="${namespace}-record-date" type="date" min="1900-01-01" max="${beijingDateKey()}" value="${date}" aria-label="选择${esc(title)}记录日期"></label><button data-action="${namespace}-date:next" aria-label="后一天" ${date >= beijingDateKey() ? "disabled" : ""}>${healthChevron()}</button></div>`;
  }
  function sleepDateHeader(date) { return healthDetailDateHeader("睡眠", date, "sleep"); }
  function sleepStagesChart(record, selected) {
    const ys = { awake: 18, rem: 57, light: 96, deep: 135 };
    const x = minute => 52 + (minute - record.start) / (record.end - record.start) * 258;
    const stageButtons = Object.entries(SLEEP_STAGE_META).map(([key, item]) => `<button type="button" class="sleep-stage-choice" data-action="sleep-stage:${key}" aria-pressed="${selected === key}" aria-controls="sleep-stage-readout"><i style="background:${item.color}" aria-hidden="true"></i><span>${item.label}</span><strong>${sleepDuration(record.totals[key])}</strong></button>`).join("");
    const segments = record.segments.map((item, index) => `<g opacity="${selected === "all" || selected === item.stage ? 1 : .22}">${index ? `<path d="M${x(item.start)} ${ys[record.segments[index - 1].stage]}V${ys[item.stage]}" stroke="${SLEEP_STAGE_META[item.stage].color}" stroke-width="1"/>` : ""}<path data-sleep-segment="${item.stage}" data-minutes="${item.duration}" d="M${x(item.start)} ${ys[item.stage]}H${x(item.end)}" stroke="${SLEEP_STAGE_META[item.stage].color}" stroke-width="6" stroke-linecap="round"/></g>`).join("");
    const tickMarks = [record.start, 120, 240, record.end].map(minute => `<path d="M${x(minute)} 8V150" stroke="#e1e3df" stroke-dasharray="3 4"/><text x="${x(minute)}" y="170" text-anchor="${minute === record.start ? "start" : minute === record.end ? "end" : "middle"}">${sleepTime(minute)}</text>`).join("");
    const readout = selected === "all" ? '<div id="sleep-stage-readout" role="status"></div>' : `<div id="sleep-stage-readout" class="sleep-stage-readout" role="status"><div><strong>${SLEEP_STAGE_META[selected].label} · ${sleepDuration(record.totals[selected])}</strong><button type="button" data-action="sleep-stage:all">查看全部</button></div><p>${SLEEP_STAGE_META[selected].explanation}</p><ul aria-label="${SLEEP_STAGE_META[selected].label}时段">${record.segments.filter(item => item.stage === selected).map(item => `<li>${sleepTime(item.start)}–${sleepTime(item.end)}<span>${sleepDuration(item.duration)}</span></li>`).join("")}</ul></div>`;
    return `<section class="sleep-stage-panel"><div class="sleep-section-title"><h2>睡眠阶段</h2><span>阶段估算</span></div><svg class="sleep-stage-chart" viewBox="0 0 320 180" role="img" aria-label="${selected === "all" ? "整晚睡眠阶段" : `${SLEEP_STAGE_META[selected].label}时段已突出显示`}，${sleepTime(record.start)} 至 ${sleepTime(record.end)}"><g fill="none">${tickMarks}${segments}</g>${Object.entries(ys).map(([key, y]) => `<text x="0" y="${y + 4}">${SLEEP_STAGE_META[key].label}</text>`).join("")}</svg><p class="sleep-stage-hint">点选阶段，查看时段</p><div class="sleep-stage-choices" role="group" aria-label="选择睡眠阶段">${stageButtons}</div>${readout}</section>`;
  }
  function sleepDetailPage() {
    const date = sleepRecordDate();
    const active = isHardwareActive();
    const dated = date === state.healthDemoRecordDate;
    const available = active && dated && ["accumulating", "baseline", "interpretable"].includes(state.dataLifecycle);
    const limited = active && dated && state.dataLifecycle === "limited";
    const record = sleepReviewRecord();
    const selected = SLEEP_STAGE_META[state.sleepStage] ? state.sleepStage : "all";
    const heading = sleepDateHeader(date);
    if (!available) {
      const title = !active ? "连接戒指后，开始记录睡眠" : limited ? "这一晚的记录不完整" : "这一天还没有睡眠记录";
      const message = !active ? "戴着戒指睡一晚，醒来后打开 App 同步。" : limited ? "02:10–03:00 少了一段记录，暂不汇总整晚。" : "可以换个日期看看，已有记录不会受影响。";
      const action = !active ? ["连接 Halo Ring", "go:DEV-01", "primary"] : !dated && state.dataLifecycle !== "none" ? ["查看最近记录", "sleep-date:latest", "primary"] : ["查看连接与同步", "go:DEV-10", "primary"];
      return `<article class="sleep-detail health-dated-empty">${heading}<div class="sleep-empty"><span class="sleep-empty-icon" aria-hidden="true">${domainIcon("sleep")}</span><h2>${title}</h2><p>${message}</p>${limited ? '<small>这是记录缺口，不代表身体异常。</small>' : ""}</div>${buttons([action, ["返回健康数据", "go:HLT-00", "secondary"]])}</article>`;
    }
    const sunrise = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M2 18h20M6 18a6 6 0 0 1 12 0M12 2v3M4.2 6.2l2.1 2.1m11.4 0 2.1-2.1M2 12h3m14 0h3"/></svg>';
    return `<article class="sleep-detail">${heading}<section class="sleep-summary"><p>睡眠时长</p><div class="sleep-duration" aria-label="${sleepDuration(record.asleep)}"><b>${Math.floor(record.asleep / 60)}</b><span>小时</span><b>${record.asleep % 60}</b><span>分</span></div><p class="sleep-summary-note">夜里清醒 ${record.awakenings} 次，共 ${record.totals.awake} 分钟。</p><div class="sleep-times"><div>${domainIcon("sleep")}<span>入睡</span><strong>${sleepTime(record.start)}</strong></div><div>${sunrise}<span>醒来</span><strong>${sleepTime(record.end)}</strong></div></div></section>${sleepStagesChart(record, selected)}<div class="sleep-disclosures"><details><summary>怎么看睡眠阶段${healthChevron()}</summary><div><p>浅睡、深睡和 REM 会在一晚中交替出现，不是深睡越多就一定越好。</p>${Object.values(SLEEP_STAGE_META).map(item => `<p><strong>${item.label}</strong> · ${item.explanation}</p>`).join("")}<a href="https://www.nhlbi.nih.gov/health/sleep/stages-of-sleep" target="_blank" rel="noopener noreferrer">了解睡眠阶段 · NIH</a></div></details><details><summary>数据来源与说明${healthChevron()}</summary><div><p>Halo Ring · ${esc(healthDateLabel(date))}的睡眠记录<br>同步于 ${esc(healthDateLabel(date))} 08:44</p><p>按醒来日期归档。总睡眠由浅睡、深睡和 REM 相加，不包含清醒时间。</p><p>戒指估算的阶段仅供日常参考，不等同于医院的睡眠检查。</p>${state.dataLifecycle !== "interpretable" ? '<p>记录已经可以看，个人范围还在积累中，暂不与平时比较。</p>' : ""}<button class="text-button" data-action="go:DEV-10">查看连接与同步</button></div></details></div><section class="sleep-actions"><h2>今晚</h2>${buttons([["去夜间放松", "go:NIG-01", "primary"], ["调整睡眠目标", "go:SET-02", "secondary"]])}</section><p class="health-overview-boundary">用于日常健康管理，不替代医疗诊断。</p></article>`;
  }
  function energyRecordDate() { return state.healthDetailContext?.route === "TOD-06" ? state.healthDetailContext.date : beijingDateKey(); }
  function energyDataState() {
    const date = energyRecordDate();
    const active = isHardwareActive();
    const dated = date === state.healthDemoRecordDate;
    const hasReading = active && dated && ["accumulating", "baseline", "interpretable"].includes(state.dataLifecycle);
    return { date, active, dated, hasReading, canCompare: hasReading && state.dataLifecycle === "interpretable", limited: active && dated && state.dataLifecycle === "limited" };
  }
  function selectEnergyDate(date) {
    if (!validHealthDate(date) || state.current !== "TOD-06") return;
    state.healthSelectedDate = date;
    state.healthDetailContext = { date, metric: state.healthDetailContext?.metric === "hrv" ? "hrv" : "energy", route: "TOD-06" };
    render();
    screen.scrollTop = 0;
    capturePageView();
    persistAppProgress();
  }
  function energyRecordDisclosure(title = "记下此刻感受") {
    const recent = [...state.subjectiveRecords].slice(-3).reverse();
    const editor = state.recordDraft.reportMonth
      ? `<p>你还有一份月度回顾草稿，先继续那条记录。</p>${buttons([["继续回顾草稿", "go:TOD-02", "secondary"]])}`
      : `${subjectiveMarkers()}${recent.length ? `<div class="energy-user-records"><h3>最近的用户记录</h3>${recent.map(record => `<button type="button" data-action="record-detail:${esc(record.id)}"><span>${esc(record.label)}<small>${esc(record.occurredAt ? recordDateTime(record.occurredAt) : "未记录时间")}</small></span>${healthChevron()}</button>`).join("")}</div>` : ""}`;
    return `<details class="energy-record"><summary><span>${esc(title)}<small>保存为用户记录</small></span>${healthChevron()}</summary><div>${editor}</div></details>`;
  }
  function energyDetailPage() {
    const data = energyDataState();
    const { date, active, dated, hasReading, canCompare, limited } = data;
    const sleep = sleepReviewRecord();
    const title = canCompare ? "接近平时" : !active ? "连接戒指，开始记录" : !dated ? "这一天还没有记录" : limited ? "记录还不完整" : hasReading ? "个人范围建立中" : "等待第一晚记录";
    const description = canCompare ? (date === beijingDateKey() ? "今天先按计划，累了就歇一会儿。" : "这一晚的 HRV 和静息心率接近平时。") : !active ? "戴着戒指睡一晚，醒来后打开 App 同步。" : !dated ? "可以换个日期看看，已有记录不会受影响。" : limited ? "02:10–03:00 少了一段，暂不判断身体状态。" : hasReading ? "已有记录可以看，暂不与平时比较。" : "照常佩戴戒指，睡醒后同步。";
    const next = !active ? ["连接 Halo Ring", "go:DEV-01", "secondary"] : !dated && state.dataLifecycle !== "none" ? ["查看最近记录", "energy-date:latest", "secondary"] : hasReading ? ["查看建立进度", "go:HLT-00", "text-button"] : ["查看连接与同步", "go:DEV-10", "secondary"];
    const signals = !hasReading ? "" : `<section class="energy-evidence"><h2>${canCompare ? "这次参考了什么" : "已有的夜间记录"}</h2><div class="energy-evidence-panel"><section class="energy-hrv"><div class="energy-signal-row"><span class="energy-signal-icon" aria-hidden="true">${domainIcon("energy")}</span><span class="energy-signal-label"><strong>夜间 HRV</strong><small>戒指估算</small></span><span class="energy-signal-value"><b>42</b><small>ms</small><em>${canCompare ? "接近平时" : "暂不比较"}</em></span></div>${canCompare ? '<div class="energy-comparison" role="img" aria-label="HRV 与个人平时相比：接近平时。这里显示状态类别，不是评分或医学正常范围。"><span>比平时低</span><span class="is-current"><i aria-hidden="true"></i>接近平时</span><span>比平时高</span></div>' : ""}</section><div class="energy-signal-row"><span class="energy-signal-icon" aria-hidden="true">${domainIcon("heart")}</span><span class="energy-signal-label"><strong>夜间静息心率</strong><small>${canCompare ? "接近平时" : "暂不比较"}</small></span><span class="energy-signal-value"><b>58</b><small>次/分</small></span></div><button type="button" class="energy-signal-row energy-sleep-link" data-action="energy-open-sleep"><span class="energy-signal-icon" aria-hidden="true">${domainIcon("sleep")}</span><span class="energy-signal-label"><strong>睡眠</strong><small>清醒 ${sleep.awakenings} 次 · 共 ${sleep.totals.awake} 分钟</small></span><span class="energy-sleep-duration">${sleepDuration(sleep.asleep)}</span>${healthChevron()}</button></div><p class="energy-context-note">身体能量不只看 HRV，也要结合睡眠和你的感受。</p></section>`;
    return `<article class="energy-detail ${!hasReading ? "health-dated-empty" : ""}">${healthDetailDateHeader("身体能量", date, "energy")}<section class="energy-status"><img src="${HALO_SYMBOL}" alt="" width="40" height="48"><h2>${title}</h2><p>${description}</p>${canCompare ? "" : buttons([next])}</section>${signals}<div class="sleep-disclosures energy-disclosures"><section class="education-section">${hrvExplainer(data)}</section><details><summary>数据来源与说明${healthChevron()}</summary><div><p>${esc(healthDateLabel(date))} · Halo Ring</p><p>${hasReading ? `夜间 HRV 为戒指估算。静息心率和睡眠来自同一晚记录，已于 ${esc(healthDateLabel(date))} 08:44 同步。` : limited ? "这一晚记录有缺口，未用缺失片段推算整晚结果。" : !active ? "当前未连接戒指，未展示任何个人健康数值。" : "这一天还没有可用夜间记录。"}</p><p>只与同一种测量条件下的个人记录比较，不用别人的数字作标准。</p><p>身体能量是日常状态参考，不是剩余电量，也不能代替疾病诊断。</p>${buttons([["查看连接与同步", active ? "go:DEV-10" : "go:DEV-01", "text-button"]])}</div></details>${energyRecordDisclosure()}</div>${buttons([["去夜间放松", "go:NIG-01", "primary"]])}<p class="health-overview-boundary">用于日常健康管理，不替代医疗诊断。</p></article>`;
  }
  function activityRecordDate() { return state.healthDetailContext?.route === "TOD-07" ? state.healthDetailContext.date : beijingDateKey(); }
  function activityUpdatedLabel(date) {
    const receipt = state.activitySync.receipt;
    if (receipt?.date === date) {
      const time = new Date(receipt.at);
      const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(time);
      const clock = time.toLocaleTimeString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false, hour: "2-digit", minute: "2-digit" });
      return `${day === beijingDateKey() ? date === day ? "" : "今天 " : `${healthDateLabel(day)} `}${clock}`;
    }
    return `${date === beijingDateKey() ? "" : `${healthDateLabel(date)} `}08:44`;
  }
  function activitySyncError(inFlight = false) {
    if (!state.signedIn || !isHardwareActive()) return "连接并激活戒指后，再同步记录。";
    if (!state.toggles.bluetooth) return "蓝牙已关闭，开启后再试。";
    if (navigator.onLine === false) return "网络暂不可用，恢复网络后重试同步。";
    if (inFlight && state.deviceStatus !== "syncing") return "连接已中断，已有记录仍然保留。";
    if (inFlight && (state.deviceResetStatus === "pending" || state.measurementStatus === "running" || deviceMaintenance?.blocks() || deviceInfo?.isBusy() || deviceInfo?.unresolved() || ["downloading", "verifying"].includes(state.firmwareStatus))) return "戒指正在处理其他操作，请稍后重试。";
    return inFlight ? "" : deviceOperationUnavailable("sync");
  }
  function settleActivitySync(requestId) {
    const request = state.activitySync.request;
    if (request?.id !== requestId || request.status !== "pending") return false;
    const error = activitySyncError(true);
    if (!error && Date.now() < request.readyAt) return false;
    const failure = error || (request.outcome === "failed" ? "这次没有同步成功，请重试。" : "");
    request.status = failure ? "failed" : "complete";
    request.completedAt = new Date().toISOString();
    state.activitySync.blocked = Boolean(error);
    if (state.deviceStatus === "syncing") state.deviceStatus = request.previousDeviceStatus === "low" ? "low" : "connected";
    if (failure) state.activitySync.message = failure;
    else {
      state.deviceLastSyncedAt = request.completedAt;
      const hasRecords = ["accumulating", "baseline", "interpretable", "limited"].includes(state.dataLifecycle);
      // A mock response returns the same dated fixture; never mint steps or change its date.
      if (hasRecords) state.activitySync.receipt = { date: state.healthDemoRecordDate, at: request.completedAt };
      state.activitySync.message = "同步完成，没有新的活动记录。";
    }
    persistAppProgress();
    return true;
  }
  function resumeActivitySync() {
    clearTimeout(activitySyncTimer);
    const request = state.activitySync.request;
    if (request?.status !== "pending") return;
    if (settleActivitySync(request.id)) {
      if (state.current === "TOD-07") render();
      return;
    }
    activitySyncTimer = setTimeout(() => {
      if (settleActivitySync(request.id) && state.current === "TOD-07") render();
    }, Math.min(2147483647, Math.max(0, request.readyAt - Date.now())));
  }
  function startActivitySync() {
    if (state.current !== "TOD-07" || !state.signedIn || state.activitySync.request?.status === "pending") return;
    const error = activitySyncError();
    if (error) { state.activitySync.message = error; state.activitySync.blocked = true; return render(); }
    const startedAt = Date.now();
    state.activitySync.request = { id: `activity-sync-${startedAt}-${Math.random().toString(36).slice(2, 7)}`, status: "pending", startedAt, readyAt: startedAt + 1800, outcome: activitySyncReviewOutcome, previousDeviceStatus: state.deviceStatus, simulated: true };
    state.activitySync.message = "正在同步，可以继续浏览。";
    state.activitySync.blocked = false;
    state.deviceStatus = "syncing";
    render();
  }
  function activitySyncControls(hasReading, date) {
    const busy = state.deviceStatus === "syncing" || state.activitySync.request?.status === "pending";
    const failed = state.activitySync.request?.status === "failed" || state.activitySync.blocked;
    const currentError = failed && !busy ? activitySyncError() : "";
    const status = failed && !busy ? currentError || (state.activitySync.blocked ? "现在可以重试同步。" : state.activitySync.message) : state.activitySync.message;
    const recovery = currentError && isHardwareActive() && !state.toggles.bluetooth ? ["开启蓝牙", "PERM-01"]
      : currentError && navigator.onLine !== false && !["connected", "low", "syncing"].includes(state.deviceStatus) ? ["查看设备连接", "DEV-10"] : null;
    return `<section class="activity-sync" aria-label="活动同步"><div class="activity-sync-line">${hasReading ? `<span>更新于 ${esc(activityUpdatedLabel(date))}</span>` : '<span>尚无活动记录</span>'}${isHardwareActive() ? `<button type="button" data-action="activity-sync" ${busy ? "disabled" : ""}>${busy ? '<i class="activity-sync-spinner" aria-hidden="true"></i>同步中' : failed ? "重试同步" : "同步"}</button>` : ""}</div><p class="activity-sync-status" role="status" aria-live="polite">${esc(status)}</p>${recovery ? `<button type="button" class="text-button" data-action="go:${recovery[1]}">${recovery[0]}</button>` : ""}</section>`;
  }
  function activitySyncReviewControls(item) {
    if (item.id !== "TOD-07") return "";
    const busy = state.activitySync.request?.status === "pending";
    return `<section class="review-controls"><p>ACTIVITY REVIEW</p><h3>活动同步演示</h3><small>本地模拟，不连接真实硬件。成功只返回已有记录，不增加步数；1.8秒为演示等待。</small><div class="review-control-group"><strong>下一次同步结果</strong><div>${[["success", "正常完成"], ["failed", "同步失败"]].map(([value, label]) => `<button data-action="activity-sync-review:${value}" class="${activitySyncReviewOutcome === value ? "active" : ""}" ${busy ? "disabled" : ""}>${label}</button>`).join("")}</div></div></section>`;
  }
  function activityDraftValidation() {
    const draft = state.activityRecordDraft;
    if (draft.note.length > 500) return "最多写500字，请稍微缩短一下。";
    return draft.feeling || draft.note.trim() ? "" : "选一种感受，或写一句再保存。";
  }
  function updateActivityRecordControls() {
    const button = screen.querySelector('[data-action="activity-record-save"]');
    if (!button) return;
    const hint = activityDraftValidation();
    button.disabled = Boolean(hint);
    screen.querySelector("#activity-record-hint").textContent = activityRecordError || hint;
  }
  function activityRecordDisclosure() {
    const draft = state.activityRecordDraft;
    const today = healthDateLabel(beijingDateKey());
    const historical = activityRecordDate() !== beijingDateKey();
    const otherDraft = state.recordDraft.note.trim() || state.recordDraft.labels.length || state.recordDraft.reportMonth;
    const records = activityRecordsForScope();
    const dayCount = activityRecordsForScope("day").length;
    const hasDraft = Boolean(draft.feeling || draft.note.trim());
    return `<section class="activity-journal" aria-labelledby="activity-journal-title"><header><h2 id="activity-journal-title">活动感受</h2><span>用户记录</span></header><details class="activity-record" data-activity-section="record"><summary><span>${hasDraft ? "继续记录此刻" : "记录此刻"}<small>${hasDraft ? "有未保存的内容" : "活动后，感觉怎么样？"}</small></span>${healthChevron()}</summary><div><p class="activity-record-date">${historical ? `正在查看${esc(healthDateLabel(activityRecordDate()))}。这条感受将记在${esc(today)}。` : `这条感受将记在${esc(today)}。`}</p><div class="activity-feelings" role="group" aria-label="此刻活动后的感受">${ACTIVITY_FEELINGS.map(feeling => `<button type="button" data-action="activity-feeling:${feeling}" aria-pressed="${draft.feeling === feeling}">${feeling}</button>`).join("")}</div><label class="field-label" for="activity-record-note">想补充一句吗？<small>选填</small></label><textarea id="activity-record-note" class="field" maxlength="500" placeholder="比如：散步回来，感觉轻松了些。">${esc(draft.note)}</textarea><p id="activity-record-hint" class="activity-record-hint" role="status">${esc(activityRecordError || activityDraftValidation())}</p>${buttons([["保存感受", "activity-record-save", "secondary", Boolean(activityDraftValidation())]])}${otherDraft ? `<div class="activity-other-draft"><p>你还有一条${state.recordDraft.reportMonth ? "月度回顾" : "其他"}草稿。</p>${buttons([["继续原草稿", "record-new", "text-button"]])}</div>` : ""}</div></details><details class="activity-history" data-activity-section="history"><summary><span>查看记录<small>${esc(healthDateLabel(activityRecordDate()))} · ${dayCount ? `${dayCount} 条感受` : "还没有感受记录"}</small></span>${healthChevron()}</summary><div><div class="activity-record-filters" role="group" aria-label="活动感受范围">${[["day", "当日记录"], ["all", "全部记录"]].map(([value, label]) => `<button type="button" data-action="activity-records-scope:${value}" aria-pressed="${state.activityRecordsScope === value}">${label}</button>`).join("")}</div><section class="energy-user-records activity-user-records"><h3>${state.activityRecordsScope === "all" ? "全部活动感受" : `${esc(healthDateLabel(activityRecordDate()))}的感受`}</h3>${records.length ? records.map(record => `<button type="button" data-action="record-detail:${esc(record.id)}"><span>${esc(record.label)}<small>${esc(record.occurredAt ? recordDateTime(record.occurredAt) : "未记录时间")} · 用户记录</small></span>${healthChevron()}</button>`).join("") : `<p>${state.activityRecordsScope === "all" ? "还没有保存过活动感受。" : "这一天还没有感受记录，可以切换到全部记录。"}</p>`}</section></div></details></section>`;
  }
  function activityRecordsForScope(scope = state.activityRecordsScope) {
    return state.subjectiveRecords.filter(record => {
      if (record.category !== "activity") return false;
      if (scope === "all") return true;
      if (!record.occurredAt) return false;
      const date = /^\d{4}-\d{2}-\d{2}$/.test(record.occurredAt) ? record.occurredAt : Number.isFinite(Date.parse(record.occurredAt)) ? beijingDateKey(new Date(record.occurredAt)) : "";
      return date === activityRecordDate();
    }).slice().sort((a, b) => String(b.occurredAt || "").localeCompare(String(a.occurredAt || "")));
  }
  function saveActivityRecord() {
    if (state.current !== "TOD-07" || !state.signedIn) return;
    const validation = activityDraftValidation();
    if (validation) { activityRecordError = validation; return updateActivityRecordControls(); }
    const draft = state.activityRecordDraft;
    draft.id ||= `activity-record-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const record = { id: draft.id, category: "activity", label: draft.feeling || "活动感受", labels: draft.feeling ? [draft.feeling] : [], original: draft.note.trim(), occurredAt: new Date().toISOString(), source: "user-record" };
    const previousError = state.recordEditorError;
    const committed = state.subjectiveRecords.some(item => item.id === draft.id) || commitUserRecords([...state.subjectiveRecords, record]);
    if (!committed) activityRecordError = "这次没保存成功，内容还在，请重试。";
    state.recordEditorError = previousError;
    if (!committed) return updateActivityRecordControls();
    state.activityRecordDraft = { id: "", feeling: "", note: "" };
    activityRecordError = "";
    state.activityRecordsScope = activityRecordDate() === beijingDateKey() ? "day" : "all";
    render();
    screen.querySelector(".activity-record").open = false;
    screen.querySelector(".activity-history").open = true;
    capturePageView(); persistAppProgress();
    flash("活动感受已保存");
  }
  function showActivityRecords() {
    const records = state.subjectiveRecords.filter(record => record.category === "activity").slice().sort((a, b) => String(b.occurredAt || "").localeCompare(String(a.occurredAt || "")));
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal" aria-labelledby="activity-records-title"><header class="modal-title-row"><h2 id="activity-records-title">活动感受</h2><button class="text-button" data-action="close-modal">关闭</button></header><div class="activity-record-list">${records.map(record => setting(record.label, `用户记录 · ${record.occurredAt ? recordDateTime(record.occurredAt) : "未记录时间"}`, `record-detail:${record.id}`)).join("") || '<p>还没有活动感受。</p>'}</div></section></div>`;
  }
  function activityDataState() {
    const date = activityRecordDate();
    const active = isHardwareActive();
    const dated = date === state.healthDemoRecordDate;
    // Night-time gaps do not invalidate the activity fragments already synchronized.
    const hasReading = active && dated && ["accumulating", "baseline", "interpretable", "limited"].includes(state.dataLifecycle);
    return { date, active, dated, hasReading, limited: hasReading && state.dataLifecycle === "limited" };
  }
  function selectActivityDate(date) {
    if (!validHealthDate(date) || state.current !== "TOD-07") return;
    state.healthSelectedDate = date;
    state.healthDetailContext = { date, metric: "activity", route: "TOD-07" };
    render();
    screen.scrollTop = 0;
    capturePageView();
    persistAppProgress();
  }
  function activityDetailPage() {
    const { date, active, dated, hasReading, limited } = activityDataState();
    const walking = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="13" cy="4" r="2"/><path d="m7 13 1-4 4-2 4 4 4 1M12 8l-1 6 4 3 1 5M11 14l-4 8"/></svg>';
    const flame = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c1 5-6 6-6 12a6 6 0 0 0 12 0c0-3-2-5-2-5 0 3-2 4-2 4 1-5-2-11-2-11Z"/><path d="M12 14c0 3-3 3-2 6m3 1c2-2 0-4 0-4"/></svg>';
    const missingTitle = !active ? "连接戒指，开始记录活动" : "这一天还没有活动记录";
    const missingText = !active ? "戴上戒指，日常走动也会留下记录。" : "暂无记录不等于没有活动，可以换个日期看看。";
    const next = !active ? ["连接 Halo Ring", "go:DEV-01", "primary"] : !dated && state.dataLifecycle !== "none" ? ["查看最近记录", "activity-date:latest", "primary"] : ["查看连接与同步", "go:DEV-10", "primary"];
    const summary = hasReading
      ? `<section class="activity-summary"><span class="activity-summary-icon" aria-hidden="true">${walking}</span><p>已同步步数</p><div class="activity-step-count" aria-label="已同步4862步"><strong>4,862</strong><span>步</span></div>${activitySyncControls(true, date)}</section><section class="activity-calories"><span class="activity-calorie-icon">${flame}</span><span><strong>活动消耗</strong><small>戒指估算</small></span><span class="activity-calorie-value"><b>284</b><small>千卡</small></span></section>${limited ? '<p class="activity-partial">目前只有已同步片段，不代表全天活动。</p>' : ""}`
      : `<section class="sleep-empty"><span class="sleep-empty-icon" aria-hidden="true">${walking}</span><h2>${missingTitle}</h2><p>${missingText}</p></section>${active ? activitySyncControls(false, date) : ""}${buttons([next])}`;
    const source = hasReading ? `来自 Halo Ring · ${esc(healthDateLabel(date))}<br>更新于 ${esc(activityUpdatedLabel(date))}` : !active ? "连接戒指后，这里会显示活动记录。" : "这一天还没有可用的活动记录。";
    return `<article class="activity-detail ${hasReading ? "" : "health-dated-empty"}">${healthDetailDateHeader("活动", date, "activity")}${summary}<div class="sleep-disclosures activity-disclosures">${activityRecordDisclosure()}<button type="button" class="activity-energy-link" data-action="activity-open-energy"><span>身体能量<small>${date === beijingDateKey() ? "看看今天的身体状态" : "看看这一天的身体状态"}</small></span>${healthChevron()}</button><details class="activity-source" data-activity-section="source"><summary>数据来源与说明${healthChevron()}</summary><div><p>${source}</p><p>尚未同步的活动可能未计入，未佩戴时也可能少记。</p><p>步数不能反映所有类型的活动，活动消耗为估算值，仅作日常参考。</p>${buttons([["查看连接与同步", active ? "go:DEV-10" : "go:DEV-01", "text-button"]])}</div></details></div><p class="health-overview-boundary">用于日常健康管理，不替代医疗诊断。</p></article>`;
  }
  let disposeHeartTrend = () => {};
  function heartRecordDate() { return state.healthDetailContext?.route === "HLT-01" ? state.healthDetailContext.date : beijingDateKey(); }
  function heartDataModel(date = heartRecordDate()) { return window.HALO_HEART_TREND.model({ date, recordDate: state.healthDemoRecordDate, stage: state.dataLifecycle, active: isHardwareActive() }); }
  function heartReturnContext() { return { route: "HLT-01", date: heartRecordDate(), view: { ...state.pageViews["HLT-01"] }, trendSelection: state.heartTrendSelection ? { ...state.heartTrendSelection } : null }; }
  function selectHeartDate(date) {
    if (!validHealthDate(date) || state.current !== "HLT-01") return;
    state.healthSelectedDate = date;
    state.healthDetailContext = { date, metric: "heart", route: "HLT-01" };
    render(); screen.scrollTop = 0; capturePageView(); persistAppProgress();
  }
  function heartDetailPage() {
    const date = heartRecordDate();
    const active = isHardwareActive();
    const dated = date === state.healthDemoRecordDate;
    const model = heartDataModel(date);
    const hasReading = Boolean(model.latest);
    const partial = hasReading && model.partial;
    const reading = { latest: model.latest?.value, measuredAt: model.latest?.time, dayResting: model.resting.day, nightResting: model.resting.night };
    const emptyAction = !active ? ["连接 Halo Ring", "go:DEV-01", "primary"] : !dated && state.dataLifecycle !== "none" ? ["查看最近记录", "heart-date:latest", "primary"] : ["查看连接与同步", "go:DEV-10", "primary"];
    const summary = hasReading
      ? `<section class="heart-summary"><span class="heart-summary-icon" aria-hidden="true">${domainIcon("heart")}</span><p>最近一次</p><div class="heart-reading"><strong>${reading.latest}</strong><span>次/分</span></div><p class="heart-measured-at"><time datetime="${date}T${reading.measuredAt}:00+08:00">${reading.measuredAt} 采集</time><span>非实时读数</span></p><button type="button" class="heart-sync-link" data-action="go:DEV-10">查看连接与同步 ${healthChevron()}</button></section>${window.HALO_HEART_TREND.render(model)}${partial ? '<p class="heart-partial">已保留这一条读数，其他时段的记录还不完整。</p>' : `<section class="heart-resting" aria-labelledby="heart-resting-title"><h2 id="heart-resting-title">静息摘要</h2><div><span><span>日间静息</span><strong>${reading.dayResting === null ? "—" : reading.dayResting}<small>次/分</small></strong></span><span><span>夜间静息</span><strong>${reading.nightResting === null ? "—" : reading.nightResting}<small>次/分</small></strong></span></div></section>`}`
      : `<section class="sleep-empty"><span class="sleep-empty-icon" aria-hidden="true">${domainIcon("heart")}</span><h2>${!active ? "连接戒指，开始记录心率" : "这一天还没有心率记录"}</h2><p>${!active ? "已有的感受记录仍可查看和补充。" : "可以换个日期看看，或查看戒指的同步情况。"}</p></section>${buttons([emptyAction])}`;
    const hasDraft = Boolean(state.recordDraft.labels.length || state.recordDraft.note.trim());
    const recordLabel = hasDraft ? state.recordDraft.reportMonth ? "继续月度回顾草稿" : "继续未保存的记录" : "记下此刻感受";
    const records = state.subjectiveRecords.filter(record => record.category !== "rhythm").slice().sort((a, b) => String(b.occurredAt || "").localeCompare(String(a.occurredAt || "")));
    const source = hasReading ? `演示记录 · Halo Ring · ${esc(healthDateLabel(date))}<br>最近一次采集于 ${reading.measuredAt}。${partial ? "当前只有部分记录。" : "单次读数与静息摘要分开显示。"}` : "所选日期暂无可用心率读数，不显示数值或趋势。";
    return `<article class="heart-detail${hasReading ? "" : " health-dated-empty"}">${healthDetailDateHeader("心率", date, "heart")}${summary}<section class="heart-journal"><button type="button" class="heart-record-entry" data-action="record-new"><span><strong>${recordLabel}</strong><small>用户记录 · 按保存时间记录</small></span>${healthChevron()}</button><details class="heart-records"><summary><span>我的感受记录<small>${records.length ? `共 ${records.length} 条 · 不限日期` : "还没有保存过记录"}</small></span>${healthChevron()}</summary><div class="energy-user-records">${records.slice(0, 3).map(record => `<button type="button" data-action="record-detail:${esc(record.id)}"><span>${esc(record.label)}<small>${esc(record.occurredAt ? recordDateTime(record.occurredAt) : "未记录时间")} · 用户记录</small></span>${healthChevron()}</button>`).join("") || '<p>想记的时候，点上方“记下此刻感受”。</p>'}${records.length > 3 ? buttons([["查看全部记录", "bw-records", "text-button"]]) : ""}${state.recordEditDraft ? buttons([["继续上次未保存的修改", `record-edit:${state.recordEditDraft.id}`, "text-button"]]) : ""}</div></details></section><div class="sleep-disclosures heart-disclosures"><details><summary>数据来源与说明${healthChevron()}</summary><div><p>${source}</p>${hasReading ? '<p>图中的空白处表示没有记录，不是心率为零。</p>' : ""}<p>同步时间与采集时间可能不同，请留意读数旁的时间。</p>${buttons([[active ? "查看连接与同步" : "连接 Halo Ring", active ? "go:DEV-10" : "go:DEV-01", "text-button"]])}</div></details></div><p class="health-overview-boundary">用于日常健康管理，不替代医疗诊断。</p></article>`;
  }
  let disposeRespirationTrend = () => {};
  function respirationRecordDate() { return state.healthDetailContext?.route === "HLT-02" ? state.healthDetailContext.date : beijingDateKey(); }
  function respirationDataModel(date = respirationRecordDate()) {
    const end = state.respirationWindowEnd;
    const windowEnd = validHealthDate(end) && date <= end && date >= window.HALO_RESPIRATION_TREND.shiftDate(end, -6) ? end : date;
    return window.HALO_RESPIRATION_TREND.model({ date, windowEnd, recordDate: state.healthDemoRecordDate, stage: state.dataLifecycle, active: isHardwareActive() });
  }
  function respirationReturnContext() { return { route: "HLT-02", date: respirationRecordDate(), windowEnd: respirationDataModel().windowEnd, view: { ...state.pageViews["HLT-02"] } }; }
  function selectRespirationDate(date, keepWindow = false) {
    if (!validHealthDate(date) || state.current !== "HLT-02") return;
    capturePageView();
    state.respirationWindowEnd = keepWindow ? respirationDataModel().windowEnd : date;
    state.healthSelectedDate = date;
    state.healthDetailContext = { date, metric: "breath", route: "HLT-02" };
    render();
    if (!keepWindow) screen.scrollTop = 0;
    capturePageView(); persistAppProgress();
  }
  function respirationDetailPage() {
    const date = respirationRecordDate();
    const active = isHardwareActive();
    const model = respirationDataModel();
    const value = model.selected.value;
    const hasReading = Number.isFinite(value);
    const limited = active && date === state.healthDemoRecordDate && state.dataLifecycle === "limited";
    const shortDate = day => `${Number(day.slice(5, 7))}月${Number(day.slice(8))}日`;
    const nightLabel = `${shortDate(window.HALO_RESPIRATION_TREND.shiftDate(date, -1))}晚—${shortDate(date)}晨`;
    const action = !active ? ["连接 Halo Ring", "go:DEV-01", "primary"] : limited || !model.latest ? ["查看连接与同步", "go:DEV-10", "secondary"] : ["查看最近记录", "respiration-date:latest", "secondary"];
    const summary = hasReading
      ? `<section class="respiration-summary heart-summary"><span class="heart-summary-icon" aria-hidden="true">${domainIcon("breath")}</span><p>夜间平均</p><div class="heart-reading" id="respiration-reading"><strong>${value.toFixed(1)}</strong><span>次/分</span></div><p class="respiration-night">${nightLabel}</p><button type="button" class="heart-sync-link" data-action="go:DEV-10">查看连接与同步 ${healthChevron()}</button></section>`
      : `<section class="respiration-empty${model.hasAny ? " has-history" : ""}"><span class="heart-summary-icon" aria-hidden="true">${domainIcon("breath")}</span><h2>${!active ? "连接戒指，开始记录" : limited ? "这一晚的记录不完整" : "这一晚暂无呼吸率记录"}</h2><p>${!active ? "戴着戒指睡一晚，醒来后打开 App 同步。" : limited ? "暂不估算整晚平均值。可以查看同步情况。" : "可以换一晚看看，已有记录仍然保留。"}</p>${buttons([action])}</section>`;
    const hasDraft = Boolean(state.recordDraft.labels.length || state.recordDraft.note.trim());
    const recordLabel = hasDraft ? state.recordDraft.reportMonth ? "继续月度回顾草稿" : "继续未保存的记录" : "记下此刻感受";
    const records = state.subjectiveRecords.filter(record => record.category !== "rhythm").slice().sort((a, b) => String(b.occurredAt || "").localeCompare(String(a.occurredAt || "")));
    return `<article class="respiration-detail">${healthDetailDateHeader("夜间呼吸率", date, "respiration")}${date !== beijingDateKey() ? '<button type="button" class="respiration-today" data-action="respiration-date:today">回到今天</button>' : ""}${summary}${window.HALO_RESPIRATION_TREND.render(model)}${active ? `<button type="button" class="respiration-sleep-link heart-record-entry" data-action="respiration-open-sleep"><span><strong>查看这一晚的睡眠</strong><small>${nightLabel}</small></span>${healthChevron()}</button>` : ""}<div class="sleep-disclosures respiration-disclosures"><details><summary>如何理解呼吸率${healthChevron()}</summary><div><p>夜间呼吸率，是你睡着时平均每分钟呼吸的次数。</p><p>重点看自己连续几晚的变化，单晚数字不能用来判断是否健康。更高或更低，都不直接等于更健康。</p></div></details></div><section class="heart-journal respiration-journal"><button type="button" class="heart-record-entry" data-action="record-new"><span><strong>${recordLabel}</strong><small>用户记录 · 按保存时间记录</small></span>${healthChevron()}</button><details class="heart-records"><summary><span>我的感受记录<small>${records.length ? `共 ${records.length} 条 · 不限日期` : "还没有保存过记录"}</small></span>${healthChevron()}</summary><div class="energy-user-records">${records.slice(0, 3).map(record => `<button type="button" data-action="record-detail:${esc(record.id)}"><span>${esc(record.label)}<small>${esc(record.occurredAt ? recordDateTime(record.occurredAt) : "未记录时间")} · 用户记录</small></span>${healthChevron()}</button>`).join("") || '<p>想记的时候，点上方“记下此刻感受”。</p>'}${records.length > 3 ? buttons([["查看全部记录", "bw-records", "text-button"]]) : ""}${state.recordEditDraft ? buttons([["继续上次未保存的修改", `record-edit:${state.recordEditDraft.id}`, "text-button"]]) : ""}</div></details></section><div class="sleep-disclosures respiration-disclosures"><details><summary>数据来源与说明${healthChevron()}</summary><div><p>${hasReading ? `${esc(healthDateLabel(date))}醒来的这一晚 · Halo Ring · 示例数据` : "所选夜晚没有可用的整晚平均值。"}</p><p>按醒来日期查看。每个点代表一晚的平均值，空白表示没有有效记录，不是呼吸率为零。</p><p>示例数值仅用于体验交互，不代表你的实际测量结果。个人范围尚未建立时，仍可查看已有读数。</p>${buttons([[active ? "查看连接与同步" : "连接 Halo Ring", active ? "go:DEV-10" : "go:DEV-01", "text-button"]])}</div></details></div><p class="health-overview-boundary">用于日常健康管理，不替代医疗诊断。</p></article>`;
  }
  let disposeOxygenTrend = () => {};
  let disposeOxygenDay = () => {};
  let disposeTemperatureTrend = () => {};
  const TEMPERATURE_SCENARIOS = ["supported", "baseline", "quality", "unknown", "unsupported"];
  function temperatureRecordDate() { return state.healthDetailContext?.route === "HLT-06" && validHealthDate(state.healthDetailContext.date) ? state.healthDetailContext.date : beijingDateKey(); }
  function temperatureAllowed() { return state.signedIn && state.authVerified && state.healthDeletionStatus === "ready" && state.accountDeletionStatus === "ready"; }
  function temperatureDataModel(date = temperatureRecordDate()) {
    const end = state.temperatureWindowEnd;
    const windowEnd = validHealthDate(end) && date <= end && date >= window.HALO_TEMPERATURE_TREND.shiftDate(end, -6) ? end : date;
    const data = window.HALO_TEMPERATURE_TREND.model({ date, windowEnd, recordDate: state.healthDemoRecordDate, active: isHardwareActive(), hasRecords: temperatureAllowed() && state.dataLifecycle !== "none", scenario: state.temperatureReviewScenario });
    if (!temperatureAllowed()) data.selected.reason = "privacy";
    return data;
  }
  function temperatureReturnContext() { return { route: "HLT-06", date: temperatureRecordDate(), windowEnd: temperatureDataModel().windowEnd, view: { ...state.pageViews["HLT-06"] } }; }
  function selectTemperatureDate(date, keepWindow = false) {
    if (!validHealthDate(date) || state.current !== "HLT-06") return;
    const refocus = document.activeElement?.id === "temperature-trend-plot";
    capturePageView();
    state.temperatureWindowEnd = keepWindow ? temperatureDataModel().windowEnd : date;
    state.healthSelectedDate = date;
    state.healthDetailContext = { date, metric: "temperature", route: "HLT-06" };
    render();
    if (!keepWindow) screen.scrollTop = 0;
    if (refocus) screen.querySelector("#temperature-trend-plot")?.focus({ preventScroll: true });
    capturePageView(); persistAppProgress();
  }
  function temperatureDetailPage() {
    const data = temperatureDataModel(), date = data.date, value = data.selected.value;
    const ready = Number.isFinite(value), active = isHardwareActive(), allowed = temperatureAllowed();
    const short = day => `${Number(day.slice(5, 7))}月${Number(day.slice(8))}日`;
    const night = `${short(window.HALO_TEMPERATURE_TREND.shiftDate(date, -1))}晚—${short(date)}晨`;
    const empty = {
      privacy: ["记录暂不可查看", "请先查看数据处理状态。", "查看数据与隐私", "go:SET-01"],
      unbound: ["连接戒指，开始记录", "连接后，可查看这款戒指支持的数据类型。", "连接 Halo Ring", "go:DEV-01"],
      unknown: ["皮肤温度功能待确认", "暂时无法确认这款戒指是否支持皮肤温度记录。", "查看设备信息", "go:DEV-11"],
      unsupported: ["当前戒指不支持皮肤温度", "其他已支持的功能不受影响。", "查看设备信息", "go:DEV-11"],
      baseline: ["正在了解你的平时温度", "已有皮肤温度记录，个人基线建立后再显示相对变化。", "了解个人基线", "temperature-baseline"],
      quality: ["这一晚的记录不完整", "暂不估算整晚变化。已有的历史记录仍可查看。", "查看连接与同步", "go:DEV-10"],
    }[data.selected.reason] || ["这一晚暂无温度记录", "可以换一晚看看，或查看连接与同步情况。", data.latest ? "查看最近记录" : "查看连接与同步", data.latest ? "temperature-date:latest" : "go:DEV-10"];
    const summary = ready ? `<section class="temperature-summary heart-summary"><p>夜间皮肤温度 · 相对平时</p><div class="heart-reading"><strong>${window.HALO_TEMPERATURE_TREND.formatValue(value)}</strong><span>°C</span></div><p>${value === 0 ? "与自己的平时水平一致" : value > 0 ? "高于自己的平时水平" : "低于自己的平时水平"}</p><p class="temperature-night">${night}</p><small class="temperature-demo">示例数据 · 不是体温计读数</small></section>` : `<section class="temperature-empty"><h2>${empty[0]}</h2><p>${empty[1]}</p>${buttons([[empty[2], empty[3], "secondary"]])}</section>`;
    const draft = Boolean(state.recordDraft.labels.length || state.recordDraft.note.trim());
    const records = state.subjectiveRecords.filter(record => record.category !== "rhythm").slice().sort((a, b) => String(b.occurredAt || "").localeCompare(String(a.occurredAt || "")));
    return `<article class="temperature-detail">${healthDetailDateHeader("皮肤温度", date, "temperature")}${date !== beijingDateKey() ? '<button type="button" class="oxygen-today" data-action="temperature-date:today">回到今天</button>' : ""}${summary}${window.HALO_TEMPERATURE_TREND.render(data)}${active && allowed ? `<button type="button" class="heart-record-entry temperature-sleep-link" data-action="temperature-open-sleep"><span><strong>查看这一晚的睡眠</strong><small>${night}</small></span>${healthChevron()}</button>` : ""}<div class="sleep-disclosures"><details><summary>这个数值怎么看${healthChevron()}</summary><div><p>这里显示的是皮肤温度相对你平时水平的变化，不是身体的实际体温。</p><p>正数表示比平时高，负数表示比平时低；0 表示接近平时，不是体温为零。高或低都不直接代表生病。</p><p>睡眠环境、佩戴情况和身体状态都可能影响皮肤温度。看连续几晚的变化，比只看一个数字更有意义。</p></div></details><button type="button" class="oxygen-safety-link" data-action="temperature-help"><span>感觉发热或不舒服？</span>${healthChevron()}</button></div>${allowed ? `<section class="heart-journal"><button type="button" class="heart-record-entry" data-action="record-new"><span><strong>${draft ? "继续未保存的记录" : "记下此刻感受"}</strong><small>用户记录 · 按保存时间记录</small></span>${healthChevron()}</button><details class="heart-records"><summary><span>我的感受记录<small>${records.length ? `共 ${records.length} 条 · 不限日期` : "还没有保存过记录"}</small></span>${healthChevron()}</summary><div class="energy-user-records">${records.slice(0, 3).map(record => `<button type="button" data-action="record-detail:${esc(record.id)}"><span>${esc(record.label)}<small>${esc(record.occurredAt ? recordDateTime(record.occurredAt) : "未记录时间")} · 用户记录</small></span>${healthChevron()}</button>`).join("") || "<p>想记的时候，点上方“记下此刻感受”。</p>"}${records.length > 3 ? buttons([["查看全部记录", "bw-records", "text-button"]]) : ""}${state.recordEditDraft ? buttons([["继续上次未保存的修改", `record-edit:${state.recordEditDraft.id}`, "text-button"]]) : ""}</div></details></section>` : ""}<div class="sleep-disclosures"><details><summary>数据来源与说明${healthChevron()}</summary><div><p>${esc(healthDateLabel(date))}醒来的这一晚 · Halo Ring · 示例数据</p><p>图中 0 线代表个人基线，不是正常体温线。每个点是一晚的相对变化，缺失留空，不按零计算。</p><p>皮肤温度的个人基线与 Body Weather 的建立进度分开判断。基线未建立时，不提前显示相对变化。</p><p>本页示例未接入真实设备，不用于判断发热、排卵或激素水平。</p>${buttons([[allowed ? active ? "查看连接与同步" : "连接 Halo Ring" : "查看数据与隐私", allowed ? active ? "go:DEV-10" : "go:DEV-01" : "go:SET-01", "text-button"]])}</div></details></div><p class="health-overview-boundary">用于日常健康管理，不替代医疗诊断。</p></article>`;
  }
  function temperatureReviewControls() {
    return `<section class="oxygen-review-controls"><h3>皮肤温度审阅示例</h3><small>仅切换演示，不确认量产能力。温度个人基线独立于 Body Weather；默认功能待确认。</small><div class="review-control-group"><div>${[["supported", "相对变化可用"], ["baseline", "温度基线建立中"], ["quality", "当晚记录不足"], ["unknown", "功能待确认"], ["unsupported", "设备不支持"]].map(([key, label]) => `<button type="button" data-action="temperature-review:${key}" class="${state.temperatureReviewScenario === key ? "active" : ""}">${label}</button>`).join("")}</div></div></section>`;
  }
  const OXYGEN_SCENARIOS = ["supported", "unknown", "unsupported", "off", "quality"];
  function oxygenRecordDate() { return state.healthDetailContext?.route === "HLT-05" ? state.healthDetailContext.date : beijingDateKey(); }
  function oxygenDataModel(date = oxygenRecordDate()) {
    const end = state.oxygenWindowEnd;
    const windowEnd = validHealthDate(end) && date <= end && date >= window.HALO_OXYGEN_TREND.shiftDate(end, -6) ? end : date;
    return window.HALO_OXYGEN_TREND.model({ date, windowEnd, recordDate: state.healthDemoRecordDate, stage: state.dataLifecycle, active: isHardwareActive(), scenario: OXYGEN_SCENARIOS.includes(state.oxygenReviewScenario) ? state.oxygenReviewScenario : "unknown" });
  }
  function oxygenReturnContext() { return { route: "HLT-05", date: oxygenRecordDate(), windowEnd: oxygenDataModel().windowEnd, mode: state.oxygenMode, daySelection: state.oxygenDaySelection, view: { ...state.pageViews["HLT-05"] } }; }
  function oxygenDayModel(date = oxygenRecordDate()) {
    return window.HALO_OXYGEN_DAY.model({ date, recordDate: state.healthDemoRecordDate, stage: state.dataLifecycle, active: isHardwareActive(), scenario: state.oxygenReviewScenario, manualRecords: oxygenMeasurement?.records() || [], selection: state.oxygenDaySelection });
  }
  function oxygenModeControls() {
    return `<div class="oxygen-modes" role="group" aria-label="血氧记录类型">${[["day", "当日记录"], ["night", "睡眠血氧"]].map(([mode, label]) => `<button type="button" data-action="oxygen-mode:${mode}" aria-pressed="${state.oxygenMode === mode}">${label}</button>`).join("")}</div>`;
  }
  function oxygenMeasurementEntry() {
    const request = oxygenMeasurement?.request();
    const resumable = request && request.status !== "complete";
    const unavailable = resumable ? "" : oxygenMeasurementUnavailable();
    return `<section class="oxygen-measure-entry">${buttons([[resumable ? "继续本次测量" : "测一次血氧", resumable ? "go:HLT-04" : "oxygen-measure:start", "secondary", Boolean(unavailable)]])}${unavailable ? `<p>${esc(unavailable)}</p>` : `<p>${oxygenRecordDate() !== beijingDateKey() ? "测量此刻血氧，结果会记在今天。" : "保持手部安静 · 原型演示"}</p>`}${oxygenMeasurement?.message() ? `<p class="oxygen-measure-error" role="alert">${esc(oxygenMeasurement.message())}</p>` : ""}</section>`;
  }
  function oxygenDaySummary(data) {
    const point = data.latest;
    if (point) return `<section class="oxygen-day-summary heart-summary"><p>当日最近一次 · SpO₂</p><div class="heart-reading" id="oxygen-reading"><strong>${point.value}</strong><span>%</span></div><p class="oxygen-point-time">${point.time} · ${point.kind === "manual" ? "主动测量" : "自动记录"}</p><p class="oxygen-sample-label">示例数据 · 非实时读数</p></section>`;
    const copy = {
      unbound: ["先连接 Halo Ring", "连接后，可查看设备支持的数据类型。", "连接 Halo Ring", "go:DEV-01"],
      unknown: ["血氧功能待确认", "暂时无法确认这款戒指是否支持血氧记录。", "查看设备信息", "go:DEV-11"],
      unsupported: ["当前戒指不支持血氧记录", "其他已支持的功能不受影响。", "查看设备信息", "go:DEV-11"],
      off: ["当天没有自动记录", "自动记录未开启，已保存的主动测量仍可查看。", "查看设备信息", "go:DEV-11"],
      quality: ["当天的自动记录不足", "暂不展示无效读数，已保存的主动测量仍可查看。", "查看连接与同步", "go:DEV-10"],
    }[data.reason] || ["当天暂无血氧记录", "可以换一天看看，或查看连接与同步情况。", "查看连接与同步", "go:DEV-10"];
    return `<section class="oxygen-empty"><h2>${copy[0]}</h2><p>${copy[1]}</p>${buttons([[copy[2], copy[3], "secondary"]])}</section>`;
  }
  function oxygenDayRecords(data) {
    if (!data.samples.length) return "";
    return `<details class="oxygen-record-list"><summary><span>当日全部记录 <small>${data.samples.length} 条</small></span>${healthChevron()}</summary><div>${data.samples.slice().reverse().map(point => `<button type="button" data-action="oxygen-reading:${esc(point.id)}"><span><strong>${point.time}</strong><small>${point.kind === "manual" ? "主动测量" : "自动记录"} · 示例数据</small></span><b>${point.value}%</b>${healthChevron()}</button>`).join("")}</div></details>`;
  }
  function oxygenPlotBody(night) {
    if (state.oxygenMode === "day") {
      const data = oxygenDayModel();
      return `${window.HALO_OXYGEN_DAY.render(data)}${oxygenDayRecords(data)}`;
    }
    return `${night.scenario === "off" && Number.isFinite(night.selected.value) ? '<p class="oxygen-status-note">睡眠血氧记录未开启，当前查看的是已保存的历史示例。</p>' : ""}${window.HALO_OXYGEN_TREND.render(night)}`;
  }
  function returnFromOxygenMeasurement(context, record, push = false) {
    if (record) {
      const date = new Date(Date.parse(record.occurredAt) + 8 * 3600000).toISOString().slice(0, 10);
      restoreHealthDetailReturn({ route: "HLT-05", date, mode: "day", daySelection: { date, id: record.id }, windowEnd: date, view: { top: 0, open: [], oxygenMode: "day" } });
      return go("HLT-05", push);
    }
    if (restoreHealthDetailReturn(context)) return go("HLT-05", false);
    return go("HLT-03", false);
  }
  function selectOxygenDate(date, keepWindow = false) {
    if (!validHealthDate(date) || state.current !== "HLT-05") return;
    capturePageView();
    state.oxygenWindowEnd = keepWindow ? oxygenDataModel().windowEnd : date;
    state.healthSelectedDate = date;
    state.healthDetailContext = { date, metric: "oxygen", route: "HLT-05" };
    render(); if (!keepWindow) screen.scrollTop = 0; capturePageView(); persistAppProgress();
  }
  function oxygenEmptyCopy(model) {
    const copies = {
      unbound: ["先连接 Halo Ring", "连接后，可查看设备支持的数据类型。", "连接 Halo Ring", "go:DEV-01"],
      unknown: ["血氧功能待确认", "暂时无法确认这款戒指是否支持血氧记录。", "查看设备信息", "go:DEV-11"],
      unsupported: ["当前戒指不支持血氧记录", "其他已支持的功能不受影响。", "查看设备信息", "go:DEV-11"],
      off: ["夜间血氧记录未开启", "已有历史记录仍可查看。可前往设备信息了解当前支持情况。", "查看设备信息", "go:DEV-11"],
      quality: ["这一晚的记录不足", "暂不汇总整晚平均值，其他夜晚的有效记录仍可查看。", "查看连接与同步", "go:DEV-10"],
    };
    return copies[model.selected.reason] || ["这一晚暂无血氧记录", "可以换一晚看看，或查看同步情况。", model.latest ? "查看最近记录" : "查看连接与同步", model.latest ? "oxygen-date:latest" : "go:DEV-10"];
  }
  function oxygenReviewControls(item) {
    if (item.id !== "HLT-05") return "";
    const options = [["supported", "可用示例"], ["unknown", "能力待确认"], ["unsupported", "不支持"], ["off", "自动记录关闭"], ["quality", "当天自动记录不足"]];
    return `<section class="review-controls"><p>OXYGEN REVIEW</p><h3>血氧演示场景</h3><small>只切换原型示例，不写入硬件能力或采集设置；未选择示例时默认待确认。自动记录关闭/质量不足保留历史及已保存主动结果；可用示例假定自动和主动均支持，不代表量产能力。</small><div class="review-control-group"><div>${options.map(([value, label]) => `<button type="button" data-action="oxygen-review:${value}" class="${state.oxygenReviewScenario === value ? "active" : ""}">${label}</button>`).join("")}</div></div></section>`;
  }
  function oxygenDetailPage() {
    const date = oxygenRecordDate(), active = isHardwareActive(), model = oxygenDataModel();
    const hasReading = Number.isFinite(model.selected.value);
    const shortDate = day => `${Number(day.slice(5, 7))}月${Number(day.slice(8))}日`;
    const nightLabel = `${shortDate(window.HALO_OXYGEN_TREND.shiftDate(date, -1))}晚—${shortDate(date)}晨`;
    const [emptyTitle, emptyBody, actionLabel, action] = oxygenEmptyCopy(model);
    const summary = state.oxygenMode === "day" ? oxygenDaySummary(oxygenDayModel()) : hasReading ? `<section class="oxygen-summary heart-summary"><p>夜间平均 · SpO₂</p><div class="heart-reading" id="oxygen-reading"><strong>${model.selected.value}</strong><span>%</span></div><p class="oxygen-night">${nightLabel}</p><p class="oxygen-sample-label">示例数据 · 非实时读数</p></section>` : `<section class="oxygen-empty${model.hasAny ? " has-history" : ""}"><h2>${emptyTitle}</h2><p>${emptyBody}</p>${buttons([[actionLabel, action, "secondary"]])}</section>`;
    const hasDraft = Boolean(state.recordDraft.labels.length || state.recordDraft.note.trim());
    const recordLabel = hasDraft ? state.recordDraft.reportMonth ? "继续月度回顾草稿" : "继续未保存的记录" : "记下此刻感受";
    const records = state.subjectiveRecords.filter(record => record.category !== "rhythm").slice().sort((a, b) => String(b.occurredAt || "").localeCompare(String(a.occurredAt || "")));
    return `<article class="oxygen-detail" data-oxygen-mode="${state.oxygenMode}">${healthDetailDateHeader("血氧", date, "oxygen")}${date !== beijingDateKey() ? '<button type="button" class="oxygen-today" data-action="oxygen-date:today">回到今天</button>' : ""}${oxygenModeControls()}<div class="oxygen-summary-layout${state.oxygenMode === "day" && oxygenDayModel().latest ? " has-reading" : ""}">${summary}${oxygenMeasurementEntry()}</div>${oxygenPlotBody(model)}<button type="button" class="oxygen-safety-link" data-action="oxygen-help"><span>读数或身体感觉不对时</span>${healthChevron()}</button>${active && state.oxygenMode === "night" ? `<section class="oxygen-related"><button type="button" class="heart-record-entry" data-action="oxygen-open-sleep"><span><strong>这一晚的睡眠</strong><small>${nightLabel}</small></span>${healthChevron()}</button><button type="button" class="heart-record-entry" data-action="oxygen-open-respiration"><span><strong>这一晚的呼吸率</strong><small>每分钟呼吸次数，与血氧不同</small></span>${healthChevron()}</button></section>` : ""}<div class="sleep-disclosures oxygen-disclosures"><details><summary>如何理解血氧${healthChevron()}</summary><div><p>血氧饱和度（SpO₂）是血液携氧情况的一个指标，用百分比表示。</p><p>白天和睡眠时都可以有血氧记录。读数旁的时间说明它是什么时候测得的，不代表此刻的血氧。单次读数与睡眠期间的平均值分开看。</p><p>佩戴松紧、手部活动、皮肤温度和肤色等都可能影响光学测量。不要只凭一个数字判断身体状况。</p></div></details></div><section class="heart-journal oxygen-journal"><button type="button" class="heart-record-entry" data-action="record-new"><span><strong>${recordLabel}</strong><small>用户记录 · 按保存时间记录</small></span>${healthChevron()}</button><details class="heart-records"><summary><span>我的感受记录<small>${records.length ? `共 ${records.length} 条 · 不限日期` : "还没有保存过记录"}</small></span>${healthChevron()}</summary><div class="energy-user-records">${records.slice(0, 3).map(record => `<button type="button" data-action="record-detail:${esc(record.id)}"><span>${esc(record.label)}<small>${esc(record.occurredAt ? recordDateTime(record.occurredAt) : "未记录时间")} · 用户记录</small></span>${healthChevron()}</button>`).join("") || '<p>想记的时候，点上方“记下此刻感受”。</p>'}${records.length > 3 ? buttons([["查看全部记录", "bw-records", "text-button"]]) : ""}${state.recordEditDraft ? buttons([["继续上次未保存的修改", `record-edit:${state.recordEditDraft.id}`, "text-button"]]) : ""}</div></details></section><div class="sleep-disclosures oxygen-disclosures"><details><summary>数据来源与说明${healthChevron()}</summary><div><p>${state.oxygenMode === "day" ? `${esc(healthDateLabel(date))} · 按采集时间查看` : `${esc(healthDateLabel(date))}醒来的这一晚 · 睡眠平均`}</p><p>当日记录区分自动记录和主动测量，按北京时间归档。睡眠血氧按醒来日期查看；主动测量不计入睡眠平均。缺失或质量不足的记录留空，不按零计算。</p><p>示例仅用于体验交互，不代表你的实际测量结果。是否提供血氧记录，以设备确认支持的功能为准。</p>${buttons([[active ? "查看连接与同步" : "连接 Halo Ring", active ? "go:DEV-10" : "go:DEV-01", "text-button"], ...(active ? [["查看设备信息", "go:DEV-11", "text-button"]] : [])])}</div></details></div><p class="health-overview-boundary">用于日常健康管理，不替代医疗诊断。明显不适时不要等待下一次记录。</p></article>`;
  }
  // Metrics use dated fixtures; respiration and oxygen own explicitly dated nightly series.
  const HEALTH_OVERVIEW_ITEMS = [
    { key: "sleep", title: "睡眠", route: "TOD-05", icon: "sleep", detail: "昨晚", value: "6小时42分" },
    { key: "energy", title: "身体能量", route: "TOD-06", icon: "body", detail: "今日状态", value: "接近平时" },
    { key: "activity", title: "活动", route: "TOD-07", icon: "activity", detail: "今日步数", value: "4,862", unit: "步" },
    { key: "heart", title: "心率", route: "HLT-01", icon: "heart", detail: "最近一次 · 08:38", value: "72", unit: "次/分" },
    { key: "hrv", title: "HRV", route: "TOD-06", icon: "energy", detail: "夜间估算", value: "42", unit: "ms" },
    { key: "breath", title: "呼吸率", route: "HLT-02", icon: "breath", detail: "夜间平均", value: "15.2", unit: "次/分" },
    { key: "oxygen", title: "血氧", route: "HLT-05", icon: "oxygen", detail: "夜间平均", value: "98", unit: "%" },
    { key: "temperature", title: "皮肤温度", route: "HLT-06", icon: "temperature", detail: "相对平时", value: "+0.2", unit: "°C" },
  ];
  function validHealthDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "1900-01-01" || value > beijingDateKey()) return false;
    const parsed = new Date(`${value}T12:00:00Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }
  function healthDateLabel(date = state.healthSelectedDate) {
    const text = new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", month: "long", day: "numeric" }).format(new Date(`${date}T12:00:00+08:00`));
    return `${date === beijingDateKey() ? "今天 · " : date.slice(0, 4) !== beijingDateKey().slice(0, 4) ? `${date.slice(0, 4)}年` : ""}${text}`;
  }
  function healthOverviewReading(item, date = state.healthSelectedDate) {
    if (date !== beijingDateKey()) item = { ...item, detail: item.detail.replace("今日", "当日").replace("昨晚", "前一晚") };
    const empty = (detail, value = "—") => ({ ...item, detail, value, unit: "", empty: true });
    if (item.key === "temperature") {
      const data = temperatureDataModel(date), value = data.selected.value;
      return Number.isFinite(value) ? { ...item, value: window.HALO_TEMPERATURE_TREND.formatValue(value), detail: "夜间相对平时 · 示例数据" } : empty({ baseline: "个人温度基线建立中", quality: "这一晚记录不完整", unknown: "功能待确认", unsupported: "当前戒指不支持", unbound: "连接后开始记录", privacy: "数据处理中" }[data.selected.reason] || "暂无记录");
    }
    if (!isHardwareActive()) return empty(state.membershipHardwareState === "unbound-retained" ? "等待重新连接" : "连接后开始记录");
    if (item.key === "oxygen") {
      const model = oxygenDayModel(date);
      return model.latest ? { ...item, value: String(model.latest.value), detail: `最近一次 · ${model.latest.time} · ${model.latest.kind === "manual" ? "主动测量" : "自动记录"}` } : empty({ unknown: "功能待确认", unsupported: "当前设备不支持", off: "自动记录未开启", quality: "当天自动记录不足" }[model.reason] || "暂无记录");
    }
    if (item.key === "breath") {
      const reading = respirationDataModel(date).selected;
      return Number.isFinite(reading.value) ? { ...item, value: reading.value.toFixed(1), detail: "夜间平均 · 示例数据" } : empty(date === state.healthDemoRecordDate && state.dataLifecycle === "limited" ? "夜间记录有缺口" : "暂无记录");
    }
    if (date !== state.healthDemoRecordDate || state.dataLifecycle === "none") return empty("暂无记录");
    if (item.key === "heart") {
      const latest = heartDataModel(date).latest;
      return latest ? { ...item, value: String(latest.value), detail: `最近一次 · ${latest.time}` } : empty("暂无记录");
    }
    if (state.dataLifecycle === "limited" && !["heart", "activity"].includes(item.key)) return empty(item.key === "energy" ? "暂不判断身体状态" : "夜间记录有缺口", "记录不完整");
    if (state.dataLifecycle !== "interpretable") {
      if (item.key === "energy") return empty("个人范围尚未建立", "积累中");
      if (item.key === "temperature") return empty("等待建立个人范围", "已有记录");
      return { ...item, detail: state.dataLifecycle === "limited" ? "已同步片段" : item.key === "hrv" ? "夜间估算 · 暂不比较" : item.detail };
    }
    return item;
  }
  function healthChevron(direction = "right") {
    return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${direction === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}"/></svg>`;
  }
  function healthOverviewRow(item) {
    const reading = healthOverviewReading(item);
    return `<button class="health-overview-row ${reading.empty ? "is-empty" : ""}" data-health-metric="${item.key}" data-action="health-open:${item.key}"><span class="health-overview-icon" aria-hidden="true">${domainIcon(item.icon)}</span><span class="health-overview-label"><strong>${item.title}</strong><small>${esc(reading.detail)}</small></span><span class="health-overview-value ${["sleep", "energy"].includes(item.key) || reading.empty ? "is-text" : ""}">${esc(reading.value)}${reading.unit ? `<small>${esc(reading.unit)}</small>` : ""}</span><span class="health-overview-chevron">${healthChevron()}</span></button>`;
  }
  function healthBodyWeatherProgress() {
    const active = isHardwareActive();
    const retained = !active && state.membershipHardwareState === "unbound-retained";
    // Review fixtures follow the existing lifecycle: 7 valid days, not the 14-night report.
    // An unbound account with no retained count must not be represented as starting over.
    const days = retained ? null : !active ? 0 : ({ none: 0, accumulating: 3, baseline: 5, interpretable: 7, limited: 7 }[state.dataLifecycle] ?? 0);
    const complete = days === 7;
    const label = retained ? "暂停更新" : !active ? "等待连接" : complete ? "已建立" : "建立中";
    const hint = retained ? "重新连接后，继续积累。" : !active ? "连接戒指后，开始积累 7 天记录。" : state.dataLifecycle === "limited" ? "已建立个人范围，今天的记录待补全。" : complete ? "已完成 7 天记录，可以与平时比较。" : days === 0 ? "从第一晚记录开始。" : `再记录 ${7 - days} 天，就能查看第一版。`;
    const action = !active ? "go:DEV-01" : complete && state.dataLifecycle !== "limited" ? "go:TOD-03" : "go:DEV-10";
    const actionLabel = !active ? "连接 Halo Ring" : complete && state.dataLifecycle !== "limited" ? "查看 Body Weather" : "查看连接与同步";
    const explanation = retained ? "已有记录会保留。重新连接后继续更新，不会因为解绑就把过去的记录清零。" : complete ? "这 7 天的记录帮助 Halo 了解你的平常状态。某一晚记录不完整，不会让建立进度重新开始。" : "戴着戒指照常生活和睡觉，同步后会更新进度。只计算记录完整的天数；少记一天，已有进度也会保留。";
    return `<details class="health-weather-progress" data-weather-stage="${esc(label)}"><summary><span class="health-weather-heading"><img src="${HALO_SYMBOL}" alt="" width="28" height="34"><span><strong>Body Weather</strong><small>建立进度 · 当前累计</small></span><span class="health-weather-status">${label}</span></span>${days !== null ? `<span class="health-weather-meter" role="progressbar" aria-label="Body Weather 建立进度" aria-valuemin="0" aria-valuemax="7" aria-valuenow="${days}" aria-valuetext="${days} / 7 天，${label}"><span class="health-weather-segments" aria-hidden="true">${Array.from({ length: 7 }, (_, index) => `<i class="${index < days ? "is-complete" : ""}"></i>`).join("")}</span><span class="health-weather-count" aria-hidden="true"><b>${days}</b> / 7 天</span></span>` : ""}<span class="health-weather-hint">${hint}</span><span class="health-weather-disclosure"><span class="when-closed">查看说明</span><span class="when-open">收起说明</span>${healthChevron()}</span></summary><div class="health-weather-explanation"><p>${explanation}</p><p>此处为当前累计进度，不随上方日期切换。14 晚健康报告另行积累。</p><button data-action="${action}">${actionLabel}${healthChevron()}</button></div></details>`;
  }
  function healthOverviewPage() {
    const date = state.healthSelectedDate;
    const hasDate = date === state.healthDemoRecordDate || Number.isFinite(respirationDataModel(date).selected.value) || Boolean(oxygenDayModel(date).latest);
    const active = isHardwareActive();
    const hasRecords = active && hasDate && state.dataLifecycle !== "none";
    const status = !active ? "尚未连接 Halo Ring" : !hasRecords ? "暂无同步记录" : state.dataLifecycle === "limited" ? "部分记录尚未同步" : `更新于 ${date === beijingDateKey() ? "" : `${healthDateLabel(date)} `}08:44`;
    const guide = !active ? { title: state.membershipHardwareState === "unbound-retained" ? "连接戒指，继续记录" : "连接戒指，开始记录", body: "睡眠和日常身体记录会在这里显示。", label: "连接 Halo Ring", action: "go:DEV-01" }
      : !hasDate ? { title: "这一天还没有记录", body: "已保存的其他日期记录不会受影响。", label: state.dataLifecycle === "none" ? "回到今天" : "查看最近记录", action: state.dataLifecycle === "none" ? "health-date:today" : "health-date:latest" }
      : state.dataLifecycle === "none" ? { title: "等待第一份记录", body: "戴着戒指睡一晚，醒来后打开 App 同步。", label: "查看连接与同步", action: "go:DEV-10" }
      : state.dataLifecycle === "limited" ? { title: "夜间记录少了一段", body: "已收到的心率和活动仍可查看。", label: "查看连接与同步", action: "go:DEV-10" } : null;
    const section = (title, items) => `<section class="health-overview-section"><h2>${title}</h2><div class="health-overview-list">${items.map(healthOverviewRow).join("")}</div></section>`;
    return `<article class="health-overview"><header class="health-overview-header"><button data-action="previous" aria-label="返回">${healthChevron("left")}</button><h1>健康数据</h1><span></span></header><div class="health-date-rail"><button data-action="health-date:previous" aria-label="前一天" ${date <= "1900-01-01" ? "disabled" : ""}>${healthChevron("left")}</button><label class="health-date-picker"><span>${esc(healthDateLabel())}</span><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4m8-4v4M4 11h16"/></svg><input id="health-overview-date" type="date" min="1900-01-01" max="${beijingDateKey()}" value="${date}" aria-label="选择健康记录日期"></label><button data-action="health-date:next" aria-label="后一天" ${date >= beijingDateKey() ? "disabled" : ""}>${healthChevron()}</button></div><div class="health-overview-sync" aria-live="polite"><span><i class="${hasRecords ? "has-records" : ""}"></i>${esc(status)}</span><button data-action="health-open:quality">数据说明${healthChevron()}</button></div>${healthBodyWeatherProgress()}${date !== beijingDateKey() ? `<button class="health-return-today" data-action="health-date:today">回到今天</button>` : ""}${guide ? `<section class="health-overview-guide"><strong>${guide.title}</strong><p>${guide.body}</p><button data-action="${guide.action}">${guide.label}${healthChevron()}</button></section>` : ""}${section("主要记录", HEALTH_OVERVIEW_ITEMS.slice(0, 3))}${section("生理指标", HEALTH_OVERVIEW_ITEMS.slice(3))}<section class="health-overview-section"><h2>测量与报告</h2><div class="health-overview-list">${[{ title: "主动测量", detail: "测量与最近结果", icon: "status", action: "go:HLT-03" }, { title: "健康报告", detail: "14晚报告与月度回顾", icon: "report", action: "go:TOD-09" }].map(item => `<button class="health-overview-row health-overview-tool" data-action="${item.action}"><span class="health-overview-icon" aria-hidden="true">${domainIcon(item.icon)}</span><span class="health-overview-label"><strong>${item.title}</strong><small>${item.detail}</small></span><span class="health-overview-chevron">${healthChevron()}</span></button>`).join("")}</div></section><p class="health-overview-boundary">用于日常健康管理，不替代医疗诊断。</p></article>`;
  }
  function healthDatedEmptyPage(item) {
    const context = state.healthDetailContext;
    const bound = isHardwareActive();
    const title = context.metric === "quality" ? "数据说明" : HEALTH_OVERVIEW_ITEMS.find(entry => entry.key === context.metric)?.title || item.name;
    return `<article class="health-overview health-dated-empty"><header class="health-overview-header"><button data-action="previous" aria-label="返回">${healthChevron("left")}</button><h1>${esc(title)}</h1><span></span></header><p class="health-dated-label">${esc(healthDateLabel(context.date))}</p><div class="health-empty-symbol" aria-hidden="true"><img src="${HALO_SYMBOL}" alt=""></div><h2>${bound ? "这一天还没有记录" : "连接戒指后开始记录"}</h2><p>${bound ? "可以换个日期看看，已有记录不会受影响。" : "连接后，可以查看睡眠和日常身体记录。"}</p>${buttons([[bound ? "查看最近记录" : "连接 Halo Ring", bound ? "health-date:latest" : "go:DEV-01", "primary"], ["返回健康数据", "go:HLT-00", "secondary"]])}</article>`;
  }
  function health(item) {
    if (item.id === "HLT-00") return healthOverviewPage();
    if (!isHardwareActive()) return unboundHealthDetail(item);
    const map = {
      "HLT-01": () => heartDetailPage(),
      "HLT-02": () => respirationDetailPage(),
      "HLT-03": () => renderMeasurementStart(item),
      "HLT-04": () => renderMeasurementResult(item),
      "HLT-05": () => oxygenDetailPage(),
      "HLT-06": () => temperatureDetailPage(),
    };
    return map[item.id]?.() || generic(item);
  }

  const nightPlaylist = window.createHaloNightPlaylist({ state, active: isHardwareActive, content: currentNightContent });
  const nightWake = window.createHaloNightWake({ state, active: isHardwareActive, screen, esc, go, render, write: writeNotificationProgress, track: trackPrototypeEvent });
  const nightSound = window.createHaloNightSound({ state, active: isHardwareActive, screen, esc, go, render, write: writeNotificationProgress });
  const nightMorning = window.createHaloNightMorning({ state, active: isHardwareActive, esc, symbol: HALO_SYMBOL_IVORY, closedReceipt: nightWake.closedReceipt, pendingSnooze: nightWake.pendingSnooze });
  const nightHistoryPage = window.createHaloNightHistory({ state, playlist: nightPlaylist, screen, esc, render, go, write: writeNotificationProgress, pendingArchive: () => finishNightSession.failedKey === nightCompletionKey() && nightSessionDue() });
  const nightSupport = window.createHaloNightSupport({ state, active: isHardwareActive, playlist: nightPlaylist, esc, pendingSnooze: nightWake.pendingSnooze, go, capture: capturePageView, persist: persistAppProgress });
  const nightFade = window.createHaloNightFade({ state, active: isHardwareActive, playlist: nightPlaylist, esc, screen, write: writeNotificationProgress, render, go, capture: capturePageView, persist: persistAppProgress });
  const nightHome = window.createHaloNightCombo({ state, playlist: nightPlaylist, active: isHardwareActive, position: nightPosition, esc, symbol: HALO_SYMBOL_IVORY, icon: domainIcon, chevron: healthChevron, render, go, write: writeNotificationProgress, screen, track: trackPrototypeEvent, finish: () => handleAction("night-end"), supportEntry: nightSupport.entry, pendingSnooze: nightWake.pendingSnooze });
  function night(item) {
    if (item.id === "NIG-01") return nightHome.body();
    if (item.id === "NIG-02") return nightHome.detail();
    if (item.id === "NIG-03") return nightHome.library();
    if (item.id === "NIG-04") return nightHome.player();
    if (item.id === "NIG-05") return nightHome.editor();
    if (item.id === "NIG-06") return nightWake.page();
    if (!isHardwareActive() && ["NIG-01", "NIG-02", "NIG-03", "NIG-05"].includes(item.id)) return unboundNight(item);
    if (!isHardwareActive() && ["NIG-06", "NIG-07"].includes(item.id)) return `${head(item, "NIGHT SETTINGS")}${notice("先使用公共内容放松一下", "当前未激活硬件，不启用入睡检测或浅睡窗口。播放与历史记录仍可使用。", "sage")}${buttons([["选择公共内容", "go:NIG-01", "primary"]])}`;
    const selected = currentNightContent();
    const wake = state.wakeSettings;
    const wakeLabel = wake.enabled && state.toggles.notification ? `最晚 ${wake.time} · ${wake.sound}` : wake.enabled ? "通知已关闭，请检查唤醒权限" : "已关闭";
    const playing = state.nightSession;
    const position = nightPosition();
    const playerContent = playing ? { duration: playing.duration } : selected;
    const content = {
      "NIG-07": () => nightSound.page(),
      "NIG-08": () => nightWake.alarm(),
      "NIG-09": () => nightMorning.page(),
      "NIG-10": () => nightHistoryPage.page(),
      "NIG-11": () => nightSupport.page(),
      "NIG-12": () => nightFade.page(),
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
    return `<button class="hal-header-control" data-action="halo-new-conversation" aria-label="新对话" title="新对话">${haloUiIcon("new")}</button><button class="hal-header-control" data-action="go:HAL-02" aria-label="最近对话">历史</button><button class="hal-header-control" data-action="go:HAL-08" aria-label="Halo 设置" title="Halo 设置">${haloUiIcon("more")}</button>`;
  }
  function haloUiIcon(name) {
    const paths = {
      new: '<path d="M12 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 3l5 5M10 14l1-5 7-7 5 5-7 7-6 1Z"/>',
      more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
      arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
      send: '<path d="M12 19V5m-6 6 6-6 6 6"/>',
      plus: '<path d="M12 5v14M5 12h14"/>',
      close: '<path d="m6 6 12 12M18 6 6 18"/>',
    };
    return `<svg class="hal-ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.arrow}</svg>`;
  }
  function haloRecentConversation() {
    if (state.chat.length || !["active", "paused"].includes(state.conversationStatus)) return "";
    return `<button class="halo-resume" data-action="resume-conversation:${esc(state.activeConversationId)}"><span>${domainIcon("time")}</span><span><small>继续上次</small><strong>${esc(haloConversationTitle())}</strong></span><i aria-hidden="true">›</i></button>`;
  }
  function haloJourneyNudge() {
    const resumableConversation = ["active", "paused"].includes(state.conversationStatus);
    if (state.chat.length || resumableConversation || !["active", "deferred"].includes(state.journeyRecords[state.journeyTheme].status) || state.journeyProgress <= 0 || state.journeyProgress >= 7) return "";
    const step = currentJourneyStep();
    const doneToday = state.journeyRecords[state.journeyTheme].days.includes(experienceDay());
    return `<button class="halo-journey-nudge" data-action="go:HAL-06"><span class="journey-nudge-icon" aria-hidden="true">${domainIcon("activity")}</span><span><small>${doneToday ? `今天已完成 · ${state.journeyProgress} / 7 天` : state.journeyDecision === "deferred" ? "暂时放下的小计划" : `今天的小练习 · 第 ${state.journeyProgress + 1} / 7 天`}</small><strong>${esc(step.title)}</strong></span><i>${doneToday || state.journeyDecision === "deferred" ? "查看" : "继续"}</i></button>`;
  }
  function haloToolsMenu() {
    if (!state.haloToolsOpen) return "";
    return `<div id="halo-tools" class="halo-tool-menu" role="group" aria-label="对话工具"><button data-action="halo-open-feeling"><span aria-hidden="true">${domainIcon("heart")}</span><strong>记录感受</strong></button><button data-action="halo-open-journey"><span aria-hidden="true">${domainIcon("activity")}</span><strong>我的小计划</strong></button></div>`;
  }
  function haloComposer(placeholder = "和 Halo 说说…") {
    const locked = ["paused", "archived"].includes(state.conversationStatus);
    return `${haloToolsMenu()}<div class="composer halo-composer"><button class="composer-tool" data-action="halo-tools-toggle" aria-label="${state.haloToolsOpen ? "收起" : "打开"}对话工具" aria-expanded="${state.haloToolsOpen}" aria-controls="halo-tools">${haloUiIcon(state.haloToolsOpen ? "close" : "plus")}</button><label class="sr-only" for="chat-input">发给 Halo 的消息</label><textarea id="chat-input" class="field" rows="1" maxlength="2000" enterkeyhint="send" placeholder="${locked ? "先继续这次对话，再发送消息" : esc(placeholder)}">${esc(state.haloDraft || "")}</textarea><button class="composer-send" data-action="send-chat" aria-label="发送消息" ${!String(state.haloDraft || "").trim() || locked ? "disabled" : ""}>${haloUiIcon("send")}</button></div>`;
  }
  function updateHaloComposer() {
    const input = document.getElementById("chat-input");
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(112, Math.max(52, input.scrollHeight))}px`;
    const send = screen.querySelector('[data-action="send-chat"]');
    if (send) send.disabled = !input.value.trim() || ["paused", "archived"].includes(state.conversationStatus);
  }
  function haloVisibleSource() {
    const source = currentHaloSource() || {};
    const kind = source.kind || "none";
    if (kind === "body" && hasBodyContext()) return { kind, label: "今天的身体状态", title: "今天的状态" };
    if (kind === "feeling" && (source.text || source.recordId)) return { kind, label: `用户记录 · ${String(source.text || "此刻感受").split(" · ")[0].slice(0, 24)}`, title: "这份感受" };
    if (kind === "rhythm") return { kind, label: `用户记录 · ${Number(source.date?.slice(5, 7))}月${Number(source.date?.slice(8, 10))}日`, title: "这一天的感受" };
    if (kind === "correction" && activeWeatherCorrection()) return { kind, label: "用户反馈 · 我的纠正", title: "你补充的感受" };
    if (kind === "inspiration") return { kind, label: "今日灵感 · 文化参考", title: "今日灵感" };
    return null;
  }
  function haloSourceChip() {
    const source = haloVisibleSource();
    if (!source) return "";
    return `<div class="hal-source-chip" data-source-kind="${esc(source.kind)}"><button data-action="halo-source-details" aria-label="查看参考来源：${esc(source.label)}">${esc(source.label)}</button><button class="hal-source-remove" data-action="halo-remove-source" aria-label="移除本次参考来源">${haloUiIcon("close")}</button></div>`;
  }
  function haloHomePage() {
    const hasChat = state.chat.length > 0;
    const source = haloVisibleSource();
    const locked = ["paused", "archived"].includes(state.conversationStatus);
    const prompts = source?.kind === "inspiration"
      ? ["今天的颜色怎么穿？", "怎么把它用在今天？", "先听我说一会儿"]
      : source?.kind === "feeling" || source?.kind === "correction"
      ? ["陪我梳理这份感受", "想找一段睡前放松", "先听我说一会儿"]
      : source?.kind === "body" ? ["帮我读懂今天的状态", "想找一段睡前放松", "先听我说一会儿"]
      : source?.kind === "rhythm" ? ["帮我梳理这一天的感受", "想找一段睡前放松", "先听我说一会儿"]
      : ["陪我梳理今天的安排", "想找一段睡前放松", "先听我说一会儿"];
    const suggestions = `<div class="hal-starters">${prompts.map(text => `<button data-action="ask:${esc(text)}"><span>${esc(text)}</span>${haloUiIcon("arrow")}</button>`).join("")}</div>`;
    const greeting = `<section class="hal-empty"><img class="hal-welcome-ip" src="${HALO_IP_DEFAULT}" alt="Halo 日常小花团" width="140" height="140"><h2>想聊点什么？</h2><p>${source && source.kind !== "body" ? "你带来的内容已在这里，可以接着说。" : "说说今天，或从一个小问题开始。"}</p>${haloSourceChip()}${suggestions}${haloJourneyNudge()}</section>`;
    const messages = `<div class="hal-thread-heading"><img src="${HALO_IP_DEFAULT}" alt="" width="32" height="32"><span>${source ? `正在聊：${esc(source.title)}` : "这次对话"}</span></div>${haloSourceChip()}<div id="chat-messages" class="hal-messages" role="log" aria-label="对话消息">${state.chat.map(message => message.role === "user" ? `<div class="message user">${esc(message.text)}</div>` : `<article class="hal-reply"><img class="hal-reply-avatar" src="${HALO_IP_DEFAULT}" alt="Halo" width="30" height="30"><div class="hal-reply-content"><div class="message halo">${esc(message.text)}</div>${message.action?.route === "NIG-01" && !message.safety ? `<button class="hal-reply-action" data-action="go:NIG-01"><span>${esc(message.action.label || "去选一段放松内容")}</span>${haloUiIcon("arrow")}</button>` : ""}${message.safety ? haloSafetySupport() : ""}</div></article>`).join("")}</div>`;
    const quota = !isHardwareActive() ? `今天还可聊 ${Math.max(0, 10 - ensureHaloQuota().used)} 条` : !hasBodyContext() ? "暂不参考身体状态" : "";
    return `<section class="hal-chat-page ${hasChat ? "is-conversation" : "is-empty"}" aria-label="Halo 对话"><header class="hal-chat-header"><h1>Halo</h1><div class="hal-header-actions">${haloHeaderActions()}</div></header><div class="hal-chat-scroll">${hasChat ? messages : greeting}</div><footer class="hal-chat-footer">${locked ? `<div class="hal-conversation-state"><span>${state.conversationStatus === "paused" ? "这次对话已暂停" : "这次对话已归档"}</span><button data-action="halo-resume-active">继续对话</button></div>` : ""}<div class="hal-composer-meta"><span>${quota}</span><button data-action="halo-usage">使用说明</button></div>${haloComposer()}<p class="hal-ai-note">AI 回答仅供参考</p></footer></section>`;
  }
  function haloMemoryPage(item) {
    const correction = activeWeatherCorrection();
    const history = [...state.aiCorrectionHistory, ...(!correction && state.aiCorrection.status !== "none" ? [state.aiCorrection] : [])];
    const correctionBlock = correction
      ? `<section class="memory-correction-card"><span>${esc(correction.date)} · 用户反馈</span><strong>${esc(correction.reasonLabel)}</strong><p>这次反馈没有自动加入记忆。下面是当前原型里保存的记忆，你可以逐条查看、纠正或删除。</p><button class="text-button" data-action="ai-correction-reset">撤销这次反馈</button></section>`
      : "";
    const correctionHistory = history.length ? `<details class="card"><summary>以往的纠正与未完成草稿 · ${history.length}</summary><p>仅供回看，不作为今天的感受。不会改动戒指记录或过去的聊天原文。</p>${history.slice().reverse().map(entry => `<section class="memory-correction-card"><span>${esc(entry.date || (Number.isFinite(Date.parse(entry.savedAt)) ? beijingDateKey(new Date(entry.savedAt)) : "原记录未关联日期"))} · ${entry.status === "draft" ? "未保存草稿" : entry.status === "withdrawn" ? "已撤销" : "历史反馈"}</span><strong>${esc(entry.reasonLabel || AI_CORRECTION_REASONS[entry.reason] || "补充感受")}</strong>${entry.note ? `<p>${esc(entry.note)}</p>` : ""}</section>`).join("")}</details>` : "";
    return haloMemory.page(correctionBlock + correctionHistory);
  }
  function halo(item) {
    if (item.id === "HAL-01") return haloHomePage();
    const map = {
      "HAL-02": () => haloHistory.page(),
      "HAL-03": () => haloMemoryPage(item),
      "HAL-04": () => haloProactive.page(),
      "HAL-05": () => haloFeelingEditor.page(),
      "HAL-06": () => haloJourney.page(),
      "HAL-07": () => haloPrivacyControls.page(),
      "HAL-08": () => haloSettingsHub.page(),
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
    state.recordDraft.labels = Array.isArray(state.recordDraft.labels) ? state.recordDraft.labels.filter(label => RECORD_OPTIONS.includes(label)) : [];
    state.recordDraft.note = String(state.recordDraft.note || "");
    state.recordEditorMode = state.recordEditorMode === "edit" && state.recordEditDraft?.id ? "edit" : "new";
    if (state.recordEditDraft?.id) {
      const original = state.subjectiveRecords.find(record => record.id === state.recordEditDraft.id);
      const allowed = [...(original?.category === "activity" ? ACTIVITY_FEELINGS : RECORD_OPTIONS), ...(original?.labels || (original ? [original.label] : []))];
      state.recordEditDraft.labels = Array.isArray(state.recordEditDraft.labels) ? state.recordEditDraft.labels.filter(label => allowed.includes(label)) : [];
      state.recordEditDraft.note = String(state.recordEditDraft.note || "");
    } else state.recordEditDraft = null;
    state.rhythmRecords = state.rhythmRecords && typeof state.rhythmRecords === "object" ? state.rhythmRecords : {};
    if (!["cycle", "record-only"].includes(state.rhythmMode)) state.rhythmMode = "record-only";
    if (state.rhythmSettingsSaved === true && rhythmSettingsValid() && !state.rhythmSettingsConfirmedAt) state.rhythmSettingsConfirmedAt = new Date().toISOString();
    state.rhythmSettingsDraft = { ...state.rhythmSettings, ...(state.rhythmSettingsDraft || {}) };
    state.selectedRhythmDate = validHealthDate(state.selectedRhythmDate) ? state.selectedRhythmDate : beijingDateKey();
    state.rhythmMonth = state.rhythmMonth || state.selectedRhythmDate.slice(0, 7);
    state.tabStacks = state.tabStacks && typeof state.tabStacks === "object" ? state.tabStacks : {};
    state.pageViews = state.pageViews && typeof state.pageViews === "object" ? state.pageViews : {};
    for (const tab of ["TOD-01", "NIG-01", "HAL-01", "RHY-01", "MY-01"]) {
      state.tabStacks[tab] = Array.isArray(state.tabStacks[tab]) ? state.tabStacks[tab].filter(id => pages.some(page => page.id === id) && tabForRoute(id) === tab) : [tab];
    }
  }
  function rhythmSettingsValid(settings = state.rhythmSettings) {
    const { startDate, cycleLength, duration } = settings || {};
    return validHealthDate(startDate) && Number.isInteger(Number(cycleLength)) && Number(cycleLength) >= 20 && Number(cycleLength) <= 45 && Number.isInteger(Number(duration)) && Number(duration) >= 2 && Number(duration) <= 10;
  }
  function rhythmHasConfirmedCycle() { const stamp = Date.parse(state.rhythmSettingsConfirmedAt || ""); const own = !state.rhythmSettingsEditor?.activeOwner || state.rhythmSettingsEditor.activeOwner === String(state.authPhone || state.authForm?.phone || "legacy-session"); return own && !state.rhythmDeleted && rhythmSettingsValid() && (state.rhythmSettingsSaved === true || Number.isFinite(stamp) && stamp <= Date.now()); }
  function rhythmDay() {
    if (state.rhythmMode !== "cycle" || state.rhythmStatus !== "ready" || !rhythmSettingsValid() || state.rhythmDeleted) return null;
    const elapsed = Math.floor((Date.parse(beijingDateKey() + "T12:00:00+08:00") - Date.parse(state.rhythmSettings.startDate + "T12:00:00+08:00")) / 86400000);
    return elapsed + 1;
  }
  let rhythmContextPreview = null;
  function rhythmCalendar() {
    const [year, month] = state.rhythmMonth.split("-").map(Number);
    const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const offset = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
    const cells = [...Array(offset)].map(() => '<span aria-hidden="true"></span>');
    for (let day = 1; day <= days; day++) {
      const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push(`<button class="${state.rhythmRecords[date] ? "active" : ""} ${date === beijingDateKey() ? "today" : ""}" data-action="rhythm-date:${date}" ${date > beijingDateKey() ? "disabled" : ""} aria-label="${date}，${state.rhythmRecords[date] ? "已有记录，查看或修改" : "记录感受"}">${day}</button>`);
    }
    return `<div class="calendar-heading">${buttons([["上月", "rhythm-month:-1", "text-button"], [state.rhythmMonth, "", "text-button", true], ["下月", "rhythm-month:1", "text-button", state.rhythmMonth >= beijingDateKey().slice(0,7)]])}</div><div class="calendar">${["一","二","三","四","五","六","日"].map(day => `<small>${day}</small>`).join("")}${cells.join("")}</div>`;
  }
  function rhythmSettingsForm(item, setup = false) {
    if (!setup && state.rhythmMode === "record-only") return `${head(item, "RHYTHM SETTINGS")}<div class="stack">${notice("当前：只记录感受", "无需填写经期日期，可以持续记录睡眠、情绪和身体感受。以后想加入周期日期时再设置，已有感受会保留。", "rose")}${toggle("rhythmNotice", "记录轻提醒", "是否提醒由你选择")}${buttons([["返回感受日历", "go:RHY-01", "primary"], ["添加周期日期（可选）", "go:RHY-00", "secondary"]])}${setting("管理记录", "按日期修改、删除，或管理全部节律数据", "go:RHY-05")}</div>`;
    return `${head(item, setup ? "RHYTHM SETUP" : "RHYTHM SETTINGS")}<div class="stack">${notice("从你愿意记录的部分开始", "日期是可选的。不想记录经期时，可以一直只记录感受。", "rose")}<label class="field-label">最近一次开始日<input id="rhythm-start-date" class="field" type="date" max="${beijingDateKey()}" value="${esc(state.rhythmSettingsDraft.startDate || "")}"></label><label class="field-label">平均周期（天）<input id="rhythm-cycle-length" class="field" type="number" min="20" max="45" value="${esc(state.rhythmSettingsDraft.cycleLength)}"></label><label class="field-label">平均持续（天）<input id="rhythm-duration" class="field" type="number" min="2" max="10" value="${esc(state.rhythmSettingsDraft.duration)}"></label>${toggle("rhythmNotice", "节律轻提醒", "提醒记录，不判断疾病或避孕安全期")}${state.rhythmSettingsSaved && !rhythmSettingsStore.inspect().dirty ? notice("设置已保存", "将按你填写的日期展示记录。", "sage") : ""}${buttons([[setup ? "保存并使用周期日期" : "保存设置", setup ? "rhythm-setup-save" : "rhythm-settings-save", "primary", !rhythmSettingsValid(state.rhythmSettingsDraft)], ["不填日期，只记录感受", setup ? "rhythm-setup-skip" : "rhythm-record-only", "secondary"]])}<p class="caption">修改先保留为草稿，点击保存后才会更新记录日期。切换为只记录感受会保留已有记录和已保存的周期设置。</p>${setup ? "" : setting("管理记录", "暂停周期展示或删除记录", "go:RHY-05")}</div>`;
  }
  function rhythmStatePage(item) {
    const states = {
      empty: ["从感受开始记录", "不填经期日期，也能持续记录和回看。", [["只记录感受", "rhythm-record-only", "primary"], ["添加周期日期（可选）", "go:RHY-00", "secondary"]]],
      conflict: ["日期需要核对", "最近一次开始日期与已有记录重叠。请确认正确日期后再继续。", [["修改日期", "go:RHY-00", "primary"], ["先只记录感受", "rhythm-record-only", "secondary"]]],
      paused: ["节律展示已暂停", "已记录的日期和感受仍会保留；重新开启前不显示阶段解释。", [["继续只记录感受", "rhythm-record-only", "primary"], ["恢复周期展示", "rhythm-state:ready", "secondary"], ["管理记录", "go:RHY-05", "text-button"]]],
      insufficient: ["记录还不足以显示阶段", "还需要最近一次开始日期和常见周期长度。补充后会重新计算。", [["继续只记录感受", "rhythm-record-only", "primary"], ["补充周期日期", "go:RHY-00", "secondary"]]],
      error: ["暂时无法加载节律记录", "已保存的数据不会丢失。请检查网络后再试。", [["重新加载", "rhythm-state:ready", "primary"], ["稍后再看", "go:MY-01", "secondary"]]],
    };
    const current = states[state.rhythmStatus];
    if (!current) return "";
    return `${head(item, "RHYTHM")}<div class="stack">${notice(current[0], current[1], state.rhythmStatus === "conflict" ? "warm" : "sage")}${buttons(current[2])}</div>`;
  }
  function rhythm(item) {
    if (item.id === "RHY-01") return rhythmHome.body();
    if (item.id === "RHY-03") return rhythmEditor.body(rhythmRecordStore.inspect(), rhythmEditorProblem, rhythmEditorDraftStatus);
    if (item.id === "RHY-02") return window.renderHaloRhythmGuide({ state, esc, record: rhythmVisibleRecord(), cycle: state.rhythmMode === "cycle" && state.rhythmStatus === "ready" && rhythmHasConfirmedCycle(), icon: domainIcon });
    if (item.id === "RHY-00") return rhythmSetupPage.body();
    if (item.id === "RHY-04") return rhythmSettingsPage.body(rhythmSettingsStore.inspect(), rhythmSettingsFeedback);
    if (item.id === "RHY-05") return rhythmManagementPage.body(rhythmManagementStore.inspect(), rhythmManagementFeedback);
    const statusPage = item.id === "RHY-01" ? rhythmStatePage(item) : "";
    if (statusPage) return statusPage;
    const map = {
      "RHY-06": () => {
        rhythmContextPreview = createHaloSource("rhythm");
        const view = rhythmHandoff.inspect(rhythmContextPreview);
        if (!rhythmContextPreview && (state.healthDeletionStatus && state.healthDeletionStatus !== "ready" || state.accountDeletionStatus && state.accountDeletionStatus !== "ready")) return rhythmHaloPage.blocked(view.error);
        return rhythmHaloPage.body({ source: rhythmContextPreview, record: rhythmVisibleRecord(), date: state.selectedRhythmDate, canConfirm: view.canConfirm, error: rhythmHandoffFeedback || (rhythmContextPreview ? view.error : "") });
      },
    };
    return map[item.id]?.() || generic(item);
  }

  function feedbackPage(item) {
    return feedbackEditor.page();
  }
  function myHome(item) {
    const assets = currentMemberAssetSnapshot();
    const commerce = window.HALO_COMMERCIAL_EXTENSION;
    const next = commerce?.channelJoinNext?.();
    const advisor = !next || next.stage === "new" ? ["成为体验顾问", "了解申请条件", "CHN-01"] : [next.stage === "active" ? "经营中心" : `体验顾问 · ${next.label}`, next.stage === "active" ? "体验顾问" : next.title, next.route];
    const device = myHomeDevice();
    const growth = state.membershipHardwareState === "unbound-retained" ? "等级保留，成长暂停" : isHardwareActive() ? "查看成长进度" : "激活后开启成长";
    const pointsPaused = assets.pending > 0;
    const records = studioHomeRecords();
    const recent = records.find(entry => entry.status.rank < 8) || records[0];
    const row = (icon, label, action, detail = "", meta = "") => `<button type="button" class="my-home-row" data-action="${esc(action)}"><span class="my-home-icon">${myHomeIcon(icon)}</span><span class="my-home-row-copy"><strong>${esc(label)}</strong>${detail ? `<small>${esc(detail)}</small>` : ""}</span>${meta ? `<span class="my-home-row-meta">${esc(meta)}</span>` : ""}${myHomeIcon("chevron")}</button>`;
    return `<section class="my-home" aria-label="我的"><header class="my-home-header"><h1>我的</h1><button type="button" data-action="go:HELP-03" aria-label="联系客服">${myHomeIcon("support")}<span>客服</span></button></header>
      <button type="button" class="my-home-profile" data-action="go:ACC-01"><span class="my-home-avatar" aria-hidden="true">H</span><span><strong>${esc(state.profile.nickname || "Halo 用户")}</strong><small>个人资料</small></span>${myHomeIcon("chevron")}</button>
      <button type="button" class="my-home-device" data-action="${device.action || `go:${device.route}`}"><img src="${HALO_SYMBOL}" alt=""><span><strong>我的 Halo Ring</strong><small>${esc(device.label)}</small></span>${myHomeIcon("chevron")}</button>
      <section class="my-home-member" aria-label="会员账户"><button type="button" class="my-home-member-heading" data-action="go:MEM-01"><span><strong>${esc(assets.level)}</strong><small>${growth}</small></span><span class="my-home-member-more">会员中心${myHomeIcon("chevron")}</span></button><div class="my-home-member-actions"><button type="button" data-action="go:MEM-04">${myHomeIcon("task")}<span>会员任务</span></button><button type="button" class="my-home-points" data-action="go:PTS-01" aria-label="Halo Points，可用 ${esc((assets.points === null ? "—" : assets.points.toLocaleString()))}${pointsPaused ? '，使用暂时暂停' : ''}"><strong>${esc((assets.points === null ? "—" : assets.points.toLocaleString()))}</strong><span>Points</span>${pointsPaused ? '<small>使用暂时暂停</small>' : ''}</button><button type="button" data-action="go:MEM-07">${myHomeIcon("gift")}<span>会员权益</span></button></div></section>
      <section class="my-home-section" aria-label="我的券包"><div class="my-home-list">${row("ticket", "优惠券与兑换券", "go:MY-02", "折扣、满减与体验兑换")}</div></section>
      <section class="my-home-section" aria-labelledby="my-orders-heading"><h2 id="my-orders-heading">订单与体验</h2><div class="my-home-list">${row("bag", "我的订单", "go:SEL-10", "", "全部订单")}${row("calendar", "Halo Studio", "go:STU-08", "预约与体验", recent?.status.label || "暂无预约")}</div></section>
      <section class="my-home-section" aria-labelledby="my-services-heading"><h2 id="my-services-heading">更多服务</h2><div class="my-home-list">${row("bag", "Halo Select", "go:SEL-01", "选购好物")}${row("people", "邀请朋友", "go:REF-01", "推荐与奖励")}${row("advisor", advisor[0], `go:${advisor[2]}`, advisor[1])}</div></section>
      <section class="my-home-section" aria-labelledby="my-settings-heading"><h2 id="my-settings-heading">设置与帮助</h2><div class="my-home-list">${row("shield", "账号与安全", "go:ACC-02")}${row("lock", "数据与隐私", "go:SET-01")}${row("bell", "通知与睡眠目标", "go:SET-02")}${row("settings", "通用设置", "go:SET-03")}${row("help", "使用帮助", "go:HELP-01")}${row("info", "关于与协议", "go:LEGAL-02")}</div></section>
      <nav class="my-home-notes" aria-label="服务说明"><button type="button" data-action="info:membership-rights">会员说明</button><span aria-hidden="true">·</span><button type="button" data-action="commerce-entry">服务说明</button></nav></section>`;
  }
  function myHomeDevice() {
    if (initialSync?.resumeSummary()) return initialSync.resumeSummary();
    if (deviceBinding.resumeRoute()) return { label: state.deviceBinding.status === "success" ? "连接已完成，继续设置" : "查看戒指连接进度", route: "DEV-03" };
    if (!isHardwareActive() && state.devicePaired) return { label: "还需完成激活", route: "DEV-05" };
    if (state.membershipHardwareState === "never-bound") return { label: "尚未连接 Halo Ring", route: "DEV-01" };
    if (state.membershipHardwareState === "unbound-retained") return { label: "设备已解绑", route: "DEV-01" };
    if (!state.toggles.bluetooth) return { label: "蓝牙未开启", route: "DEV-10" };
    const labels = { connected: "已连接", connecting: "正在连接", syncing: "正在同步", disconnected: "暂未连接", low: "电量偏低", action: "连接需要处理" };
    return { label: labels[state.deviceStatus] || "查看设备状态", route: "DEV-10" };
  }
  function myHomeIcon(name) {
    const paths = {
      chevron: '<path d="m9 5 7 7-7 7"/>',
      support: '<path d="M4 14V9a8 8 0 0 1 16 0v5M20 16v2a3 3 0 0 1-3 3h-3"/><rect x="2" y="10" width="4" height="7" rx="1.5"/><rect x="18" y="10" width="4" height="7" rx="1.5"/>',
      task: '<path d="M8 4H5a1 1 0 0 0-1 1v16h16V5a1 1 0 0 0-1-1h-3M8 2h8v4H8Z"/><path d="m8 13 3 3 5-6"/>',
      gift: '<path d="M3 10h18v11H3ZM2 6h20v4H2Zm10 0v15"/><path d="M12 6H8a2.5 2.5 0 1 1 2.4-3.2L12 6Zm0 0h4a2.5 2.5 0 1 0-2.4-3.2L12 6Z"/>',
      ticket: '<path d="M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4Z"/><path d="M15 5v3m0 3v2m0 3v3"/>',
      bag: '<path d="M4 7h16l1 14H3L4 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2M8 11a4 4 0 0 0 8 0"/>',
      calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6m10-6v6M3 11h18m-13 5h5"/>',
      people: '<circle cx="9" cy="7" r="4"/><path d="M2 21v-3a7 7 0 0 1 14 0v3H2Zm15-18a4 4 0 0 1 0 8m2 4a6 6 0 0 1 3 5"/>',
      advisor: '<circle cx="10" cy="6" r="4"/><path d="M13 21H3v-3a7 7 0 0 1 11-5m4 8-4-4a2.5 2.5 0 0 1 4-3 2.5 2.5 0 0 1 4 3l-4 4Z"/>',
      shield: '<path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4Z"/><path d="m8 11 3 3 5-5"/>',
      lock: '<rect x="4" y="10" width="16" height="12" rx="2"/><path d="M7 10V6a5 5 0 0 1 10 0v4m-5 5v3"/>',
      bell: '<path d="M6 8a6 6 0 0 1 12 0v7l3 3H3l3-3V8Zm3 13h6M12 2V1"/>',
      settings: '<path d="M7 3h10l5 9-5 9H7l-5-9 5-9Z"/><circle cx="12" cy="12" r="3"/>',
      help: '<circle cx="12" cy="12" r="10"/><path d="M9 8a3 3 0 1 1 5 2.2c-1.6 1-2 1.2-2 3M12 17h.01"/>',
      info: '<circle cx="12" cy="12" r="10"/><path d="M12 10v7m0-11h.01"/>',
    };
    return `<svg class="my-home-svg ${name === "chevron" ? "my-home-chevron" : ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.info}</svg>`;
  }
  function profileEditorPage() {
    const draft = profileEditorDraft();
    const errors = profileEditorErrors();
    const field = (key, label, attributes, unit = "") => `<div class="profile-editor-field"><div class="profile-editor-label"><label for="profile-${key}">${label}</label>${key === "nickname" ? '<small>必填</small>' : key === "birthday" ? '<small id="profile-age"></small>' : ''}</div><div class="profile-editor-control"><input id="profile-${key}" ${attributes} value="${esc(draft[key])}" aria-describedby="profile-error-${key}" aria-invalid="false">${unit ? `<span class="profile-editor-unit">${unit}</span>` : ''}${key === "birthday" ? `<span class="profile-editor-date-hint" aria-hidden="true" ${draft.birthday ? 'hidden' : ''}>选择出生日期</span>` : ''}</div><p class="profile-editor-error" id="profile-error-${key}" aria-live="polite">${state.profileEditor.touched[key] ? esc(errors[key] || '') : ''}</p></div>`;
    return `<section class="profile-editor" aria-labelledby="profile-editor-title"><header class="profile-editor-header"><button type="button" data-action="profile-back" aria-label="返回上一页">${myHomeIcon("chevron")}</button><h1 id="profile-editor-title">个人资料</h1><span aria-hidden="true"></span></header><form id="profile-editor-form" novalidate><div class="profile-editor-scroll">${basicProfileEditor.resumeEntry()}${field("nickname", "昵称", 'type="text" autocomplete="nickname" placeholder="填写昵称" required')}<section class="profile-editor-body" aria-labelledby="profile-body-title"><div class="profile-editor-group-title"><h2 id="profile-body-title">身体信息</h2><span>选填</span></div><button type="button" class="profile-purpose-link" data-action="profile-purpose">为什么需要这些信息？</button>${field("birthday", "出生日期", `type="date" max="${beijingDateKey()}" autocomplete="bday" data-empty="${!draft.birthday}"`)}<div class="profile-editor-measures">${field("height", "身高", 'type="text" inputmode="decimal" placeholder="填写身高"', 'cm')}${field("weight", "体重", 'type="text" inputmode="decimal" placeholder="填写体重"', 'kg')}</div></section><section class="profile-editor-benefit"><div><strong id="profile-benefit-label">生日权益提醒</strong><p id="profile-benefit-help">关闭提醒也不会影响已有权益</p></div><button type="button" id="profile-birthday-benefit" data-action="profile-birthday-benefit" role="switch" aria-checked="${Boolean(draft.birthdayBenefit)}" aria-labelledby="profile-benefit-label" aria-describedby="profile-benefit-help"><span aria-hidden="true"></span></button></section></div><footer class="profile-editor-footer"><p id="profile-editor-status" role="status" aria-live="polite"></p><button id="profile-save-btn" type="submit" class="primary">保存</button><button id="profile-discard-btn" type="button" data-action="profile-discard" hidden>撤销修改</button></footer></form></section>`;
  }
  function updateProfileEditorControls() {
    if (state.current !== "ACC-01" || !document.getElementById("profile-editor-form")) return;
    const draft = profileEditorDraft();
    const errors = profileEditorErrors();
    const dirty = profileEditorDirty();
    for (const key of ["nickname", "birthday", "height", "weight"]) {
      const input = document.getElementById(`profile-${key}`);
      const error = state.profileEditor.touched[key] || dirty || String(draft[key] || "").trim() ? errors[key] || "" : "";
      input.setAttribute("aria-invalid", String(Boolean(error)));
      input.closest(".profile-editor-control").classList.toggle("invalid", Boolean(error));
      document.getElementById(`profile-error-${key}`).textContent = error;
    }
    document.getElementById("profile-birthday").dataset.empty = String(!draft.birthday);
    screen.querySelector(".profile-editor-date-hint").hidden = Boolean(draft.birthday);
    const today = beijingDateKey();
    document.getElementById("profile-age").textContent = draft.birthday && !errors.birthday ? `${Number(today.slice(0, 4)) - Number(draft.birthday.slice(0, 4)) - (today.slice(5) < draft.birthday.slice(5) ? 1 : 0)} 岁` : "";
    document.getElementById("profile-birthday-benefit").setAttribute("aria-checked", String(Boolean(draft.birthdayBenefit)));
    const invalid = Object.values(errors).some(Boolean);
    const save = document.getElementById("profile-save-btn");
    save.disabled = invalid || !dirty && profileEditorHasSaved();
    save.setAttribute("aria-disabled", String(save.disabled));
    save.textContent = !dirty && profileEditorHasSaved() ? "已保存" : "保存";
    document.getElementById("profile-discard-btn").hidden = !dirty;
    document.getElementById("profile-editor-status").textContent = dirty ? profileDraftRestored ? "已恢复上次未保存的修改" : invalid ? "请检查标出的内容" : "修改尚未保存" : "";
  }
  function me(item) {
    if (item.id === "SET-01") return dataPrivacy.page();
    if (item.id === "SET-02") return notificationSettings.page();
    if (item.id === "MY-01") return myHome(item);
    if (item.id === "ACC-01") return profileEditorPage();
    const map = {
      "MY-01": () => { const copy = membershipCopy(); const memberEntry = state.membershipHardwareState === "unbound-retained" ? `${currentMemberAssetSnapshot().level} · 已有资产保留；重新激活后恢复未来成长` : isHardwareActive() ? "等级、成长、任务、徽章与权益" : "Halo Member · 激活硬件后开始记录成长"; const channelState = window.HALO_COMMERCIAL_EXTENSION?.state?.channelIdentity || "inactive"; const channelActive = channelState === "active"; const channelPending = channelState === "activation-pending"; return `${head(item, "ACCOUNT")}<div class="stack"><section class="halo-identity"><div class="halo-avatar">H</div><div><strong>你好，${esc(state.profile.nickname || "Halo 用户")}</strong><span>${isHardwareActive() ? state.dataLifecycle === "none" ? "戒指已激活 · 等待首晚记录" : "戒指已激活" : "Halo Member · 会员模式"}</span></div></section>${membershipPanel()}${setting("个人资料", "昵称、头像与生日", "go:ACC-01")}${setting("我的 Halo 硬件", `${copy.device} · 查看连接与设备状态`, "go:DEV-10")}${setting("会员说明", "等级、成长、Halo Points 与权益说明", "info:membership-rights")}${setting("会员中心", memberEntry, "go:MEM-01")}${setting("Halo Points", "余额、临期提醒、明细与兑换", "go:PTS-01")}${setting("Halo Select", "精选商品、购物车、订单与售后", "go:SEL-01")}${setting("会员推荐", "邀请朋友并查看奖励进度", "go:REF-01")}${setting(channelActive ? "经营中心" : channelPending ? "体验顾问身份待生效" : "申请体验顾问", channelActive ? "服务订单、收益、学习与工具" : channelPending ? "查看资料与身份状态" : "了解要求并提交申请", channelActive ? "go:CHN-19" : channelPending ? "go:CHN-16" : "go:CHN-01")}${setting("商城、推荐与体验顾问说明", "了解三类服务", "commerce-entry")}${setting("Halo Studio", "预约、体验码与最近体验", "go:STU-08")}${setting("账号与安全", "登录设备与便捷注销", "go:ACC-02")}${setting("数据与隐私", "权限、本地记录与云摘要", "go:SET-01")}${setting("通知、夜间与睡眠目标", "工作日/休息日目标、睡前与报告提醒", "go:SET-02")}${setting("通用设置", "语言、显示、桌面小组件与 Halo 语气", "go:SET-03")}${setting("使用帮助", "FAQ、反馈与企业微信客服", "go:HELP-01")}${setting("关于与协议", "版本、主体与健康边界", "go:LEGAL-02")}</div>`; },
      "SET-03": () => generalSettingsPage(),
      "HELP-01": () => helpCenter.page(),
      "HELP-02": () => feedbackPage(item),
      "HELP-03": () => supportContact.page(),
      "LEGAL-02": () => aboutLegal.page(),
      "ACC-02": () => accountSecurity.page(),
      "ACC-03": () => accountDeletion.page(),
    };
    return map[item.id]?.() || generic(item);
  }

  const STUDIO_HOME_FILTERS = ["全部", "瑜伽", "普拉提", "冥想"];
  const STUDIO_HOME_MEDIA = {
    "yoga-evening": "assets/studio-yoga-v1.png",
    "pilates-morning": "assets/studio-pilates-v1.png",
  };
  function studioHomeIcon(name) {
    const paths = {
      back: '<path d="m14 5-7 7 7 7"/>',
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
      arrow: '<path d="m9 5 7 7-7 7"/>',
      scan: '<path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m8 0h3a2 2 0 0 0 2-2v-3M5 12h14"/>',
      calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h1m6 0h1m-8 3h1"/>',
      pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',
      close: '<path d="m6 6 12 12M6 18 18 6"/>',
      people: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-17a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 4v3"/>',
      person: '<circle cx="12" cy="7" r="3.5"/><path d="M4 21v-2a8 6 0 0 1 16 0v2Z"/>',
      refund: '<path d="m2 9 3 3 3-3M5 12a8 8 0 1 1 2 5m5-11v6l3 2"/>',
      report: '<path d="M6 3h8l5 5v13H6Zm8 0v6h5M9 13h7m-7 4h5"/>',
      ticket: '<path d="M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4Zm9 0v3m0 3v2m0 3v3"/>',
    };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.arrow}</svg>`;
  }
  function studioHomeRecordState(id, record) {
    if (studioReservation.unresolved(record)) return { label: record.refundRequest.status === "unknown" ? "取消结果待确认" : "取消处理中", cta: "查看进度", route: "STU-18", rank: 3 };
    if (!STUDIO_EVENTS[id]) return { label: "历史体验", cta: "查看说明", route: "", rank: 9 };
    if (studioPayment.unresolved(record)) return { label: record.paymentRequest.status === "unknown" ? "支付结果待确认" : "支付处理中", cta: "查看支付进度", route: "STU-17", rank: 1 };
    if (record.refundStatus === "submitted") return { label: "取消处理中", cta: "查看进度", route: "STU-18", rank: 3 };
    if (["refunded", "cancelled"].includes(record.refundStatus)) return { label: record.refundStatus === "refunded" ? "已退款" : "已取消", cta: "查看预约", route: "STU-18", rank: 8 };
    if (record.deletionStatus && record.deletionStatus !== "ready") return { label: "个人记录已删除", cta: record.booked ? "查看预约记录" : "查看说明", route: record.booked ? "STU-18" : "", rank: 9 };
    if (!record.booked && record.bookingRequest?.status === "submitting") return { label: "预约提交中", cta: "查看进度", route: "STU-16", rank: 6 };
    if (record.booked && !record.paid) return { label: "待付款", cta: studioPayment.unavailable(id) ? "查看预约" : "继续支付", route: studioPayment.unavailable(id) ? "STU-18" : "STU-17", rank: 1 };
    if (record.sessionStarted && !record.sessionDone) return { label: "体验进行中", cta: "继续体验", route: "STU-04", rank: 0 };
    if (record.booked && !record.sessionDone) return { label: "已预约", cta: "查看预约", route: "STU-18", rank: 2 };
    if (record.sessionDone) {
      const report = studioReport.summary(record, id);
      if (report.kind === "generated") return { label: report.title, cta: "查看报告", route: "STU-05", rank: 5 };
      if (["waiting", "checking", "failed", "unknown", "review"].includes(report.kind)) return { label: report.title, cta: "查看进度", route: "STU-12", rank: 4 };
    }
    if (!record.sessionDone) return { label: "预约尚未完成", cta: "继续预约", route: "STU-16", rank: 6 };
    return { label: "体验已完成", cta: "查看记录", route: "STU-15", rank: 7 };
  }
  function studioHomeRecords() {
    return Object.entries(state.studioRecords || {})
      .filter(([, record]) => record && (record.booked || record.bookingId || record.sessionStarted || record.sessionDone || record.bookingRequest))
      .map(([id, record]) => ({ id, record, event: record.eventSnapshot || STUDIO_EVENTS[id] || { title: "历史活动", date: "", place: "" }, status: studioHomeRecordState(id, record) }))
      .sort((a, b) => a.status.rank - b.status.rank || (a.status.rank <= 2 ? 1 : -1) * ((Date.parse(a.event.startsAt) || 0) - (Date.parse(b.event.startsAt) || 0)));
  }
  function studioHomeRecordCard(entry, featured = false) {
    const { id, event, status } = entry;
    return `<button type="button" class="studio-record-link ${featured ? "is-featured" : ""}" data-action="studio-home-open:${esc(id)}"><span class="studio-record-status">${esc(status.label)}</span><strong>${esc(event.title)}</strong><span class="studio-record-meta">${esc([event.date, event.place].filter(Boolean).join(" · "))}</span><span class="studio-record-next">${esc(status.cta)}${studioHomeIcon("arrow")}</span></button>`;
  }
  function showStudioHomeRecords() {
    return go("STU-07");
  }
  function studioHomePage() {
    const filter = STUDIO_HOME_FILTERS.includes(state.studioHomeFilter) ? state.studioHomeFilter : "全部";
    const records = studioHomeRecords();
    const current = records.find(entry => entry.status.rank < 8);
    const events = Object.keys(STUDIO_EVENTS).map(id => [id, selectedStudioEvent(id)]).filter(([, event]) => event.seats > 0 && Date.parse(event.startsAt) > Date.now() && (filter === "全部" || event.category === filter));
    const cards = events.map(([id, event]) => `<button type="button" class="studio-event-link" data-action="studio-select:${esc(id)}" aria-label="查看${esc(event.title)}详情">${STUDIO_HOME_MEDIA[id] ? `<img src="${STUDIO_HOME_MEDIA[id]}" alt="${esc(event.category)}场地示意图" width="1774" height="887" loading="eager">` : ""}<span class="studio-event-title"><strong>${esc(event.title)}</strong><b>${event.price ? `¥${esc(event.price)}` : "免费"}</b></span><span class="studio-event-time">${esc(event.date)} · ${esc(event.duration)}分钟</span><span class="studio-event-bottom"><span>${studioHomeIcon("pin")}${esc(event.place)}</span><span>查看详情${studioHomeIcon("arrow")}</span></span></button>`).join("");
    const emptyTitle = filter === "全部" ? "暂时没有可预约的活动" : `暂时没有可预约的${esc(filter)}体验`;
    return `<div class="studio-home"><header class="studio-home-header"><button type="button" class="studio-icon-control" data-action="previous" aria-label="返回上一页">${studioHomeIcon("back")}</button><h1>Halo Studio</h1><button type="button" class="studio-scan-control" data-action="go:STU-01" aria-label="扫码或输入体验码">${studioHomeIcon("scan")}<span>扫码</span></button></header><button type="button" class="studio-my-entry" data-action="studio-home-records">${studioHomeIcon("calendar")}<strong>我的体验</strong><span>${records.length ? `${records.length} 条预约与记录` : "预约与记录"}</span>${studioHomeIcon("arrow")}</button>${current ? `<section class="studio-home-current" aria-label="继续我的体验">${studioHomeRecordCard(current, true)}</section>` : ""}<section class="studio-home-events" aria-labelledby="studio-events-title"><h2 id="studio-events-title">选一场喜欢的体验</h2><div class="studio-category-filter" role="group" aria-label="按活动类型筛选">${STUDIO_HOME_FILTERS.map(value => `<button type="button" aria-pressed="${filter === value}" data-action="studio-home-filter:${value}">${value}</button>`).join("")}</div><div id="studio-home-results" aria-live="polite">${cards || `<div class="studio-home-empty"><h3>${emptyTitle}</h3><p>${filter === "全部" ? "已预约的活动仍可在“我的体验”查看。" : "换个类型看看，已预约的活动不会受影响。"}</p>${filter === "全部" ? "" : '<button type="button" class="secondary" data-action="studio-home-filter:全部">查看全部活动</button>'}</div>`}</div></section></div>`;
  }
  const STUDIO_DETAIL_COPY = {
    "yoga-evening": "跟着主理人完成一组舒展练习，在呼吸与动作之间慢下来。",
    "pilates-morning": "跟着主理人练习核心控制，感受动作与呼吸的配合。",
    "breath-night": "用一段呼吸与冥想练习，把注意力带回当下。",
  };
  function studioDetailState() {
    const id = state.selectedStudioEventId;
    if (!Object.prototype.hasOwnProperty.call(STUDIO_EVENTS, id)) return { label: "暂时无法打开这场活动", cta: "看看其他活动", route: "STU-08", note: "已有预约与记录仍然保留。" };
    const record = state.studioRecords?.[id] || {};
    const unavailable = studioBookingUnavailable(id);
    if (!record.booked && record.bookingRequest?.status === "submitting") return { label: "预约提交中", cta: "查看进度", route: "STU-16", note: "提交进度已保存，不会重复预约。" };
    if (record.booked || record.sessionStarted || record.sessionDone || ["submitted", "refunded", "cancelled"].includes(record.refundStatus) || record.deletionStatus && record.deletionStatus !== "ready") {
      const status = studioHomeRecordState(id, record);
      if (record.booked && !record.paid && record.refundStatus === "none" && unavailable && unavailable !== "本场已满") return { label: "待付款预约", cta: "查看我的预约", route: "STU-18", note: "当前不能继续新预约，请查看原预约或咨询。" };
      return { ...status, cta: status.cta === "查看预约" ? "查看我的预约" : status.cta, route: status.route || "HELP-03", note: ["cancelled", "refunded"].includes(record.refundStatus) ? "原预约记录保留，可查看其他活动。" : "查看本次进度，不会重复预约。" };
    }
    if (unavailable) return { label: unavailable, cta: unavailable, route: "", disabled: true, note: "可以看看其他活动，或咨询活动安排。" };
    return { label: `还可预约 ${selectedStudioEvent().seats} 位`, cta: record.bookingId ? "继续预约" : "预约本次体验", route: "STU-16", note: "下一步确认预约信息，暂不扣款" };
  }
  function studioDetailPage() {
    const id = state.selectedStudioEventId;
    const status = studioDetailState();
    const header = `<header class="studio-detail-header"><button type="button" class="studio-icon-control" data-action="previous" aria-label="返回上一页">${studioHomeIcon("back")}</button><span>活动详情</span><button type="button" data-action="go:HELP-03">咨询</button></header>`;
    if (!Object.prototype.hasOwnProperty.call(STUDIO_EVENTS, id)) return `<div class="studio-detail">${header}<div class="studio-home-empty"><h1>暂时无法打开这场活动</h1><p>${esc(status.note)}</p><button type="button" class="primary" data-action="go:STU-08">看看其他活动</button></div></div>`;
    const event = { ...selectedStudioEvent(id), host: selectedStudioEvent(id).host || "待确认" };
    const record = state.studioRecords?.[id] || {};
    const hours = Number.isFinite(event.cancellationHours) && event.cancellationHours >= 0 ? event.cancellationHours : null;
    const cutoff = hours !== null && Number.isFinite(Date.parse(event.startsAt)) ? experienceTime(Date.parse(event.startsAt) - hours * 3600000) : "";
    const cancellation = hours === null ? "取消条件请咨询确认" : `开始前${hours}小时可自助取消`;
    const bookedAmount = record.booked && Number.isFinite(record.dueAmount) && record.dueAmount >= 0;
    const price = bookedAmount ? record.dueAmount : event.price;
    const showOther = status.disabled || ["submitted", "refunded", "cancelled"].includes(record.refundStatus);
    const info = (key, icon, title, hint, body) => `<details class="studio-detail-info" data-studio-info="${key}"><summary>${studioHomeIcon(icon)}<span>${title}${hint ? `<small>${esc(hint)}</small>` : ""}</span>${studioHomeIcon("arrow")}</summary><div>${body}</div></details>`;
    return `<article class="studio-detail" data-status-key="${esc(JSON.stringify(status))}"><div class="studio-detail-scroll" tabindex="0" aria-label="活动内容与预约说明">${header}${STUDIO_HOME_MEDIA[id] ? `<img class="studio-detail-image" src="${STUDIO_HOME_MEDIA[id]}" alt="${esc(event.category)}场地示意图" width="1774" height="887">` : ""}<h1>${esc(event.title)}</h1><p class="studio-detail-intro">${esc(event.description || STUDIO_DETAIL_COPY[id])}</p><ul class="studio-detail-facts"><li>${studioHomeIcon("calendar")}<span>${esc(event.date)} · ${esc(event.duration)}分钟</span></li><li>${studioHomeIcon("pin")}<span>${esc(event.place)}</span></li><li>${studioHomeIcon("people")}<span class="studio-detail-status">${esc(status.label)}</span></li></ul><div class="studio-detail-host">${studioHomeIcon("person")}<span>本场主理人</span><strong>${esc(event.host)}</strong></div><section class="studio-detail-preparation"><h2>参加前准备</h2><p>穿方便活动的衣服。所需用品与到场安排，可提前咨询。</p></section>${info("cancel", "refund", "取消与退款", cancellation, `<p>${hours === null ? "请在预约前咨询取消条件。" : `本场自助取消截止：${esc(cutoff || "时间待确认")}（北京时间）。超过期限或活动已开始，请联系客服核对可处理方式。`}</p><p>在 App 预约的活动，可从预约详情申请取消并查看退款进度；其他渠道的预约，请联系原预约方处理。</p><button type="button" data-action="go:HELP-03">咨询取消事宜</button>`)}${info("location", "pin", "地点与到场", "", `<p>${esc(event.place)}。完整地址与到场方式请在出发前咨询确认。</p><button type="button" data-action="go:HELP-03">咨询到场安排</button>`)}${info("report", "report", "关于个人报告", "", `<p>没有 Halo Ring 也能参加。想记录本次身体状态，可在到场准备时选择使用戒指记录。</p><p>报告需要你的同意和足够的有效记录，并非每次都会生成。个人报告只对你展示，不提供给活动机构；它用于回看个人状态，不代表活动效果或医疗结论。</p>`)}${!record.booked && !record.sessionStarted && !record.sessionDone ? `<button type="button" class="studio-detail-channel" data-action="go:STU-01">${studioHomeIcon("scan")}<span>在其他渠道预约？扫码核验</span>${studioHomeIcon("arrow")}</button>` : ""}${showOther ? `<button type="button" class="studio-detail-alternative" data-action="go:STU-08">看看其他活动${studioHomeIcon("arrow")}</button>` : ""}</div><footer class="studio-detail-footer"><div class="studio-detail-price"><strong>${Number.isFinite(price) && price >= 0 ? price ? `¥${esc(price)}` : "免费" : "待确认"}</strong><span>${bookedAmount ? "预约金额" : "每位"}</span></div><button type="button" class="primary" data-action="studio-detail-continue" aria-describedby="studio-detail-action-note" ${status.disabled ? "disabled" : ""}>${esc(status.cta)}</button><p id="studio-detail-action-note">${esc(status.note)}</p></footer></article>`;
  }
  let studioBookingReviewOutcome = "success";
  const studioBookingTimers = new Map();
  function studioBookingQuote(id = state.selectedStudioEventId) {
    const known = Object.prototype.hasOwnProperty.call(STUDIO_EVENTS, id);
    const event = known ? selectedStudioEvent(id) : null;
    const record = state.studioRecords?.[id] || {};
    const selected = Boolean(event?.price > 0 && record.useVoucher);
    const selectedId = record.selectedVoucherId || record.bookingRequest?.quote?.voucherId || "";
    const voucher = window.HALO_COMMERCIAL_EXTENSION?.getStudioVoucher?.(id, selected ? selectedId : "", record.bookingRequest?.id || "");
    const invalidVoucher = selected && !voucher?.eligible;
    const discount = selected && !invalidVoucher ? event.price : 0;
    const amount = event && !invalidVoucher ? event.price - discount : null;
    const quote = { eventId: id, eventSnapshot: event ? { ...event } : null, voucherId: selected ? selectedId || voucher?.id || "" : "", useVoucher: selected, amount };
    const unavailable = studioBookingUnavailable(id);
    return { ...quote, key: JSON.stringify({ ...quote, unavailable }), voucher, discount, invalidVoucher, unavailable, known };
  }
  function studioBookingPage() {
    const id = state.selectedStudioEventId;
    const quote = studioBookingQuote(id);
    const header = `<header class="studio-detail-header"><button type="button" class="studio-icon-control" data-action="previous" aria-label="返回上一页">${studioHomeIcon("back")}</button><h1>确认预约</h1><button type="button" data-action="go:HELP-03">咨询</button></header>`;
    if (!quote.known) return `<div class="studio-booking studio-detail">${header}<div class="studio-home-empty"><h2>暂时无法打开这场活动</h2><p>已有预约与记录仍然保留。</p><button class="primary" data-action="go:STU-08">看看其他活动</button></div></div>`;
    const event = quote.eventSnapshot, record = studioRecord(id), request = record.bookingRequest;
    const pending = !record.booked && request?.status === "submitting";
    const existing = Boolean(record.booked || record.sessionDone || record.sessionStarted || ["submitted", "cancelled", "refunded"].includes(record.refundStatus));
    const status = existing ? studioDetailState() : null;
    const amount = existing ? Number.isFinite(record.dueAmount) ? record.dueAmount : null : quote.amount;
    const discount = existing ? Number(record.voucherDiscount) || (record.voucherId ? event.price : 0) : quote.discount;
    const base = existing ? Number.isFinite(record.baseAmount) ? record.baseAmount : amount === null ? null : amount + discount : event.price;
    const money = value => Number.isFinite(value) ? `¥${value.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}` : "待确认";
    const hours = Number.isFinite(event.cancellationHours) ? event.cancellationHours : null;
    const cutoff = hours !== null && Number.isFinite(Date.parse(event.startsAt)) ? experienceTime(Date.parse(event.startsAt) - hours * 3600000) : "";
    const problem = !existing && (quote.unavailable || quote.invalidVoucher && "所选体验券当前不可用，请重新选择。" || record.bookingError);
    const cta = existing ? status.cta : pending ? "正在提交预约…" : quote.unavailable || (quote.invalidVoucher ? "请重新选择体验券" : record.bookingError ? "重新提交预约" : amount === 0 ? "确认预约" : "提交预约，去付款");
    const note = existing ? "已有预约记录，不会重复提交。" : pending ? "可以离开，返回后继续查看进度。" : quote.unavailable || quote.invalidVoucher ? "请先处理页面提示，再继续预约。" : amount === 0 ? "确认后完成预约，无需付款" : "下一步进入付款页，当前不会扣款";
    const voucherBody = existing ? `<p>${record.voucherId ? "本次已使用体验券，选择已保存在原预约中。" : "本次未使用体验券。"}</p>` : event.price === 0 ? `<p>本场免费，无需使用体验券。</p>` : quote.voucher?.eligible || record.useVoucher ? `<button type="button" class="studio-booking-voucher" role="checkbox" aria-checked="${Boolean(record.useVoucher)}" data-action="studio-voucher-toggle" ${pending ? "disabled" : ""}>${studioHomeIcon("ticket")}<span><strong>${esc(quote.voucher?.title || "所选体验券")}</strong><small>${quote.invalidVoucher ? "当前不可用 · 点击取消选择" : `${record.useVoucher ? "已选择" : "本场可用"} · 抵扣 ${money(event.price)}`}</small></span><i aria-hidden="true">${record.useVoucher ? "✓" : ""}</i></button>` : `<p>${quote.voucher ? "现有体验券不适用于这场活动。" : "暂无本场可用的体验券。"}</p>`;
    return `<article class="studio-booking studio-detail" data-quote-key="${esc(quote.key)}"><div class="studio-detail-scroll" tabindex="0" aria-label="预约信息与费用">${header}<div class="studio-booking-event">${STUDIO_HOME_MEDIA[id] ? `<img src="${STUDIO_HOME_MEDIA[id]}" width="80" height="80" alt="${esc(event.category)}场地示意图">` : ""}<div><h2>${esc(event.title)}</h2><p>${esc(event.date)}</p><p>${esc(event.place)} · ${esc(event.duration)}分钟</p></div></div><div class="studio-booking-person"><span>参与人数</span><strong>1 位</strong></div>${existing ? `<div class="studio-booking-status" role="status"><strong>${esc(status.label)}</strong><p>本页展示原预约信息。如需处理取消或退款，请查看原预约。</p></div>` : ""}<section class="studio-booking-section"><h2>体验券</h2>${voucherBody}</section><section class="studio-booking-section studio-booking-cost"><h2>费用明细</h2><dl><div><dt>活动费用</dt><dd>${money(base)}</dd></div><div><dt>体验券抵扣</dt><dd>−${money(discount)}</dd></div><div class="studio-booking-total"><dt>${existing ? "原预约金额" : "本次应付"}</dt><dd>${money(amount)}</dd></div></dl></section><details class="studio-detail-info" data-studio-info="booking-cancel"><summary><span>取消与退款<small>${hours === null ? "取消条件请咨询确认" : `开始前${hours}小时可自助取消`}</small></span>${studioHomeIcon("arrow")}</summary><div><p>${cutoff ? `本场自助取消截止：${esc(cutoff)}（北京时间）。超过期限请咨询客服。` : "请在提交预约前咨询取消条件。"}</p><p>预约成功后，可从预约详情申请取消并查看处理进度。其他渠道预约请联系原预约方。</p><button type="button" data-action="go:HELP-03">咨询取消事宜</button></div></details><p class="studio-booking-payment-note">${existing ? "金额与使用的体验券以原预约记录为准。" : amount === 0 ? "本次无需付款，提交后请查看预约结果。" : "付费活动完成付款后，预约才会确认。"}</p>${problem ? `<div class="studio-booking-error" role="alert"><strong>${esc(problem)}</strong><p>没有新增预约或扣款，已选场次仍保留。</p>${quote.unavailable ? '<button type="button" data-action="go:STU-08">看看其他活动</button>' : ""}</div>` : ""}</div><footer class="studio-detail-footer"><div class="studio-detail-price"><span>${existing ? "原预约金额" : "应付"}</span><strong>${money(amount)}</strong></div><button class="primary" type="button" data-action="studio-book" aria-describedby="studio-booking-note" ${!existing && (pending || quote.unavailable || quote.invalidVoucher) ? "disabled" : ""}>${esc(cta)}</button><p id="studio-booking-note" role="status">${esc(note)}</p></footer></article>`;
  }
  function submitStudioBooking() {
    if (!state.signedIn) return go("AUTH-01");
    const id = state.selectedStudioEventId, quote = studioBookingQuote(id);
    if (!quote.known) return showInfoModal(quote.unavailable, "没有新增预约或扣款。", "看看其他活动", "go:STU-08");
    const record = studioRecord(id);
    if (record.booked || record.sessionStarted || record.sessionDone || ["submitted", "cancelled", "refunded"].includes(record.refundStatus)) return go(studioDetailState().route || "STU-18");
    if (record.bookingRequest?.status === "submitting") return;
    const rendered = screen.querySelector(".studio-booking[data-quote-key]");
    const error = quote.unavailable || (quote.invalidVoucher ? "所选体验券当前不可用，请重新选择。" : rendered && rendered.dataset.quoteKey !== quote.key ? "预约信息有更新，请核对金额后再次提交。" : "");
    if (error) { record.bookingError = error; render(); screen.querySelector(".studio-booking-error")?.scrollIntoView({ block: "nearest" }); return; }
    const requestId = record.bookingRequest?.id || `SB-${id}-${Date.now()}`;
    record.bookingError = "";
    record.bookingRequest = { id: requestId, status: "submitting", readyAt: Date.now() + 900, outcome: studioBookingReviewOutcome, quote: { ...quote, voucher: undefined }, submittedAt: new Date().toISOString() };
    persistAppProgress();
    trackPrototypeEvent("studio_booking_submitted", { event_id: id, request_id: requestId });
    render();
  }
  function finishStudioBooking(id, requestId) {
    if (navigator.locks?.request) return navigator.locks.request("halo-points-redemption", () => finishStudioBookingLocked(id, requestId));
    return finishStudioBookingLocked(id, requestId);
  }
  function finishStudioBookingLocked(id, requestId) {
    const record = state.studioRecords?.[id], request = record?.bookingRequest;
    if (!state.signedIn || request?.status !== "submitting" || request.id !== requestId) return;
    const originalBooking = JSON.parse(JSON.stringify(record));
    const current = studioBookingQuote(id), quote = request.quote;
    let error = current.unavailable || (current.invalidVoucher ? "所选体验券当前不可用，请重新选择。" : current.key !== quote.key ? "预约信息有更新，请核对后重新提交。" : request.outcome === "fail" ? "预约暂未完成，请重试。" : "");
    if (!error && quote.useVoucher) {
      try { if (!window.HALO_COMMERCIAL_EXTENSION?.consumeStudioVoucher?.(id, requestId, quote.voucherId)) error = "体验券未能使用，请重试或取消选择。"; }
      catch { error = "体验券使用状态待确认，请重试。"; }
    }
    if (error) { request.status = "failed"; record.bookingError = error; }
    else {
      Object.assign(record, { eventSnapshot: { ...quote.eventSnapshot }, bookingId: requestId, accountRef: String(state.authPhone || state.authForm?.phone || "local-demo"), registrationId: state.memberCreatedAt, localRefundContract: { version: "demo-full-before-cutoff-v1", bookingId: requestId, amount: quote.amount }, dueAmount: quote.amount, baseAmount: quote.eventSnapshot.price, voucherDiscount: quote.useVoucher ? quote.eventSnapshot.price : 0, voucherId: quote.voucherId, useVoucher: quote.useVoucher, booked: true, source: "app", paid: quote.amount === 0, paidAmount: 0 });
      request.status = "complete"; record.bookingError = "";
    }
    persistAppProgress();
    if (!error) {
      let saved = null; try { saved = JSON.parse(localStorage.getItem(APP_PROGRESS_KEY))?.studioRecords?.[id]; } catch {}
      if (!saved?.booked || saved.bookingRequest?.id !== requestId || saved.bookingRequest?.status !== "complete") {
        Object.assign(record, originalBooking);
        record.bookingError = "预约结果暂未保存，请重新查询原预约。已处理的体验券不会重复核销。";
        if (record.bookingRequest) record.bookingRequest.status = "failed";
        render(); return;
      }
      trackPrototypeEvent("studio_booking_completed", { event_id: id, booking_id: requestId });
    }
    if (state.selectedStudioEventId === id) syncStudioAliases();
    if (!error && state.current === "STU-16" && state.selectedStudioEventId === id) return go(record.paid ? "STU-18" : "STU-17");
    render();
    if (error && state.current === "STU-16" && state.selectedStudioEventId === id) screen.querySelector(".studio-booking-error")?.scrollIntoView({ block: "nearest" });
  }
  function resumeStudioBookings() {
    if (!state.signedIn) return;
    for (const [id, record] of Object.entries(state.studioRecords || {})) {
      const request = record.bookingRequest;
      if (request?.status !== "submitting" || !request.quote || !Number.isFinite(request.readyAt) || studioBookingTimers.has(id)) continue;
      studioBookingTimers.set(id, setTimeout(() => { studioBookingTimers.delete(id); finishStudioBooking(id, request.id); }, Math.max(0, Math.min(900, request.readyAt - Date.now()))));
    }
  }
  function studioBookingReviewControls(item) {
    return item.id === "STU-16" ? `<section class="review-block"><h3>确认预约 · 本地审阅</h3><p>提交延迟 0.9 秒用于检查反馈与恢复，不是座位锁定期限；不调用真实预约或支付服务。</p><button data-action="studio-booking-review:success">提交成功</button><button data-action="studio-booking-review:fail">模拟提交失败</button><p>当前：${studioBookingReviewOutcome === "fail" ? "失败" : "成功"}；体验券仍读取已有资产，不自动赠券。</p></section>` : "";
  }
  function studio(item) {
    if (item.id === "STU-01") return studioCodeLookup.page();
    if (item.id === "STU-02") return studioInstitution.page();
    if (item.id === "STU-17") return studioPayment.page();
    if (item.id === "STU-18") return studioReservation.page();
    if (item.id === "STU-10") return studioPreparation.page();
    if (item.id === "STU-03") return studioPreflight.page();
    if (item.id === "STU-04") return studioSession.page();
    if (item.id === "STU-12") return studioReport.page();
    if (item.id === "STU-05") return studioPostReport.page();
    if (item.id === "STU-06") return studioNextDay.page();
    if (item.id === "STU-13") return studioBenefit.page();
    if (item.id === "STU-14") return studioContact.page();
    if (item.id === "STU-07") return studioHistory.page();
    if (item.id === "STU-15") return studioRecordDetail.page();
    if (item.id === "STU-11") return studioFeeling.page();
    syncStudioAliases();
    const event = selectedStudioEvent();
    const record = studioRecord();
    const voucher = window.HALO_COMMERCIAL_EXTENSION?.getStudioVoucher?.(state.selectedStudioEventId);
    const eventPrice = event.price ? `¥${event.price}` : "免费会员场";
    const amount = record.useVoucher && voucher?.eligible ? 0 : event.price;
    const eventSummary = card(event.title, `${event.date} · ${event.place} · ${event.duration} 分钟`, `${event.category} · ${record.booked ? "1 位" : eventPrice}`);
    const cancelled = ["refunded", "cancelled"].includes(record.refundStatus);
    const bookingLabel = cancelled ? "已取消" : record.refundStatus === "submitted" ? "取消处理中" : !record.booked ? "未预约" : !record.paid ? "待付款" : record.sessionDone ? "体验已完成" : "已确认";
    const paymentLabel = studioPayment.unresolved(record) ? record.paymentRequest.status === "unknown" ? "支付结果待确认" : "支付处理中" : record.refundStatus === "refunded" ? `已退回 ¥${record.paidAmount}` : record.refundStatus === "submitted" ? "退款处理中" : !record.paid ? "未支付" : record.voucherId ? "体验券已使用" : record.paidAmount ? `已支付 ¥${record.paidAmount}` : "无需支付";
    const map = {
      "STU-08": studioHomePage,
      "STU-09": studioDetailPage,
      "STU-16": studioBookingPage,
    };
    return map[item.id]?.() || generic(item);
  }

  function pageBody(item) {
    // This page audits durable assets; do not invoke the commercial render path,
    // which intentionally persists and resumes its own interactive flows.
    if (item.id === "ACC-03") return accountDeletion.page();
    if (item.id === "HLT-04") return renderMeasurementResult(item);
    if (item.id === "HLT-03") return measurementCenter.page();
    if (item.id === "TOD-11") return dataQuality.body();
    if (item.id === "HLT-01") return heartDetailPage();
    if (item.id === "HLT-02") return respirationDetailPage();
    if (item.id === "HLT-05") return oxygenDetailPage();
    if (item.id === "HLT-06") return temperatureDetailPage();
    if (item.id === "TOD-05") return sleepDetailPage();
    if (item.id === "TOD-06") return energyDetailPage();
    if (item.id === "TOD-07") return activityDetailPage();
    const healthContext = state.healthDetailContext;
    if (healthContext?.route === item.id && (!isHardwareActive() || healthContext.date !== state.healthDemoRecordDate)) return healthDatedEmptyPage(item);
    if (healthContext?.route === item.id && healthContext.date !== beijingDateKey()) {
      const entry = HEALTH_OVERVIEW_ITEMS.find(candidate => candidate.key === healthContext.metric);
      const reading = entry ? healthOverviewReading(entry, healthContext.date) : null;
      return `<article class="health-overview health-dated-record"><header class="health-overview-header"><button data-action="previous" aria-label="返回">${healthChevron("left")}</button><h1>${esc(entry?.title || "数据说明")}</h1><span></span></header><p class="health-dated-label">${esc(healthDateLabel(healthContext.date))}的记录</p>${reading ? `<section class="health-overview-guide"><strong>${esc(reading.value)}${reading.unit ? ` ${esc(reading.unit)}` : ""}</strong><p>${esc(reading.detail)}</p></section>` : notice("Halo Ring", state.dataLifecycle === "none" ? "这一天暂无记录。" : state.dataLifecycle === "limited" ? "夜间记录有缺口，保留已同步片段。" : "已保存这一天同步的记录。", "sage")}${buttons([["返回健康数据", "go:HLT-00", "primary"], ["查看今天", "health-date:today", "secondary"]])}<p class="health-overview-boundary">用于日常健康管理，不替代医疗诊断。</p></article>`;
    }
    const commercialBody = window.HALO_COMMERCIAL_EXTENSION?.render(item, {
      applicationContext: () => ({ signedIn: state.signedIn, accountRef: state.authPhone || state.authForm?.phone || "", key: state.authForm?.login?.id || state.agreementAcceptance?.acceptedAt || (state.signedIn ? "legacy-session" : ""), page: state.current }),
      go,
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
    if (state.measurementType === "oxygen") return oxygenMeasurement?.reviewControls(item) || "";
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
    // Oxygen capability fixtures are explicitly review-only; never shown as app settings.
    if (reviewControls) reviewControls.innerHTML = item.id === "SYS-01" ? startup.reviewControls() : `${healthReports.reviewControls(item)}${authReviewControls(item)}${connectionIntroReviewControls(item)}${deviceScan.reviewControls(item)}${deviceBinding.reviewControls(item)}${deviceHome?.reviewControls(item) || ""}${deviceInfo?.reviewControls(item) || ""}${deviceMaintenance?.reviewControls(item) || ""}${activitySyncReviewControls(item)}${membershipReviewControls()}${bodyWeatherReviewControls(item)}${measurementReviewControls(item)}${rhythmReviewControls(item)}${studioCodeLookup.reviewControls(item)}${studioInstitution.reviewControls(item)}${studioBookingReviewControls(item)}${studioPayment.reviewControls(item)}${studioReservation.reviewControls(item)}${studioPreparation.reviewControls(item)}${studioFeeling.reviewControls(item)}${studioPreflight.reviewControls(item)}${studioSession.reviewControls(item)}${studioReport.reviewControls(item)}${studioBenefit.reviewControls(item)}${window.HALO_COMMERCIAL_EXTENSION?.reviewControls(item) || ""}`;
  }
  function renderTabs(item) {
    const prefix = item.id.split("-")[0];
    const shoppingPage = prefix === "SEL";
    const recordPage = item.id === "TOD-02";
    screen.closest(".device-shell").classList.toggle("shopping-subpage", shoppingPage);
    screen.closest(".device-shell").classList.toggle("record-subpage", recordPage);
    const active = ["TOD", "HLT"].includes(prefix) ? "TOD-01" : prefix === "NIG" ? "NIG-01" : prefix === "HAL" ? "HAL-01" : prefix === "RHY" ? "RHY-01" : ["MY", "ACC", "SET", "HELP", "DEV", "STU", "MEM", "PTS", "REF", "SEL", "CHN"].includes(prefix) && !["DEV-01", "DEV-02", "DEV-03", "DEV-04", "DEV-05"].includes(item.id) ? "MY-01" : "";
    tabbar.style.visibility = shoppingPage || recordPage || !state.signedIn || state.welcomeShopping && item.id === "SEL-03" || ["SYS", "ONB", "AUTH", "LEGAL", "PERM"].includes(prefix) || ["DEV-01", "DEV-02", "DEV-03", "DEV-04", "DEV-05", "RHY-00"].includes(item.id) ? "hidden" : "visible";
    tabbar.querySelectorAll("button").forEach((button) => button.classList.toggle("active", button.dataset.tab === active));
  }
  function render() {
    const accountChanged = todayRhythmStorage?.accessError() || personalScope?.accessError();
    if (accountChanged) {
      modalRoot.innerHTML = ""; tabbar.hidden = true;
      screen.innerHTML = `<section class="stack">${notice("请重新打开当前页面", accountChanged)}${buttons([["重新打开", "today-rhythm-reload", "primary"]])}</section>`;
      return;
    }
    if (!generalSettingsSafe()) return;
    if (haloSettingsHub?.blocksPersist()) { haloSettingsHub.canLeave(); return; }
    if (haloPrivacyControls?.blocksPersist()) { haloPrivacyControls.canLeave(); return; }
    if (haloJourney?.blocksPersist()) { haloJourney.canLeave(); return; }
    studioInstitution?.prepare();
    if (haloFeelingEditor?.blocksPersist()) { haloFeelingEditor.canLeave(); return; }
    studioCodeLookup?.prepare();
    if (haloProactive?.blocksPersist()) { haloProactive.canLeave(); return; }
    studioRecordDetail?.prepare();
    studioHistory?.prepare();
    if (haloMemory?.blocksPersist()) { haloMemory.canLeave(); return; }
    studioContact?.prepare();
    rhythmCyclePage.prepare();
    if (haloHistory?.blocksPersist()) { haloHistory.canLeave(); return; }
    studioBenefit?.prepare();
    studioTodayReminder?.prepare();
    studioSession.prepare();
    studioReport.prepare();
    studioPreflight.prepare();
    if (nightSessionDue() && finishNightSession.failedKey !== nightCompletionKey()) {
      const completed = finishNightSession(false);
      if (completed && state.current === "NIG-04") { go("NIG-10"); return; }
    }
    capturePageView();
    oxygenMeasurement?.prepare();
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
    if (modalRoot.querySelector(".rh-manage-confirm") && (item.id !== "RHY-05" || !rhythmManagementStore.inspect().canManage)) closeModal();
    if (item.id === "RHY-05" && !samePage) { const result = rhythmManagementStore.open(); rhythmManagementFeedback = result.error || ""; }
    if (item.id === "RHY-06" && !samePage) rhythmHandoffFeedback = "";
    window.haloChannelStorage?.select({ applicationContext: () => ({ signedIn: state.signedIn, accountRef: state.authPhone || "", key: state.authForm?.login?.id || state.agreementAcceptance?.acceptedAt || (state.signedIn ? "legacy-session" : ""), page: state.current }) });
    window.HALO_COMMERCIAL_EXTENSION?.observePage?.(item, { render });
    deviceScan.prepare();
    deviceBinding.prepare();
    deviceWear.prepare();
    deviceHome?.prepare();
    initialSync?.prepare();
    deviceInfo?.prepare();
    deviceMaintenance?.prepare();
    dataPrivacy?.prepare();
    notificationSettings?.prepare();
    haloFeelingEditor?.prepare();
    haloJourney?.prepare();
    haloPrivacyControls?.prepare();
    haloSettingsHub?.prepare();
    systemHealth?.prepare();
    if (item.id === "ONB-01") { state.authReturnRoute = ""; state.welcomeShopping = false; }
    if (item.id !== "HLT-00" && item.id !== state.healthDetailContext?.route) state.healthDetailContext = null;
    document.getElementById("stage-title").textContent = `${item.id} · ${item.name}`;
    renderNavigation();
    renderInspector(item);
    if (item.id === "ACC-03") document.getElementById("review-controls")?.insertAdjacentHTML("beforeend", accountDeletion.reviewControls());
    if (item.id === "PERM-01") document.getElementById("review-controls")?.insertAdjacentHTML("beforeend", `<section class="review-controls"><h3>系统回执演示</h3><small>只模拟系统设置，不访问真实手机权限。失败不改变已有状态。</small><div class="review-control-group"><button data-action="perm:review:success" class="${!permissionCheckFails ? "active" : ""}">正常返回</button><button data-action="perm:review:failed" class="${permissionCheckFails ? "active" : ""}">检查失败</button></div></section>`);
    if (item.id === "PERM-01") document.getElementById("review-controls")?.insertAdjacentHTML("beforeend", systemHealth.reviewControls());
    if (item.id === "HLT-05") document.getElementById("review-controls")?.insertAdjacentHTML("afterbegin", oxygenReviewControls(item));
    if (item.id === "HLT-06") document.getElementById("review-controls")?.insertAdjacentHTML("afterbegin", temperatureReviewControls());
    if (item.id === "SET-01") document.getElementById("review-controls")?.insertAdjacentHTML("afterbegin", dataPrivacy.reviewControls(item));
    if (item.id === "SET-02") document.getElementById("review-controls")?.insertAdjacentHTML("afterbegin", notificationSettings.reviewControls(item));
    if (item.id === "DEV-05" && !document.querySelector('[data-action^="initial-sync:review:"]')) document.getElementById("review-controls")?.insertAdjacentHTML("beforeend", initialSync.reviewControls(item));
    renderTabs(item);
    if (item.id === "ACC-01" && !samePage) profileDraftRestored = profileEditorDirty();
    disposeHeartTrend();
    disposeRespirationTrend();
    disposeOxygenTrend();
    disposeOxygenDay();
    disposeTemperatureTrend();
    screen.innerHTML = pageBody(item);
    if (finishNightSession.failedKey === nightCompletionKey() && (item.id.startsWith("NIG-") || ["TOD-01", "TOD-08"].includes(item.id))) {
      const panel = screen.querySelector(".night-home") || screen, header = panel.querySelector(":scope > header");
      (header || panel).insertAdjacentHTML(header ? "afterend" : "afterbegin", `<section class="night-completion-error" role="alert"><p>播放已结束，收听记录还没能保存。进度仍在，请重试。</p><button type="button" data-action="night-reconcile-retry">重试保存记录</button></section>`);
    }
    disposeTemperatureTrend = item.id === "HLT-06" ? window.HALO_TEMPERATURE_TREND.mount(screen, { data: temperatureDataModel(), onSelect: date => selectTemperatureDate(date, true) }) : () => {};
    disposeHeartTrend = item.id === "HLT-01" ? window.HALO_HEART_TREND.mount(screen, { data: heartDataModel(), selection: state.heartTrendSelection, onSelect: selection => { state.heartTrendSelection = selection; persistAppProgress(); } }) : () => {};
    disposeRespirationTrend = item.id === "HLT-02" ? window.HALO_RESPIRATION_TREND.mount(screen, { data: respirationDataModel(), onSelect: date => selectRespirationDate(date, true) }) : () => {};
    disposeOxygenTrend = item.id === "HLT-05" && state.oxygenMode === "night" ? window.HALO_OXYGEN_TREND.mount(screen, { data: oxygenDataModel(), onSelect: date => selectOxygenDate(date, true) }) : () => {};
    disposeOxygenDay = item.id === "HLT-05" && state.oxygenMode === "day" ? window.HALO_OXYGEN_DAY.mount(screen, { data: oxygenDayModel(), onSelect: selection => { state.oxygenDaySelection = selection; history.replaceState({ ...history.state, oxygenDaySelection: selection }, "", location.href); persistAppProgress(); } }) : () => {};
    if (item.id === "DEV-10" && !deviceHome) screen.querySelector(".stack")?.insertAdjacentHTML("afterbegin", deviceBinding.resumeEntry());
    screen.dataset.page = item.id;
    basicProfileEditor.mount(samePage);
    if (item.id !== "SYS-01") state.lastVisitedRoute = item.id;
    document.documentElement.classList.toggle("reduce-motion", Boolean(state.toggles.reduceMotion));
    const savedView = item.id === "HLT-05" && state.pageViews[item.id]?.oxygenMode !== state.oxygenMode ? null : ["STU-09", "STU-16", "STU-17", "STU-18", "STU-10", "STU-11", "STU-03", "STU-04"].includes(item.id) && state.pageViews[item.id]?.eventId !== state.selectedStudioEventId ? null : state.pageViews[item.id];
    const matchingRhythmView = ["RHY-00", "RHY-04", "RHY-05"].includes(item.id) ? savedView?.rhythmOwner === String(state.authPhone || state.authForm?.phone || "legacy-session") : !["RHY-02", "RHY-06"].includes(item.id) || savedView?.rhythmDate === state.selectedRhythmDate && savedView?.rhythmOwner === String(state.authPhone || state.authForm?.phone || "legacy-session");
    if (savedView && matchingRhythmView) screen.querySelectorAll("details").forEach((el, index) => {
      if (item.id === "NIG-10") { el.open = savedView.nightHistoryOwner === String(state.authPhone || state.authForm?.phone || "") && (savedView.nightHistoryOpen || []).includes(el.dataset.historyId); return; }
      // Activity sections have stable keys so reordering does not open a different section.
      const key = item.id === "TOD-07" ? el.dataset.activitySection : "";
      el.open = key ? savedView.activitySections ? Boolean(savedView.activitySections[key]) : (savedView.open || []).includes({ source: 0, record: 1 }[key]) : (savedView.open || []).includes(index);
    });
    const playerButton = screen.querySelector('[data-action="toggle-player"]');
    if (playerButton) playerButton.setAttribute("aria-label", (item.id === "NIG-04" ? state.nightSession?.status === "playing" : state.playing) ? "暂停播放" : "继续播放");
    const chatSendButton = screen.querySelector('[data-action="send-chat"]');
    if (chatSendButton) chatSendButton.setAttribute("aria-label", "发送消息");
    if (item.id === "HAL-01") updateHaloComposer();
    if (item.id === "ACC-01") updateProfileEditorControls();
    if (item.id === "TOD-07") updateActivityRecordControls();
    if (item.id === "HAL-01" && !samePage && state.chat.length) revealLatestHaloMessage();
    (item.id === "RHY-03" ? screen.querySelector(".rh-editor-scroll") || screen : item.id === "RHY-00" ? screen.querySelector(".rh-setup-scroll") || screen : item.id === "RHY-04" ? screen.querySelector(".rh-settings-scroll") || screen : item.id === "RHY-06" ? screen.querySelector(".rh-halo-scroll") || screen : item.id === "TOD-02" ? screen.querySelector(".record-page-scroll") || screen : ["STU-01", "STU-02", "STU-09", "STU-16", "STU-17", "STU-18", "STU-10", "STU-11", "STU-03", "STU-04", "STU-12", "STU-05", "STU-06", "STU-07", "STU-13", "STU-14", "STU-15"].includes(item.id) ? screen.querySelector(".studio-detail-scroll") || screen : screen).scrollTop = matchingRhythmView ? savedView?.top || 0 : 0;
    if (!samePage && state.healthDetailContext?.route === item.id && state.healthDetailContext.metric === "hrv") {
      const hrvSection = screen.querySelector(".education-section") || screen.querySelector(".detail-section:nth-of-type(3)");
      const explanation = hrvSection?.querySelector(".hrv-disclosure");
      if (explanation) explanation.open = true;
      if (hrvSection) screen.scrollTop += hrvSection.getBoundingClientRect().top - screen.getBoundingClientRect().top - 16;
    }
    const restoreFocus = focusId ? document.getElementById(focusId) : focusAction ? [...screen.querySelectorAll("[data-action]")].find(el => el.dataset.action === focusAction) : null;
    if (restoreFocus && !restoreFocus.disabled) {
      restoreFocus.focus({ preventScroll: true });
      if (selection && restoreFocus.setSelectionRange) { try { restoreFocus.setSelectionRange(...selection); } catch {} }
    }
    healthReports.afterRender();
    stateShare.afterRender();
    dataQuality.afterRender();
    rhythmHome.afterRender();
    bodyWeatherRoute.afterRender();
    if (item.id === "RHY-02" && !matchingRhythmView) screen.scrollTop = 0;
    helpCenter?.afterRender();
    supportContact?.afterRender();
    aboutLegal?.afterRender();
    accountSecurity?.afterRender();
    accountDeletion?.afterRender();
    feedbackEditor?.afterRender();
    studioTodayReminder?.afterRender();
    history.replaceState({ ...history.state, healthDate: item.id === "HLT-00" ? state.healthSelectedDate : null, healthContext: state.healthDetailContext, respirationWindowEnd: item.id === "HLT-02" ? respirationDataModel().windowEnd : null, temperatureWindowEnd: item.id === "HLT-06" ? temperatureDataModel().windowEnd : null, oxygenWindowEnd: item.id === "HLT-05" ? oxygenDataModel().windowEnd : null, oxygenMode: state.oxygenMode, oxygenDaySelection: state.oxygenDaySelection, ...nightReview.historyFields(item.id), ...nightHome.historyFields(item.id), ...healthReports.historyFields(item.id), ...stateShare.historyFields(item.id), ...dataQuality.historyFields(item.id), ...rhythmHome.historyFields(item.id), ...bodyWeatherRoute.historyFields(item.id) }, "", location.href);
    persistAppProgress();
    resumeAuthRequest();
    haloHistory?.afterRender();
    haloMemory?.afterRender();
    haloProactive?.afterRender();
    haloFeelingEditor?.afterRender();
    haloJourney?.afterRender();
    haloPrivacyControls?.afterRender();
    haloSettingsHub?.afterRender();
    generalSettingsMounted = state.current === "SET-03";
    resumeConnectionIntro();
    resumeStudioBookings();
    studioPayment.resume();
    studioReservation.resume();
    deviceScan.resume();
    deviceBinding.resume();
    deviceHome?.resume();
    initialSync?.resume();
    deviceInfo?.resume();
    deviceMaintenance?.resume();
    dataPrivacy?.resume();
    resumeActivitySync();
    healthReports.resume();
    startup?.resume();
    requestAnimationFrame(() => nav.querySelector(".nav-item.active")?.scrollIntoView({ block: "nearest", inline: "nearest" }));
  }
  function revealLatestHaloMessage() {
    requestAnimationFrame(() => {
      const chatScroll = document.querySelector(".hal-chat-scroll");
      if (chatScroll) { chatScroll.scrollTop = chatScroll.scrollHeight; return; }
      const target = document.querySelector("#chat-messages .message:last-child") || document.querySelector(".halo-composer");
      const reducedMotion = Boolean(state.toggles.reduceMotion) || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      target?.scrollIntoView({ block: "nearest", behavior: reducedMotion ? "auto" : "smooth" });
    });
  }

  function handleAction(action, recordLockHeld = false) {
    if (action === "today-rhythm-reload") { location.reload(); return; }
    if (todayRhythmStorage?.accessError() || personalScope?.accessError()) { render(); return; }
    if (action === "night-reconcile-retry") { finishNightSession.failedKey = ""; render(); return; }
    if (!recordLockHeld && navigator.locks?.request && /^(record-save(?:-inline)?$|record-delete-confirm:|activity-record-save$|rhythm-feeling-save$|rhythm-delete-confirm:)/.test(action || "")) {
      navigator.locks.request("halo-today-rhythm-records", () => handleAction(action, true)).catch(() => flash("这次没有保存成功，内容仍在，请重试。"));
      return;
    }
    if (haloSettingsHub?.handle(action)) return;
    if (haloPrivacyControls?.handle(action)) return;
    if (haloJourney?.handle(action)) return;
    if (typeof action !== "string" || !action) return;
    if (haloFeelingEditor?.handle(action)) return;
    if (typeof action !== "string" || !action) return;
    if (haloProactive?.handle(action)) return;
    if (haloMemory?.handle(action)) return;
    if (rhythmCyclePage.handle(action)) return;
    if (haloHistory?.handle(action)) return;
    if (accountDeletion?.handle(action)) return;
    if (studioTodayReminder?.handle(action)) return;
    if (nightHome.handle(action)) return;
    if (nightFade.handle(action)) return;
    if (nightWake.handle(action)) return;
    if (nightSound.handle(action)) return;
    if (accountSecurity?.handle(action)) return;
    if (aboutLegal?.handle(action)) return;
    if (action === "health-source:open") modalReturnFocus = screen.querySelector('[data-action="health-source:open"]');
    if (systemHealth?.handle(action)) return;
    if (supportContact?.handle(action)) return;
    if (measurementCenter.handle(action)) return;
    if (state.measurementType !== "oxygen" && (action === "measure-complete" || action === "measurement-reset" || action === "measurement-fail" || action?.startsWith("measurement-state:"))) return showInfoModal("主动测量能力待确认", "当前暂不能开始这项测量。已保存的记录仍可在主动测量中心查看。");
    if (handlePermissionAction(action)) return;
    if (feedbackEditor?.handle(action)) return;
    if (helpCenter?.handle(action)) return;
    if (action === "previous" && helpCenter?.back()) return;
    if (action === "measurement-start:oxygen") { capturePageView(); return oxygenMeasurement.start(state.current); }
    if (state.measurementType === "oxygen" && typeof action === "string") {
      const mapped = { "measure-complete": "complete", "measurement-reset": "retry", "measurement-cancel": "cancel", "measurement-fail": "review-fail", "measurement-state:failed": "review-fail", "measurement-state:complete": "complete", "measurement-state:ready": "start" }[action];
      if (mapped) return oxygenMeasurement.handle(`oxygen-measure:${mapped}`);
      if (action.startsWith("measurement-state:")) return;
    }
    if (oxygenMeasurement?.handle(action)) return;
    if (basicProfileEditor.handle(action)) return;
    if (!action) return;
    if (deviceMaintenance?.handle(action)) return;
    if (dataPrivacy?.handle(action)) return;
    if (notificationSettings?.handle(action)) return;
    if (handleGeneralAction(action)) return;
    if (nightReview.handle(action)) return;
    if (nightHistoryPage.handle(action)) return;
    if (healthReports.handle(action)) return;
    if (stateShare.handle(action)) return;
    if (dataQuality.handle(action)) return;
    if (rhythmHome.handle(action)) return;
    if (rhythmSetupPage.handle(action)) return;
    // Compatibility actions on the old setup page must use its guarded flow.
    if (state.current === "RHY-00" && ["rhythm-setup-skip", "rhythm-setup-save", "rhythm-settings-save", "rhythm-record-only", "previous"].includes(action)) return rhythmSetupPage.handle(["rhythm-setup-save", "rhythm-settings-save"].includes(action) ? "rh-setup:save" : "rh-setup:later");
    if (handleRhythmSettings(action)) return;
    if (handleRhythmManagement(action)) return;
    if (action.startsWith("rh-guide:")) {
      if (state.current !== "RHY-02") return;
      if (action === "rh-guide:halo") {
        if (!rhythmVisibleRecord()) { render(); return flash("这一天的记录暂不可用，请回到日历查看"); }
        return go("RHY-06");
      }
      if (action === "rh-guide:calendar") return go("RHY-01");
      return;
    }
    if (initialSync?.handle(action)) return;
    if (deviceInfo?.handleAction(action)) return;
    if (deviceHome?.handleAction(action)) return;
    if (action.startsWith("bw-open:")) {
      if (state.current !== "TOD-03" || !state.signedIn) return;
      const metric = action.slice(8);
      const route = { sleep: "TOD-05", energy: "TOD-06", activity: "TOD-07" }[metric];
      if (!route) return;
      const date = bodyWeatherPageState().hasRecords ? state.healthDemoRecordDate : beijingDateKey();
      state.healthSelectedDate = date;
      state.healthDetailContext = { date, metric, route };
      delete state.pageViews[route];
      const stack = state.tabStacks["TOD-01"] || (state.tabStacks["TOD-01"] = ["TOD-01"]);
      if (stack.at(-1) !== "TOD-03") stack.push("TOD-03");
      return go(route);
    }
    if (action === "bw-records" && ["TOD-03", "HLT-01", "HLT-02", "HLT-05"].includes(state.current)) return showBodyWeatherRecords();
    if (action.startsWith("bw-trend-period:") && state.current === "TOD-03") {
      const period = action.slice("bw-trend-period:".length);
      const model = bodyWeatherTrendModel();
      if (!model || !["7", "14", "30"].includes(period)) return;
      state.bodyWeatherTrendView = { ...state.bodyWeatherTrendView, period };
      state.bodyWeatherTrendView.date = bodyWeatherTrendModel().selected.date;
      return render();
    }
    if (action.startsWith("bw-trend-step:") && state.current === "TOD-03") {
      const model = bodyWeatherTrendModel();
      const step = Number(action.slice("bw-trend-step:".length));
      if (!model || ![-1, 1].includes(step)) return;
      const index = model.daily.findIndex(day => day.date === model.selected.date);
      const next = model.daily[index + step];
      if (!next) return;
      state.bodyWeatherTrendView = { ...state.bodyWeatherTrendView, date: next.date };
      render();
      if (document.getElementById(step < 0 ? "bw-trend-prev" : "bw-trend-next")?.disabled) document.getElementById("bw-trend-date")?.focus({ preventScroll: true });
      return;
    }
    if (action.startsWith("bw-trend-day:") && state.current === "TOD-03") {
      const date = action.slice("bw-trend-day:".length);
      if (!bodyWeatherTrendModel()?.daily.some(day => day.date === date)) return;
      state.bodyWeatherTrendView = { ...state.bodyWeatherTrendView, date };
      return render();
    }
    if (action === "bw-feedback-note") {
      const correction = activeWeatherCorrection();
      if (!correction?.note) return showInfoModal("这次没有可查看的补充文字", "之前的反馈仍可在 Halo 记忆页回看。", "查看历史反馈", "go:HAL-03");
      showInfoModal("你补充的感受", correction.note);
      modalRoot.querySelector(".modal")?.classList.add("bw-feedback-note");
      return;
    }
    if (action === "bw-help") return showInfoModal("关于身体天气", "先看这一份记录对应的日期，再结合自己的感受安排一天。\n\n记录不完整时，会保留已有内容，暂不判断状态。你也可以随时告诉 Halo：这和我的感受不一样。", "知道了");
    if (action === "bw-pressure") return showInfoModal("了解压力变化", "这里用来回看一天里紧绷和放松的时段。\n\n现在还没有可查看的全天记录，不展示今日压力判断。你可以先记下自己的感受。", "记下感受", "record-new");
    if (action === "bw-halo") {
      if (state.current !== "TOD-03" || !state.signedIn) return;
      if (activeWeatherCorrection()) setHaloSource("correction", null, true);
      else setHaloSource(hasBodyContext() && bodyWeatherPageState().ready ? "body" : "none", null, true);
      return go("HAL-01");
    }
    if (studioPayment.handle(action)) return;
    if (studioReservation.handle(action)) return;
    if (studioPreparation.handle(action)) return;
    if (studioFeeling.handle(action)) return;
    if (studioPreflight.handle(action)) return;
    if (studioPostReport.handle(action)) return;
    if (studioNextDay.handle(action)) return;
    if (studioBenefit.handle(action)) return;
    if (studioContact.handle(action)) return;
    if (studioHistory.handle(action)) return;
    if (studioRecordDetail.handle(action)) return;
    if (studioCodeLookup.handle(action)) return;
    if (studioInstitution.handle(action)) return;
    if (studioReport.handle(action)) return;
    if (studioSession.handle(action)) return;
    const studioPrivateAction = ["studio-feeling-save", "studio-start", "studio-start-basic", "studio-complete", "studio-report-refresh", "studio-report-retry", "studio-benefit-refresh"].includes(action) || /^toggle:studio/.test(action);
    if (studioPrivateAction && !studioSessionIdentityValid()) return go("STU-03");
    if (studioPrivateAction && (!studioIdentityValid() || !studioConfirmed())) return go("STU-18");
    if (["studio-feeling-save", "studio-start", "studio-start-basic"].includes(action)) {
      const existing = state.studioRecords[state.selectedStudioEventId];
      if (existing.sessionStarted || existing.sessionDone) { closeModal(); return go(existing.sessionDone ? "STU-15" : "STU-04"); }
    }
    if (["studio-report-refresh", "studio-report-retry"].includes(action) && state.studioRecords?.[state.selectedStudioEventId]?.reportReviewState === "needs-review") return showInfoModal("原报告需要核对", "重新开启许可不会自动恢复历史报告。请联系活动客服核对原记录。", "联系活动客服", "go:HELP-03");
    if (["studio-refund", "studio-refund-refresh"].includes(action) && studioPayment.unresolved(state.studioRecords?.[state.selectedStudioEventId])) return showInfoModal("请先核对支付结果", "这笔支付还没有明确结果，请先查看进度或联系客服，避免重复处理。", "查看支付进度", "go:STU-17");
    if (deviceBinding.handleAction(action)) return;
    if (deviceWear.handle(action)) return;
    if (deviceScan.handleAction(action)) return;
    if (startup?.handleAction(action)) return;
    if (action === "activity-sync") return startActivitySync();
    if (action.startsWith("activity-sync-review:")) {
      if (state.current !== "TOD-07" || state.activitySync.request?.status === "pending") return;
      const outcome = action.slice(21);
      if (!["success", "failed"].includes(outcome)) return;
      activitySyncReviewOutcome = outcome;
      return renderInspector(pages.find(item => item.id === state.current));
    }
    if (action.startsWith("activity-feeling:")) {
      if (state.current !== "TOD-07" || !state.signedIn) return;
      const feeling = action.slice(17);
      if (!ACTIVITY_FEELINGS.includes(feeling)) return;
      state.activityRecordDraft.id ||= `activity-record-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      state.activityRecordDraft.feeling = state.activityRecordDraft.feeling === feeling ? "" : feeling;
      activityRecordError = "";
      return render();
    }
    if (action === "activity-record-save") return saveActivityRecord();
    if (action.startsWith("activity-records-scope:") && state.current === "TOD-07" && state.signedIn) {
      const scope = action.slice("activity-records-scope:".length);
      if (!["day", "all"].includes(scope)) return;
      state.activityRecordsScope = scope;
      return render();
    }
    if (action === "activity-records-all" && state.current === "TOD-07" && state.signedIn) return showActivityRecords();
    if (action === "activity-open-energy") {
      if (state.current !== "TOD-07" || !state.signedIn) return;
      const date = activityRecordDate();
      state.healthSelectedDate = date;
      state.healthDetailContext = { date, metric: "energy", route: "TOD-06" };
      delete state.pageViews["TOD-06"];
      return go("TOD-06");
    }
    if (action.startsWith("activity-date:")) {
      if (state.current !== "TOD-07" || !state.signedIn) return;
      const operation = action.slice(14);
      if (operation === "latest") return selectActivityDate(state.healthDemoRecordDate);
      if (!["previous", "next"].includes(operation)) return;
      const parsed = new Date(`${activityRecordDate()}T12:00:00Z`);
      parsed.setUTCDate(parsed.getUTCDate() + (operation === "previous" ? -1 : 1));
      return selectActivityDate(parsed.toISOString().slice(0, 10));
    }
    if (action.startsWith("oxygen-mode:")) {
      const mode = action.slice("oxygen-mode:".length);
      if (state.current !== "HLT-05" || !["day", "night"].includes(mode) || state.oxygenMode === mode) return;
      state.oxygenMode = mode;
      return render();
    }
    if (action.startsWith("oxygen-reading:")) {
      if (state.current !== "HLT-05" || state.oxygenMode !== "day") return;
      const point = oxygenDayModel().samples.find(sample => sample.id === action.slice("oxygen-reading:".length));
      if (!point) return flash("这条记录已不可查看，请重新选择");
      state.oxygenDaySelection = { date: oxygenRecordDate(), id: point.id };
      persistAppProgress();
      render();
      return showInfoModal("血氧记录", `${point.value}%\n\n${healthDateLabel(oxygenRecordDate())} ${point.time} · ${point.kind === "manual" ? "主动测量" : "自动记录"}\n\n示例数据，不是实际设备采集。此读数对应以上时间，不代表此刻血氧，也不用于诊断。`, "返回记录");
    }
    if (action.startsWith("oxygen-open-record:")) {
      const record = oxygenMeasurement?.records().find(record => record.id === action.slice("oxygen-open-record:".length));
      if (record) return returnFromOxygenMeasurement(null, record);
      return flash("这条记录已不可查看");
    }
    if (action.startsWith("temperature-date:")) {
      if (state.current !== "HLT-06" || !state.signedIn) return;
      const operation = action.slice("temperature-date:".length), date = temperatureRecordDate();
      const target = operation === "today" ? beijingDateKey() : operation === "latest" ? temperatureDataModel().latest?.date : window.HALO_TEMPERATURE_TREND.shiftDate(date, operation === "previous" ? -1 : operation === "next" ? 1 : 0);
      if (validHealthDate(target)) selectTemperatureDate(target);
      return;
    }
    if (action.startsWith("temperature-review:")) {
      if (state.current !== "HLT-06") return;
      const scenario = action.slice("temperature-review:".length);
      if (!TEMPERATURE_SCENARIOS.includes(scenario)) return;
      state.temperatureReviewScenario = scenario; return render();
    }
    if (action === "temperature-open-sleep") {
      if (state.current !== "HLT-06" || !temperatureAllowed() || !isHardwareActive()) return;
      capturePageView();
      const context = temperatureReturnContext();
      go("TOD-05");
      state.healthSelectedDate = context.date;
      state.healthDetailContext = { route: "TOD-05", date: context.date, metric: "sleep" };
      return render();
    }
    if (action === "temperature-baseline") return showInfoModal("什么是个人基线", "个人基线是用你在相似条件下的有效皮肤温度记录建立的参考水平。建立完成前，不计算相对变化。\n\n它与 Body Weather 的建立进度分开判断，这里不预设需要佩戴几晚。", "知道了");
    if (action === "temperature-help") return showInfoModal("先关注自己的感受", "皮肤温度变化不能用来判断是否发热。如果感觉发热，请按体温计说明测量体温；持续不适或症状加重时，及时就医，不要只等待戒指的新记录。", "知道了");
    if (action.startsWith("oxygen-date:")) {
      if (state.current !== "HLT-05" || !state.signedIn) return;
      const operation = action.slice("oxygen-date:".length);
      if (operation === "today") return selectOxygenDate(beijingDateKey());
      if (operation === "latest") return selectOxygenDate(oxygenDataModel().latest?.date || state.healthDemoRecordDate);
      if (!["previous", "next"].includes(operation)) return;
      return selectOxygenDate(window.HALO_OXYGEN_TREND.shiftDate(oxygenRecordDate(), operation === "previous" ? -1 : 1));
    }
    if (["oxygen-open-sleep", "oxygen-open-respiration"].includes(action)) {
      if (state.current !== "HLT-05" || !state.signedIn || !isHardwareActive()) return;
      capturePageView();
      const date = oxygenRecordDate(), destination = action === "oxygen-open-sleep" ? "TOD-05" : "HLT-02";
      state.oxygenRelatedReturn = { ...oxygenReturnContext(), destination };
      state.healthSelectedDate = date;
      state.healthDetailContext = { date, metric: destination === "TOD-05" ? "sleep" : "breath", route: destination };
      if (destination === "HLT-02") state.respirationWindowEnd = date;
      delete state.pageViews[destination];
      return go(destination);
    }
    if (action === "oxygen-help") return showInfoModal("读数或身体感觉不对时", "先留意身体感受。若读数让你担心，可以咨询医生，按专业建议使用合适的血氧仪复测。\n\n明显呼吸困难、胸痛或嘴唇发紫时，立即寻求医疗帮助，不要等待戒指数字或下一次同步。\n\n戒指用于日常观察，不能诊断或排除睡眠呼吸暂停。", "知道了");
    if (action.startsWith("oxygen-review:")) {
      const scenario = action.slice("oxygen-review:".length);
      if (state.current !== "HLT-05" || !OXYGEN_SCENARIOS.includes(scenario)) return;
      state.oxygenReviewScenario = scenario;
      return render();
    }
    if (action.startsWith("respiration-date:")) {
      if (state.current !== "HLT-02" || !state.signedIn) return;
      const operation = action.slice("respiration-date:".length);
      if (operation === "today") return selectRespirationDate(beijingDateKey());
      if (operation === "latest") return selectRespirationDate(respirationDataModel().latest?.date || state.healthDemoRecordDate);
      if (!["previous", "next"].includes(operation)) return;
      return selectRespirationDate(window.HALO_RESPIRATION_TREND.shiftDate(respirationRecordDate(), operation === "previous" ? -1 : 1));
    }
    if (action === "respiration-open-sleep") {
      if (state.current !== "HLT-02" || !state.signedIn || !isHardwareActive()) return;
      capturePageView();
      state.respirationSleepReturn = respirationReturnContext();
      const date = respirationRecordDate();
      state.healthSelectedDate = date;
      state.healthDetailContext = { date, metric: "sleep", route: "TOD-05" };
      delete state.pageViews["TOD-05"];
      return go("TOD-05");
    }
    if (action.startsWith("heart-date:")) {
      if (state.current !== "HLT-01" || !state.signedIn) return;
      const operation = action.slice("heart-date:".length);
      if (operation === "latest") return selectHeartDate(state.healthDemoRecordDate);
      if (!["previous", "next"].includes(operation)) return;
      const parsed = new Date(`${heartRecordDate()}T12:00:00Z`);
      parsed.setUTCDate(parsed.getUTCDate() + (operation === "previous" ? -1 : 1));
      return selectHeartDate(parsed.toISOString().slice(0, 10));
    }
    if (action === "energy-open-sleep") {
      if (state.current !== "TOD-06" || !state.signedIn || !energyDataState().hasReading) return;
      const date = energyRecordDate();
      state.healthSelectedDate = date;
      state.healthDetailContext = { date, metric: "sleep", route: "TOD-05" };
      delete state.pageViews["TOD-05"];
      return go("TOD-05");
    }
    if (action.startsWith("energy-date:")) {
      if (state.current !== "TOD-06" || !state.signedIn) return;
      const operation = action.slice(12);
      if (operation === "latest") return selectEnergyDate(state.healthDemoRecordDate);
      if (!["previous", "next"].includes(operation)) return;
      const parsed = new Date(`${energyRecordDate()}T12:00:00Z`);
      parsed.setUTCDate(parsed.getUTCDate() + (operation === "previous" ? -1 : 1));
      return selectEnergyDate(parsed.toISOString().slice(0, 10));
    }
    if (action.startsWith("sleep-stage:")) {
      if (state.current !== "TOD-05" || !state.signedIn || !isHardwareActive() || sleepRecordDate() !== state.healthDemoRecordDate || !["accumulating", "baseline", "interpretable"].includes(state.dataLifecycle)) return;
      const stage = action.slice(12);
      if (stage !== "all" && !SLEEP_STAGE_META[stage]) return;
      state.sleepStage = stage === state.sleepStage ? "all" : stage;
      return render();
    }
    if (action.startsWith("sleep-date:")) {
      if (state.current !== "TOD-05" || !state.signedIn) return;
      const operation = action.slice(11);
      if (operation === "latest") return selectSleepDate(state.healthDemoRecordDate);
      if (!["previous", "next"].includes(operation)) return;
      const parsed = new Date(`${sleepRecordDate()}T12:00:00Z`);
      parsed.setUTCDate(parsed.getUTCDate() + (operation === "previous" ? -1 : 1));
      return selectSleepDate(parsed.toISOString().slice(0, 10));
    }
    if (action.startsWith("health-date:")) {
      if (!state.signedIn) return go("AUTH-01");
      const operation = action.slice(12);
      let date = state.healthSelectedDate;
      if (operation === "today") date = beijingDateKey();
      else if (operation === "latest") date = state.healthDemoRecordDate;
      else if (["previous", "next"].includes(operation)) {
        const parsed = new Date(`${date}T12:00:00Z`);
        parsed.setUTCDate(parsed.getUTCDate() + (operation === "previous" ? -1 : 1));
        date = parsed.toISOString().slice(0, 10);
      } else return;
      if (!validHealthDate(date)) return;
      state.healthSelectedDate = date;
      state.healthDetailContext = null;
      if (state.current !== "HLT-00") return go("HLT-00");
      return render();
    }
    if (action.startsWith("health-open:")) {
      if (state.current !== "HLT-00" || !state.signedIn) return;
      const metric = action.slice(12);
      const entry = HEALTH_OVERVIEW_ITEMS.find(item => item.key === metric);
      const route = entry?.route || (metric === "quality" ? "TOD-11" : "");
      if (!route) return;
      state.healthDetailContext = { date: state.healthSelectedDate, metric, route };
      if (route === "HLT-02") state.respirationWindowEnd = state.healthSelectedDate;
      if (route === "HLT-06") state.temperatureWindowEnd = state.healthSelectedDate;
      if (route === "HLT-05") { state.oxygenWindowEnd = state.healthSelectedDate; state.oxygenMode = "day"; state.oxygenDaySelection = null; }
      // Each entry has a distinct landing position even when two metrics reuse one detail.
      delete state.pageViews[route];
      return go(route);
    }
    if (action === "halo-usage") return showInfoModal("和 Halo 聊聊", `${!isHardwareActive() ? "未绑定 Halo Ring 时，每天可发送 10 条普通消息，北京时间 00:00 恢复。你主动带入的感受记录可以用于这次对话，但不会读取戒指身体数据。\n\n" : "身体状态只有在数据可用、且你允许参考时才会带入。\n\n"}你可以点来源标签查看参考内容，或移除这一项。Halo 的回复不替代医疗诊断。当前原型使用本地示例回复，没有接入真实 AI。`, "知道了");
    if (action === "halo-source-details") {
      const source = haloVisibleSource();
      if (!source) return flash("这次没有额外参考来源");
      const detail = state.haloSource?.text || (source.kind === "body" ? "这次可以参考今天可用的身体状态。完整记录仍在今日页面，移除本次参考不会删除原始数据。" : source.kind === "inspiration" ? "仅作文化灵感参考，不代表健康判断，也不预测结果。" : "由你主动带入，只用于理解这次话题；它不是设备测量结果。");
      const isFeeling = state.haloSource?.kind === "feeling";
      const capturedAt = isFeeling ? state.haloSource?.occurredAt || state.haloFeelingRecords.find(r => r.id === state.haloSource?.recordId)?.occurredAt : state.haloSource?.capturedAt;
      const time = capturedAt && Number.isFinite(Date.parse(capturedAt)) ? `\n\n${isFeeling ? "记录时间" : "带入时间"}：${experienceTime(capturedAt)}` : "";
      return showInfoModal(source.label, `${detail}${time}\n\n移除本次来源不会删除原记录，也不会关闭全局身体参考设置。`, "知道了");
    }
    if (action.startsWith("connect-review:")) {
      const outcome = action.slice(15);
      if (["granted", "denied", "bluetooth-off", "failed"].includes(outcome) && state.connectionIntro.request?.status !== "checking") { connectionReviewOutcome = outcome; render(); }
      return;
    }
    if (action === "device-guide-help") return showDeviceGuideHelp();
    if (action.startsWith("connect-intro-")) {
      if (!state.signedIn) return go("AUTH-01");
      if (action === "connect-intro-start") {
        if (state.current !== "ONB-03") return;
        if (connectionIntroTimer) clearTimeout(connectionIntroTimer);
        connectionIntroTimer = null;
        state.connectionIntro.request = null;
        state.connectionIntro.choice = "connect";
        state.connectionIntro.completed = true;
        trackPrototypeEvent("onboarding_connection_started", { source_page: "ONB-03", destination: "DEV-01", simulated: true });
        closeModal();
        return go("DEV-01");
      }
      if (action === "connect-intro-skip") {
        if (state.current !== "ONB-03") return;
        if (connectionIntroTimer) clearTimeout(connectionIntroTimer);
        connectionIntroTimer = null;
        state.connectionIntro.request = null;
        state.connectionIntro.choice = "skipped";
        state.connectionIntro.completed = true;
        state.connectionIntro.returnRoute = "";
        if (["ONB-03", "PERM-01"].includes(state.authForm.login?.destination)) state.authForm.login.destination = "TOD-01";
        trackPrototypeEvent("onboarding_connection_skipped", { source_page: "ONB-03", destination: guardedRoute("TOD-01"), simulated: true });
        closeModal();
        return go("TOD-01", false);
      }
      if (state.current !== "DEV-01" || state.connectionIntro.request?.status === "checking") return;
      if (action === "connect-intro-request") {
        if (deviceGuideBlocker()) { closeModal(); return render(); }
        state.connectionIntro.choice = "connect";
        state.connectionIntro.request = { id: `bluetooth-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, sourcePage: "DEV-01", status: "checking", readyAt: Date.now() + 900, outcome: connectionReviewOutcome };
        trackPrototypeEvent("onboarding_bluetooth_requested", { request_id: state.connectionIntro.request.id, source_page: "DEV-01", simulated: true });
        closeModal();
        return render();
      }
      return;
    }
    if (action.startsWith("auth-review:")) {
      const outcome = action.slice(12);
      if (authUiState().busy) return;
      if (["success", "offline", "limited"].includes(outcome)) authReviewOutcome = outcome;
      if (outcome === "cooldown-end") state.authForm.cooldownUntil = 0;
      if (outcome === "expire" && state.authForm.request?.status === "sent") state.authForm.request.expiresAt = Date.now() - 1;
      render();
      return;
    }
    if (action.startsWith("auth-login-review:")) {
      const outcome = action.slice(18);
      if (["success", "offline"].includes(outcome) && !authUiState().busy) { authLoginReviewOutcome = outcome; render(); }
      return;
    }
    // Product browsing is public; commerce mutations still require a signed-in account.
    if (action.startsWith("commercial:product-open:")) state.welcomeShopping = state.current === "ONB-01";
    const publicProductAction = /^commercial:(product-open|sku-open|sku-color|sku-size|sku-inc|sku-dec|sku-close|sku-save)(:|$)/.test(action);
    if (!state.signedIn && action.startsWith("commercial:") && !publicProductAction) {
      state.authReturnRoute = state.current === "SEL-03" ? "SEL-03" : "";
      return go("AUTH-01");
    }
    if (action.startsWith("report-month:")) return healthReports.openMonth(action.slice(13));
    if (action === "monthly-review-start") return healthReports.openMonth(state.selectedReportMonth || "");
    if (action === "go:HAL-01") { state.haloToolsOpen = false; return go("HAL-01"); }
    if (action === "halo-rhythm-context") {
      if (state.current !== "RHY-06") return;
      const result = rhythmHandoff.confirm(rhythmContextPreview);
      if (!result.ok) { rhythmHandoffFeedback = result.error; render(); return; }
      rhythmHandoffFeedback = ""; return go("HAL-01");
    }
    if (action === "halo-new-conversation") { startHaloConversation(); return go("HAL-01"); }
    if (action === "halo-resume-active") {
      const conversation = state.conversations.find((entry) => entry.id === state.activeConversationId && entry.status !== "deleted");
      if (!conversation || !["paused", "archived"].includes(conversation.status)) return;
      conversation.status = "active"; state.conversationStatus = "active"; saveHaloConversation(); render();
      document.getElementById("chat-input")?.focus();
      return;
    }
    if (action === "halo-remove-source") { setHaloSource("none"); return render(); }
    if (action === "halo-preferences") return showHaloPreferences();
    if (action.startsWith("halo-preference:")) { const [, key, value] = action.split(":"); return selectGeneralPreference(key, value); }
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
    if (action === "remove-halo-context") { state.toggles.haloBody = false; if (state.haloContext === "body") setHaloSource("none"); return render(); }
    if (action === "restore-halo-context") { if (!isHardwareActive() || state.dataLifecycle !== "interpretable") return flash("身体数据可以解释后，才会开放本次参考"); state.toggles.haloBody = true; setHaloSource("body"); return render(); }
    if (action === "ai-correction:open") return showAiCorrectionModal();
    if (action.startsWith("ai-correction-select:")) {
      const reason = action.slice(21);
      if (!correctionModalIsCurrent() || !AI_CORRECTION_REASONS[reason]) return;
      state.aiCorrectionDraft.reason = reason;
      persistAppProgress();
      return showAiCorrectionConfirm(reason);
    }
    if (action.startsWith("ai-correction-save:")) {
      const [, reason, mode, token] = action.split(":");
      return saveAiCorrection(reason, mode, token);
    }
    if (action === "ai-correction-check-memory") {
      return showInfoModal("查看已保存的 Halo 记忆", "当前原型不会自动判断哪些记忆与这次反馈有关。你可以逐条查看下方记忆，分别纠正或删除。", "查看记忆", "go:HAL-03");
    }
    if (action === "ai-correction-reset") {
      const correction = activeWeatherCorrection();
      if (!correction) return;
      return showModal("撤销这次反馈？", "撤销后不再用这份反馈解释今天。戒指数据、历史反馈和过去的聊天内容都会保留。", "确认撤销", `ai-correction-reset-confirm:${correction.id}`);
    }
    if (action.startsWith("ai-correction-reset-confirm:")) {
      const correction = activeWeatherCorrection();
      const id = action.slice("ai-correction-reset-confirm:".length);
      if (!correction || correction.id !== id || !modalRoot.querySelector(`[data-action="ai-correction-reset-confirm:${CSS.escape(id)}"]`)) return;
      const withdrawn = { ...correction, status: "withdrawn", withdrawnAt: new Date().toISOString() };
      const haloSource = state.haloSource?.kind === "correction" && state.haloSource.correctionId === id ? null : state.haloSource;
      const conversations = state.conversations.map(conversation => conversation.source?.kind === "correction" && conversation.source.correctionId === id ? { ...conversation, source: null, context: "none" } : conversation);
      if (!writeCorrectionState({ aiCorrection: { ...DEFAULT_AI_CORRECTION }, aiCorrectionHistory: [...state.aiCorrectionHistory, withdrawn], haloSource, haloContext: !haloSource && state.haloContext === "correction" ? "none" : state.haloContext, conversations })) return showInfoModal("暂时没能撤销", "原反馈仍然保留，请稍后重试。", "重新撤销", "ai-correction-reset");
      trackPrototypeEvent("ai_interpretation_correction_withdrawn");
      closeModal();
      render();
      return flash("反馈已撤销，历史记录仍保留");
    }
    if (action.startsWith("rhythm-state:")) {
      const next = action.slice(13);
      if (state.current === "RHY-05" && ["paused", "ready"].includes(next)) return handleRhythmManagement(next === "paused" ? "rh-manage:pause" : "rh-manage:resume");
      if (next === "ready" && state.rhythmMode === "cycle" && (!rhythmSettingsValid() || state.rhythmDeleted)) { state.rhythmStatus = "empty"; return go("RHY-00"); }
      state.rhythmStatus = next;
      return render();
    }
    if (action.startsWith("rhythm-date:")) {
      const result = rhythmRecordStore.open(action.slice(12));
      if (!result.ok) return showInfoModal("暂时无法打开记录", result.error);
      rhythmEditorProblem = ""; closeModal(); return go("RHY-03");
    }
    if (action.startsWith("rhythm-draft-latest:")) {
      const result = rhythmRecordStore.discardDraft(action.slice(20));
      if (!result.ok) { closeModal(); return showInfoModal("草稿仍保留", result.error); }
      rhythmEditorProblem = ""; closeModal(); return go("RHY-03");
    }
    if (action.startsWith("rhythm-month:")) {
      const [year, month] = state.rhythmMonth.split("-").map(Number);
      const next = new Date(Date.UTC(year, month - 1 + Number(action.slice(13)), 1)).toISOString().slice(0, 7);
      if (next > beijingDateKey().slice(0, 7)) return;
      state.rhythmMonth = next;
      return render();
    }
    if (action === "rhythm-setup-skip" || action === "rhythm-record-only") {
      if (state.current === "RHY-05") return handleRhythmManagement("rh-manage:settings");
      if (action === "rhythm-setup-skip" && state.current !== "RHY-00") return;
      state.rhythmMode = "record-only"; state.rhythmStatus = "ready"; return go(action === "rhythm-setup-skip" ? state.rhythmSetupReturn || "RHY-01" : "RHY-01");
    }
    if (action === "rhythm-manage-days") { if (state.current === "RHY-05" && !rhythmManagementStore.inspect().canManage) return; return go("RHY-01"); }
    if (action.startsWith("rhythm-delete:")) {
      const date = action.slice(14);
      if (!state.rhythmRecords[date]) return flash("这一天没有已保存的记录");
      return showModal("删除这一天的记录？", `将删除 ${date} 的感受和补充原话，同时移除趋势中的对应标记，之后不再供 Halo 引用。其他日期和周期设置保留；已发送的聊天内容不会随之删除。`, "确认删除这一天", `rhythm-delete-confirm:${date}`);
    }
    if (action.startsWith("rhythm-delete-confirm:")) {
      const date = action.slice(22), result = rhythmRecordStore.remove(date);
      if (!result.ok) { closeModal(); rhythmEditorProblem = result.error; render(); return; }
      if (state.haloSource?.kind === "rhythm" && state.haloSource.date === date) setHaloSource("none");
      state.conversations.forEach(entry => { if (entry.source?.kind === "rhythm" && entry.source.date === date) { entry.source = null; entry.context = "none"; } });
      rhythmEditorProblem = ""; state.rhythmMonth = date.slice(0, 7);
      closeModal(); go("RHY-01"); return flash(`${date} 的记录已删除`);
    }
    if (action === "open-outfit-inspiration") {
      trackPrototypeEvent("daily_outfit_inspiration_open", { palette: DAILY_INSPIRATION.outfitColor, source_page: state.current });
      return showOutfitInspirationModal();
    }
    if (action === "outfit-inspiration-chat") {
      setHaloSource("inspiration", null, true);
      state.haloToolsOpen = false;
      trackPrototypeEvent("daily_outfit_halo_open", { palette: DAILY_INSPIRATION.outfitColor, source_page: state.current });
      closeModal();
      go("HAL-01");
      return appendHaloReply(DAILY_INSPIRATION.outfitQuestion, DAILY_INSPIRATION.outfitReply, { preserveDraft: true });
    }
    if (action === "open-inspiration") { setHaloSource("inspiration", null, true); state.haloToolsOpen = false; trackPrototypeEvent("daily_inspiration_halo_open", { source_page: state.current }); return go("HAL-01"); }
    if (action === "auth-code-requested") {
      const ui = authUiState();
      if (ui.busy) return;
      if (ui.sendDisabled) { state.authForm.touched = true; updateAuthControls(); persistAppProgress(); return; }
      invalidateAuthRequest();
      state.toggles.legal = false;
      state.toggles.aiLegal = false;
      const sequence = Math.max(0, Number(state.authForm.sequence) || 0);
      state.authForm.sequence = sequence + 1;
      const readyAt = Date.now() + 1200;
      // Demo-only challenge. Production codes, expiry, rate limits and account lookup belong to the server.
      state.authForm.request = { version: 2, id: `auth-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, phone: ui.phone, status: "sending", readyAt, expiresAt: readyAt + 300000, demoCode: AUTH_DEMO_CODE, attempts: 0, outcome: authReviewOutcome, consentSource: "AUTH-01" };
      trackPrototypeEvent("auth_code_request_started", { request_id: state.authForm.request.id, simulated: true });
      return render();
    }
    if (action === "auth-login" || action === "auth-verified") {
      if (state.current !== "AUTH-01") return;
      const ui = authUiState();
      if (ui.busy || state.authForm.login?.status === "complete") return;
      if (ui.disabled) { state.authForm.touched = true; updateAuthControls(); persistAppProgress(); return; }
      state.authForm.codeError = "";
      state.authForm.login = { id: `login-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, requestId: state.authForm.request.id, status: "verifying", readyAt: Date.now() + 900, outcome: authLoginReviewOutcome };
      trackPrototypeEvent("auth_login_started", { attempt_id: state.authForm.login.id, request_id: state.authForm.request.id, simulated: true });
      return render();
    }
    // Legacy action is a return only: agreement confirmation now belongs to AUTH-01.
    if (action === "legal-continue") return state.signedIn ? goBack() : go("AUTH-01");
    if (action.startsWith("legal-read:")) return showLegalReading(action.slice(11));
    if (action === "permission-skip") return goBack();
    if (action === "permission-connect") { if (!state.toggles.bluetooth) return showInfoModal("请先开启蓝牙", "蓝牙用于连接、同步和主动测量。开启后再连接戒指。", "知道了"); state.deviceResetStatus = "ready"; return go(isHardwareActive() ? "DEV-10" : "DEV-01"); }
    if (action === "today-records") return showTodayRecords();
    if (action === "today-device") {
      const description = !isHardwareActive() ? "连接 Halo Ring 后开始记录；你记下的感受仍然保留。" : state.deviceStatus === "syncing" ? "正在接收戒指记录。你可以继续浏览，已保存的记录不受影响。" : state.deviceStatus === "disconnected" ? "把戒指放在手机附近，并检查蓝牙。已有记录仍可查看。" : state.deviceStatus === "action" ? "本次同步没有完成。检查连接后可以重试，已有记录不会丢失。" : state.deviceStatus === "low" ? "请给戒指充电，以便继续记录和同步。" : "连接状态不代表所有记录都已同步，可进入设备页查看进度。";
      return showInfoModal(todaySyncLabel(), description, isHardwareActive() ? "查看设备与同步" : "连接 Halo Ring", isHardwareActive() ? "go:DEV-10" : "go:DEV-01");
    }
    if (action === "today-advice" || action === "today-weather-details") {
      go("TOD-03");
      if (state.current !== "TOD-03") return;
      const target = screen.querySelector(action === "today-advice" ? ".detail-action" : ".detail-conclusion");
      screen.scrollTop = action === "today-advice" && target ? screen.scrollTop + target.getBoundingClientRect().top - screen.getBoundingClientRect().top - 16 : 0;
      if (target) { target.setAttribute("tabindex", "-1"); target.focus({ preventScroll: true }); }
      capturePageView(); persistAppProgress();
      return;
    }
    if (action === "today-night") {
      const session = state.nightSession;
      if (!session || session.status === "ended") return go("NIG-01");
      if (session.status === "paused" && nightPosition(session) < session.duration * 60) changeNightPlayback();
      return go("NIG-04");
    }
    if (action.startsWith("go:")) {
      if (action === "go:TOD-02" && state.current === "TOD-03") state.recordDraft.returnRoute = "TOD-03";
      if (action === "go:TOD-02" && !["TOD-01", "TOD-02"].includes(state.current)) { state.recordEditorMode = "new"; state.recordEditorError = ""; }
      closeModal(); return go(action.slice(3));
    }
    if (action === "previous") return goBack();
    if (action === "toast:文字已复制") return copyText(`${currentBodyWeather().label}｜${currentBodyWeather().shareLine}`, "文字已复制");
    if (action === "toast:已开始重新同步") { const unavailable = deviceOperationUnavailable("sync"); if (unavailable) return flash(unavailable); state.deviceStatus = "syncing"; render(); return flash("正在重新同步"); }
    if (action === "toast:语言设置已打开") return showInfoModal("语言", "当前使用简体中文。其他语言将在正式支持后显示在这里。", "知道了");
    if (action === "toast:单位设置已打开") return showInfoModal("单位", "当前使用公制与摄氏度。", "知道了");
    if (action.startsWith("toast:")) { closeModal(); return flash(action.slice(6)); }
    if (window.HALO_COMMERCIAL_EXTENSION?.handleAction(action, {
      applicationContext: () => ({ signedIn: state.signedIn, accountRef: state.authPhone || state.authForm?.phone || "", key: state.authForm?.login?.id || state.agreementAcceptance?.acceptedAt || (state.signedIn ? "legacy-session" : ""), page: state.current }),
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
    if (action === "support-instructions") return supportContact.open();
    if (action === "widget-preview") return showWidgetPreview();
    if (action === "widget-add") return showWidgetAdded();
    if (action.startsWith("record-detail:")) return showRecordDetail(action.slice(14));
    if (action === "info:membership-rights") return showMembershipRules();
    if (action === "commerce-entry") return showCommerceBoundary();
    if (action === "account-channel-support") return showInfoModal("处理体验顾问合作", "注销会员账号不会结束独立渠道合同。请从这里联系企业微信客服，继续处理合同、历史结算和未完成事项；不需要重新开通经营身份。", "查看客服入口", "go:HELP-03");
    if (action === "support-handoff") return showSupportHandoff();
    if (action === "studio-claim-benefit") return handleAction("studio-benefit-refresh");
    if (action === "memory-confirm") return handleAction("halo-memory-confirm:quiet");
    if (action.startsWith("journey-theme:")) {
      const theme = action.slice(14);
      if (!JOURNEY_THEMES[theme]) return;
      state.journeyTheme = theme; syncJourneyAliases(); return render();
    }
    if (action === "journey-pause") { if (!["active", "deferred"].includes(state.journeyRecords[state.journeyTheme].status)) return; updateJourney({ status: "paused" }); trackPrototypeEvent("halo_journey_paused"); return render(); }
    if (action === "journey-resume" || action === "journey-resume-today") { if (!["paused", "deferred"].includes(state.journeyRecords[state.journeyTheme].status)) return; updateJourney({ status: "active" }); trackPrototypeEvent("halo_journey_resumed"); return render(); }
    if (action === "journey-replace") {
      if (!["active", "deferred"].includes(state.journeyRecords[state.journeyTheme].status)) return;
      if (state.journeyVariant >= 2) return flash("已经是最轻的一步，也可以选择另一个主题");
      updateJourney({ variant: state.journeyVariant + 1, status: "active" });
      trackPrototypeEvent("halo_journey_action_replaced", { theme: state.journeyTheme, difficulty: state.journeyVariant });
      render(); return flash("已经换成更容易开始的一步");
    }
    if (action === "journey-defer-open") { if (state.journeyRecords[state.journeyTheme].status !== "active") return; return showJourneyDeferModal(); }
    if (action.startsWith("journey-defer:")) {
      if (state.journeyRecords[state.journeyTheme].status !== "active") return;
      const reason = action.slice(14);
      const reasons = { time: "今天没时间。", hard: "这一步还是太难。", timing: "现在不是合适的时候。", mood: "今天不想做。" };
      const missCount = state.journeyMissCount + 1;
      updateJourney({ status: "deferred", reason: reasons[reason] || "今天先不做。", missCount, variant: reason === "hard" || missCount >= 2 ? Math.min(2, state.journeyVariant + 1) : state.journeyVariant });
      trackPrototypeEvent("halo_journey_action_deferred", { reason, miss_count: missCount });
      closeModal(); return render();
    }
    if (action === "journey-end" || action === "journey-unsuitable") {
      if (["ended", "completed", "deleted"].includes(state.journeyRecords[state.journeyTheme].status)) return;
      return showModal("结束这个主题？", "结束本轮练习并停止提醒，完成统计、日期和感受都会保留。以后可重新开始新一轮。", "结束并保留记录", action === "journey-unsuitable" ? "journey-unsuitable-confirm" : "journey-end-confirm");
    }
    if (action === "journey-end-confirm" || action === "journey-unsuitable-confirm") {
      if (["ended", "completed", "deleted"].includes(state.journeyRecords[state.journeyTheme].status)) return closeModal();
      updateJourney({ status: "ended", endedAt: new Date().toISOString(), reason: action === "journey-unsuitable-confirm" ? "你选择了这个主题不适合我。" : "由你结束本轮。" });
      trackPrototypeEvent("halo_journey_ended", { theme: state.journeyTheme }); closeModal(); return render();
    }
    if (action === "journey-step") {
      const journey = state.journeyRecords[state.journeyTheme];
      if (journey.status !== "active") return flash("请先继续或重新开始这个主题");
      if (journey.days.includes(experienceDay()) || journey.days.length >= 7) return flash("今天已经记下了，明天再继续");
      journey.days.push(experienceDay());
      journey.entries.push({ day: experienceDay(), action: currentJourneyStep().action, note: journey.note });
      updateJourney({ status: journey.days.length >= 7 ? "completed" : "active", missCount: 0, ...(journey.days.length >= 7 ? { endedAt: new Date().toISOString() } : {}) });
      trackPrototypeEvent("halo_journey_step_completed", { progress: state.journeyProgress, theme: state.journeyTheme }); return render();
    }
    if (action === "journey-reset") {
      if (state.journeyRecords[state.journeyTheme].status === "deleted") return handleAction("journey-reset-confirm");
      return showModal("重新开始这个主题？", "当前轮次的完成统计和感受将保留在历史中，新一轮从 0 / 7 天开始。", "保留历史，重新开始", "journey-reset-confirm");
    }
    if (action === "journey-reset-confirm") {
      const previous = state.journeyRecords[state.journeyTheme];
      const history = previous.status === "deleted" ? [] : [...previous.previous, { days: [...previous.days], entries: previous.entries.map(entry => ({ ...entry })), note: previous.note, status: previous.status === "completed" ? "completed" : "ended", endedAt: previous.endedAt || new Date().toISOString() }];
      state.journeyRecords[state.journeyTheme] = { days: [], entries: [], note: "", previous: history, status: "active", variant: 0, missCount: 0, reason: "" };
      syncJourneyAliases(); trackPrototypeEvent("halo_journey_restarted", { theme: state.journeyTheme }); closeModal(); return render();
    }
    if (action === "journey-delete") {
      const title = state.journeyTheme === "pause" ? "白天短暂停顿" : "睡前放下工作";
      return showModal(`删除“${title}”的全部记录？`, "将清空这个主题的当前计划、完成统计、感受和所有历史轮次，无法恢复。其他主题、节律和设备记录保留。", "确认删除全部记录", "journey-delete-confirm");
    }
    if (action === "journey-delete-confirm") {
      state.journeyRecords[state.journeyTheme] = { days: [], entries: [], note: "", previous: [], status: "deleted", variant: 0, missCount: 0, reason: "" };
      syncJourneyAliases(); trackPrototypeEvent("halo_journey_deleted", { theme: state.journeyTheme }); closeModal(); render(); return flash("这个主题的记录已删除");
    }
    if (action.startsWith("open-conversation:")) return openHaloConversation(action.slice(18));
    if (action.startsWith("conversation-state:")) {
      const status = action.slice(19);
      const conversation = state.conversations.find((entry) => entry.id === state.activeConversationId && entry.status !== "deleted");
      if (!conversation || !["active", "paused", "archived", "deleted"].includes(status)) return;
      if (status === "deleted") return showInfoModal("删除这段对话？", `“${conversation.title}”中的消息和草稿将被删除，无法在最近对话中恢复。你的感受记录和健康数据会保留。`, "确认删除", `halo-delete-conversation-confirm:${conversation.id}`);
      conversation.status = status; state.conversationStatus = status;
      trackPrototypeEvent("halo_conversation_state_changed", { conversation_id: state.activeConversationId, status });
      return render();
    }
    if (action.startsWith("halo-delete-conversation-confirm:")) {
      const id = action.slice("halo-delete-conversation-confirm:".length);
      const conversation = state.conversations.find((entry) => entry.id === id && entry.status !== "deleted");
      if (!conversation) return closeModal();
      conversation.status = "deleted"; conversation.messages = []; conversation.draft = ""; conversation.source = null; conversation.context = "none"; conversation.title = "已删除会话";
      if (state.activeConversationId === id) { state.activeConversationId = ""; state.chat = []; state.haloDraft = ""; state.haloSource = null; state.haloContext = "none"; state.conversationStatus = "new"; }
      trackPrototypeEvent("halo_conversation_state_changed", { conversation_id: id, status: "deleted" });
      closeModal(); render(); return flash("对话已删除");
    }
    if (action.startsWith("rhythm-feeling:")) {
      if (state.current !== "RHY-03") return;
      const view = rhythmRecordStore.inspect(), feeling = action.slice(15);
      if (!view.canEdit || view.conflict || !["睡得少", "情绪敏感", "身体轻松", "有精神"].includes(feeling)) return;
      state.rhythmFeeling = state.rhythmFeeling === feeling ? "" : feeling;
      captureRhythmDraft(); return;
    }
    if (action === "rhythm-editor-latest") {
      if (state.current !== "RHY-03" || !rhythmRecordStore.inspect().conflict) return;
      return showModal("查看最新记录？", "你现在这份未保存的修改会被放弃，已保存的记录不会删除。取消可继续保留这份草稿。", "放弃修改并查看最新", `rhythm-draft-latest:${state.selectedRhythmDate}`);
    }
    if (action === "rhythm-feeling-save") {
      if (state.current !== "RHY-03") return;
      const view = rhythmRecordStore.inspect();
      if (!view.canSave) { rhythmEditorProblem = view.error; rhythmEditor.update(view, rhythmEditorProblem, rhythmEditorDraftStatus); return; }
      const result = rhythmRecordStore.save();
      if (!result.ok) { rhythmEditorProblem = result.error; render(); return; }
      rhythmEditorProblem = ""; rhythmEditorDraftStatus = ""; go("RHY-01");
      return flash("已保存为用户记录");
    }
    if (action === "rhythm-settings-save" || action === "rhythm-setup-save") {
      if (!["RHY-00", "RHY-04"].includes(state.current)) return;
      const draft = { ...state.rhythmSettingsDraft, mode: "cycle", notice: rhythmSettingsStore.inspect().values.notice };
      let result = rhythmSettingsStore.open();
      for (const [key, value] of Object.entries(draft)) { if (!result.ok) break; result = rhythmSettingsStore.change(key, value); }
      if (result.ok) result = rhythmSettingsStore.save();
      rhythmSettingsWriteFailed = result.code === "storage";
      if (!result.ok) return showInfoModal("设置暂未保存", result.error);
      if (!result.unchanged) trackPrototypeEvent("rhythm_settings_saved", { mode: "cycle" });
      if (action === "rhythm-setup-save") return go(state.rhythmSetupReturn || "RHY-01");
      return render();
    }
    if (action === "profile-save") return saveProfileEditor();
    if (action === "profile-purpose") {
      if (!state.signedIn || state.current !== "ACC-01") return;
      return showInfoModal("关于身体信息", "出生日期用来显示年龄。身高、体重作为你填写的基础资料保存，方便查看和更新。这些信息都可以不填，也不会自动开启生日权益提醒。");
    }
    if (action === "profile-save-confirm-conflicts") return saveProfileEditor(true);
    if (action === "profile-birthday-benefit") {
      if (!state.signedIn || state.current !== "ACC-01" || state.accountDeletionStatus === "submitted") return;
      const draft = profileEditorDraft();
      draft.birthdayBenefit = !draft.birthdayBenefit;
      profileDraftRestored = false;
      state.profileEditor.touched.birthdayBenefit = true;
      profileConflictReview = null;
      if (typeof updateProfileEditorControls === "function") updateProfileEditorControls();
      return persistAppProgress();
    }
    if (action === "profile-back") {
      if (state.current !== "ACC-01") return;
      const dirty = profileEditorDirty();
      persistAppProgress(); goBack();
      if (dirty) flash("草稿已保留，下次可继续编辑");
      return;
    }
    if (action === "profile-discard") {
      if (!state.signedIn || state.current !== "ACC-01" || !profileEditorDirty()) return;
      showInfoModal("放弃这次修改？", "只清除这页尚未保存的修改，已保存资料和首次连接时的填写草稿不变。", "放弃修改", "profile-discard-confirm");
      modalRoot.querySelector('[data-action="close-modal"]').textContent = "继续编辑";
      return;
    }
    if (action === "profile-discard-confirm") {
      if (!state.signedIn || state.current !== "ACC-01" || !modalRoot.querySelector('[data-action="profile-discard-confirm"]')) return;
      const saved = savedProfileEditorSnapshot();
      state.profileEditor = { draft: { ...saved }, base: { ...saved }, touched: {}, savedAt: state.profileEditor.savedAt };
      profileDraftRestored = false;
      profileConflictReview = null;
      closeModal(); render(); return flash("已恢复到上次保存的资料");
    }
    if (action.startsWith("record-option:")) {
      if (state.current !== "TOD-02") return;
      const draft = currentRecordDraft();
      const label = action.slice(14);
      const original = state.recordEditorMode === "edit" ? state.subjectiveRecords.find(item => item.id === draft.id) : null;
      if (![...(original?.category === "activity" ? ACTIVITY_FEELINGS : RECORD_OPTIONS), ...(original?.labels || (original ? [original.label] : []))].includes(label)) return;
      draft.labels = original?.category === "activity" ? draft.labels.includes(label) ? [] : [label] : draft.labels.includes(label) ? draft.labels.filter(item => item !== label) : [...draft.labels, label];
      state.recordEditorError = "";
      return render();
    }
    if (action === "record-new") {
      capturePageView();
      state.recordEntryContext = state.current === "HLT-01" ? heartReturnContext() : state.current === "HLT-02" ? respirationReturnContext() : state.current === "HLT-05" ? oxygenReturnContext() : state.current === "HLT-06" ? temperatureReturnContext() : null;
      if (state.current === "TOD-03") state.recordDraft.returnRoute = "TOD-03";
      state.recordEditorMode = "new"; state.recordEditorError = ""; closeModal(); return go("TOD-02");
    }
    if (action === "record-back") {
      if (state.current !== "TOD-02") return;
      const context = state.recordEditorMode === "edit" ? state.recordEditDraft?.returnContext : state.recordEntryContext;
      const healthReturn = restoreHealthDetailReturn(context);
      if (state.recordEditorMode === "edit" && !recordEditHasChanges()) { state.recordEditDraft = null; state.recordEditorMode = "new"; }
      if (healthReturn && history.state?.trail?.at(-2) !== context.route) return go(context.route, false);
      return goBack();
    }
    if (action === "record-help") return showInfoModal("关于用户记录", "感受和文字都可以自由选择。只有点保存才会加入记录，返回时会保留草稿。\n\n这是你主动记下的内容，不会改动戒指数据。已保存的记录可以单独修改或删除。", state.recordEditorMode === "edit" ? "放弃本次修改" : "知道了", state.recordEditorMode === "edit" ? "record-discard-edit" : "close-modal");
    if (action === "record-discard-edit" && state.current === "TOD-02" && state.recordEditorMode === "edit") return showModal("放弃本次修改？", "原记录不会改变，新记录的草稿也会保留。", "放弃修改", "record-discard-edit-confirm");
    if (action === "record-discard-edit-confirm") {
      if (state.current !== "TOD-02" || state.recordEditorMode !== "edit" || !modalRoot.querySelector('[data-action="record-discard-edit-confirm"]')) return;
      const context = state.recordEditDraft?.returnContext;
      const healthReturn = restoreHealthDetailReturn(context);
      state.recordEditDraft = null; state.recordEditorMode = "new"; state.recordEditorError = "";
      closeModal();
      return healthReturn && history.state?.trail?.at(-2) !== context.route ? go(context.route, false) : goBack();
    }
    if (action.startsWith("record-edit:")) return startRecordEdit(action.slice(12));
    if (action === "record-conflict-review") return reviewRecordConflict();
    if (["record-conflict-rebase", "record-conflict-copy"].includes(action)) {
      if (state.current !== "TOD-02" || !state.recordEditDraft || !modalRoot.querySelector(`[data-action="${action}"]`)) return;
      const draft = state.recordEditDraft;
      const records = readStoredJson(SUBJECTIVE_RECORDS_KEY, null);
      if (!Array.isArray(records)) return flash("暂时无法读取最新记录，输入仍保留，请稍后重试。");
      const latest = records.find(value => todayRhythmStorage.own(value) && value.id === draft.id);
      if (action === "record-conflict-rebase" && (!latest || JSON.stringify(latest) !== JSON.stringify(recordConflictSnapshot))) return reviewRecordConflict();
      try { todayRhythmStorage.resolveEdit(); } catch { return flash("暂时无法读取最新记录，请稍后重试。"); }
      if (action === "record-conflict-rebase") draft.baseRecord = JSON.parse(JSON.stringify(latest));
      else { state.recordDraft = { labels: [...draft.labels], note: draft.note }; state.recordEditDraft = null; state.recordEditorMode = "new"; }
      state.recordEditorError = ""; recordConflictSnapshot = null;
      closeModal(); render(); return;
    }
    if (action.startsWith("record-delete:")) {
      const record = state.subjectiveRecords.find(item => item.id === action.slice(14) && item.category !== "rhythm");
      if (!record) return showInfoModal("记录不存在", "可以返回查看其他记录。");
      return showModal("删除这条记录？", `${record.label} · ${record.occurredAt ? recordDateTime(record.occurredAt) : "原记录未保存日期"}\n\n只删除这一条，其他记录不受影响。删除后不能恢复。`, "删除这条记录", `record-delete-confirm:${record.id}`);
    }
    if (action.startsWith("record-delete-confirm:")) {
      if (!Array.from(modalRoot.querySelectorAll("[data-action]")).some(button => button.dataset.action === action)) return;
      return deleteUserRecord(action.slice(22));
    }
    if (action === "record-save") return saveRecordEditor();
    if (action === "record-save-inline") {
      const labels = [...state.recordDraft.labels];
      const note = state.recordDraft.note.trim();
      if (!labels.length && !note) return flash("先选一个标签，或写下此刻的感受");
      const occurredAt = new Date().toISOString();
      const reportMonth = state.recordDraft.reportMonth;
      const record = { id: `record-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, label: labels.join("、") || "感受", labels, original: note, occurredAt, source: "user-record", ...(reportMonth ? { reportMonth } : {}) };
      const identity = memberTaskIdentity();
      if (reportMonth && isHardwareActive() && state.dataLifecycle === "interpretable" && identity) record.memberTaskEvidence = { taskId: "monthly-review", ...identity, occurredAt, verified: true, hardwareActive: true };
      if (!commitUserRecords([...state.subjectiveRecords, record])) { render(); return flash(state.recordEditorError); }
      if (record.memberTaskEvidence) {
        const evidence = record.memberTaskEvidence, newMember = Boolean(state.newMember);
        Promise.resolve().then(() => window.HALO_COMMERCIAL_EXTENSION?.completeTask?.({ ...evidence, memberCreatedAt: evidence.registrationId, newMember })).catch(() => false).then(posted => {
          if (posted !== true && state.signedIn && (state.authPhone || state.authForm?.phone || "") === evidence.accountRef && state.memberCreatedAt === evidence.registrationId) flash("记录已保存，奖励待同步，可在会员任务重试");
        });
      }
      state.recordDraft = { labels: [], note: "" };
      render();
      return flash("用户记录已保存");
    }
    if (action === "toggle:rhythmNotice" && state.current === "RHY-00") {
      const view = rhythmSettingsStore.inspect();
      if (!view.canEdit) return;
      const result = rhythmSettingsStore.change("notice", !view.values.notice);
      rhythmSettingsWriteFailed = result.code === "storage";
      render(); return flash(result.ok ? "提醒偏好已保留，保存后生效" : result.error);
    }
    if (action.startsWith("toggle:")) {
      const key = action.slice(7);
      if (key === "reduceMotion") return handleGeneralAction("general:motion/toggle");
      if (key === "birthdayBenefit") return handleAction("profile-birthday-benefit");
      if (["legal", "aiLegal"].includes(key)) return;
      const handled = (typeof handleAccountToggle === "function" && handleAccountToggle(key)) || (typeof handleExperienceToggle === "function" && handleExperienceToggle(key));
      if (!handled) state.toggles[key] = !state.toggles[key];
      if (key === "haloBody" && (state.haloContext === "body" || !state.haloSource)) setHaloSource(hasBodyContext() ? "body" : "none");
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
    if (action === "activate-hardware") return initialSync.handle("initial-sync:continue");
    if (action.startsWith("measurement-start:")) { const type = action.slice(18); if (!ACCOUNT_MEASUREMENT_TYPES[type]) return; const unavailable = measurementUnavailable(type); if (unavailable) return flash(unavailable); state.measurementType = type; state.measurementStatus = "running"; state.measured = false; return go("HLT-04"); }
    if (action === "measurement-reset") { if (state.measurementStatus === "running") state.measurementStatus = "ready"; const unavailable = measurementUnavailable(); if (unavailable) return flash(unavailable); state.measurementStatus = "running"; state.measured = false; return render(); }
    if (action === "measurement-cancel") { state.measurementStatus = "ready"; state.measured = false; return go("HLT-03"); }
    if (action === "measurement-fail") { state.measurementStatus = "failed"; state.measured = false; return render(); }
    if (action.startsWith("measurement-state:")) { state.measurementStatus = action.slice(18); state.measured = state.measurementStatus === "complete"; return render(); }
    if (action.startsWith("public-play:")) { const id = action.slice(12); if (!NIGHT_CONTENT[id]) return; state.publicNightChoice = id; state.nightChoice = id; nightPlaylist.setSingle(id); return handleAction("night-start"); }
    if (action === "public-night-end") return handleAction("night-end");
    if (action === "night-preview") return showInfoModal("播放演示", `${currentNightContent().title}，${currentNightContent().duration} 分钟。当前原型不输出真实声音；开始后可以验证暂停、继续、历史与复盘。`, "开始演示", "night-start");
    if (action === "night-start") {
      if (state.nightSession && state.nightSession.status !== "ended") return go("NIG-04");
      const snapshot = nightPlaylist.snapshot();
      if (!snapshot) return showInfoModal("组合还是空的", "先添加一段内容，或选用 AI 推荐组合。", "选择内容", "go:NIG-03");
      const now = new Date().toISOString();
      const session = { ...snapshot, id: `night-${Date.now()}`, startedAt: now, resumedAt: now, positionSeconds: 0, status: "playing", fadeEnabled: isHardwareActive() && state.toggles.sleepFade, hardwareEligibleAtStart: isHardwareActive(), personalized: hasBodyContext(), ownerAccount: state.authPhone || "", memberRegistrationId: state.memberCreatedAt || "", recordScope: window.HaloPersonalScope.scope(state) };
      if (!writeNotificationProgress({ nightSession: session, playing: true })) return showInfoModal("暂时无法开始", "这次播放没能保存，组合还在。请重试后再开始。");
      closeModal();
      trackPrototypeEvent("night_content_started", { content_id: session.contentId, content_ids: session.tracks.map(item => item.id), duration_minutes: session.duration, session_id: session.id });
      return go("NIG-04");
    }
    if (action === "night-end") return finishNightSession();
    if (action.startsWith("night-history:")) { const id = action.slice(14); if (!state.nightHistory.some((entry) => entry.id === id && ownsNightSession(entry))) return flash("这条记录已不存在或不属于当前账号"); state.selectedNightSessionId = id; return go("TOD-08"); }
    if (action.startsWith("device-status:")) {
      const value = action.slice(14);
      if (state.current === "DEV-05" && value === "connected") return handleAction("activate-hardware");
      if (state.current === "DEV-01" && value === "connecting") {
        if (state.connectionIntro.request?.status === "checking" || deviceGuideBlocker()) return;
        if (deviceGuideState() === "failed") return handleAction("connect-intro-request");
        if (state.connectionIntro.permission !== "granted" || !state.toggles.bluetooth) return showConnectionPermission(["denied", "bluetooth-off"].includes(deviceGuideState()));
        trackPrototypeEvent("device_guide_scan_started", { source_page: "DEV-01", destination: "DEV-02", simulated: true });
        deviceScan.start();
        return go("DEV-02"); // Searching does not change the currently bound device's connection state.
      }
      if (value !== "disconnected" && !state.toggles.bluetooth) return flash("请先开启蓝牙权限");
      if (value === "syncing") { const unavailable = deviceOperationUnavailable("sync"); if (unavailable) return flash(unavailable); }
      if (value === "disconnected" && state.measurementStatus === "running") state.measurementStatus = "failed";
      if (value === "disconnected" && ["downloading", "verifying"].includes(state.firmwareStatus)) state.firmwareStatus = "failed";
      // Only a simulated sync completion timestamps the receipt; reconnecting does not.
      if (state.deviceStatus === "syncing" && ["connected", "low"].includes(value)) state.deviceLastSyncedAt = new Date().toISOString();
      state.deviceStatus = value;
      return render();
    }
    if (action.startsWith("body-weather:")) { state.bodyWeather = action.slice(13); return render(); }
    if (action.startsWith("lifecycle:")) { state.dataLifecycle = action.slice(10); return render(); }
    if (action.startsWith("trend:")) { state.trendPeriod = action.slice(6); return render(); }
    if (action.startsWith("firmware:")) return; // Retired manual firmware stages.
    if (action.startsWith("switch-halo-context:")) { setHaloSource(action.slice(20)); return render(); }
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
    if (action === "info:inspiration") { trackPrototypeEvent("daily_inspiration_info_open", { source_page: state.current }); return showInfoModal("关于今日灵感", window.HALO_INSPIRATION_DESCRIPTION); }
    if (action === "info:agreement") return showInfoModal("用户协议", "当前版本：2026 年 9 月 1 日。这里说明账号使用、服务边界、用户责任和争议处理方式。核心规则发生变化时，会按适用要求提前公示。");
    if (action === "info:privacy-policy") return showInfoModal("隐私政策", "这里说明设备、健康、会员、订单和服务数据的使用范围、保存方式，以及访问、更正、导出和删除入口。法定留存数据不会继续用于运营或个性化。");
    if (action === "info:health-ai-boundary") return showInfoModal("Halo 能做什么、不能做什么", "Halo 可以帮你读懂日常记录，给出生活和运动上的参考；它不会诊断疾病、开处方或处理医疗急症，也不能替代医生和其他专业医疗人员。");
    if (action.startsWith("ask:") || action === "send-chat") {
      const text = action.startsWith("ask:") ? action.slice(4) : state.haloDraft.trim();
      if (!text) return flash("先写下你想说的内容");
      const source = currentHaloSource();
      const sourceText = String(source?.text || "").slice(0, 120);
      const reply = source?.kind === "inspiration"
        ? (text.includes("颜色") || text.includes("穿") ? DAILY_INSPIRATION.outfitReply : "把它当作今天的一点文化灵感就好，不用它替你做重要决定。")
        : /放松|呼吸|睡前|停下来|睡不着|安静一会|安静一下/.test(text)
        ? "先把手里的事放一放。你可以选一段呼吸引导或安静的声音，想听时再开始。也可以先告诉我，是什么让你放松不下来？"
        : source?.kind === "feeling" || source?.kind === "rhythm"
        ? `你记下了“${sourceText}”。这份感受从什么时候开始的？我们可以从你最想说的那一点聊起。`
        : source?.kind === "correction"
        ? `好，按你说的“${sourceText}”来。你现在最想调整的是哪件事？`
        : /听我说|说一会|聊一聊|陪我聊/.test(text)
        ? "好，我在。你想从哪件事说起？不用先整理好再说。"
        : /安排|事情很多|计划/.test(text)
        ? "先告诉我，今天有哪些事必须做、哪些可以往后放？我们一起排个顺序。"
        : source?.kind === "body" && hasBodyContext()
        ? "可以一起看看今天的记录。不过，记录只是一部分：你自己现在感觉怎么样？"
        : "你现在最想聊的是身体感受、心情，还是今天的安排？从一件小事说起就好。";
      return appendHaloReply(text, reply, { preserveDraft: action.startsWith("ask:") });
    }
    if (action === "toggle-player") return changeNightPlayback();
    if (action === "measure-complete") { if (state.measurementStatus !== "running") return flash("请先开始测量"); state.measurementStatus = "ready"; const unavailable = measurementUnavailable(); if (unavailable) { state.measurementStatus = "failed"; return render(); } state.measured = true; state.measurementStatus = "complete"; state.lastMeasurement = { type: state.measurementType, source: "prototype-demo", metrics: ACCOUNT_MEASUREMENT_TYPES[state.measurementType].metrics, completedAt: new Date().toISOString() }; return render(); }
    if (["device-reset-cancel", "device-reset-complete"].includes(action)) return; // Retired unscoped reset actions.
    if (action === "studio-detail-continue") {
      const status = studioDetailState();
      if (status.disabled) { render(); return flash(status.label); }
      trackPrototypeEvent("studio_detail_continue", { event_id: state.selectedStudioEventId, target_page: status.route });
      return go(status.route);
    }
    if (action === "studio-home-records") return showStudioHomeRecords();
    if (action.startsWith("studio-home-filter:")) { const value = action.slice(19); if (!STUDIO_HOME_FILTERS.includes(value)) return; state.studioHomeFilter = value; return render(); }
    if (action.startsWith("studio-home-open:")) {
      const id = action.slice(17);
      const entry = studioHomeRecords().find(item => item.id === id);
      closeModal();
      if (!entry) return showInfoModal("没有找到这条体验", "请返回首页重新查看，其他记录不受影响。");
      if (!entry.status.route) return showInfoModal("这条体验暂时无法打开", "保留的预约记录没有改动。如需协助，请联系 Halo 客服。", "联系客服", "go:HELP-03");
      state.selectedStudioEventId = id;
      if (entry.record.sessionDone) state.selectedStudioHistoryId = id;
      syncStudioAliases();
      trackPrototypeEvent("studio_home_record_opened", { event_id: id, target_page: entry.status.route });
      return go(entry.status.route);
    }
    if (action.startsWith("studio-select:")) { const id = action.slice(14); if (!STUDIO_EVENTS[id]) return flash("未找到这场活动"); state.selectedStudioEventId = id; syncStudioAliases(); return go("STU-09"); }
    if (action.startsWith("studio-history:")) { const id = action.slice(15); if (!state.studioRecords[id]?.sessionDone) return flash("还没有这场活动的完成记录"); state.selectedStudioHistoryId = id; state.selectedStudioEventId = id; syncStudioAliases(); return go("STU-15"); }
    if (action.startsWith("studio-booking:")) { const id = action.slice(15); if (!state.studioRecords[id]?.booked) return flash("没有找到这笔预约"); state.selectedStudioEventId = id; syncStudioAliases(); return go("STU-18"); }
    if (action.startsWith("studio-booking-review:")) { studioBookingReviewOutcome = action.endsWith(":fail") ? "fail" : "success"; return render(); }
    if (action === "studio-voucher-toggle") {
      const quote = studioBookingQuote();
      if (!quote.known) return;
      const record = studioRecord();
      if (record.booked || record.bookingRequest?.status === "submitting") return flash("预约正在处理，不能更换体验券。");
      if (record.useVoucher && record.bookingRequest?.id && quote.voucher?.status === "used" && quote.voucher.bookingId === record.bookingRequest.id) return flash("体验券处理状态待确认，请先重试预约。");
      if (record.useVoucher) { record.useVoucher = false; record.selectedVoucherId = ""; }
      else {
        if (!quote.voucher?.eligible || quote.eventSnapshot.price === 0) return flash("本场无需或不能使用这张体验券。");
        record.useVoucher = true; record.selectedVoucherId = quote.voucher.id;
      }
      record.bookingError = "";
      return render();
    }
    if (action === "studio-book") return submitStudioBooking();
    if (action.startsWith("danger:")) {
      const [, title, message, label] = action.split(":");
      if (title === "删除节律数据") return handleRhythmManagement("rh-manage:delete");
      return showModal(title, message, label, `confirm-danger:${title}`);
    }
    if (action.startsWith("confirm-danger:")) {
      const title = action.slice(15);
      closeModal();
      if (["恢复出厂设置", "清空戒指缓存", "重置今日步数"].includes(title)) return;
      if (title === "清空 Halo 记忆") { state.haloMemories = []; state.haloMemoryCleared = true; flash("Halo 记忆已清空"); return render(); }
      if (title === "删除 Halo 数据") { state.haloMemories = []; state.haloMemoryDrafts = {}; state.conversations = []; state.chat = []; state.haloDraft = ""; state.haloSource = null; state.haloContext = "none"; state.activeConversationId = ""; state.conversationStatus = "new"; state.haloFeelingRecords = []; state.haloFeelingEditor = null; state.haloFeelingNote = ""; state.haloFeeling = ""; state.haloMemoryCleared = true; state.haloDataDeletionStatus = "submitted"; flash("本地 Halo 内容已清空，云端删除需在正式服务中核验"); return render(); }
      if (title === "删除节律数据") return; // Only the scoped management confirmation may delete records.
      if (title === "删除健康记录") { state.healthDeletionStatus = "submitted"; flash("健康记录删除申请已提交"); return render(); }
      if (title === "删除本次体验记录") return; // Scoped STU-15 confirmation owns this action.
      flash(`${title}已完成`);
      return;
    }
    if (action === "close-modal") return closeModal();
  }

  groupNav.addEventListener("click", (event) => { const button = event.target.closest("[data-group]"); if (!button) return; state.group = button.dataset.group; const first = filteredPages()[0]; if (first) state.current = first.id; render(); });
  nav.addEventListener("click", (event) => { const button = event.target.closest("[data-page]"); if (button) go(button.dataset.page); });
  screen.addEventListener("click", (event) => handleAction(event.target.closest("[data-action]")?.dataset.action));
  screen.addEventListener("submit", (event) => {
    if (event.target.id === "profile-editor-form") { event.preventDefault(); if (!profileEditorComposing) handleAction("profile-save"); return; }
    if (event.target.id === "basic-profile-form") { event.preventDefault(); handleAction("basic-profile-save"); return; }
    if (event.target.id !== "auth-login-form") return;
    event.preventDefault();
    handleAction("auth-login");
  });
  screen.addEventListener("keydown", (event) => {
    if (event.target.closest("#basic-profile-form") && event.key === "Enter" && (basicProfileEditor.isComposing() || event.isComposing || event.keyCode === 229)) { event.preventDefault(); return; }
    if (event.target.closest("#profile-editor-form") && event.key === "Enter" && (profileEditorComposing || event.isComposing || event.keyCode === 229)) { event.preventDefault(); return; }
    if (event.target.id === "chat-input" && event.key === "Enter" && !event.shiftKey && !event.isComposing && event.keyCode !== 229) {
      event.preventDefault();
      return handleAction("send-chat");
    }
    if (event.target.id === "auth-phone" && event.key === "Enter") { event.preventDefault(); document.getElementById("auth-code")?.focus(); }
  });
  screen.addEventListener("compositionstart", (event) => { if (event.target.closest("#profile-editor-form")) profileEditorComposing = true; });
  modalRoot.addEventListener("input", (event) => { if (event.target.id === "halo-memory-edit") haloMemory.input(); });
  screen.addEventListener("compositionend", (event) => { if (event.target.id === "conversation-search") haloHistory.search(event.target.value); });
  screen.addEventListener("compositionend", (event) => { if (event.target.closest("#profile-editor-form")) profileEditorComposing = false; });
  screen.addEventListener("compositionstart", (event) => { if (event.target.closest("#basic-profile-form")) basicProfileEditor.composition(true); });
  screen.addEventListener("compositionend", (event) => { if (event.target.closest("#basic-profile-form")) basicProfileEditor.composition(false); });
  screen.addEventListener("focusout", (event) => {
    if (event.target.id.startsWith("basic-profile-")) { basicProfileEditor.blur(event); return; }
    if (event.target.id !== "auth-phone") return;
    state.authForm.touched = Boolean(state.authForm.phone.trim());
    updateAuthControls();
    persistAppProgress();
  });
  screen.addEventListener("input", (event) => {
    if (event.target.id === "activity-record-note" && state.current === "TOD-07" && state.signedIn) {
      state.activityRecordDraft.id ||= `activity-record-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      state.activityRecordDraft.note = event.target.value;
      activityRecordError = "";
      persistAppProgress(); updateActivityRecordControls(); return;
    }
    if (event.target.id.startsWith("basic-profile-")) {
      basicProfileEditor.input(event);
      return;
    }
    if (event.target.id === "auth-phone") {
      if (authUiState().busy) return;
      const previousPhone = normalizedAuthPhone();
      state.authForm.phone = event.target.value;
      if (normalizedAuthPhone() !== previousPhone) invalidateAuthRequest();
      updateAuthControls();
      persistAppProgress();
      resumeAuthRequest();
      return;
    }
    if (event.target.id === "auth-code") {
      if (authUiState().busy) return;
      state.authForm.code = event.target.value.replace(/\D/g, "").slice(0, 6);
      state.authForm.codeError = "";
      if (state.authForm.login?.status === "failed") state.authForm.login = null;
      updateAuthControls();
      persistAppProgress();
      return;
    }
    if (window.HALO_COMMERCIAL_EXTENSION?.handleInput(event.target, { render, flash, track: trackPrototypeEvent })) return;
    if (typeof handleAccountInput === "function" && handleAccountInput(event.target)) return;
    if (typeof handleExperienceInput === "function" && handleExperienceInput(event.target)) return;
    if (event.target.id === "record-note") { currentRecordDraft().note = event.target.value; state.recordEditorError = ""; updateRecordEditorControls(); persistAppProgress(); return; }
    if (event.target.id === "rhythm-note") {
      const view = rhythmRecordStore.inspect();
      if (state.current !== "RHY-03" || !view.canEdit || view.conflict) return;
      state.rhythmNote = event.target.value; captureRhythmDraft(); return;
    }
    if (event.target.id === "conversation-search") {
      if (!event.isComposing) haloHistory.search(event.target.value);
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
      if (state.current === "RHY-04") {
        const result = rhythmSettingsStore.change(key, event.target.value);
        rhythmSettingsWriteFailed = result.code === "storage";
        rhythmSettingsFeedback = result.ok ? "修改已保留，保存后生效" : result.error;
        rhythmSettingsPage.update(rhythmSettingsStore.inspect(), rhythmSettingsFeedback);
        return;
      }
      if (state.current !== "RHY-00" || !rhythmSettingsStore.inspect().canEdit) return;
      const result = rhythmSettingsStore.change(key, event.target.value);
      rhythmSettingsWriteFailed = result.code === "storage";
      if (!result.ok) flash(result.error);
      const valid = rhythmSettingsValid(state.rhythmSettingsDraft);
      const button = screen.querySelector('[data-action="rhythm-settings-save"], [data-action="rhythm-setup-save"]');
      if (button) { button.disabled = !valid; button.setAttribute("aria-disabled", String(!valid)); }
      return;
    }
    if (["profile-nickname", "profile-birthday", "profile-height", "profile-weight"].includes(event.target.id)) {
      if (!state.signedIn || state.current !== "ACC-01" || state.accountDeletionStatus === "submitted") return;
      const key = event.target.id.replace("profile-", "");
      profileEditorDraft()[key] = event.target.value;
      profileDraftRestored = false;
      state.profileEditor.touched[key] = true;
      profileConflictReview = null;
      if (typeof updateProfileEditorControls === "function") updateProfileEditorControls();
      persistAppProgress();
      return;
    }
    if (event.target.id === "help-search") {
      helpCenter.input(event);
      return;
    }
  });
  function saveHealthRecordView() {
    if (!["TOD-06", "TOD-07"].includes(state.current) || screen.dataset.page !== state.current) return;
    capturePageView();
    persistAppProgress();
  }
  screen.addEventListener("toggle", event => {
    if (event.target.matches?.(".energy-disclosures details, .activity-disclosures details")) saveHealthRecordView();
  }, true);
  window.addEventListener("pagehide", saveHealthRecordView);
  function saveNightSupportView() {
    if (state.current !== "NIG-11") return;
    capturePageView(); persistAppProgress();
  }
  screen.addEventListener("toggle", event => { if (event.target.matches?.(".ns-faq")) saveNightSupportView(); }, true);
  window.addEventListener("pagehide", saveNightSupportView);
  function saveRhythmGuideView() {
    if (state.current !== "RHY-02" || screen.dataset.page !== "RHY-02") return;
    capturePageView();
    const ok = writePrivacyProgress({ pageViews: state.pageViews });
    const feedback = screen.querySelector(".rh-guide-feedback");
    if (feedback) feedback.textContent = ok ? "" : "浏览位置暂未保存，重新打开时可能回到页首。";
  }
  let rhythmGuideScrollTimer;
  screen.addEventListener("scroll", () => { if (state.current === "RHY-02") { clearTimeout(rhythmGuideScrollTimer); rhythmGuideScrollTimer = setTimeout(saveRhythmGuideView, 120); } });
  screen.addEventListener("toggle", event => { if (event.target.matches?.(".rh-guide-note, .rh-guide-boundary")) saveRhythmGuideView(); }, true);
  window.addEventListener("pagehide", saveRhythmGuideView);
  function saveBodyWeatherView() {
    if (state.current !== "TOD-03" || screen.dataset.page !== "TOD-03") return;
    capturePageView(); persistAppProgress();
  }
  screen.addEventListener("toggle", event => { if (event.target.matches?.(".bw-source")) saveBodyWeatherView(); }, true);
  window.addEventListener("pagehide", saveBodyWeatherView);
  window.addEventListener("pagehide", () => { if (["HLT-05", "HLT-06"].includes(state.current)) { capturePageView(); persistAppProgress(); } });
  window.addEventListener("offline", resumeActivitySync);
  window.addEventListener("online", () => { if (state.current === "TOD-07" && state.activitySync.blocked) render(); });
  screen.addEventListener("change", (event) => {
    if (event.target.id === "bw-trend-date" && state.current === "TOD-03") {
      if (!bodyWeatherTrendModel()?.daily.some(day => day.date === event.target.value)) return;
      state.bodyWeatherTrendView = { ...state.bodyWeatherTrendView, date: event.target.value };
      return render();
    }
    if (event.target.id === "bw-trend-records" && state.current === "TOD-03" && bodyWeatherTrendModel()) {
      state.toggles.trendRecords = event.target.checked;
      return render();
    }
    if (event.target.id === "activity-record-date") {
      if (state.current !== "TOD-07" || !state.signedIn) return;
      if (!validHealthDate(event.target.value)) { event.target.value = activityRecordDate(); return flash("请选择今天或更早的日期"); }
      return selectActivityDate(event.target.value);
    }
    if (event.target.id === "temperature-record-date") {
      if (state.current !== "HLT-06" || !state.signedIn) return;
      if (!validHealthDate(event.target.value)) { event.target.value = temperatureRecordDate(); return flash("请选择今天或更早的日期"); }
      return selectTemperatureDate(event.target.value);
    }
    if (event.target.id === "oxygen-record-date") {
      if (state.current !== "HLT-05" || !state.signedIn) return;
      if (!validHealthDate(event.target.value)) { event.target.value = oxygenRecordDate(); return flash("请选择今天或更早的日期"); }
      return selectOxygenDate(event.target.value);
    }
    if (event.target.id === "respiration-record-date") {
      if (state.current !== "HLT-02" || !state.signedIn) return;
      if (!validHealthDate(event.target.value)) { event.target.value = respirationRecordDate(); return flash("请选择今天或更早的日期"); }
      return selectRespirationDate(event.target.value);
    }
    if (event.target.id === "heart-record-date") {
      if (state.current !== "HLT-01" || !state.signedIn) return;
      if (!validHealthDate(event.target.value)) { event.target.value = heartRecordDate(); return flash("请选择今天或更早的日期"); }
      return selectHeartDate(event.target.value);
    }
    if (event.target.id === "energy-record-date") {
      if (state.current !== "TOD-06" || !state.signedIn) return;
      if (!validHealthDate(event.target.value)) { event.target.value = energyRecordDate(); return flash("请选择今天或更早的日期"); }
      return selectEnergyDate(event.target.value);
    }
    if (event.target.id === "sleep-record-date") {
      if (state.current !== "TOD-05" || !state.signedIn) return;
      if (!validHealthDate(event.target.value)) { event.target.value = sleepRecordDate(); return flash("请选择今天或更早的日期"); }
      return selectSleepDate(event.target.value);
    }
    if (event.target.id === "health-overview-date") {
      if (state.current !== "HLT-00") return;
      if (!validHealthDate(event.target.value)) { event.target.value = state.healthSelectedDate; return flash("请选择今天或之前的有效日期"); }
      state.healthSelectedDate = event.target.value;
      state.healthDetailContext = null;
      return render();
    }
    if (event.target.id === "auth-terms") {
      if (authUiState().busy) return;
      state.authForm.termsAccepted = event.target.checked;
      state.authForm.consentScope = event.target.checked ? AUTH_CONSENT_SCOPE : "";
      if (!state.authForm.termsAccepted) {
        state.toggles.legal = false;
        state.toggles.aiLegal = false;
      }
      updateAuthControls();
      persistAppProgress();
      return;
    }
  });
  modalRoot.addEventListener("input", (event) => {
    if (event.target.id !== "ai-correction-note" || !correctionModalIsCurrent()) return;
    state.aiCorrectionDraft.note = event.target.value;
    const saved = writeCorrectionState({ aiCorrectionDraft: state.aiCorrectionDraft });
    const hint = modalRoot.querySelector("#ai-correction-feedback");
    if (hint) hint.textContent = saved ? `${event.target.value.length}/500 · 草稿已保留，保存后才更新反馈。` : "草稿暂时无法保存到本机，请勿刷新或关闭页面；原反馈没有变化。";
  });
  modalRoot.addEventListener("click", (event) => handleAction(event.target.closest("[data-action]")?.dataset.action));
  document.querySelector(".inspector")?.addEventListener("click", (event) => handleAction(event.target.closest("[data-action]")?.dataset.action));
  tabbar.addEventListener("click", (event) => { const button = event.target.closest("[data-tab]"); if (button) switchTab(button.dataset.tab); });
  search.addEventListener("input", () => { state.query = search.value.trim(); const first = filteredPages()[0]; if (first && !filteredPages().some((item) => item.id === state.current)) state.current = first.id; render(); });
  document.getElementById("previous").addEventListener("click", () => go(previousId(state.current)));
  document.getElementById("next").addEventListener("click", () => handleAction(nextId(state.current)));
  window.addEventListener("keydown", (event) => { if (modalRoot.querySelector(".modal") || event.target.matches("input, textarea, select")) return; if (event.key === "ArrowLeft") go(previousId(state.current)); if (event.key === "ArrowRight") handleAction(nextId(state.current)); });
  const saveStudioDetailView = () => {
    if (!["STU-09", "STU-16", "STU-17", "STU-18", "STU-10", "STU-11", "STU-03", "STU-04", "STU-12", "STU-05", "STU-06"].includes(screen.dataset.page)) return;
    if (screen.dataset.page === "STU-03" && !studioPreflight.prepare()) return;
    if (screen.dataset.page === "STU-04" && !studioSession.prepare()) return;
    if (screen.dataset.page === "STU-12" && !studioReport.prepare()) return;
    if (screen.dataset.page === "STU-05" && !studioReport.prepare()) return;
    if (screen.dataset.page === "STU-06" && !studioReport.prepare()) return;
    capturePageView();
    persistAppProgress();
  };
  screen.addEventListener("scroll", event => { if (event.target.matches?.(".studio-detail-scroll")) saveStudioDetailView(); }, { capture: true, passive: true });
  screen.addEventListener("scroll", event => { if (event.target.matches?.(".record-page-scroll, .rh-editor-scroll, .rh-settings-scroll, .rh-setup-scroll, .rh-halo-scroll")) { capturePageView(); persistAppProgress(); } }, { capture: true, passive: true });
  window.addEventListener("pagehide", () => { if (["RHY-00", "RHY-03", "RHY-04", "RHY-06"].includes(state.current)) { capturePageView(); persistAppProgress(); } });
  window.addEventListener("beforeunload", event => {
    if (state.current === "RHY-03" && rhythmRecordStore.inspect().dirty && rhythmRecordStore.lastIssue()?.code === "storage") { event.preventDefault(); event.returnValue = ""; }
    if (["RHY-00", "RHY-04"].includes(state.current) && rhythmSettingsStore.inspect().dirty && rhythmSettingsWriteFailed) { event.preventDefault(); event.returnValue = ""; }
  });
  screen.addEventListener("keydown", event => {
    if (state.current !== "RHY-04" || !event.target.matches('.rh-settings-mode button') || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    const choices = [...screen.querySelectorAll('.rh-settings-mode button:not(:disabled)')];
    if (!choices.length) return;
    event.preventDefault(); event.stopPropagation();
    const offset = ["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1;
    const index = event.key === "Home" ? 0 : event.key === "End" ? choices.length - 1 : (choices.indexOf(event.target) + offset + choices.length) % choices.length;
    choices[index].focus();
  });
  screen.addEventListener("toggle", event => { if (event.target.matches?.(".studio-detail-info")) saveStudioDetailView(); }, true);
  window.addEventListener("pagehide", saveStudioDetailView);
  const refreshStudioDetailAvailability = () => {
    if (document.hidden) return;
    if (state.current === "STU-17") return studioPayment.refresh();
    if (state.current === "STU-18") return studioReservation.refresh();
    if (state.current === "STU-10") return studioPreparation.refresh();
    if (state.current === "STU-11") return studioFeeling.refresh();
    if (state.current === "STU-03") return studioPreflight.refresh();
    if (state.current === "STU-04") return studioSession.refresh();
    if (state.current === "STU-12") return studioReport.refresh();
    if (state.current === "STU-16") {
      const booking = screen.querySelector(".studio-booking[data-quote-key]");
      if (booking && booking.dataset.quoteKey !== studioBookingQuote().key) render();
      return;
    }
    if (state.current !== "STU-09") return;
    const detail = screen.querySelector(".studio-detail[data-status-key]");
    if (detail && detail.dataset.statusKey !== JSON.stringify(studioDetailState())) render();
  };
  setInterval(refreshStudioDetailAvailability, 20000);
  document.addEventListener("visibilitychange", refreshStudioDetailAvailability);
  const updateHaloViewport = () => document.documentElement.style.setProperty("--hal-viewport-height", `${window.visualViewport?.height || window.innerHeight}px`);
  window.visualViewport?.addEventListener("resize", updateHaloViewport);
  window.addEventListener("resize", updateHaloViewport);
  let bodyWeatherChartResizeFrame = 0;
  window.addEventListener("resize", () => {
    if (state.current !== "TOD-03") return;
    cancelAnimationFrame(bodyWeatherChartResizeFrame);
    bodyWeatherChartResizeFrame = requestAnimationFrame(() => {
      const host = screen.querySelector(".bw-trend-graph");
      const model = bodyWeatherTrendModel();
      if (host && model) host.innerHTML = bodyWeatherTrendGraph(model);
    });
  });
  updateHaloViewport();
  window.addEventListener("popstate", () => {
    if (["RHY-02", "RHY-06"].includes(state.current) && location.hash.toUpperCase() === `#${state.current}`) {
      const prior = state.selectedRhythmDate;
      rhythmHome.restore(state.current, history.state?.rhythmHomeContext);
      if (prior !== state.selectedRhythmDate) render();
    }
    const reading = legalReadingView();
    if (reading && location.hash.toUpperCase() === `#${state.current}`) showLegalReading(reading.kind, true);
    else if (modalRoot.querySelector(".legal-reading-modal, .permission-system-modal, .system-health-modal")) closeModal(true);
    // Back-menu jumps between two TOD-08 entries can keep the same hash.
    const context = history.state?.nightReviewContext;
    if (state.current === "TOD-08" && location.hash.toUpperCase() === "#TOD-08" && context && context.sessionId !== state.selectedNightSessionId) {
      nightReview.restore("TOD-08", context, "");
      render();
    }
  });
  window.addEventListener("hashchange", () => {
    if (!generalSettingsSafe()) { history.replaceState({ ...history.state, id: "SET-03" }, "", "#SET-03"); return; }
    const id = location.hash.slice(1).toUpperCase();
    if (!["CHN-05", "SEL-08"].includes(id) && !pages.some((item) => item.id === id)) return;
    if (id === state.current) return;
    if (state.current === "HAL-08" && !haloSettingsHub.canLeave()) {
      history.replaceState({ ...history.state, id:"HAL-08" }, "", "#HAL-08");
      return;
    }
    if (state.current === "HAL-07" && !haloPrivacyControls.canLeave()) {
      history.replaceState({ ...history.state, id:"HAL-07" }, "", "#HAL-07");
      return;
    }
    if (state.current === "HAL-06" && !haloJourney.canLeave()) {
      history.replaceState({ ...history.state, id:"HAL-06" }, "", "#HAL-06");
      return;
    }
    if (state.current === "HAL-05" && !haloFeelingEditor.canLeave()) {
      history.replaceState({ ...history.state, id:"HAL-05" }, "", "#HAL-05");
      return;
    }
    if (state.current === "HAL-04" && !haloProactive.canLeave()) {
      history.replaceState({ ...history.state, id:"HAL-04" }, "", "#HAL-04");
      return;
    }
    if (state.current === "HAL-03" && !haloMemory.canLeave()) {
      history.replaceState({ ...history.state, id:"HAL-03" }, "", "#HAL-03");
      return;
    }
    if (state.current === "HAL-02" && !haloHistory.canLeave()) {
      history.replaceState({ ...history.state, id:"HAL-02" }, "", "#HAL-02");
      return;
    }
    if (state.current === "ACC-03" && !accountDeletion.canLeave()) {
      const trail = Array.isArray(history.state?.trail) ? history.state.trail : ["ACC-03"];
      history.replaceState({ ...history.state, id: "ACC-03", trail: [...trail.slice(0, -1), "ACC-03"] }, "", "#ACC-03");
      return;
    }
    capturePageView();
    const target = guardedRoute(id);
    nightReview.restore(target, history.state?.nightReviewContext, state.current);
    nightHome.restore(target, history.state?.nightContentDetail, state.current);
    supportContact?.enter(target, state.current, true);
    aboutLegal?.enter(target, state.current, true);
    helpCenter?.enter(target, state.current);
    healthReports.restore(target, history.state?.healthReportContext);
    stateShare.restore(target, history.state?.stateShareContext);
    dataQuality.restore(target, history.state?.dataQualityContext);
    bodyWeatherRoute.restore(target, history.state?.bodyWeatherContext);
    rhythmHome.restore(target, history.state?.rhythmHomeContext);
    deviceWear.restore(target, state.current);
    initialSync?.enter(target, state.current);
    basicProfileEditor.enter(target, state.current);
    const healthContext = history.state?.healthContext;
    if (target === "HLT-02" && validHealthDate(history.state?.respirationWindowEnd)) state.respirationWindowEnd = history.state.respirationWindowEnd;
    if (target === "HLT-06" && validHealthDate(history.state?.temperatureWindowEnd)) state.temperatureWindowEnd = history.state.temperatureWindowEnd;
    if (target === "HLT-05" && validHealthDate(history.state?.oxygenWindowEnd)) state.oxygenWindowEnd = history.state.oxygenWindowEnd;
    if (target === "HLT-05" && ["day", "night"].includes(history.state?.oxygenMode)) { state.oxygenMode = history.state.oxygenMode; state.oxygenDaySelection = history.state.oxygenDaySelection || null; }
    state.healthDetailContext = healthContext?.route === target && validHealthDate(healthContext.date) ? healthContext : null;
    if (state.healthDetailContext) state.healthSelectedDate = state.healthDetailContext.date;
    if (target === "HLT-00" && validHealthDate(history.state?.healthDate)) state.healthSelectedDate = history.state.healthDate;
    state.current = target;
    if (target === "RHY-03") { const result = rhythmRecordStore.open(state.selectedRhythmDate); rhythmEditorProblem = result.ok ? "" : result.error; rhythmEditorDraftStatus = result.ok && rhythmRecordStore.inspect().dirty ? "已恢复未保存的草稿" : ""; }
    if (["RHY-00", "RHY-04"].includes(target)) openRhythmSettings();
    const tab = tabForRoute(target);
    if (tab) {
      state.activeTab = tab;
      const stack = state.tabStacks[tab] || [tab];
      const index = stack.lastIndexOf(target);
      state.tabStacks[tab] = index >= 0 ? stack.slice(0, index + 1) : [...stack, target];
    }
    const trail = Array.isArray(history.state?.trail) ? history.state.trail : [target];
    const reading = legalReadingView();
    history.replaceState({ halo: true, id: target, ...window.haloChannelStorage?.historyFields(target), ...window.HALO_MEMBER_TASKS.historyFields(target), ...window.HALO_COUPON_WALLET?.historyFields?.(target), ...window.HALO_MEMBER_TASK_DETAIL.historyFields(target), trail: bodyWeatherRoute.mapTrail([...trail.slice(0, -1), target]), ...window.HALO_MEMBER_LEVELS.historyFields(target), ...window.HALO_MEMBER_UPGRADE.historyFields(target), ...deviceWear.historyFields(target), ...nightReview.historyFields(target), ...nightHome.historyFields(target), ...healthReports.historyFields(target), ...stateShare.historyFields(target), ...dataQuality.historyFields(target), ...rhythmHome.historyFields(target), ...bodyWeatherRoute.historyFields(target), ...(reading ? { legalReading: reading } : {}) }, "", `#${target}`);
    render();
    if (reading && legalReadingView()) showLegalReading(reading.kind, true);
  });

  initializeReviewRepairs();
  const temperatureDemo = new URLSearchParams(location.search).get("temperature-demo");
  if (TEMPERATURE_SCENARIOS.includes(temperatureDemo) && state.temperatureDemoEntry !== temperatureDemo) {
    state.temperatureReviewScenario = temperatureDemo; state.temperatureDemoEntry = temperatureDemo;
  }
  if (!TEMPERATURE_SCENARIOS.includes(state.temperatureReviewScenario)) state.temperatureReviewScenario = "unknown";
  const oxygenDemo = new URLSearchParams(location.search).get("oxygen-demo");
  if (!["day", "night"].includes(state.oxygenMode)) state.oxygenMode = "day";
  if (OXYGEN_SCENARIOS.includes(oxygenDemo) && state.oxygenDemoEntry !== oxygenDemo) {
    state.oxygenReviewScenario = oxygenDemo;
    state.oxygenDemoEntry = oxygenDemo;
  }
  if (!OXYGEN_SCENARIOS.includes(state.oxygenReviewScenario)) state.oxygenReviewScenario = "unknown";
  if (typeof initializeAccountState === "function") initializeAccountState();
  todayRhythmStorage = window.createHaloTodayRhythmStorage({ state, progressKey: APP_PROGRESS_KEY, recordsKey: SUBJECTIVE_RECORDS_KEY });
  try { todayRhythmStorage.initialize(); } catch (error) { todayRhythmStorage.fail(error); state.subjectiveRecords = []; }
  personalScope = window.createHaloPersonalScope({ state, progressKey: APP_PROGRESS_KEY });
  try { personalScope.initialize(); } catch (error) { todayRhythmStorage.fail(error); }
  window.addEventListener("storage", event => {
    if (![APP_PROGRESS_KEY, SUBJECTIVE_RECORDS_KEY].includes(event.key)) return;
    if (todayRhythmStorage.accessError() || personalScope.accessError()) { render(); return; }
    if (state.current === "TOD-02" || modalRoot.querySelector(".modal") || ["RHY-00", "RHY-03", "RHY-04"].includes(state.current)) return;
    try { todayRhythmStorage.refreshRecords(); } catch (error) { todayRhythmStorage.fail(error); return; }
    // Do not write progress from a storage event: that can cause tab-to-tab loops.
    if (event.key === SUBJECTIVE_RECORDS_KEY && ["TOD-01", "TOD-03"].includes(state.current)) render();
  });
  window.HaloAccountScope.select(state, state.authPhone);
  if (typeof initializeExperienceState === "function") initializeExperienceState();
  new MutationObserver(() => {
    const modal = modalRoot.querySelector(".modal");
    if (!modal) { screen.inert = false; tabbar.inert = false; return; }
    if (!modalReturnFocus && document.activeElement !== document.body) modalReturnFocus = document.activeElement;
    modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true");
    if (!modal.hasAttribute("aria-label") && !modal.hasAttribute("aria-labelledby")) modal.setAttribute("aria-label", modal.querySelector("h2")?.textContent || "提示");
    screen.inert = true; tabbar.inert = true;
    if (!modal.contains(document.activeElement)) modal.querySelector("button:not([disabled]), input, textarea, select")?.focus();
  }).observe(modalRoot, { childList: true, subtree: true });
  document.addEventListener("keydown", event => {
    const modal = modalRoot.querySelector(".modal");
    if (!modal) return;
    if (modal.matches('[data-general-modal="preferences"]') && event.target.matches(".gs-option") && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
      const options = [...event.target.closest(".gs-options").querySelectorAll(".gs-option")];
      const offset = ["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1;
      const index = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : (options.indexOf(event.target) + offset + options.length) % options.length;
      event.preventDefault();
      options[index].focus();
      handleGeneralAction(options[index].dataset.action);
      return;
    }
    if (event.key === "Escape") { event.preventDefault(); closeModal(); return; }
    if (event.key !== "Tab") return;
    const controls = [...modal.querySelectorAll("button:not([disabled]), input:not([disabled]), textarea, select, a[href], [tabindex='0']")].filter(el => el.getClientRects().length);
    const first = controls[0], last = controls.at(-1);
    if ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) { event.preventDefault(); (event.shiftKey ? last : first)?.focus(); }
  });
  // Old bookmarks and saved navigation resume the application, not the retired device prerequisite.
  const legacyChannelRoute = window.HALO_COMMERCIAL_EXTENSION?.channelJoinNext?.().route || "CHN-01";
  if (state.lastVisitedRoute === "CHN-05") state.lastVisitedRoute = legacyChannelRoute;
  state.navigationHistory = state.navigationHistory.map(id => id === "CHN-05" ? legacyChannelRoute : id);
  for (const key of Object.keys(state.tabStacks)) state.tabStacks[key] = state.tabStacks[key].map(id => id === "CHN-05" ? legacyChannelRoute : id);
  startup = window.createHaloStartup({ state, pages, esc, symbol: HALO_SYMBOL, go, render,
    bindingRoute: () => deviceBinding.resumeRoute(),
    guideRoute: prior => deviceWear.resumeRoute(prior) || initialSync.resumeRoute(prior),
    expireSession: () => { state.signedIn = false; invalidateAuthRequest(); }, track: trackPrototypeEvent });
  const requestedInitial = location.hash.slice(1).toUpperCase();
  const initialCandidate = ["CHN-05", "SEL-08"].includes(requestedInitial) ? guardedRoute(requestedInitial) : requestedInitial;
  const initial = pages.some(item => item.id === initialCandidate) ? initialCandidate : "SYS-01";
  // Explicit non-startup hashes remain available for individual prototype reviews.
  if (initial === "SYS-01") {
    const preview = new URLSearchParams(location.search).get("startupPreview") === "1";
    startup.begin(state.lastVisitedRoute, preview ? "preview" : "normal", !preview);
  }
  if (pages.some((item) => item.id === initial)) {
    state.current = guardedRoute(initial);
  }
  // A browser history entry owns its browsing date; another tab may have saved a different one.
  if (history.state?.id === state.current) {
    if (state.current === "HLT-02" && validHealthDate(history.state.respirationWindowEnd)) state.respirationWindowEnd = history.state.respirationWindowEnd;
    if (state.current === "HLT-05" && validHealthDate(history.state.oxygenWindowEnd)) state.oxygenWindowEnd = history.state.oxygenWindowEnd;
    if (state.current === "HLT-05" && ["day", "night"].includes(history.state.oxygenMode)) { state.oxygenMode = history.state.oxygenMode; state.oxygenDaySelection = history.state.oxygenDaySelection || null; }
    if (Object.prototype.hasOwnProperty.call(history.state, "healthContext")) {
      const context = history.state.healthContext;
      state.healthDetailContext = context?.route === state.current && validHealthDate(context.date) ? context : null;
    }
    if (state.current === "HLT-00" && validHealthDate(history.state.healthDate)) state.healthSelectedDate = history.state.healthDate;
  }
  if (state.healthDetailContext?.route === state.current) state.healthSelectedDate = state.healthDetailContext.date;
  const initialTrail = bodyWeatherRoute.mapTrail(Array.isArray(history.state?.trail) ? history.state.trail : [state.current]);
  bodyWeatherRoute.restore(state.current, history.state?.bodyWeatherContext);
  deviceWear.restore(state.current);
  if (state.current === "TOD-08" && history.state?.nightReviewContext) nightReview.restore("TOD-08", history.state.nightReviewContext, "");
  if (state.current === "NIG-02" && history.state?.nightContentDetail) nightHome.restore("NIG-02", history.state.nightContentDetail, "");
  if (state.current === "TOD-09" && history.state?.healthReportContext) healthReports.restore("TOD-09", history.state.healthReportContext);
  if (["RHY-01", "RHY-02", "RHY-03", "RHY-06"].includes(state.current)) rhythmHome.restore(state.current, history.state?.rhythmHomeContext);
  if (state.current === "RHY-03") { const result = rhythmRecordStore.open(state.selectedRhythmDate); rhythmEditorProblem = result.ok ? "" : result.error; rhythmEditorDraftStatus = result.ok && rhythmRecordStore.inspect().dirty ? "已恢复未保存的草稿" : ""; }
  const initialLegalReading = legalReadingView();
  const initialReferralHistory = history.state;
  if (["RHY-00", "RHY-04"].includes(state.current)) openRhythmSettings();
  history.replaceState({ halo: true, id: state.current, ...window.haloChannelStorage?.historyFields(state.current), ...window.HALO_MEMBER_TASKS.historyFields(state.current), ...window.HALO_COUPON_WALLET?.historyFields?.(state.current), ...window.HALO_MEMBER_TASK_DETAIL.historyFields(state.current), trail: [...initialTrail.slice(0, -1), state.current], ...window.HALO_MEMBER_LEVELS.historyFields(state.current), ...window.HALO_MEMBER_UPGRADE.historyFields(state.current), ...deviceWear.historyFields(state.current), ...nightReview.historyFields(state.current), ...nightHome.historyFields(state.current), ...healthReports.historyFields(state.current), ...stateShare.historyFields(state.current), ...dataQuality.historyFields(state.current), ...rhythmHome.historyFields(state.current), ...bodyWeatherRoute.historyFields(state.current), ...(initialLegalReading ? { legalReading: initialLegalReading } : {}) }, "", `#${state.current}`);
  if (state.current === "REF-01" && initialReferralHistory?.referralScope) history.replaceState({ ...history.state, referralScope: initialReferralHistory.referralScope, referralPanel: initialReferralHistory.referralPanel, referralChild: initialReferralHistory.referralChild }, "", location.href);
  render();
  if (initialLegalReading && legalReadingView()) showLegalReading(initialLegalReading.kind, true);
})();
