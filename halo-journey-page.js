/* HAL-06: explicit, account-scoped local plans; completion is a user's own report. */
(() => {
  window.createHaloJourney = function ({state,screen,modalRoot,esc,go,write,checkSaved,closeModal,track,themes,day}) {
    const titles={boundary:'睡前放下工作',pause:'白天短暂停顿'};
    const labels={ready:'尚未开始',active:'进行中',paused:'已暂停',deferred:'暂时放下',ended:'已结束',completed:'本轮已完成',deleted:'记录已删除'};
    const clone=x=>JSON.parse(JSON.stringify(x)),object=x=>x&&typeof x==='object'&&!Array.isArray(x);
    const account=()=>String(state.authPhone||''),root=()=>state.haloJourneyStore,profile=()=>root()?.accounts?.[account()];
    const current=()=>profile()?.records?.[state.journeyTheme],theme=()=>state.journeyTheme;
    const fresh=(status='ready')=>({id:crypto.randomUUID(),days:[],entries:[],note:'',previous:[],status,variant:0,missCount:0,reason:''});
    let mounted=false,commerceBaseline=null,noteDraft=null,intent=null,entryFrom='',feedbackText='',failed=false;
    const commerce=()=>{try{return localStorage.getItem('haloV5CommercialProgress');}catch{return 'unreadable';}};
    function normalize(r){const j={...fresh(),...(object(r)?r:{})};j.days=[...new Set(Array.isArray(j.days)?j.days:[])];j.entries=Array.isArray(j.entries)?j.entries:[];j.previous=Array.isArray(j.previous)?j.previous:[];j.note=String(j.note||'');j.variant=Math.max(0,Math.min(2,Number(j.variant)||0));if(!labels[j.status])j.status='ready';if(j.status==='active'&&!j.startedAt&&!j.days.length&&!j.entries.length&&!j.note&&!j.previous.length&&!j.variant&&!j.reason)j.status='ready';return j;}
    function aliases(j){return {journeyProgress:j.days.length,journeyPaused:j.status==='paused',journeyDecision:j.status==='deferred'?'deferred':j.status==='ended'?'unsuitable':'active',journeyVariant:j.variant||0,journeyReason:j.reason||'',journeyMissCount:j.missCount||0};}
    function prepare(){
      if(!state.signedIn||!state.authVerified||state.accountDeletionStatus==='submitted')return;
      if(!object(root())||root().version!==1)state.haloJourneyStore={version:1,ownerAccount:state.dataPrivacy?.ownerAccount||account(),accounts:{}};
      if(!object(root().accounts))root().accounts={};
      if(!object(profile()))root().accounts[account()]={selected:root().ownerAccount===account()&&titles[state.journeyTheme]?state.journeyTheme:'boundary',returnRoute:'HAL-01',records:Object.fromEntries(Object.keys(titles).map(k=>[k,root().ownerAccount===account()?normalize(state.journeyRecords[k]):fresh()]))};
      const p=profile();
      if(!p.records)p.records={};
      for(const key of Object.keys(titles))if(!object(p.records[key]))p.records[key]=fresh();
      if(!titles[p.selected])p.selected='boundary';
      state.journeyTheme=p.selected;state.journeyRecords=p.records;Object.assign(state,aliases(current()));
      if(entryFrom&&state.current==='HAL-06'){p.returnRoute=entryFrom==='HAL-08'?'HAL-08':'HAL-01';entryFrom='';}
    }
    function feedback(text,error=false){feedbackText=text;failed=error;const n=modalRoot.querySelector('.hj-modal-feedback')||screen.querySelector('.hj-feedback');if(n){n.textContent=text;n.setAttribute('role',error?'alert':'status');n.dataset.error=String(error);if(error)n.scrollIntoView({block:'nearest'});}}
    function safe(show=true){if(!mounted||state.current!=='HAL-06')return false;const error=checkSaved()||(commerce()!==commerceBaseline?'其他页面的记录已更新。请刷新后继续，最新进度会保留。':'');if(error&&show)feedback(error,true);return !error;}
    function commit(records,selected=theme()){
      if(!safe())return false;
      const next=clone(root());next.accounts[account()]={...profile(),records,selected};const j=records[selected];
      if(!write({haloJourneyStore:next,journeyRecords:records,journeyTheme:selected,...aliases(j)})){feedback('这次没能保存，原进度没有改变。请重试，暂时不要刷新页面。',true);return false;}return true;
    }
    function patch(changes){const records=clone(profile().records);records[theme()]={...records[theme()],...changes};return commit(records);}
    const todayDone=()=>current().days.includes(day());
    const step=()=>themes[theme()][current().variant||0];
    const btn=(label,action,style='secondary',disabled=false)=>`<button type="button" class="${style}" data-action="plan:${action}"${disabled?' disabled':''}>${label}</button>`;
    function savedHistory(j){
      const runs=[...j.previous,...(j.days.length||j.note||['ended','completed'].includes(j.status)?[j]:[])];
      return `<details class="hj-history"><summary>完成记录与历史 <span>${runs.reduce((n,r)=>n+(r.days?.length||0),0)} 天　›</span></summary>${runs.length?runs.map((r,i)=>`<section class="hj-run"><h3>第 ${i+1} 轮 · ${labels[r.status]||'已保留'}</h3>${r.entries?.length?r.entries.map(e=>`<article><time>${esc(e.day)}</time><strong>${esc(e.action||'已记录完成')}</strong>${e.note?`<p>用户记录 · ${esc(e.note)}</p>`:''}</article>`).join(''):`<p>${esc(r.days?.join('、')||'本轮尚无完成记录')}</p>`}${r.note?`<p class="hj-run-note">本轮感受 · ${esc(r.note)}</p>`:''}</section>`).join(''):'<p>完成后，这里会留下日期、做法和你的感受。</p>'}</details>`;
    }
    function page(){
      const j=current(),s=step(),done=todayDone(),canDo=j.status==='active'&&!done;
      const summary={ready:'选一个小计划，按自己的节奏来。',active:done?'今天已经记下了，明天再继续。':'不用连续打卡，做过的每一天都会保留。',paused:'进度和感受都保留着，想继续时再回来。',deferred:'进度还在，想继续时再开始。',ended:'本轮记录仍在，想再试时可以开始新一轮。',completed:'已经完成 7 天，可以回看这一路的记录。',deleted:'这个主题已清空，另一个主题不受影响。'}[j.status];
      const primary=j.status==='ready'?btn('开始这个计划','start','primary'):j.status==='paused'||j.status==='deferred'?btn('继续这个计划','resume','primary'):['ended','completed','deleted'].includes(j.status)?btn('开始新一轮','restart','primary'):btn(done?'今天已记下':'记下今天已完成','done','primary',done);
      return `<section class="hj-page"><header class="hj-header"><button type="button" data-action="plan:back" aria-label="返回上一页">‹</button><h1>我的小计划</h1>${btn('更多','manage','hj-more')}</header><div class="hj-scroll"><div class="hj-themes" role="group" aria-label="选择计划">${Object.entries(titles).map(([key,title])=>`<button type="button" aria-pressed="${key===theme()}" data-action="plan:theme:${key}">${title}</button>`).join('')}</div><section class="hj-plan"><div class="hj-status"><span>${labels[j.status]}</span><span><strong>${j.days.length}</strong> / 7 天</span></div><div class="hj-dots" role="img" aria-label="本轮已完成${j.days.length}天，共7天">${Array.from({length:7},(_,i)=>`<span class="${i<j.days.length?'done':''}">${i<j.days.length?'✓':i+1}</span>`).join('')}</div><p class="hj-summary">${summary}</p></section>${j.status!=='deleted'?`<section class="hj-task"><div class="hj-task-top"><span>${done?'今天做过的练习':['ended','completed'].includes(j.status)?'本轮练习':'这次做什么'}</span><span>${esc(s.detail.split(' · ')[0])}</span></div><h2>${esc(done?j.entries.find(e=>e.day===day())?.action||s.title:s.title)}</h2>${!done?`<p>${esc(s.action)}</p>`:''}${canDo?btn(j.variant>=2?'已经是最轻的做法':'换个更轻的做法','lighter','hj-text',j.variant>=2):''}</section>`:''}${['active','paused','deferred'].includes(j.status)?`<details class="hj-note"><summary>写点感受 <span>选填 · 用户记录</span></summary><label for="journey-note" class="sr-only">本轮感受</label><textarea id="journey-note" rows="3" placeholder="想记下什么，就写一点。">${esc(noteDraft??j.note)}</textarea><p>完成时，会一起记下当时的感受。</p></details>`:''}<p class="hj-feedback" role="${failed?'alert':'status'}" data-error="${failed}">${esc(feedbackText)}</p>${savedHistory(j)}</div><footer class="hj-actions"><p>${canDo?'做完后再记下，不用补打卡。':'进度按实际完成日期保留，不要求连续。'}</p>${primary}${canDo?btn('今天先不做','defer','hj-text'):''}</footer></section>`;
    }
    function redraw(text=''){feedbackText=text;failed=false;const noteOpen=screen.querySelector('.hj-note')?.open,historyOpen=screen.querySelector('.hj-history')?.open;screen.innerHTML=page();if(noteOpen&&screen.querySelector('.hj-note'))screen.querySelector('.hj-note').open=true;if(historyOpen)screen.querySelector('.hj-history').open=true;}
    function saveNote(){if(noteDraft===null||noteDraft===current().note)return true;if(!patch({note:noteDraft}))return false;noteDraft=null;return true;}
    function input(value){if(!safe())return;noteDraft=value;if(saveNote())feedback('感受已保留为用户记录。');}
    function close(){intent=null;closeModal();}
    function modal(title,body,buttons){modalRoot.innerHTML=`<div class="modal-backdrop"><section class="modal hj-modal" role="dialog" aria-modal="true" aria-labelledby="hj-modal-title"><h2 id="hj-modal-title">${title}</h2>${body}<p class="hj-modal-feedback" role="status"></p><div class="hj-modal-actions">${buttons}</div></section></div>`;}
    function manage(){if(!saveNote())return;intent=null;const j=current();modal(titles[theme()],'<p>只管理当前主题，不影响另一个计划。</p>',btn('返回计划','cancel','primary')+(['active','deferred'].includes(j.status)?btn('暂停计划','pause'):'')+(!['ready','ended','completed','deleted'].includes(j.status)?btn('结束并保留记录','end'):'')+(!['ready','deleted'].includes(j.status)?btn('重新开始一轮','restart'):'')+(j.status!=='deleted'?btn('删除这个主题的全部记录','delete','hj-danger'):''));}
    function confirm(kind){
      if(!saveNote())return;const j=current();if(kind==='end'&&!['active','paused','deferred'].includes(j.status))return;
      if(kind==='delete'&&j.status==='deleted')return;
      if(kind==='restart'&&['ready','deleted'].includes(j.status)){start();return;}
      intent={kind,theme:theme(),id:j.id,token:crypto.randomUUID(),base:JSON.stringify(j)};
      const content={end:['结束这个计划？','本轮完成日期、感受和历史都会保留。以后可以开始新一轮。','结束并保留记录'],restart:['开始新一轮？','当前这轮会收入历史，新一轮从 0 / 7 天开始。','保留历史，开始新一轮'],delete:[`删除“${titles[theme()]}”的全部记录？`,'将清空本主题的进度、感受和全部历史，无法恢复。另一个主题、聊天与身体数据会保留。','删除全部记录']}[kind];
      modal(content[0],`<p>${content[1]}</p>`,btn('取消，保留原样','cancel','primary')+btn(content[2],`confirm:${intent.token}`,kind==='delete'?'hj-danger':'secondary'));
    }
    function execute(token){
      if(!intent||intent.token!==token||intent.theme!==theme()||!modalRoot.querySelector(`[data-action="plan:confirm:${token}"]`)||!safe())return;
      if(intent.id!==current().id||intent.base!==JSON.stringify(current()))return feedback('计划已变化，请取消后重新核对。',true);
      const kind=intent.kind,j=current();
      if(kind==='end'){if(!patch({status:'ended',endedAt:new Date().toISOString()}))return;}
      if(kind==='delete'){if(!patch(fresh('deleted')))return;noteDraft=null;}
      if(kind==='restart'){const old=clone(j);delete old.previous;old.status=j.status==='completed'?'completed':'ended';old.endedAt=old.endedAt||new Date().toISOString();if(!patch({...fresh('active'),startedAt:new Date().toISOString(),previous:[...j.previous,old]}))return;noteDraft=null;}
      close();redraw(kind==='delete'?'这个主题的记录已删除。':kind==='end'?'本轮已结束，记录已保留。':'新一轮已开始，上一轮已收入历史。');track('halo_journey_'+kind,{source_page:'HAL-06',theme:theme(),prototype_only:true});
    }
    function start(){if(!['ready','deleted'].includes(current().status)||!safe())return;if(!patch({...fresh('active'),startedAt:new Date().toISOString(),previous:current().previous}))return;close();redraw('计划已开始。做完后，再记下今天这一步。');}
    function done(){
      if(current().status!=='active'||todayDone()||current().days.length>=7||!saveNote())return;
      const j=current(),days=[...j.days,day()],entry={day:day(),action:step().action,note:j.note,source:'user-record'};
      if(!patch({days,entries:[...j.entries,entry],status:days.length>=7?'completed':'active',missCount:0,...(days.length>=7?{endedAt:new Date().toISOString()}:{})}))return;
      redraw(days.length>=7?'这一轮完成了，7 天记录都已保留。':'今天已记下，不需要重复完成。');track('halo_journey_step_completed',{progress:days.length,theme:theme(),source_page:'HAL-06',prototype_only:true});
    }
    function handle(action){
      if(typeof action!=='string')return false;
      // Retired confirm actions cannot bypass this page's live, theme-bound confirmation.
      if(action.startsWith('journey-'))return true;
      if(state.current==='HAL-06'&&action==='previous')action='plan:back';
      if(!action.startsWith('plan:'))return false;
      if(state.current!=='HAL-06'||!safe())return true;
      const type=action.slice(5),j=current();
      if(type==='cancel'){close();return true;}
      if(type==='back')go(profile().returnRoute==='HAL-08'?'HAL-08':'HAL-01',false);
      if(type.startsWith('theme:')){const key=type.slice(6);if(titles[key]&&saveNote()&&commit(clone(profile().records),key)){noteDraft=null;intent=null;redraw();}}
      if(type==='manage')manage();
      if(type==='start')start();
      if(type==='done')done();
      if(type==='lighter'&&['active','deferred'].includes(j.status)&&!todayDone()&&j.variant<2&&saveNote()&&patch({variant:j.variant+1,status:'active'}))redraw('已换成更轻的做法。');
      if(type==='defer'&&j.status==='active'&&!todayDone()&&saveNote()&&patch({status:'deferred',reason:'今天先不做。',deferredOn:day()}))redraw('今天先放下，进度没有减少。');
      if(type==='pause'&&['active','deferred'].includes(j.status)&&saveNote()&&patch({status:'paused'})){close();redraw('计划已暂停，进度保留。');}
      if(type==='resume'&&['paused','deferred'].includes(j.status)&&saveNote()&&patch({status:'active'}))redraw('已继续，从原进度接着来。');
      if(['end','restart','delete'].includes(type))confirm(type);
      if(type.startsWith('confirm:'))execute(type.slice(8));
      return true;
    }
    function enter(target,from){if(target==='HAL-06'&&from!=='HAL-06')entryFrom=from;}
    function afterRender(){if(state.current!=='HAL-06'){mounted=false;noteDraft=null;intent=null;feedbackText='';failed=false;return;}if(!mounted){mounted=true;commerceBaseline=commerce();}}
    function canLeave(){return safe()&&saveNote();}
    return {prepare,page,input,handle,enter,afterRender,canLeave,blocksPersist:()=>state.current==='HAL-06'&&mounted&&!safe(false)};
  };
})();
