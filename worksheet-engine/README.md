# MyPhonicsBooks — Worksheet Engine

Code-generated phonics worksheets with a **locked layout** and **level-based
branding**. The design is fixed; only the *data* changes. No AI image
generation in the render path — that's the point (kills the image-gen bill and
the spelling/alignment/consistency problems that came with it).

```
Book data → Learning goals → Activity type → Reusable template → Generated PDF
```

## Why this stack

- **Next.js + React + TypeScript** — components reused across all books.
- **Puppeteer print-to-PDF** — most print-accurate route. Real web fonts (the
  dotted tracing font), CSS clipart layout and exact A4 sizing render exactly as
  Chrome shows them. `@react-pdf/renderer` was rejected: it can't embed the
  dashed tracing font or do this layout.

## Setup

```bash
cd worksheet-engine
npm install
# drop fonts into public/fonts (see public/fonts/README.md) — at minimum trace.ttf
npm run dev            # preview at http://localhost:3000
```

## Generate PDFs

```bash
# with the dev server (or `npm run build && npm start`) running:
npm run pdf                          # every sheet -> ./output
npm run pdf tap-tap-tap trace-sounds # one sheet
```

## Validate data (run before printing)

```bash
npm run validate
```

Checks each book for: missing focus sounds/words, missing image keys, words
whose letters aren't in `focusSounds`, sort/match words not in the word list,
and content too long / too many items for the locked boxes.

## Project layout

```
src/
  design/
    levelThemes.ts   8 ledger colours; getLevelTheme() THROWS on unknown level
    tokens.ts        A4 sizes, spacing, radius, fonts, type scale (the locked design system)
  data/
    schema.ts        BookData type (bookId, level, focusSounds, decodableWords, ...)
    validate.ts      deterministic data checks
    books/
      tap-tap-tap.ts the first book's data
  components/
    WorksheetFrame.tsx  shared banner / instruction / footer chrome (level-themed)
    TraceLine.tsx       dotted trace text on 3-zone guidelines (uses the trace FONT)
    Clipart.tsx         owned-library image with placeholder fallback
    templates/
      TraceSounds.tsx
      MatchPictureWord.tsx
      SortBySound.tsx
  lib/registry.ts    book ids -> data, activity types -> template
  app/
    print/[book]/[sheet]/page.tsx   the printable route
    api/sheets/route.ts             list of printable sheets (used by the PDF script)
scripts/
  generate-pdf.mjs   Puppeteer -> A4 PDF
  validate-all.mts   runs validate.ts over every book
public/
  fonts/             drop trace.ttf + Andika here
  clipart/           the owned word-image library (one file per imageKey)
```

## Branding is locked to the level — no pink default

Every colour is pulled from `levelThemes.ts`, which mirrors the v2.0 Curriculum
Ledger:

| Level | Name | Colour |
|---|---|---|
| 1 | Ditties | `#E84B8A` Pink |
| 2 | First Sounds | `#F97066` Coral |
| 3 | Special Friends | `#F59E0B` Amber |
| 4 | Longer Sounds | `#22C55E` Green |
| 5 | New Spellings | `#3B82F6` Blue |
| 6 | Building Fluency | `#6366F1` Indigo |
| 7 | Reading Together | `#8B5CF6` Purple |
| 8 | Reading Champion | `#14B8A6` Teal |

`getLevelTheme(level)` **throws** if a book has an unknown level — it never
falls back to a default colour. A book at level N prints in level N's colour.

## Determinism

Same data in → same worksheet out. No `Math.random()`. The "shuffle" on the
match sheet is a fixed reversal of the word order, so it's stable across runs.

## Add a new book

1. `src/data/books/<book-id>.ts` — copy `tap-tap-tap.ts`, fill in `BookData`
   (set `level` to the real level so it gets the right colour).
2. Register it in `src/lib/registry.ts` (`BOOKS`).
3. Add clipart for its `imageKey`s into `public/clipart/`.
4. `npm run validate`, then `npm run pdf`.

## Add a new template (later)

Build a component `({ book }) => …` wrapped in `WorksheetFrame`, then register
it in `TEMPLATES` against its `ActivityType`. The remaining activity types are
already typed in `schema.ts` (sound-spotting, missing-sound, sentence-builder,
draw-and-write, read-and-tick, cut-and-stick, challenge) — wire them as the
business grows toward workbook / homework / intervention / assessment packs.

## Fonts & licensing — read this

- **Trace font** is the single visual lever. Production: **KG Primary Dots
  Lined** (buy the commercial licence). Placeholder: **Print Clearly Dashed**
  (free). Swap `public/fonts/trace.ttf` — nothing else changes.
- **Cursive** comes later for upper levels (e.g. Letterjoin) as a second token.
- ❌ **Do not use Twinkl fonts.** Their licence forbids commercial use and
  embedding in products for sale.
```
