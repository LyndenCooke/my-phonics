"""
MyPhonicsBooks — Sound Cards Generator

Renders the 143-card sound scheme (+ the 7-card "ough" wildcard insert)
into print-ready PDFs, mirroring the Jinja2 + Playwright approach used by
scripts/generate_book.py.

Tiers:
  1        Premium, print-ready, one card per page-pair (front, then its
           back on the very next page) — same one-thing-at-a-time
           format as "pictures"/ough below, not an imposed sheet grid,
           so there's no guessing at duplex feed orientation. 3mm bleed
           + crop marks for guillotine cutting (300gsm silk, matt
           laminated). One card per grapheme (no separate twin cards —
           they merged into the main card 2026-07-05): front = grapheme
           only, back = every pronunciation as a sound → example row
           ("s" back: s sun / z is / sh sure / zh treasure). No image on
           either face, at any level — see "pictures" below.
  2        Free printable single-sided A4 landscape sheet, 8 cards per
           sheet (4 cols x 2 rows), dashed cut lines, no bleed. Grapheme
           only.
  pictures L1-L2 only. RWI-style companion picture-word cards: one card
           per word (up to 6 per sound), image on top + word underneath,
           single face — the adult covers the word with a hand to test
           cold reading. Same free/no-bleed A4 sheet as Tier 2, on cost
           grounds (these are NOT part of the premium double-sided deck).
  ough     Standalone 7-card "ough" wildcard insert pack (L8), same
           premium bleed + crop-mark quality as Tier 1, single-sided.

Usage:
    py -3.12 scripts/generate_cards.py --tier 1
    py -3.12 scripts/generate_cards.py --tier 2 --level L1-L4
    py -3.12 scripts/generate_cards.py --tier pictures --level L1-L2
    py -3.12 scripts/generate_cards.py --tier ough
    py -3.12 scripts/generate_cards.py --tier all --level batch1

--level accepts: 'all', a single level ('L3'), a range ('L1-L4'), a
comma list ('L1,L3,L5'), or a named rollout batch ('batch1' = L1-L4,
'batch2' = L5-L6, 'batch3' = L7-L8).

--with-images generates one illustration per picture-word card (the only
place an image appears anywhere in this pipeline now) via the Gemini
image pipeline before rendering. Omit it (the default) to render with
neutral placeholder boxes instead — do this first and get the
typographic layout signed off before spending image-generation credits.
"""

import argparse
import asyncio
import base64
import sys
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

BASE_DIR = Path(__file__).resolve().parent.parent
# core.pdf_generator lives at the repo root; scripts/ is not on sys.path
# by default when this file is run directly (python scripts/generate_cards.py
# only adds scripts/ itself). Same fix-up as scripts/generate_pilot_books.py.
sys.path.insert(0, str(BASE_DIR))

TEMPLATES_DIR = BASE_DIR / "templates"
FONTS_DIR = BASE_DIR / "assets" / "fonts"
LOGO_OUTLINE_PATH = BASE_DIR / "assets" / "logo" / "mpb_mark_outline.png"
OUTPUT_DIR = BASE_DIR / "output" / "cards"

import cards_data as cd

LEVELS_HELP = (
    "'all', a level ('L3'), a range ('L1-L4'), a comma list ('L1,L3,L5'), "
    "or a rollout batch ('batch1'=L1-L4, 'batch2'=L5-L6, 'batch3'=L7-L8)"
)


def _font_to_data_uri(font_path: Path) -> str:
    raw = font_path.read_bytes()
    b64 = base64.b64encode(raw).decode("ascii")
    return f"data:font/truetype;base64,{b64}"


def _image_to_data_uri(image_path: Path) -> str:
    b64 = base64.b64encode(image_path.read_bytes()).decode("ascii")
    return f"data:image/png;base64,{b64}"


def _card_photo_to_data_uri(image_path: Path, max_dimension: int = 1000, jpeg_quality: int = 85) -> str:
    """Re-encode a picture-word card photo to a compressed JPEG data URI.

    Picture-word cards embed one photo per card, up to ~170 cards in a
    single HTML document. The raw Vertex/Gemini PNGs are ~700-1000KB each
    and individually fall under generate_book.image_to_data_uri's 2MB
    per-image compression threshold, but a full L1-L4 deck's worth
    (~116 images) still sums to 100MB+ of embedded base64, which crashes
    Playwright's page.set_content (TargetClosedError). Always compressing
    to JPEG here — regardless of individual file size — keeps the whole
    deck's embedded HTML small enough to render.
    """
    from io import BytesIO
    from PIL import Image

    img = Image.open(image_path)
    img = img.convert("RGB") if img.mode in ("RGBA", "P") else img
    img.thumbnail((max_dimension, max_dimension))
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=jpeg_quality, optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:image/jpeg;base64,{b64}"


