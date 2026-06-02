# Set 1 Clipart — MyPhonicsBooks

Isolated single-object clipart for the 25 Set 1 single-letter sounds.
Aligned to **Level 1 — Starting Stories** of the MyPhonicsBooks
curriculum (RWI Set 1 single sounds; band colour `#E84B8A`).

## What is in this pack

- `{m,a,s,d,t,i,n,p,g,o,c,k,u,b,f,e,l,h,r,j,v,y,w,z,x}_<word>.png`
  — 25 transparent PNGs, 1024×1024
- `manifest.json` — sound, word, filename, prompt, generated_at, size
- `set1_clipart_contact_sheet.png` — labelled grid of all 25
- `README.md` — this file

`p` uses **plant** rather than *pen* (project preference for objects
that already live in the MyPhonicsBooks world: plant / gate / broom).

## Style rules

Generated to match the MyPhonicsBooks interior illustration style:

- smooth dark vector-like outlines
- soft flat colours with gentle shading
- subtle paper grain texture *inside* each object
- simple, instantly recognisable silhouettes for ages 4–7
- single isolated object, centred, transparent background
- no scenes, no characters, no letters or words in the image
- no watercolour wash, pencil sketch, classroom clipart, Jolly Phonics
  style, Read Write Inc style, photorealism, 3D, anime

The L2.6 bird object reference at
`myphonics_books/output/images/L2_6_B1/object_ref_bird.png` is sent to
Gemini as the visual style anchor on every call, so all 25 images
share the same line weight, texture and palette feel.

## How to regenerate

From the repo root with Python 3.12:

```bash
# Style check on a single image
py -3.12 scripts/generate_set1_clipart.py --test

# Regenerate one or more sounds
py -3.12 scripts/generate_set1_clipart.py --only m,a,s

# Regenerate everything
py -3.12 scripts/generate_set1_clipart.py --all

# Regenerate only files that are missing (safe re-run after a partial run)
py -3.12 scripts/generate_set1_clipart.py --regen-only
```

Requires `GOOGLE_GEMINI_API_KEY` set in `myphonics_books/.env`
(already present) or in the repo-root `.env`.

## How ChatGPT can use this

Drop these PNGs onto a chart canvas. They are transparent at the
edges, square 1024×1024, and visually consistent so they tile cleanly.
The `manifest.json` gives the canonical sound→word→filename mapping
for programmatic chart construction.
