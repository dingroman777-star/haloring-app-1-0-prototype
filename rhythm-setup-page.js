/* RHY-00: voluntary first setup; the existing settings store owns all writes. */
(() => {
  window.createHaloRhythmSetupPage = ({ state, store, screen, modalRoot, esc, today, hasPeriodRecords, go, render, flash, showModal, closeModal, track }) => {
    let message = '', writeFailed = false, intent = null, serial = 0, activeOwner = '';
    const owner = () => String(state.authPhone || state.authForm?.phone || 'legacy-session');
    const fields = { 'rh-setup-start': 'startDate', 'rh-setup-length': 'cycleLength', 'rh-setup-duration': 'duration' };
    const names = { startDate: '最近一次经期开始日', cycleLength: '周期长度', duration: '经期天数' };
    const permitted = view => view.canEdit && !view.conflict && !Object.keys(view.errors).length;
    const signature = view => JSON.stringify([owner(), view.values, view.currentValues, view.currentStatus]);
    function opened(result, view) {
      intent = null; activeOwner = owner(); writeFailed = result.code === 'storage' || !!result.error && !view.conflict && view.canEdit;
      message = result.error || (view.dirty ? '上次没填完的内容还在。' : '');
    }
    function label(view) {
      if (!view.dirty) return view.confirmed ? '返回节律' : '开始记录感受';
      if (view.values.mode === 'cycle') return '保存经期设置';
      return view.currentMode === 'cycle' ? '保存为只记录感受' : '开始记录感受';
    }
    function hint(view) {
      if (view.conflict) return '请先查看最新设置，再继续修改。';
      const missing = Object.keys(view.errors).filter(key => !view.values[key]);
      if (missing.length) return `请填写${missing.map(key => names[key]).join('、')}。`;
      if (Object.keys(view.errors).length) return '请检查标出的日期或天数。';
      if (view.currentMode === 'cycle' && view.values.mode === 'record-only') return '保存后隐藏周期预测，已有记录不会删除。';
      return view.dirty ? '保存后生效，感受记录不会改变。' : view.confirmed ? '已有设置保持不变。' : '不用填写日期。';
    }
    function body() {
      const view = store.inspect(), values = view.values;
      const header = '<header class="rh-setup-header"><button type="button" data-action="rh-setup:later" aria-label="返回节律">← 返回</button><h1>从哪一种记录开始？</h1><p>按你的需要选择，以后也能调整。</p></header>';
      if (!view.canEdit) return `<article class="rhythm-setup-page"><div class="rh-setup-scroll">${header}<section class="rh-setup-blocked"><h2>暂时不能设置</h2><p role="alert">${esc(view.error)}</p><button type="button" class="secondary" data-action="go:SET-01">查看数据与隐私</button></section></div></article>`;
      const field = (key, id, detail) => {
        const date = key === 'startDate', locked = date && hasPeriodRecords(), error = values[key] ? view.errors[key] || '' : '';
        return `<label class="rh-setup-field" for="${id}"><span>${names[key]}</span><div><input id="${id}" type="${date ? 'date' : 'number'}" ${date ? `max="${today()}"` : `inputmode="numeric" min="${key === 'cycleLength' ? 20 : 2}" max="${key === 'cycleLength' ? 45 : 10}" step="1" placeholder="${key === 'cycleLength' ? '例如 29' : '例如 5'}"`} value="${esc(values[key])}"${locked ? ' readonly aria-readonly="true"' : ''} aria-invalid="${!!error}" aria-describedby="${id}-help ${id}-error">${date ? '' : '<b aria-hidden="true">天</b>'}</div><small id="${id}-help">${locked ? '来自已保存的经期记录' : detail}</small><small class="rh-setup-error" id="${id}-error">${esc(error)}</small></label>`;
      };
      return `<article class="rhythm-setup-page${values.mode === 'cycle' ? ' is-cycle' : ''}"><div class="rh-setup-scroll">${header}<div class="rh-setup-choices" role="group" aria-label="选择记录方式">${[['record-only','只记录感受','睡眠、心情、身体感受'],['cycle','经期记录与预测','看周期日期，也能记感受']].map(([mode,title,detail]) => `<button type="button" data-action="rh-setup:mode:${mode}" aria-pressed="${values.mode === mode}"><span><strong>${values.mode === 'cycle' && mode === 'cycle' ? '经期与预测' : title}</strong><small>${detail}</small></span><i aria-hidden="true">${values.mode === mode ? '✓' : ''}</i></button>`).join('')}</div>${values.mode === 'cycle' ? `<section class="rh-setup-fields" aria-label="周期信息"><h2>填写你记得的日期</h2>${field('startDate','rh-setup-start','填写这次月经开始的第一天')}${hasPeriodRecords() ? '<button type="button" class="rh-setup-link" data-action="rh-setup:periods">查看或修改经期记录 <span aria-hidden="true">›</span></button>' : ''}<div class="rh-setup-numbers">${field('cycleLength','rh-setup-length','两次经期开始之间的天数')}${field('duration','rh-setup-duration','每次经期通常持续几天')}</div><details class="rh-setup-help"><summary>不确定天数，怎么填？</summary><p>按你以往的记录填写，不需要凑成固定天数。不确定时，可以先只记录感受。</p><p>目前支持周期 20–45 天、经期 2–10 天。这是本功能的填写范围，不是判断身体是否健康的标准。</p></details><div class="rh-setup-prediction"><span id="rh-setup-prediction-label">显示周期预测</span><button type="button" role="switch" aria-labelledby="rh-setup-prediction-label" aria-checked="${values.prediction !== false}" data-action="rh-setup:prediction"><i></i></button></div><p class="rh-setup-boundary">预计日期可能提前或推后，不能确认排卵，也不能用于避孕。</p></section>` : '<p class="rh-setup-simple">不用填写经期日期，也不需要连接设备。<br>想记什么，随时回来记。</p>'}${view.paused ? '<section class="rh-setup-paused"><strong>周期展示仍保持暂停</strong><p>本次保存不会自动恢复。需要时可到节律设置开启。</p></section>' : ''}</div><footer class="rh-setup-footer"><p class="rh-setup-feedback" role="status">${esc(message || view.error || '')}</p><button type="button" class="primary" data-action="rh-setup:save"${permitted(view) ? '' : ' disabled'}>${label(view)}</button><p class="rh-setup-hint">${esc(hint(view))}</p><div class="rh-setup-options">${view.dirty || view.conflict ? `<button type="button" class="rh-setup-discard" data-action="rh-setup:discard">${view.conflict ? '查看最新设置' : '放弃本次修改'}</button>` : ''}<button type="button" class="rh-setup-later" data-action="rh-setup:later">稍后设置</button></div></footer></article>`;
    }
    function update() {
      const view = store.inspect();
      if (state.current !== 'RHY-00') return;
      if (!view.canEdit) { render(); return; }
      for (const [id, key] of Object.entries(fields)) {
        const input = screen.querySelector('#' + id), error = screen.querySelector('#' + id + '-error'), text = view.values[key] ? view.errors[key] || '' : '';
        if (input) input.setAttribute('aria-invalid', String(!!text));
        if (error) error.textContent = text;
      }
      const button = screen.querySelector('[data-action="rh-setup:save"]');
      if (button) { button.disabled = !permitted(view); button.textContent = label(view); }
      const feedback = screen.querySelector('.rh-setup-feedback'), help = screen.querySelector('.rh-setup-hint');
      if (feedback) feedback.textContent = message || view.error || '';
      if (help) help.textContent = hint(view);
      // A draft can start with typing, without changing the selected mode.
      if ((view.dirty || view.conflict) && !screen.querySelector('.rh-setup-discard')) {
        const discard = document.createElement('button'); discard.type = 'button'; discard.className = 'rh-setup-discard'; discard.dataset.action = 'rh-setup:discard'; discard.textContent = view.conflict ? '查看最新设置' : '放弃本次修改'; screen.querySelector('.rh-setup-options')?.prepend(discard);
      }
      if (!view.dirty && !view.conflict) screen.querySelector('.rh-setup-discard')?.remove();
    }
    function result(value) { writeFailed = value.code === 'storage'; message = value.ok ? '' : value.error; }
    function leave() { go('RHY-01'); }
    function handle(action) {
      if (typeof action !== 'string' || !action.startsWith('rh-setup:')) return false;
      if (state.current !== 'RHY-00') return true;
      const view = store.inspect();
      if (action === 'rh-setup:later' || action === 'rh-setup:periods') {
        if (writeFailed && view.dirty) {
          intent = { action: 'leave', owner: owner(), token: ++serial };
          showModal('草稿还没保存到本机', '留在这里可以重试。现在离开后，请不要关闭 App，以免丢失这次输入。', '仍然离开', 'rh-setup:confirm:' + intent.token); return true;
        }
        leave(); return true;
      }
      if (!view.canEdit || activeOwner !== owner()) { render(); return true; }
      if (action === 'rh-setup:discard') {
        intent = { action: 'discard', owner: owner(), token: ++serial, base: signature(view) };
        showModal(view.conflict ? '放弃草稿，查看最新设置？' : '放弃本次修改？', '只放弃这次未保存的设置，已有日期和感受记录不会删除。', '放弃修改', 'rh-setup:confirm:' + intent.token); return true;
      }
      if (action.startsWith('rh-setup:confirm:')) {
        if (!intent || intent.owner !== owner() || action !== 'rh-setup:confirm:' + intent.token || !modalRoot.querySelector(`[data-action="${action}"]`)) return true;
        const selected = intent; intent = null; closeModal();
        if (selected.action === 'leave') { leave(); return true; }
        if (selected.base !== signature(store.inspect())) { message = '设置发生了变化，请重新核对。'; render(); return true; }
        result(store.discard()); render(); return true;
      }
      if (action === 'rh-setup:save') {
        const value = store.save(); result(value);
        if (!value.ok) { update(); return true; }
        if (!value.unchanged) track('rhythm_settings_saved', { mode: store.inspect().currentMode });
        leave(); if (!value.unchanged) flash('节律设置已保存'); return true;
      }
      let value;
      if (action.startsWith('rh-setup:mode:')) value = store.change('mode', action.slice('rh-setup:mode:'.length));
      if (action === 'rh-setup:prediction') value = store.change('prediction', !view.values.prediction);
      if (value) { result(value); render(); screen.querySelector(`[data-action="${action}"]`)?.focus({ preventScroll: true }); }
      return true;
    }
    screen.addEventListener('input', event => {
      if (state.current !== 'RHY-00' || !fields[event.target.id]) return;
      result(store.change(fields[event.target.id], event.target.value)); update();
    });
    screen.addEventListener('keydown', event => {
      if (state.current !== 'RHY-00') return;
      if (event.target.matches('input') && event.key === 'Enter') { event.preventDefault(); if (permitted(store.inspect())) handle('rh-setup:save'); return; }
      if (!event.target.matches('.rh-setup-choices button') || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
      event.preventDefault(); event.stopPropagation();
      const choices = [...screen.querySelectorAll('.rh-setup-choices button')], index = choices.indexOf(event.target);
      choices[event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1 : (index + (['ArrowLeft','ArrowUp'].includes(event.key) ? -1 : 1) + choices.length) % choices.length].focus();
    });
    window.addEventListener('beforeunload', event => { if (state.current === 'RHY-00' && writeFailed && store.inspect().dirty) { event.preventDefault(); event.returnValue = ''; } });
    return { body, handle, opened };
  };
})();
