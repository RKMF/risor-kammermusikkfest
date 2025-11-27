# CSS Architecture Documentation

## Overview

This project uses a modular CSS architecture optimized for maintainability and performance. CSS is organized into focused files with clear separation of concerns.

## File Structure

```
frontend/src/styles/
├── reset.css           # Browser consistency (CSS reset)
├── tokens.css          # Design tokens (variables)
├── base.css            # Typography, links, forms, accessibility
├── utilities.css       # Spacing, display, flexbox, grid utilities
├── components.css      # Buttons, badges, cards
├── layouts.css         # Container patterns, image handling
├── artist-card.css     # Shared artist card component
├── program.css         # Program page specific styles
├── event.css           # Event detail page styles
└── artists.css         # Artist overview page styles
```

## Load Order

CSS files are imported in Layout.astro in a specific order:

```javascript
import '../styles/reset.css';       // 1. Reset browser defaults
import '../styles/tokens.css';      // 2. CSS variables
import '../styles/base.css';        // 3. Base typography/links/forms
import '../styles/utilities.css';   // 4. Utility classes
import '../styles/components.css';  // 5. UI components
import '../styles/layouts.css';     // 6. Layout patterns
import '../styles/artist-card.css'; // 7. Shared components
```

Page-specific CSS (program.css, event.css, artists.css) is imported directly in those pages.

## Critical CSS Strategy

### Current Approach (Recommended)

The project uses **Astro's built-in CSS optimization** which:
- Bundles and minifies CSS at build time
- Removes unused CSS automatically
- Generates optimal output without manual intervention

**Inline Critical Styles** in Layout.astro `<style>` block:
- Page layout grid (sticky footer pattern)
- Skip navigation link
- Print styles
- User preference queries (reduced motion, high contrast)

This approach provides excellent performance without the complexity of manual critical CSS extraction.

### Why Not Async CSS Loading?

Manual async CSS loading was considered but **not implemented** after technical analysis. Here's the detailed reasoning:

#### Performance Reality Check

**Current CSS Size:**
- Per-page CSS bundles: 2-7 KB gzipped
- Largest bundle: 28.30 KB → 6.65 KB gzipped
- Total across all pages: ~25 KB (minified + gzipped)

**Expected Gains from Async Loading:**
- First Contentful Paint improvement: 50-100ms on 4G
- Largest Contentful Paint improvement: 50-150ms on 4G
- Total impact: ~5-10 Lighthouse points

**Why These Gains Are Modest:**
1. CSS is already tiny (below HTTP/2 initial congestion window of 14 KB)
2. Astro automatically splits CSS per-page (no massive global bundle)
3. Critical layout CSS already inlined in Layout.astro
4. Modern browsers aggressively preload stylesheets in `<head>`

#### High-Risk Factors

1. **FOUC with HTMX (HIGH SEVERITY)**
   - HTMX loads content dynamically after initial page load
   - If async CSS hasn't loaded, dynamic content appears unstyled
   - Affects program page filters, artist scrollbars, all dynamic interactions
   - Requires JavaScript coordination to block HTMX until CSS loads

2. **Cumulative Layout Shift Risk (MEDIUM-HIGH)**
   - Async-loaded CSS causes layout recalculation
   - Current CLS likely 0.0 (no shifts)
   - Async CSS could introduce 0.05-0.15 CLS (visible jank)
   - Harms user experience more than 80ms saved helps it

3. **Maintenance Burden (MEDIUM-HIGH)**
   - Critical CSS extraction must be re-evaluated with every CSS change
   - Two CSS files to maintain (critical + async)
   - Build complexity increases
   - Developer velocity decreases
   - Harder to debug styling issues

#### Why Current Approach is Optimal

1. **Astro Already Optimizes**
   - Bundles and minifies at build time
   - Tree-shakes unused CSS automatically
   - Per-page code splitting (not one massive bundle)
   - Critical path handled without manual intervention

2. **Critical CSS Already Inline**
   - Layout.astro has ~260 lines of critical inline CSS
   - Page layout grid (sticky footer pattern)
   - Skip navigation accessibility
   - Print styles and user preference queries
   - This is the 20% that gives 80% of the benefit

