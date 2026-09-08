/* NIG-07: original synthesized 2-second audition samples, not production alarm recordings. */
(() => {
  "use strict";
  window.createHaloNightSound = function ({state,screen,active,esc,write,render,go}) {
    const options=[{name:"晨雾",copy:"柔和双音",notes:[392,523],wave:"sine"},{name:"微光",copy:"清亮短音",notes:[523,659,784],wave:"sine"},{name:"清泉",copy:"轻快三音",notes:[440,554,659],wave:"triangle"},{name:"柔和铃音",copy:"低柔长音",notes:[294,392],wave:"sine"}];
    const known=name=>options.some(item=>item.name===name);
    const owner=()=>String(state.authPhone||state.authForm?.phone||"");
    const allowed=()=>state.signedIn&&state.authVerified&&state.accountDeletionStatus!=="submitted"&&active()&&state.wakeDraft?.enabled;
    let message="",error=false,retryChoice="",ctx=null,nodes=[],timer=0,token=0,playing="",loading="",account="";
    const playIcon='<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7Z" fill="currentColor"/></svg>';
    const stopIcon='<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor"/></svg>';
    function draft() {
      const d=state.wakeSoundSelection;
      if(!d||d.ownerAccount!==owner()||d.baseSound!==state.wakeDraft.sound||!known(d.value)) state.wakeSoundSelection={ownerAccount:owner(),baseSound:state.wakeDraft.sound,value:known(state.wakeDraft.sound)?state.wakeDraft.sound:options[0].name};
      return state.wakeSoundSelection;
    }
    function stop(note="",refresh=true) {
      const hadPreview=Boolean(playing||loading);
      token++;clearTimeout(timer);timer=0;
      for(const node of nodes){try{node.stop();node.disconnect();}catch{}}
      nodes=[];const old=ctx;ctx=null;if(old)old.close().catch(()=>{});
      playing="";loading="";if(note||hadPreview){message=note||"试听已停止。";error=false;}if(refresh)update();
    }
    function update() {
      if(state.current!=="NIG-07"||!allowed())return;
      const view=screen.querySelector(".night-sound");if(!view)return;
      const d=draft();
      view.querySelectorAll('[name="wake-sound"]').forEach(el=>{el.checked=el.value===d.value;});
      view.querySelectorAll("[data-audition]").forEach(el=>{
        const on=el.dataset.audition===playing||el.dataset.audition===loading;
        el.innerHTML=(on?stopIcon:playIcon)+'<span>'+(on?"停止":"试听")+'</span>';
        el.setAttribute("aria-label",(on?"停止试听":"试听")+el.dataset.audition);
        el.setAttribute("aria-pressed",String(on));
      });
      const feedback=view.querySelector("#nsound-feedback");
      feedback.textContent=message||(d.value===state.wakeDraft.sound?"当前选择："+d.value:"已选 "+d.value+"，确认后带回设置。");
      feedback.setAttribute("role",error?"alert":"status");feedback.classList.toggle("is-error",error);
      const retry=view.querySelector('[data-action="night-sound:retry"]');retry.hidden=!retryChoice;
      view.querySelector('[data-action="wake-sound-confirm"]').textContent="使用「"+d.value+"」";
      view.dataset.preview=playing?"playing":loading?"loading":"idle";
    }
    function page() {
      if(account!==owner()){stop();message="";error=false;retryChoice="";account=owner();}
      const header='<header class="nw-header"><button type="button" class="nw-back" data-action="night-sound:back" aria-label="返回唤醒设置"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg></button><h1>唤醒声音</h1><span></span></header>';
      if(!allowed())return '<div class="night-home night-wake night-sound">'+header+'<p>开启唤醒提醒后，再选择声音。</p><button class="night-home-primary" data-action="go:NIG-06">返回唤醒设置</button></div>';
      const d=draft();
      return '<div class="night-home night-wake night-sound" data-preview="'+(playing?"playing":loading?"loading":"idle")+'">'+header+'<p class="nsound-intro">先听一小段，再选喜欢的。</p><fieldset class="nsound-list"><legend>选择唤醒声音</legend>'+options.map((item,i)=>'<section class="nsound-row"><label><input type="radio" name="wake-sound" id="wake-sound-'+i+'" value="'+item.name+'"'+(d.value===item.name?' checked':'')+'><span class="nsound-mark" aria-hidden="true"></span><span class="nsound-copy"><strong>'+item.name+'</strong><small>'+item.copy+'</small></span></label><button type="button" class="nsound-audition" data-audition="'+item.name+'" data-action="night-sound:play:'+item.name+'" aria-pressed="'+(playing===item.name||loading===item.name)+'" aria-label="'+(playing===item.name||loading===item.name?"停止试听":"试听")+item.name+'">'+(playing===item.name||loading===item.name?stopIcon:playIcon)+'<span>'+(playing===item.name||loading===item.name?"停止":"试听")+'</span></button></section>').join("")+'</fieldset><p id="nsound-feedback" class="nsound-feedback'+(error?' is-error':'')+'" role="'+(error?'alert':'status')+'">'+esc(message||(d.value===state.wakeDraft.sound?"当前选择："+d.value:"已选 "+d.value+"，确认后带回设置。"))+'</p><button type="button" class="nw-text" data-action="night-sound:retry"'+(!retryChoice?' hidden':'')+'>重试选择</button><button type="button" class="night-home-primary" data-action="wake-sound-confirm">使用「'+esc(d.value)+'」</button><p class="nsound-hint">返回不更改声音。确认后，还需在唤醒设置页保存。</p><p class="nsound-demo">每段试听 2 秒 · 合成音色示意，非正式铃声。<br>请先调低手机音量；不会设置真实闹钟。</p></div>';
    }
    function choose(value) {
      if(!known(value)||!allowed())return;
      const next={...draft(),value};
      if(!write({wakeSoundSelection:next})){message="这次选择没能保存，原选择不变。请重试。";error=true;retryChoice=value;update();return;}
      retryChoice="";error=false;message="";update();
    }
    function input(target) {if(state.current!=="NIG-07"||target.name!=="wake-sound")return false;if(target.checked)choose(target.value);return true;}
    async function audition(name) {
      if(!known(name)||!allowed())return;
      if(playing===name||loading===name){stop("试听已停止。");return;}
      stop();message="正在准备 "+name+"…";error=false;loading=name;const run=++token;update();
      try {
        const Audio=window.AudioContext||window.webkitAudioContext;
        if(!Audio)throw new Error("unsupported");
        const audio=new Audio();ctx=audio;
        timer=setTimeout(()=>{if(run===token){stop();message="暂时无法试听，请再点一次。仍可选择声音。";error=true;update();}},2500);
        if(audio.state!=="running")await audio.resume();
        if(run!==token)return;
        if(state.current!=="NIG-07"||!allowed()||document.hidden){stop();return;}
        if(audio.state!=="running")throw new Error("not running");
        clearTimeout(timer);loading="";playing=name;message="正在试听 "+name+" · 2 秒";update();
        const item=options.find(v=>v.name===name),start=audio.currentTime;
        item.notes.forEach((frequency,i)=>{
          const oscillator=audio.createOscillator(),gain=audio.createGain(),at=start+i*.48;
          oscillator.type=item.wave;oscillator.frequency.setValueAtTime(frequency,at);
          gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.035,at+.08);gain.gain.exponentialRampToValueAtTime(.0001,at+.8);
          oscillator.connect(gain);gain.connect(audio.destination);oscillator.start(at);oscillator.stop(at+.82);nodes.push(oscillator);
        });
        audio.addEventListener("statechange",()=>{if(run===token&&audio.state!=="running"){stop();message="试听已中断，可以重新试听。";error=true;update();}});
        timer=setTimeout(()=>{if(run===token)stop("试听结束，选择不会因此改变。");},2000);
      }catch{
        if(run!==token)return;stop();message="暂时无法试听，请检查浏览器声音设置后重试。仍可选择声音。";error=true;update();
      }
    }
    function handle(action) {
      if(typeof action!=="string")return false;
      const ours=action.startsWith("night-sound:")||action.startsWith("sound:")||action==="wake-sound-confirm";
      if(!ours||state.current!=="NIG-07")return false;
      if(action==="night-sound:back"){stop();go("NIG-06");return true;}
      if(!allowed())return true;
      if(action.startsWith("night-sound:play:")){audition(action.slice(17));return true;}
      if(action.startsWith("sound:")){choose(action.slice(6));return true;}
      if(action==="night-sound:retry"){if(retryChoice)choose(retryChoice);return true;}
      if(action==="wake-sound-confirm"){
        stop();const d=draft();
        if(!write({wakeDraft:{...state.wakeDraft,sound:d.value},wakeSaved:d.value===state.wakeDraft.sound?state.wakeSaved:false,wakeSoundSelection:null})){message="没能确认声音，修改仍保留。请再次点击使用。";error=true;update();return true;}
        message="";error=false;retryChoice="";go("NIG-06");return true;
      }
      return true;
    }
    document.addEventListener("visibilitychange",()=>{if(document.hidden)stop("试听已停止。");});
    window.addEventListener("pagehide",()=>stop());
    for(const name of ["hashchange","popstate"])window.addEventListener(name,()=>{if(location.hash.toUpperCase()!=="#NIG-07")stop();});
    return {page,input,handle,leave:()=>stop("",false)};
  };
})();
