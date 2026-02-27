"""
Execution layer for MyPhonicsBooks.

This layer contains deterministic Python scripts that:
- Generate story text (via Claude API)
- Validate phonics word bank compliance
- Generate illustrations (via DALL-E/Midjourney)
- Assemble PDFs
- Process orders and delivery
"""

from .validate_word_bank import (
    validate_story_text,
    validate_story_pages,
    validate_word,
    extract_words,
    extract_sentences,
    quick_validate,
    format_validation_report,
    ValidationResult
)

__all__ = [
    "validate_story_text",
    "validate_story_pages",
    "validate_word",
    "extract_words",
    "extract_sentences",
    "quick_validate",
    "format_validation_report",
    "ValidationResult"
]
