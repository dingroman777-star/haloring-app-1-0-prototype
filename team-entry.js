/* Separate build only. Allocate an isolated demo BEFORE any business storage. */
(() => {
  if (!/\/(?:index\.html)?$/.test(location.pathname)) return;
  const url = new URL(location.href);
  url.searchParams.set('v', '6.6');
  if (!url.searchParams.has('demo')) url.searchParams.set('demo', 'new');
  if (!url.searchParams.has('scene')) url.searchParams.set('scene', 'full');
  // Confirmed partner and academy UI is the default in this local team build.
  // Keep legacy flags for old bookmarks; callers no longer need to provide them.
  url.searchParams.set('partnerUI', 'review');
  url.searchParams.set('academyUI', 'review');
  if (!url.hash) url.hash = url.searchParams.get('scene') === 'fresh' ? 'ONB-01' : 'TOD-01';
  history.replaceState(history.state, '', url);
})();
