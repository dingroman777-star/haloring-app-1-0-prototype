/* NIG-10: archived listening snapshots. Browsing never starts playback or rewrites records. */
(() => {
  'use strict';
  window.createHaloNightHistory = function ({state,playlist,screen,esc,render,go,write,pendingArchive=()=>false}) {
    const filters={all:'全部',unrecorded:'未记感受',recorded:'已记感受'};
    const own=(o,k)=>Object.prototype.hasOwnProperty.call(o||{},k);
    const owner=()=>String(state.authPhone||state.authForm?.phone||'');
    const arrow='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>';
    const button=(text,action,cls='nh-text')=>'<button type="button" class="'+cls+'" data-action="'+esc(action)+'">'+text+'</button>';
    let error='',errorOwner='';
    function view(){const v=state.pageViews?.['NIG-10'];return v?.nightHistoryOwner===owner()?v:{};}
    function filter(){return own(filters,view().nightHistoryFilter)?view().nightHistoryFilter:'all';}
    function capture(){
      const panel=screen.querySelector('.night-history');if(!panel)return {};
      const saved=view(),open=new Set(saved.nightHistoryOpen||[]);
      panel.querySelectorAll('details[data-history-id]').forEach(el=>{if(el.open)open.add(el.dataset.historyId);else open.delete(el.dataset.historyId);});
      return {nightHistoryOwner:panel.dataset.historyOwner,nightHistoryFilter:panel.dataset.historyFilter,nightHistoryOpen:[...open]};
    }
    function records(){return (Array.isArray(state.nightHistory)?state.nightHistory:[]).filter(e=>e&&typeof e.id==='string'&&window.HaloPersonalScope.ownsNight(state,e)).slice().sort((a,b)=>(Date.parse(b.endedAt)||0)-(Date.parse(a.endedAt)||0));}
    const validDate=v=>Boolean(v)&&Number.isFinite(Date.parse(v));
    function day(value){return validDate(value)?new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'long',day:'numeric'}).format(new Date(value)):'日期待确认';}
    function span(entry){
      if(!validDate(entry.startedAt)||!validDate(entry.endedAt)||Date.parse(entry.endedAt)<Date.parse(entry.startedAt))return '时间待确认';
      const start=new Date(entry.startedAt),end=new Date(entry.endedAt),clock=d=>new Intl.DateTimeFormat('zh-CN',{hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(d);
      return (start.toDateString()===end.toDateString()?'':day(entry.startedAt)+' ')+clock(start)+'–'+clock(end)+(start.toDateString()===end.toDateString()?'':'（跨日）');
    }
    const number=v=>(typeof v==='number'||typeof v==='string'&&/^\d+(?:\.\d+)?$/.test(v))&&Number.isFinite(Number(v))?Number(v):null;
    function duration(value){const seconds=Math.floor(value);return Math.floor(seconds/60)+' 分'+(seconds%60?' '+seconds%60+' 秒':'');}
    function record(entry){
      const tracks=playlist.sessionTracks(entry),partial=Array.isArray(entry.tracks)&&tracks.length!==entry.tracks.length,total=partial?0:tracks.reduce((sum,p)=>sum+p.duration,0),raw=number(entry.positionSeconds),seconds=raw!==null&&raw>=0&&(!total||raw<=total*60)?raw:null;
      const complete=entry.stopReason==='completed'&&seconds!==null&&total>0&&seconds>=total*60;
      const status=entry.skipped?'含跳段':complete?'已播完':entry.stopReason==='stopped'?'提前结束':'已结束';
      const draft=own(state.nightReviewDrafts,entry.id)&&state.nightReviewDrafts[entry.id]&&typeof state.nightReviewDrafts[entry.id]==='object';
      const saved=Boolean(entry.review?.saved),reviewLabel=draft?'继续填写':saved?'查看感受':'记下感受';
      const label=entry.skipped?'播放进度到':'已听';
      return '<article class="nh-card" data-record-id="'+esc(entry.id)+'"><div class="nh-card-meta"><time>'+esc(span(entry))+'</time><span>'+status+'</span></div><h3>'+esc(entry.title||'本次收听')+'</h3><p class="nh-duration">'+(seconds===null?'时长待确认':label+' <strong>'+duration(seconds)+'</strong>')+(total?' <span>／ 共 '+total+' 分钟</span>':'')+'</p>'+
        (seconds!==null&&total?'<progress max="'+total*60+'" value="'+seconds+'" aria-label="'+esc(label+' '+duration(seconds)+'，内容共 '+total+' 分钟')+'"></progress>':'')+
        '<details class="nh-tracks" data-history-id="'+esc(entry.id)+'"><summary><span>'+(partial?'已保留内容':'本次内容')+(tracks.length?' · '+tracks.length+' 段':'')+'</span>'+arrow+'</summary>'+(partial?'<p>部分内容信息缺失，先显示已保留的片段。</p>':'')+(tracks.length?'<ol>'+tracks.map((part,i)=>'<li>'+button('<span class="nh-order">'+(i+1)+'</span><span class="nh-track-copy">'+esc(part.title)+'<small>'+part.duration+' 分钟 · 查看介绍</small></span>'+arrow,'night-combo:history:'+entry.id+':'+i,'nh-track')+'</li>').join('')+'</ol>':'<p>这次记录没有保留完整的内容信息。</p>')+'</details><div class="nh-review"><span>'+ (draft?'草稿未保存':saved?'已记录 · 用户感受':'感受选填')+'</span>'+button(reviewLabel+arrow,'night-history:'+entry.id,'nh-review-link')+'</div></article>';
    }
    function page(){
      if(errorOwner!==owner()){error='';errorOwner=owner();}
      const all=records(),selected=filter(),shown=all.filter(e=>selected==='all'||Boolean(e.review?.saved)===(selected==='recorded'));
      const awaitingSave=pendingArchive();
      const current=!awaitingSave&&window.HaloPersonalScope.ownsNight(state,state.nightSession)&&['playing','paused'].includes(state.nightSession.status)?state.nightSession:null;
      let previous='';
      const list=shown.map(e=>{const date=day(e.endedAt),heading=date!==previous?'<h2 class="nh-date">'+date+'</h2>':'';previous=date;return heading+record(e);}).join('');
      return '<article class="night-home night-history" data-history-owner="'+esc(owner())+'" data-history-filter="'+selected+'"><header class="nh-header">'+button('‹','night-list:back','nh-back').replace('<button ','<button aria-label="返回上一页" ')+'<h1>播放历史</h1><span></span></header>'+
        (current?button('<span><strong>'+esc(current.title||'当前播放')+'</strong><small>'+(current.status==='playing'?'正在播放':'已暂停')+' · 返回播放器</small></span>'+arrow,'go:NIG-04','nh-current'):'')+
        (all.length?'<div class="nh-filters" role="group" aria-label="按感受记录筛选">'+Object.entries(filters).map(([key,label])=>button(label,'night-list:filter:'+key,'nh-filter').replace('<button ','<button aria-pressed="'+(selected===key)+'" ')).join('')+'</div><p class="nh-count" role="status">'+shown.length+' 次收听'+(selected==='all'?' · 最近的在前':'')+'</p>':'')+
        (error?'<p class="nh-error" role="alert">'+esc(error)+'</p>':'')+
        (list||'<section class="nh-empty"><h2>'+(!all.length?awaitingSave?'收听已结束':'还没有播放记录':selected==='recorded'?'还没有记下感受':'每次收听都已记录感受')+'</h2><p>'+(!all.length?(awaitingSave?'记录保存后会出现在这里。':current?'这段收听结束后，会保存在这里。':'选一段喜欢的内容，结束后可以在这里回看。'):'收听记录没有删除，切回全部即可查看。')+'</p>'+button(!all.length?(current?'返回播放器':'选择内容'):'查看全部',!all.length?(current?'go:NIG-04':'go:NIG-01'):'night-list:filter:all','night-home-primary')+'</section>')+
        (all.length?button('选择内容'+arrow,'go:NIG-01','nh-choose'):'')+'</article>';
    }
    function handle(action){
      if(typeof action!=='string'||!action.startsWith('night-list:'))return false;
      if(state.current!=='NIG-10'||!state.signedIn||!state.authVerified)return true;
      if(action==='night-list:back'){const trail=history.state?.trail||[];const source=[...trail.slice(0,-1)].reverse().find(id=>['NIG-01','NIG-09','TOD-09','MY-01'].includes(id));go(source||'NIG-01',false);return true;}
      if(!action.startsWith('night-list:filter:'))return true;
      const next=action.slice(18);if(!own(filters,next))return true;
      const saved={...view(),...capture(),top:0,nightHistoryFilter:next,nightHistoryOwner:owner()};
      if(!write({pageViews:{...state.pageViews,'NIG-10':saved}})){error='筛选暂时没能保存，原列表还在，请再试一次。';render();return true;}
      error='';screen.querySelector('.night-history').dataset.historyFilter=next;screen.scrollTop=0;render();
      screen.querySelector('[data-action="night-list:filter:'+next+'"]')?.focus({preventScroll:true});return true;
    }
    return {page,handle,capture};
  };
})();
