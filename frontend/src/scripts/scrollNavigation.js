/**
 * Scroll Navigation - Handles horizontal scroll container navigation buttons.
 *
 * Provides navigation buttons (prev/next arrows) for horizontal scroll containers,
 * enabling mouse-only users to navigate content that would otherwise require
 * a trackpad or horizontal scroll wheel.
 *
 * Features:
 * - Smart visibility: hides buttons at scroll boundaries
 * - No-overflow detection: hides buttons when content fits
 * - Smooth scrolling with prefers-reduced-motion support
 * - HTMX integration: reinitializes after content swaps
 *
 * Usage:
 *   import { initScrollNavigation } from './scrollNavigation.js';
 *   initScrollNavigation();
 */

/**
 * Scroll amount as a fraction of container width.
 * 0.8 = scroll 80% of visible width per click.
 */
const SCROLL_FRACTION = 0.8;

/**
 * Debounce delay for scroll event handling (ms).
 * Prevents excessive updates during continuous scrolling.
 */
const SCROLL_DEBOUNCE_MS = 50;

/**
 * Tolerance in pixels for boundary detection.
 * Accounts for sub-pixel rendering differences.
 */
const BOUNDARY_TOLERANCE = 2;

/**
 * Creates a debounced version of a function.
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Checks if reduced motion is preferred by the user.
 * @returns {boolean} True if reduced motion is preferred
 */
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Calculates the scroll amount based on container width.
 * @param {HTMLElement} container - The scroll container
 * @returns {number} Scroll amount in pixels
 */
function getScrollAmount(container) {
  return container.clientWidth * SCROLL_FRACTION;
}

/**
 * Determines if the container is at the start boundary.
 * @param {HTMLElement} container - The scroll container
 * @returns {boolean} True if at or near the start
 */
function isAtStart(container) {
  return container.scrollLeft <= BOUNDARY_TOLERANCE;
}

/**
 * Determines if the container is at the end boundary.
 * @param {HTMLElement} container - The scroll container
 * @returns {boolean} True if at or near the end
 */
function isAtEnd(container) {
  const maxScroll = container.scrollWidth - container.clientWidth;
  return container.scrollLeft >= maxScroll - BOUNDARY_TOLERANCE;
}

/**
 * Determines if the container has overflow (content wider than container).
 * @param {HTMLElement} container - The scroll container
 * @returns {boolean} True if content overflows
 */
function hasOverflow(container) {
  return container.scrollWidth > container.clientWidth + BOUNDARY_TOLERANCE;
}

/**
 * Updates the visibility state of navigation buttons.
 * Sets data attributes that CSS uses for styling.
 * @param {HTMLElement} container - The scroll container
 * @param {HTMLElement} nav - The navigation element
 */
function updateButtonStates(container, nav) {
  const prevBtn = nav.querySelector('[data-direction="prev"]');
  const nextBtn = nav.querySelector('[data-direction="next"]');

  // Check if content overflows
  if (!hasOverflow(container)) {
    nav.dataset.noOverflow = 'true';
    return;
  } else {
    nav.dataset.noOverflow = 'false';
  }

  // Update boundary states
  if (prevBtn) {
    prevBtn.dataset.atBoundary = isAtStart(container) ? 'true' : 'false';
  }
  if (nextBtn) {
    nextBtn.dataset.atBoundary = isAtEnd(container) ? 'true' : 'false';
  }
}

/**
 * Scrolls the container in the specified direction.
 * @param {HTMLElement} container - The scroll container
 * @param {'prev' | 'next'} direction - Scroll direction
 */
function scrollContainer(container, direction) {
  const amount = getScrollAmount(container);
  const scrollAmount = direction === 'prev' ? -amount : amount;

  container.scrollBy({
    left: scrollAmount,
    behavior: prefersReducedMotion() ? 'instant' : 'smooth'
  });
}

/**
 * Selectors for scrollable container elements.
 * Includes main scroll containers and filter button containers.
 */
const SCROLL_CONTAINER_SELECTORS = [
  '.scroll-container',
  '.scroll-container--always',
  '.date-filter-buttons',
  '.venue-filter-buttons'
].join(', ');

/**
 * Finds the navigation element for a scroll container.
 * Nav can be either a sibling (new layout) or child (legacy) of wrapper.
 * @param {HTMLElement} wrapper - The wrapper element
 * @returns {HTMLElement|null} The nav element or null
 */
function findNavForWrapper(wrapper) {
  // First check: nav as next sibling (new layout - buttons outside content)
  const nextSibling = wrapper.nextElementSibling;
  if (nextSibling?.classList.contains('scroll-nav')) {
    return nextSibling;
  }

  // Fallback: nav as child (legacy layout)
  return wrapper.querySelector('.scroll-nav');
}

/**
 * Sets up a single scroll container with navigation.
 * @param {HTMLElement} wrapper - The wrapper containing container and nav
 */
function setupScrollContainer(wrapper) {
  const container = wrapper.querySelector(SCROLL_CONTAINER_SELECTORS);
  const nav = findNavForWrapper(wrapper);

  if (!container || !nav) return;

  // Initial state update
  updateButtonStates(container, nav);

  // Debounced scroll handler
  const handleScroll = debounce(() => {
    updateButtonStates(container, nav);
  }, SCROLL_DEBOUNCE_MS);

  // Listen for scroll events
  container.addEventListener('scroll', handleScroll, { passive: true });

  // Listen for resize (container might gain/lose overflow)
  const resizeObserver = new ResizeObserver(() => {
    updateButtonStates(container, nav);
  });
  resizeObserver.observe(container);

  // Handle button clicks
  nav.addEventListener('click', (event) => {
    const button = event.target.closest('.scroll-nav__btn');
    if (!button) return;

    const direction = button.dataset.direction;
    if (direction === 'prev' || direction === 'next') {
      scrollContainer(container, direction);
    }
  });
}

/**
 * Initializes all scroll navigation containers on the page.
 * Should be called on page load and after HTMX content swaps.
 */
function initAllScrollContainers() {
  const wrappers = document.querySelectorAll('.scroll-container-wrapper');
  wrappers.forEach(setupScrollContainer);
}

/**
 * Waits for HTMX to be available on the window object.
 * @returns {Promise<boolean>} Resolves true if HTMX found, false if timeout
 */
function waitForHtmx() {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.htmx) {
      resolve(true);
      return;
    }

    let attempts = 0;
    const maxAttempts = 10;
    const baseDelay = 50;

    function checkHtmx() {
      attempts++;
      if (typeof window !== 'undefined' && window.htmx) {
        resolve(true);
        return;
      }
      if (attempts >= maxAttempts) {
        resolve(false);
        return;
      }
      setTimeout(checkHtmx, baseDelay + (attempts * 50));
    }

    setTimeout(checkHtmx, baseDelay);
  });
}

/**
 * Initializes scroll navigation.
 *
 * Sets up:
 * - Initial scroll containers on the page
 * - HTMX event listener to reinitialize after content swaps
 *
 * Call this once on page load.
 */
export async function initScrollNavigation() {
  // Initialize existing containers
  initAllScrollContainers();

  // Wait for HTMX and set up reinit on content swaps
  const htmxAvailable = await waitForHtmx();

  if (htmxAvailable) {
    // Reinitialize after HTMX swaps new content
    document.body.addEventListener('htmx:afterSettle', () => {
      initAllScrollContainers();
    });
  }
}
