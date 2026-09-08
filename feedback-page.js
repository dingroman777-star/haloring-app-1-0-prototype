/* HELP-02: local-only feedback, atomic record saves and account-scoped drafts. */
(() => {
  window.createHaloFeedback = function ({ state, write, go, render, esc, screen, leave, commerceContext = () => null }) {
    const TYPES = ["设备连接", "数据与解释", "夜间体验", "Halo", "订单与售后", "渠道申请与收益", "其他"];
    const LIMIT = 1000;
    const working = new Map();
    const errors = new Map();
    let composing = false, saving = false;
    const owner = () => String(state.authPhone || state.authForm?.phone || "local-demo");
    function cleanCommerce(value) {
      if (value?.kind === "channel") {
        if (value.ownerAccount !== owner() || !/^CHN-\d{2}$/.test(value.sourceRoute) || typeof value.recordId !== "string" || !value.recordId || value.recordId.length > 160) return null;
        return { kind: "channel", ownerAccount: owner(), sourceRoute: value.sourceRoute, recordId: value.recordId, recordLabel: ["申请编号", "关联订单", "提现申请编号"].includes(value.recordLabel) ? value.recordLabel : "申请编号", applicationId: value.applicationId, orderId: value.orderId || null, withdrawalId: value.withdrawalId || null };
      }
      if (!value || value.ownerAccount !== owner() || !["SEL-09", "SEL-11", "SEL-12", "SEL-13"].includes(value.sourceRoute) || typeof value.orderId !== "string" || !value.orderId || value.orderId.length > 120) return null;
      return { ownerAccount: owner(), sourceRoute: value.sourceRoute, orderId: value.orderId, afterSaleId: typeof value.afterSaleId === "string" && value.afterSaleId.length <= 120 ? value.afterSaleId : null };
    }
    const object = value => value && typeof value === "object" && !Array.isArray(value);
    const root = () => object(state.feedbackFlow) ? state.feedbackFlow : { accounts: {} };
    const emptyDraft = () => ({ type: TYPES[0], text: "", logsAllowed: false });
    const tickets = () => Array.isArray(state.feedbackTickets) ? state.feedbackTickets : [];
    const ownTickets = () => tickets().filter(ticket => ticket && ticket.ownerAccount === owner());
    const count = text => Array.from(text).length;
    const newLabel = () => entry().draft.text.trim() ? "继续填写" : "写反馈";
    function entry() {
      const account = owner();
      if (!working.has(account)) {
        const saved = root().accounts?.[account];
        const legacy = (state.feedbackDraft?.ownerAccount || state.feedbackDraft?.accountRef) === account ? state.feedbackDraft : null;
        const draft = object(saved?.draft) ? saved.draft : legacy || emptyDraft();
        working.set(account, {
          draft: { type: TYPES.includes(draft.type) ? draft.type : TYPES[0], text: typeof draft.text === "string" ? draft.text : "", logsAllowed: object(saved?.draft) && draft.logsAllowed === true, commerceContext: cleanCommerce(draft.commerceContext) },
          view: ["form", "history", "detail"].includes(saved?.view) ? saved.view : "form",
          selectedId: typeof saved?.selectedId === "string" ? saved.selectedId : "",
          detailFrom: saved?.detailFrom === "history" ? "history" : "form",
          top: object(saved?.top) ? { ...saved.top } : {}
        });
      }
      return working.get(account);
    }
    const snapshot = (next = entry(), extra = {}) => ({ ...root(), ...extra, accounts: { ...(root().accounts || {}), [owner()]: JSON.parse(JSON.stringify(next)) } });
    function persistDraft() {
      const ok = write({ feedbackFlow: snapshot() });
      errors.set(owner(), ok ? "" : "草稿暂时无法保存到本机。内容还在，请勿刷新或关闭页面，可重试保存。");
      return ok;
    }
    function problem() {
      const text = entry().draft.text;
      if (count(text) > LIMIT) return `描述超过 ${LIMIT} 字，请缩短后再保存。现有文字没有被截断。`;
      return "";
    }
    const button = (label, action, className = "secondary") => `<button type="button" class="${className}" data-action="${esc(action)}">${esc(label)}</button>`;
    const date = value => Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString("zh-CN") : "原记录未保存时间";
    function legacyNotice() {
      const legacy = state.feedbackDraft;
      const available = typeof legacy?.text === "string" && legacy.text.trim() && !legacy.ownerAccount && !root().legacyDraftClaimedBy;
      return available ? `<section class="fb-legacy"><p>本机保留了一份旧草稿，账号归属待确认。为保护隐私，暂不展示内容。</p></section>` : "";
    }
    function commercePanel(record) {
      const attached = cleanCommerce(record ? record.commerceContext : entry().draft.commerceContext);
      const pending = record ? null : cleanCommerce(commerceContext());
      const selected = attached || pending;
      if (!selected) return "";
      if (selected.kind === "channel") return `<section class="fb-commerce" aria-label="关联渠道记录"><h2>关于渠道申请与收益</h2><p>${esc(selected.recordLabel)}：${esc(selected.recordId)}</p>${record ? '<small>随这条反馈保存在本机，尚未发送。</small>' : `<label><input type="checkbox" id="feedback-commerce" ${attached ? "checked" : ""}><span>将这条记录编号附在反馈中</span></label><small>不附带银行卡、健康数据或 Halo 对话。</small>${attached && pending && attached.recordId !== pending.recordId ? `<p>已有草稿关联另一条记录，未被自动替换。</p>${button("改为关联本次记录", "feedback:attach-current", "text-button")}` : ""}`}</section>`;
      const different = attached && pending && (attached.orderId !== pending.orderId || attached.afterSaleId !== pending.afterSaleId);
      return `<section class="fb-commerce" aria-label="关联订单"><h2>${selected.afterSaleId ? "关于这笔售后" : "关于这笔订单"}</h2><p>订单号：${esc(selected.orderId)}${selected.afterSaleId ? `<br>售后单号：${esc(selected.afterSaleId)}` : ""}</p>${record ? '<small>随这条反馈保存在本机，尚未发送。</small>' : `<label><input type="checkbox" id="feedback-commerce" ${attached ? "checked" : ""}><span>将这些单号附在本条反馈中</span></label><small>不会附带地址、健康数据或 Halo 对话。</small>${different ? `<p>本次咨询来自订单 ${esc(pending.orderId)}，已有草稿仍关联原订单。</p><button type="button" class="text-button" data-action="feedback:attach-current">改为关联本次咨询的订单</button>` : ""}`}</section>`;
    }
    function prepareCommerce() {
      if (state.current !== "HELP-02" || !cleanCommerce(commerceContext())) return;
      const draft = entry().draft;
      if (!draft.text.trim() && !draft.logsAllowed && !draft.commerceContext) draft.type = cleanCommerce(commerceContext())?.kind === "channel" ? "渠道申请与收益" : "订单与售后";
      entry().view = "form"; persistDraft(); render();
    }
    function form() {
      const draft = entry().draft;
      return `${commercePanel()}<form class="fb-form" novalidate><label for="feedback-type">问题类型</label><select class="field" id="feedback-type">${TYPES.map(type => `<option${draft.type === type ? " selected" : ""}>${type}</option>`).join("")}</select><div class="fb-field-heading"><label for="feedback-text">问题描述 <span>必填</span></label><span id="feedback-count">${count(draft.text)} / ${LIMIT}</span></div><textarea id="feedback-text" class="field" rows="7" aria-required="true" aria-describedby="feedback-count feedback-error" placeholder="例如：什么时候遇到问题，尝试了什么？">${esc(draft.text)}</textarea><label class="fb-logs" for="feedback-logs"><input type="checkbox" id="feedback-logs" ${draft.logsAllowed ? "checked" : ""}><span><strong>允许附加设备日志</strong><small>仅针对这条反馈，不含 Halo 对话正文；当前不采集或上传日志。</small></span></label><p id="feedback-error" class="fb-error" role="status">${esc(errors.get(owner()) || problem())}</p><div class="fb-actions"><button type="button" id="feedback-save" class="primary fb-save" data-action="feedback:save" ${!draft.text.trim() || problem() ? "disabled" : ""}>保存反馈</button><p class="fb-local-note">仅保存在本机，尚未发送给客服。</p></div></form>${legacyNotice()}`;
    }
    function historyPage() {
      const records = ownTickets();
      const unknown = tickets().filter(ticket => ticket && !ticket.ownerAccount).length;
      return `<section class="fb-history-content"><div class="fb-section-heading"><h2>反馈记录</h2>${button(newLabel(), "feedback:new", "text-button")}</div><p class="fb-local-note">这些记录仅保存在本机，尚未发送给客服。</p>${records.length ? `<div class="fb-history-list">${records.map(ticket => `<button type="button" class="fb-ticket" data-action="feedback:view:${esc(ticket.id)}"><strong>${esc(ticket.type)}</strong><p>${esc(String(ticket.text || "").replace(/\s+/g, " ").slice(0, 80))}${String(ticket.text || "").length > 80 ? "…" : ""}</p><small>${esc(date(ticket.createdAt))}</small><span aria-hidden="true">›</span></button>`).join("")}</div>` : `<div class="fb-empty"><h3>还没有反馈记录</h3><p>遇到问题时，可以先记下来。</p>${button(newLabel(), "feedback:new", "primary")}</div>`}${unknown ? `<p class="fb-legacy-note">本机还保留 ${unknown} 条未记录账号归属的旧反馈，暂不列入当前账号记录。</p>` : ""}</section>`;
    }
    function detail() {
      const ticket = ownTickets().find(item => item.id === entry().selectedId);
      if (!ticket) return `<div class="fb-empty"><h2>未找到这条反馈</h2><p>只展示属于当前账号的本机记录。</p>${button("查看记录", "feedback:history")}</div>`;
      return `<section class="fb-detail"><div class="fb-detail-status"><h2>反馈已保存</h2><p>仅保存在本机，尚未发送给客服。</p></div>${commercePanel(ticket)}<dl class="fb-facts"><div><dt>记录编号</dt><dd>${esc(ticket.id)}</dd></div><div><dt>问题类型</dt><dd>${esc(ticket.type)}</dd></div><div><dt>保存时间</dt><dd>${esc(date(ticket.createdAt))}</dd></div><div><dt>设备日志</dt><dd>${ticket.logsAllowed ? "允许附加 · 当前未采集" : "不允许附加 · 当前未采集"}</dd></div></dl><div class="fb-body"><h3>问题描述</h3><p>${esc(ticket.text)}</p></div><div class="fb-actions">${button("联系企业微信客服", "support-handoff", "primary")}${button(entry().draft.text.trim() ? "继续填写" : "再写一条反馈", "feedback:new")}<p class="fb-local-note">打开联系指引不会自动发送这条反馈，由你决定提供什么。</p></div></section>`;
    }
    function page() {
      const data = entry();
      return `<div class="fb-page" data-view="${data.view}"><header class="fb-header"><button type="button" data-action="previous" aria-label="${data.view === "form" ? "返回使用帮助" : "返回"}">‹</button><h1>问题反馈</h1>${button("查看记录", "feedback:history", "fb-history")}</header>${data.view === "history" ? historyPage() : data.view === "detail" ? detail() : form()}</div>`;
    }
    function updateForm() {
      if (state.current !== "HELP-02" || entry().view !== "form") return;
      const draft = entry().draft, error = errors.get(owner()) || (!composing ? problem() : "");
      const counter = screen.querySelector("#feedback-count"), feedback = screen.querySelector("#feedback-error"), save = screen.querySelector("#feedback-save"), text = screen.querySelector("#feedback-text");
      if (counter) counter.textContent = `${count(draft.text)} / ${LIMIT}`;
      if (feedback) feedback.textContent = error;
      if (text) text.setAttribute("aria-invalid", String(Boolean(problem())));
      if (save) { save.disabled = saving || composing || !draft.text.trim() || Boolean(problem()); save.textContent = errors.get(owner()) ? "重试保存反馈" : "保存反馈"; }
    }
    function input(event) {
      const target = event.target;
      if (!["feedback-text", "feedback-type", "feedback-logs", "feedback-commerce"].includes(target.id)) return false;
      if (state.current !== "HELP-02" || entry().view !== "form") return true;
      if (target.id === "feedback-commerce") { entry().draft.commerceContext = target.checked ? cleanCommerce(commerceContext()) || cleanCommerce(entry().draft.commerceContext) : null; persistDraft(); render(); return true; }
      if (target.id === "feedback-text") entry().draft.text = target.value;
      if (target.id === "feedback-type" && TYPES.includes(target.value)) entry().draft.type = target.value;
      if (target.id === "feedback-logs") entry().draft.logsAllowed = target.checked;
      persistDraft(); updateForm(); return true;
    }
    function capture() {
      if (screen.dataset.page !== "HELP-02") return;
      if (screen.querySelector(".fb-page")?.dataset.view !== entry().view) return;
      entry().top[entry().view] = screen.scrollTop;
    }
    function afterRender() { if (state.current === "HELP-02") { screen.scrollTop = entry().top[entry().view] || 0; updateForm(); } }
    function changeView(view, from) {
      capture(); const data = entry();
      if (from) data.detailFrom = from;
      data.view = view; persistDraft(); render();
    }
    function back() {
      if (state.current !== "HELP-02") return false;
      if (entry().view === "detail") changeView(entry().detailFrom);
      else if (entry().view === "history") changeView("form");
      else { capture(); persistDraft(); if (!leave()) go("HELP-01", false); }
      return true;
    }
    function save() {
      if (state.current !== "HELP-02" || entry().view !== "form" || saving || composing || !screen.querySelector("#feedback-save")) return;
      const field = screen.querySelector("#feedback-text");
      if (field) entry().draft.text = field.value;
      const data = entry();
      if (!data.draft.text.trim() || problem()) { errors.set(owner(), problem() || "请先描述遇到的问题，再保存反馈。"); updateForm(); return; }
      saving = true;
      const ticket = { id: `FB-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, ownerAccount: owner(), type: data.draft.type, text: data.draft.text, createdAt: new Date().toISOString(), logsAllowed: data.draft.logsAllowed === true, status: "local-draft", commerceContext: cleanCommerce(data.draft.commerceContext) };
      const next = { ...data, draft: emptyDraft(), view: "detail", selectedId: ticket.id, detailFrom: "form", top: { ...data.top, detail: 0, form: 0 } };
      const ok = write({ feedbackFlow: snapshot(next), feedbackTickets: [ticket, ...tickets()], activeFeedbackTicketId: ticket.id, feedbackSubmitted: true });
      saving = false;
      if (!ok) { errors.set(owner(), "这次没能保存反馈。草稿和已有记录都还在，请重试保存；暂时不要刷新或关闭页面。"); updateForm(); return; }
      working.set(owner(), next); errors.set(owner(), ""); render();
    }
    function handle(action) {
      if (typeof action !== "string") return false;
      if (action === "previous" && state.current === "HELP-02") return back();
      if (/^feedback-(submit|new|list)$|^feedback-view:/.test(action) || action === "toggle:logConsent") return true;
      if (!action.startsWith("feedback:")) return false;
      if (state.current !== "HELP-02") return true;
      if (action === "feedback:save") { save(); return true; }
      if (action === "feedback:attach-current") { if (entry().view === "form" && cleanCommerce(commerceContext())) { entry().draft.commerceContext = cleanCommerce(commerceContext()); persistDraft(); render(); } return true; }
      if (action === "feedback:back") return back();
      if (action === "feedback:history") { changeView("history"); return true; }
      if (action === "feedback:new") { changeView("form"); return true; }
      if (action.startsWith("feedback:view:")) {
        const id = action.slice("feedback:view:".length);
        if (!ownTickets().some(ticket => ticket.id === id)) return true;
        const from = entry().view === "history" ? "history" : "form";
        entry().selectedId = id; changeView("detail", from); return true;
      }
      return true;
    }
    screen.addEventListener("compositionstart", event => { if (event.target.id === "feedback-text") { composing = true; updateForm(); } });
    screen.addEventListener("compositionend", event => { if (event.target.id === "feedback-text") { composing = false; input(event); } });
    screen.addEventListener("scroll", () => { if (state.current === "HELP-02") { capture(); persistDraft(); } }, { passive: true });
    return { page, handle, back, input, capture, afterRender, prepareCommerce };
  };
})();
