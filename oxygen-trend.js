/* HLT-05 illustrative overnight oxygen averages, dated by the wake-up morning.
 * Explicit supported-device demos only: never infer capability from a fixture.
 * Not hardware readings, a clinical reference range, or a diagnostic algorithm.
 */
(() => {
  const values = [98, 97, 98, null, 97, 98, 98];
  const validDate = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
  function shiftDate(date, offset) {
    if (!validDate(date) || !Number.isInteger(offset)) return "";
    return new Date(Date.parse(`${date}T12:00:00Z`) + offset * 86400000).toISOString().slice(0, 10);
  }
  const shortDate = date => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;
  const spokenDate = date => `${Number(date.slice(5, 7))}月${Number(date.slice(8, 10))}日`;
  function model({ date, recordDate, stage, active, windowEnd = date, scenario = "unknown", now = Date.now() }) {
    const clock = Number.isFinite(now) ? now : Date.now();
    const today = new Date(clock + 8 * 3600000).toISOString().slice(0, 10);
    const selectedDate = validDate(date) ? date : today;
    const end = validDate(windowEnd) ? windowEnd : selectedDate;
    const capability = ["supported", "unknown", "unsupported", "off", "quality"].includes(scenario) ? scenario : "unknown";
    const unavailable = !active ? "unbound" : capability === "unknown" ? "unknown" : capability === "unsupported" ? "unsupported" : stage === "none" ? "none" : "";
    // Stage counts are fixed demonstration snapshots, not hardware algorithms.
    const availableCount = unavailable ? 0 : { interpretable: 7, baseline: 3, accumulating: 1, limited: 7 }[stage] || 0;
    const records = validDate(recordDate) ? values.map((value, index) => {
      const day = shiftDate(recordDate, index - 6);
      return { date: day, value: index >= 7 - availableCount && Date.parse(`${day}T08:44:00+08:00`) <= clock ? value : null };
    }) : [];
    const reading = day => {
      if (unavailable) return { date: day, value: null, reason: unavailable };
      if (day === recordDate && capability === "off") return { date: day, value: null, reason: "off" };
      if (day === recordDate && (capability === "quality" || stage === "limited")) return { date: day, value: null, reason: "quality" };
      const value = records.find(record => record.date === day)?.value ?? null;
      const safe = Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
      return { date: day, value: safe, reason: safe === null ? "missing" : "data" };
    };
    const days = Array.from({ length: 7 }, (_, index) => reading(shiftDate(end, index - 6)));
    return {
      date: selectedDate, windowEnd: end, days, selected: reading(selectedDate),
      hasAny: days.some(day => day.value !== null),
      latest: records.map(record => reading(record.date)).filter(record => record.value !== null).at(-1) || null,
      source: "示例数据", version: "oxygen-night-v1", scenario: capability,
    };
  }
  function render(data) {
    if (!data.hasAny) return "";
    const count = data.days.filter(day => day.value !== null).length;
    return `<section class="oxygen-trend" aria-labelledby="oxygen-trend-title"><header><h2 id="oxygen-trend-title">近 7 晚血氧</h2><span class="oxygen-trend-badge">示例数据</span></header><p class="oxygen-trend-subtitle">每个点是一晚的平均血氧</p><div class="oxygen-trend-readout" aria-live="polite" aria-atomic="true"><time data-oxygen-date></time><strong data-oxygen-value></strong></div><svg id="oxygen-trend-plot" class="oxygen-trend-plot" role="slider" tabindex="0" aria-label="选择一晚的血氧" aria-describedby="oxygen-trend-hint oxygen-trend-caption" aria-orientation="horizontal" aria-valuemin="0" aria-valuemax="6"></svg><div class="oxygen-trend-controls"><button id="oxygen-trend-previous" type="button" data-oxygen-step="previous" aria-label="上一晚">‹</button><p id="oxygen-trend-hint">点按或左右拖动查看</p><button id="oxygen-trend-next" type="button" data-oxygen-step="next" aria-label="下一晚">›</button></div><p id="oxygen-trend-caption" class="oxygen-trend-caption">${count === 1 ? "仅一晚记录，暂不连成曲线" : "空白处暂无有效记录"}</p><details class="oxygen-trend-data"><summary>查看这 7 晚的数值</summary><ul>${data.days.map(day => `<li><time datetime="${day.date}">${spokenDate(day.date)}</time><span>${day.value === null ? "暂无有效记录" : `${day.value.toFixed(0)}%`}</span></li>`).join("")}</ul></details></section>`;
  }
  function mount(root, { data, onSelect }) {
    const chart = root.querySelector(".oxygen-trend");
    if (!chart || !data.hasAny) return () => {};
    const svg = chart.querySelector("svg");
    const previous = chart.querySelector('[data-oxygen-step="previous"]');
    const next = chart.querySelector('[data-oxygen-step="next"]');
    let selected = data.days.findIndex(day => day.date === data.selected.date);
    let width = 0, gesture = null, disposed = false;
    const x = index => 30 + index / 6 * (width - 44);
    const y = value => 148 - (value - 90) / 10 * 120;
    const current = () => selected >= 0 ? data.days[selected] : data.selected;
    const stepTarget = direction => selected < 0 ? direction < 0 ? 6 : 0 : Math.max(0, Math.min(6, selected + direction));
    function paint() {
      if (disposed) return;
      width = Math.max(180, chart.clientWidth);
      svg.setAttribute("viewBox", `0 0 ${width} 183`);
      const dates = width < 290 ? [0, 2, 4, 6] : [0, 1, 2, 3, 4, 5, 6];
      const axes = [90, 95, 100].map(value => `<line class="oxygen-trend-grid" x1="30" x2="${width - 14}" y1="${y(value)}" y2="${y(value)}"/><text x="23" y="${y(value) + 4}" text-anchor="end">${value}</text>`).join("") + dates.map(index => `<text x="${x(index)}" y="173" text-anchor="${index === 0 ? "start" : index === 6 ? "end" : "middle"}">${shortDate(data.days[index].date)}</text>`).join("");
      const segments = [[]];
      data.days.forEach((day, index) => {
        if (day.value === null) { if (segments.at(-1).length) segments.push([]); }
        else segments.at(-1).push({ ...day, index });
      });
      const paths = segments.filter(segment => segment.length > 1).map(segment => `<polyline class="oxygen-trend-line" points="${segment.map(day => `${x(day.index)},${y(day.value)}`).join(" ")}"/>`).join("");
      const dots = data.days.map((day, index) => day.value === null ? "" : `<circle class="oxygen-trend-dot" data-oxygen-date="${day.date}" data-oxygen-value="${day.value}" cx="${x(index)}" cy="${y(day.value)}" r="3"/>`).join("");
      const reading = current();
      const indicator = selected < 0 ? "" : `<line class="oxygen-trend-cursor" x1="${x(selected)}" x2="${x(selected)}" y1="24" y2="153"/>${reading.value === null ? "" : `<circle class="oxygen-trend-selected" cx="${x(selected)}" cy="${y(reading.value)}" r="5"/>`}`;
      svg.innerHTML = `<title>${data.days[0].date} 至 ${data.days[6].date}，每晚平均血氧示例，单位百分比。缺少记录的日期留空。</title><text x="30" y="13">%</text>${axes}${paths}${dots}${indicator}`;
      const dateLabel = chart.querySelector("time[data-oxygen-date]");
      dateLabel.textContent = spokenDate(reading.date);
      dateLabel.dateTime = reading.date;
      chart.querySelector("strong[data-oxygen-value]").textContent = reading.value === null ? "暂无有效记录" : `${reading.value.toFixed(0)}%`;
      svg.setAttribute("aria-valuenow", String(Math.max(0, selected)));
      svg.setAttribute("aria-valuetext", `${reading.date}，${reading.value === null ? "暂无有效记录" : `${reading.value.toFixed(0)}%`}，示例数据`);
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
      const operation = event.target.closest("[data-oxygen-step]")?.dataset.oxygenStep;
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
  window.HALO_OXYGEN_TREND = { model, render, mount, shiftDate };
})();
