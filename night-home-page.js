(function () {
  "use strict";
  window.createHaloNightHome = function ({ state, active, content, position, esc, symbol, icon, chevron, render }) {
    const ids = ["breath", "scan", "sound"];
    const description = {
      breath: "跟着轻声节拍，让呼吸慢下来。",
      scan: "跟着引导，慢慢放松身体。",
      sound: "没有说话声，只有柔和的环境音。"
    };
    const time = seconds => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
    const play = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 10 7-10 7Z" fill="currentColor"/></svg>';
    const historyIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10a9 9 0 1 1 2 8M3 4v6h6M12 7v5l3 2"/></svg>';
    function current() { return state.nightSession && state.nightSession.status !== "ended" ? state.nightSession : null; }
    function wakeSummary() {
      const wake = state.wakeSettings || {};
      const draft = state.wakeDraft || wake;
      const changed = ["enabled", "time", "sound", "window"].some(key => draft[key] !== wake[key]);
      const saved = !wake.enabled ? "已关闭" : `${wake.time} · ${state.toggles.notification ? "设置预览" : "通知未开启"}`;
      return `${saved}${changed ? " · 有未保存修改" : ""}`;
    }
    function setting(title, detail, action) {
      return `<button class="night-home-setting" data-action="${action}"><span><strong>${title}</strong><small>${esc(detail)}</small></span>${chevron()}</button>`;
    }
    function body() {
      const bound = active();
      const selectedId = ids.includes(state.nightChoice) ? state.nightChoice : "scan";
      const selected = content(selectedId);
      const session = current();
      const id = session?.contentId || selectedId;
      const tail = session ? session.appendNoise : bound && state.toggles.nightTail;
      const duration = session ? session.duration : selected.duration + (tail ? 20 : 0);
      const primaryDuration = session ? session.primaryDuration : selected.duration;
      const seconds = session ? position(session) : 0;
      const complete = Boolean(session && seconds >= duration * 60);
      const status = session ? complete ? "已听完" : session.status === "paused" ? "已暂停" : "正在播放" : "睡前可选";
      const title = session?.title || selected.title;
      const button = session ? complete ? "查看本次收听" : session.status === "paused" ? "继续收听" : "打开播放器" : "开始播放";
      const action = session ? complete ? "night-end" : "today-night" : "night-start";
      const nextDifferent = session && (session.contentId !== selectedId || session.title !== selected.title || session.primaryDuration !== selected.duration);
      const choices = ids.map(key => {
        const item = content(key);
        return `<button type="button" class="night-home-choice" role="radio" aria-checked="${key === selectedId}" tabindex="${key === selectedId ? 0 : -1}" data-action="night-home-select:${key}"><span class="night-home-choice-icon">${icon(key === "breath" ? "breath" : key === "scan" ? "sleep" : "time")}</span><span class="night-home-choice-copy"><strong>${esc(item.title)}</strong><small>${item.duration} 分钟 · ${esc(item.format)}</small></span><span class="night-home-choice-mark" aria-hidden="true"></span></button>`;
      }).join("");
      const fade = session ? session.fadeEnabled : state.toggles.sleepFade;
      return `<div class="night-screen night-home"><header class="night-home-header"><div><p>EVENING</p><h1>夜间</h1></div><button class="night-home-history" data-action="go:NIG-10">${historyIcon}<span>播放历史</span></button></header><section class="night-home-main"><div class="night-home-art"><img src="${symbol}" alt="" width="60" height="72"></div><p class="night-home-state">${status}</p><h2>${esc(title)}</h2><p class="night-home-description">${description[id] || "选一段喜欢的，听一会儿。"}</p><div class="night-home-duration"><strong>${duration}</strong><span>分钟</span></div>${tail ? `<p class="night-home-tail">${primaryDuration} 分钟${esc(content(id).format)} + 20 分钟白噪音</p>` : ""}${session ? `<div class="night-home-progress" data-complete="${complete}"><div><span data-night-home-time>已听 ${time(seconds)}</span><span>共 ${duration}:00</span></div><progress value="${seconds}" max="${duration * 60}" aria-label="本次收听进度"></progress></div>` : ""}<button class="night-home-primary" data-action="${action}">${play}<span>${button}</span></button>${!session && bound ? `<button class="night-home-about" data-action="go:NIG-02">内容介绍${chevron()}</button>` : ""}</section><section class="night-home-library"><div class="night-home-section-heading"><h2>${session ? "下次想听" : "换一种方式"}</h2>${bound ? '<button class="night-home-text" data-action="go:NIG-03">全部内容</button>' : ""}</div><div class="night-home-choices" role="radiogroup" aria-label="${session ? "下次播放内容" : "选择睡前内容"}">${choices}</div>${session ? `<p class="night-home-queued" role="status">${nextDifferent ? `下次选择：${esc(selected.title)}。` : ""}选好留着下次听，不会自动接播。</p>` : !bound ? '<p class="night-home-queued">没有戒指也可以听，选好后点开始。</p>' : ""}</section>${bound ? `<details class="night-home-settings"><summary>今晚设置<span>播放 · 唤醒</span>${chevron()}</summary><div>${setting(session ? "下次播放顺序" : "播放顺序", `${selected.duration + (state.toggles.nightTail ? 20 : 0)} 分钟${state.toggles.nightTail ? " · 含 20 分钟白噪音" : " · 结束后停止"}`, "go:NIG-05")}${setting("音量渐弱", `${fade ? "已开启" : "已关闭"}${session ? " · 本次播放" : ""}`, "go:NIG-12")}${setting("唤醒设置", wakeSummary(), "go:NIG-06")}</div></details>` : ""}<p class="night-home-boundary">原型仅演示操作，不输出音频或实际响铃。</p></div>`;
    }
    function handle(action) {
      if (typeof action !== "string" || !action.startsWith("night-home-select:")) return false;
      const id = action.slice("night-home-select:".length);
      if (state.current !== "NIG-01" || !ids.includes(id)) return true;
      state.nightChoice = id;
      if (!active()) state.publicNightChoice = id;
      render();
      return true;
    }
    function tick() {
      const session = current();
      const el = document.querySelector(".night-home-progress");
      if (!session || !el) return;
      const seconds = position(session);
      if (seconds >= session.duration * 60 && el.dataset.complete !== "true") return render();
      el.querySelector("[data-night-home-time]").textContent = `已听 ${time(seconds)}`;
      el.querySelector("progress").value = seconds;
    }
    document.addEventListener("keydown", event => {
      const radio = event.target.closest?.(".night-home-choice");
      if (!radio || !["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const index = ids.indexOf(radio.dataset.action.split(":")[1]);
      const next = event.key === "Home" ? 0 : event.key === "End" ? ids.length - 1 : (index + (["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1) + ids.length) % ids.length;
      const action = `night-home-select:${ids[next]}`;
      handle(action);
      document.querySelector(`.night-home-choice[data-action="${action}"]`)?.focus();
    });
    return { body, handle, tick };
  };
}());
