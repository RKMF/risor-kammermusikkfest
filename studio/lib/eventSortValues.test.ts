import { describe, expect, it } from 'vitest';

import {
  getEventScheduleEntryCount,
  getPrimaryEventScheduleDetails,
  getPrimaryEventSortValuesFromReferences,
} from './eventSortValues';

describe('eventSortValues', () => {
  it('sorts multi-occurrence showings by the earliest date and time', () => {
    const dateByRef = new Map([
      ['date-24', '2026-06-24'],
      ['date-23', '2026-06-23'],
      ['date-25', '2026-06-25'],
    ]);

    expect(
      getPrimaryEventSortValuesFromReferences(
        {
          showings: [
            { eventDate: { _ref: 'date-24' }, startTime: '13:00' },
            { eventDate: { _ref: 'date-23' }, startTime: '14:00' },
            { eventDate: { _ref: 'date-23' }, startTime: '11:15' },
            { eventDate: { _ref: 'date-25' }, startTime: '10:00' },
          ],
        },
        dateByRef
      )
    ).toEqual({
      eventDateValue: '2026-06-23',
      eventStartTimeValue: '11:15',
    });
  });

  it('falls back to legacy single-date events when showings are missing', () => {
    const dateByRef = new Map([['legacy-date', '2026-06-26']]);

    expect(
      getPrimaryEventSortValuesFromReferences(
        {
          eventDate: { _ref: 'legacy-date' },
          eventTime: { startTime: '18:00' },
        },
        dateByRef
      )
    ).toEqual({
      eventDateValue: '2026-06-26',
      eventStartTimeValue: '18:00',
    });
  });

  it('uses the earliest showing within a legacy occurrence', () => {
    const dateByRef = new Map([
      ['date-24', '2026-06-24'],
      ['date-23', '2026-06-23'],
    ]);

    expect(
      getPrimaryEventSortValuesFromReferences(
        {
          occurrences: [
            {
              eventDate: { _ref: 'date-24' },
              showings: [{ startTime: '15:00' }, { startTime: '13:00' }],
            },
            {
              eventDate: { _ref: 'date-23' },
              showings: [{ startTime: '12:00' }],
            },
          ],
        },
        dateByRef
      )
    ).toEqual({
      eventDateValue: '2026-06-23',
      eventStartTimeValue: '12:00',
    });
  });

  it('clears sort values when no valid showings or fallback date remain', () => {
    const dateByRef = new Map([['date-23', '2026-06-23']]);

    expect(
      getPrimaryEventSortValuesFromReferences(
        {
          showings: [{ startTime: '12:00' }, { eventDate: { _ref: 'missing-date' }, startTime: '14:00' }],
        },
        dateByRef
      )
    ).toEqual({});
  });

  it('marks the preview as multi-occurrence when more than one schedule entry exists', () => {
    expect(
      getPrimaryEventScheduleDetails({
        showings: [
          {
            eventDate: {
              date: '2026-06-23',
              title_display_no: 'Tirsdag 23. juni',
            },
            startTime: '12:00',
          },
          {
            eventDate: {
              date: '2026-06-24',
              title_display_no: 'Onsdag 24. juni',
            },
            startTime: '12:00',
          },
        ],
      })
    ).toEqual({
      eventDateValue: '2026-06-23',
      eventStartTimeValue: '12:00',
      dateLabelNo: 'Tirsdag 23. juni',
      dateLabelEn: undefined,
      hasMultipleEntries: true,
    });
  });

  it('counts multiple showings inside one occurrence as multiple schedule entries', () => {
    expect(
      getEventScheduleEntryCount({
        occurrences: [
          {
            showings: [{}, {}],
          },
        ],
      })
    ).toBe(2);
  });

  it('marks the preview as multi-occurrence when one occurrence has multiple showings', () => {
    expect(
      getPrimaryEventScheduleDetails({
        occurrences: [
          {
            eventDate: {
              date: '2026-06-23',
              title_display_no: 'Tirsdag 23. juni',
            },
            showings: [{ startTime: '12:00' }, { startTime: '14:00' }],
          },
        ],
      })
    ).toEqual({
      eventDateValue: '2026-06-23',
      eventStartTimeValue: '12:00',
      dateLabelNo: 'Tirsdag 23. juni',
      dateLabelEn: undefined,
      hasMultipleEntries: true,
    });
  });
});
