/* ACC-03 records an owner-bound local demonstration only; it never deletes account data. */
(() => {
  window.createHaloAccountDeletion = function ({ state, go, render, write, readSession, hasUnmergedChanges, getAssets, track, esc, screen, modalRoot, closeModal }) {
    let shown = null, intent = null, saving = false, departureFingerprint = null;
    const owner = source => String(source.authPhone || "");
    const session = source => String(source.authForm?.login?.id || source.agreementAcceptance?.acceptedAt || "verified-session");
    const eligible = () => state.current === "ACC-03" && state.signedIn === true && state.authVerified === true && state.accountDeletionStatus !== "submitted";
    function syncStatus() {
      const request = state.accountDeletionRequest;
      if (state.signedIn && request?.ownerAccount) state.accountDeletionStatus = request.ownerAccount === owner(state) && request.simulated === true ? "submitted" : "ready";
    }
    const quantity = (value, suffix = "") => Number.isFinite(value) ? `${value.toLocaleString("zh-CN")}${suffix}` : "暂未获取";
    const header = () => '<header class="ad-header"><button type="button" data-action="account-deletion:back" aria-label="返回账号与安全">‹</button><h1>注销账号</h1><span aria-hidden="true"></span></header>';
    function assets(snapshot, title = "当前会员资产") {
      const value = snapshot || {};
      const rows = [["会员等级", value.level || "暂未获取"], ["HALO 成长值", quantity(value.growth)], ["徽章", quantity(value.badges, " 枚")], ["未使用 Halo Points", quantity(value.points)], ["商城优惠券", quantity(value.coupons, " 张")], ["未使用权益", quantity(value.unusedBenefits, " 项")]];
      return `<section class="ad-assets"><h2>${title}</h2><dl class="ad-asset-list">${rows.map(([label, text]) => `<div class="ad-asset-row"><dt>${label}</dt><dd>${esc(text)}</dd></div>`).join("")}</dl><p>未使用权益仅统计已记录、未过期的兑换券。</p></section>`;
    }
    function notes() {
      return '<section class="ad-notes"><details><summary>数据与会员资产</summary><p>注销完成后，会员等级、成长值、徽章、积分、优惠券及其他未使用权益失效，不可提现、折现或转让。重新注册将从 Halo Member（L1）开始，原有资产不恢复。</p><p>注销完成后，不再必要的健康、会员及行为数据将删除或匿名化。依法必须留存的交易、税务、售后与安全审计记录，只在必要范围内保留，并停止用于会员营销和个性化运营。</p></details><details><summary>订单、售后与渠道合作</summary><p>即使仍有订单、退款、售后或申诉在处理，也可以申请注销；相关服务会继续。可凭订单号、已验证的联系方式或原企业微信客服会话继续处理。</p><p>注销会员账号不自动终止独立渠道合同；历史结算、税务和售后责任仍按合同处理，无需重新开通经营身份。</p></details><details><summary>注销说明</summary><p>正式服务承诺：可立即完成的部分立即处理；需要人工核对的，处理时限最长不超过 15 个工作日。</p><p>当前仅演示申请记录，不会向客服发送请求，也不会启动真实注销或处理计时。</p><button type="button" class="text-button" data-action="go:LEGAL-02">查看协议与说明</button></details></section>';
    }
    function readAssets() {
      try { return getAssets() || { ok: false }; } catch { return { ok: false }; }
    }
    function page() {
      if (state.accountDeletionStatus === "submitted") {
        // The recorded request snapshot is historical; departure safety uses a
        // separate, live baseline captured for this visit, never that old snapshot.
        if (departureFingerprint === null) departureFingerprint = readAssets().progressFingerprint || null;
        const request = state.accountDeletionRequest;
        const own = request?.simulated === true && request.ownerAccount === owner(state);
        const time = own && Number.isFinite(Date.parse(request.recordedAt)) ? `<time datetime="${esc(request.recordedAt)}">本机记录时间：${esc(new Date(request.recordedAt).toLocaleString("zh-CN", { hour12: false }))}</time>` : '<p>这份旧演示状态没有可核对的申请时间与资产快照。</p>';
        return `<div class="ad-page">${header()}<section class="ad-result"><h2>${own ? "申请已记录（演示）" : "旧版本地注销演示"}</h2><p>仅保存在本机，未提交真实注销申请。账号资料和会员资产没有删除。</p>${time}</section>${own && request.assetSnapshot ? assets(request.assetSnapshot, "记录申请时的会员资产") : ""}${notes()}<p class="ad-error" role="alert"></p><section class="ad-actions"><button type="button" class="primary" data-action="go:HELP-03">联系客服</button><button type="button" class="secondary" data-action="account-deletion:back">返回账号与安全</button></section></div>`;
      }
      shown = readAssets();
      if (departureFingerprint === null) departureFingerprint = shown.progressFingerprint || null;
      if (!owner(state)) shown = { ...shown, ok: false, message: "暂未获取当前账号，请重新登录后再核对。" };
      return `<div class="ad-page">${header()}<section class="ad-intro"><h2>注销完成后，无法恢复</h2><p>请先核对会员资产。重新注册将从 L1 开始，原等级与资产不恢复。</p></section>${assets(shown.snapshot)}<p class="ad-demo">注销不会中断订单、退款、售后或申诉的处理。</p>${notes()}<p class="ad-error" role="alert">${shown.ok ? "" : esc(shown.message || "暂时无法读取完整会员资产，请重试后再核对。")}</p><section class="ad-actions"><p>仅演示，不会注销真实账号。</p><button type="button" class="danger-button" data-action="account-deletion:submit" ${shown.ok ? "" : "disabled"}>模拟提交申请</button><button type="button" class="secondary" data-action="account-deletion:retry" ${shown.ok ? "hidden" : ""}>重新读取资产</button><button type="button" class="secondary" data-action="account-deletion:back">取消，返回账号与安全</button></section></div>`;
    }
    function error(message, retryable = true) {
      const modal = modalRoot.querySelector(".ad-confirm-modal");
      const node = modal?.querySelector(".ad-confirm-error") || screen.querySelector(".ad-error");
      if (node) node.textContent = message;
      if (!modal) {
        const review = document.querySelector(".ad-review-error");
        if (review) review.textContent = message;
        if (node && (screen.contains(document.activeElement) || !review)) {
          node.setAttribute("tabindex", "-1");
          node.focus({ preventScroll: true });
          node.scrollIntoView({ block: "nearest" });
        }
      }
      const confirm = modal?.querySelector('[data-action^="account-deletion:confirm:"]');
      if (confirm) { confirm.disabled = !retryable; confirm.textContent = retryable ? "重试模拟提交" : "模拟提交申请"; }
      if (!retryable && intent) intent.blocked = true;
    }
    function checkSession() {
      const stored = readSession();
      if (!stored.ok) { error(state.accountDeletionStatus === "submitted" ? "暂时无法核对本机登录状态，演示记录仍保留。请重试。" : "暂时无法核对本机登录状态，尚未记录申请。请重试。"); return false; }
      if (stored.value.signedIn !== true || stored.value.authVerified !== true || owner(stored.value) !== owner(state) || session(stored.value) !== session(state)) {
        error("登录状态已在其他页面更新，请刷新后重新核对。", false); return false;
      }
      if (hasUnmergedChanges(stored.value)) {
        error("本机记录已在其他页面更新。为保留最新内容，请刷新后重新核对。", false); return false;
      }
      return true;
    }
    function open() {
      if (!eligible() || saving || !shown?.ok) return;
      if (!checkSession()) return;
      const latest = readAssets();
      if (!latest.ok) { error(latest.message || "暂时无法读取会员资产，尚未记录申请。请重试。"); return; }
      if (latest.fingerprint !== shown.fingerprint || latest.progressFingerprint !== departureFingerprint) { error("记录已在其他页面更新，请刷新后重新核对。", false); return; }
      intent = { id: crypto.randomUUID(), owner: owner(state), session: session(state), fingerprint: latest.fingerprint, snapshot: latest.snapshot };
      modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal ad-modal ad-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="account-deletion-title" data-deletion-token="${intent.id}"><h2 id="account-deletion-title">模拟提交注销申请？</h2><div class="ad-confirm-body"><p>真实注销完成后，原等级与资产无法恢复。请确认已经核对当前会员资产与注销说明。</p><p>本次只在本机记录演示申请，不会注销真实账号、删除资料或扣除资产。</p></div><p class="ad-modal-error ad-confirm-error" role="alert"></p><div class="ad-modal-actions"><button type="button" class="primary" data-action="account-deletion:cancel">取消，继续核对</button><button type="button" class="secondary" data-action="account-deletion:confirm:${intent.id}">模拟提交申请</button></div></section></div>`;
    }
    function confirm(id) {
      const modal = modalRoot.querySelector(".ad-confirm-modal");
      if (saving || !eligible() || !intent || intent.blocked || id !== intent.id || modal?.dataset.deletionToken !== id) return;
      if (intent.owner !== owner(state) || intent.session !== session(state)) { error("登录状态已变化，请刷新后重新核对。", false); return; }
      if (!checkSession()) return;
      const latest = readAssets();
      if (!latest.ok) { error(latest.message || "暂时无法读取会员资产，尚未记录申请。请重试。"); return; }
      if (latest.fingerprint !== intent.fingerprint || latest.progressFingerprint !== departureFingerprint) { error("记录已在其他页面更新，请刷新后重新核对。", false); return; }
      saving = true;
      const request = { ownerAccount: intent.owner, simulated: true, recordedAt: new Date().toISOString(), assetSnapshot: intent.snapshot };
      const ok = write({ accountDeletionStatus: "submitted", accountDeletionRequest: request });
      saving = false;
      if (!ok) { error("这次没能保存演示申请。账号与资产没有改变，请重试。"); return; }
      intent = null;
      track("account_deletion_submitted", { source_page: "ACC-03", simulated: true });
      closeModal(); render();
    }
    function canLeave() {
      if (state.current !== "ACC-03") return true;
      if (!checkSession()) return false;
      const latest = readAssets();
      const status = state.accountDeletionStatus === "submitted" ? "演示记录仍保留" : "尚未记录申请";
      if (!latest.progressFingerprint) { error(`暂时无法核对会员资产，${status}。为保留原有资产，请刷新后再操作。`, false); return false; }
      if (!departureFingerprint || latest.progressFingerprint !== departureFingerprint) { error(`记录已在其他页面更新，${status}。为保留最新内容，请刷新后再操作。`, false); return false; }
      return true;
    }
    function back() {
      if (state.current !== "ACC-03") return false;
      if (!canLeave()) return true;
      intent = null; closeModal(); go("ACC-02", false); return true;
    }
    function retry() {
      if (!eligible() || !checkSession()) return;
      // Repaint only this page after a safe read; never persist stale account state on an error.
      screen.innerHTML = page();
    }
    function afterRender() {
      if (state.current !== "ACC-03") { departureFingerprint = null; shown = null; }
      if (state.current === "ACC-03" && state.accountDeletionStatus === "submitted") {
        const heading = screen.querySelector(".ad-result h2");
        heading?.setAttribute("tabindex", "-1");
        heading?.focus({ preventScroll: true });
        screen.scrollTop = 0;
      }
      if (state.current !== "ACC-03" || !eligible() || intent?.owner !== owner(state) || intent?.session !== session(state)) {
        intent = null;
        if (modalRoot.querySelector(".ad-confirm-modal")) closeModal();
      }
    }
    function reviewControls() {
      if (state.current !== "ACC-03" || state.accountDeletionStatus !== "submitted") return "";
      const request = state.accountDeletionRequest;
      if (request?.ownerAccount && (request.ownerAccount !== owner(state) || request.simulated !== true)) return "";
      return `<section class="review-controls"><h3>注销演示</h3><small>仅重置本机演示进度，不撤回真实申请，不更改会员资产或资料。</small><div class="review-control-group"><button type="button" data-action="account-deletion:review-reset">${request?.ownerAccount ? "重置本次注销演示" : "重置旧版演示进度"}</button></div><p class="ad-review-error" role="alert"></p></section>`;
    }
    function resetReview() {
      if (state.current !== "ACC-03" || state.accountDeletionStatus !== "submitted" || !state.signedIn || !state.authVerified) return;
      const request = state.accountDeletionRequest;
      if (request?.ownerAccount && (request.ownerAccount !== owner(state) || request.simulated !== true)) return;
      if (!canLeave()) return;
      if (!write({ accountDeletionStatus: "ready", accountDeletionRequest: null })) {
        const node = document.querySelector(".ad-review-error");
        if (node) node.textContent = "未能保存重置，演示记录保持不变，请重试。";
        return;
      }
      intent = null; shown = null; render();
    }
    function handle(action) {
      if (state.current === "ACC-03" && ["support-handoff", "support-instructions", "account-channel-support"].includes(action) && !canLeave()) return true;
      if (action === "account-deletion-submit") { open(); return true; }
      if (action === "account-deletion-confirm" || action?.startsWith?.("account-deletion-confirm:")) return true;
      if (action === "previous" && state.current === "ACC-03") return back();
      if (typeof action !== "string" || !action.startsWith("account-deletion:")) return false;
      if (action === "account-deletion:submit") open();
      if (action === "account-deletion:cancel" && modalRoot.querySelector(".ad-confirm-modal")) { intent = null; closeModal(); }
      if (action === "account-deletion:back") back();
      if (action === "account-deletion:retry") retry();
      if (action === "account-deletion:review-reset") resetReview();
      if (action.startsWith("account-deletion:confirm:")) confirm(action.slice("account-deletion:confirm:".length));
      return true;
    }
    return { page, handle, back, afterRender, syncStatus, reviewControls, canLeave };
  };
})();
