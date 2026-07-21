"""
MyPhonicsBooks — Book Generator

Generates personalized phonics books as A5 PDFs using HTML/CSS templates.
Supports multiple PDF backends via PDF_BACKEND environment variable.

Usage:
    python generate_book.py                    # Generate test Level 1 book
    PDF_BACKEND=docraptor python generate_book.py  # Use DocRaptor cloud
"""

import asyncio
import base64
import json
import re
import sys
from pathlib import Path
from jinja2 import Environment, FileSystemLoader


# ─── Paths ───────────────────────────────────────────────────────
# The script is in myphonicsbooks/scripts/, so root is parent
BASE_DIR = Path(__file__).parent.parent
TEMPLATES_DIR = BASE_DIR / "templates"
FONTS_DIR = BASE_DIR / "assets" / "fonts"
OUTPUT_DIR = BASE_DIR / "output" / "books"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ─── Level Data ──────────────────────────────────────────────────
# 8-level Curriculum Ledger v2.1 scheme (realigned 2026-06-08).
LEVEL_COLOURS = {
    1: "#E84B8A",  # Ditties - Pink
    2: "#F97066",  # First Sounds - Coral
    3: "#F59E0B",  # Special Friends - Amber
    4: "#22C55E",  # Longer Sounds - Green
    5: "#3B82F6",  # New Spellings - Blue
    6: "#6366F1",  # Building Fluency - Indigo
    7: "#8B5CF6",  # Reading Together - Purple
    8: "#14B8A6",  # Reading Champion - Teal
}

LEVEL_NAMES = {
    1: "Ditties",
    2: "First Sounds",
    3: "Special Friends",
    4: "Longer Sounds",
    5: "New Spellings",
    6: "Building Fluency",
    7: "Reading Together",
    8: "Reading Champion",
}

# Font size per level (decreases as reading ability grows).  L1-L3 share the
# large Reception size (old single-sound ditties, now split into 3 levels).
STORY_FONT_SIZES = {
    1: 36, 2: 36, 3: 36,
    4: 28, 5: 24, 6: 20,
    7: 18, 8: 16,
}

# Age ranges and year groups
LEVEL_AGE_RANGES = {
    1: "4\u20135", 2: "4\u20135", 3: "4\u20135", 4: "4\u20136",
    5: "5\u20136", 6: "5\u20137", 7: "6\u20137", 8: "6\u20138",
}
LEVEL_YEAR_GROUPS = {
    1: "Reception",
    2: "Reception",
    3: "Reception",
    4: "Reception / Year 1",
    5: "Year 1",
    6: "Year 1 / Year 2",
    7: "Year 2",
    8: "Year 2 / Year 3",
}

# Series overview (used on back cover)
# The 8-level ledger journey shown on the back cover.  legacy_key is the
# flagship (.1) book's original asset id — its cover thumb represents the
# level on the journey grid.  (Replaced the stale pre-realignment 6-level
# list 2026-07-12 — back covers were still printing "Starting Stories …
# Reading Champion at 6".)
SERIES_LEVELS = [
    {"num": 1, "name": "Ditties",           "colour": LEVEL_COLOURS[1], "legacy_key": "1_1"},
    {"num": 2, "name": "First Sounds",      "colour": LEVEL_COLOURS[2], "legacy_key": "1_4"},
    {"num": 3, "name": "Special Friends",   "colour": LEVEL_COLOURS[3], "legacy_key": "1_3"},
    {"num": 4, "name": "Longer Sounds",     "colour": LEVEL_COLOURS[4], "legacy_key": "2_1"},
    {"num": 5, "name": "New Spellings",     "colour": LEVEL_COLOURS[5], "legacy_key": "3_1"},
    {"num": 6, "name": "Building Fluency",  "colour": LEVEL_COLOURS[6], "legacy_key": "4_1"},
    {"num": 7, "name": "Reading Together",  "colour": LEVEL_COLOURS[7], "legacy_key": "5_1"},
    {"num": 8, "name": "Reading Champion",  "colour": LEVEL_COLOURS[8], "legacy_key": "6_1"},
]

_journey_thumb_cache: dict = {}


def build_journey_levels() -> list:
    """SERIES_LEVELS + a small base64 cover thumbnail per level for the back
    cover journey grid.  Thumbs are downscaled to ~300px wide so 8 of them
    add well under 300KB to a book.  Missing covers degrade to a colour
    block (thumb=None) rather than failing the render."""
    import base64
    import io as _io
    covers_dir = BASE_DIR.parent / "public" / "covers"
    out = []
    for lvl in SERIES_LEVELS:
        key = lvl["legacy_key"]
        if key not in _journey_thumb_cache:
            thumb = None
            src = covers_dir / f"{key}_cover.jpg"
            if src.exists():
                try:
                    from PIL import Image
                    img = Image.open(src)
                    img.thumbnail((300, 425))
                    buf = _io.BytesIO()
                    img.convert("RGB").save(buf, "JPEG", quality=80)
                    thumb = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
                except Exception as exc:
                    print(f"  [journey thumb] {key}: {type(exc).__name__}: {exc}", file=sys.stderr)
            _journey_thumb_cache[key] = thumb
        out.append({**lvl, "thumb": _journey_thumb_cache[key]})
    return out


