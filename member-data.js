(function () {
  "use strict";
  const integer = value => Number.isSafeInteger(value) && value >= 0;
  const unknown = () => ({unavailable:true,level:null,growth:null,badges:null,points:null,pending:0,sourceVerified:false,formalCocreationVerified:null,deepCocreationVerified:null});
  // All member views use the same durable session and asset ownership check.
  // A read never adopts a legacy ledger, creates assets or confirms an upgrade.
  function read(ctx = {}, {storageKey = "haloV5CommercialProgress", allowFresh = false} = {}) {
    const identity = ctx.applicationContext?.() || {}, account = identity.accountRef || "", registration = ctx.memberCreatedAt || "";
    const result = {validSession:false,trusted:false,fresh:false,account,registration,data:{}};
    try {
      const login = JSON.parse(localStorage.getItem("haloV5AppProgress") || "null");
      if (!account || identity.signedIn !== true || login?.signedIn !== true || login.authVerified !== true || (login.authPhone || login.authForm?.phone) !== account || (login.memberCreatedAt || "") !== registration || ctx.newMember && (!registration || !Number.isFinite(Date.parse(registration)))) return result;
      result.validSession = true;
      const raw = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (raw !== null && (typeof raw !== "object" || Array.isArray(raw))) return result;
      const data = raw || {}, record = data.memberAssets;
      const owners = [data.accountRef, record?.accountRef].filter(value => value !== undefined && value !== null && value !== "");
      if (owners.some(owner => owner !== account) || record?.registrationId && record.registrationId !== registration || data.registrationId && data.registrationId !== registration) return result;
      const empty = !record && !data.badgeDetails && ["pointsBalance","pendingPointsCorrection"].every(key => data[key] === undefined || data[key] === 0) && ["pointsTransactions","vouchers","studioAwards","ownedCouponIds"].every(key => data[key] === undefined || Array.isArray(data[key]) && data[key].length === 0) && ["taskStates","taskPeriods"].every(key => data[key] === undefined || data[key] && typeof data[key] === "object" && !Array.isArray(data[key]) && Object.keys(data[key]).length === 0);
      if (allowFresh && ctx.newMember && login.newMember === true && Date.parse(registration) <= Date.now() && empty) return {...result,fresh:true,data};
      if (!owners.length || ctx.newMember && record?.registrationId !== registration) return result;
      return {...result,trusted:true,data};
    } catch { return result; }
  }
  function badgeCount(data, account, registration) {
    const aggregate = integer(data.memberAssets?.badges) && data.memberAssets.badges <= 5 ? data.memberAssets.badges : null;
    const detail = data.badgeDetails;
    if (detail?.accountRef !== account || (detail.registrationId || "") !== registration || !Array.isArray(detail.items) || !Number.isFinite(Date.parse(detail.updatedAt)) || Date.parse(detail.updatedAt) > Date.now()) return aggregate;
    let known = 0, earned = 0;
    for (const id of ["companionship","repair","understanding","participation","contribution"]) {
      const rows = detail.items.filter(row => row?.id === id), row = rows.length === 1 ? rows[0] : null;
      if (!row || row.accountRef && row.accountRef !== account || row.registrationId && row.registrationId !== registration) continue;
      if (["pending","in_progress"].includes(row.status)) known++;
      else if (row.status === "earned" && typeof row.receiptId === "string" && row.receiptId.trim() && Number.isFinite(Date.parse(row.awardedAt)) && Date.parse(row.awardedAt) <= Date.parse(detail.updatedAt) && (!Number.isFinite(Date.parse(registration)) || Date.parse(row.awardedAt) >= Date.parse(registration))) {known++;earned++;}
    }
    if (aggregate !== null && (earned > aggregate || known === 5 && earned !== aggregate)) return null;
    return aggregate !== null ? aggregate : known === 5 ? earned : null;
  }
  function snapshot(ctx, options = {}) {
    const source = read(ctx, {...options,allowFresh:true});
    if (!source.validSession || !source.trusted && !source.fresh) return unknown();
    const {data,account,registration,fresh} = source, record = data.memberAssets;
    const never = ctx.membershipState === "never-bound";
    const parsed = typeof record?.level === "string" ? Number(record.level.match(/(?:^|[（(\s])L([1-6])(?:[）)\s]|$)/u)?.[1] || 0) - 1 : -1;
    const level = fresh || never ? 0 : parsed >= 0 ? parsed : null;
    const growth = fresh || never ? 0 : integer(record?.growth) ? record.growth : null;
    const badges = fresh || never ? 0 : badgeCount(data,account,registration);
    const pending = !fresh && integer(data.pendingPointsCorrection) ? data.pendingPointsCorrection : 0;
    const points = fresh ? 0 : pending > 0 ? 0 : integer(data.pointsBalance) ? data.pointsBalance : null;
    const verified = key => !fresh && typeof record?.[key] === "boolean" ? record[key] : null;
    return {level,growth,badges,points,pending,sourceVerified:true,unavailable:[level,growth,badges,points].some(value => value === null),formalCocreationVerified:verified("formalCocreationVerified"),deepCocreationVerified:verified("deepCocreationVerified")};
  }
  window.HALO_MEMBER_DATA = {read,snapshot,badgeCount};
})();
