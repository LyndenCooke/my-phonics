"""
Hero product-shot generator for MyPhonicsBooks.

Generates 9:16 product photographs of MyPhonicsBooks in different arrangements
and scenarios. Covers are AI-rendered in the MPB house style (not pasted in) —
brand level colour bands at top, child-book illustration in the middle, title +
'Level X · ...' caption in the bottom colour band. Clean cream/neutral
backgrounds with generous whitespace for Canva text/CTA additions.

Modes:
  python generate_hero_shots.py                    # all 10 concepts
  python generate_hero_shots.py 01 04 07           # specific indices
  python generate_hero_shots.py --random 5         # dice-roll style+scene
"""
import asyncio
import base64
import io
import os
import random
import shutil
import sys
from pathlib import Path

from dotenv import load_dotenv
from openai import AsyncOpenAI
from PIL import Image

ROOT = Path(r"C:\Users\ASUS\myphonicsbooks\myphonics_books")
load_dotenv(ROOT / ".env")

OUT_LOCAL = Path(r"C:\Users\ASUS\myphonicsbooks\marketing-mockups\v3\hero_shots")
OUT_DRIVE = Path(r"G:\My Drive\MyPhonicsBooks\02_Marketing\Mockups_v3\hero_shots")

CANVAS_W, CANVAS_H = 1080, 1920


# ---- Brand spec the model has to repeat on every generated cover --------
BRAND_SPEC = (
    "BRAND COVER DESIGN — every visible MyPhonicsBooks book MUST look like this:\n"
    "  • Top band ~12% of cover height, solid brand level colour:\n"
    "      Level 1 = pink #E84B8A · Level 2 = amber #F59E0B · Level 3 = green #22C55E\n"
    "      Level 4 = blue #3B82F6 · Level 5 = purple #8B5CF6 · Level 6 = teal #14B8A6\n"
    "  • In the top band, on the LEFT in small white sans-serif caps: 'LEVEL X · {LEVEL NAME}'.\n"
    "      Level names: 1=STARTING STORIES, 2=LONGER SOUNDS, 3=NEW SPELLINGS,\n"
    "                   4=BUILDING FLUENCY, 5=READING TOGETHER, 6=READING CHAMPION.\n"
    "  • In the top band, on the RIGHT in small white sans-serif: 'MyPhonicsBooks'.\n"
    "  • Centre ~70% of cover: a warm hand-drawn children's-book illustration, simplified inclusive eyes only,\n"
    "      whimsical watercolour textured background, soft pastel palette with pops of bright colour.\n"
    "  • Bottom band ~18% of cover height, same brand level colour as the top, contains a short story title\n"
    "      in bold white sans-serif (e.g. 'The Fish in the Tank'), and underneath in smaller white italic:\n"
    "      'Level X · {Level Name}'.\n"
    "  • All books are perfect-bound paperback A5-portrait, with a subtle paper texture and matte finish.\n"
)

LAYOUT_BAND = (
    "LAYOUT — final canvas is portrait 1024x1536. Reserve a TOP CLEAN BAND of 220 pixels and a BOTTOM CLEAN BAND of 320 pixels "
    "that are uniform off-white #fafafa with absolutely nothing in them. These are Canva-edit zones where the brand "
    "lockup and a pink CTA pill will be added later. The product photograph must live entirely in the middle ~996 pixels."
)

COMMON = (
    "Premium editorial product photography. Soft natural daylight from the left. "
    "Subtle long shadows, photographic depth, shallow depth of field, sharp focus on the front-most book. "
    "Cream/beige/oat-coloured surface (no busy pattern). British English. No misspellings. "
    "All visible text must be perfectly legible and correctly spelled."
)


