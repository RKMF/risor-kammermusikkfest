type EventLike = {
  title?: string;
  eventDate?: {
    date?: string;
  };
  eventTime?: {
    startTime?: string;
  };
};

function compareOptionalDateAsc(dateA?: string, dateB?: string): number {
  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;
  return dateA.localeCompare(dateB);
}

function compareOptionalDateDesc(dateA?: string, dateB?: string): number {
  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;
  return dateB.localeCompare(dateA);
}

function compareOptionalTimeAsc(timeA?: string, timeB?: string): number {
  if (!timeA && !timeB) return 0;
  if (!timeA) return 1;
  if (!timeB) return -1;
  return timeA.localeCompare(timeB);
}

function compareOptionalTimeDesc(timeA?: string, timeB?: string): number {
  if (!timeA && !timeB) return 0;
  if (!timeA) return 1;
  if (!timeB) return -1;
  return timeB.localeCompare(timeA);
}

export function compareEventTitleAsc(a: EventLike, b: EventLike): number {
  return (a.title || '').localeCompare(b.title || '', 'nb-NO');
}

export function compareEventChronologicallyAsc(a: EventLike, b: EventLike): number {
  const dateComparison = compareOptionalDateAsc(a.eventDate?.date, b.eventDate?.date);
  if (dateComparison !== 0) return dateComparison;

  const timeComparison = compareOptionalTimeAsc(a.eventTime?.startTime, b.eventTime?.startTime);
  if (timeComparison !== 0) return timeComparison;

  return compareEventTitleAsc(a, b);
}

export function compareEventChronologicallyDesc(a: EventLike, b: EventLike): number {
  const dateComparison = compareOptionalDateDesc(a.eventDate?.date, b.eventDate?.date);
  if (dateComparison !== 0) return dateComparison;

  const timeComparison = compareOptionalTimeDesc(a.eventTime?.startTime, b.eventTime?.startTime);
  if (timeComparison !== 0) return timeComparison;

  return compareEventTitleAsc(a, b);
}

export function sortEventsByMode<T extends EventLike>(
  events: T[],
  sortBy: 'date-asc' | 'date-desc' | 'title-asc'
): T[] {
  const sorted = [...events];

  switch (sortBy) {
    case 'date-desc':
      return sorted.sort(compareEventChronologicallyDesc);
    case 'title-asc':
      return sorted.sort(compareEventTitleAsc);
    case 'date-asc':
    default:
      return sorted.sort(compareEventChronologicallyAsc);
  }
}
