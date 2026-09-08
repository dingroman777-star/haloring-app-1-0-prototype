/* SEL-11: original order facts, guarded next actions and per-order reading state. */
(() => {
  "use strict";
  function create({ state, persist, currentOrder, afterSale, afterSaleLabel, money, e, icon }) {
    state.orderDetailViews = state.orderDetailViews && typeof state.orderDetailViews === "object" && !Array.isArray(state.orderDetailViews) ? state.orderDetailViews : {};
    let shownId = null, shownAction = null, notice = "";
    const viewFor = id => Object.hasOwn(state.orderDetailViews, id) ? state.orderDetailViews[id] : {};
    const amount = value => money(value) || "未记录";
    const discount = value => money(value) ? `−${money(value)}` : "未记录";
    function time(value) {
      if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return "未记录";
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.replaceAll("-", ".");
      return new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
    }
    function nextAction(order) {
      if (!order) return null;
      const support = afterSale(order);
      if (support?.id) return { label: "查看售后进度", action: `commercial:open-aftersale:${support.id}` };
      if (order.status === "processing") return { label: "查看支付进度", action: `commercial:resume-payment:${order.id}` };
      if (order.status === "pending-payment") return { label: order.paymentResult === "failed" ? "重试支付" : "继续支付", action: `commercial:resume-payment:${order.id}` };
      if (order.status === "paid") return { label: "申请售后", action: `commercial:order-detail-aftersale:${order.id}` };
      return null;
    }
    function capture() {
      const root = document.querySelector('#screen[data-page="SEL-11"] .select-order-detail');
      const scroll = root?.querySelector('.select-order-detail-scroll');
      if (!root?.dataset.orderId || !scroll) return;
      state.orderDetailViews[root.dataset.orderId] = { top: scroll.scrollTop, feesOpen: Boolean(root.querySelector('.select-order-detail-fees')?.open) };
    }
    function render() {
      capture();
      const order = currentOrder();
      if (shownId !== order?.id) notice = "";
      shownId = order?.id || null;
      shownAction = nextAction(order)?.action || null;
      const base = { e, icon, notice, secondary: { label: "返回订单列表", action: "go:SEL-10" } };
      if (!order) return window.HALO_SELECT_ORDER_DETAIL_VIEW.render({ ...base, empty: true, title: "没有找到这笔订单", message: "请回到订单列表重新选择。" });
      const support = afterSale(order), paid = order.status === "paid", pending = order.status === "pending-payment", processing = order.status === "processing";
      const title = support ? afterSaleLabel(support) : paid ? "已付款" : processing ? "支付确认中" : pending ? order.paymentResult === "failed" ? "支付未完成" : order.paymentResult === "deferred" ? "已暂缓支付" : "待付款" : "订单状态待核对";
      const message = support ? `${support.type} · 可查看处理进度` : processing ? "正在确认结果，请勿重复付款。" : pending ? order.paymentResult === "failed" ? "订单仍保留，可重新尝试支付。" : "订单已保留，可以继续付款。" : paid ? "付款已完成。" : "暂时无法确认订单状态，请从订单列表重新查看。";
      const lines = Array.isArray(order.lines) && order.lines.length ? order.lines : [{ title: order.title, specification: order.specification, quantity: order.quantity, subtotal: order.subtotal }];
      const metadata = [{ label: "订单号", value: order.id }, { label: "创建时间", value: time(order.createdAt) }];
      if (paid) metadata.push({ label: "支付时间", value: time(order.paidAt) });
      const shipping = order.deliverySnapshot?.shipping || order.shipping || "配送说明暂未提供";
      return window.HALO_SELECT_ORDER_DETAIL_VIEW.render({ ...base, id: order.id, title, message,
        amountLabel: paid ? support ? "原实付金额" : "实付金额" : processing ? "本次支付金额" : pending ? "待付金额" : "订单金额", amount: amount(order.payable),
        items: lines.filter(Boolean).map(line => ({ title: line.title || "商品名称未记录", specification: line.specification || "", quantity: Number.isSafeInteger(line.quantity) && line.quantity > 0 ? line.quantity : null, amount: amount(line.subtotal) })),
        addressTitle: support ? "原收货信息" : "收货信息", address: order.address || "收货信息未记录",
        deliveryTitle: support ? "原配送说明" : "配送信息", delivery: support ? shipping : paid ? `${shipping}\n暂无物流信息` : processing ? "等待支付结果确认" : pending ? "付款后安排配送" : "配送状态待核对",
        fees: [{ label: "商品金额", value: amount(order.subtotal) }, { label: "优惠券", value: discount(order.coupon) }, { label: "积分抵扣", value: `${Number.isSafeInteger(order.pointsUsed) && order.pointsUsed >= 0 ? `${order.pointsUsed} Points · ` : ""}${discount(order.pointsAmount)}` }, { label: order.deliverySnapshot?.simulated ? "运费（示例）" : "运费", value: amount(order.shippingAmount) }],
        metadata, primary: nextAction(order), feesOpen: Boolean(viewFor(order.id).feesOpen) });
    }
    function handleAction(command, value, ctx) {
      const onPage = document.getElementById("screen")?.dataset.page === "SEL-11";
      if (!onPage) return command === "order-detail-aftersale";
      if (!["resume-payment", "open-aftersale", "order-detail-aftersale", "logistics-toggle"].includes(command)) return false;
      if (command === "logistics-toggle") { notice = "暂无物流信息。"; ctx.render(); return true; }
      const order = currentOrder(), intended = `commercial:${command}:${value}`;
      if (!order || order.id !== shownId || nextAction(order)?.action !== intended || shownAction !== intended) {
        notice = "订单状态已更新，请核对后继续。"; ctx.render(); return true;
      }
      capture(); persist();
      if (command === "order-detail-aftersale") { ctx.go("SEL-12"); return true; }
      return false;
    }
    function observe(item) {
      if (item.id !== "SEL-11") return;
      queueMicrotask(() => {
        const root = document.querySelector('#screen[data-page="SEL-11"] .select-order-detail');
        const scroll = root?.querySelector('.select-order-detail-scroll');
        if (!root || !scroll) return;
        const saved = viewFor(root.dataset.orderId), details = root.querySelector('.select-order-detail-fees');
        if (details) details.open = Boolean(saved.feesOpen);
        scroll.scrollTop = Number.isFinite(saved.top) ? Math.max(0, saved.top) : 0;
        scroll.onscroll = () => { if (root.isConnected) { capture(); persist(); } };
        if (details) details.ontoggle = () => { if (root.isConnected && Boolean(viewFor(root.dataset.orderId).feesOpen) !== details.open) { capture(); persist(); } };
        root.onkeydown = event => { if (["ArrowLeft", "ArrowRight"].includes(event.key)) event.stopPropagation(); };
      });
    }
    window.addEventListener("pagehide", () => {
      if (!document.querySelector('#screen[data-page="SEL-11"] .select-order-detail')) return;
      capture(); persist();
    });
    return { render, handleAction, observe };
  }
  window.HALO_SELECT_ORDER_DETAIL_PAGE = { create };
})();
