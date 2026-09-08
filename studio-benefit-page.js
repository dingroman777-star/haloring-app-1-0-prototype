(() => {
  "use strict";
  window.createHaloStudioBenefit = function ({ state, event, media, read, write, go, render, esc, icon, screen, modalRoot, closeModal, flash, track }) {
    const id = () => state.selectedStudioEventId;
    const account = s => String(s.authPhone || s.authForm?.phone || "local-demo");
    const record = () => state.studioRecords?.[id()];
    const nonempty = v => typeof v === "string" && Boolean(v.trim());
    const scope = r => JSON.stringify([account(state), id(), r?.bookingId, r?.sessionId, r?.completedAt]);
    const api = () => window.HALO_COMMERCIAL_EXTENSION;
    let fresh = true, busy = false, settling = false, outcome = "verified", error = "", errorScope = "", last = "";
    const failedSaves = new Set();
    const button = (label, action, cls = "studio-benefit-link", disabled = false) => `<button type="button" class="${cls}" data-action="${esc(action)}" ${disabled ? "disabled" : ""}>${esc(label)}</button>`;
    const date = value => Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(Date.parse(value)) : "暂未记录";
    function prepare(force = false) {
      if (state.current !== "STU-13" && !force) return true;
      const result = read(), p = result?.progress;
      fresh = Boolean(result?.ok && p?.studioRecords && typeof p.studioRecords === "object" && !Array.isArray(p.studioRecords)
        && account(p) === account(state) && p.signedIn === state.signedIn && p.authVerified === state.authVerified && p.accountDeletionStatus !== "submitted");
      if (fresh) state.studioRecords = { ...p.studioRecords };
      return fresh;
    }
    function owned(r = record()) {
      return fresh && state.signedIn && state.authVerified && state.accountDeletionStatus !== "submitted" && r?.booked && nonempty(r.bookingId)
        && (!r.accountRef || r.accountRef === account(state)) && (!r.sessionAccountRef || r.sessionAccountRef === account(state))
        && (!r.eventId || r.eventId === id()) && (!r.eventSnapshot?.id || r.eventSnapshot.id === id())
        && (!r.sessionScope || r.sessionScope.eventId === id() && r.sessionScope.bookingId === r.bookingId);
    }
    function args(r = record()) {
      return { accountRef: account(state), eventId: id(), bookingId: r?.bookingId, occurredAt: r?.completedAt,
        completed: r?.sessionDone, paid: r?.paid, hardwareActive: r?.completionSnapshot?.hardwareActive === true,
        hardwareActiveNow: state.membershipHardwareState === "active", newMember: Boolean(state.newMember), memberCreatedAt: state.memberCreatedAt || "" };
    }
    function requestValid(r = record()) {
      const q = r?.benefitRequest;
      return q?.version === 1 && nonempty(q.id) && q.scope === scope(r) && q.accountRef === account(state)
        && q.eventId === id() && q.bookingId === r.bookingId && Number.isFinite(q.readyAt)
        && ["verified", "waiting", "review", "unknown"].includes(q.outcome) && q.simulated === true;
    }
    function model() {
      const r = record();
      if (!owned(r)) return { kind: "unavailable", title: "暂时无法查看这次奖励", note: "请返回原预约核对，已有记录没有改变。", action: "stub-booking", label: "返回原预约" };
      const receipt = api()?.getStudioBenefit?.(args(r)) || { status: "unavailable" };
      if (receipt.status === "posted") return { kind: "posted", title: receipt.points || receipt.growth ? "本次奖励已到账" : "本次奖励已核对", note: "积分和成长分别记录，可随时回看。", receipt, label: "查看本场明细", action: "stub-details" };
      if (!r.sessionDone) return { kind: "unfinished", title: "完成体验后查看奖励", note: "本次活动尚未结束。", label: "查看本次体验", action: "stub-record" };
      if (receipt.status === "unavailable") return receipt.reason === "invalid-scope"
        ? { kind: "review", title: "本次奖励需要核对", note: "参与记录不完整，请联系活动客服协助确认。", label: "联系活动客服", action: "stub-help" }
        : { kind: "unavailable", title: "暂时读不到奖励记录", note: "可以重新读取，已有积分和成长不会改变。", label: "重新读取", action: "stub-reload" };
      if (receipt.legacy || receipt.status === "review") return receipt.reason === "reward-adjusted"
        ? { kind: "review", title: "本次奖励有调整", note: "请查看积分明细中的调整记录，有疑问可联系活动客服。", receipt, label: "查看积分明细", action: "stub-points" }
        : { kind: "review", title: "本次奖励需要核对", note: "已有记录仍保留，请联系活动客服核对本次结果。", receipt, label: "联系活动客服", action: "stub-help" };
      const q = r.benefitRequest;
      if (q?.status === "capped" && requestValid(r)) return { kind: "capped", title: "本月 Studio 奖励已达上限", note: "本月已累计 4 次奖励，本次不再增加。", receipt: { points: 0, growth: 0, offset: 0, available: 0 }, label: "查看最新进度", action: "stub-query" };
      if (q?.status === "checking" && requestValid(r) && failedSaves.has(q.id)) return { kind: "save-failed", title: "奖励结果暂未保存", note: "可以重试，已有积分和成长不会改变。", label: "重试保存结果", action: "stub-retry-save" };
      if (q?.status === "checking") return requestValid(r)
        ? { kind: "checking", title: "正在查询奖励进度", note: "可以先离开，回来后继续查看。", label: "正在查询…", action: "stub-query" }
        : { kind: "review", title: "本次查询需要核对", note: "查询记录不完整，已有奖励不会改变。", label: "联系活动客服", action: "stub-help" };
      if (q?.status === "review") return { kind: "review", title: "本次参与情况待核对", note: "请联系活动客服协助确认。", label: "联系活动客服", action: "stub-help" };
      if (q?.status === "unknown") return { kind: "unknown", title: "暂时查不到最新结果", note: "已有记录没有改变，可以稍后再试。", label: "重新查询", action: "stub-query" };
      return { kind: "pending", title: "等待活动核验", note: "核验完成后，再确认本次积分与成长。", receipt, label: "查看最新进度", action: "stub-query" };
    }
    function detailsBody(receipt) {
      const rows = [["获得积分", `${receipt.points ?? "—"} Halo Points`], ["可用积分增加", `${receipt.available ?? "—"}`],
        ...(receipt.offset ? [["用于抵扣待冲正积分", String(receipt.offset)]] : []), ["获得成长", receipt.growth == null ? "待核对" : `${receipt.growth} HALO 成长值`],
        ["活动完成", date(receipt.occurred_at)], ["奖励入账", date(receipt.posted_at)]];
      return `<dl class="studio-benefit-detail-list">${rows.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("")}</dl>`;
    }
    function reasonText(receipt, r) {
      if (receipt?.reason === "refund-review") return "本次退款情况待核对，已入账奖励仍按原记录展示。";
      if (["monthly-limit", "course-limit", "monthly-course-limit", "studio-monthly-limit"].includes(receipt?.reason)) return "本月已累计 4 次 Studio 奖励，本次不再增加。";
      if (receipt?.points != null && receipt.points < 100) return "本月常规任务积分已达到上限，本次按剩余额度记录。";
      return r?.completionSnapshot?.hardwareActive === false ? "参加时未激活 Halo 硬件，本次不累计成长；积分不受影响。" : "";
    }
    function page() {
      const r = record(), m = model(), e = owned(r) ? event(id()) : null, posted = m.kind === "posted", receipt = m.receipt;
      const querying = busy || m.kind === "checking" && !failedSaves.has(r?.benefitRequest?.id);
      const contentError = errorScope === scope(r) ? error : "";
      const rewards = ["pending", "checking", "unknown", "posted", "capped", "save-failed"].includes(m.kind);
      const points = m.kind === "capped" ? "不再累计" : posted ? `+${receipt.points}` : "待核验";
      const growth = m.kind === "capped" ? "不再累计" : posted ? receipt.growth == null ? "待核对" : `+${receipt.growth}` : r?.completionSnapshot?.hardwareActive === false ? "不累计" : "待核验";
      const mark = posted ? '<path d="m10 18 5 5L27 10"/>' : '<circle cx="18" cy="18" r="12"/><path d="M18 10v9l5 3"/>';
      last = JSON.stringify([m, r?.benefitRequest, contentError, busy, navigator.onLine]);
      return `<article class="studio-benefit studio-detail" data-benefit-state="${m.kind}" aria-busy="${querying}"><div class="studio-detail-scroll" tabindex="0" aria-label="本次奖励"><header class="studio-detail-header"><button type="button" data-action="stub-back" aria-label="返回本次活动">${icon("back")}</button><h1>本次奖励</h1><span></span></header>
        ${e ? `<div class="studio-booking-event studio-benefit-event">${media(id()) ? `<img src="${media(id())}" width="56" height="56" alt="${esc(e.category)}场地示意图">` : ""}<div><h2>${esc(e.title)}</h2><p>${esc(e.date)} · ${esc(e.duration)} 分钟</p></div></div>` : ""}
        <section class="studio-benefit-state" aria-live="polite"><svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${mark}</svg><h2>${esc(m.title)}</h2><p>${esc(m.note)}</p></section>
        ${rewards ? `<dl class="studio-benefit-values"><div><dt>Halo Points</dt><dd class="${posted ? "is-number" : ""}">${esc(points)}</dd><small>${m.kind === "capped" ? "已达本月奖励次数" : posted ? "可用于抵扣与兑换" : "核验后最高 100 积分"}</small></div><div><dt>HALO 成长值</dt><dd class="${posted && receipt.growth != null ? "is-number" : ""}">${esc(growth)}</dd><small>${m.kind === "capped" ? "已达本月奖励次数" : posted ? "用于会员升级" : r?.completionSnapshot?.hardwareActive === false ? "参加时未激活硬件" : "符合条件可得 40 成长"}</small></div></dl>` : ""}
        ${posted && receipt.offset ? `<p class="studio-benefit-note">本次 ${esc(receipt.offset)} 积分用于抵扣待冲正积分，可用积分增加 ${esc(receipt.available)}。</p>` : ""}
        ${rewards && m.kind !== "capped" && reasonText(receipt, r) ? `<p class="studio-benefit-note">${esc(reasonText(receipt, r))}</p>` : ""}
        ${posted ? `<details class="studio-benefit-facts"><summary>到账信息</summary>${detailsBody(receipt)}</details>` : ""}
        <details class="studio-benefit-rules"><summary>奖励说明</summary><p>完成并通过核验的 Studio 课程，每月最多奖励 4 次，每次最高 100 积分。</p><p>常规任务积分合计每月最多 2,000 分。参加时已绑定并激活 Halo 硬件，符合条件可累计 40 成长。</p><p>身体报告是否生成、是否开启健康数据授权，不影响合法参与奖励。</p></details>
        <nav class="studio-benefit-links" aria-label="相关记录">${button("查看本次体验", "stub-record")}${button("联系活动客服", "stub-help")}</nav></div>
        <footer class="studio-detail-footer" aria-live="polite">${contentError ? `<p role="alert">${esc(contentError)}</p>` : ""}${navigator.onLine === false && !posted ? '<p>当前离线，联网后再查询最新进度。</p>' : ""}${button(failedSaves.has(r?.benefitRequest?.id) ? "重试保存结果" : querying ? "正在查询…" : m.label, failedSaves.has(r?.benefitRequest?.id) ? "stub-retry-save" : m.action, "primary", querying)}${button("返回本次活动", "stub-back", "secondary")}</footer></article>`;
    }
    function setError(message) { error = message; errorScope = scope(record()); }
    async function locked(callback) {
      if (!navigator.locks?.request) { setError("暂时无法安全查询，请重新打开本地原型后再试。"); return; }
      const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 6000);
      try { await navigator.locks.request("halo-studio-session-start", { mode: "exclusive", signal: controller.signal }, callback); }
      catch { setError("查询暂未完成，请稍后再试。已有记录没有改变。"); }
      finally { clearTimeout(timer); }
    }
    async function query() {
      if (state.current !== "STU-13" || busy) return;
      const before = scope(record()); busy = true; error = ""; render();
      await locked(() => {
        if (!prepare(true) || before !== scope(record()) || state.current !== "STU-13") return setError("记录有变化，请重新打开本次奖励。");
        if (!["pending", "unknown", "capped"].includes(model().kind)) return;
        if (navigator.onLine === false) return setError("当前离线，请联网后重试。");
        const r = record(), q = { version: 1, id: `SB-${Date.now()}-${Math.random().toString(36).slice(2,8)}`, scope: scope(r), accountRef: account(state),
          eventId: id(), bookingId: r.bookingId, status: "checking", submittedAt: new Date().toISOString(), readyAt: Date.now() + 800, outcome, simulated: true };
        if (!write(id(), { benefitRequest: q })) return setError("查询请求没能保存，请重试。");
        track("studio_benefit_query_submitted", { event_id: id(), booking_id: r.bookingId, request_id: q.id, simulated: true });
      });
      busy = false; if (state.current === "STU-13") render();
    }
    async function settle() {
      if (settling || busy || document.hidden) return;
      // Requests survive navigation/reload; only the selected booking is resumed,
      // without replacing another page's selected event or touching health data.
      const result = read(), p = result?.progress, r = p?.studioRecords?.[id()], q = r?.benefitRequest;
      if (!result?.ok || account(p) !== account(state) || !p.signedIn || !p.authVerified || q?.status !== "checking" || q.readyAt > Date.now() || failedSaves.has(q.id)) return;
      settling = true;
      await locked(() => {
        if (!prepare(true) || !requestValid() || record().benefitRequest.id !== q.id || !owned()) return;
        const current = record(), unknown = navigator.onLine === false || q.outcome === "unknown";
        let status = unknown ? "unknown" : q.outcome === "verified" ? "resolved" : q.outcome;
        let receipt = api()?.getStudioBenefit?.(args(current));
        if (status === "resolved" && receipt?.status !== "posted") receipt = api()?.postStudioBenefit?.({ ...args(current), verified: true, verificationId: q.id, simulated: true });
        if (status === "resolved" && receipt?.status !== "posted") {
          if (receipt?.status === "unavailable" || receipt?.reason === "save-failed") { failedSaves.add(q.id); setError("奖励结果没能保存，请重试。不会重复增加奖励。"); return; }
          status = receipt?.status === "capped" ? "capped" : receipt?.status === "pending" ? "waiting" : "review";
        }
        if (!write(id(), { benefitRequest: { ...q, status, resolvedAt: new Date().toISOString() }, ...(receipt?.status === "posted" ? { benefitStatus: "posted" } : {}) })) {
          failedSaves.add(q.id); setError("查询状态没能保存。已到账奖励会从明细恢复。"); return;
        }
        if (receipt?.status === "posted") track("studio_benefit_posted", { event_id: id(), booking_id: current.bookingId, transaction_id: receipt.transactionId, points: receipt.points, growth: receipt.growth, offset: receipt.offset, simulated: true });
      });
      settling = false; if (state.current === "STU-13") render();
    }
    function showDetails() {
      if (!prepare(true)) return render();
      const m = model(); if (m.kind !== "posted") return render();
      modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal studio-benefit-modal" role="dialog" aria-modal="true" aria-labelledby="studio-benefit-detail-title"><header><h2 id="studio-benefit-detail-title">本场奖励明细</h2>${button("关闭", "close-modal")}</header><p>${esc(event(id()).title)}</p>${detailsBody(m.receipt)}${button("查看全部积分明细", "stub-points", "secondary")}</section></div>`;
    }
    function handle(action) {
      if (["studio-benefit-refresh", "studio-claim-benefit"].includes(action)) { query(); return true; }
      if (!action.startsWith("stub-")) return false;
      if (state.current !== "STU-13") return true;
      if (action.startsWith("stub-review:")) { const value = action.slice(12); if (["verified", "waiting", "review", "unknown"].includes(value)) { outcome = value; render(); } return true; }
      if (action === "stub-query") { query(); return true; }
      if (action === "stub-retry-save") { failedSaves.delete(record()?.benefitRequest?.id); error = ""; settle(); render(); return true; }
      if (action === "stub-details") { showDetails(); return true; }
      if (action === "stub-reload") { prepare(true); render(); return true; }
      const targets = { "stub-back": "STU-12", "stub-record": "STU-15", "stub-booking": "STU-18", "stub-help": "HELP-03", "stub-points": "PTS-02" };
      if (targets[action]) { closeModal(); if (!prepare(true) && !["stub-help", "stub-booking"].includes(action)) { flash("暂时无法读取本次记录，请稍后再试。"); render(); return true; } go(targets[action]); }
      return true;
    }
    function refresh() {
      if (document.hidden || busy || state.current !== "STU-13") return;
      prepare(); const next = JSON.stringify([model(), record()?.benefitRequest, errorScope === scope(record()) ? error : "", busy, navigator.onLine]);
      if (next !== last) { if (modalRoot.querySelector(".studio-benefit-modal")) closeModal(); render(); }
    }
    function reviewControls(item) {
      return item.id !== "STU-13" ? "" : `<section class="review-controls"><h3>奖励查询 · 本地验收</h3><small>模拟核验回执，不是真实发奖。仅匹配本次完成快照时可演示到账；不以健康授权或查看页面作为奖励条件。0.8秒为演示延迟。</small><div class="review-control-group">${[["verified", "核验通过"], ["waiting", "仍在核验"], ["review", "需要核对"], ["unknown", "查询无结果"]].map(([key, label]) => button(label, `stub-review:${key}`, outcome === key ? "primary" : "secondary")).join("")}</div></section>`;
    }
    setInterval(() => { settle(); refresh(); }, 500);
    window.addEventListener("storage", refresh); window.addEventListener("online", refresh); window.addEventListener("offline", refresh);
    return { page, handle, prepare, reviewControls, blocksPersist: () => state.current === "STU-13" && !fresh };
  };
})();
