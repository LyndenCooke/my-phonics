"""
Writing worksheet generation for MyPhonicsBooks.

Generates age-appropriate writing activities based on level:
- Levels 1-2: Letter formation practice (trace and copy graphemes)
- Levels 3-4: Word writing (write words from the story)
- Levels 5-6: Sentence writing (write sentences using vocabulary)
"""

import json
from typing import List, Dict, Optional
from dataclasses import dataclass

from .utils.level_config import get_level_config, get_worksheet_config, get_tricky_words
from .utils.word_bank import load_word_bank
from .validate_word_bank import extract_words


@dataclass
class WorksheetContent:
    """Content for the writing worksheet."""
    worksheet_type: str  # letter_formation, word_writing, sentence_writing
    instructions: str
    graphemes: List[str]  # For letter formation
    words: List[str]  # For word writing
    sentence_prompts: List[str]  # For sentence writing
    level: int


@dataclass
class WorksheetResult:
    """Result of worksheet generation."""
    success: bool
    content: Optional[WorksheetContent] = None
    error: Optional[str] = None


def get_target_graphemes(level: int, story_text: str) -> List[str]:
    """
    Get graphemes to practice based on level and story content.

    For levels 1-2, focus on graphemes used in the story.

    Args:
        level: Reading level
        story_text: Combined story text

    Returns:
        List of 4-6 graphemes to practice
    """
    config = get_level_config(level)

    # Get graphemes from level config
    if level == 1:
        # Level 1 graphemes
        all_graphemes = ["s", "a", "t", "p", "i", "n", "m", "d", "g", "o", "c", "k", "e", "u", "r", "h", "b", "f", "l"]
    elif level == 2:
        # Level 2 new graphemes
        all_graphemes = ["ch", "sh", "th", "ng", "nk", "qu", "j", "v", "w", "x", "y", "z"]
    else:
        all_graphemes = config.graphemes[:12]

    # Try to find graphemes that appear in the story
    story_lower = story_text.lower()
    used_graphemes = [g for g in all_graphemes if g in story_lower]

    # Return 4-6 graphemes, prioritising those in the story
    result = used_graphemes[:4]

    # Fill with other graphemes if needed
    for g in all_graphemes:
        if len(result) >= 4:
            break
        if g not in result:
            result.append(g)

    return result[:6]


def get_target_words(level: int, story_pages: List[str]) -> List[str]:
    """
    Get words to practice from the story.

    For levels 3-4, select interesting decodable words.

    Args:
        level: Reading level
        story_pages: Story page texts

    Returns:
        List of 4-6 words to write
    """
    # Extract all words from story
    all_words = []
    for page in story_pages:
        all_words.extend(extract_words(page))

    # Get unique words, lowercase
    unique_words = list(set(word.lower() for word in all_words))

    # Filter for words that are:
    # - 3-6 letters long (not too easy or hard)
    # - Not tricky words (we want decodable practice)
    tricky = set(w.lower() for w in get_tricky_words(level))
    decodable = load_word_bank(level)

    good_words = [
        w for w in unique_words
        if 3 <= len(w) <= 6
        and w in decodable
        and w not in tricky
    ]

    # Sort by length for progression (easier first)
    good_words.sort(key=len)

    # Return 4-6 words
    return good_words[:6] if len(good_words) >= 4 else unique_words[:6]


def get_sentence_prompts(
    level: int,
    story_pages: List[str],
    personalisation: Dict[str, str]
) -> List[str]:
    """
    Get sentence writing prompts for levels 5-6.

    Args:
        level: Reading level
        story_pages: Story page texts
        personalisation: Personalisation variables

    Returns:
        List of 2-3 sentence prompts
    """
    name = personalisation.get("NAME", "the child")

    prompts = [
        f"Write a sentence about what {name} did in the story.",
        "Write a sentence about your favourite part of the story.",
        f"Write a sentence about what you would do if you were {name}."
    ]

    # For level 6, add a more complex prompt
    if level == 6:
        prompts.append("Write a sentence using one of the new words you learned.")

    return prompts[:3]


