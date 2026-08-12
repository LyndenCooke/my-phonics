"""Build data/core_story_digest.json from the published story files.

The Create-A-Book forge writes stories from scratch, and its random story
shapes kept producing single-location plots where one object mutates —
the hardest thing for image continuity. The published library's stories
are structurally easier on purpose: they tend to MOVE through settings,
page to page, with little or no accumulating object state (Lynden
2026-08-12: "my original books were easier because the setting often
changed and there wasn't really a need for object progression").

This digest hands those real books to the forge's story writer as
exemplars: title, level, focus sounds, and the actual page texts.

Run:  py -3.12 scripts/build_core_story_digest.py
"""
import json
import re
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
DATA = BASE / "data"
OUT = DATA / "core_story_digest.json"


def extract_books(path: Path):
    """Exec a story .py file and pull every dict that looks like a book."""
    namespace = {}
    try:
        exec(path.read_text(encoding="utf-8"), namespace)  # noqa: S102 — our own data files
    except Exception as e:  # a few files import things or have local deps
        print(f"  skip {path.name}: {e}")
        return []
    books = []
    for value in namespace.values():
        if not isinstance(value, dict):
            continue
        for book in value.values():
            if isinstance(book, dict) and "story_pages" in book and "book_title" in book:
                pages = [p.get("text", "") for p in book["story_pages"] if isinstance(p, dict)]
                if not any(pages):
                    continue
                books.append({
                    "title": book.get("book_title"),
                    "level": book.get("level"),
                    "sub_level": book.get("sub_level"),
                    "focus_graphemes": book.get("focus_graphemes", []),
                    "pages": pages,
                })
    return books


def main():
    all_books = []
    for path in sorted(DATA.glob("*story*.py")):
        if path.name.startswith("_"):
            continue
        all_books.extend(extract_books(path))
    # De-dupe by title (a few files carry revisions of the same book)
    seen = {}
    for b in all_books:
        key = (b["title"] or "").lower()
        seen[key] = b  # later file wins
    def _lv(b):
        # level is an int in most files, "L4" style in a few
        raw = b.get("level")
        if isinstance(raw, int):
            return raw
        m = re.search(r"\d+", str(raw or ""))
        return int(m.group()) if m else 0

    books = sorted(seen.values(), key=lambda b: (_lv(b), str(b.get("sub_level") or "")))
    for b in books:
        b["level"] = _lv(b)
    OUT.write_text(json.dumps({
        "_name": "core_story_digest",
        "_description": "Published MPB library stories (title, level, focus, page texts) — exemplars for the Create-A-Book forge's story writer.",
        "_built_by": "scripts/build_core_story_digest.py",
        "books": books,
    }, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"wrote {OUT.name}: {len(books)} books")


if __name__ == "__main__":
    main()
