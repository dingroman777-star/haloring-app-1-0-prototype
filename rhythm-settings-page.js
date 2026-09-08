(() => {
  window.createHaloRhythmSettingsPage = ({ state, screen, esc, today, hasPeriodRecords = () => false }) => {
    const fieldNames = { startDate: "最近一次月经开始日期", cycleLength: "两次开始之间的天数", duration: "每次通常持续几天" };
    const ids = { startDate: "rhythm-start-date", cycleLength: "rhythm-cycle-length", duration: "rhythm-duration" };
    function hint(view) {
      if (view.conflict) return "设置已更新，请先核对最新内容。";
      if (view.values.mode === "cycle" && Object.keys(view.errors || {}).length) return "请补全有效的周期日期与天数。";
      return view.dirty ? "点击保存，让这次修改生效。" : "当前没有未保存的修改。";
    }
    function cycleOptions(values) {
      return `<section class="rh-settings-reminder"><div><h2 id="rh-prediction-label">周期预测</h2><p>显示预计经期、排卵日与易孕期，不改变实际记录</p></div><button type="button" role="switch" aria-labelledby="rh-prediction-label" aria-checked="${values.prediction!==false}" data-action="rh-settings:prediction"><i></i></button></section><section class="rh-settings-reminder"><div><h2 id="rh-period-notice-label">经期临近提醒</h2><p>${values.prediction===false?'开启经期预测后可设置':state.toggles.notification?'预计开始前两天提醒我':'保存偏好后，还需开启通知权限'}</p></div><button type="button" role="switch" aria-labelledby="rh-period-notice-label" aria-checked="${!!values.periodNotice}" data-action="rh-settings:period-notice"${values.prediction===false?' disabled':''}><i></i></button></section>`;
    }
    function body(view, feedback = "") {
      const head = '<header class="rh-settings-header"><button type="button" data-action="previous">← 返回</button><h1>节律设置</h1></header>';
      if (!view.canEdit) return `<article class="rhythm-settings-page"><div class="rh-settings-scroll">${head}<section class="rh-settings-blocked"><h2>设置暂不可用</h2><p role="alert">${esc(view.error || "请重新登录后再查看。")}</p><button type="button" class="primary" data-action="go:SET-01">查看数据与隐私</button><button type="button" class="secondary" data-action="previous">返回</button></section></div></article>`;
      const values = view.values;
      const field = (key, example) => `<label class="rh-settings-field"><span>${fieldNames[key]}</span><input id="${ids[key]}" type="${key === "startDate" ? "date" : "number"}"${key === "startDate" ? ` max="${today()}"` : ` inputmode="numeric" min="${key === "cycleLength" ? 20 : 2}" max="${key === "cycleLength" ? 45 : 10}" step="1" placeholder="${example}"`} value="${esc(values[key] || "")}"${key==="startDate"&&hasPeriodRecords()?' readonly aria-label="最近一次经期开始，来自已保存记录"':""} aria-describedby="rh-settings-${key}-error"><small id="rh-settings-${key}-error" class="rh-settings-field-error">${values[key] ? esc(view.errors?.[key] || "") : ""}</small></label>`;
      return `<article class="rhythm-settings-page"><div class="rh-settings-scroll">${head}<section class="rh-settings-mode" aria-labelledby="rh-settings-mode-title"><h2 id="rh-settings-mode-title">想记录哪些内容？</h2><div role="group" aria-label="记录方式">${[["record-only", "只记录感受", "不用填写周期日期"], ["cycle", "经期记录与预测", "查看预计经期，也保留感受记录"]].map(([mode, title, detail]) => `<button type="button" data-action="rh-settings:mode:${mode}" aria-pressed="${values.mode === mode}"><span><strong>${title}</strong><small>${detail}</small></span><i aria-hidden="true">${values.mode === mode ? "✓" : ""}</i></button>`).join("")}</div></section>${values.mode === "cycle" ? `<section class="rh-settings-cycle"><h2>你自己的周期日期</h2><p>按你记得的填写，不确定时也可以先只记录感受。</p>${field("startDate") }${hasPeriodRecords()?'<button type="button" class="rh-settings-link" data-action="rh-settings:periods">到经期记录修改日期 <span>›</span></button>':""}<div class="rh-settings-number-fields">${field("cycleLength", "例如 29")}${field("duration", "例如 5")}</div></section>` : '<p class="rh-settings-preserve">切换记录方式，不会删除已有感受和已保存的周期日期。</p>'}${values.mode==="cycle"?cycleOptions(values):""}${view.paused ? '<section class="rh-settings-paused"><strong>周期展示已暂停</strong><p>修改参数不会自动恢复展示。</p><button type="button" data-action="rh-settings:resume">恢复周期展示</button></section>' : ""}<section class="rh-settings-reminder"><div><h2 id="rh-settings-notice-label">提醒我记录</h2><p>${state.toggles.notification ? "开启后，提醒你记下感受" : "开启通知权限后，才能收到提醒"}</p></div><button type="button" role="switch" aria-labelledby="rh-settings-notice-label" aria-checked="${!!values.notice}" data-action="rh-settings:notice"><i></i></button></section>${!state.toggles.notification ? '<button type="button" class="rh-settings-link" data-action="rh-settings:permissions">查看通知权限 <span aria-hidden="true">›</span></button>' : ""}<button type="button" class="rh-settings-link" data-action="rh-settings:manage">管理记录 <span aria-hidden="true">›</span></button><p class="rh-settings-note">预计日期可能提前或推后，不能确认排卵，也不能用于避孕。</p></div><footer class="rh-settings-footer"><p class="rh-settings-feedback" role="status">${esc(feedback || view.error || "")}</p><button type="button" class="rh-settings-discard" data-action="rh-settings:discard"${view.dirty || view.conflict ? "" : " hidden"}>${view.conflict ? "查看最新设置" : "放弃本次修改"}</button><button type="button" class="primary" data-action="rh-settings:save"${view.canSave ? "" : " disabled"}>保存设置</button><p class="rh-settings-hint">${esc(hint(view))}</p></footer></article>`;
    }
    function update(view, feedback = "") {
      if (screen.dataset.page !== "RHY-04") return;
      for (const key of Object.keys(ids)) {
        const input = screen.querySelector(`#${ids[key]}`), error = screen.querySelector(`#rh-settings-${key}-error`);
        const text = view.values[key] ? view.errors?.[key] || "" : "";
        if (input) input.setAttribute("aria-invalid", String(!!text));
        if (error) error.textContent = text;
      }
      const save = screen.querySelector('[data-action="rh-settings:save"]'), discard = screen.querySelector('[data-action="rh-settings:discard"]');
      if (save) save.disabled = !view.canSave;
      if (discard) { discard.hidden = !view.dirty && !view.conflict; discard.textContent = view.conflict ? "查看最新设置" : "放弃本次修改"; }
      const message = screen.querySelector(".rh-settings-feedback"), help = screen.querySelector(".rh-settings-hint");
      if (message) message.textContent = feedback || view.error || "";
      if (help) help.textContent = hint(view);
    }
    return { body, update, fieldKeys: Object.fromEntries(Object.entries(ids).map(([key, id]) => [id, key])) };
  };
})();
