# MyPhonicsBooks

Personalised, phonics-structured reading books for children aged 4–8. Parents enter their child's name, interests, and reading level. The system generates a print-ready A5 PDF. Print on A4, fold, staple — real book.

## The Non-Negotiable Constraint

**Every word in the story must be either:**
1. **Decodable** at the selected level (child can sound it out using only taught graphemes), OR
2. **A listed tricky word** for that level or below.

No exceptions. This is the entire educational value proposition.

## Architecture

```
Parent Input → Story Selection → Text Generation (Claude) → Quality Gate → Image Generation → PDF Assembly
```

**Template-based:** 10 fixed story templates × 6 reading levels = 60 book moulds. AI personalises content, not structure.

### PDF Pipeline
```
generate_book.py → Jinja2 (book_templates/book.html) → Playwright/Chromium → A5 PDF
```

## The 6 Reading Levels (aligned to RWI colour bands)

| Level | Name | RWI Band | Sound Sets | Words/Book | Template |
|-------|------|----------|-----------|------------|---------|
| 1 | Starting Stories | Red | ALL Set 1 (singles + special friends + best friends — 36 graphemes) | 40-80 | Ditty (12pp) |
| 2 | Longer Sounds | Green + Purple | Set 2 long vowels (ay,ee,igh,ow,oo,ar,or,air,ir,ou,oy) | 80-130 | Standard (16pp) |
| 3 | New Spellings | Pink + Orange | Early Set 3 (ea,a-e,i-e,o-e,u-e,oi,aw,ai,oa,ie) + clusters unlocked | 130-200 | Standard |
| 4 | Building Fluency | Yellow | Later Set 3 (are,ur,er,ew,ue,ow-cow) + fluency | 200-280 | Standard |
| 5 | Reading Together | Blue | Final Set 3 (ore,oor,ire,ear,ure,tion) + comprehension | 280-380 | Standard |
| 6 | Reading Champion | Grey | Suffixes (ous,cious/tious,able/ible) + independent reading | 380-500 | Standard |

**Level colours:** L1=#E84B8A, L2=#F59E0B, L3=#22C55E, L4=#3B82F6, L5=#8B5CF6, L6=#14B8A6

**Story font sizes:** L1=26pt, L2=22pt, L3=20pt, L4=18pt, L5=16pt, L6=14pt

**5 stories per level** (30 total). See `data/story_summaries.json` for all summaries with focus sounds.

## Book Templates

### Level 1: Ditty Template (12 pages = 3 sheets A4)
```
Page 1    Front Cover
Page 2    Guide for Grown-Ups (simplified — 2 tips)
Page 3    Sounds and Words
Pages 4–9 Story (6 pages) — ONE sentence per page, 26pt font, 80% illustration
Page 10   Can You Read? + Draw
Page 11   Writing Practice (3 graphemes, bigger rows)
Page 12   Back Cover
```

### Levels 2-6: Standard Template (16 pages = 4 sheets A4)
```
Page 1    Front Cover
Page 2    Guide for Grown-Ups — before/during/after reading tips
Page 3    Combined Reference — phonics chart, story words, tricky words
Pages 4–11 Story (8 pages) — text on top (~25%), illustration below (~75%)
Page 12   Combined Activity — questions, "Can You Read?", draw box
Page 13   Writing Practice — 4-line handwriting with trace letters
Page 14   Nonsense Words Challenge — CVC pseudo-words (Phonics Screening Check prep)
Page 15   Reading Star Certificate
Page 16   Back Cover — brand, 6-level series grid
```

Saddle-stitched. Font: Andika (SIL) — single-storey 'a' and 'g'.

## 10 Story Templates

| # | Template | Core Arc | Emotional Beat |
|---|----------|----------|----------------|
| 1 | The Adventure | Goes somewhere new | Courage |
| 2 | The Lost Thing | Finds and returns something | Kindness |
| 3 | The New Friend | Meets someone different | Friendship |
| 4 | The Big Day | Special event | Excitement |
| 5 | The Helper | Solves a problem | Empathy |
| 6 | The Discovery | Finds a secret place | Wonder |
| 7 | The Pet Story | Animal companion | Care |
| 8 | The Sport/Game | Competition or team activity | Perseverance |
| 9 | The Weather Day | Weather changes the day | Adaptability |
| 10 | The Family Day | Outing with family | Belonging |

Each template defines 8 scenes with placeholders ([NAME], [FRIEND], [LOCATION], etc.), illustration briefs, and interest mappings. See `data/story_templates/`.

## Key Files

### Generation
| File | Purpose |
|------|---------|
| `generate_book.py` | Renders Jinja2 template + Playwright PDF (entry point) |
| `preview_pages.py` | Captures PNG screenshots per page for QA |
| `book_templates/book.html` | Jinja2 standard template — 16 pages (Levels 2-6) |
| `book_templates/book_ditty.html` | Jinja2 ditty template — 12 pages (Level 1 only) |
| `book_templates/base.html` | Base HTML template |

