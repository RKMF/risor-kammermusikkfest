# Media Handling

Images and videos from Sanity. Component props and options are documented in TypeScript interfaces - see `sanityImage.ts`, `Image.astro`, `Video.astro`.

```
Sanity CMS → GROQ queries → sanityImage.ts / Video.astro → Components
```

---

## Image GROQ Pattern (Required)

Always fetch complete metadata for optimization:

```groq
"image": image{
  asset->{
    _id,
    url,
    metadata {
      dimensions { width, height, aspectRatio },
      lqip,      // Low-Quality Image Placeholder
      blurHash   // Blur-up effect
    }
  },
  hotspot,       // Smart cropping
  crop           // Manual crop
}
```

---

## Scroll Container Pattern

For custom layouts needing responsive srcsets (see `ArtistScrollContainer.astro`):

```astro
---
import { getResponsiveImageSet, getOptimizedImageUrl, IMAGE_QUALITY } from '../lib/sanityImage';

const srcset = getResponsiveImageSet(imageData, [240, 300, 320], 4/5, IMAGE_QUALITY.CARD);
const fallback = getOptimizedImageUrl(imageData, 300, 375, IMAGE_QUALITY.CARD);
---

<img src={fallback} srcset={srcset} sizes="(max-width: 768px) 240px, 300px" ... />
```

---

## Video GROQ Pattern (Required)

```groq
_type == "videoComponent" => {
  _key,
  _type,
  videoType,              // 'sanity' | 'youtube' | 'vimeo' | 'external'
  video{ asset->{ _id, url, mimeType } },
  youtubeUrl,
  vimeoUrl,
  externalUrl,
  aspectRatio,            // '1:1' | '4:5' | '9:16' | '16:9'
  title,
  description,
  autoplay,               // default: false
  muted,                  // default: true
  controls,               // default: true
  loop                    // default: false
}
```

Videos are automatically fetched via `queryBuilder.ts` spread operator.

---

## Visual Editing

Both images and videos maintain Visual Editing compatibility:
- GROQ queries include `_id`, `_type`, `_key`
- Components preserve `data-sanity` attributes
- The `...` spread in `buildContentProjection()` preserves Sanity metadata
