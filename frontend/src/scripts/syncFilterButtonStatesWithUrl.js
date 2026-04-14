/** Keep program filter buttons synchronized with the current URL and HTMX state. */

/**
 * Extracts current filter parameters from the URL query string.
 * Returns empty strings for missing parameters.
 */
function extractCurrentFilterParametersFromUrl() {
  const urlSearchParams = new URLSearchParams(window.location.search);
  return {
    date: urlSearchParams.get('date') || '',
    venue: urlSearchParams.get('venue') || ''
  };
}

function getCurrentLanguage() {
  return window.location.pathname.startsWith('/en/') ? 'en' : 'no';
}

function buildButtonHref(filterType, filterValue, currentFilters, language) {
  const basePath = language === 'en' ? '/en/program' : '/program';
  const params = new URLSearchParams();

  params.set('lang', language);

  if (filterType === 'date') {
    params.set('date', filterValue);
    params.set('venue', currentFilters.venue);
  } else if (filterType === 'venue') {
    params.set('date', currentFilters.date);
    params.set('venue', filterValue);
  }

  return `${basePath}?${params.toString()}`;
}

function buildButtonHxVals(filterType, filterValue, currentFilters, language) {
  if (filterType === 'date') {
    return {
      lang: language,
      date: filterValue,
      venue: currentFilters.venue
    };
  } else if (filterType === 'venue') {
    return {
      lang: language,
      date: currentFilters.date,
      venue: filterValue
    };
  }
  return { lang: language, date: '', venue: '' };
}

/**
 * Synchronizes filter buttons with current URL parameters.
 * Updates three aspects of each button:
 * 1. Active CSS class (for visual feedback)
 * 2. href attribute (for progressive enhancement fallback)
 * 3. hx-vals attribute (for HTMX AJAX requests - must be updated due to HTMX caching)
 */
function syncFilterButtonsWithCurrentUrl() {
  const currentFilters = extractCurrentFilterParametersFromUrl();
  const language = getCurrentLanguage();

  const allFilterButtons = document.querySelectorAll('[data-filter-type][data-filter-value]');

  allFilterButtons.forEach((filterButton) => {
    const filterType = filterButton.dataset.filterType;
    const filterValue = filterButton.dataset.filterValue;

    let shouldBeActive = false;

    if (filterType === 'date') {
      shouldBeActive = filterValue === currentFilters.date;
    } else if (filterType === 'venue') {
      shouldBeActive = filterValue === currentFilters.venue;
    }

    if (shouldBeActive) {
      filterButton.classList.add('active');
    } else {
      filterButton.classList.remove('active');
    }

    const newHref = buildButtonHref(filterType, filterValue, currentFilters, language);
    filterButton.setAttribute('href', newHref);

    // HTMX caches attribute values, so keep hx-vals aligned with the current URL state.
    const newHxVals = buildButtonHxVals(filterType, filterValue, currentFilters, language);
    filterButton.setAttribute('hx-vals', JSON.stringify(newHxVals));
  });
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
      isPressed = filterValue === currentFilters.date;
    } else if (filterType === 'venue') {
      isPressed = filterValue === currentFilters.venue;
    }

    button.setAttribute('aria-pressed', isPressed ? 'true' : 'false');
  });
}

/**
 * Sets up all HTMX event listeners for filter synchronization.
 * Called once HTMX is confirmed to be available.
 */
function setupHtmxEventListeners() {
  // Intercept requests before send so both filters survive each click reliably.
  document.body.addEventListener('htmx:configRequest', (event) => {
    const triggerElement = event.detail.elt;

    if (!triggerElement.dataset || !triggerElement.dataset.filterType) return;

    const filterType = triggerElement.dataset.filterType;
    const filterValue = triggerElement.dataset.filterValue;
    const currentFilters = extractCurrentFilterParametersFromUrl();
    const language = getCurrentLanguage();

    if (filterType === 'date') {
      event.detail.parameters.lang = language;
      event.detail.parameters.date = filterValue;
      event.detail.parameters.venue = currentFilters.venue;
    } else if (filterType === 'venue') {
      event.detail.parameters.lang = language;
      event.detail.parameters.date = currentFilters.date;
      event.detail.parameters.venue = filterValue;
    }
  });

  document.body.addEventListener('htmx:historyRestore', () => {
    syncFilterButtonsWithCurrentUrl();
    syncAriaPressed();
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
    syncFilterButtonsWithCurrentUrl();
    syncAriaPressed();
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
  syncFilterButtonsWithCurrentUrl();
  syncAriaPressed();

  setupHtmxEventListeners();

  window.addEventListener('popstate', () => {
    syncFilterButtonsWithCurrentUrl();
    syncAriaPressed();
    setLoadingAriaState(false);
  });
}
