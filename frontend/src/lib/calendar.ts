import type { EventResult } from './sanity/queries';
import type { Language } from './utils/language';
import { resolveSlugValue } from './utils/language';
import { getAbsoluteUrl } from './site';

export const OSLO_TIME_ZONE = 'Europe/Oslo';

const dateTimeFormatterCache = new Map<string, Intl.DateTimeFormat>();

export interface CalendarEventDetails {
  title: string;
  slug: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
  url: string;
}

interface DateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function getDateTimeFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = dateTimeFormatterCache.get(timeZone);
  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  dateTimeFormatterCache.set(timeZone, formatter);
  return formatter;
}

function getZonedDateParts(date: Date, timeZone: string): DateParts {
  const parts = getDateTimeFormatter(timeZone).formatToParts(date);

  const lookup = (type: Intl.DateTimeFormatPartTypes) => {
    const part = parts.find((item) => item.type === type);
    return part ? Number(part.value) : 0;
  };

  return {
    year: lookup('year'),
    month: lookup('month'),
    day: lookup('day'),
    hour: lookup('hour'),
    minute: lookup('minute'),
    second: lookup('second'),
  };
}

function toUtcMs(parts: DateParts): number {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
}

function parseDate(date: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    return null;
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function parseTime(time: string): { hour: number; minute: number } | null {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) {
    return null;
  }

  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
  };
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function buildEventPath(event: EventResult, language: Language): string | null {
  const slug =
    language === 'en'
      ? resolveSlugValue(event.slug_en) || resolveSlugValue(event.slug_no)
      : resolveSlugValue(event.slug_no) || resolveSlugValue(event.slug_en);

  if (!slug) {
    return null;
  }

  return language === 'en' ? `/en/program/${slug}` : `/program/${slug}`;
}

function buildCalendarDescription(event: EventResult): string | undefined {
  const excerpt = typeof event.excerpt === 'string' ? collapseWhitespace(event.excerpt) : '';
  return excerpt || undefined;
}

export function combineDateAndTimeInTimeZone(
  date: string,
  time: string,
  timeZone: string = OSLO_TIME_ZONE
): Date | null {
  const parsedDate = parseDate(date);
  const parsedTime = parseTime(time);

  if (!parsedDate || !parsedTime) {
    return null;
  }

  const targetParts: DateParts = {
    ...parsedDate,
    ...parsedTime,
    second: 0,
  };

  let guess = new Date(
    Date.UTC(
      targetParts.year,
      targetParts.month - 1,
      targetParts.day,
      targetParts.hour,
      targetParts.minute,
      targetParts.second
    )
  );

  for (let index = 0; index < 3; index += 1) {
    const zonedParts = getZonedDateParts(guess, timeZone);
    const delta = toUtcMs(targetParts) - toUtcMs(zonedParts);

    if (delta === 0) {
      return guess;
    }

    guess = new Date(guess.getTime() + delta);
  }

  const resolvedParts = getZonedDateParts(guess, timeZone);
  if (toUtcMs(resolvedParts) !== toUtcMs(targetParts)) {
    return null;
  }

  return guess;
}

export function formatUtcCalendarTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function foldIcsLine(line: string): string {
  const chunkSize = 74;
  if (line.length <= chunkSize) {
    return line;
  }

  const segments: string[] = [];
  for (let index = 0; index < line.length; index += chunkSize) {
    const segment = line.slice(index, index + chunkSize);
    segments.push(index === 0 ? segment : ` ${segment}`);
  }

  return segments.join('\r\n');
}

export function buildCalendarEventDetails(
  event: EventResult,
  language: Language,
  request?: Request
): CalendarEventDetails | null {
  const date = event.eventDate?.date;
  const startTime = event.eventTime?.startTime;
  const endTime = event.eventTime?.endTime;
  const path = buildEventPath(event, language);
  const title = typeof event.title === 'string' ? collapseWhitespace(event.title) : '';

  if (!date || !startTime || !endTime || !path || !title) {
    return null;
  }

  const start = combineDateAndTimeInTimeZone(date, startTime, OSLO_TIME_ZONE);
  const end = combineDateAndTimeInTimeZone(date, endTime, OSLO_TIME_ZONE);

  if (!start || !end || end.getTime() <= start.getTime()) {
    return null;
  }

  return {
    title,
    slug: path.split('/').pop() || '',
    start,
    end,
    location: typeof event.venue?.title === 'string' ? collapseWhitespace(event.venue.title) : undefined,
    description: buildCalendarDescription(event),
    url: getAbsoluteUrl(path, request),
  };
}

function buildCalendarBody(details: CalendarEventDetails): string {
  const parts = [details.description, details.url].filter(Boolean);
  return parts.join('\n\n');
}

export function buildGoogleCalendarUrl(details: CalendarEventDetails): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: details.title,
    dates: `${formatUtcCalendarTimestamp(details.start)}/${formatUtcCalendarTimestamp(details.end)}`,
    details: buildCalendarBody(details),
  });

  if (details.location) {
    params.set('location', details.location);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildOutlookCalendarUrl(details: CalendarEventDetails): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: details.title,
    startdt: details.start.toISOString(),
    enddt: details.end.toISOString(),
    body: buildCalendarBody(details),
  });

  if (details.location) {
    params.set('location', details.location);
  }

  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function buildIcsContent(details: CalendarEventDetails): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Risør Kammermusikkfest//Program//NO',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${escapeIcsText(`${details.slug}@kammermusikkfest.no`)}`,
    `DTSTAMP:${formatUtcCalendarTimestamp(new Date())}`,
    `DTSTART:${formatUtcCalendarTimestamp(details.start)}`,
    `DTEND:${formatUtcCalendarTimestamp(details.end)}`,
    `SUMMARY:${escapeIcsText(details.title)}`,
    details.description ? `DESCRIPTION:${escapeIcsText(buildCalendarBody(details))}` : `DESCRIPTION:${escapeIcsText(details.url)}`,
    details.location ? `LOCATION:${escapeIcsText(details.location)}` : null,
    `URL:${escapeIcsText(details.url)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter((line): line is string => Boolean(line));

  return `${lines.map(foldIcsLine).join('\r\n')}\r\n`;
}
