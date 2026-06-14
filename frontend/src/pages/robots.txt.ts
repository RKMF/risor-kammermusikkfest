import type { APIRoute } from 'astro';
import { getSiteUrl } from '../lib/site';
const isStagingSite = import.meta.env.PUBLIC_SITE_ENV === 'staging';

function getRobotsText(): string {
  const siteUrl = getSiteUrl();

  if (isStagingSite) {
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
    '# Keep faceted program filters out of crawler queues',
    'Disallow: /program?*date=',
    'Disallow: /program?*venue=',
    'Disallow: /en/program?*date=',
    'Disallow: /en/program?*venue=',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
  ].join('\n');
}

export const GET: APIRoute = async () =>
  new Response(`${getRobotsText()}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
