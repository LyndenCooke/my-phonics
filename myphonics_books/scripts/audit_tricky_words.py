"""Audit the tricky-word master list itself.

A tricky word earns its place ONLY if it cannot be honestly sounded out with
the graphemes taught at (or before) the level that introduces it.  This
script catches the two failure modes Lynden found on 2026-07-03 ("past" and
"fast" sitting in a Tricky Words strip):

  1. MISLISTED — the word parses with main-ladder graphemes at or before its
     intro level AND the parse is phonetically honest (past = p-a-s-t).
     These should be deleted from data/tricky_words_by_level.json.
  2. GRADUATES — the word becomes honestly decodable at a LATER level
     (her → h-er once 'er' lands at L6).  These stay listed but should stop
     being flagged once the child passes that level (Phase 2 of the Shifty
     Sounds build).

A greedy letter-parse alone is NOT enough — "was" parses w-a-s but is said
/woz/.  PHONETICALLY_IRREGULAR below is the curated override list: words
whose spelling parses but whose pronunciation does not match the taught
sounds.  Judgements follow Letters and Sounds (2007); the a-in-fast family
is treated as decodable (short a), per Lynden's ruling.

Run:  py -3.12 scripts/audit_tricky_words.py
Out:  output/qa/tricky_word_audit.md  (+ non-zero exit if MISLISTED found)
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
OUT = BASE / "output" / "qa" / "tricky_word_audit.md"

# Words whose letters parse against taught graphemes but whose pronunciation
# does not match the taught sounds — they must STAY tricky (or graduate only
# via a Shifty Sounds promotion, e.g. o=/oa/ for "no"/"go").
PHONETICALLY_IRREGULAR = {
    # schwa / odd vowels
    "the", "a", "was", "what", "want", "of", "said", "have", "some", "come",
    "were", "one", "do", "to", "into", "so", "no", "go", "oh", "again",
    "water", "any", "many", "busy", "pretty", "half", "sure", "sugar",
    "move", "prove", "improve", "clothes", "eye", "hour", "who", "whole",
    "money", "parents", "christmas", "beautiful", "people", "because",
    # open vowels not in the main ladder (Shifty territory)
    "he", "she", "we", "me", "be", "i", "my", "you", "they", "her",
    "find", "kind", "mind", "behind", "child", "children", "wild", "climb",
    "most", "only", "both", "old", "cold", "gold", "hold", "told", "even",
    "every", "everybody", "great", "break", "steak", "there", "their",
    "little", "when", "out", "like", "all", "are", "is", "has",
    "looked", "called", "asked", "could", "should", "would",
    "mr", "mrs",
    # Authored book-specific tricky words, classified 2026-07-13 when the
    # release gate's contradiction check first swept them: letters parse but
    # pronunciation doesn't (silent letters, /uu/ u, open vowels, ough...).
    "put", "your", "where", "once", "before", "eyes", "heart", "over",
    "two", "through", "done", "anyone", "everyone", "knew", "walk",
    "brother", "fall", "bush", "famous", "thought", "love",
    "neighbourhood", "corniche",
}

# Words whose honest parse needs a SPECIFIC later grapheme, where the letter
# machinery finds an earlier-but-dishonest split (door via oo+r at L4 sounds
# /doo-er/, not /dor/ — the real unit is 'oor', taught L7).
HONEST_PARSE_LEVEL = {"door": 7, "floor": 7, "poor": 7}
# ...and the exact unit each needs, for WITHIN-level graduation: a pre-oor
# L7 book (7.1) still tells the child "door"; the oor book (7.2) and after
# must not — the word graduates the moment its unit enters the taught window.
HONEST_PARSE_UNIT = {"door": "oor", "floor": "oor", "poor": "oor"}


def has_graduated(word: str, taught_window: list) -> bool:
    """True iff `word` is honestly decodable with the graphemes in
    `taught_window` (a book's prior-levels + current-level-to-focus window).

    THE predicate for 'should this word still be told as tricky in this
    book' — used by generate_book.py's page-3 strip (Lynden 2026-07-13,
    door/floor showing as tricky inside the very book that teaches oor).
    Curated irregulars (was, said…) never graduate via letter-parsing.

    Uses v2_helpers.can_decode (not the local parses()) so the untaught-
    digraph honesty rule applies: "with" may not letter-parse w-i-t-h while
    th is untaught — it graduates at L3 when th lands, not before.
    """
    w = "".join(c for c in word.lower() if c.isalpha())
    if not w or w in PHONETICALLY_IRREGULAR:
        return False
    if w in HONEST_PARSE_UNIT:
        return HONEST_PARSE_UNIT[w] in taught_window
    from v2_helpers import can_decode, all_known_units
    g, _ = load()
    return can_decode(w, taught_window, all_known_units(g))


def load():
    g = json.load(open(BASE / "data" / "graphemes_by_level.json", encoding="utf-8"))
    t = json.load(open(BASE / "data" / "tricky_words_by_level.json", encoding="utf-8"))
    return g, t


def cumulative_graphemes(g, level):
    out = []
    for lv in range(1, level + 1):
        out.extend(g.get(f"level_{lv}", {}).get("graphemes", []))
    return out


def parses(word, graphemes):
    """Greedy longest-match: True if the whole word splits into taught units.

    Honesty rule: a doubled VOWEL may never be read as two separate
    single-letter units ("door" is not d-o-o-r) — the digraph/trigraph
    (oo, oor) must itself be taught.
    """
    gs = sorted({x.replace("-", "") for x in graphemes}, key=len, reverse=True)
    w = word.lower()
    i = 0
    while i < len(w):
        for cand in gs:
            if w.startswith(cand, i):
                if (len(cand) == 1 and cand in "aeiou"
                        and i + 1 < len(w) and w[i + 1] == cand):
                    return False
                i += len(cand)
                break
        else:
            return False
    return True


def main():
    g, t = load()
    rows, mislisted, graduates = [], [], []
    for lv in range(1, 9):
        for word in t.get(f"level_{lv}", {}).get("new_tricky_words", []):
            clean = "".join(c for c in word.lower() if c.isalpha())
            earliest = next(
                (l for l in range(1, 9) if parses(clean, cumulative_graphemes(g, l))),
                None,
            )
            if clean in HONEST_PARSE_LEVEL:
                earliest = HONEST_PARSE_LEVEL[clean]
            if clean in PHONETICALLY_IRREGULAR or earliest is None:
                status = "TRUE TRICKY"
            elif earliest < lv:
                status = f"MISLISTED — decodable from L{earliest}"
                mislisted.append((lv, word, earliest))
            elif earliest == lv:
                # Its sound lands partway through this very level — keep it
                # listed (pre-oor L7 books still need it told), it graduates
                # within the level.
                status = f"GRADUATES within L{lv}"
                graduates.append((lv, word, earliest))
            else:
                status = f"GRADUATES at L{earliest}"
                graduates.append((lv, word, earliest))
            rows.append((lv, word, earliest, status))

    lines = ["# Tricky-word master-list audit", ""]
    lines += ["| Listed | Word | Earliest honest parse | Status |", "|---|---|---|---|"]
    for lv, word, e, status in rows:
        lines.append(f"| L{lv} | {word} | {'L' + str(e) if e else '—'} | {status} |")
    lines += ["", f"**MISLISTED: {len(mislisted)}** — remove from the master list.",
              f"**GRADUATES: {len(graduates)}** — keep, but stop flagging at/after the parse level (Phase 2)."]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print("\n".join(lines[-2:]))
    for lv, w, e in mislisted:
        print(f"  MISLISTED L{lv}: {w} (decodable from L{e})")
    return 1 if mislisted else 0


if __name__ == "__main__":
    sys.exit(main())
