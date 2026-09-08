/* NIG-06 / NIG-08: local wake-setting and alarm preview. No OS alarm or sleep-stage execution. */
(() => {
  "use strict";
  window.createHaloNightWake = function ({state, active, screen, esc, go, render, write, track}) {
    const keys = ["enabled", "time", "window", "sound", "snoozeMinutes"];
    const sounds = ["晨雾", "微光", "清泉", "柔和铃音"];
    const validTime = value => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(value));
    const copy = value => JSON.parse(JSON.stringify(value));
    const dirty = () => keys.some(key => state.wakeDraft?.[key] !== state.wakeSettings?.[key]);
    let feedback = "", failed = false, draftFailed = false, lastAccount = "";
    let alarmError = "", alarmAccount = "";
    let cancelIntent = "";
    const validSnooze = value => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 15;
    const account = () => String(state.authPhone || state.authForm?.phone || "");
    const permitted = () => state.signedIn && state.authVerified && state.accountDeletionStatus !== "submitted" && active();
    const icon = name => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + ({back:"m15 5-7 7 7 7",arrow:"m9 5 7 7-7 7",sound:"M4 10v4h4l5 4V6l-5 4H4m12-2a7 7 0 0 1 0 8m3-11a11 11 0 0 1 0 14"})[name] + '"/></svg>';
    const button = (label, action, cls = "nw-text", disabled = false) => '<button type="button" class="'+cls+'" data-action="'+action+'"'+(disabled?' disabled':'')+'>'+label+'</button>';
    function header() { return '<header class="nw-header">'+button(icon("back"),"night-wake:back","nw-back").replace('<button ', '<button aria-label="返回上一页" ')+'<h1>唤醒设置</h1><span></span></header>'; }
    function check(draft) {
      if (!draft?.enabled) return "";
      if (!validTime(draft.time)) return "请选择最晚唤醒时间";
      if (!["0","20","30"].includes(String(draft.window))) return "请选择唤醒方式";
      if (!sounds.includes(draft.sound)) return "请重新选择唤醒声音";
      if (!validSnooze(draft.snoozeMinutes)) return "请选择1–15分钟的稍后提醒时长";
      return "";
    }
    function preview() {
      const d = state.wakeDraft;
      if (!d.enabled) return '<p class="nw-window-off">'+(dirty()?'保存后关闭唤醒，时间与声音会保留。':'唤醒已关闭，时间与声音已保留。')+'</p>';
      if (!validTime(d.time)||!["0","20","30"].includes(String(d.window))) return '<p>请选择有效时间与唤醒方式。</p>';
      const minutes = Number(d.time.slice(0,2))*60+Number(d.time.slice(3)), window = Number(d.window), start=(minutes-window+1440)%1440;
      const startTime=String(Math.floor(start/60)).padStart(2,"0")+":"+String(start%60).padStart(2,"0");
      if (!window) return '<p>'+esc(d.time)+' 准时唤醒</p>';
      return '<p>'+(minutes<window?'前一天 ':'')+startTime+'–'+esc(d.time)+' · 戒指识别浅睡后叫醒</p>';
    }
    function status() {
      const error = check(state.wakeDraft);
      if (feedback) return feedback;
      if (draftFailed) return "修改还没能暂存，请先不要关闭页面。可重试保存。";
      if (error) return error;
      if (dirty()) return "修改已暂存，点击保存后才更新设置。";
      return state.wakeSaved ? (state.wakeSettings.enabled ? "设置已保存到本机，原型不会实际响铃。" : "已保存为关闭，时间与声音已保留。") : "当前为设置预览，原型不会实际响铃。";
    }
    function update() {
      const panel=screen.querySelector(".night-wake"); if(!panel) return;
      const d=state.wakeDraft, error=check(d);
      const out=panel.querySelector("#nw-feedback"); if(out) { out.textContent=status(); out.setAttribute("role",failed||draftFailed||error||feedback.startsWith("未能")?"alert":"status"); out.classList.toggle("is-error",!!(failed||draftFailed||error||feedback.startsWith("未能"))); }
      const summary=panel.querySelector("#nw-preview"); if(summary) summary.innerHTML=preview();
      const save=panel.querySelector('[data-action="wake-save"]'); if(save) {save.disabled=!!error || (!dirty()&&state.wakeSaved&&!failed&&!draftFailed);save.textContent=failed||draftFailed?"重试保存":d.enabled?"保存设置":"保存并关闭";}
      panel.querySelector("#wake-time")?.setAttribute("aria-invalid",String(!!d.enabled&&!validTime(d.time)));
      const restore=panel.querySelector('[data-action="night-wake:restore"]'); if(restore) restore.hidden=!dirty();
      const pending=panel.querySelector("#nw-pending"); if(pending) pending.innerHTML=pendingNotice();
      const connection=panel.querySelector("#nw-connection"); if(connection) connection.innerHTML=connectionHint();
    }
    function connectionHint() {
      if (!state.wakeDraft.enabled || String(state.wakeDraft.window) === "0") return "";
      const message = state.toggles.bluetooth === false ? "蓝牙未开启，暂时无法接收入睡信号。" : ({
        connected: "", low: "戒指电量偏低，建议睡前充电。",
        connecting: "正在连接戒指，连接成功后再确认信号。",
        syncing: "戒指正在同步，请稍后确认状态。",
        disconnected: "戒指暂未连接，浅睡判断不可用。",
        action: "戒指需要处理，请到设备页查看。"
      })[state.deviceStatus] ?? "戒指状态待确认，请到设备页查看。";
      return message ? '<p class="nw-connection">'+esc(message)+'</p>' : "";
    }
    function cancellationKey() { return JSON.stringify([account(), snooze()?.dueAt, state.wakeDraft]); }
    function pendingNotice() {
      const pending=snooze(); if(!pending) return "";
      const date=new Date(pending.dueAt), time=String(date.getHours()).padStart(2,"0")+":"+String(date.getMinutes()).padStart(2,"0");
      if(cancelIntent && cancelIntent===cancellationKey()) return '<section class="nw-cancel-confirm" role="group" aria-label="关闭提醒确认"><strong>同时取消这次稍后提醒？</strong><p>'+esc(time)+' 的提醒也会关闭。</p>'+button("保留提醒","night-wake:cancel-keep")+button("确认关闭并取消","night-wake:cancel-confirm","night-home-primary")+'</section>';
      return '<p class="nw-feedback">'+esc(time)+' 有一次稍后提醒。修改时间、声音或时长，不会取消这次提醒。</p>'+button("查看本次提醒","go:NIG-08");
    }
    function page() {
      if(lastAccount!==account()){feedback=""; failed=false; draftFailed=false;cancelIntent="";lastAccount=account();}
      if (!permitted()) return '<div class="night-screen night-home night-wake">'+header()+'<section class="nw-gate"><h2>连接戒指后设置唤醒</h2><p>睡前内容和播放记录仍可使用。</p>'+button("连接 Halo Ring","go:DEV-01","night-home-primary")+button("返回夜间","go:NIG-01","nw-text")+'</section><p class="nw-footnote">原型不会实际响铃，请另设手机闹钟。</p></div>';
      const d=state.wakeDraft, error=check(d), disabled=d.enabled?"":" disabled";
      const changed=dirty();
      return '<div class="night-screen night-home night-wake">'+header()+'<section class="nw-enable"><div><strong id="nw-enable-label">唤醒提醒</strong><small>'+(d.enabled?'开启后，按下面的时间设置':changed?'已选关闭，保存后更新':'已关闭，时间与声音已保留')+'</small></div><button type="button" id="nw-switch" class="nw-switch" role="switch" aria-labelledby="nw-enable-label" aria-checked="'+!!d.enabled+'" data-action="toggle:wake"><span></span></button></section><label class="nw-time">最迟唤醒时间<input id="wake-time" type="time" step="60" value="'+esc(d.time)+'" aria-describedby="nw-feedback" aria-invalid="'+(!!d.enabled&&!validTime(d.time))+'"'+disabled+'></label><p class="nw-mode-label">智能叫醒</p><fieldset class="nw-modes"><legend>唤醒方式</legend>'+[["0","准时"],["20","提前 20 分钟"],["30","提前 30 分钟"]].map(([v,label])=>'<label><input type="radio" name="wake-window" id="wake-window-'+v+'" value="'+v+'"'+(String(d.window)===v?' checked':'')+disabled+'><span>'+label+'</span></label>').join("")+'</fieldset><section id="nw-preview" class="nw-preview" aria-label="唤醒时间范围" aria-live="polite">'+preview()+'</section><button type="button" class="nw-sound" data-action="go:NIG-07"'+disabled+'>'+icon("sound")+'<span>唤醒声音</span><strong>'+esc(d.sound)+'</strong>'+icon("arrow")+'</button><label class="nw-snooze-row"><span>稍后提醒<small>响铃后手动延后</small></span><select id="wake-snooze-minutes"'+disabled+'>'+Array.from({length:15},(_,i)=>i+1).map(value=>'<option value="'+value+'"'+(Number(d.snoozeMinutes)===value?' selected':'')+'>'+value+' 分钟</option>').join("")+'</select></label>'+(!state.toggles.notification?'<section class="nw-permission"><div><strong>通知未开启</strong><p>可以先保存设置，通知不会因此自动开启。</p></div>'+button("查看权限","night-wake:permissions")+'</section>':'')+'<div id="nw-connection">'+connectionHint()+'</div><div id="nw-pending">'+pendingNotice()+'</div>'+'<div class="nw-save-area"><p id="nw-feedback" class="nw-feedback'+(failed||draftFailed||error||feedback.startsWith("未能")?' is-error':'')+'" role="'+(failed||draftFailed||error?'alert':'status')+'">'+esc(status())+'</p>'+button(failed||draftFailed?"重试保存":d.enabled?"保存设置":"保存并关闭","wake-save","night-home-primary",!!error||(!changed&&state.wakeSaved&&!failed&&!draftFailed))+button("恢复已保存设置","night-wake:restore").replace('<button ', '<button '+(!changed?'hidden ':'') )+'</div><details class="nw-explain"><summary>智能叫醒与稍后提醒</summary><p>戒指在最迟时间前的设定窗口内识别浅睡眠，检测到可用时机就尝试叫醒；未识别到则在最迟时间提醒。准时模式不等待浅睡。</p><p>稍后提醒从你点击时开始计时，可以晚于最迟时间。这里仅演示交互，尚未接入戒指实时识别与手机闹钟。</p>'+button("预览唤醒","night-wake:preview")+'</details><p class="nw-footnote">原型不会实际响铃，请另设手机闹钟。</p></div>';
    }
    function input(target) {
      if(state.current!=="NIG-06"||!(target.id==="wake-time"||target.id==="wake-snooze-minutes"||target.name==="wake-window")) return false;
      if(!permitted()||!state.wakeDraft.enabled) return true;
      if(target.name==="wake-window"&&(!target.checked||!["0","20","30"].includes(target.value))) return true;
      const field=target.id==="wake-time"?"time":target.id==="wake-snooze-minutes"?"snoozeMinutes":"window";
      const next={...state.wakeDraft,[field]:field==="snoozeMinutes"?Number(target.value):target.value};
      feedback="";failed=false;cancelIntent="";
      draftFailed=!write({wakeDraft:next,wakeSaved:false});
      if(draftFailed){state.wakeDraft=next;state.wakeSaved=false;}
      update();return true;
    }
    function save(confirmCancellation = false) {
      const error=check(state.wakeDraft); if(error){feedback="";update();return;}
      if(!dirty()&&state.wakeSaved&&!failed&&!draftFailed)return;
      let next=copy(state.wakeDraft);
      if(!next.enabled) next={...next,time:validTime(next.time)?next.time:validTime(state.wakeSettings.time)?state.wakeSettings.time:"07:20",window:["0","20","30"].includes(String(next.window))?String(next.window):"0",sound:sounds.includes(next.sound)?next.sound:"晨雾"};
      next.enabled=!!next.enabled; next.window=String(next.window);
      next.snoozeMinutes=validSnooze(next.snoozeMinutes)?Number(next.snoozeMinutes):5;
      if(!next.enabled && snooze() && !(confirmCancellation && cancelIntent===cancellationKey())) {
        cancelIntent=cancellationKey();render();screen.querySelector('.nw-cancel-confirm')?.scrollIntoView({block:"nearest"});screen.querySelector('[data-action="night-wake:cancel-keep"]')?.focus({preventScroll:true});return;
      }
      const pendingChanges=next.enabled?{snoozeUntil:state.snoozeUntil||"",wakeSnooze:state.wakeSnooze||null,wakeAlarmReceipt:state.wakeAlarmReceipt||null}:{snoozeUntil:"",wakeSnooze:null,wakeAlarmReceipt:null};
      if(!write({wakeSettings:next,wakeDraft:{...next},toggles:{...state.toggles,wake:next.enabled},alarmSound:next.sound,wakeSaved:true,...pendingChanges})){failed=true;feedback="未能保存，原设置没有改变，本次提醒也已保留。修改仍在，请重试。";update();return;}
      failed=false;draftFailed=false;feedback="";cancelIntent="";
      track?.("smart_wake_settings_saved",{source_page:"NIG-06",enabled:next.enabled,window_minutes:Number(next.window),snooze_minutes:next.snoozeMinutes,prototype_only:true});
      render();screen.querySelector("#nw-feedback")?.scrollIntoView({block:"nearest"});
    }
    function canLeave() {
      if(!draftFailed) return true;
      feedback="修改还没能暂存，请重试保存，或恢复已保存设置后返回。";update();return false;
    }
    function back() {
      if(!canLeave()) return;
      const trail=history.state?.trail||[];
      if(["NIG-11","NIG-12"].includes(trail.at(-2))){history.back();return;}
      const source=[...trail.slice(0,-1)].reverse().find(id=>["NIG-01","NIG-04","NIG-12","SET-02"].includes(id));
      go(source||"NIG-01",false);
    }
    function handle(action) {
      if(typeof action!=="string")return false;
      if(["wake-snooze","wake-dismiss"].includes(action)) { if(state.current==="NIG-08") alarmAction(action); return true; }
      if(state.current!=="NIG-06"||!(action.startsWith("night-wake:")||["wake-save","toggle:wake"].includes(action)))return false;
      if(action==="night-wake:back"){back();return true;}
      if(!permitted())return true;
      if(action==="night-wake:preview") {
        if(dirty()||draftFailed||!state.wakeSaved){feedback="请先保存设置，再预览唤醒。";update();}
        else if(!write({wakeAlarmReceipt:null})){feedback="未能开始预览，请重试。原设置没有改变。";update();}
        else {alarmError="";go("NIG-08");}
        return true;
      }
      if(action==="wake-save"){save();return true;}
      if(action==="night-wake:cancel-keep"){cancelIntent="";feedback="已保留本次提醒，关闭设置尚未保存。";render();screen.querySelector('[data-action="wake-save"]')?.focus();return true;}
      if(action==="night-wake:cancel-confirm"){if(cancelIntent===cancellationKey())save(true);return true;}
      if(action==="toggle:wake"){
        const next={...state.wakeDraft,enabled:!state.wakeDraft.enabled};
        feedback="";failed=false;cancelIntent="";draftFailed=!write({wakeDraft:next,wakeSaved:false});
        if(draftFailed){state.wakeDraft=next;state.wakeSaved=false;}render();screen.querySelector("#nw-switch")?.focus();return true;
      }
      if(action==="night-wake:restore"){
        cancelIntent="";
        if(!write({wakeDraft:{...state.wakeSettings},wakeSaved:true})){failed=false;feedback="未能恢复，修改仍然保留。请再次点击恢复已保存设置。";update();return true;}
        failed=false;draftFailed=false;feedback="已恢复上次保存的设置。";render();return true;
      }
      if(action==="night-wake:permissions"){if(draftFailed){feedback="修改还没能暂存，请先重试保存。";update();}else go("PERM-01");return true;}
      return true;
    }
    window.addEventListener("beforeunload",event=>{if(state.current==="NIG-06"&&draftFailed){event.preventDefault();event.returnValue="";}});
    function snooze() {
      const s=state.wakeSnooze;
      return s && s.ownerAccount===account() && validSnooze(s.minutes) && Number.isFinite(Date.parse(s.requestedAt)) && Number.isFinite(Date.parse(s.dueAt)) && Date.parse(s.dueAt)-Date.parse(s.requestedAt)===Number(s.minutes)*60000 ? s : null;
    }
    const settingsKey = () => JSON.stringify(keys.map(key=>state.wakeSettings?.[key]));
    function dismissed() {
      const r=state.wakeAlarmReceipt;
      return r && r.ownerAccount===account() && r.settingsKey===settingsKey() && Number.isFinite(Date.parse(r.closedAt));
    }
    const alarmHeader = () => '<header class="na-header"><h1>唤醒预览</h1>'+button('退出预览','go:NIG-06','na-exit')+'</header>';
    const alarmMark = done => '<span class="na-symbol" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="'+(done?'m5 12 4 4L19 6':'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4')+'"/></svg></span>';
    function remaining(s) {
      const seconds=Math.max(0,Math.ceil((Date.parse(s.dueAt)-Date.now())/1000));
      return '还有 '+Math.floor(seconds/60)+' 分 '+String(seconds%60).padStart(2,'0')+' 秒';
    }
    function alarm() {
      if(alarmAccount!==account()){alarmError="";alarmAccount=account();}
      const wake=state.wakeSettings;
      const shell=body=>'<div class="night-home night-wake nw-alarm">'+alarmHeader()+body+'<p class="na-demo">交互演示，不会实际响铃。请另设手机闹钟。</p></div>';
      if(!permitted()) return shell('<section class="na-gate"><h2>连接戒指后设置唤醒</h2>'+button('返回夜间','go:NIG-01','night-home-primary')+'</section>');
      const s=snooze(), waiting=!!s&&Date.parse(s.dueAt)>Date.now(), date=s?new Date(s.dueAt):null;
      const error=alarmError?'<p class="nw-feedback is-error" role="alert">'+esc(alarmError)+'</p>':'';
      if(dismissed()&&!s) return shell('<section class="nw-alarm-main na-closed">'+alarmMark(true)+'<h2>本次提醒已关闭</h2><p>唤醒时间与稍后提醒设置已保留。</p></section><div class="na-actions">'+button('开始今天','go:NIG-09','night-home-primary')+'<p class="na-action-hint">如需再看一次，可退出后重新预览。</p></div>');
      if(!wake.enabled||!state.toggles.notification||check(wake)) {
        const reason=!wake.enabled?'唤醒提醒已关闭':!state.toggles.notification?'通知尚未开启':'请检查唤醒设置';
        return shell('<section class="na-gate">'+alarmMark(false)+'<h2>'+reason+'</h2><p>'+(s?'已保留稍后提醒记录；这里不会实际响铃。':'设置已保留，可返回检查后再预览。')+'</p>'+button('检查唤醒设置','go:NIG-06','night-home-primary')+(s?button('关闭本次提醒','wake-dismiss','na-dismiss'):'')+error+'</section>');
      }
      const time=date?String(date.getHours()).padStart(2,"0")+":"+String(date.getMinutes()).padStart(2,"0"):wake.time;
      const minutes=Number(wake.snoozeMinutes);
      return shell('<section class="nw-alarm-main" data-snooze-waiting="'+waiting+'">'+alarmMark(false)+'<p class="na-state">'+(waiting?'稍后再叫你':s?'提醒时间到了':'该起床了')+'</p><h2 class="na-time">'+esc(time)+'</h2><p class="na-time-caption">'+(s?(date.getMonth()+1)+'月'+date.getDate()+'日 · 再次提醒时间':'设定的最迟唤醒时间')+'</p>'+(waiting?'<p id="na-countdown" role="timer" aria-live="off">'+remaining(s)+'</p>':'<p class="na-sound">'+esc(wake.sound)+' · '+(s?'稍后提醒':'唤醒声音')+'</p>')+'</section><div class="na-actions">'+button(waiting?'稍后提醒已设置':'再睡 '+minutes+' 分钟','wake-snooze','night-home-primary na-snooze',waiting)+'<p class="na-action-hint">'+(waiting?'退出预览也会保留这次稍后提醒。':'从点击开始计时，不再等待浅睡。')+'</p>'+button('我已起床','wake-dismiss','na-dismiss')+'<p class="na-action-hint">关闭本次提醒，不更改唤醒设置。</p>'+error+'</div>');
    }
    function alarmAction(action) {
      if(!permitted())return;
      if(action==="wake-dismiss") {
        if(dismissed()&&!snooze()){go("NIG-09");return;}
        if((!state.wakeSettings.enabled||!state.toggles.notification||check(state.wakeSettings))&&!snooze())return;
        if(!write({wakeSnooze:null,snoozeUntil:"",wakeAlarmReceipt:{ownerAccount:account(),settingsKey:settingsKey(),closedAt:new Date().toISOString()}})){alarmError="未能关闭本次提醒，请重试。";render();return;}
        alarmError="";go("NIG-09");return;
      }
      if(!state.wakeSettings.enabled||!state.toggles.notification||check(state.wakeSettings)||dismissed())return;
      const current=snooze(); if(current&&Date.parse(current.dueAt)>Date.now())return;
      const minutes=state.wakeSettings.snoozeMinutes;
      if(!validSnooze(minutes)){alarmError="稍后提醒时长无效，请返回设置重新选择。";render();return;}
      const now=Date.now(), due=new Date(now+Number(minutes)*60000);
      const next={ownerAccount:account(),minutes:Number(minutes),requestedAt:new Date(now).toISOString(),dueAt:due.toISOString()};
      if(!write({wakeSnooze:next,wakeAlarmReceipt:null,snoozeUntil:String(due.getHours()).padStart(2,"0")+":"+String(due.getMinutes()).padStart(2,"0" )})){alarmError="稍后提醒未能保存，原提醒不变，请重试。";render();return;}
      alarmError="";track?.("smart_wake_snoozed",{minutes:Number(minutes),prototype_only:true});render();
    }
    function tick() {
      if(state.current!=="NIG-08"||!permitted())return;
      const s=snooze();
      if(!s||!screen.querySelector('[data-snooze-waiting="true"]'))return;
      if(Date.parse(s.dueAt)<=Date.now()) {render();return;}
      const clock=screen.querySelector('#na-countdown');if(clock)clock.textContent=remaining(s);
    }
    return {page,handle,input,canLeave,alarm,tick,
      closedReceipt:()=>permitted()&&dismissed()&&!snooze()?state.wakeAlarmReceipt:null,
      pendingSnooze:()=>permitted()?snooze():null};
  };
})();
