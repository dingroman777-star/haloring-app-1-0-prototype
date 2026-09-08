/* HAL-04: shared reminder preferences; no notification delivery is simulated as real. */
(() => {
  window.createHaloProactive = function ({state,screen,modalRoot,esc,go,write,checkSaved,closeModal,track}) {
    const keys = ['proactive','morningPrompt','nightPrompt'];
    const clone = x => JSON.parse(JSON.stringify(x));
    const entry = () => state.sleepNotifications?.accounts?.[state.authPhone];
    const valid = t => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(t));
    const period = q => valid(q?.start) && valid(q?.end) && q.start !== q.end ? `${q.start} — ${q.end < q.start ? '次日 ' : ''}${q.end}` : '时间待完善';
    let mounted=false,commerceBaseline=null,editing=null,closing=false,message='',failed=false;
    const commerce = () => { try {return localStorage.getItem('haloV5CommercialProgress');} catch {return 'unreadable';} };
    function feedback(text,error=false) {
      message=text; failed=error;
      const n=modalRoot.querySelector('.hp-editor-feedback') || screen.querySelector('.hp-feedback');
      if(n){n.textContent=text;n.setAttribute('role',error?'alert':'status');n.dataset.status=error?'failed':'saved';}
    }
    function safe(show=true) {
      if(!mounted || state.current!=='HAL-04')return false;
      const error=checkSaved() || (commerce()!==commerceBaseline?'其他页面的记录已更新。请刷新后继续，最新设置会保留。':'');
      if(error&&show)feedback(error,true);
      return !error;
    }
    function commit(changes) {
      if(!safe())return false;
      if(!write(changes)){feedback('这次没有保存成功，原设置不变。请重试；暂时不要刷新页面。',true);return false;}
      return true;
    }
    function rootWith(patch) {const root=clone(state.sleepNotifications);Object.assign(root.accounts[state.authPhone],patch);return root;}
    function switchRow(key,title,note) {
      const disabled=key!=='proactive'&&!state.toggles.proactive;
      return `<div class="ns-toggle${disabled?' hp-inactive':''}"><div><strong id="hp-label-${key}">${title}</strong><p id="hp-note-${key}">${note}</p></div><button type="button" class="ns-switch" role="switch" aria-labelledby="hp-label-${key}" aria-describedby="hp-note-${key}" aria-checked="${!!state.toggles[key]}" data-action="proactive:toggle:${key}"${disabled?' disabled':''}><span></span></button></div>`;
    }
    function page() {
      const on=!!state.toggles.proactive,permission=!!state.toggles.notification,q=state.haloQuietHours;
      return `<section class="hp-page notification-settings-page"><header class="ns-header"><button type="button" data-action="proactive:back" aria-label="返回上一页">‹</button><h1>主动陪伴</h1><span></span></header><p class="hp-intro">需要时提醒，休息时不打扰。</p><section class="ns-notification-status"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9a6 6 0 0 1 12 0v6l2 3H4l2-3V9m4 12h4"/></svg><div><strong>通知权限 · ${permission?'已允许':'未允许'}</strong><small>${permission?'接收哪些提醒，由你选择':'偏好仍会保留，暂时不会发出通知'}</small></div><button type="button" data-action="proactive:permissions">${permission?'查看':'去设置'}</button></section><p class="hp-feedback ns-feedback" role="${failed?'alert':'status'}" data-status="${failed?'failed':'saved'}">${esc(message)}</p><section class="ns-section hp-options">${switchRow('proactive','允许主动提醒',on?'可以分别选择早晨和睡前提醒':'开启后可选早晨、睡前；关闭保留原选择')}${switchRow('morningPrompt','早晨状态提示','有可用的身体状态时提醒')}${switchRow('nightPrompt','睡前轻提醒','给睡前放松留一点时间')}${on&&!state.toggles.morningPrompt&&!state.toggles.nightPrompt?'<p class="ns-hint">还没有选择提醒，暂时不会主动打扰你。</p>':''}</section><section class="hp-quiet"><button type="button" class="hp-quiet-button" data-action="proactive:quiet"><span><small>静默时段</small><strong>${esc(period(q))}</strong></span><span class="hp-adjust">${entry()?.quietDraft?'继续修改':'调整'} ›</span></button><p>${entry()?.quietDraft?'有未保存的修改，当前时段保持不变。':'这段时间不发送 Halo 主动提醒。'}</p></section><details class="hp-boundary"><summary>哪些提醒不受影响？</summary><p>Halo 闹钟、设备和报告提醒分别设置。这里不会改变它们，也不会修改身体数据。</p><button type="button" data-action="proactive:all-settings">查看通知与夜间设置</button><p>当前为本机交互原型，不发送真实通知。正式提醒以系统通知权限和服务状态为准。</p></details></section>`;
    }
    function redraw(text='') {message=text;failed=false;const action=document.activeElement?.dataset.action;screen.innerHTML=page();if(action)screen.querySelector(`[data-action="${action}"]`)?.focus({preventScroll:true});}
    function toggle(key) {
      if(!keys.includes(key)||key!=='proactive'&&!state.toggles.proactive)return;
      const value=!state.toggles[key],preferences={...entry().preferences,[key]:value};
      if(!commit({toggles:{...state.toggles,[key]:value},sleepNotifications:rootWith({preferences})}))return;
      redraw(!state.toggles.proactive?'主动提醒已关闭，原选择仍保留。':!state.toggles.notification?'偏好已保存；允许通知后才会发出提醒。':'提醒偏好已保存。');
      track('notification_preference_saved',{setting:key,enabled:value,source_page:'HAL-04',prototype_only:true});
    }
    function errors(q) {return !valid(q.start)||!valid(q.end)?'请填写完整的开始和结束时间。':q.start===q.end?'开始和结束时间不能相同。':'';}
    function updateEditor() {
      if(!editing)return;
      const error=errors(editing.values),n=modalRoot.querySelector('.hp-editor-validation');
      if(n)n.textContent=error || `${period(editing.values)} 不发送主动提醒。`;
      for(const key of ['start','end'])modalRoot.querySelector(`#hp-quiet-${key}`)?.setAttribute('aria-invalid',String(!valid(editing.values[key])||editing.values.start===editing.values.end));
      const button=modalRoot.querySelector('[data-action="proactive:save"]');
      if(button)button.disabled=!!error||JSON.stringify(editing.values)===JSON.stringify(state.haloQuietHours);
    }
    function edit() {
      if(!safe())return;
      const draft=entry().quietDraft;
      editing=clone(draft || {values:state.haloQuietHours,base:state.haloQuietHours});
      modalRoot.innerHTML=`<div class="modal-backdrop"><section class="modal ns-modal hp-editor" role="dialog" aria-modal="true" aria-labelledby="hp-editor-title"><header class="ns-modal-header"><h2 id="hp-editor-title">静默时段</h2><button type="button" data-action="proactive:later">稍后再改</button></header><p>选择一段不接收 Halo 主动提醒的时间。</p><div class="ns-fields-grid">${[['start','开始'],['end','结束']].map(([k,label])=>`<label class="ns-field">${label}<input id="hp-quiet-${k}" type="time" value="${esc(editing.values[k])}" aria-describedby="hp-quiet-validation"></label>`).join('')}</div><p id="hp-quiet-validation" class="hp-editor-validation ns-window-preview" role="status"></p><p class="hp-editor-feedback ns-feedback" role="status">${draft?'已恢复未保存的修改。':'保存后才会更新，闹钟不受影响。'}</p><div class="ns-actions"><button type="button" class="primary" data-action="proactive:save">保存时段</button><button type="button" class="text-button" data-action="proactive:discard">取消修改</button></div></section></div>`;
      updateEditor();
      modalRoot.querySelector('#hp-quiet-start')?.focus();
    }
    function saveDraft() {
      if(!editing)return true;
      if(JSON.stringify(editing)===JSON.stringify(entry().quietDraft))return true;
      if(!entry().quietDraft&&JSON.stringify(editing.values)===JSON.stringify(state.haloQuietHours))return true;
      return commit({sleepNotifications:rootWith({quietDraft:clone(editing)})});
    }
    function input(target) {
      if(!editing||!['hp-quiet-start','hp-quiet-end'].includes(target.id))return;
      editing.values[target.id.endsWith('start')?'start':'end']=target.value;updateEditor();
      if(saveDraft())feedback('修改已暂存，保存后才更新静默时段。');
    }
    function dismiss(text) {closing=true;closeModal();closing=false;editing=null;redraw(text);screen.querySelector('[data-action="proactive:quiet"]')?.focus({preventScroll:true});}
    function save() {
      if(!editing||!modalRoot.querySelector('.hp-editor')||!safe())return;
      if(errors(editing.values))return updateEditor();
      if(JSON.stringify(editing.base)!==JSON.stringify(state.haloQuietHours))return feedback('当前时段已变化，请取消旧修改后重新调整。',true);
      const quiet=clone(editing.values);
      if(!commit({haloQuietHours:quiet,sleepNotifications:rootWith({quietHours:quiet,quietDraft:null})}))return;
      dismiss('静默时段已保存。');track('halo_quiet_hours_saved',{source_page:'HAL-04',prototype_only:true});
    }
    function beforeClose() {
      if(closing||!modalRoot.querySelector('.hp-editor'))return true;
      if(!saveDraft())return false;
      editing=null;requestAnimationFrame(()=>{if(state.current==='HAL-04')redraw(entry()?.quietDraft?'修改已保留，稍后可继续。':'');});return true;
    }
    function canLeave() {return safe()&&saveDraft();}
    function afterRender() {if(state.current!=='HAL-04'){mounted=false;editing=null;message='';failed=false;return;}if(!mounted){mounted=true;commerceBaseline=commerce();}}
    function handle(action) {
      if(state.current==='HAL-04'&&action==='previous')action='proactive:back';
      if(state.current==='HAL-04'&&action.startsWith('toggle:')&&keys.includes(action.slice(7)))action=`proactive:${action}`;
      if(!action.startsWith('proactive:'))return false;
      if(state.current!=='HAL-04'||!safe())return true;
      const type=action.slice(10);
      if(type.startsWith('toggle:'))toggle(type.slice(7));
      if(type==='quiet')edit();
      if(type==='save')save();
      if(type==='later')closeModal();
      if(type==='discard'&&editing&&commit({sleepNotifications:rootWith({quietDraft:null})}))dismiss('已取消修改，原时段不变。');
      if(type==='permissions'&&commit({sleepNotifications:rootWith({permissionReturn:'HAL-04'})}))go('PERM-01');
      if(type==='all-settings')go('SET-02');
      if(type==='back')go(entry()?.detailReturn==='HAL-04'?'SET-02':'HAL-08',false);
      return true;
    }
    modalRoot.addEventListener('input',e=>input(e.target));
    modalRoot.addEventListener('change',e=>input(e.target));
    return {page,handle,afterRender,canLeave,beforeClose,blocksPersist:()=>state.current==='HAL-04'&&mounted&&!safe(false)};
  };
})();
