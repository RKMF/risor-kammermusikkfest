/**
 * Minimal Astro type augmentations to align with shared schema types.
 */

import type { EventResult, ArtistResult, ArticleResult } from '../lib/sanity/queries'

declare global {
  namespace Astro {
    interface Props {
      event?: EventResult
      artist?: ArtistResult
      article?: ArticleResult
      homepage?: any
      content_no?: any[]
      content_en?: any[]
    }
  }
}