### Phonics Data
| File | Purpose |
|------|---------|
| `data/graphemes_by_level.json` | Which graphemes are taught at each level |
| `data/tricky_words_by_level.json` | Exception words per level (cumulative) |
| `data/word_banks/level_N_words.json` | Permitted decodable words per level |
| `data/story_summaries.json` | All 30 story summaries (5 per level) with focus sounds |
| `data/story_templates/*.json` | 10 story template definitions |
| `data/rwi_reference.json` | RWI sound progression (reference only) |
| `data/letters_and_sounds_reference.json` | Letters & Sounds phases (reference only) |
| `data/assessment_structure.json` | Assessment design and adaptive algorithm |

### Validation
| File | Purpose |
|------|---------|
| `validate_words.py` | Grapheme decomposition, word classification |
| `rebuild_word_banks.py` | Rebuilds word bank JSONs with correct level assignments |

### Execution (Claude API pipeline)
| File | Purpose |
|------|---------|
| `execution/generate_story_text.py` | Claude API — constrained story generation |
| `execution/generate_questions.py` | Comprehension questions |
| `execution/generate_worksheet.py` | Writing worksheet content |
| `execution/validate_word_bank.py` | Quality gate — phonics validation |
| `execution/process_order.py` | Order orchestration |
| `execution/user_db.py` | SQLite database (MVP) |
| `execution/utils/level_config.py` | Level definitions, sentence complexity rules |
| `execution/utils/word_bank.py` | Word bank loading |
| `execution/utils/tricky_words.py` | Tricky word lists |
| `execution/utils/story_templates.py` | Template loading + interest matching |
| `execution/utils/api_clients.py` | Anthropic client initialisation |

### Web App
| File | Purpose |
|------|---------|
| `main.py` | FastAPI server — all API endpoints |
| `frontend/` | React + Vite + Tailwind (skeleton) |
| `backend/server.js` | Express.js — Stripe checkout endpoint |

## Design System

- **Font:** Andika (SIL International) — `assets/fonts/Andika-*.ttf`
- **Page size:** A5 (148mm × 210mm), `@page { size: 148mm 210mm; margin: 0; }`
- **Page numbers:** Dark square badges (#1a1a1a, 8mm×8mm), even=left, odd=right
- **Story layout:** Text on TOP, illustration below (matches openClaw reference)
- **Handwriting:** 4-line system — ascender (dotted), x-height (solid), baseline guide (dotted), baseline (solid)
- **Print-safe:** No light tints below #e0e0e0 (disappear on inkjet)

## Environment Variables

See `.env.example` for all required keys. Key ones:
- `ANTHROPIC_API_KEY` — Claude for story generation + validation
- `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` — payments
- `STORAGE_BACKEND=sqlite` — MVP uses SQLite
- `IMAGE_ENGINE=dalle` — DALL-E 3 for prototyping

## How to Generate a Book

```bash
cd C:\Users\ASUS\myphonicsbooks\myphonicsbooks
python generate_book.py          # → output/books/*.pdf + debug HTML
python preview_pages.py          # → output/previews/page_*.png
```

## Reference Materials

- `C:\Users\ASUS\Downloads\emma_level1_opt.pdf` — openClaw reference PDF (gold standard layout)
- `C:\Users\ASUS\Downloads\rwi_RFS_Assessment_01.pdf` — RWI assessment sheet
- `C:\Users\ASUS\Downloads\rwi_RPhO_Assessment guidance.pdf` — RWI assessment guidance

## Operating Principles

1. **The word bank is the law.** No word passes into a book unless decodable or a listed tricky word.
2. **Templates are moulds.** AI personalises content, not structure.
3. **British English throughout.** Colour not color. Mum not mom.
4. **Print-test everything.** A book that looks good on screen but folds wrong on paper is a failed book.
5. **We are NOT Read Write Inc.** Own level names (1–6), own terminology (decodable/tricky/nonsense), own design. Based on Letters and Sounds (public domain), aligned to RWI colour-band progression. No association with Ruth Miskin Training.

## Current State

- PDF generation: **working** (Jinja2 + Playwright pipeline)
- Word banks: **complete** (6 levels, ~1000 words + tricky words)
- Story templates: **complete** (10 templates with JSON structure)
- Book template: **complete** (16-page HTML/CSS)
- Story text generation: **code exists** (Claude API + retry validation)
- Frontend: **skeleton** (React + Vite, components stubbed)
- Backend: **skeleton** (Express Stripe endpoint + FastAPI endpoints)
- Image generation: **not started** (placeholders only)
- Assessment funnel: **designed** (see data/assessment_structure.json)
