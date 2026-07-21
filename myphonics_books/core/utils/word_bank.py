"""
Word bank management for MyPhonicsBooks.

THE WORD BANK IS THE LAW.

Every word in a story must either:
1. Be decodable at the selected level (in the word bank, or — from L7 —
   a decodable root plus a suffix/prefix taught at that level), OR
2. Be a listed tricky word for that level or below

There are NO exceptions.

8-level Curriculum Ledger v2.1: levels run 1-8 (L7 Reading Together adds the
trigraphs ire/ore/ear/oor/ure and tion plus the Phase 6 suffixes; L8 Reading
Champion adds -ous/-cious/-tious/-able/-ible/-sion and the prefixes
re-/dis-/mis-/sub-).  Suffix-aware decodability: a word counts as decodable
when its root is decodable and every affix is taught at or below the level,
honouring the doubling, drop-e and y-to-i spelling rules.
"""

import json
from pathlib import Path
from typing import List, Set, Dict, Optional, Tuple
from functools import lru_cache

# Base path for data files
DATA_DIR = Path(__file__).parent.parent.parent / "data"
WORD_BANKS_DIR = DATA_DIR / "word_banks"

# The 8-level Curriculum Ledger is the source of truth.
MAX_LEVEL = 8

# Single-letter vowel graphemes (used to reverse the drop-e rule sensibly).
_VOWELS = set("aeiou")


def _check_level(level: int) -> None:
    if level < 1 or level > MAX_LEVEL:
        raise ValueError(f"Level must be 1-{MAX_LEVEL}, got {level}")


