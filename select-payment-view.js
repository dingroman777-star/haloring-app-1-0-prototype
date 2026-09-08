/* SEL-09 presentation only. The commercial extension owns payment and order state. */
(() => {
  "use strict";

  function statusIcon(mode) {
    const path = mode === "ready"
      ? '<path d="M13 7h22v34l-5-3-6 3-6-3-5 3V7ZM19 16h10M19 23h10M19 30h6"/>'
      : mode === "paid"
      ? '<circle cx="24" cy="24" r="17"/><path d="m16 24 5.5 5.5L32 19"/>'
      : mode === "deferred"
        ? '<circle cx="24" cy="24" r="17"/><path d="M24 14v11l7 4"/>'
      : mode === "processing"
        ? '<path d="M15 7h18M15 41h18M17 7v8c0 4 3 6 7 9-4 3-7 5-7 9v8M31 7v8c0 4-3 6-7 9 4 3 7 5 7 9v8M18 34h12"/>'
        : '<circle cx="24" cy="24" r="17"/><path d="M24 14v13M24 33h.01"/>';
    return `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${path}</svg>`;
  }

  function render(vm) {
    const { e, icon } = vm;
    const mode = ["ready", "processing", "paid", "failed", "deferred", "blocked", "empty", "unknown"].includes(vm.mode) ? vm.mode : "unknown";
    const present = value => value !== undefined && value !== null && String(value).trim() !== "";
    const items = Array.isArray(vm.items) ? vm.items : [];
    const header = `<header class="select-payment-header"><button type="button" data-action="${e(vm.backAction || "previous")}" aria-label="返回上一页">${icon("back")}</button><h1>${e(vm.title || "支付状态")}</h1><span aria-hidden="true"></span></header>`;
    const status = `<section class="select-payment-status" role="status" aria-live="polite" aria-atomic="true" aria-label="${e(vm.title || "支付状态")}"><span class="select-payment-symbol">${statusIcon(mode)}</span>${vm.message ? `<p>${e(vm.message)}</p>` : ""}</section>`;
    const amount = present(vm.amount) ? `<div class="select-payment-amount">${vm.amountLabel ? `<span>${e(vm.amountLabel)}</span>` : ""}<strong>${e(vm.amount)}</strong></div>` : "";
    const products = items.length ? `<section class="select-payment-items" aria-label="订单商品">${items.map(item => `<article class="select-payment-item"><div><h2>${e(item.title || "")}</h2>${item.specification ? `<p>${e(item.specification)}</p>` : ""}</div>${present(item.quantity) ? `<span class="select-payment-quantity" aria-label="数量 ${e(item.quantity)} 件">× ${e(item.quantity)}</span>` : ""}</article>`).join("")}</section>` : "";
    const details = [
      present(vm.orderId) ? `<div><dt>订单号</dt><dd>${e(vm.orderId)}</dd></div>` : "",
      mode === "paid" && present(vm.shipping) ? `<div><dt>${e(vm.shippingLabel || "配送说明")}</dt><dd>${e(vm.shipping)}</dd></div>` : "",
      mode === "paid" && present(vm.paidAt) ? `<div><dt>支付时间</dt><dd>${e(vm.paidAt)}</dd></div>` : ""
    ].filter(Boolean).join("");
    const order = details ? `<dl class="select-payment-details" aria-label="订单信息">${details}</dl>` : "";
    const notice = vm.notice ? `<p class="select-payment-notice" role="status" aria-live="polite">${e(vm.notice)}</p>` : "";
    const button = (action, className) => action?.label && action?.action ? `<button type="button" class="${className}" data-action="${e(action.action)}">${e(action.label)}</button>` : "";
    const actions = button(vm.primary, "select-payment-primary") + button(vm.secondary, "select-payment-secondary");
    const demo = !["empty", "unknown"].includes(mode) ? '<p class="select-payment-demo">本地模拟，不发生真实扣款</p>' : "";
    const footer = actions || demo ? `<footer class="select-payment-footer">${actions}${demo}</footer>` : "";
    return `<div class="select-payment" data-payment-mode="${mode}">${header}<div class="select-payment-scroll">${status}${amount}${products}${order}${notice}</div>${footer}</div>`;
  }

  window.HALO_SELECT_PAYMENT_VIEW = { render };
})();
