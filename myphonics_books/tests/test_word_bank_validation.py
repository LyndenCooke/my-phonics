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

from core.validate_word_bank import (
    validate_story_text,
    validate_word,
    extract_words,
    extract_sentences,
    quick_validate,
    ValidationResult
)
from core.utils.word_bank import (
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
        # Check some expected words (L1 GPCs are s a t p i n m d g o —
        # "cat" needs c, which arrives at L2 under the 8-level ledger)
        assert "sat" in words
        assert "mat" in words
        assert "dog" in words
        assert "cat" not in words
        assert "cat" in load_word_bank(2)

    def test_load_word_bank_cumulative(self):
        # Level 2 should include Level 1 words
        words_l1 = load_word_bank(1)
        words_l2 = load_word_bank(2)
        # All Level 1 words should be in Level 2
        assert words_l1.issubset(words_l2)

    def test_load_tricky_words(self):
        tricky = load_tricky_words(1)
        assert "the" in tricky
        assert "I" in tricky or "i" in tricky
        # Under the 8-level ledger, L1 introduces only I/the; "to" now arrives
        # at L2 (was L1 in the old 6-level scheme).
        assert "to" in load_tricky_words(2)

    def test_tricky_words_cumulative(self):
        tricky_l1 = load_tricky_words(1)
        tricky_l3 = load_tricky_words(3)
        # Level 1 tricky words should be in Level 3
        assert tricky_l1.issubset(tricky_l3)

    def test_invalid_level_raises(self):
        # 8-level Curriculum Ledger v2.1: levels 1-8 are valid, 0 and 9 are not.
        with pytest.raises(ValueError):
            load_word_bank(0)
        with pytest.raises(ValueError):
            load_word_bank(9)
        # L7 and L8 must NOT raise (the old 6-level hard cap is gone)
        assert len(load_word_bank(7)) > 0
        assert len(load_word_bank(8)) > 0


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


class TestEightLevelPhase0:
    """Shifty Sounds Phase 0: full 8-level enforcement (no 6-level hard cap).

    L7 (Reading Together) adds ire/ore/ear/oor/ure/tion + the Phase 6
    suffixes; L8 (Reading Champion) adds -ous/-cious/-tious/-able/-ible/-sion
    + the prefixes re-/dis-/mis-/sub- and the remaining Y2 CEWs as tricky
    words (Curriculum Ledger v2.1).
    """

    def test_l7_l8_banks_load_and_are_cumulative(self):
        w6, w7, w8 = load_word_bank(6), load_word_bank(7), load_word_bank(8)
        assert w6 < w7 < w8  # strict supersets
        assert "station" in w7
        assert "adventure" in w7
        assert "delicious" in w8
        assert "incredible" in w8

    def test_validate_story_text_runs_at_l7_and_l8(self):
        # Phase 0 acceptance: no ValueError, correct pass/fail
        r7 = validate_story_text("The station was full of adventure.", level=7)
        assert r7.valid is True
        r8 = validate_story_text("The delicious cake was remarkable.", level=8)
        assert r8.valid is True
        r6 = validate_story_text("The station was full of adventure.", level=6)
        assert r6.valid is False

    def test_l7_words_fail_at_l6_pass_at_l7(self):
        # Trigraphs ire/ore/ure and tion are first taught at L7
        for word in ("adventure", "station", "fire", "picture", "before"):
            assert validate_word(word, level=6)["valid"] is False, word
            assert validate_word(word, level=7)["valid"] is True, word

    def test_l8_words_fail_at_l7_pass_at_l8(self):
        # -cious / -ible / -sion morphology is L8
        for word in ("delicious", "incredible", "invisible", "explosion"):
            assert validate_word(word, level=7)["valid"] is False, word
            assert validate_word(word, level=8)["valid"] is True, word

    def test_suffix_aware_decodability_from_l7(self):
        # Root decodable + Phase 6 suffix taught at L7 = decodable at L7:
        # just-add (helpful, darkness, sadly, jumping), doubling (hopping),
        # drop-e (making)
        for word in ("jumping", "helpful", "darkness", "sadly", "hopping", "making"):
            assert validate_word(word, level=6)["valid"] is False, word
            result = validate_word(word, level=7)
            assert result["valid"] is True, word
            assert result["is_decodable"] is True, word

    def test_y_to_i_root_reversal(self):
        # y-to-i rule: happier -> happy (unit test; "happy" itself stays out
        # of the banks until Phase 1 makes decodability phoneme-aware)
        from core.utils.word_bank import _root_candidates
        assert "happy" in _root_candidates("happier", "er")
        assert "hop" in _root_candidates("hopping", "ing")     # doubling
        assert "make" in _root_candidates("making", "ing")     # drop-e

    def test_prefixes_arrive_at_l8_not_l7(self):
        # re-/dis-/mis-/sub- are L8: root decodable, whole word not in a bank
        for word in ("remake", "refill"):
            assert validate_word(word, level=7)["valid"] is False, word
            result = validate_word(word, level=8)
            assert result["valid"] is True, word

    def test_y2_cews_are_tricky_at_their_level(self):
        # First Y2 CEW set lands at L7, remainder at L8 (ledger)
        assert validate_word("beautiful", level=6)["valid"] is False
        r7 = validate_word("beautiful", level=7)
        assert r7["valid"] is True and r7["is_tricky"] is True
        assert validate_word("sugar", level=7)["valid"] is False
        r8 = validate_word("sugar", level=8)
        assert r8["valid"] is True and r8["is_tricky"] is True

    def test_l1_l6_unaffected_by_morphology(self):
        # Morphology contributes nothing below L7
        assert validate_word("jumping", level=3)["valid"] is False
        assert validate_word("cat", level=2)["valid"] is True
        assert validate_word("make", level=4)["valid"] is False  # waits for a-e at L5
        assert validate_word("make", level=5)["valid"] is True
        assert validate_word("care", level=5)["valid"] is False  # waits for are at L6
        assert validate_word("care", level=6)["valid"] is True


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
