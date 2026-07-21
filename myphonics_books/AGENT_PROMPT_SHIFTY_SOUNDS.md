# Build Brief: Shifty Sounds — paste-ready for Claude Code

You are working in the **MyPhonicsBooks** repo (`myphonics_books/`). This brief is self-contained. Read it fully, confirm the two open decisions with Lynden, then build in the order given. Do not start the front-matter or games work until Phase 0 (the migration fixes) is done, because the decodable rule depends on it.

## Project context you need

- MyPhonicsBooks generates decodable A5 phonics books for children aged 4 to 8, British curriculum, based on Letters and Sounds.
- **Non-negotiable rule:** every word in a book is either decodable at that level or a listed tricky word. Enforced by `core/validate_word_bank.py`.
- 8-level ladder (locked, do not reorder): L1 Ditties, L2 First Sounds, L3 Special Friends, L4 Longer Sounds, L5 New Spellings, L6 Building Fluency, L7 Reading Together, L8 Reading Champion.
- Level names, colours and font sizes live in `scripts/generate_book.py` (`STORY_FONT_SIZES`) and `data/graphemes_by_level.json`.
- British English throughout. Font is Andika. We are not Read Write Inc: use our own terms.

## What Shifty Sounds is

A single strand covering the ~56 grapheme-phoneme correspondences the main ladder does not teach directly: alternative spellings (ph, tch, dge, eigh) and alternative pronunciations (y as /igh/ and /ee/, ea as /e/, ough as six sounds). Goal: by the end of L8, across books and online games, every English sound and its common spellings are covered.

Design constraints, all mandatory:

1. **No new books.** Shifty Sounds live inside existing books.
2. **Protect the progression.** Each sound has an `allowed_from_level`. It never appears in a book below that level. L1 to L3 stay clean. First Shifty Sound appears at L4.
3. **Only some books.** A book shows a Shifty Sound only if its story naturally contains that sound at or above the allowed level. Max 1 to 2 per book.
4. **Pre-teach, never a cold decode.** The sound is met through its game or an adult before the child reads the book.
5. **Games first, worksheets second** for the online part.

## Data source (already created)

`data/shifty_sounds.json`. Three arrays, one source of truth for the in-book section, the games and the decodability check:

- `sound_cards`: sound-first (Little Wandle "Grow the Code"). Each has `sound`, `sound_type`, `spellings[]` with `grapheme`, `example`, `allowed_from_level`, `main` (bool). Use for spelling activities and the coverage guarantee.
- `alt_pronunciation_cards`: grapheme-first (reading). Each has `grapheme`, `letter_type`, `pronunciations[]` with `sound`, `examples[]`, `allowed_from_level`, `note`. Use for the "one grapheme, many sounds" cards (ough, y).
- `new_spelling_cards`: flat index of extra spellings with `grapheme`, `sound`, `examples[]`, `allowed_from_level`, `note`.

A human-readable version is `output/worksheet_plan/Shifty_Sounds_Card_Deck.xlsx`. Full rationale is `output/worksheet_plan/EXTRA_SOUNDS_STRAND_PROPOSAL.md`.

## Decisions — all locked, no open questions

- **Name:** Shifty Sounds.
- **Band colour:** `#475569` charcoal/slate grey. Deliberately outside the 8-level rainbow so it never reads as a ninth level. Stored as `_band_colour` in `data/shifty_sounds.json`.
- **The 8 promotions — confirmed, promote all 8, no additions.** Move these OUT of the Shifty band and INTO the main ladder (`data/graphemes_by_level.json`) at their natural level as part of Phase 3/Phase 1 work: `wh`, `ph`, `ve`, `-ed` (3 sounds: /d/ /t/ /id/), `y`=/ee/, `y`=/igh/, soft `c`, soft `g`. See `_decisions.promoted_graphemes` in the data file for the exact list.
- **Borderline extras stay in the Shifty band** (not promoted): `tch`, `dge`, short `oo`, `s`=/z/, `ea`=/e/, `au`. See `_decisions.stays_in_band`.

