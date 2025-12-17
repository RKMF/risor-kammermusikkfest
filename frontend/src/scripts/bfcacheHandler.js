/**
 * Handle bfcache restoration - refresh stale data on back/forward navigation
 *
 * When a user navigates back/forward, the browser may restore the page from
 * bfcache (back/forward cache) which preserves the exact page state. This can
 * show stale content if the user has been away for a while.
 *
 * This script checks the page's data timestamp and reloads if content is stale.
 */

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    // Page restored from bfcache - check data freshness
    const lastUpdate = document.querySelector('[data-last-update]');
    if (lastUpdate) {
      const updateTime = Date.parse(lastUpdate.dataset.lastUpdate);
      const staleThreshold = 5 * 60 * 1000; // 5 minutes

      if (Date.now() - updateTime > staleThreshold) {
        location.reload();
      }
    }
  }
});
