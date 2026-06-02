"""
MyPhonicsBooks — Gemini Brief Scene Generator
==============================================
Feeds each composition brief (from gemini-briefs.html) to Gemini 2.5 Flash Image
to produce the photorealistic version. Output goes next to the brief sketch
in the HTML so you can see before/after side-by-side.

Run:
  python scripts/generate_brief_scenes.py

Outputs: marketing-visuals/gemini-generated/briefs/b{N}_*.png
"""

import os
import re
import sys
from pathlib import Path

SCRIPT_DIR   = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
ENV_FILE     = PROJECT_ROOT / "myphonics_books" / ".env"
COVERS_DIR   = PROJECT_ROOT / "marketing-visuals" / "pdf-covers"
OUT_DIR      = PROJECT_ROOT / "marketing-visuals" / "gemini-generated" / "briefs"


BRIEFS = [
    {
        "id":    "b1_bedside_night_read",
        "cover": "2_1_The_Night_Light_cover.png",
        "aspect": "portrait 4:5",
        "prompt": (
            "Photorealistic photograph, 4:5 portrait framing. A children's phonics book "
            "lies face-up on a dark walnut nightstand. A warm amber bedside lamp glows "
            "from the upper right, casting a soft golden pool across the book and a "
            "subtle rim-light on the wood grain. A pair of reading glasses and a white "
            "ceramic mug sit beside the book. Night atmosphere, window dark in the "
            "background. Shallow depth of field. The book should look like a real "
            "printed A5 paperback with subtle paper texture and a crisp edge. "
            "PRESERVE the book cover illustration, title text and amber colour band "
            "EXACTLY as shown in the attached flat cover — do not re-draw, re-stylise "
            "or modify any element of the cover. No text anywhere else in the image."
        ),
    },
    {
        "id":    "b2_flatlay_props",
        "cover": "1_3_The_Fish_in_the_Tank_cover.png",
        "aspect": "square 1:1",
        "prompt": (
            "Photorealistic flatlay photograph, square 1:1. Overhead view of a children's "
            "phonics book placed at the centre on a cream kraft paper surface. Beside "
            "the book: three chunky wax crayons (one pink, one green, one blue), a "
            "small linen-bound lined journal tilted at a slight angle, and a single "
            "red apple with a brown stem. Soft natural overhead daylight, minimal "
            "shadows, clean aesthetic minimalism. "
            "PRESERVE the book cover illustration, title text and pink colour band "
            "EXACTLY as shown in the attached flat cover — do not re-draw. The book "
            "should look like a real printed paperback with slight curl and warm "
            "paper texture. No text anywhere else in the image."
        ),
    },
    {
        "id":    "b3_child_hands_open",
        "cover": "1_7_The_Jam_Jug_cover.png",
        "aspect": "square 1:1",
        "prompt": (
            "Photorealistic photograph, square 1:1. A young child's small hands (skin "
            "tone warm medium, no face visible, arms extending from bottom-left and "
            "bottom-right corners) holding a children's phonics book open flat. The "
            "left-hand page shows the book's FRONT COVER ILLUSTRATION (use the attached "
            "flat cover exactly); the right-hand page shows a clean spread of simple "
            "black printed text on cream paper. Warm natural afternoon light, soft cream "
            "background, slightly blurred wooden floor beneath. Intimate, tender moment. "
            "Shallow depth of field on the hands. PRESERVE the cover illustration and "
            "colour band EXACTLY — do not re-draw. No other text in the image."
        ),
    },
    {
        "id":    "b4_six_level_shelf",
        "cover": None,  # spine stack — no single cover
        "aspect": "square 1:1",
        "prompt": (
            "Photorealistic photograph, square 1:1. Six children's phonics book spines "
            "standing upright on a warm oak bookshelf, slightly uneven heights, arranged "
            "in this exact order from left to right: pink (#E84B8A), amber "
            "(#F59E0B), green (#22C55E), blue (#3B82F6), purple (#8B5CF6), teal "
            "(#14B8A6). Each spine is completely solid-coloured with NO TEXT, NO "
            "LETTERING, NO NUMBERS, NO LOGOS — just the pure flat brand colour from "
            "top to bottom, like blank book spines waiting to be typeset. Soft "
            "indirect indoor daylight, subtle shadow, oak bookshelf grain visible "
            "but out of focus. Cosy family bookshelf mood. Match the exact brand "
            "colours given. Exactly six spines, no extras. Empty space above and "
            "below the books on the shelf."
        ),
    },
    {
        "id":    "b5_picnic_blanket",
        "cover": "3_2_Lost_at_the_Night_Market_cover.png",
        "aspect": "square 1:1",
        "prompt": (
            "Photorealistic overhead photograph, square 1:1. A children's phonics book "
            "lying face-up and slightly angled on a red-and-cream gingham picnic blanket "
            "spread on lush green grass. A woven picnic basket sits in the upper right, "
            "a single red apple in the lower left. Bright summer daylight, dappled sun, "
            "sharp focus on the book, gentle motion blur at the grass edges. Joyful "
            "outdoors mood. PRESERVE the book cover illustration, title text and green "
            "colour band EXACTLY as shown in the attached flat cover — do not re-draw. "
            "No other text in the image."
        ),
    },
    {
        "id":    "b6_birthday_gift",
        "cover": "6_1_The_Marvellous_Neighbourhood_cover.png",
        "aspect": "square 1:1",
        "prompt": (
            "Photorealistic photograph, square 1:1. A children's phonics book sitting "
            "on top of a half-opened sheet of rustic kraft brown wrapping paper on a "
            "warm wooden surface. A wide satin ribbon in teal (#14B8A6) forms a generous "
            "hand-tied bow across the book cover in a cross shape. A single yellow "
            "flower rests beside the gift. Warm afternoon window light from the left, "
            "soft shadow, celebratory cosy mood. PRESERVE the book cover illustration, "
            "title text and teal colour band EXACTLY as shown in the attached flat cover "
            "— do not re-draw. No other text in the image."
        ),
    },
    {
        "id":    "b7_car_school_run",
        "cover": "5_1_Before_the_Shore_cover.png",
        "aspect": "portrait 4:5",
        "prompt": (
            "Photorealistic photograph, 4:5 portrait. Interior of a family car seen "
            "from the back seat: a grey child's booster seat in the centre, with a "
            "children's phonics book resting face-up on it at a slight angle. The car "
            "window beyond shows a blurred daylight view of trees and sky with gentle "
            "bokeh, suggesting the car is stopped or moving slowly. Warm natural "
            "daylight across the seat and book. Everyday parent-and-child moment. "
            "PRESERVE the book cover illustration, title text and purple colour band "
            "EXACTLY as shown in the attached flat cover — do not re-draw. No other "
            "text in the image."
        ),
    },
    {
        "id":    "b8_reading_circle",
        "cover": "4_1_The_Purple_Purse_cover.png",
        "aspect": "square 1:1",
        "prompt": (
            "Photorealistic overhead photograph, square 1:1. A classroom or "
            "home-education reading circle seen from directly above: a round beige "
            "rug in the centre, a single children's phonics book placed in the middle, "
            "and six plush circular cushions evenly spaced around the edge of the rug "
            "— one pink (#E84B8A), one amber (#F59E0B), one green (#22C55E), one blue "
            "(#3B82F6), one purple (#8B5CF6), one teal (#14B8A6). No people visible. "
            "Warm classroom daylight. Aspirational Montessori aesthetic. PRESERVE the "
            "book cover illustration, title text and blue colour band EXACTLY as shown "
            "in the attached flat cover — do not re-draw. No other text in the image."
        ),
    },
]


