# Media Handling Documentation

This document explains how images and videos are structured, fetched, optimized, and rendered in this Sanity + Astro project.

## Architecture Overview

```
┌─────────────────┐
│  Sanity CMS     │  Media storage + metadata (dimensions, blurHash, LQIP, mimeType)
└────────┬────────┘
         │ GROQ queries
         ↓
┌─────────────────┐
│ Media Utilities │  sanityImage.ts for images, Video.astro handles videos
└────────┬────────┘
         ↓
┌─────────────────┐
│  Components     │  Image.astro, Video.astro, ScrollContainers, Layouts
└─────────────────┘
```

## Core Files

| File | Purpose |
|------|---------|
| `frontend/src/lib/sanityImage.ts` | Central image utility (URL generation, responsive sets, metadata) |
| `frontend/src/components/Image.astro` | Reusable image component with optimization features |
| `frontend/src/components/Video.astro` | Reusable video component supporting 4 video types |
| `frontend/src/lib/sanity/queryBuilder.ts` | GROQ query builder with recursive content projection |
| `frontend/src/styles/global.css` | Global media styles (aspect ratios, dark mode, print) |

---

# Part 1: Images

## 1. Fetching Images from Sanity

### Required GROQ Pattern

Always fetch complete image metadata for optimization:

```groq
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
      lqip,      // Low-Quality Image Placeholder
      blurHash   // For blur-up effect
    }
  },
  hotspot,     // Smart cropping
  crop         // Manual crop
}
```

**Examples:**
- `frontend/src/components/ArtistScrollContainer.astro:22-46`
- `frontend/src/components/EventScrollContainer.astro:38-64`
- `frontend/src/pages/program/[slug].astro:41-49`

## 2. Rendering Images

### Option A: Using the `<Image>` Component (Recommended)

For content blocks and page images:

```astro
---
import Image from '../components/Image.astro';
---

<Image
  image={event.image}
  alt={event.imageAlt || event.title}
  size="large"
  aspectRatio="16:9"
  priority={false}
/>
```

**Props:**
- `size`: 'small' | 'medium' | 'large' | 'full'
- `aspectRatio`: '4:5' | '1:1' | '16:9' | '9:16' | number
- `priority`: true for above-the-fold images
- `loading`: 'lazy' | 'eager'
- `quality`: Override IMAGE_QUALITY preset

**Reference:** `frontend/src/components/Image.astro:13-31`

### Option B: Using Utility Functions Directly

For scroll containers and custom layouts:

```astro
---
import { getResponsiveImageSet, getOptimizedImageUrl, IMAGE_QUALITY } from '../lib/sanityImage';

const aspectRatio = 4 / 5;
const responsiveImages = getResponsiveImageSet(
  imageData,
  [240, 300, 320],      // Widths for different screen sizes
  ['webp', 'jpg'],      // Format cascade
  aspectRatio,
  IMAGE_QUALITY.CARD
);

const fallbackUrl = getOptimizedImageUrl(imageData, 300, 375, IMAGE_QUALITY.CARD);
---

<picture>
  {responsiveImages
    .filter((format) => format.srcset.length > 0)
    .map((format) => (
    <source
      srcset={format.srcset}
      sizes="(max-width: 768px) 240px, 300px"
      type={`image/${format.format}`}
    />
  ))}
  <img
    src={fallbackUrl}
    alt={imageAlt}
    width="300"
    height="375"
    loading="lazy"
    decoding="async"
    style="aspect-ratio: 4/5; object-fit: cover;"
  />
</picture>
```

**Reference:**
- `frontend/src/components/ArtistScrollContainer.astro:70-106`
- `frontend/src/components/EventScrollContainer.astro:117-158`

## 3. Image Quality Presets

Use predefined quality constants from `sanityImage.ts`:

```typescript
export const IMAGE_QUALITY = {
  THUMBNAIL: 60,  // Small previews
  CARD: 75,       // Artist/event cards (default for scroll containers)
  HERO: 85,       // Hero images
  FULL: 90,       // Full-page images
  LQIP: 20        // Low-quality placeholders
};
```

