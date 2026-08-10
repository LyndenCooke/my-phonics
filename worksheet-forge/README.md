# worksheet-forge — prompt → award-quality phonics worksheet → PDF

Type a sentence, get a print-ready A4 phonics worksheet in the MPB house style.
The page is built like a website on an A4 canvas (HTML/CSS + inline SVG), then
printed to PDF by Puppeteer (reused from `worksheet-engine/` — no extra install).

```bash
cd worksheet-forge
node forge.mjs "a handwriting worksheet for the sound sh"
node forge.mjs "board game for level 2"
node forge.mjs "real or alien check for level 4 sound 'ee'"
node forge.mjs "spelling best bet for level 5 sound 'ai'"
node forge.mjs "spelling worksheet for level 8"          # suffix mode (-sion…)
node forge.mjs "3 worksheets for the sound 'ay'"         # a varied mini-pack
node forge.mjs --spec my-sheet.json                       # exact control
```

Output: `output/<slug>.pdf` (+ `.png` preview, `.html` debug). Flags:
`--seed N` (different content, same prompt), `--no-ai` (skip the Gemini polish
layer — the default planner is fully offline), `--out DIR`.

## What the prompt can say
- **Level**: "level 3" / "L5" — or omitted (inferred from the sound).
- **Sound**: `'sh'`, "sound ay", `'a-e'`, suffixes `'tion'`/`'sion'` at L7-8.
- **Activity intent**: handwriting · segmenting (sound boxes) · board game ·
  bingo · assessment/check (real-vs-alien) · sentences/comprehension · draw ·
  fluency/roll-and-read · spelling/best-bet. Omit for a level-appropriate mix.
- **Count**: "pack of 3" / "4 worksheets".
- **Theme word** (pirate/space/seaside…) → header subtitle flavour.

## The block library (21 plannable activities)
trace_letters · trace_words · missing_grapheme · phoneme_frames (Elkonin) ·
read_and_tick · match_word_picture · real_alien_sort (PSC style, sound buttons)
· roll_and_read (die columns) · speed_read (3-star strip) · cloze_sentences ·
sentence_unjumble · read_draw_write · yes_no_questions · dictation (rotated
grown-up script) · board_game (serpentine track) · sound_button_markup
· best_bet (circle the real spelling) · odd_one_out · word_search (rude-safe
letter grid) · crack_the_code (symbol cipher) · sound_sort (cut-and-stick).
(bingo is RETIRED — caller list + card on one sheet self-spoils the game.)
Catalogue with per-block metadata: `blocks/blocks.mjs` (`CATALOG`).

## Guarantees (what makes it safe to hand a child)
- **Decodability guard**: every child-facing word must segment from the level's
  cumulative graphemes (`myphonics_books/data/graphemes_by_level.json`) or be a
  taught tricky word — with **hidden-digraph detection** ("soap" is *rejected*
  at L1 even though s-o-a-p are all taught letters, because 'oa' is a later
  sound) and hidden split-digraph detection ("cake" at L1).
- **Phoneme-true sound boxes**: one box per phoneme (pass = p-a-ss = 3), never
  per letter; split-digraph words are excluded from box/button tasks.
- **Curated data only**: real words come from the level word banks; sentence
  gap-fills use a curated concrete-noun list with animate/object frame
  matching; alien words are generated with phonotactic rules + a rude-lookalike
  blocklist; best-bet distractors never collide with real English homophones
  (pain→pane is blocked).
- **Ledger colours only** via `getLevelTheme` (throws on unknown level), Andika
  throughout, ligatures killed, TraceLine 4-line handwriting geometry ported
  1:1 from the engine's `handwriting.ts` metrics.
- **Art-strict picture tasks**: a picture-cue block renders only words that
  have house clipart (engine `soundart/` + `clipart/`); if a sound lacks art
  the planner swaps in text-led equivalents instead of drifting off-sound.
- **Auto-fit pages**: the planner slightly over-fills, then the renderer
  measures real overflow in-browser and trims items until the page fits — so
  pages come out full, never clipped and never half-empty.

## AI layer (optional)
`planner/llm.mjs` asks Gemini (direct key → Vertex AI fallback, same ladder as
the book scripts) for a playful title/subtitle + themed decodable sentences;
**every AI word is re-validated** and silently replaced if it fails the guard.
Currently the direct key is billing-dead and gcloud needs `gcloud auth login`,
so the forge runs in deterministic mode — run the login to light the layer up.

## Files
`forge.mjs` CLI · `planner/planner.mjs` prompt→spec + content builders ·
`planner/llm.mjs` Gemini/Vertex · `blocks/blocks.mjs` block renderers +
catalogue · `content/content.mjs` curriculum data, segmentation, pickers,
clipart index · `design/` tokens (ledger colours), css (page chrome),
handwriting (TraceLine port) · `render.mjs` HTML assembly, Puppeteer, auto-fit.

Showcase run (2026-07-24): 13 sheets across L1-L8 in `output/`, mirrored to
`Desktop/MPB_Worksheet_Forge_Showcase/` and Drive `08_Worksheet_Forge/`.
