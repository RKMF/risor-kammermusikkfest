export const prerender = false;
import type { APIRoute } from 'astro';
import { createDataService } from '../../lib/sanity/dataService.js';
import { formatDateWithWeekday } from '../../lib/utils/dates';
import { getOptimizedImageUrl, getResponsiveSrcSet, IMAGE_QUALITY, RESPONSIVE_WIDTHS } from '../../lib/sanityImage';
import { stegaClean } from '@sanity/client/stega';
import {
  rateLimit,
  InputValidator,
  getCORSHeaders,
  getSecurityHeaders
} from '../../lib/security';

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
    const dateParam = url.searchParams.get('date');
    const dateFilter = dateParam ? InputValidator.validateDate(dateParam) : null;
    const venueParam = url.searchParams.get('venue');
    const venueFilter = venueParam ? InputValidator.validateSlug(venueParam) : null;
    const language = url.searchParams.get('lang') || 'no';

    // Create data service
    const dataService = createDataService(request);

    // Clear cache in development
    if (import.meta.env.DEV) {
      dataService.clearCache();
    }

    // Get program page data
    const programPage = await dataService.getProgramPage();
    const events = ((programPage as any)?.selectedEvents || []).filter((event: any) => event != null);

    // Group events by date (same logic as program.astro)
    const eventsByDate = events.reduce((acc: any, event: any) => {
      if (!event?.eventDate?.date) return acc;

      const dateKey = event.eventDate.date;
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: event.eventDate.date,
          displayTitle: event.eventDate.title || formatDateWithWeekday(event.eventDate.date, language as 'no' | 'en'),
          events: []
        };
      }
      acc[dateKey].events.push(event);
      return acc;
    }, {} as Record<string, { date: string; displayTitle: string; events: typeof events }>);

    // Sort dates chronologically and sort events within each date by time
    const sortedDates = Object.values(eventsByDate)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((dateGroup: any) => ({
        ...dateGroup,
        events: dateGroup.events.sort((a: any, b: any) => {
          const timeA = a.eventTime?.startTime || '';
          const timeB = b.eventTime?.startTime || '';
          return timeA.localeCompare(timeB);
        })
      }));

    // Apply filters
    let filteredDates = sortedDates;

    // Apply date filter
    if (dateFilter) {
      filteredDates = filteredDates.filter(d => d.date === dateFilter);
    }

    // Apply venue filter
    if (venueFilter) {
      filteredDates = filteredDates
        .map(dateGroup => ({
          ...dateGroup,
          events: dateGroup.events.filter((e: any) => e.venue?.slug === venueFilter)
        }))
        .filter(dateGroup => dateGroup.events.length > 0);
    }

    // Check if we have any events after filtering
    const hasEvents = filteredDates.length > 0 && filteredDates.some(d => d.events.length > 0);

    // Build contextual message for empty state
    let emptyStateMessage = 'Ingen arrangementer funnet';
    if (dateFilter && venueFilter) {
      // Get display names from the events data
      const dateDisplay = sortedDates.find(d => d.date === dateFilter)?.displayTitle || formatDateWithWeekday(dateFilter, language as 'no' | 'en');
      const venueEvent = events.find((e: any) => e.venue?.slug === venueFilter);
      const venueDisplay = venueEvent?.venue?.title || venueFilter;
      emptyStateMessage = `Ingen arrangementer på ${dateDisplay} og ${venueDisplay}`;
    } else if (dateFilter) {
      const dateDisplay = sortedDates.find(d => d.date === dateFilter)?.displayTitle || formatDateWithWeekday(dateFilter, language as 'no' | 'en');
      emptyStateMessage = `Ingen arrangementer på ${dateDisplay}`;
    } else if (venueFilter) {
      const venueEvent = events.find((e: any) => e.venue?.slug === venueFilter);
      const venueDisplay = venueEvent?.venue?.title || venueFilter;
      emptyStateMessage = `Ingen arrangementer på ${venueDisplay}`;
    }

    // Generate HTML using the same structure as program.astro
    let html = '';

    if (hasEvents) {
      html = filteredDates.map(({ date, displayTitle, events: dateEvents }) => `
        <section class="content-section date-section" data-date="${date}">
          <h3 class="date-title">${stegaClean(displayTitle)}</h3>
          <div class="events-grid scroll-container scroll-container--event-cards scroll-container--styled-scrollbar">
            ${dateEvents.map((event: any) => {
              // Use language-aware slug selection
              const eventSlug = language === 'en'
                ? stegaClean(event.slug_en?.current || event.slug_no?.current)
                : stegaClean(event.slug_no?.current || event.slug_en?.current);
              const eventTitle = stegaClean(event.title);
              const eventExcerpt = event.excerpt ? stegaClean(event.excerpt) : '';

              let imageHtml = '';
              if (event.image?.image) {
                const imageUrl = getOptimizedImageUrl(event.image.image, 400, 300, IMAGE_QUALITY.CARD);
                const srcSet = getResponsiveSrcSet(event.image.image, RESPONSIVE_WIDTHS.MEDIUM, IMAGE_QUALITY.CARD);
                const alt = event.image.alt || event.title;

                imageHtml = `
                  <figure class="event-image">
                    <picture>
                      <source
                        srcset="${srcSet}"
                        type="image/webp"
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                      <img
                        src="${imageUrl}"
                        alt="${alt}"
                        loading="lazy"
                        decoding="async"
                        class="event-card-image"
                      />
                    </picture>
                  </figure>
                `;
              }

              let metaHtml = '<dl class="event-meta">';

              if (event.eventDate?.date) {
                const formattedDate = formatDateWithWeekday(event.eventDate.date, language as 'no' | 'en');
                const timeRange = event.eventTime
                  ? `, kl. ${stegaClean(event.eventTime.startTime)}`
                  : '';

                metaHtml += `
                  <dt class="visually-hidden">Dato og tid</dt>
                  <dd class="event-datetime">${formattedDate}${timeRange}</dd>
                `;
              }

              if (event.venue?.title) {
                metaHtml += `
                  <dt class="visually-hidden">Sted</dt>
                  <dd class="event-venue">${stegaClean(event.venue.title)}</dd>
                `;
              }

              metaHtml += '</dl>';

              const ticketType = stegaClean(event.ticketType);
              let ticketHtml = '';

              if (ticketType === 'info') {
                const ticketInfo = stegaClean(event.ticketInfoText) || 'Gratis';
                ticketHtml = `<p class="ticket-info">${ticketInfo}</p>`;
              } else if (event.ticketUrl) {
                const ticketUrl = stegaClean(event.ticketUrl);
                ticketHtml = `<a href="${ticketUrl}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">Kjøp billetter her</a>`;
              }

              const eventPath = language === 'en' ? `/en/program/${eventSlug}` : `/program/${eventSlug}`;

              return `
                <article class="event-card card" data-event-date="${event.eventDate?.date}">
                  <h4 class="event-title">
                    <a href="${eventPath}" class="event-title-link">
                      ${eventTitle}
                    </a>
                  </h4>
                  ${eventExcerpt ? `<p class="event-excerpt">${eventExcerpt}</p>` : ''}
                  ${imageHtml}
                  ${metaHtml}
                  ${ticketHtml}
                </article>
              `;
            }).join('')}
          </div>
        </section>
      `).join('');
    } else {
      const emptyStateText = language === 'no'
        ? 'Prøv en annen kombinasjon, eller:'
        : 'Choose a different combination, or:';
      const resetButtonText = language === 'no'
        ? 'Nullstill filtre'
        : 'Reset filters';
      const resetHref = language === 'no' ? '/program' : '/en/program';

      html = `
        <section class="content-section">
          <div class="no-results">
            <h3 class="no-results-title">${emptyStateMessage}</h3>
            <p class="no-results-text">${emptyStateText}</p>
            <a
              href="${resetHref}"
              class="link-button"
              hx-get="/api/filter-program"
              hx-vals='{"lang": "${language}", "date": "", "venue": ""}'
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
    const params = new URLSearchParams();

    if (dateFilter) params.set('date', dateFilter);
    if (venueFilter) params.set('venue', venueFilter);

    const queryString = params.toString();
    const pushUrl = queryString ? `${basePath}?${queryString}` : basePath;

    const origin = request.headers.get('origin') ?? undefined;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=30',
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
