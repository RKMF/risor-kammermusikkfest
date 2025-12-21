import { sanityClient } from 'sanity:client';
import { QueryBuilder, buildQueryParams, type QueryDefinition, type QueryOptions } from './queryBuilder.js';
import { transformMultilingualDocument, detectLanguage, type Language } from '../utils/language.js';

// Development mode flag for debug logging
const isDevelopment = import.meta.env.DEV;

// Cache configuration - disabled for instant content updates
// Sanity's CDN (useCdn: true) handles caching; no need to double-cache here.
// With SSR mode, this allows content changes in Sanity to appear immediately.
const CACHE_DURATION = {
  homepage: 0,
  page: 0,
  events: 0,
  articles: 0,
  artists: 0,
  default: 0
};

// In-memory cache
interface CacheEntry {
  data: any;
  timestamp: number;
  duration: number;
}

const cache = new Map<string, CacheEntry>();

// Cache utilities
function getCacheKey(query: string, params: any): string {
  return `${query}:${JSON.stringify(params)}`;
}

function isExpired(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp > entry.duration * 1000;
}

function getFromCache(key: string): any | null {
  const entry = cache.get(key);
  if (!entry || isExpired(entry)) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: any, duration: number): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    duration
  });
}

// Data service class
export class SanityDataService {
  private client: typeof sanityClient;
  private defaultOptions: QueryOptions;
  private language: Language;

  constructor(options: QueryOptions = {}, language: Language = 'no') {
    this.client = sanityClient;
    this.language = language;
    this.defaultOptions = {
      perspective: 'published',
      useCdn: true,
      ...options
    };
  }

  // Execute query with caching and multilingual transformation
  async fetch<T = unknown>(
    definition: QueryDefinition<T>,
    options: QueryOptions = {},
    cacheKey?: string,
    cacheDuration?: number,
    transformMultilingual: boolean = true
  ): Promise<T> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const queryParams = buildQueryParams(mergedOptions);
    const {query, params} = definition;

    // Generate cache key including language
    const finalCacheKey = cacheKey || getCacheKey(query, { ...params, ...queryParams, lang: this.language });

    // Check cache first
    const cached = getFromCache(finalCacheKey);
    if (cached) {
      if (isDevelopment) console.log('[DataService] Returning cached result for:', finalCacheKey);
      return cached;
    }

    // Fetch from Sanity with error handling
    if (isDevelopment) console.log('[DataService] Executing GROQ query:', { query, params, queryParams });

    let data: unknown;
    try {
      data = await this.client.fetch(query, params, queryParams);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[DataService] Sanity fetch failed:', message);
      throw new Error(`Failed to fetch data from Sanity: ${message}`);
    }

    if (isDevelopment) console.log('[DataService] Query returned:', data ? 'data' : 'null');

    // Transform multilingual data if requested
    const transformedData = transformMultilingual
      ? this.transformData(data)
      : data;

    // Cache the result
    const duration = cacheDuration || CACHE_DURATION.default;
    setCache(finalCacheKey, transformedData, duration);

    return transformedData;
  }

  // Transform data to include language-aware fields
  private transformData(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => transformMultilingualDocument(item, this.language));
    }
    return transformMultilingualDocument(data, this.language);
  }

  // Homepage methods
  async getHomepage(options: QueryOptions = {}) {
    return this.fetch(
      QueryBuilder.homepage(),
      options,
      'homepage',
      CACHE_DURATION.homepage
    );
  }

  // Page methods
  async getPageBySlug(slug: string, options: QueryOptions = {}) {
    if (isDevelopment) console.log('[DataService.getPageBySlug] Called with:', { slug, language: this.language });
    const result = await this.fetch(
      QueryBuilder.pageBySlug(slug, this.language),
      options,
      `page:${slug}:${this.language}`,
      CACHE_DURATION.page
    );
    if (isDevelopment) console.log('[DataService.getPageBySlug] Result:', result ? 'Found' : 'NULL');
    return result;
  }

  async getProgramPage(options: QueryOptions = {}) {
    return this.fetch(
      QueryBuilder.programPage(this.language),
      options,
      `programPage:${this.language}`,
      CACHE_DURATION.page
    );
  }

  async getArtistPage(options: QueryOptions = {}) {
    return this.fetch(
      QueryBuilder.artistPage(this.language),
      options,
      `artistPage:${this.language}`,
      CACHE_DURATION.page
    );
  }

  async getArticlePage(options: QueryOptions = {}) {
    return this.fetch(
      QueryBuilder.articlePage(this.language),
      options,
      `articlePage:${this.language}`,
      CACHE_DURATION.page
    );
  }

  async getSponsorPage(options: QueryOptions = {}) {
    return this.fetch(
      QueryBuilder.sponsorPage(this.language),
      options,
      `sponsorPage:${this.language}`,
      CACHE_DURATION.page
    );
  }

  // Article methods
  async getArticleBySlug(slug: string, options: QueryOptions = {}) {
    if (isDevelopment) console.log('[DataService] Getting article by slug:', slug, 'language:', this.language);
    const result = await this.fetch(
      QueryBuilder.articleBySlug(slug, this.language),
      options,
      `article:${slug}:${this.language}`,
      CACHE_DURATION.articles
    );
    if (isDevelopment) console.log('[DataService] Article query result:', result ? 'Found' : 'Not found');
    return result;
  }

  async getPublishedArticles(options: QueryOptions = {}) {
    return this.fetch(
      QueryBuilder.publishedArticles(),
      options,
      'articles:published',
      CACHE_DURATION.articles
    );
  }

  // Artist methods
  async getArtistBySlug(slug: string, options: QueryOptions = {}) {
    return this.fetch(
      QueryBuilder.artistBySlug(slug, this.language),
      options,
      `artist:${slug}:${this.language}`,
      CACHE_DURATION.artists
    );
  }

  // Event methods
  async getEventBySlug(slug: string, options: QueryOptions = {}) {
    if (isDevelopment) console.log('[DataService] Fetching event with slug:', slug, 'language:', this.language);
    const result = await this.fetch(
      QueryBuilder.eventBySlug(slug, this.language),
      options,
      `event:${slug}:${this.language}`,
      CACHE_DURATION.events
    );
    if (isDevelopment) console.log('[DataService] Event query result:', result ? 'Found' : 'Not found');
    return result;
  }

  // Slug generation for static paths
  async getSlugsForType(type: string, options: QueryOptions = {}) {
    return this.fetch(
      QueryBuilder.slugsForType(type),
      options,
      `slugs:${type}`,
      CACHE_DURATION.default,
      false // Don't transform multilingual data for slug arrays
    );
  }

  // Cache management
  clearCache(): void {
    cache.clear();
  }

  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: cache.size,
      entries: Array.from(cache.keys())
    };
  }

}

// Create default instance with Visual Editing support
export function createDataService(request?: Request): SanityDataService {
  const perspective = request?.headers.get('cookie')?.includes('sanity-preview-mode=true')
    ? 'drafts'
    : 'published';

  // Detect language from request
  const language = detectLanguage(request);

  return new SanityDataService({
    perspective,
    useCdn: perspective === 'published',
    token: import.meta.env.SANITY_API_READ_TOKEN,
    stega: import.meta.env.PUBLIC_SANITY_VISUAL_EDITING_ENABLED === 'true'
  }, language);
}

// Default export for convenience
export const dataService = new SanityDataService();
