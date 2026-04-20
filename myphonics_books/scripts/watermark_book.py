"""
Watermark a MyPhonicsBooks PDF for a specific buyer — minimal version.

Adds:
  1. A single-line buyer email stamp at the bottom of the Guide for Grown-Ups page (page 2)
  2. Invisible buyer UUID + email in PDF metadata (/Info dict)

Everything else about the book is preserved exactly as designed.

Usage:
    py -3.12 scripts/watermark_book.py
"""

from __future__ import annotations
import io
import uuid
from datetime import datetime, timezone
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

# ── Demo config ─────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent
SRC_PDF = ROOT / "output" / "books" / "Level1" / "1_1 Tap Tap Tap.pdf"
OUT_PDF = ROOT / "output" / "books" / "Level1" / "1_1 Tap Tap Tap — WATERMARKED PREVIEW.pdf"

# Buyer data (demo values — replace per-order at edge function time)
BUYER_EMAIL = "jane.smith@example.com"
BOOK_TITLE = "Tap! Tap! Tap!"
BUYER_UUID = str(uuid.uuid4())
PURCHASE_DATE = datetime.now(timezone.utc).strftime("%d %B %Y")

# Which page carries the visible stamp. Page 2 = Guide for Grown-Ups in the
# standard MPB 16-page layout (index 1 after the cover).
GUIDE_PAGE_INDEX = 1


def build_footer_overlay(page_width: float, page_height: float) -> bytes:
    """
    Tiny single-line footer: email only, in mid-grey, centred at the bottom of
    the Guide for Grown-Ups page. No box, no strip, no colour fill. Reads as a
    legal footer, not a watermark.
    """
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=(page_width, page_height))
    c.setFillColorRGB(0.55, 0.55, 0.55)     # mid-grey — same register as standard copyright lines
    c.setFont("Helvetica", 6.5)
    line = f"Personal licence: {BUYER_EMAIL} · purchased {PURCHASE_DATE} · not for resale"
    c.drawCentredString(page_width / 2, 4 * mm, line)
    c.showPage()
    c.save()
    buf.seek(0)
    return buf.getvalue()


def watermark(src: Path, out: Path) -> None:
    reader = PdfReader(str(src))
    writer = PdfWriter()

    for i, page in enumerate(reader.pages):
        if i == GUIDE_PAGE_INDEX:
            w = float(page.mediabox.width)
            h = float(page.mediabox.height)
            overlay = PdfReader(io.BytesIO(build_footer_overlay(w, h)))
            page.merge_page(overlay.pages[0])
        writer.add_page(page)

    # Invisible layer: buyer metadata embedded in every PDF's /Info dict.
    # Survives text copy-paste, screenshot of individual pages, and most casual
    # scrubbing. Viewable in Acrobat > File > Properties.
    writer.add_metadata({
        "/Title": BOOK_TITLE,
        "/Author": "MyPhonicsBooks",
        "/Subject": f"Licensed to {BUYER_EMAIL}",
        "/Keywords": f"licence:{BUYER_UUID};buyer:{BUYER_EMAIL};purchased:{PURCHASE_DATE}",
        "/Creator": "MyPhonicsBooks",
        "/Producer": f"MPB-LIC-{BUYER_UUID}",
    })

    with open(out, "wb") as f:
        writer.write(f)

    size_kb = out.stat().st_size // 1024
    print(f"Wrote {out.name} ({size_kb:,} KB)")
    print("  Visible  : single-line footer on page 2 (Guide for Grown-Ups)")
    print("  Invisible: buyer UUID + email in PDF /Info metadata")
    print(f"  Buyer UUID: {BUYER_UUID}")


if __name__ == "__main__":
    if not SRC_PDF.exists():
        raise SystemExit(f"Source PDF not found: {SRC_PDF}")
    watermark(SRC_PDF, OUT_PDF)
