import type { APIRoute } from 'astro';

const SITE_URL = import.meta.env.SITE_URL || 'https://kammermusikkfest.no';
const isStagingSite = import.meta.env.PUBLIC_SITE_ENV === 'staging';

function getRobotsText(): string {
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
    '# Keep preview and API endpoints out of crawler queues',
    'Disallow: /api/',
    'Disallow: /preview',
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
  ].join('\n');
}

export const GET: APIRoute = async () =>
  new Response(`${getRobotsText()}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
