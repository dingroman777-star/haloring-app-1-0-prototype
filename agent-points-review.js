/* Read-only synthetic point records. No payout requests, payment statuses or ledger writes. */
(() => {
  'use strict';
  const M=window.HaloPartnerReviewModel, root=document.getElementById('agent-points');
  const url=new URL(location.href), months=Object.keys(M.pointRecords), categories=Object.keys(M.awardNames);
  let month=months.includes(url.searchParams.get('month'))?url.searchParams.get('month'):months[0];
  let category=categories.includes(url.searchParams.get('category'))?url.searchParams.get('category'):categories[0];
  let detail=-1;
  const pointChange=fen=>(fen>0?'+':'')+M.points(fen);
  function render() {
    const records=M.pointRecords[month][category], name=M.awardNames[category];
    const total=records.reduce((sum,record)=>sum+record.fen,0), selected=records[detail];
    root.innerHTML=`<a class="p-back" href="partner-review.html">← 返回审阅目录</a>
      <span class="p-kicker">HALO PARTNER</span><h1>代理积分</h1><p>查看每月积分与记录。</p>
      <label for="award-month" style="display:block;margin:24px 0 9px;font-size:12px;color:#768371">查看月份</label>
      <select id="award-month" class="p-select">${months.map(m=>`<option value="${m}" ${m===month?'selected':''}>${m.replace('-',' 年 ')} 月</option>`).join('')}</select>
      <div class="p-tabs" aria-label="积分类别">${categories.map(key=>`<button data-category="${key}" aria-pressed="${key===category}">${M.awardNames[key]}</button>`).join('')}</div>
      <section class="p-card p-hero"><span class="p-pill">${name}</span><p>当月记录积分</p><strong>${M.points(total)}</strong><p>代理积分 · ${records.length} 条记录</p></section>
      <section class="p-card"><h2>积分记录</h2><p style="font-size:12px">包含本月新增与更正记录。</p>
      ${records.length?records.map((record,i)=>`<button class="p-row" data-detail="${i}" aria-label="查看 ${record.date} ${record.note} ${pointChange(record.fen)} 积分"><span><b>${record.note}</b><small>${record.date}</small></span><span style="text-align:right"><b>${pointChange(record.fen)}</b><small>代理积分 ›</small></span></button>`).join(''):'<p>本月暂无积分记录。</p>'}</section>
      ${selected?`<section class="p-card" aria-live="polite"><span class="p-pill">${name}</span><h2>记录详情</h2><dl class="p-facts"><div><dt>记录积分</dt><dd>${pointChange(selected.fen)} 代理积分</dd></div><div><dt>记录日期</dt><dd>${selected.date}</dd></div><div><dt>记录编号</dt><dd>${selected.id}</dd></div><div><dt>记录说明</dt><dd>${selected.note}</dd></div>${selected.related?`<div><dt>原记录编号</dt><dd>${selected.related}</dd></div>`:''}</dl><button class="p-secondary" id="points-help">记录有疑问</button><button class="p-secondary" id="points-collapse">收起详情</button><p id="points-help-text" role="status"></p></section>`:''}
      <section class="p-card"><h3>关于代理积分</h3><p>用于查看合作奖励记录，与会员 Halo Points 分开记录。</p><p>积分记录不代表款项到账状态。相关款项由公司另行处理，无需在此操作。</p></section>
      <small class="p-boundary">此页面仅供查询。</small>`;
    const next=new URL(location.href);next.searchParams.set('month',month);next.searchParams.set('category',category);history.replaceState(null,'',next);
  }
  root.addEventListener('change',event=>{if(event.target.id==='award-month'&&months.includes(event.target.value)){month=event.target.value;detail=-1;render();}});
  root.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;
    if(categories.includes(button.dataset.category)){category=button.dataset.category;detail=-1;render();}
    else if(button.dataset.detail!==undefined){const i=Number(button.dataset.detail);if(Number.isInteger(i)&&i>=0&&i<M.pointRecords[month][category].length){detail=i;render();}}
    else if(button.id==='points-collapse'){detail=-1;render();}
    else if(button.id==='points-help'){document.getElementById('points-help-text').textContent='请向服务支持提供上方记录编号。本地演示没有创建工单或传送数据。';}
  });
  render();
})();
