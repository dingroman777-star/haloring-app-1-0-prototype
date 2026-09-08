(function(){
  const integer=n=>Number.isSafeInteger(n)&&n>=0;
  const owns=(x,s)=>!x.accountRef||x.accountRef===s.account;
  const belongs=(x,item,prefix)=>x?.itemId===item.id||x?.id===`${prefix}:${item.id}`;
  function history(s,item){
    if(s.unavailable||!Array.isArray(s.data?.pointsTransactions)||!Array.isArray(s.data?.vouchers))return {unknown:true,entries:[]};
    const txs=s.data.pointsTransactions.filter(x=>belongs(x,item,'redemption')),vs=s.data.vouchers.filter(x=>belongs(x,item,'voucher')),entries=[];
    let unknown=false;
    for(const tx of txs){const matches=vs.filter(v=>v.requestId&&v.requestId===tx.requestId),v=matches[0];
      if(!tx.requestId||txs.filter(x=>x.requestId===tx.requestId).length!==1||matches.length!==1||!Number.isSafeInteger(tx.amount)||tx.amount>=0||!owns(tx,s)||!owns(v,s)||!Number.isFinite(Date.parse(tx.posted_at))||Date.parse(tx.posted_at)>Date.now()||!integer(tx.balanceAfter)||!Number.isFinite(Date.parse(v.expiresAt||v.expires_at))||!['available','used','returned','expired'].includes(v.status)){unknown=true;continue;}
      entries.push({tx,v});
    }
    if(vs.some(v=>!entries.some(r=>r.v===v)))unknown=true;
    return {unknown,entries:entries.sort((a,b)=>Date.parse(b.tx.posted_at)-Date.parse(a.tx.posted_at))};
  }
  function validity(o){return Number.isInteger(o?.voucherValidityDays)&&o.voucherValidityDays>0&&o.voucherValidityDays<=3650?`到账后 ${o.voucherValidityDays} 天内使用`:'使用期限待确认';}
  function policy(o){return o?.redemptionPolicy==='once'?'每位会员在本活动限兑 1 次':o?.redemptionPolicy==='repeat'?'本活动可重复兑换，每次使用相应积分':'兑换次数规则待公布';}
  function validOffer(o,item){return o&&o.status==='open'&&o.cost===item.cost&&integer(o.stock)&&o.stock>0&&Date.parse(o.endsAt)>Date.now()&&validity(o)!=='使用期限待确认'&&typeof o.activityId==='string'&&o.activityId.trim()&&['once','repeat'].includes(o.redemptionPolicy)&&['usage','returns'].every(k=>typeof o[k]==='string'&&o[k].trim());}
  function limitReason(s,item,o){const h=history(s,item);if(h.unknown)return '兑换记录待核对';if(!o?.activityId||!['once','repeat'].includes(o.redemptionPolicy))return '兑换次数规则待公布';if(o.redemptionPolicy==='once'){if(h.entries.some(r=>!r.tx.activityId))return '历史兑换所属活动待核对';if(h.entries.some(r=>r.tx.activityId===o.activityId))return '本活动已兑换，限兑 1 次';}return '';}
  window.HALO_POINTS_REDEMPTION_DATA={history,validity,policy,validOffer,limitReason};
})();
