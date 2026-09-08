/* CHN-12: local-only file preview and simulated submission; file bytes are never persisted or uploaded. */
(() => {
  window.HALO_CHANNEL_SUPPLEMENT = {
    create({ state, persist, synchronize, current, actions, feedback, escape: e }) {
      let context = {}, scope = null, lastPage = "", error = "", selecting = false, preview = false, timer = null, autoReturn = "", selectionVersion = 0;
      const files = new Map();
      const session = () => context.applicationContext?.() || {};
      const account = () => `${session().key || ""}|${session().accountRef || ""}`;
      const id = () => state.applicationSnapshot?.id || "";
      const requirement = () => {
        const record = state.applicationSnapshot, supplied = record?.supplementRequest;
        return supplied && supplied.applicationId === id() && supplied.status === "requested" ? supplied : {};
      };
      const stamp = () => JSON.stringify([id(), account(), requirement()]);
      const allowed = () => Boolean(session().signedIn && id() && current().stage === "needs-info" && typeof requirement().id === "string" && requirement().id && typeof requirement().title === "string" && requirement().title);
      const own = () => state.applicationSupplement?.scope === stamp() ? state.applicationSupplement : null;
      const pending = () => own()?.request?.status === "pending";
      const ready = () => { const file = own()?.attachment; return Boolean(file && (file.demo === true || files.has(file.id))); };
      const onPage = () => session().page === "CHN-12";
      const matches = () => allowed() && onPage() && scope === stamp() && document.querySelector("[data-supplement-scope]")?.dataset.supplementScope === stamp();
      const button = (label, command, kind = "secondary", disabled = false) => actions([[label, `commercial:${command}`, kind, disabled]]);
      function repaint(focus) {
        if (!onPage()) return;
        const top = document.getElementById("screen")?.scrollTop || 0;
        context.render?.();
        if (document.getElementById("screen")) document.getElementById("screen").scrollTop = top;
        if (focus) document.querySelector(focus)?.focus({ preventScroll: true });
      }
      function release(fileId) { const file = files.get(fileId); if (file?.url) URL.revokeObjectURL(file.url); files.delete(fileId); }
      function save(next) {
        const previous = state.applicationSupplement;
        state.applicationSupplement = next;
        if (persist()) return true;
        state.applicationSupplement = previous;
        error = "暂时无法保存，原文件和申请没有改变，请重试。"; return false;
      }
      function observe(ctx) {
        context = { ...context, ...ctx };
        if (lastPage !== session().page) {
          if (onPage()) { scope = stamp(); error = ""; }
          else { preview = false; autoReturn = ""; }
          lastPage = session().page;
        }
        const request = state.applicationSupplement?.request;
        if (request?.status !== "pending") return;
        if (!allowed() || state.applicationSupplement.scope !== stamp()) {
          clearTimeout(timer); timer = null;
          save({ ...state.applicationSupplement, request: { ...request, status: "cancelled" } });
        } else if (!timer) timer = setTimeout(() => finish(request.id), Math.max(0, Math.min(800, Number(request.readyAt) - Date.now() || 0)));
      }
      function finish(requestId) {
        timer = null; synchronize();
        const draft = own(), request = draft?.request;
        if (!allowed() || !request || request.id !== requestId || request.status !== "pending") { repaint(); return; }
        if (!navigator.onLine) {
          save({ ...draft, request: { ...request, status: "failed", error: "offline" } });
          error = "网络暂不可用，补充资料尚未提交。联网后可重试。"; repaint(); return;
        }
        const at = new Date().toISOString(), record = state.applicationSnapshot;
        const previous = { applicationSnapshot: record, applicationStatus: state.applicationStatus, channelIdentity: state.channelIdentity, applicationSupplement: draft };
        const receipt = { id: request.id, requirementId: request.requirementId, title: request.title, attachment: request.attachment, submittedAt: at, simulated: true };
        state.applicationSnapshot = { ...record, supplementedAt: at, reviewSubmittedAt: at, supplement: request.title, supplements: [...(Array.isArray(record.supplements) ? record.supplements : []), receipt] };
        state.applicationStatus = "reviewing"; state.channelIdentity = "application";
        state.applicationSupplement = { ...draft, request: { ...request, status: "completed", completedAt: at } };
        if (!persist()) {
          Object.assign(state, previous);
          state.applicationSupplement = { ...draft, request: { ...request, status: "failed", error: "storage" } };
          error = "这次未能保存提交结果，原申请和文件仍保留，请重试。";
          repaint(); return;
        }
        error = "";
        if (onPage() && scope === draft.scope && autoReturn === requestId) { autoReturn = ""; context.go("CHN-11"); context.flash?.("补充资料已提交（本地演示）"); }
        else repaint();
      }
      function render(item) {
        const head = `<header class="screen-head commercial-head"><div><button class="back" data-action="go:CHN-11" aria-label="返回申请进度">← 返回</button><span class="page-context">体验顾问</span><h1>补充申请资料</h1></div></header>`;
        if (current().stage === "needs-info" && !requirement().id) return `${head}<div class="stack commercial-stack">${feedback("补充要求暂未获取", "暂时无法确认需要哪些材料。请重试或联系客服，原资料仍会保留。", "plain")}${button("重新获取要求", "supplement-refresh", "primary")}${button("联系客服核对", "supplement-help", "secondary")}</div>`;
        if (!allowed() || scope !== stamp()) {
          const completed = state.applicationSupplement?.applicationId === id() && state.applicationSupplement.sessionKey === account() && state.applicationSupplement.request?.status === "completed" && current().stage === "reviewing";
          return `${head}<div class="stack commercial-stack">${feedback(completed ? "补充资料已提交" : scope !== stamp() ? "申请已变化" : "当前无需补充资料", completed ? "申请已重新进入审核，可在申请进度页查看结果。" : "请先查看当前申请进度，原资料仍然保留。", "plain")}${actions([["查看申请进度", "go:CHN-11", "primary"]])}</div>`;
        }
        const draft = own(), file = draft?.attachment, request = draft?.request, active = pending() || selecting, spec = requirement();
        const status = error || (selecting ? "正在检查文件…" : pending() ? "正在提交补充资料，可稍后回来查看结果。" : request?.status === "failed" ? "补充资料尚未提交，请检查网络后重试。" : file && !ready() ? "已保留文件名。为保护文件内容，刷新后需要重新选择文件。" : file ? "文件已选好，尚未提交。" : "选择文件后，即可提交补充资料。");
        const fileSize = file ? file.size < 1024 * 1024 ? `${Math.max(1, Math.round(file.size / 1024))} KB` : `${(file.size / 1024 / 1024).toFixed(1)} MB` : "";
        const fileCard = file ? `<section class="supplement-file"><span class="supplement-file-icon" aria-hidden="true">${file.demo ? "示例" : file.type === "application/pdf" ? "PDF" : "图片"}</span><div class="supplement-file-meta"><strong>${e(file.name)}</strong><small>${fileSize} · ${ready() ? "已选择" : "待重新选择"}</small></div><div class="supplement-file-actions">${button("预览", "supplement-preview", "text-button", !ready() || active)}${button("更换", "supplement-pick", "text-button", active)}${button("移除", "supplement-remove", "text-button", active)}</div></section>` : `<section class="supplement-empty"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8 3h11l6 6v20H8zM19 3v7h6M12 17h9M12 22h7"/></svg><strong>添加补充文件</strong><p>PDF、JPG 或 PNG · 1 个文件 · 最大 10 MB<br>仅本机预览，请勿选择真实证件。</p>${button("选择文件", "supplement-pick", "secondary", active)}</section>`;
        let previewBody = "";
        if (preview && ready()) {
          const content = file.demo ? `<div class="supplement-sample"><h3>${e(spec.title)}</h3><p>这是一份用于体验补件流程的示例文件，不含真实个人信息。</p><p>正式内容请以本次审核要求为准。</p></div>` : file.type.startsWith("image/") ? `<img src="${e(files.get(file.id).url)}" alt="所选补充文件预览">` : `<div class="supplement-pdf"><p>PDF 在浏览器新页面中查看，关闭预览页即可回来继续。</p><a class="supplement-pdf-open" href="${e(files.get(file.id).url)}" target="_blank" rel="noopener noreferrer">打开 PDF 预览 ↗</a></div>`;
          previewBody = `<section class="supplement-preview" tabindex="-1"><header><strong>文件预览</strong>${button("收起预览", "supplement-preview-close", "text-button")}</header>${content}</section>`;
        }
        return `${head}<div class="stack commercial-stack"><div class="supplement-page" data-supplement-scope="${e(stamp())}" aria-busy="${active}"><section class="supplement-requirement"><small>待补充 · 1 项</small><h2>${e(spec.title)}</h2><p>${e(spec.instructions || "请按本次审核要求准备文件。不确定要提供什么，可联系客服确认。")}</p><span>申请编号 ${e(id())}</span></section><input type="file" id="supplement-file-input" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" hidden>${fileCard}${previewBody}${!file ? button("使用示例文件体验", "supplement-demo", "text-button", active) : ""}<p id="supplement-status" role="status" class="supplement-status ${error || request?.status === "failed" ? "is-error" : ""}">${e(status)}</p>${button(pending() ? "正在提交…" : request?.status === "failed" ? "重试提交" : "提交补充资料", "application-supplement", "primary", !ready() || active)}<div class="supplement-links">${button("查看原申请", "supplement-details", "text-button")}${button("联系客服", "supplement-help", "text-button")}</div><p class="supplement-local-note">本地演示，不会上传文件。请勿选择真实证件。</p></div></div>`;
      }
      async function selectFiles(input) {
        if (!matches() || input.closest("[data-supplement-scope]")?.dataset.supplementScope !== stamp() || pending() || selecting) { input.value = ""; return; }
        if (!input.files?.length) return;
        const picked = [...input.files], candidate = picked[0], origin = stamp(), draftMark = JSON.stringify(own()), revision = ++selectionVersion;
        input.value = "";
        const types = { pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" }, ext = candidate.name.split(".").pop().toLowerCase(), type = types[ext];
        let invalid = picked.length !== 1 ? "一次请选择 1 个文件，原文件没有改变。" : !type || candidate.type && candidate.type !== type ? "请选择 PDF、JPG 或 PNG 文件，原文件没有改变。" : !candidate.size ? "文件为空，请重新选择。" : candidate.size > 10 * 1024 * 1024 ? "文件超过 10 MB，请压缩后再选择。" : "";
        if (invalid) { error = invalid; repaint("[data-action='commercial:supplement-pick']"); return; }
        selecting = true; error = ""; repaint();
        try {
          const bytes = new Uint8Array(await candidate.slice(0, 8).arrayBuffer());
          const valid = ext === "pdf" ? String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-" : ext === "png" ? [137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n) : bytes[0]===255 && bytes[1]===216 && bytes[2]===255;
          if (!valid) invalid = "文件格式与内容不一致，请重新选择有效文件。";
        } catch { invalid = "暂时无法读取这个文件，请重新选择。"; }
        synchronize(); selecting = false;
        if (revision !== selectionVersion || origin !== stamp() || !matches()) { repaint(); return; }
        if (pending() || JSON.stringify(own()) !== draftMark) { error = "文件或提交进度已变化，请核对后重新选择。"; repaint(); return; }
        if (invalid) { error = invalid; repaint(); return; }
        const attachment = { id: crypto.randomUUID(), name: candidate.name, size: candidate.size, type, demo: false };
        const previous = own()?.attachment;
        if (save({ scope: stamp(), applicationId: id(), sessionKey: account(), requirementId: requirement().id, attachment, request: null })) {
          files.set(attachment.id, { file: candidate, url: URL.createObjectURL(candidate) }); release(previous?.id); error = ""; preview = false;
        }
        repaint("[data-action='commercial:supplement-preview']");
      }
      function handleAction(command, ctx) {
        if (!command.startsWith("supplement-") && !["application-supplement", "upload-select"].includes(command)) return false;
        // The old generic upload selector remains available to unrelated pages.
        if (command === "upload-select" && !onPage()) return false;
        context = { ...context, ...ctx };
        if (onPage() && command === "supplement-help") { context.go("HELP-03"); return true; }
        if (onPage() && command === "supplement-refresh") { synchronize(); scope = stamp(); repaint(); return true; }
        if (synchronize()) { repaint(); context.flash?.("申请已更新，请核对后继续"); return true; }
        if (!matches()) { repaint(); context.flash?.("请从当前补件页面继续"); return true; }
        if (command === "supplement-details" || command === "supplement-help") { autoReturn = ""; context.go(command === "supplement-details" ? "CHN-07" : "HELP-03"); return true; }
        if (pending() || selecting) return true;
        if (command === "supplement-pick" || command === "upload-select") { document.getElementById("supplement-file-input")?.click(); return true; }
        if (command === "supplement-preview" || command === "supplement-preview-close") { preview = command === "supplement-preview" && ready(); repaint(preview ? ".supplement-preview" : "[data-action='commercial:supplement-preview']"); return true; }
        if (command === "supplement-demo" || command === "supplement-remove") {
          const previous = own()?.attachment, attachment = command === "supplement-demo" ? { id: crypto.randomUUID(), name: `${requirement().title}-示例.pdf`, size: 1024, type: "application/pdf", demo: true } : null;
          if (save({ scope: stamp(), applicationId: id(), sessionKey: account(), requirementId: requirement().id, attachment, request: null })) { release(previous?.id); error = ""; preview = false; }
          repaint(attachment ? "[data-action='commercial:supplement-preview']" : "[data-action='commercial:supplement-pick']"); return true;
        }
        if (command === "application-supplement") {
          if (!ready()) { error = "请先选择有效文件，再提交补充资料。"; repaint(); return true; }
          if (!navigator.onLine) { error = "网络暂不可用，文件仍保留。联网后再提交。"; repaint(); return true; }
          const draft = own(), now = Date.now(), previous = draft.request;
          const request = { ...(previous?.status === "failed" ? previous : { id: crypto.randomUUID(), startedAt: new Date(now).toISOString() }), requirementId: requirement().id, title: requirement().title, attachment: { ...draft.attachment }, status: "pending", readyAt: now + 800, error: "" };
          if (save({ ...draft, request })) { autoReturn = request.id; error = ""; repaint(); observe(context); } else repaint();
          return true;
        }
        return true;
      }
      document.addEventListener("change", event => { if (event.target.id === "supplement-file-input") selectFiles(event.target); });
      window.addEventListener("pagehide", () => { for (const fileId of files.keys()) release(fileId); });
      return { observe, render, handleAction };
    }
  };
})();
