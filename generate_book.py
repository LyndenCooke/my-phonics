"""
MyPhonicsBooks — Static Book Generator (MVP Phase 1)

Generates one complete 16-page A5 PDF using HTML/CSS templates
rendered by Playwright. Uses hardcoded Level 1 content for testing.

Usage:
    python generate_book.py
"""

import asyncio
import base64
import os
import sys
from pathlib import Path
from jinja2 import Environment, FileSystemLoader


# ─── Paths ───────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent
TEMPLATES_DIR = BASE_DIR / "book_templates"
FONTS_DIR = BASE_DIR / "assets" / "fonts"
OUTPUT_DIR = BASE_DIR / "output" / "books"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ─── Level Data ──────────────────────────────────────────────────
LEVEL_COLOURS = {
    1: "#E84B8A",
    2: "#F59E0B",
    3: "#22C55E",
    4: "#3B82F6",
    5: "#8B5CF6",
    6: "#14B8A6",
}

LEVEL_NAMES = {
    1: "First Sounds",
    2: "New Sounds",
    3: "Longer Sounds",
    4: "Blending",
    5: "Split Sounds",
    6: "Reading to Learn",
}

# Font size per level (decreases as reading ability grows)
STORY_FONT_SIZES = {
    1: 24,  # Reception — large, clear
    2: 22,
    3: 20,
    4: 18,
    5: 16,
    6: 14,  # Year 3+ — approaching standard book text
}

# Age ranges and year groups
LEVEL_AGE_RANGES = {
    1: "4\u20135", 2: "4\u20135", 3: "5\u20136",
    4: "5\u20137", 5: "6\u20137", 6: "6\u20138",
}
LEVEL_YEAR_GROUPS = {
    1: "Reception / Year 1",
    2: "Reception / Year 1",
    3: "Year 1",
    4: "Year 1 / Year 2",
    5: "Year 2",
    6: "Year 2 / Year 3",
}

# Series overview (used on back cover)
SERIES_LEVELS = [
    {"num": 1, "name": "First Sounds"},
    {"num": 2, "name": "New Sounds"},
    {"num": 3, "name": "Longer Sounds"},
    {"num": 4, "name": "Blending"},
    {"num": 5, "name": "Split Sounds"},
    {"num": 6, "name": "Reading to Learn"},
]


# ─── Hardcoded Level 1 Example Content ──────────────────────────
# Every word below is either decodable at Level 1 or a listed tricky word.
# Level 1 graphemes: s,a,t,p,i,n,m,d,g,o,c,k,ck,e,u,r,h,b,f,ff,l,ll,ss
# Level 1 tricky words: the, to, I, no, go, into

EXAMPLE_BOOK = {
    "level": 1,
    "level_name": "First Sounds",
    "level_colour": LEVEL_COLOURS[1],
    "child_name": "Emma",
    "friend_name": "Mia",
    "book_title": "The Lost Doll",

    # Per-level metadata
    "story_font_size": STORY_FONT_SIZES[1],
    "age_range": LEVEL_AGE_RANGES[1],
    "year_group": LEVEL_YEAR_GROUPS[1],
    "series_levels": SERIES_LEVELS,

    # Cover
    "cover_image": None,  # For the dynamic child illustration
    "cover_background_image": "", # URL or local path to Canva background exported as PNG/JPG
    "cover_sounds": ["s", "a", "t", "p", "i", "n", "m", "d"],

    # Focus graphemes — only the sounds actually used in THIS story (circled on chart)
    "focus_graphemes": [
        "s", "a", "t", "i", "n",
        "m", "d", "g", "o", "k",
        "ck", "e", "u", "r", "h", "b",
        "l", "ll",
    ],

    # All graphemes on the phonics chart (full Level 1 set, shown but not all circled)
    "all_graphemes": [
        "s", "a", "t", "p", "i", "n",
        "m", "d", "g", "o", "c", "k",
        "ck", "e", "u", "r", "h", "b",
        "f", "ff", "l", "ll", "ss",
    ],

    # Guide for Grown-Ups
    "guide_before": [
        "Look at the cover together. Read the title aloud.",
        "Point to the sounds at the top. Practise saying each one.",
        "Ask your child what they think the story might be about.",
        "Read through the Story Words and Tricky Words on page 3.",
    ],
    "guide_during": [
        "Let your child point to each word as they read.",
        "If they get stuck, help them sound out the letters one at a time.",
        "Praise them for trying, even if they need help.",
        "Ask them to look at the pictures for clues.",
        "Re-read pages if your child wants to \u2014 repetition builds fluency.",
    ],
    "guide_after": [
        "Talk about what happened in the story.",
        "Ask your child which part was their favourite.",
        "Try the questions and writing activities at the back.",
        "Read the book again another day \u2014 familiar stories build confidence.",
    ],

    # 8 story pages — all words are CVC decodable or tricky words
    "story_pages": [
        {
            "text": "Emma ran to the big hill. It had lots of grass on it.",
            "image": None,
        },
        {
            "text": "Emma got a doll on the hill. It had a red hat on.",
            "image": None,
        },
        {
            "text": "\u201cThis is not mine,\u201d said Emma. \u201cI must get it back.\u201d",
            "image": None,
        },
        {
            "text": "Emma ran to Mia. \u201cIs this doll for Mia?\u201d \u201cNo,\u201d said Mia.",
            "image": None,
        },
        {
            "text": "Emma and Mia ran to the den. A man sat on a log.",
            "image": None,
        },
        {
            "text": "Emma held up the doll. \u201cIs this for the man?\u201d \u201cNo,\u201d he said.",
            "image": None,
        },
        {
            "text": "Then a girl ran up. \u201cMy doll!\u201d she said. \u201cI am so glad!\u201d",
            "image": None,
        },
        {
            "text": "Emma and Mia ran back. Emma felt good. It is fun to help.",
            "image": None,
        },
    ],

    # Story Words — focused subset of decodable words FROM this story
    "story_words": [
        "ran", "big", "hill", "got", "doll",
        "red", "hat", "back", "den", "man",
        "sat", "log", "held", "glad", "felt",
    ],

    # Read Words — 4 words for "Can You Read These Words?" activity
    "read_words": ["hill", "doll", "back", "glad"],

    # Tricky words used in the story
    "tricky_words": ["the", "to", "I", "no", "go", "into"],

    # Nonsense Words — CVC pseudo-words from Level 1 graphemes for decoding practice
    "nonsense_words": [
        "teg", "mip", "fod", "hun",
        "sab", "pid", "gom", "ruck",
        "beff", "nid", "tull", "dass",
    ],

    # Questions
    "questions": [
        {"category": "Finding", "text": "What did Emma find on the hill?"},
        {"category": "Thinking", "text": "How do you think the girl felt when she got her doll back?"},
        {"category": "Words", "text": "What does \u201cglad\u201d mean in the story?"},
        {"category": "What next", "text": "What would you do if you found something that was not yours?"},
    ],

    # Writing practice (Level 1 = trace graphemes)
    "writing_graphemes": ["s", "a", "t", "p", "i"],

    # For levels 3-4 (not used at Level 1, but included for completeness)
    "writing_words": [],
    "writing_starters": [],
}


