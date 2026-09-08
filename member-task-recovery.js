(function () {
  "use strict";
  const APP_KEY = "haloV5AppProgress", RECORDS_KEY = "haloSubjectiveRecords", DAY = 86400000;
  const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
  const integer = value => Number.isSafeInteger(value) && value >= 0;
  const stamp = value => typeof value === "string" && /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? Date.parse(value) : NaN;
  const day = value => Math.floor((value + 8 * 3600000) / DAY);
  function periodKey(period, value) {
    const date = new Date(value + 8 * 3600000);
    if (period === "week") date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
    return date.toISOString().slice(0, period === "month" ? 7 : 10);
  }
  const belongs = (row, account, registration) => object(row)
    && (!Object.hasOwn(row, "accountRef") || row.accountRef === account)
    && (!Object.hasOwn(row, "registrationId") || row.registrationId === registration);
  window.HALO_MEMBER_TASK_RECOVERY = {
    create({ storageKey, tasks, complete }) {
      let running = null;
      const rewardId = evidence => `task:${evidence.taskId}:${periodKey(tasks[evidence.taskId].period, stamp(evidence.occurredAt))}:reward`;
      function recorded(data, evidence, now) {
        const owners = [data.accountRef, data.memberAssets?.accountRef].filter(value => value !== undefined);
        if (!owners.length || owners.some(owner => owner !== evidence.accountRef)
          || Object.hasOwn(data, "registrationId") && data.registrationId !== evidence.registrationId
          || !belongs(data.memberAssets, evidence.accountRef, evidence.registrationId)
          || !Array.isArray(data.pointsTransactions)) return false;
        const rows = data.pointsTransactions.filter(row => row?.id === rewardId(evidence)), row = rows[0];
        const task = tasks[evidence.taskId], period = periodKey(task.period, stamp(evidence.occurredAt));
        return rows.length === 1 && belongs(row, evidence.accountRef, evidence.registrationId)
          && integer(row.amount) && row.amount <= task.points && integer(row.offset) && row.offset <= row.amount
          && (!Object.hasOwn(row, "growth") || row.growth === task.growth) && Number.isFinite(stamp(row.occurred_at))
          && periodKey(task.period, stamp(row.occurred_at)) === period && Number.isFinite(stamp(row.posted_at))
          && stamp(row.occurred_at) <= stamp(row.posted_at) && stamp(row.posted_at) <= now;
      }
      function inspect(ctx) {
        try {
          const session = ctx.applicationContext?.(), account = session?.accountRef, registration = ctx.memberCreatedAt;
          const app = JSON.parse(localStorage.getItem(APP_KEY) || "null");
          const parsed = JSON.parse(localStorage.getItem(storageKey) || "null"), data = parsed === null ? {} : parsed;
          const records = JSON.parse(localStorage.getItem(RECORDS_KEY) || "[]"), now = Date.now(), registered = stamp(registration);
          const legacy = registration === "" && ctx.newMember !== true && app?.newMember !== true;
          if (!object(app) || !object(data) || !Array.isArray(records) || session?.signedIn !== true
            || typeof account !== "string" || !account.trim() || !legacy && (!Number.isFinite(registered) || registered > now)
            || app.signedIn !== true || app.authVerified !== true || (app.authPhone || app.authForm?.phone) !== account
            || (app.memberCreatedAt || "") !== registration || app.accountDeletionStatus && app.accountDeletionStatus !== "ready"
            || app.nightHistory != null && !Array.isArray(app.nightHistory)) return { ok: false, pending: [] };
          if (legacy) {
            const owners = [data.accountRef, data.memberAssets?.accountRef].filter(value => value !== undefined);
            if (!object(data.memberAssets) || !owners.length || owners.some(owner => owner !== account)
              || [data.registrationId, data.memberAssets.registrationId].some(value => value !== undefined && value !== "")) return { ok: false, pending: [] };
          }
          const candidates = [...records.map(row => ({ row, taskId: "monthly-review", occurredAt: row?.occurredAt })),
            ...(app.nightHistory || []).map(row => ({ row, taskId: "night-repair", occurredAt: row?.endedAt }))];
          const evidenceByReward = new Map();
          for (const { row, taskId, occurredAt } of candidates) {
            const evidence = row?.memberTaskEvidence, task = tasks[taskId], occurred = stamp(evidence?.occurredAt);
            if (!object(row) || !row.id || !object(evidence) || !object(task) || !["today", "week", "month"].includes(task.period)
              || !integer(task.points) || task.points === 0 || !integer(task.growth)
              || evidence.taskId !== taskId || evidence.accountRef !== account || evidence.registrationId !== registration
              || evidence.verified !== true || evidence.hardwareActive !== true || evidence.occurredAt !== occurredAt
              || !Number.isFinite(occurred) || Number.isFinite(registered) && occurred < registered || occurred > now || day(now) - day(occurred) > 7
              || !belongs(row, account, registration) || row.ownerAccount && row.ownerAccount !== account) continue;
            if (taskId === "monthly-review" && (row.source !== "user-record" || !/^\d{4}-(?:0[1-9]|1[0-2])$/.test(row.reportMonth))) continue;
            if (taskId === "night-repair" && (row.ownerAccount !== account || row.status !== "ended"
              || row.taskVerification !== "eligible-prototype" || row.skipped || row.hardwareEligibleAtStart !== true
              || row.personalized !== true || row.memberRegistrationId !== registration || !Number.isFinite(stamp(row.startedAt)) || Number.isFinite(registered) && stamp(row.startedAt) < registered
              || stamp(row.startedAt) > occurred || !Number.isFinite(row.duration) || row.duration <= 0
              || !Number.isFinite(row.positionSeconds) || row.positionSeconds < row.duration * 60)) continue;
            const clean = { taskId, accountRef: account, registrationId: registration, occurredAt, verified: true, hardwareActive: true };
            // Multiple saved records in one UTC+8 period represent one reward.
            const id = rewardId(clean), prior = evidenceByReward.get(id);
            if (!prior || occurred < stamp(prior.occurredAt)) evidenceByReward.set(id, clean);
          }
          const evidence = [...evidenceByReward.values()].sort((a, b) => stamp(a.occurredAt) - stamp(b.occurredAt));
          return { ok: true, account, registration, data, evidence, now, pending: evidence.filter(item => !recorded(data, item, now)) };
        } catch { return { ok: false, pending: [] }; }
      }
      function pending(ctx) { return inspect(ctx).pending; }
      function retry(ctx) {
        const initial = inspect(ctx);
        if (!initial.ok || typeof complete !== "function") return Promise.resolve(false);
        const scope = `${initial.account}|${initial.registration}`;
        if (running) return running.scope === scope ? running.promise : Promise.resolve(false);
        const operation = { scope, promise: null };
        running = operation;
        operation.promise = (async () => {
          for (const evidence of initial.pending) {
            const current = inspect(ctx);
            if (!current.ok || current.account !== initial.account || current.registration !== initial.registration) return false;
            const source = current.evidence.find(item => rewardId(item) === rewardId(evidence));
            if (!source) return false;
            if (recorded(current.data, source, current.now)) continue;
            const posted = await complete({ ...source, memberCreatedAt: source.registrationId, newMember: ctx.newMember === true });
            const saved = inspect(ctx);
            if (posted !== true || !saved.ok || saved.account !== initial.account || saved.registration !== initial.registration
              || !recorded(saved.data, source, saved.now)) return false;
          }
          const final = inspect(ctx);
          return final.ok && final.account === initial.account && final.registration === initial.registration && final.pending.length === 0;
        })().catch(() => false).finally(() => { if (running === operation) running = null; });
        return operation.promise;
      }
      // Reading never awards, initializes assets, or removes evidence. Only the
      // explicit retry delegates an eligible saved fact to the locked writer.
      return { pending, retry };
    }
  };
})();
