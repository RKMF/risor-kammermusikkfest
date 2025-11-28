# Typography Usage Guide

## Overview

This guide provides clear semantic meaning for each typography step in the Utopia-based type scale. Use this as a reference when creating content for concert programs, artist profiles, and all festival content.

---

## Type Scale Reference

### Display Level (Special Use)

**--step-6** (Display Heading) - `54px → 86px`
- **Use for:**
  - Festival name in hero sections
  - Special announcement headlines
  - Large promotional banners
  - Homepage main titles
- **Example:** "Risør Kammermusikkfest 2025"
- **Font:** Domaine Text Bold
- **When to use:** Sparingly - only for maximum impact moments

---

**--step-5** (Hero Heading) - `45px → 69px`
- **Use for:**
  - Hero section headlines
  - Landing page main titles
  - Major announcement headers
- **Example:** "Velkommen til festivalen"
- **Font:** Domaine Text Bold
- **When to use:** Primary hero content, festival welcomes

---

### Heading Levels (Standard Hierarchy)

**--step-4** (H1 - Page Titles) - `37px → 55px`
- **Use for:**
  - Main page titles
  - Concert detail headlines
  - Artist profile names (primary heading)
  - Major event titles
- **Example:** "Konsertprogram 2025"
- **Font:** Domaine Text Medium/Bold
- **When to use:** Once per page as primary heading

---

**--step-3** (H2 - Section Headings) - `31px → 44px`
- **Use for:**
  - Major page sections
  - Event category headers
  - Artist biography headings
  - Program section dividers
- **Example:** "Kommende konserter"
- **Font:** Domaine Text Medium
- **When to use:** Major content divisions within a page

---

**--step-2** (H3 - Subsection Headings) - `26px → 35px`
- **Use for:**
  - Card titles in grids
  - Event titles in listings
  - Artist names in card components
  - Composition titles
- **Example:** "Beethovens strykekvartet nr. 14"
- **Font:** Domaine Text Regular/Medium
- **When to use:** Content cards, list items, subsections

---

**--step-1** (H4-H5 - Minor Headings) - `22px → 28px`
- **Use for:**
  - Subsection labels
  - Card metadata headers
  - Form section titles
  - Secondary artist information
- **Example:** "Praktisk informasjon"
- **Font:** Domaine Text Regular
- **When to use:** Smaller divisions, secondary headings

---

### Body & Utility Levels

**--step-0** (Base - Body Text) - `18px → 23px`
- **Use for:**
  - All body copy
  - Concert descriptions
  - Artist biographies
  - Navigation links
  - Form inputs
  - General paragraph text
- **Example:** Standard paragraph text describing a concert
- **Font:** Akkurat Pro Regular
- **When to use:** All reading content (primary text size)

---

**--step--1** (Small - Captions & Labels) - `15px → 18px`
- **Use for:**
  - Image captions
  - Form labels
  - Metadata (dates, times, locations)
  - Bylines and credits
  - Secondary information
- **Example:** "21. juni 2025, kl. 19:30 | Risør kirke"
- **Font:** Akkurat Pro Regular
- **When to use:** Supporting information, metadata

---

**--step--2** (Micro - Fine Print) - `13px → 14px`
- **Use for:**
  - Footer copyright
  - Legal disclaimers
  - Auxiliary information
  - Ultra-compact UI elements
- **Example:** "© 2025 Risør Kammermusikkfest"
- **Font:** Akkurat Pro Regular
- **When to use:** Fine print, legal text, footer content

---

## Font Family Guidelines

### Domaine Text (Serif)

**Use for:**
- All headings (H1-H6)
- Event titles
- Artist names
- Concert program titles
- Emphasized content that deserves elegance

**Weights:**
- **Regular (400)**: H4-H5, body-level headings
- **Medium (500)**: H2-H3, section headings
- **Bold (700)**: H1, display headings, maximum emphasis

**Why:** Conveys elegance and tradition appropriate for classical music while maintaining excellent readability.

---

### Akkurat Pro (Sans-serif)

**Use for:**
- Body text
- Navigation
- UI elements (buttons, forms, labels)
- Metadata (dates, times, locations)
- Functional content

**Weights:**
- **Regular (400)**: All body text, most UI
- **Bold (700)**: Emphasized UI elements, button text

**Why:** Clean, neutral support that ensures readability without competing with content hierarchy.

---

## Line Height Guidelines

**Tight (1.2)** - Headings
- Use for all H1-H6
- Creates visual cohesion in multi-line headings
- Reduces vertical space
- Makes headings feel unified

**Normal (1.6)** - Body Text
- Use for all paragraphs
- Optimal for readability
- Comfortable for extended reading
- WCAG-compliant spacing

**Relaxed (1.8)** - Special Cases
- Long-form articles
- Dense program notes
- Accessibility-enhanced reading modes
- When extra breathing room is needed

---

## Real-World Examples

### Concert Detail Page

