"""
Validate and fix word banks — ensure every word at every level
uses only graphemes taught at that level (cumulative).

CRITICAL: Cluster detection must work at the GRAPHEME level, not letter level.
"fish" = f-i-sh = CVC (NOT a cluster — "sh" is one grapheme)
"back" = b-a-ck = CVC (NOT a cluster — "ck" is one grapheme)
"frog" = f-r-o-g = CCVC (IS a cluster — f+r are two consonant graphemes)
"bench" = b-e-n-ch = CVCC (IS a cluster — n+ch are two consonant graphemes)
"""
import json
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"

# Load grapheme data
with open(DATA_DIR / "graphemes_by_level.json") as f:
    grapheme_data = json.load(f)

# Vowel graphemes (single letters and digraphs)
VOWEL_GRAPHEMES = {
    "a", "e", "i", "o", "u",
    "ai", "ee", "igh", "oa", "oo", "ar", "or", "ur", "ow", "oi",
    "ear", "air", "ure", "er",
    "ay", "ou", "ie", "ea", "oy", "ir", "ue", "aw", "ew", "oe", "au",
    "a-e", "e-e", "i-e", "o-e", "u-e"
}

def get_cumulative_graphemes(level):
    key = f"level_{level}"
    return grapheme_data[key]["cumulative_graphemes"]

def decompose_word(word, graphemes):
    """
    Decompose a word into graphemes from the allowed set.
    Greedy matching — longest grapheme first.
    Returns (True, grapheme_list) or (False, error_msg).
    """
    remaining = word.lower()
    found = []
    grapheme_set = set(graphemes)
    while remaining:
        matched = False
        for length in [3, 2, 1]:
            if length > len(remaining):
                continue
            chunk = remaining[:length]
            if chunk in grapheme_set:
                found.append(chunk)
                remaining = remaining[length:]
                matched = True
                break
        if not matched:
            return False, f"Unknown grapheme '{remaining[0]}' in '{word}'"
    return True, found

def has_consonant_cluster(grapheme_list):
    """
    Check if a list of graphemes contains adjacent consonant graphemes.
    Two or more consonant graphemes next to each other = cluster.
    "sh" counts as ONE consonant grapheme, not two.
    """
    consonant_run = 0
    for g in grapheme_list:
        if g in VOWEL_GRAPHEMES:
            if consonant_run >= 2:
                return True
            consonant_run = 0
        else:
            consonant_run += 1
    # Check final consonant run
    if consonant_run >= 2:
        return True
    return False

def grapheme_pattern(grapheme_list):
    """Get CV pattern from grapheme list. E.g., ['sh','o','p'] -> 'CVC'"""
    pattern = ""
    for g in grapheme_list:
        pattern += "V" if g in VOWEL_GRAPHEMES else "C"
    return pattern

# ===== VALIDATE LEVEL 1 =====
print("=" * 60)
print("LEVEL 1 VALIDATION")
print("=" * 60)

l1_graphemes = set(get_cumulative_graphemes(1))

with open(DATA_DIR / "word_banks" / "level_1_words.json") as f:
    l1_data = json.load(f)

valid_l1 = []
move_to_l2 = []
move_to_l4 = []
invalid_l1 = []

for word in l1_data["words"]:
    ok, result = decompose_word(word, l1_graphemes)
    if not ok:
        # Try Level 2 graphemes
        ok2, result2 = decompose_word(word, set(get_cumulative_graphemes(2)))
        if ok2:
            if has_consonant_cluster(result2):
                move_to_l4.append((word, grapheme_pattern(result2)))
            else:
                move_to_l2.append(word)
        else:
            invalid_l1.append((word, result))
    else:
        if has_consonant_cluster(result):
            move_to_l4.append((word, grapheme_pattern(result)))
        else:
            valid_l1.append(word)

print(f"\nValid Level 1 words: {len(valid_l1)}")
print(f"  Examples: {sorted(valid_l1)[:20]}...")

print(f"\nMove to Level 2 (uses j/v/w/x/y/z): {len(move_to_l2)}")
print(f"  Words: {sorted(move_to_l2)}")

print(f"\nMove to Level 4 (consonant clusters): {len(move_to_l4)}")
for w, p in sorted(move_to_l4):
    print(f"  {w} ({p})")

if invalid_l1:
    print(f"\nInvalid: {len(invalid_l1)}")
    for w, e in invalid_l1:
        print(f"  {w}: {e}")

# ===== VALIDATE LEVEL 2 =====
print("\n" + "=" * 60)
print("LEVEL 2 VALIDATION")
print("=" * 60)

l2_graphemes = set(get_cumulative_graphemes(2))

with open(DATA_DIR / "word_banks" / "level_2_words.json") as f:
    l2_data = json.load(f)

valid_l2 = []
move_l2_to_l4 = []
invalid_l2 = []

for word in l2_data["words"]:
    ok, result = decompose_word(word, l2_graphemes)
    if not ok:
        invalid_l2.append((word, result))
    else:
        if has_consonant_cluster(result):
            move_l2_to_l4.append((word, grapheme_pattern(result)))
        else:
            valid_l2.append(word)

print(f"\nValid Level 2 words (CVC with digraphs, no clusters): {len(valid_l2)}")
print(f"  Words: {sorted(valid_l2)}")

print(f"\nMove to Level 4 (consonant clusters): {len(move_l2_to_l4)}")
for w, p in sorted(move_l2_to_l4)[:30]:
    print(f"  {w} ({p})")
if len(move_l2_to_l4) > 30:
    print(f"  ... and {len(move_l2_to_l4) - 30} more")

if invalid_l2:
    print(f"\nInvalid: {len(invalid_l2)}")
    for w, e in invalid_l2:
        print(f"  {w}: {e}")

# ===== SUMMARY =====
print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)
print(f"Level 1: {len(valid_l1)} valid CVC words (was {len(l1_data['words'])})")
print(f"Level 2: {len(valid_l2)} existing + {len(move_to_l2)} from L1 = {len(valid_l2) + len(move_to_l2)} CVC words")
print(f"Level 4 pool: {len(move_to_l4) + len(move_l2_to_l4)} cluster words available")
print(f"Invalid total: {len(invalid_l1) + len(invalid_l2)}")
