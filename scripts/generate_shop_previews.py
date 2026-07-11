"""Generate teaser "peek inside" preview images for the physical shop.

Rasterises a SUBSET of interior pages from the real print PDFs so the /shop
product detail can show a flip-through, without giving the whole thing away
free. The final teaser page(s) are blurred in Pillow (baked in, so the blur
cannot be removed in devtools) and the UI overlays a lock on the last one.

Output: public/shop/preview/<sku>/...
  Books/workbooks:  p1.webp ... pN.webp   (page images, last ones blurred)
  Card decks:       c{k}-front.webp / c{k}-back.webp   (per teaser card)

Run:  py -3.12 scripts/generate_shop_previews.py [books|workbooks|cards]
Requires: PyMuPDF (fitz), Pillow with WebP support.
"""

from __future__ import annotations

import glob
import io
import os
import sys

import fitz  # PyMuPDF
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOOKS_DIR = os.path.join(ROOT, "myphonics_books", "output", "books")
CARDS_TIER1 = os.path.join(
    ROOT, "myphonics_books", "output", "cards", "tier1",
    "sound_cards_tier1_premium_all.pdf",
)
WORD_CARDS_DIR = os.path.join(ROOT, "myphonics_books", "output", "word_cards")
PREVIEW_DIR = os.path.join(ROOT, "public", "shop", "preview")

BOOKS_PER_LEVEL = {1: 2, 2: 5, 3: 3, 4: 6, 5: 5, 6: 4, 7: 4, 8: 4}

# Workbook PDFs live in two folders: L1-L3 in output/, L4-L8 in "new booklets/".
WB_ENGINE = os.path.join(ROOT, "worksheet-engine", "output")
# The approved illustrated W2 covers (all 8); the PDFs only carry them if
# re-rendered after 2026-06-13, so use these for the preview's cover page.
W2_COVERS = os.path.join(ROOT, "worksheet-engine", "public", "covers", "w2")


def render_page(doc: fitz.Document, page: int, target_h: int,
                crop: fitz.Rect | None = None) -> Image.Image:
    pg = doc[page]
    rect = crop or pg.rect
    scale = target_h / rect.height
    pix = pg.get_pixmap(matrix=fitz.Matrix(scale, scale), clip=rect)
    return Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")


def save_webp(img: Image.Image, sku: str, name: str, quality: int = 78) -> None:
    d = os.path.join(PREVIEW_DIR, sku.lower().replace(".", "-"))
    os.makedirs(d, exist_ok=True)
    path = os.path.join(d, name)
    img.save(path, "WEBP", quality=quality, method=6)


def blur(img: Image.Image, radius: int = 9) -> Image.Image:
    """Bake a blur in so the page cannot be read (or un-blurred in devtools)."""
    return img.filter(ImageFilter.GaussianBlur(radius))


def find_book_pdf(level: int, index: int) -> str:
    pattern = os.path.join(BOOKS_DIR, f"Level{level}", f"{level}_{index} *.pdf")
    hits = [p for p in glob.glob(pattern) if "Printable" not in p]
    if not hits:
        raise FileNotFoundError(pattern)
    return hits[0]


def find_workbook_pdf(level: int) -> str | None:
    for base in (WB_ENGINE, os.path.join(WB_ENGINE, "new booklets")):
        p = os.path.join(base, f"workbook2__{level}.pdf")
        if os.path.exists(p):
            return p
    return None


def teaser_page_indices(n_pages: int) -> list[tuple[int, bool]]:
    """(0-based page, is_blurred) teaser set: cover, the two inside pages, one
    clear story page, then a blurred page near the back. Clamped to the book."""
    plan = [(0, False), (1, False), (2, False), (4, False), (n_pages - 2, True)]
    seen: set[int] = set()
    out: list[tuple[int, bool]] = []
    for idx, blurred in plan:
        idx = max(0, min(idx, n_pages - 1))
        if idx in seen:
            continue
        seen.add(idx)
        out.append((idx, blurred))
    return out


