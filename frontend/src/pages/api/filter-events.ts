export const prerender = false;
import type { APIRoute } from 'astro';
import {defineQuery} from 'groq';
import { sanityClient } from 'sanity:client';
import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url';
import {
  rateLimit,
  validateContentType,
  InputValidator,
  getCORSHeaders,
  getSecurityHeaders
} from '../../lib/security';
import { formatDateForLanguage } from '../../lib/utils/dates';

interface EventFilterFormData {
  eventDate?: string;
  genre?: string;
  venue?: string;
}

interface EventResult {
  _id: string;
  title: string;
  slug: string;
  image?: {
    image?: SanityImageSource;
    alt?: string;
  };
  eventDate?: {
    date?: string;
    title?: string;
  };
  eventTime?: {
    startTime?: string;
    endTime?: string;
  };
  venue?: {
    title?: string;
  };
  genre?: {
    title?: string;
  };
  artists?: Array<{
    name?: string;
  }>;
}

// Create Sanity Image URL Builder
const { projectId, dataset } = sanityClient.config();
const urlFor = (source: SanityImageSource) =>
  projectId && dataset
    ? imageUrlBuilder({ projectId, dataset }).image(source)
    : null;

function validateFilters(filters: EventFilterFormData): EventFilterFormData {
  const validated: EventFilterFormData = {}

  // Validate and sanitize eventDate
  const validDate = InputValidator.validateDate(filters.eventDate || null)
  if (validDate) {
    validated.eventDate = validDate
  }

  // Validate and sanitize genre slug
  const validGenre = InputValidator.validateSlug(filters.genre || null)
  if (validGenre) {
    validated.genre = validGenre
  }

  // Validate and sanitize venue slug
  const validVenue = InputValidator.validateSlug(filters.venue || null)
  if (validVenue) {
    validated.venue = validVenue
  }

  return validated
}

// Use enhanced HTML escaping from security utilities
const escapeHtml = InputValidator.sanitizeString;

const getImageUrl = (image: SanityImageSource | undefined, width: number, height: number) => {
  if (!image || !urlFor) return '';
  const imageBuilder = urlFor(image);
  return imageBuilder
    ? imageBuilder.width(width).height(height).url() || ''
    : '';
};

