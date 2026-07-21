"""Mixam safe-margin preflight: text and furniture >= 5mm from the trim edge.

Runs over the print masters (output/books/print_masters/ by default).  The
trim line comes from each page's TrimBox (set by make_print_masters.py); on
trim-size PDFs the page edge itself is the trim.

Rules per page:
  * TEXT   — every word's bbox must sit fully inside the 5mm safe zone.
             Text is never allowed to bleed.
  * IMAGES — an image that crosses the safe line is a violation UNLESS it
             also extends past the trim line (then it's full-bleed art /
             the bleed ring, which is allowed by design).

Exit code != 0 on any violation.  Usage:
    py -3.12 -X utf8 scripts/preflight_safe_margins.py [pdf-or-folder ...]
"""

from __future__ import annotations

import sys
from pathlib import Path

import fitz

BASE_DIR = Path(__file__).parent.parent
MASTERS = BASE_DIR / "output" / "books" / "print_masters"

MM = 72 / 25.4
SAFE_MM = 5.0
TOL = 0.15 * MM          # measurement tolerance


def trim_rect(page: fitz.Page) -> fitz.Rect:
    """TrimBox in fitz (top-left origin) coords; page rect if unset."""
    try:
        tb, mb = page.trimbox, page.mediabox
    except Exception:
        return page.rect
    if tb == mb:
        return page.rect
    return fitz.Rect(tb.x0 - mb.x0, mb.y1 - tb.y1,
                     tb.x1 - mb.x0, mb.y1 - tb.y0)


def check_page(page: fitz.Page) -> list[str]:
    trim = trim_rect(page)
    safe = trim + (SAFE_MM * MM, SAFE_MM * MM, -SAFE_MM * MM, -SAFE_MM * MM)
    slack = fitz.Rect(safe.x0 - TOL, safe.y0 - TOL, safe.x1 + TOL, safe.y1 + TOL)
    probs = []

    # Text: measure from the glyph baselines, not the font's line box — the
    # line box carries ~25% empty leading above and below the ink, which at
    # display sizes (36pt tracing letters) false-flags text whose visible ink
    # is comfortably inside the safe zone.  0.8em above / 0.25em below the
    # baseline brackets Andika's caps, ascenders and descenders.
    for block in page.get_text("rawdict")["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block["lines"]:
            for span in line["spans"]:
                size = span["size"]
                r = None
                text = ""
                for ch in span["chars"]:
                    text += ch["c"]
                    if ch["c"].strip() == "":
                        continue
                    oy = ch["origin"][1]
                    # only glyphs that actually descend get the below-baseline
                    # allowance; everything else's ink stops at the baseline
                    desc = 0.25 if ch["c"] in "gjpqy@Qç,;()[]{}$" else 0.05
                    cr = fitz.Rect(ch["bbox"][0], oy - 0.8 * size,
                                   ch["bbox"][2], oy + desc * size)
                    r = cr if r is None else r | cr
                if r is None or slack.contains(r):
                    continue
                edges = []
                if r.x0 < slack.x0: edges.append(f"left {(r.x0 - trim.x0) / MM:.1f}mm")
                if r.x1 > slack.x1: edges.append(f"right {(trim.x1 - r.x1) / MM:.1f}mm")
                if r.y0 < slack.y0: edges.append(f"top {(r.y0 - trim.y0) / MM:.1f}mm")
                if r.y1 > slack.y1: edges.append(f"bottom {(trim.y1 - r.y1) / MM:.1f}mm")
                probs.append(f"text {text.strip()[:24]!r} "
                             f"at {', '.join(edges)} from trim")

    for info in page.get_image_info():
        r = fitz.Rect(info["bbox"])
        if slack.contains(r):
            continue                       # fully inside safe zone: fine
        if (r.x0 <= trim.x0 + TOL or r.y0 <= trim.y0 + TOL
                or r.x1 >= trim.x1 - TOL or r.y1 >= trim.y1 - TOL):
            continue                       # reaches/passes trim: full-bleed art
        probs.append(f"image {r.width / MM:.0f}x{r.height / MM:.0f}mm "
                     f"inside trim but crossing the 5mm safe line")
    return probs


def main() -> int:
    args = [Path(a) for a in sys.argv[1:] if not a.startswith("-")]
    pdfs = []
    for a in (args or [MASTERS]):
        pdfs += sorted(a.rglob("*.pdf")) if a.is_dir() else [a]
    pdfs = [p for p in pdfs if not p.name.startswith("debug")]
    if not pdfs:
        print(f"No PDFs found (looked in {MASTERS})")
        return 1

    total = 0
    for pdf in pdfs:
        doc = fitz.open(pdf)
        book_probs = []
        if doc.page_count % 4 != 0:
            book_probs.append(f"  extent {doc.page_count}pp is not a multiple "
                              "of 4 (saddle-stitch impossible)")
        for page in doc:
            for prob in check_page(page):
                book_probs.append(f"  p{page.number + 1}: {prob}")
        doc.close()
        status = "PASS" if not book_probs else f"FAIL ({len(book_probs)})"
        print(f"{status:9} {pdf.name}")
        for line in book_probs[:12]:
            print(line)
        if len(book_probs) > 12:
            print(f"  ... and {len(book_probs) - 12} more")
        total += len(book_probs)

    print(f"\n{total} violation(s) across {len(pdfs)} PDFs")
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main())
