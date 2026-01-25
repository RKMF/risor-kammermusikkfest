/**
 * Unified Image Utilities for Sanity + Astro
 *
 * Production-ready image optimization with:
 * - Modern TypeScript interfaces
 * - SSR-compatible (no browser APIs)
 * - LQIP (Low Quality Image Placeholder) support
 * - Responsive srcset generation
 * - Hotspot and crop preservation
 * - Multi-format picture element support
 */

import imageUrlBuilder, { type SanityImageSource } from '@sanity/image-url'
import { sanityClient } from 'sanity:client'

/**
 * Type guard to check if source is a wrapper object containing an image property
 */
function isImageWrapper(source: unknown): source is { image: SanityImageSource } {
  return (
    typeof source === 'object' &&
    source !== null &&
    'image' in source &&
    source.image !== null &&
    source.image !== undefined
  )
}

/**
 * Standardized image quality levels for consistent optimization
 */
export const IMAGE_QUALITY = {
  THUMBNAIL: 60,
  CARD: 75,
  HERO: 85,
  FULL: 90,
  LQIP: 20
} as const

/**
 * Common image widths for responsive srcsets
 */
export const RESPONSIVE_WIDTHS = {
  SMALL: [320, 640, 960],
  MEDIUM: [400, 800, 1200],
  LARGE: [600, 1200, 1800, 2400],
  HERO: [800, 1200, 1600, 2000]
} as const

/**
 * Image URL generation options
 */
export interface ImageUrlOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'jpg' | 'png' // Sanity CDN doesn't support AVIF
  fit?: 'clip' | 'crop' | 'fill' | 'fillmax' | 'max' | 'scale' | 'min'
  blur?: number
}

/**
 * Image metadata extracted from Sanity
 */
export interface ImageMetadata {
  width?: number
  height?: number
  aspectRatio?: number
  lqip?: string
  dominantColor?: string
  palette?: {
    darkMuted?: { background: string; foreground: string; population: number }
    darkVibrant?: { background: string; foreground: string; population: number }
    dominant?: { background: string; foreground: string; population: number }
    lightMuted?: { background: string; foreground: string; population: number }
    lightVibrant?: { background: string; foreground: string; population: number }
    muted?: { background: string; foreground: string; population: number }
    vibrant?: { background: string; foreground: string; population: number }
  }
  hotspot?: {
    x: number
    y: number
  }
  crop?: {
    top: number
    bottom: number
    left: number
    right: number
  }
}

/**
 * Responsive image source for picture elements
 */
export interface ResponsiveImageSource {
  format: string
  srcset: string
}

/**
 * Get Sanity image builder instance
 *
 * @param source - Sanity image source object
 * @returns Image URL builder or null if configuration is missing or source is invalid
 */
export function getImageBuilder(source: SanityImageSource) {
  // Validate source before proceeding
  if (!source) {
    return null
  }

  // Handle nested image objects like {"alt":null,"image":null}
  // If source has an 'image' property, use that as the actual source
  const actualSource = isImageWrapper(source) ? source.image : source

  // If the actual source is still null/undefined, return null
  if (!actualSource || actualSource === null) {
    return null
  }

  const { projectId, dataset } = sanityClient.config()

  if (!projectId || !dataset) {
    console.warn('Sanity project ID or dataset not configured')
    return null
  }

  return imageUrlBuilder({ projectId, dataset }).image(actualSource)
}

/**
 * Generate optimized image URL with Sanity CDN
 *
 * Automatically serves WebP when supported by the browser, with JPG fallback.
 * Preserves hotspot and crop data from Sanity.
 *
 * @param source - Sanity image source object
 * @param width - Target width in pixels
 * @param height - Target height in pixels (optional, maintains aspect ratio if omitted)
 * @param quality - Image quality (1-100), defaults to CARD quality (75)
 * @returns Optimized image URL or null if builder fails
 *
 * @example
 * ```typescript
 * const url = getOptimizedImageUrl(image, 800, undefined, IMAGE_QUALITY.HERO)
 * ```
 */
export function getOptimizedImageUrl(
  source: SanityImageSource,
  width?: number,
  height?: number,
  quality: number = IMAGE_QUALITY.CARD
): string | null {
  const builder = getImageBuilder(source)
  if (!builder) return null

  let url = builder

  if (width) url = url.width(width)
  if (height) url = url.height(height)

  return url
    .auto('format') // Automatically serve WebP/JPG based on browser support
    .quality(quality)
    .url()
}

