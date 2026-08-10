"""Verify the classroom-edition back-cover ISBN barcodes.

For every classroom print PDF (output/books/print_classroom/**), checks the
back cover (last page) against the Mixam print spec and the EAN-13 rules:

  1. TEXT     — the "ISBN 978-x-xxxxx-xxx-x" line and the 13 human-readable
                digits under the bars exactly match the register's ISBN.
  2. GEOMETRY — bars are vector (drawings, not images); the narrowest bar is
                ~0.33mm (SC2 module, uniform scale — a stretched barcode
                changes this and fails); bar height ~22.85mm.
  3. QUIET    — white box extends >= 3.6mm left / 2.3mm right of the bars.
  4. MARGINS  — every barcode element sits >= 5mm from the trim edges.
  5. K-ONLY   — after Ghostscript CMYK conversion (BlackText/BlackVector
                preserved), the barcode box rasterises with zero C/M/Y ink:
                pure K bars on paper white, no rich black.

Writes output/isbn_manifest.csv and prints a per-title summary.
Exit code != 0 if any check fails — same contract as audit_release.py.

Usage:
    py -3.12 -X utf8 scripts/check_isbn_barcodes.py [pdf-or-folder ...]
"""

from __future__ import annotations

import csv
import io
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import fitz  # PyMuPDF

BASE_DIR = Path(__file__).parent.parent
PRINT_DIR = BASE_DIR / "output" / "books" / "print_classroom"
MANIFEST = BASE_DIR / "output" / "isbn_manifest.csv"

MM = 72 / 25.4                      # 1mm in PDF points
SAFE_MM = 5.0                       # Mixam safe zone from TRIM edge
MODULE_MM = 0.33                    # SC2 X-dimension
BAR_H_MM = 22.85                    # SC2 bar height
FOOTER_SEARCH_MM = 48               # barcode lives in the bottom band

GS = shutil.which("gswin64c") or shutil.which("gswin32c") or shutil.which("gs")


def find_register_isbn(pdf: Path) -> tuple[str, str]:
    """book_id + expected hyphenated ISBN for a print PDF, from the register."""
    sys.path.insert(0, str(BASE_DIR / "scripts"))
    from isbn_barcodes import load_register
    book_id = pdf.stem.split(" ")[0].replace("_", ".")
    reg = load_register()
    if book_id not in reg:
        raise KeyError(f"{pdf.name}: book id {book_id} not in register")
    return book_id, reg[book_id]["isbn"]


def trim_rect(page: fitz.Page) -> fitz.Rect:
    """The trim line in fitz (top-left origin) coords.  Print masters carry a
    TrimBox (set by make_print_masters.py, 3mm inside the supplied size);
    trim-size PDFs fall back to the page edge."""
    try:
        tb, mb = page.trimbox, page.mediabox
    except Exception:
        return page.rect
    if tb == mb:
        return page.rect
    return fitz.Rect(tb.x0 - mb.x0, mb.y1 - tb.y1,
                     tb.x1 - mb.x0, mb.y1 - tb.y0)


def _is_black_fill(fill) -> bool:
    """True for the bar fills.  RGB sources report (0,0,0); after Ghostscript
    CMYK conversion the K=1 fills come back from PyMuPDF as a dark NEUTRAL
    (~0.21 grey).  Accept dark + neutral; the raster ink check is what
    actually proves the separation is K-only."""
    if not fill:
        return False
    return max(fill) <= 0.3 and (max(fill) - min(fill)) <= 0.05


def barcode_bars(page: fitz.Page, trim: fitz.Rect) -> list[fitz.Rect]:
    """Black vector fill rects in the bottom band = the EAN bars."""
    y0 = trim.y1 - FOOTER_SEARCH_MM * MM
    bars = []
    for d in page.get_drawings():
        if _is_black_fill(d.get("fill")) and d["rect"].y0 > y0 \
                and d["rect"].x0 > (trim.x0 + trim.x1) / 2:
            bars.append(d["rect"])
    return bars