## Phase 0 — fix the migration bugs first (blocking)

The repo was migrated from 6 to 8 levels but two things were left behind. Fix these before anything else or the decodable rule is not enforced on L7 and L8.

1. **Word banks are still 6-level.** `data/word_banks/` has only `level_1_words.json` to `level_6_words.json`, using old names (level_5 = "Split Sounds"). But `data/graphemes_by_level.json` and `data/tricky_words_by_level.json` are 8-level. Regenerate word banks as `level_1` to `level_8` from the new cumulative graphemes. Keep the greedy longest-match grapheme decomposition already described in the existing word bank files.
2. **Validator hard-caps at level 6.** `core/utils/word_bank.py` raises `ValueError` for level > 6, and `load_tricky_words` / `find_level_for_word` loop `range(1, 7)`. Raise every cap to 8 once the L7 and L8 word banks exist.

Acceptance: `validate_story_text(text, level=7)` and `level=8` run without error and correctly pass and fail sample words.

## Phase 1 — grapheme-phoneme decodability (the "happy" fix)

The current engine matches letters to graphemes but ignores the sound. Because `y` is a valid grapheme from L2, the engine can wrongly pass "happy" as decodable before `y`=/ee/ is taught.

- Upgrade the decodability model from bare graphemes to grapheme+phoneme pairs, each with the level it is taught at (`y`=/y/ from L2, `y`=/ee/ and `y`=/igh/ only from L5 to L6).
- Source the pairs and levels from `data/shifty_sounds.json` plus `data/graphemes_by_level.json`.
- A word counts as decodable at level N only if a valid grapheme+phoneme parse exists using pairs allowed at or below N, OR the relevant Shifty Sound is displayed in that book (see Phase 3).

## Phase 2 — tricky-to-decodable graduation

Trickiness is level-bound, not permanent.

- Add a `graduates_at` level to each entry in `data/tricky_words_by_level.json`: the level where the sound that makes it decodable is taught (for example "happy"-type words graduate at L5 to L6 with `y`; "my", "by" graduate with `y`=/igh/). Words needing a sound never taught (for example "one", "said") have `graduates_at: null` and stay tricky.
- Validator order: decodable check first (Phase 1), then the tricky list for that level, else fail. Below `graduates_at` a word is allowed as a listed tricky word. At or above, it is decodable and removed from the tricky requirement.

## Phase 3 — in-book Shifty Sounds section

- New front-matter component in the `book_v2` templates, a small section below the existing two-table sound grid on the reference page, headed "Shifty Sounds", shown only when the book contains one or more.
- Visual: the agreed band colour, a divider line separating it from the main sound grid, so it never reads as a ninth level.
- `scripts/generate_book.py`: detect Shifty Sounds present in a book's story words, gated by `allowed_from_level` against the book's level. Populate the section from `data/shifty_sounds.json`. Max 1 to 2 per book.
- Decodability audit accepts a Shifty Sound as permitted only in a book whose section displays it.

## Phase 4 — online games and worksheets

- One short game or activity per Shifty Sound for the online part (`myphonics_apps/`), introducing the shifting sound in a playful, pre-teach way. Cumulative sequence following the teaching order (tab 4 of the deck / `allowed_from_level`).
- Website worksheet pages, one per sound, indexed by sound not level, as secondary support.

## Reference files

- `data/shifty_sounds.json` — the data
- `output/worksheet_plan/Shifty_Sounds_Card_Deck.xlsx` — readable card deck, teaching order, coverage check
- `output/worksheet_plan/EXTRA_SOUNDS_STRAND_PROPOSAL.md` — the full proposal and guardrails
- `MyPhonicsBooks_Sound_System_Audit.xlsx` (repo root) — the original coverage audit
- `data/graphemes_by_level.json`, `data/tricky_words_by_level.json` — the 8-level ladder
- `core/validate_word_bank.py`, `core/utils/word_bank.py` — the decodable engine
