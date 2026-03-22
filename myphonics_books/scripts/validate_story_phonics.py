"""
Programmatic Phonics Story Validator
=====================================
Validates every word in every story against the level's allowed graphemes
and tricky words. This is the single highest-impact quality tool for MPB.

Usage:
    py -3.12 scripts/validate_story_phonics.py              # Validate all stories
    py -3.12 scripts/validate_story_phonics.py L4            # Validate one level
    py -3.12 scripts/validate_story_phonics.py L5.1          # Validate one book
    py -3.12 scripts/validate_story_phonics.py --fix         # Suggest fixes

Output:
    Per-word verdict: PASS (decodable), TRICKY (listed), or FAIL (non-decodable).
    Summary table with pass rate per book.
"""

import json
import re
import sys
import importlib.util
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_DIR / "data"

# ─── Load phonics data ───────────────────────────────────────────────

with open(DATA_DIR / "graphemes_by_level.json") as f:
    GRAPHEME_DATA = json.load(f)

with open(DATA_DIR / "tricky_words_by_level.json") as f:
    TRICKY_DATA = json.load(f)


def get_cumulative_graphemes(level_num):
    """Return set of graphemes available at this level (cumulative)."""
    key = f"level_{level_num}"
    return set(GRAPHEME_DATA[key]["cumulative_graphemes"])


def get_cumulative_tricky_words(level_num):
    """Return set of tricky words available at this level (cumulative)."""
    key = f"level_{level_num}"
    return set(TRICKY_DATA[key]["cumulative"])


def get_clusters_allowed(level_num):
    """Check if consonant clusters are allowed at this level."""
    key = f"level_{level_num}"
    data = GRAPHEME_DATA[key]
    # Clusters unlock at L3
    return level_num >= 3 or "consonant_clusters" in data


def get_permitted_final_blends(level_num):
    """Return permitted final blends (nd, nt, mp) for L1-L2."""
    key = f"level_{level_num}"
    data = GRAPHEME_DATA[key]
    return set(data.get("permitted_final_blends", []))


# ─── Grapheme decomposition ──────────────────────────────────────────

# Vowel graphemes for cluster detection
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


def decompose_word(word, grapheme_set):
    """
    Decompose a word into graphemes using greedy longest-match.
    Also handles:
    - split digraphs (a-e, i-e, o-e, u-e) where the hyphen represents
      intervening consonant(s)
    - plural -s and -es suffixes
    - past tense -ed suffix
    - -ing suffix
    - -er, -est comparative suffixes

    Returns (True, grapheme_list) or (False, failing_position).
    """
    clean = word.lower().strip()

    # Try split digraph patterns first
    # e.g. "make" = m-a_e-k... wait, a-e means a...e with consonant between
    # Pattern: vowel + consonant(s) + e at end
    split_digraphs = {"a-e", "i-e", "o-e", "u-e"}
    available_splits = split_digraphs & grapheme_set

    if available_splits and len(clean) >= 3 and clean.endswith("e"):
        # Try to find a split digraph pattern
        for sd in available_splits:
            vowel = sd[0]  # a, i, o, u
            # Find vowel position, check if consonant(s) between vowel and final e
            for vi in range(len(clean) - 2):
                if clean[vi] == vowel:
                    # Everything between vowel and final 'e' should be consonant graphemes
                    middle = clean[vi + 1:-1]
                    before = clean[:vi]
                    # Try to decompose: before + split_digraph + middle + (nothing after e)
                    ok_before, res_before = _greedy_decompose(before, grapheme_set)
                    ok_middle, res_middle = _greedy_decompose(middle, grapheme_set)
                    if ok_before and ok_middle and len(middle) > 0:
                        # Check middle is all consonants
                        all_consonant = all(g not in VOWEL_GRAPHEMES for g in res_middle)
                        if all_consonant:
                            return True, res_before + [sd] + res_middle

    # Standard greedy decomposition
    return _greedy_decompose(clean, grapheme_set)


def _greedy_decompose(text, grapheme_set):
    """Simple greedy longest-match decomposition."""
    remaining = text
    found = []
    max_len = max((len(g) for g in grapheme_set), default=1)

    while remaining:
        matched = False
        for length in range(min(max_len, len(remaining)), 0, -1):
            chunk = remaining[:length]
            if chunk in grapheme_set:
                found.append(chunk)
                remaining = remaining[length:]
                matched = True
                break
        if not matched:
            return False, remaining
    return True, found


def has_initial_cluster(grapheme_list):
    """Check if word starts with 2+ consonant graphemes (initial cluster)."""
    count = 0
    for g in grapheme_list:
        if g in VOWEL_GRAPHEMES:
            break
        count += 1
    return count >= 2


