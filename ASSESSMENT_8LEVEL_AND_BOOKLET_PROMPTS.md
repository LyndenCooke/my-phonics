# Claude Code Prompts — 8-Level Assessment Remap, Paper Assessment, Marketing Booklets

Three self-contained prompts for Claude Code. Run them in order: Prompt 1 first (everything else depends on the assessment being 8-level), then 2 and 3 in either order.

Each prompt is paste-ready and assumes the agent knows nothing. Paste one whole prompt into a fresh Claude Code session, let it finish and verify, then move to the next.

Shared house rules baked into every prompt: British English spelling throughout (colour, personalised, practise as verb), no em dashes, no Oxford commas, and never break the decodable rule (every word in any book is decodable at its level or a listed tricky word).

---

## PROMPT 1 — Remap the parent assessment from 6 levels to 8 levels

```
You are working in the MyPhonicsBooks repository (Vite + React + TypeScript + Tailwind front end, Supabase back end). Do not assume prior context; read the files named below before changing anything.

## Background

The product has two parallel "level" systems and they are out of sync:

1. The BOOK JOURNEY is 8 levels. Source of truth: `src/lib/levels8.ts` (exported `JOURNEY_LEVELS`). The 8 levels are:
   - L1 Ditties (Pink #E84B8A): s a t p i n m d g o
   - L2 First Sounds (Coral #F97066): c k ck e u r h b f ff l ll ss j v w x y z
   - L3 Special Friends (Amber #F59E0B): sh nk ch th ng qu zz
   - L4 Longer Sounds (Green #22C55E): ay ee igh ow oo ar or air ir ou oy
   - L5 New Spellings (Blue #3B82F6): a-e i-e o-e u-e ea ie oi aw ai oa
   - L6 Building Fluency (Indigo #6366F1): ur er are ow ew ue wr kn ge dge mb gn ph wh
   - L7 Reading Together (Purple #8B5CF6): ire ore ear oor ure tion
   - L8 Reading Champion (Teal #14B8A6): -ous -cious -tious -able -ible

2. The PARENT ASSESSMENT is still 6 levels with the OLD names. Source: `src/lib/assessmentData.ts` (exports `ASSESSMENT_ITEMS`, `PASS_CRITERIA`, `AGE_EXPECTATIONS`, `LEVEL_NAMES`, `CATEGORY_LABELS`, `getCategoriesForLevel`) and the engine `src/lib/adaptiveEngine.ts` (exports `SCREENING_WORDS`, `calculateStartLevel`, tranche logic).

The mapping from old 6 to new 8 is NOT a simple renumber:
- Old L1 (which crammed all of Phase 2 to 3) SPLITS into new L1, L2 and L3 by grapheme.
- Old L2 -> new L4, old L3 -> new L5, old L4 -> new L6, old L5 -> new L7, old L6 -> new L8 (content unchanged, just renumbered and renamed).

This split has ALREADY been done for the school module. Use it as your reference and authority:
`src/school/data/assessmentItems.ts` — an 8-level item bank where L1 to L3 were written from scratch around the Set 1 progression and L4 to L8 are the old parent L2 to L6 re-tagged. Read its header comment and its data before you write anything.

## Your task

Bring the PARENT assessment fully onto the 8-level system, aligned to `src/lib/levels8.ts` and consistent with `src/school/data/assessmentItems.ts`. Do not touch the Supabase book catalogue or its legacy sub_level tags; the mapping in `levels8.ts` (`JOURNEY_SUBLEVEL_BY_LEGACY`) already handles book placement and must stay as-is.

Concretely:

1. `src/lib/assessmentData.ts`
   - Replace the 6-level `ASSESSMENT_ITEMS` with an 8-level bank. For new L4 to L8, lift the old L2 to L6 item sets verbatim (sounds, real words, alien words, tricky words, speedy reading) and re-tag the level number. For new L1 to L3, split the old L1 items by decodability: assign each word to the lowest new level whose cumulative graphemes (from `levels8.ts`) can spell it. Where the school bank `src/school/data/assessmentItems.ts` already has L1 to L3 items, reuse those rather than reinventing, so the parent and school banks agree.
   - Replace `LEVEL_NAMES` with the 8 names, colours and phases from `levels8.ts` (or import directly from `levels8.ts` to avoid drift; prefer importing).
   - Expand `PASS_CRITERIA` to 8 entries. Keep sounds 90, words 85, alien 75, tricky 70 across all levels. Fluency now begins at NEW L6 (old Building Fluency was old L4): L6 fluency 90 wpm, L7 100, L8 110. L1 to L5 have no fluency threshold.
   - Rewrite `AGE_EXPECTATIONS` so the expected, below and above levels reference the 8-level scale and the age ranges in `levels8.ts`.
   - Update `getCategoriesForLevel` so the fluency category is added from level 6 upward, not level 4.

2. `src/lib/adaptiveEngine.ts`
   - Rewrite `SCREENING_WORDS` to one representative real word per level for all 8 levels (use clearly decodable words from each level's bank, for example L1 "pin", L2 "duck", L3 "fish", L4 "park", L5 "cake", L6 "chew", L7 "station", L8 "famous"; pick the best from the actual bank).
   - Fix `calculateStartLevel`: the loop must run 1 to 8 and the cap must be 7 (start at the highest passed level to confirm it, capped so there is always a level above to verify), not the current 1 to 6 / cap 5.
   - Find and fix every other place that hardcodes 6 levels (loop bounds, `<= 6`, `Math.min(x, 5)`, arrays of length 6, level-6 special cases).

3. Sweep the rest of the app for 6-level assumptions that depend on the assessment and reconcile them to 8 levels using `levels8.ts` as the single source of truth. At minimum check: `src/pages/Assessment.tsx`, `src/pages/funnels/AssessmentFunnel.tsx`, `src/pages/funnels/AssessmentResult.tsx`, `src/pages/funnels/FreeAssessment.tsx`, `src/pages/Progress.tsx`, and anything importing `LEVEL_NAMES` or `AGE_EXPECTATIONS` from `assessmentData.ts`. The result screen's national and international comparison chart must read against the 8-level scale.

## Constraints

- British English throughout. No em dashes, no Oxford commas.
- Decodable rule: every real word in the bank must be spellable using only the graphemes taught up to and including that level. Verify this for new L1 to L3 especially, since that is where the split is risky. Alien words follow the same grapheme rule.
- Keep the `Category` union, the `AssessmentItem` interface and all existing export names stable so importers do not break. If you must rename, update every importer.
- Do not alter Supabase migrations, book tags, or `JOURNEY_SUBLEVEL_BY_LEGACY`.

## Definition of done

- `npm run build` and `npm run lint` pass with no new errors.
- `npm test` passes; if assessment tests assert 6 levels, update them to 8 and explain each change in your summary.
- A child taking the assessment can be placed at any level 1 to 8, and the result screen shows the correct 8-level name, colour and age comparison.
- You output a short written summary listing: every file changed, how you split old L1 into new L1 to L3, any decodable-rule fixes you made, and any tests you updated.
```

