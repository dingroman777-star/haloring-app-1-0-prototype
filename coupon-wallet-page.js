(function () {
  "use strict";
  const categories={all:"全部",coupon:"优惠券",voucher:"兑换券"};
  const statuses={all:"全部状态",available:"可用",used:"已使用",expired:"已失效"};
  const ticket='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4Z"/><path d="M15 5v3m0 3v2m0 3v3"/></svg>';
  const integer=n=>Number.isSafeInteger(n)&&n>=0;
  const date=value=>new Intl.DateTimeFormat("zh-CN",{timeZone:"Asia/Shanghai",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(value));
  window.HALO_COUPON_WALLET={historyFields:route=>route==="MY-02"&&history.state?.couponWallet?{couponWallet:history.state.couponWallet}:{},create({storageKey,coupon,catalog,escape:e}){
    let message="",shownScope="",shownItems=new Map();
    const fingerprint=item=>JSON.stringify([item.state,item.route,item.title,item.value,item.condition,item.expiry,item.starts,item.statusLabel,item.requestId]);
    const scope=ctx=>`${ctx.applicationContext?.().accountRef||""}|${ctx.memberCreatedAt||""}`;
    function itemFor(row){
      const id=row?.itemId||row?.redemptionId||Object.keys(catalog).find(id=>row?.id===`voucher:${id}`);
      if(!Object.hasOwn(catalog,id)||row?.itemId&&row?.redemptionId&&row.itemId!==row.redemptionId)return null;
      return catalog[id];
    }
    function view(ctx){const saved=history.state?.couponWallet;return saved?.scope===scope(ctx)?{category:categories[saved.category]?saved.category:"all",status:statuses[saved.status]?saved.status:"all",open:saved.open||""}:{category:"all",status:"all",open:""};}
    function saveView(ctx,patch){history.replaceState({...history.state,couponWallet:{...view(ctx),...patch,scope:scope(ctx)}},"",location.href);}
    function read(ctx){
      const source=window.HALO_MEMBER_DATA.read(ctx,{storageKey,allowFresh:true}),items=[];
      if(!source.trusted&&!source.fresh)return {items,unavailable:true};
      const data=source.data,owns=row=>row&&typeof row==="object"&&(!Object.hasOwn(row,"accountRef")||row.accountRef===source.account)&&(!Object.hasOwn(row,"registrationId")||row.registrationId===source.registration);
      if(!owns(data)||data.memberAssets&&!owns(data.memberAssets))return {items,unavailable:true};
      let incomplete=!source.fresh&&(!Array.isArray(data.ownedCouponIds)||!Array.isArray(data.vouchers)||data.coupons!==undefined&&!Array.isArray(data.coupons));
      const ids=Array.isArray(data.ownedCouponIds)?[...new Set(data.ownedCouponIds)]:[];
      const coupons=Array.isArray(data.coupons)?data.coupons:[];
      const histories=new Map();
      function add(row,kind){
        if(!owns(row)||typeof row.id!=="string"||!row.id||typeof row.title!=="string"||!row.title.trim()){incomplete=true;return;}
        const key=`${kind}:${row.id}`;
        if(items.some(item=>item.key===key)){Object.assign(items.find(item=>item.key===key),{state:"unknown",statusLabel:"待核对",route:null});incomplete=true;return;}
        const expires=row.expiresAt||row.expires_at,start=row.startsAt;
        const expiryKnown=typeof expires==="string"&&Number.isFinite(Date.parse(expires));
        let state=row.status==="used"?"used":["expired","revoked","cancelled","returned"].includes(row.status)?"expired":row.status==="available"&&expiryKnown&&Date.parse(expires)<=Date.now()?"expired":row.status==="available"&&expiryKnown&&(!start||Number.isFinite(Date.parse(start))&&Date.parse(start)<=Date.now())?"available":"unknown";
        const offer=kind==="voucher"?itemFor(row):null;
        let receiptPending=false;
        if(kind==="voucher"&&(row.requestId!==undefined||row.itemId!==undefined)){
          if(offer&&!histories.has(offer.id))histories.set(offer.id,window.HALO_POINTS_REDEMPTION_DATA?.history?.({data,account:source.account},offer));
          const h=offer&&histories.get(offer.id),pair=h?.entries.find(entry=>entry.v.id===row.id&&entry.v.requestId===row.requestId);
          receiptPending=!offer||typeof row.requestId!=="string"||!row.requestId||row.id!==`voucher:${offer.id}:${row.requestId}`&&row.id!==`voucher:${offer.id}`||!pair||h.unknown||!owns(pair.tx)||!owns(pair.v);
          if(!receiptPending&&row.id===`voucher:${offer.id}:${row.requestId}`&&(typeof row.activityId!=="string"||!row.activityId.trim()||pair.tx.activityId!==row.activityId))receiptPending=true;
          if(receiptPending){state="unknown";incomplete=true;}
        }
        const rate=kind==="coupon"&&row.kind==="discount"&&typeof row.discountRate==="number"&&row.discountRate>0&&row.discountRate<1 ? `${Number((row.discountRate*10).toFixed(2))} 折`:null;
        const cash=kind==="coupon"&&integer(row.amountCents)&&row.amountCents>0 ? `¥${row.amountCents/100}`:null;
        const value=kind==="voucher"?"兑换券":rate||cash||"优惠券";
        const label=kind==="voucher"?"体验与权益":rate?"折扣券":cash?"满减券":"优惠券";
        const condition=typeof row.usage==="string"&&row.usage.trim()?row.usage:integer(row.thresholdCents)?row.thresholdCents>0?`商品满 ¥${row.thresholdCents/100} 可用`:"无最低商品金额要求":"适用范围待确认";
        const knownStudio=offer?.id==="studio-public-session-pass";
        const route=state==="used"?kind==="voucher"?knownStudio?"STU-08":null:"SEL-10":state==="available"&&row.id===coupon.id&&kind==="coupon"?"SEL-01":state==="available"&&knownStudio?"STU-08":null;
        items.push({key,id:row.id,kind,title:row.title,value,label,condition,state,statusLabel:receiptPending?"待核对":row.status==="returned"?"已退回":statuses[state]||"待确认",requestId:row.requestId||"",issuedAt:Number.isFinite(Date.parse(row.issuedAt))&&Date.parse(row.issuedAt)<=Date.now()?date(row.issuedAt):"",expiry:expiryKnown?`有效截止 ${date(expires)}（北京时间）`:"有效期待确认",starts:start&&Number.isFinite(Date.parse(start))&&Date.parse(start)>Date.now()?`${date(start)} 起可用`:"",rules:Array.isArray(row.rules)?row.rules.filter(x=>typeof x==="string"):[],route,action:state==="used"?kind==="voucher"?"查看预约记录":"查看订单":kind==="voucher"?"查看 Studio 场次":"去选商品"});
      }
      for(const id of ids){
        if(coupons.some(row=>row?.id===id))continue;
        if(id===coupon.id)add({...coupon,status:data.couponUsedOrderId?"used":"available",rules:["商品金额满 ¥300 减 ¥20，运费不计入门槛。","结算时选择，本单限用一张；可同时使用 Halo Points。"]},"coupon");
        else if(id==="presale")add({id,title:"预售专用券",amountCents:4000,thresholdCents:50000,status:"unknown",rules:["适用商品与有效期尚未公布，暂不能使用。"]},"coupon");
        else incomplete=true;
      }
      for(const row of coupons)add(row,"coupon");
      for(const row of Array.isArray(data.vouchers)?data.vouchers:[]){
        const offer=itemFor(row);
        add({...row,title:row?.title||offer?.title,usage:row?.usage||offer?.usage},"voucher");
      }
      return {items,unavailable:false,incomplete};
    }
    const button=(action,label,cls="")=>`<button type="button" ${action==="back"?'aria-label="返回我的"':""} class="${cls}" data-action="commercial:wallet-${action}">${label}</button>`;
    function render(ctx){
      if(shownScope!==scope(ctx)){message="";shownScope=scope(ctx);}
      const s=read(ctx),v=view(ctx),visible=s.items.filter(item=>(v.category==="all"||item.kind===v.category)&&(v.status==="all"||item.state===v.status));
      shownItems=new Map(s.items.map(item=>[item.key,fingerprint(item)]));
      return `<article class="coupon-wallet"><header class="cw-header">${button("back",'<span aria-hidden="true">‹</span>')}<h1>我的券包</h1>${button("refresh","刷新")}</header><div class="cw-types" aria-label="券的类型">${Object.entries(categories).map(([key,label])=>`<button type="button" aria-pressed="${v.category===key}" data-action="commercial:wallet-category:${key}">${label}</button>`).join("")}</div><div class="cw-statuses" aria-label="券的状态">${Object.entries(statuses).map(([key,label])=>`<button type="button" aria-pressed="${v.status===key}" data-action="commercial:wallet-status:${key}">${label}</button>`).join("")}</div><p class="cw-message" role="status">${e(message)}</p>${s.unavailable?`<section class="cw-empty">${ticket}<h2>券包暂未取得</h2><p>请重新加载，或联系支持核对。</p>${button("refresh","重新加载","secondary")}</section>`:`${s.incomplete?'<p class="cw-note" role="status">部分券记录暂未取得，可刷新后再看。</p>':""}<div class="cw-list">${visible.map(item=>`<section class="cw-card ${item.state==="expired"?"cw-inactive":""}" data-wallet-id="${e(item.key)}"><div class="cw-card-main"><div class="cw-face"><span>${e(item.value)}</span><small>${e(item.label)}</small></div><div class="cw-copy"><span class="cw-state">${e(item.statusLabel)}</span><h2>${e(item.title)}</h2><p>${e(item.condition)}</p></div></div><div class="cw-card-bottom"><p>${e(item.starts||item.expiry)}</p><button type="button" aria-expanded="${v.open===item.key}" data-action="commercial:wallet-open:${encodeURIComponent(item.key)}">${v.open===item.key?"收起":"使用说明"} <span aria-hidden="true">${v.open===item.key?"−":"＋"}</span></button></div>${v.open===item.key?`<div class="cw-detail"><p>${e(item.expiry)}</p>${item.issuedAt?`<p>兑换时间：${e(item.issuedAt)}（北京时间）</p>`:""}${item.requestId?`<p class="cw-reference">兑换编号：${e(item.requestId)}</p>`:""}${item.rules.map(rule=>`<p>${e(rule)}</p>`).join("")}${item.state==="available"?`<p>${item.kind==="voucher"?"是否适用以所选场次或权益确认页为准，打开券包不会核销。":item.id===coupon.id?"符合条件时在结算页选择使用，打开券包不会选中或消耗此券。":"这类券的线上使用入口尚未开放，可联系支持确认使用方式。"}</p>`:item.state==="unknown"?"<p>使用信息尚未完整，请联系支持核对。</p>":""}${item.route?button(`use:${encodeURIComponent(item.key)}`,e(item.action),"primary"):button("support","联系支持","secondary")}</div>`:""}</section>`).join("")||`<section class="cw-empty">${ticket}<h2>${s.incomplete?"暂无已取得的券记录":v.category==="voucher"?"这里还没有兑换券":v.category==="coupon"?"这里还没有优惠券":"这里还没有券"}</h2><p>${v.status!=="all"?"可以切换到全部状态再看看。":"收到的折扣券、满减券和兑换券，会出现在这里。"}</p></section>`}</div>`}<div class="cw-footer">${button("points","看看积分兑换 ›")}${button("support","需要帮助？")}</div></article>`;
    }
    function handle(command,value,ctx){
      if(!command.startsWith("wallet-"))return false;
      if(!document.querySelector('#screen[data-page="MY-02"]'))return true;
      if(command==="wallet-back"){ctx.go("MY-01");return true;}
      if(command==="wallet-support"){ctx.go("HELP-03");return true;}
      if(command==="wallet-points"){ctx.go("PTS-03");return true;}
      if(command==="wallet-category"&&categories[value])saveView(ctx,{category:value,open:""});
      else if(command==="wallet-status"&&statuses[value])saveView(ctx,{status:value,open:""});
      else if(command==="wallet-open"||command==="wallet-use"){
        let key;try{key=decodeURIComponent(value);}catch{return true;}
        const item=read(ctx).items.find(row=>row.key===key);
        if(!item){message="券记录已更新，请重新查看。";ctx.render();return true;}
        if(command==="wallet-use"){if(shownItems.get(key)===fingerprint(item)&&item.route)ctx.go(item.route);else{message="这张券的状态已变化，请重新查看。";ctx.render();}return true;}
        saveView(ctx,{open:view(ctx).open===key?"":key});
      }else if(command==="wallet-refresh")message=read(ctx).unavailable?"暂未取得券记录，请稍后重试。":"已重新读取券记录。";
      const top=document.getElementById("screen").scrollTop;ctx.render();
      requestAnimationFrame(()=>{const screen=document.getElementById("screen");screen.scrollTop=top;screen.querySelector(`[data-action="commercial:${command}${value?":"+value:""}"]`)?.focus({preventScroll:true});});
      return true;
    }
    return {render,handle,read};
  }};
})();
