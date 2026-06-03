export const prerender = false;
import type { APIRoute } from 'astro';
import { createDataService } from '../../lib/sanity/dataService.js';
import { formatDateWithWeekday } from '../../lib/utils/dates';
import { compareEventChronologicallyAsc } from '../../lib/utils/eventOrdering';
import { deriveAvailableVenues } from '../../lib/utils/programFilters';
import {
  applyProgramFilters,
  buildProgramEmptyStateMessage,
  buildProgramFilterPath,
  buildProgramFilterRenderState,
  getValidatedSelectedDates,
  getValidatedSelectedVenues,
} from '../../lib/utils/programFilterState';
import { stegaClean } from '@sanity/client/stega';
import {
  rateLimit,
  getCORSHeaders,
  getSecurityHeaders
} from '../../lib/security';
import { getOptimizedImageUrl, getResponsiveImageSet, IMAGE_QUALITY } from '../../lib/sanityImage';

// Types for program page data
interface EventVenue {
  slug: string;
  title: string;
}

interface EventDate {
  date: string;
  title?: string;
}

interface EventTime {
  startTime?: string;
}

interface ProgramEvent {
  _id: string;
  eventDate?: EventDate;
  eventTime?: EventTime;
  venue?: EventVenue;
  [key: string]: unknown; // Allow other properties from Sanity
}

interface DateGroup {
  date: string;
  displayTitle: string;
  events: ProgramEvent[];
}

interface ProgramPageData {
  selectedEvents?: (ProgramEvent | null)[];
  venueFilterOrder?: (EventVenue | null)[];
}

