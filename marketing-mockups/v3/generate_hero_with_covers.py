"""
Hero + real-covers composite generator.

Takes the AI-generated hero shots in `hero_shots/` (which already have the right
scene/lighting/props but the books on them are AI-fakes), and asks gpt-image-2
to REDRAW the scene using the EXACT real cover JPGs (1_1..6_1) as the books.

Also drops a small "FREE PDFs" / "FREE STORYBOOKS" prop into the scene — a
slip of paper, a tiny chalkboard, or wooden letter-magnets — so the hero
doubles as a giveaway ad without any post-processing.

Inputs per call (passed to images.edit):
  • the hero shot PNG (acts as scene reference)
  • the 1..6 real covers we want shown (depends on the hero)
  • the brand lockup (so any visible 'MyPhonicsBooks' band stays correct)

Usage:
  python generate_hero_with_covers.py                 # all heroes
  python generate_hero_with_covers.py 01 03 05        # by hero index
"""
import asyncio
import base64
import io
import os
import shutil
import sys
from pathlib import Path

from dotenv import load_dotenv
from openai import AsyncOpenAI
from PIL import Image

ROOT = Path(r"C:\Users\ASUS\myphonicsbooks\myphonics_books")
load_dotenv(ROOT / ".env")

DRIVE = Path(r"G:\My Drive\MyPhonicsBooks")
COVERS_DIR = DRIVE / "04_Books_PDFs" / "Covers"
LOGO = DRIVE / "01_Brand" / "mpb-lockup.png"
HERO_DIR = Path(r"C:\Users\ASUS\myphonicsbooks\marketing-mockups\v3\hero_shots")
OUT_LOCAL = Path(r"C:\Users\ASUS\myphonicsbooks\marketing-mockups\v3\hero_with_covers")
OUT_DRIVE = DRIVE / "02_Marketing" / "Mockups_v3" / "hero_with_covers"

ALL_COVERS = {
    1: COVERS_DIR / "1_1_cover.jpg",
    2: COVERS_DIR / "2_1_cover.jpg",
    3: COVERS_DIR / "3_1_cover.jpg",
    4: COVERS_DIR / "4_1_cover.jpg",
    5: COVERS_DIR / "5_1_cover.jpg",
    6: COVERS_DIR / "6_1_cover.jpg",
}

# Real interior spreads rasterised from the printed PDFs. When present, the open
# book in the scene must be this exact spread (text + illustration verbatim).
INTERIOR_SPREADS = {
    2: ROOT / "output" / "books" / "Level2" / "_spreads_2_1" / "spread_06_07.png",
}

