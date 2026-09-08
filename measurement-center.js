/* HLT-03: a read-only history view over existing measurement ledgers. */
(() => {
  window.createHaloMeasurementCenter = function ({ state, esc, icon, chevron, oxygen, active, blocked, privacyBlocked, render, go, persist, capture, screen, showInfo, closeModal, openOxygen, getRecords }) {
    const filters = { all: "全部", heart: "心率", oxygen: "血氧", temperature: "温度" };
    const labels = { heart: "心率与 HRV", oxygen: "血氧", temperature: "皮肤温度" };
    const safe = value => esc(String(value ?? ""));
    const owner = () => state.signedIn && state.authVerified ? String(state.authPhone || state.authForm?.phone || "prototype-session") : "";
    const available = () => owner() && !privacyBlocked();
    const stamp = record => record.occurredAt || record.completedAt;
    const dateTime = at => new Date(Date.parse(at) + 8 * 3600000).toISOString();
    const filter = () => Object.hasOwn(filters, state.measurementCenterFilter) ? state.measurementCenterFilter : "all";
    const limit = () => Number.isInteger(state.measurementHistoryLimit) && state.measurementHistoryLimit >= 5 ? Math.min(500, state.measurementHistoryLimit) : 5;
    function records() {
      if (!available()) return [];
      return getRecords().slice().sort((a, b) => Date.parse(stamp(b)) - Date.parse(stamp(a)));
    }
    function values(record) {
      if (record.type === "oxygen" && Number.isFinite(Number(record.value))) return `${record.value}%`;
      return (record.metrics || []).filter(row => Array.isArray(row) && row.length >= 2).map(row => `${row[0]} ${row[1]}${row[2] || ""}`).join(" · ") || "查看记录";
    }
    function deviceCopy() {
      if (!active()) return { title: "连接 Halo Ring", body: "连接后可查看可用的测量功能", action: "go:DEV-01" };
      if (!state.toggles.bluetooth) return { title: "蓝牙尚未开启", body: "开启后再连接戒指，已有记录仍可查看", action: "go:PERM-01" };
      const reason = blocked();
      return { title: ["connected", "low"].includes(state.deviceStatus) ? state.deviceStatus === "low" ? "戒指已连接 · 电量较低" : "戒指已连接" : state.deviceStatus === "syncing" ? "戒指正在同步" : "戒指尚未连接", body: reason || "佩戴舒适，测量时保持手部安静", action: "go:DEV-10" };
    }
    function row(type, title, body, action, button, disabled = false) {
      return `<article class="measure-option"><span class="measure-option-icon" aria-hidden="true">${icon(type)}</span><div class="measure-option-copy"><h3>${safe(title)}</h3><p>${safe(body)}</p></div><button type="button" class="measure-option-action" data-action="${safe(action)}" ${disabled ? "disabled" : ""}>${safe(button)}</button></article>`;
    }
    function page() {
      const header = `<header class="measure-center-header"><button type="button" data-action="previous" aria-label="返回健康数据">${chevron("left")}</button><h1>主动测量</h1><button type="button" data-action="measure-center:help" aria-label="测量帮助">?</button></header>`;
      if (!available()) return `<article class="measurement-center">${header}<section class="measure-privacy"><h2>测量记录暂不可查看</h2><p>请先查看数据处理状态，处理完成后再回来。</p><button type="button" class="primary" data-action="go:SET-01">查看数据与隐私</button></section></article>`;
      const q = oxygen().request(), device = deviceCopy();
      const resumable = q && (q.pendingResult || ["running", "failed"].includes(q.status));
      const title = q?.pendingResult ? "这次结果还没保存" : q?.status === "failed" ? "上次测量未完成" : "有一次血氧测量待继续";
      const detail = q?.pendingResult ? "继续保存同一次结果，无需重新测量。" : q?.status === "failed" ? "没有新增记录，查看原因后再重试。" : "本次请求已保留，不会重复开始。";
      const resume = resumable ? `<section class="measure-resume" role="status"><div><strong>${title}</strong><p>${detail}</p></div><button type="button" data-action="measure-center:resume">${q.pendingResult ? "重试保存" : q.status === "failed" ? "查看并重试" : "继续测量"}</button></section>` : "";
      const reason = blocked("oxygen");
      const current = filter(), all = records(), selected = all.filter(r => current === "all" || r.type === current), visible = selected.slice(0, limit());
      let lastDate = "";
      const history = visible.map(record => {
        const date = dateTime(stamp(record)).slice(0, 10), time = dateTime(stamp(record)).slice(11, 16);
        const heading = date === lastDate ? "" : `<h3 class="measure-history-date">${date.replaceAll("-", "/")}</h3>`;
        lastDate = date;
        return `${heading}<button type="button" class="measure-record" data-action="measure-center:record:${safe(record.id)}"><span><strong>${labels[record.type]}</strong><small>${time} · ${record.source === "prototype-demo" ? "示例记录" : "主动测量记录"}${record.legacy ? " · 旧版" : ""}</small></span><span class="measure-record-value">${safe(values(record))}</span>${chevron()}</button>`;
      }).join("");
      return `<article class="measurement-center">${header}<button type="button" class="measure-device" data-action="${device.action}"><span class="measure-device-icon" aria-hidden="true">${icon("device")}</span><span><strong>${device.title}</strong><small>${safe(device.body)}</small></span>${chevron()}</button>${resume}<section class="measure-options"><h2>选择一项</h2>${row("oxygen", "血氧", resumable ? "先处理上方这次测量" : reason || "测量此刻血氧 · 原型演示", "measurement-start:oxygen", "开始", Boolean(reason || resumable))}${row("heart", "心率与 HRV", "主动测量能力待确认", "measure-center:heart", "说明")}${row("temperature", "夜间皮肤温度", "查看已记录的变化，不是即时测温", "measure-center:temperature", "查看")}</section><section class="measure-history"><header><h2>测量记录</h2><span>${selected.length} 条 · 北京时间</span></header><div class="measure-filters" role="group" aria-label="按测量类型筛选">${Object.entries(filters).map(([key,label]) => `<button type="button" data-action="measure-center:filter:${key}" aria-pressed="${key === current}">${label}</button>`).join("")}</div>${history || `<div class="measure-empty"><h3>${current === "all" ? "还没有测量记录" : `还没有${filters[current]}测量记录`}</h3><p>${current === "all" ? "完成并保存后，可以在这里回看。" : "这个分类暂无记录，可以切换到其他类型。"}</p></div>`}${selected.length > visible.length ? `<button type="button" class="measure-history-more" data-action="measure-center:more">查看更多记录（还有 ${selected.length - visible.length} 条）</button>` : ""}</section>${oxygen().message() ? `<p class="measure-error" role="alert">${safe(oxygen().message())}</p>` : ""}<details class="measure-help"><summary>测量前需要知道${chevron()}</summary><div><p>佩戴舒适、保持手部安静。不能开始时，先查看上方提示和连接状态。</p><p>主动测量与夜间汇总分开保存；这里不显示自动采集的全部健康记录。</p><p>演示测量只保存在当前浏览器，不是实际设备采集。单次结果不用于诊断。</p></div></details></article>`;
    }
    function handle(action) {
      if (typeof action !== "string" || !action.startsWith("measure-center:")) return false;
      if (state.current !== "HLT-03" || !available()) return true;
      const command = action.slice("measure-center:".length);
      if (command === "help") showInfo("关于主动测量", "开始前保持手部安静，并确认戒指已连接。\n\n测量未结束时，可以从本页继续；结果保存后进入测量记录。夜间汇总请在健康数据里查看。");
      if (command === "heart") showInfo("心率与 HRV", "当前还不能确认这款戒指的主动测量能力，暂不提供开始测量。\n\n已同步的心率记录仍可在健康数据中查看。", "查看心率记录", "measure-center:heart-records");
      if (command === "heart-records" || command === "temperature") { capture(); closeModal(); go(command === "temperature" ? "HLT-06" : "HLT-01"); }
      if (command === "resume") { const q = oxygen().request(); if (q && (q.pendingResult || ["running", "failed"].includes(q.status))) { capture(); oxygen().prepare(); state.measurementType = "oxygen"; state.measurementStatus = q.status; go("HLT-04"); } else render(); }
      if (command.startsWith("filter:")) { const next = command.slice(7); if (Object.hasOwn(filters, next)) { state.measurementCenterFilter = next; state.measurementHistoryLimit = 5; render(); screen.querySelector(`[data-action="measure-center:filter:${next}"]`)?.focus({preventScroll:true}); persist(); } }
      if (command === "more") { state.measurementHistoryLimit = Math.min(500, limit() + 10); render(); persist(); }
      if (command.startsWith("record:")) {
        const record = records().find(r => r.id === command.slice(7));
        if (!record) showInfo("这条记录已不可用", "请返回查看当前账号的其他记录。");
        else { capture(); const time = dateTime(stamp(record)); showInfo(`${labels[record.type]}测量记录`, `${values(record)}\n\n${time.slice(0,10)} ${time.slice(11,19)} · 北京时间\n${record.source === "prototype-demo" ? "原型示例，不是实际设备采集。" : "已保存的主动测量记录。"}${record.legacy && record.type === "temperature" ? "\n旧版温度记录未核验，不作为即时体温或夜间基线变化。" : ""}`, record.type === "oxygen" && !record.legacy ? "查看当日血氧" : "关闭", record.type === "oxygen" && !record.legacy ? `measure-center:oxygen:${record.id}` : "close-modal"); }
      }
      if (command.startsWith("oxygen:")) { const record = records().find(r => r.id === command.slice(7) && r.type === "oxygen" && !r.legacy); if (record) { capture(); closeModal(); openOxygen(record); } else showInfo("这条记录已不可用", "请返回查看当前账号的其他记录。"); }
      return true;
    }
    return { page, handle, records };
  };
})();
