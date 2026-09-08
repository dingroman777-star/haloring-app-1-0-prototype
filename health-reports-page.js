(function () {
  window.createHaloHealthReports = function ({ state, pages, go, render, write, persist, track, esc, screen, symbol, active, today }) {
    const clone = value => JSON.parse(JSON.stringify(value));
    const object = value => value && typeof value === "object" && !Array.isArray(value);
    const owner = () => window.HaloTodayRhythm.ownerKey(state);
    const blank = () => ({ ledger: null, request: null, reports: [], view: { panel: "home", id: "", top: 0 }, entry: null, positions: {} });
    let error = "", timer = null, storageBlocked = false, demoOutcome = "success";
    const query = new URLSearchParams(location.search).get("reportPreview");
    const scenarios = ["collecting", "ready", "failed", "monthly"];
    let demo = scenarios.includes(query);
    const mode = () => demo ? "demo" : owner();
    function book() {
      if (!object(state.healthReports)) state.healthReports = { accounts: {} };
      if (!object(state.healthReports.accounts)) state.healthReports.accounts = {};
      let value = demo ? state.healthReportsDemo : state.healthReports.accounts[owner()];
      if (!object(value)) {
        value = blank();
        if (demo) state.healthReportsDemo = value;
        else state.healthReports.accounts[owner()] = value;
      }
      if (!Array.isArray(value.reports)) value.reports = [];
      if (!object(value.view)) value.view = blank().view;
      if (!["home", "nights", "report"].includes(value.view.panel)) value.view = blank().view;
      if (!object(value.positions)) value.positions = {};
      if (!object(value.entry)) value.entry = null;
      return value;
    }
    function commit(next) {
      const changes = demo ? { healthReportsDemo: next } : { healthReports: { ...state.healthReports, accounts: { ...state.healthReports.accounts, [owner()]: next } } };
      if (!write(changes)) { storageBlocked = true; return false; }
      storageBlocked = false; return true;
    }
    function validDate(value) {
      return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value && value <= today();
    }
    function nights(value = book()) {
      if (value.ledger?.status !== "ready" || !value.ledger.ruleVersion || !Array.isArray(value.ledger.nights)) return null;
      const unique = new Map();
      value.ledger.nights.filter(item => object(item) && item.id && validDate(item.date) && ["valid", "incomplete", "pending"].includes(item.status)).forEach(item => {
        const old = unique.get(item.date);
        const posted = Date.parse(item.postedAt), previous = Date.parse(old?.postedAt);
        if (!old || Number.isFinite(posted) && (!Number.isFinite(previous) || posted > previous)) unique.set(item.date, item);
        else if (old.status !== item.status && (posted === previous || !Number.isFinite(posted) && !Number.isFinite(previous))) unique.set(item.date, { ...old, status: "pending", reason: "等待记录确认" });
      });
      return [...unique.values()].sort((a, b) => a.date.localeCompare(b.date));
    }
    const validNights = value => (nights(value) || []).filter(item => item.status === "valid");
    const blocked = () => state.healthDeletionStatus && state.healthDeletionStatus !== "ready";
    const availableReports = () => book().reports.filter(item => object(item) && item.id && item.status === "ready" && ["first14", "monthly"].includes(item.type) && validDate(item.range?.start) && validDate(item.range?.end) && item.range.start <= item.range.end && Number.isFinite(Date.parse(item.generatedAt)) && item.ruleVersion);
    const firstReport = () => availableReports().find(item => item.type === "first14");
    function fail(message) { error = message; render(); screen.querySelector(".reports-error")?.focus(); }
    function dateLabel(value) { return validDate(value) ? `${Number(value.slice(5, 7))}月${Number(value.slice(8))}日` : "日期待确认"; }
    const rangeLabel = range => `${range.start.slice(0, 4)}年 ${dateLabel(range.start)} — ${dateLabel(range.end)}`;
    function snapshot(request, type = "first14", range) {
      const included = clone(request.nights);
      return { id: request.reportId, type, status: "ready", title: type === "first14" ? "我的首份 14 晚报告" : "8 月健康回顾", range: range || { start: included[0].date, end: included.at(-1).date }, generatedAt: new Date().toISOString(), ruleVersion: request.ruleVersion, nights: included, sourceChanged: false, simulated: true };
    }
    function fixture(scenario) {
      const value = blank();
      const minutes = [402, 427, 415, 390, 440, 408, 432, 417, 401, 428, 420, 405, 438, 412, 429, 422];
      const count = scenario === "collecting" ? 11 : 16;
      value.ledger = { status: "ready", ruleVersion: "demo-valid-night-v1", source: "review-fixture", receivedAt: "2026-09-07T08:42:00+08:00", nights: Array.from({ length: count }, (_, index) => {
        const date = new Date(Date.UTC(2026, 7, 22 + index)).toISOString().slice(0, 10);
        const incomplete = [3, 8].includes(index);
        return { id: `demo-night-${date}`, date, status: incomplete ? "incomplete" : "valid", postedAt: `${date}T09:00:00+08:00`, reason: incomplete ? "夜间记录有缺口" : "", ...(incomplete ? {} : { sleepMinutes: minutes[index] }) };
      }) };
      if (scenario === "failed") value.request = { id: "demo-first14-request", reportId: "demo-first14-report", status: "failed", startedAt: "2026-09-07T08:42:00+08:00", readyAt: 0, outcome: "failed", attempts: 1, ruleVersion: value.ledger.ruleVersion, nights: validNights(value).slice(0, 14) };
      if (scenario === "monthly") {
        // An explicit sample report receipt, not a front-end monthly eligibility rule.
        const included = validNights(value).map((item, index) => ({ ...item, date: `2026-08-${String(index + 1).padStart(2, "0")}`, id: `demo-month-night-${index + 1}` }));
        value.reports.push(snapshot({ reportId: "demo-month-2026-08", ruleVersion: "demo-month-receipt-v1", nights: included }, "monthly", { start: "2026-08-01", end: "2026-08-31" }));
        value.ledger = null;
      }
      value.scenario = scenario;
      return value;
    }
    if (demo && (!object(state.healthReportsDemo) || state.healthReportsDemo.scenario !== query)) state.healthReportsDemo = fixture(query);
    function capture() {
      if (screen.dataset.page !== "TOD-09" || state.current !== "TOD-09") return;
      const value = book(), key = `${value.view.panel}:${value.view.id || ""}`;
      value.view.top = screen.scrollTop;
      value.positions[key] = screen.scrollTop;
    }
    function context() { return { mode: mode(), view: clone(book().view), entry: clone(book().entry) }; }
    function historyFields(target) { return target === "TOD-09" ? { healthReportContext: context() } : {}; }
    function enter(target, from) {
      if (state.current === "TOD-09") capture();
      if (target !== "TOD-09" || from === "TOD-09") return;
      // Device round trips belong to the existing report visit.
      if (book().externalRoute === from) { book().externalRoute = ""; return; }
      if (pages.some(item => item.id === from)) {
        book().entry = { route: from, healthDate: from === "HLT-00" ? state.healthSelectedDate : null };
        book().view = { panel: "home", id: "", top: 0 };
      }
      error = "";
    }
    function restore(target, saved) {
      if (target !== "TOD-09" || !object(saved)) return;
      if (saved.mode === "demo") demo = true;
      else if (saved.mode !== owner()) { book().view = blank().view; return; }
      else demo = false;
      if (object(saved.view) && ["home", "nights", "report"].includes(saved.view.panel)) book().view = clone(saved.view);
      if (object(saved.entry)) book().entry = clone(saved.entry);
      book().externalRoute = "";
      error = "";
    }
    function show(panel, id = "", push = true) {
      capture();
      const value = book();
      value.view = { panel, id, top: value.positions[`${panel}:${id}`] || 0 };
      error = "";
      if (push) history.pushState({ ...history.state, ...historyFields("TOD-09") }, "", location.href);
      else history.replaceState({ ...history.state, ...historyFields("TOD-09") }, "", location.href);
      render();
      screen.querySelector("h1")?.focus({ preventScroll: true });
    }
    function back() {
      capture();
      if (book().view.panel !== "home") {
        // Prefer the actual list/history entry; fall back for a restored direct detail.
        if (history.state?.healthReportContext?.view.panel !== "home" && history.length > 1 && book().detailFromList) { history.back(); return; }
        show("home", "", false); return;
      }
      const entry = book().entry;
      const target = entry && entry.route !== "TOD-09" && pages.some(item => item.id === entry.route) ? entry.route : "HLT-00";
      if (target === "HLT-00" && validDate(entry?.healthDate)) state.healthSelectedDate = entry.healthDate;
      const stack = state.tabStacks["TOD-01"];
      if (stack?.at(-1) === "TOD-09") stack.pop();
      persist();
      if (history.state?.trail?.at(-2) === target) history.back(); else go(target, false);
    }
    function backFromExternal() {
      if (!["DEV-10", "HLT-00"].includes(state.current) || book().externalRoute !== state.current || history.state?.trail?.at(-2) !== "TOD-09") return false;
      book().externalRoute = ""; persist(); history.back(); return true;
    }
    function begin(retry = false) {
      if (!demo || !state.signedIn || blocked() || firstReport()) return;
      const value = book(), eligible = validNights(value);
      if (eligible.length < 14 || value.request?.status === "generating" || value.request && !retry) return;
      const next = clone(value), prior = next.request;
      next.request = { id: prior?.id || "demo-first14-request", reportId: prior?.reportId || "demo-first14-report", status: "generating", startedAt: prior?.startedAt || new Date().toISOString(), readyAt: Date.now() + 1800, outcome: demoOutcome, attempts: (prior?.attempts || 0) + 1, ruleVersion: prior?.ruleVersion || value.ledger.ruleVersion, nights: prior?.nights || clone(eligible.slice(0, 14)) };
      if (!commit(next)) { error = "暂时无法保存生成进度，请重试。已有记录没有改变。"; return; }
      track("health_report_generation_started", { request_id: next.request.id, attempt: next.request.attempts, simulated: true });
      error = "";
    }
    function resume() {
      clearTimeout(timer); timer = null;
      if (!demo || !state.signedIn || blocked() || storageBlocked) return;
      if (!book().request && !firstReport() && validNights(book()).length >= 14) {
        begin(); if (state.current === "TOD-09") { render(); return; }
      }
      const request = book().request;
      if (request?.status !== "generating" || !navigator.onLine) return;
      const guard = mode(), requestId = request.id;
      timer = setTimeout(() => {
        if (mode() !== guard || !state.signedIn || blocked() || book().request?.id !== requestId || book().request.status !== "generating" || !navigator.onLine) return;
        const next = clone(book()), current = next.request;
        if (Number.isFinite(current.readyAt) && current.readyAt > Date.now()) { resume(); return; }
        const frozen = validNights({ ledger: { status: "ready", ruleVersion: current.ruleVersion, nights: current.nights } });
        if (!Number.isFinite(current.readyAt) || !Array.isArray(current.nights) || current.nights.length !== 14 || frozen.length !== 14 || !current.ruleVersion) current.status = "failed";
        else if (current.outcome === "failed") current.status = "failed";
        else {
          if (!next.reports.some(item => item.id === current.reportId)) next.reports.unshift(snapshot(current));
          current.status = "complete";
        }
        if (!commit(next)) { error = "报告结果暂时没能保存，请重试。已有记录仍然保留。"; if (state.current === "TOD-09") render(); return; }
        track("health_report_generation_result", { request_id: current.id, report_id: current.status === "complete" ? current.reportId : "", result: current.status, simulated: true });
        if (state.current === "TOD-09") render();
      }, Math.max(0, Math.min(1800, Number(request.readyAt) - Date.now() || 0)));
    }
    function openReport(id) {
      if (!availableReports().some(item => item.id === id)) return fail("这份报告暂时无法打开，请返回报告列表查看。");
      book().detailFromList = book().view.panel === "home";
      track("health_report_opened", { report_id: id, simulated: demo });
      show("report", id);
    }
    function openMonth(month) {
      const report = availableReports().find(item => item.type === "monthly" && item.range.start.slice(0, 7) === month);
      go("TOD-09");
      if (report) openReport(report.id);
      else fail("这个月份还没有可查看的报告。报告生成后会出现在这里。");
    }
    function handle(action) {
      if (typeof action !== "string" || !action.startsWith("reports:")) return false;
      if (!state.signedIn) return true;
      const intent = action.slice(8);
      if (intent.startsWith("review:")) {
        const scenario = intent.slice(7);
        if (scenario === "current") { capture(); demo = false; }
        else if (scenarios.includes(scenario)) {
          const entry = clone(book().entry); demo = true;
          const next = fixture(scenario); next.entry = entry;
          if (!write({ healthReportsDemo: next })) return fail("演示状态暂时无法保存，请重试。");
        } else if (scenario === "fail-next") { demoOutcome = "failed"; render(); return true; }
        else if (scenario === "succeed-next") { demoOutcome = "success"; render(); return true; }
        else return true;
        error = ""; storageBlocked = false;
        const url = new URL(location.href);
        if (demo) url.searchParams.set("reportPreview", scenario); else url.searchParams.delete("reportPreview");
        history.replaceState({ ...history.state, ...historyFields("TOD-09") }, "", url);
        render(); return true;
      }
      if (state.current !== "TOD-09") return true;
      if (intent === "back") back();
      else if (intent === "home") back();
      else if (intent === "nights") { book().detailFromList = book().view.panel === "home"; show("nights"); }
      else if (intent.startsWith("open:")) openReport(intent.slice(5));
      else if (intent === "device") { book().externalRoute = active() ? "DEV-10" : "DEV-01"; go(book().externalRoute); }
      else if (intent === "health") { book().externalRoute = "HLT-00"; go("HLT-00"); }
      else if (intent === "retry") {
        storageBlocked = false; error = "";
        if (book().request?.status === "generating") resume(); else begin(true);
        render();
      } else if (intent === "check") fail("暂未收到报告结果。已有记录会保留，可以稍后再来查看。");
      return true;
    }
    function heading(title) { return `<header class="reports-head"><button data-action="reports:back" aria-label="返回上一页">← 返回</button>${demo ? '<span class="reports-demo-label">演示记录</span>' : ""}<h1 tabindex="-1">${esc(title)}</h1></header>`; }
    function errorBlock() { return error ? `<div class="reports-error" role="alert" tabindex="-1"><p>${esc(error)}</p>${storageBlocked ? '<button data-action="reports:retry">重试保存</button>' : ""}</div>` : ""; }
    function reportRow(report) { return `<button class="reports-list-row" data-action="reports:open:${esc(report.id)}"><span class="reports-document" aria-hidden="true">▤</span><span><strong>${esc(report.title)}</strong><small>${esc(rangeLabel(report.range))}</small><em>${report.sourceChanged ? "来源记录已变更" : "已生成"}</em></span><i aria-hidden="true">›</i></button>`; }
    function home() {
      const value = book(), list = nights(), complete = firstReport(), count = list === null ? null : Math.min(14, validNights(value).length), request = value.request;
      let title = "正在等待记录", note = "收到可用的夜间记录后，这里会显示进度。", action = ["查看连接与同步", "reports:device"];
      if (!active()) { title = count > 0 ? "重新连接后继续积累" : "连接后开始积累"; note = "戴着 Halo Ring 睡觉，起床后同步记录。以前的报告仍可在下方查看。"; action = ["连接 Halo Ring", "reports:device"]; }
      if (count !== null && active()) { title = count >= 14 ? "夜间记录已齐备" : `还差 ${14 - count} 个有效夜晚`; note = "照常佩戴、按时同步就好，不用刻意改变作息。"; action = ["查看记录情况", "reports:nights"]; }
      if (request?.status === "generating") { title = navigator.onLine ? "正在整理你的报告" : "网络暂时不可用"; note = navigator.onLine ? "不用留在这里，稍后回来可以继续查看。" : "已有进度会保留，网络恢复后继续。"; action = ["查看记录情况", "reports:nights"]; }
      if (request?.status === "failed") { title = "这次没能生成报告"; note = "夜间记录已经保留，可以重新试一次。"; action = ["重新生成", "reports:retry"]; }
      if (complete) { title = "首份报告已生成"; note = rangeLabel(complete.range); action = ["查看我的报告", `reports:open:${complete.id}`]; }
      if (storageBlocked) { title = "进度暂时没能保存"; note = "已有夜间记录没有改变，请重试保存后继续。"; action = ["重试保存", "reports:retry"]; }
      if (blocked()) { title = "健康记录正在处理"; note = "暂不生成或展示报告内容，处理结果可在隐私设置中查看。"; action = ["查看隐私设置", "go:SET-01"]; }
      const showMeter = count !== null && !blocked() && !complete;
      const marker = complete ? "✓" : request?.status === "generating" ? "···" : "◷";
      const reports = availableReports();
      return `${heading("健康报告")}<article class="health-reports"><section class="reports-progress"><div class="reports-progress-label"><span>首份 14 晚报告</span><img src="${symbol}" alt="" width="30" height="36"></div>${showMeter ? `<p class="reports-count"><strong>${count}</strong><span>/ 14 晚</span></p><div class="reports-meter" role="progressbar" aria-label="有效夜晚积累进度" aria-valuemin="0" aria-valuemax="14" aria-valuenow="${count}">${Array.from({ length: 14 }, (_, index) => `<i class="${index < count ? "filled" : ""}" aria-hidden="true"></i>`).join("")}</div>` : `<span class="reports-status-icon" aria-hidden="true">${marker}</span>`}<h2>${esc(title)}</h2><p class="reports-description" role="status">${esc(note)}</p><button class="primary" data-action="${action[1]}">${esc(action[0])}</button>${!active() && count !== null && !blocked() ? '<button class="reports-text-link" data-action="reports:nights">查看已积累的记录</button>' : ""}</section>${errorBlock()}<section class="reports-archive"><div class="reports-section-title"><h2>我的报告</h2><span>${reports.length ? `${reports.length} 份` : ""}</span></div>${reports.length ? reports.map(reportRow).join("") : '<div class="reports-archive-empty"><span aria-hidden="true">▤</span><p>第一份报告会出现在这里</p><small>可以回看每份报告的日期范围与记录。</small></div>'}</section><p class="reports-footer">月度回顾会在生成后出现在“我的报告”中。<br>用于日常健康管理，不替代医疗诊断。</p></article>`;
    }
    function nightDetails() {
      const list = blocked() ? null : nights();
      const count = validNights(book()).length;
      return `${heading("记录情况")}<article class="health-reports">${list === null ? '<section class="reports-archive-empty"><h2>暂时没有可核对的记录</h2><p>收到夜间记录后，会在这里说明是否已计入。</p></section>' : `<div class="reports-night-summary"><strong>${count} 晚已计入</strong><span>${list.length - count} 晚尚未计入</span></div><div class="reports-night-list">${[...list].reverse().map(item => `<div class="reports-night-row"><span class="${item.status}" aria-hidden="true">${item.status === "valid" ? "✓" : "—"}</span><time>${esc(dateLabel(item.date))}</time><div><strong>${item.status === "valid" ? "已计入" : item.status === "pending" ? "等待确认" : "记录不完整"}</strong>${item.status !== "valid" ? `<small>${esc(item.reason || "暂不计入本次报告")}</small>` : ""}</div></div>`).join("")}</div>`}<p class="reports-footer">同一晚不会重复计入。记录缺口不代表身体异常。</p>${errorBlock()}<button class="primary" data-action="reports:device">查看连接与同步</button></article>`;
    }
    function reportDetails() {
      const report = availableReports().find(item => item.id === book().view.id);
      if (!report || blocked()) return `${heading("报告详情")}<section class="reports-archive-empty"><h2>这份报告暂时无法查看</h2><p>${blocked() ? "健康记录正在处理，暂不展示报告内容。" : "请返回列表，重新选择一份报告。"}</p><button class="primary" data-action="reports:home">返回我的报告</button></section>`;
      const rows = Array.isArray(report.nights) ? report.nights.filter(item => object(item) && validDate(item.date) && item.date >= report.range.start && item.date <= report.range.end) : [];
      const sleep = rows.filter(item => Number.isFinite(item.sleepMinutes) && item.sleepMinutes > 0 && item.sleepMinutes <= 1440);
      const avg = sleep.length ? Math.round(sleep.reduce((sum, item) => sum + item.sleepMinutes, 0) / sleep.length) : null;
      return `${heading(report.type === "first14" ? "14 晚报告" : "月度回顾")}<article class="health-reports"><section class="reports-detail-cover"><span>我的健康回顾</span><h2>${esc(report.title)}</h2><p>${esc(rangeLabel(report.range))}</p><small>${esc(new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric" }).format(new Date(report.generatedAt)))}生成</small></section>${report.sourceChanged ? '<p class="reports-change-note">部分来源记录已变更。这份历史报告未重新计算。</p>' : ""}<section class="reports-overview"><h2>这段时间的记录</h2><div class="reports-metrics"><div><span>纳入记录</span><strong>${rows.length}<small> 晚</small></strong></div>${avg !== null ? `<div><span>平均睡眠</span><strong>${Math.floor(avg / 60)}<small> 小时 </small>${avg % 60}<small> 分</small></strong></div>` : ""}</div>${sleep.length ? `<p>平均睡眠来自 ${sleep.length} 晚可用记录。</p>` : '<p>这份报告没有可核对的睡眠时长，暂不汇总。</p>'}</section><section class="reports-detail-section"><h2>夜间记录</h2><p>回看具体日期，不用给每一晚打分。</p>${rows.map(item => `<div class="reports-sleep-row"><time>${esc(dateLabel(item.date))}</time><span>${Number.isFinite(item.sleepMinutes) && item.sleepMinutes > 0 && item.sleepMinutes <= 1440 ? `${Math.floor(item.sleepMinutes / 60)} 小时 ${Math.round(item.sleepMinutes % 60)} 分` : "时长未提供"}</span></div>`).join("")}</section><section class="reports-detail-section"><h2>接下来</h2><p>照常记录即可。想回看某一天，可以从健康数据里选择日期。</p><button class="reports-text-link" data-action="reports:health">查看健康数据 ›</button></section><p class="reports-footer">这是一份已保存的回顾，不随今天的连接状态变化。<br>用于日常健康管理，不替代医疗诊断。</p></article>`;
    }
    function body() { return book().view.panel === "nights" ? nightDetails() : book().view.panel === "report" ? reportDetails() : home(); }
    function afterRender() { if (state.current === "TOD-09") screen.scrollTop = Number(book().view.top) || 0; }
    function reviewControls(item) {
      if (item.id !== "TOD-09") return "";
      return `<section class="review-controls"><p>REPORT REVIEW</p><h3>报告状态演示</h3><small>演示记录与当前记录隔离，不改健康数据、会员账本或设备。1.8秒仅为模拟生成时间；月报示例不定义正式生成门槛。</small><div class="review-control-group"><div>${[["current", "当前记录"], ["collecting", "9晚积累"], ["ready", "14晚齐备"], ["failed", "生成失败"], ["monthly", "月报已生成"]].map(([key, label]) => `<button data-action="reports:review:${key}" class="${demo ? book().scenario === key ? "active" : "" : key === "current" ? "active" : ""}">${label}</button>`).join("")}</div></div><div class="review-control-group"><strong>下一次模拟生成</strong><div><button data-action="reports:review:succeed-next" class="${demoOutcome === "success" ? "active" : ""}">成功</button><button data-action="reports:review:fail-next" class="${demoOutcome === "failed" ? "active" : ""}">失败</button></div></div></section>`;
    }
    window.addEventListener("popstate", () => {
      if (location.hash.toUpperCase() === "#TOD-09" && state.current === "TOD-09") { restore("TOD-09", history.state?.healthReportContext); render(); }
    });
    window.addEventListener("pagehide", () => { if (state.current !== "TOD-09" || screen.dataset.page !== "TOD-09") return; capture(); persist(); });
    window.addEventListener("offline", () => { clearTimeout(timer); timer = null; if (state.current === "TOD-09") render(); });
    window.addEventListener("online", () => { storageBlocked = false; resume(); if (state.current === "TOD-09") render(); });
    screen.addEventListener("scroll", () => { if (state.current === "TOD-09") { capture(); history.replaceState({ ...history.state, ...historyFields("TOD-09") }, "", location.href); persist(); } }, { passive: true });
    return { body, handle, enter, back, backFromExternal, restore, historyFields, capture, afterRender, resume, reviewControls, openMonth };
  };
})();
