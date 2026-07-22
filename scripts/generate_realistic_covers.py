"""Generate photorealistic 3D product photos for the 33 storybook covers.

Replaces the flat-with-shadow mockups (generate_shop_mockups.py) for the
reader-single section only — composite shots (sets, library, workbooks,
card decks, bundles) are out of scope, they still use the flat mockups.

Style locked in 2026-07-11 after 4 iterations against real printed-proof
reference photos (see chat): the model reliably nails cover-art fidelity
and background/lighting from a single flat cover-art reference image, but
reliably gets the booklet's THINNESS wrong (renders a thick paperback
spine) unless told in words with concrete comparisons ("2mm, like a
leaflet") — feeding a second real photo as a shape reference instead
backfires, the model copies its bad lighting/background too. So: ONE
reference image only (the flat cover art), thinness described in prose.

Outputs to public/shop/_realistic_staging/{sku}.png for review BEFORE
replacing the live public/shop/{sku}.webp — do not wire these into the
site until they've been eyeballed.

Run:  py -3.12 scripts/generate_realistic_covers.py            # all 33
      py -3.12 scripts/generate_realistic_covers.py R-L1.1 R-L6.4   # subset
Requires: an authenticated gcloud (gcloud auth login) with a billing-enabled
project. Region us-central1, gemini-2.5-flash-image. PyMuPDF, Pillow.
"""
from __future__ import annotations

import base64
import glob
import os
import subprocess
import sys
import time
from pathlib import Path

import requests
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
BOOKS_DIR = ROOT / "myphonics_books" / "output" / "books"
OUT_DIR = ROOT / "public" / "shop" / "_realistic_staging"

REGION = "us-central1"
MODEL = "gemini-2.5-flash-image"

# Keep in step with READERS in src/lib/shopCatalogue.ts.
LEVEL_NAMES = {
    1: "Ditties", 2: "First Sounds", 3: "Special Friends", 4: "Longer Sounds",
    5: "New Spellings", 6: "Building Fluency", 7: "Reading Together", 8: "Reading Champion",
}

READERS = [
    (1, 1, "Tap! Tap! Tap!"), (1, 2, "The Mud on the Dog"),
    (2, 1, "The Red Socks"), (2, 2, "Run, Pup, Run!"), (2, 3, "Fox Fell Off!"),
    (2, 4, "The Jam Jug"), (2, 5, "The Yak and the Box"),
    (3, 1, "The Fish in the Tank"), (3, 2, "Chop, Chop, Chop!"), (3, 3, "Buzz and Sing!"),
    (4, 1, "The Night Light"), (4, 2, "Hot Food, Cool Moon"), (4, 3, "Morning on the Farm"),
    (4, 4, "The Fair in the Air"), (4, 5, "Round and Round"), (4, 6, "The Night Fair"),
    (5, 1, "The Big Bike Race"), (5, 2, "Lost at the Night Market"), (5, 3, "The Dream Team"),
    (5, 4, "What Min Saw"), (5, 5, "The Boat with the Red Sail"),
    (6, 1, "The Purple Purse"), (6, 2, "The Brown Owl"), (6, 3, "The New Glue"),
    (6, 4, "The Cheeky Monkey"),
    (7, 1, "Before the Shore"), (7, 2, "Near the Door"), (7, 3, "Sure She Can!"),
    (7, 4, "A Place for Me"),
    (8, 1, "The Marvellous Neighbourhood"), (8, 2, "You Are Remarkable"),
    (8, 3, "It Looks Suspicious!"), (8, 4, "The Incredible Bush Walk"),
]
assert len(READERS) == 33


def sku_for(level: int, index: int) -> str:
    return f"R-L{level}.{index}"


def find_pdf(level: int, index: int) -> Path:
    pattern = str(BOOKS_DIR / f"Level{level}" / f"{level}_{index} *.pdf")
    matches = [p for p in glob.glob(pattern) if "Printable Booklet" not in p]
    if not matches:
        raise FileNotFoundError(f"No PDF for L{level}.{index}: {pattern}")
    return Path(matches[0])


