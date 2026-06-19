import type {
  EventDateObject,
  EventResult,
  VenueObject,
} from './sanity/queries';
import type { Language } from './utils/language';
import { formatDateWithWeekday } from './utils/dates';

export interface EventShowingResult {
  _key?: string;
  eventDate?: EventDateObject;
  startTime?: string;
  endTime?: string;
  venue?: VenueObject;
  includeInProgramVenueFilter?: boolean;
  ticketType?: 'button' | 'info';
  ticketUrl?: string;
  ticketInfoText?: string;
  ticketStatus?: 'available' | 'low_stock' | 'sold_out';
}

export interface EventOccurrenceResult {
  _key?: string;
  eventDate?: EventDateObject;
  showings?: EventShowingResult[];
}

export interface EventDayCard {
  _id: string;
  event: EventResult;
  occurrenceKey?: string;
  eventDate: EventDateObject;
  showings: EventShowingResult[];
  venue?: VenueObject;
  hasMultipleShowings: boolean;
  showingCount: number;
}

function compareEventDayCardTimeAsc(a: EventDayCard, b: EventDayCard): number {
  const dateComparison = compareOptionalDateAsc(a.eventDate?.date, b.eventDate?.date);
  if (dateComparison !== 0) return dateComparison;

  const showingA = a.showings[0];
  const showingB = b.showings[0];
  const timeComparison = compareOptionalTimeAsc(showingA?.startTime, showingB?.startTime);
  if (timeComparison !== 0) return timeComparison;

  return (a.event.title || '').localeCompare(b.event.title || '', 'nb-NO');
}

function compareOptionalDateAsc(dateA?: string, dateB?: string): number {
  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;
  return dateA.localeCompare(dateB);
}

function compareOptionalTimeAsc(timeA?: string, timeB?: string): number {
  if (!timeA && !timeB) return 0;
  if (!timeA) return 1;
  if (!timeB) return -1;
  return timeA.localeCompare(timeB);
}

function sortShowings(showings: EventShowingResult[]): EventShowingResult[] {
  return [...showings].sort((a, b) => {
    const dateComparison = compareOptionalDateAsc(a.eventDate?.date, b.eventDate?.date);
    if (dateComparison !== 0) return dateComparison;

    return compareOptionalTimeAsc(a.startTime, b.startTime);
  });
}

function sortOccurrences(occurrences: EventOccurrenceResult[]): EventOccurrenceResult[] {
  return [...occurrences].sort((a, b) => {
    const dateComparison = compareOptionalDateAsc(a.eventDate?.date, b.eventDate?.date);
    if (dateComparison !== 0) return dateComparison;

    const showingA = sortShowings(a.showings || [])[0];
    const showingB = sortShowings(b.showings || [])[0];
    return compareOptionalTimeAsc(showingA?.startTime, showingB?.startTime);
  });
}

function buildLegacyShowing(event: EventResult): EventShowingResult | null {
  if (!event.eventTime?.startTime || !event.eventTime?.endTime) {
    return null;
  }

  return {
    startTime: event.eventTime.startTime,
    endTime: event.eventTime.endTime,
    venue: event.venue,
    includeInProgramVenueFilter: true,
    ticketType: event.ticketType,
    ticketUrl: event.ticketUrl,
    ticketInfoText: event.ticketInfoText,
    ticketStatus: event.ticketStatus,
  };
}

export function getEventOccurrences(event: EventResult): EventOccurrenceResult[] {
  if (Array.isArray(event.showings) && event.showings.length > 0) {
    const groupedOccurrences = new Map<string, EventOccurrenceResult>();

    for (const showing of sortShowings(event.showings.filter(Boolean))) {
      const eventDate = showing.eventDate;
      if (!eventDate?.date) {
        continue;
      }

      const occurrenceKey = eventDate._id || eventDate.date;
      const existingOccurrence = groupedOccurrences.get(occurrenceKey);

      if (existingOccurrence) {
        existingOccurrence.showings = [...(existingOccurrence.showings || []), showing];
      } else {
        groupedOccurrences.set(occurrenceKey, {
          _key: occurrenceKey,
          eventDate,
          showings: [showing],
        });
      }
    }

    return sortOccurrences(
      Array.from(groupedOccurrences.values()).map((occurrence) => ({
        ...occurrence,
        showings: sortShowings((occurrence.showings || []).filter(Boolean)),
      }))
    );
  }

  if (Array.isArray(event.occurrences) && event.occurrences.length > 0) {
    return sortOccurrences(
      event.occurrences
        .map((occurrence) => ({
          ...occurrence,
          showings: sortShowings((occurrence.showings || []).filter(Boolean)),
        }))
        .filter((occurrence) => occurrence.eventDate?.date && (occurrence.showings?.length || 0) > 0)
    );
  }

  if (event.eventDate?.date) {
    const legacyShowing = buildLegacyShowing(event);
    if (legacyShowing) {
      return [
        {
          eventDate: event.eventDate,
          showings: [legacyShowing],
        },
      ];
    }
  }

  return [];
}