def _fonts_context() -> dict:
    return {
        "font_regular": _font_to_data_uri(FONTS_DIR / "Andika-Regular.ttf"),
        "font_bold": _font_to_data_uri(FONTS_DIR / "Andika-Bold.ttf"),
    }


def _logo_context() -> dict:
    if not LOGO_OUTLINE_PATH.exists():
        raise FileNotFoundError(
            f"{LOGO_OUTLINE_PATH} is missing — run scripts/extract_logo_outline.py first."
        )
    return {"logo_data_uri": _image_to_data_uri(LOGO_OUTLINE_PATH)}


def _geometry_context() -> dict:
    return {
        "bleed": cd.BLEED,
        "card_trim_w": cd.CARD_TRIM_W,
        "card_trim_h": cd.CARD_TRIM_H,
        "card_bleed_w": cd.CARD_BLEED_W,
        "card_bleed_h": cd.CARD_BLEED_H,
        "page_w": cd.CARD_PAGE_W,
        "page_h": cd.CARD_PAGE_H,
        "page_margin": cd.CARD_PAGE_MARGIN,
        "grapheme_target_px": cd.GRAPHEME_TARGET_PX,
    }


def _jinja_env() -> Environment:
    return Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)), autoescape=False)


def _attach_images(cards: list[dict], images_dir: Path) -> None:
    """Attach a base64 data URI to cards whose generated image exists on disk."""
    for card in cards:
        img_path = images_dir / f"{card['card_id']}.png"
        card["image_data"] = _card_photo_to_data_uri(img_path) if img_path.exists() else None


