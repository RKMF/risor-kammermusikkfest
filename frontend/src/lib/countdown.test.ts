import { describe, expect, it } from 'vitest';
import { COUNTDOWN_STRINGS, getTimeRemaining, getVisibleParts } from './countdown.js';

describe('countdown helpers', () => {
  it('recomputes minutes and hours correctly across a rollover', () => {
    const beforeHourRollover = new Date('2026-06-14T10:58:00.000Z');
    const targetDate = new Date('2026-06-14T12:00:00.000Z');

    expect(getTimeRemaining(targetDate, beforeHourRollover)).toEqual({
      expired: false,
      days: 0,
      hours: 1,
      minutes: 2
    });

    const afterHourRollover = new Date('2026-06-14T11:03:00.000Z');
    expect(getTimeRemaining(targetDate, afterHourRollover)).toEqual({
      expired: false,
      days: 0,
      hours: 0,
      minutes: 57
    });
  });

  it('builds visible parts with localized labels', () => {
    const visibleParts = getVisibleParts(
      { expired: false, days: 1, hours: 2, minutes: 1 },
      COUNTDOWN_STRINGS.en
    );

    expect(visibleParts).toEqual([
      { value: 1, label: 'day' },
      { value: 2, label: 'hours' },
      { value: 1, label: 'minute' }
    ]);
  });
});