CONCEPTS = [
    {
        "slug": "01_fanned_5_levels",
        "scene": (
            "Five MyPhonicsBooks paperback books fanned out in an overlapping arc on a warm beige paper surface, "
            "front-most book is Level 1 (pink) titled 'The Fish in the Tank', behind it Level 2 (amber) 'The Night Light', "
            "Level 3 (green) 'The Big Bike Race', Level 4 (blue) 'The Purple Purse', Level 5 (purple) 'Before the Shore'. "
            "Slight upward tilt, very gentle drop-shadow, 35mm lens product-photography feel."
        ),
    },
    {
        "slug": "02_stack_6_spines",
        "scene": (
            "A neat stack of all six MyPhonicsBooks paperbacks photographed from a slight three-quarter angle, "
            "the spines fully visible and clearly showing the six brand level colours from top to bottom in order: "
            "pink (Level 1 · STARTING STORIES), amber (Level 2 · LONGER SOUNDS), green (Level 3 · NEW SPELLINGS), "
            "blue (Level 4 · BUILDING FLUENCY), purple (Level 5 · READING TOGETHER), teal (Level 6 · READING CHAMPION). "
            "Each spine has small white text reading 'MyPhonicsBooks' and the level name. "
            "Soft top-light, oak-coloured table surface."
        ),
    },
    {
        "slug": "03_open_book_bed",
        "scene": (
            "A single MyPhonicsBooks Level 2 (amber) paperback titled 'The Night Light' lying open on a child's "
            "white linen pillow, soft golden bedside-lamp glow, faint silhouette of a fluffy toy in the corner of the frame. "
            "The visible spread shows a phonics-book interior: short sentences on the top quarter and a friendly illustration below. "
            "Cosy bedtime mood."
        ),
    },
    {
        "slug": "04_kitchen_table_morning",
        "scene": (
            "Flat-lay product photograph on a pale wooden kitchen table in soft morning light. "
            "Three MyPhonicsBooks paperbacks (Levels 1 pink, 3 green, 5 purple) arranged diagonally. "
            "Props: a small white mug, a slice of toast on a plate, a wooden pencil, a sprig of dried flowers. "
            "Negative space top-right for headline placement."
        ),
    },
    {
        "slug": "05_gift_wrapped_set",
        "scene": (
            "A neat bundle of all six MyPhonicsBooks tied together with natural twine and a single sprig of eucalyptus, "
            "placed on a cream linen cloth. The top of the stack shows Level 1 pink (front cover visible: 'The Fish in the Tank'). "
            "Premium gift-set aesthetic, like Aesop or Muji packaging photography."
        ),
    },
    {
        "slug": "06_basket_living_room",
        "scene": (
            "Wide product photograph of a small woven seagrass basket in a sun-drenched living-room corner, "
            "filled with the six MyPhonicsBooks paperbacks standing upright, level-colour top bands clearly visible above the rim. "
            "Soft beige rug, a child's wooden toy peeking in the corner. Hygge feel."
        ),
    },
    {
        "slug": "07_held_in_hand",
        "scene": (
            "Close-up product shot of a small child's hand (no face visible, just the hand and arm, brown skin tone) "
            "holding a MyPhonicsBooks Level 1 paperback titled 'The Fish in the Tank' (pink) upright against a soft cream wall. "
            "Sun-dappled light. Sense of pride and small ownership."
        ),
    },
    {
        "slug": "08_floor_with_crayons",
        "scene": (
            "Overhead photograph of a hardwood floor with four MyPhonicsBooks paperbacks (Levels 1, 2, 3, 4) scattered playfully, "
            "alongside a small box of chunky wax crayons, a sheet of children's drawing paper with simple letter shapes (a, t, s, p), "
            "and one MyPhonicsBooks book lying open. Warm wood tone, soft natural light."
        ),
    },
    {
        "slug": "09_backpack_peek",
        "scene": (
            "A mustard-yellow children's backpack stood against a cream wall, half-open at the top, with two MyPhonicsBooks "
            "(Level 2 amber and Level 3 green) peeking out. A small enamel pin on the strap. "
            "Quiet first-day-of-school mood, soft morning light from the left."
        ),
    },
    {
        "slug": "10_rainbow_arc",
        "scene": (
            "All six MyPhonicsBooks paperbacks arranged in a wide arc on cream paper, their top brand bands forming a "
            "rainbow gradient from left to right in the exact brand level colours: "
            "pink → amber → green → blue → purple → teal. "
            "Photographed from directly above, perfectly symmetrical. Architectural Digest still-life energy."
        ),
    },
]


