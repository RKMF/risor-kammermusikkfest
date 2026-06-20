export interface EventDateReferenceLike {
  _ref?: string;
}

export interface EventDateResolvedLike {
  date?: string;
  title_display_no?: string;
  title_display_en?: string;
}

export interface EventShowingReferenceLike {
  eventDate?: EventDateReferenceLike;
  startTime?: string;
}

export interface EventShowingResolvedLike {
  eventDate?: EventDateResolvedLike;
  startTime?: string;
}

export interface EventOccurrenceReferenceLike {
  eventDate?: EventDateReferenceLike;
  showings?: Array<{ startTime?: string }>;
}

export interface EventOccurrenceResolvedLike {
  eventDate?: EventDateResolvedLike;
  showings?: Array<{ startTime?: string }>;
}

export interface EventSortDocumentWithReferences {
  showings?: EventShowingReferenceLike[];
  occurrences?: EventOccurrenceReferenceLike[];
  eventDate?: EventDateReferenceLike;
  eventTime?: { startTime?: string };
}

export interface EventSortDocumentWithResolvedDates {
  showings?: EventShowingResolvedLike[];
  occurrences?: EventOccurrenceResolvedLike[];
  eventDate?: EventDateResolvedLike;
  eventTime?: { startTime?: string };
}

interface EventSortEntry {
  date: string;
  startTime?: string;
  dateLabelNo?: string;
  dateLabelEn?: string;
}

export interface PrimaryEventSortValues {
  eventDateValue?: string;
  eventStartTimeValue?: string;
}

export interface PrimaryEventScheduleDetails extends PrimaryEventSortValues {
  dateLabelNo?: string;
  dateLabelEn?: string;
  hasMultipleEntries: boolean;
}

export interface EventScheduleEntryCountDocument {
  showings?: Array<unknown>;
  occurrences?: Array<{ showings?: Array<unknown> }>;
  eventDate?: unknown;
}

function compareOptionalTimeAsc(timeA?: string, timeB?: string): number {
  if (!timeA && !timeB) return 0;
  if (!timeA) return 1;
  if (!timeB) return -1;
  return timeA.localeCompare(timeB);
}

function compareSortEntries(a: EventSortEntry, b: EventSortEntry): number {
  const dateComparison = a.date.localeCompare(b.date);
  if (dateComparison !== 0) return dateComparison;

  return compareOptionalTimeAsc(a.startTime, b.startTime);
}

function getEarliestStartTime(showings?: Array<{ startTime?: string }>): string | undefined {
  const startTimes = (showings || [])
    .map((showing) => showing?.startTime)
    .filter((value): value is string => Boolean(value))
    .sort(compareOptionalTimeAsc);

  return startTimes[0];
}

function normalizeSortValues(entry?: EventSortEntry): PrimaryEventSortValues {
  if (!entry?.date) {
    return {};
  }

  return {
    eventDateValue: entry.date,
    eventStartTimeValue: entry.startTime || '',
  };
}

function sortEntries(entries: EventSortEntry[]): EventSortEntry[] {
  return [...entries].sort(compareSortEntries);
}

export function getEventScheduleEntryCount(document: EventScheduleEntryCountDocument): number {
  const topLevelShowings = Array.isArray(document.showings) ? document.showings.length : 0;
  const occurrenceEntries = (document.occurrences || []).reduce((count, occurrence) => {
    const showingCount = Array.isArray(occurrence?.showings) ? occurrence.showings.length : 0;
    return count + Math.max(showingCount, 1);
  }, 0);

  if (topLevelShowings > 0 || occurrenceEntries > 0) {
    return topLevelShowings + occurrenceEntries;
  }

  return document.eventDate ? 1 : 0;
}

export function collectReferencedEventDateIds(
  document: Pick<EventSortDocumentWithReferences, 'showings' | 'occurrences' | 'eventDate'>
): string[] {
  const ids = new Set<string>();

  for (const showing of document.showings || []) {
    if (showing?.eventDate?._ref) {
      ids.add(showing.eventDate._ref);
    }
  }

  for (const occurrence of document.occurrences || []) {
    if (occurrence?.eventDate?._ref) {
      ids.add(occurrence.eventDate._ref);
    }
  }

  if (document.eventDate?._ref) {
    ids.add(document.eventDate._ref);
  }

  return Array.from(ids);
}

export function getPrimaryEventSortValuesFromReferences(
  document: EventSortDocumentWithReferences,
  dateByRef: Map<string, string>
): PrimaryEventSortValues {
  const entries: EventSortEntry[] = [];

  for (const showing of document.showings || []) {
    const ref = showing?.eventDate?._ref;
    const date = ref ? dateByRef.get(ref) : undefined;

    if (date) {
      entries.push({
        date,
        startTime: showing?.startTime,
      });
    }
  }

  for (const occurrence of document.occurrences || []) {
    const ref = occurrence?.eventDate?._ref;
    const date = ref ? dateByRef.get(ref) : undefined;

    if (date) {
      entries.push({
        date,
        startTime: getEarliestStartTime(occurrence?.showings),
      });
    }
  }

  if (entries.length > 0) {
    return normalizeSortValues(sortEntries(entries)[0]);
  }

  const legacyRef = document.eventDate?._ref;
  const legacyDate = legacyRef ? dateByRef.get(legacyRef) : undefined;
  if (!legacyDate) {
    return {};
  }

  return normalizeSortValues({
    date: legacyDate,
    startTime: document.eventTime?.startTime,
  });
}

export function getPrimaryEventScheduleDetails(
  document: EventSortDocumentWithResolvedDates
): PrimaryEventScheduleDetails {
  const entries: EventSortEntry[] = [];

  for (const showing of document.showings || []) {
    const eventDate = showing?.eventDate;
    if (eventDate?.date) {
      entries.push({
        date: eventDate.date,
        startTime: showing?.startTime,
        dateLabelNo: eventDate.title_display_no,
        dateLabelEn: eventDate.title_display_en,
      });
    }
  }

  for (const occurrence of document.occurrences || []) {
    const eventDate = occurrence?.eventDate;
    if (eventDate?.date) {
      entries.push({
        date: eventDate.date,
        startTime: getEarliestStartTime(occurrence?.showings),
        dateLabelNo: eventDate.title_display_no,
        dateLabelEn: eventDate.title_display_en,
      });
    }
  }

  if (entries.length > 0) {
    const primary = sortEntries(entries)[0];

    return {
      ...normalizeSortValues(primary),
      dateLabelNo: primary.dateLabelNo,
      dateLabelEn: primary.dateLabelEn,
      hasMultipleEntries: getEventScheduleEntryCount(document) > 1,
    };
  }

  if (!document.eventDate?.date) {
    return {
      hasMultipleEntries: getEventScheduleEntryCount(document) > 1,
    };
  }

  return {
    eventDateValue: document.eventDate.date,
    eventStartTimeValue: document.eventTime?.startTime || '',
    dateLabelNo: document.eventDate.title_display_no,
    dateLabelEn: document.eventDate.title_display_en,
    hasMultipleEntries: getEventScheduleEntryCount(document) > 1,
  };
}
