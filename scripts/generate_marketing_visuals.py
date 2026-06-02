"""
MyPhonicsBooks — Gemini Marketing Visual Generator
===================================================
Feeds actual book covers to Gemini to generate:
  1. Photorealistic book mockups (book on a surface)
  2. Lifestyle composites (book with scene context)
  3. Character extractions (illustration on transparent/white bg)

Run from Claude Code or your terminal:
  python scripts/generate_marketing_visuals.py

Requires: pip install google-genai
API key:  GOOGLE_GEMINI_API_KEY in myphonics_books/.env
"""

import os
import sys
from pathlib import Path

# ── Config ─────────────────────────────────────────────────────────────────

SCRIPT_DIR   = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
ENV_FILE     = PROJECT_ROOT / "myphonics_books" / ".env"
COVERS_DIR   = PROJECT_ROOT / "marketing-visuals" / "pdf-covers"
OUT_DIR      = PROJECT_ROOT / "marketing-visuals" / "gemini-generated"
IMAGES_DIR   = PROJECT_ROOT / "myphonics_books" / "output" / "images"

# Books to process — one per level, chosen for diversity
COVER_TARGETS = [
    {
        "file":        "1_3_The_Fish_in_the_Tank_cover.png",
        "title":       "The Fish in the Tank",
        "level":       "Level 1 — Starting Stories",
        "level_color": "pink (#E84B8A)",
        "setting":     "Middle East — a girl in a hijab sitting in a wheelchair beside a fish tank",
    },
    {
        "file":        "2_1_The_Night_Light_cover.png",
        "title":       "The Night Light",
        "level":       "Level 2 — Longer Sounds",
        "level_color": "amber (#F59E0B)",
        "setting":     "Japan — a father and young son standing on a lit street at night",
    },
    {
        "file":        "3_2_Lost_at_the_Night_Market_cover.png",
        "title":       "Lost at the Night Market",
        "level":       "Level 3 — New Spellings",
        "level_color": "green (#22C55E)",
        "setting":     "South East Asia — a girl at a bright bustling night market",
    },
    {
        "file":        "4_1_The_Purple_Purse_cover.png",
        "title":       "The Purple Purse",
        "level":       "Level 4 — Building Fluency",
        "level_color": "blue (#3B82F6)",
        "setting":     "A town street — a girl holding a purple bag",
    },
    {
        "file":        "5_1_Before_the_Shore_cover.png",
        "title":       "Before the Shore",
        "level":       "Level 5 — Reading Together",
        "level_color": "purple (#8B5CF6)",
        "setting":     "A shoreside bench — a boy in a kippah holding a bagel",
    },
    {
        "file":        "6_1_The_Marvellous_Neighbourhood_cover.png",
        "title":       "The Marvellous Neighbourhood",
        "level":       "Level 6 — Reading Champion",
        "level_color": "teal (#14B8A6)",
        "setting":     "Egypt — a boy with arms wide open, sailboats and pyramids behind him",
    },
]

# Page images available per book for character extraction
# (uses the extracted page PNGs from output/images/)
CHARACTER_SOURCES = [
    ("L1_3_B1", "page2.png", "girl in hijab, wheelchair, fish tank bedroom"),
    ("L2_1_B1", "page2.png", "young boy holding toy cat, Japanese city at night"),
    ("L1_7_B1", "page2.png", "boy in white chef jacket at a market stall"),
]


# ── API setup ───────────────────────────────────────────────────────────────

def load_api_key():
    if not ENV_FILE.exists():
        print(f"ERROR: .env not found at {ENV_FILE}")
        sys.exit(1)
    with open(ENV_FILE) as f:
        for line in f:
            if line.startswith("GOOGLE_GEMINI_API_KEY="):
                raw = line.strip().split("=", 1)[1]
                return raw.split()[0].strip().strip('"\'')
    print("ERROR: GOOGLE_GEMINI_API_KEY not found in .env")
    sys.exit(1)


def get_client():
    from google import genai
    key = load_api_key()
    print(f"API key loaded: {key[:8]}...")
    return genai.Client(api_key=key)


# ── Generation functions ────────────────────────────────────────────────────

def generate_book_mockup(client, book: dict, out_dir: Path):
    """Photorealistic shot of the book lying on a warm wooden surface."""
    from google.genai import types

    cover_path = COVERS_DIR / book["file"]
    if not cover_path.exists():
        print(f"  SKIP: cover not found — {cover_path}")
        return

    with open(cover_path, "rb") as f:
        cover_bytes = f.read()

    out_name = book["file"].replace("_cover.png", "_mockup_surface.png")
    out_path = out_dir / "mockups" / out_name
    out_path.parent.mkdir(parents=True, exist_ok=True)

    if out_path.exists():
        print(f"  EXISTS: {out_path.name} — skipping")
        return

    prompt = f"""This is the front cover of a printed children's phonics book called "{book["title"]}" \
({book["level"]}). The cover has a {book["level_color"]} band at the bottom with the title text, \
and a full illustration showing: {book["setting"]}.

Generate a photorealistic marketing photograph: the book is lying flat on a clean warm wooden \
surface (light oak grain), soft natural window light from the left, gentle shadow on the right. \
Shallow depth of field, slight warm tone. The book cover illustration, title text and colour \
band must be reproduced exactly — do not alter, simplify or stylise them. Square 1:1 format."""

    print(f"  Generating surface mockup: {book['title']}...")
    _call_and_save(client, cover_bytes, prompt, out_path)


