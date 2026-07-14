export const prerender = false;

import type { APIRoute } from 'astro';
import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook';
import { clearServerCache } from '../../../lib/serverCache.js';
import { getSecurityHeaders } from '../../../lib/security.js';

const MAX_WEBHOOK_BODY_BYTES = 64 * 1024;

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...getSecurityHeaders(),
    },
  });
}

export const POST: APIRoute = async ({ request }) => {
  const secret = import.meta.env.SANITY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('Sanity webhook secret is not configured');
    return jsonResponse({ error: 'Webhook unavailable' }, 503);
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_WEBHOOK_BODY_BYTES) {
    return jsonResponse({ error: 'Payload too large' }, 413);
  }

  const signature = request.headers.get(SIGNATURE_HEADER_NAME);
  if (!signature) {
    return jsonResponse({ error: 'Invalid signature' }, 401);
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_WEBHOOK_BODY_BYTES) {
    return jsonResponse({ error: 'Payload too large' }, 413);
  }

  if (!await isValidSignature(rawBody, signature, secret)) {
    return jsonResponse({ error: 'Invalid signature' }, 401);
  }

  if (
    request.headers.get('sanity-project-id') !== 'dnk98dp0' ||
    request.headers.get('sanity-dataset') !== 'production'
  ) {
    return jsonResponse({ error: 'Invalid Sanity source' }, 403);
  }

  try {
    await clearServerCache();
    return jsonResponse({ revalidated: true }, 200);
  } catch (error) {
    console.error('Sanity webhook cache invalidation failed', error);
    return jsonResponse({ error: 'Cache invalidation failed' }, 500);
  }
};
