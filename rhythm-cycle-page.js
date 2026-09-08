(() => {
  window.createHaloRhythmCyclePage = ({state,screen,modalRoot,store,esc,go,render,closeModal}) => {
    let panel='',focus=null,panelOwner='',pendingId='',message='';
    const date = (value,withYear=false) => value ? `${withYear||value.slice(0,4)!==new Date().toISOString().slice(0,4)?value.slice(0,4)+'年':''}${Number(value.slice(5,7))}月${Number(value.slice(8))}日` : '';
    const action = (label,key,style='',disabled=false) => `<button type="button" class="${style}" data-action="cycle:${key}"${disabled?' disabled':''}>${label}</button>`;
    const status = value => ({ongoing:'还没结束',ended:'已结束',unknown:'结束日未记录'}[value] || '');
    function hero() {
      const v=store.view();
      if(!v.visible)return '';
      const f=v.forecast,ongoing=v.ongoing,recentStart=v.anchor?.status==='unknown'&&v.cycleDay<=Number(state.rhythmSettings?.duration)?v.anchor:null;
      let title,detail,kicker;
      if(ongoing){kicker='经期 · 用户记录';title=`第 ${store.diff(new Date(Date.now()+8*3600000).toISOString().slice(0,10),ongoing.startDate)+1} 天`;detail=`${date(ongoing.startDate)}记录开始，还没有记录结束。`;}
      else if(f){kicker=f.overdue?'预计日期已过':f.days>0?'下一次预计经期':'处于预计日期内';title=`${date(f.start)}—${date(f.end)}`;detail=f.overdue?'还没有新的开始记录，想起来时可以补记。':f.days>0?`距离预计开始还有 ${f.days} 天`:'尚未记录开始，以实际情况为准。';}
      else {kicker=v.predictionOff?'经期预测已关闭':'经期记录';title=v.needsSettings?'补全周期信息':v.anchor?'已记录开始日期':'先记录一次经期';detail=v.needsSettings?'先填写常见周期和持续天数，再查看预计日期。':v.anchor?`${date(v.anchor.startDate)} · 结束日期与感受可随时补充。`:'记下实际开始日期，再查看下次预计经期。';}
      return `<section class="rc-hero"><div class="rc-kicker"><span>${kicker}</span>${v.anchor&&!ongoing?`<span>周期第 ${v.cycleDay} 天</span>`:''}</div><h2 class="${ongoing?'rc-day':''}">${esc(title)}</h2><p>${esc(detail)}</p>${action(v.needsSettings?'补全周期设置':v.hasDraft?'继续未保存的经期记录':ongoing?'记录结束 / 修改':recentStart?'补充这次经期':'记录经期开始',v.needsSettings?'settings':v.hasDraft?'resume':ongoing?`edit:${ongoing.id}`:recentStart?`edit:${recentStart.id}`:'start','primary',!v.canRecord&&!v.needsSettings)}${v.error?`<p class="rc-hero-error" role="alert">${esc(v.error)}</p>`:''}<div class="rc-hero-links">${action('补记与历史','history')}${action('预测设置','settings')}</div>${v.reminder&&f&&f.days>=0&&f.days<=2?`<p class="rc-reminder">经期临近提醒 · 最近可以提前准备所需用品。</p>`:''}</section>`;
    }
    function selected(day) {
      const v=store.view();if(!v.visible)return '';
      const mark=store.mark(day),future=day>new Date(Date.now()+8*3600000).toISOString().slice(0,10),event=mark.event;
      const tags=[mark.actual?'<span class="rc-tag actual">经期日 · 已记录</span>':'',mark.predicted?'<span class="rc-tag predicted">预测经期</span>':'',mark.ovulation?'<span class="rc-tag ovulation">预计排卵日</span>':mark.fertile?'<span class="rc-tag fertile">预计易孕期</span>':''].join('');
      return `<div class="rc-selected"><div class="rc-selected-tags">${tags||'<span class="rc-tag">暂无周期标记</span>'}</div><p>${event?`${date(event.startDate)}开始${event.status==='ended'?` · ${date(event.endDate)}结束`:` · ${status(event.status)}`}`:mark.predicted?'这是预计日期，不代表经期已经开始。':mark.ovulation?'这一天是按周期估算的排卵日，不代表已检测到或确认排卵。':mark.fertile?'这几天是估算的易孕期，实际日期可能提前或推后。':'未标记日期不代表不会怀孕。'}</p>${event&&(mark.ovulation||mark.fertile)?'<p>也落在估算的易孕期内，两种标记不互相排除。</p>':''}${mark.ovulation||mark.fertile?'<p class="rc-estimate-note">仅作周期参考，不能用于避孕。</p>':''}${event?action('修改这次经期',`edit:${event.id}`):!future?action('补记经期',`new:${day}`):''}</div>`;
    }
    function legend(){return `<div class="rc-calendar-legend" aria-label="周期标记说明">${[['period','经期日'],['prediction','预测经期'],['ovulation','预计排卵日'],['fertile','预计易孕期']].map(([type,label])=>action(`<i class="${type}" aria-hidden="true"></i><span>${label}</span>`,`legend:${type}`)).join('')}</div><p class="rc-calendar-note">预测仅供参考，不能用于避孕。</p>`;}
    function footer() {
      const v=store.view(); if(!v.visible)return '';
      return `<details class="rc-explain"><summary>预测日期怎么看？</summary><p>根据你记录的开始日期和常见周期估算，实际日期可能提前或推后。记录实际开始或修改日期后，预测会一起更新。</p><p>经期日来自你的记录；预测经期、排卵日和易孕期都只是估算，不是戒指检测结果，也不能确认是否排卵。</p><p>周期不规律时，或怀孕、哺乳、使用激素避孕期间，不宜依赖这些日期。未标记日期也不代表不会怀孕，不能用来避孕。</p><p>${v.reminder?v.canNotify?'经期临近提醒已开启。':'经期提醒偏好已开启，通知权限尚未开启。':'经期临近提醒未开启，可在设置中调整。'}</p></details>`;
    }
    function modal() {
      const v=store.inspectDraft(),list=store.events();let title='',body='',buttons='';
      if(panel.startsWith('legend:')){
        const descriptions={period:['经期日','你已经记录的实际经期。只有确认过的日期才会显示，不会把预测自动记成实际发生。'],prediction:['预测经期','根据你填写的开始日期、常见周期和持续天数估算。实际日期可能提前或推后。'],ovulation:['预计排卵日','排卵是卵巢释放卵子的过程。这里的日期仅按周期估算，不代表戒指检测到排卵，也不能确认是否已经排卵。'],fertile:['预计易孕期','通常指排卵前几天至排卵当天较容易受孕的一段时间。这里仅按周期估算，范围外不代表不会怀孕。']};
        const detail=descriptions[panel.slice(7)];title=detail[0];body=`<p class="rc-modal-note">${detail[1]}</p>${panel==='legend:period'?'':'<p class="rc-modal-note">预测只能作周期参考，不能用于避孕。周期不规律时，日期可能相差更大。</p>'}`;buttons=action('知道了','close','primary');
      }else if(panel==='history'){
        title='经期记录';body=`<p class="rc-modal-note">这里保存的是你记录的日期，预测日期不会自动存入。</p>${list.length?`<div class="rc-history">${list.slice().reverse().map(e=>action(`<span><strong>${date(e.startDate,true)}${e.status==='ended'?`—${date(e.endDate)}`:''}</strong><small>${status(e.status)}</small></span><i>›</i>`,`edit:${e.id}`)).join('')}</div>`:'<p class="rc-modal-empty">还没有经期记录。</p>'}`;buttons=action(store.view().hasDraft?'继续未保存的记录':'补记一次经期',store.view().hasDraft?'resume':'new','primary')+action('关闭','close','secondary');
      }else if(panel==='delete'){
        title='删除这次经期记录？';body='<p class="rc-modal-note">只删除这次经期日期，感受记录和其他经期不会删除。预计日期会按剩余记录更新。</p>';buttons=action('暂不删除','delete-cancel','secondary')+action('确认删除',`delete-confirm:${pendingId}`,'rc-danger');
      }else if(panel==='discard'){
        title='放弃这次修改？';body='<p class="rc-modal-note">只放弃未保存内容，已经记录的经期不会改变。</p>';buttons=action('继续填写','discard-cancel','secondary')+action('放弃修改','discard-confirm','rc-danger');
      }else{
        title=v.id?'修改经期记录':'记录一次经期';
        const x=v.values,day=new Date(Date.now()+8*3600000).toISOString().slice(0,10);
        body=v.canEdit?`<label class="rc-field">实际开始日期<input type="date" name="startDate" value="${esc(x.startDate||'')}" max="${day}" aria-describedby="rc-start-error"><small id="rc-start-error">${esc(v.errors.startDate||'')}</small></label><fieldset class="rc-state"><legend>这次经期</legend>${[['ongoing','还没结束'],['ended','已结束'],['unknown','结束日不记得']].map(([value,label])=>`<button type="button" data-action="cycle:status:${value}" aria-pressed="${x.status===value}">${label}</button>`).join('')}</fieldset>${x.status==='ended'?`<label class="rc-field">实际结束日期<input type="date" name="endDate" value="${esc(x.endDate||'')}" min="${esc(x.startDate||'')}" max="${day}" aria-describedby="rc-end-error"><small id="rc-end-error">${esc(v.errors.endDate||'')}</small></label>`:''}<p class="rc-modal-note">只记录实际发生的日期。保存后，月历和预计经期会一起更新。</p><p class="rc-form-error" role="alert">${esc(v.errors.overlap||'')}</p>${v.id?action('删除这次经期',`delete:${v.id}`,'rc-delete-link'):''}`:`<p class="rc-modal-note">${esc(v.error)}</p>`;
        buttons=`<button type="button" class="primary" data-action="cycle:save"${v.canSave?'':' disabled'}>保存记录</button>${action('稍后继续','close','secondary')}${action(v.conflict?'放弃草稿，查看最新记录':'放弃未保存的修改','discard','rc-discard')}`;
      }
      modalRoot.innerHTML=`<div class="modal-backdrop"><section class="modal rc-modal" role="dialog" aria-modal="true" aria-labelledby="rc-modal-title"><header><h2 id="rc-modal-title">${title}</h2>${action('×','close','rc-close')}</header><div class="rc-modal-body">${body}</div><footer><p class="rc-modal-error" role="alert">${esc(message||(['edit','new'].includes(panel)?v.error:''))}</p><div class="rc-modal-buttons">${buttons}</div></footer></section></div>`;
      screen.inert=true;document.querySelector('.tabbar')?.setAttribute('inert','');
    }
    function open(kind) {focus=document.activeElement;panelOwner=String(state.authPhone||state.authForm?.phone||'legacy-session');panel=kind;message='';modal();modalRoot.querySelector('input,button')?.focus();}
    function close() {panel='';store.clearIntent();closeModal();if(state.current==='RHY-01')render();if(focus?.isConnected)focus.focus({preventScroll:true});}
    function handle(key) {
      if(!key?.startsWith('cycle:'))return false;
      if(state.current!=='RHY-01'||!store.access()){close();return true;}
      if(key==='cycle:settings'){close();go('RHY-04');return true;}
      if(/^cycle:legend:(period|prediction|ovulation|fertile)$/.test(key)){open(key.slice(6));return true;}
      if(key==='cycle:history'){open('history');return true;}
      if(key==='cycle:close'){close();return true;}
      if(key==='cycle:resume'){open('edit');return true;}
      if(key==='cycle:start'||key==='cycle:new'||key.startsWith('cycle:new:')||key.startsWith('cycle:edit:')){
        const id=key.startsWith('cycle:edit:')?key.slice(11):'',day=key.startsWith('cycle:new:')?key.slice(10):new Date(Date.now()+8*3600000).toISOString().slice(0,10);
        const result=store.begin(day,id);if(!result.ok){message=result.error; if(panel)modal();else render();return true;}open('edit');return true;
      }
      if(!panel||!modalRoot.querySelector('.rc-modal')||panelOwner!==String(state.authPhone||state.authForm?.phone||'legacy-session'))return true;
      if(key.startsWith('cycle:status:')){store.change('status',key.slice(13));message='';modal();return true;}
      if(key==='cycle:discard'){panel='discard';message='';modal();return true;}
      if(key==='cycle:discard-cancel'||key==='cycle:delete-cancel'){panel='edit';store.clearIntent();message='';modal();return true;}
      if(key==='cycle:discard-confirm'){const result=store.discard();if(result.ok){close();render();}else{message=result.error;modal();}return true;}
      if(key.startsWith('cycle:delete:')){pendingId=key.slice(13);const result=store.prepareDelete(pendingId);if(result.ok){panel='delete';message='';}else message=result.error;modal();return true;}
      if(key.startsWith('cycle:delete-confirm:')){const result=store.remove(key.slice(21));if(result.ok){close();render();}else{message=result.error;modal();}return true;}
      if(key==='cycle:save'){const result=store.save();if(result.ok){close();render();const feedback=screen.querySelector('.rh-home-feedback');if(feedback)feedback.innerHTML='<p class="rh-home-message" role="status">经期记录已保存，月历和预计日期已更新。</p>';}else{message=result.error;modal();}return true;}
      return true;
    }
    modalRoot.addEventListener('change',event=>{if(!panel||!event.target.matches('.rc-field input'))return;store.change(event.target.name,event.target.value);message='';modal();});
    new MutationObserver(()=>{if(panel&&!modalRoot.querySelector('.rc-modal')){panel='';store.clearIntent();if(state.current==='RHY-01')render();}}).observe(modalRoot,{childList:true,subtree:true});
    window.addEventListener('beforeunload',event=>{if(store.unsaved()){event.preventDefault();event.returnValue='';}});
    window.addEventListener('popstate',()=>{if(panel)close();});
    function prepare(){if(panel&&(state.current!=='RHY-01'||!store.access()||panelOwner!==String(state.authPhone||state.authForm?.phone||'legacy-session')))close();}
    return {hero,selected,legend,footer,handle,prepare,close};
  };
})();
