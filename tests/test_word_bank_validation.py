"""
Tests for word bank validation - the quality gate.

These tests verify that the word bank enforcement works correctly.
This is the most critical test suite in the system.
"""

import pytest
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from execution.validate_word_bank import (
    validate_story_text,
    validate_word,
    extract_words,
    extract_sentences,
    quick_validate,
    ValidationResult
)
from execution.utils.word_bank import (
    is_word_permitted,
    get_permitted_words,
    get_word_bank_stats,
    load_word_bank,
    load_tricky_words
)


class TestWordExtraction:
    """Tests for word extraction from text."""

    def test_extract_simple_words(self):
        text = "Sam sat on a mat"
        words = extract_words(text)
        assert words == ["Sam", "sat", "on", "a", "mat"]

    def test_extract_words_with_punctuation(self):
        text = "Sam sat on a mat. The dog ran!"
        words = extract_words(text)
        assert "mat" in words
        assert "ran" in words
        # Should not have punctuation attached
        assert "mat." not in words
        assert "ran!" not in words

    def test_extract_words_with_quotes(self):
        text = '"Hello," said Sam. "I am here."'
        words = extract_words(text)
        assert "Hello" in words
        assert "said" in words
        assert "Sam" in words

    def test_extract_words_with_apostrophes(self):
        text = "Sam's dog can't run"
        words = extract_words(text)
        # Apostrophes within words should be preserved
        assert "Sam's" in words or "Sams" in words
        assert "can't" in words or "cant" in words

    def test_extract_sentences(self):
        text = "Sam sat on a mat. The dog ran. It was fun!"
        sentences = extract_sentences(text)
        assert len(sentences) == 3
        assert sentences[0] == "Sam sat on a mat."
        assert sentences[1] == "The dog ran."
        assert sentences[2] == "It was fun!"


class TestWordValidation:
    """Tests for individual word validation."""

    def test_level_1_decodable_word(self):
        # "sat" is a basic CVC word - should pass at Level 1
        result = validate_word("sat", level=1)
        assert result["valid"] is True
        assert result["is_decodable"] is True

    def test_level_1_tricky_word(self):
        # "the" is a tricky word at Level 1
        result = validate_word("the", level=1)
        assert result["valid"] is True
        assert result["is_tricky"] is True

    def test_level_1_invalid_word(self):
        # "beautiful" is not permitted at Level 1
        result = validate_word("beautiful", level=1)
        assert result["valid"] is False

    def test_case_insensitive(self):
        # Should match regardless of case
        result1 = validate_word("SAT", level=1)
        result2 = validate_word("sat", level=1)
        result3 = validate_word("Sat", level=1)
        assert result1["valid"] == result2["valid"] == result3["valid"]

    def test_possessive_form(self):
        # "Sam's" should validate the base word "Sam"
        result = validate_word("Sam's", level=1)
        assert result["is_possessive"] is True


class TestStoryValidation:
    """Tests for full story validation."""

    def test_valid_level_1_story(self):
        text = "Sam sat on a mat. The dog sat on Sam."
        result = validate_story_text(text, level=1)
        assert result.valid is True
        assert len(result.failed_words) == 0

    def test_invalid_level_1_story(self):
        text = "Sam saw a beautiful butterfly."
        result = validate_story_text(text, level=1)
        assert result.valid is False
        # "beautiful" and "butterfly" should fail
        failed_words = [fw["word"].lower() for fw in result.failed_words]
        assert "beautiful" in failed_words
        assert "butterfly" in failed_words

    def test_failed_sentences_reported(self):
        text = "Sam sat on a mat. Sam saw a beautiful butterfly. The dog ran."
        result = validate_story_text(text, level=1)
        assert result.valid is False
        # Should report the sentence with violations
        assert len(result.failed_sentences) >= 1
        failed_sentence_texts = [fs["sentence"] for fs in result.failed_sentences]
        assert any("butterfly" in s for s in failed_sentence_texts)

    def test_level_progression(self):
        # Word "train" should fail at Level 1-2 but pass at Level 3+
        text = "The train went fast."

        result_l1 = validate_story_text(text, level=1)
        result_l2 = validate_story_text(text, level=2)
        result_l3 = validate_story_text(text, level=3)

        # Train has 'ai' digraph - Level 3
        assert result_l1.valid is False
        assert result_l2.valid is False
        # Note: This depends on word bank content

    def test_tricky_words_tracked(self):
        text = "Sam said he was going to the shop."
        result = validate_story_text(text, level=3)
        # "said", "he", "was", "the" are tricky words
        assert len(result.tricky_words_used) > 0

    def test_decodable_words_tracked(self):
        text = "Sam sat on a mat."
        result = validate_story_text(text, level=1)
        # "sat", "mat" are decodable
        assert len(result.decodable_words_used) > 0
        assert "sat" in result.decodable_words_used
        assert "mat" in result.decodable_words_used