**Reference:** `frontend/src/lib/sanityImage.ts:14-20`

## 4. Image Optimization Features

### Automatic Optimizations
✅ **Responsive Images**: Multiple sizes for different viewports
✅ **Format Cascade**: WebP → JPG fallback
✅ **Lazy Loading**: Images load only when near viewport
✅ **CLS Prevention**: Explicit width/height attributes
✅ **Blur-up Effect**: LQIP/BlurHash placeholders
✅ **Dark Mode**: Automatic brightness adjustment
✅ **Print Optimization**: Prevents page breaks through images

### Performance Best Practices

1. **Always provide width/height** to prevent Cumulative Layout Shift (CLS):
   ```astro
   <img width="300" height="375" ... />
   ```

2. **Use aspect-ratio** for responsive scaling:
   ```astro
   style="aspect-ratio: 4/5; object-fit: cover;"
   ```

3. **Set priority for above-the-fold images**:
   ```astro
   <Image priority={true} loading="eager" />
   ```

4. **Use appropriate quality presets**:
   - Cards: `IMAGE_QUALITY.CARD` (75)
   - Heroes: `IMAGE_QUALITY.HERO` (85)
   - Thumbnails: `IMAGE_QUALITY.THUMBNAIL` (60)

## 5. Common Image Patterns

### Artist Cards (4:5 Aspect Ratio)
```typescript
const aspectRatio = 4 / 5;
const responsiveImages = getResponsiveImageSet(
  artistImage,
  [240, 280, 320],
  ['webp', 'jpg'],
  aspectRatio,
  IMAGE_QUALITY.CARD
);
const fallbackUrl = getOptimizedImageUrl(artistImage, 280, 350, IMAGE_QUALITY.CARD);
```

### Event Cards (4:5 Aspect Ratio)
```typescript
const aspectRatio = 4 / 5;
const responsiveImages = getResponsiveImageSet(
  eventImage,
  [240, 300, 320],
  ['webp', 'jpg'],
  aspectRatio,
  IMAGE_QUALITY.CARD
);
const fallbackUrl = getOptimizedImageUrl(eventImage, 300, 375, IMAGE_QUALITY.CARD);
```

### Hero Images (16:9 Aspect Ratio)
```astro
<Image
  image={heroImage}
  alt={heroAlt}
  size="full"
  aspectRatio="16:9"
  priority={true}
  quality={IMAGE_QUALITY.HERO}
/>
```

---

# Part 2: Videos

## 1. Fetching Videos from Sanity

### Required GROQ Pattern

The video component supports 4 video types. Always fetch all fields:

```groq
_type == "videoComponent" => {
  _key,
  _type,
  videoType,                    // 'sanity' | 'youtube' | 'vimeo' | 'external'
  video{                        // For Sanity-uploaded videos
    asset->{
      _id,
      url,
      mimeType
    }
  },
  youtubeUrl,                   // For YouTube embeds
  vimeoUrl,                     // For Vimeo embeds
  externalUrl,                  // For external video URLs
  aspectRatio,                  // '1:1' | '4:5' | '9:16' | '16:9'
  title,                        // Optional video title
  description,                  // Optional description
  autoplay,                     // Boolean (default: false)
  muted,                        // Boolean (default: true)
  controls,                     // Boolean (default: true)
  loop                          // Boolean (default: false)
}
```

**How It Works:**
- Videos are automatically fetched via `queryBuilder.ts` using the `...` spread operator
- The `buildContentProjection()` function recursively expands nested components
- No manual GROQ fragments needed - schema fields are fetched automatically

**Reference:** `frontend/src/lib/sanity/queryBuilder.ts:11-70`

## 2. Rendering Videos

### Using the `<Video>` Component

The Video component is automatically rendered via `DynamicComponent` when used in page content:

