"""
Story text generation for MyPhonicsBooks.

Uses Claude API to generate phonics-compliant story text.
Every word must be decodable at the target level or be a tricky word.

This is the core creative engine, but heavily constrained by the word bank.
"""

import json
from typing import List, Dict, Optional
from dataclasses import dataclass
from pathlib import Path

from .utils.api_clients import get_anthropic_client, get_max_validation_retries
from .utils.level_config import get_level_config, get_tricky_words
from .utils.word_bank import get_permitted_words, load_word_bank
from .utils.story_templates import load_template, StoryTemplate
from .validate_word_bank import validate_story_text, ValidationResult


@dataclass
class StoryGenerationResult:
    """Result of story generation."""
    success: bool
    pages: List[str]  # 8 story pages
    validation_result: Optional[ValidationResult] = None
    retries_used: int = 0
    error: Optional[str] = None


def build_system_prompt(level: int) -> str:
    """
    Build the system prompt for Claude with strict phonics constraints.

    Args:
        level: Reading level 1-6

    Returns:
        System prompt string
    """
    config = get_level_config(level)
    permitted_words = get_permitted_words(level)
    tricky_words = get_tricky_words(level)

    # Get a sample of permitted words (too many to list all)
    sample_decodable = sorted(list(load_word_bank(level)))[:100]

    return f"""You are a phonics reading book author for MyPhonicsBooks. You write stories for children learning to read.

READING LEVEL: {level} - "{config.name}"
This maps to: {config.maps_to}

ABSOLUTE RULE - THE WORD BANK IS THE LAW:
Every word you write must EITHER:
1. Be decodable using ONLY the graphemes taught at Level {level} and below, OR
2. Be one of the listed tricky words

There are NO exceptions. If you cannot write a sentence within these constraints, rewrite it until you can.

PERMITTED GRAPHEMES AT THIS LEVEL:
{', '.join(config.graphemes)}

TRICKY WORDS (words children memorise by sight):
{', '.join(tricky_words)}

SAMPLE OF PERMITTED DECODABLE WORDS:
{', '.join(sample_decodable)}

Note: There are more permitted words than listed above. If unsure, use simpler words that clearly follow CVC or the taught phonics patterns.

SENTENCE COMPLEXITY RULES FOR LEVEL {level}:
- Words per sentence: {config.words_per_sentence}
- Sentences per page: {config.sentences_per_page}

WRITING GUIDELINES:
1. Use simple, clear sentences
2. Repeat key words to reinforce learning
3. Use natural dialogue with speech marks
4. Keep the emotional arc of the story
5. Use British English spelling (colour, favourite, etc.)
6. Do not use contractions unless the contraction is a tricky word
7. Do not use complex punctuation (semicolons, colons for lists)
8. Ensure every page can stand alone but connects to the narrative

CRITICAL: Before outputting any text, mentally check EVERY word against the permitted word list. If a word is not clearly decodable or a tricky word, DO NOT USE IT."""


def build_user_prompt(
    template: StoryTemplate,
    personalisation: Dict[str, str],
    level: int
) -> str:
    """
    Build the user prompt with template and personalisation.

    Args:
        template: Story template to use
        personalisation: Personalisation variables
        level: Reading level

    Returns:
        User prompt string
    """
    config = get_level_config(level)

    # Build scene outlines with placeholders filled
    scene_outlines = []
    for scene in template.scenes:
        outline = scene.outline
        for key, value in personalisation.items():
            outline = outline.replace(f"[{key}]", value)
        scene_outlines.append(f"Page {scene.page}: {outline}")

    scenes_text = "\n".join(scene_outlines)

    return f"""Generate the story text for a Level {level} phonics reading book.

STORY TEMPLATE: {template.template_name}
CORE ARC: {template.core_arc}
EMOTIONAL BEAT: {template.emotional_beat}

PERSONALISATION:
{json.dumps(personalisation, indent=2)}

SCENE OUTLINES (use these as your guide, but write full sentences):
{scenes_text}

Generate 8 pages of story text (Pages 3-10).
Each page should have {config.sentences_per_page} sentences.
Each sentence should have {config.words_per_sentence} words.

OUTPUT FORMAT:
Return a JSON array with exactly 8 strings, one for each page.
Example:
[
  "Sam sat on a mat. The sun was hot.",
  "Sam got up. He ran to the shop.",
  ...
]

REMEMBER: Every single word must be decodable at Level {level} or be a tricky word. Check each word before including it."""


