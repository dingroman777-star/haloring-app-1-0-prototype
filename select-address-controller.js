/* Address-book edits and checkout selection are separate transactions. */
(() => {
  "use strict";
  const normalize = row => ({ ...row, name: String(row?.name || "").trim(), phone: String(row?.phone || "").replace(/\s+/g, ""), detail: String(row?.detail || "").trim() });
  const errors = row => {
    const value = normalize(row), result = {};
    if (!value.name || value.name.length > 40) result.name = "请填写收货人姓名（最多 40 字）。";
    if (!/^1\d{10}$/.test(value.phone) && !(value.simulated && /^1\d{2}\*{4}\d{4}$/.test(value.phone))) result.phone = "请填写 11 位手机号。";
    if (value.detail.length < 5 || value.detail.length > 200) result.detail = "请填写完整的省市区、街道与门牌号（5–200 字）。";
    return result;
  };
  const valid = row => Boolean(row && !Object.keys(errors(row)).length);
  const signature = row => row ? JSON.stringify([row.id, ...["name", "phone", "detail"].map(key => normalize(row)[key]), Boolean(row.simulated)]) : "";
  const sameAddress = (a, b) => ["name", "phone", "detail"].every(key => normalize(a)[key] === normalize(b)[key]);
  function create({ state, persist, getApplied, canEdit, apply, e, icon }) {
    state.addressDrafts ||= {};
    state.addressFormKey ||= null;
    state.addressFieldErrors ||= {};
    state.addressNotice ||= "";
    // Clipboard source and undo stay in this form session, never in storage or analytics.
    let paste = { busy: false, expanded: false, text: "", message: "", undo: null };
    let pasteRequest = 0;
    const resetPaste = () => { pasteRequest++; paste = { busy: false, expanded: false, text: "", message: "", undo: null }; };
    const formActive = () => document.getElementById("screen")?.dataset.page === "SEL-07" && state.addressFormKey && canEdit();
    function fillPastedAddress(text, ctx) {
      if (!formActive()) return;
      const result = window.HALO_SELECT_ADDRESS_PARSER.parse(text);
      const labels = { name: "收货人", phone: "手机号", detail: "详细地址" };
      const messages = { empty: "剪贴板里没有文字，请先复制收货信息。", "too-long": "内容太长，请只粘贴一位收货人的信息。", ambiguous: "识别到多组收货信息，请只保留一位收货人的信息。", unrecognized: "没能识别这段内容，请粘贴姓名、手机号和完整地址。" };
      if (result.issue || result.missing.length) {
        paste.message = (messages[result.issue] || `未识别到${result.missing.map(key => labels[key]).join("、")}，请补齐信息。`) + "原输入未改变。";
        ctx.render(); return;
      }
      const key = state.addressFormKey, previous = structuredClone(state.addressDrafts[key]);
      Object.assign(state.addressDrafts[key], result.fields);
      state.addressFieldErrors = {}; state.addressNotice = "";
      paste.undo = { key, previous }; paste.text = ""; paste.expanded = false;
      paste.message = "已填写 3 项，请核对后保存。";
      if (!persist()) paste.message += "当前填写尚未保存，刷新可能丢失。";
      ctx.render();
      queueMicrotask(() => document.getElementById("address-paste-status")?.focus({ preventScroll: true }));
    }
    async function readClipboard(ctx) {
      const key = state.addressFormKey, baseline = signature(state.addressDrafts[key]), request = ++pasteRequest;
      paste.busy = true; paste.message = "正在读取剪贴板…"; ctx.render();
      let timer;
      try {
        if (!navigator.clipboard?.readText) throw new Error("clipboard-unavailable");
        const text = await Promise.race([navigator.clipboard.readText(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("clipboard-timeout")), 10000); })]);
        if (request !== pasteRequest || !formActive() || key !== state.addressFormKey) return;
        paste.busy = false;
        if (baseline !== signature(state.addressDrafts[key])) { paste.message = "你已修改输入，本次未填入。需要时可重新粘贴。"; ctx.render(); return; }
        fillPastedAddress(text, ctx);
      } catch {
        if (request !== pasteRequest || !formActive() || key !== state.addressFormKey) return;
        paste.busy = false; paste.expanded = true; paste.message = "暂时无法读取剪贴板，请在下方长按粘贴。"; ctx.render();
        queueMicrotask(() => document.getElementById("address-paste-text")?.focus());
      } finally { clearTimeout(timer); }
    }
    if (!state.addressManagerVersion) {
      if (Object.values(state.addressDraft || {}).some(Boolean)) state.addressDrafts.new = { ...state.addressDraft, id: null };
      if (state.addressFormOpen) state.addressFormKey = "new";
      const old = getApplied();
      if (old?.simulated && ["shanghai", "hangzhou"].includes(old.id) && !state.addresses.some(row => row.id === old.id)) state.addresses.push({ ...old });
      state.addressDraft = { name: "", phone: "", detail: "" }; state.addressFormOpen = false;
      state.addressManagerVersion = 1;
    }
    const contextKey = () => JSON.stringify([state.checkoutDraftOrderId || state.checkoutReconfirmId || null, state.checkoutLines]);
    function selection() {
      if (!state.addressSelection || state.addressSelection.context !== contextKey()) state.addressSelection = { context: contextKey(), selectedId: getApplied()?.id || null, baseline: signature(getApplied()) };
      if (!state.addresses.some(row => row.id === state.addressSelection.selectedId)) state.addressSelection.selectedId = null;
      return state.addressSelection;
    }
    function transaction(change, ctx) {
      const keys = ["addresses", "selectedAddress", "selectedAddressSnapshot", "addressSelection", "addressDrafts", "addressFormKey", "addressDeleteTarget", "addressUndo", "addressNotice", "addressFieldErrors", "checkoutReconfirmId", "checkoutDelivery"];
      const previous = Object.fromEntries(keys.map(key => [key, structuredClone(state[key])]));
      change();
      if (persist()) return true;
      Object.assign(state, previous); state.addressNotice = "保存未完成，请重试。原记录未改变。"; ctx.render(); return false;
    }
    function render() {
      const applied = getApplied(), selected = selection();
      const locked = !canEdit();
      const form = state.addressDrafts[state.addressFormKey] || { id: null, name: "", phone: "", detail: "" };
      const appliedRow = state.addresses.find(row => row.id === applied?.id);
      return window.HALO_SELECT_ADDRESS_VIEW.render({ e, icon, rows: state.addresses.map(row => ({ ...row, valid: valid(row) })), selectedId: selected.selectedId, appliedId: signature(appliedRow) === signature(applied) ? applied?.id : null,
        mode: state.addressFormKey ? "form" : "list", form, formErrors: state.addressFieldErrors, notice: state.addressNotice, paste,
        confirmEnabled: !locked && valid(state.addresses.find(row => row.id === selected.selectedId)), locked, lockedOrderId: state.checkoutDraftOrderId || state.checkoutReconfirmId || "", deleteTarget: state.addressDeleteTarget ? { ...state.addressDeleteTarget, affectsCheckout: state.addressDeleteTarget.id === applied?.id } : null, undo: Boolean(state.addressUndo) });
    }
    function observe(item, ctx) {
      if (item.id !== "SEL-07") {
        resetPaste();
        if (state.addressSelection || state.addressDeleteTarget) { state.addressSelection = null; state.addressDeleteTarget = null; persist(); }
        return;
      }
      selection();
      if (!state.addressFormKey || !canEdit()) resetPaste();
      queueMicrotask(() => {
        const root = document.querySelector('.select-address');
        if (root) {
          root.querySelector('#address-paste-text')?.setAttribute('maxlength', '2000');
          root.onkeydown = event => { if (["ArrowLeft", "ArrowRight"].includes(event.key)) event.stopPropagation(); };
          root.onsubmit = event => { if (event.target.id === "select-address-form") { event.preventDefault(); root.querySelector('[data-action="commercial:address-save"]')?.click(); } };
          root.onpaste = event => {
            if (event.target.id !== "address-paste-text" || !formActive()) return;
            event.preventDefault(); pasteRequest++; paste.busy = false;
            const text = event.clipboardData?.getData("text/plain") || "";
            paste.text = text.length <= 2000 ? text : "";
            fillPastedAddress(text, ctx);
          };
        }
      });
    }
    function handleAction(command, value, ctx) {
      if (!command.startsWith("address-")) return false;
      if (document.getElementById("screen")?.dataset.page !== "SEL-07") return true;
      if (!canEdit()) { ctx.render(); return true; }
      const selected = selection();
      if (command.startsWith("address-paste")) {
        if (!formActive()) return true;
        if (command === "address-paste-read" && !paste.busy) void readClipboard(ctx);
        if (command === "address-paste-manual") { pasteRequest++; paste.busy = false; paste.expanded = !paste.expanded; paste.message = ""; ctx.render(); if (paste.expanded) queueMicrotask(() => document.getElementById("address-paste-text")?.focus()); }
        if (command === "address-paste-fill") { pasteRequest++; paste.busy = false; fillPastedAddress(paste.text, ctx); }
        if (command === "address-paste-undo" && paste.undo?.key === state.addressFormKey) {
          state.addressDrafts[state.addressFormKey] = paste.undo.previous; state.addressFieldErrors = {}; paste.undo = null;
          paste.message = persist() ? "已撤销自动填写。" : "已撤销，当前输入尚未保存，刷新可能丢失。"; ctx.render();
        }
        return true;
      }
      if (command === "address-select") {
        const row = state.addresses.find(row => row.id === value);
        if (!valid(row)) { state.addressNotice = "请先编辑并补全这个地址。"; ctx.render(); return true; }
        selected.selectedId = row.id; state.addressNotice = ""; persist(); ctx.render();
        queueMicrotask(() => document.querySelector(`[data-action="commercial:address-select:${CSS.escape(value)}"]`)?.focus({ preventScroll: true })); return true;
      }
      if (command === "address-confirm") {
        const row = state.addresses.find(row => row.id === selected.selectedId);
        if (!valid(row)) { state.addressNotice = "请选择有效的收货地址。"; ctx.render(); return true; }
        if (selected.baseline !== signature(getApplied())) { state.addressSelection = null; state.addressNotice = "本单收货信息已变化，请重新确认。"; ctx.render(); return true; }
        if (!transaction(() => { apply(normalize(row)); state.addressSelection = null; state.addressNotice = ""; }, ctx)) return true;
        ctx.track("select_address_confirmed", { simulated: Boolean(row.simulated) }); ctx.go("SEL-05"); return true;
      }
      if (command === "address-new" || command === "address-edit" || command === "address-form" && value === "open") {
        resetPaste();
        const key = command === "address-edit" ? value : "new", row = state.addresses.find(row => row.id === key);
        if (key !== "new" && !row) { state.addressNotice = "这个地址已不存在，请重新选择。"; ctx.render(); return true; }
        state.addressDrafts[key] ||= row ? { ...row, base: signature(row) } : { id: null, name: "", phone: "", detail: "" };
        const changed = row && state.addressDrafts[key].base !== signature(row);
        if (changed) state.addressDrafts[key].base = signature(row);
        state.addressFormKey = key; state.addressFieldErrors = {}; state.addressNotice = changed ? "原地址已更新，请核对当前输入后再保存。" : ""; state.addressDeleteTarget = null; persist(); ctx.render(); return true;
      }
      if (command === "address-form" && value === "close") { resetPaste(); state.addressFormKey = null; state.addressFieldErrors = {}; state.addressNotice = ""; persist(); ctx.render(); return true; }
      if (command === "address-save") {
        const key = state.addressFormKey, draft = state.addressDrafts[key];
        if (!key || !draft) return true;
        state.addressFieldErrors = errors(draft);
        if (Object.keys(state.addressFieldErrors).length) { state.addressNotice = "请检查标出的内容。"; ctx.render(); queueMicrotask(() => document.getElementById('address-' + Object.keys(state.addressFieldErrors)[0])?.focus()); return true; }
        const current = state.addresses.find(row => row.id === key);
        if (key !== "new" && (!current || signature(current) !== draft.base)) { state.addressNotice = "原地址已变化，未覆盖你的输入。请返回后重新核对。"; ctx.render(); return true; }
        const duplicate = state.addresses.find(row => row.id !== key && sameAddress(row, draft));
        if (duplicate && key !== "new") { state.addressNotice = "已有相同地址，未重复保存。"; ctx.render(); return true; }
        const clean = normalize(draft); delete clean.base;
        clean.id = current?.id || duplicate?.id || `address-${crypto.randomUUID()}`;
        if (!transaction(() => {
          if (!duplicate) state.addresses = current ? state.addresses.map(row => row.id === key ? clean : row) : [...state.addresses, clean];
          selected.selectedId = clean.id; delete state.addressDrafts[key]; state.addressFormKey = null; state.addressFieldErrors = {};
          state.addressNotice = duplicate ? "已有相同地址，已为你选中。" : "地址已保存，确认后用于本单。";
        }, ctx)) return true;
        ctx.track("select_address_saved", { operation: current ? "edit" : duplicate ? "reuse" : "create" }); ctx.render(); return true;
      }
      if (command === "address-delete") {
        state.addressDeleteTarget = state.addresses.find(row => row.id === value) ? { ...state.addresses.find(row => row.id === value) } : null; persist(); ctx.render();
        queueMicrotask(() => { const panel = document.querySelector('.select-address-delete-panel'); panel?.scrollIntoView({ block: "start" }); panel?.querySelector('button')?.focus({ preventScroll: true }); }); return true;
      }
      if (command === "address-delete-cancel") { state.addressDeleteTarget = null; persist(); ctx.render(); return true; }
      if (command === "address-delete-confirm") {
        const target = state.addressDeleteTarget, index = state.addresses.findIndex(row => row.id === target?.id), row = state.addresses[index];
        if (!row || signature(target) !== signature(row)) { state.addressDeleteTarget = null; state.addressNotice = "地址已变化，请重新核对。"; ctx.render(); return true; }
        if (!transaction(() => {
          const applied = getApplied(); state.addressUndo = { row: { ...row }, index, context: contextKey(), applied: applied?.id === row.id ? { ...applied } : null };
          state.addresses = state.addresses.filter(item => item.id !== row.id);
          if (applied?.id === row.id) { state.selectedAddress = null; state.selectedAddressSnapshot = null; }
          if (selected.selectedId === row.id) selected.selectedId = null;
          selected.baseline = signature(getApplied()); state.addressDeleteTarget = null; state.addressNotice = "地址已移除，可撤销。已创建的订单不受影响。";
        }, ctx)) return true;
        ctx.track("select_address_deleted", {}); ctx.render(); return true;
      }
      if (command === "address-undo" && state.addressUndo) {
        const undo = state.addressUndo;
        if (!transaction(() => {
          if (!state.addresses.some(row => row.id === undo.row.id || sameAddress(row, undo.row))) state.addresses.splice(Math.min(undo.index, state.addresses.length), 0, undo.row);
          if (!getApplied() && undo.applied && undo.context === contextKey() && state.addresses.some(row => row.id === undo.row.id && sameAddress(row, undo.row))) { state.selectedAddress = undo.applied.id; state.selectedAddressSnapshot = { ...undo.applied }; }
          if (!selected.selectedId) selected.selectedId = undo.row.id;
          selected.baseline = signature(getApplied()); state.addressUndo = null; state.addressNotice = "已恢复地址。";
        }, ctx)) return true;
        ctx.render(); return true;
      }
      return true;
    }
    function handleInput(target) {
      if (target.id === "address-paste-text") { if (formActive()) paste.text = target.value; return true; }
      if (!["address-name", "address-phone", "address-detail"].includes(target.id)) return false;
      if (document.getElementById("screen")?.dataset.page !== "SEL-07" || !canEdit()) return true;
      const draft = state.addressDrafts[state.addressFormKey]; if (!draft) return true;
      paste.undo = null;
      document.querySelector('[data-action="commercial:address-paste-undo"]')?.remove();
      const key = target.id.replace("address-", ""); draft[key] = target.value;
      delete state.addressFieldErrors[key]; target.removeAttribute('aria-invalid');
      const error = document.getElementById('address-error-' + key); if (error) { error.textContent = ""; error.hidden = true; }
      if (!persist()) {
        state.addressNotice = "当前输入尚未保存，刷新可能丢失。";
        const host = document.querySelector('.select-address-scroll');
        let hint = host?.querySelector('.select-address-notice');
        if (host && !hint) { hint = document.createElement('p'); hint.className = 'select-address-notice'; hint.setAttribute('role', 'status'); host.prepend(hint); }
        if (hint) hint.textContent = state.addressNotice;
      }
      return true;
    }
    return { render, observe, handleAction, handleInput };
  }
  window.HALO_SELECT_ADDRESS_CONTROLLER = { create, normalize, valid };
})();
