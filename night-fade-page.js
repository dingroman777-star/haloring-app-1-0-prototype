/* NIG-12: a single persisted preference, not a running audio/sleep-detection engine. */
(() => {
  'use strict';
  window.createHaloNightFade = function ({state,active,playlist,esc,screen,write,render,go,capture,persist}) {
    const svg=name=>'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+({back:'m15 5-7 7 7 7',arrow:'m9 5 7 7-7 7',sound:'M4 10v4h4l5 4V6l-5 4H4m12-2a7 7 0 0 1 0 8',clock:'M12 8v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 1 1 18 0'})[name]+'"/></svg>';
    const owner=()=>String(state.authPhone||state.authForm?.phone||'');
    const permitted=()=>state.signedIn&&state.authVerified&&state.accountDeletionStatus!=='submitted'&&active();
    const enabled=()=>state.toggles.sleepFade!==false;
    let feedback='',pending=null,lastOwner='';
    function resetAccount(){if(lastOwner!==owner()){lastOwner=owner();feedback='';pending=null;}}
    function session(){
      const s=state.nightSession;if(!s||!['playing','paused'].includes(s.status))return null;
      if(s.ownerAccount&&s.ownerAccount!==owner())return null;
      if(s.memberRegistrationId&&s.memberRegistrationId!==state.memberCreatedAt)return null;
      const tracks=playlist.sessionTracks(s);
      return tracks.length>0&&(!Array.isArray(s.tracks)||tracks.length===s.tracks.length)&&Math.abs(tracks.reduce((sum,t)=>sum+t.duration,0)-Number(s.duration))<.001?s:null;
    }
    function button(label,route,cls='nf-link') {return '<button type="button" class="'+cls+'" data-action="go:'+route+'">'+label+svg('arrow')+'</button>';}
    function wakeEntry(){
      const w=state.wakeSettings||{};
      const value=!active()?'未设置':!w.enabled?'已关闭':/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(w.time))?w.time:'时间待确认';
      const note=!active()?'连接戒指后可设置':!w.enabled?'和音量渐弱分开设置':!state.toggles.notification?'通知未开启':'唤醒设置预览';
      return '<button type="button" class="nf-wake" data-action="go:NIG-06">'+svg('clock')+'<span><strong>唤醒设置</strong><small>'+note+'</small></span><b>'+esc(value)+'</b>'+svg('arrow')+'</button>';
    }
    function page(){
      resetAccount();const on=enabled(),s=session(),allowed=permitted(),signal=allowed&&state.toggles.bluetooth!==false&&['connected','low'].includes(state.deviceStatus);
      const scope=s?'更改会用于当前这组和之后的播放。':'更改会用于之后开始的播放。';
      return '<article class="night-home night-fade"><header class="nf-header"><button type="button" data-action="night-fade:back" aria-label="返回上一页">'+svg('back')+'</button><h1>音量渐弱</h1><span></span></header>'+
        '<section class="nf-hero"><div class="nf-wave '+(on&&allowed?'is-on':'')+'" aria-hidden="true">'+[34,46,58,66,60,52,42,32,24,17,11].map((h,i)=>'<i style="--bar:'+h+'px;--fade:'+Math.max(9,58-i*5)+'px"></i>').join('')+'</div><h2>'+(allowed?'让声音慢慢轻下来':'连接戒指后设置')+'</h2><p>'+(allowed?'入睡时，逐渐调低放松内容的音量。':'公共内容仍可手动播放。')+'</p></section>'+
        (allowed?'<section class="nf-control"><div><strong id="nf-switch-label">音量渐弱</strong><small id="nf-switch-state">'+(on?'已开启':'已关闭')+'</small></div><button type="button" id="nf-switch" class="nf-switch" role="switch" aria-labelledby="nf-switch-label" aria-describedby="nf-scope nf-feedback" aria-checked="'+on+'" data-action="toggle:sleepFade"><span></span></button></section><p id="nf-scope" class="nf-scope">'+scope+'</p><div class="nf-feedback" id="nf-feedback" role="'+(pending?'alert':'status')+'">'+esc(feedback)+'</div>'+(pending?'<button type="button" class="nf-retry" data-action="night-fade:retry">重试保存</button>':'')+
        '<section class="nf-effect"><strong>'+(on?'开启后':'关闭后')+'</strong><p>'+(on?'有入睡信号时，跟随信号渐弱；没有可用信号时，按播放计时渐弱。':'不自动调低放松内容的音量，仍可暂停或结束播放。')+'</p>'+(on&&!signal?'<div class="nf-connection"><span>暂时无法使用入睡信号</span>'+button('查看连接','DEV-10')+'</div>':'')+'</section>'+
        (s?'<button type="button" class="nf-current" data-action="go:NIG-04"><span><strong>'+esc(s.title||'当前播放组合')+'</strong><small>'+(s.status==='paused'?'已暂停':'播放中')+' · 本次渐弱'+(s.fadeEnabled?'已开启':'已关闭')+'</small></span>'+svg('arrow')+'</button>':''):
        button('连接 Halo Ring','DEV-01','night-home-primary')+'<p class="nf-scope">已保存的设置和播放记录不会因此清除。</p>')+
        wakeEntry()+'<p class="nf-separate">音量渐弱只影响放松内容，不会开关或调低唤醒提醒。</p>'+button('播放与唤醒帮助','NIG-11','nf-help')+'<p class="night-home-boundary">原型只演示设置，不检测入睡或实际调节音量。</p></article>';
    }
    function save(value){
      resetAccount();if(!permitted())return;
      const s=session();
      const changes={toggles:{...state.toggles,sleepFade:value},...(s?{nightSession:{...s,fadeEnabled:value}}:{})};
      if(!write(changes)){pending={owner:owner(),value};feedback='没能保存，原设置没有改变。请重试。';}
      else{pending=null;feedback=s?'已保存，当前这组和之后的播放都已更新。':'已保存，用于之后开始的播放。';}
      render();screen.querySelector(pending?'.nf-retry':'#nf-switch')?.focus({preventScroll:true});
    }
    function back(){
      const from=history.state?.trail?.at(-2);
      if(state.current==='DEV-10'&&from==='NIG-12'||state.current==='NIG-12'){
        capture();persist();
        if(from&&(state.current!=='NIG-12'||['NIG-01','NIG-04','NIG-06','NIG-11'].includes(from))){history.back();return true;}
        go('NIG-01',false);return true;
      }return false;
    }
    function handle(action){
      if(action!=='toggle:sleepFade'&&!action?.startsWith('night-fade:'))return false;
      if(state.current!=='NIG-12')return true;
      if(action==='night-fade:back'){back();return true;}
      resetAccount();
      if(action==='toggle:sleepFade')save(!enabled());
      if(action==='night-fade:retry'&&pending?.owner===owner())save(pending.value);
      return true;
    }
    return {page,handle,back};
  };
})();
