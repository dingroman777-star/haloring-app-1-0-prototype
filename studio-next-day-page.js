(() => {
  "use strict";
  window.createHaloStudioNextDay = function ({ state, report, event, media, go, render, esc, icon, screen, flash }) {
    const DAY = 86400000;
    const id = () => state.selectedStudioEventId;
    const record = () => state.studioRecords?.[id()];
    const account = () => String(state.authPhone || state.authForm?.phone || "local-demo");
    const text = value => typeof value === "string" && Boolean(value.trim());
    const timestamp = value => text(value) && /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? Date.parse(value) : NaN;
    const day = value => new Date(value + 8 * 3600000).toISOString().slice(0, 10);
    const scope = () => JSON.stringify([id(), account(), record()?.bookingId, record()?.sessionId, record()?.startedAt, record()?.completedAt]);
    const available = () => report.canReport(record()) && record()?.reportStatus === "generated";
    const button = (label, action, cls = "studio-next-link") => `<button type="button" class="${cls}" data-action="stunext-${action}">${esc(label)}</button>`;
    const dateLabel = value => `${Number(value.slice(5, 7))}月${Number(value.slice(8, 10))}日`;
    const fullDate = value => `${value.slice(0, 4)}年${dateLabel(value)}`;
    const minutesLabel = value => `${Math.floor(value / 60) ? `${Math.floor(value / 60)}小时` : ""}${value % 60 ? `${value % 60}分钟` : ""}`;
    const validMinutes = value => Number.isInteger(value) && value > 0 && value <= 1440;
    let lastView = "", shownScope = "", feedback = "", feedbackScope = "";

    function model(r = record(), eventId = id()) {
      const completed = timestamp(r?.completedAt), now = Date.now();
      const result = (kind, title, note, extra = {}) => ({ kind, title, note, ...extra });
      if (!Number.isFinite(completed) || completed > now || completed < 0) return result("invalid", "活动时间需要核对", "暂时无法确定回顾日期，原参与记录仍然保留。");
      const completedDate = day(completed), target = day(completed + DAY), dates = { completedDate, target };
      if (day(now) < target) return result("waiting", "等到次日再回看", "回顾会结合活动后的睡眠和身体记录，有足够记录时才会展示。", dates);
      const empty = () => result("empty", "还没有这一天的身体记录", "已保存本次活动，稍后可再回来查看。", dates);
      const snapshot = r?.nextDayReport;
      if (!snapshot) return empty();
      const generated = timestamp(snapshot.generatedAt);
      // Read a dated, scoped report receipt only. Global today's sample values are not an activity report.
      const matches = snapshot.version === 1 && snapshot.eventId === eventId && snapshot.bookingId === r.bookingId
        && text(r.sessionId) && snapshot.sessionId === r.sessionId && snapshot.accountRef === account()
        && snapshot.completedAt === r.completedAt && snapshot.reportDate === target && text(snapshot.sourceId)
        && typeof snapshot.simulated === "boolean" && Number.isFinite(generated) && generated <= now && day(generated) >= target;
      if (!matches) return result("unmatched", "这份回顾暂时无法查看", "记录还需要核对，原参与记录没有改变。", dates);
      const insufficient = () => result("insufficient", "这一天的记录还不够完整", "暂时不能形成完整回顾，原参与记录仍然保留。", { ...dates, simulated: snapshot.simulated });
      if (snapshot.status !== "ready") return snapshot.status === "insufficient" ? insufficient() : result("unmatched", "这份回顾暂时无法查看", "记录还需要核对，原参与记录没有改变。", dates);
      const sleep = snapshot.sleep, weather = snapshot.bodyWeather, baseline = snapshot.baseline;
      const start = timestamp(sleep?.startAt), end = timestamp(sleep?.endAt);
      if (!sleep || sleep.quality !== "complete" || !text(sleep.sourceId) || !validMinutes(sleep.minutes)
        || !Number.isFinite(start) || !Number.isFinite(end) || start < completed || end <= start || end > generated
        || day(end) !== target || sleep.minutes > (end - start) / 60000
        || weather?.date !== target || !text(weather.sourceId) || !text(weather.label) || weather.label.length > 40
        || baseline?.ready !== true || !text(baseline.sourceId) || !validMinutes(baseline.sleepMinutes)) return insufficient();
      return result("ready", `${dateLabel(target)}的回顾`, "看看这一天的睡眠和身体状态。", { ...dates, snapshot, simulated: snapshot.simulated });
    }
    function viewKey(fresh, value) { return JSON.stringify([fresh, available(), scope(), value, navigator.onLine]); }
    function comparison(snapshot) {
      const value = snapshot.sleep.minutes, usual = snapshot.baseline.sleepMinutes, difference = value - usual;
      const label = difference === 0 ? "与平时相同" : `比平时${difference > 0 ? "多" : "少"}${Math.abs(difference)}分钟`;
      const max = Math.max(value, usual);
      return { label, html: `<figure class="studio-next-comparison" aria-label="睡眠时长比较：本次${esc(minutesLabel(value))}，平时${esc(minutesLabel(usual))}"><figcaption>睡眠时长对比</figcaption>${[["本次", value], ["平时", usual]].map(([name, minutes]) => `<div><span>${name}</span><div class="studio-next-bar" aria-hidden="true"><i style="width:${minutes / max * 100}%"></i></div><span>${esc(minutesLabel(minutes))}</span></div>`).join("")}</figure>` };
    }
    function metric(name, glyph, value, content, key) {
      const paths = { moon: '<path d="M20.5 13.5A9 9 0 0 1 10.5 3a9 9 0 1 0 10 10.5Z"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>', chart: '<path d="M3 13h4v8H3Zm7-10h4v18h-4Zm7 6h4v12h-4Z"/>' };
      const symbol = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[glyph]}</svg>`;
      return `<details class="studio-next-metric studio-detail-info" data-next-metric="${key}"><summary>${symbol}<span>${name}</span><strong>${esc(value)}</strong>${icon("arrow")}</summary><div class="studio-next-metric-content">${content}</div></details>`;
    }
    function page() {
      const fresh = report.prepare(), allowed = fresh && available(), value = model();
      shownScope = scope(); lastView = viewKey(fresh, value);
      const status = allowed ? value : { kind: "blocked", title: "暂时无法读取这份回顾", note: "已有记录没有改变，请重试读取。" };
      const e = allowed ? event(id()) : null, ready = status.kind === "ready", snapshot = status.snapshot;
      const none = status.kind === "waiting" ? "尚未到回顾日" : status.kind === "insufficient" ? "记录不足" : "暂无记录";
      const compare = ready ? comparison(snapshot) : null;
      const metrics = allowed ? `<section class="studio-next-metrics" aria-label="回顾内容">${metric("睡眠记录", "moon", ready ? minutesLabel(snapshot.sleep.minutes) : none, ready ? `<p>来源：${snapshot.simulated ? "示例戒指记录" : "Halo Ring"} · ${esc(fullDate(status.target))}</p><p>${esc(new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(timestamp(snapshot.sleep.startAt)))}—${esc(new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(timestamp(snapshot.sleep.endAt)))}</p>` : '<p>这里会显示活动后对应睡眠的记录。没有完整记录时，不补填睡眠时长。</p>', "sleep")}${metric("身体天气", "sun", ready ? snapshot.bodyWeather.label : none, ready ? `<p>来源：${snapshot.simulated ? "示例身体天气" : "身体天气报告"} · ${esc(fullDate(status.target))}</p><p>这是这一天已保存的状态，不会替换成今天的状态。</p>` : '<p>暂时没有这一天可查看的身体天气。</p>', "weather")}${metric("与平时相比", "chart", ready ? compare.label : "暂不能比较", ready ? `${compare.html}<p>参考已保存的个人睡眠基线，仅比较睡眠时长，不代表活动效果。</p>` : '<p>有完整睡眠记录和个人基线后，才能进行比较。</p>', "baseline")}</section>` : "";
      return `<article class="studio-next-day studio-detail" data-next-status="${status.kind}"><div class="studio-detail-scroll" tabindex="0" aria-label="本次活动次日回顾"><header class="studio-detail-header"><button type="button" data-action="stunext-back" aria-label="返回课后报告">${icon("back")}</button><h1>次日回顾</h1>${button("Studio", "home")}</header>${e ? `<div class="studio-booking-event studio-next-event">${media(id()) ? `<img src="${media(id())}" width="64" height="64" alt="${esc(e.category)}场地示意图">` : ""}<div><h2>${esc(e.title)}</h2><p>${esc(e.date)}</p><p>${esc(e.place)} · ${esc(e.duration)}分钟</p></div></div>` : ""}${allowed && status.target ? `<div class="studio-next-dates" aria-label="北京时间活动结束与回顾日期"><div>${icon("calendar")}<span>活动结束<time datetime="${status.completedDate}">${esc(fullDate(status.completedDate))}</time></span></div>${icon("arrow")}<div><span>回顾日期<time datetime="${status.target}">${esc(fullDate(status.target))}</time></span></div></div>` : ""}<section class="studio-next-state"><h2>${esc(status.title)}</h2><p>${esc(status.note)}</p>${status.simulated ? '<p class="studio-next-demo">示例记录 · 非真实身体数据</p>' : ""}${navigator.onLine === false ? '<p>当前离线，只查看已保存的记录。</p>' : ""}</section>${metrics}<details class="studio-next-explanation studio-detail-info"><summary>查看说明${icon("arrow")}</summary><p>回看活动后的睡眠与第二天状态。记录齐全后才能形成回顾，不会因为到了第二天就自动补出数据。</p><p>睡眠和身体状态也会受日常作息等因素影响，不能用一次变化判断活动效果。</p><p>回顾日期按北京时间显示。睡眠时段以这份报告的记录为准。</p>${button("重新读取本机记录", "reload", "secondary")}<p class="studio-next-feedback" role="status">${feedbackScope === shownScope ? esc(feedback) : ""}</p></details>${allowed ? `<nav class="studio-next-links" aria-label="本次活动相关内容"><button type="button" data-action="stunext-record">${icon("report")}<span>本次记录</span>${icon("arrow")}</button><button type="button" data-action="stunext-benefits">${icon("ticket")}<span>活动权益</span>${icon("arrow")}</button></nav>` : button("重试读取", "reload", "secondary")}</div><footer class="studio-detail-footer">${button("返回课后报告", "back", "primary")}</footer></article>`;
    }
    function handle(action) {
      if (!action.startsWith("stunext-")) return false;
      if (state.current !== "STU-06") return true;
      const before = shownScope;
      if (!report.prepare()) { feedback = "暂时无法读取本机记录，请稍后重试。"; feedbackScope = scope(); render(); flash(feedback); return true; }
      if (before !== scope()) { feedback = "本次记录有更新，请核对后继续。"; feedbackScope = scope(); render(); flash(feedback); return true; }
      if (!available()) { go("STU-12"); return true; }
      if (action === "stunext-reload") { feedback = "已重新读取本机记录。"; feedbackScope = scope(); render(); flash(feedback); return true; }
      const targets = { "stunext-back": "STU-05", "stunext-home": "STU-08", "stunext-record": "STU-15", "stunext-benefits": "STU-13" };
      if (targets[action]) go(targets[action]);
      return true;
    }
    function refresh() {
      if (document.hidden || state.current !== "STU-06") return;
      const fresh = report.prepare();
      if (viewKey(fresh, model()) !== lastView) render();
    }
    setInterval(refresh, 750);
    window.addEventListener("online", refresh); window.addEventListener("offline", refresh);
    window.addEventListener("storage", refresh); document.addEventListener("visibilitychange", refresh);
    return { page, handle, model };
  };
})();
