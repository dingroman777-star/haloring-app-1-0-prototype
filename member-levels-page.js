(function () {
  "use strict";
  const LEVELS = [
    { name:"光环会员", english:"Halo Member", growth:0, condition:"完成账号注册并确认协议，即成为光环会员。", benefits:["Halo Points、商城与会员推荐", "公开课程与活动、标准客服"] },
    { name:"进阶会员", english:"Halo Premier", growth:600, condition:"累计 600 HALO成长值。", benefits:["1.1 倍消费返积分", "公开活动优先报名、会员内容"] },
    { name:"臻选会员", english:"Halo Signature", growth:2000, condition:"累计 2,000 HALO成长值。", benefits:["1.2 倍消费返积分", "个性化报告模板、深度内容", "新功能体验候选资格"] },
    { name:"私享会员", english:"Halo Prestige", growth:5000, extra:"附加条件：任意 2 枚成长徽章", condition:"累计 5,000 HALO成长值，并获得任意 2 枚成长徽章。", benefits:["1.3 倍消费返积分、Halo Private Care", "私享课程与活动、新产品优先体验"] },
    { name:"共创会员", english:"Halo Muse", growth:10000, extra:"附加条件：正式访谈、内测或共创", condition:"累计 10,000 HALO成长值，并至少完成 1 次正式访谈、内测或共创。", benefits:["1.5 倍消费返积分", "内测与访谈优先、正式产品共创", "闭门工作坊、优先服务"] },
    { name:"领航会员", english:"Halo Luminary", growth:20000, extra:"附加条件：3 枚徽章及深度共创或品牌项目", condition:"累计 20,000 HALO成长值，获得任意 3 枚成长徽章，并完成 1 次深度共创或品牌项目。", benefits:["2.0 倍消费返积分", "品牌顾问团与深度共创", "最高优先级新品体验、专属服务"] },
  ];
  const arrow = direction => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${direction === "left" ? "m14 5-7 7 7 7" : "m8 10 4 4 4-4"}"/></svg>`;
  const format = value => value === null ? "—" : value.toLocaleString("zh-CN");
  window.HALO_MEMBER_LEVELS = {
    historyFields: route => route === "MEM-02" && history.state?.memberLevelsView ? { memberLevelsView:history.state.memberLevelsView } : {},
    create({ snapshot, escape: esc }) {
      let retryMessage = "";
      const viewKey = ctx => [ctx.applicationContext?.().accountRef || "", ctx.memberCreatedAt || "", ctx.membershipState || ""].join("|");
      function expanded(ctx) {
        const view = history.state?.memberLevelsView;
        return view?.key === viewKey(ctx) && /^[0-5]$/.test(String(view.open)) ? Number(view.open) : null;
      }
      const action = (label, route, type = "primary") => `<button class="${type} ml-cta" data-action="commercial:levels-open:${route}">${esc(label)}</button>`;
      function render(ctx) {
        const assets = snapshot(ctx), known = assets.level !== null && assets.growth !== null;
        const active = Boolean(ctx.hardwareActive), retained = ctx.membershipState === "unbound-retained", never = ctx.membershipState === "never-bound";
        const current = assets.level !== null ? LEVELS[assets.level] : null, next = current && assets.level < 5 ? LEVELS[assets.level + 1] : null;
        const remaining = known && next ? Math.max(0, next.growth - assets.growth) : null;
        const progress = known && next && active ? `<div class="ml-meter" role="meter" aria-label="成长值进度，不含附加条件" aria-valuemin="0" aria-valuemax="${next.growth}" aria-valuenow="${Math.min(assets.growth, next.growth)}"><i style="width:${Math.min(100, assets.growth / next.growth * 100)}%"></i></div>` : "";
        const explanation = !known ? "会员资料暂未取得，可先查看六级介绍。" : retained ? "已获等级与成长保留，重新激活后继续累计。" : never ? "连接并激活 Halo Ring 后，开始累计成长。" : !next ? "你已达到最高等级，已有成长继续保留。" : remaining ? `距${next.name}还差 ${format(remaining)} 成长值` : "成长值已达标，查看升级条件与确认状态。";
        const nextAction = !known ? '<button class="secondary ml-cta" data-action="commercial:levels-retry">重新加载</button>' : !active ? action(retained ? "重新连接 Halo Ring" : "连接 Halo Ring", "DEV-01", "secondary") : next ? action("查看我的升级条件", "MEM-03") : action("查看我的权益", "MEM-07");
        const open = expanded(ctx);
        return `<article class="member-levels-page"><header class="ml-header"><button data-action="previous" aria-label="返回">${arrow("left")}</button><h1>六级会员</h1><span></span></header>
          <section class="ml-current"><div class="ml-current-title"><span>当前等级</span><strong>${current ? `L${assets.level + 1}` : "—"}</strong></div><h2>${current ? current.name : "会员身份待获取"}</h2>${current ? `<p class="ml-english">${current.english}</p>` : ""}<div class="ml-value"><span>HALO成长值</span><strong>${format(assets.growth)}</strong></div>${progress}<p class="ml-explanation">${esc(explanation)}</p>${active && next?.extra ? `<p class="ml-extra">${next.extra}</p>` : ""}${nextAction}${!known && retryMessage ? `<p class="ml-retry-result" role="status">${retryMessage}</p>` : ""}</section>
          <div class="ml-list-heading"><h2>完整等级路径</h2><span>点开查看条件与权益</span></div><ol class="ml-path">${LEVELS.map((level, index) => `<li class="ml-level ${assets.level === index ? "is-current" : ""}"><div class="ml-marker" aria-hidden="true">${index + 1}</div><div class="ml-level-main"><button class="ml-level-button" data-action="commercial:levels-toggle:${index}" aria-expanded="${open === index}" aria-controls="ml-level-${index}"><span class="ml-level-copy"><strong>${level.name}${assets.level === index ? '<em>当前等级</em>' : ""}</strong><small>${level.english}</small><span>${index ? `${format(level.growth)} 成长值${level.extra ? "＋附加条件" : ""}` : "注册即成为会员"}</span></span>${arrow("down")}</button><div class="ml-level-detail" id="ml-level-${index}" ${open === index ? "" : "hidden"}><h3>达到条件</h3><p>${level.condition}${index && !active ? "需已绑定并激活 Halo 硬件。" : ""}</p><h3>等级权益说明</h3><ul>${level.benefits.map(benefit => `<li>${benefit}</li>`).join("")}</ul></div></div></li>`).join("")}</ol>
          <p class="ml-boundary">成长值用于升级，Halo Points 用于抵扣或兑换。核心健康功能不按会员等级限制。</p>${!(active && known && !next) ? action("查看我的权益", "MEM-07", "secondary") : ""}</article>`;
      }
      function handle(command, value, ctx) {
        if (!["levels-open", "levels-toggle", "levels-retry"].includes(command)) return false;
        if (!document.querySelector('#screen[data-page="MEM-02"]')) return true;
        if (command === "levels-open") {
          if (!["MEM-03", "MEM-07", "DEV-01"].includes(value)) return true;
          const assets = snapshot(ctx);
          if (value === "MEM-03" && (!ctx.hardwareActive || assets.level === null || assets.growth === null || assets.level === 5)) { ctx.render(); return true; }
          ctx.track("member_levels_entry_opened", { source_page:"MEM-02", destination:value }); ctx.go(value); return true;
        }
        const screen = document.getElementById("screen"), top = screen.scrollTop;
        if (command === "levels-toggle") {
          if (!/^[0-5]$/.test(value)) return true;
          const index = Number(value), willOpen = expanded(ctx) !== index;
          const selector = `[data-action="commercial:levels-toggle:${index}"]`;
          const anchorTop = screen.querySelector(selector)?.getBoundingClientRect().top;
          history.replaceState({ ...history.state, memberLevelsView:{ key:viewKey(ctx), open:willOpen ? index : null } }, "", location.href);
          ctx.track("member_level_details_toggled", { level:`L${index + 1}`, expanded:willOpen });
          ctx.render(); requestAnimationFrame(() => {
            screen.scrollTop = top;
            const button = screen.querySelector(selector);
            if (button && Number.isFinite(anchorTop)) screen.scrollTop += button.getBoundingClientRect().top - anchorTop;
            button?.focus({ preventScroll:true });
          });
        } else {
          retryMessage = "仍未取得完整会员资料，请稍后再试。";
          ctx.track("member_levels_retry", { source_page:"MEM-02", simulated:true }); ctx.render();
          requestAnimationFrame(() => screen.querySelector('[data-action="commercial:levels-retry"], .ml-level-button')?.focus({ preventScroll:true }));
        }
        return true;
      }
      return { render, handle };
    },
  };
})();
