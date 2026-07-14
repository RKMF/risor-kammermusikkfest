import { InputValidator } from '../security';
import { formatDateWithWeekday } from './dates';

export type ProgramFilterLanguage = 'no' | 'en';

export interface ProgramFilterDateDefinition {
  date: string;
  title?: string;
}

export interface ProgramFilterVenueDefinition {
  slug: string;
  title: string;
}

export interface ProgramFilterSelections {
  selectedDates: string[];
  selectedVenues: string[];
}

export interface ProgramFilterButtonState {
  value: string;
  label: string;
  isActive: boolean;
  pageHref: string;
  apiHref: string;
}

export interface ProgramFilterRenderState {
  allDatesButton: ProgramFilterButtonState;
  dateButtons: ProgramFilterButtonState[];
  allVenuesButton: ProgramFilterButtonState;
  venueButtons: ProgramFilterButtonState[];
}

export const MAX_PROGRAM_FILTER_VALUES = 10;

export interface ProgramFilterDateGroup<TEvent extends { venue?: { slug?: string | null } | null }> {
  date: string;
  events: TEvent[];
}

function getValidatedUniqueValues(
  values: string[],
  validator: (value: string | null) => string | null
): string[] {
  const validated = values
    .map((value) => validator(value))
    .filter((value): value is string => Boolean(value));

  return Array.from(new Set(validated)).sort().slice(0, MAX_PROGRAM_FILTER_VALUES);
}

export function hasValidProgramFilterParams(
  searchParams: URLSearchParams,
  allowLanguage: boolean = false
): boolean {
  const allowedKeys = new Set(allowLanguage ? ['date', 'venue', 'lang'] : ['date', 'venue']);
  if (Array.from(searchParams.keys()).some((key) => !allowedKeys.has(key))) {
    return false;
  }

  const dates = searchParams.getAll('date');
  const venues = searchParams.getAll('venue');
  if (dates.length > MAX_PROGRAM_FILTER_VALUES || venues.length > MAX_PROGRAM_FILTER_VALUES) {
    return false;
  }

  if (dates.some((value) => InputValidator.validateDate(value) === null)) {
    return false;
  }

  if (venues.some((value) => InputValidator.validateSlug(value) === null)) {
    return false;
  }

  const languages = searchParams.getAll('lang');
  if (!allowLanguage && languages.length > 0) {
    return false;
  }

  return !allowLanguage || (
    languages.length <= 1 &&
    languages.every((language) => language === 'no' || language === 'en')
  );
}

export function getValidatedSelectedDates(searchParams: URLSearchParams): string[] {
  return getValidatedUniqueValues(searchParams.getAll('date'), (value) =>
    InputValidator.validateDate(value)
  );
}

export function getValidatedSelectedVenues(searchParams: URLSearchParams): string[] {
  return getValidatedUniqueValues(searchParams.getAll('venue'), (value) =>
    InputValidator.validateSlug(value)
  );
}

export function buildCanonicalProgramFilterPath(
  basePath: string,
  searchParams: URLSearchParams
): string {
  return buildProgramFilterPath(
    basePath,
    getValidatedSelectedDates(searchParams),
    getValidatedSelectedVenues(searchParams)
  );
}

