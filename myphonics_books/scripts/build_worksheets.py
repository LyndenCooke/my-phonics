"""
Build the per-book worksheet bundles for MyPhonicsBooks.

For every published book in the catalogue, render 5 print-ready A4
worksheets (per the locked pedagogy plan in
output/worksheet_plan/plan.json), bundle them into a single PDF
named `{level}_{n}_Worksheets.pdf`, and write to:

    output/worksheets/L{n}/{level}_{n}_Worksheets.pdf

Templates are inlined here as Python f-strings (faster to iterate
than separate Jinja files and the layout per type is small enough).
All worksheets use Andika (sans-serif, single-storey a/g — recommended
for beginning readers), embed fonts via base64 so the PDF prints
identically on any machine, and avoid colour fills so a classroom
mono printer produces usable output.

Usage:
    py -3.12 scripts/build_worksheets.py
    py -3.12 scripts/build_worksheets.py --only L1.1
    py -3.12 scripts/build_worksheets.py --levels 1,2
"""

from __future__ import annotations

import argparse
import asyncio
import base64
import io
import json
import random
import sys
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

import fitz  # PyMuPDF
from core.pdf_generator import get_pdf_generator  # noqa: E402

FONTS_DIR = ROOT / "assets" / "fonts"
DATA_DIR = ROOT / "data"
OUT_ROOT = ROOT / "output" / "worksheets"
PLAN_PATH = ROOT / "output" / "worksheet_plan" / "plan.json"
CONTENT_PATH = ROOT / "output" / "worksheet_plan" / "content_by_book.json"

# Pre-generated per-book content from OpenAI (real fluency sentences,
# dictation lists, crossword clue/answer pairs). Built by
# scripts/_generate_worksheet_content.py. If a book is missing from the
# cache the renderers fall back to the random word-bank assembler — fine
# for the sound-discrimination worksheets but produces nonsense at L4+,
# so always run the generator before publishing.
_CONTENT_CACHE: dict | None = None


def book_content(sub_level: str) -> dict | None:
    global _CONTENT_CACHE
    if _CONTENT_CACHE is None:
        if CONTENT_PATH.exists():
            _CONTENT_CACHE = json.loads(CONTENT_PATH.read_text(encoding="utf-8"))
        else:
            _CONTENT_CACHE = {}
    return _CONTENT_CACHE.get(sub_level)

LEVEL_COLOURS = {
    1: "#E84B8A",
    2: "#F59E0B",
    3: "#22C55E",
    4: "#3B82F6",
    5: "#8B5CF6",
    6: "#14B8A6",
}

LEVEL_NAMES = {
    1: "Starting Stories",
    2: "Longer Sounds",
    3: "New Spellings",
    4: "Building Fluency",
    5: "Reading Together",
    6: "Reading Champion",
}


# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------

@dataclass
class Book:
    sub_level: str           # "L1.1"
    level: int               # 1
    n: int                   # 1
    title: str
    focus_sounds: list[str]
    culture: str
    theme: str


def load_books() -> list[Book]:
    summaries = json.loads((DATA_DIR / "story_summaries.json").read_text(encoding="utf-8"))
    books: list[Book] = []
    for lkey, ldata in summaries.items():
        if not lkey.startswith("level_"):
            continue
        level = int(lkey.split("_")[1])
        for entry in ldata.get("completed_books", []):
            sub = entry["sub_level"]
            if "." not in sub:
                continue
            l, n = sub.split(".")
            books.append(
                Book(
                    sub_level=f"L{sub}",
                    level=int(l),
                    n=int(n),
                    title=entry["title"],
                    focus_sounds=list(entry["focus_sounds"]),
                    culture=entry.get("culture", ""),
                    theme=entry.get("theme", ""),
                )
            )
    return sorted(books, key=lambda b: (b.level, b.n))


def load_words(level: int) -> list[str]:
    path = DATA_DIR / "word_banks" / f"level_{level}_words.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    return [w for w in data.get("words", []) if w.isalpha() and len(w) <= 8]


def load_tricky() -> dict[int, dict[str, list[str]]]:
    data = json.loads((DATA_DIR / "tricky_words_by_level.json").read_text(encoding="utf-8"))
    out: dict[int, dict[str, list[str]]] = {}
    for k, v in data.items():
        if k.startswith("level_"):
            out[int(k.split("_")[1])] = {
                "new": v["new_tricky_words"],
                "cumulative": v["cumulative"],
            }
    return out


# ---------------------------------------------------------------------------
# Word selection helpers
# ---------------------------------------------------------------------------

def words_containing(words: list[str], sound: str) -> list[str]:
    """Return words containing the target sound's letter sequence.

    For digraphs (ee, sh, ck, igh, etc.) we look for the literal substring.
    For single letters we still look for the literal substring — fine for
    sound-hunt purposes at this scale.
    """
    target = sound.replace("-e", "")  # split digraphs: a-e -> a
    matches = [w for w in words if target in w]
    return matches


