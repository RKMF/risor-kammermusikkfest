import { sanityClient } from './client';
import { QueryBuilder, buildQueryParams, type QueryDefinition, type QueryOptions } from './queryBuilder.js';
import { transformMultilingualDocument, detectLanguage, type Language } from '../utils/language.js';
import {
  CONTENT_CACHE_TTL_SECONDS,
  clearServerCache,
  getOrSetCachedValue,
} from '../serverCache.js';

// Development mode flag for debug logging
const isDevelopment = import.meta.env.DEV;

const CACHE_DURATION = {
  homepage: CONTENT_CACHE_TTL_SECONDS,
  page: CONTENT_CACHE_TTL_SECONDS,
  slugIndex: CONTENT_CACHE_TTL_SECONDS,
  events: CONTENT_CACHE_TTL_SECONDS,
  articles: CONTENT_CACHE_TTL_SECONDS,
  artists: CONTENT_CACHE_TTL_SECONDS,
  default: CONTENT_CACHE_TTL_SECONDS
};

// Cache utilities
function getCacheKey(query: string, params: any): string {
  return `${query}:${JSON.stringify(params)}`;
}

function getRequestTag(cacheKey: string): string {
  const category = cacheKey.split(':', 1)[0].replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
  return `query.${category || 'content'}`;
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
    transformMultilingual: boolean = true,
    bypassCache: boolean = false
  ): Promise<T> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const queryParams = buildQueryParams(mergedOptions);
    const {query, params} = definition;

    // Generate cache key including language
    const finalCacheKey = cacheKey || getCacheKey(query, { ...params, ...queryParams, lang: this.language });

    const duration = cacheDuration ?? CACHE_DURATION.default;
    const executeQuery = async () => {
      if (isDevelopment) console.log('[DataService] Executing GROQ query:', { query, params, queryParams });

      let data: unknown;
      try {
        data = await this.client.fetch(query, params, {
          ...queryParams,
          tag: queryParams.tag ?? getRequestTag(finalCacheKey),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[DataService] Sanity fetch failed:', message);
        throw new Error(`Failed to fetch data from Sanity: ${message}`);
      }

      if (isDevelopment) console.log('[DataService] Query returned:', data ? 'data' : 'null');
      return transformMultilingual ? this.transformData(data) : data;
    };

    const isPublicPublishedQuery = (
      mergedOptions.perspective === 'published' &&
      mergedOptions.useCdn !== false &&
      !mergedOptions.token
    );

    if (bypassCache || !isPublicPublishedQuery) {
      return executeQuery() as Promise<T>;
    }

    return getOrSetCachedValue<T>(finalCacheKey, duration, executeQuery as () => Promise<T>);
  }

  private getSlugIndexCacheKey(kind: string, options: QueryOptions = {}): string {
    const mergedOptions = { ...this.defaultOptions, ...options };
    return `slug-index:${kind}:${this.language}:${mergedOptions.perspective ?? 'published'}`
  }

  private async getSlugIndex(
    kind: 'page' | 'article' | 'artist' | 'event',
    options: QueryOptions = {},
    bypassCache: boolean = false
  ): Promise<Set<string>> {
    const definition = {
      page: QueryBuilder.pageSlugs(this.language),
      article: QueryBuilder.articleSlugs(this.language),
      artist: QueryBuilder.artistSlugs(),
      event: QueryBuilder.eventSlugs(this.language),
    }[kind]

    const slugs = await this.fetch(
      definition,
      options,
      this.getSlugIndexCacheKey(kind, options),
      CACHE_DURATION.slugIndex,
      false,
      bypassCache
    )

    return new Set((slugs as string[]).filter((slug): slug is string => typeof slug === 'string' && slug.length > 0))
  }

  private async hasKnownSlug(
    kind: 'page' | 'article' | 'artist' | 'event',
    slug: string,
    options: QueryOptions = {}
  ): Promise<boolean> {
    const cachedSlugs = await this.getSlugIndex(kind, options)
    return cachedSlugs.has(slug)
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
      QueryBuilder.homepage(this.language),
      options,
      `homepage:${this.language}`,
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

  async hasPageSlug(slug: string, options: QueryOptions = {}) {
    return this.hasKnownSlug('page', slug, options)
  }

  async getProgramPage(options: QueryOptions = {}) {
    return this.fetch(
      QueryBuilder.programPage(this.language),
      options,
      `programPage:${this.language}`,
      CACHE_DURATION.events
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

  async hasArticleSlug(slug: string, options: QueryOptions = {}) {
    return this.hasKnownSlug('article', slug, options)
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

  async hasArtistSlug(slug: string, options: QueryOptions = {}) {
    return this.hasKnownSlug('artist', slug, options)
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

  async getProgramFilterData(options: QueryOptions = {}) {
    return this.fetch(
      QueryBuilder.programFilterData(this.language),
      options,
      `programFilterData:${this.language}`,
      CACHE_DURATION.events
    );
  }

  async hasEventSlug(slug: string, options: QueryOptions = {}) {
    return this.hasKnownSlug('event', slug, options)
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
  async clearCache(): Promise<void> {
    await clearServerCache();
  }

}

// Create a request-aware data service for published content.
export function createDataService(request?: Request): SanityDataService {
  // Detect language from request
  const language = detectLanguage(request);

  return new SanityDataService({
    perspective: 'published',
    useCdn: true,
    stega: false
  }, language);
}

// Default export for convenience
export const dataService = new SanityDataService();