/**
 * Generate responsive srcset for multiple widths
 *
 * Creates a srcset string with multiple image variants at different widths.
 * Use with the `sizes` attribute for optimal responsive images.
 *
 * @param source - Sanity image source object
 * @param widths - Array of widths to generate
 * @param quality - Image quality (1-100)
 * @returns Srcset string for use in `<source>` or `<img>` elements
 *
 * @example
 * ```typescript
 * const srcset = getResponsiveSrcSet(image, RESPONSIVE_WIDTHS.MEDIUM)
 * // Returns: "https://cdn.sanity.io/...?w=400 400w, https://cdn.sanity.io/...?w=800 800w, ..."
 * ```
 */
export function getResponsiveSrcSet(
  source: SanityImageSource,
  widths: readonly number[] = RESPONSIVE_WIDTHS.MEDIUM,
  quality: number = IMAGE_QUALITY.CARD
): string {
  const builder = getImageBuilder(source)
  if (!builder) return ''

  return widths
    .map(width => {
      const url = builder
        .width(width)
        .auto('format')
        .quality(quality)
        .url()
      return `${url} ${width}w`
    })
    .join(', ')
}

/**
 * Generate LQIP (Low Quality Image Placeholder) URL
 *
 * Creates a tiny, blurred image for blur-up loading effect.
 * Use as placeholder while full image loads.
 *
 * @param source - Sanity image source object
 * @returns Small, low-quality image URL
 *
 * @example
 * ```typescript
 * const placeholder = getLQIPUrl(image)
 * // Use in background-image while loading full image
 * ```
 */
export function getLQIPUrl(source: SanityImageSource): string | null {
  const builder = getImageBuilder(source)
  if (!builder) return null

  return builder
    .width(20)
    .quality(IMAGE_QUALITY.LQIP)
    .blur(5)
    .format('jpg')
    .url()
}

/**
 * Generate responsive srcset using Sanity CDN auto-format negotiation
 *
 * Uses auto=format which lets Sanity CDN negotiate the best format (AVIF/WebP/JPG)
 * based on browser support and CDN cache state. This provides:
 * - Automatic AVIF support when available (first request may get WebP/JPG while encoding)
 * - Graceful fallback to WebP or JPG
 * - Better CDN caching and future format support
 *
 * Note: Sanity's AVIF support is on-demand. First few requests may return WebP/JPG
 * while AVIF encoding completes (~30 seconds). Subsequent requests get AVIF.
 * See: https://www.sanity.io/docs/help/avif
 *
 * @param source - Sanity image source object
 * @param widths - Array of widths to generate
 * @param aspectRatio - Optional aspect ratio to maintain
 * @param quality - Image quality (1-100)
 * @returns Srcset string with auto-format URLs
 *
 * @example
 * ```typescript
 * const srcset = getResponsiveImageSet(image, [400, 800, 1200], 0.8, IMAGE_QUALITY.CARD)
 * // Returns: "https://cdn.sanity.io/...?w=400&auto=format&q=75 400w, ..."
 * ```
 */
export function getResponsiveImageSet(
  source: SanityImageSource,
  widths: number[] = [400, 800, 1200],
  aspectRatio?: number,
  quality: number = IMAGE_QUALITY.CARD
): string {
  const builder = getImageBuilder(source)
  if (!builder) return ''

  return widths
    .map(width => {
      const height = aspectRatio ? Math.round(width / aspectRatio) : undefined

      let urlBuilder = builder.width(width)
      if (height) urlBuilder = urlBuilder.height(height)

      const url = urlBuilder
        .auto('format') // Let CDN negotiate best format (AVIF/WebP/JPG)
        .quality(quality)
        .url()

      return `${url} ${width}w`
    })
    .join(', ')
}

/**
 * Extract image metadata from Sanity image object
 *
 * Pulls dimensions, LQIP, color palette, hotspot, and crop data.
 * Use this to get all available metadata for advanced image handling.
 *
 * @param imageObject - Sanity image object from query (includes asset.metadata)
 * @returns Complete image metadata
 *
 * @example
 * ```typescript
 * // In your GROQ query:
 * // image {
 * //   asset-> {
 * //     metadata { dimensions, lqip, palette }
 * //   },
 * //   hotspot,
 * //   crop
 * // }
 *
 * const metadata = extractImageMetadata(imageObject)
 * console.log(metadata.lqip, metadata.dominantColor, metadata.aspectRatio)
 * ```
 */
