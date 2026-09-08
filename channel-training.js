/* Local advisor training. Course policy copy remains in commercial-pages.js. */
(() => {
  const QUESTIONS = [
    { id: "product", label: "产品信息", question: "可以承诺未开售商品的确定交付日期吗？", explanation: "以当前商品页公布的信息为准，不自行承诺交付日期。" },
    { id: "health", label: "健康功能", question: "Halo 能诊断失眠吗？", explanation: "Halo 提供日常身体状态参考，不用于疾病诊断。" },
    { id: "orders", label: "推荐与收益", question: "同一订单可同时获得会员推荐奖励和渠道现金收益吗？", explanation: "同一订单不能重复获得这两类奖励。" }
  ];
  window.HALO_CHANNEL_TRAINING = {
    create({ state, courses, completed, persist, read, storageKey, resume, shell, feedback, actions, progress, escape: e }) {
      if (typeof state.trainingApplicationId !== "string") state.trainingApplicationId = state.applicationSnapshot?.id || "";
      let context = {}, error = "";
      const id = () => typeof state.applicationSnapshot?.id === "string" ? state.applicationSnapshot.id : "";
      const owned = () => Boolean(id() && state.applicationSnapshot?.ownerAccount === session().accountRef && state.trainingApplicationId === id());
      const editable = () => owned() && state.applicationStatus === "training" && state.channelIdentity === "application";
      const allDone = () => completed().length === courses.length;
      const passed = () => allDone() && state.assessmentPassed && courses.every(course => state.assessmentAnswers?.[course.id] === "no");
      const session = () => context.applicationContext?.() || {};
      const scope = () => `data-training-application="${e(id())}" data-training-session="${e(session().key || "")}"`;
const snapshotFields = ["applicationSnapshot", "applicationStatus", "channelIdentity", "applicationHistory", "completedCourses", "selectedCourseId", "assessmentAnswers", "assessmentPassed", "assessmentFeedback", "trainingApplicationId", "trainingVisit", "applicationReviewQuery", "applicationSupplement", "activationReady", "channelAgreementConfirmed", "activationRequest", "channelActivation", "channelMode", "channelAvailableCents", "withdrawals", "selectedEarningId", "channelWithdrawal", "selectedPolicyId", "channelContentSelection", "channelContentReads", "channelPromotion"];
      const project = data => Object.fromEntries(snapshotFields.map(key => [key, key === "trainingApplicationId" ? data[key] ?? data.applicationSnapshot?.id ?? "" : data[key] ?? null]));
      let diskMark = JSON.stringify(project(read()));
      function syncFromDisk() {
        if (window.haloChannelStorage) return window.haloChannelStorage.sync();
        const saved = read(), values = project(saved), mark = JSON.stringify(values);
        if (mark === diskMark) return false;
        diskMark = mark;
        if (mark === JSON.stringify(project(state))) return false;
        // Refresh channel application/ledger fields only, never consumer orders or Points.
        const empty = { applicationSnapshot: null, applicationStatus: "none", channelIdentity: "inactive", applicationHistory: [], completedCourses: [], selectedCourseId: "product", assessmentAnswers: {}, assessmentPassed: false, assessmentFeedback: "", trainingVisit: null, activationReady: false, channelAgreementConfirmed: false, activationRequest: null };
        for (const key of snapshotFields) state[key] = Object.hasOwn(saved, key) ? saved[key] : empty[key];
        state.trainingApplicationId = values.trainingApplicationId;
        error = ""; return true;
      }
      function save() {
        const ok = persist();
        if (ok) diskMark = JSON.stringify(project(state));
        return ok;
      }
      function matches(page) {
        const root = document.querySelector("[data-training-application]");
        return session().signedIn && document.getElementById("screen")?.dataset.page === page && root?.dataset.trainingApplication === id() && root.dataset.trainingSession === session().key;
      }
      function changed() { context.render?.(); context.flash?.("申请或学习进度已变化，请从当前页面继续"); return true; }
      function nextCourse() {
        const visit = state.trainingVisit;
        return courses.find(course => visit?.applicationId === id() && visit.courseId === course.id && !completed().includes(course.id)) || courses.find(course => !completed().includes(course.id));
      }
      function observe(item, ctx) {
        context = { ...context, ...ctx };
        if (["CHN-08", "CHN-09", "CHN-10", "CHN-11", "CHN-12", "CHN-13", "CHN-14", "CHN-15", "CHN-16", "CHN-17", "CHN-18", "CHN-19", "CHN-20", "CHN-21", "CHN-22", "CHN-23", "CHN-24", "CHN-25", "CHN-26"].includes(item.id)) syncFromDisk();
      }
      function gate(item) {
        const next = owned() ? resume() : id() ? { title: "学习记录待核对", detail: "这份学习记录与当前申请不一致，请联系客服核对。", label: "联系客服核对", route: "HELP-03" } : resume();
        return shell(item, "体验顾问", `${feedback(next.title || "先完成体验顾问申请", next.detail || "提交申请资料后，再开始必修学习。", "plain")}${actions([[next.label || "开始申请", "commercial:training-progress", "primary"]])}`);
      }
      function home(item) {
        if (!owned()) return gate(item);
        const done = completed(), next = nextCourse(), visit = state.trainingVisit, current = resume();
        const primaryLabel = !editable() ? current.label : passed() ? "继续提交审核" : allDone() ? Object.keys(state.assessmentAnswers || {}).length ? "继续测评" : "进入测评" : done.length || visit?.applicationId === id() ? "继续学习" : "开始学习";
        const overview = editable() ? `<section class="training-summary"><div><strong>${done.length} / ${courses.length}</strong><span>已完成课程</span></div>${progress(Math.round(done.length / courses.length * 100), "学习进度")}</section><p class="training-guidance">${passed() ? "测评已通过，下一步提交申请审核。" : allDone() ? "三门课程已完成，接下来进行测评。" : "完成三门课程后，即可进入测评。"}</p>` : feedback(current.title, `${current.detail} 课程仍可回顾。`, "plain");
        const list = courses.map((course, index) => {
          const complete = done.includes(course.id), recent = !complete && visit?.applicationId === id() && visit.courseId === course.id;
          const status = complete ? "已完成 · 回顾" : !editable() ? "查看内容" : recent ? "继续阅读" : next?.id === course.id ? "接下来" : "未开始";
          return `<button class="training-course ${complete ? "is-complete" : editable() && next?.id === course.id ? "is-next" : ""}" data-action="commercial:course-open:${course.id}"><span class="training-course-number" aria-hidden="true">${complete ? "✓" : String(index + 1).padStart(2, "0")}</span><span class="training-course-copy"><strong>${e(course.title)}</strong><small>${e(status)}</small></span><span class="training-course-arrow" aria-hidden="true">›</span></button>`;
        }).join("");
        return shell(item, "体验顾问 · 必修学习", `<div class="channel-training" ${scope()}>${overview}<section class="training-course-list" aria-label="必修课程">${list}</section>${error ? feedback("暂未保存", error, "warm") : ""}${actions([[primaryLabel, "commercial:training-continue", "primary"], [editable() ? "查看申请进度" : "查看原申请资料", editable() ? "go:CHN-11" : "go:CHN-07", "secondary"]])}</div>`);
      }
      function coursePage(item) {
        if (!owned()) return gate(item);
        const course = courses.find(course => course.id === state.selectedCourseId);
        if (!course) return shell(item, "体验顾问", `${feedback("未找到这门课程", "请返回课程列表重新选择，已有进度会保留。", "plain")}${actions([["返回课程列表", "go:CHN-08", "primary"]])}`);
        const visit = state.trainingVisit, done = completed(), complete = done.includes(course.id), index = courses.indexOf(course);
        const canContinue = editable() && visit?.applicationId === id() && visit.courseId === course.id && visit.sessionKey === session().key;
        const next = courses.find(candidate => candidate.id !== course.id && !done.includes(candidate.id));
        const label = !canContinue ? "返回课程列表" : complete ? next ? "学习下一课" : "进入测评" : next ? "完成并学习下一课" : "完成并进入测评";
        const explanation = !editable() ? feedback("课程回顾", "可随时查看课程内容，原学习记录保持不变。", "plain") : !canContinue ? feedback("从课程列表继续", "请先在课程列表选择本课，已有进度会保留。", "plain") : "";
        const points = String(course.body).match(/[^。！？]+[。！？]?/g) || [course.body];
        const body = `<div class="channel-lesson" ${scope()} data-training-course="${course.id}">
          <div class="lesson-position"><span>第 ${index + 1} / ${courses.length} 课</span><span class="${complete ? "is-complete" : ""}">${complete ? "✓ 本课已完成" : editable() ? "阅读中" : "课程回顾"}</span></div>
          ${explanation}<article class="lesson-reading"><h2>本课要点</h2><ul>${points.map(point => `<li>${e(point)}</li>`).join("")}</ul></article>
          <aside class="lesson-takeaway"><span aria-hidden="true">◎</span><div><h2>记住这一点</h2><p>${e(course.takeaway)}</p></div></aside>
          <section class="lesson-actions">${error ? `<div role="alert">${feedback("暂未保存", error, "warm")}</div>` : ""}
          ${canContinue ? `<p class="lesson-next-hint">${next ? `下一课：${e(next.title)}` : "接下来：培训测评"}</p>` : ""}
          ${actions([[label, canContinue ? `commercial:course-advance:${course.id}` : "go:CHN-08", "primary"], ...(canContinue ? [["返回课程列表", "go:CHN-08", "secondary"]] : [])])}</section></div>`;
        const header = `<header class="screen-head commercial-head"><div><button class="back" data-action="go:CHN-08" aria-label="返回课程列表">← 返回</button><span class="page-context">体验顾问 · 必修培训</span><h1>${e(course.title)}</h1></div></header>`;
        return `${header}<div class="stack commercial-stack">${body}</div>`;
      }
      function assessmentGate(item) {
        if (!owned() || !editable()) return gate(item);
        if (!allDone()) return shell(item, "体验顾问", `${feedback("先完成三门必修课程", "完成后再进入测评。", "plain")}${actions([["返回课程列表", "go:CHN-08", "primary"]])}`);
        return "";
      }
      const answeredCount = () => QUESTIONS.filter(question => ["yes", "no"].includes(state.assessmentAnswers?.[question.id])).length;
      function assessmentPage(item) {
        const blocked = assessmentGate(item); if (blocked) return blocked;
        const count = answeredCount(), correct = QUESTIONS.filter(question => state.assessmentAnswers?.[question.id] === "no").length;
        const checked = count === QUESTIONS.length && (["correct", "retry"].includes(state.assessmentFeedback) || passed());
        const result = checked ? `<section id="assessment-result" class="assessment-result ${passed() ? "is-passed" : "needs-retry"}" tabindex="-1" role="status"><strong>${passed() ? "✓ 测评已通过" : `有 ${QUESTIONS.length - correct} 道题需要再看一下`}</strong><p>${passed() ? "申请尚未提交。确认后，点击下方按钮提交审核。" : "已保留你的选择，请查看标出的题目，修改后重新核对。"}</p></section>` : "";
        const list = QUESTIONS.map((question, index) => {
          const answer = state.assessmentAnswers?.[question.id], wrong = checked && answer !== "no";
          return `<fieldset class="assessment-question ${wrong ? "is-wrong" : ""}" id="assessment-question-${question.id}"><legend>第 ${index + 1} 题：${e(question.question)}</legend><div class="assessment-question-heading" aria-hidden="true"><small>${String(index + 1).padStart(2, "0")} · ${e(question.label)}</small><span>${e(question.question)}</span></div><div class="assessment-options">${[["yes", "可以"], ["no", "不可以"]].map(([value, label]) => `<label class="assessment-option ${answer === value ? "is-selected" : ""}"><input type="radio" name="channel-assessment-${question.id}" value="${value}" ${answer === value ? "checked" : ""} ${checked ? `aria-describedby="assessment-explanation-${question.id}"` : ""}><span>${label}</span></label>`).join("")}</div>${checked ? `<p id="assessment-explanation-${question.id}" class="assessment-explanation"><strong>${wrong ? "需要修改" : "✓ 回答正确"}</strong>${e(question.explanation)}</p>` : ""}</fieldset>`;
        }).join("");
        const questions = passed() ? `<details class="assessment-review" ${document.querySelector(".assessment-review")?.open ? "open" : ""}><summary>查看我的答案<span>3 / 3 答对</span></summary><div>${list}</div></details>` : list;
        const body = `<div class="channel-assessment" ${scope()}><div class="assessment-overview"><strong>已答 ${count} / ${QUESTIONS.length}</strong><span>全部答对后可提交申请</span></div>${result}${questions}<section class="assessment-actions">${error ? `<div role="alert" tabindex="-1">${feedback("暂未完成", error, "warm")}</div>` : ""}<p id="assessment-action-hint" class="assessment-action-hint" aria-live="polite">${count < QUESTIONS.length ? `还有 ${QUESTIONS.length - count} 道题未选择` : passed() ? "测评通过不代表顾问身份已生效。" : "已全部选择，可以核对答案。"}</p>${actions([[passed() ? "提交申请审核" : checked ? "重新核对答案" : "核对答案", passed() ? "commercial:assessment-review" : "commercial:assessment-submit", "primary", count < QUESTIONS.length], ["返回课程列表", "go:CHN-08", "secondary"]])}</section></div>`;
        const header = `<header class="screen-head commercial-head"><div><button class="back" data-action="go:CHN-08" aria-label="返回课程列表">← 返回</button><span class="page-context">体验顾问 · 必修培训</span><h1>${e(item.name)}</h1></div></header>`;
        return `${header}<div class="stack commercial-stack">${body}</div>`;
      }
      function repaintAssessment(selector, keepScroll = false) {
        const screen = document.getElementById("screen"), top = screen?.scrollTop || 0;
        context.render();
        document.querySelector(selector)?.focus({ preventScroll: keepScroll });
        if (keepScroll) document.getElementById("screen")?.scrollTo({ top });
        else document.querySelector(selector)?.scrollIntoView({ block: "nearest" });
      }
      function handleAction(command, value, ctx) {
        if (!["training-continue", "training-progress", "course-open", "course-complete", "course-advance", "assessment-open", "assessment-submit", "assessment-review"].includes(command)) return false;
        context = { ...context, ...ctx };
        if (syncFromDisk()) return changed();
        if (!session().signedIn) return changed();
        if (command === "training-progress") { context.go(id() && !owned() ? "HELP-03" : resume().route); return true; }
        if (command === "training-continue") {
          if (!matches("CHN-08")) return changed();
          if (!editable()) { context.go(resume().route); return true; }
          command = allDone() ? "assessment-open" : "course-open"; value = nextCourse()?.id;
        }
        if (command === "course-open") {
          if (!owned() || !matches("CHN-08") || !courses.some(course => course.id === value)) return changed();
          const previous = { trainingVisit: state.trainingVisit, selectedCourseId: state.selectedCourseId };
          state.trainingVisit = { applicationId: id(), sessionKey: session().key, courseId: value, openedAt: new Date().toISOString() }; state.selectedCourseId = value;
          if (!save()) { Object.assign(state, previous); error = "学习位置暂未保存，请重试打开课程。"; context.render(); return true; }
          error = ""; context.track?.("advisor_course_opened", { course_id: value, review: !editable() || completed().includes(value), simulated: true }); context.go("CHN-09"); return true;
        }
        if (command === "course-complete" || command === "course-advance") {
          const visit = state.trainingVisit;
          if (!editable() || !matches("CHN-09") || visit?.applicationId !== id() || visit.courseId !== value || visit.sessionKey !== session().key || document.querySelector("[data-training-course]")?.dataset.trainingCourse !== value || !courses.some(course => course.id === value)) return changed();
          if (command === "course-advance") {
            const previous = { completedCourses: state.completedCourses, trainingVisit: state.trainingVisit, selectedCourseId: state.selectedCourseId };
            const wasComplete = completed().includes(value);
            if (!wasComplete) state.completedCourses = [...(Array.isArray(state.completedCourses) ? state.completedCourses : []), value];
            const next = courses.find(course => !completed().includes(course.id));
            if (next) {
              state.selectedCourseId = next.id;
              state.trainingVisit = { applicationId: id(), sessionKey: session().key, courseId: next.id, openedAt: new Date().toISOString() };
            }
            if (!save()) { Object.assign(state, previous); error = "学习进度暂未保存，请重试。"; context.render(); return true; }
            error = "";
            if (!wasComplete) context.track?.("advisor_course_completed", { course_id: value, simulated: true });
            if (next) {
              context.track?.("advisor_course_opened", { course_id: next.id, review: false, simulated: true });
              context.render();
              document.querySelector("#screen .screen-head h1")?.setAttribute("tabindex", "-1");
              document.querySelector("#screen .screen-head h1")?.focus();
              document.getElementById("screen")?.scrollTo({ top: 0 });
            } else context.go("CHN-10");
            context.flash(wasComplete ? next ? "已打开下一课" : "已进入测评" : "本课已完成，进度已保存在本机"); return true;
          }
          if (completed().includes(value)) { context.go("CHN-08"); return true; }
          const previous = state.completedCourses;
          state.completedCourses = [...(Array.isArray(previous) ? previous : []), value];
          if (!save()) { state.completedCourses = previous; error = "本课进度暂未保存，请重试完成本课。"; context.render(); return true; }
          error = ""; context.track?.("advisor_course_completed", { course_id: value, simulated: true }); context.go("CHN-08"); context.flash("本课已完成，进度已保存在本机"); return true;
        }
        if (!editable() || !allDone()) return changed();
        if (command === "assessment-open") { if (!matches("CHN-08")) return changed(); error = ""; context.go("CHN-10"); return true; }
        if (!matches("CHN-10")) return changed();
        if (command === "assessment-submit") {
          if (answeredCount() !== QUESTIONS.length) { context.flash("请先为每道题选择答案"); return true; }
          const previous = { assessmentPassed: state.assessmentPassed, assessmentFeedback: state.assessmentFeedback };
          state.assessmentPassed = courses.every(course => state.assessmentAnswers?.[course.id] === "no"); state.assessmentFeedback = state.assessmentPassed ? "correct" : "retry";
          if (!save()) { Object.assign(state, previous); error = "测评结果暂未保存，请重试核对答案。"; } else error = "";
          repaintAssessment(error ? '.channel-assessment [role="alert"]' : "#assessment-result"); return true;
        }
        if (!passed()) { context.flash("请先完成测评并核对答案"); return true; }
        if (!navigator.onLine) { error = "网络暂不可用，答案已保留。联网后请重试提交。"; context.render(); return true; }
        const previous = { applicationStatus: state.applicationStatus, channelIdentity: state.channelIdentity, applicationSnapshot: state.applicationSnapshot };
        state.applicationStatus = "reviewing"; state.channelIdentity = "application";
        state.applicationSnapshot = { ...state.applicationSnapshot, reviewSubmittedAt: new Date().toISOString() };
        if (!save()) { Object.assign(state, previous); error = "申请尚未提交审核，请重试。"; context.render(); return true; }
        error = ""; context.go("CHN-11"); return true;
      }
      function handleInput(target, ctx) {
        if (!target.name?.startsWith("channel-assessment")) return false;
        context = { ...context, ...ctx };
        if (syncFromDisk() || !editable() || !allDone() || !matches("CHN-10")) return changed();
        const key = target.name.replace("channel-assessment-", "");
        if (!courses.some(course => course.id === key) || !["yes", "no"].includes(target.value)) return true;
        if (state.assessmentAnswers?.[key] === target.value) return true;
        const previous = { assessmentAnswers: state.assessmentAnswers, assessmentPassed: state.assessmentPassed, assessmentFeedback: state.assessmentFeedback };
        state.assessmentAnswers = { ...state.assessmentAnswers, [key]: target.value }; state.assessmentPassed = false; state.assessmentFeedback = "";
        if (!save()) { Object.assign(state, previous); error = "本次选择暂未保存，请重试。"; } else error = "";
        repaintAssessment(`input[name="channel-assessment-${key}"][value="${target.value}"]`, true); return true;
      }
      // A double click belongs to one completion, even when the next lesson renders
      // beneath the pointer. Keyboard clicks (detail=0) remain available.
      document.addEventListener("click", event => {
        const action = event.target.closest?.("[data-action]")?.dataset.action || "";
        if (event.detail > 1 && (action.startsWith("commercial:course-advance:") || ["commercial:assessment-submit", "commercial:assessment-review"].includes(action))) {
          event.preventDefault(); event.stopImmediatePropagation();
        }
      }, true);
      window.addEventListener("storage", event => {
        if (event.key === window.HALO_CHANNEL_STORE.key && document.getElementById("screen")?.dataset.page?.startsWith("CHN-") && syncFromDisk()) context.render?.();
      });
      return { observe, home, coursePage, assessmentPage, handleAction, handleInput, allDone, synchronize: syncFromDisk };
    }
  };
})();
