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
});
