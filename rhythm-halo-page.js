(() => {
  window.createHaloRhythmHaloPage = ({ esc }) => {
    const dateLabel = date => /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? `${date.slice(0, 4)}年${Number(date.slice(5, 7))}月${Number(date.slice(8, 10))}日` : '';
    const recordIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h14v16H5zM8 9h8m-8 4h8m-8 4h4"/></svg>';
    function body({ source, record, date, canConfirm, error = '' }) {
      const available = Boolean(source && record);
      return `<article class="rhythm-halo-page"><div class="rh-halo-scroll"><header class="rh-halo-header"><button type="button" data-action="previous">← 返回</button><h1>带着这条记录聊聊</h1><p>${available ? '先看看，要带给 Halo 的是不是这一条。' : '选一条已保存的感受，再和 Halo 聊聊。'}</p></header>${available ? `<section class="rh-halo-record" aria-label="将带入的用户记录"><div class="rh-halo-record-heading">${recordIcon}<time datetime="${esc(source.date)}">${esc(dateLabel(source.date))}</time><span>用户记录</span></div>${record.feeling?.trim() ? `<h2>${esc(record.feeling)}</h2>` : ''}${record.note?.trim() ? `<p class="rh-halo-original">${esc(record.note)}</p>` : '<p class="rh-halo-no-note">这一天没有补充文字。</p>'}</section><div class="rh-halo-next"><img src="assets/HALORING_super_symbol_copper.png" alt="" width="28" height="28"><div><h2>在一段新对话里聊</h2><p>进入后再输入想聊的话，不会自动发送。</p></div></div><p class="rh-halo-scope">只带入这一天的感受，不附带周期设置或戒指数据。</p>` : `<section class="rh-halo-empty">${recordIcon}${dateLabel(date) ? `<time datetime="${esc(date)}">${esc(dateLabel(date))}</time>` : ''}<h2>这一天没有可带入的记录</h2><p>回到节律，记下一条感受或选择其他日期。</p></section>`}</div><footer class="rh-halo-footer"><p class="rh-halo-error" role="alert">${esc(error)}</p>${available ? `<button type="button" class="primary" data-action="halo-rhythm-context"${canConfirm ? '' : ' disabled'}>带入新对话</button><button type="button" class="rh-halo-cancel" data-action="previous">这次不带入</button><p class="rh-halo-preserve">之前的对话和未发送内容会保留。</p>` : '<button type="button" class="primary" data-action="go:RHY-01">回到节律</button>'}</footer></article>`;
    }
    function blocked(error) {
      return `<article class="rhythm-halo-page"><div class="rh-halo-scroll"><header class="rh-halo-header"><button type="button" data-action="previous">← 返回</button><h1>暂时不能带入记录</h1></header><section class="rh-halo-empty">${recordIcon}<p role="status">${esc(error)}</p></section></div><footer class="rh-halo-footer"><button type="button" class="primary" data-action="go:SET-01">查看数据与隐私</button></footer></article>`;
    }
    return { body, blocked };
  };
})();
