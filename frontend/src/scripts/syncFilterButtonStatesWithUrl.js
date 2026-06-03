import { initProgramFilterDragScroll } from './programFilterDragScroll.js';

/** Keep program filter buttons synchronized with the current URL and HTMX state. */

/**
 * Extracts current filter parameters from the URL query string.
 * Returns arrays for multi-select filters.
 */
function extractCurrentFilterParametersFromUrl() {
  const urlSearchParams = new URLSearchParams(window.location.search);
  return {
    dates: Array.from(new Set(urlSearchParams.getAll('date'))),
    venues: Array.from(new Set(urlSearchParams.getAll('venue')))
  };
}

/**
 * Updates aria-busy attribute on the loading indicator.
 * Helps screen readers announce loading state changes.
 */
function setLoadingAriaState(isBusy) {
  const loading = document.getElementById('filter-loading');
  if (loading) {
    loading.setAttribute('aria-busy', isBusy ? 'true' : 'false');
  }
}

/**
 * Updates aria-pressed attribute on filter buttons after htmx swap.
 * Ensures screen readers announce correct active state.
 */
function syncAriaPressed() {
  const currentFilters = extractCurrentFilterParametersFromUrl();
  const allFilterButtons = document.querySelectorAll('[data-filter-type][data-filter-value]');

  allFilterButtons.forEach((button) => {
    const filterType = button.dataset.filterType;
    const filterValue = button.dataset.filterValue;

    let isPressed = false;
    if (filterType === 'date') {
      isPressed = filterValue ? currentFilters.dates.includes(filterValue) : currentFilters.dates.length === 0;
    } else if (filterType === 'venue') {
      isPressed = filterValue ? currentFilters.venues.includes(filterValue) : currentFilters.venues.length === 0;
    } else if (filterType === 'reset') {
      isPressed = currentFilters.dates.length === 0 && currentFilters.venues.length === 0;
    }

    button.setAttribute('aria-pressed', isPressed ? 'true' : 'false');
  });
}

/**
 * Sets up all HTMX event listeners for filter synchronization.
 * Called once HTMX is confirmed to be available.
 */
function setupHtmxEventListeners() {
  document.body.addEventListener('htmx:historyRestore', () => {
    syncAriaPressed();
    initProgramFilterDragScroll();
  });

  document.body.addEventListener('htmx:beforeRequest', () => {
    setLoadingAriaState(true);
  });

  document.body.addEventListener('htmx:afterRequest', () => {
    setLoadingAriaState(false);
  });

  document.body.addEventListener('htmx:responseError', () => {
    setLoadingAriaState(false);
  });

  document.body.addEventListener('htmx:afterSettle', () => {
    syncAriaPressed();
    initProgramFilterDragScroll();
    setLoadingAriaState(false);
  });
}

/**
 * Initializes filter button state synchronization.
 *
 * Sets up event listeners for:
 * - htmx history restoration (back/forward navigation)
 * - htmx content swaps (filter button clicks)
 * - htmx request lifecycle (loading states)
 * - initial page load (bookmarked/shared URLs)
 */
export function initializeFilterButtonStateSynchronization() {
  syncAriaPressed();
  initProgramFilterDragScroll();

  setupHtmxEventListeners();

  window.addEventListener('popstate', () => {
    syncAriaPressed();
    initProgramFilterDragScroll();
    setLoadingAriaState(false);
  });
}