def _font_to_data_uri(font_path: Path) -> str:
    """Convert a TTF font file to a base64 data URI for embedding in HTML."""
    raw = font_path.read_bytes()
    b64 = base64.b64encode(raw).decode("ascii")
    return f"data:font/truetype;base64,{b64}"


def render_book_html(book_data: dict) -> str:
    """Render the book HTML from Jinja2 template with provided data."""
    env = Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=False,
    )
    template = env.get_template("book.html")

    # Embed fonts as base64 data URIs so Playwright's Chromium loads them
    # (file:/// URLs are blocked by Chromium's security policy in headless mode)
    book_data["font_regular"] = _font_to_data_uri(FONTS_DIR / "Andika-Regular.ttf")
    book_data["font_bold"] = _font_to_data_uri(FONTS_DIR / "Andika-Bold.ttf")
    book_data["font_italic"] = _font_to_data_uri(FONTS_DIR / "Andika-Italic.ttf")
    book_data["font_bold_italic"] = _font_to_data_uri(FONTS_DIR / "Andika-BoldItalic.ttf")

    # Keep fonts_dir for backwards compat (debug HTML in browser still uses file://)
    fonts_path = str(FONTS_DIR).replace("\\", "/")
    book_data["fonts_dir"] = fonts_path

    return template.render(**book_data)


async def html_to_pdf(html_content: str, output_path: Path) -> Path:
    """Convert HTML string to PDF using Playwright."""
    from playwright.async_api import async_playwright

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Load the HTML content
        await page.set_content(html_content, wait_until="networkidle")

        # Wait for fonts to load
        await page.wait_for_timeout(1000)

        # Generate PDF at A5 size
        await page.pdf(
            path=str(output_path),
            width="148mm",
            height="210mm",
            margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
            print_background=True,
        )

        await browser.close()

    return output_path


