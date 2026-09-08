/* Promotion rehearsal only. Real links, attribution and publication require backend receipts. */
(() => {
  const KEY = "haloV5CommercialProgress", LINK = "https://haloring.example/advisor/DEMO-001", IMAGE = "assets/channel-tools-demo.svg";
  window.HALO_CHANNEL_TOOLS = {
    create({ state, synchronize, model, actions, feedback, escape: e }) {
      let context = {}, error = "", unavailable = false, busy = "", manual = false, last = "", generation = 0, imageFailed = false, imageAttempt = 0;
      const session = () => context.applicationContext?.() || {};
      const onPage = () => session().signedIn && session().page === "CHN-26";
      const revision = () => JSON.stringify([model().stamp, state.channelPromotion]);
      const demo = () => model().active && state.channelPromotion?.scope === model().scope && state.channelPromotion.mode === "demo" && state.channelPromotion.code === "DEMO-001" && state.channelPromotion.url === LINK && state.channelPromotion.qrAsset === IMAGE;
      const copyText = () => `【Halo 推广工具演示 · 不可用于真实推广】\n示例编号：DEMO-001\n${LINK}\n.example 示例地址无法访问，不产生客户归属或收益。`;
      function refresh() {
        const saved = window.haloChannelStorage.read();
        if (!saved || typeof saved !== "object" || Array.isArray(saved)) throw new Error("Unavailable");
        synchronize(); unavailable = false;
      }
      function observe(ctx) {
        context = { ...context, ...ctx };
        if (!onPage()) { if (last) { last = ""; generation++; busy = ""; manual = false; error = ""; } return; }
        try { refresh(); } catch { unavailable = true; }
        if (last !== revision()) { last = revision(); generation++; busy = ""; manual = false; error = ""; imageFailed = false; }
      }
      function render() {
        const v = model();
        const head = '<header class="screen-head commercial-head"><div><button class="back" data-action="previous" aria-label="返回上一页">← 返回</button><span class="page-context">体验顾问</span><h1>推广工具</h1></div></header>';
        const wrap = body => `${head}<div class="stack commercial-stack"><div class="channel-tools" data-tools-revision="${e(revision())}">${body}</div></div>`;
        if (unavailable) return wrap(`${feedback("推广资料暂时无法读取", "请重试，已有资料不会被改动。", "plain")}${actions([["重新加载", "commercial:tools-refresh", "primary"], ["联系客服", "commercial:tools-help", "secondary"]])}`);
        if (!v.active) return wrap(`${feedback(v.title, v.detail, "plain")}${actions([[v.label, "commercial:tools-status", "primary"], ["联系客服", "commercial:tools-help", "secondary"]])}`);
        const identity = `<div class="tools-identity"><span>Halo 体验顾问</span><small>${v.simulated ? "演示身份" : "身份已生效"}</small></div>`;
        const content = demo() ? `<section class="tools-card"><span class="tools-label">演示名片 · 不可用于推广</span>${imageFailed ? '<div class="tools-image-error"><p>演示图片暂未加载</p><button class="secondary" data-action="commercial:tools-image-retry">重新加载图片</button></div>' : `<img class="tools-qr" src="${IMAGE}?attempt=${imageAttempt}" alt="DEMO-001 演示二维码，示例地址无法访问">`}<button class="text-button tools-download" data-action="commercial:advisor-qr-save" ${busy || imageFailed ? "disabled" : ""}>${busy === "download" ? "正在准备图片…" : "下载演示图片"}</button></section><section class="tools-link"><div><h2>演示链接</h2><small>无法访问</small></div><p>${LINK}</p>${actions([[busy === "copy" ? "正在复制…" : "复制演示链接", "commercial:advisor-link-copy", "primary", Boolean(busy)]])}</section><p class="tools-note">这些操作仅供预览，不会建立客户归属或产生收益。</p>` : `<section class="tools-empty"><span aria-hidden="true">↗</span><h2>${state.channelPromotion ? "推广资料待核对" : "推广工具尚未就绪"}</h2><p>${state.channelPromotion ? "这份资料暂时无法与当前身份对应，请联系客服核对。" : "暂未收到你的专属链接和二维码。可以先了解分享内容，或联系客服查询。"}</p></section>${actions([["重新查看推广资料", "commercial:tools-refresh", "primary"]])}`;
        return wrap(`${identity}${content}<p id="tools-feedback" role="status">${e(error)}</p>${manual ? `<section class="tools-copy-fallback"><label for="tools-copy-text">可选中下方文字手动复制</label><textarea id="tools-copy-text" readonly rows="5">${e(copyText())}</textarea></section>` : ""}<div class="tools-links"><button data-action="commercial:tools-content"><span>先看内容与政策</span><i aria-hidden="true">›</i></button><button data-action="commercial:tools-identity"><span>查看顾问身份</span><i aria-hidden="true">›</i></button><button data-action="commercial:tools-help"><span>推广问题联系客服</span><i aria-hidden="true">›</i></button></div>`);
      }
      function guard() {
        if (!onPage()) return false;
        const visible = document.querySelector(".channel-tools")?.dataset.toolsRevision;
        try { refresh(); } catch { unavailable = true; context.render(); return false; }
        if (visible !== revision()) { context.render(); context.flash("身份或推广资料已变化，请重新查看。"); return false; }
        return true;
      }
      async function exportDemo(kind) {
        if (busy || !demo()) return;
        const expected = revision(), token = generation;
        busy = kind; manual = false; error = ""; context.render();
        const current = () => { try { refresh(); } catch { unavailable = true; } return onPage() && generation === token && expected === revision() && demo() && !unavailable; };
        let objectUrl = "";
        try {
          if (kind === "copy") {
            if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
            await navigator.clipboard.writeText(copyText());
            if (current()) error = "已复制演示文字，尚未发送给任何人。";
          } else {
            const response = await fetch(IMAGE, { cache: "no-store" });
            if (!response.ok) throw new Error("Image unavailable");
            objectUrl = URL.createObjectURL(await response.blob());
            const img = new Image(); img.src = objectUrl; await img.decode();
            const canvas = document.createElement("canvas"); canvas.width = 720; canvas.height = 860;
            const drawing = canvas.getContext("2d"); if (!drawing) throw new Error("Canvas unavailable");
            drawing.drawImage(img, 0, 0, canvas.width, canvas.height);
            const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png")); if (!blob) throw new Error("Export failed");
            if (!current()) return;
            const downloadUrl = URL.createObjectURL(blob), link = document.createElement("a");
            link.href = downloadUrl; link.download = "Halo-DEMO-001-演示不可推广.png"; link.click();
            setTimeout(() => URL.revokeObjectURL(downloadUrl), 30000);
            error = "已发起图片下载，请在浏览器下载记录中查看。";
          }
        } catch {
          if (current()) { manual = kind === "copy"; error = kind === "copy" ? "自动复制未成功，可在下方手动复制。" : "图片下载未开始，请重试。"; }
        } finally {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          if (onPage() && generation === token) { busy = ""; context.render(); if (manual) { const field = document.getElementById("tools-copy-text"); field?.focus(); field?.select(); } }
        }
      }
      function handleAction(command, ctx) {
        if (!command.startsWith("tools-") && !["advisor-link-copy", "advisor-qr-save"].includes(command)) return false;
        context = { ...context, ...ctx };
        if (!onPage()) return true;
        if (command === "tools-help") { context.go("HELP-03"); return true; }
        if (command === "tools-refresh") { try { refresh(); error = demo() ? "已重新读取本地演示资料。" : "已重新查看，暂未取得可用的推广资料。"; } catch { unavailable = true; } context.render(); return true; }
        if (!guard()) return true;
        if (command === "tools-image-retry" && demo()) { imageFailed = false; imageAttempt++; context.render(); return true; }
        if (command === "tools-status") { context.go(model().route); return true; }
        if (!model().active) return true;
        if (command === "tools-content") context.go("CHN-24");
        if (command === "tools-identity") context.go("CHN-17");
        if (command === "advisor-link-copy") void exportDemo("copy");
        if (command === "advisor-qr-save") void exportDemo("download");
        return true;
      }
      document.addEventListener("error", event => { if (onPage() && event.target?.classList?.contains("tools-qr")) { imageFailed = true; context.render(); } }, true);
      return { observe, render, handleAction };
    }
  };
})();
