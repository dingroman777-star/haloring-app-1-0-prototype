(function () {
  // ONB-04: local profile editing only; no SDK, health calculation or asset changes.
  window.createHaloBasicProfile = function ({ state, pages, go, write, track, esc, today, screen, modalRoot, closeModal, flash, activeHardware }) {
    const fields = ["birthday", "height", "weight"];
    const labels = { birthday: "出生日期", height: "身高", weight: "体重" };
    const account = () => String(state.authPhone || state.authForm?.phone || "");
    const allowed = () => state.signedIn && state.authVerified && state.accountDeletionStatus !== "submitted";
    const values = value => Object.fromEntries(fields.map(key => [key, String(value?.[key] ?? "")]));
    const saved = () => values(state.profileSaved ? state.profile : null);
    const route = id => pages.some(page => page.id === id) && !/^(AUTH|SYS)-/.test(id) && id !== "ONB-04";
    let restored = false, draftError = false, saveError = false, composing = false, conflictReview = "";

    function prepare() {
      const s = state.basicProfile;
      const latest = saved();
      if (s.version !== 2) {
        const legacy = s.draft && typeof s.draft === "object";
        s.draft = legacy ? values(s.draft) : { ...latest };
        s.base = { ...latest };
        // Old drafts have no base; never assume a different existing value is safe to replace.
        s.legacyConflicts = legacy ? fields.filter(key => s.draft[key].trim() && latest[key] && s.draft[key] !== latest[key]) : [];
        s.accountRef = account(); s.version = 2;
      }
      if (s.accountRef !== account()) return s;
      s.draft = values(s.draft); s.base = values(s.base);
      s.touched = s.touched && typeof s.touched === "object" ? s.touched : {};
      s.legacyConflicts = Array.isArray(s.legacyConflicts) ? s.legacyConflicts : [];
      for (const key of fields) {
        if (s.draft[key] === s.base[key] && !s.legacyConflicts.includes(key) || s.draft[key] === latest[key]) {
          s.draft[key] = latest[key]; s.base[key] = latest[key];
          s.legacyConflicts = s.legacyConflicts.filter(field => field !== key);
        }
      }
      return s;
    }
    function own() { return allowed() && prepare().accountRef === account() && (!state.personalAccountScope || state.basicProfile.recordScope === state.personalAccountScope.activeKey); }
    function draft() { return own() ? prepare().draft : values(null); }
    function hasDraft() {
      if (!own()) return false;
      const s = prepare();
      return fields.some(key => s.draft[key] !== s.base[key] || s.legacyConflicts.includes(key));
    }
    function errors() {
      const d = draft();
      const date = /^\d{4}-\d{2}-\d{2}$/.test(d.birthday) ? new Date(`${d.birthday}T12:00:00Z`) : null;
      const validDate = date && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === d.birthday && d.birthday <= today();
      const numberError = (key, min, max, unit, example) => {
        const raw = d[key].trim();
        if (!raw) return "";
        if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw) || !Number.isFinite(Number(raw))) return `请填写数字，例如 ${example}`;
        return Number(raw) < min || Number(raw) > max ? `请填写 ${min}–${max} ${unit} 范围内的${labels[key]}` : "";
      };
      return { birthday: d.birthday && !validDate ? "请核对出生日期，不能晚于今天" : "", height: numberError("height", 100, 230, "cm", "168"), weight: numberError("weight", 25, 250, "kg", "56.5") };
    }
    function age() {
      const d = draft(); if (!d.birthday || errors().birthday) return "";
      const day = today();
      return `${Number(day.slice(0, 4)) - Number(d.birthday.slice(0, 4)) - (day.slice(5) < d.birthday.slice(5) ? 1 : 0)} 岁`;
    }
    function persistDraft() {
      draftError = !write({ basicProfile: { ...prepare() } });
      return !draftError;
    }
    function enter(target, from) {
      if (from === "ONB-04" && target !== from) {
        capture();
        if (!/^(AUTH|SYS)-/.test(target) && own() && state.basicProfile.status === "pending") state.basicProfile.status = "skipped";
      }
      if (target === "ONB-04" && from !== target && route(from) && own()) {
        state.basicProfile.returnRoute = from;
        state.basicProfile.afterRoute = from === "DEV-05" ? activeHardware() ? "ONB-02" : "TOD-01" : from;
      }
      if (target !== "ONB-04") { saveError = false; composing = false; conflictReview = ""; }
    }
    function capture() {
      if (state.current === "ONB-04" && screen.dataset.page === "ONB-04" && own()) state.basicProfile.scrollTop = screen.querySelector(".basic-profile-scroll")?.scrollTop || 0;
    }
    function notice() {
      if (!own()) return "请重新登录后再填写。";
      if (saveError) return "暂时无法保存，请重试。填写内容仍保留在本页。";
      if (draftError) return "草稿暂未保存，退出可能丢失。";
      return restored && hasDraft() ? "已恢复上次未保存的内容" : "";
    }
    function update() {
      if (state.current !== "ONB-04" || !screen.querySelector("#basic-profile-form")) return;
      const s = prepare(), e = errors();
      for (const key of fields) {
        const input = screen.querySelector(`#basic-profile-${key}`);
        const error = s.touched[key] ? e[key] : "";
        input.disabled = !own(); input.setAttribute("aria-invalid", String(Boolean(error))); input.dataset.empty = String(!input.value);
        input.closest(".basic-profile-control").classList.toggle("invalid", Boolean(error));
        screen.querySelector(`#basic-profile-error-${key}`).textContent = error;
      }
      screen.querySelector("#basic-profile-age").textContent = age();
      screen.querySelector(".basic-date-placeholder").hidden = Boolean(draft().birthday);
      const button = screen.querySelector("#basic-profile-submit");
      const hasInput = fields.some(key => draft()[key].trim());
      button.disabled = !own() || !hasInput;
      button.textContent = saveError ? "重试保存" : hasInput ? "保存并继续" : "填写后保存";
      const hint = screen.querySelector("#basic-profile-status");
      hint.textContent = notice(); hint.hidden = !hint.textContent;
      hint.classList.toggle("save-error", saveError || draftError);
    }
    function page() {
      const d = draft();
      const field = (key, type, unit = "") => `<div class="basic-profile-field"><div class="basic-profile-label"><label for="basic-profile-${key}">${labels[key]}</label>${key === "birthday" ? '<span id="basic-profile-age" aria-live="polite"></span>' : ""}</div><div class="basic-profile-control"><input id="basic-profile-${key}" type="${type}" ${key === "birthday" ? `max="${today()}" autocomplete="bday"` : `inputmode="decimal" placeholder="填写${labels[key]}"`} value="${esc(d[key])}" data-empty="${!d[key]}" aria-describedby="basic-profile-error-${key}">${key === "birthday" ? `<span class="basic-date-placeholder" aria-hidden="true"${d[key] ? " hidden" : ""}>请选择出生日期</span>` : `<span class="basic-profile-unit">${unit}</span>`}</div><p class="basic-profile-error" id="basic-profile-error-${key}" aria-live="polite"></p></div>`;
      return `<section class="basic-profile-page" aria-labelledby="basic-profile-title"><button type="button" class="device-guide-back" data-action="basic-profile:back" aria-label="返回"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5-7 7 7 7"/></svg></button><form id="basic-profile-form" novalidate><div class="basic-profile-scroll"><header class="basic-profile-header"><h1 id="basic-profile-title">基础信息</h1><p>选填，之后可在“我的”中修改。</p></header><div class="basic-profile-fields">${field("birthday", "date")}${field("height", "text", "cm")}${field("weight", "text", "kg")}</div></div><footer class="basic-profile-actions"><p id="basic-profile-status" role="status" aria-live="polite" hidden></p><button id="basic-profile-submit" type="submit" class="primary">保存并继续</button><button type="button" class="connect-intro-skip" data-action="basic-profile-later">稍后填写</button></footer></form></section>`;
    }
    function mount(samePage) {
      if (state.current !== "ONB-04") return;
      if (!samePage) restored = hasDraft();
      update();
      const scroll = screen.querySelector(".basic-profile-scroll");
      scroll.scrollTop = Math.max(0, Number(prepare().scrollTop) || 0);
      scroll.addEventListener("scroll", () => { capture(); persistDraft(); }, { passive: true });
    }
    function input(event) {
      if (state.current !== "ONB-04" || !own()) return;
      const key = event.target.id.slice(14);
      if (!fields.includes(key)) return;
      draft()[key] = event.target.value;
      restored = false; saveError = false; conflictReview = "";
      persistDraft(); update();
    }
    function blur(event) {
      if (state.current !== "ONB-04" || !own()) return;
      const key = event.target.id.slice(14);
      if (!fields.includes(key)) return;
      prepare().touched[key] = true; persistDraft(); update();
    }
    function changes() {
      const d = draft(), latest = saved();
      // Empty fields omit updates; clearing existing profile data belongs in ACC-01.
      return Object.fromEntries(fields.filter(key => d[key].trim() && d[key].trim() !== latest[key]).map(key => [key, d[key].trim()]));
    }
    function signature() { return JSON.stringify([draft(), saved(), prepare().base, account()]); }
    function save(confirm = false) {
      if (state.current !== "ONB-04" || !own() || composing) return;
      const s = prepare(), e = errors();
      const invalid = fields.find(key => e[key]);
      if (invalid || !fields.some(key => draft()[key].trim())) {
        s.touched = Object.fromEntries(fields.map(key => [key, true])); update();
        screen.querySelector(`#basic-profile-${invalid || "birthday"}`)?.focus(); return;
      }
      const updates = changes(), latest = saved();
      if (confirm && (!conflictReview || conflictReview !== signature())) {
        conflictReview = ""; closeModal(); saveError = false; update();
        flash("资料有更新，请重新检查并保存"); return;
      }
      const conflicts = Object.keys(updates).filter(key => s.legacyConflicts.includes(key) || latest[key] !== s.base[key]);
      if (conflicts.length && !confirm) {
        conflictReview = signature();
        modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal basic-profile-conflict" role="dialog" aria-modal="true" aria-labelledby="basic-conflict-title"><h2 id="basic-conflict-title">这些信息已有更新</h2><p>要用这次填写的内容替换吗？</p><dl>${conflicts.map(key => `<div><dt>${labels[key]}</dt><dd>已保存：${esc(latest[key] || "未填写")}<br>这次填写：${esc(updates[key])}${key === "birthday" ? "" : key === "height" ? " cm" : " kg"}</dd></div>`).join("")}</dl><button class="primary" data-action="basic-profile:confirm-conflicts">使用这次填写并保存</button><button class="text-button" data-action="close-modal">继续编辑</button></section></div>`;
        return;
      }
      const profile = { ...state.profile, ...updates };
      const next = { ...s, status: "completed", draft: values(profile), base: values(profile), touched: {}, legacyConflicts: [], savedAt: new Date().toISOString(), scrollTop: 0 };
      if (!write({ profile, profileSaved: true, basicProfile: next })) {
        saveError = true; closeModal(); update(); return;
      }
      saveError = false; draftError = false; restored = false; conflictReview = "";
      track("profile_saved", { source_page: "ONB-04", fields: Object.keys(updates) });
      closeModal(); go(route(s.afterRoute) ? s.afterRoute : activeHardware() ? "ONB-02" : "TOD-01"); flash("基础信息已保存");
    }
    function leave(back, confirmed = false) {
      if (state.current !== "ONB-04") return;
      if (!own()) { go(allowed() ? back ? "DEV-10" : "TOD-01" : "AUTH-01", false); return; }
      const s = prepare();
      const next = { ...s, status: s.status === "completed" ? "completed" : "skipped" };
      if (!write({ basicProfile: next })) {
        draftError = true; update();
        if (!confirmed) {
          modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal info-modal basic-profile-conflict" role="dialog" aria-modal="true" aria-labelledby="basic-leave-title"><h2 id="basic-leave-title">草稿还未保存</h2><p>现在离开，重新打开时可能需要重新填写。</p><button class="primary" data-action="close-modal">留在这里</button><button class="text-button" data-action="basic-profile:leave-unsaved:${back ? "back" : "later"}">仍然离开</button></section></div>`;
          return;
        }
        // Explicitly leaving keeps the in-memory draft, without promising durable storage.
        state.basicProfile = next;
      }
      const target = back ? route(s.returnRoute) ? s.returnRoute : "DEV-10" : route(s.afterRoute) ? s.afterRoute : activeHardware() ? "ONB-02" : "TOD-01";
      closeModal(); go(target, false);
      if (!back) track("basic_profile_skipped", { source_page: "ONB-04" });
    }
    function resumeEntry() {
      return hasDraft() ? '<button type="button" class="basic-profile-resume" data-action="basic-profile:resume"><span><strong>继续填写基础信息</strong><small>有上次未保存的内容</small></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button>' : "";
    }
    function handle(action) {
      if (action === "basic-profile-save") { save(); return true; }
      if (action === "basic-profile-later") { leave(false); return true; }
      if (action === "basic-profile:back") { leave(true); return true; }
      if (action === "basic-profile:leave-unsaved:back" || action === "basic-profile:leave-unsaved:later") {
        if (modalRoot.querySelector("#basic-leave-title")) leave(action.endsWith(":back"), true);
        return true;
      }
      if (action === "basic-profile:confirm-conflicts") { save(true); return true; }
      if (action === "basic-profile:resume") { if (state.current === "ACC-01" && hasDraft()) go("ONB-04"); return true; }
      return false;
    }
    const revealFocusedField = () => requestAnimationFrame(() => {
      const focused = document.activeElement;
      if (state.current === "ONB-04" && !modalRoot.querySelector(".modal") && focused?.matches("#basic-profile-form input") && (window.visualViewport?.scale || 1) <= 1) focused.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
    window.visualViewport?.addEventListener("resize", revealFocusedField);
    window.addEventListener("resize", revealFocusedField);
    return { draft, page, enter, capture, mount, input, blur, handle, resumeEntry, hasDraft, update, composition: value => { composing = value; }, isComposing: () => composing };
  };
})();
