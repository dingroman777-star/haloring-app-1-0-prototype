(function () {
  const page = (id, name, route, parent, note, group) => ({
    id,
    name,
    route: `\`${route}\``,
    priority: "P0",
    parent,
    note,
    group,
    function: note,
    layout: "围绕单一用户任务组织状态、下一步与恢复动作",
    data: "用户可见状态与必要业务事实；内部字段仅在开发审阅区查看",
    interaction: "主操作、返回、渐进展开、输入校验与失败恢复",
    logic: "权威状态驱动页面；审阅态控制与用户界面物理分离",
    exception: "加载、空、失败、过期、撤回、冲正与权限不足均可恢复",
    sdk: "无强制硬件 SDK；身份、支付、二维码等能力接正式服务",
    rules: "会员 v1.20、Halo Select 商品状态门、渠道发布与结算门",
    backend: "会员、任务、账本、商品、订单、支付、渠道与工单服务",
    owner: "产品 + UI + 双端 + 后端 + QA",
    source: "会员 v1.20 / Halo Select 基线 / 渠道基线 / handoff 35",
  });

  const extraPages = [
    page("MEM-01", "会员中心", "/me/member", "MY-01", "聚合当前等级、下一任务、Points、徽章、权益与推荐入口", "会员与积分"),
    page("MEM-02", "六级等级路径", "/me/member/levels", "MEM-01", "查看当前等级、下一等级和完整六级路径", "会员与积分"),
    page("MEM-03", "升级条件详情", "/me/member/upgrade", "MEM-02", "展示成长进度、缺少条件与权益生效结果", "会员与积分"),
    page("MEM-04", "会员任务中心", "/me/member/tasks", "MEM-01", "按今天、本周与本月查看任务", "会员与积分"),
    page("MEM-05", "任务详情与奖励状态", "/me/member/tasks/:id", "MEM-04", "查看任务进度、确认中和到账结果", "会员与积分"),
    page("MEM-06", "成长徽章", "/me/member/badges", "MEM-01", "查看永久成长徽章及累计进度", "会员与积分"),
    page("MEM-07", "会员权益中心", "/me/member/benefits", "MEM-01", "区分当前可用与下一等级权益", "会员与积分"),
    page("PTS-01", "Halo Points 首页", "/me/points", "MEM-01 / MY-01", "展示可用积分、临期提醒与使用入口", "会员与积分"),
    page("PTS-02", "Halo Points 明细", "/me/points/ledger", "PTS-01", "展示奖励、使用、调整和申诉结果", "会员与积分"),
    page("PTS-03", "Halo Points 兑换", "/me/points/redeem", "PTS-01", "浏览可兑换内容、服务与权益", "会员与积分"),
    page("PTS-04", "兑换确认与结果", "/me/points/redeem/:id", "PTS-03", "确认所需积分、交付方式与兑换结果", "会员与积分"),
    page("REF-01", "会员推荐", "/me/referral", "MEM-01 / MY-01", "分享推荐入口并查看进行中的推荐", "会员与积分"),
    page("SEL-01", "Halo Select", "/me/select", "MY-01", "从行动建议进入精选商品与系列", "Halo Select"),
    page("SEL-02", "系列与搜索", "/me/select/list", "SEL-01", "搜索、筛选与浏览可见商品", "Halo Select"),
    page("SEL-03", "商品详情", "/me/select/products/:id", "SEL-01 / SEL-02", "查看商品、规格、履约与售后", "Halo Select"),
    page("SEL-04", "购物车", "/me/select/cart", "SEL-03", "调整数量并进入结算", "Halo Select"),
    page("SEL-05", "确认订单", "/me/select/checkout", "SEL-04", "核对地址、优惠、后台判定来源与应付金额", "Halo Select"),
    page("SEL-06", "优惠券", "/me/select/coupons", "SEL-05", "选择可用优惠并查看不可用原因", "Halo Select"),
    page("SEL-07", "地址管理", "/me/select/addresses", "SEL-05", "新增、编辑和选择地址", "Halo Select"),
    page("SEL-08", "订单来源说明", "/me/select/attribution", "SEL-05", "查看系统判定的唯一订单来源与异议入口", "Halo Select"),
    page("SEL-09", "支付结果", "/me/select/pay", "SEL-05", "确认支付并展示成功或失败恢复", "Halo Select"),
    page("SEL-10", "我的订单", "/me/select/orders", "MY-01 / SEL-09", "查看待付款、待发货、待收货、完成和售后订单", "Halo Select"),
    page("SEL-11", "订单详情", "/me/select/orders/:id", "SEL-10", "查看金额、履约、物流和售后入口", "Halo Select"),
    page("SEL-12", "申请售后", "/me/select/after-sales/new", "SEL-11", "选择类型、原因并提交售后", "Halo Select"),
    page("SEL-13", "售后进度", "/me/select/after-sales/:id", "SEL-10 / SEL-12", "查看处理进度、退款与补件", "Halo Select"),
    page("CHN-01", "申请体验顾问", "/me/channel/join", "MY-01", "理解角色并开始申请", "渠道经营"),
    page("CHN-02", "确认身份", "/me/channel/verify", "CHN-01", "提交实名核验", "渠道经营"),
    page("CHN-03", "身份确认中", "/me/channel/verify/processing", "CHN-02", "显示预计反馈、刷新和帮助", "渠道经营"),
    page("CHN-04", "身份确认未通过", "/me/channel/verify/failed", "CHN-03", "显示可理解原因与恢复动作", "渠道经营"),
    page("CHN-05", "还需激活设备", "/me/channel/device-required", "CHN-01", "进入设备绑定与激活", "渠道经营"),
    page("CHN-06", "体验顾问申请", "/me/channel/apply", "CHN-02", "填写地区、经验与收款身份", "渠道经营"),
    page("CHN-07", "申请资料", "/me/channel/application/detail", "CHN-06", "查看已提交资料与更新时间", "渠道经营"),
    page("CHN-08", "必修培训", "/me/channel/training", "CHN-06", "完成三门基础课程", "渠道经营"),
    page("CHN-09", "培训课程", "/me/channel/training/:id", "CHN-08", "阅读宣传与健康表达边界", "渠道经营"),
    page("CHN-10", "培训测评", "/me/channel/assessment", "CHN-08", "完成选择题并获得解释", "渠道经营"),
    page("CHN-11", "申请审核中", "/me/channel/application", "CHN-10", "显示当前位置、预计反馈和撤回入口", "渠道经营"),
    page("CHN-12", "需要补充资料", "/me/channel/application/needs-info", "CHN-11", "补充指定资料并重新提交", "渠道经营"),
    page("CHN-13", "申请未通过", "/me/channel/application/rejected", "CHN-11", "查看原因、复核与重新申请", "渠道经营"),
    page("CHN-14", "撤回申请", "/me/channel/application/withdraw", "CHN-11", "确认撤回影响", "渠道经营"),
    page("CHN-15", "审核通过", "/me/channel/approved", "CHN-11", "进入协议与收款账户准备", "渠道经营"),
    page("CHN-16", "协议与收款", "/me/channel/activation", "CHN-15", "核对协议、收款账户和税务信息", "渠道经营"),
    page("CHN-17", "体验顾问身份已生效", "/me/channel/activated", "CHN-16", "展示身份与生效时间", "渠道经营"),
    page("CHN-18", "顾问工具已开通", "/me/channel/home/new", "CHN-17", "查看零订单状态与第一步待办", "渠道经营"),
    page("CHN-19", "经营首页", "/me/channel/home", "MY-01 / CHN-17", "展示本月订单、收益与待办", "渠道经营"),
    page("CHN-20", "服务订单", "/me/channel/orders", "CHN-19", "查看订单、客户进度与收益状态", "渠道经营"),
    page("CHN-21", "单笔收益", "/me/channel/earnings/:id", "CHN-20", "查看计算结果、确认期与申诉", "渠道经营"),
    page("CHN-22", "收益明细", "/me/channel/earnings", "CHN-19", "查看可提现、待确认与历史支付", "渠道经营"),
    page("CHN-23", "对账与提现", "/me/channel/withdraw", "CHN-22", "校验金额、账户并提交提现", "渠道经营"),
    page("CHN-24", "内容与政策", "/me/channel/content", "CHN-19", "查看当前可分享内容与必读政策", "渠道经营"),
    page("CHN-25", "政策详情", "/me/channel/content/:id", "CHN-24", "阅读当前有效政策和分享限制", "渠道经营"),
    page("CHN-26", "身份与推广工具", "/me/channel/tools", "CHN-19", "查看专属二维码、链接和身份", "渠道经营"),
  ];

  window.HALO_V5_PAGES = [...(window.HALO_V5_PAGES || []), ...extraPages];

  const COMMERCIAL_PROGRESS_KEY = "haloV5CommercialProgress";
  const BASE_POINTS_BALANCE = 18800;
  const DEFAULT_REDEMPTION_ID = "studio-public-session-pass";
  const REDEMPTION_CATALOG = Object.freeze({
    "studio-public-session-pass": {
      id: "studio-public-session-pass",
      title: "Halo Studio 公开体验券",
      shortTitle: "公开体验券",
      context: "Halo Studio",
      description: "兑换后可在指定的 Halo Studio 公开场次中使用一次。",
      usage: "指定公开场次使用一次",
      delivery: "体验券已加入 Halo Studio，可在指定公开场次中使用。",
      cost: 6000,
      available: true,
      resultAction: ["查看可用场次", "go:STU-08"],
    },
    "member-event-priority": {
      id: "member-event-priority",
      title: "会员活动优先名额",
      shortTitle: "活动优先名额",
      context: "会员活动",
      description: "名额开放时，可用 Halo Points 兑换一次优先报名资格。",
      usage: "名额开放后按活动页使用",
      cost: 8000,
      available: false,
      unavailableCopy: "当前还没有开放可兑换名额。开放后会在活动页同步时间和使用条件。",
    },
    "limited-event-gift": {
      id: "limited-event-gift",
      title: "限定活动纪念礼",
      shortTitle: "限定纪念礼",
      context: "限定活动",
      description: "活动公布兑换时间后，可用 Halo Points 兑换限定纪念礼。",
      usage: "以对应活动页公布为准",
      cost: 12000,
      available: false,
      unavailableCopy: "当前活动尚未公布兑换时间和领取方式。开放后会在活动页显示。",
    },
  });
  function readCommercialProgress() {
    try {
      if (typeof localStorage === "undefined") return {};
      const value = JSON.parse(localStorage.getItem(COMMERCIAL_PROGRESS_KEY) || "{}");
      return value && typeof value === "object" ? value : {};
    } catch {
      return {};
    }
  }
  const PRODUCTS = Object.freeze({
    mask: { id: "mask", title: "夜间舒缓眼罩", specification: "柔雾灰 · 标准款", price: 399, visual: "textile" },
    ring: { id: "ring", title: "HALORING 智能戒指", specification: "标准款 · 预售", price: 2999, visual: "ring" },
    aroma: { id: "aroma", title: "空间舒缓香气", specification: "标准装", price: 369, visual: "scent", displayOnly: true },
    nutrition: { id: "nutrition", title: "CHRONO KEY 女性益生菌", specification: "规格待公布", price: 0, visual: "nutrition", displayOnly: true },
    skin: { id: "skin", title: "夜间身体护理", specification: "规格待公布", price: 0, visual: "skin", displayOnly: true }
  });
  const TASKS = Object.freeze({
    "wear-12h": { title: "有效佩戴 12 小时", period: "today", growth: 8, points: 20, progress: "10 小时 42 分 / 12 小时", route: "DEV-07" },
    "night-repair": { title: "完成一次 AI 睡前修复", period: "today", growth: 4, points: 10, progress: "尚未完成", route: "NIG-01" },
    "weekly-feedback": { title: "查看周报告并反馈", period: "week", growth: 15, points: 50, progress: "等待提交反馈", route: "TOD-04" },
    "wear-5days": { title: "完成 5 个有效佩戴日", period: "week", growth: 15, points: 50, progress: "4 / 5 天", route: "DEV-07" },
    "monthly-review": { title: "完成月度状态回顾", period: "month", growth: 30, points: 100, progress: "等待完成月度回顾", route: "TOD-09" },
    cocreation: { title: "参与正式访谈、产品测试或共创", period: "month", growth: 0, points: 0, progress: "尚无已确认邀约", route: "HELP-03" }
  });
  const COURSES = [
    { id: "product", title: "哪些产品信息可以介绍", body: "介绍前确认当前商品的发售状态、规格、交付时间与售后说明。未开售的商品不承诺收款或发货日期。", takeaway: "以当前商品页公布的信息为准，不自行增加功能或交付承诺。" },
    { id: "health", title: "怎样介绍健康功能", body: "Halo 用于观察日常身体状态，不是疾病诊断或治疗工具。用户持续不适时，应建议向专业医疗人员求助。", takeaway: "可以介绍睡眠、能量与节律趋势，不承诺诊断、治疗或确定收益。" },
    { id: "orders", title: "订单来源与售后怎么处理", body: "订单来源由系统确认，支付后冻结。同一订单不同时产生会员推荐奖励与渠道现金收益。退款与换货由 Halo 售后处理。", takeaway: "帮助用户找到订单与客服入口，不自行改来源、改价或收取线下款项。" }
  ];
  const CHANNEL_ORDERS = [
    { id: "HR20260901018", title: "HALORING 智能戒指", amount: 3990, earning: 997.50, status: "客户已激活" },
    { id: "HR20260829007", title: "夜间舒缓眼罩", amount: 399, earning: 99.75, status: "收益待确认" }
  ];
  const POLICIES = {
    health: { title: "健康表达边界", body: "Halo 用于观察日常身体状态并提供生活方式参考，不用于诊断、治疗，也不能替代医疗判断。", points: ["可以介绍睡眠、能量与节律趋势。", "不承诺治疗效果、确定收益或未经确认的产品能力。"] },
    service: { title: "当前体验顾问服务政策", body: "服务以当前有效协议和具体订单记录为准。订单来源由系统判断，不由用户或顾问选择。", points: ["同一订单不会同时产生会员推荐奖励与渠道现金收益。", "退换售后统一由 Halo 承接。收益调整保留关联订单和处理记录。", "暂停或终止期间，仅可查看历史与联系支持，不能新增推广或提现。"] },
    education: { title: "客户教育素材", body: "三张公开介绍卡 · 本地原型示例；正式分享内容以审核发布版本为准。", points: ["认识 Halo：帮助你观察日常睡眠与身体状态。", "开始使用：注册后可先体验公共内容，绑定设备后再开启硬件能力。", "遇到问题：从我的订单或帮助中心联系 Halo，不向个人转账。"] }
  };
  const defaultState = {
    orders: [], afterSales: [], addresses: [],
    selectedProductId: "mask", cartProductId: "mask", checkoutProductId: "mask",
    selectedTaskId: "wear-12h", taskStates: {}, pendingPointsCorrection: 0,
    vouchers: [], studioAwards: [],
    memberAssets: null, checkoutReconfirmId: null, taskPeriods: {},
    identityVerified: false, identityProcessing: false,
    afterSaleDraft: { type: "退货退款", reason: "商品与描述不符", note: "" },
    applicationSnapshot: null, applicationHistory: [], applicationStatus: "none",
    completedCourses: [], selectedCourseId: "product", assessmentAnswers: {}, assessmentPassed: false,
    selectedEarningId: "HR20260901018", selectedPolicyId: "health", policiesRead: {},
    channelAvailableCents: 120000, withdrawals: [], withdrawalQuote: null,
    withdrawalQuoteConfirmed: false, withdrawalVerification: "",
    referralProgressShown: false,

    taskStatus: "available",
    taskPeriod: "today",
    upgradePosted: false,
    pointsMode: "normal",
    pointsUsed: true,
    pointsBalance: BASE_POINTS_BALANCE,
    pointsTransactions: [],
    selectedRedemptionId: DEFAULT_REDEMPTION_ID,
    redemptionStatus: "ready",
    couponSelected: true,
    couponUsedOrderId: null,
    catalogMode: "sale",
    catalogReminder: false,
    category: "all",
    cartCount: 1,
    attribution: "direct",
    attributionReason: "本次从 Halo Select 直接进入，未识别到有效推荐关系",
    paymentStatus: "ready",
    nextOrderSequence: 28,
    afterSaleStatus: "ready",
    orderSnapshot: null,
    afterSaleSnapshot: null,
    selectedOrderId: "latest",
    orderFilter: "all",
    withdrawalAmount: "",
    withdrawalConfirmed: false,
    withdrawalStatus: "ready",
    assessmentChoice: "",
    assessmentFeedback: "",
    uploadSelected: false,
    pointsAppealSubmitted: false,
    referralQrShown: false,
    selectedAddress: "shanghai",
    addressFormOpen: false,
    addressDraft: { name: "", phone: "", detail: "" },
    addressError: "",
    logisticsExpanded: false,
    afterSaleUploadSelected: false,
    identityDraft: { name: "A**", idNumber: "310***********0021" },
    identityConsent: false,
    identityRequestId: "IDV20260902008",
    applicationDraft: { region: "上海市", experience: "健康生活方式服务", payeeType: "自然人" },
    applicationConsent: false,
    applicationDraftSaved: false,
    policyRead: false,
    channelAgreementConfirmed: false,
    activationRequest: null,
    activationReady: false,
    resumeAfterDevice: false,
    channelIdentity: "inactive",
    channelMode: "new",
  };
  const state = { ...defaultState, ...readCommercialProgress() };
  state.addressDraft = { ...defaultState.addressDraft, ...(state.addressDraft || {}) };
  state.identityDraft = { ...defaultState.identityDraft, ...(state.identityDraft || {}) };
  state.applicationDraft = { ...defaultState.applicationDraft, ...(state.applicationDraft || {}) };
  state.pointsBalance = Number.isFinite(Number(state.pointsBalance)) ? Math.max(0, Number(state.pointsBalance)) : BASE_POINTS_BALANCE;
  state.pointsTransactions = Array.isArray(state.pointsTransactions) ? state.pointsTransactions.filter((entry) => entry && entry.id) : [];
  state.selectedRedemptionId = REDEMPTION_CATALOG[state.selectedRedemptionId] ? state.selectedRedemptionId : DEFAULT_REDEMPTION_ID;
  state.nextOrderSequence = Number.isInteger(Number(state.nextOrderSequence)) ? Math.max(28, Number(state.nextOrderSequence)) : 28;
  state.orders = Array.isArray(state.orders) ? state.orders : [];
  if (state.orderSnapshot?.id && !state.orders.some(order => order.id === state.orderSnapshot.id)) state.orders.push(state.orderSnapshot);
  state.afterSales = Array.isArray(state.afterSales) ? state.afterSales : [];
  if (state.afterSaleSnapshot?.id && !state.afterSales.some(row => row.id === state.afterSaleSnapshot.id)) {
    state.afterSaleSnapshot = { type:"退货退款",reason:"历史售后申请",note:"",...state.afterSaleSnapshot,status:state.afterSaleSnapshot.status || state.afterSaleStatus };
    state.afterSales.push(state.afterSaleSnapshot);
  }
  if (state.paymentStatus === "processing" && state.orderSnapshot?.id) {
    const pending = state.orders.find(row => row.id === state.orderSnapshot.id);
    if (pending?.status === "pending-payment") { pending.status = "processing"; state.orderSnapshot = pending; }
  }
  state.vouchers = Array.isArray(state.vouchers) ? state.vouchers : [];
  for (const item of Object.values(REDEMPTION_CATALOG)) {
    if (item.available && state.pointsTransactions.some(row => row.id === `redemption:${item.id}`) && !state.vouchers.some(row => row.id === `voucher:${item.id}`)) state.vouchers.push({id:`voucher:${item.id}`,title:item.title,status:"available"});
  }
  state.addresses = Array.isArray(state.addresses) ? state.addresses : [];
  state.taskStates = { "wear-12h": state.taskStatus || "available", ...(state.taskStates || {}) };
  state.afterSaleDraft = { ...defaultState.afterSaleDraft, ...(state.afterSaleDraft || {}) };
  if (state.pointsMode === "pending" && !state.pendingPointsCorrection) { state.pendingPointsCorrection = 1200; state.pointsBalance = 0; }
  function persistCommercialState() {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(COMMERCIAL_PROGRESS_KEY, JSON.stringify(state));
    } catch {
      // The prototype remains interactive when storage is unavailable.
    }
  }
  function memberPeriodKey(period, occurredAt = new Date().toISOString()) {
    const date = new Date(new Date(occurredAt).getTime() + 8 * 3600000);
    if (!Number.isFinite(date.getTime())) return "";
    if (period === "month") return date.toISOString().slice(0,7);
    if (period === "week") date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
    return date.toISOString().slice(0,10);
  }
  function refreshTaskPeriods() {
    state.taskPeriods ||= {};
    for (const [id, task] of Object.entries(TASKS)) {
      const period = memberPeriodKey(task.period);
      if (state.taskPeriods[id] && state.taskPeriods[id] !== period) state.taskStates[id] = "available";
      state.taskPeriods[id] = period;
    }
  }
  function regularPointsRemaining(occurredAt) {
    const month = memberPeriodKey("month",occurredAt);
    return Math.max(0,2000-state.pointsTransactions.filter(entry => /^(task|studio):/.test(entry.id) && memberPeriodKey("month",entry.occurred_at || entry.posted_at) === month).reduce((sum,entry) => sum+entry.amount,0));
  }
  function completeTask({ taskId, occurredAt, verified, hardwareActive, newMember, memberCreatedAt } = {}) {
    const task = TASKS[taskId];
    const occurred = new Date(occurredAt).getTime();
    if (!task || !task.points || !verified || !hardwareActive || !Number.isFinite(occurred) || occurred > Date.now() || Date.now() - occurred > 7 * 86400000) return false;
    const period = memberPeriodKey(task.period,occurredAt), id = `task:${taskId}:${period}:reward`;
    if (hasPointsTransaction(id) || (period === memberPeriodKey(task.period) && hasPointsTransaction(`task:${taskId}:reward`) && ["posted","restored"].includes(state.taskStates[taskId]))) return true;
    const assets = getMemberSnapshot({hardwareActive,newMember,memberCreatedAt});
    const amount = Math.min(task.points,regularPointsRemaining(occurredAt));
    if (!recordPointsTransaction({ id,title:task.title,detail:amount < task.points ? "有效行为已确认 · 本月常规积分已达上限" : "有效行为已确认",amount,occurred_at:occurredAt })) return false;
    state.memberAssets = { ...assets,growth:assets.growth+task.growth };
    state.memberAssets = maybeUpgradeMember(state.memberAssets,hardwareActive);
    if (period === memberPeriodKey(task.period)) { state.taskStates[taskId] = "posted"; state.taskPeriods[taskId] = period; }
    persistCommercialState(); return true;
  }
  function selectedRedemption() {
    return REDEMPTION_CATALOG[state.selectedRedemptionId] || REDEMPTION_CATALOG[DEFAULT_REDEMPTION_ID];
  }
  function availablePoints() {
    return state.pendingPointsCorrection > 0 ? 0 : Math.max(0, Number(state.pointsBalance) || 0);
  }
  function hasPointsTransaction(id) {
    return state.pointsTransactions.some((item) => item.id === id);
  }
  function recordPointsTransaction(entry) {
    if (!entry?.id || hasPointsTransaction(entry.id)) return false;
    const amount = Math.trunc(Number(entry.amount) || 0);
    if (amount < 0 && !entry.correction && (state.pendingPointsCorrection > 0 || availablePoints() < -amount)) return false;
    const postedAt = new Date().toISOString();
    const offset = amount > 0 ? Math.min(amount, state.pendingPointsCorrection) : 0;
    state.pendingPointsCorrection -= offset;
    if (amount < 0 && entry.correction && state.pointsBalance + amount < 0) {
      state.pendingPointsCorrection += -(state.pointsBalance + amount);
      state.pointsBalance = 0;
    } else state.pointsBalance = Math.max(0, state.pointsBalance + amount - offset);
    state.pointsMode = state.pendingPointsCorrection > 0 ? "pending" : state.pointsMode === "pending" ? "normal" : state.pointsMode;
    const expires = new Date(postedAt); expires.setUTCMonth(expires.getUTCMonth() + 24);
    state.pointsTransactions.unshift({ ...entry, amount, offset, occurred_at: entry.occurred_at || postedAt, posted_at: postedAt, expires_at: entry.expires_at || expires.toISOString() });
    persistCommercialState();
    return true;
  }
  function removePointsTransaction(id) {
    const entry = state.pointsTransactions.find((item) => item.id === id);
    if (!entry) return false;
    state.pointsTransactions = state.pointsTransactions.filter((item) => item.id !== id);
    state.pointsBalance = Math.max(0, state.pointsBalance - Number(entry.amount || 0));
    persistCommercialState();
    return true;
  }
  function applyRedemptionResult() {
    const item = selectedRedemption();
    if (!item.available) return false;
    const completed = recordPointsTransaction({
      id: `redemption:${item.id}`,
      title: item.title,
      detail: "今天 21:20 · 兑换成功",
      amount: -item.cost,
    });
    if (completed && !state.vouchers.some(voucher => voucher.id === `voucher:${item.id}`)) state.vouchers.push({ id: `voucher:${item.id}`, title: item.title, status: "available" });
    persistCommercialState(); return completed;
  }
  function applyOrderPoints(order = state.orderSnapshot) {
    if (!order?.id || !order.pointsUsed) return false;
    return recordPointsTransaction({
      id: `order:${order.id}:points-used`,
      title: `订单 ${order.id}`,
      detail: "今天 21:26 · 支付成功",
      amount: -Number(order.pointsUsed),
    });
  }
  function applyAfterSalePoints(snapshot = state.afterSaleSnapshot) {
    if (!snapshot?.id || snapshot.type === "换货" || !snapshot.order?.pointsUsed) return false;
    return recordPointsTransaction({
      id: `aftersale:${snapshot.id}:points-restored`,
      title: `售后 ${snapshot.id}`,
      detail: "今天 21:42 · Halo Points 已恢复",
      amount: Number(snapshot.order.pointsUsed),
    });
  }
  function saveOrder(order) {
    state.orders = [order, ...state.orders.filter(item => item.id !== order.id)];
    if (state.orderSnapshot?.id === order.id) state.orderSnapshot = order;
    persistCommercialState();
    return order;
  }
  function paymentPointsAvailable(order) {
    if (order?.coupon && state.couponUsedOrderId && state.couponUsedOrderId !== order.id) return false;
    if (!order?.pointsUsed || hasPointsTransaction(`order:${order.id}:points-used`)) return true;
    const reserved = state.redemptionStatus === "processing" ? selectedRedemption().cost : 0;
    return availablePoints() - reserved >= order.pointsUsed;
  }
  function finishPendingPayment(ctx, expectedOrderId) {
    const order = state.orders.find(item => item.id === expectedOrderId);
    if (!order || order.status !== "processing") return;
    if (!paymentPointsAvailable(order)) {
      saveOrder({ ...order, status: "pending-payment" });
      if (state.orderSnapshot?.id === order.id) state.paymentStatus = "ready";
      ctx.render?.(); return;
    }
    if (order.pointsUsed && !applyOrderPoints(order) && !hasPointsTransaction(`order:${order.id}:points-used`)) return;
    if (order.coupon) state.couponUsedOrderId = order.id;
    saveOrder({ ...order, status: "paid", paidAt: new Date().toISOString() });
    if (state.orderSnapshot?.id === order.id) state.paymentStatus = "success";
    persistCommercialState(); ctx.render?.();
  }
  function getStudioVoucher(eventId) {
    const voucher = state.vouchers.find(item => item.status === "available");
    return voucher ? { ...voucher, eligible: ["yoga-evening", "breath-night"].includes(eventId) } : null;
  }
  function consumeStudioVoucher(eventId, bookingId) {
    if (!bookingId) return false;
    if (state.vouchers.some(voucher => voucher.bookingId === bookingId && voucher.status === "used")) return true;
    const voucher = getStudioVoucher(eventId);
    if (!voucher?.eligible) return false;
    Object.assign(state.vouchers.find(item => item.id === voucher.id), { status: "used", bookingId, eventId, usedAt: new Date().toISOString() });
    persistCommercialState(); return true;
  }
  function restoreStudioVoucher(bookingId) {
    const voucher = state.vouchers.find(item => item.bookingId === bookingId && item.status === "used");
    if (!voucher) return false;
    Object.assign(voucher, { status: "available", bookingId: null, eventId: null });
    persistCommercialState(); return true;
  }
  function awardStudioBenefit({ eventId, bookingId, completed, paid, hardwareActive, occurredAt, newMember, memberCreatedAt } = {}) {
    const occurred = new Date(occurredAt).getTime();
    if (!eventId || !bookingId || !completed || !paid || !hardwareActive || !Number.isFinite(occurred) || occurred > Date.now() || Date.now() - occurred > 7 * 86400000) return false;
    const assets = getMemberSnapshot({hardwareActive,newMember,memberCreatedAt});
    const id = `studio:${bookingId}:reward`;
    if (hasPointsTransaction(id)) return true;
    const month = memberPeriodKey("month",occurredAt);
    if (state.studioAwards.filter(item => item.month === month).length >= 4) return false;
    if (!recordPointsTransaction({ id, title: "Halo Studio 已核验课程", detail: "完成确认 · 100 Points", amount: Math.min(100,regularPointsRemaining(occurredAt)), occurred_at: occurredAt, eventId, bookingId })) return false;
    state.studioAwards.push({ eventId, bookingId, month, occurredAt, growth: 40 });
    state.memberAssets = { ...assets,growth:assets.growth+40 };
    state.memberAssets = maybeUpgradeMember(state.memberAssets,hardwareActive);
    persistCommercialState(); return true;
  }
  function copyWithFeedback(value, successMessage, ctx) {
    if (!navigator.clipboard?.writeText) {
      ctx.flash("当前浏览器没有开放剪贴板权限，请长按内容手动复制");
      return;
    }
    navigator.clipboard.writeText(value)
      .then(() => ctx.flash(successMessage))
      .catch(() => ctx.flash("复制未完成，请允许剪贴板权限后重试"));
  }
  const asyncResumeScheduled = { redemption: false, payment: false };
  function resumeAsyncFlows(ctx = {}) {
    if (state.activationRequest?.status === "processing" && !asyncResumeScheduled.activation) {
      asyncResumeScheduled.activation = true;
      const requestId = state.activationRequest.id;
      setTimeout(() => {
        asyncResumeScheduled.activation = false;
        const request = state.activationRequest;
        if (!request || request.id !== requestId || request.status !== "processing") return;
        if (state.channelIdentity !== "activation-pending" || state.applicationStatus !== "approved" || state.applicationSnapshot?.id !== request.applicationId || !state.channelAgreementConfirmed || !state.activationReady) {
          state.activationRequest.status = "blocked"; persistCommercialState(); ctx.render?.(); return;
        }
        // A local response fixture models the server receipt; real activation requires backend authorization.
        state.channelIdentity = "active"; state.channelMode = "new";
        state.activationRequest = { ...request,status:"completed",completedAt:new Date().toISOString(),mock:true };
        persistCommercialState(); ctx.render?.();
      }, 650);
    }
    if (state.redemptionStatus === "processing" && !asyncResumeScheduled.redemption) {
      asyncResumeScheduled.redemption = true;
      setTimeout(() => {
        asyncResumeScheduled.redemption = false;
        if (state.redemptionStatus !== "processing") return;
        state.redemptionStatus = applyRedemptionResult() ? "success" : "failed";
        persistCommercialState(); ctx.render?.();
      }, 650);
    }
    state.orders.filter(order => order.status === "processing").forEach(order => {
      const key = `payment:${order.id}`;
      if (asyncResumeScheduled[key]) return;
      asyncResumeScheduled[key] = true;
      setTimeout(() => { asyncResumeScheduled[key] = false; finishPendingPayment(ctx, order.id); }, 650);
    });
  }

  const e = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  const actionButton = ([label, action, kind = "secondary", disabled = false]) => `<button class="${e(kind)}" ${action ? `data-action="${e(action)}"` : ""} ${disabled ? 'disabled aria-disabled="true"' : ""}>${e(label)}</button>`;
  const actions = (items) => `<div class="button-row">${items.map(actionButton).join("")}</div>`;
  const feedback = (title, body, tone = "") => `<section class="feedback-card ${e(tone)}" role="status"><span aria-hidden="true"></span><div><strong>${e(title)}</strong><p>${e(body)}</p></div></section>`;
  const summary = (items, title = "") => `<section class="summary-card">${title ? `<h3>${e(title)}</h3>` : ""}<dl class="summary-list">${items.map(([key, value, emphasis = ""]) => `<div class="${e(emphasis)}"><dt>${e(key)}</dt><dd>${e(value)}</dd></div>`).join("")}</dl></section>`;
  const disclosure = (title, body) => `<details class="disclosure"><summary>${e(title)}<span aria-hidden="true">＋</span></summary><div>${body}</div></details>`;
  const top = (item, label) => `<header class="screen-head commercial-head"><div><button class="back" data-action="previous" aria-label="返回上一页">← 返回</button>${label && label !== item.name ? `<span class="page-context">${e(label)}</span>` : ""}<h1>${e(item.name)}</h1></div></header>`;
  const shell = (item, label, body) => `${top(item, label)}<div class="stack commercial-stack">${body}</div>`;
  const metric = (value, label, meta = "") => `<section class="commercial-metric"><span>${e(label)}</span><strong>${e(value)}</strong>${meta ? `<small>${e(meta)}</small>` : ""}</section>`;
  const commercialVisual = (label = "") => {
    const path = /Points|积分|成长|奖励/.test(label) ? '<path d="m12 3 2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2Z"/>'
      : /订单|商品|售后/.test(label) ? '<path d="M5 7h14v12H5Z"/><path d="M8 7a4 4 0 0 1 8 0"/>'
      : /等级|身份|权益/.test(label) ? '<path d="m12 3 7 5v8l-7 5-7-5V8Z"/><path d="M9 12h6"/>'
      : /推荐|邀请|分享/.test(label) ? '<path d="M5 18 19 4M11 4h8v8"/><path d="M18 14v5H5V6h5"/>'
      : /收益|提现|金额/.test(label) ? '<circle cx="12" cy="12" r="8"/><path d="M8.5 8.5h7M12 8.5v8M8.5 12h7"/>'
      : /任务|进度|学习/.test(label) ? '<circle cx="12" cy="12" r="8"/><path d="m8.5 12 2.3 2.3 4.8-5"/>'
      : '<circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="8" opacity=".35"/>';
    return `<svg class="commercial-icon" viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
  };
  const entry = (title, body, meta, action, tone = "") => `<button class="entry-card ${e(tone)}" data-action="${e(action)}"><span class="entry-symbol" aria-hidden="true">${commercialVisual(title)}</span><span class="entry-copy"><small>${e(meta)}</small><strong>${e(title)}</strong><span>${e(body)}</span></span><i aria-hidden="true">›</i></button>`;
  const pill = (label, tone = "") => `<span class="status-pill ${e(tone)}">${e(label)}</span>`;
  const progress = (value, label, meta = "") => `<section class="commercial-progress"><div><span>${e(label)}</span><strong>${e(value)}%</strong></div><progress max="100" value="${Math.max(0, Math.min(100, Number(value)))}" aria-label="${e(label)}"></progress>${meta ? `<p>${e(meta)}</p>` : ""}</section>`;
  const task = (title, reward, status, action, tone = "") => `<button class="task-row visual-task" data-action="${e(action)}"><span class="task-symbol" aria-hidden="true">${tone === "success" ? "✓" : tone === "progress" ? "◔" : "○"}</span><span class="task-copy"><strong>${e(title)}</strong><span>${e(reward)}</span></span>${pill(status, tone)}</button>`;
  const stepper = (steps, current) => `<ol class="journey-steps" aria-label="申请进度">${steps.map((label, index) => `<li class="${index < current ? "done" : index === current ? "current" : ""}"><span>${index < current ? "✓" : index + 1}</span><div><strong>${e(label)}</strong><small>${index < current ? "已完成" : index === current ? "当前步骤" : "待进行"}</small></div></li>`).join("")}</ol>`;
  const commercialRadial = (value, valueLabel, label, note = "") => `<section class="commercial-radial-card"><div class="commercial-radial" style="--commercial-progress:${Math.max(0, Math.min(100, Number(value) || 0))}%"><span><strong>${e(valueLabel)}</strong><small>${e(`${value}%`)}</small></span></div><div><strong>${e(label)}</strong>${note ? `<p>${e(note)}</p>` : ""}</div></section>`;
  const flowStrip = (items, current = 0, tone = "") => `<ol class="flow-strip ${e(tone)}" aria-label="状态流程">${items.map((label, index) => `<li class="${index < current ? "done" : index === current ? "current" : ""}"><span>${index < current ? "✓" : index + 1}</span><small>${e(label)}</small></li>`).join("")}</ol>`;
  const moneyEquation = (parts, result) => `<section class="money-equation" aria-label="金额计算"><div>${parts.map(([value, label], index) => `<span><small>${e(label)}</small><strong>${e(value)}</strong></span>${index < parts.length - 1 ? `<i aria-hidden="true">${index === 0 ? "−" : "−"}</i>` : ""}`).join("")}</div><b aria-hidden="true">=</b><span><small>结果</small><strong>${e(result)}</strong></span></section>`;
  const expiryDistribution = (items) => `<section class="expiry-distribution"><div class="expiry-bar" role="img" aria-label="Halo Points 到期分布">${items.map(([label, value, tone]) => `<i class="${e(tone)}" style="flex:${Math.max(1,Number(value)||1)}" title="${e(`${label} ${value}`)}"></i>`).join("")}</div><div>${items.map(([label, value, tone]) => `<span><i class="${e(tone)}"></i><small>${e(label)}</small><strong>${e(value)}</strong></span>`).join("")}</div></section>`;
  const currentExpiryDistribution = () => {
    const balance = availablePoints();
    const soon = Math.min(800, balance);
    const later = Math.min(1600, Math.max(0, balance - soon));
    const long = Math.max(0, balance - soon - later);
    return expiryDistribution([["30 天内", soon, "soon"], ["90 天内", later, "later"], ["90 天后", long, "long"]]);
  };
  const pointLedgerEntry = (entry) => `<article><span class="ledger-icon ${entry.amount >= 0 ? "plus" : "minus"}">${entry.amount >= 0 ? "＋" : "−"}</span><div><strong>${e(entry.title)}</strong><small>${e(entry.detail)}</small></div><b>${entry.amount >= 0 ? "+" : "−"}${Math.abs(entry.amount).toLocaleString()}</b></article>`;
  const pointLedger = () => {
    const historical = [
      { id: "history:night-scan", title: "晚间身体扫描", detail: "8 月 30 日 21:08", amount: -1200 },
      { id: "history:member-event", title: "会员活动奖励", detail: "8 月 28 日 10:20", amount: 100 },
    ];
    return `<section class="ledger-list">${[...state.pointsTransactions, ...historical].map(pointLedgerEntry).join("")}</section>`;
  };
  const modeLabel = () => state.catalogMode === "display" ? "暂未开售" : state.catalogMode === "presale" ? "预售" : "现货";
  const productCard = (title, status, body, action, visual = "textile", price = "") => `<button class="product-card" data-action="${e(action)}" data-product-keywords="${e(`${title} ${body}`)}"><span class="product-visual visual-${e(visual)}" aria-hidden="true"><i></i></span><span class="product-copy"><small>${e(status)}</small><strong>${e(title)}</strong><span>${e(body)}</span>${price ? `<b>${e(price)}</b>` : ""}</span><i class="product-arrow" aria-hidden="true">›</i></button>`;
  const selectedProduct = () => PRODUCTS[state.selectedProductId] || PRODUCTS.mask;
  const checkoutProduct = () => PRODUCTS[state.checkoutProductId] || selectedProduct();
  const money = () => {
    const subtotal = checkoutProduct().price * Math.max(0, state.cartCount);
    const points = state.pendingPointsCorrection || !state.pointsUsed || availablePoints() < 3000 || subtotal < 100 ? 0 : Math.min(30, Math.floor(subtotal * .3));
    const coupon = state.couponSelected && !state.couponUsedOrderId && subtotal >= 300 ? 20 : 0;
    return { subtotal, points, coupon, payable: Math.max(0, subtotal - points - coupon) };
  };
  const attributionLabel = (type = state.attribution) => type === "member" ? "会员好友推荐" : type === "channel" ? "Halo 体验顾问" : "品牌直营";
  const addressLabel = () => {
    const address = state.addresses.find(item => item.id === state.selectedAddress);
    return address ? `${address.name} · ${address.phone} · ${address.detail}` : state.selectedAddress === "shanghai" ? "林女士 · 138 **** 0000 · 上海市静安区 ****" : "林女士 · 138 **** 0000 · 杭州市西湖区 ****";
  };
  function checkoutSnapshot() {
    const totals = money(), product = checkoutProduct();
    return {
      id: state.checkoutReconfirmId || `HS20260906${String(state.nextOrderSequence).padStart(4, "0")}`,
      productId: product.id, title: product.title, specification: product.specification,
      quantity: Math.max(1, Number(state.cartCount) || 1), subtotal: totals.subtotal,
      coupon: totals.coupon, pointsAmount: totals.points, pointsUsed: totals.points * 100,
      payable: totals.payable, address: addressLabel(),
      attribution: state.attribution, attributionReason: state.attributionReason,
      shipping: product.id === "ring" || state.catalogMode === "presale" ? "预计 11 月 20 日前发货" : "预计 48 小时内发出",
      status: "pending-payment", createdAt: new Date().toISOString()
    };
  }
  function currentOrder() {
    const id = state.selectedOrderId === "latest" ? state.orderSnapshot?.id : state.selectedOrderId;
    const found = state.orders.find(order => order.id === id);
    if (found) return found;
    if (state.selectedOrderId === "ring-presale") return { id: "HS202608280009", title: "HALORING 智能戒指", productId: "ring", specification: "预售订单", quantity: 1, subtotal: 2999, coupon: 0, pointsAmount: 0, pointsUsed: 0, payable: 2999, address: "上海市静安区 ****", attribution: "direct", attributionReason: "本次从官方预售入口进入", shipping: "预计 11 月 20 日前发货", status: "paid" };
    return null;
  }
  function orderAfterSale(order) { return state.afterSales.find(item => item.order.id === order?.id); }
  function saveAfterSale(snapshot) {
    state.afterSales = [snapshot, ...state.afterSales.filter(item => item.id !== snapshot.id)];
    state.afterSaleSnapshot = snapshot; state.afterSaleStatus = snapshot.status;
    const order = state.orders.find(item => item.id === snapshot.order.id);
    if (order) saveOrder({ ...order, afterSaleId: snapshot.id, afterSaleStatus: snapshot.status, afterSaleType: snapshot.type });
    persistCommercialState();
  }
  function isAddressValid() {
    const draft = state.addressDraft;
    return draft.name.trim().length >= 2 && /^1\d{10}$/.test(draft.phone.trim()) && draft.detail.trim().length >= 5;
  }
  function isIdentityValid() {
    return state.identityDraft.name.trim().length >= 2 && state.identityDraft.idNumber.trim().length >= 8 && state.identityConsent;
  }
  function isApplicationValid() {
    return Boolean(state.applicationDraft.region && state.applicationDraft.experience && state.applicationDraft.payeeType && state.applicationConsent);
  }

  function taskStatusLabel(status, taskItem) {
    return ({ posted: "已到账", restored: "已恢复", validating: "确认中", adjusted: "已调整", reviewing: "复核中" })[status] || taskItem.progress;
  }
  function referralLink() { const url = new URL(location.href); url.hash = "REF-01"; url.searchParams.set("ref","HALO-8K2M"); return url.href; }
  function member(item, ctx) {
    refreshTaskPeriods();
    const active = ctx.hardwareActive;
    const retained = ctx.membershipState === "unbound-retained";
    const neverBound = !active && !retained;
    const assets = getMemberSnapshot(ctx);
    const currentLevel = assets.level.split("（")[0];
    const levelCode = assets.level.match(/L\d/)?.[0] || "L1";
    if (item.id === "PTS-04" && state.pointsMode === "pending") return shell(item, "Halo Points 兑换", `${feedback("当前暂不能兑换", "待处理的 Halo Points 清零后，抵扣和兑换会恢复；其他功能不受影响。", "warm")}${summary([["兑换内容", selectedRedemption().title], ["当前状态", "Halo Points 待处理"]])}${actions([["查看调整详情", "go:PTS-02", "primary"], ["返回兑换专区", "go:PTS-03", "secondary"]])}`);
    const taskGrowth = ["posted", "restored"].includes(state.taskStatus) ? 8 : 0;
    const growth = assets.growth;
    const badgeMeta = neverBound ? "激活硬件后开始记录" : `${assets.badges} 枚${retained ? "已保留" : "已获得"}`;
    const levelIndex = Math.max(0,Number(levelCode.slice(1))-1), levelThresholds = [0,600,2000,5000,10000,20000], nextTarget = levelThresholds[Math.min(5,levelIndex+1)];
    const points = availablePoints();
    const redemption = selectedRedemption();
    const redemptionAfterBalance = Math.max(0, points - redemption.cost);
    const pages = {
      "MEM-01": () => shell(item, "会员", `<section class="member-hero"><div class="identity-line"><span>${e(levelCode)}</span><small>当前等级</small></div><h2>${e(currentLevel)}</h2><p>${active ? ctx.newMember ? "从今天开始记录新的佩戴与行动。" : "查看有效佩戴与本期任务，奖励确认后会显示到账记录。" : retained ? "已有等级、成长和徽章已保留；重新激活后继续记录未来成长。" : "会员权益已开启；激活 Halo Ring 后开始记录未来成长。"}</p><div class="hero-facts"><div><span>HALO成长值</span><strong>${e(growth.toLocaleString())}</strong></div><div><span>Halo Points</span><strong>${e(points.toLocaleString())}</strong></div></div></section>${active ? `<section class="next-action-card visual-next-action"><span>今天最接近完成</span>${commercialRadial(["posted","restored"].includes(state.taskStates["wear-12h"]) ? 100 : ctx.newMember ? 0 : 89, ["posted","restored"].includes(state.taskStates["wear-12h"]) ? "已完成" : ctx.newMember ? "0h" : "10h42", "有效佩戴", "+8 成长 · +20 Points")}${actions([["查看任务进度", "commercial:task-open:wear-12h", "primary"]])}</section>` : feedback(retained ? "成长已暂停" : "成长尚未开始", retained ? "重新绑定并激活 Halo Ring 后，继续记录新的成长。" : "绑定并激活 Halo Ring 后，从那一刻开始记录新的成长。", "warm")}<section class="entry-section"><h3>会员账户</h3>${entry("等级与权益", `${currentLevel} · 查看下一等级`, "当前身份", "go:MEM-02", "warm")}${entry("Halo Points", "余额、临期提醒与兑换", `${points.toLocaleString()} 可用`, "go:PTS-01")}${entry("成长徽章", "查看长期习惯留下的记录", badgeMeta, "go:MEM-06")}</section><section class="entry-section"><h3>更多</h3>${entry("全部任务", "今天、本周与本月", active ? "持续成长" : "需激活 Halo Ring", "go:MEM-04")}${entry("邀请朋友", "分享 Halo，查看推荐进度", "会员推荐", "go:REF-01")}</section>`),
      "MEM-02": () => shell(item,"等级", `<section class="level-focus"><span>当前等级</span><h2>${e(currentLevel)} · ${e(levelCode)}</h2><p>${active ? "成长按已确认的有效行为累计。" : retained ? "已获等级与成长保留，未来成长暂时暂停。" : "激活 Halo Ring 后开始累计成长。"}</p>${progress(Math.min(100,Math.floor(growth/nextTarget*100)),`${growth.toLocaleString()} / ${nextTarget.toLocaleString()} HALO成长值`)}</section><section class="level-path">${[["L1","Halo Member","注册并确认协议"],["L2","Halo Premier","600 HALO成长值"],["L3","Halo Signature","2,000 HALO成长值"],["L4","Halo Prestige","5,000 HALO成长值与 2 枚徽章"],["L5","Halo Muse","10,000 HALO成长值与正式共创"],["L6","Halo Luminary","20,000 HALO成长值、3 枚徽章与深度共创"]].map(([code,name,condition],index) => `<div class="level-row ${index === levelIndex ? "current" : index < levelIndex ? "completed" : ""}"><span>${code}</span><div><strong>${name}</strong><small>${condition}</small></div><b>${index === levelIndex ? "当前" : index < levelIndex ? "已获得" : ""}</b></div>`).join("")}</section>${feedback("核心健康功能不受等级限制","仍需支持的硬件、相应授权与有效数据。","sage")}${actions([["查看升级条件","go:MEM-03","primary"],["查看当前权益","go:MEM-07","secondary"]])}`),
      "MEM-03": () => shell(item,"升级", `${summary([["当前等级",`${currentLevel} · ${levelCode}`],["已获成长",growth.toLocaleString()],["下一门槛",nextTarget.toLocaleString()],["还差成长",Math.max(0,nextTarget-growth).toLocaleString()],["硬件状态",active ? "已激活" : retained ? "已解绑，成长暂停" : "尚未激活"]],"升级进度")}${progress(Math.min(100,Math.floor(growth/nextTarget*100)),"前往下一等级")}${levelIndex >= 2 ? feedback("还需满足对应附加条件",levelIndex === 2 ? "Halo Prestige 需要任意 2 枚成长徽章。" : "共创和徽章条件以等级路径为准。","plain") : ""}${feedback("满足条件后自动升级","新权益从升级实际生效时开始，不追溯之前的订单与权益。","sage")}${assets.effectiveAt ? summary([["最近升级生效",assets.effectiveAt]]) : ""}${actions([[active ? "查看可完成任务" : "绑定 Halo Ring",active ? "go:MEM-04" : "go:DEV-01","primary"],["查看等级路径","go:MEM-02","secondary"]])}`),
      "MEM-04": () => shell(item, "任务", `<div class="chip-row" role="tablist">${[["today","今天"],["week","本周"],["month","本月"]].map(([value,label]) => `<button role="tab" aria-selected="${state.taskPeriod === value}" class="${state.taskPeriod === value ? "active" : ""}" data-action="commercial:task-period:${value}">${label}</button>`).join("")}</div><section class="task-list">${Object.entries(TASKS).filter(([,taskItem]) => taskItem.period === state.taskPeriod).map(([id,taskItem]) => task(taskItem.title, taskItem.points ? `+${taskItem.growth} 成长 · +${taskItem.points} Points` : "以邀约任务公布为准", !active ? "需激活 Halo Ring" : ctx.newMember && (state.taskStates[id] || "available") === "available" ? "尚未开始" : taskStatusLabel(state.taskStates[id] || "available", taskItem), `commercial:task-open:${id}`, ["posted","restored"].includes(state.taskStates[id]) ? "success" : "")).join("")}</section>${disclosure("奖励与到账", "<p>完成有效行为并确认后到账。刷新只查询进度，不会代替任务完成。</p>")}`),
      "MEM-05": () => {
        const taskItem = TASKS[state.selectedTaskId] || TASKS["wear-12h"], status = state.taskStates[state.selectedTaskId] || "available";
        return shell(item, "任务详情", `${summary([["任务",taskItem.title],["进度",active ? ctx.newMember && status === "available" ? "尚未开始" : taskStatusLabel(status, taskItem) : "激活后开始"],["奖励",taskItem.points ? `${taskItem.growth} HALO成长值 · ${taskItem.points} Halo Points` : "以正式邀约公布为准"]])}${feedback(["posted","restored"].includes(status) ? "奖励已到账" : status === "validating" ? "奖励确认中" : status === "adjusted" ? "奖励已调整" : status === "reviewing" ? "复核中" : "继续完成这项任务", ["posted","restored"].includes(status) ? "完成和到账记录已保存在积分明细。" : status === "adjusted" ? "重复记录对应的奖励已撤回。可在通知后 15 个自然日内联系企业微信申请复核。" : status === "reviewing" ? "复核期间调整继续生效，结果会保留在这里。" : active ? "有效进度确认后会更新，刷新不会增加进度。" : "绑定并激活 Halo Ring 后记录新的行为。", "plain")}${actions([[!active ? "绑定 Halo Ring" : ["posted","restored"].includes(status) ? "查看积分明细" : "去完成任务", !active ? "go:DEV-01" : ["posted","restored"].includes(status) ? "go:PTS-02" : `go:${taskItem.route}`, "primary"],["刷新进度","commercial:task-refresh","secondary"],[status === "adjusted" ? "通过企业微信申请复核" : "返回任务中心",status === "adjusted" ? "commercial:task-appeal" : "go:MEM-04","secondary"]])}${disclosure("计算与记录", "<p>按北京时间归属账期，同一账号同一行为只记录一次。绑定期间 7 个自然日内的有效补同步按发生日期归属；新权益从实际到账时间起生效。</p>")}`);
      },
      "MEM-06": () => shell(item, "徽章", neverBound || !assets.badges ? `<section class="empty-state"><span aria-hidden="true">○</span><h2>${active ? "还没有获得徽章" : "徽章尚未开始"}</h2><p>激活 Halo Ring 后，未来的有效行动会开始记录徽章进度。</p></section>${actions([["绑定 Halo Ring", "go:DEV-01", "primary"], ["返回会员中心", "go:MEM-01", "secondary"]])}` : `<section class="badge-feature earned"><span aria-hidden="true">✓</span><div><small>${retained ? "已保留" : "已获得"}</small><h2>会员贡献</h2><p>获得于 2026 年 8 月 18 日</p></div></section>${retained ? feedback("已获得的徽章会保留", "重新激活后，新的徽章进度会继续记录。", "sage") : `<div class="badge-grid">${[["长期同行","96 / 180 个有效佩戴日",53],["修复习惯","38 / 60 次睡前修复",63],["身体理解","8 / 12 周状态反馈",67],["品牌参与","4 / 6 次活动",67]].map(([name,label,value]) => `<section class="badge-card"><span aria-hidden="true">○</span><strong>${e(name)}</strong><small>${e(label)}</small><progress max="100" value="${value}" aria-label="${e(name)}进度"></progress></section>`).join("")}</div>`}${disclosure("关于永久徽章", `<p>正常不活跃、解绑或更换设备，不会让已获得的徽章消失。</p>`)}`),
      "MEM-07": () => shell(item, "权益", `<section class="benefit-current"><span>${e(levelCode)}</span><div><small>当前等级</small><h2>${e(currentLevel)}</h2><p>${`符合条件的实付金额按 ${[1,1.1,1.2,1.3,1.5,2][levelIndex]}×累计 Halo Points`}</p></div></section><section class="entry-section"><h3>现在可用</h3>${neverBound ? `${entry("公开内容", "浏览公开课程与基础内容", "可用", "go:STU-08", "sage")}${entry("公开活动", "按活动页公布的名额报名", "可用", "go:STU-08", "sage")}` : `${entry("会员内容", "深度内容与公开课程优先入口", "可用", "go:STU-08", "sage")}${entry("活动优先报名", "权益以单次活动页公布为准", "可用", "go:STU-08", "sage")}`}</section>${disclosure("Halo Points 怎样累计", `<p>只按符合条件的实付商品金额计算；Halo Points 抵扣、优惠券、运费和退款金额不计入。具体结果以订单结算页为准。</p>`)}${disclosure("下一等级将增加什么", neverBound ? `${entry("会员内容", "到达 Halo Premier 后开放", "L2", "go:MEM-03")}${entry("活动优先报名", "到达 Halo Premier 后开放", "L2", "go:MEM-03")}` : `${entry("个性化报告模板", "到达 Halo Signature 后开放", "L3", "go:MEM-03")}${entry("Halo Private Care", "到达 Halo Prestige 后开放", "L4", "go:MEM-02")}`)}${feedback("没有订阅或永久折扣", "课程、活动与体验按单次活动页公布；同一商品对所有会员使用相同公开价格。", "plain")}`),
      "PTS-01": () => shell(item, "Halo Points", `<section class="points-hero ${state.pointsMode === "pending" ? "blocked" : ""}"><small>${state.pointsMode === "pending" ? "当前可用" : "可用 Halo Points"}</small><h2>${e(points.toLocaleString())}</h2><p>${state.pointsMode === "pending" ? `仍有 ${state.pendingPointsCorrection.toLocaleString()} Points 待处理` : `约可抵 ¥${Math.floor(points / 100)} · 不可提现`}</p></section>${state.pointsMode === "pending" ? `${feedback("Halo Points 使用暂时暂停", "之后新获得的 Points 会先完成这次调整；完成前不能抵扣或兑换，也不会向你追讨现金。其他功能不受影响。", "danger")}${actions([["查看调整详情", "go:PTS-02", "primary"], [state.pointsAppealSubmitted ? "申诉已提交" : "通过企业微信申诉", state.pointsAppealSubmitted ? "" : "commercial:points-appeal", "secondary", state.pointsAppealSubmitted]])}` : `${currentExpiryDistribution()}<section class="entry-section">${entry("Halo Points 兑换", "内容、体验与活动名额", "去使用", "go:PTS-03", "warm")}${entry("Halo Points 明细", "奖励、使用与到期记录", "查看全部", "go:PTS-02")}</section>${disclosure("Halo Points 怎么使用", `<p>普通商品每单最多抵扣现金售价的 30%；指定内容可以使用全额 Halo Points 兑换。Halo Points 不能充值、提现或折现。</p>`)}`}`),
      "PTS-02": () => shell(item, "Halo Points 明细", state.pointsMode === "pending" ? `${feedback(state.pointsAppealSubmitted ? "申诉已提交，本次调整仍然生效" : "可用 Halo Points 已调整为 0", `仍有 ${state.pendingPointsCorrection.toLocaleString()} Halo Points 待冲正；新获得的 Points 会优先抵扣，剩余部分才进入可用余额。`, "danger")}${summary([["原因", "订单退款"], ["关联订单", "尾号 4821"], ["调整数量", "−1,200 Halo Points", "total"], ["生效时间", "9 月 1 日 09:12"], ["当前状态", state.pointsAppealSubmitted ? "复核中" : "可在 9 月 16 日前申诉"]], "本次调整")}${disclosure("申诉期间会怎样", `<p>申诉期间本次调整继续生效。复核有误时会恢复 Points；原有效期不足 30 天或已经过期时，恢复后可使用 30 天。</p>`)}${actions([[state.pointsAppealSubmitted ? "申诉已提交" : "通过企业微信申诉", state.pointsAppealSubmitted ? "" : "commercial:points-appeal", "primary", state.pointsAppealSubmitted], ["返回 Halo Points", "go:PTS-01", "secondary"]])}` : state.pointsMode === "restored" ? `${feedback("1,200 Halo Points 已恢复", "复核确认本次调整有误，Points 已经重新可用。", "sage")}${summary([["恢复数量", "+1,200 Halo Points", "total"], ["恢复时间", "9 月 1 日 14:20"], ["新的使用期", "至 10 月 1 日 · 30 天"]], "复核结果")}${actions([["返回 Halo Points", "go:PTS-01", "primary"], ["进入兑换专区", "go:PTS-03", "secondary"]])}` : `${pointLedger()}${disclosure("查看 Halo Points 有效期", `<p>每笔获得的 Halo Points 都有自己的有效期。系统会优先使用更早到期的 Points。</p>`)}${actions([["进入兑换专区", "go:PTS-03", "primary"], ["返回 Halo Points", "go:PTS-01", "secondary"]])}`),
      "PTS-03": () => shell(item, "Halo Points 兑换", state.pointsMode === "pending" ? `${feedback("兑换暂时不可用", "Halo Points 调整完成后会自动恢复；你仍可浏览内容。", "warm")}${entry("Halo Studio 公开体验券", "指定公开场次使用", "6,000 Halo Points", `commercial:redeem-select:${DEFAULT_REDEMPTION_ID}`)}` : `<section class="redeem-feature"><small>公开体验</small><h2>Halo Studio 公开体验券</h2><p>兑换后可在指定的 Halo Studio 公开场次中使用一次。</p><b>6,000 Halo Points</b>${actions([["查看并兑换", `commercial:redeem-select:${DEFAULT_REDEMPTION_ID}`, "primary"]])}</section><section class="entry-section"><h3>更多兑换</h3>${entry("会员活动优先名额", "名额开放时可兑换", "8,000 Halo Points", "commercial:redeem-select:member-event-priority")}${entry("限定活动纪念礼", "活动页公布时开放", "12,000 Halo Points", "commercial:redeem-select:limited-event-gift")}</section>`),
      "PTS-04": () => shell(item, "兑换", !redemption.available ? `${sectionProductSummary(redemption)}${feedback("暂未开放兑换", redemption.unavailableCopy, "warm")}${summary([["兑换内容", redemption.title], ["所需 Halo Points", redemption.cost.toLocaleString()], ["使用方式", redemption.usage]], "开放后可核对")}${actions([["返回兑换专区", "go:PTS-03", "primary"]])}` : state.redemptionStatus === "success" ? `<section class="result-card success"><span aria-hidden="true">✓</span><h2>兑换成功</h2><p>${e(redemption.delivery)}</p></section>${summary([["兑换内容", redemption.title], ["使用 Halo Points", redemption.cost.toLocaleString()], ["剩余 Halo Points", points.toLocaleString(), "total"]])}${actions([[redemption.resultAction[0], redemption.resultAction[1], "primary"], ["继续兑换", "go:PTS-03", "secondary"]])}` : state.redemptionStatus === "processing" ? `${sectionWaiting("正在兑换", "请稍候，不要重复提交。")}${summary([["兑换内容", redemption.title], ["所需 Halo Points", redemption.cost.toLocaleString()]])}${actions([["返回兑换专区", "go:PTS-03", "secondary"]])}` : state.redemptionStatus === "failed" ? `${sectionFailure("兑换未完成", "Halo Points 尚未扣除，请检查网络后重试。")}${actions([["重新兑换", "commercial:redeem-retry", "primary"], ["返回兑换专区", "go:PTS-03", "secondary"]])}` : `${sectionProductSummary(redemption)}${summary([["所需 Halo Points", redemption.cost.toLocaleString(), "total"], ["兑换后余额", `${redemptionAfterBalance.toLocaleString()} Halo Points`], ["使用方式", redemption.usage]], "确认信息")}${feedback(points < redemption.cost ? "Halo Points 不足" : "确认后立即扣除", points < redemption.cost ? `还需要 ${(redemption.cost - points).toLocaleString()} Halo Points。` : "确认前请查看使用期限与退回条件；是否可退以本次兑换说明为准。", points < redemption.cost ? "warm" : "plain")}${actions([["确认兑换", points >= redemption.cost ? "commercial:redeem" : "", "primary", points < redemption.cost], ["返回兑换专区", "go:PTS-03", "secondary"]])}`),
      "REF-01": () => shell(item, "会员推荐", `<section class="referral-card"><small>会员推荐</small><h2>20,000 Halo Points</h2><p>好友完成符合条件的购买、注册与激活后发放。已激活硬件的推荐人还可获得 150 成长。</p></section>${flowStrip(["分享","支付","激活","奖励"],2,"referral")}${state.referralQrShown ? `<section class="summary-card"><h3>你的推荐入口</h3><p>推荐码：HALO-8K2M</p><p style="overflow-wrap:anywhere">${e(referralLink())}</p><small>本地原型示例，正式推荐链接由 Halo 签发。</small>${actions([["复制推荐信息","commercial:referral-copy","secondary"]])}</section>` : ""}${entry("好友已支付，等待激活","仅展示推荐进度，不展示好友订单与个人资料","进行中","commercial:referral-progress","warm")}${state.referralProgressShown ? summary([["推荐记录","REF-001 · 示例"],["支付","已确认"],["注册与激活","等待完成"],["奖励","尚未发放"],["下一步","好友完成激活后，等待订单确认"]],"推荐进度") : ""}${disclosure("奖励条件", "<p>真实新会员推荐，每个北京时间自然年最多 12 位。同一订单不与渠道现金收益叠加。取消、全额退款或无效推荐不发放。</p>")}${actions([[state.referralQrShown ? "收起推荐入口" : "分享推荐入口","commercial:referral-qr","primary"],["返回会员中心","go:MEM-01","secondary"]])}`),
    };
    return pages[item.id]?.() || "";
  }

  function sectionResult(title, value, time) {
    return `<section class="result-inline"><span aria-hidden="true">✓</span><div><strong>${e(title)}</strong><b>${e(value)}</b><small>${e(time)}</small></div></section>`;
  }

  function sectionProductSummary(item = selectedRedemption()) {
    return `<section class="product-summary"><span class="product-visual visual-audio" aria-hidden="true"><i></i></span><div><small>${e(item.context)}</small><strong>${e(item.shortTitle)}</strong><span>${e(item.usage)}</span></div></section>`;
  }

  function afterSaleLabel(snapshot) {
    return ({ submitted: "申请已提交", reviewing: "正在审核", "return-required": "等待寄回", refunding: "退款处理中", exchanging: "换货寄送中", completed: snapshot.type === "换货" ? "换货已完成" : "退款已完成", rejected: "申请未通过", failed: "暂时无法更新" })[snapshot.status] || "处理中";
  }
  function afterSaleAmounts(order,type) {
    return type === "换货" ? summary([["本次现金退款","¥0"],["积分恢复","无，原支付保持不变"],["处理方式","审核通过后换发商品"]],"换货说明") : summary([["预计原路退款",`¥${order.payable}`],["预计积分恢复",`${order.pointsUsed} Points`]],"退款构成");
  }
  function select(item) {
    const m = money();
    const status = modeLabel();
    const productPrice = state.catalogMode === "display" ? "" : "¥399";
    const shipping = state.catalogMode === "presale" ? "预计 11 月 20 日前发货" : "预计 48 小时内发出";
    if (state.catalogMode === "display" && ["SEL-04", "SEL-05", "SEL-09"].includes(item.id)) {
      return shell(item, "Halo Select", `${feedback("此商品暂未开放购买", "当前不能提交订单或支付；开放购买后可重新确认库存、价格和发货时间。", "warm")}${actions([["返回商品详情", "go:SEL-03", "primary"], ["继续浏览", "go:SEL-02", "secondary"]])}`);
    }
    const pages = {
      "SEL-01": () => shell(item, "Halo Select", `<section class="select-story"><small>睡前环境灵感 · 公开内容</small><h2>减少睡前光线干扰</h2><p>这是面向所有用户的日常环境提示，不读取 Body Weather、健康数据或 Halo 对话。</p><button data-action="commercial:category:sleep">查看睡眠场景用品 →</button></section>${productCard("夜间舒缓眼罩", `${status} · Halo Select 甄选`, "柔软遮光，减少睡前环境中的光线干扰", "commercial:product-open:mask", "textile", productPrice)}<section class="series-section"><div><h3>按场景选</h3><button data-action="go:SEL-02">查看全部系列</button></div><div class="series-grid">${[["sleep","睡眠","慢下来"],["nutrition","营养","照顾日常"],["skin","肌肤","温柔接触"],["scent","嗅觉","营造氛围"]].map(([value,label,body]) => `<button data-action="commercial:category:${value}"><span class="series-mark ${value}" aria-hidden="true"></span><strong>${label}</strong><small>${body}</small></button>`).join("")}</div></section><section class="quick-links">${entry("购物车", state.cartCount ? `${state.cartCount} 件商品` : "暂时为空", "购买", "go:SEL-04")}${entry("我的订单", "查看物流与售后", "订单", "go:SEL-10")}</section>`),
      "SEL-02": () => shell(item, "Halo Select", `<label class="search-product"><span class="sr-only">搜索商品</span><input id="catalog-search" class="field" type="search" placeholder="搜索商品或场景" autocomplete="off"><i aria-hidden="true">⌕</i></label><div class="chip-row" role="tablist">${[["all","全部"],["sleep","睡眠"],["nutrition","营养"],["skin","肌肤"],["scent","嗅觉"]].map(([value,label]) => `<button role="tab" aria-selected="${state.category === value}" class="${state.category === value ? "active" : ""}" data-action="commercial:category:${value}">${label}</button>`).join("")}</div><section class="catalog-list">${(state.category === "all" || state.category === "sleep") ? productCard("夜间舒缓眼罩", `${status} · Halo Select 甄选`, "减少睡前环境中的光线干扰", "commercial:product-open:mask", "textile", productPrice) : ""}${(state.category === "all" || state.category === "nutrition") ? productCard("CHRONO KEY 女性益生菌", "暂未开售", "每日一份的营养补充选择", "commercial:product-open:nutrition", "nutrition") : ""}${(state.category === "all" || state.category === "scent") ? productCard("空间舒缓香气", "暂未开售", "用于晚间空间的轻柔香气", "commercial:product-open:aroma", "scent") : ""}${(state.category === "all" || state.category === "skin") ? productCard("夜间身体护理", "暂未开售", "适合睡前使用的身体护理", "commercial:product-open:skin", "skin") : ""}</section><p id="catalog-empty" class="empty-copy" hidden>没有找到匹配内容，换一个关键词试试。</p>`),
      "SEL-03": () => { const product = selectedProduct(), displayOnly = product.displayOnly || state.catalogMode === "display"; return shell(item,"商品", `<section class="product-detail-hero"><span class="product-stilllife visual-${e(product.visual)}" aria-hidden="true"><i></i></span><div><small>${displayOnly ? "暂未开售" : product.id === "ring" ? "预售" : e(status)} · Halo Select</small><h2>${e(product.title)}</h2><p>${product.id === "mask" ? "柔软亲肤的遮光设计，为睡前空间减少光线干扰。" : "了解这件商品的规格、使用方式与当前发售状态。"}</p>${!displayOnly ? `<b>¥${product.price}</b>` : ""}</div></section>${summary([["规格",product.specification],["发货",displayOnly ? "开放购买时公布" : product.id === "ring" ? "预计 11 月 20 日前" : shipping],["售后","Halo 统一承接"]],"商品信息")}${displayOnly ? `${feedback("暂未开放购买","可以先了解商品。价格和交付时间公布后再决定。","warm")}${actions([["继续浏览","go:SEL-02","primary"]])}` : `${feedback("本地交互原型","此处仅模拟下单，不会产生真实交易。","plain")}${actions([["立即购买","commercial:buy-now","primary"],["加入购物车","commercial:add-cart","secondary"]])}`}`); },

      "SEL-04": () => { const product = PRODUCTS[state.cartProductId] || PRODUCTS.mask; return shell(item,"购物车", state.cartCount < 1 ? `<section class="empty-state"><h2>购物车还是空的</h2><p>返回 Halo Select 继续浏览。</p></section>${actions([["继续选购","go:SEL-01","primary"]])}` : `<section class="cart-line"><span class="product-visual visual-${e(product.visual)}" aria-hidden="true"><i></i></span><div><strong>${e(product.title)}</strong><span>${e(product.specification)}</span><b>¥${product.price}</b></div><div class="quantity" aria-label="商品数量"><button data-action="commercial:cart-dec" aria-label="减少数量">−</button><span>${state.cartCount}</span><button data-action="commercial:cart-inc" aria-label="增加数量">＋</button></div></section>${summary([["商品小计",`¥${product.price * state.cartCount}`]])}${actions([["去结算","commercial:cart-checkout","primary"],["继续选购","go:SEL-01","secondary"]])}`); },
      "SEL-05": () => { const product = checkoutProduct(); return shell(item,"确认订单", `<button class="address-card" data-action="go:SEL-07"><span><small>送至</small><strong>${e(addressLabel())}</strong></span><i aria-hidden="true">›</i></button><section class="checkout-product"><span class="product-visual visual-${e(product.visual)}" aria-hidden="true"><i></i></span><div><strong>${e(product.title)}</strong><span>${e(product.specification)} × ${Math.max(1,state.cartCount)}</span></div><b>¥${m.subtotal}</b></section><section class="entry-section">${entry("优惠券",m.coupon ? "本单已减 ¥20" : "查看可用优惠","优惠","go:SEL-06")}${entry("订单来源",attributionLabel(),"系统已判定","go:SEL-08")}</section>${state.pendingPointsCorrection ? feedback("Halo Points 暂不可用","本单不使用积分，其他支付不受影响。","warm") : `<label class="points-switch"><span><strong>使用 3,000 Halo Points</strong><small>${m.points ? "本单抵扣 ¥30" : availablePoints() < 3000 ? "当前积分不足 3,000" : "本次不使用"}</small></span><input type="checkbox" data-action="commercial:points-use" ${state.pointsUsed ? "checked" : ""} ${availablePoints() < 3000 ? "disabled" : ""} aria-label="使用 3000 Halo Points"></label>`}${moneyEquation([[`¥${m.subtotal}`,"商品"],[`¥${m.coupon}`,"优惠"],[`¥${m.points}`,"Points"]],`¥${m.payable}`)}${summary([["商品金额",`¥${m.subtotal}`],["优惠券",`−¥${m.coupon}`],["Halo Points 抵扣",`−¥${m.points}`],["应付",`¥${m.payable}`,"total"]],"金额明细")}${feedback("本地交互原型","支付仅作流程演示，不会扣取真实款项。","plain")}${actions([[`${state.checkoutReconfirmId ? "确认更新金额" : "提交订单"} · ¥${m.payable}`,"commercial:submit-order","primary", state.cartCount < 1 || product.displayOnly]])}`); },
      "SEL-06": () => shell(item, "优惠券", state.couponUsedOrderId ? `${feedback("暂无可用优惠券","会员活动券已用于之前的订单。","plain")}${actions([["返回订单","go:SEL-05","primary"]])}` : `<button class="coupon-card ${state.couponSelected ? "selected" : ""}" data-action="commercial:coupon-toggle"><span><small>会员活动券</small><strong>满 300 减 20</strong><p>2026 年 10 月 1 日前可用</p></span><i aria-hidden="true">${state.couponSelected ? "✓" : "○"}</i></button><section class="coupon-card disabled" aria-disabled="true"><span><small>预售专用券</small><strong>满 500 减 40</strong><p>当前商品不适用</p></span><i aria-hidden="true">—</i></section>${feedback(state.couponSelected ? "本单已减 ¥20" : "暂未使用优惠券", state.couponSelected ? "返回订单后会看到更新后的实付金额。" : "你可以不使用优惠券继续结算。", "sage")}${actions([["返回订单", "go:SEL-05", "primary"]])}`),
      "SEL-07": () => shell(item, "收货地址", `${state.addresses.map(address => `<button class="address-option ${state.selectedAddress === address.id ? "selected" : ""}" data-action="commercial:address-select:${e(address.id)}"><span><strong>${e(address.name)} · ${e(address.phone)}</strong><p>${e(address.detail)}</p></span><i aria-hidden="true">${state.selectedAddress === address.id ? "✓" : "○"}</i></button>`).join("")}<button class="address-option ${state.selectedAddress === "shanghai" ? "selected" : ""}" data-action="commercial:address-select:shanghai"><span><small>默认</small><strong>林女士 · 138 **** 0000</strong><p>上海市静安区 ****</p></span><i aria-hidden="true">${state.selectedAddress === "shanghai" ? "✓" : "○"}</i></button><button class="address-option ${state.selectedAddress === "hangzhou" ? "selected" : ""}" data-action="commercial:address-select:hangzhou"><span><strong>林女士 · 138 **** 0000</strong><p>杭州市西湖区 ****</p></span><i aria-hidden="true">${state.selectedAddress === "hangzhou" ? "✓" : "○"}</i></button>${state.addressFormOpen ? `<section class="summary-card"><h3>新增收货地址</h3><label class="field-label">收货人<input id="address-name" class="field" value="${e(state.addressDraft.name)}" autocomplete="name"></label><label class="field-label">手机号<input id="address-phone" class="field" inputmode="tel" value="${e(state.addressDraft.phone)}" autocomplete="tel"></label><label class="field-label">详细地址<textarea id="address-detail" class="field" placeholder="街道、门牌号" autocomplete="street-address">${e(state.addressDraft.detail)}</textarea></label>${state.addressError ? feedback("还不能保存", state.addressError, "warm") : ""}${actions([["保存地址", "commercial:address-save", "primary", !isAddressValid()], ["取消", "commercial:address-form:close", "secondary"]])}</section>` : actions([["新增地址", "commercial:address-form:open", "primary"], ["使用所选地址", "go:SEL-05", "secondary"]])}`),
      "SEL-08": () => shell(item, "订单来源说明", `${sectionResult("系统已判定", attributionLabel(), "支付完成后冻结")}${summary([["判定结果", attributionLabel()], ["判定依据", state.attributionReason], ["是否影响价格", "不会"]], "本次订单")}${feedback("订单来源无需你选择", "系统会根据有效进入路径和已确认关系，只为这笔订单记录一个来源。", "sage")}${disclosure("为什么只能有一个来源", `<p>同一订单不会同时产生会员推荐奖励和体验顾问服务收益。如结果与你的实际情况不符，可在支付前联系 Halo 客服核对。</p>`)}${actions([["返回确认订单", "go:SEL-05", "primary"], ["来源有疑问", "go:HELP-03", "secondary"]])}`),
      "SEL-09": () => { const order = state.orderSnapshot && state.orders.find(row => row.id === state.orderSnapshot.id); if (!order) return shell(item,"支付", `${feedback("尚无待支付订单","请先确认商品、地址与应付金额。","plain")}${actions([["查看购物车","go:SEL-04","primary"]])}`); if (order.status === "paid") return shell(item,"支付", `${sectionResult("模拟支付成功",`¥${order.payable}`,order.id)}${actions([["查看订单",`commercial:open-order:${order.id}`,"primary"],["返回 Halo Select","go:SEL-01","secondary"]])}`); if (!paymentPointsAvailable(order)) return shell(item,"支付", `${feedback(order.coupon && state.couponUsedOrderId ? "优惠券已用于另一笔订单" : "积分余额已变化","本次没有扣款。请重新确认订单金额，不会自动增加应付金额。","warm")}${summary([["原待付",`¥${order.payable}`],["原抵扣",`${order.pointsUsed} Points`],["可用积分",availablePoints().toLocaleString()]])}${actions([["重新确认订单金额","commercial:reconfirm-order","primary"],["返回订单",`commercial:open-order:${order.id}`,"secondary"]])}`); return shell(item,"支付", order.status === "processing" ? sectionWaiting("正在确认模拟支付","退出或刷新后仍可从订单继续查看。") : `<section class="payment-card"><small>本次应付 · 模拟支付</small><strong>¥${order.payable}</strong><p>${e(order.title)} × ${order.quantity}</p></section>${summary([["订单号",order.id],["积分抵扣",`${order.pointsUsed} Points`],["订单来源",attributionLabel(order.attribution)]])}${["failed","cancelled"].includes(state.paymentStatus) ? feedback("本次未付款","订单已保留，可以继续支付。","warm") : ""}${actions([[`确认模拟支付 ¥${order.payable}`,"commercial:payment-confirm","primary"],["稍后支付","commercial:payment-cancel","secondary"]])}`); },
      "SEL-10": () => { const filter = state.orderFilter; const cards = state.orders.filter(order => filter === "all" || (orderAfterSale(order) ? filter === "aftersale" : ["pending-payment","processing"].includes(order.status) ? filter === "pending" : filter === "receiving")).map(order => orderCard(order.id,orderAfterSale(order) ? afterSaleLabel(orderAfterSale(order)) : order.status === "paid" ? "待收货" : order.status === "processing" ? "支付确认中" : "待付款",order.title,orderAfterSale(order) ? `${orderAfterSale(order).type} · 查看处理进度` : order.status === "paid" ? order.shipping : "可继续支付",`¥${order.payable}`,`commercial:open-order:${order.id}`)); return shell(item,"订单", `<div class="chip-row" role="tablist">${[["all","全部"],["pending","待付款"],["receiving","待收货"],["aftersale","售后"]].map(([value,label]) => `<button role="tab" aria-selected="${filter === value}" data-action="commercial:order-filter:${value}">${label}</button>`).join("")}</div><section class="order-list">${cards.join("") || '<section class="empty-state"><h2>这里还没有订单</h2><p>下单后可在这里继续付款、查看物流或申请售后。</p></section>'}</section>${actions([["继续选购","go:SEL-01","secondary"]])}`); },
      "SEL-11": () => { const order = currentOrder(); if (!order) return shell(item,"订单详情", `${feedback("没有找到这笔订单","请从订单列表重新选择。","plain")}${actions([["查看订单列表","go:SEL-10","primary"]])}`); const afterSale = orderAfterSale(order), pending = order.status !== "paid"; return shell(item,"订单详情", `${feedback(afterSale ? afterSaleLabel(afterSale) : pending ? "等待付款" : "订单已确认",afterSale ? `${afterSale.type} · ${afterSale.id}` : pending ? "付款后安排配送。" : order.shipping,"plain")}${summary([["订单号",order.id],["商品",`${order.title} · ${order.specification}`],["数量",String(order.quantity)],["商品金额",`¥${order.subtotal}`],["优惠券",`−¥${order.coupon}`],["积分抵扣",`${order.pointsUsed} Points · ¥${order.pointsAmount}`],[pending ? "待付" : "实付",`¥${order.payable}`,"total"]],"订单金额")}${summary([["收货信息",order.address],["配送",pending ? "付款后安排" : order.shipping]],"配送信息")}${state.logisticsExpanded ? stepper(["订单确认","准备发货","等待送达"],pending ? 0 : 1) : ""}${actions(pending ? [["继续支付",`commercial:resume-payment:${order.id}`,"primary"],["返回订单列表","go:SEL-10","secondary"]] : afterSale ? [["查看售后进度",`commercial:open-aftersale:${afterSale.id}`,"primary"],["返回订单列表","go:SEL-10","secondary"]] : [["查看物流进度","commercial:logistics-toggle","primary"],["申请售后","go:SEL-12","secondary"]])}`); },
      "SEL-12": () => { const order = currentOrder(); if (!order || order.status !== "paid") return shell(item,"申请售后", `${feedback("当前没有可申请售后的订单","请从已付款订单中选择。","plain")}${actions([["返回订单","go:SEL-10","primary"]])}`); return shell(item,"申请售后", `${summary([["商品",order.title],["订单",order.id]])}<label class="field-label">售后类型<select id="aftersale-type" class="field">${["退货退款","仅退款","换货"].map(type => `<option ${state.afterSaleDraft.type === type ? "selected" : ""}>${type}</option>`).join("")}</select></label><label class="field-label">原因<select id="aftersale-reason" class="field">${["商品与描述不符","物流问题","质量问题","其他"].map(reason => `<option ${state.afterSaleDraft.reason === reason ? "selected" : ""}>${reason}</option>`).join("")}</select></label><label class="field-label">补充说明<textarea id="aftersale-note" class="field" placeholder="选填">${e(state.afterSaleDraft.note)}</textarea></label><section id="aftersale-amount-summary">${afterSaleAmounts(order,state.afterSaleDraft.type)}</section>${actions([["提交售后申请","commercial:aftersale","primary"],["返回订单","go:SEL-11","secondary"]])}`); },
      "SEL-13": () => { const snapshot = state.afterSaleSnapshot; if (!snapshot) return shell(item,"售后进度", `${feedback("暂无售后申请","请从需要帮助的订单提交。","plain")}${actions([["查看订单","go:SEL-10","primary"]])}`); return shell(item,"售后进度", `${feedback(afterSaleLabel(snapshot),snapshot.status === "completed" ? snapshot.type === "换货" ? "换货已完成，原订单金额与积分不变。" : "模拟退款完成，已使用积分按记录恢复。" : snapshot.status === "return-required" ? "请寄回商品后填写寄回凭证，再等待处理。" : "本地原型状态演示；记录会保留在这笔订单下。","plain")}${flowStrip(["提交","审核",snapshot.type === "换货" ? "换货" : "退款"],snapshot.status === "submitted" ? 0 : snapshot.status === "completed" ? 2 : 1,"aftersale")}${summary([["售后单号",snapshot.id],["关联订单",snapshot.order.id],["类型",snapshot.type],["原因",snapshot.reason],["补充说明",snapshot.note || "未填写"]])}${afterSaleAmounts(snapshot.order,snapshot.type)}${snapshot.evidence ? feedback("凭证已添加",snapshot.evidence,"sage") : ""}${actions([["补充寄回凭证","commercial:aftersale-upload","secondary",snapshot.status === "completed"],["刷新处理进度","commercial:aftersale-refresh","primary",snapshot.status === "completed"],["返回原订单",`commercial:open-order:${snapshot.order.id}`,"secondary"],["联系 Halo 售后","go:HELP-03","secondary"]])}`); },
    };
    return pages[item.id]?.() || "";
  }

  function orderCard(id, status, title, body, amount, action, tone = "") {
    return `<button class="order-card ${e(tone)}" data-action="${e(action)}"><span><small>${e(status)}</small><strong>${e(title)}</strong><p>${e(body)}</p></span><span><b>${e(amount)}</b><i aria-hidden="true">›</i></span></button>`;
  }

  function sectionFailure(title, body) {
    return `<section class="result-card failure"><span aria-hidden="true">!</span><h2>${e(title)}</h2><p>${e(body)}</p></section>`;
  }

  function channel(item, ctx = {}) {
    if (item.id === "CHN-16" && state.channelIdentity === "active") return shell(item,"体验顾问", `${sectionResult("顾问身份已生效","本地模拟回执",state.activationRequest?.completedAt || "示例身份")}${actions([["查看经营工具","go:CHN-17","primary"]])}`);
    if (["CHN-15","CHN-16"].includes(item.id) && !["approved","activation-pending"].includes(state.channelIdentity)) return shell(item,"体验顾问", `${feedback("尚未到协议与收款步骤","请先完成申请与后台审核。","warm")}${actions([["查看申请进度","go:CHN-11","primary"]])}`);
    if (item.id === "CHN-16" && state.channelIdentity === "approved" && !state.activationReady) return shell(item,"体验顾问", `${feedback("收款与协议资料还在确认","资料确认完成后，才能继续提交身份生效申请。","plain")}${actions([["联系支持","go:HELP-03","primary"],["返回申请进度","go:CHN-11","secondary"]])}`);
    if (item.id === "CHN-17" && state.channelIdentity !== "active") return shell(item,"体验顾问", `${feedback("身份尚未生效","以审核结果与正式生效通知为准。","plain")}${actions([["查看申请进度","go:CHN-11","primary"]])}`);
    if (["CHN-06","CHN-08","CHN-09","CHN-10"].includes(item.id) && !ctx.hardwareActive) return shell(item,"体验顾问", `${feedback("先完成本人设备激活","设备激活后再继续这次申请。","plain")}${actions([["去绑定设备","commercial:channel-device-start","primary"]])}`);
    if (item.id === "CHN-06" && !state.identityVerified) return shell(item,"体验顾问", `${feedback("先确认本次申请身份","身份核验通过后再填写申请。","plain")}${actions([["确认身份","go:CHN-02","primary"]])}`);
    const operatingRoutes = new Set(["CHN-18", "CHN-19", "CHN-20", "CHN-21", "CHN-22", "CHN-23", "CHN-24", "CHN-25", "CHN-26"]);
    const historicalRoutes = new Set(["CHN-20", "CHN-21", "CHN-22"]);
    const readOnlyOperating = ["paused", "terminated"].includes(state.channelIdentity);
    if (operatingRoutes.has(item.id) && state.channelIdentity !== "active" && !(readOnlyOperating && historicalRoutes.has(item.id))) {
      const gate = {
        inactive: ["尚未申请体验顾问", "完成申请并收到身份生效通知后，经营工具才会开放。", "go:CHN-01", "开始申请"],
        application: ["申请正在审核", "审核通过、协议与收款资料确认完成后，经营工具才会开放。", "go:CHN-11", "查看申请进度"],
        "needs-info": ["还需要补充资料", "补充完成并通过审核后，经营工具才会开放。", "go:CHN-12", "补充资料"],
        approved: ["还差协议与收款确认", "提交资料并收到身份生效通知后，经营工具才会开放。", "go:CHN-16", "继续完成"],
        "activation-pending": ["身份正在生效", "生效前暂不能使用经营工具，当前进度会保留。", "go:CHN-16", "查看生效进度"],
        paused: ["经营已暂停", item.id === "CHN-23" ? "暂停期间不能提交新的提现；历史结算仍可查看。" : "新的分享与服务订单暂不可用；历史订单和结算仍可查看。", "go:CHN-22", "查看历史结算"],
        terminated: ["体验顾问合作已结束", item.id === "CHN-23" ? "合作结束后不能提交新的提现；历史结算仍可查看。" : "新的经营工具已关闭；历史订单和结算仍可查看。", "go:CHN-22", "查看历史结算"],
      }[state.channelIdentity] || ["经营工具暂不可用", "请先完成体验顾问申请。", "go:CHN-01", "查看申请"];
      return shell(item, "体验顾问", `${feedback(gate[0], gate[1], readOnlyOperating ? "warm" : "plain")}${actions([[gate[3], gate[2], "primary"], ["联系企业微信客服", "go:HELP-03", "secondary"]])}`);
    }
    const channelHome = state.channelMode === "new"
      ? `<section class="channel-dashboard"><div><small>本月经营</small><h2>还没有服务订单</h2><p>从第一步开始，数据会在产生后显示。</p></div><div class="hero-facts"><div><span>有效订单</span><strong>0</strong></div><div><span>待确认收益</span><strong>¥0.00</strong></div></div></section><section class="next-action-card"><span>第一步</span><h3>检查专属二维码</h3><p>确认身份、链接和当前可分享内容。</p>${actions([["查看推广工具", "go:CHN-26", "primary"]])}</section><section class="entry-section">${entry("内容与政策", "查看当前可分享内容", "服务", "go:CHN-24")}${entry("身份与推广工具", "二维码、链接与素材", "工具", "go:CHN-26")}</section>${feedback("数据会在服务发生后更新", "订单完成来源确认后，相关进度会显示在这里。", "plain")}`
      : `<section class="channel-dashboard"><div><small>本月经营</small><h2>2 笔订单待确认</h2><p>截至今天 14:30</p></div><div class="hero-facts"><div><span>有效订单</span><strong>2</strong></div><div><span>待确认收益</span><strong>¥1,097.25</strong></div></div></section><section class="next-action-card"><span>今天的待办</span><h3>一笔订单正在确认收益</h3><p>预计 9 月 8 日完成订单确认；之后会进入待结算，正式结算完成后才计入可提现余额。</p>${actions([["查看订单", "go:CHN-20", "primary"]])}</section><section class="entry-section">${entry("收益明细", `可提现 ¥${(state.channelAvailableCents/100).toFixed(2)}`, "账户", "go:CHN-22", "sage")}${entry("内容与政策", "2 项必读更新", "服务", "go:CHN-24")}${entry("身份与推广工具", "二维码、链接与素材", "工具", "go:CHN-26")}</section>${disclosure("这里统计哪些收益", `<p>只统计你本人直接服务产生的收益；尚未开放的收益类型不会显示。</p>`)}`;
    const specific = {
      "CHN-01": `<section class="channel-intro"><small>Halo 体验顾问</small><h2>申请成为体验顾问</h2><p>完成 5 步，身份生效后开放顾问工具。购买或激活设备不会自动获得体验顾问身份。</p></section>${flowStrip(["身份","设备","学习","审核","生效"],0,"advisor")}${actions([["开始申请", "go:CHN-02", "primary"]])}<button class="inline-page-link" data-action="go:CHN-11">查看已有申请进度</button>${feedback("顾问等级从 L1 开始", "顾问等级与会员等级相互独立。", "plain")}`,
      "CHN-02": `<section class="form-intro"><h2>确认是你本人</h2><p>用于顾问身份、协议和收款核验。证件信息会按隐私政策保护。</p></section><label class="field-label">姓名<input id="identity-name" class="field" value="${e(state.identityDraft.name)}" autocomplete="name"></label><label class="field-label">证件号码<input id="identity-id-number" class="field" value="${e(state.identityDraft.idNumber)}" inputmode="text"></label><label class="check-line"><input type="checkbox" data-action="commercial:identity-consent" ${state.identityConsent ? "checked" : ""}> 我已阅读身份核验与隐私说明</label>${actions([["提交核验", "commercial:identity-submit", "primary", !isIdentityValid()]])}`,
      "CHN-03": `${sectionWaiting("正在确认身份", "结果和预计反馈时间会在这里更新。")}${summary([["申请编号", state.identityRequestId], ["提交时间", "今天 10:08"], ["预计反馈", "1 个工作日内"], ["当前状态", "正在确认"]])}${actions([["刷新结果", "commercial:identity-check", "primary"], ["需要帮助", "go:HELP-03", "secondary"]])}`,
      "CHN-04": `${sectionFailure("这次没有确认成功", "证件信息暂时无法完成核验，请检查后重新提交。")}${actions([["重新确认身份", "go:CHN-02", "primary"], ["通过企业微信申请人工复核", "commercial:application-appeal", "secondary"]])}`,
      "CHN-05": `${feedback(ctx.hardwareActive ? "Halo Ring 已激活" : "还需要激活本人的 Halo Ring", ctx.hardwareActive ? "设备条件已满足，可以继续刚才的申请。" : "体验顾问需要先完成真实的产品体验。设备激活不会自动产生顾问身份。", ctx.hardwareActive ? "sage" : "warm")}${actions([[ctx.hardwareActive ? "继续申请" : "去绑定与激活", ctx.hardwareActive ? "commercial:channel-device-refresh" : "commercial:channel-device-start", "primary"], ["刷新设备状态", "commercial:channel-device-refresh", "secondary"]])}`,
      "CHN-06": `<section class="form-intro"><h2>告诉我们你的服务计划</h2><p>顾问等级从 L1 开始，与会员等级相互独立。</p></section><label class="field-label">主要服务地区<select id="application-region" class="field">${["上海市","北京市","杭州市","其他地区"].map((value) => `<option ${state.applicationDraft.region === value ? "selected" : ""}>${value}</option>`).join("")}</select></label><label class="field-label">相关经验<select id="application-experience" class="field">${["健康生活方式服务","零售与客户服务","内容与社群","暂无相关经验"].map((value) => `<option ${state.applicationDraft.experience === value ? "selected" : ""}>${value}</option>`).join("")}</select></label><label class="field-label">收款身份<select id="application-payee-type" class="field">${["自然人","企业或个体工商户"].map((value) => `<option ${state.applicationDraft.payeeType === value ? "selected" : ""}>${value}</option>`).join("")}</select></label><label class="check-line"><input type="checkbox" data-action="commercial:application-consent" ${state.applicationConsent ? "checked" : ""}> 我确认信息真实，并愿意遵守宣传与服务边界</label>${state.applicationDraftSaved ? feedback("草稿已保存", "退出 App 后仍可从“我的－申请体验顾问”继续。", "sage") : ""}${actions([["保存草稿", "commercial:application-draft", "secondary"], ["提交并开始学习", "commercial:application-submit", "primary", !isApplicationValid()]])}`,
      "CHN-07": state.applicationSnapshot ? `<section class="application-snapshot"><small>已提交资料</small><h2>L1 · Halo 体验顾问</h2><p>${e(state.applicationSnapshot.submittedAt)}</p></section>${summary([["申请编号",state.applicationSnapshot.id],["服务地区",state.applicationSnapshot.region],["相关经验",state.applicationSnapshot.experience],["收款身份",state.applicationSnapshot.payeeType]],"本次提交")}${actions([["返回申请进度","go:CHN-11","primary"]])}` : `${feedback("还没有提交申请","已填写内容可以保存为草稿。","plain")}${actions([["填写申请","go:CHN-06","primary"]])}`,
      "CHN-08": `<section class="training-summary"><div><strong>${state.completedCourses.length} / 3</strong><span>已完成课程</span></div>${progress(Math.round(state.completedCourses.length / 3 * 100),"学习进度")}</section><section class="task-list">${COURSES.map(course => task(course.title,"必修课程 · v1",state.completedCourses.includes(course.id) ? "已完成" : "未完成",`commercial:course-open:${course.id}`,state.completedCourses.includes(course.id) ? "success" : "")).join("")}</section>${actions([["进入测评","commercial:assessment-open","primary",state.completedCourses.length !== 3],["查看申请进度","go:CHN-11","secondary"]])}`,
      "CHN-09": (() => { const course = COURSES.find(item => item.id === state.selectedCourseId) || COURSES[0]; return `<article class="lesson-card"><small>必修课程 · v1</small><h2>${e(course.title)}</h2><p>${e(course.body)}</p><blockquote>${e(course.takeaway)}</blockquote></article>${actions([[state.completedCourses.includes(course.id) ? "本课已完成" : "完成本课",`commercial:course-complete:${course.id}`,"primary",state.completedCourses.includes(course.id)],["返回课程列表","go:CHN-08","secondary"]])}`; })(),
      "CHN-10": state.completedCourses.length !== 3 ? `${feedback("先完成三门必修课程","完成后再进入测评。","plain")}${actions([["返回课程列表","go:CHN-08","primary"]])}` : `${[["product","可以承诺未开售商品的确定交付日期吗？","不可以，以当前商品页公布为准"],["health","Halo 能诊断失眠吗？","不可以，它提供日常身体状态参考"],["orders","同一订单可同时获得会员推荐奖励和渠道现金收益吗？","不可以，同单只记录一个有效来源"]].map(([id,question,answer]) => `<fieldset class="assessment"><legend>${question}</legend><label><input type="radio" name="channel-assessment-${id}" value="yes" ${state.assessmentAnswers[id] === "yes" ? "checked" : ""}>可以</label><label><input type="radio" name="channel-assessment-${id}" value="no" ${state.assessmentAnswers[id] === "no" ? "checked" : ""}>${answer}</label></fieldset>`).join("")}<div id="assessment-feedback">${state.assessmentFeedback ? feedback(state.assessmentPassed ? "测评已通过" : "再看一下这几道题",state.assessmentPassed ? "可以提交审核。" : "请回到真实产品能力、当前发布信息和唯一订单来源，再选择答案。",state.assessmentPassed ? "sage" : "warm") : ""}</div>${actions([["核对答案","commercial:assessment-submit","secondary"],["提交审核","commercial:assessment-review","primary",!state.assessmentPassed]])}`,
      "CHN-11": !state.applicationSnapshot ? `${feedback(state.applicationStatus === "withdrawn" ? "申请已撤回" : "还没有申请记录",state.applicationStatus === "withdrawn" ? "本次审核已停止，重新申请会建立新的记录。" : "开始申请后，进度会保存在这里。","plain")}${actions([["开始新申请","commercial:application-new","primary"]])}` : state.applicationStatus === "withdrawn" ? `${feedback("申请已撤回","本次审核已停止，历史提交资料仍保留。","plain")}${summary([["申请编号",state.applicationSnapshot.id],["状态","已撤回"]])}${actions([["重新申请","commercial:application-new","primary"],["查看原资料","go:CHN-07","secondary"]])}` : !["reviewing","needs-info","approved"].includes(state.applicationStatus) ? `${feedback("还有学习步骤未完成","完成三门课程与测评后，才会进入审核。","plain")}${summary([["课程",`${state.completedCourses.length} / 3`],["测评",state.assessmentPassed ? "已通过" : "待完成"]])}${actions([["继续学习","go:CHN-08","primary"],["查看资料","go:CHN-07","secondary"],["撤回申请","go:CHN-14","text-button"]])}` : `${sectionWaiting(state.applicationStatus === "needs-info" ? "等待补充资料" : state.applicationStatus === "approved" ? "审核已通过" : "正在审核","结果会保存在这里。")}${summary([["申请编号",state.applicationSnapshot.id],["提交时间",state.applicationSnapshot.submittedAt],["基础学习",state.assessmentPassed ? "已完成" : "待复核"],["预计反馈","3 个工作日内"]])}${actions([[state.applicationStatus === "needs-info" ? "补充资料" : state.applicationStatus === "approved" ? "继续协议与收款" : "刷新审核进度",state.applicationStatus === "needs-info" ? "go:CHN-12" : state.applicationStatus === "approved" ? "go:CHN-16" : "commercial:application-check","primary"],["查看已提交资料","go:CHN-07","secondary"],["撤回申请","go:CHN-14","text-button"]])}`,
      "CHN-12": `${feedback("还需要一项资料", "请在 9 月 10 日前补充收款身份说明。", "warm")}<section class="upload-card ${state.uploadSelected ? "selected" : ""}"><span aria-hidden="true">${state.uploadSelected ? "✓" : "＋"}</span><div><strong>${state.uploadSelected ? "收款身份说明已选择" : "收款身份说明"}</strong><p>${state.uploadSelected ? "settlement-note.pdf · 2.4 MB" : "支持 PDF、JPG 或 PNG，单个文件不超过 10 MB"}</p></div><button data-action="commercial:upload-select">${state.uploadSelected ? "更换文件" : "选择文件"}</button></section>${state.uploadSelected ? feedback("文件已准备提交", "请核对文件后提交补充资料。", "sage") : ""}${actions([["提交补充资料", state.uploadSelected ? "commercial:application-supplement" : "", "primary", !state.uploadSelected], ["查看原申请", "go:CHN-07", "secondary"]])}`,
      "CHN-13": `${sectionFailure("这次申请未通过", "你选择的服务地区暂未开放体验顾问服务。")}${feedback("你仍可以申请复核", "企业微信客服会协助记录复核申请；服务地区开放后也可以再次申请。", "plain")}${actions([["通过企业微信申请复核", "commercial:application-appeal", "primary"], ["重新申请", "go:CHN-02", "secondary"]])}`,
      "CHN-14": `${sectionFailure("确定撤回这次申请？", "撤回后本次审核会停止；之后可以重新申请。")}${summary([["会保留", "已提交资料与审核记录"], ["不会影响", "会员身份、Halo Points 与健康功能"]])}${actions([["确认撤回", "commercial:application-withdraw", "danger-button"], ["继续等待审核", "go:CHN-11", "secondary"]])}`,
      "CHN-15": `<section class="result-card success"><span aria-hidden="true">✓</span><h2>申请已通过</h2><p>还需完成协议、收款与税务资料；收到身份生效通知后，经营工具才会开放。</p></section>${stepper(["确认身份", "完成基础学习", "提交审核", "协议与收款"], 3)}${actions([["核对协议与收款资料", "go:CHN-16", "primary"]])}`,
      "CHN-16": state.channelIdentity === "activation-pending" ? `${sectionWaiting("正在确认模拟身份生效", "本地原型演示，不代表真实渠道合作已开通。")}${summary([["体验顾问服务协议", "已确认"], ["收款账户", "尾号 8821 · 已核验"], ["收款身份", state.applicationSnapshot?.payeeType || "自然人"], ["申请编号", "ACT20260902006"], ["当前状态", "等待生效"]])}${actions([["刷新状态", "commercial:channel-refresh", "primary"], ["需要帮助", "go:HELP-03", "secondary"]])}` : `${summary([["体验顾问服务协议", "已阅读，待确认"], ["收款账户", "尾号 8821 · 已核验"], ["收款身份", state.applicationSnapshot?.payeeType || "自然人"], ["税务信息", "已完成"]], "提交前核对")}${disclosure("查看协议摘要", `<p>请基于真实产品体验提供介绍，不作医疗诊断、功效夸大或收益承诺。订单、客户与收款信息仅用于授权服务。</p>`)}<label class="check-line"><input type="checkbox" data-action="commercial:channel-agreement" ${state.channelAgreementConfirmed ? "checked" : ""}> 我已阅读并核对协议、账户与收款信息</label>${actions([["提交资料并等待身份生效", "commercial:channel-activate", "primary", !state.channelAgreementConfirmed], ["需要帮助", "go:HELP-03", "secondary"]])}`,
      "CHN-17": `<section class="result-card success"><span aria-hidden="true">✓</span><h2>顾问工具已开通</h2><p>Halo 体验顾问身份已经生效，可以查看专属工具和服务订单。</p></section>${summary([["当前身份", "L1 · Halo 体验顾问"], ["当前直接服务比例", "25%"], ["顾问编号", "CH0086"], ["生效时间", "今天 14:30"]])}${feedback("服务比例说明", "以当前有效协议及具体订单确认页为准。", "plain")}${actions([["查看第一步", "go:CHN-18", "primary"]])}`,
      "CHN-18": `<section class="channel-zero"><span aria-hidden="true">○</span><h2>还没有服务订单</h2><p>先检查你的专属链接，再分享经过审核的产品内容。</p></section>${summary([["当前身份", "L1 · Halo 体验顾问"], ["当前直接服务比例", "25%"]])}${feedback("服务比例说明", "以当前有效协议及具体订单确认页为准。", "plain")}<section class="next-action-card"><span>第一步</span><h3>检查专属二维码</h3><p>确认身份、链接和当前可分享内容。</p>${actions([["查看推广工具", "go:CHN-26", "primary"], ["查看内容与政策", "go:CHN-24", "secondary"]])}</section>`,
      "CHN-19": channelHome,
      "CHN-20": state.channelMode === "new" ? `${feedback("还没有服务订单","真实服务发生后会显示在这里。","plain")}${actions([["返回经营首页","go:CHN-19","primary"]])}` : `<section class="order-list">${CHANNEL_ORDERS.map(order => orderCard(order.id,order.status,order.title,"收益待确认",`¥${order.earning.toFixed(2)}`,`commercial:earning-open:${order.id}`)).join("")}</section>${feedback("订单来源由系统判定","具体金额与服务关系以该笔订单为准。","plain")}`,
      "CHN-21": (() => { const order = state.channelMode === "new" ? null : CHANNEL_ORDERS.find(row => row.id === state.selectedEarningId); return order ? `<section class="earning-feature"><small>本笔预计收益</small><strong>¥${order.earning.toFixed(2)}</strong><p>${e(order.title)}</p></section>${summary([["关联订单",order.id],["有效金额",`¥${order.amount.toFixed(2)}`],["服务比例","25% · 示例有效协议"],["预计收益",`¥${order.earning.toFixed(2)}`],["状态","待确认"]])}${actions([["查看收益明细","go:CHN-22","primary"],["通过企业微信申请复核","commercial:earning-appeal","secondary"]])}` : `${feedback("未找到服务订单","请从订单列表选择。","plain")}${actions([["查看服务订单","go:CHN-20","primary"]])}`; })(),
      "CHN-22": `<section class="earnings-overview"><div class="primary-earning"><small>可提现</small><strong>¥${((state.channelMode === "new" ? 0 : state.channelAvailableCents)/100).toFixed(2)}</strong><span>示例账本 · 截至本次刷新</span></div><div><span>提现处理中</span><strong>¥${(state.withdrawals.filter(row => row.status === "processing").reduce((sum,row) => sum + row.amountCents,0)/100).toFixed(2)}</strong></div><div><span>待确认</span><strong>¥${state.channelMode === "new" ? "0.00" : "1097.25"}</strong></div><div><span>待结算</span><strong>¥${state.channelMode === "new" ? "0.00" : "820.00"}</strong></div><div><span>结算处理中</span><strong>¥0.00</strong></div><div><span>历史已支付</span><strong>¥${state.channelMode === "new" ? "0.00" : "3800.00"}</strong></div></section>${summary(state.channelMode === "new" ? [["期初可用","¥0.00"],["本次可用","¥0.00"]] : [["期初可用","¥1,200.00"],["本期新增 / 调整","¥0.00"],["提现预占",`−¥${(state.withdrawals.reduce((sum,row) => sum + row.amountCents,0)/100).toFixed(2)}`],["当前可用",`¥${(state.channelAvailableCents/100).toFixed(2)}`]],"余额对账")}${state.withdrawals.map(row => summary([["申请编号",row.id],["申请金额",`¥${(row.amountCents/100).toFixed(2)}`],["状态","处理中"]])).join("")}${readOnlyOperating ? feedback("仅可查看历史结算","新的提现已暂停；既有处理与申诉可联系企业微信。","warm") : ""}${actions([[readOnlyOperating ? "联系企业微信" : "对账并提现",readOnlyOperating ? "go:HELP-03" : "go:CHN-23","primary"],["查看订单","go:CHN-20","secondary"]])}`,
      "CHN-23": state.withdrawalStatus === "submitted" ? `${sectionResult("模拟提现申请已提交",`¥${Number(state.withdrawalAmount).toFixed(2)}`,"金额已从可用余额预占")}${summary([["申请编号",state.withdrawals[0]?.id || "—"],["状态","处理中"],["预计到账","示例流程，不产生真实款项"]])}${actions([["查看收益与处理记录","go:CHN-22","primary"],["发起另一笔","commercial:withdraw-new","secondary"]])}` : `<section class="withdraw-balance"><small>可提现余额 · 示例</small><strong>¥${((state.channelMode === "new" ? 0 : state.channelAvailableCents)/100).toFixed(2)}</strong><p>收款账户 · ${state.channelMode === "new" ? "请先核对收款信息" : "尾号 8821"}</p></section><label class="field-label withdrawal-field">提现金额<input id="channel-withdrawal" class="field" inputmode="decimal" placeholder="0.00" value="${e(state.withdrawalAmount)}"><span id="withdrawal-error" class="field-error" role="alert"></span></label>${actions([["获取模拟结算单","commercial:withdraw-quote","secondary"]])}<div id="withdrawal-quote">${withdrawalQuoteMarkup()}</div>${actions([["提交模拟提现","commercial:withdraw","primary",!isWithdrawalValid()],["返回收益","go:CHN-22","secondary"]])}`,
      "CHN-24": `<section class="content-list">${Object.entries(POLICIES).map(([id,policy]) => entry(policy.title,id === "education" ? "3 张介绍卡" : "当前示例版本 · v1","内容",`commercial:policy-open:${id}`)).join("")}</section>${feedback("分享前核对当前发布版本","本地示例不作为真实经营政策。","plain")}`,
      "CHN-25": (() => { const policy = POLICIES[state.selectedPolicyId] || POLICIES.health, read = state.policiesRead[state.selectedPolicyId]; return `<article class="policy-article"><small>示例当前版本 · v1</small><h2>${e(policy.title)}</h2><p>${e(policy.body)}</p>${policy.points.map((point,index) => `<section class="summary-card"><h3>${state.selectedPolicyId === "education" ? `介绍卡 ${index+1}` : `要点 ${index+1}`}</h3><p>${e(point)}</p></section>`).join("")}</article>${actions([[read ? "已确认当前版本" : "确认已读","commercial:policy-read","primary",Boolean(read)],["复制本页示例内容","commercial:policy-copy","secondary"],["返回内容列表","go:CHN-24","secondary"]])}`; })(),
      "CHN-26": `<section class="qr-card"><img src="assets/channel-qr-CH0086.png" alt="Halo 体验顾问 CH0086 专属二维码"><strong>CH0086 · Halo 体验顾问</strong><span>扫码后可查看你的介绍页</span></section>${summary([["专属链接", "当前有效"], ["身份", "L1 · Halo 体验顾问"], ["最近更新", "今天 14:30"]])}${actions([["复制专属链接", "commercial:advisor-link-copy", "primary"], ["保存二维码", "commercial:advisor-qr-save", "secondary"]])}${feedback("分享前先看商品页", "只分享商品页当前显示的状态和已审核内容。", "plain")}`,
    };
    const body = specific[item.id] || `${feedback(item.name, item.note || item.function, "plain")}${actions([["返回经营首页", "go:CHN-19", "primary"]])}`;
    return shell(item, "体验顾问", body);
  }

  function sectionWaiting(title, body) {
    return `<section class="result-card waiting"><span class="spinner" aria-hidden="true"></span><h2>${e(title)}</h2><p>${e(body)}</p></section>`;
  }

  function withdrawalCents() {
    return /^\d+(\.\d{1,2})?$/.test(state.withdrawalAmount) ? Math.round(Number(state.withdrawalAmount) * 100) : null;
  }
  function withdrawalQuoteMarkup() {
    const quote = state.withdrawalQuote;
    if (!quote || quote.amountCents !== withdrawalCents()) return feedback("先获取本次结算单","税费与净额需在提交前确认。正式报价和二次验证由收款服务提供。","plain");
    return `${summary([["申请金额",`¥${(quote.amountCents/100).toFixed(2)}`],["示例税费 / 手续费","¥0.00 / ¥0.00"],["示例预计到账",`¥${(quote.amountCents/100).toFixed(2)}`],["收款账户","尾号 8821"],["预计时间","正式通道确认后显示"]],"模拟结算单 · 非正式报价")}<label class="check-line"><input id="withdrawal-confirm" type="checkbox" data-action="commercial:withdraw-confirm" ${state.withdrawalConfirmed ? "checked" : ""}>我已核对本次示例金额与收款账户</label><label class="field-label">演示二次验证<input id="withdrawal-verification" class="field" inputmode="numeric" placeholder="演示码 123456" value="${e(state.withdrawalVerification)}"></label>`;
  }
  function isWithdrawalValid() {
    const amount = withdrawalCents();
    return state.channelIdentity === "active" && state.channelMode !== "new" && amount !== null && amount >= 10000 && amount <= state.channelAvailableCents && state.withdrawalQuote?.amountCents === amount && state.withdrawalConfirmed && state.withdrawalVerification === "123456" && state.withdrawalStatus !== "submitted";
  }
  function syncWithdrawalControls() {
    const button = document.querySelector('[data-action="commercial:withdraw"]'), error = document.getElementById("withdrawal-error");
    if (button) { button.disabled = !isWithdrawalValid(); button.setAttribute("aria-disabled",String(!isWithdrawalValid())); }
    if (error) error.textContent = !state.withdrawalAmount ? "" : withdrawalCents() === null ? "金额最多保留两位小数" : withdrawalCents() < 10000 ? "单次最低 ¥100.00" : withdrawalCents() > state.channelAvailableCents ? "不能超过当前可提现余额" : "";
  }
  function reviewGroup(title, options) {
    return `<div class="review-control-group"><strong>${e(title)}</strong><div>${options.map(([label, action, active = false]) => `<button class="${active ? "active" : ""}" data-action="${e(action)}">${e(label)}</button>`).join("")}</div></div>`;
  }

  function reviewControls(item) {
    const prefix = item.id.split("-")[0];
    if (!["MEM", "PTS", "REF", "SEL", "CHN"].includes(prefix)) return "";
    let controls = "";
    if (["MEM", "PTS", "REF"].includes(prefix)) controls = `${reviewGroup("任务结果", [["进行中","commercial:task-state:available",state.taskStatus === "available"],["确认中","commercial:task-state:validating",state.taskStatus === "validating"],["已到账","commercial:task-state:posted",state.taskStatus === "posted"],["已调整","commercial:task-state:adjusted",state.taskStatus === "adjusted"],["复核中","commercial:task-state:reviewing",state.taskStatus === "reviewing"],["已恢复","commercial:task-state:restored",state.taskStatus === "restored"]])}${reviewGroup("会员 / Halo Points", [["升级前","commercial:upgrade-state:before",!state.upgradePosted],["已升级","commercial:upgrade-state:posted",state.upgradePosted],["Points 正常","commercial:points-state:normal",state.pointsMode === "normal"],["Points 调整中","commercial:points-state:pending",state.pointsMode === "pending"],["Points 已恢复","commercial:points-state:restored",state.pointsMode === "restored"]])}`;
    if (prefix === "PTS") controls += reviewGroup("兑换结果", [["待确认","commercial:redeem-state:ready",state.redemptionStatus === "ready"],["处理中","commercial:redeem-state:processing",state.redemptionStatus === "processing"],["成功","commercial:redeem-state:success",state.redemptionStatus === "success"],["失败","commercial:redeem-state:failed",state.redemptionStatus === "failed"]]);
    if (prefix === "SEL") controls = `${reviewGroup("商品状态", [["暂未开售","commercial:catalog:display",state.catalogMode === "display"],["预售","commercial:catalog:presale",state.catalogMode === "presale"],["现货","commercial:catalog:sale",state.catalogMode === "sale"]])}${reviewGroup("系统判定来源", [["品牌直营","commercial:attribution-state:direct",state.attribution === "direct"],["会员推荐","commercial:attribution-state:member",state.attribution === "member"],["体验顾问","commercial:attribution-state:channel",state.attribution === "channel"]])}${reviewGroup("支付结果", [["待支付","commercial:payment-state:ready",state.paymentStatus === "ready"],["处理中","commercial:payment-state:processing",state.paymentStatus === "processing"],["成功","commercial:payment-state:success",state.paymentStatus === "success"],["失败","commercial:payment-state:failed",state.paymentStatus === "failed"],["已取消","commercial:payment-state:cancelled",state.paymentStatus === "cancelled"]])}${reviewGroup("售后结果", [["已提交","commercial:aftersale-state:submitted",state.afterSaleStatus === "submitted"],["审核中","commercial:aftersale-state:reviewing",state.afterSaleStatus === "reviewing"],["需寄回","commercial:aftersale-state:return-required",state.afterSaleStatus === "return-required"],["退款中","commercial:aftersale-state:refunding",state.afterSaleStatus === "refunding"],["已完成","commercial:aftersale-state:completed",state.afterSaleStatus === "completed"],["失败","commercial:aftersale-state:failed",state.afterSaleStatus === "failed"]])}`;
    if (prefix === "CHN") controls = `${reviewGroup("申请结果页", [["审核中","commercial:identity-state:application",state.channelIdentity === "application"],["需补件","commercial:identity-state:needs-info",state.channelIdentity === "needs-info"],["未通过","go:CHN-13",item.id === "CHN-13"],["已通过","commercial:identity-state:approved",state.channelIdentity === "approved"]])}${reviewGroup("身份状态", [["未申请","commercial:identity-state:inactive",state.channelIdentity === "inactive"],["待生效","commercial:identity-state:activation-pending",state.channelIdentity === "activation-pending"],["已生效","commercial:identity-state:active",state.channelIdentity === "active"],["已暂停","commercial:identity-state:paused",state.channelIdentity === "paused"],["合作结束","commercial:identity-state:terminated",state.channelIdentity === "terminated"]])}${reviewGroup("经营数据", [["新用户","commercial:channel-mode:new",state.channelMode === "new"],["已有订单","commercial:channel-mode:established",state.channelMode === "established"]])}`;
    return `<section class="review-controls"><p>PROTOTYPE STATES</p><h3>审阅状态</h3><small>仅用于产品、UI、开发与 QA 切换验收状态；不会出现在设备界面。</small>${controls}</section>`;
  }

  function maybeUpgradeMember(assets, hardwareActive) {
    if (!hardwareActive) return assets;
    const names = ["Halo Member","Halo Premier","Halo Signature","Halo Prestige","Halo Muse","Halo Luminary"];
    const growth = Number(assets.growth) || 0, badges = Number(assets.badges) || 0;
    const eligible = [true,growth >= 600,growth >= 2000,growth >= 5000 && badges >= 2,growth >= 10000 && assets.formalCocreationVerified === true,growth >= 20000 && badges >= 3 && assets.deepCocreationVerified === true];
    const current = Math.max(0,Number(assets.level?.match(/L([1-6])/)?.[1] || 1)-1);
    const next = eligible.reduce((highest,allowed,index) => allowed ? index : highest,0);
    return next > current ? { ...assets,level:`${names[next]}（L${next+1}）`,effectiveAt:new Date().toISOString() } : assets;
  }
  function getMemberSnapshot(ctx = {}) {
    const active = Boolean(ctx.hardwareActive), retained = ctx.membershipState === "unbound-retained";
    if (ctx.newMember && state.memberAssets?.registrationId !== ctx.memberCreatedAt) {
      state.memberAssets = { level: "Halo Member（L1）", growth: 0, badges: 0, registrationId: ctx.memberCreatedAt };
      state.pointsBalance = 0; state.pendingPointsCorrection = 0; state.pointsMode = "normal"; state.pointsTransactions = []; state.vouchers = []; state.studioAwards = []; state.taskStates = {}; state.taskPeriods = {};
    }
    if (!state.memberAssets && (active || retained)) state.memberAssets = { level: state.upgradePosted ? "Halo Signature（L3）" : "Halo Premier（L2）", growth: state.upgradePosted ? 2060 : 1860, badges: 1 };
    if (state.memberAssets) state.memberAssets = maybeUpgradeMember(state.memberAssets,active);
    const assets = state.memberAssets || { level: "Halo Member（L1）", growth: 0, badges: 0 };
    persistCommercialState();
    return { ...assets, points: availablePoints(), coupons: (state.couponUsedOrderId ? 0 : 1) + state.vouchers.filter(voucher => voucher.status === "available").length, unusedBenefits: 1 };
  }

  function render(item, ctx) {
    persistCommercialState();
    resumeAsyncFlows(ctx);
    if (item.id.startsWith("MEM-") || item.id.startsWith("PTS-") || item.id.startsWith("REF-")) return member(item, ctx);
    if (item.id.startsWith("SEL-")) return select(item);
    if (item.id.startsWith("CHN-")) return channel(item, ctx);
    return "";
  }

  function handleAction(action, ctx) {
    if (!action || !action.startsWith("commercial:")) return false;
    const [, command, value] = action.split(":");
    if (["identity-submit","identity-check","application-submit","application-new","application-consent","course-complete","assessment-review","channel-device-refresh"].includes(command) && ["active","paused","terminated"].includes(state.channelIdentity)) { ctx.flash("已有顾问身份，请从经营中心查看或联系支持"); return true; }
    if (command === "task-open") { if (!TASKS[value]) return true; state.selectedTaskId = value; persistCommercialState(); ctx.go("MEM-05"); return true; }
    if (command === "product-open") { if (!PRODUCTS[value]) return true; state.selectedProductId = value; persistCommercialState(); ctx.go("SEL-03"); return true; }
    if (command === "cart-checkout") { state.checkoutProductId = state.cartProductId; state.checkoutReconfirmId = null; persistCommercialState(); ctx.go("SEL-05"); return true; }
    if (command === "resume-payment") {
      const order = state.orders.find(row => row.id === (value || state.selectedOrderId));
      if (!order || !["pending-payment","processing"].includes(order.status)) { ctx.flash("这笔订单无需继续付款"); return true; }
      state.orderSnapshot = order; state.paymentStatus = order.status === "processing" ? "processing" : "ready"; persistCommercialState(); ctx.go("SEL-09"); return true;
    }
    if (command === "payment-cancel") { state.paymentStatus = "cancelled"; persistCommercialState(); ctx.go("SEL-10"); return true; }
    if (command === "reconfirm-order") {
      const order = state.orders.find(row => row.id === state.orderSnapshot?.id);
      if (!order || order.status !== "pending-payment") return true;
      state.checkoutReconfirmId = order.id; state.checkoutProductId = order.productId; state.cartCount = order.quantity;
      state.couponSelected = Boolean(order.coupon); state.pointsUsed = availablePoints() >= 3000;
      persistCommercialState(); ctx.go("SEL-05"); return true;
    }
    if (command === "referral-progress") { state.referralProgressShown = !state.referralProgressShown; persistCommercialState(); ctx.render(); return true; }
    if (command === "referral-copy") { const url = new URL(location.href); url.hash = "REF-01"; url.searchParams.set("ref","HALO-8K2M"); copyWithFeedback(`Halo 推荐码 HALO-8K2M · 本地原型示例\n${url.href}`,"推荐信息已复制",ctx); return true; }
    if (command === "course-open") { if (!COURSES.some(course => course.id === value)) return true; state.selectedCourseId = value; persistCommercialState(); ctx.go("CHN-09"); return true; }
    if (command === "course-complete") { if (!ctx.hardwareActive || !state.applicationSnapshot || !COURSES.some(course => course.id === value)) return true; if (!state.completedCourses.includes(value)) state.completedCourses.push(value); persistCommercialState(); ctx.go("CHN-08"); return true; }
    if (command === "assessment-open") { if (state.completedCourses.length !== 3) { ctx.flash("请先完成三门课程"); return true; } ctx.go("CHN-10"); return true; }
    if (command === "assessment-review") {
      if (!ctx.hardwareActive || state.completedCourses.length !== 3 || !state.assessmentPassed || !["product","health","orders"].every(id => state.assessmentAnswers[id] === "no") || !state.applicationSnapshot) { ctx.flash("请完成本次课程与测评"); return true; }
      state.applicationStatus = "reviewing"; state.channelIdentity = "application"; persistCommercialState(); ctx.go("CHN-11"); return true;
    }
    if (command === "application-new") {
      if (state.applicationSnapshot) state.applicationHistory.push({ ...state.applicationSnapshot,status:state.applicationStatus });
      state.applicationSnapshot = null; state.applicationStatus = "draft"; state.channelIdentity = "inactive"; state.completedCourses = []; state.assessmentAnswers = {}; state.assessmentPassed = false; state.assessmentFeedback = "";
      state.identityConsent = false; state.identityVerified = false; state.identityProcessing = false; state.applicationConsent = false; persistCommercialState(); ctx.go("CHN-02"); return true;
    }
    if (command === "application-withdraw") {
      if (!state.applicationSnapshot || ["approved","activation-pending","active","paused","terminated"].includes(state.channelIdentity)) { ctx.flash("当前申请不能撤回，请联系支持"); return true; }
      state.applicationStatus = "withdrawn"; state.channelIdentity = "inactive"; persistCommercialState(); ctx.go("CHN-11"); return true;
    }
    if (command === "application-supplement") {
      if (state.channelIdentity !== "needs-info" || !state.uploadSelected || !state.applicationSnapshot) return true;
      state.applicationSnapshot.supplementedAt = new Date().toISOString(); state.applicationSnapshot.supplement = "收款身份说明 · 本地示例";
      state.applicationStatus = "reviewing"; state.channelIdentity = "application"; persistCommercialState(); ctx.go("CHN-11"); return true;
    }
    if (command === "earning-open") { if (!CHANNEL_ORDERS.some(order => order.id === value)) return true; state.selectedEarningId = value; persistCommercialState(); ctx.go("CHN-21"); return true; }
    if (command === "policy-open") { if (!POLICIES[value]) return true; state.selectedPolicyId = value; persistCommercialState(); ctx.go("CHN-25"); return true; }
    if (command === "withdraw-new") { state.withdrawalStatus = "ready"; state.withdrawalAmount = ""; state.withdrawalQuote = null; state.withdrawalConfirmed = false; state.withdrawalVerification = ""; persistCommercialState(); ctx.render(); return true; }
    if (command === "withdraw-quote") {
      const amountCents = withdrawalCents();
      if (state.channelIdentity !== "active" || state.channelMode === "new" || amountCents === null || amountCents < 10000 || amountCents > state.channelAvailableCents) { syncWithdrawalControls(); ctx.flash("请填写可提现范围内、最多两位小数的金额"); return true; }
      state.withdrawalQuote = { id: String(Date.now()),amountCents,taxCents:0,feeCents:0,netCents:amountCents,mock:true };
      state.withdrawalConfirmed = false; state.withdrawalVerification = ""; persistCommercialState(); ctx.render(); return true;
    }
    if (command === "task-state") {
      const taskId = state.selectedTaskId, taskItem = TASKS[taskId], previous = state.taskStates[taskId] || "available";
      if (!taskItem || !ctx.hardwareActive) return true;
      state.taskStates[taskId] = value; state.taskStatus = state.taskStates["wear-12h"];
      const gained = ["posted","restored"].includes(value), wasGained = ["posted","restored"].includes(previous);
      if (gained && !wasGained && value === "posted") {
        completeTask({ taskId,occurredAt:new Date().toISOString(),verified:true,...ctx });
      } else if (gained && !wasGained) {
        const id = `task:${taskId}:${memberPeriodKey(taskItem.period)}:restored`;
        if (recordPointsTransaction({ id, title: taskItem.title, detail: value === "restored" ? "复核恢复" : "有效行为已确认", amount: taskItem.points })) {
          const assets = getMemberSnapshot(ctx); state.memberAssets = { ...assets, growth: assets.growth + taskItem.growth };
          state.memberAssets = maybeUpgradeMember(state.memberAssets,ctx.hardwareActive);
        }
      } else if (!gained && wasGained && ["adjusted","reviewing"].includes(value)) {
        if (recordPointsTransaction({ id: `task:${taskId}:${memberPeriodKey(taskItem.period)}:correction`, title: taskItem.title, detail: "重复奖励调整 · 可联系企业微信申诉", amount: -taskItem.points, correction: true })) state.memberAssets.growth = Math.max(0,state.memberAssets.growth - taskItem.growth);
      }
      persistCommercialState(); ctx.render(); return true;
    }
    if (command === "task-appeal") { ctx.track("membership_task_adjustment_appeal_handoff", { task_id: "wear-12h", channel: "enterprise-wechat" }); ctx.go("HELP-03"); return true; }
    if (command === "task-refresh") {
      ctx.track("membership_task_status_refreshed", { task_id: state.selectedTaskId, status: state.taskStates[state.selectedTaskId] || "available" });
      ctx.render(); ctx.flash("已查询最新进度，完成有效行为后更新"); return true;
    }
    if (command === "application-appeal" || command === "earning-appeal") { ctx.track(`${command}_handoff`, { channel: "enterprise-wechat" }); ctx.go("HELP-03"); return true; }
    if (command === "application-draft") { state.applicationDraftSaved = true; ctx.track("advisor_application_draft_saved"); ctx.render(); return true; }
    if (command === "policy-read") { state.policiesRead[state.selectedPolicyId] = new Date().toISOString(); persistCommercialState(); ctx.render(); return true; }
    if (command === "policy-copy") {
      const policy = POLICIES[state.selectedPolicyId]; copyWithFeedback(`【本地示例】${policy.title}\n${policy.body}\n${policy.points.join("\n")}`,"本页示例内容已复制",ctx); return true;
    }
    if (command === "advisor-link-copy") {
      copyWithFeedback("https://haloring.example/advisor/CH0086", "专属链接已复制", ctx);
      return true;
    }
    if (command === "advisor-qr-save") {
      const link = document.createElement("a");
      link.href = "assets/channel-qr-CH0086.png";
      link.download = "Halo-advisor-CH0086.png";
      link.click();
      ctx.flash("二维码已保存");
      return true;
    }
    if (command === "upgrade-state") {
      if (!ctx.hardwareActive) { ctx.flash("当前成长已暂停"); return true; }
      state.upgradePosted = value === "posted";
      if (state.upgradePosted) { const assets = getMemberSnapshot(ctx); state.memberAssets = { ...assets, level: "Halo Signature（L3）", growth: Math.max(2060,assets.growth), effectiveAt: new Date().toISOString() }; }
      persistCommercialState(); ctx.render(); return true;
    }
    if (command === "points-state") {
      if (value === "pending" && state.pendingPointsCorrection === 0) {
        state.pendingPointsCorrection = 1200; state.pointsBalance = 0;
      } else if (value === "restored") {
        state.pendingPointsCorrection = 0;
        recordPointsTransaction({ id: "correction:refund4821:restored", title: "退款积分调整已复核恢复", detail: "复核有误 · 恢复后可用 30 天", amount: 1200, expires_at: new Date(Date.now()+30*86400000).toISOString() });
      } else if (value === "normal") state.pendingPointsCorrection = 0;
      state.pointsMode = value; persistCommercialState(); ctx.render(); return true;
    }
    if (command === "task-period") { state.taskPeriod = value; ctx.render(); return true; }
    if (command === "points-appeal") { ctx.track("points_correction_appeal_handoff", { channel: "enterprise-wechat" }); ctx.go("HELP-03"); return true; }
    if (command === "redeem-select") {
      if (!REDEMPTION_CATALOG[value]) return true;
      state.redemptionStatus = hasPointsTransaction(`redemption:${value}`)
        ? "success"
        : state.selectedRedemptionId !== value ? "ready" : state.redemptionStatus;
      state.selectedRedemptionId = value;
      ctx.track("points_redemption_item_selected", { item_id: value });
      ctx.go("PTS-04");
      return true;
    }
    if (command === "redeem") {
      const item = selectedRedemption();
      if (state.orders.some(order => order.status === "processing") || state.redemptionStatus === "processing") { ctx.flash("已有一笔操作正在确认，请稍后再试"); return true; }
      if (!item.available) { ctx.flash("当前项目尚未开放兑换"); return true; }
      if (hasPointsTransaction(`redemption:${item.id}`)) { state.redemptionStatus = "success"; ctx.render(); return true; }
      if (availablePoints() < item.cost) { ctx.flash("积分不足或仍有待冲正，暂不能兑换"); return true; }
      state.redemptionStatus = "processing"; persistCommercialState(); ctx.render(); resumeAsyncFlows(ctx); return true;
    }
    if (command === "redeem-retry") { state.redemptionStatus = "ready"; ctx.render(); return true; }
    if (command === "redeem-state") {
      state.redemptionStatus = value;
      if (value === "success") applyRedemptionResult();
      if (["ready", "processing", "failed"].includes(value)) removePointsTransaction(`redemption:${selectedRedemption().id}`);
      ctx.render();
      return true;
    }
    if (command === "catalog") { state.catalogMode = value; ctx.render(); return true; }
    if (command === "catalog-reminder") { state.catalogReminder = true; ctx.render(); return true; }
    if (command === "referral-qr") { state.referralQrShown = !state.referralQrShown; ctx.render(); return true; }
    if (command === "channel-mode") { state.channelMode = value; ctx.render(); return true; }
    if (command === "identity-state") {
      // This action exists only in the separate prototype review controls.
      state.channelIdentity = value;
      if (["application","needs-info","approved","activation-pending"].includes(value)) {
        state.applicationSnapshot ||= { ...state.applicationDraft, id: "ADV-DEMO-001", submittedAt: "示例提交记录" };
        state.applicationStatus = value === "needs-info" ? "needs-info" : ["approved","activation-pending"].includes(value) ? "approved" : "reviewing";
        state.activationReady = ["approved","activation-pending"].includes(value);
      }
      persistCommercialState();
      const route = { inactive: "CHN-01", application: "CHN-11", "needs-info": "CHN-12", approved: "CHN-15", "activation-pending": "CHN-16", active: "CHN-17", paused: "CHN-19", terminated: "CHN-19" }[value] || "CHN-01";
      ctx.go(route); return true;
    }
    if (command === "category") { state.category = value; ctx.go("SEL-02"); return true; }
    if (command === "buy-now") { if (selectedProduct().displayOnly || state.catalogMode === "display") { ctx.flash("这件商品尚未开售"); return true; } state.checkoutProductId = state.selectedProductId; state.checkoutReconfirmId = null; state.cartCount = 1; state.paymentStatus = "ready"; state.orderSnapshot = null; persistCommercialState(); ctx.go("SEL-05"); return true; }
    if (command === "add-cart") { if (selectedProduct().displayOnly || state.catalogMode === "display") return true; state.cartProductId = state.selectedProductId; state.checkoutProductId = state.selectedProductId; state.cartCount = Math.max(1,state.cartCount); persistCommercialState(); ctx.go("SEL-04"); return true; }
    if (command === "cart-inc") { state.cartCount += 1; ctx.render(); return true; }
    if (command === "cart-dec") { state.cartCount = Math.max(0, state.cartCount - 1); ctx.render(); return true; }
    if (command === "coupon-toggle") { if (state.couponUsedOrderId) { ctx.flash("这张优惠券已经使用"); return true; } state.couponSelected = !state.couponSelected; ctx.render(); return true; }
    if (command === "points-use") { state.pointsUsed = !state.pointsUsed; ctx.track("select_points_usage_changed", { used: state.pointsUsed }); ctx.render(); return true; }
    if (command === "attribution-state") {
      state.attribution = value;
      state.attributionReason = value === "member" ? "系统识别到支付前已生效的会员推荐关系" : value === "channel" ? "系统识别到支付前已生效的体验顾问服务关系" : "本次从 Halo Select 直接进入，未识别到有效推荐关系";
      ctx.track("order_attribution_resolved", { attribution_type: value, source: "prototype-state" });
      ctx.render();
      return true;
    }
    if (command === "submit-order") {
      if (state.cartCount < 1 || checkoutProduct().displayOnly) { ctx.flash("请先选择可购买商品"); return true; }
      const previous = state.checkoutReconfirmId && state.orders.find(order => order.id === state.checkoutReconfirmId);
      if (previous && previous.status !== "pending-payment") { ctx.flash("订单状态已变化，请返回订单查看"); return true; }
      const order = checkoutSnapshot(); state.orderSnapshot = order; saveOrder(order);
      if (!state.checkoutReconfirmId) state.nextOrderSequence += 1;
      state.checkoutReconfirmId = null; state.selectedOrderId = order.id; state.paymentStatus = "ready";
      persistCommercialState(); ctx.go("SEL-09"); return true;
    }
    if (command === "payment-confirm") {
      const order = state.orders.find(row => row.id === state.orderSnapshot?.id);
      if (!order || order.status !== "pending-payment") { ctx.flash("请从待付款订单继续"); return true; }
      if (!paymentPointsAvailable(order) || state.redemptionStatus === "processing") { ctx.render(); ctx.flash("积分状态已变化，请重新确认金额"); return true; }
      state.paymentStatus = "processing"; saveOrder({ ...order, status: "processing" }); persistCommercialState(); ctx.render(); resumeAsyncFlows(ctx); return true;
    }
    if (command === "payment-retry") { state.paymentStatus = "ready"; ctx.render(); return true; }
    if (command === "payment-state") {
      if (value === "success") return handleAction("commercial:payment-confirm",ctx);
      const order = state.orders.find(row => row.id === state.orderSnapshot?.id);
      if (order && order.status === "processing") saveOrder({ ...order,status: "pending-payment" });
      state.paymentStatus = value; persistCommercialState(); ctx.render(); return true;
    }
    if (command === "order-filter") { state.orderFilter = value; ctx.render(); return true; }
    if (command === "open-order") { state.selectedOrderId = value === "latest" ? state.orderSnapshot?.id : value; state.logisticsExpanded = false; persistCommercialState(); ctx.go("SEL-11"); return true; }
    if (command === "open-aftersale") { const snapshot = state.afterSales.find(row => row.id === value); if (!snapshot) { ctx.flash("未找到售后记录"); return true; } state.afterSaleSnapshot = snapshot; state.afterSaleStatus = snapshot.status; persistCommercialState(); ctx.go("SEL-13"); return true; }
    if (command === "aftersale") {
      const order = currentOrder(); if (!order || order.status !== "paid") { ctx.flash("请从已付款订单申请售后"); return true; }
      const existing = orderAfterSale(order);
      if (existing) { state.afterSaleSnapshot = existing; ctx.go("SEL-13"); return true; }
      saveAfterSale({ id: `AS-${order.id}`, order: { ...order }, ...state.afterSaleDraft, status: "submitted", submittedAt: new Date().toISOString() });
      ctx.go("SEL-13"); return true;
    }
    if (command === "aftersale-state") {
      if (!state.afterSaleSnapshot) return true;
      const snapshot = { ...state.afterSaleSnapshot,status:value }; saveAfterSale(snapshot);
      if (value === "completed" && snapshot.type !== "换货") applyAfterSalePoints(snapshot);
      ctx.render(); return true;
    }
    if (command === "aftersale-refresh") {
      const snapshot = state.afterSaleSnapshot; if (!snapshot) return true;
      const next = { submitted: "reviewing", reviewing: snapshot.type === "仅退款" ? "refunding" : "return-required", "return-required": snapshot.evidence ? snapshot.type === "换货" ? "exchanging" : "refunding" : "return-required", refunding: "completed", exchanging: "completed", failed: "reviewing" };
      const updated = { ...snapshot,status: next[snapshot.status] || snapshot.status }; saveAfterSale(updated);
      if (updated.status === "completed" && updated.type !== "换货") applyAfterSalePoints(updated);
      ctx.render(); return true;
    }
    if (command === "aftersale-upload") { if (!state.afterSaleSnapshot) return true; saveAfterSale({ ...state.afterSaleSnapshot, evidence: "寄回凭证 · 本地示例" }); ctx.render(); return true; }
    if (command === "logistics-toggle") { state.logisticsExpanded = !state.logisticsExpanded; ctx.render(); return true; }
    if (command === "address-select") { state.selectedAddress = value; ctx.render(); return true; }
    if (command === "address-form") { state.addressFormOpen = value === "open"; ctx.render(); return true; }
    if (command === "address-save") {
      if (!isAddressValid()) { state.addressError = "请填写姓名、11 位手机号和完整地址。"; ctx.render(); return true; }
      const address = { ...state.addressDraft, id: `address-${Date.now()}` };
      state.addresses.push(address); state.selectedAddress = address.id; state.addressFormOpen = false; state.addressError = "";
      persistCommercialState(); ctx.render(); return true;
    }
    if (command === "upload-select") { state.uploadSelected = true; ctx.render(); ctx.flash("文件已选择"); return true; }
    if (command === "assessment-submit") {
      state.assessmentPassed = state.completedCourses.length === 3 && ["product","health","orders"].every(id => state.assessmentAnswers[id] === "no");
      state.assessmentFeedback = state.assessmentPassed ? "correct" : "retry"; persistCommercialState(); ctx.render(); return true;
    }
    if (command === "identity-consent") { state.identityConsent = !state.identityConsent; ctx.render(); return true; }
    if (command === "identity-submit") { if (!isIdentityValid()) { ctx.flash("请完整填写并同意身份核验说明"); return true; } state.identityProcessing = true; persistCommercialState(); ctx.track("advisor_identity_verification_submitted", { request_id: state.identityRequestId }); ctx.go("CHN-03"); return true; }
    if (command === "identity-check") { if (!state.identityProcessing) { ctx.flash("请先提交本次身份核验"); return true; } state.identityVerified = true; state.identityProcessing = false; persistCommercialState(); if (ctx.hardwareActive) { state.channelIdentity = "application"; state.resumeAfterDevice = false; ctx.go("CHN-06"); } else { state.resumeAfterDevice = true; ctx.go("CHN-05"); } return true; }
    if (command === "channel-device-start") { state.resumeAfterDevice = true; ctx.go("DEV-01"); return true; }
    if (command === "channel-device-refresh") { if (ctx.hardwareActive) { state.channelIdentity = "application"; state.resumeAfterDevice = false; ctx.go("CHN-06"); } else { ctx.render(); ctx.flash("还没有检测到已激活的 Halo Ring"); } return true; }
    if (command === "application-consent") { state.applicationConsent = !state.applicationConsent; ctx.render(); return true; }
    if (command === "application-submit") {
      if (!ctx.hardwareActive || !state.identityVerified || !isApplicationValid()) { ctx.flash("请完成设备激活、申请信息与声明确认"); return true; }
      state.applicationSnapshot = { ...state.applicationDraft,id: `ADV-${Date.now()}`,submittedAt:new Date().toLocaleString("zh-CN",{timeZone:"Asia/Shanghai"}) };
      state.applicationStatus = "training"; state.channelIdentity = "application"; state.applicationDraftSaved = false;
      state.completedCourses = []; state.assessmentAnswers = {}; state.assessmentPassed = false;
      persistCommercialState(); ctx.go("CHN-08"); return true;
    }
    if (command === "application-check") { ctx.render(); ctx.flash("申请仍在审核，预计 3 个工作日内反馈"); return true; }
    if (command === "channel-agreement") { state.channelAgreementConfirmed = !state.channelAgreementConfirmed; ctx.render(); return true; }
    if (command === "channel-activate") {
      if (state.channelIdentity !== "approved" || state.applicationStatus !== "approved" || !state.applicationSnapshot || !state.activationReady || !state.channelAgreementConfirmed) { ctx.flash("只有审核通过并确认资料后才能提交"); return true; }
      state.activationRequest = { id:`ACT-${Date.now()}`,applicationId:state.applicationSnapshot.id,status:"processing",submittedAt:new Date().toISOString(),mock:true };
      state.channelIdentity = "activation-pending"; persistCommercialState(); ctx.render(); resumeAsyncFlows(ctx); return true;
    }
    if (command === "channel-refresh") {
      ctx.render(); ctx.flash(state.channelIdentity === "activation-pending" ? "已查询，仍等待后台确认身份生效" : "当前没有待生效申请"); return true;
    }
    if (command === "withdraw-confirm") { state.withdrawalConfirmed = !state.withdrawalConfirmed; persistCommercialState(); requestAnimationFrame(syncWithdrawalControls); return true; }
    if (command === "withdraw") {
      if (!isWithdrawalValid()) { syncWithdrawalControls(); ctx.flash("请核对当前身份、结算单和二次验证"); return true; }
      const amountCents = withdrawalCents(), id = `WD-${state.withdrawalQuote.id}`;
      if (state.withdrawals.some(row => row.id === id)) return true;
      state.channelAvailableCents -= amountCents;
      state.withdrawals.unshift({ id,amountCents,quote:{...state.withdrawalQuote},status:"processing",submittedAt:new Date().toISOString() });
      state.withdrawalStatus = "submitted"; persistCommercialState(); ctx.render(); return true;
    }
    return false;
  }

  function handleInput(target) {
    const syncButton = (action, enabled) => {
      const button = document.querySelector(`[data-action="${action}"]`);
      if (!button) return;
      button.disabled = !enabled;
      button.setAttribute("aria-disabled", String(!enabled));
    };
    if (target.id === "withdrawal-verification") { state.withdrawalVerification = target.value.trim(); persistCommercialState(); syncWithdrawalControls(); return true; }
    if (["aftersale-type","aftersale-reason","aftersale-note"].includes(target.id)) {
      const key = target.id === "aftersale-type" ? "type" : target.id === "aftersale-reason" ? "reason" : "note";
      state.afterSaleDraft[key] = target.value; persistCommercialState();
      const summaryNode = document.getElementById("aftersale-amount-summary");
      if (summaryNode && currentOrder()) summaryNode.innerHTML = afterSaleAmounts(currentOrder(),state.afterSaleDraft.type);
      return true;
    }
    if (target.name?.startsWith("channel-assessment-")) {
      state.assessmentAnswers[target.name.replace("channel-assessment-","")] = target.value;
      state.assessmentPassed = false; state.assessmentFeedback = ""; persistCommercialState();
      const feedbackNode = document.getElementById("assessment-feedback"); if (feedbackNode) feedbackNode.innerHTML = "";
      syncButton("commercial:assessment-review",false); return true;
    }
    if (target.id === "channel-withdrawal") {
      state.withdrawalAmount = target.value.trim();
      state.withdrawalQuote = null; state.withdrawalConfirmed = false; state.withdrawalVerification = "";
      const quote = document.getElementById("withdrawal-quote"); if (quote) quote.innerHTML = withdrawalQuoteMarkup();
      persistCommercialState();
      syncWithdrawalControls();
      return true;
    }
    if (target.id === "address-name" || target.id === "address-phone" || target.id === "address-detail") {
      const key = target.id === "address-name" ? "name" : target.id === "address-phone" ? "phone" : "detail";
      state.addressDraft[key] = target.value;
      state.addressError = "";
      persistCommercialState();
      syncButton("commercial:address-save", isAddressValid());
      return true;
    }
    if (target.id === "identity-name" || target.id === "identity-id-number") {
      state.identityDraft[target.id === "identity-name" ? "name" : "idNumber"] = target.value;
      persistCommercialState();
      syncButton("commercial:identity-submit", isIdentityValid());
      return true;
    }
    if (["application-region", "application-experience", "application-payee-type"].includes(target.id)) {
      const key = target.id === "application-region" ? "region" : target.id === "application-experience" ? "experience" : "payeeType";
      state.applicationDraft[key] = target.value;
      state.applicationDraftSaved = false;
      persistCommercialState();
      syncButton("commercial:application-submit", isApplicationValid());
      return true;
    }
    if (target.name === "channel-assessment") {
      state.assessmentChoice = target.value;
      persistCommercialState();
      const button = document.querySelector('[data-action="commercial:assessment-submit"]');
      if (button) { button.disabled = false; button.setAttribute("aria-disabled", "false"); }
      return true;
    }
    if (target.id === "catalog-search") {
      const query = target.value.trim().toLowerCase();
      const cards = [...document.querySelectorAll("[data-product-keywords]")];
      let visible = 0;
      cards.forEach((card) => { const show = card.dataset.productKeywords.toLowerCase().includes(query); card.hidden = !show; card.style.display = show ? "" : "none"; if (show) visible += 1; });
      const empty = document.getElementById("catalog-empty");
      if (empty) { empty.hidden = visible > 0; empty.style.display = visible > 0 ? "none" : ""; }
      return true;
    }
    return false;
  }

  window.HALO_COMMERCIAL_EXTENSION = { extraPages, state, render, handleAction, handleInput, reviewControls, getMemberSnapshot, getStudioVoucher, consumeStudioVoucher, restoreStudioVoucher, awardStudioBenefit, completeTask, maybeUpgradeMember };
  window.HALO_V5_COMMERCIAL = window.HALO_COMMERCIAL_EXTENSION;
})();
