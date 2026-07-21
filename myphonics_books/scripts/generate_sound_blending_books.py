"""
Sound Blending Books — RWI-format rebuild (MPB own terminology).

Reverse-engineers the *pedagogical format* of Read Write Inc Sound Blending
Books (NOT their content/art/trademarks): a two-page cycle per word —
  • BLEND page  — the word shown as separated graphemes (s · a · t), focus
    sounds in the level colour, no picture, "Sound it out, then blend."
  • CHECK page  — the whole word + picture + tick, so the child self-checks.

This rebuild REUSES existing art only — no image generation (all image API
keys are billing-depleted):
  • Books 1-4 (L1)   — the consult-validated word lists + the illustrations
    already in output/blend_books/images/.
  • Books 5-12 (L2-L5, added 2026-07-07) — word lists authored against
    CURRICULUM_LEDGER.md; every image reuses the Sound Spotlight library
    (assets/photos/<grapheme>/<word>.jpg) via each page's "image_file".

Tokenisation is digraph-aware: each book's grapheme inventory is matched
longest-first, so "night" segments n · igh · t. Split digraphs (a-e) cannot
be dotted honestly — pages marked "split" show the whole word with the two
split letters in the level colour instead.

Book structure (16 A6 pages, saddle-stitch friendly):
  1 cover · 2 sounds · 3-14 six words × (blend, check) · 15 review · 16 back

Run:  py -3.12 scripts/generate_sound_blending_books.py             # all 12
      py -3.12 scripts/generate_sound_blending_books.py --book 9    # one
"""
from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(BASE_DIR))

from jinja2 import Environment, FileSystemLoader  # noqa: E402

from data.blend_books import BLEND_BOOKS, LEVEL_COLOURS  # noqa: E402
from scripts.generate_book import html_to_pdf, image_to_data_uri  # noqa: E402

FONTS_DIR = BASE_DIR / "assets" / "fonts"
SRC_IMG_DIR = BASE_DIR / "output" / "blend_books" / "images"   # L1 legacy art
OUT_DIR = BASE_DIR / "output" / "sound_blending_books"
OUT_DIR.mkdir(parents=True, exist_ok=True)

TRICKY = {"i", "the"}          # tricky (sight) words — never segmented
PUNCT = ".!?,"


def _graphemes_longest_first(book: dict) -> list[str]:
    """The book's grapheme inventory for greedy longest-match splitting."""
    inventory = {g for g in book["cumulative_graphemes"] if "-" not in g}
    inventory |= {g for g in book["focus_graphemes_new"] if "-" not in g}
    return sorted(inventory, key=len, reverse=True)


def _split_graphemes(core: str, graphemes: list[str]) -> list[str]:
    """Greedy longest-match split of a word into grapheme units.

    Anything not in the inventory falls back to a single letter, so L1
    books (all single letters) segment exactly as before.
    """
    units: list[str] = []
    i = 0
    low = core.lower()
    while i < len(core):
        for g in graphemes:
            if len(g) > 1 and low.startswith(g, i):
                units.append(core[i:i + len(g)])
                i += len(g)
                break
        else:
            units.append(core[i])
            i += 1
    return units


def _split_word_html(word: str, split: str) -> str:
    """Whole word with the split digraph's two letters in the level colour
    (cake, a-e -> c<a>k<e>). Used on both the blend and check pages."""
    first, last = split[0], split[-1]
    lo = word.lower()
    i0 = lo.index(first)
    i1 = lo.rindex(last)
    out = []
    for i, ch in enumerate(word):
        if i in (i0, i1):
            out.append(f'<span class="f">{ch}</span>')
        else:
            out.append(ch)
    return "".join(out)


def _tokenise(word: str, graphemes: list[str]) -> list[dict]:
    """Split a word/phrase into render tokens (digraph-aware).

    Tricky words are shown whole (read on sight). Trailing punctuation
    becomes its own token.
    """
    tokens: list[dict] = []
    for raw in word.split():
        core = raw
        trailing = ""
        while core and core[-1] in PUNCT:
            trailing = core[-1] + trailing
            core = core[:-1]
        if not core:
            if trailing:
                tokens.append({"kind": "punct", "text": trailing})
            continue
        if core.lower() in TRICKY:
            tokens.append({"kind": "tricky", "text": core})
        else:
            tokens.append({"kind": "blend",
                           "graphemes": _split_graphemes(core, graphemes)})
        if trailing:
            tokens.append({"kind": "punct", "text": trailing})
    return tokens


