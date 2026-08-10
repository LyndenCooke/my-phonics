"""Mixam print masters for the classroom-edition storybooks.

Takes the trim-size classroom PDFs (output/books/print_classroom/, rendered by
generate_pilot_books.py --isbn) and produces press-ready files:

  1. BLEED  — supplied size 154x216mm (A5 trim + 3mm all round).  The original
              page is placed at its exact size, vectors intact (the EAN-13
              barcode must never be rasterised or scaled).  The 3mm bleed ring
              is filled by edge-stretching: a 0.5mm sliver along each trim
              edge is rasterised at 300dpi and stretched outward, so coloured
              bands and full-bleed art continue past the trim line instead of
              leaving white flashes.  Only the ring — which the guillotine
              removes — is raster.
  2. CMYK   — Ghostscript pdfwrite, ColorConversionStrategy=CMYK with
              -dBlackText/-dBlackVector so pure-black text and the barcode
              bars stay 100%%K (never rich black), -dPDFSETTINGS=/prepress
              for print-quality image handling.
  3. BOXES  — MediaBox 154x216, TrimBox inset 3mm, so the printer (and our
              check scripts) know exactly where the trim line is.

Output: output/books/print_masters/Level{n}/<same name>.pdf

After running, verify with:
    py -3.12 -X utf8 scripts/check_isbn_barcodes.py output/books/print_masters
    py -3.12 -X utf8 scripts/preflight_safe_margins.py

Usage:
    py -3.12 -X utf8 scripts/make_print_masters.py [pdf-or-folder ...]
"""

from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import fitz  # PyMuPDF

BASE_DIR = Path(__file__).parent.parent
SRC_DIR = BASE_DIR / "output" / "books" / "print_classroom"
DST_DIR = BASE_DIR / "output" / "books" / "print_masters"

MM = 72 / 25.4
BLEED_MM = 3.0
SLIVER_MM = 0.5        # how much true page edge is sampled for the stretch
DPI = 300

GS = shutil.which("gswin64c") or shutil.which("gswin32c") or shutil.which("gs")


def add_bleed(src_pdf: Path, dst_pdf: Path) -> None:
    """154x216 pages: raster edge-stretch ring + untouched vector centre."""
    b = BLEED_MM * MM
    s = SLIVER_MM * MM
    zoom = fitz.Matrix(DPI / 72, DPI / 72)

    src = fitz.open(src_pdf)
    out = fitz.open()
    for page in src:
        w, h = page.rect.width, page.rect.height
        np_ = out.new_page(width=w + 2 * b, height=h + 2 * b)

        # (bleed target rect, source sliver clip) for 4 edges + 4 corners
        regions = [
            (fitz.Rect(0, b, b, b + h),             fitz.Rect(0, 0, s, h)),          # left
            (fitz.Rect(b + w, b, 2 * b + w, b + h), fitz.Rect(w - s, 0, w, h)),      # right
            (fitz.Rect(b, 0, b + w, b),             fitz.Rect(0, 0, w, s)),          # top
            (fitz.Rect(b, b + h, b + w, 2 * b + h), fitz.Rect(0, h - s, w, h)),      # bottom
            (fitz.Rect(0, 0, b, b),                 fitz.Rect(0, 0, s, s)),          # TL
            (fitz.Rect(b + w, 0, 2 * b + w, b),     fitz.Rect(w - s, 0, w, s)),      # TR
            (fitz.Rect(0, b + h, b, 2 * b + h),     fitz.Rect(0, h - s, s, h)),      # BL
            (fitz.Rect(b + w, b + h, 2 * b + w, 2 * b + h),
                                                    fitz.Rect(w - s, h - s, w, h)),  # BR
        ]
        for target, clip in regions:
            pix = page.get_pixmap(matrix=zoom, clip=clip)
            np_.insert_image(target, pixmap=pix)

        # the real page, vectors intact, at exact size — never scaled
        np_.show_pdf_page(fitz.Rect(b, b, b + w, b + h), src, page.number)

    out.save(dst_pdf, garbage=3, deflate=True)
    out.close()
    src.close()


def to_cmyk(src_pdf: Path, dst_pdf: Path) -> None:
    if GS is None:
        raise RuntimeError("Ghostscript not found on PATH")
    # NOTE: never add -dBlackText/-dBlackVector here — they FORCE all text
    # and vectors to black (they are monochrome-output flags, not black
    # preservation).  -dUseFastColor bypasses ICC rendering so neutral RGB
    # (R=G=B) converts by the classic formula to K-only — that is what keeps
    # the barcode bars 100%K instead of rich black.
    cmd = [GS, "-dBATCH", "-dNOPAUSE", "-dSAFER", "-sDEVICE=pdfwrite",
           "-dPDFSETTINGS=/prepress",
           "-sColorConversionStrategy=CMYK", "-dUseFastColor=true",
           "-o", str(dst_pdf), str(src_pdf)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"gs failed for {src_pdf.name}:\n{r.stderr[-2000:]}")


