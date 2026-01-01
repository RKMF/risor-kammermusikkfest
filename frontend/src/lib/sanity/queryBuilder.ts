/**
 * GROQ Query Builder - Central query definitions for all Sanity content.
 *
 * Architecture:
 * - Component projections: Reusable GROQ fragments for each CMS component type
 * - Language-aware builders: Functions that generate queries with correct field coalescing
 * - QueryBuilder export: Type-safe interface for all page/content queries
 *
 * Key patterns:
 * - All image fields include full asset metadata (dimensions, LQIP, palette) per MEDIA.md
 * - Bilingual fields use createMultilingualField() for consistent language handling
 * - Publishing status filtering excludes drafts from public queries
 * - References are dereferenced inline with explicit projections (no blind spreading)
 *
 * @see docs/PROJECT_GUIDE.md - Section 2.1 GROQ Queries
 * @see docs/MEDIA.md - Image asset projection requirements
 */

import {defineQuery} from 'groq'
import {createMultilingualField, type Language} from '../utils/language.js'
import type { ArtistResult, EventResult, ArticleResult } from './queries'

/**
 * Type-safe query definition with typed params and expected result.
 * All QueryBuilder methods return this interface for consistent data fetching.
 */
export interface QueryDefinition<
  TResult = unknown,
  TParams extends Record<string, unknown> = Record<string, unknown>
> {
  query: ReturnType<typeof defineQuery>
  params: TParams
}

// ============================================================================
// COMPONENT PROJECTIONS
// ============================================================================
// Each CMS component type has an explicit GROQ projection. This avoids blind
// spreading (...) which can pull unnecessary data and break type safety.
//
// Structure:
// - Leaf components: Simple components that don't contain other components
// - Container components: Components that nest other components (use NESTED_ITEMS)
// - Image selections: Reusable image projections with full metadata
//
// Image pattern: All images include asset metadata for responsive optimization:
// - dimensions: For aspect ratio calculations and srcset generation
// - lqip: Low Quality Image Placeholder for loading states
// - palette: Dominant colors for placeholder backgrounds
// ============================================================================

// Leaf components (no nesting) - standalone content blocks
const IMAGE_COMPONENT = `
  _type == "imageComponent" => {
    _type,
    _key,
    "image": image{
      asset->{
        _id,
        url,
        metadata {
          dimensions {
            width,
            height,
            aspectRatio
          },
          lqip,
          palette {
            dominant {
              background,
              foreground
            }
          }
        }
      },
      hotspot,
      crop
    },
    "alt": alt,
    "caption": caption,
    "credit": credit,
    aspectRatio,
    size
  }`

const VIDEO_COMPONENT = `
  _type == "videoComponent" => {
    _type,
    _key,
    videoType,
    "video": video{
      asset->{
        _id,
        url,
        mimeType
      }
    },
    youtubeUrl,
    vimeoUrl,
    externalUrl,
    aspectRatio,
    title,
    description,
    autoplay,
    muted,
    controls,
    loop
  }`

const QUOTE_COMPONENT = `
  _type == "quoteComponent" => {
    ...
  }`

const SPOTIFY_COMPONENT = `
  _type == "spotifyComponent" => {
    ...
  }`

const LINK_COMPONENT = `
  _type == "linkComponent" => {
    _type,
    _key,
    links[]{
      linkType,
      text,
      url,
      description,
      openInNewTab,
      "internalLink": select(
        linkType == "internal" && defined(internalLink) => internalLink->{
          _type,
          "slug": coalesce(slug_no.current, slug_en.current, slug.current),
          "slug_no": slug_no.current,
          "slug_en": slug_en.current
        }
      )
    }
  }`

const HEADING_COMPONENT = `
  _type == "headingComponent" => {
    ...
  }`

const BUTTON_COMPONENT = `
  _type == "buttonComponent" => {
    ...
  }`

const COUNTDOWN_COMPONENT = `
  _type == "countdownComponent" => {
    ...
  }`

// Items that can be nested in containers
const NESTED_ITEMS = `
  ...,
  ${IMAGE_COMPONENT},
  ${VIDEO_COMPONENT},
  ${QUOTE_COMPONENT},
  ${SPOTIFY_COMPONENT},
  ${LINK_COMPONENT},
  ${HEADING_COMPONENT},
  ${BUTTON_COMPONENT},
  ${COUNTDOWN_COMPONENT}`

