"""Export website image assets from the rendered (8-level) book PDFs.

The app serves two sets of static images keyed by the books' LEGACY
parent-6 ids (Supabase rows are still legacy-tagged; the 8-level journey
is mapped at render time):

  public/covers/{old}_cover.jpg       - library/landing cover tiles
  public/book-pages/{old}/p{N}.jpg    - page screenshots for BookReader

Both were last exported from the pre-realignment renders, so they still
show the old level colours and names. This script re-rasterises them from
the current output/books/Level{1-8} PDFs (which carry the new ledger
colours), translating new ids back to the legacy keys the app requests.

  py -3.12 scripts/export_web_assets.py            # all books
  py -3.12 scripts/export_web_assets.py 2.1 3.3    # specific new ids
"""
from __future__ import annotations

import sys
from pathlib import Path

import fitz  # PyMuPDF

REPO_ROOT = Path(__file__).resolve().parents[2]
BOOKS_DIR = REPO_ROOT / "myphonics_books" / "output" / "books"
COVERS_DIR = REPO_ROOT / "public" / "covers"
PAGES_DIR = REPO_ROOT / "public" / "book-pages"

# New (8-level) id -> original asset/app id. Mirror of NEW_TO_OLD in
# generate_pilot_books.py - keep in sync.
NEW_TO_OLD = {
    "1.1": "1.1", "1.2": "1.2",
    "2.1": "1.4", "2.2": "1.5", "2.3": "1.6", "2.4": "1.7", "2.5": "1.8",
    "3.1": "1.3", "3.2": "1.9", "3.3": "1.10",
    "4.1": "2.1", "4.2": "2.2", "4.3": "2.3", "4.4": "2.4", "4.5": "2.5", "4.6": "2.6",
    "5.1": "3.1", "5.2": "3.2", "5.3": "3.3", "5.4": "3.4", "5.5": "3.5",
    "6.1": "4.1", "6.2": "4.2", "6.3": "4.3", "6.4": "4.4",
    "7.1": "5.1", "7.2": "5.2", "7.3": "5.3", "7.4": "5.4",
    "8.1": "6.1", "8.2": "6.2", "8.3": "6.3", "8.4": "6.4",
}

# Match the existing site assets' pixel sizes (A5 = 419.5pt wide):
#   covers     876px wide  -> zoom ~2.09
#   page jpgs  840px wide  -> zoom ~2.00
COVER_ZOOM = 876 / 419.53
PAGE_ZOOM = 840 / 419.53
JPEG_QUALITY = 85


def find_pdf(new_id: str) -> Path | None:
    level = new_id.split(".")[0]
    stem = new_id.replace(".", "_")
    folder = BOOKS_DIR / f"Level{level}"
    candidates = [
        p for p in folder.glob(f"{stem} *.pdf") if "Printable" not in p.name
    ]
    return candidates[0] if candidates else None


def export_book(new_id: str, old_id: str) -> bool:
    pdf_path = find_pdf(new_id)
    if not pdf_path:
        print(f"MISSING PDF for {new_id} (old {old_id})")
        return False

    old_key = old_id.replace(".", "_")
    doc = fitz.open(pdf_path)

    # Cover
    COVERS_DIR.mkdir(parents=True, exist_ok=True)
    pix = doc[0].get_pixmap(matrix=fitz.Matrix(COVER_ZOOM, COVER_ZOOM))
    pix.save(COVERS_DIR / f"{old_key}_cover.jpg", jpg_quality=JPEG_QUALITY)

    # Pages - clear the folder first so a shorter book doesn't leave stale
    # trailing pages behind.
    page_dir = PAGES_DIR / old_key
    page_dir.mkdir(parents=True, exist_ok=True)
    for stale in page_dir.glob("p*.jpg"):
        stale.unlink()
    for i, page in enumerate(doc, start=1):
        pix = page.get_pixmap(matrix=fitz.Matrix(PAGE_ZOOM, PAGE_ZOOM))
        pix.save(page_dir / f"p{i}.jpg", jpg_quality=JPEG_QUALITY)

    print(f"OK   {new_id} -> covers/{old_key}_cover.jpg + book-pages/{old_key}/ ({doc.page_count} pages)")
    doc.close()
    return True


def main() -> int:
    wanted = sys.argv[1:] or list(NEW_TO_OLD.keys())
    ok = fails = 0
    for new_id in wanted:
        old_id = NEW_TO_OLD.get(new_id)
        if not old_id:
            print(f"Unknown new id: {new_id}")
            fails += 1
            continue
        if export_book(new_id, old_id):
            ok += 1
        else:
            fails += 1
    print(f"\nExported {ok} books, {fails} failures.")
    return 1 if fails else 0


if __name__ == "__main__":
    raise SystemExit(main())
