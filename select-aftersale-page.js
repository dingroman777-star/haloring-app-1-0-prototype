/* SEL-12: explicit choices, order-owned drafts and atomic local application submission. */
(() => {
  "use strict";
  const TYPES = [{ value: "退货退款", help: "退回商品，申请退款" }, { value: "仅退款", help: "不退回商品，申请退款" }, { value: "换货", help: "申请更换商品" }];
  const REASONS = ["商品与描述不符", "物流问题", "质量问题", "其他"];
  function create({ state, persist, currentOrder, afterSale, saveAfterSale, afterSaleLabel, money, e, icon }) {
    state.afterSaleDrafts = state.afterSaleDrafts && typeof state.afterSaleDrafts === "object" && !Array.isArray(state.afterSaleDrafts) ? state.afterSaleDrafts : {};
    let shownId = null, notice = "";
    const currentDraft = id => { const value = Object.hasOwn(state.afterSaleDrafts, id) ? state.afterSaleDrafts[id] : null; return value && typeof value === "object" && !Array.isArray(value) ? { type: "", reason: "", note: "", ...value } : { type: "", reason: "", note: "" }; };
    const validAmounts = order => Boolean(money(order.payable)) && Number.isSafeInteger(order.pointsUsed) && order.pointsUsed >= 0;
    function valid(draft) { return TYPES.some(item => item.value === draft.type) && REASONS.includes(draft.reason) && typeof draft.note === "string" && draft.note.length <= 500; }
    function hint(draft) {
      if (!TYPES.some(item => item.value === draft.type) && !REASONS.includes(draft.reason)) return "请选择售后类型和原因";
      if (!TYPES.some(item => item.value === draft.type)) return "请选择售后类型";
      if (!REASONS.includes(draft.reason)) return "请选择申请原因";
      return typeof draft.note !== "string" || draft.note.length > 500 ? "补充说明请控制在 500 字以内" : "";
    }
    function amountMarkup(order, draft) {
      if (!TYPES.some(item => item.value === draft.type)) return `<div><span>原实付金额</span><strong>${e(money(order.payable))}</strong></div>`;
      if (draft.type === "换货") return `<div><span>本次申请</span><strong>更换商品</strong></div><p>不申请退款，原支付金额与积分不变。</p>`;
      return `<div><span>申请退款金额</span><strong>${e(money(order.payable))}</strong></div>${order.pointsUsed ? `<div class="select-aftersale-points"><span>申请退回积分</span><span>${order.pointsUsed} Points</span></div>` : ""}<p>实际退款与积分退回以审核结果为准。</p>`;
    }
    function footerAmount(order, draft) {
      return draft.type === "换货" ? '<span>申请换货</span><strong>不涉及退款</strong>' : `<span>${TYPES.some(item => item.value === draft.type) ? "申请退款" : "原实付"}</span><strong>${e(money(order.payable))}</strong>`;
    }
    function render() {
      const order = currentOrder();
      if (shownId !== order?.id) notice = "";
      shownId = order?.id || null;
      const header = `<header class="select-aftersale-header"><button type="button" data-action="previous" aria-label="返回上一页">${icon("back")}</button><h1>申请售后</h1><span></span></header>`;
      const page = (body, footer = "") => `<div class="select-aftersale" data-order-id="${e(shownId || "")}">${header}<div class="select-aftersale-scroll">${body}</div>${footer}</div>`;
      const support = order && afterSale(order);
      if (!order || order.status !== "paid" || support || !validAmounts(order)) {
        const title = !order ? "没有找到这笔订单" : support ? "这笔订单已有售后申请" : order.status !== "paid" ? "当前订单暂不能申请售后" : "订单金额信息待核对";
        const message = support ? afterSaleLabel(support) : !order ? "请从订单列表重新选择。" : order.status !== "paid" ? "请先查看订单的支付状态。" : "请返回订单核对，或联系 Halo 售后。";
        const action = support ? `commercial:open-aftersale:${support.id}` : order ? `commercial:open-order:${order.id}` : "go:SEL-10";
        return page(`<section class="select-aftersale-empty"><h2>${e(title)}</h2><p>${e(message)}</p><button class="primary" type="button" data-action="${e(action)}">${support ? "查看售后进度" : order ? "返回订单" : "查看订单列表"}</button>${order && !validAmounts(order) ? '<button type="button" class="text-button" data-action="go:HELP-03">联系 Halo 售后</button>' : ""}</section>`);
      }
      const draft = currentDraft(order.id), lines = Array.isArray(order.lines) && order.lines.length ? order.lines.filter(Boolean) : [{ title: order.title, specification: order.specification, quantity: order.quantity }];
      const products = lines.map(line => `<div class="select-aftersale-product"><div><strong>${e(line.title || "商品名称未记录")}</strong><span>${e(line.specification || "")}</span></div>${Number.isSafeInteger(line.quantity) && line.quantity > 0 ? `<small>× ${line.quantity}</small>` : ""}</div>`).join("");
      const body = `<section class="select-aftersale-order"><div class="select-aftersale-order-heading"><h2>本次申请：整笔订单</h2><span>尾号 ${e(order.id.slice(-6))}</span></div><details class="select-aftersale-products"><summary>查看商品${icon("next")}</summary>${products}</details><p>如需处理部分商品，请<a href="#HELP-03" data-action="go:HELP-03">联系售后</a>。</p></section>
        <fieldset class="select-aftersale-types"><legend>售后类型<span>必选</span></legend>${TYPES.map((item, index) => `<label><input type="radio" id="aftersale-type-${index}" name="aftersale-type" value="${e(item.value)}" ${draft.type === item.value ? "checked" : ""}><span><strong>${e(item.value)}</strong><small>${e(item.help)}</small></span></label>`).join("")}</fieldset>
        <label class="select-aftersale-label" for="aftersale-reason">申请原因<span>必选</span></label><select id="aftersale-reason" aria-required="true"><option value="">请选择原因</option>${REASONS.map(value => `<option value="${e(value)}" ${draft.reason === value ? "selected" : ""}>${e(value)}</option>`).join("")}</select>
        <label class="select-aftersale-label" for="aftersale-note">补充说明<span>选填</span></label><textarea id="aftersale-note" maxlength="500" placeholder="可以描述遇到的问题，方便我们了解情况" aria-describedby="aftersale-note-count">${e(draft.note || "")}</textarea><p id="aftersale-note-count" class="select-aftersale-count">${String(draft.note || "").length}/500</p>
        <section id="aftersale-amount-summary" class="select-aftersale-amount" aria-live="polite">${amountMarkup(order, draft)}</section>`;
      const footer = `<footer class="select-aftersale-footer"><section id="aftersale-footer-amount" aria-live="polite">${footerAmount(order, draft)}</section><p id="aftersale-action-hint" role="status" aria-live="polite">${e(notice || hint(draft))}</p><div><button type="button" class="select-aftersale-back" data-action="commercial:open-order:${e(order.id)}">返回订单</button><button type="button" class="select-aftersale-submit" data-action="commercial:aftersale" aria-describedby="aftersale-action-hint" ${valid(draft) ? "" : "disabled"}>提交申请</button></div></footer>`;
      return page(body, footer);
    }
    function saveDraft(id, draft) {
      state.afterSaleDrafts[id] = draft;
      notice = persist() ? "" : "草稿暂未保存，请勿关闭此页。";
    }
    function sync() {
      const order = currentOrder(), root = document.querySelector('#screen[data-page="SEL-12"] .select-aftersale');
      if (!order || root?.dataset.orderId !== shownId || order.id !== shownId) return;
      const draft = currentDraft(order.id), submit = root.querySelector('[data-action="commercial:aftersale"]');
      if (!submit) return;
      submit.disabled = order.status !== "paid" || Boolean(afterSale(order)) || !validAmounts(order) || !valid(draft);
      root.querySelector('#aftersale-action-hint').textContent = notice || hint(draft);
      root.querySelector('#aftersale-note-count').textContent = `${String(draft.note || "").length}/500`;
      root.querySelector('#aftersale-amount-summary').innerHTML = amountMarkup(order, draft);
      root.querySelector('#aftersale-footer-amount').innerHTML = footerAmount(order, draft);
    }
    function handleInput(target, ctx) {
      const field = target.name === "aftersale-type" ? "type" : target.id === "aftersale-reason" ? "reason" : target.id === "aftersale-note" ? "note" : null;
      if (!field) return false;
      const order = currentOrder();
      if (document.getElementById("screen")?.dataset.page !== "SEL-12" || !order || order.id !== shownId || order.status !== "paid" || afterSale(order)) { ctx.render?.(); return true; }
      const value = target.value;
      if (field === "type" && !TYPES.some(item => item.value === value) || field === "reason" && value !== "" && !REASONS.includes(value)) return true;
      saveDraft(order.id, { ...currentDraft(order.id), [field]: value }); sync(); return true;
    }
    function handleAction(command, value, ctx) {
      if (command !== "aftersale") return false;
      if (document.getElementById("screen")?.dataset.page !== "SEL-12") return true;
      const order = currentOrder();
      if (!order || order.id !== shownId || order.status !== "paid" || !validAmounts(order)) { notice = "订单状态已变化，请重新核对。"; ctx.render(); return true; }
      const support = afterSale(order);
      if (support) { state.afterSaleSnapshot = support; state.afterSaleStatus = support.status; persist(); ctx.go("SEL-13"); return true; }
      const draft = currentDraft(order.id);
      if (!valid(draft)) { sync(); document.querySelector(!TYPES.some(item => item.value === draft.type) ? '#aftersale-type-0' : !REASONS.includes(draft.reason) ? '#aftersale-reason' : '#aftersale-note')?.focus(); return true; }
      const keys = ["orders", "orderSnapshot", "afterSales", "afterSaleSnapshot", "afterSaleStatus", "afterSaleDrafts"];
      const before = Object.fromEntries(keys.map(key => [key, structuredClone(state[key])]));
      saveAfterSale({ id: `AS-${order.id}`, order: structuredClone(order), type: draft.type, reason: draft.reason, note: draft.note.trim(), status: "submitted", submittedAt: new Date().toISOString() }, false);
      delete state.afterSaleDrafts[order.id];
      if (!persist()) { Object.assign(state, before); notice = "申请未提交成功，填写内容已保留，请重试。"; ctx.render(); return true; }
      notice = ""; ctx.go("SEL-13"); return true;
    }
    function observe(item) {
      if (item.id !== "SEL-12") return;
      queueMicrotask(() => {
        const root = document.querySelector('#screen[data-page="SEL-12"] .select-aftersale');
        if (root) root.onkeydown = event => { if (["ArrowLeft", "ArrowRight"].includes(event.key)) event.stopPropagation(); };
      });
    }
    return { render, handleInput, handleAction, observe };
  }
  window.HALO_SELECT_AFTERSALE_PAGE = { create };
})();
