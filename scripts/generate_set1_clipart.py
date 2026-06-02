"""
Generate Set 1 phonics clipart pack for MyPhonicsBooks.

Aligned to Level 1 ("Starting Stories", #E84B8A) of the MyPhonicsBooks
curriculum. Produces 25 isolated, vector-style clipart PNGs matching the
project's interior illustration style (clean dark outlines, soft flat
colours, subtle paper grain texture).

Pipeline:
  1. Load the existing L2.6 bird object reference as STYLE ANCHOR.
  2. For each Set 1 sound, send (style image + per-object prompt) to
     gemini-2.5-flash-image.
  3. Post-process: square-crop, resize to 1024x1024, alpha-out the
     near-white background so the PNG is usable as transparent clipart
     when composed onto a chart.
  4. Write manifest.json (sound, word, filename, prompt, generated_at).

Usage (run from repo root with python 3.12):
    py -3.12 scripts/generate_set1_clipart.py --test          # 1 image (m_mouse) for style check
    py -3.12 scripts/generate_set1_clipart.py --only m,a,s    # subset by sound key
    py -3.12 scripts/generate_set1_clipart.py --all           # full pack (25 PNGs)
    py -3.12 scripts/generate_set1_clipart.py --regen-only    # only regenerate missing files

Env:
    GOOGLE_GEMINI_API_KEY must be set. Loaded from myphonics_books/.env
    by default (no need to copy keys around).
"""

from __future__ import annotations

import argparse
import asyncio
import base64
import json
import os
import sys
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from typing import Optional

import aiohttp
from dotenv import load_dotenv
from PIL import Image

# ─── Paths ───────────────────────────────────────────────────────────
REPO_ROOT = Path(__file__).resolve().parent.parent
SUBPROJECT_ENV = REPO_ROOT / "myphonics_books" / ".env"
ROOT_ENV = REPO_ROOT / ".env"
STYLE_REF_PATH = (
    REPO_ROOT
    / "myphonics_books"
    / "output"
    / "images"
    / "L2_6_B1"
    / "object_ref_bird.png"
)
OUT_DIR = REPO_ROOT / "assets" / "phonics" / "set1_clipart"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# ─── Env ─────────────────────────────────────────────────────────────
# Subproject .env holds the Gemini key; load it first, fall back to root.
if SUBPROJECT_ENV.exists():
    load_dotenv(SUBPROJECT_ENV)
if ROOT_ENV.exists():
    load_dotenv(ROOT_ENV, override=False)

GEMINI_API_KEY = os.environ.get("GOOGLE_GEMINI_API_KEY")
if not GEMINI_API_KEY:
    sys.exit(
        "ERROR: GOOGLE_GEMINI_API_KEY is not set.\n"
        "Add it to myphonics_books/.env (preferred) or to the repo-root .env file.\n"
        "  GOOGLE_GEMINI_API_KEY=AIza..."
    )

BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
MODEL = "gemini-2.5-flash-image"
REQUEST_DELAY = 3       # seconds between requests
MAX_RETRIES = 4
BACKOFF_BASE = 5

# ─── Style block (matches MyPhonicsBooks interior look) ──────────────
STYLE_RULES = (
    "MyPhonicsBooks interior illustration style: smooth dark vector-like "
    "outlines, soft flat colours with gentle shading, subtle paper grain "
    "texture inside the object only, gentle modern children's book look, "
    "simple recognisable silhouette, friendly and warm. "
    "Single isolated object centred in frame on a plain pure white background "
    "(no scene, no characters, no other objects, no shadow on the floor, "
    "no border, no frame). "
    "STRICTLY NO text, no letters, no numbers, no words anywhere in the image. "
    "STRICTLY NOT: watercolour wash, pencil sketch, classroom clipart, Jolly "
    "Phonics style, Read Write Inc style, photorealism, 3D render, anime, "
    "manga. The reference image shows the EXACT style, line weight, texture, "
    "and palette feel I want — match it closely."
)

# ─── L1 (Set 1) sound → object map ───────────────────────────────────
# Level 1 = "Starting Stories" = RWI Set 1 single sounds.
# Filenames follow the user's spec; `p` uses 'plant' per project preference
# (rather than 'pen'), matching the MyPhonicsBooks world (covers, gate, broom).
LEVEL = 1
LEVEL_NAME = "Starting Stories"
LEVEL_COLOUR = "#E84B8A"

