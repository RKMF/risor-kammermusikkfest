/**
 * Build internal URL from Sanity page reference
 * Handles bilingual routing and all document types
 */

type Language = 'no' | 'en'

interface PageReference {
  _type: string
  slug?: string
  slug_no?: string
  slug_en?: string
}

/**
 * Builds the correct internal URL for a Sanity document reference
 * @param reference - The page reference from Sanity
 * @param language - Current language ('no' or 'en')
 * @returns The formatted URL path
 */
export function buildInternalUrl(reference: PageReference, language: Language = 'no'): string {
  const {_type, slug, slug_no, slug_en} = reference

  // Select the correct slug based on language
  const selectedSlug = language === 'en' ? slug_en || slug || slug_no : slug_no || slug || slug_en

  // Language prefix for English routes
  const langPrefix = language === 'en' ? '/en' : ''

  // Map document types to their URL patterns
  switch (_type) {
    case 'homepage':
      return langPrefix || '/'

    case 'programPage':
      return `${langPrefix}/program`

    case 'artistPage':
      return language === 'en' ? '/en/artists' : '/artister'

    case 'articlePage':
      return language === 'en' ? '/en/articles' : '/artikler'

    case 'event':
      if (!selectedSlug) return `${langPrefix}/program`
      return `${langPrefix}/program/${selectedSlug}`

    case 'artist':
      if (!selectedSlug) return language === 'en' ? '/en/artists' : '/artister'
      return language === 'en' ? `/en/artists/${selectedSlug}` : `/artister/${selectedSlug}`

    case 'article':
      if (!selectedSlug) return language === 'en' ? '/en/articles' : '/artikler'
      return language === 'en' ? `/en/articles/${selectedSlug}` : `/artikler/${selectedSlug}`

    case 'page':
      if (!selectedSlug) return langPrefix || '/'
      return `${langPrefix}/${selectedSlug}`

    default:
      // Fallback for unknown types
      console.warn(`Unknown document type for internal link: ${_type}`)
      return langPrefix || '/'
  }
}

/**
 * Detect language from Astro URL path
 * @param pathname - Current URL pathname
 * @returns 'en' if path starts with /en, otherwise 'no'
 */
export function detectLanguageFromPath(pathname: string): Language {
  return pathname.startsWith('/en') ? 'en' : 'no'
}
