"""
Rebuild word banks with correct level assignments.
Saves the fixed JSON files.
"""
import json
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"
WORD_BANKS_DIR = DATA_DIR / "word_banks"

# Load grapheme data
with open(DATA_DIR / "graphemes_by_level.json") as f:
    grapheme_data = json.load(f)

VOWEL_GRAPHEMES = {
    "a", "e", "i", "o", "u",
    "ai", "ee", "igh", "oa", "oo", "ar", "or", "ur", "ow", "oi",
    "ear", "air", "ure", "er",
    "ay", "ou", "ie", "ea", "oy", "ir", "ue", "aw", "ew", "oe", "au",
    "a-e", "e-e", "i-e", "o-e", "u-e"
}

def decompose_word(word, graphemes):
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
            return False, []
    return True, found

def has_consonant_cluster(grapheme_list):
    consonant_run = 0
    for g in grapheme_list:
        if g in VOWEL_GRAPHEMES:
            if consonant_run >= 2:
                return True
            consonant_run = 0
        else:
            consonant_run += 1
    if consonant_run >= 2:
        return True
    return False

# Load existing word banks
with open(WORD_BANKS_DIR / "level_1_words.json") as f:
    l1_data = json.load(f)
with open(WORD_BANKS_DIR / "level_2_words.json") as f:
    l2_data = json.load(f)

all_words = set(l1_data["words"]) | set(l2_data["words"])

l1_graphemes = set(grapheme_data["level_1"]["cumulative_graphemes"])
l2_graphemes = set(grapheme_data["level_2"]["cumulative_graphemes"])

# Classify all words
level_1_words = []
level_2_words = []
level_4_words = []
unclassified = []

for word in sorted(all_words):
    # Try Level 1
    ok1, g1 = decompose_word(word, l1_graphemes)
    if ok1 and not has_consonant_cluster(g1):
        level_1_words.append(word)
        continue

    # Try Level 2 (no clusters)
    ok2, g2 = decompose_word(word, l2_graphemes)
    if ok2 and not has_consonant_cluster(g2):
        level_2_words.append(word)
        continue

    # Level 4 (clusters allowed, all graphemes up to L3)
    if ok2 and has_consonant_cluster(g2):
        level_4_words.append(word)
        continue

    if ok1 and has_consonant_cluster(g1):
        level_4_words.append(word)
        continue

    unclassified.append(word)

# Save rebuilt Level 1
l1_output = {
    "level": 1,
    "name": "First Sounds",
    "description": "CVC words using Phase 2 sounds: s, a, t, p, i, n, m, d, g, o, c, k, ck, e, u, r, h, b, f, ff, l, ll, ss",
    "graphemes": grapheme_data["level_1"]["graphemes"],
    "words": sorted(level_1_words),
    "word_count": len(level_1_words),
    "notes": "All words are CVC, VC, or CV structure only. No consonant clusters. Double consonants (ff, ll, ss, ck) are single graphemes."
}

with open(WORD_BANKS_DIR / "level_1_words.json", "w") as f:
    json.dump(l1_output, f, indent=2)
print(f"Level 1: {len(level_1_words)} words saved")

# Save rebuilt Level 2
l2_output = {
    "level": 2,
    "name": "New Sounds",
    "description": "CVC words adding: j, v, w, x, y, z, zz, qu, ch, sh, th, ng, nk (plus all Level 1 sounds)",
    "new_graphemes": grapheme_data["level_2"]["graphemes"],
    "includes_previous_levels": True,
    "words": sorted(level_2_words),
    "word_count": len(level_2_words),
    "notes": "Words use Level 1 + Level 2 graphemes. CVC structure with digraphs (ch, sh, th, ng, nk). No consonant clusters."
}

with open(WORD_BANKS_DIR / "level_2_words.json", "w") as f:
    json.dump(l2_output, f, indent=2)
print(f"Level 2: {len(level_2_words)} words saved")

# Save Level 4 (cluster words)
l4_output = {
    "level": 4,
    "name": "Blending",
    "description": "Words with consonant clusters (CCVC, CVCC, CCVCC) using all graphemes from Levels 1-3",
    "new_graphemes": [],
    "includes_previous_levels": True,
    "words": sorted(level_4_words),
    "word_count": len(level_4_words),
    "notes": "No new graphemes. Focus on blending adjacent consonants. Words previously incorrectly placed in Level 1 and Level 2."
}

with open(WORD_BANKS_DIR / "level_4_words.json", "w") as f:
    json.dump(l4_output, f, indent=2)
print(f"Level 4: {len(level_4_words)} words saved")

if unclassified:
    print(f"\nUnclassified: {unclassified}")

# Summary
print(f"\n--- SUMMARY ---")
print(f"Level 1: {len(level_1_words)} words (CVC only)")
print(f"Level 2: {len(level_2_words)} words (CVC + digraphs)")
print(f"Level 4: {len(level_4_words)} words (consonant clusters)")
print(f"Total: {len(level_1_words) + len(level_2_words) + len(level_4_words)}")
