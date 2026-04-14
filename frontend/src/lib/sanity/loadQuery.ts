/**
 * Core Sanity data fetching wrapper for the frontend.
 *
 * Provides a typed interface for executing GROQ queries with the shared Sanity client.
 * Used by all page data fetching throughout the site.
 *
 * @see docs/PROJECT_GUIDE.md - Section 2.1 Sanity CMS
 */

import { type QueryParams } from '@sanity/client'
import { sanityClient } from './client'

/**
 * Execute a GROQ query against the Sanity dataset.
 *
 * Returns the raw query result wrapped in a data object.
 *
 * @param options.query - GROQ query string (use defineQuery for type generation)
 * @param options.params - Optional query parameters (always use params, never interpolate)
 * @returns Object containing the query result as `data`
 */
export async function loadQuery<QueryResponse>({
  query,
  params,
}: {
  query: string
  params?: QueryParams
}) {
  const { result } = await sanityClient.fetch<QueryResponse>(
    query,
    params ?? {},
    { filterResponse: false }
  )

  return {
    data: result,
  }
}
