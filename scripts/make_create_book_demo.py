"""Rasterise a published book PDF into the page images used by the
turn-the-pages preview on /create-book (src/pages/CreateBook.tsx).

The preview must always show a CURRENT book: `public/book-pages/` is a stale
June-2026 render under the old level ids, so the demo is built straight from
the published PDF in `public/book-pdfs/` instead.

Usage:
    py -3.12 scripts/make_create_book_demo.py            # default book
    py -3.12 scripts/make_create_book_demo.py 3_1        # a different book

Re-run whenever the featured book is re-published, then commit the JPEGs.
"""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

import fitz  # PyMuPDF

ROOT = Path(__file__).resolve().parents[1]
PDF_DIR = ROOT / "public" / "book-pdfs"
OUT_DIR = ROOT / "public" / "create-book-demo"

DEFAULT_BOOK = "2_2"  # Level 4 · "Hot Food, Cool Moon"
PAGE_WIDTH_PX = 640  # ~2.8x the 230px on-screen page — sharp on retina, small
JPEG_QUALITY = 78


def main() -> int:
    book = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_BOOK
    pdf_path = PDF_DIR / f"{book}.pdf"
    if not pdf_path.exists():
        print(f"No such published book: {pdf_path}")
        return 1

    doc = fitz.open(pdf_path)
    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)
    OUT_DIR.mkdir(parents=True)

    total = 0
    for i, page in enumerate(doc, start=1):
        zoom = PAGE_WIDTH_PX / page.rect.width
        pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom))
        out = OUT_DIR / f"p{i}.jpg"
        pix.pil_save(out, format="JPEG", quality=JPEG_QUALITY, optimize=True)
        total += out.stat().st_size

    print(
        f"{book}: {doc.page_count} pages -> {OUT_DIR.relative_to(ROOT)} "
        f"({total / 1024 / 1024:.1f} MB total)"
    )
    print("Set DEMO_BOOK in src/pages/CreateBook.tsx to match the page count.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
