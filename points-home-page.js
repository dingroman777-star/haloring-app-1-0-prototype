(function () {
  "use strict";
  const integer = value => Number.isSafeInteger(value) && value >= 0;
  const paths = {back:'<path d="m14 5-7 7 7 7"/>', arrow:'<path d="m9 5 7 7-7 7"/>', gift:'<path d="M3 9h18v4H3zM5 13v8h14v-8M12 9v12"/><path d="M12 9C5 9 4 3 8 3c3 0 4 6 4 6Zm0 0s1-6 4-6c4 0 3 6-4 6Z"/>', task:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="m8 12 2 2 5-5M8 18h8"/>', bag:'<path d="M4 7h16l1 14H3ZM8 8V6a4 4 0 0 1 8 0v2"/>', clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'};
  const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
  window.HALO_POINTS_HOME = {
    create({storageKey, escape:esc, sync}) {
      let feedback = "", lastScope = "";
      function read(ctx) {
        try {
          const login=JSON.parse(localStorage.getItem("haloV5AppProgress") || "null"), data=JSON.parse(localStorage.getItem(storageKey) || "null");
          const account=ctx.applicationContext?.().accountRef, registration=ctx.memberCreatedAt || "";
          const scope=account+"|"+registration;
          if(scope!==lastScope){lastScope=scope;feedback="";}
          if(!account || !login?.signedIn || !login.authVerified || (login.authPhone || login.authForm?.phone)!==account || (login.memberCreatedAt || "")!==registration || ctx.applicationContext?.().signedIn!==true) return {unavailable:true};
          if(ctx.newMember && (!registration || data?.memberAssets?.registrationId!==registration)) return {unavailable:true};
          const owners=[data?.accountRef,data?.memberAssets?.accountRef].filter(Boolean);
          if(!data || !owners.length || owners.some(owner=>owner!==account) || (data.memberAssets?.registrationId && data.memberAssets.registrationId!==registration) || !integer(data.pointsBalance) || !integer(data.pendingPointsCorrection ?? 0)) return {unavailable:true};
          sync(data); // Refresh memory only; viewing never posts, repairs or saves assets.
          return {balance:data.pendingPointsCorrection>0 ? 0:data.pointsBalance,pending:data.pendingPointsCorrection || 0,data,account,scope};
        } catch { return {unavailable:true}; }
      }
      const button=(route,body,cls="",disabled=false)=>`<button class="${cls}" data-action="commercial:points-home-open:${route}"${disabled?' disabled':''}>${body}</button>`;
      function render(ctx) {
        const s=read(ctx), blocked=s.pending>0, unavailable=s.unavailable;
        const amount=unavailable ? "—":s.balance.toLocaleString("zh-CN");
        return `<article class="points-home-page"><header class="ph-header"><button data-action="previous" aria-label="返回">${icon("back")}</button><h1>Halo Points</h1>${button("PTS-02","明细")}</header>
          <section class="ph-balance" aria-label="可用积分"><span>可用积分</span><strong>${amount}</strong><p>${unavailable?"积分信息暂未取得":blocked?"积分使用暂时暂停":s.balance===0?"还没有可用积分，先看看如何获得": "把积累的积分，用在喜欢的体验上"}</p></section>
          ${unavailable?'<section class="ph-notice" role="status"><strong>暂时无法查看积分</strong><p>请重新读取；原有积分不会因此改变。</p></section>':blocked?`<section class="ph-notice"><strong>还有 ${s.pending.toLocaleString("zh-CN")} 积分待调整</strong><p>后续获得的积分会先抵扣这部分，抵扣完成后恢复使用。其他功能照常使用。</p>${button("PTS-02",`查看调整记录 ${icon("arrow")}`)}${button("HELP-03","对调整有疑问？联系支持")}</section>`:""}
          <div class="ph-feedback" role="status">${esc(feedback)}</div>
          <div class="ph-main-actions">${button("PTS-03",`${icon("gift")}<strong>去兑换</strong><small>${blocked?"调整完成后可用":unavailable?"取得积分后可用":"看看积分能换什么"}</small>`,"ph-redeem",blocked||unavailable)}${button("MEM-04",`${icon("task")}<strong>赚积分</strong><small>查看任务与奖励</small>`,"ph-earn")}</div>
          <section class="ph-services">${button("SEL-01",`${icon("bag")}<span><strong>购物时用积分</strong><small>${blocked?"可以逛逛，积分抵扣暂不可用":"选购喜欢的商品，结算时抵扣"}</small></span>${icon("arrow")}`,"ph-row")}
          <div class="ph-expiry">${icon("clock")}<span><strong>积分有效期</strong><small>${!unavailable && s.balance===0?"暂无可用积分需要安排使用":"到期明细暂未取得，暂不显示到期数量"}</small></span></div></section>
          <details class="ph-rules"><summary>积分怎么用</summary><p>100 积分可抵 ¥1。普通在售商品每单最多抵扣现金售价的 30%，具体可用金额以结算页为准。</p><p>指定内容可全积分兑换。积分不能充值、提现或转让。</p><p>日常任务、消费返还和会员推荐积分自入账起有效 24 个月；活动积分以发放时说明为准。</p></details>
          <button class="ph-refresh" data-action="commercial:points-home-refresh">重新读取积分</button></article>`;
      }
      function handle(command,value,ctx) {
        if(!["points-home-open","points-home-refresh"].includes(command)) return false;
        if(document.querySelector('#screen')?.dataset.page!=="PTS-01")return true;
        const s=read(ctx);
        if(command==="points-home-refresh") {feedback=s.unavailable?"仍未取得积分信息，请稍后重试。":"已重新读取当前积分。";ctx.render();return true;}
        if(!["PTS-02","PTS-03","MEM-04","SEL-01","HELP-03"].includes(value)) return true;
        if(value==="PTS-03" && (s.unavailable || s.pending>0)) {feedback="积分状态已变化，请先查看当前状态。";ctx.render();return true;}
        if(s.unavailable && value==="PTS-02"){feedback="积分信息暂未取得，请重新读取后再试。";ctx.render();return true;}
        ctx.go(value);return true;
      }
      return {render,handle,read};
    }
  };
})();
