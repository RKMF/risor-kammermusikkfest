import type { APIRoute } from 'astro';
import { getSiteUrl } from '../lib/site';
const isStagingSite = import.meta.env.PUBLIC_SITE_ENV === 'staging';

export function buildRobotsText(siteUrl: string, staging: boolean): string {
  if (staging) {
    return [
      '# Staging site: do not index',
      'User-agent: *',
      'Disallow: /',
    ].join('\n');
  }

  return [
    '# Risør Kammermusikkfest - robots.txt',
    '# Production site: index public content only',
    'User-agent: *',
    'Allow: /',
    '',
    '# Keep API endpoints out of crawler queues',
    'Disallow: /api/',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
  ].join('\n');
}

export const GET: APIRoute = async () =>
  new Response(`${buildRobotsText(getSiteUrl(), isStagingSite)}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