---

## PROMPT 2 — Build the one-page paper assessment with QR

```
You are working in the MyPhonicsBooks repository. Do not assume prior context; read the files named below first.

## Goal

Create a printable single-sheet paper assessment, one per level, in the style of a Read Write Inc placement sheet: a teacher or parent sits with the child, works down the sheet, and arrives at a level. Each sheet has a QR code in the corner so they can instead do the full adaptive version online.

PREREQUISITE: the 8-level assessment remap (Prompt 1) must be merged first. The item content for these sheets comes from the 8-level bank in `src/lib/assessmentData.ts`. If that file is still 6 levels, stop and say so.

## What to build

A small generator that outputs eight A4 PDFs (one per level, L1 to L8) plus a combined PDF of all eight.

Match the existing print pipeline rather than inventing a new one. The book pipeline lives in `myphonics_books/` and renders HTML through Jinja2 and Playwright (headless Chromium) to PDF; the marketing leaflet at `marketing/leaflet/leaflet.html` shows the brand styling (A5, the 8 level-colour bands as CSS variables, fonts Andika, Outfit and Plus Jakarta Sans). Reuse that approach: build an HTML/Jinja template, render with Playwright to PDF. Put the new code under `marketing/paper-assessment/`.

## Each sheet contains

- Header: "MyPhonicsBooks — Quick Level Check", the level number, level name and the level colour as a band along the top, pulled from `src/lib/levels8.ts`.
- Four boxed sections for THIS level, lifted from `ASSESSMENT_ITEMS` in `src/lib/assessmentData.ts`:
  1. Sounds — say each sound (the level's graphemes)
  2. Real Words — read aloud
  3. Alien Words — sound out (label them clearly as made-up)
  4. Tricky Words — recognise on sight
  Use the wording from `CATEGORY_INSTRUCTIONS` in `assessmentData.ts` so paper and screen match.
- A simple scoring box: comfortable with most of these means this level fits; if they struggle, try the level below; if they fly through, try the level above. Reference the relevant `AGE_EXPECTATIONS` line so a parent sees whether the result is around age expectations.
- A QR code in the bottom corner with the caption "Prefer to do it online? Scan for the full 3-minute check." The QR encodes:
  `https://myphonicsbooks.com/assessment?src=paper_L{n}`
  where {n} is the level number, so we can later see which paper sheet drove signups.
