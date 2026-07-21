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
    from data.night_market_story_l3_2_book1 import NIGHT_MARKET_STORY_BOOK1
    from data.dream_team_story_l3_3_book1 import DREAM_TEAM_STORY_BOOK1
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
    from data.draw_it_again_story_l3_4_book1 import DRAW_IT_AGAIN_STORY_BOOK1
    from data.delicious_suspicious_story_l6_3_book1 import DELICIOUS_SUSPICIOUS_STORY_BOOK1
    from data.bush_walk_story_l6_4_book1 import BUSH_WALK_STORY_BOOK1

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
    stories["L3_2_B1"] = NIGHT_MARKET_STORY_BOOK1["L3_2_B1"]
    stories["L3_3_B1"] = DREAM_TEAM_STORY_BOOK1["L3_3_B1"]
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
    stories["L3_4_B1"] = DRAW_IT_AGAIN_STORY_BOOK1["L3_4_B1"]
    stories["L6_3_B1"] = DELICIOUS_SUSPICIOUS_STORY_BOOK1["L6_3_B1"]
    stories["L6_4_B1"] = BUSH_WALK_STORY_BOOK1["L6_4_B1"]

    return stories


# Map from level to story key
LEVEL_KEYS = {
    1: "L1_B1",
    "1.1": "L1_1_B1",
    "1.2": "L1_2_B1",
    "1.3": "L1_B1",   # L1.3 = The Fish in the Tank (legacy "L1_B1" story keyed under its public sub-level)
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
    "3.4": "L3_4_B1",
    "6.3": "L6_3_B1",
    "6.4": "L6_4_B1",
}

# ── 8-level Curriculum Ledger v2.1 realignment (2026-06-08) ──────────────────
# New public level.book id  ->  the book's ORIGINAL (6-level) id, which still
# keys its story (via LEVEL_KEYS) and its image assets (output/images/L{old}_B1).
# Old "Level 1" (10 books) splits into new L1/L2/L3; old L2-L6 shift to L4-L8.
NEW_TO_OLD = {
    "1.1": "1.1", "1.2": "1.2",                                  # L1 Ditties
    "2.1": "1.4", "2.2": "1.5", "2.3": "1.6", "2.4": "1.7", "2.5": "1.8",  # L2 First Sounds
    "3.1": "1.3", "3.2": "1.9", "3.3": "1.10",                   # L3 Special Friends
    "4.1": "2.1", "4.2": "2.2", "4.3": "2.3", "4.4": "2.4", "4.5": "2.5", "4.6": "2.6",  # L4 Longer Sounds
    "5.1": "3.1", "5.2": "3.2", "5.3": "3.3", "5.4": "3.4", "5.5": "3.5",  # L5 New Spellings
    "6.1": "4.1", "6.2": "4.2", "6.3": "4.3", "6.4": "4.4",      # L6 Building Fluency
    "7.1": "5.1", "7.2": "5.2", "7.3": "5.3", "7.4": "5.4",      # L7 Reading Together
    "8.1": "6.1", "8.2": "6.2", "8.3": "6.3", "8.4": "6.4",      # L8 Reading Champion
}


