"""Assemble the Keep-Up Kit teacher guide (audit blocker #4).

The kit ASSEMBLES existing scheme resources — sound cards, picture-word cards,
word-card decks, single-sound worksheets — around the 10-minute daily 1:1
keep-up routine described in output/worksheet_plan/SCHOOL_SCHEME_RECEPTION_TO_Y2.md
paragraph 3 ("Keep-up, not catch-up"). Nothing new is generated except this guide.

Pipeline (mirrors marketing/paper-assessment/generate.py):
  1. Level GPC lists come straight from scripts/cards_data.py (the card deck's
     source of truth), so the guide never drifts from the printed cards.
  2. Jinja2 renders templates/keep_up_kit.html (6 A4 pages).
  3. Playwright (headless Chromium) prints it to output/keep_up_kit/Keep_Up_Kit_Guide.pdf.

Run:  py -3.12 scripts/generate_keep_up_kit.py
Deps: jinja2, playwright (chromium installed).
"""
from __future__ import annotations

import asyncio
import sys
from collections import OrderedDict
from pathlib import Path

from jinja2 import Environment, FileSystemLoader
from playwright.async_api import async_playwright

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent                                  # myphonics_books/
sys.path.insert(0, str(HERE))
import cards_data as cd  # noqa: E402  (card deck = source of truth for GPCs)

TEMPLATES_DIR = ROOT / "templates"
FONTS = ROOT / "assets" / "fonts"
OUT_DIR = ROOT / "output" / "keep_up_kit"
BUILD_DIR = OUT_DIR / "_build"
for d in (OUT_DIR, BUILD_DIR):
    d.mkdir(parents=True, exist_ok=True)

# Level ledger meta (names/colours per CLAUDE.md — single source: generate_book.py
# STORY_FONT_SIZES table; duplicated here as display copy only).
LEVELS = [
    {"level": 1, "name": "Ditties",           "hex": "#E84B8A", "year": "Reception"},
    {"level": 2, "name": "First Sounds",      "hex": "#F97066", "year": "Reception"},
    {"level": 3, "name": "Special Friends",   "hex": "#F59E0B", "year": "Reception"},
    {"level": 4, "name": "Longer Sounds",     "hex": "#22C55E", "year": "Reception / Year 1"},
    {"level": 5, "name": "New Spellings",     "hex": "#3B82F6", "year": "Year 1"},
    {"level": 6, "name": "Building Fluency",  "hex": "#6366F1", "year": "Year 1 / Year 2"},
    {"level": 7, "name": "Reading Together",  "hex": "#8B5CF6", "year": "Year 2"},
    {"level": 8, "name": "Reading Champion",  "hex": "#14B8A6", "year": "Year 2 / Year 3"},
]

# The five steps of the 10-minute routine (scheme doc paragraph 3). `detail` is the
# teacher-guide wording, `card` the shorter photocopiable routine-card wording.
ROUTINE = [
    {
        "title": "Speed review — taught sound cards", "mins": "2 min", "hex": "#E84B8A",
        "detail": "Flash every GPC card taught so far (all earlier levels included), fast and "
                  "fun. Child says each sound; park any card they hesitate on and show it twice "
                  "more before the end of the pile. Aim for one card per second or two.",
        "card": "Flash all taught sound cards. Say each sound fast. Hesitated? Back in the pile, twice.",
    },
    {
        "title": "Meet the focus sound", "mins": "2 min", "hex": "#F59E0B",
        "detail": "Show the focus GPC with its picture-word card (Levels 1–2) or its sound "
                  "card plus one word card (Levels 3+). See it, say it, find it in the word, "
                  "trace it with a finger. My turn first, then your turn.",
        "card": "Picture-word card (or sound card + word). See it, say it, find it, trace it.",
    },
    {
        "title": "Blend 5 words", "mins": "3 min", "hex": "#22C55E",
        "detail": "Pull five word cards from the level deck that contain the focus sound. Child "
                  "sound-talks then blends each one. If a word blocks, model the blend and come "
                  "back to it last — finish on a win.",
        "card": "Five word cards with the focus sound. Sound-talk it, then blend it.",
    },
    {
        "title": "Write 2 words", "mins": "2 min", "hex": "#3B82F6",
        "detail": "Choose two of the five words. Say it. Tap it. Write it. Check it — the "
                  "child says the word, taps the sounds on their fingers, writes it on the "
                  "single-sound sheet or a whiteboard, then checks it against the card.",
        "card": "Pick two of the five. Say it. Tap it. Write it. Check it.",
    },
    {
        "title": "One sentence read", "mins": "1 min", "hex": "#8B5CF6",
        "detail": "Open the child's current decodable storybook at a sentence containing the "
                  "focus sound and read it together — child first, adult echoing. End with "
                  "specific praise: name the exact sound they nailed today.",
        "card": "One sentence from their storybook with the focus sound in it. Read, echo, praise.",
    },
]

