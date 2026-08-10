"""Compile every taught pronunciation of every grapheme.

A grapheme with more than one sound must be TAUGHT with both, not just the one
the book happens to use: the u-e in "cube" says /yoo/ and the u-e in "flute"
says /oo/, and a child shown only one of them will stall on the other
(Lynden 2026-07-26). This feeds the automatic "Watch Out" pronunciation note
on the Story Words page.

Sources:
  - Shifty Sounds sheet of MPB_WORD_LEDGER.xlsx — base sound + alternatives,
    each with the level it is allowed from.
  - SPLIT_DIGRAPHS below — split digraphs are not rows in that sheet, and u-e
    is the one with two sounds.

Output: data/pronunciations.json
  {"u-e": {"sounds": [{"sound": "/yoo/", "examples": [...], "from_level": 5},
                      {"sound": "/oo/",  "examples": [...], "from_level": 5}]}}

Usage:  py -3.12 scripts/build_pronunciations.py
"""

import json
import re
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
LEDGER = ROOT / "output" / "worksheet_plan" / "MPB_WORD_LEDGER.xlsx"
OUT = ROOT / "data" / "pronunciations.json"

# Split digraphs (vowel-consonant-e). Only u-e carries two sounds; the rest are
# single and are listed so the note generator can confirm that and stay quiet.
SPLIT_DIGRAPHS = {
    "a-e": [("/ai/", ["cake", "name", "gate", "made"], 5)],
    "i-e": [("/igh/", ["bike", "time", "like", "five"], 5)],
    "o-e": [("/oa/", ["bone", "hope", "home", "note"], 5)],
    "e-e": [("/ee/", ["these", "theme", "even"], 5)],
    "u-e": [
        ("/yoo/", ["cube", "huge", "use", "cute", "mule"], 5),
        ("/oo/", ["flute", "rule", "June", "prune"], 5),
    ],
}


def parse_level(text) -> int:
    m = re.search(r"(\d+)", str(text or ""))
    return int(m.group(1)) if m else 1


def main() -> None:
    wb = openpyxl.load_workbook(LEDGER, read_only=True)
    ws = wb["Shifty Sounds"]

    out: dict[str, dict] = {}
    for row in ws.iter_rows(min_row=2, values_only=True):
        if not row or not row[0]:
            continue
        grapheme, _card, sound, examples, allowed_from, _band = (list(row) + [None] * 6)[:6]
        grapheme = str(grapheme).strip().lower()
        words = [w.strip().lower() for w in str(examples or "").split(",") if w.strip()]
        out.setdefault(grapheme, {"sounds": []})["sounds"].append({
            "sound": str(sound or "").strip(),
            "examples": words[:5],
            "from_level": parse_level(allowed_from),
        })

    for grapheme, rows in SPLIT_DIGRAPHS.items():
        out[grapheme] = {
            "sounds": [
                {"sound": s, "examples": ex, "from_level": lv} for s, ex, lv in rows
            ]
        }

    OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf8")
    multi = [g for g, v in out.items() if len(v["sounds"]) > 1]
    print(f"wrote {OUT.relative_to(ROOT)}: {len(out)} graphemes, "
          f"{len(multi)} with more than one pronunciation")


if __name__ == "__main__":
    main()
