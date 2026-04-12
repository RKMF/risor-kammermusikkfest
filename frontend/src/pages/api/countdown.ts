import type { APIRoute } from 'astro';
import {defineQuery} from 'groq';
import { sanityClient } from '../../lib/sanity/client';

const EVENT_COUNTDOWN_QUERY = defineQuery(`*[_type == "event" && _id == $eventId][0]{
  eventDate->{date},
  eventTime
}`);

const NORWEGIAN_STRINGS = {
  started: 'Arrangementet har startet!',
  prefix: 'Festivalen starter om ',
  day: ['dag', 'dager'],
  hour: ['time', 'timer'],
  minute: ['minutt', 'minutter']
} as const;

const ENGLISH_STRINGS = {
  started: 'The event has started!',
  prefix: 'The festival begins in ',
  day: ['day', 'days'],
  hour: ['hour', 'hours'],
  minute: ['minute', 'minutes']
} as const;

const LOCALE_MAP = {
  no: NORWEGIAN_STRINGS,
  en: ENGLISH_STRINGS
} as const;

type SupportedLocale = keyof typeof LOCALE_MAP;

export const GET: APIRoute = async ({ url }) => {
  const eventId = url.searchParams.get('eventId');
  const locale = (url.searchParams.get('lang')?.toLowerCase() as SupportedLocale) || 'no';

  if (!eventId) {
    return new Response('Event ID required', { status: 400 });
  }

  const strings = LOCALE_MAP[locale] || NORWEGIAN_STRINGS;

  const event = await sanityClient.fetch<{
    eventDate?: {date?: string};
    eventTime?: {startTime?: string; endTime?: string};
  } | null>(EVENT_COUNTDOWN_QUERY, {eventId});

  if (!event?.eventDate?.date) {
    return new Response('Event not found', { status: 404 });
  }

  const eventDate = new Date(event.eventDate.date);
  const cleanTime = event.eventTime?.startTime?.replace(/[^\d:]/g, '').trim();
  if (cleanTime && cleanTime.length >= 4) {
    const [hours = '0', minutes = '0'] = cleanTime.split(':');
    eventDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
  }

  const now = new Date();
  const diff = eventDate.getTime() - now.getTime();

  if (diff <= 0) {
    const html = `
      <div class="countdown__display">
        <p class="countdown__expired">${strings.started}</p>
      </div>
    `;
    return new Response(html, {
      headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' }
    });
  }

  const minutesTotal = Math.floor(diff / (1000 * 60));
  const days = Math.floor(minutesTotal / (60 * 24));
  const hours = Math.floor((minutesTotal - days * 24 * 60) / 60);
  const minutes = minutesTotal - days * 24 * 60 - hours * 60;

  const parts: string[] = [];
  if (days > 0) {
    parts.push(`${days} ${days === 1 ? strings.day[0] : strings.day[1]}`);
  }
  if (hours > 0 || days > 0) {
    parts.push(`${hours} ${hours === 1 ? strings.hour[0] : strings.hour[1]}`);
  }
  parts.push(`${minutes} ${minutes === 1 ? strings.minute[0] : strings.minute[1]}`);

  const html = `
    <div class="countdown__display">
      <p class="countdown__sentence">
        <span class="countdown__title-inline">${strings.prefix}</span>${parts.join(', ')}
      </p>
    </div>
  `;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache'
    }
  });
};
