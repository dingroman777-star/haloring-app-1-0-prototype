(function () {
  "use strict";
  const APP_KEY = "haloV5AppProgress", HARDWARE_KEY = "membershipHardwareState", SUBJECTIVE_KEY = "haloSubjectiveRecords", DAY = 86400000;
  const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
  const integer = value => Number.isSafeInteger(value) && value >= 0;
  const stamp = value => typeof value === "string" && /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? Date.parse(value) : NaN;
  const day = value => Math.floor((value + 8 * 3600000) / DAY);
  const copy = value => JSON.parse(JSON.stringify(value));
  const lockName = storageKey => `halo-member-ledger:${storageKey}`;
  function periodKey(period, value) {
    const date = new Date(value + 8 * 3600000);
    if (period === "week") date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
    return date.toISOString().slice(0, period === "month" ? 7 : 10);
  }
  const BADGE_RULES = {
    companionship: { wearDays: 180 }, repair: { repairs: 60 },
    understanding: { weeklyFeedbacks: 12, monthlyReviews: 3 },
    participation: { participations: 6 }, contribution: { contributions: 2, interviews: 1 }
  };
  const BADGE_TASKS = {
    "wear-12h": ["companionship", "wearDays"], "night-repair": ["repair", "repairs"],
    "weekly-feedback": ["understanding", "weeklyFeedbacks"], "monthly-review": ["understanding", "monthlyReviews"]
  };
  const belongs = (row, account, registration) => object(row)
    && (!Object.hasOwn(row, "accountRef") || row.accountRef === account)
    && (!Object.hasOwn(row, "registrationId") || row.registrationId === registration);
  function emptyAssets(data) {
    return data.memberAssets == null && data.badgeDetails == null
      && ["pointsBalance", "pendingPointsCorrection"].every(key => data[key] == null || data[key] === 0)
      && ["pointsTransactions", "vouchers", "studioAwards", "ownedCouponIds"].every(key => data[key] == null || Array.isArray(data[key]) && data[key].length === 0)
      && ["taskStates", "taskPeriods"].every(key => data[key] == null || object(data[key]) && Object.keys(data[key]).length === 0);
  }
  window.HALO_MEMBER_TASK_LEDGER = {
    lockName,
    create({ storageKey, tasks, sync }) {
      function source(input, now) {
        const raw = localStorage.getItem(storageKey), appRaw = localStorage.getItem(APP_KEY), hardwareRaw = localStorage.getItem(HARDWARE_KEY);
        const app = JSON.parse(appRaw || "null"), parsed = JSON.parse(raw || "null"), data = parsed === null ? {} : parsed;
        const account = input.accountRef, registration = input.memberCreatedAt;
        if (!object(app) || !object(data) || typeof account !== "string" || !account.trim()
          || typeof registration !== "string" || (app.memberCreatedAt || "") !== registration
          || app.signedIn !== true || app.authVerified !== true || (app.authPhone || app.authForm?.phone) !== account
          || app.accountDeletionStatus && app.accountDeletionStatus !== "ready"
          || input.hardwareActive !== true || hardwareRaw !== "active"
          || input.newMember === true && (app.newMember !== true || !Number.isFinite(stamp(registration)))) return null;
        const occurred = stamp(input.occurredAt), registered = stamp(registration), activated = stamp(app.hardwareActivatedAt);
        if (!Number.isFinite(occurred) || occurred > now || day(now) - day(occurred) > 7
          || registration !== "" && !Number.isFinite(registered)
          || Number.isFinite(registered) && occurred < registered
          || Number.isFinite(activated) && occurred < activated
          || app.hardwareActivatedAt && !Number.isFinite(activated)
          || app.newMember === true && !Number.isFinite(registered)) return null;
        const owners = [data.accountRef, data.memberAssets?.accountRef].filter(value => value !== undefined);
        const empty = emptyAssets(data);
        if (owners.some(owner => owner !== account) || !owners.length && !empty || !belongs(data, account, registration)
          || data.memberAssets != null && (!belongs(data.memberAssets, account, registration)
            || app.newMember === true && data.memberAssets.registrationId !== registration)) return null;
        const initialized = data.memberAssets == null;
        // Never reset/adopt legacy assets or infer missing growth from a Points balance.
        if (initialized && (!empty || app.newMember !== true || !Number.isFinite(registered))) return null;
        const candidate = copy(data);
        if (initialized) candidate.memberAssets = { accountRef: account, registrationId: registration, level: "Halo Member（L1）", growth: 0, badges: 0 };
        const assets = candidate.memberAssets;
        if (!integer(assets.growth) || !integer(assets.badges) || assets.badges > 5 || typeof assets.level !== "string"
          || !/(?:^|[（(\s])L[1-6](?:[）)\s]|$)/u.test(assets.level)) return null;
        if (empty) {
          candidate.pointsBalance ??= 0; candidate.pendingPointsCorrection ??= 0;
          candidate.pointsTransactions ??= []; candidate.taskStates ??= {}; candidate.taskPeriods ??= {};
        }
        if (!integer(candidate.pointsBalance) || !integer(candidate.pendingPointsCorrection)
          || candidate.pendingPointsCorrection > 0 && candidate.pointsBalance > 0
          || !Array.isArray(candidate.pointsTransactions) || !object(candidate.taskStates) || !object(candidate.taskPeriods)
          || candidate.pointsTransactions.some(row => object(row) && !belongs(row, account, registration))) return null;
        candidate.accountRef = account;
        candidate.memberAssets.accountRef = account;
        candidate.memberAssets.registrationId = registration;
        return { raw, appRaw, hardwareRaw, app, data: candidate, account, registration, occurred, initialized };
      }
      function evidenceSource(input, context) {
        const matches = row => object(row) && row.taskId === input.taskId && row.accountRef === context.account
          && row.registrationId === context.registration && row.occurredAt === input.occurredAt
          && row.verified === true && row.hardwareActive === true;
        if (input.taskId === "night-repair") {
          return Array.isArray(context.app.nightHistory) && context.app.nightHistory.some(row => object(row) && row.id
            && belongs(row, context.account, context.registration) && row.memberRegistrationId === context.registration
            && matches(row.memberTaskEvidence) && row.ownerAccount === context.account && row.endedAt === input.occurredAt
            && row.status === "ended" && row.taskVerification === "eligible-prototype" && !row.skipped
            && row.hardwareEligibleAtStart === true && row.personalized === true
            && Number.isFinite(stamp(row.startedAt)) && stamp(row.startedAt) <= context.occurred
            && (!Number.isFinite(stamp(context.registration)) || stamp(row.startedAt) >= stamp(context.registration))
            && Number.isFinite(row.duration) && row.duration > 0 && Number.isFinite(row.positionSeconds) && row.positionSeconds >= row.duration * 60);
        }
        if (input.taskId === "monthly-review") {
          const raw = localStorage.getItem(SUBJECTIVE_KEY), rows = JSON.parse(raw || "null");
          context.subjectiveRaw = raw;
          return Array.isArray(rows) && rows.some(row => object(row) && row.id && belongs(row, context.account, context.registration) && matches(row.memberTaskEvidence)
            && row.source === "user-record" && row.occurredAt === input.occurredAt && /^\d{4}-(?:0[1-9]|1[0-2])$/.test(row.reportMonth));
        }
        // Other task producers must supply verified evidence through this internal API.
        return true;
      }
      function updateBadge(candidate, context, taskId, at, transactionId) {
        const mapping = BADGE_TASKS[taskId];
        // The weekly five-day bonus must not count the same five days again.
        if (!mapping) return null;
        const [id, key] = mapping, { account, registration } = context;
        if (context.initialized && candidate.badgeDetails == null) {
          candidate.badgeDetails = { accountRef: account, registrationId: registration, updatedAt: at,
            items: Object.entries(BADGE_RULES).map(([badgeId, conditions]) => ({ id: badgeId, accountRef: account, registrationId: registration,
              status: "in_progress", progress: Object.fromEntries(Object.keys(conditions).map(field => [field, 0])) })) };
        }
        const book = candidate.badgeDetails;
        const delta = { badgeId: id, field: key, amount: 1, transactionId, applied: false };
        if (!object(book) || book.accountRef !== account || book.registrationId !== registration
          || !Number.isFinite(stamp(book.updatedAt)) || stamp(book.updatedAt) > Date.parse(at) || !Array.isArray(book.items)) return delta;
        const rows = book.items.filter(row => row?.id === id), row = rows.length === 1 ? rows[0] : null;
        if (!belongs(row, account, registration) || !["in_progress", "pending", "earned"].includes(row.status)
          || !object(row.progress) || !integer(row.progress[key]) || !integer(row.progress[key] + 1)) return delta;
        row.progress[key] += 1;
        const conditions = BADGE_RULES[id], reached = Object.entries(conditions).every(([field, target]) => integer(row.progress[field]) && row.progress[field] >= target);
        if (row.status !== "earned" && reached) row.status = "pending";
        row.accountRef = account; row.registrationId = registration; row.updatedAt = at;
        book.updatedAt = at;
        delta.applied = true;
        return delta;
      }
      function commit(input) {
        const now = Date.now();
        if (!object(input) || input.verified !== true || !Object.hasOwn(tasks, input.taskId)) return false;
        const task = tasks[input.taskId];
        if (!object(task) || !["today", "week", "month"].includes(task.period) || !integer(task.growth) || !integer(task.points) || task.points === 0) return false;
        const context = source(input, now);
        if (!context) return false;
        const candidate = context.data, period = periodKey(task.period, context.occurred), id = `task:${input.taskId}:${period}:reward`;
        const existing = candidate.pointsTransactions.filter(row => row?.id === id);
        if (existing.length) {
          const row = existing[0];
          return existing.length === 1 && belongs(row, context.account, context.registration) && integer(row.amount) && row.amount <= task.points
            && (!Object.hasOwn(row, "growth") || row.growth === task.growth)
            && integer(row.offset) && row.offset <= row.amount && Number.isFinite(stamp(row.occurred_at))
            && periodKey(task.period, stamp(row.occurred_at)) === period && Number.isFinite(stamp(row.posted_at))
            && stamp(row.occurred_at) <= stamp(row.posted_at) && stamp(row.posted_at) <= now
            && (!Number.isFinite(stamp(context.registration)) || stamp(row.occurred_at) >= stamp(context.registration));
        }
        // Ambiguous pre-period rewards cannot safely be treated as a new award.
        if (candidate.pointsTransactions.some(row => row?.id === `task:${input.taskId}:reward`)) return false;
        if (!evidenceSource(input, context)) return false;
        let monthly = 0;
        for (const row of candidate.pointsTransactions) {
          if (!/^(task|studio):/.test(row?.id || "")) continue;
          const occurred = stamp(row.occurred_at);
          if (!Number.isFinite(occurred) || !Number.isSafeInteger(row.amount)) return false;
          if (periodKey("month", occurred) === periodKey("month", context.occurred)) monthly += row.amount;
          if (!Number.isSafeInteger(monthly)) return false;
        }
        const amount = Math.min(task.points, Math.max(0, 2000 - Math.max(0, monthly)));
        const offset = Math.min(amount, candidate.pendingPointsCorrection), available = amount - offset;
        if (!integer(candidate.pointsBalance + available) || !integer(candidate.memberAssets.growth + task.growth)) return false;
        const postedAt = new Date(now).toISOString(), expires = new Date(now);
        expires.setUTCMonth(expires.getUTCMonth() + 24);
        const badgeDelta = updateBadge(candidate, context, input.taskId, postedAt, id);
        candidate.pointsTransactions.unshift({ id, accountRef: context.account, registrationId: context.registration,
          taskId: input.taskId, periodKey: period, title: task.title, detail: amount < task.points ? "有效行为已确认 · 本月常规积分上限" : "有效行为已确认",
          amount, offset, growth: task.growth, occurred_at: input.occurredAt, posted_at: postedAt, expires_at: expires.toISOString(),
          ...(badgeDelta ? { badgeDelta } : {}) });
        candidate.pointsBalance += available;
        candidate.pendingPointsCorrection -= offset;
        candidate.pointsMode = candidate.pendingPointsCorrection > 0 ? "pending" : candidate.pointsMode === "pending" ? "normal" : candidate.pointsMode || "normal";
        candidate.memberAssets.growth += task.growth;
        if (period === periodKey(task.period, now)) {
          candidate.taskStates[input.taskId] = "posted";
          candidate.taskPeriods[input.taskId] = period;
        }
        // Other domains may not yet use the member lock: reject a detected change.
        if (localStorage.getItem(storageKey) !== context.raw || localStorage.getItem(APP_KEY) !== context.appRaw
          || localStorage.getItem(HARDWARE_KEY) !== context.hardwareRaw
          || Object.hasOwn(context, "subjectiveRaw") && localStorage.getItem(SUBJECTIVE_KEY) !== context.subjectiveRaw) return false;
        localStorage.setItem(storageKey, JSON.stringify(candidate));
        // A consumer failure after durable commit must not turn the reward into a retry.
        try { if (typeof sync === "function") sync(copy(candidate)); } catch { /* Durable receipt remains authoritative. */ }
        return true;
      }
      async function complete(input = {}) {
        if (typeof navigator === "undefined" || typeof navigator.locks?.request !== "function") return false;
        let timer;
        try {
          const captured = { ...input }, controller = new AbortController();
          timer = setTimeout(() => controller.abort(), 6000);
          return await navigator.locks.request(lockName(storageKey), { mode: "exclusive", signal: controller.signal }, () => commit(captured));
        } catch { return false; }
        finally { clearTimeout(timer); }
      }
      return { complete };
    }
  };
})();
