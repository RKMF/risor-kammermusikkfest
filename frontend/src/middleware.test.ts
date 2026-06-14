import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildMissHeaders, getEarlyResponseStatus, isDynamicDetailRoutePath } from './middleware';
import { onRequest } from './middleware';

describe('middleware path hardening', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('marks known probe paths for early 404 handling', () => {
    expect(getEarlyResponseStatus('/wp-login.php')).toBe(404);
    expect(getEarlyResponseStatus('/wp-admin/install.php')).toBe(404);
    expect(getEarlyResponseStatus('/.env.production')).toBe(404);
    expect(getEarlyResponseStatus('/cgi-bin/test')).toBe(404);
  });

  it('preserves 410s for intentionally gone paths', () => {
    expect(getEarlyResponseStatus('/support')).toBe(410);
  });

  it('recognizes dynamic detail route paths', () => {
    expect(isDynamicDetailRoutePath('/festival-info')).toBe(true);
    expect(isDynamicDetailRoutePath('/en/festival-info')).toBe(true);
    expect(isDynamicDetailRoutePath('/artikler/news-item')).toBe(true);
    expect(isDynamicDetailRoutePath('/en/program/opening-night')).toBe(true);
    expect(isDynamicDetailRoutePath('/api/health')).toBe(false);
  });

  it('builds shared miss headers', () => {
    const headers = buildMissHeaders() as Record<string, string>;

    expect(headers['Cache-Control']).toBe('public, s-maxage=60, stale-while-revalidate=300');
    expect(headers['X-Robots-Tag']).toBe('noindex, nofollow');
  });

  it('adds discovery link headers to HTML responses', async () => {
    vi.stubEnv('SITE_URL', 'https://kammermusikkfest.no');

    const response = await onRequest(
      {
        request: new Request('https://kammermusikkfest.no/'),
      } as any,
      async () =>
        new Response('<html></html>', {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
          },
        })
    );

    const linkHeader = response.headers.get('Link');

    expect(linkHeader).toContain('</llms.txt>; rel="alternate"; type="text/plain"');
    expect(linkHeader).toContain('</sitemap.xml>; rel="sitemap"; type="application/xml"');
    expect(linkHeader).toContain('</.well-known/security.txt>; rel="security"');
    expect(linkHeader).toContain('</site.webmanifest>; rel="manifest"');
  });
});
