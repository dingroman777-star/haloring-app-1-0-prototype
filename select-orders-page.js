/* SEL-10: derive list presentation without changing order or payment facts. */
(() => {
  "use strict";
  const FILTERS = [{ id: "all", label: "全部" }, { id: "pending", label: "待付款" }, { id: "paid", label: "已付款" }, { id: "aftersale", label: "售后" }];
  function create({ state, persist, e, icon, money, afterSaleLabel, dispatch }) {
    state.orderFilter = state.orderFilter === "receiving" ? "paid" : FILTERS.some(item => item.id === state.orderFilter) ? state.orderFilter : "all";
    state.ordersListTops = state.ordersListTops && typeof state.ordersListTops === "object" ? state.ordersListTops : {};
    let displayedActions = {};
    let notice = "";
    const orders = () => state.orders.filter(order => order && typeof order.id === "string" && order.id && window.haloCommercialStorage.owns(order));
    const afterSale = order => state.afterSales.find(item => item?.order?.id === order.id && item.id);
    const matches = (order, filter) => filter === "all" || filter === "pending" && ["pending-payment", "processing"].includes(order.status) || filter === "paid" && order.status === "paid" || filter === "aftersale" && Boolean(afterSale(order));
    const statusText = order => order.status === "paid" ? "已付款" : order.status === "processing" ? "支付确认中" : order.status === "pending-payment" ? order.paymentResult === "failed" ? "支付未完成" : order.paymentResult === "deferred" ? "已暂缓支付" : "待付款" : "状态待核对";
    const statusKey = order => [order.status, order.paymentResult, afterSale(order)?.id, afterSale(order)?.status].join("|");
    const actionFor = order => {
      const support = afterSale(order);
      if (support) return { label: "查看售后进度", action: `commercial:open-aftersale:${support.id}` };
      if (order.status === "processing") return { label: "查看支付进度", action: `commercial:resume-payment:${order.id}` };
      if (order.status === "pending-payment") return { label: order.paymentResult === "failed" ? "重试支付" : "继续支付", action: `commercial:resume-payment:${order.id}` };
      return null;
    };
    function timeLabel(value) {
      if (typeof value !== "string") return "时间未记录";
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.replaceAll("-", ".");
      if (!Number.isFinite(Date.parse(value))) return "时间未记录";
      return new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
    }
    const quantity = value => Number.isSafeInteger(value) && value > 0 ? value : null;
    function render() {
      const filter = state.orderFilter, all = orders();
      displayedActions = {};
      const rows = all.filter(order => matches(order, filter)).map(order => {
        const support = afterSale(order), primary = actionFor(order);
        if (primary) displayedActions[order.id] = primary.action;
        const items = order.lines?.length ? order.lines.map(line => ({ title: line.title || "商品名称未记录", specification: line.specification || "", quantity: quantity(line.quantity) })) : [{ title: order.title || "商品名称未记录", specification: order.lines ? "" : order.specification || "", quantity: quantity(order.quantity) }];
        return { id: order.id, tail: order.id.slice(-6), createdAt: timeLabel(order.createdAt), status: statusText(order), statusTone: order.status === "processing" ? "processing" : order.status === "pending-payment" ? "pending" : order.status === "paid" ? "paid" : "neutral", items,
          amountLabel: order.status === "paid" ? support ? "原实付" : "实付" : order.status === "processing" ? "本次支付" : order.status === "pending-payment" ? "待付" : "订单金额",
          amount: money(order.payable) || "金额未记录", message: support ? afterSaleLabel(support) : order.status === "paid" ? order.deliverySnapshot?.shipping || order.shipping || "配送信息待确认" : order.status === "processing" ? "正在确认，请勿重复付款" : "",
          primary: primary ? { label: primary.label, action: `commercial:order-list-action:${order.id}` } : null };
      });
      const context = state.ordersLastOpened;
      const previous = context && all.find(order => order.id === context.id);
      const contextOrder = previous && context.filter === filter && !matches(previous, filter) && statusKey(previous) !== context.status ? { id: previous.id, text: `刚查看的订单${statusText(previous)}，可继续查看。`, action: `commercial:open-order:${previous.id}` } : null;
      return window.HALO_SELECT_ORDERS_VIEW.render({ e, icon, filters: FILTERS.map(item => ({ ...item, count: all.filter(order => matches(order, item.id)).length })), filter, rows, total: all.length, notice, contextOrder });
    }
    function capture() {
      const scroll = document.querySelector('#screen[data-page="SEL-10"] .select-orders-scroll');
      if (scroll) state.ordersListTops[state.orderFilter] = scroll.scrollTop;
    }
    function remember(order) {
      capture(); state.ordersLastOpened = { id: order.id, filter: state.orderFilter, status: statusKey(order) };
      state.selectedOrderId = order.id; persist();
    }
    function handleAction(command, value, ctx) {
      if (document.getElementById("screen")?.dataset.page !== "SEL-10") return ["order-list-action", "order-filter"].includes(command);
      if (command === "order-filter") {
        const next = value === "receiving" ? "paid" : value;
        if (!FILTERS.some(item => item.id === next)) return true;
        capture(); state.orderFilter = next; state.ordersLastOpened = null; notice = "";
        if (!persist()) notice = "当前筛选暂未保存，刷新后可能恢复原筛选。";
        ctx.render(); queueMicrotask(() => document.querySelector(`[data-action="commercial:order-filter:${next}"]`)?.focus({ preventScroll: true })); return true;
      }
      if (command === "order-list-action") {
        const order = orders().find(item => item.id === value), action = order && actionFor(order);
        if (!action || action.action !== displayedActions[value]) { notice = "订单状态已更新，请核对后继续。"; ctx.render(); return true; }
        notice = ""; remember(order); dispatch(action.action, ctx); return true;
      }
      if (command === "open-order") {
        const order = orders().find(item => item.id === value);
        if (!order) { notice = "没有找到这笔订单，请重新选择。"; ctx.render(); return true; }
        remember(order);
      }
      return false;
    }
    function observe(item) {
      if (item.id !== "SEL-10") return;
      queueMicrotask(() => {
        const root = document.querySelector('#screen[data-page="SEL-10"] .select-orders');
        const scroll = root?.querySelector('.select-orders-scroll');
        if (!scroll) return;
        const top = state.ordersListTops[state.orderFilter];
        scroll.scrollTop = Number.isFinite(top) ? Math.max(0, top) : 0;
        scroll.onscroll = () => { capture(); persist(); };
        root.onkeydown = event => { if (["ArrowLeft", "ArrowRight"].includes(event.key)) event.stopPropagation(); };
      });
    }
    return { render, observe, handleAction };
  }
  window.HALO_SELECT_ORDERS_PAGE = { create };
})();