export function extractImageMetadata(imageObject: any): ImageMetadata {
  const metadata: ImageMetadata = {}

  if (imageObject?.asset?.metadata) {
    const assetMetadata = imageObject.asset.metadata

    // Dimensions and aspect ratio
    if (assetMetadata.dimensions) {
      metadata.width = assetMetadata.dimensions.width
      metadata.height = assetMetadata.dimensions.height
      metadata.aspectRatio = assetMetadata.dimensions.aspectRatio
    }

    // LQIP (base64 encoded thumbnail)
    if (assetMetadata.lqip) {
      metadata.lqip = assetMetadata.lqip
    }

    // Color palette (extracted by Sanity)
    if (assetMetadata.palette) {
      metadata.palette = assetMetadata.palette

      // Convenience: dominant color
      if (assetMetadata.palette.dominant?.background) {
        metadata.dominantColor = assetMetadata.palette.dominant.background
      }
    }
  }

  // Hotspot (focal point for cropping)
  if (imageObject?.hotspot) {
    metadata.hotspot = {
      x: imageObject.hotspot.x,
      y: imageObject.hotspot.y
    }
  }

  // Crop (user-defined crop area)
  if (imageObject?.crop) {
    metadata.crop = {
      top: imageObject.crop.top,
      bottom: imageObject.crop.bottom,
      left: imageObject.crop.left,
      right: imageObject.crop.right
    }
  }

  return metadata
}

/**
 * Calculate sizes attribute for responsive images
 *
 * Generates the `sizes` attribute based on viewport breakpoints.
 * Tells the browser which image size to load at different screen widths.
 *
 * @param maxWidth - Maximum width of image container (e.g., "800px", "50vw")
 * @returns Sizes attribute string
 *
 * @example
 * ```typescript
 * const sizes = calculateSizes("800px")
 * // Returns: "(max-width: 768px) 100vw, 800px"
 *
 * <img srcset="..." sizes={sizes} />
 * ```
 */
export function calculateSizes(maxWidth: string = '100vw'): string {
  return `(max-width: 768px) 100vw, ${maxWidth}`
}

/**
 * Generate advanced sizes attribute with custom breakpoints
 *
 * For more complex layouts with multiple breakpoints.
 *
 * @param breakpoints - Array of breakpoint configurations
 * @returns Generated sizes attribute string
 *
 * @example
 * ```typescript
 * const sizes = generateSizesAttribute([
 *   { maxWidth: 640, size: '100vw' },
 *   { maxWidth: 1024, size: '50vw' },
 *   { size: '800px' }
 * ])
 * // Returns: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px"
 * ```
 */
export function generateSizesAttribute(
  breakpoints: Array<{ minWidth?: number; maxWidth?: number; size: string }>
): string {
  return breakpoints
    .map(breakpoint => {
      if (breakpoint.minWidth && breakpoint.maxWidth) {
        return `(min-width: ${breakpoint.minWidth}px) and (max-width: ${breakpoint.maxWidth}px) ${breakpoint.size}`
      } else if (breakpoint.minWidth) {
        return `(min-width: ${breakpoint.minWidth}px) ${breakpoint.size}`
      } else if (breakpoint.maxWidth) {
        return `(max-width: ${breakpoint.maxWidth}px) ${breakpoint.size}`
      }
      return breakpoint.size
    })
    .join(', ')
}

/**
 * Get optimized image for card/thumbnail use
 *
 * Convenience function with preset quality and size for card components.
 *
 * @param source - Sanity image source object
 * @param width - Card width (default: 400px)
 * @param height - Card height (optional, maintains aspect ratio if omitted)
 * @returns Optimized card image URL
 */
export function getCardImageUrl(
  source: SanityImageSource,
  width: number = 400,
  height?: number
): string | null {
  return getOptimizedImageUrl(source, width, height, IMAGE_QUALITY.CARD)
}

/**
 * Get optimized image for hero/featured use
 *
 * Convenience function with higher quality for hero sections.
 *
 * @param source - Sanity image source object
 * @param width - Hero width (default: 1200px)
 * @param height - Hero height (optional, maintains aspect ratio if omitted)
 * @returns Optimized hero image URL
 */
export function getHeroImageUrl(
  source: SanityImageSource,
  width: number = 1200,
  height?: number
): string | null {
  return getOptimizedImageUrl(source, width, height, IMAGE_QUALITY.HERO)
}
