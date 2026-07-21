"""Generate photorealistic product photos for the reader-set and full-library
shop products, by feeding the AI several real flat cover-art references at
once and asking for a fanned arrangement — validated on a 2-book test before
building this (see chat, 2026-07-11): the model handles 2-6 simultaneous
cover references well, keeping each recognisable and correctly positioned,
unlike single-item generation with a conflicting SECOND reference image
(that confuses cover vs. background — not an issue here since all references
here serve the same purpose: "these are the covers, fan them out").

Companion to generate_realistic_covers.py (single storybooks) and
generate_realistic_singles.py (workbooks/pens/cards). Level bundles and the
family bundle (mixed item types: books + workbook + cards + pen) are handled
separately in generate_realistic_bundles.py — a harder composite problem.

Outputs to public/shop/_realistic_staging/{sku}.png for review before
replacing the live public/shop/{sku}.webp.

Run:  py -3.12 scripts/generate_realistic_sets.py            # all 9 (8 sets + library)
      py -3.12 scripts/generate_realistic_sets.py RS-L4 R-LIB   # subset
Requires: gcloud auth login (see generate_realistic_covers.py header).
"""
from __future__ import annotations

import base64
import subprocess
import sys
import time
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parent))
from generate_realistic_covers import READERS, find_pdf, render_cover  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "shop" / "_realistic_staging"
REGION = "us-central1"
MODEL = "gemini-2.5-flash-image"

BOOKS_PER_LEVEL = {1: 2, 2: 5, 3: 3, 4: 6, 5: 5, 6: 4, 7: 4, 8: 4}

_auth: dict[str, str] = {}


def vertex_auth() -> tuple[str, str]:
    if _auth:
        return _auth["tok"], _auth["proj"]
    tok = subprocess.run(["gcloud", "auth", "print-access-token"],
                          capture_output=True, text=True, shell=True).stdout.strip()
    proj = subprocess.run(["gcloud", "config", "get-value", "project"],
                           capture_output=True, text=True, shell=True).stdout.strip()
    if not tok or not proj:
        sys.exit("gcloud not authenticated. Run: gcloud auth login")
    _auth.update(tok=tok, proj=proj)
    return tok, proj


def generate(prompt: str, images: list) -> bytes | None:
    tok, proj = vertex_auth()
    url = (f"https://{REGION}-aiplatform.googleapis.com/v1/projects/{proj}"
           f"/locations/{REGION}/publishers/google/models/{MODEL}:generateContent")
    parts = [{"text": prompt}]
    for img in images:
        import io
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        parts.append({"inlineData": {"mimeType": "image/png", "data": base64.b64encode(buf.getvalue()).decode()}})
    payload = {"contents": [{"role": "user", "parts": parts}],
               "generationConfig": {"responseModalities": ["IMAGE"]}}
    headers = {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}
    for attempt in range(3):
        r = requests.post(url, json=payload, headers=headers, timeout=180)
        if r.status_code == 429:
            wait = 10 * (2 ** attempt)
            print(f"   rate-limited, sleeping {wait}s")
            time.sleep(wait)
            continue
        if r.status_code != 200:
            print(f"   HTTP {r.status_code}: {r.text[:300]}")
            return None
        for part in (r.json().get("candidates") or [{}])[0].get("content", {}).get("parts", []):
            if "inlineData" in part:
                return base64.b64decode(part["inlineData"]["data"])
        print("   no image in response")
        return None
    return None


def fan_prompt(n: int, titles: list[str]) -> str:
    # CAP AT 2 REAL COVER REFERENCES. Tested with up to 6 simultaneous cover
    # references (chat, 2026-07-11): the model reliably merges/garbles covers
    # and titles once given more than ~2-3 at once (wrong level numbers,
    # spliced-together illustrations, gibberish band text). 2 references
    # stays reliable — the rest of the set's count is implied as a plain
    # stacked spine count in prose instead, which the model handles fine
    # since it isn't being asked to reproduce specific unseen cover art.
    shown = titles[:2]
    extra = n - len(shown)
    titled = "; ".join(f'book {i+1} "{t}"' for i, t in enumerate(shown))
    extra_clause = (
        f" Behind these {len(shown)}, add {extra} more matching thin booklets stacked neatly "
        f"(same size, same saddle-stitched thinness) so the whole set of {n} is implied by the "
        f"stack's thickness — their spines/edges can be plain, you do not have any reference for "
        f"their covers so do not invent visible cover art or titles for them, just page-edge slivers."
        if extra > 0 else ""
    )
    return f"""You are creating a photorealistic e-commerce product photo of a SET of {n} real printed
children's books, sold together as one set.

I am giving you {len(shown)} reference image(s) — the exact flat cover artwork of {("this book" if len(shown)==1 else "these books")} in the set ({titled}). Reproduce {("it" if len(shown)==1 else "both")} PIXEL-ACCURATE: same illustration(s), same title(s), same text, none redrawn or altered.

Render {("it" if len(shown)==1 else "them")} as matching thin saddle-stitched booklets (A5 portrait, about 2mm thick each — like
a leaflet, not a paperback, no rounded spine bulge), the front book fully visible and legible, the
second (if given) fanned behind so its cover and title band are still readable.{extra_clause}

Presentation: soft even studio lighting, clean minimal softly out-of-focus pale neutral surface
(light wood or pale grey), one soft realistic contact shadow beneath the group. Photorealistic
camera photography style, high production quality, like a professional product photo for an online
children's bookshop. NOT a 3D render, NOT a cartoon.

Output one image only."""


