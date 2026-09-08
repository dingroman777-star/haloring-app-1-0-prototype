/* HAL-07: preferences, current reference, and explicit local-only content deletion. */
(() => {
  window.createHaloPrivacyPage = function ({state,screen,modalRoot,esc,go,write,checkSaved,closeModal,track,source,newBody,available}) {
    const clone=x=>JSON.parse(JSON.stringify(x));
    const account=()=>String(state.authPhone||''),owned=()=>state.haloAccountScope?.activeOwner===account();
    let mounted=false,baseline=null,intent=null,origin='',message='',error=false;
    const commerce=()=>{try{return localStorage.getItem('haloV5CommercialProgress');}catch{return 'unreadable';}};
    const view=()=>state.haloPrivacyView;
    const locked=()=>['paused','archived'].includes(state.conversationStatus);
    const current=()=>owned()?source():null;
    const btn=(label,action,style='hp-link',disabled=false)=>`<button type="button" class="${style}" data-action="hprivacy:${action}"${action==='back'?' aria-label="返回上一页"':''}${disabled?' disabled':''}>${label}</button>`;
    function prepare(){
      if(!state.signedIn||!state.authVerified)return;
      if(!view()||view().account!==account())state.haloPrivacyView={account:account(),returnRoute:'HAL-08',childRoute:'',lastLocalClear:null};
      if(state.current!=='HAL-07'&&view().childRoute&&state.current!==view().childRoute)view().childRoute='';
      if(state.current==='HAL-07'&&origin){if(['HAL-01','HAL-08'].includes(origin))view().returnRoute=origin;origin='';view().childRoute='';}
    }
    function feedback(text,failed=false){message=text;error=failed;const n=modalRoot.querySelector('.hp-error')||screen.querySelector('.hp-feedback');if(n){n.textContent=text;n.setAttribute('role',failed?'alert':'status');n.dataset.error=String(failed);if(failed)n.scrollIntoView({block:'nearest'});}}
    function safe(show=true){if(!mounted||state.current!=='HAL-07')return false;const e=checkSaved()||(commerce()!==baseline?'其他页面的记录已更新，请刷新后继续。':'');if(e&&show)feedback(e,true);return !e;}
    function commit(changes){if(!safe())return false;if(!write(changes)){feedback('这次没能保存，原设置和记录没有改变。请重试。',true);return false;}return true;}
    function referenceChanges(value){return {haloSource:value,haloContext:value?.kind||'none',...(!locked()?{conversations:state.conversations.map(c=>c.id===state.activeConversationId?{...c,source:clone(value),context:value?.kind||'none'}:c)}:{})};}
    const copy={haloBody:['参考今天的身体状态','关闭后，不再把身体状态带入对话。'],memory:['参考已确认的记忆','关闭只暂停使用，保存的记忆仍保留。']};
    function switchRow(key){return `<div class="hp-switch-row"><div><strong id="hp-${key}">${copy[key][0]}</strong><p>${copy[key][1]}</p></div><button type="button" class="hp-switch" role="switch" aria-checked="${Boolean(state.toggles[key])}" aria-labelledby="hp-${key}" data-action="hprivacy:toggle:${key}"><span></span></button></div>`;}
    function page(){const s=current(),canBody=owned()&&available()&&state.toggles.haloBody&&!locked();
      const notice=!owned()?'当前账号的数据归属尚未核对，暂不展示其他账号的内容。':!available()?'暂时没有可参考的身体数据，仍可以正常聊天。':!state.toggles.haloBody?'身体参考已关闭。开启后，可选择带入本次对话。':locked()?'这次对话已暂停或归档，继续对话后再调整参考。':'偏好与本次参考分开管理，不会替换你主动带入的记录。';
      return `<section class="hp-page"><header class="hp-header">${btn('‹','back','hp-back')}<h1>Halo 数据与隐私</h1><span></span></header><section class="hp-source"><div class="hp-eyebrow"><span aria-hidden="true">◎</span> 本次对话参考</div><h2>${esc(s?.label||'没有带入额外内容')}</h2>${s?`<details class="hp-source-detail"><summary>查看参考内容</summary><p>${esc(s.text)}</p></details>`:'<p>不带参考，也可以和 Halo 聊聊。</p>'}<div class="hp-source-actions">${s?btn('移除本次参考','remove','hp-link',locked()):''}${canBody&&s?.kind!=='body'?btn(s?'改用今天的身体状态':'参考今天的身体状态','body'):''}</div><p class="hp-source-note">${notice}</p></section><p class="hp-feedback" role="${error?'alert':'status'}" data-error="${error}">${esc(message)}</p><section class="hp-section"><h2>参考偏好</h2>${switchRow('haloBody')}${switchRow('memory')}${btn('查看与管理记忆　›','route:HAL-03','hp-row')}</section><section class="hp-section"><h2>数据管理</h2>${btn('查看聊天记录　›','route:HAL-02','hp-row')}<details class="hp-storage"><summary>数据保存与清空说明</summary><p>当前原型保存在本机浏览器，尚未接入云端同步或删除服务。</p><p>清空范围：聊天及未发送草稿、记忆及修改草稿、Halo 感受记录及草稿。小计划、身体解读反馈、戒指健康记录、订单和会员资产都保留。</p>${state.haloDataDeletionStatus==='submitted'?'<p>旧版显示的“已提交”不是云端回执，不能据此确认云端已删除。</p>':''}</details>${view()?.lastLocalClear?'<p class="hp-clear-status">上次本机清空已完成；之后新增的内容可再次管理。</p>':''}${btn('清空聊天、记忆与感受','delete','hp-danger',!owned())}</section></section>`;
    }
    function redraw(text=''){const focusAction=document.activeElement?.dataset.action;message=text;error=false;screen.innerHTML=page();if(focusAction)screen.querySelector(`[data-action="${focusAction}"]`)?.focus({preventScroll:true});}
    function modal(title,body,action,label){modalRoot.innerHTML=`<div class="modal-backdrop"><section class="modal hp-modal" role="dialog" aria-modal="true" aria-labelledby="hp-modal-title"><h2 id="hp-modal-title">${title}</h2>${body}<p class="hp-error" role="alert"></p><div class="hp-modal-actions">${btn('取消，保留原样','cancel','primary')}${btn(label,action,'hp-danger')}</div></section></div>`;}
    function dismiss(){intent=null;closeModal();}
    function request(kind){if(!safe()||!owned())return;if(kind==='body'&&(!available()||!state.toggles.haloBody||locked()))return;intent={kind,token:crypto.randomUUID(),account:account()};
      if(kind==='body')modal('替换本次参考？',`<p>将“${esc(current()?.label||'当前参考')}”换为今天的身体状态。原记录与已发送的聊天不会删除。</p>`,`confirm:${intent.token}`,'替换本次参考');
      else modal('清空这三类内容？','<ul><li>聊天记录和未发送草稿</li><li>记忆和修改草稿</li><li>Halo 感受记录和草稿</li></ul><p>只清空本机原型中的上述内容，无法恢复，不会发送云端删除申请。</p><p>小计划、身体解读反馈、戒指健康记录、订单与会员资产都保留。</p>',`confirm:${intent.token}`,'清空本机内容');
    }
    function changeBody(){if(!safe()||!owned()||!available()||!state.toggles.haloBody||locked())return;const b=newBody();if(!b)return feedback('暂时没有可参考的身体数据。',true);if(commit(referenceChanges(b))){dismiss();redraw('已带入今天的身体状态，尚未发送消息。');}}
    function clear(token){if(!intent||intent.token!==token||intent.account!==account()||!modalRoot.querySelector(`[data-action="hprivacy:confirm:${token}"]`)||!safe()||!owned())return;
      if(intent.kind==='body')return changeBody();
      const belongs=r=>String(r?.ownerAccount||r?.accountRef||state.dataPrivacy.ownerAccount)===account();
      const editor=clone(state.haloFeelingEditor);if(editor?.accounts)delete editor.accounts[account()];
      const changes={conversations:[],haloMemories:[],haloMemoryDrafts:{},haloFeelingRecords:state.haloFeelingRecords.filter(r=>!belongs(r)),haloFeelingEditor:editor,chat:[],haloDraft:'',haloSource:null,haloContext:'none',activeConversationId:'',conversationStatus:'new',haloFeeling:'',haloFeelingNote:'',haloMemoryCleared:true,haloDataDeletionStatus:'local-cleared',haloPrivacyView:{...view(),lastLocalClear:new Date().toISOString()}};
      if(!commit(changes))return;dismiss();redraw('本机聊天、记忆与感受已清空，其他记录没有改变。');track('halo_local_content_cleared',{source_page:'HAL-07',prototype_only:true});
    }
    function handle(action){if(typeof action!=='string')return false;
      if(view()?.account===account()&&view()?.childRoute===state.current&&(['memory:back','history:back','previous'].includes(action))){go('HAL-07');return true;}
      if(action==='confirm-danger:删除 Halo 数据')return true;
      if(action.startsWith('danger:删除 Halo 数据')){if(state.current==='HAL-07')request('delete');return true;}
      const legacy={'toggle:haloBody':'hprivacy:toggle:haloBody','toggle:memory':'hprivacy:toggle:memory','halo-remove-source':'hprivacy:remove','restore-halo-context':'hprivacy:body','previous':'hprivacy:back'};
      if(state.current==='HAL-07'&&legacy[action])action=legacy[action];
      if(!action.startsWith('hprivacy:'))return false;
      if(action==='hprivacy:cancel'){dismiss();return true;}
      if(!safe())return true;const type=action.slice(9);
      if(type==='back')go(view().returnRoute==='HAL-01'?'HAL-01':'HAL-08',false);
      if(type.startsWith('route:')){const route=type.slice(6);if(['HAL-02','HAL-03'].includes(route)&&commit({haloPrivacyView:{...view(),childRoute:route}}))go(route);}
      if(type.startsWith('toggle:')){const key=type.slice(7);if(!copy[key])return true;const enabled=!state.toggles[key],changes={toggles:{...state.toggles,[key]:enabled}};if(key==='haloBody'&&!enabled&&state.haloSource?.kind==='body')Object.assign(changes,referenceChanges(null));if(commit(changes)){redraw(enabled?'参考偏好已开启。':'参考偏好已关闭，原记录仍保留。');track('halo_reference_preference_changed',{key,enabled,source_page:'HAL-07',prototype_only:true});}}
      if(type==='remove'&&current()&&!locked()&&commit(referenceChanges(null)))redraw('已移除本次参考，原记录仍然保留。');
      if(type==='body'){if(current())request('body');else changeBody();}
      if(type==='delete')request('delete');
      if(type.startsWith('confirm:'))clear(type.slice(8));
      return true;
    }
    function enter(target,from){if(target==='HAL-07'&&from!=='HAL-07')origin=from;}
    function afterRender(){if(state.current!=='HAL-07'){mounted=false;intent=null;message='';error=false;return;}if(!mounted){mounted=true;baseline=commerce();}screen.querySelector('.hp-back')?.setAttribute('aria-label','返回上一页');}
    return {prepare,page,handle,enter,afterRender,canLeave:()=>safe(),blocksPersist:()=>state.current==='HAL-07'&&mounted&&!safe(false)};
  };
})();
