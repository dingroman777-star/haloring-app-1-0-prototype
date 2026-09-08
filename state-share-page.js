(function () {
  // The only export payload is a dated, allowlisted state description plus the user's local background.
  window.createHaloStateShare = function ({ state, go, render, screen, esc, source, write, track }) {
    const copy = value => JSON.parse(JSON.stringify(value));
    const owner = () => window.HaloTodayRhythm.ownerKey(state);
    let account = owner(), photo = null, photoToken = 0, paintToken = 0, asset = null, pending = false, message = "", problem = "", storageError = false, scrollTimer;
    const themes = [["mist", "雾白"], ["night", "深夜"], ["photo", "相册"]];
    const blank = () => ({ background: "mist", zoom: 100, source: null, entry: "TOD-03", panel: "edit", depth: 0, tops: { edit: 0, preview: 0 }, photoSelected: false });
    function book() {
      if (!state.shareEditors || typeof state.shareEditors !== "object" || Array.isArray(state.shareEditors)) state.shareEditors = { accounts: {} };
      if (!state.shareEditors.accounts || typeof state.shareEditors.accounts !== "object") state.shareEditors.accounts = {};
      if (account !== owner()) { account = owner(); photo = null; photoToken++; invalidate(); message = ""; problem = ""; }
      let value = state.shareEditors.accounts[account];
      if (!value || typeof value !== "object" || Array.isArray(value)) value = state.shareEditors.accounts[account] = blank();
      if (!themes.some(([id]) => id === value.background)) value.background = "mist";
      value.zoom = Math.max(100, Math.min(200, Number(value.zoom) || 100));
      if (!["edit", "preview"].includes(value.panel)) value.panel = "edit";
      value.depth = Math.max(0, Math.min(20, Number(value.depth) || 0));
      if (!value.tops || typeof value.tops !== "object") value.tops = { edit: 0, preview: 0 };
      if (!["TOD-01", "TOD-03", "TOD-09"].includes(value.entry)) value.entry = "TOD-03";
      return value;
    }
    function save() {
      storageError = !write({ shareEditors: state.shareEditors });
      return !storageError;
    }
    function invalidate() { paintToken++; asset = null; pending = false; }
    function allowed() { return state.signedIn && (!state.healthDeletionStatus || state.healthDeletionStatus === "ready") && state.accountDeletionStatus !== "submitted"; }
    function synchronize() {
      const value = book(), current = allowed() ? source() : null;
      if (!current) { invalidate(); value.panel = "edit"; return null; }
      if (value.source?.key !== current.key) {
        message = value.source ? "身体天气已更新，请重新预览。" : "";
        value.source = copy(current); value.panel = "edit"; invalidate(); save();
      }
      return value.source;
    }
    const dateLabel = date => `${date.slice(0, 4)}年${Number(date.slice(5, 7))}月${Number(date.slice(8))}日`;
    const text = value => `${dateLabel(value.date)} · ${value.title}\n${value.description}\nHALORING · 身体天气`;
    function currentKey() {
      const value = book();
      return JSON.stringify([account, value.source?.key, value.background, value.zoom, value.background === "photo" ? photo?.id : ""]);
    }
    const scroller = () => screen.querySelector(".state-share-page") || screen;
    function capture() { if (state.current === "TOD-10" && screen.dataset.page === "TOD-10") book().tops[book().panel] = scroller().scrollTop; }
    function historyFields(target) { return target === "TOD-10" ? { stateShareContext: { owner: owner(), key: book().source?.key, panel: book().panel, entry: book().entry, depth: book().depth } } : {}; }
    function enter(target, from) {
      capture();
      if (target === "TOD-10" && from !== target) {
        const value = book();
        if (["TOD-01", "TOD-03", "TOD-09"].includes(from)) value.entry = from;
        value.panel = "edit"; value.depth = 0; problem = ""; message = "";
      }
      if (target !== "TOD-10") { paintToken++; pending = false; }
    }
    function restore(target, context) {
      if (target !== "TOD-10") return;
      const value = book();
      if (context?.owner === owner() && context.key === value.source?.key) {
        value.depth = Math.max(0, Math.min(20, Number(context.depth) || 0));
        value.panel = context.panel === "preview" && asset?.key === currentKey() ? "preview" : "edit";
        if (["TOD-01", "TOD-03", "TOD-09"].includes(context.entry)) value.entry = context.entry;
      } else value.panel = "edit";
    }
    function update() { capture(); save(); render(); }
    function setPanel(panel, push = true) {
      capture(); book().panel = panel; if (push) book().depth++; save();
      if (push) history.pushState({ ...history.state, ...historyFields("TOD-10") }, "", location.href);
      else history.replaceState({ ...history.state, ...historyFields("TOD-10") }, "", location.href);
      render(); screen.querySelector("h1")?.focus({ preventScroll: true });
    }
    function back() {
      const value = book(); capture(); save();
      if (value.panel === "preview") { if (value.depth > 0 && history.length > 1) history.back(); else setPanel("edit", false); return; }
      if (history.state?.trail?.at(-2) === value.entry) history.go(-Math.min(value.depth + 1, history.length - 1));
      else go(value.entry, false);
    }
    function header(title) { return `<header class="state-share-head"><button type="button" data-action="share:back" aria-label="${book().panel === "preview" ? "返回编辑" : "返回"}">← ${book().panel === "preview" ? "编辑" : "返回"}</button><h1 tabindex="-1">${title}</h1></header>`; }
    function feedback() {
      return `<div class="state-share-feedback" aria-live="polite">${problem ? `<p class="state-share-error" role="alert">${esc(problem)}</p>` : ""}${message ? `<p role="status">${esc(message)}</p>` : ""}${storageError ? '<p class="state-share-error">修改暂未保存到本机，请先不要关闭页面。<button type="button" data-action="share:save-draft">重试保存</button></p>' : ""}</div>`;
    }
    function body() {
      const value = book(), content = synchronize();
      if (!content) return `${header("分享身体天气")}<section class="state-share-empty"><img src="assets/HALORING_super_symbol_copper.png" alt=""><h2>还没有可分享的身体天气</h2><p>${!allowed() ? "当前暂不能使用健康内容生成分享卡。" : "这次状态准备好后，再把它做成一张卡片。"}</p><button class="primary" type="button" data-action="share:source">查看身体天气</button></section>`;
      if (value.panel === "preview" && !asset) { value.panel = "edit"; message = "已恢复编辑，请重新预览后分享。"; }
      const preview = value.panel === "preview", needsPhoto = value.background === "photo" && !photo;
      const card = `<figure class="state-share-card"><canvas data-state-share-canvas role="img" aria-label="${esc(text(content))}"></canvas><div class="state-share-render-status" role="status">${needsPhoto ? "选择一张照片作为背景" : "正在准备图片…"}</div><figcaption class="sr-only">${esc(text(content))}</figcaption></figure>`;
      return `${header(preview ? "确认分享内容" : "分享身体天气")}<article class="state-share-page"><p class="state-share-date">${esc(dateLabel(content.date))} · ${preview ? "分享预览" : "这次状态"}</p>${card}${feedback()}${preview ? `<p class="state-share-privacy">分享的是上面这张卡片。${value.background === "photo" ? "请再检查照片中的人脸、文字和其他私人信息。" : "不含健康数值和你的感受原文。"}</p><section class="state-share-export"><button type="button" class="primary" data-action="share:system">分享图片</button><button type="button" class="secondary" data-action="share:download">保存图片</button><button type="button" class="state-share-text" data-action="share:copy">复制卡片文字</button></section><p class="state-share-local-note">${navigator.share ? "选择分享对象前，还可以取消。" : "浏览器可能不支持直接分享，可先保存图片。"}</p>` : `<fieldset class="state-share-themes"><legend>选择背景</legend><div role="group" aria-label="背景样式">${themes.map(([id, label]) => `<button type="button" data-action="share:theme:${id}" aria-pressed="${value.background === id}"><i class="theme-${id}" aria-hidden="true">${id === "photo" ? "+" : ""}</i><span>${label}</span></button>`).join("")}</div></fieldset>${value.background === "photo" ? `<section class="state-share-photo"><input type="file" id="state-share-photo" accept="image/jpeg,image/png,image/webp" hidden><button type="button" class="secondary" data-action="share:photo">${photo ? "更换照片" : "选择照片"}</button>${photo ? `<label for="state-share-zoom">照片缩放 <output>${value.zoom}%</output></label><input id="state-share-zoom" type="range" min="100" max="200" step="5" value="${value.zoom}" aria-label="照片缩放"><button type="button" class="state-share-text" data-action="share:remove-photo">移除照片</button>` : ""}<p>${needsPhoto && value.photoSelected ? "上次的照片没有保存，请重新选择。" : "照片只用于本次编辑，不会上传；刷新后需重新选择。"}</p><p>请留意照片中的人脸和文字。</p></section>` : ""}<p class="state-share-privacy">不带健康数值和你的感受原文。</p>`}</article>${!preview ? `<footer class="state-share-footer"><button class="primary state-share-preview" type="button" data-action="share:preview" ${needsPhoto ? "disabled" : ""}>${needsPhoto ? "请先选择照片" : "预览并继续"}</button></footer>` : ""}`;
    }
    function loadImage(src) {
      return new Promise((resolve, reject) => {
        const image = new Image(); const timeout = setTimeout(() => reject(new Error("image-timeout")), 6000);
        image.onload = () => { clearTimeout(timeout); resolve(image); };
        image.onerror = () => { clearTimeout(timeout); reject(new Error("image-decode")); };
        image.src = src;
      });
    }
    async function makeCanvas(content, background, zoom, image) {
      const canvas = document.createElement("canvas"); canvas.width = 1080; canvas.height = 1350;
      const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("canvas");
      const dark = background !== "mist";
      ctx.fillStyle = dark ? "#101915" : "#f1ede5"; ctx.fillRect(0, 0, 1080, 1350);
      if (background === "photo") {
        if (!image) throw new Error("photo-missing");
        const scale = Math.max(1080 / image.width, 1350 / image.height) * zoom / 100;
        ctx.drawImage(image, (1080 - image.width * scale) / 2, (1350 - image.height * scale) / 2, image.width * scale, image.height * scale);
        ctx.fillStyle = "rgba(8,18,13,.68)"; ctx.fillRect(0, 0, 1080, 1350);
      }
      const symbol = await loadImage(window.HALO_SHARE_SYMBOL_DATA || "assets/HALORING_super_symbol_copper.png");
      const size = 150, ratio = Math.min(size / symbol.width, size / symbol.height);
      ctx.drawImage(symbol, (1080 - symbol.width * ratio) / 2, 145, symbol.width * ratio, symbol.height * ratio);
      ctx.textAlign = "center"; ctx.fillStyle = dark ? "#f7f5ee" : "#28392d";
      ctx.font = "36px 'Microsoft YaHei',sans-serif"; ctx.fillText(dateLabel(content.date), 540, 404);
      ctx.font = "bold 104px 'Microsoft YaHei',sans-serif";
      let font = 104; while (ctx.measureText(content.title).width > 900 && font > 64) { font -= 4; ctx.font = `bold ${font}px 'Microsoft YaHei',sans-serif`; }
      ctx.fillText(content.title, 540, 610);
      ctx.font = "44px 'Microsoft YaHei',sans-serif";
      const lines = []; let line = "";
      for (const char of content.description) { if (ctx.measureText(line + char).width > 824) { lines.push(line); line = char; } else line += char; }
      if (line) lines.push(line);
      if (lines.length > 4) throw new Error("copy-too-long");
      lines.forEach((value, i) => ctx.fillText(value, 540, 725 + i * 68));
      ctx.font = "38px 'Microsoft YaHei',sans-serif"; ctx.fillText("HALORING", 540, 1136);
      ctx.font = "32px 'Microsoft YaHei',sans-serif"; ctx.fillText("身体天气 · 日常参考", 540, 1200);
      return canvas;
    }
    function png(canvas) { return new Promise((resolve, reject) => { canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("empty-image")), "image/png"); }); }
    function showAsset(target) {
      if (!target || !asset) return;
      target.width = asset.canvas.width; target.height = asset.canvas.height;
      target.getContext("2d").drawImage(asset.canvas, 0, 0);
      target.dataset.ready = "true";
      target.parentElement.querySelector(".state-share-render-status")?.setAttribute("hidden", "");
    }
    async function paint() {
      const target = screen.querySelector("[data-state-share-canvas]"), value = book();
      if (!target || !allowed() || !source() || value.background === "photo" && !photo) return;
      const key = currentKey(); if (asset?.key === key) { showAsset(target); return; }
      const token = ++paintToken, snapshot = copy(value.source), accountAtStart = owner();
      try {
        const canvas = await makeCanvas(snapshot, value.background, value.zoom, photo?.image), blob = await png(canvas);
        if (token !== paintToken || accountAtStart !== owner() || !allowed() || source()?.key !== snapshot.key || key !== currentKey() || state.current !== "TOD-10") return;
        asset = { key, canvas, blob, text: text(snapshot), filename: `HALORING-${snapshot.date}.png` };
        showAsset(screen.querySelector("[data-state-share-canvas]"));
        if (pending) { pending = false; problem = ""; message = ""; setPanel("preview"); }
      } catch {
        if (token !== paintToken || state.current !== "TOD-10") return;
        pending = false; problem = "图片暂时没能生成。请重试，或换一个背景。";
        const status = target.parentElement.querySelector(".state-share-render-status");
        if (status) status.textContent = problem;
        const feedback = screen.querySelector(".state-share-feedback"); if (feedback) feedback.innerHTML = `<p class="state-share-error" role="alert">${problem}</p>`;
        const button = screen.querySelector('[data-action="share:preview"]'); if (button) { button.disabled = false; button.textContent = "重新生成预览"; }
      }
    }
    function afterRender() { if (state.current === "TOD-10") { scroller().scrollTop = Number(book().tops[book().panel]) || 0; paint(); } }
    function readyAsset() {
      const value = book(), current = allowed() ? source() : null;
      if (state.current !== "TOD-10" || value.panel !== "preview" || !current || current.key !== value.source?.key || asset?.key !== currentKey()) { problem = "内容已变化，请重新预览。"; value.panel = "edit"; invalidate(); update(); return null; }
      return asset;
    }
    async function choosePhoto(file) {
      if (!file) return;
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || !file.size || file.size > 8 * 1024 * 1024) { problem = "请选择 8 MB 以内的 JPG、PNG 或 WebP 图片。"; update(); return; }
      const token = ++photoToken, accountAtStart = owner(), url = URL.createObjectURL(file);
      problem = ""; message = "正在读取照片…"; update();
      try {
        const image = await loadImage(url);
        if (image.width * image.height > 40000000) throw new Error("photo-too-large");
        if (token !== photoToken || accountAtStart !== owner() || state.current !== "TOD-10" || !allowed()) return;
        photo = { id: String(token), image }; book().background = "photo"; book().photoSelected = true; book().zoom = 100;
        invalidate(); problem = ""; message = "照片已加入，预览一下效果。"; update();
      } catch { if (token === photoToken && state.current === "TOD-10") { problem = "这张照片没能读取。可以重新选择，或改用雾白背景。"; message = ""; update(); } }
      finally { URL.revokeObjectURL(url); }
    }
    let exporting = false;
    function exportControls(busy) {
      exporting = busy;
      screen.querySelectorAll(".state-share-export button").forEach(button => { button.disabled = busy; });
      const button = screen.querySelector('[data-action="share:system"]'); if (button) button.textContent = busy ? "正在打开分享…" : "分享图片";
    }
    function shareSystem() {
      if (exporting) return;
      const result = readyAsset(); if (!result) return;
      let file, supported;
      try { file = new File([result.blob], result.filename, { type: "image/png" }); supported = navigator.share && navigator.canShare && navigator.canShare({ files: [file] }); }
      catch { problem = "当前浏览器无法直接分享图片，可以先保存图片。"; update(); return; }
      if (!supported) { problem = "当前浏览器不支持直接分享图片，请先保存图片。"; update(); return; }
      const exportOwner = owner(), key = result.key;
      exportControls(true);
      const finish = (status, note) => {
        exporting = false;
        if (exportOwner !== owner() || state.current !== "TOD-10" || key !== currentKey()) return;
        problem = ""; message = note;
        track("state_share_result", { result: status, format: "png" }); update();
      };
      try {
        // No asynchronous rendering before navigator.share: preserve the click's transient activation.
        Promise.resolve(navigator.share({ files: [file], title: "Halo 身体天气" })).then(() => finish("handed_to_system", "已交给系统分享面板。是否发送，以分享应用中的操作为准。"), error => {
          if (error?.name === "AbortError") finish("cancelled", "已取消分享，卡片和编辑选择都还在。");
          else finish("failed", "这次没有完成分享，可以重试或先保存图片。");
        });
      } catch { finish("failed", "分享面板未能打开，可以重试或先保存图片。"); }
    }
    function download() {
      const result = readyAsset(); if (!result || exporting) return;
      try {
        const url = URL.createObjectURL(result.blob), link = document.createElement("a");
        link.href = url; link.download = result.filename; document.body.append(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        message = "已发起图片下载，请在浏览器下载记录中查看。"; problem = "";
        track("state_share_download_requested", { format: "png" }); update();
      } catch { problem = "下载未能开始，请重试。卡片仍保留在这里。"; update(); }
    }
    function copyText() {
      const result = readyAsset(); if (!result || exporting) return;
      const key = result.key, copyOwner = owner();
      const done = success => {
        if (copyOwner !== owner() || key !== currentKey() || state.current !== "TOD-10") return;
        message = success ? "已复制卡片文字。" : ""; problem = success ? "" : "未能自动复制，可以长按下面的文字复制。"; update();
        if (!success) { const area = document.createElement("textarea"); area.readOnly = true; area.value = result.text; area.className = "state-share-manual-copy"; area.setAttribute("aria-label", "可手动复制的卡片文字"); screen.querySelector(".state-share-feedback").append(area); area.focus(); area.select(); }
      };
      try { if (!navigator.clipboard?.writeText) done(false); else navigator.clipboard.writeText(result.text).then(() => done(true), () => done(false)); } catch { done(false); }
    }
    function handle(action) {
      // Legacy share actions are intentionally swallowed; they cannot bypass the new preview/eligibility checks.
      if (typeof action !== "string") return false;
      if (action.startsWith("share-")) return true;
      if (!action.startsWith("share:")) return false;
      if (state.current !== "TOD-10" || !state.signedIn) return true;
      const value = book();
      if (action === "share:back") { back(); return true; }
      if (action === "share:source") { go("TOD-03"); return true; }
      if (!synchronize()) { render(); return true; }
      if (action === "share:save-draft") { save(); render(); return true; }
      if (action.startsWith("share:theme:") && value.panel === "edit") {
        const theme = action.slice(12); if (!themes.some(([id]) => id === theme)) return true;
        value.background = theme; photoToken++; invalidate(); problem = ""; message = ""; update(); return true;
      }
      if (action === "share:photo" && value.panel === "edit") { screen.querySelector("#state-share-photo")?.click(); return true; }
      if (action === "share:remove-photo") { photo = null; photoToken++; value.photoSelected = false; value.background = "mist"; value.zoom = 100; invalidate(); message = "照片已移除。"; problem = ""; update(); return true; }
      if (action === "share:preview") {
        if (value.background === "photo" && !photo || pending) return true;
        problem = ""; message = "";
        if (asset?.key === currentKey()) setPanel("preview");
        else { pending = true; const button = screen.querySelector('[data-action="share:preview"]'); if (button) { button.disabled = true; button.textContent = "正在生成预览…"; } paint(); }
        return true;
      }
      if (action === "share:system") shareSystem();
      if (action === "share:download") download();
      if (action === "share:copy") copyText();
      return true;
    }
    screen.addEventListener("change", event => { if (event.target.id === "state-share-photo" && state.current === "TOD-10") choosePhoto(event.target.files?.[0]); });
    screen.addEventListener("input", event => {
      if (event.target.id !== "state-share-zoom" || state.current !== "TOD-10") return;
      book().zoom = Math.max(100, Math.min(200, Number(event.target.value) || 100)); invalidate(); problem = "";
      const output = screen.querySelector(".state-share-photo output"); if (output) output.textContent = `${book().zoom}%`;
      if (!save()) { const box = screen.querySelector(".state-share-feedback"); if (box) box.innerHTML = feedback(); }
      paint();
    });
    screen.addEventListener("scroll", () => { if (state.current === "TOD-10") { capture(); clearTimeout(scrollTimer); scrollTimer = setTimeout(save, 150); } }, { passive: true, capture: true });
    window.addEventListener("pagehide", () => { if (state.current === "TOD-10") { capture(); save(); } });
    window.addEventListener("popstate", () => { if (location.hash.toUpperCase() === "#TOD-10" && state.current === "TOD-10") { restore("TOD-10", history.state?.stateShareContext); render(); } });
    // A preview is never a durable permission to share after refresh.
    if (book().panel === "preview") { book().panel = "edit"; message = "已恢复编辑，请重新预览后分享。"; }
    return { body, handle, enter, restore, historyFields, afterRender, back };
  };
})();