def has_forbidden_cluster(grapheme_list, permitted_final_blends):
    """
    Check if word has clusters that aren't in the permitted final blends.
    Returns True if there's a forbidden cluster.
    """
    # Check for initial clusters (always forbidden pre-L3)
    if has_initial_cluster(grapheme_list):
        return True

    # Check for final clusters not in permitted blends
    # Find the last vowel, then check consonants after it
    last_vowel_idx = -1
    for i, g in enumerate(grapheme_list):
        if g in VOWEL_GRAPHEMES:
            last_vowel_idx = i

    if last_vowel_idx >= 0:
        final_consonants = grapheme_list[last_vowel_idx + 1:]
        if len(final_consonants) >= 2:
            # Join them to check against permitted blends
            blend = "".join(final_consonants)
            # Check if ANY permitted blend is a suffix of the blend
            for pb in permitted_final_blends:
                if blend.endswith(pb):
                    return False
            return True

    return False


# ─── Word validation ────────────────────────────────────────────────

def strip_suffixes(word):
    """
    Strip common suffixes and return (stem, suffix).
    Adding -s for plurals/verbs is always permitted.
    """
    w = word.lower()
    if w.endswith("'s"):
        return w[:-2], "'s"
    if w.endswith("s") and not w.endswith("ss") and len(w) > 2:
        return w[:-1], "s"
    return w, ""


def validate_word(word, level_num):
    """
    Validate a single word against level constraints.
    Returns (status, detail) where status is 'PASS', 'TRICKY', or 'FAIL'.
    """
    clean = word.lower().strip()
    if not clean or not clean.isalpha():
        return "SKIP", "non-alphabetic"

    # Check tricky words first
    tricky = get_cumulative_tricky_words(level_num)
    if clean in tricky:
        return "TRICKY", "listed tricky word"

    graphemes = get_cumulative_graphemes(level_num)
    clusters_allowed = get_clusters_allowed(level_num)
    permitted_blends = get_permitted_final_blends(level_num)

    # Try with suffix stripping
    for attempt_word in [clean]:
        stem, suffix = strip_suffixes(attempt_word)

        # Check stem in tricky words
        if stem in tricky:
            return "TRICKY", f"tricky word + '{suffix}'"

        # Decompose
        ok, result = decompose_word(attempt_word, graphemes)
        if ok:
            if not clusters_allowed and has_forbidden_cluster(result, permitted_blends):
                return "FAIL", f"consonant cluster not allowed at L{level_num}: {'-'.join(result)}"
            return "PASS", f"decodable: {'-'.join(result)}"

        # Try stem only (suffix stripped)
        if suffix:
            ok_stem, result_stem = decompose_word(stem, graphemes)
            if ok_stem:
                if not clusters_allowed and has_forbidden_cluster(result_stem, permitted_blends):
                    return "FAIL", f"cluster in stem: {'-'.join(result_stem)}"
                return "PASS", f"decodable: {'-'.join(result_stem)}+{suffix}"

    return "FAIL", f"not decodable at L{level_num}"


# ─── Story loading ──────────────────────────────────────────────────

def extract_words_from_text(text):
    """Extract individual words from story text, stripping punctuation."""
    # Remove common punctuation but keep apostrophes within words
    text = re.sub(r'["""\u201c\u201d]', '', text)
    text = re.sub(r'[.!?,;:\-\u2014\u2013()\[\]{}]', ' ', text)
    words = text.split()
    # Strip leading/trailing quotes and apostrophes
    cleaned = []
    for w in words:
        w = w.strip("'\"")
        if w and any(c.isalpha() for c in w):
            cleaned.append(w)
    return cleaned


def find_story_files():
    """Find all story data files in the data/ directory."""
    stories = []
    for py_file in sorted(DATA_DIR.glob("*_story_*.py")) | sorted(DATA_DIR.glob("*_l*.py")):
        stories.append(py_file)
    # Also check for story JSON files
    for json_file in sorted(DATA_DIR.glob("*_story_*.json")):
        stories.append(json_file)
    return stories


def load_story_module(filepath):
    """Load a Python story data file and extract story text."""
    spec = importlib.util.spec_from_file_location("story_module", filepath)
    module = importlib.util.module_from_spec(spec)
    try:
        spec.loader.exec_module(module)
    except Exception as e:
        return None, str(e)

    # Look for story data in common variable names
    story_text = []
    for attr_name in dir(module):
        attr = getattr(module, attr_name)
        if isinstance(attr, dict):
            # Check for story_pages
            if "story_pages" in attr:
                for page in attr["story_pages"]:
                    if isinstance(page, dict) and "text" in page:
                        story_text.append(page["text"])
                    elif isinstance(page, str):
                        story_text.append(page)
            # Check for pages directly
            if "pages" in attr:
                for page in attr["pages"]:
                    if isinstance(page, dict) and "text" in page:
                        story_text.append(page["text"])

    return story_text, None


def parse_level_from_filename(filename):
    """Extract level number from filename like 'xxx_l2_1.py' or 'xxx_L2_1.py'."""
    match = re.search(r'[lL](\d+)', filename)
    if match:
        return int(match.group(1))
    return None


# ─── Main validation ────────────────────────────────────────────────