export function buildProgramFilterPath(
  basePath: string,
  selectedDates: string[],
  selectedVenues: string[],
  language?: ProgramFilterLanguage
): string {
  const params = new URLSearchParams();
  if (language) {
    params.set('lang', language);
  }

  Array.from(new Set(selectedDates)).sort().slice(0, MAX_PROGRAM_FILTER_VALUES)
    .forEach((date) => params.append('date', date));
  Array.from(new Set(selectedVenues)).sort().slice(0, MAX_PROGRAM_FILTER_VALUES)
    .forEach((venue) => params.append('venue', venue));

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function toggleProgramFilterSelection(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
}

export function buildProgramFilterRenderState(
  availableDates: ProgramFilterDateDefinition[],
  availableVenues: ProgramFilterVenueDefinition[],
  selections: ProgramFilterSelections,
  language: ProgramFilterLanguage
): ProgramFilterRenderState {
  const basePath = language === 'no' ? '/program' : '/en/program';
  const apiPath = '/api/filter-program';
  const uniqueDates = Array.from(new Set(availableDates.map((entry) => entry.date))).sort();

  return {
    allDatesButton: {
      value: '',
      label: language === 'no' ? 'Alle datoer' : 'All dates',
      isActive: selections.selectedDates.length === 0,
      pageHref: buildProgramFilterPath(basePath, [], selections.selectedVenues),
      apiHref: buildProgramFilterPath(apiPath, [], selections.selectedVenues, language),
    },
    dateButtons: uniqueDates.map((date) => {
      const nextDates = toggleProgramFilterSelection(selections.selectedDates, date);
      return {
        value: date,
        label: formatDateWithWeekday(date, language),
        isActive: selections.selectedDates.includes(date),
        pageHref: buildProgramFilterPath(basePath, nextDates, selections.selectedVenues),
        apiHref: buildProgramFilterPath(apiPath, nextDates, selections.selectedVenues, language),
      };
    }),
    allVenuesButton: {
      value: '',
      label: language === 'no' ? 'Alle steder' : 'All venues',
      isActive: selections.selectedVenues.length === 0,
      pageHref: buildProgramFilterPath(basePath, selections.selectedDates, []),
      apiHref: buildProgramFilterPath(apiPath, selections.selectedDates, [], language),
    },
    venueButtons: availableVenues.map((venue) => {
      const nextVenues = toggleProgramFilterSelection(selections.selectedVenues, venue.slug);
      return {
        value: venue.slug,
        label: venue.title,
        isActive: selections.selectedVenues.includes(venue.slug),
        pageHref: buildProgramFilterPath(basePath, selections.selectedDates, nextVenues),
        apiHref: buildProgramFilterPath(apiPath, selections.selectedDates, nextVenues, language),
      };
    }),
  };
}

export function applyProgramFilters<
  TEvent extends { venue?: { slug?: string | null } | null },
  TGroup extends ProgramFilterDateGroup<TEvent>
>(sortedDates: TGroup[], selections: ProgramFilterSelections): TGroup[] {
  let filteredDates = sortedDates;
  const selectedDateSet = new Set(selections.selectedDates);
  const selectedVenueSet = new Set(selections.selectedVenues);

  if (selectedDateSet.size > 0) {
    filteredDates = filteredDates.filter((group) => selectedDateSet.has(group.date));
  }

  if (selectedVenueSet.size > 0) {
    filteredDates = filteredDates
      .map((group) => ({
        ...group,
        events: group.events.filter(
          (event) => event.venue?.slug && selectedVenueSet.has(event.venue.slug)
        ),
      }))
      .filter((group) => group.events.length > 0) as TGroup[];
  }

  return filteredDates;
}

function buildDateSelectionLabel(
  selectedDates: string[],
  availableDates: ProgramFilterDateDefinition[],
  language: ProgramFilterLanguage
): string {
  if (selectedDates.length === 1) {
    return (
      availableDates.find((entry) => entry.date === selectedDates[0])?.title ||
      formatDateWithWeekday(selectedDates[0], language)
    );
  }

  return language === 'no' ? `${selectedDates.length} datoer` : `${selectedDates.length} dates`;
}

function buildVenueSelectionLabel(
  selectedVenues: string[],
  availableVenues: ProgramFilterVenueDefinition[],
  language: ProgramFilterLanguage
): string {
  if (selectedVenues.length === 1) {
    return (
      availableVenues.find((entry) => entry.slug === selectedVenues[0])?.title || selectedVenues[0]
    );
  }

  return language === 'no' ? `${selectedVenues.length} steder` : `${selectedVenues.length} venues`;
}

export function buildProgramEmptyStateMessage(
  selections: ProgramFilterSelections,
  availableDates: ProgramFilterDateDefinition[],
  availableVenues: ProgramFilterVenueDefinition[],
  language: ProgramFilterLanguage
): string {
  const noEventsText = language === 'no' ? 'Ingen arrangementer funnet' : 'No events found';

  if (selections.selectedDates.length > 0 && selections.selectedVenues.length > 0) {
    const dateDisplay = buildDateSelectionLabel(
      selections.selectedDates,
      availableDates,
      language
    );
    const venueDisplay = buildVenueSelectionLabel(
      selections.selectedVenues,
      availableVenues,
      language
    );

    return language === 'no'
      ? `Ingen arrangementer på ${dateDisplay} og ${venueDisplay}`
      : `No events on ${dateDisplay} at ${venueDisplay}`;
  }

  if (selections.selectedDates.length > 0) {
    const dateDisplay = buildDateSelectionLabel(
      selections.selectedDates,
      availableDates,
      language
    );
    return language === 'no'
      ? `Ingen arrangementer på ${dateDisplay}`
      : `No events on ${dateDisplay}`;
  }

  if (selections.selectedVenues.length > 0) {
    const venueDisplay = buildVenueSelectionLabel(
      selections.selectedVenues,
      availableVenues,
      language
    );
    return language === 'no'
      ? `Ingen arrangementer på ${venueDisplay}`
      : `No events at ${venueDisplay}`;
  }

  return noEventsText;
}
