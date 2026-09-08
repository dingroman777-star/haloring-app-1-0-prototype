/* TOD-11 is a read-only view of dated availability and owned-device receipts. */
(() => {
  window.createHaloDataQuality = function ({ state, go, render, screen, esc, write, active, today, validDate, dateLabel, readings, icon, openMetric }) {
    const owner = () => String(state.authPhone || state.authForm?.phone || "local-demo");
    const clone = value => value == null ? null : JSON.parse(JSON.stringify(value));
    const allowed = () => state.signedIn && (!state.healthDeletionStatus || state.healthDeletionStatus === "ready") && state.accountDeletionStatus !== "submitted";
    const fallbackDate = () => validDate(state.healthDemoRecordDate) ? state.healthDemoRecordDate : today();
    let storageError = false, timer;
    function book() {
      if (!state.dataQualityView || state.dataQualityView.owner !== owner()) state.dataQualityView = { owner: owner(), date: fallbackDate(), entry: "TOD-01", entryDate: null, entryContext: null, top: 0, sections: {}, trip: null };
      const value = state.dataQualityView;
      if (!validDate(value.date)) value.date = fallbackDate();
      if (!value.sections || typeof value.sections !== "object") value.sections = {};
      if (!/^(TOD|HLT)-\d{2}$/.test(value.entry || "") || value.entry === "TOD-11") value.entry = "TOD-01";
      return value;
    }
    function storageFeedback() { return storageError ? '<p class="dq-alert" role="alert">浏览位置未保存，关闭后可能无法恢复。<button type="button" data-action="dq:save">重试保存</button></p>' : ""; }
    function save() {
      storageError = !write({ dataQualityView: state.dataQualityView });
      if (state.current === "TOD-11") {
        const feedback = screen.querySelector(".dq-save-feedback");
        if (feedback && Boolean(feedback.firstElementChild) !== storageError) feedback.innerHTML = storageFeedback();
      }
      return !storageError;
    }
    function capture() {
      if (state.current !== "TOD-11" || screen.dataset.page !== "TOD-11") return;
      const value = book(); value.top = screen.scrollTop;
      value.sections = Object.fromEntries([...screen.querySelectorAll("details[data-dq-section]")].map(el => [el.dataset.dqSection, el.open]));
    }
    function historyFields(target) { return target === "TOD-11" ? { dataQualityContext: clone(book()) } : {}; }
    function enter(target, from) {
      capture();
      const value = book();
      if (target === "TOD-11" && from !== target) {
        if (value.trip?.route !== from) {
          const context = state.healthDetailContext;
          value.date = from === "HLT-00" && validDate(state.healthSelectedDate) ? state.healthSelectedDate : context?.route === from && validDate(context.date) ? context.date : fallbackDate();
          value.entry = /^(TOD|HLT)-\d{2}$/.test(from) ? from : "TOD-01";
          value.entryDate = from === "HLT-00" ? state.healthSelectedDate : null;
          value.entryContext = context?.route === from ? clone(context) : null;
          value.sections = {}; value.top = 0; value.trip = null;
          delete state.pageViews["TOD-11"];
        }
      } else if (from === "TOD-11" && value.trip?.route !== target) value.trip = null;
      if (from === "TOD-11" || target === "TOD-11") save();
    }
    function restore(target, context) {
      if (target !== "TOD-11") return;
      const current = book();
      if (context?.owner === owner() && validDate(context.date)) {
        // The persisted view contains the latest scroll and device trip after a refresh.
        if (current.date !== context.date || current.entry !== context.entry) state.dataQualityView = clone(context);
      }
    }
    function back() {
      const value = book(); capture(); save();
      if (validDate(value.entryDate)) state.healthSelectedDate = value.entryDate;
      state.healthDetailContext = clone(value.entryContext);
      if (history.state?.trail?.at(-2) === value.entry) history.back(); else go(value.entry, false);
    }
    function backFromExternal() {
      const value = book();
      if (!value.trip || value.trip.route !== state.current || history.state?.trail?.at(-2) !== "TOD-11") return false;
      history.back(); return true;
    }
    const validTime = value => typeof value === "string" && Number.isFinite(Date.parse(value)) && Date.parse(value) <= Date.now();
    const timeLabel = value => new Date(value).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
    function device() {
      const account = owner(), id = String(state.pairedDevice?.id || (state.devicePaired && state.deviceBindings?.ring7a21?.accountRef === account ? "ring7a21" : ""));
      const binding = Object.values(state.deviceBindings || {}).find(item => item?.accountRef === account && String(item.id) === id);
      const data = state.deviceHub?.accounts?.[account];
      const stamp = binding ? data?.facts?.[id]?.lastSyncedAt : null;
      const synced = validTime(stamp) && (!validTime(binding?.boundAt) || Date.parse(stamp) >= Date.parse(binding.boundAt)) ? stamp : null;
      const request = state.deviceHub?.request;
      const pending = binding && request?.accountRef === account && String(request.target?.id) === id && request.status === "pending";
      const result = data?.lastResult, trip = book().trip;
      const recent = binding && trip?.route === "DEV-10" && trip.deviceId === id && result?.targetId === id && validTime(result.completedAt) && Date.parse(result.completedAt) >= trip.startedAt ? result : null;
      const permissionBlocked = state.toggles?.bluetooth === false || ["denied", "bluetooth-off"].includes(state.connectionIntro?.permission);
      const labels = { connected: "已连接", low: "已连接 · 电量偏低", disconnected: "未连接", syncing: "上次同步结果待确认", connecting: "上次连接结果待确认" };
      const status = !active() ? "尚未连接" : !binding ? "连接状态待确认" : permissionBlocked ? "蓝牙未开启或权限未允许" : pending ? request.kind === "sync" ? "正在同步" : "正在连接" : labels[state.deviceStatus] || "连接状态待确认";
      return { id, binding, synced, pending, recent, status };
    }
    function recordCount(date) {
      if (!allowed()) return 0;
      return (state.subjectiveRecords || []).filter(record => record && record.category !== "rhythm" && !["draft", "deleted"].includes(record.status) && !record.deletedAt && validTime(record.occurredAt) && new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(record.occurredAt)) === date).length;
    }
    const arrow = '<span class="dq-chevron" aria-hidden="true">›</span>';
    function row(item) {
      const status = item.empty ? item.detail : "可查看";
      return `<button type="button" class="dq-metric${item.empty ? " is-empty" : ""}" data-action="dq:metric:${item.key}"><span class="dq-icon" aria-hidden="true">${icon(item.icon)}</span><span class="dq-metric-name"><strong>${esc(item.title)}</strong><small>${item.empty ? "所选日期" : "Halo Ring · 示例记录"}</small></span><span class="dq-metric-status">${esc(status)}</span>${arrow}</button>`;
    }
    function disclosure(key, title, content, subtitle = "") {
      return `<details class="dq-disclosure" data-dq-section="${key}"${book().sections[key] ? " open" : ""}><summary><span>${title}${subtitle ? `<small>${subtitle}</small>` : ""}</span>${arrow}</summary><div class="dq-disclosure-body">${content}</div></details>`;
    }
    function body() {
      const value = book(), permitted = allowed(), connected = active(), records = permitted ? readings(value.date) : [], count = records.filter(item => !item.empty).length, d = device();
      const title = !permitted ? "健康数据暂不可用" : !connected ? state.membershipHardwareState === "unbound-retained" ? "等待重新连接" : "还没有戒指记录" : !count ? "这一天暂无可查看记录" : "这些记录可以查看了";
      const description = !permitted ? "请到数据与隐私查看当前处理状态。" : !connected ? state.membershipHardwareState === "unbound-retained" ? "当前暂停更新，这不表示原有记录已删除。" : "连接 Halo Ring 后，佩戴并同步就能开始记录。" : !count ? "可以查看连接与同步；没有采集到的内容无法通过同步补出。" : "可查看不代表全天或整晚完整，缺失的部分不按零计算。";
      const main = ["sleep", "hrv", "activity"].map(key => records.find(item => item.key === key)).filter(Boolean), more = records.filter(item => !["sleep", "hrv", "activity"].includes(item.key));
      const baseline = value.date !== state.healthDemoRecordDate ? "历史记录可以回看，不用于判断今天的身体状态。" : state.dataLifecycle === "interpretable" ? "个人范围已建立；是否能作比较，还要看这一天的有效记录。" : state.dataLifecycle === "limited" ? "这一天有记录缺口，先查看已有片段，暂不汇总身体状态。" : "个人范围仍在积累；已有记录可以看，暂不与平时比较。";
      return `<article class="data-quality-page"><header class="dq-header"><button type="button" data-action="dq:back" aria-label="返回">←</button><h1>数据来源与质量</h1><span></span></header><p class="dq-date">${esc(dateLabel(value.date))}的记录${value.date !== today() ? '<span>历史日期</span>' : ""}</p><section class="dq-overview"><div class="dq-overview-symbol" aria-hidden="true">${icon("status")}</div><h2>${title}</h2><p>${description}</p><button type="button" class="dq-quick-action" data-action="${!permitted ? "dq:privacy" : "dq:device"}">${!permitted ? "查看数据与隐私" : connected ? "查看连接与同步" : "连接 Halo Ring"} ${arrow}</button>${permitted && connected && count ? '<span class="dq-demo">示例数据 · 仅用于体验原型</span>' : ""}</section><div class="dq-save-feedback" aria-live="polite">${storageFeedback()}</div>${permitted ? `<section class="dq-section"><div class="dq-section-heading"><h2>记录来源</h2><span>按所选日期</span></div><div class="dq-metrics">${main.map(row).join("")}${disclosure("metrics", "更多指标", more.map(row).join(""), "心率 · 呼吸率 · 血氧 · 皮肤温度")}</div>${connected && count ? `<p class="dq-baseline">${baseline}</p>` : ""}</section>` : ""}<section class="dq-device"><div class="dq-device-heading"><span class="dq-icon" aria-hidden="true">${icon("ring")}</span><div><h2>连接与同步</h2><p>${esc(d.status)}</p></div>${d.pending ? '<span class="dq-pending" role="status">处理中</span>' : ""}</div><p class="dq-sync-time">${d.synced ? `当前戒指最近同步 · ${esc(timeLabel(d.synced))}` : "当前戒指暂无同步时间"}</p>${d.recent ? `<p class="dq-result" role="status">${esc(d.recent.message || (d.recent.status === "complete" ? "本次同步已完成" : "本次操作未完成"))}</p>` : ""}<button type="button" class="secondary" data-action="${!permitted ? "dq:privacy" : "dq:device"}">${!permitted ? "查看数据与隐私" : connected ? "查看连接与同步" : "连接 Halo Ring"}</button><p class="dq-device-note">同步时间不等于采集时间，也不表示每项记录都已完整。</p></section>${permitted ? disclosure("records", "用户记录", "<p>这里统计这一天已保存的感受记录，不包含未保存的草稿。用户记录单独存放，不会变成戒指测量值。</p>", `已保存 ${recordCount(value.date)} 条 · 与设备记录分开`) : ""}${disclosure("explain", "怎么看记录质量", '<h3>有记录，不一定有整晚总结</h3><p>只有足够的有效记录，才会生成对应总结。没有完整度信息时，不显示百分比。</p><h3>为什么可能缺少记录？</h3><p>未佩戴、测量受干扰或尚未同步都可能是原因，单凭这页无法确定。同步只能取回设备中仍保存的有效记录。</p><h3>来源会不会混在一起？</h3><p>每项记录旁会标注来源。戒指测量与用户记录分开显示，请以具体记录的来源为准。</p>')}<p class="dq-boundary">记录用于日常健康管理，不替代医疗诊断。</p></article>`;
    }
    function handle(action) {
      if (!action.startsWith("dq:")) return false;
      if (state.current !== "TOD-11") return true;
      if (action === "dq:back") { back(); return true; }
      if (action === "dq:save") { capture(); save(); render(); return true; }
      if (!allowed() && action !== "dq:privacy") return true;
      const item = action.startsWith("dq:metric:") ? readings(book().date).find(entry => entry.key === action.slice(10)) : null;
      const route = item?.route || (action === "dq:device" ? active() ? "DEV-10" : "DEV-01" : action === "dq:privacy" ? "SET-01" : "");
      if (!route) return true;
      capture(); book().trip = { route, startedAt: Date.now(), deviceId: device().id }; save();
      if (item) openMetric(item, book().date); else go(route);
      return true;
    }
    function afterRender() {
      if (state.current !== "TOD-11") return;
      const value = book();
      screen.querySelectorAll("details[data-dq-section]").forEach(el => { el.open = Boolean(value.sections[el.dataset.dqSection]); el.addEventListener("toggle", () => { capture(); save(); }); });
      screen.scrollTop = Number(value.top) || 0;
    }
    screen.addEventListener("scroll", () => { if (state.current !== "TOD-11") return; capture(); clearTimeout(timer); timer = setTimeout(save, 100); });
    window.addEventListener("pagehide", () => { if (state.current === "TOD-11") { capture(); save(); } });
    return { body, handle, enter, restore, historyFields, back, backFromExternal, afterRender, capture };
  };
})();
