/* NIG-09: read-only morning handoff. No automatic health conclusion or alarm mutation. */
(() => {
  'use strict';
  window.createHaloNightMorning = function ({state,active,esc,symbol,closedReceipt,pendingSnooze}) {
    const arrow='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>';
    function recordState() {
      if(!active())return {kind:'unbound',title:'连接戒指，开始记录睡眠',body:'还没连接也没关系，今日内容仍可查看。',label:'连接 Halo Ring',route:'DEV-01'};
      if(state.deviceStatus==='syncing')return {kind:'syncing',title:'戒指正在同步',body:'先去今日看看，记录会随同步更新。',label:'查看同步进度',route:'DEV-10'};
      if(state.deviceStatus==='connecting')return {kind:'connecting',title:'正在连接戒指',body:'已有记录仍可查看。',label:'查看连接状态',route:'DEV-10'};
      if(state.deviceStatus==='disconnected'||state.toggles.bluetooth===false)return {kind:'disconnected',title:state.toggles.bluetooth===false?'手机蓝牙尚未开启':'戒指暂未连接',body:'已有记录仍可查看，连接后再同步新记录。',label:'查看连接与同步',route:'DEV-10'};
      if(state.deviceStatus==='action')return {kind:'action',title:'同步还需要处理',body:'已有记录不会丢失。',label:'查看连接与同步',route:'DEV-10'};
      if(state.dataLifecycle==='none')return {kind:'none',title:'还没有睡眠记录',body:'戴着戒指睡一晚，醒来后打开 App 同步。',label:'查看连接与同步',route:'DEV-10'};
      if(state.dataLifecycle==='limited')return {kind:'limited',title:'部分记录还不完整',body:'先看已有记录，也可以检查同步情况。',label:'查看连接与同步',route:'DEV-10'};
      if(['accumulating','baseline'].includes(state.dataLifecycle))return {kind:'baseline',title:'身体天气还在建立中',body:'已同步的睡眠等记录，可以先查看。',label:'查看健康记录',route:'HLT-00'};
      return null;
    }
    function page() {
      const receipt=closedReceipt(),now=new Date(),closed=receipt&&new Date(receipt.closedAt).toDateString()===now.toDateString();
      const pending=pendingSnooze(),hour=now.getHours();
      const greeting=hour>=5&&hour<12?'早上好':closed?'醒来啦':'你好';
      const status=recordState();
      const alarmNote=pending?'<button class="nm-alarm-link" data-action="go:NIG-08">'+(Date.parse(pending.dueAt)>Date.now()?'还有一次稍后提醒':'稍后提醒时间已到')+arrow+'</button>':closed?'<p class="nm-confirm"><span aria-hidden="true">✓</span> 本次提醒已关闭</p>':'';
      return '<article class="night-home night-morning" data-morning-state="'+(status?.kind||'ready')+'"><header class="nm-header"><button data-action="go:NIG-01">回到夜间</button></header><section class="nm-hero"><img src="'+esc(symbol)+'" alt=""><h1>'+greeting+'</h1>'+alarmNote+'</section>'+
        '<div class="nm-primary"><button class="night-home-primary" data-action="go:TOD-01">前往今日'+arrow+'</button></div>'+
        (status?'<section class="nm-record"><h2>'+status.title+'</h2><p>'+status.body+'</p><button data-action="go:'+status.route+'">'+status.label+arrow+'</button></section>':'')+
        '<button class="nm-history" data-action="go:NIG-10"><span>回看播放记录</span>'+arrow+'</button></article>';
    }
    return {page};
  };
})();
