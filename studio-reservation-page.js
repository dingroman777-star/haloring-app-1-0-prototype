(function () {
  // Local adapter: no real reservation, payment or refund service is called.
  window.createHaloStudioReservation = function ({ state, events, event, media, payment, go, render, transactions, track, esc, icon, screen, modalRoot, closeModal }) {
    const timers = new Map();
    let transaction = null;
    const persist = () => transactions.commit(transaction);
    let intent = null, reviewSubmit = "success", reviewQuery = "success", reviewVoucher = "success";
    const currentId = () => state.selectedStudioEventId;
    const known = id => Object.prototype.hasOwnProperty.call(events, id);
    const record = (id = currentId()) => state.studioRecords?.[id];
    const validMoney = v => typeof v === "number" && Number.isFinite(v) && v >= 0 && Math.abs(v * 100 - Math.round(v * 100)) < .00001;
    const money = v => validMoney(v) ? `¥${v.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}` : "待核对";
    const unresolved = r => ["submitting", "accepted", "checking", "unknown"].includes(r?.refundRequest?.status);
    const identified = (id, r = record(id)) => transactions.owned(r) && known(id) && r?.booked && typeof r.bookingId === "string" && r.bookingId.trim();
    const stamp = () => new Date().toISOString();
    const emit = (name, req) => track(name, { event_id: req.eventId, booking_id: req.bookingId, request_id: req.id, status: req.status, simulated: true });
    const key = (id, r) => JSON.stringify([id, r?.bookingId, r?.paid, r?.paidAmount, r?.refundableAmount ?? null, r?.voucherId || "", r?.source || "app"]);
    function quote(id = currentId()) {
      const r = record(id), paid = r?.paidAmount;
      if (!identified(id, r)) return { paid: null, amount: null, valid: false, key: "unverified" };
      const amount = validMoney(paid) && paid === 0 ? 0 : r?.paid ? r.refundableAmount : null;
      return { paid, amount, valid: validMoney(paid) && validMoney(amount) && amount <= paid, key: key(id, r) };
    }
    function cancellationProblem(id = currentId()) {
      const r = record(id);
      if (!identified(id, r)) return "暂时无法核对这笔预约";
      if (r.source && r.source !== "app") return "请联系原预约方处理取消与退款";
      if (payment.unresolved(r)) return "请先核对支付结果";
      if (unresolved(r) || r.refundStatus !== "none") return "请先查看已有取消申请的进度";
      const e = event(id), start = Date.parse(e.startsAt), hours = e.cancellationHours;
      if (!Number.isFinite(start) || typeof hours !== "number" || !Number.isFinite(hours) || hours < 0) return "取消时间待核对，请先咨询客服";
      if (r.sessionStarted || r.sessionDone || Date.now() >= start || r.paid && Date.now() > start - hours * 3600000) return "已超过自助取消期限，请咨询客服";
      if (!validMoney(r.paidAmount) || !r.paid && r.paidAmount !== 0) return "原支付金额待核对";
      return "";
    }
    function requestValid(req) {
      return req && typeof req.id === "string" && req.id && known(req.eventId) && typeof req.bookingId === "string" && req.bookingId && validMoney(req.amount) && typeof req.quoteKey === "string" && req.quoteKey;
    }
    function matches(id, r, req) {
      const settled = req?.status === "completed";
      const consistentResult = settled ? req.amount > 0 ? r?.refundStatus === "refunded" && r.refundedAmount === req.amount : r?.refundStatus === "cancelled" : ["none", "submitted"].includes(r?.refundStatus) && !(validMoney(r?.refundedAmount) && r.refundedAmount > 0);
      return consistentResult && requestValid(req) && identified(id, r) && req.eventId === id && req.bookingId === r.bookingId && req.quoteKey === key(id, r) && quote(id).valid && quote(id).amount === req.amount && (r.voucherId || "") === req.voucherId && (!r.source || r.source === "app") && !payment.unresolved(r);
    }
    function status(id = currentId()) {
      const r = record(id), req = r?.refundRequest;
      if (!identified(id, r)) return { label: "预约待核对", note: "没有找到可核对的预约。可返回 Studio 查看已有预约，或咨询客服。", action: "go:STU-08", cta: "返回 Studio", kind: "unknown" };
      if (transactions.error(id)) return { label: "处理进度未保存", note: transactions.error(id), action: "studio-refund-recover", cta: "重试保存与核对", kind: "unknown" };
      if (payment.unresolved(r)) return { label: "支付结果待确认", note: "请先查看支付进度，暂时不要取消或重新付款。", action: "go:STU-17", cta: "查看支付进度", kind: "pending" };
      if (["submitting", "checking"].includes(req?.status)) return { label: req.status === "submitting" ? "正在提交取消申请" : "正在查询结果", note: "可以离开，返回后继续查看这笔申请。", action: "studio-refund-query", cta: "正在处理…", disabled: true, kind: "pending" };
      if (req?.status === "unknown") return { label: "取消结果待确认", note: req.error || "暂时没有收到明确结果，请先查询，不要重复申请。", action: requestValid(req) ? "studio-refund-query" : "go:HELP-03", cta: requestValid(req) ? "查询处理结果" : "联系客服核对", kind: "unknown" };
      if (r.refundStatus === "submitted" || req?.status === "accepted") return { label: "退款处理中", note: requestValid(req) ? req.error || "申请已受理，退款结果确认后会在这里更新。" : "已有退款申请，金额与处理结果请联系客服核对。", action: requestValid(req) ? "studio-refund-query" : "go:HELP-03", cta: requestValid(req) ? "查询退款进度" : "联系客服核对", kind: "pending" };
      if (["refunded", "cancelled"].includes(r.refundStatus)) return { label: r.refundStatus === "refunded" ? "退款已完成" : "预约已取消", note: "这笔预约已结束，原付款信息仍可查看。", action: "go:STU-08", cta: "返回 Studio", kind: "closed" };
      if (r.refundStatus !== "none") return { label: "预约状态待核对", note: "请联系客服核对原预约，不会发起新的付款或取消。", action: "go:HELP-03", cta: "联系客服核对", kind: "unknown" };
      if (r.deletionStatus && r.deletionStatus !== "ready") return { label: "个人记录已删除", note: "本次个人体验记录和报告已删除，预约、付款和售后仍可查看。", action: "go:HELP-03", cta: "联系活动客服", kind: "closed" };
      if (r.source && r.source !== "app") {
        const verified = r.source === "institution" && r.paid;
        return { label: verified ? r.sessionDone ? "体验已完成" : r.sessionStarted ? "体验进行中" : "预约已核验" : "外部预约待核对", note: "付款、取消与退款请联系原预约方处理。", action: verified ? "studio-reservation-prepare" : "go:HELP-03", cta: verified ? r.sessionDone ? "查看本次体验" : r.sessionStarted ? "继续本次体验" : "查看参加准备" : "联系活动客服", kind: verified ? "success" : "ready" };
      }
      if (!r.paid) return { label: "待付款", note: "完成付款后，预约才会确认。", action: "go:STU-17", cta: payment.unavailable(id) ? "查看付款状态" : "继续支付", kind: "ready" };
      return { label: r.sessionDone ? "体验已完成" : r.sessionStarted ? "体验进行中" : "已确认", note: "", action: "studio-reservation-prepare", cta: r.sessionDone ? "查看本次体验" : r.sessionStarted ? "继续本次体验" : "查看参加准备", kind: "success" };
    }
    const detail = (id, title, body) => `<details class="studio-detail-info" data-studio-info="${id}"><summary><span>${title}</span>${icon("arrow")}</summary><div>${body}</div></details>`;
    function pageKey() { const id = currentId(), r = identified(id) ? record(id) : null; return JSON.stringify([id, key(id, r), status(id), cancellationProblem(id), r?.voucherReturn, r?.refundError]); }
    function page() {
      transactions.sync();
      const id = currentId(), r = identified(id) ? record(id) : null, s = status(id), e = r ? event(id) : null, q = quote(id), req = r?.refundRequest;
      const button = (label, action, cls = "studio-reservation-secondary", disabled = false) => `<button type="button" class="${cls}" data-action="${action}" ${disabled ? "disabled" : ""}>${esc(label)}</button>`;
      const check = '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="20" cy="20" r="17"/><path d="m12 20 5 5 11-11"/></svg>';
      const symbol = s.kind === "success" || s.kind === "closed" ? check : '<img src="assets/HALORING_super_symbol_copper.png" width="32" height="40" alt="">';
      const cancelled = ["submitted", "refunded", "cancelled"].includes(r?.refundStatus) || unresolved(r);
      const cash = r?.refundStatus === "refunded" ? `<div><dt>已退金额</dt><dd>${money(r.refundedAmount)}</dd></div>` : cancelled && req ? `<div><dt>申请退回</dt><dd>${money(req.amount)}</dd></div>` : "";
      const returnWaiting = unresolved(r);
      const voucherStatus = ({ pending: "返还处理中", returned: "已返还原券", failed: "返还未完成", unknown: "返还结果待确认" })[r?.voucherReturn?.status] || (returnWaiting ? "待取消处理完成后核对" : "返还结果待核对");
      const voucher = cancelled && r?.voucherId ? `<section class="studio-reservation-result"><h2>体验券返还</h2><p role="status">${voucherStatus}</p>${r.voucherReturn?.status === "returned" ? '<p>有效期以原券为准，可以查看这张体验券的当前状态。</p>' : '<p>券的处理与现金退款分开，原付款金额不会重复退回。</p>'}${returnWaiting ? "" : button(r.voucherReturn?.status === "returned" ? "查看体验券" : req?.status === "completed" ? "查询返券结果" : "咨询返券事宜", r.voucherReturn?.status === "returned" ? "studio-reservation-voucher" : req?.status === "completed" ? "studio-voucher-return-query" : "go:HELP-03", "studio-reservation-link", r.voucherReturn?.status === "pending")}</section>` : "";
      const hours = e?.cancellationHours, start = Date.parse(e?.startsAt), validTime = Number.isFinite(start) && typeof hours === "number" && Number.isFinite(hours) && hours >= 0;
      const cutoff = validTime ? new Date(start - hours * 3600000).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }) : "";
      const error = r?.refundError || req?.status === "failed" && "取消申请未提交成功，预约仍然保留。可以重新核对后尝试。";
      return `<article class="studio-reservation studio-detail" data-reservation-key="${esc(pageKey())}"><div class="studio-detail-scroll" tabindex="0" aria-label="预约信息与取消进度"><header class="studio-detail-header"><button type="button" data-action="previous" aria-label="返回上一页">${icon("back")}</button><h1>预约详情</h1><button type="button" data-action="go:HELP-03">咨询</button></header><section class="studio-reservation-hero" role="status" aria-live="polite" aria-busy="${Boolean(s.disabled)}"><div class="studio-payment-symbol">${symbol}</div><h2>${esc(s.label)}</h2>${s.note ? `<p>${esc(s.note)}</p>` : ""}</section>${e ? `<div class="studio-booking-event studio-reservation-event">${media(id) ? `<img src="${media(id)}" width="64" height="64" alt="${esc(e.category)}场地示意图">` : ""}<div><h2>${esc(e.title)}</h2><p>主理人 ${esc(e.host)}</p></div></div><dl class="studio-reservation-facts"><div><dt>${icon("calendar")}时间</dt><dd>${Number.isFinite(start) ? esc(e.date) : "时间待核对"}</dd></div><div><dt>${icon("pin")}地点</dt><dd>${esc(e.place || "待确认")}</dd></div><div><dt>${icon("clock")}时长</dt><dd>${esc(e.duration)}分钟</dd></div></dl>${button("咨询到场安排", "go:HELP-03", "studio-reservation-location")}<section class="studio-booking-section studio-booking-cost"><h2>付款信息</h2><dl><div><dt>实付金额</dt><dd>${money(r.paidAmount)}</dd></div><div><dt>${r.voucherId ? "原用体验券" : "体验券"}</dt><dd>${r.voucherId ? "1 张" : "未使用"}</dd></div><div><dt>参与人数</dt><dd>1 位</dd></div>${cash}</dl></section>${voucher}${detail("reservation-order", "订单信息", `<p>预约编号：${esc(r.bookingId)}</p><p>预约来源：${r.source && r.source !== "app" ? "原预约方" : "Halo App"}</p>${req ? `<p>申请编号：${esc(req.id)}</p>` : ""}${r.refundedAt ? `<p>退款确认时间：${esc(new Date(r.refundedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }))}（北京时间）</p>` : ""}`)}${detail("reservation-cancel", "取消与退款", `<p>${cutoff ? `本场自助取消截止：${esc(cutoff)}（北京时间）。未付款预约可在活动开始前取消；已经开始或超过期限，请联系客服核对。` : "取消时间待核对，请先咨询客服。"}</p><p>${r.source && r.source !== "app" ? "请通过原预约方处理取消与退款。" : q.valid ? `取消前会再次展示本次可退金额${money(q.amount)}，确认后才会提交。` : "可退金额尚未确认，请联系客服核对后再申请。"}</p>${button("咨询取消事宜", "go:HELP-03", "studio-reservation-link")}`)}` : ""}${error ? `<p class="studio-reservation-error" role="alert">${esc(error)}</p>` : ""}</div><footer class="studio-detail-footer">${button(s.cta, s.action, "primary", s.disabled)}${e && !cancelled && !payment.unresolved(r) && r.refundStatus === "none" ? button("取消预约", "studio-refund") : ""}<p>交互演示，不处理真实退款</p></footer></article>`;
    }
    function showCancel() {
      if (!state.signedIn) return go("AUTH-01");
      transactions.sync();
      const id = currentId(), r = record(id), problem = cancellationProblem(id), q = quote(id);
      intent = null;
      if (problem) {
        modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal"><h2>先核对一下预约</h2><p>${esc(problem)}</p><div class="button-row"><button class="primary" data-action="${payment.unresolved(r) ? "go:STU-17" : "go:HELP-03"}">${payment.unresolved(r) ? "查看支付进度" : "联系活动客服"}</button><button class="secondary" data-action="close-modal">返回预约</button></div></section></div>`;
        return;
      }
      if (!q.valid && r.localRefundContract?.version === "demo-full-before-cutoff-v1" && r.localRefundContract.bookingId === r.bookingId && !r.refundQuoteError) return loadQuote();
      const token = `${id}-${r.bookingId}-${Date.now()}`;
      intent = { id, bookingId: r.bookingId, key: q.key, token };
      modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal studio-cancel-modal" data-cancel-token="${esc(token)}"><h2>取消这次预约？</h2><p>${esc(event(id).title)}<br>${esc(event(id).date)}</p><dl><div><dt>原实付</dt><dd>${money(q.paid)}</dd></div><div><dt>本次可退</dt><dd>${q.valid ? money(q.amount) : "金额待核对"}</dd></div><div><dt>体验券</dt><dd>${r.voucherId ? "取消后单独查看返还结果" : "未使用"}</dd></div></dl><p>${q.valid ? "确认后提交取消申请。受理后这次预约将不能继续参加，退款和返券进度可在原预约查看。" : "尚未提交取消。请先联系客服核对可退金额，原预约仍然保留。"}</p><div class="button-row"><button type="button" class="primary" data-action="close-modal">保留预约</button><button type="button" class="secondary" data-action="${q.valid ? "studio-refund-confirm" : "go:HELP-03"}">${q.valid ? "确认取消" : "咨询可退金额"}</button></div></section></div>`;
    }
    function loadQuote() {
      const id = currentId(), bookingId = record(id)?.bookingId;
      modalRoot.innerHTML = '<div class="modal-backdrop"><section class="modal info-modal"><h2>正在核对可退金额</h2><p role="status">核对完成后，由你确认是否取消。</p><button class="secondary" data-action="close-modal">返回预约</button></section></div>';
      const quoteModal = modalRoot.querySelector('.info-modal');
      setTimeout(() => transactions.run(() => {
        if (!quoteModal?.isConnected) return;
        transaction = transactions.begin(id);
        const r = record(id), contract = r?.localRefundContract;
        if (!transaction || id !== currentId() || state.current !== "STU-18" || !modalRoot.querySelector('.info-modal') || r?.bookingId !== bookingId || cancellationProblem(id)) { closeModal(); return; }
        if (navigator.onLine === false || contract?.bookingId !== bookingId || !validMoney(contract.amount) || contract.amount > r.paidAmount) {
          modalRoot.innerHTML = '<div class="modal-backdrop"><section class="modal info-modal"><h2>暂未取得可退金额</h2><p>预约仍然保留，没有提交取消。</p><button class="primary" data-action="studio-refund-quote-retry">重新核对</button><button class="secondary" data-action="close-modal">返回预约</button></section></div>'; return;
        }
        // Only bookings issued by this explicit simulated contract have a local
        // quote. Imported/legacy records never infer a refund from paidAmount.
        r.refundableAmount = contract.amount; r.refundQuoteSource = "local-contract-response";
        r.refundQuoteId = `SQ-${bookingId}`; r.refundQuoteReceivedAt = stamp();
        if (!persist()) { closeModal(); render(); return; }
        showCancel();
      }), 500);
    }
    function error(message, close = false) {
      if (close) closeModal();
      const r = record(); if (r) r.refundError = message;
      persist(); render();
      screen.querySelector(".studio-reservation-error")?.scrollIntoView({ block: "nearest" });
    }
    function confirm(onlineAtClick = navigator.onLine) {
      transaction = transactions.begin(currentId()); if (!transaction) { closeModal(); return render(); }
      const id = currentId(), r = record(id), q = quote(id);
      if (!state.signedIn) { closeModal(); return go("AUTH-01"); }
      if (!intent || !modalRoot.querySelector(`[data-cancel-token]`) || modalRoot.querySelector(`[data-cancel-token]`).dataset.cancelToken !== intent.token) return;
      if (intent.id !== id || intent.bookingId !== r?.bookingId || intent.key !== q.key || cancellationProblem(id) || !q.valid) { intent = null; return error("预约信息有更新，请重新核对后再取消。", true); }
      if (onlineAtClick === false || navigator.onLine === false) return error("当前网络不可用，联网后再提交。预约仍然保留。", true);
      const old = r.refundRequest;
      r.refundRequest = { id: old?.status === "failed" && matches(id, r, old) ? old.id : `SR-${r.bookingId}-${Date.now()}`, eventId: id, bookingId: r.bookingId, amount: q.amount, quoteKey: q.key, voucherId: r.voucherId || "", status: "submitting", stage: "submit", outcome: reviewSubmit, readyAt: Date.now() + 900, startedAt: stamp(), attempts: (old?.attempts || 0) + 1 };
      r.refundError = ""; intent = null; closeModal(); if (persist()) emit("studio_cancellation_submitted", r.refundRequest); render();
    }
    function query(onlineAtClick = navigator.onLine) {
      if (!state.signedIn) return go("AUTH-01");
      transaction = transactions.begin(currentId()); if (!transaction) return render();
      const id = currentId(), r = record(id), req = r?.refundRequest;
      if (["submitting", "checking", "completed"].includes(req?.status)) return;
      if (!identified(id, r) || !["accepted", "unknown"].includes(req?.status) || !requestValid(req)) return go("HELP-03");
      if (!matches(id, r, req)) return error("原预约信息需要核对，请联系客服确认申请结果。");
      if (onlineAtClick === false || navigator.onLine === false) return error("当前网络不可用，联网后再查询原申请。");
      Object.assign(req, { status: "checking", stage: "query", outcome: reviewQuery, readyAt: Date.now() + 900, attempts: req.attempts + 1, error: "" });
      r.refundError = ""; if (persist()) emit("studio_refund_query_started", req); render();
    }
    function startVoucher(id) {
      const r = record(id), req = r?.refundRequest;
      if (!r?.voucherId || !["refunded", "cancelled"].includes(r.refundStatus) || req?.status !== "completed" || !matches(id, r, req)) return false;
      const old = r.voucherReturn;
      if (["pending", "returned"].includes(old?.status)) return false;
      r.voucherReturn = { id: `SV-${req.id}`, eventId: id, bookingId: req.bookingId, voucherId: req.voucherId, status: "pending", outcome: reviewVoucher, readyAt: Date.now() + 900, attempts: (old?.attempts || 0) + 1 };
      return true;
    }
    function finish(id, requestId, attempt, voucher = false) {
      transaction = transactions.begin(id); if (!transaction) { if (state.current === "STU-18") render(); return; }
      const r = record(id), req = r?.refundRequest, operation = voucher ? r?.voucherReturn : req;
      if (!state.signedIn || operation?.id !== requestId || operation.attempts !== attempt || !(voucher ? operation.status === "pending" : ["submitting", "checking"].includes(operation.status))) return;
      const conflict = !matches(id, r, req) || voucher && (operation.bookingId !== req.bookingId || operation.eventId !== id || operation.voucherId !== req.voucherId || req.status !== "completed" || !["refunded", "cancelled"].includes(r.refundStatus));
      if (conflict || navigator.onLine === false) {
        operation.status = "unknown"; operation.error = conflict ? "原预约信息需要核对，请联系客服确认结果。" : "网络暂不可用，联网后再查询原申请。";
      } else if (voucher) {
        let restored = false;
        if (operation.outcome === "success") { try { restored = window.HALO_COMMERCIAL_EXTENSION?.restoreStudioVoucher?.(req.bookingId, req.voucherId, id) === true; } catch (_) { /* Cash result stays unchanged. */ } }
        operation.status = restored ? "returned" : operation.outcome === "unknown" ? "unknown" : "failed";
        if (restored) operation.completedAt = stamp();
      } else if (operation.outcome === "success") {
        if (req.stage === "submit" && req.amount > 0) { req.status = "accepted"; r.refundStatus = "submitted"; }
        else { req.status = "completed"; req.completedAt = stamp(); r.refundStatus = req.amount > 0 ? "refunded" : "cancelled"; if (req.amount > 0) { r.refundedAmount = req.amount; r.refundedAt = stamp(); } startVoucher(id); }
        r.refundRequestedAt ||= req.startedAt; req.error = "";
      } else if (req.stage === "submit" && req.outcome === "fail") { req.status = "failed"; req.error = "本次取消未提交成功。"; }
      else { req.status = req.outcome === "fail" && r.refundStatus === "submitted" ? "accepted" : "unknown"; req.error = "暂时未能确认结果，请稍后查询原申请，或联系客服。"; }
      if (persist()) emit(voucher ? "studio_voucher_return_result" : "studio_cancellation_result", operation); render();
    }
    function resume() {
      if (!state.signedIn) return;
      transactions.sync();
      let repaired = false;
      for (const [id, r] of Object.entries(state.studioRecords || {})) for (const voucher of [false, true]) {
        const req = voucher ? r.voucherReturn : r.refundRequest, timerKey = `${id}:${voucher}`;
        if (!identified(id, r) || transactions.error(id) || !(voucher ? req?.status === "pending" : ["submitting", "checking"].includes(req?.status)) || timers.has(timerKey)) continue;
        if (!(voucher ? req.id && req.bookingId && req.voucherId : requestValid(req)) || !Number.isFinite(req.readyAt) || !Number.isFinite(req.attempts)) { transactions.run(() => { transaction = transactions.begin(id); if (!transaction) return; const op = voucher ? record(id)?.voucherReturn : record(id)?.refundRequest; if (!op || op.id !== req.id) return; op.status = "unknown"; op.error = "处理记录需要核对，请联系客服。"; persist(); render(); }); continue; }
        const requestId = req.id, attempt = req.attempts;
        timers.set(timerKey, setTimeout(() => { timers.delete(timerKey); transactions.run(() => finish(id, requestId, attempt, voucher)); }, Math.max(0, Math.min(900, req.readyAt - Date.now()))));
      }
      if (repaired) { persist(); requestAnimationFrame(render); }
    }
    function reviewControls(item) {
      if (item.id !== "STU-18") return "";
      const options = [["success", "成功"], ["fail", "明确失败"], ["unknown", "结果未知"]];
      const set = (label, action, value) => `<p>${label}</p>${options.map(([v, title]) => `<button data-action="${action}:${v}" aria-pressed="${value === v}">${title}</button>`).join("")}`;
      return `<section class="review-block"><h3>取消与退款 · 本地审阅</h3><p>不调用真实退款服务。旧付费预约没有退款报价时，前台只显示待核对；以下按钮仅生成本地测试报价，不是正式退款规则。</p><button data-action="studio-refund-quote-review">生成本地退款报价</button>${set("下一次提交", "studio-refund-review", reviewSubmit)}${set("下一次查单", "studio-refund-query-review", reviewQuery)}${set("下一次返券", "studio-voucher-return-review", reviewVoucher)}</section>`;
    }
    function handle(action) {
      if (["studio-refund-recover", "studio-refund-quote-retry"].includes(action)) { transactions.retry(currentId()); if (action === "studio-refund-quote-retry") loadQuote(); else render(); return true; }
      if (["studio-refund-confirm", "studio-refund-query", "studio-refund-refresh"].includes(action)) { const online = navigator.onLine; transactions.run(() => action === "studio-refund-confirm" ? confirm(online) : query(online)); return true; }
      if (["studio-refund-quote-review", "studio-voucher-return-query"].includes(action)) {
        transactions.run(() => { transaction = transactions.begin(currentId()); if (!transaction) return render(); const r = record(); if (action === "studio-refund-quote-review") { if (!cancellationProblem() && validMoney(r.paidAmount)) { r.refundableAmount = r.paidAmount; r.refundQuoteSource = "local-review-fixture"; persist(); render(); } } else if (navigator.onLine === false) error("当前网络不可用，联网后再查询返券结果。"); else if (startVoucher(currentId())) { persist(); render(); } else go("HELP-03"); }); return true;
      }
      if (["studio-reservation-voucher", "studio-reservation-prepare", "studio-refund"].includes(action)) { transactions.sync(); if (!identified(currentId())) { closeModal(); render(); return true; } }
      if (action === "studio-reservation-voucher") {
        const r = record(), voucher = r?.voucherId ? window.HALO_COMMERCIAL_EXTENSION?.getStudioVoucher?.(currentId(), r.voucherId) : null;
        const expiry = voucher?.expires_at || voucher?.expiresAt;
        const expired = expiry && Number.isFinite(Date.parse(expiry)) && Date.parse(expiry) <= Date.now();
        modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal"><h2>本次体验券</h2><p>${esc(voucher?.title || "原体验券")}</p><p>${voucher ? expired ? "原券已过期" : voucher.eligible ? "可在适用场次使用" : "当前不可用，请咨询客服" : "券信息待核对，请咨询客服"}</p><p>${expiry && Number.isFinite(Date.parse(expiry)) ? `有效期至 ${esc(new Date(expiry).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }))}（北京时间）` : "有效期请咨询确认"}</p><div class="button-row"><button class="primary" data-action="close-modal">返回预约</button><button class="secondary" data-action="go:HELP-03">咨询客服</button></div></section></div>`;
        return true;
      }
      if (action.startsWith("studio-refund-query-review:")) { reviewQuery = action.split(":")[1]; render(); return true; }
      if (action.startsWith("studio-refund-review:")) { reviewSubmit = action.split(":")[1]; render(); return true; }
      if (action.startsWith("studio-voucher-return-review:")) { reviewVoucher = action.split(":")[1]; render(); return true; }
      if (action === "studio-refund") { showCancel(); return true; }
      if (action === "studio-reservation-prepare") { const id = currentId(), r = record(id); if (state.signedIn && identified(id, r) && r.paid && r.refundStatus === "none" && !unresolved(r) && !payment.unresolved(r) && (!r.deletionStatus || r.deletionStatus === "ready")) go(r.sessionDone ? "STU-15" : r.sessionStarted ? "STU-04" : "STU-10"); else render(); return true; }
      return false;
    }
    function refresh() { if (state.current !== "STU-18") return; transactions.sync(); const el = screen.querySelector(".studio-reservation[data-reservation-key]"); if (!document.hidden && el && el.dataset.reservationKey !== pageKey()) { if (!identified(currentId())) closeModal(); render(); } }
    return { page, handle, resume, reviewControls, refresh, unresolved };
  };
})();