# ---------------------------------------------------------------------------
# Per-level resource pull-lists (the assembly map). Worksheet coverage is real:
# single-sound sheets exist for L1-L3 only (public/worksheets/Sound_Pack*,
# Level_3_Pack); L4-L8 route to the companion workbook until those sheets ship.
SPEED = {
    (1, 2, 3, 4): "Printable sound cards, L1–L4 set — every card taught so far",
    (5, 6): "Printable sound cards, L5–L6 set + all earlier cards",
    (7, 8): "Printable sound cards, L7–L8 set + all earlier cards",
}


def speed_for(level: int) -> str:
    for ks, v in SPEED.items():
        if level in ks:
            return v
    raise ValueError(level)


FOCUS = {
    1: "Picture-word card for the focus sound (169-card L1–L2 set)",
    2: "Picture-word card for the focus sound (169-card L1–L2 set)",
}
FOCUS_DEFAULT = "Focus sound card + one word card from the level deck"

BLEND = "Level {n} word-card deck — five words with the focus sound"
BLEND_SHIFTY = ("Level {n} word-card deck (+ shifty cards once the sound has "
                "shifted) — five words with the focus sound")

WRITE = {
    1: "Single-sound worksheet for the focus sound (SATPIN + MDGO Sound Packs, one sheet per L1 sound)",
    2: "Single-sound worksheet for the focus sound (L2 Sound Pack, one sheet per L2 sound)",
    3: "Single-sound worksheet for the focus sound (SHNK Sound Pack + Level 3 Pack sound sheets)",
}
WRITE_L4 = ("Whiteboard + the matching formation/dictation page in the Level 4 "
            "companion workbook (single-sound sheets for L4–8: on the roadmap)")
WRITE_DEFAULT = ("Whiteboard + the matching page in the Level {n} companion "
                 "workbook (see note below)")


def build_index() -> list[dict]:
    cards, _extras = cd.load_cards()
    gpcs_by_level: dict[str, OrderedDict] = {}
    for c in cards:
        gpcs_by_level.setdefault(c["level"], OrderedDict())[c["grapheme"]] = None

    out = []
    for L in LEVELS:
        n = L["level"]
        blend_tpl = BLEND_SHIFTY if n >= 3 else BLEND
        out.append({
            **L,
            "gpcs": list(gpcs_by_level[f"L{n}"]),
            "speed": speed_for(n),
            "focus": FOCUS.get(n, FOCUS_DEFAULT),
            "blend": blend_tpl.format(n=n),
            "write": WRITE.get(n, WRITE_L4 if n == 4 else WRITE_DEFAULT.format(n=n)),
        })
    return out


def render_html() -> Path:
    env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)), autoescape=False)
    index = build_index()
    html = env.get_template("keep_up_kit.html").render(
        levels=LEVELS,
        routine=ROUTINE,
        index_pages=[index[:4], index[4:]],
        font_regular=(FONTS / "Andika-Regular.ttf").as_uri(),
        font_bold=(FONTS / "Andika-Bold.ttf").as_uri(),
    )
    out = BUILD_DIR / "keep_up_kit.html"
    out.write_text(html, encoding="utf-8")
    return out


async def render_pdf(html: Path) -> Path:
    pdf = OUT_DIR / "Keep_Up_Kit_Guide.pdf"
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto(html.as_uri(), wait_until="networkidle")
        await asyncio.sleep(1.5)  # let webfonts settle
        await page.pdf(path=str(pdf), width="210mm", height="297mm",
                       print_background=True,
                       margin={"top": "0", "bottom": "0", "left": "0", "right": "0"})
        await browser.close()
    return pdf


def main() -> None:
    print("1/2  Rendering HTML (GPC lists read from cards_data.py)...")
    html = render_html()
    print("2/2  Printing A4 PDF with Chromium...")
    pdf = asyncio.run(render_pdf(html))
    print(f"\n  {pdf}  ({pdf.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
