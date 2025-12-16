/**
 * Synchronizes filter button states and attributes with current URL parameters.
 *
 * This module handles URL-based filter state synchronization by updating three things:
 * 1. Active CSS classes (visual feedback)
 * 2. href attributes (for progressive enhancement)
 * 3. hx-vals attributes (for htmx combined filtering)
 *
 * This ensures that when users navigate using browser back/forward buttons or click
 * filter buttons, all button states and attributes remain synchronized with the URL.
 *
 * Usage:
 *   import { initializeFilterButtonStateSynchronization } from './syncFilterButtonStatesWithUrl.js';
 *   initializeFilterButtonStateSynchronization();
 */

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

/**
 * Detects the current page language from the URL path.
 * Returns 'en' for English pages (/en/*), 'no' for Norwegian pages.
 */
function getCurrentLanguage() {
  return window.location.pathname.startsWith('/en/') ? 'en' : 'no';
}

/**
 * Builds the href attribute for a filter button.
 * Ensures the button preserves the OTHER filter when clicked.
 */
function buildButtonHref(filterType, filterValue, currentFilters, language) {
  const basePath = language === 'en' ? '/en/program' : '/program';
  const params = new URLSearchParams();

  if (filterType === 'date') {
    // Date button: use this date, preserve current venue
    params.set('date', filterValue);
    params.set('venue', currentFilters.venue);
  } else if (filterType === 'venue') {
    // Venue button: preserve current date, use this venue
    params.set('date', currentFilters.date);
    params.set('venue', filterValue);
  }

  return `${basePath}?${params.toString()}`;
}

/**
 * Builds the hx-vals attribute for a filter button.
 * Ensures htmx requests include both date and venue parameters.
 */
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
}

/**
 * Synchronizes filter buttons with current URL parameters.
 * Updates three aspects of each button:
 * 1. Active CSS class (for visual feedback)
 * 2. href attribute (preserves other filter when clicked)
 * 3. hx-vals attribute (ensures htmx sends both filters)
 */
function syncFilterButtonsWithCurrentUrl() {
  const currentFilters = extractCurrentFilterParametersFromUrl();
  const language = getCurrentLanguage();

  // Find all filter buttons (both date and venue filters)
  const allFilterButtons = document.querySelectorAll('[data-filter-type][data-filter-value]');

  allFilterButtons.forEach((filterButton) => {
    const filterType = filterButton.dataset.filterType;
    const filterValue = filterButton.dataset.filterValue;

    // 1. Determine if this button should be active based on current URL params
    let shouldBeActive = false;

    if (filterType === 'date') {
      // Match button's date value with current URL date parameter
      shouldBeActive = filterValue === currentFilters.date;
    } else if (filterType === 'venue') {
      // Match button's venue value with current URL venue parameter
      shouldBeActive = filterValue === currentFilters.venue;
    }

    // 2. Update active class
    if (shouldBeActive) {
      filterButton.classList.add('active');
    } else {
      filterButton.classList.remove('active');
    }

    // 3. Update href attribute
    const newHref = buildButtonHref(filterType, filterValue, currentFilters, language);
    filterButton.setAttribute('href', newHref);

    // 4. Update hx-vals attribute
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
  // Listen for htmx history restoration events (browser back/forward buttons)
  document.body.addEventListener('htmx:historyRestore', () => {
    syncFilterButtonsWithCurrentUrl();
    syncAriaPressed();
  });

  // Listen for htmx request start (show loading state)
  document.body.addEventListener('htmx:request', () => {
    setLoadingAriaState(true);
  });

  // Listen for htmx content swaps (filter button clicks)
  // This fires after htmx updates the URL and completes the swap
  document.body.addEventListener('htmx:afterSettle', () => {
    syncFilterButtonsWithCurrentUrl();
    syncAriaPressed();
    setLoadingAriaState(false);
  });
}

/**
 * Waits for HTMX to be available on the window object.
 * Uses polling with exponential backoff, max 10 attempts over ~2 seconds.
 * @returns {Promise<boolean>} Resolves true if HTMX found, false if timeout
 */
function waitForHtmx() {
  return new Promise((resolve) => {
    // Check immediately
    if (typeof window !== 'undefined' && window.htmx) {
      resolve(true);
      return;
    }

    let attempts = 0;
    const maxAttempts = 10;
    const baseDelay = 50; // Start with 50ms

    function checkHtmx() {
      attempts++;
      if (typeof window !== 'undefined' && window.htmx) {
        resolve(true);
        return;
      }
      if (attempts >= maxAttempts) {
        console.warn('HTMX not found after waiting. Filter sync will use fallback mode.');
        resolve(false);
        return;
      }
      // Exponential backoff: 50, 100, 150, 200...
      setTimeout(checkHtmx, baseDelay + (attempts * 50));
    }

    setTimeout(checkHtmx, baseDelay);
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
 *
 * Waits for HTMX to be available before setting up listeners.
 */
export async function initializeFilterButtonStateSynchronization() {
  // Perform initial sync immediately (doesn't need HTMX)
  // This handles bookmarked/shared URLs
  syncFilterButtonsWithCurrentUrl();

  // Wait for HTMX to be available before setting up event listeners
  const htmxAvailable = await waitForHtmx();

  if (htmxAvailable) {
    setupHtmxEventListeners();
  } else {
    // Fallback: Listen for popstate for back/forward navigation
    // This provides basic functionality even without HTMX events
    window.addEventListener('popstate', () => {
      syncFilterButtonsWithCurrentUrl();
      syncAriaPressed();
    });
  }
}
