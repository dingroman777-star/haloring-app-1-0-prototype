/* SEL-05 presentation only. The commercial extension owns validation and state. */
(() => {
  "use strict";

  function render(vm) {
    const { e, icon, money, address, addressProblem, lines, totals, delivery } = vm;
    const header = `<header class="select-checkout-header"><button type="button" data-action="previous" aria-label="返回上一页">${icon("back")}</button><h1>确认订单</h1><span aria-hidden="true"></span></header>`;
    const demo = '<p class="select-checkout-demo">仅演示流程，不会扣款</p>';
    if (vm.locked) {
      const locked = vm.locked;
      return `<div class="select-checkout">${header}<div class="select-checkout-scroll"><section class="select-checkout-locked" role="status"><h2>${e(locked.title)}</h2><p>${e(locked.body)}</p><strong>${e(money(locked.amount))}</strong></section></div>${demo}<footer class="select-checkout-footer select-checkout-footer-single"><button type="button" class="primary" data-action="commercial:open-order:${e(locked.id)}">查看原订单</button></footer></div>`;
    }
    if (!lines.length) {
      return `<div class="select-checkout">${header}<div class="select-checkout-scroll"><section class="select-checkout-empty">${icon("bag")}<h2>还没有待结算商品</h2><p>选好商品后，再来确认订单。</p><button type="button" class="primary" data-action="go:SEL-01">继续选购</button></section></div></div>`;
    }

    const photo = line => line.productId === "ring"
      ? '<img src="assets/select-ring-hero-v1.png" alt="瓷白戒指图示" width="64" height="64"><small>图示：瓷白</small>'
      : `<span class="product-visual visual-${e(line.visual)}" aria-hidden="true"><i></i></span>`;
    const addressView = `<section class="select-checkout-address-section"><button type="button" class="select-checkout-address" data-action="go:SEL-07" aria-label="${address ? "更换收货地址" : "添加收货地址"}"><span>${address ? `<strong>${e(address.name)}<span>${e(address.phone)}</span></strong><span class="select-checkout-address-detail">${e(address.detail)}${address.simulated && !String(address.detail).includes("示例") ? " · 示例收货地址" : ""}</span>` : `<strong>添加收货地址</strong><span class="select-checkout-address-detail">${e(addressProblem || "请先选择收货地址")}</span>`}</span>${icon("next")}</button>${address && addressProblem ? `<p class="select-checkout-address-problem" role="status">${e(addressProblem)}</p>` : ""}</section>`;
    const products = `<section class="select-checkout-lines" aria-label="本次购买商品">${lines.map(line => `<article class="select-checkout-line" data-checkout-line="${e(line.key)}" data-unavailable="${Boolean(line.problem)}"><div class="select-checkout-photo">${photo(line)}</div><div class="select-checkout-product-copy"><div class="select-checkout-product-heading"><h2>${e(line.title)}</h2><strong>${e(money(line.subtotal))}</strong></div><button type="button" class="select-checkout-spec" data-action="commercial:checkout-spec:${e(line.key)}" aria-label="修改${e(line.title)}规格，${e(line.specification)}，${line.quantity} 件"><span>${e(line.specification)} × ${line.quantity}</span>${icon("next")}</button>${line.problem ? `<p class="select-checkout-line-problem" role="status">${e(line.problem)}</p><button type="button" class="select-checkout-text-button" data-action="commercial:checkout-remove:${e(line.key)}" aria-label="本次不买${e(line.title)}，${e(line.specification)}">本次不买</button>` : ""}</div></article>`).join("")}</section>`;
    const maxPoints = Math.max(0, Number(totals.maxPointsCount) || 0);
    const pointsCopy = vm.pointsEnabled && totals.pointsCount > 0
      ? `使用 ${Number(totals.pointsCount).toLocaleString("zh-CN")} 积分，抵 ${money(totals.points)}`
      : maxPoints > 0 ? `可用 ${maxPoints.toLocaleString("zh-CN")} 积分，抵 ${money(maxPoints / 100)}` : vm.pointsReason || "暂无可用于本单的积分";
    const feeKnown = delivery.status === "ready" && Number.isSafeInteger(delivery.feeCents) && delivery.feeCents >= 0;
    const deliveryFee = feeKnown ? `运费 ${money(delivery.feeCents / 100)}${delivery.simulated ? " · 示例" : ""}` : "运费待确认";
    const options = `<section class="select-checkout-options" aria-label="优惠与配送"><button type="button" class="select-checkout-option" data-action="go:SEL-06"><span>优惠券</span><span class="select-checkout-option-value">${totals.coupon > 0 ? `−${e(money(totals.coupon))}` : "未使用"}${icon("next")}</span></button><label class="select-checkout-points"><span><strong>Halo Points</strong><small id="checkout-points-hint">${e(pointsCopy)}</small></span><span class="select-checkout-check-target"><input type="checkbox" data-action="commercial:points-use" aria-label="使用 Halo Points 抵扣" aria-describedby="checkout-points-hint" ${vm.pointsEnabled && maxPoints > 0 ? "checked" : ""} ${maxPoints > 0 ? "" : "disabled"}></span></label><details class="select-checkout-delivery"><summary><span>配送</span><span class="select-checkout-option-value"><span>${e(deliveryFee)}<small>${e(delivery.shipping || "发货时间待确认")}</small></span>${icon("next")}</span></summary><p>${delivery.simulated ? "这里展示的是模拟配送信息，实际安排需在下单前确认。" : !feeKnown ? "运费确认后，才能继续提交订单。" : "请在提交前核对收货地址与配送信息。"}</p></details></section>`;
    const amount = `<dl class="select-checkout-amounts" aria-label="金额明细"><div><dt>商品金额</dt><dd>${e(money(totals.subtotal))}</dd></div><div><dt>优惠券</dt><dd>${totals.coupon > 0 ? "−" : ""}${e(money(totals.coupon))}</dd></div><div><dt>积分抵扣</dt><dd>${totals.points > 0 ? "−" : ""}${e(money(totals.points))}</dd></div><div><dt>运费${delivery.simulated ? "（示例）" : ""}</dt><dd>${feeKnown ? e(money(delivery.feeCents / 100)) : "待确认"}</dd></div></dl>`;
    const support = `<button type="button" class="select-checkout-option" data-action="go:HELP-03"><span>联系客服</span>${icon("next")}</button>`;
    const status = vm.problem || vm.notice;
    const footer = `<footer class="select-checkout-footer"><div class="select-checkout-payable"><small>${vm.quoteChanged ? "待确认金额" : "应付"}</small><strong>${feeKnown ? e(money(totals.payable)) : "待确认"}</strong></div><button type="button" class="primary" data-action="commercial:submit-order" ${vm.problem ? 'disabled aria-describedby="checkout-status"' : ""}>${vm.quoteChanged ? "确认更新金额" : "提交订单"}</button></footer>`;
    return `<div class="select-checkout">${header}<div class="select-checkout-scroll">${addressView}${products}${options}${amount}${support}</div>${status ? `<p class="select-checkout-status" id="checkout-status" role="status">${e(status)}</p>` : ""}${demo}${footer}</div>`;
  }

  window.HALO_SELECT_CHECKOUT_VIEW = { render };
})();
