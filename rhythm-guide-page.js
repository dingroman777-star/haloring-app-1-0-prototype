/* RHY-02 explains how to read a personal journal; it does not infer a cycle stage. */
(() => {
  window.renderHaloRhythmGuide = ({ state, esc, record, cycle, icon }) => {
    const permitted = state.signedIn && (!state.healthDeletionStatus || state.healthDeletionStatus === "ready") && state.accountDeletionStatus !== "submitted";
    const date = state.selectedRhythmDate;
    const dateLabel = value => `${Number(value.slice(0, 4))}年${Number(value.slice(5, 7))}月${Number(value.slice(8))}日`;
    const heading = `<header class="rh-guide-header"><button type="button" class="back" data-action="previous">← 返回</button><h1>${cycle ? "周期与感受" : "读懂感受记录"}</h1><p>先看那天发生了什么，再回看几天的变化。</p></header>`;
    if (!permitted) return `<article class="rhythm-guide-page">${heading}<section class="rh-guide-record"><h2>记录暂不可用</h2><p>到数据与隐私查看当前处理状态。</p><button type="button" class="primary" data-action="go:SET-01">查看数据与隐私</button></section></article>`;
    const recordCard = `<section class="rh-guide-record" aria-label="所选日期的用户记录"><div class="rh-guide-date"><time datetime="${esc(date)}">${esc(dateLabel(date))}</time><span>用户记录</span></div>${record ? `<h2>${esc(record.feeling || "感受记录")}</h2>${record.note ? `<details class="rh-guide-note"><summary>查看补充文字</summary><p>${esc(record.note)}</p></details>` : '<p>这一天没有补充文字。</p>'}<button type="button" class="primary" data-action="rh-guide:halo">查看要带入的记录</button><small>下一页确认后，再进入 Halo 对话。</small>` : `<h2>${state.rhythmDeleted ? "还没有新的记录" : "这一天还没有记录"}</h2><p>${state.rhythmDeleted ? "可以重新开始，记下现在的感受。" : "先到日历选一天，记下感受或回看已有记录。"}</p><button type="button" class="primary" data-action="rh-guide:calendar">回到感受日历</button>`}</section>`;
    const steps = [
      ["heart", "先看当天", "把那天的感受和补充文字放在一起看。"],
      ["report", "再看前后几天", "在日历换一天对照，不急着用一次感受下结论。"],
      ["activity", "留意日常变化", "也可以记下熬夜、出差或运动，方便以后回想。"]
    ];
    const modes = { paused: "周期展示已暂停，仍可回看感受。", conflict: "周期日期待核对，先看自己记下的感受。", insufficient: "周期日期尚未补全，不影响回看感受。", error: "记录暂未更新，这里只展示本机已保存的内容。" };
    const mode = modes[state.rhythmStatus] || (cycle ? `你填写的最近一次开始日期：${dateLabel(state.rhythmSettings.startDate)}。` : "");
    return `<article class="rhythm-guide-page">${heading}${recordCard}<p class="rh-guide-feedback" role="status"></p>${mode ? `<p class="rh-guide-mode">${esc(mode)}</p>` : ""}<section class="rh-guide-method" aria-label="回看方法"><h2>可以这样回看</h2>${steps.map(([symbol, title, text]) => `<div class="rh-guide-step"><span class="rh-guide-icon" aria-hidden="true">${icon(symbol)}</span><div><h3>${title}</h3><p>${text}</p></div></div>`).join("")}</section><details class="rh-guide-boundary"><summary>这些记录能说明什么？</summary><p>感受由你填写，不是戒指测量结果。相似感受不一定有同一个原因。</p><p>周期日期也是你填写的记录，不代表当天的身体状态，不用于判断排卵或避孕安全期。</p><p>Halo 可以帮你整理文字。只有在下一页确认后，才会将所选日期的感受记录带入对话。</p></details>${record ? '<button type="button" class="rh-guide-calendar" data-action="rh-guide:calendar">回日历对照其他日期 <span aria-hidden="true">›</span></button>' : ""}</article>`;
  };
})();