def pick_decodable_words(level: int, focus_sounds: list[str], n: int = 10) -> list[str]:
    """Pick ~n decodable words. Bias toward words containing the focus
    sounds, then fill from the wider level word bank.
    """
    rng = random.Random(f"{level}-{'-'.join(focus_sounds)}-{n}")
    pool = load_words(level)
    primary: list[str] = []
    seen: set[str] = set()
    for s in focus_sounds:
        for w in words_containing(pool, s):
            if w not in seen and len(w) >= 2:
                primary.append(w)
                seen.add(w)
    rng.shuffle(primary)

    # Filler from the rest of the bank
    rest = [w for w in pool if w not in seen and 2 <= len(w) <= 6]
    rng.shuffle(rest)

    out = (primary + rest)[:n]
    return out


def pick_non_target_words(level: int, focus_sounds: list[str], n: int = 8) -> list[str]:
    pool = load_words(level)
    rng = random.Random(f"non-{level}-{'-'.join(focus_sounds)}-{n}")
    bad = set()
    for s in focus_sounds:
        for w in words_containing(pool, s):
            bad.add(w)
    candidates = [w for w in pool if w not in bad and 2 <= len(w) <= 5]
    rng.shuffle(candidates)
    return candidates[:n]


def make_simple_sentences(words: list[str], tricky: list[str], n: int = 4) -> list[str]:
    """Make n short decodable sentences from the word lists. Deliberately
    simple — the focus is decoding practice, not narrative.
    """
    rng = random.Random(f"sent-{'-'.join(words)}-{n}")
    out: list[str] = []
    safe = [w for w in words if 2 <= len(w) <= 6]
    if not safe:
        safe = ["it", "is", "in"]
    starters = [t for t in tricky if t.lower() in {"i", "the", "he", "she", "we", "they", "my", "you"}]
    if not starters:
        starters = ["I", "The"]
    for _ in range(n):
        w1 = rng.choice(safe).capitalize() if rng.random() < 0.3 else rng.choice(starters)
        w2 = rng.choice(safe)
        w3 = rng.choice(safe)
        out.append(f"{w1} {w2} {w3}.")
    return out


# ---------------------------------------------------------------------------
# Emoji pictures for L1/L2 picture-word matching
# ---------------------------------------------------------------------------
# Map decodable words → an emoji that prints clearly. Only listed words
# can be used as picture pairs. If a focus_sounds book has fewer than 5
# usable mappings, we fall back to text-only "word ↔ rhyming word"
# matching for that book.
WORD_EMOJI: dict[str, str] = {
    "sun": "☀", "cat": "🐱", "dog": "🐶", "fish": "🐟", "pig": "🐷",
    "bus": "🚌", "hat": "🎩", "pen": "🖊", "bed": "🛏", "cup": "🥤",
    "bag": "🎒", "egg": "🥚", "leg": "🦵", "ant": "🐜", "bee": "🐝",
    "sock": "🧦", "lock": "🔒", "duck": "🦆", "rock": "🪨", "moon": "🌙",
    "tree": "🌳", "boat": "⛵", "rain": "🌧", "star": "⭐", "car": "🚗",
    "snow": "❄", "shop": "🏬", "ship": "🚢", "king": "👑", "ring": "💍",
    "fox": "🦊", "box": "📦", "ox": "🐂",
    "horn": "📯", "yarn": "🧶", "fork": "🍴",
    "owl": "🦉", "cow": "🐮",
    "house": "🏠", "mouse": "🐭",
    "frog": "🐸", "crab": "🦀", "snail": "🐌",
}


def pick_picture_pairs(level: int, focus_sounds: list[str], n: int = 5) -> list[tuple[str, str]]:
    """Pick n (word, emoji) pairs whose words are decodable at this level."""
    pool = load_words(level)
    in_pool = set(pool)
    rng = random.Random(f"pic-{level}-{'-'.join(focus_sounds)}-{n}")
    # Prefer pairs whose word matches a focus sound
    primary: list[tuple[str, str]] = []
    rest: list[tuple[str, str]] = []
    for w, e in WORD_EMOJI.items():
        if w not in in_pool and w not in {"snow", "owl", "cow", "house", "mouse", "boat", "rain", "star"}:
            # Some emoji words use later-level graphemes; gate to the level pool
            continue
        if any(s in w for s in focus_sounds):
            primary.append((w, e))
        else:
            rest.append((w, e))
    rng.shuffle(primary)
    rng.shuffle(rest)
    out = (primary + rest)[:n]
    return out


# ---------------------------------------------------------------------------
# CSS shared across worksheets
# ---------------------------------------------------------------------------

def font_b64(name: str) -> str:
    return base64.b64encode((FONTS_DIR / name).read_bytes()).decode("ascii")


