/**
 * TypeScript Types - Shared type definitions for Sanity schema development
 *
 * Provides type safety across the Studio codebase:
 * - Component data interfaces (GlobalComponentData, ImageData, VideoData, etc.)
 * - Document interfaces (EventData, ArtistData, PageData, etc.)
 * - Utility types (PublishingStatus, SupportedLanguage, etc.)
 * - Type guards for runtime type checking (isEventData, isArtistData, etc.)
 * - Utility functions (getLocalizedField, hasContentInLanguage, getDocumentState)
 *
 * Used by:
 * - Schema definitions for consistent field typing
 * - Preview functions for type-safe document rendering
 * - Custom actions for document manipulation
 * - Utility functions for content handling
 *
 * @see schemaTypes/shared/validation.ts - Validation patterns using these types
 */

// ============================================================================
// BASE COMPONENT INTERFACES
// ============================================================================
export interface BaseComponentData {
  _type: string;
  _key?: string;
}

export interface SpacingData {
  marginTop?: string;
  marginBottom?: string;
  paddingTop?: string;
  paddingBottom?: string;
}

export interface ThemeData {
  variant?: 'default' | 'dark' | 'light' | 'accent' | 'festival';
  backgroundType?: 'none' | 'solid' | 'gradient' | 'pattern';
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export interface AnimationData {
  entrance?: 'none' | 'fadeIn' | 'slideInLeft' | 'slideInRight' | 'slideInUp' | 'zoomIn';
  delay?: string;
  duration?: string;
}

export interface GlobalComponentData extends BaseComponentData {
  spacing?: SpacingData;
  theme?: ThemeData;
  animation?: AnimationData;
}

// Content component interfaces
export interface TitleData extends GlobalComponentData {
  mainTitle: string;
  subtitle?: string;
}

export interface HeadingData extends GlobalComponentData {
  level: 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  text: string;
  id?: { current: string };
}

export interface ImageData extends GlobalComponentData {
  image: any;
  alt?: string;
  caption?: string;
  credit?: string;
  aspectRatio?: string;
  alignment?: 'left' | 'center' | 'right';
  size?: 'small' | 'medium' | 'large' | 'full';
}

export interface VideoData extends GlobalComponentData {
  videoType: 'sanity' | 'youtube' | 'vimeo' | 'external';
  video?: any;
  youtubeUrl?: string;
  vimeoUrl?: string;
  externalUrl?: string;
  title?: string;
  description?: string;
  aspectRatio?: string;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  loop?: boolean;
}

export interface ButtonData extends GlobalComponentData {
  text: string;
  url?: string;
  style?: 'primary' | 'secondary' | 'outline' | 'link';
  size?: 'small' | 'medium' | 'large' | 'xl';
  action?: 'link' | 'form' | 'modal' | 'download';
  icon?: string;
  iconPosition?: 'before' | 'after';
  disabled?: boolean;
  fullWidth?: boolean;
}

export interface QuoteData extends GlobalComponentData {
  quote: string;
  author?: string;
  source?: string;
  cite?: string;
}

export interface AccordionData extends GlobalComponentData {
  title: string;
  description?: PortableTextBlock[];
  panels: Array<{
    title: string;
    content: GlobalComponentData[];
  }>;
  accessibility?: {
    ariaLabel?: string;
    ariaDescribedBy?: string;
  };
}

export interface PortableTextData extends GlobalComponentData {
  content: PortableTextBlock[];
}

export interface PortableTextBlock {
  _type: string;
  _key: string;
  style?: string;
  listItem?: string;
  level?: number;
  children?: PortableTextSpan[];
  markDefs?: PortableTextMarkDefinition[];
  [key: string]: any;
}

export interface PortableTextSpan {
  _type: 'span';
  _key: string;
  text: string;
  marks?: string[];
}

export interface PortableTextMarkDefinition {
  _type: string;
  _key: string;
  [key: string]: any;
}

// Layout component interfaces
// (Grid, TwoColumn, and ThreeColumn don't use shared types)

// Section component interfaces
export interface ScrollContainerData extends GlobalComponentData {
  title?: string;
  items: any[];
  showScrollbar?: boolean;
  format?: string;
}

export interface ArtistScrollContainerData extends ScrollContainerData {
  cardFormat?: string;
}

export interface EventScrollContainerData extends ScrollContainerData {
  showDate?: boolean;
  showTime?: boolean;
  showVenue?: boolean;
  showArtists?: boolean;
  sortBy?: 'date-asc' | 'date-desc' | 'title-asc' | 'manual';
  cardFormat?: string;
}

// Document interfaces
export interface EventData {
  _id?: string;
  _type: 'event';
  // Artists and composers
  artist?: Array<{
    _ref: string;
    _type: 'reference';
  }>;
  composers?: Array<{
    _ref: string;
    _type: 'reference';
  }>;
  // Basic event info
  ticketUrl?: string;
  venue?: {
    _ref: string;
    _type: 'reference';
  };
  eventDate?: {
    _ref: string;
    _type: 'reference';
  };
  eventTime?: {
    startTime?: string;
    endTime?: string;
  };
  // Multilingual content
  title_no?: string;
  slug_no?: { current: string };
  excerpt_no?: string;
  content_no?: GlobalComponentData[];
  title_en?: string;
  slug_en?: { current: string };
  excerpt_en?: string;
  content_en?: GlobalComponentData[];
  // Image
  image?: ImageData['image'];
  image_no?: ImageData['image'];
  image_en?: ImageData['image'];
  // Publishing
  publishingStatus: 'published' | 'draft' | 'scheduled';
  scheduledPeriod?: {
    startDate?: string;
    endDate?: string;
  };
  // SEO
  seo?: SeoFieldsData;
}

export interface ArtistData {
  _id?: string;
  _type: 'artist';
  // Basic info
  name: string;
  slug: { current: string };
  // Multilingual content
  excerpt_no?: string;
  instrument_no?: string;
  content_no?: GlobalComponentData[];
  excerpt_en?: string;
  instrument_en?: string;
  content_en?: GlobalComponentData[];
  // Image
  image?: ImageData['image'];
  image_no?: ImageData['image'];
  image_en?: ImageData['image'];
  // Publishing
  publishingStatus: 'published' | 'draft' | 'scheduled';
  scheduledPeriod?: {
    startDate?: string;
    endDate?: string;
  };
  // Related events
  events?: Array<{
    _ref: string;
    _type: 'reference';
  }>;
  // SEO
  seo?: SeoFieldsData;
}

export interface PageData {
  _id?: string;
  _type: 'page';
  // Multilingual content
  title_no?: string;
  slug_no?: { current: string };
  content_no?: GlobalComponentData[];
  title_en?: string;
  slug_en?: { current: string };
  content_en?: GlobalComponentData[];
  // Image
  image?: ImageData['image'];
  image_no?: ImageData['image'];
  image_en?: ImageData['image'];
  // Publishing
  publishingStatus: 'published' | 'draft' | 'scheduled';
  scheduledPeriod?: {
    startDate?: string;
    endDate?: string;
  };
  // SEO
  seo?: SeoFieldsData;
}

export interface ArticleData {
  _id?: string;
  _type: 'article';
  // Multilingual content
  title_no?: string;
  slug_no?: { current: string };
  excerpt_no?: string;
  content_no?: GlobalComponentData[];
  title_en?: string;
  slug_en?: { current: string };
  excerpt_en?: string;
  content_en?: GlobalComponentData[];
  // Image
  image?: ImageData['image'];
  image_no?: ImageData['image'];
  image_en?: ImageData['image'];
  // Publishing
  publishingStatus: 'published' | 'draft' | 'scheduled';
  scheduledPeriod?: {
    startDate?: string;
    endDate?: string;
  };
  // SEO
  seo?: SeoFieldsData;
}

export interface ProgramPageData {
  _id?: string;
  _type: 'programPage';
  // Multilingual content
  title_no?: string;
  slug_no?: { current: string };
  excerpt_no?: string;
  content_no?: GlobalComponentData[];
  title_en?: string;
  slug_en?: { current: string };
  excerpt_en?: string;
  content_en?: GlobalComponentData[];
  // Selected events
  selectedEvents?: Array<{
    _ref: string;
    _type: 'reference';
  }>;
  // SEO
  seo?: SeoFieldsData;
}

export interface ArtistPageData {
  _id?: string;
  _type: 'artistPage';
  // Multilingual content
  title_no?: string;
  slug_no?: { current: string };
  excerpt_no?: string;
  content_no?: GlobalComponentData[];
  title_en?: string;
  slug_en?: { current: string };
  excerpt_en?: string;
  content_en?: GlobalComponentData[];
  // Selected artists
  selectedArtists?: Array<{
    _ref: string;
    _type: 'reference';
  }>;
  // SEO
  seo?: SeoFieldsData;
}

export interface HomepageData {
  _id?: string;
  _type: 'homepage';
  // Administrative title for Studio overview
  adminTitle?: string;
  // Multilingual content (no title/slug fields - content starts with H1)
  content_no?: GlobalComponentData[];
  content_en?: GlobalComponentData[];
  // Homepage type and scheduling
  homePageType: 'default' | 'scheduled';
  scheduledPeriod?: {
    startDate?: string;
    endDate?: string;
  };
  // SEO
  seo?: SeoFieldsData;
}

// SEO fields interface
export interface SeoFieldsData {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: ImageData['image'];
  indexingStatus?: 'index' | 'noindex';
}

// Publishing status types
export type PublishingStatus = 'published' | 'draft' | 'scheduled';

export interface ScheduledPeriod {
  startDate?: string;
  endDate?: string;
}

// Multilingual document interface
export interface MultilingualDocument {
  title_no?: string;
  slug_no?: { current: string };
  content_no?: GlobalComponentData[];
  title_en?: string;
  slug_en?: { current: string };
  content_en?: GlobalComponentData[];
  publishingStatus: PublishingStatus;
  scheduledPeriod?: ScheduledPeriod;
  seo?: SeoFieldsData;
}

// Utility types
export type ComponentType =
  | 'title'
  | 'headingComponent'
  | 'portableTextBlock'
  | 'quoteComponent'
  | 'imageComponent'
  | 'videoComponent'
  | 'buttonComponent'
  | 'enhancedButtonComponent'
  | 'accordionComponent'
  | 'gridComponent'
  | 'twoColumnLayout'
  | 'threeColumnLayout'
  | 'contentScrollContainer'
  | 'artistScrollContainer'
  | 'eventScrollContainer';

export type DocumentType =
  | 'event'
  | 'artist'
  | 'page'
  | 'article'
  | 'homepage'
  | 'programPage'
  | 'artistPage';

// Comprehensive PageBuilder union type for all possible components
export type PageBuilderComponent =
  | (TitleData & { _type: 'title' })
  | (HeadingData & { _type: 'headingComponent' })
  | (PortableTextData & { _type: 'portableTextBlock' })
  | (QuoteData & { _type: 'quoteComponent' })
  | (ImageData & { _type: 'imageComponent' })
  | (VideoData & { _type: 'videoComponent' })
  | (ButtonData & { _type: 'buttonComponent' | 'enhancedButtonComponent' })
  | (AccordionData & { _type: 'accordionComponent' })
  | (GlobalComponentData & { _type: 'gridComponent' })
  | (GlobalComponentData & { _type: 'twoColumnLayout' })
  | (GlobalComponentData & { _type: 'threeColumnLayout' })
  | (ScrollContainerData & { _type: 'contentScrollContainer' })
  | (ArtistScrollContainerData & { _type: 'artistScrollContainer' })
  | (EventScrollContainerData & { _type: 'eventScrollContainer' });

// HTML generation function type
export type ComponentHTMLGenerator<T = GlobalComponentData> = (data: T) => string;

// Validation rule type
export type ValidationRule = (Rule: any) => any;

// Schema field group type
export interface SchemaGroup {
  name: string;
  title: string;
  default?: boolean;
  icon?: any;
}

// Component preview data type
export interface ComponentPreview {
  title: string;
  subtitle?: string;
  media?: any;
}

// Utility type helpers
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Language support types
export type SupportedLanguage = 'no' | 'en';
export type LocalizedContent<T> = {
  [K in SupportedLanguage as `${string}_${K}`]: T;
};

// Document state types
export interface DocumentState {
  isPublished: boolean;
  isDraft: boolean;
  isScheduled: boolean;
  isLive?: boolean;
  isExpired?: boolean;
}

// Utility functions for type checking
export const isValidComponentType = (type: string): type is ComponentType => {
  return [
    'title',
    'headingComponent',
    'portableTextBlock',
    'quoteComponent',
    'imageComponent',
    'videoComponent',
    'buttonComponent',
    'enhancedButtonComponent',
    'accordionComponent',
    'gridComponent',
    'twoColumnLayout',
    'threeColumnLayout',
    'contentScrollContainer',
    'artistScrollContainer',
    'eventScrollContainer',
  ].includes(type);
};

export const isValidDocumentType = (type: string): type is DocumentType => {
  return ['event', 'artist', 'page', 'article', 'homepage', 'programPage', 'artistPage'].includes(
    type
  );
};

export const isValidPublishingStatus = (status: string): status is PublishingStatus => {
  return ['published', 'draft', 'scheduled'].includes(status);
};

// Type guards for document interfaces
export const isEventData = (data: any): data is EventData => {
  return data && data._type === 'event';
};

export const isArtistData = (data: any): data is ArtistData => {
  return data && data._type === 'artist';
};

export const isPageData = (data: any): data is PageData => {
  return data && data._type === 'page';
};

export const isArticleData = (data: any): data is ArticleData => {
  return data && data._type === 'article';
};

export const isProgramPageData = (data: any): data is ProgramPageData => {
  return data && data._type === 'programPage';
};

export const isArtistPageData = (data: any): data is ArtistPageData => {
  return data && data._type === 'artistPage';
};

export const isHomepageData = (data: any): data is HomepageData => {
  return data && data._type === 'homepage';
};

// Utility function to get localized content
export function getLocalizedField<T>(
  data: any,
  fieldName: string,
  language: SupportedLanguage,
  fallbackLanguage: SupportedLanguage = 'no'
): T | undefined {
  const localizedFieldName = `${fieldName}_${language}`;
  const fallbackFieldName = `${fieldName}_${fallbackLanguage}`;

  return data[localizedFieldName] || data[fallbackFieldName];
}

// Utility function to check if document has content in a specific language
export function hasContentInLanguage(
  data: MultilingualDocument,
  language: SupportedLanguage
): boolean {
  const titleField = `title_${language}`;
  const contentField = `content_${language}`;

  return !!(
    data[titleField as keyof MultilingualDocument] ||
    data[contentField as keyof MultilingualDocument]
  );
}

// Utility function to determine document state
export function getDocumentState(document: any): DocumentState {
  const isPublished = document._id && !document._id.startsWith('drafts.');
  const isDraft = !isPublished;
  const isScheduled = document.publishingStatus === 'scheduled';

  let isLive = false;
  let isExpired = false;

  if (isScheduled && document.scheduledPeriod?.startDate && document.scheduledPeriod?.endDate) {
    const now = new Date();
    const start = new Date(document.scheduledPeriod.startDate);
    const end = new Date(document.scheduledPeriod.endDate);

    isLive = now >= start && now <= end;
    isExpired = now > end;
  }

  return {
    isPublished,
    isDraft,
    isScheduled,
    isLive,
    isExpired,
  };
}
