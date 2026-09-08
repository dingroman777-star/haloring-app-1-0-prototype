/* HLT-02 illustrative overnight averages, dated by the morning the user wakes.
 * These fixed fixture snapshots are not Body Weather eligibility thresholds,
 * hardware readings, a respiratory algorithm, or a clinical reference range.
 */
(() => {
  const values = [15.0, 15.4, null, 15.1, 15.3, 15.0, 15.2];
  const validDate = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
  function shiftDate(date, offset) {
    if (!validDate(date) || !Number.isInteger(offset)) return "";
    return new Date(Date.parse(`${date}T12:00:00Z`) + offset * 86400000).toISOString().slice(0, 10);
  }
  const shortDate = date => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;
  const spokenDate = date => `${Number(date.slice(5, 7))}月${Number(date.slice(8, 10))}日`;
  function model({ date, recordDate, stage, active, windowEnd = date, now = Date.now() }) {
    const today = new Date(now + 8 * 3600000).toISOString().slice(0, 10);
    const selectedDate = validDate(date) ? date : today;
    const end = validDate(windowEnd) ? windowEnd : selectedDate;
    const availableCount = active ? { interpretable: 7, baseline: 3, accumulating: 1 }[stage] || 0 : 0;
    const records = validDate(recordDate) ? values.map((value, index) => {
      const recordDay = shiftDate(recordDate, index - 6);
      return { date: recordDay, value: index >= 7 - availableCount && Date.parse(`${recordDay}T08:44:00+08:00`) <= now ? value : null };
    }) : [];
    const reading = day => ({ date: day, value: records.find(record => record.date === day)?.value ?? null });
    const days = Array.from({ length: 7 }, (_, index) => reading(shiftDate(end, index - 6)));
    return {
      date: selectedDate, windowEnd: end, days, selected: reading(selectedDate),
      hasAny: days.some(day => day.value !== null),
      latest: records.filter(record => record.value !== null).at(-1) || null,
      source: "示例数据", version: "respiration-night-v1",
    };
  }
  function render(data) {
    if (!data.hasAny) return "";
    const count = data.days.filter(day => day.value !== null).length;
    return `<section class="respiration-trend" aria-labelledby="respiration-trend-title"><header><h2 id="respiration-trend-title">近 7 晚呼吸率</h2><span class="respiration-trend-badge">示例数据</span></header><p class="respiration-trend-subtitle">每个点是一晚的平均值</p><div class="respiration-trend-readout" aria-live="polite" aria-atomic="true"><time data-respiration-date></time><strong data-respiration-value></strong></div><svg id="respiration-trend-plot" class="respiration-trend-plot" role="slider" tabindex="0" aria-label="选择一晚的呼吸率" aria-describedby="respiration-trend-hint respiration-trend-caption" aria-orientation="horizontal" aria-valuemin="0" aria-valuemax="6"></svg><div class="respiration-trend-controls"><button id="respiration-trend-previous" type="button" data-respiration-step="previous" aria-label="上一晚">‹</button><p id="respiration-trend-hint">点按或左右拖动查看</p><button id="respiration-trend-next" type="button" data-respiration-step="next" aria-label="下一晚">›</button></div><p id="respiration-trend-caption" class="respiration-trend-caption">${count === 1 ? "仅一晚记录，暂不连成曲线" : "空白处暂无完整记录"}</p><details class="respiration-trend-data"><summary>查看这 7 晚的数值</summary><ul>${data.days.map(day => `<li><time datetime="${day.date}">${spokenDate(day.date)}</time><span>${day.value === null ? "暂无完整记录" : `${day.value.toFixed(1)} 次/分`}</span></li>`).join("")}</ul></details></section>`;
  }
  function mount(root, { data, onSelect }) {
    const chart = root.querySelector(".respiration-trend");
    if (!chart || !data.hasAny) return () => {};
    const svg = chart.querySelector("svg");
    const previous = chart.querySelector('[data-respiration-step="previous"]');
    const next = chart.querySelector('[data-respiration-step="next"]');
    let selected = data.days.findIndex(day => day.date === data.selected.date);
    let width = 0, gesture = null, disposed = false;
    const x = index => 30 + index / 6 * (width - 44);
    const y = value => 148 - (value - 12) / 6 * 120;
    const current = () => selected >= 0 ? data.days[selected] : data.selected;
    const stepTarget = direction => selected < 0 ? direction < 0 ? 6 : 0 : Math.max(0, Math.min(6, selected + direction));
    function paint() {
      if (disposed) return;
      width = Math.max(180, chart.clientWidth);
      svg.setAttribute("viewBox", `0 0 ${width} 183`);
      const dates = width < 290 ? [0, 2, 4, 6] : [0, 1, 2, 3, 4, 5, 6];
      const axes = [12, 14, 16, 18].map(value => `<line class="respiration-trend-grid" x1="30" x2="${width - 14}" y1="${y(value)}" y2="${y(value)}"/><text x="23" y="${y(value) + 4}" text-anchor="end">${value}</text>`).join("") + dates.map(index => `<text x="${x(index)}" y="173" text-anchor="${index === 0 ? "start" : index === 6 ? "end" : "middle"}">${shortDate(data.days[index].date)}</text>`).join("");
      const segments = [[]];
      data.days.forEach((day, index) => {
        if (day.value === null) { if (segments.at(-1).length) segments.push([]); }
        else segments.at(-1).push({ ...day, index });
      });
      const paths = segments.filter(segment => segment.length > 1).map(segment => `<polyline class="respiration-trend-line" points="${segment.map(day => `${x(day.index)},${y(day.value)}`).join(" ")}"/>`).join("");
      const dots = data.days.map((day, index) => day.value === null ? "" : `<circle class="respiration-trend-dot" data-respiration-date="${day.date}" data-respiration-value="${day.value}" cx="${x(index)}" cy="${y(day.value)}" r="3"/>`).join("");
      const reading = current();
      const indicator = selected < 0 ? "" : `<line class="respiration-trend-cursor" x1="${x(selected)}" x2="${x(selected)}" y1="24" y2="153"/>${reading.value === null ? "" : `<circle class="respiration-trend-selected" cx="${x(selected)}" cy="${y(reading.value)}" r="5"/>`}`;
      svg.innerHTML = `<title>${data.days[0].date} 至 ${data.days[6].date}，每晚平均呼吸率示例，单位次/分。缺少记录的日期留空。</title><text x="30" y="13">次/分</text>${axes}${paths}${dots}${indicator}`;
      const dateLabel = chart.querySelector("time[data-respiration-date]");
      dateLabel.textContent = spokenDate(reading.date);
      dateLabel.dateTime = reading.date;
      chart.querySelector("strong[data-respiration-value]").textContent = reading.value === null ? "暂无完整记录" : `${reading.value.toFixed(1)} 次/分`;
      svg.setAttribute("aria-valuenow", String(Math.max(0, selected)));
      svg.setAttribute("aria-valuetext", `${reading.date}，${reading.value === null ? "暂无完整记录" : `${reading.value.toFixed(1)} 次/分`}，示例数据`);
      previous.disabled = selected === 0; next.disabled = selected === 6;
    }
    function select(index, commit = false) {
      if (!Number.isInteger(index) || index < 0 || index > 6) return;
      const changed = selected !== index;
      selected = index;
      if (changed) paint();
      if (commit && data.days[index].date !== data.selected.date && typeof onSelect === "function") onSelect(data.days[index].date);
    }
    function selectAt(clientX) {
      const box = svg.getBoundingClientRect();
      if (!box.width) return;
      const local = (clientX - box.left) * width / box.width;
      select(Math.max(0, Math.min(6, Math.round((local - 30) / (width - 44) * 6))));
    }
    const down = event => {
      if (event.isPrimary === false || event.button !== 0) return;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, original: selected, horizontal: false, canceled: false };
      // Mouse preview is local. Committing on release lets the page safely rerender.
      if (event.pointerType === "mouse") selectAt(event.clientX);
    };
    const move = event => {
      if (!gesture || event.pointerId !== gesture.id || gesture.canceled) return;
      const dx = Math.abs(event.clientX - gesture.x), dy = Math.abs(event.clientY - gesture.y);
      if (!gesture.horizontal && dy > 8 && dy > dx) { gesture.canceled = true; selected = gesture.original; paint(); return; }
      if (!gesture.horizontal && dx > 8 && dx > dy) { gesture.horizontal = true; svg.setPointerCapture?.(event.pointerId); }
      if (gesture.horizontal) selectAt(event.clientX);
    };
    const up = event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const canceled = gesture.canceled;
      gesture = null;
      if (!canceled) { selectAt(event.clientX); select(selected, true); }
    };
    const cancel = () => { if (gesture) { selected = gesture.original; gesture = null; paint(); } };
    const key = event => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
      event.preventDefault(); event.stopPropagation();
      const target = event.key === "Home" ? 0 : event.key === "End" ? 6 : stepTarget(["ArrowLeft", "ArrowDown"].includes(event.key) ? -1 : 1);
      select(target, true);
    };
    const click = event => {
      const operation = event.target.closest("[data-respiration-step]")?.dataset.respirationStep;
      if (operation) select(stepTarget(operation === "previous" ? -1 : 1), true);
    };
    svg.addEventListener("pointerdown", down); svg.addEventListener("pointermove", move);
    svg.addEventListener("pointerup", up); svg.addEventListener("pointercancel", cancel); svg.addEventListener("keydown", key);
    chart.addEventListener("click", click);
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(paint) : null;
    observer?.observe(chart);
    paint();
    return () => {
      disposed = true; observer?.disconnect(); gesture = null;
      svg.removeEventListener("pointerdown", down); svg.removeEventListener("pointermove", move);
      svg.removeEventListener("pointerup", up); svg.removeEventListener("pointercancel", cancel); svg.removeEventListener("keydown", key);
      chart.removeEventListener("click", click);
    };
  }
  window.HALO_RESPIRATION_TREND = { model, render, mount, shiftDate };
})();
