/**
 * TypeScript type definitions for Sanity GROQ query results
 *
 * These interfaces match the actual data structures returned by queries
 * defined in queryBuilder.ts. They provide type safety and autocomplete
 * for components consuming Sanity data.
 */

import type { SanityImageSource } from '@sanity/image-url/lib/types/types';

/**
 * Image object structure returned by Sanity queries
 * Includes asset metadata, hotspot, and crop data
 */
export interface SanityImageObject {
  image?: SanityImageSource;
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

/**
 * Venue reference object
 */
export interface VenueObject {
  _id: string;
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
 * Full artist result type from artistBySlug and publishedArtists queries
 * Used in artist detail pages and artist listing pages
 */
export interface ArtistResult {
  _id: string;
  _type: 'artist';
  name: string;
  slug: string;
  cardSize?: 'stor' | 'medium';
  excerpt?: string;
  excerpt_no?: string;
  excerpt_en?: string;
  instrument?: string;
  instrument_no?: string;
  instrument_en?: string;
  country?: string;
  image?: SanityImageObject;
  content_no?: any[];
  content_en?: any[];
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
  seo?: any;
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
  slug_no?: { current: string };
  slug_en?: { current: string };
  image?: SanityImageObject;
  eventDate?: EventDateObject;
  eventTime?: EventTimeObject;
  venue?: VenueObject;
  artists?: ArtistReference[];
  ticketType?: 'paid' | 'free' | 'info';
  ticketUrl?: string;
  ticketInfoText?: string;
  ticketStatus?: 'available' | 'low_stock' | 'sold_out';
  publishingStatus?: 'published' | 'draft' | 'scheduled';
  scheduledPeriod?: {
    startDate?: string;
    endDate?: string;
  };
  content_no?: any[];
  content_en?: any[];
  extraContent_no?: any[];
  extraContent_en?: any[];
  description_no?: string;
  description_en?: string;
  seo?: any;
}

/**
 * Article result type from articleBySlug and publishedArticles queries
 */
export interface ArticleResult {
  _id: string;
  _type: 'article';
  title?: string;
  title_no?: string;
  title_en?: string;
  slug?: string;
  slug_no?: { current: string };
  slug_en?: { current: string };
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
  content_no?: any[];
  content_en?: any[];
  seo?: any;
}
