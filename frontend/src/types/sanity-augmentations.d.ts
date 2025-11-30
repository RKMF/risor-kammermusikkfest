/**
 * Minimal Astro/Sanity type augmentations to align with shared schema types.
 */

import type {SanityClient} from '@sanity/client'
import type { EventResult, ArtistResult, ArticleResult } from '../lib/sanity/queries'

declare global {
  namespace Astro {
    interface Props {
      event?: EventResult
      artist?: ArtistResult
      article?: ArticleResult
      homepage?: any // Homepage type not commonly used in props
      content_no?: any[]
      content_en?: any[]
    }
  }
}

declare module 'sanity:client' {
  interface SanityClientConfig {
    projectId: string
    dataset: string
    apiVersion: string
    useCdn?: boolean
    token?: string
    perspective?: 'published' | 'drafts'
    stega?: boolean
  }

  const sanityClient: SanityClient
  export {sanityClient}
}
