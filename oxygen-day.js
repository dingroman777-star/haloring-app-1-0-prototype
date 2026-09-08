/* HLT-05 single-day oxygen demo. Automatic marks are discrete samples, not a
 * continuous-monitoring claim. Manual samples remain prototype demonstrations.
 * This module neither starts a hardware measurement nor owns persistence.
 */
(() => {
  const offset = 8 * 3600000;
  const fixture = [[30, 97], [120, 98], [300, 97], [510, 98], [740, 97], [1090, 98], [1290, 98]];
  const validDate = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
  const dateOf = timestamp => new Date(timestamp + offset).toISOString().slice(0, 10);
  const escape = value => String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
  function timestamp(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !validDate(value.slice(0, 10))) return NaN;
    const hour = Number(value.slice(11, 13)), minute = Number(value.slice(14, 16));
    return hour < 24 && minute < 60 ? Date.parse(value) : NaN;
  }
  function formatTime(value) {
    if (Number.isFinite(value) && value >= 0 && value <= 1440) {
      const minute = Math.floor(value);
      return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
    }
    const parsed = typeof value === "number" ? value : timestamp(value);
    return Number.isFinite(parsed) ? new Date(parsed + offset).toISOString().slice(11, 16) : "--:--";
  }
  function model({ date, recordDate, stage, active, scenario = "unknown", manualRecords = [], selection = null, now = Date.now() }) {
    const clock = Number.isFinite(now) ? now : Date.now();
    const selectedDate = validDate(date) ? date : dateOf(clock);
    const capability = ["supported", "unknown", "unsupported", "off", "quality"].includes(scenario) ? scenario : "unknown";
    const gate = !active ? "unbound" : capability === "unknown" ? "unknown" : capability === "unsupported" ? "unsupported" : "";
    const automaticReason = stage === "none" ? "none" : selectedDate === recordDate && capability === "off" ? "off" : selectedDate === recordDate && (capability === "quality" || stage === "limited") ? "quality" : "missing";
    const count = { interpretable: 7, limited: 7, baseline: 3, accumulating: 1 }[stage] || 0;
    const age = validDate(recordDate) ? (Date.parse(`${recordDate}T12:00:00Z`) - Date.parse(`${selectedDate}T12:00:00Z`)) / 86400000 : -1;
    const samples = [];
    if (!gate && automaticReason === "missing" && age >= 0 && age < count) {
      fixture.forEach(([minute, value]) => {
        const occurredAt = `${selectedDate}T${formatTime(minute)}:00+08:00`;
        if (timestamp(occurredAt) <= clock) samples.push({ id: `oxygen-auto:${selectedDate}:${minute}`, value, occurredAt, time: formatTime(minute), minute, kind: "automatic" });
      });
    }
    const ids = new Set(samples.map(sample => sample.id));
    if (!gate && Array.isArray(manualRecords)) manualRecords.forEach(record => {
      if (!record || typeof record.id !== "string" || !record.id.trim() || ids.has(record.id) || record.source !== "prototype-demo" || record.type !== "oxygen" || record.quality !== "valid" || !Number.isFinite(record.value) || record.value < 0 || record.value > 100) return;
      const parsed = timestamp(record.occurredAt);
      if (!Number.isFinite(parsed) || parsed > clock || dateOf(parsed) !== selectedDate) return;
      ids.add(record.id);
      const local = new Date(parsed + offset);
      samples.push({ id: record.id, value: record.value, occurredAt: record.occurredAt, time: formatTime(record.occurredAt), minute: local.getUTCHours() * 60 + local.getUTCMinutes() + local.getUTCSeconds() / 60, kind: "manual" });
    });
    samples.sort((left, right) => timestamp(left.occurredAt) - timestamp(right.occurredAt) || (left.kind === right.kind ? left.id.localeCompare(right.id) : left.kind === "manual" ? 1 : -1));
    const latest = samples.at(-1) || null;
    const selected = selection?.date === selectedDate ? samples.find(sample => sample.id === selection.id) || latest : latest;
    return { date: selectedDate, samples, latest, selected, reason: samples.length ? "data" : gate || automaticReason, source: "示例数据", version: "oxygen-day-v1" };
  }
  const kindLabel = sample => sample.kind === "manual" ? "主动测量" : "自动记录";
  const valueLabel = sample => `${Number(sample.value.toFixed(1))}%`;
  function render(data) {
    if (!data.samples.length) return "";
    const sample = data.selected || data.latest;
    return `<section class="oxygen-day" aria-labelledby="oxygen-day-title"><header><h2 id="oxygen-day-title">当天血氧记录</h2><span class="oxygen-day-badge">示例数据</span></header><p class="oxygen-day-subtitle">每个点代表一条记录</p><div class="oxygen-day-readout" aria-live="polite" aria-atomic="true"><div><time data-oxygen-day-time datetime="${escape(sample.occurredAt)}">${escape(sample.time)}</time><span data-oxygen-day-kind>${kindLabel(sample)}</span></div><strong data-oxygen-day-value>${valueLabel(sample)}</strong></div><svg id="oxygen-day-plot" class="oxygen-day-plot" role="slider" tabindex="0" aria-label="选择当天的一条血氧记录" aria-describedby="oxygen-day-hint oxygen-day-caption" aria-orientation="horizontal" aria-valuemin="0" aria-valuemax="${data.samples.length - 1}"></svg><div class="oxygen-day-legend" aria-label="记录来源"><span><i class="oxygen-day-key-automatic" aria-hidden="true"></i>自动记录</span><span><i class="oxygen-day-key-manual" aria-hidden="true"></i>主动测量</span></div><p id="oxygen-day-hint" class="oxygen-day-hint">点按或左右拖动查看</p><div class="oxygen-day-controls"><button id="oxygen-day-previous" type="button" data-oxygen-day-step="previous" aria-label="上一条血氧记录">‹ 上一条</button><button id="oxygen-day-latest" type="button" data-oxygen-day-step="latest" aria-label="最近一条血氧记录">最近</button><button id="oxygen-day-next" type="button" data-oxygen-day-step="next" aria-label="下一条血氧记录">下一条 ›</button></div><p id="oxygen-day-caption" class="oxygen-day-caption">曲线仅连接自动记录，不代表持续测量</p></section>`;
  }
  function mount(root, { data, onSelect }) {
    const chart = root.querySelector(".oxygen-day");
    if (!chart || !data.samples.length) return () => {};
    const svg = chart.querySelector("svg");
    const buttons = ["previous", "next", "latest"].map(name => chart.querySelector(`[data-oxygen-day-step="${name}"]`));
    const last = data.samples.length - 1;
    let selected = Math.max(0, data.samples.findIndex(sample => sample.id === data.selected?.id));
    let committed = selected, width = 0, gesture = null, disposed = false;
    const lower = Math.max(0, Math.min(90, Math.floor(Math.min(...data.samples.map(sample => sample.value)) / 10) * 10));
    const x = minute => 32 + minute / 1440 * (width - 46);
    const y = value => 151 - (value - lower) / (100 - lower) * 120;
    function paint() {
      if (disposed) return;
      width = Math.max(180, chart.clientWidth);
      svg.setAttribute("viewBox", `0 0 ${width} 184`);
      const axes = [lower, (lower + 100) / 2, 100].map(value => `<line class="oxygen-day-grid" x1="32" x2="${width - 14}" y1="${y(value)}" y2="${y(value)}"/><text x="25" y="${y(value) + 4}" text-anchor="end">${value}</text>`).join("") + [0, 360, 720, 1080, 1440].map(minute => `<text x="${x(minute)}" y="176" text-anchor="${minute === 0 ? "start" : minute === 1440 ? "end" : "middle"}">${formatTime(minute).slice(0, 2)}</text>`).join("");
      const automatic = data.samples.filter(sample => sample.kind === "automatic");
      // Visual interpolation only: control points stay inside both endpoint
      // values, so smoothing cannot invent peaks. Do not connect manual results
      // or extrapolate beyond the first/last automatic record.
      const curve = automatic.length > 1 ? `<path class="oxygen-day-curve" d="${automatic.map((point, index) => {
        const previous = automatic[index - 1];
        if (!previous || point.minute <= previous.minute) return `M ${x(point.minute)} ${y(point.value)}`;
        const midpoint = (x(previous.minute) + x(point.minute)) / 2;
        return `C ${midpoint} ${y(previous.value)} ${midpoint} ${y(point.value)} ${x(point.minute)} ${y(point.value)}`;
      }).join(" ")}"/>` : "";
      const dot = (point, index) => point.kind === "manual"
        ? `<rect class="oxygen-day-dot oxygen-day-manual" data-oxygen-day-index="${index}" x="${x(point.minute) - 3.5}" y="${y(point.value) - 3.5}" width="7" height="7" transform="rotate(45 ${x(point.minute)} ${y(point.value)})"/>`
        : `<circle class="oxygen-day-dot oxygen-day-automatic" data-oxygen-day-index="${index}" cx="${x(point.minute)}" cy="${y(point.value)}" r="3.2"/>`;
      // Keep equal-time records at their actual time; selected marks paint last.
      const dots = data.samples.map((point, index) => index === selected ? "" : dot(point, index)).join("") + dot(data.samples[selected], selected);
      const sample = data.samples[selected];
      const cursor = `<line class="oxygen-day-cursor" x1="${x(sample.minute)}" x2="${x(sample.minute)}" y1="27" y2="155"/><circle class="oxygen-day-selected" cx="${x(sample.minute)}" cy="${y(sample.value)}" r="8"/>`;
      svg.innerHTML = `<title>${data.date} 血氧示例，横轴为北京时间，纵轴为百分比。每个点是一次有效记录；曲线仅连接自动记录帮助查看变化，不代表连续监测或两点间的实际读数。主动测量单独标点。</title><text x="32" y="14">%</text>${axes}${curve}${dots}${cursor}`;
      const time = chart.querySelector("[data-oxygen-day-time]");
      time.textContent = sample.time; time.dateTime = sample.occurredAt;
      chart.querySelector("[data-oxygen-day-kind]").textContent = kindLabel(sample);
      chart.querySelector("[data-oxygen-day-value]").textContent = valueLabel(sample);
      svg.setAttribute("aria-valuenow", String(selected));
      svg.setAttribute("aria-valuetext", `${data.date} ${sample.time}，${valueLabel(sample)}，${kindLabel(sample)}，示例数据`);
      buttons[0].disabled = selected === 0; buttons[1].disabled = selected === last; buttons[2].disabled = selected === last;
    }
    function select(index, commit = false) {
      if (!Number.isInteger(index) || index < 0 || index > last) return;
      if (selected !== index) { selected = index; paint(); }
      if (commit && committed !== index) {
        committed = index;
        if (typeof onSelect === "function") onSelect({ date: data.date, id: data.samples[index].id });
      }
    }
    function selectAt(clientX, clientY, byTime = false) {
      const box = svg.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const px = (clientX - box.left) * width / box.width, py = (clientY - box.top) * 184 / box.height;
      let nearest = 0, distance = Infinity;
      data.samples.forEach((sample, index) => {
        const score = Math.abs(x(sample.minute) - px) ** 2 + (byTime ? 0 : Math.abs(y(sample.value) - py) ** 2);
        if (score < distance) { distance = score; nearest = index; }
      });
      select(nearest);
    }
    function selectTarget(event) {
      const mark = event.target.closest?.(".oxygen-day-dot");
      if (mark && svg.contains(mark)) select(Number(mark.dataset.oxygenDayIndex));
      else selectAt(event.clientX, event.clientY);
    }
    const down = event => {
      if (event.isPrimary === false || event.button !== 0) return;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, original: selected, horizontal: false, canceled: false };
      if (event.pointerType === "mouse") selectTarget(event);
    };
    const move = event => {
      if (!gesture || gesture.id !== event.pointerId || gesture.canceled) return;
      const dx = Math.abs(event.clientX - gesture.x), dy = Math.abs(event.clientY - gesture.y);
      if (!gesture.horizontal && dy > 8 && dy > dx) { gesture.canceled = true; select(gesture.original); return; }
      if (!gesture.horizontal && dx > 8 && dx > dy) { gesture.horizontal = true; svg.setPointerCapture?.(event.pointerId); }
      if (gesture.horizontal) selectAt(event.clientX, event.clientY, true);
    };
    const up = event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const current = gesture; gesture = null;
      if (!current.canceled) { if (current.horizontal) selectAt(event.clientX, event.clientY, true); else selectTarget(event); select(selected, true); }
    };
    const cancel = () => { if (gesture) { const original = gesture.original; gesture = null; select(original); } };
    const key = event => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
      event.preventDefault(); event.stopPropagation();
      const index = event.key === "Home" ? 0 : event.key === "End" ? last : Math.max(0, Math.min(last, selected + (["ArrowLeft", "ArrowDown"].includes(event.key) ? -1 : 1)));
      select(index, true);
    };
    const click = event => {
      const action = event.target.closest("[data-oxygen-day-step]")?.dataset.oxygenDayStep;
      if (action) select(action === "latest" ? last : Math.max(0, Math.min(last, selected + (action === "previous" ? -1 : 1))), true);
    };
    svg.addEventListener("pointerdown", down); svg.addEventListener("pointermove", move);
    svg.addEventListener("pointerup", up); svg.addEventListener("pointercancel", cancel); svg.addEventListener("keydown", key);
    chart.addEventListener("click", click);
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(paint) : null;
    observer?.observe(chart); paint();
    return () => {
      disposed = true; observer?.disconnect(); gesture = null;
      svg.removeEventListener("pointerdown", down); svg.removeEventListener("pointermove", move);
      svg.removeEventListener("pointerup", up); svg.removeEventListener("pointercancel", cancel); svg.removeEventListener("keydown", key);
      chart.removeEventListener("click", click);
    };
  }
  window.HALO_OXYGEN_DAY = { model, render, mount, formatTime };
})();
