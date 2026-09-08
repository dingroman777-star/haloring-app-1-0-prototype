(function () {
  window.createHaloStudioSession = function ({ state, event, media, preparation, sessionValid, deviceBlock, readStored, write, go, render, track, esc, icon, screen, modalRoot, closeModal, flash }) {
    let error = "", busy = false, intent = null, outcome = "success", context = "";
    const id = () => state.selectedStudioEventId;
    const account = () => String(state.authPhone || state.authForm?.phone || "local-demo");
    const record = () => state.studioRecords?.[id()];
    const button = (label, action, cls = "studio-session-link", disabled = false) => `<button type="button" class="${cls}" data-action="${esc(action)}" ${disabled ? "disabled" : ""}>${esc(label)}</button>`;
    const stamp = () => new Date().toISOString();
    function identity(r = record()) { return JSON.stringify([id(), account(), r?.bookingId, r?.sessionId, r?.sessionScope, r?.sessionAccountRef, r?.startedAt]); }
    function baseKey() {
      const r = record();
      return JSON.stringify([identity(), r?.eventId, r?.eventSnapshot, r?.booked, r?.paid, r?.refundStatus, r?.refundRequest, r?.paymentRequest,
        r?.deletionStatus, r?.mode, r?.activityConsent, r?.healthConsent, r?.recordingStoppedAt, r?.reportReviewState, r?.sessionDone, r?.completedAt,
        r?.completionSnapshot, r?.captureReceipt, state.signedIn, state.authVerified]);
    }
    function sync() {
      const latest = readStored();
      if (!latest.ok) { error = "暂时无法核对本机记录，请重试。尚未保存结束记录。"; feedback(); return false; }
      state.studioRecords = { ...latest.progress.studioRecords };
      for (const key of ["signedIn", "authVerified", "authPhone", "authForm", "accountDeletionStatus", "deviceStatus", "firmwareStatus", "deviceResetStatus", "measurementStatus", "measurementType", "deviceMaintenance", "deviceFirmware", "deviceHub", "deviceBindings", "deviceBinding", "initialDeviceSync", "activitySync", "dataLifecycle"])
        if (Object.prototype.hasOwnProperty.call(latest.progress, key)) state[key] = latest.progress[key];
      if (latest.progress.toggles) state.toggles = { ...state.toggles, ...latest.progress.toggles };
      if (latest.hardware) state.membershipHardwareState = latest.hardware;
      return true;
    }
    function problem() {
      return preparation.problem() || (!state.authVerified || state.accountDeletionStatus === "submitted" ? "请先登录当前账号" : "")
        || (!sessionValid(record()) ? "当前记录与预约不一致，请先核对" : "")
        || (record()?.sessionStarted !== true ? "本次活动尚未开始" : "");
    }
    function elapsed(r = record()) {
      const start = Date.parse(r?.startedAt), end = r?.sessionDone ? Date.parse(r.completedAt) : Date.now();
      return Number.isFinite(start) && Number.isFinite(end) && end >= start ? Math.floor((end - start) / 1000) : null;
    }
    function duration(seconds) {
      if (seconds === null) return "—";
      const hours = Math.floor(seconds / 3600), minutes = Math.floor(seconds / 60) % 60, rest = seconds % 60;
      return `${hours ? `${hours}:` : ""}${String(hours ? minutes : Math.floor(seconds / 60)).padStart(2,"0")}:${String(rest).padStart(2,"0")}`;
    }
    function clockLabel() {
      if (elapsed() === null) return "开始时间待核对";
      return `${new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(record().startedAt))} 开始`;
    }
    function liveState() {
      const r = record();
      if (!r?.activityConsent || r.recordingStoppedAt) return { title: "本次记录已停止", note: "活动仍可参加，结束时可正常关闭。", warning: true };
      if (r.mode === "basic") return { title: "不使用戒指", note: "只记录参与情况，不记录身体数据。", basic: true };
      if (!r.healthConsent || r.reportReviewState === "needs-review") return { title: "本次个人报告已关闭", note: "不会自动恢复或补记，活动仍可继续。", warning: true };
      const ready = preparation.readiness(), blocked = deviceBlock();
      if (!ready.ready || blocked) return { title: ready.ready ? "戒指状态待确认" : ready.title, note: "活动不会因此结束。连接恢复后再核对记录完整性。", warning: true, device: true };
      return { title: state.deviceStatus === "low" ? "已连接 · 电量偏低" : "已连接", note: state.deviceStatus === "low" ? "留意电量；报告以本次有效记录为准。" : "报告以本次实际有效记录为准。", warning: state.deviceStatus === "low" };
    }
    function captureValid(r, eventId = id()) {
      const c = r?.captureReceipt;
      const nonempty = value => typeof value === "string" && value.trim().length > 0;
      const start = Date.parse(r?.startedAt), end = r?.sessionDone ? Date.parse(r.completedAt) : Date.now();
      return Boolean(nonempty(c?.id) && nonempty(r?.sessionId) && Number.isFinite(start) && Number.isFinite(end) && start <= end
        && c.source === "prototype-fixture" && c.status === "valid" && c.eventId === eventId && c.bookingId === r.bookingId
        && c.sessionId === r.sessionId && c.accountRef === account() && c.startedAt === r.startedAt);
    }
    function reportEligible(r, eventId = id()) {
      const s = r?.completionSnapshot;
      return Boolean(s?.version === 1 && s.eventId === eventId && s.bookingId === r.bookingId && s.sessionId === r.sessionId && s.accountRef === account()
        && s.completedAt === r.completedAt && s.reportEligible === true && s.captureReceiptId === r.captureReceipt?.id && captureValid(r, eventId)
        && r.sessionDone && r.mode === "ring" && r.activityConsent && r.healthConsent && !r.recordingStoppedAt && r.reportReviewState !== "needs-review" && r.deletionStatus === "ready");
    }
    function footer() {
      if (problem()) return `${button("返回原预约核对", "stus-booking", "primary")}<p>${esc(problem())}</p>`;
      return `${error ? `<p class="studio-session-error" role="alert">${esc(error)}</p>` : ""}${button(busy ? "正在保存结束记录…" : "结束本次活动", "studio-complete", "primary", busy)}<p>${busy ? "保存成功后离开本页" : "结束前会再次确认"}</p>`;
    }
    function feedback() { const host = screen.querySelector(".studio-session"); host?.setAttribute("aria-busy", String(busy)); const f = host?.querySelector(".studio-detail-footer"); if (f) f.innerHTML = footer(); }
    function stateMarkup() {
      const r = record(), live = liveState();
      const ring = '<svg viewBox="0 0 32 32" aria-hidden="true"><ellipse cx="16" cy="16" rx="10" ry="13" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M17 3c-5 2-8 7-8 13s3 11 8 13" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
      return `<div class="studio-session-mode"><span>${r?.mode === "ring" ? ring : icon("clock")}</span><div><strong>${r?.mode === "ring" ? "本次使用 Halo Ring" : "基础参与"}</strong><p class="${live.warning ? "is-warning" : "is-ready"}">${!live.basic ? '<i aria-hidden="true"></i>' : ""}${esc(live.title)}</p></div></div><p class="studio-session-note">${esc(live.note)}</p>${live.device ? button("查看设备连接", "stus-device") : ""}${navigator.onLine === false ? '<p class="studio-session-offline" role="status">手机当前离线，联网后再核对同步情况。</p>' : ""}`;
    }
    function page() {
      const next = identity(); if (context !== next) { if (!context) error = ""; context = next; intent = null; }
      const e = event(id()), blocked = problem();
      const header = `<header class="studio-detail-header"><button type="button" data-action="stus-home" aria-label="返回 Studio，活动继续">${icon("back")}</button><h1>活动进行中</h1>${button("设置", "stus-settings")}</header>`;
      const body = blocked ? `<section class="studio-session-empty"><h2>${esc(blocked)}</h2><p>没有更改预约或活动记录。</p></section>` : `<div class="studio-booking-event studio-session-event">${media(id()) ? `<img src="${media(id())}" width="64" height="64" alt="${esc(e.category)}场地示意图">` : ""}<div><h2>${esc(e.title)}</h2><p>${esc(e.date)}</p><p>${esc(e.place)} · ${esc(e.duration)}分钟</p></div></div><section class="studio-session-timer"><p>已进行</p><output id="studio-session-elapsed" aria-label="活动经过时间">${duration(elapsed())}</output><p id="studio-session-start">${clockLabel()}</p></section><section class="studio-session-state" aria-live="polite">${stateMarkup()}</section><p class="studio-session-away">可以离开这页，活动不会因此结束。</p>`;
      return `<article class="studio-session studio-detail" aria-busy="${busy}"><div class="studio-detail-scroll" tabindex="0" aria-label="本次活动">${header}${body}</div><footer class="studio-detail-footer" aria-live="polite">${footer()}</footer></article>`;
    }
    function navigate(target) { if (busy || !sync()) return; closeModal(); intent = null; go(target); }
    function confirmEnd() {
      if (state.current !== "STU-04" || busy) return;
      const before = identity(); if (!sync()) return;
      if (before !== identity() || problem()) { error = "预约或记录有更新，请先核对当前活动。"; render(); return; }
      if (record().sessionDone) return go("STU-12");
      const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      intent = { token, identity: identity(), key: baseKey() };
      modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal studio-session-modal" data-session-confirm="${esc(token)}"><h2>结束本次活动？</h2><p>${esc(event(id()).title)}</p><p>结束后将保存这次参与记录，不能继续这次计时。</p><div class="button-row">${button("继续活动", "close-modal", "primary")}${button("确认结束", "stus-end-confirm", "secondary")}</div></section></div>`;
    }
    async function end() {
      if (state.current !== "STU-04" || busy || !intent || intent.token !== modalRoot.querySelector("[data-session-confirm]")?.dataset.sessionConfirm) return;
      if (!navigator.locks?.request) { closeModal(); error = "浏览器暂时无法安全保存，请重新打开本地原型后重试。活动尚未结束。"; feedback(); return; }
      const expected = { ...intent }; busy = true; error = ""; closeModal(); feedback();
      const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 8000);
      try {
        await navigator.locks.request("halo-studio-session-start", { mode: "exclusive", signal: controller.signal }, () => {
          if (state.current !== "STU-04" || !sync()) return;
          if (expected.identity !== identity() || problem()) { error = "预约或活动记录有更新，请重新核对后结束。"; return; }
          const r = record();
          if (r.sessionDone) { closeModal(); return go("STU-12"); }
          if (expected.key !== baseKey()) { error = "本次设置或记录有变化，请核对后再次结束。"; return; }
          const at = stamp(), active = state.membershipHardwareState === "active";
          const eligible = r.mode === "ring" && r.activityConsent === true && r.healthConsent === true && !r.recordingStoppedAt && r.reportReviewState !== "needs-review" && active && captureValid(r);
          const snapshot = { version: 1, eventId: id(), bookingId: r.bookingId, sessionId: r.sessionId || null, accountRef: account(), completedAt: at,
            mode: r.mode, activityConsent: r.activityConsent === true, healthConsent: r.healthConsent === true, hardwareActive: active,
            reportEligible: Boolean(eligible), captureReceiptId: eligible ? r.captureReceipt.id : null };
          const changes = { sessionDone: true, completedAt: at, elapsedSeconds: elapsed(r), hardwareEligibleAtCompletion: active,
            reportStatus: eligible ? "waiting" : "insufficient", benefitStatus: "pending", completionSnapshot: snapshot };
          if (outcome === "fail" || !write(id(), changes)) { error = "结束记录没保存成功，活动尚未结束。请重试，原记录都在。"; return; }
          state.selectedStudioHistoryId = id(); closeModal(); intent = null;
          track("studio_session_completed", { event_id: id(), booking_id: r.bookingId, session_id: r.sessionId || null, simulated: true });
          go("STU-12");
        });
      } catch { error = "暂时没能保存结束记录，请重试，不会重复结束。"; }
      finally { clearTimeout(timeout); busy = false; closeModal(); intent = null; if (state.current === "STU-04" && sync()) render(); else feedback(); }
    }
    function handle(action) {
      if (action.startsWith("stus-review:")) { outcome = action.endsWith("fail") ? "fail" : "success"; render(); return true; }
      if (!action.startsWith("stus-") && action !== "studio-complete") return false;
      if (state.current !== "STU-04") return true;
      if (action === "studio-complete") confirmEnd();
      else if (action === "stus-end-confirm") end();
      else if (action === "stus-home") navigate("STU-08");
      else if (action === "stus-settings") navigate("STU-10");
      else if (action === "stus-device") navigate(state.membershipHardwareState === "active" ? "DEV-10" : "DEV-01");
      else if (action === "stus-booking") navigate("STU-18");
      return true;
    }
    function prepare() { return state.current !== "STU-04" || sync(); }
    function tick() {
      if (state.current !== "STU-04" || document.hidden) return;
      const timer = screen.querySelector("#studio-session-elapsed"), start = screen.querySelector("#studio-session-start");
      if (timer) timer.textContent = duration(elapsed());
      if (start) start.textContent = clockLabel();
    }
    function refresh() {
      if (state.current !== "STU-04" || busy || document.hidden) return;
      const oldIdentity = identity(), oldBase = baseKey();
      if (!sync()) return;
      if (oldIdentity !== identity() || oldBase !== baseKey() || problem() || record()?.sessionDone) { closeModal(); intent = null; render(); return; }
      tick();
      const live = screen.querySelector(".studio-session-state"), markup = stateMarkup();
      if (live && live.innerHTML !== markup) live.innerHTML = markup;
    }
    function reviewControls(item) { return item.id === "STU-04" ? `<section class="review-controls"><h3>活动结束 · 本地验收</h3><small>计时是活动经过时间，不是采集时长。此原型不连接真实设备。</small><div class="review-control-group"><div>${["success","fail"].map(value => `<button data-action="stus-review:${value}">${value === "success" ? "保存成功" : "保存失败"}</button>`).join("")}</div></div></section>` : ""; }
    window.addEventListener("online", refresh); window.addEventListener("offline", refresh);
    setInterval(tick, 1000); // Text-only clock: no render, storage write or screen-reader live announcement.
    return { page, handle, prepare, refresh, reviewControls, reportEligible };
  };
})();