function generateProgramFiltersHtml(
  availableDates: EventDate[],
  availableVenues: EventVenue[],
  selectedDates: string[],
  selectedVenues: string[],
  language: 'no' | 'en'
): string {
  const filterState = buildProgramFilterRenderState(
    availableDates,
    availableVenues,
    { selectedDates, selectedVenues },
    language
  );

  return `
    <section
      id="filter-container"
      role="search"
      aria-label="${language === 'no' ? 'Filter arrangementer' : 'Filter events'}"
      hx-swap-oob="outerHTML"
    >
      ${filterState.dateButtons.length > 0 ? `
        <div class="date-filter">
          <div
            class="date-filter-buttons"
            role="region"
            tabindex="0"
            aria-label="${language === 'no' ? 'Filtrer etter dato' : 'Filter by date'}"
          >
            <a
              href="${filterState.allDatesButton.pageHref}"
              class="link-button${filterState.allDatesButton.isActive ? ' active' : ''}"
              aria-pressed="${filterState.allDatesButton.isActive ? 'true' : 'false'}"
              data-filter-type="date"
              data-filter-value="${filterState.allDatesButton.value}"
              hx-get="${filterState.allDatesButton.apiHref}"
              hx-target="#event-results"
              hx-swap="innerHTML show:none"
              hx-push-url="true"
              hx-indicator="#filter-loading"
            >
              ${filterState.allDatesButton.label}
            </a>
            ${filterState.dateButtons.map((button) => `
              <a
                href="${button.pageHref}"
                class="link-button${button.isActive ? ' active' : ''}"
                aria-pressed="${button.isActive ? 'true' : 'false'}"
                data-filter-type="date"
                data-filter-value="${escapeHtml(button.value)}"
                hx-get="${button.apiHref}"
                hx-target="#event-results"
                hx-swap="innerHTML show:none"
                hx-push-url="true"
                hx-indicator="#filter-loading"
              >
                ${escapeHtml(button.label)}
              </a>
            `).join('')}
          </div>
        </div>
      ` : ''}
      ${filterState.venueButtons.length > 0 ? `
        <div class="venue-filter">
          <div
            class="venue-filter-buttons"
            role="region"
            tabindex="0"
            aria-label="${language === 'no' ? 'Filtrer etter sted' : 'Filter by venue'}"
          >
            <a
              href="${filterState.allVenuesButton.pageHref}"
              class="link-button${filterState.allVenuesButton.isActive ? ' active' : ''}"
              aria-pressed="${filterState.allVenuesButton.isActive ? 'true' : 'false'}"
              data-filter-type="venue"
              data-filter-value="${filterState.allVenuesButton.value}"
              hx-get="${filterState.allVenuesButton.apiHref}"
              hx-target="#event-results"
              hx-swap="innerHTML show:none"
              hx-push-url="true"
              hx-indicator="#filter-loading"
            >
              ${filterState.allVenuesButton.label}
            </a>
            ${filterState.venueButtons.map((button) => `
              <a
                href="${button.pageHref}"
                class="link-button${button.isActive ? ' active' : ''}"
                aria-pressed="${button.isActive ? 'true' : 'false'}"
                data-filter-type="venue"
                data-filter-value="${escapeHtml(button.value)}"
                hx-get="${button.apiHref}"
                hx-target="#event-results"
                hx-swap="innerHTML show:none"
                hx-push-url="true"
                hx-indicator="#filter-loading"
              >
                ${escapeHtml(button.label)}
              </a>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </section>
  `;
}

// HTML escape function for security
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generate HTML for an EventCard.
 * This replaces the expensive renderToString(EventCard) call.
 */
function generateEventCardHtml(event: ProgramEvent, language: 'no' | 'en'): string {
  // Get cleaned values
  const title = stegaClean(event.title as string) || '';
  const excerpt = stegaClean(event.excerpt as string) || '';
  const slugNo = stegaClean((event.slug_no as { current?: string })?.current) || '';
  const slugEn = stegaClean((event.slug_en as { current?: string })?.current) || '';
  const eventSlug = language === 'en' ? (slugEn || slugNo) : (slugNo || slugEn);
  const eventPath = language === 'en' ? `/en/program/${eventSlug}` : `/program/${eventSlug}`;

  // Translation strings
  const dateLabel = language === 'en' ? 'Date and time' : 'Dato og tid';
  const venueLabel = language === 'en' ? 'Venue' : 'Sted';
  const ticketButtonText = language === 'en' ? 'Buy tickets' : 'Kjøp billetter her';
  const fewTicketsText = language === 'en' ? 'Few tickets' : 'Få billetter igjen';
  const soldOutText = language === 'en' ? 'Sold out' : 'Utsolgt';
  const freeText = language === 'en' ? 'Free' : 'Gratis';

  // Image handling
  let imageHtml = '';
  const eventImage = event.image as { image?: unknown; alt?: string } | undefined;
  if (eventImage?.image) {
    const imageUrl = getOptimizedImageUrl(eventImage.image, 320, 180, IMAGE_QUALITY.CARD);
    const srcset = getResponsiveImageSet(eventImage.image, [320, 640, 960], 16/9, IMAGE_QUALITY.CARD);
    const alt = escapeHtml(stegaClean(eventImage.alt) || title);

    if (imageUrl) {
      imageHtml = `
        <div class="event-image">
          <img
            src="${imageUrl}"
            srcset="${srcset}"
            sizes="320px"
            alt="${alt}"
            width="320"
            height="180"
            loading="lazy"
            decoding="async"
            class="event-card-image"
          />
        </div>
      `;
    }
  }

  // Event meta (date/time and venue)
  let metaHtml = '<dl class="event-card__meta">';

  if (event.eventDate?.date) {
    const dateDisplay = formatDateWithWeekday(event.eventDate.date, language);
    const timeDisplay = event.eventTime?.startTime ? `, kl. ${escapeHtml(stegaClean(event.eventTime.startTime) || '')}` : '';
    metaHtml += `
      <dt class="visually-hidden">${dateLabel}</dt>
      <dd class="event-card__datetime">
        <time datetime="${event.eventDate.date}">${dateDisplay}${timeDisplay}</time>
      </dd>
    `;
  }

  if (event.venue?.title) {
    metaHtml += `
      <dt class="visually-hidden">${venueLabel}</dt>
      <dd class="event-card__venue">${escapeHtml(stegaClean(event.venue.title) || '')}</dd>
    `;
  }

  metaHtml += '</dl>';

  // Ticket section
  const ticketType = stegaClean(event.ticketType as string);
  const ticketStatus = stegaClean(event.ticketStatus as string);
  const ticketUrl = stegaClean(event.ticketUrl as string) || '';
  const ticketInfoText = stegaClean(event.ticketInfoText as string) || freeText;

  let ticketHtml = '';
  if (ticketType === 'info') {
    ticketHtml = `<span class="ticket-badge">${escapeHtml(ticketInfoText)}</span>`;
  } else if (ticketStatus === 'sold_out') {
    ticketHtml = `<span class="btn btn-disabled" role="button" aria-disabled="true">${soldOutText}</span>`;
  } else if (ticketStatus === 'low_stock') {
    ticketHtml = `<a href="${escapeHtml(ticketUrl)}" class="btn btn-warning" target="_blank" rel="noopener noreferrer">${fewTicketsText}</a>`;
  } else {
    ticketHtml = `<a href="${escapeHtml(ticketUrl)}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">${ticketButtonText}</a>`;
  }

  // Excerpt
  const excerptHtml = excerpt ? `<p class="event-card__excerpt">${escapeHtml(excerpt)}</p>` : '';

  return `
    <article class="event-card" data-event-date="${event.eventDate?.date || ''}">
      <h3 class="event-card__title">
        <a href="${eventPath}" class="event-card__title-link card-link">${escapeHtml(title)}</a>
      </h3>
      ${excerptHtml}
      ${imageHtml}
      ${metaHtml}
      ${ticketHtml}
    </article>
  `;
}

// Rate limiter configuration
const rateLimiter = rateLimit({
  maxRequests: 60, // 60 requests per minute (generous for date filtering)
  windowMs: 60 * 1000,
});

// OPTIONS handler for CORS preflight
export const OPTIONS: APIRoute = async ({ request }) => {
  const origin = request.headers.get('origin') ?? undefined;
  return new Response(null, {
    status: 204,
    headers: {
      ...getCORSHeaders(origin),
      ...getSecurityHeaders(),
    },
  });
};

export const GET: APIRoute = async ({ request, url }) => {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimiter(request);
    if (!rateLimitResult.allowed) {
      return new Response(
        `<div class="no-results">
          <h3 class="no-results-title">For mange forespørsler</h3>
          <p class="no-results-text">Vennligst vent et øyeblikk før du prøver igjen</p>
        </div>`,
        {
          status: 429,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Retry-After': '60',
            ...getSecurityHeaders(),
          },
        }
      );
    }

    // Get and validate filters from URL
    const language = (url.searchParams.get('lang') || 'no') as 'no' | 'en';
    const selectedDates = getValidatedSelectedDates(url.searchParams);
    const selectedVenues = getValidatedSelectedVenues(url.searchParams);
    const selections = { selectedDates, selectedVenues };

    // Create data service
    const dataService = createDataService(request);

    // Clear cache in development
    if (import.meta.env.DEV) {
      dataService.clearCache();
    }

    // Get program page data
    const programPage = await dataService.getProgramPage() as ProgramPageData;
    const events: ProgramEvent[] = (programPage?.selectedEvents || []).filter(
      (event): event is ProgramEvent => event != null
    );
    const availableDates = events
      .filter(
        (event): event is ProgramEvent & { eventDate: EventDate } => Boolean(event?.eventDate?.date)
      )
      .map((event) => event.eventDate);
    const availableVenues = deriveAvailableVenues(events, programPage?.venueFilterOrder || []);

    // Group events by date (same logic as program.astro)
    const eventsByDate = events.reduce<Record<string, DateGroup>>((acc, event) => {
      if (!event?.eventDate?.date) return acc;

      const dateKey = event.eventDate.date;
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: event.eventDate.date,
          displayTitle: event.eventDate.title || formatDateWithWeekday(event.eventDate.date, language),
          events: []
        };
      }
      acc[dateKey].events.push(event);
      return acc;
    }, {});

    // Sort dates chronologically and sort events within each date by time
    const sortedDates: DateGroup[] = Object.values(eventsByDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((dateGroup) => ({
        ...dateGroup,
        events: [...dateGroup.events].sort(compareEventChronologicallyAsc)
      }));

    const filteredDates = applyProgramFilters(sortedDates, selections);

    // Check if we have any events after filtering
    const hasEvents = filteredDates.length > 0 && filteredDates.some(d => d.events.length > 0);

    const emptyStateMessage = buildProgramEmptyStateMessage(
      selections,
      availableDates,
      availableVenues,
      language
    );

    const filterHtml = generateProgramFiltersHtml(
      availableDates,
      availableVenues,
      selectedDates,
      selectedVenues,
      language
    );

    // Generate HTML
    let html = filterHtml;

    if (hasEvents) {
      // Render each date section with EventCard HTML templates
      // This is much faster than using experimental_AstroContainer.renderToString
      const sectionsHtml = filteredDates.map(({ date, displayTitle, events: dateEvents }) => {
        // Generate HTML for each event card
        const eventCardsHtml = dateEvents
          .map((event) => generateEventCardHtml(event, language))
          .join('');

        const eventsLabel = language === 'no' ? 'Arrangementer' : 'Events';
        const scrollNavLabel = language === 'no'
          ? 'Bla gjennom arrangementer'
          : 'Scroll through events';
        const scrollPrevLabel = language === 'no' ? 'Bla til venstre' : 'Scroll left';
        const scrollNextLabel = language === 'no' ? 'Bla til høyre' : 'Scroll right';
        return `
          <section class="content-section date-section" data-date="${date}">
            <h2 class="date-title">${stegaClean(displayTitle)}</h2>
            <div class="scroll-container-wrapper" data-scroll-step="item">
              <div class="event-card-collection scroll-container scroll-container--event-cards scroll-container--styled-scrollbar" role="region" tabindex="0" aria-label="${eventsLabel}">
                ${eventCardsHtml}
              </div>
            </div>
            <nav class="scroll-nav scroll-nav--medium" aria-label="${scrollNavLabel}">
              <button type="button" class="scroll-nav__btn" data-direction="prev" aria-label="${scrollPrevLabel}">
                <span aria-hidden="true">←</span>
              </button>
              <button type="button" class="scroll-nav__btn" data-direction="next" aria-label="${scrollNextLabel}">
                <span aria-hidden="true">→</span>
              </button>
            </nav>
          </section>
        `;
      });

      html += sectionsHtml.join('');
    } else {
      const emptyStateText = language === 'no'
        ? 'Prøv en annen kombinasjon, eller:'
        : 'Choose a different combination, or:';
      const resetButtonText = language === 'no'
        ? 'Nullstill filtre'
        : 'Reset filters';
      const resetHref = language === 'no' ? '/program' : '/en/program';

      html += `
        <section class="content-section">
          <div class="no-results">
            <h3 class="no-results-title">${emptyStateMessage}</h3>
            <p class="no-results-text">${emptyStateText}</p>
            <a
              href="${resetHref}"
              class="link-button"
              data-filter-type="reset"
              data-filter-value=""
              hx-get="${buildProgramFilterPath('/api/filter-program', [], [], language)}"
              hx-target="#event-results"
              hx-swap="innerHTML show:none"
              hx-push-url="true"
              hx-indicator="#filter-loading"
            >
              ${resetButtonText}
            </a>
          </div>
        </section>
      `;
    }

    // Determine the URL to push to browser history
    const basePath = language === 'no' ? '/program' : '/en/program';
    const pushUrl = buildProgramFilterPath(basePath, selectedDates, selectedVenues);

    const origin = request.headers.get('origin') ?? undefined;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
        'HX-Push-Url': pushUrl,
        ...getCORSHeaders(origin),
        ...getSecurityHeaders(),
      },
    });
  } catch (error) {
    console.error('Filter program API error:', error);

    const origin = request.headers.get('origin') ?? undefined;

    return new Response(
      `<section class="content-section">
        <div class="no-results">
          <h3 class="no-results-title">Det oppstod en feil</h3>
          <p class="no-results-text">Vennligst prøv igjen senere</p>
        </div>
      </section>`,
      {
        status: 500,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          ...getCORSHeaders(origin),
          ...getSecurityHeaders(),
        },
      }
    );
  }
};
