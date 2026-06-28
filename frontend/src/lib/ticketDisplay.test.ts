import { describe, expect, it } from 'vitest';
import type { EventDayCard, EventShowingResult } from './eventOccurrences';
import type { EventResult } from './sanity/queries';
import {
  renderTicketDisplayHtml,
  resolveEventPageTicketDisplay,
  resolveProgramCardTicketDisplay,
  resolveTicketDisplay,
} from './ticketDisplay';

function createEvent(overrides: Partial<EventResult> = {}): EventResult {
  return {
    _id: 'event-1',
    _type: 'event',
    title: 'Testarrangement',
    slug_no: { current: 'testarrangement' },
    slug_en: { current: 'test-event' },
    ticketingMode: 'shared',
    ticketType: 'button',
    ticketUrl: 'https://tickets.example.com',
    ticketStatus: 'available',
    ...overrides,
  };
}

function createShowing(overrides: Partial<EventShowingResult> = {}): EventShowingResult {
  return {
    _key: 'showing-1',
    startTime: '19:00',
    endTime: '20:00',
    ticketType: 'button',
    ticketUrl: 'https://tickets.example.com/showing-1',
    ticketStatus: 'available',
    ...overrides,
  };
}

function createDayCard(event: EventResult, showings: EventShowingResult[]): EventDayCard {
  return {
    _id: `${event._id}:date-1`,
    event,
    occurrenceKey: 'date-1',
    eventDate: {
      _id: 'date-1',
      date: '2026-06-27',
      title: 'Lørdag 27. juni',
    },
    showings,
    hasMultipleShowings: showings.length > 1,
    showingCount: showings.length,
    venue: undefined,
  };
}

describe('resolveTicketDisplay', () => {
  it('shows info text when ticket type is info', () => {
    expect(
      resolveTicketDisplay({
        ticketType: 'info',
        ticketInfoText: 'Ferdig spilt',
        language: 'no',
        source: 'shared_event',
      })
    ).toMatchObject({
      mode: 'info',
      label: 'Ferdig spilt',
      isDisabled: true,
      source: 'shared_event',
    });
  });

  it('falls back to hidden when no usable ticket fields exist', () => {
    expect(resolveTicketDisplay({ language: 'no' }).mode).toBe('hidden');
  });
});

describe('program card ticket resolution', () => {
  it('uses shared-event info for shared ticketing cards', () => {
    const event = createEvent({
      ticketingMode: 'shared',
      ticketType: 'info',
      ticketInfoText: 'Ferdig spilt',
      ticketStatus: 'available',
    });

    const display = resolveProgramCardTicketDisplay(event, 'no', createDayCard(event, [createShowing()]));

    expect(display).toMatchObject({
      mode: 'info',
      label: 'Ferdig spilt',
      source: 'shared_event',
    });
  });

  it('uses the info showing consistently for per-showing cards', () => {
    const event = createEvent({
      ticketingMode: 'per_showing',
      ticketType: 'button',
      ticketStatus: 'available',
    });
    const showings = [
      createShowing({ _key: 'showing-1', ticketType: 'button', ticketStatus: 'available' }),
      createShowing({ _key: 'showing-2', ticketType: 'info', ticketInfoText: 'Ferdig spilt' }),
    ];

    const display = resolveProgramCardTicketDisplay(event, 'no', createDayCard(event, showings));

    expect(display).toMatchObject({
      mode: 'info',
      label: 'Ferdig spilt',
      source: 'showing',
    });
  });
});

describe('event page ticket resolution', () => {
  it('uses the selected showing for per-showing event pages', () => {
    const event = createEvent({
      ticketingMode: 'per_showing',
      ticketType: 'button',
      ticketStatus: 'available',
    });
    const showing = createShowing({
      ticketType: 'info',
      ticketInfoText: 'Ferdig spilt',
      ticketStatus: undefined,
      ticketUrl: undefined,
    });

    const display = resolveEventPageTicketDisplay(event, 'no', showing);

    expect(display).toMatchObject({
      mode: 'info',
      label: 'Ferdig spilt',
      source: 'showing',
    });
  });

  it('uses the English concluded text when present', () => {
    const event = createEvent({
      ticketType: 'info',
      ticketInfoText: 'This event has concluded',
    });

    const display = resolveEventPageTicketDisplay(event, 'en');
    expect(display.label).toBe('This event has concluded');
  });
});

describe('renderTicketDisplayHtml', () => {
  it('renders the same badge markup for info states used by the HTMX endpoint', () => {
    const html = renderTicketDisplayHtml(
      {
        mode: 'info',
        label: 'Ferdig spilt',
        isDisabled: true,
        source: 'shared_event',
      },
      (value) => value
    );

    expect(html).toBe('<span class="ticket-badge">Ferdig spilt</span>');
  });
});
