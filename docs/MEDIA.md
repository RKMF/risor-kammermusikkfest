# Media Handling

Images and videos come from Sanity and depend on a stable query contract. For implementation details, see `frontend/src/lib/sanityImage.ts`, `frontend/src/lib/sanity/queryBuilder.ts`, `frontend/src/components/Image.astro`, and `frontend/src/components/Video.astro`.

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

## Why This Matters

Both images and videos preserve the Sanity metadata needed by the current rendering pipeline:
- GROQ queries include `_id`, `_type`, `_key`
- image queries include dimensions, `lqip`, `blurHash`, `hotspot`, and `crop`
- the frontend utilities depend on that metadata for responsive images and placeholders