def shared_css(level: int) -> str:
    colour = LEVEL_COLOURS[level]
    return f"""
@font-face {{
  font-family: 'Andika';
  src: url(data:font/ttf;base64,{font_b64('Andika-Regular.ttf')}) format('truetype');
  font-weight: 400;
}}
@font-face {{
  font-family: 'Andika';
  src: url(data:font/ttf;base64,{font_b64('Andika-Bold.ttf')}) format('truetype');
  font-weight: 700;
}}
@font-face {{
  font-family: 'Andika';
  src: url(data:font/ttf;base64,{font_b64('Andika-Italic.ttf')}) format('truetype');
  font-weight: 400;
  font-style: italic;
}}

* {{ box-sizing: border-box; }}
html, body {{
  margin: 0; padding: 0;
  font-family: 'Andika', sans-serif;
  color: #111;
  background: #fff;
}}
body {{
  width: 210mm; height: 297mm;
  padding: 14mm 14mm 18mm 14mm;
  position: relative;
}}

.header {{
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  border-bottom: 2.5pt solid {colour};
  padding-bottom: 4mm;
  margin-bottom: 6mm;
}}
.header .left {{ display: flex; align-items: baseline; gap: 4mm; }}
.header .level-pill {{
  background: {colour};
  color: #fff;
  font-weight: 700;
  font-size: 10pt;
  padding: 1.5mm 3mm;
  border-radius: 999px;
  letter-spacing: 0.5pt;
}}
.header h1 {{
  margin: 0;
  font-size: 17pt;
  font-weight: 700;
  color: #111;
  line-height: 1.05;
}}
.header .meta {{
  text-align: right;
  font-size: 9pt;
  color: #555;
}}
.header .meta .book {{ font-weight: 700; color: #222; }}

.instruction {{
  background: #FFF7F0;
  border-left: 3pt solid {colour};
  padding: 3mm 4mm;
  margin: 0 0 5mm 0;
  font-size: 11pt;
  font-weight: 700;
  color: #222;
}}

.teacher-note {{
  position: absolute;
  left: 14mm; right: 14mm; bottom: 8mm;
  border-top: 1pt dashed #aaa;
  padding-top: 2mm;
  font-size: 8pt;
  color: #555;
  font-style: italic;
}}
.teacher-note b {{ color: #222; font-style: normal; }}

/* Common reusable bits */
.word-grid {{ display: grid; gap: 3mm; }}
.write-line {{
  border-bottom: 1pt solid #999;
  height: 9mm;
}}
.write-line.thick {{ border-bottom-width: 1.5pt; }}
.box {{ border: 1pt solid #888; border-radius: 2mm; }}

/* Scissors / cut line */
.cut-line {{
  border-top: 1pt dashed #555;
  margin: 3mm 0;
  position: relative;
}}
.cut-line::before {{
  content: '✂';
  position: absolute;
  top: -3mm;
  left: 2mm;
  background: #fff;
  padding: 0 1mm;
  font-size: 9pt;
  color: #555;
}}
"""


def page_html(level: int, body: str) -> str:
    return f"<html><head><meta charset='utf-8'><style>{shared_css(level)}</style></head><body>{body}</body></html>"


def header(book: Book, worksheet_title: str) -> str:
    return f"""
<div class="header">
  <div class="left">
    <span class="level-pill">{book.sub_level}</span>
    <h1>{worksheet_title}</h1>
  </div>
  <div class="meta">
    <div class="book">{book.title}</div>
    <div>Level {book.level} · {LEVEL_NAMES[book.level]}</div>
  </div>
</div>
"""


def instruction(text: str) -> str:
    return f'<div class="instruction">{text}</div>'


def teacher_note(text: str) -> str:
    return f'<div class="teacher-note"><b>For the teacher.</b> {text}</div>'


# ---------------------------------------------------------------------------
# TEMPLATE: sound_hunt
# ---------------------------------------------------------------------------

def render_sound_hunt(book: Book, title: str) -> str:
    sounds_str = ", ".join(book.focus_sounds)
    target_words = pick_decodable_words(book.level, book.focus_sounds, n=10)
    distractors = pick_non_target_words(book.level, book.focus_sounds, n=10)
    all_words = target_words + distractors
    rng = random.Random(f"sh-{book.sub_level}")
    rng.shuffle(all_words)

    cells = "".join(
        f'<div class="hunt-cell">{w}</div>' for w in all_words[:20]
    )
    body = f"""
{header(book, title.replace('{sounds}', sounds_str))}
{instruction(f"Circle every word that has the sound{'s' if len(book.focus_sounds) > 1 else ''}  <b>{sounds_str}</b>  in it.")}

<style>
.hunt-grid {{
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 5mm 4mm;
  margin-top: 4mm;
}}
.hunt-cell {{
  border: 1pt solid #ccc;
  border-radius: 2mm;
  padding: 4mm 2mm;
  text-align: center;
  font-size: 22pt;
  font-weight: 700;
  letter-spacing: 0.5pt;
}}
</style>

<div class="hunt-grid">{cells}</div>

{teacher_note(f"Target words contain {sounds_str}. Ask the child to say each word aloud first, then decide if they can hear the sound. Answers: " + ", ".join(target_words) + ".")}
"""
    return page_html(book.level, body)


# ---------------------------------------------------------------------------
# TEMPLATE: rainbow_tracing (handwriting for L1-L2)
# ---------------------------------------------------------------------------

