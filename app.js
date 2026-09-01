(function () {
  const pages = window.HALO_V5_PAGES || [];
  const groups = ["全部", "首次使用", "设备", "今日", "健康数据", "夜间", "Halo AI", "节律", "我的", "会员与积分", "Halo Select", "渠道经营", "Halo Studio"];
  const MEMBERSHIP_STATE_KEY = "membershipHardwareState";
  const SUBJECTIVE_RECORDS_KEY = "haloSubjectiveRecords";
  const SLEEP_GOAL_KEY = "haloSleepGoal";
  const MEMBERSHIP_STATES = ["never-bound", "active", "unbound-retained"];
  const MEMBERSHIP_RULE_VERSION = "v1.19";
  const SUBJECTIVE_OPTIONS = ["情绪", "疲惫", "饮酒", "晚睡", "经期不适"];
  const SUBJECTIVE_RECORD_META = {
    "情绪": { date: "8 月 30 日", time: "21:10", original: "今天情绪起伏有些明显。", daysAgo: 1 },
    "疲惫": { date: "8 月 27 日", time: "18:40", original: "下午开始明显疲惫。", daysAgo: 4 },
    "饮酒": { date: "8 月 23 日", time: "22:05", original: "晚餐饮酒。", daysAgo: 8 },
    "晚睡": { date: "8 月 29 日", time: "00:36", original: "比目标上床时间晚。", daysAgo: 2 },
    "经期不适": { date: "8 月 25 日", time: "09:20", original: "今天有经期不适。", daysAgo: 6 },
  };
  const DEFAULT_SLEEP_GOAL = { duration: "8", workdayBedtime: "23:15", workdayWake: "07:15", restBedtime: "23:45", restWake: "08:00" };
  function readStoredJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }
  const requestedMembershipState = new URLSearchParams(location.search).get(MEMBERSHIP_STATE_KEY);
  const storedMembershipState = localStorage.getItem(MEMBERSHIP_STATE_KEY);
  const initialMembershipState = MEMBERSHIP_STATES.includes(requestedMembershipState)
    ? requestedMembershipState
    : MEMBERSHIP_STATES.includes(storedMembershipState) ? storedMembershipState : "active";
  const storedSubjectiveRecords = readStoredJson(SUBJECTIVE_RECORDS_KEY, []);
  const storedSleepGoal = readStoredJson(SLEEP_GOAL_KEY, DEFAULT_SLEEP_GOAL);
  const state = {
    current: "TOD-01",
    group: "全部",
    query: "",
    toggles: { bluetooth: true, notification: true, rhythm: true, wake: true, proactive: false, memory: true, studioHealth: true, haloBody: true, location: false, inspiration: true, trendRecords: true },
    playing: false,
    measured: false,
    booked: false,
    paid: false,
    refundStatus: "none",
    sessionDone: false,
    studioMode: "ring",
    alarmSound: "晨雾",
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
    studioBenefitClaimed: false,
    memoryProposalConfirmed: false,
    journeyPaused: false,
    wakeSaved: false,
    profileSaved: false,
    feedbackSubmitted: false,
    rhythmFeeling: "",
    navigationHistory: [],
  };

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
    try {
      sessionStorage.setItem("haloV5PrototypeEvents", JSON.stringify(prototypeEvents));
    } catch {
      // Prototype analytics remain available in-memory when storage is unavailable.
    }
  }

  const HALO_SYMBOL = "assets/HALORING_super_symbol_copper.png";
  const HALO_SYMBOL_IVORY = "assets/HALORING_super_symbol_ivory.png";
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
      headline: "今天的 Body Weather 还没准备好",
      summary: "完成一段完整记录后，这里会开始显示进度。",
      reason: "还没有收到一段完整的戒指记录。",
      needed: "当前 0 / 7 个有效佩戴日；完成第 1 个后开始积累",
      next: "保持平时的佩戴方式，完成同步后会自动更新。",
      signals: [["睡眠恢复", "等待记录"], ["身体能量", "等待记录"], ["活动安排", "先按感受"]],
    },
    accumulating: {
      label: "数据积累中",
      headline: "Body Weather 正在积累数据",
      summary: "已有记录会保留，继续按平时的节奏佩戴即可。",
      reason: "已经有一些记录，但前后还不够连续。",
      needed: "当前 3 / 7 个有效佩戴日，还差 4 个",
      next: "照常佩戴，不需要为了数据改变作息。",
      signals: [["睡眠恢复", "记录较少"], ["身体能量", "继续积累"], ["活动安排", "先按感受"]],
    },
    baseline: {
      label: "基线建立中",
      headline: "个人基线正在建立",
      summary: "Halo 正在了解你的常见状态，不需要刻意改变生活。",
      reason: "记录已经足够开始了解你的常见范围，个人基线还在建立。",
      needed: "当前 5 / 7 个有效佩戴日，还差 2 个；14 个有效夜晚会继续修正",
      next: "保持平时的佩戴和生活节奏。",
      signals: [["睡眠恢复", "开始了解"], ["身体能量", "基线建立中"], ["活动安排", "先按感受"]],
    },
    interpretable: {
      label: "可以解释",
      headline: "今天的 Body Weather 已准备好",
      summary: "先看结论，需要时再查看细节。",
      reason: "今天的记录和个人基线足以支持这次解释。",
      needed: "7 日基线已建立；当前 9 / 14 个有效夜晚，还差 5 个完成首轮修正",
      next: "先看今天的结论，需要时再查看细节。",
      signals: [],
    },
    limited: {
      label: "数据质量受限",
      headline: "今天的数据不够完整，建议会更谨慎",
      summary: "昨晚有一段记录缺失，先按自己的感受安排。",
      reason: "最近一次同步未完成，昨晚 02:10–03:00 的记录缺失。",
      needed: "完成一次同步，或补齐下一段完整记录",
      next: "先重新同步；如果仍未更新，再查看设备状态。",
      signals: [["睡眠恢复", "部分缺失"], ["身体能量", "解释较轻"], ["活动安排", "先按感受"]],
    },
  };
  const BODY_WEATHER_STATES = {
    restore: {
      label: "修复日",
      english: "RESTORE DAY",
      homeTitle: "今天，先把恢复放在前面",
      homeBody: "昨晚的睡眠对恢复支持较少，身体能量也低于近期常见水平。",
      signals: [["睡眠恢复", "明显偏少"], ["身体能量", "余量偏低"], ["活动安排", "降低强度"]],
      detailSummary: "身体可用余量不多，今天适合减少额外消耗。",
      why: "昨晚睡眠连续性偏低，身体能量低于个人常见范围，夜间生理信号波动较多。",
      pressure: "白天放松时段较少",
      trend: "近期修复日有所增加",
      actionTitle: "把必要的事做完，其余留到状态更好时",
      actionBody: "保持轻量活动，暂缓高强度训练；今晚尽量提早进入安静的睡前节奏。",
      nightTitle: "今晚优先做完整修复",
      nightBody: "从 18 分钟舒缓练习开始。",
      shareLine: "今天先照顾恢复，少一点额外消耗。",
    },
    slow: {
      label: "缓行日",
      english: "SLOW DAY",
      homeTitle: "今天，给自己留一点余量",
      homeBody: "昨晚的睡眠对恢复支持比近期少一些，身体仍能支持日常安排。",
      signals: [["睡眠恢复", "支持稍弱"], ["身体能量", "还有余量"], ["活动安排", "适合放轻"]],
      detailSummary: "日常可以照常，额外强度适合少一点。",
      why: "昨晚睡眠连续性比近期略低，身体能量仍在个人常见范围内，压力信号整体平稳。",
      pressure: "整体平稳",
      trend: "近期缓行日较多",
      actionTitle: "照常生活，给临时加码留一点余地",
      actionBody: "可以保持日常活动；如果午后疲惫明显，把高强度训练顺延到状态更好时。",
      nightTitle: "今晚更适合安静收尾",
      nightBody: "从 12 分钟身体扫描开始。",
      shareLine: "今天照常生活，也给自己留一点余量。",
    },
    balance: {
      label: "平衡日",
      english: "BALANCE DAY",
      homeTitle: "今天，身体状态比较平稳",
      homeBody: "睡眠、能量和压力都接近你的近期常见状态。",
      signals: [["睡眠恢复", "比较稳定"], ["身体能量", "状态平稳"], ["活动安排", "照常进行"]],
      detailSummary: "今天不需要刻意收着，也不用额外加码。",
      why: "昨晚睡眠连续性接近个人基线，身体能量稳定，压力信号没有明显波动。",
      pressure: "没有明显波动",
      trend: "近期状态较为平稳",
      actionTitle: "按原计划过一天",
      actionBody: "保持日常活动和休息节奏，留意真实感受即可。",
      nightTitle: "今晚保持熟悉的节奏",
      nightBody: "按平时的睡前习惯开始。",
      shareLine: "今天状态平稳，按自己的节奏来。",
    },
    active: {
      label: "活力日",
      english: "ACTIVE DAY",
      homeTitle: "今天，身体还有充足余量",
      homeBody: "昨晚恢复支持充足，身体能量高于近期常见水平。",
      signals: [["睡眠恢复", "支持充足"], ["身体能量", "余量充足"], ["活动安排", "可以积极"]],
      detailSummary: "如果本来有想做的事，今天可以安排得更积极一些。",
      why: "昨晚睡眠连续性良好，身体能量高于个人常见范围，压力信号保持平稳。",
      pressure: "保持平稳",
      trend: "近期活力日有所增加",
      actionTitle: "适合安排更积极的活动",
      actionBody: "按计划运动或处理需要专注的事情，同时保留正常休息。",
      nightTitle: "今晚自然收住节奏",
      nightBody: "不必额外加码，保持熟悉的睡前习惯。",
      shareLine: "今天余量充足，可以更积极一点。",
    },
  };
  const DAILY_INSPIRATION = {
    keyword: "留白",
    message: "今天不必急着把每个空隙填满。给重要决定留一点距离，更容易听见自己的判断。",
    action: "把一件不紧急的事顺延。",
    color: "鼠尾草绿",
    number: "6",
  };
  function currentBodyWeather() {
    return BODY_WEATHER_STATES[state.bodyWeather] || BODY_WEATHER_STATES.slow;
  }

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
  function go(id, recordHistory = true) {
    if (!pages.some((item) => item.id === id)) return;
    if (recordHistory && state.current !== id) state.navigationHistory.push(state.current);
    state.current = id;
    history.replaceState(null, "", `#${id}`);
    render();
  }
  function goBack() {
    const item = pages.find((candidate) => candidate.id === state.current);
    const parentId = String(item?.parent || "").match(/[A-Z]+-\d+/)?.[0];
    const fallback = parentId && pages.some((candidate) => candidate.id === parentId) ? parentId : previousId(state.current);
    const target = state.navigationHistory.pop() || fallback;
    go(target, false);
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
  function saveShareImage() {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const context = canvas.getContext("2d");
    const weather = currentBodyWeather();
    context.fillStyle = state.shareBackground === "night" ? "#171813" : "#f0eadf";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = state.shareBackground === "night" ? "#f7f1e7" : "#332f29";
    context.font = "48px sans-serif";
    context.fillText("HALO BODY WEATHER", 96, 150);
    context.font = "bold 112px sans-serif";
    context.fillText(weather.label, 96, 650);
    context.font = "42px sans-serif";
    context.fillText(weather.shareLine, 96, 760, 880);
    canvas.toBlob((blob) => { if (blob) { downloadBlob("HALORING-Body-Weather.png", blob); flash("分享卡图片已保存"); } }, "image/png");
  }
  function showModal(title, message, confirmLabel, action) {
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal"><h2>${esc(title)}</h2><p>${esc(message)}</p><div class="button-row"><button class="danger-button" data-action="${esc(action)}">${esc(confirmLabel)}</button><button class="secondary" data-action="close-modal">取消</button></div></section></div>`;
  }
  function showInfoModal(title, message, confirmLabel = "知道了", action = "close-modal") {
    const closeButton = action === "close-modal" ? "" : '<button class="text-button" data-action="close-modal">关闭</button>';
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal"><h2>${esc(title)}</h2><p>${esc(message)}</p><div class="button-row"><button class="primary" data-action="${esc(action)}">${esc(confirmLabel)}</button>${closeButton}</div></section></div>`;
  }
  function showExportModal() {
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal export-modal" data-export-step="choose"><div class="modal-title-row"><div><span class="modal-eyebrow">DATA EXPORT</span><h2>选择导出方式</h2></div><button class="text-button" data-action="close-modal">关闭</button></div><p>导出包含你的健康记录、用户记录和必要来源说明。完整健康数据不会通过普通邮件发送。</p><div class="export-choice-grid"><button class="export-choice" data-action="export:local"><span>保存在当前设备</span><strong>本地文件</strong><small>生成受保护的 ZIP 文件，由你自行保存或转移。</small></button><button class="export-choice" data-action="export:secure"><span>在其他设备取回</span><strong>限时安全链接</strong><small>创建后 24 小时失效，可随时撤销并查看访问记录。</small></button></div>${notice("导出前确认", "继续前需要验证你的身份；安全链接不会放在普通邮件正文中。", "sage")}</section></div>`;
  }
  function showExportResult(kind, revoked = false) {
    const isLocal = kind === "local";
    const title = isLocal ? "本地文件已准备" : revoked ? "安全链接已撤销" : "限时安全链接已创建";
    const body = isLocal
      ? `<section class="export-result"><span class="result-state ready">可下载</span><strong>HALORING-data-2026-08-31.json</strong><small>仅保存在当前设备 · 不通过普通邮件发送</small></section>${rows([["导出范围", "健康记录 + 用户记录 + 来源说明"], ["保存方式", "本地文件"], ["外部访问", "不上传，不产生外部访问"]])}`
      : `<section class="export-result"><span class="result-state ${revoked ? "revoked" : "ready"}">${revoked ? "已撤销" : "可使用"}</span><strong>${revoked ? "此链接已不可访问" : "创建后 24 小时自动失效"}</strong><small>${revoked ? "撤销时间已记录" : "只发送给你信任的接收方"}</small></section>${rows([["到期", revoked ? "已提前撤销" : "24 小时后"], ["访问记录", revoked ? "0 次访问 · 1 次撤销" : "尚无访问"], ["普通邮件", "不发送完整健康数据"]])}`;
    const actions = isLocal
      ? buttons([["下载本地文件", "export-download", "primary"], ["返回选择", "export:open", "secondary"]])
      : revoked
      ? buttons([["重新选择导出方式", "export:open", "secondary"]])
      : buttons([["复制安全链接", "export-copy-link", "primary"], ["立即撤销", "export:revoke", "danger-button"]]);
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal export-modal" data-export-step="${esc(kind)}"><div class="modal-title-row"><div><span class="modal-eyebrow">DATA EXPORT</span><h2>${esc(title)}</h2></div><button class="text-button" data-action="close-modal">关闭</button></div>${body}${actions}</section></div>`;
  }
  function showWidgetPreview() {
    const connection = isHardwareActive() ? DEVICE_STATUS[state.deviceStatus] || DEVICE_STATUS.connected : DEVICE_STATUS.disconnected;
    const connectionLabel = state.deviceStatus === "low" ? "低电量" : connection.label;
    const weather = currentBodyWeather();
    const canInterpretWeather = isHardwareActive() && state.dataLifecycle === "interpretable";
    const dataState = DATA_LIFECYCLE[state.dataLifecycle] || DATA_LIFECYCLE.none;
    const bodyWeather = canInterpretWeather ? weather.label : isHardwareActive() ? dataState.label : "尚未生成";
    const tonight = canInterpretWeather ? `今晚建议：${weather.nightTitle.replace("今晚", "")}` : isHardwareActive() ? "今晚建议：保持熟悉的节奏" : "今晚可选：手动选择公共内容";
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal widget-modal"><div class="modal-title-row"><div><span class="modal-eyebrow">DESKTOP WIDGET</span><h2>桌面小组件预览</h2></div><button class="text-button" data-action="close-modal">关闭</button></div><section class="widget-preview"><div class="widget-heading"><img src="${HALO_SYMBOL}" alt=""><span>BODY WEATHER</span></div><strong>${esc(bodyWeather)}</strong><div class="widget-status"><i class="${esc(state.deviceStatus)}"></i><span>戒指${esc(connectionLabel)}</span></div><p>${esc(tonight)}</p></section>${notice("隐私边界", "小组件只显示 Body Weather、戒指连接状态和今晚建议，不显示心率、HRV、血氧、温度或其他敏感健康数值。", "sage")}${buttons([["添加到桌面", "widget-add", "primary"], ["暂不添加", "close-modal", "secondary"]])}</section></div>`;
  }
  function showWidgetAdded() {
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal widget-modal"><div class="modal-title-row"><div><span class="modal-eyebrow">DESKTOP WIDGET</span><h2>小组件已准备好</h2></div><button class="text-button" data-action="close-modal">关闭</button></div><section class="widget-added-state"><span aria-hidden="true">✓</span><strong>请在系统面板中完成添加</strong><p>接下来可以选择小组件尺寸和桌面位置。</p></section>${notice("保护屏幕隐私", "添加后只显示 Body Weather、戒指连接状态和今晚建议。", "sage")}${buttons([["完成", "close-modal", "primary"], ["返回预览", "widget-preview", "secondary"]])}</section></div>`;
  }
  function showRecordDetail(label) {
    const meta = SUBJECTIVE_RECORD_META[label];
    if (!meta || !state.subjectiveMarkers.includes(label)) return;
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal record-detail-modal"><div class="modal-title-row"><div><span class="modal-eyebrow">USER RECORD</span><h2>${esc(label)}记录</h2></div><button class="text-button" data-action="close-modal">关闭</button></div>${rows([["记录时间", `${meta.date} ${meta.time}`], ["记录来源", "用户记录"]])}<section class="user-record-original"><span>用户原话</span><p>${esc(meta.original)}</p></section>${notice("解释边界", "可能相关，仅供回看；记录不会改写原始测量值，也不表示因果。", "sage")}${buttons([["知道了", "close-modal", "primary"]])}</section></div>`;
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
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal membership-rules-modal commerce-boundary-modal"><div class="modal-title-row"><div><span class="modal-eyebrow">HALO SERVICES</span><h2>商城、推荐与体验顾问</h2></div><button class="text-button" data-action="close-modal">关闭</button></div>${rows([["Halo Select", "浏览精选商品、订单与售后"], ["会员推荐", "邀请朋友并查看奖励进度"], ["体验顾问", "先提交申请；身份生效后才能查看服务订单、收益和经营工具"]])}${notice("一个订单只确认一种来源", "支付前由用户确认品牌直营、会员好友推荐或 Halo 体验顾问；会员推荐奖励与体验顾问服务收益不会同时产生。", "sage")}${notice("每项选择都需单独确认", "参加活动、接收消息和确认订单来源互不关联。")} ${buttons([["进入 Halo Select", "go:SEL-01", "primary"], ["会员推荐", "go:REF-01", "secondary"], ["查看体验顾问申请与经营", "go:CHN-01", "secondary"]])}</section></div>`;
  }
  function showAccountDeletionConfirm() {
    trackPrototypeEvent("account_deletion_started", { entry_point: "ACC-03" });
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal account-deletion-modal"><span class="modal-eyebrow">FINAL CONFIRMATION</span><h2>确认提交账号注销？</h2><p>能立即完成的部分会马上处理；需要人工核对时，最长不超过 15 个工作日。再次注册将从 L1 开始，原会员资产不会恢复。</p>${buttons([["确认提交注销", "account-deletion-confirm", "danger-button"], ["返回检查资产", "close-modal", "secondary"]])}</section></div>`;
  }
  function accountDeletionPage(item) {
    if (state.accountDeletionStatus === "submitted") {
      return `${head(item, "DELETE ACCOUNT")}<div class="stack"><section class="deletion-result"><span>REQUEST RECEIVED</span><h2>注销申请已受理</h2><p>可以立即完成的部分已经开始处理；需要人工核对时，最长不超过 15 个工作日。</p></section>${rows([["申请状态", "处理中"], ["会员等级与资产", "已停止使用，不可提现或转让"], ["订单、退款与售后", "仍会继续处理"], ["健康及会员数据", "删除或匿名化"], ["必须保留的交易记录", "只用于履约与合规"], ["再次注册", "从 Halo Member（L1）开始"]])}${notice("同时拥有体验顾问身份？", "会员账号注销不会自动结束渠道合作，请在体验顾问中心单独处理。")}${buttons([["联系客服查看进度", "go:HELP-03", "primary"], ["返回账号与安全", "go:ACC-02", "secondary"]])}</div>`;
    }
    return `${head(item, "DELETE ACCOUNT")}<div class="stack">${notice("注销前请确认将失效的资产", "未完成的订单、退款、售后或申诉不会阻止你提交注销；提交后这些事项仍会继续处理。", "danger")}<section class="asset-snapshot"><span>ASSET SNAPSHOT</span><h2>注销资产快照</h2>${rows([["会员等级", "Halo Premier（L2）"], ["HALO成长值", "18,600"], ["徽章", "4 枚"], ["Halo Points", "18,800"], ["优惠券", "2 张"], ["未使用权益", "1 项 Studio 体验权益"]])}</section>${notice("注销后会怎样", "以上资产将失效，不可提现或转让。健康及会员数据会删除或匿名化；法律要求保留的记录只用于履约与合规。再次注册将从 Halo Member（L1）开始。")}${buttons([["提交注销申请", "account-deletion-submit", "danger-button"], ["取消", "go:ACC-02", "secondary"]])}</div>`;
  }
  function showSupportHandoff() {
    trackPrototypeEvent("customer_service_handoff_started", { channel: "enterprise-wechat", ticket_transport: "reference-only" });
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal service-ticket-modal"><div class="modal-title-row"><div><span class="modal-eyebrow">CUSTOMER CARE</span><h2>准备联系企业微信客服</h2></div><button class="text-button" data-action="close-modal">关闭</button></div>${rows([["客服渠道", "企业微信"], ["可协助处理", "会员、订单、设备、权益与售后问题"], ["不会随跳转发送", "健康数据、Halo 对话和其他敏感信息"]])}${notice("联系后仍由你决定提供什么", "客服只会在处理问题所需的范围内向你询问信息。", "sage")}${buttons([["查看企业微信联系指引", "support-instructions", "primary"], ["取消", "close-modal", "secondary"]])}</section></div>`;
  }
  function closeModal() { modalRoot.innerHTML = ""; }
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
    return `<header class="screen-head"><div>${back}<span class="eyebrow">${esc(eyebrow || item.group)}</span><h1>${esc(item.name)}</h1></div><div class="head-actions">${deviceAction}${action || ""}</div></header>`;
  }
  function card(title, body, meta, action) {
    const tag = action ? "button" : "section";
    return `<${tag} class="card${action ? " card-button" : ""}"${action ? ` data-action="${esc(action)}"` : ""}><div class="card-top"><span>${esc(meta || "HALO")}</span>${action ? "<strong>›</strong>" : ""}</div><h3>${esc(title)}</h3>${body ? `<p>${esc(body)}</p>` : ""}</${tag}>`;
  }
  function notice(title, body, tone) { return `<section class="notice ${tone || ""}"><strong>${esc(title)}</strong><p>${esc(body)}</p></section>`; }
  function metrics(items) { return `<div class="${items.length === 3 ? "three-column" : "two-column"}">${items.map(([label, value, sub]) => `<section class="metric-card"><small>${esc(label)}</small><b>${esc(value)}</b><span>${esc(sub || "")}</span></section>`).join("")}</div>`; }
  function rows(items) { return `<section class="card">${items.map(([label, value]) => `<div class="status-row"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join("")}</section>`; }
  function buttons(items) { return `<div class="button-row">${items.map(([label, action, kind = "secondary", disabled = false]) => `<button class="${kind}" data-action="${esc(action)}" ${disabled ? "disabled" : ""}>${esc(label)}</button>`).join("")}</div>`; }
  function setting(title, detail, action, value) { return `<button class="setting-row" data-action="${esc(action)}"><div><strong>${esc(title)}</strong><span>${esc(detail || "")}</span></div><i>${esc(value || "›")}</i></button>`; }
  function toggle(key, title, detail) { return `<section class="setting-row"><div><strong>${esc(title)}</strong><span>${esc(detail || "")}</span></div><button class="switch ${state.toggles[key] ? "on" : ""}" data-action="toggle:${esc(key)}" aria-label="切换${esc(title)}"></button></section>`; }
  function choice(key, value, title, body) { return `<button class="choice-row ${state[key] === value ? "selected" : ""}" data-action="choose:${esc(key)}:${esc(value)}"><span><strong>${esc(title)}</strong><p>${esc(body)}</p></span><i></i></button>`; }
  function quality(source = "Halo Ring", qualityText = "数据可用", updated = "08:42 更新") { return `<button class="quality-strip" data-action="info:data-quality" aria-label="查看数据来源、质量和更新时间"><div><span>来源</span><strong>${esc(source)}</strong></div><div><span>质量</span><strong>${esc(qualityText)}</strong></div><div><span>时间</span><strong>${esc(updated)}</strong></div></button>`; }
  function lifecycle(stage = state.dataLifecycle, title = "当前数据状态", override = {}) {
    const data = { ...(DATA_LIFECYCLE[stage] || DATA_LIFECYCLE.interpretable), ...override };
    const stages = Object.entries(DATA_LIFECYCLE);
    return `<section class="lifecycle-card"><div class="lifecycle-heading"><span>DATA STATUS</span><strong>${esc(title)}</strong><b>${esc(data.label)}</b></div><div class="lifecycle-summary"><span class="data-symbol ${esc(stage)}" aria-hidden="true"><img src="${HALO_SYMBOL}" alt=""></span><p>${esc(data.reason)}</p></div><div class="lifecycle-track">${stages.map(([key, value]) => `<button class="${stage === key ? "active" : ""}" data-action="lifecycle:${key}" title="${esc(value.label)}"><i></i><span>${esc(value.label)}</span></button>`).join("")}</div><dl><div><dt>为什么是这个状态</dt><dd>${esc(data.reason)}</dd></div><div><dt>还需要</dt><dd>${esc(data.needed)}</dd></div><div><dt>现在可以做什么</dt><dd>${esc(data.next)}</dd></div></dl></section>`;
  }
  function isHardwareActive() { return state.membershipHardwareState === "active"; }
  function setMembershipState(value) {
    if (!MEMBERSHIP_STATES.includes(value)) return;
    state.membershipHardwareState = value;
    localStorage.setItem(MEMBERSHIP_STATE_KEY, value);
    if (value !== "active") {
      state.deviceStatus = "disconnected";
      state.toggles.haloBody = false;
      state.haloContext = "none";
      state.chat = [];
      state.studioMode = "basic";
      state.toggles.studioHealth = false;
    } else if (state.deviceStatus === "disconnected") {
      state.deviceStatus = "connected";
      state.toggles.haloBody = true;
      state.haloContext = "body";
    }
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
    return `<div class="subjective-markers">${SUBJECTIVE_OPTIONS.map((label) => `<button class="${state.subjectiveMarkers.includes(label) ? "active" : ""}" data-action="marker:${esc(label)}" aria-pressed="${state.subjectiveMarkers.includes(label)}">${esc(label)}</button>`).join("")}</div><p class="caption">保存后会标注为“用户记录”，并显示在趋势中。它不会改动设备数据，也不表示因果。</p>`;
  }
  function trendRecordNodes(days) {
    if (!state.toggles.trendRecords) return "";
    const records = state.subjectiveMarkers
      .map((label) => [label, SUBJECTIVE_RECORD_META[label]])
      .filter(([, meta]) => meta && meta.daysAgo <= days);
    if (!records.length) return `<div class="trend-record-empty">这段时间还没有用户记录</div>`;
    return `<div class="trend-record-overlay" aria-label="趋势中的用户记录">${records.map(([label, meta]) => {
      const position = Math.max(4, Math.min(96, ((days - meta.daysAgo) / days) * 100));
      return `<button class="trend-record-node" style="left:${position}%" data-action="record-detail:${esc(label)}" title="${esc(`${meta.date} ${meta.time} · ${label}`)}"><i></i><span>${esc(label)}</span></button>`;
    }).join("")}</div>`;
  }
  function trendRecordControl(days) {
    return `${toggle("trendRecords", "用户记录", "在趋势图中显示你主动添加的记录")}${state.toggles.trendRecords ? `<p class="trend-record-caption">记录只表示同时出现，不代表它导致了趋势变化。点击可查看时间和原话。</p>` : ""}`;
  }
  function retainedUserRecords() {
    const content = state.subjectiveMarkers.length
      ? `<div class="retained-records">${state.subjectiveMarkers.map((label) => `<span>${esc(label)}<small>用户记录</small></span>`).join("")}</div>`
      : notice("暂无用户记录", "可以补充情绪、疲惫、饮酒、晚睡或经期不适；记录不依赖硬件绑定。", "sage");
    return `${content}<div class="record-editor"><span class="section-label">补充今天的感受</span>${subjectiveMarkers()}</div>`;
  }
  function monthlyReport() {
    return `<section class="monthly-report"><div class="monthly-report-head"><div><span>MONTHLY REPORT</span><h3>8 月状态月报</h3></div><strong>覆盖 87%</strong></div>${rows([["有效佩戴", "26 / 30 天"], ["有效夜晚", "24 / 30 晚"], ["相比上个 30 天", "覆盖 +3 天 · 状态更稳定"]])}<div class="monthly-changes"><span class="section-label">主要变化摘要 · 3 条</span><ol><li>睡眠连续性比上一窗口更稳定，波动主要集中在月初。</li><li>缓行日多出现在日间压力信号较高的一周，也常与“疲惫、晚睡”记录同时出现。</li><li>修复日后的第二天，状态较前一日更平稳；这只是同期变化，不表示因果。</li></ol></div><p class="caption">4 天因佩戴中断或关键时段缺口未纳入解释；摘要不展示敏感单次健康数值，也不宣称记录与变化存在因果。</p></section>`;
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
    const data = DATA_LIFECYCLE[state.dataLifecycle] || DATA_LIFECYCLE.none;
    return `<section class="empty-health-data"><span class="data-symbol ${esc(state.dataLifecycle)}" aria-hidden="true"><img src="${HALO_SYMBOL}" alt=""></span><strong>${esc(data.label)}</strong><p>${esc(data.reason)}</p><small>${esc(data.needed)} · ${esc(data.next)}</small></section>`;
  }
  function dataStageActions(stage) {
    if (stage === "limited") return [["重新同步", "toast:已开始重新同步", "primary"], ["查看设备状态", "go:DEV-10", "secondary"]];
    if (stage === "baseline") return [["查看数据进度", "go:TOD-11", "primary"], ["记录今天的感受", "go:TOD-02", "secondary"]];
    return [["查看佩戴与同步", "go:DEV-10", "primary"], ["记录今天的感受", "go:TOD-02", "secondary"]];
  }
  function healthDetail(item, config) {
    if (!isHardwareActive()) return unboundHealthDetail(item);
    const stage = state.dataLifecycle;
    const dataState = DATA_LIFECYCLE[stage] || DATA_LIFECYCLE.interpretable;
    const canInterpret = stage === "interpretable";
    const canShowMeasuredData = stage !== "none";
    const conclusion = canInterpret ? config.conclusion : dataState.headline;
    const summary = canInterpret ? config.summary : dataState.summary;
    const why = canInterpret ? config.why : dataState.reason;
    const dataContent = canShowMeasuredData ? config.data : emptyHealthData();
    const trendContent = ["none", "accumulating"].includes(stage)
      ? notice("趋势还没形成", `${dataState.needed}。继续正常佩戴，完成同步后会自动更新。`)
      : `${segmented([["7", "7 天"], ["14", "14 天"], ["30", "30 天"]], state.trendPeriod, "trend")}${config.trend}`;
    const currentActions = canInterpret ? config.actions : dataStageActions(stage);
    return `${head(item, config.eyebrow)}<article class="unified-health-detail" data-detail-page="${esc(item.id)}"><section class="detail-conclusion ${canInterpret ? "ready" : esc(stage)}"><span>${esc(dataState.label)}</span><h2>${esc(conclusion)}</h2><p>${esc(summary)}</p></section>${detailSection("为什么这样", `<p>${esc(why)}</p>${canInterpret ? config.reasonExtra || "" : ""}`)}${detailSection("关键数据", dataContent)}${detailSection("个人基线与趋势", trendContent)}${detailSection("数据质量与来源", `${lifecycle(stage, config.lifecycleTitle, config.lifecycleOverride)}${quality(config.source, config.quality, config.updated)}<p class="source-priority">Halo Ring 是主要来源；已授权的其他来源会单独标注，同一时段不会重复计算。</p>`)}${detailSection("补充今天的感受", subjectiveMarkers(), "subjective-section")}${detailSection("今天能做什么", `${notice(canInterpret ? config.actionTitle : dataState.next, canInterpret ? config.actionBody : dataState.needed, "sage")}${buttons(currentActions)}`, "detail-action")}</article><p class="health-boundary">用于日常健康管理参考，不替代医疗诊断或专业医疗建议。</p>`;
  }
  function unboundHealthDetail(item) {
    const copy = membershipCopy();
    const retained = state.membershipHardwareState === "unbound-retained";
    return `${head(item, "MEMBER MODE")}<article class="unified-health-detail unbound-detail"><section class="detail-conclusion unbound"><span>${esc(copy.label)}</span><h2>这里还没有身体数据</h2><p>没有足够数据时，Halo 不会给出猜测结论。</p></section>${detailSection("为什么还没有", `<p>${retained ? "当前没有已激活的 Halo Ring。历史会员资产和记录仍在，新的身体数据与成长暂时停止。" : "你已经是 Halo Member。绑定并激活 Halo Ring 后，才会开始记录身体数据。"}</p>`)}${detailSection("已保留的用户记录", retainedUserRecords(), "retained-user-records")}${detailSection("现在仍可使用", `<ul class="availability-list"><li>会员、Halo Points、商城、订单、推荐与客服</li><li>不读取身体数据的 Halo 对话，每日最多发送 10 条消息</li><li>手动节律、情绪和睡眠感受记录</li><li>Studio 浏览、预约与基础参与</li><li>3 项基础睡前内容</li></ul>`)}${detailSection("激活 Halo Ring 后", `<ul class="availability-list"><li>查看 Body Weather 和健康数据详情</li><li>使用个性化夜间建议、入睡渐弱与次日解释</li><li>查看 7 / 14 / 30 天趋势和身体报告</li><li>开始会员任务、HALO成长值、徽章和升级</li></ul>`)}${detailSection("现在可以做什么", buttons([[retained ? "重新绑定 Halo Ring" : "绑定 Halo Ring", "go:DEV-01", "primary"], ["使用基础睡前内容", "go:NIG-01", "secondary"]]), "detail-action")}</article>`;
  }
  function unboundToday(item) {
    return `${head(item, "TODAY · MEMBER MODE")}<div class="stack"><button class="body-weather unbound-weather" data-action="go:TOD-03"><img class="weather-symbol" src="${HALO_SYMBOL}" alt=""><span class="label">BODY WEATHER · 身体天气</span><h2>还没有今天的 Body Weather</h2><p>绑定并激活 Halo Ring 后，完成有效佩戴就会在这里出现。</p></button><div class="three-column"><button class="signal-card" data-action="go:TOD-05"><span>睡眠恢复</span><strong>等待设备数据</strong><i></i></button><button class="signal-card" data-action="go:TOD-06"><span>身体能量</span><strong>等待设备数据</strong><i></i></button><button class="signal-card" data-action="go:TOD-07"><span>活动安排</span><strong>先按身体感受</strong><i></i></button></div>${buttons([[state.membershipHardwareState === "unbound-retained" ? "重新绑定 Halo Ring" : "绑定 Halo Ring", "go:DEV-01", "primary"]])}${setting("记录今天的感受", state.subjectiveMarkers.length ? `已保留 ${state.subjectiveMarkers.length} 项用户记录` : "不需要绑定设备", "go:TOD-02")}${dailyInspirationCard()}${card("今晚可选", "可以手动选择 3 项基础睡前内容。", "PUBLIC CONTENT", "go:NIG-01")}${setting("Halo", "不读取身体数据 · 今日可发送 10 条消息", "go:HAL-01")}${setting("Halo Studio", "浏览、预约与基础参与", "go:STU-08")}</div>`;
  }
  function unboundNight(item) {
    return `${head(item, "PUBLIC NIGHT")}<div class="night-screen"><section class="night-hero"><span>HALO MEMBER</span><h2>今晚可手动选择</h2><p>这些基础内容不读取身体数据，由你自行选择和播放。</p></section><div class="stack public-night-list">${setting("5 分钟睡前呼吸", "手动播放 · 5 分钟", "public-play:睡前呼吸")}${setting("10 分钟身体扫描", "手动播放 · 10 分钟", "public-play:身体扫描")}${setting("15 分钟安睡音频", "手动播放 · 15 分钟", "public-play:安睡音频")}${notice("基础内容说明", "仅支持手动播放和计时，完成后不计入会员任务或奖励。绑定 Halo Ring 后，才能使用入睡检测和个性化夜间建议。")}</div></div>`;
  }
  function dailyInspirationCard() {
    if (!state.toggles.inspiration) return "";
    return `<section class="daily-inspiration"><div class="inspiration-heading"><div><span>DAILY HALO</span><h3>今日灵感</h3></div><button class="inspiration-info" data-action="info:inspiration" aria-label="了解今日灵感">i</button></div><div class="inspiration-keyword"><span>今日关键词</span><strong>${esc(DAILY_INSPIRATION.keyword)}</strong></div><p>${esc(DAILY_INSPIRATION.message)}</p><span class="daily-cues-label">今日小线索 · DAILY CUES</span><div class="daily-cues"><div class="daily-cue"><span class="cue-swatch" aria-hidden="true"></span><span class="daily-cue-copy"><small>今日色彩</small><strong>${esc(DAILY_INSPIRATION.color)}</strong></span></div><div class="daily-cue"><span class="cue-number">${esc(DAILY_INSPIRATION.number)}</span><span class="daily-cue-copy"><small>今日数字</small><strong>保持简单</strong></span></div></div><div class="inspiration-action"><small>轻行动</small><strong>${esc(DAILY_INSPIRATION.action)}</strong></div><button class="inspiration-link" data-action="open-inspiration">和 Halo 聊聊 <span>›</span></button><small class="inspiration-disclaimer">文化灵感内容，仅作自我探索参考</small></section>`;
  }
  function haloContextPanel() {
    if (state.haloContext === "inspiration") {
      return `<button class="context-pill inspiration-context" data-action="switch-halo-context:body">我正在参考：今日灵感 · 文化内容　×</button>${notice(`今日关键词：${DAILY_INSPIRATION.keyword}`, DAILY_INSPIRATION.message, "sage")}<div class="suggestions"><button data-action="ask:今天适合关注什么？">今天适合关注什么？</button><button data-action="ask:给我一个轻行动">给我一个轻行动</button><button data-action="ask:换个角度看看">换个角度看看</button><button data-action="switch-halo-context:body">回到身体状态</button></div>`;
    }
    if (state.haloContext === "rhythm") {
      return `<button class="context-pill" data-action="remove-halo-context">我正在参考：节律记录、近 7 天睡眠与身体能量　×</button>${notice("把这段变化放在一起看", "节律阶段、睡眠和能量变化可能同时出现，但不能单独解释你的感受。", "rose")}<div class="suggestions"><button data-action="ask:这段变化里有哪些线索？">这段变化里有哪些线索？</button><button data-action="ask:今晚可以怎样照顾自己？">今晚可以怎样照顾自己？</button><button data-action="ask:先听我说说感受">先听我说说感受</button></div>`;
    }
    if (state.haloContext === "feeling" && state.haloFeeling) {
      return `<button class="context-pill" data-action="remove-halo-context">我正在参考：你的用户记录 · ${esc(state.haloFeeling)}　×</button>${notice("这次感受已带入", "它会和设备数据分开显示，只表示你此刻的记录。", "sage")}`;
    }
    if (!state.toggles.haloBody || state.haloContext === "none") {
      return `${notice("这次对话不参考身体状态", "你仍可以聊感受、安排和通用的放松方法；需要时可在数据与隐私中重新允许。", "sage")}<div class="suggestions"><button data-action="ask:陪我梳理今天的安排">陪我梳理今天的安排</button><button data-action="ask:给我一个通用的放松练习">给我一个通用的放松练习</button><button data-action="ask:先听我说一会儿">先听我说一会儿</button></div>`;
    }
    const weather = currentBodyWeather();
    const canInterpret = state.dataLifecycle === "interpretable";
    const dataState = DATA_LIFECYCLE[state.dataLifecycle] || DATA_LIFECYCLE.none;
    return `<button class="context-pill" data-action="remove-halo-context">我正在参考：今日 Body Weather · 08:42 更新　×</button>${notice(canInterpret ? weather.homeTitle : dataState.headline, canInterpret ? weather.homeBody : dataState.summary, "sage")}<div class="suggestions">${canInterpret ? `<button data-action="ask:哪些信号与今天的状态有关？">哪些信号与今天的状态有关？</button><button data-action="ask:今天适合怎样安排活动？">今天适合怎样安排活动？</button><button data-action="ask:今晚怎样更安静地休息？">今晚怎样更安静地休息？</button>` : `<button data-action="ask:还需要哪些记录？">还需要哪些记录？</button><button data-action="ask:怎样让记录更完整？">怎样让记录更完整？</button><button data-action="ask:今天先按什么节奏安排？">今天先按什么节奏安排？</button>`}<button data-action="ask:先听我说一会儿">先听我说一会儿</button></div>`;
  }
  function segmented(options, selected, prefix) {
    return `<div class="segmented">${options.map(([value, label]) => `<button class="${String(selected) === String(value) ? "active" : ""}" data-action="${esc(prefix)}:${esc(value)}">${esc(label)}</button>`).join("")}</div>`;
  }
  function education(title, body, action = "info:education") {
    return `<button class="education-row" data-action="${esc(action)}"><span>了解这个功能</span><strong>${esc(title)}</strong><p>${esc(body)}</p><i>阅读 ›</i></button>`;
  }
  function firmwarePanel() {
    const status = {
      available: ["发现新版本 1.1.0", "当前 1.0.8 · 更新约 4 分钟", "开始更新", "firmware:downloading"],
      downloading: ["正在下载固件", "46% · 请保持戒指与手机在 1 米内", "继续到校验", "firmware:verifying"],
      verifying: ["正在校验并安装", "请勿关闭 App 或移开戒指", "完成安装", "firmware:current"],
      current: ["固件已是最新", "1.1.0 · 刚刚完成校验", "再次检查", "firmware:available"],
      failed: ["更新未完成", "连接中断，戒指仍可使用当前版本", "重新尝试", "firmware:downloading"],
    }[state.firmwareStatus] || ["固件状态未知", "稍后再试", "重新检查", "firmware:available"];
    return `<section class="firmware-panel ${esc(state.firmwareStatus)}"><span>FIRMWARE</span><h2>${esc(status[0])}</h2><p>${esc(status[1])}</p>${state.firmwareStatus === "downloading" ? '<div class="progress"><i style="width:46%"></i></div>' : ""}<button class="secondary" data-action="${esc(status[3])}">${esc(status[2])}</button>${state.firmwareStatus !== "failed" ? '<button class="text-button" data-action="firmware:failed">更新没完成？</button>' : ""}</section>`;
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
    const photo = state.shareBackground === "photo" ? `<img class="share-photo" src="${esc(state.sharePhotoUrl || "assets/ring-cover.jpg")}" alt="分享卡背景">` : "";
    const weather = currentBodyWeather();
    const canInterpret = state.dataLifecycle === "interpretable";
    const dataState = DATA_LIFECYCLE[state.dataLifecycle] || DATA_LIFECYCLE.none;
    return `<section class="share-card ${esc(state.shareBackground)} ${esc(extraClass)}"><div class="share-card-scale" style="transform:scale(${Math.max(80, Math.min(125, Number(state.shareZoom) || 100)) / 100})">${photo}<div class="share-card-content"><img src="${HALO_SYMBOL}" alt=""><span>HALO BODY WEATHER</span><h2>${esc(canInterpret ? weather.label : dataState.label)}</h2><p>${esc(canInterpret ? weather.shareLine : dataState.summary)}</p><small>HALORING · 每日身体状态参考</small></div></div></section>`;
  }
  function showSharePreview() {
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal share-preview-modal"><div class="modal-title-row"><h2>分享预览</h2><button class="text-button" data-action="close-modal">关闭</button></div>${shareCard("preview")}${notice("隐私已保护", "分享卡不会显示心率、HRV、血氧、温度或其他敏感健康数值。", "sage")}<div class="button-row"><button class="primary" data-action="share-system">分享</button><button class="secondary" data-action="share-save">保存图片</button></div></section></div>`;
  }
  function lineChart(kind = "sage") { return `<svg viewBox="0 0 320 118" role="img" aria-label="趋势图"><path class="grid-line" d="M0 24H320M0 59H320M0 94H320"/><path class="area" d="M0 80 C36 72 47 42 82 50 S134 90 169 63 S220 34 252 53 S291 77 320 38 V118 H0Z"/><path class="plot ${kind}" d="M0 80 C36 72 47 42 82 50 S134 90 169 63 S220 34 252 53 S291 77 320 38"/></svg>`; }
  function chartCard(title, summary, kind) { return `<section class="chart-card"><div class="data-heading"><strong>${esc(title)}</strong><span>${esc(summary)}</span></div>${lineChart(kind)}</section>`; }
  function generic(item) {
    return head(item, item.group) + `<div class="stack">${notice("本页任务", item.function || item.note, "sage")}${card("页面内容", item.layout || item.note, item.id)}${rows([["主要交互", item.interaction], ["数据与状态", item.data], ["异常处理", item.exception]])}${buttons([["完成并继续", nextId(item.id), "primary"], ["返回上一页", "previous", "secondary"]])}</div>`;
  }
  function nextId(id) { const index = pages.findIndex((item) => item.id === id); return `go:${pages[Math.min(index + 1, pages.length - 1)]?.id || id}`; }
  function previousId(id) { const index = pages.findIndex((item) => item.id === id); return pages[Math.max(0, index - 1)]?.id || id; }

  function firstUse(item) {
    if (item.id === "SYS-01") return `<div class="gated system-loading">${haloStatus("syncing", "hero", "status-detail")}<h1>HALO RING</h1><p class="caption">正在恢复你的状态</p><div class="progress" style="margin-top:26px"><i style="width:68%"></i></div></div>${buttons([["查看首次使用流程", "go:ONB-01", "secondary"], ["进入今日", "go:TOD-01", "primary"]])}`;
    if (item.id === "ONB-01") return `<div class="studio-cover" style="min-height:310px"><span>HALO RING</span><h2>先听懂身体，再决定如何对待自己</h2><p>帮助女性理解睡眠、压力与身体节律的智能戒指。</p></div><div class="stack" style="margin-top:12px">${notice("健康与 AI 边界", "状态解释用于日常健康管理参考，不替代医疗诊断。")}${buttons([["开始使用", "go:AUTH-01", "primary"], ["已有账号", "go:AUTH-01", "text-button"]])}</div>`;
    if (item.id === "AUTH-01") return head(item, "WELCOME") + `<div class="stack"><label class="field-label">手机号<input class="field" value="138 0000 0000"></label>${buttons([["获取验证码", "go:AUTH-02", "primary"]])}<p class="caption">继续即代表你已阅读并同意用户协议与隐私政策。</p></div>`;
    if (item.id === "AUTH-02") return head(item, "VERIFY") + `<div class="stack"><p class="caption">验证码已发送至 138 **** 0000</p><input class="field" value="6 8 2 1 0 6" aria-label="验证码">${buttons([["确认登录", "go:LEGAL-01", "primary"], ["54 秒后重新发送", "toast:请稍后再试", "text-button"]])}</div>`;
    if (item.id === "LEGAL-01") return head(item, "CONSENT") + `<div class="stack">${notice("先确认这些边界", "Halo 提供身体状态解释与日常建议，不进行疾病诊断或紧急医疗判断。", "sage")}${toggle("legal", "用户协议与隐私政策", "必需")}${toggle("aiLegal", "AI 服务说明", "可以随时停止带入身体数据")}${buttons([["同意并继续", "go:PERM-01", "primary"]])}</div>`;
    if (item.id === "PERM-01") return head(item, "PERMISSIONS") + `<div class="stack">${toggle("bluetooth", "蓝牙", "连接戒指与同步数据")}${toggle("notification", "通知", "睡前、唤醒与报告提醒")}${toggle("healthAccess", "健康数据", "仅在你授权后读取或写入")}${notice("可以稍后连接戒指", "你已经是 Halo Member，可以先进入 App。激活 Halo Ring 后，再开始记录身体数据和会员成长。", "sage")}${buttons([["连接 Halo Ring", "member-state:active:DEV-01", "primary"], ["暂不连接，进入 App", "member-state:never-bound:TOD-01", "secondary"]])}</div>`;
    if (item.id === "ONB-02") return `${head(item, "BODY WEATHER")}<div class="stack"><section class="body-weather" style="min-height:210px"><span class="label">BODY WEATHER · 数据积累中</span><h2>Body Weather 正在建立</h2><p>已完成 3 / 7 个有效佩戴日，还差 4 个。继续按平时的节奏佩戴即可。</p></section>${lifecycle("accumulating", "Body Weather 数据状态")}${notice("下一次同步后自动更新", "不用为了数据刻意改变作息；已有记录会保留。", "sage")}${buttons([["查看佩戴与同步", "go:DEV-10", "primary"], ["先进入今日", "go:TOD-01", "secondary"]])}</div>`;
    return generic(item);
  }

  function device(item) {
    if (item.id === "DEV-10" && !isHardwareActive()) {
      const copy = membershipCopy();
    return `${head(item, "MY RING")}<div class="stack"><section class="device-empty-state">${haloStatus("disconnected", "hero", "status-detail")}<h2>${esc(copy.device)}</h2><p>${state.membershipHardwareState === "unbound-retained" ? "设备历史和会员资产仍保留；重新绑定并激活后只恢复未来成长。" : "绑定并激活 Halo Ring 后，才会显示设备数据和健康功能。"}</p></section>${buttons([[copy.action, "go:DEV-01", "primary"]])}${notice("设备数据尚未开始", "绑定前不会显示电量、最后连接、固件或健康数据。")}</div>`;
    }
    const map = {
      "DEV-01": () => `${head(item, "YOUR RING")}<div class="gated device-hero">${haloStatus("disconnected", "hero", "status-detail")}<h2>连接你的 Halo Ring</h2><p class="caption">打开蓝牙，并将戒指放在手机附近。暂时断连不会影响已经保存的数据。</p></div>${buttons([["开始查找", "device-status:connecting", "primary"], ["连接帮助", "go:HELP-01", "secondary"]])}`,
      "DEV-02": () => `${head(item, "SEARCHING")}<div class="stack">${haloStatus("connecting", "hero", "status-detail")}${notice("已发现 2 枚戒指", "请根据设备尾号确认，系统配对请求会在选择后出现。", "sage")}${setting("HALO RING · 7A21", "信号良好", "go:DEV-03", "选择")}${setting("HALO RING · 81C4", "信号较弱", "toast:请将戒指靠近手机", "选择")}${buttons([["重新扫描", "device-status:connecting", "secondary"]])}</div>`,
      "DEV-03": () => `${head(item, "BIND")}<div class="stack">${haloStatus("connecting", "hero", "status-detail")}${rows([["设备", "HALO RING · 7A21"], ["账号", "138 **** 0000"], ["系统配对", "等待确认"]])}${notice("完成系统配对", "确认系统蓝牙弹窗后，Halo 才会完成账号绑定。取消不会清除手机或戒指内已有记录。", "sage")}${buttons([["已完成系统配对", "go:DEV-04", "primary"], ["返回选择", "go:DEV-02", "secondary"]])}</div>`,
      "DEV-04": () => `${head(item, "HOW TO WEAR")}<div class="stack"><section class="wearing-guide"><div class="wearing-orbit">${haloStatus("connected", "compact", "status-detail")}</div><ol><li><strong>贴近指腹</strong><span>内侧传感器稳定接触指腹中间，不需要额外勒紧。</span></li><li><strong>方向稳定</strong><span>让内侧标记朝向掌心，夜间与日常都保持同一方向。</span></li><li><strong>清洁干燥</strong><span>洗手或运动后擦干戒指内侧，再继续佩戴即可。</span></li></ol></section>${buttons([["我已佩戴好", "go:DEV-05", "primary"]])}</div>`,
      "DEV-05": () => `${head(item, "FIRST SYNC")}<div class="stack">${haloStatus("syncing", "hero", "status-detail")}${metrics([["同步进度", "72%", "预计还需 1 分钟"]])}<div class="progress"><i style="width:72%"></i></div>${rows([["设备信息", "已完成"], ["最近记录", "同步中"], ["能力确认", "等待中"]])}${buttons([["完成同步并激活", "activate-hardware", "primary"], ["稍后继续", "go:TOD-01", "secondary"]])}</div>`,
      "DEV-10": () => `${head(item, "MY HALO HARDWARE")}<div class="stack">${haloStatus(state.deviceStatus, "hero", "status-detail")}${segmented([["connected","已连接"],["connecting","连接中"],["syncing","同步中"],["disconnected","未连接"],["low","低电量"],["action","需处理"]], state.deviceStatus, "device-status")}${rows([["当前设备", "HALO RING · 7A21"], ["同账号设备", "2 款 · 可分别管理"], ["电量", state.deviceStatus === "low" ? "18%" : "76%"], ["最后连接", state.deviceStatus === "connecting" ? "正在尝试" : "今天 08:42"], ["连接手机", "本机 iPhone"], ["最后同步", state.deviceStatus === "syncing" ? "正在更新" : "08:43"]])}${notice("多款设备不会重复奖励", "同一账号完成同一项通用任务，只记录一次 HALO成长值、Halo Points 和徽章进度。设备专属任务会在活动页单独说明。", "sage")}${quality("HALO RING · 7A21", deviceQualityLabel(state.deviceStatus), state.deviceStatus === "syncing" ? "正在更新" : "08:43 更新")}${toggle("location", "最后位置线索", "关闭时不申请位置；开启后仅在戒指与 App 连接时记录手机位置")}${state.toggles.location ? notice("位置已单独授权", "最后线索：今天 08:42 · 静安区附近。它不是实时定位，也不能让戒指响铃或亮灯。", "sage") : buttons([["单独授权位置", "request-location", "secondary"]])}${setting("设备信息与固件", "版本、可用数据与更新状态", "go:DEV-11")}${setting("佩戴引导", "方向与日常护理", "go:DEV-04")}${setting("高级设备操作", "清缓存、重置步数、恢复出厂", "go:DEV-12")}</div>`,
      "DEV-11": () => `${head(item, "DEVICE INFO")}<div class="stack">${rows([["设备名称", "HALO RING · 7A21"], ["电量", "76%"], ["固件版本", state.firmwareStatus === "current" ? "1.1.0" : "1.0.8"], ["硬件版本", "R01"], ["绑定状态", "当前账号"]])}${firmwarePanel()}${card("当前可用数据", "睡眠、心率、HRV、呼吸率与活动；血氧和皮肤温度仅在设备支持且数据可用时显示。", "CAPABILITY")}</div>`,
      "DEV-12": () => `${head(item, "ADVANCED")}<div class="stack">${notice("操作前请确认", "以下操作可能影响戒指内尚未同步的记录或设备设置。每次执行前都会再次确认。", "danger")}${setting("清空戒指缓存", "已同步至手机的数据不会删除", "danger:清空戒指缓存:将删除戒指内尚未同步的原始记录，手机本地历史不受影响。:确认清空")}${setting("重置今日步数", "只重置戒指端今日累计", "danger:重置今日步数:此操作会清零戒指端今天的步数，历史天数据不变。:确认重置")}${setting("恢复出厂设置", "解除绑定并清除戒指端设置", "danger:恢复出厂设置:戒指将解除绑定并清除本机设置。手机本地记录和 Halo 账号不会自动删除。:恢复出厂")}</div>`,
    };
    return map[item.id]?.() || generic(item);
  }

  function todayWeatherHome(item) {
    const weather = currentBodyWeather();
    const canInterpret = state.dataLifecycle === "interpretable";
    const dataState = DATA_LIFECYCLE[state.dataLifecycle] || DATA_LIFECYCLE.none;
    const title = canInterpret ? weather.homeTitle : dataState.headline;
    const body = canInterpret ? weather.homeBody : dataState.summary;
    const signals = canInterpret ? weather.signals : dataState.signals;
    const mainAction = canInterpret ? "查看今天的安排" : "查看数据进度";
    const tonightTitle = canInterpret ? weather.nightTitle : "今晚先按熟悉的节奏";
    const tonightBody = canInterpret ? weather.nightBody : "身体状态还没准备好，可以先选择熟悉的睡前内容。";
    return `${head(item, "WED · 26 AUG")}<div class="stack"><button class="body-weather" data-action="go:TOD-03"><img class="weather-symbol" src="${HALO_SYMBOL}" alt=""><span class="label">BODY WEATHER · ${esc(canInterpret ? `${weather.label} · ${weather.english}` : dataState.label)}</span><h2>${esc(title)}</h2><p>${esc(body)}</p></button><div class="three-column">${signals.map(([label, value], index) => `<button class="signal-card" data-action="go:${["TOD-05", "TOD-06", "TOD-07"][index]}"><span>${esc(label)}</span><strong>${esc(value)}</strong><i></i></button>`).join("")}</div>${buttons([[mainAction, "go:TOD-03", "primary"]])}${dailyInspirationCard()}${card(tonightTitle, tonightBody, canInterpret ? "HALO SUGGESTS" : "TONIGHT", "go:NIG-01")}${setting("健康数据", "心率、呼吸、主动测量、血氧与皮肤温度", "go:HLT-00")}${setting("Halo Studio", "查看预约、扫码或进入最近体验", "go:STU-08")}</div>`;
  }

  function today(item) {
    if (item.id === "TOD-01" && !isHardwareActive()) return unboundToday(item);
    if (["TOD-03", "TOD-04", "TOD-05", "TOD-06", "TOD-07", "TOD-08", "TOD-09", "TOD-10", "TOD-11"].includes(item.id) && !isHardwareActive()) return unboundHealthDetail(item);
    const map = {
      "TOD-01": () => todayWeatherHome(item),
      "TOD-02": () => `${head(item, "QUICK CHECK-IN")}<div class="stack">${notice("此刻更接近哪些感受？", "可多选，只做轻记录，不评价你今天做得好不好。记录在解绑和重新绑定后仍保留。", "sage")}${subjectiveMarkers()}${state.subjectiveMarkers.length ? rows([["已选用户记录", state.subjectiveMarkers.join("、")], ["数据作用", "趋势回看 · 不改写设备数据"]]) : ""}${buttons([["保存并返回", "record-save", "primary"], ["返回今日", "go:TOD-01", "secondary"]])}</div>`,
      "TOD-03": () => healthDetail(item, {
        eyebrow: "BODY WEATHER",
        conclusion: `今天是${currentBodyWeather().label}`,
        summary: currentBodyWeather().detailSummary,
        why: currentBodyWeather().why,
        reasonExtra: setting("压力与放松", `${currentBodyWeather().pressure} · 查看全天时段和质量`, "info:stress"),
        data: rows(currentBodyWeather().signals),
        trend: `${chartCard(`最近 ${state.trendPeriod} 天状态趋势`, currentBodyWeather().trend, "gold")}${setting("查看完整趋势", "7 / 14 / 30 天与月度报告", "go:TOD-04")}`,
        lifecycleTitle: "Body Weather 数据状态",
        source: "Halo Ring（用户记录仅用于趋势对照）",
        quality: "睡眠、能量、活动与日间压力时段可用",
        updated: "07:42 生成",
        actionTitle: currentBodyWeather().actionTitle,
        actionBody: currentBodyWeather().actionBody,
        actions: [["查看今晚建议", "go:NIG-01", "primary"], ["和 Halo 聊聊", "go:HAL-01", "secondary"]],
      }),
      "TOD-04": () => { const days = Number(state.trendPeriod); const bars = days === 30 ? [56,62,52,66,64,71,68,72,69,74] : days === 14 ? [58,63,55,66,61,70,68,72,65,76,71,74,73,78] : [62,48,76,58,83,70,78]; const labels = days === 7 ? ["四","五","六","日","一","二","今"] : bars.map((_,i)=> i === bars.length - 1 ? "今" : `${i+1}`); return `${head(item, `${days} DAY TREND`)}<div class="stack">${segmented([["7","7 天"],["14","14 天"],["30","30 天"]], state.trendPeriod, "trend")}${chartCard("身体天气", `最近 ${days} 天，平衡日和缓行日较多`, "gold")}${trendRecordControl(days)}<div class="trend-chart-wrap"><div class="bar-chart">${bars.map((h,i)=>`<span class="${i===bars.length-1?"active":""}" style="height:${h}%"><i>${labels[i]}</i></span>`).join("")}</div>${trendRecordNodes(days)}</div>${rows(days === 30 ? [["修复日","4 天"],["缓行日","10 天"],["平衡日","11 天"],["活力日","5 天"]] : [["修复日","1 天"],["缓行日",days===14?"5 天":"3 天"],["平衡日",days===14?"6 天":"2 天"],["活力日",days===14?"2 天":"1 天"]])}${days === 30 ? monthlyReport() : ""}${notice("把趋势当作生活参考", "它帮助你回看近期节奏，不代表疾病风险，也不是训练成绩。")}</div>`; },
      "TOD-05": () => healthDetail(item, {
        eyebrow: "LAST NIGHT",
        conclusion: "昨晚时长尚可，连续性仍可改善",
        summary: "昨晚睡眠时长接近你的常见范围，但中途清醒较多，连续性稍弱。",
        why: "总睡眠比个人基线少 36 分钟，夜间清醒 2 次；深睡主要分布在前半夜。",
        data: `${metrics([["总睡眠", "6h 42m", "比基线少 36m"], ["睡眠效率", "86%", "有效夜间"], ["清醒", "34m", "夜醒 2 次"]])}<section class="card"><div class="data-heading"><strong>睡眠阶段</strong><span>23:41 - 07:18</span></div><div class="sleep-timeline"><span class="light" style="flex:3"></span><span class="deep" style="flex:2"></span><span class="light" style="flex:4"></span><span class="rem" style="flex:2"></span><span class="awake" style="flex:.7"></span><span class="light" style="flex:3"></span><span class="rem" style="flex:2"></span></div><p>深睡 1h 14m · REM 1h 36m · 清醒 34m</p></section>`,
        trend: chartCard(`最近 ${state.trendPeriod} 晚`, "连续性逐步趋稳"),
        lifecycleTitle: "睡眠数据状态",
        source: "Halo Ring",
        quality: "昨夜有效记录覆盖 93%",
        updated: "07:22 更新",
        actionTitle: "今晚保持固定上床时间",
        actionBody: "睡前减少高刺激内容，不需要为了补时长提前很多上床。",
        actions: [["进入今晚建议", "go:NIG-01", "primary"], ["调整睡眠目标", "go:SET-02", "secondary"]],
      }),
      "TOD-06": () => healthDetail(item, {
        eyebrow: "BODY ENERGY",
        conclusion: "今天的身体能量仍有余量",
        summary: "结合个人常见范围和连续趋势，看看今天还有多少活动余量。",
        why: "夜间 HRV 接近个人常见范围，静息心率稳定，但睡眠连续性略有不足。",
        data: metrics([["夜间 HRV", "42 ms", "个人基线 39-47"], ["静息心率", "58 bpm", "近 7 天稳定"], ["有效采样", "91%", "已剔除体动"]]),
        trend: chartCard(`最近 ${state.trendPeriod} 天 HRV`, "接近个人基线"),
        lifecycleTitle: "身体能量数据状态",
        source: "Halo Ring",
        quality: "有效采样 91%",
        updated: "07:22 更新",
        actionTitle: "保持日常安排，给强度留弹性",
        actionBody: "可以照常活动；若主观疲惫，高强度训练顺延。",
        actions: [["记录此刻感受", "go:TOD-02", "primary"], ["查看夜间支持", "go:NIG-01", "secondary"]],
      }),
      "TOD-07": () => healthDetail(item, {
        eyebrow: "ACTIVITY FIT",
        conclusion: "今天更适合轻量活动",
        summary: "今天保持轻量活动即可，不需要为了目标数字额外加码。",
        why: "结合近 7 天活动量、昨晚睡眠和今天的身体能量，当前更适合保持轻量活动。",
        data: `${metrics([["步数", "4,862", "日常活动"], ["活动消耗", "284", "千卡"], ["中高强度", "18 分钟", "今日"]])}${rows([["基础消耗", "1,252 千卡"], ["轻强度", "46 分钟"], ["久坐提醒", "1 次"]])}`,
        trend: chartCard(`最近 ${state.trendPeriod} 天活动`, "中低强度为主", "gold"),
        lifecycleTitle: "活动数据状态",
        lifecycleOverride: { needed: "当前已完成 5 / 7 个有效佩戴日；继续积累日间活动记录。", next: "保持日常佩戴，完成同步后会更新活动趋势。" },
        source: "Halo Ring + 手机",
        quality: "去重后覆盖 89%",
        updated: "08:44 更新",
        actionTitle: "选择舒展、散步或轻量瑜伽",
        actionBody: "不需要追求目标数字；高强度训练可以顺延。",
        actions: [["记录完成感受", "go:TOD-02", "primary"], ["查看身体天气", "go:TOD-03", "secondary"]],
      }),
      "TOD-08": () => `${head(item, "LAST NIGHT SUMMARY")}<div class="stack">${notice("昨晚的夜间内容已完成", "系统记录到可能入睡后，音频逐渐变轻，并在 00:18 结束。", "sage")}${rows([["内容", "安静身体扫描 · 12 分钟"], ["渐弱方式", "入睡后渐弱"], ["可能入睡", "00:06"], ["唤醒", "07:12 · 浅睡窗口内"]])}${setting("查看睡眠详情", "阶段、连续性和夜间信号", "go:TOD-05")}${setting("14 晚进度", "已完成 9 个有效夜晚", "go:TOD-09")}</div>`,
      "TOD-09": () => `${head(item, "REPORTS")}<div class="stack"><section class="body-weather" style="min-height:190px"><span class="label">14 NIGHT REPORT · 报告积累中</span><h2>9 / 14 晚</h2><p>7 日个人基线已建立，日常状态已经可以解释；首轮修正报告尚未生成。</p></section>${lifecycle("baseline", "14 晚报告状态", { label: "报告积累中", reason: "7 日个人基线已建立，日常状态已经可以解释；首轮修正报告尚未生成。", needed: "当前 9 / 14 个有效夜晚，还差 5 个。", next: "继续正常夜间佩戴，完成同步后自动更新。" })}${rows([["个人基线", "已建立"], ["报告进度", "9 / 14 晚"], ["有效佩戴", "平均 91%"]])}${chartCard("睡眠与能量变化", "趋势继续积累")}${card("8 月状态月报", "完成 30 天有效趋势后生成；报告解释变化，不堆叠敏感指标。", "30 DAY REPORT", "go:TOD-04")}${buttons([["查看昨夜", "go:TOD-08", "primary"]])}</div>`,
      "TOD-10": () => `${head(item, "SHARE CARD")}<div class="stack">${shareCard()}<section class="share-editor"><span class="section-label">背景</span>${segmented([["mist","雾白"],["night","深夜"],["photo","相册"]], state.shareBackground, "share-bg")}${state.shareBackground === "photo" ? `<input id="share-photo-input" type="file" accept="image/*" hidden><button class="secondary" data-action="share-photo">选择相册图片</button>` : ""}<label class="field-label">缩放 <input id="share-zoom" type="range" min="80" max="125" value="${esc(state.shareZoom)}"></label><p class="caption">卡片只保留状态名称和一句状态说明，不显示心率、HRV、血氧、温度等敏感数值。</p></section>${buttons([["预览并分享", "share-preview", "primary"], ["复制文字", "toast:文字已复制", "secondary"]])}</div>`,
      "TOD-11": () => `${head(item, "DATA QUALITY")}<div class="stack">${lifecycle(state.dataLifecycle, "今天的数据状态")}${quality("Halo Ring", state.dataLifecycle === "limited" ? "昨晚一段记录缺失" : "睡眠与夜间信号可用", "08:42 更新")}${rows([["睡眠", "Halo Ring · 有效覆盖 93%"], ["HRV", "Halo Ring · 夜间记录可用"], ["活动", "Halo Ring + 手机 · 已避免重复"], ["用户记录", state.subjectiveMarkers.length ? state.subjectiveMarkers.join("、") : "本次未带入"]])}${notice("这些数据来自哪里", "Halo Ring 是主要来源。主动测量、Apple 健康、Health Connect 和用户记录会单独标明，同一时段不会重复计算。", "sage")}${notice("为什么会有缺口", "短时断连、摘下戒指或运动干扰都可能造成缺口。戒指仍与账号绑定时，7 天内完成有效同步，进度会补记到记录发生当天。")}${education("为什么需要个人基线", "Halo 先了解你的常见范围，再解释今天的变化，避免用同一标准评判每个人。")}${buttons([["重新同步", "toast:已开始重新同步", "secondary"], ["查看设备状态", "go:DEV-10", "secondary"]])}${notice("健康说明", "所有状态解释仅供日常健康管理参考，不替代医疗诊断。")}</div>`,
    };
    return map[item.id]?.() || generic(item);
  }

  function health(item) {
    if (!isHardwareActive()) return unboundHealthDetail(item);
    const map = {
      "HLT-00": () => `${head(item, "HEALTH DATA")}<div class="stack">${lifecycle(state.dataLifecycle, "Body Weather 基线进度")}${quality("Halo Ring", "睡眠与夜间信号可用", "刚刚同步")}${setting("24 小时心率", "全天趋势与个人基线", "go:HLT-01", "72 次/分")}${setting("夜间呼吸率", "有效时段与记录质量", "go:HLT-02", "15.2 次/分")}${setting("活动与消耗", "步数、热量与活动强度明细", "go:TOD-07", "今日")}${setting("主动测量", "心率 / HRV、血氧、皮肤温度", "go:HLT-03", "开始")}${setting("血氧", "查看夜间趋势与数据质量", "go:HLT-05", "98%")}${setting("皮肤温度", "相对个人基线展示", "go:HLT-06", "+0.2°C")}${education("为什么先看趋势", "单次数字容易受姿势、活动与佩戴影响，结合个人基线和连续趋势更有意义。")}${notice("健康管理参考", "这些数据帮助理解日常状态，不替代医疗诊断；持续不适时请及时寻求专业帮助。")}</div>`,
      "HLT-01": () => healthDetail(item, {
        eyebrow: "24H HEART RATE",
        conclusion: "今天心率变化与活动节奏基本一致",
        summary: "先看全天变化和个人常见范围，再结合活动、睡眠与当下感受。",
        why: "活动时自然上升，休息后逐步回落，没有持续偏离个人范围。",
        data: `${metrics([["当前", "72 bpm", "5 分钟前"], ["静息", "61 bpm", "日间"], ["今日范围", "42-128", "次/分"]])}${rows([["夜间平均", "58 次/分"], ["日间静息", "66 次/分"], ["个人常见范围", "56-76 次/分"]])}`,
        trend: chartCard(`最近 ${state.trendPeriod} 天同时间段`, "变化平稳"),
        lifecycleTitle: "心率数据状态",
        lifecycleOverride: { needed: "完成当天主要清醒时段的有效佩戴，才能形成连续趋势。", next: "继续日常佩戴；运动和静息时段会分开解释。" },
        source: "Halo Ring",
        quality: "全天有效 91%",
        updated: "08:42 更新",
        actionTitle: "继续观察趋势与身体感受",
        actionBody: "若持续心慌、胸闷或不适，请停止活动并寻求专业帮助。",
        actions: [["记录此刻感受", "go:TOD-02", "primary"], ["查看数据质量", "go:TOD-11", "secondary"]],
      }),
      "HLT-02": () => healthDetail(item, {
        eyebrow: "RESPIRATION",
        conclusion: "昨晚呼吸节律整体平稳",
        summary: "这里看多个夜晚的变化，不从某一次高低判断睡眠呼吸问题。",
        why: "大部分夜间时段位于个人常见范围，仅有少量短时波动。",
        data: metrics([["夜间平均", "15.2", "次/分"], ["夜间范围", "14.4-16.6", "次/分"], ["有效时段", "6h 18m", "覆盖 92%"]]),
        trend: chartCard(`最近 ${state.trendPeriod} 晚呼吸率`, "接近个人基线"),
        lifecycleTitle: "夜间呼吸率数据状态",
        source: "Halo Ring",
        quality: "有效覆盖 92%",
        updated: "07:22 更新",
        actionTitle: "继续观察多夜趋势",
        actionBody: "睡眠阶段、鼻塞、饮酒、运动负荷和环境都可能带来短期变化。",
        actions: [["查看睡眠详情", "go:TOD-05", "primary"], ["查看数据质量", "go:TOD-11", "secondary"]],
      }),
      "HLT-03": () => `${head(item, "MEASURE")}<div class="stack">${haloStatus("connected", "compact", "status-detail")}${notice("保持手部安静", "戒指贴合指腹，测量期间减少移动。", "sage")}${setting("心率与 HRV", "约 60 秒", "go:HLT-04")}${setting("血氧", "约 60 秒 · 当前可测", "go:HLT-04")}${setting("皮肤温度", "读取当前相对变化", "go:HLT-04")}${card("最近一次", "心率 71 次/分 · 质量良好 · 今天 08:12", "HISTORY")}${education("主动测量何时更稳定", "静坐片刻、手部保持安静并让传感器贴近指腹，更容易获得可用记录。")}</div>`,
      "HLT-04": () => {
        if (state.measurementStatus === "failed") return `${head(item, "MEASUREMENT")}<div class="stack"><section class="measurement-result failed">${haloStatus("action", "hero", "status-detail")}<h2>本次没有获得可用数据</h2><p>手部移动或戒指接触不稳，使这次记录不够完整。调整佩戴后可以重新测量，本次结果不会保存。</p></section>${rows([["可能原因", "手部移动较多"], ["本次结果", "未保存"], ["现在可以", "静坐片刻后重试"]])}${buttons([["重新测量", "measurement-reset", "primary"], ["返回主动测量", "go:HLT-03", "secondary"]])}</div>`;
        if (state.measurementStatus === "complete") return `${head(item, "MEASUREMENT")}<div class="stack"><section class="measurement-result complete">${haloStatus("connected", "hero", "status-detail")}<h2>测量完成</h2><p>本次数据质量良好，结果已保存在手机上。</p></section>${metrics([["心率", "71", "次/分"], ["HRV", "44", "ms"], ["质量", "良好", "刚刚"]])}${quality("本次主动测量", "质量良好", "刚刚")}${notice("怎样看这次结果", "单次主动测量只反映当下，不用于诊断，也不会单独改变今天的 Body Weather。")}${buttons([["完成", "go:HLT-03", "primary"], ["重新测量", "measurement-reset", "secondary"]])}</div>`;
        return `${head(item, "MEASURING")}<div class="gated measuring-state"><span class="data-symbol accumulating" aria-hidden="true"><img src="${HALO_SYMBOL}" alt=""></span><h2>正在测量</h2><p class="caption">正在采集，还需约 36 秒</p></div>${buttons([["完成测量", "measure-complete", "primary"], ["取消", "go:HLT-03", "text-button"]])}`;
      },
      "HLT-05": () => healthDetail(item, {
        eyebrow: "BLOOD OXYGEN",
        conclusion: "昨晚血氧趋势位于个人常见范围",
        summary: "当前 Halo Ring 支持这项数据，昨晚有效记录覆盖 88%。",
        why: "有效佩戴时段内，大部分记录稳定；短时体动区间已从解释中剔除。",
        data: metrics([["夜间平均", "98%", "有效时段"], ["最低记录", "94%", "单次值"], ["有效覆盖", "88%", "已剔除体动"]]),
        trend: chartCard(`最近 ${state.trendPeriod} 晚血氧`, "整体较平稳"),
        lifecycleTitle: "血氧数据状态",
        source: "Halo Ring · 当前可用",
        quality: "有效覆盖 88%",
        updated: "07:22 更新",
        actionTitle: "关注多夜趋势，不解读单次最低值",
        actionBody: "Halo 的血氧趋势只供日常观察，不用于诊断睡眠呼吸暂停；持续不适时请及时寻求专业帮助。",
        actions: [["查看夜间呼吸", "go:HLT-02", "primary"], ["查看数据质量", "go:TOD-11", "secondary"]],
      }),
      "HLT-06": () => healthDetail(item, {
        eyebrow: "SKIN TEMPERATURE",
        conclusion: "夜间皮肤温度接近个人基线",
        summary: "这里显示与个人基线的相对变化，不等同于核心体温或激素检测。",
        why: "相对基线变化较小，没有形成连续多夜偏离。",
        data: metrics([["相对基线", "+0.2°C", "夜间皮肤温度"], ["7 夜范围", "-0.3~+0.4", "相对变化"], ["有效时长", "6h 36m", "覆盖 90%"]]),
        trend: chartCard(`最近 ${state.trendPeriod} 晚皮肤温度`, "接近个人基线", "gold"),
        lifecycleTitle: "皮肤温度数据状态",
        source: "Halo Ring · 当前可用",
        quality: "有效覆盖 90%",
        updated: "07:22 更新",
        actionTitle: "观察身体感受并保持稳定佩戴",
        actionBody: "环境和佩戴都会影响皮肤温度；身体不适时以体温计和专业意见为准。",
        actions: [["记录此刻感受", "go:TOD-02", "primary"], ["查看数据质量", "go:TOD-11", "secondary"]],
      }),
    };
    return map[item.id]?.() || generic(item);
  }

  function night(item) {
    if (!isHardwareActive()) return unboundNight(item);
    const content = {
      "NIG-01": () => `${head(item, "TONIGHT", `<button class="head-action" data-action="go:NIG-10">⌁</button>`)}<div class="night-hero"><div class="night-orbit"><span class="night-symbol-track" aria-hidden="true"></span><img src="${HALO_SYMBOL_IVORY}" alt=""><strong>CALM · 安静</strong></div><h2>今晚适合慢一点</h2><p>可以从 12 分钟的安静身体扫描开始；记录到可能入睡后，音频会逐渐变轻。</p></div>${card("安静身体扫描", "12 分钟 · 轻声引导 · 适合今晚", "HALO RECOMMENDS", "go:NIG-02")}${buttons([["开始播放", "go:NIG-04", "primary"], ["换一个", "go:NIG-03", "secondary"]])}${setting("智能睡眠联动", "入睡渐弱 · 浅睡窗口唤醒", "go:NIG-12", "已开启")}${setting("唤醒设置", "07:20 前 · 晨雾", "go:NIG-06")}`,
      "NIG-02": () => `${head(item, "CONTENT")}<div class="stack">${card("安静身体扫描", "让注意力从白天的任务回到当下，跟随声音逐段放松。", "12 MIN · GUIDED")}${rows([["形式", "身体扫描"], ["时长", "12 分钟"], ["适合今晚", "想慢下来、身体有些紧绷"], ["声音", "轻声引导 + 极简环境音"]])}${notice("使用提示", "这段内容用于日常放松，不是失眠或焦虑治疗。")}${buttons([["试听 30 秒", "toast:正在试听", "secondary"], ["加入今晚并开始", "go:NIG-04", "primary"]])}</div>`,
      "NIG-03": () => `${head(item, "CHOOSE ANOTHER")}<div class="stack">${choice("nightChoice", "scan", "安静身体扫描", "12 分钟 · 引导较少")}${choice("nightChoice", "breath", "呼吸慢下来", "8 分钟 · 呼吸节律")}${choice("nightChoice", "sound", "夜间白噪音", "30 分钟 · 无引导")}${buttons([["使用这个", "go:NIG-01", "primary"]])}</div>`,
      "NIG-04": () => `${head(item, "NOW PLAYING")}<div class="player-orbit"><button data-action="toggle-player">${state.playing ? "Ⅱ" : "▶"}</button></div><div class="player-meta"><span class="eyebrow">12:00</span><h2>安静身体扫描</h2><p>${state.playing ? "正在播放 · 入睡后会逐渐变轻" : "已暂停"}</p></div><div class="progress" style="margin:22px 0"><i style="width:${state.playing ? 48 : 28}%"></i></div>${notice(state.playing ? "播放和睡眠联动已开启" : "播放已暂停", state.playing ? "锁屏后仍可继续播放；记录到可能入睡后，音量会逐渐降低。" : "继续播放后，会从当前进度恢复。", "sage")}${buttons([[state.playing ? "暂停" : "继续播放", "toggle-player", "primary"], ["结束今晚", "go:TOD-08", "secondary"]])}`,
      "NIG-05": () => `${head(item, "TONIGHT SEQUENCE")}<div class="stack">${rows([["先播放", "安静身体扫描 · 12 分钟"], ["接着播放", "无引导白噪音 · 20 分钟"]])}${notice("今晚的播放顺序", "第一段结束后会自动进入白噪音；你可以更换内容，也可以只保留一段。", "sage")}${buttons([["调整内容", "go:NIG-03", "secondary"], ["按这个顺序播放", "go:NIG-04", "primary"]])}</div>`,
      "NIG-06": () => `${head(item, "WAKE WINDOW")}<div class="stack"><label class="field-label">最晚唤醒时间<input class="field" type="time" value="07:20"></label><label class="field-label">浅睡窗口<select class="field"><option>前 30 分钟</option><option>前 20 分钟</option></select></label>${setting("唤醒声音", "支持试听", "go:NIG-07", state.alarmSound)}${toggle("wake", "智能唤醒", "优先在窗口内较浅睡眠时响起；最晚不会晚于设定时间")}${state.wakeSaved ? notice("唤醒设置已保存", "今晚会按 07:20 最晚唤醒时间和所选声音运行。", "sage") : ""}${buttons([[state.wakeSaved ? "已保存" : "保存设置", state.wakeSaved ? "" : "wake-save", "primary", state.wakeSaved]])}</div>`,
      "NIG-07": () => `${head(item, "WAKE SOUND")}<div class="stack">${["晨雾","微光","清泉","柔和铃音"].map((sound)=>`<button class="choice-row ${state.alarmSound===sound?"selected":""}" data-action="sound:${sound}"><span><strong>${sound}</strong><p>点击试听</p></span><i></i></button>`).join("")}${buttons([["使用所选声音", "go:NIG-06", "primary"]])}</div>`,
      "NIG-08": () => `<div class="gated" style="padding-top:80px"><span class="eyebrow">SMART WAKE</span><h1 style="font-size:58px;margin:14px 0">07:12</h1><p class="caption">在浅睡窗口内响起 · 最晚 07:20</p></div>${buttons([["关闭闹钟", "go:NIG-09", "primary"], ["再睡 5 分钟", "toast:将在 5 分钟后再次唤醒", "secondary"]])}`,
      "NIG-09": () => `${head(item, "GOOD MORNING")}<div class="stack">${notice("今天的 Body Weather 已准备好", "昨晚的记录已经整理完成，可以先看今天适合怎样安排。", "sage")}${buttons([["查看今日 Body Weather", "go:TOD-01", "primary"], ["回看昨夜", "go:TOD-08", "secondary"]])}</div>`,
      "NIG-10": () => `${head(item, "RECENT NIGHTS")}<div class="stack">${card("昨晚 · 安静身体扫描", "入睡渐弱 · 00:18 结束 · 窗口内唤醒", "已完成", "go:TOD-08")}${card("前晚 · 夜间白噪音", "计时渐弱 · 00:36 结束", "已完成", "go:TOD-08")}${notice("管理最近夜间记录", "记录会保留在你的账号中；如需删除，可打开单次详情后操作。")}</div>`,
      "NIG-11": () => `${head(item, "NIGHT SUPPORT")}<div class="stack">${haloStatus("disconnected", "hero", "status-detail")}${notice("戒指暂时未连接，今晚仍可继续", "锁屏后音频会继续播放，并按手机计时逐渐变轻；07:20 的闹钟仍会响起。", "sage")}${rows([["音频", "锁屏后继续播放"], ["渐弱方式", "按手机计时"], ["浅睡窗口", "今晚暂不使用"], ["最晚唤醒", "07:20 仍会响起"]])}${notice("什么时候需要处理", "如果多次重连仍失败，或同步长时间没有完成，再前往连接状态处理。")}${buttons([["继续今晚", "go:NIG-04", "primary"], ["查看连接状态", "go:DEV-10", "secondary"]])}</div>`,
      "NIG-12": () => `${head(item, "SMART SLEEP LINK")}<div class="stack">${toggle("sleepFade", "检测到可能入睡后渐弱", "戒指已连接且本晚睡眠信号可用时参考睡眠状态；否则按手机计时")}${toggle("wake", "浅睡窗口唤醒", "优先在最终时间前的较浅睡眠时响起")}${rows([["戒指已连接且信号可用", "参考睡眠状态调整音频和唤醒时间"], ["信号不可用或暂未连接", "按手机计时渐弱，并在最晚时间响铃"]])}${notice("开始前会显示今晚的运行方式", "开始播放前会说明今晚参考戒指信号，还是按手机计时。", "sage")}</div>`,
    };
    return `<div class="night-screen">${content[item.id]?.() || generic(item)}</div>`;
  }

  function halo(item) {
    if (item.id === "HAL-01" && !isHardwareActive()) {
      const used = state.chat.filter((message) => message.role === "user").length;
      return `${head(item, "YOUR HALO")}<div class="halo-identity"><div class="halo-avatar"><img src="${HALO_SYMBOL}" alt=""></div><div><strong>早上好，我在这里</strong><span>这次对话不参考身体状态</span></div></div><div class="stack" style="margin-top:12px">${notice("今天还可发送 " + Math.max(0, 10 - used) + " 条消息", "每天北京时间 00:00 恢复为 10 条。Halo 可以陪你梳理想法，但不会判断身体状态或生成个性化报告。", "sage")}<div class="suggestions"><button data-action="ask:陪我梳理一下今天的安排">陪我梳理今天的安排</button><button data-action="ask:给我一个睡前放松练习">给我一个睡前放松练习</button><button data-action="ask:先听我说一会儿">先听我说一会儿</button></div><div id="chat-messages" class="stack">${state.chat.map((message) => `<div class="message ${message.role}">${esc(message.text)}</div>`).join("")}</div><div class="composer"><input id="chat-input" class="field" placeholder="问 Halo"><button data-action="send-chat">↑</button></div>${buttons([["绑定 Halo Ring，参考身体状态", "go:DEV-01", "secondary"]])}</div>`;
    }
    const map = {
      "HAL-01": () => `${head(item, "YOUR HALO", `<button class="head-action" data-action="go:HAL-08">•••</button>`)}<div class="halo-identity"><div class="halo-avatar"><img src="${HALO_SYMBOL}" alt=""></div><div><strong>早上好，我在这里</strong><span>${state.toggles.haloBody ? "陪你看懂今天，再决定下一步" : "这次对话不参考身体状态"}</span></div></div><div class="stack" style="margin-top:12px">${haloContextPanel()}<div id="chat-messages" class="stack">${state.chat.map((m)=>`<div class="message ${m.role}">${esc(m.text)}</div>`).join("")}</div><div class="composer"><input id="chat-input" class="field" placeholder="问 Halo"><button data-action="send-chat">↑</button></div></div>`,
      "HAL-02": () => `${head(item, "CONVERSATIONS")}<div class="stack"><input class="field" placeholder="搜索会话">${card("为什么今天更容易累？", "今天 08:46 · 可继续", "当前话题", "go:HAL-01")}${card("最近睡前总是停不下来", "昨天 22:38 · 已暂停", "最近会话", "go:HAL-01")}${card("这周的能量变化", "8 月 22 日 · 已完成", "已归档", "go:HAL-01")}${notice("会话由你控制", "你可以继续、暂停、完成、归档或删除。")}</div>`,
      "HAL-03": () => `${head(item, "MEMORY")}<div class="stack">${toggle("memory", "允许 Halo 使用已确认记忆", "只有你确认过的内容会跨会话使用")}${state.haloMemoryCleared ? notice("还没有 Halo 记忆", "新的内容只有在你确认后，才会跨会话使用。", "sage") : `${card("你更喜欢简短、直接的建议", "来自 3 次对话，由你确认。", "已确认")}${card("晚上压力大时更偏好无引导声音", state.memoryProposalConfirmed ? "你已确认，会在之后的对话中使用。" : "待你确认后才会成为记忆。", state.memoryProposalConfirmed ? "已确认" : "记忆提案")}${buttons([[state.memoryProposalConfirmed ? "已确认" : "确认这条记忆", state.memoryProposalConfirmed ? "" : "memory-confirm", "primary", state.memoryProposalConfirmed], ["清空全部记忆", "danger:清空 Halo 记忆:这会删除已确认的跨会话偏好，不会删除原始健康记录。:确认清空", "danger-button"]])}`}</div>`,
      "HAL-04": () => `${head(item, "PROACTIVE SUPPORT")}<div class="stack">${toggle("proactive", "允许 Halo 主动陪伴", "默认关闭，可分别开启早晨与睡前")}${toggle("morningPrompt", "早晨状态提示", "只在有明确状态变化时出现")}${toggle("nightPrompt", "睡前轻提醒", "帮助进入今晚页面，不强制打开 App")}<label class="field-label">静默时间<input class="field" value="23:30 - 08:00"></label>${notice("通知独立授权", "关闭主动陪伴不影响闹钟、设备和报告类必要通知。")}</div>`,
      "HAL-05": () => `${head(item, "FEELINGS")}<div class="stack"><p class="caption">此刻更接近哪些感受？</p><div class="suggestions">${["平静","疲惫","紧张","低落","有力量"].map((feeling)=>`<button class="${state.haloFeeling === feeling ? "active" : ""}" data-action="halo-feeling:${feeling}">${feeling}</button>`).join("")}</div><label class="field-label">身体感受<textarea id="halo-feeling-note" class="field" placeholder="例如：肩颈有些紧，呼吸偏浅">${esc(state.haloFeeling && !["平静","疲惫","紧张","低落","有力量"].includes(state.haloFeeling) ? state.haloFeeling : "")}</textarea></label>${state.haloContext === "feeling" ? notice("已保存为用户记录", "这次感受已带入当前对话，并与设备数据分开显示。", "sage") : ""}${buttons([["保存并带入对话", "save-halo-feeling", "primary"], ["返回对话", "go:HAL-01", "secondary"]])}</div>`,
      "HAL-06": () => `${head(item, "JOURNEYS")}<div class="stack">${notice(state.journeyPaused ? "当前主题已暂停" : "选择一个小主题", state.journeyPaused ? "进度已保留，准备好时可以继续。" : "每次只给今天的一步，可以暂停或结束。", "sage")}<section class="card"><div class="journey-step"><i>1</i><div><h3>把夜晚还给自己</h3><p>7 天 · ${state.journeyPaused ? "已暂停" : "已进行 2 天 · 今晚一步"}</p></div></div></section><section class="card"><div class="journey-step"><i>○</i><div><h3>在忙碌里留一点余量</h3><p>5 天 · 尚未开始</p></div></div></section>${buttons([[state.journeyPaused ? "继续当前主题" : "继续今天的一步", state.journeyPaused ? "journey-resume" : "go:NIG-01", "primary"], ["暂停当前主题", "journey-pause", "secondary", state.journeyPaused]])}</div>`,
      "HAL-07": () => `${head(item, "DATA & PRIVACY")}<div class="stack">${toggle("haloBody", "允许参考今天的身体状态", "关闭后会立即从本次对话移除，也可以随时重新开启")}${toggle("memory", "允许使用已确认记忆", "可单条删除或全部清空")}${rows([["本次参考", state.toggles.haloBody ? "Body Weather · 08:42" : "未参考身体状态"], ["云端保存", "必要会话摘要"], ["完整健康明细", "优先保存在手机本地"]])}${!state.toggles.haloBody ? notice("身体状态已从本次对话移除", "后续回复不会使用 Body Weather；重新开启前不会自动恢复。", "sage") : ""}${state.haloDataDeletionStatus === "submitted" ? notice("Halo 数据删除申请已提交", "处理进度会在这里更新；戒指健康记录不会随这次申请删除。", "sage") : buttons([[state.toggles.haloBody ? "不再参考本次身体状态" : "重新允许参考身体状态", state.toggles.haloBody ? "remove-halo-context" : "restore-halo-context", "secondary"], ["删除 Halo 数据", "danger:删除 Halo 数据:将提交云端会话摘要与记忆删除请求，不会自动删除戒指健康记录。:提交删除", "danger-button"]])}</div>`,
      "HAL-08": () => `${head(item, "HALO SETTINGS")}<div class="stack">${setting("表达偏好", "更安静、更温柔、更清楚", "toast:表达偏好已保存", "温柔")}${toggle("haloVoice", "语音回复", "默认关闭")}${toggle("inspiration", "今日灵感", "首页展示每日固定的文化灵感，可随时关闭")}${setting("今日灵感个性化", "未填写生日时使用通用内容", "info:inspiration", "通用")}${setting("主动陪伴", "早晨、睡前与静默时间", "go:HAL-04")}${setting("Halo 记忆", "查看、纠正与删除", "go:HAL-03")}${setting("数据与隐私", "来源、权限与撤回", "go:HAL-07")}${setting("人工帮助", "安全问题与服务支持", "go:HELP-03")}</div>`,
    };
    return map[item.id]?.() || generic(item);
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
    if (item.id === "RHY-00") return `${head(item, "RHYTHM SETUP")}<div class="stack">${notice("让节律解释更贴近你", "只填写你愿意提供的基础信息，也可以直接跳过。", "rose")}<label class="field-label">最近一次月经开始日<input class="field" type="date" value="2026-08-18"></label><label class="field-label">平均周期<input class="field" type="number" value="29"></label>${buttons([["保存并继续", "go:ONB-02", "primary"], ["暂时跳过", "go:ONB-02", "text-button"]])}</div>`;
    const statusPage = rhythmStatePage(item);
    if (statusPage) return statusPage;
    const map = {
      "RHY-01": () => `${head(item, "YOUR RHYTHM", `<button class="head-action" data-action="go:RHY-04">•••</button>`)}<div class="stack">${notice("这几天，身体可能更需要稳定节奏", "节律阶段可能与睡眠、情绪和能量变化同时出现，但不能单独解释当前感受。", "rose")}<div class="calendar">${Array.from({length:35},(_,i)=>`<span class="${i>=18&&i<=22?"active":""} ${i===25?"today":""}">${i<3?"":i-2}</span>`).join("")}</div><div class="rhythm-band"><span></span><span></span><span></span><span></span></div>${rows([["当前阶段", "节律后段"], ["睡眠", "可能更易波动"], ["情绪", "留意敏感与压力"], ["能量", "保持日常、减少突增"]])}${buttons([["查看阶段解释", "go:RHY-02", "primary"], ["和 Halo 看看这段变化", "go:RHY-06", "secondary"]])}</div>`,
      "RHY-02": () => `${head(item, "STAGE EXPLANATION")}<div class="stack">${notice("这是一种可能关联", "睡眠、情绪或身体状态的变化，不能只用节律阶段来解释。", "rose")}${card("睡眠", "可能更容易出现入睡延后或夜间醒来。", "POSSIBLE LINK")}${card("情绪", "对压力和外界刺激的感受可能更明显。", "POSSIBLE LINK")}${card("身体能量", "能量起伏可能比平时更容易被察觉。", "POSSIBLE LINK")}${buttons([["带入 Halo 对话", "go:RHY-06", "primary"]])}</div>`,
      "RHY-03": () => `${head(item, "DAY & FEELING")}<div class="stack"><p class="caption">8 月 26 日 · 只做轻记录</p><div class="suggestions">${["睡得少","情绪敏感","身体轻松","有精神"].map((feeling)=>`<button class="${state.rhythmFeeling === feeling ? "active" : ""}" data-action="rhythm-feeling:${feeling}">${feeling}</button>`).join("")}</div>${state.rhythmFeeling ? notice("已选择", `${state.rhythmFeeling} · 将标注为用户记录`, "sage") : ""}${buttons([["保存", "rhythm-feeling-save", "primary", !state.rhythmFeeling]])}</div>`,
      "RHY-04": () => `${head(item, "RHYTHM SETTINGS")}<div class="stack"><label class="field-label">最近一次开始日<input class="field" type="date" value="2026-08-18"></label><label class="field-label">平均周期<input class="field" value="29 天"></label><label class="field-label">平均持续<input class="field" value="5 天"></label>${toggle("rhythmNotice", "节律轻提醒", "在可能发生变化时，给一句温和提醒")}${setting("暂停与删除", "管理节律展示和历史", "go:RHY-05")}</div>`,
      "RHY-05": () => `${head(item, "PAUSE OR DELETE")}<div class="stack">${state.rhythmDeleted ? notice("节律数据已删除", "节律页不再显示你填写的日期和感受记录；Body Weather 的设备数据没有改变。", "sage") : `${notice("暂停节律展示", "首页和节律页不再显示阶段解释，已记录数据保留。", "rose")}${buttons([["暂停展示", "rhythm-state:paused", "secondary"]])}${notice("删除节律数据", "将删除你填写的日期和感受记录。Body Weather 原始健康数据不受影响。", "danger")}${buttons([["删除节律数据", "danger:删除节律数据:日期、周期参数和感受记录会被删除，无法恢复。:确认删除", "danger-button"]])}`}</div>`,
      "RHY-06": () => `${head(item, "WITH HALO")}<div class="stack">${notice("Halo 会参考这些变化", "节律后段 · 最近 7 天睡眠有些波动 · 能量比平时略低。", "rose")}${rows([["节律", "节律后段"], ["睡眠", "连续性略低"], ["身体能量", "比个人基线略低"]])}${buttons([["带入并问 Halo", "halo-rhythm-context", "primary"], ["暂不带入", "go:RHY-01", "secondary"]])}</div>`,
    };
    return map[item.id]?.() || generic(item);
  }

  function myHome(item) {
    const copy = membershipCopy();
    const memberEntry = state.membershipHardwareState === "unbound-retained" ? "Halo Premier · 已有资产保留；重新激活后恢复未来成长" : isHardwareActive() ? "等级、成长、任务、徽章与权益" : "Halo Member · 激活硬件后开始记录成长";
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
    return `${head(item, "ACCOUNT")}<div class="stack"><section class="halo-identity"><div class="halo-avatar">H</div><div><strong>你好，Halo 用户</strong><span>${isHardwareActive() ? "已连续佩戴 9 晚" : "Halo Member · 会员模式"}</span></div></section>${membershipPanel()}${setting("个人资料", "昵称、头像与生日", "go:ACC-01")}${setting("我的 Halo 硬件", `${copy.device} · 查看连接与设备状态`, "go:DEV-10")}${setting("会员说明", "等级、成长、Halo Points 与权益说明", "info:membership-rights")}${setting("会员中心", memberEntry, "go:MEM-01")}${setting("Halo Points", "余额、临期提醒、明细与兑换", "go:PTS-01")}${setting("Halo Select", "精选商品、购物车、订单与售后", "go:SEL-01")}${setting("会员推荐", "邀请朋友并查看奖励进度", "go:REF-01")}${setting(advisorEntry[0], advisorEntry[1], advisorEntry[2])}${setting("商城、推荐与体验顾问说明", "了解三类服务与订单来源", "commerce-entry")}${setting("Halo Studio", "预约、体验码与最近体验", "go:STU-08")}${setting("账号与安全", "登录设备与便捷注销", "go:ACC-02")}${setting("数据与隐私", "权限、本地记录与云摘要", "go:SET-01")}${setting("通知、夜间与睡眠目标", "工作日/休息日目标、睡前与报告提醒", "go:SET-02")}${setting("通用设置", "语言、显示、桌面小组件与 Halo 语气", "go:SET-03")}${setting("使用帮助", "FAQ、反馈与企业微信客服", "go:HELP-01")}${setting("关于与协议", "版本、主体与健康边界", "go:LEGAL-02")}</div>`;
  }
  function me(item) {
    if (item.id === "MY-01") return myHome(item);
    const map = {
      "MY-01": () => { const copy = membershipCopy(); const memberEntry = state.membershipHardwareState === "unbound-retained" ? "Halo Premier · 已有资产保留；重新激活后恢复未来成长" : isHardwareActive() ? "等级、成长、任务、徽章与权益" : "Halo Member · 激活硬件后开始记录成长"; const channelState = window.HALO_COMMERCIAL_EXTENSION?.state?.channelIdentity || "inactive"; const channelActive = channelState === "active"; const channelPending = channelState === "activation-pending"; return `${head(item, "ACCOUNT")}<div class="stack"><section class="halo-identity"><div class="halo-avatar">H</div><div><strong>你好，Halo 用户</strong><span>${isHardwareActive() ? "已连续佩戴 9 晚" : "Halo Member · 会员模式"}</span></div></section>${membershipPanel()}${setting("个人资料", "昵称、头像与生日", "go:ACC-01")}${setting("我的 Halo 硬件", `${copy.device} · 查看连接与设备状态`, "go:DEV-10")}${setting("会员说明", "等级、成长、Halo Points 与权益说明", "info:membership-rights")}${setting("会员中心", memberEntry, "go:MEM-01")}${setting("Halo Points", "余额、临期提醒、明细与兑换", "go:PTS-01")}${setting("Halo Select", "精选商品、购物车、订单与售后", "go:SEL-01")}${setting("会员推荐", "邀请朋友并查看奖励进度", "go:REF-01")}${setting(channelActive ? "经营中心" : channelPending ? "渠道身份待生效" : "申请体验顾问", channelActive ? "服务订单、收益、学习与工具" : channelPending ? "查看资料与身份状态" : "了解要求并提交申请", channelActive ? "go:CHN-19" : channelPending ? "go:CHN-16" : "go:CHN-01")}${setting("商城、推荐与渠道说明", "了解三类服务与订单来源", "commerce-entry")}${setting("Halo Studio", "预约、体验码与最近体验", "go:STU-08")}${setting("账号与安全", "登录设备与便捷注销", "go:ACC-02")}${setting("数据与隐私", "权限、本地记录与云摘要", "go:SET-01")}${setting("通知、夜间与睡眠目标", "工作日/休息日目标、睡前与报告提醒", "go:SET-02")}${setting("通用设置", "语言、显示、桌面小组件与 Halo 语气", "go:SET-03")}${setting("使用帮助", "FAQ、反馈与企业微信客服", "go:HELP-01")}${setting("关于与协议", "版本、主体与健康边界", "go:LEGAL-02")}</div>`; },
      "ACC-01": () => `${head(item, "PROFILE")}<div class="stack"><label class="field-label">昵称<input class="field" value="Halo 用户"></label><label class="field-label">生日<input class="field" type="date" value="1992-08-26"></label><label class="field-label">身高<input class="field" inputmode="decimal" value="165 cm"></label><label class="field-label">体重<input class="field" inputmode="decimal" value="55 kg"></label>${notice("这些信息用在哪里", "生日、身高与体重只用于活动消耗、个人常见范围和节律解释的个性化计算。你可以稍后修改；Halo 不公开这些资料。")}${toggle("birthdayBenefit", "生日关怀", "单独同意后，生日可收到 Halo Points 或优惠权益提示")}${state.profileSaved ? notice("个人资料已保存", "新的资料会用于之后的个性化计算。", "sage") : ""}${buttons([[state.profileSaved ? "已保存" : "保存资料", state.profileSaved ? "" : "profile-save", "primary", state.profileSaved]])}</div>`,
      "SET-01": () => `${head(item, "DATA & PRIVACY")}<div class="stack">${rows([["完整健康明细", "优先保存在手机本地"], ["云端", "必要摘要与同步状态"], ["数据来源", "Halo Ring + 已授权系统能力"]])}${setting("权限管理", "蓝牙、通知与健康数据", "go:PERM-01")}${toggle("location", "最后位置线索", "位置需要单独授权；关闭后不再记录新的手机位置线索")}${state.toggles.location ? notice("位置权限已开启", "仅在戒指与 App 连接时记录手机位置、时间和戒指电量；不是实时定位。", "sage") : notice("位置权限未开启", "不影响连接、同步、Body Weather 或夜间体验。")}${setting("Halo 数据与隐私", "对话来源、记忆与撤回", "go:HAL-07")}${setting("导出我的数据", "本地文件或限时安全链接 · 可撤销并查看访问记录", "export:open")}${state.healthDeletionStatus === "submitted" ? notice("健康记录删除申请已提交", "处理进度会在这里更新；账号和设备绑定不会自动解除。", "sage") : buttons([["删除健康记录", "danger:删除健康记录:将提交本地与云端健康记录删除流程，账号和设备绑定不会自动解除。:继续删除", "danger-button"]])}${notice("戒指内原始记录", "清空戒指缓存请前往“我的戒指 > 高级设备操作”，避免同名操作重复。")}</div>`,
      "SET-02": () => `${head(item, "SLEEP & NOTIFICATIONS")}<div class="stack">${sleepGoalPanel()}<span class="settings-group-label">提醒设置</span>${toggle("nightPrompt", "睡前轻提醒", "只作为通知，不强制打开 App")}${toggle("morningPrompt", "早晨状态提示", "睡眠结束后提醒；没有结束记录时，在首次打开 App 时更新")}${toggle("lowBattery", "低电量提醒", "避免影响夜间记录")}${toggle("syncAlert", "同步异常", "仅在需要处理时提醒")}${toggle("reportReady", "报告生成", "14 晚与 Studio 报告")}${toggle("wake", "Halo 闹钟", "系统关键提醒")}</div>`,
      "SET-03": () => `${head(item, "GENERAL")}<div class="stack">${setting("语言", "简体中文", "toast:语言设置已打开")}${toggle("reduceMotion", "降低动态效果", "减少呼吸动画和页面转场")}${setting("桌面小组件", "Body Weather、戒指连接状态与今晚建议", "widget-preview")}${setting("Halo 表达偏好", "更安静、更温柔、更清楚", "go:HAL-08")}${setting("单位", "公制 · 摄氏度", "toast:单位设置已打开")}</div>`,
      "HELP-01": () => `${head(item, "HELP")}<div class="stack"><input class="field" placeholder="搜索问题">${setting("超级符号为什么会变化", "连接、同步、低电量与需要处理", "status-detail")}${setting("数据为什么还不能解释", "查看五种数据状态和当前进度", "info:data-quality")}${setting("戒指无法连接", "蓝牙与绑定排查", "go:DEV-01")}${setting("固件更新没有完成", "保持距离与重试方式", "go:DEV-11")}${setting("夜间播放与唤醒", "锁屏播放、手机计时与系统权限", "go:NIG-11")}${setting("健康解释边界", "哪些内容不是诊断", "go:LEGAL-02")}${setting("问题反馈", "附加截图和设备日志", "go:HELP-02")}${setting("人工客服", "将离开 App", "go:HELP-03")}</div>`,
      "HELP-02": () => `${head(item, "FEEDBACK")}<div class="stack">${state.feedbackSubmitted ? `${notice("反馈已提交", "处理进度会在帮助中心更新；需要补充信息时会通知你。", "sage")}${buttons([["返回帮助中心", "go:HELP-01", "primary"]])}` : `<label class="field-label">问题类型<select class="field"><option>设备连接</option><option>数据与解释</option><option>夜间体验</option><option>Halo</option></select></label><textarea id="feedback-text" class="field" placeholder="请描述遇到的问题"></textarea>${toggle("logConsent", "允许附加设备日志", "不包含 Halo 对话正文")}${buttons([["提交反馈", "feedback-submit", "primary"]])}`}</div>`,
      "HELP-03": () => `${head(item, "HUMAN SUPPORT")}<div class="stack">${notice("通过企业微信联系客服", "客服可以协助处理会员、订单、设备、权益和售后问题。", "sage")}${rows([["联系时不会发送", "健康数据、Halo 对话和其他敏感信息"], ["后续补充信息", "由你在对话中决定是否提供"]])}${buttons([["联系企业微信客服", "support-handoff", "primary"], ["返回帮助中心", "go:HELP-01", "secondary"]])}</div>`,
      "LEGAL-02": () => `${head(item, "ABOUT")}<div class="stack">${rows([["App 版本", "1.0.0 (140)"], ["设备固件", "1.0.8"], ["运营主体", "Halo Ring"]])}${setting("用户协议", "查看当前有效版本", "info:agreement")}${setting("隐私政策", "了解数据保存与删除", "info:privacy-policy")}${setting("健康与 AI 边界", "了解状态与建议的适用范围", "info:health-ai-boundary")}${notice("健康管理参考", "Halo Ring 与 App 提供的状态和建议不替代医疗诊断。")}</div>`,
      "ACC-02": () => `${head(item, "ACCOUNT SECURITY")}<div class="stack">${rows([["手机号", "138 **** 0000"], ["登录设备", state.signedIn ? "本机 iPhone" : "已退出"]])}${buttons([["退出登录", "logout", "secondary"], ["注销账号", "go:ACC-03", "danger-button"]])}</div>`,
      "ACC-03": () => accountDeletionPage(item),
    };
    return map[item.id]?.() || generic(item);
  }

  function studio(item) {
    const eventSummary = `${card("暮色舒展瑜伽", "8 月 29 日 19:30 · 静安体验室 · 60 分钟", "瑜伽 · ¥99")}`;
    const canReport = state.studioMode === "ring" && isHardwareActive() && state.toggles.studioHealth;
    const map = {
      "STU-08": () => `${head(item, "HALO STUDIO")}<div class="stack"><section class="studio-cover"><span>HALO STUDIO</span><h2>让一次身体练习，被更清楚地看见</h2><p>首发支持瑜伽、普拉提与冥想。</p></section>${state.booked ? card("暮色舒展瑜伽", "已预约 · 8 月 29 日 19:30", "UPCOMING", "go:STU-18") : ""}${card("暮色舒展瑜伽", "60 分钟 · 静安体验室 · ¥99", "官方精选", "go:STU-09")}${card("晨间核心普拉提", "50 分钟 · 免费会员场", "官方精选", "go:STU-09")}${buttons([["扫码或输入体验码", "go:STU-01", "secondary"], ["最近体验", "go:STU-07", "secondary"]])}<p class="caption">不申请定位，不做附近找店。</p></div>`,
      "STU-01": () => `${head(item, "EXPERIENCE CODE")}<div class="stack">${notice("体验码只确认本次活动", "不会改变商品订单来源，也不会复制机构订单信息。")}<input class="field" value="HALO-STUDIO-2026">${buttons([["确认体验", "go:STU-02", "primary"], ["扫码", "toast:请允许相机权限后扫码", "secondary"]])}</div>`,
      "STU-09": () => `${head(item, "EXPERIENCE")}<div class="stack">${eventSummary}${rows([["主理人", "Lin"], ["剩余名额", "6 个"], ["取消规则", "开始前 24 小时可退"]])}${notice("个人状态报告", "仅本人绑定戒指、授权且数据质量达标时生成。机构看不到个人健康数据。", "sage")}${buttons([["预约本次体验", "go:STU-16", "primary"], ["已有机构预约", "go:STU-02", "secondary"]])}</div>`,
      "STU-02": () => `${head(item, "CONFIRM")}<div class="stack">${eventSummary}${notice("核对机构预约", "只保存核对本次预约所需的信息，不复制姓名、手机号、微信、金额或支付凭证。")}${buttons([["确认活动信息", "go:STU-10", "primary"]])}</div>`,
      "STU-16": () => `${head(item, "BOOKING")}<div class="stack">${eventSummary}${rows([["Halo 会员", "资格可用"], ["本次价格", "¥99"], ["名额锁定", "支付后确认"]])}${buttons([["锁定名额", "studio-book", "primary"]])}${state.booked ? buttons([["继续支付", "go:STU-17", "primary"]]) : ""}</div>`,
      "STU-17": () => `${head(item, "PAYMENT")}<div class="stack">${metrics([["活动订单", "¥99", state.paid ? "已支付" : "待支付"]])}${notice("单次活动订单", "仅用于本次活动预约，不包含商品购物车、物流或库存。")}${state.paid ? buttons([["查看预约", "go:STU-18", "primary"]]) : buttons([["完成支付", "studio-pay", "primary"]])}</div>`,
      "STU-18": () => { const refundSubmitted = state.refundStatus === "submitted"; return `${head(item, "MY BOOKING")}<div class="stack">${eventSummary}${rows([["预约状态", refundSubmitted ? "取消处理中" : state.paid ? "已确认" : "待支付"], ["支付状态", refundSubmitted ? "退款处理中" : state.paid ? "已支付" : "待支付"]])}${refundSubmitted ? `${notice("退款申请已提交", "处理进度会在这里更新；款项退回时间以原支付渠道为准。", "sage")}${buttons([["联系活动客服", "go:HELP-03", "secondary"]])}` : buttons([["到场并继续", "go:STU-10", "primary"], ["取消并退款", "studio-refund", "danger-button"]])}</div>`; },
      "STU-10": () => `${head(item, "CONSENT")}<div class="stack">${isHardwareActive() ? choice("studioMode", "ring", "本人戒指记录", "满足授权与质量后生成个人报告") : notice("当前为基础参与", "未激活 Halo Ring 时不读取身体数据，也不生成个人健康报告；浏览、预约与参与仍可继续。", "sage")}${choice("studioMode", "basic", "基础参与", "不读取戒指数据，不生成个人健康报告")}${toggle("studioActivity", "参与本次活动", "建立本次参与记录，必需")}${state.studioMode === "ring" && isHardwareActive() ? toggle("studioHealth", "生成本人状态报告", "只对本人开放，可随时撤回") : notice("基础参与", "不读取戒指数据，也不生成个人健康报告。")}${buttons([["继续", "go:STU-11", "primary"]])}</div>`,
      "STU-11": () => `${head(item, "BEFORE")}<div class="stack">${notice("只属于你", "感受只用于本人报告，不会发给机构，也不会被写成课程效果。", "sage")}<textarea class="field" placeholder="此刻更希望得到什么？可跳过"></textarea>${buttons([[state.studioMode === "ring" && isHardwareActive() ? "保存并检查戒指" : "保存并继续", "go:STU-03", "primary"], ["跳过", "go:STU-03", "secondary"]])}</div>`,
      "STU-03": () => `${head(item, "PREFLIGHT")}<div class="stack">${canReport ? `${rows([["本人戒指", "已绑定"], ["连接", "稳定"], ["电量", "76%"], ["当前状态", "可以开始记录"]])}${notice("报告仍取决于本次有效覆盖", "如有缺口，活动结束后会在报告状态中说明。", "sage")}` : notice("基础参与", "无需戒指检查，不生成个人健康报告。")}${buttons([["开始本次体验", "go:STU-04", "primary"]])}</div>`,
      "STU-04": () => `${head(item, "SESSION")}<div class="session-live"><div class="pulse"><i></i></div><h2>${state.sessionDone ? "记录完成" : "低打扰记录中"}</h2><p>${state.sessionDone ? "本次 60 分钟体验已保存。" : "不展示实时健康数值。短暂断连会标记缺口，不删除整段记录。"}</p></div>${state.sessionDone ? buttons([["查看报告状态", "go:STU-12", "primary"]]) : buttons([["结束本次体验", "studio-complete", "primary"]])}`,
      "STU-12": () => `${head(item, "REPORT STATUS")}<div class="stack">${canReport ? notice("课后轻报告已生成", "报告只对本人开放。", "sage") : notice("本次不生成个人报告", "基础参与、未授权或有效记录不足时不会生成个人报告。")}${buttons([[canReport ? "查看课后报告" : "查看活动权益", canReport ? "go:STU-05" : "go:STU-13", "primary"]])}</div>`,
      "STU-05": () => `${head(item, "POST REPORT")}<div class="stack">${notice("活动后，心率与体动逐步回落", "这是本次记录中的方向性变化，不用于证明课程效果。", "sage")}${rows([["心率变化", "活动后逐步回落"], ["体动变化", "结束后逐步减少"], ["有效记录", "52 / 60 分钟"]])}${quality("Halo Ring", "有效覆盖 87%", "活动结束后生成")}${notice("身体能量", "本次记录不足以单独解释身体能量变化。")}${buttons([["次日再看看", "go:STU-06", "primary"]])}</div>`,
      "STU-06": () => `${head(item, "NEXT DAY")}<div class="stack">${notice("把昨晚与今天放在一起看", "这里并列展示昨晚睡眠与今日 Body Weather；Studio 记录不会改变已经生成的状态。", "sage")}${rows([["昨晚睡眠", "6 小时 48 分 · 连续性略低"], ["今日 Body Weather", state.dataLifecycle === "interpretable" ? currentBodyWeather().label : DATA_LIFECYCLE[state.dataLifecycle].label], ["Studio 记录", "已单独标注"]])}${buttons([["领取活动权益", "go:STU-13", "primary"]])}</div>`,
      "STU-13": () => `${head(item, "BENEFIT")}<div class="stack">${metrics([["本次权益", "30", "Halo Points"]])}${rows([["获得条件", "完成本次活动"], ["发放状态", state.studioBenefitClaimed ? "已领取 · 今天 21:12 到账" : "可领取"]])}${notice("每次活动只到账一次", "同一场活动不会重复发放相同权益。")}${buttons([[state.studioBenefitClaimed ? "已领取" : "领取权益", state.studioBenefitClaimed ? "" : "studio-claim-benefit", "primary", state.studioBenefitClaimed], ["查看本次体验", "go:STU-15", "secondary"]])}</div>`,
      "STU-14": () => `${head(item, "CONTACT")}<div class="stack">${toggle("studioContact", "允许机构发送本次活动服务消息", "消息由 Halo 转发，不会向机构开放手机号、微信号或账号 ID")}${toggle("studioMarketing", "机构后续活动消息", "单独授权，拒绝不影响报告与权益")}${notice("联系边界", "机构不能导出个人名单、个人健康值或个人报告。")}</div>`,
      "STU-07": () => `${head(item, "HISTORY")}<div class="stack">${card("暮色舒展瑜伽", "报告已生成 · 8 月 29 日", "本人戒指记录", "go:STU-15")}${card("夜间呼吸与冥想", "基础参与 · 不生成报告", "已完成", "go:STU-15")}${notice("本地优先保存", "体验记录不会自动删除，你可以在单次详情中发起删除。")}</div>`,
      "STU-15": () => `${head(item, "EXPERIENCE DETAIL")}<div class="stack">${eventSummary}${rows([["参与方式", state.studioMode === "ring" ? "本人戒指记录" : "基础参与"], ["报告状态", canReport ? "已生成" : "本次不生成"], ["活动权益", state.studioBenefitClaimed ? "30 Halo Points 已领取" : "待领取"], ["活动来源", "Halo App"]])}${setting("联系与授权设置", "消息由 Halo 转发", "go:STU-14")}${state.studioDeletionStatus === "submitted" ? notice("删除申请已提交", "处理进度会在这里更新；必要的退款、履约和账户安全记录仍会按规定保留。", "sage") : buttons([["删除本次体验记录", "danger:删除本次体验记录:删除后，本地将不再显示本次体验；退款、履约和账户安全所需的必要记录仍会按规定保留。:提交删除", "danger-button"]])}</div>`,
    };
    return map[item.id]?.() || generic(item);
  }

  function pageBody(item) {
    const commercialBody = window.HALO_COMMERCIAL_EXTENSION?.render(item, {
      hardwareActive: isHardwareActive(),
      membershipState: state.membershipHardwareState,
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
    const item = pages.find((candidate) => candidate.id === state.current) || pages[0];
    if (!item) return;
    document.getElementById("stage-title").textContent = `${item.id} · ${item.name}`;
    renderNavigation();
    renderInspector(item);
    renderTabs(item);
    screen.innerHTML = pageBody(item);
    screen.scrollTop = 0;
    requestAnimationFrame(() => nav.querySelector(".nav-item.active")?.scrollIntoView({ block: "nearest", inline: "nearest" }));
  }

  function handleAction(action) {
    if (!action) return;
    if (action === "go:HAL-01") { state.haloContext = state.toggles.haloBody ? "body" : "none"; state.chat = []; return go("HAL-01"); }
    if (action === "halo-rhythm-context") { state.haloContext = "rhythm"; state.chat = []; return go("HAL-01"); }
    if (action === "remove-halo-context") { state.toggles.haloBody = false; state.haloContext = "none"; return render(); }
    if (action === "restore-halo-context") { state.toggles.haloBody = true; state.haloContext = "body"; return render(); }
    if (action.startsWith("halo-feeling:")) { state.haloFeeling = action.slice(13); return render(); }
    if (action === "save-halo-feeling") {
      const note = document.getElementById("halo-feeling-note")?.value.trim();
      state.haloFeeling = note || state.haloFeeling || "此刻的感受";
      state.haloContext = "feeling";
      trackPrototypeEvent("halo_user_record_saved", { source: "user-record" });
      go("HAL-01");
      return flash("已保存为用户记录，并带入这次对话");
    }
    if (action.startsWith("rhythm-state:")) { state.rhythmStatus = action.slice(13); if (state.rhythmStatus === "empty") state.rhythmDeleted = true; return render(); }
    if (action === "open-inspiration") { state.haloContext = "inspiration"; state.chat = []; return go("HAL-01"); }
    if (action.startsWith("go:")) { closeModal(); return go(action.slice(3)); }
    if (action === "previous") return goBack();
    if (action === "toast:文字已复制") return copyText(`${currentBodyWeather().label}｜${currentBodyWeather().shareLine}`, "文字已复制");
    if (action === "toast:已开始重新同步") { state.deviceStatus = "syncing"; render(); return flash("正在重新同步"); }
    if (action === "toast:语言设置已打开") return showInfoModal("语言", "当前使用简体中文。其他语言将在正式支持后显示在这里。", "知道了");
    if (action === "toast:单位设置已打开") return showInfoModal("单位", "当前使用公制与摄氏度。", "知道了");
    if (action.startsWith("toast:")) { closeModal(); return flash(action.slice(6)); }
    if (window.HALO_COMMERCIAL_EXTENSION?.handleAction(action, {
      go,
      render,
      flash,
      track: trackPrototypeEvent,
    })) return;
    if (action === "export:open") return showExportModal();
    if (action === "export:local") return showExportResult("local");
    if (action === "export:secure") return showExportResult("secure");
    if (action === "export:revoke") return showExportResult("secure", true);
    if (action === "export-download") {
      const payload = { exported_at: new Date().toISOString(), health_records: [], user_records: state.subjectiveMarkers, sources: ["Halo Ring", "用户记录"] };
      downloadBlob("HALORING-data-2026-08-31.json", new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
      return flash("本地文件已保存");
    }
    if (action === "export-copy-link") return copyText("https://secure.haloring.example/export/demo-24h", "安全链接已复制");
    if (action === "share-system") {
      const text = `${currentBodyWeather().label}｜${currentBodyWeather().shareLine}`;
      if (navigator.share) return navigator.share({ title: "Halo Body Weather", text }).catch(() => flash("已取消分享"));
      return showInfoModal("系统分享暂不可用", "当前浏览器没有开放系统分享面板。你可以保存图片后再分享。", "保存图片", "share-save");
    }
    if (action === "share-save") { closeModal(); return saveShareImage(); }
    if (action === "support-instructions") return showInfoModal("企业微信联系指引", "请在企业微信中搜索 Halo Ring 官方客服，或扫描正式服务入口提供的二维码。App 不会随跳转发送健康数据、Halo 对话或其他敏感信息。", "知道了");
    if (action === "widget-preview") return showWidgetPreview();
    if (action === "widget-add") return showWidgetAdded();
    if (action.startsWith("record-detail:")) return showRecordDetail(action.slice(14));
    if (action === "info:membership-rights") return showMembershipRules();
    if (action === "commerce-entry") return showCommerceBoundary();
    if (action === "account-deletion-submit") return showAccountDeletionConfirm();
    if (action === "account-deletion-confirm") {
      state.accountDeletionStatus = "submitted";
      trackPrototypeEvent("account_deletion_submitted", { processing_sla: "15-business-days" });
      closeModal();
      return render();
    }
    if (action === "support-handoff") return showSupportHandoff();
    if (action === "logout") {
      state.signedIn = false;
      state.chat = [];
      trackPrototypeEvent("account_signed_out");
      return go("AUTH-01");
    }
    if (action === "studio-claim-benefit") {
      if (state.studioBenefitClaimed) return;
      state.studioBenefitClaimed = true;
      window.HALO_STUDIO_BENEFIT_CLAIMED = true;
      trackPrototypeEvent("studio_benefit_claimed", { points: 30 });
      render();
      return flash("30 Halo Points 已到账");
    }
    if (action === "wake-save") { state.wakeSaved = true; render(); return flash("唤醒设置已保存"); }
    if (action === "memory-confirm") { state.memoryProposalConfirmed = true; render(); return flash("记忆已确认"); }
    if (action === "journey-pause") { state.journeyPaused = true; return render(); }
    if (action === "journey-resume") { state.journeyPaused = false; return render(); }
    if (action.startsWith("rhythm-feeling:")) { state.rhythmFeeling = action.slice(15); return render(); }
    if (action === "rhythm-feeling-save") {
      if (!state.rhythmFeeling) return;
      if (!state.subjectiveMarkers.includes("情绪")) state.subjectiveMarkers = [...state.subjectiveMarkers, "情绪"];
      localStorage.setItem(SUBJECTIVE_RECORDS_KEY, JSON.stringify(state.subjectiveMarkers));
      go("RHY-01");
      return flash("已保存为用户记录");
    }
    if (action === "profile-save") { state.profileSaved = true; return render(); }
    if (action === "feedback-submit") {
      if (!document.getElementById("feedback-text")?.value.trim()) return flash("请先描述遇到的问题");
      state.feedbackSubmitted = true;
      trackPrototypeEvent("feedback_submitted", { logs_attached: Boolean(state.toggles.logConsent) });
      return render();
    }
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
    if (action === "record-save") { go("TOD-01"); return flash("用户记录已保存"); }
    if (action.startsWith("toggle:")) { const key = action.slice(7); state.toggles[key] = !state.toggles[key]; if (key === "haloBody") state.haloContext = state.toggles.haloBody ? "body" : "none"; return render(); }
    if (action.startsWith("choose:")) { const [, key, value] = action.split(":"); state[key] = value; return render(); }
    if (action.startsWith("membership-state:")) { setMembershipState(action.slice(17)); return render(); }
    if (action.startsWith("member-state:")) {
      const [, value, target] = action.split(":");
      setMembershipState(value);
      return go(target || "TOD-01");
    }
    if (action.startsWith("marker:")) {
      const value = action.slice(7);
      state.subjectiveMarkers = state.subjectiveMarkers.includes(value)
        ? state.subjectiveMarkers.filter((item) => item !== value)
        : [...state.subjectiveMarkers, value];
      localStorage.setItem(SUBJECTIVE_RECORDS_KEY, JSON.stringify(state.subjectiveMarkers));
      return render();
    }
    if (action === "activate-hardware") { setMembershipState("active"); state.deviceStatus = "connected"; return go("RHY-00"); }
    if (action === "measurement-reset") { state.measurementStatus = "ready"; state.measured = false; return render(); }
    if (action === "measurement-fail") { state.measurementStatus = "failed"; state.measured = false; return render(); }
    if (action.startsWith("measurement-state:")) { state.measurementStatus = action.slice(18); state.measured = state.measurementStatus === "complete"; return render(); }
    if (action.startsWith("public-play:")) { state.playing = true; return flash(`正在播放：${action.slice(12)}`); }
    if (action.startsWith("device-status:")) {
      const value = action.slice(14);
      state.deviceStatus = value;
      if (state.current === "DEV-01" && value === "connecting") return go("DEV-02");
      if (state.current === "DEV-05" && value === "connected") return go("RHY-00");
      return render();
    }
    if (action.startsWith("body-weather:")) { state.bodyWeather = action.slice(13); return render(); }
    if (action.startsWith("lifecycle:")) { state.dataLifecycle = action.slice(10); return render(); }
    if (action.startsWith("trend:")) { state.trendPeriod = action.slice(6); return render(); }
    if (action.startsWith("firmware:")) { state.firmwareStatus = action.slice(9); return render(); }
    if (action.startsWith("share-bg:")) { state.shareBackground = action.slice(9); return render(); }
    if (action.startsWith("switch-halo-context:")) { state.haloContext = action.slice(20); state.chat = []; return render(); }
    if (action === "share-photo") return document.getElementById("share-photo-input")?.click();
    if (action === "share-preview") return showSharePreview();
    if (action === "request-location") { state.toggles.location = true; flash("位置已单独授权"); return render(); }
    if (action === "status-detail" || action.startsWith("status-detail:")) {
      const requestedStatus = action.includes(":") ? action.split(":")[1] : state.deviceStatus;
      const current = DEVICE_STATUS[requestedStatus] || DEVICE_STATUS.connected;
      return showInfoModal("Halo Ring 状态", `${current.label}：${current.detail}\n\n完整符号表示连接稳定；分段闭合表示正在连接；沿圆轨流动表示正在同步；克制缺口表示暂时未连接；琥珀点表示低电量；停止并出现提示点表示需要处理。普通断连不会使用风险色。`);
    }
    if (action === "info:data-quality") {
      const data = DATA_LIFECYCLE[state.dataLifecycle] || DATA_LIFECYCLE.interpretable;
      return showInfoModal("数据来源与质量", `${data.label}。${data.reason}\n\n还需要：${data.needed}。\n现在可以：${data.next}\n\n每项数据都会标明来源和更新时间。同一时段有多份记录时会避免重复计算。`);
    }
    if (action === "info:stress") { const weather = currentBodyWeather(); return showInfoModal("压力与放松详情", `今天的压力与放松信号${weather.pressure}。它参考清醒佩戴时段的 HRV、心率与活动背景，运动时段不会计入压力判断。\n\n这里帮助你观察日常变化，不用于诊断。`, "知道了"); }
    if (action === "info:education") return showInfoModal("功能说明", "Halo 用个人基线和连续趋势解释身体状态。内容用于日常健康管理参考，不替代医疗诊断，也不会用单次数字给你下结论。");
    if (action === "info:inspiration") return showInfoModal("关于今日灵感", "这是一份每日固定的文化灵感，不是预测，也不会读取或解释你的健康数据。未填写生日时使用通用内容；授权生日后可以生成更贴近你的表达。它不用于医疗、投资、消费或其他重要决定。");
    if (action === "info:agreement") return showInfoModal("用户协议", "当前版本：2026 年 9 月 1 日。这里说明账号使用、服务边界、用户责任和争议处理方式。核心规则发生变化时，会按适用要求提前公示。");
    if (action === "info:privacy-policy") return showInfoModal("隐私政策", "这里说明设备、健康、会员、订单和服务数据的使用范围、保存方式，以及访问、更正、导出和删除入口。法定留存数据不会继续用于运营或个性化。");
    if (action === "info:health-ai-boundary") return showInfoModal("健康与 AI 边界", "Halo 提供日常身体状态解释和行动参考，不进行疾病诊断、处方或紧急医疗判断，也不能替代医生或其他专业医疗人员。");
    if (action.startsWith("sound:")) { state.alarmSound = action.slice(6); flash(`正在试听：${state.alarmSound}`); return render(); }
    if (action.startsWith("ask:")) {
      const used = state.chat.filter((message) => message.role === "user").length;
      if (!isHardwareActive() && used >= 10) return flash("今天的 10 条消息已用完，明日 00:00 恢复");
      const reply = !isHardwareActive() || !state.toggles.haloBody || state.haloContext === "none"
        ? "我现在不会读取或判断你的身体状态，但可以陪你梳理感受、安排和通用的睡前放松练习。"
        : state.haloContext === "inspiration"
        ? "把它当成今天的一种观察角度就好，不是预测。你可以先留出十分钟，不急着回应一件不紧急的事。"
        : state.haloContext === "rhythm"
        ? "节律记录、近 7 天睡眠和身体能量可能同时出现变化，但不能单独解释感受。我们可以先从你此刻最明显的感受开始。"
        : state.haloContext === "feeling"
        ? `我看到了你的用户记录“${state.haloFeeling}”。它不会改写设备数据，我们可以从这次感受继续聊。`
        : "从今天的状态看，昨晚睡眠连续性比近期略低，但身体能量仍有余量。可以保持日常安排，把强度稍微放轻。";
      state.chat.push({ role: "user", text: action.slice(4) }, { role: "halo", text: reply });
      return render();
    }
    if (action === "send-chat") {
      const input = document.getElementById("chat-input");
      const text = input?.value.trim();
      if (!text) return flash("先写下你想说的内容");
      const used = state.chat.filter((message) => message.role === "user").length;
      if (!isHardwareActive() && used >= 10) return flash("今天的 10 条消息已用完，明日 00:00 恢复");
      const reply = !isHardwareActive() || !state.toggles.haloBody || state.haloContext === "none"
        ? "这次对话不参考身体状态。我可以陪你继续说清楚，但不会生成身体状态判断或个性化报告。"
        : state.haloContext === "inspiration"
        ? "我可以陪你把这个灵感转成一个很小的行动，但不会用它替你判断健康、投资或重要决定。"
        : state.haloContext === "rhythm"
        ? "我会把节律记录、近 7 天睡眠与身体能量分开看，也不会把其中任何一项当成唯一原因。"
        : state.haloContext === "feeling"
        ? `我会把“${state.haloFeeling}”保留为用户记录，并和设备数据分开看。`
        : "我听到了。我们可以先把这件事说清楚，再决定今天要不要做一个很小的行动。";
      state.chat.push({ role: "user", text }, { role: "halo", text: reply });
      return render();
    }
    if (action === "toggle-player") { state.playing = !state.playing; return render(); }
    if (action === "measure-complete") { state.measured = true; state.measurementStatus = "complete"; return render(); }
    if (action === "studio-book") { state.booked = true; flash("名额已锁定"); return render(); }
    if (action === "studio-pay") { state.paid = true; state.booked = true; flash("支付成功"); return render(); }
    if (action === "studio-refund") { state.refundStatus = "submitted"; flash("退款申请已提交"); return render(); }
    if (action === "studio-complete") { state.sessionDone = true; return render(); }
    if (action.startsWith("danger:")) {
      const [, title, message, label] = action.split(":");
      return showModal(title, message, label, `confirm-danger:${title}`);
    }
    if (action.startsWith("confirm-danger:")) {
      const title = action.slice(15);
      closeModal();
      if (title === "清空 Halo 记忆") { state.haloMemoryCleared = true; flash("Halo 记忆已清空"); return render(); }
      if (title === "删除 Halo 数据") { state.haloDataDeletionStatus = "submitted"; flash("Halo 数据删除申请已提交"); return render(); }
      if (title === "删除节律数据") { state.rhythmDeleted = true; state.rhythmStatus = "empty"; flash("节律数据已删除"); return render(); }
      if (title === "删除健康记录") { state.healthDeletionStatus = "submitted"; flash("健康记录删除申请已提交"); return render(); }
      if (title === "删除本次体验记录") { state.studioDeletionStatus = "submitted"; flash("删除申请已提交"); return render(); }
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
    if (event.target.id !== "share-zoom") return;
    state.shareZoom = Number(event.target.value);
    const scale = screen.querySelector(".share-card-scale");
    if (scale) scale.style.transform = `scale(${state.shareZoom / 100})`;
  });
  screen.addEventListener("change", (event) => {
    if (event.target.id !== "share-photo-input" || !event.target.files?.[0]) return;
    if (state.sharePhotoUrl.startsWith("blob:")) URL.revokeObjectURL(state.sharePhotoUrl);
    state.sharePhotoUrl = URL.createObjectURL(event.target.files[0]);
    state.shareBackground = "photo";
    render();
  });
  modalRoot.addEventListener("click", (event) => handleAction(event.target.closest("[data-action]")?.dataset.action));
  document.querySelector(".inspector")?.addEventListener("click", (event) => handleAction(event.target.closest("[data-action]")?.dataset.action));
  tabbar.addEventListener("click", (event) => { const button = event.target.closest("[data-tab]"); if (!button) return; if (button.dataset.tab === "HAL-01") state.haloContext = "body"; go(button.dataset.tab); });
  search.addEventListener("input", () => { state.query = search.value.trim(); const first = filteredPages()[0]; if (first && !filteredPages().some((item) => item.id === state.current)) state.current = first.id; render(); });
  document.getElementById("previous").addEventListener("click", () => go(previousId(state.current)));
  document.getElementById("next").addEventListener("click", () => handleAction(nextId(state.current)));
  window.addEventListener("keydown", (event) => { if (event.target.matches("input, textarea, select")) return; if (event.key === "ArrowLeft") go(previousId(state.current)); if (event.key === "ArrowRight") handleAction(nextId(state.current)); });
  window.addEventListener("hashchange", () => { const id = location.hash.slice(1).toUpperCase(); if (pages.some((item) => item.id === id)) { state.current = id; render(); } });

  const initial = location.hash.slice(1).toUpperCase();
  if (pages.some((item) => item.id === initial)) state.current = initial;
  render();
})();
