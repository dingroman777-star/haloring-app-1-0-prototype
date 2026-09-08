/* HLT-06 illustrative overnight skin-temperature deviations, dated by waking day.
 * The temperature baseline is independent of Body Weather readiness.
 * Fixed prototype samples only: neither core temperature nor a normal range.
 */
(() => {
  const values = [-0.1, 0.1, 0.2, null, -0.2, 0, 0.2];
  const validDate = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
  function shiftDate(date, offset) {
    if (!validDate(date) || !Number.isInteger(offset)) return "";
    const shifted = new Date(Date.parse(`${date}T12:00:00Z`) + offset * 86400000);
    return Number.isFinite(shifted.getTime()) ? shifted.toISOString().slice(0, 10) : "";
  }
  const shortDate = date => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;
  const spokenDate = date => `${Number(date.slice(5, 7))}月${Number(date.slice(8, 10))}日`;
  function formatValue(value) {
    if (!Number.isFinite(value)) return "—";
    const rounded = Math.round(value * 10) / 10;
    return `${rounded > 0 ? "+" : rounded < 0 ? "−" : ""}${Math.abs(rounded).toFixed(1)}`;
  }
  function model({ date, recordDate, windowEnd = date, active, hasRecords = true, scenario = "unknown", now = Date.now() } = {}) {
    const clock = Number.isFinite(now) && Math.abs(now) <= 8.63e15 ? now : Date.now();
    const today = new Date(clock + 8 * 3600000).toISOString().slice(0, 10);
    const selectedDate = validDate(date) && date <= today ? date : today;
    const end = validDate(windowEnd) && windowEnd <= today ? windowEnd : selectedDate;
    const capability = ["supported", "baseline", "quality", "unknown", "unsupported"].includes(scenario) ? scenario : "unknown";
    const unavailable = !active ? "unbound" : capability === "unknown" ? "unknown" : capability === "unsupported" ? "unsupported" : hasRecords === false ? "none" : capability === "baseline" ? "baseline" : "";
    const records = validDate(recordDate) && recordDate <= today ? values.map((value, index) => {
      const day = shiftDate(recordDate, index - 6);
      return { date: day, value: Date.parse(`${day}T08:44:00+08:00`) <= clock ? value : null };
    }) : [];
    const reading = day => {
      if (unavailable) return { date: day, value: null, reason: unavailable };
      if (Date.parse(`${day}T08:44:00+08:00`) > clock) return { date: day, value: null, reason: "future" };
      if (day === recordDate && capability === "quality") return { date: day, value: null, reason: "quality" };
      const value = records.find(record => record.date === day)?.value ?? null;
      const safe = Number.isFinite(value) ? value : null;
      return { date: day, value: safe, reason: safe === null ? "missing" : "data" };
    };
    const days = Array.from({ length: 7 }, (_, index) => reading(shiftDate(end, index - 6)));
    return {
      date: selectedDate, windowEnd: end, days, selected: reading(selectedDate),
      hasAny: days.some(day => day.value !== null),
      latest: records.map(record => reading(record.date)).filter(record => record.value !== null).at(-1) || null,
      source: "示例数据", version: "temperature-night-v1", scenario: capability,
    };
  }
  function render(data) {
    if (!data?.hasAny) return "";
    const count = data.days.filter(day => day.value !== null).length;
    return `<section class="temperature-trend" aria-labelledby="temperature-trend-title"><header><h2 id="temperature-trend-title">近 7 晚变化</h2><span class="temperature-trend-badge">示例数据</span></header><p class="temperature-trend-subtitle">每个点是一晚皮肤温度与个人基线的差值</p><div class="temperature-trend-readout" aria-live="polite" aria-atomic="true"><time data-temperature-date></time><strong data-temperature-value></strong></div><svg id="temperature-trend-plot" class="temperature-trend-plot" role="slider" tabindex="0" aria-label="选择一晚的皮肤温度变化" aria-describedby="temperature-trend-hint temperature-trend-caption" aria-orientation="horizontal" aria-valuemin="0" aria-valuemax="6"></svg><div class="temperature-trend-controls"><button id="temperature-trend-previous" type="button" data-temperature-step="previous" aria-label="上一晚">‹</button><p id="temperature-trend-hint">点按或左右拖动查看</p><button id="temperature-trend-next" type="button" data-temperature-step="next" aria-label="下一晚">›</button></div><p id="temperature-trend-caption" class="temperature-trend-caption">0 是个人基线，不是正常范围。${count === 1 ? "仅一晚记录，暂不连成曲线。" : "连线帮助观察变化，缺少记录处留空。"}</p><details class="temperature-trend-data"><summary>查看这 7 晚的数值</summary><ul>${data.days.map(day => `<li><time datetime="${day.date}">${spokenDate(day.date)}</time><span>${day.value === null ? "暂无有效记录" : `${formatValue(day.value)} ℃`}</span></li>`).join("")}</ul></details></section>`;
  }
  function mount(root, { data, onSelect }) {
    const chart = root.querySelector(".temperature-trend");
    if (!chart || !data?.hasAny) return () => {};
    const svg = chart.querySelector("svg");
    const previous = chart.querySelector('[data-temperature-step="previous"]');
    const next = chart.querySelector('[data-temperature-step="next"]');
    const extent = Math.max(0.5, Math.ceil(Math.max(...data.days.map(day => Number.isFinite(day.value) ? Math.abs(day.value) : 0)) * 2) / 2);
    let selected = data.days.findIndex(day => day.date === data.selected.date);
    let width = 0, gesture = null, disposed = false, committedDate = data.selected.date;
    const x = index => 38 + index / 6 * (width - 52);
    const y = value => 88 - value / extent * 60;
    const current = () => selected >= 0 ? data.days[selected] : data.selected;
    const stepTarget = direction => selected < 0 ? direction < 0 ? 6 : 0 : Math.max(0, Math.min(6, selected + direction));
    function curve(segment) {
      let path = `M${x(segment[0].index)},${y(segment[0].value)}`;
      for (let index = 1; index < segment.length; index += 1) {
        const from = segment[index - 1], to = segment[index];
        const middle = (x(from.index) + x(to.index)) / 2;
        // Horizontal tangents preserve each pair's bounds without invented extrema.
        path += ` C${middle},${y(from.value)} ${middle},${y(to.value)} ${x(to.index)},${y(to.value)}`;
      }
      return path;
    }
    function paint() {
      if (disposed) return;
      width = Math.max(180, Math.round(chart.clientWidth));
      svg.setAttribute("viewBox", `0 0 ${width} 183`);
      const dates = width < 290 ? [0, 2, 4, 6] : [0, 1, 2, 3, 4, 5, 6];
      const axes = [-extent, 0, extent].map(value => `<line class="temperature-trend-${value === 0 ? "baseline" : "grid"}" x1="38" x2="${width - 14}" y1="${y(value)}" y2="${y(value)}"/><text x="30" y="${y(value) + 4}" text-anchor="end">${value === 0 ? "0" : formatValue(value)}</text>`).join("") + dates.map(index => `<text x="${x(index)}" y="173" text-anchor="${index === 0 ? "start" : index === 6 ? "end" : "middle"}">${shortDate(data.days[index].date)}</text>`).join("");
      const segments = [[]];
      data.days.forEach((day, index) => {
        if (day.value === null) { if (segments.at(-1).length) segments.push([]); }
        else segments.at(-1).push({ ...day, index });
      });
      const paths = segments.filter(segment => segment.length > 1).map(segment => `<path class="temperature-trend-line" d="${curve(segment)}"/>`).join("");
      const dots = data.days.map((day, index) => day.value === null ? "" : `<circle class="temperature-trend-dot" data-temperature-date="${day.date}" data-temperature-value="${day.value}" cx="${x(index)}" cy="${y(day.value)}" r="3"/>`).join("");
      const reading = current();
      const indicator = selected < 0 ? "" : `<line class="temperature-trend-cursor" x1="${x(selected)}" x2="${x(selected)}" y1="24" y2="153"/>${reading.value === null ? "" : `<circle class="temperature-trend-selected" cx="${x(selected)}" cy="${y(reading.value)}" r="5"/>`}`;
      svg.innerHTML = `<title>${data.days[0].date} 至 ${data.days[6].date}，每晚皮肤温度相对个人基线的变化，单位摄氏度。示例数据；缺少记录的日期留空，0 不代表正常范围。</title><text x="38" y="13">℃</text>${axes}${paths}${dots}${indicator}`;
      const dateLabel = chart.querySelector("time[data-temperature-date]");
      dateLabel.textContent = spokenDate(reading.date);
      dateLabel.dateTime = reading.date;
      chart.querySelector("strong[data-temperature-value]").textContent = reading.value === null ? "暂无有效记录" : `${formatValue(reading.value)} ℃`;
      svg.setAttribute("aria-valuenow", String(Math.max(0, selected)));
      svg.setAttribute("aria-valuetext", `${reading.date}，${reading.value === null ? "暂无有效记录" : `相对个人基线 ${formatValue(reading.value)} 摄氏度`}，示例数据`);
      previous.disabled = selected === 0; next.disabled = selected === 6;
    }
    function select(index, commit = false) {
      if (!Number.isInteger(index) || index < 0 || index > 6) return;
      const changed = selected !== index;
      selected = index;
      if (changed) paint();
      if (commit && data.days[index].date !== committedDate) {
        committedDate = data.days[index].date;
        if (typeof onSelect === "function") onSelect(committedDate);
      }
    }
    function selectAt(clientX) {
      const box = svg.getBoundingClientRect();
      if (!box.width) return;
      const local = (clientX - box.left) * width / box.width;
      select(Math.max(0, Math.min(6, Math.round((local - 38) / (width - 52) * 6))));
    }
    const down = event => {
      if (event.isPrimary === false || event.button !== 0) return;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, original: selected, horizontal: false, canceled: false };
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
      const operation = event.target.closest("[data-temperature-step]")?.dataset.temperatureStep;
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
  window.HALO_TEMPERATURE_TREND = { model, render, mount, formatValue, shiftDate };
})();
