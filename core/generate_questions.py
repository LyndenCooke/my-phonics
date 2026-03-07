"""
Comprehension question generation for MyPhonicsBooks.

Generates 4 questions for each book following the fixed pattern:
1. Retrieval - answer is explicitly stated in text
2. Inference - requires reading between the lines
3. Vocabulary - targets a key word from the story
4. Prediction/Opinion - open-ended

Questions must use permitted words at the target level.
"""

import json
from typing import List, Dict, Optional
from dataclasses import dataclass

from .utils.api_clients import get_anthropic_client
from .utils.level_config import get_level_config, get_tricky_words
from .utils.word_bank import get_permitted_words
from .utils.story_templates import load_template
from .validate_word_bank import validate_story_text, extract_words


@dataclass
class Question:
    """A comprehension question."""
    question_type: str  # retrieval, inference, vocabulary, prediction
    question_text: str
    answer_hint: Optional[str] = None  # For teacher/parent reference


@dataclass
class QuestionsResult:
    """Result of question generation."""
    success: bool
    questions: List[Question]
    error: Optional[str] = None


def build_questions_prompt(
    story_pages: List[str],
    personalisation: Dict[str, str],
    level: int,
    template_id: str
) -> str:
    """
    Build prompt for question generation.

    Args:
        story_pages: The 8 generated story pages
        personalisation: Personalisation variables
        level: Reading level 1-6
        template_id: Story template used

    Returns:
        Prompt string for Claude
    """
    config = get_level_config(level)
    tricky_words = get_tricky_words(level)

    # Combine story text
    story_text = "\n\n".join([f"Page {i+3}: {page}" for i, page in enumerate(story_pages)])

    # Extract words used in story for vocabulary question
    all_words = []
    for page in story_pages:
        all_words.extend(extract_words(page))

    # Find interesting words for vocabulary question
    unique_words = list(set(word.lower() for word in all_words if len(word) > 3))

    return f"""Generate 4 comprehension questions for a Level {level} reading book.

THE STORY:
{story_text}

CHILD'S NAME: {personalisation.get('NAME', 'the child')}

QUESTION TYPES (generate exactly one of each):

1. RETRIEVAL QUESTION
   - The answer must be explicitly stated in the text
   - Start with "What" or "Where" or "Who"
   - Example: "What did [NAME] find at the park?"

2. INFERENCE QUESTION
   - Requires reading between the lines
   - Start with "How do you think..." or "Why do you think..."
   - Example: "How do you think [NAME] felt when...?"

3. VOCABULARY QUESTION
   - Focus on a word from the story
   - Start with "What does the word '...' mean?"
   - Choose from these words used in the story: {', '.join(unique_words[:20])}

4. PREDICTION/OPINION QUESTION
   - Open-ended, no single right answer
   - Start with "What do you think..." or "What would you do..."
   - Example: "What do you think [NAME] will do next?"

RULES:
- Use simple words appropriate for Level {level}
- Questions should be clear and easy to understand
- Use the child's name ({personalisation.get('NAME', 'the child')}) where appropriate
- Use British English spelling

OUTPUT FORMAT:
Return a JSON array with 4 question objects:
[
  {{"type": "retrieval", "question": "...", "answer_hint": "..."}},
  {{"type": "inference", "question": "...", "answer_hint": "..."}},
  {{"type": "vocabulary", "question": "...", "answer_hint": "..."}},
  {{"type": "prediction", "question": "...", "answer_hint": "..."}}
]

The answer_hint is for parent/teacher reference only and won't be shown to the child."""


def generate_questions(
    story_pages: List[str],
    personalisation: Dict[str, str],
    level: int,
    template_id: str
) -> QuestionsResult:
    """
    Generate comprehension questions for a story.

    Args:
        story_pages: The 8 generated story pages
        personalisation: Personalisation variables
        level: Reading level 1-6
        template_id: Story template used

    Returns:
        QuestionsResult with questions or error
    """
    try:
        client = get_anthropic_client()
    except Exception as e:
        return QuestionsResult(
            success=False,
            questions=[],
            error=f"Failed to initialize API client: {str(e)}"
        )

    prompt = build_questions_prompt(story_pages, personalisation, level, template_id)

    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        response_text = message.content[0].text

        # Parse JSON response
        try:
            import re
            json_match = re.search(r'\[[\s\S]*\]', response_text)
            if json_match:
                questions_data = json.loads(json_match.group())
            else:
                questions_data = json.loads(response_text)
        except json.JSONDecodeError as e:
            return QuestionsResult(
                success=False,
                questions=[],
                error=f"Failed to parse JSON response: {str(e)}"
            )

        # Convert to Question objects
        questions = []
        for q in questions_data:
            questions.append(Question(
                question_type=q.get("type", "unknown"),
                question_text=q.get("question", ""),
                answer_hint=q.get("answer_hint")
            ))

        if len(questions) != 4:
            return QuestionsResult(
                success=False,
                questions=questions,
                error=f"Expected 4 questions, got {len(questions)}"
            )

        return QuestionsResult(
            success=True,
            questions=questions
        )

    except Exception as e:
        return QuestionsResult(
            success=False,
            questions=[],
            error=f"API error: {str(e)}"
        )


def get_template_questions(
    template_id: str,
    personalisation: Dict[str, str]
) -> List[Question]:
    """
    Get default questions from template with personalisation filled in.

    Fallback if API-generated questions fail.

    Args:
        template_id: Story template ID
        personalisation: Personalisation variables

    Returns:
        List of Question objects
    """
    template = load_template(template_id)
    if not template:
        return []

    questions = []
    for q_type, q_text in template.comprehension_questions.items():
        # Fill in personalisation placeholders
        filled_text = q_text
        for key, value in personalisation.items():
            filled_text = filled_text.replace(f"[{key}]", value)

        questions.append(Question(
            question_type=q_type,
            question_text=filled_text
        ))

    return questions


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

    personalisation = {"NAME": "Sam", "FRIEND": "Jess", "OWNER": "Tom", "LOST_ITEM": "toy dinosaur"}

    result = generate_questions(test_pages, personalisation, level=1, template_id="lost_thing")

    if result.success:
        print("Questions generated successfully:")
        for q in result.questions:
            print(f"\n{q.question_type.upper()}:")
            print(f"  {q.question_text}")
            if q.answer_hint:
                print(f"  (Hint: {q.answer_hint})")
    else:
        print(f"Failed: {result.error}")
