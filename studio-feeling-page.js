(function () {
  window.createHaloStudioFeeling = function ({ state, event, media, preparation, go, render, write, readStored, track, esc, icon, screen, modalRoot, closeModal, flash }) {
    let error = "", notice = "", viewContext = "", intent = null, saveOutcome = "success", transientDraft = false, viewportKey = "";
    const id = () => state.selectedStudioEventId;
    const record = () => state.studioRecords?.[id()];
    const now = () => new Date().toISOString();
    const scoped = (scope, r, eventId) => Boolean(r?.bookingId && scope?.eventId === eventId && scope.bookingId === r.bookingId);
    function savedText(r = record(), eventId = id()) {
      return r?.deletionStatus === "ready" && scoped(r.beforeRecordScope, r, eventId) ? String(r.beforeFeeling || "") : "";
    }
    function oldRecord() {
      const r = record();
      return r && !scoped(r.beforeRecordScope, r, id()) && (r.beforeFeeling || r.beforeDraft)
        ? { text: String(r.beforeFeeling || ""), draft: String(r.beforeDraft || ""), scope: r.beforeRecordScope || null, savedAt: r.beforeSavedAt || null, updatedAt: r.beforeUpdatedAt || null } : null;
    }
    function problem() {
      const blocked = preparation.problem(); if (blocked) return blocked;
      const r = record();
      if (r.sessionStarted || r.sessionDone) return "活动已开始，不能再修改活动前的感受";
      return r.activityConsent === true ? "" : "请先确认本次活动记录用途";
    }
    function baseKey(r = record(), eventId = id()) {
      return JSON.stringify([eventId, r?.bookingId, r?.eventId, r?.eventSnapshot?.id, r?.eventSnapshot?.eventId,
        r?.paid, r?.refundStatus, r?.refundRequest?.status, r?.paymentRequest?.status, r?.deletionStatus,
        r?.activityConsent, r?.sessionStarted, r?.sessionDone, r?.beforeRecordScope, r?.beforeFeeling,
        r?.beforeSavedAt, r?.beforeUpdatedAt, r?.beforeVersion]);
    }
    function draft() {
      return record()?.feelingDraft || { eventId: id(), bookingId: record()?.bookingId, baseKey: baseKey(), text: savedText(), updatedAt: "" };
    }
    function conflict() { const d = draft(); return !scoped(d, record(), id()) || d.baseKey !== baseKey(); }
    const text = () => String(draft().text || "");
    const dirty = () => text().trim() !== savedText();
    function key() { return JSON.stringify([baseKey(), draft(), problem(), error, notice, transientDraft]); }
    const button = (label, action, cls = "studio-feeling-link", disabled = false) => `<button type="button" class="${cls}" data-action="${action}" ${disabled ? "disabled" : ""}>${esc(label)}</button>`;
    const disclosure = (name, label, body) => `<details class="studio-detail-info" data-studio-info="${name}"><summary><span>${label}</span>${icon("arrow")}</summary><div>${body}</div></details>`;
    function feedback() {
      if (error) return error;
      if (conflict()) return "预约或已保存的内容有更新。这份草稿还在，请先核对。";
      if (notice) return notice;
      if (dirty()) return text().trim() ? "草稿已保留，尚未保存为本次记录" : "输入已清空，原记录仍然保留";
      return savedText() ? "已保存 · 用户记录" : "";
    }
    function footer() {
      const blocked = problem() || conflict(), value = text().trim(), saved = savedText();
      const primary = !value ? saved ? "保留原记录并继续" : oldRecord() ? "继续" : "跳过" : value === saved ? "继续" : "保存并继续";
      return `${button(primary, "stuf-primary", "primary", Boolean(blocked))}${dirty() && value ? button("暂不保存，继续", "stuf-skip", "studio-feeling-secondary", Boolean(blocked)) : ""}<p>${dirty() && value ? "开始活动后，不能再补记活动前的感受。" : "下一步确认后，再开始活动"}</p>`;
    }
    function updateControls() {
      const host = screen.querySelector(".studio-feeling"); if (!host) return;
      const feedbackNode = host.querySelector(".studio-feeling-error");
      if (feedbackNode) { feedbackNode.textContent = feedback(); feedbackNode.hidden = !feedback(); }
      const footerNode = host.querySelector(".studio-detail-footer"); if (footerNode) footerNode.innerHTML = footer();
      host.dataset.feelingKey = key();
    }
    function fail(message) { error = message; updateControls(); }
    function syncStored(inputValue) {
      const latest = readStored();
      if (!latest.ok) { fail("暂时无法核对已保存的记录，当前输入仍然保留。请重试。"); return false; }
      const fresh = latest.records?.[id()];
      if (baseKey(fresh || {}) === baseKey()) {
        const localDraft = record()?.feelingDraft;
        state.studioRecords = { ...latest.records };
        if (fresh && localDraft) state.studioRecords[id()] = { ...fresh, feelingDraft: localDraft };
        return true;
      }
      // A second local window may have saved, cancelled, or replaced this booking.
      // Preserve this window's editing draft, but never write its stale official record back.
      const localDraft = { ...draft(), ...(inputValue === undefined ? {} : { text: inputValue, updatedAt: now() }) };
      state.studioRecords = { ...latest.records };
      if (fresh) state.studioRecords[id()] = { ...fresh, feelingDraft: localDraft };
      closeModal(); intent = null;
      error = fresh ? "其他页面更新了预约或记录。你的草稿还在，请先核对最新内容。" : "这笔预约已不再可用，已停止保存。";
      render(); return false;
    }
    function edit(value) {
      if (state.current !== "STU-11") return;
      if (!syncStored(value)) return;
      if (problem()) { fail(problem()); return; }
      if (conflict()) { fail("预约或内容有更新，请先核对，原草稿仍然保留。"); return; }
      const r = record(), d = { ...draft(), text: value, updatedAt: now() };
      if (value === text()) return;
      error = ""; notice = "";
      if (!write(id(), { feelingDraft: d })) { r.feelingDraft = d; transientDraft = true; error = "草稿暂时只留在当前页面，请勿刷新。可以稍后重试保存。"; }
      else transientDraft = false;
      updateControls(); // Do not rebuild the textarea while typing or composing Chinese text.
    }
    function page() {
      const context = `${id()}:${record()?.bookingId}`;
      if (viewContext !== context) { viewContext = context; error = ""; notice = ""; intent = null; transientDraft = false; }
      const blocked = problem();
      const header = `<header class="studio-detail-header"><button type="button" data-action="stuf-back" aria-label="返回参加准备">${icon("back")}</button><h1>活动前的感受</h1><span aria-hidden="true"></span></header>`;
      if (blocked) return `<article class="studio-feeling studio-detail" data-feeling-key="${esc(key())}"><div class="studio-detail-scroll" tabindex="0">${header}<section class="studio-feeling-empty"><h2>${esc(blocked)}</h2><p>原预约和记录没有改变。</p></section></div><footer class="studio-detail-footer">${button("返回查看", "stuf-back", "primary")}</footer></article>`;
      const e = event(id()), saved = savedText(), previous = oldRecord();
      const prior = previous ? disclosure("feeling-previous", "以前的记录", `<p>这条内容还没有关联到本次预约，不会直接作为这次活动前的感受。</p>${previous.text ? `<p class="studio-feeling-original">${esc(previous.text)}</p>` : ""}${previous.draft && previous.draft !== previous.text ? `<p>以前未保存的文字</p><p class="studio-feeling-original">${esc(previous.draft)}</p>` : ""}${button("复制为本次草稿", "stuf-copy-previous", "studio-feeling-link", Boolean(text().trim()) || conflict())}`) : "";
      const savedDetail = saved ? disclosure("feeling-saved", "查看已保存内容", `<p class="studio-feeling-original">${esc(saved)}</p><p>用户记录</p>${button("删除已保存记录", "stuf-delete", "studio-feeling-delete", conflict())}`) : "";
      return `<article class="studio-feeling studio-detail" data-feeling-key="${esc(key())}"><div class="studio-detail-scroll" tabindex="0" aria-label="活动前的感受">${header}<div class="studio-booking-event studio-feeling-event">${media(id()) ? `<img src="${media(id())}" width="64" height="64" alt="${esc(e.category)}场地示意图">` : ""}<div><h2>${esc(e.title)}</h2><p>${esc(e.date)}</p><p>${esc(e.place)} · ${esc(e.duration)}分钟</p></div></div><div class="studio-feeling-editor"><label for="studio-before-feeling">现在感觉怎么样？</label><p id="studio-feeling-purpose">可以不填，留给自己以后回看。</p><textarea id="studio-before-feeling" aria-describedby="studio-feeling-purpose studio-feeling-status" placeholder="比如：今天有点累，想慢慢活动一下。" ${conflict() ? "readonly" : ""}>${esc(text())}</textarea><p id="studio-feeling-status" class="studio-feeling-error" role="status" ${feedback() ? "" : "hidden"}>${esc(feedback())}</p>${conflict() ? button("核对当前记录", "stuf-reset") : ""}</div>${savedDetail}${prior}${disclosure("feeling-purpose", "记录会用在哪里？", '<p>保存后可在本次体验中回看，始终标为“用户记录”，不会改写成设备数据或活动效果。</p><p>跳过不会把草稿写入本次报告。不填写也能参加活动，不影响已有权益。</p>')}</div><footer class="studio-detail-footer">${footer()}</footer></article>`;
    }
    function canAct() {
      if (state.current !== "STU-11") return false;
      if (!syncStored()) return false;
      if (problem()) { fail(problem()); return false; }
      if (conflict()) { fail("预约或记录有更新，请核对后再继续。"); return false; }
      return true;
    }
    function durableDraft() {
      if (record()?.feelingDraft && !write(id(), { feelingDraft: record().feelingDraft })) { fail("草稿还没能保存到本机，请稍后重试。当前输入仍然保留。"); return false; }
      transientDraft = false; return true;
    }
    function advance(save = true) {
      const value = text().trim(); // Act on the text this window actually showed, not a newly discovered draft.
      if (!canAct()) return;
      const r = record(), saved = savedText();
      if (!save || !value || value === saved) { if (durableDraft()) go("STU-03"); return; }
      const at = now(), previous = oldRecord();
      const changes = { beforeFeeling: value, beforeDraft: value, beforeSavedAt: saved && r.beforeSavedAt ? r.beforeSavedAt : at,
        beforeUpdatedAt: at, beforeVersion: (Number.isInteger(r.beforeVersion) ? r.beforeVersion : 0) + 1,
        beforeRecordScope: { eventId: id(), bookingId: r.bookingId }, feelingDraft: null };
      if (previous) changes.beforePreviousRecords = [...(Array.isArray(r.beforePreviousRecords) ? r.beforePreviousRecords : []), { ...previous, preservedAt: at }];
      if (saveOutcome === "fail" || !write(id(), changes)) return fail("这次没保存成功，输入仍然保留。请重试。");
      error = ""; transientDraft = false;
      track("studio_feeling_saved", { event_id: id(), booking_id: r.bookingId, version: changes.beforeVersion, simulated: true });
      go("STU-03"); flash("感受已保存到本机");
    }
    function showConfirm(kind) {
      if (state.current === "STU-11" && !syncStored()) return;
      if (state.current !== "STU-11" || problem() || kind === "delete" && (conflict() || !savedText())) return;
      const token = `${record().bookingId}-${Date.now()}`;
      intent = { kind, token, eventId: id(), bookingId: record().bookingId, baseKey: baseKey(), draft: JSON.stringify(draft()) };
      const reset = kind === "reset";
      modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal studio-feeling-modal" data-feeling-confirm="${esc(token)}"><h2>${reset ? "放弃这份未保存的草稿？" : "删除已保存的感受？"}</h2><p>${reset ? "将载入当前预约的记录，已保存内容不会被删除。" : "只删除本次保存的这段感受，不影响预约、付款或其他记录。当前编辑中的文字会保留为草稿，不会自动重新保存。"}</p><div class="button-row">${button(reset ? "保留草稿" : "暂不删除", "close-modal", "primary")}${button(reset ? "放弃草稿并载入" : "确认删除", `stuf-${kind}-confirm`, "secondary")}</div></section></div>`;
    }
    function confirm(kind) {
      if (state.current !== "STU-11") return;
      if (!syncStored()) return;
      const matched = intent?.kind === kind && intent.token === modalRoot.querySelector("[data-feeling-confirm]")?.dataset.feelingConfirm
        && intent.eventId === id() && intent.bookingId === record()?.bookingId && intent.baseKey === baseKey() && intent.draft === JSON.stringify(draft());
      if (!matched || problem()) { closeModal(); intent = null; fail("预约或记录有变化，请重新核对。"); return; }
      const r = record(); let changes;
      if (kind === "reset") changes = { feelingDraft: null };
      else {
        if (conflict() || !savedText()) { closeModal(); return; }
        changes = { beforeFeeling: "", beforeDraft: "", beforeSavedAt: null, beforeUpdatedAt: now(), beforeVersion: (r.beforeVersion || 0) + 1 };
        const edited = text().trim() !== savedText();
        const d = edited ? { ...draft() } : null;
        if (d) {
          d.baseKey = baseKey({ ...r, ...changes });
        }
        changes.feelingDraft = d;
      }
      if (saveOutcome === "fail" || !write(id(), changes)) { closeModal(); intent = null; return fail("这次没保存成功，原记录和草稿仍然保留。请重试。"); }
      closeModal(); intent = null; error = ""; transientDraft = false;
      notice = kind === "reset" ? "已载入当前记录，请重新确认。" : "已删除本次保存的感受";
      if (kind === "delete") track("studio_feeling_deleted", { event_id: id(), booking_id: r.bookingId, version: changes.beforeVersion, simulated: true });
      render();
    }
    function back() {
      if (state.current === "STU-11" && !syncStored()) return;
      const r = record();
      if (r?.sessionDone) return go("STU-15");
      if (r?.sessionStarted) return go("STU-04");
      if (preparation.problem()) return go("STU-18");
      if (!durableDraft()) return;
      go("STU-10");
    }
    function handle(action) {
      if (action === "studio-feeling-save") action = "stuf-primary";
      if (action === "go:STU-03" && state.current === "STU-11") action = "stuf-skip";
      if (!action.startsWith("stuf-")) return false;
      if (action.startsWith("stuf-review:")) { saveOutcome = action.endsWith(":fail") ? "fail" : "success"; render(); return true; }
      if (state.current !== "STU-11") return true;
      if (action === "stuf-back") back();
      else if (action === "stuf-primary") advance();
      else if (action === "stuf-skip") advance(false);
      else if (action === "stuf-delete") showConfirm("delete");
      else if (action === "stuf-reset") showConfirm("reset");
      else if (action === "stuf-delete-confirm") confirm("delete");
      else if (action === "stuf-reset-confirm") confirm("reset");
      else if (action === "stuf-copy-previous" && canAct() && !text().trim() && oldRecord()) {
        edit(oldRecord().text || oldRecord().draft); const input = screen.querySelector("#studio-before-feeling"); if (input) { input.value = text(); input.focus(); }
      }
      return true;
    }
    function viewport(force = false) {
      const shell = screen.closest(".device-shell");
      if (state.current !== "STU-11" || !shell || !window.visualViewport || window.visualViewport.scale > 1.05) return;
      const geometry = `${window.visualViewport.width}:${window.visualViewport.height}`;
      if (!force && viewportKey === geometry) return;
      viewportKey = geometry;
      shell.style.setProperty("--studio-feeling-viewport", `${Math.round(window.visualViewport.height)}px`);
      requestAnimationFrame(() => {
        const input = document.activeElement;
        if (input?.id === "studio-before-feeling" && screen.contains(input)) input.scrollIntoView({ block: "nearest" });
      });
    }
    function refresh() {
      viewport();
      const host = screen.querySelector(".studio-feeling[data-feeling-key]");
      if (state.current === "STU-11" && host && host.dataset.feelingKey !== key() && !document.hidden && !modalRoot.querySelector(".modal")) render();
    }
    window.visualViewport?.addEventListener("resize", viewport);
    window.addEventListener("resize", viewport);
    screen.addEventListener("focusin", e => { if (e.target.id === "studio-before-feeling") viewport(true); });
    return { page, handle, input: edit, refresh, savedText,
      reviewControls: item => item.id === "STU-11" ? `<section class="review-block"><h3>活动前感受 · 本地审阅</h3><p>当前保存：${saveOutcome === "fail" ? "失败" : "成功"}。草稿不进入报告；正文不写入埋点。</p>${button("保存成功", "stuf-review:success")}${button("保存失败", "stuf-review:fail")}<p>已有旧文字不会自动绑定新预约；仅显式复制、编辑并保存后成为本次用户记录。正式云端保存与删除待接入。</p></section>` : "" };
  };
})();
