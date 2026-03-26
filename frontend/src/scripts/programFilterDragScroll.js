const FILTER_ROW_SELECTOR = '.date-filter-buttons, .venue-filter-buttons';
const DRAG_THRESHOLD_PX = 6;

function setupDragScroll(container) {
  if (container.dataset.dragScrollInitialized === 'true') return;
  container.dataset.dragScrollInitialized = 'true';

  let startX = 0;
  let startScrollLeft = 0;
  let dragged = false;

  const stopDragging = () => {
    container.classList.remove('is-dragging');
  };

  container.addEventListener('mousedown', (event) => {
    if (event.button !== 0 || !window.matchMedia('(pointer: fine)').matches) return;

    startX = event.clientX;
    startScrollLeft = container.scrollLeft;
    dragged = false;

    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;

      if (!dragged && Math.abs(deltaX) < DRAG_THRESHOLD_PX) return;

      dragged = true;
      container.classList.add('is-dragging');
      container.scrollLeft = startScrollLeft - deltaX;
      moveEvent.preventDefault();
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.setTimeout(stopDragging, 0);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp, { once: true });
  });

  container.addEventListener('click', (event) => {
    if (!dragged) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);
}

export function initProgramFilterDragScroll() {
  document.querySelectorAll(FILTER_ROW_SELECTOR).forEach((container) => {
    if (container instanceof HTMLElement) setupDragScroll(container);
  });
}
