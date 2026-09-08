(function () {
  "use strict";
  window.createHaloNightCombo = function ({ state, playlist, active, position, esc, symbol, icon, chevron, render, go, write, screen, track, finish, supportEntry = () => "", pendingSnooze = () => null }) {
    const goals = { relax: "想放松", quiet: "少些引导", brief: "先听一小段" };
    const copy = value => JSON.parse(JSON.stringify(value));
    const time = seconds => `${Math.floor(Math.max(0, seconds) / 60)}:${String(Math.floor(Math.max(0, seconds)) % 60).padStart(2, "0")}`;
    const play = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 10 7-10 7Z" fill="currentColor"/></svg>';
    let error = "", openingDetail = false;
    let detailError = "", detailRenderedAddition = null;
    let libraryFeedback = null;
    let playerError = null, endPrompt = "";
    let editorFeedback = null;
    function current() { return state.nightSession && state.nightSession.status !== "ended" ? state.nightSession : null; }
    function playable(session) {
      const tracks = playlist.sessionTracks(session);
      return session && ["playing", "paused"].includes(session.status) && tracks.length > 0 && (!Array.isArray(session.tracks) || tracks.length === session.tracks.length) && Math.abs(tracks.reduce((sum, item) => sum + item.duration, 0) - Number(session.duration)) < .001;
    }
    function button(label, action, cls = "night-combo-secondary", disabled = false) {
      return `<button type="button" class="${cls}" data-action="${esc(action)}" ${disabled ? "disabled" : ""}>${label}</button>`;
    }
    function footer() { return `${error ? `<p class="night-combo-error" role="alert">${esc(error)}</p>${button("重试保存", "night-combo:retry-save")}` : ""}${["NIG-01", "NIG-04"].includes(state.current) ? supportEntry() : ""}<p class="night-home-boundary">原型仅演示推荐与播放，不输出音频或实际响铃。</p>`; }
    function subhead(title, back = "night-combo:back") {
      return `<header class="night-combo-subhead">${button(chevron("left"), back, "night-combo-back").replace('<button ', '<button aria-label="返回上一页" ')}<h1>${title}</h1><span></span></header>`;
    }
    function wake() {
      const value = state.wakeSettings || {}, draft = state.wakeDraft || value;
      const dirty = ["enabled", "time", "sound", "window", "snoozeMinutes"].some(key => value[key] !== draft[key]);
      const pending = pendingSnooze();
      if (pending) {
        const due = new Date(pending.dueAt), waiting = due.getTime() > Date.now();
        const label = String(due.getHours()).padStart(2, "0") + ":" + String(due.getMinutes()).padStart(2, "0");
        return `<button class="night-combo-wake" data-snooze-home="${waiting}" data-action="go:NIG-08"><span class="icon">${icon("time")}</span><span><strong>${waiting ? "稍后提醒" : "稍后提醒时间到了"}</strong><small>${waiting ? "查看倒计时或关闭本次提醒" : "查看或关闭本次提醒"}${dirty ? " · 设置有未保存修改" : ""}</small></span><b>${label}</b>${chevron()}</button>`;
      }
      const subtitle = !active() ? "连接戒指后可设置" : `${value.enabled ? state.toggles.notification ? "唤醒设置预览" : "通知未开启" : "点击设置时间"}${dirty ? " · 有未保存修改" : ""}`;
      return `<button class="night-combo-wake" data-action="go:NIG-06"><span class="icon">${icon("time")}</span><span><strong>明早唤醒</strong><small>${esc(subtitle)}</small></span><b>${!active() ? "未设置" : value.enabled ? esc(value.time) : "已关闭"}</b>${chevron()}</button>`;
    }
    function row(item, index, source = "catalog", extra = "") {
      return `<button class="night-combo-track" data-action="night-combo:detail:${source}:${esc(item.id)}"><b>${index + 1}</b><span><strong>${esc(item.title)}</strong><small>${item.duration} 分钟 · ${esc(item.format || "放松音频")}${extra}</small></span>${chevron()}</button>`;
    }
    function list(items, source = "catalog") { return `<ol class="night-combo-track-list">${items.map((item, index) => `<li>${row(item, index, source)}</li>`).join("")}</ol>`; }
    function total(plan) { return `<div class="night-combo-total"><span>${plan.tracks.length} 段 · 按顺序播放</span><strong>共 ${plan.total} 分钟</strong></div>`; }
    function currentCard() {
      const session = current(); if (!session) return "";
      const seconds = position(session), part = playlist.segment(session, seconds), complete = part.complete;
      return `<section class="night-combo-active" data-complete="${complete}" data-part="${part.index}"><p class="night-combo-kicker">${complete ? session.skipped ? "这组已结束" : "这组已听完" : session.status === "paused" ? "已暂停" : "正在播放"} · 第 ${part.index + 1} / ${playlist.sessionTracks(session).length} 段</p><h2>${esc(part.track?.title || session.title)}</h2><div class="night-combo-progress-label"><span data-combo-home-time>${session.skipped ? "播放进度" : "整组已听"} ${time(seconds)}</span><span>共 ${session.duration}:00</span></div><progress value="${seconds}" max="${session.duration * 60}" aria-label="整组收听进度"></progress>${button(`${play}<span>${complete ? "查看本次收听" : session.status === "paused" ? "继续这组" : "打开播放器"}</span>`, complete ? "night-end" : "today-night", "night-home-primary")}</section>`;
    }
    function body() {
      const plan = playlist.plan(), recommendation = playlist.recommendation(), session = current();
      const selected = plan.mode === "recommendation" && plan.recommendationId === recommendation.id && plan.ids.join("|") === recommendation.ids.join("|");
      return `<div class="night-screen night-home night-combo"><header class="night-home-header"><div><p>EVENING</p><h1>夜间</h1></div>${button("播放历史", "go:NIG-10", "night-home-history")}</header>${wake()}${currentCard()}
        <section class="night-combo-recommend"><div class="night-combo-kicker"><img src="${symbol}" alt="" width="24" height="28"><span>AI 推荐组合</span><small>演示</small></div>
          <div class="night-combo-goals" role="group" aria-label="今晚想怎么放松">${Object.entries(goals).map(([key, label]) => `<button data-action="night-combo:goal:${key}" aria-pressed="${(state.nightRecommendationGoal || "relax") === key}">${label}</button>`).join("")}</div>
          <h2>${esc(recommendation.title)}</h2><p class="night-combo-reason">${esc(recommendation.reason)}</p>${list(recommendation.tracks)}
          <div class="night-combo-total"><span>${recommendation.tracks.length} 段内容</span><strong>${recommendation.total} 分钟</strong></div>
          <button class="night-combo-use" data-action="night-combo:recommend" aria-pressed="${selected}" ${selected ? "disabled" : ""}>${selected ? "已选用这组" : session ? "选作下次组合" : "选用这组"}</button>
        </section>
        <section class="night-combo-plan"><div class="night-combo-heading"><h2>${session ? "下次播放组合" : "待播放组合"}</h2>${button("编辑顺序", "go:NIG-05", "night-home-text", !plan.ids.length)}</div>
          ${plan.ids.length ? `${list(plan.tracks)}${total(plan)}` : '<div class="night-combo-empty"><p>组合还是空的</p><small>选用推荐，或自己加几段喜欢的内容。</small></div>'}
          ${session ? '<p class="night-combo-reason">修改只用于下次。当前这组会继续播放，不会自动接上新组合。</p>' : button(`${play}<span>开始组合播放</span>`, "night-start", "night-home-primary", !plan.ids.length)}
          ${button("自己搭配内容", "go:NIG-03")}
        </section>${active() ? `<details class="night-home-settings"><summary>播放设置<span>音量渐弱</span>${chevron()}</summary><div><button class="night-home-setting" data-action="go:NIG-12"><span><strong>音量渐弱</strong><small>${(session ? session.fadeEnabled : state.toggles.sleepFade) ? "已开启" : "已关闭"}${session ? " · 本次播放" : ""}</small></span>${chevron()}</button></div></details>` : ""}${footer()}</div>`;
    }
    function library() {
      const plan = playlist.plan(), next = Boolean(current());
      const feedback = libraryFeedback && JSON.stringify(state.nightPlan) === libraryFeedback.expected ? libraryFeedback : null;
      return `<div class="night-screen night-home night-combo library">${subhead("自己搭配")}
        <section class="night-library-summary" aria-label="${next ? "下次" : "待播"}组合"><div><p>${next ? "下次播放" : "待播组合"}</p><strong>${plan.ids.length ? `${plan.ids.length} 段 <span>·</span> ${plan.total} 分钟` : "还没有选择内容"}</strong></div>${button("查看组合", "go:NIG-05", "night-home-primary")}</section>
        <p class="night-library-context">${next ? "这里只调整下次组合，不影响当前播放。" : "选一段也可以，加入后不会自动播放。"}</p>
        <div class="night-combo-catalog">${playlist.catalog().map(item => {
          const index = plan.ids.indexOf(item.id), added = index >= 0, notice = feedback?.id === item.id ? feedback : null, retrySelection = notice?.error && !notice.undo;
          return `<article data-content-id="${item.id}" class="${added ? "is-selected" : ""}"><button type="button" class="night-combo-catalog-info" aria-label="查看${esc(item.title)}的介绍" data-action="night-combo:detail:catalog:${item.id}"><span class="icon">${icon(item.id === "breath" ? "breath" : item.id === "scan" ? "sleep" : "time")}</span><span><strong>${esc(item.title)}</strong><small>${item.duration} 分钟 · ${esc(item.format)}</small></span><span class="night-library-detail-label">介绍${chevron()}</span></button>
            <div class="night-library-select-row"><span id="night-library-status-${item.id}" class="night-library-position">${added ? `✓ 已选 · 第 ${index + 1} 段` : "未加入组合"}</span><button type="button" id="night-library-select-${item.id}" class="night-combo-add" data-action="night-combo:${added ? "remove" : "add"}:${item.id}" aria-describedby="night-library-status-${item.id}${notice ? ` night-library-feedback-${item.id}` : ""}" aria-label="${retrySelection ? "重试" : ""}${added ? "移除" : "加入"}${esc(item.title)}">${retrySelection ? `重试${added ? "移除" : "加入"}` : added ? "移除" : "+ 加入"}</button></div>
            ${notice ? `<div id="night-library-feedback-${item.id}" class="night-library-feedback ${notice.error ? "is-error" : ""}"><p role="${notice.error ? "alert" : "status"}">${esc(notice.message)}</p>${notice.undo ? button("撤销移除", `night-combo:undo:${item.id}`, "night-home-text") : ""}</div>` : ""}</article>`;
        }).join("")}</div>${button("选好了，查看组合", "go:NIG-05", "night-combo-secondary night-library-done")}${footer()}</div>`;
    }
    function editor() {
      const plan = playlist.plan(), session = current();
      const feedback = editorFeedback?.expected === JSON.stringify(state.nightPlan) ? editorFeedback : null;
      const arrow = direction => `<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" ${direction > 0 ? 'style="transform:rotate(180deg)"' : ""}><path d="m6 10 6-6 6 6M12 4v16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      return `<div class="night-screen night-home night-combo editor">${subhead(session ? "下次播放组合" : "播放组合")}
        <section class="night-editor-summary" aria-label="组合总览">${total(plan)}${button("+ 添加内容", "go:NIG-03", "night-home-text")}</section>
        <p class="night-editor-context">${session ? "这里只调整下次组合，不影响当前播放。" : "从上到下播放，点标题查看介绍。"}</p>
        ${feedback ? `<section class="night-editor-feedback ${feedback.error ? "is-error" : ""}" aria-label="编辑结果"><p role="${feedback.error ? "alert" : "status"}">${esc(feedback.message)}</p>${feedback.retry ? button("重试这次操作", "night-combo:editor-retry", "night-home-text") : feedback.undo ? button("撤销移除", "night-combo:editor-undo", "night-home-text") : ""}</section>` : ""}
        ${plan.ids.length ? `<ol class="night-combo-editor-list">${plan.tracks.map((item, i) => `<li data-editor-item="${item.id}" class="${feedback?.id === item.id && !feedback.error ? "is-updated" : ""}">${row(item, i).replace('<button ', `<button id="night-editor-detail-${item.id}" aria-label="查看第${i + 1}段${esc(item.title)}介绍" `)}<div class="night-combo-order-actions">${button(`${arrow(-1)}<span>上移</span>`, `night-combo:move:${item.id}:-1`, "night-home-text", i === 0).replace('<button ', `<button id="night-editor-up-${item.id}" aria-label="上移${esc(item.title)}" `)}${button(`${arrow(1)}<span>下移</span>`, `night-combo:move:${item.id}:1`, "night-home-text", i === plan.tracks.length - 1).replace('<button ', `<button id="night-editor-down-${item.id}" aria-label="下移${esc(item.title)}" `)}${button("移除", `night-combo:remove:${item.id}`, "night-home-text night-editor-remove").replace('<button ', `<button id="night-editor-remove-${item.id}" aria-label="移除${esc(item.title)}" `)}</div></li>`).join("")}</ol>` : '<div class="night-combo-empty"><h2>还没有选择内容</h2><p>添加一段，就可以开始。</p></div>'}
        <div class="night-combo-actions">${session ? button("返回当前播放器", "go:NIG-04", "night-home-primary") : button("开始组合播放", "night-start", "night-home-primary", !plan.ids.length)}</div>${session ? '<p class="night-editor-after">当前这组结束后，再手动开始新组合。</p>' : ""}${footer()}</div>`;
    }
    function editPlan(verb, key, value) {
      playlist.plan();
      const before = copy(state.nightPlan);
      const previous = editorFeedback?.expected === JSON.stringify(before) ? editorFeedback : null;
      if (verb === "editor-retry") {
        if (!previous?.retry) return;
        [verb, key, value] = previous.retry;
      }
      let after;
      if (verb === "editor-undo") {
        if (!previous?.undo || !previous.undo.ids.every(id => playlist.catalog().some(item => item.id === id))) return;
        key = previous.id;
        after = copy(previous.undo);
      } else {
        if (verb === "move" && !["-1", "1"].includes(value)) return;
        if (!(verb === "move" ? playlist.move(key, Number(value)) : playlist.remove(key))) return;
        after = copy(state.nightPlan);
        state.nightPlan = before;
      }
      const item = playlist.catalog().find(entry => entry.id === key);
      if (!item) return;
      if (!write({ nightPlan: after })) {
        editorFeedback = { id: key, expected: JSON.stringify(before), error: true, message: "这次修改没能保存，组合和顺序没有变化。", retry: [verb, key, value], ...(verb === "editor-undo" ? { undo: after } : {}) };
      } else {
        error = "";
        editorFeedback = { id: key, expected: JSON.stringify(after), message: verb === "remove" ? `已移除「${item.title}」。` : verb === "editor-undo" ? `已把「${item.title}」恢复到原来的位置。` : `「${item.title}」已移到第 ${after.ids.indexOf(key) + 1} 段。`, ...(verb === "remove" ? { undo: before } : {}) };
        track("night_plan_changed", { action: verb === "editor-undo" ? "undo" : verb, content_id: key, count: after.ids.length, source: after.mode });
      }
      render();
      const control = editorFeedback.error ? screen.querySelector('[data-action="night-combo:editor-retry"]') : verb === "remove" ? screen.querySelector('[data-action="night-combo:editor-undo"]') : screen.querySelector(`#night-editor-${Number(value) < 0 ? "up" : "down"}-${key}:not(:disabled)`) || screen.querySelector(`#night-editor-detail-${key}`);
      if (editorFeedback.error || verb === "remove") screen.querySelector('.night-editor-feedback')?.scrollIntoView({ block: "nearest" });
      control?.focus({ preventScroll: true });
    }
    function detail() {
      const detail = state.nightContentDetail;
      const raw = detail?.track || playlist.catalog().find(item => item.id === state.nightChoice) || playlist.catalog()[0];
      const item = raw && { ...raw, duration: Number(raw.duration) };
      if (!item || !Number.isFinite(item.duration) || item.duration <= 0 || item.duration > 1440 || typeof item.title !== "string" || !item.title.trim()) {
        detailRenderedAddition = null;
        return `<div class="night-screen night-home night-combo detail">${subhead("内容介绍")}<section class="night-combo-empty"><h2>这段内容信息不完整</h2><p>暂时无法展示介绍，已选组合保持不变。</p></section>${button("选择其他内容", "go:NIG-03", "night-home-primary")}</div>`;
      }
      const available = playlist.catalog().find(entry => entry.id === item.id), plan = playlist.plan(), index = plan.ids.indexOf(item.id), added = index >= 0;
      const different = available && (available.duration !== item.duration || available.title !== item.title);
      const next = Boolean(current()), origin = detail?.returnRoute;
      const targetName = next ? "下次组合" : "待播组合";
      const steps = Array.isArray(item.steps) && item.steps.length ? item.steps : ["原记录未保留这段内容的详细介绍。"];
      const returnLabel = origin === "NIG-10" ? "返回播放历史" : origin === "NIG-04" ? "返回播放器" : origin === "NIG-05" ? "返回编辑组合" : "返回继续选择";
      detailRenderedAddition = available ? { id: available.id, duration: available.duration, title: available.title } : null;
      const label = !available ? "当前暂不可加入" : added ? `查看${targetName}` : detailError ? "重试加入" : different ? `加入 ${available.duration} 分钟版本` : next ? "加入下次组合" : "加入播放组合";
      const context = !available ? "这段内容已不在可选列表，原介绍仍可查看。" : added ? `已在${targetName} · 第 ${index + 1} 段${different ? ` · ${available.duration} 分钟版本` : ""}` : `加入后排在第 ${plan.ids.length + 1} 段${next ? "，不影响当前播放" : "，不会自动播放"}`;
      return `<div class="night-screen night-home night-combo detail">${subhead("内容介绍")}
        <section class="night-combo-detail-hero"><div class="night-detail-identity"><img src="${symbol}" alt="" width="44" height="52"><div><p>${esc(item.format || "放松音频")}</p><h2>${esc(item.title)}</h2></div></div><div class="night-combo-total"><span>${esc(item.sound || "原播放内容")}</span><strong>${item.duration} 分钟</strong></div><p>${esc(item.description || item.intro || "原记录仅保留了名称与时长。")}</p></section>
        <section class="night-detail-decision" aria-label="加入播放组合"><p class="night-detail-status" role="status">${esc(context)}</p>
          ${different ? `<p class="night-detail-version">正在查看 ${item.duration} 分钟版本，当前可加入的是 ${available.duration} 分钟版本。</p>` : ""}
          ${detailError || error ? `<p class="night-detail-error" role="alert">${esc(detailError || error)}</p>` : ""}
          ${button(label, added ? "go:NIG-05" : `night-combo:add:${item.id}`, "night-home-primary", !available)}
          <div class="night-detail-plan-summary"><span>${plan.ids.length ? `${targetName} ${plan.ids.length} 段 · 共 ${plan.total} 分钟` : "组合还是空的"}</span>${button(!available ? "选其他内容" : added ? "继续选择" : "查看组合", !available ? "go:NIG-03" : added ? "night-combo:back" : "go:NIG-05", "night-home-text")}</div>
        </section>
        <section class="night-detail-fit"><h2>什么时候想听</h2><p>${esc(item.fit || "按自己的喜好选择，不必勉强完成。")}</p></section>
        <div class="night-detail-disclosures"><details><summary><span>会听到什么</span>${chevron()}</summary><div><p>${esc(item.intro || "原记录没有保留更多介绍。")}</p><ol>${steps.map(step => `<li>${esc(step)}</li>`).join("")}</ol></div></details><details><summary><span>收听小提醒</span>${chevron()}</summary><div><p>${esc(item.boundary || "用舒适音量收听；不舒服时暂停。")}</p></div></details></div>
        <div class="night-detail-return">${button(returnLabel, "night-combo:back", "night-home-text")}</div><p class="night-home-boundary">内容与播放操作演示，当前不输出音频。</p></div>`;
    }
    function player() {
      const session = current();
      if (!session) return `<div class="night-screen night-home night-combo player">${subhead("播放器", "go:NIG-01")}<div class="night-combo-empty"><h2>${state.nightSession?.status === "ended" ? "这次播放已结束" : "还没有开始播放"}</h2><p>${state.nightSession?.status === "ended" ? "可以回看记录，或再选一组内容。" : "先选好组合，再开始收听。"}</p></div>${button(state.nightSession?.status === "ended" ? "查看播放记录" : "选择内容", state.nightSession?.status === "ended" ? "go:NIG-10" : "go:NIG-01", "night-home-primary")}${state.nightSession?.status === "ended" ? button("再选一组", "go:NIG-01") : ""}${footer()}</div>`;
      if (!playable(session)) return `<div class="night-screen night-home night-combo player">${subhead("播放器", "go:NIG-01")}<div class="night-combo-empty"><h2>播放信息暂不可用</h2><p>这组内容的信息不完整，暂时无法继续。已有记录没有被改动。</p></div>${button("查看播放记录", "go:NIG-10", "night-home-primary")}${button("返回夜间", "go:NIG-01")}${supportEntry()}</div>`;
      const tracks = playlist.sessionTracks(session), seconds = position(session), part = playlist.segment(session, seconds);
      const pause = '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>';
      const skip = direction => `<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" ${direction < 0 ? 'style="transform:rotate(180deg)"' : ""}><path d="m5 5 10 7-10 7Z" fill="currentColor"/><path d="M19 5v14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
      return `<div class="night-screen night-home night-combo player">${subhead("播放器", "go:NIG-01")}
        <section class="night-combo-playing" data-part="${part.index}" data-complete="${part.complete}"><img class="night-player-symbol" src="${symbol}" width="44" height="52" alt=""><p role="status">${part.complete ? session.skipped ? "已到组合结尾" : "整组已听完" : session.status === "paused" ? "已暂停" : "正在播放"} · 第 ${part.index + 1} / ${tracks.length} 段</p><h2>${esc(part.track.title)}</h2><p>${esc(part.track.format || "放松音频")} · ${part.track.duration} 分钟</p></section>
        <div class="night-combo-progress-label"><span>本段 <span data-combo-part-time>${time(part.elapsedSeconds)}</span></span><span>${time(part.totalSeconds)}</span></div><progress data-combo-part-progress value="${part.elapsedSeconds}" max="${part.totalSeconds || 1}" aria-label="本段播放进度"></progress>
        <div class="night-player-controls ${tracks.length === 1 || part.complete ? "is-single" : ""}" role="group" aria-label="播放控制">${tracks.length > 1 && !part.complete ? button(`${skip(-1)}<span>上一段</span>`, "night-combo:jump:-1", "night-player-skip", part.index <= 0) : ""}${button(`${part.complete ? play : session.status === "playing" ? pause : play}<span>${part.complete ? "查看记录" : session.status === "playing" ? "暂停" : "继续播放"}</span>`, part.complete ? "night-end" : "toggle-player", "night-player-toggle")}${tracks.length > 1 && !part.complete ? button(`${skip(1)}<span>下一段</span>`, "night-combo:jump:1", "night-player-skip", part.index >= tracks.length - 1) : ""}</div>
        ${playerError?.id === session.id ? `<p class="night-player-error" role="alert">${esc(playerError.message)}</p>` : ""}${error ? `<p class="night-player-error" role="alert">${esc(error)}</p>${button("重试保存", "night-combo:retry-save")}` : ""}
        <div class="night-player-overall"><div class="night-combo-progress-label"><span data-combo-total-time>整组进度 ${time(seconds)}</span><span>${time(session.duration * 60)}</span></div><progress data-combo-total-progress value="${seconds}" max="${session.duration * 60}" aria-label="整组播放进度"></progress><p>${session.skipped ? "已切换过段落，这里显示播放位置，不代表实际收听时长。" : ""}</p></div>
        <details class="night-player-queue"><summary><span>本次组合</span><small>${tracks.length} 段 · ${session.duration} 分钟</small>${chevron()}</summary><p>点内容看介绍，不会切换播放。</p><ol class="night-combo-player-list">${tracks.map((item, index) => `<li class="${part.complete || index < part.index ? "done" : index === part.index ? "current" : ""}">${row(item, index, "session", part.complete || index < part.index ? session.skipped ? " · 已经过" : " · 已听完" : index === part.index ? " · 当前段" : " · 待播放")}</li>`).join("")}</ol></details>
        <button type="button" class="night-fade-player-link" data-action="go:NIG-12"><span>${session.fadeEnabled ? "音量渐弱已开启" : "音量渐弱已关闭"}</span>${chevron()}</button>
        ${endPrompt === session.id && !part.complete ? `<section class="night-player-end-confirm" aria-label="确认结束本次播放"><h2>结束本次播放？</h2><p>会保存这次记录。下次播放将重新开始；想稍后接着听，可以先暂停。</p><div>${button("暂不结束", "night-combo:end-cancel")}${button("结束并查看记录", "night-combo:end-confirm")}</div></section>` : !part.complete ? button("结束本次播放", "night-combo:end-ask", "night-home-text night-player-end") : ""}
        ${supportEntry()}<p class="night-home-boundary">播放操作演示，当前不输出音频。</p></div>`;
    }
    function save() {
      if (!write({ nightPlan: state.nightPlan, nightRecommendationGoal: state.nightRecommendationGoal, nightContentDetail: state.nightContentDetail })) {
        error = "暂时无法保存。组合还在当前页面，请重试后再离开。"; return false;
      }
      error = ""; return true;
    }
    function openDetail(source, id, snapshot) {
      const item = snapshot || (source === "session" ? playlist.sessionTracks(current()) : playlist.catalog()).find(item => item.id === id);
      if (!item) return;
      const description = playlist.catalog().find(entry => entry.id === id);
      detailError = "";
      state.nightContentDetail = { track: copy({ ...description, ...item }), returnRoute: state.current };
      if (!save()) return render();
      openingDetail = true; go("NIG-02"); openingDetail = false;
    }
    function back() {
      if (!save()) return render();
      const source = history.state?.trail?.at(-2);
      const target = state.current === "NIG-02" ? state.nightContentDetail?.returnRoute || "NIG-01" : state.current === "NIG-03" && ["NIG-01", "NIG-05"].includes(source) || state.current === "NIG-05" && ["NIG-01", "NIG-02", "NIG-03"].includes(source) ? source : "NIG-01";
      if (history.state?.trail?.at(-2) === target) return history.back();
      go(target, false);
    }
    function enter(target, from) {
      if (target === "NIG-05" && !["NIG-02", "NIG-03", "NIG-05"].includes(from)) editorFeedback = null;
      if (from === "NIG-04" && target !== from) { endPrompt = ""; playerError = null; }
      if (target === "NIG-03" && from !== target && from !== "NIG-02") libraryFeedback = null;
      if (target !== "NIG-02" || from === target || openingDetail) return;
      detailError = "";
      const item = playlist.catalog().find(item => item.id === state.nightChoice) || playlist.catalog()[0];
      state.nightContentDetail = item ? { track: copy(item), returnRoute: from } : null;
    }
    function restore(target, detail, from) { if (target !== "NIG-02") return; detailError = ""; if (detail?.track?.id) state.nightContentDetail = copy(detail); else enter(target, from); }
    function historyFields(target) { return target === "NIG-02" ? { nightContentDetail: state.nightContentDetail } : {}; }
    function handle(action) {
      if (typeof action !== "string" || !action.startsWith("night-combo:")) return false;
      const [, verb, key, value] = action.split(":");
      if (!["NIG-01", "NIG-02", "NIG-03", "NIG-04", "NIG-05", "NIG-10"].includes(state.current)) return true;
      if (verb === "detail") { openDetail(key, value); return true; }
      if (verb === "history") {
        const record = state.nightHistory.find(item => item.id === key);
        const item = record && /^\d+$/.test(value) ? playlist.sessionTracks(record)[Number(value)] : null;
        if (item) openDetail("history", item.id, item);
        return true;
      }
      if (verb === "back") { back(); return true; }
      if (state.current === "NIG-05" && ["move", "remove", "editor-undo", "editor-retry"].includes(verb)) {
        editPlan(verb, key, value);
        return true;
      }
      if (["end-ask", "end-cancel", "end-confirm"].includes(verb)) {
        const session = current();
        if (state.current !== "NIG-04" || !playable(session)) return true;
        if (verb === "end-confirm") { if (endPrompt === session.id) finish(); return true; }
        endPrompt = verb === "end-ask" ? session.id : "";
        render();
        if (endPrompt) screen.querySelector('.night-player-end-confirm')?.scrollIntoView({ block: "nearest" });
        screen.querySelector(`[data-action="night-combo:${endPrompt ? "end-cancel" : "end-ask"}"]`)?.focus({ preventScroll: true });
        return true;
      }
      if (state.current === "NIG-03" && ["add", "remove", "undo"].includes(verb)) {
        const item = playlist.catalog().find(item => item.id === key);
        if (!item) return true;
        playlist.plan();
        const before = copy(state.nightPlan);
        let after;
        if (verb === "undo") {
          if (libraryFeedback?.id !== key || !libraryFeedback.undo || libraryFeedback.expected !== JSON.stringify(before)) return true;
          after = copy(libraryFeedback.undo);
          if (!after.ids.every(id => playlist.catalog().some(entry => entry.id === id))) return true;
        } else {
          if (!playlist[verb](key)) return true;
          after = copy(state.nightPlan);
          state.nightPlan = before;
        }
        if (!write({ nightPlan: after })) {
          libraryFeedback = { id: key, expected: JSON.stringify(before), error: true, message: `${verb === "undo" ? "没能撤销，点下方再试。" : "这次没能保存，请重试。"}原组合没有变化。`, ...(verb === "undo" ? { undo: after } : {}) };
        } else {
          error = "";
          libraryFeedback = { id: key, expected: JSON.stringify(after), message: verb === "remove" ? "已从组合移除。" : verb === "undo" ? "已恢复到原来的位置。" : `已加入${current() ? "下次" : "待播"}组合。`, ...(verb === "remove" ? { undo: before } : {}) };
          track("night_plan_changed", { action: verb, content_id: key, count: after.ids.length, source: after.mode });
        }
        render();
        const focus = verb === "undo" && libraryFeedback?.error ? screen.querySelector(`[data-action="night-combo:undo:${key}"]`) : screen.querySelector(`#night-library-select-${key}`);
        focus?.focus({ preventScroll: true });
        return true;
      }
      if (verb === "add" && state.current === "NIG-02") {
        const available = playlist.catalog().find(item => item.id === key);
        if (!available || detailRenderedAddition?.id !== key || state.nightContentDetail?.track?.id && state.nightContentDetail.track.id !== key) return true;
        if (detailRenderedAddition.duration !== available.duration || detailRenderedAddition.title !== available.title) { detailError = "可选版本有变化，请确认后再加入。"; render(); return true; }
        playlist.plan();
        const before = copy(state.nightPlan);
        if (!playlist.add(key)) { detailError = ""; render(); return true; }
        const after = copy(state.nightPlan);
        state.nightPlan = before;
        if (!write({ nightPlan: after })) detailError = "还没加入成功，原组合没有变化。请再试一次。";
        else { detailError = ""; error = ""; track("night_plan_changed", { action: "add", content_id: key, count: after.ids.length, source: after.mode }); }
        render();
        screen.querySelector('.night-detail-decision .night-home-primary')?.focus({ preventScroll: true });
        return true;
      }
      if (verb === "jump") {
        const session = current();
        if (state.current !== "NIG-04" || !playable(session) || !["-1", "1"].includes(key)) return true;
        const tracks = playlist.sessionTracks(session), part = playlist.segment(session, position(session)), index = part.index + Number(key);
        if (part.complete || index < 0 || index >= tracks.length) return true;
        const next = { ...session, positionSeconds: tracks.slice(0, index).reduce((total, item) => total + item.duration * 60, 0), resumedAt: new Date().toISOString(), skipped: true };
        if (!write({ nightSession: next })) playerError = { id: session.id, message: "没能切换段落，播放位置没有改变。请再点一次切段按钮。" }; else { playerError = null; error = ""; }
        render();
        (screen.querySelector(`[data-action="night-combo:jump:${key}"]:not(:disabled)`) || screen.querySelector('.night-player-toggle'))?.focus({ preventScroll: true });
        return true;
      }
      let changed = false;
      if (verb === "goal" && goals[key]) { playlist.setGoal(key); changed = true; }
      if (verb === "recommend") { playlist.useRecommendation(); changed = true; }
      if (verb === "add") changed = playlist.add(key);
      if (verb === "remove") changed = playlist.remove(key);
      if (verb === "move" && ["-1", "1"].includes(value)) changed = playlist.move(key, Number(value));
      if (changed || verb === "retry-save") {
        const saved = save();
        if (changed && saved) track("night_plan_changed", { action: verb, content_id: ["add", "remove", "move"].includes(verb) ? key : "", count: playlist.plan().ids.length, source: state.nightPlan?.mode });
        render();
        if (verb === "recommend" && saved) screen.querySelector('.night-combo-plan')?.scrollIntoView({ block: "start", behavior: "auto" });
        if (verb === "remove") screen.querySelector('.night-combo-add, .night-combo-order-actions button:not(:disabled), .night-combo-actions button')?.focus({ preventScroll: true });
      }
      return true;
    }
    function tick() {
      const pending = pendingSnooze(), wakeCard = screen.querySelector("[data-snooze-home]");
      if (state.current === "NIG-01" && wakeCard && pending && wakeCard.dataset.snoozeHome !== String(Date.parse(pending.dueAt) > Date.now())) { wakeCard.outerHTML = wake(); }
      const session = current(); if (!session) return;
      if (state.current === "NIG-04" && !playable(session)) return;
      const seconds = position(session), part = playlist.segment(session, seconds);
      const marker = screen.querySelector(".night-combo-playing, .night-combo-active");
      if (!marker) return;
      if (Number(marker.dataset.part) !== part.index || marker.dataset.complete !== String(part.complete)) return render();
      const update = (selector, value) => { const el = screen.querySelector(selector); if (el) el.textContent = value; };
      update("[data-combo-home-time]", `${session.skipped ? "播放进度" : "整组已听"} ${time(seconds)}`);
      update("[data-combo-part-time]", time(part.elapsedSeconds));
      update("[data-combo-total-time]", `整组进度 ${time(seconds)}`);
      const partial = screen.querySelector("[data-combo-part-progress]"); if (partial) partial.value = part.elapsedSeconds;
      const overall = screen.querySelector("[data-combo-total-progress], .night-combo-active progress"); if (overall) overall.value = seconds;
    }
    return { body, library, editor, detail, player, handle, tick, enter, restore, historyFields };
  };
}());
