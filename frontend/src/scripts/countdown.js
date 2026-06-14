import {
  COUNTDOWN_STRINGS,
  buildAriaLabel,
  getTimeRemaining,
  getVisibleParts
} from '../lib/countdown.js';

function renderTimerParts(timerElement, visibleParts, conjunction) {
  timerElement.replaceChildren();

  visibleParts.forEach((part, index) => {
    const partFragment = document.createDocumentFragment();
    const number = document.createElement('span');
    number.className = 'countdown__number';
    number.textContent = String(part.value);

    const label = document.createElement('span');
    label.className = 'countdown__label';
    label.textContent = ` ${part.label}`;

    partFragment.append(number, label);

    if (index < visibleParts.length - 2) {
      const separator = document.createElement('span');
      separator.className = 'countdown__separator';
      separator.textContent = ', ';
      partFragment.append(separator);
    } else if (index === visibleParts.length - 2) {
      const separator = document.createElement('span');
      separator.className = 'countdown__separator';
      separator.textContent = ` ${conjunction} `;
      partFragment.append(separator);
    }

    timerElement.append(partFragment);
  });
}

function updateCountdown(countdown) {
  const targetDateValue = countdown.dataset.targetDate;
  if (!targetDateValue) {
    return false;
  }

  const targetDate = new Date(targetDateValue);
  if (Number.isNaN(targetDate.getTime())) {
    return false;
  }

  const language = countdown.dataset.language === 'en' ? 'en' : 'no';
  const strings = COUNTDOWN_STRINGS[language];
  const completedMessage = countdown.dataset.completedMessage || strings.completedMessage;
  const hideWhenComplete = countdown.dataset.hideWhenComplete === 'true';
  const display = countdown.querySelector('[data-countdown-display]');
  const title = countdown.querySelector('[data-countdown-title]');
  const timer = countdown.querySelector('[data-countdown-timer]');
  const expiredMessage = countdown.querySelector('[data-countdown-expired]');

  if (!(display instanceof HTMLElement) || !(timer instanceof HTMLElement) || !(expiredMessage instanceof HTMLElement)) {
    return false;
  }

  const timeRemaining = getTimeRemaining(targetDate);

  if (timeRemaining.expired) {
    if (hideWhenComplete) {
      countdown.remove();
      return false;
    }

    display.setAttribute('role', 'status');
    display.setAttribute('aria-label', completedMessage);
    if (title instanceof HTMLElement) {
      title.hidden = true;
    }
    timer.hidden = true;
    expiredMessage.hidden = false;
    expiredMessage.textContent = completedMessage;
    return false;
  }

  const visibleParts = getVisibleParts(timeRemaining, strings);
  const ariaLabel = buildAriaLabel(timeRemaining, visibleParts, strings, completedMessage);

  display.setAttribute('role', 'timer');
  display.setAttribute('aria-label', ariaLabel);
  if (title instanceof HTMLElement) {
    title.hidden = false;
  }
  timer.hidden = false;
  expiredMessage.hidden = true;
  renderTimerParts(timer, visibleParts, strings.conjunction);

  return true;
}

function scheduleCountdown(countdown) {
  const tick = () => {
    if (!countdown.isConnected) {
      return;
    }

    const shouldContinue = updateCountdown(countdown);
    if (!shouldContinue) {
      return;
    }

    const msUntilNextMinute = 60000 - (Date.now() % 60000) + 25;
    window.setTimeout(tick, msUntilNextMinute);
  };

  tick();
}

export function initializeCountdowns() {
  document.querySelectorAll('[data-countdown]').forEach((countdown) => {
    if (!(countdown instanceof HTMLElement) || countdown.dataset.countdownInitialized === 'true') {
      return;
    }

    countdown.dataset.countdownInitialized = 'true';
    scheduleCountdown(countdown);
  });
}
