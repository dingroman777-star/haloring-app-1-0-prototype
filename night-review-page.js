(function () {
  window.createHaloNightReview = function ({ state, pages, go, render, write, track, esc, screen }) {
    const executions = { complete: "完整做了", partial: "做了一部分", none: "没有跟着做" };
    const feelings = { helpful: "有帮助", neutral: "没明显感觉", unhelpful: "不太适合", unknown: "暂时说不清" };
    const factors = { late: "比平时晚睡", exercise: "有运动", alcohol: "有饮酒", emotion: "情绪有起伏", none: "没有特别的" };
    let error = "", errorSession = "";
    const object = value => value && typeof value === "object" && !Array.isArray(value);
    const owns = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
    function prepare() {
      if (!object(state.nightReviewDrafts)) state.nightReviewDrafts = {};
    }
    function session() {
      const records = state.nightHistory.filter(item => window.HaloPersonalScope.ownsNight(state, item));
      return state.selectedNightSessionId
        ? records.find(item => item.id === state.selectedNightSessionId) || null
        : records[0] || null;
    }
    const guided = item => Array.isArray(item.tracks) ? item.tracks.some(part => ["breath", "scan"].includes(part.id)) : ["breath", "scan"].includes(item.contentId);
    function copy(value) {
      const source = object(value) ? value : {};
      const list = Array.isArray(source.factors) ? [...new Set(source.factors.filter(key => owns(factors, key)))] : [];
      return { execution: owns(executions, source.execution) ? source.execution : "", helpfulness: owns(feelings, source.helpfulness) ? source.helpfulness : "", factors: list.includes("none") ? ["none"] : list };
    }
    function draft(item = session()) {
      prepare();
      return item && owns(state.nightReviewDrafts, item.id) && object(state.nightReviewDrafts[item.id]) ? copy(state.nightReviewDrafts[item.id]) : null;
    }
    function values(item) { return draft(item) || copy(item.review); }
    function isEditing(item) { return !item.review?.saved || Boolean(draft(item)); }
    function ready(item, value) {
      return guided(item) ? Boolean(value.execution && (value.execution === "none" || value.helpfulness)) : Boolean(value.helpfulness);
    }
    function destination() {
      const entry = state.nightReviewEntry;
      return entry && session() && entry.sessionId === session().id && entry.route !== "TOD-08" && pages.some(item => item.id === entry.route) ? entry.route : "NIG-10";
    }
    function enter(target, from) {
      if (target !== "TOD-08" || from === "TOD-08") return;
      const selected = session();
      if (state.nightReviewEntry?.sessionId !== selected?.id) delete state.pageViews["TOD-08"];
      state.nightReviewEntry = { sessionId: selected?.id || "", route: pages.some(item => item.id === from) ? from : "NIG-10" };
      error = "";
    }
    function fail(message) {
      error = message; errorSession = session()?.id || "";
      render();
      screen.querySelector(".night-review-error")?.focus();
    }
    function historyFields(target) {
      return target === "TOD-08" ? { nightReviewContext: { sessionId: session()?.id || state.selectedNightSessionId || "", entry: state.nightReviewEntry } } : {};
    }
    function restore(target, context, from) {
      if (target !== "TOD-08") return;
      if (!object(context) || typeof context.sessionId !== "string") return enter(target, from);
      if (state.selectedNightSessionId !== context.sessionId) delete state.pageViews["TOD-08"];
      state.selectedNightSessionId = context.sessionId;
      state.nightReviewEntry = object(context.entry) ? { ...context.entry } : null;
      error = "";
    }
    function fresh() {
      error = ""; delete state.pageViews["TOD-08"];
      render(); screen.scrollTop = 0;
      screen.querySelector("h1")?.focus({ preventScroll: true });
    }
    function back() {
      // Back and Later retain drafts. Only the explicit Cancel action discards an edit.
      if (draft() && !write()) return fail("暂时无法保留记录，请重试。你填写的内容还在本页，先不要关闭页面。");
      const target = destination();
      const stack = state.tabStacks["TOD-01"];
      if (stack?.at(-1) === "TOD-08") stack.pop();
      if (history.state?.trail?.at(-2) === target) return history.back();
      go(target, false);
    }
    function choose(key, value) {
      const item = session();
      if (!item || !isEditing(item)) return;
      const next = values(item);
      if (key === "execution") {
        if (!guided(item) || !owns(executions, value)) return;
        next.execution = value;
        if (value === "none") next.helpfulness = "";
      } else if (key === "helpfulness") {
        if (!owns(feelings, value) || guided(item) && (!next.execution || next.execution === "none")) return;
        next.helpfulness = value;
      } else {
        if (!owns(factors, value)) return;
        next.factors = value === "none" ? next.factors.includes(value) ? [] : [value]
          : next.factors.includes(value) ? next.factors.filter(key => key !== value) : [...next.factors.filter(key => key !== "none"), value];
      }
      state.nightReviewDrafts[item.id] = next;
      error = "";
      if (!write()) return fail("草稿暂时没能保留。你的选择还在本页，请先不要关闭页面，稍后重试保存。");
      render();
    }
    function save() {
      const item = session();
      if (!item || !isEditing(item)) return;
      const value = values(item);
      if (!ready(item, value)) return fail("请先选择本次感受；说不清也没关系。");
      const previous = item.review, previousDraft = draft(item);
      const review = { ...copy(previous), ...value, execution: guided(item) ? value.execution : "", helpfulness: guided(item) && value.execution === "none" ? "" : value.helpfulness, saved: true, savedAt: new Date().toISOString() };
      item.review = review;
      delete state.nightReviewDrafts[item.id];
      if (!write()) {
        item.review = previous;
        state.nightReviewDrafts[item.id] = previousDraft || value;
        track("night_reflection_save_failed", { session_id: item.id, reason: "local_storage" });
        return fail("这次没能保存，请重试。你填写的内容还在本页，先不要关闭页面。");
      }
      track("night_reflection_saved", { session_id: item.id, content_id: item.contentId, review_kind: guided(item) ? "guided" : "audio", execution: review.execution, helpfulness: review.helpfulness, factor_count: review.factors.length, updated: Boolean(previous?.saved) });
      fresh();
    }
    function cancel() {
      const item = session(), previousDraft = draft(item);
      if (!item?.review?.saved || !previousDraft) return;
      delete state.nightReviewDrafts[item.id];
      if (!write()) {
        state.nightReviewDrafts[item.id] = previousDraft;
        return fail("暂时无法取消修改，请重试。原记录没有改变。");
      }
      fresh();
    }
    function handle(action) {
      if (typeof action !== "string" || !action.startsWith("night-review-")) return false;
      if (state.current !== "TOD-08" || !state.signedIn) return true;
      if (action === "night-review-back") back();
      else if (action === "night-review-save") save();
      else if (action === "night-review-cancel") cancel();
      else if (action === "night-review-edit") {
        const item = session();
        if (item?.review?.saved) {
          prepare(); state.nightReviewDrafts[item.id] = copy(item.review);
          if (!write()) fail("修改草稿暂时无法保留，原记录没有改变。请先不要关闭页面。");
          else fresh();
        }
      } else if (action.startsWith("night-review-execution:")) choose("execution", action.slice(23));
      else if (action.startsWith("night-review-help:")) choose("helpfulness", action.slice(18));
      else if (action.startsWith("night-review-factor:")) choose("factors", action.slice(20));
      return true;
    }
    function options(labels, selected, prefix, extra = "") {
      return `<div class="night-review-options ${extra}">${Object.entries(labels).map(([key, label]) => `<button type="button" data-action="night-review-${prefix}:${key}" aria-pressed="${Array.isArray(selected) ? selected.includes(key) : selected === key}"><span>${esc(label)}</span><i aria-hidden="true">✓</i></button>`).join("")}</div>`;
    }
    function dateLabel(value) {
      const date = new Date(value);
      return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(date) : "结束时间待确认";
    }
    function body() {
      prepare();
      const item = session();
      const header = `<header class="night-review-head"><button type="button" data-action="night-review-back" aria-label="返回上一页">← 返回</button><h1 tabindex="-1">收听回顾</h1></header>`;
      if (!item) return `${header}<section class="night-review-empty"><span aria-hidden="true">◷</span><h2>${state.nightHistory.length ? "没有找到这次收听" : "还没有收听记录"}</h2><p>${state.nightHistory.length ? "可以返回播放历史，重新选择一条记录。" : "听完一段内容后，可以在这里记下感受。"}</p><button class="primary" data-action="go:${state.nightHistory.length ? "NIG-10" : "NIG-01"}">${state.nightHistory.length ? "查看播放历史" : "选一段内容"}</button></section>`;
      const value = values(item), editing = isEditing(item), practice = guided(item);
      const seconds = Number(item.positionSeconds);
      const duration = Number.isFinite(seconds) && seconds >= 0 ? `${Math.floor(seconds / 60)} 分${Math.floor(seconds % 60) ? ` ${Math.floor(seconds % 60)} 秒` : ""}` : "时长待确认";
      const summary = `<section class="night-review-session"><div class="night-review-session-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 14v-3a8 8 0 0 1 16 0v3M4 12H3v7h4v-7H4Zm16 0h1v7h-4v-7h3Z"/></svg></div><div><p>${practice ? "引导练习" : "音频收听"}</p><h2>${esc(item.title || "本次收听")}</h2><time datetime="${esc(item.endedAt)}">${esc(dateLabel(item.endedAt))} 结束</time></div><div class="night-review-duration"><span>${item.skipped ? "播放进度" : "已听"}</span><strong>${esc(duration)}</strong></div></section>${Array.isArray(item.tracks) && item.tracks.length ? `<details class="night-review-factors"><summary><span>本次播放组合<small>${item.tracks.length} 段 · 共 ${Number(item.duration)} 分钟${item.skipped ? " · 含手动跳段" : ""}</small></span><i aria-hidden="true">＋</i></summary><ol>${item.tracks.map(part => `<li>${esc(part.title)} · ${Number(part.duration)} 分钟</li>`).join("")}</ol></details>` : ""}`;
      const errorHtml = error && errorSession === item.id ? `<p class="night-review-error" role="alert" tabindex="-1">${esc(error)}</p>` : "";
      const factorText = value.factors.map(key => factors[key]).join("、");
      if (!editing) return `${header}<article class="night-review">${summary}<section class="night-review-saved"><p class="night-review-success" role="status"><span aria-hidden="true">✓</span> 本次感受已保存</p><dl>${practice ? `<div><dt>这次练习</dt><dd>${esc(executions[value.execution] || "未记录")}</dd></div>` : ""}${!practice || value.execution !== "none" ? `<div><dt>你的感受</dt><dd>${esc(feelings[value.helpfulness] || "未记录")}</dd></div>` : ""}<div><dt>其他补充</dt><dd>${esc(factorText || "没有补充")}</dd></div></dl><button class="night-review-edit" data-action="night-review-edit">修改记录 <span aria-hidden="true">↗</span></button></section><p class="night-review-boundary">这是你的感受记录，不会改变戒指测得的数据。</p>${errorHtml}<div class="night-review-actions"><button class="primary" data-action="night-review-back">${destination() === "NIG-10" ? "返回播放历史" : "返回上一页"}</button></div></article>`;
      const canRate = !practice || value.execution && value.execution !== "none";
      const canSave = ready(item, value);
      const hint = canSave ? draft(item) ? "草稿已保留 · 尚未保存" : "" : practice && !value.execution ? "先选一下这次是否跟着做了" : "选一个最接近的感受，说不清也没关系";
      return `${header}<article class="night-review">${summary}${practice ? `<fieldset><legend>这次跟着做了吗？</legend>${options(executions, value.execution, "execution", "practice")}</fieldset>` : ""}${canRate ? `<fieldset><legend>这次听下来，感觉怎么样？</legend>${options(feelings, value.helpfulness, "help")}</fieldset>` : ""}<details class="night-review-factors"><summary><span>还有想补充的吗？<small>选填 · 可多选</small></span><i aria-hidden="true">＋</i>${factorText ? `<em>${esc(factorText)}</em>` : ""}</summary>${options(factors, value.factors, "factor")}</details><p class="night-review-boundary">只记录你的感受，不用判断有没有效果。</p>${errorHtml}<div class="night-review-actions"><p id="night-review-hint" role="status">${errorHtml ? "尚未保存" : hint}</p><button class="primary" data-action="night-review-save" aria-describedby="night-review-hint" ${canSave ? "" : "disabled"}>${errorHtml && canSave ? "重试保存" : "保存本次感受"}</button><button class="night-review-later" data-action="night-review-back">${draft(item) ? "保留草稿，稍后再记" : "稍后再记"}</button>${item.review?.saved ? '<button class="night-review-cancel" data-action="night-review-cancel">取消修改，保留原记录</button>' : ""}</div></article>`;
    }
    return { body, handle, enter, back, historyFields, restore };
  };
})();
