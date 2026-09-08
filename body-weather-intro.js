(function () {
  // Read-only explanation of existing lifecycle state; opening this page creates no records.
  window.renderHaloBodyWeatherIntro = function ({ state, active, ready, symbol, esc, icon }) {
    const stages = {
      none: ["先记录你的第一晚", "今晚照常佩戴，睡醒后打开 App 同步。"],
      accumulating: ["正在了解你的日常", "已经收到一些记录。继续照常佩戴，让 Halo 了解你的平常状态。"],
      baseline: ["正在了解你的日常", "已有记录正在帮助 Halo 了解你，还需要继续佩戴和同步。"],
      interpretable: ready ? ["身体天气可以查看了", "到“今日”看看今天的状态，也可以查看已经同步的记录。"] : ["已有记录可以查看", "今天的身体天气还未更新。你可以先查看已同步的记录。"],
      limited: ["这次记录还不完整", "已有记录仍可查看。先检查同步情况，再回来看看是否更新。"],
      unknown: ["身体记录暂未更新", "可以先去“今日”看看，或检查戒指的连接与同步。"],
    };
    const stage = Object.hasOwn(stages, state.dataLifecycle) ? state.dataLifecycle : "unknown";
    const retained = !active && state.membershipHardwareState === "unbound-retained";
    const needsDevice = active && (["limited", "unknown"].includes(stage) || stage === "interpretable" && !ready || ["disconnected", "action", "connecting", "syncing", "low"].includes(state.deviceStatus) || state.toggles.bluetooth === false);
    const [headline, summary] = active ? stages[stage] : retained
      ? ["连接戒指，继续记录", "已有记录仍保留。重新连接后，再继续记录你的日常。"]
      : ["连接后，开始身体记录", "你可以先逛逛 App，连接并激活 Halo Ring 后再开始。"];
    const secondary = !active ? [state.devicePaired ? "继续连接戒指" : "连接 Halo Ring", state.devicePaired ? "DEV-10" : "DEV-01"]
      : needsDevice ? ["查看连接与同步", "DEV-10"] : ["查看佩戴指南", "DEV-04"];
    const connectionNote = !active ? "" : state.toggles.bluetooth === false ? "手机蓝牙未开启，已有记录仍保留。"
      : ({ disconnected: "戒指暂未连接，已有记录仍保留。", action: "这次同步未完成，可以查看原因。", connecting: "正在连接戒指，无需停留在此页。", syncing: "正在同步，无需停留在此页。", low: "戒指电量偏低，睡前记得充电。" }[state.deviceStatus] || "");
    return `<section class="body-intro" aria-labelledby="body-intro-title" data-lifecycle="${active ? stage : "unbound"}">
      <header class="body-intro-header"><button type="button" class="body-intro-back" data-action="previous" aria-label="返回"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5-7 7 7 7"/></svg></button><span>身体天气</span><span></span></header>
      <div class="body-intro-scroll">
        <div class="body-intro-hero"><img src="${symbol}" alt="" width="80" height="96"><h1 id="body-intro-title">${esc(headline)}</h1><p>${esc(summary)}</p></div>
        <ol class="body-intro-steps" aria-label="日常使用方式，不代表记录进度">
          <li><span aria-hidden="true">${icon("sleep")}</span><strong>夜间佩戴</strong></li>
          <li><span aria-hidden="true"><svg class="domain-icon" viewBox="0 0 24 24"><path d="M20 8a8 8 0 0 0-14-2L3 9m0-5v5h5M4 16a8 8 0 0 0 14 2l3-3m0 5v-5h-5"/></svg></span><strong>起床后同步</strong></li>
          <li><span aria-hidden="true">${icon("report")}</span><strong>在今日查看</strong></li>
        </ol>
        ${connectionNote ? `<p class="body-intro-connection">${esc(connectionNote)}</p>` : ""}
        <details class="body-intro-explain"><summary><span>身体天气是什么？</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><p>结合睡眠、身体能量和活动记录，看看今天和平时有什么不同。需要先积累足够的日常记录，才会给出身体状态参考。</p><p>记录不足时，不会给出状态判断。你不需要为了记录改变作息。</p></details>
      </div>
      <footer class="body-intro-actions"><p>${!active && !retained ? "可以先进入今日，之后再连接戒指。" : active && ["none", "accumulating", "baseline", "unknown"].includes(stage) ? "不用在这里等，之后在“今日”查看。" : "随时可以在“今日”查看已有记录。"}</p><button type="button" class="primary" data-action="go:TOD-01">进入今日</button><button type="button" class="text-button" data-action="go:${secondary[1]}">${secondary[0]}</button></footer>
    </section>`;
  };
})();
