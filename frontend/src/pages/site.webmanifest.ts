import type { APIRoute } from 'astro';

const manifest = {
  name: 'Risør Kammermusikkfest',
  short_name: 'RKMF',
  start_url: '/',
  scope: '/',
  display: 'browser',
  lang: 'no',
  dir: 'ltr',
  background_color: '#f3f5ef',
  theme_color: '#1b198f',
  icons: [
    {
      src: '/favicon.svg',
      sizes: 'any',
      type: 'image/svg+xml',
      purpose: 'any',
    },
    {
      src: '/apple-touch-icon.png',
      sizes: '180x180',
      type: 'image/png',
      purpose: 'any',
    },
  ],
};

export const GET: APIRoute = async () =>
  new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
