(function () {
  // Local prototype adapter. Production must resolve the server session, not trust these flags.
  window.createHaloStartup = function ({ state, pages, esc, symbol, go, render, expireSession, track, bindingRoute = () => "", guideRoute = () => "" }) {
    const key = "haloV5StartupProgress";
    const modes = ["normal", "slow", "failed", "offline", "expired", "preview"];
    let attempt = null;
    let timer = null;
    let slowShown = false;
    const validRoute = id => id !== "SYS-01" && pages.some(page => page.id === id);
    const save = () => { try { localStorage.setItem(key, JSON.stringify(attempt)); } catch {} };
    const emit = (event, fields = {}) => track(event, { attempt_id: attempt.id, simulated: true, ...fields });

    function begin(target = state.lastVisitedRoute, mode = "normal", restore = false) {
      clearTimeout(timer);
      timer = null;
      if (restore) {
        try {
          const saved = JSON.parse(localStorage.getItem(key));
          if (saved?.version === 1 && modes.includes(saved.mode) && saved.mode !== "preview" &&
              ["loading", "failed", "offline", "expired", "cache"].includes(saved.status) &&
              Number.isFinite(saved.startedAt) && Number.isFinite(saved.readyAt)) attempt = saved;
        } catch {}
      }
      if (!restore || !attempt) {
        const now = Date.now();
        attempt = { version: 1, id: `startup-${now}-${Math.random().toString(36).slice(2, 7)}`,
          target: validRoute(target) ? target : "", mode: modes.includes(mode) ? mode : "normal",
          status: "loading", startedAt: now, readyAt: now + (mode === "slow" ? 6500 : 700) };
        emit("app_startup_started", { mode: attempt.mode });
      }
      slowShown = Date.now() - attempt.startedAt >= 1800;
      save();
    }

    function destination() {
      const prior = validRoute(attempt.target) ? attempt.target : "";
      if (!state.signedIn || !state.authVerified) {
        if (state.authReturnRoute === "SEL-03" || prior === "AUTH-01" || prior === "AUTH-02" ||
            state.authForm.login?.status === "verifying" || state.authForm.request?.status === "sending") return "AUTH-01";
        return state.welcomeShopping && prior === "SEL-03" ? "SEL-03" : "ONB-01";
      }
      if (state.accountDeletionStatus === "submitted") return "ACC-03";
      if (state.authReturnRoute === "SEL-03" || state.welcomeShopping &&
          (prior === "SEL-03" || state.authForm.login?.destination === "SEL-03")) return "SEL-03";
      if (!state.connectionIntro.completed) return "ONB-03";
      const openGuide = guideRoute(prior);
      if (openGuide) return openGuide;
      const pendingBinding = bindingRoute();
      if (pendingBinding) return pendingBinding;
      if (state.basicProfile.status === "pending" && (!prior || prior === "ONB-04")) return "ONB-04";
      return prior && !["ONB-01", "ONB-03", "AUTH-01", "AUTH-02"].includes(prior) ? prior : "TOD-01";
    }

    function cachedRecords() {
      if (!state.signedIn || !state.authVerified || state.accountDeletionStatus === "submitted") return [];
      return (state.subjectiveRecords || []).filter(record => record?.source === "user-record" && typeof record.label === "string");
    }

    function resolve() {
      const outcome = navigator.onLine === false ? "offline" : attempt.mode;
      if (["failed", "offline", "expired"].includes(outcome)) {
        attempt.status = outcome;
        if (outcome === "expired") expireSession();
        save();
        emit("app_startup_blocked", { reason: outcome });
        render();
        requestAnimationFrame(() => document.getElementById("startup-title")?.focus({ preventScroll: true }));
      } else {
        const target = destination();
        attempt.status = "complete";
        save();
        emit("app_startup_restored", { destination: target });
        go(target, false);
      }
    }

    function resume() {
      clearTimeout(timer);
      timer = null;
      if (state.current !== "SYS-01") {
        if (attempt?.status === "loading") { attempt.status = "cancelled"; save(); }
        return;
      }
      if (!attempt || ["complete", "cancelled"].includes(attempt.status)) begin();
      if (attempt.mode === "preview" || attempt.status !== "loading") return;
      const id = attempt.id;
      const now = Date.now();
      const next = !slowShown && attempt.readyAt > attempt.startedAt + 1800 ? attempt.startedAt + 1800 : attempt.readyAt;
      timer = setTimeout(() => {
        timer = null;
        if (state.current !== "SYS-01" || attempt.id !== id || attempt.status !== "loading") return;
        if (Date.now() >= attempt.readyAt) resolve();
        else { slowShown = true; render(); }
      }, Math.max(0, next - now));
    }

    const button = (label, action, secondary = false) => `<button class="${secondary ? "secondary" : "primary"}" data-action="startup:${action}">${label}</button>`;
    function page() {
      if (!attempt || ["complete", "cancelled"].includes(attempt.status)) begin();
      const records = cachedRecords();
      if (attempt.status === "cache" && !records.length) { attempt.status = "offline"; save(); }
      if (attempt.status === "cache") {
        return `<section class="startup-cache"><header><span>离线查看 · 仅可阅读</span><h1 id="startup-title" tabindex="-1">已保存的记录</h1></header><p>以下是你之前保存的用户记录。</p><div class="startup-records">${records.map(record => {
          const date = record.occurredAt && Number.isFinite(Date.parse(record.occurredAt)) ? new Date(record.occurredAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false }) : "记录时间未保存";
          return `<article><small>用户记录 · ${esc(date)}</small><h2>${esc(record.label)}</h2>${record.original ? `<p>${esc(record.original)}</p>` : ""}</article>`;
        }).join("")}</div><footer>${button("重新连接", "retry")}${button("返回", "back", true)}</footer></section>`;
      }
      let feedback = `<div class="startup-loading" role="status" aria-label="正在打开 Halo"><span class="startup-spinner" aria-hidden="true"></span>${slowShown && attempt.mode !== "preview" ? "<p>正在打开，请稍候</p>" : ""}</div>`;
      if (["failed", "offline", "expired"].includes(attempt.status)) {
        const copy = {
          failed: ["暂时无法打开", "请稍后重试，已保存的记录不会被清除。", "重试"],
          offline: ["暂时没有网络", records.length ? "可以先查看已保存的用户记录。" : "连接网络后，再试一次。", "重新连接"],
          expired: ["登录已过期", "重新登录后，继续使用 Halo。", "重新登录"]
        }[attempt.status];
        feedback = `<div class="startup-feedback"><div role="alert"><h1 id="startup-title" tabindex="-1">${copy[0]}</h1><p>${copy[1]}</p></div>${button(copy[2], attempt.status === "expired" ? "login" : "retry")}${attempt.status === "offline" && records.length ? button("查看已保存的记录", "cache", true) : ""}</div>`;
      }
      return `<section class="startup-page" data-startup-state="${esc(attempt.status)}"><header class="startup-brand"><img class="welcome-symbol" src="${symbol}" width="96" height="114" alt=""><img class="welcome-wordmark" src="assets/HALORING_wordmark_with_slogan_ink.png" width="184" height="39" alt="HALORING · IN TUNE WITH YOU"></header><footer class="startup-footer">${feedback}</footer></section>`;
    }

    function reviewControls() {
      return `<section class="review-controls"><p>STARTUP REVIEW</p><h3>启动状态审阅</h3><small>仅在原型外切换，不属于用户界面。停留预览不会自动跳页；正常流程自动完成。登录过期模拟会结束当前模拟登录，但保留已有业务数据。</small><div class="review-control-group"><div>${[["preview", "停留预览"], ["normal", "正常启动"], ["slow", "慢加载"], ["failed", "恢复失败"], ["offline", "无网络"], ["expired", "登录过期"]].map(([mode, label]) => `<button class="${attempt?.mode === mode ? "active" : ""}" data-action="startup:review:${mode}">${label}</button>`).join("")}</div></div><small>离线只读仅显示本浏览器已保存的用户记录，不生成健康值。当前为模拟会话，真实鉴权和原生离线能力待接入。</small></section>`;
    }

    function handleAction(action) {
      if (!action.startsWith("startup:")) return false;
      if (state.current !== "SYS-01" || !attempt) return true;
      const operation = action.slice(8);
      if (operation.startsWith("review:")) {
        begin(attempt.target, operation.slice(7));
        render();
      } else if (operation === "retry" && ["failed", "offline", "cache"].includes(attempt.status)) {
        const target = attempt.target;
        emit("app_startup_retry");
        begin(target);
        render();
      } else if (operation === "cache" && attempt.status === "offline" && cachedRecords().length) {
        attempt.status = "cache";
        save();
        emit("app_startup_cache_opened");
        render();
      } else if (operation === "back" && attempt.status === "cache") {
        attempt.status = "offline";
        save();
        render();
      } else if (operation === "login" && attempt.status === "expired") {
        attempt.status = "complete";
        save();
        go("AUTH-01", false);
      }
      return true;
    }
    return { begin, page, resume, reviewControls, handleAction };
  };
})();