# ─── Hardcoded Level 1 Example Content ──────────────────────────
# Every word below is either decodable at Level 1 or a listed tricky word.
# Level 1 graphemes: s,a,t,p,i,n,m,d,g,o,c,k,ck,e,u,r,h,b,f,ff,l,ll,ss
# Level 1 tricky words: the, to, I, no, go, into

EXAMPLE_BOOK = {
    "level": 1,
    "level_name": "Starting Stories",
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


PHOTOS_DIR = BASE_DIR / "assets" / "photos"
SPOTLIGHT_WORDS_PATH = BASE_DIR / "data" / "spotlight_words.json"


# ─── Sound Spotlight Helpers ─────────────────────────────────────

def highlight_grapheme_in_word(word: str, grapheme: str) -> str:
    """Return HTML with the grapheme wrapped in <span class='sound-highlight'>.

    Example: highlight_grapheme_in_word("fish", "sh")
    → 'fi<span class="sound-highlight">sh</span>'
    """
    # Handle split digraphs (a-e, i-e, etc.)
    if "-" in grapheme:
        vowel = grapheme[0]
        # Find vowel...consonant(s)...e pattern
        lower = word.lower()
        for vi in range(len(lower) - 2):
            if lower[vi] == vowel and lower[-1] == "e":
                before = word[:vi]
                after = word[vi:]
                return (f'{before}<span class="sound-highlight">{after[0]}</span>'
                        f'{after[1:-1]}<span class="sound-highlight">e</span>')
        return word

    idx = word.lower().find(grapheme.lower())
    if idx == -1:
        return word
    before = word[:idx]
    match = word[idx:idx + len(grapheme)]
    after = word[idx + len(grapheme):]
    return f'{before}<span class="sound-highlight">{match}</span>{after}'


def load_spotlight_words_data():
    """Load the spotlight words JSON."""
    if not SPOTLIGHT_WORDS_PATH.exists():
        return {}
    with open(SPOTLIGHT_WORDS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {k: v for k, v in data.items() if not k.startswith("_")}


def build_spotlight_pages(focus_graphemes: list, level: int,
                          story_spotlight_words: dict = None) -> list:
    """Build Sound Spotlight page data for each focus grapheme.

    Returns a list of dicts, one per spotlight page:
    [{
        "grapheme": "sh",
        "grapheme_display": "sh",
        "words": [
            {"word": "fish", "word_html": "fi<span>sh</span>", "photo": "data:..."},
            ...
        ]
    }, ...]
    """
    spotlight_data = load_spotlight_words_data()
    pages = []

    for grapheme in focus_graphemes:
        # Use story-specific words if provided, else fall back to JSON
        if story_spotlight_words and grapheme in story_spotlight_words:
            words = story_spotlight_words[grapheme][:4]
        elif grapheme in spotlight_data:
            available = spotlight_data[grapheme]["words"]
            # Filter to words decodable at this level
            decodable_level = spotlight_data[grapheme].get("decodable_at", 1)
            if decodable_level <= level:
                words = [w["word"] for w in available[:4]]
            else:
                words = [w["word"] for w in available[:4]]  # Use anyway, best effort
        else:
            continue  # Skip graphemes without spotlight data

        word_entries = []
        for word in words:
            # Look for photo
            safe_grapheme = grapheme.replace("-", "_")
            photo_path = PHOTOS_DIR / safe_grapheme / f"{word}.jpg"
            photo_uri = None
            if photo_path.exists():
                photo_uri = image_to_data_uri(photo_path)

            word_html = highlight_grapheme_in_word(word, grapheme)
            word_entries.append({
                "word": word,
                "word_html": word_html,
                "photo": photo_uri,
            })

        if word_entries:
            pages.append({
                "grapheme": grapheme,
                "grapheme_display": grapheme,
                "words": word_entries,
            })

    return pages


def compute_flex_pages(level: int, spotlight_count: int, is_print: bool = True) -> list:
    """Compute which flex pages fill the remaining slots to reach 24 pages.

    Returns a list of page type strings for the flex zone.
    """
    if level == 1 and is_print:
        # Ditty print template: Part A + Part B, 4 spotlight slots total (2 per part)
        # Flex handled by the ditty template directly
        return []

    # Standard template: 3 flex slots (pages 13-15)
    flex_zone_size = 3
    spotlights_in_flex = min(spotlight_count, flex_zone_size)
    fillers_needed = flex_zone_size - spotlights_in_flex

    filler_types = ["sentence_building", "word_sort", "rhyming_words"]
    return filler_types[:fillers_needed]


def _font_to_data_uri(font_path: Path) -> str:
    """Convert a TTF font file to a base64 data URI for embedding in HTML."""
    raw = font_path.read_bytes()
    b64 = base64.b64encode(raw).decode("ascii")
    return f"data:font/truetype;base64,{b64}"


def image_to_data_uri(image_path: Path, max_dimension: int = 1600,
                      jpeg_quality: int = 85) -> str:
    """Convert a PNG/JPG image to a base64 data URI for embedding in HTML.

    Re-encodes to JPEG q=85 at max 1600px on the longest side when the
    source file is larger than 2 MB.  Keeps the original encoding for
    smaller images.  This stops oversize source PNGs (30-60 MB per book)
    bloating the embedded HTML past Playwright's set_content threshold.
    """
    suffix = image_path.suffix.lower()
    mime_map = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
                ".webp": "image/webp", ".gif": "image/gif"}

    raw = image_path.read_bytes()
    if len(raw) > 2_000_000:
        try:
            from PIL import Image
            from io import BytesIO
            img = Image.open(BytesIO(raw))
            img = img.convert("RGB") if img.mode in ("RGBA", "P") else img
            img.thumbnail((max_dimension, max_dimension))
            buf = BytesIO()
            img.save(buf, format="JPEG", quality=jpeg_quality, optimize=True)
            raw = buf.getvalue()
            mime = "image/jpeg"
        except Exception:
            mime = mime_map.get(suffix, "image/png")
    else:
        mime = mime_map.get(suffix, "image/png")

    b64 = base64.b64encode(raw).decode("ascii")
    return f"data:{mime};base64,{b64}"


def build_extra_sound_rows(level: int, shifty_sounds: list, future_sounds: list,
                           exclude: tuple = ()):
    """Sound Detective activity rows for the Alien Words page at L4+
    (Lynden 2026-07-19 v2): up to two shifty/additional sounds, each with
    example words the child circles the grapheme in.  The future-sound
    PREVIEW now lives on the Sound Spotlight page instead — a grapheme in
    `exclude` (already previewed there) is skipped here."""
    if level < 4:
        return None
    from v2_helpers import SHIFTY_COLOUR, _load_shifty_data

    def _mark(word, g, colour):
        i = word.lower().find(g.lower())
        if i < 0:
            return None
        return (word[:i]
                + f'<span class="est-hit" style="color:{colour};">{word[i:i + len(g)]}</span>'
                + word[i + len(g):])

    rows = []

    for entry in shifty_sounds or []:
        g = entry["grapheme"].lstrip("-")
        examples = []
        data = _load_shifty_data()
        for card in data.get("new_spelling_cards", []):
            if card["grapheme"].lstrip("-") == g and card.get("sound") == entry["sound"]:
                examples = card.get("examples", [])
        for card in data.get("alt_pronunciation_cards", []):
            if card["grapheme"] == entry["grapheme"]:
                for pron in card.get("pronunciations", []):
                    if pron.get("sound") == entry["sound"]:
                        examples = pron.get("examples", [])
        words = [w for w in ([entry["example"]] + [e for e in examples if e != entry["example"]])
                 if g.lower() in w.lower()][:3]
        marked = [m for m in (_mark(w, g, SHIFTY_COLOUR) for w in words) if m]
        if len(marked) >= 2:
            rows.append({"kind": "shifty", "grapheme": entry["grapheme"],
                         "colour": SHIFTY_COLOUR,
                         "caption": f"says {entry['sound']} as in {entry['example']}",
                         "words": marked})

    spotlight_data = load_spotlight_words_data()
    for entry in future_sounds or []:
        g = entry["grapheme"]
        if g in exclude:
            continue
        pool = [w["word"] if isinstance(w, dict) else w
                for w in spotlight_data.get(g, {}).get("words", [])]
        words = [entry["example"]] + [w for w in pool if w != entry["example"]]
        words = [w for w in words if g.lower() in w.lower()][:3]
        marked = [m for m in (_mark(w, g, entry["colour"]) for w in words) if m]
        if len(marked) >= 3:
            rows.append({"kind": "future", "grapheme": g, "colour": entry["colour"],
                         "caption": f"in {entry['example']} — coming at Level {entry['level']}",
                         "words": marked})

    return rows[:2] or None


def build_grow_code_chart():
    """The FIXED Grow the Code sound chart (Lynden's curated content, from
    data/grow_code_chart.json — the SVG he refined 2026-07-20).  Little
    Wandle style, portrait: one narrow COLUMN per sound family, spellings
    stacked in bordered cells (chart lines visible), no example words, no
    colours.  Split into THREE stacked tables so A5 columns stay readable:
    Consonants, then vowels in two halves.  Identical in every book."""
    import json
    chart = json.load(open(BASE_DIR / "data" / "grow_code_chart.json",
                           encoding="utf-8"))

    def _col(fam):
        return {
            "head": fam["head"],
            "cue": fam.get("cue", ""),
            "cells": [{"g": g, "long": len(g) >= 4} for g in fam["spellings"]],
        }

    cons = [_col(f) for f in chart["consonants"]]
    vows = [_col(f) for f in chart["vowels"]]
    half = (len(vows) + 1) // 2
    return [
        {"label": "Consonant sounds", "columns": cons},
        {"label": "Vowel sounds", "columns": vows[:half]},
        {"label": "Vowel sounds (continued)", "columns": vows[half:]},
    ]


def _qr_data_uri(url: str, box_size: int = 8) -> str:
    import qrcode
    from io import BytesIO
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M,
                       box_size=box_size, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    buf = BytesIO()
    qr.make_image(fill_color="#1a1a1a", back_color="white").save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def library_qr_data_uri(level: int) -> str:
    """QR to the online library for the back-cover footer, as a data URI.
    Tagged per level (src=book_L{n}) so scans are attributable, matching the
    marketing booklets' ?src= convention."""
    return _qr_data_uri(f"https://myphonicsbooks.co.uk/library?src=book_L{level}")


def get_guide_content(level: int) -> dict:
    """Return level-appropriate parent guide tips."""
    before = [
        "Look at the cover together. Read the title aloud.",
        "Point to the sounds at the top. Practise saying each one.",
        "Ask your child what they think the story might be about.",
        "Read through the Story Words and Tricky Words on page 3.",
    ]
    during = [
        "Let your child point to each word as they read.",
        "If they get stuck, help them sound out the letters one at a time.",
        "Praise them for trying, even if they need help.",
        "Ask them to look at the pictures for clues.",
        "Re-read pages if your child wants to — repetition builds fluency.",
    ]
    after = [
        "Talk about what happened in the story.",
        "Ask your child which part was their favourite.",
        "Try the questions and writing activities at the back.",
        "Read the book again another day — familiar stories build confidence.",
    ]
    return {"guide_before": before, "guide_during": during, "guide_after": after}


def build_book_data_from_story(story_dict: dict, child_name: str,
                                friend_name: str, image_dir: Path = None,
                                page_count: int = None,
                                edition: str = "home",
                                book_id: str = None) -> dict:
    """Build a complete book_data dict from a pilot/all_stories entry.

    Args:
        story_dict: A story entry from PILOT_STORIES or ALL_STORIES.
        child_name: Child's name (replaces CHILD_NAME placeholder).
        friend_name: Friend's name (replaces FRIEND_NAME placeholder).
        image_dir: Optional path to directory containing cover.png, page1.png, etc.
                   Images are embedded as base64 data URIs.
    """
    level = story_dict["level"]

    # Load phonics data
    graphemes_path = BASE_DIR / "data" / "graphemes_by_level.json"
    tricky_path = BASE_DIR / "data" / "tricky_words_by_level.json"

    with open(graphemes_path, "r", encoding="utf-8") as f:
        graphemes_data = json.load(f)
    with open(tricky_path, "r", encoding="utf-8") as f:
        tricky_data = json.load(f)

    # Level-specific graphemes (for display on phonics grid — NOT cumulative)
    key = f"level_{level}"
    level_entry = graphemes_data.get(key, {})
    all_graphemes = level_entry.get("graphemes", [])

    # Cumulative tricky words (children should know all tricky words up to this level)
    tricky_entry = tricky_data.get(key, {})
    tricky_words = tricky_entry.get("cumulative", [])
    # Newly-introduced tricky words for THIS level only — these are the ones
    # that genuinely deserve a spelling-practice treatment (Look-Cover-Write-
    # Check).  Words from earlier levels (e.g. "the", "said") should already
    # be in long-term memory and don't need re-testing.
    tricky_words_new = tricky_entry.get("new_tricky_words", [])

    # Tricky words to FLAG on page 3 ("tell your child these straight away"):
    # detected AUTOMATICALLY by scanning the story text against the master
    # tricky-word list (all levels), so hand-omissions in a story dict ("is",
    # "a", "have") can never slip through.  A word is shown when it is new at
    # this level, review from the IMMEDIATELY PREVIOUS level (mirrors the
    # page-2 sound-chart window), or ahead of schedule (listed at a later
    # level).  Words two or more levels old ("the" in a Level 6 book) are
    # assumed mastered and stay hidden.  The story dict's tricky_words_used
    # still rides along for book-specific tricky words ("bush", "with") that
    # no level list carries.
    _master_tricky = {}  # lower-case word -> (level introduced, canonical casing)
    for _lv in range(1, 9):
        for _w in tricky_data.get(f"level_{_lv}", {}).get("new_tricky_words", []):
            _master_tricky.setdefault(_w.lower(), (_lv, _w))
    _story_text = " ".join(p["text"] for p in story_dict["story_pages"])
    tricky_words_display = []
    for _tok in re.findall(r"[A-Za-z']+", _story_text):
        _hit = _master_tricky.get(_tok.lower())
        if _hit and _hit[0] >= level - 1 and _hit[1] not in tricky_words_display:
            tricky_words_display.append(_hit[1])
    _mastered = {
        w.lower()
        for _lv in range(1, level - 1)
        for w in tricky_data.get(f"level_{_lv}", {}).get("new_tricky_words", [])
    }
    _shown = {w.lower() for w in tricky_words_display}
    for _w in story_dict.get("tricky_words_used", []):
        if _w.lower() not in _mastered and _w.lower() not in _shown:
            tricky_words_display.append(_w)
            _shown.add(_w.lower())
    # A word the Watch Out box already sounds out (corniche, neighbourhood)
    # must not ALSO appear in the Tricky Words strip on the same page — the
    # box's part-by-part guidance supersedes the flat sight-word treatment.
    _pron_covered = set()
    for _note in story_dict.get("pronunciation_notes", []):
        for _ex in _note.get("examples", []):
            _pron_covered.add(_ex.split("→")[0].strip().lower())
    tricky_words_display = [
        w for w in tricky_words_display if w.lower() not in _pron_covered
    ]

    # GRADUATION FILTER (Lynden 2026-07-13, "Near the Door" catch): a word is
    # never shown as tricky in a book whose taught window already HONESTLY
    # decodes it.  door/floor sit at L7 on the master list, but the L7.2
    # book itself teaches oor — showing them as tricky in that very book
    # (while they're ALSO sound-buttoned Story Words on the same page) is a
    # contradiction.  Same filter kills authored slips like "saw" listed
    # tricky at L7 (aw is taught at L5).  Uses the HONEST predicate from
    # audit_tricky_words (curated irregulars like "was" letter-parse but
    # never graduate).  Belt-and-braces: anything in this book's own
    # story_words / read_words is decodable-by-declaration and never tricky.
    from v2_helpers import taught_graphemes as _tw
    from audit_tricky_words import has_graduated as _grad
    _win = _tw(graphemes_data, level, story_dict.get("focus_graphemes", []))
    _declared_decodable = {str(w).lower() for w in story_dict.get("story_words", [])} \
        | {str(w).lower() for w in story_dict.get("read_words", [])}
    tricky_words_display = [
        w for w in tricky_words_display
        if w.lower() not in _declared_decodable and not _grad(w, _win)
    ]

    # Cover sounds — first 8
    cover_sounds = all_graphemes[:8] if len(all_graphemes) >= 8 else all_graphemes

    # Process story pages — swap names and embed images.
    # When child_name / friend_name are not provided (pilot/universal mode),
    # only the explicit placeholder tokens (CHILD_NAME / FRIEND_NAME) are
    # blanked.  Hard-coded character names like "Emma" or "Mia" are kept
    # in place so stories that genuinely use them remain readable.
    story_pages = []
    for i, page in enumerate(story_dict["story_pages"]):
        text = page["text"]
        if child_name:
            text = text.replace("CHILD_NAME", child_name).replace("Emma", child_name)
        else:
            text = text.replace("CHILD_NAME", "")
        if friend_name:
            text = text.replace("FRIEND_NAME", friend_name).replace("Mia", friend_name)
        else:
            text = text.replace("FRIEND_NAME", "")
        img = None
        if image_dir:
            img_path = image_dir / f"page{i+1}.png"
            if img_path.exists():
                img = image_to_data_uri(img_path)
        story_pages.append({"text": text, "image": img})

    # Cover image
    cover_img = None
    cover_bg = ""
    if image_dir:
        cover_path = image_dir / "cover.png"
        if cover_path.exists():
            cover_img = image_to_data_uri(cover_path)
            cover_bg = cover_img  # Use same image as background

    # Process questions — swap names (same logic as story pages)
    questions = []
    for q in story_dict.get("questions", []):
        text = q["text"]
        if child_name:
            text = text.replace("CHILD_NAME", child_name).replace("Emma", child_name)
        else:
            text = text.replace("CHILD_NAME", "")
        questions.append({**q, "text": text})

    guide = get_guide_content(level)

    book_data = {
        "level": level,
        "level_name": LEVEL_NAMES[level],
        "level_colour": LEVEL_COLOURS[level],
        "child_name": child_name,
        "friend_name": friend_name,
        "book_title": story_dict["book_title"],
        "story_font_size": STORY_FONT_SIZES[level],
        "age_range": LEVEL_AGE_RANGES[level],
        "year_group": LEVEL_YEAR_GROUPS[level],
        "series_levels": build_journey_levels(),
        "library_qr": library_qr_data_uri(level),
        "edition": edition,
        "cover_image": cover_img,
        "cover_background_image": cover_bg,
        "cover_sounds": cover_sounds,
        "focus_graphemes": story_dict.get("focus_graphemes", []),
        "all_graphemes": all_graphemes,
        **guide,
        "story_pages": story_pages,
        "story_words": story_dict.get("story_words", []),
        "read_words": story_dict.get("read_words", []),
        "tricky_words": tricky_words_display,
        "tricky_words_new": tricky_words_new,
        "nonsense_words": story_dict.get("nonsense_words", []),
        "questions": questions,
        "writing_graphemes": story_dict.get("writing_graphemes", []),
        "writing_words": story_dict.get("writing_words", []),
        "writing_starters": story_dict.get("writing_starters", []),
        "sound_spotlight_pages": build_spotlight_pages(
            story_dict.get("focus_graphemes", []),
            level,
            story_dict.get("spotlight_words", None),
        ),
        "comprehension_questions": questions,
        "flex_pages": compute_flex_pages(
            level,
            len(story_dict.get("focus_graphemes", [])),
        ),
        "nonsense_words_challenge": story_dict.get(
            "nonsense_words_challenge",
            story_dict.get("nonsense_words", [])
        ),
        "notes_next_steps": story_dict.get("notes_next_steps", [
            "Try reading the story again — repetition builds fluency and confidence.",
            "Look for the focus sounds in other books, signs, and labels around you.",
            "Encourage your child to write words using the sounds they have learnt.",
            "When your child is confident, move to the next book in the series.",
        ]),
    }

    # ─── v2 fields (ignored by the legacy templates) ─────────────
    from v2_helpers import (
        build_sound_buttoned_words, build_formation_drills,
        build_ordering_items, get_phase_label, get_page_count,
        pick_dictation_sentence, build_match_to_picture,
        build_initial_sounds, build_guide_blend_example,
        build_special_friend_match,
    )

    cumulative = []
    for lv in range(1, level + 1):
        lv_entry = graphemes_data.get(f"level_{lv}", {})
        cumulative.extend(lv_entry.get("graphemes", []))

    # Sound chart for page 2 (RWI speed-sound style): a relevant warm-up read,
    # NOT the child's entire history.  We show the IMMEDIATELY PREVIOUS level in
    # full plus this level's graphemes up to this book's furthest focus sound.
    # A Level 6 child reviews Level 5 + Level 6 sounds — never Set 1 (satpin),
    # which is long mastered and just wastes the page.  Level 1 has no previous
    # level, so it shows all of Level 1 so far (the alphabet read-through).
    _focus = story_dict.get("focus_graphemes", [])
    _prev_levels = (
        graphemes_data.get(f"level_{level - 1}", {}).get("graphemes", [])
        if level > 1 else []
    )
    _cur_order = graphemes_data.get(f"level_{level}", {}).get("graphemes", [])
    _last_idx = -1
    for g in _focus:
        if g in _cur_order:
            _last_idx = max(_last_idx, _cur_order.index(g))
    _cur_upto = _cur_order[: _last_idx + 1] if _last_idx >= 0 else list(_focus)
    book_data["chart_graphemes"] = _prev_levels + _cur_upto

    # Shifty Sounds band (L4+ only): GPCs the main ladder doesn't teach that
    # this story actually uses.  Displayed in charcoal under the sound tables
    # so the grown-up pre-teaches them before reading.
    from v2_helpers import build_shifty_sounds, SHIFTY_COLOUR
    _shifty_tokens = (
        [t.lower() for t in re.findall(r"[A-Za-z']+", _story_text)]
        + [w.lower() for w in story_dict.get("story_words", [])]
    )
    book_data["shifty_sounds"] = build_shifty_sounds(_shifty_tokens, level, cumulative)
    book_data["shifty_colour"] = SHIFTY_COLOUR

    # Future Sounds band (all levels): main-ladder graphemes this story's
    # words use before they're formally taught — e.g. "mud" needing 'u' in
    # a book that only teaches m/d/g/o so far.  Rather than rewriting the
    # story, each one is previewed here, coloured to the level that
    # genuinely teaches it, so the child/parent sees it's coming rather
    # than the book silently using an undecodable sound.  Uses the exact
    # same taught-window + segmentation logic as audit_decodability.py.
    from v2_helpers import build_future_sounds, taught_graphemes, all_known_units
    _book_taught = taught_graphemes(graphemes_data, level, _focus)
    _known_units = all_known_units(graphemes_data)
    _future_skip_tricky = set(_master_tricky.keys()) | {
        w.lower() for w in story_dict.get("tricky_words_used", [])
    }
    book_data["future_sounds"] = build_future_sounds(
        _shifty_tokens, level, _book_taught, _known_units, graphemes_data,
        LEVEL_COLOURS, tricky_words=_future_skip_tricky,
    )

    # Future Sound preview row — joins the Sound Spotlight page at L4+
    # (Lynden 2026-07-19: "future sounds spotlight should be with the
    # sound spotlight").  First future sound with 3+ photo cards wins.
    book_data["future_spotlight_row"] = None
    if level >= 4:
        for _f in book_data["future_sounds"]:
            _rows = build_spotlight_pages([_f["grapheme"]], level, None)
            if _rows and sum(1 for w in _rows[0]["words"] if w.get("photo")) >= 3:
                book_data["future_spotlight_row"] = {
                    **_rows[0], "colour": _f["colour"], "level_at": _f["level"],
                }
                break

    # Sound Detective — Alien Words page bottom half at L4+ (shifty
    # sounds first — soft c fires on "rice"-type story hits — then future
    # sounds not already previewed on the Sound Spotlight page).
    _exclude = ((book_data["future_spotlight_row"] or {}).get("grapheme"),)
    book_data["extra_sound_task"] = (
        build_extra_sound_rows(level, book_data["shifty_sounds"],
                               book_data["future_sounds"], exclude=_exclude)
        or build_extra_sound_rows(level, book_data["shifty_sounds"],
                                  book_data["future_sounds"])
    )

    # Grow the Code chart — a whole page at L4-L6, replacing the
    # Listen-and-Write spelling test.  FIXED sound chart, identical in
    # every book, curated in data/grow_code_chart.json.
    book_data["grow_code_chart"] = build_grow_code_chart()

    # Library-edition onboarding page (2026-07-20): "Is this the right
    # level?" sample boxes drawn from THIS book's own content, plus the
    # worksheet + assessment QRs.  Only used when edition == 'library'.
    _bid = book_id or f"{level}.{story_dict.get('sub_level', '')}".rstrip(".")
    book_data["book_id"] = _bid
    book_data["worksheet_qr"] = _qr_data_uri(
        f"https://myphonicsbooks.co.uk/library?book={_bid}")
    book_data["assessment_qr"] = _qr_data_uri(
        f"https://myphonicsbooks.co.uk/assessment?src=book_L{level}")
    # Library "Check, match, read" marketing page (replaces the Reading Star
    # celebration filler — Lynden 2026-07-20 "that's just a waste").  Reuses
    # the marketing booklet's how-it-works content + app screenshots.
    if edition == "library":
        _mock = BASE_DIR.parent / "marketing" / "leaflet" / "assets"
        def _mock_uri(name):
            p = _mock / name
            return image_to_data_uri(p) if p.exists() else None
        book_data["mkt_phone"] = _mock_uri("mock_phone_trim.png")
        book_data["mkt_laptop"] = _mock_uri("mock_laptop_trim.png")
        book_data["mkt_tablet"] = _mock_uri("mock_tablet_trim.png")

    # "Is this the right level?" — a LEVEL check, not a book check (Lynden
    # 2026-07-21): show ALL the sounds this LEVEL teaches, level words, level
    # alien words and level tricky words.  Sounds only, no paired example.
    _lvl_sounds = graphemes_data.get(f"level_{level}", {}).get("graphemes", [])
    _lvl_tricky = tricky_data.get(f"level_{level}", {}).get("new_tricky_words", [])
    _lvl_words = []
    try:
        _gw = json.load(open(BASE_DIR / "output" / "worksheet_plan"
                             / "green_words.json", encoding="utf-8"))
        _lvl_words = [w["word"] for w in _gw.get("words", [])
                      if w.get("level") == level]
    except Exception:
        _lvl_words = []
    # readable words: shortest first (clearest for a quick level check)
    _lvl_words = sorted(set(_lvl_words), key=lambda w: (len(w), w))[:8]
    book_data["right_level_boxes"] = [
        {"n": 1, "title": "Say all these sounds", "items": _lvl_sounds},
        {"n": 2, "title": "Read these words",
         "items": _lvl_words or (story_dict.get("read_words")
                                 or story_dict.get("story_words", []))[:8]},
        {"n": 3, "title": "Sound out these alien words", "made_up": True,
         "items": story_dict.get("nonsense_words", [])},
        {"n": 4, "title": "Know these tricky words on sight",
         "items": _lvl_tricky[:8]},
    ]

    button_source = (
        story_dict.get("story_words")
        or story_dict.get("read_words")
        or []
    )
    ordering_count = 4 if level <= 3 else 6

    book_data["page_count"] = get_page_count(level, page_count)
    book_data["phase_label"] = get_phase_label(level)
    # Sound buttons also recognise this book's Future Sounds units, so a
    # previewed digraph gets its one line/arc ("mess" = m-e-ss, not
    # m-e-s-s) instead of dissolving into per-letter dots (Lynden
    # 2026-07-15: ss is ONE sound).
    _future_button_units = [
        s["grapheme"] for s in book_data["future_sounds"]
        if s["grapheme"] not in cumulative
    ]
    book_data["sound_buttoned_words"] = build_sound_buttoned_words(
        button_source, cumulative + _future_button_units,
    )
    book_data["formation_drills"] = build_formation_drills(
        story_dict.get("focus_graphemes", []),
    )
    book_data["ordering_items"] = build_ordering_items(
        story_pages, count=ordering_count,
    )
    book_data["ordering_image_count"] = ordering_count
    # Special-friend match — fills the bottom half of the Tell-the-Story page
    # on 16pp digraph books (Level 3), where there is no retell scaffold.
    # Returns None for single-letter focus books (L1/L2) so the grid just
    # absorbs the whole page as before.
    book_data["special_friend_match"] = build_special_friend_match(
        story_dict.get("focus_graphemes", []),
        story_dict.get("story_words", []),
    )
    book_data["dictation_sentence"] = pick_dictation_sentence(story_pages)
    book_data["guide_blend_example"] = build_guide_blend_example(
        book_data["sound_buttoned_words"]
    )
    book_data["pronunciation_notes"] = story_dict.get("pronunciation_notes", [])
    book_data["vocab_word"] = story_dict.get("vocab_word")
    # Grammar Spotlight — per-book mini-task on the Word Workshop page.
    # Per-story override wins; otherwise look up by sub-level.
    data_dir = str(BASE_DIR / "data")
    if data_dir not in sys.path:
        sys.path.insert(0, data_dir)
    try:
        from grammar_spotlights import get_grammar_spotlight  # noqa: WPS433
        gs_entry = get_grammar_spotlight(
            level=level,
            sub_level=story_dict.get("sub_level"),
            override=story_dict.get("grammar_spotlight"),
        )
        # Resolve any image_word / image_grapheme references in spotlight
        # items into embedded data URIs (so the rendered HTML is self-
        # contained when Playwright loads it).
        if gs_entry and gs_entry.get("spotlight"):
            for item in gs_entry["spotlight"].get("items", []):
                word = item.get("image_word")
                grapheme = item.get("image_grapheme")
                if word and grapheme and "image" not in item:
                    safe = grapheme.replace("-", "_")
                    candidate = PHOTOS_DIR / safe / f"{word}.jpg"
                    if candidate.exists():
                        item["image"] = image_to_data_uri(candidate)
        book_data["grammar_spotlight"] = gs_entry
    except Exception as exc:  # any failure → no spotlight, surface via stderr
        print(f"  [grammar_spotlight] skipped: {type(exc).__name__}: {exc}",
              file=sys.stderr)
        book_data["grammar_spotlight"] = story_dict.get("grammar_spotlight")
    # Alien Words bottom-half activity — level-appropriate
    spotlight_pgs = book_data.get("sound_spotlight_pages", [])
    book_data["match_to_picture"] = build_match_to_picture(spotlight_pgs)
    book_data["initial_sounds"] = build_initial_sounds(
        story_dict.get("focus_graphemes", []), spotlight_pgs,
        cumulative_graphemes=cumulative,
    )
    # Use the dedicated nonsense_words_challenge list when present
    book_data["nonsense_words"] = story_dict.get(
        "nonsense_words_challenge",
        story_dict.get("nonsense_words", []),
    )

    return book_data


def get_template_name(level: int, use_v2: bool = False) -> str:
    """Return the appropriate template based on level.

    v2 (use_v2=True) → book_v2.html — the modular 16/20pp redesign.
    Level 1 (legacy)  → book_ditty.html — 12-page ditty format.
    Levels 2-6 (legacy) → book.html — 24-page standard format.
    """
    if use_v2:
        return "book_v2.html"
    if level == 1:
        return "book_ditty.html"
    return "book.html"


def render_book_html(book_data: dict) -> str:
    """Render the book HTML from Jinja2 template with provided data."""
    env = Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=False,
    )

    # Sound Books use their own simple template (cover / sound / words / read-all / back).
    if book_data.get("book_type") == "sound_book":
        template_name = "sound_book.html"
    else:
        # v2 template kicks in when page_count is set (16/20/24).
        use_v2 = book_data.get("page_count") in (16, 20, 24)
        template_name = get_template_name(book_data.get("level", 1), use_v2=use_v2)
    template = env.get_template(template_name)

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
    """Convert HTML string to PDF using configured backend.

    Uses the PDF_BACKEND environment variable to select backend:
    - 'playwright' (default): Local Chromium rendering
    - 'docraptor': Cloud-based Prince XML rendering

    Set PDF_BACKEND=docraptor and DOCRAPTOR_API_KEY for cloud rendering.
    """
    from core.pdf_generator import get_pdf_generator

    generator = get_pdf_generator()
    return await generator.generate(html_content, output_path)


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
        "tricky_words_new": [],
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
