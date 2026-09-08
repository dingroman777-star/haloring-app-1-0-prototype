/* RHY-01 keeps calendar estimates distinct from user-confirmed period dates and feelings. */
(() => {
  window.createHaloRhythmHome = function ({ state, go, render, screen, esc, write, today, validDate, hasCycle, openRecord, reload, cycleStore, cyclePage }) {
    const owner = () => String(state.authPhone || state.authForm?.phone || (state.signedIn ? "legacy-session" : ""));
    const permitted = () => state.signedIn && (!state.healthDeletionStatus || state.healthDeletionStatus === "ready") && (!state.accountDeletionStatus || state.accountDeletionStatus === "ready");
    let message = "", problem = "", timer, focusDate = "";
    const maxMonth = () => { const [y,m]=today().split('-').map(Number);return new Date(Date.UTC(y,m+2,1)).toISOString().slice(0,7); };
    const validMonth = value => /^\d{4}-(0[1-9]|1[0-2])$/.test(value || "") && value >= "1900-01" && value <= maxMonth();
    const validViewDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value||'') && validMonth(value.slice(0,7)) && Number(value.slice(8))>=1 && Number(value.slice(8))<=monthDays(value.slice(0,7));
    const monthDays = month => new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)), 0)).getUTCDate();
    function book() {
      if (!state.rhythmHomeView || state.rhythmHomeView.owner !== owner()) {
        const date = validViewDate(state.selectedRhythmDate) ? state.selectedRhythmDate : today();
        state.rhythmHomeView = { owner: owner(), date, month: date.slice(0, 7), top: 0 };
      }
      const value = state.rhythmHomeView;
      if (!validViewDate(value.date)) value.date = today();
      if (!validMonth(value.month)) value.month = value.date.slice(0, 7);
      return value;
    }
    const record = date => {
      const value = state.rhythmRecords?.[date], account = value?.ownerAccount || value?.accountRef || value?.owner;
      return permitted() && !state.rhythmDeleted && value && validDate(date) && value.date === date && value.source === "user-record" && (!account || String(account) === owner()) ? value : null;
    };
    const dateLabel = date => `${Number(date.slice(5, 7))}月${Number(date.slice(8))}日`;
    const monthLabel = month => `${Number(month.slice(0, 4))}年${Number(month.slice(5))}月`;
    function feedback() { return problem ? `<p class="rh-home-error" role="alert">${esc(problem)}${problem.startsWith("浏览位置") ? '<button type="button" data-action="rh-home:save-view">重试保存位置</button>' : ""}</p>` : message ? `<p class="rh-home-message" role="status">${esc(message)}</p>` : ""; }
    function save() {
      const ok = write({ rhythmHomeView: state.rhythmHomeView });
      if (!ok) problem = "浏览位置暂未保存，关闭后可能无法恢复。";
      else if (problem.startsWith("浏览位置")) problem = "";
      const node = screen.querySelector(".rh-home-feedback");
      if (state.current === "RHY-01" && node && node.innerHTML !== feedback()) node.innerHTML = feedback();
      return ok;
    }
    function capture() { if (state.current === "RHY-01" && screen.dataset.page === "RHY-01") book().top = screen.scrollTop; }
    function historyFields(target) { return target === "RHY-01" ? { rhythmHomeContext: { ...book() } } : ["RHY-02", "RHY-03", "RHY-06"].includes(target) ? { rhythmHomeContext: { owner: owner(), date: state.selectedRhythmDate } } : {}; }
    function enter(target, from) {
      if (from === "RHY-01") { capture(); save(); }
      if (["RHY-02", "RHY-06"].includes(target) && from === "RHY-01") state.selectedRhythmDate = book().date;
      if (target === "RHY-01" && ["RHY-02", "RHY-06"].includes(from) && validDate(state.selectedRhythmDate)) {
        book().date = state.selectedRhythmDate; book().month = state.selectedRhythmDate.slice(0, 7); save();
      }
      if (target === "RHY-01" && from === "RHY-03" && validDate(state.selectedRhythmDate)) {
        book().date = state.selectedRhythmDate; book().month = state.selectedRhythmDate.slice(0, 7); save();
      }
    }
    function restore(target, context) {
      if (["RHY-02", "RHY-03", "RHY-06"].includes(target) && context?.owner === owner() && validDate(context.date)) state.selectedRhythmDate = context.date;
      if (target === "RHY-01" && context?.owner === owner() && validViewDate(context.date) && validMonth(context.month)) {
        // The saved view owns the newest scroll when returning to this same date.
        if (book().date !== context.date || book().month !== context.month) state.rhythmHomeView = { ...context };
      }
    }
    function setDate(date, announce = true) {
      if (!validViewDate(date) || !permitted()) return;
      capture(); book().date = date; book().month = date.slice(0, 7); state.selectedRhythmDate = date;
      state.rhythmMonth = book().month;
      const mark=cycleStore?.mark(date)||{};
      if (announce) message = `${dateLabel(date)} · ${mark.ovulation?'预计排卵日':mark.fertile?'预计易孕期':mark.actual?'经期日':mark.predicted?'预测经期':record(date)?'已有感受记录':'已选择'}`;
      save(); render();
    }
    const chevron = '<span aria-hidden="true">›</span>';
    function calendar() {
      const value = book(), days = monthDays(value.month), [year, month] = value.month.split("-").map(Number);
      const cycleView=!!cycleStore?.view().visible;
      const offset = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
      const dates = [...Array(offset)].map(() => '<span aria-hidden="true"></span>');
      for (let day = 1; day <= days; day++) {
        const date = `${value.month}-${String(day).padStart(2, "0")}`, saved = record(date), selected = value.date === date, isToday = date === today();
        const mark=cycleStore?.mark(date)||{};
        dates.push(`<button type="button" class="${selected ? "is-selected " : ""}${isToday ? "is-today " : ""}${saved&&!cycleView ? "has-record " : ""}${mark.actual?'is-period ':mark.predicted?'is-prediction ':''}${mark.ovulation?'is-ovulation ':mark.fertile?'is-fertile ':''}" data-action="rh-home:date:${date}" data-rh-date="${date}" aria-pressed="${selected}" aria-label="${date}${isToday ? "，今天" : ""}${mark.actual?'，经期日，已记录':mark.predicted?'，预测经期，仅为估算':''}${mark.ovulation?'，预计排卵日，仅为估算':mark.fertile?'，预计易孕期，仅为估算':''}${date>today()?'，未来日期，只可查看':!cycleView?(saved?'，已有感受记录':'，暂无感受记录'):''}"><span>${day}</span>${saved&&!cycleView ? '<i aria-hidden="true"></i>' : ""}</button>`);
      }
      const total = Object.keys(state.rhythmRecords || {}).filter(date => date.startsWith(value.month) && record(date)).length;
      return `<section class="rh-home-calendar" aria-label="${cycleView?'周期日历':'感受日历'}"><div class="rh-month-nav"><button type="button" data-action="rh-home:month:-1" aria-label="上个月"${value.month <= "1900-01" ? " disabled" : ""}>‹</button><label><span>${monthLabel(value.month)}</span><input type="month" id="rh-home-month" value="${value.month}" min="1900-01" max="${maxMonth()}" aria-label="选择月份"></label><button type="button" data-action="rh-home:month:1" aria-label="下个月"${value.month >= maxMonth() ? " disabled" : ""}>›</button></div><div class="rh-calendar-grid" role="group" aria-label="${monthLabel(value.month)}日期">${["一", "二", "三", "四", "五", "六", "日"].map(day => `<small aria-hidden="true">${day}</small>`).join("")}${dates.join("")}</div>${cycleView?cyclePage.legend():''}<div class="rh-calendar-legend">${cycleView?'':`<span><i class="rh-dot"></i>已记录 ${total} 天</span>`}<span><i class="rh-outline"></i>今天</span><button type="button" data-action="rh-home:today"${value.date === today() && value.month === today().slice(0, 7) ? " disabled" : ""}>回到今天</button></div></section>`;
    }
    function statusNote() {
      const states = {
        paused: ["周期展示已暂停", "感受仍可记录和回看，记录不会自动恢复周期展示。", "管理周期", "RHY-05"],
        conflict: ["周期日期需要核对", "先保留感受记录，周期日期可以稍后修改。", "核对日期", "RHY-00"],
        insufficient: ["周期日期尚未补全", "不影响记录感受，也不据此推测你处在哪个阶段。", "补充日期", "RHY-00"]
      };
      if (state.rhythmStatus === "error") return '<section class="rh-home-notice"><strong>暂时未能更新记录</strong><p>下方只显示本机已保存的内容。</p><button type="button" data-action="rh-home:reload">重新读取本机记录</button></section>';
      const note = states[state.rhythmStatus];
      return note ? `<section class="rh-home-notice"><strong>${note[0]}</strong><p>${note[1]}</p><button type="button" data-action="rh-home:open:${note[3]}">${note[2]}</button></section>` : "";
    }
    function body() {
      const value=book(),current=record(today()),selected=record(value.date),v=cycleStore?.view(),cycle=!!v?.visible;
      const header=`<header class="rh-home-header"><div><h1>节律</h1><p>${cycle?'看见周期，记下感受':'记录自己的变化'}</p></div><button type="button" data-action="${permitted()?'rh-home:open:RHY-04':'rh-home:privacy'}" aria-label="${permitted()?'节律设置':'数据与隐私'}">${permitted()?'设置':'隐私'}</button></header>`;
      if(!permitted())return `<article class="rhythm-home-page">${header}<section class="rh-home-intro"><h2>节律记录暂不可用</h2><p>到数据与隐私查看当前处理状态。</p><button type="button" class="primary" data-action="rh-home:privacy">查看数据与隐私</button></section></article>`;
      const title=current?String(current.feeling||'今天已有记录'):state.rhythmDeleted?'重新开始记录':'今天感觉怎么样？';
      const feelingDay=cycle&&value.date<=today()?value.date:today(),feelingRecord=record(feelingDay);
      const feelingLabel=feelingDay===today()?(feelingRecord?'查看或修改今天的感受':'记录今天的感受'):(feelingRecord?`查看或修改${dateLabel(feelingDay)}的感受`:`补记${dateLabel(feelingDay)}的感受`);
      const feeling=cycle?`<button type="button" class="rc-feeling" data-action="rh-home:edit:${feelingDay===today()?'today':'selected'}"><i aria-hidden="true">＋</i><span><strong>${esc(feelingLabel)}</strong><small>${feelingRecord?'用户记录 · '+esc(feelingRecord.feeling||'已有补充文字'):'睡眠、心情或身体感受，想记什么都可以'}</small></span><b aria-hidden="true">›</b></button>`:`<section class="rh-home-intro"><div class="rh-home-kicker"><span>今天 · ${dateLabel(today())}</span><span>${current?'用户记录':'感受日历'}</span></div><h2>${esc(title)}</h2><p>${current?'想补充的时候，随时可以修改。':'睡得怎样、心情如何，想记什么都可以。'}</p><button type="button" class="primary" data-action="rh-home:edit:today">${current?'查看或修改今天':'记录今天的感受'}</button></section>`;
      const selectedFeelings=cycle?'':`${selected?`<h3>${esc(selected.feeling||'感受记录')}</h3>${selected.note?`<p class="rh-selected-note">${esc(String(selected.note))}</p>`:'<p>没有补充文字。</p>'}`:value.date>today()?'<p>感受发生后再记，不提前生成记录。</p>':'<p>这一天还没有感受记录。</p>'}${value.date!==today()&&value.date<=today()?`<button type="button" class="secondary" data-action="rh-home:edit:selected">${selected?'查看或修改这一天':'补记这一天的感受'}</button>`:''}${selected?'<button type="button" class="rh-home-halo" data-action="rh-home:open:RHY-06">带着这条记录和 Halo 聊聊 ›</button>':''}`;
      return `<article class="rhythm-home-page">${header}${cycle?cyclePage.hero():''}${cycle?'':feeling}${statusNote()}${v?.paused&&hasCycle()?'<button type="button" class="rh-home-cycle-option" data-action="cycle:history"><span>查看已保存的经期记录</span>›</button>':""}${!cycle&&!['paused','conflict','insufficient','error'].includes(state.rhythmStatus)?'<button type="button" class="rh-home-cycle-option" data-action="rh-home:open:RHY-00"><span>也想看看预计经期？<small>开启经期记录与预测，感受记录仍然保留</small></span>＋</button>':''}${calendar()}<section class="rh-home-selected" aria-label="所选日期记录"><div class="rh-selected-label"><h2>${dateLabel(value.date)}${value.date===today()?' · 今天':''}</h2><span>${cycle?'周期详情':value.date>today()?'日期预览':'用户记录'}</span></div>${cycle?cyclePage.selected(value.date):''}${selectedFeelings}</section>${cycle?feeling:''}<div class="rh-home-feedback" aria-live="polite">${feedback()}${v?.error?`<p class="rh-home-error" role="alert">${esc(v.error)}</p>`:''}</div><div class="rh-home-more"><button type="button" data-action="rh-home:open:RHY-02"><span>${cycle?'周期与感受，怎么看？':'怎样回看这些记录？'}</span>${chevron}</button><button type="button" data-action="rh-home:open:RHY-05"><span>管理记录</span>${chevron}</button></div>${cycle?cyclePage.footer():''}${cycle ? '<p class="rh-home-boundary">经期日来自用户记录。其他周期标记仅为估算，不能确认排卵或用于避孕。</p>' : ''}</article>`;
    }
    function handle(action) {
      if (!action.startsWith("rh-home:")) return false;
      if (state.current !== "RHY-01") return true;
      if (action === "rh-home:privacy") { go("SET-01"); return true; }
      if (!permitted()) return true;
      if (action === "rh-home:save-view") { save(); return true; }
      if (action.startsWith("rh-home:date:")) { setDate(action.slice(13)); screen.querySelector(".rh-home-selected")?.scrollIntoView({ block: "nearest" }); return true; }
      if (action === "rh-home:today") { setDate(today()); return true; }
      if (action.startsWith("rh-home:month:")) {
        const amount = Number(action.slice(14)); if (![1, -1].includes(amount)) return true;
        const [year, month] = book().month.split("-").map(Number), next = new Date(Date.UTC(year, month - 1 + amount, 1)).toISOString().slice(0, 7);
        selectMonth(next); return true;
      }
      if (action.startsWith("rh-home:edit:")) {
        const date = action.endsWith(":today") ? today() : book().date;
        if (!validDate(date) || date > today()) return true;
        setDate(date, false); const result = openRecord(date);
        if (!result.ok) { problem = result.error; render(); } return true;
      }
      if (action.startsWith("rh-home:open:")) {
        const route = action.slice(13); if (!["RHY-00", "RHY-02", "RHY-04", "RHY-05", "RHY-06"].includes(route)) return true;
        if (route === "RHY-06" && !record(book().date)) return true;
        state.selectedRhythmDate = book().date; go(route); return true;
      }
      if (action === "rh-home:reload") { const result = reload(); problem = result.ok ? "" : result.error; message = result.ok ? "已重新读取本机记录。" : ""; render(); return true; }
      return true;
    }
    function selectMonth(month) {
      if (!validMonth(month)) { message = "可查看历史月份和未来三个月。"; render(); return; }
      const day = Math.min(Number(book().date.slice(8)), monthDays(month));
      setDate(`${month}-${String(day).padStart(2, "0")}`);
    }
    function afterRender() {
      if (state.current !== "RHY-01") return;
      screen.scrollTop = Number(book().top) || 0;
      if (focusDate) { screen.querySelector(`[data-rh-date="${focusDate}"]`)?.focus({ preventScroll: true }); focusDate = ""; }
    }
    screen.addEventListener("change", event => { if (event.target.id === "rh-home-month") selectMonth(event.target.value); });
    screen.addEventListener("keydown", event => {
      const date = event.target.dataset.rhDate, step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
      if (!date || !step) return;
      event.preventDefault(); event.stopPropagation(); const next = new Date(Date.parse(date + "T12:00:00Z") + step * 86400000).toISOString().slice(0, 10);
      if (validViewDate(next)) { focusDate = next; setDate(next); }
    });
    screen.addEventListener("scroll", () => { if (state.current !== "RHY-01") return; capture(); clearTimeout(timer); timer = setTimeout(save, 120); });
    window.addEventListener("pagehide", () => { if (state.current === "RHY-01") { capture(); save(); } });
    return { body, handle, enter, restore, historyFields, capture, afterRender };
  };
})();
