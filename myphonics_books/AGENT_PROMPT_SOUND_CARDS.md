# Build Brief: Sound Cards render pipeline — paste-ready for Claude Code

You are working in the **MyPhonicsBooks** repo (`myphonics_books/`). Build a render pipeline that turns the existing card dataset into print-ready PDF sound cards. This brief is self-contained. Read it fully, then build.

## Goal

Render 143 sound cards plus a 7-card "ough" insert set into two print tiers of PDF, using the project's real Andika font and the mpb logo. Reuse the existing Jinja2 plus Playwright approach, do not invent a new stack.

## Inputs (already exist, do not regenerate)

- **Card data:** `output/worksheet_plan/sound_cards.json`. Shape: `{ "cards": [ ... ], "ough_insert_set": [ ... ] }`. Each card object:
  ```json
  {
    "card_id": "L4-ow-blow",
    "type": "main",              // "main" | "twin" | "extra_spelling"
    "grapheme": "ow",
    "says_plain": "oa, as in blow",
    "says_ipa": "/oʊ/",
    "key_word": "blow",
    "level": "L4",
    "level_colour": "#22C55E",
    "type_tint": "#FAF7F1",
    "twin_group": "ow",
    "twin_number": 1,
    "twin_total": 2,
    "words": ["ow","bow","low","..."],
    "image_prompt": "child-friendly flat illustration of 'blow', small solid black dot eyes only, ..."
  }
  ```
  Twin cards share `twin_group` with their main card. Extra spelling cards have `twin_group: null`. The `ough_insert_set` has one `wildcard_title` object and six `wildcard` word objects.
- **Corrected reference (human view, not needed for render):** `output/worksheet_plan/MyPhonicsBooks_Sound_Scheme_CORRECTED.xlsx`.

## Assets you must use (do not substitute)

- **Font: Andika.** File at `assets/fonts/Andika-Regular.ttf` (and `Andika-Bold.ttf` if present). Embed it as base64 in an `@font-face` rule, exactly as `scripts/generate_book.py` / the book templates already do for book PDFs. Do NOT load Andika from Google Fonts; Playwright must render the embedded local file so it matches the books. The grapheme on every card must be Andika, because single-storey a and g is the whole point.
- **Logo: mpb mark.** Use `public/logo/mpb-mark-transparent.png` (1024×1024 RGBA) or `public/logo/mpb-initials.svg`. Place it as a small, quiet maker's mark, bottom corner, low opacity (12 to 16%), single muted tone. No "MyPhonicsBooks" text anywhere on the card.

## Card design (the look Lynden wants)

- **The grapheme is the hero.** Grapheme only, centred, Andika, filling a good majority of the card face (target cap height around 55 to 65% of card height). Nothing else competes with it on the front.
- **No wording across the card.** No "MyPhonicsBooks", no strapline.
- **Card type shown by a calm background tint, not bright colour:**
  - main: ivory `#FAF7F1`
  - twin: pale mint `#E8F3EC`
  - extra spelling: pale oat `#F2EBDD`
- **Level shown by a small corner strip only,** top right, about 8 to 10mm, in the card's `level_colour`. Level palette: L1 `#E84B8A`, L2 `#F97066`, L3 `#F59E0B`, L4 `#22C55E`, L5 `#3B82F6`, L6 `#6366F1`, L7 `#8B5CF6`, L8 `#14B8A6`.
- **Twin badge:** twin cards show a small circular badge, top left, with the `twin_number` (2, 3, 4). Main cards show no badge.
- **Size:** A7, 74mm × 105mm, portrait.

## Two print tiers (two templates, one dataset)

**Tier 1 — premium, double-sided, for guillotine cutting.**
- Front: grapheme only, as above.
- Back: `key_word` in Andika, one illustration matching the key word (see Images below), the sound in plain English from `says_plain` written as "says oa" (strip everything after the comma), and the twin badge "Twin 2 of 2" where `twin_total > 1`.
- Add 3mm bleed on all edges and crop marks, since these are guillotined. 300gsm silk, matt lamination is the physical spec, so design to full bleed.
- Output: one PDF of all fronts and backs, imposed for double-sided printing (front sheet then matching back sheet, back sheet mirrored on the long edge so faces align after duplex).

**Tier 2 — free printable, single-sided, cut-it-yourself.**
- One A4 sheet per set, 8 cards to a sheet in a 2×4 grid.
- Grapheme only on the single face (no back). Same tint and corner strip.
- Dashed cut lines on every card edge, solid black, dark enough to show on a mono printer.
- Keep grapheme, strip outline and cut lines working in greyscale: the tint may vanish on a black-and-white printer, so the grapheme and cut lines must stay solid black regardless of tint.
- No bleed. Output: A4 sheet PDFs.

**The "ough" insert set** is a separate physical pack, issued once at L8. Render it as its own small PDF: one "wildcard grapheme" title card explaining that ough behaves differently in almost every word, then six companion cards (though, through, tough, cough, plough, enough), each with the word in Andika. Do not fold these into the main deck.

## Images (Tier 1 backs)

- Each card carries an `image_prompt`. Reuse the existing Gemini image pipeline (`scripts/generate_gemini_images.py` and the hero-injection approach in `.claude/skills/art-generator`) to generate one small illustration per card. Character eye style is non-negotiable: small solid black dot eyes only, never big or wide eyes, matching the books.
- Build this as an optional second phase behind a flag (for example `--with-images`). First deliver the typographic cards (fronts and Tier 2) with a neutral placeholder box on Tier 1 backs, so the layout is signed off before spending image credits.

## Pipeline and output

- Add `scripts/generate_cards.py`, mirroring `scripts/generate_book.py`: load `sound_cards.json`, render a Jinja2 template (`book_templates/card.html.j2` or a new `card_templates/`), then Playwright (headless Chromium) to PDF, same as the book PDF flow.
- CLI: `py -3.12 scripts/generate_cards.py --tier 1|2 [--level L1..L8|all] [--with-images]`.
- Output to `output/cards/`:
  - `output/cards/tier1/` individual or imposed premium PDFs
  - `output/cards/tier2/` A4 cut sheets
  - `output/cards/ough_insert/` the wildcard pack
- British English throughout.

## Acceptance criteria

1. Grapheme renders in embedded Andika (single-storey a and g visible), filling the majority of the card, no Google Fonts fallback.
2. mpb logo appears as a faint corner mark, no wordmark text anywhere.
3. Tint matches card type, corner strip matches level, twin badge present only on twins.
4. Tier 1 is double-sided with bleed and crop marks and imposes correctly for duplex. Tier 2 is single-sided A4, 8 per sheet, dashed cut lines that survive greyscale.
5. ough insert set renders as its own 7-card pack.
6. Rollout order for print runs: L1 to L4 first (47 cards), then L5 to L6, then L7 to L8 plus the ough pack.

## Reference files

- `output/worksheet_plan/sound_cards.json` — the card data
- `scripts/generate_book.py` — the pattern to copy (Jinja2 plus Playwright to PDF, Andika base64 embed)
- `.claude/skills/book-template-designer/SKILL.md` — existing Andika `@font-face` setup and layout conventions
- `assets/fonts/Andika-Regular.ttf` — the font
- `public/logo/mpb-mark-transparent.png`, `public/logo/mpb-initials.svg` — the logo
- `docs/brand-guidelines.md` — brand colours and rules