def covers_for_level(level: int):
    books = [r for r in READERS if r[0] == level]
    covers = [render_cover(find_pdf(lv, idx)) for lv, idx, _ in books]
    titles = [t for _, _, t in books]
    return covers, titles


def run_set(level: int) -> bool:
    sku = f"RS-L{level}"
    print(f"[{sku}] ...")
    covers, titles = covers_for_level(level)
    raw = generate(fan_prompt(len(covers), titles), covers[:2])
    if not raw:
        print(f"   FAILED {sku}")
        return False
    out_path = OUT_DIR / f"{sku.lower().replace('.', '-')}.png"
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(raw)
    print(f"   saved {out_path.relative_to(ROOT)} ({out_path.stat().st_size // 1024} KB)")
    return True


LEVEL_COLOUR_NAMES = {
    1: "pink", 2: "coral", 3: "amber", 4: "green",
    5: "blue", 6: "indigo", 7: "purple", 8: "teal",
}


def run_library() -> bool:
    sku = "R-LIB"
    print(f"[{sku}] ...")
    # Only 2 real cover references (L1 and L8, the ends of the colour
    # journey) — feeding all 8 as references caused the same garbling seen
    # with 6-book sets (see fan_prompt). The 6 in between are described by
    # colour only, in prose, not reproduced from a reference image.
    l1_title = next(t for l, i, t in READERS if l == 1 and i == 1)
    l8_title = next(t for l, i, t in READERS if l == 8 and i == 1)
    covers = [render_cover(find_pdf(1, 1)), render_cover(find_pdf(8, 1))]
    middle = ", ".join(LEVEL_COLOUR_NAMES[lv] for lv in range(2, 8))
    prompt = f"""You are creating a photorealistic e-commerce product photo representing a full boxed
library of 33 children's books spanning 8 reading levels, sold as one keepsake set.

I am giving you 2 reference images — the exact flat cover artwork of the Level 1 book ("{l1_title}",
pink) and the Level 8 book ("{l8_title}", teal). Reproduce BOTH pixel-accurate: same illustrations,
same titles, none redrawn.

Render a wide fan of about 8 matching thin saddle-stitched booklets (A5, ~2mm thick each, no
paperback spine bulge) spread left to right, showing a smooth colour progression through the 8
official level band colours in this exact order: pink, {middle}, teal. Put the Level 1 (pink) cover
reference at one end of the fan and the Level 8 (teal) cover reference at the other end, both fully
legible; the 6 books in between should show their correct band colour but do not need invented,
legible cover illustrations or title text — plain colour bands with a hinted generic illustration
is fine, you have no reference for their exact covers.

Presentation: soft even studio lighting, clean minimal softly out-of-focus pale neutral surface
(light wood or pale grey), one soft realistic contact shadow beneath the group. Photorealistic
camera photography style, high production quality, like a professional product photo for an online
children's bookshop. NOT a 3D render, NOT a cartoon.

Output one image only."""
    raw = generate(prompt, covers)
    if not raw:
        print(f"   FAILED {sku}")
        return False
    out_path = OUT_DIR / f"{sku.lower()}.png"
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(raw)
    print(f"   saved {out_path.relative_to(ROOT)} ({out_path.stat().st_size // 1024} KB)")
    return True


def main():
    wanted = set(sys.argv[1:]) or {f"RS-L{lv}" for lv in range(1, 9)} | {"R-LIB"}
    ok, total = 0, 0
    for level in range(1, 9):
        sku = f"RS-L{level}"
        if sku in wanted:
            total += 1
            ok += run_set(level)
    if "R-LIB" in wanted:
        total += 1
        ok += run_library()
    print(f"\nDone: {ok}/{total} generated.")
    sys.exit(0 if ok == total else 1)


if __name__ == "__main__":
    main()
