# MyPhonicsBooks — Brand Guidelines

## 1. Brand Identity

**Mission:** Every child deserves a reading book with their name in it, matched to exactly what they can decode today.

**Tagline:** *Personalised phonics books. Print at home.*

**Brand personality:** Warm, encouraging, knowledgeable — like a friendly Year 1 teacher at pick-up time. Never condescending. Never salesy. Always child-first.

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
| 1 | First Sounds | #E84B8A | `level-1` |
| 2 | New Sounds | #F59E0B | `level-2` |
| 3 | Longer Sounds | #22C55E | `level-3` |
| 4 | Blending | #3B82F6 | `level-4` |
| 5 | Split Sounds | #8B5CF6 | `level-5` |
| 6 | Reading to Learn | #14B8A6 | `level-6` |

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
| L1 | 24pt | Largest — first readers need big, clear text |
| L2 | 22pt | Still large, digraphs introduced |
| L3 | 20pt | Moderate — longer words need more space |
| L4 | 18pt | Standard — blending longer clusters |
| L5 | 16pt | Smaller — multi-syllable words |
| L6 | 14pt | Smallest — approaching standard reading size |

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

### 16-page structure
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

### Print guidelines
- Paper: 120gsm white A4, landscape orientation
- Fold: A4 sheets fold to A5, saddle-stitched (4 sheets = 16 pages)
- No light tints below `#e0e0e0` — they disappear on consumer inkjet printers
- Page numbers: dark square badges (#1a1a1a, 8mm x 8mm)

---

## 7. Copywriting Patterns

### Headlines
| Good | Bad |
|------|-----|
| Help Emma read with confidence | Buy our phonics books |
| A reading book made just for Liam | Personalised educational content |
| Matched to their exact phonics level | Advanced AI-powered book generation |
| Every word they can actually read | Comprehensive decodable text solutions |

### CTAs
| Good | Bad |
|------|-----|
| Get Emma's free book | Download now |
| Find your child's level | Take the test |
| Start reading together | Purchase product |
| See what Emma can read | View demo |

### Level descriptions (parent-facing)
| Level | One-liner |
|-------|-----------|
| 1 | Just starting — learning first letter sounds (s, a, t, p, i, n...) |
| 2 | Building up — adding new sounds like sh, ch, th |
| 3 | Getting longer — vowel sounds like ee, oo, ai, igh |
| 4 | Blending more — consonant clusters like fr, st, mp |
| 5 | Split sounds — magic e words and alternative spellings |
| 6 | Reading to learn — longer words with prefixes and suffixes |

---

## 8. Legal & Compliance

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
