"""Split the print masters into the artwork files Bookvault asks for.

Bookvault takes a book as SEPARATE cover and text files (Sizing Calculator,
Saddle Stitch / 115gsm Coated / Self Cover / A5, 2026-08-05):

  cover  303 x 216 mm   back and front side by side, 0mm spine, 3mm bleed
  text   154 x 216 mm   everything else, 3mm bleed

The cover file carries the two OUTSIDE faces only.  Confirmed by Bookvault's
own validator on 8.3 (2026-08-05): "The file supplied contained 20 pages when
it was meant to contain 18" — i.e. total minus 2, not minus 4.  The inside
front and inside back covers are ordinary TEXT pages, which is exactly what
we want: no content is lost and nothing needs relaying out.

  cover  =  p n (back)  |  p1 (front)
  text   =  p2 .. p n-1        (20pp -> 18pp,  16pp -> 14pp)

Keeping p n out of the text file also keeps the barcode repaint's non-subset
'Andika Regular' out of it — that is the font Bookvault flagged as
unembedded.  It still rides on the COVER file; if the cover upload fails font
validation, that is where to look.

GEOMETRY.  Pages are placed at 1:1 with NO scaling.  The masters trim at
148.17 x 209.89 rather than a nominal 148 x 210, and correcting that would
mean a non-uniform scale — which is exactly what stretches an EAN-13 and
fails check_isbn_barcodes.py.  A sub-0.2mm difference sits deep inside the
3mm bleed and is guillotined away, so 1:1 is both safer and more accurate.

The 1mm Bookvault adds over a plain 2-up (303, not 296+6) is treated as a
centre gap and filled by the neighbouring pages' own bleed.

Usage:
    py -3.12 -X utf8 scripts/split_for_bookvault.py [pdf-or-folder ...]

Writes output/bookvault/files/<book id>/{cover,text}.pdf
Uploads nothing.
"""

from __future__ import annotations

import sys
from pathlib import Path

import fitz  # PyMuPDF

BASE_DIR = Path(__file__).parent.parent
SRC_DIR = BASE_DIR / "output" / "books" / "print_masters"
OUT_DIR = BASE_DIR / "output" / "bookvault" / "files"

MM = 72 / 25.4
COVER_W_MM, COVER_H_MM = 303.0, 216.0
SPINE_MID_MM = COVER_W_MM / 2          # 151.5 — where the two halves meet
BLEED_MM = 3.0


def _spread(out: fitz.Document, src: fitz.Document,
            left_pno: int, right_pno: int) -> None:
    """One 303x216 cover sheet: left page then right page, butted at centre.

    Each source page is clipped at the centre line so its bleed cannot paint
    over its neighbour's trim area, then placed 1:1."""
    page = out.new_page(width=COVER_W_MM * MM, height=COVER_H_MM * MM)
    src_rect = src[left_pno].rect
    src_h = src_rect.height

    # vertical: centre the (slightly short) source in the 216mm sheet so the
    # tiny difference falls inside the bleed at both edges rather than one
    dy = (COVER_H_MM * MM - src_h) / 2

    # LEFT (back cover / inside front): trim starts at 3mm, so the page's
    # own left bleed lands at x=0. Clip away everything past the centre.
    clip = fitz.Rect(0, 0, SPINE_MID_MM * MM, src_h)
    page.show_pdf_page(fitz.Rect(0, dy, SPINE_MID_MM * MM, dy + src_h),
                       src, left_pno, clip=clip)

    # RIGHT (front cover / inside back): its trim must start at the centre
    # plus the half-gap, so we drop the part of the page left of that.
    keep_from = src_rect.width - SPINE_MID_MM * MM
    clip = fitz.Rect(keep_from, 0, src_rect.width, src_h)
    page.show_pdf_page(
        fitz.Rect(SPINE_MID_MM * MM, dy, COVER_W_MM * MM, dy + src_h),
        src, right_pno, clip=clip)


def split(master: Path, out_dir: Path) -> dict:
    src = fitz.open(master)
    n = src.page_count
    if n < 8 or n % 4:
        src.close()
        raise ValueError(f"{master.name}: {n} pages — not a saddle-stitch total")

    out_dir.mkdir(parents=True, exist_ok=True)

    cover = fitz.open()
    _spread(cover, src, left_pno=n - 1, right_pno=0)           # back | front
    cover.save(out_dir / "cover.pdf", garbage=3, deflate=True)
    cover.close()

    # stale output from the earlier 4-face split, so nothing wrong gets uploaded
    for old in ("cover_outside.pdf", "cover_inside.pdf"):
        (out_dir / old).unlink(missing_ok=True)

    text = fitz.open()
    text.insert_pdf(src, from_page=1, to_page=n - 2)           # p2 .. p n-1
    interior_pages = text.page_count
    text.save(out_dir / "text.pdf", garbage=3, deflate=True)
    text.close()
    src.close()

    if interior_pages != n - 2:
        raise ValueError(f"{master.name}: text came out {interior_pages}pp")
    return {"total": n, "interior": interior_pages}


def main() -> int:
    argv = sys.argv[1:]
    out_root = OUT_DIR
    if "--out" in argv:
        i = argv.index("--out")
        out_root = Path(argv[i + 1]).resolve()
        argv = [a for j, a in enumerate(argv) if j not in (i, i + 1)]
    args = [Path(a).resolve() for a in argv if not a.startswith("-")]
    pdfs = []
    for a in (args or [SRC_DIR]):
        pdfs += sorted(a.rglob("*.pdf")) if a.is_dir() else [a]
    pdfs = [p for p in pdfs if not p.name.startswith("debug")]
    if not pdfs:
        print(f"No print masters found (looked in {SRC_DIR})")
        return 1

    failed = 0
    for p in pdfs:
        book_id = p.stem.split(" ")[0].replace("_", ".")
        try:
            info = split(p, out_root / book_id)
            print(f"OK   {book_id:>4}  {info['total']}pp master -> "
                  f"cover + {info['interior']}pp text   {p.stem}")
        except Exception as e:
            failed += 1
            print(f"FAIL {book_id}: {e}")

    print(f"\n{len(pdfs) - failed}/{len(pdfs)} split -> {out_root}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