OBJECTS: list[dict] = [
    {"sound": "m", "word": "mouse",    "object": "a small friendly grey mouse with round ears, pink nose, tiny dot eyes, and a long curly tail, sitting on its haunches"},
    {"sound": "a", "word": "apple",    "object": "a single shiny red apple with a short brown stem and one small bright green leaf"},
    {"sound": "s", "word": "sun",      "object": "a cheerful bright yellow sun with a soft round body and short rounded rays around it"},
    {"sound": "d", "word": "drum",     "object": "a small toy drum with a tan top skin, a red and yellow striped side band, and two short wooden drumsticks crossed in front"},
    {"sound": "t", "word": "tie",      "object": "a folded silk necktie with a navy blue and red diagonal stripe pattern, knot at the top"},
    {"sound": "i", "word": "ink",      "object": "a small clear glass ink bottle with a black tapered stopper, filled with dark navy ink, with a tiny plain blank label on the front"},
    {"sound": "n", "word": "nest",     "object": "a round woven twig bird's nest holding three small pale blue speckled eggs"},
    {"sound": "p", "word": "plant",    "object": "a small leafy houseplant with bright green rounded leaves growing out of a warm terracotta plant pot"},
    {"sound": "g", "word": "gate",     "object": "a small wooden garden gate painted pale sage green, with vertical slats, a curved top, and a simple metal latch"},
    {"sound": "o", "word": "orange",   "object": "a single bright orange fruit with a small dimpled stem and one bright green leaf attached"},
    {"sound": "c", "word": "cat",      "object": "a sitting friendly ginger tabby cat with tiny solid black dot eyes, white paws and chest, and a curled tail at its side"},
    {"sound": "k", "word": "kite",     "object": "a colourful diamond-shaped kite with red, yellow, and blue panels, a long ribbon tail with little bows, and a string"},
    {"sound": "u", "word": "umbrella", "object": "an open umbrella with red and white alternating panels and a curved wooden handle, viewed from a slight three-quarter angle"},
    {"sound": "b", "word": "broom",    "object": "a tall traditional straw broom with a long wooden handle and pale yellow straw bristles tied with a brown band"},
    {"sound": "f", "word": "fish",     "object": "a single bright orange goldfish with flowing fins, viewed in side profile, with a tiny solid black dot eye"},
    {"sound": "e", "word": "egg",      "object": "a single plain white chicken egg with very soft pale grey shading on one side"},
    {"sound": "l", "word": "leaf",     "object": "a single bright green leaf with a pointed tip and clearly visible darker green veins"},
    {"sound": "h", "word": "hat",      "object": "a wide-brimmed straw sun hat with a soft coral pink ribbon band tied in a small bow"},
    {"sound": "r", "word": "rat",      "object": "a friendly small grey rat in side profile, with round pink ears, a pink nose, tiny solid black dot eye, and a long pink tail"},
    {"sound": "j", "word": "jam",      "object": "a clear glass jar of red strawberry jam with a small white-and-red gingham cloth tied over the lid with string"},
    {"sound": "v", "word": "van",      "object": "a small classic camper van in side profile, painted soft cream and red with round headlights and round windows"},
    {"sound": "y", "word": "yoyo",     "object": "a wooden yoyo with a red and yellow striped pattern across the side, with a length of white string attached and looping down"},
    {"sound": "w", "word": "watch",    "object": "a round silver wristwatch with a brown leather strap, a clear pale face, and simple black hour markers (no numbers)"},
    {"sound": "z", "word": "zebra",    "object": "a small friendly black-and-white striped zebra standing in side profile with tiny solid black dot eyes and a short upright black mane"},
    {"sound": "x", "word": "box",      "object": "a small open cardboard box with the four top flaps slightly open, viewed from a slight three-quarter angle"},
]

assert len(OBJECTS) == 25, f"Expected 25 Set 1 entries, got {len(OBJECTS)}"


def build_prompt(entry: dict) -> str:
    return (
        f"Create a clean isolated children's book illustration of {entry['object']}. "
        f"{STYLE_RULES}"
    )


def filename_for(entry: dict) -> str:
    return f"{entry['sound']}_{entry['word']}.png"


