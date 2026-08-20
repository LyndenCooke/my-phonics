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
try:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
except OSError:
    # Read-only filesystem (Vercel's Python runtime, /var/task) — only the
    # local CLI path (generate_pilot_books.py etc.) ever writes here; the
    # serverless renderer (api/render-book-html.py) only needs
    # render_book_html/build_book_data_from_story from this module, which
    # never touch OUTPUT_DIR. This was a hard import-time crash in
    # production until fixed (2026-08-10) — the mkdir ran as a side effect
    # of just importing the module.
    pass


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


# How many spotlight words a grapheme may contribute.  The template decides
# how many it actually shows (6 for a two-sound book, 3 when the sounds have
# to share the page), so this only has to be the ceiling — it was 4, which
# silently threw away the 4th word and photo that every pool already has.
SPOTLIGHT_MAX_WORDS = 6


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
            words = story_spotlight_words[grapheme][:SPOTLIGHT_MAX_WORDS]
        elif grapheme in spotlight_data:
            available = spotlight_data[grapheme]["words"]
            # Filter to words decodable at this level
            decodable_level = spotlight_data[grapheme].get("decodable_at", 1)
            if decodable_level <= level:
                words = [w["word"] for w in available[:SPOTLIGHT_MAX_WORDS]]
            else:
                words = [w["word"] for w in available[:SPOTLIGHT_MAX_WORDS]]  # best effort
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

    Re-encodes to JPEG q=85 at max 1600px on the longest side and keeps
    WHICHEVER ENCODING IS SMALLER.

    This used to trigger only when the source file exceeded 2 MB, which made
    the compression a cliff rather than a floor: a book whose art happened to
    sit just UNDER the threshold embedded every page as raw PNG and came out
    far heavier than one with bigger source files.  Caught 2026-07-28 on L7.4 —
    its regenerated art was SMALLER than the old art (15.5 MB vs 22.6 MB across
    9 images) yet the PDF tripled, 11.9 MB -> 37 MB, purely because ~1.7 MB
    pages no longer qualified for re-encoding.  Comparing both encodings can
    never inflate a file, so there is no threshold to get wrong.

    Images WITH transparency are left alone — the marketing mock-ups
    (mock_phone_trim.png etc.) rely on their alpha channel, and flattening
    them to RGB would paint the cut-out corners black.
    """
    suffix = image_path.suffix.lower()
    mime_map = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
                ".webp": "image/webp", ".gif": "image/gif"}

    raw = image_path.read_bytes()
    mime = mime_map.get(suffix, "image/png")
    # Skip the work for genuinely small assets (QR codes, icons).
    if len(raw) > 200_000:
        try:
            from PIL import Image
            from io import BytesIO
            img = Image.open(BytesIO(raw))
            has_alpha = (img.mode in ("RGBA", "LA")
                         or (img.mode == "P" and "transparency" in img.info))
            # An alpha CHANNEL is not the same as transparency: lots of story
            # art comes back RGBA but fully opaque, and skipping those left
            # 4.3 at 45 MB and 4.4 at 24 MB after the 2026-07-28 fix.  Only a
            # genuinely see-through pixel (a real cut-out) blocks the JPEG.
            if has_alpha:
                alpha = img.convert("RGBA").getchannel("A")
                has_alpha = alpha.getextrema()[0] < 255
            if not has_alpha:
                img = img.convert("RGB") if img.mode != "RGB" else img
                img.thumbnail((max_dimension, max_dimension))
                buf = BytesIO()
                img.save(buf, format="JPEG", quality=jpeg_quality, optimize=True)
                if buf.tell() < len(raw):
                    raw = buf.getvalue()
                    mime = "image/jpeg"
        except Exception:
            pass

    b64 = base64.b64encode(raw).decode("ascii")
    return f"data:{mime};base64,{b64}"


def sound_detective_key(row: dict) -> str:
    """Fleet-unique identity of a Sound Detective row: GRAPHEME + SOUND, not
    the caption.  "u says /oo/ short as in put" and "...as in full" are the
    same activity to a child, so they must collide; u=/oo/ and u=/u/ are two
    different activities, so they must not."""
    return f"{row['kind']}|{row['grapheme']}|{row.get('sound', '')}"


def build_extra_sound_rows(level: int, shifty_sounds: list, future_sounds: list,
                           exclude: tuple = (), claimed: set = (),
                           limit: int | None = 2):
    """Sound Detective activity rows for the Alien Words page at L4+
    (Lynden 2026-07-19 v2): up to two shifty/additional sounds, each with
    example words the child circles the grapheme in.  The future-sound
    PREVIEW now lives on the Sound Spotlight page instead — a grapheme in
    `exclude` (already previewed there) is skipped here.

    `claimed` holds `sound_detective_key`s already used by ANOTHER book —
    no child should meet the same Sound Detective twice across the fleet
    (Lynden 2026-07-29: 8.1 and 7.4 both ran u=/oo/ short).  `limit=None`
    returns the full candidate list, which is how the claims ledger is
    built (scripts/build_sound_detective_claims.py)."""
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
                         "sound": entry["sound"], "colour": SHIFTY_COLOUR,
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
                         "sound": f"L{entry['level']}",
                         "caption": f"in {entry['example']} — coming at Level {entry['level']}",
                         "words": marked})

    if claimed:
        rows = [r for r in rows if sound_detective_key(r) not in claimed]
    return (rows if limit is None else rows[:limit]) or None


def build_ledger_sound_rows(level: int, taught: set = ()):
    """Sound Detective FALLBACK pool: level-appropriate Shifty Sounds straight
    from the ledger, whether or not this book's story happens to use them.

    Needed because no two books may run the same Sound Detective (Lynden
    2026-07-29) and the in-story pool cannot cover the fleet — `oo`, `c` and
    `u` turn up in nearly every story, so only ~14 distinct sounds exist
    across 19 books for ~38 slots.  A book always prefers its OWN sounds
    (build_extra_sound_rows); this fills the gap when an earlier book has
    already claimed them.

    Same gates as build_shifty_sounds: `allowed_from_level` <= level, nothing
    in SHIFTY_EXCLUDE, and no grapheme already taught on the main ladder.
    Deterministic order (level, then grapheme) so the claims ledger is
    reproducible."""
    if level < 4:
        return []
    from v2_helpers import SHIFTY_COLOUR, SHIFTY_EXCLUDE, _load_shifty_data

    def _mark(word, g):
        i = word.lower().find(g.lower())
        if i < 0:
            return None
        return (word[:i]
                + f'<span class="est-hit" style="color:{SHIFTY_COLOUR};">'
                + word[i:i + len(g)] + "</span>"
                + word[i + len(g):])

    data = _load_shifty_data()
    taught = set(taught)
    out = []
    for card in data.get("new_spelling_cards", []):
        g = card["grapheme"].lstrip("-")
        from_lv = card.get("allowed_from_level", 99)
        if from_lv > level or g in taught or (g, card["sound"]) in SHIFTY_EXCLUDE:
            continue
        out.append((from_lv, g, card["grapheme"], card["sound"],
                    card.get("examples", [])))
    for card in data.get("alt_pronunciation_cards", []):
        g = card["grapheme"]
        # First pronunciation is the main-ladder sound — not a shifty one.
        for pron in card.get("pronunciations", [])[1:]:
            from_lv = pron.get("allowed_from_level", 99)
            if from_lv > level or (g, pron["sound"]) in SHIFTY_EXCLUDE:
                continue
            out.append((from_lv, g, g, pron["sound"], pron.get("examples", [])))

    rows = []
    for from_lv, g, display_g, sound, examples in sorted(out, key=lambda r: (r[0], r[1], r[3])):
        words = [w for w in examples if g.lower() in w.lower()][:3]
        marked = [m for m in (_mark(w, g) for w in words) if m]
        if len(marked) < 3:
            continue          # a 3-word row keeps the activity worth doing
        rows.append({"kind": "shifty", "grapheme": display_g, "sound": sound,
                     "colour": SHIFTY_COLOUR,
                     "caption": f"says {sound} as in {words[0]}",
                     "words": marked})
    return rows


def sound_detective_candidates(level: int, shifty_sounds: list, future_sounds: list,
                               exclude: tuple = (), taught: set = ()):
    """Every Sound Detective row this book could run, best first: its own
    story's sounds, then the level-appropriate ledger fallback."""
    own = build_extra_sound_rows(level, shifty_sounds, future_sounds,
                                 exclude=exclude, limit=None) or []
    for r in own:
        r["source"] = "own"
    seen = {sound_detective_key(r) for r in own}
    ledger = [r for r in build_ledger_sound_rows(level, taught)
              if sound_detective_key(r) not in seen]
    for r in ledger:
        r["source"] = "ledger"
    seen |= {sound_detective_key(r) for r in ledger}
    # Last resort: the book's own sounds MINUS the exclusion, i.e. the one
    # already previewed on the Sound Spotlight page.  Repeating it on the
    # Alien Words page is weaker than a fresh sound, but it beats an empty
    # activity — and listing it here keeps it inside the claims ledger, so
    # the uniqueness gate covers it (4.6 was quietly using this via the old
    # fallback path).
    repeat = [r for r in (build_extra_sound_rows(level, shifty_sounds,
                                                 future_sounds, limit=None) or [])
              if sound_detective_key(r) not in seen]
    for r in repeat:
        r["source"] = "spotlight-repeat"
    return own + ledger + repeat


