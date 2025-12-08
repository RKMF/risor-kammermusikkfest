/**
 * Language detection and selection utilities
 */

export type Language = 'no' | 'en';

/**
 * Default language for the site
 */
export const DEFAULT_LANGUAGE: Language = 'no';

/**
 * Available languages
 */
export const AVAILABLE_LANGUAGES: Language[] = ['no', 'en'];

/**
 * Language labels for display
 */
export const LANGUAGE_LABELS: Record<Language, string> = {
  no: 'Norsk',
  en: 'English'
};

/**
 * Base interface for documents with bilingual content
 * Provides type safety for language-specific fields
 */
export interface BilingualDocument {
  title_no?: string;
  title_en?: string;
  excerpt_no?: string;
  excerpt_en?: string;
  slug_no?: { current: string };
  slug_en?: { current: string };
  content_no?: unknown[];
  content_en?: unknown[];
  description_no?: string;
  description_en?: string;
  extraContent_no?: unknown[];
  extraContent_en?: unknown[];
  // Allow additional properties for flexibility
  [key: string]: unknown;
}

/**
 * Get language from URL or request
 * Detects language based on /en/ prefix in URL path
 */
export function detectLanguage(request?: Request, url?: URL): Language {
  // Try to get URL from request if not provided
  const requestUrl = url || (request ? new URL(request.url) : null);

  // Check if URL path starts with /en/
  if (requestUrl?.pathname.startsWith('/en/') || requestUrl?.pathname === '/en') {
    return 'en';
  }

  // Default to Norwegian
  return DEFAULT_LANGUAGE;
}

/**
 * Get multilingual field value with fallback
 * Returns Norwegian value first, then English as fallback
 */
export function getMultilingualValue<T>(
  values: { [key: string]: T } | undefined,
  fieldName: string,
  language: Language = DEFAULT_LANGUAGE
): T | undefined {
  if (!values) return undefined;

  // Try the requested language first
  const primaryField = `${fieldName}_${language}`;
  if (values[primaryField]) {
    return values[primaryField];
  }

  // Fallback to the other language
  const fallbackLanguage = language === 'no' ? 'en' : 'no';
  const fallbackField = `${fieldName}_${fallbackLanguage}`;
  if (values[fallbackField]) {
    return values[fallbackField];
  }

  // Legacy fallback - try the field without language suffix
  if (values[fieldName]) {
    return values[fieldName];
  }

  return undefined;
}

/**
 * Get slug with language preference
 */
export function getMultilingualSlug(
  item: BilingualDocument | undefined,
  language: Language = DEFAULT_LANGUAGE
): { current: string } | undefined {
  if (!item) return undefined;

  const slug = getMultilingualValue(item, 'slug', language);
  if (slug && typeof slug === 'object' && 'current' in slug) {
    return slug as { current: string };
  }

  // Legacy fallback
  if (item.slug && typeof item.slug === 'object' && 'current' in item.slug) {
    return item.slug as { current: string };
  }

  return undefined;
}

/**
 * Create multilingual GROQ field selector
 * Returns a GROQ fragment that selects multilingual fields with fallbacks
 * Priority order changes based on language: English pages get English first, Norwegian pages get Norwegian first
 */
export function createMultilingualField(fieldName: string, language: Language = DEFAULT_LANGUAGE): string {
  if (language === 'en') {
    return `"${fieldName}": coalesce(${fieldName}_en, ${fieldName}_no, ${fieldName})`;
  }
  return `"${fieldName}": coalesce(${fieldName}_no, ${fieldName}_en, ${fieldName})`;
}

/**
 * Create multilingual slug selector
 */
export function createMultilingualSlug(): string {
  return `"slug": coalesce(slug_no, slug_en, slug)`;
}

/**
 * Transform Sanity document to include convenience fields
 * Adds fallback values for title, slug, content, etc. based on language preference
 */
export function transformMultilingualDocument<T extends BilingualDocument>(
  doc: T | null | undefined,
  language: Language = DEFAULT_LANGUAGE
): T | null {
  if (!doc) return null;

  const transformed: BilingualDocument = { ...doc };

  // Add convenience fields with language-aware fallbacks
  const multilingualFields = ['title', 'content', 'excerpt', 'description'];

  multilingualFields.forEach(field => {
    const value = getMultilingualValue(doc, field, language);
    if (value !== undefined) {
      transformed[field] = value;
    }
  });

  // Handle slug specially
  const slug = getMultilingualSlug(doc, language);
  if (slug) {
    transformed.slug = slug;
  }

  // Handle content arrays specially
  if (doc.content_no || doc.content_en) {
    const contentValue = getMultilingualValue(doc, 'content', language);
    if (contentValue && Array.isArray(contentValue)) {
      transformed.content = contentValue;
    }
  }

  return transformed as T;
}

/**
 * Get content array with language preference
 * Returns the appropriate content array based on language preference
 */
export function getMultilingualContent(
  doc: BilingualDocument | undefined,
  language: Language = DEFAULT_LANGUAGE
): any[] | undefined {
  if (!doc) return undefined;

  // Try the requested language first
  const primaryField = `content_${language}`;
  if (doc[primaryField] && Array.isArray(doc[primaryField])) {
    return doc[primaryField];
  }

  // Fallback to the other language
  const fallbackLanguage = language === 'no' ? 'en' : 'no';
  const fallbackField = `content_${fallbackLanguage}`;
  if (doc[fallbackField] && Array.isArray(doc[fallbackField])) {
    return doc[fallbackField];
  }

  // Legacy fallback
  if (doc.content && Array.isArray(doc.content)) {
    return doc.content;
  }

  return undefined;
}