// Full content projection with all component types
const PAGE_CONTENT_WITH_LINKS = `
  ...,
  ${IMAGE_COMPONENT},
  ${VIDEO_COMPONENT},
  ${QUOTE_COMPONENT},
  ${SPOTIFY_COMPONENT},
  ${LINK_COMPONENT},
  ${HEADING_COMPONENT},
  ${BUTTON_COMPONENT},
  ${COUNTDOWN_COMPONENT},
  _type == "columnLayout" => {
    ...,
    items[]{${NESTED_ITEMS}}
  },
  _type == "contentScrollContainer" => {
    ...,
    items[]{${NESTED_ITEMS}}
  },
  _type == "artistScrollContainer" => {
    ...,
    items[]{${NESTED_ITEMS}}
  },
  _type == "eventScrollContainer" => {
    ...,
    items[]{${NESTED_ITEMS}}
  },
  _type == "accordionComponent" => {
    ...,
    panels[]{
      ...,
      content[]{${NESTED_ITEMS}}
    }
  },
  _type == "gridComponent" => {
    ...,
    items[]{${NESTED_ITEMS}}
  },
  _type == "twoColumnLayout" => {
    ...,
    leftColumn[]{${NESTED_ITEMS}},
    rightColumn[]{${NESTED_ITEMS}}
  },
  _type == "threeColumnLayout" => {
    ...,
    column1[]{${NESTED_ITEMS}},
    column2[]{${NESTED_ITEMS}},
    column3[]{${NESTED_ITEMS}}
  }`

const EVENT_IMAGE_SELECTION = `
  "image": {
    "image": image{
      asset->{
        _id,
        url,
        metadata {
          dimensions {
            width,
            height,
            aspectRatio
          },
          lqip,
          palette {
            dominant {
              background,
              foreground
            }
          }
        }
      },
      hotspot,
      crop
    },
    "alt": coalesce(imageAlt_no, imageAlt_en, image.alt),
    "credit": coalesce(imageCredit_no, imageCredit_en)
  }
`

const EVENT_DATE_SELECTION = `
  eventDate->{
    _id,
    date,
    title_display_no,
    title_display_en,
    "title": coalesce(title_display_no, title_display_en)
  }
`

/**
 * Build GROQ projection for event documents with language-aware field coalescing.
 * Includes all event data: titles, dates, venue, artists, composers, tickets, and content.
 *
 * @param language - Target language for field coalescing ('no' or 'en')
 */
const buildEventBaseFields = (language: Language = 'no'): string => `
  _id,
  _type,
  title_no,
  title_en,
  ${createMultilingualField('title', language)},
  slug_no,
  slug_en,
  "slug": coalesce(slug_no.current, slug_en.current, slug.current),
  excerpt_no,
  excerpt_en,
  ${createMultilingualField('excerpt', language)},
  description_no,
  description_en,
  ${createMultilingualField('description', language)},
  ${EVENT_IMAGE_SELECTION},
  ${EVENT_DATE_SELECTION},
  eventTime,
  venue->{
    _id,
    title,
    name,
    address,
    city,
    "slug": slug.current
  },
  "artists": artist[defined(@->) && (@->publishingStatus == "published" || !defined(@->publishingStatus))]->{
    _id,
    name,
    "slug": slug.current,
    ${ARTIST_IMAGE_SELECTION},
    instrument_no,
    instrument_en,
    ${createMultilingualField('instrument', language)},
    publishingStatus
  },
  "composers": composers[]->{
    _id,
    name,
    description_no,
    description_en,
    ${ARTIST_IMAGE_SELECTION}
  },
  ticketType,
  ticketUrl,
  ticketInfoText,
  ticketStatus,
  publishingStatus,
  scheduledPeriod,
  content_no[]{
    ${PAGE_CONTENT_WITH_LINKS}
  },
  content_en[]{
    ${PAGE_CONTENT_WITH_LINKS}
  },
  extraContent_no[]{
    ${PAGE_CONTENT_WITH_LINKS}
  },
  extraContent_en[]{
    ${PAGE_CONTENT_WITH_LINKS}
  },
  seo,
  spotifyItems[]{
    _key,
    _type,
    spotifyUrl
  }
`