_sd_claims_cache = None


def load_sound_detective_claims() -> dict:
    """book_id -> [sound_detective_key, ...], the fleet-wide allocation built
    by scripts/build_sound_detective_claims.py.  Missing file = no allocation,
    and every book falls back to its own first two candidates."""
    global _sd_claims_cache
    if _sd_claims_cache is None:
        path = BASE_DIR / "data" / "sound_detective_claims.json"
        try:
            with open(path, "r", encoding="utf-8") as f:
                _sd_claims_cache = json.load(f).get("claims", {})
        except FileNotFoundError:
            _sd_claims_cache = {}
    return _sd_claims_cache


def build_grow_code_chart(level: int | None = None):
    """The FIXED Grow the Code sound chart (Lynden's curated content, from
    data/grow_code_chart.json — the SVG he refined 2026-07-20).  Little
    Wandle style, portrait: one narrow COLUMN per sound family, spellings
    stacked in bordered cells (chart lines visible), no example words, no
    colours.  Split into THREE stacked tables so A5 columns stay readable:
    Consonants, then vowels in two halves.  Identical in every book."""
    import json
    chart = json.load(open(BASE_DIR / "data" / "grow_code_chart.json",
                           encoding="utf-8"))

    # LOCKED CELLS (Lynden 2026-08-21): the chart printed the entire future
    # code (kn, mb, wr, dge, eigh, augh...) as though it were all taught, so
    # "watch the code grow" was a spoiler, not a promise. Taught-ness is
    # derived from the ledger itself - a spelling first taught above this
    # level, or never taught in the 8-level scheme, renders faded. No new
    # data file: graphemes_by_level.json stays the only source of truth.
    _first_taught = {}
    try:
        _gbl = json.load(open(BASE_DIR / "data" / "graphemes_by_level.json",
                              encoding="utf-8"))
        for _lv in range(1, 9):
            for _g in _gbl.get(f"level_{_lv}", {}).get("graphemes", []):
                _first_taught.setdefault(_g, _lv)
    except Exception:
        _first_taught = {}

    def _locked(g):
        if level is None or not _first_taught:
            return False
        return _first_taught.get(g, 99) > int(level)

    def _col(fam):
        return {
            "head": fam["head"],
            "cue": fam.get("cue", ""),
            "cells": [{"g": g, "long": len(g) >= 4, "locked": _locked(g)}
                      for g in fam["spellings"]],
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

    The URL comes from data/print_qr_registry.json, NOT from an f-string here.
    This used to encode /library?src=book_L{n} directly, which welded every
    printed copy to today's routing — rename the route and every book in the
    field dies with no way to reissue the code.  See scripts/print_qr.py.
    Per-level ?src= attribution was dropped for the same reason: a printed
    code has to survive longer than an analytics convention."""
    from print_qr import library_url
    return _qr_data_uri(library_url())


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
                                book_id: str = None,
                                full_level_window: bool = False) -> dict:
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
    # THIS level or ahead of schedule (listed at a later level, so genuinely
    # not yet decodable — e.g. "kind" in a Level 6 story).  Anything from ANY
    # earlier level ("said"/"so" at L5 in a Level 6 book) is assumed already
    # learned and stays hidden (Lynden 2026-07-22: don't re-flag mastered
    # sight words the child has known for a level or more).  The story dict's
    # tricky_words_used still rides along for book-specific tricky words
    # ("bush", "with") that no level list carries.
    _master_tricky = {}  # lower-case word -> (level introduced, canonical casing)
    for _lv in range(1, 9):
        for _w in tricky_data.get(f"level_{_lv}", {}).get("new_tricky_words", []):
            _master_tricky.setdefault(_w.lower(), (_lv, _w))
    # AHEAD-OF-SCHEDULE CUTOFF AT L7 (Lynden 2026-07-26 on 7.2: "a lot of the
    # tricky words have be done so many times.  not needed to be highlighted
    # anymore they should already know them").  Below L7, a word listed at a
    # LATER level still gets flagged — it genuinely isn't decodable yet.  From
    # L7 the child is a fluent reader meeting these words constantly in real
    # books, so only words introduced at THIS level are worth pre-teaching;
    # "again"/"water" (L8) were being flagged as new on a Level 7 page.
    _ahead_ok = level < 7
    _story_text = " ".join(p["text"] for p in story_dict["story_pages"])
    tricky_words_display = []
    for _tok in re.findall(r"[A-Za-z']+", _story_text):
        _hit = _master_tricky.get(_tok.lower())
        _in_window = _hit and (_hit[0] == level or (_ahead_ok and _hit[0] > level))
        if _in_window and _hit[1] not in tricky_words_display:
            tricky_words_display.append(_hit[1])
    _mastered = {
        w.lower()
        for _lv in range(1, level)
        for w in tricky_data.get(f"level_{_lv}", {}).get("new_tricky_words", [])
    }
    _shown = {w.lower() for w in tricky_words_display}
    for _w in story_dict.get("tricky_words_used", []):
        if _w.lower() in _mastered or _w.lower() in _shown:
            continue
        # A hand-listed word must clear the SAME bar as an auto-detected one:
        # without this, the ahead-of-schedule cutoff above was trivially
        # bypassed by naming the word in the story dict — which is how "again"
        # (L8) kept printing on Level 7 pages after the cutoff went in
        # (Lynden 2026-07-27: "7.3 too many tricky words again!!!!").
        _lv_hit = _master_tricky.get(_w.lower())
        if _lv_hit and not _ahead_ok and _lv_hit[0] > level:
            continue
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
            else:
                # Shout, don't shrug. 8.4 shipped a story page with NO picture
                # because the file was hand-dropped in as "Page 5.png" — capital
                # P, space — and this lookup just quietly returned None
                # (Lynden 2026-08-06: "images were not added properly").
                # Windows is case-insensitive but the space still misses, and a
                # missing image is invisible until someone opens the PDF.
                near = [p.name for p in image_dir.glob("*.png")
                        if p.name.lower().replace(" ", "") == img_path.name.lower()]
                hint = f"  Did you mean the file already there: {near[0]!r}?" if near else ""
                print(f"  WARNING: no image for story page {i+1} "
                      f"(expected {img_path.name}).{hint}")
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
        build_special_friend_match, build_reading_sentences,
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
    from v2_helpers import (build_future_sounds, taught_graphemes,
                            all_known_units, build_ed_guide,
                            _grapheme_taught_level, FUTURE_MAX_PER_BOOK)
    _book_taught = taught_graphemes(graphemes_data, level, _focus)
    if full_level_window:
        # Custom Create-A-Book books: the child is not mid-series, so the
        # WHOLE current level counts as taught (matches the forge writer's
        # decodability window). Without this, `or`/`ou` sat later in the L4
        # sequence than the book's focus sound and got labelled "coming at
        # Level 4" INSIDE a Level 4 book whose own chart teaches them
        # (Lynden 2026-08-14).
        _book_taught = []
        for _lv in range(1, level + 1):
            _e = graphemes_data.get(f"level_{_lv}", {})
            _book_taught.extend(g for g in _e.get("graphemes", []) if g not in _book_taught)
            _book_taught.extend(s for s in _e.get("suffixes", []) if s not in _book_taught)
    _known_units = all_known_units(graphemes_data)
    _future_skip_tricky = set(_master_tricky.keys()) | {
        w.lower() for w in story_dict.get("tricky_words_used", [])
    }
    book_data["future_sounds"] = build_future_sounds(
        _shifty_tokens, level, _book_taught, _known_units, graphemes_data,
        LEVEL_COLOURS, tricky_words=_future_skip_tricky,
    )

    # Author-declared future sounds (Lynden 2026-07-25).  Some words letter-
    # map cleanly and so never reach the engine's radar, yet the SOUND they
    # make is genuinely a later level's — "search" parses as s-e-ar-ch but
    # the 'ear' says /er/, and 'ear' isn't taught until L7.  A story dict can
    # name those explicitly as {"grapheme", "sound", "example"}; the level
    # and colour are looked up from the ladder so they can't drift.  Declared
    # entries win over an engine entry for the same grapheme.
    _extra = []
    for _e in story_dict.get("future_sounds_extra", []):
        _lv = _grapheme_taught_level(_e["grapheme"], graphemes_data)
        if _lv is None:
            continue
        _extra.append({
            "grapheme": _e["grapheme"],
            "level": _lv,
            "colour": LEVEL_COLOURS.get(_lv, "#9aa0aa"),
            "example": _e.get("example", ""),
            "sound": _e.get("sound"),
        })
    if _extra:
        _declared = {e["grapheme"] for e in _extra}
        book_data["future_sounds"] = sorted(
            _extra + [f for f in book_data["future_sounds"]
                      if f["grapheme"] not in _declared],
            key=lambda e: (e["level"], e["grapheme"]),
        )[:FUTURE_MAX_PER_BOOK]

    # -ed guide — the THREE ways -ed is said, with a reason for each and an
    # example from this book where it has one.  Below L7 the child can read
    # none of a story's -ed words and the Future Sounds band can only show
    # one; teaching the three rules unlocks all of them (Lynden 2026-07-25:
    # "dont put every word but give the 3 example of the different ways it
    # can be said and why").
    # Opt-out: a story dict may set show_ed_guide=False when the page-2
    # Future Sounds 'ed' cell is explanation enough on its own (Lynden
    # 2026-07-26 on L6.3: "just leave the ed sound as future sounds in
    # this book").  The cell still appears — only the page-3 guide goes.
    book_data["ed_guide"] = build_ed_guide(
        _shifty_tokens, _book_taught, _known_units,
        tricky_words=_future_skip_tricky,
    ) if story_dict.get("show_ed_guide", True) else []

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
    # NO TWO BOOKS RUN THE SAME SOUND DETECTIVE (Lynden 2026-07-29: "8.1 has
    # the same sound detective as 7.4").  data/sound_detective_claims.json
    # allocates each book its own grapheme+sound pairs across the whole fleet
    # — own-story sounds first, ledger fallback when an earlier book took
    # them.  Rebuild it (scripts/build_sound_detective_claims.py) after adding
    # a book or editing a story's words; audit_release.py fails on a clash.
    _exclude = ((book_data["future_spotlight_row"] or {}).get("grapheme"),)
    _candidates = sound_detective_candidates(
        level, book_data["shifty_sounds"], book_data["future_sounds"],
        exclude=_exclude, taught=cumulative,
    )
    _bid = book_id or f"{level}.{story_dict.get('sub_level', '')}".rstrip(".")
    _claim = load_sound_detective_claims().get(_bid)
    if _claim is not None:
        # An EMPTY claim means "no sound left for this book" and must print
        # nothing — only a book missing from the ledger entirely falls back.
        _by_key = {sound_detective_key(r): r for r in _candidates}
        book_data["extra_sound_task"] = [
            _by_key[k] for k in _claim if k in _by_key
        ] or None
    else:
        # No allocation for this book (new book, or claims file absent):
        # fall back to the old behaviour rather than printing nothing.
        book_data["extra_sound_task"] = (
            build_extra_sound_rows(level, book_data["shifty_sounds"],
                                   book_data["future_sounds"], exclude=_exclude)
            or build_extra_sound_rows(level, book_data["shifty_sounds"],
                                      book_data["future_sounds"])
        )

    # Grow the Code chart — a whole page at L4-L6, replacing the
    # Listen-and-Write spelling test.  FIXED sound chart, identical in
    # every book, curated in data/grow_code_chart.json.
    book_data["grow_code_chart"] = build_grow_code_chart(level)

    # Library-edition onboarding page (2026-07-20): "Is this the right
    # level?" sample boxes drawn from THIS book's own content, plus the
    # worksheet + assessment QRs.  Only used when edition == 'library'.
    # (_bid is set above, where the Sound Detective claim is looked up.)
    # QR targets come from the LOCKED registry (scripts/print_qr.py), never
    # from an f-string — these three codes are printed and cannot be reissued.
    # read_qr is new (2026-08-06, Lynden): scan the cover-side code and go
    # straight into the interactive book.
    book_data["book_id"] = _bid
    if edition == "library":
        from print_qr import (read_url, worksheets_url, check_url,
                              library_pass_code)
        book_data["read_qr"] = _qr_data_uri(read_url(_bid))
        book_data["worksheet_qr"] = _qr_data_uri(worksheets_url(_bid))
        book_data["assessment_qr"] = _qr_data_uri(check_url())
        book_data["library_pass_code"] = library_pass_code()
    # Library "Check, match, read" marketing page (replaces the Reading Star
    # celebration filler — Lynden 2026-07-20 "that's just a waste").  Reuses
    # the marketing booklet's how-it-works content + app screenshots.
    if edition == "library":
        _mock = BASE_DIR.parent / "marketing" / "leaflet" / "assets"
        # FAIL LOUDLY on a missing shot.  This used to return None silently,
        # and when the assets went missing from marketing/leaflet/assets/ the
        # page kept rendering — just with a blank hole where the four device
        # shots belong.  Every library master shipped that way until Lynden
        # spotted it on 2026-08-16.  A missing marketing asset is a build
        # error, not a layout variant.
        def _mock_uri(name, required=True):
            p = _mock / name
            if p.exists():
                return image_to_data_uri(p)
            if required:
                raise FileNotFoundError(
                    f"library edition needs {p} for the 'Check, match, read' "
                    f"page — without it the page renders a blank gap")
            print(f"   WARNING: {p.name} missing — step 4 'Play' will have no "
                  f"screenshot")
            return None
        book_data["mkt_phone"] = _mock_uri("mock_phone_trim.png")
        book_data["mkt_laptop"] = _mock_uri("mock_laptop_trim.png")
        book_data["mkt_tablet"] = _mock_uri("mock_tablet_trim.png")
        # Step 4 "Play" — Milo's Cannon (Lynden 2026-08-06).  Unlike the other
        # three this is a raw in-game capture, not a device mockup.
        book_data["mkt_game"] = _mock_uri("mock_game_trim.png", required=False)

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
        # Capped at 12 like its sibling boxes (2026-07-29).  Uncapped, this was
        # the only box that could grow without limit: 3.3 Buzz and Sing has 16
        # alien words, which pushed the "How to use this book online" QR codes
        # past the bottom trim line — preflight_safe_margins.py caught both QR
        # captions at NEGATIVE margins, i.e. guillotined off the printed book.
        # 12 is deliberate, not 8: every other book already sits at 10-12 and
        # renders correctly, so this trims 3.3 only and leaves the other 32
        # onboarding pages byte-identical.
        {"n": 3, "title": "Sound out these alien words", "made_up": True,
         "items": story_dict.get("nonsense_words", [])[:12]},
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
    # Per-book button units. A story can declare a letter pair that must be
    # sounded as ONE unit even though it is not on the grapheme ladder —
    # 8.4 needs "ge", because Lynden ruled the shifty sound in "gorgeous" is
    # /ge/ saying /j/, not the g on its own (2026-08-06). Kept per-book on
    # purpose: putting "ge" on the ladder would re-segment large, change and
    # village across all 33 books and add a cell to every L8 sound chart.
    _extra_units = [str(u) for u in story_dict.get("extra_button_units", [])]
    book_data["sound_buttoned_words"] = build_sound_buttoned_words(
        button_source, cumulative + _future_button_units + _extra_units,
        level=level,
        shifty_overrides=story_dict.get("shifty_marks"),
        # The book never diamond-marks its own focus grapheme — the Watch Out
        # box teaches its alternative sound instead.
        focus_grapheme=(story_dict.get("focus_graphemes") or [None])[0],
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

    # "Can You Read These?" used to end with a Now-Write-Each-Word block that
    # Trace & Form now also carries, word for word — the child wrote the same
    # list twice and read nothing new (Lynden 2026-08-06).  Sentences from the
    # book's own story replace it: the step between reading a word on its own
    # and meeting it in the story, decodable by construction.  The target word
    # is bolded so the child can find the word they just sounded out.
    _sentence_words = (story_dict.get("read_words") or []) + [
        w for w in (story_dict.get("story_words") or [])
        if w not in (story_dict.get("read_words") or [])
    ]
    _sentences = build_reading_sentences(story_pages, _sentence_words, level=level)
    for _s in _sentences:
        # The word comes OUT of the sentence and goes into a choice of three
        # below it (Lynden 2026-08-06).  Reading the word in context was a
        # re-read; picking it out of three that all decode at this level is a
        # decision the child can only make by sounding all three out.
        _s["text_html"] = re.sub(
            rf"\b(" + re.escape(_s['word']) + r")\b",
            '<span class="rsent-gap"></span>', _s["text"], count=1, flags=re.I,
        )
    book_data["reading_sentences"] = _sentences
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