```astro
---
// In page component - videos are rendered automatically
import DynamicComponent from '../components/DynamicComponent.astro';
---

{content.map((block) => (
  <DynamicComponent block={block} />
))}
```

**Supported Video Types:**

1. **Sanity-uploaded videos** (`videoType: 'sanity'`)
   - Direct file uploads to Sanity
   - Uses HTML5 `<video>` element
   - Supports MP4 format

2. **YouTube embeds** (`videoType: 'youtube'`)
   - Privacy-enhanced mode (`youtube-nocookie.com`)
   - Prevents tracking and unrelated suggestions
   - Sandboxed iframe for security

3. **Vimeo embeds** (`videoType: 'vimeo'`)
   - DNT (Do Not Track) enabled by default
   - Sandboxed iframe for security
   - Full player controls

4. **External video URLs** (`videoType: 'external'`)
   - Direct video file URLs
   - Uses HTML5 `<video>` element
   - Assumes MP4 format

**Props (automatically passed from Sanity):**
- `videoType`: Required - determines video source
- `video`: Sanity file asset (for `videoType: 'sanity'`)
- `youtubeUrl`: YouTube video URL (for `videoType: 'youtube'`)
- `vimeoUrl`: Vimeo video URL (for `videoType: 'vimeo'`)
- `externalUrl`: External video URL (for `videoType: 'external'`)
- `aspectRatio`: '1:1' | '4:5' | '9:16' | '16:9' (default: '16:9')
- `title`: Optional video caption
- `description`: Optional longer description
- `autoplay`: Boolean (default: false)
- `muted`: Boolean (default: true)
- `controls`: Boolean (default: true)
- `loop`: Boolean (default: false)

**Reference:** `frontend/src/components/Video.astro:2-16`

## 3. Video Optimization Features

### Performance Optimizations

✅ **Lazy Preloading** (`preload="none"`):
- HTML5 videos don't load until user initiates playback
- Saves ~50-100KB of initial page load per video
- Applied to both Sanity and external videos

✅ **Lazy iframe Loading** (`loading="lazy"`):
- YouTube and Vimeo iframes only load when near viewport
- Reduces initial page load significantly
- Browser-native implementation

✅ **Efficient Aspect Ratios**:
- Uses CSS `aspect-ratio` for responsive scaling
- Prevents Cumulative Layout Shift (CLS)
- Supports 1:1, 4:5, 9:16, 16:9 ratios

**Reference:** `frontend/src/components/Video.astro:85, 96, 108, 123`

### Privacy & Security Optimizations

✅ **Privacy-Enhanced YouTube** (`youtube-nocookie.com`):
- Prevents YouTube tracking until video is played
- GDPR compliant by default
- No cookies until user interaction

✅ **Iframe Sandboxing**:
- Restricts iframe capabilities for security
- Only allows: scripts, same-origin, presentation
- Prevents malicious iframe behavior

✅ **Vimeo DNT** (`dnt=1`):
- Do Not Track parameter enabled
- Respects user privacy preferences
- Reduces Vimeo tracking

✅ **YouTube No Related Videos** (`rel=0`):
- Prevents unrelated video suggestions at end
- Keeps users focused on your content
- Better user experience

**Reference:**
- YouTube privacy: `frontend/src/components/Video.astro:60`
- Sandboxing: `frontend/src/components/Video.astro:100, 111`
- Vimeo DNT: `frontend/src/components/Video.astro:109`
- YouTube rel: `frontend/src/components/Video.astro:98`

## 4. Video Component Usage

### In Page Builder (Automatic)

Videos work automatically when added to page content via Sanity Studio:

```typescript
// In Sanity Studio PageBuilder
{
  type: 'videoComponent',
  videoType: 'youtube',
  youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  aspectRatio: '16:9',
  title: 'Festival Highlights 2024'
}
```

### In Layout Components

Videos work in all layout components with nested content:

