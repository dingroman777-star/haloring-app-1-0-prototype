/* HAL-05: account-scoped drafts and explicit user records, never device measurements. */
(() => {
  window.createHaloFeeling = function ({state,screen,esc,go,write,checkSaved,track}) {
    const words=['平静','疲惫','紧张','低落','有力量'];
    const clone=x=>JSON.parse(JSON.stringify(x));
    const account=()=>String(state.authPhone||'');
    const root=()=>state.haloFeelingEditor;
    const entry=()=>root()?.accounts?.[account()];
    const allowed=()=>state.signedIn&&state.authVerified&&state.accountDeletionStatus!=='submitted';
    const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
    const own=r=>r&&(!r.ownerAccount&&!r.accountRef?root()?.ownerAccount===account():(r.ownerAccount||r.accountRef)===account());
    const records=()=>state.haloFeelingRecords.filter(own);
    const newDraft=()=>({feeling:'',note:'',draftId:crypto.randomUUID(),savedId:'',returnRoute:'HAL-01'});
    const date=t=>Number.isFinite(Date.parse(t))?new Date(t).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}):'原记录未保存时间';
    let mounted=false,commerceBaseline=null,draft=null,dirty=false,message='',failed=false,entryFrom='';
    const commerce=()=>{try{return localStorage.getItem('haloV5CommercialProgress');}catch{return 'unreadable';}};
    function prepare() {
      if(state.current!=='HAL-05'||!allowed())return;
      if(!object(root())||root().version!==1)state.haloFeelingEditor={version:1,ownerAccount:state.dataPrivacy?.ownerAccount||account(),accounts:{}};
      if(!object(root().accounts))root().accounts={};
      if(!object(entry())) {
        const initial=newDraft(),legacy=root().ownerAccount===account();
        if(legacy){initial.feeling=words.includes(state.haloFeeling)?state.haloFeeling:'';initial.note=String(state.haloFeelingNote||'');
          const text=[initial.feeling,initial.note.trim()].filter(Boolean).join(' · ');
          if(records().some(r=>r.text===text)){initial.feeling='';initial.note='';}
        }
        root().accounts[account()]=initial;
      }
      if(!mounted){if(entryFrom){entry().returnRoute=entryFrom==='HAL-08'?'HAL-08':'HAL-01';entryFrom='';}draft={...newDraft(),...entry()};}
    }
    function feedback(text,error=false){message=text;failed=error;const node=screen.querySelector('.hf-feedback');if(node){node.textContent=text;node.setAttribute('role',error?'alert':'status');node.dataset.error=String(error);}}
    function safe(show=true){if(state.current!=='HAL-05'||!mounted)return false;const error=checkSaved()||(commerce()!==commerceBaseline?'其他页面的记录已更新。请刷新后继续，最新记录会保留。':'');if(error&&show)feedback(error,true);return !error;}
    function commit(changes){if(!safe())return false;if(!write(changes)){feedback('这次没有保存成功，内容仍在这里。请重试，暂时不要刷新或关闭页面。',true);return false;}return true;}
    function withDraft(next){const r=clone(root());r.accounts[account()]=clone(next);return r;}
    function saveDraft(){if(!draft||!dirty)return true;if(!commit({haloFeelingEditor:withDraft(draft)}))return false;dirty=false;return true;}
    function valid(){return words.includes(draft?.feeling)||Boolean(String(draft?.note||'').trim());}
    function icon(index) {
      // Visual metaphors only; the saved values remain the user's original feeling words.
      const weather = [
        '<g class="hf-weather-sun"><path d="M12 3v2M4 11H2m3-7 1.5 1.5M19 4l-1.5 1.5"/><circle cx="12" cy="11" r="5"/></g><path class="hf-weather-cloud" d="M10 25a4.5 4.5 0 0 1-.5-9 6.5 6.5 0 0 1 12.5 1H24a4 4 0 0 1 0 8Z"/>',
        '<path d="M10 13a5.5 5.5 0 0 1 10.5-2H23a4 4 0 0 1 3 6" opacity=".6"/><path class="hf-weather-cloud" d="M7 26a5 5 0 0 1-.5-10 6.5 6.5 0 0 1 12.5 1H21a4.5 4.5 0 0 1 0 9Z"/>',
        '<path d="M3 12h16a4 4 0 1 0-4-4M3 17h23a3 3 0 1 0-3-3M7 22h10a3 3 0 1 1-3 3"/>',
        '<path class="hf-weather-cloud" d="M7 19a4.5 4.5 0 0 1 0-9 6.5 6.5 0 0 1 12.5 0H23a4.5 4.5 0 0 1 0 9Z"/><path class="hf-weather-rain" d="m10 24-1 3m8-3-1 3m8-3-1 3"/>',
        '<g class="hf-weather-sun"><circle cx="16" cy="16" r="6"/><path d="M16 2v4m0 20v4M2 16h4m20 0h4M6 6l3 3m14 14 3 3M26 6l-3 3M9 23l-3 3"/></g>'
      ];
      return `<svg class="hf-weather hf-weather-${index}" viewBox="0 0 32 32" aria-hidden="true" focusable="false">${weather[index]}</svg>`;
    }
    function history(){const list=records().slice().reverse();return `<details class="hf-history"><summary>已保存记录 <span>${list.length}　›</span></summary>${list.length?list.map(r=>`<article class="hf-record"><div><span>用户记录</span><time>${esc(date(r.occurredAt))}</time></div><p>${esc(r.text||r.label||'原记录没有正文')}</p><button type="button" data-action="feeling:use:${esc(encodeURIComponent(r.id))}">和 Halo 聊这条 <span aria-hidden="true">↗</span></button></article>`).join(''):'<p class="hf-empty">还没有保存的感受。想记的时候，再写下来。</p>'}</details>`;}
    function page(){return `<section class="hf-page"><header class="hf-header"><button type="button" data-action="feeling:back" aria-label="返回上一页">‹</button><h1>记录此刻感受</h1><span>用户记录</span></header><div class="hf-scroll"><p class="hf-intro">此刻，你感觉怎么样？</p><p class="hf-instruction">选一个词，或直接写下来。</p><div class="hf-options" role="group" aria-label="选择一个感受，可不选">${words.map((w,i)=>`<button type="button" aria-pressed="${draft.feeling===w}" data-action="feeling:choose:${w}">${icon(i)}<span>${w}</span></button>`).join('')}</div><label class="hf-label" for="halo-feeling-note">想记下什么？<span>选填</span></label><textarea id="halo-feeling-note" rows="4" placeholder="比如：忙了一天，想安静一会儿。">${esc(draft.note)}</textarea><p class="hf-save-note">这是你的感受，不是戒指测量结果。</p><p class="hf-feedback" role="${failed?'alert':'status'}" data-error="${failed}">${esc(message)}</p>${draft.savedId?`<section class="hf-saved"><span aria-hidden="true">✓</span><div><strong>感受已保存</strong><p>随时可以在下方回看。</p></div><button type="button" data-action="feeling:use:${esc(encodeURIComponent(draft.savedId))}">和 Halo 聊聊</button></section>`:''}${history()}</div><footer class="hf-actions"><p class="hf-action-hint">${valid()?'带入对话后，由你决定是否发送消息。':'选一个感受或写点内容，就可以保存。'}</p><button type="button" class="primary" data-action="feeling:save-chat"${valid()?'':' disabled'}>保存并和 Halo 聊聊</button><button type="button" class="hf-save-only" data-action="feeling:save-only"${valid()?'':' disabled'}>仅保存记录</button></footer></section>`;}
    function redraw(){const open=screen.querySelector('.hf-history')?.open,top=screen.querySelector('.hf-scroll')?.scrollTop||0;screen.innerHTML=page();const history=screen.querySelector('.hf-history');if(history)history.open=!!open;screen.querySelector('.hf-scroll').scrollTop=top;}
    function update(){if(!draft.savedId)screen.querySelector('.hf-saved')?.remove();screen.querySelectorAll('.hf-options button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.action===`feeling:choose:${draft.feeling}`)));screen.querySelectorAll('.hf-actions button').forEach(b=>b.disabled=!valid());const hint=screen.querySelector('.hf-action-hint');if(hint)hint.textContent=valid()?'带入对话后，由你决定是否发送消息。':'选一个感受或写点内容，就可以保存。';}
    function input(value){if(!safe())return;draft.note=value;draft.savedId='';dirty=true;update();if(saveDraft())feedback('草稿已保留，尚未加入记录。');}
    function sourceChanges(record){
      const source={kind:'feeling',label:'用户记录',text:record.text,recordId:record.id,occurredAt:record.occurredAt,capturedAt:new Date().toISOString(),ownerAccount:account()};
      const locked=['paused','archived'].includes(state.conversationStatus),conversations=clone(state.conversations);
      if(!locked){const c=conversations.find(c=>c.id===state.activeConversationId&&c.status!=='deleted');if(c){c.source=source;c.context='feeling';}}
      return {haloSource:source,haloContext:'feeling',haloToolsOpen:false,conversations,...(locked?{activeConversationId:'',chat:[],haloDraft:'',conversationStatus:'new'}:{})};
    }
    function save(chat){
      if(!safe()||!valid())return;
      // A stable draft ID makes repeated clicks/retries unable to create a second record.
      const id=`feeling-${draft.draftId}`,text=[draft.feeling,draft.note.trim()].filter(Boolean).join(' · ');
      const existing=records().find(r=>r.id===id),record=existing||{id,label:draft.feeling,note:draft.note.trim(),text,occurredAt:new Date().toISOString(),source:'user-record',ownerAccount:account()};
      const next={...newDraft(),returnRoute:draft.returnRoute,savedId:id};
      const changes={haloFeelingRecords:existing?state.haloFeelingRecords:[...state.haloFeelingRecords,record],haloFeelingEditor:withDraft(next),haloFeelingNote:'',haloFeeling:'',...(chat?sourceChanges(record):{})};
      if(!commit(changes))return;
      draft=next;dirty=false;feedback(chat?'已保存并带入对话，尚未发送消息。':'已保存为用户记录。');
      track('halo_user_record_saved',{source:'user-record',source_page:'HAL-05',record_id:id,with_chat:chat,prototype_only:true});
      if(chat)go('HAL-01');else {redraw();const card=screen.querySelector('.hf-saved');if(card){card.tabIndex=-1;card.focus({preventScroll:true});card.scrollIntoView({block:'nearest'});}}
    }
    function use(id){if(!safe())return;const record=records().find(r=>r.id===id);if(!record){feedback('这条记录已不存在，请刷新后查看。',true);return;}if(!saveDraft()||!commit(sourceChanges(record)))return;track('halo_user_record_referenced',{source_page:'HAL-05',record_id:id,prototype_only:true});go('HAL-01');}
    function enter(target,from){if(target==='HAL-05'&&from!=='HAL-05')entryFrom=from;}
    function canLeave(){return safe()&&saveDraft();}
    function afterRender(){if(state.current!=='HAL-05'){mounted=false;draft=null;dirty=false;message='';failed=false;return;}if(!mounted){mounted=true;commerceBaseline=commerce();}}
    function handle(action){
      if(typeof action!=='string'||!action)return false;
      if(state.current==='HAL-05'&&action==='previous')action='feeling:back';
      if(action==='save-halo-feeling')action='feeling:save-chat';
      if(action.startsWith('halo-feeling:'))action=`feeling:choose:${action.slice(13)}`;
      if(!action.startsWith('feeling:'))return false;
      if(state.current!=='HAL-05'||!safe())return true;
      const type=action.slice(8);
      if(type==='back')go(draft.returnRoute==='HAL-08'?'HAL-08':'HAL-01',false);
      if(type.startsWith('choose:')){const word=type.slice(7);if(words.includes(word)){draft.feeling=draft.feeling===word?'':word;draft.savedId='';dirty=true;update();if(saveDraft())feedback('草稿已保留，尚未加入记录。');}}
      if(type==='save-only')save(false);if(type==='save-chat')save(true);
      if(type.startsWith('use:')){try{use(decodeURIComponent(type.slice(4)));}catch{feedback('无法打开这条记录，请刷新后重试。',true);}}
      return true;
    }
    return {prepare,page,input,handle,enter,afterRender,canLeave,blocksPersist:()=>state.current==='HAL-05'&&mounted&&!safe(false)};
  };
})();
