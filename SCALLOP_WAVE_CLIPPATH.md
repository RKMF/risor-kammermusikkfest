# Scalloped Wave Clip-Path Implementation

## Overview

Converted the BIG scalloped wave pattern from the RKMF logo (`Symbol_RKMF.svg` line 6) into CSS clip-paths ready for use on artist cards.

## Files Created

1. **`/Users/amarlong/Documents/GitHub/Risør kammermusikkfest/frontend/src/styles/clip-paths.css`**
   - Main clip-path definitions
   - Multiple variants (top, bottom, subtle)
   - Production-ready CSS

2. **`/Users/amarlong/Documents/GitHub/Risør kammermusikkfest/frontend/src/styles/clip-path-demo.css`**
   - Usage examples
   - Artist card integration patterns
   - Responsive adjustments

## Primary Clip-Path

```css
.clip-scallop-wave-top {
  clip-path: polygon(
    /* Left edge - in valley */
    0% 14.4%,

    /* First rise to peak */
    6% 10%, 12% 5%, 18% 1%, 24% 0%,

    /* Descend to valley */
    30% 1%, 36% 5%, 42% 10%, 48% 14.4%,

    /* Second rise to peak (center) */
    54% 10%, 60% 5%, 66% 1%, 72% 0%,

    /* Descend to valley */
    78% 1%, 84% 5%, 90% 10%, 96% 14.4%,

    /* Right edge and close path */
    100% 14.4%,
    100% 100%,
    0% 100%
  );
}
```

## Pattern Details

### Original SVG Analysis
- **ViewBox**: 850.39 × 850.39
- **Path Y-range**: 623.95 (valleys) → 746.36 (peaks)
- **Depth**: 122.41px = **14.4%** of viewBox height
- **Pattern**: 2 complete wave cycles with partial cycles at edges
- **Wave sequence**: valley → peak → valley → peak → valley

### Converted Clip-Path
- **Orientation**: Top edge (peaks at 0%, valleys at 14.4%)
- **Coordinate system**: objectBoundingBox (0-1 range, expressed as %)
- **Smoothing**: 5 polygon points per wave curve for smooth appearance
- **Total points**: 19 points defining the wave contour

## Variants Provided

### 1. Standard Top Edge
```css
.clip-scallop-wave-top
```
- Peaks at 0%, valleys at 14.4%
- Full depth matching original logo

### 2. Polygon Fallback
```css
.clip-scallop-wave-top-polygon
```
- Simpler 11-point version
- Less smooth but better browser support

### 3. Subtle Variant
```css
.clip-scallop-wave-top-subtle
```
- Reduced depth: valleys at 10% instead of 14.4%
- More understated wave effect

### 4. Bottom Edge
```css
.clip-scallop-wave-bottom
```
- Inverted pattern for bottom edge
- Valleys at 85.6%, peaks at 100%

## Usage Recommendations

### Basic Application
```css
.artist-card__image {
  clip-path: polygon(
    0% 14.4%,
    6% 10%, 12% 5%, 18% 1%, 24% 0%,
    30% 1%, 36% 5%, 42% 10%, 48% 14.4%,
    54% 10%, 60% 5%, 66% 1%, 72% 0%,
    78% 1%, 84% 5%, 90% 10%, 96% 14.4%,
    100% 14.4%, 100% 100%, 0% 100%
  );
}
```

### With Padding Adjustment
```css
.artist-card-clipped {
  clip-path: /* ... same as above ... */;
  padding-block-start: 15%; /* Slightly more than 14.4% clip depth */
}
```

### Background Color Reveal
```css
.artist-card {
  background: var(--color-primary); /* Shows through clipped area */
  padding-block-start: 16%;
}

.artist-card__content {
  background: white;
  clip-path: /* ... */;
}
```

## Important Considerations

### 1. Padding Compensation
The clip-path removes the top 14.4% of the element. You may need to:
- Add `padding-block-start: 15-16%` to the clipped element
- Or position content to account for the clipped area

### 2. Aspect Ratio Impact
- Wave depth is percentage-based (14.4%)
- On tall narrow cards, wave appears deeper
- On wide short cards, wave appears shallower
- Consider using the **subtle variant** (10% depth) for very tall cards

### 3. Browser Support
- `clip-path: polygon()` has excellent support (96%+ global)
- Works in all modern browsers
- Fallback: use `.clip-scallop-wave-top-polygon` for older browsers

### 4. Performance
- CSS clip-path is GPU-accelerated
- No performance concerns for reasonable number of cards
- Polygon simplification available if needed

### 5. Responsive Adjustments
Consider reducing wave depth on mobile:
```css
@media (max-width: 768px) {
  .artist-card-clipped {
    clip-path: polygon(/* 10% depth variant */);
    padding-block-start: 11%;
  }
}
```

## Integration with Astro

### Option 1: Global Utility Classes
Add to global stylesheet:
```astro
---
import '../styles/clip-paths.css';
---
```

Then use:
```html
<div class="clip-scallop-wave-top">
  <img src="..." alt="..." />
</div>
```

### Option 2: Scoped Component Styles
```astro
<style>
  .card-image {
    clip-path: polygon(
      0% 14.4%,
      6% 10%, 12% 5%, 18% 1%, 24% 0%,
      30% 1%, 36% 5%, 42% 10%, 48% 14.4%,
      54% 10%, 60% 5%, 66% 1%, 72% 0%,
      78% 1%, 84% 5%, 90% 10%, 96% 14.4%,
      100% 14.4%, 100% 100%, 0% 100%
    );
  }
</style>
```

### Option 3: CSS Custom Property
```css
:root {
  --clip-scallop-wave: polygon(
    0% 14.4%, 6% 10%, 12% 5%, 18% 1%, 24% 0%,
    30% 1%, 36% 5%, 42% 10%, 48% 14.4%,
    54% 10%, 60% 5%, 66% 1%, 72% 0%,
    78% 1%, 84% 5%, 90% 10%, 96% 14.4%,
    100% 14.4%, 100% 100%, 0% 100%
  );
}

.card {
  clip-path: var(--clip-scallop-wave);
}
```

## Visual Preview

```
  ___    ___         ___    ___
_/   \__/   \___  __/   \__/   \__
|                                |
|                                |
|      Card Content Area         |
|                                |
|________________________________|
```

The wave pattern creates 2 prominent peaks (at ~24% and ~72% horizontal position) with smooth curves connecting them to valleys at the edges and center.

## Testing Checklist

- [ ] Wave appears smooth on different card widths
- [ ] No content is unexpectedly clipped
- [ ] Background color shows through clipped area (if intended)
- [ ] Works on mobile/tablet/desktop
- [ ] Consistent across different browsers
- [ ] Accessible (doesn't hide critical information)

## Next Steps

1. Import `clip-paths.css` into your Astro project
2. Apply to artist card images or containers
3. Adjust padding to compensate for clipped area
4. Test on various card sizes and aspect ratios
5. Consider subtle variant for specific use cases
