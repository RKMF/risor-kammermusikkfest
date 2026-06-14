import type { APIRoute } from 'astro';
import {
  COUNTDOWN_STRINGS,
  buildAriaLabel,
  escapeHtml,
  getTimeRemaining,
  getVisibleParts,
  type CountdownStyle
} from '../../lib/countdown.js';
import type { Language } from '../../lib/utils/language.js';

const VALID_STYLES: CountdownStyle[] = ['large', 'compact', 'minimal'];
const VALID_LANGUAGES: Language[] = ['no', 'en'];

function isValidStyle(value: string | null): value is CountdownStyle {
  return value !== null && VALID_STYLES.includes(value as CountdownStyle);
}

function isValidLanguage(value: string | null): value is Language {
  return value !== null && VALID_LANGUAGES.includes(value as Language);
}

export const GET: APIRoute = async ({ url }) => {
  const targetDateParam = url.searchParams.get('targetDate');
  const languageParam = url.searchParams.get('lang');
  const styleParam = url.searchParams.get('style');

  if (!targetDateParam) {
    return new Response('targetDate is required', { status: 400 });
  }

  const targetDate = new Date(targetDateParam);
  if (Number.isNaN(targetDate.getTime())) {
    return new Response('targetDate must be a valid ISO date', { status: 400 });
  }

  const language = isValidLanguage(languageParam)
    ? languageParam
    : 'no';
  const style = isValidStyle(styleParam)
    ? styleParam
    : 'compact';
  const title = url.searchParams.get('title')?.trim();
  const completedMessageParam = url.searchParams.get('completedMessage')?.trim();
  const hideWhenComplete = url.searchParams.get('hideWhenComplete') === 'true';

  const strings = COUNTDOWN_STRINGS[language];
  const completedMessage = completedMessageParam || strings.completedMessage;
  const timeRemaining = getTimeRemaining(targetDate);

  if (timeRemaining.expired && hideWhenComplete) {
    return new Response('', {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'HX-Reswap': 'delete'
      }
    });
  }

  const visibleParts = getVisibleParts(timeRemaining, strings);
  const ariaLabel = buildAriaLabel(timeRemaining, visibleParts, strings, completedMessage);
  const titleHtml = title ? `<p class="countdown__title">${escapeHtml(title)}</p>` : '';
  const timerHtml = visibleParts.map((part, index) => {
    const separator = index < visibleParts.length - 2
      ? '<span class="countdown__separator">, </span>'
      : index === visibleParts.length - 2
        ? `<span class="countdown__separator"> ${strings.conjunction} </span>`
        : '';

    return `<span class="countdown__number">${part.value}</span><span class="countdown__label"> ${part.label}</span>${separator}`;
  }).join('');

  const html = timeRemaining.expired
    ? `<section class="countdown countdown--${style}">
        <div class="countdown__display" role="status" aria-live="polite" aria-atomic="true" aria-label="${escapeHtml(ariaLabel)}">
          <p class="countdown__expired">${escapeHtml(completedMessage)}</p>
        </div>
      </section>`
    : `<section class="countdown countdown--${style}" hx-get="${escapeHtml(url.pathname + url.search)}" hx-trigger="every 60s" hx-swap="outerHTML">
        <div class="countdown__display" role="timer" aria-live="polite" aria-atomic="true" aria-label="${escapeHtml(ariaLabel)}">
          ${titleHtml}
          <p class="countdown__timer">${timerHtml}</p>
        </div>
      </section>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
};