def fix_barcode_k(pdf: Path) -> None:
    """Repaint the EAN-13 in native K-only CMYK.

    Ghostscript's RGB->CMYK conversion (any strategy we tested) turns the
    RGB-black bars into four-colour black, which blurs on press and risks
    scan failure.  So after conversion we white-out the printed area inside
    the barcode's white box and redraw every bar rect and text glyph at its
    exact original position with fill (0,0,0,1) — geometry unchanged,
    separation now pure K.  Fails loudly if no bars are found."""
    from check_isbn_barcodes import barcode_bars, trim_rect, white_box

    font = BASE_DIR / "assets" / "fonts" / "Andika-Regular.ttf"
    doc = fitz.open(pdf)
    page = doc[-1]
    trim = trim_rect(page)
    bars = barcode_bars(page, trim)
    if not bars:
        doc.close()
        raise RuntimeError(f"{pdf.name}: no barcode bars found to repaint")
    bbox = fitz.Rect(bars[0])
    for b in bars[1:]:
        bbox |= b
    box = white_box(page, bbox)
    if box is None:
        doc.close()
        raise RuntimeError(f"{pdf.name}: no white box behind the bars")

    # every text glyph inside the box (the ISBN line + the digits), with the
    # union of their font boxes so the white-out covers all old ink
    chars = []
    ink = fitz.Rect(bbox)
    for block in page.get_text("rawdict")["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block["lines"]:
            for span in line["spans"]:
                for ch in span["chars"]:
                    r = fitz.Rect(ch["bbox"])
                    if not box.contains(r):
                        continue
                    chars.append((ch["origin"], ch["c"], span["size"]))
                    ink |= r

    pad = 0.8 * MM
    cover = fitz.Rect(ink.x0 - pad, ink.y0 - pad, ink.x1 + pad, ink.y1 + pad)
    cover &= fitz.Rect(box.x0 + 0.3 * MM, box.y0 + 0.3 * MM,
                       box.x1 - 0.3 * MM, box.y1 - 0.3 * MM)
    page.draw_rect(cover, color=None, fill=(0, 0, 0, 0))       # paper white
    for r in bars:
        page.draw_rect(r, color=None, fill=(0, 0, 0, 1))       # 100%K bars
    for (ox, oy), c, size in chars:
        if c.strip():
            page.insert_text((ox, oy), c, fontsize=size,
                             fontname="AndikaKOnly", fontfile=str(font),
                             color=(0, 0, 0, 1))
    doc.saveIncr()
    doc.close()


def set_boxes(pdf: Path) -> None:
    """TrimBox = supplied page inset 3mm (gs pdfwrite drops page boxes)."""
    b = BLEED_MM * MM
    doc = fitz.open(pdf)
    for page in doc:
        r = page.mediabox
        doc.xref_set_key(
            page.xref, "TrimBox",
            f"[{r.x0 + b:.2f} {r.y0 + b:.2f} {r.x1 - b:.2f} {r.y1 - b:.2f}]")
    doc.saveIncr()
    doc.close()


def make_master(src_pdf: Path, dst_pdf: Path) -> None:
    dst_pdf.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        bled = Path(td) / "bled.pdf"
        add_bleed(src_pdf, bled)
        to_cmyk(bled, dst_pdf)
    fix_barcode_k(dst_pdf)
    set_boxes(dst_pdf)


def main() -> int:
    args = [Path(a).resolve() for a in sys.argv[1:] if not a.startswith("-")]
    pdfs = []
    for a in (args or [SRC_DIR]):
        pdfs += sorted(a.rglob("*.pdf")) if a.is_dir() else [a]
    pdfs = [p for p in pdfs if not p.name.startswith("debug")]
    if not pdfs:
        print(f"No classroom PDFs found (looked in {SRC_DIR})")
        return 1

    failed = 0
    for p in pdfs:
        rel = p.relative_to(SRC_DIR) if p.is_relative_to(SRC_DIR) else Path(p.name)
        dst = DST_DIR / rel
        try:
            make_master(p, dst)
            print(f"OK   {rel}  ({dst.stat().st_size / 1e6:.1f} MB)")
        except Exception as e:
            failed += 1
            print(f"FAIL {rel}: {e}")
    print(f"\n{len(pdfs) - failed}/{len(pdfs)} masters -> {DST_DIR}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