const ARTIST_IMAGE_SELECTION = `
  "image": {
    "image": image{
      asset->{
        _id,
        url,
        metadata {
          dimensions {
            width,
            height,
            aspectRatio
          },
          lqip,
          palette {
            dominant {
              background,
              foreground
            }
          }
        }
      },
      hotspot,
      crop
    },
    "alt": coalesce(imageAlt_no, imageAlt_en, image.alt),
    "credit": coalesce(imageCredit_no, imageCredit_en)
  }
`

/**
 * Build GROQ projection for artist documents with language-aware field coalescing.
 * Includes artist data: name, instrument, country, image, bio content, and publishing status.
 *
 * @param language - Target language for field coalescing ('no' or 'en')
 */
const buildArtistBaseFields = (language: Language = 'no'): string => `
  _id,
  _type,
  name,
  cardSize,
  excerpt_no,
  excerpt_en,
  ${createMultilingualField('excerpt', language)},
  instrument_no,
  instrument_en,
  ${createMultilingualField('instrument', language)},
  country,
  ${ARTIST_IMAGE_SELECTION},
  "slug": slug.current,
  "slug_no": slug,
  "slug_en": slug,
  content_no[]{
    ${PAGE_CONTENT_WITH_LINKS}
  },
  content_en[]{
    ${PAGE_CONTENT_WITH_LINKS}
  },
  publishingStatus,
  scheduledPeriod,
  seo
`

const ARTICLE_IMAGE_SELECTION = `
  "image": {
    "image": image{
      asset->{
        _id,
        url,
        metadata {
          dimensions {
            width,
            height,
            aspectRatio
          },
          lqip,
          palette {
            dominant {
              background,
              foreground
            }
          }
        }
      },
      hotspot,
      crop
    },
    "alt": coalesce(imageAlt_no, imageAlt_en, image.alt),
    "credit": coalesce(imageCredit_no, imageCredit_en)
  }
`

/**
 * Build GROQ projection for article documents with language-aware field coalescing.
 * Includes article data: titles, slugs, excerpt, image, author, and content blocks.
 *
 * @param language - Target language for field coalescing ('no' or 'en')
 */
const buildArticleBaseFields = (language: Language = 'no'): string => `
  _id,
  _type,
  title_no,
  title_en,
  ${createMultilingualField('title', language)},
  slug_no,
  slug_en,
  "slug": coalesce(slug_no.current, slug_en.current, slug.current),
  ${createMultilingualField('excerpt', language)},
  ${ARTICLE_IMAGE_SELECTION},
  publishingStatus,
  scheduledPeriod,
  publishedAt,
  author->{
    _id,
    name,
    "slug": slug.current
  },
  content_no[]{
    ${PAGE_CONTENT_WITH_LINKS}
  },
  content_en[]{
    ${PAGE_CONTENT_WITH_LINKS}
  },
  seo
`

/**
 * Build GROQ filter for matching slugs with language priority.
 * For Norwegian: tries slug_no first, then slug_en, then legacy slug.
 * For English: tries slug_en first, then slug_no, then legacy slug.
 * This enables content to be found even when only one language slug exists.
 *
 * @param language - Target language determining slug priority order
 */
const buildSlugMatch = (language: Language = 'no'): string => {
  if (language === 'en') {
    // For English: prioritize slug_en, fallback to slug_no and legacy slug
    return `$slug in [slug_en.current, slug_no.current, slug.current]`
  }
  // For Norwegian (default): prioritize slug_no, fallback to slug_en and legacy slug
  return `$slug in [slug_no.current, slug_en.current, slug.current]`
}

/**
 * Build GROQ projection for slug field with language-aware coalescing.
 * Returns the most appropriate slug for the requested language with fallbacks.
 *
 * @param language - Target language determining coalesce priority
 */
const buildSlugProjection = (language: Language = 'no'): string => {
  if (language === 'en') {
    return `"slug": coalesce(slug_en.current, slug_no.current, slug.current)`
  }
  return `"slug": coalesce(slug_no.current, slug_en.current, slug.current)`
}

