(() => {
  "use strict";
  window.createHaloStudioContact = function ({ state, events, event, media, read, write, render, go, esc, icon }) {
    const fields = { contactConsent: { title: "本次服务消息", detail: "接收这次活动的服务沟通，由 Halo 转发。" }, marketingConsent: { title: "后续活动推荐", detail: "接收本次主办方的后续活动介绍，由 Halo 转发。" } };
    const account = p => String(p.authPhone || p.authForm?.phone || "local-demo");
    const id = () => state.selectedStudioEventId;
    const record = () => state.studioRecords?.[id()];
    const scope = r => JSON.stringify([account(state), id(), r?.bookingId]);
    let fresh = true, busy = "", feedback = "", failure = false, shown = null, previousKey = "";
    function owned(r = record()) {
      const pref = r?.contactPreferences;
      return fresh && state.signedIn && state.authVerified && state.accountDeletionStatus !== "submitted" && Object.hasOwn(events, id()) && r?.booked === true && typeof r.bookingId === "string" && Boolean(r.bookingId.trim())
        && (!r.eventId || r.eventId === id()) && (!r.eventSnapshot?.id || r.eventSnapshot.id === id()) && (!r.eventSnapshot?.eventId || r.eventSnapshot.eventId === id())
        && (!r.accountRef || r.accountRef === account(state)) && (!r.sessionAccountRef || r.sessionAccountRef === account(state))
        && (!r.sessionScope || r.sessionScope.eventId === id() && r.sessionScope.bookingId === r.bookingId)
        && (!pref || pref.version === 1 && pref.accountRef === account(state) && pref.eventId === id() && pref.bookingId === r.bookingId);
    }
    function prepare() {
      if (state.current !== "STU-14") return true;
      const result = read(), p = result?.progress;
      fresh = Boolean(result?.ok && p?.studioRecords && typeof p.studioRecords === "object" && !Array.isArray(p.studioRecords)
        && account(p) === account(state) && p.signedIn === state.signedIn && p.authVerified === state.authVerified && p.accountDeletionStatus !== "submitted");
      if (fresh) state.studioRecords = { ...p.studioRecords };
      return fresh;
    }
    function key() { const r = record(); return JSON.stringify([fresh, owned(), scope(r), r?.contactConsent, r?.marketingConsent, r?.deletionStatus, r?.contactPreferences]); }
    function page() {
      const r = record(), valid = owned(), e = valid ? event(id()) : null;
      shown = valid ? { scope: scope(r), contactConsent: r.contactConsent === true, marketingConsent: r.marketingConsent === true } : null;
      previousKey = key();
      const controls = Object.entries(fields).map(([name, f]) => {
        const enabled = r?.[name] === true, disabled = Boolean(busy) || r?.deletionStatus === "deleted" && !enabled;
        return `<section class="studio-contact-choice"><div><h2 id="stuc-${name}-title">${f.title}</h2><p id="stuc-${name}-description">${f.detail}</p><span class="studio-contact-value">${busy === name ? "正在保存…" : enabled ? "已开启" : "已关闭"}</span></div><button type="button" id="stuc-${name}" role="switch" aria-checked="${enabled}" aria-labelledby="stuc-${name}-title" aria-describedby="stuc-${name}-description" data-action="stuc-set:${name}" ${disabled ? "disabled" : ""}><span></span></button></section>`;
      }).join("");
      return `<article class="studio-contact studio-detail" aria-busy="${Boolean(busy)}"><div class="studio-detail-scroll" tabindex="0" aria-label="本次联系设置"><header class="studio-detail-header"><button data-action="stuc-back" aria-label="返回本次体验">${icon("back")}</button><h1>联系设置</h1><span></span></header>
        ${e ? `<div class="studio-booking-event studio-contact-event">${media(id()) ? `<img src="${media(id())}" width="56" height="56" alt="${esc(e.category)}场地示意图">` : ""}<div><h2>${esc(e.title)}</h2><p>${esc(e.date)} · ${esc(e.place)}</p></div></div><p class="studio-contact-intro">这次活动的消息，由你决定。</p>${controls}<p class="studio-contact-note">两项独立选择。关闭后，不影响本次体验、报告和已获奖励。</p>${r.deletionStatus === "deleted" ? '<p class="studio-contact-note">本次个人记录已删除，不再开启新的联系授权。</p>' : ""}<details class="studio-contact-privacy"><summary>联系方式如何受到保护</summary><p>消息由 Halo 转发，主办方不会因此获得你的手机号、微信号或个人身体报告。</p><p>这里的选择只关联本次活动，不会自动沿用到其他活动。关闭后不再允许发送对应消息，已发送的消息不会被撤回。</p></details>`
          : `<section class="studio-contact-empty"><h2>${fresh ? "请先核对本次活动" : "暂时读不到联系设置"}</h2><p>没有更改你的选择，也不会自动开启消息。</p><button class="secondary" data-action="stuc-reload">重新读取</button></section>`}
        </div><footer class="studio-detail-footer"><p id="stuc-feedback" class="studio-contact-feedback ${failure ? "is-error" : ""}" role="status" aria-live="polite">${esc(feedback)}</p><button class="secondary" data-action="stuc-help">联系 Halo 客服</button><button class="primary" data-action="stuc-back">返回本次体验</button></footer></article>`;
    }
    async function change(field) {
      if (busy || state.current !== "STU-14" || !fields[field] || !shown) return;
      const before = { ...shown }, target = !before[field];
      busy = field; feedback = ""; failure = false; render();
      const apply = () => {
        if (state.current !== "STU-14" || !prepare() || !owned() || scope(record()) !== before.scope || (record()[field] === true) !== before[field]) {
          feedback = "设置有更新，请核对当前选择后再操作。"; failure = true; return;
        }
        if (record().deletionStatus === "deleted" && target) { feedback = "本次个人记录已删除，未开启消息。"; failure = true; return; }
        const changes = { [field]: target, contactPreferences: { version: 1, accountRef: account(state), eventId: id(), bookingId: record().bookingId,
          updatedAt: new Date().toISOString(), lastChanged: field, localOnly: true } };
        if (!write(id(), changes, before, field)) { feedback = "未能保存，仍保留原来的选择。请再试一次。"; failure = true; return; }
        feedback = `${fields[field].title}已${target ? "开启" : "关闭"}，已保存到本机。`;
      };
      const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 6000);
      try {
        if (!navigator.locks?.request) { feedback = "暂时无法安全保存，请重新打开原型后再试。"; failure = true; }
        else await navigator.locks.request("halo-studio-session-start", { mode: "exclusive", signal: controller.signal }, apply);
      } catch { feedback = "保存未完成，请再试一次。"; failure = true; }
      finally { clearTimeout(timer); busy = ""; if (state.current === "STU-14") render(); }
    }
    function handle(action) {
      const legacy = { "toggle:studioContact": "contactConsent", "toggle:studioMarketing": "marketingConsent" };
      if (legacy[action]) { change(legacy[action]); return true; }
      if (!action.startsWith("stuc-")) return false;
      if (state.current !== "STU-14") return true;
      if (action.startsWith("stuc-set:")) { change(action.slice(9)); return true; }
      if (action === "stuc-reload") { feedback = ""; prepare(); render(); return true; }
      if (action === "stuc-help") { go("HELP-03"); return true; }
      if (action === "stuc-back") { if (busy) return true; prepare(); go(owned() ? "STU-15" : "STU-08"); return true; }
      return true;
    }
    function refresh() {
      if (document.hidden || busy || state.current !== "STU-14") return;
      prepare();
      if (previousKey !== key()) { feedback = fresh && owned() ? "已更新为本机最新设置。" : ""; failure = false; render(); }
    }
    setInterval(refresh, 700); window.addEventListener("storage", refresh); document.addEventListener("visibilitychange", refresh);
    return { prepare, page, handle, blocksPersist: () => state.current === "STU-14" && !fresh };
  };
})();
