(() => {
  "use strict";
  window.createHaloStudioRecord = function ({ state, events, event, media, report, feeling, read, write, go, render, esc, icon, screen }) {
    const account = p => String(p.authPhone || p.authForm?.phone || "local-demo");
    const id = () => state.selectedStudioEventId;
    const record = () => state.studioRecords?.[id()];
    const scope = r => JSON.stringify([account(state), id(), r?.bookingId, r?.sessionId, r?.completedAt]);
    let fresh = true, shown = "", intent = null, busy = false, message = "", last = "";
    function prepare() {
      if (state.current !== "STU-15") { intent = null; return true; }
      const p = read()?.progress;
      fresh = Boolean(p && p.studioRecords && typeof p.studioRecords === "object" && !Array.isArray(p.studioRecords)
        && account(p) === account(state) && p.signedIn && p.authVerified && p.accountDeletionStatus !== "submitted");
      if (fresh) state.studioRecords = { ...p.studioRecords };
      return fresh;
    }
    function owned(r = record()) {
      return fresh && Object.hasOwn(events, id()) && r?.booked && typeof r.bookingId === "string" && Boolean(r.bookingId.trim())
        && (!r.eventId || r.eventId === id()) && (!r.eventSnapshot?.id || r.eventSnapshot.id === id()) && (!r.eventSnapshot?.eventId || r.eventSnapshot.eventId === id())
        && (!r.accountRef || r.accountRef === account(state)) && (!r.sessionAccountRef || r.sessionAccountRef === account(state))
        && (!r.sessionScope || r.sessionScope.eventId === id() && r.sessionScope.bookingId === r.bookingId);
    }
    const deleted = r => r?.deletionStatus && r.deletionStatus !== "ready";
    const canDelete = () => owned() && record().sessionDone && !deleted(record());
    const button = (label, action, cls = "secondary") => `<button type="button" class="${cls}" data-action="stud-${action}" ${label === "‹" ? 'aria-label="返回体验记录"' : ""} ${busy ? "disabled" : ""}>${esc(label)}</button>`;
    function reward(r) {
      if (!r.sessionDone) return "完成体验后查看";
      const result = window.HALO_COMMERCIAL_EXTENSION?.getStudioBenefit?.({accountRef:account(state),eventId:id(),bookingId:r.bookingId,occurredAt:r.completedAt,completed:r.sessionDone,paid:r.paid});
      return result?.status === "posted" ? result.points || result.growth ? "本次奖励已到账" : "本次奖励已核对" : result?.status === "review" ? "奖励记录待核对" : result?.status === "pending" ? "等待活动核验" : "查看本次奖励进度";
    }
    const link = (title, note, action, image) => `<button type="button" class="studio-record-row" data-action="stud-${action}">${icon(image)}<span><strong>${esc(title)}</strong><small>${esc(note)}</small></span>${icon("arrow")}</button>`;
    function page() {
      const r = record(), valid = owned(), e = valid ? event(id()) : null, removed = deleted(r);
      shown = valid ? scope(r) : ""; last = JSON.stringify([fresh, r]);
      const header = `<header class="studio-detail-header">${button("‹", "back", "studio-icon-control")}<h1>${intent ? "删除本次个人记录" : "本次体验"}</h1>${button("客服", "help", "studio-record-help")}</header>`;
      const eventCard = e ? `<div class="studio-booking-event studio-record-event">${media(id()) ? `<img src="${media(id())}" alt="${esc(e.category)}场地示意图" width="64" height="64">` : ""}<div><h2>${esc(e.title)}</h2><p>${esc(e.date)}</p><p>${esc(e.place)}</p></div></div>` : "";
      const s = valid ? report.summary(r) : null;
      const status = removed ? "个人记录已删除" : r?.refundStatus === "refunded" ? "已退款" : r?.refundStatus === "cancelled" ? "已取消" : r?.sessionDone ? "体验已完成" : r?.sessionStarted ? "体验进行中" : "已预约";
      let body = !valid ? `<section class="studio-record-empty"><h2>${fresh ? "暂时无法打开这次体验" : "暂时读不到本次记录"}</h2><p>已有记录没有改变，请重新读取或返回体验列表核对。</p>${button("重新读取", "reload")}</section>` : intent
        ? `${eventCard}<section class="studio-record-confirm"><h2>确认删除这次的个人内容？</h2><p>将从本机删除本次感受、报告及次日回顾，并关闭本次联系消息。</p><p>预约、支付、退款和奖励记录保留；其他活动不受影响。</p><p class="studio-record-warning">删除后无法在本机恢复。云端数据如需删除，请联系 Halo 客服处理；此操作不会提交云端删除申请。</p></section>`
        : `${eventCard}<div class="studio-record-status">${icon(removed ? "report" : "ticket")}<span>${status}</span></div>${removed ? '<p class="studio-record-note">本次个人内容已从本机删除，必要预约和奖励记录仍可查看。</p>' : `<div class="studio-record-facts"><span>参与方式<strong>${r.mode === "ring" ? "Halo Ring" : "基础参与"}</strong></span><span>参与时长<strong>${r.sessionDone && Number.isFinite(r.elapsedSeconds) && r.elapsedSeconds >= 0 ? `${Math.floor(r.elapsedSeconds / 60)} 分钟` : "—"}</strong></span></div>${r.sessionDone ? `<section class="studio-record-report"><span>个人报告</span><h2>${esc(s.title)}</h2>${button(s.kind === "generated" ? "查看本次报告" : "查看报告状态", "report", "primary")}</section>` : link("本次预约", "查看到场安排与当前进度", "booking", "calendar")}${feeling.savedText(r) ? `<section class="studio-record-feeling"><header><h2>活动前的感受</h2><span>用户记录</span></header><blockquote>${esc(feeling.savedText(r))}</blockquote></section>` : ""}`}
          <nav class="studio-record-links" aria-label="本次体验相关内容">${link("活动奖励", reward(r), "benefit", "ticket")}${link("预约与付款", "查看原预约及取消、退款进度", "booking", "calendar")}${link("联系设置", "本次服务消息与活动推荐", "contact", "people")}${!removed ? link("参与与报告设置", "管理本次记录用途", "consent", "report") : ""}</nav>${canDelete() ? `<div class="studio-record-danger">${button("删除本次个人记录", "delete", "danger-button")}</div>` : ""}`;
      return `<article class="studio-record studio-detail" aria-busy="${busy}"><div class="studio-detail-scroll" tabindex="0" aria-label="本次体验详情">${header}${body}</div><footer class="studio-detail-footer"><p role="status" class="studio-record-feedback">${esc(message)}</p>${intent ? `${button("保留记录", "cancel")}${button(busy ? "正在删除…" : "确认从本机删除", "confirm", "danger-button")}` : button("返回体验记录", "back", "primary")}</footer></article>`;
    }
    function cancel() { intent = null; message = ""; render(); screen.querySelector('[data-action="stud-delete"]')?.focus(); }
    async function remove() {
      if (busy || !intent || state.current !== "STU-15") return;
      const expected = intent; busy = true; message = ""; render();
      const apply = () => {
        if (state.current !== "STU-15" || !prepare() || !canDelete() || scope(record()) !== expected.scope || JSON.stringify(record()) !== expected.record) {
          intent = null; message = "记录有更新，未删除任何内容。请重新核对。"; return;
        }
        const r = record();
        const changes = { deletionStatus:"deleted", personalDeletedAt:new Date().toISOString(), personalDeletionScope:{accountRef:account(state),eventId:id(),bookingId:r.bookingId,localOnly:true},
          beforeFeeling:"",beforeDraft:"",feelingDraft:null,beforePreviousRecords:[],beforeRecordScope:null,beforeSavedAt:null,beforeUpdatedAt:null,
          nextDayReport:null,captureReceipt:null,reportRequest:null,healthConsent:false,reportStatus:"withdrawn",contactConsent:false,marketingConsent:false,
          completionSnapshot:r.completionSnapshot ? Object.fromEntries(["version","eventId","bookingId","sessionId","accountRef","completedAt","hardwareActive"].map(k=>[k,r.completionSnapshot[k]])) : null };
        if (!write(id(), expected.record, changes)) { message = "未能保存删除结果，原记录仍然保留。请重试。"; return; }
        intent = null; message = "本次个人内容已从本机删除。";
      };
      const controller = new AbortController(), timer = setTimeout(()=>controller.abort(),6000);
      try { if (navigator.locks?.request) await navigator.locks.request("halo-studio-session-start",{mode:"exclusive",signal:controller.signal},apply); else message="暂时无法安全删除，请重新打开后再试。"; }
      catch { message="删除未完成，原记录仍然保留。请重试。"; }
      finally { clearTimeout(timer);busy=false;if(state.current==="STU-15")render(); }
    }
    function handle(action) {
      if (action.startsWith("danger:删除本次体验记录:")) action="stud-delete";
      if (action === "confirm-danger:删除本次体验记录") return true;
      if (!action.startsWith("stud-")) return false;
      if (state.current !== "STU-15" || busy) return true;
      if (action === "stud-confirm") { remove();return true; }
      if (action === "stud-cancel") { cancel();return true; }
      if (action === "stud-reload") {prepare();message=fresh?"已读取本机最新记录。":"读取未完成，请重试。";render();return true;}
      if (action === "stud-back" && intent) {cancel();return true;}
      const before=shown;prepare();
      if (["stud-back","stud-help"].includes(action)) {intent=null;go(action==="stud-back"?"STU-07":"HELP-03");return true;}
      if (!owned() || !before || before !== scope(record())) {message="记录有更新，请核对后再操作。";render();return true;}
      if (action === "stud-delete") {if(canDelete()){intent={scope:scope(record()),record:JSON.stringify(record())};message="";render();screen.querySelector('[data-action="stud-cancel"]')?.focus();}return true;}
      const targets={"stud-benefit":"STU-13","stud-booking":"STU-18","stud-contact":"STU-14","stud-consent":"STU-10","stud-report":report.summary(record()).kind==="generated"?"STU-05":"STU-12"};
      if (targets[action] && !(deleted(record()) && ["stud-report","stud-consent"].includes(action))) go(targets[action]);
      return true;
    }
    function refresh(){if(document.hidden||busy||state.current!=="STU-15")return;prepare();if(last!==JSON.stringify([fresh,record()])){if(intent){intent=null;message="记录有更新，未删除任何内容。";}render();}}
    setInterval(refresh,700);window.addEventListener("storage",refresh);document.addEventListener("visibilitychange",refresh);
    document.addEventListener("keydown",e=>{if(e.key==="Escape"&&state.current==="STU-15"&&intent&&!busy){e.preventDefault();cancel();}});
    return {prepare,page,handle,blocksPersist:()=>state.current==="STU-15"||!fresh};
  };
})();
