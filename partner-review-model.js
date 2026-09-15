/* Internal, synthetic review model. No commission computation, remote calls or real signatures. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HaloPartnerReviewModel = api;
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  const statuses = ['待入账', '可提现', '提现中', '已提现'];
  // Candidate display names only; backend rank codes and award keys stay unchanged.
  const rankNames = ['', '体验顾问', '专业顾问', '经营伙伴', '领航伙伴'];
  const rankName = level => rankNames[level] || '尚未生效';
  const rankEnglish = level => ['', 'Experience Advisor', 'Professional Advisor', 'Business Partner', 'Lead Partner'][level] || 'Not active';
  const rankLabel = level => `${rankName(level)} · ${rankEnglish(level)}`;
  const awardNames = { management: '团队协作积分', leadership: '组织发展积分' };
  const version = level => `DEMO-L${level}-20260915`;
  const ranks = level => level === 4 ? [3, 2] : level === 3 ? [2, 1] : [];
  const entityFieldsValid = s => String(s.companyName||'').trim().length >= 2 && /^[0-9A-Z]{15,20}$/.test(String(s.taxNumber||'').trim().toUpperCase());
  const entityReady = s => s.entity === 'verified' && entityFieldsValid(s);
  function initial(level = 0) {
    return { schema: 1, revision: 0, level, target: level ? Math.min(4, level + 1) : 1,
      phase: level ? 'active' : 'reading', read: false, consent: false, receipt: null,
      entity: level >= 3 ? 'verified' : 'missing', entityType: '个体工商户', entityId: level >= 3 ? 'DEMO-ENTITY-1' : null,
      companyName:level>=3?'示例经营主体（虚构）':'',taxNumber:level>=3?'DEMO00000000000001':'',
      payoutSubject: level ? (level >= 3 ? 'DEMO-ENTITY-1' : 'person') : null, history: [], amendment: '',
      payout: level ? 'verified' : 'missing', contracts: Array.from({length:level},(_,i)=>({id:`DEMO-HISTORY-L${i+1}`,level:i+1,version:version(i+1),status:'signed',simulated:true,signedAt:'2026-08-01T09:00:00.000Z',effectiveAt:'2026-08-02T09:00:00.000Z'})), completed: [], answer: '' };
  }
  function signed(s) {
    return s.receipt?.status === 'signed' && s.receipt.level === s.target &&
      s.receipt.version === version(s.target) && s.receipt.simulated === true;
  }
  const party = s => {
    const a=s.application||{},business=s.target>=3||a.payeeType==='企业或个体工商户';
    return {subject:business?'企业或个体工商户':'自然人',holder:business?(s.target>=3?s.companyName:a.companyName)||'演示经营主体':a.personName||'演示用户',key:s.target>=3?s.entityId:business?'company:'+(a.id||'application'):'person'};
  };
  const subject = s => party(s).key;
  function normalize(source) {
    const s = {...source, history:source.history || [], amendment:source.amendment || ''};
    if (s.entity === 'verified' && !s.entityId) s.entityId = 'DEMO-ENTITY-1';
    if (!Object.hasOwn(s,'payoutSubject')) {
      s.payoutSubject = s.level ? (s.level >= 3 ? s.entityId : 'person') : null;
      if (s.target >= 3 && s.level < 3) s.payout = 'missing';
    }
    return s;
  }
  function transition(source, event, now = '2026-09-15T09:00:00.000Z') {
    const s = JSON.parse(JSON.stringify(normalize(source)));
    const move = phase => { s.phase = phase; };
    if (event === 'upgrade' && s.phase === 'active' && s.level < 4) {
      if(!s.activeParty)s.activeParty=party({...s,target:s.level});
      s.target = s.level + 1; s.read = false; s.consent = false; s.receipt = null; move('reading');
      if (s.target === 3) { s.payout = 'missing'; s.payoutSubject = null; }
    } else if (event === 'read' && s.phase === 'reading') s.read = true;
    else if (event === 'consent' && s.phase === 'reading' && s.read) s.consent = true;
    else if (event === 'unconsent' && s.phase === 'reading') s.consent = false;
    else if (event === 'entity' && s.target >= 3 && s.phase === 'reading' && entityFieldsValid(s)) move('entity-pending');
    else if (event === 'entity-ok' && s.phase === 'entity-pending' && entityFieldsValid(s)) { s.entity = 'verified'; s.entityId = `DEMO-ENTITY-${s.revision}`; move('reading'); }
    else if (event === 'entity-fail' && s.phase === 'entity-pending') { s.entity = 'failed'; move('reading'); }
    else if (event === 'sign' && s.phase === 'reading' && s.read && s.consent && (s.target < 3 || entityReady(s))) move('signing');
    else if (event === 'cancel' && s.phase === 'signing') move('reading');
    else if (event === 'signed' && s.phase === 'signing' && (s.target < 3 || entityReady(s))) {
      s.receipt = { id: `DEMO-SIGN-L${s.target}-${source.revision}`, level: s.target, version: version(s.target), status: 'signed', simulated: true, signedAt: now,party:party(s),application:s.application?{...s.application}:null };
      move('reviewing');
    } else if (event === 'approve' && s.phase === 'reviewing' && signed(s) && (s.target < 3 || entityReady(s))) move('pending');
    else if (event === 'reject' && s.phase === 'reviewing' && signed(s)) {
      s.reviewFeedback={reason:'申请主体名称需核对，请更正填写错误，或补充名称一致的说明。',fields:[party(s).subject==='自然人'?'personName':'companyName'],at:now};move('rejected');
    }
    else if (event === 'amend' && s.phase === 'rejected') {
      s.correctionDraft={...s.application,...(s.target>=3?{payeeType:'企业或个体工商户',companyName:s.companyName,taxNumber:s.taxNumber}:{})};move('amending');
    }
    else if (event === 'resubmit' && s.phase === 'amending' && s.amendment.trim() && signed(s)) {
      const before={...s.application,...(s.target>=3?{payeeType:'企业或个体工商户',companyName:s.companyName,taxNumber:s.taxNumber}:{})},draft=s.correctionDraft||before;
      const changed=['payeeType','personName','idNumber','companyName','taxNumber'].some(k=>(before[k]||'')!==(draft[k]||''));
      s.history.push({phase:'rejected',receipt:s.receipt,application:before,feedback:s.reviewFeedback,amendment:s.amendment,at:now});
      s.application={...draft,revision:(s.application?.revision||0)+1};delete s.correctionDraft;
      if(changed){
        if(s.target>=3){s.companyName=draft.companyName;s.taxNumber=draft.taxNumber;s.entity='missing';s.entityId=null;}
        s.read=false;s.consent=false;s.receipt=null;s.payout='missing';s.payoutSubject=null;move('reading');
      }else move('reviewing');
    }
    else if (event === 'withdraw' && ['reading','signing','reviewing','rejected','amending'].includes(s.phase)) {
      s.history.push({phase:'withdrawn',receipt:s.receipt,at:now}); move('withdrawn');
    }
    else if (event === 'restart' && s.phase === 'withdrawn') { s.read=false; s.consent=false; s.receipt=null; s.amendment=''; move('reading'); }
    else if (event === 'payout' && s.phase === 'pending' && subject(s)) { s.payout = 'verified'; s.payoutSubject = subject(s); }
    else if (event === 'effective' && s.phase === 'pending' && signed(s) && s.payout === 'verified' && s.payoutSubject === subject(s) && (s.target < 3 || entityReady(s))) {
      s.level = s.target; s.activeParty=party(s);s.contracts.push({ ...s.receipt,party:s.activeParty,effectiveAt: now }); move('active');
    }
    if (JSON.stringify(s) === JSON.stringify(source)) return source;
    s.revision++; return s;
  }
  function team(level, owner, rows) {
    return ranks(level).map(rank => ({ rank, members: rows.filter(row => row.owner === owner && row.rank === rank).map(({ id, name, rank }) => ({ id, name, rank })) }));
  }
  // Review entry snapshots only. Build receipts with the same gates as the interactive flow.
  // These fixtures do not mutate the original application/training records or production roles.
  function initialForCase(name) {
    if (/^L[1-4]$/.test(name)) return initial(Number(name[1]));
    if (/^promotion-L[1-3]$/.test(name)) return transition(initial(Number(name.at(-1))), 'upgrade');
    let s = initial();
    if (['application-reviewing', 'application-approved'].includes(name)) {
      for (const event of ['read', 'consent', 'sign', 'signed']) s = transition(s, event);
      if (name === 'application-approved') s = transition(s, 'approve');
    }
    return s;
  }
  // Display conversion only. Ledger is in integer fen; rounding never writes back to it.
  function points(fen) {
    if (!Number.isSafeInteger(fen)) return '—';
    const negative = fen < 0, n = BigInt(Math.abs(fen));
    const hundredths = (n + 50n) / 100n;
    return `${negative && hundredths > 0n ? '-' : ''}${hundredths / 100n}.${String(hundredths % 100n).padStart(2, '0')}`;
  }
  const money = fen => Number.isSafeInteger(fen) ? (fen / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';
  // Precomputed response fixtures, not a payout formula. Each status is a disjoint snapshot bucket.
  const appTotals = [128600, 246800, 50000, 1834200];
  const awardTotals = {
    '2026-09': { management: [425050, 183600, 50000, 620000], leadership: [168000, 75000, 0, 280000] },
    '2026-08': { management: [0, 0, 0, 950000], leadership: [0, 0, 0, 315000] },
    '2026-07': { management: [0, 0, 0, 810000], leadership: [0, 0, 0, 225000] }
  };
  // Independent synthetic posting records, NOT renamed withdrawal buckets or commission formulas.
  const pointRecords = {
    '2026-09': {
      management: [
        { id:'DEMO-M-0914', date:'2026-09-14', fen:425000, note:'本期积分记录' },
        { id:'DEMO-M-0910', date:'2026-09-10', fen:-15000, note:'原记录更正', related:'DEMO-M-0905' },
        { id:'DEMO-M-0905', date:'2026-09-05', fen:200000, note:'本期积分记录' }
      ],
      leadership: [
        { id:'DEMO-L-0914', date:'2026-09-14', fen:168000, note:'本期积分记录' },
        { id:'DEMO-L-0911', date:'2026-09-11', fen:-8000, note:'上期记录更正', related:'DEMO-L-0828' }
      ]
    },
    '2026-08': {
      management: [{ id:'DEMO-M-0828', date:'2026-08-28', fen:950000, note:'本期积分记录' }],
      leadership: [{ id:'DEMO-L-0828', date:'2026-08-28', fen:315000, note:'本期积分记录' }]
    },
    '2026-07': {
      management: [{ id:'DEMO-M-0728', date:'2026-07-28', fen:810000, note:'本期积分记录' }],
      leadership: [{ id:'DEMO-L-0728', date:'2026-07-28', fen:225000, note:'本期积分记录' }]
    }
  };
  return { statuses, rankName, rankNames, rankEnglish, rankLabel, awardNames, pointRecords, version, ranks, initial, initialForCase, normalize, subject, party, signed, entityFieldsValid, entityReady, transition, team, points, money, appTotals, awardTotals };
});
