/* RHY-03 keeps the user's words separate from optional feeling shortcuts. */
(() => {
  const choices = [
    ["睡得少", '<path d="M16 4a8 8 0 1 0 4 12A8 8 0 0 1 16 4Z"/>'],
    ["情绪敏感", '<path d="M12 20s-8-5-8-11a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 6-8 11-8 11Z"/>'],
    ["身体轻松", '<path d="M5 19C4 9 9 5 20 4c-1 11-5 16-15 15Zm0 0L15 9"/>'],
    ["有精神", '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>']
  ];
  const icon = paths => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  function hint(view) {
    if (view.conflict) return "先查看最新记录，再决定如何修改。";
    if (!view.hasContent) return "选一个感受，或写点什么，就可以保存。";
    if (!view.dirty && view.record) return "还没有修改。";
    return "保存后回到这一天的日历。";
  }
  window.createHaloRhythmEditor = ({ screen, esc, today }) => {
    function body(view, problem = "", draftStatus = "") {
      view = { ...view, feeling: view.safeFeeling, note: view.safeNote };
      const validDate = /^\d{4}-\d{2}-\d{2}$/.test(view.date || "");
      const dateLabel = validDate ? `${Number(view.date.slice(0, 4))}年${Number(view.date.slice(5, 7))}月${Number(view.date.slice(8))}日${view.date === today() ? " · 今天" : ""}` : "所选日期";
      const title = view.record ? "修改感受记录" : "记下感受";
      const header = `<header class="rh-editor-header"><button type="button" class="back" data-action="previous">← 返回</button><h1>${title}</h1><div><time${validDate ? ` datetime="${esc(view.date)}"` : ""}>${esc(dateLabel)}</time><span>用户记录</span></div></header>`;
      if (!view.canEdit && !view.conflict) return `<article class="rhythm-editor-page"><div class="rh-editor-scroll">${header}<section class="rh-editor-blocked"><h2>暂时无法编辑这一天</h2><p role="alert">${esc(view.error || problem || "请回到日历重新选择日期。")}</p><button type="button" class="primary" data-action="go:RHY-01">回到感受日历</button></section></div></article>`;
      return `<article class="rhythm-editor-page"><div class="rh-editor-scroll">${header}<fieldset class="rh-editor-feelings"${view.conflict ? " disabled" : ""}><legend>${view.date === today() ? "今天感觉怎么样？" : "那天感觉怎么样？"}</legend><p>选一项，或直接写下来。</p><div>${choices.map(([label, paths]) => `<button type="button" data-action="rhythm-feeling:${label}" aria-pressed="${view.feeling === label}" aria-label="${label}${view.feeling === label ? "，已选，再点取消" : ""}"${view.conflict ? " disabled" : ""}>${icon(paths)}<span>${label}</span><i aria-hidden="true">${view.feeling === label ? "✓" : ""}</i></button>`).join("")}</div></fieldset><section class="rh-editor-writing"><div class="rh-editor-writing-heading"><label for="rhythm-note">想记下的话</label><span id="rh-editor-count">${String(view.note || "").length} / 500</span></div><textarea id="rhythm-note" maxlength="500" rows="4" aria-describedby="rh-editor-count" placeholder="比如：昨晚睡得晚，今天下午有点困。"${view.conflict ? " readonly" : ""}>${esc(view.note || "")}</textarea></section>${view.record && view.canDelete ? `<div class="rh-editor-delete"><button type="button" data-action="rhythm-delete:${esc(view.date)}">删除这一天的记录</button></div>` : ""}</div><footer class="rh-editor-footer"><p class="rhythm-editor-feedback" role="alert">${esc(problem || view.error)}</p><button type="button" class="rh-editor-latest" data-action="rhythm-editor-latest"${view.conflict ? "" : " hidden"}>查看最新记录</button><button type="button" class="primary" data-action="rhythm-feeling-save"${view.canSave ? "" : " disabled"}>${view.record ? "保存修改" : "保存记录"}</button><p id="rh-editor-save-hint" role="status">${esc(draftStatus || hint(view))}</p></footer></article>`;
    }
    function update(view, problem = "", draftStatus = "") {
      view = { ...view, feeling: view.safeFeeling, note: view.safeNote };
      if (screen.dataset.page !== "RHY-03") return;
      const error = screen.querySelector(".rhythm-editor-feedback"), button = screen.querySelector('[data-action="rhythm-feeling-save"]');
      if (error) error.textContent = problem || view.error;
      if (button) button.disabled = !view.canSave;
      const count = screen.querySelector("#rh-editor-count"), saveHint = screen.querySelector("#rh-editor-save-hint");
      if (count) count.textContent = `${String(view.note || "").length} / 500`;
      if (saveHint) saveHint.textContent = draftStatus || hint(view);
      const fieldset = screen.querySelector("fieldset"), note = screen.querySelector("#rhythm-note"), latest = screen.querySelector('[data-action="rhythm-editor-latest"]');
      if (fieldset) fieldset.disabled = !view.canEdit || view.conflict;
      if (note) note.readOnly = !view.canEdit || view.conflict;
      if (latest) latest.hidden = !view.conflict;
      for (const choice of screen.querySelectorAll('[data-action^="rhythm-feeling:"]')) {
        const label = choice.dataset.action.slice(15), selected = view.feeling === label;
        choice.disabled = !view.canEdit || view.conflict;
        choice.setAttribute("aria-pressed", String(selected)); choice.setAttribute("aria-label", label + (selected ? "，已选，再点取消" : ""));
        choice.querySelector("i").textContent = selected ? "✓" : "";
      }
    }
    screen.addEventListener("keydown", event => {
      if (screen.dataset.page !== "RHY-03" || !event.target.matches('[data-action^="rhythm-feeling:"]')) return;
      const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -2, ArrowDown: 2 }[event.key];
      if (!step) return;
      event.preventDefault(); event.stopPropagation();
      const buttons = [...screen.querySelectorAll('[data-action^="rhythm-feeling:"]:not(:disabled)')], index = buttons.indexOf(event.target);
      if (buttons.length && index >= 0) buttons[(index + step + buttons.length) % buttons.length].focus();
    });
    return { body, update };
  };
})();