@lru_cache(maxsize=MAX_LEVEL)
def load_word_bank(level: int) -> Set[str]:
    """
    Load the word bank for a specific level.

    Word banks are cumulative - each level includes all words
    from previous levels.

    Args:
        level: Reading level 1-8

    Returns:
        Set of permitted decodable words (lowercase)
    """
    _check_level(level)

    all_words: Set[str] = set()

    # Load words from this level and all previous levels
    for l in range(1, level + 1):
        word_file = WORD_BANKS_DIR / f"level_{l}_words.json"
        if word_file.exists():
            with open(word_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                words = data.get("words", [])
                # Normalise to lowercase
                all_words.update(word.lower() for word in words)

    return all_words


@lru_cache(maxsize=MAX_LEVEL)
def load_tricky_words(level: int) -> Set[str]:
    """
    Load cumulative tricky words for a level.

    Args:
        level: Reading level 1-8

    Returns:
        Set of tricky words (lowercase)
    """
    _check_level(level)

    tricky_file = DATA_DIR / "tricky_words_by_level.json"
    with open(tricky_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    level_key = f"level_{level}"
    tricky_words = data[level_key]["cumulative"]

    # Normalise to lowercase
    return set(word.lower() for word in tricky_words)


@lru_cache(maxsize=MAX_LEVEL)
def _load_morphology(level: int) -> Tuple[Tuple[str, ...], Tuple[str, ...]]:
    """
    Cumulative (suffixes, prefixes) taught at or below ``level``.

    Sourced from the optional "suffixes"/"prefixes" keys in
    data/graphemes_by_level.json (L7 introduces the Phase 6 suffixes;
    L8 adds -ous/-cious/-tious/-able/-ible/-tion/-sion and re-/dis-/mis-/sub-).
    Levels without those keys contribute nothing, so L1-L6 validation is
    unaffected.
    """
    _check_level(level)
    with open(DATA_DIR / "graphemes_by_level.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    suffixes: List[str] = []
    prefixes: List[str] = []
    for l in range(1, level + 1):
        level_data = data.get(f"level_{l}", {})
        suffixes.extend(s for s in level_data.get("suffixes", []) if s not in suffixes)
        prefixes.extend(p for p in level_data.get("prefixes", []) if p not in prefixes)
    # Longest first so e.g. -cious wins over -ous, -ness over -s.
    suffixes.sort(key=len, reverse=True)
    prefixes.sort(key=len, reverse=True)
    return tuple(suffixes), tuple(prefixes)


def _root_candidates(word: str, suffix: str) -> List[str]:
    """
    Possible roots for ``word`` ending in ``suffix``, reversing the Phase 6
    spelling rules: just-add, doubling (hop -> hopping), drop-e
    (make -> making) and y-to-i (happy -> happier).
    """
    stem = word[: -len(suffix)]
    if len(stem) < 2:
        return []
    candidates = [stem]
    # Drop-e reversal: making -> mak -> make
    if stem[-1] not in _VOWELS:
        candidates.append(stem + "e")
    # Doubling reversal: hopping -> hopp -> hop
    if len(stem) >= 3 and stem[-1] == stem[-2] and stem[-1] not in _VOWELS:
        candidates.append(stem[:-1])
    # y-to-i reversal: happier -> happi -> happy
    if stem.endswith("i"):
        candidates.append(stem[:-1] + "y")
    return candidates


def _is_decodable_by_morphology(word: str, level: int, decodable: Set[str]) -> bool:
    """
    Suffix/prefix-aware decodability (active from L7, where the graphemes
    data first defines morphology): the word is decodable if a taught prefix
    and/or suffix can be stripped to leave a root that is itself decodable
    at this level.
    """
    suffixes, prefixes = _load_morphology(level)
    if not suffixes and not prefixes:
        return False

    stems = {word}
    # Strip one taught prefix first (re-, dis-, mis-, sub- at L8).
    for prefix in prefixes:
        if word.startswith(prefix) and len(word) - len(prefix) >= 2:
            stems.add(word[len(prefix):])

    for stem in stems:
        if stem != word and stem in decodable:
            return True
        for suffix in suffixes:
            if stem.endswith(suffix) and stem != suffix:
                for root in _root_candidates(stem, suffix):
                    if root in decodable:
                        return True
    return False


def get_permitted_words(level: int) -> Set[str]:
    """
    Get all permitted words for a level (decodable + tricky).

    Note: morphology-derived words (root + taught suffix) are checked
    dynamically by ``get_word_status``/``is_word_permitted`` and are not
    enumerated here.

    Args:
        level: Reading level 1-8

    Returns:
        Set of all permitted words (lowercase)
    """
    decodable = load_word_bank(level)
    tricky = load_tricky_words(level)
    return decodable | tricky


def is_word_permitted(word: str, level: int) -> bool:
    """
    Check if a word is permitted at a given level.

    Args:
        word: The word to check
        level: Reading level 1-8

    Returns:
        True if word is permitted (decodable, morphology-decodable or tricky)
    """
    return get_word_status(word, level)["permitted"]


def get_word_status(word: str, level: int) -> Dict[str, any]:
    """
    Get detailed status of a word at a given level.

    Args:
        word: The word to check
        level: Reading level 1-8

    Returns:
        Dict with keys: permitted, is_decodable, is_tricky, is_morphology, word
    """
    word_lower = word.lower().strip()
    decodable = load_word_bank(level)
    tricky = load_tricky_words(level)

    is_decodable = word_lower in decodable
    is_tricky = word_lower in tricky
    is_morphology = False
    if not is_decodable and not is_tricky:
        # Suffix-aware decodability (no-op below L7 — no morphology defined).
        is_morphology = _is_decodable_by_morphology(word_lower, level, decodable)

    return {
        "word": word,
        "word_normalised": word_lower,
        "permitted": is_decodable or is_tricky or is_morphology,
        "is_decodable": is_decodable or is_morphology,
        "is_tricky": is_tricky,
        "is_morphology": is_morphology,
        "level": level
    }


def find_level_for_word(word: str) -> Optional[int]:
    """
    Find the earliest level at which a word becomes permitted.

    Args:
        word: The word to find

    Returns:
        Level number (1-8) or None if word is not permitted at any level
    """
    word_lower = word.lower().strip()

    for level in range(1, MAX_LEVEL + 1):
        if is_word_permitted(word_lower, level):
            return level

    return None


def get_word_bank_stats(level: int) -> Dict[str, int]:
    """
    Get statistics about the word bank for a level.

    Args:
        level: Reading level 1-8

    Returns:
        Dict with word counts
    """
    decodable = load_word_bank(level)
    tricky = load_tricky_words(level)

    return {
        "level": level,
        "decodable_count": len(decodable),
        "tricky_count": len(tricky),
        "total_permitted": len(decodable | tricky)
    }


def clear_cache():
    """Clear the word bank cache (useful for testing)."""
    load_word_bank.cache_clear()
    load_tricky_words.cache_clear()
    _load_morphology.cache_clear()
