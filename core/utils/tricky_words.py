"""
Tricky words management for MyPhonicsBooks.

Tricky words are words that cannot be decoded using standard phonics rules.
Children must memorise these words by sight. Each level introduces new
tricky words, and all previous tricky words remain permitted.

Examples:
- Level 1: the, to, I, no, go, into
- Level 2: he, she, we, me, be, was, my, you, her, they, all, are
"""

import json
from pathlib import Path
from typing import List, Set, Dict
from functools import lru_cache

# Base path for data files
DATA_DIR = Path(__file__).parent.parent.parent / "data"


@lru_cache(maxsize=1)
def _load_tricky_words_data() -> Dict[str, dict]:
    """Load all tricky words data from JSON."""
    tricky_file = DATA_DIR / "tricky_words_by_level.json"
    with open(tricky_file, "r", encoding="utf-8") as f:
        return json.load(f)


def get_new_tricky_words(level: int) -> List[str]:
    """
    Get only the NEW tricky words introduced at a specific level.

    Args:
        level: Reading level 1-6

    Returns:
        List of new tricky words for this level only
    """
    if level < 1 or level > 6:
        raise ValueError(f"Level must be 1-6, got {level}")

    data = _load_tricky_words_data()
    level_key = f"level_{level}"
    return data[level_key]["new_tricky_words"]


def get_cumulative_tricky_words(level: int) -> List[str]:
    """
    Get all tricky words up to and including a specific level.

    Args:
        level: Reading level 1-6

    Returns:
        List of all tricky words permitted at this level
    """
    if level < 1 or level > 6:
        raise ValueError(f"Level must be 1-6, got {level}")

    data = _load_tricky_words_data()
    level_key = f"level_{level}"
    return data[level_key]["cumulative"]


def is_tricky_word(word: str, level: int) -> bool:
    """
    Check if a word is a tricky word at a given level.

    Args:
        word: The word to check
        level: Reading level 1-6

    Returns:
        True if word is a tricky word at this level
    """
    if level < 1 or level > 6:
        raise ValueError(f"Level must be 1-6, got {level}")

    word_lower = word.lower().strip()
    cumulative = get_cumulative_tricky_words(level)
    return word_lower in [w.lower() for w in cumulative]


def get_tricky_words_for_story(level: int, story_words: List[str]) -> List[str]:
    """
    Filter a list of story words to find which ones are tricky words.

    Args:
        level: Reading level 1-6
        story_words: List of words from the story

    Returns:
        List of tricky words found in the story
    """
    cumulative = set(w.lower() for w in get_cumulative_tricky_words(level))

    tricky_in_story = []
    seen = set()

    for word in story_words:
        word_lower = word.lower().strip()
        if word_lower in cumulative and word_lower not in seen:
            tricky_in_story.append(word)
            seen.add(word_lower)

    return tricky_in_story


def clear_cache():
    """Clear the tricky words cache (useful for testing)."""
    _load_tricky_words_data.cache_clear()
