(() => {
  "use strict";
  window.createHaloStudioCode = function ({state, events, read, go, render, select, esc, icon, screen}) {
    const account = p => String(p.authPhone || p.authForm?.phone || "local-demo");
    const key = () => `haloStudioCodeLookup:${account(state)}`;
    const normalize = s => String(s || "").trim().toUpperCase();
    let data = {draft:"",status:"idle"}, raw = null, owner = "", fresh = true, message = "", unsaved = false, timer = null;
    const valid = p => p && p.signedIn && p.authVerified && p.accountDeletionStatus !== "submitted" && account(p) === account(state);
    function prepare() {
      if (state.current !== "STU-01") return true;
      const p = read()?.progress;
      fresh = Boolean(valid(p));
      if (!fresh) return false;
      try {
        const stored = localStorage.getItem(key());
        if (owner !== account(state)) {data={draft:"",status:"idle"};raw=null;unsaved=false;owner=account(state);}
        if (!unsaved && stored !== raw) {
          const next = stored ? JSON.parse(stored) : {draft:"",status:"idle"};
          if (!next || typeof next.draft !== "string" || !["idle","querying","found","missing"].includes(next.status)) throw Error("invalid");
          data = next;raw=stored;
        }
      } catch {fresh=false;}
      resume();return fresh;
    }
    function save(next) {
      if (!valid(read()?.progress)) {fresh=false;message="登录状态有变化，请返回后重新打开。";return false;}
      try {
        if (localStorage.getItem(key()) !== raw) {message="体验码已在其他窗口更新，请重新读取后再试。";return false;}
        const text=JSON.stringify(next);localStorage.setItem(key(),text);raw=text;data=next;unsaved=false;return true;
      } catch {message="暂时无法保存，输入仍在本页。请重试。";return false;}
    }
    function updateControls() {
      const host=screen.querySelector('.studio-code');if(!host)return;
      host.querySelector('#stucode-feedback').textContent=message;
      const button=host.querySelector('[data-action="stucode-find"]');
      if(button)button.disabled=!fresh||!normalize(data.draft)||data.status==="querying";
      if(data.status!=="found"){
        const next=host.querySelector('.studio-detail-footer [data-action="stucode-open"]');
        if(next){next.dataset.action="stucode-history";next.className="secondary";next.textContent="查看我的预约";}
      }
    }
    function input(value) {
      if(state.current!=="STU-01"||data.status==="querying")return;
      message="";const next={draft:String(value).slice(0,100),status:"idle"};
      if(!save(next)){data=next;unsaved=true;}updateControls();
      // Invalidate any result without replacing the focused input.
      screen.querySelector('.studio-code-result')?.remove();
    }
    function resume() {
      if(timer||!fresh||unsaved||data.status!=="querying"||state.current!=="STU-01")return;
      const request=data.requestId;
      timer=setTimeout(()=>{if(state.current!=="STU-01"){timer=null;return;}
        if(!prepare()||data.requestId!==request||data.status!=="querying"){timer=null;return;}
        timer=null;
        const found=normalize(data.draft)==="HALO-STUDIO-2026";
        if(navigator.onLine===false){save({...data,status:"idle"});message="当前离线，联网后再试。体验码已保留。";}
        else if(!save({...data,status:found?"found":"missing",eventId:found?"yoga-evening":null})){
          message="结果暂未保存，请重试。体验码仍然保留。";data={...data,status:"idle"};unsaved=true;
        }else message=found?"已找到活动，下一步核对信息。":"没有找到这个体验码，请检查后重试，或向活动现场工作人员确认。";
        render();
      },650);
    }
    function receipt() {
      if(!valid(read()?.progress))return null;
      try {const r=JSON.parse(localStorage.getItem(key()));return r?.status==="found"&&normalize(r.draft)==="HALO-STUDIO-2026"&&r.eventId==="yoga-evening"&&Object.hasOwn(events,r.eventId)?r:null;}catch{return null;}
    }
    function page() {
      const querying=data.status==="querying", e=fresh&&data.status==="found"?events[data.eventId]:null;
      return `<article class="studio-code studio-detail" aria-busy="${querying}"><div class="studio-detail-scroll" tabindex="0" aria-label="查找Studio活动"><header class="studio-detail-header"><button type="button" data-action="stucode-back" aria-label="返回Halo Studio">${icon("back")}</button><h1>找到本次体验</h1><button type="button" data-action="stucode-help">客服</button></header><div class="studio-code-symbol">${icon("scan")}</div><h2>输入活动体验码</h2><p class="studio-code-intro">使用现场或预约信息中的体验码，找到对应活动。</p>
        ${fresh?`<form id="studio-code-form"><label for="studio-lookup-input">体验码</label><input id="studio-lookup-input" value="${esc(data.draft)}" maxlength="100" placeholder="请输入体验码" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-describedby="stucode-feedback" ${querying?"disabled":""}><button type="submit" class="primary" data-action="stucode-find" ${!normalize(data.draft)||querying?"disabled":""}>${querying?"正在查找…":"查找活动"}</button></form><button type="button" class="studio-code-scan secondary" data-action="stucode-scan">${icon("scan")}扫码查找</button>
        ${e?`<section class="studio-code-result" aria-label="找到的活动"><span>找到活动</span><h3>${esc(e.title)}</h3><p>${esc(e.date)} · ${esc(e.place)}</p></section>`:""}<details class="studio-code-info"><summary>在哪里找体验码？</summary><p>查看你的预约信息，或向活动现场工作人员询问。没有体验码，也可以先查看已保存的预约。</p><button type="button" class="secondary" data-action="stucode-history">查看我的预约</button></details>`
        :`<section class="studio-code-empty"><h3>暂时无法读取体验码</h3><p>没有创建预约或修改已有记录。</p><button class="secondary" data-action="stucode-reload">重新读取</button></section>`}
        </div><footer class="studio-detail-footer"><p id="stucode-feedback" class="studio-code-feedback" role="status">${esc(message||(!fresh?"请重新读取后再试。":data.status==="missing"?"没有找到这个体验码，请检查后重试。":""))}</p>${unsaved?'<button class="secondary" data-action="stucode-save">重试保存输入</button><button class="secondary" data-action="stucode-leave-unsaved">暂不保存，返回Studio</button>':""}${e ? '<button type="button" class="primary" data-action="stucode-open">核对活动信息</button>' : '<button type="button" class="secondary" data-action="stucode-history">查看我的预约</button>'}</footer></article>`;
    }
    function handle(action) {
      const legacy={"studio-code-confirm":"stucode-find","studio-scan-open":"stucode-scan","studio-scan-close":"stucode-reload","studio-scan-result":"stucode-review-sample"};
      if(legacy[action]) action=legacy[action];
      if(!action.startsWith("stucode-"))return false;
      if(state.current!=="STU-01")return true;
      if(action==="stucode-review-sample"){if(data.status!=="querying"){input("HALO-STUDIO-2026");render();}return true;}
      if(action==="stucode-save"){if(save({...data,status:"idle"})){message="输入已保存。";}render();return true;}
      if(action==="stucode-leave-unsaved"){go("STU-08");return true;}
      if(action==="stucode-reload"){unsaved=false;raw=undefined;prepare();render();return true;}
      if(action==="stucode-scan"){message="此预览暂不支持调用相机，可输入体验码继续。";updateControls();screen.querySelector('#studio-lookup-input')?.focus();return true;}
      if(action==="stucode-find"){
        if(!fresh||!normalize(data.draft)||data.status==="querying")return true;
        if(navigator.onLine===false){message="当前离线，联网后再试。体验码已保留。";updateControls();return true;}
        const next={draft:normalize(data.draft),status:"querying",requestId:crypto.randomUUID()};
        message="";if(save(next))resume();render();return true;
      }
      if(action==="stucode-open") {const r=receipt();if(!r||normalize(r.draft)!==normalize(data.draft)){message="体验码有更新，请重新查找。";render();return true;}select(r.eventId);go("STU-02");return true;}
      const targets={"stucode-back":"STU-08","stucode-help":"HELP-03","stucode-history":"STU-07"};
      if(targets[action]){if(unsaved){message="输入尚未保存，请先重试保存。";render();}else go(targets[action]);}return true;
    }
    screen.addEventListener('input',e=>{if(e.target.id==='studio-lookup-input'&&!e.isComposing)input(e.target.value);});
    screen.addEventListener('click',e=>{if(e.target.closest('[data-action="stucode-find"]'))e.preventDefault();},true);
    screen.addEventListener('compositionend',e=>{if(e.target.id==='studio-lookup-input')input(e.target.value);});
    screen.addEventListener('submit',e=>{if(e.target.id==='studio-code-form'){e.preventDefault();handle('stucode-find');}});
    window.addEventListener('storage',e=>{if(state.current==='STU-01'&&(e.key===key()||e.key==='haloV5AppProgress')){prepare();render();}});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&state.current==='STU-01'){prepare();render();}});
    const reviewControls=item=>item.id==="STU-01"?'<section class="review-controls"><h3>体验码 · 本地演示</h3><small>未接相机或后台验码。只查找示例活动，不代表机构预约已核验。示例码：HALO-STUDIO-2026。</small><button data-action="stucode-review-sample" class="secondary">填入示例体验码</button></section>':"";
    return {prepare,page,handle,receipt,reviewControls,blocksPersist:()=>state.current==="STU-01"||!fresh};
  };
})();
