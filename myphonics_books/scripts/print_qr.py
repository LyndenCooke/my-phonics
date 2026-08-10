"""Permanent QR targets for printed books.

EVERY string this module returns ends up printed on paper and shipped into
libraries and classrooms.  A printed QR cannot be reissued, so these URLs are
treated exactly like the ISBN register: a committed, locked registry that code
reads from, never a URL built inline at render time.

The rule that makes this safe: a printed code encodes an IDENTIFIER, never a
destination.  Everything points at short /b/... paths on our own domain, which
redirect to wherever the app actually lives.  The app can be re-routed,
re-framed or rebuilt and the printed books keep working, because only the
redirect target moves.  Encoding /library?book=1.1 directly — which is what
generate_book.py used to do — welds every printed copy to today's routing:
rename the route or the query param and every book in the field dies.

  /b/<book_id>              -> the interactive book, e.g. /b/1.1
  /b/<book_id>/worksheets   -> that book's printable worksheets
  /b/check                  -> the free 3-minute level check
  /b/library                -> the online library

Adding a book: add its id to data/print_qr_registry.json deliberately.  Lookups
for an unregistered id raise instead of inventing a URL, so a new book cannot
silently ship with a code nobody signed off.

audit_release.check_printed_qrs() decodes the QR images out of the rendered
PDFs and asserts they match this registry byte for byte.
"""

from __future__ import annotations

import json
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
REGISTRY = BASE_DIR / "data" / "print_qr_registry.json"


def load_registry() -> dict:
    with open(REGISTRY, encoding="utf-8") as f:
        reg = json.load(f)
    if not reg.get("locked"):
        raise RuntimeError(
            f"{REGISTRY.name}: registry is not marked locked — refusing to "
            "print QR codes from a draft registry")
    return reg


def _book_entry(book_id: str) -> dict:
    reg = load_registry()
    entry = reg["books"].get(book_id)
    if entry is None:
        raise KeyError(
            f"book {book_id} has no printed QR targets in {REGISTRY.name}. "
            "Add it deliberately — do not let a render invent a URL that "
            "will be printed onto paper.")
    return entry


def read_url(book_id: str) -> str:
    """Straight into the interactive book."""
    return _book_entry(book_id)["read"]


def worksheets_url(book_id: str) -> str:
    """That book's printable worksheets."""
    return _book_entry(book_id)["worksheets"]


def check_url() -> str:
    """Free 3-minute level check (same for every book)."""
    return load_registry()["shared"]["check"]


def library_url() -> str:
    """The online library (same for every book)."""
    return load_registry()["shared"]["library"]


def library_pass_code() -> str:
    """The pass code printed beside the QRs so a library borrower can read
    without signing up.  Shares the teacher_codes mechanism (see the
    TPT-TEACHERS pass).  Printed = public forever, by design."""
    return load_registry()["shared"]["library_pass_code"]


def all_printed_urls(book_id: str) -> dict[str, str]:
    """Every QR string that appears in one book — what the audit compares."""
    return {
        "read": read_url(book_id),
        "worksheets": worksheets_url(book_id),
        "check": check_url(),
        "library": library_url(),
    }