// Queries
const HOMEPAGE_QUERY = defineQuery(`*[_type == "homepage" && (
  homePageType == "default" ||
  (homePageType == "scheduled" && defined(scheduledPeriod.startDate) && scheduledPeriod.startDate <= now() && scheduledPeriod.endDate >= now())
)] | order(homePageType desc)[0]{
  _id,
  _type,
  ${createMultilingualField('title')},
  title_no,
  title_en,
  headerLinks_no[]{
    _key,
    linkType,
    text,
    description,
    url,
    "internalLink": select(
      linkType == "internal" && defined(internalLink) => internalLink->{
        _type,
        "slug": coalesce(slug_no.current, slug_en.current, slug.current),
        "slug_no": slug_no.current,
        "slug_en": slug_en.current
      }
    )
  },
  headerLinks_en[]{
    _key,
    linkType,
    text,
    description,
    url,
    "internalLink": select(
      linkType == "internal" && defined(internalLink) => internalLink->{
        _type,
        "slug": coalesce(slug_no.current, slug_en.current, slug.current),
        "slug_no": slug_no.current,
        "slug_en": slug_en.current
      }
    )
  },
  content_no[]{
    ${PAGE_CONTENT_WITH_LINKS}
  },
  content_en[]{
    ${PAGE_CONTENT_WITH_LINKS}
  },
  homePageType,
  scheduledPeriod,
  seo
}`)

// Language-aware query builders
const buildPageBySlugQuery = (language: Language = 'no') => defineQuery(`*[_type == "page" && ${buildSlugMatch(language)}][0]{
  _id,
  _type,
  ${createMultilingualField('title', language)},
  ${createMultilingualField('excerpt', language)},
  ${buildSlugProjection(language)},
  "slug_no": slug_no.current,
  "slug_en": slug_en.current,
  publishingStatus,
  content_no[]{
    ${PAGE_CONTENT_WITH_LINKS}
  },
  content_en[]{
    ${PAGE_CONTENT_WITH_LINKS}
  },
  seo
}`)

// Language-aware query builders for listing pages
const buildProgramPageQuery = (language: Language = 'no') => defineQuery(`*[_type == "programPage" && (publishingStatus != "draft" || !defined(publishingStatus))][0]{
  _id,
  _type,
  ${createMultilingualField('title', language)},
  "slug": slug.current,
  slug_no,
  slug_en,
  ${createMultilingualField('excerpt', language)},
  content_no[]{
    ${PAGE_CONTENT_WITH_LINKS}
  },
  content_en[]{
    ${PAGE_CONTENT_WITH_LINKS}
  },
  seo,
  "selectedEvents": selectedEvents[defined(@->) && (@->publishingStatus == "published" || !defined(@->publishingStatus))]->{
    ${buildEventBaseFields(language)}
  }
}`)

const buildArtistPageQuery = (language: Language = 'no') => defineQuery(`*[_type == "artistPage" && (publishingStatus != "draft" || !defined(publishingStatus))][0]{
  _id,
  _type,
  ${createMultilingualField('title', language)},
  "slug": slug.current,
  slug_no,
  slug_en,
  ${createMultilingualField('excerpt', language)},
  content_no[]{
    ${PAGE_CONTENT_WITH_LINKS}
  },
  content_en[]{
    ${PAGE_CONTENT_WITH_LINKS}
  },
  seo,
  "selectedArtists": selectedArtists[defined(@->) && (@->publishingStatus == "published" || !defined(@->publishingStatus))]->{
    ${buildArtistBaseFields(language)}
  }
}`)

// Helper to build sponsor base fields
const SPONSOR_IMAGE_SELECTION = `
  "logo": logo{
    asset->{
      _id,
      url,
      mimeType,
      metadata {
        dimensions {
          width,
          height,
          aspectRatio
        },
        lqip
      }
    },
    hotspot,
    crop
  }
`

const buildSponsorBaseFields = (): string => `
  _id,
  _type,
  name,
  ${SPONSOR_IMAGE_SELECTION},
  url
`

