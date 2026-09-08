(function () {
  "use strict";
  const BADGES = [
    {id:"companionship",name:"长期同行",hint:"180 个有效佩戴日",mode:"all",conditions:[["wearDays","有效佩戴日",180,"天"]],path:'<path d="M5 15c3-7 5-7 8 0s5 0 6-5M5 15c-4 1-4-8 0-7s7 13 11 10"/>'},
    {id:"repair",name:"修复习惯",hint:"60 次 AI 睡前修复",mode:"all",conditions:[["repairs","AI 睡前修复",60,"次"]],path:'<path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/>'},
    {id:"understanding",name:"身体理解",hint:"周反馈 + 月度回顾",mode:"all",conditions:[["weeklyFeedbacks","周报告反馈",12,"次"],["monthlyReviews","月度回顾",3,"次"]],path:'<path d="M4 5h6l2 2 2-2h6v14h-6l-2 2-2-2H4ZM12 7v14"/>'},
    {id:"participation",name:"品牌参与",hint:"6 次已核验的参与",mode:"all",conditions:[["participations","已核验课程、Studio 或官方活动",6,"次"]],path:'<circle cx="12" cy="8" r="4"/><path d="M8 12 6 21l6-3 6 3-2-9"/>'},
    {id:"contribution",name:"会员贡献",hint:"内容贡献 或 正式访谈",mode:"any",conditions:[["contributions","审核通过的故事、建议或内容贡献",2,"次"],["interviews","正式用户访谈",1,"次"]],path:'<path d="M12 20S3 15 3 9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 11-9 11Z"/>'}
  ];
  const svg=path=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  const integer=x=>Number.isSafeInteger(x)&&x>=0;
  const time=x=>typeof x==="string"&&Number.isFinite(Date.parse(x))&&Date.parse(x)<=Date.now();
  const date=x=>new Intl.DateTimeFormat("zh-CN",{timeZone:"Asia/Shanghai",year:"numeric",month:"long",day:"numeric"}).format(new Date(x));
  window.HALO_MEMBER_BADGES={
    create({storageKey,escape:esc}) {
      let feedback="",lastScope="",lastFingerprint="";
      const scope=ctx=>[ctx.applicationContext?.().accountRef||"",ctx.memberCreatedAt||""].join("|");
      function read(ctx) {
        const source = window.HALO_MEMBER_DATA.read(ctx, {storageKey,allowFresh:true});
        const {data, trusted, account} = source;
        const never=source.validSession && (trusted || source.fresh) && ctx.membershipState==="never-bound";
        const detail=data.badgeDetails;
        const valid=!never&&trusted&&detail?.accountRef===account && (detail.registrationId||"")===(ctx.memberCreatedAt||"") && time(detail.updatedAt) && Array.isArray(detail.items);
        const items=BADGES.map(b=>{
          const rows=valid ? detail.items.filter(r=>r?.id===b.id):[];
          const r=rows.length===1?rows[0]:null;
          const owned=r && (!r.accountRef||r.accountRef===account) && (!r.registrationId||r.registrationId===ctx.memberCreatedAt);
          const status=owned&&["earned","in_progress","pending"].includes(r.status)?r.status:null;
          const earned=status==="earned" && typeof r.receiptId==="string" && !!r.receiptId.trim() && time(r.awardedAt) && Date.parse(r.awardedAt)<=Date.parse(detail.updatedAt) && (!time(ctx.memberCreatedAt)||Date.parse(r.awardedAt)>=Date.parse(ctx.memberCreatedAt));
          const progress=b.conditions.map(([key])=>status && integer(r.progress?.[key]) ? r.progress[key]:null);
          const reached=b.mode==="all" ? progress.every((v,i)=>v!==null&&v>=b.conditions[i][2]):progress.some((v,i)=>v!==null&&v>=b.conditions[i][2]);
          const known=status!==null && (status!=="earned"||earned);
          return {...b,progress:known?progress:b.conditions.map(()=>null),earned,awardedAt:earned?r.awardedAt:null,state:earned?"已获得":never?"尚未开始":!known?"记录待取得":status==="pending"||reached?"待确认":!ctx.hardwareActive?"累计已暂停":"累计中"};
        });
        const detailedCount=items.filter(b=>b.earned).length;
        const complete=valid&&items.every(b=>b.state!=="记录待取得");
        const aggregate=integer(data.memberAssets?.badges)&&data.memberAssets.badges<=5?data.memberAssets.badges:null;
        const mismatch=aggregate!==null&&(detailedCount>aggregate||complete&&detailedCount!==aggregate);
        return {items,never,trusted,count:never||source.fresh?0:window.HALO_MEMBER_DATA.badgeCount(data,account,ctx.memberCreatedAt||""),mismatch,complete,updatedAt:valid?detail.updatedAt:null};
      }
      function saved(ctx) {try{const v=JSON.parse(sessionStorage.getItem("haloMemberBadgeView")||"null");return v?.key===scope(ctx)?v.open:[];}catch{return [];}}
      function render(ctx) {
        if(lastScope!==scope(ctx)){feedback="";lastScope=scope(ctx);}
        const d=read(ctx);lastFingerprint=JSON.stringify(d);
        const open=saved(ctx),action=(name,op,primary=false)=>`<button class="${primary?"primary":"secondary"}" data-action="commercial:badges-${op}">${esc(name)}</button>`;
        const intro=d.never?"连接并激活 Halo Ring 后，开始累计。":!ctx.hardwareActive?"已获得的徽章保留，连接后继续新的累计。":d.mismatch?"数量与详情暂未对齐，可刷新或联系支持。":!d.complete?"部分记录暂未取得，先看看每枚徽章的条件。":"每一枚，都记下你做过的事。";
        return `<article class="member-badges-page"><header class="mbg-header"><button data-action="previous" aria-label="返回">${svg('<path d="m14 5-7 7 7 7"/>')}</button><h1>成长徽章</h1><button data-action="commercial:badges-refresh">刷新</button></header><section class="mbg-hero"><span class="mbg-eyebrow">我的收藏</span><div><strong>${d.count===null?"—":d.count}</strong><span>/ 5 枚已获得</span></div><p>${esc(intro)}</p></section><p class="mbg-feedback" role="status" aria-live="polite">${esc(feedback)}</p><div class="mbg-list">${d.items.map(b=>`<details class="mbg-card ${b.earned?"is-earned":""}" data-badge="${b.id}" ${Array.isArray(open)&&open.includes(b.id)?"open":""}><summary><span class="mbg-emblem">${svg(b.path)}</span><span class="mbg-label"><strong>${b.name}</strong><small>${b.hint}</small></span><span class="mbg-state">${b.state}<i aria-hidden="true">⌄</i></span></summary><div class="mbg-detail">${b.earned?`<p class="mbg-earned-date">已于 ${date(b.awardedAt)} 获得</p>`:""}<h2>${b.conditions.length===1?"达成条件":b.mode==="all"?"两项都完成":"完成其中一项即可"}</h2>${b.conditions.map(([key,label,target,unit],i)=>`<div class="mbg-condition"><p>${esc(label)}<b>${target} ${unit}</b></p>${b.progress[i]!==null?`<small>已确认 ${b.progress[i]} ${unit}</small><progress max="${target}" value="${Math.min(target,b.progress[i])}" aria-label="${esc(label)}累计进度"></progress>`:`<small>${d.never?"激活后开始累计":"累计记录待取得"}</small>`}</div>`).join(b.mode==="any"?'<div class="mbg-or">或</div>':"")}<p class="mbg-explainer">${b.id==="repair"?"公共助眠内容不计入 AI 睡前修复。":b.id==="participation"?"以参加并核验的记录为准，浏览或预约不计次数。":b.id==="understanding"?"需完成反馈和回顾，仅打开报告不计次数。":b.id==="contribution"?"提交后需审核；访谈以正式参与记录为准。":"有效佩戴日可累计，不要求连续。"}${b.state==="待确认"?" 达到条件后仍需确认，暂不代表已获得徽章。":""}</p></div></details>`).join("")}</div><p class="mbg-footnote">按历史累计，不按年清零。正常不活跃、解绑或换设备，已获得的徽章仍保留。</p><div class="mbg-actions">${action(ctx.hardwareActive?"查看成长任务":"连接 Halo Ring",ctx.hardwareActive?"tasks":"connect",true)}${action("记录有疑问？联系支持","support")}</div></article>`;
      }
      function handle(command,value,ctx) {
        if(typeof command!=="string"||!command.startsWith("badges-"))return false;
        const screen=document.querySelector('#screen[data-page="MEM-06"]');if(!screen)return true;
        const op=command.slice(7);
        if(op==="refresh") {const d=read(ctx),same=JSON.stringify(d)===lastFingerprint,top=screen.scrollTop;feedback=!d.trusted&&!d.never?"暂未取得记录，可稍后重试或联系支持。":same?"记录暂无变化。":"记录已更新。";ctx.render();requestAnimationFrame(()=>{screen.scrollTop=top;screen.querySelector('[data-action="commercial:badges-refresh"]')?.focus({preventScroll:true});});ctx.track("member_badges_refreshed",{simulated:true});return true;}
        const route=op==="tasks"&&ctx.hardwareActive?"MEM-04":op==="connect"&&!ctx.hardwareActive?"DEV-01":op==="support"?"HELP-03":null;
        if(route)ctx.go(route);else ctx.render();return true;
      }
      document.addEventListener("toggle",event=>{const node=event.target,screen=document.querySelector('#screen[data-page="MEM-06"]');if(!node.isConnected||!screen?.contains(node)||!node.matches?.('.mbg-card'))return;try{sessionStorage.setItem("haloMemberBadgeView",JSON.stringify({key:lastScope,open:[...screen.querySelectorAll('.mbg-card[open]')].map(el=>el.dataset.badge)}));}catch{/* Disclosure remains usable when reading-position storage is unavailable. */}},true);
      return {render,handle,snapshot:read};
    }
  };
})();
