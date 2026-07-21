"""Generate photorealistic product photos for the remaining SINGLE-item shop
products: the 8 wipe-clean workbooks, the wet-erase pen pack, and the 9 card
decks (1 sound deck + 8 word decks). Companion to generate_realistic_covers.py
(storybooks) — same technique, different physical-form description per type.

Composite products (reader sets, the boxed library, level bundles, the family
bundle) are NOT handled here — see composite_realistic_shop.py, which arranges
these already-realistic single-item renders together instead of asking AI to
invent a multi-object scene from scratch (too high a hallucination risk).

Outputs to public/shop/_realistic_staging/{sku}.png for review before
replacing the live public/shop/{sku}.webp.

Run:  py -3.12 scripts/generate_realistic_singles.py            # all 18
      py -3.12 scripts/generate_realistic_singles.py WB-L1 PEN-3   # subset
Requires: gcloud auth login (see generate_realistic_covers.py header).
"""
from __future__ import annotations

import base64
import io
import subprocess
import sys
import time
from pathlib import Path

import fitz  # PyMuPDF
import requests
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
W2_COVERS = ROOT / "worksheet-engine" / "public" / "covers" / "w2"
CARDS_TIER1 = ROOT / "myphonics_books" / "output" / "cards" / "tier1" / "sound_cards_tier1_premium_all.pdf"
WORD_CARDS_DIR = ROOT / "myphonics_books" / "output" / "word_cards"
OUT_DIR = ROOT / "public" / "shop" / "_realistic_staging"

REGION = "us-central1"
MODEL = "gemini-2.5-flash-image"

LEVEL_NAMES = {
    1: "Ditties", 2: "First Sounds", 3: "Special Friends", 4: "Longer Sounds",
    5: "New Spellings", 6: "Building Fluency", 7: "Reading Together", 8: "Reading Champion",
}

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


def generate(prompt: str, images: list[Image.Image]) -> bytes | None:
    tok, proj = vertex_auth()
    url = (f"https://{REGION}-aiplatform.googleapis.com/v1/projects/{proj}"
           f"/locations/{REGION}/publishers/google/models/{MODEL}:generateContent")
    parts = [{"text": prompt}]
    for img in images:
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


# ─── Workbooks ───────────────────────────────────────────────────────────

def workbook_cover_art(level: int) -> Image.Image:
    return Image.open(W2_COVERS / f"l{level}.png").convert("RGB")


def workbook_prompt(level: int) -> str:
    name = LEVEL_NAMES[level]
    return f"""You are creating a photorealistic e-commerce product photo of a real printed children's workbook.

I am giving you the EXACT cover artwork as a reference image. Reproduce it PIXEL-ACCURATE and
CRISP/SHARP — the same illustration, colours and every word of text spelled exactly as shown,
including "Level {level} · {name}" if present. Do NOT redraw, restyle or alter it.

Render this as a photorealistic studio product photograph of the physical object:
- An A4 portrait WORKBOOK, noticeably thicker than a thin storybook — around 25-30 pages of
  gloss-laminated card stock, so it has real page-block thickness and weight.
- WIRO/SPIRAL BOUND along the left edge: show a visible row of small metal spiral coil rings
  down the left side, not a flat glued or stapled spine. The book should look like it can lie
  fully flat when opened.
- Include ONE fine-tip pen with a coloured cap, resting diagonally on top of or leaning against
  the workbook — it comes with a wet-erase pen included.
- Matt or gloss-laminated cover finish, crisp printed colours.

Presentation:
- Soft, even, diffused studio lighting — no visible light source, no hotspot glare.
- Background: a clean, minimal, softly out-of-focus pale neutral surface (light wood or soft grey
  studio backdrop), with one soft realistic contact shadow beneath the workbook. Plain and
  uncluttered, suitable for a shop product listing.
- Photorealistic camera photography style, shallow depth of field, high production quality — like
  a professional product photo for an online children's bookshop, NOT a 3D render, NOT a cartoon.

Output one image only."""


# ─── Pen pack ────────────────────────────────────────────────────────────

PEN_PROMPT = """Create a photorealistic e-commerce product photo of three fine-tip wet-erase pens
for a children's wipe-clean workbook, fanned out neatly side by side on a clean, minimal, softly
out-of-focus pale neutral surface (light wood or soft grey studio backdrop). Each pen has a white
barrel with a coloured cap (one pink, one indigo, one teal, matching a friendly stationery brand),
a narrow fine felt tip, and a small white label band on the barrel (no readable text needed, just
a clean blank label area). Soft, even studio lighting, one soft realistic contact shadow under each
pen. Photorealistic camera photography style, shallow depth of field, high production quality,
like a professional product photo for an online children's bookshop. NOT a 3D render, NOT a cartoon.
Output one image only."""


