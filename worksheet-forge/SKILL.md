---
name: worksheet-forge
description: MyPhonicsBooks' prompt→PDF worksheet machine. Turns a one-sentence request ("a board game for sh") into a print-ready, fully decodable A4 phonics worksheet in the house style. Use this skill to write good forge prompts, plan new activity blocks, or reason about what the machine can and cannot do.
---

# Worksheet Forge — the MyPhonicsBooks worksheet machine

## What it is

A generator that turns natural language into a finished A4 phonics worksheet.
The page is built like a modern website on an A4 canvas (HTML/CSS + inline
SVG), then printed to PDF by headless Chromium. Every child-facing word is
checked against the MyPhonicsBooks curriculum so the sheet is 100% decodable
at its level.

- Lives at `myphonicsbooks/worksheet-forge/` (Node, no build step).
- CLI: `node forge.mjs "<prompt>"` → `output/<slug>.pdf` + `.png` preview + `.html` debug.
- Web: the `/create-worksheet` page on the site calls the same pipeline via a
  dev-server-only API (`/api/worksheet-forge`); sheets appear with a preview,
  PDF download, re-roll button and a "recently forged" gallery.
- Flags: `--seed N` (same prompt, different words/layout), `--no-ai` (skip the
  Gemini title polish; the core planner is fully offline/deterministic),
  `--out DIR`, `--spec file.json` (bypass the planner with an exact spec).

## The pipeline (4 stages)

1. **Parse** — regex-only, no AI. Extracts level ("level 3" / "L5"), target
   sound (`'sh'` quoted, "the sound ay", or bare "for sh" — bare single
   letters only count at the end of the prompt so "for a level 2 child" never
   targets the sound 'a'), activity intent, count ("pack of 3"), and an
   optional theme word (pirate/space/seaside…). If the level is missing it is
   inferred from the sound (the first level that teaches it). If the sound is
   missing the planner picks a freshly-taught grapheme with enough words to
   fill a sheet.
2. **Plan** — the intent selects a *recipe* (an ordered line-up of activity
   blocks). Blocks are filled from the curriculum word banks through the
   decodability guard. If the target sound lacks clipart, picture-led blocks
   are swapped for text-led equivalents rather than drifting off-sound.
   L7–8 spelling switches to suffix mode (-tion/-sion with "shun" distractors).
2b. **Compose (AI, "build anything")** — with AI on, the composer reads the
   request *as written*, is shown the whole block catalogue, and may compose any
   line-up from it; the keyword recipe is only its starting suggestion. So
   "something puzzly for a child who hates writing" gets word_search +
   crack_the_code + real_alien_sort — a line-up no recipe contains. It picks
   **blocks only**: every word, sentence and level still comes from the
   deterministic builders. Ids that aren't real, level-legal and budget-fitting
   are dropped, and if nothing survives the keyword recipe stands. `--no-ai`
   skips it entirely.
3. **Polish (optional AI)** — Gemini writes a playful title/subtitle
   ("Hooray for H!"). Every AI-supplied word is re-validated; anything failing
   the guard is silently replaced. Pedagogy is locked before the AI runs.
