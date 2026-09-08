/* DEV-12: isolated local prototype receipts. No real SDK, deletion or account API is called. */
(() => {
  window.createHaloDeviceMaintenance = function ({ state, go, render, persist, track, esc, symbol, modalRoot, closeModal, showInfoModal, binding, home, firmware, initialSync }) {
    const kinds = ["check", "clear", "reset", "remove", "unbind", "steps"];
    const labels = { check: "检查设备状态", clear: "清除戒指内记录", reset: "恢复出厂设置", remove: "从本机移除", unbind: "解除账号绑定", steps: "重置今日步数" };
    const object = x => !!x && typeof x === "object" && !Array.isArray(x);
    const account = () => String(state.authPhone || state.authForm?.phone || "local-demo");
    const currentId = () => String(state.pairedDevice?.id || "");
    const owns = (id, ref = account()) => Object.values(state.deviceBindings || {}).find(d => d && String(d.id) === id && d.accountRef === ref);
    const boundAt = d => String(d?.boundAt || "");
    const time = t => typeof t === "string" && Number.isFinite(Date.parse(t)) && Date.parse(t) <= Date.now() + 1000;
    const fresh = t => time(t) && Date.now() - Date.parse(t) < 60000; // Demo freshness, not an SDK contract.
    const root = () => state.deviceMaintenance;
    const data = () => root().accounts[account()];
    const view = () => data().devices[data().selectedId];
    const all = () => Object.values(root()?.accounts?.[account()]?.devices || {});
    const pending = r => r?.status === "pending";
    const unsettled = r => pending(r) || r?.status === "uncertain";
    const sameOwnership = r => !!r?.target?.id && !!owns(r.target.id, r.accountRef) && boundAt(owns(r.target.id, r.accountRef)) === r.target.boundAt;
    const isBusy = () => all().some(d => pending(d?.request));
    const unresolved = () => all().some(d => d?.request?.status === "uncertain" && sameOwnership(d.request));
    const blocks = (operation = "other", id = "") => isBusy() || all().some(d => d?.request?.status === "uncertain" && sameOwnership(d.request) && !(operation === "reconnect" && d.request.target.id === id));
    const canView = () => !!root()?.accounts?.[account()]?.devices?.[root()?.accounts?.[account()]?.selectedId]?.request;
    let timer = null, lastPage = "", openTarget = "", intent = null;
    let outcome = "success", queryOutcome = "success", capability = "supported", records = "unknown";
    const emit = (name, r, extra = {}) => track?.(name, { source_page: "DEV-12", simulated: true, operation_id: r?.id, operation: r?.kind, device_id: r?.target?.id, ...extra });
    const icon = type => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${({back:"m14 5-7 7 7 7", clear:"M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 10v7m4-7v7", reset:"M4 10a8 8 0 1 1 0 5M4 4v6h6", remove:"M10 5H4v14h6m4-14h6v14h-6M9 12h6", unbind:"m8 16-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m2 1 2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0M8 8l8 8", steps:"M13 3h1m-5 9 3-6 4 6h4M12 6v9l-5 6m5-6 5 6", info:"M12 10v7m0-11v1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0"})[type] || "M5 12h14"}"/></svg>`;
    const button = (label, action, style = "primary", disabled = false) => `<button type="button" class="${style}" data-action="maintenance:${esc(action)}"${disabled ? " disabled" : ""}>${esc(label)}</button>`;
    const fmt = t => time(t) ? new Date(t).toLocaleString("zh-CN", {timeZone:"Asia/Shanghai",month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit",hour12:false}) : "时间待确认";
    function prepare() {
      let changed = false;
      if (!object(root()) || root().version !== 1) {
        state.deviceMaintenance = { version: 1, accounts: {}, legacyPending: state.deviceResetStatus === "pending" };
        state.deviceResetStatus = "ready"; // Retire unscoped legacy demo status, never infer a completed clear/unbind.
        changed = true;
      }
      if (!object(root().accounts)) { root().accounts = {}; changed = true; }
      if (!object(root().accounts[account()])) { root().accounts[account()] = { selectedId: "", devices: {} }; changed = true; }
      if (!object(data().devices)) { data().devices = {}; changed = true; }
      for (const [id, d] of Object.entries(data().devices)) {
        if (!object(d)) { delete data().devices[id]; changed = true; continue; }
        if (!object(d.target) || d.target.id !== id || typeof d.target.boundAt !== "string") { d.target = {id,suffix:String(owns(id)?.suffix || ""),boundAt:boundAt(owns(id))};d.request=null;d.capabilities={};d.checkedAt="";changed=true; }
        if (!Array.isArray(d.history)) { d.history = []; changed = true; }
        const r = d.request;
        if (r && (!object(r) || r.accountRef !== account() || !object(r.target) || r.target.id !== id || typeof r.target.boundAt !== "string" || typeof r.id !== "string" || !r.id || !kinds.includes(r.kind) || !["pending","uncertain","complete","failed"].includes(r.status) || !["execute","query"].includes(r.mode) || !Number.isFinite(r.readyAt) || r.readyAt > Date.now()+120000 || !["success","failed","uncertain"].includes(r.outcome) || !["success","failed","pending"].includes(r.queryOutcome) || !["supported","unsupported","unknown"].includes(r.capability) || !["unknown","pending","saved"].includes(r.records) || (r.kind !== "check" && (!r.consent || r.consent.targetId !== id || r.consent.accountRef !== account() || r.consent.kind !== r.kind || !time(r.consent.at))))) {
          d.request = null; d.checkedAt = ""; d.capabilities = {}; d.note = "上次操作记录不完整。请先重新检查；无法确认的结果可联系支持。"; changed = true;
        }
        const owner=owns(id);
        if(owner&&d.target.boundAt!==boundAt(owner)) {
          if(d.request){d.request.status="uncertain";remember(d,d.request);}
          d.target={id,suffix:String(owner.suffix || ""),boundAt:boundAt(owner)};d.request=null;d.checkedAt="";d.capabilities={};d.note="这枚戒指的绑定信息已更新，请重新检查。";changed=true;
        }
      }
      if (state.current === "DEV-12" && lastPage !== "DEV-12") {
        const id = openTarget || (owns(currentId()) ? currentId() : data().selectedId);
        if (id && data().selectedId !== id) { data().selectedId = id; changed = true; }
        openTarget = ""; intent = null;
      }
      lastPage = state.current;
      if (!data().selectedId && owns(currentId())) { data().selectedId = currentId(); changed = true; }
      if (data().selectedId && !object(view())) {
        const item = owns(data().selectedId);
        if (item) { data().devices[item.id] = { target: { id: String(item.id), suffix: String(item.suffix || ""), boundAt: boundAt(item) }, checkedAt:"", capabilities:{}, records:"unknown", request:null, history:[], note:root().legacyPending?"旧版操作没有可核对的设备回执；请先检查，未推断清除或解绑成功。":"" };root().legacyPending=false; changed = true; }
      }
      if (changed) persist();
    }
    function otherWork() {
      if (firmware?.()?.isBusy() || firmware?.()?.unresolved()) return ["请先确认固件更新结果。","查看固件更新","DEV-11"];
      if (initialSync?.()?.isBusy()) return ["首次设置还在进行。","查看首次设置","DEV-05"];
      if (home?.()?.isBusy() || state.activitySync?.request?.status === "pending") return ["戒指正在连接或同步。","查看设备状态","DEV-10"];
      if (binding?.unresolved?.()) return ["请先确认上次连接的结果。","查看连接结果","DEV-03"];
      if (state.deviceScan?.status === "scanning") return ["请先完成或退出戒指查找。","查看查找进度","DEV-02"];
      if (state.measurementStatus === "running") return ["测量还在进行。","查看测量","HLT-03"];
      return null;
    }
    function issue(d, kind, query = false) {
      if (!state.signedIn || state.accountDeletionStatus === "submitted") return ["请先登录原账号。","返回登录","AUTH-01"];
      const item = d && owns(d.target.id);
      if (!item || boundAt(item) !== d.target.boundAt) return ["这枚戒指的绑定信息已改变。","查看我的设备","DEV-10"];
      const other = otherWork(); if (other) return other;
      if (["check","clear","reset","steps"].includes(kind)) {
        if (state.toggles?.bluetooth === false || state.connectionIntro?.permission !== "granted") return ["请开启蓝牙并允许连接戒指。","查看权限设置","PERM-01"];
        if (d.target.id !== currentId() || !["connected","low"].includes(state.deviceStatus)) return ["请先连接这枚戒指。","查看连接","DEV-10"];
        if (!query && kind !== "check" && state.deviceStatus === "low") return ["请先给戒指充电，再检查操作条件。","查看设备信息","DEV-11"];
        if (!query && kind !== "check" && (state.membershipHardwareState !== "active" || initialSync?.()?.needsSetup(d.target.id))) return ["请先完成这枚戒指的激活。","继续激活","DEV-05"];
      }
      if (["unbind","account-check"].includes(kind) && navigator.onLine === false) return ["网络暂未连接，联网后才能确认账号绑定。","稍后查看","DEV-10"];
      if (!query && kind === "unbind" && (!fresh(d.accountCheckedAt) || d.capabilities?.unbind !== true)) return ["解除绑定前，先核对当前账号的设备归属。","核对账号绑定","account-check"];
      if (!query && ["clear","reset","steps"].includes(kind) && (!fresh(d.checkedAt) || d.capabilities?.[kind] !== true)) return [fresh(d.checkedAt) ? "暂未确认此设备支持这项操作。" : "请先检查设备状态和操作范围。","检查设备状态","check"];
      return null;
    }
    function showIssue(problem) { showInfoModal("暂时不能继续", problem[0], problem[1], ["check","account-check"].includes(problem[2]) ? `maintenance:${problem[2]}` : `go:${problem[2]}`); }
    function beginCheck(scope = "device") {
      const d = view();
      if (!d || blocks()) return;
      const problem = issue(d,scope === "account" ? "account-check" : "check"); if (problem) return showIssue(problem);
      createRequest(d,"check",null,scope);
    }
    function createRequest(d, kind, consent, scope = "device") {
      const now=Date.now();
      d.request={id:`maintenance-${kind}-${now}-${Math.random().toString(36).slice(2,7)}`,accountRef:account(),target:{...d.target},kind,scope,status:"pending",mode:"execute",startedAt:now,sentAt:now,readyAt:now+(kind==="check"?800:1500),outcome,queryOutcome:"success",capability,records,consent,applied:false};
      d.note=""; intent=null; closeModal(); emit("device_maintenance_submitted",d.request); persist(); render();
    }
    const consequences = {
      clear: ["清除这枚戒指内的记录；尚未同步的部分将无法找回。","已保存到 App 的历史、用户手动记录和会员资产不受影响。"],
      reset: ["清除这枚戒指内的记录与设备设置，尚未同步的记录将无法找回；之后需要重新连接。","不会因此解除 Halo 账号绑定，也不会删除 App 历史或会员资产。"],
      remove: ["移除本机连接记录并断开这枚戒指，需要时可重新连接。","不会清除戒指数据或解除 Halo 账号绑定。"],
      unbind: ["仅解除这枚戒指与当前 Halo 账号的绑定，不同时清除戒指数据。","其他戒指不受影响。若没有其他已激活设备，暂停未来成长；已有等级、积分和历史保留。"],
      steps: ["只清零这枚戒指端今天的累计步数。","App 中已保存的步数和活动记录不会删除。"]
    };
    function confirm(kind) {
      const d=view(); if (!d || !kinds.includes(kind) || kind==="check" || blocks()) return;
      const problem=issue(d,kind); if(problem)return showIssue(problem);
      intent={nonce:`confirm-${Date.now()}-${Math.random()}`,accountRef:account(),target:{...d.target},kind,checkedAt:d.checkedAt};
      const physical=["clear","reset","steps"].includes(kind);
      modalRoot.innerHTML=`<div class="modal-backdrop"><section class="modal info-modal dm-modal" role="dialog" aria-modal="true" aria-labelledby="dm-confirm-title" data-intent="${esc(intent.nonce)}"><h2 id="dm-confirm-title">${labels[kind]}？</h2><p class="dm-target">Halo Ring · 尾号 ${esc(d.target.suffix || "待确认")}<br>当前 Halo 账号</p><ul class="dm-consequences">${consequences[kind].map(s=>`<li>${esc(s)}</li>`).join("")}</ul>${physical?`<label class="dm-check"><input type="checkbox" id="dm-risk-check" data-action="maintenance:ack"><span>我了解这项操作的影响</span></label>`:""}<div class="dm-actions">${button(physical?"暂不操作":"取消","cancel","secondary")}${physical?button("先同步记录","sync","text-button"):""}${button(labels[kind],"submit","danger-button",physical)}</div></section></div>`;
      emit("device_maintenance_confirmation_opened",{kind,target:d.target});
    }
    function submit() {
      const d=view(), dialog=modalRoot.querySelector(".dm-modal[data-intent]");
      if (!d || !intent || !dialog || dialog.dataset.intent!==intent.nonce || intent.accountRef!==account() || intent.target.id!==d.target.id || intent.target.boundAt!==d.target.boundAt || intent.checkedAt!==d.checkedAt || blocks()) return;
      if (["clear","reset","steps"].includes(intent.kind) && !modalRoot.querySelector("#dm-risk-check")?.checked) return;
      const problem=issue(d,intent.kind); if(problem){intent=null;closeModal();return showIssue(problem)}
      createRequest(d,intent.kind,{at:new Date().toISOString(),accountRef:account(),targetId:d.target.id,kind:intent.kind,scope:"device-maintenance-v1"});
    }
    function query(id) {
      const d=view(),r=d?.request;
      if (!r || r.id!==id || r.status!=="uncertain" || isBusy()) return;
      const problem=issue(d,r.kind==="check"&&r.scope==="account"?"account-check":r.kind,true);if(problem)return showIssue(problem);
      r.mode="query";r.status="pending";r.queryOutcome=queryOutcome;r.readyAt=Date.now()+800;
      emit("device_maintenance_result_requested",r);persist();render();
    }
    function remember(d,r) {
      const item={id:r.id,kind:r.kind,label:labels[r.kind],status:r.status,at:r.completedAt || new Date().toISOString(),targetId:r.target.id,suffix:r.target.suffix};
      const i=d.history.findIndex(h=>h.id===r.id);if(i<0)d.history.unshift(item);else d.history[i]=item;
    }
    function activated(item) {
      const f=state.deviceHub?.accounts?.[account()]?.facts?.[item.id] || {};
      const stamp=f.activatedAt || item.activatedAt;
      if (time(stamp) && (!item.boundAt || Date.parse(stamp)>=Date.parse(item.boundAt))) return true;
      // Old inventory records without a new binding epoch retain the already-active account's compatibility state.
      return state.membershipHardwareState==="active" && !item.boundAt && !initialSync?.()?.needsSetup(item.id);
    }
    function apply(d,r) {
      if(r.applied)return;
      const now=new Date().toISOString();
      if(r.kind==="check") {
        if(r.scope!=="account"){d.checkedAt=now;d.capabilities={...d.capabilities,...Object.fromEntries(["clear","reset","steps"].map(k=>[k,r.capability==="supported"]))};d.records=r.records;}
        if(navigator.onLine!==false){d.accountCheckedAt=now;d.capabilities.unbind=r.capability==="supported";}
      } else if(r.kind==="clear" || r.kind==="reset") {
        d.deviceRecordsClearedAt=now;d.records="saved";
        if(r.kind==="reset")d.settingsResetAt=now;
      } else if(r.kind==="steps") {
        d.deviceStepEpoch={id:r.id,at:now,date:new Date(Date.now()+8*3600000).toISOString().slice(0,10)};
      } else if(r.kind==="remove") d.localRemovedAt=now;
      else if(r.kind==="unbind") {
        delete state.deviceBindings[r.target.id];d.unboundAt=now;
        if(state.deviceBinding?.target?.id===r.target.id)state.deviceBinding=null;
        const remaining=Object.values(state.deviceBindings).filter(x=>x?.accountRef===account());
        const active=remaining.some(activated);
        state.membershipHardwareState=active?"active":"unbound-retained";
        localStorage.setItem("membershipHardwareState",state.membershipHardwareState);
        if(!active&&(state.haloContext==="body"||state.haloSource?.kind==="body")){state.haloContext="none";state.haloSource=null;}
      }
      if(["reset","remove","unbind"].includes(r.kind) && currentId()===r.target.id) {
        state.pairedDevice=null;state.devicePaired=false;state.deviceStatus="disconnected";state.deviceLastSyncedAt="";
      }
      if(r.kind!=="check")d.checkedAt="";
      r.applied=true;
    }
    function finish(ref,id,requestId) {
      const d=root()?.accounts?.[ref]?.devices?.[id],r=d?.request;if(!pending(r)||r.id!==requestId)return;
      if(Date.now()<r.readyAt)return;
      const contextOK=state.signedIn && state.accountDeletionStatus!=="submitted" && ref===account() && sameOwnership(r);
      let problem=contextOK?issue(d,r.kind==="check"&&r.scope==="account"?"account-check":r.kind,true):["账号或设备归属已改变，请用原账号确认结果。"];
      if(!problem && r.mode==="execute" && ["clear","reset","steps"].includes(r.kind) && state.deviceStatus==="low")problem=["电量状态已改变，请充电后确认结果。"];
      if(problem){r.status=r.kind==="check"?"failed":"uncertain";d.note=problem[0]}
      else if(r.mode==="query"?r.queryOutcome==="pending":r.outcome==="uncertain"){r.status="uncertain";d.note="暂未收到最终结果，请先查询，不要重复操作。"}
      else if(r.mode==="query"?r.queryOutcome==="failed":r.outcome==="failed"){r.status="failed";d.note="已确认这次操作未完成，可以重试。"}
      else {apply(d,r);r.status="complete";d.note=r.kind==="check"?"设备状态已检查。":`${labels[r.kind]}已完成。`}
      r.completedAt=new Date().toISOString();remember(d,r);emit("device_maintenance_result",r,{status:r.status});persist();render();
    }
    function resume() {
      clearTimeout(timer);timer=null;
      // Old-account work is suspended rather than applied to a new account; return with that account to query.
      for(const [ref,a] of Object.entries(root()?.accounts || {}))for(const d of Object.values(a?.devices || {})) {
        const r=d?.request;if(pending(r)&&(ref!==account()||!state.signedIn)){r.status=r.kind==="check"?"failed":"uncertain";d.note="请用原账号回来确认这次操作。";persist();}
      }
      const d=all().find(x=>pending(x?.request)),r=d?.request;if(!r)return;
      timer=setTimeout(()=>{timer=null;finish(r.accountRef,r.target.id,r.id)},Math.max(0,r.readyAt-Date.now()));
    }
    function outcomePanel(d) {
      const r=d?.request;if(!r)return d?.note?`<p class="dm-sync-note">${esc(d.note)}</p>`:"";
      if(r.kind==="check"&&r.status==="complete")return r.scope==="account"?`<section class="dm-status" data-status="complete"><h2>${d.capabilities.unbind?"账号绑定已核对":"暂时无法解除绑定"}</h2><p>${d.capabilities.unbind?"已确认这枚戒指属于当前账号。":"暂未确认可解除绑定，请联系支持。"}</p><div class="dm-actions">${d.capabilities.unbind?button("继续解除绑定","confirm:unbind"):button("联系支持","support","secondary")}</div></section>`:"";
      const title=pending(r)?r.mode==="query"?"正在确认操作结果":r.kind==="check"?r.scope==="account"?"正在核对账号绑定":"正在检查设备":"正在处理":r.status==="uncertain"?"还需要确认结果":r.status==="failed"?"这次操作未完成":`${labels[r.kind]}已完成`;
      const copy=pending(r)?"可以稍后回来查看。已发送的操作不会因离开页面而撤销。":d.note;
      const queryButton=r.status==="uncertain"?button("查询本次结果",`query:${r.id}`):"";
      const retryAction=r.kind==="check"&&r.scope==="account"?"account-check":["remove","unbind"].includes(r.kind)?`confirm:${r.kind}`:"check";
      const more=pending(r)?button("稍后查看","home","secondary"):r.status==="complete"&&["reset","remove","unbind"].includes(r.kind)?button("查看我的设备","home","primary"):r.status==="failed"?button(["remove","unbind"].includes(r.kind)?"重试操作":"重新检查",retryAction,"secondary"):"";
      return `<section class="dm-status" data-status="${r.status}" role="status"><h2>${esc(title)}</h2><p>${esc(copy)}</p><div class="dm-actions">${queryButton}${more}${r.status==="uncertain"?button("查看连接","home","secondary"):""}</div></section>`;
    }
    function row(kind,copy,d) {
      const available=["remove","unbind"].includes(kind)||fresh(d.checkedAt)&&d.capabilities?.[kind]===true;
      const description=kind==="unbind"&&!fresh(d.accountCheckedAt)?"先联网核对账号绑定，无需戒指在身边":copy;
      return `<button class="dm-row" type="button" data-action="maintenance:confirm:${kind}" data-danger="${kind!=="remove"}"${blocks()||!available?" disabled":""}>${icon(kind)}<span><strong>${labels[kind]}</strong><small>${esc(available?description:!fresh(d.checkedAt)?"检查设备状态后可查看是否支持":"暂未确认支持")}</small></span><i aria-hidden="true">›</i></button>`;
    }
    function page() {
      const d=view(),header=`<header class="dm-header"><button type="button" data-action="previous" aria-label="返回我的设备">${icon("back")}</button><h1>高级设备操作</h1><span></span></header>`;
      if(!d)return `<section class="device-maintenance">${header}<section class="dm-preflight"><h2>先选择一枚戒指</h2><p>到“我的设备”选择戒指，再查看可用操作。</p>${button("查看我的设备","home")}</section></section>`;
      const r=d.request,belongs=!!owns(d.target.id),connection=belongs&&currentId()===d.target.id&&["connected","low"].includes(state.deviceStatus);
      const problem=issue(d,"check");
      const recordText=d.records==="pending"?"戒指内有尚未同步的记录。建议先同步，再进行清除。":d.records==="saved"?"本次检查未发现待同步记录。清除前仍会再次确认。":"尚不确定是否有未同步记录。建议先同步，避免丢失。";
      const preflight=!unsettled(r)&&belongs?`<section class="dm-preflight"><h2>${fresh(d.checkedAt)?"操作范围已检查":"操作前，先检查"}</h2><p>${esc(problem?problem[0]:fresh(d.checkedAt)?"只处理当前这枚戒指，不影响其他设备。":"读取设备支持的操作与记录状态。")}</p>${problem&&problem[2]!=="check"?button(problem[1],`route:${problem[2]}`,"secondary"):button(fresh(d.checkedAt)?"重新检查":"检查设备状态","check","secondary",isBusy())}</section>`:"";
      const operations=belongs?`<section class="dm-section"><h2>戒指内的数据</h2><p class="dm-sync-note">${icon("info")}<span>${esc(recordText)}</span></p>${button("先同步记录","sync","text-button",blocks())}${row("clear","清除戒指内记录，App 已保存历史保留",d)}${row("reset","清除戒指记录与设置，不解除账号绑定",d)}</section><section class="dm-section"><h2>连接与账号</h2>${row("remove","仅移除本机连接，不清数据、不解绑账号",d)}${row("unbind","只解除这枚戒指与当前账号的绑定",d)}</section><details class="dm-support"><summary>客服协助处理</summary><p>仅在排查步数异常时使用；不用于修正健康历史。</p>${row("steps","只清零戒指端今天的计数",d)}${button("联系支持","support","text-button")}</details>`:"";
      const history=d.history.filter(h=>h&&h.kind!=="check"&&h.targetId===d.target.id).slice(0,5);
      return `<section class="device-maintenance">${header}<section class="dm-identity"><img src="${symbol}" alt="" width="32" height="44"><div><strong>Halo Ring</strong><small>尾号 ${esc(d.target.suffix||"待确认")} · 当前账号</small></div><span class="dm-badge" data-connected="${connection}">${belongs?connection?"已连接":"未连接":"已解除绑定"}</span></section>${outcomePanel(d)}${preflight}${operations}${history.length?`<section class="dm-history"><h2>这枚戒指的最近操作</h2><ol>${history.map(h=>`<li><strong>${esc(h.label)}</strong><span>${{complete:"已完成",failed:"未完成",uncertain:"结果待确认"}[h.status]||"处理中"}</span><small>${fmt(h.at)}</small></li>`).join("")}</ol></section>`:""}</section>`;
    }
    function handle(action) {
      if(["device-reset-complete","device-reset-cancel"].includes(action)||/^(?:danger|confirm-danger):(清空戒指缓存|重置今日步数|恢复出厂设置)(:|$)/.test(action))return true;
      if(!action.startsWith("maintenance:"))return false;
      prepare();
      if(action.startsWith("maintenance:open:")) {
        const id=action.slice(17);if(state.signedIn&&state.accountDeletionStatus!=="submitted"&&(owns(id)||data().devices[id]?.request)){data().selectedId=id;openTarget=id;persist();go("DEV-12")}return true;
      }
      if(state.current!=="DEV-12"||!state.signedIn||state.accountDeletionStatus==="submitted")return true;
      if(action.startsWith("maintenance:review:")) {
        if(!isBusy()){const [,,kind,value]=action.split(":");if(kind==="outcome"&&["success","failed","uncertain"].includes(value))outcome=value;if(kind==="query"&&["success","failed","pending"].includes(value))queryOutcome=value;if(kind==="capability"&&["supported","unsupported","unknown"].includes(value))capability=value;if(kind==="records"&&["unknown","pending","saved"].includes(value))records=value;}render();return true;
      }
      if(action==="maintenance:ack") { const el=modalRoot.querySelector('[data-action="maintenance:submit"]');if(el&&intent)el.disabled=!modalRoot.querySelector("#dm-risk-check")?.checked;return true; }
      if(action==="maintenance:cancel"){intent=null;closeModal();return true}
      if(action==="maintenance:submit"){submit();return true}
      if(action==="maintenance:check"){beginCheck();return true}
      if(action==="maintenance:account-check"){beginCheck("account");return true}
      if(action.startsWith("maintenance:confirm:")){confirm(action.slice(20));return true}
      if(action.startsWith("maintenance:query:")){query(action.slice(18));return true}
      if(action==="maintenance:home"||action==="maintenance:sync"){intent=null;closeModal();go("DEV-10");return true}
      if(action==="maintenance:support"){intent=null;closeModal();go("HELP-03");return true}
      if(action.startsWith("maintenance:route:")){const id=action.slice(18);if(["DEV-01","DEV-02","DEV-03","DEV-05","DEV-10","DEV-11","PERM-01","HLT-03","AUTH-01"].includes(id))go(id);return true}
      return true;
    }
    function resumeEntry() {
      const d=all().find(x=>unsettled(x?.request));
      return d?`<button class="setting-row" data-action="maintenance:open:${esc(d.target.id)}"><div><strong>查看设备操作结果</strong><small>尾号 ${esc(d.target.suffix)} · ${labels[d.request.kind]}</small></div><span>›</span></button>`:"";
    }
    function reviewControls(item) {
      if(item.id!=="DEV-12")return "";
      const group=(key,title,values,current)=>`<div class="review-control-group"><strong>${title}</strong><div>${values.map(([v,t])=>`<button data-action="maintenance:review:${key}:${v}" class="${v===current?"active":""}"${isBusy()?" disabled":""}>${t}</button>`).join("")}</div></div>`;
      return `<section class="review-controls"><p>MAINTENANCE REVIEW</p><h3>设备维护回执模拟</h3><small>仅本地演示，不执行真实清除、计步重置、系统蓝牙移除或账号解绑。检查后以模拟能力回执开放；正式未确认能力默认关闭。约 1.5 秒自动处理，不代表生产时长。最近同步时间不证明全部数据已保存。</small>${group("capability","下一次能力读取",[["supported","模拟支持"],["unsupported","不支持"],["unknown","无法确认"]],capability)}${group("records","下一次未同步记录状态",[["unknown","未知"],["pending","有未同步记录"],["saved","无待同步记录"]],records)}${group("outcome","下一次操作",[["success","成功"],["failed","明确失败"],["uncertain","结果待确认"]],outcome)}${group("query","查询原操作",[["success","已完成"],["failed","未完成"],["pending","仍待确认"]],queryOutcome)}</section>`;
    }
    return {prepare,resume,page,handle,reviewControls,isBusy,unresolved,blocks,canView,resumeEntry};
  };
})();
