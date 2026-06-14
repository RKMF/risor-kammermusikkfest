import type { APIRoute } from 'astro';
import { getSiteUrl } from '../../lib/site';

function getExpiryTimestamp(): string {
  const expiresAt = new Date();
  expiresAt.setUTCFullYear(expiresAt.getUTCFullYear() + 1);
  return expiresAt.toISOString();
}

export const GET: APIRoute = async () => {
  const siteUrl = getSiteUrl();
  const body = [
    '# Security Policy for Risør Kammermusikkfest',
    '# https://securitytxt.org/',
    '',
    'Contact: mailto:webmaster@kammermusikkfest.no',
    'Preferred-Languages: no, en',
    `Canonical: ${siteUrl}/.well-known/security.txt`,
    `Expires: ${getExpiryTimestamp()}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
