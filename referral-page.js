(function () {
  "use strict";
  const stages={purchase:["等待好友购买","好友通过专属入口完成购买后，这里会更新。",0],activation:["等待激活","购买已确认，等待好友完成注册、实名与硬件激活。",1],verifying:["奖励核验中","正在核对本次推荐与订单状态，暂不需要重复邀请。",2],rewarded:["奖励已记录","可用积分的变化请查看积分明细。",3],closed:["本次未获奖励","可展开查看原因；如有疑问，请联系支持。",-1]};
  const reasons={refund:"关联订单已退款",invalid:"未满足有效推荐条件",channel:"本次订单按渠道规则处理，不重复发放推荐奖励",annual_limit:"本年度有效推荐奖励已达上限"};
  const svg=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${name==="back"?'<path d="m14 5-7 7 7 7"/>':name==="gift"?'<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M3 7h18v4H3zM12 7v14"/><path d="M12 7C3 9 5 0 9 3l3 4c9 2 7-7 3-4Z"/>':name==="link"?'<path d="m10 14 4-4M8 15l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0M16 9l1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0" transform="translate(1 0) scale(.92)"/>':name==="check"?'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>':'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'}</svg>`;
  const validTime=x=>typeof x==="string"&&Number.isFinite(Date.parse(x))&&Date.parse(x)<=Date.now();
  const int=x=>Number.isSafeInteger(x)&&x>=0;
  const year=()=>Number(new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Shanghai",year:"numeric"}).format(new Date()));
  const date=x=>new Intl.DateTimeFormat("zh-CN",{timeZone:"Asia/Shanghai",month:"long",day:"numeric"}).format(new Date(x));
  window.HALO_REFERRAL={create({storageKey,escape:esc}) {
    let feedback="",busy=false,lastScope="",lastContext=null,firstRender=true,view={panel:"home",filter:"all",open:"",top:0};
    const reloadState=location.hash.toUpperCase()==="#REF-01"&&performance.getEntriesByType("navigation")[0]?.type==="reload"?{...history.state}:null;
    const btn=(label,op,cls="secondary",disabled=false)=>`<button type="button" class="${cls}" data-action="commercial:ref-${op}" ${disabled?"disabled":""}>${esc(label)}</button>`;
    const preview=()=>new URL(location.href).searchParams.get("referralPreview");
    const scope=ctx=>JSON.stringify([ctx.applicationContext?.().accountRef||"",ctx.memberCreatedAt||""]);
    function restore(ctx){const key=scope(ctx);if(key===lastScope)return;lastScope=key;feedback="";busy=false;view={panel:"home",filter:"all",open:""};try{const v=JSON.parse(sessionStorage.getItem("haloReferralView:"+key)||"null");if(v&&["home","share"].includes(v.panel)&&["all","ongoing","rewarded"].includes(v.filter))view=v;}catch{}}
    function save(){try{sessionStorage.setItem("haloReferralView:"+lastScope,JSON.stringify(view));}catch{feedback="本次选择暂未保存，刷新后可能需要重新打开。";}}
    function demo(mode,owner,registrationId){const at=new Date(Date.now()-86400000).toISOString();return {accountRef:owner,registrationId,updatedAt:at,year:year(),awardedCount:mode==="cap"?12:mode==="progress"?1:0,records:mode==="progress"?[
      {id:"DEMO-01",status:"activation",createdAt:at},{id:"DEMO-02",status:"verifying",createdAt:at},{id:"DEMO-03",status:"rewarded",createdAt:at,receipt:{id:"DEMO-RECEIPT",points:20000,growth:0,postedAt:at}},{id:"DEMO-04",status:"closed",reason:"refund",createdAt:at}]:[]};}
    function read(ctx){
      const owner=ctx.applicationContext?.().accountRef,registrationId=ctx.memberCreatedAt||"";
      let login,raw;try{login=JSON.parse(localStorage.getItem("haloV5AppProgress")||"null");raw=JSON.parse(localStorage.getItem(storageKey)||"null");}catch{return {ok:false,demo:false};}
      const signed=!!owner&&ctx.applicationContext?.().signedIn===true&&login?.signedIn===true&&(login.authPhone||login.authForm?.phone)===owner&&(login.memberCreatedAt||"")===registrationId;
      if(!signed)return {ok:false,demo:false};
      const mode=preview(),isDemo=["empty","progress","cap","error"].includes(mode);
      const s=isDemo&&mode!=="error"?demo(mode,owner,registrationId):isDemo?null:raw?.referralSnapshot;
      const ok=s?.accountRef===owner&&(s.registrationId||"")===registrationId&&validTime(s.updatedAt)&&s.year===year()&&int(s.awardedCount)&&s.awardedCount<=12&&Array.isArray(s.records)&&s.records.length<=200&&new Set(s.records.map(r=>r?.id)).size===s.records.length&&s.records.every(r=>r&&typeof r.id==="string"&&/^[A-Za-z0-9_-]{1,60}$/.test(r.id)&&Object.hasOwn(stages,r.status)&&validTime(r.createdAt)&&Date.parse(r.createdAt)<=Date.parse(s.updatedAt)&&(r.status!=="rewarded"||(r.receipt&&typeof r.receipt.id==="string"&&r.receipt.id.length>0&&int(r.receipt.points)&&r.receipt.points<=20000&&[0,150].includes(r.receipt.growth)&&validTime(r.receipt.postedAt)&&Date.parse(r.receipt.postedAt)<=Date.parse(s.updatedAt))));
      let url="";if(ok&&!isDemo&&s.share?.status==="active"&&typeof s.share.url==="string"&&Date.parse(s.share.expiresAt)>Date.now())try{const u=new URL(s.share.url);if(u.protocol==="https:"&&!u.username&&!u.password&&!/^(localhost|127\.|0\.|\[|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(u.hostname)&&!u.hostname.endsWith(".local"))url=u.href;}catch{}
      return {ok:!!ok,demo:isDemo,owner,s:ok?s:null,url,cap:ok&&s.awardedCount===12};
    }
    function render(ctx){
      lastContext=ctx;restore(ctx);
      if(firstRender&&reloadState?.referralScope===lastScope)history.replaceState({...history.state,referralPanel:reloadState.referralPanel,referralScope:lastScope,referralChild:reloadState.referralChild},"",location.href);
      const storedPanel=history.state?.referralScope===lastScope?history.state.referralPanel:null;
      view.panel=storedPanel==="share"?"share":firstRender&&performance.getEntriesByType("navigation")[0]?.type==="reload"&&view.panel==="share"?"share":"home";
      firstRender=false;
      history.replaceState({...history.state,referralPanel:view.panel,referralScope:lastScope},"",location.href);
      const m=read(ctx),s=m.s;
      const renderScope=lastScope,targetTop=Number.isFinite(view.top)?view.top:0;
      requestAnimationFrame(()=>{if(lastScope===renderScope){const el=document.querySelector('#screen[data-page="REF-01"] .ref-scroll');if(el)el.scrollTop=targetTop;}});
      const header=`<header class="ref-header"><button type="button" data-action="${view.panel==="share"?"commercial:ref-home":"previous"}" aria-label="返回">${svg("back")}</button><h1>${view.panel==="share"?"邀请好友":"会员推荐"}</h1>${btn("刷新","refresh","ref-text")}</header>`;
      const banner=m.demo?'<p class="ref-demo">原型演示 · 非真实推荐记录</p>':"";
      const status=`<p class="ref-feedback" role="status" aria-live="polite">${esc(feedback)}</p>`;
      if(view.panel==="share"){
        const canCopy=m.demo&&!m.cap||!!m.url&&!m.cap;
        return `<article class="ref-page">${header}<div class="ref-scroll">${banner}<section class="ref-invite"><span class="ref-emblem">${svg("link")}</span><h2>${m.cap?"本年推荐奖励已达上限":m.url?"把邀请发给好友":m.demo?"试试看邀请内容":"专属邀请链接暂未取得"}</h2><p>${m.cap?"今年已奖励 12 位有效新会员，本年后续推荐不再发放推荐奖励。":m.url?"好友需从这条专属链接进入，才能核对本次推荐。":m.demo?"这里可以复制演示文案，不会生成真实推荐关系。":"可以刷新重试，或联系客服帮助核对。"}</p></section>${canCopy?`<label class="ref-copy-label" for="ref-invitation">${m.demo?"演示邀请文案":"邀请内容"}</label><textarea id="ref-invitation" readonly rows="5">${esc(invitation(m))}</textarea><p class="ref-small">${m.demo?"不包含有效推荐链接，请勿作为正式邀请发送。":"好友奖励用于后续消费，不能抵扣当前首单。"}</p>`:""}${status}${btn("联系支持","support","ref-support")}</div><footer class="ref-footer">${canCopy?btn(busy?"正在复制…":m.demo?"复制演示文案":"复制邀请链接","copy","primary",busy):btn("重新获取","refresh","primary")}${btn("返回推荐页","home","ref-text")}</footer></article>`;
      }
      const records=s?.records||[],filtered=records.filter(r=>view.filter==="all"||view.filter==="rewarded"&&r.status==="rewarded"||view.filter==="ongoing"&&["purchase","activation","verifying"].includes(r.status));
      const rows=filtered.map(r=>{const t=stages[r.status],open=view.open===r.id;return `<section class="ref-record"><button class="ref-record-toggle" type="button" data-action="commercial:ref-open:${esc(r.id)}" aria-expanded="${open}"><span class="ref-record-icon ${r.status==="rewarded"?"is-done":""}">${svg(r.status==="rewarded"?"check":"clock")}</span><span><strong>${esc(t[0])}</strong><small>${esc(date(r.createdAt))} · ${esc(r.id)}</small></span><span aria-hidden="true">${open?"−":"＋"}</span></button>${open?`<div class="ref-record-body"><p>${esc(r.status==="closed"?reasons[r.reason]||"具体原因待核对，请联系支持。":t[1])}</p>${r.status!=="closed"?`<ol class="ref-steps" aria-label="本次推荐进度">${["购买","激活","核验","奖励"].map((label,i)=>`<li class="${i<t[2]?"is-complete":i===t[2]?"is-current":""}"><span>${i<t[2]?"✓":i+1}</span>${label}${i===t[2]?'<em>当前</em>':""}</li>`).join("")}</ol>`:""}${r.status==="rewarded"?`<dl class="ref-receipt"><div><dt>已记录积分</dt><dd>${r.receipt.points.toLocaleString()} Points</dd></div><div><dt>已记录成长</dt><dd>${r.receipt.growth}</dd></div><div><dt>记入时间</dt><dd>${esc(date(r.receipt.postedAt))}（北京时间）</dd></div></dl>${m.demo?'<p class="ref-small">仅演示记录，不改变积分余额。</p>':btn("查看积分明细","points","ref-text")}`:""}${btn("对此记录有疑问","support","ref-text")}</div>`:""}</section>`;}).join("");
      return `<article class="ref-page">${header}<div class="ref-scroll">${banner}<section class="ref-hero"><span class="ref-emblem">${svg("gift")}</span><p>分享 Halo，好礼一起拿</p><h2>邀请好友<br>一起用 Halo</h2><div class="ref-rewards"><div><span>你可获得</span><strong>20,000</strong><small>Halo Points / 位</small></div><div><span>好友可获得</span><strong>5,000</strong><small>Halo Points</small></div></div><p class="ref-hero-note">有效推荐核验后发放 · 好友积分用于后续消费</p></section><section class="ref-how"><h2>邀请，分三步</h2><ol><li>${svg("link")}<span>分享专属链接</span></li><li>${svg("check")}<span>好友购买并激活</span></li><li>${svg("gift")}<span>核验后获奖励</span></li></ol></section><section class="ref-list"><div class="ref-section-title"><h2>我的推荐</h2><small>${m.ok?`本年已奖励 ${s.awardedCount}/12 位`:"记录待取得"}</small></div>${m.cap?'<p class="ref-limit">本年奖励名额已用完，已有记录与合法奖励保留。</p>':""}${m.ok?`<div class="ref-tabs" aria-label="筛选推荐记录">${[["all","全部"],["ongoing","进行中"],["rewarded","已奖励"]].map(([k,l])=>`<button type="button" aria-pressed="${view.filter===k}" data-action="commercial:ref-filter:${k}">${l}</button>`).join("")}</div>`:""}${!m.ok?`<div class="ref-empty">${svg("clock")}<h3>暂未取得推荐记录</h3><p>已有推荐不会因此失效，请稍后重试。</p>${btn("重新加载","refresh","ref-text")}</div>`:rows||`<div class="ref-empty">${svg("link")}<h3>${records.length?"暂无这类记录":"还没有推荐记录"}</h3><p>${records.length?"可以切换到全部，查看其他记录。":"好友通过专属入口参与后，进度会显示在这里。"}</p></div>`}</section><details class="ref-rules"><summary>奖励条件与常见问题</summary><div><h3>什么情况可以获得奖励？</h3><p>好友须通过你的专属入口进入，完成正式订单支付、注册、实名与硬件激活，并通过有效推荐核验；订单不能有退款或待处理售后。</p><h3>没有 Halo Ring 也能推荐吗？</h3><p>可以。有效推荐可获 20,000 Points。推荐完成时已绑定并激活支持的 Halo 硬件，还可获 150 成长值；未绑定期间的成长不补发。</p><h3>有次数限制吗？</h3><p>每个北京时间自然年最多奖励 12 位有效新会员。同一订单不重复获得会员推荐奖励与渠道现金收益。自购、关联账户互推、重复设备和无效订单不奖励。</p><h3>好友的 5,000 积分怎么用？</h3><p>用于后续消费，不能抵扣当前首单。具体使用条件以积分页面为准。</p><h3>推荐关系有疑问怎么办？</h3><p>请在支付前联系客服核对，不需要重新选择来源。推荐页不展示好友的个人资料与订单明细。</p></div></details>${status}</div><footer class="ref-footer">${btn(m.cap?"查看本年推荐记录":"邀请好友",m.cap?"records":"invite","primary")}</footer></article>`;
    }
    function invitation(m){return m.demo?"【Halo 原型演示，非正式邀请】\n和我一起，认识身体的日常。符合条件的好友可获得 5,000 Halo Points，用于后续消费。":`和我一起，认识身体的日常。符合条件的好友可获得 5,000 Halo Points，用于后续消费。\n${m.url}`;}
    function redraw(ctx){const scroll=document.querySelector('.ref-scroll')?.scrollTop||0;ctx.render();const el=document.querySelector('.ref-scroll');if(el)el.scrollTop=scroll;}
    function handle(command,value,ctx){
      if(!command?.startsWith("ref-")&&!command?.startsWith("referral-"))return false;
      if(document.querySelector('#screen')?.dataset.page!=="REF-01")return true;
      restore(ctx);const m=read(ctx),op=command.slice(4);feedback="";
      if(command.startsWith("referral-")){feedback="请使用当前页面的邀请入口。";redraw(ctx);return true;}
      if(op==="preview"){const u=new URL(location.href);if(value==="actual")u.searchParams.delete("referralPreview");else if(["empty","progress","cap","error"].includes(value))u.searchParams.set("referralPreview",value);else return true;history.replaceState(history.state,"",u);view={panel:"home",filter:"all",open:""};save();ctx.render();return true;}
      if(op==="refresh"){feedback=m.ok?"记录已重新读取。" :"暂未取得记录，请稍后重试或联系支持。";redraw(ctx);return true;}
      if(op==="support"){ctx.go("HELP-03");return true;}
      if(op==="points"){if(m.ok&&!m.demo&&m.s.records.some(r=>r.id===view.open&&r.status==="rewarded"))ctx.go("PTS-02");else redraw(ctx);return true;}
      if(op==="home"){if(history.state?.referralPanel==="share"&&history.state?.referralChild){history.back();return true;}view.panel="home";view.top=0;history.replaceState({...history.state,referralPanel:"home",referralChild:false},"",location.href);}
      else if(op==="invite"){if(view.panel!=="share")history.pushState({...history.state,referralPanel:"share",referralScope:lastScope,referralChild:true},"",location.href);view.panel="share";view.top=0;}
      else if(op==="records"){document.querySelector('.ref-list')?.scrollIntoView({block:"start"});return true;}
      else if(op==="filter"&&["all","ongoing","rewarded"].includes(value))view.filter=value;
      else if(op==="open"&&m.ok&&m.s.records.some(r=>r.id===value))view.open=view.open===value?"":value;
      else if(op==="copy"){
        if(busy||view.panel!=="share"||m.cap||!m.ok||(!m.demo&&!m.url)){feedback="邀请信息已变化，请刷新后重试。";redraw(ctx);return true;}
        const original=scope(ctx),text=invitation(m);busy=true;redraw(ctx);
        Promise.resolve().then(()=>{const current=read(ctx);if(!current.ok||current.cap||scope(ctx)!==original||invitation(current)!==text)throw new Error("invitation changed");if(!navigator.clipboard?.writeText)throw new Error("clipboard unavailable");return navigator.clipboard.writeText(text);}).then(()=>{if(original!==scope(ctx)||!read(ctx).ok)return;feedback=m.demo?"演示文案已复制，不代表邀请已发送。":"邀请内容已复制，发送给好友后等待对方参与。";}).catch(()=>{if(original===scope(ctx)&&read(ctx).ok)feedback="未能复制。可以长按上方内容，选择并复制。";}).finally(()=>{busy=false;if(document.querySelector('#screen')?.dataset.page==="REF-01")redraw(ctx);});return true;
      }else return true;
      save();ctx.render();return true;
    }
    document.addEventListener("scroll",event=>{if(event.target.matches?.('.ref-scroll')&&event.target.isConnected&&document.querySelector('#screen[data-page="REF-01"]')?.contains(event.target)){view.top=event.target.scrollTop;save();}},true);
    window.addEventListener("storage",event=>{if([storageKey,"haloV5AppProgress",null].includes(event.key)&&lastContext&&document.querySelector('#screen[data-page="REF-01"]'))lastContext.render();});
    window.addEventListener("popstate",()=>{if(location.hash.toUpperCase()==="#REF-01"&&lastContext){view.panel=history.state?.referralScope===lastScope&&history.state?.referralPanel==="share"?"share":"home";view.top=0;save();lastContext.render();}});
    const reviewControls=()=>`<section class="review-block"><h3>会员推荐 · 原型状态</h3><p>示例只用于本页，不写入推荐关系、积分或成长账本。</p>${[["actual","当前数据"],["empty","暂无记录"],["progress","多种进度"],["cap","年度上限"],["error","读取异常"]].map(([v,l])=>`<button data-action="commercial:ref-preview:${v}">${l}</button>`).join("")}</section>`;
    return {render,handle,reviewControls};
  }};
})();
