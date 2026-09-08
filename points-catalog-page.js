(function(){
  "use strict";
  window.HALO_POINTS_CATALOG={create({read,catalog,storageKey,escape:e}){
    let open="",scope="",message="",shownScope="";
    const number=n=>n.toLocaleString("zh-CN");
    const icon=(name)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${name==="ticket"?'<path d="M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4Z"/><path d="M15 5v3m0 3v2m0 3v3"/>':name==="gift"?'<path d="M3 9h18v4H3zM5 13v8h14v-8M12 9v12M12 9C5 9 4 3 8 3c3 0 4 6 4 6Zm0 0s1-6 4-6c4 0 3 6-4 6Z"/>':'<path d="m14 5-7 7 7 7"/>'}</svg>`;
    const btn=(action,label,cls="",disabled=false)=>`<button class="${cls}" data-action="commercial:pc-${action}"${action==='route:PTS-01'?' aria-label="返回积分首页"':''}${disabled?' disabled':''}>${label}</button>`;
    function snapshot(ctx){const s=read(ctx);if(scope!==(s.scope||"")){scope=s.scope||"";message="";open="";try{const saved=JSON.parse(sessionStorage.getItem("haloPointsCatalogView:"+scope)||"null");if(catalog[saved?.open])open=saved.open;}catch{}}return s;}
    const model=window.HALO_POINTS_REDEMPTION_DATA;
    const offer=(s,item)=>model.validOffer(s.data?.pointsRedemptionOffers?.[item.id],item)?s.data.pointsRedemptionOffers[item.id]:null;
    function stateFor(s,item){
      if(s.unavailable)return {label:"积分暂未取得",blocked:true};
      const h=model.history(s,item);if(h.unknown)return {label:"兑换记录待核对",blocked:true};
      if(s.pending>0)return {label:"积分调整中",blocked:true};
      if(s.data.redemptionStatus==="processing" || (Array.isArray(s.data.orders)&&s.data.orders.some(o=>o?.status==="processing")))return {label:"已有操作正在确认",blocked:true};
      const o=offer(s,item);if(!item.available||!o)return {label:"暂未开放兑换",blocked:true};
      const limit=model.limitReason(s,item,o);if(limit)return {label:limit,blocked:true};
      if(o.simulated!==true)return {label:"兑换服务暂未接通",blocked:true};
      if(s.balance<item.cost)return {label:`还差 ${number(item.cost-s.balance)} 积分`,blocked:true};
      return {label:"可以兑换"};
    }
    function render(ctx){
      const s=snapshot(ctx);shownScope=s.scope||"";
      const cards=Object.values(catalog).map((item,i)=>{
        const st=stateFor(s,item),terms=offer(s,item),expanded=open===item.id,h=model.history(s,item);
        return `<section class="pc-card ${i===0?'pc-feature':''}"><div class="pc-card-top"><span class="pc-symbol">${icon(i===0?'ticket':'gift')}</span><span class="pc-badge">${e(st.label)}</span></div><small class="pc-category">${e(item.context)}</small><h2>${e(item.shortTitle)}</h2><p class="pc-description">${e(item.usage)}</p><div class="pc-card-bottom"><span class="pc-price"><strong>${number(item.cost)}</strong> 积分</span><button class="pc-details-button" data-action="commercial:pc-open:${item.id}" aria-expanded="${expanded}" aria-controls="pc-detail-${item.id}">${expanded?'收起说明':'查看说明'} <span aria-hidden="true">${expanded?'−':'＋'}</span></button></div>
        ${expanded?`<div class="pc-detail" id="pc-detail-${item.id}">${terms?`<dl><div><dt>在哪里用</dt><dd>${e(terms.usage)}</dd></div><div><dt>使用期限</dt><dd>${e(model.validity(terms))}</dd></div><div><dt>兑换次数</dt><dd>${e(model.policy(terms))}</dd></div><div><dt>退回条件</dt><dd>${e(terms.returns)}</dd></div></dl>`:`<p>${e(item.unavailableCopy||'可用场次、使用期限和退回条件尚未公布，暂不能兑换。')}</p>`}${st.blocked?`<p class="pc-reason">${e(st.label)}${s.pending>0?'，完成后恢复兑换。':s.unavailable?'，请重新读取后再试。':'。'}</p>${s.pending>0?btn('route:PTS-02','查看调整记录','pc-secondary'):!s.unavailable&&item.available&&terms&&s.balance<item.cost?btn('route:MEM-04','看看如何赚积分','pc-secondary'):s.unavailable?btn('refresh','重新读取','pc-secondary'):''}`:btn('select:'+item.id,st.done?'查看兑换结果':'下一步 · 确认兑换','pc-primary')}${h.unknown?btn('history:'+item.id,'核对兑换记录','pc-secondary'):''}${h.entries.length?btn('history:'+item.id,'查看以往兑换（'+h.entries.length+'）','pc-secondary'):''}${!st.blocked&&!st.done?'<small class="pc-footnote">下一步核对，当前不会扣除积分</small>':''}</div>`:''}</section>`;
      }).join('');
      return `<article class="points-catalog-page"><header class="pc-header">${btn('route:PTS-01',icon('back'))}<h1>积分兑换</h1>${btn('refresh','刷新')}</header><div class="pc-balance"><span>可用积分 <strong>${s.unavailable?'—':number(s.balance)}</strong></span>${btn('route:PTS-02','积分明细 ›')}</div>${s.unavailable?'<p class="pc-notice">积分信息暂未取得，可以先看看兑换内容。</p>':s.pending>0?'<p class="pc-notice">积分使用暂时暂停，其他功能照常使用。</p>':''}${!s.unavailable && s.data.redemptionStatus==='processing'?`<div class="pc-notice">有一笔兑换正在确认${catalog[s.data.selectedRedemptionId]?btn('route:PTS-04','查看兑换进度','pc-secondary'):'，请联系支持核对。'}</div>`:!s.unavailable&&Array.isArray(s.data.orders)&&s.data.orders.some(o=>o?.status==='processing')?`<div class="pc-notice">有一笔订单正在确认${btn('route:SEL-10','查看订单','pc-secondary')}</div>`:''}<div class="pc-message" role="status">${e(message)}</div><div class="pc-section-title"><h2>用积分，换一份体验</h2><span>全积分兑换</span></div>${cards}<p class="pc-bottom-note">购物抵扣在商品结算时选择</p>${btn('route:SEL-01','去 Halo Select 逛逛 ›','pc-shopping')}</article>`;
    }
    function handle(command,value,ctx){
      if(!command.startsWith('pc-'))return false;
      if(document.querySelector('#screen')?.dataset.page!=="PTS-03")return true;
      const previousScope=shownScope,s=snapshot(ctx);
      if(command==='pc-refresh'){message=s.unavailable?'仍未取得积分信息，请稍后重试。':'已重新读取积分与兑换状态。';ctx.render();return true;}
      if(command==='pc-route'){if(['PTS-01','PTS-02','MEM-04','SEL-01','SEL-10'].includes(value))ctx.go(value);else if(value==='PTS-04'&&!s.unavailable&&previousScope===s.scope&&s.data.redemptionStatus==='processing'&&catalog[s.data.selectedRedemptionId])ctx.go(value);return true;}
      const item=catalog[value];if(!item)return true;
      if(command==='pc-open'){open=open===value?'':value;try{sessionStorage.setItem('haloPointsCatalogView:'+scope,JSON.stringify({open}));}catch{message='查看位置暂未保存，仍可继续浏览。';}ctx.render();return true;}
      if(command==='pc-history'){const h=model.history(s,item);if(!s.unavailable&&(h.unknown||h.entries.length)){try{localStorage.setItem(storageKey,JSON.stringify({...s.data,selectedRedemptionId:value,pointsRedemptionIntent:'history',selectedPointsRedemptionId:h.entries[0]?.tx.requestId||null}));read(ctx);ctx.go('PTS-04');}catch{message='未能打开记录，请重试。';ctx.render();}}return true;}
      if(command==='pc-select'){
        if(previousScope!==(s.scope||'') || stateFor(s,item).blocked){message='积分或兑换状态已变化，请重新核对。';ctx.render();return true;}
        // Save the selected item only. Never post points for opening confirmation.
        try{const data={...s.data,selectedRedemptionId:value,pointsRedemptionIntent:'new',selectedPointsRedemptionId:null,redemptionStatus:'ready'};localStorage.setItem(storageKey,JSON.stringify(data));read(ctx);}catch{message='未能保存这次选择，请重试。积分没有扣除。';ctx.render();return true;}
        ctx.go('PTS-04');return true;
      }
      return true;
    }
    return {render,handle};
  }};
})();
