/** Horizontal scroll navigation for carousels and filter rows. */

const SCROLL_DEBOUNCE_MS = 50;

const BOUNDARY_TOLERANCE = 2;

const MAX_SNAP_TARGET_TOLERANCE = 24;

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
 * Gets the maximum usable scrollLeft value for a container.
 * @param {HTMLElement} container - The scroll container
 * @returns {number} Maximum scrollLeft value
 */
function getMaxScroll(container) {
  return Math.max(0, container.scrollWidth - container.clientWidth);
}

/** Resolve whether a wrapper scrolls by item or by page width. */
function getStepMode(wrapper) {
  return wrapper.dataset.scrollStep === 'page' ? 'page' : 'item';
}

/** Resolve concrete scroll targets, including wrappers that use `display: contents`. */
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
  return Math.min(Math.max(position, 0), getMaxScroll(container));
}

/**
 * Resolves unique item start positions within the scrollable range.
 * @param {HTMLElement} container - The scroll container
 * @param {HTMLElement[]} items - Candidate snap items
 * @returns {number[]} Sorted scroll target positions
 */
function getItemTargets(container, items) {
  const targets = items
    .map((item) => Math.round(clampScrollPosition(container, getItemStart(container, item))))
    .sort((a, b) => a - b);

  return targets.filter((target, index) => index === 0 || target > targets[index - 1] + BOUNDARY_TOLERANCE);
}

/**
 * Finds the closest target to the current scroll position.
 * @param {number[]} targets - Sorted scroll target positions
 * @param {number} currentScroll - Current scrollLeft value
 * @returns {{ index: number, distance: number }} Closest target metadata
 */
function getClosestTarget(targets, currentScroll) {
  return targets.reduce(
    (closest, target, index) => {
      const distance = Math.abs(target - currentScroll);
      return distance < closest.distance ? { index, distance } : closest;
    },
    { index: 0, distance: Number.POSITIVE_INFINITY },
  );
}

/**
 * Derives a snap tolerance from the actual target spacing.
 * @param {number[]} targets - Sorted scroll target positions
 * @returns {number} Pixel tolerance for treating current scroll as snapped
 */
function getSnapTargetTolerance(targets) {
  if (targets.length < 2) return BOUNDARY_TOLERANCE;

  const gaps = targets
    .slice(1)
    .map((target, index) => target - targets[index])
    .filter((gap) => gap > BOUNDARY_TOLERANCE);

  if (gaps.length === 0) return BOUNDARY_TOLERANCE;

  const averageGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  return Math.max(
    BOUNDARY_TOLERANCE,
    Math.min(MAX_SNAP_TARGET_TOLERANCE, averageGap * 0.1),
  );
}

/**
 * Selects the next scroll target without getting stuck near a snap point.
 * @param {number[]} targets - Sorted scroll target positions
 * @param {number} currentScroll - Current scrollLeft value
 * @param {'prev' | 'next'} direction - Scroll direction
 * @returns {number} Target scrollLeft value
 */
function getDirectionalTarget(targets, currentScroll, direction) {
  const closest = getClosestTarget(targets, currentScroll);
  const snapTargetTolerance = getSnapTargetTolerance(targets);

  if (closest.distance <= snapTargetTolerance) {
    const targetIndex = direction === 'prev'
      ? Math.max(0, closest.index - 1)
      : Math.min(targets.length - 1, closest.index + 1);
    return targets[targetIndex];
  }

  return direction === 'prev'
    ? [...targets].reverse().find((target) => target < currentScroll - BOUNDARY_TOLERANCE) ?? targets[0]
    : targets.find((target) => target > currentScroll + BOUNDARY_TOLERANCE) ?? targets[targets.length - 1];
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

  if (!hasOverflow(container)) {
    nav.dataset.noOverflow = 'true';
    return;
  } else {
    nav.dataset.noOverflow = 'false';
  }

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
    const currentScroll = container.scrollLeft;
    const targets = getItemTargets(container, items);
    const maxScroll = getMaxScroll(container);

    if (!targets.includes(0)) targets.unshift(0);
    if (!targets.some((target) => Math.abs(target - maxScroll) <= BOUNDARY_TOLERANCE)) {
      targets.push(maxScroll);
    }

    const targetPosition = getDirectionalTarget(targets, currentScroll, direction);

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

const SCROLL_CONTAINER_SELECTORS = [
  '.scroll-container',
  '.scroll-container--always',
  '.date-filter-buttons',
  '.venue-filter-buttons'
].join(', ');

function findNavForWrapper(wrapper) {
  // Prefer the current sibling layout, then fall back to the legacy nested one.
  const nextSibling = wrapper.nextElementSibling;
  if (nextSibling?.classList.contains('scroll-nav')) {
    return nextSibling;
  }

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
  const refreshButtonStates = () => {
    updateButtonStates(container, nav);
  };

  refreshButtonStates();

  const handleScroll = debounce(() => {
    refreshButtonStates();
  }, SCROLL_DEBOUNCE_MS);

  container.addEventListener('scroll', handleScroll, { passive: true });

  const resizeObserver = new ResizeObserver(() => {
    refreshButtonStates();
  });
  resizeObserver.observe(container);

  const mutationObserver = new MutationObserver(() => {
    refreshButtonStates();
  });
  mutationObserver.observe(container, {
    childList: true,
    subtree: true,
  });

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

export function initScrollNavigation() {
  initAllScrollContainers();

  document.body.addEventListener('htmx:afterSettle', () => {
    initAllScrollContainers();
  });
}
