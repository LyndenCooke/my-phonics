"""
Impose A5-portrait phonics PDFs as A4-landscape 2-up duplex saddle-stitch booklets.

Each output PDF page is one side of one A4 sheet, with two A5 pages placed
side-by-side in saddle-stitch order. A parent prints "double-sided, flip on
short edge, no scaling", folds the stack in half, and gets a finished booklet.

Page-count math:
  16-page book -> 4 A4 sheets -> 8 imposed PDF pages -> 4 days at 1 sheet/day
  20-page book -> 5 A4 sheets -> 10 imposed PDF pages -> 5 days at 1 sheet/day

Imposition order for an N-page book (N must be a multiple of 4):
  Sheet i (0-indexed) of S = N//4 total sheets
    Front: left = N - 2i,  right = 1 + 2i
    Back:  left = 2 + 2i,  right = N - 1 - 2i

Usage:
  py -3.12 scripts/make_printable_booklet.py output/books/Level1/"1_1 Tap Tap Tap.pdf"
  py -3.12 scripts/make_printable_booklet.py --all
  py -3.12 scripts/make_printable_booklet.py --level 1
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parent.parent
BOOKS_DIR = ROOT / "output" / "books"

A5_W_PT = 148 / 25.4 * 72
A5_H_PT = 210 / 25.4 * 72
A4L_W_PT = 297 / 25.4 * 72
A4L_H_PT = 210 / 25.4 * 72


def saddle_stitch_order(n_pages: int) -> list[tuple[int, int]]:
    if n_pages % 4 != 0:
        raise ValueError(f"page count must be multiple of 4, got {n_pages}")
    pairs: list[tuple[int, int]] = []
    sheets = n_pages // 4
    for i in range(sheets):
        pairs.append((n_pages - 2 * i, 1 + 2 * i))
        pairs.append((2 + 2 * i, n_pages - 1 - 2 * i))
    return pairs


def impose(input_pdf: Path, output_pdf: Path) -> int:
    src = fitz.open(str(input_pdf))
    try:
        n = len(src)
        order = saddle_stitch_order(n)
        out = fitz.open()
        try:
            left_rect = fitz.Rect(0, 0, A4L_W_PT / 2, A4L_H_PT)
            right_rect = fitz.Rect(A4L_W_PT / 2, 0, A4L_W_PT, A4L_H_PT)
            for left_pg, right_pg in order:
                page = out.new_page(width=A4L_W_PT, height=A4L_H_PT)
                page.show_pdf_page(left_rect, src, left_pg - 1)
                page.show_pdf_page(right_rect, src, right_pg - 1)
            output_pdf.parent.mkdir(parents=True, exist_ok=True)
            out.save(str(output_pdf), garbage=4, deflate=True)
        finally:
            out.close()
    finally:
        src.close()
    return n


def printable_path_for(input_pdf: Path) -> Path:
    return input_pdf.with_name(f"{input_pdf.stem} - Printable Booklet.pdf")


def discover_books(level: int | None = None) -> list[Path]:
    if level is not None:
        dirs = [BOOKS_DIR / f"Level{level}"]
    else:
        dirs = sorted(BOOKS_DIR.glob("Level*"))
    out: list[Path] = []
    for d in dirs:
        if not d.is_dir():
            continue
        for pdf in sorted(d.glob("*.pdf")):
            name = pdf.name
            if "Printable Booklet" in name:
                continue
            if "WATERMARKED" in name:
                continue
            if name.startswith("debug_"):
                continue
            out.append(pdf)
    return out


def process(pdfs: list[Path]) -> None:
    if not pdfs:
        print("No PDFs to process.")
        return
    failures: list[tuple[Path, str]] = []
    for src in pdfs:
        dst = printable_path_for(src)
        try:
            n = impose(src, dst)
            size_kb = dst.stat().st_size / 1024
            print(f"  OK  {src.name}  ({n}pp)  ->  {dst.name}  [{size_kb:.0f} KB]")
        except Exception as exc:
            failures.append((src, str(exc)))
            print(f"  ERR {src.name}: {exc}")
    print()
    print(f"Done. {len(pdfs) - len(failures)}/{len(pdfs)} succeeded.")
    if failures:
        print("Failures:")
        for src, msg in failures:
            print(f"  - {src.name}: {msg}")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("inputs", nargs="*", type=Path, help="specific PDF(s) to impose")
    ap.add_argument("--all", action="store_true", help="process every book in output/books/Level*/")
    ap.add_argument("--level", type=int, help="process every book in a single level")
    args = ap.parse_args()

    if args.all and args.level:
        ap.error("use --all or --level, not both")

    if args.inputs:
        pdfs = [p.resolve() for p in args.inputs]
    elif args.level is not None:
        pdfs = discover_books(args.level)
    elif args.all:
        pdfs = discover_books()
    else:
        ap.error("supply input file(s), --all, or --level N")

    process(pdfs)
    return 0


if __name__ == "__main__":
    sys.exit(main())