def book_preview(pdf_path: str, sku: str, target_h: int = 760,
                 cover_png: str | None = None) -> int:
    doc = fitz.open(pdf_path)
    pages = teaser_page_indices(len(doc))
    for i, (idx, blurred) in enumerate(pages, start=1):
        if i == 1 and cover_png and os.path.exists(cover_png):
            img = Image.open(cover_png).convert("RGB")
            img = img.resize((round(img.width * target_h / img.height), target_h), Image.LANCZOS)
        else:
            img = render_page(doc, idx, target_h)
            if blurred:
                img = blur(img)
        save_webp(img, sku, f"p{i}.webp")
    doc.close()
    return len(pages)


def card_preview_word(level: int, n_cards: int = 4) -> None:
    """Word deck: plain front (page 1 cell) + marked back (page 2 mirror cell).
    Grid is 2 cols x 4 rows; long-edge duplex mirrors columns."""
    path = os.path.join(WORD_CARDS_DIR, f"L{level}_sound_cards.pdf")
    doc = fitz.open(path)
    r = doc[0].rect
    cw, ch = r.width / 2, r.height / 4
    picks = [(0, 0), (0, 1), (1, 0), (1, 1)][:n_cards]
    for k, (row, col) in enumerate(picks, start=1):
        pad = 3
        front_cell = fitz.Rect(col * cw + pad, row * ch + pad, (col + 1) * cw - pad, (row + 1) * ch - pad)
        back_cell = fitz.Rect((1 - col) * cw + pad, row * ch + pad, (2 - col) * cw - pad, (row + 1) * ch - pad)
        save_webp(render_page(doc, 0, 300, front_cell), f"WC-L{level}", f"c{k}-front.webp", 84)
        save_webp(render_page(doc, 1, 300, back_cell), f"WC-L{level}", f"c{k}-back.webp", 84)
    doc.close()


def card_preview_sound(n_cards: int = 4) -> None:
    """Sound deck: one card per page, front = even page, back = odd page.
    Clip off the ~9mm bleed + crop marks to the 74x105mm card."""
    doc = fitz.open(CARDS_TIER1)
    r = doc[0].rect
    mx = (r.width - 74 * 72 / 25.4) / 2
    my = (r.height - 105 * 72 / 25.4) / 2
    card = fitz.Rect(mx, my, r.width - mx, r.height - my)
    for k in range(n_cards):
        save_webp(render_page(doc, 2 * k, 320, card), "SC-FULL", f"c{k + 1}-front.webp", 84)
        save_webp(render_page(doc, 2 * k + 1, 320, card), "SC-FULL", f"c{k + 1}-back.webp", 84)
    doc.close()


def main() -> None:
    only = sys.argv[1:] or None

    def want(name: str) -> bool:
        return only is None or name in only

    os.makedirs(PREVIEW_DIR, exist_ok=True)
    print("Generating shop previews ->", PREVIEW_DIR)

    if want("books"):
        for lv, n in BOOKS_PER_LEVEL.items():
            for i in range(1, n + 1):
                sku = f"R-L{lv}.{i}"
                pages = book_preview(find_book_pdf(lv, i), sku)
                print(f"  book {sku}: {pages} pages")

    if want("workbooks"):
        for lv in BOOKS_PER_LEVEL:
            pdf = find_workbook_pdf(lv)
            if not pdf:
                print(f"  workbook WB-L{lv}: PDF not found, skipped")
                continue
            cover = os.path.join(W2_COVERS, f"l{lv}.png")
            pages = book_preview(pdf, f"WB-L{lv}", cover_png=cover)
            print(f"  workbook WB-L{lv}: {pages} pages")

    if want("cards"):
        card_preview_sound()
        print("  card deck SC-FULL: 4 cards")
        for lv in BOOKS_PER_LEVEL:
            card_preview_word(lv)
            print(f"  word deck WC-L{lv}: 4 cards")

    print("Done.")


if __name__ == "__main__":
    main()
