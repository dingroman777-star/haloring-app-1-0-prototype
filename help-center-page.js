/* HELP-01: searchable help with a device-independent support path. */
(() => {
  window.createHaloHelpCenter = function ({ state, go, persist, esc, screen, showInfoModal }) {
    const categories = [["all", "全部"], ["device", "设备与数据"], ["usage", "夜间与使用"]];
    const faqs = [
      { id: "status", category: "device", title: "超级符号为什么会变化", answer: "符号会随戒指的连接、同步和电量状态变化。看到提示时，可以先查看当前状态；暂时断开不会删除已保存的记录。", aliases: "图标 灯 颜色 断连 低电量 电池 battery status ring", label: "查看符号与状态", action: "status-detail" },
      { id: "data", category: "device", title: "数据为什么还不能解释", answer: "刚开始佩戴、记录不够或同步未完成时，可能暂时没有完整解释。先查看数据来源与质量，了解目前缺少什么，再按提示继续佩戴或同步。", aliases: "HRV 心率 血氧 睡眠 数据不足 没数据 不出报告 同步 data sync report", label: "查看数据来源与质量", action: "info:data-quality" },
      { id: "connection", category: "device", title: "戒指无法连接", answer: "把戒指放在手机附近，确认有电，并开启蓝牙及相关权限。到“我的设备”查看连接状态；还没添加戒指时，也可以从那里开始。", aliases: "蓝牙 连不上 连接不上 配对 绑定 掉线 Bluetooth BLE connect pairing", label: "查看我的设备", route: "DEV-10" },
      { id: "firmware", category: "device", title: "固件更新没有完成", answer: "更新时请让戒指靠近手机并保持电量充足。先在“我的设备”选择这枚戒指，再查看设备信息中的更新状态，按页面提示继续或重试。", aliases: "升级 更新失败 卡住 版本 firmware update ota", label: "查看设备与更新", route: "DEV-10" },
      { id: "night", category: "usage", title: "夜间播放与唤醒", answer: "夜间播放、渐弱和唤醒是不同设置。播放或提醒不符合预期时，先查看夜间帮助中的当前设置，并确认手机音量和系统权限。", aliases: "闹钟 没声音 音乐 音频 白噪音 后台 锁屏 睡觉 App alarm audio sleep", label: "查看夜间帮助", route: "NIG-11" },
      { id: "boundary", category: "usage", title: "健康解释边界", answer: "Halo 的状态与建议用于理解日常记录，不是诊断，也不能替代医生。身体不适或需要医疗判断时，请寻求专业帮助。", aliases: "AI 医疗 准确 诊断 医生 建议 隐私 协议 health medical", label: "查看关于与协议", route: "LEGAL-02" }
    ];
    let composing = false;
    const owner = () => String(state.authPhone || state.authForm?.phone || "local-demo");
    function view() {
      if (!state.helpCenter || typeof state.helpCenter !== "object" || Array.isArray(state.helpCenter)) state.helpCenter = { accounts: {} };
      if (!state.helpCenter.accounts || typeof state.helpCenter.accounts !== "object") state.helpCenter.accounts = {};
      const key = owner();
      if (!state.helpCenter.accounts[key]) state.helpCenter.accounts[key] = { query: Object.keys(state.helpCenter.accounts).length ? "" : String(state.helpQuery || ""), category: "all", expanded: [], top: 0, destination: "" };
      const data = state.helpCenter.accounts[key];
      if (typeof data.query !== "string") data.query = "";
      if (!categories.some(([id]) => id === data.category)) data.category = "all";
      if (!Array.isArray(data.expanded)) data.expanded = [];
      if (!Number.isFinite(data.top)) data.top = 0;
      state.helpQuery = data.query;
      return data;
    }
    const normalize = text => String(text).normalize("NFKC").toLocaleLowerCase().trim();
    function matches() {
      const data = view();
      const terms = normalize(data.query).split(/\s+/).filter(Boolean);
      return faqs.filter(faq => (data.category === "all" || faq.category === data.category) && terms.every(term => normalize(`${faq.title} ${faq.answer} ${faq.aliases}`).includes(term)));
    }
    const button = (label, action, className = "secondary") => `<button type="button" class="${className}" data-action="${esc(action)}">${esc(label)}</button>`;
    function results() {
      const data = view(), found = matches();
      return `<p class="hc-results-count" role="status">${data.query.trim() ? `找到 ${found.length} 个相关问题` : `${found.length} 个常见问题`}</p>${found.length ? `<div class="hc-list">${found.map(faq => {
        const expanded = data.expanded.includes(faq.id);
        return `<article class="hc-faq"><button type="button" class="hc-question" id="help-question-${faq.id}" aria-expanded="${expanded}" aria-controls="help-answer-${faq.id}" data-action="help-center:faq:${faq.id}"><span>${esc(faq.title)}</span><i aria-hidden="true">${expanded ? "−" : "+"}</i></button><div class="hc-answer" id="help-answer-${faq.id}" role="region" aria-labelledby="help-question-${faq.id}" ${expanded ? "" : "hidden"}><p>${esc(faq.answer)}</p>${button(faq.label, faq.route ? `help-center:go:${faq.route}` : faq.action, "hc-answer-link")}</div></article>`;
      }).join("")}</div>` : `<div class="hc-empty"><h2>没有找到相关问题</h2><p>试试“连接”“更新”或“夜间”，也可以直接联系客服。</p><div class="hc-empty-actions">${button("清空搜索，查看全部", "help-center:reset")}${button("联系客服", "help-center:go:HELP-03")}</div></div>`}`;
    }
    function page() {
      const data = view();
      return `<div class="hc-page"><header class="hc-header"><button type="button" data-action="help-center:back" aria-label="返回我的">‹</button><h1>使用帮助</h1><span aria-hidden="true"></span></header><div class="hc-search"><label for="help-search">搜索常见问题</label><div class="hc-search-field"><input id="help-search" type="text" inputmode="search" enterkeyhint="search" autocomplete="off" placeholder="如：连接、更新、夜间" value="${esc(data.query)}"><button type="button" class="hc-clear" aria-label="清空搜索" data-action="help-center:clear" ${data.query ? "" : "hidden"}>清空</button></div></div><div class="hc-categories" role="group" aria-label="问题分类">${categories.map(([id, label]) => `<button type="button" class="hc-category" aria-pressed="${data.category === id}" data-action="help-center:category:${id}">${label}</button>`).join("")}</div><section class="hc-results" id="help-results" aria-label="常见问题">${results()}</section><section class="hc-support" aria-labelledby="help-support-title"><h2 id="help-support-title">还需要帮助？</h2><button type="button" class="hc-support-link" data-action="help-center:go:HELP-02"><span><strong>问题反馈与记录</strong><small>描述问题，或查看已记录的反馈</small></span><i aria-hidden="true">›</i></button><button type="button" class="hc-support-link" data-action="help-center:go:HELP-03"><span><strong>人工客服</strong><small>查看企业微信联系指引</small></span><i aria-hidden="true">›</i></button></section></div>`;
    }
    function updateResults() {
      if (state.current !== "HELP-01") return;
      const data = view();
      const resultsNode = screen.querySelector("#help-results");
      if (resultsNode) resultsNode.innerHTML = results();
      const clear = screen.querySelector(".hc-clear");
      if (clear) clear.hidden = !data.query;
      screen.querySelectorAll(".hc-category").forEach(node => node.setAttribute("aria-pressed", String(node.dataset.action === `help-center:category:${data.category}`)));
    }
    function capture() {
      if (screen.dataset.page !== "HELP-01") return;
      view().top = screen.scrollTop;
    }
    function afterRender() {
      if (state.current !== "HELP-01") return;
      screen.scrollTop = view().top;
    }
    function input(event) {
      if (event.target.id !== "help-search" || state.current !== "HELP-01") return false;
      const data = view(); data.query = event.target.value; state.helpQuery = data.query;
      persist();
      if (!composing && !event.isComposing) updateResults();
      return true;
    }
    screen.addEventListener("compositionstart", event => { if (event.target.id === "help-search") composing = true; });
    screen.addEventListener("compositionend", event => { if (event.target.id === "help-search") { composing = false; input(event); } });
    screen.addEventListener("scroll", () => { if (state.current === "HELP-01") { capture(); persist(); } }, { passive: true });
    function enter(target, source) {
      const data = view();
      if (!data.destination) return;
      if (target === "HELP-01") { data.destination = ""; return; }
      const insideDevice = data.destination === "DEV-10" && /^(DEV|PERM)-/.test(target);
      if (target !== data.destination && !insideDevice) data.destination = "";
    }
    function back() {
      const data = view();
      if (!data.destination || state.current !== data.destination) return false;
      data.destination = "";
      const stack = state.tabStacks?.[state.activeTab];
      if (stack?.at(-1) === state.current) stack.pop();
      persist();
      if (history.state?.trail?.at(-2) === "HELP-01") history.back();
      else go("HELP-01", false);
      return true;
    }
    function handle(action) {
      if (state.current === "HELP-01" && action === "status-detail" && state.membershipHardwareState !== "active") {
        showInfoModal("认识 Halo Ring 状态", "当前没有已激活的戒指。连接戒指后，符号会提示连接、同步、电量或需要处理的状态。暂时断开不会删除已保存的记录。", "知道了");
        return true;
      }
      if (typeof action !== "string" || !action.startsWith("help-center:")) return false;
      if (state.current !== "HELP-01") return true;
      const data = view();
      if (action === "help-center:back") { capture(); data.destination = ""; persist(); go("MY-01", false); return true; }
      if (action.startsWith("help-center:go:")) {
        const target = action.slice("help-center:go:".length);
        if (!["DEV-10", "NIG-11", "LEGAL-02", "HELP-02", "HELP-03"].includes(target)) return true;
        capture(); data.destination = target; persist(); go(target); return true;
      }
      if (action.startsWith("help-center:faq:")) {
        const id = action.slice("help-center:faq:".length);
        if (!faqs.some(faq => faq.id === id)) return true;
        data.expanded = data.expanded.includes(id) ? data.expanded.filter(key => key !== id) : [...data.expanded, id];
        const question = screen.querySelector(`#help-question-${id}`), answer = screen.querySelector(`#help-answer-${id}`);
        if (question && answer) { const expanded = data.expanded.includes(id); question.setAttribute("aria-expanded", String(expanded)); question.querySelector("i").textContent = expanded ? "−" : "+"; answer.hidden = !expanded; }
      } else if (action.startsWith("help-center:category:")) {
        const category = action.slice("help-center:category:".length);
        if (categories.some(([id]) => id === category)) data.category = category;
        updateResults();
      } else if (["help-center:clear", "help-center:reset"].includes(action)) {
        data.query = ""; state.helpQuery = "";
        if (action === "help-center:reset") data.category = "all";
        const field = screen.querySelector("#help-search");
        if (field) { field.value = ""; field.focus({ preventScroll: true }); }
        updateResults();
      }
      capture(); persist(); return true;
    }
    return { page, handle, input, capture, afterRender, enter, back };
  };
})();
