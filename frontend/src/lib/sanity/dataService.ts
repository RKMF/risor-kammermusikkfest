import { sanityClient } from 'sanity:client';
import { QueryBuilder, buildQueryParams, type QueryDefinition, type QueryOptions } from './queryBuilder.js';
import { transformMultilingualDocument, detectLanguage, type Language } from '../utils/language.js';

// Cache configuration - shorter cache in development
const isDevelopment = import.meta.env.DEV;

const CACHE_DURATION = {
  homepage: isDevelopment ? 1 : 3600, // 1 sec dev, 1 hour prod
  page: isDevelopment ? 1 : 7200, // 1 sec dev, 2 hours prod
  events: isDevelopment ? 1 : 300, // 1 sec dev, 5 minutes prod
  articles: isDevelopment ? 1 : 1800, // 1 sec dev, 30 minutes prod
  artists: isDevelopment ? 1 : 3600, // 1 sec dev, 1 hour prod
  default: isDevelopment ? 1 : 1800 // 1 sec dev, 30 minutes prod
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
  async fetch<T = any>(
    definition: QueryDefinition,
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
      console.log('[DataService] Returning cached result for:', finalCacheKey);
      return cached;
    }

    // Fetch from Sanity
    console.log('[DataService] Executing GROQ query:', { query, params, queryParams });
    const data = await this.client.fetch(query, params, queryParams);
    console.log('[DataService] Query returned:', data ? 'data' : 'null');

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
    console.log('[DataService.getPageBySlug] Called with:', { slug, language: this.language });
    const result = await this.fetch(
      QueryBuilder.pageBySlug(slug, this.language),
      options,
      `page:${slug}:${this.language}`,
      CACHE_DURATION.page
    );
    console.log('[DataService.getPageBySlug] Result:', result ? 'Found' : 'NULL');
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

  // Article methods
  async getArticleBySlug(slug: string, options: QueryOptions = {}) {
    console.log('[DataService] Getting article by slug:', slug, 'language:', this.language);
    const result = await this.fetch(
      QueryBuilder.articleBySlug(slug, this.language),
      options,
      `article:${slug}:${this.language}`,
      CACHE_DURATION.articles
    );
    console.log('[DataService] Article query result:', result ? 'Found' : 'Not found');
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
    console.log('[DataService] Fetching event with slug:', slug, 'language:', this.language);
    const result = await this.fetch(
      QueryBuilder.eventBySlug(slug, this.language),
      options,
      `event:${slug}:${this.language}`,
      CACHE_DURATION.events
    );
    console.log('[DataService] Event query result:', result ? 'Found' : 'Not found');
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
