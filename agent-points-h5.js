/* H5-only synthetic query prototype. Session state below is a demo, not authentication. */
(() => {
  'use strict';
  const M=window.HaloPartnerReviewModel, root=document.getElementById('agent-points');
  if(!root)return;
  if(!M?.pointRecords){root.innerHTML='<section class="empty"><h1>页面暂时无法加载</h1><p>请刷新页面重试，现有记录不会受影响。</p><a href="agent-points-review.html">重新打开</a></section>';return;}
  const months=Object.keys(M.pointRecords).sort().reverse(), categories=Object.keys(M.awardNames);
  const scenes=['full','empty','error','updating','login','expired','denied'], pages=['overview','records','record','help'];
  const years=[...new Set(months.map(m=>m.slice(0,4)))];
  const queryMonths=years.flatMap(y=>Array.from({length:12},(_,i)=>y+'-'+String(12-i).padStart(2,'0')));
  // Synthetic feed metadata: independent of record dates and the user's system clock.
  // Production period/time-zone policy remains a backend decision, not changed here.
  const snapshot={updated:'2026-09-16 10:30',cutoff:'2026-09-15 23:59',month:'2026-09',zone:'UTC+8'};
  const sessionKey='halo.h5.points.demo-session.v1';
  let session='active', loginError='', loginPhone='13900000000';
  try{const saved=sessionStorage.getItem(sessionKey);if(['active','signedout','expired','denied'].includes(saved))session=saved;}catch{/* Memory-only fallback for restricted storage. */}
  function setSession(value){session=value;try{sessionStorage.setItem(sessionKey,value);}catch{/* No App storage fallback. */}}
  const canQuery=()=>session==='active';
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let state, notice='', parent=null;
  const navigationKey='helloPointsNavigation';
  // H5-only fictional annotations, not reward rules or inferred backend facts.
  const demoCorrections={
    'DEMO-M-0910':{reason:'复核发现原记录包含重复计入的部分，本次予以调减。',originalPeriod:'2026-09',postingPeriod:'2026-09'},
    'DEMO-L-0911':{reason:'原记录关联的部分业务已取消，本次调减对应积分。',originalPeriod:'2026-08',postingPeriod:'2026-09'}
  };
  const icons={
    overview:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    records:'<path d="M7 3h10l3 3v15H4V3zM8 9h8M8 13h8M8 17h5"/>',
    help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5M12 17h.01"/>',
    arrow:'<path d="m9 5 7 7-7 7"/>',
    back:'<path d="m15 5-7 7 7 7"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    correction:'<path d="M5 8h11a4 4 0 0 1 0 8h-4M8 4 4 8l4 4"/>'
  };
  const icon=name=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(icons[name]||icons.records)+'</svg>';
  const button=(text,action,cls='text-button',extra='')=>'<button class="'+cls+'" data-action="'+action+'" '+extra+'>'+text+'</button>';
  // Review-only directory. These links open explicit synthetic page fixtures,
  // not production account permissions. In-page navigation still respects session state.
  const catalog=[
    {title:'账号与访问',items:[
      {id:'login',label:'账号登录',patch:{scene:'login'}},
      {id:'login-error',label:'验证码错误',patch:{scene:'login'},error:'模拟验证码不正确，请输入 000000。'},
      {id:'expired',label:'登录已过期',patch:{scene:'expired'}},
      {id:'denied',label:'暂无查询权限',patch:{scene:'denied'}}
    ]},
    {title:'积分总览',items:[
      {id:'monthly',label:'月度积分总览',patch:{}},
      {id:'annual',label:'年度积分总览',patch:{period:'year'}}
    ]},
    {title:'积分记录',items:[
      {id:'records',label:'月度积分记录',patch:{page:'records'}},
      {id:'annual-records',label:'年度积分记录',patch:{page:'records',period:'year'}},
      {id:'management-records',label:'团队协作积分记录',patch:{page:'records',category:'management'}},
      {id:'leadership-records',label:'组织发展积分记录',patch:{page:'records',category:'leadership'}},
      {id:'added-detail',label:'新增积分详情',patch:{page:'record',record:'DEMO-M-0914'}},
      {id:'corrected-detail',label:'更正积分详情',patch:{page:'record',record:'DEMO-L-0911'}},
      {id:'original-detail',label:'关联原记录',patch:{page:'record',record:'DEMO-L-0828'}}
    ]},
    {title:'查询帮助',items:[
      {id:'help',label:'查询帮助',patch:{page:'help'}},
      {id:'record-help',label:'记录问题说明',patch:{page:'help',record:'DEMO-L-0911'}}
    ]},
    {title:'空态与异常',items:[
      {id:'empty-overview',label:'总览 · 暂无记录',patch:{scene:'empty'}},
      {id:'empty-records',label:'列表 · 暂无记录',patch:{scene:'empty',page:'records'}},
      {id:'uncollected',label:'月份尚未收录',patch:{month:'2026-06'}},
      {id:'future-month',label:'月份尚未开始',patch:{month:'2026-12'}},
      {id:'updating',label:'数据更新中',patch:{scene:'updating'}},
      {id:'error',label:'加载失败',patch:{scene:'error'}},
      {id:'missing-record',label:'记录不存在',patch:{page:'record',record:'missing-demo-record'}}
    ]}
  ];
  const catalogItems=catalog.flatMap(group=>group.items);
  function currentCatalog(){
    if(!canQuery())return session==='signedout'?(loginError?'login-error':'login'):session;
    if(['updating','error'].includes(state.scene))return state.scene;
    if(state.scene==='empty'&&['overview','records'].includes(state.page))return state.page==='records'?'empty-records':'empty-overview';
    if(state.page==='overview')return periodMissing()?(state.month>snapshot.month?'future-month':'uncollected'):state.period==='year'?'annual':'monthly';
    if(state.page==='records')return state.period==='year'?'annual-records':state.category!=='all'?state.category+'-records':'records';
    if(state.page==='help')return findRecord(state.record)?'record-help':'help';
    const r=findRecord(state.record);
    return !r?'missing-record':isCorrection(r)?'corrected-detail':r.date.slice(0,7)!==state.month?'original-detail':'added-detail';
  }
  function renderCatalog(){
    const nav=document.getElementById('page-catalog');if(!nav)return;
    const current=currentCatalog();
    nav.innerHTML=catalog.map((group,index)=>'<section class="catalog-group"><h3><span>'+String(index+1).padStart(2,'0')+'</span>'+group.title+'<small>'+group.items.length+'</small></h3>'+group.items.map(item=>'<a href="?catalog='+item.id+'" data-catalog="'+item.id+'" '+(current===item.id?'aria-current="page"':'')+'>'+item.label+'</a>').join('')+'</section>').join('');
    const count=document.getElementById('catalog-count');if(count)count.textContent=catalog.length+' 类 · '+catalogItems.length+' 个页面与状态';
  }
  function openCatalog(id,push=true){
    const item=catalogItems.find(item=>item.id===id);if(!item)return false;
    const resume=id==='expired'?{...state}:{};
    if(id!=='expired')parent=null;
    state={page:'overview',month:months[0],year:years[0],period:'month',category:'all',kind:'all',record:'',scene:'full',...resume,...item.patch};
    setSession(({login:'signedout',expired:'expired',denied:'denied'}[state.scene])||'active');
    loginPhone='13900000000';loginError=item.error||'';notice='';writeURL(id==='expired'?false:push);render(push);
    if(push)root.scrollIntoView?.({block:'start'});
    return true;
  }
  function readURL(){
    const u=new URL(location.href), p=u.searchParams;
    state={
      page:pages.includes(u.hash.slice(1))?u.hash.slice(1):'overview',
      month:queryMonths.includes(p.get('month'))?p.get('month'):months[0],
      period:p.get('period')==='year'?'year':'month',
      year:years.includes(p.get('year'))?p.get('year'):years[0],
      category:['all',...categories].includes(p.get('category'))?p.get('category'):'all',
      kind:['all','added','corrected'].includes(p.get('kind'))?p.get('kind'):'all',
      record:p.get('record')||'', scene:scenes.includes(p.get('h5Scene'))?p.get('h5Scene'):'full'
    };
  }
  function writeURL(push=false){
    const u=new URL(location.href);
    // Consume a directory fixture once. Refresh then restores current filters,
    // and history after logout cannot re-open an authenticated fixture implicitly.
    u.searchParams.delete('catalog');
    ['month','category','kind','period','year'].forEach(k=>u.searchParams.set(k,state[k]));
    u.searchParams.set('h5Scene',state.scene);
    if(state.record)u.searchParams.set('record',state.record);else u.searchParams.delete('record');
    u.hash=state.page;
    const previous=push?null:history.state?.[navigationKey];
    const entry={...(push?{}:history.state),[navigationKey]:{url:String(u),parent,scrollY:previous?.scrollY||0,focusAction:previous?.focusAction||''}};
    if(push&&typeof history.pushState==='function')history.pushState(entry,'',u);else history.replaceState(entry,'',u);
  }
  function rememberPosition(){
    const saved={url:location.href,parent,scrollY:window.scrollY||0,focusAction:document.activeElement?.dataset?.action||''};
    history.replaceState({...history.state,[navigationKey]:saved},'',location.href);
  }
  function readNavigation(){
    const saved=history.state?.[navigationKey];
    parent=saved?.url===location.href&&pages.includes(saved.parent?.page)?saved.parent:null;
    return saved?.url===location.href?saved:null;
  }
  function restorePosition(saved){
    if(!saved||!canQuery())return;
    const restore=()=>{
      [...(root.querySelectorAll?.('[data-action]')||[])].find(el=>el.dataset.action===saved.focusAction)?.focus?.({preventScroll:true});
      window.scrollTo?.({top:saved.scrollY||0,behavior:'instant'});
    };
    if(window.requestAnimationFrame)window.requestAnimationFrame(restore);else restore();
  }
  function returnLabel(){
    const page=parent?.page||(state.page==='help'&&state.record?'record':state.page==='record'?'records':'overview');
    if(page==='record')return state.page==='record'&&parent?.correction?'更正详情':'积分详情';
    return page==='records'?'积分记录':page==='help'?'查询帮助':parent?.period==='year'?'年度积分总览':'积分总览';
  }
  function goBack(){
    if(parent&&typeof history.back==='function'){history.back();return;}
    const r=findRecord(state.record);
    if(state.page==='help'&&r)update({page:'record'},false);
    else if(state.page==='record')update({page:'records',record:'',...(r?{month:r.date.slice(0,7)}:{})},false);
    else update({page:'overview',record:''},false);
  }
  const monthLabel=month=>String(month||'').replace('-',' 年 ')+' 月';
  const periodLabel=()=>state.period==='year'?state.year+' 年':monthLabel(state.month);
  function periodRange(){
    if(state.period==='year')return state.year+'-01-01 — '+state.year+'-12-31';
    const [year,month]=state.month.split('-').map(Number),day=new Date(Date.UTC(year,month,0)).getUTCDate();
    return state.month+'-01 — '+state.month+'-'+day;
  }
  const includedMonths=()=>months.filter(m=>m.startsWith(state.year+'-'));
  const selectedRows=()=>state.period==='year'?includedMonths().flatMap(m=>rows(m)).sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id)):rows();
  const periodMissing=()=>state.period==='month'&&!months.includes(state.month);
  const blockedData=()=>state.scene==='error'||state.scene==='updating'||periodMissing();
  const isCorrection=r=>!!r.related||/更正/.test(r.note);
  function rows(month=state.month){
    if(!canQuery()||state.scene==='empty')return [];
    return categories.flatMap(category=>(M.pointRecords[month]?.[category]||[]).map(row=>({...row,category})))
      .sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
  }
  function total(list){
    const n=list.reduce((sum,r)=>Number.isSafeInteger(r.fen)&&Number.isSafeInteger(sum)?sum+r.fen:NaN,0);
    return M.points(n);
  }
  const change=r=>(r.fen<0?'−':r.fen>0?'+':'')+M.points(Number.isSafeInteger(r.fen)?Math.abs(r.fen):NaN);
  const findRecord=id=>months.flatMap(m=>rows(m)).find(r=>r.id===id);
  const nav=()=>'<nav class="bottom-nav" aria-label="H5 导航">'+[['overview','总览'],['records','记录'],['help','帮助']].map(([p,n])=>button(icon(p)+'<span>'+n+'</span>','page:'+p,'nav-item',((state.page==='record'?'records':state.page)===p?'aria-current="page"':''))).join('')+'</nav>';
  function header(title,back){
    return '<header class="app-header">'+(back?button(icon('back'),'back','icon-button','aria-label="返回'+returnLabel()+'"'):'<span class="brand-orbit" aria-hidden="true"></span>')+'<div><span class="brand-word">HELLO</span><h1 tabindex="-1">'+title+'</h1></div>'+(canQuery()&&state.page!=='help'?button(icon('help'),'page:help','icon-button','aria-label="查询帮助"'):'')+'</header>';
  }
  function periodPicker(){
    return '<div class="period-tabs" aria-label="统计维度">'+[['month','按月'],['year','按年']].map(([v,n])=>button(n,'period:'+v,'period-tab','aria-pressed="'+(state.period===v)+'"')).join('')+'</div>'+
      (state.period==='year'?'<label class="month-picker" for="award-year"><span>查看年份</span><select id="award-year">'+years.map(y=>'<option value="'+y+'" '+(y===state.year?'selected':'')+'>'+y+' 年</option>').join('')+'</select></label>':'<label class="month-picker" for="award-month"><span>查看月份</span><select id="award-month">'+queryMonths.map(m=>'<option value="'+escape(m)+'" '+(m===state.month?'selected':'')+'>'+escape(monthLabel(m))+'</option>').join('')+'</select></label>');
  }
  function freshness(){
    return '<section class="data-freshness" aria-label="数据更新时间"><p>统计范围 <span>'+periodRange()+'</span></p><p>上次成功更新 <time>'+snapshot.updated+'</time> <span>'+snapshot.zone+'</span></p><p>记录收录截至 <time>'+snapshot.cutoff+'</time> <span>'+snapshot.zone+'</span></p>'+
      (state.period==='year'?'<p class="coverage-note">已收录 '+includedMonths().slice().sort().map(m=>Number(m.slice(5))+' 月').join('、')+'；仅汇总已收录记录，不代表全年最终结果。</p>':'')+'</section>';
  }
  function annualBreakdown(){
    if(state.period!=='year')return '';
    const missing=queryMonths.filter(m=>m.startsWith(state.year+'-')&&!months.includes(m)).slice().sort();
    return '<section class="annual-breakdown"><div class="section-heading"><h2>每月汇总</h2><span>代理积分</span></div><p class="section-description">选择已收录月份，查看当月记录。</p>'+includedMonths().map(m=>{
      const list=rows(m);
      return button('<span><b>'+Number(m.slice(5))+' 月</b><small>'+categories.map(c=>escape(M.awardNames[c])+' '+total(list.filter(r=>r.category===c))).join('<br>')+'</small></span><strong>'+total(list)+'</strong>'+icon('arrow'),'month:'+m,'month-summary');
    }).join('')+(missing.length?'<details class="other-months"><summary>其他 '+missing.length+' 个月 · 未纳入汇总</summary>'+missing.map(m=>'<div class="month-summary missing"><b>'+Number(m.slice(5))+' 月</b><span>'+(m>snapshot.month?'尚未开始':'尚未收录')+'</span><strong>—</strong></div>').join('')+'</details>':'')+'</section>';
  }
  function account(){
    return '<section class="identity"><span class="avatar">林</span><div><strong>林一 <span class="demo-tag">示例用户</span></strong><small>'+escape(M.rankLabel(4))+'</small><small>当前账号 · 139****0000 · 仅查询本人记录</small></div>'+button('退出','logout','account-exit','aria-label="退出登录"')+'</section>';
  }
  function login(){
    return '<header class="app-header"><span class="brand-orbit" aria-hidden="true"></span><div><span class="brand-word">HELLO</span><h1 tabindex="-1">登录代理积分</h1></div></header><div class="page-content"><section class="login-intro"><h2>'+(session==='expired'?'登录已过期':'使用已有账号登录')+'</h2><p>'+(session==='expired'?'重新登录后，继续查看刚才的记录和筛选。':'与 App 使用同一账号，无需重新注册。')+'</p></section><form id="h5-login" class="login-form"><label for="h5-phone">手机号</label><input id="h5-phone" name="phone" type="tel" inputmode="numeric" autocomplete="off" maxlength="11" value="'+escape(loginPhone)+'" aria-describedby="demo-login-note"><label for="h5-code">模拟验证码</label><input id="h5-code" name="code" inputmode="numeric" autocomplete="off" maxlength="6" placeholder="输入 6 位模拟验证码" aria-describedby="demo-login-note login-error"><p id="demo-login-note" class="demo-login-note">仅供演示：13900000000 / 000000<br>不发送短信，不验证真实账号，请勿填写真实信息。</p><p id="login-error" class="form-error" role="alert">'+escape(loginError)+'</p><button class="primary" type="submit">登录</button></form></div>';
  }
  function denied(){
    return header('代理积分')+'<div class="page-content">'+account()+empty('当前账号暂无查询权限','当前账号可以登录，但尚未开通代理积分查询。请向服务支持确认账号状态。',button('切换账号','logout','primary'))+'<p class="updated">此状态不展示任何积分或记录。</p></div>';
  }
  const empty=(title,text,action='')=>'<section class="empty">'+icon('records')+'<h2>'+title+'</h2><p>'+text+'</p>'+action+'</section>';
  function recordRow(r){
    return button('<span class="record-symbol '+(isCorrection(r)?'correction':'')+'">'+icon(isCorrection(r)?'correction':'plus')+'</span><span class="record-title"><b>'+escape(M.awardNames[r.category])+'</b><small>'+escape(r.date)+' · '+escape(r.note)+'</small></span><span class="record-amount '+(r.fen<0?'negative':'')+'">'+change(r)+'<small>代理积分</small></span>'+icon('arrow'),'record:'+escape(r.id),'record-row');
  }
  function unavailable(){
    if(state.scene==='error')return empty('暂时无法读取积分','请稍后重试。无法读取的积分不会显示为 0.00，已有记录不会被清空。',button('重新加载','retry','primary'));
    if(state.scene==='updating')return empty('数据尚未更新完成','本次数据还在更新，暂不展示合计；这不代表积分为零。',button('刷新数据','retry','primary'));
    return empty(state.month>snapshot.month?'该月份尚未开始':'该月份尚未收录','暂无可查询的数据，不能据此认定积分为零。',button('查看最近有记录的月份','latest-month','primary'));
  }
  function overview(){
    const list=selectedRows(), latest=list[0], groups=categories.map(category=>({category,rows:list.filter(r=>r.category===category)}));
    return header('代理积分')+'<div class="page-content">'+account()+periodPicker()+freshness()+
      (blockedData()?unavailable():
      '<section class="summary-hero"><div class="hero-orbit" aria-hidden="true"></div><p>'+(state.period==='year'?'年度已收录积分':'本月记录积分')+'</p><div class="hero-number">'+total(list)+'<span>代理积分</span></div><div class="hero-meta"><span>'+escape(periodLabel())+'</span><span>'+list.length+' 条记录</span></div></section>'+
      '<div class="category-grid">'+groups.map(g=>button('<span class="category-mark">'+icon(g.category==='management'?'overview':'plus')+'</span><span>'+escape(M.awardNames[g.category])+'</span><strong>'+total(g.rows)+'</strong><small>查看记录 '+icon('arrow')+'</small>','category:'+g.category,'category-card')).join('')+'</div>'+
      annualBreakdown()+'<section class="records-section"><div class="section-heading"><h2>最近记录</h2>'+button('查看全部','all-records')+'</div>'+(list.length?list.slice(0,3).map(recordRow).join(''):empty(state.period==='year'?'已收录月份暂无积分记录':'本月暂无积分记录','可以切换期间查看历史记录。'))+'</section>'+
      (latest?'<p class="updated">最近记录日期 '+escape(latest.date)+'</p>':''))+
      '<aside class="query-note">'+icon('help')+'<p>代理积分仅供记录查询，与会员积分分开。</p></aside></div>'+nav();
  }
  function records(){
    const all=selectedRows(), list=all.filter(r=>(state.category==='all'||r.category===state.category)&&(state.kind==='all'||(state.kind==='corrected'?isCorrection(r):!isCorrection(r))));
    const noResults=all.length?empty('当前筛选没有匹配记录','该期间仍有 '+all.length+' 条积分记录，合计 '+total(all)+' 代理积分。',button(state.period==='year'?'查看本年已收录的全部记录':'查看本月全部记录','reset-filters','secondary')):empty(state.period==='year'?'已收录月份暂无积分记录':'本月暂无积分记录','当前期间确实没有积分记录，可通过上方期间选择查看其他月份。');
    return header('积分记录','page:overview')+'<div class="page-content">'+periodPicker()+freshness()+
      '<div class="category-tabs" aria-label="积分类别">'+['all',...categories].map(c=>button(c==='all'?'全部':escape(M.awardNames[c]),'filter:'+c,'tab', 'aria-pressed="'+(state.category===c)+'"')).join('')+'</div>'+
      '<label class="kind-filter" for="record-kind">变动类型<select id="record-kind">'+[['all','全部变动'],['added','新增记录'],['corrected','更正记录']].map(([v,n])=>'<option value="'+v+'" '+(v===state.kind?'selected':'')+'>'+n+'</option>').join('')+'</select></label>'+
      (blockedData()?unavailable():'<div class="list-summary" role="status"><div><span>当前筛选合计</span><strong>'+total(list)+' <small>代理积分</small></strong></div><span>'+list.length+' 条</span></div>'+
      (list.length?'<section class="record-list">'+list.map(recordRow).join('')+'</section>':noResults))+'</div>'+nav();
  }
  function correctionExplanation(r){
    if(!isCorrection(r))return '';
    const supplied=r.correctionInfo, info=supplied||demoCorrections[r.id];
    const period=value=>/^\d{4}-(0[1-9]|1[0-2])$/.test(value||'')?monthLabel(value):'待后台提供';
    return '<section class="correction-note"><h3>更正说明'+(!supplied&&info?' · 虚构示例':'')+'</h3><p>'+escape(info?.reason||'更正原因待补充，请向服务支持核对。')+'</p><dl class="facts">'+[['原记录所属期间',period(info?.originalPeriod)],['本次计入期间',period(info?.postingPeriod)]].map(([k,v])=>'<div><dt>'+k+'</dt><dd>'+escape(v)+'</dd></div>').join('')+'</dl>'+(!supplied&&info?'<p>以上原因和期间仅用于原型说明；正式内容由后台记录提供。</p>':'')+'</section>';
  }
  function record(){
    const r=findRecord(state.record), related=r?.related?findRecord(r.related):null;
    if(state.scene==='error'||state.scene==='updating')return header('积分变动详情','page:records')+'<div class="page-content">'+unavailable()+'</div>'+nav();
    if(!r)return header('积分变动详情','page:records')+'<div class="page-content">'+empty('未找到这条积分记录','该链接没有对应的演示记录，请返回列表重新选择。',button('返回积分记录','page:records','primary'))+'</div>'+nav();
    return header('积分变动详情','page:records')+'<div class="page-content"><section class="detail-total"><span class="type-label">'+(isCorrection(r)?'积分更正':'新增记录')+'</span><h2>'+escape(M.awardNames[r.category])+'</h2><strong class="'+(r.fen<0?'negative':'')+'">'+change(r)+'</strong><p>代理积分</p></section><dl class="facts">'+
      [['记录日期',r.date],['记录编号',r.id],['记录说明',r.note],...(r.related?[['原记录编号',r.related]]:[])].map(([k,v])=>'<div><dt>'+k+'</dt><dd>'+escape(v)+'</dd></div>').join('')+'</dl>'+
      correctionExplanation(r)+(r.related?'<section class="correction-note"><h3>原记录保留，本次变动单独记录</h3><p>这条更正没有覆盖原来的记录。'+(related?'可以查看原记录核对。':'原记录暂未包含在本地演示中。')+'</p>'+(related?button('查看原记录','related:'+escape(related.id),'secondary'):'')+'</section>':'')+
      '<div class="detail-actions">'+button('记录有疑问','help-record','primary')+button('返回'+returnLabel(),'back','secondary')+'</div><p class="updated">积分变动不代表款项到账状态。</p></div>'+nav();
  }
  function help(){
    const r=findRecord(state.record);
    return header('查询帮助',r?'record:'+escape(r.id):'page:overview')+'<div class="page-content"><section class="help-intro"><span class="help-icon">'+icon('help')+'</span><h2>看懂记录，找到答案</h2><p>这里提供代理积分的查询说明。</p></section>'+
      (r?'<section class="support-context"><h3>关于这条记录</h3><p>'+escape(M.awardNames[r.category])+' · '+escape(r.date)+'</p><strong>'+escape(r.id)+'</strong><p>联系服务支持时，请提供记录编号和需要核对的问题。</p>'+button('返回该记录','back','secondary')+'</section>':'')+
      '<section class="faq">'+[
        ['代理积分是什么？','用于查看合作奖励记录，包含团队协作积分和组织发展积分。与会员积分分开记录，不能用于商学院课程兑换。'],
        ['如何查看以前的积分？','在总览或积分记录中切换按月、按年，再选择积分类别。年度总览可展开到某个月，返回列表时保留当前筛选。'],
        ['更新时间与记录日期有什么区别？','数据更新时间表示本次查询数据的更新时刻，收录截至表示数据覆盖的截止时刻；最近记录日期只是最近一条变动的日期。尚未收录或更新中的期间不会当作零积分。'],
        ['为什么年度结果标注“已收录”？','年度汇总只累计当前已收录月份。未收录月份和未来月份不填零，也不计入合计。'],
        ['为什么记录有加号和减号？','加号表示正向变动，减号表示负向变动。更正会单独保留，并在详情中标明原记录编号，不覆盖原记录。'],
        ['为什么积分记录和款项到账不同？','本页只提供积分查询，不显示付款进度。相关款项由公司另行处理，无需在此操作。'],
        ['单条记录与合计偶尔对不上？','积分统一保留两位小数，合计按原始记录精度汇总后展示，可能出现显示尾差。非零变动即使显示为 0.00，也会保留方向与记录。'],
        ['记录有疑问怎么办？','进入记录详情，核对日期、类别和记录编号，再向服务支持说明需要核对的内容。本地原型未连接客服，不会创建或发送工单。']
      ].map(([q,a])=>'<details><summary>'+q+'</summary><p>'+a+'</p></details>').join('')+'</section></div>'+nav();
  }
  function render(focus=false){
    if(canQuery()&&['login','expired','denied'].includes(state.scene))state.scene='full';
    document.title='HELLO · '+(canQuery()?({overview:'代理积分',records:'积分记录',record:'积分变动详情',help:'查询帮助'}[state.page]):session==='denied'?'暂无查询权限':'登录代理积分')+' · H5 原型 V6.6';
    root.innerHTML=(canQuery()?({overview,records,record,help}[state.page])():session==='denied'?denied():login())+'<div class="feedback" role="status">'+escape(notice)+'</div>';
    renderCatalog();
    if(focus)root.querySelector?.('h1')?.focus?.({preventScroll:false});
  }
  function update(patch,push=true,child=false){
    const focusedId=document.activeElement?.id;
    if(push){rememberPosition();parent=child?{page:state.page,period:state.period,correction:state.page==='record'&&isCorrection(findRecord(state.record)||{})}:null;}
    state={...state,...patch};notice='';writeURL(push);render(push);
    if(!push&&focusedId)document.getElementById(focusedId)?.focus?.({preventScroll:true});
  }
  root.addEventListener('change',event=>{
    if(!canQuery())return;
    if(event.target.id==='award-month'&&queryMonths.includes(event.target.value))update({month:event.target.value,year:event.target.value.slice(0,4),record:''},false);
    if(event.target.id==='award-year'&&years.includes(event.target.value))update({year:event.target.value,record:''},false);
    if(event.target.id==='record-kind'&&['all','added','corrected'].includes(event.target.value))update({kind:event.target.value},false);
  });
  root.addEventListener('click',event=>{
    const el=event.target.closest('button'), action=el?.dataset?.action;if(!action)return;
    const [name,...rest]=action.split(':'),value=rest.join(':');
    if(name==='logout'){setSession('signedout');loginError='';update({scene:'login',page:'overview',record:'',category:'all',kind:'all'});return;}
    if(!canQuery())return;
    if(name==='back')goBack();
    else if(name==='page'&&pages.includes(value)&&value!=='record'){
      if(value===state.page&&!(value==='help'&&state.record))return;
      update({page:value,record:''},true,value==='help'&&state.page!=='help');
    }
    else if(name==='all-records')update({page:'records',category:'all',kind:'all',record:''},true,true);
    else if(name==='category'&&categories.includes(value))update({page:'records',category:value,kind:'all',record:''},true,true);
    else if(name==='filter'&&['all',...categories].includes(value))update({category:value,record:''},false);
    else if(['record','related'].includes(name)&&findRecord(value))update({page:'record',record:value},true,true);
    else if(name==='help-record'&&state.page==='record')update({page:'help'},true,true);
    else if(name==='reset-filters')update({category:'all',kind:'all'},false);
    else if(name==='period'&&['month','year'].includes(value))update({period:value,record:''},false);
    else if(name==='month'&&months.includes(value))update({period:'month',month:value,year:value.slice(0,4),page:'records',category:'all',kind:'all',record:''},true,true);
    else if(name==='latest-month')update({period:'month',month:months[0],year:years[0],record:''},false);
    else if(name==='retry'){state.scene='full';writeURL();notice='已重新加载演示记录。';render();}
  });
  root.addEventListener('submit',event=>{
    if(event.target.id!=='h5-login'||!['signedout','expired'].includes(session))return;
    event.preventDefault();
    loginPhone=String(event.target.elements.phone.value).trim();
    const code=String(event.target.elements.code.value).trim();
    loginError=loginPhone!=='13900000000'?'当前为模拟登录，请使用示例账号 13900000000。':code!=='000000'?'模拟验证码不正确，请输入 000000。':'';
    if(loginError){render();const input=root.querySelector?.('#h5-code');if(input)input.value=code;return;}
    setSession('active');state.scene='full';notice='已登录示例账号，继续查询。';writeURL();render(true);
  });
  document.getElementById('page-catalog')?.addEventListener?.('click',event=>{
    const id=event.target.closest('a[data-catalog]')?.dataset?.catalog;
    if(!id||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    event.preventDefault();openCatalog(id);
  });
  document.getElementById('catalog-return')?.addEventListener?.('click',()=>document.getElementById('catalog-heading')?.focus?.());
  function restoreView(){readURL();const saved=readNavigation();notice='';render();restorePosition(saved);}
  window.addEventListener?.('popstate',restoreView);
  window.addEventListener?.('hashchange',restoreView);
  readURL();readNavigation();
  const requestedCatalog=new URL(location.href).searchParams.get('catalog');
  if(requestedCatalog&&openCatalog(requestedCatalog,false))return;
  if(['login','expired','denied'].includes(state.scene))setSession(({login:'signedout',expired:'expired',denied:'denied'}[state.scene]));
  writeURL();render();
})();
