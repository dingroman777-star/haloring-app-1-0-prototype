/* SEL-11 presentation only. The controller owns order facts, actions and reading position. */
(() => {
  "use strict";

  function render(vm) {
    const { e, icon } = vm;
    const present = value => value !== undefined && value !== null && String(value).trim() !== "";
    const header = `<header class="select-order-detail-header"><button type="button" data-action="previous" aria-label="返回上一页">${icon("back")}</button><h1>订单详情</h1><span aria-hidden="true"></span></header>`;
    const page = (body, footer = "") => `<div class="select-order-detail" data-order-id="${e(vm.id || "")}">${header}<div class="select-order-detail-scroll">${body}</div>${footer}</div>`;
    if (vm.empty) {
      return page(`<section class="select-order-detail-empty"><h2>${e(vm.title || "未找到这笔订单")}</h2>${vm.message ? `<p>${e(vm.message)}</p>` : ""}<button type="button" data-action="go:SEL-10">返回订单列表</button></section>`);
    }

    const status = `<section class="select-order-detail-status" aria-label="订单状态"><div role="status" aria-live="polite" aria-atomic="true">${vm.title ? `<h2>${e(vm.title)}</h2>` : ""}${vm.message ? `<p>${e(vm.message)}</p>` : ""}</div>${present(vm.amount) ? `<div class="select-order-detail-amount">${vm.amountLabel ? `<span>${e(vm.amountLabel)}</span>` : ""}<strong>${e(vm.amount)}</strong></div>` : ""}</section>`;
    const items = Array.isArray(vm.items) ? vm.items : [];
    const products = items.length ? `<section class="select-order-detail-items" aria-label="订单商品">${items.map(item => `<article class="select-order-detail-item"><div class="select-order-detail-item-copy"><h2>${e(item.title || "")}</h2>${item.specification ? `<p>${e(item.specification)}</p>` : ""}</div><div class="select-order-detail-item-values">${present(item.amount) ? `<strong>${e(item.amount)}</strong>` : ""}${present(item.quantity) ? `<span aria-label="数量 ${e(item.quantity)} 件">× ${e(item.quantity)}</span>` : ""}</div></article>`).join("")}</section>` : "";
    const information = (title, value, className) => present(value) ? `<section class="select-order-detail-information ${className}"><h2>${e(title)}</h2><p>${e(value)}</p></section>` : "";
    const address = information(vm.addressTitle || "收货信息", vm.address, "select-order-detail-address");
    const delivery = information(vm.deliveryTitle || "配送信息", vm.delivery, "select-order-detail-delivery");
    const pairs = rows => rows.filter(row => row && present(row.label) && present(row.value)).map(row => `<div><dt>${e(row.label)}</dt><dd>${e(row.value)}</dd></div>`).join("");
    const feeRows = pairs(Array.isArray(vm.fees) ? vm.fees : []);
    const fees = feeRows ? `<details class="select-order-detail-fees" id="select-order-detail-fees" ${vm.feesOpen ? "open" : ""}><summary><span>费用明细</span>${icon("next")}</summary><dl>${feeRows}</dl></details>` : "";
    const metadataRows = pairs(Array.isArray(vm.metadata) ? vm.metadata : []);
    const metadata = metadataRows ? `<dl class="select-order-detail-metadata" aria-label="订单记录">${metadataRows}</dl>` : "";
    const notice = vm.notice ? `<p class="select-order-detail-notice" role="status" aria-live="polite">${e(vm.notice)}</p>` : "";
    const button = (action, className) => action?.label && action?.action ? `<button type="button" class="${className}" data-action="${e(action.action)}">${e(action.label)}</button>` : "";
    const secondary = button(vm.secondary, "select-order-detail-secondary");
    const primary = button(vm.primary, "select-order-detail-primary");
    const footer = primary || secondary ? `<footer class="select-order-detail-footer${primary && secondary ? "" : " is-single"}">${notice}${secondary}${primary}</footer>` : "";
    return page(`${status}${products}${address}${delivery}${fees}${metadata}`, footer);
  }

  window.HALO_SELECT_ORDER_DETAIL_VIEW = { render };
})();
