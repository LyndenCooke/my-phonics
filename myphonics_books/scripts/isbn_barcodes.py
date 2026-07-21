"""EAN-13 ISBN barcodes for the classroom-edition storybooks.

An ISBN-13 already IS a valid EAN-13: strip hyphens/spaces and encode the 13
digits as-is.  This module owns everything barcode-shaped:

  * validation      — 13 digits, 978/979 prefix, correct check digit
  * the register    — data/isbn_classroom.csv maps book_id -> classroom ISBN.
                      Until Lynden confirms the allocation this file does not
                      exist; `py -3.12 scripts/isbn_barcodes.py --propose`
                      writes data/isbn_classroom_PROPOSED.csv (sequential
                      Nielsen order vs. journey order) for sign-off.  Rename it
                      to isbn_classroom.csv to confirm.  Nothing is ever
                      encoded from the PROPOSED file.
  * SVG generation  — python-barcode SVGWriter, vector all the way to PDF.
                      SC2-nominal geometry: 0.33mm module, 22.85mm bars.
                      After rendering we verify the digits python-barcode
                      encoded match the source ISBN character for character
                      (the library recomputes the check digit from the first
                      12 — never trust it to preserve ours).

Used by generate_pilot_books.py when called with --isbn (classroom/print
renders only; the digital home-edition PDFs must NOT carry these ISBNs).
"""

from __future__ import annotations

import csv
import re
import sys
from io import BytesIO
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
REGISTER_CSV = BASE_DIR / "data" / "isbn_classroom.csv"
PROPOSED_CSV = BASE_DIR / "data" / "isbn_classroom_PROPOSED.csv"
NIELSEN_CSV = BASE_DIR / "isbn_register.csv"           # raw 100-ISBN block
NIELSEN_XLSX = BASE_DIR / "myphonicsbooks_isbn_pack.xlsx"

# SC2 nominal EAN-13 geometry (mm).  X-dimension 0.33mm, bar height 22.85mm.
# GS1 quiet zones are asymmetric (left 11 modules = 3.63mm, right 7 = 2.31mm);
# python-barcode only takes ONE quiet_zone value and applies it to both sides,
# so we use the LARGER (left) figure — both quiet zones end up >= spec, which
# is always scan-safe.  Never shrink these to squeeze a layout.
MODULE_WIDTH_MM = 0.33
BAR_HEIGHT_MM = 22.85
QUIET_ZONE_MM = 3.63


# ─────────────────────────────────────────────────────────────────────────────
# Validation
# ─────────────────────────────────────────────────────────────────────────────

def isbn_digits(isbn: str) -> str:
    """Strip hyphens/spaces: '978-1-919114-00-2' -> '9781919114002'."""
    return re.sub(r"[\s-]", "", isbn or "")


def isbn_problems(isbn: str) -> list[str]:
    """Return a list of validation failures (empty list == valid)."""
    d = isbn_digits(isbn)
    probs = []
    if not d.isdigit() or len(d) != 13:
        probs.append(f"not 13 digits ({len(d)} found)")
        return probs
    if d[:3] not in ("978", "979"):
        probs.append(f"does not start 978/979 (starts {d[:3]})")
    weighted = sum(int(c) * (1 if i % 2 == 0 else 3) for i, c in enumerate(d[:12]))
    check = (10 - weighted % 10) % 10
    if check != int(d[12]):
        probs.append(f"check digit wrong (is {d[12]}, should be {check})")
    return probs


# ─────────────────────────────────────────────────────────────────────────────
# Register
# ─────────────────────────────────────────────────────────────────────────────