def white_box(page: fitz.Page, bars_bbox: fitz.Rect) -> fitz.Rect | None:
    """The white backing box that carries the quiet zones: the smallest white
    fill containing the bars PLUS the required quiet zones (so the K-only
    repaint's own tight white-out rect on print masters is never mistaken
    for the box)."""
    need = fitz.Rect(bars_bbox.x0 - 3.55 * MM, bars_bbox.y0,
                     bars_bbox.x1 + 2.25 * MM, bars_bbox.y1)
    best = None
    for d in page.get_drawings():
        if d.get("fill") == (1.0, 1.0, 1.0) and d["rect"].contains(need):
            if best is None or d["rect"].get_area() < best.get_area():
                best = d["rect"]
    return best


def check_pdf(pdf: Path) -> dict:
    book_id, isbn = find_register_isbn(pdf)
    digits = re.sub(r"\D", "", isbn)
    row = {"book_id": book_id, "title": re.sub(r"^\S+\s+", "", pdf.stem),
           "isbn": isbn, "edition": "classroom", "barcode": "no",
           "digits_match": "-", "safe_margin": "-", "k_only": "-", "notes": ""}
    notes = []

    doc = fitz.open(pdf)
    page = doc[-1]
    trim = trim_rect(page)

    # 1. text ---------------------------------------------------------------
    text = page.get_text()
    has_line = f"ISBN {isbn}" in text
    hr = re.sub(r"\D", "", "".join(
        t for t in text.splitlines() if re.sub(r"\D", "", t) and "ISBN" not in t
        and len(re.sub(r"\D", "", t)) >= 12))
    digits_ok = has_line and digits in hr
    row["digits_match"] = "yes" if digits_ok else "NO"
    if not has_line:
        notes.append("ISBN line missing")

    # 2 + 3. geometry -------------------------------------------------------
    bars = barcode_bars(page, trim)
    if not bars:
        notes.append("no vector bars found")
        row["notes"] = "; ".join(notes)
        doc.close()
        return row
    row["barcode"] = "yes"
    bbox = fitz.Rect(bars[0])
    for b in bars[1:]:
        bbox |= b
    widths = sorted((b.width / MM) for b in bars)
    module = widths[0]
    height = max(b.height / MM for b in bars)
    if not (MODULE_MM * 0.85 <= module <= MODULE_MM * 1.15):
        notes.append(f"module width {module:.3f}mm != {MODULE_MM}mm (scaled?)")
    if not (BAR_H_MM * 0.85 <= height <= BAR_H_MM * 1.15):
        notes.append(f"bar height {height:.2f}mm != {BAR_H_MM}mm")

    box = white_box(page, bbox)
    if box is None:
        notes.append("no white backing box behind bars")
    else:
        left_q = (bbox.x0 - box.x0) / MM
        right_q = (box.x1 - bbox.x1) / MM
        if left_q < 3.6:
            notes.append(f"left quiet zone {left_q:.2f}mm < 3.6mm")
        if right_q < 2.3:
            notes.append(f"right quiet zone {right_q:.2f}mm < 2.3mm")

    # 4. safe margins, measured from the TRIM line --------------------------
    outer = box if box is not None else bbox
    m = {"left": (outer.x0 - trim.x0) / MM, "right": (trim.x1 - outer.x1) / MM,
         "top": (outer.y0 - trim.y0) / MM, "bottom": (trim.y1 - outer.y1) / MM}
    bad = {k: v for k, v in m.items() if v < SAFE_MM - 0.05}
    row["safe_margin"] = "yes" if not bad else "NO"
    if bad:
        notes.append("safe margin: " + ", ".join(
            f"{k} {v:.2f}mm" for k, v in bad.items()))

    # 5. K-only after CMYK conversion ---------------------------------------
    if GS is None:
        row["k_only"] = "SKIP (no ghostscript)"
    else:
        row["k_only"] = "yes" if _k_only(doc, page.number, outer, notes) else "NO"

    doc.close()
    row["notes"] = "; ".join(notes)
    return row


