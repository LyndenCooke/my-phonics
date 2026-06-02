"""Diff the existing 32-book focus_graphemes against the user-authored
CURRICULUM LEDGER.pdf level boundaries.

Output: a concrete list of which books currently sit at the wrong level
under the new ledger.

The ledger's level boundaries (extracted from CURRICULUM_LEDGER.md):
  L1: s, a, t, p, i, n, m, d, g, o, c, k, ck, e, u, r, h, b, f, ff, l, ll, ss
  L2: j, v, w, x, y, z, zz, qu, ch, sh, th, ng,
      ai, ee, igh, oa, oo (long), oo (short), ar, or, ur, ow, oi,
      ear, air, ure, er
  L3 (Phase 4 + early Phase 5): no new single-letter GPCs — clusters CCVC/CVCC,
      two-syllable; near end of L3: ay, ou, ie, ea, oy, ir, ue, aw, wh, ph, ew,
      oe, au, a-e, e-e, i-e, o-e, u-e
  L4 (Phase 5 alternatives): are, aw (as alt to or), eigh, ey, ei, dge, etc.
  L5 (suffix morphology): -ing/-ed/-er/-est etc.
  L6 (Phase 6 secure): no new GPCs.

Note: 'nk' is not explicitly in the ledger — RWI treats it as a digraph, the
ledger appears to group it under final blends. Flag for clarification.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
OUT = ROOT / "output" / "worksheet_plan"

# Ledger graphemes per level
LEDGER = {
    1: {"s", "a", "t", "p", "i", "n", "m", "d", "g", "o", "c", "k", "ck",
        "e", "u", "r", "h", "b", "f", "ff", "l", "ll", "ss"},
    2: {"j", "v", "w", "x", "y", "z", "zz", "qu", "ch", "sh", "th", "ng",
        "ai", "ee", "igh", "oa", "oo", "ar", "or", "ur", "ow", "oi",
        "ear", "air", "ure", "er"},
    3: {"ay", "ou", "ie", "ea", "oy", "ir", "ue", "aw", "wh", "ph", "ew",
        "oe", "au", "a-e", "e-e", "i-e", "o-e", "u-e"},
    4: {"are", "eigh", "ey", "ei", "dge", "ge", "kn", "gn", "wr", "mb", "sc"},
    # L5 and L6 are not graphem-introduction levels; mostly morphology
    5: {"-ing", "-ed", "-er", "-est", "-y", "-en", "-ful", "-ly", "-ment",
        "-ness"},
    6: set(),
}
# Edge cases not in the ledger explicitly — flag them
AMBIGUOUS = {"nk"}  # RWI treats nk as digraph; ledger appears to omit

def ledger_level_for(grapheme: str) -> int | str:
    if grapheme in AMBIGUOUS:
        return "AMBIGUOUS"
    for lvl in (1, 2, 3, 4, 5, 6):
        if grapheme in LEDGER[lvl]:
            return lvl
    return "?"


# Parse existing book focus_graphemes
books: list[dict] = []
for f in sorted(DATA.glob("*_story_l*_book1.py")):
    text = f.read_text(encoding="utf-8")
    fn_match = re.search(r"_l(\d+)_(\d+)_book\d+\.py$", f.name)
    if not fn_match:
        legacy = re.search(r"_l(\d+)_book\d+\.py$", f.name)
        if not legacy:
            continue
        lvl = int(legacy.group(1))
        sub_n = 3 if "fish" in f.name else 1
    else:
        lvl = int(fn_match.group(1))
        sub_n = int(fn_match.group(2))
    title_m = re.search(r'"book_title"\s*:\s*"([^"]+)"', text)
    focus_m = re.search(r'"focus_graphemes"\s*:\s*\[([^\]]*)\]', text)
    focus = [g.strip().strip('"') for g in (focus_m.group(1).split(",") if focus_m else [])]
    focus = [g for g in focus if g]
    books.append({
        "id": f"L{lvl}.{sub_n}",
        "level": lvl,
        "title": title_m.group(1) if title_m else "(unknown)",
        "focus": focus,
    })
books.sort(key=lambda b: (b["level"], b["id"]))


# Diff and report
md: list[str] = [
    "# Existing Books × Curriculum Ledger Diff",
    "",
    "For each book: its current level vs the level its focus graphemes belong to",
    "under the user-authored Curriculum Ledger.",
    "",
    "**Status legend:**",
    "- ✅ OK — all focus graphemes belong to the book's current level",
    "- ⚠️ MISPLACED — at least one grapheme belongs to a different level",
    "- ❓ AMBIGUOUS — uses a grapheme the ledger doesn't explicitly cover",
    "",
]

placed_ok: list[dict] = []
misplaced: list[dict] = []
ambiguous: list[dict] = []

for b in books:
    grapheme_levels = {g: ledger_level_for(g) for g in b["focus"]}
    has_amb = any(v == "AMBIGUOUS" for v in grapheme_levels.values())
    has_mis = any(isinstance(v, int) and v != b["level"] for v in grapheme_levels.values())
    has_unk = any(v == "?" for v in grapheme_levels.values())
    if has_mis or has_unk:
        b["grapheme_levels"] = grapheme_levels
        misplaced.append(b)
    elif has_amb:
        b["grapheme_levels"] = grapheme_levels
        ambiguous.append(b)
    else:
        placed_ok.append(b)


def fmt_grapheme_table(b: dict) -> str:
    rows = []
    for g, lvl in b["grapheme_levels"].items():
        if lvl == b["level"]:
            mark = "✅"
        elif lvl == "AMBIGUOUS":
            mark = "❓"
        elif lvl == "?":
            mark = "❌ (not in ledger at all)"
        else:
            mark = f"⚠️ should be **L{lvl}**"
        rows.append(f"  - `{g}` → {mark}")
    return "\n".join(rows)


md.append(f"## ⚠️ MISPLACED — {len(misplaced)} books")
md.append("")
md.append("These books have at least one focus grapheme that, under the ledger,")
md.append("belongs to a different level. Likely needs re-numbering or focus adjustment.")
md.append("")
for b in misplaced:
    md.append(f"### {b['id']} — *{b['title']}*  (currently L{b['level']})")
    md.append(fmt_grapheme_table(b))
    md.append("")

md.append(f"## ❓ AMBIGUOUS — {len(ambiguous)} books")
md.append("")
md.append("Uses a grapheme the ledger doesn't explicitly include (e.g. `nk`).")
md.append("")
for b in ambiguous:
    md.append(f"### {b['id']} — *{b['title']}*  (currently L{b['level']})")
    md.append(fmt_grapheme_table(b))
    md.append("")

md.append(f"## ✅ OK — {len(placed_ok)} books")
md.append("")
md.append("All focus graphemes match the book's current level under the ledger.")
md.append("")
for b in placed_ok:
    md.append(f"- {b['id']} *{b['title']}* — `{', '.join(b['focus'])}`")
md.append("")

md.append("---")
md.append("")
md.append("## Recommendations")
md.append("")
md.append("1. **Renumber the consonant-digraph books to L2.** Specifically:")
md.append("   - L1.9 *Chop Chop Chop* (ch, th) → should be L2 under the ledger")
md.append("   - L1.10 *Buzz and Sing* (ng, qu, ss, zz) → ng/qu/zz are L2; ss is L1")
md.append("   - L1.7 *The Jam Jug* (j, v, w) → should be L2 under the ledger")
md.append("   - L1.8 *The Yak and the Box* (x, y, z) → should be L2 under the ledger")
md.append("")
md.append("2. **Clarify 'nk'.** L1.3 *Fish in the Tank* uses 'nk' which isn't in")
md.append("   the ledger's grapheme lists. Either add 'nk' to L1 (as a final-blend")
md.append("   digraph like ng) or downgrade the book to a non-nk-focused alternative.")
md.append("")
md.append("3. **Check the 'ay' vs 'ai' choice for L2.1.** The ledger has 'ai' at L2")
md.append("   and 'ay' at L3 (as an alternative spelling). L2.1 *Night Light* uses")
md.append("   'ay' which is L3 under the ledger. Either swap the book to 'ai' or")
md.append("   accept that L2 introduces ay as the primary /ay/ spelling.")
md.append("")
md.append("4. **L1 will have 6-7 books, not 10** under this strict ledger.")
md.append("   The 'extra' L1 books (j/v/w, x/y/z, ch/th, ng/qu/ss/zz) become L2 books.")
md.append("   So L2 grows from 6 to ~10 books.")
md.append("")

(OUT / "ledger_vs_books_diff.md").write_text("\n".join(md), encoding="utf-8")

print(f"Wrote {OUT / 'ledger_vs_books_diff.md'}")
print(f"  OK:         {len(placed_ok)}")
print(f"  Misplaced:  {len(misplaced)}")
print(f"  Ambiguous:  {len(ambiguous)}")
