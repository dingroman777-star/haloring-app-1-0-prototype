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
    page("MY-02", "我的券包", "/me/wallet", "MY-01", "只读查看本人优惠券（折扣、满减）与兑换券；筛选状态、展开使用说明，按实际状态前往选购、场次或使用记录；浏览不选券、不核销", "我的"),
    page("MEM-01", "会员中心", "/me/member", "MY-01", "只读查看当前等级与成长、可用积分；直达升级条件、权益、任务、徽章与推荐；资料缺失可重试，不在浏览或刷新中生成资产", "会员与积分"),
    page("MEM-02", "六级等级路径", "/me/member/levels", "MEM-01", "只读查看本人等级与成长差值；六级条件和权益点开查看，浏览等级不改变身份，刷新与返回保留展开状态", "会员与积分"),
    page("MEM-03", "升级条件详情", "/me/member/upgrade", "MEM-02", "只读展示本人下一级的成长、徽章和共创条件；按缺项进入任务、徽章或支持；刷新不执行升级", "会员与积分"),
    page("MEM-04", "会员任务中心", "/me/member/tasks", "MEM-01", "按北京时间查看今日、本周、本月任务；只读核对本人当期进度与奖励回执，展开完成方法并进入真实目标；选择和返回保留上下文", "会员与积分"),
    page("MEM-05", "任务详情与奖励状态", "/me/member/tasks/:id", "MEM-04", "突出本人所选任务与账期，分开有效行为、奖励标准、实际积分及调整记录；按状态提供操作，刷新不发奖，返回保留选择", "会员与积分"),
    page("MEM-06", "成长徽章", "/me/member/badges", "MEM-01", "只读查看五枚徽章及本人可信记录；逐枚展开完整AND/OR条件，未知不填零、达到条件不直接发章；刷新与返回保留展开，解绑保留已获徽章", "会员与积分"),
    page("MEM-07", "会员权益中心", "/me/member/benefits", "MEM-01", "只读核对本人等级与本级权益；具体开放安排与等级资格分开，下一等级动态展示；积分、公开活动、商城、客服入口可达，不因浏览发权益或升级", "会员与积分"),
    page("PTS-01", "Halo Points 首页", "/me/points", "MEM-01 / MY-01", "只读查看本人可用积分；兑换、任务、购物与明细入口；无到期批次不编造临期数字；支持异常重读", "会员与积分"),
    page("PTS-02", "Halo Points 明细", "/me/points/ledger", "PTS-01", "只读核对本人积分流水；筛选获得、使用与调整；展开单笔时间、抵扣与原有效期；客服承接该记录，刷新不提交申诉", "会员与积分"),
    page("PTS-03", "Halo Points 兑换", "/me/points/redeem", "PTS-01", "浏览可兑换内容、服务与权益", "会员与积分"),
    page("PTS-04", "兑换确认与结果", "/me/points/redeem/:id", "PTS-03", "确认所需积分、交付方式与兑换结果", "会员与积分"),
    page("REF-01", "会员推荐", "/me/referral", "MEM-01 / MY-01", "分享推荐入口并查看进行中的推荐", "会员与积分"),
    page("SEL-01", "Halo Select", "/me/select", "MY-01", "从 AI 穿戴、选购帮助与日常精选进入商品和购物服务", "Halo Select"),
    page("SEL-02", "系列与搜索", "/me/select/list", "SEL-01", "搜索、筛选与浏览可见商品", "Halo Select"),
    page("SEL-03", "商品详情", "/me/select/products/:id", "SEL-01 / SEL-02", "查看商品、规格、履约与售后", "Halo Select"),
    page("SEL-04", "购物车", "/me/select/cart", "SEL-03", "调整数量并进入结算", "Halo Select"),
    page("SEL-05", "确认订单", "/me/select/checkout", "SEL-04", "核对地址、优惠与应付金额", "Halo Select"),
    page("SEL-06", "优惠券", "/me/select/coupons", "SEL-05", "选择可用优惠并查看不可用原因", "Halo Select"),
    page("SEL-07", "地址管理", "/me/select/addresses", "SEL-05", "新增、编辑和选择地址", "Halo Select"),
    page("SEL-09", "支付结果", "/me/select/pay", "SEL-05", "确认支付并展示成功或失败恢复", "Halo Select"),
    page("SEL-10", "我的订单", "/me/select/orders", "MY-01 / SEL-09", "按支付和售后状态查看订单，继续支付或查看进度", "Halo Select"),
    page("SEL-11", "订单详情", "/me/select/orders/:id", "SEL-10", "查看金额、履约、物流和售后入口", "Halo Select"),
    page("SEL-12", "申请售后", "/me/select/after-sales/new", "SEL-11", "选择类型、原因并提交售后", "Halo Select"),
    page("SEL-13", "售后进度", "/me/select/after-sales/:id", "SEL-10 / SEL-12", "查看处理进度、退款与补件", "Halo Select"),
    page("CHN-01", "申请体验顾问", "/me/channel/join", "MY-01", "了解顾问职责与申请条件；根据已有进度开始、继续申请或进入经营，不重置资料", "渠道经营"),
    page("CHN-02", "确认身份", "/me/channel/verify", "CHN-01", "填写本人姓名和大陆身份证号，阅读并主动同意核验说明后提交；已有处理进度时继续原请求", "渠道经营"),
    page("CHN-03", "身份核验进度", "/me/channel/verify/processing", "CHN-02", "查看本次核验与查询状态；可离开后继续，核验通过后主动进入下一步", "渠道经营"),
    page("CHN-04", "身份核验结果", "/me/channel/verify/failed", "CHN-03", "仅展示本次未通过结果的安全原因、编号和恢复动作；其他状态回真实进度，联系客服不等于提交复核", "渠道经营"),
    page("CHN-06", "体验顾问申请", "/me/channel/apply", "CHN-02", "填写地区、经验与收款身份", "渠道经营"),
    page("CHN-07", "申请资料", "/me/channel/application/detail", "CHN-06", "查看已提交资料与更新时间", "渠道经营"),
    page("CHN-08", "必修培训", "/me/channel/training", "CHN-06", "查看本次申请的三门必修课程与有效进度，开始或继续学习；完成后测评，其他申请阶段只回顾", "渠道经营"),
    page("CHN-09", "培训课程", "/me/channel/training/:id", "CHN-08", "按课序阅读要点；保存本课后继续下一门未完成课程，全部完成再进入测评；回顾不重复记进度", "渠道经营"),
    page("CHN-10", "培训测评", "/me/channel/assessment", "CHN-08", "完成三题、逐题核对后主动提交审核；答案与结果保留，失败可重试", "渠道经营"),
    page("CHN-11", "申请进度", "/me/channel/application", "CHN-10", "查看当前审核与查询状态，按结果继续；保留资料、补件、客服和安全撤回入口", "渠道经营"),
    page("CHN-12", "补充申请资料", "/me/channel/application/needs-info", "CHN-11", "查看本次补件要求，选择并预览有效文件后提交；失败保留，按申请与会话隔离，原型不上传文件", "渠道经营"),
    page("CHN-13", "申请审核结果", "/me/channel/application/rejected", "CHN-11", "查看本次未通过结果；原因未知不猜测，联系客服不自动提交复核，重新申请须确认并保留原记录", "渠道经营"),
    page("CHN-14", "撤回申请", "/me/channel/application/withdraw", "CHN-11", "确认本次申请与撤回影响；取消不改变记录；失败可重试，成功显示撤回记录", "渠道经营"),
    page("CHN-15", "审核通过", "/me/channel/approved", "CHN-11", "核对本次审核结果；按资料准备和身份状态继续，不自动同意协议或开通", "渠道经营"),
    page("CHN-16", "协议与收款", "/me/channel/activation", "CHN-15", "核对协议、收款账户和税务信息", "渠道经营"),
    page("CHN-17", "体验顾问身份已生效", "/me/channel/activated", "CHN-16", "展示身份与生效时间", "渠道经营"),
    page("CHN-18", "开始使用顾问工具", "/me/channel/home/new", "CHN-17", "查看推广、内容与订单入口，不以引导页推断订单数量", "渠道经营"),
    page("CHN-19", "经营首页", "/me/channel/home", "MY-01 / CHN-17", "查看当前身份、可提现金额、服务订单与待办；历史记录不冒充本月统计", "渠道经营"),
    page("CHN-20", "服务订单", "/me/channel/orders", "CHN-19", "查看订单、客户进度与收益状态", "渠道经营"),
    page("CHN-21", "单笔收益", "/me/channel/earnings/:id", "CHN-20", "查看计算结果、确认期与申诉", "渠道经营"),
    page("CHN-22", "收益明细", "/me/channel/earnings", "CHN-19", "查看可提现、待确认与历史支付", "渠道经营"),
    page("CHN-23", "提现", "/me/channel/withdraw", "CHN-22", "填写金额、核对收款与本次报价，提交后查看处理记录", "渠道经营"),
    page("CHN-24", "内容与政策", "/me/channel/content", "CHN-19", "查看示例内容与政策；本机阅读记录不等于正式政策签收", "渠道经营"),
    page("CHN-25", "内容详情", "/me/channel/content/:id", "CHN-24", "阅读所选内容、标记本机已读并复制示例备忘", "渠道经营"),
    page("CHN-26", "推广工具", "/me/channel/tools", "CHN-19", "查看推广资料状态；演示链接复制和二维码图片下载；进入内容、身份与客服", "渠道经营"),
  ];

  Object.assign(extraPages.find(item => item.id === "CHN-26"), {
    layout: "顾问身份摘要；推广资料待就绪/待核对或独立演示二维码与链接；内容、身份、客服入口",
    data: "channelPromotion（scope/mode/code/url/qrAsset）只支持明确本地demo记录，不猜测正式编号/发布时间/链接有效性",
    interaction: "复制演示说明，失败手动复制；二维码图片加载失败可重试；生成带不可推广标识的PNG并发起下载，不宣称已保存相册；三个关联入口可返回",
    logic: "当前账号/申请/生效回执与资料匹配；暂停/终止隐藏工具，旧动作重验身份；读页无业务写入；与会员L1和戒指连接无关；不新增客户归属/收益",
    exception: "资料未下发、失配、存储读取失败、图片加载/导出失败、剪贴板拒绝、异步返回时身份变化",
    backend: "正式顾问编号、专属链接、二维码签发、撤销/过期/状态与客户归因需权威服务；当前只演示交互，.example地址不可访问；移动端相册权限及真实扫码仍需端上验收"
  });
  Object.assign(extraPages.find(item => item.id === "CHN-25"), {
    layout: "具体内容标题、受众与示例标识、导语与分组要点；顾问资料阅读标记、示例复制、失败手动复制及客服",
    data: "selectedPolicyId与channelContentSelection绑定当前账号/会话/申请；channelContentReads绑定scope/policyId/contentKey/readAt/local",
    interaction: "个人标记已读而非同意协议；教育卡不强制已读；复制成功/失败反馈，失败保留可选择文本；返回列表/客服恢复",
    logic: "无有效选择不回退到健康资料；不编造发布版本；旧policiesRead时间不当当前正文确认；浏览不写账本；标记保存失败不显示已读；复制反馈校验当前内容与身份",
    exception: "未知内容、身份失效、旧标记、存储读写失败、跨标签选择变化、迟到的剪贴板结果",
    backend: "正式发布/版本/下架、分享授权、可审计已读回执待内容服务；本机标记不是法定告知、协议签署或真实对外分享"
  });
  Object.assign(extraPages.find(item => item.id === "CHN-24"), {
    layout: "客户介绍卡主区（3张同页预览）与顾问规则分组；保留CHN-25完整详情",
    data: "复用POLICIES及selectedPolicyId；sessionStorage.haloChannelContentView只保存带账号/申请作用域的展开状态",
    interaction: "展开/收起、键盘、刷新保留预览；选择保存成功后进入对应详情；失败原页重试；客服/经营首页原路返回",
    logic: "有效顾问身份与当前申请/会话匹配，不要求连接戒指；浏览不标记已读、不新增资产、不回写商业缓存；仅选择内容时合并最新存储，不虚构发布版本或分享成功",
    exception: "身份暂停/终止、无有效回执、读取失败、保存失败、旧页面选择及跨标签身份更新",
    backend: "正式内容发布/版本/下架/分享授权与已读回执待内容服务提供；本页仅使用既有本地示例，CHN-25单独逐页评审"
  });
  Object.assign(extraPages.find(item => item.id === "CHN-23"), {
    layout: "余额与收款账户；金额/全部；下一步展开核对、二次验证；独立申请结果",
    data: "channelWithdrawal（version/scope/amount/quote/resultId）；已确认收款快照；channelAvailableCents与withdrawals同源",
    interaction: "金额校验、全部、修改后重新报价；不保存验证码/勾选；失败保留金额重试；结果按申请ID核对；收益与客服原路返回",
    logic: "账号/申请/身份/收款/余额/流水快照匹配；暂停/终止和异常账本不提交；本地锁内重读、比较、合并原子保存余额与记录；保存失败不扣减；浏览不写商业缓存；不需要连接戒指",
    exception: "草稿保存失败、离线、并发/重复提交、余额变化、切换账号/离页、刷新恢复及失配结果；不将本地申请视为真实到账",
    backend: "正式提现资格、收款验证、报价税费、限额/到账时效、验证码/限流、服务端幂等及到账回执待正式接口；当前沿用¥100最低额、零费用与123456验证的本地示例"
  });
  Object.assign(extraPages.find(item => item.id === "CHN-06"), {
    function: "填写申请资料并开始必修学习；已有申请只继续原进度",
    layout: "原页表单：地区/经验/收款身份、可展开说明、声明、自动保存状态与单一提交按钮",
    data: "applicationDraft（含 regionOther）；applicationConsent；applicationFlow 的 consentKey/savedAt/request；申请快照关联 verificationId 与 consentVersion",
    interaction: "新申请默认请选择；其他地区填写城市；编辑后重新勾选；自动保存失败可重试；提交中禁重复，失败沿用请求重试",
    logic: "不要求购买/连接/激活戒指。校验当前登录与核验；已提交阶段不可覆盖。声明绑定资料和核验；保存成功后才展示提交成功；刷新续原请求，离页不强跳",
    exception: "旧草稿保留且不沿用无关联声明；离线/存储失败保留资料；登录或核验变化取消旧请求；旧标签页接续已保存的申请",
    backend: "正式后端须实现账号归属、身份有效性、应用唯一性与请求幂等；本页为本地异步模拟",
    rules: "沿用当前渠道规则与用户最新设备独立纠正；本页说明为原型摘要，正式文本及地区/收款主体范围待业务与法务确认"
  });
  Object.assign(extraPages.find(item => item.id === "CHN-07"), {
    function: "只读核对本次申请资料，并从实际阶段继续未完成事项",
    layout: "原状态卡+提交资料卡；原提交时间与可复制编号；有则展开补充记录；一个按阶段变化的主操作",
    data: "applicationSnapshot 原始地区/经验/收款主体/提交时间/编号，已有 supplementedAt/supplement/updatedAt；独立读取当前 applicationStatus/channelIdentity/学习进度，不回填 applicationDraft",
    interaction: "继续学习、测评、查看审核、补资料、开通或历史；点击时重判状态，原申请变化先重新展示；编号复制失败有提示；资料有误联系客服后回原页",
    logic: "申请提交不等于顾问身份生效；不固定授予 L1，不要求购买或连接戒指。空记录不制造资料，未知状态只核对不重新创建申请，缺失字段显示未记录",
    exception: "空草稿/核验中/后续身份无快照分别处理；补交时间独立且按北京时间；提交中进入本页自动展示最终快照，不强跳；旧页ID不匹配阻止操作",
    backend: "本轮读取本地原型状态；正式后端需提供当前申请快照、阶段版本、补充记录与查询回执；跨端和已有多标签后续状态推送未纳入本页模拟"
  });
  Object.assign(extraPages.find(item => item.id === "CHN-01"), {
    logic: "渠道申请独立于设备：实名→申请资料→学习与测评→审核→签约开通；不检查是否购买、配对或激活硬件",
    note: "2026-09-07 用户最新确认覆盖旧设备门槛；CHN-05 不再是页面，旧链接按当前申请进度兼容跳转。健康与会员成长的硬件条件保持不变。",
  });
  Object.assign(extraPages.find(item => item.id === "SEL-01"), {
    layout: "顶部搜索/购物车/订单；AI 穿戴主角图；选购帮助；日常精选开放网格；配送与售后/客服",
    data: "selectHomeScene 布局演示/暂无公开商品；已有购物车数量；不读取身体数据或 Halo 对话",
    interaction: "主角进对应详情；搜索重置为全部并聚焦；系列进对应列表；公开问答弹层返回保留首页位置；购物服务自然可达",
    logic: "仅本地单页审阅；布局示例不改变商品正式状态。当前供应链基线仍为验证中；真实无公开商品时隐藏主角、系列和搜索，历史订单与客服仍可用",
    note: "2026-09-07 SEL-01 已确认；继续逐页审阅 SEL-02，其他交易页面尚未重做。保留既有资产及五个一级入口。",
  });
  Object.assign(extraPages.find(item => item.id === "SEL-02"), {
    layout: "返回/标题/购物车；可清空搜索框；两行系列筛选；结果数量；开放式商品列表；无结果/加载/失败状态",
    data: "category、catalogQuery、catalogLoadState、catalogRetryAt；商品 ID/展示状态/已知价格；复用 pageViews 保存浏览位置",
    interaction: "按当前系列搜索；切换系列保留关键词；清空与搜索全部可恢复；进入指定商品后返回保留关键词、系列及位置；失败重试保留条件",
    logic: "仅用现有本地演示商品，不改变商品正式状态或价格；AI 穿戴单独可筛选；展示商品无价格/购买按钮，展示场景最多三款；无公开商品不露出系列。无健康个性化、无搜索词上报、无自动加购",
    exception: "无匹配结果、无公开商品、模拟加载/失败/重试；正常入口刷新恢复条件，独立审阅入口刷新重置演示",
    note: "2026-09-07 重做 SEL-02，待用户确认后再处理 SEL-03 商品详情。",
  });
  Object.assign(extraPages.find(item => item.id === "SEL-03"), {
    layout: "返回/标题/购物车；四图横滑图库；名称/一句说明/价格；规格选择；展开的外观、佩戴与App图文；适配与履约折叠说明；固定购买操作",
    data: "productMediaViews 按商品保存 index/top；productSelections 按商品保存 color/size/quantity；cartLines 按商品+SKU 去重；checkoutLines 独立草稿；订单 lines 固定规格/单价/数量/金额快照",
    interaction: "头图手势、按钮或方向键切换，无自动轮播；点击放大，关闭/Escape/返回恢复位置；图片不选规格且与规格弹层互斥；选择颜色与尺码后才可确认；不同规格不覆盖旧行；立即购买不改购物车",
    logic: "库存分别在选规格、加购、购物车结算、提交与付款校验；旧戒指数量保留且要求补选规格；结算生成订单后以固定快照支付/售后；本地模拟不是后台鉴权或支付实现",
    exception: "图片加载失败可重试；切图保持焦点，关闭大图恢复位置；未选规格、缺货、数量上限、旧购物车迁移、空车购买、移除撤销、登录返回；正常入口刷新保留浏览，独立审阅刷新重置",
    note: "2026-09-07 SEL-03 已获用户确认；SEL-04 已按下一轮批准建议修改，等待本页原型确认。",
  });
  Object.assign(extraPages.find(item => item.id === "SEL-04"), {
    layout: "居中页名/返回/继续选购；开放商品行/勾选/缩略图/可编辑规格/单价；独立移除与数量；固定全选/商品金额/结算；空车、无选择、缺货、撤销、同页规格弹层",
    data: "cartLines 精确 SKU 行；cartSelection 按行保存勾选；cartViewTop；cartSkuEdit 保存原行快照及独立 draft；cartUndo 保存 line/index/selected；checkoutLines 仅复制本次已选可购行",
    interaction: "勾选/全选；修改这一行规格后确认或取消；同SKU合并前显示总数并校验；数量1禁止减至删除；移除后可撤销；商品/客服往返保留购物车；刷新恢复未确认编辑",
    logic: "缺货保留且不可选，不锁其他有货行；结算前若已选行失效，留页重新核对而不静默缩单；提交前再次校验；只扣除本次订单对应车内数量；直接购买仍独立；取消编辑不改商品草稿或购物车",
    exception: "无选择/空车/缺货/超限/合并上限/原行变化/legacy未选规格/刷新编辑恢复；同页弹层焦点与返回受控；客服导航先退出弹层历史；价格与库存为既有演示数据",
    note: "2026-09-07 SEL-04、SEL-05、SEL-06 已获用户确认；SEL-07 修改稿待确认。未部署或打包。",
  });
  Object.assign(extraPages.find(item => item.id === "SEL-05"), {
    function: "核对本次商品、有效收货地址、优惠、积分与配送报价后明确提交订单",
    layout: "居中标题/返回；开放地址与商品行；优惠/积分/配送；一份金额明细；客服入口；固定应付与提交；沿用共用规格弹层",
    data: "checkoutLines、checkoutSources、checkoutSkuEdit；checkoutViewTop/checkoutDetailsOpen；checkoutSeenQuote/checkoutQuoteChanged/checkoutNotice；checkoutDelivery；订单addressSnapshot/deliverySnapshot/shippingAmount及整型pointsUsed",
    interaction: "同页改准确SKU/数量，取消保留；缺货行本次不买但保留购物车；现有券/地址页往返；积分动态开关；未知运费禁提交；报价变化再次确认；已提交回原订单",
    logic: "无地址不兜底示例；必须明确选择地址。100 Points=¥1、普通商品最高30%，不设3000起抵门槛；金额以分整型运算。只按本次购买量扣原购物车来源，减少购买量保留余量。订单金额/地址/运费固定快照",
    exception: "空单、地址失效、SKU缺货/超限、原行变化、积分不足/待冲正/兑换占用、配送未知、报价更新、刷新编辑恢复、重复提交与付款中/已付锁定",
    note: "2026-09-07 SEL-05、SEL-06、SEL-07、SEL-09 已获用户确认。配送与价格均为明确示例，非正式交易承诺。"
  });
  Object.assign(extraPages.find(item => item.id === "SEL-06"), {
    function: "查看本单可用优惠，明确选择用券或不用券，确认后回到结算",
    layout: "复用 Select 标题与固定底栏；券金额/条件/到期时间；原生单选与不使用；规则及不可用券折叠；已用券可查关联订单",
    data: "ownedCouponIds 区分持有券与选择状态；MEMBER_COUPON 的门槛/金额/expiresAt；couponSelectionDraft 独立选择、确认前基线和阅读位置；couponSelected；couponUsedOrderId；订单 couponId/couponSnapshot；普通新账号默认零积分、无券",
    interaction: "选择先暂存，确认成功才生效；返回或跳页放弃未确认选择，普通入口刷新恢复草稿；失效后重新确认，不自动加价",
    logic: "券适用性共用到选券、报价、支付提交及异步回执；截止使用北京时间绝对时刻，等于截止即失效。校验订单自身快照，不读取另一笔结算。已付款金额保持不变",
    exception: "空单、未满门槛、过期、已用、规则未公布、保存失败、支付中失效、同券重复处理、已付/处理中深链锁定；不擅自新增退款返券政策",
    note: "2026-09-07 SEL-06 已获用户确认；券、金额与时间仍为原型示例。正式券适用范围、服务端时钟与跨端原子核销待接入"
  });
  Object.assign(extraPages.find(item => item.id === "SEL-07"), {
    function: "维护收货地址，明确确认后才用于本单",
    layout: "Select 标题与固定确认栏；地址单选/编辑/删除；同页新增编辑表单；真实空态与删除确认",
    data: "addresses 地址簿；addressDrafts 分项草稿；addressSelection 暂选与基线；selectedAddressSnapshot 本单独立收货快照；addressUndo 可撤销删除",
    interaction: "暂选不改变结算；使用此地址后应用。取消保留未保存输入，保存成功清空该草稿；新增去重；删除确认与撤销；普通入口刷新恢复。新增/编辑可主动粘贴并识别三项完整信息，核对后保存；支持撤销与手动粘贴，不完整不覆盖",
    logic: "无地址不生成示例，审阅示例明确标注；修改地址簿不静默修改本单或历史订单。删除当前地址需重新选址；新结算不自动恢复旧地址。已付或处理中禁止编辑",
    exception: "空态、字段错误、重复地址、原记录变化、保存失败回滚、未确认返回、深链锁定；订单重新确认恢复原始地址快照",
    note: "2026-09-07 SEL-07 含粘贴识别已获用户确认。正式地址服务、配送校验与跨端持久化待后端接入；没有部署或打包"
  });
  Object.assign(extraPages.find(item => item.id === "SEL-09"), {
    function: "核对本单金额并支付，按真实订单状态查看结果与恢复原单",
    layout: "Select 居中状态标题、状态符号、固定两位金额、开放商品行/订单号；成功态原配送/支付时间；固定主次操作",
    data: "order.status 与订单级 paymentResult/paymentAttemptId/paymentRequestedAt/paymentFailure；原 lines/payable/addressSnapshot/deliverySnapshot/paidAt；失败提示仅当前内存",
    interaction: "明确模拟支付；确认中查看此订单；失败重试；暂缓后续付；库存/优惠/积分变化回原单重新确认；保存失败重试查询",
    logic: "paid/processing 优先于商品当前状态；结果不串单；旧请求回执不能结束新请求；支付与扣积分/券状态一次持久化，失败整体回滚；原订单 ID、创建时间及购物车已扣记录保留",
    exception: "无订单、不明状态、失败/暂缓、缺货/优惠失效、持久化失败、处理中刷新和关闭后继续、已付后下架、已有售后时只读原支付事实",
    note: "2026-09-07 SEL-09 已获用户确认。支付通道、服务端原子幂等和真实回执尚未接入"
  });
  Object.assign(extraPages.find(item => item.id === "SEL-10"), {
    function: "识别每笔订单，按当前状态继续付款、查看订单或售后进度",
    layout: "Select 居中标题；四项选中明确的筛选与数量；时间/尾号/商品规格数量；金额及独立操作；真实无单与筛选空态分开",
    data: "orders 原始支付/配送快照；afterSales 独立售后记录；orderFilter；ordersListTops 各筛选阅读位置；ordersLastOpened 本次所看订单上下文",
    interaction: "卡片打开详情，按钮直达本单付款/售后；返回保留筛选与阅读位置；已付款移出待付款后提供本单入口；筛选空态可查看全部",
    logic: "已付款不推断为待收货；售后与已付款可同时匹配；未知状态不生成付款按钮；点击再次核对状态/订单；阅读筛选不改金额和业务状态",
    exception: "真实无单、筛选无单、状态异步变化、订单不存在、历史 receiving 筛选迁移 paid、缺失时间、保存失败、窄屏与长列表",
    note: "2026-09-07 已按五项批准建议修改并获用户确认；评分为启发式评审。正式订单、配送和售后状态待业务后端接入"
  });
  Object.assign(extraPages.find(item => item.id === "SEL-11"), {
    function: "核对原订单状态、商品、金额和收货信息，继续本单支付或售后",
    layout: "Select 居中标题；状态与关键金额优先；商品逐项一次；收货/配送；折叠费用明细与订单时间；固定操作及就近反馈",
    data: "orders 原 lines/amount/address/delivery/payment 快照；afterSales 关联状态；orderDetailViews 按订单保存 top/feesOpen",
    interaction: "待付继续或重试、处理中查看支付进度、已付申请售后、已有售后查看原申请；返回列表保留筛选；不同订单阅读位置隔离",
    logic: "不将 paid 推断为发货；无物流如实显示；移除旧预售虚构订单兜底；未知状态不提供付款/新售后；点击再核对当前展示ID与最新状态；售后标明原实付/原收货/原配送",
    exception: "无订单、未知状态、过时按钮、原数据缺失、已退款、切换订单、刷新、费用展开与窄屏；不改支付金额或既有售后流程",
    note: "2026-09-07 按六项评审建议实施并获用户确认；原图已保留。正式订单/物流/支付/售后后端尚未接入"
  });
  Object.assign(extraPages.find(item => item.id === "SEL-12"), {
    function: "明确整单申请范围，选择售后类型与原因，核对金额后提交申请",
    layout: "Select 居中标题；整单范围与商品展开；三类原生单选、原因必选、说明选填；固定金额、禁用原因与提交操作",
    data: "原订单支付与商品快照；afterSaleDrafts 按订单隔离 type/reason/note；afterSales 原申请记录与状态；新申请复制独立订单快照",
    interaction: "类型与原因不预选；金额随退款/换货切换；草稿自动保存、往返/刷新恢复；失败保留输入并重试；已有申请直达原进度",
    logic: "仅已付款且金额记录有效的本单可提交；再次核对展示订单ID与状态；一次保存订单/售后/草稿状态，失败回滚，不提前跳成功；不直接退款、退积分或承诺批准",
    exception: "无单/未付款/未知/原金额缺失、已有申请深链、跨单草稿、过时按钮、存储失败、重复提交、500字说明上限、窄屏和键盘单选",
    note: "2026-09-07 原图保留并按自审建议实施，复评8.8/10（启发式），用户已确认。原型沿用整单处理，部分商品引导客服；正式资格/额度/凭证/受理接口尚未接入"
  });
  Object.assign(extraPages.find(item => item.id === "SEL-13"), {
    function: "查看本笔申请进度、退款结果及填写真实寄回信息",
    layout: "居中标题、状态与原申请金额、已记录事件、申请详情折叠；固定条件化操作；寄回表单复用底部保存操作",
    data: "按售后ID和订单ID解析afterSales；afterSaleReturnDrafts按售后单隔离；returnShipment记录实际输入；refundReceipt与Points流水共同核对",
    interaction: "刷新只查询本地进度；需寄回才开放填写，失败保留草稿；联系售后、回原订单；审阅区独立演示处理状态",
    logic: "仅退款不要求寄回，换货不退钱或积分；模拟退款完成与积分恢复一次保存，失败整体回滚；重复完成不重复退款，完成后不退回处理中",
    exception: "离线、保存失败、跨单过时表单、未知状态、缺失原金额、无申请、刷新恢复、320px窄屏；历史无退款回执不伪造实际到账金额",
    note: "2026-09-07 原页4.5，修改后自评8.8/10（启发式），用户已确认。查询、审核、物流及退款均未接正式后端，演示按钮仅在审阅区"
  });
  Object.assign(extraPages.find(item => item.id === "PTS-04"), {
    function: "核对兑换内容、积分和使用条件；提交模拟兑换，查询原请求结果并使用已到账权益",
    data: "pointsRedemptionRequest的请求ID/账号注册范围/项目/条件快照/状态/提交完成时间；pointsTransactions的requestId/balanceAfter；vouchers的requestId/issuedAt/expiresAt/usage/returns",
    interaction: "当前条件核对后提交；处理中返回或刷新继续原请求；失败重试；成功前往Halo Studio，记录异常转明细或客服；静态演示不发起真实交易",
    logic: "原型以同源互斥和单次存储同时保存扣分、流水、券、库存、请求结果；无完整回执不显示成功或补发券；权益与历史余额不随当前余额或活动变化而改写",
    exception: "余额/条件变化、调整中、网络失败、存储失败、重复点击、双标签页、跨账号、缺失流水/券、错误历史状态、处理中重开；正式服务未接通时禁止真实兑换",
    note: "2026-09-08 PTS-04 已获用户确认，积分四页逐页审改完成；后端原子事务、跨端幂等、真实库存和履约待接入。独立PTS-04演示保留进度，重置只清理该场景"
  });
  window.HALO_V5_PAGES = [...(window.HALO_V5_PAGES || []), ...extraPages];

  const COMMERCIAL_PROGRESS_KEY = "haloV5CommercialProgress";
  const BASE_POINTS_BALANCE = 0;
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
  let channelStore = null;
  function readCommercialProgress() {
    try {
      if (channelStore) return channelStore.read();
      if (typeof localStorage === "undefined") return {};
      const value = JSON.parse(localStorage.getItem(COMMERCIAL_PROGRESS_KEY) || "{}");
      return value && typeof value === "object" ? value : {};
    } catch {
      return {};
    }
  }
  // Existing coupon fixture: “before Oct 1” is an exclusive UTC+8 deadline.
  const MEMBER_COUPON = Object.freeze({ id: "member", title: "会员活动券", amountCents: 2000, thresholdCents: 30000, expiresAt: "2026-10-01T00:00:00+08:00" });
  const PRODUCTS = Object.freeze({
    mask: { id: "mask", title: "夜间舒缓眼罩", specification: "柔雾灰 · 标准款", price: 399, visual: "textile" },
    ring: { id: "ring", title: "HALORING 智能戒指", specification: "标准款 · 预售", price: 2999, visual: "ring" },
    aroma: { id: "aroma", title: "空间舒缓香气", specification: "标准装", price: 369, visual: "scent", displayOnly: true },
    nutrition: { id: "nutrition", title: "CHRONO KEY 女性益生菌", specification: "规格待公布", price: 0, visual: "nutrition", displayOnly: true },
    skin: { id: "skin", title: "夜间身体护理", specification: "规格待公布", price: 0, visual: "skin", displayOnly: true }
  });
  const SELECT_CATEGORIES = [["all", "全部"], ["wearable", "AI 穿戴"], ["sleep", "睡眠"], ["nutrition", "营养"], ["skin", "肌肤"], ["scent", "嗅觉"]];
  // Size range / colour names: hardware/ring-v1.0/README.md, 2026-09-07.
  // Swatches, stock, price and full-payment checkout are review fixtures, not launch approval.
  const RING_COLORS = [["white", "瓷白", "#eeece6"], ["sage", "鼠尾草灰绿", "#9baba0"], ["pink", "柔和陶瓷粉", "#e4bfc1"], ["forest", "深墨绿", "#30473d"]];
  const RING_SIZES = ["6", "7", "8", "9", "10", "11"];
  const PRODUCT_SKUS = Object.freeze(Object.fromEntries([
    ["mask-grey-standard", { id: "mask-grey-standard", productId: "mask", specification: "柔雾灰 · 标准款", stock: 10 }],
    ...RING_COLORS.flatMap(([color, label]) => RING_SIZES.map(size => {
      const id = `ring-${color}-${size}`;
      return [id, { id, productId: "ring", color, size, specification: `${label} · ${size} 号`, stock: 5 }];
    }))
  ]));
  // Existing layout fixtures, not the approved production SKU catalogue.
  const CATALOG_ITEMS = [
    { id: "ring", category: "wearable", copy: "认识日常睡眠与身体状态", keywords: "halo ring 指环 戒指 智能 穿戴 睡眠", icon: "" },
    { id: "mask", category: "sleep", copy: "减少睡前光线干扰", keywords: "睡眠 眼罩 遮光", icon: "sleep" },
    { id: "nutrition", category: "nutrition", copy: "每日一份的营养补充选择", keywords: "营养 chrono key 女性 益生菌", icon: "nutrition" },
    { id: "skin", category: "skin", copy: "睡前的日常护理", keywords: "肌肤 身体 护理", icon: "skin" },
    { id: "aroma", category: "scent", copy: "用于晚间空间的香气", keywords: "嗅觉 香气 空间 香薰", icon: "scent" },
  ];
  const TASKS = Object.freeze({
    "wear-12h": { title: "有效佩戴 12 小时", period: "today", growth: 8, points: 20, progress: "等待本期记录", route: "DEV-10" },
    "night-repair": { title: "完成一次 AI 睡前修复", period: "today", growth: 4, points: 10, progress: "尚未完成", route: "NIG-01" },
    "weekly-feedback": { title: "查看周报告并反馈", period: "week", growth: 15, points: 50, progress: "等待本期记录", route: "HELP-03" },
    "wear-5days": { title: "完成 5 个有效佩戴日", period: "week", growth: 15, points: 50, progress: "等待本期记录", route: "DEV-10" },
    "monthly-review": { title: "完成月度状态回顾", period: "month", growth: 30, points: 100, progress: "等待完成月度回顾", route: "TOD-09" },
    cocreation: { title: "参与正式访谈、产品测试或共创", period: "month", growth: 0, points: 0, progress: "尚无已确认邀约", route: "HELP-03" }
  });
  const COURSES = [
    { id: "product", title: "哪些产品信息可以介绍", body: "介绍前确认当前商品的发售状态、规格、交付时间与售后说明。未开售的商品不承诺收款或发货日期。", takeaway: "以当前商品页公布的信息为准，不自行增加功能或交付承诺。" },
    { id: "health", title: "怎样介绍健康功能", body: "Halo 用于观察日常身体状态，不是疾病诊断或治疗工具。用户持续不适时，应建议向专业医疗人员求助。", takeaway: "可以介绍睡眠、能量与节律趋势，不承诺诊断、治疗或确定收益。" },
    { id: "orders", title: "订单与售后怎么处理", body: "同一订单不同时产生会员推荐奖励与渠道现金收益。退款与换货由 Halo 售后处理。", takeaway: "帮助用户找到订单与客服入口，不自行改价或收取线下款项。" }
  ];
  const CHANNEL_ORDERS = [
    { id: "HR20260901018", title: "HALORING 智能戒指", amount: 3990, earning: 997.50, status: "客户已激活" },
    { id: "HR20260829007", title: "夜间舒缓眼罩", amount: 399, earning: 99.75, status: "收益待确认" }
  ];
  const POLICIES = {
    health: { title: "健康表达边界", body: "Halo 用于观察日常身体状态并提供生活方式参考，不用于诊断、治疗，也不能替代医疗判断。", points: ["可以介绍睡眠、能量与节律趋势。", "不承诺治疗效果、确定收益或未经确认的产品能力。"] },
    service: { title: "当前体验顾问服务政策", body: "服务以当前有效协议和具体订单记录为准。", points: ["同一订单不会同时产生会员推荐奖励与渠道现金收益。", "退换售后统一由 Halo 承接。收益调整保留关联订单和处理记录。", "暂停或终止期间，仅可查看历史与联系支持，不能新增推广或提现。"] },
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
    selectedEarningId: "", selectedPolicyId: "health", policiesRead: {},
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
    couponSelected: false,
    ownedCouponIds: [],
    couponUsedOrderId: null,
    couponSelectionDraft: null,
    catalogMode: "sale",
    selectHomeScene: "layout",
    catalogReminder: false,
    category: "all",
    catalogQuery: "",
    catalogLoadState: "ready",
    catalogRetryAt: 0,
    cartCount: 0,
    cartLines: null, cartSelection: {}, cartViewTop: 0, cartSkuEdit: null,
    checkoutLines: null, checkoutOrigin: "buy-now", checkoutDraftOrderId: null,
    checkoutSkuEdit: null, checkoutSources: {}, checkoutViewTop: 0, checkoutDetailsOpen: false,
    checkoutSeenQuote: null, checkoutQuoteChanged: false, checkoutNotice: "",
    checkoutDelivery: { status: "ready", feeCents: 0, shipping: "发货时间待确认", simulated: true },
    productSelections: {}, productMediaViews: {}, skuStockOverrides: {}, cartUndo: null,
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
    selectedAddress: null,
    addressFormOpen: false,
    addressDraft: { name: "", phone: "", detail: "" },
    addressError: "",
    logisticsExpanded: false,
    afterSaleUploadSelected: false,
    identityDraft: { name: "", idNumber: "" },
    identityConsent: false,
    identityRequestId: "",
    identityVerification: null, identityQuery: null, identityMockReply: null,
    identitySupportContext: null,
    applicationDraft: { region: "", regionOther: "", experience: "", payeeType: "" },
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
  const savedCommercialProgress = readCommercialProgress();
  const state = { ...defaultState, ...savedCommercialProgress };
  // Preserve the old local coupon record, including an explicitly declined selection.
  // A new account has no owned coupons; selecting a coupon never grants ownership.
  if (!Object.hasOwn(savedCommercialProgress, "ownedCouponIds") && typeof savedCommercialProgress.couponSelected === "boolean") state.ownedCouponIds = [MEMBER_COUPON.id];
  state.ownedCouponIds = Array.isArray(state.ownedCouponIds) ? [...new Set(state.ownedCouponIds.filter(id => typeof id === "string"))] : [];
  // Retire only obsolete navigation/check state; preserve applications, learning and assets.
  state.resumeAfterDevice = false;
  state.channelDeviceIntent = null;
  state.channelDeviceCheck = null;
  if (!["layout", "empty"].includes(state.selectHomeScene)) state.selectHomeScene = "layout";
  if (!SELECT_CATEGORIES.some(([key]) => key === state.category)) state.category = "all";
  state.catalogQuery = typeof state.catalogQuery === "string" ? state.catalogQuery.slice(0, 80) : "";
  if (!["ready", "loading", "failed"].includes(state.catalogLoadState)) state.catalogLoadState = "ready";
  state.catalogRetryAt = Number.isFinite(state.catalogRetryAt) ? state.catalogRetryAt : 0;
  state.addressDraft = { ...defaultState.addressDraft, ...(state.addressDraft || {}) };
  state.identityDraft = { ...defaultState.identityDraft, ...(state.identityDraft || {}) };
  // Remove only the former built-in placeholder, never a user's actual draft.
  if (state.identityDraft.name === "A**" && state.identityDraft.idNumber === "310***********0021") {
    state.identityDraft = { name: "", idNumber: "" };
    if (!state.identityProcessing && !state.identityVerified) state.identityConsent = false;
  }
  state.applicationDraft = { ...defaultState.applicationDraft, ...(state.applicationDraft || {}) };
  state.pointsBalance = Number.isFinite(Number(state.pointsBalance)) ? Math.max(0, Number(state.pointsBalance)) : BASE_POINTS_BALANCE;
  state.pointsTransactions = Array.isArray(state.pointsTransactions) ? state.pointsTransactions.filter((entry) => entry && entry.id) : [];
  state.selectedRedemptionId = REDEMPTION_CATALOG[state.selectedRedemptionId] ? state.selectedRedemptionId : DEFAULT_REDEMPTION_ID;
  state.nextOrderSequence = Number.isInteger(Number(state.nextOrderSequence)) ? Math.max(28, Number(state.nextOrderSequence)) : 28;
  state.orders = Array.isArray(state.orders) ? state.orders : [];
  state.productSelections = state.productSelections && typeof state.productSelections === "object" ? state.productSelections : {};
  state.skuStockOverrides = state.skuStockOverrides && typeof state.skuStockOverrides === "object" ? state.skuStockOverrides : {};
  // Preserve legacy quantities. A ring with no chosen SKU stays visible but cannot be ordered.
  if (!Array.isArray(state.cartLines)) state.cartLines = Number(state.cartCount) > 0 ? [{ productId: state.cartProductId, skuId: state.cartProductId === "mask" ? "mask-grey-standard" : null, quantity: Number(state.cartCount) }] : [];
  state.cartLines = normalizeShoppingLines(state.cartLines);
  state.cartSelection = state.cartSelection && typeof state.cartSelection === "object" && !Array.isArray(state.cartSelection) ? state.cartSelection : {};
  state.cartViewTop = Number.isFinite(state.cartViewTop) ? Math.max(0, state.cartViewTop) : 0;
  if (!state.cartSkuEdit || !state.cartLines.some(line => shoppingKey(line) === state.cartSkuEdit.key) || !state.cartSkuEdit.draft || !state.cartSkuEdit.snapshot) state.cartSkuEdit = null;
  if (!Array.isArray(state.checkoutLines)) state.checkoutLines = Number(state.cartCount) > 0 ? [{ productId: state.checkoutProductId, skuId: state.checkoutProductId === "mask" ? "mask-grey-standard" : null, quantity: Number(state.cartCount) }] : [];
  state.checkoutLines = normalizeShoppingLines(state.checkoutLines);
  if (!state.checkoutSources || typeof state.checkoutSources !== "object" || Array.isArray(state.checkoutSources)) state.checkoutSources = {};
  if (state.checkoutOrigin === "cart" && !state.checkoutDraftOrderId && !Object.keys(state.checkoutSources).length) state.checkoutSources = Object.fromEntries(state.checkoutLines.map(line => [shoppingKey(line), [{ ...line }]]));
  if (!state.checkoutSkuEdit || !state.checkoutLines.some(line => shoppingKey(line) === state.checkoutSkuEdit.key) || !state.checkoutSkuEdit.draft || !state.checkoutSkuEdit.snapshot) state.checkoutSkuEdit = null;
  state.checkoutViewTop = Number.isFinite(state.checkoutViewTop) ? Math.max(0, state.checkoutViewTop) : 0;
  syncCartBadge();
  if (state.orderSnapshot?.id && !state.orders.some(order => order.id === state.orderSnapshot.id)) state.orders.push(state.orderSnapshot);
  state.afterSales = Array.isArray(state.afterSales) ? state.afterSales : [];
  if (state.afterSaleSnapshot?.id && !state.afterSales.some(row => row.id === state.afterSaleSnapshot.id)) {
    state.afterSaleSnapshot = { type:"退货退款",reason:"历史售后申请",note:"",...state.afterSaleSnapshot,status:state.afterSaleSnapshot.status || state.afterSaleStatus };
    state.afterSales.push(state.afterSaleSnapshot);
  }
  if (state.paymentStatus === "processing" && state.orderSnapshot?.id) {
    const pending = state.orders.find(row => row.id === state.orderSnapshot.id);
    if (pending?.status === "pending-payment" && !pending.paymentResult) { pending.status = "processing"; state.orderSnapshot = pending; }
  }
  state.orders.forEach(order => {
    if (!order.paymentResult) order.paymentResult = order.status === "paid" ? "success" : order.status === "processing" ? "processing" : order.id === state.orderSnapshot?.id && ["failed", "cancelled"].includes(state.paymentStatus) ? state.paymentStatus === "failed" ? "failed" : "deferred" : "ready";
  });
  state.vouchers = Array.isArray(state.vouchers) ? state.vouchers : [];
  // A debit alone is not proof of delivery. Do not synthesize missing vouchers.
  state.addresses = Array.isArray(state.addresses) ? state.addresses : [];
  state.taskStates = { ...(state.taskStates || {}) };
  state.afterSaleDraft = { ...defaultState.afterSaleDraft, ...(state.afterSaleDraft || {}) };
  if (state.pointsMode === "pending" && !state.pendingPointsCorrection) { state.pendingPointsCorrection = 1200; state.pointsBalance = 0; }
  let identityDraftIsVolatile = false;
  const IDENTITY_DEMO = { name: "演示用户", idNumber: "000000200001010000" };
  const IDENTITY_NOTICE_VERSION = "prototype-identity-20260907";
  channelStore = window.HALO_CHANNEL_STORE.create(state, defaultState);
  window.haloChannelStorage = channelStore;
  const commercialStore = window.HALO_COMMERCIAL_ACCOUNT_STORE.create(state, defaultState);
  window.haloCommercialStorage = commercialStore;
  function persistCommercialState() {
    if (channelStore.owner() && channelStore.dirty()) { try { channelStore.commit(state); } catch { return false; } }
    if (document.querySelector('#screen')?.dataset.page?.startsWith("CHN-")) return !channelStore.unavailable();
    if (document.querySelector('#screen')?.dataset.page === "MY-02") return false;
    if (document.querySelector('#screen')?.dataset.page === "REF-01") return false;
    try {
      if (typeof localStorage === "undefined") return false;
      return commercialStore.commit();
    } catch {
      // The prototype remains interactive when storage is unavailable.
      return false;
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
  function completeTask(input = {}) {
    return memberTaskLedger.complete(input);
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
  function recordPointsTransaction(entry, persist = true) {
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
    if (persist) persistCommercialState();
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
  function applyOrderPoints(order = state.orderSnapshot, persist = true) {
    if (!order?.id || !order.pointsUsed) return false;
    return recordPointsTransaction({
      id: `order:${order.id}:points-used`,
      title: `订单 ${order.id}`,
      detail: "今天 21:26 · 支付成功",
      amount: -Number(order.pointsUsed),
    }, persist);
  }
  function applyAfterSalePoints(snapshot = state.afterSaleSnapshot, persist = true) {
    if (!snapshot?.id || snapshot.type === "换货" || !snapshot.order?.pointsUsed) return false;
    return recordPointsTransaction({
      id: `aftersale:${snapshot.id}:points-restored`,
      title: `售后 ${snapshot.id}`,
      detail: "售后退款 · Halo Points 已退回",
      amount: Number(snapshot.order.pointsUsed),
    }, persist);
  }
  function saveOrder(order, persist = true) {
    state.orders = [order, ...state.orders.filter(item => item.id !== order.id)];
    if (state.orderSnapshot?.id === order.id) state.orderSnapshot = order;
    if (persist) persistCommercialState();
    return order;
  }
  const paymentNotices = {};
  function commitPaymentChange(orderId, change, ctx) {
    const keys = ["orders", "orderSnapshot", "paymentStatus", "pointsBalance", "pointsTransactions", "pendingPointsCorrection", "pointsMode", "couponUsedOrderId"];
    const before = Object.fromEntries(keys.map(key => [key, structuredClone(state[key])]));
    const changed = change();
    if (changed !== false && persistCommercialState()) { delete paymentNotices[orderId]; return true; }
    Object.assign(state, before);
    paymentNotices[orderId] = "暂时无法保存支付进度，请重试。原订单已保留。";
    ctx.render?.(); return false;
  }
  function paymentPointsAvailable(order) {
    if (orderCouponProblem(order)) return false;
    if (!order?.pointsUsed || hasPointsTransaction(`order:${order.id}:points-used`)) return true;
    const reserved = state.redemptionStatus === "processing" ? selectedRedemption().cost : 0;
    return availablePoints() - reserved >= order.pointsUsed;
  }
  function finishPendingPayment(ctx, expectedOrderId, expectedAttemptId) {
    const order = state.orders.find(item => item.id === expectedOrderId);
    if (!order || order.status !== "processing" || order.paymentAttemptId !== expectedAttemptId) return;
    const changed = paymentIssue(order);
    if (changed || order.paymentMockOutcome === "failed") {
      if (!commitPaymentChange(order.id, () => {
        saveOrder({ ...order, status: "pending-payment", paymentResult: "failed", paymentFailure: changed ? "quote-changed" : "simulated-failure" }, false);
        if (state.orderSnapshot?.id === order.id) state.paymentStatus = "failed";
      }, ctx)) return;
      ctx.render?.(); return;
    }
    if (!commitPaymentChange(order.id, () => {
      if (order.pointsUsed && !applyOrderPoints(order, false) && !hasPointsTransaction(`order:${order.id}:points-used`)) return false;
      if (order.coupon) state.couponUsedOrderId = order.id;
      saveOrder({ ...order, status: "paid", paymentResult: "success", paymentFailure: null, paidAt: new Date().toISOString() }, false);
      if (state.orderSnapshot?.id === order.id) state.paymentStatus = "success";
    }, ctx)) return;
    ctx.render?.();
  }
  function getStudioVoucher(eventId, voucherId = "", bookingId = "") {
    const inDate = item => {
      const expiry = item.expires_at || item.expiresAt;
      return !expiry || Number.isFinite(Date.parse(expiry)) && Date.parse(expiry) > Date.now();
    };
    const voucher = voucherId ? state.vouchers.find(item => item.id === voucherId) : state.vouchers.find(item => item.status === "available" && inDate(item));
    if (!voucher || !commercialStore.owns(voucher)) return null;
    const ownUse = Boolean(bookingId && voucher.status === "used" && voucher.bookingId === bookingId && voucher.eventId === eventId);
    return { ...voucher, eligible: ["yoga-evening", "breath-night"].includes(eventId) && (ownUse || voucher.status === "available" && inDate(voucher)) };
  }
  function consumeStudioVoucher(eventId, bookingId, voucherId = "") {
    if (!bookingId) return false;
    try {
      const current = JSON.parse(localStorage.getItem(COMMERCIAL_PROGRESS_KEY) || "null"), login = JSON.parse(localStorage.getItem("haloV5AppProgress") || "null");
      const owner = login?.authPhone || login?.authForm?.phone;
      if (!login?.signedIn || !login.authVerified || !owner || !Array.isArray(current?.vouchers) || (current.accountRef || current.memberAssets?.accountRef) !== owner) return false;
      if (!window.HALO_COMMERCIAL_ACCOUNT_STORE.same(window.HALO_COMMERCIAL_ACCOUNT_STORE.session(), window.HALO_COMMERCIAL_ACCOUNT_STORE.ownership(current))) return false;
      commercialStore.sync(current);
    const used = state.vouchers.find(voucher => voucher.bookingId === bookingId && voucher.status === "used");
    if (used) return used.eventId === eventId && (!voucherId || used.id === voucherId);
    const voucher = getStudioVoucher(eventId, voucherId);
    if (!voucher?.eligible || voucher.status !== "available" || (voucher.accountRef && voucher.accountRef !== owner)) return false;
      const next = {...current, vouchers:current.vouchers.map(item => item.id === voucher.id ? {...item,status:"used",bookingId,eventId,usedAt:new Date().toISOString()} : item)};
      localStorage.setItem(COMMERCIAL_PROGRESS_KEY, JSON.stringify(next));
      commercialStore.sync(next); return true;
    } catch { return false; }
  }
  function restoreStudioVoucher(bookingId, voucherId = "", eventId = "") {
    if (!bookingId) return false;
    commercialStore.sync();
    const voucher = voucherId ? state.vouchers.find(item => item.id === voucherId) : state.vouchers.find(item => item.bookingId === bookingId && item.status === "used");
    if (!voucher) return false;
    if (voucher.returnedForBookingId === bookingId && (!eventId || voucher.returnedForEventId === eventId)) return true;
    if (voucher.status !== "used" || voucher.bookingId !== bookingId || eventId && voucher.eventId !== eventId) return false;
    if (!commercialStore.owns(voucher)) return false;
    const previous = structuredClone(state.vouchers);
    Object.assign(voucher, { status: "available", returnedForBookingId: bookingId, returnedForEventId: voucher.eventId, returnedAt: new Date().toISOString(), bookingId: null, eventId: null });
    if (!persistCommercialState()) { state.vouchers = previous; return false; }
    return true;
  }
  const studioBenefitLedger = window.HALO_STUDIO_BENEFIT_LEDGER.create({ state, storageKey: COMMERCIAL_PROGRESS_KEY, appStorageKey: "haloV5AppProgress", maybeUpgradeMember });
  function getStudioBenefit(args = {}) { return studioBenefitLedger.get(args); }
  function postStudioBenefit(args = {}) { return studioBenefitLedger.post(args); }
  function awardStudioBenefit(args = {}) { return postStudioBenefit(args).status === "posted"; }
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
    pointsRedemption.resume(ctx);
    state.orders.filter(order => order.status === "processing").forEach(order => {
      const key = `payment:${order.id}:${order.paymentAttemptId || "legacy"}`;
      if (asyncResumeScheduled[key] || paymentNotices[order.id]) return;
      asyncResumeScheduled[key] = true;
      setTimeout(() => { asyncResumeScheduled[key] = false; finishPendingPayment(ctx, order.id, order.paymentAttemptId); }, 650);
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
  const cartEditActive = () => Boolean(state.cartSkuEdit && document.getElementById("screen")?.dataset.page === "SEL-04");
  const checkoutEditActive = () => Boolean(state.checkoutSkuEdit && document.getElementById("screen")?.dataset.page === "SEL-05");
  const rowEdit = () => checkoutEditActive() ? state.checkoutSkuEdit : cartEditActive() ? state.cartSkuEdit : null;
  const editRows = () => checkoutEditActive() ? state.checkoutLines : state.cartLines;
  const editOrderId = () => checkoutEditActive() ? state.checkoutReconfirmId || state.checkoutDraftOrderId || "" : "";
  const selectedProduct = () => PRODUCTS[rowEdit()?.productId || state.selectedProductId] || PRODUCTS.mask;
  function normalizeShoppingLines(lines) {
    const grouped = new Map();
    for (const line of lines) {
      if (!line || !PRODUCTS[line.productId]) continue;
      const quantity = Number(line.quantity);
      if (!Number.isSafeInteger(quantity) || quantity < 1) continue;
      const sku = PRODUCT_SKUS[line.skuId];
      const skuId = sku?.productId === line.productId ? sku.id : null;
      const key = skuId || `legacy-${line.productId}`;
      const previous = grouped.get(key);
      grouped.set(key, { productId: line.productId, skuId, quantity: quantity + (previous?.quantity || 0) });
    }
    return [...grouped.values()];
  }
  function shoppingKey(line) { return line.skuId || `legacy-${line.productId}`; }
  function syncCartBadge() {
    state.cartCount = state.cartLines.reduce((sum, line) => sum + line.quantity, 0);
    state.cartProductId = state.cartLines[0]?.productId || "mask";
  }
  function syncCartSelection() {
    const next = {};
    for (const line of state.cartLines) {
      const key = shoppingKey(line);
      next[key] = !lineProblem(line) && state.cartSelection[key] !== false;
    }
    state.cartSelection = next;
  }
  const selectedCartLines = () => state.cartLines.filter(line => state.cartSelection[shoppingKey(line)] && !lineProblem(line));
  function cartSkuLimit(skuId) {
    const edit = rowEdit(), other = edit ? editRows().find(row => shoppingKey(row) !== edit.key && row.skuId === skuId) : null;
    return Math.max(0, skuAvailable(skuId, editOrderId()) - (other?.quantity || 0));
  }
  function cartEditProblem(line) {
    if (!rowEdit()) return "";
    const edit = rowEdit(), current = editRows().find(row => shoppingKey(row) === edit.key);
    if (!current || JSON.stringify(current) !== JSON.stringify(edit.snapshot)) return "这件商品已发生变化，请关闭后重新选择规格";
    const other = editRows().find(row => shoppingKey(row) !== edit.key && row.skuId === line.skuId);
    return other && line.quantity > cartSkuLimit(line.skuId) ? `${checkoutEditActive() ? "本单" : "购物车"}已有此规格 ${other.quantity} 件，本次最多可选 ${cartSkuLimit(line.skuId)} 件` : "";
  }
  function productSelection() {
    const product = selectedProduct();
    const saved = rowEdit()?.draft || state.productSelections[product.id] || {};
    const color = RING_COLORS.some(([key]) => key === saved.color) ? saved.color : "";
    const size = RING_SIZES.includes(saved.size) ? saved.size : "";
    return { color, size, quantity: Number.isSafeInteger(saved.quantity) && saved.quantity > 0 ? saved.quantity : 1 };
  }
  function selectionLine() {
    const product = selectedProduct(), draft = productSelection();
    const skuId = product.id === "mask" ? "mask-grey-standard" : product.id === "ring" && draft.color && draft.size ? `ring-${draft.color}-${draft.size}` : null;
    return { productId: product.id, skuId, quantity: draft.quantity };
  }
  const isProductOpen = product => product && !product.displayOnly && state.catalogMode !== "display" && state.selectHomeScene !== "empty";
  function skuAvailable(skuId, excludingOrderId = "") {
    const sku = PRODUCT_SKUS[skuId];
    if (!sku) return 0;
    const configured = state.skuStockOverrides[skuId];
    const stock = Number.isSafeInteger(configured) && configured >= 0 ? configured : sku.stock;
    const reserved = state.orders.filter(order => order.id !== excludingOrderId && ["pending-payment", "processing", "paid"].includes(order.status))
      .reduce((sum, order) => sum + (order.lines || []).filter(line => line.skuId === skuId).reduce((n, line) => n + line.quantity, 0), 0);
    return Math.max(0, stock - reserved);
  }
  function lineProblem(line, excludingOrderId = "") {
    if (!isProductOpen(PRODUCTS[line?.productId])) return "这件商品暂未开放购买";
    if (!PRODUCT_SKUS[line.skuId]) return "请先选择颜色和尺码";
    if (!Number.isSafeInteger(line.quantity) || line.quantity < 1) return "请选择至少 1 件商品";
    const available = skuAvailable(line.skuId, excludingOrderId);
    if (!available) return "此规格暂时缺货，请选择其他规格";
    return line.quantity > available ? `此规格最多可选 ${available} 件，请减少数量` : "";
  }
  function checkoutProblem() {
    if (!state.checkoutLines.length) return "请先选择可购买商品";
    const invalid = state.checkoutLines.find(line => lineProblem(line, state.checkoutReconfirmId || state.checkoutDraftOrderId));
    if (invalid) return `${PRODUCTS[invalid.productId].title}：${lineProblem(invalid, state.checkoutReconfirmId || state.checkoutDraftOrderId)}`;
    if (!checkoutAddress()) return "请添加或选择有效的收货地址";
    if (!deliveryReady()) return "配送费用尚未确认，可联系客服核对";
    return "";
  }
  function orderStockProblem(order) {
    if (!order?.lines) return ""; // Historical snapshots without SKU IDs remain historical facts.
    return order.lines.map(line => lineProblem(line, order.id)).find(Boolean) || "";
  }
  const checkoutProduct = () => PRODUCTS[state.checkoutLines[0]?.productId] || selectedProduct();
  const shoppingLineSnapshot = line => ({ ...line, title: PRODUCTS[line.productId].title, specification: PRODUCT_SKUS[line.skuId]?.specification || "待选择规格", unitPrice: PRODUCTS[line.productId].price, subtotal: PRODUCTS[line.productId].price * line.quantity });
  function beginCheckout(lines, origin) {
    state.addressSelection = null;
    if (state.addressUndo) state.addressUndo.applied = null;
    state.checkoutLines = lines.map(line => ({ ...line }));
    state.checkoutProductId = lines[0]?.productId || "mask";
    state.checkoutOrigin = origin; state.checkoutReconfirmId = null; state.checkoutDraftOrderId = null;
    state.checkoutSources = origin === "cart" ? Object.fromEntries(lines.map(line => [shoppingKey(line), [{ ...line }]])) : {};
    state.checkoutSkuEdit = null; state.checkoutSeenQuote = null; state.checkoutQuoteChanged = false; state.checkoutNotice = ""; state.checkoutViewTop = 0;
    state.paymentStatus = "ready"; state.orderSnapshot = null;
    persistCommercialState();
  }
  const formatMoney = amount => `¥${Number(amount).toLocaleString("zh-CN", { minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 2 })}`;
  function deliveryReady() {
    const delivery = state.checkoutDelivery;
    return delivery?.status === "ready" && Number.isSafeInteger(delivery.feeCents) && delivery.feeCents >= 0;
  }
  function couponEligibility({ subtotalCents, hasLines = true, orderId = "", expiresAt = MEMBER_COUPON.expiresAt, now = Date.now() }) {
    if (!state.ownedCouponIds.includes(MEMBER_COUPON.id)) return { available: false, status: "unowned", reason: "暂无可用优惠券", discountCents: 0 };
    if (state.couponUsedOrderId && state.couponUsedOrderId !== orderId) return { available: false, status: "used", reason: "已用于另一笔订单", discountCents: 0 };
    if (!Number.isFinite(Date.parse(expiresAt)) || now >= Date.parse(expiresAt)) return { available: false, status: "expired", reason: "优惠券已过期", discountCents: 0 };
    if (!hasLines || !Number.isSafeInteger(subtotalCents) || subtotalCents <= 0) return { available: false, status: "unavailable", reason: "请先选择商品", discountCents: 0 };
    if (subtotalCents < MEMBER_COUPON.thresholdCents) return { available: false, status: "unavailable", reason: `商品金额还差 ${formatMoney((MEMBER_COUPON.thresholdCents - subtotalCents) / 100)}`, discountCents: 0 };
    return { available: true, status: "available", reason: "", discountCents: MEMBER_COUPON.amountCents };
  }
  function checkoutCoupon() {
    const subtotalCents = state.checkoutLines.reduce((sum, line) => sum + Math.round((PRODUCTS[line.productId]?.price || 0) * 100) * line.quantity, 0);
    return couponEligibility({ subtotalCents, hasLines: state.checkoutLines.length > 0, orderId: state.checkoutDraftOrderId || state.checkoutReconfirmId || "" });
  }
  function orderCouponProblem(order) {
    if (!order?.coupon || order.status === "paid") return "";
    const eligible = couponEligibility({ subtotalCents: Math.round(Number(order.subtotal) * 100), orderId: order.id, expiresAt: order.couponSnapshot?.expiresAt || MEMBER_COUPON.expiresAt });
    return eligible.available ? "" : eligible.reason;
  }
  const money = () => {
    const subtotalCents = state.checkoutLines.reduce((sum, line) => sum + Math.round(PRODUCTS[line.productId].price * 100) * line.quantity, 0);
    const couponCents = state.couponSelected ? checkoutCoupon().discountCents : 0;
    const reserved = state.redemptionStatus === "processing" ? selectedRedemption().cost : 0;
    // 1 whole Point equals 1 fen. No invented 3,000-Point or whole-yuan minimum.
    const maxPointsCount = Math.max(0, Math.min(Math.floor(availablePoints()) - reserved, Math.floor(subtotalCents * 30 / 100), subtotalCents - couponCents));
    const pointsCount = state.pointsUsed ? maxPointsCount : 0;
    const shipping = deliveryReady() ? state.checkoutDelivery.feeCents / 100 : null;
    return { subtotal: subtotalCents / 100, coupon: couponCents / 100, points: pointsCount / 100, pointsCount, maxPointsCount, shipping, payable: shipping === null ? null : (subtotalCents - couponCents - pointsCount + state.checkoutDelivery.feeCents) / 100 };
  };
  function checkoutAddress() {
    if (!state.selectedAddress) { state.selectedAddressSnapshot = null; return null; }
    // Migrate only an absent snapshot. Explicit null means the user must choose again.
    if (state.selectedAddressSnapshot === undefined) {
      const address = state.addresses.find(item => item.id === state.selectedAddress);
      const legacy = ["shanghai", "hangzhou"].includes(state.selectedAddress) ? { id: state.selectedAddress, name: "林女士", phone: "138 **** 0000", detail: `${state.selectedAddress === "shanghai" ? "上海市静安区" : "杭州市西湖区"} · 示例收货地址`, simulated: true } : null;
      const candidate = address || legacy;
      state.selectedAddressSnapshot = window.HALO_SELECT_ADDRESS_CONTROLLER.valid(candidate) ? window.HALO_SELECT_ADDRESS_CONTROLLER.normalize(candidate) : null;
    }
    const snapshot = state.selectedAddressSnapshot;
    return snapshot?.id === state.selectedAddress && window.HALO_SELECT_ADDRESS_CONTROLLER.valid(snapshot) ? { ...snapshot } : null;
  }
  const addressLabel = () => { const address = checkoutAddress(); return address ? `${address.name} · ${address.phone} · ${address.detail}` : "请选择收货地址"; };
  function checkoutQuoteKey() {
    return JSON.stringify({ lines: state.checkoutLines.map(shoppingLineSnapshot), address: checkoutAddress(), totals: money(), delivery: state.checkoutDelivery });
  }
  function checkoutSnapshot() {
    const totals = money(), product = checkoutProduct();
    const lines = state.checkoutLines.map(shoppingLineSnapshot);
    return {
      id: state.checkoutReconfirmId || `HS20260906${String(state.nextOrderSequence).padStart(4, "0")}`,
      productId: product.id, title: lines.length === 1 ? product.title : `${lines[0].title} 等 ${lines.length} 款商品`,
      specification: lines.map(line => `${line.specification} × ${line.quantity}`).join("；"), lines,
      quantity: lines.reduce((sum, line) => sum + line.quantity, 0), subtotal: totals.subtotal,
      coupon: totals.coupon, pointsAmount: totals.points, pointsUsed: totals.pointsCount,
      couponId: totals.coupon ? MEMBER_COUPON.id : null,
      couponSnapshot: totals.coupon ? { ...MEMBER_COUPON } : null,
      payable: totals.payable, address: addressLabel(),
      addressSnapshot: checkoutAddress(), shippingAmount: totals.shipping, deliverySnapshot: { ...state.checkoutDelivery },
      attribution: state.attribution, attributionReason: state.attributionReason,
      shipping: state.checkoutDelivery.shipping || "发货时间待确认", paymentMethod: "全款支付", checkoutOrigin: state.checkoutOrigin,
      status: "pending-payment", paymentResult: "ready", createdAt: state.orders.find(order => order.id === state.checkoutReconfirmId)?.createdAt || new Date().toISOString()
    };
  }
  function currentOrder() {
    const id = state.selectedOrderId === "latest" ? state.orderSnapshot?.id : state.selectedOrderId;
    const found = state.orders.find(order => order.id === id && commercialStore.owns(order));
    if (found) return found;
    return null;
  }
  function orderAfterSale(order) { return state.afterSales.find(item => item.order.id === order?.id); }
  function saveAfterSale(snapshot, persist = true) {
    state.afterSales = [snapshot, ...state.afterSales.filter(item => item.id !== snapshot.id)];
    state.afterSaleSnapshot = snapshot; state.afterSaleStatus = snapshot.status;
    const order = state.orders.find(item => item.id === snapshot.order.id);
    if (order) saveOrder({ ...order, afterSaleId: snapshot.id, afterSaleStatus: snapshot.status, afterSaleType: snapshot.type }, false);
    return persist ? persistCommercialState() : true;
  }
  function isIdentityValid() {
    const errors = identityInputErrors();
    return !errors.name && !errors.idNumber && state.identityConsent;
  }
  function identityInputErrors() {
    const name = String(state.identityDraft.name || "").trim();
    const id = String(state.identityDraft.idNumber || "").replace(/\s/g, "").toUpperCase();
    return {
      name: !name ? "请填写身份证上的姓名" : !/^[\p{L}·\s'-]{2,60}$/u.test(name) ? "请按身份证填写完整姓名，不要使用星号或数字" : "",
      idNumber: !id ? "请填写 18 位身份证号码" : !/^\d{17}[\dX]$/.test(id) ? "身份证号码应为 18 位，末位可以是 X" : ""
    };
  }
  function syncIdentityControls() {
    const errors = identityInputErrors();
    for (const [key, id] of [["name", "identity-name"], ["idNumber", "identity-id-number"]]) {
      const field = document.getElementById(id), error = document.getElementById(`${id}-error`);
      if (!field || !error) continue;
      const show = Boolean(String(state.identityDraft[key] || "").trim() && errors[key]);
      field.setAttribute("aria-invalid", String(show)); error.textContent = show ? errors[key] : ""; error.hidden = !show;
    }
    const button = document.getElementById("identity-submit"), hint = document.getElementById("identity-submit-hint");
    if (button) { button.disabled = !isIdentityValid(); button.setAttribute("aria-disabled", String(button.disabled)); }
    if (hint) hint.textContent = errors.name || errors.idNumber || (!state.identityConsent ? "阅读并同意上方说明后，即可提交核验。" : "核验结果会保存在申请进度中。");
  }
  function identityResume(ctx) {
    if (state.applicationSnapshot) return channelJoinNext(ctx);
    if (["active", "paused", "terminated", "approved", "activation-pending"].includes(state.channelIdentity) || state.applicationStatus === "reviewing" || state.identityProcessing || (state.identityVerified && !["rejected", "withdrawn"].includes(state.applicationStatus))) return channelJoinNext(ctx);
    if (identityRecord()?.status === "failed" && !identityFailureInfo(identityRecord()).canRetry) return { title: "这次核验需要协助", detail: "请先联系客服核对本次结果。", label: "查看核验结果", route: "CHN-04" };
    return null;
  }
  function identityPage(item, ctx) {
    const header = `<header class="screen-head commercial-head"><div><button class="back" data-action="go:CHN-01" aria-label="返回申请入口">← 返回</button><span class="page-context">体验顾问 · 第 1 步</span><h1>${e(item.name)}</h1></div></header>`;
    const resume = identityResume(ctx);
    if (resume) return `${header}<div class="stack commercial-stack">${feedback(resume.title, resume.detail, "plain")}${actions([[resume.label, "commercial:join-continue", "primary"]])}</div>`;
    const errors = identityInputErrors();
    const field = (label, id, key, placeholder, length) => {
      const error = state.identityDraft[key] && errors[key] ? errors[key] : "";
      return `<label class="field-label">${label}<input id="${id}" class="field" value="${e(state.identityDraft[key])}" placeholder="${placeholder}" maxlength="${length}" autocomplete="off" spellcheck="false" inputmode="text" aria-required="true" aria-invalid="${Boolean(error)}" aria-describedby="${id}-error"><small id="${id}-error" class="field-error" ${error ? "" : "hidden"}>${e(error)}</small></label>`;
    };
    return `${header}<div class="stack commercial-stack channel-identity-form"><section class="form-intro"><h2>确认是你本人</h2><p>用于本次体验顾问申请，以及后续签约和收款身份确认。</p></section>
      ${field("姓名", "identity-name", "name", "与身份证上的姓名一致", 60)}
      ${field("身份证号码", "identity-id-number", "idNumber", "18 位中国大陆居民身份证号码", 30)}
      <div class="channel-identity-consent"><label class="check-line"><input id="identity-consent" type="checkbox" data-action="commercial:identity-consent" ${state.identityConsent ? "checked" : ""}><span>我已阅读并同意</span></label><button class="text-button" data-action="commercial:identity-notice">《身份核验与隐私说明》</button></div>
      <div class="button-row"><button id="identity-submit" class="primary" data-action="commercial:identity-submit" aria-describedby="identity-submit-hint" ${isIdentityValid() ? "" : 'disabled aria-disabled="true"'}>提交核验</button></div>
      <p id="identity-submit-hint" class="channel-identity-hint" aria-live="polite">${e(errors.name || errors.idNumber || (!state.identityConsent ? "阅读并同意上方说明后，即可提交核验。" : "核验结果会保存在申请进度中。"))}</p>
      <button class="inline-page-link" data-action="go:CHN-01">暂不核验，返回申请入口</button>
    </div>`;
  }
  function showIdentityNotice() {
    document.getElementById("modal-root").innerHTML = `<div class="modal-backdrop"><section class="modal info-modal" role="dialog" aria-modal="true" aria-labelledby="identity-notice-title"><div class="modal-title-row"><h2 id="identity-notice-title">身份核验与隐私说明</h2><button class="text-button" data-action="close-modal">关闭</button></div><p class="caption">原型说明摘要，正式文本与核验服务待接入。</p><h3>这一步确认什么</h3><p>核验姓名与身份证信息是否匹配，用于本次体验顾问申请，以及后续签约和收款身份确认。</p><h3>核验后会怎样</h3><p>提交后可查看处理进度。身份核验通过后，还需完成申请、学习与审核，不会自动开通顾问身份。</p><h3>可以暂不核验</h3><p>返回后仍可使用个人会员功能；需要申请体验顾问时再继续。</p>${actions([["查看隐私政策", "legal-read:privacy", "secondary"], ["返回填写", "close-modal", "primary"]])}</section></div>`;
  }
  const IDENTITY_STATUSES = ["processing", "manual-review", "passed", "failed", "expired"];
  const IDENTITY_STATUS_LABELS = { processing: "正在核验", "manual-review": "人工复核中", passed: "已通过", failed: "未通过", expired: "已过期" };
  // Local, user-safe reason examples. Never render a provider's raw error text.
  const IDENTITY_FAILURE_REASONS = {
    "information-mismatch": { body: "姓名与身份证号码未能匹配，请按身份证核对后重新提交。", canRetry: true, primary: "retry" },
    "support-required": { body: "本次核验需要进一步核对，请联系客服协助处理。", canRetry: false, primary: "support" }
  };
  function identityFailureInfo(record) {
    return Object.hasOwn(IDENTITY_FAILURE_REASONS, record?.failureReasonCode || "") ? IDENTITY_FAILURE_REASONS[record.failureReasonCode]
      : { body: "暂未获取具体原因。你可以核对身份信息，或联系客服协助确认。", canRetry: true, primary: "support" };
  }
  let identityQueryTimer = null, identityQueryTimerKey = "", identityQueryFocus = false;
  function identityRecord() {
    const record = state.identityVerification;
    if (record?.id === state.identityRequestId && record.id && IDENTITY_STATUSES.includes(record.status)) return record;
    // Keep legacy progress without fabricating a submission time or a new request.
    if (!record && state.identityRequestId && (state.identityProcessing || state.identityVerified)) return {
      id: state.identityRequestId, status: state.identityVerified ? "passed" : "processing",
      submittedAt: state.identitySubmittedAt || null, updatedAt: null, legacy: true
    };
    return null;
  }
  function identityHasLaterStage() {
    return ["active", "paused", "terminated", "approved", "activation-pending"].includes(state.channelIdentity)
      || Boolean(state.applicationSnapshot && ["training", "reviewing", "needs-info", "approved"].includes(state.applicationStatus));
  }
  function hasPassedChannelIdentity() {
    return identityRecord()?.status === "passed" && state.identityVerified && !state.identityProcessing && state.identityQuery?.status !== "loading";
  }
  function identityDate(value) {
    const date = value ? new Date(value) : null;
    return date && Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(date).replaceAll("/", "-") : "暂未获取";
  }
  function repaintIdentityProgress(ctx) {
    const screen = document.getElementById("screen");
    if (!["CHN-03", "CHN-04"].includes(screen?.dataset.page) && !(screen?.dataset.page === "HELP-03" && state.identitySupportContext?.verificationId === state.identityRequestId)) return;
    const scrollTop = screen.scrollTop, activeAction = document.activeElement?.dataset.action;
    ctx.render(); screen.scrollTop = scrollTop;
    const action = activeAction || (identityQueryFocus ? "commercial:identity-check" : "");
    const control = [...screen.querySelectorAll("[data-action]")].find(node => node.dataset.action === action);
    if (control && !control.disabled) control.focus({ preventScroll: true });
    if (state.identityQuery?.status !== "loading") identityQueryFocus = false;
  }
  function resumeIdentityQuery(ctx) {
    const query = state.identityQuery, record = identityRecord();
    if (!query || query.status !== "loading" || !record || query.verificationId !== record.id || identityHasLaterStage()) return;
    if (identityQueryTimerKey === query.id) return;
    clearTimeout(identityQueryTimer); identityQueryTimerKey = query.id;
    const wait = Number.isFinite(query.dueAt) ? Math.min(1000, Math.max(0, query.dueAt - Date.now())) : 0;
    identityQueryTimer = setTimeout(() => {
      identityQueryTimerKey = ""; identityQueryTimer = null;
      const current = identityRecord(), pending = state.identityQuery;
      if (!current || current.id !== query.verificationId || pending?.id !== query.id || pending.status !== "loading" || identityHasLaterStage()) return;
      const reply = state.identityMockReply?.verificationId === current.id ? state.identityMockReply : null;
      const error = navigator.onLine === false ? "offline" : reply?.error || "";
      if (error) {
        state.identityQuery = { ...pending, status: "error", error, completedAt: new Date().toISOString() };
      } else {
        // Local response fixture only. A refresh never invents a PASSED result.
        const result = reply && IDENTITY_STATUSES.includes(reply.status) ? reply.status : current.status;
        const reason = reply ? reply.failureReasonCode : current.failureReasonCode;
        state.identityVerification = { ...current, status: result, updatedAt: reply?.updatedAt || current.updatedAt || null, failureReasonCode: result === "failed" && Object.hasOwn(IDENTITY_FAILURE_REASONS, reason || "") ? reason : null };
        state.identityProcessing = ["processing", "manual-review"].includes(result);
        state.identityVerified = result === "passed";
        if (["failed", "expired"].includes(result)) state.identityConsent = false;
        state.identityQuery = { ...pending, status: "complete", error: "", checkedAt: new Date().toISOString(), result };
      }
      persistCommercialState();
      ctx.track("advisor_identity_status_checked", { request_id: current.id, query_id: query.id, outcome: error || state.identityVerification.status, simulated: true });
      repaintIdentityProgress(ctx);
    }, wait);
  }
  function queryIdentityProgress(ctx) {
    const record = identityRecord();
    if (!record || identityHasLaterStage()) { repaintIdentityProgress(ctx); return; }
    if (state.identityQuery?.status === "loading" && state.identityQuery.verificationId === record.id) { resumeIdentityQuery(ctx); return; }
    identityQueryFocus = document.activeElement?.dataset.action === "commercial:identity-check";
    state.identityQuery = { id: `IDQ-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, verificationId: record.id, status: "loading", startedAt: new Date().toISOString(), dueAt: Date.now() + 650, checkedAt: state.identityQuery?.verificationId === record.id ? state.identityQuery.checkedAt || null : null };
    persistCommercialState(); repaintIdentityProgress(ctx); resumeIdentityQuery(ctx);
  }
  function identityProgressPage(item, ctx) {
    const header = `<header class="screen-head commercial-head"><div><button class="back" data-action="go:CHN-01" aria-label="返回申请入口">← 返回</button><span class="page-context">体验顾问</span><h1>${e(item.name)}</h1></div></header>`;
    if (identityHasLaterStage()) {
      const next = channelJoinNext(ctx);
      return `${header}<div class="stack commercial-stack">${feedback(next.title, next.detail, "plain")}${actions([[next.label, "commercial:join-continue", "primary"], ["返回我的", "go:MY-01", "secondary"]])}</div>`;
    }
    const record = identityRecord(), query = state.identityQuery?.verificationId === record?.id ? state.identityQuery : null;
    const clock = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg>';
    const card = (title, body, tone = "waiting", mark = clock) => `<section class="result-card ${tone} identity-progress-result" role="status"><span aria-hidden="true">${mark}</span><h2>${e(title)}</h2><p>${e(body)}</p></section>`;
    if (!record) return `${header}<div class="stack commercial-stack identity-progress-page">${card("尚未提交身份核验", "先确认本人身份，再继续申请体验顾问。", "", "—")}${actions([["去确认身份", "go:CHN-02", "primary"], ["返回我的", "go:MY-01", "secondary"]])}</div>`;
    const variants = {
      processing: ["正在核验身份", "资料已收到。你可以先离开，稍后从「我的」里的体验顾问入口查看进度。", "waiting", clock],
      "manual-review": ["正在人工复核", "资料正在进一步核对，无需重复提交。你可以先离开，稍后再查看进度。", "waiting", clock],
      passed: ["身份已确认", "身份核验已通过，可以继续填写体验顾问申请。", "success", "✓"],
      failed: ["本次核验未通过", "请查看原因与处理方法，按提示继续。", "failure", "!"],
      expired: ["本次核验已过期", "请重新核验身份，已有申请资料不会因此清空。", "waiting", clock]
    };
    const busy = query?.status === "loading";
    const main = record.status === "passed" ? ["继续申请", "commercial:identity-continue", "primary", busy]
      : record.status === "failed" ? ["查看原因与处理方法", "go:CHN-04", "primary"]
      : record.status === "expired" ? ["重新核验", "commercial:identity-retry", "primary"] : ["返回我的", "go:MY-01", "primary"];
    const rows = [["核验编号", record.id], ["提交时间", identityDate(record.submittedAt)]];
    if (record.expectedAt && identityDate(record.expectedAt) !== "暂未获取") rows.push(["预计反馈", identityDate(record.expectedAt)]);
    if (query?.checkedAt) rows.push(["最近查询", identityDate(query.checkedAt)]);
    rows.push(["当前状态", IDENTITY_STATUS_LABELS[record.status]]);
    const queryError = query?.status === "error" ? feedback("暂时查不到最新进度", query.error === "offline" ? "网络未连接，本次没有获取新结果。联网后可重试。" : query.error === "timeout" ? "查询超时，请稍后重试。这不代表身份核验未通过。" : "本次查询没有成功，请稍后重试。原核验状态保持不变。", "warm") : "";
    const queryNote = busy ? "正在查询最新进度…" : query?.status === "complete" ? `最近一次查询：${IDENTITY_STATUS_LABELS[record.status]}。` : "";
    return `${header}<div class="stack commercial-stack identity-progress-page" data-verification-status="${record.status}" data-verification-id="${e(record.id)}">${card(...variants[record.status])}${queryError}${summary(rows)}
      ${actions([main, [busy ? "查询中…" : query?.status === "error" ? "重试查询" : "刷新进度", "commercial:identity-check", "secondary", busy]])}
      ${queryNote ? `<p class="identity-query-note" role="status">${busy ? '<span class="spinner" aria-hidden="true"></span>' : ""}${e(queryNote)}</p>` : ""}
      <button class="inline-page-link" data-action="go:HELP-03">联系客服</button></div>`;
  }
  function identityFailurePage(item, ctx) {
    const record = identityRecord();
    if (identityHasLaterStage() || state.applicationSnapshot) {
      const next = channelJoinNext(ctx);
      return shell(item, "体验顾问", `${feedback(next.title, next.detail, "plain")}${actions([[next.label, "commercial:join-continue", "primary"], ["返回我的", "go:MY-01", "secondary"]])}`);
    }
    if (!record || record.status !== "failed") return identityProgressPage(item, ctx);
    const info = identityFailureInfo(record), busy = state.identityQuery?.verificationId === record.id && state.identityQuery.status === "loading";
    const retry = ["核对身份信息", "commercial:identity-retry", info.primary === "retry" ? "primary" : "secondary", busy];
    const support = ["联系客服", "commercial:identity-support", info.primary === "support" ? "primary" : "secondary", busy];
    const buttons = info.primary === "retry" ? [retry, support] : info.canRetry ? [support, retry] : [support];
    const header = `<header class="screen-head commercial-head"><div><button class="back" data-action="go:CHN-03" aria-label="返回核验进度">← 返回</button><span class="page-context">体验顾问</span><h1>身份核验未通过</h1></div></header>`;
    return `${header}<div class="stack commercial-stack identity-failure-page" data-verification-status="failed" data-verification-id="${e(record.id)}">
      <section class="result-card failure" role="status"><span aria-hidden="true">!</span><h2>本次核验未通过</h2><p>${e(info.body)}</p></section>
      <section class="summary-card">${summary([["核验编号", record.id], ["结果时间", identityDate(record.updatedAt)]])}<button class="text-button identity-reference-copy" data-action="commercial:identity-copy">复制核验编号</button></section>
      ${busy ? feedback("正在查询最新进度", "请等待本次查询完成后再继续。", "plain") : ""}${actions(buttons)}
      <button class="inline-page-link" data-action="go:CHN-03">返回核验进度</button></div>`;
  }
  function identitySupportPanel(origin) {
    const context = state.identitySupportContext, record = identityRecord();
    if (origin !== "CHN-04" || !context || context.verificationId !== record?.id || identityHasLaterStage() || state.applicationSnapshot) return "";
    return `<section id="identity-support-context" class="summary-card identity-support-context" data-verification-id="${e(context.verificationId)}"><h3>咨询本次身份核验</h3><p>可将核验编号提供给客服，帮助查找这次记录。</p>${summary([["核验编号", context.verificationId], ["当前核验状态", IDENTITY_STATUS_LABELS[record.status]]])}<button class="text-button identity-reference-copy" data-action="commercial:identity-copy">复制核验编号</button><button class="inline-page-link" data-action="go:CHN-04">返回核验结果</button></section>`;
  }

  function taskStatusLabel(status, taskItem) {
    return ({ posted: "已到账", restored: "已恢复", validating: "确认中", adjusted: "已调整", reviewing: "复核中" })[status] || taskItem.progress;
  }
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
      "MEM-06": () => memberBadges.render(ctx),
      "MEM-07": () => memberBenefits.render(ctx),
      "PTS-01": () => pointsHome.render(ctx),
      "PTS-02": () => pointsLedger.render(ctx),
      "PTS-03": () => pointsCatalog.render(ctx),
      "PTS-04": () => pointsRedemption.render(ctx),
      "REF-01": () => referralPage.render(ctx),
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
    const shipment = snapshot.returnShipment;
    if (snapshot.status === "return-required" && typeof shipment?.carrier === "string" && shipment.carrier.trim() && shipment.carrier.trim().length <= 40 && /^[A-Za-z0-9-]{4,60}$/.test(String(shipment.trackingNumber || "").replace(/\s/g, ""))) return "寄回信息已提交";
    return ({ submitted: "申请已提交", reviewing: "正在审核", "return-required": "等待寄回", refunding: "退款处理中", exchanging: "换货寄送中", completed: snapshot.type === "换货" ? "换货已完成" : "退款已完成", rejected: "申请未通过", failed: "暂时无法更新" })[snapshot.status] || "处理中";
  }
  function afterSaleAmounts(order,type) {
    return type === "换货" ? summary([["本次现金退款","¥0"],["积分恢复","无，原支付保持不变"],["处理方式","审核通过后换发商品"]],"换货说明") : summary([["预计原路退款",`¥${order.payable}`],["预计积分恢复",`${order.pointsUsed} Points`]],"退款构成");
  }
  const selectIcon = (name, className = "") => {
    const paths = {
      back: '<path d="m14 5-7 7 7 7"/>',
      next: '<path d="m9 5 7 7-7 7"/>',
      search: '<circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/>',
      close: '<path d="m6 6 12 12M18 6 6 18"/>',
      bag: '<path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/>',
      receipt: '<path d="M6 2h9l4 4v16l-3-2-3 2-3-2-4 2V2Z"/><path d="M14 2v5h5M9 11h7M9 15h7"/>',
      sleep: '<path d="M17 3a9.5 9.5 0 1 0 4 14A10 10 0 0 1 17 3Z"/>',
      nutrition: '<path d="M4 17C1 7 13 7 19 2c5 12-1 19-12 17M3 22c2-6 5-10 11-13"/>',
      skin: '<path d="M12 2S4 12 4 16a8 8 0 0 0 16 0c0-4-8-14-8-14Z"/>',
      scent: '<circle cx="12" cy="12" r="2"/><path d="M10 10C3 3 12-2 14 5c1 2 0 4-1 5M14 10c6-8 12 1 5 4-2 1-4 0-5-1M14 14c9 4 2 12-2 6-2-2-1-4-1-6M10 14c-1 10-11 6-6 0 1-2 4-2 6-2M10 11C0 14 0 3 6 6c2 1 3 3 4 5"/>',
      truck: '<path d="M2 5h12v13H2V5ZM14 10h4l4 5v3h-8"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/>',
      support: '<path d="M4 14v-3a8 8 0 0 1 16 0v7c0 3-3 4-6 4"/><rect x="2" y="11" width="4" height="8" rx="2"/><rect x="18" y="11" width="4" height="8" rx="2"/><path d="M11 22h3"/>',
    };
    return `<svg class="select-icon ${e(className)}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.next}</svg>`;
  };
  function selectHome() {
    const layout = state.selectHomeScene === "layout";
    const quantity = Math.max(0, Number(state.cartCount) || 0);
    return `<div class="select-home">
      <header class="select-home-header"><button class="select-home-back" data-action="previous" aria-label="返回">${selectIcon("back")}</button><h1>Halo Select</h1><div class="select-home-tools"><button data-action="go:SEL-04" aria-label="购物车${quantity ? `，${quantity} 件商品` : "，空"}"><span>${selectIcon("bag")}${quantity ? `<b class="select-cart-count">${quantity > 99 ? "99+" : quantity}</b>` : ""}</span><small>购物车</small></button><button data-action="go:SEL-10" aria-label="我的订单">${selectIcon("receipt")}<small>订单</small></button></div></header>
      ${layout ? `<button class="select-home-search" data-action="commercial:home-search" aria-label="搜索商品或系列">${selectIcon("search")}<span>搜索商品或系列</span></button>` : ""}
      <div class="select-home-content">
        ${layout ? `<section class="select-home-wear"><h2>AI 穿戴</h2><button class="select-home-product" data-action="commercial:product-open:ring" aria-label="了解 Halo Ring 产品"><img src="assets/select-ring-hero-v1.png" alt="瓷白 Halo Ring，内侧传感器与 HALO 标识" width="1484" height="1060"><span class="select-home-product-copy"><strong>Halo Ring</strong><span>认识日常睡眠与身体状态</span><span class="select-home-product-link">了解产品 ${selectIcon("next")}</span></span></button></section>` : `<section class="select-home-empty"><img src="assets/HALORING_super_symbol_copper.png" alt="" width="44" height="52"><h2>新品准备中</h2><p>上架后，你可以在这里查看商品。</p></section>`}
        <button class="select-home-help" data-action="commercial:select-help"><img src="assets/HALORING_super_symbol_copper.png" alt="" width="28" height="34"><span>选购有疑问，问 Halo</span>${selectIcon("next")}</button>
        ${layout ? `<section class="select-home-series"><div class="select-home-section-heading"><h2>日常精选</h2><button data-action="commercial:home-all">查看全部 ${selectIcon("next")}</button></div><div class="select-home-series-grid">${[["sleep", "睡眠", "睡前慢下来"], ["nutrition", "营养", "照顾日常"], ["skin", "肌肤", "日常护理"], ["scent", "嗅觉", "喜欢的气味"]].map(([key, label, copy]) => `<button data-action="commercial:category:${key}" aria-label="查看${label}系列">${selectIcon(key)}<span><strong>${label}</strong><small>${copy}</small></span></button>`).join("")}</div></section>` : ""}
        <section class="select-home-services"><h2>购物服务</h2><button data-action="commercial:select-delivery">${selectIcon("truck")}<span>配送与售后</span>${selectIcon("next")}</button><button data-action="go:HELP-03">${selectIcon("support")}<span>联系客服</span>${selectIcon("next")}</button></section>
      </div>
    </div>`;
  }
  const SELECT_HELP_TOPICS = {
    first: ["第一次买戒指，先了解什么？", "先看这款戒指支持哪些记录，再确认手机是否兼容、尺码是否合适。价格、发货时间和售后，以对应商品页为准。"],
    size: ["怎么选尺码？", "先确认准备戴在哪根手指，再核对这款戒指的尺码说明。拿不准的话，先让客服帮你确认，不用急着下单。"],
    service: ["配送和售后找谁？", "购买、配送和退换问题都可以联系 Halo。已经下单的，打开“我的订单”找到对应商品，再查看配送或申请售后。"],
  };
  let selectDialogTrigger = null;
  function closeSelectDialog() {
    const root = document.getElementById("modal-root");
    if (!root?.querySelector(".select-help-dialog")) return;
    root.innerHTML = "";
    document.getElementById("screen").inert = false;
    document.getElementById("tabbar").inert = false;
    if (selectDialogTrigger?.isConnected) selectDialogTrigger.focus({ preventScroll: true });
    selectDialogTrigger = null;
  }
  function showSelectDialog(topic = "") {
    const root = document.getElementById("modal-root");
    if (!root.querySelector(".select-help-dialog")) selectDialogTrigger = document.activeElement;
    const answer = SELECT_HELP_TOPICS[topic];
    const delivery = topic === "delivery";
    const title = delivery ? "配送与售后" : answer ? answer[0] : "选购帮助";
    const content = delivery ? `<p>发货时间以商品详情和订单页面为准。已下单的商品，可在“我的订单”查看配送或申请售后。</p><p>遇到问题，Halo 客服会帮你核对处理。</p>${actions([["查看我的订单", "commercial:select-help-orders", "primary"], ["联系客服", "commercial:select-help-support", "secondary"]])}` : answer ? `<p>${e(answer[1])}</p>${actions([["返回问题", "commercial:select-help", "primary"], ["联系客服", "commercial:select-help-support", "secondary"]])}` : `<p>你想先了解哪一项？</p><div class="select-help-questions">${Object.entries(SELECT_HELP_TOPICS).map(([id, row]) => `<button data-action="commercial:select-help:${id}"><span>${e(row[0])}</span>${selectIcon("next")}</button>`).join("")}</div>`;
    root.innerHTML = `<div class="modal-backdrop"><section class="modal select-help-dialog" role="dialog" aria-modal="true" aria-labelledby="select-help-title"><div class="select-help-title"><h2 id="select-help-title" tabindex="-1">${e(title)}</h2><button data-action="commercial:select-help-close" aria-label="关闭选购帮助">关闭</button></div>${content}</section></div>`;
    document.getElementById("screen").inert = true;
    document.getElementById("tabbar").inert = true;
    root.querySelector("#select-help-title").focus();
    root.querySelector(".select-help-dialog").addEventListener("keydown", event => {
      if (event.key === "Escape") { event.preventDefault(); closeSelectDialog(); return; }
      if (event.key !== "Tab") return;
      const buttons = [...root.querySelectorAll("button:not(:disabled)")];
      const first = buttons[0], last = buttons.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement.id === "select-help-title")) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });
  }
  const catalogCategoryLabel = () => SELECT_CATEGORIES.find(([key]) => key === state.category)?.[1] || "全部";
  const normalizeCatalogQuery = value => String(value).normalize("NFKC").toLowerCase().trim();
  function publicCatalogItems() {
    if (state.selectHomeScene === "empty") return [];
    // Only three simultaneous display-only fixtures in the display review scene.
    return state.catalogMode === "display" ? CATALOG_ITEMS.slice(0, 3) : CATALOG_ITEMS;
  }
  function catalogMatches(item, query) {
    const text = normalizeCatalogQuery(`${PRODUCTS[item.id].title} ${item.copy} ${item.keywords} ${SELECT_CATEGORIES.find(([key]) => key === item.category)?.[1]}`);
    return normalizeCatalogQuery(query).split(/\s+/).filter(Boolean).every(part => text.includes(part));
  }
  function catalogProductRow(item) {
    const product = PRODUCTS[item.id], display = product.displayOnly || state.catalogMode === "display";
    const status = display ? "展示 · 暂未开售" : item.id === "ring" || state.catalogMode === "presale" ? "预售" : "现货";
    return `<button class="select-catalog-product" type="button" data-action="commercial:product-open:${item.id}">
      <span class="select-catalog-visual">${item.id === "ring" ? '<img src="assets/select-ring-hero-v1.png" width="1484" height="1060" alt="瓷白 Halo Ring">' : selectIcon(item.icon)}</span>
      <span class="select-catalog-copy"><strong>${e(product.title)}</strong><span>${e(item.copy)}</span><span class="select-catalog-meta">${display ? "" : `<b>¥${product.price.toLocaleString("zh-CN")}</b>`}<small>${status}</small></span></span>${selectIcon("next")}
    </button>`;
  }
  function catalogResults() {
    if (state.catalogLoadState === "loading") return '<div class="select-catalog-empty" role="status"><span class="select-catalog-loader" aria-hidden="true"></span><h2>正在加载商品…</h2></div>';
    if (state.catalogLoadState === "failed") return `<div class="select-catalog-empty" role="alert">${selectIcon("bag")}<h2>商品暂时加载不出来</h2><p>请稍后再试，搜索条件已保留。</p><button type="button" class="primary" data-action="commercial:catalog-retry">重新加载</button><button type="button" class="text-button" data-action="go:SEL-01">返回 Select 首页</button></div>`;
    const all = publicCatalogItems();
    if (!all.length) return `<div class="select-catalog-empty">${selectIcon("bag")}<h2>新品准备中</h2><p>上架后，你可以在这里查看商品。</p><button type="button" class="primary" data-action="go:SEL-01">返回 Select 首页</button><button type="button" class="text-button" data-action="go:SEL-10">查看我的订单</button></div>`;
    const matches = all.filter(item => (state.category === "all" || item.category === state.category) && catalogMatches(item, state.catalogQuery));
    const count = `${state.category === "all" ? "全部商品" : catalogCategoryLabel()}${state.catalogQuery.trim() ? "搜索结果" : ""} · ${matches.length} 件`;
    return `<p class="select-catalog-count" role="status" aria-live="polite" aria-atomic="true">${e(count)}</p>${matches.length ? `<div class="select-catalog-list">${matches.map(catalogProductRow).join("")}</div><p class="select-catalog-end">${state.catalogQuery.trim() ? "已显示全部搜索结果" : "已显示全部商品"}</p>` : `<div class="select-catalog-empty">${selectIcon("search")}<h2>没有找到匹配商品</h2><p>${state.catalogQuery.trim() ? `“${e(state.catalogQuery.trim())}”${state.category === "all" ? "暂无搜索结果。" : `在${e(catalogCategoryLabel())}系列中没有匹配。`}` : "这个系列暂时没有可浏览的商品。"}</p>${state.category !== "all" ? '<button type="button" class="primary" data-action="commercial:catalog-search-all">搜索全部商品</button>' : ""}${state.catalogQuery ? '<button type="button" class="secondary" data-action="commercial:catalog-clear">清空搜索</button>' : ""}</div>`}`;
  }
  function syncCatalogResults() {
    const results = document.getElementById("select-catalog-results");
    if (results) results.innerHTML = catalogResults();
    const clear = document.getElementById("catalog-clear");
    if (clear) clear.hidden = !state.catalogQuery;
  }
  let catalogRetryTimer = null;
  function resumeCatalogRetry(ctx) {
    if (state.catalogLoadState !== "loading") return;
    clearTimeout(catalogRetryTimer);
    const remaining = Math.max(0, state.catalogRetryAt - Date.now());
    if (!remaining) { state.catalogLoadState = "ready"; persistCommercialState(); return; }
    catalogRetryTimer = setTimeout(() => {
      state.catalogLoadState = "ready"; state.catalogRetryAt = 0; persistCommercialState();
      if (document.getElementById("screen")?.dataset.page === "SEL-02") ctx.render?.();
    }, remaining);
  }
  function selectCatalog() {
    const all = publicCatalogItems();
    const categories = SELECT_CATEGORIES.filter(([key]) => key === "all" || all.some(item => item.category === key));
    if (!categories.some(([key]) => key === state.category)) { state.category = "all"; persistCommercialState(); }
    const quantity = Math.max(0, Number(state.cartCount) || 0);
    return `<div class="select-catalog">
      <header class="select-home-header select-catalog-header"><button class="select-home-back" type="button" data-action="previous" aria-label="返回">${selectIcon("back")}</button><h1>全部商品</h1><div class="select-home-tools"><button type="button" data-action="go:SEL-04" aria-label="购物车${quantity ? `，${quantity} 件商品` : "，空"}"><span>${selectIcon("bag")}${quantity ? `<b class="select-cart-count">${quantity > 99 ? "99+" : quantity}</b>` : ""}</span><small>购物车</small></button></div></header>
      ${all.length ? `<div class="select-catalog-search" role="search">${selectIcon("search")}<label class="sr-only" for="catalog-search">${state.category === "all" ? "搜索商品或系列" : `在${e(catalogCategoryLabel())}系列中搜索`}</label><input id="catalog-search" type="search" maxlength="80" placeholder="${state.category === "all" ? "搜索商品或系列" : `在${e(catalogCategoryLabel())}系列中搜索`}" value="${e(state.catalogQuery)}" autocomplete="off" enterkeyhint="search"><button id="catalog-clear" type="button" data-action="commercial:catalog-clear" aria-label="清空搜索" ${state.catalogQuery ? "" : "hidden"}>${selectIcon("close")}</button></div><div class="select-catalog-categories" role="group" aria-label="商品系列">${categories.map(([key, label]) => `<button type="button" aria-pressed="${state.category === key}" data-action="commercial:category:${key}">${label}</button>`).join("")}</div>` : ""}
      <section id="select-catalog-results" aria-label="商品结果">${catalogResults()}</section>
    </div>`;
  }
  function selectDetail() {
    const product = selectedProduct(), line = selectionLine(), sku = PRODUCT_SKUS[line.skuId];
    const displayOnly = !isProductOpen(product), ring = product.id === "ring";
    const selected = sku ? `${sku.specification} · ${line.quantity} 件` : "选择颜色、尺码";
    const detailDisclosure = (title, body) => `<details class="select-detail-disclosure"><summary>${title}${selectIcon("next")}</summary><div>${body}</div></details>`;
    const body = ring ? "认识日常睡眠与身体状态。" : CATALOG_ITEMS.find(item => item.id === product.id)?.copy || "";
    return `<div class="select-detail" data-product-id="${e(product.id)}">
      <header class="select-home-header select-detail-header"><button type="button" class="select-home-back" data-action="previous" aria-label="返回">${selectIcon("back")}</button><h1>商品详情</h1><div class="select-home-tools"><button type="button" data-action="go:SEL-04" aria-label="购物车，${state.cartCount} 件商品"><span>${selectIcon("bag")}${state.cartCount ? `<b class="select-cart-count">${state.cartCount}</b>` : ""}</span></button></div></header>
      <div class="select-detail-scroll">
        ${ring ? window.HALO_SELECT_GALLERY.hero() : `<div class="select-detail-series" aria-label="${e(product.title)}，商品图片待补充">${selectIcon(CATALOG_ITEMS.find(item => item.id === product.id)?.icon || "sleep")}<span>商品图片准备中</span></div>`}
        <section class="select-detail-info"><h2>${e(product.title)}</h2><p>${e(body)}</p><div class="select-detail-price">${displayOnly ? `<span>暂未开售</span>` : `<strong>¥${product.price.toLocaleString()}</strong><span>${ring || state.catalogMode === "presale" ? "预售" : "现货"}</span>`}</div></section>
        <div class="select-detail-sections">
          ${displayOnly ? "" : `<button type="button" class="select-detail-selection" data-action="commercial:sku-open"><span>${e(selected)}</span>${selectIcon("next")}</button>`}
          ${ring ? window.HALO_SELECT_GALLERY.details() : detailDisclosure("产品与材质", `<p>${e(product.specification)}</p><p>完整材质与使用说明将在开售时公布。</p>`)}
          ${ring ? detailDisclosure("尺码与手机适配", "<p>可选 6–11 号。各尺码对应的内径正在补充，请勿直接套用其他品牌的尺码。</p><p>需配合 Halo App 使用，支持的手机型号和最低系统版本将在开售时公布。</p><button class=\"select-detail-text-button\" data-action=\"commercial:detail-support\">请客服帮我确认</button>") : ""}
          ${detailDisclosure("配送与售后", `${!displayOnly ? `<dl><div><dt>商品总价</dt><dd>¥${product.price.toLocaleString()}</dd></div><div><dt>支付方式</dt><dd>全款支付</dd></div></dl>` : ""}<p>发货时间与退换条件，以开售时公布为准。购买、配送或退换遇到问题，都可以联系 Halo 客服。</p><button class="select-detail-text-button" data-action="commercial:detail-support">联系 Halo 客服</button>`)}
          <p class="select-detail-footnote">${displayOnly ? "可以先了解商品，开售后再决定。" : "发货时间与退换条件，以开售时公布为准。"}</p>
        </div>
      </div>
      <footer class="select-detail-actions">${displayOnly ? `<button class="primary" data-action="go:SEL-02">继续浏览</button>` : `<button class="secondary" data-action="commercial:add-cart">加入购物车</button><button class="primary" data-action="commercial:buy-now">立即购买</button>`}</footer>
    </div>`;
  }
  let skuIntent = "select", skuTrigger = null;
  function closeSkuSheet({ pop = true } = {}) {
    const editingCart = cartEditActive(), editingCheckout = checkoutEditActive();
    document.querySelector(".select-sku-overlay")?.remove();
    document.querySelectorAll(".select-detail > [inert], .select-cart > [inert], .select-checkout > [inert]").forEach(node => { node.inert = false; });
    const label = document.querySelector(".select-detail-selection > span");
    if (label) { const line = selectionLine(), sku = PRODUCT_SKUS[line.skuId]; label.textContent = sku ? `${sku.specification} · ${line.quantity} 件` : "选择颜色、尺码"; }
    if (skuTrigger?.isConnected) skuTrigger.focus({ preventScroll: true });
    skuTrigger = null;
    if (editingCart) {
      state.cartSkuEdit = null; persistCommercialState();
      if (pop && history.state?.cartSkuModal) history.back();
    }
    if (editingCheckout) {
      state.checkoutSkuEdit = null; persistCommercialState();
      if (pop && history.state?.checkoutSkuModal) history.back();
    }
  }
  function renderSkuSheet(intent = skuIntent) {
    const surface = document.querySelector(checkoutEditActive() ? ".select-checkout" : cartEditActive() ? ".select-cart" : ".select-detail");
    if (!surface) return;
    window.HALO_SELECT_GALLERY?.close();
    const old = surface.querySelector(".select-sku-overlay");
    const focusAction = old?.contains(document.activeElement) ? document.activeElement.dataset.action : "";
    const previousScroll = old?.querySelector(".select-sku-body")?.scrollTop ?? rowEdit()?.top ?? 0;
    const helpOpen = old?.querySelector("details")?.open ?? rowEdit()?.helpOpen;
    if (!old) skuTrigger = rowEdit() ? [...surface.querySelectorAll('[data-action]')].find(node => node.dataset.action === `commercial:${checkoutEditActive() ? "checkout" : "cart"}-spec:${rowEdit().key}`) : document.activeElement;
    skuIntent = intent;
    const product = selectedProduct(), draft = productSelection(), line = selectionLine(), sku = PRODUCT_SKUS[line.skuId];
    const problem = lineProblem(line, editOrderId()) || cartEditProblem(line), available = cartSkuLimit(line.skuId);
    const mergeTarget = rowEdit() ? editRows().find(row => shoppingKey(row) !== rowEdit().key && row.skuId === line.skuId) : null;
    const confirmationHint = mergeTarget ? `保存后与${checkoutEditActive() ? "本单" : "车内"}同规格合并，共 ${mergeTarget.quantity + line.quantity} 件` : `已选 ${draft.quantity} 件 · 商品合计 ¥${(draft.quantity * product.price).toLocaleString()}`;
    const closeIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
    const buttonText = intent === "buy-now" ? "确认并购买" : intent === "add-cart" ? "确认加入购物车" : "确认规格";
    const html = `<section class="select-sku-sheet" role="dialog" aria-modal="true" aria-labelledby="select-sku-title"><header><h2 id="select-sku-title" tabindex="-1">选择规格</h2><button data-action="commercial:sku-close" aria-label="关闭规格选择">${closeIcon}</button></header><div class="select-sku-body"><strong class="select-sku-price">¥${product.price.toLocaleString()}</strong><p class="select-sku-selected" aria-live="polite">${e(sku?.specification || "请选择颜色和尺码")}</p>
      ${product.id === "ring" ? `<fieldset><legend>颜色</legend><div class="select-sku-colors">${RING_COLORS.map(([id,label,color]) => `<button type="button" data-action="commercial:sku-color:${id}" aria-pressed="${draft.color === id}"><i style="background:${color}" aria-hidden="true"></i><span>${label}</span>${draft.color === id ? '<b aria-hidden="true">✓</b>' : ""}</button>`).join("")}</div></fieldset><fieldset><legend>尺码</legend><div class="select-sku-sizes">${RING_SIZES.map(size => {
        const unavailable = draft.color && !cartSkuLimit(`ring-${draft.color}-${size}`);
        return `<button type="button" data-action="commercial:sku-size:${size}" aria-pressed="${draft.size === size}" ${unavailable ? 'disabled' : ''} aria-label="${size} 号${unavailable ? '，暂时缺货' : ''}">${size}${unavailable ? '<small>缺货</small>' : ''}</button>`;
      }).join("")}</div></fieldset><details class="select-sku-help" ${helpOpen ? "open" : ""}><summary>不知道选几号？</summary><p>尺码内径对照正在补充。先确认准备佩戴的手指，不要直接套用其他品牌的尺码。</p><button class="select-detail-text-button" data-action="commercial:detail-support">请客服帮我确认</button></details>` : `<p>${e(product.specification)}</p>`}
      <div class="select-sku-quantity"><span>数量</span><div><button data-action="commercial:sku-dec" aria-label="减少购买数量" ${draft.quantity <= 1 ? "disabled" : ""}>−</button><b>${draft.quantity}</b><button data-action="commercial:sku-inc" aria-label="增加购买数量" ${!sku || draft.quantity >= available ? "disabled" : ""}>＋</button></div></div></div><footer><p id="select-sku-hint" class="${problem ? "invalid" : ""}" role="status">${e(problem || confirmationHint)}</p><button class="primary" data-action="commercial:${intent === "select" ? "sku-save" : "sku-confirm"}" ${problem ? "disabled" : ""} aria-describedby="select-sku-hint">${buttonText}</button></footer></section>`;
    const overlay = old || document.createElement("div"); overlay.className = "select-sku-overlay"; overlay.innerHTML = html;
    if (!old) surface.append(overlay);
    [...surface.children].filter(child => child !== overlay).forEach(child => { child.inert = true; });
    overlay.querySelector(".select-sku-body").scrollTop = previousScroll;
    if (rowEdit()) {
      overlay.querySelector(".select-sku-body").onscroll = event => { if (rowEdit()) { rowEdit().top = event.target.scrollTop; persistCommercialState(); } };
      const help = overlay.querySelector("details");
      if (help) help.ontoggle = () => { if (rowEdit()) { rowEdit().helpOpen = help.open; persistCommercialState(); } };
    }
    const focusTarget = [...overlay.querySelectorAll("button:not(:disabled)")].find(node => node.dataset.action === focusAction);
    (focusTarget || overlay.querySelector("#select-sku-title")).focus({ preventScroll: true });
    overlay.onkeydown = event => {
      if (["Escape", "Tab", "ArrowLeft", "ArrowRight"].includes(event.key)) event.stopPropagation();
      if (event.key === "Escape") { event.preventDefault(); closeSkuSheet(); return; }
      if (event.key !== "Tab") return;
      const targets = [...overlay.querySelectorAll("button:not(:disabled), summary")].filter(node => node.getClientRects().length && (!node.closest('details:not([open])') || node.tagName === "SUMMARY"));
      const first = targets[0], last = targets.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement.id === "select-sku-title")) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    overlay.onclick = event => { if (event.target === overlay) closeSkuSheet(); };
  }
  function refreshProduct(ctx) {
    const scrollTop = document.querySelector(".select-detail-scroll")?.scrollTop || 0;
    closeSkuSheet(); ctx.render();
    const scroll = document.querySelector(".select-detail-scroll"); if (scroll) scroll.scrollTop = scrollTop;
  }
  function cartView(item) {
    syncCartBadge(); syncCartSelection();
    const selected = selectedCartLines(), eligible = state.cartLines.filter(line => !lineProblem(line));
    const count = selected.reduce((sum, line) => sum + line.quantity, 0);
    const amount = selected.reduce((sum, line) => sum + PRODUCTS[line.productId].price * line.quantity, 0);
    const removed = state.cartUndo, removedLine = removed?.line || removed;
    const undo = removedLine && PRODUCTS[removedLine.productId] ? `<div class="select-cart-undo" role="status"><span>已移除：${e(PRODUCTS[removedLine.productId].title)} · ${e(PRODUCT_SKUS[removedLine.skuId]?.specification || "待选规格")} × ${removedLine.quantity}</span><button type="button" data-action="commercial:cart-undo">撤销</button></div>` : "";
    const empty = `<div class="select-cart-empty"><h2>购物车还是空的</h2><p>去看看有没有喜欢的商品。</p><button class="primary" data-action="go:SEL-01">继续选购</button></div>`;
    return `<div class="select-cart"><header class="select-cart-header"><button type="button" class="select-cart-back" data-action="previous" aria-label="返回上一页">${selectIcon("back")}</button><h1>购物车</h1><button type="button" class="select-cart-browse" data-action="go:SEL-01">继续选购</button></header><div class="select-cart-scroll">${!state.cartLines.length ? empty : `<div class="select-cart-list">${state.cartLines.map(line => {
      const product = PRODUCTS[line.productId], key = shoppingKey(line), problem = lineProblem(line);
      const spec = PRODUCT_SKUS[line.skuId]?.specification || "选择颜色、尺码";
      return `<article class="select-cart-line" data-cart-line="${e(key)}" data-unavailable="${Boolean(problem)}"><div class="select-cart-product"><label class="select-cart-check"><input type="checkbox" data-action="commercial:cart-toggle:${e(key)}" ${state.cartSelection[key] ? "checked" : ""} ${problem ? `disabled aria-describedby="cart-problem-${e(key)}"` : ""}><span class="sr-only">选择 ${e(product.title)}，${e(spec)}</span></label><button type="button" class="select-cart-photo" data-action="commercial:cart-product:${e(key)}" aria-label="查看${e(product.title)}详情">${product.id === "ring" ? `<img class="shopping-photo" src="assets/select-ring-hero-v1.png" alt="瓷白戒指图示"><small>图示：瓷白</small>` : `<span class="product-visual visual-${e(product.visual)}" aria-hidden="true"><i></i></span>`}</button><div class="select-cart-copy"><button type="button" class="select-cart-title" data-action="commercial:cart-product:${e(key)}">${e(product.title)}</button><button type="button" class="select-cart-spec" data-action="commercial:cart-spec:${e(key)}" aria-label="修改${e(product.title)}规格，${e(spec)}"><span>${e(spec)}</span>${selectIcon("next")}</button><strong class="select-cart-price">¥${product.price.toLocaleString()}</strong>${problem ? `<p class="select-cart-problem" id="cart-problem-${e(key)}">${e(problem)}</p>` : ""}</div></div><div class="select-cart-line-actions"><button type="button" class="select-cart-remove" data-action="commercial:cart-remove:${e(key)}" aria-label="移除${e(product.title)}，${e(spec)}">移除</button><div class="select-cart-quantity" aria-label="${e(spec)}数量"><button type="button" data-action="commercial:cart-dec:${e(key)}" aria-label="减少数量" ${line.quantity <= 1 ? "disabled" : ""}>−</button><span>${line.quantity}</span><button type="button" data-action="commercial:cart-inc:${e(key)}" aria-label="增加数量" ${problem || line.quantity >= skuAvailable(line.skuId) ? "disabled" : ""}>＋</button></div></div></article>`;
    }).join("")}</div>`}</div>${undo}${state.cartLines.length ? `${!count ? `<p class="select-cart-footer-hint" role="status">${eligible.length ? "请勾选要购买的商品" : "暂时没有可结算的商品，可修改规格后再试"}</p>` : ""}<footer class="select-cart-footer"><label class="select-cart-check select-cart-all"><input type="checkbox" data-action="commercial:cart-toggle-all" ${eligible.length && selected.length === eligible.length ? "checked" : ""} ${!eligible.length ? "disabled" : ""}><span>全选</span></label><div class="select-cart-total" aria-live="polite"><small>商品金额</small><strong>¥${amount.toLocaleString()}</strong><small>优惠以结算页为准</small></div><button type="button" class="primary select-cart-checkout" data-action="commercial:cart-checkout" ${!count ? "disabled" : ""}>去结算（${count}）</button></footer>` : ""}</div>`;
  }
  function captureCartView() {
    const scroll = document.querySelector(".select-cart-scroll");
    if (scroll) state.cartViewTop = scroll.scrollTop;
  }
  function mountCartView() {
    const cart = document.querySelector('.select-cart');
    if (!cart || document.getElementById("screen")?.dataset.page !== "SEL-04") return;
    const scroll = cart.querySelector(".select-cart-scroll");
    scroll.scrollTop = state.cartViewTop;
    scroll.onscroll = () => { state.cartViewTop = scroll.scrollTop; persistCommercialState(); };
    const all = cart.querySelector('.select-cart-all input'), selected = selectedCartLines();
    if (all) all.indeterminate = selected.length > 0 && selected.length < state.cartLines.filter(line => !lineProblem(line)).length;
    cart.onkeydown = event => { if (["ArrowLeft", "ArrowRight"].includes(event.key)) event.stopPropagation(); };
    if (state.cartSkuEdit) {
      if (!history.state?.cartSkuModal) history.pushState({ ...history.state, cartSkuModal: true }, "", location.href);
      renderSkuSheet("select");
    }
    persistCommercialState();
  }
  function checkoutCanEdit() {
    const order = state.orders.find(row => row.id === (state.checkoutDraftOrderId || state.checkoutReconfirmId));
    return !order || order.status === "pending-payment";
  }
  function captureCheckoutView() {
    const scroll = document.querySelector('.select-checkout-scroll');
    if (scroll) state.checkoutViewTop = scroll.scrollTop;
  }
  function mountCheckoutView() {
    const root = document.querySelector('.select-checkout');
    if (!root || document.getElementById("screen")?.dataset.page !== "SEL-05") return;
    const scroll = root.querySelector('.select-checkout-scroll');
    scroll.scrollTop = state.checkoutViewTop;
    scroll.onscroll = () => { state.checkoutViewTop = scroll.scrollTop; persistCommercialState(); };
    const details = root.querySelector('.select-checkout-more');
    if (details) details.ontoggle = () => { state.checkoutDetailsOpen = details.open; persistCommercialState(); };
    root.onkeydown = event => { if (["ArrowLeft", "ArrowRight"].includes(event.key)) event.stopPropagation(); };
    if (state.checkoutSkuEdit && checkoutCanEdit()) {
      if (!history.state?.checkoutSkuModal) history.pushState({ ...history.state, checkoutSkuModal: true }, "", location.href);
      renderSkuSheet("select");
    }
  }
  function couponDraftKey() {
    return JSON.stringify({ lines: state.checkoutLines, orderId: state.checkoutDraftOrderId || state.checkoutReconfirmId || null });
  }
  function ensureCouponDraft() {
    const key = couponDraftKey(), eligible = checkoutCoupon();
    if (!state.couponSelectionDraft || state.couponSelectionDraft.key !== key) {
      state.couponSelectionDraft = { key, selectedId: state.couponSelected && eligible.available ? "member" : null, baselineSelected: state.couponSelected, notice: "", top: 0, details: {} };
    }
    const draft = state.couponSelectionDraft;
    if (draft.selectedId === "member" && !eligible.available) {
      draft.selectedId = null;
      draft.notice = `${eligible.reason}，请重新确认选择。`;
    }
    if (![null, "member"].includes(draft.selectedId)) draft.selectedId = null;
    return draft;
  }
  function couponView() {
    const draft = ensureCouponDraft(), eligible = checkoutCoupon();
    const locked = state.orders.find(row => row.id === (state.checkoutDraftOrderId || state.checkoutReconfirmId) && row.status !== "pending-payment");
    const usedOrder = state.orders.find(row => row.id === state.couponUsedOrderId);
    const member = { id: "member", title: MEMBER_COUPON.title, amount: 20, condition: "商品满 ¥300 可用", expiry: "有效至 2026.09.30 23:59（北京时间）", ...eligible,
      status: state.couponUsedOrderId ? "used" : eligible.status, available: !state.couponUsedOrderId && eligible.available,
      reason: state.couponUsedOrderId ? "已使用" : eligible.reason,
      rules: ["商品金额满 ¥300 减 ¥20，运费不计入门槛。", "本单限用一张，可同时使用 Halo Points 抵扣。", "2026 年 10 月 1 日 00:00 起不可使用（北京时间）。"], orderId: usedOrder?.id || null };
    const presale = { id: "presale", title: "预售专用券", amount: 40, condition: "指定预售商品满 ¥500 可用", expiry: "", available: false, status: "unavailable", reason: "适用商品尚未公布",
      rules: ["仅限活动指定的预售商品；适用商品与有效期以活动公布为准。", "当前不能用于本单。"], orderId: null };
    persistCommercialState();
    const items = [...(state.ownedCouponIds.includes(MEMBER_COUPON.id) ? [member] : []), ...(state.ownedCouponIds.includes("presale") ? [presale] : [])];
    return window.HALO_SELECT_COUPON_VIEW.render({ e, icon: selectIcon, money: formatMoney, empty: !state.checkoutLines.length, locked: Boolean(locked), lockedOrderId: locked?.id || "", lockedText: locked?.status === "paid" ? "这笔订单已付款，优惠已确认。" : "这笔订单正在支付，请先查看支付结果。", items, draftId: draft.selectedId, discount: draft.selectedId === "member" && member.available ? eligible.discountCents / 100 : 0, notice: draft.notice });
  }
  let couponExpiryTimer = null;
  function observeCouponPage(item, ctx) {
    clearTimeout(couponExpiryTimer);
    if (item.id !== "SEL-06" && state.couponSelectionDraft) { state.couponSelectionDraft = null; persistCommercialState(); }
    if (!["SEL-05", "SEL-06", "SEL-09"].includes(item.id)) return;
    if (item.id === "SEL-05" && state.couponSelected && !checkoutCoupon().available && state.checkoutSeenQuote) {
      try {
        if (JSON.parse(state.checkoutSeenQuote).totals?.coupon > 0) {
          state.checkoutQuoteChanged = true;
          state.checkoutNotice = `${checkoutCoupon().reason}，请核对更新后的金额。`;
        }
      } catch { /* Old quote formats are checked again by submit-order. */ }
    }
    const remaining = Date.parse(MEMBER_COUPON.expiresAt) - Date.now();
    if (remaining > 0) couponExpiryTimer = setTimeout(() => {
      if (document.getElementById("screen")?.dataset.page === item.id) ctx.render();
    }, Math.min(Math.max(remaining, 1000), 2147483647));
    if (item.id === "SEL-06") queueMicrotask(() => {
      const root = document.querySelector('.select-coupon');
      if (!root) return;
      const draft = state.couponSelectionDraft, scroll = root.querySelector('.select-coupon-scroll');
      if (scroll && draft) { scroll.scrollTop = draft.top || 0; scroll.onscroll = () => { draft.top = scroll.scrollTop; persistCommercialState(); }; }
      root.querySelectorAll('details').forEach(detail => {
        const key = detail.dataset.couponRule || "unavailable";
        if (draft?.details?.[key]) detail.open = true;
        detail.ontoggle = () => { if (draft) { (draft.details ||= {})[key] = detail.open; persistCommercialState(); } };
      });
      root.onkeydown = event => { if (["ArrowLeft", "ArrowRight"].includes(event.key)) event.stopPropagation(); };
    });
  }
  function checkoutView() {
    const order = state.orders.find(row => row.id === state.checkoutDraftOrderId);
    const locked = order && order.status !== "pending-payment" ? { title: order.status === "paid" ? "这笔订单已付款" : "这笔订单正在处理", body: "金额已经确认，无需再次提交。", amount: order.payable, id: order.id } : null;
    if (order && !locked) state.checkoutReconfirmId = order.id;
    if (locked) state.checkoutSkuEdit = null;
    const totals = money(), address = checkoutAddress();
    if (!totals.maxPointsCount) state.pointsUsed = false;
    state.checkoutSeenQuote = checkoutQuoteKey();
    const vm = {
      e, icon: selectIcon, money: formatMoney, address, addressProblem: address ? "" : "请选择收货地址",
      lines: state.checkoutLines.map(line => ({ ...shoppingLineSnapshot(line), key: shoppingKey(line), visual: PRODUCTS[line.productId].visual, problem: lineProblem(line, state.checkoutReconfirmId || state.checkoutDraftOrderId) })),
      totals, pointsEnabled: Boolean(totals.pointsCount), pointsReason: state.pendingPointsCorrection > 0 ? "积分暂不可用，不影响其他支付" : availablePoints() === 0 ? "暂无可用积分" : state.redemptionStatus === "processing" ? "部分积分正在兑换中" : "本次不使用积分",
      delivery: state.checkoutDelivery || { status: "unknown", simulated: true, shipping: "发货时间待确认" }, problem: checkoutProblem(), notice: state.checkoutNotice,
      quoteChanged: Boolean(state.checkoutQuoteChanged || state.checkoutReconfirmId), detailsOpen: state.checkoutDetailsOpen, locked
    };
    persistCommercialState();
    return window.HALO_SELECT_CHECKOUT_VIEW.render(vm);
  }
  const paymentAmount = amount => typeof amount === "number" && Number.isFinite(amount) && amount >= 0 ? `¥${amount.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "";
  function paymentIssue(order) {
    if (state.catalogMode === "display" || state.selectHomeScene === "empty") return "商品暂未开放购买";
    return orderStockProblem(order) || orderCouponProblem(order) || (!paymentPointsAvailable(order) ? "可用积分有变化" : "");
  }
  function paymentView() {
    const order = state.orders.find(row => row.id === state.orderSnapshot?.id);
    const show = overrides => window.HALO_SELECT_PAYMENT_VIEW.render({ e, icon: selectIcon, backAction: "go:SEL-10", ...overrides });
    if (!order) return show({ mode: "empty", title: "支付订单", message: "还没有待支付订单，请先确认商品和收货信息。", primary: { label: "查看购物车", action: "go:SEL-04" }, secondary: { label: "查看订单", action: "go:SEL-10" } });
    const amount = paymentAmount(order.payable), afterSale = orderAfterSale(order);
    const items = order.lines?.length ? order.lines.map(line => ({ title: line.title, specification: line.specification, quantity: line.quantity })) : [{ title: order.title, specification: "", quantity: order.quantity }];
    const viewOrder = { label: "查看此订单", action: `commercial:open-order:${order.id}` };
    const base = { orderId: order.id, amount, amountLabel: "应付金额", shippingLabel: afterSale ? "售后进度" : "配送说明", items, notice: paymentNotices[order.id] || "", primary: viewOrder, secondary: { label: "返回 Halo Select", action: "go:SEL-01" } };
    if (order.status === "paid") {
      const paidAt = Number.isFinite(Date.parse(order.paidAt)) ? new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(order.paidAt)) : "";
      return show({ ...base, mode: "paid", title: "支付成功", message: afterSale ? "这是原支付记录，售后进度请查看订单。" : "付款已完成，订单已保留。", amountLabel: afterSale ? "原实付金额" : "实付金额", paidAt, shipping: afterSale ? afterSaleLabel(afterSale) : order.deliverySnapshot?.shipping || order.shipping || "发货时间待确认" });
    }
    if (order.status === "processing") return show({ ...base, mode: "processing", title: "支付确认中", message: "正在确认结果，请勿重复付款。离开后可从订单继续查看。", amountLabel: "本次支付金额", primary: paymentNotices[order.id] ? { label: "重新查询结果", action: "commercial:payment-refresh" } : viewOrder, secondary: { label: "返回订单列表", action: "go:SEL-10" } });
    if (order.status !== "pending-payment" || !amount) return show({ ...base, mode: "unknown", title: "查看支付状态", message: "暂时无法确认这笔订单的支付信息，请查看原订单。" });
    const issue = paymentIssue(order);
    if (issue) return show({ ...base, mode: "blocked", title: "请重新确认订单", message: `${issue}。请核对商品与金额后继续，本次未付款。`, amountLabel: "原待付金额", primary: { label: "重新确认商品与金额", action: "commercial:reconfirm-order" }, secondary: viewOrder });
    if (state.redemptionStatus === "processing") return show({ ...base, mode: "blocked", title: "请稍后再支付", message: "积分兑换正在确认，请稍后查看这笔订单。", secondary: { label: "刷新状态", action: "commercial:payment-refresh" } });
    const failed = order.paymentResult === "failed", deferred = order.paymentResult === "deferred";
    return show({ ...base, mode: failed ? "failed" : deferred ? "deferred" : "ready", title: failed ? "支付未完成" : deferred ? "已暂缓支付" : "支付订单", message: failed ? "本次模拟支付未成功，订单已保留，可以重试。" : deferred ? "还未付款，需要时可继续这笔订单。" : "核对应付金额后继续。", primary: { label: `${failed ? "重新" : deferred ? "继续" : "确认"}模拟支付 ${amount}`, action: "commercial:payment-confirm" }, secondary: { label: "稍后支付", action: "commercial:payment-cancel" } });
  }
  function select(item) {
    if (item.id === "SEL-01") return selectHome();
    if (item.id === "SEL-02") return selectCatalog();
    if (item.id === "SEL-03") return selectDetail();
    if (item.id === "SEL-04") return cartView(item);
    if (item.id === "SEL-05") return checkoutView();
    if (item.id === "SEL-09") return paymentView();
    if (item.id === "SEL-10") return ordersPage.render();
    if (item.id === "SEL-11") return orderDetailPage.render();
    if (item.id === "SEL-12") return afterSalePage.render();
    if (item.id === "SEL-13") return afterSaleProgress.render();
    const m = money();
    const pages = {

      "SEL-06": () => couponView(),
      "SEL-07": () => addressPage.render(),
    };
    return pages[item.id]?.() || "";
  }

  function orderCard(id, status, title, body, amount, action, tone = "") {
    return `<button class="order-card ${e(tone)}" data-action="${e(action)}"><span><small>${e(status)}</small><strong>${e(title)}</strong><p>${e(body)}</p></span><span><b>${e(amount)}</b><i aria-hidden="true">›</i></span></button>`;
  }

  function sectionFailure(title, body) {
    return `<section class="result-card failure"><span aria-hidden="true">!</span><h2>${e(title)}</h2><p>${e(body)}</p></section>`;
  }

  function channelJoinNext() {
    const identity = state.channelIdentity, status = state.applicationStatus;
    const next = (stage, title, detail, label, route) => ({ stage, title, detail, label, route });
    if (identity === "active") return next("active", "体验顾问身份已生效", "查看服务订单、收益和推广工具。", "进入经营中心", "CHN-19");
    if (identity === "paused") return next("paused", "经营已暂停", "历史订单与结算仍可查看；需要帮助可联系客服。", "查看历史结算", "CHN-22");
    if (identity === "terminated") return next("terminated", "体验顾问合作已结束", "历史结算与待处理事项仍保留。", "查看历史结算", "CHN-22");
    if (identity === "activation-pending") return next("activation-pending", "开通资料已提交", "正在确认身份生效，请查看当前进度。", "查看开通进度", "CHN-16");
    if (identity === "approved" || status === "approved") return next("approved", "申请已通过", "下一步完成协议与收款资料。", "继续开通", "CHN-15");
    if (identity === "needs-info" || status === "needs-info") return next("needs-info", "申请需要补充资料", "查看需要补充的内容，再继续提交。", "补充申请资料", "CHN-12");
    if (identity === "rejected" || status === "rejected") return next("rejected", "本次申请未通过", "可查看原因并申请复核。", "查看审核结果", "CHN-13");
    if (status === "withdrawn") return next("withdrawn", "本次申请已撤回", "原申请记录保留，重新申请前可先查看。", "查看申请记录", "CHN-11");
    if (status === "reviewing") return next("reviewing", "申请正在审核", "资料已提交，可以查看审核进度。", "查看审核进度", "CHN-11");
    if (state.applicationSnapshot && status === "training") {
      const completed = completedCourseIds().length;
      if (completed < COURSES.length) return next("training", "还有必修学习未完成", `已完成 ${completed} / ${COURSES.length} 门课程，学习记录已保留。`, "继续学习", "CHN-08");
      return next("assessment", state.assessmentPassed ? "测评已通过，尚未提交审核" : "必修学习已完成", state.assessmentPassed ? "确认后提交审核，等待申请结果。" : "完成测评后即可提交审核。", state.assessmentPassed ? "继续提交审核" : "继续测评", "CHN-10");
    }
    const verification = identityRecord();
    if (verification?.status === "failed") return next("identity-processing", "本次身份核验未通过", "查看原因与处理方法，再继续申请。", "查看核验结果", "CHN-03");
    if (verification?.status === "expired") return next("identity-processing", "本次身份核验已过期", "请重新核验身份，已有申请资料保留。", "查看核验结果", "CHN-03");
    if (verification?.status === "manual-review") return next("identity-processing", "本人身份正在人工复核", "无需重复提交，可以先查看本次进度。", "查看核验进度", "CHN-03");
    if (state.identityProcessing) return next("identity-processing", "本人身份正在核验", "核验完成后继续填写申请资料。", "查看核验进度", "CHN-03");
    if (hasPassedChannelIdentity()) return next("draft", "本人身份已确认", "继续填写申请资料，已填内容会保留。", "继续申请", "CHN-06");
    if (verification) return next("identity-processing", "确认本次核验结果", "查看最新进度，再继续本次申请。", "查看核验进度", "CHN-03");
    if (state.applicationSnapshot) return next("application", "已有申请记录", "先查看本次申请，再继续未完成的步骤。", "查看申请进度", "CHN-11");
    if (state.applicationDraftSaved || status === "draft") return next("draft", "申请草稿已保留", "先确认本次申请身份，再继续填写。", "继续申请", "CHN-02");
    return next("new", "", "", "开始申请", "CHN-02");
  }

  function applicationDetailNext() {
    const next = channelJoinNext();
    if (state.applicationSnapshot && ["new", "draft", "identity-processing", "application"].includes(next.stage)) return { stage: "unknown", title: "申请状态待确认", detail: "已提交的资料仍保留，请联系客服核对当前进度。", label: "联系客服核对", route: "HELP-03" };
    if (!state.applicationSnapshot && ["new", "draft", "identity-processing"].includes(next.stage) && (!["none", "draft", undefined, null].includes(state.applicationStatus) || !["inactive", undefined, null].includes(state.channelIdentity))) return { stage: "unknown", title: "申请记录待核对", detail: "暂未找到原申请资料，请联系客服协助核对。", label: "联系客服核对", route: "HELP-03" };
    if (!state.applicationSnapshot && ["new", "draft", "identity-processing"].includes(next.stage)) {
      const request = state.applicationFlow?.request;
      if (request?.status === "pending") return { stage: "submitting", title: "申请资料正在提交", detail: "提交完成后，资料会显示在这里。", label: "查看提交进度", route: "CHN-06" };
      const hasDraft = Object.values(state.applicationDraft || {}).some(value => String(value || "").trim());
      return { ...next, title: hasDraft ? "申请尚未提交" : "还没有申请资料", detail: next.stage === "identity-processing" ? next.detail : hasDraft ? "已填写的内容仍在草稿中，可继续完成申请。" : "完成身份核验并提交申请后，可在这里查看资料。", label: next.stage === "identity-processing" ? next.label : hasDraft ? "继续申请" : "开始申请" };
    }
    return next;
  }
  function applicationRecordValue(value) {
    return typeof value === "string" && value.trim() ? value.trim() : "未记录";
  }
  function applicationRecordTime(value) {
    const text = applicationRecordValue(value);
    if (/^\d{4}-\d{2}-\d{2}T/.test(text)) {
      const date = new Date(text);
      return Number.isFinite(date.getTime()) ? date.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false }) : "未记录";
    }
    return text;
  }
  function applicationDetailPage(item) {
    const historicalId = history.state?.channelHistoryOwner === channelStore.owner() ? history.state.channelHistoricalId : "";
    if (historicalId) {
      const record = state.applicationHistory.find(row => row.id === historicalId && row.ownerAccount === channelStore.owner());
      return shell(item, "体验顾问 · 历史申请", record ? `${feedback("历史申请 · 只读", "查看旧记录不会改变当前申请。", "plain")}${summary([["申请编号", record.id], ["服务地区", record.region || "未记录"], ["相关经验", record.experience || "未记录"], ["收款身份", record.payeeType || "未记录"], ["申请结果", ({ withdrawn: "已撤回", rejected: "未通过", approved: "已通过" })[record.status] || "已归档"], ["提交时间", applicationRecordTime(record.submittedAt)], ["已完成课程", `${record.training?.completedCourses?.length || 0} / 3`]])}${record.withdrawal?.withdrawnAt ? `<p>撤回时间：${e(applicationRecordTime(record.withdrawal.withdrawnAt))}</p>` : ""}${record.reviewDecision ? `<p>审核说明：${record.reviewDecision.reasonCode === "region-unavailable" ? "所选服务地区暂未开放" : "请按原审核记录联系客服核对"}</p>` : ""}${actions([["返回申请进度", "go:CHN-11", "primary"]])}` : `${feedback("未找到这条历史申请", "请返回历史列表重新选择。", "plain")}${actions([["返回申请进度", "go:CHN-11", "primary"]])}`);
    }
    const record = state.applicationSnapshot, next = applicationDetailNext();
    const status = ({ training: "待完成学习", assessment: state.assessmentPassed ? "待提交审核" : "待完成测评", reviewing: "审核中", "needs-info": "待补充资料", rejected: "未通过", withdrawn: "已撤回", approved: "审核通过 · 待开通", "activation-pending": "开通中", active: "身份已生效", paused: "经营已暂停", terminated: "合作已结束", unknown: "状态待确认", submitting: "提交中" })[next.stage] || "尚未提交";
    const detail = next.stage === "training" ? "完成必修学习与测评后，再提交审核。" : next.stage === "approved" ? "完成协议与收款资料后，等待顾问身份生效。" : next.detail;
    const id = typeof record?.id === "string" ? record.id : "";
    const payee = record?.payeeType === "自然人" ? "个人" : applicationRecordValue(record?.payeeType);
    const region = record?.region === "其他地区" && typeof record.regionOther === "string" && record.regionOther.trim() ? record.regionOther : applicationRecordValue(record?.region);
    const beforeSubmission = ["new", "draft", "identity-processing", "submitting"].includes(next.stage);
    const progressCard = `<section class="application-snapshot application-detail-status" role="status"><small>${e(status)}</small><h2>${record ? "本次申请资料" : beforeSubmission ? e(next.title) : "暂未找到申请资料"}</h2><p>${e(record || beforeSubmission ? detail : `${next.title}，可先查看当前进度。`)}</p></section>`;
    const fields = record ? `${summary([["服务地区", region], ["相关经验", applicationRecordValue(record.experience)], ["收款身份", payee]], "提交时填写的资料")}
      <section class="application-detail-record"><div><span>提交时间（北京时间）</span><strong>${e(applicationRecordTime(record.submittedAt))}</strong></div>
      ${record.updatedAt ? `<div><span>资料更新时间（北京时间）</span><strong>${e(applicationRecordTime(record.updatedAt))}</strong></div>` : ""}
      ${next.stage === "withdrawn" && record.withdrawal?.applicationId === id ? `<div><span>撤回时间（北京时间）</span><strong>${e(applicationRecordTime(record.withdrawal.withdrawnAt))}</strong></div>` : ""}
      <div class="application-detail-reference"><span>申请编号</span><strong id="application-detail-reference">${e(id || "未记录")}</strong>${id ? '<button class="text-button" data-action="commercial:application-detail-copy">复制编号</button>' : ""}</div></section>
      ${record.supplement || record.supplementedAt ? `<details class="disclosure application-detail-supplement"><summary>补充资料记录<span aria-hidden="true">＋</span></summary><div>${Array.isArray(record.supplements) && record.supplements.length ? record.supplements.map(receipt => `<p><strong>${e(applicationRecordValue(receipt.title))}</strong><br>${e(applicationRecordValue(receipt.attachment?.name))}<br>补交时间（北京时间）<br>${e(applicationRecordTime(receipt.submittedAt))}</p>`).join("") : `<p>${e(record.supplement === "收款身份说明 · 本地示例" ? "收款身份说明" : applicationRecordValue(record.supplement))}</p><p>补交时间（北京时间）<br>${e(applicationRecordTime(record.supplementedAt))}</p>`}</div></details>` : ""}` : "";
    return shell(item, "体验顾问", `<div class="channel-application-detail" data-application-id="${e(id)}">${progressCard}${fields}
      ${actions([[next.label, "commercial:application-detail-continue", "primary"]])}
      ${next.route !== "HELP-03" ? '<button class="inline-page-link" data-action="commercial:application-detail-help">资料有误？联系客服</button>' : ""}</div>`);
  }

  function channelJoinPage(item, ctx) {
    const next = channelJoinNext(ctx), returning = next.stage !== "new";
    const step = ({ new: 0, "identity-processing": 0, draft: hasPassedChannelIdentity() ? 1 : 0, training: 2, assessment: 2, reviewing: 3, "needs-info": 3, rejected: 3, approved: 4, "activation-pending": 4, active: 5, paused: 5, terminated: 5 })[next.stage] ?? -1;
    return `<header class="screen-head commercial-head"><div><button class="back" data-action="go:MY-01" aria-label="返回我的">← 返回</button><span class="page-context">体验顾问</span><h1>${e(item.name)}</h1></div></header>
      <div class="stack commercial-stack">
        <section class="channel-intro"${returning ? ' role="status"' : ""}><small>Halo 体验顾问</small><h2>${returning ? e(next.title) : "申请成为体验顾问"}</h2><p>${returning ? e(next.detail) : "介绍 Halo Ring，帮助客户选购和使用。身份生效后开放顾问工具。"}</p></section>
        ${flowStrip(["身份", "申请", "学习", "审核", "生效"], step, "advisor")}
        <div class="button-row"><button id="channel-join-primary" class="primary" data-action="commercial:join-continue">${e(next.label)}</button></div>
        ${state.applicationHistory.some(row => row?.ownerAccount === channelStore.owner()) ? '<button class="inline-page-link" data-action="go:CHN-11">查看申请进度与历史</button>' : !returning ? '<button class="inline-page-link" data-action="go:CHN-11">查看已有申请进度</button>' : ["paused", "terminated"].includes(next.stage) ? '<button class="inline-page-link" data-action="go:HELP-03">联系企业微信客服</button>' : ""}
        ${feedback("顾问等级从 L1 开始", "顾问等级与会员等级独立，无需先购买或连接戒指。", "plain")}
        ${disclosure("申请前了解", '<p><strong>身份与申请</strong><br>完成本人身份核验，再填写申请资料。</p><p><strong>学习与审核</strong><br>完成 3 门必修课程和测评后，提交申请审核。</p><p><strong>签约与开通</strong><br>审核通过后签约并完善收款资料，收到身份生效通知后使用顾问工具。</p>')}
      </div>`;
  }


  function completedCourseIds() {
    if (!state.applicationSnapshot?.id || state.trainingApplicationId !== state.applicationSnapshot.id) return [];
    const saved = Array.isArray(state.completedCourses) ? state.completedCourses : [];
    return COURSES.filter(course => saved.includes(course.id)).map(course => course.id);
  }

  function channel(item, ctx = {}) {
    if (item.id === "CHN-01") return channelJoinPage(item, ctx);
    if (item.id === "CHN-02") return identityPage(item, ctx);
    if (item.id === "CHN-03") return identityProgressPage(item, ctx);
    if (item.id === "CHN-04") return identityFailurePage(item, ctx);
    if (item.id === "CHN-15") return approvalPage.render(item);
    if (item.id === "CHN-16") return activationPage.render(item);
    if (item.id === "CHN-17") return activationPage.renderResult();
    if (item.id === "CHN-18") return activationPage.renderStart();
    if (item.id === "CHN-19") return activationPage.renderHome();
    if (item.id === "CHN-20") return activationPage.renderOrders();
    if (item.id === "CHN-21") return activationPage.renderEarning();
    if (item.id === "CHN-22") return activationPage.renderLedger();
    if (item.id === "CHN-23") return payoutPage.render();
    if (item.id === "CHN-06") return applicationPage.render(item, ctx);
    if (item.id === "CHN-07") return applicationDetailPage(item);
    if (item.id === "CHN-08") return trainingPage.home(item);
    if (item.id === "CHN-09") return trainingPage.coursePage(item);
    if (item.id === "CHN-10") return trainingPage.assessmentPage(item);
    if (item.id === "CHN-11") return applicationProgress.render(item);
    if (item.id === "CHN-12") return supplementPage.render(item);
    if (item.id === "CHN-13") return rejectionPage.render(item);
    if (item.id === "CHN-14") return withdrawalPage.render(item);
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
    const specific = {




    };
    const body = specific[item.id] || `${feedback(item.name, item.note || item.function, "plain")}${actions([["返回经营首页", "go:CHN-19", "primary"]])}`;
    return shell(item, "体验顾问", ["CHN-12", "CHN-14"].includes(item.id) ? applicationProgress.wrap(body) : body);
  }

  function sectionWaiting(title, body) {
    return `<section class="result-card waiting"><span class="spinner" aria-hidden="true"></span><h2>${e(title)}</h2><p>${e(body)}</p></section>`;
  }

  function reviewGroup(title, options) {
    return `<div class="review-control-group"><strong>${e(title)}</strong><div>${options.map(([label, action, active = false]) => `<button class="${active ? "active" : ""}" data-action="${e(action)}">${e(label)}</button>`).join("")}</div></div>`;
  }

  function reviewControls(item) {
    if (item.id === "CHN-22") return `<section class="review-controls"><p>SETTLEMENT REVIEW</p><h3>提现处理回执演示</h3><small>先提交一笔模拟提现。以下仅改变本地示例，不会转账；失败/拒绝只退回一次预占余额。</small>${state.withdrawals?.some(row => row.status === "processing") ? reviewGroup("最早展示的处理中申请", [["演示到账", "commercial:chn-ledger-demo:paid"], ["演示失败退回", "commercial:chn-ledger-demo:failed"], ["演示拒绝退回", "commercial:chn-ledger-demo:rejected"], ["演示处理较久", "commercial:chn-ledger-demo:delayed"]]) : '<small>当前没有处理中申请。</small>'}</section>`;
    if (item.id === "MY-02") return "";
    if (item.id === "REF-01") return referralPage.reviewControls();
    if (item.id === "MEM-06") return "";
    if (item.id === "MEM-07") return "";
    if (["MEM-04","MEM-05"].includes(item.id)) return "";
    if (item.id === "CHN-16") return activationPage.reviewControls();
    const prefix = item.id.split("-")[0];
    if (prefix === "PTS") return ""; // Points scenarios use isolated review fixtures, never force asset states.
    if (!["MEM", "PTS", "REF", "SEL", "CHN"].includes(prefix)) return "";
    if (item.id === "CHN-13") return `<section class="review-controls"><p>APPLICATION RESULT REVIEW</p><h3>未通过结果演示</h3><small>仅切换本地示例，不代表真实审核决定，也不会提交复核。</small>${["active", "paused", "terminated"].includes(state.channelIdentity) ? '<small>已有经营身份，不在此改为申请未通过。</small>' : reviewGroup("本页状态", [["演示未通过结果", "commercial:identity-state:rejected"]])}<small>保留现有申请；无申请时使用示例资料。具体原因未提供时不猜测。</small></section>`;
    if (item.id === "SEL-05") return `<section class="review-controls"><p>CHECKOUT REVIEW</p><h3>结算状态演示</h3><small>仅本地模拟，不发起真实交易。运费与发货日期未正式确认；订单中的配送快照保留示例标记。会员换算沿用100 Points=¥1、普通商品最高30%，无额外起抵门槛。</small>${reviewGroup("收货地址", [["无地址", "commercial:checkout-review:address-none"], ["示例地址", "commercial:checkout-review:address-demo"]])}${reviewGroup("积分", [["0", "commercial:checkout-review:points-zero"], ["2,000", "commercial:checkout-review:points-low"], ["12,860", "commercial:checkout-review:points-demo"]])}${reviewGroup("配送示例", [["运费待确认", "commercial:checkout-review:delivery-unknown"], ["运费 ¥0", "commercial:checkout-review:delivery-zero"], ["运费 ¥10", "commercial:checkout-review:delivery-ten"]])}<small>普通入口刷新保存进度，独立审阅入口刷新重置。SEL-06/07/09仅复用，不在本轮重做视觉。</small></section>`;
    if (item.id === "CHN-04") {
      const record = identityRecord();
      const controls = identityHasLaterStage() || state.applicationSnapshot ? '<small>已有后续申请或顾问身份，不在此重置。</small>' : !record || record.status !== "failed" ? `${reviewGroup("查看失败分支", [["去核验进度演示", "go:CHN-03"]])}<small>在 CHN-03 选择“未通过”模拟回执并刷新，再进入本页。</small>` : `${reviewGroup("本次失败的原因示例", [["原因未返回", "unknown"], ["信息不匹配", "information-mismatch"], ["需客服协助", "support-required"]].map(([label, value]) => [label, `commercial:identity-failure-reason:${value}`, (record.failureReasonCode || "unknown") === value]))}<small>仅切换当前失败示例的安全原因，不创建请求、不改变核验状态或业务资产。</small>`;
      return `<section class="review-controls"><p>IDENTITY RESULT REVIEW</p><h3>核验结果演示</h3><small>真实实名服务、原因码与客服受理接口未接入。未知原因不猜测；联系客服不会创建复核工单或改为人工复核。</small>${controls}</section>`;
    }
    if (item.id === "SEL-03") return `<section class="review-controls"><p>SELECT DETAIL REVIEW</p><h3>商品详情审阅</h3><small>四色名称与 6–11 号范围来自 2026-09-07 硬件确认。色块仅示意，照片为瓷白；没有其他颜色的实拍。¥2,999 / ¥399、全款支付和可购数量沿用本地交易演示，不是正式开售或收款口径。正式收款方案、发货日期、退款条款、尺码内径与手机适配须确认后才能上线交易。</small>${reviewGroup("商品状态", [["交易演示", "commercial:catalog:sale", state.catalogMode === "sale"], ["仅展示", "commercial:catalog:display", state.catalogMode === "display"]])}${reviewGroup("已选规格的库存示例", [["可购 5 件", "commercial:sku-stock-review:5"], ["仅 1 件", "commercial:sku-stock-review:1"], ["缺货", "commercial:sku-stock-review:0"]])}<small>先选规格，再切换库存。购物车按商品＋SKU 分行；立即购买使用独立结算草稿。旧购物车保留，未选规格不自动补选。SEL-04 仅修复关联数据，本轮不重新设计其视觉。</small></section>`;
    if (item.id === "CHN-03") {
      const record = identityRecord();
      const controls = identityHasLaterStage() ? '<small>当前申请已进入后续阶段，不在这里重置身份或申请。</small>' : !record ? reviewGroup("无核验请求", [["创建等待演示", "commercial:identity-review-start"]]) : `${reviewGroup("下次查询的模拟返回", [["仍在核验", "processing"], ["人工复核", "manual-review"], ["已通过", "passed"], ["未通过", "failed"], ["已过期", "expired"], ["网络失败", "network"], ["查询超时", "timeout"]].map(([label, value]) => [label, `commercial:identity-review-reply:${value}`, (state.identityMockReply?.error || state.identityMockReply?.status || record.status) === value]))}<small>选好后点击手机内“刷新进度”。切换只作用于当前核验示例，不改变会员、设备、订单或申请资料。</small>`;
      return `<section class="review-controls"><p>IDENTITY PROGRESS REVIEW</p><h3>核验进度演示</h3><small>结果来自独立本地回执示例，不是真实实名服务。用户刷新只读取回执，默认仍在核验；不会默认通过。</small>${controls}</section>`;
    }
    if (item.id === "CHN-02") return `<section class="review-controls"><p>IDENTITY PAGE REVIEW</p><h3>身份表单演示</h3><small>请勿填写真实姓名或身份证号。可用下方虚构资料演示输入与勾选；不会发起真实实名请求。姓名、证件不进入埋点。</small>${reviewGroup("演示资料", [["填入虚构资料", "commercial:identity-demo"]])}<small>虚构草稿可刷新恢复；新输入的其他完整身份资料只在当前页面会话内保留，刷新需重填。已有核验请求可继续，不重复提交。完整实名服务、快速复核和异常结果页待后续接入/逐页确认。</small></section>`;
    if (item.id === "SEL-01") return `<section class="review-controls"><p>SELECT HOME REVIEW</p><h3>首页审阅场景</h3><small>布局演示不是开售声明。当前商品基线仍为验证中；这里不修改任何商品正式状态、价格或库存。仅审阅区显示这些说明。</small>${reviewGroup("首页状态", [["布局演示", "commercial:home-scene:layout", state.selectHomeScene === "layout"], ["暂无公开商品", "commercial:home-scene:empty", state.selectHomeScene === "empty"]])}<small>本轮只重做首页。系列、详情、购物车与交易页继续逐页确认；已知后续问题未因此视为修复。</small></section>`;
    if (item.id === "SEL-02") return `<section class="review-controls"><p>SELECT CATALOG REVIEW</p><h3>列表审阅场景</h3><small>沿用五个旧演示商品及价格，不代表供应链基线中的候选已获准展示或开售。独立入口使用隔离数据；普通入口保存搜索与系列。</small>${reviewGroup("加载状态", [["正常", "commercial:catalog-state:ready", state.catalogLoadState === "ready"], ["加载失败", "commercial:catalog-state:failed", state.catalogLoadState === "failed"]])}${reviewGroup("公开商品", [["布局演示", "commercial:home-scene:layout", state.selectHomeScene === "layout"], ["暂无商品", "commercial:home-scene:empty", state.selectHomeScene === "empty"]])}${reviewGroup("商品状态示例", [["现货/预售/展示", "commercial:catalog:sale", state.catalogMode === "sale"], ["预售/展示", "commercial:catalog:presale", state.catalogMode === "presale"], ["仅展示三款", "commercial:catalog:display", state.catalogMode === "display"]])}<small>失败重试为本地模拟。未读取健康数据，未上报搜索词；无结果时保留输入并提供清空/搜全部。商品详情、购物车与结算待后续逐页确认。</small></section>`;
    let controls = "";
    if (["MEM", "PTS", "REF"].includes(prefix)) controls = `${reviewGroup("任务结果", [["进行中","commercial:task-state:available",state.taskStatus === "available"],["确认中","commercial:task-state:validating",state.taskStatus === "validating"],["已到账","commercial:task-state:posted",state.taskStatus === "posted"],["已调整","commercial:task-state:adjusted",state.taskStatus === "adjusted"],["复核中","commercial:task-state:reviewing",state.taskStatus === "reviewing"],["已恢复","commercial:task-state:restored",state.taskStatus === "restored"]])}${reviewGroup("会员 / Halo Points", [["升级前","commercial:upgrade-state:before",!state.upgradePosted],["已升级","commercial:upgrade-state:posted",state.upgradePosted],["Points 正常","commercial:points-state:normal",state.pointsMode === "normal"],["Points 调整中","commercial:points-state:pending",state.pointsMode === "pending"],["Points 已恢复","commercial:points-state:restored",state.pointsMode === "restored"]])}`;
    if (prefix === "PTS") controls += reviewGroup("兑换结果", [["待确认","commercial:redeem-state:ready",state.redemptionStatus === "ready"],["处理中","commercial:redeem-state:processing",state.redemptionStatus === "processing"],["成功","commercial:redeem-state:success",state.redemptionStatus === "success"],["失败","commercial:redeem-state:failed",state.redemptionStatus === "failed"]]);
    if (prefix === "SEL") controls = `${reviewGroup("商品状态", [["暂未开售","commercial:catalog:display",state.catalogMode === "display"],["预售","commercial:catalog:presale",state.catalogMode === "presale"],["现货","commercial:catalog:sale",state.catalogMode === "sale"]])}${reviewGroup("支付结果", [["待支付","commercial:payment-state:ready",state.paymentStatus === "ready"],["处理中","commercial:payment-state:processing",state.paymentStatus === "processing"],["成功","commercial:payment-state:success",state.paymentStatus === "success"],["失败","commercial:payment-state:failed",state.paymentStatus === "failed"],["已取消","commercial:payment-state:cancelled",state.paymentStatus === "cancelled"]])}${reviewGroup("售后结果", [["已提交","commercial:aftersale-state:submitted",state.afterSaleStatus === "submitted"],["审核中","commercial:aftersale-state:reviewing",state.afterSaleStatus === "reviewing"],["需寄回","commercial:aftersale-state:return-required",state.afterSaleStatus === "return-required"],["退款中","commercial:aftersale-state:refunding",state.afterSaleStatus === "refunding"],["已完成","commercial:aftersale-state:completed",state.afterSaleStatus === "completed"],["失败","commercial:aftersale-state:failed",state.afterSaleStatus === "failed"]])}`;
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
  function getDeletionSnapshot(ctx = {}) {
    // Unlike getMemberSnapshot, this audit reads durable assets without initializing,
    // upgrading, redeeming, normalizing or persisting anything.
    let stored;
    try {
      stored = JSON.parse(localStorage.getItem(COMMERCIAL_PROGRESS_KEY));
      if (!stored || typeof stored !== "object" || Array.isArray(stored)) return { ok: false, message: "暂时无法读取会员资产，请重新读取后再核对。" };
      const scope = window.HALO_COMMERCIAL_ACCOUNT_STORE.session();
      const owner = window.HALO_COMMERCIAL_ACCOUNT_STORE.ownership(stored);
      if (!scope || !window.HALO_COMMERCIAL_ACCOUNT_STORE.same(scope, owner)) return { ok: false, message: "当前账号的会员资产尚未核对，其他账号的资产不会用于本次注销。" };
    } catch { return { ok: false, message: "暂时无法读取会员资产，请重新读取后再核对。" }; }
    const numeric = value => typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
    const recorded = stored.memberAssets;
    const initial = !recorded && ctx.membershipState === "never-bound";
    const member = recorded && typeof recorded === "object" ? recorded : initial ? { level: "Halo Member（L1）", growth: 0, badges: 0 } : {};
    const now = Date.now();
    // Same unused/in-date rule as getStudioVoucher; redemption vouchers are rights,
    // not a second copy of the shopping discount coupon.
    const unused = Array.isArray(stored.vouchers) ? stored.vouchers.filter(voucher => {
      const expiresAt = voucher?.expires_at || voucher?.expiresAt;
      return voucher?.status === "available" && (!expiresAt || Number.isFinite(Date.parse(expiresAt)) && Date.parse(expiresAt) > now);
    }).length : null;
    const snapshot = {
      level: typeof member.level === "string" && member.level.trim() ? member.level : null,
      growth: numeric(member.growth), badges: numeric(member.badges), points: numeric(stored.pointsBalance),
      coupons: Array.isArray(stored.ownedCouponIds) ? stored.ownedCouponIds.includes(MEMBER_COUPON.id) && !stored.couponUsedOrderId && now < Date.parse(MEMBER_COUPON.expiresAt) ? 1 : 0 : Object.prototype.hasOwnProperty.call(stored, "couponUsedOrderId") ? !stored.couponUsedOrderId && now < Date.parse(MEMBER_COUPON.expiresAt) ? 1 : 0 : null,
      unusedBenefits: unused, benefitsScope: "已记录兑换券"
    };
    const fingerprint = JSON.stringify({ snapshot, memberAssets: stored.memberAssets, pendingPointsCorrection: stored.pendingPointsCorrection, vouchers: stored.vouchers, couponUsedOrderId: stored.couponUsedOrderId });
    return { ok: Object.entries(snapshot).every(([key, value]) => key === "benefitsScope" || value !== null), snapshot, fingerprint, progressFingerprint: JSON.stringify(stored), message: "部分会员资产暂未获取，请重新读取后再核对。" };
  }
  function getMemberSnapshot(ctx = {}) {
    const assets = window.HALO_MEMBER_DATA.snapshot(ctx, {storageKey:COMMERCIAL_PROGRESS_KEY});
    const source = window.HALO_MEMBER_DATA.read(ctx, {storageKey:COMMERCIAL_PROGRESS_KEY});
    const data = source.data;
    const names = ["Halo Member", "Halo Premier", "Halo Signature", "Halo Prestige", "Halo Muse", "Halo Luminary"];
    const coupons = source.trusted ? (Array.isArray(data.ownedCouponIds) && data.ownedCouponIds.includes(MEMBER_COUPON.id) && !data.couponUsedOrderId && Date.now() < Date.parse(MEMBER_COUPON.expiresAt) ? 1 : 0) + (Array.isArray(data.vouchers) ? data.vouchers.filter(voucher => voucher.status === "available").length : 0) : 0;
    return {...assets, level:assets.level === null ? "会员资料待取得" : `${names[assets.level]}（L${assets.level + 1}）`, coupons, unusedBenefits:0};
  }

  function render(item, ctx) {
    commercialStore.select();
    commercialStore.sync();
    channelStore.select(ctx);
    if (item.id.startsWith("SEL-") && commercialStore.unavailable()) return shell(item, "Halo Select", `${feedback("当前账号的购物记录暂时无法读取", "原订单与地址仍保留。请重新读取后继续，不会显示其他账号的记录。", "plain")}${actions([["重新读取", `go:${item.id}`, "primary"], ["返回我的", "go:MY-01", "secondary"]])}`);
    if (item.id.startsWith("CHN-")) channelStore.sync();
    if (item.id.startsWith("CHN-") && channelStore.unavailable()) return shell(item, "体验顾问", `${feedback("渠道记录暂时无法读取", "原记录没有被清空。请重试，恢复前暂不能提交申请或提现。", "plain")}${actions([["重新读取", "commercial:channel-store-retry", "primary"], ["返回我的", "go:MY-01", "secondary"]])}`);
    if (item.id === "MY-02") return couponWallet.render(ctx);
    if (item.id === "MY-01") return "";
    if (item.id === "PTS-02") return pointsLedger.render(ctx);
    if (item.id === "PTS-03") return pointsCatalog.render(ctx);
    if (item.id === "PTS-04") return pointsRedemption.render(ctx);
    if (item.id === "REF-01") return referralPage.render(ctx);
    if (item.id === "PTS-01") return pointsHome.render(ctx);
    // Reward queries own their durable read; do not persist stale commercial memory first.
if (["STU-01", "STU-02", "STU-07", "STU-13", "STU-14", "STU-15"].includes(item.id)) return "";
    if (item.id === "MEM-01") return memberCenter.render(ctx);
    if (item.id === "MEM-02") return memberLevels.render(ctx);
    if (item.id === "MEM-03") return memberUpgrade.render(ctx);
    if (item.id === "MEM-04") return memberTasks.render(ctx);
    if (item.id === "MEM-05") return memberTaskDetail.render(ctx);
    if (item.id === "MEM-06") return memberBadges.render(ctx);
    if (item.id === "MEM-07") return memberBenefits.render(ctx);
    trainingPage.observe(item, ctx);
    applicationPage.observe(ctx);
    applicationProgress.observe(ctx);
    rejectionPage.observe(ctx);
    withdrawalPage.observe(ctx);
    approvalPage.observe(ctx);
    activationPage.observe(ctx);
    toolsPage.observe(ctx);
    if (item.id === "CHN-26") return toolsPage.render();
    policyPage.observe(ctx);
    if (item.id === "CHN-25") return policyPage.render();
    payoutPage.observe(ctx);
    if (item.id === "CHN-23") return payoutPage.render();
    contentPage.observe(ctx);
    if (item.id === "CHN-24") return contentPage.render();
    supplementPage.observe(ctx);
    captureCartView();
    captureCheckoutView();
    if (item.id === "SEL-04") queueMicrotask(mountCartView);
    if (item.id === "SEL-05") queueMicrotask(mountCheckoutView);
    window.HALO_SELECT_GALLERY?.destroy();
    if (item.id === "SEL-03") {
      const productId = selectedProduct().id;
      queueMicrotask(() => window.HALO_SELECT_GALLERY?.mount(state, persistCommercialState, productId));
    }
    if (item.id === "SEL-02") resumeCatalogRetry(ctx);
    if (["CHN-03", "CHN-04"].includes(item.id)) resumeIdentityQuery(ctx);
    resumeAsyncFlows(ctx);
    if (item.id.startsWith("MEM-") || item.id.startsWith("PTS-") || item.id.startsWith("REF-")) return member(item, ctx);
    if (item.id.startsWith("SEL-")) return select(item);
    if (item.id.startsWith("CHN-")) return channel(item, ctx);
    return "";
  }

  function handleAction(action, ctx) {
    if (!action || !action.startsWith("commercial:")) return false;
    if (commercialStore.select()) { ctx.render(); ctx.flash("账号已变化，请核对当前账号后继续"); return true; }
    if (commercialStore.unavailable() && !document.querySelector('#screen')?.dataset.page?.startsWith("CHN-")) { ctx.flash("商业记录暂时无法读取，请刷新后重试，原记录仍保留"); return true; }
    if (channelStore.select(ctx) && document.querySelector('#screen')?.dataset.page?.startsWith("CHN-")) { ctx.render(); ctx.flash("账号已变化，请从当前页面继续"); return true; }
    const [, command, value] = action.split(":");
    if (command === "channel-store-retry") { channelStore.sync(); ctx.render(); return true; }
    if (document.querySelector('#screen')?.dataset.page?.startsWith("CHN-") && channelStore.unavailable()) { ctx.render(); return true; }
    if (command === "history-open") {
      channelStore.sync();
      if (!state.applicationHistory.some(row => row.id === value && row.ownerAccount === channelStore.owner())) { ctx.render(); ctx.flash("这条记录已变化，请重新选择"); return true; }
      ctx.go("CHN-07"); history.replaceState({ ...history.state, channelHistoricalId: value, channelHistoryOwner: channelStore.owner() }, "", location.href); ctx.render(); return true;
    }
    if (pointsRedemption.handle(command, value, ctx)) return true;
    if (document.querySelector('#screen')?.dataset.page === "PTS-04") return true;
    // Retire the legacy write paths and review toggles; they bypass receipt checks.
    if (["redeem", "redeem-select", "redeem-retry", "redeem-state"].includes(command)) return true;
    if (couponWallet.handle(command,value,ctx)) return true;
    if (document.querySelector('#screen')?.dataset.page === "MY-02") return true;
    if (pointsCatalog.handle(command, value, ctx)) return true;
    if (document.querySelector('#screen')?.dataset.page === "PTS-03") return true;
    if (pointsLedger.handle(command, value, ctx)) return true;
    if (document.querySelector('#screen')?.dataset.page === "PTS-02") return true;
    if (referralPage.handle(command, value, ctx)) return true;
    if (document.querySelector('#screen')?.dataset.page === "REF-01") return true;
    if (pointsHome.handle(command, value, ctx)) return true;
    if (document.querySelector('#screen')?.dataset.page === "PTS-01") return true;
    if (["MEM-04","MEM-05"].includes(document.querySelector('#screen')?.dataset.page) && ["task-state","task-period","task-open","upgrade-state","points-state"].includes(command)) return true;
    if (memberCenter.handle(command, value, ctx)) return true;
    if (memberLevels.handle(command, value, ctx)) return true;
    if (memberUpgrade.handle(command, value, ctx)) return true;
    if (memberTasks.handle(command, value, ctx)) return true;
    if (memberTaskDetail.handle(command, value, ctx)) return true;
    if (memberBadges.handle(command, value, ctx)) return true;
    if (memberBenefits.handle(command, value, ctx)) return true;
    if (document.querySelector('#screen')?.dataset.page === "MEM-07") return true;
    if (document.querySelector('#screen')?.dataset.page === "MEM-06") return true;
    if (addressPage.handleAction(command, value, ctx)) return true;
    if (ordersPage.handleAction(command, value, ctx)) return true;
    if (orderDetailPage.handleAction(command, value, ctx)) return true;
    if (afterSalePage.handleAction(command, value, ctx)) return true;
    if (afterSaleProgress.handleAction(command, value, ctx)) return true;
    if (["coupon-select", "coupon-confirm", "coupon-toggle", "coupon-order"].includes(command)) {
      if (document.getElementById("screen")?.dataset.page !== "SEL-06") return true;
      if (command === "coupon-order") {
        const lockedId = !checkoutCanEdit() ? state.checkoutDraftOrderId || state.checkoutReconfirmId : null;
        if ((value === state.couponUsedOrderId || value === lockedId) && state.orders.some(row => row.id === value)) { state.selectedOrderId = value; persistCommercialState(); ctx.go("SEL-11"); }
        else ctx.flash("请从订单列表查看已有订单");
        return true;
      }
      if (!checkoutCanEdit() || !state.checkoutLines.length) { ctx.render(); return true; }
      const attemptedId = state.couponSelectionDraft?.selectedId;
      const draft = ensureCouponDraft(), eligible = checkoutCoupon();
      if (command === "coupon-confirm" && attemptedId === "member" && draft.selectedId !== "member") { ctx.render(); return true; }
      if (command === "coupon-select" || command === "coupon-toggle") {
        const selectedId = command === "coupon-toggle" ? draft.selectedId ? null : "member" : value === "member" ? "member" : value === "none" ? null : undefined;
        if (selectedId === undefined) return true;
        if (selectedId && (!eligible.available || state.couponUsedOrderId)) { draft.notice = eligible.reason || "这张优惠券已使用"; ctx.render(); return true; }
        draft.selectedId = selectedId; draft.notice = "";
        if (!persistCommercialState()) draft.notice = "当前选择尚未保存，刷新可能丢失。";
        ctx.render();
        queueMicrotask(() => document.querySelector(`[data-action="commercial:coupon-select:${selectedId || "none"}"]`)?.focus({ preventScroll: true }));
        return true;
      }
      if (draft.baselineSelected !== state.couponSelected) {
        state.couponSelectionDraft = null; ensureCouponDraft().notice = "订单优惠已更新，请重新确认选择。"; ctx.render(); return true;
      }
      if (draft.selectedId && (!eligible.available || state.couponUsedOrderId)) { draft.selectedId = null; draft.notice = `${eligible.reason || "这张优惠券已使用"}，请重新确认选择。`; ctx.render(); return true; }
      const previousSelected = state.couponSelected, previousReconfirm = state.checkoutReconfirmId;
      state.couponSelected = draft.selectedId === "member";
      if (state.checkoutDraftOrderId) state.checkoutReconfirmId = state.checkoutDraftOrderId;
      state.couponSelectionDraft = null;
      if (!persistCommercialState()) {
        state.couponSelected = previousSelected; state.checkoutReconfirmId = previousReconfirm; state.couponSelectionDraft = draft;
        draft.notice = "选择未保存，请重试。本单优惠未改变。"; ctx.render(); return true;
      }
      ctx.track("select_coupon_confirmed", { coupon_id: state.couponSelected ? "member" : null, discount_cents: state.couponSelected ? eligible.discountCents : 0 });
      ctx.go("SEL-05"); return true;
    }
    if (command === "checkout-review") {
      if (document.getElementById("screen")?.dataset.page !== "SEL-05" || !checkoutCanEdit()) return true;
      if (value === "address-none") state.selectedAddress = null;
      if (value === "address-demo") state.selectedAddress = "shanghai";
      if (value?.startsWith("address-")) state.selectedAddressSnapshot = undefined;
      if (value?.startsWith("points-")) { state.pointsBalance = { "points-zero": 0, "points-low": 2000, "points-demo": 12860 }[value] ?? state.pointsBalance; state.pointsUsed = state.pointsBalance > 0; }
      if (value?.startsWith("delivery-")) state.checkoutDelivery = { status: value === "delivery-unknown" ? "unknown" : "ready", feeCents: value === "delivery-unknown" ? null : value === "delivery-ten" ? 1000 : 0, shipping: "发货时间待确认", simulated: true };
      persistCommercialState(); ctx.render(); return true;
    }
    if (["checkout-spec", "checkout-remove"].includes(command)) {
      if (document.getElementById("screen")?.dataset.page !== "SEL-05" || !checkoutCanEdit()) return true;
      const line = state.checkoutLines.find(row => shoppingKey(row) === value); if (!line) return true;
      if (command === "checkout-remove") {
        // Remove only from this checkout; the original cart remains recoverable.
        state.checkoutLines = state.checkoutLines.filter(row => row !== line); delete state.checkoutSources[value];
        state.checkoutNotice = `${PRODUCTS[line.productId].title}已从本次结算移除，购物车未改变。`;
        persistCommercialState(); ctx.render(); return true;
      }
      const sku = PRODUCT_SKUS[line.skuId];
      state.checkoutSkuEdit = { key: value, productId: line.productId, snapshot: { ...line }, draft: { color: sku?.color || "", size: sku?.size || "", quantity: line.quantity }, top: 0, helpOpen: false };
      persistCommercialState();
      if (!history.state?.checkoutSkuModal) history.pushState({ ...history.state, checkoutSkuModal: true }, "", location.href);
      renderSkuSheet("select"); return true;
    }
    if (supplementPage.handleAction(command, ctx)) return true;
    if (rejectionPage.handleAction(command, ctx)) return true;
    if (withdrawalPage.handleAction(command, ctx)) return true;
    if (approvalPage.handleAction(command, ctx)) return true;
    if (activationPage.handleResultAction(command, ctx)) return true;
    if (activationPage.handleStartAction(command, ctx)) return true;
    if (activationPage.handleHomeAction(command, ctx)) return true;
    if (activationPage.handleOrderAction(command, value, ctx)) return true;
    if (activationPage.handleEarningAction(command, ctx)) return true;
    if (activationPage.handleLedgerAction(command, value, ctx)) return true;
    if (payoutPage.handleAction(command, value, ctx)) return true;
    if (contentPage.handleAction(command, value, ctx)) return true;
    if (policyPage.handleAction(command, ctx)) return true;
    if (toolsPage.handleAction(command, ctx)) return true;
    if (activationPage.handleAction(command, value, ctx)) return true;
    if (applicationProgress.handleAction(command, ctx)) return true;
    if (trainingPage.handleAction(command, value, ctx)) return true;
    if (applicationPage.handleAction(command, ctx)) return true;
    if (["application-detail-continue", "application-detail-copy", "application-detail-help"].includes(command)) {
      const panel = document.querySelector(".channel-application-detail"), id = typeof state.applicationSnapshot?.id === "string" ? state.applicationSnapshot.id : "";
      if (document.getElementById("screen")?.dataset.page !== "CHN-07" || !panel || panel.dataset.applicationId !== id) { ctx.render(); ctx.flash("申请记录已更新，请重新查看"); return true; }
      if (command === "application-detail-copy") {
        if (id) copyWithFeedback(id, "申请编号已复制", { ...ctx, flash: message => { if (document.getElementById("screen")?.dataset.page === "CHN-07" && state.applicationSnapshot?.id === id) ctx.flash(message); } });
      } else {
        const destination = command === "application-detail-help" ? "HELP-03" : applicationDetailNext().route;
        ctx.track("advisor_application_detail_continued", { destination, stage: applicationDetailNext().stage, simulated: true });
        ctx.go(destination);
      }
      return true;
    }
    if (command === "detail-support") {
      if (rowEdit() && (history.state?.cartSkuModal || history.state?.checkoutSkuModal)) {
        // Consume the modal-only history entry before navigating, so Back cannot cancel the new route.
        window.addEventListener("popstate", () => ctx.go("HELP-03"), { once: true });
        closeSkuSheet(); return true;
      }
      closeSkuSheet(); ctx.go("HELP-03"); return true;
    }
    if (command === "sku-open") { renderSkuSheet("select"); return true; }
    if (command === "sku-close") { closeSkuSheet(); return true; }
    if (["sku-color", "sku-size", "sku-inc", "sku-dec"].includes(command)) {
      const draft = productSelection();
      if (command === "sku-color" && RING_COLORS.some(([id]) => id === value)) draft.color = value;
      if (command === "sku-size" && RING_SIZES.includes(value)) {
        if (draft.color && !cartSkuLimit(`ring-${draft.color}-${value}`)) { ctx.flash("此尺码暂时缺货"); return true; }
        draft.size = value;
      }
      if (command === "sku-inc" && !lineProblem(selectionLine(), editOrderId()) && draft.quantity < cartSkuLimit(selectionLine().skuId)) draft.quantity += 1;
      if (command === "sku-dec") draft.quantity = Math.max(1, draft.quantity - 1);
      if (rowEdit()) rowEdit().draft = draft;
      else state.productSelections[selectedProduct().id] = draft;
      persistCommercialState(); renderSkuSheet(); return true;
    }
    if (command === "sku-confirm" || command === "sku-save") {
      if (command === "sku-save" && skuIntent !== "select") return true;
      const line = selectionLine(), problem = lineProblem(line, editOrderId()) || cartEditProblem(line);
      if (problem) { renderSkuSheet(); ctx.flash(problem); return true; }
      if (skuIntent !== "select") { const intent = skuIntent; closeSkuSheet(); return handleAction(`commercial:${intent}`, ctx); }
      if (checkoutEditActive()) {
        if (!checkoutCanEdit()) { closeSkuSheet(); ctx.render(); return true; }
        const edit = state.checkoutSkuEdit, current = state.checkoutLines.find(row => shoppingKey(row) === edit.key);
        const other = state.checkoutLines.find(row => row !== current && row.skuId === line.skuId), newKey = shoppingKey(line);
        const source = state.checkoutSources[edit.key] || [];
        delete state.checkoutSources[edit.key];
        state.checkoutSources[newKey] = [...(state.checkoutSources[newKey] || []), ...source];
        state.checkoutLines = other ? state.checkoutLines.filter(row => row !== current).map(row => row === other ? { ...row, quantity: row.quantity + line.quantity } : row) : state.checkoutLines.map(row => row === current ? { ...line } : row);
        state.checkoutNotice = "本次商品已更新，请核对应付金额。购物车未改变。";
        closeSkuSheet(); persistCommercialState(); ctx.render();
        queueMicrotask(() => [...document.querySelectorAll('[data-action]')].find(node => node.dataset.action === `commercial:checkout-spec:${newKey}`)?.focus({ preventScroll: true }));
        return true;
      }
      if (cartEditActive()) {
        const edit = state.cartSkuEdit, existing = state.cartLines.find(row => shoppingKey(row) === edit.key);
        const other = state.cartLines.find(row => row.skuId === line.skuId && row !== existing), newKey = shoppingKey(line);
        const picked = edit.wasUnavailable || edit.wasSelected || Boolean(other && state.cartSelection[newKey]);
        state.cartLines = other ? state.cartLines.filter(row => row !== existing).map(row => row === other ? { ...row, quantity: row.quantity + line.quantity } : row) : state.cartLines.map(row => row === existing ? { ...line } : row);
        delete state.cartSelection[edit.key]; state.cartSelection[newKey] = picked;
        syncCartBadge(); closeSkuSheet(); persistCommercialState(); ctx.render(); ctx.flash(other ? "已合并相同规格" : "规格已更新");
        queueMicrotask(() => [...document.querySelectorAll('.select-cart-spec')].find(node => node.dataset.action === `commercial:cart-spec:${newKey}`)?.focus({ preventScroll: true }));
        return true;
      }
      persistCommercialState(); refreshProduct(ctx); ctx.flash("规格已保存"); return true;
    }
    if (command === "sku-stock-review") {
      const line = selectionLine();
      if (!line.skuId) { ctx.flash("先在商品内选择颜色和尺码，再切换库存场景"); return true; }
      if (["0", "1", "5"].includes(value)) state.skuStockOverrides[line.skuId] = Number(value);
      persistCommercialState(); refreshProduct(ctx); return true;
    }
    if (command === "cart-spec") {
      const line = state.cartLines.find(row => shoppingKey(row) === value); if (!line) return true;
      const sku = PRODUCT_SKUS[line.skuId];
      state.cartSkuEdit = { key: value, productId: line.productId, snapshot: { ...line }, draft: { color: sku?.color || "", size: sku?.size || "", quantity: line.quantity }, wasSelected: Boolean(state.cartSelection[value]), wasUnavailable: Boolean(lineProblem(line)), top: 0, helpOpen: false };
      persistCommercialState();
      if (!history.state?.cartSkuModal) history.pushState({ ...history.state, cartSkuModal: true }, "", location.href);
      renderSkuSheet("select"); return true;
    }
    if (command === "cart-undo") {
      const saved = state.cartUndo, line = saved?.line || saved;
      if (line) {
        const key = shoppingKey(line), existed = state.cartLines.some(row => shoppingKey(row) === key), picked = existed && state.cartSelection[key];
        const rows = [...state.cartLines]; rows.splice(Number.isInteger(saved.index) ? saved.index : rows.length, 0, line);
        state.cartLines = normalizeShoppingLines(rows); state.cartSelection[key] = Boolean(picked || saved.selected !== false);
        syncCartBadge(); syncCartSelection(); state.cartUndo = null; persistCommercialState(); ctx.render(); ctx.flash("已恢复到购物车");
      }
      return true;
    }
    if (command === "cart-product") {
      const line = state.cartLines.find(row => shoppingKey(row) === value); if (!line) return true;
      const sku = PRODUCT_SKUS[line.skuId];
      state.selectedProductId = line.productId;
      state.productSelections[line.productId] = { color: sku?.color || "", size: sku?.size || "", quantity: line.quantity };
      captureCartView(); persistCommercialState(); ctx.go("SEL-03"); return true;
    }
    if (command === "cart-toggle" || command === "cart-toggle-all") {
      syncCartSelection();
      if (command === "cart-toggle") {
        const line = state.cartLines.find(row => shoppingKey(row) === value);
        if (line && !lineProblem(line)) state.cartSelection[value] = !state.cartSelection[value];
      } else {
        const eligible = state.cartLines.filter(line => !lineProblem(line));
        const checked = eligible.length > 0 && eligible.every(line => state.cartSelection[shoppingKey(line)]);
        eligible.forEach(line => { state.cartSelection[shoppingKey(line)] = !checked; });
      }
      persistCommercialState(); ctx.render(); return true;
    }
    if (command === "cart-remove") {
      const index = state.cartLines.findIndex(row => shoppingKey(row) === value); if (index < 0) return true;
      state.cartUndo = { line: { ...state.cartLines[index] }, index, selected: state.cartSelection[value] !== false };
      state.cartLines.splice(index, 1); delete state.cartSelection[value];
      syncCartBadge(); persistCommercialState(); ctx.render();
      queueMicrotask(() => document.querySelector('[data-action="commercial:cart-undo"]')?.focus({ preventScroll: true }));
      return true;
    }
    if (command === "home-scene") {
      if (["layout", "empty"].includes(value)) { state.selectHomeScene = value; persistCommercialState(); ctx.render(); }
      return true;
    }
    if (command === "home-search" || command === "home-all") {
      state.category = "all";
      state.catalogQuery = "";
      persistCommercialState(); ctx.go("SEL-02");
      requestAnimationFrame(() => { const screen = document.getElementById("screen"); if (screen?.dataset.page !== "SEL-02") return; screen.scrollTop = 0; if (command === "home-search") document.getElementById("catalog-search")?.focus({ preventScroll: true }); });
      return true;
    }
    if (command === "catalog-clear") {
      state.catalogQuery = ""; persistCommercialState();
      const input = document.getElementById("catalog-search");
      if (input) { input.value = ""; input.focus({ preventScroll: true }); }
      syncCatalogResults(); return true;
    }
    if (command === "catalog-search-all") {
      state.category = "all"; persistCommercialState(); ctx.render();
      requestAnimationFrame(() => { document.getElementById("screen").scrollTop = 0; document.getElementById("catalog-search")?.focus({ preventScroll: true }); });
      return true;
    }
    if (command === "catalog-state") {
      if (["ready", "failed"].includes(value)) { clearTimeout(catalogRetryTimer); state.catalogLoadState = value; state.catalogRetryAt = 0; persistCommercialState(); ctx.render(); }
      return true;
    }
    if (command === "catalog-retry") {
      if (state.catalogLoadState === "loading") return true;
      state.catalogLoadState = "loading"; state.catalogRetryAt = Date.now() + 650;
      persistCommercialState(); ctx.track("select_catalog_retry", { source_page: "SEL-02", simulated: true }); ctx.render(); return true;
    }
    if (command === "select-help" || command === "select-delivery") {
      if (value && !SELECT_HELP_TOPICS[value]) return true;
      showSelectDialog(command === "select-delivery" ? "delivery" : value || "");
      ctx.track("select_help_opened", { topic: command === "select-delivery" ? "delivery" : value || "topics", source_page: "SEL-01" });
      return true;
    }
    if (command === "select-help-close") { closeSelectDialog(); return true; }
    if (command === "select-help-support" || command === "select-help-orders") {
      closeSelectDialog(); ctx.go(command === "select-help-support" ? "HELP-03" : "SEL-10"); return true;
    }
    if (command === "join-continue") {
      const next = channelJoinNext(ctx);
      ctx.track("advisor_entry_continued", { stage: next.stage, destination: next.route });
      ctx.go(next.route); return true;
    }
    if (["identity-submit","identity-check","application-submit","application-new","application-consent","course-complete","assessment-review"].includes(command) && ["active","paused","terminated"].includes(state.channelIdentity)) { ctx.flash("已有顾问身份，请从经营中心查看或联系支持"); return true; }
    if (command === "task-open") { if (!TASKS[value]) return true; state.selectedTaskId = value; persistCommercialState(); ctx.go("MEM-05"); return true; }
    if (command === "product-open") { if (!PRODUCTS[value]) return true; state.selectedProductId = value; persistCommercialState(); ctx.go("SEL-03"); return true; }
    if (command === "cart-checkout") {
      // A stock change since the visible quote requires acknowledgement, not a silent smaller order.
      const changed = state.cartLines.find(line => state.cartSelection[shoppingKey(line)] && lineProblem(line));
      if (changed) { syncCartSelection(); persistCommercialState(); ctx.render(); ctx.flash("商品状态有变化，请重新核对已选商品"); return true; }
      syncCartSelection();
      const selected = selectedCartLines();
      if (!selected.length) { ctx.render(); ctx.flash(state.cartLines.length ? "请勾选要购买的商品" : "购物车还是空的"); return true; }
      beginCheckout(selected, "cart"); ctx.go("SEL-05"); return true;
    }
    if (command === "resume-payment") {
      const order = state.orders.find(row => row.id === (value || state.selectedOrderId));
      if (!order || !["pending-payment","processing"].includes(order.status)) { ctx.flash("这笔订单无需继续付款"); return true; }
      state.orderSnapshot = order; state.paymentStatus = order.status === "processing" ? "processing" : order.paymentResult === "deferred" ? "cancelled" : order.paymentResult || "ready"; persistCommercialState(); ctx.go("SEL-09"); return true;
    }
    if (command === "payment-cancel") {
      const order = state.orders.find(row => row.id === state.orderSnapshot?.id);
      if (document.getElementById("screen")?.dataset.page !== "SEL-09" || order?.status !== "pending-payment") return true;
      if (!commitPaymentChange(order.id, () => { saveOrder({ ...order, paymentResult: "deferred" }, false); state.paymentStatus = "cancelled"; }, ctx)) return true;
      ctx.go("SEL-10"); return true;
    }
    if (command === "reconfirm-order") {
      const order = state.orders.find(row => row.id === state.orderSnapshot?.id);
      if (!order || order.status !== "pending-payment") return true;
      state.checkoutReconfirmId = order.id; state.checkoutProductId = order.productId;
      state.checkoutDraftOrderId = order.id; state.checkoutSources = {}; state.checkoutSkuEdit = null;
      state.selectedAddress = order.addressSnapshot?.id || null;
      state.selectedAddressSnapshot = order.addressSnapshot ? { ...order.addressSnapshot } : null;
      state.checkoutDelivery = order.deliverySnapshot ? { ...order.deliverySnapshot } : { status: "unknown", feeCents: null, shipping: order.shipping || "发货时间待确认", simulated: true };
      state.checkoutSeenQuote = null; state.checkoutQuoteChanged = true; state.checkoutNotice = "请核对本次更新后的订单信息。";
      state.checkoutLines = normalizeShoppingLines(order.lines || [{ productId: order.productId, skuId: order.productId === "mask" ? "mask-grey-standard" : null, quantity: order.quantity }]);
      state.checkoutOrigin = "reconfirm"; state.checkoutDraftOrderId = order.id;
      state.couponSelected = Boolean(order.coupon); state.pointsUsed = Boolean(order.pointsUsed) && availablePoints() > 0;
      persistCommercialState(); ctx.go("SEL-05"); return true;
    }

    if (command === "application-new") {
      if ((state.applicationSnapshot || !["none", "draft", undefined].includes(state.applicationStatus) || state.channelIdentity !== "inactive") && !["withdrawn", "rejected"].includes(state.applicationStatus)) { ctx.flash("请继续原申请，已有进度会保留"); return true; }
      const restartFields = ["applicationFlow", "applicationHistory", "applicationSnapshot", "applicationStatus", "channelIdentity", "completedCourses", "assessmentAnswers", "assessmentPassed", "assessmentFeedback", "trainingApplicationId", "trainingVisit", "identityConsent", "identityVerified", "identityProcessing", "identityVerification", "identityQuery", "identityMockReply", "identityRequestId", "identitySubmittedAt", "applicationConsent"];
      const previous = Object.fromEntries(restartFields.map(key => [key, structuredClone(state[key])]));
      applicationPage.reset();
      if (state.applicationSnapshot) state.applicationHistory.push({ ...state.applicationSnapshot, status: state.applicationStatus, training: { completedCourses: [...state.completedCourses], assessmentAnswers: { ...state.assessmentAnswers }, assessmentPassed: state.assessmentPassed, assessmentFeedback: state.assessmentFeedback } });
      state.applicationSnapshot = null; state.applicationStatus = "draft"; state.channelIdentity = "inactive"; state.completedCourses = []; state.assessmentAnswers = {}; state.assessmentPassed = false; state.assessmentFeedback = "";
      state.trainingApplicationId = ""; state.trainingVisit = null;
      state.identityConsent = false; state.identityVerified = false; state.identityProcessing = false; state.identityVerification = null; state.identityQuery = null; state.identityMockReply = null; state.identityRequestId = ""; state.identitySubmittedAt = null; state.applicationConsent = false;
      if (!persistCommercialState()) { Object.assign(state, previous); ctx.flash("暂未保存，原申请记录仍保留，请重试"); return true; }
      ctx.go("CHN-02"); return true;
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
    if (command === "task-appeal") { const id=memberTasks.selected(ctx);if(!id)return true;ctx.track("membership_task_adjustment_appeal_handoff", { task_id: id, channel: "enterprise-wechat" }); ctx.go("HELP-03"); return true; }
    if (command === "task-refresh") {
      const id=memberTasks.selected(ctx);if(!id){ctx.render();return true;}
      ctx.track("membership_task_status_refreshed", { task_id:id, simulated:true });
      ctx.render(); ctx.flash("已重新读取本地记录，尚未确认的进度请稍后再看"); return true;
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
    if (command === "channel-mode") { if (!["new", "established"].includes(value)) return true; const previous = state.channelMode; state.channelMode = value; if (!persistCommercialState()) { state.channelMode = previous; ctx.flash("示例状态暂未保存，请重试"); } ctx.render(); return true; }
    if (command === "identity-state") {
      // This action exists only in the separate prototype review controls.
      if (value === "rejected" && (["active", "paused", "terminated"].includes(state.channelIdentity) || (state.applicationSnapshot?.reviewDecision && state.applicationSnapshot.reviewDecision.status !== "rejected") || (!state.applicationSnapshot && state.trainingApplicationId))) { ctx.flash("已有其他阶段或待核对的记录，请先查看当前申请，不在此覆盖结果"); return true; }
      state.channelIdentity = value;
      if (["application","needs-info","rejected","approved","activation-pending"].includes(value)) {
        state.applicationSnapshot ||= { ...state.applicationDraft, ownerAccount: channelStore.owner(), id: "ADV-DEMO-001", submittedAt: "示例提交记录" };
        if (value === "needs-info") state.applicationSnapshot.supplementRequest = { id: `SUP-DEMO-${state.applicationSnapshot.id}`, applicationId: state.applicationSnapshot.id, title: "收款身份说明", status: "requested", simulated: true };
        state.applicationStatus = ["needs-info", "rejected"].includes(value) ? value : ["approved","activation-pending"].includes(value) ? "approved" : "reviewing";
        state.activationReady = ["approved","activation-pending"].includes(value);
      }
      if (value === "rejected" && !state.trainingApplicationId) state.trainingApplicationId = state.applicationSnapshot.id;
      persistCommercialState();
      if (value === "rejected") rejectionPage.reviewChanged();
      const route = { inactive: "CHN-01", application: "CHN-11", "needs-info": "CHN-12", rejected: "CHN-13", approved: "CHN-15", "activation-pending": "CHN-16", active: "CHN-17", paused: "CHN-19", terminated: "CHN-19" }[value] || "CHN-01";
      ctx.go(route); return true;
    }
    if (command === "category") {
      if (!SELECT_CATEGORIES.some(([key]) => key === value)) return true;
      const fromList = document.getElementById("screen")?.dataset.page === "SEL-02";
      if (fromList && state.category === value) return true;
      state.category = value;
      if (!fromList) state.catalogQuery = "";
      persistCommercialState(); ctx.go("SEL-02");
      ctx.track("select_catalog_filter_changed", { category: value, source_page: fromList ? "SEL-02" : "SEL-01" });
      requestAnimationFrame(() => { if (document.getElementById("screen")?.dataset.page === "SEL-02") document.getElementById("screen").scrollTop = 0; });
      return true;
    }
    if (command === "buy-now" || command === "add-cart") {
      if (!isProductOpen(selectedProduct())) { ctx.flash("这件商品尚未开售"); return true; }
      const line = selectionLine(), problem = lineProblem(line);
      if (problem) { renderSkuSheet(command); return true; }
      if (command === "buy-now") { beginCheckout([line], "buy-now"); ctx.go("SEL-05"); return true; }
      const current = state.cartLines.find(row => row.skuId === line.skuId);
      if ((current?.quantity || 0) + line.quantity > skuAvailable(line.skuId)) { ctx.flash("购物车中的此规格已达到可购数量，请减少数量后再添加"); return true; }
      state.cartLines = normalizeShoppingLines([...state.cartLines, line]); syncCartBadge(); state.cartUndo = null;
      persistCommercialState(); ctx.track("select_cart_added", { product_id: line.productId, sku_id: line.skuId, quantity: line.quantity });
      ctx.go("SEL-04"); ctx.flash(`已加入购物车 · ${line.quantity} 件`); return true;
    }
    if (command === "cart-inc" || command === "cart-dec") {
      const line = state.cartLines.find(row => shoppingKey(row) === value) || (!value ? state.cartLines[0] : null);
      if (!line) return true;
      if (command === "cart-inc") {
        const problem = lineProblem({ ...line, quantity: line.quantity + 1 });
        if (problem) { ctx.flash(problem); return true; } line.quantity += 1;
      } else if (line.quantity > 1) line.quantity -= 1;
      syncCartBadge(); persistCommercialState(); ctx.render(); return true;
    }
    if (command === "points-use") { if (!checkoutCanEdit()) return true; state.pointsUsed = money().maxPointsCount > 0 && !state.pointsUsed; if (state.checkoutDraftOrderId) state.checkoutReconfirmId = state.checkoutDraftOrderId; ctx.track("select_points_usage_changed", { used: state.pointsUsed }); ctx.render(); return true; }
    if (command === "attribution-state") {
      state.attribution = value;
      state.attributionReason = value === "member" ? "系统识别到支付前已生效的会员推荐关系" : value === "channel" ? "系统识别到支付前已生效的体验顾问服务关系" : "本次从 Halo Select 直接进入，未识别到有效推荐关系";
      ctx.track("order_attribution_resolved", { attribution_type: value, source: "prototype-state" });
      ctx.render();
      return true;
    }
    if (command === "submit-order") {
      if (document.getElementById("screen")?.dataset.page !== "SEL-05" || !checkoutCanEdit()) return true;
      const problem = checkoutProblem();
      if (problem) { ctx.flash(problem); ctx.render(); return true; }
      if (!state.checkoutSeenQuote || state.checkoutSeenQuote !== checkoutQuoteKey()) {
        state.checkoutQuoteChanged = true;
        state.checkoutNotice = "商品、优惠或配送信息有变化，请核对后再次确认。本次尚未提交。";
        persistCommercialState(); ctx.render(); return true;
      }
      // Re-entering the same checkout continues its order; it never creates a duplicate.
      const draftOrder = state.orders.find(order => order.id === state.checkoutDraftOrderId);
      if (!state.checkoutReconfirmId && draftOrder) {
        state.orderSnapshot = draftOrder; if (!persistCommercialState()) { ctx.flash("订单未能保存，请重试"); return true; } ctx.go("SEL-09"); return true;
      }
      const previous = state.checkoutReconfirmId && state.orders.find(order => order.id === state.checkoutReconfirmId);
      if (previous && previous.status !== "pending-payment") { ctx.flash("订单状态已变化，请返回订单查看"); return true; }
      const beforeSubmit = structuredClone(state);
      const order = checkoutSnapshot(); state.orderSnapshot = order; saveOrder(order, false);
      if (!state.checkoutReconfirmId && state.checkoutOrigin === "cart") {
        const sources = state.checkoutLines.flatMap(line => {
          let remaining = line.quantity;
          return (state.checkoutSources[shoppingKey(line)] || []).map(source => {
            const quantity = Math.min(source.quantity, remaining); remaining -= quantity;
            return { ...source, quantity };
          });
        });
        state.cartLines = state.cartLines.map(line => ({ ...line, quantity: Math.max(0, line.quantity - sources.filter(row => row.skuId === line.skuId).reduce((sum, row) => sum + row.quantity, 0)) })).filter(line => line.quantity > 0);
        syncCartBadge(); syncCartSelection(); state.cartUndo = null;
      }
      state.checkoutDraftOrderId = order.id;
      if (!state.checkoutReconfirmId) state.nextOrderSequence += 1;
      state.checkoutReconfirmId = null; state.selectedOrderId = order.id; state.paymentStatus = "ready";
      state.checkoutQuoteChanged = false; state.checkoutNotice = "";
      if (!persistCommercialState()) { Object.assign(state, beforeSubmit); ctx.flash("订单未能保存，商品和输入已保留，请重试"); ctx.render(); return true; }
      ctx.go("SEL-09"); return true;
    }
    if (command === "payment-confirm") {
      const order = state.orders.find(row => row.id === state.orderSnapshot?.id);
      if (document.getElementById("screen")?.dataset.page !== "SEL-09") return true;
      if (!order || order.status !== "pending-payment") { ctx.flash("请从待付款订单继续"); return true; }
      const stockProblem = paymentIssue(order);
      if (stockProblem) { ctx.render(); ctx.flash(stockProblem); return true; }
      if (!paymentAmount(order.payable)) { ctx.render(); return true; }
      if (!paymentPointsAvailable(order) || state.redemptionStatus === "processing") { ctx.render(); ctx.flash(orderCouponProblem(order) || "积分状态已变化，请重新确认金额"); return true; }
      if (!commitPaymentChange(order.id, () => {
        state.paymentStatus = "processing";
        saveOrder({ ...order, status: "processing", paymentResult: "processing", paymentAttemptId: crypto.randomUUID(), paymentRequestedAt: new Date().toISOString(), paymentMockOutcome: "success", paymentFailure: null }, false);
      }, ctx)) return true;
      ctx.render(); resumeAsyncFlows(ctx); return true;
    }
    if (command === "payment-refresh") {
      const order = state.orders.find(row => row.id === state.orderSnapshot?.id);
      if (document.getElementById("screen")?.dataset.page !== "SEL-09") return true;
      if (order?.status === "processing" && paymentNotices[order.id]) finishPendingPayment(ctx, order.id, order.paymentAttemptId);
      else { ctx.render(); resumeAsyncFlows(ctx); }
      return true;
    }
    if (command === "payment-retry") return handleAction("commercial:payment-confirm", ctx);
    if (command === "payment-state") {
      if (value === "success") return handleAction("commercial:payment-confirm",ctx);
      const order = state.orders.find(row => row.id === state.orderSnapshot?.id);
      if (!order || order.status === "paid" || !["ready", "processing", "failed", "cancelled"].includes(value)) return true;
      if (value === "processing") return handleAction("commercial:payment-confirm", ctx);
      if (!commitPaymentChange(order.id, () => {
        saveOrder({ ...order, status: "pending-payment", paymentResult: value === "cancelled" ? "deferred" : value, paymentAttemptId: null, paymentFailure: value === "failed" ? "simulated-failure" : null }, false);
        state.paymentStatus = value;
      }, ctx)) return true;
      ctx.render(); return true;
    }
    if (command === "open-order") { state.selectedOrderId = value === "latest" ? state.orderSnapshot?.id : value; state.logisticsExpanded = false; persistCommercialState(); ctx.go("SEL-11"); return true; }
    if (command === "open-aftersale") { const snapshot = state.afterSales.find(row => row.id === value); if (!snapshot) { ctx.flash("未找到售后记录"); return true; } state.afterSaleSnapshot = snapshot; state.afterSaleStatus = snapshot.status; persistCommercialState(); ctx.go("SEL-13"); return true; }
    if (command === "logistics-toggle") { state.logisticsExpanded = !state.logisticsExpanded; ctx.render(); return true; }
    if (command === "upload-select") { state.uploadSelected = true; ctx.render(); ctx.flash("文件已选择"); return true; }

    if (command === "identity-notice") { showIdentityNotice(); return true; }
    if (command === "identity-demo") {
      if (identityResume(ctx) || document.getElementById("screen")?.dataset.page !== "CHN-02") return true;
      if (state.identityDraft.name || state.identityDraft.idNumber) { ctx.flash("先清空这两项，再填入虚构资料；不会覆盖已填内容。"); return true; }
      state.identityDraft = { ...IDENTITY_DEMO }; identityDraftIsVolatile = true;
      persistCommercialState(); ctx.render(); return true;
    }
    if (command === "identity-consent") { if (identityResume(ctx)) return true; state.identityConsent = !state.identityConsent; persistCommercialState(); syncIdentityControls(); return true; }
    if (command === "identity-submit") {
      const resume = identityResume(ctx);
      if (resume) { ctx.go(resume.route); return true; }
      if (!isIdentityValid()) { syncIdentityControls(); ctx.flash(identityInputErrors().name || identityInputErrors().idNumber || "请先阅读并同意身份核验说明"); return true; }
      const previous = Object.fromEntries(Object.entries(state).filter(([key]) => key.startsWith("identity")).map(([key, value]) => [key, structuredClone(value)]));
      state.identityRequestId = `IDV-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      state.identitySubmittedAt = new Date().toISOString();
      state.identityConsentReceipt = { version: IDENTITY_NOTICE_VERSION, acceptedAt: state.identitySubmittedAt };
      state.identityVerification = { id: state.identityRequestId, ownerAccount: channelStore.owner(), status: "processing", submittedAt: state.identitySubmittedAt, updatedAt: state.identitySubmittedAt, mock: true };
      state.identityQuery = null; state.identityMockReply = null;
      state.identityProcessing = true; state.identityVerified = false;
      if (!persistCommercialState()) { Object.assign(state, previous); ctx.flash("本次核验尚未提交，资料已保留，请重试。"); return true; }
      ctx.track("advisor_identity_verification_submitted", { request_id: state.identityRequestId, notice_version: IDENTITY_NOTICE_VERSION, simulated: true }); ctx.go("CHN-03"); return true;
    }
    if (command === "identity-check") { queryIdentityProgress(ctx); return true; }
    if (command === "identity-continue") {
      if (identityHasLaterStage()) { ctx.go(channelJoinNext(ctx).route); return true; }
      if (!hasPassedChannelIdentity()) { ctx.flash("请先查看本次核验结果，通过后再继续。"); return true; }
      ctx.go("CHN-06"); return true;
    }
    if (command === "identity-support") {
      const record = identityRecord();
      if (document.getElementById("screen")?.dataset.page !== "CHN-04" || document.querySelector(".identity-failure-page")?.dataset.verificationId !== record?.id || identityHasLaterStage() || state.applicationSnapshot || record?.status !== "failed" || state.identityQuery?.status === "loading") { ctx.flash("核验进度已变化，请查看最新结果。"); return true; }
      state.identitySupportContext = { verificationId: record.id, resultAt: record.updatedAt || null };
      persistCommercialState(); ctx.track("advisor_identity_support_opened", { request_id: record.id, simulated: true }); ctx.go("HELP-03"); return true;
    }
    if (command === "identity-copy") {
      const record = identityRecord(), screen = document.getElementById("screen");
      const fromResult = screen?.dataset.page === "CHN-04" && record?.status === "failed" && document.querySelector(".identity-failure-page")?.dataset.verificationId === record.id;
      const fromSupport = screen?.dataset.page === "HELP-03" && record && state.identitySupportContext?.verificationId === record.id && document.getElementById("identity-support-context")?.dataset.verificationId === record.id;
      if (!record || identityHasLaterStage() || state.applicationSnapshot || !(fromResult || fromSupport)) { ctx.flash("核验记录已变化，请先查看最新结果。"); return true; }
      copyWithFeedback(record.id, "核验编号已复制", ctx); return true;
    }
    if (command === "identity-failure-reason") {
      const record = identityRecord();
      if (document.getElementById("screen")?.dataset.page !== "CHN-04" || record?.status !== "failed" || identityHasLaterStage() || state.applicationSnapshot || state.identityQuery?.status === "loading" || !["unknown", ...Object.keys(IDENTITY_FAILURE_REASONS)].includes(value)) return true;
      state.identityVerification = { ...record, failureReasonCode: value === "unknown" ? null : value };
      state.identityMockReply = null; persistCommercialState(); ctx.render(); return true;
    }
    if (command === "identity-retry") {
      if (identityHasLaterStage() || state.applicationSnapshot || !["failed", "expired"].includes(identityRecord()?.status)) return true;
      if (document.getElementById("screen")?.dataset.page === "CHN-04" && document.querySelector("[data-verification-status]")?.dataset.verificationId !== identityRecord()?.id) { ctx.flash("核验记录已变化，请返回最新进度。"); return true; }
      if (state.identityQuery?.status === "loading") { ctx.flash("正在查询最新进度，请稍后再试。"); return true; }
      if (identityRecord()?.status === "failed" && !identityFailureInfo(identityRecord()).canRetry) { ctx.flash("请先联系客服核对本次结果。"); return true; }
      state.identityConsent = false; persistCommercialState(); ctx.go("CHN-02"); return true;
    }
    if (command === "identity-review-start") {
      if (identityRecord() || identityHasLaterStage() || document.getElementById("screen")?.dataset.page !== "CHN-03") return true;
      state.identityRequestId = `IDV-DEMO-${Date.now()}`; state.identitySubmittedAt = new Date().toISOString();
      state.identityVerification = { id: state.identityRequestId, ownerAccount: channelStore.owner(), status: "processing", submittedAt: state.identitySubmittedAt, updatedAt: state.identitySubmittedAt, mock: true };
      state.identityQuery = null; state.identityMockReply = null; state.identityProcessing = true; state.identityVerified = false;
      persistCommercialState(); ctx.render(); return true;
    }
    if (command === "identity-review-reply") {
      const record = identityRecord();
      if (!record || identityHasLaterStage() || ![...IDENTITY_STATUSES, "network", "timeout"].includes(value) || document.getElementById("screen")?.dataset.page !== "CHN-03") return true;
      state.identityMockReply = { verificationId: record.id, status: IDENTITY_STATUSES.includes(value) ? value : record.status, error: ["network", "timeout"].includes(value) ? value : "", updatedAt: new Date().toISOString(), mock: true };
      persistCommercialState(); ctx.render(); return true;
    }
    // Older cached controls resume the application; they can never open a device flow.
    if (command.startsWith("channel-device-")) { ctx.go(channelJoinNext(ctx).route); return true; }

    return false;
  }

  function handleInput(target, ctx = {}) {
    if (commercialStore.select()) { ctx.render?.(); return true; }
    channelStore.select(ctx);
    if (payoutPage.handleInput(target)) return true;
    if (afterSaleProgress.handleInput(target, ctx)) return true;
    if (activationPage.handleInput(target)) return true;
    if (afterSalePage.handleInput(target, ctx)) return true;
    if (trainingPage.handleInput(target, ctx)) return true;
    if (applicationPage.handleInput(target)) return true;
    const syncButton = (action, enabled) => {
      const button = document.querySelector(`[data-action="${action}"]`);
      if (!button) return;
      button.disabled = !enabled;
      button.setAttribute("aria-disabled", String(!enabled));
    };
    if (addressPage.handleInput(target)) return true;
    if (target.id === "identity-name" || target.id === "identity-id-number") {
      if (state.identityProcessing || (state.identityVerified && !["rejected", "withdrawn"].includes(state.applicationStatus))) return true;
      state.identityDraft[target.id === "identity-name" ? "name" : "idNumber"] = target.value;
      identityDraftIsVolatile = true;
      persistCommercialState();
      syncIdentityControls();
      return true;
    }

    if (target.id === "catalog-search") {
      state.catalogQuery = target.value.slice(0, 80);
      persistCommercialState(); syncCatalogResults();
      return true;
    }
    return false;
  }

  window.addEventListener("pagehide", () => {
    if (document.querySelector('#screen')?.dataset.page?.startsWith("CHN-")) return;
    if (document.querySelector('#screen')?.dataset.page === "MY-02") return;
    if (document.querySelector('#screen')?.dataset.page === "MY-01") return;
    if (document.querySelector('#screen')?.dataset.page === "REF-01") return;
    if (document.querySelector(".screen")?.dataset.page === "MEM-07") return;
    if (document.querySelector(".screen")?.dataset.page === "MEM-06") return;
    // Read-only asset pages: a refresh after a conflict must not overwrite
    // newer commercial records from another tab with this tab's old memory.
    // CHN-16 saves each confirmed step atomically; its unsaved bank input stays in memory.
    if (["ACC-03", "HAL-02", "HAL-03", "HAL-04", "HAL-05", "HAL-06", "HAL-07", "HAL-08", "MEM-01", "MEM-02", "MEM-03", "MEM-04", "MEM-05", "STU-01", "STU-02", "STU-07", "STU-13", "STU-14", "STU-15", "CHN-16", "CHN-17", "CHN-18", "CHN-19", "CHN-20", "CHN-21", "CHN-22", "CHN-23", "CHN-24", "CHN-25", "CHN-26"].includes(document.querySelector(".screen")?.dataset.page)) return;
    // Unloading is not a business transaction. Explicit inputs/actions already save.
    captureCartView(); captureCheckoutView();
  });
  window.addEventListener("popstate", () => {
    if (cartEditActive() && !history.state?.cartSkuModal) closeSkuSheet({ pop: false });
    if (checkoutEditActive() && !history.state?.checkoutSkuModal) closeSkuSheet({ pop: false });
    if (history.state?.cartSkuModal && !state.cartSkuEdit) { const clean = { ...history.state }; delete clean.cartSkuModal; history.replaceState(clean, "", location.href); }
    if (history.state?.checkoutSkuModal && !state.checkoutSkuEdit) { const clean = { ...history.state }; delete clean.checkoutSkuModal; history.replaceState(clean, "", location.href); }
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.isComposing && ["identity-name", "identity-id-number"].includes(event.target.id) && document.getElementById("screen")?.dataset.page === "CHN-02") {
      event.preventDefault();
      if (event.target.id === "identity-name") document.getElementById("identity-id-number")?.focus();
      else { syncIdentityControls(); document.getElementById("identity-submit")?.click(); }
    }
    if (event.target.id === "catalog-search" && event.key === "Enter" && !event.isComposing) { event.preventDefault(); event.target.blur(); }
  });
  const applicationPage = window.HALO_CHANNEL_APPLICATION.create({ state, persist: persistCommercialState, read: readCommercialProgress, storageKey: COMMERCIAL_PROGRESS_KEY, passedIdentity: hasPassedChannelIdentity, next: channelJoinNext, shell, feedback, actions, escape: e });
  const trainingPage = window.HALO_CHANNEL_TRAINING.create({ state, courses: COURSES, completed: completedCourseIds, persist: persistCommercialState, read: readCommercialProgress, storageKey: COMMERCIAL_PROGRESS_KEY, resume: applicationDetailNext, shell, feedback, actions, progress, escape: e });
  const applicationProgress = window.HALO_CHANNEL_PROGRESS.create({ state, persist: persistCommercialState, synchronize: trainingPage.synchronize, next: applicationDetailNext, restart: ctx => handleAction("commercial:application-new", ctx), actions, feedback, escape: e });
  const supplementPage = window.HALO_CHANNEL_SUPPLEMENT.create({ state, persist: persistCommercialState, synchronize: trainingPage.synchronize, current: applicationProgress.current, actions, feedback, escape: e });
  const rejectionPage = window.HALO_CHANNEL_REJECTION.create({ state, synchronize: trainingPage.synchronize, current: applicationProgress.current, restart: ctx => handleAction("commercial:application-new", ctx), copy: copyWithFeedback, actions, feedback, escape: e });
  const withdrawalPage = window.HALO_CHANNEL_WITHDRAWAL.create({ state, persist: persistCommercialState, synchronize: trainingPage.synchronize, current: applicationProgress.current, actions, feedback, escape: e });
  const approvalPage = window.HALO_CHANNEL_APPROVAL.create({ state, synchronize: trainingPage.synchronize, current: applicationProgress.current, copy: copyWithFeedback, actions, feedback, escape: e });
const activationPage = window.HALO_CHANNEL_ACTIVATION.create({ state, persist: persistCommercialState, synchronize: trainingPage.synchronize, validResult: approvalPage.validResult, actions, feedback, copy: copyWithFeedback, escape: e, serviceOrders: () => state.channelMode === "new" ? [] : state.channelMode === "established" ? CHANNEL_ORDERS : null, dashboardData: () => {
    const known = ["new", "established"].includes(state.channelMode), fresh = state.channelMode === "new";
    const pendingCents = known ? fresh ? 0 : CHANNEL_ORDERS.reduce((sum, order) => sum + Math.round(order.earning * 100), 0) : null;
    const availableCents = known ? fresh ? 0 : state.channelAvailableCents : null;
    return { count: known ? fresh ? 0 : CHANNEL_ORDERS.length : null, pendingCents, availableCents, invalid: !known || !Number.isSafeInteger(availableCents) || availableCents < 0 };
  } });
  const payoutPage = window.HALO_CHANNEL_PAYOUT.create({ state, synchronize: trainingPage.synchronize, model: activationPage.payoutContext, escape: e, actions, feedback });
  const contentPage = window.HALO_CHANNEL_CONTENT.create({ state, synchronize: trainingPage.synchronize, model: activationPage.contentContext, policies: POLICIES, escape: e, actions, feedback });
  const policyPage = window.HALO_CHANNEL_POLICY.create({ state, synchronize: trainingPage.synchronize, model: activationPage.contentContext, policies: POLICIES, escape: e, actions, feedback });
  const toolsPage = window.HALO_CHANNEL_TOOLS.create({ state, synchronize: trainingPage.synchronize, model: activationPage.contentContext, escape: e, actions, feedback });
  const addressPage = window.HALO_SELECT_ADDRESS_CONTROLLER.create({ state, persist: persistCommercialState, getApplied: checkoutAddress, canEdit: checkoutCanEdit, e, icon: selectIcon, apply(address) {
    state.selectedAddress = address.id; state.selectedAddressSnapshot = { ...address };
    if (state.checkoutDraftOrderId) state.checkoutReconfirmId = state.checkoutDraftOrderId;
    if (state.checkoutDelivery?.simulated !== true) state.checkoutDelivery = { ...state.checkoutDelivery, status: "unknown", feeCents: null };
  } });
  const ordersPage = window.HALO_SELECT_ORDERS_PAGE.create({ state, persist: persistCommercialState, e, icon: selectIcon, money: paymentAmount, afterSaleLabel, dispatch: handleAction });
  const orderDetailPage = window.HALO_SELECT_ORDER_DETAIL_PAGE.create({ state, persist: persistCommercialState, currentOrder, afterSale: orderAfterSale, afterSaleLabel, money: paymentAmount, e, icon: selectIcon });
  const afterSalePage = window.HALO_SELECT_AFTERSALE_PAGE.create({ state, persist: persistCommercialState, currentOrder, afterSale: orderAfterSale, saveAfterSale, afterSaleLabel, money: paymentAmount, e, icon: selectIcon });
  const afterSaleProgress = window.HALO_SELECT_AFTERSALE_PROGRESS.create({ state, persist: persistCommercialState, saveAfterSale, restorePoints: applyAfterSalePoints, money: paymentAmount, e, icon: selectIcon });
  const observeCommercialPage = (item, ctx) => { if (["REF-01", "MY-01", "MY-02"].includes(item.id)) return; policyPage.observe(ctx); if (["MEM-01", "MEM-02", "MEM-03", "MEM-04", "MEM-05", "MEM-06", "MEM-07", "STU-01", "STU-02", "STU-07", "STU-13", "STU-14", "STU-15"].includes(item.id)) return; addressPage.observe(item, ctx); observeCouponPage(item, ctx); ordersPage.observe(item); orderDetailPage.observe(item); afterSalePage.observe(item); };
  const memberCenter = window.HALO_MEMBER_CENTER.create({ storageKey: COMMERCIAL_PROGRESS_KEY, escape: e });
  const couponWallet = window.HALO_COUPON_WALLET.create({storageKey:COMMERCIAL_PROGRESS_KEY,coupon:MEMBER_COUPON,catalog:REDEMPTION_CATALOG,escape:e});
  const referralPage = window.HALO_REFERRAL.create({ storageKey: COMMERCIAL_PROGRESS_KEY, escape: e });
  const pointsHome = window.HALO_POINTS_HOME.create({ storageKey: COMMERCIAL_PROGRESS_KEY, escape: e, sync: data => commercialStore.sync(data) });
  const pointsLedger = window.HALO_POINTS_LEDGER.create({read:pointsHome.read,escape:e});
  const pointsCatalog = window.HALO_POINTS_CATALOG.create({read:pointsHome.read,catalog:REDEMPTION_CATALOG,storageKey:COMMERCIAL_PROGRESS_KEY,escape:e});
  const pointsRedemption = window.HALO_POINTS_REDEMPTION.create({read:pointsHome.read,catalog:REDEMPTION_CATALOG,storageKey:COMMERCIAL_PROGRESS_KEY,escape:e});
  window.haloRedemptionSupportPanel = (restore = false) => pointsRedemption.supportPanel(restore);
  window.haloPointsSupportPanel = () => pointsLedger.supportPanel();
  const memberLevels = window.HALO_MEMBER_LEVELS.create({ snapshot: memberCenter.snapshot, escape: e });
  const memberUpgrade = window.HALO_MEMBER_UPGRADE.create({ snapshot: memberCenter.upgradeSnapshot, escape: e });
  const memberTaskLedger = window.HALO_MEMBER_TASK_LEDGER.create({storageKey:COMMERCIAL_PROGRESS_KEY,tasks:TASKS,sync:data => commercialStore.sync(data)});
  const memberTaskRecovery = window.HALO_MEMBER_TASK_RECOVERY.create({storageKey:COMMERCIAL_PROGRESS_KEY,tasks:TASKS,complete:completeTask});
  const memberTasks = window.HALO_MEMBER_TASKS.create({ storageKey:COMMERCIAL_PROGRESS_KEY, tasks:TASKS, escape:e, recovery:memberTaskRecovery });
  const memberTaskDetail = window.HALO_MEMBER_TASK_DETAIL.create({ snapshot:memberTasks.detailSnapshot, escape:e });
  const memberBadges = window.HALO_MEMBER_BADGES.create({ storageKey:COMMERCIAL_PROGRESS_KEY, escape:e });
  const memberBenefits = window.HALO_MEMBER_BENEFITS.create({ storageKey:COMMERCIAL_PROGRESS_KEY, escape:e });
  function channelSupportContext(route, saved) {
    if (!/^CHN-\d{2}$/.test(route) || !channelStore.owner()) return null;
    const data = channelStore.read(), owner = channelStore.owner();
    const applicationId = saved?.applicationId || data.applicationSnapshot?.id;
    const record = [data.applicationSnapshot, ...(data.applicationHistory || [])].find(row => row?.id === applicationId && row.ownerAccount === owner);
    if (!record) return null;
    let recordId = applicationId, recordLabel = "申请编号";
    const orderId = saved?.orderId || (route === "CHN-21" ? data.selectedEarningId : "");
    const withdrawalId = saved?.withdrawalId || (route === "CHN-23" ? data.channelWithdrawal?.resultId : route === "CHN-22" ? data.channelSupportWithdrawalId : "");
    if (orderId) { if (!CHANNEL_ORDERS.some(row => row.id === orderId)) return null; recordId = orderId; recordLabel = "关联订单"; }
    if (withdrawalId) { if (!data.withdrawals?.some(row => row.id === withdrawalId)) return null; recordId = withdrawalId; recordLabel = "提现申请编号"; }
    return { kind: "channel", ownerAccount: owner, sourceRoute: route, applicationId, recordId, recordLabel, orderId: orderId || null, withdrawalId: withdrawalId || null };
  }
  window.HALO_COMMERCIAL_EXTENSION = { extraPages, state, render, observePage: observeCommercialPage, handleAction, handleInput, reviewControls, getMemberSnapshot, getDeletionSnapshot, getStudioVoucher, consumeStudioVoucher, restoreStudioVoucher, awardStudioBenefit, getStudioBenefit, postStudioBenefit, completeTask, maybeUpgradeMember, channelJoinNext, identitySupportPanel, channelSupportContext };
  window.HALO_V5_COMMERCIAL = window.HALO_COMMERCIAL_EXTENSION;
})();