async def generate_pilot_pdf(level: int | str, use_images: bool = True,
                             isbn_entry: dict | None = None,
                             edition: str = "home") -> Path:
    """Generate a single pilot book PDF.

    edition: 'home' (digital/parent-print, keeps writing pages, no barcode)
    or 'library' (physical reusable book: strips write-on pages, adds the
    onboarding page + worksheet QR, carries the barcode).  A render with an
    isbn_entry is ALWAYS the library edition — the barcode belongs on the
    physical library book.

    isbn_entry (classroom/library renders only): a row from the confirmed
    classroom ISBN register (see scripts/isbn_barcodes.py).  Adds the EAN-13
    barcode to the back cover and writes the PDF under
    output/books/print_classroom/ instead of the digital masters — the home
    edition PDFs must never carry the classroom ISBN."""
    if isbn_entry is not None:
        edition = "library"
    stories = get_pilot_stories()

    # 8-level realignment: a new public id (e.g. "3.1") resolves its story and
    # images via the book's ORIGINAL id ("1.3"), but renders/outputs under the
    # NEW level (colour, name, folder, filename).
    new_id = str(level)
    old_id = NEW_TO_OLD.get(new_id, new_id)
    key = LEVEL_KEYS[old_id] if old_id in LEVEL_KEYS else LEVEL_KEYS[level]
    story = stories[key]
    if "." in new_id:
        story["level"] = int(new_id.split(".")[0])   # override to the new (8-level) level

    # Output dir name and image assets both use the NEW (8-level) id —
    # output/images/ was renamed to journey numbering on 2026-07-15 so it
    # no longer needs the OLD-id indirection.
    level_str = new_id.replace(".", "_")
    old_str = old_id.replace(".", "_")  # still used for story/text lookup via LEVEL_KEYS

    # Image directory (keyed by the book's NEW journey id, where the PNGs now live)
    image_dir = None
    if use_images:
        candidate = IMAGE_BASE_DIR / f"L{level_str}_B1"
        if candidate.exists() and any(candidate.glob("*.png")):
            image_dir = candidate
        else:
            print(f"  Warning: No images found at {candidate}")

    # Build book data
    book_data = build_book_data_from_story(
        story, CHILD_NAME, FRIEND_NAME, image_dir,
        edition=edition, book_id=new_id,
    )

    # Classroom ISBN barcode — only when an entry from the CONFIRMED register
    # is passed in.  The title cross-check fails loudly rather than ever
    # printing another book's ISBN.
    if isbn_entry is not None:
        from isbn_barcodes import barcode_context, normalise_title
        if isbn_entry["book_id"] != new_id:
            raise ValueError(
                f"ISBN entry is for book {isbn_entry['book_id']}, rendering {new_id}")
        if normalise_title(isbn_entry["title"]) != normalise_title(story["book_title"]):
            raise ValueError(
                f"ISBN register title '{isbn_entry['title']}' does not match "
                f"story title '{story['book_title']}' for book {new_id}")
        book_data.update(barcode_context(isbn_entry))

    # Render HTML
    html = render_book_html(book_data)

    # Determine level folder (Level1, Level2, etc.).  Library edition renders
    # to a separate tree so it never overwrites the digital home masters:
    # print_classroom/ when it carries a real ISBN, else library_preview/.
    if isbn_entry is not None:
        books_root = OUTPUT_DIR / "print_classroom"
    elif edition == "library":
        books_root = OUTPUT_DIR / "library_preview"
    else:
        books_root = OUTPUT_DIR
    if level == 1 or str(level).startswith("1."):
        level_folder = books_root / "Level1"
        main_level = 1
    else:
        main_level = int(str(level).split(".")[0])
        level_folder = books_root / f"Level{main_level}"
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


async def generate_all_pilots(use_images: bool = True,
                              isbn_register: dict | None = None):
    """Generate all pilot book PDFs (all sub-levels)."""
    print("MyPhonicsBooks — Pilot Book Generator")
    print("=" * 55)
    print(f"Child: {CHILD_NAME} | Friend: {FRIEND_NAME}")
    print(f"Images: {'Yes' if use_images else 'No (placeholders)'}")
    if isbn_register is not None:
        print("Classroom ISBN barcodes: ON -> output/books/print_classroom/")
    print()

    stories = get_pilot_stories()
    generated = 0
    failed = 0

    # Generate every NEW-scheme book id (33 books). Iterating LEVEL_KEYS
    # here is the old bug (fixed 2026-07-12, accidentally reintroduced by
    # the 07-15 image-rename edit): it also renders the pre-split legacy
    # Level-1 ids (1, 1.3-1.10) as duplicate PDFs into output/books/Level1.
    for level_key in sorted(NEW_TO_OLD, key=lambda k: [int(p) for p in k.split(".")]):
        story_key = LEVEL_KEYS.get(NEW_TO_OLD[level_key])
        if story_key not in stories:
            continue

        title = stories[story_key]["book_title"]
        main_level = int(level_key.split(".")[0])

        print(f"[L{level_key}] {LEVEL_NAMES.get(main_level, '?')}: \"{title}\"")
        print(f"  Rendering HTML...")

        try:
            isbn_entry = None
            if isbn_register is not None:
                isbn_entry = isbn_register.get(level_key)
                if isbn_entry is None:
                    raise ValueError(f"no classroom ISBN in register for {level_key}")
            output_path = await generate_pilot_pdf(level_key, use_images,
                                                   isbn_entry=isbn_entry)
            size_kb = output_path.stat().st_size / 1024
            print(f"  Done: {output_path.name} ({size_kb:.0f} KB)")
            generated += 1
        except Exception as e:
            print(f"  ERROR: {e}")
            failed += 1
        print()

    print("=" * 55)
    print(f"Generated {generated} books ({failed} failed)")
    print(f"Output folder: {OUTPUT_DIR}")
    return failed


