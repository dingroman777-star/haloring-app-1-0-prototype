/* SEL-10 presentation only. The commercial extension owns orders and filtering. */
(() => {
  "use strict";

  function render(vm) {
    const { e, icon } = vm;
    const filters = Array.isArray(vm.filters) ? vm.filters : [];
    const rows = Array.isArray(vm.rows) ? vm.rows : [];
    const present = value => value !== undefined && value !== null && String(value).trim() !== "";
    const countKnown = value => Number.isSafeInteger(value) && value >= 0;
    const currentFilter = filters.find(item => item.id === vm.filter);
    const header = `<header class="select-orders-header"><button type="button" class="select-orders-back" data-action="previous" aria-label="返回上一页">${icon("back")}</button><h1>我的订单</h1><button type="button" class="select-orders-shop" data-action="go:SEL-01">继续选购</button></header>`;
    const filterBar = filters.length ? `<div class="select-orders-filters" role="group" aria-label="筛选订单">${filters.map(item => `<button type="button" class="${item.id === vm.filter ? "is-active" : ""}" data-action="commercial:order-filter:${e(item.id)}" aria-pressed="${item.id === vm.filter}" aria-controls="select-orders-results"><span>${e(item.label)}</span>${countKnown(item.count) ? `<small>${item.count}</small>` : ""}</button>`).join("")}</div>` : "";
    const notice = vm.notice ? `<p class="select-orders-notice" role="status" aria-live="polite">${e(vm.notice)}</p>` : "";
    const current = vm.contextOrder;
    const context = current?.id && current?.text && current?.action ? `<aside class="select-orders-context" aria-label="本次订单"><p>${e(current.text)}</p><button type="button" data-action="${e(current.action)}">查看此订单</button></aside>` : "";

    const card = row => {
      const items = Array.isArray(row.items) ? row.items : [];
      const products = items.slice(0, 2).map(item => `<span class="select-orders-item"><span class="select-orders-item-copy"><strong>${e(item.title || "")}</strong>${item.specification ? `<span>${e(item.specification)}</span>` : ""}</span>${present(item.quantity) ? `<span class="select-orders-quantity" aria-label="数量 ${e(item.quantity)} 件">× ${e(item.quantity)}</span>` : ""}</span>`).join("");
      const metadata = `<span class="select-orders-meta"><span>${present(row.createdAt) ? `<span>${e(row.createdAt)}</span>` : ""}${present(row.tail) ? `<span>尾号 ${e(row.tail)}</span>` : ""}</span>${row.status ? `<strong data-order-tone="${e(row.statusTone || "default")}">${e(row.status)}</strong>` : ""}</span>`;
      const more = items.length > 2 ? `<span class="select-orders-more">还有 ${items.length - 2} 项商品</span>` : "";
      const body = `<button type="button" class="select-orders-body" data-action="commercial:open-order:${e(row.id)}">${metadata}<span class="select-orders-items">${products}</span>${more}<span class="select-orders-open">查看订单${icon("next")}</span></button>`;
      const amount = present(row.amount) ? `<div class="select-orders-amount">${row.amountLabel ? `<span>${e(row.amountLabel)}</span>` : ""}<strong>${e(row.amount)}</strong></div>` : "";
      const action = row.primary?.label && row.primary?.action ? `<button type="button" class="select-orders-primary" data-action="${e(row.primary.action)}">${e(row.primary.label)}</button>` : "";
      const message = row.message ? `<p class="select-orders-message">${e(row.message)}</p>` : "";
      const footer = amount || action ? `<footer class="select-orders-card-footer">${amount}${action}</footer>` : "";
      return `<article class="select-orders-card" data-order-id="${e(row.id)}">${body}${message}${footer}</article>`;
    };

    let results;
    if (rows.length) {
      results = `<div class="select-orders-list" aria-label="订单列表">${rows.map(card).join("")}</div>`;
    } else {
      const trulyEmpty = vm.total === 0;
      const filterLabel = currentFilter?.label || "当前筛选下的";
      const title = trulyEmpty ? "还没有订单" : `暂无${filterLabel}订单`;
      const action = trulyEmpty ? "go:SEL-01" : "commercial:order-filter:all";
      const label = trulyEmpty ? "逛逛 Halo Select" : "查看全部订单";
      results = `<section class="select-orders-empty" aria-labelledby="select-orders-empty-title"><h2 id="select-orders-empty-title">${e(title)}</h2><button type="button" data-action="${action}">${label}</button></section>`;
    }
    const resultCount = rows.length ? `<p class="select-orders-result-count" role="status" aria-live="polite">${vm.filter === "all" && countKnown(vm.total) ? `共 ${vm.total} 笔订单` : `${rows.length} 笔订单`}</p>` : "";
    return `<div class="select-orders">${header}${filterBar}<div class="select-orders-scroll" id="select-orders-results">${notice}${context}${resultCount}${results}</div></div>`;
  }

  window.HALO_SELECT_ORDERS_VIEW = { render };
})();