4. **Render + auto-fit** — HTML in the level's ledger colours → Chromium →
   A4 PDF + PNG. The planner deliberately over-fills, then the renderer
   measures the real page in-browser and fits it **both ways**: overflow trims
   one item at a time (respecting each block's minimum); dead space >30mm at the
   foot appends a pre-built *spare* block instead of shipping a short sheet.
   Spares are stocked by the planner — anything the height budget squeezed out
   of the requested line-up first, then generic fillers. Pages come out full —
   never clipped, never half-empty.

## Activity intents (what a prompt can ask for)

| Keywords in prompt | Intent | Recipe (blocks used) |
|---|---|---|
| board game, race, track, bingo* | game | board_game + speed_read |
| word search | wordsearch | word_search + crack_the_code + speed_read |
| crack, decode, secret, code | code | crack_the_code + speed_read + dictation |
| cut and stick, sort | sorting | sound_sort + dictation |
| assess, check, test, screening, PSC | assess | real_alien_sort + speed_read + dictation |
| handwriting, trace, formation | handwriting | trace_letters + trace_words + missing_grapheme |
| segment, sound box, Elkonin | segmenting | phoneme_frames + missing_grapheme + dictation |
| sentence, comprehension, cloze | sentences | cloze_sentences + sentence_unjumble + yes_no_questions |
| draw | draw | trace_words + read_draw_write |
| alien, nonsense, real or | alien | real_alien_sort + sound_button_markup + roll_and_read |
| fluency, speed, roll | fluency | roll_and_read + speed_read + real_alien_sort |
| spell, best bet, choice | spelling | best_bet + cloze_sentences + dictation |
| *(no intent)* | level-appropriate default mix | varies by level (tracing at L1–2 → best-bet/sentences at L7–8) |

These are the *starting* suggestions, not the ceiling. With AI on, the composer
(stage 2b) can build any line-up the request calls for — describe the sheet you
want in full sentences and it will compose to it. The table is what you get with
`--no-ai`.

\* **Bingo is retired (2026-07-24).** The caller list and the child's card sat
on the same sheet, so the child could read every word before it was called —
the game self-spoils. Any bingo request now produces the board game. Rule of
thumb: **no hidden-information games on a single sheet** (board games,
roll-and-read and speed reads work because a die provides the randomness).

## The block library (22 plannable blocks)

| Block | Levels | What the child does |
|---|---|---|
| trace_letters | 1–4 | Letter formation: model + dotted traces + free-write row on 4-line guides |
| trace_words | 1–4 | Picture card, dotted word to trace, blank line to write |
| missing_grapheme | 1–6 | Picture cards; write the missing grapheme in a width-true gap |
| phoneme_frames | 1–4 | Elkonin sound boxes — one box per phoneme, worked example first |
| read_and_tick | 1–5 | Picture + three near-miss words; tick the right one |
| match_word_picture | 1–4 | Draw lines from words to scrambled pictures |
| real_alien_sort | 2–8 | PSC-style: read with sound buttons, tick real or alien |
| roll_and_read | 1–8 | Six die-face columns of words; roll, read, colour (repeat-play) |
| speed_read | 1–8 | Fluency grid + three-read star strip |
| cloze_sentences | 3–8 | Word-bank pills; write the missing word in the gap |
| sentence_unjumble | 3–8 | Muddled word pills; write the sentence correctly |
| read_draw_write | 1–6 | Read a sentence, illustrate it, copy it |
| yes_no_questions | 3–8 | Absurd decodable questions with a yes/no tick rail |
| dictation | 1–8 | Numbered writing rows + rotated grown-up script panel (upside-down so the child can't read it) |
| board_game | 1–8 | Serpentine reading race track with event cells; needs die + counters |
| sound_button_markup | 2–8 | Draw dots/bars under graphemes, count phonemes; first row is a model |
| best_bet | 5–8 | Circle the correct spelling among plausible alternatives; rewrite it |
| odd_one_out | 1–8 | Circle the word without the target sound |
| picture_write | 1–8 | Picture grid: write the word for each picture; colour the target-sound ones |
| word_search | 2–8 | Letter grid hiding target-sound words; ring them and tick the list |
| crack_the_code | 2–8 | Symbol cipher key; decode each word and write it |
| sound_sort | 2–8 | Cut-and-stick: sort word cards into has-the-sound / not columns |

(A 23rd block, bingo, exists in code but is retired and never planned.)

## Subjects (it isn't phonics-only any more)

Every spec carries a `subject`, and the sheet's *chrome* follows from it
(`design/subjects.mjs`) — brand, tagline, header pills, footer caption, colours.
A maths sheet must never wear phonics clothes.

| Subject | Brand + tagline | Levels? | Colours |
|---|---|---|---|
| `phonics` (default) | MyPhonicsBooks · decodable phonics practice | Level 1–8 | ledger level colours |
| `maths` | MyMathsBooks · practice that adds up *(name is a placeholder)* | no — `stage` e.g. "Year 3" | teal |
| `literacy` | MyPhonicsBooks · reading and writing practice | no | purple |
| `general` | MyPhonicsBooks · classroom practice | no | blue |

The ledger level colours are pedagogy, not decoration, so `themeForSpec` only
uses them for levelled subjects; anything else carries its own palette. Header
tile shows the grapheme on phonics, else `spec.badge` (e.g. "×7"), else nothing.

**Generic layouts** (`generic: true` in the catalogue) are subject-neutral: they
render a layout from content handed to them rather than generating phonics words.

| Block | Takes | Serves |
|---|---|---|
| prompt_grid | `items[{prompt, picture?}]` | grid of cards: picture/prompt + answer line or box |
| question_rows | `items[{prompt}]`, `answer:'box'?` | numbered questions with a ruled line or box |
| match_columns | `left[]`, `right[]` | draw a line to the pair (words, sums, capitals…) |
| fill_table | `rows[][]` (`null` = blank), `headers?` | times tables, number squares, verb tables |

The phonics planner, composer and vision pass all skip generic blocks — they
have no builder, so they'd plan empty panels. Today they're driven by an explicit
spec (`--spec file.json`); a subject content engine is the next piece. See
`output/demo-maths.json` for a worked example.

## Recreate from an upload

Upload any worksheet image (web: the upload button on /create-worksheet; CLI:
`node forge.mjs --from image.png`). Gemini vision maps its activities onto the
block catalogue and guesses level + sound; the forge rebuilds those activity
TYPES with our own decodable content — nothing is copied.

**A remake matches the source's shape.** One activity in → one activity out.
Vision reports only the activities actually on the page (never pads to fill a
sheet), and the remake composes in strict mode: no fillers, no spares. Leftover
space is filled by growing the activity that IS there — more cards, whole rows
only (`perRow`/`maxItems`) — never by adding a task the teacher didn't ask for. If the source is
picture-led and we lack art for the sound, the forge DRAWS the missing clipart
itself (Vertex, house flat style, solid-black-oval eyes, cached forever in
`worksheet-forge/artcache/`), so the art library grows with every remake.
Word choice is phoneme-TRUE: "chair" never counts as an 'ai' word (it reads
ch-air) — words must segment with the target grapheme as a unit.

## Guarantees (why sheets are safe to hand a child)

- **Decodability guard** — every child-facing word must segment using only the
  level's cumulative taught graphemes, or be a taught tricky word. This is
  stricter than letter-matching: "soap" is *rejected* at L1 even though
  s-o-a-p are all taught letters, because 'oa' is a hidden digraph taught
  later; same for hidden split digraphs ("cake" at L1).
- **Phoneme-true sound boxes** — one box per phoneme (pass = p-a-ss = 3 boxes),
  never per letter; split-digraph words are excluded from box/button tasks.
- **Curated data only** — real words come from level word banks; gap-fill
  frames use a curated concrete-noun list with animate/object matching; alien
  words are phonotactically generated with a rude-lookalike blocklist;
  best-bet distractors never collide with real homophones (pain→pane blocked).
- **House design system** — level ledger colours only (L1 pink, L2 coral,
  L3 amber, L4 green, L5 blue, L6 indigo, L7 purple, L8 teal); Andika teaching
  font throughout; 4-line handwriting guides ported 1:1 from the worksheet
  engine's metrics (solid ascender · dashed midline · solid baseline · dashed
  descender).
- **Art-strict picture tasks** — picture blocks only render words with house
  clipart; no art → text-led block swapped in instead.
- **Aliens are always badged and always on-sound** — a nonsense word anywhere on
  a sheet (including board-game cells) wears the alien face and is explained in
  the key, so a child never takes it for their own misreading; and it carries
  the target grapheme like every other word on the page.
- **Write-lines vs trace-lines** — 4-line handwriting guides appear only in
  handwriting-practice blocks. Dictation, sentence copying and every other
  ordinary writing task gets a plain ruled line.
- **Every sheet carries** the sound tile header, name/date bar, numbered
  activity panels with child-facing instructions, and the MyPhonicsBooks
  footer with level + sound.

## House rules to respect when extending it

- Worksheets are **skills, not story** — standalone phonics drills; never
  sequence a book's story or re-test book vocabulary.
- No hidden-information games on a single sheet (the bingo ruling). Cut-out
  games (pairs/memory) are fine because cutting creates the hiding.
- 4-line trace guides are for handwriting only; sentence/word writing uses
  plain write-lines.
- Grown-up-only content (dictation scripts, answer keys) goes in a rotated
  panel the child can't casually read.
- Always the level's ledger colour — never default everything to pink.

## Example prompts

- `a handwriting worksheet for the sound s`
- `a board game for sh`
- `roll and read for level 4`
- `level 4 spelling choices for 'ay'`
- `segmenting practice for level 1`
- `real or alien check for level 4 sound 'ee'`
- `sentence writing for level 6`
- `spelling worksheet for level 8` (suffix mode: -sion)
- `3 worksheets for the sound 'ay'` (varied mini-pack)

Free-form (the composer builds the line-up):

- `something puzzly for a level 6 child who hates writing`
- `a level 3 sheet where they cut and stick words into groups, then write a
  sentence about each group`
- `level 4 practice that starts easy and ends with them writing a whole
  sentence about a picture`
