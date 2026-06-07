interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const serverCache = new Map<string, CacheEntry<unknown>>()

export function getCachedValue<T>(key: string): T | null {
  const entry = serverCache.get(key)

  if (!entry) {
    return null
  }

  if (Date.now() >= entry.expiresAt) {
    serverCache.delete(key)
    return null
  }

  return entry.value as T
}

export function setCachedValue<T>(key: string, value: T, ttlSeconds: number): T {
  serverCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  })

  return value
}

export async function getOrSetCachedValue<T>(
  key: string,
  ttlSeconds: number,
  producer: () => Promise<T>
): Promise<T> {
  const cached = getCachedValue<T>(key)
  if (cached !== null) {
    return cached
  }

  const value = await producer()
  return setCachedValue(key, value, ttlSeconds)
}

export function clearServerCache(): void {
  serverCache.clear()
}
