/* Synthetic catalog only. Course access is separate from consumer membership tiers. */
(function(root,factory){const model=factory();if(typeof module==='object'&&module.exports)module.exports=model;else root.HaloAcademyHomeModel=model;})(typeof window==='object'?window:globalThis,function(){
  'use strict';
  const groups={all:'全部',product:'产品入门',life:'生活课堂',business:'经营提升'};
  const courses=[
    {id:'guide',title:'第一次使用 Halo Ring',category:'product',minRank:0,lessons:4,minutes:16,price:0,description:'从佩戴、连接到查看记录，按自己的节奏开始。'},
    {id:'life',title:'给自己一个放松的夜晚',category:'life',minRank:0,lessons:3,minutes:12,price:0,description:'基础视频示例：整理睡前环境，找到适合自己的放松习惯。'},
    {id:'features',title:'读懂产品功能与适用边界',category:'product',minRank:1,lessons:5,minutes:25,price:0,description:'了解当前款式的实际功能，用准确、易懂的方式介绍产品。'},
    {id:'qa',title:'客户常见问题 Q&A',category:'product',minRank:1,lessons:4,minutes:18,price:0,description:'连接、佩戴与记录缺失时，如何引导客户继续。'},
    {id:'policy',title:'代理合作制度与服务规范',category:'business',minRank:1,lessons:4,minutes:24,price:0,description:'了解合作流程、服务规范与问题反馈入口。不在课程页展示收益算法。'},
    {id:'ndo',title:'新经销商入门 NDO',category:'business',minRank:1,lessons:6,minutes:36,price:0,description:'从第一次产品介绍，到第一次客户服务。'},
    {id:'advanced',title:'把放松练习融入日常',category:'life',minRank:1,lessons:6,minutes:40,price:800,description:'进阶课程示例。使用现有会员 Halo Points 兑换，价格待正式配置。'},
    {id:'ip',title:'建立真实、清晰的个人表达',category:'business',minRank:1,lessons:5,minutes:30,price:0,description:'个人 IP 课程：围绕真实体验和产品事实进行内容表达。'},
    {id:'mba',title:'经营伙伴 MBA 课程',category:'business',minRank:3,lessons:8,minutes:90,price:null,description:'围绕经营计划、组织协作与客户服务展开。报名方式待发布。'},
    {id:'partner',title:'项目合伙人运营模式',category:'business',minRank:4,lessons:6,minutes:60,price:null,description:'梳理项目协作、经营支持与长期服务。报名方式待发布。'},
    {id:'emba',title:'项目合伙人 EMBA 课程',category:'business',minRank:4,lessons:8,minutes:120,price:null,description:'面向项目合伙人的进阶经营课程。报名方式待发布。'}
  ];
  const events=[
    {id:'online',title:'线上课堂：产品介绍与答疑',minRank:1,mode:'线上课程',date:'2026-09-18',time:'19:30–20:30',place:'App 内线上课堂',status:'待报名',description:'会务教学安排的线上课程，课程与老师信息以正式发布为准。'},
    {id:'offline',title:'经营者线下课程',minRank:3,mode:'线下课程',date:'2026-09-22',time:'14:00–17:00',place:'杭州 · 演示教学中心',status:'已报名',description:'线下教学场景示例；已有报名记录仅为模拟数据。'},
    {id:'operations',title:'产品运营 · 经销商大会',minRank:3,mode:'线下课程',date:'2026-10-10',time:'09:00–17:00',place:'地点待公布',status:'待发布',description:'日程与报名信息待发布。'},
    {id:'intensive',title:'经销商密集训练课',minRank:3,mode:'线下课程',date:'2026-10-16',time:'09:00–17:00',place:'地点待公布',status:'待发布',description:'集中训练课程示例。'},
    {id:'retreat',title:'两天一夜经营训练',minRank:3,mode:'线下课程',date:'2026-10-24',time:'两天一夜',place:'地点待公布',status:'待发布',description:'训练安排及报名信息待发布。'}
  ];
  const validRank=rank=>Number.isInteger(rank)&&rank>=0&&rank<=4;
  const eventDetails={
    online:{startsAt:'2026-09-18T19:30:00+08:00',endsAt:'2026-09-18T20:30:00+08:00',preparation:'提前检查网络和声音，准备好想了解的产品问题。',room:true},
    offline:{startsAt:'2026-09-22T14:00:00+08:00',endsAt:'2026-09-22T17:00:00+08:00',address:'杭州 · 演示教学中心，1 楼接待区（原型示例地点）',arrival:'请提前 15 分钟到场，向接待人员出示本页报名状态。实际地址以正式通知为准。'}
  };
  events.forEach(event=>Object.assign(event,eventDetails[event.id]||{}));
  const eventPhase=(event,now=Date.now())=>{
    if(event.status==='已取消')return 'cancelled';
    if(event.status==='待发布'||!Number.isFinite(Date.parse(event.startsAt))||!Number.isFinite(Date.parse(event.endsAt)))return 'unpublished';
    return now<Date.parse(event.startsAt)?'waiting':now<Date.parse(event.endsAt)?'live':'ended';
  };
  const available=(rank,category='all')=>validRank(rank)?courses.filter(c=>c.minRank<=rank&&(category==='all'||c.category===category)):[];
  const schedule=rank=>validRank(rank)?events.filter(c=>c.minRank<=rank):[];
  const canOpen=(rank,id)=>available(rank).some(c=>c.id===id)||schedule(rank).some(c=>c.id===id);
  const priceLabel=c=>c.price===0?'免费学习':Number.isSafeInteger(c.price)&&c.price>0?c.price.toLocaleString('zh-CN')+' Halo Points':'报名信息待发布';
  const panels={courses:'课程',learning:'我的学习',schedule:'课程安排',resources:'资料工具'};
  const chapters={
    guide:['准备好你的戒指','搜索并连接设备','认识记录页面','日常使用与求助'],
    life:['整理睡前环境','给自己留一段安静时间','回顾适合自己的习惯'],
    features:['了解当前款式','区分功能与体验','查看实际记录','说明功能边界','准确介绍产品'],
    qa:['连接前先核对','多个戒指如何区分','记录未更新怎么办','整理问题再求助'],
    policy:['了解合作流程','签署与生效状态','保护客户资料','服务问题如何反馈'],
    ndo:['认识产品','准备介绍资料','了解客户需要','完成首次介绍','协助开始使用','做好后续服务'],
    advanced:['找到日常练习时间','准备放松环境','留意自己的感受','调整练习安排','记录日常变化','形成适合自己的习惯'],
    ip:['梳理真实经历','选择表达主题','核对产品事实','保护他人隐私','回顾一次内容发布'],
    mba:['明确经营目标','制定服务计划','整理客户需求','安排团队分工','回顾服务质量','处理协作问题','改进经营计划','课程回顾'],
    partner:['认识项目角色','明确合作范围','整理服务资源','建立沟通节奏','处理协作问题','回顾项目进展'],
    emba:['明确长期目标','评估服务能力','制定经营计划','组织团队协作','建立服务标准','回顾项目进展','调整资源安排','学习总结']
  };
  const questions={
    guide:'尚未核实的产品功能，可以先向客户保证以后一定提供吗？',
    life:'每个人都必须采用完全相同的睡前安排吗？',
    features:'介绍产品时，可以把尚未支持的功能当成现有功能吗？',
    qa:'看到多个戒指时，可以不核对设备标识就直接连接吗？',
    policy:'合作协议还在待生效状态，可以对外宣称新身份已生效吗？',
    ndo:'客户尚未理解产品，可以直接替客户完成所有选择吗？',
    advanced:'练习让自己不舒服时，还必须按照原计划继续吗？',
    ip:'分享经验时，可以公开客户的身份和身体记录吗？',
    mba:'团队分工尚未确认，可以替所有成员承诺服务安排吗？',
    partner:'合作范围尚未明确，可以先对外保证项目结果吗？',
    emba:'服务能力尚未评估，可以先承诺超出能力的服务吗？'
  };
  const explanations={
    product:'不能承诺未确认的功能，也不能替客户跳过必要核对。请根据当前产品和页面提示操作。',
    life:'不必套用同一种安排。按自己的感受调整，觉得不合适时可以停止或改变安排。',
    business:'先核对事实、权限和合作状态；不替他人决定，不公开客户隐私，不作未经确认的承诺。'
  };
  const lesson=(c,index)=>({title:chapters[c.id]?.[index]||'课程回顾',body:c.description+' 本节练习：围绕“'+(chapters[c.id]?.[index]||'课程回顾')+'”，写下需要确认的问题、可以采取的步骤，以及遇到问题时的求助方式。'});
  const quiz=c=>({question:questions[c.id],answer:'no',explanation:explanations[c.category]});
  const fixture=full=>({version:1,filter:'all',expanded:false,panel:'courses',selected:'',detailMode:'overview',progress:full?{guide:2}:{}});
  const panelRoutes={courses:'AGT-07',learning:'ACA-04',schedule:'ACA-05',resources:'ACA-08'};
  const pageSpecs={
    'AGT-07':{name:'商学院首页',panel:'courses',parent:'AGT-05',route:'/me/academy',task:'查找课程并继续上次学习',data:'当前合作身份、课程分类、课节进度、积分余额',interaction:'分类筛选、查看课程、续学、切换四个栏目',exception:'暂无课程、积分未取得、学习记录读取失败'},
    'AGT-08':{name:'课程详情',kind:'course',mode:'overview',parent:'AGT-07 / ACA-04',route:'/me/academy/course/:courseId',task:'了解课程、目录与学习条件',data:'课程名称、介绍、课节、时长、进度、学习权益',interaction:'开始或继续课节、回顾已学内容、开始测评；积分课程先核对兑换',exception:'当前身份不可访问、权益未取得、课程未开放'},
    'ACA-01':{name:'课节学习',kind:'course',mode:'lesson',parent:'AGT-08',route:'/me/academy/course/:courseId/lesson/:lessonIndex',task:'阅读当前课节并主动确认完成',data:'课程、课节序号、图文演示、已完成进度',interaction:'完成本节后到下一节，最后一节完成后到 ACA-02；已学课节可回顾',exception:'重复完成不累计、跳节拦截、保存失败保留'},
    'ACA-02':{name:'课后测评',kind:'course',mode:'quiz',parent:'AGT-08',route:'/me/academy/course/:courseId/assessment',task:'回答当前课程的测评题目',data:'对应课程题目、已选答案、全部课节完成状态',interaction:'选择答案、提交后到 ACA-03；未作答提示，未学完返回课程',exception:'未学完、未作答、重复提交、记录冲突'},
    'ACA-03':{name:'测评结果',kind:'course',mode:'result',parent:'AGT-08',route:'/me/academy/course/:courseId/result',task:'查看通过或未通过结果及解释',data:'本课程结果、答案解释、学习记录',interaction:'通过后查看我的学习；未通过重新作答；回顾课程',exception:'尚无结果时返回课程，不伪造通过或授予身份'},
    'ACA-04':{name:'我的学习',panel:'learning',parent:'AGT-07',route:'/me/academy/learning',task:'查找已兑换课程、学习记录与报名活动',data:'已兑换未开始、学习中、待测评、已完成课程；本人报名和取消记录',interaction:'按状态筛选、开始或继续课程、查看报名、进入课程安排',exception:'没有学习或报名记录、保存与读取失败'},
    'ACA-05':{name:'课程安排',panel:'schedule',parent:'AGT-07',route:'/me/academy/schedule',task:'查看线上与线下活动安排',data:'活动名称、日期、时间、地点、开放状态',interaction:'选择活动进入 ACA-06',exception:'当前身份无安排、活动待发布'},
    'ACA-06':{name:'活动详情与报名',kind:'event',parent:'ACA-05 / ACA-04',route:'/me/academy/event/:eventId',task:'报名、准备参加、进入课堂或查看到场信息',data:'活动介绍、北京时间、地点、本人报名状态；待开课／进行中／已结束／课程取消；真实发布的回放状态',interaction:'开课前可报名或确认取消；已报名线上课开课后可进入课堂演示；线下查看到场信息；结束不自动生成学习记录',exception:'未报名不可进入、待发布／开课后／结束／取消不可新报名；无回放不显示播放入口；保存失败'},
    'ACA-07':{name:'资料详情',kind:'resource',parent:'ACA-08',route:'/me/academy/resource/:resourceId',task:'阅读资料，查看或下载 PDF 附件',data:'资料标题、正文、文件名、PDF 格式 / 页数 / 大小、已读状态',interaction:'查看 PDF 在新窗口打开，下载同一文件；标记已读独立操作，返回资料工具',exception:'无附件不显示文件按钮；无法预览时下载后打开；记录无法保存'},
    'ACA-08':{name:'资料工具',panel:'resources',parent:'AGT-07',route:'/me/academy/resources',task:'查阅服务资料或进入推广工具',data:'产品资料、服务沟通、订单售后指南、推广入口',interaction:'资料到 ACA-07；推广到共用 CHN-26，原路返回',exception:'合作身份未生效不可使用推广工具'}
  };
  function handoffFixture(sample){
    const seed={...fixture(true),selected:'guide',bookings:{offline:'booked'},answers:{},results:{},reads:[]};
    if(['ACA-02','ACA-03'].includes(sample))seed.progress.guide=4;
    if(sample==='ACA-03'){seed.answers.guide='no';seed.results.guide=true;}
    if(sample==='ACA-04'){seed.progress={guide:4,life:1,features:5};seed.results.guide=true;}
    if(sample==='ACA-06')seed.selected='online';
    if(sample==='ACA-07')seed.selected='materials';
    return seed;
  }
  return {groups,panels,courses,events,eventPhase,validRank,available,schedule,canOpen,priceLabel,fixture,lesson,quiz,panelRoutes,pageSpecs,handoffFixture};
});
