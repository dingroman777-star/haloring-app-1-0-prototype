(function(){
  "use strict";
  const filters={all:"全部",earned:"获得",used:"使用",adjusted:"调整"};
  const date=value=>Number.isFinite(Date.parse(value))?new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value)):"时间待核对";
  const validDate=value=>typeof value==='string' && Number.isFinite(Date.parse(value)) && Date.parse(value)<=Date.now();
  const category=r=>r.correction===true || /^(aftersale:|correction:)/.test(r.id) || /:restored$/.test(r.id)?'adjusted':r.amount>=0?'earned':'used';
  const signed=n=>(n>0?'+':n<0?'−':'')+Math.abs(n).toLocaleString('zh-CN');
  const arrow='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>';
  window.HALO_POINTS_LEDGER={create({read,escape:esc}){
    let currentCtx,scope='',v={filter:'all',open:null,limit:20},message='';
    function source(ctx){const s=read(ctx);if(s.unavailable)return {...s,rows:[]};
      if(scope!==s.scope){scope=s.scope;message='';v={filter:'all',open:null,limit:20};try{const x=JSON.parse(sessionStorage.getItem('haloPointsLedgerView:'+scope)||'null');if(x && Object.hasOwn(filters,x.filter))v={filter:x.filter,open:typeof x.open==='string'?x.open:null,limit:Number.isInteger(x.limit)?Math.max(20,Math.min(200,x.limit)):20};}catch{message='上次查看位置暂未恢复。';}}
      const rows=s.data.pointsTransactions;if(!Array.isArray(rows))return {...s,rows:[],ledgerUnavailable:true};
      const counts=new Map();for(const r of rows)if(r?.id)counts.set(r.id,(counts.get(r.id)||0)+1);
      const good=rows.filter(r=>r && typeof r.id==='string' && counts.get(r.id)===1 && (!r.accountRef||r.accountRef===s.account) && Number.isSafeInteger(r.amount) && validDate(r.posted_at) && (!r.occurred_at || validDate(r.occurred_at) && Date.parse(r.occurred_at)<=Date.parse(r.posted_at)) && (r.offset===undefined || Number.isSafeInteger(r.offset) && r.offset>=0 && r.offset<=Math.max(0,r.amount)));
      return {...s,rows:good.sort((a,b)=>Date.parse(b.posted_at)-Date.parse(a.posted_at)),incomplete:good.length!==rows.length};
    }
    function save(){try{sessionStorage.setItem('haloPointsLedgerView:'+scope,JSON.stringify(v));}catch{message='查看选择暂未保存，刷新后可能需要重新选择。';}}
    const act=(command,label,cls='')=>`<button class="${cls}" data-action="commercial:ledger-${command}">${label}</button>`;
    function details(r){
      const adjustment=category(r)==='adjusted',offset=r.offset||0;
      const related=r.orderId || r.taskId || (/^order:(.+):points-used$/.exec(r.id)?.[1]) || (/^task:([^:]+):/.exec(r.id)?.[1]);
      const status=r.correction?'已调整':/restored$/.test(r.id)?'已退回或恢复':r.amount<0?'已使用':'已到账';
      const pairs=[['记录编号',r.id],['当前状态',status],['入账时间',date(r.posted_at)],['行为发生时间',r.occurred_at?date(r.occurred_at):'待核对']];
      if(related)pairs.push(['关联订单 / 任务',related]);
      if(adjustment)pairs.push(['调整说明',r.reason || r.detail || '原因待核对，请联系支持']);
      if(r.amount>0){pairs.push(['用于抵扣待调整积分',offset.toLocaleString()],['当次可用积分增加',(r.amount-offset).toLocaleString()]);if(r.expires_at && Number.isFinite(Date.parse(r.expires_at)))pairs.push(['该笔原定有效期至',date(r.expires_at)]);else pairs.push(['有效期','待取得该笔有效期']);}
      const appeal=r.correction?'<p class="pl-note">如有异议，可在收到调整通知后 15 个自然日内通过企业微信客服申诉。复核期间调整继续生效。</p>':'';
      return `<div class="pl-detail"><dl>${pairs.map(([k,val])=>`<div><dt>${esc(k)}</dt><dd>${esc(String(val))}</dd></div>`).join('')}</dl>${r.amount>0?'<p class="pl-note">这里显示本次入账情况，不代表这笔积分目前仍全部可用。</p>':''}${appeal}${act('support','对这笔记录有疑问？','pl-support')}</div>`;
    }
    function render(ctx){currentCtx=ctx;const s=source(ctx),rows=s.rows.filter(r=>v.filter==='all'||category(r)===v.filter),shown=rows.slice(0,v.limit),error=s.unavailable||s.ledgerUnavailable;
      return `<article class="points-ledger-page"><header class="pl-header"><button data-action="previous" aria-label="返回">‹</button><h1>积分明细</h1>${act('refresh','刷新')}</header><p class="pl-caption">查看每一笔获得、使用与调整</p>
      ${s.pending>0?`<section class="pl-warning"><strong>${s.pending.toLocaleString()} 积分待调整</strong><p>积分抵扣和兑换暂时暂停，其他功能照常使用。</p>${!s.rows.some(r=>r.correction)?'<p>调整明细尚未取得，请联系支持核对。</p>':''}${act('help','联系支持')}</section>`:''}
      <div class="pl-tabs" role="group" aria-label="筛选积分记录">${Object.entries(filters).map(([key,label])=>`<button data-action="commercial:ledger-filter:${key}" aria-pressed="${v.filter===key}">${label}</button>`).join('')}</div>
      <div class="pl-message" role="status">${esc(message)}</div>${s.incomplete?'<p class="pl-warning" role="status">部分记录待核对，暂未显示。请刷新或联系支持。</p>':''}
      ${error?`<section class="pl-empty"><h2>暂时无法读取明细</h2><p>已有积分和记录不会因此改变。</p>${act('refresh','重新读取','pl-primary')}</section>`:!rows.length?`<section class="pl-empty"><span aria-hidden="true">≡</span><h2>${s.rows.length?'这一类还没有记录':s.incomplete?'记录信息待核对':'还没有积分记录'}</h2><p>${s.rows.length?'可以切换到全部查看。':s.incomplete?'请稍后重新读取，或联系支持。':'获得或使用积分后，可以在这里查看。'}</p>${s.rows.length?act('filter:all','查看全部','pl-primary'):act('home','返回积分首页','pl-primary')}</section>`:
      `<div class="pl-list">${shown.map(r=>`<section class="pl-record"><button class="pl-record-toggle" data-action="commercial:ledger-open:${encodeURIComponent(r.id)}" aria-expanded="${v.open===r.id}"><span class="pl-sign ${category(r)}" aria-hidden="true">${category(r)==='adjusted'?'↺':r.amount>=0?'+':'−'}</span><span class="pl-copy"><strong>${esc(r.title || '积分记录')}</strong><small>${esc(date(r.posted_at))}</small><small>${r.offset?`已抵扣待调整积分 ${r.offset}`:filters[category(r)]}</small></span><span class="pl-amount">${signed(r.amount)}${arrow}</span></button>${v.open===r.id?details(r):''}</section>`).join('')}</div>${rows.length>v.limit?act('more',`继续查看（剩余 ${rows.length-v.limit} 笔）`,'pl-more'):''}`}
      <p class="pl-timezone">时间按北京时间显示</p></article>`;
    }
    function handle(command,value,ctx){if(!command.startsWith('ledger-'))return false;if(document.querySelector('#screen')?.dataset.page!=='PTS-02')return true;const s=source(ctx),screen=document.getElementById('screen'),top=screen.scrollTop;
      if(command==='ledger-home'){ctx.go('PTS-01');return true;}
      if(command==='ledger-help'){ctx.go('HELP-03');return true;}
      if(command==='ledger-support'){if(s.unavailable||!s.rows.some(r=>r.id===v.open)){message='记录已变化，请重新选择。';ctx.render();return true;}save();ctx.go('HELP-03');return true;}
      if(command==='ledger-filter'){if(!Object.hasOwn(filters,value))return true;v.filter=value;v.open=null;v.limit=20;save();}
      if(command==='ledger-open'){let id;try{id=decodeURIComponent(value)}catch{return true;}if(!s.rows.some(r=>r.id===id)){message='记录已变化，请刷新后再查看。';ctx.render();return true;}v.open=v.open===id?null:id;save();}
      if(command==='ledger-more'){v.limit+=20;save();}
      if(command==='ledger-refresh')message=s.unavailable||s.ledgerUnavailable?'仍未取得明细，请稍后再试。':'已重新读取积分记录。';
      ctx.render();requestAnimationFrame(()=>{screen.scrollTop=top;});return true;
    }
    function supportPanel(){if(!currentCtx){try{const p=JSON.parse(localStorage.getItem('haloV5AppProgress')||'null');if(!p?.signedIn || !p.authVerified)return '';currentCtx={memberCreatedAt:p.memberCreatedAt||'',newMember:p.newMember,applicationContext:()=>({accountRef:p.authPhone||p.authForm?.phone,signedIn:p.signedIn})};}catch{return '';}}const s=source(currentCtx),r=s.rows.find(r=>r.id===v.open);if(s.unavailable||!r)return '';return `<section class="sc-context"><h3>关于这笔积分记录</h3><p>${esc(r.title||'积分记录')} · ${signed(r.amount)} 积分</p><p>记录编号：${esc(r.id)}</p><p>尚未发送给客服，也未自动提交申诉。</p><button class="text-button" data-action="support:source">返回这笔记录</button></section>`;}
    return {render,handle,supportPanel};
  }};
})();
