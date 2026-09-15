/* Local withdrawal rehearsal. No payment, SMS or official tax quote is sent. */
(() => {
  const money = cents => Number.isSafeInteger(cents) && cents >= 0 ? `¥${(cents / 100).toFixed(2)}` : "—";
  window.HALO_CHANNEL_PAYOUT = {
    create({ state, synchronize, model, escape: e, actions, feedback }) {
      let context = {}, error = "", busy = false, confirmed = false, code = "", lastScope = "", lastPage = "", volatile = null, visit = 0;
      let bankDraft = { bank:"", number:"" }, bankReview = null, bankConfirmed = false;
      const clearBankDraft = () => { bankDraft={bank:"",number:""}; bankReview=null; bankConfirmed=false; };
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
          for (const key of ["channelIdentity", "channelMode", "channelAvailableCents", "withdrawals", "channelActivation", "applicationSnapshot", "activationRequest", "channelWithdrawal", "channelPayoutAccount"]) {
            if (JSON.stringify(saved[key] ?? null) !== JSON.stringify(state[key] ?? null)) throw new Error("changed storage");
          }
          const patch = { channelWithdrawal: next, ...changes };
          window.haloChannelStorage.commit({ ...saved, ...patch });
          Object.assign(state, saved, patch); volatile = null; error = ""; return true;
        } catch { error = "这次操作暂未保存，金额仍保留。请重试，未保存成功不会扣减余额。"; return false; }
      }
      function observe(ctx) {
        context = { ...context, ...ctx };
        if (session().page !== lastPage || model().scope !== lastScope) { confirmed = false; code = ""; error = ""; volatile = null; clearBankDraft(); visit++; }
        lastPage = session().page; lastScope = model().scope;
        if (onPage()) {
          try { refresh(); } catch { error = "暂时读不到本地记录，请重试或返回代理中心。"; }
        }
      }
      function reason() {
        const v = model();
        if (!v.active) return v.detail;
        if (v.accountState !== 'saved') return v.accountState === 'missing' ? '请先填写并保存收款信息，再申请提现。' : '收款资料需联系客服核对，暂不能提现。';
        if (!v.healthy) return "部分收益记录需要核对，暂不能提现。";
        if (!v.canWithdraw) return v.availableCents === 0 ? "暂无可提现余额。待确认收益还不能提现。" : "当前示例单笔最低 ¥100.00，余额暂未达到。";
        if (!draft().amount) return "当前示例单笔最低 ¥100.00。";
        if (amount() === null) return "请输入金额，最多保留两位小数。";
        if (amount() < 10000) return "当前示例单笔最低 ¥100.00。";
        if (amount() > v.availableCents) return "金额超过当前可提现余额，请修改。";
        return "核对后再提交，填写金额不会扣款。";
      }
      function accountPanel(v) {
        const owner = `<dl class="payout-facts"><div><dt>收款主体</dt><dd>${e(v.account?.holder || '待核对')}</dd></div><div><dt>主体类型</dt><dd>${e(v.account?.subject || '待核对')}</dd></div></dl>`;
        const head = '<div class="payout-section-title"><h2>收款信息</h2></div>';
        const help = '<button class="text-button payout-help" data-action="commercial:payout-help">修改收款信息？联系客服</button>';
        if (v.accountState === 'saved') return `<section class="payout-bank">${head}<p class="payout-saved" role="status">已保存 · 不可自行修改</p>${owner}<dl class="payout-facts"><div><dt>开户银行</dt><dd>${e(v.account.bank)}</dd></div><div><dt>收款账号</dt><dd>•••• ${e(v.account.last4)}</dd></div></dl><p class="payout-hint">收款账户须属于上方申请主体。后续修改请联系客服。</p>${help}</section>`;
        if (v.accountState !== 'missing') return `<section class="payout-bank">${head}${owner}${feedback(v.accountState==='mismatch'?'申请主体已变更':'收款信息待核对',v.accountState==='mismatch'?'原收款记录已保留，不能用于当前主体。请联系客服核对并更新后再提现。':'暂时无法确认收款资料，请联系客服核对。原记录不会被覆盖。','plain')}${help}</section>`;
        const fields = bankReview ? `<h3>请核对，保存后不能自行修改</h3><dl class="payout-facts"><div><dt>开户银行</dt><dd>${e(bankReview.bank)}</dd></div><div><dt>收款账号</dt><dd>${e(bankReview.number)}</dd></div></dl><label class="payout-consent"><input id="payout-bank-confirm" type="checkbox" data-action="commercial:payout-bank-confirm" ${bankConfirmed?'checked':''}><span>我确认账号属于上方收款主体，并已核对银行和账号；保存后修改需联系客服。</span></label>${actions([['确认保存收款信息','commercial:payout-bank-save','primary',!bankConfirmed],['返回修改','commercial:payout-bank-edit','secondary']])}` : `<label class="field-label" for="payout-bank-name">开户银行</label><input id="payout-bank-name" class="field" maxlength="80" autocomplete="off" placeholder="请输入开户银行" value="${e(bankDraft.bank)}"><label class="field-label" for="payout-bank-number">收款账号</label><input id="payout-bank-number" class="field" inputmode="numeric" maxlength="42" autocomplete="off" placeholder="请输入该主体的收款账号" value="${e(bankDraft.number)}"><p class="payout-hint">仅可录入一次。确认保存前可以修改，保存后请联系客服。</p><button class="text-button" data-action="commercial:payout-bank-demo">填入演示银行和账号</button>${actions([['下一步：核对收款信息','commercial:payout-bank-review','primary']])}`;
        return `<section class="payout-bank">${head}${owner}<p class="payout-hint">主体来自已生效的申请，不可在此更改。${v.account?.subject==='自然人'?'请填写本人名下账户。':'请填写同名企业或个体工商户账户。'}</p>${fields}<p id="payout-bank-error" role="alert" class="payout-bank-error">${e(error)}</p><p class="payout-demo">原型请使用演示资料；只保存银行和账号尾号，不保存完整账号，不进行真实银行核验。</p></section>`;
      }
      function renderRecords(v) {
        const rows=Array.isArray(v.rows)?v.rows:[];
        return `<section id="payout-records" class="payout-records" tabindex="-1" aria-label="提现记录"><h2>提现记录</h2><p class="payout-demo">仅显示提现申请与处理结果；各状态汇总在代理中心查看。</p>${rows.length?rows.map(row=>{
          const valid=v.recordValid(row),status=valid?window.HALO_CHANNEL_SETTLEMENT.label(row.status):'记录待核对';
          return `<article class="payout-record"><div><strong>${valid?money(row.amountCents):'—'}</strong><span>${e(status)}</span></div><small>申请编号：${e(row?.id||'暂未提供')}</small><small>申请时间：${e(row?.submittedAt?new Date(row.submittedAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'暂未提供')}</small>${row?.receipt?.reason?`<p>${e(row.receipt.reason)}</p>`:''}</article>`;
        }).join(''):'<p>暂无提现记录。提交后可在这里查看进度。</p>'}</section>`;
      }
      function render() {
        const v = model(), d = draft();
        const head = '<header class="screen-head commercial-head"><div><button class="back" data-action="go:AGT-05" aria-label="返回代理中心">← 返回</button><span class="page-context">代理服务</span><h1>提现</h1></div></header>';
        const wrap = body => `${head}<div class="stack commercial-stack"><div class="channel-payout" data-payout-stamp="${e(stamp())}" aria-busy="${busy}">${body}${v.active?renderRecords(v):""}</div></div>`;
        if (!v.active) return wrap(`${feedback(v.title, v.detail, "plain")}${actions([[v.label, "commercial:payout-status", "primary"], ["联系客服", "commercial:payout-help", "secondary"]])}`);
        const record = d.resultId && v.rows.find(row => row?.id === d.resultId);
        if (d.resultId) {
          const valid = record && v.recordValid(record) && record.quote?.scope === v.scope && record.quote.id === d.quote?.id && record.amountCents === d.quote.amountCents;
          const label = valid ? window.HALO_CHANNEL_SETTLEMENT.label(record.status) : "这笔申请需要核对";
          const note = !valid ? "暂时无法匹配完整记录，请到提现记录核对。" : record.status === "processing" ? "尚未确认到账，请勿重复提交本次申请。" : record.status === "paid" ? "已收到本地到账示例回执，不代表真实转账。" : `${record.receipt.reason}；${money(record.returnedCents)} 已退回可用余额。`;
          return wrap(`<section class="payout-result" role="status"><span aria-hidden="true">${valid ? "✓" : "—"}</span><h2>${e(label)}</h2><strong>${valid ? money(record.amountCents) : "—"}</strong><p>${e(note)}</p></section>${valid ? `<dl class="payout-facts"><div><dt>申请编号</dt><dd>${e(record.id)}</dd></div><div><dt>本笔收款主体</dt><dd>${e(record.quote.account?.holder||'待核对')}</dd></div><div><dt>${record.returnedCents ? "已退回余额" : record.status === "paid" ? "已处理金额" : "余额已预占"}</dt><dd>${money(record.amountCents)}</dd></div><div><dt>当前可提现</dt><dd>${money(v.availableCents)}</dd></div></dl>` : ""}${actions([["查看提现记录", "commercial:payout-records", "primary"], ["再提一笔", "commercial:withdraw-new", "secondary", !v.canWithdraw]])}${accountPanel(v)}<p role="alert" class="payout-hint">${e(error)}</p><p class="payout-demo">本地模拟申请，不产生真实款项。</p>`);
        }
        const q = quoted() ? d.quote : null;
        const account = v.account;
        const accountText = v.accountState==='saved' ? `${e(account.bank)} · 尾号 ${e(account.last4)}` : "尚未录入";
        const quote = q ? `<section class="payout-quote" id="withdrawal-quote"><div class="payout-section-title"><h2>核对本次提现</h2><button class="text-button" data-action="commercial:payout-edit">修改金额</button></div><dl class="payout-facts"><div><dt>收款账户</dt><dd>${accountText}<br>${e(account?.holder || "")}</dd></div><div><dt>申请金额</dt><dd>${money(q.amountCents)}</dd></div><div><dt>税费 / 手续费</dt><dd>${money(q.taxCents)} / ${money(q.feeCents)}</dd></div><div class="payout-net"><dt>预计到账金额</dt><dd>${money(q.netCents)}</dd></div></dl><p class="payout-demo">以上为零费用演示，不是正式报价；到账时间尚未确认。</p><label class="payout-consent"><input id="withdrawal-confirm" type="checkbox" data-action="commercial:withdraw-confirm" ${confirmed ? "checked" : ""}><span>我已核对金额和收款账户</span></label><label class="field-label" for="withdrawal-verification">二次验证</label><input id="withdrawal-verification" class="field" inputmode="numeric" autocomplete="off" maxlength="6" placeholder="输入六位演示码" aria-describedby="payout-code-hint" value="${e(code)}"><p id="payout-code-hint" class="payout-demo">本地演示码 123456，不发送短信。</p>${actions([["提交模拟提现", "commercial:withdraw", "primary", !canSubmit()]])}<p id="payout-submit-hint" class="payout-hint" aria-live="polite">${submitHint()}</p></section>` : `${actions([["下一步：核对提现", "commercial:withdraw-quote", "primary", busy || !validAmount()]])}`;
        return wrap(`<section class="payout-account"><div><small>可提现余额</small><strong>${money(v.availableCents)}</strong></div></section>${accountPanel(v)}<ol class="payout-steps" aria-label="提现步骤"><li class="${q ? "done" : "current"}">1 填写金额</li><li class="${q ? "current" : ""}">2 核对并提交</li></ol><section class="payout-amount"><label for="channel-withdrawal">提现金额</label><div><span aria-hidden="true">¥</span><input id="channel-withdrawal" inputmode="decimal" autocomplete="off" maxlength="15" placeholder="0.00" aria-describedby="withdrawal-error" value="${e(d.amount)}" ${q || busy || !v.canWithdraw ? "readonly" : ""}><button class="text-button" data-action="commercial:payout-all" ${busy || q || !v.canWithdraw ? "disabled" : ""}>全部</button></div><p id="withdrawal-error" class="payout-hint" aria-live="polite">${reason()}</p></section><div id="payout-error" role="alert">${e(error)}</div>${quote}<p class="payout-demo">仅演示流程，不转账、不验证真实账户。</p>`);
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
        const bankError = document.getElementById("payout-bank-error"); if (bankError) bankError.textContent = error;
        const bankButton = root.querySelector('[data-action="commercial:payout-bank-save"]'); if (bankButton) { bankButton.disabled=busy||!bankConfirmed; bankButton.textContent=busy?'正在保存…':'确认保存收款信息'; }
      }
      function guard() {
        if (!onPage()) return false;
        const visible = document.querySelector(".channel-payout")?.dataset.payoutStamp;
        try { refresh(); } catch { error = "暂时读不到本地记录，请重试。"; context.render(); return false; }
        if (visible !== stamp()) { confirmed = false; code = ""; volatile = null; clearBankDraft(); context.render(); context.flash("余额或收款信息已更新，请重新核对。"); return false; }
        return true;
      }
      function handleInput(target) {
        if (!["channel-withdrawal", "withdrawal-verification", "payout-bank-name", "payout-bank-number"].includes(target.id)) return false;
        if (!guard() || busy) return true;
        if (target.id.startsWith('payout-bank-')) {
          if (model().accountState!=='missing'||bankReview) return true;
          bankDraft[target.id==='payout-bank-name'?'bank':'number']=target.value; bankConfirmed=false; error=''; sync(); return true;
        }
        if (target.id === "withdrawal-verification") { code = target.value.trim(); sync(); return true; }
        if (quoted() || !model().canWithdraw) return true;
        const next = { ...draft(), amount: target.value.trim(), quote: null, resultId: "" };
        confirmed = false; code = "";
        if (!save(next)) volatile = next;
        sync(); return true;
      }
      async function saveBank() {
        if (!bankReview || !bankConfirmed || model().accountState!=='missing') return;
        const expected=stamp(), beforeScope=session().key, beforeVisit=visit, reviewed={...bankReview};
        busy=true; sync();
        try {
          if(!navigator.locks?.request) throw new Error('lock unavailable');
          await navigator.locks.request('halo-channel-payout',async()=>{
            refresh();
            if(!onPage()||session().key!==beforeScope||visit!==beforeVisit) return;
            const v=model();
            if(expected!==stamp()||!v.active||v.accountState!=='missing'){clearBankDraft();error='收款主体或信息已变化，请查看最新记录。已保存的信息不能再次录入。';return;}
            if(!navigator.onLine){error='当前已离线，收款信息尚未保存。请联网后重试。';return;}
            const record={version:1,id:crypto.randomUUID(),ownerAccount:session().accountRef,partyKey:v.payeeKey,holder:v.account.holder,subject:v.account.subject,bank:reviewed.bank,last4:reviewed.number.slice(-4),savedAt:new Date().toISOString(),simulated:true};
            if(save(empty(),{channelPayoutAccount:record})){clearBankDraft();confirmed=false;code='';}
            else error='收款信息未保存，请重试。当前输入仍保留，尚未锁定。';
          });
        } catch {error='收款信息未保存，请重试或联系客服。尚未锁定。';}
        finally {busy=false;if(onPage())context.render();}
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
            if (v.rows.some(row => row?.id === recordId)) { error = "已有这笔申请，请到提现记录查看。"; return; }
            const record = { id: recordId, amountCents: q.amountCents, quote: q, status: "processing", submittedAt: new Date().toISOString() };
            if (save({ ...draft(), resultId: recordId }, { channelAvailableCents: v.availableCents - q.amountCents, withdrawals: [record, ...v.rows] })) { confirmed = false; code = ""; }
          });
        } catch { error = "申请尚未保存，请重试或到提现记录核对。"; }
        finally { busy = false; if (onPage()) context.render(); }
      }
      function handleAction(command, value, ctx) {
        if (!command.startsWith("payout-") && !["withdraw-quote", "withdraw-confirm", "withdraw", "withdraw-new"].includes(command)) return false;
        context = { ...context, ...ctx };
        if (!guard() || busy) return true;
        if (command === "payout-help") { context.go("HELP-03"); return true; }
        if (command === "payout-records") { const target=document.getElementById('payout-records');target?.focus({preventScroll:true});target?.scrollIntoView({block:'start'});return true; }
        if (command === "payout-status") { context.go(model().route); return true; }
        if (!model().active) return true;
        if (command.startsWith('payout-bank-')) {
          if(model().accountState!=='missing'){clearBankDraft();error='收款信息已保存或需核对，后续修改请联系客服。';context.render();return true;}
          if(command==='payout-bank-demo'&&!bankReview){bankDraft={bank:'演示银行',number:'0000000000008821'};error='';context.render();return true;}
          if(command==='payout-bank-edit'){bankReview=null;bankConfirmed=false;error='';context.render();return true;}
          if(command==='payout-bank-review'){
            const bank=bankDraft.bank.trim(),number=bankDraft.number.replace(/\s/g,'');
            if(bank.length<2||bank.length>80)error='请填写完整的开户银行名称（2–80 字）。';
            else if(!/^\d{8,34}$/.test(number))error='请填写 8–34 位数字账号，可包含空格；这里只检查演示格式。';
            else {bankReview={bank,number};bankConfirmed=false;error='';}
            context.render();return true;
          }
          if(command==='payout-bank-confirm'&&bankReview){bankConfirmed=Boolean(document.getElementById('payout-bank-confirm')?.checked);sync();return true;}
          if(command==='payout-bank-save')void saveBank();
          return true;
        }
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
