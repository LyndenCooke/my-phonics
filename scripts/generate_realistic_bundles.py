"""Generate photorealistic product photos for the 8 Level Starter Bundles and
the Family full-scheme bundle — composites mixing storybook(s) + workbook +
card deck + pen.

Same 2-reference-cap rule as generate_realistic_sets.py (more than ~2
simultaneous cover references reliably makes the model merge/garble covers
and titles — validated in chat, 2026-07-11). For a bundle the two most
brand-critical, must-be-exact items are the storybook cover and the workbook
cover, so those are the two real references; the card deck and pen are
described in prose only (generic, not brand-specific enough to need a
reference — a "small stack of flashcards" and "a capped pen" render fine
from words alone).

Outputs to public/shop/_realistic_staging/{sku}.png for review before
replacing the live public/shop/{sku}.webp.

Run:  py -3.12 scripts/generate_realistic_bundles.py            # all 9
      py -3.12 scripts/generate_realistic_bundles.py BN-L4 BN-FAM
Requires: gcloud auth login (see generate_realistic_covers.py header).
"""
from __future__ import annotations

import base64
import io
import subprocess
import sys
import time
from pathlib import Path

import requests
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from generate_realistic_covers import READERS, find_pdf, render_cover  # noqa: E402
from generate_realistic_singles import workbook_cover_art  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "shop" / "_realistic_staging"
REGION = "us-central1"
MODEL = "gemini-2.5-flash-image"

BOOKS_PER_LEVEL = {1: 2, 2: 5, 3: 3, 4: 6, 5: 5, 6: 4, 7: 4, 8: 4}
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


def level_bundle_prompt(level: int, book_title: str, n_books: int) -> str:
    name = LEVEL_NAMES[level]
    extra_books = n_books - 1
    extra_clause = (
        f" A further {extra_books} matching thin booklets are stacked neatly just behind/under it — "
        f"plain page-edges, no invented cover art or titles for them."
        if extra_books > 0 else ""
    )
    return f"""You are creating a photorealistic e-commerce product photo of a "Level {level} Starter
Bundle" for a children's phonics programme: a storybook set + a matching wipe-clean workbook + a
word card deck + a pen, sold together as one bundle.

I am giving you 2 reference images: (1) the exact flat cover artwork of the storybook "{book_title}"
(Level {level} · {name}), and (2) the exact flat cover artwork of the Level {level} workbook.
Reproduce BOTH pixel-accurate — same illustrations, same titles, same text, none redrawn or altered.

Arrange a photorealistic flat-lay / product group shot:
- The storybook: a thin saddle-stitched A5 booklet (~2mm thick, no paperback bulge).{extra_clause}
- The workbook: a noticeably thicker A4 wiro/spiral-bound book (visible spiral rings down one
  edge), leaning against or beside the storybook stack.
- A small neat stack of matt-laminated flashcards (roughly playing-card sized), plain generic
  card-back design in the Level {level} band colour, no specific card art needed — a supporting
  accent item, not the focus.
- One capped pen with a coloured cap resting near the workbook.
- All items share the Level {level} band colour as an accent.

Presentation: soft even studio lighting, clean minimal softly out-of-focus pale neutral surface
(light wood or pale grey), soft realistic contact shadows. Photorealistic camera photography style,
high production quality, like a professional product photo for an online children's bookshop.
NOT a 3D render, NOT a cartoon.

Output one image only."""


FAMILY_PROMPT_TEMPLATE = """You are creating a photorealistic e-commerce product photo of the "Family
Full-Scheme Bundle" for a children's phonics programme: the complete boxed library (33 storybooks
across 8 levels) + 8 wipe-clean workbooks + a complete sound card deck + 8 word card decks + pens,
sold together as the whole programme in one bundle.

I am giving you 2 reference images: (1) the exact flat cover artwork of the Level 1 storybook
"{l1_title}" (pink), and (2) the exact flat cover artwork of the Level 8 storybook "{l8_title}"
(teal). Reproduce BOTH pixel-accurate — same illustrations, same titles, none redrawn or altered.

Arrange a photorealistic product group shot representing the whole programme:
- A wide fan of about 8 thin saddle-stitched A5 booklets showing a smooth colour progression
  through all 8 official level colours in order: pink, coral, amber, green, blue, indigo, purple,
  teal. Put reference 1 (pink, Level 1) at one end and reference 2 (teal, Level 8) at the other end,
  both fully legible; the books in between show correct band colours but do not need invented,
  legible cover art.
- A short stack of 2-3 A4 wiro/spiral-bound workbooks (visible spiral rings), varying band colours,
  behind or beside the book fan.
- Two small neat stacks of matt-laminated flashcards nearby, plain generic designs, supporting
  accent items only.
- A couple of capped pens with coloured caps resting near the workbooks.
- Optionally a branded kraft gift box behind the arrangement labelled "MyPhonicsBooks" (plain,
  no other invented text required).

Presentation: soft even studio lighting, clean minimal softly out-of-focus pale neutral surface
(light wood or pale grey), soft realistic contact shadows. Photorealistic camera photography style,
high production quality, like a professional product photo for an online children's bookshop.
NOT a 3D render, NOT a cartoon.

Output one image only."""


def run_level_bundle(level: int) -> bool:
    sku = f"BN-L{level}"
    print(f"[{sku}] ...")
    book_title = next(t for lv, i, t in READERS if lv == level and i == 1)
    book_cover = render_cover(find_pdf(level, 1))
    wb_cover = workbook_cover_art(level)
    prompt = level_bundle_prompt(level, book_title, BOOKS_PER_LEVEL[level])
    raw = generate(prompt, [book_cover, wb_cover])
    if not raw:
        print(f"   FAILED {sku}")
        return False
    out_path = OUT_DIR / f"{sku.lower()}.png"
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(raw)
    print(f"   saved {out_path.relative_to(ROOT)} ({out_path.stat().st_size // 1024} KB)")
    return True


def run_family_bundle() -> bool:
    sku = "BN-FAM"
    print(f"[{sku}] ...")
    l1_title = next(t for lv, i, t in READERS if lv == 1 and i == 1)
    l8_title = next(t for lv, i, t in READERS if lv == 8 and i == 1)
    covers = [render_cover(find_pdf(1, 1)), render_cover(find_pdf(8, 1))]
    prompt = FAMILY_PROMPT_TEMPLATE.format(l1_title=l1_title, l8_title=l8_title)
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
    wanted = set(sys.argv[1:]) or {f"BN-L{lv}" for lv in range(1, 9)} | {"BN-FAM"}
    ok, total = 0, 0
    for level in range(1, 9):
        sku = f"BN-L{level}"
        if sku in wanted:
            total += 1
            ok += run_level_bundle(level)
    if "BN-FAM" in wanted:
        total += 1
        ok += run_family_bundle()
    print(f"\nDone: {ok}/{total} generated.")
    sys.exit(0 if ok == total else 1)


if __name__ == "__main__":
    main()
