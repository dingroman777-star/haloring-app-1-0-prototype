(function () {
  "use strict";
  const LEVELS=[
    {name:"Halo Member",cn:"光环会员",rate:"1.0",items:[]},
    {name:"Halo Premier",cn:"进阶会员",rate:"1.1",items:[["content","会员内容","会员专属内容","具体内容与开放时间以发布安排为准。"],["event","公开活动优先报名","优先报名资格","是否开放优先报名、名额和价格，以每场活动说明为准。"]]},
    {name:"Halo Signature",cn:"臻选会员",rate:"1.2",items:[["report","个性化报告模板","更多报告呈现方式","不改变核心健康功能。可用模板以实际开放安排为准。"],["content","深度内容","更多会员内容","具体内容与开放时间以发布安排为准。"],["experience","新功能体验候选","候选资格，不等于已入选","是否收到体验邀请，以本次招募与邀请结果为准。"]]},
    {name:"Halo Prestige",cn:"私享会员",rate:"1.3",items:[["event","私享课程与活动","按场次开放","名额、时间与费用以单次活动说明为准，不代表免费参加。"],["experience","新产品优先体验","优先体验资格","体验安排及名额以正式邀请为准，不等于已获产品或已预约。"]]},
    {name:"Halo Muse",cn:"共创会员",rate:"1.5",items:[["experience","内测与访谈优先","优先参与资格","按正式招募与邀请参加，不代表已经入选。"],["cocreation","正式产品共创","参与产品共创","具体项目、参与方式与安排以正式邀请为准。"],["event","闭门工作坊","按场次开放","名额、时间与费用以单次工作坊说明为准。"]]},
    {name:"Halo Luminary",cn:"领航会员",rate:"2.0",items:[["cocreation","品牌顾问团与深度共创","深度参与品牌项目","具体项目与参与安排以正式邀请为准，不代表已加入项目。"],["experience","新品体验最高优先级","最高优先级体验资格","仍需具体体验安排与名额确认，不代表已获产品。"]]}
  ];
  const paths={back:'<path d="m14 5-7 7 7 7"/>',arrow:'<path d="m9 5 7 7-7 7"/>',content:'<path d="M4 5h6l2 2 2-2h6v14h-6l-2 2-2-2H4ZM12 7v14"/>',event:'<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4m8-4v4M4 11h16m-11 5h6"/>',report:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6m-6 5h6m-6 4h3"/>',experience:'<path d="m12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3Z"/>',cocreation:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m3-16a3 3 0 0 1 0 6m0 4a5 5 0 0 1 3 5"/>',support:'<path d="M4 14v-3a8 8 0 0 1 16 0v3M4 12h3v7H4Zm13 0h3v7h-3Zm3 7c0 2-4 3-7 3"/>',points:'<circle cx="12" cy="12" r="9"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',bag:'<path d="M4 7h16l1 14H3ZM8 8V6a4 4 0 0 1 8 0v2"/>'};
  const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
  window.HALO_MEMBER_BENEFITS={
    create({storageKey,escape:esc}) {
      let feedback="",lastScope="",lastFingerprint="";
      const scope=ctx=>[ctx.applicationContext?.().accountRef||"",ctx.memberCreatedAt||""].join("|");
      function read(ctx) {
        return {level:window.HALO_MEMBER_DATA.snapshot(ctx, {storageKey}).level};
      }
      function saved(ctx) {try {const view=JSON.parse(sessionStorage.getItem("haloMemberBenefitsView")||"null");return view?.key===scope(ctx)&&Array.isArray(view.open)?view.open:[];}catch{return [];}}
      const button=(label,op,cls="secondary")=>`<button class="${cls}" data-action="commercial:benefits-${op}">${esc(label)}</button>`;
      function render(ctx) {
        if(lastScope!==scope(ctx)){feedback="";lastScope=scope(ctx);}
        const d=read(ctx),level=d.level===null?null:LEVELS[d.level],next=level&&d.level<5?LEVELS[d.level+1]:null;
        lastFingerprint=JSON.stringify(d);const open=saved(ctx),expanded=id=>open.includes(id)?"open":"";
        const support=d.level>=3?"Halo Private Care":"Halo Member Care";
        const row=(symbol,title,sub,op)=>`<button class="mbf-row" data-action="commercial:benefits-${op}"><span class="mbf-row-icon">${icon(symbol)}</span><span><strong>${esc(title)}</strong><small>${esc(sub)}</small></span>${icon("arrow")}</button>`;
        return `<article class="member-benefits-page"><header class="mbf-header"><button data-action="previous" aria-label="返回">${icon("back")}</button><h1>会员权益</h1><button data-action="commercial:benefits-refresh">刷新</button></header><section class="mbf-identity"><span>${level?`L${d.level+1} · ${level.cn}`:"会员身份待取得"}</span><h2>${level?level.name:"我的会员权益"}</h2><p>${!level?"暂时无法核对等级，可以重新读取或联系支持。":ctx.membershipState==="unbound-retained"?"已获等级保留，按当前等级查看权益。":"看看你的等级带来了什么。"}</p></section><p class="mbf-feedback" role="status" aria-live="polite">${esc(feedback)}</p>${level?`<details class="mbf-points" data-benefit-view="points" ${expanded("points")}><summary><span><small>消费返积分系数</small><strong>${level.rate}<em>×</em></strong></span><span class="mbf-points-hint">查看计算说明 <i aria-hidden="true">⌄</i></span></summary><div class="mbf-detail"><p>符合条件的实付商品金额，按当前等级系数累计 Halo Points；不代表商品折扣。</p><p>积分抵扣、优惠券、运费及退款金额不参与累计。升级后不补发此前订单的积分，具体以订单记录为准。</p>${button("查看我的积分","points")}</div></details>`:""}<section class="mbf-section"><div class="mbf-section-heading"><h2>${level?"本级权益":"先逛逛"}</h2>${level&&level.items.length?"<span>点开了解使用方式</span>":""}</div>${level?level.items.map(([id,title,hint,detail])=>`<details class="mbf-card" data-benefit-view="${id}" ${expanded(id)}><summary><span class="mbf-row-icon">${icon(id)}</span><span class="mbf-copy"><strong>${title}</strong><small>${hint}</small></span><span class="mbf-chevron" aria-hidden="true">⌄</span></summary><div class="mbf-detail"><p>${detail}</p><p class="mbf-status">开放安排待确认</p><p>暂未取得可参与的具体安排，可联系支持了解。</p>${button("咨询开放安排","consult")}</div></details>`).join(""):""}${row("support",level?support:"客服支持",d.level>=3?"专属服务组与优先响应":"及时响应与标准服务","support")}${level&&d.level>=3?'<p class="mbf-small">专属服务由服务组承接，不固定为某一位客服。</p>':""}</section><section class="mbf-section"><div class="mbf-section-heading"><h2>每位会员都能使用</h2></div><div class="mbf-common">${row("event","公开活动","查看场次与参加方式","activities")}${row("points","Halo Points","查看积分与兑换入口","points")}${row("bag","Halo Select","浏览商品与选购服务","select")}</div></section>${next?`<details class="mbf-next" data-benefit-view="next" ${expanded("next")}><summary><span><small>下一等级</small><strong>${next.name}</strong></span><span>L${d.level+2} <i aria-hidden="true">⌄</i></span></summary><div class="mbf-detail"><p class="mbf-next-rate">${next.rate}× 消费返积分</p><ul>${next.items.map(b=>`<li>${b[1]}</li>`).join("")}${d.level+1>=3?"<li>Halo Private Care 与优先服务</li>":"<li>及时客服响应和标准服务</li>"}</ul><p>达到并确认新等级后生效；活动与体验仍需具体安排。</p>${button(ctx.hardwareActive?"查看升级条件":"查看等级路径",ctx.hardwareActive?"upgrade":"levels","primary")}</div></details>`:level?'<p class="mbf-top-level">你已达到最高等级。</p>':button("查看六级权益介绍","levels")}<p class="mbf-boundary">核心健康功能不按会员等级限制。课程、活动与体验的名额和费用，以单次公布为准。</p></article>`;
      }
      function handle(command,value,ctx) {
        if(typeof command!=="string"||!command.startsWith("benefits-"))return false;
        const screen=document.querySelector('#screen[data-page="MEM-07"]');if(!screen)return true;
        const op=command.slice(9),d=read(ctx);
        if(op==="refresh"){const same=JSON.stringify(d)===lastFingerprint,top=screen.scrollTop;feedback=d.level===null?"仍未取得会员等级，可稍后重试或联系支持。":same?"已重新读取，当前等级未变化。":"等级已更新，请查看当前权益。";ctx.render();requestAnimationFrame(()=>{screen.scrollTop=top;screen.querySelector('[data-action="commercial:benefits-refresh"]')?.focus({preventScroll:true});});ctx.track("member_benefits_refreshed",{simulated:true});return true;}
        const route=op==="points"?"PTS-01":op==="activities"?"STU-08":op==="select"?"SEL-01":op==="support"||op==="consult"?"HELP-03":op==="levels"?"MEM-02":op==="upgrade"&&d.level!==null&&d.level<5&&ctx.hardwareActive?"MEM-03":null;
        if(route){ctx.track("member_benefits_entry_opened",{destination:route});ctx.go(route);}else{feedback="状态已变化，请查看当前权益。";ctx.render();}return true;
      }
      document.addEventListener("toggle",event=>{const node=event.target,screen=document.querySelector('#screen[data-page="MEM-07"]');if(!node.isConnected||!screen?.contains(node)||!node.matches?.('details[data-benefit-view]'))return;try{sessionStorage.setItem("haloMemberBenefitsView",JSON.stringify({key:lastScope,open:[...screen.querySelectorAll('details[data-benefit-view][open]')].map(el=>el.dataset.benefitView)}));}catch{/* Reading remains available without saved disclosure state. */}},true);
      return {render,handle,snapshot:read};
    }
  };
})();