def _word_html(word: str, focus: set[str], graphemes: list[str]) -> str:
    """Whole word for the check page, focus graphemes in the level colour
    (digraph-aware: 'night' with igh focus colours the whole igh)."""
    out = []
    for unit in _split_graphemes(word, graphemes):
        if unit.lower() in focus:
            out.append(f'<span class="f">{unit}</span>')
        else:
            out.append(unit)
    return "".join(out)


def _focus_label(focus: list[str]) -> str:
    if len(focus) == 1:
        return f"sound {focus[0]}"
    return "sounds " + ", ".join(focus[:-1]) + " and " + focus[-1]


def _page_image(book_id: str, page: dict, page_index: int) -> str | None:
    """Resolve a page's art: explicit reused asset first (books 5-12),
    else the legacy per-book generated art (books 1-4)."""
    if page.get("image_file"):
        path = BASE_DIR / page["image_file"]
    else:
        path = SRC_IMG_DIR / book_id / f"page_{page_index + 1:02d}.png"
    return image_to_data_uri(path) if path.exists() else None


def _build_pages(book_id: str, book: dict) -> list[dict]:
    focus = {g.lower() for g in book["focus_graphemes_new"]}
    graphemes = _graphemes_longest_first(book)
    pages: list[dict] = [{"type": "cover"}, {"type": "sounds"}]
    pnum = 3
    review_words: list[str] = []
    for i, p in enumerate(book["pages"]):
        word = p["word"]
        review_words.append(word.strip(PUNCT) if " " not in word else word)
        if p.get("split"):
            whole = _split_word_html(word, p["split"])
            pages.append({"type": "blend",
                          "tokens": [{"kind": "whole", "html": whole}],
                          "pnum": pnum})
            word_html = whole
        else:
            pages.append({"type": "blend",
                          "tokens": _tokenise(word, graphemes),
                          "pnum": pnum})
            word_html = _word_html(word, focus, graphemes)
        pnum += 1
        pages.append({
            "type": "check",
            "word_html": word_html,
            "image": _page_image(book_id, p, i),
            "pnum": pnum,
        })
        pnum += 1
    pages.append({"type": "review", "words": review_words, "pnum": pnum})
    pages.append({"type": "back"})
    return pages


def _render(book_id: str, book: dict) -> Path:
    env = Environment(loader=FileSystemLoader(str(BASE_DIR / "templates")))
    tmpl = env.get_template("sound_blending_book.html")
    focus = book["focus_graphemes_new"]
    level = book.get("level", "L1")

    if book.get("cover_image_file"):
        cover_img = BASE_DIR / book["cover_image_file"]
        cover_fit = "contain"      # reused single-object art, don't crop
    else:
        cover_img = SRC_IMG_DIR / book_id / "cover.png"
        cover_fit = "cover"        # legacy full-bleed cover art

    html = tmpl.render(
        book_title=book["title"],
        subtitle=book["subtitle"],
        kicker=f"Sound Blending Book {book['book_number']}",
        level_colour=LEVEL_COLOURS[level],
        focus_graphemes=focus,
        focus_label=_focus_label(focus),
        cumulative_graphemes=book["cumulative_graphemes"],
        cover_image=image_to_data_uri(cover_img) if cover_img.exists() else None,
        cover_fit=cover_fit,
        pages=_build_pages(book_id, book),
        font_regular=(FONTS_DIR / "Andika-Regular.ttf").as_uri(),
        font_bold=(FONTS_DIR / "Andika-Bold.ttf").as_uri(),
    )
    (OUT_DIR / f"{book_id}.html").write_text(html, encoding="utf-8")
    pdf_path = OUT_DIR / f"SB_{level}_Book_{book['book_number']}.pdf"
    asyncio.run(html_to_pdf(html, pdf_path))
    print(f"  wrote {pdf_path.relative_to(BASE_DIR)}")
    return pdf_path


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--book", type=int, help="only build one book (1-12)")
    args = ap.parse_args()
    items = ([(f"Blend_{args.book}", BLEND_BOOKS[f"Blend_{args.book}"])]
             if args.book else list(BLEND_BOOKS.items()))
    for book_id, book in items:
        print(f"== {book_id}: {book['title']} ==")
        _render(book_id, book)


if __name__ == "__main__":
    main()
