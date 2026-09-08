(() => {
  "use strict";
  window.createHaloStudioPostReport = function ({ state, report, event, media, feeling, go, render, esc, icon, screen, modalRoot, closeModal, flash }) {
    let example = null;
    const id = () => state.selectedStudioEventId;
    const record = () => state.studioRecords?.[id()];
    const account = () => String(state.authPhone || state.authForm?.phone || "local-demo");
    const scope = () => JSON.stringify([id(), account(), record()?.bookingId, record()?.sessionId, record()?.startedAt, record()?.completedAt]);
    const available = () => report.canReport(record()) && record()?.reportStatus === "generated";
    const button = (text, action, cls = "studio-post-link") => `<button type="button" class="${cls}" data-action="${action}">${esc(text)}</button>`;
    const day = time => new Date(time + 8 * 3600000).toISOString().slice(0, 10);
    const timestamp = value => typeof value === "string" && value.trim() ? Date.parse(value) : NaN;
    function nextDay(r = record()) {
      const end = timestamp(r?.completedAt);
      if (!Number.isFinite(end) || end > Date.now()) return { ready: false, text: "完成时间待核对" };
      return day(end) < day(Date.now()) ? { ready: true, text: "查看次日记录" } : { ready: false, text: "明天再来看看" };
    }
    function duration(r = record()) {
      const start = timestamp(r?.startedAt), end = timestamp(r?.completedAt);
      if (!Number.isFinite(start) || !Number.isFinite(end) || end < start || end > Date.now()) return { value: "—", unit: "时间待核对" };
      const minutes = Math.floor((end - start) / 60000);
      return minutes < 1 ? { value: "不到 1", unit: "分钟" } : minutes < 60 ? { value: String(minutes), unit: "分钟" } : { value: `${Math.floor(minutes / 60)}小时${minutes % 60 ? ` ${minutes % 60}分` : ""}`, unit: "" };
    }
    function page() {
      const fresh = report.prepare();
      if (!fresh || !available()) return `<article class="studio-post-report studio-detail"><div class="studio-detail-scroll"><header class="studio-detail-header"><h1>课后报告</h1></header><section class="studio-post-empty"><h2>暂时无法查看这份报告</h2><p>请返回本次活动核对，已有记录没有改变。</p></section></div><footer class="studio-detail-footer">${button("返回本次活动", "stupost-back", "primary")}</footer></article>`;
      const r = record(), e = event(id()), time = duration(), next = nextDay(), saved = feeling.savedText(r, id());
      return `<article class="studio-post-report studio-detail"><div class="studio-detail-scroll" tabindex="0" aria-label="本次课后报告"><header class="studio-detail-header"><button type="button" data-action="stupost-back" aria-label="返回本次活动">${icon("back")}</button><h1>课后报告</h1>${button("Studio", "stupost-home")}</header><div class="studio-booking-event studio-post-event">${media(id()) ? `<img src="${media(id())}" width="64" height="64" alt="${esc(e.category)}场地示意图">` : ""}<div><h2>${esc(e.title)}</h2><p>${esc(e.date)}</p><p>${esc(e.place)} · ${esc(e.duration)}分钟</p></div></div><dl class="studio-post-facts"><div><dt>参与时长</dt><dd>${esc(time.value)} <small>${esc(time.unit)}</small></dd></div><div><dt>参与方式</dt><dd class="studio-post-mode">Halo Ring</dd></div></dl>${!r.completionSnapshot ? '<p class="studio-post-legacy">历史参与记录已保留，当前没有附带身体数值。</p>' : ""}<section class="studio-post-data"><h2>身体记录</h2><div class="studio-post-empty">${icon("report")}<h3>暂无可展示的身体数值</h3><p>这次暂时没有可查看的趋势。</p>${button("查看图表示例", "stupost-example", "secondary")}</div></section><section class="studio-post-feeling"><header><h2>活动前的感受</h2><span>用户记录</span></header>${saved ? `<blockquote>${esc(saved)}</blockquote>` : '<p>没有活动前的用户记录。</p>'}</section><nav class="studio-post-links" aria-label="本次活动后续"><button type="button" data-action="stupost-record">${icon("report")}<span>本次记录</span>${icon("arrow")}</button><button type="button" data-action="stupost-benefits">${icon("ticket")}<span>活动权益</span>${icon("arrow")}</button>${next.ready ? `<button type="button" data-action="stupost-next">${icon("calendar")}<span>次日回顾<small>${esc(next.text)}</small></span>${icon("arrow")}</button>` : `<div class="studio-post-next">${icon("calendar")}<span>次日回顾<small>${esc(next.text)}</small></span></div>`}</nav></div><footer class="studio-detail-footer">${button("返回本次活动", "stupost-back", "primary")}</footer></article>`;
    }
    // These values exist only in an explicitly opened example. They never become this activity's measurements.
    const samples = {
      heart: { label: "心率", unit: "次/分", values: [68, 74, 70, 76], low: 40, high: 100, ticks: [100, 80, 60, 40] },
      breath: { label: "呼吸频率", unit: "次/分", values: [14, 16, 15, 14], low: 0, high: 24, ticks: [24, 16, 8, 0] },
    };
    function exampleBody() {
      const data = samples[example.metric], point = example.point;
      const x = i => 42 + i * 82, y = value => 150 - (value - data.low) / (data.high - data.low) * 120;
      const xy = data.values.map((value, i) => `${x(i)},${y(value)}`).join(" ");
      return `<fieldset class="studio-example-tabs"><legend>选择示例指标</legend>${Object.entries(samples).map(([key, data]) => `<label for="studio-example-metric-${key}"><input type="radio" name="studio-example-metric" id="studio-example-metric-${key}" value="${key}" ${key === example.metric ? "checked" : ""}><span>${data.label}</span></label>`).join("")}</fieldset><figure class="studio-example-chart"><figcaption>${data.label} · 示例数据<small>单位：${data.unit} · 示例时段：0–60分钟</small></figcaption><svg viewBox="0 0 320 186" role="img" aria-label="${data.label}示例：${data.values.map((v,i) => `第${i*20}分钟${v}${data.unit}`).join("，")}">${data.ticks.map(t=>`<line x1="42" x2="288" y1="${y(t)}" y2="${y(t)}" class="studio-example-grid"/><text x="32" y="${y(t)+4}" text-anchor="end">${t}</text>`).join("")}<polyline points="${xy}" class="studio-example-line"/>${data.values.map((value,i)=>`<circle cx="${x(i)}" cy="${y(value)}" r="${i===point?5:3}" class="${i===point?"studio-example-selected":"studio-example-dot"}"/><text x="${x(i)}" y="175" text-anchor="middle">${i*20}分</text>`).join("")}</svg></figure><output id="studio-example-value" aria-live="polite">第 ${point*20} 分钟 · ${data.values[point]} ${data.unit}<small>仅为图表示例</small></output><label class="studio-example-range" for="studio-example-point">拖动查看示例读数<input id="studio-example-point" type="range" min="0" max="3" step="1" value="${point}" aria-valuetext="第${point*20}分钟，${data.values[point]}${data.unit}"></label><div class="studio-example-point-nav"><button type="button" data-action="stupost-point-prev" ${point===0?"disabled":""}>上一个点</button><button type="button" data-action="stupost-point-next" ${point===3?"disabled":""}>下一个点</button></div><p class="studio-example-caption">示例读数是虚构的，不代表你的身体状态，也不用于比较课程效果。</p>`;
    }
    function openExample() {
      example = { scope: scope(), metric: "heart", point: 0 };
      modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal studio-example-modal" data-studio-example="true" role="dialog" aria-modal="true" aria-labelledby="studio-example-title"><header><h2 id="studio-example-title">图表示例</h2><button type="button" data-action="close-modal" aria-label="关闭图表示例">${icon("close")}</button></header><p>以下为虚构示例，与本次活动无关。</p><div id="studio-example-body">${exampleBody()}</div><footer>${button("返回课后报告", "close-modal", "primary")}</footer></section></div>`;
    }
    function checkExample() {
      if (!example || !modalRoot.querySelector("[data-studio-example]")) { example = null; return false; }
      if (state.current !== "STU-05" || !report.prepare() || !available() || example.scope !== scope()) { example = null; closeModal(); if (state.current === "STU-05") render(); return false; }
      return true;
    }
    function updateExample(focusId, preserveRange = false) {
      const host = modalRoot.querySelector("#studio-example-body");
      if (!host) return;
      if (preserveRange) {
        const template = document.createElement("div"); template.innerHTML = exampleBody();
        host.querySelector(".studio-example-chart").replaceWith(template.querySelector(".studio-example-chart"));
        host.querySelector("#studio-example-value").innerHTML = template.querySelector("#studio-example-value").innerHTML;
        host.querySelector("#studio-example-point").setAttribute("aria-valuetext", template.querySelector("#studio-example-point").getAttribute("aria-valuetext"));
        for (const action of ["stupost-point-prev", "stupost-point-next"]) host.querySelector(`[data-action="${action}"]`).disabled = template.querySelector(`[data-action="${action}"]`).disabled;
        return;
      }
      host.innerHTML = exampleBody();
      if (focusId) modalRoot.querySelector(`#${focusId}`)?.focus({ preventScroll: true });
    }
    function handle(action) {
      if (!action.startsWith("stupost-")) return false;
      if (state.current !== "STU-05") return true;
      const before = scope();
      if (!report.prepare()) { flash("暂时无法读取报告，请稍后重试。"); return true; }
      if (before !== scope()) { example = null; closeModal(); flash("本次活动记录有更新，请核对后继续。"); render(); return true; }
      if (!available()) { example = null; closeModal(); go("STU-12"); return true; }
      if (action === "stupost-example") openExample();
      else if (["stupost-point-prev", "stupost-point-next"].includes(action)) {
        if (checkExample()) { example.point = Math.max(0, Math.min(3, example.point + (action.endsWith("prev") ? -1 : 1))); updateExample("studio-example-point"); }
      } else {
        const target = { "stupost-back": "STU-12", "stupost-home": "STU-08", "stupost-record": "STU-15", "stupost-benefits": "STU-13", "stupost-next": "STU-06" }[action];
        if (target) {
          if (target === "STU-06" && !nextDay().ready) { flash(nextDay().text); render(); return true; }
          example = null; closeModal(); go(target);
        }
      }
      return true;
    }
    modalRoot.addEventListener("change", event => {
      if (!event.target.matches('input[name="studio-example-metric"]') || !checkExample()) return;
      if (samples[event.target.value]) { example.metric = event.target.value; updateExample(event.target.id); }
    });
    modalRoot.addEventListener("input", event => {
      if (event.target.id !== "studio-example-point" || !checkExample()) return;
      const value = Number(event.target.value);
      if (Number.isInteger(value) && value >= 0 && value <= 3) { example.point = value; updateExample("studio-example-point", true); }
    });
    setInterval(() => { if (example) checkExample(); }, 500);
    return { page, handle, nextDay };
  };
})();