# Which covers each hero needs to show (matches the scene the hero was built around).
HEROES = [
    {
        "slug": "01_fanned_5_levels",
        "covers": [1, 2, 3, 4, 5],
        "scene_hint": (
            "Five paperback books fanned in an overlapping arc on a warm beige paper surface, "
            "front-most book is Level 1 (pink, 'Tap! Tap! Tap!'), then Level 2 (amber, 'The Night Light'), "
            "Level 3 (green, 'The Big Bike Race'), Level 4 (blue, 'The Purple Purse'), Level 5 (purple, 'Before the Shore'). "
            "Slight upward tilt, soft daylight from left, gentle drop shadow."
        ),
    },
    {
        "slug": "02_stack_6_spines",
        "covers": [1, 2, 3, 4, 5, 6],
        "scene_hint": (
            "A neat stack of all six paperbacks on an oak table photographed from a slight three-quarter angle. "
            "The TOP book of the stack is Level 1 (pink) and its full front cover is clearly visible; the other five sit beneath it as a clean stack with their coloured top bands showing the level order."
        ),
    },
    {
        "slug": "03_open_book_bed",
        "covers": [2],
        "interior_spread": 2,
        "scene_hint": (
            "TWO paperback books from the same Level 2 (amber) edition titled 'The Night Light' on a child's "
            "soft white linen pillow under warm bedside-lamp glow. The LEFT book lies CLOSED and is angled so its "
            "FULL FRONT COVER is clearly visible (the exact amber cover image provided). The RIGHT book lies OPEN "
            "FLAT to the spread provided (pp.6–7) — left page shows 'I go with my dad. We can see the way. The "
            "night is dim.' above an illustration of dad and son walking past a lit shop on a dim night street; "
            "right page shows 'The shop is lit. I peek in. \"Is my cat in it?\" I say.' above an illustration of "
            "the boy peering into a brightly-lit convenience-store drinks fridge with dad behind him. Both books "
            "are the exact same physical paperback (matching paper stock, trim size, binding). The open book's "
            "pages must be the EXACT spread image provided — same illustrations, same text, same layout, no "
            "rewriting and no re-illustration."
        ),
    },
    {
        "slug": "04_kitchen_table_morning",
        "covers": [1, 3, 5],
        "scene_hint": (
            "Flat-lay on a pale wooden kitchen table, soft morning light. Three paperbacks arranged diagonally: Level 1 pink, Level 3 green, Level 5 purple. Small white mug, slice of toast, sprig of dried flowers as props."
        ),
    },
    {
        "slug": "05_gift_wrapped_set",
        "covers": [1],
        "scene_hint": (
            "A neat bundle of all six paperbacks tied with natural twine and a sprig of eucalyptus on a cream linen cloth. The top of the stack shows the FULL Level 1 pink cover ('Tap! Tap! Tap!') face-up."
        ),
    },
    {
        "slug": "06_basket_living_room",
        "covers": [1, 2, 3, 4, 5, 6],
        "scene_hint": (
            "A small woven seagrass basket in a sunlit living-room corner, holding all six paperbacks standing upright with their coloured top bands clearly visible above the rim. Soft beige rug."
        ),
    },
    {
        "slug": "07_held_in_hand",
        "covers": [1],
        "scene_hint": (
            "A small child's hand (no face visible) holding the Level 1 pink paperback ('Tap! Tap! Tap!') upright against a soft cream wall. Sun-dappled light."
        ),
    },
    {
        "slug": "08_floor_with_crayons",
        "covers": [1, 2, 3, 4],
        "scene_hint": (
            "Overhead photograph of a hardwood floor with four paperbacks (Levels 1, 2, 3, 4) scattered playfully alongside a small box of chunky wax crayons and a sheet of children's drawing paper with letter shapes (a, t, s, p)."
        ),
    },
    {
        "slug": "09_backpack_peek",
        "covers": [2, 3],
        "scene_hint": (
            "A mustard-yellow children's backpack against a cream wall, half-open at the top, with two paperbacks (Level 2 amber and Level 3 green) peeking out of the opening — their coloured top bands and titles visible."
        ),
    },
    {
        "slug": "10_rainbow_arc",
        "covers": [1, 2, 3, 4, 5, 6],
        "scene_hint": (
            "All six paperbacks arranged in a wide arc on cream paper, photographed from directly above, perfectly symmetrical. Their top bands form a rainbow gradient from left to right: pink → amber → green → blue → purple → teal."
        ),
    },
]

# Rotate through a few props so the giveaway tag doesn't get repetitive.
FREE_PROPS = [
    "a small slip of cream notepaper with neat handwritten marker text reading 'FREE PDFs' (with a tiny hand-drawn underline), placed flat in the lower-right of the scene",
    "a tiny black miniature chalkboard with white chalk text reading 'FREE STORYBOOKS', leaning against one of the books",
    "five chunky wooden letter-magnet tiles spelling F-R-E-E in primary colours, scattered casually in the foreground",
    "a pastel-pink sticky note with handwritten marker text 'FREE PDFs' stuck lightly to the front of one of the books",
    "a small folded card with bold sans-serif print 'FREE STORYBOOKS · myphonicsbooks.co.uk' standing upright next to the books",
]