const buildSponsorPageQuery = (language: Language = 'no') => defineQuery(`*[_type == "sponsorPage" && (publishingStatus != "draft" || !defined(publishingStatus))][0]{
  _id,
  _type,
  ${createMultilingualField('title', language)},
  "slug": slug.current,
  slug_no,
  slug_en,
  ${createMultilingualField('excerpt', language)},
  content_no[]{
    ${PAGE_CONTENT_WITH_LINKS}
  },
  content_en[]{
    ${PAGE_CONTENT_WITH_LINKS}
  },
  seo,
  "selectedSponsors": selectedSponsors[]->{
    ${buildSponsorBaseFields()}
  }
}`)

const buildArticlePageQuery = (language: Language = 'no') => defineQuery(`*[_type == "articlePage" && (publishingStatus != "draft" || !defined(publishingStatus))][0]{
  _id,
  _type,
  ${createMultilingualField('title', language)},
  "slug": slug.current,
  slug_no,
  slug_en,
  ${createMultilingualField('excerpt', language)},
  content_no[]{
    ${PAGE_CONTENT_WITH_LINKS}
  },
  content_en[]{
    ${PAGE_CONTENT_WITH_LINKS}
  },
  seo,
  "articles": select(
    count(selectedArticles) > 0 => selectedArticles[defined(@->) && (@->publishingStatus == "published" || !defined(@->publishingStatus))]->{${buildArticleBaseFields(language)}},
    *[_type == "article" && publishingStatus != "draft"] | order(publishedAt desc){${buildArticleBaseFields(language)}}
  )
}`)

const buildEventBySlugQuery = (language: Language = 'no') => defineQuery(`*[_type == "event" && ${buildSlugMatch(language)}][0]{
  ${buildEventBaseFields(language)}
}`)

const buildArtistBySlugQuery = (language: Language = 'no') => defineQuery(`*[_type == "artist" && slug.current == $slug && (publishingStatus != "draft" || !defined(publishingStatus))][0]{
  ${buildArtistBaseFields(language)},
  instagram,
  facebook,
  spotify,
  youtube,
  websiteUrl,
  spotifyUrl,
  instagramUrl,
  "events": *[_type == "event" && references(^._id) && publishingStatus == "published"] | order(eventDate->date asc, eventTime.startTime asc){
    ${buildEventBaseFields(language)},
    ticketType,
    ticketUrl,
    ticketInfoText,
    ticketStatus
  }
}`)

const buildArticleBySlugQuery = (language: Language = 'no') => defineQuery(`*[_type == "article" && ${buildSlugMatch(language)}][0]{
  ${buildArticleBaseFields(language)}
}`)

const buildPublishedArticlesQuery = (language: Language = 'no') => defineQuery(`*[_type == "article" && publishingStatus != "draft"] | order(publishedAt desc){
  ${buildArticleBaseFields(language)}
}`)

const buildPublishedArtistsQuery = (language: Language = 'no') => defineQuery(`*[_type == "artist" && publishingStatus != "draft"] | order(name asc){
  ${buildArtistBaseFields(language)}
}`)

const buildPublishedEventsQuery = (language: Language = 'no') => defineQuery(`*[_type == "event" && publishingStatus == "published"] | order(eventDate->date asc, eventTime.startTime asc){
  ${buildEventBaseFields(language)}
}`)

const EVENT_DATES_QUERY = defineQuery(`*[_type == "eventDate" && isActive == true] | order(date asc){
  _id,
  date,
  title_display_no,
  title_display_en,
  "title": coalesce(title_display_no, title_display_en),
  slug_no,
  slug_en,
  "slug_no": slug_no.current,
  "slug_en": slug_en.current
}`)

const buildEventsByDateQuery = (language: Language = 'no') => defineQuery(`*[_type == "event" && publishingStatus == "published" && eventDate._ref == $dateId] | order(eventTime.startTime asc){
  ${buildEventBaseFields(language)}
}`)


const SLUGS_FOR_TYPE_QUERY = defineQuery(`*[_type == $type && (defined(slug.current) || defined(slug_no.current) || defined(slug_en.current))]{
  "params": {
    "slug": coalesce(slug_no.current, slug_en.current, slug.current)
  }
}`)

