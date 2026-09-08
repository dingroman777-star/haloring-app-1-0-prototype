/* Advisor content index; existing policy details remain in CHN-25. */
(() => {
  const KEY = "haloV5CommercialProgress";
  window.HALO_CHANNEL_CONTENT = {
    create({ state, synchronize, model, policies, escape: e, actions, feedback }) {
      let context = {}, error = "", unavailable = false, lastScope = "";
      const session = () => context.applicationContext?.() || {};
      const onPage = () => session().signedIn && session().page === "CHN-24";
      const revision = () => JSON.stringify([model().stamp, state.selectedPolicyId]);
      const expanded = () => {
        let view = history.state?.channelContentPreview;
        if (view?.scope !== model().scope) { try { view = JSON.parse(sessionStorage.getItem("haloChannelContentView")); } catch { view = null; } }
        return view?.scope === model().scope && view.open === true;
      };
      function read() {
        const saved = window.haloChannelStorage.read();
        if (!saved || typeof saved !== "object" || Array.isArray(saved)) throw new Error("Content context unavailable");
        return saved;
      }
      function refresh() { read(); synchronize(); unavailable = false; }
      function observe(ctx) {
        context = { ...context, ...ctx };
        if (!onPage()) return;
        if (lastScope !== model().scope) { lastScope = model().scope; error = ""; }
        try { refresh(); } catch { unavailable = true; }
      }
      function render() {
        const v = model();
        const head = '<header class="screen-head commercial-head"><div><button class="back" data-action="previous" aria-label="返回上一页">← 返回</button><span class="page-context">体验顾问</span><h1>内容与政策</h1></div></header>';
        const wrap = body => `${head}<div class="stack commercial-stack"><div class="channel-content" data-content-revision="${e(revision())}">${body}</div></div>`;
        if (unavailable) return wrap(`${feedback("内容暂时无法打开", "本地记录未能读取，请重试。已有资料不会被改动。", "plain")}${actions([["重新加载", "commercial:content-retry", "primary"], ["联系客服", "commercial:content-help", "secondary"]])}`);
        if (!v.active) return wrap(`${feedback(v.title, v.detail, "plain")}${actions([[v.label, "commercial:content-status", "primary"], ["联系客服", "commercial:content-help", "secondary"]])}`);
        const education = policies.education;
        const preview = expanded() ? `<div class="content-previews" id="content-preview" tabindex="-1">${education.points.map((point, index) => {
          const split = point.indexOf("："), title = split > 0 ? point.slice(0, split) : `介绍卡 ${index + 1}`, body = split > 0 ? point.slice(split + 1) : point;
          return `<article class="content-preview-card"><span aria-hidden="true">0${index + 1}</span><div><h3>${e(title)}</h3><p>${e(body)}</p></div></article>`;
        }).join("")}<button class="secondary" data-action="commercial:content-open:education">查看完整介绍与说明</button></div>` : '<div id="content-preview" hidden></div>';
        const guides = [["health", "怎么介绍 Halo，哪些话不能说", "表达指南", "01"], ["service", "订单、售后与合作期间的服务约定", "服务约定", "02"]];
        return wrap(`<section class="content-feature"><div class="content-section-heading"><span>给客户看的</span><small>本地示例</small></div><div class="content-feature-title"><span class="content-card-symbol" aria-hidden="true">▤</span><div><h2>客户介绍卡</h2><p>认识 Halo · 开始使用 · 遇到问题</p></div></div><button class="content-preview-toggle" data-action="commercial:content-preview" aria-expanded="${expanded()}" aria-controls="content-preview"><span>${expanded() ? "收起介绍卡" : "预览 3 张介绍卡"}</span><span aria-hidden="true">${expanded() ? "−" : "+"}</span></button>${preview}</section><section class="content-guides"><h2>顾问需要了解的</h2><div class="content-list">${guides.map(([id, description, tag, icon]) => `<button class="content-guide" data-action="commercial:content-open:${id}"><span class="content-guide-number" aria-hidden="true">${icon}</span><span><small>${tag}</small><strong>${e(policies[id].title)}</strong><span>${description}</span></span><i aria-hidden="true">›</i></button>`).join("")}</div></section><p class="content-note">这里展示的是内容示例，正式分享请使用 Halo 已发布的素材。</p><p id="content-action-error" role="alert">${e(error)}</p><button class="text-button content-help" data-action="commercial:content-help">内容有疑问？联系客服</button>`);
      }
      function handleAction(command, value, ctx) {
        if (!command.startsWith("content-") && command !== "policy-open") return false;
        context = { ...context, ...ctx };
        if (!onPage()) return true;
        if (command === "content-help") { context.go("HELP-03"); return true; }
        const old = document.querySelector(".channel-content")?.dataset.contentRevision;
        try { refresh(); } catch { unavailable = true; context.render(); return true; }
        if (command === "content-retry") { error = ""; context.render(); return true; }
        if (old !== revision()) { error = "身份或内容选择已变化，请按当前页面继续。"; context.render(); context.flash(error); return true; }
        if (command === "content-status") { context.go(model().route); return true; }
        if (!model().active) { context.render(); return true; }
        if (command === "content-preview") {
          const open = !expanded();
          const view = { scope: model().scope, open };
          history.replaceState({ ...history.state, channelContentPreview: view }, "", location.href);
          error = "";
          try { sessionStorage.setItem("haloChannelContentView", JSON.stringify(view)); } catch { error = "展开状态暂未保存，刷新后可能收起。"; }
          context.render(); document.querySelector('[data-action="commercial:content-preview"]')?.focus(); return true;
        }
        if (["content-open", "policy-open"].includes(command)) {
          if (!Object.hasOwn(policies, value)) { error = "这份内容暂时找不到，请选择列表中的内容。"; context.render(); return true; }
          try {
            const saved = read();
            for (const key of ["applicationSnapshot", "channelIdentity", "channelActivation", "activationRequest", "selectedPolicyId"]) {
              if (JSON.stringify(saved[key] ?? null) !== JSON.stringify(state[key] ?? null)) throw new Error("Changed context");
            }
            const next = { ...saved, selectedPolicyId: value, channelContentSelection: { scope: model().scope, policyId: value } };
            window.haloChannelStorage.commit(next);
            Object.assign(state, next); error = ""; context.go("CHN-25");
          } catch { error = "暂未打开这份内容，请再点一次重试。原来的选择仍保留。"; context.render(); }
          return true;
        }
        return true;
      }
      return { observe, render, handleAction };
    }
  };
})();
