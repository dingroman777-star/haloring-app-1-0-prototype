/* Synthetic, account-owned fixtures. Only this separate team build loads them.
 * No real authentication, remote approval, payment, health measurement or rewards.
 * Seed ONCE after isolation; all later business edits use the existing controllers.
 */
(() => {
  'use strict';
  if (!/\/(?:index\.html)?$/.test(location.pathname)) return;
  const SCENES = {
    full: ['完整用户', 'TOD-01', '已激活 · L3 · 健康、订单与体验历史'],
    fresh: ['首次使用', 'ONB-01', '未登录 · 未绑定 · 真实空状态'],
    member: ['未绑定会员', 'MEM-01', 'L1 · 可用积分和公共内容 · 无身体数据'],
    pending: ['渠道审核中', 'CHN-11', '申请已提交 · 经营与提现门禁保留'],
    paused: ['渠道暂停', 'CHN-17', '历史保留 · 不可新增经营或提现'],
    terminated: ['渠道终止', 'CHN-17', '历史保留 · 终止身份门禁'],
    correction: ['积分待调整', 'PTS-02', '可用为 0 · 待调整 1,200 · 查看原因与申诉'],
    'studio-live': ['活动进行中', 'STU-04', '正在参加瑜伽 · 可结束、生成报告及查看奖励'],
  };
  let scene = new URL(location.href).searchParams.get('scene');
  if (!SCENES[scene]) scene = 'full';
  const MARKER = 'haloTeamFixtureV1';
  const stop = error => {
    window.HaloDemoSessionReady = false;
    for (const name of ['localStorage','sessionStorage']) Object.defineProperty(window,name,{configurable:true,get(){throw error;}});
    throw error;
  };
  if (!window.HaloDemoSessionReady) return stop(new Error('团队演示隔离尚未加载，请重新打开；旧记录未改变。'));
  const now = Date.now(), DAY = 86400000;
  const at = (days=0) => new Date(now - days*DAY).toISOString();
  const date = (days=0) => new Date(now + 8*3600000 - days*DAY).toISOString().slice(0,10);
  const week = () => { const d=new Date(now+8*3600000); d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7); return d.toISOString().slice(0,10); };
  const account = '13900000000', registration = at(240), recordScope = `${account}|${registration}`;
  const owner = {accountRef:account,ownerAccount:account,registrationId:registration,simulated:true};
  const wrap = row => ({...owner,...row});
  const tx = (id,title,amount,days,extra={}) => {const expiry=new Date(now-days*DAY);expiry.setUTCMonth(expiry.getUTCMonth()+24);return wrap({id,title,amount,offset:0,occurred_at:at(days),posted_at:at(days),expiresAt:expiry.toISOString(),detail:'团队演示记录',...extra});};

  function fixtures() {
    const app = {
      signedIn:true,authVerified:true,authPhone:account,memberCreatedAt:registration,newMember:false,
      authForm:{phone:account,termsAccepted:true,consentScope:'user-privacy-ai-2026-09-07'},
      agreementAcceptance:{acceptedAt:registration,scope:'user-privacy-ai-2026-09-07',simulated:true},
      connectionIntro:{completed:true,choice:'connect',permission:'granted'},
      devicePaired:true,deviceStatus:'connected',deviceLastSyncedAt:at(0),hardwareActivatedAt:at(230),
      pairedDevice:{id:'ring7a21',suffix:'7A21',name:'HALO RING · 7A21',signal:'strong'},
      deviceBindings:{ring7a21:{...owner,boundAt:at(230),activatedAt:at(230)}},
      basicProfile:{status:'completed',accountRef:account,recordScope},profileSaved:true,
      profile:{nickname:'林小满',birthday:'1994-06-18',height:'165',weight:'56',ownerAccount:account,recordScope},
      toggles:{legal:true,aiLegal:true,bluetooth:true,notification:true,rhythm:true,haloBody:true,memory:true,inspiration:true,trendRecords:true,studioHealth:true,studioActivity:true,wake:true,birthdayBenefit:true},
      dataLifecycle:'interpretable',bodyWeather:'slow',healthDemoRecordDate:date(),healthSelectedDate:date(),
      oxygenReviewScenario:'supported',temperatureReviewScenario:'supported',
      activeTab:'TOD-01',lastVisitedRoute:'TOD-01',tabStacks:{'TOD-01':['TOD-01']},
      personalAccountScope:{version:1,activeOwner:account,activeKey:recordScope,accounts:{},quarantine:{},legacyHealthOwner:account},
      todayRhythmScope:{version:1,activeAccount:account,activeKey:recordScope,memberCreatedAtSnapshot:registration,registrations:{[account]:registration},accounts:{},quarantine:{}},
      haloAccountScope:{version:1,activeOwner:account,accounts:{}},
      rhythmMode:'cycle',rhythmStatus:'recorded',rhythmSettingsSaved:true,rhythmSettingsConfirmedAt:at(35),
      rhythmSettings:{startDate:date(18),cycleLength:'29',duration:'5'},
      rhythmCycleData:{version:1,accounts:{[account]:{initialized:true,draft:null,events:[18,47,76].map(days=>({id:`TEAM-CYCLE-${days}`,ownerAccount:account,startDate:date(days),endDate:date(days-4),status:'ended',revision:at(days-4),source:'user-record'}))}}},
      rhythmRecords:Object.fromEntries([0,1,3,8,18,19,20,21,22].map((days,i)=>[date(days),{date:date(days),ownerAccount:account,recordScope,feeling:['还好','有点累','轻松'][i%3],note:['下班散步了二十分钟。','昨晚比平时晚睡。','今天想早点休息。'][i%3],savedAt:at(days),source:'user-record'}])),
      nightChoice:'scan',nightPlan:{mode:'custom',ids:['breath','scan'],recommendationId:''},playing:false,
      nightHistory:[1,2,4].map((days,i)=>({id:`TEAM-NIGHT-${i+1}`,ownerAccount:account,memberRegistrationId:registration,recordScope,
        title:i===1?'安静身体扫描':'呼吸与身体放松',contentId:i===1?'scan':'breath',status:'completed',stopReason:'completed',
        startedAt:new Date(now-days*DAY-(i===1?12:20)*60000).toISOString(),endedAt:at(days),positionSeconds:i===1?720:1200,
        tracks:i===1?[{id:'scan',title:'安静身体扫描',duration:12}]:[{id:'breath',title:'呼吸慢下来',duration:8},{id:'scan',title:'安静身体扫描',duration:12}],
        review:i===2?null:{saved:true,execution:'完成了',helpfulness:'有帮助',factors:[],note:'听完后更容易把注意力从工作上移开。',savedAt:at(days)},simulated:true})),
      conversations:[
        ['TEAM-CHAT-1','下班后想放松一下','active','下班后脑子还一直在想工作。','可以先选一段短呼吸引导。没有需要完成的目标，听几分钟也可以。'],
        ['TEAM-CHAT-2','周末安排','archived','周末想走走，但不想太累。','先选一段方便返回的路线。走到舒服的地方休息，按自己的感受决定要不要继续。'],
        ['TEAM-CHAT-3','今晚早点休息','active','今晚想早点休息。','可以先把明早要用的东西准备好，再把手机放远一点。']
      ].map(([id,title,status,user,assistant],i)=>({id,title,status,ownerAccount:account,createdAt:at(i+1),updatedAt:at(i+1),source:{kind:'none'},draft:'',messages:[{role:'user',text:user,at:at(i+1)},{role:'assistant',text:assistant,at:at(i+1)}]})),
      activeConversationId:'',chat:[],conversationStatus:'new',haloContext:'none',
      haloMemories:[{id:'TEAM-MEMORY-1',text:'工作日想在 23:15 前上床。',confirmed:true,confirmedAt:at(5),updatedAt:at(5),ownerAccount:account,sourceConversationId:'TEAM-CHAT-3'},{id:'TEAM-MEMORY-2',text:'更喜欢短一些、直接一些的建议。',confirmed:false,ownerAccount:account,sourceConversationId:'TEAM-CHAT-1'}],
      haloFeelingRecords:[['平静','散步后心情轻松了一些。'],['疲惫','今天开会比较多，想早点休息。']].map(([label,note],i)=>({id:`TEAM-HALO-FEELING-${i}`,label,note,text:`${label} · ${note}`,occurredAt:at(i+1),ownerAccount:account,source:'user-record'})),
      haloJourneyStore:{version:1,ownerAccount:account,accounts:{[account]:{selected:'boundary',records:{boundary:{id:'TEAM-PLAN-1',status:'active',startedAt:at(6),days:[date(5),date(3),date(1)],entries:[5,3,1].map(days=>({day:date(days),action:'睡前把工作消息关掉，安静待一会儿。',note:'留出这段时间后，感觉轻松些。',source:'user-record'})),note:'',previous:[],variant:0,missCount:0,reason:''}}}}},
      studioRecords:{},selectedStudioEventId:'yoga-evening',selectedStudioHistoryId:'yoga-evening',
      oxygenMeasurements:{legacyImported:true,accounts:{[account]:{request:null,records:[1,3,5].map(days=>({id:`TEAM-OXYGEN-${days}`,requestId:`TEAM-OXYGEN-Q-${days}`,ownerAccount:account,type:'oxygen',value:days===3?97:98,quality:'valid',occurredAt:at(days),completedAt:at(days),source:'prototype-demo',metrics:[['血氧',days===3?'97':'98','%']]}))}}},
    };
    const nights = Array.from({length:28},(_,i)=>({id:`TEAM-SLEEP-${i}`,date:date(28-i),status:'valid',postedAt:at(28-i),sleepMinutes:[402,427,415,440,432,417,428][i%7]}));
    app.healthReports={accounts:{[recordScope]:{ownerAccount:account,recordScope,
      ledger:{status:'ready',ruleVersion:'team-synthetic-v1',receivedAt:at(),nights},request:null,positions:{},view:{panel:'home',id:'',top:0},
      reports:[{id:'TEAM-REPORT-14',type:'first14',title:'我的首份 14 晚报告',status:'ready',range:{start:nights[0].date,end:nights[13].date},nights:nights.slice(0,14),generatedAt:at(13),ruleVersion:'team-synthetic-v1',simulated:true}]
    }}};
    const lastMonthDate=new Date(now+8*3600000);lastMonthDate.setUTCDate(1);lastMonthDate.setUTCDate(0);const lastMonth=lastMonthDate.toISOString().slice(0,7);
    const monthNights=nights.filter(n=>n.date.startsWith(lastMonth));
    if(monthNights.length)app.healthReports.accounts[recordScope].reports.push({id:'TEAM-REPORT-MONTH',type:'monthly',title:`${Number(lastMonth.slice(5))} 月健康回顾`,status:'ready',range:{start:lastMonth+'-01',end:lastMonthDate.toISOString().slice(0,10)},nights:monthNights,generatedAt:at(),ruleVersion:'team-synthetic-monthly-v1',simulated:true});
    for (const [id,title,days,duration,price,done] of [['yoga-evening','暮色舒展瑜伽',2,60,99,true],['pilates-morning','晨间核心普拉提',-5,50,0,false]]) {
      const start=new Date(now-days*DAY-duration*60000).toISOString(),end=at(days),bookingId=`TEAM-BOOK-${id}`,sessionId=`TEAM-SESSION-${id}`;
      const r=wrap({eventId:id,bookingId,booked:true,paid:true,paidAmount:price,paidAt:at(done?4:0),source:'app',refundStatus:'none',deletionStatus:'ready',
        eventSnapshot:{id,title,date:`${date(days).slice(5).replace('-','月')}日 · 演示场次`,startsAt:start,place:'Halo 体验室',duration,category:id==='yoga-evening'?'瑜伽':'普拉提',price,host:done?'Lin':'Mia',seats:6,cancellationHours:24},
        mode:'ring',activityConsent:true,healthConsent:true,contactConsent:false,sessionStarted:done,sessionDone:done,reportStatus:done?'generated':'waiting',benefitStatus:'pending',
        ...(done?{sessionId,sessionAccountRef:account,sessionScope:{eventId:id,bookingId},startedAt:start,completedAt:end,
          captureReceipt:{id:`CAP-${id}`,source:'prototype-fixture',status:'valid',eventId:id,bookingId,sessionId,accountRef:account,startedAt:start},
          completionSnapshot:{version:1,eventId:id,bookingId,sessionId,accountRef:account,completedAt:end,reportEligible:true,hardwareActive:true,captureReceiptId:`CAP-${id}`},
          beforeFeeling:'今天坐得有点久，想活动一下肩背。',beforeRecordScope:{eventId:id,bookingId},beforeSavedAt:start,beforeVersion:1,
          nextDayReport:{version:1,eventId:id,bookingId,sessionId,accountRef:account,completedAt:end,reportDate:date(days-1),sourceId:'TEAM-NEXT-DAY',generatedAt:at(days-1),simulated:true,status:'ready',
            sleep:{minutes:428,quality:'complete',sourceId:'TEAM-SLEEP-NEXT',startAt:`${date(days)}T23:15:00+08:00`,endAt:`${date(days-1)}T06:23:00+08:00`},bodyWeather:{label:'平衡日',date:date(days-1),sourceId:'TEAM-WEATHER-NEXT'},baseline:{ready:true,sourceId:'TEAM-SLEEP-BASELINE',sleepMinutes:415}},
          teamMeasurements:{simulated:true,heart:[68,74,70,76,71,68],breath:[16,16,15,14,15,14]}
        }:{} )});
      app.studioRecords[id]=r;
    }
    const address=wrap({id:'team-address',name:'演示用户',phone:account,detail:'上海市静安区演示路 88 号（虚构地址）',isDefault:true});
    const commerce={...owner,__commercialScope:{accountRef:account,registrationId:registration},pointsBalance:12960,pendingPointsCorrection:0,pointsMode:'normal',
      memberAssets:wrap({level:'Halo Signature（L3）',growth:2060,badges:2,effectiveAt:at(8),formalCocreationVerified:false,deepCocreationVerified:false}),
      ownedCouponIds:['member'],coupons:[wrap({id:'team-discount',title:'精选体验折扣券（展示示例）',kind:'discount',discountRate:0.9,status:'available',expiresAt:at(-30),usage:'适用范围与使用入口待产品确认，仅展示券形态。',rules:['这是折扣券的界面示例，不新增正式结算规则。']})],couponSelected:false,pointsUsed:false,addresses:[address],selectedAddress:address.id,selectedAddressSnapshot:address,
      cartLines:[{productId:'ring',skuId:'ring-white-8',quantity:1},{productId:'mask',skuId:'mask-grey-standard',quantity:1}],
      checkoutLines:[{productId:'ring',skuId:'ring-white-8',quantity:1}],checkoutOrigin:'buy-now',selectedProductId:'ring',selectedTaskId:'wear-12h',redemptionStatus:'ready',
      selectedRedemptionId:'studio-public-session-pass',pointsRedemptionOffers:{'studio-public-session-pass':{status:'open',cost:6000,stock:20,endsAt:at(-30),voucherValidityDays:30,activityId:'team-studio-repeat',redemptionPolicy:'repeat',simulated:true,usage:'适用的 Halo Studio 公开体验，预约时选择使用。',returns:'未使用时按活动规则处理；本原型仅演示。'}},
      taskStates:{'wear-12h':'posted','night-repair':'posted','weekly-feedback':'posted','wear-5days':'available','monthly-review':'posted'},
      taskPeriods:{'wear-12h':date(),'night-repair':date(),'weekly-feedback':week(),'wear-5days':week(),'monthly-review':date().slice(0,7)},
      taskProgress:{'wear-5days':wrap({periodKey:week(),unit:'days',value:1,updatedAt:at()})},
      badgeDetails:wrap({updatedAt:at(),items:[['companionship',{wearDays:142},false],['repair',{repairs:60},true],['understanding',{weeklyFeedbacks:8,monthlyReviews:2},false],['participation',{participations:6},true],['contribution',{contributions:1,interviews:0},false]].map(([id,progress,earned])=>wrap({id,progress,status:earned?'earned':'in_progress',...(earned?{receiptId:`TEAM-BADGE-${id}`,awardedAt:at(10)}:{})}))}),
      referralSnapshot:wrap({year:Number(date().slice(0,4)),updatedAt:at(),awardedCount:1,share:{status:'unavailable'},records:[{id:'TEAM-REF-1',status:'rewarded',createdAt:at(20),receipt:{id:'TEAM-REF-RECEIPT',points:20000,growth:150,postedAt:at(18)}},{id:'TEAM-REF-2',status:'activation',createdAt:at(2)},{id:'TEAM-REF-3',status:'verifying',createdAt:at(1)}]}),
      pointsTransactions:[tx('TEAM-REF-RECEIPT','有效推荐奖励',20000,18),tx('redemption:team-studio','Studio 体验兑换',-6000,12,{itemId:'studio-public-session-pass',requestId:'TEAM-REDEEM-1',activityId:'team-studio-repeat',balanceAfter:14000}),tx('order:TEAM-ORDER-RING:points','购物积分抵扣',-1200,10),tx('order:TEAM-ORDER-MASK:points','购物积分抵扣',-120,6),tx(`task:wear-12h:${date()}:reward`,'有效佩戴 12 小时',20,0,{growth:8}),tx(`task:night-repair:${date()}:reward`,'AI 睡前修复',10,0,{growth:4}),tx(`task:weekly-feedback:${week()}:reward`,'周报告反馈',50,0,{growth:15}),tx(`task:monthly-review:${date().slice(0,7)}:reward`,'月度状态回顾',100,0,{growth:30})],
      vouchers:[wrap({id:'voucher:studio-public-session-pass:TEAM-REDEEM-1',itemId:'studio-public-session-pass',requestId:'TEAM-REDEEM-1',title:'Studio 公开体验券',status:'available',issuedAt:at(12),expiresAt:at(-18),activityId:'team-studio-repeat'})],orders:[],afterSales:[],studioAwards:[],
    };
    for(const row of commerce.pointsTransactions)if(row.id.startsWith('order:'))row.id+='-used';
    const studio=app.studioRecords['yoga-evening'],rewardId=`studio:${studio.bookingId}:reward`;
    commerce.pointsTransactions.push(tx(rewardId,'Studio 参与奖励',100,2,{growth:40,eventId:'yoga-evening',bookingId:studio.bookingId}));
    commerce.pointsTransactions.sort((a,b)=>Date.parse(a.posted_at)-Date.parse(b.posted_at));
    let running=0;for(const row of commerce.pointsTransactions){running+=row.amount;row.balanceAfter=running;}
    commerce.studioAwards=[wrap({version:1,eventId:'yoga-evening',bookingId:studio.bookingId,transactionId:rewardId,occurred_at:studio.completedAt,posted_at:at(2),points:100,growth:40,offset:0,available:100})];
    commerce.teamPointsExpiry={simulated:true,remaining:commerce.pointsBalance,earliestAt:commerce.pointsTransactions[0].expiresAt};
    for(const [id,productId,title,skuId,specification,price,pointsUsed,days] of [['TEAM-ORDER-RING','ring','HALORING 智能戒指','ring-white-8','瓷白 · 8 号',2999,1200,10],['TEAM-ORDER-MASK','mask','夜间舒缓眼罩','mask-grey-standard','柔雾灰 · 标准款',399,120,6]]) {
      commerce.orders.push(wrap({id,productId,title,specification,quantity:1,subtotal:price,coupon:0,pointsAmount:pointsUsed/100,pointsUsed,payable:price-pointsUsed/100,
        lines:[{productId,skuId,title,specification,quantity:1,price,unitPrice:price,subtotal:price}],address:`${address.name} · ${address.phone} · ${address.detail}`,addressSnapshot:address,
        shippingAmount:0,deliverySnapshot:{status:'ready',feeCents:0,shipping:'演示配送记录',simulated:true},attribution:'direct',attributionReason:'Halo Select 直接进入',paymentMethod:'全款支付',checkoutOrigin:'buy-now',status:'paid',paymentResult:'success',createdAt:at(days+1),paidAt:at(days),pointsApplied:true}));
    }
    commerce.selectedOrderId=commerce.orders[0].id;commerce.orderSnapshot=commerce.orders[0];
    commerce.afterSales=[wrap({id:'AS-TEAM-ORDER-MASK',order:structuredClone(commerce.orders[1]),type:'退货退款',reason:'商品与描述不符',note:'演示售后：希望申请退货。',status:'reviewing',submittedAt:at(4),updatedAt:at(3)})];commerce.afterSaleSnapshot=commerce.afterSales[0];commerce.afterSaleStatus='reviewing';
    const applicationId='TEAM-ADV-1',decision={id:'TEAM-APPROVAL',applicationId,status:'approved',decidedAt:at(60),simulated:true};
    const scope=JSON.stringify([account,'account',applicationId,'自然人',decision,'agreement-demo-v1']);
    const agreement={version:'agreement-demo-v1',acknowledgedAt:at(59),simulated:true},settlement={holder:'演示用户',bank:'演示银行',last4:'8821',subject:'自然人',simulated:true};
    const request={id:'TEAM-ACTIVATION',applicationId,scope,status:'completed',completedAt:at(59),agreement,account:settlement,tax:{subject:'自然人',simulated:true},simulated:true};
    Object.assign(commerce,{channelOwnerAccount:account,applicationStatus:'approved',channelIdentity:'active',channelMode:'established',channelAvailableCents:120000,
      applicationSnapshot:{ownerAccount:account,id:applicationId,region:'杭州市',experience:'内容与社群',payeeType:'自然人',submittedAt:at(65),reviewDecision:decision},
      completedCourses:['product','health','orders'],assessmentAnswers:{product:'no',health:'no',orders:'no'},assessmentPassed:true,trainingApplicationId:applicationId,activationReady:true,channelAgreementConfirmed:true,activationRequest:{...request,mock:true},
      channelActivation:{version:1,scope,applicationId,agreement,account:settlement,tax:request.tax,confirmed:true,request,reviewReceipt:{id:'TEAM-ACTIVATION-RECEIPT',requestId:request.id,applicationId,agreementSigned:true,settlementReady:true,releaseReady:true,completedAt:at(59),simulated:true}},
      selectedEarningId:'HR20260901018',selectedPolicyId:'health',withdrawals:[{id:'TEAM-WD-1',status:'paid',amountCents:10000,submittedAt:at(7),returnedCents:0,receipt:{id:'TEAM-WD-RECEIPT',withdrawalId:'TEAM-WD-1',status:'paid',amountCents:10000,postedAt:at(6),simulated:true}}]});
    let hardware='active';
    if(scene==='member'){
      hardware='never-bound';Object.assign(app,{devicePaired:false,deviceStatus:'disconnected',pairedDevice:null,deviceBindings:{},hardwareActivatedAt:'',dataLifecycle:'none',healthReports:{accounts:{}},studioRecords:{},nightHistory:[],conversations:[],haloMemories:[],rhythmRecords:{},rhythmMode:'record-only',rhythmStatus:'empty'});
      app.connectionIntro={completed:true,choice:'skipped',permission:'not-requested'};app.personalAccountScope.legacyHealthOwner='';
      Object.assign(commerce,{memberAssets:wrap({level:'Halo Member（L1）',growth:0,badges:0}),badgeDetails:null,taskStates:{},taskPeriods:{},channelIdentity:'inactive',applicationSnapshot:null,applicationStatus:'none',channelActivation:null,channelAvailableCents:0,withdrawals:[]});
      // Unbound assets contain no historical growth or hardware-task rewards.
      commerce.pointsTransactions=commerce.pointsTransactions.filter(t=>!t.id.startsWith('task:')&&!t.id.startsWith('studio:'));commerce.studioAwards=[];
      let balance=0;for(const row of commerce.pointsTransactions){balance+=row.amount;row.balanceAfter=balance;}
      commerce.pointsBalance=12680;commerce.referralSnapshot.records[0].receipt.growth=0;
      commerce.teamPointsExpiry.remaining=12680;app.oxygenMeasurements={legacyImported:true,accounts:{}};app.rhythmCycleData={version:1,accounts:{}};
    }
    if(scene==='pending'){Object.assign(commerce,{channelIdentity:'application',applicationStatus:'reviewing',channelActivation:null,activationRequest:null,activationReady:false,channelAgreementConfirmed:false,channelAvailableCents:0,withdrawals:[]});commerce.applicationSnapshot.reviewDecision=null;commerce.applicationSnapshot.reviewSubmittedAt=at(2);}
    if(scene==='paused'||scene==='terminated')commerce.channelIdentity=scene;
    if(scene==='studio-live'){
      const r=app.studioRecords['yoga-evening'];r.sessionDone=false;r.startedAt=new Date(now-15*60000).toISOString();r.completedAt=null;r.completionSnapshot=null;r.nextDayReport=null;r.teamMeasurements=null;r.reportStatus='waiting';r.eventSnapshot.startsAt=r.startedAt;r.eventSnapshot.date=`${date().slice(5).replace('-','月')}日 · 进行中演示场次`;r.captureReceipt.startedAt=r.startedAt;
      commerce.studioAwards=[];commerce.pointsTransactions=commerce.pointsTransactions.filter(t=>!t.id.startsWith('studio:'));commerce.pointsBalance=12860;let n=0;for(const t of commerce.pointsTransactions){n+=t.amount;t.balanceAfter=n;}
      commerce.teamPointsExpiry.remaining=12860;
    }
    if(scene==='correction'){
      commerce.pointsTransactions.push(tx('TEAM-REVERSAL','重复奖励调整',-14160,0,{correction:true,reason:'演示：系统重复记入的奖励已调整',detail:'关联任务 TEAM-TASK-REVIEW · 可联系企业微信申诉',pendingCorrectionAfter:1200,balanceAfter:0}));
      commerce.pointsBalance=0;commerce.pendingPointsCorrection=1200;commerce.pointsMode='pending';
    }
    const records=[1,3,5].map((days,i)=>({id:`TEAM-RECORD-${i}`,label:['还好','有点累','有精神'][i],labels:[['还好','有点累','有精神'][i]],note:['今天午后散步了。','昨晚睡得晚，今天早点休息。','早上精神不错。'][i],ownerAccount:account,recordScope,date:date(days),createdAt:at(days),occurredAt:at(days),source:'user-record',simulated:true}));
    return {app,commerce,hardware,records};
  }
  try {
    const previous=JSON.parse(localStorage.getItem(MARKER)||'null');
    if(previous){scene=SCENES[previous.scene]?previous.scene:'full';const u=new URL(location.href);u.searchParams.set('scene',scene);history.replaceState(history.state,'',u);}
    else {
      // A partially seeded partition is never silently re-initialized over edits.
      if(localStorage.getItem('haloV5AppProgress')) throw new Error('这轮记录已存在，请从团队演示台开启新场景。');
      if(scene!=='fresh'){
        const f=fixtures();
        localStorage.setItem('membershipHardwareState',f.hardware);
        localStorage.setItem('haloSubjectiveRecords',JSON.stringify(f.records));
        localStorage.setItem('haloV5CommercialProgress',JSON.stringify(f.commerce));
        localStorage.setItem('haloV5AppProgress',JSON.stringify(f.app));
      }
      localStorage.setItem(MARKER,JSON.stringify({version:1,scene,seededAt:at(),simulated:true}));
    }
  } catch(error){return stop(error);}
  window.HALO_TEAM_DEMO={scene,scenes:SCENES,simulated:true};
  document.addEventListener('DOMContentLoaded',()=>{
    const stage=document.querySelector('.stage');
    const panel=document.createElement('section');panel.className='team-demo-panel';panel.setAttribute('aria-label','团队演示台（非 App 界面）');
    panel.innerHTML='<div class="team-demo-title"><span>TEAM PREVIEW</span><strong>团队全貌演示版</strong><small>全为虚构数据 · 不发送短信、不付款、不连接真实硬件</small></div><div class="team-demo-controls"><label>演示场景 <select id="team-scene"></select></label><button id="team-open">开启新场景</button><button id="team-catalog">页面全貌</button></div><p id="team-scene-note"></p>';
    const placement=matchMedia('(max-width:760px)');
    function placePanel(){if(placement.matches)(stage||document.querySelector('.workspace')).prepend(panel);else(document.querySelector('.brand-lockup')||stage).append(panel);}
    placePanel();placement.addEventListener('change',placePanel);
    const select=panel.querySelector('select');for(const[id,[name]]of Object.entries(SCENES)){const o=document.createElement('option');o.value=id;o.textContent=name;select.append(o);}select.value=scene;
    panel.querySelector('#team-scene-note').textContent=`当前：${SCENES[scene][2]}。刷新保留操作；新场景保留本轮记录。`;
    panel.querySelector('#team-open').onclick=()=>{const u=new URL(location.href);const selected=select.value;u.search='';u.searchParams.set('demo','new');u.searchParams.set('demoPrevious',new URL(location.href).searchParams.get('demo'));u.searchParams.set('scene',selected);u.hash=SCENES[selected][1];location.assign(u);};
    const catalog=document.createElement('dialog');catalog.className='team-catalog';catalog.innerHTML='<header><h2>页面全貌</h2><button id="team-catalog-close">关闭</button></header><p>目录是团队审阅入口，不替代 App 内自然入口。受登录、活动与渠道身份限制的页面仍执行原门禁。</p><div id="team-page-count"></div><div id="team-page-list"></div>';
    document.body.append(catalog);catalog.querySelector('#team-catalog-close').onclick=()=>catalog.close();
    panel.querySelector('#team-catalog').onclick=()=>{
      const pages=window.HALO_V5_PAGES||[],aliases=['AUTH-02','TOD-04'],groups=[...new Set(pages.map(p=>p.group))];
      catalog.querySelector('#team-page-count').textContent=`${pages.length} 个页面 ID · ${pages.length-aliases.length} 个独立页面（另含 ${aliases.join(' / ')} 兼容入口）· ${Object.keys(SCENES).length} 个演示场景`;
      const list=catalog.querySelector('#team-page-list');list.replaceChildren();
      for(const group of groups){const sec=document.createElement('section'),h=document.createElement('h3');h.textContent=group;sec.append(h);for(const p of pages.filter(p=>p.group===group)){const b=document.createElement('button');b.textContent=`${p.id} · ${p.name}${aliases.includes(p.id)?'（兼容）':''}`;b.onclick=()=>{catalog.close();const rail=document.querySelector(`[data-page="${p.id}"]`);if(rail?.tagName==='BUTTON')rail.click();else location.hash=p.id;};sec.append(b);}list.append(sec);}catalog.showModal();
    };
    const note=document.querySelector('.prototype-note');if(note)note.textContent='团队全貌演示 · 数据全部虚构 · 当前操作仅保存在本轮浏览器演示中';
    const demoNew=document.getElementById('demo-new');if(demoNew){demoNew.textContent='保留进度，重新开始完整演示';demoNew.onclick=()=>{const u=new URL(location.href);u.search='';u.searchParams.set('scene','full');u.searchParams.set('demo','new');u.searchParams.set('demoPrevious',new URL(location.href).searchParams.get('demo'));u.hash='TOD-01';location.assign(u);};}
    const back=document.getElementById('demo-previous'),prior=new URL(location.href).searchParams.get('demoPrevious');if(back&&/^[a-f0-9]{32}$/.test(prior||''))back.onclick=()=>{const u=new URL(location.href);u.search='';u.searchParams.set('demo',prior);u.hash='SYS-01';location.assign(u);};
  });
})();
