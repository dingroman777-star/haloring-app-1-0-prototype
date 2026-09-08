(function () {
  // Scoped local transaction adapter. All writers re-read and compare the original
  // record under the same browser lock; a failed write never becomes a receipt.
  window.createHaloStudioTransactions = function (state, storageKey) {
    const observed = new Map(), failures = new Map();
    const clone = x => x == null ? x : JSON.parse(JSON.stringify(x));
    const account = p => String(p.authPhone || p.authForm?.phone || "local-demo");
    const identity = p => JSON.stringify([!!p.signedIn, account(p), p.memberCreatedAt || ""]);
    const read = () => { const p = JSON.parse(localStorage.getItem(storageKey)); if (!p?.studioRecords || Array.isArray(p.studioRecords)) throw Error("source unavailable"); return p; };
    function owned(r, p = state) {
      const owners = [r?.accountRef, r?.sessionAccountRef].filter(Boolean);
      return !!p.signedIn && !!r && (owners.length ? owners.every(x => x === account(p)) : account(p) === "local-demo") && (!r.registrationId || r.registrationId === p.memberCreatedAt);
    }
    function sync() {
      try {
        const p = read();
        if (identity(p) !== identity(state)) return false;
        for (const id of new Set([...observed.keys(), ...Object.keys(p.studioRecords)])) {
          const text = JSON.stringify(p.studioRecords[id]);
          if (!observed.has(id) || observed.get(id) !== text) {
            if (p.studioRecords[id]) state.studioRecords[id] = clone(p.studioRecords[id]); else delete state.studioRecords[id];
            observed.set(id, text);
          }
        }
        return true;
      } catch { return false; }
    }
    function begin(id) {
      if (!sync()) return null;
      const r = state.studioRecords[id];
      return owned(r) ? { id, identity: identity(state), before: JSON.stringify(r) } : null;
    }
    function commit(token) {
      if (!token) return false;
      try {
        const p = read(), r = p.studioRecords[token.id];
        if (identity(p) !== token.identity || identity(state) !== token.identity || !owned(r, p) || JSON.stringify(r) !== token.before) throw Error("changed");
        p.studioRecords[token.id] = clone(state.studioRecords[token.id]);
        localStorage.setItem(storageKey, JSON.stringify(p));
        observed.set(token.id, JSON.stringify(p.studioRecords[token.id])); failures.delete(token.id); return true;
      } catch {
        state.studioRecords[token.id] = JSON.parse(token.before);
        failures.set(token.id, "未能保存处理进度。请重试；如已发起处理，会继续核对原请求，不会重复提交。");
        sync(); return false;
      }
    }
    const run = fn => navigator.locks?.request ? navigator.locks.request("halo-studio-session-start", fn) : Promise.resolve().then(fn);
    return { owned: r => { try { const p = read(); return identity(p) === identity(state) && owned(r, p); } catch { return false; } }, sync, begin, commit, run, error: id => failures.get(id) || "", retry: id => failures.delete(id) };
  };
  // Local payment adapter only. No payment provider or real charging API is called.
  window.createHaloStudioPayment = function ({ state, events, event, media, go, render, transactions, track, esc, icon, screen }) {
    const timers = new Map();
    let transaction = null;
    const persist = () => transactions.commit(transaction);
    let reviewOutcome = "success", reviewQuery = "success";
    const currentId = () => state.selectedStudioEventId;
    const known = id => Object.prototype.hasOwnProperty.call(events, id);
    const record = (id = currentId()) => state.studioRecords?.[id];
    const unresolved = r => ["processing", "checking", "unknown"].includes(r?.paymentRequest?.status);
    const moneyValid = value => typeof value === "number" && Number.isFinite(value) && value >= 0 && Math.abs(value * 100 - Math.round(value * 100)) < .00001;
    const money = value => moneyValid(value) ? `¥${value.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}` : "待核对";
    const requestValid = r => r && typeof r.id === "string" && r.id && typeof r.bookingId === "string" && r.bookingId && moneyValid(r.amount) && r.amount > 0 && typeof r.quoteKey === "string" && r.quoteKey;
    const emit = (name, id, request) => track(name, { event_id: id, booking_id: request.bookingId, request_id: request.id, status: request.status, simulated: true });
    function quote(id = currentId()) {
      const r = record(id) || {}, amount = r.dueAmount;
      if (!transactions.owned(r) || r.source && r.source !== "app") return { amount: null, discount: null, base: null, valid: false, key: "unverified" };
      const discount = r.voucherDiscount ?? (r.voucherId ? null : 0);
      const base = r.baseAmount ?? (moneyValid(amount) && moneyValid(discount) ? amount + discount : null);
      const valid = [amount, discount, base].every(moneyValid) && Math.round((base - discount) * 100) === Math.round(amount * 100);
      return { amount, discount, base, valid, key: JSON.stringify([id, r.bookingId, amount, discount, base, r.source || "app"]) };
    }
    function unavailable(id = currentId()) {
      const r = record(id);
      if (!transactions.owned(r) || !known(id) || !r?.booked || typeof r.bookingId !== "string" || !r.bookingId.trim()) return "暂时无法核对这笔预约";
      if (r.source && r.source !== "app") return "请联系原预约方处理付款";
      if (r.refundStatus !== "none") return "这笔预约当前不能付款";
      if (["submitting", "accepted", "checking", "unknown"].includes(r.refundRequest?.status)) return "取消结果待确认，请先查看原预约";
      if (r.deletionStatus && r.deletionStatus !== "ready") return "请先核对原预约状态";
      if (!quote(id).valid) return "金额待核对";
      if (r.paymentRequest?.quoteKey && r.paymentRequest.quoteKey !== quote(id).key) return "原预约信息有变化，请先联系客服核对";
      if (r.paid || r.dueAmount === 0) return "本次无需再次付款";
      const startsAt = Date.parse(event(id).startsAt);
      if (!Number.isFinite(startsAt)) return "活动时间待核对";
      if (startsAt <= Date.now() || r.sessionStarted || r.sessionDone) return "本场已开始，不能继续付款";
      if (r.payable === false) return "这笔预约当前不能付款";
      if (r.paymentExpiresAt && (!Number.isFinite(Date.parse(r.paymentExpiresAt)) || Date.parse(r.paymentExpiresAt) <= Date.now())) return "付款期限已结束";
      return "";
    }
    function status(id = currentId()) {
      const r = record(id), q = quote(id), request = r?.paymentRequest;
      if (!transactions.owned(r) || !known(id) || !r?.booked || !r.bookingId) return { kind: "blocked", label: "预约待核对", message: "暂时无法打开这笔预约，已有记录仍然保留。", cta: "返回 Studio", action: "go:STU-08" };
      if (r.source && r.source !== "app") return { kind: "blocked", label: "由原预约方处理付款", message: "请返回预约查看参加安排。付款金额与结果请向原预约方核对。", cta: "查看预约", action: "go:STU-18" };
      if (transactions.error(id)) return { kind: "unknown", label: "处理进度未保存", message: transactions.error(id), cta: "重试保存与核对", action: "studio-payment-recover" };
      if (unresolved(r)) {
        if (request.status === "unknown") return { kind: "unknown", label: "结果待确认", message: request.error || "暂时没收到明确结果。请先查询，不要再次付款。", cta: requestValid(request) ? "查询支付结果" : "联系客服核对", action: requestValid(request) ? "studio-payment-query" : "go:HELP-03" };
        return { kind: "processing", label: request.status === "checking" ? "正在核对结果" : "支付处理中", message: "可以离开，返回后继续查看这笔支付。", cta: request.status === "checking" ? "正在查询…" : "正在处理…", action: "studio-pay", disabled: true };
      }
      if (["submitting", "accepted", "checking", "unknown"].includes(r.refundRequest?.status)) return { kind: "closed", label: "取消结果待确认", message: "请先查看原预约的处理进度，不要再次付款。", cta: "查看预约", action: "go:STU-18" };
      if (r.refundStatus !== "none") return { kind: "closed", label: ({ submitted: "退款处理中", refunded: "已退款", cancelled: "预约已取消" })[r.refundStatus] || "预约状态待核对", message: "请查看原预约的处理进度，无需再次付款。", cta: "查看预约", action: "go:STU-18" };
      if (r.paid) return { kind: "success", label: r.paidAmount > 0 ? "支付成功" : "无需支付", message: r.paidAmount > 0 ? "本次预约已确认。到场信息可在预约中查看。" : "本次预约已确认，无需再次付款。", cta: "查看预约", action: "go:STU-18" };
      const problem = unavailable(id);
      if (problem) return { kind: "blocked", label: problem, message: q.valid && q.amount === 0 ? "请查看预约状态，无需发起付款。" : "没有发起新的付款，请查看原预约或咨询客服。", cta: q.valid ? "查看预约" : "咨询客服", action: q.valid ? "go:STU-18" : "go:HELP-03" };
      if (request?.status === "failed" || request?.status === "cancelled") return { kind: "retry", label: request.status === "cancelled" ? "支付已取消" : "支付未完成", message: request.status === "cancelled" ? "本次支付已取消，预约仍未付款。" : "本次未完成付款，可以重新尝试。", cta: `重新支付 ${money(q.amount)}`, action: "studio-pay" };
      return { kind: "ready", label: "待支付", message: "完成付款后，预约才会确认。", cta: `支付 ${money(q.amount)}`, action: "studio-pay" };
    }
    function page() {
      transactions.sync();
      const id = currentId(), r = transactions.owned(record(id)) ? record(id) : null, q = quote(id), s = status(id), e = r && known(id) && r.booked ? event(id) : null;
      const primary = `<button class="primary" type="button" data-action="${s.action}" ${s.disabled ? "disabled" : ""}>${esc(s.cta)}</button>`;
      const deferred = ["ready", "retry"].includes(s.kind);
      const secondary = deferred ? `<button type="button" class="studio-payment-secondary" data-action="studio-payment-later">稍后支付</button>` : s.kind === "unknown" ? `<button type="button" class="studio-payment-secondary" data-action="go:HELP-03">联系活动客服</button>` : s.kind === "processing" ? `<button type="button" class="studio-payment-secondary" data-action="studio-payment-later">稍后查看</button>` : "";
      const symbol = s.kind === "success" ? '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="20" cy="20" r="17"/><path d="m12 20 5 5 11-11"/></svg>' : `<img src="assets/HALORING_super_symbol_copper.png" alt="" width="36" height="42">`;
      return `<article class="studio-payment studio-detail" data-payment-key="${esc(JSON.stringify([q.key, s]))}"><div class="studio-detail-scroll" tabindex="0" aria-label="付款信息与结果"><header class="studio-detail-header"><button type="button" data-action="previous" aria-label="返回上一页">${icon("back")}</button><h1>支付</h1><button type="button" data-action="go:HELP-03">咨询</button></header><section class="studio-payment-hero" role="status" aria-live="polite" aria-busy="${s.kind === "processing"}"><div class="studio-payment-symbol ${s.kind === "processing" ? "is-processing" : ""}">${symbol}</div><h2>${esc(s.label)}</h2>${e ? `<strong class="studio-payment-amount">${q.valid ? money(q.amount) : "待核对"}</strong>` : ""}<p>${esc(s.message)}</p></section>${e ? `<div class="studio-payment-event studio-booking-event">${media(id) ? `<img src="${media(id)}" width="64" height="64" alt="${esc(e.category)}场地示意图">` : ""}<div><h2>${esc(e.title)}</h2><p>${esc(e.date)}</p><p>${esc(e.place)} · ${esc(e.duration)}分钟</p></div></div><section class="studio-booking-section studio-booking-cost"><h2>费用明细</h2><dl><div><dt>活动费用</dt><dd>${money(q.base)}</dd></div><div><dt>体验券抵扣</dt><dd>${moneyValid(q.discount) ? `−${money(q.discount)}` : "待核对"}</dd></div><div class="studio-booking-total"><dt>${r.paid ? "原预约金额" : "本次应付"}</dt><dd>${q.valid ? money(q.amount) : "待核对"}</dd></div></dl></section><details class="studio-detail-info" data-studio-info="payment-order"><summary><span>订单信息</span>${icon("arrow")}</summary><div><p>预约编号：${esc(r.bookingId)}</p><p>参与人数：1 位</p>${r.paymentExpiresAt && Number.isFinite(Date.parse(r.paymentExpiresAt)) ? `<p>付款截止：${esc(new Date(r.paymentExpiresAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }))}（北京时间）</p>` : ""}<button type="button" data-action="go:STU-18">查看原预约</button></div></details>` : ""}${r?.paymentError && !unresolved(r) ? `<p class="studio-payment-error" role="alert">${esc(r.paymentError)}</p>` : ""}</div><footer class="studio-detail-footer">${primary}${secondary}<p>交互演示，不会真实扣款</p></footer></article>`;
    }
    function failToStart(id, message) {
      const r = record(id); if (r) r.paymentError = message;
      persist(); render(); screen.querySelector(".studio-payment-error")?.scrollIntoView({ block: "nearest" });
    }
    function start(query = false, onlineAtClick = navigator.onLine) {
      if (!state.signedIn) return go("AUTH-01");
      transaction = transactions.begin(currentId()); if (!transaction) return render();
      const id = currentId(), r = record(id), q = quote(id), old = r?.paymentRequest;
      if (!known(id) || !r?.booked || !r.bookingId) return render();
      if (["processing", "checking"].includes(old?.status)) return;
      if (onlineAtClick === false || navigator.onLine === false) {
        if (query && old?.status === "unknown") { old.error = "当前网络不可用，联网后再查询支付结果。"; persist(); return render(); }
        return failToStart(id, "当前网络不可用，联网后再试。");
      }
      if (query) {
        if (old?.status !== "unknown") return;
        // Query the original operation, even after the new-payment deadline. Never charge again.
        Object.assign(old, { status: "checking", outcome: reviewQuery, readyAt: Date.now() + 900, attempts: (old.attempts || 0) + 1 });
      } else {
        if (unresolved(r)) return render();
        const problem = unavailable(id);
        if (problem) return failToStart(id, problem);
        const rendered = screen.querySelector(".studio-payment[data-payment-key]");
        if (rendered && rendered.dataset.paymentKey !== JSON.stringify([q.key, status(id)])) return failToStart(id, "预约信息有更新，请核对金额后再次付款。");
        r.paymentRequest = { id: old?.bookingId === r.bookingId ? old.id : `SP-${r.bookingId}-${Date.now()}`, bookingId: r.bookingId,
          status: "processing", amount: q.amount, quoteKey: q.key, outcome: reviewOutcome, readyAt: Date.now() + 900,
          startedAt: old?.startedAt || new Date().toISOString(), attempts: (old?.attempts || 0) + 1 };
      }
      r.paymentError = ""; if (persist()) emit(query ? "studio_payment_query_started" : "studio_payment_started", id, r.paymentRequest); render();
    }
    function finish(id, requestId, attempt) {
      transaction = transactions.begin(id); if (!transaction) { if (state.current === "STU-17") render(); return; }
      const r = record(id), req = r?.paymentRequest;
      if (!state.signedIn || req?.id !== requestId || req.attempts !== attempt || !["processing", "checking"].includes(req.status)) return;
      const q = quote(id);
      const conflict = !known(id) || !r.booked || req.bookingId !== r.bookingId || !q.valid || !moneyValid(req.amount) || Math.round(req.amount * 100) !== Math.round(q.amount * 100) || q.key !== req.quoteKey || r.refundStatus !== "none" || r.deletionStatus && r.deletionStatus !== "ready" || r.source && r.source !== "app" || r.paid && r.paidAmount !== req.amount;
      if (conflict) { req.status = "unknown"; req.error = "预约信息需要核对，请联系客服确认这笔支付，不要再次付款。"; }
      else if (navigator.onLine === false) { req.status = "unknown"; req.error = "网络暂不可用，支付结果尚未确认。联网后再查询。"; }
      else if (req.outcome === "success" || r.paid) {
        if (!r.paid) { r.paid = true; r.paidAmount = req.amount; r.paidAt = new Date().toISOString(); }
        req.status = "succeeded"; req.error = ""; req.completedAt = new Date().toISOString();
      } else {
        req.status = ({ fail: "failed", cancelled: "cancelled", unknown: "unknown" })[req.outcome] || "unknown";
        req.error = "";
      }
      if (persist()) emit("studio_payment_result", id, req); render();
    }
    function resume() {
      if (!state.signedIn) return;
      transactions.sync();
      let repaired = false;
      for (const [id, r] of Object.entries(state.studioRecords || {})) {
        const req = r.paymentRequest;
        if (!transactions.owned(r) || transactions.error(id) || !["processing", "checking"].includes(req?.status) || timers.has(id)) continue;
        if (!requestValid(req) || !Number.isFinite(req.readyAt)) {
          transactions.run(() => { transaction = transactions.begin(id); if (!transaction) return; const current = record(id)?.paymentRequest; if (!current || current.id !== req.id) return; current.status = "unknown"; current.error = "支付记录需要核对，请联系客服，不要再次付款。"; persist(); render(); }); repaired = true; continue;
        }
        const requestId = req.id, attempt = req.attempts;
        timers.set(id, setTimeout(() => { timers.delete(id); transactions.run(() => finish(id, requestId, attempt)); }, Math.max(0, Math.min(900, req.readyAt - Date.now()))));
      }
      if (repaired) requestAnimationFrame(render);
    }
    function reviewControls(item) {
      if (item.id !== "STU-17") return "";
      const options = [["success", "成功"], ["fail", "明确失败"], ["cancelled", "取消支付"], ["unknown", "结果未知"]];
      return `<section class="review-block"><h3>支付 · 本地审阅</h3><p>仅模拟状态，不调用支付渠道。约0.9秒展示处理反馈，不代表锁位期限。</p><p>下一次付款：${esc(reviewOutcome)}</p>${options.map(([key, label]) => `<button data-action="studio-payment-review:${key}" aria-pressed="${reviewOutcome === key}">${label}</button>`).join("")}<p>下一次查单：${esc(reviewQuery)}</p>${options.map(([key, label]) => `<button data-action="studio-payment-query-review:${key}" aria-pressed="${reviewQuery === key}">${label}</button>`).join("")}</section>`;
    }
    function handle(action) {
      if (action.startsWith("studio-payment-query-review:")) { reviewQuery = action.split(":")[1]; render(); return true; }
      if (action.startsWith("studio-payment-review:")) { reviewOutcome = action.split(":")[1]; render(); return true; }
      if (action === "studio-payment-recover") { transactions.retry(currentId()); render(); return true; }
      if (action === "studio-pay") { const online = navigator.onLine; transactions.run(() => start(false, online)); return true; }
      if (action === "studio-payment-query") { const online = navigator.onLine; transactions.run(() => start(true, online)); return true; }
      if (action === "studio-payment-later") { go("STU-18"); return true; }
      return false;
    }
    function refresh() {
      if (state.current !== "STU-17" || document.hidden) return;
      transactions.sync();
      const el = screen.querySelector(".studio-payment[data-payment-key]");
      if (el && el.dataset.paymentKey !== JSON.stringify([quote().key, status()])) render();
    }
    return { page, handle, resume, unresolved, status, unavailable, reviewControls, refresh };
  };
})();
