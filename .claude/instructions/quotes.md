# Working with Quotes

How to find, evaluate, and use quotes in festival content.

**For trusted sources, see `research.md`.**

---

## Types of Quotes

| Type | Source | Best for |
|------|--------|----------|
| Quotes **BY** the artist | Interviews, features, artist statements | Insight into artistic vision, personality |
| Quotes **ABOUT** the artist | Critics, reviews, other musicians | External validation, credibility |

**Balance:** Use both types when available. Quotes ABOUT (from independent sources) carry more weight for marketing. Quotes BY show personality and artistic depth.

---

## Where to Find Quotes

### For Quotes ABOUT the Artist

**Best sources (independent):**
- Concert/album reviews in newspapers of record
- Music critics and reviewers
- Festival program notes (other festivals)
- Encyclopedic sources (Grove, etc.)

**Look for:**
- Specific praise with substance (not just "wonderful performance")
- Unique observations about style or artistry
- Comparisons to other artists (context)
- Superlatives with backing ("the finest interpreter of...")

### For Quotes BY the Artist

**Best sources:**
- Published interviews (newspapers, magazines, podcasts)
- Artist features and profiles
- Program notes written by the artist
- Liner notes from recordings

**Look for:**
- Insight into artistic choices
- Personal connection to repertoire
- Philosophy about music-making
- Memorable, quotable phrases

---

## What Makes a Good Quote

### Strong Quotes

- **Specific:** Says something concrete about the artist/music
- **Memorable:** Phrasing that sticks with the reader
- **Attributable:** Clear author and source
- **Relevant:** Connects to what we're promoting
- **Fresh:** Not overused on every website

### Weak Quotes

- **Generic:** "A wonderful musician" (says nothing specific)
- **Unattributed:** No clear source or author
- **Recycled:** Appears on every bio and website
- **Outdated:** From decades ago with nothing recent
- **Self-promotional:** Artist praising themselves excessively

---

## Language Rules

### English Quotes

Keep in English for both NO and EN content:
- Norwegians understand English
- Original language preserves authenticity

### Other Languages (German, French, Italian, etc.)

Translate and indicate source language:

**Norwegian content:**
```
"Translated quote here." [oversatt fra tysk]
```

**English content:**
```
"Translated quote here." [translated from German]
```

---

## Attribution Requirements

**Three elements required:**

1. **Author** - who said/wrote it (journalist name, critic name, the artist)
2. **Source** - where it was published (publication name)
3. **Link** - URL for verification

### Why This Matters

- Verifiable quotes build credibility
- Readers can find original context
- Protects against misattribution

### Common Problems

| Problem | Example | Solution |
|---------|---------|----------|
| No author | "Critics have called her..." | Find the specific critic's name |
| Vague source | "...according to reviews" | Find the specific publication |
| Recycled quote | Same quote on 10 websites | Track down original source |
| No link | Quote with no URL | Search for original article |

**Rule:** Prefer properly attributed quotes. Use unattributed only as last resort when no other content available. Flag for user review.

---

## Attribution Format

### Display Format

```
"Quote text here."
— Author Name, Publication
```

### In quoteComponent (Sanity)

| Field | Content | Example |
|-------|---------|---------|
| `quote_no` / `quote_en` | The quote text | "She is among the finest..." |
| `forfatter` | Author name | Geoff Brown |
| `kilde` | Publication/source | The Times |
| `cite` | Source URL | https://thetimes.co.uk/... |

### Adding Context

When helpful, add context in brackets:

```
"Quote about specific topic." [fra intervju om Beethoven-innspillingen]
```

---

## Quality Checklist

Before using a quote:

- [ ] Source verified (URL works, quote exists)
- [ ] Author identified (not just "critics say")
- [ ] Publication identified (specific name)
- [ ] Quote is accurate (not paraphrased incorrectly)
- [ ] Translation noted if applicable
- [ ] Relevant to content being created
