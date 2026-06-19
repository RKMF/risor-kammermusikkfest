export const prerender = false;

import { buildCalendarEventDetails, buildCalendarEventDetailsForShowing, buildIcsContent } from '../../../lib/calendar';
import { getEventOccurrences } from '../../../lib/eventOccurrences';
import { SanityDataService } from '../../../lib/sanity/dataService';
import { InputValidator } from '../../../lib/security';
import type { Language } from '../../../lib/utils/language';

function getLanguage(searchParams: URLSearchParams): Language {
  return searchParams.get('lang') === 'en' ? 'en' : 'no';
}

export async function GET(context: { params: { slug?: string }; request: Request }) {
  const slug = InputValidator.validateSlug(context.params.slug ?? null);
  if (!slug) {
    return new Response(null, { status: 404 });
  }

  const searchParams = new URL(context.request.url).searchParams;
  const language = getLanguage(searchParams);
  const occurrenceParam = searchParams.get('occurrence');
  const showingParam = searchParams.get('showing');
  const dataService = new SanityDataService(
    {
      perspective: 'published',
      useCdn: true,
      token: import.meta.env.SANITY_API_READ_TOKEN,
      stega: false,
    },
    language
  );

  try {
    const hasEventSlug = await dataService.hasEventSlug(slug);
    if (!hasEventSlug) {
      return new Response(null, { status: 404 });
    }

    const event = await dataService.getEventBySlug(slug);
    if (!event) {
      return new Response(null, { status: 404 });
    }

    let details = buildCalendarEventDetails(event, language, context.request);

    if (occurrenceParam && showingParam) {
      const matchedOccurrence = getEventOccurrences(event).find(
        (occurrence) =>
          (occurrence._key || occurrence.eventDate?.date) === occurrenceParam
      );
      const matchedShowing = matchedOccurrence?.showings?.find(
        (showing) => (showing._key || showing.startTime) === showingParam
      );

      if (matchedOccurrence?.eventDate && matchedShowing) {
        details = buildCalendarEventDetailsForShowing(
          event,
          {
            eventDate: matchedOccurrence.eventDate,
          },
          matchedShowing,
          language,
          context.request
        );
      }
    }

    if (!details) {
      return new Response(null, { status: 404 });
    }

    return new Response(buildIcsContent(details), {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${details.slug || slug}.ics"`,
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error(`Error generating calendar file for "${slug}":`, error);
    return new Response(null, { status: 500 });
  }
}
