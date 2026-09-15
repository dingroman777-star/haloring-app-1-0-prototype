/* Confirmed team prototype UI. Never changes the original application or settlement store. */
(() => {
  'use strict';
  const query = new URLSearchParams(location.search);
  if (query.get('partnerUI') !== 'review') return;
  const base = window.HALO_COMMERCIAL_EXTENSION, M = window.HaloPartnerReviewModel;
  const navigation=window.HaloPartnerNavigation;
  const scenario = query.get('partnerCase') || 'application';

  const defs = [
    ['AGT-01','合作签约','阅读、勾选与电子签署，不能跳过签署进入审核通过'],
    ['AGT-02','阅读合作协议','各等级独立协议；阅读不代表同意'],
    ['AGT-03','电子签署','第三方电子签署的本地模拟，不调用真实服务'],
    ['AGT-04','签约与生效进度','签署完成、待审核、待生效及身份生效分开'],
    ['AGT-05','代理中心','仅展示各状态汇总金额；不展示比例与计算过程'],
    ['AGT-06','我的团队','L4 分列 L3/L2；L3 分列 L2/L1，仅本人团队'],
    ['AGT-07','商学院','内容、课程、测评、资料和工具统一留在 App'],
    ['AGT-08','商学院内容','内容阅读、课程学习与测评交互'],
    ['AGT-09','主体认证','L3/L4 企业或个体工商户主体与授权签署人核验'],
    ['AGT-10','收款资料确认','签约审核通过后保留原收款与税务核验门槛'],
    ['AGT-11','合作协议与晋升','同一入口管理当前身份、单次晋升、申请进度和历史协议']
  ];
  window.HALO_V5_PAGES.push(...defs.map(([id,name,note]) => ({ id,name,note,function:note,group:'渠道经营',priority:'P0',route:`/me/partner/${id.toLowerCase()}`,parent:'CHN-11 / AGT-05',data:'独立虚构场景；不修改原申请、会员积分或结算账本',interaction:note,logic:'签署回执、审核结果、生效回执分别驱动状态；场景隔离、刷新续办',exception:'取消签署、认证未通过、储存失败、旧页冲突均保留记录',sdk:'第三方签署与主体核验尚未接入',rules:'内部审阅，不代表生产发布或收益计算调整',owner:'产品 / UI / 研发 / QA' })));
  let context = {}, data = null, storageKey = '', stamp = '', error = '', selection = 'welcome';
  for(let i=window.HALO_V5_PAGES.length-1;i>=0;i--)if(navigation.retired[window.HALO_V5_PAGES[i].id])window.HALO_V5_PAGES.splice(i,1);
  for(const item of window.HALO_V5_PAGES){
    if(item.id.startsWith('AGT-'))item.parent=({'AGT-01':'AGT-11 / CHN-06','AGT-02':'AGT-01','AGT-03':'AGT-01','AGT-05':'MY-01','AGT-08':'AGT-07','AGT-09':'AGT-01','AGT-10':'AGT-04'})[item.id]||'AGT-05';
    if(item.id==='CHN-23')Object.assign(item,{parent:'AGT-05',name:'提现与提现记录',note:'首次录入银行与收款账号，主体自动带出；保存后仅联系客服修改；核对金额并提交，返回代理中心'});
    if(item.id==='CHN-26')Object.assign(item,{parent:'AGT-07',group:'商学院'});
    if(['CHN-12','CHN-13','CHN-14'].includes(item.id))item.parent='AGT-04';
  }
  for(const id of ['CHN-20']){
    const item=window.HALO_V5_PAGES.find(p=>p.id===id);
    if(item)Object.assign(item,{name:'服务订单',route:'/me/channel/orders',parent:'AGT-05',function:'只读查看服务订单与设备激活进度',note:'不再打开订单详情；无单笔收益、公式或比例',data:'订单编号、商品与服务状态',interaction:'筛选与返回代理中心',logic:'仅本人可见记录；不改账本与后台算法'});
  }
  const e = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const action = (label, event, secondary=false, disabled=false) => `<button class="${secondary?'p-secondary':'p-primary'}" data-action="partner:${e(event)}" ${disabled?'disabled':''}>${e(label)}</button>`;
  const route = (label,id,secondary=false) => action(label,`go:${id}`,secondary);
  const row = (title,desc,event) => `<button class="p-row" data-action="partner:${e(event)}"><span><b>${e(title)}</b><small>${e(desc)}</small></span><span class="p-arrow" aria-hidden="true">›</span></button>`;
  const note = (text,warn=false) => `<div class="p-note${warn?' warn':''}"><p>${e(text)}</p></div>`;
  const facts = pairs => `<dl class="p-facts">${pairs.map(([k,v])=>`<div><dt>${e(k)}</dt><dd>${e(v)}</dd></div>`).join('')}</dl>`;
  const title = (text,kicker='HALO PARTNER',back='AGT-05') => `<button class="p-back" data-action="partner:go:${back}" aria-label="返回">← 返回</button><span class="p-kicker">${kicker}</span><h1>${e(text)}</h1>`;
  const rankMark = rank => `<span class="p-rank"><b>${e(M.rankName(rank))}</b><small lang="en">${e(M.rankEnglish(rank))}</small></span>`;
  const restricted = () => ['paused','terminated'].includes(base.state.channelIdentity);
  const active = () => !restricted() && Number.isInteger(data?.level) && data.level >= 1 && data.level <= 4;
  const orderRoute = id => id==='CHN-20';
  const orderRecords = () => {
    if (!active()) return [];
    try {
      const records = base.getPartnerOrderRecords?.();
      if (!Array.isArray(records) || records.some(r => !r || typeof r.id !== 'string' || typeof r.title !== 'string' || typeof r.progress !== 'string')) return null;
      return records;
    } catch { return null; }
  };
  function ordersPage() {
    const head = title('服务订单','HALO PARTNER','AGT-05');
    if (!active()) return `${head}${note('代理身份尚未生效，暂不能查看服务订单。')}${route('查看申请进度',scenario==='application'?'AGT-04':'CHN-01')}${route('返回我的','MY-01',true)}`;
    const records = orderRecords();
    if (!records) return `${head}${note('订单记录暂未取得，请重试。已有记录没有被清空。',true)}${action('重新获取','refresh')}${route('返回代理中心','AGT-05',true)}`;
    const filter = data.orderFilter === 'activated' ? 'activated' : 'all';
    const shown = filter === 'activated' ? records.filter(r=>r.progress==='设备已激活') : records;
    return `${head}<p>查看你负责的服务订单与设备激活进度。</p><div class="p-grid"><div class="p-stat"><span>服务订单</span><strong>${records.length} 笔</strong></div><div class="p-stat"><span>设备已激活</span><strong>${records.filter(r=>r.progress==='设备已激活').length} 笔</strong></div></div><div class="p-tabs" aria-label="服务订单筛选">${[['all','全部'],['activated','设备已激活']].map(([id,label])=>`<button data-action="partner:order-filter:${id}" aria-pressed="${filter===id}">${label}</button>`).join('')}</div><section aria-label="服务订单列表">${shown.map(r=>`<article class="p-card p-order"><span class="p-order-top"><small>订单 ${e(r.id)}</small></span><strong>${e(r.title)}</strong><span class="p-pill">${e(r.progress)}</span></article>`).join('')||`<div class="p-card"><h2>${records.length?'暂无符合条件的订单':'暂无服务订单'}</h2><p>${records.length?'换个筛选条件看看。':'产生服务订单后，会在这里显示。'}</p>${records.length?action('查看全部','order-filter:all',true):''}</div>`}</section>${route('查看经营首页','AGT-05',true)}${route('订单有疑问？联系客服','HELP-03',true)}`;
  }
  const totals = () => {
    const ledger = base.getPartnerLedger?.(context);
    if (!ledger?.healthy) return [null,null,null,null];
    return [ledger.pendingCents,ledger.availableCents,ledger.processing,ledger.rows.filter(r=>r.status==='paid').reduce((sum,r)=>sum+r.amountCents,0)];
  };
  const origin = () => base.state.applicationSnapshot;
  const eligibleForReview = session => Boolean(session.signedIn && origin()?.id && origin()?.ownerAccount===session.accountRef &&
    (base.partnerPrerequisites ? base.partnerPrerequisites(context) : ['reviewing','approved'].includes(base.state.applicationStatus)));
  function load(ctx) {
    context = {...context,...ctx};
    const session = context.applicationContext?.() || {};
    const prepared = base.preparePartner?.(context) !== false;
    const key = `haloPartnerReviewV1:${scenario}:${session.accountRef || 'visitor'}:${['application','member'].includes(scenario)?origin()?.id||'missing':'fixture'}`;
    storageKey = key;
    try {
      const raw = localStorage.getItem(key);
      if (!prepared) throw new Error('channel-unavailable');
      const next = M.normalize(raw ? JSON.parse(raw) : eligibleForReview(session) ? M.initialForCase(scenario) : M.initial());
      if(!next.application&&eligibleForReview(session))next.application={...origin()};
      if (next.schema !== 1 || !Number.isInteger(next.revision) || !Array.isArray(next.contracts)) throw new Error('invalid');
      data = next; selection=content[next.selectedContent]?next.selectedContent:'welcome'; stamp = raw || ''; return true;
    } catch { data = null; error='本轮进度暂时无法读取。请刷新重试，旧记录没有被清空。'; return false; }
  }
  // Read-only identity projection shared by all old/new routes; never rewrites application history.
  base.partnerStatus = ctx => {
    if (!load(ctx || context)) return {active:false,eligible:false,title:'合作记录暂未取得',detail:'请重新读取，原记录仍保留。',label:'重新读取',route:'AGT-04'};
    const eligible=eligibleForReview(context.applicationContext?.()||{}), isActive=eligible&&active();
    const currentContract=data.contracts.at(-1);
    const currentParty=data.activeParty||currentContract?.party||M.party({...data,target:data.level});
    return {eligible,active:isActive,level:isActive?data.level:0,historical:eligible&&data.level>0,stage:({reading:'signing',signing:'signing','entity-pending':'signing',reviewing:'reviewing',pending:'approved',rejected:'rejected',amending:'needs-info',withdrawn:'withdrawn'})[data.phase],
      title:restricted()?'合作已暂停或终止':isActive?M.rankLabel(data.level)+' 身份已生效':'合作身份尚未生效',
      detail:isActive?'身份已生效，可查看服务订单与经营记录。':'请从当前申请进度继续，签署和审核均不等于身份生效。',
      label:isActive?'进入代理中心':'查看申请进度',route:isActive?'AGT-05':eligible?resume():'CHN-01',
      scope:JSON.stringify([context.applicationContext?.().accountRef,origin()?.id,currentContract?.id||'pending',data.level,currentParty.key]),
      payeeKey:JSON.stringify([context.applicationContext?.().accountRef,origin()?.id,currentParty.key,currentParty.subject,currentParty.holder]),
      account:isActive?{holder:currentParty.holder,bank:'演示银行',last4:'8821',subject:currentParty.subject,simulated:true}:null};
  };
  function commit(next) {
    try {
      if ((localStorage.getItem(storageKey)||'') !== stamp) throw new Error('conflict');
      localStorage.setItem(storageKey,JSON.stringify(next)); data=next; stamp=JSON.stringify(next); error=''; return true;
    } catch { error='进度未保存或已在其他窗口更新。请刷新核对后继续，原记录仍保留。'; context.render?.(); return false; }
  }
  function steps() {
    const phase=data.phase, current=['reading','entity-pending'].includes(phase)?0:phase==='signing'?1:['reviewing','rejected'].includes(phase)?2:phase==='pending'?3:4;
    return `<ol class="p-steps" aria-label="签约与生效步骤">${['阅读确认','电子签署','申请审核','等待生效','身份生效'].map((s,i)=>`<li class="${i<current?'done':i===current?'current':''}" data-step="${i<current?'✓':i+1}" ${i===current?'aria-current="step"':''}>${s}</li>`).join('')}</ol>`;
  }
  const application = () => data.application||origin()||{};
  const payoutReady = () => data.payout==='verified'&&data.payoutSubject===M.subject(data);
  function correctionFields(){
    const a=data.correctionDraft||application(),company=window.HaloPartnerParty.company(a);
    const regions=window.HaloServiceRegions,select=(key,label,options)=>`<label for="partner-correct-${key}">${label}</label><select id="partner-correct-${key}" class="p-select"><option value="">请选择</option>${options.map(([value,name])=>`<option value="${e(value)}" ${value===a[key]?'selected':''}>${e(name)}</option>`).join('')}</select>`;
    return `<div class="p-card"><h2>更正申请资料</h2><p>主体信息变化后需要重新签署；原资料与签署回执会保留。</p>${data.target<3?`<label for="partner-correct-payeeType">申请身份</label><select id="partner-correct-payeeType" class="p-select"><option value="自然人" ${!company?'selected':''}>个人</option><option value="企业或个体工商户" ${company?'selected':''}>公司／个体工商户</option></select>`:''}${(company?[['companyName','公司／个体工商户名称',100],['taxNumber','税号／统一社会信用代码',20]]:[['personName','姓名',80],['idNumber','身份证号码',18]]).map(([key,label,max])=>`<label for="partner-correct-${key}">${label}</label><input id="partner-correct-${key}" class="p-select" value="${e(a[key]||'')}" maxlength="${max}" autocomplete="off">`).join('')}${regions?select('province','省／自治区／直辖市',regions.provinces.map(p=>[p.code,p.name]))+select('city','城市／地区',regions.forProvince(a.province).map(c=>[c.code,c.name]))+select('experience','相关经验／行业',(window.HALO_CHANNEL_APPLICATION?.industries||[]).map(x=>[x,x])):''}<p id="partner-correction-hint" role="status">${e(window.HaloPartnerParty.missing(a))}</p><p>仅使用虚构资料，勿填写真实证件信息。</p></div>`;
  }
  function applicationPage(){
    const a=application(),company=window.HaloPartnerParty.company(a);
    return `${title('申请资料','合作申请','AGT-04')}<div class="p-card">${facts([['申请编号',a.id],['申请身份',company?'公司／个体工商户':'个人'],[company?'主体名称':'姓名',company?a.companyName:a.personName],[company?'税号':'身份证号码',window.HaloPartnerParty.mask(company?a.taxNumber:a.idNumber)],['服务地区',a.region||'未记录'],['相关经验',a.experience||'未记录'],['资料版本',String((a.revision||0)+1)]])}</div>${data.phase==='rejected'?action('更正资料或补充说明','amend'):route('返回申请进度','AGT-04')}${data.history?.some(h=>h.application)?`<details class="p-card"><summary>历史申请与签署记录</summary>${data.history.filter(h=>h.application).map(h=>facts([['记录时间',h.at],['原主体名称',h.application.companyName||h.application.personName||'未记录'],['原签署回执',h.receipt?.id||'未签署']])).join('')}</details>`:''}`;
  }
  const agreementName = () => `${M.rankLabel(data.target)} 合作协议`;
  const resume = () => data.phase==='reading'?'AGT-01':data.phase==='signing'?'AGT-03':data.phase==='entity-pending'?'AGT-09':data.phase==='amending'?'CHN-12':'AGT-04';
  function signingHome() {
    if (!['reading','entity-pending'].includes(data.phase)) return progressPage();
    const entityReady=data.target<3||M.entityReady(data);
    return `${title(`签署 ${agreementName()}`,'合作签约',active()?'AGT-05':'CHN-11')}${steps()}<p>请核对本次协议，确认后进入电子签署。签署完成后，仍需等待审核与身份生效。</p><div class="p-card">${facts([['申请等级',`${M.rankLabel(data.target)}`],['签署身份',M.party(data).subject],['签署主体',M.party(data).holder],['协议版本',M.version(data.target)]])}${row(agreementName(),data.read?'已阅读 · 可以重新查看':'查看本次协议内容','go:AGT-02')}</div>${data.target>=3?`<div class="p-card">${row('主体与签署人',M.entityReady(data)?'已认证 · 继续使用有效主体':data.entity==='failed'?'认证未通过 · 可重新提交':'必填企业名称与税号，再认证签署人','go:AGT-09')}</div>`:''}<label class="p-check"><input id="partner-consent" type="checkbox" ${data.consent?'checked':''} ${!data.read?'disabled':''}><span>我已阅读并同意《${agreementName()}》，确认由本人或授权签署人签署。</span></label>${action('进入电子签署','sign',false,!data.read||!data.consent||!entityReady)}${note(!data.read?'请先打开并阅读协议。':!entityReady?'请先完成主体与签署人认证。':!data.consent?'阅读不会自动勾选，请主动确认。':'可以中途离开，回来后继续本次签约。')}`;
  }
  function agreementPage() {
    return `${title(agreementName(),'协议阅读','AGT-01')}<span class="p-pill">${e(M.version(data.target))}</span>${note('本页为交互演示文本，不是可签署的正式合同。')}<article class="p-card p-article"><h3>一、合作身份</h3><p>本次申请等级为 ${M.rankLabel(data.target)}。签署人应核对本人身份；经营主体签署时，应确认主体信息与授权关系。</p><h3>二、服务与行为规范</h3><p>提供真实的产品介绍与售后协助，不承诺医疗效果、固定收入或未经确认的权益。具体权利义务以正式协议为准。</p><h3>三、收益与结算</h3><p>收益以已确认的服务与结算记录为准。对账、调整、结算条件和争议处理应在正式协议中明确，首页只展示结果汇总。</p><h3>四、签署与生效</h3><p>阅读和勾选不等于完成电子签署。签署后等待审核；审核通过后，完成必要资料核验并收到生效结果，新的合作身份才生效。</p><h3>五、留存与退出</h3><p>保留协议版本、签署时间及回执。合作结束后的历史协议与结算记录应可查阅。</p></article>${action('已阅读，返回确认','read')}`;
  }
  function signingPage() {
    if(data.phase!=='signing') return progressPage();
    return `${title('电子签署','第三方签署 · 本地模拟','AGT-01')}<div class="p-card"><span class="p-pill">待本人确认</span><h2>${agreementName()}</h2><p>核对本次协议与签署人，确认后完成签署。</p>${facts([['签署方',M.party(data).holder+(M.party(data).subject==='企业或个体工商户'?' · 授权签署人':'')],['协议版本',M.version(data.target)]])}</div>${note('当前仅模拟第三方签署回执，不采集笔迹、身份证或企业印章，不签订真实合同。')}${action('确认签署（模拟）','signed')}${action('暂不签署，稍后继续','cancel',true)}`;
  }
  function progressPage() {
    if (['rejected','amending','withdrawn'].includes(data.phase)) return recoveryPage();
    const views={reading:['还有协议待签署','完成阅读、勾选与电子签署后，继续等待审核。'],signing:['电子签署未完成','可以继续原签署，不需要重新申请。'],'entity-pending':['主体认证中','认证完成后继续签署对应等级协议。'],reviewing:['签署完成，等待审核','协议已签署。身份与申请资料由后台统一审核，无需单独操作身份核验。审核通过前，'+M.rankLabel(data.target)+' 身份尚未生效。'],pending:['审核通过，等待生效','签署与审核均已完成。必要资料核验完成并收到生效结果后，'+M.rankLabel(data.target)+' 身份才会生效。'],active:[`${M.rankLabel(data.level)} 身份已生效`,'可以进入代理中心。历史协议与签署回执仍保留。'],rejected:['本次申请未通过','演示原因：申请资料需要核对。已签协议与原资料保留，可联系支持。']};
    const [h,p]=views[data.phase]||views.reading;
    return `${title('申请进度','合作申请',active()?'AGT-05':'CHN-01')}${steps()}<div class="p-card"><span class="p-pill">${data.phase==='active'?'已生效':data.phase==='pending'?'待生效':data.phase==='reviewing'?'审核中':'待处理'}</span><h2>${e(h)}</h2><p>${e(p)}</p>${data.level&&data.phase!=='active'?note(`当前 ${M.rankLabel(data.level)} 身份保持不变；本次申请 ${M.rankLabel(data.target)}。`):''}</div>${data.receipt?`<div class="p-card">${facts([['签署回执',data.receipt.id],['协议版本',data.receipt.version],['签署状态','已签署']])}</div>`:''}${['reading','signing','entity-pending'].includes(data.phase)?route('继续办理',resume()):data.phase==='pending'&&!payoutReady()?route('核对收款与税务资料','AGT-10'):data.phase==='active'?route('进入代理中心','AGT-05'):action('刷新当前进度','refresh')}${data.phase==='pending'&&payoutReady()?note('收款与税务资料已核验，正在等待身份生效。'):''}${['reading','signing','reviewing'].includes(data.phase)?route('撤回本次申请','CHN-14',true):''}${route('联系支持','HELP-03',true)}${scenario==='application'?route('查看原申请资料','CHN-07',true):''}`;
  }
  function recoveryPage(withdraw=false) {
    if(withdraw&&!['reading','signing','reviewing','rejected','amending'].includes(data.phase)||!withdraw&&!['rejected','amending','withdrawn'].includes(data.phase))return progressPage(); const withdrawn=data.phase==='withdrawn', amendment=data.phase==='amending';
    return `${title(withdraw?'撤回本次申请':withdrawn?'本次申请已撤回':amendment?'更正资料与补充说明':'申请审核未通过','合作申请',data.level?'AGT-05':'CHN-11')}${note(withdraw?'撤回只结束本次办理，原资料、签署记录和已有合作身份均保留。':withdrawn?'原记录已保留。重新办理需要再次阅读、确认并签署。':(data.reviewFeedback?.reason||'请核对申请资料并补充说明。')+' 已有合作身份与原签署记录保留。')}${data.receipt?facts([['签署回执',data.receipt.id],['协议版本',data.receipt.version]]):''}${withdraw?action('确认撤回本次申请','withdraw')+route('暂不撤回，返回进度','AGT-04',true):withdrawn?action('重新办理','restart'):amendment?`${correctionFields()}<label for="partner-amendment">补充说明</label><textarea id="partner-amendment" class="p-select" maxlength="500" placeholder="请说明已核对或补充的内容">${e(data.amendment)}</textarea>${action('保存更正并继续','resubmit')}`:action('补充说明并重新提交','amend')}${!withdraw&&!withdrawn?route('撤回本次申请','CHN-14',true):''}${route('查看申请资料','CHN-07',true)}${route('联系支持','HELP-03',true)}`;
  }
  const academyEntry=()=>`<div class="p-academy-entry">${row('商学院','课程、我的学习、课程安排与资料工具','go:AGT-07')}</div>`;
  function applicantCenter(){
    const eligible=eligibleForReview(context.applicationContext?.()||{});
    return `${title('代理中心','HALO PARTNER','MY-01')}${academyEntry()}<section class="p-card"><h2>${eligible?'合作申请办理中':'开始你的合作申请'}</h2><p>${eligible?'合作身份尚未生效，可以继续办理或先到商学院学习。':'填写个人或企业资料，完成签署后等待后台统一审核。课程学习不作为申请门槛。'}</p>${route(eligible?'继续办理':'查看申请与填写资料',eligible?resume():'CHN-01')}</section>`;
  }
  function home() {
    if(!active()) return applicantCenter();
    const balances=totals();
    return `${title('代理中心','HALO PARTNER','MY-01')}${academyEntry()}${row('推广工具','推广名片与分享链接','go:CHN-26')}<div class="p-card p-hero"><div class="p-identity">${rankMark(data.level)}<span class="p-pill">已生效</span></div><p>可提现金额（元）</p><strong>${M.money(balances[1])}</strong><p>每一笔服务，都有记录。</p></div><div class="p-grid p-balances">${M.statuses.filter((_,i)=>i!==1).map((s,i)=>{const k=[0,2,3][i];return `<div class="p-stat"><span>${s}（元）</span><strong>${M.money(balances[k])}</strong></div>`;}).join('')}</div>${balances[1]===null?note('金额暂未取得，请重新读取；不会将未知金额显示为零。',true):''}${route('申请提现','CHN-23')}${data.phase!=='active'?row('查看本次申请进度',M.rankLabel(data.target)+' · 原身份继续有效','go:AGT-04'):''}<div class="p-card">${row('服务订单','订单记录与设备激活进度','go:CHN-20')}${row('我的团队',M.ranks(data.level).length?'按合作身份，分别查看人数和名单':'查看当前团队情况','go:AGT-06')}${row('合作协议与晋升',data.level===4?'当前合作协议与历史签署记录':'晋升申请、办理进度与已签协议','go:AGT-11')}</div><p style="font-size:12px">各状态金额已合并展示。</p>`;
  }
  function teamPage() {
    if(!active()) return progressPage();
    // Only the current rank's authorized groups are included; do not render hidden lower teams.
    const groups=M.ranks(data.level).map((rank,index)=>({rank,members:Array.from({length:index?5:3},(_,i)=>({id:`DEMO-${rank}0${i+1}`,name:`伙伴 ${['安宁','小禾','云舟','林间','晴川'][i]}`}))}));
    const selected=groups.find(g=>g.rank===data.teamRank)||groups[0];
    return `${title('我的团队')}<p>点击身份卡片，切换查看对应名单。</p><div class="p-grid" aria-label="选择团队身份">${groups.map(g=>`<button class="p-stat p-team-choice" data-action="partner:team-rank:${g.rank}" aria-pressed="${g.rank===selected.rank}" aria-controls="partner-team-list">${rankMark(g.rank)}<strong class="p-count">${g.members.length}<small> 人</small></strong><span class="p-choice-hint">${g.rank===selected.rank?'正在查看':'查看名单 →'}</span></button>`).join('')}</div>${selected?`<section id="partner-team-list" class="p-card" aria-live="polite" aria-label="${e(M.rankLabel(selected.rank))}名单"><div class="p-team-heading">${rankMark(selected.rank)}<small>${selected.members.length} 人</small></div>${selected.members.map(r=>`<div class="p-row"><span class="p-person"><i class="p-avatar" aria-hidden="true">${e(r.name.slice(-1))}</i><span><b>${e(r.name)}</b><small>${e(r.id)}</small></span></span></div>`).join('')}</section>`:note('当前身份暂无可查看的团队名单。')}`;
  }
  function contractsPage() {
    const underway=data.phase!=='active';
    const phaseText={reading:'待阅读与签署',signing:'电子签署未完成','entity-pending':'主体认证中',reviewing:'签署完成 · 审核中',pending:'审核通过 · 待生效',rejected:'审核未通过'};
    const current=`<section class="p-card"><p>当前合作身份</p>${active()?rankMark(data.level):'<h2>尚未生效 <small lang="en">Not active</small></h2>'}<p>${active()?'已生效，现有服务与记录不变。':'完成签署、审核及必要资料核验后生效。'}</p></section>`;
    const application=underway?`<section class="p-card"><span class="p-pill">${phaseText[data.phase]||'办理中'}</span><p>${active()?'本次晋升身份':'本次申请身份'}</p>${rankMark(data.target)}${route(['reading','signing','entity-pending'].includes(data.phase)?'继续本次办理':'查看申请进度',resume())}</section>`:data.level<4?`<section class="p-card"><p>下一合作身份</p>${rankMark(data.level+1)}<p>本次只申请下一身份。完成对应协议签署并生效后，身份才会更新。</p>${action('申请晋升','upgrade')}</section>`:'';
    const history=[...data.contracts].reverse().map(c=>`<details class="p-card p-contract"><summary>${rankMark(c.level)}<span>已签署 · ${e(c.effectiveAt.slice(0,10))}<small>查看签署记录</small></span></summary>${facts([['协议名称',M.rankLabel(c.level)+' 合作协议'],['协议版本',c.version],['签署回执',c.id],['签署时间',c.signedAt.slice(0,10)],['生效时间',c.effectiveAt.slice(0,10)]])}<p>本轮为模拟签署记录。正式协议文件待接入。</p></details>`).join('');
    return `${title('合作协议与晋升')}${restricted()?note('合作已暂停或终止，仅可查看历史协议，暂不能申请晋升。'):current+application}<h2 class="p-history-heading">已签合作协议 <small>${data.contracts.length} 份</small></h2>${history||note('暂无已生效协议；本次签署记录可在申请进度中查看。')}`;
  }
  const content = {
    welcome:['内容','从一次真实体验开始','先了解产品可以做什么，再向客户介绍。不要承诺疾病诊断、固定收益或未经确认的功能。客户遇到问题时，优先使用正式帮助与售后入口。'],
    course:['课程','Halo Ring 产品入门','介绍时先说明佩戴方式和主要记录。身体数据用于日常健康管理；连接、同步、缺失记录的处理以 App 提示为准。让客户知道下一步怎么操作，比堆砌术语更重要。'],
    test:['测评','产品与服务小测','Halo Ring 的身体数据能否代替医生诊断？'],
    materials:['资料','产品介绍与常见问题','介绍产品时，优先使用已发布的商品页面与官方说明。主动测量以当前款式实际支持的功能为准，不承诺尚未开放的呼吸率主动测量。'],
    notice:['公告','服务与沟通提醒','客户问题无法现场确认时，保留问题与相关订单编号，转交正式客服。不要在群聊公开身份信息、身体数据或银行资料。']
  };
  function academy() {
    return `${title('商学院','HALO ACADEMY')}<div class="p-banner"><span class="p-kicker">一起把服务做好</span><h2 style="margin-top:14px">从了解产品，<br>到做好每一次服务。</h2><p>学习、资料与工具，都在这里。</p></div><div class="p-card">${Object.entries(content).map(([id,[type,name]])=>row(name,type+(data.completed.includes(id)?' · 已完成':''),`content:${id}`)).join('')}</div>`;
  }
  function article() {
    const [type,name,body]=content[selection]||content.welcome;
    return `${title(name,type,'AGT-07')}<article class="p-card p-article"><span class="p-pill">${type}</span><p>${body}</p>${selection==='course'?'<h3>体验引导的三个步骤</h3><p>1. 说明佩戴与连接。<br>2. 帮助查看已有记录。<br>3. 说明数据缺失时如何继续。</p>':''}</article>${selection==='test'?`<div class="p-card"><label class="p-check"><input type="radio" name="partner-answer" value="yes" ${data.answer==='yes'?'checked':''}>可以代替医生诊断</label><label class="p-check"><input type="radio" name="partner-answer" value="no" ${data.answer==='no'?'checked':''}>不能，只作为日常健康参考</label></div>${action('提交答案','answer',false,!data.answer)}`:action(data.completed.includes(selection)?'已完成，返回商学院':selection==='course'?'完成本课':'标记已读','complete')}${data.completed.includes(selection)?note('已完成，学习记录保存在本轮演示中。'):''}`;
  }
  function entityPage() {
    if(data.target<3)return `${title('本次无需办理晋升主体认证')}${route('返回合作签约','AGT-01')}`;
    const verified=M.entityReady(data),pending=data.phase==='entity-pending';
    return `${title('企业信息',M.rankLabel(data.target)+' 合作申请','AGT-01')}<p>晋升经营伙伴（L3）必须填写公司或个体工商户信息。确认主体与签署人后，才可签署对应协议；原身份保持不变。</p><div class="p-card">${facts([['主体名称',data.companyName||'尚未填写'],['主体类型',data.entityType],['认证状态',pending?'认证中':verified?'已认证':data.entity==='failed'?'未通过':'待完善并认证']])}</div>${verified?`${note('有效企业信息可继续用于晋升领航伙伴，每次晋升仍需签署对应协议。')}${route('返回合作签约','AGT-01')}`:pending?`${note('模拟认证请求已提交。可以离开，稍后回来查询。')}${action('刷新认证进度','refresh')}`:`<label for="partner-entity">主体类型</label><select id="partner-entity" class="p-select"><option ${data.entityType==='个体工商户'?'selected':''}>个体工商户</option><option ${data.entityType==='公司'?'selected':''}>公司</option></select><label for="partner-company-name">公司／个体工商户名称</label><input id="partner-company-name" class="p-select" maxlength="100" autocomplete="off" value="${e(data.companyName||'')}" placeholder="填写营业执照上的名称" required><label for="partner-tax-number">税号／统一社会信用代码</label><input id="partner-tax-number" class="p-select" maxlength="20" autocomplete="off" value="${e(data.taxNumber||'')}" placeholder="填写税号或统一社会信用代码" required>${note('没有经营主体时，需先完成主体登记。原型只用虚构资料，不办理工商注册；请勿输入真实证照信息。')}<p id="partner-entity-hint" role="status">${e(window.HaloPartnerParty.businessMissing(data))}</p><button id="partner-entity-submit" class="p-primary" data-action="partner:entity" ${!M.entityFieldsValid(data)?'disabled':''}>保存并认证主体（模拟）</button>`}`;
  }
  function page(id) {
    if(id==='CHN-07')return applicationPage();
    if(id==='CHN-12'||id==='CHN-13')return recoveryPage();
    if(id==='CHN-14')return recoveryPage(true);
    if(restricted()&&!['AGT-07','AGT-08','AGT-11'].includes(id))return `${title('合作'+(base.state.channelIdentity==='paused'?'已暂停':'已终止'))}${note('历史订单、结算与协议记录保留，暂不能新增推广、晋升或提现。')}${route('查看历史服务订单','CHN-20')}${route('查看提现记录','CHN-23',true)}${route('查看已签合作协议','AGT-11',true)}${academyEntry()}`;
    if(orderRoute(id))return ordersPage();
    if(id==='AGT-11')return contractsPage();

    if(id==='AGT-01')return signingHome(); if(id==='AGT-02')return agreementPage(); if(id==='AGT-03')return signingPage();
    if(id==='AGT-04')return progressPage(); if(id==='AGT-05')return home(); if(id==='AGT-06')return teamPage();
    if(id==='AGT-07')return academy(); if(id==='AGT-08')return article(); if(id==='AGT-09')return entityPage();
    return `${title('收款与税务资料','身份开通','AGT-04')}${note('本轮只演示原有核验门槛，不收集真实银行卡或税务信息。')}<div class="p-card">${facts([['收款身份',M.party(data).subject],['收款主体',M.party(data).holder],['收款资料',payoutReady()?'已核验':'待核验'],['税务资料',payoutReady()?'已核验':'待核验']])}</div>${action('模拟资料核验完成','payout',false,data.phase!=='pending')}`;
  }
  const original = {render:base.render,handle:base.handleAction,input:base.handleInput,review:base.reviewControls};
  const bridged = id => id==='CHN-19'||id==='CHN-07'&&(application().partySchema===1||application().revision>0)&&eligibleForReview(context.applicationContext?.()||{})||/^CHN-(11|12|13|14|15|16|17|18)$/.test(id)&&eligibleForReview(context.applicationContext?.()||{});
  base.render = (item,ctx) => {
    item={...item,id:navigation.resolve(item.id)};
    load(ctx);
    if(restricted()&&!item.id.startsWith('AGT-'))return original.render(item,ctx);
    if(!item.id.startsWith('AGT-')&&!bridged(item.id)&&!orderRoute(item.id))return original.render(item,ctx);
    const firstRender=data===null, ok=load(ctx), session=ctx.applicationContext?.()||{};
    if(firstRender&&ok)queueMicrotask(()=>ctx.render?.());
    const eligible = eligibleForReview(session);
    const body=!session.signedIn?`${title('请先登录')}${route('登录后继续','AUTH-01')}`:!eligible&&item.id==='AGT-05'?applicantCenter():!eligible?`${title('请先完成申请资料')}${note('请填写个人或企业申请资料后继续签约。培训与测评在商学院独立学习；身份与资料在签署后由后台统一审核。')}${route('继续原申请','CHN-01')}`:!ok?note(error,true):page(item.id.startsWith('AGT-')||orderRoute(item.id)||['CHN-07','CHN-12','CHN-13','CHN-14'].includes(item.id)?item.id:data.phase==='active'?'AGT-05':'AGT-04');
    return `<section class="partner-page" data-partner-scope="${e(storageKey)}" data-partner-revision="${data?.revision??-1}">${body}${error&&ok?note(error,true):''}</section>`;
  };
  base.handleAction = (event,ctx) => {
    const retiredTarget=navigation.retired[ctx.applicationContext?.().page];
    if(retiredTarget&&event.startsWith('commercial:')){ctx.go(retiredTarget);ctx.flash('旧页面已合并，请从当前页面继续');return true;}
    if(!event.startsWith('partner:')) {
      load(ctx);
      if(bridged(ctx.applicationContext?.().page)&&/^commercial:(act-|channel-activate|approval-|application-review|application-progress|withdrawal-|supplement-|rejection-)/.test(event)){
        ctx.go(resume());ctx.flash('请使用当前签约与申请流程继续');return true;
      }
    }
    if(restricted()&&!event.startsWith('partner:'))return original.handle(event,ctx);
    if(orderRoute(ctx.applicationContext?.().page)&&/^commercial:(service-|earning-)/.test(event)){
      ctx.render();ctx.flash('页面已更新，请使用当前订单入口');return true;
    }
    if(!event.startsWith('partner:'))return original.handle(event,ctx);
    const oldScope=storageKey,oldRevision=data?.revision;
    if(!load(ctx)||oldScope!==storageKey||oldRevision!==data.revision){ctx.render();ctx.flash('记录已更新，请核对后继续');return true;}
    const session=context.applicationContext?.()||{};
    const [,name,value]=event.split(':');
    if(name==='go'){ctx.go(navigation.resolve(value));return true;}
    if(restricted()){ctx.render();ctx.flash('合作已暂停或终止，仅可查看历史记录');return true;}
    if(!eligibleForReview(session)){ctx.render();ctx.flash('请先完成当前账号的原申请步骤');return true;}
    if(name==='order-open'||name==='order-filter'){
      if(name==='order-open'){ctx.go('CHN-20');return true;}
      if(session.page!=='CHN-20'||!active()){ctx.render();ctx.flash('请从当前账号的服务订单继续');return true;}
      if(!['all','activated'].includes(value))return true;
      if(commit({...data,revision:data.revision+1,orderFilter:value}))ctx.render();return true;
    }
    if(name==='team-rank'){
      const rank=Number(value);
      if(session.page!=='AGT-06'||!active()||!M.ranks(data.level).includes(rank))return true;
      if(commit({...data,teamRank:rank,revision:data.revision+1}))ctx.render();return true;
    }
    if(name==='refresh'){error='';ctx.render();ctx.flash('已查询当前进度');return true;}
    if(name==='resubmit'&&!data.amendment.trim()){ctx.flash('请填写已核对或补充的内容');return true;}
    if(name==='resubmit'&&data.phase==='amending'){
      const draft=data.correctionDraft||application(),missing=window.HaloPartnerParty.missing(draft);
      const changed=['payeeType','personName','idNumber','companyName','taxNumber'].some(k=>(draft[k]||'')!==((data.target>=3?{...application(),payeeType:'企业或个体工商户',companyName:data.companyName,taxNumber:data.taxNumber}:application())[k]||''));
      if(missing&&(application().partySchema===1||changed)){error=missing;ctx.render();return true;}
      if((draft.partySchema===1||draft.province||draft.city)&&!window.HaloServiceRegions.valid(draft)){error='请重新选择该省份下的城市。';ctx.render();return true;}
      if(draft.partySchema===1&&!(window.HALO_CHANNEL_APPLICATION?.industries||[]).includes(draft.experience)){error='请选择相关经验／行业。';ctx.render();return true;}
      const {personName,idNumber,companyName,taxNumber,...common}=draft;
      data={...data,correctionDraft:{...common,...window.HaloPartnerParty.fields(draft)}};
    }
    if(name==='content'){if(content[value]&&commit({...data,selectedContent:value,revision:data.revision+1})){selection=value;ctx.go('AGT-08');}return true;}
    if(name==='earnings'){ctx.go('AGT-05');return true;}
    if(name==='upgrade'&&data.level===4&&data.phase==='active'){ctx.go('AGT-11');return true;}
    if(name==='complete'||name==='answer'){
      if(name==='answer'&&data.answer!=='no'){ctx.flash('再想一想：身体记录不能代替医疗诊断。');return true;}
      const next={...data,completed:[...new Set([...data.completed,selection])],revision:data.revision+1};
      if(commit(next))ctx.go('AGT-07');return true;
    }
    const next=M.transition(data,name,new Date().toISOString());
    if(next===data){if(name==='upgrade')ctx.go(resume());else ctx.flash('请先完成当前步骤');return true;}
    if(commit(next))ctx.go(name==='read'?'AGT-01':name==='entity'?'AGT-09':name==='entity-ok'||name==='entity-fail'?'AGT-09':resume());
    return true;
  };
  base.handleInput = (target,ctx) => {
    if(!target.id?.startsWith('partner-')&&target.name!=='partner-answer')return original.input(target,ctx);
    const oldScope=storageKey,oldRevision=data?.revision;
    if(!load(ctx)||oldScope!==storageKey||oldRevision!==data.revision||!eligibleForReview(context.applicationContext?.()||{})||restricted()){ctx.render();return true;}
    if(target.id?.startsWith('partner-correct-')){
      const key=target.id.slice('partner-correct-'.length);
      if(data.phase!=='amending'||!['CHN-12','CHN-13','AGT-04'].includes(context.applicationContext?.().page)||!['payeeType','personName','idNumber','companyName','taxNumber','province','city','experience'].includes(key))return true;
      if(key==='payeeType'&&(data.target>=3||!['自然人','企业或个体工商户'].includes(target.value)))return true;
      const next={...data,correctionDraft:{...(data.correctionDraft||application()),[key]:String(target.value||'').slice(0,key==='idNumber'?18:key==='taxNumber'?20:100)},revision:data.revision+1};
      if(key==='province')next.correctionDraft.city='';
      if(['province','city'].includes(key))next.correctionDraft.region=window.HaloServiceRegions.label(next.correctionDraft);
      if(commit(next)){
        if(['payeeType','province','city','experience'].includes(key))ctx.render();
        const hint=document.getElementById('partner-correction-hint');if(hint)hint.textContent=window.HaloPartnerParty.missing(data.correctionDraft);
      }return true;
    }
    if(['partner-company-name','partner-tax-number','partner-entity'].includes(target.id)) {
      if(context.applicationContext?.().page!=='AGT-09'||data.target<3||data.phase!=='reading'||M.entityReady(data))return true;
      const key={'partner-company-name':'companyName','partner-tax-number':'taxNumber','partner-entity':'entityType'}[target.id];
      const value=String(target.value||'').slice(0,key==='taxNumber'?20:100);
      if(commit({...data,[key]:value,entity:'missing',entityId:null,read:false,consent:false,revision:data.revision+1})){
        const button=document.getElementById('partner-entity-submit'),hint=document.getElementById('partner-entity-hint');
        if(button)button.disabled=!M.entityFieldsValid(data);
        if(hint)hint.textContent=window.HaloPartnerParty.businessMissing(data);
      }
      return true;
    }
    if(target.id==='partner-amendment') {if(data.phase==='amending')commit({...data,amendment:String(target.value).slice(0,500),revision:data.revision+1});return true;}
    const next=target.id==='partner-consent'?M.transition(data,target.checked?'consent':'unconsent'):{...data,revision:data.revision+1,...(target.id==='partner-entity'?{entityType:target.value==='公司'?'公司':'个体工商户'}:{answer:target.value==='no'?'no':'yes'})};
    if(commit(next))ctx.render();return true;
  };
  base.reviewControls = item => {
    item={...item,id:navigation.resolve(item.id)};
    if(restricted())return item.id.startsWith('AGT-')?'':original.review(item);
    if(orderRoute(item.id))return '<section class="p-review-controls"><b>服务订单 · 本地审阅</b><p>复用原有虚构订单，只投影编号、商品及服务进度。无单笔收益、比例或公式；汇总仍由既有候选响应提供。普通会员无代理订单访问权；正式接口需服务端校验订单归属。</p><a href="partner-review.html">返回代理审阅目录</a></section>';
    if(!item.id.startsWith('AGT-')&&!bridged(item.id))return original.review(item);
    if(!data)return '';
    const events=data.phase==='reviewing'?[['模拟审核通过','approve'],['模拟审核未通过','reject']]:data.phase==='pending'?[['模拟收到身份生效回执','effective']]:data.phase==='entity-pending'?[['模拟主体认证通过','entity-ok'],['模拟主体认证未通过','entity-fail']]:[];
    return `<section class="p-review-controls"><b>内部审阅 · 非 App 界面</b><p>全部为虚构状态，未接真实签署、审核或结算。仅操作这里的模拟回执才推进审核与生效。</p>${events.map(([label,event])=>action(label,event,true)).join('')}<a href="partner-review.html">切换新申请 / 审核中 / 审核通过 / 单次晋升场景 →</a></section>`;
  };
  base.partnerEntry = ctx => {
    if(!load(ctx)||!ctx.applicationContext?.().signedIn)return null;
    if(restricted())return ['合作'+(base.state.channelIdentity==='paused'?'已暂停':'已终止'),'查看历史记录','CHN-17'];
    if(!eligibleForReview(ctx.applicationContext()))return ['代理中心','合作申请与商学院','AGT-05'];
    if(active())return ['代理中心',M.rankLabel(data.level),'AGT-05'];
    if(['reviewing','pending','signing','entity-pending','rejected'].includes(data.phase))return ['合作申请进度',M.rankLabel(data.target),resume()];
    return null;
  };
})();