const buildSearchContentQuery = (language: Language = 'no') => defineQuery(`*[_type in $types && (
  coalesce(title_no, title_en, title) match $search ||
  coalesce(excerpt_no, excerpt_en, excerpt) match $search
)] | order(_updatedAt desc){
  _id,
  _type,
  ${createMultilingualField('title', language)},
  ${createMultilingualField('excerpt', language)},
  "slug": coalesce(slug_no.current, slug_en.current, slug.current)
}`)

const SITE_SETTINGS_MENU_QUERY = defineQuery(`*[_id == "siteSettings"][0]{
  menuItems[]->{
    _id,
    _type,
    "title_no": select(
      _type == "homepage" => coalesce(title_no, "Hjem"),
      _type in ["programPage", "artistPage", "articlePage", "sponsorPage"] => coalesce(title_no, title),
      _type == "page" => coalesce(title_no, title_en, "Page")
    ),
    "title_en": select(
      _type == "homepage" => coalesce(title_en, "Home"),
      _type in ["programPage", "artistPage", "articlePage", "sponsorPage"] => coalesce(title_en, title),
      _type == "page" => coalesce(title_en, title_no, "Page")
    ),
    "slug_no": select(
      _type == "homepage" => "/",
      _type == "programPage" => "/program",
      _type == "artistPage" => "/artister",
      _type == "articlePage" => "/artikler",
      _type == "sponsorPage" => "/sponsorer",
      _type == "page" => "/" + coalesce(slug_no.current, slug_en.current, "")
    ),
    "slug_en": select(
      _type == "homepage" => "/en",
      _type == "programPage" => "/en/program",
      _type == "artistPage" => "/en/artists",
      _type == "articlePage" => "/en/articles",
      _type == "sponsorPage" => "/en/sponsors",
      _type == "page" => "/en/" + coalesce(slug_en.current, slug_no.current, "")
    )
  },
  "symbolLogo": logos[name == "Symbol"][0]{
    name,
    "image": image{
      asset->{
        _id,
        url,
        mimeType
      },
      hotspot,
      crop
    }
  }
}`)

const SITE_SETTINGS_FOOTER_QUERY = defineQuery(`*[_id == "siteSettings"][0]{
  email,
  phone,
  address,
  linkUrl,
  openInNewTab,
  organizationName_no,
  organizationName_en,
  newsletterUrl,
  newsletterTitle_no,
  newsletterTitle_en,
  socialMedia[]{
    name,
    url
  },
  "symbolLogo": logos[name == "Symbol"][0]{
    name,
    "image": image{
      asset->{
        _id,
        url,
        mimeType
      },
      hotspot,
      crop
    }
  }
}`)

const SITE_SETTINGS_TEKST_LOGO_QUERY = defineQuery(`*[_id == "siteSettings"][0]{
  "tekstLogo": logos[name == "Ny logo"][0]{
    name,
    "image": image{
      asset->{
        _id,
        url,
        mimeType
      },
      hotspot,
      crop
    }
  }
}`)

// ============================================================================
// QUERY BUILDER - Public API
// ============================================================================
// Type-safe query builder for all page and content queries.
// Each method returns a QueryDefinition with the query and typed params.
//
// Usage:
//   const { query, params } = QueryBuilder.eventBySlug('concert-2025', 'no');
//   const { data } = await loadQuery<EventResult>({ query, params });
// ============================================================================