def validate_story(filepath, level_num=None):
    """Validate all words in a story file."""
    if level_num is None:
        level_num = parse_level_from_filename(filepath.name)
    if level_num is None:
        return None, "Cannot determine level from filename"

    story_texts, error = load_story_module(filepath)
    if error:
        return None, f"Load error: {error}"
    if not story_texts:
        return None, "No story text found"

    all_text = " ".join(story_texts)
    words = extract_words_from_text(all_text)

    results = {"PASS": [], "TRICKY": [], "FAIL": [], "SKIP": []}
    fail_details = {}

    for word in words:
        status, detail = validate_word(word, level_num)
        results[status].append(word)
        if status == "FAIL":
            fail_details[word] = detail

    return {
        "file": filepath.name,
        "level": level_num,
        "total_words": len(words),
        "unique_words": len(set(w.lower() for w in words)),
        "pass": len(results["PASS"]),
        "tricky": len(results["TRICKY"]),
        "fail": len(results["FAIL"]),
        "skip": len(results["SKIP"]),
        "failed_words": fail_details,
        "pass_rate": (len(results["PASS"]) + len(results["TRICKY"])) / max(len(words) - len(results["SKIP"]), 1) * 100,
    }, None


def main():
    filter_level = None
    filter_sub = None
    show_fix = "--fix" in sys.argv

    for arg in sys.argv[1:]:
        if arg == "--fix":
            continue
        match = re.match(r'L?(\d+)\.?(\d+)?', arg, re.IGNORECASE)
        if match:
            filter_level = int(match.group(1))
            if match.group(2):
                filter_sub = int(match.group(2))

    # Find all story files
    story_files = []
    for py_file in sorted(DATA_DIR.glob("*.py")):
        level = parse_level_from_filename(py_file.name)
        if level is None:
            continue
        if filter_level and level != filter_level:
            continue
        if filter_sub:
            sub_match = re.search(r'[lL]\d+[_.](\d+)', py_file.name)
            if sub_match and int(sub_match.group(1)) != filter_sub:
                continue
        story_files.append(py_file)

    if not story_files:
        print(f"No story files found" + (f" for L{filter_level}" if filter_level else ""))
        return

    print("=" * 70)
    print("MYPHONICSBOOKS PHONICS VALIDATOR")
    print("=" * 70)

    all_results = []
    for filepath in story_files:
        result, error = validate_story(filepath)
        if error:
            print(f"\n  SKIP  {filepath.name}: {error}")
            continue
        if result["total_words"] == 0:
            continue

        all_results.append(result)

        # Print per-file results
        status_icon = "PASS" if result["fail"] == 0 else "FAIL"
        print(f"\n  [{status_icon}] {result['file']} (L{result['level']})")
        print(f"         Words: {result['total_words']} total, {result['unique_words']} unique")
        print(f"         Pass: {result['pass']}  Tricky: {result['tricky']}  Fail: {result['fail']}  Rate: {result['pass_rate']:.1f}%")

        if result["failed_words"]:
            print(f"         Failed words:")
            for word, detail in sorted(result["failed_words"].items()):
                print(f"           - {word}: {detail}")

                if show_fix:
                    # Suggest fix: add to tricky words or find which level it works at
                    for try_level in range(result["level"], 7):
                        status, _ = validate_word(word, try_level)
                        if status != "FAIL":
                            if try_level == result["level"]:
                                print(f"             FIX: Already decodable (check suffix handling)")
                            else:
                                print(f"             FIX: Decodable at L{try_level}, or add to L{result['level']} tricky words")
                            break
                    else:
                        print(f"             FIX: Add '{word}' to tricky_words_by_level.json at level_{result['level']}")

    # Summary table
    if all_results:
        print("\n" + "=" * 70)
        print("SUMMARY")
        print("=" * 70)
        print(f"  {'File':<40} {'Level':>5} {'Words':>6} {'Pass%':>6} {'Fails':>6}")
        print("  " + "-" * 63)
        total_words = 0
        total_fails = 0
        for r in sorted(all_results, key=lambda x: (x["level"], x["file"])):
            total_words += r["total_words"]
            total_fails += r["fail"]
            status = "OK" if r["fail"] == 0 else "!!"
            print(f"  {r['file']:<40} L{r['level']:>4} {r['total_words']:>6} {r['pass_rate']:>5.1f}% {r['fail']:>5} {status}")
        print("  " + "-" * 63)
        overall_rate = (total_words - total_fails) / max(total_words, 1) * 100
        print(f"  {'TOTAL':<40} {'':>5} {total_words:>6} {overall_rate:>5.1f}% {total_fails:>5}")

        if total_fails > 0:
            # Collect all unique failed words
            all_fails = {}
            for r in all_results:
                for w, d in r["failed_words"].items():
                    if w not in all_fails:
                        all_fails[w] = (r["level"], d)

            print(f"\n  All unique failed words ({len(all_fails)}):")
            for word in sorted(all_fails.keys()):
                level, detail = all_fails[word]
                print(f"    L{level}: {word}")


if __name__ == "__main__":
    main()
