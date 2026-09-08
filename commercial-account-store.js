/* Account-scoped commercial projection. One localStorage write contains the
 * projection, archives and each transaction; production still needs server CAS. */
(() => {
  "use strict";
  const KEY = "haloV5CommercialProgress", APP = "haloV5AppProgress";
  const META = new Set(["__commercialScope", "__commercialAccounts", "__commercialQuarantine"]);
  const clone = value => value === undefined ? undefined : structuredClone(value);
  const object = value => value && typeof value === "object" && !Array.isArray(value);
  const equal = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  const channel = key => window.HALO_CHANNEL_STORE.isField(key);
  const project = value => Object.fromEntries(Object.entries(value || {}).filter(([key]) => !META.has(key) && !channel(key)).map(([key, item]) => [key, clone(item)]));
  const scopeKey = scope => JSON.stringify([scope.accountRef, scope.registrationId]);
  function session() {
    const app = JSON.parse(localStorage.getItem(APP) || "null");
    if (!app?.signedIn || !app.authVerified) return null;
    return { accountRef: String(app.authPhone || app.authForm?.phone || "local-demo"), registrationId: String(app.memberCreatedAt || "") };
  }
  function ownership(data) {
    if (object(data.__commercialScope)) {
      const scope = data.__commercialScope;
      if (typeof scope.accountRef !== "string" || typeof scope.registrationId !== "string" || [data.accountRef, data.memberAssets?.accountRef].some(value => value && value !== scope.accountRef) || [data.registrationId, data.memberAssets?.registrationId].some(value => value !== undefined && String(value || "") !== scope.registrationId)) return null;
      return scope;
    }
    const owners = [data.accountRef, data.memberAssets?.accountRef].filter(Boolean);
    const registrations = [data.registrationId, data.memberAssets?.registrationId].filter(value => value !== undefined && value !== null);
    if (!owners.length || owners.some(value => value !== owners[0]) || registrations.some(value => value !== registrations[0])) return null;
    return { accountRef: String(owners[0]), registrationId: String(registrations[0] || "") };
  }
  const same = (a, b) => Boolean(a && b && scopeKey(a) === scopeKey(b));
  function belongs(row, scope) {
    return object(row) && [row.accountRef, row.ownerAccount].every(value => !value || value === scope?.accountRef) && (row.registrationId === undefined || String(row.registrationId || "") === scope?.registrationId);
  }
  window.HALO_COMMERCIAL_ACCOUNT_STORE = {
    key: KEY, session, ownership, same, belongs,
    create(state, defaults) {
      let active = null, baseline = {}, unavailable = false, conflict = false;
      const fresh = scope => ({ ...project(defaults), cartLines: [], checkoutLines: [], cartSelection: {}, checkoutSources: {}, productSelections: {}, productMediaViews: {}, skuStockOverrides: {}, ordersListTops: {}, orderDetailViews: {}, afterSaleDrafts: {}, afterSaleReturnDrafts: {}, addressDrafts: {}, addressFieldErrors: {}, addressFormKey: null, addressNotice: "", pointsBalance: 0, pointsTransactions: [], vouchers: [], ownedCouponIds: [], memberAssets: null, pendingPointsCorrection: 0, couponSelected: false, pointsMode: "normal", accountRef: scope.accountRef, registrationId: scope.registrationId });
      function read() {
        const value = JSON.parse(localStorage.getItem(KEY) || "{}");
        if (!object(value)) throw new Error("Commercial storage unavailable");
        return value;
      }
      function scoped(data, scope) {
        const value = { ...fresh(scope), ...project(data) };
        if (!Array.isArray(value.cartLines)) value.cartLines = Number(value.cartCount) > 0 ? [{ productId: value.cartProductId, skuId: value.cartProductId === "mask" ? "mask-grey-standard" : null, quantity: Number(value.cartCount) }] : [];
        if (!Array.isArray(value.checkoutLines)) value.checkoutLines = Number(value.cartCount) > 0 ? [{ productId: value.checkoutProductId, skuId: value.checkoutProductId === "mask" ? "mask-grey-standard" : null, quantity: Number(value.cartCount) }] : [];
        if (value.checkoutOrigin === "cart" && !value.checkoutDraftOrderId && !Object.keys(value.checkoutSources || {}).length) value.checkoutSources = Object.fromEntries(value.checkoutLines.map(line => [line.skuId || `legacy-${line.productId}`, [{ ...line }]]));
        for (const key of ["orders", "addresses"]) value[key] = (Array.isArray(value[key]) ? value[key] : []).filter(row => belongs(row, scope));
        value.afterSales = (Array.isArray(value.afterSales) ? value.afterSales : []).filter(row => belongs(row, scope) && belongs(row.order, scope));
        if (!belongs(value.orderSnapshot, scope) || !value.orders.some(row => row.id === value.orderSnapshot?.id)) value.orderSnapshot = null;
        if (!belongs(value.afterSaleSnapshot, scope) || !value.afterSales.some(row => row.id === value.afterSaleSnapshot?.id)) value.afterSaleSnapshot = null;
        if (value.selectedAddress && typeof value.selectedAddress === "object" && !belongs(value.selectedAddress, scope)) value.selectedAddress = null;
        return value;
      }
      function replace(data, scope) {
        for (const key of Object.keys(state)) if (!META.has(key) && !channel(key)) delete state[key];
        Object.assign(state, scoped(data, scope));
        baseline = project(state); active = clone(scope); conflict = false;
      }
      function select() {
        let target;
        try {
          target = session();
          if (!target) {
            const changed = active !== null;
            replace({}, { accountRef: "", registrationId: "" }); active = null;
            unavailable = true; return changed;
          }
          const latest = read();
          let owner = ownership(latest);
          // Disposable standalone prototypes deliberately have no phone owner.
          if (!owner && target.accountRef === "local-demo") owner = target;
          if (!same(owner, target)) {
            const accounts = object(latest.__commercialAccounts) ? clone(latest.__commercialAccounts) : {};
            if (owner) accounts[scopeKey(owner)] = project(latest);
            const quarantine = clone(latest.__commercialQuarantine || []);
            if (!owner && Object.keys(project(latest)).length) quarantine.push(project(latest));
            const restored = object(accounts[scopeKey(target)]) ? accounts[scopeKey(target)] : fresh(target);
            // The active projection is the only active copy. An old archive must
            // never resurrect an asset deleted by a direct Points/member writer.
            delete accounts[scopeKey(target)];
            const legacyChannel = Object.fromEntries(Object.entries(latest).filter(([key]) => channel(key)));
            const next = { ...restored, ...legacyChannel, accountRef: target.accountRef, registrationId: target.registrationId, __commercialScope: target, __commercialAccounts: accounts, __commercialQuarantine: quarantine };
            localStorage.setItem(KEY, JSON.stringify(next));
            replace(next, target); unavailable = false; return true;
          }
          if (!same(active, target) || unavailable) { replace(latest, target); unavailable = false; return true; }
          unavailable = false; return false;
        } catch { unavailable = true; return false; }
      }
      function sync(data) {
        if (select() || unavailable) return;
        const latest = data || read();
        if (!same(ownership(latest) || (active?.accountRef === "local-demo" ? active : null), active)) return;
        const next = scoped(latest, active);
        for (const key of new Set([...Object.keys(baseline), ...Object.keys(next)])) {
          if (equal(state[key], baseline[key])) { state[key] = clone(next[key]); baseline[key] = clone(next[key]); }
        }
      }
      function stamp(row) { return { ...row, accountRef: active.accountRef, ownerAccount: active.accountRef, registrationId: active.registrationId }; }
      function commit() {
        try {
          const currentSession = session();
          if (unavailable || !same(currentSession, active)) return false;
          const latest = read(), owner = ownership(latest) || (active.accountRef === "local-demo" ? active : null);
          if (!same(owner, active)) return false;
          const proposed = project(state), durableState = scoped(latest, active), patch = {};
          for (const key of new Set([...Object.keys(baseline), ...Object.keys(proposed)])) {
            if (equal(proposed[key], baseline[key])) continue;
            const durable = Object.hasOwn(durableState, key) ? durableState[key] : baseline[key];
            if (!equal(durable, baseline[key]) && !equal(durable, proposed[key])) { conflict = true; return false; }
            patch[key] = clone(proposed[key]);
          }
          if (!Object.keys(patch).length) { sync(latest); return true; }
          for (const key of ["orders", "addresses"]) if (patch[key]) {
            if (patch[key].some(row => !belongs(row, active))) return false;
            patch[key] = patch[key].map(stamp);
          }
          if (patch.afterSales) {
            if (patch.afterSales.some(row => !belongs(row, active) || !belongs(row.order, active))) return false;
            patch.afterSales = patch.afterSales.map(row => ({ ...stamp(row), order: stamp(row.order) }));
          }
          if (patch.orderSnapshot) { if (!belongs(patch.orderSnapshot, active)) return false; patch.orderSnapshot = stamp(patch.orderSnapshot); }
          if (patch.afterSaleSnapshot) { if (!belongs(patch.afterSaleSnapshot, active) || !belongs(patch.afterSaleSnapshot.order, active)) return false; patch.afterSaleSnapshot = { ...stamp(patch.afterSaleSnapshot), order: stamp(patch.afterSaleSnapshot.order) }; }
          const quarantine = clone(latest.__commercialQuarantine || []);
          if (["orders", "addresses", "afterSales"].some(key => Array.isArray(latest[key]) && latest[key].some(row => !belongs(row, active) || key === "afterSales" && !belongs(row.order, active)))) quarantine.push(project(latest));
          const next = { ...latest, ...patch, accountRef: active.accountRef, registrationId: active.registrationId, __commercialScope: active, __commercialQuarantine: quarantine };
          localStorage.setItem(KEY, JSON.stringify(next));
          replace(next, active); unavailable = false; return true;
        } catch { return false; }
      }
      select();
      return { select, sync, commit, read, scope: () => clone(active), unavailable: () => unavailable, conflict: () => conflict, owns: row => !unavailable && same(session(), active) && belongs(row, active) };
    }
  };
})();