**Grid Layout:**
```typescript
{
  type: 'gridComponent',
  columns: '3',
  items: [
    { type: 'videoComponent', videoType: 'youtube', ... },
    { type: 'imageComponent', ... },
    { type: 'videoComponent', videoType: 'vimeo', ... }
  ]
}
```

**Two Column Layout:**
```typescript
{
  type: 'twoColumnLayout',
  leftColumn: [
    { type: 'videoComponent', videoType: 'sanity', ... }
  ],
  rightColumn: [
    { type: 'portableTextBlock', ... }
  ]
}
```

**Three Column Layout:**
```typescript
{
  type: 'threeColumnLayout',
  column1: [{ type: 'videoComponent', ... }],
  column2: [{ type: 'imageComponent', ... }],
  column3: [{ type: 'videoComponent', ... }]
}
```

**Content Scroll Container:**
```typescript
{
  type: 'contentScrollContainer',
  title: 'Video Gallery',
  items: [
    { type: 'videoComponent', videoType: 'youtube', ... },
    { type: 'videoComponent', videoType: 'vimeo', ... },
    { type: 'videoComponent', videoType: 'sanity', ... }
  ]
}
```

**Reference:** `frontend/src/lib/sanity/queryBuilder.ts:55-69`

## 5. Video Schema Configuration

### In Sanity Studio

Video component schema supports all 4 video types:

```typescript
// studio/schemaTypes/components/content/Video.ts
{
  name: 'videoComponent',
  type: 'object',
  fields: [
    {
      name: 'videoType',
      type: 'string',
      options: {
        list: [
          { title: 'Sanity (Upload)', value: 'sanity' },
          { title: 'YouTube', value: 'youtube' },
          { title: 'Vimeo', value: 'vimeo' },
          { title: 'External URL', value: 'external' }
        ]
      }
    },
    {
      name: 'video',
      type: 'file',
      hidden: ({ parent }) => parent?.videoType !== 'sanity'
    },
    {
      name: 'youtubeUrl',
      type: 'url',
      hidden: ({ parent }) => parent?.videoType !== 'youtube'
    },
    {
      name: 'vimeoUrl',
      type: 'url',
      hidden: ({ parent }) => parent?.videoType !== 'vimeo'
    },
    {
      name: 'externalUrl',
      type: 'url',
      hidden: ({ parent }) => parent?.videoType !== 'external'
    },
    {
      name: 'aspectRatio',
      type: 'string',
      options: {
        list: [
          { title: '1:1 (Square)', value: '1:1' },
          { title: '4:5 (Portrait)', value: '4:5' },
          { title: '9:16 (Vertical)', value: '9:16' },
          { title: '16:9 (Landscape)', value: '16:9' }
        ]
      }
    },
    {
      name: 'title',
      type: 'string'
    },
    {
      name: 'description',
      type: 'text'
    }
  ]
}
```

**Reference:** `studio/schemaTypes/components/content/Video.ts:1-215`

## 6. Common Video Patterns

### YouTube Promotional Video
```typescript
{
  type: 'videoComponent',
  videoType: 'youtube',
  youtubeUrl: 'https://www.youtube.com/watch?v=VIDEO_ID',
  aspectRatio: '16:9',
  title: 'Festival 2024 Promo',
  autoplay: false,
  controls: true
}
```

### Vimeo Documentary
```typescript
{
  type: 'videoComponent',
  videoType: 'vimeo',
  vimeoUrl: 'https://vimeo.com/VIDEO_ID',
  aspectRatio: '16:9',
  title: 'Behind the Scenes',
  description: 'See how we prepare for the festival'
}
```

### Sanity-Uploaded Clip
```typescript
{
  type: 'videoComponent',
  videoType: 'sanity',
  video: {
    asset: {
      _ref: 'file-abc123...'
    }
  },
  aspectRatio: '16:9',
  title: 'Artist Interview',
  controls: true,
  muted: false
}
```

### External Video File
```typescript
{
  type: 'videoComponent',
  videoType: 'external',
  externalUrl: 'https://cdn.example.com/video.mp4',
  aspectRatio: '4:5',
  title: 'Performance Highlight'
}
```