- A discreet footer: myphonicsbooks.com, plus a one-line "Built by a British primary teacher, QTS."

## QR generation

Generate the QR PNGs in the same script using the Python `qrcode` library (add to `myphonics_books/requirements.txt` if not present). One QR per level with its own `src=paper_L{n}` tag. Save them under `marketing/paper-assessment/qr/`.

## Constraints

- British English. No em dashes, no Oxford commas.
- A4 portrait, 3 mm bleed, text 5 mm inside trim, full colour.
- The decodable rule still holds: every printed real and alien word must be decodable at that level. The data already satisfies this if Prompt 1 was done correctly; do not add new words.
- Use the single-storey Andika font for any child-facing words (the sounds and words the child reads), consistent with the books.

## Definition of done

- Running the generator produces `marketing/paper-assessment/output/level_1.pdf` to `level_8.pdf` and a combined `all_levels.pdf`.
- Each QR resolves to the correct tagged assessment URL (test by decoding the generated PNG).
- A short README in `marketing/paper-assessment/` explaining how to regenerate.
- You output a summary of files created and the exact command to rebuild the sheets.
```

---

## PROMPT 3 — Build the printable marketing booklet with two QR codes

```
You are working in the MyPhonicsBooks repository. Do not assume prior context; read the files named below first.

## Goal

Produce a print-ready 20-page A5 marketing booklet for each level: a real decodable book that doubles as a lead magnet given free to parents, libraries and schools. The body stays a genuine book; marketing is concentrated at the back so it never reads as a flyer (this is what keeps it acceptable to libraries). The full design rationale is in `marketing/PRINTABLE_BOOKLET_PLAN.md` — read it first and treat it as the brief.

PREREQUISITES:
- Prompt 1 (8-level assessment remap) merged, because the in-booklet level-check page and its QR depend on it.
- Prompt 2 (paper assessment) is helpful but not required; you may reuse its "Find Your Level" layout for page 13 if it exists.

## Source pipeline

The books are generated by the Python pipeline in `myphonics_books/` (`scripts/generate_book.py`, Jinja2 templates rendered via Playwright to A5 PDF; `STORY_FONT_SIZES` and the level ledger live in `generate_book.py`; grapheme data in `myphonics_books/data/graphemes_by_level.json`, which is the authoritative 8-level set). The marketing leaflet artwork and the 8 colour bands are in `marketing/leaflet/leaflet.html`. Existing assets: per-level covers `marketing/leaflet/assets/cover_L1.png` to `cover_L8.png`, and a website QR `marketing/leaflet/assets/qr_site.png`.