function resolveProgramVenue(showings: EventShowingResult[]): VenueObject | undefined {
  const visibleVenues = showings.filter(
    (showing) => showing.includeInProgramVenueFilter !== false && showing.venue?.slug && showing.venue.title
  );

  if (visibleVenues.length === 0) {
    return undefined;
  }

  const firstVenue = visibleVenues[0].venue;
  const allSameVenue = visibleVenues.every((showing) => showing.venue?.slug === firstVenue?.slug);
  return allSameVenue ? firstVenue : undefined;
}

export function buildEventDayCards(events: EventResult[]): EventDayCard[] {
  return events
    .flatMap((event) =>
      getEventOccurrences(event).flatMap((occurrence) => {
      if (!occurrence.eventDate?.date) {
        return [];
      }

      const showings = sortShowings((occurrence.showings || []).filter(Boolean));
      if (showings.length === 0) {
        return [];
      }

      return [
        {
          _id: `${event._id}:${occurrence._key || occurrence.eventDate.date}`,
          event,
          occurrenceKey: occurrence._key,
          eventDate: occurrence.eventDate,
          showings,
          venue: resolveProgramVenue(showings),
          hasMultipleShowings: showings.length > 1,
          showingCount: showings.length,
        },
      ];
      })
    )
    .sort(compareEventDayCardTimeAsc);
}

export function getPrimaryEventDayCard(event: EventResult): EventDayCard | null {
  return getNextUpcomingOccurrence(event);
}

export function getOccurrenceDisplayTitle(
  occurrence: Pick<EventDayCard, 'eventDate'>,
  language: Language
): string {
  return occurrence.eventDate.title || formatDateWithWeekday(occurrence.eventDate.date, language);
}

export function getProgramCardTimesText(dayCard: Pick<EventDayCard, 'showings' | 'hasMultipleShowings'>, language: Language): string {
  if (!dayCard.hasMultipleShowings) {
    return '';
  }

  const times = dayCard.showings
    .map((showing) => showing.startTime || '')
    .filter(Boolean);

  if (times.length === 0) {
    return '';
  }

  if (times.length <= 2) {
    return times.join(language === 'en' ? ' and ' : ' og ');
  }

  return language === 'en' ? 'See all times' : 'Se alle tidspunkt';
}

export function getProgramCardVenueText(dayCard: Pick<EventDayCard, 'showings'>, language: Language): string {
  const uniqueVenues = Array.from(
    new Set(
      dayCard.showings
        .map((showing) => showing.venue?.title || '')
        .filter(Boolean)
    )
  );

  if (uniqueVenues.length === 1) {
    return uniqueVenues[0];
  }

  if (uniqueVenues.length > 1) {
    return language === 'en' ? 'See all venues' : 'Se alle spillesteder';
  }

  return '';
}

export function getNextUpcomingOccurrence(event: EventResult, now: Date = new Date()): EventDayCard | null {
  const dayCards = buildEventDayCards([event]);
  if (dayCards.length === 0) {
    return null;
  }

  const today = now.toISOString().slice(0, 10);
  return dayCards.find((card) => card.eventDate.date >= today) || dayCards[0];
}

export function getShowingDateTimeLabel(
  showing: Pick<EventShowingResult, 'startTime' | 'endTime'>,
  language: Language
): string {
  if (!showing.startTime) {
    return language === 'en' ? 'Time to be announced' : 'Tid kommer';
  }

  return showing.endTime ? `${showing.startTime}–${showing.endTime}` : showing.startTime;
}

export function buildEventShowingId(eventId: string, occurrenceKey?: string, showingKey?: string): string {
  return [eventId, occurrenceKey || 'date', showingKey || 'showing'].join('-');
}
