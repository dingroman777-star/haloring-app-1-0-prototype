/* Content reading marker is local only, not legal consent or a publication receipt. */
(() => {
  const KEY = "haloV5CommercialProgress";
  window.HALO_CHANNEL_POLICY = {
    create({ state, synchronize, model, policies, actions, feedback, escape: e }) {
      let context = {}, error = "", unavailable = false, fallback = false, copying = false, last = "", generation = 0;
      const session = () => context.applicationContext?.() || {};
      const onPage = () => session().signedIn && session().page === "CHN-25";
      const selected = () => {
        const id = state.selectedPolicyId, selection = state.channelContentSelection;
        return selection?.scope === model().scope && selection.policyId === id && Object.hasOwn(policies, id) ? { id, ...policies[id] } : null;
      };
      const contentKey = () => JSON.stringify(selected());
      const revision = () => JSON.stringify([model().stamp, state.selectedPolicyId, state.channelContentSelection, contentKey()]);
      const records = () => Array.isArray(state.channelContentReads) ? state.channelContentReads : [];
      const marker = () => records().find(row => row?.scope === model().scope && row.policyId === selected()?.id && row.contentKey === contentKey() && row.local === true && typeof row.readAt === "string" && Number.isFinite(Date.parse(row.readAt)));
      const text = () => { const p = selected(); return p ? `${p.id === "education" ? "【客户介绍卡 · 本地示例，非正式发布素材】" : "【顾问学习备忘 · 本地示例，不作为客户宣传素材】"}\n${p.title}\n${p.body}\n${p.points.join("\n")}\n${p.id === "education" ? "正式介绍请使用 Halo 已发布的素材。" : "本地阅读标记不代表同意协议或完成签约。"}` : ""; };
      function read() {
        const saved = window.haloChannelStorage.read();
        if (!saved || typeof saved !== "object" || Array.isArray(saved)) throw new Error("Unavailable");
        return saved;
      }
      function refresh() { read(); synchronize(); unavailable = false; }
      function observe(ctx) {
        context = { ...context, ...ctx };
        if (!onPage()) { if (last) { last = ""; generation++; copying = false; fallback = false; error = ""; } return; }
        try { refresh(); } catch { unavailable = true; }
        if (last !== revision()) { last = revision(); generation++; copying = false; fallback = false; error = ""; }
      }
      function render() {
        const p = selected(), v = model(), valid = !unavailable && v.active && p;
        const head = `<header class="screen-head commercial-head"><div><button class="back" data-action="previous" aria-label="返回上一页">← 返回</button><span class="page-context">${valid && p.id === "education" ? "客户介绍卡" : "顾问学习"}</span><h1>${valid ? e(p.title) : "内容详情"}</h1></div></header>`;
        const wrap = body => `${head}<div class="stack commercial-stack"><div class="channel-policy" data-policy-revision="${e(revision())}">${body}</div></div>`;
        if (unavailable) return wrap(`${feedback("内容暂时无法读取", "请重试，原阅读记录仍保留。", "plain")}${actions([["重新加载", "commercial:policy-retry", "primary"], ["返回内容列表", "commercial:policy-list", "secondary"]])}`);
        if (!v.active) return wrap(`${feedback(v.title, v.detail, "plain")}${actions([[v.label, "commercial:policy-status", "primary"], ["联系客服", "commercial:policy-help", "secondary"]])}`);
        if (!p) return wrap(`${feedback("请重新选择要看的内容", "这条入口未能匹配具体内容，不会为你打开其他文件。", "plain")}${actions([["返回内容列表", "commercial:policy-list", "primary"]])}`);
        const edu = p.id === "education", marked = marker();
        const labels = edu ? ["认识 Halo", "开始使用", "遇到问题"] : p.id === "health" ? ["可以介绍", "不要承诺"] : ["推荐与收益", "售后与调整", "合作状态"];
        return wrap(`<div class="policy-meta"><span>本地内容示例</span><small>${edu ? "客户介绍用途" : "顾问内部学习"}</small></div><article class="policy-article"><p class="policy-lead">${e(p.body)}</p><div class="policy-points">${p.points.map((point, index) => `<section class="policy-point ${p.id === "health" && index === 1 ? "is-caution" : ""}"><span aria-hidden="true">${p.id === "health" ? index === 0 ? "✓" : "!" : `0${index + 1}`}</span><div><h2>${e(labels[index] || `要点 ${index + 1}`)}</h2><p>${e(edu ? point.replace(/^[^：]+：/, "") : point)}</p></div></section>`).join("")}</div></article>${edu ? '<p class="policy-note">正式对外分享请使用 Halo 已发布的素材。</p>' : `<section class="policy-reading" aria-live="polite"><span>${marked ? "✓ 已标记读过" : "尚未标记读过"}</span><small>仅记录本机阅读状态，不代表同意协议。</small></section>${actions([[marked ? "已标记读过" : "标记已读", "commercial:policy-read", "primary", Boolean(marked)]])}`}${actions([[copying ? "正在复制…" : edu ? "复制介绍卡示例" : "复制本页备忘", "commercial:policy-copy", edu ? "primary" : "secondary", copying]])}<p id="policy-action-feedback" role="status">${e(error)}</p>${fallback ? `<section class="policy-copy-fallback"><label for="policy-copy-text">可选中文字后手动复制</label><textarea id="policy-copy-text" readonly rows="7">${e(text())}</textarea></section>` : ""}<button class="text-button policy-help" data-action="commercial:policy-help">对内容有疑问？联系客服</button>`);
      }
      function guard() {
        if (!onPage()) return false;
        const visible = document.querySelector(".channel-policy")?.dataset.policyRevision;
        try { refresh(); } catch { unavailable = true; context.render(); return false; }
        if (visible !== revision()) { context.render(); context.flash("内容或身份已变化，请重新核对。"); return false; }
        return model().active && Boolean(selected());
      }
      async function copy() {
        if (copying) return;
        const expected = revision(), token = generation, payload = text();
        copying = true; error = ""; fallback = false; context.render();
        let success = false;
        try { if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable"); await navigator.clipboard.writeText(payload); success = true; } catch { /* manual fallback below */ }
        if (!onPage() || token !== generation) return;
        try { refresh(); } catch { unavailable = true; }
        if (unavailable || expected !== revision() || !model().active) { copying = false; context.render(); return; }
        copying = false; fallback = !success;
        error = success ? "已复制本页示例文字，尚未发送给任何人。" : "自动复制未成功，可以在下方选中文字手动复制。";
        context.render(); if (fallback) { const field = document.getElementById("policy-copy-text"); field?.focus(); field?.select(); }
      }
      function handleAction(command, ctx) {
        if (!["policy-read", "policy-copy", "policy-list", "policy-help", "policy-status", "policy-retry"].includes(command)) return false;
        context = { ...context, ...ctx };
        if (!onPage()) return true;
        if (command === "policy-list") { context.go("CHN-24"); return true; }
        if (command === "policy-help") { context.go("HELP-03"); return true; }
        if (command === "policy-retry") { try { refresh(); } catch { unavailable = true; } context.render(); return true; }
        if (command === "policy-status") { try { refresh(); context.go(model().route); } catch { unavailable = true; context.render(); } return true; }
        if (!guard()) return true;
        if (command === "policy-copy") { void copy(); return true; }
        if (command === "policy-read") {
          if (selected().id === "education" || marker()) return true;
          try {
            const saved = read();
            for (const key of ["applicationSnapshot", "channelIdentity", "channelActivation", "activationRequest", "selectedPolicyId", "channelContentSelection", "channelContentReads"]) if (JSON.stringify(saved[key] ?? null) !== JSON.stringify(state[key] ?? null)) throw new Error("Changed context");
            if (saved.channelContentReads != null && !Array.isArray(saved.channelContentReads)) throw new Error("Invalid reading records");
            const record = { scope: model().scope, policyId: selected().id, contentKey: contentKey(), readAt: new Date().toISOString(), local: true };
            const next = { ...saved, channelContentReads: [...records().filter(row => !(row?.scope === record.scope && row.policyId === record.policyId && row.contentKey === record.contentKey)), record] };
            window.haloChannelStorage.commit(next); Object.assign(state, next); error = "已保存本机阅读标记。";
          } catch { error = "阅读标记暂未保存，请重试。原记录没有改变。"; }
          context.render(); return true;
        }
        return true;
      }
      return { observe, render, handleAction };
    }
  };
})();
