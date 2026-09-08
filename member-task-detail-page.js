(function () {
  "use strict";
  const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${name === "back" ? '<path d="m14 5-7 7 7 7"/>' : name === "check" ? '<path d="m5 12 4 4 10-10"/>' : name === "alert" ? '<circle cx="12" cy="12" r="9"/><path d="M12 7v6m0 4h.01"/>' : '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'}</svg>`;
  const reasons={duplicate:"同一行为重复记录",invalid_record:"任务记录未通过有效性核验",system_error:"奖励记录有误",order_refund:"关联订单已退款"};
  const formatDate = value => Number.isFinite(Date.parse(value)) && Date.parse(value)<=Date.now() ? new Intl.DateTimeFormat("zh-CN",{timeZone:"Asia/Shanghai",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(value)):"待确认";
  window.HALO_MEMBER_TASK_DETAIL={
    create({snapshot,escape:esc}) {
      let feedback="",lastKey="",lastFingerprint="",refreshing=false;
      const button=(label,command,cls="secondary")=>`<button class="${cls} mtd-button" data-action="commercial:task-detail-${command}">${esc(label)}</button>`;
      function model(ctx) {
        const d=snapshot(ctx);if(!d)return null;
        const r=d.record,done=["posted","restored"].includes(r.status),adjusted=["adjusted","reviewing"].includes(r.status);
        const reached=r.progress && r.progress.value>=r.progress.max;
        const title=!d.trusted ? "进度暂未取得":done && r.receipt.amount===0 ? "奖励已确认":done && r.receipt.offset===r.receipt.amount ? "奖励已记录":done ? r.label:adjusted && !d.correction ? "调整记录待核对":adjusted || r.status === "validating" || r.status === "invitation" ? r.label:!ctx.hardwareActive ? ctx.membershipState === "unbound-retained" ? "成长记录已暂停":"激活后开始记录":reached ? "记录已达到要求":r.label;
        const detail=!d.trusted ? "暂时无法核对这项任务的进度，可以重新加载或先了解完成方法。":done ? r.receipt.amount===0 ? "本次记录的积分为 0，具体情况可在积分明细中查看。":r.receipt.offset===r.receipt.amount ? "本次积分已用于抵扣待调整积分，可用积分未增加。":"奖励记录已确认，不需要重复完成。":adjusted && !d.correction ? "具体调整原因、数量和时间暂未取得，可联系客服核对。":r.status === "reviewing" ? "复核结果更新后会显示在这里。复核期间，本次调整继续生效。":r.status === "adjusted" ? "查看下方调整记录。如有疑问，可联系企业微信客服核对。":r.status === "validating" ? "本次任务记录正在核验，暂不需要重复完成。":r.status === "invitation" ? "共创核验与奖励到账分开确认，奖励以本次邀请及确认记录为准。":!ctx.hardwareActive ? "连接并激活后，记录新的有效行为；已有奖励保留。":reached ? "记录达到要求，仍需核验确认，暂不代表奖励已到账。":d.id === "cocreation" ? "共创按正式邀请参加，不按月重复。":d.method[1];
        return {...d,done,adjusted,title,detail};
      }
      function render(ctx) {
        const d=model(ctx),key=d?.viewKey || "empty";
        if(key!==lastKey){feedback="";lastFingerprint="";lastKey=key;}
        const fingerprint=JSON.stringify(d && [d.record,d.correction,d.trusted]);
        if(refreshing){feedback=!d ? "请重新选择要查看的任务。":!d.trusted ? "暂未取得进度，请稍后重试。":fingerprint===lastFingerprint ? "进度暂无变化，未确认的记录请稍后再看。":"记录已更新，请查看当前状态。";refreshing=false;}
        lastFingerprint=fingerprint;
        const header=`<header class="mtd-header"><button data-action="previous" aria-label="返回">${icon("back")}</button><h1>任务详情</h1><button data-action="commercial:task-detail-refresh">刷新</button></header>`;
        if(!d)return `<article class="member-task-detail-page">${header}<section class="mtd-empty">${icon("alert")}<h2>请重新选择任务</h2><p>任务选择已失效或未取得，回到任务中心后重新选择。</p>${button("返回任务中心","center","primary")}</section></article>`;
        const r=d.record,receipt=r.receipt;
        const reward=receipt ? `<section class="mtd-receipt"><h2>本次积分记录</h2><dl><div><dt>${r.status === "restored" ? "恢复积分":"记录积分"}</dt><dd>+${receipt.amount} Points</dd></div>${Number.isSafeInteger(receipt.offset) && receipt.offset>=0 && receipt.offset<=receipt.amount ? `<div><dt>抵扣待调整积分</dt><dd>${receipt.offset} Points</dd></div><div><dt>本次增加可用积分</dt><dd>+${receipt.amount-receipt.offset} Points</dd></div>`:'<div><dt>可用积分变化</dt><dd>待确认</dd></div>'}<div><dt>任务记录时间</dt><dd>${formatDate(receipt.occurred_at)}</dd></div><div><dt>积分记入时间</dt><dd>${formatDate(receipt.posted_at)}</dd></div></dl><small>时间为北京时间；成长记录可在会员中心查看。</small></section>`:"";
        const correction=d.adjusted ? `<section class="mtd-correction"><h2>本次调整</h2><dl><div><dt>原因</dt><dd>${esc(typeof reasons[d.correction?.reasonCode]==="string" ? reasons[d.correction.reasonCode]:"具体原因待确认")}</dd></div><div><dt>积分调整</dt><dd>${d.correction ? d.correction.amount+" Points":"数量待确认"}</dd></div><div><dt>处理时间</dt><dd>${d.correction ? formatDate(d.correction.posted_at):"待确认"}</dd></div><div><dt>当前状态</dt><dd>${esc(r.label)}</dd></div></dl><p>如需复核，请在收到调整通知后 15 个自然日内联系企业微信客服。复核期间调整继续生效。</p></section>`:"";
        const cta=d.done ? button("查看积分明细","points","primary"):d.adjusted || r.status === "validating" ? button("联系支持","support","primary"):!ctx.hardwareActive ? button("连接 Halo Ring","connect","primary"):button(d.method[2],"do","primary");
        return `<article class="member-task-detail-page">${header}<section class="mtd-heading"><p>${esc(d.period)}${d.id === "cocreation" ? "":" · 北京时间"}</p><h2>${esc(d.task.title)}</h2></section><section class="mtd-status ${d.done ? "is-done":d.adjusted ? "is-adjusted":""}"><span class="mtd-status-symbol">${icon(d.done ? "check":d.adjusted ? "alert":"clock")}</span><h2>${esc(d.title)}</h2><p>${esc(d.detail)}</p>${r.progress ? `<div class="mtd-progress-copy">${esc(r.progress.text)}</div><div class="mtd-meter" role="meter" aria-label="有效记录进度，不代表奖励已到账" aria-valuemin="0" aria-valuemax="${r.progress.max}" aria-valuenow="${r.progress.value}"><i style="width:${r.progress.value/r.progress.max*100}%"></i></div>`:""}</section><p class="mtd-feedback" role="status" aria-live="polite">${esc(feedback)}</p>${reward}${correction}<section class="mtd-standard"><h2>任务奖励标准</h2>${d.task.points ? `<div><span><b>+${d.task.growth}</b> 成长值</span><span><small>最高</small> <b>+${d.task.points}</b> Points</span></div><p>完成并确认后记录；常规任务积分每月最多 2,000 Points。</p>`:'<p>奖励以本次正式邀请公布内容为准。</p>'}</section><details class="mtd-method" ${history.state?.memberTaskMethod?.key===key && history.state.memberTaskMethod.open ? "open":""}><summary>完成方法与注意事项</summary><div><strong>${esc(d.method[0])}</strong><p>${esc(d.method[1])}</p></div></details><div class="mtd-actions">${cta}${d.done ? button("查看我的成长","growth"):button("返回任务中心","center")}</div></article>`;
      }
      function handle(command,value,ctx) {
        if(typeof command!=="string" || !command.startsWith("task-detail-"))return false;
        if(!document.querySelector('#screen[data-page="MEM-05"]'))return true;
        const op=command.slice(12),d=model(ctx),screen=document.getElementById("screen");
        if(op === "refresh") {const top=screen.scrollTop;refreshing=true;ctx.render();requestAnimationFrame(()=>{screen.scrollTop=top;screen.querySelector('[data-action="commercial:task-detail-refresh"]')?.focus({preventScroll:true});});ctx.track("member_task_detail_refreshed",{task_id:d?.id || null,simulated:true});return true;}
        if(op === "center"){ctx.go("MEM-04");return true;}
        if(!d){ctx.render();return true;}
        const route=op === "points" && d.done ? "PTS-02":op === "growth" && d.done ? "MEM-03":op === "support" ? "HELP-03":op === "connect" && !ctx.hardwareActive ? "DEV-01":op === "do" && !d.done && !d.adjusted && d.record.status!=="validating" ? ctx.hardwareActive ? d.method[3]:"DEV-01":null;
        if(route){ctx.track("member_task_detail_action_opened",{task_id:d.id,destination:route});ctx.go(route);}else ctx.render();return true;
      }
      document.addEventListener("toggle",event=>{if(event.target.isConnected && document.querySelector('#screen[data-page="MEM-05"]')?.contains(event.target) && event.target.matches?.('.mtd-method'))history.replaceState({...history.state,memberTaskMethod:{key:lastKey,open:event.target.open}},"",location.href);},true);
      return {render,handle};
    },
    historyFields:route=>route === "MEM-05" && history.state?.memberTaskMethod ? {memberTaskMethod:history.state.memberTaskMethod}:{}
  };
})();
