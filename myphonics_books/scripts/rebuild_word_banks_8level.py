"""
Rebuild the word banks for the 8-level Curriculum Ledger (v2.1).

Shifty Sounds Phase 0, migration fix #1: `data/word_banks/` was still 6-level
(old names, old grapheme boundaries) after the repo moved to the 8-level
ladder.  This script regenerates `level_1_words.json` .. `level_8_words.json`
from the NEW cumulative graphemes in `data/graphemes_by_level.json`.

Method (same greedy longest-match grapheme decomposition described in the
existing word bank files, upgraded to the audit's rules):

  - A word belongs to the EARLIEST level at which it can be segmented into
    taught graphemes (DP segmentation, longest-match preferred).
  - Known multi-letter units that are not yet taught BLOCK single-letter
    reading through them ("mess" is not m-e-s-s before ss; "station" is not
    s-t-a-t-i-o-n before tion) — identical to scripts/audit_decodability.py.
  - Split digraphs (a-e, i-e, o-e, u-e — taught at L5) match
    vowel + one taught consonant + e.  A split digraph may not start where
    an untaught contiguous unit starts ("adventure" is not adven-t-u_e(r)
    before ure is taught).
  - Word-final magic-e blocking: a single vowel may not be read as its short
    sound when the word ends <vowel><consonant>e ("make" is not m-a-k-e
    before a-e is taught), and a parse may not end with a bare single "e"
    straight after a vowel grapheme ("fire" is not f-ir-e; it waits for ire).
  - Structure rules from the Ledger: L1 = VC/CVC only, no adjacent consonant
    clusters; L2 = clusters still not permitted (double letters and ck are
    single graphemes); L3+ = clusters permitted.

The word corpus is the union of the previous 6 word bank files plus a curated
L7/L8 seed list (trigraphs ire/ore/ear/oor/ure, tion/sion, and Phase 6
morphology vocabulary).  Every word — seeded or inherited — is re-verified by
segmentation, so nothing can land below the level that actually decodes it.

Old files are backed up once as level_N_words.6level.bak.

Usage:  py -3.12 scripts/rebuild_word_banks_8level.py
"""

import json
import shutil
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
WORD_BANKS_DIR = DATA_DIR / "word_banks"

VOWEL_GRAPHEMES = {
    "a", "e", "i", "o", "u",
    "ai", "ay", "ee", "ea", "ie", "igh",
    "oa", "ow", "oo", "oe",
    "ar", "or", "ur", "er", "ir",
    "air", "are", "ear", "eer", "ore", "oor", "ire", "ure",
    "oi", "oy", "ou",
    "aw", "au",
    "ew", "ue",
    "a-e", "e-e", "i-e", "o-e", "u-e",
}

# Curated additions so L7/L8 banks carry real Ledger-aligned vocabulary.
# Each word is still verified by segmentation before it is placed.
L7_L8_SEED_WORDS = [
    # L7 trigraphs: ire / ore / ear / oor / ure / tion
    "fire", "hire", "wire", "admire", "bonfire", "inspire", "entire",
    "more", "bore", "core", "score", "shore", "snore", "store", "before",
    "explore", "adore", "wore", "tore", "sore",
    "near", "dear", "fear", "hear", "year", "clear", "beard", "appear",
    "nearly", "clearly",
    "door", "floor", "poor", "moor",
    "sure", "cure", "pure", "secure", "picture", "capture", "creature",
    "adventure", "mixture", "nature", "future", "furniture", "treasure",
    "station", "action", "fiction", "motion", "potion", "section",
    "mention", "attention", "caution", "creation", "collection",
    "condition", "direction", "fraction", "invention", "injection",
    "instruction", "subtraction", "pollution", "solution", "education",
    "celebration", "information", "imagination",
    # L8 suffix morphology: -ous/-cious/-tious, -able/-ible, -sion, prefixes
    "famous", "dangerous", "enormous", "marvellous", "curious", "furious",
    "serious", "various", "jealous", "nervous", "poisonous", "tremendous",
    "delicious", "suspicious", "precious", "gracious", "spacious", "vicious",
    "ambitious", "cautious", "nutritious", "scrumptious",
    "comfortable", "enjoyable", "remarkable", "adorable", "reliable",
    "valuable", "capable", "available", "reasonable", "washable",
    "incredible", "sensible", "terrible", "horrible", "possible",
    "invisible", "responsible", "flexible",
    "division", "explosion", "television", "decision", "confusion",
    "invasion", "version", "mansion", "expansion", "tension",
    "return", "reread", "replay", "rebuild", "retell",
    "dislike", "disagree", "disappear", "dishonest",
    "mistake", "misplace", "misread",
    "subway", "submit", "subheading",
]