```astro
<h1 style="font-size: var(--step-4)">
  <!-- H1: Page title -->
  Beethovens strykekvartet nr. 14
</h1>

<p style="font-size: var(--step--1); color: var(--color-text-secondary)">
  <!-- Metadata -->
  21. juni 2025, kl. 19:30 | Risør kirke
</p>

<h2 style="font-size: var(--step-3)">
  <!-- H2: Section heading -->
  Om konserten
</h2>

<p style="font-size: var(--step-0)">
  <!-- Body text -->
  Ludwig van Beethovens strykekvartet nr. 14 i ciss-moll, op. 131,
  regnes som et av de største mesterstykkene i kammermusikkens
  repertoar...
</p>

<h3 style="font-size: var(--step-2)">
  <!-- H3: Subsection -->
  Utøvere
</h3>

<p style="font-size: var(--step-0)">
  <!-- Body text -->
  Ensemble Allegria fra Oslo...
</p>
```

---

### Artist Card Grid

```astro
<article class="artist-card">
  <h3 style="font-size: var(--step-2)">
    <!-- H3: Card title -->
    Ensemble Allegria
  </h3>

  <p style="font-size: var(--step--1); color: var(--color-text-secondary)">
    <!-- Metadata -->
    Strykekvartett fra Oslo
  </p>

  <p style="font-size: var(--step-0)">
    <!-- Body text -->
    Ensemble Allegria ble grunnlagt i 2018...
  </p>
</article>
```

---

### Homepage Hero

```astro
<section class="hero">
  <h1 style="font-size: var(--step-5)">
    <!-- Hero heading -->
    Velkommen til Risør Kammermusikkfest 2025
  </h1>

  <p style="font-size: var(--step-1)">
    <!-- Large intro text -->
    21.-29. juni 2025
  </p>

  <p style="font-size: var(--step-0)">
    <!-- Body text -->
    Opplev verdensklasse kammermusikk i den pittoreske kystbyen Risør.
  </p>
</section>
```

---

## Accessibility Notes

### WCAG Compliance
- All sizes use `rem` units (respect user browser settings) ✓
- Minimum 16px base ensures WCAG AA compliance ✓
- Line height 1.6 for body text meets readability standards ✓
- Color contrast tested for all heading/body combinations ✓

### Browser Zoom
- Scale respects 200% browser zoom (WCAG 1.4.4) ✓
- Fluid typography maintains hierarchy at all zoom levels ✓
- No text becomes unreadable when user adjusts font size ✓

### Screen Readers
- Semantic HTML headings (H1-H6) used consistently ✓
- Heading hierarchy never skips levels ✓
- Descriptive heading text provides context ✓

---

## Musical Connection

The Major Third ratio (1.25 = 5:4) used in this type scale represents the interval between C and E in Western music. This genuine musical connection creates visual harmony that aligns with the mathematical beauty inherent in classical music.

**Just Intonation:**
- C to E = Major Third = 5:4 frequency ratio = 1.25
- Creates warmth and brightness without aggression
- Embodies elegant restraint appropriate for classical music aesthetic

This isn't a metaphor - it's the same mathematical relationship that makes chords sound harmonious, applied to typography for visual harmony.

---

## Migration Guide

### For Developers

**Old naming (still works via legacy aliases):**
```css
font-size: var(--fs-base);
font-size: var(--fs-lg);
font-size: var(--fs-2xl);
```

**New naming (preferred for new code):**
```css
font-size: var(--step-0);
font-size: var(--step-1);
font-size: var(--step-3);
```

**Strategy:**
- All existing code continues to work ✓
- New code should use `--step-*` naming
- Gradually migrate during maintenance
- Legacy aliases can be removed in future major version

---

## FAQ

**Q: Why are body text sizes larger (18-23px) than typical (16-18px)?**
A: Research shows larger body text improves readability, especially for classical music audiences who often adjust browser font sizes. Our fluid scale ensures comfortable reading across all devices.

**Q: Can I use custom font sizes outside this scale?**
A: Avoid it when possible. The scale provides mathematical harmony and clear hierarchy. If you need a size not in the scale, consult the design team first.

**Q: How do I choose between --step-2 and --step-3 for a heading?**
A: Consider content hierarchy. Section headings (H2) use --step-3. Subsections and card titles (H3) use --step-2. Follow semantic HTML heading levels.

**Q: When should I use Domaine Text vs. Akkurat Pro?**
A: Domaine Text for all headings and content that needs elegance (artist names, concert titles). Akkurat Pro for body text, navigation, and functional UI elements.

---

## Resources

**Utopia Type Calculator:**
https://utopia.fyi/type/calculator/?c=320,16,1.2,1240,18,1.25,9,2,

**Generated from parameters:**
- Viewport: 320px → 1240px
- Min scale: 16px base, 1.2 ratio (Minor Third)
- Max scale: 18px base, 1.25 ratio (Major Third)
- Total steps: 9 (--step--2 through --step-6)

**Tokens File:**
`/frontend/src/styles/tokens.css` (lines 184-271)

**Musical Theory Reference:**
Just Intonation and the Major Third (5:4 ratio)

---

*Last updated: January 2025*