def load_register(path: Path = REGISTER_CSV) -> dict[str, dict]:
    """Load the CONFIRMED classroom ISBN register, keyed by book_id ('1.1').

    Refuses to fall back to the PROPOSED file — an unconfirmed allocation must
    never reach a printed barcode.  Every row is validated; any invalid ISBN
    raises so nothing renders half-right.
    """
    if not path.exists():
        hint = (f" (found {PROPOSED_CSV.name} — awaiting sign-off; rename it "
                f"to {path.name} to confirm the allocation)"
                if PROPOSED_CSV.exists() else "")
        raise FileNotFoundError(f"No confirmed ISBN register at {path}{hint}")
    register = {}
    with open(path, newline="", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            book_id = row["book_id"].strip()
            probs = isbn_problems(row["isbn"])
            if row.get("edition", "").strip().lower() != "classroom":
                probs.append(f"edition is '{row.get('edition')}', not classroom")
            if probs:
                raise ValueError(f"{path.name} row {book_id}: " + "; ".join(probs))
            register[book_id] = {
                "book_id": book_id,
                "level": row["level"].strip(),
                "title": row["title"].strip(),
                "isbn": row["isbn"].strip(),     # hyphenated Nielsen form
                "edition": "classroom",
            }
    return register


def normalise_title(t: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (t or "").lower()).strip()


# ─────────────────────────────────────────────────────────────────────────────
# SVG generation
# ─────────────────────────────────────────────────────────────────────────────

def ean13_svg(isbn: str) -> str:
    """Render the ISBN as an EAN-13 SVG (pure #000 on #fff) and hard-verify
    the encoded digits match the source ISBN character for character."""
    import barcode
    from barcode.writer import SVGWriter

    src = isbn_digits(isbn)
    probs = isbn_problems(isbn)
    if probs:
        raise ValueError(f"refusing to encode {isbn}: " + "; ".join(probs))

    writer = SVGWriter()
    ean = barcode.get("ean13", src, writer=writer)

    # python-barcode keeps the first 12 digits and RECOMPUTES the check digit.
    # If that differs from the supplied ISBN something upstream is corrupt.
    if ean.get_fullcode() != src:
        raise ValueError(
            f"encoded digits {ean.get_fullcode()} != source ISBN {src}")

    buf = BytesIO()
    ean.write(buf, options={
        "module_width": MODULE_WIDTH_MM,
        "module_height": BAR_HEIGHT_MM,
        "quiet_zone": QUIET_ZONE_MM,
        "font_size": 8,            # human-readable digits under the bars
        "text_distance": 4.2,
        "background": "#ffffff",
        "foreground": "#000000",   # single-channel black; K-only after CMYK
        "write_text": True,
        "center_text": True,
    })
    svg = buf.getvalue().decode("utf-8")

    # Belt and braces: the human-readable line in the SVG itself must contain
    # exactly the source digits, in order.
    text_digits = re.sub(r"\D", "", " ".join(re.findall(r">([^<>]+)</text>", svg)))
    if text_digits != src:
        raise ValueError(
            f"SVG human-readable digits {text_digits!r} != source ISBN {src}")

    # Strip the XML prolog/doctype so the SVG can sit inline in the Jinja HTML.
    svg = re.sub(r"<\?xml[^>]*\?>\s*", "", svg)
    svg = re.sub(r"<!DOCTYPE[^>]*>\s*", "", svg)
    return svg.strip()


def barcode_context(entry: dict) -> dict:
    """Template variables for one book's back-cover barcode block."""
    return {
        "isbn_display": f"ISBN {entry['isbn']}",   # hyphenated, above the bars
        "isbn_barcode_svg": ean13_svg(entry["isbn"]),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Proposal builder (CLI):  --propose
# ─────────────────────────────────────────────────────────────────────────────

def _nielsen_isbns() -> list[str]:
    """The raw Nielsen block, in issue order (100 hyphenated ISBNs)."""
    isbns = []
    for line in NIELSEN_CSV.read_text(encoding="utf-8-sig").splitlines():
        line = line.strip()
        if re.fullmatch(r"97[89][\d-]+", line):
            isbns.append(line)
    return isbns


def _xlsx_titles() -> list[dict]:
    """The 33 classroom titles from the Nielsen Registration Pack sheet,
    in sheet order (level order)."""
    import openpyxl
    wb = openpyxl.load_workbook(NIELSEN_XLSX)
    ws = wb["Nielsen Registration Pack"]
    rows = []
    for row in ws.iter_rows(min_row=3, values_only=True):  # row 1 note, row 2 header
        if row[0] is None:
            continue
        rows.append({"level": str(row[0]), "title": str(row[2]).strip(),
                     "edition": str(row[3]).strip()})
    return rows


def build_proposal() -> list[dict]:
    """Pair journey-ordered book ids with (a) the XLSX titles in sheet order
    and (b) the first 33 Nielsen ISBNs in issue order.  Cross-checks the
    pipeline's own story titles and validates every ISBN.  This is a PROPOSAL
    for Lynden — the tracker sheet reserves the first 33 ISBNs for the
    classroom storybooks but does not record which ISBN belongs to which
    title, so this pairing must be signed off, never assumed."""
    sys.path.insert(0, str(BASE_DIR / "scripts"))
    from generate_pilot_books import get_pilot_stories, NEW_TO_OLD, LEVEL_KEYS

    stories = get_pilot_stories()
    book_ids = sorted(NEW_TO_OLD, key=lambda k: [int(p) for p in k.split(".")])
    xlsx = _xlsx_titles()
    isbns = _nielsen_isbns()

    if len(book_ids) != len(xlsx):
        raise ValueError(f"{len(book_ids)} pipeline books vs {len(xlsx)} XLSX rows")
    if len(isbns) < len(book_ids):
        raise ValueError(f"only {len(isbns)} ISBNs for {len(book_ids)} books")

    rows = []
    for i, book_id in enumerate(book_ids):
        story_title = stories[LEVEL_KEYS[NEW_TO_OLD[book_id]]]["book_title"]
        x = xlsx[i]
        flags = []
        if x["level"] != book_id.split(".")[0]:
            flags.append(f"level mismatch: XLSX says L{x['level']}")
        if normalise_title(x["title"]) != normalise_title(story_title):
            flags.append(f"title mismatch: XLSX '{x['title']}' vs story '{story_title}'")
        flags += isbn_problems(isbns[i])
        rows.append({
            "book_id": book_id,
            "level": book_id.split(".")[0],
            "title": story_title,
            "xlsx_title": x["title"],
            "isbn": isbns[i],
            "edition": "classroom",
            "flags": "; ".join(flags),
        })
    return rows


def main() -> int:
    if "--propose" not in sys.argv:
        print(__doc__)
        return 0
    rows = build_proposal()
    with open(PROPOSED_CSV, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    flagged = [r for r in rows if r["flags"]]
    print(f"Wrote {PROPOSED_CSV} ({len(rows)} rows, {len(flagged)} flagged)")
    for r in rows:
        mark = "  FLAG " if r["flags"] else "  ok   "
        print(f"{mark}{r['book_id']:>4}  {r['isbn']}  {r['title']}"
              + (f"   <-- {r['flags']}" if r["flags"] else ""))
    return 1 if flagged else 0


if __name__ == "__main__":
    sys.exit(main())
