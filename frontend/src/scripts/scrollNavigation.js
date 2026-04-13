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
 * Resolves which stepping strategy a wrapper should use.
 * Defaults to item-based movement for content carousels.
 * @param {HTMLElement} wrapper - The wrapper containing container and nav
 * @returns {'item' | 'page'} Step strategy
 */
function getStepMode(wrapper) {
  return wrapper.dataset.scrollStep === 'page' ? 'page' : 'item';
}

/**
 * Resolves scroll snap items inside a container.
 * Handles wrappers that use display: contents on intermediate list items.
 * @param {HTMLElement} container - The scroll container
 * @returns {HTMLElement[]} Concrete scroll targets
 */
function getScrollItems(container) {
  return Array.from(container.children)
    .map((child) => {
      if (!(child instanceof HTMLElement)) return null;

      if (window.getComputedStyle(child).display === 'contents') {
        return child.firstElementChild instanceof HTMLElement ? child.firstElementChild : null;
      }

      return child;
    })
    .filter((item, index, items) => item && items.indexOf(item) === index);
}

/**
 * Computes an item's left scroll position relative to its scroll container.
 * @param {HTMLElement} container - The scroll container
 * @param {HTMLElement} item - The target item
 * @returns {number} ScrollLeft value needed to align the item to the start edge
 */
function getItemStart(container, item) {
  const containerRect = container.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();
  return itemRect.left - containerRect.left + container.scrollLeft;
}

/**
 * Clamps a target scroll position to the container's scrollable range.
 * @param {HTMLElement} container - The scroll container
 * @param {number} position - Desired scroll position
 * @returns {number} Valid scroll position
 */
function clampScrollPosition(container, position) {
  const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
  return Math.min(Math.max(position, 0), maxScroll);
}

/**
 * Finds the index of the item currently anchored at or just before the viewport start.
 * @param {HTMLElement} container - The scroll container
 * @param {HTMLElement[]} items - Candidate snap items
 * @returns {number} Active item index
 */
function getActiveItemIndex(container, items) {
  const currentScroll = container.scrollLeft;
  let activeIndex = 0;

  items.forEach((item, index) => {
    const itemStart = clampScrollPosition(container, getItemStart(container, item));
    if (itemStart <= currentScroll + BOUNDARY_TOLERANCE) {
      activeIndex = index;
    }
  });

  return activeIndex;
}

/**
 * Updates the visibility state of navigation buttons.
 * Sets data attributes that CSS uses for styling.
 * @param {HTMLElement} container - The scroll container
 * @param {HTMLElement} nav - The navigation element
 * @param {'item' | 'page'} stepMode - Step strategy for this carousel
 * @param {HTMLElement[]} items - Concrete scroll targets
 */
function updateButtonStates(container, nav, stepMode, items = []) {
  const prevBtn = nav.querySelector('[data-direction="prev"]');
  const nextBtn = nav.querySelector('[data-direction="next"]');

  // Check if content overflows
  if (!hasOverflow(container)) {
    nav.dataset.noOverflow = 'true';
    return;
  } else {
    nav.dataset.noOverflow = 'false';
  }

  if (stepMode === 'item' && items.length > 0) {
    const activeIndex = getActiveItemIndex(container, items);
    const lastIndex = items.length - 1;
    const lastItemStart = clampScrollPosition(container, getItemStart(container, items[lastIndex]));

    if (prevBtn) {
      prevBtn.dataset.atBoundary = activeIndex <= 0 && isAtStart(container) ? 'true' : 'false';
    }
    if (nextBtn) {
      nextBtn.dataset.atBoundary =
        activeIndex >= lastIndex || container.scrollLeft >= lastItemStart - BOUNDARY_TOLERANCE
          ? 'true'
          : 'false';
    }
    return;
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
 * @param {'item' | 'page'} stepMode - Step strategy for this carousel
 * @param {HTMLElement[]} items - Concrete scroll targets
 */
function scrollContainer(container, direction, stepMode, items = []) {
  const behavior = prefersReducedMotion() ? 'instant' : 'smooth';

  if (stepMode === 'item' && items.length > 0) {
    const activeIndex = getActiveItemIndex(container, items);
    const targetIndex =
      direction === 'prev'
        ? Math.max(0, activeIndex - 1)
        : Math.min(items.length - 1, activeIndex + 1);
    const targetPosition = clampScrollPosition(container, getItemStart(container, items[targetIndex]));

    container.scrollTo({
      left: targetPosition,
      behavior,
    });
    return;
  }

  const scrollAmount = container.clientWidth * 0.8 * (direction === 'prev' ? -1 : 1);
  container.scrollBy({
    left: scrollAmount,
    behavior,
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
  if (wrapper.dataset.scrollNavInitialized === 'true') return;

  const container = wrapper.querySelector(SCROLL_CONTAINER_SELECTORS);
  const nav = findNavForWrapper(wrapper);

  if (!container || !nav) return;

  wrapper.dataset.scrollNavInitialized = 'true';
  const stepMode = getStepMode(wrapper);
  const getItems = () => getScrollItems(container);

  // Initial state update
  updateButtonStates(container, nav, stepMode, getItems());

  // Debounced scroll handler
  const handleScroll = debounce(() => {
    updateButtonStates(container, nav, stepMode, getItems());
  }, SCROLL_DEBOUNCE_MS);

  // Listen for scroll events
  container.addEventListener('scroll', handleScroll, { passive: true });

  // Listen for resize (container might gain/lose overflow)
  const resizeObserver = new ResizeObserver(() => {
    updateButtonStates(container, nav, stepMode, getItems());
  });
  resizeObserver.observe(container);

  // Handle button clicks
  nav.addEventListener('click', (event) => {
    const button = event.target.closest('.scroll-nav__btn');
    if (!button) return;

    const direction = button.dataset.direction;
    if (direction === 'prev' || direction === 'next') {
      scrollContainer(container, direction, stepMode, getItems());
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
 * Initializes scroll navigation.
 *
 * Sets up:
 * - Initial scroll containers on the page
 * - HTMX event listener to reinitialize after content swaps
 *
 * Call this once on page load.
 */
export function initScrollNavigation() {
  // Initialize existing containers
  initAllScrollContainers();

  // Reinitialize after HTMX swaps new content
  document.body.addEventListener('htmx:afterSettle', () => {
    initAllScrollContainers();
  });
}
