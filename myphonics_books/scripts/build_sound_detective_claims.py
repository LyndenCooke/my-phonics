"""Allocate a UNIQUE Sound Detective to every book in the fleet.

Lynden 2026-07-29: "8.1 has the same sound detective as 7.4 — there should
be [no] repetitions in any book for the sound detective."  The activity was
drawn from each book's OWN shifty sounds, and `oo`, `c` and `u` appear in
nearly every story, so the same grapheme+sound kept coming round: oo=/oo/
short ran in NINE books, c=/s/ in six, u=/oo/ short in five.

Allocation rules (Lynden's calls, 2026-07-29):
  * A book prefers its own story's sounds; when those are already taken it
    fills from the level-appropriate Shifty Sounds ledger instead, so no
    book loses the activity (`build_ledger_sound_rows`).
  * EARLIEST BOOK WINS — walk 4.1 -> 8.4 in curriculum order and let the
    first book that wants a sound keep it.  Adding a book later can only
    consume what is still free; it never reshuffles the books before it.

Writes data/sound_detective_claims.json, which generate_book.py reads.
Rerun after adding a book, editing a story's words, or changing
data/shifty_sounds.json.  audit_release.py fails on a clash or a stale file.

    py -3.12 -X utf8 scripts/build_sound_detective_claims.py [--check]
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).parent.parent))

from generate_book import (build_book_data_from_story, build_spotlight_pages,
                           sound_detective_candidates, sound_detective_key)
from generate_pilot_books import get_pilot_stories, NEW_TO_OLD, LEVEL_KEYS

BASE_DIR = Path(__file__).parent.parent
OUT_PATH = BASE_DIR / "data" / "sound_detective_claims.json"
ROWS_PER_BOOK = 2


def cumulative_graphemes(level: int) -> list:
    """Main-ladder graphemes taught up to and including `level` — the same set
    build_book_data_from_story computes, used to keep an already-taught
    grapheme out of the ledger fallback."""
    with open(BASE_DIR / "data" / "graphemes_by_level.json", encoding="utf-8") as f:
        data = json.load(f)
    out = []
    for lv in range(1, level + 1):
        out.extend(data.get(f"level_{lv}", {}).get("graphemes", []))
    return out


def fleet_candidates():
    """[(book_id, title, [candidate rows, best first]), ...] in curriculum order."""
    stories = get_pilot_stories()
    order = sorted(NEW_TO_OLD, key=lambda k: [int(p) for p in k.split(".")])
    out = []
    for new_id in order:
        key = LEVEL_KEYS.get(NEW_TO_OLD[new_id])
        if not key or key not in stories:
            continue
        story = dict(stories[key])
        level = int(new_id.split(".")[0])
        story["level"] = level
        if level < 4:                      # Sound Detective is L4+
            continue
        # image_dir=None keeps this fast: no page art is embedded, and the
        # shifty/future bands don't depend on it.
        bd = build_book_data_from_story(story, "Sam", "Alex", None, book_id=new_id)
        spot = (bd.get("future_spotlight_row") or {}).get("grapheme")
        cands = sound_detective_candidates(
            level, bd["shifty_sounds"], bd["future_sounds"],
            exclude=(spot,), taught=cumulative_graphemes(level),
        )
        out.append((new_id, story["book_title"], cands))
    return out


def allocate(fleet):
    """TWO passes, both in curriculum order.

    Pass 1 hands out only the sounds a book's OWN story uses, so a book that
    genuinely reads "give" keeps ve=/v/ and can only lose it to an EARLIER
    book that also uses it.  Pass 2 then tops every book up to ROWS_PER_BOOK
    from the ledger fallback.  Without the split, an early book's fallback
    could take a sound a later book actually needed.
    """
    claims = {book_id: [] for book_id, _, _ in fleet}
    taken = set()

    for source in ("own", "ledger", "spotlight-repeat"):
        for book_id, _title, cands in fleet:
            # A spotlight repeat only ever RESCUES a book that would print no
            # Sound Detective at all — build_extra_sound_rows excludes the
            # Sound Spotlight grapheme on purpose, so it must not be used to
            # pad a book that already has a row of its own.
            cap = 1 if source == "spotlight-repeat" else ROWS_PER_BOOK
            for row in cands:
                if len(claims[book_id]) >= cap:
                    break
                if row.get("source") != source:
                    continue
                k = sound_detective_key(row)
                if k in taken:
                    continue
                claims[book_id].append(k)
                taken.add(k)

    thin = [(book_id, title, len(claims[book_id]))
            for book_id, title, _ in fleet
            if len(claims[book_id]) < ROWS_PER_BOOK]
    return claims, thin


def main():
    check_only = "--check" in sys.argv
    fleet = fleet_candidates()
    claims, thin = allocate(fleet)

    by_id = {b: (t, c) for b, t, c in fleet}
    for book_id, keys in claims.items():
        title, cands = by_id[book_id]
        rows = {sound_detective_key(r): r for r in cands}
        shown = " + ".join(rows[k]["caption"] for k in keys) or "NONE"
        print(f"  {book_id:<5} {title[:32]:<34} {shown}")

    if thin:
        print("\n  Books with fewer than "
              f"{ROWS_PER_BOOK} rows (no unclaimed sounds left):")
        for book_id, title, n in thin:
            print(f"    {book_id} {title} -> {n} row(s)")

    payload = {
        "_name": "Sound Detective claims",
        "_description": ("Fleet-wide allocation of Sound Detective rows: no "
                         "two books run the same grapheme+sound. Generated — "
                         "do not hand-edit; rerun "
                         "scripts/build_sound_detective_claims.py."),
        "_rule": "earliest book in curriculum order claims a sound first",
        "claims": claims,
    }
    new_text = json.dumps(payload, indent=2, ensure_ascii=False) + "\n"

    if check_only:
        old = OUT_PATH.read_text(encoding="utf-8") if OUT_PATH.exists() else ""
        if old != new_text:
            print("\nSTALE: data/sound_detective_claims.json does not match "
                  "the current stories/ledger. Rerun without --check.")
            return 1
        print("\nOK: claims file is up to date.")
        return 0

    OUT_PATH.write_text(new_text, encoding="utf-8")
    print(f"\nWrote {OUT_PATH.relative_to(BASE_DIR)} "
          f"({sum(len(v) for v in claims.values())} rows over {len(claims)} books)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