def render_rainbow_tracing(book: Book, title: str) -> str:
    rows = ""
    for s in book.focus_sounds:
        display = s.replace("-e", "_e")  # split digraphs visualised
        rows += f"""
<div class="trace-row">
  <div class="trace-label">{display}</div>
  <div class="trace-cells">
    <div class="trace-cell">{display}</div>
    <div class="trace-cell">{display}</div>
    <div class="trace-cell">{display}</div>
    <div class="trace-cell empty"></div>
    <div class="trace-cell empty"></div>
    <div class="trace-cell empty"></div>
  </div>
</div>
"""
    body = f"""
{header(book, title)}
{instruction("Trace the grey letters with a pencil. Then write the sound on your own in the empty boxes.")}

<style>
.trace-row {{ margin-bottom: 8mm; }}
.trace-label {{
  font-size: 12pt; font-weight: 700; color: #555;
  margin-bottom: 2mm;
  text-transform: lowercase;
}}
.trace-cells {{
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 2mm;
}}
.trace-cell {{
  border: 1pt dashed #888;
  border-radius: 2mm;
  height: 22mm;
  display: flex; align-items: center; justify-content: center;
  font-size: 44pt;
  color: #D8D8D8;
  font-weight: 400;
  line-height: 1;
}}
.trace-cell.empty {{ color: transparent; background: #FAFAFA; }}
</style>

{rows}

{teacher_note("Model each letter formation in the air first (start with the dot). Encourage left-to-right, top-down strokes. Andika single-storey a/g matches early reading materials.")}
"""
    return page_html(book.level, body)


# ---------------------------------------------------------------------------
# TEMPLATE: picture_match
# ---------------------------------------------------------------------------

def render_picture_match(book: Book, title: str) -> str:
    pairs = pick_picture_pairs(book.level, book.focus_sounds, n=6)
    if len(pairs) < 4:
        # fallback to text-only matching
        return render_word_rhyme_match(book, title)
    rng = random.Random(f"pm-{book.sub_level}")
    left = list(pairs)
    right = list(pairs)
    rng.shuffle(right)
    rows = ""
    for (lw, le), (rw, _) in zip(left, right):
        rows += f"""
<div class="pm-row">
  <div class="pm-left">
    <div class="pm-emoji">{le}</div>
  </div>
  <div class="pm-mid"></div>
  <div class="pm-right">{rw}</div>
</div>
"""
    body = f"""
{header(book, title)}
{instruction("Draw a line from each picture to the word it matches.")}

<style>
.pm-row {{
  display: grid;
  grid-template-columns: 30mm 1fr 50mm;
  align-items: center;
  height: 28mm;
  border-bottom: 1pt solid #eee;
}}
.pm-emoji {{ font-size: 28pt; text-align: center; }}
.pm-mid {{}}
.pm-right {{
  text-align: center;
  font-size: 22pt;
  font-weight: 700;
  border: 1pt solid #ccc;
  border-radius: 2mm;
  padding: 3mm 2mm;
}}
</style>

{rows}

{teacher_note("Encourage the child to say the word aloud, listen for the sounds, then point to the picture before drawing the line.")}
"""
    return page_html(book.level, body)


def render_word_rhyme_match(book: Book, title: str) -> str:
    """Fallback: match a word to a sentence it appears in."""
    words = pick_decodable_words(book.level, book.focus_sounds, n=5)
    sentences = make_simple_sentences(words, ["I", "The"], n=5)
    rng = random.Random(f"wrm-{book.sub_level}")
    right = sentences.copy()
    rng.shuffle(right)
    rows = ""
    for w, s in zip(words, right):
        rows += f"""
<div class="pm-row">
  <div class="pm-left"><span class="pm-word">{w}</span></div>
  <div class="pm-mid"></div>
  <div class="pm-right">{s}</div>
</div>
"""
    body = f"""
{header(book, title)}
{instruction("Match each word on the left to the sentence it belongs in.")}
<style>
.pm-row {{
  display: grid;
  grid-template-columns: 40mm 1fr 90mm;
  align-items: center;
  height: 24mm;
  border-bottom: 1pt solid #eee;
}}
.pm-word {{ font-size: 22pt; font-weight: 700; }}
.pm-right {{ font-size: 14pt; padding: 0 4mm; }}
</style>
{rows}
{teacher_note("Encourage the child to read each sentence aloud and decide which word completes it.")}
"""
    return page_html(book.level, body)


# ---------------------------------------------------------------------------
# TEMPLATE: cut_paste_sort
# ---------------------------------------------------------------------------

