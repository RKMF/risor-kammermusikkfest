import { describe, expect, it } from 'vitest';
import { getHomepageCacheMaxAge } from './homepageScheduling';

describe('getHomepageCacheMaxAge', () => {
  const now = new Date('2026-06-01T10:00:00.000Z').getTime();

  it('uses short cache for an active scheduled homepage', () => {
    expect(
      getHomepageCacheMaxAge(
        {
          homePageType: 'scheduled',
          scheduledPeriod: {
            startDate: '2026-06-01T09:00:00.000Z',
            endDate: '2026-06-01T12:00:00.000Z',
          },
        },
        now
      )
    ).toBe(60);
  });

  it('uses short cache when the next scheduled homepage starts soon', () => {
    expect(
      getHomepageCacheMaxAge(
        {
          homePageType: 'default',
          nextScheduledStart: '2026-06-01T10:09:00.000Z',
        },
        now
      )
    ).toBe(60);
  });

  it('keeps relaxed cache when no boundary is near', () => {
    expect(
      getHomepageCacheMaxAge(
        {
          homePageType: 'default',
          nextScheduledStart: '2026-06-01T10:15:00.000Z',
        },
        now
      )
    ).toBe(3600);
  });

  it('falls back to default cache when no homepage is configured', () => {
    expect(getHomepageCacheMaxAge(null, now)).toBe(3600);
  });
});

