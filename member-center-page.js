(function () {
  "use strict";
  const LEVELS = [
    ["Halo Member", "光环会员", 0], ["Halo Premier", "进阶会员", 600],
    ["Halo Signature", "臻选会员", 2000], ["Halo Prestige", "私享会员", 5000],
    ["Halo Muse", "共创会员", 10000], ["Halo Luminary", "领航会员", 20000],
  ];
  const icons = {
    back: '<path d="m14 5-7 7 7 7"/>', arrow: '<path d="m9 5 7 7-7 7"/>',
    gift: '<path d="M3 9h18v4H3zM5 13v8h14v-8M12 9v12"/><path d="M12 9C5 9 4 3 8 3c3 0 4 6 4 6Zm0 0s1-6 4-6c4 0 3 6-4 6Z"/>',
    task: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v4H9zM8 12l2 2 4-4M8 18h8"/>',
    badge: '<circle cx="12" cy="9" r="6"/><path d="m8 14-1 7 5-3 5 3-1-7"/>',
    people: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v3"/>',
  };
  const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
  const integer = value => Number.isSafeInteger(value) && value >= 0;
  const number = value => value === null ? "—" : value.toLocaleString("zh-CN");

  window.HALO_MEMBER_CENTER = {
    create({ storageKey, escape: esc }) {
      let retried = false;
      // Reading this page must never initialize, upgrade, repair or save a ledger.
      function snapshot(ctx) {
        return window.HALO_MEMBER_DATA.snapshot(ctx, {storageKey});
      }
      const open = (id, content, cls = "", label = "") => `<button class="${cls}" data-action="commercial:member-open:${id}"${label ? ` aria-label="${esc(label)}"` : ""}>${content}</button>`;
      const row = (id, name, title, detail) => open(id, `<span class="mc-row-icon">${icon(name)}</span><span class="mc-row-copy"><strong>${esc(title)}</strong><small>${esc(detail)}</small></span>${icon("arrow")}`, "mc-row");
      function render(ctx) {
        const assets = snapshot(ctx), never = ctx.membershipState === "never-bound", retained = ctx.membershipState === "unbound-retained";
        const active = Boolean(ctx.hardwareActive), known = assets.level !== null;
        const level = known ? LEVELS[assets.level] : null, next = known && assets.level < 5 ? LEVELS[assets.level + 1] : null;
        const progress = next && assets.growth !== null ? Math.min(100, assets.growth / next[2] * 100) : null;
        const remaining = next && assets.growth !== null ? Math.max(0, next[2] - assets.growth) : null;
        const upgradeCopy = remaining > 0 ? `距${next[1]}还差 ${number(remaining)} 成长值` : assets.level >= 2 ? "成长值已达标，查看其他条件" : "成长值已达标，查看升级状态";
        const growthBody = `<span class="mc-growth-label"><span>HALO成长值</span><strong>${number(assets.growth)}</strong></span>${progress !== null && active ? `<span class="mc-progress" role="meter" aria-label="成长值进度（不含附加条件）" aria-valuemin="0" aria-valuemax="${next[2]}" aria-valuenow="${Math.min(assets.growth, next[2])}"><i style="width:${progress}%"></i></span><span class="mc-growth-next">${esc(upgradeCopy)}${icon("arrow")}</span>` : `<span class="mc-growth-note">${never ? "连接并激活后，开始累计成长" : retained ? "已获成长保留，重新激活后继续累计" : known && assets.level === 5 ? "已达最高等级" : "会员资料暂未取得"}</span>`}`;
        const growth = active && next && assets.growth !== null ? open("MEM-03", growthBody, "mc-growth", "查看升级条件") : `<div class="mc-growth">${growthBody}</div>`;
        const error = assets.unavailable ? `<section class="mc-error" role="status"><p>${retried ? "仍未取得完整会员资料，请稍后再试。" : "部分会员资料暂未取得，请重新加载。"}</p><button data-action="commercial:member-retry">重新加载</button></section>` : "";
        const connect = !active ? open("DEV-01", `${retained ? "重新连接 Halo Ring" : "连接 Halo Ring"}${icon("arrow")}`, "mc-connect") : "";
        return `<article class="member-center-page"><header class="mc-header"><button data-action="previous" aria-label="返回">${icon("back")}</button><h1>会员中心</h1><span></span></header>
          <section class="mc-membership"><div class="mc-identity"><span>${known ? `L${assets.level + 1} · ${level[1]}` : "会员身份待获取"}</span><h2>${known ? level[0] : "Halo 会员"}</h2></div>${growth}${connect}<div class="mc-level-link">${open("MEM-02", `六级会员${icon("arrow")}`, "", "查看六级会员")}</div></section>
          ${error}<div class="mc-accounts">${open("PTS-01", `<span>Halo Points</span><strong>${number(assets.points)}</strong><small>${assets.pending ? "积分使用已暂停" : "可用积分"}${icon("arrow")}</small>`, "mc-account mc-points", "查看 Halo Points")}${open("MEM-07", `${icon("gift")}<strong>我的权益</strong><small>查看当前权益${icon("arrow")}</small>`, "mc-account mc-benefits", "查看我的权益")}</div>
          ${assets.pending ? open("PTS-02", `有 ${number(assets.pending)} 积分待调整，查看原因${icon("arrow")}`, "mc-adjustment") : ""}
          <section class="mc-growth-section"><h2>我的成长</h2><div class="mc-rows">${row("MEM-04", "task", "会员任务", active ? "查看今天、本周与本月的任务" : "查看任务，激活后开始累计成长")}${row("MEM-06", "badge", "成长徽章", assets.badges === null ? "徽章记录待获取" : assets.badges ? `已获得 ${number(assets.badges)} 枚${retained ? " · 已保留" : ""}` : never ? "激活后开始记录" : "尚未获得徽章")}</div></section>
          <div class="mc-referral">${row("REF-01", "people", "邀请朋友", "查看邀请与奖励进度")}</div></article>`;
      }
      function handle(command, value, ctx) {
        if (!["member-open", "member-retry"].includes(command)) return false;
        if (!document.querySelector('#screen[data-page="MEM-01"]')) return true;
        if (command === "member-retry") {
          retried = true; ctx.track("member_center_retry", { source_page: "MEM-01", simulated: true }); ctx.render();
          requestAnimationFrame(() => document.querySelector('[data-action="commercial:member-retry"]')?.focus());
        } else if (["MEM-02", "MEM-03", "MEM-04", "MEM-06", "MEM-07", "PTS-01", "PTS-02", "REF-01", "DEV-01"].includes(value)) {
          ctx.track("member_center_entry_opened", { source_page: "MEM-01", destination: value }); ctx.go(value);
        }
        return true;
      }
      return { render, handle, snapshot, upgradeSnapshot:ctx => snapshot(ctx, true) };
    },
  };
})();
