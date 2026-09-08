(function(){
  "use strict";
  const integer=n=>Number.isSafeInteger(n)&&n>=0;
  const stamp=n=>new Date(n).toISOString();
  const date=x=>Number.isFinite(Date.parse(x))?new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(x)):'待核对';
  window.HALO_POINTS_REDEMPTION={create({read,catalog,storageKey,escape:e}){
    let message='',scope='',shown=null,timer=null,busy=false,failedSave='';
    const n=x=>x.toLocaleString('zh-CN');
    const button=(action,label,style='pr-secondary',disabled=false)=>`<button class="${style}" data-action="commercial:pr-${action}"${disabled?' disabled':''}>${label}</button>`;
    const rows=items=>`<dl class="pr-details">${items.map(([k,v])=>`<div><dt>${e(k)}</dt><dd>${e(v)}</dd></div>`).join('')}</dl>`;
    const fingerprint=o=>JSON.stringify(o||null);
    function snapshot(ctx){const s=read(ctx);if(scope!==(s.scope||'')){scope=s.scope||'';message='';failedSave='';}return s;}
    const model=window.HALO_POINTS_REDEMPTION_DATA,validOffer=model.validOffer;
    function receipt(s,item){
      const h=model.history(s,item);if(h.unknown)return {unknown:true};
      if(s.data.pointsRedemptionIntent==='new')return null;
      const selected=s.data.selectedPointsRedemptionId;
      return (selected?h.entries.find(r=>r.tx.requestId===selected):h.entries[0])||null;
    }
    function request(s){const r=s.data?.pointsRedemptionRequest;if(!r)return null;return r.accountRef===s.account&&r.scope===s.scope&&catalog[r.itemId]&&typeof r.id==='string'&&r.cost===catalog[r.itemId].cost&&Number.isFinite(Date.parse(r.requestedAt))&&Date.parse(r.requestedAt)<=Date.now()&&['processing','success','failed'].includes(r.status)?r:{unknown:true};}
    function problem(s,item){
      if(s.unavailable)return '积分信息暂未取得，请重新读取。';
      if(!item)return '请先选择想兑换的内容。';
      if(s.pending>0)return '积分调整中，暂时不能兑换。';
      if(!Array.isArray(s.data.pointsTransactions)||!Array.isArray(s.data.vouchers))return '兑换记录暂未取得，请重新读取。';
      if(Array.isArray(s.data.orders)&&s.data.orders.some(o=>o?.status==='processing'))return '有一笔订单正在确认，请稍后再兑换。';
      const o=s.data.pointsRedemptionOffers?.[item.id];
      if(!item.available||!validOffer(o,item))return '当前兑换条件尚未齐备或名额不可用，请返回查看其他内容。';
      if(o.simulated!==true)return '兑换服务暂未接通，可以先查看使用说明。';
      const limit=model.limitReason(s,item,o);if(limit)return limit;
      if(s.balance<item.cost)return `还差 ${n(item.cost-s.balance)} 积分。`;
      return '';
    }
    function save(s,data,ctx){try{localStorage.setItem(storageKey,JSON.stringify(data));read(ctx);return true;}catch{message='本次结果未能保存，请重新查询。不会重复扣除积分。';return false;}}
    function locked(fn){return navigator.locks?.request?navigator.locks.request('halo-points-redemption',fn):Promise.resolve().then(fn);}
    function redraw(ctx){if(document.querySelector('#screen')?.dataset.page==='PTS-04')ctx.render?.();}
    async function finish(ctx,id,owner){
      await locked(()=>{
        const s=snapshot(ctx);if(s.unavailable||s.scope!==owner)return;
        const r=request(s);if(!r||r.unknown||r.id!==id||r.status!=='processing')return;
        const item=catalog[r.itemId],h=model.history(s,item),existing=h.unknown||h.entries.some(x=>x.tx.requestId===id);if(existing){message='兑换记录需要核对，请查看积分明细或联系支持。';failedSave=id;return;}
        let error=problem(s,item);const o=s.data.pointsRedemptionOffers?.[item.id];
        if(!error&&fingerprint(o)!==fingerprint(r.offer))error='兑换条件已变化，请重新核对后再确认。';
        if(!error&&navigator.onLine===false){message='网络不可用，结果仍在确认中。连接后可重新查询。';failedSave=id;return;}
        if(!error&&window.HALO_POINTS_REVIEW?.failNext===true){window.HALO_POINTS_REVIEW.failNext=false;error='这次兑换未完成，积分没有扣除。请重试。';}
        const completedAt=stamp(Date.now());
        if(error){if(!save(s,{...s.data,redemptionStatus:'failed',pointsRedemptionRequest:{...r,status:'failed',failure:error,completedAt}},ctx))failedSave=id;return;}
        const after=s.balance-item.cost,expiresAt=stamp(Date.now()+o.voucherValidityDays*86400000);
        const tx={id:`redemption:${item.id}:${id}`,itemId:item.id,activityId:r.offer.activityId,requestId:id,accountRef:s.account,title:item.title,amount:-item.cost,offset:0,occurred_at:r.requestedAt,posted_at:completedAt,balanceAfter:after,simulated:true};
        const voucher={id:`voucher:${item.id}:${id}`,itemId:item.id,activityId:r.offer.activityId,requestId:id,accountRef:s.account,title:item.title,status:'available',issuedAt:completedAt,expiresAt,usage:r.offer.usage,returns:r.offer.returns,simulated:true};
        const data={...s.data,pointsBalance:after,redemptionStatus:'success',pointsTransactions:[tx,...s.data.pointsTransactions],vouchers:[voucher,...s.data.vouchers],pointsRedemptionOffers:{...s.data.pointsRedemptionOffers,[item.id]:{...o,stock:o.stock-1}},pointsRedemptionRequest:{...r,status:'success',completedAt,balanceAfter:after,voucherId:voucher.id}};
        if(!save(s,data,ctx))failedSave=id;
      });redraw(ctx);
    }
    function resume(ctx){
      const s=snapshot(ctx);if(s.unavailable)return;const r=request(s);
      if(!r||r.unknown||r.status!=='processing'||timer||failedSave===r.id)return;
      timer=setTimeout(()=>{timer=null;finish(ctx,r.id,s.scope).catch(()=>{failedSave=r.id;message='暂未取得兑换结果，请重新查询。';redraw(ctx);});},Math.max(100,Date.parse(r.requestedAt)+1000-Date.now()));
    }
    function render(ctx){
      const s=snapshot(ctx),item=!s.unavailable?catalog[s.data.selectedRedemptionId]:null,r=!s.unavailable?request(s):null;
      const rec=item?receipt(s,item):null,o=item?s.data.pointsRedemptionOffers?.[item.id]:null;
      shown={scope:s.scope,itemId:item?.id,offer:fingerprint(o)};
      const same=r&&!r.unknown&&r.itemId===item?.id&&s.data.pointsRedemptionIntent!=='new';
      let title='确认兑换',body='',footer='';
      const card=item?`<section class="pr-ticket"><svg class="pr-ticket-icon" viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4Z"/><path d="M15 5v3m0 3v2m0 3v3"/></svg><small>Halo Studio</small><h2>${e(item.shortTitle)}</h2><span>1 张 · ${e(item.usage)}</span></section>`:'';
      if(s.unavailable||!item){title='兑换';body=`<section class="pr-state"><span aria-hidden="true">—</span><h2>${s.unavailable?'暂时无法查看':'还没有选择兑换内容'}</h2><p>${s.unavailable?'积分与兑换信息暂未取得。':'先看看积分能换什么，再来确认。'}</p></section>`;footer=button(s.unavailable?'refresh':'route:PTS-03',s.unavailable?'重新读取':'去选择兑换内容','pr-primary');}
      else if(rec?.unknown||r?.unknown||(same&&r.status==='success'&&!rec)||(!r&&['success','processing'].includes(s.data.redemptionStatus))){title='核对兑换结果';body=`${card}<p class="pr-notice">当前记录还不能确认兑换结果，请先核对，暂不重复提交。</p>`;footer=button('refresh','重新查询','pr-primary')+button('route:PTS-02','查看积分明细')+button('route:HELP-03','联系支持');}
      else if(rec){
        title='兑换结果';const expired=Date.parse(rec.v.expiresAt||rec.v.expires_at)<=Date.now(),usable=rec.v.status==='available'&&!expired;
        body=`<section class="pr-state pr-success"><span aria-hidden="true">✓</span><h2>兑换成功</h2><p>${usable?'体验券已到账，预约时可选择使用。':rec.v.status==='used'?'这张体验券已使用。':rec.v.status==='returned'?'这张体验券已退回。':'这张体验券已到期。'}</p></section>${card}${rows([['本次使用',n(-rec.tx.amount)+' 积分'],['兑换后余额',n(rec.tx.balanceAfter)+' 积分'],['当前可用',n(s.balance)+' 积分'],['使用截止',date(rec.v.expiresAt||rec.v.expires_at)],['兑换时间',date(rec.tx.posted_at)]])}<details class="pr-more"><summary>使用说明与兑换编号</summary><p>${e(rec.v.usage||'使用说明待取得')}</p><p>${e(rec.v.returns||'退回条件待取得')}</p><p>编号 ${e(rec.tx.requestId)}</p></details>`;
        footer=button(usable?'route:STU-08':'route:PTS-02',usable?'去 Halo Studio 使用':'查看积分明细','pr-primary')+button('route:PTS-03','返回兑换列表');
      }else if(same&&r.status==='processing'){
        title='正在兑换';body=`<section class="pr-state"><span class="pr-pulse" aria-hidden="true">◷</span><h2>正在确认兑换</h2><p>可以稍后回来查看，无需再次提交。</p></section>${card}${rows([['本次所需',n(r.cost)+' 积分'],['提交时间',date(r.requestedAt)]])}`;footer=button('refresh','查询兑换结果','pr-primary')+button('route:PTS-03','稍后查看');resume(ctx);
      }else if(r&&r.status==='processing'){
        body='<p class="pr-notice">另一笔兑换正在确认，请先查看原兑换。</p>';footer=button('resume-original','查看原兑换','pr-primary');
      }else{
        const error=problem(s,item),failed=same&&r.status==='failed';
        title=failed?'兑换未完成':'确认兑换';
        body=`${failed?`<p class="pr-notice">${e(r.failure||'兑换未完成，请重新核对。')}</p>`:''}${card}<div class="pr-cost"><small>本次使用</small><strong>${n(item.cost)}<span> 积分</span></strong></div>${rows([['当前可用',n(s.balance)+' 积分'],['兑换后剩余',s.balance>=item.cost&&!s.pending?n(s.balance-item.cost)+' 积分':'—']])}${o?rows([['在哪里用',o.usage||'待公布'],['使用期限',model.validity(o)],['兑换次数',model.policy(o)],['退回条件',o.returns||'待公布']]):'<p class="pr-notice">使用条件尚未公布，暂不能兑换。</p>'}${error?`<p class="pr-notice">${e(error)}</p>`:'<p class="pr-hint">确认后使用积分兑换，不需要现金支付。</p>'}`;
        footer=button('submit',failed?'重新模拟兑换':'确认模拟兑换 · '+n(item.cost)+' 积分','pr-primary',Boolean(error)||busy)+button(s.pending>0?'route:PTS-02':s.balance<item.cost?'route:MEM-04':'route:PTS-03',s.pending>0?'查看调整记录':s.balance<item.cost?'看看如何赚积分':'暂不兑换');
      }
      const h=item?model.history(s,item):{entries:[]};
      const historyList=h.entries.length?`<details class="pr-more"><summary>以往兑换（${h.entries.length}）</summary>${h.entries.map(x=>button('record:'+encodeURIComponent(x.tx.requestId),date(x.tx.posted_at)+' · '+n(-x.tx.amount)+' 积分')).join('')}</details>`:'';
      return `<article class="points-redemption-page"><header class="pr-header">${button('route:PTS-03','‹ 返回')}<h1>${e(title)}</h1></header>${body}${historyList}<div class="pr-message" role="status">${e(message)}</div><footer class="pr-actions">${footer}</footer></article>`;
    }
    function handle(command,value,ctx){
      if(!command.startsWith('pr-'))return false;if(document.querySelector('#screen')?.dataset.page!=='PTS-04')return true;
      if(command==='pr-record'){const s=snapshot(ctx),item=!s.unavailable&&catalog[s.data.selectedRedemptionId];let id;try{id=decodeURIComponent(value);}catch{return true;}if(item&&model.history(s,item).entries.some(x=>x.tx.requestId===id)&&save(s,{...s.data,selectedPointsRedemptionId:id,pointsRedemptionIntent:'history'},ctx))ctx.render();return true;}
      if(command==='pr-route'&&value==='HELP-03'){
        const s=snapshot(ctx),item=!s.unavailable&&catalog[s.data.selectedRedemptionId];if(!item)return true;
        const h=model.history(s,item),r=request(s),id=s.data.selectedPointsRedemptionId||(!r?.unknown&&r?.id)||h.entries[0]?.tx.requestId||s.data.pointsTransactions?.find(x=>x?.itemId===item.id||x?.id==='redemption:'+item.id)?.requestId||'';
        if(save(s,{...s.data,pointsRedemptionSupport:{scope:s.scope,itemId:item.id,requestId:id,issue:message||(!h.unknown&&h.entries.length?'咨询兑换与使用':'兑换结果待核对')}},ctx))ctx.go('HELP-03');else ctx.render();return true;
      }
      if(command==='pr-route'){if(['PTS-03','PTS-02','MEM-04','STU-08','HELP-03'].includes(value))ctx.go(value);return true;}
      if(command==='pr-refresh'){failedSave='';message='已重新读取兑换信息。';resume(ctx);ctx.render();return true;}
      if(command==='pr-resume-original'){const s=snapshot(ctx),r=!s.unavailable&&request(s);if(r&&!r.unknown&&r.status==='processing'&&save(s,{...s.data,selectedRedemptionId:r.itemId},ctx))ctx.render();return true;}
      if(command==='pr-submit'&&!busy){
        const view=shown;busy=true;
        locked(()=>{
          const s=snapshot(ctx),item=!s.unavailable&&catalog[s.data.selectedRedemptionId],r=!s.unavailable&&request(s);
          if(!item||view?.scope!==s.scope||view.itemId!==item.id){message='账号或兑换内容已变化，请重新核对。';return;}
          if(receipt(s,item)||r?.unknown||r?.status==='processing'||(r?.status==='success'&&r.itemId===item.id&&s.data.pointsRedemptionIntent!=='new')||(!r&&['success','processing'].includes(s.data.redemptionStatus))){message='请先查看这笔兑换的当前结果。';return;}
          const o=s.data.pointsRedemptionOffers?.[item.id],error=problem(s,item);
          if(error||view.offer!==fingerprint(o)){message=error||'兑换条件已更新，请核对后再次确认。';return;}
          if(navigator.onLine===false){message='当前网络不可用，尚未提交兑换。连接后请重试。';return;}
          const requestId=crypto.randomUUID(),req={id:requestId,itemId:item.id,accountRef:s.account,scope:s.scope,cost:item.cost,offer:JSON.parse(JSON.stringify(o)),status:'processing',requestedAt:stamp(Date.now())};
          if(save(s,{...s.data,redemptionStatus:'processing',pointsRedemptionIntent:'current',selectedPointsRedemptionId:requestId,pointsRedemptionRequest:req},ctx)){message='';failedSave='';resume(ctx);}
        }).catch(()=>{message='暂未提交兑换，请重试。';}).finally(()=>{busy=false;redraw(ctx);});
        return true;
      }
      return true;
    }
    function supportPanel(restore=false){
      try{const login=JSON.parse(localStorage.getItem('haloV5AppProgress')||'null');if(!login?.signedIn||!login.authVerified)return '';
        const ctx={memberCreatedAt:login.memberCreatedAt||'',newMember:login.newMember,applicationContext:()=>({signedIn:login.signedIn,accountRef:login.authPhone||login.authForm?.phone})},s=read(ctx),c=s.data?.pointsRedemptionSupport;
        if(s.unavailable||c?.scope!==s.scope||!catalog[c.itemId])return '';
        if(restore){return save(s,{...s.data,selectedRedemptionId:c.itemId,selectedPointsRedemptionId:c.requestId||null,pointsRedemptionIntent:'history'},ctx);}
        return `<section class="sc-context"><h3>关于这笔兑换</h3><p>${e(catalog[c.itemId].title)}</p><p>兑换编号：${e(c.requestId||'暂未取得')}</p><p>${e(c.issue)}</p><p>仅用于核对，尚未发送给客服。</p><button data-action="support:source" class="text-button">返回这笔兑换</button></section>`;
      }catch{return '';}
    }
    return {render,handle,resume,supportPanel};
  }};
})();