# ─── Style reference loader ──────────────────────────────────────────
def load_style_reference_b64() -> str:
    if not STYLE_REF_PATH.exists():
        sys.exit(f"ERROR: style reference image missing at {STYLE_REF_PATH}")
    return base64.b64encode(STYLE_REF_PATH.read_bytes()).decode("ascii")


# ─── Gemini call ─────────────────────────────────────────────────────
async def call_gemini(
    session: aiohttp.ClientSession,
    prompt: str,
    style_ref_b64: str,
) -> Optional[bytes]:
    url = f"{BASE_URL}/models/{MODEL}:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "inlineData": {
                            "mimeType": "image/png",
                            "data": style_ref_b64,
                        }
                    },
                    {"text": prompt},
                ]
            }
        ],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }

    for attempt in range(MAX_RETRIES):
        try:
            async with session.post(url, json=payload) as r:
                if r.status == 200:
                    data = await r.json()
                    for cand in data.get("candidates", []):
                        for part in cand.get("content", {}).get("parts", []):
                            inline = part.get("inlineData") or part.get("inline_data")
                            if inline and "data" in inline:
                                return base64.b64decode(inline["data"])
                    return None
                if r.status == 429:
                    wait = BACKOFF_BASE * (2 ** attempt)
                    print(f"    rate limited, sleeping {wait}s")
                    await asyncio.sleep(wait)
                    continue
                body = await r.text()
                print(f"    HTTP {r.status}: {body[:300]}")
                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(BACKOFF_BASE * (2 ** attempt))
                    continue
                return None
        except Exception as e:
            print(f"    request error: {e}")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(BACKOFF_BASE)
            continue
    return None


# ─── Post-process: square 1024 + alpha-out near-white background ─────
def postprocess(raw_png: bytes, target: int = 1024, white_threshold: int = 240) -> bytes:
    """Convert a raw PNG to a square 1024x1024 RGBA PNG with near-white pixels
    made transparent. Uses corner-seeded flood fill so internal whites stay
    opaque (e.g. inside an eye, on a label)."""
    img = Image.open(BytesIO(raw_png)).convert("RGBA")

    # Square-crop to centre
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    img = img.crop((left, top, left + side, top + side))

    # Resize
    if img.size != (target, target):
        img = img.resize((target, target), Image.LANCZOS)

    # Alpha out the background using flood-fill from the four corners. This
    # only removes connected near-white regions touching the edges, so a
    # white belly/chest inside the silhouette stays opaque.
    px = img.load()
    visited = [[False] * target for _ in range(target)]
    stack: list[tuple[int, int]] = []
    for c in (
        (0, 0),
        (target - 1, 0),
        (0, target - 1),
        (target - 1, target - 1),
    ):
        stack.append(c)

    def is_near_white(rgba: tuple[int, int, int, int]) -> bool:
        r, g, b, a = rgba
        return r >= white_threshold and g >= white_threshold and b >= white_threshold

    while stack:
        x, y = stack.pop()
        if x < 0 or y < 0 or x >= target or y >= target or visited[y][x]:
            continue
        visited[y][x] = True
        if not is_near_white(px[x, y]):
            continue
        # Soften edge: push alpha to 0 fully (anti-alias on outline pixels stays)
        px[x, y] = (255, 255, 255, 0)
        stack.append((x + 1, y))
        stack.append((x - 1, y))
        stack.append((x, y + 1))
        stack.append((x, y - 1))

    out = BytesIO()
    img.save(out, format="PNG", optimize=True)
    return out.getvalue()


# ─── One-image worker ────────────────────────────────────────────────
async def generate_one(
    session: aiohttp.ClientSession,
    entry: dict,
    style_ref_b64: str,
    skip_existing: bool,
) -> dict:
    fname = filename_for(entry)
    out_path = OUT_DIR / fname
    prompt = build_prompt(entry)

    if skip_existing and out_path.exists() and out_path.stat().st_size > 5 * 1024:
        print(f"  /{entry['sound']}/ {entry['word']:9s} -> {fname} (exists, skip)")
        return {**entry, "filename": fname, "prompt": prompt, "skipped": True}

    print(f"  /{entry['sound']}/ {entry['word']:9s} -> generating...")
    raw = await call_gemini(session, prompt, style_ref_b64)
    if not raw:
        print(f"    FAILED — no image data")
        return {**entry, "filename": fname, "prompt": prompt, "failed": True}

    final = postprocess(raw)
    out_path.write_bytes(final)
    kb = len(final) / 1024
    print(f"    saved ({kb:.0f} KB) -> {out_path.relative_to(REPO_ROOT)}")
    return {
        **entry,
        "filename": fname,
        "prompt": prompt,
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "size_kb": round(kb, 1),
    }


