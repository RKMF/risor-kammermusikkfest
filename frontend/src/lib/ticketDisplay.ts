import type { EventDayCard, EventShowingResult } from './eventOccurrences';
import type { EventResult } from './sanity/queries';

export type TicketDisplayMode = 'info' | 'sold_out' | 'low_stock' | 'available' | 'hidden';
export type TicketDisplaySource = 'shared_event' | 'showing' | 'none';

export interface ResolvedTicketDisplay {
  mode: TicketDisplayMode;
  label: string;
  url?: string;
  isDisabled: boolean;
  source: TicketDisplaySource;
}

export type TicketDisplayLanguage = 'no' | 'en';

interface TicketFields {
  ticketType?: 'button' | 'info' | string;
  ticketStatus?: 'available' | 'low_stock' | 'sold_out' | string;
  ticketUrl?: string;
  ticketInfoText?: string;
}

interface ResolveTicketDisplayOptions extends TicketFields {
  language: TicketDisplayLanguage;
  source?: TicketDisplaySource;
}

const LABELS = {
  no: {
    buy: 'Kjøp billetter her',
    few: 'Få billetter igjen',
    sold: 'Utsolgt',
    infoFallback: 'Informasjon kommer',
  },
  en: {
    buy: 'Buy tickets',
    few: 'Few tickets left',
    sold: 'Sold out',
    infoFallback: 'Information coming soon',
  },
} as const;

export function getDefaultInfoTicketLabel(language: TicketDisplayLanguage): string {
  return LABELS[language].infoFallback;
}

function normalizeText(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function getProgramCardTicketFields(
  event: EventResult,
  dayCard?: EventDayCard | null
): { fields?: TicketFields; source: TicketDisplaySource } {
  if (event.ticketingMode !== 'per_showing') {
    return {
      fields: event,
      source: 'shared_event',
    };
  }

  const primaryShowing = dayCard?.showings[0];
  const badgeShowing = dayCard?.showings.find((showing) => showing.ticketType === 'info') || primaryShowing;

  if (badgeShowing) {
    return {
      fields: badgeShowing,
      source: 'showing',
    };
  }

  return { source: 'none' };
}

function getEventPageTicketFields(
  event: EventResult,
  showing?: EventShowingResult
): { fields?: TicketFields; source: TicketDisplaySource } {
  if (event.ticketingMode !== 'per_showing') {
    return {
      fields: event,
      source: 'shared_event',
    };
  }

  if (showing) {
    return {
      fields: showing,
      source: 'showing',
    };
  }

  return { source: 'none' };
}

export function resolveTicketDisplay({
  ticketType,
  ticketStatus,
  ticketUrl,
  ticketInfoText,
  language,
  source = 'none',
}: ResolveTicketDisplayOptions): ResolvedTicketDisplay {
  const labels = LABELS[language];
  const infoText = normalizeText(ticketInfoText);
  const url = normalizeText(ticketUrl);

  if (ticketType === 'info') {
    return {
      mode: 'info',
      label: infoText || labels.infoFallback,
      isDisabled: true,
      source,
    };
  }

  if (ticketStatus === 'sold_out') {
    return {
      mode: 'sold_out',
      label: labels.sold,
      isDisabled: true,
      source,
    };
  }

  if (ticketStatus === 'low_stock') {
    return {
      mode: 'low_stock',
      label: labels.few,
      url,
      isDisabled: !url,
      source,
    };
  }

  if (ticketStatus === 'available' || ticketType === 'button' || url) {
    return {
      mode: 'available',
      label: labels.buy,
      url,
      isDisabled: !url,
      source,
    };
  }

  return {
    mode: 'hidden',
    label: '',
    isDisabled: true,
    source,
  };
}

export function resolveProgramCardTicketDisplay(
  event: EventResult,
  language: TicketDisplayLanguage,
  dayCard?: EventDayCard | null
): ResolvedTicketDisplay {
  const { fields, source } = getProgramCardTicketFields(event, dayCard);
  return resolveTicketDisplay({
    ticketType: fields?.ticketType,
    ticketStatus: fields?.ticketStatus,
    ticketUrl: fields?.ticketUrl,
    ticketInfoText: fields?.ticketInfoText,
    language,
    source,
  });
}

export function resolveEventPageTicketDisplay(
  event: EventResult,
  language: TicketDisplayLanguage,
  showing?: EventShowingResult
): ResolvedTicketDisplay {
  const { fields, source } = getEventPageTicketFields(event, showing);
  return resolveTicketDisplay({
    ticketType: fields?.ticketType,
    ticketStatus: fields?.ticketStatus,
    ticketUrl: fields?.ticketUrl,
    ticketInfoText: fields?.ticketInfoText,
    language,
    source,
  });
}

export function renderTicketDisplayHtml(
  display: ResolvedTicketDisplay,
  escapeHtml: (text: string) => string,
  eventTitle?: string
): string {
  if (display.mode === 'hidden') {
    return '';
  }

  if (display.mode === 'info') {
    return `<span class="ticket-badge">${escapeHtml(display.label)}</span>`;
  }

  if (display.mode === 'sold_out' || display.isDisabled || !display.url) {
    return `<span class="btn btn-disabled" role="button" aria-disabled="true">${escapeHtml(display.label)}</span>`;
  }

  const className = display.mode === 'low_stock' ? 'btn btn-warning' : 'btn btn-primary';
  const trackingAttribute = eventTitle ? ` data-concert="${escapeHtml(eventTitle)}"` : '';

  return `<a href="${escapeHtml(display.url)}" class="${className}" target="_blank" rel="noopener noreferrer" data-track-ticket${trackingAttribute}>${escapeHtml(display.label)}</a>`;
}
