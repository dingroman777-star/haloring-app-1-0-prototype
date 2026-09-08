(function () {
  window.createHaloStudioPreparation = function ({ state, events, event, media, payment, reservation, go, render, persist, write, track, esc, icon, screen, modalRoot, closeModal, flash }) {
    let confirmIntent = null, reviewSave = "success", error = "", savedNotice = "", messageContext = "";
    const currentId = () => state.selectedStudioEventId;
    const known = id => Object.prototype.hasOwnProperty.call(events, id);
    const record = (id = currentId()) => state.studioRecords?.[id];
    const active = () => state.membershipHardwareState === "active";
    const managed = r => Boolean(r?.sessionStarted || r?.sessionDone);
    const stamp = () => new Date().toISOString();
    function problem(id = currentId()) {
      const r = record(id);
      if (!state.signedIn) return "请先登录";
      if (!known(id) || r?.booked !== true || typeof r.bookingId !== "string" || !r.bookingId.trim()) return "暂时无法核对这笔预约";
      if ((r.eventId && r.eventId !== id) || (r.eventSnapshot?.id && r.eventSnapshot.id !== id) || (r.eventSnapshot?.eventId && r.eventSnapshot.eventId !== id)) return "预约与当前活动不一致，请先核对";
      if (payment.unresolved(r)) return "请先核对支付结果";
      if (r.paid !== true) return "预约尚未确认，请先查看付款状态";
      if (reservation.unresolved(r) || r.refundStatus !== "none") return "这笔预约正在取消或已取消";
      if (r.deletionStatus && r.deletionStatus !== "ready") return "本次个人记录已删除或正在处理";
      if (r.source && !["app", "institution"].includes(r.source)) return "请先核对原预约信息";
      return "";
    }
    function baseKey(id = currentId()) {
      const r = record(id);
      return JSON.stringify([id, r?.bookingId, r?.eventId, r?.eventSnapshot?.id, r?.eventSnapshot?.eventId, r?.booked, r?.paid, r?.source || "app", r?.refundStatus,
        r?.refundRequest?.status, r?.paymentRequest?.status, r?.mode, r?.activityConsent, r?.healthConsent,
        r?.reportStatus, r?.reportReviewState, r?.deletionStatus, r?.sessionStarted, r?.sessionDone, r?.startedAt,
        state.membershipHardwareState]);
    }
    function savedDraft(id = currentId()) {
      const r = record(id) || {};
      return { eventId: id, bookingId: r.bookingId, baseKey: baseKey(id), mode: r.mode === "ring" ? "ring" : "basic", activityConsent: r.activityConsent === true, healthConsent: r.healthConsent === true, updatedAt: "" };
    }
    function draft(id = currentId()) { const r = record(id); return r?.preparationDraft || savedDraft(id); }
    function conflict() { const d = draft(); return d.eventId !== currentId() || d.bookingId !== record()?.bookingId || d.baseKey !== baseKey(); }
    function readiness() {
      if (!active()) return { ready: false, title: "尚未绑定 Halo Ring", note: "没有戒指也能参加。本次可选择不使用戒指。" };
      if (state.toggles.bluetooth === false) return { ready: false, title: "蓝牙未开启", note: "开启蓝牙后再连接，也可以不使用戒指参加。" };
      if (state.deviceStatus === "low") return { ready: true, title: "已连接 · 电量偏低", note: "建议提前充电，避免活动中断。" };
      if (state.deviceStatus === "connected") return { ready: true, title: "Halo Ring 已连接", note: "是否生成报告，还要看本次活动的有效记录。" };
      return { ready: false, title: ({ connecting: "正在连接 Halo Ring", syncing: "戒指正在同步", disconnected: "Halo Ring 暂未连接", action: "戒指连接需要处理" })[state.deviceStatus] || "连接状态待确认", note: "已有选择会保留。可先查看设备，也可以不使用戒指参加。" };
    }
    function nextProblem() {
      if (problem()) return problem();
      if (conflict()) return "预约或设置有更新，请先重新核对";
      const d = draft(), r = record();
      if (!managed(r) && !d.activityConsent) return "请先确认活动记录用途";
      if (!managed(r) && d.mode === "ring" && !d.healthConsent) return "请确认本次报告用途，或选择不使用戒指";
      if (!managed(r) && d.mode === "ring" && !readiness().ready) return readiness().title;
      if (managed(r) && !d.activityConsent && d.healthConsent) return "关闭活动记录时，也将关闭本次个人报告";
      return "";
    }
    function fingerprint() { return JSON.stringify([baseKey(), draft(), readiness(), problem(), error, savedNotice]); }
    function fail(message) { error = message; render(); screen.querySelector(".studio-preparation-error")?.scrollIntoView({ block: "nearest" }); }
    function edit(field, value) {
      if (state.current !== "STU-10") return;
      if (problem()) return fail(problem());
      if (conflict()) return fail("预约或设置有更新，原选择仍保留。请先重新核对。");
      const r = record(), d = { ...draft() };
      if (field === "mode" && (managed(r) || !["basic", "ring"].includes(value) || value === "ring" && !active())) return;
      if (field === "healthConsent" && value && (!managed(r) && d.mode !== "ring" || managed(r) && r.mode !== "ring")) return;
      if (d[field] === value) return; // Re-selecting a radio never withdraws a report.
      d[field] = value;
      if (field === "mode" && value === "basic" || field === "activityConsent" && !value) d.healthConsent = false;
      if (field === "healthConsent" && value && !d.activityConsent) return fail("请先确认本次活动记录用途。");
      d.updatedAt = stamp(); error = ""; savedNotice = "";
      if (!write(currentId(), { preparationDraft: d })) { r.preparationDraft = d; error = "草稿暂时无法保存到本机，仅保留在当前页面，请勿刷新。"; }
      render();
    }
    const disclosure = (key, title, body) => `<details class="studio-detail-info" data-studio-info="${key}"><summary><span>${title}</span>${icon("arrow")}</summary><div>${body}</div></details>`;
    function page() {
      const context = `${currentId()}:${record()?.bookingId}`;
      if (messageContext !== context) { messageContext = context; error = ""; savedNotice = ""; confirmIntent = null; }
      const id = currentId(), r = record(id), blocker = problem(), m = managed(r), d = draft(), ready = readiness();
      const title = m ? "本次设置" : "参加准备";
      const button = (label, action, cls = "studio-preparation-link", disabled = false) => `<button type="button" class="${cls}" data-action="${action}" ${disabled ? "disabled" : ""}>${esc(label)}</button>`;
      const header = `<header class="studio-detail-header"><button type="button" data-action="stup-back" aria-label="返回原预约或体验">${icon("back")}</button><h1>${title}</h1><button type="button" data-action="go:HELP-03">咨询</button></header>`;
      if (blocker) return `<article class="studio-preparation studio-detail" data-preparation-key="${esc(fingerprint())}"><div class="studio-detail-scroll" tabindex="0">${header}<section class="studio-preparation-empty"><h2>${esc(blocker)}</h2><p>没有改动预约、参与设置或报告。请返回原预约核对。</p></section></div><footer class="studio-detail-footer">${button("查看原预约", "go:STU-18", "primary")}${button("联系活动客服", "go:HELP-03")}</footer></article>`;
      const e = event(id);
      const checkbox = (key, label, detail, checked, disabled = false) => `<label class="studio-preparation-check"><input type="checkbox" data-stup-field="${key}" data-action="stup-${key === "activityConsent" ? "activity" : "health"}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""}><span><strong>${label}</strong><small>${detail}</small></span></label>`;
      const radio = (value, label, detail) => `<label class="studio-preparation-choice ${d.mode === value ? "is-selected" : ""}"><input type="radio" name="studio-participation-mode" value="${value}" data-action="stup-mode:${value}" ${d.mode === value ? "checked" : ""}><span><strong>${label}</strong><small>${detail}</small></span></label>`;
      const showRing = m ? r.mode === "ring" : d.mode === "ring";
      const method = m ? `<section class="studio-preparation-section"><h2>本次参与方式</h2><p>${r.mode === "ring" ? "使用本人 Halo Ring 记录" : "不使用戒指"}</p><p class="studio-preparation-muted">${r.sessionDone ? "活动已完成，原参与方式不再变更。" : "活动已开始，调整以下设置不会重新开始。"}</p></section>` : active() || d.mode === "ring" ? `<fieldset class="studio-preparation-modes"><legend>这次想怎样参加？</legend>${radio("basic", "不使用戒指", "专心参加活动，不记录身体数据。")}${active() ? radio("ring", "用我的 Halo Ring 记录", "可选择生成仅自己可见的个人报告。") : `<p class="studio-preparation-muted">${esc(ready.note)}</p>`}</fieldset>` : '<section class="studio-preparation-section studio-preparation-unbound"><h2>没有戒指也能参加</h2><p>专心参加活动，不记录身体数据。</p></section>';
      const report = showRing ? `<section class="studio-preparation-section"><h2>个人报告 · 可选</h2>${checkbox("healthConsent", "同意用于本次个人报告", "使用本次戒指记录，仅自己可见，不提供给活动机构。", d.healthConsent, !d.activityConsent)}${m && r.reportReviewState === "needs-review" ? '<p class="studio-preparation-muted" role="status">本次报告曾关闭。重新开启许可后，原报告仍需核对，不会自动恢复。</p>' : ""}${!m ? `<div class="studio-preparation-device" role="status"><strong>${esc(ready.title)}</strong><p>${esc(ready.note)}</p>${button("查看设备", "stup-device")}</div>` : ""}</section>` : "";
      const hint = nextProblem();
      const statusNote = error || savedNotice || conflict() ? `<div class="studio-preparation-error" role="status">${esc(error || (conflict() ? "预约或设置有更新，原选择尚未提交。请重新核对。" : savedNotice))}${conflict() ? button("放弃草稿，载入当前设置", "stup-reset") : ""}</div>` : "";
      return `<article class="studio-preparation studio-detail" data-preparation-key="${esc(fingerprint())}"><div class="studio-detail-scroll" tabindex="0" aria-label="参加准备与本次记录设置">${header}<div class="studio-booking-event studio-preparation-event">${media(id) ? `<img src="${media(id)}" width="64" height="64" alt="${esc(e.category)}场地示意图">` : ""}<div><h2>${esc(e.title)}</h2><p>${esc(e.date)}</p><p>${esc(e.place)} · ${esc(e.duration)}分钟</p></div></div>${method}<section class="studio-preparation-section"><h2>活动记录</h2>${checkbox("activityConsent", "同意保存本次参与记录", m ? "关闭前会说明影响。不会取消预约或改变原付款。" : "用于查看这次活动的参与情况，不代表已签到。", d.activityConsent)}</section>${report}${disclosure("preparation-report", "关于个人报告", '<p>不使用戒指也能参加活动。想查看本次个人报告，需要同意其用途，并有足够的有效记录；并非每次都会生成报告。</p><p>报告用于本人回看，不代表活动效果或医疗结论。关闭后不再展示；重新开启不等于恢复已经删除或缺少记录的内容。</p>')}${disclosure("preparation-privacy", "记录与隐私", `<p>本页只管理这一次活动。活动记录用于查看参与情况；个人报告另外选择，联系和营销设置不在这里一并开启。</p><p>查看页面、改变选项或点击下一步都不代表签到。正式开始前还有单独的确认。</p>${button("咨询记录用途", "go:HELP-03")}`)}${statusNote}</div><footer class="studio-detail-footer"><p class="studio-preparation-hint" role="status">${esc(hint || (m ? "保存后返回本次体验" : "选择已保留，下一步才会保存"))}</p>${button(m ? "保存设置" : "下一步", "stup-save", "primary", Boolean(hint))}${!m && d.mode === "ring" ? button("不使用戒指继续", "stup-use-basic", "studio-preparation-secondary", !d.activityConsent || conflict()) : ""}<p>${m ? "只管理本次活动，不重新开始" : "下一步可记录感受，也可跳过"}</p></footer></article>`;
    }
    function back() {
      error = ""; savedNotice = "";
      if (problem()) return go("STU-18");
      const r = record(); go(r.sessionDone ? "STU-15" : r.sessionStarted ? "STU-04" : "STU-18");
    }
    function withdrawModal(d) {
      const r = record(), token = `${r.bookingId}-${Date.now()}`;
      confirmIntent = { token, eventId: currentId(), bookingId: r.bookingId, baseKey: baseKey(), draft: JSON.stringify(d) };
      modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal studio-preparation-modal" data-stup-confirm="${esc(token)}"><h2>${!d.activityConsent ? "关闭本次活动记录？" : "关闭本次个人报告？"}</h2><p>${esc(event(currentId()).title)}</p><p>${!d.activityConsent ? "将停止本次活动记录，并关闭个人报告展示。" : "将停止将本次戒指记录用于个人报告，并关闭报告展示。"}预约和原付款不受影响。</p><p>${r.sessionStarted && !r.sessionDone ? "活动仍可参加，之后可以结束本次体验。" : "重新开启许可也不会自动恢复或补造历史报告。"}</p><div class="button-row"><button type="button" class="primary" data-action="close-modal">暂不关闭</button><button type="button" class="secondary" data-action="stup-withdraw-confirm">确认关闭</button></div></section></div>`;
    }
    function save(confirmed = false, useBasic = false) {
      if (state.current !== "STU-10") return;
      if (problem()) return fail(problem());
      if (conflict()) return fail("预约或设置有更新，请重新核对后再保存。");
      const r = record(), d = { ...draft() }, m = managed(r);
      if (useBasic && !m) { d.mode = "basic"; d.healthConsent = false; r.preparationDraft = d; persist(); }
      const reason = nextProblem(); if (reason) return fail(reason);
      const revoking = r.activityConsent === true && !d.activityConsent || r.healthConsent === true && !d.healthConsent;
      if (revoking && !confirmed) return withdrawModal(d);
      if (confirmed) {
        const token = modalRoot.querySelector("[data-stup-confirm]")?.dataset.stupConfirm;
        if (!confirmIntent || token !== confirmIntent.token || confirmIntent.eventId !== currentId() || confirmIntent.bookingId !== r.bookingId || confirmIntent.baseKey !== baseKey() || confirmIntent.draft !== JSON.stringify(d)) { closeModal(); confirmIntent = null; return fail("设置有变化，请重新核对关闭范围。"); }
      }
      const changed = (!m && d.mode !== r.mode) || d.activityConsent !== r.activityConsent || d.healthConsent !== r.healthConsent;
      if (!changed) { if (r.preparationDraft && !write(currentId(), { preparationDraft: null })) return fail("这次没保存成功，请稍后重试。"); closeModal(); return go(m ? r.sessionDone ? "STU-15" : "STU-04" : "STU-11"); }
      const updates = { mode: m ? r.mode : d.mode, activityConsent: d.activityConsent, healthConsent: d.healthConsent,
        preparationDraft: null, consentUpdatedAt: stamp(), consentVersion: (r.consentVersion || 0) + 1 };
      // Permissions and report results are different facts. Never regenerate old reports here.
      if (m && r.mode === "ring" && (revoking || !r.healthConsent && d.healthConsent)) updates.reportReviewState = "needs-review";
      if (r.sessionStarted && !r.sessionDone && !d.activityConsent) updates.recordingStoppedAt = stamp();
      const change = { id: `SC-${r.bookingId}-${updates.consentVersion}`, eventId: currentId(), bookingId: r.bookingId, at: updates.consentUpdatedAt, activityConsent: d.activityConsent, healthConsent: d.healthConsent, mode: updates.mode, localOnly: true };
      updates.consentChanges = [...(Array.isArray(r.consentChanges) ? r.consentChanges : []), change];
      if (reviewSave === "fail" || !write(currentId(), updates)) { closeModal(); confirmIntent = null; return fail("这次没保存成功，原设置没有改变，选择也还在。请重试。"); }
      confirmIntent = null; closeModal(); error = ""; savedNotice = "";
      track("studio_participation_settings_saved", { event_id: currentId(), booking_id: r.bookingId, consent_version: updates.consentVersion, mode: updates.mode, activity_consent: d.activityConsent, health_consent: d.healthConsent, management: m, simulated: true });
      go(m ? r.sessionDone ? "STU-15" : "STU-04" : "STU-11"); flash("本次设置已保存到本机");
    }
    function handle(action) {
      const legacy = { "choose:studioMode:basic": "stup-mode:basic", "choose:studioMode:ring": "stup-mode:ring", "toggle:studioActivity": "stup-activity", "toggle:studioHealth": "stup-health" };
      action = legacy[action] || action;
      if (action.startsWith("stup-review:")) { reviewSave = action.split(":")[1] === "fail" ? "fail" : "success"; render(); return true; }
      if (!action.startsWith("stup-")) return false;
      if (action === "stup-back") { back(); return true; }
      if (state.current !== "STU-10") return true;
      if (action.startsWith("stup-mode:")) edit("mode", action.split(":")[1]);
      else if (action === "stup-activity") edit("activityConsent", !draft().activityConsent);
      else if (action === "stup-health") edit("healthConsent", !draft().healthConsent);
      else if (action === "stup-save") save();
      else if (action === "stup-use-basic") save(false, true);
      else if (action === "stup-withdraw-confirm") save(true);
      else if (action === "stup-reset" && !problem()) {
        // Explicitly discard only this unsubmitted settings draft, never activity/history.
        if (!write(currentId(), { preparationDraft: null })) return fail("暂时无法载入，草稿仍然保留。请重试。"), true;
        error = ""; savedNotice = "已载入当前保存的设置，请重新确认选择。"; render();
      } else if (action === "stup-device" && !problem()) { persist(); go(active() ? "DEV-10" : "DEV-01"); }
      return true;
    }
    function reviewControls(item) { return item.id === "STU-10" ? `<section class="review-block"><h3>参加准备 · 本地审阅</h3><p>选择是草稿，明确保存才生效；不调用云端许可服务。当前保存：${reviewSave === "fail" ? "失败" : "成功"}。</p><button data-action="stup-review:success">保存成功</button><button data-action="stup-review:fail">保存失败</button><p>已开始/完成的活动只管理设置；重新开启报告需正式服务核对，不在这里生成历史报告。</p></section>` : ""; }
    function refresh() { const el = screen.querySelector(".studio-preparation[data-preparation-key]"); if (state.current === "STU-10" && !document.hidden && el && el.dataset.preparationKey !== fingerprint() && !modalRoot.querySelector(".modal")) render(); }
    return { page, handle, reviewControls, refresh, problem, readiness };
  };
})();
