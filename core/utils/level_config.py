"""
Level configuration for MyPhonicsBooks.

Defines the 6 reading levels, their graphemes, sentence complexity rules,
and colour codes. This is the single source of truth for level definitions.
"""

import json
from pathlib import Path
from dataclasses import dataclass
from typing import List, Dict, Optional

# Base path for data files
DATA_DIR = Path(__file__).parent.parent.parent / "data"


@dataclass
class LevelConfig:
    """Configuration for a single reading level."""
    level: int
    name: str
    maps_to: str
    graphemes: List[str]
    word_structure: str
    sentences_per_page: str
    words_per_sentence: str
    colour_code: str

    @property
    def min_sentences_per_page(self) -> int:
        """Minimum sentences per page."""
        return int(self.sentences_per_page.split("-")[0])

    @property
    def max_sentences_per_page(self) -> int:
        """Maximum sentences per page."""
        return int(self.sentences_per_page.split("-")[1])

    @property
    def min_words_per_sentence(self) -> int:
        """Minimum words per sentence."""
        return int(self.words_per_sentence.split("-")[0])

    @property
    def max_words_per_sentence(self) -> int:
        """Maximum words per sentence."""
        return int(self.words_per_sentence.split("-")[1])


def load_graphemes_by_level() -> Dict[str, dict]:
    """Load grapheme definitions from JSON."""
    with open(DATA_DIR / "graphemes_by_level.json", "r", encoding="utf-8") as f:
        return json.load(f)


def load_tricky_words_by_level() -> Dict[str, dict]:
    """Load tricky words from JSON."""
    with open(DATA_DIR / "tricky_words_by_level.json", "r", encoding="utf-8") as f:
        return json.load(f)


def get_level_config(level: int) -> LevelConfig:
    """
    Get configuration for a specific reading level.

    Args:
        level: Reading level 1-6

    Returns:
        LevelConfig for the specified level

    Raises:
        ValueError: If level is not 1-6
    """
    if level < 1 or level > 6:
        raise ValueError(f"Level must be 1-6, got {level}")

    graphemes_data = load_graphemes_by_level()
    level_key = f"level_{level}"
    level_data = graphemes_data[level_key]

    # Get cumulative graphemes for levels 2+
    if level == 1:
        graphemes = level_data["graphemes"]
    else:
        graphemes = level_data.get("cumulative_graphemes", [])
        if not graphemes:
            # Build cumulative list from all previous levels
            graphemes = []
            for l in range(1, level + 1):
                l_data = graphemes_data[f"level_{l}"]
                if l == 1:
                    graphemes.extend(l_data["graphemes"])
                else:
                    graphemes.extend(l_data.get("new_graphemes", []))

    return LevelConfig(
        level=level,
        name=level_data["name"],
        maps_to=level_data["maps_to"],
        graphemes=graphemes,
        word_structure=level_data["word_structure"],
        sentences_per_page=level_data["sentences_per_page"],
        words_per_sentence=level_data["words_per_sentence"],
        colour_code=level_data["colour_code"]
    )


def get_tricky_words(level: int) -> List[str]:
    """
    Get cumulative tricky words for a level.

    Tricky words are words that cannot be decoded using phonics rules
    and must be memorised (e.g., "the", "said", "was").

    Args:
        level: Reading level 1-6

    Returns:
        List of tricky words permitted at this level (cumulative)
    """
    if level < 1 or level > 6:
        raise ValueError(f"Level must be 1-6, got {level}")

    tricky_data = load_tricky_words_by_level()
    level_key = f"level_{level}"
    return tricky_data[level_key]["cumulative"]


def get_all_level_configs() -> Dict[int, LevelConfig]:
    """Get configuration for all 6 levels."""
    return {level: get_level_config(level) for level in range(1, 7)}


# Level descriptions for parent-friendly UI
LEVEL_DESCRIPTIONS = {
    1: "Just starting to sound out letters",
    2: "Knows letter sounds, reading simple words",
    3: "Reading short sentences with some longer sounds",
    4: "Reading sentences with blended sounds",
    5: "Reading longer sentences and simple stories",
    6: "Reading independently with expression"
}


def get_level_description(level: int) -> str:
    """Get parent-friendly description for a level."""
    if level not in LEVEL_DESCRIPTIONS:
        raise ValueError(f"Level must be 1-6, got {level}")
    return LEVEL_DESCRIPTIONS[level]


# Worksheet configuration by level
WORKSHEET_CONFIG = {
    1: {
        "type": "letter_formation",
        "description": "Trace and copy the new graphemes",
        "grapheme_count": 4
    },
    2: {
        "type": "letter_formation",
        "description": "Trace and copy the new graphemes",
        "grapheme_count": 4
    },
    3: {
        "type": "word_writing",
        "description": "Write words from the story using target sounds",
        "word_count": 4
    },
    4: {
        "type": "word_writing",
        "description": "Write words from the story using target sounds",
        "word_count": 6
    },
    5: {
        "type": "sentence_writing",
        "description": "Write sentences about the story using target vocabulary",
        "sentence_count": 2
    },
    6: {
        "type": "sentence_writing",
        "description": "Write sentences about the story using target vocabulary",
        "sentence_count": 3
    }
}


def get_worksheet_config(level: int) -> dict:
    """Get worksheet configuration for a level."""
    if level not in WORKSHEET_CONFIG:
        raise ValueError(f"Level must be 1-6, got {level}")
    return WORKSHEET_CONFIG[level]
