# MyPhonicsBooks — Phonics Clipart Asset Library

Reusable clipart for every grapheme in the MyPhonicsBooks programme, organised by **our six product levels** (not Jolly Phonics, not RWI Set 1/2/3, not Letters and Sounds groupings).

```
assets/phonics/clipart/
├── level_1/        Starting Stories       (36 graphemes — all Set 1)
├── level_2/        Longer Sounds          (11 — long vowels)
├── level_3/        New Spellings          (10 — split digraphs + alternatives)
├── level_4/        Building Fluency       ( 6 — later alternatives)
├── level_5/        Reading Together       ( 9 — final Set 3 + silent letters)
├── level_6/        Reading Champion       ( 5 — suffix patterns)
├── level_N_poster.{pdf,png}      Per-level printable poster (A3 landscape)
├── all_levels_poster.{pdf,png}   Master sheet across all six levels
└── manifest.json                  Programmatic index — level, sound, cue, prompt, filename
```

Total: 77 graphemes, one isolated PNG each.

## Cue-word principle

Cue words are drawn **first from words actually used in our published stories**. If story X uses `tank` to teach `nk`, then `nk → tank` is the clipart cue. This keeps the clipart aligned with what children have actually read.

Where a sound appears in cumulative graphemes but no published story has a cleanly illustrable noun for it (often the L5/L6 silent-letter and suffix sounds), the cue falls back to a canonical example word from `myphonics_books/data/spotlight_words.json`.

The full mapping with story sources is in [`myphonics_books/data/clipart_cues.json`](../../../myphonics_books/data/clipart_cues.json).

## Style rules (every image)

- Hand-drawn cartoon style, clean black outlines, soft watercolour-textured fills
- Warm modern children's picture book aesthetic — matches book interiors
- Single isolated subject, centred, generous padding
- Soft cream background (`#FFF9F5`) — not transparent (transparency from gpt-image-2 is unreliable; cream tiles also stack better on print posters)
- Tiny solid black dot eyes on any creature/character — no white sclera, no iris detail
- 1024×1024 PNG
- **No** flat vector clipart, classroom-poster look, photo-realism, pencil sketch, Jolly Phonics, or RWI styling

A reference interior page (`public/illustrations/1_1/page2.png`) is injected on every generation so output matches our existing book art.

## Regenerating

Setup once:
```bash
# .env in myphonics_books/ must contain:
OPENAI_API_KEY=sk-...                # default backend (gpt-image-2)
GOOGLE_GEMINI_API_KEY=...             # optional alternative backend
```

Generate clipart:
```bash
# All levels (skips images that already exist)
py -3.12 myphonics_books/scripts/generate_clipart.py

# One level / one sound / regenerate
py -3.12 myphonics_books/scripts/generate_clipart.py --level L1
py -3.12 myphonics_books/scripts/generate_clipart.py --sound nk --force

# Switch backends
py -3.12 myphonics_books/scripts/generate_clipart.py --backend gemini
```

Build printable posters:
```bash
# All levels + master sheet (writes PDF + PNG previews)
py -3.12 myphonics_books/scripts/build_clipart_posters.py

# One level
py -3.12 myphonics_books/scripts/build_clipart_posters.py --level L1
```

## Files

| Path | Purpose |
|---|---|
| `myphonics_books/data/clipart_cues.json` | Source of truth — grapheme → cue → subject prompt → story source |
| `myphonics_books/scripts/generate_clipart.py` | Image generation (OpenAI gpt-image-2 default; Gemini fallback) |
| `myphonics_books/scripts/build_clipart_posters.py` | A3 landscape printable poster builder (HTML + Playwright) |
| `myphonics_books/templates/clipart_poster.html` | Jinja2 template for the printable poster |
| `assets/phonics/clipart/manifest.json` | Auto-generated index of every clipart entry |
