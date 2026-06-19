/**
 * TypeScript type definitions for Sanity GROQ query results
 *
 * These interfaces match the actual data structures returned by queries
 * defined in queryBuilder.ts. They provide type safety and autocomplete
 * for components consuming Sanity data.
 */

import type { PageBuilder, Seo } from '../../../sanity/sanity.types';
import type { BilingualDocument } from '../utils/language';

export interface ProjectedImageMetadata {
  dimensions?: {
    width?: number;
    height?: number;
    aspectRatio?: number;
  };
  lqip?: string;
  palette?: {
    dominant?: {
      background?: string;
      foreground?: string;
    };
  };
}

export interface ProjectedSanityImage {
  asset?: {
    _id?: string;
    url?: string;
    mimeType?: string;
    metadata?: ProjectedImageMetadata;
  };
  hotspot?: unknown;
  crop?: unknown;
}

/**
 * Image object structure returned by Sanity queries
 * Includes asset metadata, hotspot, and crop data
 */
export interface SanityImageObject {
  image?: ProjectedSanityImage;
  alt?: string;
  credit?: string;
}

/**
 * Event date reference object
 */
export interface EventDateObject {
  _id: string;
  date: string;
  title?: string;
  title_display_no?: string;
  title_display_en?: string;
}

/**
 * Event time object
 */
export interface EventTimeObject {
  startTime?: string;
  endTime?: string;
}

export interface EventShowingObject {
  _key?: string;
  eventDate?: EventDateObject;
  startTime?: string;
  endTime?: string;
  venue?: VenueObject;
  includeInProgramVenueFilter?: boolean;
  ticketType?: 'button' | 'info';
  ticketUrl?: string;
  ticketInfoText?: string;
  ticketInfoText_no?: string;
  ticketInfoText_en?: string;
  ticketStatus?: 'available' | 'low_stock' | 'sold_out';
}

export interface EventOccurrenceObject {
  _key?: string;
  eventDate?: EventDateObject;
  showings?: EventShowingObject[];
}

/**
 * Venue reference object
 */
export interface VenueObject {
  _id?: string;
  title?: string;
  name?: string;
  address?: string;
  city?: string;
  slug?: string;
}

/**
 * Artist result type for event artist references
 * Minimal fields used in event context
 */
export interface ArtistReference {
  _id: string;
  name: string;
  slug: string;
  instrument?: string;
  image?: SanityImageObject;
}

/**
 * Composer result type for event composer references
 * Minimal fields used in event context
 */
export interface ComposerReference {
  _id: string;
  name: string;
  description_no?: any[];
  description_en?: any[];
  image?: SanityImageObject;
}

export interface BasePageResult extends BilingualDocument {
  _id: string;
  _type: string;
  title?: string;
  excerpt?: string;
  slug?: string;
  content_no?: PageBuilder;
  content_en?: PageBuilder;
  content?: PageBuilder;
  seo?: Seo;
  image?: SanityImageObject;
}

/**
 * Full artist result type from artistBySlug and publishedArtists queries
 * Used in artist detail pages and artist listing pages
 */
export interface ArtistResult extends BilingualDocument {
  _id: string;
  _type: 'artist';
  name: string;
  slug: string;
  slug_no?: { current: string } | string;
  slug_en?: { current: string } | string;
  cardSize?: 'stor' | 'medium';
  excerpt?: string;
  excerpt_no?: string;
  excerpt_en?: string;
  instrument?: string;
  instrument_no?: string;
  instrument_en?: string;
  country?: string;
  image?: SanityImageObject;
  content_no?: PageBuilder;
  content_en?: PageBuilder;
  publishingStatus?: 'published' | 'draft' | 'scheduled';
  scheduledPeriod?: {
    startDate?: string;
    endDate?: string;
  };
  // Social media links (only in detail view)
  instagram?: string;
  facebook?: string;
  spotify?: string;
  youtube?: string;
  websiteUrl?: string;
  spotifyUrl?: string;
  instagramUrl?: string;
  seo?: Seo;
  // Events where this artist performs (only in detail view)
  events?: EventResult[];
}

/**
 * Event result type from eventBySlug and publishedEvents queries
 * Matches the structure defined in buildEventBaseFields() in queryBuilder.ts
 */
export interface EventResult {
  _id: string;
  _type: 'event';
  title?: string;
  title_no?: string;
  title_en?: string;
  excerpt?: string;
  excerpt_no?: string;
  excerpt_en?: string;
  slug?: string;
  slug_no?: { current: string } | string;
  slug_en?: { current: string } | string;
  image?: SanityImageObject;
  showings?: EventShowingObject[];
  occurrences?: EventOccurrenceObject[];
  eventDate?: EventDateObject;
  eventTime?: EventTimeObject;
  venue?: VenueObject;
  artists?: ArtistReference[];
  composers?: ComposerReference[];
  ticketingMode?: 'shared' | 'per_showing';
  ticketType?: 'button' | 'info';
  ticketUrl?: string;
  ticketInfoText?: string;
  ticketInfoText_no?: string;
  ticketInfoText_en?: string;
  ticketStatus?: 'available' | 'low_stock' | 'sold_out';
  publishingStatus?: 'published' | 'draft' | 'scheduled';
  scheduledPeriod?: {
    startDate?: string;
    endDate?: string;
  };
  content_no?: PageBuilder;
  content_en?: PageBuilder;
  extraContent_no?: PageBuilder;
  extraContent_en?: PageBuilder;
  description?: string | any[];
  description_no?: string | any[];
  description_en?: string | any[];
  seo?: Seo;
  spotifyItems?: Array<{
    _key?: string;
    _type?: string;
    spotifyUrl?: string;
  }>;
}

/**
 * Article result type from articleBySlug and publishedArticles queries
 */
export interface ArticleResult extends BilingualDocument {
  _id: string;
  _type: 'article';
  title?: string;
  title_no?: string;
  title_en?: string;
  slug?: string;
  slug_no?: { current: string } | string;
  slug_en?: { current: string } | string;
  excerpt?: string;
  excerpt_no?: string;
  excerpt_en?: string;
  image?: SanityImageObject;
  publishingStatus?: 'published' | 'draft' | 'scheduled';
  scheduledPeriod?: {
    startDate?: string;
    endDate?: string;
  };
  publishedAt?: string;
  author?: {
    _id: string;
    name?: string;
    slug?: string;
  };
  content_no?: PageBuilder;
  content_en?: PageBuilder;
  seo?: Seo;
}

export interface GenericPageResult extends BasePageResult {
  _type: 'page';
}

export interface ProgramPageResult extends BasePageResult {
  _type: 'programPage';
  selectedEvents?: EventResult[];
  venueFilterOrder?: VenueObject[];
}

export interface ArtistPageResult extends BasePageResult {
  _type: 'artistPage';
  selectedArtists?: ArtistResult[];
}

export interface ArticlePageResult extends BasePageResult {
  _type: 'articlePage';
  articles?: ArticleResult[];
}

export interface SponsorReference {
  _id: string;
  _type: 'sponsor';
  name: string;
  logo?: ProjectedSanityImage;
  url?: string;
}

export interface SponsorPageResult extends BasePageResult {
  _type: 'sponsorPage';
  selectedSponsors?: SponsorReference[];
}

export interface HomepageResult extends BasePageResult {
  _type: 'homepage';
  adminTitle?: string;
  homePageType?: string;
  scheduledPeriod?: {
    startDate?: string;
    endDate?: string;
  };
  nextScheduledStart?: string;
}
