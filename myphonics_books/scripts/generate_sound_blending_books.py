"""
Sound Blending Books — RWI-format rebuild (MPB own terminology).

Reverse-engineers the *pedagogical format* of Read Write Inc Sound Blending
Books (NOT their content/art/trademarks): a two-page cycle per word —
  • BLEND page  — the word shown as separated graphemes (s · a · t), focus
    sounds in the level colour, no picture, "Sound it out, then blend."
  • CHECK page  — the whole word + picture + tick, so the child self-checks.

This rebuild REUSES the existing, consult-validated word lists and the
already-generated illustrations in output/blend_books/images/, so it needs NO
image generation (the OpenAI key is billing-depleted). It only restructures
them into the new format with templates/sound_blending_book.html.

Book structure (16 A6 pages, saddle-stitch friendly):
  1 cover · 2 sounds · 3-14 six words × (blend, check) · 15 review · 16 back

Run:  py -3.12 scripts/generate_sound_blending_books.py            # all 4
      py -3.12 scripts/generate_sound_blending_books.py --book 2   # one
"""
from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(BASE_DIR))

from jinja2 import Environment, FileSystemLoader  # noqa: E402

from data.blend_books import BLEND_BOOKS, LEVEL_COLOUR  # noqa: E402
from scripts.generate_book import html_to_pdf, image_to_data_uri  # noqa: E402

FONTS_DIR = BASE_DIR / "assets" / "fonts"
SRC_IMG_DIR = BASE_DIR / "output" / "blend_books" / "images"   # reuse existing art
OUT_DIR = BASE_DIR / "output" / "sound_blending_books"
OUT_DIR.mkdir(parents=True, exist_ok=True)

TRICKY = {"i", "the"}          # L1 tricky (sight) words — never segmented
PUNCT = ".!?,"


def _tokenise(word: str) -> list[dict]:
    """Split a word/phrase into render tokens.

    L1 graphemes are all single letters, so a blend token's graphemes are just
    its letters. Tricky words are shown whole (read on sight). Trailing
    punctuation becomes its own token. (Digraph-aware splitting needed for L2+.)
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
            tokens.append({"kind": "blend", "graphemes": list(core)})
        if trailing:
            tokens.append({"kind": "punct", "text": trailing})
    return tokens


def _word_html(word: str, focus: set[str]) -> str:
    """Whole word for the check page, focus letters in the level colour."""
    out = []
    for ch in word:
        if ch.lower() in focus:
            out.append(f'<span class="f">{ch}</span>')
        else:
            out.append(ch)
    return "".join(out)


def _focus_label(focus: list[str]) -> str:
    if len(focus) == 1:
        return f"sound {focus[0]}"
    return "sounds " + ", ".join(focus[:-1]) + " and " + focus[-1]


def _build_pages(book_id: str, book: dict) -> list[dict]:
    focus = set(book["focus_graphemes_new"])
    img_dir = SRC_IMG_DIR / book_id
    pages: list[dict] = [{"type": "cover"}, {"type": "sounds"}]
    pnum = 3
    review_words: list[str] = []
    for i, p in enumerate(book["pages"]):
        word = p["word"]
        review_words.append(word.strip(PUNCT) if " " not in word else word)
        pages.append({"type": "blend", "tokens": _tokenise(word), "pnum": pnum})
        pnum += 1
        img_path = img_dir / f"page_{i + 1:02d}.png"
        pages.append({
            "type": "check",
            "word_html": _word_html(word, focus),
            "image": image_to_data_uri(img_path) if img_path.exists() else None,
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
    cover_img = SRC_IMG_DIR / book_id / "cover.png"

    html = tmpl.render(
        book_title=book["title"],
        subtitle=book["subtitle"],
        kicker=f"Sound Blending Book {book['book_number']}",
        level_colour=LEVEL_COLOUR,
        focus_graphemes=focus,
        focus_label=_focus_label(focus),
        cumulative_graphemes=book["cumulative_graphemes"],
        cover_image=image_to_data_uri(cover_img) if cover_img.exists() else None,
        pages=_build_pages(book_id, book),
        font_regular=(FONTS_DIR / "Andika-Regular.ttf").as_uri(),
        font_bold=(FONTS_DIR / "Andika-Bold.ttf").as_uri(),
    )
    (OUT_DIR / f"{book_id}.html").write_text(html, encoding="utf-8")
    pdf_path = OUT_DIR / f"SB_L1_Book_{book['book_number']}.pdf"
    asyncio.run(html_to_pdf(html, pdf_path))
    print(f"  wrote {pdf_path.relative_to(BASE_DIR)}")
    return pdf_path


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--book", type=int, help="only build one book (1-4)")
    args = ap.parse_args()
    items = ([(f"Blend_{args.book}", BLEND_BOOKS[f"Blend_{args.book}"])]
             if args.book else list(BLEND_BOOKS.items()))
    for book_id, book in items:
        print(f"== {book_id}: {book['title']} ==")
        _render(book_id, book)


if __name__ == "__main__":
    main()
