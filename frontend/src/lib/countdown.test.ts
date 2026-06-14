import { describe, expect, it } from 'vitest';
import { COUNTDOWN_STRINGS, buildAriaLabel, getTimeRemaining, getVisibleParts } from './countdown.js';

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

  it('keeps showing 0 minutes until expiry', () => {
    const visibleParts = getVisibleParts(
      { expired: false, days: 0, hours: 0, minutes: 0 },
      COUNTDOWN_STRINGS.no
    );

    expect(visibleParts).toEqual([
      { value: 0, label: 'minutter' }
    ]);
  });

  it('builds an aria label from the visible parts', () => {
    const visibleParts = getVisibleParts(
      { expired: false, days: 0, hours: 1, minutes: 2 },
      COUNTDOWN_STRINGS.en
    );

    expect(buildAriaLabel(
      { expired: false, days: 0, hours: 1, minutes: 2 },
      visibleParts,
      COUNTDOWN_STRINGS.en,
      COUNTDOWN_STRINGS.en.completedMessage
    )).toBe('Countdown: 1 hour, 2 minutes remaining');
  });
});
