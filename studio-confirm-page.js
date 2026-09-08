(() => {
  "use strict";
  window.createHaloStudioConfirm = function ({state,events,lookup,media,read,commit,recordStatus,go,render,esc,icon}) {
    const account=p=>String(p.authPhone||p.authForm?.phone||"local-demo");
    const id=()=>state.selectedStudioEventId;
    const record=()=>state.studioRecords?.[id()];
    const check=()=>state.studioInstitutionChecks?.[id()];
    const outcomes={verified:"核验通过",notfound:"未找到预约",unknown:"结果未知"};
    let fresh=true,source=null,busy=false,timer=null,error="",outcome="verified",shown="",shownRecord="",last="",saveFailed=false;
    const valid=p=>p?.signedIn&&p.authVerified&&p.accountDeletionStatus!=="submitted"&&account(p)===account(state);
    const existing=r=>Boolean(r&&(r.booked||r.bookingId||r.sessionStarted||r.sessionDone||r.bookingRequest||r.paymentRequest||r.refundRequest||r.refundStatus&&r.refundStatus!=="none"||r.voucherId||r.useVoucher||r.beforeFeeling||r.beforeDraft||r.feelingDraft||r.deletionStatus&&r.deletionStatus!=="ready"));
    function owned(r=record()) {return !r||(!r.accountRef||r.accountRef===account(state))&&(!r.sessionAccountRef||r.sessionAccountRef===account(state))&&(!r.eventId||r.eventId===id())&&(!r.eventSnapshot?.id||r.eventSnapshot.id===id())&&(!r.eventSnapshot?.eventId||r.eventSnapshot.eventId===id())&&(!r.sessionScope||r.sessionScope.eventId===id()&&r.sessionScope.bookingId===r.bookingId);}
    function context(){const l=lookup();return JSON.stringify([account(state),id(),l?.requestId,l?.draft]);}
    function prepare(){
      if(state.current!=="STU-02")return true;
      source=read();const p=source?.progress;
      fresh=Boolean(valid(p)&&p.studioRecords&&typeof p.studioRecords==="object"&&!Array.isArray(p.studioRecords)&&(!p.studioInstitutionChecks||typeof p.studioInstitutionChecks==="object"&&!Array.isArray(p.studioInstitutionChecks)));
      if(fresh){state.studioRecords={...p.studioRecords};state.studioInstitutionChecks={...p.studioInstitutionChecks};}
      resume();return fresh;
    }
    function validCheck(q=check()) {return q?.version===1&&q.accountRef===account(state)&&q.eventId===id()&&q.context===context()&&typeof q.id==="string"&&q.id&&Number.isInteger(q.attempt)&&Object.hasOwn(outcomes,q.outcome)&&["checking","verified","notfound","unknown","review"].includes(q.status)&&q.simulated===true;}
    function event(){return existing(record())&&owned()?record().eventSnapshot||events[id()]:events[id()];}
    function model(){
      if(!fresh||!owned()||lookup()?.eventId!==id()||!Object.hasOwn(events,id()))return {kind:"blocked",title:"暂时无法核对这场活动",note:"没有更改你的预约。请返回体验码页面重新查找，或联系客服。",label:"重新读取",action:"reload"};
      const r=record(),q=check();
      if(existing(r)){
        const s=recordStatus(id(),r),verified=validCheck(q)&&q.status==="verified"&&q.bookingId===r.bookingId;
        return {kind:"existing",title:verified?"预约已核验":"已有本场记录",note:verified?"接下来选择参加方式，查看到场准备。":"请查看原记录，无需重新核验或再次付款。",label:verified&&!r.sessionStarted&&!r.sessionDone&&r.refundStatus==="none"?"查看参加准备":s.cta||"查看原记录",action:"existing",route:verified&&!r.sessionStarted&&!r.sessionDone&&r.refundStatus==="none"?"STU-10":s.route||"HELP-03"};
      }
      if(q&&!validCheck(q))return {kind:"review",title:"核验信息需要更新",note:"请重新核验当前活动，原记录没有改变。",label:"重新核验",action:"verify"};
      if(validCheck(q)&&q.status==="checking")return {kind:"checking",title:saveFailed?"核验结果暂未保存":"正在核验预约",note:saveFailed?"还没有新增预约，请重试保存结果。":"可以先离开，回来后继续查看结果。",label:saveFailed?"重试保存结果":"正在核验…",action:saveFailed?"retry-save":"verify",disabled:!saveFailed};
      const end=Date.parse(event()?.startsAt)+Number(event()?.duration)*60000;
      if(!Number.isFinite(end)||Date.now()>=end)return {kind:"closed",title:"活动时间需要核对",note:"这场活动可能已经结束，请联系活动客服核对参与记录。",label:"联系活动客服",action:"help"};
      if(q?.status==="notfound")return {kind:"notfound",title:"没有找到你的预约",note:"请确认预约使用的是当前登录账号，或联系原预约方核对。",label:"重新核验",action:"verify"};
      if(q?.status==="unknown")return {kind:"unknown",title:"暂时无法确认预约",note:"还没有收到明确结果。可以查询原请求，暂时不用重新预约。",label:"查询核验结果",action:"verify"};
      if(q?.status==="review")return {kind:"review",title:"预约信息有变化",note:"没有覆盖已有内容，请重新核对活动或联系客服。",label:"重新核验",action:"verify"};
      return {kind:"idle",title:"是你预约的这场活动吗？",note:"核对时间和地点后，验证你的预约。这里不会再次付款。",label:"核验我的预约",action:"verify"};
    }
    const button=(label,action,cls="secondary",disabled=false)=>`<button type="button" class="${cls}" data-action="stui-${action}" ${disabled||busy?"disabled":""}>${esc(label)}</button>`;
    function page(){
      const m=model(),e=m.kind!=="blocked"?event():null;
      shown=context();shownRecord=JSON.stringify(record()||null);last=JSON.stringify([fresh,record(),check(),context()]);
      return `<article class="studio-confirm studio-detail" aria-busy="${busy||m.kind==="checking"&&!saveFailed}"><div class="studio-detail-scroll" tabindex="0" aria-label="核对活动与预约"><header class="studio-detail-header"><button type="button" data-action="stui-back" aria-label="返回体验码">${icon("back")}</button><h1>核对活动</h1>${button("客服","help","studio-confirm-help")}</header>
      ${e?`<div class="studio-confirm-event">${media(id())?`<img src="${media(id())}" alt="${esc(e.category)}场地示意图" width="80" height="80">`:""}<span>${esc(e.category||"Studio")}</span><h2>${esc(e.title)}</h2></div><dl class="studio-confirm-facts"><div><dt>${icon("calendar")}时间</dt><dd>${esc(e.date||"待核对")}</dd></div><div><dt>${icon("pin")}地点</dt><dd>${esc(e.place||"待核对")}</dd></div><div><dt>${icon("clock")}时长</dt><dd>${Number.isFinite(e.duration)?`${esc(e.duration)}分钟`:"待核对"}</dd></div><div><dt>${icon("person")}主理人</dt><dd>${esc(e.host||"待核对")}</dd></div></dl>`:""}
      <section class="studio-confirm-status" role="status"><span class="studio-confirm-status-icon">${icon(m.kind==="existing"?"ticket":m.kind==="checking"?"clock":"report")}</span><h2>${esc(m.title)}</h2><p>${esc(m.note)}</p></section>
      ${e?`<details class="studio-confirm-details"><summary>付款、取消与退款</summary><p>已有预约的付款记录和取消条件，以原预约信息为准。需要退款时，请联系原预约方；核验不会产生新扣款。</p>${button("咨询预约事宜","help")}</details>${button("不是这场，重新找","back","studio-confirm-change")}`:""}</div>
      <footer class="studio-detail-footer"><p class="studio-confirm-feedback" role="status">${esc(error)}</p>${button(busy?"正在处理…":m.label,m.action,"primary",m.disabled)}${["notfound","unknown","review"].includes(m.kind)?button("联系 Halo 客服","help"):""}</footer></article>`;
    }
    function save(updates){if(!source?.raw||!commit(source.raw,updates)){error="未能保存，原预约没有改变。请重试。";return false;}Object.assign(state,updates);return true;}
    async function locked(fn){const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),6000);try{if(!navigator.locks?.request){error="暂时无法安全核验，请重新打开后再试。";return;}await navigator.locks.request("halo-studio-session-start",{mode:"exclusive",signal:ctrl.signal},fn);}catch{error="操作未完成，请稍后重试。原预约仍然保留。";}finally{clearTimeout(timer);}}
    async function verify(){
      if(busy||state.current!=="STU-02")return;const expected=shown,expectedRecord=shownRecord;busy=true;error="";render();
      await locked(()=>{
        if(state.current!=="STU-02"||!prepare()||!owned()||context()!==expected||JSON.stringify(record()||null)!==expectedRecord){error="活动或账号有更新，请重新核对。";return;}
        const m=model();if(!["idle","notfound","unknown","review"].includes(m.kind))return;
        if(navigator.onLine===false){error="当前离线，联网后再核验。活动信息仍然保留。";return;}
        const old=validCheck()?check():null;
        const q={version:1,id:old?.id||crypto.randomUUID(),attempt:(old?.attempt||0)+1,accountRef:account(state),eventId:id(),context:context(),status:"checking",outcome,simulated:true,
          baseRecord:JSON.stringify(record()||null),eventSnapshot:{...events[id()]},startedAt:new Date().toISOString()};
        if(save({studioInstitutionChecks:{...state.studioInstitutionChecks,[id()]:q}}))saveFailed=false;
      });
      busy=false;if(state.current==="STU-02")render();
    }
    function resume(){
      if(timer||busy||saveFailed||state.current!=="STU-02"||!fresh||!validCheck()||check().status!=="checking")return;
      const q={...check()};timer=setTimeout(async()=>{busy=true;
        await locked(()=>{
          if(state.current!=="STU-02"||!prepare()||!validCheck()||check().id!==q.id||check().attempt!==q.attempt||check().status!=="checking")return;
          const current=record(),changed=JSON.stringify(current||null)!==q.baseRecord||JSON.stringify(events[id()])!==JSON.stringify(q.eventSnapshot);
          const ended=Date.now()>=Date.parse(q.eventSnapshot.startsAt)+Number(q.eventSnapshot.duration)*60000;
          const status=changed||ended||!owned()?"review":navigator.onLine===false?"unknown":q.outcome;
          const done={...check(),status,resolvedAt:new Date().toISOString()};
          const updates={studioInstitutionChecks:{...state.studioInstitutionChecks,[id()]:done}};
          if(status==="verified"&&!existing(current)){
            const bookingId=`SI-${q.id}`;done.bookingId=bookingId;
            updates.studioRecords={...state.studioRecords,[id()]:{bookingId,eventId:id(),accountRef:account(state),booked:true,paid:true,participationConfirmed:true,source:"institution",
              paidAmount:null,dueAmount:null,baseAmount:null,refundableAmount:null,refundStatus:"none",eventSnapshot:q.eventSnapshot,
              institutionReceipt:{version:1,id:`IR-${q.id}`,requestId:q.id,accountRef:account(state),eventId:id(),bookingId,participationConfirmed:true,paymentAmount:null,verifiedAt:done.resolvedAt,simulated:true},
              sessionStarted:false,sessionDone:false,mode:"basic",healthConsent:false,activityConsent:false,contactConsent:false,marketingConsent:false,reportStatus:"waiting",benefitStatus:"pending",beforeFeeling:"",beforeDraft:"",deletionStatus:"ready",useVoucher:false}};
          }
          if(!save(updates)){saveFailed=true;error="核验结果没能保存，还没有新增预约。请重试保存。";}
        });
        busy=false;timer=null;if(state.current==="STU-02")render();
      },800);
    }
    function handle(action){
      if(action==="studio-institution-confirm")action="stui-verify";
      if(!action.startsWith("stui-"))return false;
      if(state.current!=="STU-02")return true;
      if(action.startsWith("stui-review:")){const next=action.slice(12);if(Object.hasOwn(outcomes,next)&&!busy){outcome=next;render();}return true;}
      if(action==="stui-verify"){verify();return true;}
      if(action==="stui-retry-save"){saveFailed=false;error="";prepare();render();return true;}
      if(action==="stui-reload"){error="";prepare();render();return true;}
      if(action==="stui-back"){go("STU-01");return true;}
      if(action==="stui-help"){go("HELP-03");return true;}
      if(action==="stui-existing"){const before=shown,beforeRecord=shownRecord;prepare();const m=model();if(before!==context()||beforeRecord!==JSON.stringify(record()||null)||m.kind!=="existing"){error="记录有更新，请核对后再继续。";render();}else go(m.route);return true;}
      return true;
    }
    function refresh(){if(document.hidden||busy||state.current!=="STU-02")return;prepare();if(last!==JSON.stringify([fresh,record(),check(),context()])){if(fresh&&owned()&&existing(record())){error="";saveFailed=false;}render();}}
    setInterval(refresh,900);window.addEventListener("storage",refresh);window.addEventListener("online",refresh);document.addEventListener("visibilitychange",refresh);
    const reviewControls=item=>item.id==="STU-02"?`<section class="review-controls"><h3>机构预约核验 · 本地演示</h3><small>800ms为演示延迟，未接业务后台。通过仅模拟参加资格，不代表App收款；机构付款金额保持未知。选择下一次核验结果：</small><div class="review-control-group">${Object.entries(outcomes).map(([key,label])=>`<button data-action="stui-review:${key}" aria-pressed="${outcome===key}">${label}</button>`).join("")}</div></section>`:"";
    return {prepare,page,handle,reviewControls,blocksPersist:()=>state.current==="STU-02"||!fresh};
  };
})();
