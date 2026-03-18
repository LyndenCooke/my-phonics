# MyPhonicsBooks — Brand Guidelines

## 1. Brand Identity

**Mission:** Every child deserves a reading book matched to exactly what they can decode today.

**Tagline:** *Decodable phonics books. Print at home.*

**Brand personality:** Warm, encouraging, knowledgeable — like a friendly Year 1 teacher at pick-up time. Never condescending. Never salesy. Always child-first.

### Personalisation scope
Personalisation (using the child's name) applies to **parent-facing marketing only** — ad copy, landing pages, email subject lines, CTAs. The books themselves are **universal templates** designed for any child to use. Book content must never include specific character names like "Emma" or "Jake", and must never say "A story for [Name]" on the cover or anywhere inside the book. Characters are referenced generically: "the girl", "the boy", "Mum", "Dad". This ensures every book works for every child who downloads it.

---

## 2. Voice & Tone

### Writing style
- British English throughout: colour, organised, mum, favourite, practise (verb)
- Lead with the child's name, not the product: "Help Emma read with confidence" not "Buy our phonics books"
- Speak to parents as partners, not customers
- Simple language — avoid jargon: say "reading level" not "grapheme-phoneme correspondence"
- Warm but credible: friendly teacher, not corporate marketing

### Trust phrases (use these)
- "Aligned with the UK phonics curriculum"
- "Based on Letters and Sounds"
- "Every word matched to your child's reading level"
- "Designed by phonics specialists"

### Avoid
- "Limited time!" / urgency pressure
- "Buy now!" / hard sell language
- Mentioning Read Write Inc, Oxford Reading Tree, or any commercial programme by name
- American English (color, mom, favorite)
- Edu-jargon parents won't know (GPC, segmenting, blending — unless explaining them)

### Ad copy formula
Pain → Solution → Proof → CTA

Example:
> Struggling to find books at the right level for your child?
> MyPhonicsBooks creates personalised stories using only the sounds they've been taught.
> Every word is checked against the UK phonics curriculum.
> Get a free book for [Name] →

---

## 3. Visual Identity

### Level colours
These are the core of the brand. Each reading level has a fixed colour used across books, UI, ads, and merch.

| Level | Name | Hex | Tailwind class |
|-------|------|-----|----------------|
| 1 | Starting Stories | #E84B8A | `level-1` |
| 2 | Longer Sounds | #F59E0B | `level-2` |
| 3 | New Spellings | #22C55E | `level-3` |
| 4 | Building Fluency | #3B82F6 | `level-4` |
| 5 | Reading Together | #8B5CF6 | `level-5` |
| 6 | Reading Champion | #14B8A6 | `level-6` |

### Brand accent
- **Primary accent:** Deep indigo `#312e81` (indigo-900) — warm, authoritative, doesn't clash with any level colour
- **Gradient:** `from-indigo-600 to-violet-600` — used for CTAs, logo badge, hero elements
- **Light tint:** `indigo-50` (#eef2ff) — backgrounds, subtle highlights

### Neutral palette
- Text: `slate-900` (#0f172a)
- Secondary text: `slate-600` (#475569)
- Borders: `slate-200` (#e2e8f0)
- Background: `slate-50` (#f8fafc)
- Card background: `white/70` with `backdrop-blur-md` (glass-panel effect)

---

## 4. Typography

### Website fonts
| Role | Font | Weights | Usage |
|------|------|---------|-------|
| Body | Plus Jakarta Sans | 400, 500, 600, 700 | All body text, form labels, descriptions |
| Headings | Outfit | 500, 600, 700, 800 | h1–h6, display text, hero headlines |

### Book font
| Role | Font | Usage |
|------|------|-------|
| Story text | Andika (SIL International) | All text inside printed books |

**Why Andika:** Single-storey 'a' and 'g' — matches how children are taught to write. This font is for books only, never the website.

### Font sizes (books)
| Level | Story font size | Rationale |
|-------|----------------|-----------|
| L1 | 26pt | Largest — first readers need big, clear text |
| L2 | 22pt | Still large, digraphs introduced |
| L3 | 20pt | Moderate — longer words need more space |
| L4 | 18pt | Standard — blending longer clusters |
| L5 | 16pt | Smaller — multi-syllable words |
| L6 | 14pt | Smallest — approaching standard reading size |

> **Source of truth:** `data/graphemes_by_level.json` — the `font_size` field in that file is authoritative.

---

## 5. UI Patterns

### Glass-panel cards
```css
.glass-panel {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  border-radius: 1rem;
}
```

### Buttons
- **Primary CTA:** `bg-gradient-to-r from-indigo-600 to-violet-600 text-white` — rounded-xl, shadow, 48px+ height
- **Secondary:** `bg-white border border-slate-200 text-slate-700` — hover lifts with shadow
- **Level button:** Background = level colour, white text, rounded-xl

### Touch targets
- Minimum: 48px (all interactive elements)
- Child-facing UI: 64px minimum
- Spacing between tappable elements: 8px minimum

### Mobile-first
- 80%+ traffic expected from Facebook mobile
- Hero must fit above the fold at 375px width
- No horizontal scrolling
- Thumb-friendly: key actions in bottom half of screen

---

## 6. Book Design System

### Page size
A5 portrait (148mm x 210mm), zero margin — full bleed to edges.

### 12-page ditty structure (Level 1 only)
12 pages = 3 sheets of A4, printed double-sided, folded to A5, saddle-stitched.
```
Page 1    Front Cover — level colour band (#E84B8A), brand, illustration, title
Page 2    Guide for Grown-Ups — simplified: 2 tips (Before Reading / After Reading)
Page 3    Sounds and Words — grapheme grid (pink focus sounds), story words, tricky words
Pages 4-9 Story (6 pages) — ONE sentence per page, 26pt Andika, ~20% text / ~80% illustration
Page 10   Can You Read? + Draw — 4 trace words, drawing box
Page 11   Writing Practice — 3 graphemes, bigger rows
Page 12   Back Cover — brand mark, 6-level series grid
```
**Removed from ditty (vs standard):** Nonsense words page, Certificate page, 2 story pages.

### 16-page standard structure (Levels 2–6)
16 pages = 4 sheets of A4, printed double-sided, folded to A5, saddle-stitched.
```
Page 1    Front Cover — level colour band, brand, sounds row, illustration, title
Page 2    Guide for Grown-Ups — before/during/after reading tips
Page 3    Combined Reference — phonics chart + story words + tricky words
Pages 4-11 Story (8 pages) — text top (~25%), illustration below (~75%)
Page 12   Combined Activity — comprehension questions + "Can You Read?" + draw box
Page 13   Writing Practice — 4-line handwriting with trace letters
Page 14   Nonsense Words Challenge — CVC pseudo-words for Phonics Screening Check prep
Page 15   Reading Star Certificate
Page 16   Back Cover — brand mark, 6-level series grid
```

### Word count and sentence limits

| Level | Words per page | Sentences per page | Total story words | Story pages |
|-------|---------------|-------------------|-------------------|-------------|
| L1 | 3–5 | 1 | 40–80 | 6 |
| L2 | 8–14 | 2 | 80–130 | 8 |
| L3 | 10–27 | 2–3 | 130–200 | 8 |
| L4 | 21–44 | 3–4 | 200–280 | 8 |
| L5 | 32–65 | 4–5 | 280–380 | 8 |
| L6 | 50–90 | 5–6 | 380–500 | 8 |

### Print guidelines
- Paper: 120gsm white A4, landscape orientation
- Fold: A4 sheets fold to A5, saddle-stitched (4 sheets = 16 pages)
- No light tints below `#e0e0e0` — they disappear on consumer inkjet printers
- Page numbers: dark square badges (#1a1a1a, 8mm x 8mm)

---

## 7. Illustration Style Guide

> **Full technical reference:** See `.claude/skills/illustration-director/SKILL.md` for complete image prompt engineering, verification checklists, and assessment criteria.

### Art style
- **Whimsical children's book illustration**, hand-drawn cartoon style
- **Soft watercolour textured backgrounds** with clean black-outlined characters
- Warm, friendly, inviting atmosphere
- Soft pastel background colours with pops of bright colour
- Simple rounded shapes, gentle lighting
- Professional picture book quality
- **No text, words, letters, or numbers in any image** — ever

### Character eye style (CRITICAL)
- **Small oval/almond shape, solid dark colour fill**
- **NO iris detail, NO visible pupils, NO highlight/reflection spots, NO eyelashes**
- Characters convey emotion through body language, eyebrow shape, mouth expression, and head tilt
- This simplified style is inclusive and avoids photorealistic features

### Character design
- Each level has ONE defined character (locked via hero reference image)
- Character wears the **SAME outfit on every page** of their book
- Same hairstyle, same skin tone, same body proportions — no variation
- Objects (shell, bike, crab) must look the same across all pages they appear in
- 6 different characters across 6 levels represent diverse backgrounds (skin tones, hair types, clothing, cultural elements)

### Character roster

| Level | Description |
|-------|-------------|
| L1 | Dark brown skin, short curly black hair. Red jumper, blue denim dungarees, blue wellies. About 5 years old. |
| L2 | Warm brown skin, lilac hijab. Yellow raincoat over purple dress, red wellies. About 6 years old. |
| L3 | Light skin, freckles, messy blond hair. Green cycling jersey with white stripe, black shorts, green helmet. About 7 years old. |
| L4 | Olive skin, long dark brown hair in a thick plait. Orange hoodie, dark grey leggings, brown muddy boots. About 7 years old. |
| L5 | Light brown skin, short curly brown hair. Blue fleece jacket over white t-shirt, khaki trousers, brown walking boots. About 8 years old. |
| L6 | East Asian features, neat black bob haircut. Teal cardigan over white blouse, dark blue pleated skirt, white socks, black shoes, woven sun hat. About 8 years old. |

### Image technical specs
| Property | Value |
|----------|-------|
| Format | PNG |
| Cover size | 768 x 1024 (3:4 portrait) |
| Story page size | 1024 x 768 (4:3 landscape) |
| Pipeline | Flux Kontext Pro via fal.ai |
| Hero generation | Flux Dev (text-to-image) |

---

## 8. Copywriting Patterns

> **Reminder:** Personalisation (child's name) is for **marketing copy only** — ads, landing pages, emails, CTAs. The books themselves are universal templates with no specific names. See Section 1 for details.

### Headlines (marketing and parent-facing)
| Good | Bad |
|------|-----|
| Help your child read with confidence | Buy our phonics books |
| A reading book matched to their level | Personalised educational content |
| Matched to their exact phonics level | Advanced AI-powered book generation |
| Every word they can actually read | Comprehensive decodable text solutions |

### CTAs (marketing and parent-facing)
| Good | Bad |
|------|-----|
| Get your child's free book | Download now |
| Find your child's level | Take the test |
| Start reading together | Purchase product |
| See what they can read | View demo |

### Level descriptions (parent-facing)
| Level | Name | One-liner |
|-------|------|-----------|
| 1 | Starting Stories | Just starting — knows all letter sounds including sh, ch, th |
| 2 | Longer Sounds | Getting longer — learning vowel sounds like ee, oo, ai, igh |
| 3 | New Spellings | New spellings — magic e words, alternative spellings, and blends |
| 4 | Building Fluency | Building fluency — reading longer, more flowing stories |
| 5 | Reading Together | Reading together — longer stories with deeper understanding |
| 6 | Reading Champion | Reading champion — longer words with suffixes, reading independently |

---

## 9. Legal & Compliance

### Required disclaimers
- "Based on Letters and Sounds (DfE 2007), a public-domain phonics programme"
- "Not affiliated with Read Write Inc, Oxford Reading Tree, or any commercial phonics programme"

### GDPR
- Email capture requires explicit opt-in checkbox (not pre-ticked)
- Privacy policy link visible at point of data collection
- Unsubscribe link in every email
- Data stored in UK/EU or GDPR-compliant infrastructure

### Children's data
- We collect the child's first name and reading level only
- No direct child accounts — all interaction through parent
- No child photos or biometric data
- Compliant with ICO Age Appropriate Design Code principles

---

## 10. Skills and Data References

Any AI system generating books, stories, illustrations, or assessments for MyPhonicsBooks **must** consult the relevant skills and data files listed below. These contain detailed rules, validation logic, and source-of-truth data that go beyond what this brand guidelines document covers.

### Skills (in `.claude/skills/`)
| Skill | Purpose | When to use |
|-------|---------|-------------|
| `phonics-story-writer` | Story generation rules, engagement hooks, word validation | Writing any story |
| `book-assessor` | Quality gate: 7-check assessment process | Before delivering any book |
| `illustration-director` | Art style, character design, image prompts, verification | Generating any illustration |
| `book-template-designer` | Page layout, CSS, print specs, template structure | Building any PDF |
| `phonics-expert` | Phonics pedagogy, RWI alignment | Reference for phonics questions |
| `phonics-data-engineer` | Data integrity, grapheme validation | Maintaining data files |

### Data files (in `data/`)
| File | Purpose | Authority level |
|------|---------|----------------|
| `graphemes_by_level.json` | All graphemes per level, cumulative, font sizes | **AUTHORITATIVE** — single source of truth |
| `tricky_words_by_level.json` | Tricky words per level, cumulative | **AUTHORITATIVE** — single source of truth |
| `word_banks/level_*.json` | Decodable words per level | Reference for story writing |
| `story_summaries.json` | 30 story summaries (5 per level) | Reference for story planning |
| `story_templates/*.json` | 10 story arc templates | Reference for story structure |
| `pilot_stories.py` | 6 completed pilot stories | Gold standard reference |

### External prompts
| File | Purpose |
|------|---------|
| `Gemini_MD.md` | Complete system prompt for AI book generation (use in AntiGravity or equivalent) |

### Additional skills
| Skill | Purpose | When to use |
|-------|---------|-------------|
| `art-generator` | Hero injection pipeline for consistent illustrations | Generating any book's images |
