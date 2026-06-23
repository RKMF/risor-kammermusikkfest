import { describe, expect, it } from 'vitest';
import {
  buildEventDayCards,
  getProgramCardTimesText,
  getProgramCardVenueText,
  type EventDayCard,
} from './eventOccurrences';
import type { EventResult } from './sanity/queries';

function createDayCard(overrides: Partial<EventDayCard> = {}): EventDayCard {
  return {
    _id: 'event-1:date-1',
    event: {
      _id: 'event-1',
      _type: 'event',
      title: 'Testarrangement',
      slug_no: { current: 'testarrangement' },
      slug_en: { current: 'test-event' },
    } as EventResult,
    occurrenceKey: 'date-1',
    eventDate: {
      _id: 'date-1',
      date: '2026-06-23',
      title: 'Tirsdag 23. juni',
    },
    showings: [
      {
        _key: 'showing-1',
        startTime: '12:00',
        endTime: '13:00',
        venue: {
          _id: 'venue-1',
          title: 'Torvet',
        },
      },
    ],
    venue: {
      _id: 'venue-1',
      title: 'Torvet',
    },
    hasMultipleShowings: false,
    showingCount: 1,
    ...overrides,
  };
}

describe('event occurrence program card summaries', () => {
  it('returns empty times text for single-showing day cards', () => {
    expect(getProgramCardTimesText(createDayCard(), 'no')).toBe('');
  });

  it('summarizes two times inline for multi-showing day cards', () => {
    const dayCard = createDayCard({
      hasMultipleShowings: true,
      showingCount: 2,
      showings: [
        { _key: 'showing-1', startTime: '12:00' },
        { _key: 'showing-2', startTime: '15:00' },
      ],
    });

    expect(getProgramCardTimesText(dayCard, 'no')).toBe('12:00 og 15:00');
    expect(getProgramCardTimesText(dayCard, 'en')).toBe('12:00 and 15:00');
  });

  it('uses fallback copy when a day has more than two times', () => {
    const dayCard = createDayCard({
      hasMultipleShowings: true,
      showingCount: 3,
      showings: [
        { _key: 'showing-1', startTime: '12:00' },
        { _key: 'showing-2', startTime: '15:00' },
        { _key: 'showing-3', startTime: '18:00' },
      ],
    });

    expect(getProgramCardTimesText(dayCard, 'no')).toBe('Se alle tidspunkt');
    expect(getProgramCardTimesText(dayCard, 'en')).toBe('See all times');
  });

  it('returns one venue when all showings share the same venue', () => {
    const dayCard = createDayCard({
      hasMultipleShowings: true,
      showingCount: 2,
      showings: [
        { _key: 'showing-1', venue: { _id: 'venue-1', title: 'Torvet' } },
        { _key: 'showing-2', venue: { _id: 'venue-1', title: 'Torvet' } },
      ],
    });

    expect(getProgramCardVenueText(dayCard, 'no')).toBe('Torvet');
  });

  it('uses fallback copy when a day spans multiple venues', () => {
    const dayCard = createDayCard({
      hasMultipleShowings: true,
      showingCount: 2,
      showings: [
        { _key: 'showing-1', venue: { _id: 'venue-1', title: 'Torvet' } },
        { _key: 'showing-2', venue: { _id: 'venue-2', title: 'Risør kirke' } },
      ],
    });

    expect(getProgramCardVenueText(dayCard, 'no')).toBe('Se alle spillesteder');
    expect(getProgramCardVenueText(dayCard, 'en')).toBe('See all venues');
  });
});

describe('buildEventDayCards', () => {
  function createEvent(showings: NonNullable<EventResult['showings']>): EventResult {
    return {
      _id: 'event-1',
      _type: 'event',
      title: 'Testarrangement',
      slug_no: { current: 'testarrangement' },
      slug_en: { current: 'test-event' },
      showings,
    };
  }

  it('renders one program card per day for events with multiple showings', () => {
    const dayCards = buildEventDayCards([
      createEvent([
        {
          _key: 'showing-1',
          eventDate: { _id: 'date-1', date: '2026-06-24', title: 'Onsdag 24. juni' },
          startTime: '10:00',
          endTime: '11:00',
        },
        {
          _key: 'showing-2',
          eventDate: { _id: 'date-1', date: '2026-06-24', title: 'Onsdag 24. juni' },
          startTime: '13:00',
          endTime: '14:00',
        },
        {
          _key: 'showing-3',
          eventDate: { _id: 'date-2', date: '2026-06-25', title: 'Torsdag 25. juni' },
          startTime: '10:00',
          endTime: '11:00',
        },
        {
          _key: 'showing-4',
          eventDate: { _id: 'date-2', date: '2026-06-25', title: 'Torsdag 25. juni' },
          startTime: '13:00',
          endTime: '14:00',
        },
      ]),
    ]);

    expect(dayCards).toHaveLength(2);
    expect(dayCards.map((card) => card.eventDate.date)).toEqual(['2026-06-24', '2026-06-25']);
    expect(dayCards.map((card) => card.showings.map((showing) => showing.startTime))).toEqual([
      ['10:00', '13:00'],
      ['10:00', '13:00'],
    ]);
  });

  it('re-sorts the event to the next remaining showing when an earlier day is removed', () => {
    const dayCards = buildEventDayCards([
      createEvent([
        {
          _key: 'showing-3',
          eventDate: { _id: 'date-2', date: '2026-06-25', title: 'Torsdag 25. juni' },
          startTime: '10:00',
          endTime: '11:00',
        },
        {
          _key: 'showing-4',
          eventDate: { _id: 'date-2', date: '2026-06-25', title: 'Torsdag 25. juni' },
          startTime: '13:00',
          endTime: '14:00',
        },
      ]),
    ]);

    expect(dayCards).toHaveLength(1);
    expect(dayCards[0]?.eventDate.date).toBe('2026-06-25');
    expect(dayCards[0]?.showings.map((showing) => showing.startTime)).toEqual(['10:00', '13:00']);
  });

  it('re-sorts the event to the next remaining time on the same day when the earliest showing is removed', () => {
    const dayCards = buildEventDayCards([
      createEvent([
        {
          _key: 'showing-2',
          eventDate: { _id: 'date-1', date: '2026-06-24', title: 'Onsdag 24. juni' },
          startTime: '13:00',
          endTime: '14:00',
        },
        {
          _key: 'showing-3',
          eventDate: { _id: 'date-2', date: '2026-06-25', title: 'Torsdag 25. juni' },
          startTime: '10:00',
          endTime: '11:00',
        },
      ]),
    ]);

    expect(dayCards).toHaveLength(2);
    expect(dayCards[0]?.eventDate.date).toBe('2026-06-24');
    expect(dayCards[0]?.showings.map((showing) => showing.startTime)).toEqual(['13:00']);
  });
});
