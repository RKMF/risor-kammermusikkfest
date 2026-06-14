import { describe, expect, it, vi } from 'vitest';
import { getAbsoluteUrl, getSiteUrl } from './site';

describe('site helpers', () => {
  it('uses the configured production site URL by default', () => {
    vi.stubEnv('SITE_URL', 'https://kammermusikkfest.no/');

    expect(getSiteUrl()).toBe('https://kammermusikkfest.no');
    expect(getAbsoluteUrl('/en/program')).toBe('https://kammermusikkfest.no/en/program');
  });
});
