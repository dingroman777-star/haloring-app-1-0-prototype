/* NIG-11: read-only help based on existing state; never restart audio or schedule an alarm. */
(() => {
  'use strict';
  window.createHaloNightSupport = function ({state,active,playlist,esc,pendingSnooze,go,capture,persist}) {
    const icon = name => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+({back:'m15 5-7 7 7 7',arrow:'m9 5 7 7-7 7',ring:'M18 12a6 9 0 1 1-12 0 6 9 0 1 1 12 0',play:'m9 5 10 7-10 7Z',clock:'M12 8v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 1 1 18 0',help:'M9 8a3 3 0 0 1 6 0c0 2-3 2-3 5m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 1 1 18 0'})[name]+'"/></svg>';
    const button=(label,route,cls='ns-link')=>'<button type="button" class="'+cls+'" data-action="go:'+route+'">'+label+icon('arrow')+'</button>';
    function connection() {
      if(!active())return {kind:'unbound',title:'还没有连接戒指',body:'可以先用公共内容放松，连接后再设置智能叫醒。',value:'尚未连接',note:'公共内容仍可使用',label:'连接 Halo Ring',route:'DEV-01'};
      if(state.toggles.bluetooth===false)return {kind:'bluetooth',title:'手机蓝牙未开启',body:'打开手机蓝牙，再把戒指放在手机附近。',value:'蓝牙未开启',note:'连接后再同步新记录',label:'查看连接与同步',route:'DEV-10'};
      return {
        disconnected:{kind:'disconnected',title:'戒指暂未连接',body:'把戒指放在手机附近，并检查手机蓝牙。',value:'暂未连接',note:'浅睡判断暂不可用',label:'查看连接与同步',route:'DEV-10'},
        connecting:{kind:'connecting',title:'正在连接戒指',body:'让戒指靠近手机。你可以先离开，稍后再查看连接结果。',value:'连接中',note:'连接结果请到设备页查看',label:'查看连接进度',route:'DEV-10'},
        syncing:{kind:'syncing',title:'戒指正在同步',body:'正在接收新记录，不用重复开始同步。',value:'同步中',note:'已有记录仍可查看',label:'查看同步进度',route:'DEV-10'},
        low:{kind:'low',title:'戒指电量偏低',body:'请给戒指充电，以便继续记录和同步。',value:'电量偏低',note:'建议先充电',label:'查看设备电量',route:'DEV-10'},
        action:{kind:'action',title:'同步还需要处理',body:'本次同步没有完成。到设备页查看原因，再重试。',value:'需要处理',note:'已保存记录仍然保留',label:'查看连接与同步',route:'DEV-10'},
        connected:{kind:'connected',title:'夜间使用帮助',body:'连接、播放和唤醒，可以分别查看。',value:'已连接',note:'不代表所有记录已同步',label:'查看设备状态',route:'DEV-10'}
      }[state.deviceStatus] || {kind:'unknown',title:'暂时无法确认连接状态',body:'到设备页查看连接情况，已有记录仍然保留。',value:'状态待确认',note:'请查看设备页',label:'查看设备状态',route:'DEV-10'};
    }
    function playback() {
      const s=state.nightSession;
      if(!s||s.status==='ended')return {kind:'idle',value:s?'已结束':'尚未开始',note:s?'本次记录到播放历史查看':'先选一组喜欢的内容',label:'选择放松内容',route:'NIG-01'};
      const tracks=playlist.sessionTracks(s);
      const valid=['playing','paused'].includes(s.status)&&tracks.length>0&&(!Array.isArray(s.tracks)||tracks.length===s.tracks.length)&&Math.abs(tracks.reduce((sum,t)=>sum+t.duration,0)-Number(s.duration))<.001;
      if(!valid)return {kind:'invalid',value:'信息不完整',title:'这组内容暂时无法继续',body:'播放信息不完整，先查看已有记录。不会重新开始或替换这组内容。',note:'已有记录未改动',label:'查看播放记录',route:'NIG-10'};
      return {kind:s.status,value:s.status==='paused'?'已暂停':'播放中',note:s.title||'本次播放组合',label:'返回播放器',route:'NIG-04'};
    }
    function wake() {
      const s=pendingSnooze(),w=state.wakeSettings||{};
      if(s)return {kind:'snooze',value:'稍后提醒',note:'查看或关闭本次提醒',label:'查看稍后提醒',route:'NIG-08'};
      if(!active())return {kind:'unbound',value:'尚未设置',note:'连接戒指后可设置',label:'连接 Halo Ring',route:'DEV-01'};
      if(!w.enabled)return {kind:'off',value:'已关闭',note:'时间和声音仍保留',label:'查看唤醒设置',route:'NIG-06'};
      if(!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(w.time)))return {kind:'invalid',value:'时间待确认',title:'请确认唤醒时间',body:'进入唤醒设置，重新选择时间并保存。',note:'请重新选择并保存',label:'查看唤醒设置',route:'NIG-06'};
      if(!state.toggles.notification)return {kind:'permission',value:'通知未开启',title:'唤醒通知未开启',body:'先查看通知权限；保留的唤醒时间不会因此丢失。',note:'已设时间 '+w.time,label:'查看通知权限',route:'PERM-01'};
      return {kind:'preview',value:w.time,note:'唤醒设置预览 · 不会实际响铃',label:'查看唤醒设置',route:'NIG-06'};
    }
    function row(name,symbol,value) {
      return '<button type="button" class="ns-status-row" data-action="go:'+value.route+'" aria-label="'+esc(value.label)+'">'+icon(symbol)+'<span><strong>'+name+'</strong><small>'+esc(value.note)+'</small></span><b>'+esc(value.value)+'</b>'+icon('arrow')+'</button>';
    }
    function page() {
      const d=connection(),p=playback(),w=wake();
      const issue=p.kind==='invalid'?p:!['connected','unbound'].includes(d.kind)?d:['permission','invalid'].includes(w.kind)?w:null;
      const main=issue||p;
      return '<article class="night-home night-support" data-support-state="'+(issue?.kind||d.kind)+'"><header class="ns-header"><button type="button" data-action="previous" aria-label="返回上一页">'+icon('back')+'</button><h1>夜间帮助</h1><span></span></header>'+
        '<section class="ns-summary"><span class="ns-mark">'+icon(issue===p?'play':issue===w?'clock':'ring')+'</span><h2>'+esc(issue?.title||d.title)+'</h2><p>'+esc(issue?.body||d.body)+'</p>'+button(main.label,main.route,'night-home-primary')+(issue&&main.route!==p.route?button(p.label,p.route,'ns-secondary'):'')+'</section>'+
        '<section class="ns-status" aria-label="当前状态">'+row('戒指','ring',d)+row('内容播放','play',p)+row('唤醒','clock',w)+'</section><p class="ns-retained">查看帮助不会清除已保存的播放记录。</p>'+
        '<details class="ns-faq"><summary>没有声音，或播放中断'+icon('arrow')+'</summary><p>当前原型只演示播放操作，不会输出音频。可以返回播放器查看暂停或播放状态，不必重新开始。</p>'+button(p.label,p.route)+'<p>正式 App 的后台播放和音频恢复，需在手机上另行验证。</p></details>'+
        '<details class="ns-faq"><summary>断连后，还会智能叫醒吗'+icon('arrow')+'</summary><p>断连时，无法依据戒指的实时状态判断浅睡。连接恢复后，再到唤醒设置确认。</p><p>当前原型不会实际响铃，请另设手机闹钟。此处的连接状态不代表手机闹钟已成功安排。</p>'+button('查看唤醒设置','NIG-06')+'</details>'+
        button('仍有问题，联系客服','HELP-03','ns-contact')+'<p class="night-home-boundary">原型不输出音频或实际响铃，请另设手机闹钟。</p></article>';
    }
    function entry() {
      return '<button type="button" class="night-support-entry" data-action="go:NIG-11">'+icon('help')+'<span>播放与唤醒帮助</span>'+icon('arrow')+'</button>';
    }
    function back() {
      const from=history.state?.trail?.at(-2);
      if(state.current==='DEV-10'&&from==='NIG-11'||state.current==='NIG-11') {
        capture();persist();
        if(from&&(state.current!=='NIG-11'||['NIG-01','NIG-04','NIG-06','NIG-12'].includes(from))){history.back();return true;}
        go('NIG-01',false);return true;
      }
      return false;
    }
    return {page,entry,back};
  };
})();
