"""Compile the diamond-mark rules out of the word ledger.

The Shifty Sounds sheet of MPB_WORD_LEDGER.xlsx is the source of truth for
which grapheme+sound pairs are "shifty" — a taught letter making one of its
OTHER sounds.  Per PHONICS_PEDAGOGY.md §5 those get the slate DIAMOND, never
an ordinary dot: the u in "put" and in "nutritious" is not the /u/ of "up".

Three band statuses matter:
  base sound (main ladder)                 -> ordinary dot/line, never diamond
  IN BAND (diamond-mark eligible)          -> DIAMOND when the word uses it
  IN BAND (never diamond-marked — alt spelling)
                                           -> ordinary mark (ti in "patient"
                                              is a spelling of /sh/, not a
                                              letter making a shifty sound)

Output: data/shifty_marks.json
  {
    "graphemes": {
      "u": {
        "base": "/u/",
        "alts": [{"sound": "/oo/ short", "from_level": 5,
                  "examples": ["put", "full", ...]}, ...]
      }, ...
    },
    "words": {"put": {"1": "/oo/ short"}, ...}   # index -> shifty sound
  }

The "words" map is the fast path for words the ledger already knows.  Words
it does not know (LLM-authored custom books) are annotated per book and
validated against "graphemes" — a diamond is only ever allowed on a grapheme
that has a diamond-eligible alternative at or below the book's level.

Usage:  py -3.12 scripts/build_shifty_marks.py
"""

import json
import re
import sys
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
LEDGER = ROOT / "output" / "worksheet_plan" / "MPB_WORD_LEDGER.xlsx"
OUT = ROOT / "data" / "shifty_marks.json"

ELIGIBLE = "diamond-mark eligible"
BASE = "base sound"


def parse_level(text) -> int:
    m = re.search(r"(\d+)", str(text or ""))
    return int(m.group(1)) if m else 1


def main() -> None:
    wb = openpyxl.load_workbook(LEDGER, read_only=True)
    ws = wb["Shifty Sounds"]

    graphemes: dict[str, dict] = {}
    words: dict[str, dict[str, str]] = {}

    for row in ws.iter_rows(min_row=2, values_only=True):
        if not row or not row[0]:
            continue
        grapheme, _card, sound, examples, allowed_from, band = (list(row) + [None] * 6)[:6]
        grapheme = str(grapheme).strip().lower()
        band = str(band or "")
        entry = graphemes.setdefault(grapheme, {"base": None, "alts": []})

        if BASE in band:
            entry["base"] = sound
            continue
        if ELIGIBLE not in band:
            continue  # alt SPELLINGS keep their ordinary line

        example_words = [
            w.strip().lower() for w in str(examples or "").split(",") if w.strip()
        ]
        entry["alts"].append({
            "sound": sound,
            "from_level": parse_level(allowed_from),
            "examples": example_words,
        })

        # Fast path: for each example word, record where the shifty grapheme
        # sits.  First occurrence only — these are short, single-instance
        # examples by construction.
        for word in example_words:
            idx = word.find(grapheme)
            if idx >= 0:
                words.setdefault(word, {})[str(idx)] = sound

    graphemes = {g: v for g, v in graphemes.items() if v["alts"]}

    # REGRESSION GUARD (2026-08-16).  data/shifty_marks.json currently carries
    # g -> /j/ and c -> /s/, but the ledger bands both "promoted to ladder",
    # which the ELIGIBLE filter above skips — so the shipped JSON cannot have
    # come from the current sheet.  Rebuilding blind would silently delete
    # those graphemes and strip the diamond off every soft-g / soft-c word in
    # print (e.g. "gorgeous" in 8.4).  Whether a promoted GPC should still be
    # diamonded is Lynden's call, so refuse rather than guess: fix the sheet's
    # Band status, or pass --force once the answer is known.
    if OUT.exists() and "--force" not in sys.argv:
        try:
            previous = json.loads(OUT.read_text(encoding="utf8"))["graphemes"]
        except (OSError, ValueError, KeyError):
            previous = {}
        lost = sorted(set(previous) - set(graphemes))
        if lost:
            print(f"REFUSING to overwrite {OUT.relative_to(ROOT)}: rebuilding "
                  f"would drop {', '.join(lost)}, which the shipped file "
                  f"treats as diamond-eligible.")
            for g in lost:
                alts = ", ".join(a["sound"] for a in previous[g]["alts"])
                print(f"  {g} -> {alts}  (ledger bands this 'promoted to "
                      f"ladder', not 'diamond-mark eligible')")
            print("Resolve the Band status in MPB_WORD_LEDGER.xlsx, or "
                  "re-run with --force to accept the loss.")
            raise SystemExit(1)

    OUT.write_text(
        json.dumps({"graphemes": graphemes, "words": words}, indent=2, ensure_ascii=False),
        encoding="utf8",
    )
    n_alts = sum(len(v["alts"]) for v in graphemes.values())
    print(f"wrote {OUT.relative_to(ROOT)}: {len(graphemes)} graphemes, "
          f"{n_alts} diamond-eligible alternatives, {len(words)} known words")


if __name__ == "__main__":
    main()
