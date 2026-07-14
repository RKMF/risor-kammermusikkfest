import { afterEach, describe, expect, it, vi } from 'vitest';
import { encodeSignatureHeader, SIGNATURE_HEADER_NAME } from '@sanity/webhook';
import { POST } from './sanity';

const SECRET = 'test-webhook-secret';

async function createRequest(
  body: string,
  overrides: Record<string, string> = {}
): Promise<Request> {
  const signature = await encodeSignatureHeader(body, Date.now(), SECRET);
  return new Request('https://www.kammermusikkfest.no/api/webhooks/sanity', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      [SIGNATURE_HEADER_NAME]: signature,
      'sanity-project-id': 'dnk98dp0',
      'sanity-dataset': 'production',
      ...overrides,
    },
    body,
  });
}

describe('Sanity webhook', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('expires content cache for a valid signed request', async () => {
    vi.stubEnv('SANITY_WEBHOOK_SECRET', SECRET);
    const request = await createRequest(JSON.stringify({ _type: 'event' }));

    const response = await POST({ request } as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ revalidated: true });
  });

  it('rejects an invalid signature', async () => {
    vi.stubEnv('SANITY_WEBHOOK_SECRET', SECRET);
    const request = await createRequest(JSON.stringify({ _type: 'event' }), {
      [SIGNATURE_HEADER_NAME]: 'invalid',
    });

    const response = await POST({ request } as never);
    expect(response.status).toBe(401);
  });

  it('rejects a signed request from another Sanity project', async () => {
    vi.stubEnv('SANITY_WEBHOOK_SECRET', SECRET);
    const request = await createRequest(JSON.stringify({ _type: 'event' }), {
      'sanity-project-id': 'different-project',
    });

    const response = await POST({ request } as never);
    expect(response.status).toBe(403);
  });
});
