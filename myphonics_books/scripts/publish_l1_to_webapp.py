"""
Copy regenerated PDFs into the web app and refresh their cover JPGs.

  output/books/Level{L}/{L}_{n} {title}.pdf  ->  public/book-pdfs/{L}_{n}.pdf
                                            ->  public/covers/{L}_{n}_cover.jpg  (page 1, ~150 DPI)

Existing covers are 875x1240 px (= 148x210mm at ~150 DPI), so we render at
matrix 2.085 to match.

Usage:
    py -3.12 scripts/publish_l1_to_webapp.py            # all levels
    py -3.12 scripts/publish_l1_to_webapp.py 1 3        # only the listed levels
"""
import re
import shutil
import sys
from pathlib import Path

import fitz  # PyMuPDF

BASE = Path(__file__).parent.parent          # myphonics_books/
ROOT = BASE.parent                            # myphonicsbooks/
DST_PDFS = ROOT / "public" / "book-pdfs"
DST_COVERS = ROOT / "public" / "covers"

COVER_ZOOM = 875 / 148 * 25.4 / 72            # ~2.085 -> 875x1240 px output

DST_PDFS.mkdir(parents=True, exist_ok=True)
DST_COVERS.mkdir(parents=True, exist_ok=True)


def publish_level(level: int) -> tuple[list[int], list[int]]:
    src_dir = BASE / "output" / "books" / f"Level{level}"
    if not src_dir.exists():
        print(f"Level{level}: no output folder, skipping")
        return [], []

    pat = re.compile(rf"^{level}_(\d+) .+\.pdf$")
    published: list[int] = []
    for pdf in sorted(src_dir.glob(f"{level}_*.pdf")):
        if "WATERMARKED" in pdf.name or pdf.name.startswith("debug_"):
            continue
        m = pat.match(pdf.name)
        if not m:
            continue
        n = int(m.group(1))

        dst_pdf = DST_PDFS / f"{level}_{n}.pdf"
        dst_cover = DST_COVERS / f"{level}_{n}_cover.jpg"

        shutil.copy2(pdf, dst_pdf)

        doc = fitz.open(pdf)
        pix = doc[0].get_pixmap(matrix=fitz.Matrix(COVER_ZOOM, COVER_ZOOM))
        pix.save(str(dst_cover), jpg_quality=88)
        doc.close()

        pdf_mb = dst_pdf.stat().st_size / 1024 / 1024
        cover_kb = dst_cover.stat().st_size / 1024
        print(f"  L{level}.{n:<2} -> {dst_pdf.name} ({pdf_mb:.1f} MB)  +  {dst_cover.name} ({cover_kb:.0f} KB, {pix.width}x{pix.height})")
        published.append(n)

    return published, []


if __name__ == "__main__":
    if len(sys.argv) > 1:
        levels = [int(a) for a in sys.argv[1:]]
    else:
        levels = [1, 2, 3, 4, 5, 6]

    grand_total = 0
    for lvl in levels:
        print(f"--- Level {lvl} ---")
        pub, _ = publish_level(lvl)
        grand_total += len(pub)
        print()

    print(f"Published {grand_total} books total.")