def build_book_data(child_name: str, level: int, friend_name: str = "Sam",
                     book_title: str = None, story_pages: list = None) -> dict:
    """Build a complete book data dict, merging dynamic input with level defaults.

    For MVP, if no story_pages are provided, uses the EXAMPLE_BOOK story
    with the child's name swapped in.
    """
    import json

    level_name = LEVEL_NAMES.get(level, "First Sounds")
    level_colour = LEVEL_COLOURS.get(level, "#E84B8A")

    # Load graphemes for this level
    graphemes_path = BASE_DIR / "data" / "graphemes_by_level.json"
    tricky_path = BASE_DIR / "data" / "tricky_words_by_level.json"

    all_graphemes = []
    tricky_words = []
    try:
        with open(graphemes_path, "r", encoding="utf-8") as f:
            graphemes_data = json.load(f)
        # Cumulative: include all graphemes up to this level
        for lv in range(1, level + 1):
            lv_key = str(lv)
            if lv_key in graphemes_data:
                all_graphemes.extend(graphemes_data[lv_key])
    except (FileNotFoundError, json.JSONDecodeError):
        all_graphemes = EXAMPLE_BOOK["all_graphemes"]

    try:
        with open(tricky_path, "r", encoding="utf-8") as f:
            tricky_data = json.load(f)
        for lv in range(1, level + 1):
            lv_key = str(lv)
            if lv_key in tricky_data:
                tricky_words.extend(tricky_data[lv_key])
    except (FileNotFoundError, json.JSONDecodeError):
        tricky_words = EXAMPLE_BOOK["tricky_words"]

    # Use example content if no story provided (MVP: swap child name)
    if story_pages is None:
        story_pages = []
        for page in EXAMPLE_BOOK["story_pages"]:
            text = page["text"].replace("Emma", child_name).replace("Mia", friend_name)
            story_pages.append({"text": text, "image": page.get("image")})

    if book_title is None:
        book_title = EXAMPLE_BOOK["book_title"]

    # Cover sounds — first 8 graphemes of the level (key introductory sounds)
    cover_sounds = all_graphemes[:8] if len(all_graphemes) > 8 else all_graphemes

    return {
        "level": level,
        "level_name": level_name,
        "level_colour": level_colour,
        "child_name": child_name,
        "friend_name": friend_name,
        "book_title": book_title,
        "story_font_size": STORY_FONT_SIZES.get(level, 24),
        "age_range": LEVEL_AGE_RANGES.get(level, "4-5"),
        "year_group": LEVEL_YEAR_GROUPS.get(level, "Reception / Year 1"),
        "series_levels": SERIES_LEVELS,
        "cover_image": None,
        "cover_background_image": "https://placehold.co/1748x2480/DDDDDD/999999.png?text=Canva+Background",
        "cover_sounds": cover_sounds,
        "focus_graphemes": EXAMPLE_BOOK.get("focus_graphemes", all_graphemes),
        "all_graphemes": all_graphemes,
        "guide_before": EXAMPLE_BOOK["guide_before"],
        "guide_during": EXAMPLE_BOOK["guide_during"],
        "guide_after": EXAMPLE_BOOK["guide_after"],
        "story_pages": story_pages,
        "story_words": EXAMPLE_BOOK["story_words"],
        "read_words": EXAMPLE_BOOK["read_words"],
        "tricky_words": tricky_words,
        "nonsense_words": EXAMPLE_BOOK["nonsense_words"],
        "questions": [
            {**q, "text": q["text"].replace("Emma", child_name)}
            for q in EXAMPLE_BOOK["questions"]
        ],
        "writing_graphemes": EXAMPLE_BOOK["writing_graphemes"],
        "writing_words": EXAMPLE_BOOK.get("writing_words", []),
        "writing_starters": EXAMPLE_BOOK.get("writing_starters", []),
    }


async def generate_book_pdf(child_name: str, level: int,
                             friend_name: str = "Sam",
                             book_title: str = None,
                             story_pages: list = None) -> Path:
    """Generate a complete PDF for the given child and level. Returns the output path."""
    book_data = build_book_data(child_name, level, friend_name, book_title, story_pages)
    html = render_book_html(book_data)

    # Sanitise filename
    safe_name = "".join(c for c in child_name if c.isalnum() or c in " _-").strip()
    safe_title = "".join(c for c in (book_title or "Book") if c.isalnum() or c in " _-").strip()
    filename = f"{safe_title.replace(' ', '_')}_Level{level}_{safe_name}.pdf"
    output_path = OUTPUT_DIR / filename

    await html_to_pdf(html, output_path)
    return output_path


def generate_static_book():
    """Generate a static example book PDF (for testing)."""
    print("MyPhonicsBooks — Static Book Generator")
    print("=" * 50)

    # Step 1: Render HTML
    print("[1/3] Rendering HTML template...")
    html = render_book_html(EXAMPLE_BOOK)

    # Save HTML for debugging
    debug_html_path = OUTPUT_DIR / "debug_book.html"
    debug_html_path.write_text(html, encoding="utf-8")
    print(f"      Debug HTML saved: {debug_html_path}")

    # Step 2: Convert to PDF
    output_path = OUTPUT_DIR / "The_Lost_Doll_Level1_Emma.pdf"
    print("[2/3] Converting to PDF with Playwright...")

    asyncio.run(html_to_pdf(html, output_path))

    print(f"      PDF saved: {output_path}")

    # Step 3: Summary
    file_size = output_path.stat().st_size
    print(f"[3/3] Done!")
    print(f"      File size: {file_size / 1024:.1f} KB")
    print(f"      Pages: 16 (A5 format)")
    print(f"      Font: Andika")
    print(f"      Level: {EXAMPLE_BOOK['level']} — {EXAMPLE_BOOK['level_name']}")
    print(f"      Child: {EXAMPLE_BOOK['child_name']}")
    print()
    print(f"Open the PDF to review: {output_path}")
    print(f"Open the HTML to debug: {debug_html_path}")

    return output_path


if __name__ == "__main__":
    generate_static_book()
