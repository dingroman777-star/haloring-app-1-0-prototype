/* V6.6 academy: one catalog and one detail flow, using existing member assets. */
(() => {
  'use strict';
  const query=new URLSearchParams(location.search);
  if(query.get('partnerUI')!=='review'||query.get('academyUI')!=='review')return;
  const base=window.HALO_COMMERCIAL_EXTENSION,M=window.HaloAcademyHomeModel,ranks=window.HaloPartnerReviewModel;
  const original={render:base.render,handle:base.handleAction,review:base.reviewControls};
  const full=query.get('scene')==='full';
  const previewSample=()=>{const value=new URLSearchParams(location.search).get('academyPreview');return Object.hasOwn(M.pageSpecs,value)?value:'';};
  const previewVariant=()=>{const v=new URLSearchParams(location.search).get('academyVariant');return ['failed','waiting','live','ended','cancelled','offline'].includes(v)?v:'default';};
  function previewUrl(id,enabled=true,variant='default'){
    const url=new URL(location.href||'http://127.0.0.1:8881/index.html'+location.search);
    url.hash=id;url.searchParams.set('v','6.6');
    url.searchParams.delete('academyPreview');url.searchParams.delete('academyVariant');
    if(enabled){url.searchParams.set('academyPreview',id);if(variant!=='default')url.searchParams.set('academyVariant',variant);}
    return url;
  }
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
  const button=(label,event,cls='',attrs='')=>'<button type="button" class="'+cls+'" data-action="academy:'+event+'" '+attrs+'>'+label+'</button>';
  const open=(label,id,cls='')=>button(label,'preview:'+id,cls);
  const resources={
    materials:{title:'产品资料与常见问题',description:'产品介绍、连接使用与问题反馈',body:'介绍产品时，先核对当前款式的功能和已发布资料。协助连接时，请客户选择自己的戒指；记录未更新时，先查看连接与同步状态，再整理问题联系支持。不要替客户承诺未经确认的功能。'},
    notice:{title:'客户服务与沟通',description:'服务边界、隐私保护与沟通提醒',body:'先了解客户的问题，再说明可采取的下一步。不公开客户身份、身体记录或收款信息；无法确认的问题，记录后联系正式支持。合作申请、签署与生效状态，以代理中心显示的进度为准。'},
    orders:{title:'订单与售后指南',description:'核对订单状态，协助客户联系售后',body:'先请客户在自己的订单中查看当前状态，再说明对应的服务入口。发货、退换与售后处理结果，以订单中的实际进度和已发布政策为准。不要代客户承诺处理结果，也不要索取与处理问题无关的身份或健康资料。'}
  };
  const resourceFiles={
    materials:{url:'assets/academy/product-reference-demo.pdf',name:'产品资料与常见问题（原型示例）.pdf',bytes:29320,pages:1},
    orders:{url:'assets/academy/service-reference-demo.pdf',name:'订单与售后指南（原型示例）.pdf',bytes:29291,pages:1}
  };
  function resourceAttachment(id){
    const file=resourceFiles[id];if(!file)return '';
    return '<section class="ac-panel ac-file" aria-label="PDF 附件"><div class="ac-file-heading"><span class="ac-file-icon" aria-hidden="true">PDF</span><div><h2>'+escape(file.name)+'</h2><p>PDF · '+file.pages+' 页 · '+(file.bytes/1024).toFixed(1)+' KB</p></div></div><div class="ac-file-actions"><a class="ac-primary" href="'+escape(file.url)+'" target="_blank" rel="noopener" aria-label="查看 PDF：'+escape(file.name)+'（新窗口）">查看 PDF ↗</a><a class="ac-secondary" href="'+escape(file.url)+'" download="'+escape(file.name)+'">下载 PDF</a></div><p class="ac-preview-note">查看将在新窗口打开，原页面保留。无法预览时可下载后打开。</p><p class="ac-preview-note">原型示例资料，正式文件待替换。查看与下载不会自动标记已读。</p></section>';
  }
  let view=M.fixture(full),scope='',stamp='',feedback='',ready=false,lastRank=null,ownedAdvanced=false;
  function read(ctx){
    ownedAdvanced=false;
    const identity=ctx.applicationContext?.()||{};
    if(!identity.signedIn||!identity.accountRef){ready=false;return {signedIn:false,rank:0};}
    const sample=previewSample(),variant=previewVariant();
    const key=(sample?'haloAcademyHandoffV1:':'haloAcademyHomeV1:')+identity.accountRef+':'+(ctx.memberCreatedAt||'existing')+(sample?':'+sample+':'+variant:'');
    try{
      const shared=base.partnerStatus?.(ctx),rank=shared?(shared.eligible?shared.level:0):0;
      if(!M.validRank(rank))throw new Error('invalid-role');
      const seed=sample?M.handoffFixture(sample):M.fixture(full);
      if(sample==='ACA-03'&&variant==='failed'){seed.results.guide=false;seed.answers.guide='yes';}
      if(sample==='ACA-06'&&variant!=='default'){
        seed.selected=variant==='offline'?'offline':'online';seed.bookings={...seed.bookings,[seed.selected]:'booked'};
      }
      const raw=localStorage.getItem(key),stored=raw?JSON.parse(raw):seed;
      if(!object(stored)||stored.version!==1||!object(stored.progress))throw new Error('invalid');
      for(const field of ['bookings','answers','results'])if(stored[field]!==undefined&&!object(stored[field]))throw new Error('invalid-record');
      if(stored.reads!==undefined&&!Array.isArray(stored.reads))throw new Error('invalid-reads');
      if(scope!==key){feedback='';scope=key;}
      // Keep retired requiredTraining data, without using it as a course or application gate.
      view={...M.fixture(full),bookings:full?{offline:'booked'}:{},answers:{},results:{},reads:[],...stored,
        filter:Object.hasOwn(M.groups,stored.filter)?stored.filter:'all',
        panel:Object.hasOwn(M.panels,stored.panel)?stored.panel:stored.panel==='bookings'?'learning':'courses',
        detailMode:['overview','lesson','quiz','result'].includes(stored.detailMode)?stored.detailMode:'overview'};
      if(view.selected==='intro')view.selected='materials';
      stamp=raw||'';ready=true;lastRank=rank;
      ownedAdvanced=base.academyEntitlement?.(ctx)===true;
      let assets;
      try{assets=window.HALO_MEMBER_DATA?.snapshot(ctx);}catch{/* Free learning remains available. */}
      return {signedIn:true,rank,points:assets?.sourceVerified&&Number.isSafeInteger(assets.points)?assets.points:null,pending:assets?.pending||0};
    }catch{ready=false;lastRank=null;view=M.fixture(false);feedback='暂时无法读取学习记录。请重试，原记录没有被清空。';return {signedIn:true,rank:null,points:null};}
  }
  function save(next){
    if(!ready)return false;
    try{
      if((localStorage.getItem(scope)||'')!==stamp)throw new Error('conflict');
      localStorage.setItem(scope,JSON.stringify(next));stamp=JSON.stringify(next);view=next;feedback='';return true;
    }catch{ready=false;feedback='这次未能保存，或记录已在其他窗口更新。请重新读取后继续。';return false;}
  }
  const progress=c=>Math.min(c.lessons,Math.max(0,Number.isInteger(view.progress[c.id])?view.progress[c.id]:0));
  function projectRoute(id,s){
    const spec=M.pageSpecs[id];if(!spec||!ready)return;
    if(spec.panel)view.panel=spec.panel;
    else if(spec.kind==='course'){
      if(!M.courses.some(c=>c.id===view.selected))view.selected=M.available(s.rank)[0]?.id||'';
      view.detailMode=spec.mode;
      const c=M.available(s.rank).find(c=>c.id===view.selected);
      if(c&&spec.mode==='lesson'&&(!Number.isInteger(view.lessonIndex)||view.lessonIndex<0||view.lessonIndex>progress(c)||view.lessonIndex>=c.lessons))view.lessonIndex=Math.min(progress(c),c.lessons-1);
    }else if(spec.kind==='event'&&!M.events.some(e=>e.id===view.selected))view.selected=M.schedule(s.rank)[0]?.id||'';
    else if(spec.kind==='resource'&&!resources[view.selected])view.selected='materials';
  }
  const listReturn=()=>Object.values(M.panelRoutes).includes(view.returnRoute)?view.returnRoute:M.panelRoutes[view.panel]||'AGT-07';
  const owned=c=>c.id==='advanced'&&ownedAdvanced;
  const status=c=>view.results[c.id]&&progress(c)===c.lessons?'已完成':progress(c)===c.lessons?'待测评':progress(c)>0?'学习中':owned(c)?'已兑换 · 未开始':'未开始';
  const notice=()=>(previewSample()?'<p class="ac-preview-note">开发 / UI 演示 · 独立示例，不改动原学习记录</p>':'')+(feedback?'<div class="ac-feedback" role="status"><p>'+escape(feedback)+'</p>'+button('重新读取','refresh','ac-link')+'</div>':'');
  function courseRow(c){
    return open('<span class="ac-course-icon ac-'+c.category+'" aria-hidden="true">'+({product:'◎',life:'☾',business:'↗'}[c.category])+'</span><span class="ac-course-copy"><strong>'+escape(c.title)+'</strong><small>'+c.lessons+' 节 · '+c.minutes+' 分钟'+(progress(c)||owned(c)?' · '+status(c)+(progress(c)?' '+progress(c)+'/'+c.lessons:''):'')+'</small><em>'+(owned(c)?(progress(c)?'已兑换':'开始学习'):M.priceLabel(c))+'</em></span><span aria-hidden="true">›</span>',c.id,'ac-course');
  }
  const eventPhase=e=>previewSample()==='ACA-06'&&['waiting','live','ended','cancelled','offline'].includes(previewVariant())?(previewVariant()==='offline'?'waiting':previewVariant()):M.eventPhase(e);
  const phaseLabel={waiting:'待开课',live:'进行中',ended:'已结束',cancelled:'课程已取消',unpublished:'待发布'};
  function eventRow(e){
    const phase=eventPhase(e),label=phaseLabel[phase]+(view.bookings[e.id]==='booked'?' · 已报名':view.bookings[e.id]==='cancelled'?' · 已取消报名':phase==='waiting'?' · 可报名':'');
    return open('<span class="ac-date">'+e.date.slice(5).replace('-','/')+'</span><span><strong>'+escape(e.title)+'</strong><small>'+escape(e.mode+' · '+e.time)+'</small><em>'+label+'</em></span><span aria-hidden="true">›</span>',e.id,'ac-event');
  }
  function catalog(s){
    const all=M.available(s.rank),courses=M.available(s.rank,view.filter),list=view.expanded?courses:courses.slice(0,4);
    const continuing=all.find(c=>progress(c)>0&&status(c)!=='已完成'),recommended=continuing||all.find(c=>c.price===0&&status(c)!=='已完成');
    return (recommended?'<section class="ac-resume"><span>'+(continuing?'继续上次学习':'从第一课开始')+'</span><h2>'+escape(recommended.title)+'</h2><p>'+(continuing?status(recommended)+' · 已完成 '+progress(recommended)+' / '+recommended.lessons+' 节':'免费入门课程，先熟悉你的 Halo Ring。')+'</p>'+open(status(recommended)==='待测评'?'完成课后测评':continuing?'继续学习':'查看课程',recommended.id,'ac-primary')+'</section>':'')+
      '<section class="ac-catalog"><div class="ac-section-heading"><h2>课程目录</h2><small>'+all.length+' 门</small></div><nav class="ac-filters" aria-label="课程分类">'+Object.entries(M.groups).map(([id,label])=>button(label,'filter:'+id,'','aria-pressed="'+(view.filter===id)+'"')).join('')+'</nav>'+
      (list.length?list.map(courseRow).join(''):'<div class="ac-empty"><p>当前身份下，这个分类暂无课程。</p>'+button('查看全部课程','filter:all','ac-link')+'</div>')+
      (courses.length>4?button(view.expanded?'收起课程':'查看全部 '+courses.length+' 门课程','expand','ac-more'):'')+'</section>';
  }
  function learning(s){
    const all=M.available(s.rank).filter(c=>progress(c)>0||owned(c)),booked=M.schedule(s.rank).filter(e=>['booked','cancelled'].includes(view.bookings[e.id]));
    const filters={all:'全部',unstarted:'已兑换 · 未开始',studying:'学习中',assessment:'待测评',completed:'已完成'};
    const chosen=Object.hasOwn(filters,view.learningFilter)?view.learningFilter:'all',labels={unstarted:'已兑换 · 未开始',studying:'学习中',assessment:'待测评',completed:'已完成'};
    const list=all.filter(c=>chosen==='all'||status(c)===labels[chosen]);
    return '<section><h2>学习记录</h2><p>学习进度与课后测评分别保存，不影响合作申请和晋升。</p><nav class="ac-filters" aria-label="学习状态">'+Object.entries(filters).map(([id,label])=>button(label,'learning-filter:'+id,'','aria-pressed="'+(chosen===id)+'"')).join('')+'</nav>'+
      (list.length?list.map(courseRow).join(''):'<div class="ac-empty"><p>'+(all.length?'暂无这一状态的课程。':'还没有学习记录，先从免费入门课程开始。')+'</p>'+button('浏览课程','panel:courses','ac-secondary')+'</div>')+'</section>'+
      '<section class="ac-schedule"><h2>我的报名</h2>'+(booked.length?booked.map(eventRow).join(''):'<p class="ac-empty">暂无报名记录。</p>')+button('查看课程安排','panel:schedule','ac-link')+'</section>';
  }
  function home(s){
    const panel=view.panel,events=M.schedule(s.rank);let body='';
    if(panel==='courses')body=catalog(s);
    if(panel==='learning')body=learning(s);
    if(panel==='schedule')body='<section><h2>线上与线下课程</h2><p>查看时间与地点，再选择报名。已报名课程可在“我的学习”管理。</p>'+(events.length?events.map(eventRow).join(''):'<p class="ac-empty">当前身份暂无已发布的线上或线下课程安排。</p>')+'</section>';
    if(panel==='resources')body='<section><h2>资料与服务工具</h2><p>学习内容在课程中，日常查阅和分享工具在这里。</p>'+Object.entries(resources).map(([id,r])=>open('<span><strong>'+r.title+'</strong><small>'+(resourceFiles[id]?'PDF 附件 · ':'图文资料 · ')+r.description+(view.reads.includes(id)?' · 已读':'')+'</small></span><span>›</span>',id,'ac-event')).join('')+
      button('<span><strong>推广工具</strong><small>'+(s.rank>0?'推广名片与分享链接':'合作身份生效后可使用')+'</small></span><span>›</span>','tools','ac-event')+'</section>';
    return '<article class="academy-home"><header class="ac-header">'+button('‹',panel==='courses'?'back':'academy-home','ac-back','aria-label="'+(panel==='courses'?'返回代理中心':'返回商学院')+'"')+'<h1>'+(panel==='courses'?'商学院':M.panels[panel])+'</h1></header>'+
      '<div class="ac-intro"><p>从了解产品，到做好每一次服务。</p><span class="ac-identity">'+escape(s.rank===null?'身份暂未取得':s.rank===0?'普通会员 · Member':ranks.rankLabel(s.rank))+'</span></div>'+
      '<nav class="ac-tabs" aria-label="商学院栏目">'+Object.entries(M.panels).map(([id,label])=>button(label,'panel:'+id,'','aria-pressed="'+(panel===id)+'"')).join('')+'</nav>'+notice()+
      (ready?body:'<p>记录暂不可读取，请重试后继续。</p>')+
      '<div class="ac-points">'+button('<span><strong>Halo Points</strong><small>'+escape(s.points===null?'积分信息暂未取得':s.pending>0?'积分使用暂时暂停':'可用 '+s.points.toLocaleString('zh-CN')+' 积分')+'</small></span><span>积分账户 ›</span>','points','ac-points-link')+'</div>'+
      '<p class="ac-footnote">课程兑换使用现有会员 Halo Points。课程、测评与报名记录都保留在 App 内。</p></article>';
  }
  function quiz(c){
    const q=M.quiz(c);
    if(view.detailMode==='result')return '<section class="ac-panel"><h2>'+(view.results[c.id]?'测评已通过':'本次测评未通过')+'</h2><p role="status">'+(view.results[c.id]?'课程已完成 · 学习记录已保存':'答案与已学进度均保留，可以重新作答。')+'</p><p>'+escape(q.explanation)+'</p>'+button(view.results[c.id]?'查看学习记录':'重新作答',view.results[c.id]?'my-learning':'retry-quiz','ac-primary')+button('回顾课程','overview','ac-secondary')+'</section>';
    return '<section class="ac-panel"><h2>课后测评</h2><p>'+escape(q.question)+'</p><div role="group" aria-label="测评答案">'+button('可以','answer:yes','ac-secondary','aria-pressed="'+(view.answers[c.id]==='yes')+'"')+button('不可以','answer:no','ac-secondary','aria-pressed="'+(view.answers[c.id]==='no')+'"')+'</div><p>当前选择：'+(view.answers[c.id]==='no'?'不可以':view.answers[c.id]==='yes'?'可以':'尚未选择')+'</p>'+button('提交测评','quiz','ac-primary')+'</section>';
  }
  function detail(s,ctx){
    const c=M.available(s.rank).find(c=>c.id===view.selected),ev=M.schedule(s.rank).find(c=>c.id===view.selected),r=resources[view.selected];
    const inside=c&&view.detailMode!=='overview',name=c?.title||ev?.title||r?.title||'内容暂不可查看';
    const returnLabel=r?'资料工具':ev?(view.returnRoute==='ACA-04'?'我的学习':'课程安排'):listReturn()==='ACA-04'?'我的学习':'商学院';
    const head='<article class="academy-home"><header class="ac-header ac-detail-header">'+button(inside?'‹ 返回课程':'‹ 返回'+returnLabel,inside?'overview':'home','ac-detail-back')+'<h1>'+escape(name)+'</h1></header>'+notice();
    if(!ready)return head+'<p>记录暂不可读取，请重试后继续。已有进度仍保留。</p>'+button('返回商学院','home','ac-secondary')+'</article>';
    if(!c&&!ev&&!r)return head+'<p>请返回商学院重新选择，学习记录仍保留。</p>'+button('返回商学院','home','ac-primary')+'</article>';
    if(r)return head+'<section class="ac-panel"><p>'+escape(r.body)+'</p></section>'+resourceAttachment(view.selected)+button(view.reads.includes(view.selected)?'已读 · 返回资料工具':'标记已读','read-resource','ac-primary')+'</article>';
    if(ev){
      const booked=view.bookings[ev.id]==='booked',phase=eventPhase(ev);
      let attendance='';
      if(booked&&['waiting','live'].includes(phase)){
        if(ev.mode==='线上课程')attendance='<section class="ac-panel"><h2>'+(phase==='live'?'进入课堂':'开课前准备')+'</h2><p>'+escape(ev.preparation||'请留意课程通知。')+'</p>'+(phase==='waiting'?'<p>开课时间：'+escape(ev.date+' '+ev.time)+'（北京时间）。到时重新查看本页即可进入。</p>':ev.room?(view.eventRoom===ev.id?'<section class="ac-room" aria-label="线上课堂演示"><h3>产品介绍与答疑 · 课堂演示</h3><p>这里展示课堂进入后的页面位置，尚未接入直播，不播放真实课程，也不自动记录出席或学习完成。</p>'+button('返回课程安排详情','leave-room','ac-secondary')+'</section>':button('进入线上课堂（演示）','join','ac-primary')):'<p>课堂入口暂未取得，请联系课程支持。</p>')+'</section>';
        else attendance='<section class="ac-panel"><h2>到场信息</h2><p>'+escape(ev.address||'地址待确认，请联系课程支持。')+'</p><p>'+escape(ev.arrival||'请留意正式到场通知。')+'</p></section>';
      }
      if(phase==='ended')attendance='<section class="ac-panel"><h2>课程已结束</h2><p>'+(ev.replayAvailable?'回放信息待接入，请联系课程支持。':'本场暂无已发布回放。')+'</p></section>';
      if(phase==='cancelled')attendance='<section class="ac-panel"><h2>课程已取消</h2><p>请勿前往课堂或现场。报名记录保留，可以查看其他安排或联系课程支持。</p></section>';
      const booking=phase==='waiting'?(booked?(view.cancelBooking===ev.id?'<p>确认取消这次报名？课程学习记录不会受影响。</p>'+button('确认取消本次报名','cancel-booking','ac-secondary')+button('保留报名','keep-booking','ac-primary'):button('取消报名','ask-cancel','ac-secondary')):button('确认报名（模拟）','book','ac-primary')):phase==='unpublished'?'<p>报名信息尚未发布，请稍后再来查看。</p>':phase==='live'&&!booked?'<p>本场已开始，报名已结束。可查看其他课程安排。</p>':'';
      return head+'<section class="ac-panel"><p>'+escape(ev.description)+'</p><dl><div><dt>课程状态</dt><dd>'+phaseLabel[phase]+'</dd></div><div><dt>时间</dt><dd>'+escape(ev.date+' '+ev.time)+'（北京时间）</dd></div><div><dt>地点</dt><dd>'+escape(ev.place)+'</dd></div><div><dt>报名状态</dt><dd>'+(booked?'已报名':view.bookings[ev.id]==='cancelled'?(phase==='waiting'?'已取消报名 · 开课前可报名':'已取消报名'):phase==='waiting'?'可报名 · 本地模拟，不收取费用':'未报名')+'</dd></div></dl></section>'+attendance+booking+button('刷新课程状态','refresh','ac-link')+button('联系课程支持','event-support','ac-link')+'</article>';
    }
    const done=progress(c),entitled=c.price===0||c.price>0&&base.academyEntitlement?.(ctx)===true;
    if(c.price===null)return head+'<p>本课程报名信息尚未发布，暂不能开始学习。</p>'+button('返回商学院','home','ac-primary')+'</article>';
    if(!entitled)return head+'<section class="ac-panel"><p>'+escape(c.description)+'</p><h2>'+M.priceLabel(c)+'</h2><p>下一步在现有 Halo Points 账户中核对并确认兑换，当前不会扣积分。</p></section>'+button('核对并兑换课程','redeem','ac-primary')+button('查看积分账户','points','ac-secondary')+'</article>';
    if(['quiz','result'].includes(view.detailMode)){
      if(done!==c.lessons||view.detailMode==='result'&&typeof view.results[c.id]!=='boolean')return head+'<h2>'+(view.detailMode==='quiz'?'完成课节后再测评':'暂无测评结果')+'</h2><p>请返回课程继续学习。直接打开页面不会生成成绩。</p>'+button('返回课程','overview','ac-primary')+'</article>';
      if(view.detailMode==='quiz'&&view.results[c.id]===true)return head+'<h2>本课程测评已通过</h2><p>无需重复提交，可查看已保存的结果。</p>'+button('查看测评结果','start-quiz','ac-primary')+'</article>';
      return head+quiz(c)+'</article>';
    }
    if(view.detailMode==='lesson'){
      const index=Math.min(done,c.lessons-1,Math.max(0,Number.isInteger(view.lessonIndex)?view.lessonIndex:done)),lesson=M.lesson(c,index);
      return head+'<p class="ac-preview-note">图文课节演示 · 第 '+(index+1)+' / '+c.lessons+' 节</p><section class="ac-panel"><h2>'+escape(lesson.title)+'</h2><p>'+escape(lesson.body)+'</p></section>'+
        (index<done?'<p>本节已完成，回顾不会重复增加进度。</p>'+button('返回课程目录','overview','ac-primary'):button(index===c.lessons-1?'完成本节，进入测评':'完成本节，学习下一节','lesson:'+index,'ac-primary'))+'</article>';
    }
    return head+'<p>'+escape(c.description)+'</p><p>'+c.lessons+' 节 · '+c.minutes+' 分钟 · '+status(c)+'</p><progress class="ac-progress" aria-label="课程完成进度" max="'+c.lessons+'" value="'+done+'"></progress>'+
      (done===c.lessons?button(view.results[c.id]?'查看测评结果':'开始课后测评','start-quiz','ac-primary'):button(done?'继续第 '+(done+1)+' 节':'开始学习','study:'+done,'ac-primary'))+
      '<section class="ac-panel"><h2>课程目录</h2>'+Array.from({length:c.lessons},(_,i)=>'<div class="ac-chapter">'+(i<=done?button('<span>第 '+(i+1)+' 节 · '+escape(M.lesson(c,i).title)+'</span><small>'+(i<done?'已完成 · 回顾':'待学习 ›')+'</small>','study:'+i):'<span>第 '+(i+1)+' 节 · '+escape(M.lesson(c,i).title)+'</span><small>完成前一节后继续</small>')+'</div>').join('')+'</section><p class="ac-preview-note">当前为图文课节演示，正式视频与测评题库待配置。看完课节后主动确认完成，不会自动发放积分。</p></article>';
  }
  base.render=(item,ctx)=>{
    item={...item,id:window.HaloPartnerNavigation.resolve(item.id)};
    if(!M.pageSpecs[item.id])return original.render(item,ctx);
    const s=read(ctx);
    projectRoute(item.id,s);
    return s.signedIn?(M.pageSpecs[item.id].panel?home(s):detail(s,ctx)):'<section class="academy-home"><h1>登录后查看商学院</h1><p>普通会员也可以学习基础课程。</p>'+button('去登录','login','ac-primary')+'</section>';
  };
  base.handleAction=(event,ctx)=>{
    if(/^commercial:(training-|course-|assessment-)/.test(event)||/^academy:(training|required-)/.test(event)){ctx.go('AGT-07');return true;}
    if(!event.startsWith('academy:'))return original.handle(event,ctx);
    const current=ctx.applicationContext?.()||{},currentPage=window.HaloPartnerNavigation.resolve(current.page);
    if(current.page&&!M.pageSpecs[currentPage])return true;
    const oldScope=scope,oldRank=lastRank,oldStamp=stamp;
    const s=read(ctx),[,name,value]=event.split(':');
    projectRoute(currentPage,s);
    if(name==='login'){ctx.go('AUTH-01');return true;}
    if(name==='back'){ctx.go('AGT-05');return true;}
    if(!s.signedIn){ctx.go('AUTH-01');return true;}
    if(name==='home'){ctx.go(M.pageSpecs[currentPage]?.kind==='resource'?'ACA-08':M.pageSpecs[currentPage]?.kind==='event'?(view.returnRoute==='ACA-04'?'ACA-04':'ACA-05'):listReturn());return true;}
    if(name==='academy-home'){ctx.go('AGT-07');return true;}
    if(name==='refresh'){if(ready)feedback='学习记录已更新。';ctx.render();return true;}
    if(oldScope&&oldScope!==scope||oldRank!==s.rank){feedback='身份或学习记录已更新，请核对后继续。';ctx.render();return true;}
    if(name==='points'){ctx.go('PTS-01');return true;}
    if(!ready){ctx.render();return true;}
    if(oldStamp!==stamp){feedback='学习记录已在其他页面更新，请核对后继续。';ctx.render();return true;}
    if(name==='tools'){
      if(!base.partnerStatus?.(ctx)?.active){feedback='合作身份生效后可使用推广工具。';ctx.render();return true;}
      ctx.go('CHN-26');return true;
    }
    let next={...view},destination='';
    if(name==='filter'&&Object.hasOwn(M.groups,value)){next.filter=value;next.expanded=false;next.panel='courses';next.selected='';}
    else if(name==='expand')next.expanded=!view.expanded;
    else if(name==='panel'&&Object.hasOwn(M.panels,value||'courses')){next.panel=value||'courses';next.selected='';}
    else if(name==='panel'&&value==='bookings'){next.panel='learning';next.selected='';}
    else if(name==='learning-filter'&&['all','unstarted','studying','assessment','completed'].includes(value))next.learningFilter=value;
    else if(name==='my-learning'){next.panel='learning';next.learningFilter='all';if(save(next))ctx.go('ACA-04');return true;}
    else if(name==='preview'){
      if(!M.pageSpecs[currentPage]?.panel)return true;
      if(!M.canOpen(s.rank,value)&&!resources[value]){feedback='当前身份暂不可查看这项课程。';ctx.render();return true;}
      next.selected=value;next.detailMode='overview';next.cancelBooking='';next.returnRoute=currentPage;delete next.lessonIndex;
      if(save(next))ctx.go(resources[value]?'ACA-07':M.events.some(e=>e.id===value)?'ACA-06':'AGT-08');return true;
    }else if(['overview','study','start-quiz','retry-quiz','lesson','answer','quiz','book','ask-cancel','cancel-booking','keep-booking','read-resource','redeem','join','leave-room','event-support'].includes(name)){
      if(!M.pageSpecs[currentPage]?.kind)return true;
      const c=M.available(s.rank).find(c=>c.id===view.selected),ev=M.schedule(s.rank).find(c=>c.id===view.selected),r=resources[view.selected];
      if(!c&&!ev&&!r)return true;
      const allowed=c&&(c.price===0||c.price>0&&base.academyEntitlement?.(ctx)===true);
      if(name==='redeem'){if(previewSample()){feedback='当前是独立交付示例；请退出演示后使用原积分兑换流程。';ctx.render();return true;}if(c?.id==='advanced'&&s.rank>=1&&!base.openAcademyRedemption?.(ctx)){feedback='当前兑换条件暂未取得，请查看积分账户或开启新的完整演示场景。';ctx.render();}return true;}
      if(['overview','study','start-quiz','retry-quiz','lesson','answer','quiz'].includes(name)&&!allowed)return true;
      if(name==='overview'){next.detailMode='overview';destination='AGT-08';}
      if(name==='study'){const index=Number(value);if(!Number.isInteger(index)||index<0||index>progress(c)||index>=c.lessons)return true;next.lessonIndex=index;next.detailMode='lesson';destination='ACA-01';}
      if(name==='start-quiz'){if(progress(c)!==c.lessons)return true;destination=view.results[c.id]?'ACA-03':'ACA-02';}
      if(name==='retry-quiz'){if(currentPage!=='ACA-03'||view.results[c.id]!==false||progress(c)!==c.lessons)return true;destination='ACA-02';}
      if(name==='lesson'){
        if(view.detailMode!=='lesson'||Number(value)!==view.lessonIndex||Number(value)!==progress(c)||progress(c)>=c.lessons)return true;
        next.progress={...view.progress,[c.id]:progress(c)+1};next.lessonIndex=progress(c)+1;next.detailMode=next.lessonIndex===c.lessons?'quiz':'lesson';destination=next.detailMode==='quiz'?'ACA-02':'ACA-01';
      }
      if(name==='answer'||name==='quiz'){
        if(view.detailMode!=='quiz'||progress(c)!==c.lessons||view.results[c.id])return true;
        const q=M.quiz(c);
        if(name==='answer'){if(!['yes','no'].includes(value))return true;next.answers={...view.answers,[c.id]:value};}
        else{if(!['yes','no'].includes(view.answers[c.id])){feedback='请先选择答案。';ctx.render();return true;}next.results={...view.results,[c.id]:view.answers[c.id]===q.answer};destination='ACA-03';}
      }
      if(name==='book'){if(!ev||eventPhase(ev)!=='waiting'||view.bookings[ev.id]==='booked')return true;next.bookings={...view.bookings,[ev.id]:'booked'};}
      if(name==='ask-cancel'){if(!ev||eventPhase(ev)!=='waiting'||view.bookings[ev.id]!=='booked')return true;next.cancelBooking=ev.id;}
      if(name==='cancel-booking'){if(!ev||eventPhase(ev)!=='waiting'||view.cancelBooking!==ev.id||view.bookings[ev.id]!=='booked')return true;next.bookings={...view.bookings,[ev.id]:'cancelled'};next.cancelBooking='';next.eventRoom='';}
      if(name==='join'){if(!ev||eventPhase(ev)!=='live'||view.bookings[ev.id]!=='booked'||!ev.room)return true;next.eventRoom=ev.id;}
      if(name==='leave-room'){if(!ev||view.eventRoom!==ev.id)return true;next.eventRoom='';}
      if(name==='event-support'){if(ev)ctx.go('HELP-03');return true;}
      if(name==='keep-booking'){if(!ev)return true;next.cancelBooking='';}
      if(name==='read-resource'){if(!r)return true;if(view.reads.includes(view.selected)){ctx.go('ACA-08');return true;}next.reads=[...new Set([...view.reads,view.selected])];}
    }else return true;
    if(name==='panel'||name==='filter')destination=M.panelRoutes[next.panel];
    if(save(next)&&destination&&destination!==currentPage)ctx.go(destination);else ctx.render();return true;
  };
  base.reviewControls=item=>M.pageSpecs[item.id]?'<section class="p-review-controls"><b>商学院 · V6.6 · 开发 / UI 交付</b><p>页面与目录一一对应；左侧目录打开独立示例，App 内操作沿用当前学习流程。示例不改动原学习记录、合作身份或 Halo Points。11 门课程与 5 项安排为模拟内容，正式视频和题库待配置。</p><p><a href="'+escape(previewUrl(item.id).href)+'">打开本页完整示例</a> · <a href="'+escape(previewUrl(item.id,false).href)+'">退出示例，查看实际状态</a></p>'+(item.id==='ACA-03'?'<p><a href="'+escape(previewUrl(item.id,true,'default').href)+'">通过示例</a> · <a href="'+escape(previewUrl(item.id,true,'failed').href)+'">未通过示例</a></p>':'')+(item.id==='ACA-06'?'<p>活动场景：'+[['waiting','待开课'],['live','进行中'],['ended','已结束'],['cancelled','课程取消'],['offline','线下到场']].map(([v,label])=>'<a href="'+escape(previewUrl(item.id,true,v).href)+'">'+label+'</a>').join(' · ')+'</p>':'')+'<p><a href="academy-handoff.html">查看页面清单与交付说明 ↗</a></p></section>':original.review(item);
  for(const [id,spec] of Object.entries(M.pageSpecs)){
    let page=window.HALO_V5_PAGES.find(p=>p.id===id);
    if(!page){page={id};window.HALO_V5_PAGES.push(page);}
    Object.assign(page,{name:spec.name,note:spec.task,group:'商学院',priority:'P0',parent:spec.parent,route:spec.route,
      function:spec.task,data:spec.data,interaction:spec.interaction,exception:spec.exception,
      logic:'返回：'+spec.parent+'。学习记录按账号隔离；学习与测评不作为合作申请或晋升门槛；交付示例单独保存，不回写实际记录。',
      sdk:'无设备 SDK；课程内容、学习记录与活动服务',rules:'本人学习记录；课程权益；重复操作与并发更新保护',owner:'产品 + UI + 前端 + 后端'});
  }
  const directoryOrder=['AGT-07','AGT-08','ACA-01','ACA-02','ACA-03','ACA-04','ACA-05','ACA-06','ACA-08','ACA-07','CHN-26'];
  const ordered=directoryOrder.map(id=>window.HALO_V5_PAGES.find(p=>p.id===id)).filter(Boolean);
  const toolsPage=ordered.find(p=>p.id==='CHN-26');
  if(toolsPage)Object.assign(toolsPage,{parent:'AGT-05 / ACA-08',note:'代理中心与资料工具共用，按来源返回'});
  for(let i=window.HALO_V5_PAGES.length-1;i>=0;i--)if(directoryOrder.includes(window.HALO_V5_PAGES[i].id))window.HALO_V5_PAGES.splice(i,1);
  window.HALO_V5_PAGES.push(...ordered);
  base.openAcademyOwnedCourse=ctx=>{
    const s=read(ctx);if(!s.signedIn||!ready||!ownedAdvanced||!M.canOpen(s.rank,'advanced')||previewSample())return false;
    if(!save({...view,selected:'advanced',detailMode:'overview',returnRoute:'ACA-04'}))return false;
    ctx.go('AGT-08');return true;
  };
  const previousInput=base.handleInput;
  base.handleInput=(target,ctx)=>target.name?.startsWith('channel-assessment')?true:previousInput(target,ctx);
  window.HALO_ACADEMY_REVIEW={enabled:true,owns:id=>!!M.pageSpecs[id],
    directory(id,go){
      if(!M.pageSpecs[id])return false;
      const url=previewUrl(id);url.hash=location.hash||'';
      history.replaceState(history.state,'',url.href);go(id);return true;
    },
    beforeNavigate(id){
      if(!previewSample()||M.pageSpecs[id])return;
      const url=previewUrl(id,false);url.hash=location.hash||'';history.replaceState(history.state,'',url.href);
    },
    back(id,go){
      const spec=M.pageSpecs[id];if(!spec)return false;
      const parent=spec.panel?(id==='AGT-07'?'AGT-05':'AGT-07'):spec.kind==='resource'?'ACA-08':spec.kind==='event'?(view.returnRoute==='ACA-04'?'ACA-04':'ACA-05'):id==='AGT-08'?listReturn():'AGT-08';
      go(parent,false);return true;
    }
  };
})();
