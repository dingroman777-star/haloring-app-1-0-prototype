/* Local withdrawal rehearsal. No payment, SMS or official tax quote is sent. */
(() => {
  const KEY = "haloV5CommercialProgress";
  const money = cents => Number.isSafeInteger(cents) && cents >= 0 ? `¥${(cents / 100).toFixed(2)}` : "—";
  window.HALO_CHANNEL_PAYOUT = {
    create({ state, synchronize, model, escape: e, actions, feedback }) {
      let context = {}, error = "", busy = false, confirmed = false, code = "", lastScope = "", lastPage = "", volatile = null, visit = 0;
      const session = () => context.applicationContext?.() || {};
      const onPage = () => session().signedIn && session().page === "CHN-23";
      const empty = () => ({ version: 1, scope: model().scope, amount: "", quote: null, resultId: "" });
      const draft = () => volatile?.scope === model().scope ? volatile : state.channelWithdrawal?.version === 1 && state.channelWithdrawal.scope === model().scope ? state.channelWithdrawal : empty();
      const stamp = () => JSON.stringify([model().stamp, state.channelWithdrawal || null]);
      const amount = () => {
        const text = draft().amount;
        if (typeof text !== "string" || !/^\d{1,12}(\.\d{1,2})?$/.test(text)) return null;
        const cents = Math.round(Number(text) * 100);
        return Number.isSafeInteger(cents) ? cents : null;
      };
      const quoted = () => {
        const q = draft().quote, v = model();
        return q?.mock === true && typeof q.id === "string" && q.scope === v.scope && q.stamp === v.stamp && q.amountCents === amount() && q.taxCents === 0 && q.feeCents === 0 && q.netCents === amount() && JSON.stringify(q.account) === JSON.stringify(v.account);
      };
      const validAmount = () => model().canWithdraw && amount() !== null && amount() >= 10000 && amount() <= model().availableCents;
      const canSubmit = () => !busy && !volatile && validAmount() && quoted() && confirmed && code === "123456" && !draft().resultId;
      function read() {
        const saved = window.haloChannelStorage.read();
        if (!saved || typeof saved !== "object" || Array.isArray(saved)) throw new Error("missing storage");
        return saved;
      }
      function refresh() { read(); synchronize(); }
      function save(next, changes = {}) {
        try {
          const saved = read();
          // Synchronous compare and merge; never overwrite unrelated saved business fields.
          for (const key of ["channelIdentity", "channelMode", "channelAvailableCents", "withdrawals", "channelActivation", "applicationSnapshot", "activationRequest", "channelWithdrawal"]) {
            if (JSON.stringify(saved[key] ?? null) !== JSON.stringify(state[key] ?? null)) throw new Error("changed storage");
          }
          const patch = { channelWithdrawal: next, ...changes };
          window.haloChannelStorage.commit({ ...saved, ...patch });
          Object.assign(state, saved, patch); volatile = null; error = ""; return true;
        } catch { error = "这次操作暂未保存，金额仍保留。请重试，未保存成功不会扣减余额。"; return false; }
      }
      function observe(ctx) {
        context = { ...context, ...ctx };
        if (session().page !== lastPage || model().scope !== lastScope) { confirmed = false; code = ""; error = ""; volatile = null; visit++; }
        lastPage = session().page; lastScope = model().scope;
        if (onPage()) {
          try { refresh(); } catch { error = "暂时读不到本地记录，请重试或返回收益页。"; }
        }
      }
      function reason() {
        const v = model();
        if (!v.active) return v.detail;
        if (!v.healthy) return "部分收益记录需要核对，暂不能提现。";
        if (!v.canWithdraw) return v.availableCents === 0 ? "暂无可提现余额。待确认收益还不能提现。" : "当前示例单笔最低 ¥100.00，余额暂未达到。";
        if (!draft().amount) return "当前示例单笔最低 ¥100.00。";
        if (amount() === null) return "请输入金额，最多保留两位小数。";
        if (amount() < 10000) return "当前示例单笔最低 ¥100.00。";
        if (amount() > v.availableCents) return "金额超过当前可提现余额，请修改。";
        return "核对后再提交，填写金额不会扣款。";
      }
      function render() {
        const v = model(), d = draft();
        const head = '<header class="screen-head commercial-head"><div><button class="back" data-action="previous" aria-label="返回上一页">← 返回</button><span class="page-context">体验顾问</span><h1>提现</h1></div></header>';
        const wrap = body => `${head}<div class="stack commercial-stack"><div class="channel-payout" data-payout-stamp="${e(stamp())}" aria-busy="${busy}">${body}</div></div>`;
        if (!v.active) return wrap(`${feedback(v.title, v.detail, "plain")}${actions([[v.label, "commercial:payout-status", "primary"], ["联系客服", "commercial:payout-help", "secondary"]])}`);
        const record = d.resultId && v.rows.find(row => row?.id === d.resultId);
        if (d.resultId) {
          const valid = record && v.recordValid(record) && record.quote?.scope === v.scope && record.quote.id === d.quote?.id && record.amountCents === d.quote.amountCents;
          const label = valid ? window.HALO_CHANNEL_SETTLEMENT.label(record.status) : "这笔申请需要核对";
          const note = !valid ? "暂时无法匹配完整记录，请到收益明细核对。" : record.status === "processing" ? "尚未确认到账，请勿重复提交本次申请。" : record.status === "paid" ? "已收到本地到账示例回执，不代表真实转账。" : `${record.receipt.reason}；${money(record.returnedCents)} 已退回可用余额。`;
          return wrap(`<section class="payout-result" role="status"><span aria-hidden="true">${valid ? "✓" : "—"}</span><h2>${e(label)}</h2><strong>${valid ? money(record.amountCents) : "—"}</strong><p>${e(note)}</p></section>${valid ? `<dl class="payout-facts"><div><dt>申请编号</dt><dd>${e(record.id)}</dd></div><div><dt>${record.returnedCents ? "已退回余额" : record.status === "paid" ? "已处理金额" : "余额已预占"}</dt><dd>${money(record.amountCents)}</dd></div><div><dt>当前可提现</dt><dd>${money(v.availableCents)}</dd></div></dl>` : ""}${actions([["查看收益与处理记录", "go:CHN-22", "primary"], ["再提一笔", "commercial:withdraw-new", "secondary", !v.canWithdraw]])}<p role="alert" class="payout-hint">${e(error)}</p><p class="payout-demo">本地模拟申请，不产生真实款项。</p>`);
        }
        const q = quoted() ? d.quote : null;
        const account = v.account;
        const accountText = account ? `${e(account.bank)} · 尾号 ${e(account.last4)}` : "收款资料待核对";
        const quote = q ? `<section class="payout-quote" id="withdrawal-quote"><div class="payout-section-title"><h2>核对本次提现</h2><button class="text-button" data-action="commercial:payout-edit">修改金额</button></div><dl class="payout-facts"><div><dt>收款账户</dt><dd>${accountText}<br>${e(account?.holder || "")}</dd></div><div><dt>申请金额</dt><dd>${money(q.amountCents)}</dd></div><div><dt>税费 / 手续费</dt><dd>${money(q.taxCents)} / ${money(q.feeCents)}</dd></div><div class="payout-net"><dt>预计到账金额</dt><dd>${money(q.netCents)}</dd></div></dl><p class="payout-demo">以上为零费用演示，不是正式报价；到账时间尚未确认。</p><label class="payout-consent"><input id="withdrawal-confirm" type="checkbox" data-action="commercial:withdraw-confirm" ${confirmed ? "checked" : ""}><span>我已核对金额和收款账户</span></label><label class="field-label" for="withdrawal-verification">二次验证</label><input id="withdrawal-verification" class="field" inputmode="numeric" autocomplete="off" maxlength="6" placeholder="输入六位演示码" aria-describedby="payout-code-hint" value="${e(code)}"><p id="payout-code-hint" class="payout-demo">本地演示码 123456，不发送短信。</p>${actions([["提交模拟提现", "commercial:withdraw", "primary", !canSubmit()]])}<p id="payout-submit-hint" class="payout-hint" aria-live="polite">${submitHint()}</p></section>` : `${actions([["下一步：核对提现", "commercial:withdraw-quote", "primary", busy || !validAmount()]])}`;
        return wrap(`<ol class="payout-steps" aria-label="提现步骤"><li class="${q ? "done" : "current"}">1 填写金额</li><li class="${q ? "current" : ""}">2 核对并提交</li></ol><section class="payout-account"><div><small>可提现余额</small><strong>${money(v.availableCents)}</strong></div><p><span>收款账户</span><b>${accountText}</b><small>${e(account?.holder || "")}</small></p></section><section class="payout-amount"><label for="channel-withdrawal">提现金额</label><div><span aria-hidden="true">¥</span><input id="channel-withdrawal" inputmode="decimal" autocomplete="off" maxlength="15" placeholder="0.00" aria-describedby="withdrawal-error" value="${e(d.amount)}" ${q || busy || !v.canWithdraw ? "readonly" : ""}><button class="text-button" data-action="commercial:payout-all" ${busy || q || !v.canWithdraw ? "disabled" : ""}>全部</button></div><p id="withdrawal-error" class="payout-hint" aria-live="polite">${reason()}</p></section><div id="payout-error" role="alert">${e(error)}</div>${quote}<button class="text-button payout-help" data-action="commercial:payout-help">收款信息有误？联系客服</button><p class="payout-demo">仅演示流程，不转账、不验证真实账户。</p>`);
      }
      function submitHint() { return busy ? "正在保存申请，请稍候…" : !confirmed ? "请先核对并勾选确认。" : code !== "123456" ? "请输入六位演示码 123456。" : "提交后会预占可用余额，不代表已经到账。"; }
      function sync() {
        const root = document.querySelector(".channel-payout"); if (!root) return;
        root.dataset.payoutStamp = stamp(); root.setAttribute("aria-busy", String(busy));
        const next = root.querySelector('[data-action="commercial:withdraw-quote"]'); if (next) { next.disabled = busy || !validAmount(); next.setAttribute("aria-disabled", String(next.disabled)); }
        const submit = root.querySelector('[data-action="commercial:withdraw"]'); if (submit) { submit.disabled = !canSubmit(); submit.setAttribute("aria-disabled", String(submit.disabled)); submit.textContent = busy ? "正在保存申请…" : "提交模拟提现"; }
        const hint = document.getElementById("withdrawal-error"); if (hint) hint.textContent = reason();
        const submitHintNode = document.getElementById("payout-submit-hint"); if (submitHintNode) submitHintNode.textContent = submitHint();
        const errorNode = document.getElementById("payout-error"); if (errorNode) errorNode.textContent = error;
      }
      function guard() {
        if (!onPage()) return false;
        const visible = document.querySelector(".channel-payout")?.dataset.payoutStamp;
        try { refresh(); } catch { error = "暂时读不到本地记录，请重试。"; context.render(); return false; }
        if (visible !== stamp()) { confirmed = false; code = ""; volatile = null; context.render(); context.flash("余额或收款信息已更新，请重新核对。"); return false; }
        return true;
      }
      function handleInput(target) {
        if (!["channel-withdrawal", "withdrawal-verification"].includes(target.id)) return false;
        if (!guard() || busy) return true;
        if (target.id === "withdrawal-verification") { code = target.value.trim(); sync(); return true; }
        if (quoted() || !model().canWithdraw) return true;
        const next = { ...draft(), amount: target.value.trim(), quote: null, resultId: "" };
        confirmed = false; code = "";
        if (!save(next)) volatile = next;
        sync(); return true;
      }
      async function submit() {
        if (!canSubmit()) { sync(); return; }
        const expected = stamp(), q = structuredClone(draft().quote), beforeScope = session().key, beforeVisit = visit;
        busy = true; sync();
        try {
          if (!navigator.locks?.request) throw new Error("lock unavailable");
          await navigator.locks.request("halo-channel-payout", async () => {
            refresh();
            if (!onPage() || session().key !== beforeScope || visit !== beforeVisit) return;
            if (expected !== stamp() || !validAmount() || !quoted()) { error = "余额或申请记录已变化，请重新核对后再提交。"; confirmed = false; code = ""; return; }
            if (!navigator.onLine) { error = "当前已离线，申请尚未提交。联网后可重试。"; return; }
            const v = model(), recordId = `WD-${q.id}`;
            if (v.rows.some(row => row?.id === recordId)) { error = "已有这笔申请，请到收益明细查看。"; return; }
            const record = { id: recordId, amountCents: q.amountCents, quote: q, status: "processing", submittedAt: new Date().toISOString() };
            if (save({ ...draft(), resultId: recordId }, { channelAvailableCents: v.availableCents - q.amountCents, withdrawals: [record, ...v.rows] })) { confirmed = false; code = ""; }
          });
        } catch { error = "申请尚未保存，请重试或到收益明细核对。"; }
        finally { busy = false; if (onPage()) context.render(); }
      }
      function handleAction(command, value, ctx) {
        if (!command.startsWith("payout-") && !["withdraw-quote", "withdraw-confirm", "withdraw", "withdraw-new"].includes(command)) return false;
        context = { ...context, ...ctx };
        if (!guard() || busy) return true;
        if (command === "payout-help") { context.go("HELP-03"); return true; }
        if (command === "payout-status") { context.go(model().route); return true; }
        if (!model().active) return true;
        if (command === "withdraw-confirm") { confirmed = Boolean(document.getElementById("withdrawal-confirm")?.checked); sync(); return true; }
        if (command === "withdraw") { void submit(); return true; }
        if (command === "payout-edit") { if (save({ ...draft(), quote: null })) { confirmed = false; code = ""; } context.render(); document.getElementById("channel-withdrawal")?.focus(); return true; }
        if (command === "withdraw-new") { if (save(empty())) { confirmed = false; code = ""; } context.render(); return true; }
        if (!model().canWithdraw) { context.render(); return true; }
        if (command === "payout-all") { const next = { ...empty(), amount: (model().availableCents / 100).toFixed(2) }; if (!save(next)) volatile = next; context.render(); return true; }
        if (command === "withdraw-quote") {
          if (!validAmount()) { sync(); return true; }
          const v = model(), next = { ...draft(), resultId: "", quote: { id: crypto.randomUUID(), scope: v.scope, stamp: v.stamp, account: structuredClone(v.account), amountCents: amount(), taxCents: 0, feeCents: 0, netCents: amount(), mock: true } };
          if (save(next)) { confirmed = false; code = ""; }
          context.render(); document.getElementById("withdrawal-quote")?.scrollIntoView({ block: "start", behavior: "auto" }); return true;
        }
        return true;
      }
      return { observe, render, handleInput, handleAction };
    }
  };
})();