---

# Part 3: Global Styles

## CSS Utilities

Available utility classes from `global.css`:

```css
/* Aspect ratios */
.aspect-square    /* 1:1 */
.aspect-video     /* 16:9 */
.aspect-portrait  /* 4:5 */
.aspect-tall      /* 9:16 */

/* Object fit */
.object-cover
.object-contain
```

**Reference:** `frontend/src/styles/global.css:558-575`

## Video Styles

Videos inherit aspect ratio and responsive behavior:

```css
.video-component {
  margin: 2rem 0;
  max-width: 100%;
}

.video-element {
  width: 100%;
  border: none;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Aspect ratio applied via inline style */
.video-element {
  aspect-ratio: var(--aspect-ratio);
  object-fit: cover;
}
```

**Reference:** `frontend/src/components/Video.astro:145-219`

---

# Part 4: Sanity Visual Editing Support

Both images and videos maintain Visual Editing compatibility:

1. **GROQ queries include _id, _type, _key**
2. **Components preserve data-sanity attributes**
3. **DynamicComponent handles routing automatically**

Example:
```astro
<DynamicComponent
  block={block}
  key={block._key || block._id}
/>
```

The `...` spread operator in `buildContentProjection()` ensures all Sanity metadata is preserved for Visual Editing overlay compatibility.

**Reference:** `frontend/src/lib/sanity/queryBuilder.ts:18-19`

---

# Part 5: Troubleshooting

## Images

### Issue: Images not loading
- ✓ Check GROQ query includes `asset->` reference
- ✓ Verify `metadata` block is fetched
- ✓ Ensure image exists in Sanity

### Issue: Layout shifts (CLS)
- ✓ Add explicit `width` and `height` attributes
- ✓ Use `aspect-ratio` CSS property
- ✓ Ensure correct aspect ratio calculation

### Issue: Slow loading
- ✓ Use appropriate quality preset (don't over-optimize)
- ✓ Enable lazy loading for below-fold images
- ✓ Check image sizes match actual display size

### Issue: Wrong aspect ratio
- ✓ Verify aspect ratio calculation: `width / height` (not `height / width`)
- ✓ Check that `style="aspect-ratio: X/Y"` matches dimensions

## Videos

### Issue: Video not appearing
- ✓ Check `videoType` matches the URL/file provided
- ✓ Verify GROQ query fetches video fields (should happen automatically)
- ✓ Ensure `DynamicComponent` is used for rendering
- ✓ Check browser console for iframe/CORS errors

### Issue: YouTube video not privacy-enhanced
- ✓ Verify component uses `youtube-nocookie.com` (automatic)
- ✓ Check line 60 in `Video.astro`

### Issue: Video loads immediately on page load
- ✓ Check `preload="none"` is set (automatic for HTML5)
- ✓ Check `loading="lazy"` is set for iframes (automatic)
- ✓ Reference lines 85, 96, 108, 123 in `Video.astro`

### Issue: Videos not working in layouts
- ✓ Verify layout component uses `DynamicComponent`
- ✓ Check `queryBuilder.ts` has handler for your layout type
- ✓ Ensure nested depth is ≤ 2 (MAX_CONTENT_DEPTH)
- ✓ Reference `queryBuilder.ts:55-69`

---

# Part 6: Migration Notes

## Images
**Deprecated:** `imageHelpers.ts`, `imageUtils.ts` (removed)
**Current:** `sanityImage.ts` (unified utility)

All image handling now uses the unified `sanityImage.ts` utility for consistency and maintainability.

## Videos
**Deprecated:** Manual GROQ fragments in `fragments.ts` (removed)
**Current:** `queryBuilder.ts` with `buildContentProjection()` and `...` spread

Videos now use the same recursive query system as all other components, eliminating duplicate query code.

---

**Last Updated:** 2025-01-06
**Maintained By:** Development Team