def generate_story(
    template_id: str,
    personalisation: Dict[str, str],
    level: int,
    max_retries: Optional[int] = None
) -> StoryGenerationResult:
    """
    Generate story text for a personalised book.

    Args:
        template_id: Story template to use
        personalisation: Personalisation variables (NAME, FRIEND, etc.)
        level: Reading level 1-6
        max_retries: Maximum validation retries (default from config)

    Returns:
        StoryGenerationResult with pages or error
    """
    if max_retries is None:
        max_retries = get_max_validation_retries()

    # Load template
    template = load_template(template_id)
    if not template:
        return StoryGenerationResult(
            success=False,
            pages=[],
            error=f"Template not found: {template_id}"
        )

    # Get API client
    try:
        client = get_anthropic_client()
    except Exception as e:
        return StoryGenerationResult(
            success=False,
            pages=[],
            error=f"Failed to initialize API client: {str(e)}"
        )

    system_prompt = build_system_prompt(level)
    user_prompt = build_user_prompt(template, personalisation, level)

    retries = 0
    last_validation: Optional[ValidationResult] = None

    while retries <= max_retries:
        # If retrying, add failed words to the prompt
        current_user_prompt = user_prompt
        if last_validation and not last_validation.valid:
            failed_words = [fw["word"] for fw in last_validation.failed_words]
            current_user_prompt += f"""

PREVIOUS ATTEMPT FAILED VALIDATION.
These words are NOT permitted at Level {level}: {', '.join(failed_words)}
Please rewrite the story WITHOUT using these words. Use only permitted words."""

        try:
            # Call Claude API
            message = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2000,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": current_user_prompt}
                ]
            )

            # Extract response text
            response_text = message.content[0].text

            # Parse JSON response
            # Try to find JSON array in the response
            try:
                # First try direct parse
                pages = json.loads(response_text)
            except json.JSONDecodeError:
                # Try to extract JSON from markdown code block
                import re
                json_match = re.search(r'\[[\s\S]*\]', response_text)
                if json_match:
                    pages = json.loads(json_match.group())
                else:
                    raise ValueError("Could not find JSON array in response")

            if not isinstance(pages, list) or len(pages) != 8:
                raise ValueError(f"Expected 8 pages, got {len(pages) if isinstance(pages, list) else 'non-list'}")

            # Validate the generated text
            combined_text = " ".join(pages)
            validation = validate_story_text(combined_text, level)

            if validation.valid:
                return StoryGenerationResult(
                    success=True,
                    pages=pages,
                    validation_result=validation,
                    retries_used=retries
                )
            else:
                last_validation = validation
                retries += 1

        except Exception as e:
            return StoryGenerationResult(
                success=False,
                pages=[],
                error=f"API error: {str(e)}",
                retries_used=retries
            )

    # Max retries exceeded
    return StoryGenerationResult(
        success=False,
        pages=[],
        validation_result=last_validation,
        retries_used=retries,
        error=f"Failed validation after {max_retries} retries. Failed words: {[fw['word'] for fw in last_validation.failed_words] if last_validation else []}"
    )


def generate_story_sync(
    template_id: str,
    personalisation: Dict[str, str],
    level: int
) -> StoryGenerationResult:
    """
    Synchronous wrapper for story generation.
    Use this for simple scripts and testing.
    """
    return generate_story(template_id, personalisation, level)


# Convenience function for testing
def test_generation():
    """Test story generation with sample inputs."""
    personalisation = {
        "NAME": "Sam",
        "FRIEND": "Jess",
        "LOCATION": "the park",
        "WEATHER": "sunny",
        "LOST_ITEM": "toy dinosaur",
        "OWNER": "Tom",
        "PLACE_1": "the bench",
        "PLACE_2": "the pond",
        "PERSON_1": "Mum"
    }

    print("Testing story generation...")
    result = generate_story("lost_thing", personalisation, level=1)

    if result.success:
        print("SUCCESS!")
        print(f"Retries used: {result.retries_used}")
        for i, page in enumerate(result.pages, 1):
            print(f"\nPage {i + 2}:")
            print(page)
    else:
        print(f"FAILED: {result.error}")
        if result.validation_result:
            print(f"Failed words: {result.validation_result.failed_words}")


if __name__ == "__main__":
    test_generation()