# ─── Card decks ──────────────────────────────────────────────────────────

def sound_deck_front_art() -> Image.Image:
    doc = fitz.open(CARDS_TIER1)
    r = doc[0].rect
    mx = (r.width - 74 * 72 / 25.4) / 2
    my = (r.height - 105 * 72 / 25.4) / 2
    scale = 900 / (r.height - 2 * my)
    pix = doc[0].get_pixmap(matrix=fitz.Matrix(scale, scale), clip=fitz.Rect(mx, my, r.width - mx, r.height - my))
    img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
    doc.close()
    return img


def word_deck_front_art(level: int) -> Image.Image:
    path = WORD_CARDS_DIR / f"L{level}_sound_cards.pdf"
    doc = fitz.open(path)
    r = doc[0].rect
    # top-left quadrant only (one card cell), matching generate_shop_mockups.py's word_card_front
    scale = 900 / (r.height / 4)
    pix = doc[0].get_pixmap(matrix=fitz.Matrix(scale, scale), clip=fitz.Rect(1, 1, r.width / 2 - 1, r.height / 4 - 1))
    img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
    doc.close()
    return img


def card_deck_prompt(label: str) -> str:
    return f"""You are creating a photorealistic e-commerce product photo of a real deck of educational
flashcards for children ({label}).

I am giving you the EXACT front-card artwork as a reference image (one card face — a grapheme/sound
in a coloured corner strip, a photo, and a short word). Reproduce THIS card's design PIXEL-ACCURATE
and CRISP — do not redraw or alter the illustration, photo, colours or any text.

Render this as a photorealistic studio product photograph:
- A neat STACK of playing-card-sized cards (roughly A7, credit-card-plus proportions), maybe 40-60mm
  thick as a stack, matt-laminated, with slightly rounded corners.
- The reference card design is the TOP card of the stack, face up, fully visible and sharp.
- A few cards fanned slightly off the top of the stack (like a small hand of cards) to show it is a
  deck, not a single card — but the top card (the reference art) stays the clearest, largest, most
  in-focus element.
- Matt-laminated finish, crisp printed colours, sharp card edges.

Presentation:
- Soft, even, diffused studio lighting — no visible light source, no hotspot glare.
- Background: a clean, minimal, softly out-of-focus pale neutral surface (light wood or soft grey
  studio backdrop), with one soft realistic contact shadow beneath the stack. Plain and uncluttered,
  suitable for a shop product listing.
- Photorealistic camera photography style, shallow depth of field, high production quality.
  NOT a 3D render, NOT a cartoon.

Output one image only."""


TASKS = {}
for lv in range(1, 9):
    TASKS[f"WB-L{lv}"] = ("workbook", lv)
TASKS["PEN-3"] = ("pen", None)
TASKS["SC-FULL"] = ("sound-deck", None)
for lv in range(1, 9):
    TASKS[f"WC-L{lv}"] = ("word-deck", lv)


def run_one(sku: str) -> bool:
    kind, level = TASKS[sku]
    out_path = OUT_DIR / f"{sku.lower()}.png"
    print(f"[{sku}] {kind} ...")
    if kind == "workbook":
        raw = generate(workbook_prompt(level), [workbook_cover_art(level)])
    elif kind == "pen":
        raw = generate(PEN_PROMPT, [])
    elif kind == "sound-deck":
        raw = generate(card_deck_prompt("the complete sound card deck, 150 cards covering every taught sound"), [sound_deck_front_art()])
    elif kind == "word-deck":
        raw = generate(card_deck_prompt(f"the Level {level} word card deck"), [word_deck_front_art(level)])
    else:
        raise ValueError(kind)
    if not raw:
        print(f"   FAILED {sku}")
        return False
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(raw)
    print(f"   saved {out_path.relative_to(ROOT)} ({out_path.stat().st_size // 1024} KB)")
    return True


def main():
    wanted = sys.argv[1:] or list(TASKS.keys())
    ok = sum(run_one(sku) for sku in wanted)
    print(f"\nDone: {ok}/{len(wanted)} generated.")
    sys.exit(0 if ok == len(wanted) else 1)


if __name__ == "__main__":
    main()
