export const prerender = false;
import type { APIRoute } from 'astro';
import { experimental_AstroContainer } from 'astro/container';
import { createDataService } from '../../lib/sanity/dataService.js';
import { formatDateWithWeekday } from '../../lib/utils/dates';
import { stegaClean } from '@sanity/client/stega';
import {
  rateLimit,
  InputValidator,
  getCORSHeaders,
  getSecurityHeaders
} from '../../lib/security';
import EventCard from '../../components/EventCard.astro';

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
    const dateParam = url.searchParams.get('date');
    const dateFilter = dateParam ? InputValidator.validateDate(dateParam) : null;
    const venueParam = url.searchParams.get('venue');
    const venueFilter = venueParam ? InputValidator.validateSlug(venueParam) : null;
    const language = (url.searchParams.get('lang') || 'no') as 'no' | 'en';

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
        events: dateGroup.events.sort((a, b) => {
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
          events: dateGroup.events.filter((e) => e.venue?.slug === venueFilter)
        }))
        .filter(dateGroup => dateGroup.events.length > 0);
    }

    // Check if we have any events after filtering
    const hasEvents = filteredDates.length > 0 && filteredDates.some(d => d.events.length > 0);

    // Build contextual message for empty state
    let emptyStateMessage = 'Ingen arrangementer funnet';
    if (dateFilter && venueFilter) {
      // Get display names from the events data
      const dateDisplay = sortedDates.find(d => d.date === dateFilter)?.displayTitle || formatDateWithWeekday(dateFilter, language);
      const venueEvent = events.find((e) => e.venue?.slug === venueFilter);
      const venueDisplay = venueEvent?.venue?.title || venueFilter;
      emptyStateMessage = `Ingen arrangementer på ${dateDisplay} og ${venueDisplay}`;
    } else if (dateFilter) {
      const dateDisplay = sortedDates.find(d => d.date === dateFilter)?.displayTitle || formatDateWithWeekday(dateFilter, language);
      emptyStateMessage = `Ingen arrangementer på ${dateDisplay}`;
    } else if (venueFilter) {
      const venueEvent = events.find((e) => e.venue?.slug === venueFilter);
      const venueDisplay = venueEvent?.venue?.title || venueFilter;
      emptyStateMessage = `Ingen arrangementer på ${venueDisplay}`;
    }

    // Generate HTML
    let html = '';

    if (hasEvents) {
      // Create Astro container for rendering EventCard components
      const container = await experimental_AstroContainer.create();

      // Render each date section with EventCard components
      const sectionsHtml = await Promise.all(
        filteredDates.map(async ({ date, displayTitle, events: dateEvents }) => {
          // Render each EventCard using the actual component
          const eventCardsHtml = await Promise.all(
            dateEvents.map((event) =>
              container.renderToString(EventCard, {
                props: { event, language },
              })
            )
          );

          return `
            <section class="content-section date-section" data-date="${date}">
              <h2 class="date-title">${stegaClean(displayTitle)}</h2>
              <div class="events-grid scroll-container scroll-container--event-cards scroll-container--styled-scrollbar">
                ${eventCardsHtml.join('')}
              </div>
            </section>
          `;
        })
      );

      html = sectionsHtml.join('');
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