3. **Aligns with Project Philosophy**
   - PROJECT_GUIDE.md: "working code > elegant code"
   - Premature optimization is the root of all evil
   - Focus on features, not micro-optimizations

#### The Verdict

**Cost:** 8-16 hours implementation + permanent maintenance burden
**Benefit:** 50-120ms improvement on slow connections
**Risk:** FOUC on every HTMX interaction + potential CLS increase
**ROI:** Poor

**This is textbook premature optimization.** The CSS is already optimized.

### Higher-Impact Optimization Opportunities

If performance becomes an issue, focus on these **instead** of CSS async loading:

#### 1. JavaScript Optimization (31x Larger Than CSS)
- **Visual Editing component:** 654 KB (209 KB gzipped)
- **Current issue:** Loaded on every page, even when not in preview mode
- **Fix:** Lazy-load only when `hasPreviewMode === true`
- **Expected impact:** 500ms-1s faster Time to Interactive
- **Effort:** 3-4 hours

#### 2. Image Optimization (10-50x Larger Than CSS)
- **Current state:** Images likely much larger than CSS
- **Fix:**
  - Use Astro's `<Picture>` component for responsive images
  - Implement WebP with JPEG fallback (Sanity CDN doesn't support AVIF)
  - Lazy-load below-the-fold images
  - Add explicit width/height to prevent CLS
- **Expected impact:** 500ms-2s faster LCP
- **Effort:** 4-6 hours

#### 3. Font Loading Strategy
- **Fix:**
  - Preload critical fonts
  - Use `font-display: swap` or `optional`
  - Subset fonts to required characters
- **Expected impact:** 100ms faster FCP, reduced CLS
- **Effort:** 1-2 hours

#### 4. HTTP/2 Server Push (If Not Already Enabled)
- **Fix:** Configure server to push critical CSS with HTML
- **Expected impact:** 100-200ms faster FCP
- **Effort:** Infrastructure configuration
- **Benefit:** No FOUC risk, works with current architecture

#### 5. Monitoring Before Optimizing
- Set up Lighthouse CI
- Monitor Core Web Vitals in production
- Measure first, optimize what actually matters
- Don't optimize based on assumptions

### Performance Budget Guidance

**When to revisit CSS optimization:**
- Total CSS > 50 KB gzipped per page (currently: 2-7 KB)
- FCP > 2.5s on 3G (currently: likely < 1.5s)
- Lighthouse Performance < 80 (currently: likely 90+)
- Real user monitoring shows CSS blocking rendering

**Until then:** Focus on features and higher-impact optimizations (JS, images, fonts).

## Layout Philosophy: Base Width & Intrinsic Responsiveness

### Core Principle: The Web is Naturally Responsive

**Key Insight:** Websites are responsive by default. We often make them more complicated than they need to be. Text wraps naturally, images shrink, and flexbox/grid layouts adapt - until we force them not to.

### The Base Width Pattern

**Foundation:** All pages use a base width constraint for comfortable layouts:

```css
.content-wrapper {
  width: min(100ch, 100% - 4rem);
  margin-inline: auto;
}
```

**What this does:**
- **At wide viewports:** Content maxes out at 100ch (fits 3×320px cards comfortably)
- **At narrow viewports:** Content takes `100% - 4rem` (full width with 2rem padding on each side)
- **The `min()` function:** Automatically picks whichever value is smaller
- **`margin-inline: auto`:** Centers the content horizontally

**Why this works:**
- No media queries needed for basic responsive behavior
- Built-in padding at all sizes (content never touches viewport edges)
- Self-adapting based on available space
- Creates predictable, comfortable reading experience

### Six-Level Width System

Components can make width decisions relative to the base. This hierarchical system provides precise control over content width while maintaining visual consistency:

**1. Extra Narrow (40ch)** - Special content blocks
- Pull quotes, blockquotes
- Spotify embeds, compact media
- Callouts, highlighted content
- Use `.content-extra-narrow` class
- Centered for visual emphasis and maximum readability
- Example components: Quote.astro, Spotify.astro

**2. Media Narrow (55ch)** - Media components
- Accordion components
- Image components
- Video components
- Two-column layouts
- Use `.content-media-narrow` class
- Balanced width for media content - wider than text but narrower than full width
- Example components: Accordion.astro, Image.astro, Video.astro, TwoColumn.astro

**3. Narrow (65ch)** - Body text and paragraphs
- Body text, descriptions, articles
- PortableText content
- Standard prose and reading content
- Use `.content-narrow` class
- Optimal line length for comfortable reading (~65 characters per line)
- Example components: PortableText.astro
- Used for event excerpts and page excerpts

**4. Base (100ch)** - Default for all content
- Card grids, mixed content layouts
- Standard multi-column components
- Default - inherits from `.content-wrapper` in Layout.astro
- Fits three 320px cards side-by-side with gaps
- No extra styling needed (uses base width from Layout.astro)

**5. Wide (95ch)** - Multi-column layouts
- Grid layouts
- Three-column layouts
- Use `.content-wide` class
- Narrower than base width to create visual distinction for layout containers
- Example components: Grid.astro, ThreeColumn.astro

**6. Full (100%)** - Breakout for visual elements
- Hero images, full-bleed galleries
- Navigation, headers, footers
- Background sections
- Use `.content-full` class
- Escapes all width constraints
- Uses full available viewport width

### Natural Wrapping Over Forced Scrolling

**Principle:** Trust the web's natural behavior. Let things wrap and stack naturally as the viewport narrows.

**Use horizontal scrolling only when:**
- It's a deliberate UX pattern (carousel, gallery preview)
- Content is meant to be browsed quickly (like a magazine rack)
- You have many items (10+) and want to show a curated preview
- Vertical stacking would lose the intended experience

**For most content:**
- Let flex items wrap with `flex-wrap: wrap`
- Use `grid-template-columns: repeat(auto-fit, minmax(250px, 1fr))`
- Allow natural stacking on mobile
- No `overflow-x: scroll` unless truly beneficial

### Container Queries Integration

Container queries let components respond to their container's size, not the viewport. This pairs perfectly with the base width pattern:

**The base width becomes a container:**
```css
.content-wrapper {
  width: min(100ch, 100% - 4rem);
  margin-inline: auto;
  container-type: inline-size;
  container-name: content;
}
```

**Components adapt to available space:**
```css
.component {
  /* Stack on narrow containers */
  grid-template-columns: 1fr;

  /* Side-by-side when container has space */
  @container content (min-width: 60ch) {
    grid-template-columns: 1fr 1fr;
  }
}
```

**Benefits:**
- Components are truly modular - work anywhere
- Respond to actual available space, not viewport assumptions
- Think component-first, not page-first
- No arbitrary breakpoints needed

### Layout Parent-Child Width Handling

**The Problem:** Components like Quote (40ch), Image (55ch), and PortableText (65ch) have width wrappers for standalone use. When placed inside layout components (Grid, TwoColumn, ThreeColumn), these children would try to maintain their own width constraints, causing them to break out of their parent columns or appear incorrectly sized.

**The Solution:** Layout components create container query contexts, and we globally override child width constraints when inside these layouts.

#### Implementation

**1. Layout components become container contexts:**
```css
.grid-container {
  container-type: inline-size;
  container-name: grid-layout;
}

.two-column-layout {
  container-type: inline-size;
  container-name: two-column-layout;
}

.three-column-layout {
  container-type: inline-size;
  container-name: three-column-layout;
}
```

**2. Children fill parent column space:**
```css
/* Children inside layout containers fill available column space */
.grid-container > .grid-item > :global(*),
.two-column-layout > .column > :global(*),
.three-column-layout > .column > :global(*) {
  width: 100% !important;
  max-width: 100% !important;
  margin-inline: 0 !important;
}
```

#### Design Principles

This approach combines principles from:
- **Every Layout** by Andy Bell and Heydon Pickering
- **Kevin Powell's container query patterns**

Key principles applied:

1. **Component Autonomy**: Components work standalone with their own width constraints
2. **Context Adaptation**: Components automatically adapt when placed inside layouts
3. **Composability**: No props, variants, or manual configuration needed
4. **Intrinsic Design**: Layout respects the natural behavior of content
5. **Container-based Responsiveness**: Components respond to their container, not the viewport

#### Examples

**Standalone Quote Component:**
```
Page (100ch base width)
  └─ Quote (.content-extra-narrow: 40ch)
     └─ Centered, 40ch wide
```

**Quote Inside TwoColumn:**
```
Page (100ch base width)
  └─ TwoColumn (.content-media-narrow: 55ch)
     ├─ Column 1 (~27.5ch available)
     │  └─ Quote (overridden to 100% of column = ~27.5ch)
     └─ Column 2 (~27.5ch available)
        └─ PortableText (overridden to 100% of column = ~27.5ch)
```

**Quote Inside Grid:**
```
Page (100ch base width)
  └─ Grid (.content-wide: 95ch, 3 columns)
     ├─ Column 1 (~300px)
     │  └─ Image (overridden to 100% of column = ~300px)
     ├─ Column 2 (~300px)
     │  └─ Quote (overridden to 100% of column = ~300px)
     └─ Column 3 (~300px)
        └─ Video (overridden to 100% of column = ~300px)
```

#### Benefits

- **Zero Configuration**: Components "just work" in any context
- **Maintainable**: Add new components without updating layout logic
- **Predictable**: Clear parent-child width relationships
- **Modern CSS**: Uses container queries and logical properties
- **Composable**: Mix and nest layouts without conflicts

### Implementation Status

**Current:** Implemented project-wide via Layout.astro

**What's Done:**
- Base width system added to `layouts.css` with utility classes
- `Layout.astro` applies 100ch constraint globally via `.content-wrapper`
- All pages inherit the base width automatically
- Container queries enabled for responsive components

**Reference:** Based on Kevin Powell's smart layouts with container queries:
- Article: https://css-tricks.com/smart-layouts-with-container-queries/
- Approach: Progressive enhancement with intrinsic CSS
- Philosophy: Simplicity and natural responsiveness first

**How to Use:**
- Extra narrow: Add `.content-extra-narrow` class for 40ch width (quotes, Spotify)
- Media narrow: Add `.content-media-narrow` class for 55ch width (accordions, images, videos, two-column)
- Narrow: Add `.content-narrow` class for 65ch width (body text, paragraphs)
- Default: Content stays within 100ch (no extra classes needed) - fits 3 cards
- Wide: Add `.content-wide` class for 95ch width (multi-column layouts like Grid, ThreeColumn)
- Break out: Add `.content-full` class for full-width sections
- Components can use container queries to adapt within available space

---

## Design Patterns

### CSS Custom Properties (Tokens)

All design tokens live in `tokens.css`:
- Colors: `--color-blue`, `--color-green`, etc.
- Spacing: `--space-1` through `--space-12`
- Typography: `--font-size-base`, `--line-height-normal`
- Transitions: `--transition-fast`, `--transition-base`

### Container Queries

Modern responsive design using container queries:
```css
.component {
  container-type: inline-size;
}

@container (max-width: 700px) {
  .component { /* responsive styles */ }
}
```

### Intrinsic CSS

Content-driven layouts without media queries:
```css
.auto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
}
```

### Scrollbar Pattern

Consistent scrollbar styling defined in `utilities.css` (`.scrollbar-styled`):
- Thin scrollbar with custom colors
- Blue thumb, green hover
- Larger on touch devices
- **Note:** Kept inline in context due to container queries

### HTMX Compatibility

**Important:** CSS must be global (not scoped) because HTMX dynamically loads content that needs these styles. This is why we use file-based CSS instead of Astro's scoped styles.

## Browser Support

### Modern Features Used

| Feature | Support | Fallback Strategy |
|---------|---------|-------------------|
| Container Queries | 93%+ | Traditional media queries via `@supports not` |
| CSS Grid | 96%+ | No fallback needed |
| Logical Properties | 95%+ | Legacy properties provided |
| Custom Properties | 97%+ | No fallback needed |
| `clamp()` | 93%+ | No fallback needed (graceful degradation) |

### Target Browsers

- Chrome/Edge 105+ (container queries)
- Firefox 121+ (container queries)
- Safari 15.4+ (container queries)
- Modern mobile browsers (iOS 15.4+, Android Chrome 105+)

Older browsers get slightly less optimal layouts but remain fully functional.

### Browser Support Philosophy

**Progressive Enhancement Approach:**
1. **Core Experience (All Browsers)**
   - Semantic HTML structure
   - Readable typography
   - Functional navigation
   - Accessible content
   - Works without CSS

2. **Enhanced Experience (Modern Browsers)**
   - Container queries for responsive components
   - Intrinsic CSS layouts (clamp, min/max)
   - CSS custom properties for theming
   - Logical properties for i18n support
   - Advanced scrollbar styling

3. **Fallback Strategy**
   - `@supports not` queries for container queries
   - Traditional media queries as fallback
   - Legacy physical properties alongside logical ones
   - Graceful degradation (not feature parity)

### Testing Browsers

**Priority Testing:**
- Latest Chrome (primary development browser)
- Latest Safari (iOS/macOS consistency)
- Latest Firefox (standards compliance)
- Safari iOS 15.4+ (container query baseline)

**Occasional Testing:**
- Edge (Chromium-based, usually same as Chrome)
- Firefox Android
- Chrome Android

**No Support:**
- Internet Explorer (end of life)
- Safari < 15.4 (lacks container queries)
- Chrome < 105 (lacks container queries)

Users on unsupported browsers will get functional but less polished layouts.

## Best Practices

### Semantic HTML: No Divs Just for Divs

**Core Principle:** Width utility classes should be applied directly to semantic HTML elements, not wrapper divs. Semantics are important.

**Why This Matters:**
- Cleaner DOM with less nesting
- Better semantic HTML structure
- Consistent with web standards
- Easier to maintain
- Improved accessibility

**Pattern to Follow:**
```astro
<!-- ✅ Good: Utility class on semantic element -->
<section class="event-description content-narrow">
  <h2 class="section-title">Om konserten</h2>
  <p class="description-text">{description}</p>
</section>

<!-- ❌ Bad: Unnecessary wrapper div -->
<div class="content-narrow">
  <section class="event-description">
    <h2 class="section-title">Om konserten</h2>
    <p class="description-text">{description}</p>
  </section>
</div>
```

**Component Examples:**
- Quote.astro: `.content-extra-narrow` on `<blockquote>` (not wrapper div)
- Spotify.astro: `.content-extra-narrow` on `<figure>` (not wrapper div)
- Image.astro: `.content-media-narrow` on `<figure>` (not wrapper div)
- Video.astro: `.content-media-narrow` on `<figure>` (not wrapper div)
- PortableText.astro: `.content-narrow` on `<section>`/`<article>`/`<div>` (not wrapper div)
- TwoColumn.astro: `.content-media-narrow` on `<section>` (not wrapper div)
- ThreeColumn.astro: `.content-wide` on `<section>` (not wrapper div)
- Grid.astro: `.content-wide` on `<section>` (not wrapper div)

**When Wrapper Divs Are Acceptable:**
- Only use wrapper divs when structurally necessary for layout (e.g., `.grid-container` inside Grid.astro)
- Never add a div solely for the purpose of applying a width constraint
- If you find yourself adding a wrapper div, ask: "Does this serve a structural purpose beyond width?"

### When to Create New CSS

1. **Use existing utilities first** - Check `utilities.css` for spacing, display, etc.
2. **Page-specific styles** - Create new file (e.g., `contact.css`)
3. **Shared components** - Add to `components.css` or create separate file
4. **Layout patterns** - Add to `layouts.css`

### Naming Conventions

- **BEM-style** for component classes: `.component-name`, `.component__element`, `.component--modifier`
- **Utility classes** - Single purpose: `.flex`, `.gap-4`, `.text-center`
- **Semantic names** - Describe purpose, not appearance: `.card` not `.box-with-border`

### Code Organization

```css
/* File header with purpose */

/* ============================================
   SECTION NAME
   ============================================

   Brief description of what this section does.
*/

.class-name {
  /* Properties in logical order:
     1. Position/layout
     2. Box model
     3. Typography
     4. Visual
     5. Misc
  */
}
```

### Accessibility

All CSS follows accessibility guidelines:
- Sufficient color contrast (WCAG AA minimum)
- Focus indicators on interactive elements
- Respects user preferences (prefers-reduced-motion, prefers-contrast)
- Skip navigation links
- Semantic HTML structure

## Refactor History

### Phase 1: Extract Shared Components
- Created `artist-card.css` from duplicated code
- Eliminated 330+ lines of duplication
- Improved maintainability

### Phase 2: Split Global CSS
- Split `global.css` (860 lines) into 4 focused files
- Improved organization and findability
- Clearer separation of concerns

### Phase 3: Document Scrollbar Pattern
- Created `.scrollbar-styled` utility pattern
- Documented usage across scroll containers
- Maintained inline styles for container query contexts

### Phase 4: Critical CSS Analysis & Documentation
- Analyzed current CSS performance (2-7 KB gzipped per page)
- Evaluated async CSS loading proposal with technical assessment
- **Decision:** Do NOT implement async loading (premature optimization)
- **Rationale:**
  - Expected gain: 50-120ms (minimal)
  - Risk: FOUC with HTMX + increased CLS
  - Cost: 8-16 hours + permanent maintenance burden
  - ROI: Poor
- Documented higher-impact optimization opportunities (JS, images, fonts)
- Current approach already optimal for this project's needs

### Phase 5: Documentation & Browser Support Policy
- Added comprehensive browser support policy to `tokens.css` header
- Documented target browsers (Chrome 105+, Firefox 121+, Safari 15.4+)
- Documented modern CSS features and fallback strategies
- Updated CSS_ARCHITECTURE.md with complete refactor history
- Added migration notes for future developers
- Completed comprehensive CSS architecture refactor

## Performance Metrics

Current CSS performance is excellent:
- Total CSS size: ~25KB (minified + gzipped)
- First Contentful Paint: Fast
- No render-blocking issues
- Astro optimization handles bundling

No further optimization needed unless metrics indicate a problem.

## Maintenance

### Adding New Styles

1. Determine category (base, utility, component, layout, page-specific)
2. Add to appropriate file
3. Follow existing patterns and naming
4. Test across key pages
5. Update this documentation if architecture changes

### Modifying Existing Styles

1. Search for class name across all CSS files
2. Consider impact on other pages/components
3. Test changes visually
4. Watch for HTMX dynamic content compatibility

### Troubleshooting

**Issue:** Styles not applying to HTMX-loaded content
- **Solution:** Ensure styles are in global CSS files, not scoped

**Issue:** Container queries not working
- **Solution:** Check `@supports not (container-type: inline-size)` fallback

**Issue:** Layout shift on page load
- **Solution:** Check if critical styles are inline in Layout.astro

## Migration Notes for Future Developers

### Coming from the Old Structure (Pre-Refactor)

If you're maintaining this project or joining after the refactor, here's what changed:

#### What Happened

**Before (Single File):**
- `global.css` - 860 lines, everything in one file
- Duplicated artist card styles in `artists.css` and `event.css`
- Hard to find specific styles
- Merge conflicts common

**After (Modular Structure):**
- `global.css` → Split into 4 focused files:
  - `base.css` - Typography, links, forms, accessibility
  - `utilities.css` - Spacing, display, flexbox, grid utilities
  - `components.css` - Buttons, badges, cards
  - `layouts.css` - Container patterns, image handling
- `artist-card.css` - Extracted shared component (eliminated 330+ lines duplication)
- Page-specific files remain: `program.css`, `event.css`, `artists.css`

#### Why These Changes Were Made

1. **Maintainability** - Find styles faster, reduce duplication
2. **Performance** - No change (Astro already optimizes)
3. **Developer Experience** - Clear organization, easier to onboard
4. **Code Quality** - DRY principles, single source of truth

#### If You Need to Find Old Code

The original `global.css` is preserved in git history (commit da49786 and earlier):
```bash
# View the old global.css anytime:
git show da49786:frontend/src/styles/global.css
```

**How to find where something moved:**

| Old Location | New Location |
|-------------|--------------|
| Typography (h1-h6, p, a) | `base.css` |
| Utility classes (.flex, .gap-4) | `utilities.css` |
| Buttons, badges, cards | `components.css` |
| Container, intrinsic grids | `layouts.css` |
| Artist card styles | `artist-card.css` |
| Form styles | `base.css` |
| Focus indicators | `base.css` |

#### How to Add New Styles

**Decision Tree:**

1. **Is it shared across multiple pages?**
   - Typography/forms → Add to `base.css`
   - Utility class → Add to `utilities.css`
   - UI component → Add to `components.css`
   - Layout pattern → Add to `layouts.css`

2. **Is it a shared component (used on 2+ pages)?**
   - Create separate file (e.g., `artist-card.css`)
   - Import in `Layout.astro`

3. **Is it page-specific?**
   - Add to page's CSS file (e.g., `program.css`)
   - Or create new file (e.g., `contact.css`)
   - Import at page level, not in Layout

#### Common Migration Pitfalls

**Pitfall 1: "I can't find the button styles!"**
- **Solution:** They're in `components.css` now (lines 1-50)

**Pitfall 2: "My styles aren't loading!"**
- **Solution:** Check import order in `Layout.astro` (reset → tokens → base → utilities → components → layouts)

**Pitfall 3: "I want to add a new utility class"**
- **Solution:** Add to `utilities.css`, not inline in components

**Pitfall 4: "Where did `global.css` go?"**
- **Solution:** It was split into modular files and deleted. View git history if needed: `git show da49786:frontend/src/styles/global.css`

#### What NOT to Do

1. **Don't recreate `global.css`** - The split structure is intentional (original in git history)
2. **Don't duplicate styles** - Check existing files first
3. **Don't skip the import order** - Order matters (cascade dependencies)
4. **Don't inline styles** - Use existing classes or add to appropriate file

#### Quick Reference for Common Tasks

**Task: Add a new button style**
```css
/* File: components.css */
.btn-new-style {
  /* Add properties */
}
```

**Task: Add a new utility class**
```css
/* File: utilities.css */
.new-utility {
  /* Add properties */
}
```

**Task: Style a new page**
```css
/* Create: new-page.css */
/* Import in: pages/new-page.astro */
```

**Task: Create a shared component**
```css
/* Create: component-name.css */
/* Import in: layouts/Layout.astro */
```

#### Performance Considerations

**Don't worry about:**
- File size (Astro optimizes and minifies)
- Number of files (Astro bundles efficiently)
- Import order beyond logical cascade (Astro handles it)

**Do worry about:**
- Duplicating styles (DRY principle)
- Breaking HTMX dynamic content (keep styles global, not scoped)
- Container query fallbacks (use `@supports not`)

#### Getting Help

If you're stuck or unsure:
1. Read this document (CSS_ARCHITECTURE.md)
2. Check git history to see where old code was: `git log --follow frontend/src/styles/`
3. Search codebase for similar patterns
4. Review `tokens.css` for available design tokens
5. Check Layout.astro for import order

**Philosophy:** Keep it simple, follow existing patterns, don't over-engineer.

## Typography System: Utopia Fluid Type Scale

### Background

The project uses a **Utopia-based fluid typography system** that creates harmonious visual hierarchy using the Major Third (1.25) musical ratio. This was implemented in January 2025 to replace the previous manual clamp() calculations.

### Why Utopia?

**Problem Solved:**
- Previous type scale used manually-calculated `clamp()` values
- Spacing system was already Utopia-inspired but typography wasn't
- Inconsistent approach made maintenance harder
- Limited scale (7 steps) didn't provide enough editorial flexibility

**Utopia Benefits:**
1. **Systematic Foundation**: Calculator-generated values based on explicit parameters
2. **Type-Space Harmony**: Typography now matches the existing Utopia-inspired spacing system
3. **Musical Connection**: Major Third ratio (1.25 = 5:4) comes from just intonation frequency ratios
4. **More Flexibility**: 9 steps (--step--2 through --step-6) vs. previous 7 steps
5. **Clear Documentation**: Generated values include provenance link back to calculator

### Technical Implementation

**Configuration Parameters:**
```
Viewport Range: 320px (mobile) → 1240px (desktop)
Min Scale (320px): 16px base, 1.2 ratio (Minor Third - tighter on mobile)
Max Scale (1240px): 18px base, 1.25 ratio (Major Third - elegant on desktop)
Total Steps: 9 (--step--2 through --step-6)
```

**Generated Scale:**
```css
--step--2: clamp(0.7813rem, 0.7736rem + 0.0341vw, 0.8rem);       /* 13-14px - Micro text */
--step--1: clamp(0.9375rem, 0.9119rem + 0.1136vw, 1rem);         /* 15-18px - Small UI */
--step-0: clamp(1.125rem, 1.0739rem + 0.2273vw, 1.25rem);        /* 18-23px - Body text */
--step-1: clamp(1.35rem, 1.2631rem + 0.3864vw, 1.5625rem);       /* 22-28px - H5 */
--step-2: clamp(1.62rem, 1.4837rem + 0.6057vw, 1.9531rem);       /* 26-35px - H4 */
--step-3: clamp(1.944rem, 1.7405rem + 0.9044vw, 2.4414rem);      /* 31-44px - H3 */
--step-4: clamp(2.3328rem, 2.0387rem + 1.3072vw, 3.0518rem);     /* 37-55px - H2 */
--step-5: clamp(2.7994rem, 2.384rem + 1.8461vw, 3.8147rem);      /* 45-69px - H1 */
--step-6: clamp(3.3592rem, 2.7874rem + 2.5413vw, 4.7684rem);     /* 54-86px - Display */
```

**Legacy Aliases (Backward Compatibility):**
```css
--fs-base: var(--step-0);   /* Old code still works */
--fs-lg: var(--step-1);
--fs-xl: var(--step-2);
--fs-2xl: var(--step-3);
--fs-3xl: var(--step-4);
```

### Usage Guidelines

**For full usage details**, see `/frontend/src/styles/TYPOGRAPHY_GUIDE.md`

**Quick Reference:**
- `--step--2`: Fine print, legal disclaimers (13-14px)
- `--step--1`: Captions, labels, metadata (15-18px)
- `--step-0`: Body text, navigation (18-23px) ← Primary reading size
- `--step-1`: H5, emphasized text (22-28px)
- `--step-2`: H4, card titles (26-35px)
- `--step-3`: H3, section headings (31-44px)
- `--step-4`: H2, page subtitles (37-55px)
- `--step-5`: H1, page titles (45-69px)
- `--step-6`: Display headings, festival announcements (54-86px)

### Musical Context

**Why Major Third (1.25)?**

The Major Third ratio comes from just intonation in Western music - it's the interval between C and E (frequency ratio of 5:4). This creates:
- Visual harmony that aligns with musical harmony
- Warmth and brightness without aggression
- Elegant restraint appropriate for classical music aesthetic
- Clear hierarchy without excessive drama

This isn't a metaphor - it's the same mathematical relationship that makes chords sound harmonious, applied to typography.

### Migration Strategy

**Current State:**
- All existing code using `--fs-*` continues to work via legacy aliases ✓
- New code should use `--step-*` naming for clarity
- Gradually migrate components during maintenance
- Legacy aliases can be removed in future major version

**No Breaking Changes:**
The Utopia implementation maintains complete backward compatibility. Existing components continue working without modification.

### Accessibility Compliance

- **WCAG AA**: Minimum 16px base, all sizes use rem units ✓
- **Browser Zoom**: Respects 200% zoom (WCAG 1.4.4) ✓
- **User Preferences**: All rem-based values respect browser font-size settings ✓
- **Fluid Scaling**: Maintains clear hierarchy at all viewport sizes ✓

### Resources

**Utopia Type Calculator:**
https://utopia.fyi/type/calculator/?c=320,16,1.2,1240,18,1.25,9,2,

**Documentation:**
- **Typography Guide**: `/frontend/src/styles/TYPOGRAPHY_GUIDE.md` (comprehensive usage examples)
- **Tokens File**: `/frontend/src/styles/tokens.css` (lines 184-271)
- **Musical Theory**: Just Intonation and the Major Third (5:4 ratio)

---

## General Resources

- [Astro CSS Docs](https://docs.astro.build/en/guides/styling/)
- [Container Queries MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Container_Queries)
- [Intrinsic CSS](https://every-layout.dev/)
- [HTMX Docs](https://htmx.org/)
- [Utopia Fluid Design](https://utopia.fyi/)

---

**Last Updated:** 2025-01-27 (Utopia Typography Implementation)
**Maintainer:** Development Team
