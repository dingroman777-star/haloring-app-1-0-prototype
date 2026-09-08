/* Calendar estimates are derived from user records, never device measurements. */
(() => {
  window.createHaloRhythmCycleStore = ({ state, write, today, validDate, hasCycle, settingsChanges }) => {
    const clone = value => JSON.parse(JSON.stringify(value));
    const owner = () => state.signedIn ? String(state.authPhone || state.authForm?.phone || 'legacy-session') : '';
    const raw = () => state.rhythmCycleData?.accounts?.[owner()] || { events: [], draft: null };
    const add = (date, days) => new Date(Date.parse(date + 'T12:00:00Z') + days * 86400000).toISOString().slice(0, 10);
    const diff = (a, b) => Math.round((Date.parse(a + 'T12:00:00Z') - Date.parse(b + 'T12:00:00Z')) / 86400000);
    let issue = '', draftWriteFailed = false, deleteIntent = null, sequence = 0;
    const access = () => owner() && (!state.healthDeletionStatus || state.healthDeletionStatus === 'ready') && (!state.accountDeletionStatus || state.accountDeletionStatus === 'ready');
    const ownsSettings = () => !state.rhythmSettingsEditor?.activeOwner || state.rhythmSettingsEditor.activeOwner === owner();
    const configured = () => ownsSettings() && state.rhythmMode === 'cycle' && !state.rhythmDeleted;
    const validDay = date => typeof date === 'string' && validDate(date) && date <= today();
    const numbersOK = () => { const c=Number(state.rhythmSettings?.cycleLength),d=Number(state.rhythmSettings?.duration); return Number.isInteger(c)&&c>=20&&c<=45&&Number.isInteger(d)&&d>=2&&d<=10; };
    const newRoot = () => { const root=clone(state.rhythmCycleData || { version:1, accounts:{} }); root.accounts ||= {}; return root; };
    const fail = (error, code='validation') => { issue=error; return {ok:false,error,code}; };
    function events() {
      if (!access() || !configured()) return [];
      const records=(Array.isArray(raw().events) ? raw().events : []).filter(e=>e?.ownerAccount===owner());
      // Removing the last event atomically clears the confirmed settings date.
      // A later explicit settings save can establish a new start, even in an initialized account.
      if (!records.length && hasCycle() && validDay(state.rhythmSettings?.startDate)) return [{id:'initial-'+state.rhythmSettings.startDate,ownerAccount:owner(),startDate:state.rhythmSettings.startDate,endDate:'',status:'unknown',revision:state.rhythmSettingsConfirmedAt || 'initial',source:'user-record'}];
      return records.slice().sort((a,b)=>a.startDate.localeCompare(b.startDate));
    }
    function errors(values, list, id='') {
      const result={};
      if (!validDay(values.startDate)) result.startDate='请选择今天或过去的实际开始日期。';
      if (!['ongoing','ended','unknown'].includes(values.status)) result.status='请选择这次经期的状态。';
      if (values.status==='ended' && (!validDay(values.endDate) || values.endDate<values.startDate)) result.endDate='结束日期应在开始日期之后或当天，且不能是未来日期。';
      if (!result.startDate && !result.endDate && !result.status) {
        const end=values.status==='ended'?values.endDate:values.status==='ongoing'?today():values.startDate;
        for(const e of list.filter(e=>e.id!==id)) {
          const otherEnd=e.status==='ended'?e.endDate:e.status==='ongoing'?today():e.startDate;
          if (e.startDate<=end && otherEnd>=values.startDate) result.overlap='与已有经期记录重叠，请先修改那次记录。';
          if (e.status==='ongoing' && values.status==='ongoing') result.overlap='还有一次经期未记录结束，请先补充那次记录。';
        }
      }
      return result;
    }
    function gate() {
      if (!access()) return '当前暂不能修改经期记录，请查看数据与隐私。';
      if (!configured() || !numbersOK()) return '请先在节律设置中开启经期记录并补全周期信息。';
      if (['error','conflict','insufficient'].includes(state.rhythmStatus)) return '请先核对节律设置，已有记录会保留。';
      return '';
    }
    function signature() { return JSON.stringify({owner:owner(),events:events(),settings:state.rhythmSettings,status:state.rhythmStatus,mode:state.rhythmMode,deleted:state.rhythmDeleted}); }
    function commit(book, extra={}) {
      const root=newRoot(); root.accounts[owner()]=book;
      const changes={...extra,rhythmCycleData:root};
      try { if(write(changes)!==true)return false; Object.assign(state,changes); return true; }catch{return false;}
    }
    function view() {
      const list=events(), valid=list.every(e=>e.id && !Object.keys(errors(e,[],e.id)).length), current=list.find(e=>e.status==='ongoing'), anchor=list.at(-1);
      const visible=Boolean(access() && configured() && !['paused','error','conflict','insufficient'].includes(state.rhythmStatus));
      const enabled=visible && valid && numbersOK() && hasCycle() && state.rhythmSettings?.prediction!==false;
      let forecast=null;
      if(enabled && anchor) { const start=add(anchor.startDate,Number(state.rhythmSettings.cycleLength)),end=add(start,Number(state.rhythmSettings.duration)-1); if(!current || today()<start)forecast={start,end,days:diff(start,today()),overdue:today()>end,method:'calendar-estimate'}; }
      // Illustrative calendar estimates only, not a validated Halo ovulation model.
      // Never persist these dates as actual events or roll them into a later cycle.
      const ovulation=forecast&&!forecast.overdue&&!current?add(forecast.start,-14):null;
      const fertility=ovulation?{ovulation,start:add(ovulation,-5),end:ovulation,method:'calendar-estimate',confirmed:false}:null;
      const draft=raw().draft?.owner===owner()?raw().draft:null;
      return {visible,enabled,events:valid?list:[],anchor:valid?anchor:null,ongoing:valid?current:null,forecast,fertility,cycleDay:anchor?diff(today(),anchor.startDate)+1:null,
        canRecord:!gate()&&valid,hasDraft:!!draft,error:!valid?'记录日期需要核对，暂不显示预测。':issue,paused:state.rhythmStatus==='paused',predictionOff:state.rhythmSettings?.prediction===false,
        reminder:state.rhythmSettings?.periodNotice===true,canNotify:!!state.toggles?.notification,needsSettings:!configured()||!numbersOK(),deleted:state.rhythmDeleted===true};
    }
    function mark(date) {
      const v=view(); if(!v.visible)return {actual:false,predicted:false};
      const actual=v.events.find(e=>date>=e.startDate && date<=(e.status==='ended'?e.endDate:e.status==='ongoing'?today():e.startDate));
      return {actual:!!actual,event:actual||null,predicted:!actual&&!!v.forecast&&date>=v.forecast.start&&date<=v.forecast.end,
        ovulation:!!v.fertility&&date===v.fertility.ovulation,fertile:!!v.fertility&&date>=v.fertility.start&&date<=v.fertility.end};
    }
    function begin(date=today(), id='') {
      const error=gate(); if(error)return fail(error,'unavailable');
      if(state.current!=='RHY-01')return fail('请回到节律首页记录。');
      const existing=events().find(e=>e.id===id);
      if(id&&!existing)return fail('这次记录已变化，请重新选择。');
      if(!id&&!validDay(date))return fail('未来日期只能查看预测，不能记录为已经发生。');
      if(raw().draft)return {ok:true,resume:true};
      const values=existing?{startDate:existing.startDate,endDate:existing.endDate||'',status:existing.status}:{startDate:date,endDate:'',status:date===today()?'ongoing':'unknown'};
      const draft={owner:owner(),id:existing?.id||'',base:signature(),values};
      if(!commit({...raw(),draft}))return fail('暂时无法打开记录，请重试。','storage');
      issue='';draftWriteFailed=false;deleteIntent=null;return {ok:true};
    }
    function inspectDraft() {
      const draft=raw().draft?.owner===owner()?raw().draft:null, error=gate();
      if(!draft||error)return {canEdit:false,canSave:false,error:error||'请重新打开经期记录。',values:{},errors:{}};
      const conflict=draft.base!==signature(),problems=errors(draft.values,events(),draft.id);
      return {canEdit:true,canSave:!conflict&&!Object.keys(problems).length,id:draft.id,values:clone(draft.values),errors:problems,conflict,error:conflict?'记录或设置已更新。草稿仍保留，请查看最新记录后重填。':issue,draftWriteFailed};
    }
    function change(key,value) {
      const draft=raw().draft, v=inspectDraft(); if(!v.canEdit||!['startDate','endDate','status'].includes(key))return fail(v.error||'无法修改这项内容。');
      const book=clone(raw());book.draft={...draft,values:{...draft.values,[key]:String(value)}};
      if(key==='status'&&value!=='ended')book.draft.values.endDate='';
      if(!commit(book)) { const root=newRoot();root.accounts[owner()]=book;state.rhythmCycleData=root;draftWriteFailed=true;return fail('草稿暂未保存，请不要关闭页面；可重试保存。','storage'); }
      issue='';draftWriteFailed=false;return {ok:true};
    }
    function save() {
      if(state.current!=='RHY-01')return fail('请回到节律首页保存。');
      const v=inspectDraft();if(!v.canSave)return fail(v.error||Object.values(v.errors)[0]||'请检查填写的日期。');
      const values={...v.values,endDate:v.values.status==='ended'?v.values.endDate:''},list=events();
      const entry={...(list.find(e=>e.id===v.id)||{}),...values,id:v.id||`period-${Date.now()}-${++sequence}`,ownerAccount:owner(),source:'user-record',revision:new Date().toISOString()};
      const next=[...list.filter(e=>e.id!==entry.id),entry].sort((a,b)=>a.startDate.localeCompare(b.startDate));
      const extra=settingsChanges(next.at(-1).startDate);
      if(!extra)return fail('当前账号的设置已变化，请重新打开记录。');
      if(!commit({events:next,draft:null,initialized:true},extra))return fail('记录暂未保存，原记录和预测没有改变。可以重试。','storage');
      issue='';draftWriteFailed=false;deleteIntent=null;return {ok:true,id:entry.id};
    }
    function discard() {
      if(!access())return fail('当前账号暂不可操作。');
      if(!commit({...raw(),draft:null}))return fail('暂时无法放弃草稿，请重试。','storage');
      issue='';draftWriteFailed=false;return {ok:true};
    }
    function prepareDelete(id) {
      if(gate()||state.current!=='RHY-01')return fail(gate()||'请回到节律首页。');
      if(!events().some(e=>e.id===id))return fail('记录已不存在。');
      deleteIntent={id,owner:owner(),base:signature()};return {ok:true};
    }
    function remove(id) {
      if(gate()||state.current!=='RHY-01')return fail(gate()||'请回到节律首页。');
      if(!deleteIntent||deleteIntent.id!==id||deleteIntent.owner!==owner()||deleteIntent.base!==signature()) {deleteIntent=null;return fail('记录已变化，请重新核对后再删除。');}
      const next=events().filter(e=>e.id!==id),extra=settingsChanges(next.at(-1)?.startDate||'');
      if(!extra||!commit({events:next,draft:null,initialized:true},extra))return fail('暂时没能删除，原记录和预测仍然保留。请重试。','storage');
      issue='';deleteIntent=null;draftWriteFailed=false;return {ok:true};
    }
    function deletionChanges() {const root=newRoot();delete root.accounts[owner()];return {rhythmCycleData:root};}
    return {view,mark,begin,change,save,discard,inspectDraft,prepareDelete,remove,events,add,diff,access,deletionChanges,
      hasEvents:()=>!!raw().events?.length,deleteSnapshot:()=>JSON.stringify(raw()),hasStoredData:()=>!!raw().events?.length||!!raw().draft,
      clearIntent:()=>{deleteIntent=null;},unsaved:()=>draftWriteFailed&&raw().draft?.owner===owner(),resetIssue:()=>{issue='';}};
  };
})();