def render_cut_paste_sort(book: Book, title: str) -> str:
    sounds = book.focus_sounds[:2] if len(book.focus_sounds) >= 2 else book.focus_sounds + book.focus_sounds
    a, b = sounds[0], sounds[1]
    pool = load_words(book.level)
    a_words = [w for w in pool if a in w][:5]
    b_words = [w for w in pool if b in w and w not in a_words][:5]
    if len(a_words) < 3 or len(b_words) < 3:
        # combine
        all_words = pick_decodable_words(book.level, book.focus_sounds, n=10)
        a_words = all_words[: len(all_words) // 2]
        b_words = all_words[len(all_words) // 2 :]
    cards = []
    for w in a_words + b_words:
        cards.append(w)
    rng = random.Random(f"cs-{book.sub_level}")
    rng.shuffle(cards)

    box_a = f"""
<div class="sort-box">
  <div class="sort-box-title">Words with <b>{a}</b></div>
  <div class="sort-box-area"></div>
</div>"""
    box_b = f"""
<div class="sort-box">
  <div class="sort-box-title">Words with <b>{b}</b></div>
  <div class="sort-box-area"></div>
</div>"""

    card_html = "".join(f'<div class="sort-card">{w}</div>' for w in cards[:10])

    body = f"""
{header(book, title)}
{instruction("Cut out the word cards below. Read each word aloud, then paste it in the right box.")}

<style>
.sort-boxes {{ display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; margin-bottom: 8mm; }}
.sort-box {{
  border: 1.5pt solid #555;
  border-radius: 3mm;
  padding: 3mm;
  height: 60mm;
  display: flex; flex-direction: column;
}}
.sort-box-title {{
  text-align: center;
  font-size: 12pt;
  font-weight: 400;
  padding-bottom: 2mm;
  border-bottom: 1pt solid #ccc;
  margin-bottom: 2mm;
}}
.sort-box-area {{ flex: 1; }}
.sort-cards-label {{
  font-size: 10pt; color: #666; text-align: center;
  margin: 5mm 0 2mm 0; letter-spacing: 1pt; text-transform: uppercase;
}}
.sort-cards {{
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 2mm;
}}
.sort-card {{
  border: 1.2pt dashed #555;
  border-radius: 2mm;
  padding: 5mm 2mm;
  text-align: center;
  font-size: 18pt;
  font-weight: 700;
  background: #FAFAFA;
}}
</style>

<div class="sort-boxes">
  {box_a}
  {box_b}
</div>

<div class="cut-line"></div>
<div class="sort-cards-label">— cut these out —</div>
<div class="sort-cards">{card_html}</div>

{teacher_note(f"Pre-cut the cards for younger children if scissors-skill is the bottleneck. Some words may belong in BOTH boxes — discuss as a sound-spotting opportunity.")}
"""
    return page_html(book.level, body)


# ---------------------------------------------------------------------------
# TEMPLATE: comp_draw  (L1)
# ---------------------------------------------------------------------------

def render_comp_draw(book: Book, title: str) -> str:
    body = f"""
{header(book, title)}
{instruction(f"Think about <b>{book.title.rstrip('.!?')}</b>. Draw your favourite part of the story.")}

<style>
.draw-box {{
  border: 1.5pt solid #888;
  border-radius: 3mm;
  height: 140mm;
  background: #FCFCFC;
}}
.draw-caption {{
  margin-top: 6mm;
  font-size: 12pt;
  font-weight: 700;
}}
.draw-caption-line {{
  border-bottom: 1.5pt solid #888;
  height: 12mm;
  margin-top: 3mm;
}}
</style>

<div class="draw-box"></div>

<div class="draw-caption">My favourite bit was…</div>
<div class="draw-caption-line"></div>
<div class="draw-caption-line"></div>

{teacher_note("Talking comes first. Ask the child to tell you about their favourite part before they draw. Scribe their words on the lines if writing is still emerging.")}
"""
    return page_html(book.level, body)


# ---------------------------------------------------------------------------
# TEMPLATE: comp_draw_describe (L2)
# ---------------------------------------------------------------------------

def render_comp_draw_describe(book: Book, title: str) -> str:
    body = f"""
{header(book, title)}
{instruction(f"Think about <b>{book.title.rstrip('.!?')}</b>. Draw your favourite part, then write a sentence about it.")}

<style>
.dd-box {{ border: 1.5pt solid #888; border-radius: 3mm; height: 110mm; background: #FCFCFC; }}
.dd-line {{ border-bottom: 1.5pt solid #888; height: 11mm; }}
.dd-prompt {{
  margin: 5mm 0 3mm 0;
  font-size: 12pt; font-weight: 700;
}}
</style>

<div class="dd-box"></div>

<div class="dd-prompt">I liked it when…</div>
<div class="dd-line"></div>
<div class="dd-line"></div>
<div class="dd-line"></div>

{teacher_note("Encourage the child to read their sentence back to you. Praise sound-out attempts; spelling does not need to be perfect at L2.")}
"""
    return page_html(book.level, body)


# ---------------------------------------------------------------------------
# TEMPLATE: comp_write_draw (L3)
# ---------------------------------------------------------------------------

def render_comp_write_draw(book: Book, title: str) -> str:
    body = f"""
{header(book, title)}
{instruction(f"Think about <b>{book.title.rstrip('.!?')}</b>. Write 2-3 sentences about your favourite part, then add a small picture.")}

<style>
.wd-line {{ border-bottom: 1.5pt solid #888; height: 11mm; }}
.wd-starter {{ margin: 5mm 0 3mm 0; font-size: 11pt; font-weight: 700; color: #555; }}
.wd-box {{ border: 1.5pt solid #888; border-radius: 3mm; height: 90mm; background: #FCFCFC; margin-top: 5mm; }}
</style>

<div class="wd-starter">Sentence starters: <span style="font-weight:400">My favourite part was… / I liked it because… / I felt…</span></div>

<div class="wd-line"></div>
<div class="wd-line"></div>
<div class="wd-line"></div>
<div class="wd-line"></div>

<div class="wd-starter" style="margin-top:8mm;">A small picture to go with it:</div>
<div class="wd-box"></div>

{teacher_note("Push for full-stops and capitals at L3. Re-reading their own sentence aloud is the easiest self-check.")}
"""
    return page_html(book.level, body)


# ---------------------------------------------------------------------------
# TEMPLATE: comp_questions (L4)
# ---------------------------------------------------------------------------

def render_comp_questions(book: Book, title: str) -> str:
    questions = [
        f"Where does <b>{book.title.rstrip('.!?')}</b> take place? What clues tell you?",
        "Who is the main character? What do they want at the start?",
        "What is the biggest problem in the story, and how is it solved?",
        "How did the ending make you feel? Why?",
    ]
    blocks = ""
    for i, q in enumerate(questions, 1):
        blocks += f"""
<div class="cq-q">
  <div class="cq-num">{i}.</div>
  <div class="cq-body">
    <div class="cq-prompt">{q}</div>
    <div class="cq-line"></div>
    <div class="cq-line"></div>
  </div>
</div>
"""
    body = f"""
{header(book, title)}
{instruction("Answer each question in a full sentence. Re-read the page in the book if you need to.")}

<style>
.cq-q {{ display: grid; grid-template-columns: 8mm 1fr; gap: 2mm; margin-bottom: 7mm; align-items: start; }}
.cq-num {{ font-weight: 700; font-size: 14pt; }}
.cq-prompt {{ font-size: 12pt; margin-bottom: 3mm; }}
.cq-line {{ border-bottom: 1.5pt solid #888; height: 10mm; }}
</style>

{blocks}

{teacher_note("Mix retrieval (Q1, Q2) with inference and response (Q3, Q4). Accept verbal answers from any child who needs them — comprehension is the goal, not handwriting.")}
"""
    return page_html(book.level, body)


# ---------------------------------------------------------------------------
# TEMPLATE: comp_paragraph (L5, L6)
# ---------------------------------------------------------------------------

def render_comp_paragraph(book: Book, title: str) -> str:
    body = f"""
{header(book, title)}
{instruction(f"Write a paragraph (at least 4 sentences) about <b>{book.title.rstrip('.!?')}</b>. Pick ONE of the prompts below — or invent your own.")}

<style>
.cp-prompts {{
  background: #F8F8F8;
  border: 1pt dashed #aaa;
  padding: 3mm 5mm;
  margin-bottom: 5mm;
  font-size: 10.5pt;
}}
.cp-prompts li {{ margin: 1mm 0; }}
.cp-line {{ border-bottom: 1.2pt solid #888; height: 10mm; }}
</style>

<ul class="cp-prompts">
  <li>What did the main character learn by the end of the story?</li>
  <li>If you could ask the main character one question, what would it be — and what would they say?</li>
  <li>Retell the most important moment in your own words.</li>
  <li>Connect the story to your own life: when have you felt the same way?</li>
</ul>

<div class="cp-line"></div>
<div class="cp-line"></div>
<div class="cp-line"></div>
<div class="cp-line"></div>
<div class="cp-line"></div>
<div class="cp-line"></div>
<div class="cp-line"></div>
<div class="cp-line"></div>
<div class="cp-line"></div>

{teacher_note("Look for: capital letters, full stops, at least one conjunction (and / but / because), and at least one piece of evidence drawn from the text.")}
"""
    return page_html(book.level, body)


# ---------------------------------------------------------------------------
# TEMPLATE: sentence_building (L2-L6)
# ---------------------------------------------------------------------------

def render_sentence_building(book: Book, title: str) -> str:
    words = pick_decodable_words(book.level, book.focus_sounds, n=12)
    tricky = load_tricky()[book.level]["cumulative"][:10]
    word_bank = words + tricky
    rng = random.Random(f"sb-{book.sub_level}")
    rng.shuffle(word_bank)
    bank_html = "".join(f'<span class="sb-word">{w}</span>' for w in word_bank[:14])

    frames = [
        "The ____ ____ ____ ____.",
        "I can see a ____ ____.",
        "____ ____ went ____ the ____.",
        "We ____ the ____ ____.",
    ]
    if book.level >= 4:
        frames = [
            "The ____ ____ was very ____ because ____ ____.",
            "When ____ ____, the ____ ____ ____ ____.",
            "____ ____ but ____ ____ ____.",
            "Before ____ ____, ____ ____ ____ ____.",
        ]
    frames_html = "".join(f'<div class="sb-frame">{f}</div>' for f in frames)

    body = f"""
{header(book, title)}
{instruction("Use words from the box to fill the blanks. Each sentence can use words more than once.")}

<style>
.sb-bank {{
  border: 1.5pt solid #888;
  border-radius: 3mm;
  padding: 4mm;
  display: flex;
  flex-wrap: wrap;
  gap: 2mm 4mm;
  background: #FAFAFA;
  margin-bottom: 6mm;
}}
.sb-word {{
  font-size: 14pt;
  font-weight: 700;
  padding: 1mm 3mm;
  background: #fff;
  border: 1pt solid #ccc;
  border-radius: 2mm;
}}
.sb-frame {{
  font-size: 14pt;
  line-height: 1.8;
  margin-bottom: 6mm;
  letter-spacing: 0.5pt;
}}
</style>

<div class="sb-bank">{bank_html}</div>

{frames_html}

{teacher_note("Read each sentence aloud as a class before children write. There is no single 'right' answer — celebrate creative choices that still make sense.")}
"""
    return page_html(book.level, body)


# ---------------------------------------------------------------------------
# TEMPLATE: dictation (L3-L6)
# ---------------------------------------------------------------------------

def render_dictation(book: Book, title: str) -> str:
    content = book_content(book.sub_level)
    if content and content.get("dictation"):
        words = content["dictation"].get("words", [])[:5]
        sentences = content["dictation"].get("sentences", [])[:3]
    else:
        words = pick_decodable_words(book.level, book.focus_sounds, n=5)
        tricky = load_tricky()[book.level]["new"][:4]
        sentences = make_simple_sentences(words, tricky, n=3)
    rows = ""
    for i in range(1, 9):
        rows += f"""
<div class="dt-row">
  <div class="dt-num">{i}.</div>
  <div class="dt-line"></div>
</div>"""
    body = f"""
{header(book, title)}
{instruction("Your teacher will say a word or sentence. Listen carefully, then write what you hear.")}

<style>
.dt-row {{ display: grid; grid-template-columns: 8mm 1fr; align-items: end; gap: 3mm; margin-bottom: 7mm; }}
.dt-num {{ font-size: 13pt; font-weight: 700; }}
.dt-line {{ border-bottom: 1.5pt solid #888; height: 11mm; }}
</style>

{rows}

{teacher_note("<b>Dictate words 1-5:</b> " + ", ".join(words[:5]) + ".  <b>Dictate sentences 6-8:</b> " + " | ".join(sentences[:3]) + ". Say each item twice; pause for writing time.")}
"""
    return page_html(book.level, body)


# ---------------------------------------------------------------------------
# TEMPLATE: fluency_strips (L3-L6)
# ---------------------------------------------------------------------------

def render_fluency_strips(book: Book, title: str) -> str:
    content = book_content(book.sub_level)
    if content and content.get("fluency_strips"):
        strips = content["fluency_strips"][:6]
    else:
        words = pick_decodable_words(book.level, book.focus_sounds, n=10)
        tricky = load_tricky()[book.level]["cumulative"][:8]
        rng = random.Random(f"fl-{book.sub_level}")
        strips = []
        for _ in range(6):
            rng.shuffle(words)
            rng.shuffle(tricky)
            s = f"{rng.choice(tricky).capitalize()} {rng.choice(words)} {rng.choice(words)} {rng.choice(tricky)} {rng.choice(words)}."
            strips.append(s)
    rows = ""
    for i, s in enumerate(strips, 1):
        rows += f"""
<div class="fs-row">
  <div class="fs-num">{i}.</div>
  <div class="fs-strip">{s}</div>
  <div class="fs-checks">
    <span class="fs-check">Day 1</span>
    <span class="fs-check">Day 2</span>
    <span class="fs-check">Day 3</span>
  </div>
</div>"""

    body = f"""
{header(book, title)}
{instruction("Read each strip aloud three times across three days. Tick the day when you read it smoothly.")}

<style>
.fs-row {{
  display: grid;
  grid-template-columns: 8mm 1fr 60mm;
  align-items: center;
  border-bottom: 1pt solid #eee;
  padding: 4mm 0;
}}
.fs-num {{ font-weight: 700; font-size: 13pt; }}
.fs-strip {{ font-size: 14pt; line-height: 1.4; padding-right: 4mm; }}
.fs-checks {{ display: flex; gap: 2mm; }}
.fs-check {{
  display: inline-block;
  border: 1.2pt solid #888;
  border-radius: 2mm;
  padding: 1.5mm 3mm;
  font-size: 9pt;
  text-align: center;
  flex: 1;
}}
</style>

{rows}

{teacher_note("Repeated reading is the engine of fluency. Same strip, three readings, three days — children should notice their own pace improving.")}
"""
    return page_html(book.level, body)


# ---------------------------------------------------------------------------
# TEMPLATE: crossword (L4-L6) — implemented as numbered "fill the boxes"
# clue grid for MVP. Not an intersecting crossword (would need a layout
# engine); pedagogically equivalent for vocabulary + spelling practice.
# ---------------------------------------------------------------------------

def render_crossword(book: Book, title: str) -> str:
    content = book_content(book.sub_level)
    if content and content.get("crossword"):
        pairs = [
            (c["clue"], c["answer"].lower().strip())
            for c in content["crossword"][:6]
        ]
    else:
        words = pick_decodable_words(book.level, book.focus_sounds, n=8)
        words = [w for w in words if 3 <= len(w) <= 7][:6]
        fallback_clues = [
            f"A word with the sound  <b>{book.focus_sounds[0]}</b>  in it",
            f"Another word with the sound  <b>{book.focus_sounds[-1]}</b>",
            "A word from your phonics box",
            "Something you might find in the story",
            "A word that rhymes",
            "A word your teacher will say",
        ]
        pairs = list(zip(fallback_clues, words))

    rows = ""
    for i, (clue, answer) in enumerate(pairs, 1):
        n_boxes = max(3, len(answer))
        boxes = "".join('<div class="xw-box"></div>' for _ in range(n_boxes))
        rows += f"""
<div class="xw-row">
  <div class="xw-num">{i}.</div>
  <div class="xw-body">
    <div class="xw-clue">{clue}</div>
    <div class="xw-boxes">{boxes}</div>
  </div>
</div>"""

    answers_str = ", ".join(a for _, a in pairs)

    body = f"""
{header(book, title)}
{instruction("Read each clue. Write one letter in each box to spell the answer. Say the word out loud first — sounding it out helps the spelling come right.")}

<style>
.xw-row {{ display: grid; grid-template-columns: 8mm 1fr; gap: 3mm; margin-bottom: 7mm; align-items: start; }}
.xw-num {{ font-weight: 700; font-size: 13pt; padding-top: 2mm; }}
.xw-clue {{ font-size: 12pt; margin-bottom: 2.5mm; }}
.xw-boxes {{ display: flex; gap: 1.5mm; }}
.xw-box {{
  width: 10mm; height: 10mm;
  border: 1.5pt solid #555;
  border-radius: 1mm;
  background: #fff;
}}
</style>

{rows}

{teacher_note(f"<b>Answers:</b> {answers_str}. Children sound-spell each answer; accept reasonable phonetic attempts as well as the exact spelling.")}
"""
    return page_html(book.level, body)


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------

RENDERERS = {
    "sound_hunt": render_sound_hunt,
    "rainbow_tracing": render_rainbow_tracing,
    "picture_match": render_picture_match,
    "cut_paste_sort": render_cut_paste_sort,
    "comp_draw": render_comp_draw,
    "comp_draw_describe": render_comp_draw_describe,
    "comp_write_draw": render_comp_write_draw,
    "comp_questions": render_comp_questions,
    "comp_paragraph": render_comp_paragraph,
    "sentence_building": render_sentence_building,
    "dictation": render_dictation,
    "fluency_strips": render_fluency_strips,
    "crossword": render_crossword,
}


def title_for(pattern: str, book: Book) -> str:
    sounds_str = ", ".join(book.focus_sounds)
    return (
        pattern.replace("{sounds}", sounds_str)
               .replace("{title}", book.title)
               .replace("{sub}", book.sub_level)
    )


async def build_for_book(book: Book, plan: dict, gen) -> Path:
    pack = plan["_packs"][f"L{book.level}"]["worksheets"]
    out_dir = OUT_ROOT / f"L{book.level}"
    out_dir.mkdir(parents=True, exist_ok=True)

    page_paths: list[Path] = []
    for idx, sheet in enumerate(pack, 1):
        wtype = sheet["type"]
        title = title_for(sheet["title_pattern"], book)
        html = RENDERERS[wtype](book, title)
        page_pdf = out_dir / f"_tmp_{book.level}_{book.n}_{idx}_{wtype}.pdf"
        await gen.generate(html, page_pdf, width_mm=210, height_mm=297)
        page_paths.append(page_pdf)

    bundled = out_dir / f"{book.level}_{book.n}_Worksheets.pdf"
    merged = fitz.open()
    for p in page_paths:
        with fitz.open(p) as doc:
            merged.insert_pdf(doc)
    merged.save(bundled)
    merged.close()
    for p in page_paths:
        try:
            p.unlink()
        except OSError:
            pass
    return bundled


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="Render a single book, e.g. L1.1")
    ap.add_argument("--levels", help="Comma-separated list of levels, e.g. 1,2,3")
    args = ap.parse_args()

    plan = json.loads(PLAN_PATH.read_text(encoding="utf-8"))
    books = load_books()

    if args.only:
        books = [b for b in books if b.sub_level == args.only]
    if args.levels:
        keep = {int(x) for x in args.levels.split(",")}
        books = [b for b in books if b.level in keep]

    gen = get_pdf_generator()
    OUT_ROOT.mkdir(parents=True, exist_ok=True)

    for b in books:
        path = await build_for_book(b, plan, gen)
        size_kb = path.stat().st_size // 1024
        print(f"  {b.sub_level:6s} {b.title[:36]:36s} -> {path.relative_to(ROOT)}  ({size_kb} KB)")

    print(f"\nDone. {len(books)} bundles written under {OUT_ROOT.relative_to(ROOT)}/")


if __name__ == "__main__":
    asyncio.run(main())
