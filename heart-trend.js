/* HLT-01: deterministic illustrative samples, never a hardware feed.
 * Segment ids explicitly mark fixture continuity; no inferred clinical gap threshold.
 * Resting tags are supplied fixture classifications, not an app classification algorithm.
 */
(() => {
  const minutes = time => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
  const timeLabel = minute => `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
  const groups = [
    { id: "night-a", resting: "night", values: [["00:08",62],["00:23",60],["00:38",59],["00:53",58],["01:08",56],["01:23",57],["01:38",58],["01:53",55],["02:08",56]] },
    { id: "night-b", resting: "night", values: [["03:08",56],["03:23",58],["03:38",57],["03:53",56],["04:08",58],["04:23",59],["04:38",60],["04:53",57],["05:08",58],["05:23",60],["05:38",58]] },
    { id: "morning", resting: "day", values: [["06:08",60],["06:23",61],["06:38",62]] },
    { id: "day", resting: null, values: [["07:08",84],["07:23",78],["07:38",70],["08:08",74],["08:23",76],["08:38",72]] },
  ];
  const fixture = groups.flatMap(group => group.values.map(([time, value]) => ({ time, minute: minutes(time), value, segment: group.id, resting: group.resting })));
  function model({ date, recordDate, stage, active, now = Date.now() }) {
    const eligible = active && date === recordDate && ["accumulating", "baseline", "interpretable", "limited"].includes(stage);
    const partial = stage === "limited";
    const samples = (eligible ? partial ? fixture.slice(-1) : fixture : []).map(point => ({ ...point, occurredAt: `${date}T${point.time}:00+08:00` })).filter(point => Date.parse(point.occurredAt) <= now);
    const average = kind => {
      const points = samples.filter(point => point.resting === kind);
      return points.length ? Math.round(points.reduce((sum, point) => sum + point.value, 0) / points.length) : null;
    };
    return { date, samples, latest: samples.at(-1) || null, partial, resting: { day: average("day"), night: average("night") }, source: "示例数据", version: "heart-day-v1" };
  }
  function inspect(data, selection) {
    const last = data.latest;
    if (!last) return null;
    const minute = selection?.date === data.date && Number.isInteger(selection.minute) && selection.minute >= 0 && selection.minute <= 1440 ? selection.minute : last.minute;
    const exact = data.samples.find(point => point.minute === minute);
    return exact ? { ...exact, missing: false } : { minute, time: timeLabel(minute), value: null, missing: true };
  }
  function nearestInSegment(data, minute) {
    for (const segment of new Set(data.samples.map(point => point.segment))) {
      const points = data.samples.filter(point => point.segment === segment);
      if (minute >= points[0].minute && minute <= points.at(-1).minute) return points.reduce((near, point) => Math.abs(point.minute - minute) < Math.abs(near.minute - minute) ? point : near).minute;
    }
    // Single points still have a usable nearest-point target; long gaps stay empty.
    const near = data.samples.reduce((best, point) => Math.abs(point.minute - minute) < Math.abs(best.minute - minute) ? point : best);
    return Math.abs(near.minute - minute) <= 5 ? near.minute : minute;
  }
  function render(data) {
    if (!data.latest) return "";
    return `<section class="heart-trend" aria-labelledby="heart-trend-title"><header><h2 id="heart-trend-title">当日心率变化</h2><span class="heart-trend-badge">示例数据</span></header><div class="heart-trend-readout" aria-live="polite" aria-atomic="true"><span>图中选中 <time data-heart-time></time></span><strong data-heart-value></strong></div><svg id="heart-trend-plot" class="heart-trend-plot" role="slider" tabindex="0" aria-label="选择心率记录" aria-describedby="heart-trend-hint" aria-orientation="horizontal" aria-valuemin="0" aria-valuemax="1440"></svg><div class="heart-trend-controls"><button type="button" data-heart-step="previous" aria-label="上一条心率记录">‹</button><p id="heart-trend-hint">${data.samples.length === 1 ? "仅一条记录，暂不连成曲线" : "点按或左右拖动查看"}</p><button type="button" data-heart-step="next" aria-label="下一条心率记录">›</button><button type="button" data-heart-step="latest">最近</button></div><p class="heart-trend-caption">空白处暂无记录</p></section>`;
  }
  function mount(root, { data, selection, onSelect }) {
    const chart = root.querySelector(".heart-trend");
    if (!chart || !data.latest) return () => {};
    const svg = chart.querySelector("svg");
    const previous = chart.querySelector('[data-heart-step="previous"]');
    const next = chart.querySelector('[data-heart-step="next"]');
    const latest = chart.querySelector('[data-heart-step="latest"]');
    let selected = inspect(data, selection), width = 0, gesture = null;
    const x = minute => 31 + minute / 1440 * (width - 43);
    const y = value => 143 - (value - 40) / 60 * 117;
    const stepTarget = direction => direction < 0 ? data.samples.filter(point => point.minute < selected.minute).at(-1) : data.samples.find(point => point.minute > selected.minute);
    function paint() {
      width = Math.max(180, chart.clientWidth);
      svg.setAttribute("viewBox", `0 0 ${width} 175`);
      const ticks = width < 300 ? [0, 480, 960, 1440] : [0, 360, 720, 1080, 1440];
      const axes = [40,60,80,100].map(value => `<line x1="31" x2="${width - 12}" y1="${y(value)}" y2="${y(value)}" class="heart-trend-grid"/><text x="23" y="${y(value) + 4}" text-anchor="end">${value}</text>`).join("") + ticks.map(minute => `<text x="${x(minute)}" y="167" text-anchor="${minute === 0 ? "start" : minute === 1440 ? "end" : "middle"}">${String(minute / 60).padStart(2,"0")}:00</text>`).join("");
      const paths = [...new Set(data.samples.map(point => point.segment))].map(segment => {
        const points = data.samples.filter(point => point.segment === segment);
        return points.length < 2 ? "" : `<polyline class="heart-trend-line" data-heart-segment="${segment}" points="${points.map(point => `${x(point.minute)},${y(point.value)}`).join(" ")}"/>`;
      }).join("");
      const dots = data.samples.map(point => `<circle class="heart-trend-dot" data-heart-minute="${point.minute}" data-heart-value="${point.value}" cx="${x(point.minute)}" cy="${y(point.value)}" r="2"/>`).join("");
      const indicator = `<line class="heart-trend-cursor" x1="${x(selected.minute)}" x2="${x(selected.minute)}" y1="22" y2="147"/>${selected.missing ? "" : `<circle class="heart-trend-selected" cx="${x(selected.minute)}" cy="${y(selected.value)}" r="4.5"/>`}`;
      svg.innerHTML = `<title>${data.date} 心率示例记录，单位次/分。未记录时段留空。</title><text x="31" y="12">次/分</text>${axes}${paths}${dots}${indicator}`;
      chart.querySelector("[data-heart-time]").textContent = selected.time;
      chart.querySelector("[data-heart-value]").textContent = selected.missing ? "暂无记录" : `${selected.value} 次/分`;
      svg.setAttribute("aria-valuenow", String(selected.minute));
      svg.setAttribute("aria-valuetext", `${data.date} ${selected.time}，${selected.missing ? "暂无记录" : `${selected.value} 次/分`}，示例数据`);
      previous.disabled = !stepTarget(-1); next.disabled = !stepTarget(1);
      latest.disabled = selected.minute === data.latest.minute;
    }
    function select(minute) {
      if (selected.minute === minute) return;
      selected = inspect(data, { date: data.date, minute });
      paint(); onSelect({ date: data.date, minute: selected.minute });
    }
    function selectAt(clientX) {
      const box = svg.getBoundingClientRect();
      const local = (clientX - box.left) * width / box.width;
      const minute = Math.round(Math.max(0, Math.min(1440, (local - 31) / (width - 43) * 1440)));
      select(nearestInSegment(data, minute));
    }
    const down = event => {
      if (event.isPrimary === false || event.button !== 0) return;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, horizontal: false, canceled: false };
      if (event.pointerType === "mouse") selectAt(event.clientX);
    };
    const move = event => {
      if (!gesture || event.pointerId !== gesture.id || gesture.canceled) return;
      const dx = Math.abs(event.clientX - gesture.x), dy = Math.abs(event.clientY - gesture.y);
      if (!gesture.horizontal && dy > 8 && dy > dx) { gesture.canceled = true; return; }
      if (!gesture.horizontal && dx > 8 && dx > dy) { gesture.horizontal = true; svg.setPointerCapture?.(event.pointerId); }
      if (gesture.horizontal) selectAt(event.clientX);
    };
    const up = event => { if (gesture?.id === event.pointerId && !gesture.canceled) selectAt(event.clientX); gesture = null; };
    const cancel = () => { gesture = null; };
    const key = event => {
      if (!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(event.key)) return;
      event.preventDefault(); event.stopPropagation();
      const target = event.key === "Home" ? data.samples[0] : event.key === "End" ? data.latest : stepTarget(["ArrowLeft","ArrowDown"].includes(event.key) ? -1 : 1);
      if (target) select(target.minute);
    };
    const click = event => {
      const operation = event.target.closest("[data-heart-step]")?.dataset.heartStep;
      if (!operation) return;
      const target = operation === "latest" ? data.latest : stepTarget(operation === "previous" ? -1 : 1);
      if (target) select(target.minute);
    };
    svg.addEventListener("pointerdown", down); svg.addEventListener("pointermove", move);
    svg.addEventListener("pointerup", up); svg.addEventListener("pointercancel", cancel); svg.addEventListener("keydown", key);
    chart.addEventListener("click", click);
    const observer = new ResizeObserver(() => paint()); observer.observe(chart);
    paint();
    return () => { observer.disconnect(); gesture = null; svg.removeEventListener("pointerdown", down); svg.removeEventListener("pointermove", move); svg.removeEventListener("pointerup", up); svg.removeEventListener("pointercancel", cancel); svg.removeEventListener("keydown", key); chart.removeEventListener("click", click); };
  }
  window.HALO_HEART_TREND = { model, inspect, render, mount };
})();