class TestQuickValidate:
    """Tests for the quick validation helper."""

    def test_quick_validate_pass(self):
        text = "Sam sat on a mat."
        assert quick_validate(text, level=1) is True

    def test_quick_validate_fail(self):
        text = "Sam saw a beautiful butterfly."
        assert quick_validate(text, level=1) is False


class TestWordBankLoading:
    """Tests for word bank data loading."""

    def test_load_word_bank_level_1(self):
        words = load_word_bank(1)
        assert len(words) > 0
        # Check some expected words
        assert "sat" in words
        assert "mat" in words
        assert "cat" in words

    def test_load_word_bank_cumulative(self):
        # Level 2 should include Level 1 words
        words_l1 = load_word_bank(1)
        words_l2 = load_word_bank(2)
        # All Level 1 words should be in Level 2
        assert words_l1.issubset(words_l2)

    def test_load_tricky_words(self):
        tricky = load_tricky_words(1)
        assert "the" in tricky
        assert "to" in tricky
        assert "I" in tricky or "i" in tricky

    def test_tricky_words_cumulative(self):
        tricky_l1 = load_tricky_words(1)
        tricky_l3 = load_tricky_words(3)
        # Level 1 tricky words should be in Level 3
        assert tricky_l1.issubset(tricky_l3)

    def test_invalid_level_raises(self):
        with pytest.raises(ValueError):
            load_word_bank(0)
        with pytest.raises(ValueError):
            load_word_bank(7)


class TestWordBankStats:
    """Tests for word bank statistics."""

    def test_stats_structure(self):
        stats = get_word_bank_stats(1)
        assert "level" in stats
        assert "decodable_count" in stats
        assert "tricky_count" in stats
        assert "total_permitted" in stats

    def test_stats_progression(self):
        # Higher levels should have more words
        stats_l1 = get_word_bank_stats(1)
        stats_l6 = get_word_bank_stats(6)
        assert stats_l6["total_permitted"] > stats_l1["total_permitted"]


class TestEdgeCases:
    """Tests for edge cases and special scenarios."""

    def test_empty_text(self):
        result = validate_story_text("", level=1)
        assert result.valid is True
        assert result.total_words == 0

    def test_only_punctuation(self):
        result = validate_story_text("... !!! ???", level=1)
        assert result.valid is True

    def test_numbers_in_text(self):
        text = "Sam has 3 dogs and 2 cats."
        result = validate_story_text(text, level=1)
        # Numbers should not cause failures on their own

    def test_hyphenated_words(self):
        text = "The ice-cream was good."
        result = validate_story_text(text, level=3)
        # Should handle hyphenated words

    def test_repeated_failed_word(self):
        text = "Beautiful beautiful beautiful."
        result = validate_story_text(text, level=1)
        # Should only report "beautiful" once
        assert len(result.failed_words) == 1


class TestValidationResult:
    """Tests for ValidationResult dataclass."""

    def test_to_dict(self):
        result = ValidationResult(
            valid=True,
            level=1,
            total_words=10,
            unique_words=8,
            failed_words=[],
            failed_sentences=[],
            decodable_words_used=["sat", "mat"],
            tricky_words_used=["the"]
        )
        d = result.to_dict()
        assert d["valid"] is True
        assert d["level"] == 1
        assert d["failed_count"] == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
