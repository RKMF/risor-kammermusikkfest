export interface HomepageSchedule {
  startDate?: string;
  endDate?: string;
}

export interface HomepageCacheInput {
  homePageType?: string;
  scheduledPeriod?: HomepageSchedule;
  nextScheduledStart?: string;
}

const DEFAULT_HOMEPAGE_CACHE_MAX_AGE = 3600;
const SCHEDULED_HOMEPAGE_CACHE_MAX_AGE = 60;
const HOMEPAGE_CACHE_MAX_AGE_CAP = 60;
const UPCOMING_BOUNDARY_WINDOW_MS = 10 * 60 * 1000;

function parseDate(value?: string): number | null {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function getHomepageCacheMaxAge(
  homepage: HomepageCacheInput | null | undefined,
  now = Date.now()
): number {
  if (!homepage) {
    return Math.min(DEFAULT_HOMEPAGE_CACHE_MAX_AGE, HOMEPAGE_CACHE_MAX_AGE_CAP);
  }

  if (homepage.homePageType === 'scheduled') {
    return Math.min(SCHEDULED_HOMEPAGE_CACHE_MAX_AGE, HOMEPAGE_CACHE_MAX_AGE_CAP);
  }

  const nextScheduledStart = parseDate(homepage.nextScheduledStart);
  if (nextScheduledStart !== null && nextScheduledStart > now) {
    const timeUntilNextStart = nextScheduledStart - now;
    if (timeUntilNextStart <= UPCOMING_BOUNDARY_WINDOW_MS) {
      return Math.min(SCHEDULED_HOMEPAGE_CACHE_MAX_AGE, HOMEPAGE_CACHE_MAX_AGE_CAP);
    }
  }

  return Math.min(DEFAULT_HOMEPAGE_CACHE_MAX_AGE, HOMEPAGE_CACHE_MAX_AGE_CAP);
}
