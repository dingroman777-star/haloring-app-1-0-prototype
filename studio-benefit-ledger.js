(function () {
  "use strict";
  const DAY = 86400000;
  const object = value => value && typeof value === "object" && !Array.isArray(value);
  const integer = value => Number.isSafeInteger(value) && value >= 0;
  const stamp = value => typeof value === "string" && /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? Date.parse(value) : NaN;
  const day = value => Math.floor((value + 8 * 3600000) / DAY);
  const month = value => new Date(value + 8 * 3600000).toISOString().slice(0, 7);
  const copy = value => JSON.parse(JSON.stringify(value));
  const result = (status, reason, extra = {}) => ({ status, points: null, growth: null, offset: null, available: null, transactionId: null, occurred_at: null, posted_at: null, ...(reason ? { reason } : {}), ...extra });

  window.HALO_STUDIO_BENEFIT_LEDGER = {
    create({ state, storageKey, appStorageKey = "haloV5AppProgress", maybeUpgradeMember, storage = localStorage, now = () => Date.now() }) {
      function read() {
        try {
          const raw = storage.getItem(storageKey), appRaw = storage.getItem(appStorageKey), hardwareRaw = storage.getItem("membershipHardwareState");
          const stored = JSON.parse(raw), app = JSON.parse(appRaw);
          if (!object(stored) || !object(app) || !Array.isArray(stored.pointsTransactions) || !Array.isArray(stored.studioAwards)
            || !integer(stored.pointsBalance) || !integer(stored.pendingPointsCorrection)) return null;
          return { raw, appRaw, hardwareRaw, stored, app };
        } catch { return null; }
      }
      function context(args, source) {
        const { app, stored } = source;
        const account = String(app.authPhone || app.authForm?.phone || "local-demo");
        if (!args.accountRef || args.accountRef !== account || app.signedIn !== true || app.authVerified !== true
          || app.accountDeletionStatus && app.accountDeletionStatus !== "ready"
          || !args.eventId || !args.bookingId || !Number.isFinite(stamp(args.occurredAt))) return null;
        if (stored.memberAssets?.registrationId && stored.memberAssets.registrationId !== app.memberCreatedAt) return null;
        // A valid new App session cannot adopt a previous account's commercial assets.
        // Missing legacy ownership is not assigned here; explicit conflicting ownership fails closed.
        const owners = [stored.accountRef, stored.memberAssets?.accountRef,
          ...stored.studioAwards.map(row => row?.accountRef), ...stored.pointsTransactions.map(row => row?.accountRef)];
        if (owners.some(owner => typeof owner === "string" && owner.trim() && owner !== account)) return null;
        const record = app.studioRecords?.[args.eventId], snapshot = record?.completionSnapshot;
        if (!record || record.bookingId !== args.bookingId || record.eventId && record.eventId !== args.eventId
          || record.accountRef && record.accountRef !== account || record.sessionAccountRef && record.sessionAccountRef !== account) return null;
        if (record.eventSnapshot?.id && record.eventSnapshot.id !== args.eventId || record.eventSnapshot?.eventId && record.eventSnapshot.eventId !== args.eventId
          || record.sessionScope && (record.sessionScope.eventId !== args.eventId || record.sessionScope.bookingId !== args.bookingId)) return null;
        if (snapshot && (snapshot.accountRef !== account || snapshot.eventId !== args.eventId || snapshot.bookingId !== args.bookingId
          || snapshot.completedAt !== args.occurredAt || record.completedAt !== args.occurredAt
          || snapshot.sessionId !== (record.sessionId || null) || typeof snapshot.hardwareActive !== "boolean")) return null;
        return { account, record, snapshot, occurred: stamp(args.occurredAt), id: `studio:${args.bookingId}:reward` };
      }
      function evaluate(args, source) {
        const scope = context(args, source);
        if (!scope) return result("unavailable", "invalid-scope");
        const { stored, app } = source, { record, snapshot, occurred, id, account } = scope;
        const transaction = stored.pointsTransactions.find(row => row?.id === id);
        const receipt = stored.studioAwards.find(row => row?.transactionId === id || row?.bookingId === args.bookingId);
        const base = { transactionId: id, occurred_at: args.occurredAt };
        if (transaction || receipt) {
          const txMatches = transaction && transaction.bookingId === args.bookingId && transaction.eventId === args.eventId
            && (!transaction.accountRef || transaction.accountRef === account) && transaction.occurred_at === args.occurredAt;
          const receiptMatches = receipt && receipt.version === 1 && receipt.accountRef === account && receipt.eventId === args.eventId
            && receipt.bookingId === args.bookingId && receipt.occurred_at === args.occurredAt && receipt.transactionId === id;
          const knownPoints = txMatches && integer(transaction.amount) ? transaction.amount : null;
          if (!snapshot || !txMatches || !receiptMatches || !integer(receipt.points) || !integer(receipt.growth) || !integer(receipt.offset)
            || !integer(receipt.available) || receipt.points !== transaction.amount || receipt.offset !== transaction.offset
            || receipt.available !== receipt.points - receipt.offset || receipt.posted_at !== transaction.posted_at) {
            return result("review", "legacy-receipt-incomplete", { ...base, legacy: true, points: knownPoints, posted_at: txMatches ? transaction.posted_at || null : null });
          }
          const reversed = stored.pointsTransactions.some(row => row?.correction === true && row.amount < 0
            && [row.reversal_of, row.reversalOf, row.original_transaction_id, row.originalTransactionId, row.source_transaction_id, row.sourceTransactionId].includes(id));
          return result(reversed ? "review" : "posted", reversed ? "reward-adjusted" : record.refundStatus && record.refundStatus !== "none" ? "refund-review" : receipt.reason,
            { ...base, points: receipt.points, growth: receipt.growth, offset: receipt.offset, available: receipt.available, posted_at: receipt.posted_at });
        }
        if (!snapshot) return result("pending", "completion-snapshot-unavailable", base);
        if (!Number.isFinite(occurred) || occurred > now()) return result("unavailable", "invalid-completion-time", base);
        if (!record.sessionDone || !record.booked || !record.paid || args.completed === false || args.paid === false) return result("pending", "completion-pending", base);
        if (record.refundStatus && record.refundStatus !== "none" || ["submitting", "accepted", "checking", "unknown"].includes(record.refundRequest?.status)
          || ["processing", "checking", "unknown"].includes(record.paymentRequest?.status)) return result("review", "refund-or-payment-review", base);
        if (day(now()) - day(occurred) > 7) return result("review", "expired-backfill", base);
        if (args.verified !== true) return result("pending", "verification-pending", base);
        const period = month(occurred), visits = new Set();
        stored.studioAwards.forEach(row => {
          const at = stamp(row?.occurred_at || row?.occurredAt);
          if (row?.bookingId && (Number.isFinite(at) ? month(at) === period : row.month === period)) visits.add(row.bookingId);
        });
        stored.pointsTransactions.forEach(row => {
          const at = stamp(row?.occurred_at || row?.posted_at);
          if (/^studio:.*:reward$/.test(row?.id || "") && Number.isFinite(at) && month(at) === period) visits.add(row.bookingId || row.id.slice(7, -7));
        });
        if (visits.size >= 4) return result("capped", "studio-monthly-limit", { ...base, points: 0, growth: 0, offset: 0, available: 0 });
        const earned = stored.pointsTransactions.reduce((sum, row) => {
          const at = stamp(row?.occurred_at || row?.posted_at);
          return /^(task|studio):/.test(row?.id || "") && Number.isFinite(at) && month(at) === period && Number.isSafeInteger(row.amount) ? sum + row.amount : sum;
        }, 0);
        const points = Math.min(100, Math.max(0, 2000 - earned)), growth = snapshot.hardwareActive ? 40 : 0;
        const offset = Math.min(points, stored.pendingPointsCorrection);
        if (growth && (!object(stored.memberAssets) || !integer(stored.memberAssets.growth)
          || typeof stored.memberAssets.level !== "string" || !/L[1-6]/.test(stored.memberAssets.level))) {
          // Never manufacture a legacy level or reset another account's assets.
          return result("review", "member-assets-unavailable", base);
        }
        return result("eligible", points < 100 ? "regular-points-limit" : !growth ? "no-hardware-at-completion" : null,
          { ...base, points, growth, offset, available: points - offset });
      }
      function get(args = {}) {
        const source = read();
        if (!source) return result("unavailable", "storage-unavailable");
        const answer = evaluate(args, source);
        // Refresh stale commercial memory only from a successfully read durable record.
        Object.assign(state, copy(source.stored));
        return answer;
      }
      function post(args = {}) {
        const source = read();
        if (!source) return result("unavailable", "storage-unavailable");
        const answer = evaluate(args, source);
        if (answer.status !== "eligible") {
          if (answer.status === "posted") Object.assign(state, copy(source.stored));
          return answer;
        }
        const candidate = copy(source.stored), at = new Date(now()).toISOString();
        const expiry = new Date(at); expiry.setUTCMonth(expiry.getUTCMonth() + 24);
        const receipt = { version: 1, accountRef: args.accountRef, eventId: args.eventId, bookingId: args.bookingId,
          month: month(stamp(args.occurredAt)), transactionId: answer.transactionId, occurred_at: args.occurredAt, occurredAt: args.occurredAt,
          posted_at: at, points: answer.points, growth: answer.growth, offset: answer.offset, available: answer.available, reason: answer.reason || null };
        candidate.pointsTransactions.unshift({ id: answer.transactionId, accountRef: args.accountRef, eventId: args.eventId, bookingId: args.bookingId,
          title: "Halo Studio 已核验课程", detail: `完成确认 · ${answer.points} Points`, amount: answer.points, offset: answer.offset,
          occurred_at: args.occurredAt, posted_at: at, expires_at: expiry.toISOString() });
        candidate.studioAwards.push(receipt);
        candidate.pointsBalance += answer.available;
        candidate.pendingPointsCorrection -= answer.offset;
        candidate.pointsMode = candidate.pendingPointsCorrection > 0 ? "pending" : candidate.pointsMode === "pending" ? "normal" : candidate.pointsMode;
        if (answer.growth) {
          candidate.memberAssets.growth += answer.growth;
          // Occurrence eligibility grants growth; current binding separately gates upgrades.
          if (source.hardwareRaw === "active" && typeof maybeUpgradeMember === "function") {
            try { candidate.memberAssets = maybeUpgradeMember(candidate.memberAssets, true); }
            catch { return result("review", "member-assets-unavailable"); }
          }
        }
        try {
          // Local optimistic conflict check; production requires a server-side idempotent transaction.
          if (storage.getItem(storageKey) !== source.raw || storage.getItem(appStorageKey) !== source.appRaw || storage.getItem("membershipHardwareState") !== source.hardwareRaw) return result("review", "source-changed");
          storage.setItem(storageKey, JSON.stringify(candidate));
        } catch { return result("unavailable", "save-failed"); }
        Object.assign(state, candidate);
        return { ...answer, status: "posted", posted_at: at };
      }
      return { get, post };
    },
  };
})();