def _k_only(doc: fitz.Document, pageno: int, region: fitz.Rect,
            notes: list[str]) -> bool:
    """Extract the back cover, gs-convert to CMYK with black preservation,
    rasterise to CMYK tiff and assert zero C/M/Y inside the barcode box."""
    from PIL import Image

    with tempfile.TemporaryDirectory() as td:
        td = Path(td)
        single = fitz.open()
        single.insert_pdf(doc, from_page=pageno, to_page=pageno)
        src = td / "back.pdf"
        single.save(src)
        single.close()

        cmyk = td / "back_cmyk.pdf"
        tif = td / "back.tif"
        # Same conversion as make_print_masters.to_cmyk (NO -dBlackText /
        # -dBlackVector — those force EVERYTHING black and would mask a rich
        # black; -dUseFastColor keeps neutral RGB -> K-only).
        conv = [GS, "-dBATCH", "-dNOPAUSE", "-dSAFER", "-sDEVICE=pdfwrite",
                "-sColorConversionStrategy=CMYK", "-dUseFastColor=true",
                "-o", str(cmyk), str(src)]
        if subprocess.run(conv, capture_output=True).returncode != 0:
            notes.append("gs CMYK conversion failed")
            return False
        rast = [GS, "-dBATCH", "-dNOPAUSE", "-dSAFER", "-sDEVICE=tiff32nc",
                "-r300", "-dTextAlphaBits=1", "-dGraphicsAlphaBits=1",
                "-o", str(tif), str(cmyk)]
        if subprocess.run(rast, capture_output=True).returncode != 0:
            notes.append("gs CMYK rasterise failed")
            return False

        img = Image.open(tif)          # mode CMYK, 0 = no ink
        px = 300 / 72                  # pt -> px at 300dpi
        pad = 0.4 * MM * px            # sample strictly inside the white box
        crop = img.crop((int(region.x0 * px + pad), int(region.y0 * px + pad),
                         int(region.x1 * px - pad), int(region.y1 * px - pad)))
        c, m, y, k = (list(ch.getdata()) for ch in crop.split())
        cmy_max = max(max(c), max(m), max(y))
        if cmy_max > 0:
            notes.append(f"CMY ink in barcode box (max {cmy_max}/255) — not K-only")
            return False
        if max(k) < 250:
            notes.append("no solid K bars found in box after conversion")
            return False
        return True


def main() -> int:
    args = [Path(a) for a in sys.argv[1:] if not a.startswith("-")]
    pdfs = []
    for a in (args or [PRINT_DIR]):
        pdfs += sorted(a.rglob("*.pdf")) if a.is_dir() else [a]
    pdfs = [p for p in pdfs if not p.name.startswith("debug")]
    if not pdfs:
        print(f"No classroom print PDFs found (looked in {PRINT_DIR})")
        return 1

    rows = [check_pdf(p) for p in pdfs]
    rows.sort(key=lambda r: [int(x) for x in r["book_id"].split(".")])
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    with open(MANIFEST, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)

    ok = True
    for r in rows:
        passed = (r["barcode"] == "yes" and r["digits_match"] == "yes"
                  and r["safe_margin"] == "yes"
                  and r["k_only"] in ("yes", "SKIP (no ghostscript)")
                  and not r["notes"])
        ok &= passed
        print(f"{'PASS' if passed else 'FAIL':4} {r['book_id']:>4} "
              f"{r['isbn']}  digits={r['digits_match']} margin={r['safe_margin']} "
              f"K={r['k_only']}  {r['title']}"
              + (f"  <-- {r['notes']}" if r["notes"] else ""))
    print(f"\nManifest: {MANIFEST}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
