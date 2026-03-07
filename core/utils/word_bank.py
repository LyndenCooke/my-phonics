"""
Word bank management for MyPhonicsBooks.

THE WORD BANK IS THE LAW.

Every word in a story must either:
1. Be decodable at the selected level (in the word bank), OR
2. Be a listed tricky word for that level or below

There are NO exceptions.
"""

import json
from pathlib import Path
from typing import List, Set, Dict, Optional
from functools import lru_cache

# Base path for data files
DATA_DIR = Path(__file__).parent.parent.parent / "data"
WORD_BANKS_DIR = DATA_DIR / "word_banks"


@lru_cache(maxsize=6)
def load_word_bank(level: int) -> Set[str]:
    """
    Load the word bank for a specific level.

    Word banks are cumulative - each level includes all words
    from previous levels.

    Args:
        level: Reading level 1-6

    Returns:
        Set of permitted decodable words (lowercase)
    """
    if level < 1 or level > 6:
        raise ValueError(f"Level must be 1-6, got {level}")

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


@lru_cache(maxsize=6)
def load_tricky_words(level: int) -> Set[str]:
    """
    Load cumulative tricky words for a level.

    Args:
        level: Reading level 1-6

    Returns:
        Set of tricky words (lowercase)
    """
    if level < 1 or level > 6:
        raise ValueError(f"Level must be 1-6, got {level}")

    tricky_file = DATA_DIR / "tricky_words_by_level.json"
    with open(tricky_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    level_key = f"level_{level}"
    tricky_words = data[level_key]["cumulative"]

    # Normalise to lowercase
    return set(word.lower() for word in tricky_words)


def get_permitted_words(level: int) -> Set[str]:
    """
    Get all permitted words for a level (decodable + tricky).

    Args:
        level: Reading level 1-6

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
        level: Reading level 1-6

    Returns:
        True if word is permitted (decodable or tricky word)
    """
    word_lower = word.lower().strip()
    permitted = get_permitted_words(level)
    return word_lower in permitted


def get_word_status(word: str, level: int) -> Dict[str, any]:
    """
    Get detailed status of a word at a given level.

    Args:
        word: The word to check
        level: Reading level 1-6

    Returns:
        Dict with keys: permitted, is_decodable, is_tricky, word
    """
    word_lower = word.lower().strip()
    decodable = load_word_bank(level)
    tricky = load_tricky_words(level)

    is_decodable = word_lower in decodable
    is_tricky = word_lower in tricky

    return {
        "word": word,
        "word_normalised": word_lower,
        "permitted": is_decodable or is_tricky,
        "is_decodable": is_decodable,
        "is_tricky": is_tricky,
        "level": level
    }


def find_level_for_word(word: str) -> Optional[int]:
    """
    Find the earliest level at which a word becomes permitted.

    Args:
        word: The word to find

    Returns:
        Level number (1-6) or None if word is not permitted at any level
    """
    word_lower = word.lower().strip()

    for level in range(1, 7):
        if is_word_permitted(word_lower, level):
            return level

    return None


def get_word_bank_stats(level: int) -> Dict[str, int]:
    """
    Get statistics about the word bank for a level.

    Args:
        level: Reading level 1-6

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