def _publish(level_arg):
    """Auto-sync regenerated PDFs to public/book-pdfs/ + Supabase Storage so
    downstream consumers (the unlock page, the post-assessment email, other
    Claude sessions) immediately see the new content. Pass --no-publish on
    the command line to skip — e.g. during local-only test renders.

    Chains: impose A4 saddle-stitch booklet → push A5+A4 to public/ + Supabase.
    """
    import subprocess
    here = Path(__file__).parent
    # Narrow the level arg so we don't impose / publish all 6 levels when only
    # one was rendered.
    level_filter = None
    if isinstance(level_arg, int):
        level_filter = str(level_arg)
    elif isinstance(level_arg, str) and "." in level_arg:
        level_filter = level_arg.split(".")[0]

    print("\n--- Imposing A4 saddle-stitch booklets ---")
    impose_cmd = ["py", "-3.12", str(here / "make_printable_booklet.py")]
    impose_cmd += ["--level", level_filter] if level_filter else ["--all"]
    rc = subprocess.call(impose_cmd)
    if rc != 0:
        print(f"WARNING: make_printable_booklet.py exited with {rc}. "
              "Continuing to publish anyway — A4 versions may be stale.")

    print("\n--- Publishing to public/book-pdfs/ + Supabase ---")
    publish_cmd = ["py", "-3.12", str(here / "publish_books.py")]
    if level_filter:
        publish_cmd.append(level_filter)
    rc = subprocess.call(publish_cmd)
    if rc != 0:
        print(f"WARNING: publish_books.py exited with {rc}. PDFs rendered "
              "but NOT pushed to Supabase. Re-run scripts/publish_books.py "
              "manually to fix.")


if __name__ == "__main__":
    use_images = "--no-images" not in sys.argv
    do_publish = "--no-publish" not in sys.argv

    # --isbn: classroom/print render with EAN-13 barcodes.  Requires the
    # CONFIRMED register (data/isbn_classroom.csv) — load_register refuses the
    # PROPOSED file.  Never published: these are print masters, not the
    # digital home-edition PDFs.
    isbn_register = None
    if "--isbn" in sys.argv:
        from isbn_barcodes import load_register
        isbn_register = load_register()
        do_publish = False

    # --library: render the library edition WITHOUT barcodes (design preview
    # → output/books/library_preview/).  The real barcoded library masters
    # come from --isbn, which forces edition=library anyway.
    edition = "library" if "--library" in sys.argv else "home"
    if "--library" in sys.argv:
        do_publish = False

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
        entry = isbn_register.get(str(level_arg)) if isbn_register else None
        if isbn_register is not None and entry is None:
            sys.exit(f"No classroom ISBN in register for {level_arg}")
        asyncio.run(generate_pilot_pdf(level_arg, use_images, isbn_entry=entry,
                                       edition=edition))
    else:
        n_failed = asyncio.run(
            generate_all_pilots(use_images, isbn_register=isbn_register))

    if do_publish:
        _publish(level_arg)

    # Non-zero exit when any book failed, so chained steps (print masters,
    # verification) don't run against a half-regenerated fleet.
    if not level_arg and n_failed:
        sys.exit(1)
