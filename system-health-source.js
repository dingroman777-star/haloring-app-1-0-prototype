/* Read-only system-health prototype. All returned records are local examples. */
(() => {
  window.createHaloSystemHealth = function ({ state, write, render, esc, modalRoot, closeModal, screen }) {
    const TYPES = {
      steps: { label: "步数", detail: "查看步数示例快照", value: 5600, unit: "步" },
      sleep: { label: "睡眠", detail: "查看睡眠时长示例", value: 440, unit: "分钟" },
      heart: { label: "心率", detail: "查看心率示例记录", value: 68, unit: "次/分" }
    };
    const PROVIDERS = { apple: "Apple 健康", android: "Health Connect" };
    const own = (object, key) => Object.prototype.hasOwnProperty.call(object || {}, key);
    const copy = value => JSON.parse(JSON.stringify(value));
    const owner = () => String(state.authPhone || "");
    const allowed = () => Boolean(owner() && state.signedIn && state.authVerified && state.accountDeletionStatus !== "submitted");
    const onPage = () => state.current === "PERM-01" && (!screen?.dataset.page || screen.dataset.page === "PERM-01");
    const validTypes = list => [...new Set(Array.isArray(list) ? list.filter(type => own(TYPES, type)) : [])];
    const validProvider = provider => own(PROVIDERS, provider);
    const sourceName = provider => PROVIDERS[provider] || "当前平台";
    const isoNow = () => new Date().toISOString();
    const beijingTime = value => `${new Date(Date.parse(value) + 8 * 3600000).toISOString().slice(0, 19)}+08:00`;
    const dateKey = () => new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const shiftDay = (date, days) => new Date(Date.parse(`${date}T00:00:00+08:00`) + days * 86400000 + 8 * 3600000).toISOString().slice(0, 10);
    const timeLabel = value => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }) : "尚未读取";
    let platform = "apple", platformOwner = "", outcome = "data", intent = null, sequence = 0;
    let timer = null, timerIdentity = "", error = "", failedRequestId = "";

    function validRecord(record) {
      if (!record || record.simulated !== true || !validProvider(record.provider) || !own(TYPES, record.type) || typeof record.sourceRecordId !== "string" || !record.sourceRecordId || typeof record.source !== "string" || typeof record.unit !== "string" || typeof record.value !== "number" || !Number.isFinite(record.value) || record.value < 0) return false;
      if (typeof record.windowStart !== "string" || typeof record.windowEnd !== "string") return false;
      const start = Date.parse(record.windowStart), end = Date.parse(record.windowEnd);
      return Number.isFinite(start) && Number.isFinite(end) && start <= end && end <= Date.now();
    }

    function account(forOwner = owner()) {
      const raw = own(state.systemHealth?.accounts, forOwner) ? state.systemHealth.accounts[forOwner] : null;
      const provider = validProvider(raw?.provider) ? raw.provider : validProvider(platform) ? platform : "apple";
      return {
        version: 1, provider, requested: validTypes(raw?.requested), mockReadChoices: validTypes(raw?.mockReadChoices),
        enabled: raw?.enabled === true, promptedAt: typeof raw?.promptedAt === "string" ? raw.promptedAt : "",
        lastReadAt: typeof raw?.lastReadAt === "string" ? raw.lastReadAt : "",
        records: Array.isArray(raw?.records) ? raw.records.filter(validRecord) : [],
        request: raw?.request && typeof raw.request === "object" ? raw.request : null
      };
    }

    function syncOwner() {
      if (platformOwner === owner()) return;
      platformOwner = owner();
      const saved = own(state.systemHealth?.accounts, platformOwner) ? state.systemHealth.accounts[platformOwner] : null;
      platform = validProvider(saved?.provider) ? saved.provider : "apple";
      error = ""; failedRequestId = "";
      clearTimeout(timer); timer = null; timerIdentity = "";
      if (intent) close();
    }

    function commit(next, expectedOwner = owner()) {
      if (!allowed() || owner() !== expectedOwner) return false;
      const accounts = state.systemHealth?.version === 1 && state.systemHealth.accounts && typeof state.systemHealth.accounts === "object" ? copy(state.systemHealth.accounts) : {};
      const normalized = { ...next }; delete normalized.version;
      Object.defineProperty(accounts, expectedOwner, { value: normalized, enumerable: true, configurable: true, writable: true });
      try {
        if (write({ systemHealth: { version: 1, accounts } }) !== true) throw new Error("storage");
      } catch {
        error = "未能保存到本机，原有设置和记录未改变。请重试。";
        return false;
      }
      error = "";
      return true;
    }

    function isPending(value = account()) {
      const request = value.request;
      return request?.status === "pending" && request.owner === owner() && validProvider(request.provider) && typeof request.id === "string";
    }

    function liveView(view) {
      const modal = modalRoot.querySelector(".system-health-modal");
      return Boolean(allowed() && onPage() && intent && intent.owner === owner() && intent.provider === platform && modal?.dataset.shIntent === intent.id && modal.dataset.shView === intent.view && (!view || intent.view === view));
    }

    function action(name) { return `health-source:${name}:${intent.id}`; }
    function button(label, name, kind = "primary", disabled = false) {
      return `<button type="button" class="${kind} sh-action" data-action="${action(name)}"${disabled ? " disabled" : ""}>${esc(label)}</button>`;
    }
    function note(text, kind = "") { return `<p class="sh-note${kind ? ` ${kind}` : ""}">${esc(text)}</p>`; }
    function message() { return `<p class="sh-error" role="alert">${esc(error)}</p>`; }
    function mark() { return '<span class="sh-provider-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/><path d="M4 12h4l2-4 3 8 2-4h5"/></svg></span>'; }

    function card() {
      syncOwner();
      const value = account(), pending = isPending(value);
      const configured = value.provider === platform && value.promptedAt;
      const status = !allowed() ? "登录验证后可设置" : platform === "unsupported" ? "当前平台不支持" : pending ? failedRequestId === value.request.id ? "读取结果尚未保存" : "正在读取示例" : configured && !value.enabled ? "已停止本 App 读取" : configured && value.request?.status === "failed" ? "本次读取未完成" : configured && value.request?.status === "empty" ? "本次暂无可读数据" : configured && value.enabled ? value.lastReadAt ? "已完成示例读取" : "等待读取" : "尚未开启读取";
      return `<section class="sh-card"><div class="sh-card-heading">${mark()}<div><h3>手机系统健康</h3><span class="sh-badge">${esc(status)}</span></div></div><p>从 ${esc(sourceName(platform))} 读取你选择的项目。</p><p class="sh-note">只读取，不向手机健康写入。</p><p class="sh-note">本地交互原型 · 未连接手机健康数据</p><button type="button" class="secondary sh-action" data-action="health-source:open"${!allowed() ? " disabled" : ""}>${value.promptedAt ? "管理读取" : "设置读取"}</button></section>`;
    }

    function displayRecord(record, stale) {
      const title = TYPES[record.type].label;
      const value = record.type === "sleep" ? `${Math.floor(record.value / 60)}小时${record.value % 60}分` : `${Number(record.value).toLocaleString("zh-CN")} ${record.unit}`;
      return `<article class="sh-record"><h3>${esc(title)}</h3><p class="sh-record-value">${esc(value)}</p><p class="sh-record-meta">${esc(sourceName(record.provider))} · ${esc(beijingTime(record.windowEnd).slice(5, 10))}</p></article>`;
    }

    function overview() {
      const value = account(), pending = isPending(value), currentProvider = value.provider === platform;
      const configured = currentProvider && Boolean(value.promptedAt), supported = validProvider(platform);
      const saveBlocked = pending && failedRequestId === value.request.id;
      const result = currentProvider ? value.request : null;
      const stale = pending || result?.status === "failed" || result?.status === "empty" || result?.status === "cancelled" || !value.enabled;
      const readableTypes = value.requested.filter(type => value.mockReadChoices.includes(type));
      const records = currentProvider ? value.records.filter(record => record.provider === platform && readableTypes.includes(record.type)) : [];
      const latest = value.requested.map(type => records.filter(record => record.type === type).sort((a, b) => Date.parse(b.windowEnd) - Date.parse(a.windowEnd))[0]).filter(Boolean);
      let status = !supported ? "当前平台不支持读取" : !configured ? "先选择想读取的项目" : !value.enabled ? "已停止本 App 读取" : saveBlocked ? "读取结果尚未保存" : pending ? "正在读取示例…" : result?.status === "failed" ? "这次读取未完成" : result?.status === "empty" ? "这次暂无可读数据" : result?.status === "complete" ? `已读取 ${latest.length} 项` : "设置已保存，等待读取";
      let statusDetail = !supported ? "需要支持 Apple 健康或 Health Connect 的手机环境。此处不能启动授权或读取。" : !configured ? "选好项目后，再手动读取一次。" : !value.enabled ? value.records.length ? "已读记录保留，手机系统权限未改变。" : "当前已停止读取；需要时可重新设置。" : saveBlocked ? "本机保存失败，原有记录未改变。可重试保存。" : pending ? "读取最近 7 天的记录，关闭此页不会中断。" : result?.status === "failed" ? "上次记录和读取时间未改变，请重试。" : result?.status === "empty" ? "可能没有记录、未共享或暂不可用，不能据此判断权限被拒绝。" : "";
      const readLabel = pending && failedRequestId === value.request.id ? "重试保存读取结果" : pending ? "读取中…" : result?.status === "failed" ? "重试读取一次" : "读取一次";
      const today = dateKey();
      const body = `<div class="sh-summary">${mark()}<h2>${esc(sourceName(platform))}</h2><span class="sh-badge">只读</span></div>${note("本地模拟，非真实健康数据。")}<section class="sh-status" role="status"><h3>${esc(status)}</h3>${statusDetail ? `<p>${esc(statusDetail)}</p>` : ""}</section><div class="sh-context"><p>${configured && value.requested.length ? esc(value.requested.map(type => TYPES[type].label).join("、")) : "尚未选择项目"} · 最近 7 天</p><p>${shiftDay(today, -6).slice(5)}—${today.slice(5)} · ${currentProvider && value.lastReadAt ? `读取于 ${esc(timeLabel(value.lastReadAt))}` : "尚未读取"}</p></div>${error ? message() : ""}<section class="sh-section"><div class="sh-section-heading"><h3>${stale && latest.length ? "上次记录 · 未更新" : "可查看的记录"}</h3></div>${latest.length ? `<div class="sh-records">${latest.map(record => displayRecord(record, stale)).join("")}</div>` : '<div class="sh-empty"><p>还没有可查看的记录</p><small>没有记录不等于零。</small></div>'}${configured && result?.status === "complete" ? value.requested.filter(type => !latest.some(record => record.type === type)).map(type => note(`${TYPES[type].label}：暂无可读数据。`)).join("") : ""}</section><div class="sh-links">${button("如何调整系统权限", "help", "text-button sh-link")}${configured && value.enabled && supported ? button("停止本 App 读取", "stop", "text-button sh-danger") : ""}${value.records.length ? button("清除此预览的已读记录", "clear", "text-button sh-danger", pending) : ""}</div>`;
      const footer = !supported ? button("知道了", "close") : configured && value.enabled ? `${button(readLabel, pending && failedRequestId === value.request.id ? "retry-result" : "read", "primary", pending && failedRequestId !== value.request.id)}${pending ? button("取消本次读取", "cancel-read", "secondary") : button("管理范围", "settings", "secondary")}` : button(configured ? "重新设置读取" : "选择读取项目", "settings");
      return { title: "手机系统健康", body, footer };
    }

    function choices(kind) {
      const selected = kind === "scope" ? intent.requested : intent.choices;
      const types = kind === "scope" ? Object.keys(TYPES) : intent.requested;
      return `<div class="sh-options" role="group" aria-label="${kind === "scope" ? "希望读取的项目" : "系统共享示例选择"}">${types.map(type => `<button type="button" class="sh-option" role="checkbox" aria-checked="${selected.includes(type)}" data-action="${action(`${kind}:${type}`)}"><span><strong>${TYPES[type].label}</strong><small>${kind === "scope" ? TYPES[type].detail : "允许读取此类示例"}</small></span><span class="sh-check" aria-hidden="true">${selected.includes(type) ? "✓" : ""}</span></button>`).join("")}</div>`;
    }

    function contents() {
      if (intent.view === "overview") return overview();
      if (intent.view === "settings") return {
        title: "选择读取范围",
        body: `<span class="sh-eyebrow">${esc(sourceName(platform))}</span><h2>只选你想查看的项目</h2><p>查看最近 7 天，只读取，不向手机健康写入。</p>${choices("scope")}${message()}`,
        footer: `${button("继续到系统授权", "system", "primary", !intent.requested.length)}${button("取消", "cancel", "secondary")}`
      };
      if (intent.view === "system") return {
        title: "系统授权 · 原型模拟",
        body: `<span class="sh-eyebrow">${esc(sourceName(platform))} · 本地模拟</span><h2>允许 Halo 读取这些项目？</h2><p>只演示共享选择，不会修改手机设置。</p>${choices("grant")}${note("可只允许部分项目，也可全部不选。")}${message()}`,
        footer: `${button("完成模拟授权", "confirm-system")}${button("取消，保留原设置", "cancel", "secondary")}`
      };
      if (intent.view === "help") return {
        title: "调整系统健康权限",
        body: `<h2>到手机系统中管理</h2><p>${platform === "android" ? "在手机的 Health Connect 中找到应用权限，选择 Halo 后调整读取项目。具体入口可能因系统版本而不同。" : "在 iPhone 的健康 App 中打开个人资料，找到应用或数据访问设置，再选择 Halo 调整读取项目。具体入口可能因系统版本而不同。"}</p>${note("这里只提供说明，不会打开或更改手机设置；本原型没有真实系统授权。")}${note("「停止本 App 读取」只停止此预览后续读取，不代表已撤回系统权限。")}${note("只读取，不向手机健康写入。")}`,
        footer: button("返回读取管理", "back")
      };
      return {
        title: "清除本 App 已读记录？",
        body: `<h2>仅清除此预览的副本</h2><p>将清除当前账号在本 App 此预览中保存的手机系统健康示例与读取时间。</p>${note("不会删除手机健康 App 的数据，也不会删除 Halo Ring 记录。")}${note(`不会改变系统授权或你选择的读取范围；${account().enabled ? "之后仍可手动读取一次" : "之后可重新设置读取范围，再读取一次"}。`)}${message()}`,
        footer: `${button("确认清除本地示例", "confirm-clear", "danger-button sh-danger")}${button("取消", "back", "secondary")}`
      };
    }

    function paint(focus = false) {
      if (!intent || intent.owner !== owner() || !allowed() || !onPage()) return;
      const previousTop = modalRoot.querySelector(".sh-body")?.scrollTop || 0;
      const previousFocus = modalRoot.contains(document.activeElement) ? document.activeElement?.dataset.action : "";
      const content = contents();
      modalRoot.innerHTML = `<div class="modal-backdrop system-health-backdrop"><section class="modal system-health-modal" data-sh-view="${intent.view}" data-sh-intent="${intent.id}" role="dialog" aria-modal="true" aria-labelledby="sh-title"><header class="sh-header"><h2 id="sh-title">${esc(content.title)}</h2><button type="button" class="text-button sh-action" data-action="${action("close")}" aria-label="关闭手机系统健康">关闭</button></header><div class="sh-body" tabindex="0" aria-label="读取内容">${content.body}</div><footer class="sh-footer">${content.footer}</footer></section></div>`;
      const body = modalRoot.querySelector(".sh-body"); if (body && !focus) body.scrollTop = previousTop;
      const buttons = [...modalRoot.querySelectorAll("[data-action]")];
      const target = focus ? buttons[0] : buttons.find(item => item.dataset.action === previousFocus);
      target?.focus({ preventScroll: true });
    }

    function show(view) {
      if (!allowed() || !onPage()) return;
      const value = account(), prior = intent;
      intent = {
        id: `sh-${Date.now().toString(36)}-${++sequence}`, owner: owner(), provider: platform, view,
        requested: prior && ["settings", "system"].includes(prior.view) ? [...prior.requested] : value.provider === platform ? [...value.requested] : [],
        choices: prior && ["settings", "system"].includes(prior.view) ? [...prior.choices] : value.provider === platform ? [...value.mockReadChoices] : []
      };
      error = "";
      paint(true);
    }

    function close() {
      if (modalRoot.querySelector(".system-health-modal")) modalRoot.innerHTML = "";
      intent = null; error = "";
    }

    function refresh() {
      if (!onPage()) return;
      render();
      if (liveView()) paint();
    }

    function exampleRecords(request) {
      if (request.outcome !== "data") return [];
      return validTypes(request.types).filter(type => validTypes(request.choices).includes(type)).map(type => {
        const definition = TYPES[type], day = request.referenceDate, end = beijingTime(request.startedAt);
        return {
          source: sourceName(request.provider), provider: request.provider, type,
          sourceRecordId: `demo-${request.provider}-${type}-${day}`,
          windowStart: type === "sleep" ? beijingTime(new Date(Date.parse(request.startedAt) - 440 * 60000).toISOString()) : type === "heart" ? end : `${day}T00:00:00+08:00`,
          windowEnd: end,
          value: definition.value, unit: definition.unit, simulated: true
        };
      });
    }

    function complete(id, expectedOwner, expectedProvider) {
      timer = null; timerIdentity = "";
      if (!allowed() || owner() !== expectedOwner) return;
      const value = account(), request = value.request;
      if (!isPending(value) || request.id !== id || request.owner !== expectedOwner || request.provider !== expectedProvider || value.provider !== expectedProvider || !value.enabled) return;
      if (Date.now() < request.readyAt) { prepare(); return; }
      const failed = request.outcome === "failed", incoming = exampleRecords(request);
      const records = [...value.records];
      incoming.forEach(record => {
        const index = records.findIndex(existing => existing.provider === record.provider && existing.type === record.type && existing.sourceRecordId === record.sourceRecordId);
        if (index < 0) records.push(record); else records[index] = record;
      });
      const next = {
        ...value, records,
        lastReadAt: failed ? value.lastReadAt : new Date(request.readyAt).toISOString(),
        request: { ...request, status: failed ? "failed" : incoming.length ? "complete" : "empty", completedAt: new Date(request.readyAt).toISOString() }
      };
      if (!commit(next, expectedOwner)) failedRequestId = id; else failedRequestId = "";
      refresh();
    }

    function prepare() {
      syncOwner();
      if (intent && (!allowed() || !onPage() || intent.owner !== owner())) close();
      if (!allowed()) { clearTimeout(timer); timer = null; timerIdentity = ""; return; }
      const value = account(), request = value.request;
      if (!isPending(value) || !value.enabled || value.provider !== request.provider || failedRequestId === request.id) {
        clearTimeout(timer); timer = null; timerIdentity = ""; return;
      }
      if (!Number.isFinite(request.readyAt) || !Number.isFinite(Date.parse(request.startedAt)) || !/^\d{4}-\d{2}-\d{2}$/.test(request.referenceDate || "") || !["data", "empty", "failed", "revoked"].includes(request.outcome)) return;
      const identity = `${request.owner}:${request.provider}:${request.id}`;
      if (timerIdentity === identity && timer !== null) return;
      clearTimeout(timer); timerIdentity = identity;
      timer = setTimeout(() => complete(request.id, request.owner, request.provider), Math.max(0, Math.min(2147483647, request.readyAt - Date.now())));
    }

    function startRead() {
      const value = account();
      if (!liveView("overview") || !validProvider(platform) || value.provider !== platform || !value.enabled || !value.promptedAt || !value.requested.length || isPending(value)) return;
      const referenceDate = dateKey(), now = Date.now();
      const request = {
        id: `read-${now.toString(36)}-${++sequence}`, owner: owner(), provider: platform,
        types: [...value.requested], choices: value.mockReadChoices.filter(type => value.requested.includes(type)), outcome,
        referenceDate, windowStart: `${shiftDay(referenceDate, -6)}T00:00:00+08:00`, windowEnd: beijingTime(new Date(now).toISOString()),
        readyAt: now + 1000, status: "pending", startedAt: new Date(now).toISOString()
      };
      if (commit({ ...value, request })) { failedRequestId = ""; prepare(); }
      refresh();
    }

    function reviewControls() {
      syncOwner();
      const pending = isPending();
      return `<section class="sh-review"><h3>手机系统健康 · 审阅模拟</h3><p>仅本地测试，不连接手机健康；下次读取使用所选回执。</p><div class="sh-review-group" role="group" aria-label="模拟健康平台">${[["apple", "Apple 健康"], ["android", "Health Connect"], ["unsupported", "不支持"]].map(([key, label]) => `<button type="button" data-action="health-source:review:platform:${key}" aria-pressed="${platform === key}"${pending ? " disabled" : ""}>${label}</button>`).join("")}</div><div class="sh-review-group" role="group" aria-label="下次读取的模拟回执">${[["data", "有示例"], ["empty", "无数据"], ["failed", "读取失败"], ["revoked", "系统访问变化"]].map(([key, label]) => `<button type="button" data-action="health-source:review:outcome:${key}" aria-pressed="${outcome === key}">${label}</button>`).join("")}</div>${pending ? "<p>读取期间不能切换平台；当前请求回执已经固定。</p>" : ""}</section>`;
    }

    function handle(rawAction) {
      if (typeof rawAction !== "string" || !rawAction.startsWith("health-source:")) return false;
      syncOwner();
      if (rawAction.startsWith("health-source:review:")) {
        const [, , kind, value] = rawAction.split(":");
        if (!onPage()) return true;
        if (kind === "platform" && ["apple", "android", "unsupported"].includes(value) && !isPending()) {
          platform = value; close(); refresh();
        } else if (kind === "outcome" && ["data", "empty", "failed", "revoked"].includes(value)) { outcome = value; refresh(); }
        return true;
      }
      if (!allowed() || !onPage()) return true;
      if (rawAction === "health-source:open") {
        if (!screen?.querySelector('[data-action="health-source:open"]')) return true;
        if (modalRoot.querySelector(".modal") && !modalRoot.querySelector(".system-health-modal")) return true;
        show("overview"); prepare(); return true;
      }
      if (!liveView()) return true;
      const parts = rawAction.split(":"), token = parts.pop();
      if (token !== intent.id) return true;
      const control = [...modalRoot.querySelectorAll("[data-action]")].find(item => item.dataset.action === rawAction);
      if (!control || control.disabled) return true;
      const name = parts.slice(1).join(":"), value = account();
      if (name === "close") { close(); closeModal(); return true; }
      if (name === "settings" && liveView("overview") && validProvider(platform) && !isPending(value)) { show("settings"); return true; }
      if (name.startsWith("scope:") && liveView("settings")) {
        const type = name.slice(6); if (!own(TYPES, type)) return true;
        intent.requested = intent.requested.includes(type) ? intent.requested.filter(item => item !== type) : [...intent.requested, type];
        intent.choices = intent.choices.filter(item => intent.requested.includes(item)); paint(); return true;
      }
      if (name === "system" && liveView("settings") && validProvider(platform) && intent.requested.length) { show("system"); return true; }
      if (name.startsWith("grant:") && liveView("system")) {
        const type = name.slice(6); if (!intent.requested.includes(type)) return true;
        intent.choices = intent.choices.includes(type) ? intent.choices.filter(item => item !== type) : [...intent.choices, type]; paint(); return true;
      }
      if (name === "cancel" && ["settings", "system"].includes(intent.view)) { show("overview"); return true; }
      if (name === "confirm-system" && liveView("system") && validProvider(platform) && intent.requested.length && !isPending(value)) {
        if (commit({ ...value, provider: platform, requested: [...intent.requested], mockReadChoices: intent.choices.filter(type => intent.requested.includes(type)), enabled: true, promptedAt: isoNow(), request: null })) show("overview"); else paint();
        refresh(); return true;
      }
      if (name === "read") { startRead(); return true; }
      if (name === "retry-result" && liveView("overview") && isPending(value) && failedRequestId === value.request.id) {
        failedRequestId = ""; complete(value.request.id, value.request.owner, value.request.provider); return true;
      }
      if ((name === "stop" || name === "cancel-read") && liveView("overview") && (name === "stop" ? value.enabled : isPending(value))) {
        const next = { ...value, enabled: name === "stop" ? false : value.enabled, request: isPending(value) ? { ...value.request, status: "cancelled", cancelledAt: isoNow() } : value.request };
        if (commit(next)) { clearTimeout(timer); timer = null; timerIdentity = ""; failedRequestId = ""; }
        refresh(); return true;
      }
      if (name === "help" && liveView("overview")) { show("help"); return true; }
      if (name === "clear" && liveView("overview") && value.records.length && !isPending(value)) { show("clear"); return true; }
      if (name === "back" && ["help", "clear"].includes(intent.view)) { show("overview"); return true; }
      if (name === "confirm-clear" && liveView("clear") && !isPending(value)) {
        if (commit({ ...value, records: [], lastReadAt: "", request: null })) show("overview"); else paint();
        refresh(); return true;
      }
      return true;
    }

    return { card, handle, prepare, reviewControls, close };
  };
})();
