import { getCache } from '@vercel/functions'

export const CONTENT_CACHE_TAG = 'rkmf:content'
export const CONTENT_CACHE_TTL_SECONDS = 5 * 60

interface CachedValue<T> {
  value: T
}

const runtimeCache = getCache({ namespace: 'rkmf-content-v1' })
const pendingValues = new Map<string, Promise<unknown>>()

export async function getOrSetCachedValue<T>(
  key: string,
  ttlSeconds: number,
  producer: () => Promise<T>
): Promise<T> {
  try {
    const cached = await runtimeCache.get(key) as CachedValue<T> | null
    if (cached !== null) {
      return cached.value
    }
  } catch (error) {
    console.error(`Runtime Cache read failed for "${key}"`, error)
  }

  const pending = pendingValues.get(key) as Promise<T> | undefined
  if (pending) {
    return pending
  }

  const produced = producer()
    .then(async (value) => {
      try {
        await runtimeCache.set(
          key,
          { value } satisfies CachedValue<T>,
          {
            name: key.slice(0, 120),
            tags: [CONTENT_CACHE_TAG],
            ttl: ttlSeconds,
          }
        )
      } catch (error) {
        console.error(`Runtime Cache write failed for "${key}"`, error)
      }

      return value
    })
    .finally(() => {
      pendingValues.delete(key)
    })

  pendingValues.set(key, produced)
  return produced
}

export async function clearServerCache(): Promise<void> {
  pendingValues.clear()
  await runtimeCache.expireTag(CONTENT_CACHE_TAG)
}
