/* TOD-04 is a route alias, not a second health-data view. */
(() => {
  window.createHaloBodyWeatherRouteCompat = ({ state, screen, validDate, today, model, render, go, persist, pages }) => {
    let pending = null, restoring = false;
    const canonical = id => id === 'TOD-04' ? 'TOD-03' : id;
    const owner = () => state.signedIn ? String(state.authPhone || state.authForm?.phone || 'legacy-session') : '';
    const validDay = date => typeof date === 'string' && validDate(date) && date <= today();
    const period = value => ['7','14','30'].includes(String(value)) ? String(value) : '7';
    const top = value => Number.isFinite(value) && value >= 0 ? value : 0;
    const mapTrail = trail => Array.isArray(trail) ? trail.map(canonical) : [];
    function legacy() {
      const view = state.bodyWeatherTrendView || {};
      // An existing dated TOD-03 choice wins over the retired page's shared period.
      const own = !view.owner || view.owner === owner();
      const hasCurrent = own && (validDay(view.date) || ['14','30'].includes(String(view.period)));
      state.bodyWeatherTrendView = { ...view, owner: owner(), period: period(hasCurrent ? view.period : state.trendPeriod), date: own && validDay(view.date) ? view.date : '' };
      pending = { anchor: true }; restoring = true;
      if (state.healthDetailContext?.route === 'TOD-04') {
        if (!state.bodyWeatherTrendView.date && validDay(state.healthDetailContext.date)) state.bodyWeatherTrendView.date = state.healthDetailContext.date;
        state.healthDetailContext = null;
      }
      for (const key of Object.keys(state.tabStacks || {})) {
        const mapped = mapTrail(state.tabStacks[key]);
        state.tabStacks[key] = mapped.filter((id, index) => !index || id !== mapped[index - 1]);
      }
      state.navigationHistory = mapTrail(state.navigationHistory);
      if (state.lastVisitedRoute === 'TOD-04') state.lastVisitedRoute = 'TOD-03';
      return 'TOD-03';
    }
    function snapshot() {
      const value = state.bodyWeatherTrendView || {};
      return { owner: owner(), period: period(value.period), date: validDay(value.date) ? value.date : '', recordsVisible: !!state.toggles.trendRecords,
        top: pending && !pending.anchor ? pending.top : screen.dataset.page === 'TOD-03' ? screen.scrollTop : top(state.pageViews?.['TOD-03']?.top) };
    }
    const historyFields = id => id === 'TOD-03' ? { bodyWeatherContext: snapshot() } : {};
    function capture() {
      if (restoring || state.current !== 'TOD-03' || screen.dataset.page !== 'TOD-03' || location.hash.toUpperCase() !== '#TOD-03' || history.state?.id !== 'TOD-03') return;
      history.replaceState({ ...history.state, ...historyFields('TOD-03') }, '', location.href);
    }
    function restore(id, context) {
      if (id !== 'TOD-03' || !context) return;
      if (context.owner !== owner()) { pending = { top: 0 }; restoring = true; return; }
      state.bodyWeatherTrendView = { ...state.bodyWeatherTrendView, owner: owner(), period: period(context.period), date: validDay(context.date) ? context.date : '' };
      if (typeof context.recordsVisible === 'boolean') state.toggles.trendRecords = context.recordsVisible;
      pending = { top: top(context.top) }; restoring = true;
    }
    function afterRender() {
      if (state.current !== 'TOD-03') { pending = null; restoring = false; return; }
      const data = model();
      if (data) state.bodyWeatherTrendView = { ...state.bodyWeatherTrendView, owner: owner(), period: String(data.days), date: data.selected.date };
      if (pending?.anchor) {
        const section = screen.querySelector('.bw-trend');
        if (section) {
          screen.scrollTop += section.getBoundingClientRect().top - screen.getBoundingClientRect().top - 12;
          const heading = section.querySelector('h2'); heading?.setAttribute('tabindex', '-1'); heading?.focus({ preventScroll: true });
        }
      } else if (pending) screen.scrollTop = pending.top;
      pending = null; restoring = false;
      if (state.pageViews?.['TOD-03']) state.pageViews['TOD-03'].top = screen.scrollTop;
    }
    function back() {
      if (state.current !== 'TOD-03') return false;
      capture(); persist();
      const trail = mapTrail(history.state?.trail);
      let index = trail.length - 2;
      while (index >= 0 && (trail[index] === 'TOD-03' || !pages.some(page => page.id === trail[index]))) index--;
      if (index >= 0) history.go(index - trail.length + 1);
      else go('TOD-01', false);
      return true;
    }
    window.addEventListener('popstate', () => {
      if (state.current === 'TOD-03' && location.hash.toUpperCase() === '#TOD-03') { restore('TOD-03', history.state?.bodyWeatherContext); render(); }
    });
    return { legacy, mapTrail, capture, restore, afterRender, historyFields, back };
  };
})();