def render_cover(pdf_path: Path, target_h: int = 1600) -> Image.Image:
    import fitz  # PyMuPDF
    doc = fitz.open(pdf_path)
    pg = doc[0]
    scale = target_h / pg.rect.height
    pix = pg.get_pixmap(matrix=fitz.Matrix(scale, scale))
    img = Image.open(__import__("io").BytesIO(pix.tobytes("png"))).convert("RGB")
    doc.close()
    return img


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


def prompt_for(title: str, level: int) -> str:
    level_name = LEVEL_NAMES[level]
    return f"""You are creating a photorealistic e-commerce product photo of a real printed children's book.

I am giving you the EXACT cover artwork as a reference image. Reproduce it PIXEL-ACCURATE and
CRISP/SHARP: the same illustration, the same title text "{title}" spelled correctly, the same
colour band, the same "LEVEL {level} · {level_name.upper()}" and "MyPhonicsBooks" text spelled
correctly, in the same layout. Do NOT redraw, restyle, warp, or alter the illustration or any
letterforms — every word must be spelled exactly as given and perfectly legible, not distorted.

Render this as a photorealistic studio product photograph of the physical object:

CRITICAL — the object is a SADDLE-STITCHED PAMPHLET, not a book:
- Total thickness (spine to spine, front cover to back cover) is about 2mm — thinner than a phone
  case, thinner than a fridge magnet. Think: a church order-of-service, a doctor's surgery leaflet,
  a folded A5 flyer, a concert programme. 16 sheets of paper, stapled twice through the centre fold.
- The spine, if visible at all from this angle, is a near-flat line with two small silver staples —
  there is NO rounded bulge, NO visible page-block thickness, NO paperback-novel silhouette.
- Lay it flat on the surface at a slight angle rather than standing it fully upright — there is
  barely any base for a thin pamphlet to balance on.

Presentation:
- Matt-laminated cover finish, soft matt sheen, not glossy.
- Soft, even, diffused studio lighting — no visible light source, no hotspot glare, no harsh shadows.
- Background: a clean, minimal, softly out-of-focus pale neutral surface (light wood or soft grey
  studio backdrop), with one soft realistic contact shadow beneath the pamphlet. Plain and
  uncluttered, suitable for a shop product listing.
- Photorealistic camera photography style, shallow depth of field, high production quality — like a
  professional product photo for an online children's bookshop, NOT a 3D render, NOT a cartoon,
  NOT a thick paperback.

Output one image only."""


def generate(prompt: str, image: Image.Image) -> bytes | None:
    tok, proj = vertex_auth()
    url = (f"https://{REGION}-aiplatform.googleapis.com/v1/projects/{proj}"
           f"/locations/{REGION}/publishers/google/models/{MODEL}:generateContent")
    buf = __import__("io").BytesIO()
    image.save(buf, format="PNG")
    img_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    payload = {
        "contents": [{"role": "user", "parts": [
            {"text": prompt},
            {"inlineData": {"mimeType": "image/png", "data": img_b64}},
        ]}],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }
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


def main():
    wanted = set(sys.argv[1:]) or None
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    ok, total = 0, 0
    for level, index, title in READERS:
        sku = sku_for(level, index)
        if wanted and sku not in wanted:
            continue
        total += 1
        out_path = OUT_DIR / f"{sku.lower().replace('.', '-')}.png"
        print(f"[{sku}] {title} ...")
        pdf_path = find_pdf(level, index)
        cover = render_cover(pdf_path)
        raw = generate(prompt_for(title, level), cover)
        if not raw:
            print(f"   FAILED {sku}")
            continue
        out_path.write_bytes(raw)
        print(f"   saved {out_path.relative_to(ROOT)} ({out_path.stat().st_size // 1024} KB)")
        ok += 1
    print(f"\nDone: {ok}/{total} generated.")
    sys.exit(0 if ok == total else 1)


if __name__ == "__main__":
    main()
