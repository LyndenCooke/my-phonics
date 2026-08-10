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
  2. BARCODE — the EAN-13 is repainted in native DeviceCMYK K-only, so it
              carries its own separation regardless of what the printer's RIP
              does with the rest of the page.  A K-only object inside an
              otherwise-RGB PDF is legal and passes through conversion
              untouched.
  3. BOXES  — MediaBox 154x216, TrimBox inset 3mm, so the printer (and our
              check scripts) know exactly where the trim line is.

NO GLOBAL CMYK CONVERSION (removed 2026-07-29, measured).  This script used to
run the whole book through Ghostscript ColorConversionStrategy=CMYK.  Every
strategy was tested on a real page and none is safe:

  fastcolor (what shipped)      max K = 0    — black text became 300%% CMY with
                                               NO black plate at all
  managed ICC                   max K = 200  — text became four-colour rich
                                               black (registration fringing on
                                               16-36pt reading text)
  +dBlackText/-dBlackVector     max K = 255  — forces EVERYTHING black: zero
                                               chromatic pixels left, every
                                               level-colour band turned into a
                                               black rectangle

There is no whole-document Ghostscript setting that yields K-only text AND live
colour.  Chromium cannot emit DeviceGray or CMYK either (it re-encodes even a
1-bit PNG as 8-bit RGB), so the renderer cannot own this.  The correct answer is
to supply RGB and let the printer's RIP convert with a real press profile that
does proper black generation — which is what Mixam and Bookvault both do — while
we guarantee the one element that must not be left to chance, the barcode.
Do not reintroduce to_cmyk() without re-measuring the K plate on a text page.

Output: output/books/print_masters/Level{n}/<same name>.pdf

After running, verify with:
    py -3.12 -X utf8 scripts/check_isbn_barcodes.py output/books/print_masters
    py -3.12 -X utf8 scripts/preflight_safe_margins.py

Usage:
    py -3.12 -X utf8 scripts/make_print_masters.py [pdf-or-folder ...]
"""

from __future__ import annotations

import shutil
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


def fix_barcode_k(pdf: Path) -> None:
    """Repaint the EAN-13 in native K-only DeviceCMYK.

    Chromium can only emit RGB, so the bars arrive as RGB black — and any
    RGB->CMYK conversion (ours or the printer's) is free to turn that into
    three- or four-colour black, which blurs on press and risks scan failure.
    So we white-out the printed area inside the barcode's white box and redraw
    every bar rect and text glyph at its exact original position with fill
    (0,0,0,1) — geometry unchanged, separation now pure K, and immune to
    whatever the RIP does to the rest of the page.  Fails loudly if no bars
    are found.

    Runs BEFORE add_bleed(): at that point the bars are still top-level page
    drawings.  After add_bleed() the original page is a nested Form XObject
    and get_drawings() no longer reaches them."""
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

    # BARS ONLY.  An earlier version also whited out the ISBN line and the
    # human-readable digits and re-inserted every glyph via insert_text() with
    # a K-only fill.  That worked, but PyMuPDF embeds the replacement Andika
    # UNSUBSETTED, and Bookvault's preflight flags it: "1 key font was
    # unembedded ('Unknown')" — on all 33 cover files, since the barcode lives
    # on the back cover.  The digits are decorative (scanners read the bars),
    # they are already pure RGB black from Chromium, and Ghostscript's
    # BlackText mapping sends RGB black text to the K plate anyway, so leaving
    # Chromium's own subsetted glyphs alone costs nothing and keeps every
    # cover's font table clean.  Only the bars — which actually have to scan —
    # get the native DeviceCMYK repaint.
    # Asymmetric pad: the human-readable digits now sit only TEXT_DISTANCE_MM
    # (0.5mm) below the bars, so a symmetric pad would shave their tops off —
    # and nothing redraws them any more.  Nothing sits directly below the bars
    # except that gap, and the redrawn bars land on the same rects, so a zero
    # bottom pad is safe.
    pad = 0.8 * MM
    cover = fitz.Rect(bbox.x0 - pad, bbox.y0 - pad, bbox.x1 + pad, bbox.y1)
    cover &= fitz.Rect(box.x0 + 0.3 * MM, box.y0 + 0.3 * MM,
                       box.x1 - 0.3 * MM, box.y1 - 0.3 * MM)
    page.draw_rect(cover, color=None, fill=(0, 0, 0, 0))       # paper white
    for r in bars:
        page.draw_rect(r, color=None, fill=(0, 0, 0, 1))       # 100%K bars
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
    """Trim-size RGB book -> press-ready 154x216 master.

    Order matters: the barcode is repainted K-only while it is still a
    top-level drawing, then the bled page is built around the finished
    interior, then the boxes are stamped."""
    dst_pdf.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        staged = Path(td) / "staged.pdf"
        shutil.copyfile(src_pdf, staged)
        fix_barcode_k(staged)
        add_bleed(staged, dst_pdf)
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
