import { describe, expect, it, vi } from 'vitest';
import { getAbsoluteUrl, getSiteUrl } from './site';

describe('site helpers', () => {
  it('uses the configured production site URL by default', () => {
    vi.stubEnv('SITE_URL', 'https://www.kammermusikkfest.no/');

    expect(getSiteUrl()).toBe('https://www.kammermusikkfest.no');
    expect(getAbsoluteUrl('/en/program')).toBe('https://www.kammermusikkfest.no/en/program');
  });
});
