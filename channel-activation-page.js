/* Local interaction rehearsal. No real agreement signing, bank/tax verification or activation API. */
(() => {
  const VERSION = "agreement-demo-v1";
  window.HALO_CHANNEL_ACTIVATION = {
    create({ state, persist, synchronize, validResult, actions, feedback, dashboardData, serviceOrders, copy, escape: e }) {
      let context = {}, viewScope = "", lastPage = "", error = "", timer = null, stalled = "", draftScope = "", draft = { holder: "", bank: "", number: "" }, readChecked = false;
      const session = () => context.applicationContext?.() || {};
      const id = () => state.applicationSnapshot?.id || "";
      const subject = () => state.applicationSnapshot?.payeeType;
      const scope = () => JSON.stringify([session().accountRef, "account", id(), subject(), state.applicationSnapshot?.reviewDecision, VERSION]);
      const own = () => state.channelActivation?.version === 1 && state.channelActivation.scope === scope() ? state.channelActivation : null;
      const blank = () => ({ version: 1, scope: scope(), applicationId: id(), agreement: null, account: null, tax: null, confirmed: false, request: null });
      const consistent = () => {
        const flow = own(), request = flow?.request, mirror = state.activationRequest;
        if (!flow) return !state.channelActivation;
        if (!request) return !mirror;
        return ["processing", "submitted", "failed", "completed"].includes(request.status) && request.scope === scope() && request.applicationId === id() && Boolean(request.id) && mirror?.id === request.id && mirror.status === request.status && mirror.applicationId === id() && flow.confirmed === true && request.agreement?.version === VERSION && request.account?.simulated === true && request.account.subject === subject() && typeof request.account.bank === "string" && typeof request.account.last4 === "string" && request.tax?.simulated === true && request.tax.subject === subject() && ["agreement", "account", "tax"].every(key => JSON.stringify(request[key]) === JSON.stringify(flow[key]));
      };
      const valid = () => validResult() && ["自然人", "企业或个体工商户"].includes(subject()) && consistent();
      const editable = () => valid() && state.channelIdentity === "approved" && state.activationReady === true && !["processing", "submitted", "completed"].includes(own()?.request?.status) && (!state.activationRequest || own());
      const stamp = () => JSON.stringify([scope(), state.channelIdentity, state.activationReady, own(), state.activationRequest]);
      const panel = () => history.state?.channelActivationScope === scope() ? history.state.channelActivationPanel || "" : "";
      const match = () => session().signedIn && session().page === "CHN-16" && valid() && viewScope === scope() && document.querySelector("[data-activation-scope]")?.dataset.activationScope === stamp();
      const demo = () => ({ holder: subject() === "自然人" ? "演示用户" : "演示企业", bank: "演示银行", number: "0000000000008821" });
      const prepared = () => [own()?.agreement?.version === VERSION, own()?.account?.simulated === true, own()?.tax?.simulated === true];
      const time = value => typeof value === "string" && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false }) : "";
      function save(next, changes = {}) {
        const previous = { channelActivation: state.channelActivation, activationRequest: state.activationRequest, channelIdentity: state.channelIdentity, channelAgreementConfirmed: state.channelAgreementConfirmed, channelMode: state.channelMode };
        state.channelActivation = next; Object.assign(state, changes);
        if (!persist()) { Object.assign(state, previous); error = "这次修改暂未保存，原资料仍保留，请重试。"; return false; }
        error = ""; return true;
      }
      function repaint(focus) {
        if (session().page !== "CHN-16") return;
        context.render?.(); if (focus) document.querySelector(focus)?.focus();
      }
      function open(next) {
        error = ""; readChecked = Boolean(own()?.agreement);
        if (next === "account" && own()?.account?.simulated && !Object.values(draft).some(Boolean)) draft = demo();
        history.pushState({ ...history.state, channelActivationPanel: next, channelActivationScope: scope() }, "", location.href);
        repaint(".activation-panel-heading");
      }
      function close() { error = ""; if (panel()) history.back(); else repaint(); }
      function observe(ctx) {
        context = { ...context, ...ctx };
        if (lastPage !== session().page) { viewScope = ["CHN-16", "CHN-17", "CHN-18", "CHN-19", "CHN-20", "CHN-21", "CHN-22", "CHN-23", "CHN-24", "CHN-25", "CHN-26"].includes(session().page) ? scope() : ""; lastPage = session().page; error = ""; }
        if (draftScope !== scope()) { draftScope = scope(); draft = { holder: "", bank: "", number: "" }; readChecked = false; }
        const request = own()?.request;
        if (request?.status === "processing" && valid() && state.activationReady === true && !timer && stalled !== request.id) timer = setTimeout(() => finish(request.id), Math.max(0, Math.min(700, request.readyAt - Date.now() || 0)));
      }
      function finish(requestId) {
        timer = null; synchronize();
        const flow = own(), request = flow?.request;
        if (!session().signedIn || !valid() || state.activationReady !== true || state.channelIdentity !== "approved" || request?.id !== requestId || request.status !== "processing") { repaint(); return; }
        const status = navigator.onLine ? "submitted" : "failed";
        const next = { ...request, status, error: navigator.onLine ? "" : "offline", ...(navigator.onLine ? { submittedAt: new Date().toISOString() } : {}) };
        if (!save({ ...flow, request: next }, { activationRequest: { ...next, mock: true }, channelIdentity: navigator.onLine ? "activation-pending" : "approved" })) { stalled = requestId; error = "提交结果暂未保存，请重试确认。原资料仍保留。"; }
        repaint();
      }
      function row(number, title, description, action, done) {
        return `<button class="activation-task" data-action="commercial:act-${action}"><span class="activation-task-icon ${done ? "done" : ""}" aria-hidden="true">${done ? "✓" : number}</span><span><strong>${title}</strong><small>${e(description)}</small></span><i aria-hidden="true">›</i></button>`;
      }
      function render() {
        const sub = editable() ? panel() : "", title = ({ agreement: "合作协议", account: "收款资料", tax: "税务资料" })[sub] || "协议与收款";
        const head = `<header class="screen-head commercial-head"><div><button class="back" data-action="${sub ? "commercial:act-back" : "go:CHN-15"}" aria-label="${sub ? "返回协议与收款" : "返回审核结果"}">← 返回</button><span class="page-context">体验顾问</span><h1 class="activation-panel-heading" tabindex="-1">${title}</h1></div></header>`;
        const wrap = body => `${head}<div class="stack commercial-stack"><div class="activation-page" data-activation-scope="${e(stamp())}">${body}</div></div>`;
        const failure = () => error ? `<p class="activation-error" role="alert" tabindex="-1">${e(error)}</p>` : "";
        if (!valid() || viewScope !== scope()) return `${head}<div class="stack commercial-stack">${feedback("开通信息待核对", "请先核对当前申请。原资料仍保留，不会开始新的开通。", "plain")}${actions([["查看申请进度", "go:CHN-11", "primary"], ["联系客服核对", "go:HELP-03", "secondary"]])}</div>`;
        const flow = own(), request = flow?.request;
        if (["active", "paused", "terminated"].includes(state.channelIdentity)) return wrap(`<section class="activation-status"><span aria-hidden="true">${state.channelIdentity === "active" ? "✓" : "—"}</span><h2>${({ active: "顾问身份已生效", paused: "经营已暂停", terminated: "合作已结束" })[state.channelIdentity]}</h2><p>${time(state.activationRequest?.completedAt) ? `生效时间：${e(time(state.activationRequest.completedAt))}（北京时间）` : "请查看当前身份与历史记录。"}</p>${flow?.reviewReceipt?.simulated ? '<small>本地演示回执，不代表真实合作已开通。</small>' : ""}</section>${actions([[state.channelIdentity === "active" ? "查看顾问身份" : "查看历史结算", state.channelIdentity === "active" ? "go:CHN-17" : "go:CHN-22", "primary"]])}`);
        if ((!flow && state.activationRequest) || (state.channelIdentity === "activation-pending" && !request)) return wrap(`${feedback("开通记录待核对", "暂时无法核对本次提交资料，请联系客服确认，无需重复提交。", "plain")}${actions([["联系客服", "commercial:act-help", "primary"]])}`);
        if (state.activationReady !== true) return wrap(`${feedback("开通资料暂未就绪", "资料就绪后可继续，无需重新提交申请。", "plain")}${actions([["联系客服了解进度", "commercial:act-help", "primary"], ["查看本次申请", "commercial:act-details", "secondary"]])}`);
        if (request && ["processing", "submitted"].includes(request.status)) {
          const pending = request.status === "processing";
          return wrap(`<section class="activation-status" role="status" aria-busy="${pending && !stalled}"><span aria-hidden="true">${pending ? "◷" : "✓"}</span><h2>${pending ? stalled ? "提交尚未确认" : "正在提交资料" : "开通资料已提交"}</h2><p>${pending ? "可以先离开，稍后回来查看进度。" : "正在等待协议与收款资料确认，顾问身份尚未生效。"}</p></section><dl class="activation-facts"><div><dt>提交编号</dt><dd>${e(request.id)}</dd></div>${request.submittedAt ? `<div><dt>提交时间</dt><dd>${e(time(request.submittedAt))}<small>北京时间</small></dd></div>` : ""}<div><dt>收款资料</dt><dd>${e(request.account.bank)} · 尾号 ${e(request.account.last4)}<small>示例资料 · 待核验</small></dd></div></dl>${failure()}${request.checkedAt ? '<p class="activation-note" role="status">暂时没有新结果，仍在等待确认。</p>' : ""}${actions([[pending ? stalled ? "重试确认提交" : "正在提交…" : "查看最新进度", pending ? "commercial:act-submit" : "commercial:act-refresh", "primary", pending && !stalled], ["需要帮助", "commercial:act-help", "secondary"]])}<p class="activation-note">本地演示，不会签约、上传资料或开通真实身份。</p>`);
        }
        if (sub === "agreement") return wrap(`<article class="activation-document"><small>协议阅读示例 · ${VERSION}</small><h2>体验顾问合作说明</h2><p>正式协议尚未接入。以下仅用于演示阅读与确认，不用于签约。</p><h3>产品介绍</h3><p>基于真实产品体验提供介绍，不作医疗诊断、功效夸大或收益承诺。</p><h3>客户与订单信息</h3><p>仅在授权服务范围内使用订单、客户及收款信息。</p><h3>签约与身份</h3><p>正式合作需完成适用协议的签署和收款资料核验。阅读示例不代表签约或身份生效。</p></article><label class="activation-check"><input type="checkbox" data-action="commercial:act-read-check" ${readChecked ? "checked" : ""}>我已阅读以上示例说明</label>${failure()}${actions([["确认已阅读（演示）", "commercial:act-read-save", "primary", !readChecked], ["暂不确认", "commercial:act-back", "secondary"]])}`);
        if (sub === "account") return wrap(`<p class="activation-note">请勿填写真实银行卡。仅示例资料可保存和演示提交；其他输入仅在当前页面会话保留，刷新清除。</p><span class="activation-subject">收款身份：${subject() === "自然人" ? "个人" : "企业或个体工商户"}</span>${[ ["holder", subject() === "自然人" ? "收款人姓名" : "账户名称"], ["bank", "开户银行"], ["number", "收款账号"] ].map(([key, label]) => `<label class="activation-field">${label}<input id="activation-${key}" value="${e(draft[key])}" placeholder="${key === "number" ? "请输入示例账号" : `请输入${label}`}" ${key === "number" ? 'inputmode="numeric"' : ""} autocomplete="off" maxlength="${key === "number" ? 34 : 80}"></label>`).join("")}<button class="text-button activation-demo" data-action="commercial:act-account-demo">使用示例资料</button>${failure()}${actions([["保存收款资料", "commercial:act-account-save", "primary"], ["暂不保存", "commercial:act-back", "secondary"]])}`);
        if (sub === "tax") return wrap(`<section class="activation-document"><h2>核对收款主体</h2><p>收款身份：${subject() === "自然人" ? "个人" : "企业或个体工商户"}</p><p>正式税务资料要求尚待确认，请联系客服了解适用于你的材料要求。原型不收集证件或税号。</p></section>${flow?.tax ? '<p class="activation-note">已选用示例资料，尚未经核验。</p>' : ""}${failure()}${actions([["使用示例税务资料", "commercial:act-tax-save", "primary"], ["咨询资料要求", "commercial:act-help", "secondary"]])}<p class="activation-note">示例仅用于体验提交流程，不代表资料已通过审核。</p>`);
        const items = prepared(), count = items.filter(Boolean).length;
        return wrap(`<section class="activation-overview"><div><strong>完成开通资料</strong><span>${count} / 3 项已准备</span></div><p>提交后等待确认，身份生效后开放顾问工具。</p></section><div class="activation-task-list">${row(1, "合作协议", items[0] ? "示例已阅读 · 正式签约未接入" : "阅读并确认示例说明", "agreement", items[0])}${row(2, "收款资料", items[1] ? `${flow.account.bank} · 尾号 ${flow.account.last4} · 待核验` : "填写收款账户", "account", items[1])}${row(3, "税务资料", items[2] ? "示例资料已准备 · 待核验" : "了解并准备所需资料", "tax", items[2])}</div><label class="activation-check"><input type="checkbox" data-action="commercial:act-confirm" ${flow?.confirmed ? "checked" : ""} ${count < 3 ? "disabled" : ""}>我已核对以上示例资料</label>${failure()}${request?.status === "failed" ? '<p class="activation-error" role="alert">提交未完成，资料已保留。请联网后重试。</p>' : ""}<p class="activation-note" role="status">${count < 3 ? `还需完成 ${3 - count} 项资料` : !flow?.confirmed ? "请先勾选确认，再提交。" : "资料已准备，可以提交。"}</p>${actions([[request?.status === "failed" ? "重试提交（演示）" : "提交开通资料（演示）", "commercial:act-submit", "primary", count < 3 || !flow?.confirmed], ["需要帮助", "commercial:act-help", "secondary"]])}<p class="activation-note">本地演示，不会签约或上传资料。</p>`);
      }
      function handleInput(target) {
        const key = target.id?.replace("activation-", "");
        if (!["holder", "bank", "number"].includes(key)) return false;
        if (synchronize() || !match() || !editable()) { repaint(); return true; }
        draft[key] = target.value; return true;
      }
      function handleAction(command, value, ctx) {
        if (!command.startsWith("act-") && !["channel-agreement", "channel-activate", "channel-refresh"].includes(command)) return false;
        context = { ...context, ...ctx };
        if (synchronize() || !match()) { repaint(); context.flash?.("申请信息已变化，请按当前页面继续"); return true; }
        if (command === "act-back") { close(); return true; }
        if (command === "act-help" || command === "act-details") { context.go(command === "act-help" ? "HELP-03" : "CHN-07"); return true; }
        const flow = own() || blank(), request = flow.request;
        if (command === "act-demo-result") {
          if (state.activationReady !== true || !prepared().every(Boolean) || !flow.confirmed || request?.status !== "submitted" || state.channelIdentity !== "activation-pending" || value !== "ready") return true;
          const completedAt = new Date().toISOString();
          save({ ...flow, request: { ...request, status: "completed", completedAt }, reviewReceipt: { id: `AR-${request.id}`, requestId: request.id, applicationId: id(), agreementSigned: true, settlementReady: true, releaseReady: true, completedAt, simulated: true } }, { channelIdentity: "active", channelMode: "new", channelAgreementConfirmed: true, activationRequest: { ...request, status: "completed", completedAt, mock: true } }); repaint(); return true;
        }
        if (command === "act-refresh" || command === "channel-refresh") {
          if (request?.status === "submitted") save({ ...flow, request: { ...request, checkedAt: new Date().toISOString() } });
          repaint(); return true;
        }
        if ((command === "act-submit" || command === "channel-activate") && request?.status === "processing" && stalled === request.id) { stalled = ""; error = ""; repaint(); return true; }
        if (!editable()) { repaint(); return true; }
        if (["act-agreement", "act-account", "act-tax"].includes(command)) { open(command.replace("act-", "")); return true; }
        const update = patch => save({ ...flow, ...patch, confirmed: false, request: null }, { activationRequest: null, channelAgreementConfirmed: false });
        if (command === "act-read-check" && panel() === "agreement") { readChecked = !readChecked; repaint('[data-action="commercial:act-read-check"]'); return true; }
        if (command === "act-read-save" && panel() === "agreement" && readChecked) { if (update({ agreement: { version: VERSION, acknowledgedAt: new Date().toISOString(), simulated: true } })) close(); else repaint(); return true; }
        if (command === "act-account-demo" && panel() === "account") { draft = demo(); error = ""; repaint("#activation-holder"); return true; }
        if (command === "act-account-save" && panel() === "account") {
          if (!draft.holder.trim() || !draft.bank.trim() || !/^\d{8,34}$/.test(draft.number.replace(/\s/g, ""))) error = "请填写账户名称、开户银行和 8–34 位示例账号。此处仅检查示例格式，不代表银行核验。";
          else if (Object.keys(demo()).some(key => draft[key].trim() !== demo()[key])) error = "原型不保存真实收款信息。请使用示例资料体验，当前输入尚未保存。";
          else if (update({ account: { holder: demo().holder, bank: demo().bank, last4: "8821", subject: subject(), simulated: true } })) { close(); return true; }
          repaint(".activation-error"); return true;
        }
        if (command === "act-tax-save" && panel() === "tax") { if (update({ tax: { subject: subject(), simulated: true } })) close(); else repaint(); return true; }
        if ((command === "act-confirm" || command === "channel-agreement") && !panel() && prepared().every(Boolean)) { save({ ...flow, confirmed: !flow.confirmed }); repaint('[data-action="commercial:act-confirm"]'); return true; }
        if ((command === "act-submit" || command === "channel-activate") && !panel()) {
          if (!prepared().every(Boolean) || !flow.confirmed) { error = "请先完成三项资料并勾选确认。"; repaint(); return true; }
          if (!navigator.onLine) { error = "网络暂不可用，资料尚未提交。联网后可重试。"; repaint(); return true; }
          const now = Date.now(), next = { id: request?.status === "failed" ? request.id : `ACT-${now}-${Math.random().toString(36).slice(2, 6)}`, applicationId: id(), scope: scope(), status: "processing", startedAt: request?.startedAt || new Date(now).toISOString(), readyAt: now + 700, agreement: flow.agreement, account: flow.account, tax: flow.tax, simulated: true };
          save({ ...flow, request: next }, { activationRequest: { ...next, mock: true } }); repaint(); return true;
        }
        return true;
      }
      function resultModel() {
        const flow = own(), receipt = flow?.reviewReceipt, request = flow?.request;
        const linked = valid() && viewScope === scope();
        if (linked && ["paused", "terminated"].includes(state.channelIdentity)) return { title: state.channelIdentity === "paused" ? "经营已暂停" : "合作已结束", detail: "历史结算仍可查看。如有待处理事项，可联系客服。", label: "查看历史结算", route: "CHN-22" };
        if (linked && ["approved", "activation-pending"].includes(state.channelIdentity)) return { title: "顾问身份尚未生效", detail: "请先查看协议与收款资料的当前进度。", label: "查看开通进度", route: "CHN-16" };
        const ready = linked && state.channelIdentity === "active" && request?.status === "completed" && typeof receipt?.id === "string" && receipt.id.trim() && receipt.requestId === request.id && receipt.applicationId === id() && receipt.agreementSigned === true && receipt.settlementReady === true && receipt.releaseReady === true && receipt.completedAt === request.completedAt;
        if (ready) return { active: true, title: "你已成为 Halo 体验顾问", detail: "接下来，查看你的推广工具与可分享内容。", label: "开始使用顾问工具", route: "CHN-18", date: time(receipt.completedAt), simulated: Boolean(receipt.simulated || request.simulated || state.activationRequest?.mock) };
        const conflict = ["approved", "activation-pending", "active", "paused", "terminated"].includes(state.channelIdentity);
        return { title: conflict ? "身份信息待核对" : "请先查看申请进度", detail: conflict ? "暂时无法确认这条生效记录，请核对本次申请或联系客服。" : "完成申请并收到生效结果后，即可使用顾问工具。", label: "查看申请进度", route: "CHN-11" };
      }
      const homeStamp = () => JSON.stringify([stamp(), state.channelMode, state.channelAvailableCents, state.withdrawals]);
      function ledgerModel() {
        const data = dashboardData(), rows = Array.isArray(state.withdrawals) ? state.withdrawals : [], ids = rows.map(row => row?.id);
        const recordValid = row => window.HALO_CHANNEL_SETTLEMENT.valid(row) && ids.filter(id => id === row.id).length === 1;
        const recordsValid = Array.isArray(state.withdrawals) && rows.every(recordValid) && !(state.channelMode === "new" && rows.length);
        const processing = recordsValid ? rows.filter(row => row.status === "processing").reduce((sum,row) => sum + row.amountCents,0) : null;
        const healthy = !data.invalid && recordsValid && Number.isSafeInteger(processing);
        const readOnly = state.channelIdentity !== "active";
        return { ...data, rows, recordValid, healthy, readOnly, processing, canWithdraw: canReadOrders() && !readOnly && healthy && data.availableCents >= 10000 };
      }
      function renderLedger() {
        const head = '<header class="screen-head commercial-head"><div><button class="back" data-action="previous" aria-label="返回上一页">← 返回</button><span class="page-context">体验顾问</span><h1>收益明细</h1></div></header>';
        const wrap = body => `${head}<div class="stack commercial-stack"><div class="channel-ledger" data-ledger-scope="${e(homeStamp())}">${body}</div></div>`;
        if (!canReadOrders()) { const view = resultModel(); return wrap(`${feedback(view.title,view.detail,"plain")}${actions([[view.label,"commercial:chn-ledger-status","primary"],["联系客服","commercial:chn-ledger-help","secondary"]])}`); }
        const model = ledgerModel(), money = cents => Number.isSafeInteger(cents) && cents >= 0 ? `¥${(cents/100).toFixed(2)}` : "—";
        const reason = model.readOnly ? "当前仅可查看历史结算，不能提交新的提现。" : !model.healthy ? "部分记录暂时无法核对，核对完成后再提现。" : model.availableCents === 0 ? "暂无可提现余额。待确认收益不能用于提现。" : model.availableCents < 10000 ? "当前示例单笔最低提现 ¥100.00。" : "提交后会预占可用余额，到账以处理结果为准。";
        const records = model.rows.length ? model.rows.map(row => {
          const validRow = model.recordValid(row), date = time(row?.submittedAt), recordId = typeof row?.id === "string" ? row.id : "编号待核对";
          const status = validRow ? window.HALO_CHANNEL_SETTLEMENT.label(row.status) : "待核对";
          const note = !validRow ? "暂时无法确认记录状态，请联系客服核对。" : row.status === "paid" ? "本地到账回执演示，不代表真实转账。" : row.status === "processing" ? row.queryDelayed ? "处理时间较长，先查询这笔申请，不要重复提交。" : "尚未取得到账结果，可查询进度。" : `${row.receipt.reason}。${money(row.returnedCents)} 已退回可用余额，可核对收款资料后重新申请。`;
          return `<details class="ledger-record"><summary><span><strong>${money(row?.amountCents)}</strong><small>${e(recordId)}</small></span><span>${e(status)}</span></summary><dl><div><dt>申请金额</dt><dd>${money(row?.amountCents)}</dd></div><div><dt>申请时间</dt><dd>${date ? e(date) + '<small>北京时间</small>' : "暂未提供"}</dd></div><div><dt>处理结果</dt><dd>${e(status)}</dd></div>${row.receipt?.postedAt ? `<div><dt>处理时间</dt><dd>${e(time(row.receipt.postedAt))}</dd></div>` : ""}</dl><p>${e(note)}</p>${row.status === "processing" && validRow ? `<button class="secondary" data-action="commercial:chn-ledger-query:${e(recordId)}">查询本笔进度</button>` : ""}<button class="text-button ledger-record-copy" data-action="commercial:chn-ledger-copy:${e(recordId)}" ${validRow ? "" : "disabled"}>复制申请编号</button><button class="text-button" data-action="commercial:chn-ledger-support:${e(recordId)}">咨询本笔记录</button></details>`;
        }).join("") : '<p class="ledger-empty">暂无提现记录</p>';
        return wrap(`${model.readOnly ? `<p class="service-notice">${state.channelIdentity === "paused" ? "经营已暂停" : "合作已结束"} · 历史记录仍保留</p>` : ""}<section class="earnings-overview ledger-overview"><div class="primary-earning ledger-available"><small>${model.readOnly ? "账户可用余额" : "可提现余额"}</small><strong>${money(model.availableCents)}</strong><span>本地示例 · 非真实资金</span></div><div class="ledger-buckets"><button data-action="commercial:chn-ledger-orders"><span>待确认</span><strong>${money(model.pendingCents)}</strong><small>查看关联订单 ›</small></button><button data-action="commercial:chn-ledger-records"><span>提现处理中</span><strong>${money(model.processing)}</strong><small>查看申请记录 ↓</small></button></div></section><p class="ledger-reason" role="status">${reason}</p>${model.readOnly ? "" : actions([["对账并提现","commercial:chn-ledger-withdraw","primary",!model.canWithdraw]])}<details class="ledger-explanation"><summary>这些金额有什么区别？</summary><p>待确认是订单预计收益，尚不能提现。提现处理中是已提交申请、尚未确认到账的金额，不要与可用余额重复相加。</p><p>当前未接入完整结算流水，待结算和历史已支付金额暂不展示。</p></details><section class="ledger-records" tabindex="-1" aria-label="提现记录"><h2>提现记录</h2>${records}</section>${actions([["查看服务订单","commercial:chn-ledger-orders","secondary"],["联系客服核对","commercial:chn-ledger-help","secondary"]])}`);
      }
      function handleLedgerAction(command, value, ctx) {
        if (!command.startsWith("chn-ledger-")) return false;
        context = { ...context, ...ctx };
        const matches = () => session().signedIn && session().page === "CHN-22" && document.querySelector("[data-ledger-scope]")?.dataset.ledgerScope === homeStamp();
        if (synchronize() || !matches()) { if (session().page === "CHN-22") context.render?.(); context.flash?.("收益或身份已更新，请按当前页面继续"); return true; }
        if (command === "chn-ledger-help") { context.go("HELP-03"); return true; }
        if (command === "chn-ledger-status") { context.go(resultModel().route); return true; }
        if (!canReadOrders()) return true;
        if (command === "chn-ledger-demo") {
          const row = ledgerModel().rows.find(item => item?.status === "processing" && ledgerModel().recordValid(item));
          if (!row || !["paid", "failed", "rejected", "delayed"].includes(value)) return true;
          try {
            if (value === "delayed") { const saved = window.haloChannelStorage.read(); window.haloChannelStorage.commit({ ...saved, withdrawals: saved.withdrawals.map(item => item.id === row.id ? { ...item, queryDelayed: true } : item) }); }
            else window.HALO_CHANNEL_SETTLEMENT.apply({ id: `DEMO-${row.id}-${value}`, withdrawalId: row.id, amountCents: row.amountCents, status: value, postedAt: new Date().toISOString(), reason: value === "failed" ? "本次转账未完成（演示）" : value === "rejected" ? "收款资料需核对（演示）" : "", simulated: true });
            synchronize(); context.render(); context.flash("已切换本地回执示例，未发生真实转账");
          } catch { context.flash("未更新这笔示例，请刷新后核对原记录"); }
          return true;
        }
        if (command === "chn-ledger-query") { context.flash("已重新读取本机记录，尚未取得新的处理回执"); return true; }
        if (command === "chn-ledger-support") {
          if (!ledgerModel().rows.some(row => row?.id === value)) return true;
          state.channelSupportWithdrawalId = value;
          if (persist()) context.go("HELP-03"); else context.flash("暂时无法关联记录，请重试");
          return true;
        }
        if (command === "chn-ledger-orders") { context.go("CHN-20"); return true; }
        if (command === "chn-ledger-withdraw") { if (ledgerModel().canWithdraw) context.go("CHN-23"); return true; }
        if (command === "chn-ledger-records") { const target = document.querySelector('.ledger-records'); target?.focus({preventScroll:true}); target?.scrollIntoView({block:"start",behavior:"auto"}); return true; }
        if (command === "chn-ledger-copy") { const model = ledgerModel(), row = model.rows.find(row => row?.id === value); if (!model.recordValid(row)) return true; const original = homeStamp(); copy(row.id,"申请编号已复制",{...context,flash: message => { if (!synchronize() && matches() && homeStamp() === original) context.flash?.(message); }}); }
        return true;
      }
      const earningOrder = () => canReadOrders() ? serviceOrders()?.find(row => row.id === state.selectedEarningId) : null;
      const earningStamp = () => JSON.stringify([homeStamp(), state.selectedEarningId]);
      function renderEarning() {
        const head = '<header class="screen-head commercial-head"><div><button class="back" data-action="previous" aria-label="返回服务订单">← 返回</button><span class="page-context">体验顾问</span><h1>单笔收益</h1></div></header>';
        const wrap = body => `${head}<div class="stack commercial-stack"><div class="channel-earning-detail" data-earning-scope="${e(earningStamp())}">${body}</div></div>`;
        if (!canReadOrders()) { const view = resultModel(); return wrap(`${feedback(view.title,view.detail,"plain")}${actions([[view.label,"commercial:earning-status","primary"],["联系客服","commercial:earning-help","secondary"]])}`); }
        const order = earningOrder();
        if (!order) return wrap(`${feedback("未找到这笔收益","请返回服务订单重新选择，已有记录仍保留。","plain")}${actions([["查看服务订单","commercial:earning-list","primary"],["联系客服","commercial:earning-help","secondary"]])}`);
        const rate = order.amount > 0 ? (order.earning / order.amount * 100).toFixed(2).replace(/\.00$/, "") : "—";
        return wrap(`${state.channelIdentity !== "active" ? '<p class="service-notice">当前仅查看历史收益，不能新增推广或提现。</p>' : ""}<section class="earning-feature earning-result"><small>本笔预计收益</small><strong>¥${order.earning.toFixed(2)}</strong><span class="service-tag">待确认</span><p>这笔收益还不能用于提现。</p></section><section class="earning-order-info"><h2>${e(order.title)}</h2><span>关联订单</span><strong>${e(order.id)}</strong>${order.status === "客户已激活" ? '<p>客户进度：已激活设备</p>' : ""}</section><details class="earning-calculation"><summary>这笔收益怎么算？</summary><dl><div><dt>参与计算的金额</dt><dd>¥${order.amount.toFixed(2)}</dd></div><div><dt>本笔示例比例</dt><dd>${rate}%</dd></div></dl><p>¥${order.amount.toFixed(2)} × ${rate}% = ¥${order.earning.toFixed(2)}</p><small>当前是示例计算，不代表你的正式协议或到账金额。</small></details><p class="earning-note">确认后可在收益明细中查看后续结算进度。</p>${actions([["查看收益明细","commercial:earning-ledger","primary"]])}<details class="earning-question"><summary>对这笔收益有疑问？</summary><p>可复制本笔摘要，联系客服核对。打开客服不代表已提交复核申请。</p>${actions([["复制本笔摘要","commercial:earning-copy","secondary"],["联系客服核对","commercial:earning-help","secondary"]])}</details><p class="earning-note">本地示例，不产生真实收益或工单。</p>`);
      }
      function handleEarningAction(command, ctx) {
        if (!["earning-status","earning-list","earning-ledger","earning-copy","earning-help","earning-appeal"].includes(command)) return false;
        context = { ...context, ...ctx };
        const matches = () => session().signedIn && session().page === "CHN-21" && document.querySelector("[data-earning-scope]")?.dataset.earningScope === earningStamp();
        if (synchronize() || !matches()) { if (session().page === "CHN-21") context.render?.(); context.flash?.("订单或身份信息已变化，请按当前页面继续"); return true; }
        if (command === "earning-list") { context.go("CHN-20"); return true; }
        if (command === "earning-status") { context.go(resultModel().route); return true; }
        if (["earning-help","earning-appeal"].includes(command)) { context.go("HELP-03"); return true; }
        const order = earningOrder(); if (!order) return true;
        if (command === "earning-ledger") { context.go("CHN-22"); return true; }
        if (command === "earning-copy") {
          const original = earningStamp();
          copy(`本地示例收益核对\n订单：${order.id}\n商品：${order.title}\n预计收益：¥${order.earning.toFixed(2)}\n状态：待确认\n尚未提交复核申请`, "本笔摘要已复制，请在客服对话中粘贴", { ...context, flash: message => { if (!synchronize() && matches() && original === earningStamp()) context.flash?.(message); } });
        }
        return true;
      }
      const canReadOrders = () => resultModel().active || (valid() && viewScope === scope() && ["paused", "terminated"].includes(state.channelIdentity));
      function renderOrders() {
        const head = '<header class="screen-head commercial-head"><div><button class="back" data-action="previous" aria-label="返回上一页">← 返回</button><span class="page-context">体验顾问</span><h1>服务订单</h1></div></header>';
        const wrap = body => `${head}<div class="stack commercial-stack"><div class="channel-service-orders" data-service-scope="${e(homeStamp())}">${body}</div></div>`;
        if (!canReadOrders()) { const view = resultModel(); return wrap(`${feedback(view.title,view.detail,"plain")}${actions([[view.label,"commercial:service-status","primary"],["联系客服","commercial:service-help","secondary"]])}`); }
        const orders = serviceOrders(), readOnly = state.channelIdentity !== "active";
        if (!orders) return wrap(`${feedback("订单信息待核对","暂时无法读取当前服务订单，请核对经营状态或联系客服。","plain")}${actions([["返回经营首页","commercial:service-home","primary"],["联系客服","commercial:service-help","secondary"]])}`);
        const notice = readOnly ? '<p class="service-notice">当前仅可查看历史订单与收益，不能新增推广或提现。</p>' : "";
        if (!orders.length) return wrap(`${notice}<section class="service-empty"><span aria-hidden="true">▤</span><h2>暂无服务订单</h2><p>${readOnly ? "当前示例没有历史服务订单。" : "服务订单产生后，可在这里查看对应进度与收益。"}</p></section>${actions([["返回经营首页","commercial:service-home","primary"],["查看收益明细","commercial:service-earnings","secondary"]])}<button class="text-button service-help" data-action="commercial:service-help">有疑问？联系客服</button>`);
        const total = orders.reduce((sum, order) => sum + Math.round(order.earning * 100), 0);
        return wrap(`${notice}<section class="service-summary"><div><span>服务订单</span><strong>${orders.length} 笔</strong></div><div><span>待确认收益</span><strong>¥${(total/100).toFixed(2)}</strong></div></section><p class="service-caption">本地示例 · 预计收益尚不可提现</p><section class="service-order-list order-list" aria-label="服务订单列表">${orders.map(order => `<button class="service-order" data-action="commercial:service-open:${e(order.id)}"><span class="service-order-top"><span>订单 ${e(order.id)}</span><i aria-hidden="true">›</i></span><strong class="service-product">${e(order.title)}</strong>${order.status === "客户已激活" ? '<span class="service-progress">客户进度：已激活设备</span>' : ""}<span class="service-order-bottom"><span><small>预计收益</small><strong>¥${order.earning.toFixed(2)}</strong></span><span class="service-tag">收益待确认</span></span><span class="service-open-label">查看本笔收益</span></button>`).join("")}</section>${error ? `<p class="service-notice" role="alert">${e(error)}</p>` : ""}${actions([["查看收益明细","commercial:service-earnings","secondary"]])}<button class="text-button service-help" data-action="commercial:service-help">订单有疑问？联系客服</button>`);
      }
      function handleOrderAction(command, value, ctx) {
        if (!command.startsWith("service-") && command !== "earning-open") return false;
        context = { ...context, ...ctx };
        if (synchronize() || !session().signedIn || session().page !== "CHN-20" || document.querySelector("[data-service-scope]")?.dataset.serviceScope !== homeStamp()) { if (session().page === "CHN-20") context.render?.(); context.flash?.("订单或身份信息已变化，请按当前页面继续"); return true; }
        if (command === "service-help") { context.go("HELP-03"); return true; }
        if (command === "service-status") { context.go(resultModel().route); return true; }
        if (command === "service-home") { context.go("CHN-19"); return true; }
        if (!canReadOrders()) return true;
        if (command === "service-earnings") { context.go("CHN-22"); return true; }
        if (["service-open","earning-open"].includes(command)) {
          const order = serviceOrders()?.find(row => row.id === value);
          if (!order) { error = "这笔订单暂时无法核对，请从当前列表重新选择。"; context.render?.(); return true; }
          const previous = state.selectedEarningId; state.selectedEarningId = order.id;
          if (!persist()) { state.selectedEarningId = previous; error = "暂时无法打开这笔收益，原订单记录仍保留，请重试。"; context.render?.(); return true; }
          error = ""; context.go("CHN-21");
        }
        return true;
      }
      function renderHome() {
        const view = resultModel(), readOnly = valid() && viewScope === scope() && ["paused", "terminated"].includes(state.channelIdentity);
        const head = '<header class="screen-head commercial-head"><div><button class="back" data-action="previous" aria-label="返回上一页">← 返回</button><span class="page-context">体验顾问</span><h1>经营首页</h1></div></header>';
        const wrap = body => `${head}<div class="stack commercial-stack"><div class="channel-home-page" data-home-scope="${e(homeStamp())}">${body}</div></div>`;
        if (!view.active && !readOnly) return wrap(`${feedback(view.title, view.detail, "plain")}${actions([[view.label,"commercial:chn-home-status","primary"],["联系客服","commercial:chn-home-help","secondary"]])}`);
        const data = dashboardData(), money = cents => Number.isSafeInteger(cents) && cents >= 0 ? `¥${(cents / 100).toFixed(2)}` : "—";
        const metric = (label, value, target, primary = false) => `<button class="home-metric ${primary ? "home-metric-main" : ""}" data-action="commercial:chn-home-${target}"><span>${label}<i aria-hidden="true">›</i></span><strong>${e(value)}</strong>${primary ? '<small>查看收益明细</small>' : ""}</button>`;
        const entry = (icon, title, detail, target) => `<button class="home-entry" data-action="commercial:chn-home-${target}"><span class="home-entry-icon" aria-hidden="true">${icon}</span><span><strong>${title}</strong><small>${detail}</small></span><i aria-hidden="true">›</i></button>`;
        const financial = `<section class="home-metrics" aria-label="经营概览">${metric(readOnly ? "账户可用余额" : "可提现余额",money(data.availableCents),"earnings",true)}${metric("服务订单",data.count === null ? "—" : `${data.count} 笔`,"orders")}${metric("待确认收益",money(data.pendingCents),"earnings")}</section>`;
        const notice = readOnly ? `<section class="home-notice" role="status"><h2>${e(view.title)}</h2><p>历史订单与结算仍可查看，暂不能新增推广或提现。</p></section>` : data.count === 0 ? '<section class="home-notice"><h2>还没有服务订单</h2><p>先了解推广工具与可分享内容，订单产生后可在这里查看。</p></section>' : '<p class="home-explainer">待确认收益还不能用于提现，可在收益明细中查看进度。</p>';
        const dataError = data.invalid ? '<p class="home-notice" role="status">部分经营数据暂时无法核对，请查看明细或联系客服；缺失数据不计为零。</p>' : "";
        return wrap(`${readOnly ? notice : ""}${financial}<p class="home-data-note">本地示例数据 · 非真实账本</p>${!readOnly ? notice : ""}${dataError}<section class="home-entries" aria-label="经营功能">${entry("▤",readOnly ? "历史服务订单" : "服务订单","查看订单与收益状态","orders")}${entry("≋",readOnly ? "历史结算" : "收益与结算",readOnly ? "查看既有记录与处理进度" : "明细、对账与提现记录","earnings")}${!readOnly ? entry("↗","推广工具","二维码、链接与身份","tools") + entry("▧","内容与政策","查看可分享内容与当前政策","content") : ""}</section>${!readOnly && data.count === 0 ? '<button class="text-button home-help" data-action="commercial:chn-home-start">第一次使用？查看入门引导</button>' : ""}<button class="text-button home-help" data-action="commercial:chn-home-help">有疑问？联系客服</button>`);
      }
      function handleHomeAction(command, ctx) {
        if (!command.startsWith("chn-home-")) return false;
        context = { ...context, ...ctx };
        if (synchronize() || !session().signedIn || session().page !== "CHN-19" || document.querySelector("[data-home-scope]")?.dataset.homeScope !== homeStamp()) { if (session().page === "CHN-19") context.render?.(); context.flash?.("经营信息已更新，请按当前页面继续"); return true; }
        const view = resultModel(), readOnly = valid() && viewScope === scope() && ["paused", "terminated"].includes(state.channelIdentity);
        const routes = { "chn-home-orders":"CHN-20", "chn-home-earnings":"CHN-22", "chn-home-tools":"CHN-26", "chn-home-content":"CHN-24", "chn-home-start":"CHN-18" };
        const route = command === "chn-home-help" ? "HELP-03" : command === "chn-home-status" ? view.route : view.active || (readOnly && ["chn-home-orders","chn-home-earnings"].includes(command)) ? routes[command] : "";
        if (route) context.go(route);
        return true;
      }
      function renderStart() {
        const view = resultModel();
        const head = '<header class="screen-head commercial-head"><div><button class="back" data-action="commercial:starter-back" aria-label="返回顾问身份">← 返回</button><span class="page-context">体验顾问</span><h1>开始使用</h1></div></header>';
        const card = (symbol, title, detail, key) => `<button class="activation-task" data-action="commercial:starter-${key}"><span class="activation-task-icon" aria-hidden="true">${symbol}</span><span><strong>${title}</strong><small>${detail}</small></span><i aria-hidden="true">›</i></button>`;
        const body = view.active ? `<section class="approval-result"><span aria-hidden="true">↗</span><h2>从这里开始</h2><p>先了解你的推广工具，再选择适合分享的内容。</p></section><section class="activation-task-list" aria-label="顾问工具入口">${card("1", "查看推广工具", "查看二维码、专属链接与顾问身份", "tools")}${card("2", "了解可分享内容", "查看产品素材与当前政策", "content")}${card("↗", "查看服务订单", "跟进订单与收益状态", "orders")}</section><p class="activation-note">以后可从「我的 → 经营中心」再次进入。</p>${actions([["进入经营首页", "commercial:starter-home", "primary"]])}${view.simulated ? '<p class="activation-note">当前为演示身份，工具和订单不代表真实业务。</p>' : ""}` : `<section class="approval-result is-neutral" role="status"><span aria-hidden="true">—</span><h2>${e(view.title)}</h2><p>${e(view.detail)}</p></section>${actions([[view.label, "commercial:starter-status", "primary"]])}`;
        return `${head}<div class="stack commercial-stack"><div class="activation-page channel-starter" data-starter-scope="${e(stamp())}">${body}<button class="text-button activation-demo" data-action="commercial:starter-help">需要帮助？联系客服</button></div></div>`;
      }
      function handleStartAction(command, ctx) {
        if (!command.startsWith("starter-")) return false;
        context = { ...context, ...ctx };
        if (synchronize() || !session().signedIn || session().page !== "CHN-18" || document.querySelector("[data-starter-scope]")?.dataset.starterScope !== stamp()) { if (session().page === "CHN-18") context.render?.(); context.flash?.("身份信息已变化，请按当前页面继续"); return true; }
        const view = resultModel(), routes = { "starter-tools": "CHN-26", "starter-content": "CHN-24", "starter-orders": "CHN-20", "starter-home": "CHN-19" };
        const route = command === "starter-help" ? "HELP-03" : command === "starter-back" ? "CHN-17" : command === "starter-status" ? view.route : view.active ? routes[command] : "";
        if (route) context.go(route);
        return true;
      }
      function renderResult() {
        const view = resultModel();
        const facts = view.active ? `<dl class="activation-facts"><div><dt>当前身份</dt><dd>Halo 体验顾问</dd></div><div><dt>关联申请</dt><dd>${e(id())}</dd></div>${view.date ? `<div><dt>生效时间</dt><dd>${e(view.date)}<small>北京时间</small></dd></div>` : ""}</dl>` : "";
        const steps = view.active ? '<ol class="approval-steps" aria-label="开通已完成"><li class="done"><span aria-hidden="true">✓</span>审核通过</li><li class="done"><span aria-hidden="true">✓</span>协议与收款</li><li class="done" aria-current="step"><span aria-hidden="true">✓</span>身份生效</li></ol>' : "";
        return `<header class="screen-head commercial-head"><div><button class="back" data-action="commercial:activated-back" aria-label="返回开通进度">← 返回</button><span class="page-context">体验顾问</span><h1>顾问身份</h1></div></header><div class="stack commercial-stack"><div class="activation-page activated-result" data-activated-scope="${e(stamp())}"><section class="approval-result ${view.active ? "" : "is-neutral"}" role="status"><span aria-hidden="true">${view.active ? "✓" : "—"}</span><h2>${e(view.title)}</h2><p>${e(view.detail)}</p></section>${steps}${facts}${actions([[view.label, "commercial:activated-continue", "primary"], ["查看本次申请", "commercial:activated-details", "secondary"]])}<button class="text-button activation-demo" data-action="commercial:activated-help">有疑问？联系客服</button>${view.simulated ? '<p class="activation-note">当前为演示身份，不代表真实合作已开通。</p>' : ""}</div></div>`;
      }
      function handleResultAction(command, ctx) {
        if (!command.startsWith("activated-")) return false;
        context = { ...context, ...ctx };
        if (synchronize() || !session().signedIn || session().page !== "CHN-17" || document.querySelector("[data-activated-scope]")?.dataset.activatedScope !== stamp()) { if (session().page === "CHN-17") context.render?.(); context.flash?.("身份信息已变化，请按当前页面继续"); return true; }
        const route = command === "activated-back" && history.state?.trail?.at(-2) === "CHN-26" ? "CHN-26" : command === "activated-continue" ? resultModel().route : command === "activated-details" ? "CHN-07" : command === "activated-help" ? "HELP-03" : command === "activated-back" ? valid() ? "CHN-16" : "CHN-11" : "";
        if (route) context.go(route);
        return true;
      }
      function reviewControls() { return `<section class="review-controls"><p>ACTIVATION REVIEW</p><h3>开通回执演示</h3><small>只用示例协议、账户与税务资料。不签约、不上传、不实际开通；刷新不会自动通过。</small>${own()?.request?.status === "submitted" && state.channelIdentity === "activation-pending" ? '<button class="secondary" data-action="commercial:act-demo-result:ready">模拟收到身份生效回执</button>' : '<small>先在手机内完成三项资料并提交，之后可演示生效回执。</small>'}</section>`; }
      window.addEventListener("popstate", () => { if (location.hash === "#CHN-16" && session().page === "CHN-16") repaint(); });
      document.addEventListener("click", event => { if (event.detail > 1 && ["commercial:act-submit", "commercial:act-read-save", "commercial:act-account-save", "commercial:act-tax-save"].includes(event.target.closest?.("[data-action]")?.dataset.action)) { event.preventDefault(); event.stopImmediatePropagation(); } }, true);
      function payoutContext() {
        const ledger = ledgerModel();
        const revision = JSON.stringify([scope(), state.channelIdentity, own()?.account, own()?.reviewReceipt, state.channelMode, state.channelAvailableCents, ledger.rows.map(row => row && [row.id, row.amountCents, row.status])]);
        return { ...ledger, ...resultModel(), scope: scope(), stamp: revision, account: own()?.account || null };
      }
      const contentContext = () => ({ ...resultModel(), scope: scope(), stamp: stamp() });
      return { observe, render, handleAction, handleInput, reviewControls, renderResult, handleResultAction, renderStart, handleStartAction, renderHome, handleHomeAction, renderOrders, handleOrderAction, renderEarning, handleEarningAction, renderLedger, handleLedgerAction, payoutContext, contentContext };
    }
  };
})();
