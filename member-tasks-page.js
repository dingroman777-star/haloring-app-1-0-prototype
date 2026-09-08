(function () {
  "use strict";
  const PERIODS = {today:"今天",week:"本周",month:"本月"};
  const METHODS = {
    "wear-12h":["佩戴累计满 12 小时","佩戴并同步戒指，确认有效记录后更新。","查看设备与同步","DEV-10"],
    "night-repair":["完成一次 AI 睡前修复","需已激活硬件并完成修复流程。公共助眠内容不计入此任务。","前往夜间","NIG-01"],
    "weekly-feedback":["阅读周报告并提交反馈","需要本周报告及反馈记录。当前原型尚未接入完整周报告反馈入口，可联系客服了解进度。","联系支持","HELP-03"],
    "wear-5days":["一周累计 5 个有效佩戴日","有效佩戴日以设备记录确认为准，不必连续。","查看设备与同步","DEV-10"],
    "monthly-review":["完成一次月度状态回顾","可先查看月度报告，回顾反馈入口尚未开放。已有回顾记录仍可同步奖励；仅打开报告不计入任务。","查看我的报告","TOD-09"],
    cocreation:["按正式邀请参加","共创按邀请安排，不按月重复。正式访谈、产品测试或共创按邀请说明参与，完成后需核验。","联系支持","HELP-03"]
  };
  const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${name === "back" ? '<path d="m14 5-7 7 7 7"/>' : name === "check" ? '<path d="m5 12 4 4 10-10"/>' : name === "night" ? '<path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/>' : '<rect x="5" y="4" width="14" height="17" rx="3"/><path d="M9 3h6v4H9zM9 12h6M9 16h4"/>'}</svg>`;
  const keyFor = (period, now=Date.now()) => {const d=new Date(now+8*3600000);if(period === "week") d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,period === "month" ? 7:10);};
  window.HALO_MEMBER_TASKS = {
    historyFields: route => ["MEM-04","MEM-05"].includes(route) && history.state?.memberTasksView ? {memberTasksView:history.state.memberTasksView}: {},
    create({storageKey,tasks,escape:esc,recovery}) {
      let feedback="", retrying=false, feedbackScope="";
      const scope = ctx => [ctx.applicationContext?.().accountRef || "",ctx.memberCreatedAt || ""].join("|");
      function view(ctx) {const v=history.state?.memberTasksView;return v?.key === scope(ctx) && PERIODS[v.period] ? v : {key:scope(ctx),period:"today",open:null,task:null};}
      function saveView(ctx,patch) {history.replaceState({...history.state,memberTasksView:{...view(ctx),...patch}},"",location.href);}
      function read(ctx) {
        return window.HALO_MEMBER_DATA.read(ctx, {storageKey});
      }
      const sameOwner = (row,source) => row && typeof row === "object" && (!Object.hasOwn(row,"accountRef") || row.accountRef===source.account) && (!Object.hasOwn(row,"registrationId") || row.registrationId===source.registration);
      function record(id,ctx,source=read(ctx)) {
        const task=tasks[id],period=keyFor(task.period),s=source.data;
        if(id === "cocreation") {
          const invitation=s.cocreationInvitation,labels={invited:"已收到正式邀请",submitted:"共创记录核验中",verified:"共创记录已核验"};
          return source.trusted && invitation?.id && invitation.accountRef===source.account && sameOwner(invitation,source) && typeof labels[invitation.status]==="string" ? {status:"invitation",label:labels[invitation.status]}:{status:"unknown",label:"正式邀约记录待取得"};
        }
        if(!source.trusted || s.taskPeriods?.[id]!==period) return {status:"unknown",label:ctx.hardwareActive ? "等待本期记录":"激活后开始记录"};
        const status=s.taskStates?.[id],labels={available:"尚未完成",validating:"奖励确认中",posted:"奖励已到账",restored:"奖励已恢复",adjusted:"奖励已调整",reviewing:"奖励复核中"};
        if(status === undefined || status === null) return {status:"unknown",label:"等待本期记录"};
        if(typeof labels[status]!=="string") return {status:"unknown",label:"任务状态待核对"};
        let receipt=null;
        if(["posted","restored"].includes(status)) {
          const entries=Array.isArray(s.pointsTransactions)?s.pointsTransactions:[];
          const rows=entries.filter(r=>r?.id===`task:${id}:${period}:${status === "restored" ? "restored":"reward"}`),r=rows[0];
          receipt=rows.length===1 && sameOwner(r,source) && Number.isSafeInteger(r.amount) && r.amount>=0 && r.amount<=task.points && Number.isSafeInteger(r.offset) && r.offset>=0 && r.offset<=r.amount && (!Object.hasOwn(r,"growth") || r.growth===task.growth) && Number.isFinite(Date.parse(r.occurred_at)) && Date.parse(r.occurred_at)<=Date.parse(r.posted_at) && keyFor(task.period,Date.parse(r.occurred_at))===period && Number.isFinite(Date.parse(r.posted_at)) && Date.parse(r.posted_at)<=Date.now() ? r:null;
          if(!receipt) return {status:"unknown",label:"奖励记录待核对"};
        }
        const p=s.taskProgress?.[id];let progress=null;
        if(status === "available" && p?.accountRef===source.account && sameOwner(p,source) && p.periodKey===period && Number.isFinite(Date.parse(p.updatedAt)) && Date.parse(p.updatedAt)<=Date.now() && Number.isSafeInteger(p.value) && p.value>=0) {
          if(id === "wear-12h" && p.unit === "minutes" && p.value<=1440) progress={value:Math.min(720,p.value),max:720,text:`已记录 ${Math.floor(p.value/60)} 小时 ${p.value%60} 分`};
          if(id === "wear-5days" && p.unit === "days" && p.value<=7) progress={value:Math.min(5,p.value),max:5,text:`已记录 ${p.value} 个有效佩戴日`};
        }
        return {status,label:labels[status],progress,receipt};
      }
      function dateLabel(period) {
        const key=keyFor(period);
        if(period === "today") return `${Number(key.slice(5,7))}月${Number(key.slice(8))}日 · 每日任务`;
        if(period === "month") return `${Number(key.slice(5))}月 · 每月任务`;
        const end=new Date(Date.parse(key+"T00:00:00Z")+6*86400000).toISOString().slice(5,10);
        return `${key.slice(5).replace("-","/")}—${end.replace("-","/")} · 周一至周日`;
      }
      function render(ctx) {
        if(feedbackScope!==scope(ctx)){feedback="";feedbackScope=scope(ctx);}
        const v=view(ctx),period=PERIODS[v.period] ? v.period:"today",source=read(ctx);
        const ids=Object.keys(tasks).filter(id=>tasks[id].period===period);
        return `<article class="member-tasks-page"><header class="mt-header"><button data-action="previous" aria-label="返回">${icon("back")}</button><h1>会员任务</h1><button class="mt-refresh" data-action="commercial:tasks-refresh">刷新</button></header>
          ${recovery.pending(ctx).length ? `<section class="mt-notice" role="status"><strong>有已完成的记录待同步奖励</strong><p>完成记录已保存，重新同步不会重复获得奖励。</p><button data-action="commercial:tasks-retry-records" ${retrying ? "disabled" : ""}>${retrying ? "正在同步…" : "重新同步"}</button></section>` : ""}
          ${!ctx.hardwareActive ? `<section class="mt-notice"><strong>${ctx.membershipState === "unbound-retained" ? "重新连接后，继续积累成长":"连接 Halo Ring，开启成长"}</strong><p>${ctx.membershipState === "unbound-retained" ? "已有成长保留，解绑期间不累计新的成长。":"先了解任务，激活后开始记录。"}</p><button data-action="commercial:tasks-connect">${ctx.membershipState === "unbound-retained" ? "重新连接":"连接 Halo Ring"}</button></section>`:""}
          <div class="mt-tabs" role="tablist" aria-label="任务周期">${Object.entries(PERIODS).map(([id,label])=>`<button role="tab" id="mt-tab-${id}" aria-controls="mt-panel" aria-selected="${id===period}" tabindex="${id===period ? 0:-1}" data-action="commercial:tasks-period:${id}">${label}</button>`).join("")}</div>
          <div class="mt-period"><h2>${dateLabel(period)}</h2><span>北京时间</span></div><p class="mt-feedback" role="status">${esc(feedback)}</p>${ctx.hardwareActive && !source.trusted ? '<p class="mt-unavailable">任务进度暂未取得，可先查看完成方法。</p>':""}
          <section id="mt-panel" role="tabpanel" aria-labelledby="mt-tab-${period}" class="mt-list">${ids.map(id=>{
            const task=tasks[id],r=record(id,ctx,source),method=METHODS[id],done=["posted","restored"].includes(r.status),expanded=v.open===id;
            const label=done ? "查看奖励记录":["adjusted","reviewing","validating"].includes(r.status) ? "查看处理进度":"查看任务详情";
            return `<section class="mt-card"><div class="mt-title"><span class="mt-icon ${done ? "done":""}">${icon(done ? "check":id==="night-repair" ? "night":"task")}</span><h3>${esc(task.title)}</h3></div><p class="mt-reward">${task.points ? `<span>+${task.growth} 成长值</span><span>最高 +${task.points} Points</span>`:"奖励以正式邀请说明为准"}</p><div class="mt-state ${done ? "done":""}">${done ? icon("check"):""}<span>${esc(r.progress?.text || r.label)}</span></div>${r.progress && ctx.hardwareActive ? `<div class="mt-meter" role="meter" aria-label="${esc(task.title)}记录进度" aria-valuemin="0" aria-valuemax="${r.progress.max}" aria-valuenow="${r.progress.value}"><i style="width:${100*r.progress.value/r.progress.max}%"></i></div>`:""}
            <div class="mt-actions"><button class="mt-how" aria-expanded="${expanded}" aria-controls="mt-method-${id}" data-action="commercial:tasks-how:${id}">完成方法 ${expanded ? "−":"＋"}</button><button class="mt-detail" data-action="commercial:tasks-detail:${id}">${label} ›</button></div><div id="mt-method-${id}" class="mt-method" ${expanded ? "":"hidden"}><strong>${method[0]}</strong><p>${method[1]}</p><button class="secondary" data-action="commercial:tasks-do:${id}">${ctx.hardwareActive ? method[2]:"连接 Halo Ring"}</button></div></section>`;
          }).join("")}</section><p class="mt-footnote">有效记录确认后自动更新奖励，无需领取。常规任务积分每月最多 2,000 Points，实际到账以奖励记录为准。</p></article>`;
      }
      function handle(command,value,ctx) {
        if(!["tasks-period","tasks-how","tasks-detail","tasks-do","tasks-refresh","tasks-connect","tasks-retry-records"].includes(command)) return false;
        if(!document.querySelector('#screen[data-page="MEM-04"]')) return true;
        const screen=document.getElementById("screen"),top=screen.scrollTop;
        if(command === "tasks-retry-records") {
          if(retrying)return true;
          const owner=scope(ctx);retrying=true;feedback="正在同步已完成的记录…";ctx.render();
          Promise.resolve().then(()=>recovery.retry(ctx)).catch(()=>false).then(ok=>{
            retrying=false;
            if(scope(ctx)!==owner || !read(ctx).validSession) {feedback="";if(document.querySelector('#screen[data-page="MEM-04"]'))ctx.render();return;}
            feedback=ok ? "奖励记录已同步。" : "暂未同步成功，完成记录仍已保存，请稍后重试。";
            if(document.querySelector('#screen[data-page="MEM-04"]')) {ctx.render();requestAnimationFrame(()=>{screen.scrollTop=top;screen.querySelector('[data-action="commercial:tasks-retry-records"], .mt-refresh')?.focus({preventScroll:true});});}
            ctx.track("member_task_reward_retry",{success:ok,simulated:true});
          });return true;
        }
        if(command === "tasks-connect") {ctx.go("DEV-01");return true;}
        if(command === "tasks-period") {if(!PERIODS[value])return true;saveView(ctx,{period:value,open:null});feedback="";ctx.render();requestAnimationFrame(()=>document.getElementById(`mt-tab-${value}`)?.focus({preventScroll:true}));return true;}
        if(command === "tasks-refresh") {feedback=read(ctx).trusted ? "已重新读取本期记录，尚未确认的进度请稍后再看。":"任务进度暂未取得，请稍后再试。";ctx.render();requestAnimationFrame(()=>{screen.scrollTop=top;screen.querySelector('.mt-refresh')?.focus({preventScroll:true});});ctx.track("member_tasks_refreshed",{simulated:true});return true;}
        if(!tasks[value] || tasks[value].period!==view(ctx).period)return true;
        if(command === "tasks-how") {saveView(ctx,{open:view(ctx).open===value?null:value});ctx.render();requestAnimationFrame(()=>{screen.scrollTop=top;screen.querySelector(`[data-action="commercial:tasks-how:${value}"]`)?.focus({preventScroll:true});});return true;}
        if(command === "tasks-do") {ctx.track("member_task_action_opened",{task_id:value});ctx.go(ctx.hardwareActive ? METHODS[value][3]:"DEV-01");return true;}
        saveView(ctx,{task:value,taskPeriodKey:value === "cocreation" ? "invitation":keyFor(tasks[value].period)});ctx.track("member_task_details_opened",{task_id:value});ctx.go("MEM-05");return true;
      }
      document.addEventListener("keydown",event=>{
        const button=event.target.closest?.('.mt-tabs [role="tab"]');if(!button || !["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;
        event.preventDefault();event.stopImmediatePropagation();const buttons=[...button.parentElement.children],i=buttons.indexOf(button);buttons[event.key==="Home"?0:event.key==="End"?2:(i+(event.key==="ArrowRight"?1:2))%3].click();
      });
      function selected(ctx) {
        const v=view(ctx),id=v.task;
        if(Object.hasOwn(tasks,id) && v.taskPeriodKey===(id === "cocreation" ? "invitation":keyFor(tasks[id].period)))return id;
        if(history.state?.memberTasksView || location.hash!=="#MEM-05")return null;
        const query=new URLSearchParams(location.search),target=query.get("memberTask"),period=query.get("memberTaskPeriod");
        return Object.hasOwn(tasks,target) && period===(target === "cocreation" ? "invitation":keyFor(tasks[target].period)) ? target:null;
      }
      function detailSnapshot(ctx) {
        const id=selected(ctx);if(!id)return null;
        const source=read(ctx),r=record(id,ctx,source),task=tasks[id],period=keyFor(task.period);
        const entries=Array.isArray(source.data.pointsTransactions)?source.data.pointsTransactions:[];
        const correction=["adjusted","reviewing"].includes(r.status) ? entries.find(row=>row?.correction===true && row.id===`task:${id}:${period}:correction` && sameOwner(row,source) && Number.isSafeInteger(row.amount) && row.amount<0 && row.amount>=-task.points && Number.isFinite(Date.parse(row.occurred_at)) && keyFor(task.period,Date.parse(row.occurred_at))===period && Date.parse(row.occurred_at)<=Date.parse(row.posted_at) && Date.parse(row.posted_at)<=Date.now()):null;
        return {id,task,record:r,trusted:source.trusted,method:METHODS[id],period:id === "cocreation" ? "按正式邀请安排":dateLabel(task.period),correction,viewKey:scope(ctx)+"|"+id+"|"+(view(ctx).taskPeriodKey || (id === "cocreation" ? "invitation":period))};
      }
      return {render,handle,record,method:id=>METHODS[id],selected,detailSnapshot};
    }
  };
})();
