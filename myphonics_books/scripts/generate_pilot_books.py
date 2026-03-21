"""
MyPhonicsBooks — Pilot Book Generator

Generates 6 ultimate template PDFs (one per level) using:
- Rewritten stories with engagement hooks (from data/pilot_stories.py)
- Gemini-generated illustrations (from output/images/L{n}_B1/)
- HTML/CSS templates rendered via Playwright

Usage:
    python generate_pilot_books.py            # Generate all 6
    python generate_pilot_books.py L2          # Generate one level
    python generate_pilot_books.py --no-images # Generate PDFs without images
"""

import asyncio
import sys
from pathlib import Path

from generate_book import (
    build_book_data_from_story,
    render_book_html,
    html_to_pdf,
    OUTPUT_DIR,
    LEVEL_NAMES,
)

BASE_DIR = Path(__file__).parent
# Images are in myphonicsbooks/output/images, NOT scripts/output/images
IMAGE_BASE_DIR = BASE_DIR.parent / "output" / "images"

# Universal templates — no specific child name
CHILD_NAME = ""
FRIEND_NAME = ""


def get_pilot_stories() -> dict:
    """Import pilot stories."""
    import sys
    sys.path.insert(0, str(BASE_DIR.parent))

    from data.pilot_stories import PILOT_STORIES
    from data.fish_story_l1_book1 import FISH_STORY_BOOK1
    from data.tap_story_l1_1_book1 import TAP_STORY_BOOK1
    from data.mud_dog_story_l1_2_book1 import MUD_DOG_STORY_BOOK1
    from data.red_sock_story_l1_4_book1 import RED_SOCK_STORY_BOOK1
    from data.run_pup_story_l1_5_book1 import RUN_PUP_STORY_BOOK1
    from data.fox_fell_story_l1_6_book1 import FOX_FELL_STORY_BOOK1
    from data.jam_jug_story_l1_7_book1 import JAM_JUG_STORY_BOOK1
    from data.yak_box_story_l1_8_book1 import YAK_BOX_STORY_BOOK1
    from data.chop_chop_story_l1_9_book1 import CHOP_CHOP_STORY_BOOK1
    from data.buzz_sing_story_l1_10_book1 import BUZZ_SING_STORY_BOOK1
    # L2-L6 sub-level stories
    from data.night_light_story_l2_1_book1 import NIGHT_LIGHT_STORY_BOOK1
    from data.moo_zoo_story_l2_2_book1 import MOO_ZOO_STORY_BOOK1
    from data.bark_dark_story_l2_3_book1 import MORNING_FARM_STORY_BOOK1
    from data.fair_air_story_l2_4_book1 import FAIR_AIR_STORY_BOOK1
    from data.loud_toy_story_l2_5_book1 import LOUD_TOY_STORY_BOOK1
    from data.night_fair_story_l2_6_book1 import NIGHT_FAIR_STORY_BOOK1
    from data.bike_race_story_l3_1_book1 import BIKE_RACE_STORY_BOOK1
    from data.stone_flute_story_l3_2_book1 import STONE_FLUTE_STORY_BOOK1
    from data.reach_treat_story_l3_3_book1 import REACH_TREAT_STORY_BOOK1
    from data.draw_it_again_story_l3_4_book1 import DRAW_IT_AGAIN_STORY_BOOK1
    from data.red_sail_story_l3_5_book1 import RED_SAIL_STORY_BOOK1
    from data.purple_purse_story_l4_1_book1 import PURPLE_PURSE_STORY_BOOK1
    from data.brown_owl_story_l4_2_book1 import BROWN_OWL_STORY_BOOK1
    from data.new_glue_story_l4_3_book1 import NEW_GLUE_STORY_BOOK1
    from data.how_now_story_l4_4_book1 import HOW_NOW_STORY_BOOK1
    from data.before_the_shore_story_l5_1_book1 import SECRET_SHORE_STORY_BOOK1
    from data.near_the_door_story_l5_2_book1 import NEAR_THE_DOOR_STORY_BOOK1
    from data.sure_she_can_story_l5_3_book1 import SURE_SHE_CAN_STORY_BOOK1
    from data.belonging_story_l5_4_book1 import BELONGING_STORY_BOOK1
    from data.marvellous_neighbourhood_story_l6_1_book1 import MARVELLOUS_NEIGHBOURHOOD_STORY_BOOK1 as SECRET_GARDEN_STORY_BOOK1
    from data.remarkable_story_l6_2_book1 import REMARKABLE_STORY_BOOK1

    stories = PILOT_STORIES.copy()
    stories["L1_B1"] = FISH_STORY_BOOK1["L1_B1"]
    stories["L1_1_B1"] = TAP_STORY_BOOK1["L1_1_B1"]
    stories["L1_2_B1"] = MUD_DOG_STORY_BOOK1["L1_2_B1"]
    stories["L1_4_B1"] = RED_SOCK_STORY_BOOK1["L1_4_B1"]
    stories["L1_5_B1"] = RUN_PUP_STORY_BOOK1["L1_5_B1"]
    stories["L1_6_B1"] = FOX_FELL_STORY_BOOK1["L1_6_B1"]
    stories["L1_7_B1"] = JAM_JUG_STORY_BOOK1["L1_7_B1"]
    stories["L1_8_B1"] = YAK_BOX_STORY_BOOK1["L1_8_B1"]
    stories["L1_9_B1"] = CHOP_CHOP_STORY_BOOK1["L1_9_B1"]
    stories["L1_10_B1"] = BUZZ_SING_STORY_BOOK1["L1_10_B1"]
    # L2-L6 sub-level stories
    stories["L2_1_B1"] = NIGHT_LIGHT_STORY_BOOK1["L2_1_B1"]
    stories["L2_2_B1"] = MOO_ZOO_STORY_BOOK1["L2_2_B1"]
    stories["L2_3_B1"] = MORNING_FARM_STORY_BOOK1["L2_3_B1"]
    stories["L2_4_B1"] = FAIR_AIR_STORY_BOOK1["L2_4_B1"]
    stories["L2_5_B1"] = LOUD_TOY_STORY_BOOK1["L2_5_B1"]
    stories["L2_6_B1"] = NIGHT_FAIR_STORY_BOOK1["L2_6_B1"]
    stories["L3_1_B1"] = BIKE_RACE_STORY_BOOK1["L3_1_B1"]
    stories["L3_2_B1"] = STONE_FLUTE_STORY_BOOK1["L3_2_B1"]
    stories["L3_3_B1"] = REACH_TREAT_STORY_BOOK1["L3_3_B1"]
    stories["L3_4_B1"] = DRAW_IT_AGAIN_STORY_BOOK1["L3_4_B1"]
    stories["L3_5_B1"] = RED_SAIL_STORY_BOOK1["L3_5_B1"]
    stories["L4_1_B1"] = PURPLE_PURSE_STORY_BOOK1["L4_1_B1"]
    stories["L4_2_B1"] = BROWN_OWL_STORY_BOOK1["L4_2_B1"]
    stories["L4_3_B1"] = NEW_GLUE_STORY_BOOK1["L4_3_B1"]
    stories["L4_4_B1"] = HOW_NOW_STORY_BOOK1["L4_4_B1"]
    stories["L5_1_B1"] = SECRET_SHORE_STORY_BOOK1["L5_1_B1"]
    stories["L5_2_B1"] = NEAR_THE_DOOR_STORY_BOOK1["L5_2_B1"]
    stories["L5_3_B1"] = SURE_SHE_CAN_STORY_BOOK1["L5_3_B1"]
    stories["L5_4_B1"] = BELONGING_STORY_BOOK1["L5_4_B1"]
    stories["L6_1_B1"] = SECRET_GARDEN_STORY_BOOK1["L6_1_B1"]
    stories["L6_2_B1"] = REMARKABLE_STORY_BOOK1["L6_2_B1"]

    return stories


