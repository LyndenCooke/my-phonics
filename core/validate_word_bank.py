"""
Quality Gate: Word Bank Validation

THE MOST CRITICAL SCRIPT IN THE SYSTEM.

This script validates that EVERY word in a story text is either:
1. Decodable at the selected level (in the word bank), OR
2. A listed tricky word for that level or below

There are NO exceptions. If a word fails validation, the story
must be rewritten. This is the entire educational value proposition.

Usage:
    from execution.validate_word_bank import validate_story_text

    result = validate_story_text(story_text, level=3)
    if not result["valid"]:
        print(f"Failed words: {result['failed_words']}")
        print(f"Failed sentences: {result['failed_sentences']}")
"""

import re
from typing import List, Dict, Set, Tuple, Optional
from dataclasses import dataclass, field

from .utils.word_bank import get_permitted_words, is_word_permitted, get_word_status


@dataclass
class ValidationResult:
    """Result of validating story text against word bank."""
    valid: bool
    level: int
    total_words: int
    unique_words: int
    failed_words: List[Dict] = field(default_factory=list)
    failed_sentences: List[Dict] = field(default_factory=list)
    decodable_words_used: List[str] = field(default_factory=list)
    tricky_words_used: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialisation."""
        return {
            "valid": self.valid,
            "level": self.level,
            "total_words": self.total_words,
            "unique_words": self.unique_words,
            "failed_words": self.failed_words,
            "failed_sentences": self.failed_sentences,
            "decodable_words_used": self.decodable_words_used,
            "tricky_words_used": self.tricky_words_used,
            "failed_count": len(self.failed_words)
        }


def extract_words(text: str) -> List[str]:
    """
    Extract words from text, removing punctuation but preserving case.

    Handles:
    - Standard punctuation (.,!?;:)
    - Quotation marks (" ' ")
    - Hyphens within words (e.g., "ice-cream" stays as one word)
    - Apostrophes in contractions (e.g., "don't" stays as one word)

    Args:
        text: Raw story text

    Returns:
        List of words in order of appearance
    """
    # Replace smart quotes with standard quotes
    text = text.replace('"', '"').replace('"', '"')
    text = text.replace(''', "'").replace(''', "'")

    # Remove punctuation except hyphens and apostrophes within words
    # Keep apostrophes for contractions like "don't", "it's"
    # Pattern: keep letters, numbers, spaces, hyphens, apostrophes
    cleaned = re.sub(r'[^\w\s\'-]', ' ', text)

    # Split on whitespace
    words = cleaned.split()

    # Clean up each word
    result = []
    for word in words:
        # Strip leading/trailing hyphens and apostrophes
        word = word.strip("-'")
        if word:
            result.append(word)

    return result


def extract_sentences(text: str) -> List[str]:
    """
    Extract sentences from text.

    Args:
        text: Raw story text

    Returns:
        List of sentences
    """
    # Split on sentence-ending punctuation
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    return [s.strip() for s in sentences if s.strip()]


def validate_word(word: str, level: int) -> Dict:
    """
    Validate a single word against the word bank.

    Args:
        word: Word to validate
        level: Reading level 1-6

    Returns:
        Validation result dict
    """
    # Skip if word is just punctuation or numbers
    if not re.search(r'[a-zA-Z]', word):
        return {"word": word, "valid": True, "skip": True, "reason": "non-alphabetic"}

    # Handle possessives (e.g., "Sam's" -> check "Sam")
    base_word = word
    is_possessive = False
    if word.endswith("'s") or word.endswith("'s"):
        base_word = word[:-2]
        is_possessive = True

    # Get word status
    status = get_word_status(base_word, level)

    return {
        "word": word,
        "base_word": base_word,
        "valid": status["permitted"],
        "is_decodable": status["is_decodable"],
        "is_tricky": status["is_tricky"],
        "is_possessive": is_possessive,
        "level": level
    }


def validate_story_text(text: str, level: int) -> ValidationResult:
    """
    Validate story text against the word bank for a given level.

    THIS IS THE QUALITY GATE. Every word must pass.

    Args:
        text: Full story text (all pages)
        level: Reading level 1-6

    Returns:
        ValidationResult with pass/fail status and details
    """
    if level < 1 or level > 6:
        raise ValueError(f"Level must be 1-6, got {level}")

    words = extract_words(text)
    sentences = extract_sentences(text)

    # Track results
    failed_words: List[Dict] = []
    failed_sentences: List[Dict] = []
    decodable_used: Set[str] = set()
    tricky_used: Set[str] = set()
    seen_words: Set[str] = set()
    unique_words: Set[str] = set()

    # Validate each word
    for word in words:
        word_lower = word.lower()
        unique_words.add(word_lower)

        result = validate_word(word, level)

        if result.get("skip"):
            continue

        if result["valid"]:
            base = result.get("base_word", word).lower()
            if result["is_decodable"]:
                decodable_used.add(base)
            if result["is_tricky"]:
                tricky_used.add(base)
        else:
            # Only add each failed word once
            if word_lower not in seen_words:
                failed_words.append({
                    "word": word,
                    "word_normalised": word_lower,
                    "level": level
                })
                seen_words.add(word_lower)

    # Find sentences containing failed words
    if failed_words:
        failed_word_set = {fw["word_normalised"] for fw in failed_words}

        for i, sentence in enumerate(sentences):
            sentence_words = extract_words(sentence)
            sentence_word_set = {w.lower() for w in sentence_words}

            violations = failed_word_set & sentence_word_set
            if violations:
                failed_sentences.append({
                    "sentence_number": i + 1,
                    "sentence": sentence,
                    "failed_words": list(violations)
                })

    return ValidationResult(
        valid=len(failed_words) == 0,
        level=level,
        total_words=len(words),
        unique_words=len(unique_words),
        failed_words=failed_words,
        failed_sentences=failed_sentences,
        decodable_words_used=sorted(list(decodable_used)),
        tricky_words_used=sorted(list(tricky_used))
    )


def validate_story_pages(pages: List[str], level: int) -> ValidationResult:
    """
    Validate multiple story pages against the word bank.

    Args:
        pages: List of page texts (typically 8 story pages)
        level: Reading level 1-6

    Returns:
        ValidationResult for the combined text
    """
    combined_text = " ".join(pages)
    return validate_story_text(combined_text, level)


def get_replacement_suggestions(
    failed_word: str,
    level: int,
    context_sentence: str
) -> List[str]:
    """
    Suggest replacement words for a failed word.

    This is a basic implementation. For better suggestions,
    use Claude to rewrite the sentence.

    Args:
        failed_word: The word that failed validation
        level: Reading level 1-6
        context_sentence: The sentence containing the word

    Returns:
        List of possible replacement words (may be empty)
    """
    permitted = get_permitted_words(level)

    # Basic suggestions based on word length and starting letter
    word_lower = failed_word.lower()
    first_letter = word_lower[0] if word_lower else ""

    suggestions = []

    for permitted_word in permitted:
        # Same starting letter and similar length
        if (permitted_word.startswith(first_letter) and
                abs(len(permitted_word) - len(word_lower)) <= 2):
            suggestions.append(permitted_word)

        if len(suggestions) >= 5:
            break

    return suggestions


def format_validation_report(result: ValidationResult) -> str:
    """
    Format validation result as a human-readable report.

    Args:
        result: ValidationResult from validate_story_text

    Returns:
        Formatted report string
    """
    lines = [
        "=" * 60,
        "WORD BANK VALIDATION REPORT",
        "=" * 60,
        f"Level: {result.level}",
        f"Status: {'PASS' if result.valid else 'FAIL'}",
        f"Total words: {result.total_words}",
        f"Unique words: {result.unique_words}",
        "",
    ]

    if result.valid:
        lines.append("All words are permitted at this level.")
    else:
        lines.append(f"FAILED WORDS ({len(result.failed_words)}):")
        for fw in result.failed_words:
            lines.append(f"  - {fw['word']}")

        lines.append("")
        lines.append("SENTENCES WITH VIOLATIONS:")
        for fs in result.failed_sentences:
            lines.append(f"  [{fs['sentence_number']}] {fs['sentence']}")
            lines.append(f"      Failed: {', '.join(fs['failed_words'])}")

    lines.append("")
    lines.append(f"Decodable words used: {len(result.decodable_words_used)}")
    lines.append(f"Tricky words used: {len(result.tricky_words_used)}")
    lines.append("=" * 60)

    return "\n".join(lines)


# Convenience function for quick validation
def quick_validate(text: str, level: int) -> bool:
    """
    Quick check if text passes validation.

    Args:
        text: Text to validate
        level: Reading level 1-6

    Returns:
        True if all words pass, False otherwise
    """
    result = validate_story_text(text, level)
    return result.valid


if __name__ == "__main__":
    # Test validation
    test_text = """
    Sam sat on a mat. The dog sat on Sam.
    Sam and the dog ran to the park.
    """

    print("Testing Level 1 validation:")
    result = validate_story_text(test_text, level=1)
    print(format_validation_report(result))

    print("\nTesting with invalid word:")
    test_text_invalid = "Sam saw a beautiful butterfly in the garden."
    result = validate_story_text(test_text_invalid, level=1)
    print(format_validation_report(result))