async def html_to_pdf(html_content: str, output_path: Path) -> Path:
    """Render HTML to PDF via Playwright, running the client-side text
    shrink-to-fit pass after fonts load and before export."""
    from playwright.async_api import async_playwright

    output_path.parent.mkdir(parents=True, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.set_content(html_content, wait_until="domcontentloaded", timeout=900000)
        await page.evaluate("() => document.fonts.ready")
        await page.evaluate("() => { if (window.fitAllGraphemes) fitAllGraphemes(); }")
        await page.wait_for_timeout(150)
        await page.pdf(
            path=str(output_path),
            print_background=True,
            prefer_css_page_size=True,
            margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
        )
        await browser.close()

    return output_path


def _level_tag(level_selector: str) -> str:
    """'all' -> 'all', 'L1-L4' -> 'L1-L4', 'batch1' -> 'L1-L4' (resolved, not the alias)."""
    if level_selector.lower() == "all":
        return "all"
    levels = cd.parse_level_selector(level_selector)
    if not levels:
        return level_selector
    return levels[0] if len(levels) == 1 else f"{levels[0]}-{levels[-1]}"


def render_tier1(cards: list[dict], level_selector: str) -> Path:
    pages = cd.build_tier1_pages(cards)
    ctx = {
        "pages": pages,
        **_geometry_context(),
        **_fonts_context(),
        **_logo_context(),
    }
    html = _jinja_env().get_template("cards/tier1.html").render(**ctx)
    tag = _level_tag(level_selector)
    out_path = OUTPUT_DIR / "tier1" / f"sound_cards_tier1_premium_{tag}.pdf"
    debug_path = OUTPUT_DIR / "tier1" / f"_debug_tier1_{tag}.html"
    debug_path.write_text(html, encoding="utf-8")
    asyncio.run(html_to_pdf(html, out_path))
    print(f"  Tier 1: {len(cards)} cards -> {len(pages)} pages (front+back per card) -> {out_path}")
    return out_path


def render_tier2(cards: list[dict], level_selector: str) -> Path:
    sheets = cd.build_tier2_sheets(cards)
    positions = cd.tier2_cell_positions()
    ctx = {
        "sheets": sheets,
        "positions": positions,
        "sheet_w": cd.TIER2_SHEET_W,
        "sheet_h": cd.TIER2_SHEET_H,
        **_geometry_context(),
        **_fonts_context(),
        **_logo_context(),
    }
    html = _jinja_env().get_template("cards/tier2.html").render(**ctx)
    tag = _level_tag(level_selector)
    out_path = OUTPUT_DIR / "tier2" / f"sound_cards_tier2_printable_{tag}.pdf"
    debug_path = OUTPUT_DIR / "tier2" / f"_debug_tier2_{tag}.html"
    debug_path.write_text(html, encoding="utf-8")
    asyncio.run(html_to_pdf(html, out_path))
    print(f"  Tier 2: {len(cards)} cards -> {len(sheets)} A4 sheet(s) -> {out_path}")
    return out_path


def render_picture_words(picture_cards: list[dict], with_images: bool, level_selector: str) -> Path | None:
    if not picture_cards:
        return None
    if with_images:
        _attach_images(picture_cards, OUTPUT_DIR / "picture_words" / "images")
    sheets = cd.build_pw_sheets(picture_cards)
    positions = cd.pw_cell_positions()
    # Interior cut guides only (2026-07-10 fix) — never on the sheet's outer
    # edge, since cutting there does nothing (it's already the paper edge).
    margin_x = (cd.PW_SHEET_W - cd.PW_COLS * cd.PW_CARD_W) / 2
    margin_y = (cd.PW_SHEET_H - cd.PW_ROWS * cd.PW_CARD_H) / 2
    cut_line_x = margin_x + cd.PW_CARD_W
    cut_line_ys = [margin_y + r * cd.PW_CARD_H for r in range(1, cd.PW_ROWS)]
    ctx = {
        "sheets": sheets,
        "positions": positions,
        "sheet_w": cd.PW_SHEET_W,
        "sheet_h": cd.PW_SHEET_H,
        "card_w": cd.PW_CARD_W,
        "card_h": cd.PW_CARD_H,
        "cut_line_x": cut_line_x,
        "cut_line_ys": cut_line_ys,
        "pw_word_target_px": cd.PW_WORD_TARGET_PX,
        **_fonts_context(),
        **_logo_context(),
    }
    html = _jinja_env().get_template("cards/picture_words.html").render(**ctx)
    tag = _level_tag(level_selector)
    out_path = OUTPUT_DIR / "picture_words" / f"picture_word_cards_{tag}.pdf"
    debug_path = OUTPUT_DIR / "picture_words" / f"_debug_picture_words_{tag}.html"
    debug_path.write_text(html, encoding="utf-8")
    asyncio.run(html_to_pdf(html, out_path))
    print(f"  Picture words: {len(picture_cards)} cards -> {len(sheets) // 2} double-sided A4 sheet(s) -> {out_path}")
    return out_path


def render_ough(ough_cards: list[dict]) -> Path | None:
    if not ough_cards:
        return None
    ctx = {
        "cards": ough_cards,
        **_geometry_context(),
        **_fonts_context(),
        **_logo_context(),
    }
    html = _jinja_env().get_template("cards/ough.html").render(**ctx)
    out_path = OUTPUT_DIR / "ough_insert" / "ough_wildcard_insert.pdf"
    debug_path = OUTPUT_DIR / "ough_insert" / "_debug_ough.html"
    debug_path.write_text(html, encoding="utf-8")
    asyncio.run(html_to_pdf(html, out_path))
    print(f"  ough insert: {len(ough_cards)} cards -> {out_path}")
    return out_path


def main():
    parser = argparse.ArgumentParser(description="Generate MyPhonicsBooks sound cards PDFs.")
    parser.add_argument("--tier", choices=["1", "2", "pictures", "ough", "all"], default="all")
    parser.add_argument("--level", default="all", help=LEVELS_HELP)
    parser.add_argument("--with-images", action="store_true",
                         help="Generate/attach one illustration per picture-word card (costs "
                              "image credits). Omit to render with neutral placeholder boxes.")
    args = parser.parse_args()

    cards, ough_cards = cd.load_cards(args.level)
    picture_cards = cd.build_picture_word_cards(cards)
    print(f"Loaded {len(cards)} main-deck cards + {len(ough_cards)} ough-insert cards "
          f"({len(picture_cards)} L1-L2 picture-word cards) for level selector '{args.level}'.")

    if args.with_images:
        from generate_card_images import generate_missing_images
        generate_missing_images(picture_cards, OUTPUT_DIR / "picture_words" / "images")

    if args.tier in ("1", "all"):
        if cards:
            render_tier1(cards, args.level)
        else:
            print("  Tier 1: no main-deck cards match this level selector, skipping.")
    if args.tier in ("2", "all"):
        if cards:
            render_tier2(cards, args.level)
        else:
            print("  Tier 2: no main-deck cards match this level selector, skipping.")
    if args.tier in ("pictures", "all"):
        render_picture_words(picture_cards, args.with_images, args.level)
        if not picture_cards:
            print("  Picture words: no cards match this level selector (it's L1-L2 only), skipping.")
    if args.tier in ("ough", "all"):
        render_ough(ough_cards)
        if not ough_cards:
            print("  ough insert: no cards match this level selector (it's L8-only), skipping.")


if __name__ == "__main__":
    main()