# Map from level to story key
LEVEL_KEYS = {
    1: "L1_B1",
    "1.1": "L1_1_B1",
    "1.2": "L1_2_B1",
    "1.4": "L1_4_B1",
    "1.5": "L1_5_B1",
    "1.6": "L1_6_B1",
    "1.7": "L1_7_B1",
    "1.8": "L1_8_B1",
    "1.9": "L1_9_B1",
    "1.10": "L1_10_B1",
    2: "L2_B1",
    "2.1": "L2_1_B1",
    "2.2": "L2_2_B1",
    "2.3": "L2_3_B1",
    "2.4": "L2_4_B1",
    "2.5": "L2_5_B1",
    "2.6": "L2_6_B1",
    3: "L3_B1",
    "3.1": "L3_1_B1",
    "3.2": "L3_2_B1",
    "3.3": "L3_3_B1",
    "3.4": "L3_4_B1",
    "3.5": "L3_5_B1",
    4: "L4_B3",
    "4.1": "L4_1_B1",
    "4.2": "L4_2_B1",
    "4.3": "L4_3_B1",
    "4.4": "L4_4_B1",
    5: "L5_B1",
    "5.1": "L5_1_B1",
    "5.2": "L5_2_B1",
    "5.3": "L5_3_B1",
    "5.4": "L5_4_B1",
    6: "L6_B1",
    "6.1": "L6_1_B1",
    "6.2": "L6_2_B1",
}


