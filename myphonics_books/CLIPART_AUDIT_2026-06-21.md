# Clipart Audit — 2026-06-21

Audit of all clipart/illustration assets across the books and related products,
against the standing rules:
- **Eye rule** — every character/animal eye = solid black filled oval (no white
  sclera, catchlight, glint, coloured iris).
- **No water taps / wrong-meaning** — homographs must show the taught meaning.
- **No miscounts** — count words must show the right number.
- **Flat brand clip-art** — no photographic, no baked-in text, no busy scenes.

## Asset inventory (where clipart lives)

| Set | Location | Count | Type |
|---|---|---|---|
| Sound Spotlight clip-art | `assets/photos/<grapheme>/<word>.jpg` | ~377 across 80 graphemes | AI flat clip-art (Vertex) + legacy stock |
| Story scene illustrations | `output/images/L{n}_{sub}_B1/` | ~446 across 33 books | AI scenes (hero-injected) |
| Worksheet clipart library | `worksheet-engine/public/clipart/` | ~162 | flat SVG/PNG |
| Public marketing tiles | `public/clipart/` | ~94 | tiles + posters |
| Rasterised book pages | `phonics-fun-hub/public/book-pages/` | ~564 | rendered PDF pages |
| Legacy set | `assets/phonics/set1_clipart/` | 28 | pre-standardisation |

Generation/fix recipe: `py -3.12 scripts/regen_spotlight_vertex.py <grapheme>:<word>`
(Vertex AI, gemini-2.5-flash-image; eye rule baked into the prompt). Needs an
authenticated gcloud.

## Fixed in this pass (regenerated, verified)

- `t/tap` — was a **plumbing faucet**; now a hand finger-tapping a surface
  (and `spotlight_words.json` search term corrected so it never regenerates as a
  faucet). *(done earlier this session)*
- `ore/core` — was **human abdominal "core" muscles**; now an apple core.
- `t/tub`, `v/vest`, `w/wig`, `wr/wrist`, `o_e/home`, `oo/moon`, `e/red` —
  restyled to clean single-object flat clip-art on white.

All old versions backed up to `assets/photos/_regen_backups/`.

## Needs a CURRICULUM decision (not auto-fixed — by design)

~60 Sound Spotlight words are **abstract/verbs/adjectives that cannot be drawn
as a single clear object**, so regeneration alone won't fix them — the word
itself should be swapped in `data/spotlight_words.json` for an image-able
alternative at that grapheme. Left for Lynden's call (pedagogy decision).
Representative examples:
- Actions: `ck/kick`, `are/share`, `aw/draw`, `ch/chat`, `r/run`, `n/nod`,
  `kn/knee`, `h/hop`
- Feelings/states: `s/sad`, `ear/fear`, `ear/hear`, `y/yell`, `ou/loud`,
  `ou/out`, `ow/show`, `oy/joy`
- Complex: `able/comfortable`, `ible/terrible`, `tious/cautious`,
  `cious/delicious`, `tion/action`, `tion/nation`, `ure/sure`, `ur/hurt`

Baked-in text to clear when those are reworked: `oo/zoo`, `ou/out`,
`ou/round`, `ew/few`.

Acceptable as-is (people are fine for these nouns): `ir/girl`, `ir/sir`,
`ss/boss`, `ss/miss`, `oy/boy`, `ng/king`.
False positives (correct): `s/six`, `t/ten`, `x/six` render numerals — intended.

## Needs the SCENE pipeline (heavier — flagged, not auto-fixed)

Two story-scene character consistency issues (regen via hero-injection, then
re-render the book):
- `L1_2 The Mud on the Dog` p6 — different child (hair/outfit/eyes drift).
- `L6_4` p3 & p8 — Mia's hair drifts (ponytail vs loose).

Plus ~15 Spotlight "place" words that rendered as busy landscapes rather than a
single object (`ea/beach`, `ore/shore`, `oor/moor`, `ay/day`, `oo/zoo`,
`oa/road`, `th/path`, `oor/floor`, …) — regen-able but need bespoke single-object
subject prompts added to `regen_spotlight_vertex.py`'s `SUBJECTS` map first.