def generate_lifestyle_scene(client, book: dict, out_dir: Path):
    """Book in a lifestyle context — e.g. on a reading mat next to a child's hand."""
    from google.genai import types

    cover_path = COVERS_DIR / book["file"]
    if not cover_path.exists():
        return

    with open(cover_path, "rb") as f:
        cover_bytes = f.read()

    out_name = book["file"].replace("_cover.png", "_lifestyle.png")
    out_path = out_dir / "lifestyle" / out_name
    out_path.parent.mkdir(parents=True, exist_ok=True)

    if out_path.exists():
        print(f"  EXISTS: {out_path.name} — skipping")
        return

    prompt = f"""This is a children's phonics book called "{book["title"]}" ({book["level"]}). \
The cover illustration shows: {book["setting"]}.

Generate a warm, inviting lifestyle photograph: the book is open to the first page, lying on \
a soft coloured reading mat. A small child's hands (no face visible) are visible at the edges \
of the frame, as if the child is holding the book. Natural warm light. The book pages, \
illustration detail and colour are clear and accurate. Cosy home reading atmosphere. \
Portrait 4:5 format."""

    print(f"  Generating lifestyle scene: {book['title']}...")
    _call_and_save(client, cover_bytes, prompt, out_path)


def generate_character_extraction(client, source_dir: str, page_file: str, description: str, out_dir: Path):
    """Extract the character from a book page onto a clean white background."""
    page_path = IMAGES_DIR / source_dir / page_file
    if not page_path.exists():
        print(f"  SKIP: page not found — {page_path}")
        return

    with open(page_path, "rb") as f:
        page_bytes = f.read()

    out_name = f"{source_dir}_{page_file.replace('.png', '')}_character.png"
    out_path = out_dir / "characters" / out_name
    out_path.parent.mkdir(parents=True, exist_ok=True)

    if out_path.exists():
        print(f"  EXISTS: {out_path.name} — skipping")
        return

    prompt = f"""This is an illustration from a children's book. The main character is: {description}.

Extract the main character from this illustration and place them centred on a plain white background. \
Keep the illustration style exactly as it is — same art style, same colours, same level of detail. \
Do not redraw, stylise or alter the character in any way. Remove all background elements completely. \
Square 1:1 format."""

    print(f"  Extracting character: {description[:50]}...")
    _call_and_save(client, page_bytes, prompt, out_path)


def _call_and_save(client, image_bytes: bytes, prompt: str, out_path: Path):
    """Shared Gemini call — sends image + prompt, saves result."""
    from google.genai import types

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash-image",
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type="image/png"),
                prompt,
            ],
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"]
            ),
        )

        saved = False
        for part in response.candidates[0].content.parts:
            if part.inline_data:
                with open(out_path, "wb") as f:
                    f.write(part.inline_data.data)
                print(f"  [OK] {out_path.name}")
                saved = True
            elif part.text and part.text.strip():
                print(f"  Info: {part.text[:100]}")

        if not saved:
            print(f"  No image returned -- response may have been filtered")

    except Exception as e:
        print(f"  Error: {e}")


# ── Main ────────────────────────────────────────────────────────────────────

def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print("MyPhonicsBooks — Gemini Marketing Visual Generator")
    print("=" * 52)

    client = get_client()

    # 1. Surface mockups — all 6 covers
    print("\n[1/3] Generating surface mockups...")
    for book in COVER_TARGETS:
        generate_book_mockup(client, book, OUT_DIR)

    # 2. Lifestyle scenes — most visually striking covers
    print("\n[2/3] Generating lifestyle scenes...")
    lifestyle_books = [b for b in COVER_TARGETS if b["level"] in (
        "Level 1 — Starting Stories",
        "Level 2 — Longer Sounds",
        "Level 6 — Reading Champion",
    )]
    for book in lifestyle_books:
        generate_lifestyle_scene(client, book, OUT_DIR)

    # 3. Character extractions
    print("\n[3/3] Extracting characters...")
    for source_dir, page_file, description in CHARACTER_SOURCES:
        generate_character_extraction(client, source_dir, page_file, description, OUT_DIR)

    print(f"\nAll done. Outputs saved to:\n  {OUT_DIR}")
    print("\nSubfolders:")
    print("  mockups/    — book on wooden surface (for feed ads)")
    print("  lifestyle/  — book in reading context (for story/reel ads)")
    print("  characters/ — isolated characters on white (for compositing)")


if __name__ == "__main__":
    main()
