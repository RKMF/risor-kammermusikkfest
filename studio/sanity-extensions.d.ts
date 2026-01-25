/**
 * Sanity Module Augmentations
 *
 * Extends Sanity's type definitions to include runtime properties
 * that exist in Sanity Studio but aren't in official type definitions.
 *
 * @see https://www.sanity.io/docs/reference-type
 */

import 'sanity'
import '@sanity/types'

/**
 * Context object passed to Sanity array filter functions
 */
export interface SanityFilterContext {
  document: {
    _id?: string
    _type?: string
    [key: string]: unknown
  }
  parent: Array<{ _ref?: string; _key?: string }> | undefined
}

/**
 * Sort configuration for reference fields
 */
export interface SanitySortOption {
  field: string
  direction: 'asc' | 'desc'
}

declare module 'sanity' {
  interface ArrayOptions<V = unknown> {
    /**
     * Filter function for reference arrays - excludes items from picker
     * @see https://www.sanity.io/docs/reference-type#filter
     */
    filter?: (context: SanityFilterContext) => {
      filter: string
      params: Record<string, unknown>
    }
  }
}

declare module '@sanity/types' {
  interface ReferenceBaseOptions {
    /**
     * Sort order for reference field pickers
     * @see https://www.sanity.io/docs/reference-type
     */
    sort?: ReadonlyArray<SanitySortOption>
  }
}

export {}