def build_prompt(hero: dict, prop: str) -> str:
    cover_list = ", ".join(f"Level {lvl}" for lvl in hero["covers"])
    has_spread = hero.get("interior_spread") is not None
    spread_clause = (
        "\n\nINTERIOR SPREAD — the LAST input image (before the logo) is the EXACT real interior spread "
        "that the open book in the scene must show. Treat it as ground truth: same two illustrations, "
        "same sentence text rendered in the same Andika single-storey font, same page layout with the "
        "small 'SOUNDS IN THIS BOOK · ay · ee · igh' footer band on each page, same page numbers in the "
        "bottom corners. Do NOT redraw the illustrations, do NOT rewrite the sentences, do NOT add new "
        "elements to the pages. The open book must read as a real photograph of these exact pages, "
        "with natural page curvature at the binding, soft realistic paper texture and a gentle shadow "
        "in the gutter.\n"
        if has_spread else ""
    )
    return (
        "Re-render this scene as a premium editorial product photograph for the UK phonics brand "
        "MyPhonicsBooks. Keep the SAME composition, lighting, surface, props and mood as the "
        "reference hero image (the first input image). The book(s) in the scene MUST be the EXACT "
        f"real cover images provided as the next inputs ({cover_list}). Treat those cover images as "
        "ground truth: preserve every illustration, the coloured top and bottom bands, the title text "
        "(e.g. 'Tap! Tap! Tap!', 'The Night Light', 'The Big Bike Race', 'The Purple Purse', "
        "'Before the Shore', 'The Marvellous Neighbourhood'), the 'LEVEL X · ...' caption in the top band, "
        "and the 'MyPhonicsBooks' wordmark in the top-right of every cover. Do not invent new covers, "
        "do not change titles, do not change the level colours, do not blur the text — covers must be "
        "tack-sharp and perfectly legible."
        f"{spread_clause}\n\n"
        f"SCENE: {hero['scene_hint']}\n\n"
        f"GIVEAWAY PROP — add {prop}. The prop must look like a real physical object in the scene with "
        "matching lighting and shadow, not a digital overlay. Text on the prop should be perfectly "
        "spelled (British English).\n\n"
        "OUTPUT: portrait 1024x1536, 35mm lens product-photography feel, shallow depth of field, "
        "sharp focus on the front-most book, soft natural daylight from the left, subtle long shadows, "
        "cream/beige/oat surface. Generous whitespace at the very top and bottom of the canvas so a "
        "headline and CTA pill can be added later. No headline, no CTA pill, no logo lockup in this "
        "render — JUST the photograph."
    )


def open_input_images(hero: dict):
    """Return a list of open file handles in the order the prompt references:
    hero scene → covers → optional interior spread → brand lockup."""
    files = [open(HERO_DIR / f"{hero['slug']}.png", "rb")]
    for lvl in hero["covers"]:
        files.append(open(ALL_COVERS[lvl], "rb"))
    spread_lvl = hero.get("interior_spread")
    if spread_lvl is not None:
        files.append(open(INTERIOR_SPREADS[spread_lvl], "rb"))
    files.append(open(LOGO, "rb"))
    return files


async def gen_one(client: AsyncOpenAI, hero: dict, prop: str, sem: asyncio.Semaphore):
    async with sem:
        files = open_input_images(hero)
        try:
            print(f"[..] {hero['slug']} requesting (covers={hero['covers']})…")
            result = await client.images.edit(
                model="gpt-image-2",
                image=files,
                prompt=build_prompt(hero, prop),
                size="1024x1536",
                quality="high",
            )
            b64 = result.data[0].b64_json
            img = Image.open(io.BytesIO(base64.b64decode(b64))).convert("RGB")
            out = OUT_LOCAL / f"{hero['slug']}.png"
            img.save(out, "PNG")
            shutil.copy2(out, OUT_DRIVE / out.name)
            print(f"[ok] {out.name}")
            return out
        except Exception as e:
            print(f"[err] {hero['slug']}: {e}", file=sys.stderr)
            return None
        finally:
            for f in files:
                f.close()


async def main():
    OUT_LOCAL.mkdir(parents=True, exist_ok=True)
    OUT_DRIVE.mkdir(parents=True, exist_ok=True)
    client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])

    todo = HEROES
    if len(sys.argv) > 1:
        wanted = set(sys.argv[1:])
        todo = [h for h in HEROES if h["slug"] in wanted or h["slug"].split("_")[0] in wanted]

    if not todo:
        print("Nothing to generate", file=sys.stderr); sys.exit(1)

    print(f"Generating {len(todo)} hero+cover composites…")
    sem = asyncio.Semaphore(3)
    await asyncio.gather(*(
        gen_one(client, hero, FREE_PROPS[i % len(FREE_PROPS)], sem)
        for i, hero in enumerate(todo)
    ))


if __name__ == "__main__":
    asyncio.run(main())
