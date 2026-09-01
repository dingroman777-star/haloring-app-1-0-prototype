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
    rules: "会员 v1.19、Halo Select 商品状态门、渠道发布与结算门",
    backend: "会员、任务、账本、商品、订单、支付、渠道与工单服务",
    owner: "产品 + UI + 双端 + 后端 + QA",
    source: "会员 v1.19 / Halo Select 基线 / 渠道基线 / handoff 35",
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
    page("SEL-05", "确认订单", "/me/select/checkout", "SEL-04", "核对地址、优惠、归因与应付金额", "Halo Select"),
    page("SEL-06", "优惠券", "/me/select/coupons", "SEL-05", "选择可用优惠并查看不可用原因", "Halo Select"),
    page("SEL-07", "地址管理", "/me/select/addresses", "SEL-05", "新增、编辑和选择地址", "Halo Select"),
    page("SEL-08", "订单来源确认", "/me/select/attribution", "SEL-05", "在支付前确认订单来源", "Halo Select"),
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

  const state = {
    taskStatus: "available",
    taskPeriod: "today",
    upgradePosted: false,
    pointsMode: "normal",
    pointsUsed: true,
    redemptionStatus: "ready",
    couponSelected: true,
    catalogMode: "sale",
    catalogReminder: false,
    category: "all",
    cartCount: 1,
    attribution: "direct",
    paymentStatus: "ready",
    afterSaleStatus: "ready",
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
    logisticsExpanded: false,
    afterSaleUploadSelected: false,
    attributionEditUsed: false,
    channelIdentity: "inactive",
    channelMode: "new",
  };

  const e = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  const actionButton = ([label, action, kind = "secondary", disabled = false]) => `<button class="${e(kind)}" ${action ? `data-action="${e(action)}"` : ""} ${disabled ? 'disabled aria-disabled="true"' : ""}>${e(label)}</button>`;
  const actions = (items) => `<div class="button-row">${items.map(actionButton).join("")}</div>`;
  const feedback = (title, body, tone = "") => `<section class="feedback-card ${e(tone)}" role="status"><span aria-hidden="true"></span><div><strong>${e(title)}</strong><p>${e(body)}</p></div></section>`;
  const summary = (items, title = "") => `<section class="summary-card">${title ? `<h3>${e(title)}</h3>` : ""}<dl class="summary-list">${items.map(([key, value, emphasis = ""]) => `<div class="${e(emphasis)}"><dt>${e(key)}</dt><dd>${e(value)}</dd></div>`).join("")}</dl></section>`;
  const disclosure = (title, body) => `<details class="disclosure"><summary>${e(title)}<span aria-hidden="true">＋</span></summary><div>${body}</div></details>`;
  const top = (item, label) => `<header class="screen-head commercial-head"><div><button class="back" data-action="previous" aria-label="返回上一页">← 返回</button>${label && label !== item.name ? `<span class="page-context">${e(label)}</span>` : ""}<h1>${e(item.name)}</h1></div></header>`;
  const userFacingCopy = (body) => String(body)
    .replaceAll("18,800", window.HALO_STUDIO_BENEFIT_CLAIMED ? "18,830" : "18,800")
    .replaceAll("系统发现同一行为被重复记录，本次重复奖励已撤回。", "这项行为被重复记录，因此重复奖励已撤回。")
    .replaceAll(">申请复核<", ">通过企业微信申请复核<")
    .replaceAll(">联系客服申诉<", ">通过企业微信申诉<")
    .replaceAll("短暂离线不影响之后的有效同步。", "设备仍保持绑定时，7 个自然日内完成有效同步，进度会按实际发生日期补记；超过 7 天或未通过有效性确认时不补记。")
    .replaceAll("toast:进度已更新", "commercial:task-refresh")
    .replaceAll("toast:状态已更新", "commercial:task-refresh")
    .replaceAll("toast:复核申请已提交，进度会在申请页更新", "commercial:application-appeal")
    .replaceAll("toast:草稿已保存，可从“我的－加入渠道”继续填写", "commercial:application-draft")
    .replaceAll("toast:收益复核申请已提交，进度会在收益明细更新", "commercial:earning-appeal")
    .replaceAll("toast:已读状态已记录", "commercial:policy-read")
    .replaceAll("toast:内容链接已复制", "commercial:policy-copy")
    .replaceAll("toast:专属链接已复制", "commercial:advisor-link-copy")
    .replaceAll("toast:二维码已保存", "commercial:advisor-qr-save")
    .replaceAll("预计 9 月 8 日完成收益确认；通过结算条件后，才会计入可提现余额。", "预计 9 月 8 日完成订单确认；之后会进入待结算，正式结算完成后才计入可提现余额。")
    .replaceAll("订单通过有效性和结算条件确认后，才会计入可提现余额", "收益待确认；确认完成后进入待结算，正式结算完成后计入可提现余额")
    .replaceAll("¥24.00 · 提交前确认", "提交前按本次提现金额计算并确认")
    .replaceAll("购买或激活设备不会自动获得渠道身份。", "购买或激活设备不会自动获得体验顾问身份。")
    .replaceAll("完成身份确认、Halo Ring 激活、基础学习、审核以及协议和收款资料后，收到身份生效通知，才能使用顾问工具。", "完成身份确认、设备激活、基础学习和资料审核后，体验顾问工具才会开放。通过审核后，还需确认服务协议与收款资料。")
    .replaceAll("同一订单不会同时产生会员推荐奖励和渠道现金收益。", "同一订单不会同时产生会员推荐奖励和体验顾问服务收益。");
  const userFacingTerms = (body) => String(body)
    .replaceAll("好友通过你的推荐完成合资格订单、注册和 Halo Ring 激活，并通过订单有效性确认后", "好友通过你的推荐完成下单、注册和 Halo Ring 激活，且订单未取消或全额退款后")
    .replaceAll("合资格推荐需通过实名和订单有效性确认。", "好友完成实名注册、Halo Ring 激活，且订单状态符合本次推荐说明时，才会发放奖励。")
    .replaceAll("Halo 渠道顾问", "Halo 体验顾问")
    .replaceAll("一位渠道顾问为我提供了介绍", "一位 Halo 体验顾问为我提供了介绍")
    .replaceAll("渠道身份", "体验顾问身份")
    .replaceAll("渠道协议", "体验顾问服务协议")
    .replaceAll("当前渠道服务政策", "当前体验顾问服务政策")
    .replaceAll("介绍渠道合作", "介绍体验顾问服务")
    .replaceAll("渠道编号", "顾问编号");
  const shell = (item, label, body) => `${top(item, label)}<div class="stack commercial-stack">${userFacingTerms(userFacingCopy(body))}</div>`;
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
  const modeLabel = () => state.catalogMode === "display" ? "暂未开售" : state.catalogMode === "presale" ? "预售" : "现货";
  const productCard = (title, status, body, action, visual = "textile", price = "") => `<button class="product-card" data-action="${e(action)}" data-product-keywords="${e(`${title} ${body}`)}"><span class="product-visual visual-${e(visual)}" aria-hidden="true"><i></i></span><span class="product-copy"><small>${e(status)}</small><strong>${e(title)}</strong><span>${e(body)}</span>${price ? `<b>${e(price)}</b>` : ""}</span><i class="product-arrow" aria-hidden="true">›</i></button>`;
  const money = () => {
    const subtotal = 399 * state.cartCount;
    const points = state.pointsMode === "pending" || !state.pointsUsed ? 0 : 30;
    const coupon = state.couponSelected ? 20 : 0;
    return { subtotal, points, coupon, payable: Math.max(0, subtotal - points - coupon) };
  };

  function member(item, ctx) {
    const active = ctx.hardwareActive;
    const retained = ctx.membershipState === "unbound-retained";
    const neverBound = !active && !retained;
    const currentLevel = active ? (state.upgradePosted ? "Halo Signature" : "Halo Premier") : retained ? "Halo Premier" : "Halo Member";
    const levelCode = active ? (state.upgradePosted ? "L3" : "L2") : retained ? "L2" : "L1";
    if (item.id === "PTS-04" && state.pointsMode === "pending") return shell(item, "Halo Points 兑换", `${feedback("当前暂不能兑换", "待处理的 Halo Points 清零后，抵扣和兑换会恢复；其他功能不受影响。", "warm")}${summary([["兑换内容", "Halo Studio 公开体验券"], ["当前状态", "Halo Points 待处理"]])}${actions([["查看调整详情", "go:PTS-02", "primary"], ["返回兑换专区", "go:PTS-03", "secondary"]])}`);
    const growth = active ? (state.upgradePosted ? 2060 : 1860) : retained ? 1860 : 0;
    const badgeMeta = neverBound ? "激活硬件后开始记录" : retained ? "1 枚已保留" : "1 枚已获得";
    const pages = {
      "MEM-01": () => shell(item, "会员", `<section class="member-hero"><div class="identity-line"><span>${e(levelCode)}</span><small>当前等级</small></div><h2>${e(currentLevel)}</h2><p>${active ? "今天再佩戴 1 小时 18 分，即可完成有效佩戴任务。" : retained ? "已有等级、成长和徽章已保留；重新激活后继续记录未来成长。" : "会员权益已开启；激活 Halo Ring 后开始记录未来成长。"}</p><div class="hero-facts"><div><span>HALO成长值</span><strong>${e(growth.toLocaleString())}</strong></div><div><span>Halo Points</span><strong>18,800</strong></div></div></section>${active ? `<section class="next-action-card visual-next-action"><span>今天最接近完成</span>${commercialRadial(89, "10h42", "有效佩戴", "还差 1 小时 18 分 · +8 成长 · +20 Points")}${actions([["查看任务进度", "go:MEM-05", "primary"]])}</section>` : feedback(retained ? "成长已暂停" : "成长尚未开始", retained ? "重新绑定并激活 Halo Ring 后，继续记录新的成长。" : "绑定并激活 Halo Ring 后，从那一刻开始记录新的成长。", "warm")}<section class="entry-section"><h3>会员账户</h3>${entry("等级与权益", `${currentLevel} · 查看下一等级`, "当前身份", "go:MEM-02", "warm")}${entry("Halo Points", "余额、临期提醒与兑换", "18,800 可用", "go:PTS-01")}${entry("成长徽章", "查看长期习惯留下的记录", badgeMeta, "go:MEM-06")}</section><section class="entry-section"><h3>更多</h3>${entry("全部任务", "今天、本周与本月", active ? "持续成长" : "需激活 Halo Ring", "go:MEM-04")}${entry("邀请朋友", "分享 Halo，查看推荐进度", "会员推荐", "go:REF-01")}</section>`),
      "MEM-02": () => shell(item, "等级", `<section class="level-focus"><span>当前</span><h2>${e(currentLevel)} · ${e(levelCode)}</h2><p>${state.upgradePosted ? "你已经到达 Halo Signature。" : active ? "还差 140 HALO成长值到达 Halo Signature。" : retained ? "你仍是 Halo Premier；重新激活后继续向 Halo Signature 累计。" : "激活 Halo Ring 后开始向 Halo Premier 成长。"}</p>${progress(state.upgradePosted ? 100 : active || retained ? 93 : 0, state.upgradePosted ? "本级已完成" : retained ? "1,860 / 2,000 · 成长已暂停" : "前往下一等级")}</section><section class="level-path"><div class="level-row completed"><span>L1</span><div><strong>Halo Member</strong><small>注册并确认协议</small></div><b>已获得</b></div><div class="level-row ${levelCode === "L1" ? "next" : levelCode === "L2" ? "current" : "completed"}"><span>L2</span><div><strong>Halo Premier</strong><small>600 HALO成长值</small></div><b>${levelCode === "L1" ? "待开启" : levelCode === "L2" ? "当前" : "已完成"}</b></div><div class="level-row ${levelCode === "L3" ? "current" : "next"}"><span>L3</span><div><strong>Halo Signature</strong><small>2,000 HALO成长值</small></div><b>${levelCode === "L3" ? "当前" : levelCode === "L1" ? "之后可解锁" : "下一站"}</b></div></section>${disclosure("查看完整六级路径", `<section class="level-path compact">${[["L4","Halo Prestige","5,000 HALO成长值与 2 枚徽章"],["L5","Halo Muse","10,000 HALO成长值与正式共创"],["L6","Halo Luminary","20,000 HALO成长值、3 枚徽章与深度共创"]].map(([code,name,condition]) => `<div class="level-row"><span>${code}</span><div><strong>${name}</strong><small>${condition}</small></div></div>`).join("")}</section>`)}${feedback("核心健康功能不受等级影响", "具体功能仍需要支持的 Halo Ring、相应授权和有效数据。", "sage")}${actions([["查看我的升级条件", "go:MEM-03", "primary"], ["查看当前权益", "go:MEM-07", "secondary"]])}`),
      "MEM-03": () => shell(item, "升级", state.upgradePosted ? `<section class="result-card success"><span aria-hidden="true">✓</span><h2>已升级为 Halo Signature</h2><p>新的会员身份与权益已经生效。</p></section>${summary([["升级前", "Halo Premier · 1,860"], ["本次新增", "+200 HALO成长值"], ["任务完成", "8 月 30 日 15:20"], ["奖励到账与权益生效", "9 月 1 日 08:05"], ["当前 HALO成长值", "2,060", "total"]], "升级记录")}${actions([["查看新权益", "go:MEM-07", "primary"], ["返回会员中心", "go:MEM-01", "secondary"]])}` : `${progress(active || retained ? 93 : 0, active || retained ? "1,860 / 2,000 HALO成长值" : "激活后开始记录", active ? "还差 140 HALO成长值" : retained ? "当前已暂停；重新激活后继续累计" : "当前会员身份与已有资产不会受到影响")}<section class="condition-card"><span aria-hidden="true">${active ? "✓" : "○"}</span><div><strong>${active ? "Halo Ring 已激活" : "还需激活 Halo Ring"}</strong><p>${active ? "保持有效佩戴，完成任务即可继续成长。" : retained ? "已有 1,860 HALO成长值已保留，重新激活后继续记录。" : "只记录激活后的新行为。"}</p></div></section>${feedback("满足条件后自动升级", "无需手动申请，升级后会显示权益生效时间。", "sage")}${actions([[active ? "去完成任务" : retained ? "重新绑定 Halo Ring" : "去绑定 Halo Ring", active ? "go:MEM-04" : "go:DEV-01", "primary"], ["查看等级路径", "go:MEM-02", "secondary"]])}`),
      "MEM-04": () => {
        const period = `<div class="chip-row" role="tablist">${[["today","今天"],["week","本周"],["month","本月"]].map(([value,label]) => `<button role="tab" aria-selected="${state.taskPeriod === value}" class="${state.taskPeriod === value ? "active" : ""}" data-action="commercial:task-period:${value}">${label}</button>`).join("")}</div>`;
        const tasks = !active
          ? (state.taskPeriod === "today" ? [["有效佩戴 12 小时", "+8 HALO成长值 · +20 Halo Points", "go:MEM-05"], ["完成一次 AI 睡前修复", "+4 HALO成长值 · +10 Halo Points", "go:NIG-01"]] : state.taskPeriod === "week" ? [["查看周报告并反馈", "+15 HALO成长值 · +50 Halo Points", "go:TOD-04"], ["完成 5 个有效佩戴日", "+15 HALO成长值 · +50 Halo Points", "go:MEM-05"]] : [["完成月度状态回顾", "+30 HALO成长值 · +100 Halo Points", "go:TOD-04"], ["参与正式访谈、产品测试或共创", "奖励以任务页公布为准", "go:MEM-05"]]).map(([title, reward, action]) => task(title, reward, "需激活 Halo Ring", action)).join("")
          : state.taskPeriod === "today" ? `${task("有效佩戴 12 小时", "+8 HALO成长值 · +20 Halo Points", "10 小时 42 分", "go:MEM-05", "progress")}${task("完成一次 AI 睡前修复", "+4 HALO成长值 · +10 Halo Points", "待完成", "go:NIG-01")}` : state.taskPeriod === "week" ? `${task("查看周报告并反馈", "+15 HALO成长值 · +50 Halo Points", "待完成", "go:TOD-04")}${task("完成 5 个有效佩戴日", "+15 HALO成长值 · +50 Halo Points", "4 / 5 天", "go:MEM-05", "progress")}` : `${task("完成月度状态回顾", "+30 HALO成长值 · +100 Halo Points", "待完成", "go:TOD-04")}${task("参与正式访谈、产品测试或共创", "奖励以任务页公布为准", "本月开放", "go:MEM-05")}`;
        return shell(item, "任务", `${period}<section class="task-list">${tasks}</section>${disclosure("奖励与到账说明", `<p>任务完成后会进行确认。详情页会显示完成与到账时间；同一项任务只奖励一次。</p>`)}`);
      },
      "MEM-05": () => shell(item, "任务详情", !active ? `${feedback("激活 Halo Ring 后开始这项任务", retained ? "已有成长与徽章仍会保留。重新激活后，未来进度会继续记录。" : "绑定并激活 Halo Ring 后，新的有效佩戴才会计入任务。", "warm")}${actions([[retained ? "重新绑定 Halo Ring" : "绑定 Halo Ring", "go:DEV-01", "primary"], ["返回任务中心", "go:MEM-04", "secondary"]])}` : `${summary([["任务", "有效佩戴 12 小时"], ["今日进度", ["posted","adjusted","reviewing","restored"].includes(state.taskStatus) ? "已完成" : "10 小时 42 分"], ["完成奖励", "8 HALO成长值 + 20 Halo Points"]])}${state.taskStatus === "available" ? `${progress(89, "今日有效佩戴", "还需 1 小时 18 分")}${feedback("还需佩戴 1 小时 18 分", "无需开启额外功能，进度会在同步后更新。", "sage")}${actions([["刷新进度", "toast:进度已更新", "primary"], ["返回任务中心", "go:MEM-04", "secondary"]])}` : state.taskStatus === "validating" ? `${feedback("奖励确认中", "任务已经完成，到账时间会在状态更新后显示。", "warm")}${summary([["完成时间", "今天 20:14"], ["当前状态", "正在确认"]])}${actions([["刷新状态", "toast:状态已更新", "primary"], ["返回任务中心", "go:MEM-04", "secondary"]])}` : state.taskStatus === "adjusted" ? `${feedback("这项奖励已调整", "系统发现同一行为被重复记录，本次重复奖励已撤回。", "danger")}${summary([["关联任务", "有效佩戴 12 小时"], ["调整内容", "−8 HALO成长值 · −20 Halo Points", "total"], ["调整时间", "今天 20:32"], ["可申诉至", "9 月 16 日"]], "调整详情")}${actions([["申请复核", "commercial:task-appeal", "primary"], ["返回任务中心", "go:MEM-04", "secondary"]])}` : state.taskStatus === "reviewing" ? `${feedback("复核中", "调整仍然生效；结果会在这里更新。", "warm")}${summary([["提交时间", "今天 20:40"], ["当前状态", "正在复核"]])}${actions([["返回任务中心", "go:MEM-04", "secondary"]])}` : state.taskStatus === "restored" ? `${sectionResult("奖励已恢复", "+8 HALO成长值 · +20 Halo Points", "今天 21:05")}${summary([["复核结果", "本次调整有误"], ["恢复时间", "今天 21:05"]])}${actions([["查看 Halo Points 明细", "go:PTS-02", "primary"], ["返回任务中心", "go:MEM-04", "secondary"]])}` : `${sectionResult("奖励已到账", "+8 HALO成长值 · +20 Halo Points", "今天 20:17")}${summary([["完成时间", "今天 20:14"], ["到账时间", "今天 20:17"]])}${actions([["查看 Halo Points 明细", "go:PTS-02", "primary"], ["返回任务中心", "go:MEM-04", "secondary"]])}`}${disclosure("任务如何计算", `<p>每日按北京时间计算；同一账号的同一行为只记一次。短暂离线不影响之后的有效同步。</p>`)}`),
      "MEM-06": () => shell(item, "徽章", neverBound ? `<section class="empty-state"><span aria-hidden="true">○</span><h2>徽章尚未开始</h2><p>激活 Halo Ring 后，未来的有效行动会开始记录徽章进度。</p></section>${actions([["绑定 Halo Ring", "go:DEV-01", "primary"], ["返回会员中心", "go:MEM-01", "secondary"]])}` : `<section class="badge-feature earned"><span aria-hidden="true">✓</span><div><small>${retained ? "已保留" : "已获得"}</small><h2>会员贡献</h2><p>获得于 2026 年 8 月 18 日</p></div></section>${retained ? feedback("已获得的徽章会保留", "重新激活后，新的徽章进度会继续记录。", "sage") : `<div class="badge-grid">${[["长期同行","96 / 180 个有效佩戴日",53],["修复习惯","38 / 60 次睡前修复",63],["身体理解","8 / 12 周状态反馈",67],["品牌参与","4 / 6 次活动",67]].map(([name,label,value]) => `<section class="badge-card"><span aria-hidden="true">○</span><strong>${e(name)}</strong><small>${e(label)}</small><progress max="100" value="${value}" aria-label="${e(name)}进度"></progress></section>`).join("")}</div>`}${disclosure("关于永久徽章", `<p>正常不活跃、解绑或更换设备，不会让已获得的徽章消失。</p>`)}`),
      "MEM-07": () => shell(item, "权益", `<section class="benefit-current"><span>${e(levelCode)}</span><div><small>当前等级</small><h2>${e(currentLevel)}</h2><p>${state.upgradePosted ? "符合条件的实付金额按 1.2×累计 Halo Points" : active || retained ? "符合条件的实付金额按 1.1×累计 Halo Points" : "基础会员权益"}</p></div></section><section class="entry-section"><h3>现在可用</h3>${neverBound ? `${entry("公开内容", "浏览公开课程与基础内容", "可用", "go:STU-08", "sage")}${entry("公开活动", "按活动页公布的名额报名", "可用", "go:STU-08", "sage")}` : `${entry("会员内容", "深度内容与公开课程优先入口", "可用", "go:STU-08", "sage")}${entry("活动优先报名", "权益以单次活动页公布为准", "可用", "go:STU-08", "sage")}`}</section>${disclosure("Halo Points 怎样累计", `<p>只按符合条件的实付商品金额计算；Halo Points 抵扣、优惠券、运费和退款金额不计入。具体结果以订单结算页为准。</p>`)}${disclosure("下一等级将增加什么", neverBound ? `${entry("会员内容", "到达 Halo Premier 后开放", "L2", "go:MEM-03")}${entry("活动优先报名", "到达 Halo Premier 后开放", "L2", "go:MEM-03")}` : `${entry("个性化报告模板", "到达 Halo Signature 后开放", "L3", "go:MEM-03")}${entry("Halo Private Care", "到达 Halo Prestige 后开放", "L4", "go:MEM-02")}`)}${feedback("没有订阅或永久折扣", "课程、活动与体验按单次活动页公布；同一商品对所有会员使用相同公开价格。", "plain")}`),
      "PTS-01": () => shell(item, "Halo Points", `<section class="points-hero ${state.pointsMode === "pending" ? "blocked" : ""}"><small>${state.pointsMode === "pending" ? "当前可用" : "可用 Halo Points"}</small><h2>${state.pointsMode === "pending" ? "0" : "18,800"}</h2><p>${state.pointsMode === "pending" ? "仍有 1,200 Points 待处理" : "本单最高可抵约 ¥188 · 不可提现"}</p></section>${state.pointsMode === "pending" ? `${feedback("Halo Points 使用暂时暂停", "之后新获得的 Points 会先完成这次调整；完成前不能抵扣或兑换，也不会向你追讨现金。其他功能不受影响。", "danger")}${actions([["查看调整详情", "go:PTS-02", "primary"], [state.pointsAppealSubmitted ? "申诉已提交" : "联系客服申诉", state.pointsAppealSubmitted ? "" : "commercial:points-appeal", "secondary", state.pointsAppealSubmitted]])}` : `${expiryDistribution([["30 天内",800,"soon"],["90 天内",1600,"later"],["90 天后",16400,"long"]])}<section class="entry-section">${entry("Halo Points 兑换", "内容、体验与活动名额", "去使用", "go:PTS-03", "warm")}${entry("Halo Points 明细", "奖励、使用与到期记录", "查看全部", "go:PTS-02")}</section>${disclosure("Halo Points 怎么使用", `<p>普通商品每单最多抵扣现金售价的 30%；指定内容可以使用全额 Halo Points 兑换。Halo Points 不能充值、提现或折现。</p>`)}`}`),
      "PTS-02": () => shell(item, "Halo Points 明细", state.pointsMode === "pending" ? `${feedback(state.pointsAppealSubmitted ? "申诉已提交，本次调整仍然生效" : "可用 Halo Points 已调整为 0", "订单退款需要撤回 1,200 Halo Points；当前余额不足的部分仍待处理，之后新获得的 Points 会优先用于完成这次调整。", "danger")}${summary([["原因", "订单退款"], ["关联订单", "尾号 4821"], ["调整数量", "−1,200 Halo Points", "total"], ["生效时间", "9 月 1 日 09:12"], ["当前状态", state.pointsAppealSubmitted ? "复核中" : "可在 9 月 16 日前申诉"]], "本次调整")}${disclosure("申诉期间会怎样", `<p>申诉期间本次调整继续生效。复核有误时会恢复 Points；原有效期不足 30 天或已经过期时，恢复后可使用 30 天。</p>`)}${actions([[state.pointsAppealSubmitted ? "申诉已提交" : "联系客服申诉", state.pointsAppealSubmitted ? "" : "commercial:points-appeal", "primary", state.pointsAppealSubmitted], ["返回 Halo Points", "go:PTS-01", "secondary"]])}` : state.pointsMode === "restored" ? `${feedback("1,200 Halo Points 已恢复", "复核确认本次调整有误，Points 已经重新可用。", "sage")}${summary([["恢复数量", "+1,200 Halo Points", "total"], ["恢复时间", "9 月 1 日 14:20"], ["新的使用期", "至 10 月 1 日 · 30 天"]], "复核结果")}${actions([["返回 Halo Points", "go:PTS-01", "primary"], ["进入兑换专区", "go:PTS-03", "secondary"]])}` : `<section class="ledger-list"><article><span class="ledger-icon plus">＋</span><div><strong>有效佩戴 12 小时</strong><small>今天 20:17 · 完成于 20:14</small></div><b>+20</b></article><article><span class="ledger-icon minus">−</span><div><strong>晚间身体扫描</strong><small>8 月 30 日 21:08</small></div><b>−1,200</b></article><article><span class="ledger-icon plus">＋</span><div><strong>会员活动奖励</strong><small>8 月 28 日 10:20</small></div><b>+100</b></article></section>${disclosure("查看 Halo Points 有效期", `<p>每笔获得的 Halo Points 都有自己的有效期。系统会优先使用更早到期的 Points。</p>`)}${actions([["进入兑换专区", "go:PTS-03", "primary"], ["返回 Halo Points", "go:PTS-01", "secondary"]])}`),
      "PTS-03": () => shell(item, "Halo Points 兑换", state.pointsMode === "pending" ? `${feedback("兑换暂时不可用", "Halo Points 调整完成后会自动恢复；你仍可浏览内容。", "warm")}${entry("Halo Studio 公开体验券", "指定公开场次使用", "6,000 Halo Points", "go:PTS-04")}` : `<section class="redeem-feature"><small>公开体验</small><h2>Halo Studio 公开体验券</h2><p>兑换后可在指定的 Halo Studio 公开场次中使用一次。</p><b>6,000 Halo Points</b>${actions([["查看并兑换", "go:PTS-04", "primary"]])}</section><section class="entry-section"><h3>更多兑换</h3>${entry("会员活动优先名额", "名额开放时可兑换", "8,000 Halo Points", "go:PTS-04")}${entry("限定活动纪念礼", "活动页公布时开放", "12,000 Halo Points", "go:PTS-04")}</section>`),
      "PTS-04": () => shell(item, "兑换", state.redemptionStatus === "success" ? `<section class="result-card success"><span aria-hidden="true">✓</span><h2>兑换成功</h2><p>体验券已加入 Halo Studio，可在指定公开场次中使用。</p></section>${summary([["兑换内容", "Halo Studio 公开体验券"], ["使用 Halo Points", "6,000"], ["剩余 Halo Points", "12,800", "total"]])}${actions([["查看可用场次", "go:STU-08", "primary"], ["继续兑换", "go:PTS-03", "secondary"]])}` : state.redemptionStatus === "processing" ? `${sectionWaiting("正在兑换", "请稍候，不要重复提交。")}${summary([["兑换内容", "Halo Studio 公开体验券"], ["所需 Halo Points", "6,000"]])}${actions([["返回兑换专区", "go:PTS-03", "secondary"]])}` : state.redemptionStatus === "failed" ? `${sectionFailure("兑换未完成", "Halo Points 尚未扣除，请检查网络后重试。")}${actions([["重新兑换", "commercial:redeem-retry", "primary"], ["返回兑换专区", "go:PTS-03", "secondary"]])}` : `${sectionProductSummary()}${summary([["所需 Halo Points", "6,000", "total"], ["兑换后余额", "12,800 Halo Points"], ["使用方式", "指定公开场次使用"]], "确认信息")}${feedback("确认后立即扣除", "确认前请查看使用期限与退回条件；是否可退以本次兑换说明为准。", "plain")}${actions([["确认兑换", state.pointsMode === "pending" ? "" : "commercial:redeem", "primary", state.pointsMode === "pending"], ["返回兑换专区", "go:PTS-03", "secondary"]])}`),
      "REF-01": () => shell(item, "会员推荐", `<section class="referral-card visual-referral"><small>会员推荐</small><h2>20,000 Halo Points</h2><p>${active ? "好友完成支付、注册与 Ring 激活后，你还可获得 150 HALO成长值。" : "好友完成支付、注册与 Ring 激活后发放 Points；你当前未激活 Ring，不获得成长值。"}</p></section>${flowStrip(["分享","支付","激活","奖励"],2,"referral")}${state.referralQrShown ? `<section class="qr-card referral-code-card"><span class="referral-code" aria-label="推荐码 HALO-8K2M">HALO<br>8K2M</span><strong>你的推荐码</strong><span>好友可在支付前确认来自你的推荐</span></section>` : ""}<section class="referral-status"><div><strong>2 / 12</strong><span>今年有效推荐</span></div><div><strong>1</strong><span>正在进行</span></div></section>${entry("好友已支付，等待激活", "激活并完成订单确认后发放", "进行中", "go:SEL-10", "warm")}${disclosure("奖励条件与例外", `<p>好友须完成实名注册和 Halo Ring 激活，订单未取消或全额退款；待处理售后、自购、关联账户互推或异常订单不奖励。每个自然年最多奖励 12 位有效新会员。</p>`)}${disclosure("订单来源怎样确认", `<p>好友可在支付前主动修改一次订单来源并再次确认；支付后不能更改。同一订单只记录一种来源，会员推荐奖励与体验顾问服务收益不会同时产生。</p>`)}${actions([[state.referralQrShown ? "隐藏推荐码" : "显示推荐码", "commercial:referral-qr", "primary"], ["返回会员中心", "go:MEM-01", "secondary"]])}`),
    };
    let rendered = pages[item.id]?.() || "";
    if (item.id === "PTS-02" && state.pointsMode === "normal" && window.HALO_STUDIO_BENEFIT_CLAIMED) {
      rendered = rendered.replace('<section class="ledger-list">', '<section class="ledger-list"><article><span class="ledger-icon plus">＋</span><div><strong>Halo Studio 活动权益</strong><small>今天 21:12 · 已到账</small></div><b>+30</b></article>');
    }
    return rendered;
  }

  function sectionResult(title, value, time) {
    return `<section class="result-inline"><span aria-hidden="true">✓</span><div><strong>${e(title)}</strong><b>${e(value)}</b><small>${e(time)}</small></div></section>`;
  }

  function sectionProductSummary() {
    return `<section class="product-summary"><span class="product-visual visual-audio" aria-hidden="true"><i></i></span><div><small>Halo Studio</small><strong>公开体验券</strong><span>指定场次使用一次</span></div></section>`;
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
      "SEL-01": () => shell(item, "Halo Select", `<section class="select-story"><small>今晚可选</small><h2>减少睡前光线干扰</h2><p>如果今晚想减少刺激，可以从更柔和的睡前环境开始。你可以先了解，不需要立刻购买。</p><button data-action="go:HAL-01">查看这条建议的依据 →</button></section>${productCard("夜间舒缓眼罩", `${status} · Halo Select 甄选`, "柔软遮光，减少睡前环境中的光线干扰", "go:SEL-03", "textile", productPrice)}<section class="series-section"><div><h3>按场景选</h3><button data-action="go:SEL-02">查看全部系列</button></div><div class="series-grid">${[["sleep","睡眠","慢下来"],["nutrition","营养","照顾日常"],["skin","肌肤","温柔接触"],["scent","嗅觉","营造氛围"]].map(([value,label,body]) => `<button data-action="commercial:category:${value}"><span class="series-mark ${value}" aria-hidden="true"></span><strong>${label}</strong><small>${body}</small></button>`).join("")}</div></section><section class="quick-links">${entry("购物车", state.cartCount ? `${state.cartCount} 件商品` : "暂时为空", "购买", "go:SEL-04")}${entry("我的订单", "查看物流与售后", "订单", "go:SEL-10")}</section>`),
      "SEL-02": () => shell(item, "Halo Select", `<label class="search-product"><span class="sr-only">搜索商品</span><input id="catalog-search" class="field" type="search" placeholder="搜索商品或场景" autocomplete="off"><i aria-hidden="true">⌕</i></label><div class="chip-row" role="tablist">${[["all","全部"],["sleep","睡眠"],["nutrition","营养"],["skin","肌肤"],["scent","嗅觉"]].map(([value,label]) => `<button role="tab" aria-selected="${state.category === value}" class="${state.category === value ? "active" : ""}" data-action="commercial:category:${value}">${label}</button>`).join("")}</div><section class="catalog-list">${(state.category === "all" || state.category === "sleep") ? productCard("夜间舒缓眼罩", `${status} · Halo Select 甄选`, "减少睡前环境中的光线干扰", "go:SEL-03", "textile", productPrice) : ""}${(state.category === "all" || state.category === "nutrition") ? productCard("CHRONO KEY 女性益生菌", "暂未开售", "每日一份的营养补充选择", "go:SEL-03", "nutrition") : ""}${(state.category === "all" || state.category === "scent") ? productCard("空间舒缓香气", "暂未开售", "用于晚间空间的轻柔香气", "go:SEL-03", "scent") : ""}${(state.category === "all" || state.category === "skin") ? productCard("夜间身体护理", "暂未开售", "适合睡前使用的身体护理", "go:SEL-03", "skin") : ""}</section><p id="catalog-empty" class="empty-copy" hidden>没有找到匹配内容，换一个关键词试试。</p>`),
      "SEL-03": () => shell(item, "商品", `<section class="product-detail-hero"><span class="product-stilllife visual-textile" aria-hidden="true"><i></i></span><div><small>${e(status)} · Halo Select 甄选</small><h2>夜间舒缓眼罩</h2><p>柔软亲肤的遮光设计，为睡前空间减少一点光线干扰。</p>${productPrice ? `<b>${e(productPrice)}</b>` : ""}</div></section>${summary([["规格", "柔雾灰 · 标准款"], ["发货", state.catalogMode === "presale" ? "预计 11 月 20 日前" : state.catalogMode === "display" ? "开放购买时通知" : "预计 48 小时内发出"], ["售后", "由 Halo 提供统一售后"]], "商品信息")}${disclosure("材质与使用建议", `<p>亲肤织物，建议睡前佩戴。首次使用前请阅读清洁说明；商品仅用于日常使用，不是医疗用品。</p>`)}${state.catalogMode === "display" ? `${feedback(state.catalogReminder ? "已开启开售提醒" : "暂未开放购买", state.catalogReminder ? "商品开放购买时会通知你。" : "可以先了解商品，开放购买后再决定。", "warm")}${actions([[state.catalogReminder ? "提醒已开启" : "开售时提醒我", state.catalogReminder ? "" : "commercial:catalog-reminder", "primary", state.catalogReminder], ["继续逛", "go:SEL-01", "secondary"]])}` : state.catalogMode === "presale" ? `${feedback("预售商品", "预计 11 月 20 日前发货；请在付款前确认发货时间和退款条件。", "warm")}${disclosure("预售退款说明", `<p>发货前与发货后的退款条件可能不同；提交订单前会再次显示本单适用条件。</p>`)}${actions([["加入预售购物车", "commercial:add-cart", "primary"], ["继续逛", "go:SEL-01", "secondary"]])}` : `${feedback("现货", "预计 48 小时内发出，结算时再次确认库存。", "sage")}${actions([["立即购买", "go:SEL-05", "primary"], ["加入购物车", "commercial:add-cart", "secondary"]])}`}`),
      "SEL-04": () => shell(item, "购物车", state.cartCount < 1 ? `<section class="empty-state"><span class="product-visual visual-textile" aria-hidden="true"><i></i></span><h2>购物车还是空的</h2><p>你可以返回 Halo Select 继续浏览。</p></section>${actions([["返回 Halo Select", "go:SEL-01", "primary"]])}` : `<section class="cart-line"><span class="product-visual visual-textile" aria-hidden="true"><i></i></span><div><strong>夜间舒缓眼罩</strong><span>柔雾灰 · 标准款</span><b>¥399</b></div><div class="quantity" aria-label="商品数量"><button data-action="commercial:cart-dec" aria-label="减少数量">−</button><span>${state.cartCount}</span><button data-action="commercial:cart-inc" aria-label="增加数量">＋</button></div></section>${summary([["商品小计", `¥${m.subtotal}`, "total"], ["预计发货", shipping]])}${actions([["去结算", "go:SEL-05", "primary"], ["继续选购", "go:SEL-01", "secondary"]])}`),
      "SEL-05": () => shell(item, "确认订单", `<button class="address-card" data-action="go:SEL-07"><span><small>送至</small><strong>林女士 · 138 **** 0000</strong><p>${state.selectedAddress === "shanghai" ? "上海市静安区 ****" : "杭州市西湖区 ****"}</p></span><i aria-hidden="true">›</i></button><section class="checkout-product"><span class="product-visual visual-textile" aria-hidden="true"><i></i></span><div><strong>夜间舒缓眼罩</strong><span>柔雾灰 · 标准款 × ${state.cartCount}</span><small>Halo 发货 · 统一售后</small></div><b>¥${m.subtotal}</b></section><section class="entry-section">${entry("优惠券", state.couponSelected ? "会员活动券 · 已减 ¥20" : "1 张可用", state.couponSelected ? "已使用" : "去选择", "go:SEL-06", state.couponSelected ? "sage" : "")}${entry("订单来源", state.attribution === "direct" ? "品牌直营" : state.attribution === "member" ? "会员好友推荐" : "Halo 体验顾问", state.attributionEditUsed ? "已确认，支付后冻结" : "支付前确认", "go:SEL-08")}</section>${state.pointsMode === "pending" ? feedback("Halo Points 暂不可用", "本单不会使用 Halo Points，你仍可继续支付。", "warm") : `<label class="points-switch"><span><strong>使用 3,000 Halo Points</strong><small>${state.pointsUsed ? "本单抵扣 ¥30" : "本次保留，不使用"}</small></span><input type="checkbox" data-action="commercial:points-use" ${state.pointsUsed ? "checked" : ""} aria-label="使用 3000 Halo Points"></label>`}${moneyEquation([[`¥${m.subtotal}`,"商品"],[m.coupon ? `¥${m.coupon}` : "¥0","优惠"],[m.points ? `¥${m.points}` : "¥0","Points"]],`¥${m.payable}`)}${summary([["商品金额", `¥${m.subtotal}`], ["优惠券", m.coupon ? `−¥${m.coupon}` : "未使用"], ["Halo Points 抵扣", m.points ? `−¥${m.points}` : "未使用"], ["实付", `¥${m.payable}`, "total"]], "金额明细")}<div class="sticky-primary checkout-submit">${actions([[`提交订单 · ¥${m.payable}`, "commercial:submit-order", "primary"]])}</div>${disclosure("配送与售后", `<p>${shipping}，由 Halo 提供统一客服、退款与售后。</p>`)}`),
      "SEL-06": () => shell(item, "优惠券", `<button class="coupon-card ${state.couponSelected ? "selected" : ""}" data-action="commercial:coupon-toggle"><span><small>会员活动券</small><strong>满 300 减 20</strong><p>2026 年 10 月 1 日前可用</p></span><i aria-hidden="true">${state.couponSelected ? "✓" : "○"}</i></button><section class="coupon-card disabled" aria-disabled="true"><span><small>预售专用券</small><strong>满 500 减 40</strong><p>当前商品不适用</p></span><i aria-hidden="true">—</i></section>${feedback(state.couponSelected ? "本单已减 ¥20" : "暂未使用优惠券", state.couponSelected ? "返回订单后会看到更新后的实付金额。" : "你可以不使用优惠券继续结算。", "sage")}${actions([["返回订单", "go:SEL-05", "primary"]])}`),
      "SEL-07": () => shell(item, "收货地址", `<button class="address-option ${state.selectedAddress === "shanghai" ? "selected" : ""}" data-action="commercial:address-select:shanghai"><span><small>默认</small><strong>林女士 · 138 **** 0000</strong><p>上海市静安区 ****</p></span><i aria-hidden="true">${state.selectedAddress === "shanghai" ? "✓" : "○"}</i></button><button class="address-option ${state.selectedAddress === "hangzhou" ? "selected" : ""}" data-action="commercial:address-select:hangzhou"><span><strong>林女士 · 138 **** 0000</strong><p>杭州市西湖区 ****</p></span><i aria-hidden="true">${state.selectedAddress === "hangzhou" ? "✓" : "○"}</i></button>${state.addressFormOpen ? `<section class="summary-card"><h3>新增收货地址</h3><label class="field-label">收货人<input class="field" value=""></label><label class="field-label">手机号<input class="field" inputmode="tel" value=""></label><label class="field-label">详细地址<textarea class="field" placeholder="街道、门牌号"></textarea></label>${actions([["保存地址", "commercial:address-save", "primary"], ["取消", "commercial:address-form:close", "secondary"]])}</section>` : actions([["新增地址", "commercial:address-form:open", "primary"], ["使用所选地址", "go:SEL-05", "secondary"]])}`),
      "SEL-08": () => shell(item, "订单来源", `<p class="lead-copy">是谁向你介绍了这件商品？支付前可以主动修改一次；支付后不能更改。</p><div class="attribution-list">${[["direct","品牌直营","我直接从 Halo 了解并购买"],["member","会员好友推荐","一位 Halo 会员把它分享给我"],["channel","Halo 渠道顾问","一位渠道顾问为我提供了介绍"]].map(([value,name,body]) => `<button class="${state.attribution === value ? "active" : ""}" data-action="commercial:attribution:${value}" ${state.attributionEditUsed && state.attribution !== value ? "disabled aria-disabled=\"true\"" : ""}><span aria-hidden="true">${state.attribution === value ? "✓" : "○"}</span><div><strong>${name}</strong><p>${body}</p></div></button>`).join("")}</div>${feedback(state.attributionEditUsed ? "订单来源已确认" : "一个订单只确认一种来源", state.attributionEditUsed ? "本次修改机会已使用；支付后订单来源会锁定。" : "这不会改变公开价格。同一订单不会同时产生会员推荐奖励和渠道现金收益。", "plain")}${actions([["返回订单", "go:SEL-05", "primary"]])}`),
      "SEL-09": () => shell(item, "支付", state.paymentStatus === "success" ? `<section class="result-card success"><span aria-hidden="true">✓</span><h2>支付成功</h2><p>订单已创建，${shipping}。</p><b>¥${m.payable}</b></section>${actions([["查看订单", "go:SEL-11", "primary"], ["返回 Halo Select", "go:SEL-01", "secondary"]])}` : state.paymentStatus === "processing" ? `${sectionWaiting("正在确认支付", "请稍候，不要重复提交。")}${summary([["支付金额", `¥${m.payable}`], ["支付方式", "第三方安全支付"]])}` : state.paymentStatus === "cancelled" ? `${sectionFailure("支付已取消", "本次没有扣款，订单仍保留在待支付中。")}${actions([["重新支付", "commercial:payment-retry", "primary"], ["查看待支付订单", "go:SEL-10", "secondary"]])}` : state.paymentStatus === "failed" ? `${sectionFailure("支付未完成", "本次没有扣款，订单仍为待支付。请检查网络或更换支付方式后重试。")}${actions([["重新支付", "commercial:payment-retry", "primary"], ["查看待支付订单", "go:SEL-10", "secondary"]])}` : `<section class="payment-card"><small>本次支付</small><strong>¥${m.payable}</strong><p>夜间舒缓眼罩 × ${state.cartCount}</p></section>${summary([["支付方式", "第三方安全支付"], ["Halo Points 抵扣", m.points ? "3,000" : "未使用"], ["订单来源", state.attribution === "direct" ? "品牌直营" : state.attribution === "member" ? "会员好友推荐" : "Halo 渠道顾问"]])}${feedback("支付后订单来源不可更改", "本单只记录当前确认的来源。", "plain")}${actions([[`确认支付 ¥${m.payable}`, "commercial:payment-confirm", "primary"], ["取消支付", "commercial:payment-state:cancelled", "secondary"]])}`),
      "SEL-10": () => shell(item, "订单", `<div class="chip-row"><button class="active">全部</button><button>待付款</button><button>待收货</button><button>售后</button></div><section class="order-list">${orderCard("HS202609010021", "待收货", "夜间舒缓眼罩", "预计 9 月 3 日送达", "¥349", "go:SEL-11", "sage")}${orderCard("HS202608280009", "预售中", "HALORING 智能戒指", "预计 11 月 20 日前发货", "已支付", "go:SEL-11")}${orderCard("HS202608110003", "售后中", "空间舒缓香气", "退款处理中", "¥369", "go:SEL-13", "warm")}</section>`),
      "SEL-11": () => shell(item, "订单详情", `<section class="order-status"><small>待收货</small><h2>运输中</h2><p>预计 9 月 3 日送达</p></section>${summary([["商品", "夜间舒缓眼罩 · 标准款"], ["商品金额", "¥399"], ["优惠券", "−¥20"], ["Halo Points 抵扣", "3,000 Points（抵扣 ¥30）"], ["实付", "¥349", "total"]], "订单金额")}${summary([["配送", "Halo 发货"], ["物流", "今天 09:42 已离开发货仓"], ["收货地址", "上海市静安区 ****"]], "配送信息")}${state.logisticsExpanded ? stepper(["已发货 · 9 月 1 日 09:42", "运输中 · 9 月 2 日 08:10", "等待送达 · 预计 9 月 3 日"], 1) : ""}${disclosure("订单来源与售后", `<p>来源：${state.attribution === "direct" ? "品牌直营" : state.attribution === "member" ? "会员好友推荐" : "Halo 渠道顾问"}。支付后来源不可更改。本单由 Halo 提供统一客服、退款与售后。</p>`)}${actions([[state.logisticsExpanded ? "收起物流进度" : "查看物流进度", "commercial:logistics-toggle", "primary"], ["申请售后", "go:SEL-12", "secondary"]])}`),
      "SEL-12": () => shell(item, "申请售后", `<section class="checkout-product compact"><span class="product-visual visual-textile" aria-hidden="true"><i></i></span><div><strong>夜间舒缓眼罩</strong><span>订单 HS202609010021</span></div></section><label class="field-label">售后类型<select class="field"><option>退货退款</option><option>仅退款</option><option>换货</option></select></label><label class="field-label">原因<select class="field"><option>商品与描述不符</option><option>物流问题</option><option>质量问题</option><option>其他</option></select></label><label class="field-label">补充说明<textarea class="field" placeholder="选填，帮助我们更快处理"></textarea></label>${summary([["预计原路退款", "¥349"], ["预计恢复", "3,000 Halo Points"], ["Points 使用期", "恢复原使用期；已过期或不足 30 天时，恢复后可使用 30 天"]], "退款构成")}${feedback("提交后查看处理时间", "预计反馈时间会在售后进度页显示。", "plain")}${actions([["提交售后申请", "commercial:aftersale", "primary"], ["返回订单", "go:SEL-11", "secondary"]])}`),
      "SEL-13": () => shell(item, "售后进度", `${feedback(state.afterSaleStatus === "submitted" ? "申请已提交" : "退款处理中", state.afterSaleStatus === "submitted" ? "预计反馈时间会在状态更新后显示。" : "现金原路退回；Halo Points 单独恢复。", state.afterSaleStatus === "submitted" ? "sage" : "warm")}${flowStrip(["提交","审核 / 寄回","退款"],1,"aftersale")}${summary([["售后单号", "AS20260901004"], ["现金退款", "¥349 · 原路退回"], ["Halo Points 恢复", "3,000"], ["当前状态", "处理中"]])}${state.afterSaleUploadSelected ? feedback("凭证已添加", "receipt-photo.jpg · 1.8 MB", "sage") : ""}${actions([[state.afterSaleUploadSelected ? "更换凭证" : "补充凭证", "commercial:aftersale-upload", "secondary"], ["联系 Halo 售后", "go:HELP-03", "primary"]])}`),
    };
    return pages[item.id]?.() || "";
  }

  function orderCard(id, status, title, body, amount, action, tone = "") {
    return `<button class="order-card ${e(tone)}" data-action="${e(action)}"><span><small>${e(status)}</small><strong>${e(title)}</strong><p>${e(body)}</p></span><span><b>${e(amount)}</b><i aria-hidden="true">›</i></span></button>`;
  }

  function sectionFailure(title, body) {
    return `<section class="result-card failure"><span aria-hidden="true">!</span><h2>${e(title)}</h2><p>${e(body)}</p></section>`;
  }

  function channel(item) {
    if (state.channelIdentity === "paused" && !["CHN-20", "CHN-21", "CHN-22", "CHN-23"].includes(item.id)) return shell(item, "体验顾问", `${feedback("经营已暂停", "新的分享与服务订单暂不可用；历史订单、账本和待处理服务仍可查看。", "warm")}${actions([["查看历史收益", "go:CHN-22", "primary"], ["联系企业微信客服", "go:HELP-03", "secondary"]])}`);
    if (state.channelIdentity === "terminated" && !["CHN-20", "CHN-21", "CHN-22", "CHN-23"].includes(item.id)) return shell(item, "体验顾问", `${feedback("体验顾问合作已结束", "新的经营工具已关闭；历史结算和待处理事项仍可查看。", "plain")}${actions([["查看历史结算", "go:CHN-22", "primary"], ["联系企业微信客服", "go:HELP-03", "secondary"]])}`);
    const channelHome = state.channelMode === "new"
      ? `<section class="channel-dashboard"><div><small>本月经营</small><h2>还没有服务订单</h2><p>从第一步开始，数据会在产生后显示。</p></div><div class="hero-facts"><div><span>有效订单</span><strong>0</strong></div><div><span>待确认收益</span><strong>¥0.00</strong></div></div></section><section class="next-action-card"><span>第一步</span><h3>检查专属二维码</h3><p>确认身份、链接和当前可分享内容。</p>${actions([["查看推广工具", "go:CHN-26", "primary"]])}</section><section class="entry-section">${entry("内容与政策", "查看当前可分享内容", "服务", "go:CHN-24")}${entry("身份与推广工具", "二维码、链接与素材", "工具", "go:CHN-26")}</section>${feedback("数据会在服务发生后更新", "订单完成来源确认后，相关进度会显示在这里。", "plain")}`
      : `<section class="channel-dashboard"><div><small>本月经营</small><h2>2 笔订单待确认</h2><p>截至今天 14:30</p></div><div class="hero-facts"><div><span>有效订单</span><strong>2</strong></div><div><span>待确认收益</span><strong>¥1,995.00</strong></div></div></section><section class="next-action-card"><span>今天的待办</span><h3>一笔订单正在确认收益</h3><p>预计 9 月 8 日完成收益确认；通过结算条件后，才会计入可提现余额。</p>${actions([["查看订单", "go:CHN-20", "primary"]])}</section><section class="entry-section">${entry("收益明细", "可提现 ¥1,200.00", "账户", "go:CHN-22", "sage")}${entry("内容与政策", "2 项必读更新", "服务", "go:CHN-24")}${entry("身份与推广工具", "二维码、链接与素材", "工具", "go:CHN-26")}</section>${disclosure("这里统计哪些收益", `<p>只统计你本人直接服务产生的收益；尚未开放的收益类型不会显示。</p>`)}`;
    const specific = {
      "CHN-01": `<section class="channel-intro"><small>Halo 体验顾问</small><h2>申请成为体验顾问</h2><p>完成 5 步，身份生效后开放顾问工具。购买或激活设备不会自动获得体验顾问身份。</p></section>${flowStrip(["身份","设备","学习","审核","生效"],0,"advisor")}${actions([["开始申请", "go:CHN-02", "primary"]])}<button class="inline-page-link" data-action="go:CHN-11">查看已有申请进度</button>${feedback("顾问等级从 L1 开始", "顾问等级与会员等级相互独立。", "plain")}`,
      "CHN-02": `<section class="form-intro"><h2>确认是你本人</h2><p>用于顾问身份、协议和收款核验。证件信息会按隐私政策保护。</p></section><label class="field-label">姓名<input class="field" value="A**" autocomplete="name"></label><label class="field-label">证件号码<input class="field" value="310***********0021" inputmode="text"></label><label class="check-line"><input type="checkbox" checked> 我已阅读身份核验与隐私说明</label>${actions([["提交核验", "go:CHN-03", "primary"]])}`,
      "CHN-03": `${sectionWaiting("正在确认身份", "结果和预计反馈时间会在这里更新。")}${summary([["提交时间", "今天 10:08"], ["当前状态", "正在确认"]])}${actions([["刷新结果", "toast:暂时没有新结果，请稍后再试", "primary"], ["需要帮助", "go:HELP-03", "secondary"]])}`,
      "CHN-04": `${sectionFailure("这次没有确认成功", "证件信息暂时无法完成核验，请检查后重新提交。")}${actions([["重新确认身份", "go:CHN-02", "primary"], ["申请人工复核", "toast:复核申请已提交，进度会在申请页更新", "secondary"]])}`,
      "CHN-05": `${feedback("还需要激活本人的 Halo Ring", "体验顾问需要先完成真实的产品体验。设备激活不会自动产生顾问身份。", "warm")}${actions([["去绑定与激活", "go:DEV-01", "primary"], ["刷新设备状态", "toast:尚未检测到已激活设备", "secondary"]])}`,
      "CHN-06": `<section class="form-intro"><h2>告诉我们你的服务计划</h2><p>顾问等级从 L1 开始，与会员等级相互独立。</p></section><label class="field-label">主要服务地区<select class="field"><option>上海市</option><option>北京市</option><option>杭州市</option><option>其他地区</option></select></label><label class="field-label">相关经验<select class="field"><option>健康生活方式服务</option><option>零售与客户服务</option><option>内容与社群</option><option>暂无相关经验</option></select></label><label class="field-label">收款身份<select class="field"><option>自然人</option><option>企业或个体工商户</option></select></label><label class="check-line"><input type="checkbox" checked> 我确认信息真实，并愿意遵守宣传与服务边界</label>${actions([["保存草稿", "toast:草稿已保存，可从“我的－加入渠道”继续填写", "secondary"], ["提交并开始学习", "go:CHN-08", "primary"]])}`,
      "CHN-07": `<section class="application-snapshot"><small>已提交资料</small><h2>L1 · Halo 体验顾问</h2><p>提交于 9 月 1 日 10:22</p></section>${summary([["服务地区", "上海市"], ["相关经验", "健康生活方式服务"], ["收款身份", "自然人"], ["设备状态", "已激活"]], "申请信息")}${feedback("已提交资料暂不可修改", "如需补充或更正，我们会说明具体项目。", "plain")}${actions([["返回申请进度", "go:CHN-11", "primary"]])}`,
      "CHN-08": `<section class="training-summary"><div><strong>1 / 3</strong><span>已完成课程</span></div>${progress(33, "学习进度")}</section><section class="task-list">${task("哪些产品信息可以介绍", "约 8 分钟", "已完成", "go:CHN-09", "success")}${task("怎样介绍健康功能", "约 10 分钟", "继续学习", "go:CHN-09", "progress")}${task("订单来源与售后怎么处理", "约 8 分钟", "未开始", "go:CHN-09")}</section>${feedback("完成课程和测评后计入进度", "你可以随时离开，学习位置会保留。", "plain")}`,
      "CHN-09": `<article class="lesson-card"><small>课程 2 · 约 10 分钟</small><h2>怎样介绍健康功能</h2><p>Halo 帮助用户理解日常身体状态，但不能被描述为诊断工具或治疗方案；介绍渠道合作时，也不能承诺确定收益。</p><blockquote>推荐表达：它能帮助你观察睡眠、能量与节律趋势，并给出日常行动建议。</blockquote></article>${disclosure("三条必须记住的边界", `<ul class="plain-list"><li>不把身体状态说成疾病诊断</li><li>不承诺治疗结果或确定收益</li><li>不改写未经审核的产品功效</li></ul>`)}${actions([["完成本课并测评", "go:CHN-10", "primary"], ["返回课程列表", "go:CHN-08", "secondary"]])}`,
      "CHN-10": `<fieldset class="assessment"><legend>客户问：“戒指能诊断失眠吗？”</legend><label><input type="radio" name="channel-assessment" value="yes"> 可以，只要数据足够</label><label><input type="radio" name="channel-assessment" value="no"> 不可以，它提供日常身体状态参考</label><label><input type="radio" name="channel-assessment" value="depends"> 由体验顾问自行判断</label></fieldset>${state.assessmentFeedback ? feedback(state.assessmentFeedback === "correct" ? "回答正确" : "再想一想", state.assessmentFeedback === "correct" ? "Halo 不做医疗诊断，表达应回到日常状态与行动建议。" : "诊断必须由专业医疗机构完成。", state.assessmentFeedback === "correct" ? "sage" : "warm") : ""}${actions([[state.assessmentFeedback === "correct" ? "继续提交审核" : "提交答案", state.assessmentFeedback === "correct" ? "go:CHN-11" : "commercial:assessment-submit", "primary", !state.assessmentChoice]])}`,
      "CHN-11": `${sectionWaiting("正在审核", "结果和预计反馈时间会在这里更新。")}${stepper(["确认身份", "完成基础学习", "提交审核", "协议与收款"], 2)}${summary([["身份确认", "已完成"], ["申请资料", "已提交"], ["基础学习", "已完成"], ["当前状态", "正在审核"]])}${actions([["查看已提交资料", "go:CHN-07", "secondary"], ["撤回申请", "go:CHN-14", "text-button"]])}`,
      "CHN-12": `${feedback("还需要一项资料", "请在 9 月 10 日前补充收款身份说明。", "warm")}<section class="upload-card ${state.uploadSelected ? "selected" : ""}"><span aria-hidden="true">${state.uploadSelected ? "✓" : "＋"}</span><div><strong>${state.uploadSelected ? "收款身份说明已选择" : "收款身份说明"}</strong><p>${state.uploadSelected ? "settlement-note.pdf · 2.4 MB" : "支持 PDF、JPG 或 PNG，单个文件不超过 10 MB"}</p></div><button data-action="commercial:upload-select">${state.uploadSelected ? "更换文件" : "选择文件"}</button></section>${state.uploadSelected ? feedback("文件已准备提交", "请核对文件后提交补充资料。", "sage") : ""}${actions([["提交补充资料", state.uploadSelected ? "go:CHN-11" : "", "primary", !state.uploadSelected], ["查看原申请", "go:CHN-07", "secondary"]])}`,
      "CHN-13": `${sectionFailure("这次申请未通过", "你选择的服务地区暂未开放体验顾问服务。")}${feedback("你仍可以申请复核", "我们会重新检查本次申请；服务地区开放后也可以再次申请。", "plain")}${actions([["申请复核", "toast:复核申请已提交，进度会在申请页更新", "primary"], ["重新申请", "go:CHN-02", "secondary"]])}`,
      "CHN-14": `${sectionFailure("确定撤回这次申请？", "撤回后本次审核会停止；之后可以重新申请。")}${summary([["会保留", "已提交资料与审核记录"], ["不会影响", "会员身份、Halo Points 与健康功能"]])}${actions([["确认撤回", "go:CHN-01", "danger-button"], ["继续等待审核", "go:CHN-11", "secondary"]])}`,
      "CHN-15": `<section class="result-card success"><span aria-hidden="true">✓</span><h2>申请已通过</h2><p>还需完成协议、收款与税务资料；收到身份生效通知后，经营工具才会开放。</p></section>${stepper(["确认身份", "完成基础学习", "提交审核", "协议与收款"], 3)}${actions([["核对协议与收款资料", "go:CHN-16", "primary"]])}`,
      "CHN-16": state.channelIdentity === "activation-pending" ? `${sectionWaiting("资料已提交，等待身份生效", "完成后会在这里显示生效时间，并开放顾问工具。")}${summary([["渠道协议", "已确认"], ["收款账户", "尾号 8821 · 已核验"], ["收款身份", "自然人"], ["当前状态", "等待生效"]])}${actions([["刷新状态", "commercial:channel-refresh", "primary"], ["需要帮助", "go:HELP-03", "secondary"]])}` : `${summary([["渠道协议", "已阅读，待确认"], ["收款账户", "尾号 8821 · 已核验"], ["收款身份", "自然人"], ["税务信息", "已完成"]], "提交前核对")}${disclosure("查看协议摘要", `<p>请基于真实产品体验提供介绍，不作医疗诊断、功效夸大或收益承诺。订单、客户与收款信息仅用于授权服务。</p>`)}<label class="check-line"><input type="checkbox" checked> 我已核对协议、账户与收款信息</label>${actions([["提交资料并等待身份生效", "commercial:channel-activate", "primary"], ["需要帮助", "go:HELP-03", "secondary"]])}`,
      "CHN-17": `<section class="result-card success"><span aria-hidden="true">✓</span><h2>顾问工具已开通</h2><p>Halo 体验顾问身份已经生效，可以查看专属工具和服务订单。</p></section>${summary([["当前身份", "L1 · Halo 体验顾问"], ["当前直接服务比例", "25%"], ["渠道编号", "CH0086"], ["生效时间", "今天 14:30"]])}${feedback("服务比例说明", "以当前有效协议及具体订单确认页为准。", "plain")}${actions([["查看第一步", "go:CHN-18", "primary"]])}`,
      "CHN-18": `<section class="channel-zero"><span aria-hidden="true">○</span><h2>还没有服务订单</h2><p>先检查你的专属链接，再分享经过审核的产品内容。</p></section>${summary([["当前身份", "L1 · Halo 体验顾问"], ["当前直接服务比例", "25%"]])}${feedback("服务比例说明", "以当前有效协议及具体订单确认页为准。", "plain")}<section class="next-action-card"><span>第一步</span><h3>检查专属二维码</h3><p>确认身份、链接和当前可分享内容。</p>${actions([["查看推广工具", "go:CHN-26", "primary"], ["查看内容与政策", "go:CHN-24", "secondary"]])}</section>`,
      "CHN-19": channelHome,
      "CHN-20": `<section class="order-list">${orderCard("HR20260901018", "客户已激活", "HALORING 智能戒指", "收益待确认", "¥997.50", "go:CHN-21", "sage")}${orderCard("HR20260829007", "收益待确认", "夜间舒缓眼罩", "预计 9 月 8 日完成确认", "待确认", "go:CHN-21")}</section>${feedback("客户已在支付前确认订单来源", "支付后订单来源不能更改。如你发现记录有误，可以申请复核。", "plain")}`,
      "CHN-21": `<section class="earning-feature"><small>预计收益</small><strong>¥997.50</strong><p>订单完成确认后进入待结算</p></section><section class="earning-equation"><span><small>有效订单金额</small><strong>¥3,990</strong></span><i>×</i><span><small>服务比例</small><strong>25%</strong></span><i>=</i><span class="result"><small>预计收益</small><strong>¥997.50</strong></span></section>${flowStrip(["待确认","待结算","可提现","已支付"],0,"cash")}${summary([["关联订单", "HR20260901018"], ["当前状态", "收益待确认"], ["预计确认", "9 月 8 日"]], "订单与状态")}${disclosure("退款会怎样影响收益", `<p>退款确认后，本笔预计收益会相应减少；如相关收益已经结算，变化会显示在之后的收益明细中。</p>`)}${actions([["查看收益明细", "go:CHN-22", "primary"], ["申请收益复核", "toast:收益复核申请已提交，进度会在收益明细更新", "secondary"]])}`,
      "CHN-22": `<section class="earnings-overview"><div class="primary-earning"><small>可提现</small><strong>¥1,200.00</strong><span>正式结算已完成</span></div><div><span>待确认</span><strong>¥1,995.00</strong></div><div><span>待结算</span><strong>¥820.00</strong></div><div><span>历史已支付</span><strong>¥3,800.00</strong></div></section>${flowStrip(["待确认","待结算","可提现","已支付"],2,"cash")}<section class="ledger-list"><article><span class="ledger-icon plus">＋</span><div><strong>订单 HR20260901018</strong><small>今天 14:30 · 待确认</small></div><b>+¥997.50</b></article><article><span class="ledger-icon minus">−</span><div><strong>退款调整</strong><small>8 月 29 日 11:02</small></div><b>−¥120.00</b></article></section>${disclosure("收益状态说明", `<p>确认完成后进入待结算，正式结算完成后计入可提现余额。</p><section class="summary-card embedded"><dl class="summary-list"><div><dt>处理中</dt><dd>¥0.00</dd></div><div><dt>提现中</dt><dd>¥0.00</dd></div></dl></section>`)}${actions([["对账并提现", "go:CHN-23", "primary"], ["查看订单", "go:CHN-20", "secondary"]])}`,
      "CHN-23": state.withdrawalStatus === "submitted" ? `<section class="result-card success"><span aria-hidden="true">✓</span><h2>提现申请已提交</h2><p>到账时间会在收款渠道确认后更新。</p></section>${flowStrip(["提交","税费确认","到账"],1,"cash")}${summary([["申请金额", `¥${Number(state.withdrawalAmount).toFixed(2)}`], ["收款账户", "尾号 8821"], ["申请编号", "WD20260901018"], ["当前状态", "处理中"]])}${actions([["返回收益明细", "go:CHN-22", "primary"], ["查看经营首页", "go:CHN-19", "secondary"]])}` : `<section class="withdraw-balance"><small>可提现余额</small><strong>¥1,200.00</strong><p>收款账户 · 尾号 8821</p></section>${flowStrip(["确认余额","核对税费","到账账户"],0,"cash")}<label class="field-label withdrawal-field">提现金额<div><span>¥</span><input id="channel-withdrawal" class="field" inputmode="decimal" placeholder="0.00" value="${e(state.withdrawalAmount)}" aria-describedby="withdrawal-help withdrawal-error"></div><small id="withdrawal-help">单次最低 ¥100.00，最多 ¥1,200.00</small><span id="withdrawal-error" class="field-error" role="alert"></span></label>${summary([["预计到账", "提交成功后显示"], ["预计税费", "提交前按本次金额确认"], ["到账账户", "尾号 8821"]])}<label class="check-line"><input id="withdrawal-confirm" type="checkbox" data-action="commercial:withdraw-confirm" ${state.withdrawalConfirmed ? "checked" : ""}> 我已核对金额、预计税费与收款账户</label>${actions([["提交提现", "commercial:withdraw", "primary", !isWithdrawalValid()], ["查看收益明细", "go:CHN-22", "secondary"]])}`,
      "CHN-24": `<section class="content-list">${entry("健康表达边界", "更新于 9 月 1 日 · 必读", "当前有效", "go:CHN-25", "warm")}${entry("当前渠道服务政策", "收益、客户服务与售后说明", "当前有效", "go:CHN-25", "sage")}${entry("客户教育素材", "3 张可分享内容", "已审核", "go:CHN-25")}</section>${feedback("这里只显示当前可以使用的内容", "过期或撤回的内容会停止分享，并显示替代内容。", "plain")}`,
      "CHN-25": `<article class="policy-article"><small>当前有效 · 2026 年 9 月发布</small><h2>健康表达边界</h2><p>向客户介绍 Halo 时，请说明它用于观察日常身体状态并提供生活方式建议，不用于诊断、治疗，也不能替代医生或其他专业医疗人员的判断。</p><h3>可以这样说</h3><p>“它可以帮助你观察睡眠、能量与节律的变化，并理解今天适合什么样的行动。”</p><h3>不要这样说</h3><p>不要承诺诊断、治疗效果、确定收益或夸大未经确认的产品能力。</p></article>${feedback("分享时使用当前版本", "请直接分享这里的内容，不改写功效或收益承诺。", "warm")}${actions([["确认已读", "toast:已读状态已记录", "primary"], ["分享当前版本", "toast:内容链接已复制", "secondary"]])}`,
      "CHN-26": `<section class="qr-card"><img src="assets/channel-qr-CH0086.png" alt="Halo 体验顾问 CH0086 专属二维码"><strong>CH0086 · Halo 体验顾问</strong><span>扫码后可查看你的介绍页</span></section>${summary([["专属链接", "当前有效"], ["身份", "L1 · Halo 体验顾问"], ["最近更新", "今天 14:30"]])}${actions([["复制专属链接", "toast:专属链接已复制", "primary"], ["保存二维码", "toast:二维码已保存", "secondary"]])}${feedback("分享前先看商品页", "只分享商品页当前显示的状态和已审核内容。", "plain")}`,
    };
    const body = specific[item.id] || `${feedback(item.name, item.note || item.function, "plain")}${actions([["返回经营首页", "go:CHN-19", "primary"]])}`;
    return shell(item, "体验顾问", body);
  }

  function sectionWaiting(title, body) {
    return `<section class="result-card waiting"><span class="spinner" aria-hidden="true"></span><h2>${e(title)}</h2><p>${e(body)}</p></section>`;
  }

  function isWithdrawalValid() {
    const amount = Number(state.withdrawalAmount);
    return Number.isFinite(amount) && amount >= 100 && amount <= 1200 && state.withdrawalConfirmed;
  }

  function syncWithdrawalControls() {
    const button = document.querySelector('[data-action="commercial:withdraw"]');
    const error = document.getElementById("withdrawal-error");
    if (button) {
      button.disabled = !isWithdrawalValid();
      button.setAttribute("aria-disabled", String(!isWithdrawalValid()));
    }
    if (!error) return;
    const amount = Number(state.withdrawalAmount);
    error.textContent = !state.withdrawalAmount ? "" : !Number.isFinite(amount) || amount <= 0 ? "请输入有效金额" : amount < 100 ? "单次最低提现 ¥100" : amount > 1200 ? "不能超过可提现余额 ¥1,200" : "";
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
    if (prefix === "SEL") controls = `${reviewGroup("商品状态", [["暂未开售","commercial:catalog:display",state.catalogMode === "display"],["预售","commercial:catalog:presale",state.catalogMode === "presale"],["现货","commercial:catalog:sale",state.catalogMode === "sale"]])}${reviewGroup("支付结果", [["待支付","commercial:payment-state:ready",state.paymentStatus === "ready"],["处理中","commercial:payment-state:processing",state.paymentStatus === "processing"],["成功","commercial:payment-state:success",state.paymentStatus === "success"],["失败","commercial:payment-state:failed",state.paymentStatus === "failed"],["已取消","commercial:payment-state:cancelled",state.paymentStatus === "cancelled"]])}${reviewGroup("售后结果", [["处理中","commercial:aftersale-state:ready",state.afterSaleStatus === "ready"],["已提交","commercial:aftersale-state:submitted",state.afterSaleStatus === "submitted"]])}`;
    if (prefix === "CHN") controls = `${reviewGroup("申请结果页", [["审核中","commercial:identity-state:application",state.channelIdentity === "application"],["需补件","commercial:identity-state:needs-info",state.channelIdentity === "needs-info"],["未通过","go:CHN-13",item.id === "CHN-13"],["已通过","commercial:identity-state:approved",state.channelIdentity === "approved"]])}${reviewGroup("身份状态", [["未申请","commercial:identity-state:inactive",state.channelIdentity === "inactive"],["待生效","commercial:identity-state:activation-pending",state.channelIdentity === "activation-pending"],["已生效","commercial:identity-state:active",state.channelIdentity === "active"],["已暂停","commercial:identity-state:paused",state.channelIdentity === "paused"],["合作结束","commercial:identity-state:terminated",state.channelIdentity === "terminated"]])}${reviewGroup("经营数据", [["新用户","commercial:channel-mode:new",state.channelMode === "new"],["已有订单","commercial:channel-mode:established",state.channelMode === "established"]])}`;
    return `<section class="review-controls"><p>PROTOTYPE STATES</p><h3>审阅状态</h3><small>仅用于产品、UI、开发与 QA 切换验收状态；不会出现在设备界面。</small>${controls}</section>`;
  }

  function render(item, ctx) {
    if (item.id.startsWith("MEM-") || item.id.startsWith("PTS-") || item.id.startsWith("REF-")) return member(item, ctx);
    if (item.id.startsWith("SEL-")) return select(item);
    if (item.id.startsWith("CHN-")) return channel(item);
    return "";
  }

  function handleAction(action, ctx) {
    if (!action || !action.startsWith("commercial:")) return false;
    const [, command, value] = action.split(":");
    if (command === "task-state") {
      state.taskStatus = value;
      if (value === "validating") ctx.track("membership_task_validation_started", { task_id: "wear-12h" });
      if (value === "posted") ctx.track("membership_task_reward_posted", { task_id: "wear-12h" });
      ctx.render();
      return true;
    }
    if (command === "task-appeal") { ctx.track("membership_task_adjustment_appeal_handoff", { task_id: "wear-12h", channel: "enterprise-wechat" }); ctx.go("HELP-03"); return true; }
    if (command === "task-refresh") { ctx.render(); ctx.flash("已检查，暂无新的状态"); return true; }
    if (command === "application-appeal" || command === "earning-appeal") { ctx.track(`${command}_handoff`, { channel: "enterprise-wechat" }); ctx.go("HELP-03"); return true; }
    if (command === "application-draft") { ctx.track("advisor_application_draft_saved"); ctx.flash("草稿已保存，可从“我的－申请体验顾问”继续填写"); return true; }
    if (command === "policy-read") { ctx.track("advisor_policy_read", { policy_version: "2026-09" }); ctx.flash("已读状态已记录"); return true; }
    if (command === "policy-copy") {
      navigator.clipboard?.writeText("https://haloring.example/advisor/policy/2026-09").then(() => ctx.flash("内容链接已复制")).catch(() => ctx.flash("复制未完成，请允许剪贴板权限后重试"));
      return true;
    }
    if (command === "advisor-link-copy") {
      navigator.clipboard?.writeText("https://haloring.example/advisor/CH0086").then(() => ctx.flash("专属链接已复制")).catch(() => ctx.flash("复制未完成，请允许剪贴板权限后重试"));
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
      state.upgradePosted = value === "posted";
      if (state.upgradePosted) ctx.track("membership_upgraded", { level: "L3", effective_from: "posted_at" });
      ctx.render();
      return true;
    }
    if (command === "points-state") {
      state.pointsMode = value;
      if (value !== "pending") state.pointsAppealSubmitted = false;
      ctx.track("membership_ledger_viewed", { correction_status: value });
      if (value === "pending") ctx.track("points_correction_viewed", { correction_status: value });
      if (value === "restored") ctx.track("points_correction_restored", { validity_days: 30 });
      ctx.render();
      return true;
    }
    if (command === "task-period") { state.taskPeriod = value; ctx.render(); return true; }
    if (command === "points-appeal") { ctx.track("points_correction_appeal_handoff", { channel: "enterprise-wechat" }); ctx.go("HELP-03"); return true; }
    if (command === "redeem") {
      state.redemptionStatus = "processing";
      ctx.track("points_redemption_started", { item_id: "studio-public-session-pass" });
      ctx.render();
      setTimeout(() => {
        if (state.redemptionStatus !== "processing") return;
        state.redemptionStatus = "success";
        ctx.track("points_redemption_completed", { item_id: "studio-public-session-pass" });
        ctx.render();
      }, 650);
      return true;
    }
    if (command === "redeem-retry") { state.redemptionStatus = "ready"; ctx.render(); return true; }
    if (command === "redeem-state") { state.redemptionStatus = value; ctx.render(); return true; }
    if (command === "catalog") { state.catalogMode = value; ctx.render(); return true; }
    if (command === "catalog-reminder") { state.catalogReminder = true; ctx.render(); return true; }
    if (command === "referral-qr") { state.referralQrShown = !state.referralQrShown; ctx.render(); return true; }
    if (command === "channel-mode") { state.channelMode = value; ctx.render(); return true; }
    if (command === "identity-state") {
      state.channelIdentity = value;
      const route = { inactive: "CHN-01", application: "CHN-11", "needs-info": "CHN-12", approved: "CHN-15", "activation-pending": "CHN-16", active: "CHN-17", paused: "CHN-19", terminated: "CHN-19" }[value] || "CHN-01";
      ctx.go(route);
      return true;
    }
    if (command === "category") { state.category = value; ctx.go("SEL-02"); return true; }
    if (command === "add-cart") { state.cartCount = Math.max(1, state.cartCount); ctx.track("select_add_to_cart", { catalog_mode: state.catalogMode }); ctx.go("SEL-04"); return true; }
    if (command === "cart-inc") { state.cartCount += 1; ctx.render(); return true; }
    if (command === "cart-dec") { state.cartCount = Math.max(0, state.cartCount - 1); ctx.render(); return true; }
    if (command === "coupon-toggle") { state.couponSelected = !state.couponSelected; ctx.render(); return true; }
    if (command === "points-use") { state.pointsUsed = !state.pointsUsed; ctx.track("select_points_usage_changed", { used: state.pointsUsed }); ctx.render(); return true; }
    if (command === "attribution") {
      if (state.attributionEditUsed && state.attribution !== value) { ctx.flash("本次订单来源修改机会已使用"); return true; }
      if (state.attribution !== value) state.attributionEditUsed = true;
      state.attribution = value;
      ctx.track("order_attribution_selected", { attribution_type: value, edit_used: state.attributionEditUsed });
      ctx.render();
      return true;
    }
    if (command === "submit-order") { state.paymentStatus = "ready"; ctx.track("select_order_submitted", { attribution_type: state.attribution }); ctx.go("SEL-09"); return true; }
    if (command === "payment-confirm") {
      state.paymentStatus = "processing";
      ctx.track("select_payment_started");
      ctx.render();
      setTimeout(() => {
        if (state.paymentStatus !== "processing") return;
        state.paymentStatus = "success";
        ctx.track("select_payment_succeeded");
        ctx.render();
      }, 650);
      return true;
    }
    if (command === "payment-retry") { state.paymentStatus = "ready"; ctx.render(); return true; }
    if (command === "payment-state") { state.paymentStatus = value; ctx.render(); return true; }
    if (command === "aftersale") { state.afterSaleStatus = "submitted"; ctx.track("select_after_sale_submitted"); ctx.go("SEL-13"); return true; }
    if (command === "aftersale-state") { state.afterSaleStatus = value; ctx.render(); return true; }
    if (command === "aftersale-upload") { state.afterSaleUploadSelected = true; ctx.render(); return true; }
    if (command === "logistics-toggle") { state.logisticsExpanded = !state.logisticsExpanded; ctx.render(); return true; }
    if (command === "address-select") { state.selectedAddress = value; ctx.render(); return true; }
    if (command === "address-form") { state.addressFormOpen = value === "open"; ctx.render(); return true; }
    if (command === "address-save") { state.addressFormOpen = false; state.selectedAddress = "hangzhou"; ctx.render(); ctx.flash("收货地址已保存"); return true; }
    if (command === "upload-select") { state.uploadSelected = true; ctx.render(); ctx.flash("文件已选择"); return true; }
    if (command === "assessment-submit") { state.assessmentFeedback = state.assessmentChoice === "no" ? "correct" : "retry"; ctx.render(); return true; }
    if (command === "channel-activate") { state.channelIdentity = "activation-pending"; ctx.track("channel_activation_submitted"); ctx.render(); return true; }
    if (command === "channel-refresh") { state.channelIdentity = "active"; ctx.track("channel_identity_activated"); ctx.go("CHN-17"); return true; }
    if (command === "withdraw-confirm") { state.withdrawalConfirmed = !state.withdrawalConfirmed; requestAnimationFrame(syncWithdrawalControls); return true; }
    if (command === "withdraw") {
      if (!isWithdrawalValid()) { syncWithdrawalControls(); ctx.flash("请检查提现金额与收款账户"); return true; }
      state.withdrawalStatus = "submitted";
      ctx.track("channel_withdrawal_submitted", { amount: Number(state.withdrawalAmount) });
      ctx.render();
      return true;
    }
    return true;
  }

  function handleInput(target) {
    if (target.id === "channel-withdrawal") {
      state.withdrawalAmount = target.value.trim();
      syncWithdrawalControls();
      return true;
    }
    if (target.name === "channel-assessment") {
      state.assessmentChoice = target.value;
      const button = document.querySelector('[data-action="commercial:assessment-submit"]');
      if (button) { button.disabled = false; button.setAttribute("aria-disabled", "false"); }
      return true;
    }
    if (target.id === "catalog-search") {
      const query = target.value.trim().toLowerCase();
      const cards = [...document.querySelectorAll("[data-product-keywords]")];
      let visible = 0;
      cards.forEach((card) => { const show = card.dataset.productKeywords.toLowerCase().includes(query); card.hidden = !show; if (show) visible += 1; });
      const empty = document.getElementById("catalog-empty");
      if (empty) empty.hidden = visible > 0;
      return true;
    }
    return false;
  }

  window.HALO_COMMERCIAL_EXTENSION = { extraPages, state, render, handleAction, handleInput, reviewControls };
})();
