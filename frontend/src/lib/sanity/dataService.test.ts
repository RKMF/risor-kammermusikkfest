import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SanityDataService } from './dataService';

describe('SanityDataService slug index caching', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let service: SanityDataService;

  beforeEach(() => {
    fetchMock = vi.fn();
    service = new SanityDataService({}, 'no');
    (service as any).client = { fetch: fetchMock };
    service.clearCache();
  });

  it('reuses the cached slug index for known slugs', async () => {
    fetchMock.mockResolvedValueOnce(['known-slug']);

    await expect(service.hasPageSlug('known-slug')).resolves.toBe(true);
    await expect(service.hasPageSlug('known-slug')).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('refreshes the slug index once when a warm cache misses', async () => {
    fetchMock
      .mockResolvedValueOnce(['known-slug'])
      .mockResolvedValueOnce(['known-slug']);

    await expect(service.hasPageSlug('missing-slug')).resolves.toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('bypasses the Sanity CDN for event slug lookups', async () => {
    fetchMock.mockResolvedValueOnce(['known-event']);

    await expect(service.hasEventSlug('known-event')).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[2]).toMatchObject({
      perspective: 'published',
      useCdn: false,
    });
  });
});

describe('SanityDataService event freshness and multilingual transforms', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let service: SanityDataService;

  beforeEach(() => {
    fetchMock = vi.fn();
    service = new SanityDataService({}, 'no');
    (service as any).client = { fetch: fetchMock };
    service.clearCache();
  });

  it('bypasses the Sanity CDN for event detail reads', async () => {
    fetchMock.mockResolvedValueOnce({
      _id: 'event-1',
      _type: 'event',
      title_no: 'Testarrangement',
      slug_no: { current: 'testarrangement' },
    });

    await service.getEventBySlug('testarrangement');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[2]).toMatchObject({
      perspective: 'published',
      useCdn: false,
    });
  });

  it('promotes localized ticket info text onto transformed event documents', async () => {
    fetchMock.mockResolvedValueOnce({
      _id: 'event-1',
      _type: 'event',
      title_no: 'Testarrangement',
      slug_no: { current: 'testarrangement' },
      ticketType: 'info',
      ticketInfoText_no: 'Ferdigspilt',
      ticketInfoText_en: 'Concert has concluded',
      extraContent_no: [{ _type: 'block' }],
    });

    const event = await service.getEventBySlug('testarrangement');

    expect(event).toMatchObject({
      ticketInfoText: 'Ferdigspilt',
      extraContent: [{ _type: 'block' }],
    });
  });
});
