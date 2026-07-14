import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearServerCache, getOrSetCachedValue } from './serverCache';

describe('serverCache', () => {
  beforeEach(async () => {
    await clearServerCache();
  });

  it('reuses shared values and caches null results', async () => {
    const producer = vi.fn().mockResolvedValue(null);

    await expect(getOrSetCachedValue('nullable', 300, producer)).resolves.toBeNull();
    await expect(getOrSetCachedValue('nullable', 300, producer)).resolves.toBeNull();

    expect(producer).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent cache misses', async () => {
    let resolveProducer: (value: string) => void = () => undefined;
    const producer = vi.fn(() => new Promise<string>((resolve) => {
      resolveProducer = resolve;
    }));

    const first = getOrSetCachedValue('concurrent', 300, producer);
    const second = getOrSetCachedValue('concurrent', 300, producer);
    await vi.waitFor(() => expect(producer).toHaveBeenCalledTimes(1));

    resolveProducer('value');
    await expect(Promise.all([first, second])).resolves.toEqual(['value', 'value']);
  });

  it('expires all content entries through the global tag', async () => {
    const producer = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second');

    await expect(getOrSetCachedValue('tagged', 300, producer)).resolves.toBe('first');
    await clearServerCache();
    await expect(getOrSetCachedValue('tagged', 300, producer)).resolves.toBe('second');
  });
});
