import type { FilteredResponseQueryOptions, QueryParams } from '@sanity/client'
import { CONTENT_CACHE_TTL_SECONDS, getOrSetCachedValue } from '../serverCache.js'
import { sanityClient } from './client.js'

interface CachedFetchOptions {
  queryOptions?: FilteredResponseQueryOptions
  ttlSeconds?: number
}

function getRequestTag(name: string): string {
  const normalized = name.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase()
  return `query.${normalized}`
}

export function cachedSanityFetch<T>(
  name: string,
  query: string,
  params: QueryParams = {},
  options: CachedFetchOptions = {}
): Promise<T> {
  const key = `sanity:${name}:${JSON.stringify(params)}`

  return getOrSetCachedValue(
    key,
    options.ttlSeconds ?? CONTENT_CACHE_TTL_SECONDS,
    () => sanityClient.fetch<T>(query, params, {
      ...options.queryOptions,
      perspective: 'published',
      useCdn: true,
      tag: options.queryOptions?.tag ?? getRequestTag(name),
    })
  )
}