def generate_worksheet(
    story_pages: List[str],
    personalisation: Dict[str, str],
    level: int
) -> WorksheetResult:
    """
    Generate writing worksheet content for a book.

    Args:
        story_pages: The 8 story pages
        personalisation: Personalisation variables
        level: Reading level 1-6

    Returns:
        WorksheetResult with content
    """
    if level < 1 or level > 6:
        return WorksheetResult(
            success=False,
            error=f"Invalid level: {level}"
        )

    try:
        worksheet_config = get_worksheet_config(level)
        story_text = " ".join(story_pages)

        worksheet_type = worksheet_config["type"]
        name = personalisation.get("NAME", "the child")

        if worksheet_type == "letter_formation":
            # Levels 1-2
            graphemes = get_target_graphemes(level, story_text)
            instructions = f"Trace and copy these letters. Say the sound as you write."

            content = WorksheetContent(
                worksheet_type="letter_formation",
                instructions=instructions,
                graphemes=graphemes,
                words=[],
                sentence_prompts=[],
                level=level
            )

        elif worksheet_type == "word_writing":
            # Levels 3-4
            words = get_target_words(level, story_pages)
            instructions = f"Write these words from the story. Sound out each word as you write."

            content = WorksheetContent(
                worksheet_type="word_writing",
                instructions=instructions,
                graphemes=[],
                words=words,
                sentence_prompts=[],
                level=level
            )

        elif worksheet_type == "sentence_writing":
            # Levels 5-6
            prompts = get_sentence_prompts(level, story_pages, personalisation)
            instructions = f"Write sentences about the story. Use capital letters and full stops."

            content = WorksheetContent(
                worksheet_type="sentence_writing",
                instructions=instructions,
                graphemes=[],
                words=[],
                sentence_prompts=prompts,
                level=level
            )

        else:
            return WorksheetResult(
                success=False,
                error=f"Unknown worksheet type: {worksheet_type}"
            )

        return WorksheetResult(
            success=True,
            content=content
        )

    except Exception as e:
        return WorksheetResult(
            success=False,
            error=f"Failed to generate worksheet: {str(e)}"
        )


def get_word_lists(story_pages: List[str], level: int) -> Dict[str, List[str]]:
    """
    Get decodable and tricky word lists for the book.

    These appear on the back page of the book.

    Args:
        story_pages: The 8 story pages
        level: Reading level

    Returns:
        Dict with 'decodable' and 'tricky' word lists
    """
    # Extract all words from story
    all_words = []
    for page in story_pages:
        all_words.extend(extract_words(page))

    # Get unique words
    unique_words = list(set(word.lower() for word in all_words))

    # Categorise words
    tricky_set = set(w.lower() for w in get_tricky_words(level))
    decodable_set = load_word_bank(level)

    decodable_words = sorted([w for w in unique_words if w in decodable_set and w not in tricky_set])
    tricky_words = sorted([w for w in unique_words if w in tricky_set])

    return {
        "decodable": decodable_words,
        "tricky": tricky_words
    }


if __name__ == "__main__":
    # Test with sample story
    test_pages = [
        "Sam was at the park. It was a sunny day.",
        "Sam saw something on the ground. It was a toy dinosaur.",
        "Sam picked it up. 'This is not mine,' said Sam.",
        "Sam asked Jess. 'Is this yours?' 'No,' said Jess.",
        "Sam looked for the owner. Sam went to the bench.",
        "Sam went to the pond. Then Sam heard a sound.",
        "It was Tom. 'My dinosaur!' said Tom. 'Thank you, Sam!'",
        "Sam went home happy. It is good to help."
    ]

    personalisation = {"NAME": "Sam"}

    # Test different levels
    for level in [1, 3, 5]:
        print(f"\n=== Level {level} Worksheet ===")
        result = generate_worksheet(test_pages, personalisation, level)

        if result.success:
            content = result.content
            print(f"Type: {content.worksheet_type}")
            print(f"Instructions: {content.instructions}")
            if content.graphemes:
                print(f"Graphemes: {content.graphemes}")
            if content.words:
                print(f"Words: {content.words}")
            if content.sentence_prompts:
                print(f"Prompts: {content.sentence_prompts}")
        else:
            print(f"Failed: {result.error}")

    # Test word lists
    print("\n=== Word Lists ===")
    word_lists = get_word_lists(test_pages, level=1)
    print(f"Decodable: {word_lists['decodable']}")
    print(f"Tricky: {word_lists['tricky']}")