def load_graphemes():
    with open(DATA_DIR / "graphemes_by_level.json", "r", encoding="utf-8") as f:
        return json.load(f)


def all_known_units(graphemes_data):
    """Every multi-letter contiguous grapheme in the whole 8-level scheme."""
    units = set()
    for lv in range(1, 9):
        for g in graphemes_data.get(f"level_{lv}", {}).get("graphemes", []):
            if len(g) >= 2 and "-" not in g:
                units.add(g)
    return units


VOWEL_LETTERS = set("aeiou")


def segment(word, taught, known_units):
    """Return a grapheme segmentation of ``word`` using taught graphemes,
    or None.  Longest-match preferred; untaught known units block
    single-letter reads AND split-digraph reads through their position
    ("adventure" is not adven-t-u_e(r) before ure); split digraphs
    (a-e etc.) match v + consonant + e.

    Word-final magic-e blocking: when the word ends <vowel><consonant>e the
    single short vowel may not be read at that position ("make" is not
    m-a-k-e before a-e), and a parse may never end with a bare single "e"
    straight after a vowel grapheme ("fire" is not f-ir-e; it waits for ire).
    """
    taught_set = set(taught)
    singles = {g for g in taught_set if len(g) == 1 and g not in VOWEL_GRAPHEMES}
    splits = [g for g in taught_set if "-" in g and len(g) == 3]
    contiguous = sorted((g for g in taught_set if "-" not in g), key=len, reverse=True)
    untaught_units = [u for u in known_units if u not in taught_set]
    n = len(word)
    # Word ends <vowel><consonant>e: the single vowel at n-3 is magic-e
    # territory and may not be read as its short sound.
    vce_block_idx = None
    if (
        n >= 3
        and word[-1] == "e"
        and word[-2] not in VOWEL_LETTERS
        and word[-3] in VOWEL_LETTERS
    ):
        vce_block_idx = n - 3
    memo = {}

    def rec(i, prev_vowel):
        if i == n:
            return []
        if (i, prev_vowel) in memo:
            return memo[(i, prev_vowel)]
        result = None
        blocked = any(word.startswith(u, i) for u in untaught_units)
        for g in contiguous:
            if len(g) == 1 and blocked:
                continue
            if len(g) == 1 and i == vce_block_idx and g in VOWEL_LETTERS:
                continue  # short vowel blocked in word-final <v><c>e
            if g == "e" and i == n - 1 and prev_vowel:
                continue  # bare final e straight after a vowel grapheme
            if word.startswith(g, i):
                rest = rec(i + len(g), g in VOWEL_GRAPHEMES)
                if rest is not None:
                    result = [g] + rest
                    break
        if result is None and not blocked:
            for g in splits:  # e.g. a-e matches "a<taught consonant>e"
                if (
                    i + 3 <= n
                    and word[i] == g[0]
                    and word[i + 2] == "e"
                    and word[i + 1] in singles
                ):
                    rest = rec(i + 3, True)
                    if rest is not None:
                        result = [g] + rest
                        break
        memo[(i, prev_vowel)] = result
        return result

    return rec(0, False)


def has_consonant_cluster(grapheme_list):
    """2+ adjacent consonant graphemes anywhere in the word."""
    run = 0
    for g in grapheme_list:
        if g in VOWEL_GRAPHEMES:
            if run >= 2:
                return True
            run = 0
        else:
            run += 1
    return run >= 2


