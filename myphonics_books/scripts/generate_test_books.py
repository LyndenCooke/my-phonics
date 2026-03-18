"""
Generate test books for all 6 levels to verify PDF consistency.

Creates one book per level with test content.
"""

import asyncio
import json
from pathlib import Path
from generate_book import (
    render_book_html,
    html_to_pdf,
    OUTPUT_DIR,
    LEVEL_COLOURS,
    LEVEL_NAMES,
    STORY_FONT_SIZES,
    LEVEL_AGE_RANGES,
    LEVEL_YEAR_GROUPS,
    SERIES_LEVELS,
    BASE_DIR,
    _font_to_data_uri,
    FONTS_DIR,
)

# Load graphemes data
GRAPHEMES_PATH = BASE_DIR / "data" / "graphemes_by_level.json"
TRICKY_PATH = BASE_DIR / "data" / "tricky_words_by_level.json"


def get_level_graphemes(level: int) -> list:
    """Get cumulative graphemes for a level."""
    try:
        with open(GRAPHEMES_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        level_key = f"level_{level}"
        return data.get(level_key, {}).get("cumulative_graphemes", [])
    except (FileNotFoundError, json.JSONDecodeError):
        return ["s", "a", "t", "p", "i", "n"]


def get_level_tricky_words(level: int) -> list:
    """Get cumulative tricky words for a level."""
    try:
        with open(TRICKY_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        tricky = []
        for lv in range(1, level + 1):
            lv_key = str(lv)
            if lv_key in data:
                tricky.extend(data[lv_key])
        return tricky
    except (FileNotFoundError, json.JSONDecodeError):
        return ["the", "to", "I", "no", "go", "into"]


def build_test_book(level: int, child_name: str = "Alex") -> dict:
    """Build test book data for a specific level."""

    graphemes = get_level_graphemes(level)
    tricky_words = get_level_tricky_words(level)

    # Number of story pages depends on level
    num_story_pages = 6 if level == 1 else 8

    # Generate simple test story pages
    story_pages = []
    for i in range(num_story_pages):
        story_pages.append({
            "text": f"This is page {i + 1} of the Level {level} test book for {child_name}.",
            "image": None,
        })

    return {
        "level": level,
        "level_name": LEVEL_NAMES[level],
        "level_colour": LEVEL_COLOURS[level],
        "child_name": child_name,
        "friend_name": "Sam",
        "book_title": f"Level {level} Test Book",
        "story_font_size": STORY_FONT_SIZES[level],
        "age_range": LEVEL_AGE_RANGES[level],
        "year_group": LEVEL_YEAR_GROUPS[level],
        "series_levels": SERIES_LEVELS,
        "cover_image": None,
        "cover_background_image": "",
        "cover_sounds": graphemes[:8],
        "focus_graphemes": graphemes[:min(12, len(graphemes))],
        "all_graphemes": graphemes,
        "guide_before": [
            "Look at the cover together.",
            "Practise the sounds on page 3.",
        ],
        "guide_during": [
            "Point to each word as your child reads.",
            "If stuck, help them sound out each letter.",
        ],
        "guide_after": [
            "Talk about what happened.",
            "Read it again another day!",
        ],
        "story_pages": story_pages,
        "story_words": ["test", "book", "page", "read"],
        "read_words": ["test", "book", "page", "read"],
        "tricky_words": tricky_words[:6],  # Limit for grid
        "nonsense_words": ["bim", "dop", "fug", "hax", "jiv", "keb", "lom", "nup", "pez", "rux", "sog", "tiv"],
        "questions": [
            {"category": "Finding", "text": "What level is this book?"},
            {"category": "Thinking", "text": "Who is this book for?"},
        ],
        "writing_graphemes": graphemes[:5] if level > 1 else graphemes[:3],
        "writing_words": [],
        "writing_starters": [],
    }


async def generate_all_levels():
    """Generate test books for all 6 levels."""
    print("MyPhonicsBooks — Test Book Generator")
    print("=" * 50)
    print()

    for level in range(1, 7):
        print(f"Generating Level {level}...")

        # Build test data
        book_data = build_test_book(level)

        # Embed fonts
        book_data["font_regular"] = _font_to_data_uri(FONTS_DIR / "Andika-Regular.ttf")
        book_data["font_bold"] = _font_to_data_uri(FONTS_DIR / "Andika-Bold.ttf")
        book_data["font_italic"] = _font_to_data_uri(FONTS_DIR / "Andika-Italic.ttf")
        book_data["font_bold_italic"] = _font_to_data_uri(FONTS_DIR / "Andika-BoldItalic.ttf")
        book_data["fonts_dir"] = str(FONTS_DIR).replace("\\", "/")

        # Render HTML
        html = render_book_html(book_data)

        # Generate PDF
        output_path = OUTPUT_DIR / f"Test_Level{level}.pdf"
        await html_to_pdf(html, output_path)

        file_size = output_path.stat().st_size
        num_graphemes = len(book_data["all_graphemes"])
        template = "ditty (12pp)" if level == 1 else "standard (16pp)"

        print(f"  -> {output_path.name}")
        print(f"     Template: {template}")
        print(f"     Graphemes: {num_graphemes}")
        print(f"     Size: {file_size / 1024:.1f} KB")
        print()

    print("Done! Check output/books/ for all test PDFs.")


if __name__ == "__main__":
    asyncio.run(generate_all_levels())
