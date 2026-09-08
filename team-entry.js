/* Separate build only. Allocate an isolated demo BEFORE any business storage. */
(() => {
  if (!/\/(?:index\.html)?$/.test(location.pathname)) return;
  const url = new URL(location.href);
  if (!url.searchParams.has('demo')) url.searchParams.set('demo', 'new');
  if (!url.searchParams.has('scene')) url.searchParams.set('scene', 'full');
  if (!url.hash) url.hash = url.searchParams.get('scene') === 'fresh' ? 'ONB-01' : 'TOD-01';
  history.replaceState(history.state, '', url);
})();