async def generate_pilot_pdf(level: int | str, use_images: bool = True) -> Path:
    """Generate a single pilot book PDF."""
    stories = get_pilot_stories()
    key = LEVEL_KEYS[level]
    story = stories[key]

    # Handle both integer (1) and string ("1.1") level keys for directory names
    level_str = str(level).replace(".", "_")

    # Image directory
    image_dir = None
    if use_images:
        candidate = IMAGE_BASE_DIR / f"L{level_str}_B1"
        if candidate.exists() and any(candidate.glob("*.png")):
            image_dir = candidate
        else:
            print(f"  Warning: No images found at {candidate}")

    # Build book data
    book_data = build_book_data_from_story(
        story, CHILD_NAME, FRIEND_NAME, image_dir
    )

    # Render HTML
    html = render_book_html(book_data)

    # Determine level folder (Level1, Level2, etc.)
    if level == 1 or str(level).startswith("1."):
        level_folder = OUTPUT_DIR / "Level1"
        main_level = 1
    else:
        main_level = int(str(level).split(".")[0])
        level_folder = OUTPUT_DIR / f"Level{main_level}"
    level_folder.mkdir(parents=True, exist_ok=True)

    # Save debug HTML in level folder
    safe_title_debug = story["book_title"].replace(" ", "_").replace("?", "").replace("!", "")
    debug_path = level_folder / f"debug_{level_str}_{safe_title_debug}.html"
    debug_path.write_text(html, encoding="utf-8")
    print(f"      Debug HTML: {debug_path}")

    # Generate PDF with format: 1.1 Book Title.pdf
    safe_title = story["book_title"].replace("?", "").replace("!", "")
    name_suffix = f"_{CHILD_NAME}" if CHILD_NAME else ""
    # Format: sublevel Title.pdf  e.g., 1.1 Tap Tap Tap.pdf
    filename = f"{level_str} {safe_title}{name_suffix}.pdf"
    output_path = level_folder / filename

    await html_to_pdf(html, output_path)
    return output_path


async def generate_all_pilots(use_images: bool = True):
    """Generate all 6 pilot book PDFs."""
    print("MyPhonicsBooks — Pilot Book Generator")
    print("=" * 55)
    print(f"Child: {CHILD_NAME} | Friend: {FRIEND_NAME}")
    print(f"Images: {'Yes' if use_images else 'No (placeholders)'}")
    print()

    for level in range(1, 7):
        stories = get_pilot_stories()
        key = LEVEL_KEYS[level]
        title = stories[key]["book_title"]

        print(f"[Level {level}] {LEVEL_NAMES[level]}: \"{title}\"")
        print(f"  Rendering HTML...")

        output_path = await generate_pilot_pdf(level, use_images)

        size_kb = output_path.stat().st_size / 1024
        print(f"  Done: {output_path.name} ({size_kb:.0f} KB)")
        print()

    print("=" * 55)
    print("All 6 pilot books generated!")
    print(f"Output folder: {OUTPUT_DIR}")


if __name__ == "__main__":
    use_images = "--no-images" not in sys.argv

    # Check for single level
    level_arg = None
    for arg in sys.argv[1:]:
        if arg.lower().startswith("l"):
            level_part = arg[1:].lower()
            if "." in level_part:
                # Sub-level like "1.1" - keep as string
                level_arg = level_part
            elif level_part.isdigit():
                # Main level like "1" - convert to int
                level_arg = int(level_part)

    if level_arg:
        print(f"Generating Level {level_arg} pilot book...")
        asyncio.run(generate_pilot_pdf(level_arg, use_images))
    else:
        asyncio.run(generate_all_pilots(use_images))