# ─── Manifest writer ─────────────────────────────────────────────────
def write_manifest(records: list[dict]) -> None:
    manifest = {
        "pack": "MyPhonicsBooks Set 1 Clipart",
        "level": LEVEL,
        "level_name": LEVEL_NAME,
        "level_colour": LEVEL_COLOUR,
        "model": MODEL,
        "style_reference": str(STYLE_REF_PATH.relative_to(REPO_ROOT)).replace("\\", "/"),
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "items": records,
    }
    (OUT_DIR / "manifest.json").write_text(
        json.dumps(manifest, indent=2), encoding="utf-8"
    )
    print(f"  manifest -> {(OUT_DIR / 'manifest.json').relative_to(REPO_ROOT)}")


# ─── Contact sheet builder ───────────────────────────────────────────
def build_contact_sheet(records: list[dict]) -> None:
    """Compose all generated PNGs into a labelled grid."""
    cols = 5
    rows = 5
    cell = 240
    label_h = 56
    margin = 36
    title_h = 110
    bg = (250, 248, 244, 255)        # warm cream paper
    accent = (232, 75, 138, 255)     # L1 pink

    width = margin * 2 + cols * cell
    height = margin * 2 + title_h + rows * (cell + label_h)
    sheet = Image.new("RGBA", (width, height), bg)

    # Title bar
    from PIL import ImageDraw, ImageFont
    draw = ImageDraw.Draw(sheet)
    draw.rectangle(
        [margin, margin, width - margin, margin + title_h - 20],
        fill=accent,
    )
    try:
        font_title = ImageFont.truetype("arialbd.ttf", 36)
        font_sub = ImageFont.truetype("arial.ttf", 18)
        font_label = ImageFont.truetype("arialbd.ttf", 22)
        font_word = ImageFont.truetype("arial.ttf", 18)
    except OSError:
        font_title = font_sub = font_label = font_word = ImageFont.load_default()

    draw.text(
        (margin + 24, margin + 16),
        "MyPhonicsBooks  ·  Set 1 Clipart",
        fill=(255, 255, 255, 255),
        font=font_title,
    )
    draw.text(
        (margin + 24, margin + 60),
        f"Level 1 — {LEVEL_NAME}  ·  25 single-letter Set 1 sounds",
        fill=(255, 255, 255, 230),
        font=font_sub,
    )

    # Grid
    for i, rec in enumerate(records):
        r, c = divmod(i, cols)
        x = margin + c * cell
        y = margin + title_h + r * (cell + label_h)
        png_path = OUT_DIR / rec["filename"]
        if not png_path.exists():
            draw.rectangle([x + 4, y + 4, x + cell - 4, y + cell - 4], outline=(200, 200, 200, 255))
        else:
            img = Image.open(png_path).convert("RGBA")
            img.thumbnail((cell - 16, cell - 16), Image.LANCZOS)
            ix = x + (cell - img.size[0]) // 2
            iy = y + (cell - img.size[1]) // 2
            sheet.alpha_composite(img, (ix, iy))

        # Label: /sound/  word
        sound = f"/{rec['sound']}/"
        word = rec["word"]
        draw.text((x + 14, y + cell + 4), sound, fill=accent, font=font_label)
        # right-align word
        bbox = draw.textbbox((0, 0), word, font=font_word)
        word_w = bbox[2] - bbox[0]
        draw.text(
            (x + cell - word_w - 14, y + cell + 8),
            word,
            fill=(60, 60, 70, 255),
            font=font_word,
        )

    out = OUT_DIR / "set1_clipart_contact_sheet.png"
    sheet.convert("RGB").save(out, format="PNG", optimize=True)
    print(f"  contact sheet -> {out.relative_to(REPO_ROOT)}")


# ─── README writer ───────────────────────────────────────────────────
README_TEMPLATE = """# Set 1 Clipart — MyPhonicsBooks

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
"""