function generateEventHtml(event: EventResult): string {
  let imageHtml = '';
  if (event.image?.image) {
    const imageUrl = getImageUrl(event.image.image, 400, 300);
    const alt = event.image.alt || event.title;

    if (imageUrl) {
      imageHtml = `
        <div style="position: relative; height: 200px; overflow: hidden;">
          <img 
            src="${imageUrl}" 
            alt="${escapeHtml(alt)}" 
            loading="lazy"
          />
        </div>
      `;
    }
  }

  return `
      <a href="/program/${escapeHtml(event.slug)}" style="text-decoration: none; color: inherit; display: block;">
        ${imageHtml}
        <div style="padding: 1.25rem;">
          <h3 style="margin: 0 0 0.75rem 0; color: #333; font-size: 1.2rem; line-height: 1.3;">${escapeHtml(event.title)}</h3>
          <div style="color: #666; font-size: 0.9rem; line-height: 1.4;">
            ${
              event.eventDate?.date
                ? `<div style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;"><span style="font-weight: 600; min-width: 3rem;">Dato:</span><span>${escapeHtml(event.eventDate.title || '')}${event.eventDate.date ? ` (${escapeHtml(formatDateForLanguage(event.eventDate.date, 'no'))})` : ''}</span></div>`
                : ''
            }
            ${
              event.eventTime?.startTime
                ? `<div style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;"><span style="font-weight: 600; min-width: 3rem;">Tid:</span><span>${escapeHtml(event.eventTime.startTime)}${event.eventTime.endTime ? ` - ${escapeHtml(event.eventTime.endTime)}` : ''}</span></div>`
                : ''
            }
            ${
              event.venue?.title
                ? `<div style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;"><span style="font-weight: 600; min-width: 3rem;">Sted:</span><span>${escapeHtml(event.venue.title)}</span></div>`
                : ''
            }
            ${
              event.artists && event.artists.filter(Boolean).length > 0
                ? `<div style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;"><span style="font-weight: 600; min-width: 4rem;">Artister:</span><span>${event.artists.filter(Boolean).map((artist) => escapeHtml(artist.name || '')).filter(Boolean).join(', ')}</span></div>`
                : ''
            }
            ${
              event.genre?.title
                ? `<div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #f0f0f0; display: flex; align-items: center; gap: 0.5rem;"><span style="font-weight: 600; min-width: 4rem;">Sjanger:</span><span style="color: #999; font-size: 0.85rem;">${escapeHtml(event.genre.title)}</span></div>`
                : ''
            }
          </div>
        </div>
      </a>
    </div>
  `;
}

// Rate limiter configuration
const rateLimiter = rateLimit({
  maxRequests: 30, // 30 requests per window
  windowMs: 60 * 1000, // 1 minute window
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

export const POST: APIRoute = async ({ request }) => {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimiter(request);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Too many requests', 
          resetTime: rateLimitResult.resetTime 
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
            ...getSecurityHeaders(),
          },
        }
      );
    }

    // Validate Content-Type
    if (!validateContentType(request, 'application/x-www-form-urlencoded')) {
      return new Response(
        JSON.stringify({ error: 'Invalid Content-Type' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...getSecurityHeaders(),
          },
        }
      );
    }

    // Limit request body size (prevent DoS)
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 1024) { // 1KB limit
      return new Response(
        JSON.stringify({ error: 'Request body too large' }), {
          status: 413,
          headers: {
            'Content-Type': 'application/json',
            ...getSecurityHeaders(),
          },
        }
      );
    }

    // Parse and validate input data using type-safe form utilities
    const rawData = await request.text()
    const searchParams = new URLSearchParams(rawData)

    const filters = validateFilters({
      eventDate: searchParams.get('eventDate') || undefined,
      genre: searchParams.get('genre') || undefined,
      venue: searchParams.get('venue') || undefined,
    })

    const FILTER_EVENTS_QUERY = defineQuery(`*[
      _type == "event"
      && publishingStatus == "published"
      && (!defined($eventDate) || eventDate->date == $eventDate)
      && (!defined($genre) || genre->slug.current == $genre)
      && (!defined($venue) || venue->slug.current == $venue)
    ] | order(eventDate->date asc, eventTime.startTime asc){
      _id,
      title_no,
      title_en,
      "title": coalesce(title_no, title_en, title),
      "slug": coalesce(slug_no.current, slug_en.current, slug.current),
      "image": {
        "image": image,
        "alt": coalesce(imageAlt_no, imageAlt_en, image.alt)
      },
      eventTime,
      eventDate->{
        date,
        title_display_no,
        title_display_en,
        "title": coalesce(title_display_no, title_display_en)
      },
      venue->{title},
      genre->{title},
      "artists": artist[]->{name},
      ticketType,
      ticketUrl,
      ticketInfoText,
      ticketStatus
    }`)

    const events = await sanityClient.fetch<EventResult[]>(FILTER_EVENTS_QUERY, {
      eventDate: filters.eventDate || undefined,
      genre: filters.genre || undefined,
      venue: filters.venue || undefined,
    });

    // Generate HTML for events with result count
    const resultsCountText = `Viser ${events.length} arrangement${events.length === 1 ? '' : 'er'}`;
    const noResultsTitle = 'Ingen arrangementer funnet';
    const noResultsText = 'Prøv å endre filtrene eller <a href="/program" style="color: #007acc;">vis alle arrangementer</a>';

    const resultsHtml = `
      <div id="event-results">
        ${
          events.length > 0
            ? `<div>
                  ${resultsCountText}
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem;">
                  ${events.map(event => generateEventHtml(event)).join('')}
                </div>
              </div>`
            : `<div style="text-align: center; padding: 3rem; color: #666;">
                <div style="font-size: 2rem; margin-bottom: 1rem; color: #666;">Ingen resultater</div>
                <h3 style="margin: 0 0 1rem 0; color: #333;">${noResultsTitle}</h3>
                <p style="margin: 0; font-size: 1.1rem;">
                  ${noResultsText}
                </p>
              </div>`
        }
      </div>
    `;

    // Determine correct URL based on selected filter
    let pushUrl = '/program';
    if (filters.eventDate) {
      pushUrl = `/program#tab-${filters.eventDate}`;
    } else {
      pushUrl = '/program#tab-all-days';
    }

    const origin = request.headers.get('origin') ?? undefined;

    return new Response(resultsHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60', // Enhanced caching
        'HX-Push-Url': pushUrl, // HTMX vil oppdatere URL-en med denna
        ...getCORSHeaders(origin),
        ...getSecurityHeaders(),
      },
    });
  } catch (error) {
    // Enhanced error handling with logging (don't expose internal errors)
    console.error('Filter events API error:', error);

    const origin = request.headers.get('origin') ?? undefined;

    return new Response(
      `<div style="text-align: center; padding: 2rem; color: #dc3545;">
        <div style="font-size: 2rem; margin-bottom: 1rem; color: #dc3545;">Feil</div>
        <h3 style="margin: 0 0 1rem 0;">Beklager, det oppstod en feil</h3>
        <p style="margin: 0; font-size: 1.1rem;">Prøv igjen senere eller kontakt support hvis problemet vedvarer.</p>
      </div>`,
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