Build a "marketing edition" assembly step (do not fork the whole pipeline). Put new code under `marketing/booklet/`. It should take a chosen book per level and emit a 20-page print PDF.

## 20-page structure (A5, saddle-stitched, multiple of four)

1 Front cover (real cover, unchanged)
2 Guide for Grown-Ups, with one quiet line: "Not sure this is the right level? Find out free in 3 minutes."
3 Combined Reference (phonics chart, story words, tricky words)
4 to 11 The story (8 pages, unchanged)
12 Combined Activity
13 "Find Your Child's Reading Level" page — REPLACES the standard handwriting/Writing Practice page. A short check for this level (Sounds, Real Words, Alien Words, Tricky Words) lifted from `src/lib/assessmentData.ts`, a simple scoring rule, and the ASSESSMENT QR.
14 Nonsense Words Challenge (unchanged)
15 Reading Star Certificate (unchanged)
16 Inner back cover of the book block: title, level band, "Read the whole level at myphonicsbooks.com"
17 Leaflet/marketing: what MyPhonicsBooks is and the 8-level ladder
18 Leaflet/marketing: three or four short testimonials (leave clearly marked placeholders if none are supplied)
19 Leaflet/marketing: how it works, the free assessment, the current offer
20 Outer back cover: the level colour as a band across the TOP and the BOTTOM, marketing message in the middle, and a large ASSESSMENT QR

Pages 17 to 20 are adapted from `marketing/leaflet/leaflet.html` so the booklet and the standalone leaflet share artwork.

## The two QR codes (required)

Every booklet carries two distinct QR codes:
1. WEBSITE QR — the existing `marketing/leaflet/assets/qr_site.png`, pointing at the homepage. Place it on the leaflet pages (17 to 19).
2. ASSESSMENT QR — a NEW code pointing straight to the assessment, tagged per level:
   `https://myphonicsbooks.com/assessment?src=booklet_L{n}`
   Place it on page 13 (the level-check page) and large on page 20 (outer back cover).
Generate the assessment QRs with the Python `qrcode` library, one per level, saved to `marketing/booklet/qr/`. Add an optional channel tag in a comment for later use, for example `&via=library`.

## Which book per level

Read the available books per level from the pipeline catalogue. Choose the single most engaging book at each level; where two are close, prefer the more visually distinctive setting (the "children see themselves" point). Make the chosen book per level configurable in one place (a dict at the top of the assembly script) so it is easy to change.

## Constraints

- British English. No em dashes, no Oxford commas.
- A5, 148 by 210 mm, 3 mm bleed, text 5 mm inside trim, full colour. Cover stock note in the README: 250 to 300 gsm cover, 120 to 150 gsm inside.
- Do not break the decodable rule anywhere in the story or the level-check page.
- The first two-thirds of the booklet must look and read like a real book, with no marketing intrusion beyond the single quiet line on page 2.

## Definition of done

- Running the assembly produces `marketing/booklet/output/booklet_L1.pdf` to `booklet_L8.pdf`, each 20 pages, A5, print-ready with bleed.
- Both QR codes are present and resolve correctly: the website QR to the homepage, the assessment QR to the tagged `/assessment` URL (test by decoding the embedded images).
- Page 13 shows the correct level's check, drawn from the 8-level assessment data.
- A README in `marketing/booklet/` documents the per-level book choices, the print specs and the rebuild command.
- You output a summary of files created, the per-level book chosen, and anything left as a placeholder (such as testimonials).
```

---

## Suggested order and dependencies

1. **Prompt 1** first. It unblocks everything: the assessment, the result chart, the paper sheet and the booklet level-check page all read from the 8-level data.
2. **Prompt 2** next if you want the paper placement sheets for schools and events quickly.
3. **Prompt 3** last, since its page 13 reuses the assessment data and ideally the paper-sheet layout.

One open input you control: the per-level book choices in Prompt 3, and the testimonials for page 18. Collect three or four short parent quotes so that page ships full rather than placeholdered.
