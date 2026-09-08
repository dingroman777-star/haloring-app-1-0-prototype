/* SEL-13: query is read-only; review-only receipts and return details are saved atomically. */
(() => {
  "use strict";
  const STATES = ["submitted", "reviewing", "return-required", "refunding", "exchanging", "completed", "rejected", "failed"];
  const TYPES = ["退货退款", "仅退款", "换货"];
  function create({ state, persist, saveAfterSale, restorePoints, money, e, icon }) {
    state.afterSaleReturnDrafts = state.afterSaleReturnDrafts && typeof state.afterSaleReturnDrafts === "object" && !Array.isArray(state.afterSaleReturnDrafts) ? state.afterSaleReturnDrafts : {};
    let shownId = null, shownOrder = null, editId = null, notice = "";
    const current = () => state.afterSales.find(row => row?.id === state.afterSaleSnapshot?.id && row?.order?.id && row.order.id === state.afterSaleSnapshot?.order?.id) || null;
    const compatible = (s, status = s.status) => TYPES.includes(s.type) && STATES.includes(status) && !(s.type === "仅退款" && status === "return-required") && !(s.type === "换货" && status === "refunding") && !(s.type !== "换货" && status === "exchanging");
    const mayReturn = s => compatible(s) && s.status === "return-required";
    const shipmentValid = d => d && typeof d.carrier === "string" && d.carrier.trim().length > 0 && d.carrier.trim().length <= 40 && typeof d.trackingNumber === "string" && /^[A-Za-z0-9-]{4,60}$/.test(d.trackingNumber.replace(/\s/g, ""));
    const draftFor = s => { const d = Object.hasOwn(state.afterSaleReturnDrafts, s.id) ? state.afterSaleReturnDrafts[s.id] : s.returnShipment; return d && typeof d === "object" ? { carrier: "", trackingNumber: "", ...d } : { carrier: "", trackingNumber: "" }; };
    const returnedPoints = s => state.pointsTransactions.find(row => row.id === `aftersale:${s.id}:points-restored`);
    function title(s) {
      if (!compatible(s)) return "售后状态待核对";
      return ({ submitted: "申请已提交", reviewing: "正在审核", "return-required": shipmentValid(s.returnShipment) ? "寄回信息已提交" : "等待寄回商品", refunding: "退款处理中", exchanging: "换货寄送中", completed: s.type === "换货" ? "换货已完成" : "退款已完成", rejected: "申请未通过", failed: "进度暂时无法更新" })[s.status];
    }
    function description(s) {
      if (!compatible(s)) return "暂时无法确认处理状态，请联系售后核对。";
      return ({ submitted: "请等待审核，有进展后可在这里查看。", reviewing: "售后正在核对申请，请耐心等待。", "return-required": shipmentValid(s.returnShipment) ? "请保留寄件凭证，等待售后确认收件。" : "请先联系售后确认寄回地址，再寄出商品。", refunding: "退款正在处理，请留意原支付账户。", exchanging: "换货商品正在寄送，配送信息请联系售后确认。", completed: s.type === "换货" ? "换货处理已完成，仍有问题可联系售后。" : "如原支付账户尚未收到退款，请联系售后核对。", rejected: s.reviewReason || "具体原因暂未提供，请联系售后了解。", failed: "申请仍保留，可以重试查询或联系售后。" })[s.status];
    }
    function time(value) { if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return "时间未记录"; return new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value)); }
    const keyLabel = s => s.type === "换货" ? "处理方式" : s.status === "completed" && s.refundReceipt?.afterSaleId === s.id && s.refundReceipt.orderId === s.order.id && money(s.refundReceipt.amount) ? "退款金额" : s.status === "completed" ? "原申请退款金额" : "申请退款金额";
    const mainAmount = s => s.type === "换货" ? "更换商品" : keyLabel(s) === "退款金额" ? money(s.refundReceipt.amount) : money(s.order.payable) || "金额待核对";
    function render() {
      const s = current();
      if (shownId !== s?.id || shownOrder !== s?.order.id) { editId = null; notice = ""; }
      shownId = s?.id || null; shownOrder = s?.order.id || null;
      if (s && !mayReturn(s)) editId = null;
      const header = `<header class="as-progress-header"><button type="button" data-action="previous" aria-label="返回上一页">${icon("back")}</button><h1>售后进度</h1><span></span></header>`;
      const page = (body, footer = "") => `<div class="as-progress" data-aftersale-id="${e(shownId || "")}">${header}<div class="as-progress-scroll">${body}</div>${footer}</div>`;
      if (!s) return page('<section class="as-progress-empty"><h2>没有找到这笔售后申请</h2><p>请从订单列表重新选择。</p><button type="button" class="primary" data-action="go:SEL-10">查看订单列表</button></section>');
      const label = title(s), tx = returnedPoints(s), qty = Number.isSafeInteger(s.order.pointsUsed) ? s.order.pointsUsed : null;
      const points = s.type === "换货" ? '<p>原支付金额与积分不变。</p>' : qty > 0 ? `<p>${tx ? `已退回 ${tx.amount} Points${tx.offset > 0 ? `（其中 ${tx.offset} Points 用于积分调整）` : ""}` : s.status === "completed" ? "积分退回进度待确认" : `申请退回 ${qty} Points`}</p>` : "";
      const hasShipment = shipmentValid(s.returnShipment);
      const history = [{ label: "提交申请", at: s.submittedAt }, ...(s.status === "return-required" && hasShipment ? [{ label: "等待寄回商品", at: s.updatedAt }] : []), ...(hasShipment ? [{ label: "提交寄回信息", at: s.returnShipment.submittedAt }] : []), ...(s.status !== "submitted" && !(s.status === "return-required" && hasShipment) ? [{ label, at: s.updatedAt || s.completedAt }] : [])];
      const timeline = `<ol class="as-progress-timeline" aria-label="处理记录">${history.map((row, i) => `<li class="${i === history.length - 1 ? "is-current" : ""}"><span aria-hidden="true"></span><div><strong>${e(row.label)}</strong><small>${e(time(row.at))}</small></div></li>`).join("")}</ol>`;
      const summary = `<section class="as-progress-status"><h2>${e(label)}</h2><p>${e(description(s))}</p><div class="as-progress-amount"><span>${e(keyLabel(s))}</span><strong>${e(mainAmount(s))}</strong></div>${points}</section>`;
      const shipping = shipmentValid(s.returnShipment) ? `<section class="as-progress-shipment"><h2>寄回信息</h2><p>${e(s.returnShipment.carrier)}<br>${e(s.returnShipment.trackingNumber)}</p></section>` : s.evidence ? '<section class="as-progress-shipment"><h2>寄回信息</h2><p>历史记录中暂未填写快递公司和运单号。</p></section>' : "";
      const draft = draftFor(s), form = editId === s.id ? `<section class="as-progress-form" aria-label="填写寄回信息"><h2>填写寄回信息</h2><p>请核对运单号，保存后可在本页查看。</p><label for="as-return-carrier">快递公司</label><input id="as-return-carrier" maxlength="40" value="${e(draft.carrier)}" placeholder="填写实际寄回的快递公司" autocomplete="off"><label for="as-return-tracking">运单号</label><input id="as-return-tracking" maxlength="70" value="${e(draft.trackingNumber)}" placeholder="填写运单上的字母或数字" autocomplete="off" spellcheck="false"></section>` : "";
      const meta = `<details class="as-progress-details"><summary>申请详情${icon("next")}</summary><dl>${[["售后类型", s.type], ["原因", s.reason || "未记录"], ["补充说明", s.note || "未填写"], ["售后单号", s.id], ["关联订单", s.order.id]].map(([k,v]) => `<div><dt>${e(k)}</dt><dd>${e(v)}</dd></div>`).join("")}</dl><button class="as-progress-order" type="button" data-action="commercial:open-order:${e(s.order.id)}">查看原订单 ${icon("next")}</button></details>`;
      const primary = editId === s.id ? `<button type="button" class="primary" data-action="commercial:aftersale-return-save" ${shipmentValid(draft) ? "" : "disabled"}>保存寄回信息</button>` : mayReturn(s) ? `<button type="button" class="primary" data-action="commercial:aftersale-upload">${shipmentValid(s.returnShipment) ? "修改寄回信息" : "填写寄回信息"}</button>` : compatible(s) && !["completed", "rejected"].includes(s.status) ? '<button type="button" class="primary" data-action="commercial:aftersale-refresh">刷新进度</button>' : `<button type="button" class="primary" data-action="commercial:open-order:${e(s.order.id)}">查看原订单</button>`;
      const footer = `<footer class="as-progress-footer"><p id="as-progress-notice" role="status" aria-live="polite">${e(notice || (editId === s.id && !shipmentValid(draft) ? "请核对快递公司和运单号" : ""))}</p><div><button type="button" data-action="${editId === s.id ? "commercial:aftersale-return-cancel" : "go:HELP-03"}">${editId === s.id ? "暂不保存" : "联系售后"}</button>${primary}</div>${mayReturn(s) && editId !== s.id ? '<button type="button" class="as-progress-query" data-action="commercial:aftersale-refresh">刷新进度</button>' : ""}</footer>`;
      return page(summary + timeline + form + shipping + meta, footer);
    }
    function commit(s, change, ctx) {
      const keys = ["orders", "orderSnapshot", "afterSales", "afterSaleSnapshot", "afterSaleStatus", "afterSaleReturnDrafts", "pointsBalance", "pointsTransactions", "pendingPointsCorrection", "pointsMode"];
      const before = Object.fromEntries(keys.map(k => [k, structuredClone(state[k])]));
      if (change() !== false && persist()) return true;
      Object.assign(state, before); notice = "暂未保存成功，原进度和填写内容已保留，请重试。"; ctx.render(); return false;
    }
    function handleAction(command, value, ctx) {
      if (!["aftersale-refresh", "aftersale-upload", "aftersale-return-save", "aftersale-return-cancel", "aftersale-state"].includes(command)) return false;
      if (document.getElementById("screen")?.dataset.page !== "SEL-13") return true;
      const s = current();
      if (!s || s.id !== shownId || s.order.id !== shownOrder) { notice = "这笔售后记录已变化，请重新查看。"; ctx.render(); return true; }
      if (command === "aftersale-refresh") { notice = navigator.onLine === false ? "网络不可用，已保留上次进度，请联网后重试。" : `当前进度：${title(s)}。`; ctx.render(); return true; }
      if (command === "aftersale-return-cancel") { editId = null; notice = "填写内容已保留，可稍后继续。"; ctx.render(); return true; }
      if (command === "aftersale-upload") {
        if (!mayReturn(s)) { notice = "当前不需要填写寄回信息。"; ctx.render(); return true; }
        editId = s.id; notice = ""; ctx.render(); queueMicrotask(() => document.getElementById('as-return-carrier')?.focus()); return true;
      }
      if (command === "aftersale-return-save") {
        const draft = draftFor(s);
        if (!mayReturn(s) || editId !== s.id) { notice = "处理状态已更新，请重新核对。"; ctx.render(); return true; }
        if (!shipmentValid(draft)) { notice = "请核对快递公司和运单号。"; ctx.render(); return true; }
        const shipment = { carrier: draft.carrier.trim(), trackingNumber: draft.trackingNumber.replace(/\s/g, ""), submittedAt: new Date().toISOString() };
        if (!commit(s, () => { saveAfterSale({ ...s, returnShipment: shipment }, false); delete state.afterSaleReturnDrafts[s.id]; }, ctx)) return true;
        editId = null; notice = "寄回信息已保存，请等待售后处理。"; ctx.render(); return true;
      }
      // Only inspector controls call this. Refresh never uses a transition or changes a ledger.
      if (!compatible(s, value)) { notice = "该状态不适用于这笔售后。"; ctx.render(); return true; }
      if (s.status === "completed") { notice = value === "completed" ? "这笔售后已完成。" : "已完成的售后不能改回处理中。"; ctx.render(); return true; }
      if (value === s.status) { notice = "当前已是此状态。"; ctx.render(); return true; }
      if (value === "completed" && s.order.status !== "paid") { notice = "原订单支付状态待核对，暂不能确认完成。"; ctx.render(); return true; }
      if (value === "completed" && s.type !== "换货" && (!money(s.order.payable) || !Number.isSafeInteger(s.order.pointsUsed) || s.order.pointsUsed < 0)) { notice = "原订单金额信息不完整，暂不能确认退款。"; ctx.render(); return true; }
      const at = new Date().toISOString();
      const updated = { ...s, status: value, updatedAt: at, ...(value === "completed" ? { completedAt: at, ...(s.type !== "换货" ? { refundReceipt: { afterSaleId: s.id, orderId: s.order.id, amount: s.order.payable, refundedAt: at, simulated: true } } : {}) } : {}) };
      if (!commit(s, () => {
        saveAfterSale(updated, false);
        if (value === "completed" && s.type !== "换货" && s.order.pointsUsed > 0 && !returnedPoints(s) && !restorePoints(updated, false)) return false;
      }, ctx)) return true;
      notice = ""; ctx.render(); return true;
    }
    function handleInput(target, ctx) {
      if (!["as-return-carrier", "as-return-tracking"].includes(target.id)) return false;
      const s = current();
      if (!s || s.id !== shownId || s.order.id !== shownOrder || editId !== s.id || !mayReturn(s)) { ctx.render?.(); return true; }
      const draft = { ...draftFor(s), [target.id === "as-return-carrier" ? "carrier" : "trackingNumber"]: target.value };
      state.afterSaleReturnDrafts[s.id] = draft;
      notice = persist() ? "" : "填写内容暂未保存，请勿关闭此页。";
      const button = document.querySelector('[data-action="commercial:aftersale-return-save"]'); if (button) button.disabled = !shipmentValid(draft);
      const info = document.getElementById('as-progress-notice'); if (info) info.textContent = notice || (shipmentValid(draft) ? "" : "请核对快递公司和运单号");
      return true;
    }
    return { render, handleAction, handleInput };
  }
  window.HALO_SELECT_AFTERSALE_PROGRESS = { create };
})();