def write_readme() -> None:
    (OUT_DIR / "README.md").write_text(README_TEMPLATE, encoding="utf-8")
    print(f"  README   -> {(OUT_DIR / 'README.md').relative_to(REPO_ROOT)}")


# ─── Orchestrator ────────────────────────────────────────────────────
async def main_async(targets: list[dict], skip_existing: bool) -> list[dict]:
    style_ref_b64 = load_style_reference_b64()
    records: list[dict] = []
    timeout = aiohttp.ClientTimeout(total=180)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        for entry in targets:
            rec = await generate_one(session, entry, style_ref_b64, skip_existing)
            records.append(rec)
            await asyncio.sleep(REQUEST_DELAY)
    return records


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    g = p.add_mutually_exclusive_group()
    g.add_argument("--test", action="store_true", help="generate just /m/ for a style sanity check")
    g.add_argument("--all", action="store_true", help="generate the full Set 1 pack (25 images)")
    g.add_argument("--only", type=str, help="comma-separated sound keys, e.g. 'm,a,s'")
    g.add_argument("--regen-only", action="store_true", help="generate only files that are missing on disk")
    p.add_argument("--manifest-only", action="store_true", help="don't generate; just rewrite manifest + README + contact sheet from existing PNGs")
    return p.parse_args()


def main() -> None:
    args = parse_args()
    print(f"Output dir: {OUT_DIR}")

    if args.manifest_only:
        # Build records from whatever PNGs are present.
        records = []
        for entry in OBJECTS:
            fname = filename_for(entry)
            if (OUT_DIR / fname).exists():
                records.append({
                    **entry,
                    "filename": fname,
                    "prompt": build_prompt(entry),
                    "size_kb": round((OUT_DIR / fname).stat().st_size / 1024, 1),
                })
        write_manifest(records)
        write_readme()
        build_contact_sheet([{**e, "filename": filename_for(e)} for e in OBJECTS])
        return

    # Pick targets
    if args.test:
        targets = [OBJECTS[0]]                 # /m/ mouse
        skip_existing = False
    elif args.only:
        keys = {s.strip() for s in args.only.split(",") if s.strip()}
        targets = [e for e in OBJECTS if e["sound"] in keys]
        if not targets:
            sys.exit(f"No Set 1 entries match --only={args.only}")
        skip_existing = False
    elif args.regen_only:
        targets = [e for e in OBJECTS if not (OUT_DIR / filename_for(e)).exists()]
        skip_existing = True
        if not targets:
            print("Nothing missing — all 25 files present. Use --all to regenerate.")
            return
    elif args.all:
        targets = OBJECTS
        skip_existing = False
    else:
        # default: regenerate any that are missing
        targets = [e for e in OBJECTS if not (OUT_DIR / filename_for(e)).exists()]
        skip_existing = True
        if not targets:
            print("All 25 already present. Pass --all to force, or --only=<keys>.")
            return

    print(f"Generating {len(targets)} image(s) via {MODEL}...")
    records = asyncio.run(main_async(targets, skip_existing))

    # Write manifest covering ALL Set 1 entries (using existing PNGs for ones we
    # didn't regenerate this run).
    full = []
    for entry in OBJECTS:
        fname = filename_for(entry)
        run_rec = next((r for r in records if r["filename"] == fname), None)
        on_disk = (OUT_DIR / fname).exists()
        if run_rec and not run_rec.get("failed"):
            full.append(run_rec)
        elif on_disk:
            full.append({
                **entry,
                "filename": fname,
                "prompt": build_prompt(entry),
                "size_kb": round((OUT_DIR / fname).stat().st_size / 1024, 1),
            })
        else:
            full.append({**entry, "filename": fname, "prompt": build_prompt(entry), "missing": True})

    write_manifest(full)
    write_readme()
    build_contact_sheet(full)

    failed = [r for r in records if r.get("failed")]
    missing = [r for r in full if r.get("missing")]
    print()
    print(f"Done. Wrote {len([r for r in full if not r.get('missing')])}/25 PNGs.")
    if failed:
        print(f"  failed this run: {[r['sound'] for r in failed]}")
    if missing:
        print(f"  still missing on disk: {[r['sound'] for r in missing]}")


if __name__ == "__main__":
    main()
