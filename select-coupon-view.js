/* SEL-06 presentation only. The commercial extension owns eligibility and drafts. */
(() => {
  "use strict";

  function render(vm) {
    const { e, icon, money } = vm;
    const items = vm.items || [];
    const header = `<header class="select-coupon-header"><button type="button" data-action="go:SEL-05" aria-label="返回确认订单">${icon("back")}</button><h1>优惠券</h1><span aria-hidden="true"></span></header>`;
    const demo = '<p class="select-coupon-demo">仅演示流程，不会扣款</p>';
    const page = (body, footer = "") => `<div class="select-coupon">${header}<div class="select-coupon-scroll">${body}</div>${demo}${footer}</div>`;

    if (vm.locked) {
      return page(`<section class="select-coupon-empty" role="status"><h2>请查看原订单</h2><p>${e(vm.lockedText || "这笔订单已提交，优惠信息保留在原订单中。")}</p></section>`, vm.lockedOrderId ? `<footer class="select-coupon-footer select-coupon-footer-single"><button type="button" class="primary" data-action="commercial:coupon-order:${e(vm.lockedOrderId)}">查看原订单</button></footer>` : "");
    }
    if (vm.empty) {
      return page(`<section class="select-coupon-empty">${icon("bag")}<h2>先选好商品</h2><p>选好商品后，就能查看本单可用的优惠券。</p><button type="button" class="primary" data-action="go:SEL-01">去选商品</button></section>`);
    }

    const available = items.filter(item => item.available && item.status === "available");
    const unavailable = items.filter(item => !item.available || item.status !== "available");
    const rules = item => item.rules?.length ? `<details class="select-coupon-rules" data-coupon-rule="${e(item.id)}"><summary><span>使用规则</span>${icon("next")}</summary><ul>${item.rules.map(rule => `<li>${e(rule)}</li>`).join("")}</ul></details>` : "";
    const copy = item => `<span class="select-coupon-value">${e(money(item.amount))}</span><span class="select-coupon-copy"><strong>${e(item.title)}</strong><span>${e(item.condition)}</span></span>`;
    const expiry = item => item.expiry ? `<p class="select-coupon-expiry">${e(item.expiry).replace(/（北京时间）/g, '<span>（北京时间）</span>')}</p>` : "";
    const statusLabel = item => item.status === "used" ? "已使用" : item.status === "expired" ? "已过期" : "不可用";
    const availableCards = available.map(item => `<article class="select-coupon-card ${vm.draftId === item.id ? "is-selected" : ""}"><label class="select-coupon-choice">${copy(item)}<span class="select-coupon-radio-target"><input type="radio" name="select-coupon-choice" value="${e(item.id)}" data-action="commercial:coupon-select:${e(item.id)}" aria-label="${e(`${item.title}，${item.condition}`)}" ${vm.draftId === item.id ? "checked" : ""}></span></label>${expiry(item)}${rules(item)}</article>`).join("");
    const unavailableCards = unavailable.map(item => `<article class="select-coupon-card is-unavailable" data-coupon-status="${e(item.status)}"><div class="select-coupon-unavailable-main">${copy(item)}</div>${expiry(item)}<div class="select-coupon-reason"><span class="select-coupon-status-tag">${statusLabel(item)}</span>${item.reason && String(item.reason).trim() !== statusLabel(item) ? `<span>${e(item.reason)}</span>` : ""}</div>${item.status === "used" && item.orderId ? `<button type="button" class="select-coupon-order" data-action="commercial:coupon-order:${e(item.orderId)}"><span>查看使用订单</span>${icon("next")}</button>` : ""}${rules(item)}</article>`).join("");
    const noCoupon = `<label class="select-coupon-none"><span>不使用优惠券</span><span class="select-coupon-radio-target"><input type="radio" name="select-coupon-choice" value="none" data-action="commercial:coupon-select:none" ${!vm.draftId ? "checked" : ""}></span></label>`;
    const body = `${vm.notice ? `<p class="select-coupon-notice" role="status">${e(vm.notice)}</p>` : ""}<section class="select-coupon-available" aria-label="选择本单优惠券">${availableCards || '<p class="select-coupon-no-available">本单暂无可用优惠券</p>'}${noCoupon}</section>${unavailable.length ? `<details class="select-coupon-unavailable"><summary><span>不可用优惠券（${unavailable.length}）</span>${icon("next")}</summary><div class="select-coupon-unavailable-list">${unavailableCards}</div></details>` : ""}`;
    const chosen = available.some(item => item.id === vm.draftId);
    const savings = chosen && vm.discount > 0 ? `<div class="select-coupon-savings" aria-live="polite"><small>本单可减</small><strong>${e(money(vm.discount))}</strong></div>` : '<p class="select-coupon-no-savings" aria-live="polite">本单不使用优惠券</p>';
    return page(body, `<footer class="select-coupon-footer">${savings}<button type="button" class="primary" data-action="commercial:coupon-confirm">确认选择</button></footer>`);
  }

  window.HALO_SELECT_COUPON_VIEW = { render };
})();