def earliest_level(word, graphemes_data, known_units):
    """Earliest level 1-8 at which the word decodes, or None."""
    for lv in range(1, 9):
        cumulative = graphemes_data[f"level_{lv}"]["cumulative_graphemes"]
        seg = segment(word, cumulative, known_units)
        if seg is None:
            continue
        # Ledger structure rules: no adjacent consonant clusters before L3.
        if lv <= 2 and has_consonant_cluster(seg):
            continue
        return lv
    return None


def main():
    graphemes_data = load_graphemes()
    known_units = all_known_units(graphemes_data)

    # Corpus: union of the old 6-level bank files (via their .6level.bak
    # snapshots once created), any current bank files + L7/L8 seeds.
    corpus = set(w.lower() for w in L7_L8_SEED_WORDS)
    for old_file in sorted(WORD_BANKS_DIR.glob("level_*_words.json")):
        with open(old_file, "r", encoding="utf-8") as f:
            corpus.update(w.lower() for w in json.load(f).get("words", []))
        # Snapshot the original 6-level files once (L7/L8 never existed
        # in the 6-level scheme, so they get no .6level.bak).
        if old_file.stem.split("_")[1] in {"1", "2", "3", "4", "5", "6"}:
            bak = old_file.with_suffix(".6level.bak")
            if not bak.exists():
                shutil.copy2(old_file, bak)
    for bak_file in sorted(WORD_BANKS_DIR.glob("level_*_words.6level.bak")):
        with open(bak_file, "r", encoding="utf-8") as f:
            corpus.update(w.lower() for w in json.load(f).get("words", []))

    by_level = {lv: [] for lv in range(1, 9)}
    unplaced = []
    for word in sorted(corpus):
        if not word.isalpha():
            continue
        lv = earliest_level(word, graphemes_data, known_units)
        if lv is None:
            unplaced.append(word)
        else:
            by_level[lv].append(word)

    notes = {
        1: "VC/CVC words from the 10 L1 GPCs only. No clusters, no digraphs, no double letters.",
        2: "All single-letter GPCs plus ck, ff, ll, ss. Double-letter endings are single graphemes. No adjacent consonant clusters.",
        3: "Consonant digraphs (sh, nk, ch, th, ng, qu, zz). Adjacent consonant clusters now permitted (Phase 4).",
        4: "Vowel digraphs and the trigraph igh (RWI Set 2 primary spellings). Two-syllable decodable words.",
        5: "Split digraphs (a-e, i-e, o-e, u-e) and first alternative spellings (ea, ie, oi, aw, ai, oa).",
        6: "More alternatives: ur, er, are, ow (brown), ew, ue.",
        7: "Late Phase 5 trigraphs and complex endings: ire, ore, ear, oor, ure, tion. Phase 6 suffixes taught from here (see 'suffixes' in graphemes_by_level.json).",
        8: "Phase 6 suffix morphology: ous, cious, tious, able, ible, sion (plus prefixes re-, dis-, mis-, sub-). Suffix-aware decodability applies: root decodable + taught suffix = decodable.",
    }

    for lv in range(1, 9):
        level_data = graphemes_data[f"level_{lv}"]
        words = by_level[lv]
        out = {
            "level": lv,
            "name": level_data["name"],
            "maps_to": level_data["maps_to"],
            "description": (
                f"Words first decodable at L{lv} ({level_data['name']}) under the "
                "8-level Curriculum Ledger v2.1. Words are assigned to the earliest "
                "level whose cumulative graphemes segment them (greedy longest-match "
                "grapheme decomposition; untaught digraphs block letter-by-letter reads)."
            ),
            "new_graphemes": level_data["graphemes"],
            "cumulative_graphemes": level_data["cumulative_graphemes"],
            "includes_previous_levels": lv > 1,
            "words": words,
            "word_count": len(words),
            "notes": notes[lv],
        }
        path = WORD_BANKS_DIR / f"level_{lv}_words.json"
        with open(path, "w", encoding="utf-8") as f:
            json.dump(out, f, indent=2)
        print(f"Level {lv} ({level_data['name']}): {len(words)} words")

    if unplaced:
        print(f"\nNot decodable at any level (dropped, {len(unplaced)}):")
        print("  " + ", ".join(unplaced))
    total = sum(len(v) for v in by_level.values())
    print(f"\nTotal words placed: {total}")


if __name__ == "__main__":
    main()