SCENE_POOL = [
    "fanned out in an arc on a beige paper surface",
    "stacked neatly on an oak table photographed from a low three-quarter angle",
    "lying open on a child's white linen pillow under a warm bedside lamp",
    "flat-lay on a pale wooden kitchen table with a mug and dried flowers",
    "tied with natural twine like a premium gift on cream linen",
    "filling a small seagrass basket in a sun-lit living room",
    "held upright in a small child's hand (no face visible) against a cream wall",
    "scattered on a hardwood floor with chunky wax crayons and a child's drawing paper",
    "peeking out the top of a mustard children's backpack against a cream wall",
    "arranged in a wide arc on cream paper, top bands forming a rainbow gradient",
    "lined up upright on a low Scandinavian shelf with a small green plant",
    "splayed open at different pages on a wooden picnic blanket outdoors",
    "tucked under a child's arm walking towards a softly-lit doorway (no face)",
    "stacked on a stool with a torch sitting on top, dim cosy reading-time light",
]


def full_prompt(scene_description: str) -> str:
    return (
        f"{COMMON}\n\n"
        f"SCENE: {scene_description}\n\n"
        f"{BRAND_SPEC}\n\n"
        f"{LAYOUT_BAND}"
    )


def random_scene(rng: random.Random) -> str:
    return rng.choice(SCENE_POOL)


def place_on_canvas(ai_bytes: bytes) -> Image.Image:
    ai = Image.open(io.BytesIO(ai_bytes)).convert("RGB")
    new_w = CANVAS_W
    new_h = int(ai.height * (CANVAS_W / ai.width))
    ai = ai.resize((new_w, new_h), Image.LANCZOS)
    canvas = Image.new("RGB", (CANVAS_W, CANVAS_H), (250, 250, 250))
    y_off = (CANVAS_H - new_h) // 2
    canvas.paste(ai, (0, y_off))
    return canvas


async def gen_one(client: AsyncOpenAI, slug: str, prompt: str, sem: asyncio.Semaphore):
    async with sem:
        try:
            print(f"[..] {slug} requesting…")
            result = await client.images.generate(
                model="gpt-image-2",
                prompt=prompt,
                size="1024x1536",
                quality="high",
                n=1,
            )
            ai_bytes = base64.b64decode(result.data[0].b64_json)
            final = place_on_canvas(ai_bytes)
            out = OUT_LOCAL / f"{slug}.png"
            final.save(out, "PNG")
            shutil.copy2(out, OUT_DRIVE / out.name)
            print(f"[ok] {out.name}")
            return out
        except Exception as e:
            print(f"[err] {slug}: {e}", file=sys.stderr)
            return None


async def main():
    OUT_LOCAL.mkdir(parents=True, exist_ok=True)
    OUT_DRIVE.mkdir(parents=True, exist_ok=True)
    client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])

    args = sys.argv[1:]
    todo = []
    if args and args[0] == "--random":
        n = int(args[1]) if len(args) > 1 else 5
        rng = random.Random()
        for i in range(n):
            todo.append((f"rand_{i+1:02d}", full_prompt(random_scene(rng))))
    elif args:
        wanted = set(args)
        for c in CONCEPTS:
            idx = c["slug"].split("_")[0]
            if c["slug"] in wanted or idx in wanted:
                todo.append((c["slug"], full_prompt(c["scene"])))
    else:
        for c in CONCEPTS:
            todo.append((c["slug"], full_prompt(c["scene"])))

    if not todo:
        print("Nothing to generate", file=sys.stderr); sys.exit(1)
    print(f"Generating {len(todo)} hero shots…")
    sem = asyncio.Semaphore(3)
    await asyncio.gather(*(gen_one(client, slug, p, sem) for slug, p in todo))


if __name__ == "__main__":
    asyncio.run(main())