def load_api_key():
    if not ENV_FILE.exists():
        print(f"ERROR: .env not found at {ENV_FILE}")
        sys.exit(1)
    for line in ENV_FILE.read_text().splitlines():
        if line.startswith("GOOGLE_GEMINI_API_KEY="):
            raw = line.split("=", 1)[1]
            return re.split(r"\s", raw)[0].strip().strip('"\'')
    print("ERROR: GOOGLE_GEMINI_API_KEY not found in .env")
    sys.exit(1)


def generate(client, brief: dict):
    from google.genai import types

    out_path = OUT_DIR / f"{brief['id']}.png"
    if out_path.exists():
        print(f"  EXISTS: {out_path.name} -- skipping")
        return

    contents = []
    if brief["cover"]:
        cover_path = COVERS_DIR / brief["cover"]
        if not cover_path.exists():
            print(f"  SKIP: cover not found -- {cover_path}")
            return
        cover_bytes = cover_path.read_bytes()
        contents.append(types.Part.from_bytes(data=cover_bytes, mime_type="image/png"))
    contents.append(brief["prompt"])

    print(f"  Generating: {brief['id']} ({brief['aspect']})...")
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash-image",
            contents=contents,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"]
            ),
        )

        saved = False
        for part in response.candidates[0].content.parts:
            if part.inline_data:
                out_path.write_bytes(part.inline_data.data)
                print(f"  [OK] {out_path.name}")
                saved = True
            elif part.text and part.text.strip():
                print(f"  Info: {part.text[:100]}")

        if not saved:
            print(f"  No image returned -- response may have been filtered")

    except Exception as e:
        print(f"  Error: {e}")


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print("MyPhonicsBooks -- Gemini Brief Scene Generator")
    print("=" * 50)

    from google import genai
    key = load_api_key()
    print(f"API key loaded: {key[:8]}...")
    client = genai.Client(api_key=key)

    print(f"\nGenerating {len(BRIEFS)} scenes...")
    for brief in BRIEFS:
        generate(client, brief)

    print(f"\nAll done. Outputs saved to:\n  {OUT_DIR}")


if __name__ == "__main__":
    main()