export const QueryBuilder = {
  /** Fetch the active homepage (default or scheduled) */
  homepage(): QueryDefinition {
    return {query: HOMEPAGE_QUERY, params: {}}
  },
  /** Fetch a generic page by its slug */
  pageBySlug(slug: string, language: Language = 'no'): QueryDefinition<{slug: string}> {
    return {query: buildPageBySlugQuery(language), params: {slug}}
  },
  /** Fetch program listing page with selected events */
  programPage(language: Language = 'no'): QueryDefinition<EventResult[]> {
    return {query: buildProgramPageQuery(language), params: {}}
  },
  /** Fetch artist listing page with selected artists */
  artistPage(language: Language = 'no'): QueryDefinition<ArtistResult[]> {
    return {query: buildArtistPageQuery(language), params: {}}
  },
  /** Fetch article listing page with articles */
  articlePage(language: Language = 'no'): QueryDefinition<ArticleResult[]> {
    return {query: buildArticlePageQuery(language), params: {}}
  },
  /** Fetch sponsor page with selected sponsors */
  sponsorPage(language: Language = 'no'): QueryDefinition {
    return {query: buildSponsorPageQuery(language), params: {}}
  },
  /** Fetch a single event by its slug */
  eventBySlug(slug: string, language: Language = 'no'): QueryDefinition<EventResult, {slug: string}> {
    return {query: buildEventBySlugQuery(language), params: {slug}}
  },
  /** Fetch a single artist by their slug, including their events */
  artistBySlug(slug: string, language: Language = 'no'): QueryDefinition<ArtistResult, {slug: string}> {
    return {query: buildArtistBySlugQuery(language), params: {slug}}
  },
  /** Fetch a single article by its slug */
  articleBySlug(slug: string, language: Language = 'no'): QueryDefinition<ArticleResult, {slug: string}> {
    return {query: buildArticleBySlugQuery(language), params: {slug}}
  },
  /** Fetch all published articles ordered by date */
  publishedArticles(language: Language = 'no'): QueryDefinition<ArticleResult[]> {
    return {query: buildPublishedArticlesQuery(language), params: {}}
  },
  /** Fetch all published artists ordered by name */
  publishedArtists(language: Language = 'no'): QueryDefinition<ArtistResult[]> {
    return {query: buildPublishedArtistsQuery(language), params: {}}
  },
  /** Fetch all published events ordered by date and time */
  publishedEvents(language: Language = 'no'): QueryDefinition<EventResult[]> {
    return {query: buildPublishedEventsQuery(language), params: {}}
  },
  /** Fetch all active event dates for program filtering */
  eventDates(): QueryDefinition {
    return {query: EVENT_DATES_QUERY, params: {}}
  },
  /** Fetch events for a specific date (for program filtering) */
  eventsByDate(dateId: string, language: Language = 'no'): QueryDefinition<{dateId: string}> {
    return {query: buildEventsByDateQuery(language), params: {dateId}}
  },
  /** Fetch all slugs for a document type (for static path generation) */
  slugsForType(type: string): QueryDefinition<{type: string}> {
    return {query: SLUGS_FOR_TYPE_QUERY, params: {type}}
  },
  /** Search content by term across specified document types */
  searchContent(searchTerm: string, types: string[], language: Language = 'no'): QueryDefinition<{search: string; types: string[]}> {
    return {query: buildSearchContentQuery(language), params: {search: `*${searchTerm}*`, types}}
  },
  /** Fetch navigation menu items from site settings */
  siteSettingsMenu(): QueryDefinition {
    return {query: SITE_SETTINGS_MENU_QUERY, params: {}}
  },
  /** Fetch footer content from site settings */
  siteSettingsFooter(): QueryDefinition {
    return {query: SITE_SETTINGS_FOOTER_QUERY, params: {}}
  },
  /** Fetch text logo from site settings */
  siteSettingsTekstLogo(): QueryDefinition {
    return {query: SITE_SETTINGS_TEKST_LOGO_QUERY, params: {}}
  }
} as const

/**
 * Configuration options for Sanity query execution.
 * Controls perspective (published vs drafts), CDN usage, and Visual Editing.
 */
export interface QueryOptions {
  /** Content perspective: 'published' for live content, 'drafts' for preview */
  perspective?: 'published' | 'drafts'
  /** Use Sanity CDN for cached responses (automatic based on perspective) */
  useCdn?: boolean
  /** API token for authenticated requests (required for drafts) */
  token?: string
  /** Enable Stega encoding for Visual Editing click-to-edit */
  stega?: boolean
}

/**
 * Build query execution parameters with sensible defaults.
 * Automatically enables CDN for published perspective, disables for drafts.
 *
 * @param options - Query configuration options
 * @returns Normalized parameters for sanityClient.fetch()
 */
export function buildQueryParams(options: QueryOptions = {}) {
  return {
    perspective: options.perspective || 'published',
    useCdn: options.useCdn ?? options.perspective === 'published',
    token: options.token,
    stega: options.stega || false
  }
}
