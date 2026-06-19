import { describe, expect, it } from 'vitest';
import {
  buildCalendarEventDetails,
  buildGoogleCalendarUrl,
  buildIcsContent,
  buildOutlookCalendarUrl,
  combineDateAndTimeInTimeZone,
  escapeIcsText,
  formatUtcCalendarTimestamp,
} from './calendar';
import type { EventResult } from './sanity/queries';

function createEvent(overrides: Partial<EventResult> = {}): EventResult {
  return {
    _id: 'event-1',
    _type: 'event',
    title: 'Åpningskonsert',
    excerpt: 'Festivalstart i sentrum',
    slug_no: { current: 'apningskonsert' },
    slug_en: { current: 'opening-concert' },
    eventDate: {
      _id: 'date-1',
      date: '2026-06-27',
      title: 'Lørdag 27. juni',
    },
    eventTime: {
      startTime: '19:30',
      endTime: '21:00',
    },
    venue: {
      _id: 'venue-1',
      title: 'Risør kirke',
    },
    showings: [
      {
        eventDate: {
          _id: 'date-1',
          date: '2026-06-27',
          title: 'Lørdag 27. juni',
        },
        _key: 'showing-1',
        startTime: '19:30',
        endTime: '21:00',
        venue: {
          _id: 'venue-1',
          title: 'Risør kirke',
        },
        ticketType: 'button',
        ticketStatus: 'available',
      },
    ],
    occurrences: [
      {
        _key: 'occurrence-legacy',
        eventDate: {
          _id: 'date-1',
          date: '2026-06-27',
          title: 'Lørdag 27. juni',
        },
        showings: [
          {
            _key: 'showing-legacy',
            startTime: '19:30',
            endTime: '21:00',
            venue: {
              _id: 'venue-1',
              title: 'Risør kirke',
            },
            ticketType: 'button',
            ticketStatus: 'available',
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe('calendar helpers', () => {
  it('converts Oslo local time to UTC across daylight saving time', () => {
    expect(combineDateAndTimeInTimeZone('2026-06-27', '19:30')?.toISOString()).toBe(
      '2026-06-27T17:30:00.000Z'
    );

    expect(combineDateAndTimeInTimeZone('2026-12-27', '19:30')?.toISOString()).toBe(
      '2026-12-27T18:30:00.000Z'
    );
  });

  it('builds calendar event details with the localized event URL', () => {
    const request = new Request('https://kammermusikkfest.no/en/program/opening-concert');
    const details = buildCalendarEventDetails(createEvent(), 'en', request);

    expect(details).not.toBeNull();
    expect(details?.url).toBe('https://kammermusikkfest.no/en/program/opening-concert');
    expect(details?.start.toISOString()).toBe('2026-06-27T17:30:00.000Z');
    expect(details?.end.toISOString()).toBe('2026-06-27T19:00:00.000Z');
  });

  it('returns null when required fields are missing or invalid', () => {
    expect(
      buildCalendarEventDetails(
        createEvent({
          showings: [
            {
              eventDate: {
                _id: 'date-1',
                date: '2026-06-27',
                title: 'Lørdag 27. juni',
              },
              _key: 'showing-1',
              startTime: '19:30',
            },
          ],
          eventTime: { startTime: '19:30' },
        }),
        'no'
      )
    ).toBeNull();

    expect(
      buildCalendarEventDetails(
        createEvent({
          showings: [
            {
              eventDate: {
                _id: 'date-1',
                date: '2026-06-27',
                title: 'Lørdag 27. juni',
              },
              _key: 'showing-1',
              startTime: '21:00',
              endTime: '19:30',
            },
          ],
          eventTime: { startTime: '21:00', endTime: '19:30' },
        }),
        'no'
      )
    ).toBeNull();
  });

  it('builds provider URLs with encoded event data', () => {
    const details = buildCalendarEventDetails(createEvent(), 'no', new Request('https://kammermusikkfest.no/program/apningskonsert'));
    if (!details) {
      throw new Error('Expected calendar details');
    }

    const googleUrl = new URL(buildGoogleCalendarUrl(details));
    const outlookUrl = new URL(buildOutlookCalendarUrl(details));

    expect(googleUrl.origin).toBe('https://calendar.google.com');
    expect(googleUrl.searchParams.get('text')).toBe('Åpningskonsert');
    expect(googleUrl.searchParams.get('dates')).toBe('20260627T173000Z/20260627T190000Z');
    expect(googleUrl.searchParams.get('location')).toBe('Risør kirke');

    expect(outlookUrl.origin).toBe('https://outlook.office.com');
    expect(outlookUrl.searchParams.get('subject')).toBe('Åpningskonsert');
    expect(outlookUrl.searchParams.get('startdt')).toBe('2026-06-27T17:30:00.000Z');
    expect(outlookUrl.searchParams.get('enddt')).toBe('2026-06-27T19:00:00.000Z');
  });

  it('uses occurrence showings when the event has multiple dates', () => {
    const details = buildCalendarEventDetails(
      createEvent({
        showings: [
          {
            eventDate: {
              _id: 'date-1',
              date: '2026-06-27',
              title: 'Lørdag 27. juni',
            },
            _key: 'showing-1',
            startTime: '11:00',
            endTime: '12:00',
            venue: {
              _id: 'venue-2',
              title: 'Risør bibliotek',
            },
            ticketType: 'info',
            ticketInfoText: 'Gratis',
          },
        ],
      }),
      'no',
      new Request('https://kammermusikkfest.no/program/apningskonsert')
    );

    expect(details?.start.toISOString()).toBe('2026-06-27T09:00:00.000Z');
    expect(details?.location).toBe('Risør bibliotek');
  });

  it('formats and escapes ICS content safely', () => {
    const timestamp = formatUtcCalendarTimestamp(new Date('2026-06-27T17:30:00.000Z'));
    expect(timestamp).toBe('20260627T173000Z');
    expect(escapeIcsText('Line 1, Line 2; Test\\Check\nNext')).toBe(
      'Line 1\\, Line 2\\; Test\\\\Check\\nNext'
    );

    const details = buildCalendarEventDetails(
      createEvent({
        title: 'Åpningskonsert, del 1',
        excerpt: 'Programlinje\nmed linjeskift',
      }),
      'no',
      new Request('https://kammermusikkfest.no/program/apningskonsert')
    );

    if (!details) {
      throw new Error('Expected calendar details');
    }

    const ics = buildIcsContent(details);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('SUMMARY:Åpningskonsert\\, del 1');
    expect(ics).toContain('DESCRIPTION:Programlinje med linjeskift\\n\\nhttps://kammermusikkfest.no/pro');
    expect(ics).toContain('\r\n gram/apningskonsert');
    expect(ics).toContain('LOCATION:Risør kirke');
  });
});
