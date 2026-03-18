"""
Book structure definition for MyPhonicsBooks.

Defines the 16-page book layout with pedagogical improvements:
- Enhanced parent guidance
- Embedded comprehension (prediction prompts)
- Phonics chart (not "Speed Sounds" - our terminology)
- Morphology activities for Level 3+

Print format: A4 landscape, 2-up (fold to A5 booklet)
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from enum import Enum


class PageType(Enum):
    """Types of pages in the book."""
    COVER = "cover"
    INSIDE_FRONT = "inside_front"  # Parent guidance
    PHONICS_CHART = "phonics_chart"  # Sound reference
    STORY = "story"
    PREDICTION = "prediction"  # Embedded comprehension
    QUESTIONS = "questions"
    WORKSHEET = "worksheet"
    INSIDE_BACK = "inside_back"  # Morphology/extension
    BACK_COVER = "back_cover"


@dataclass
class BookPage:
    """A single page in the book."""
    page_number: int
    page_type: PageType
    content: Dict
    illustration_required: bool = False
    illustration_brief: Optional[str] = None


@dataclass
class ParentGuidance:
    """Enhanced parent guidance with specific prompts."""
    before_reading: List[str]
    during_reading: List[str]
    error_correction: List[str]
    after_reading: List[str]

    @classmethod
    def for_level(cls, level: int) -> 'ParentGuidance':
        """Get level-appropriate parent guidance."""

        # Universal guidance
        before_reading = [
            "Look at the cover together. Ask: 'What do you think this story is about?'",
            "Point to the title and read it together.",
            "Look at the Phonics Chart on page 2 - practise saying each sound clearly."
        ]

        during_reading = [
            "Point to each word as your child reads.",
            "Wait 5 seconds before helping with a tricky word.",
            "If stuck, say: 'Look at the sounds. What sound does this part make?'",
            "Praise effort: 'Great sounding out!' not just 'Good reading.'"
        ]

        error_correction = [
            "If your child misreads a word, wait until the end of the sentence.",
            "Then say: 'Let's look at this word again. What sounds can you see?'",
            "Never say 'No, that's wrong.' Instead: 'Good try! Let's check that word.'"
        ]

        after_reading = [
            "Ask: 'What was your favourite part?'",
            "Discuss the questions on the Questions page together.",
            "Re-read the story to build fluency - it should sound smoother each time!"
        ]

        # Level-specific additions
        if level <= 2:
            during_reading.append("For Level 1-2: Help blend CVC words slowly: 'c-a-t... cat!'")
            after_reading.append("Practise the letter formation on the worksheet together.")
        elif level <= 4:
            during_reading.append("Encourage your child to read with expression for dialogue.")
            after_reading.append("Look for words with the focus sounds in other books.")
        else:
            during_reading.append("Let your child read more independently - only help when asked.")
            after_reading.append("Ask: 'Can you retell the story in your own words?'")

        return cls(
            before_reading=before_reading,
            during_reading=during_reading,
            error_correction=error_correction,
            after_reading=after_reading
        )


@dataclass
class PhonicsChart:
    """Phonics reference chart for the book."""
    level: int
    focus_graphemes: List[str]  # Graphemes featured in this story (circled)
    consonants: List[List[str]]  # Grid of consonant sounds
    vowels: List[List[str]]  # Grid of vowel sounds

    @classmethod
    def for_level(cls, level: int, focus_graphemes: List[str]) -> 'PhonicsChart':
        """Generate phonics chart for level."""

        # Consonants grid (similar to Letters and Sounds but our layout)
        consonants_by_level = {
            1: [
                ['s', 'a', 't', 'p'],
                ['i', 'n', 'm', 'd'],
                ['g', 'o', 'c', 'k'],
                ['ck', 'e', 'u', 'r'],
                ['h', 'b', 'f', 'ff'],
                ['l', 'll', 'ss', '']
            ],
            2: [
                ['s', 'a', 't', 'p', 'i', 'n'],
                ['m', 'd', 'g', 'o', 'c', 'k'],
                ['ck', 'e', 'u', 'r', 'h', 'b'],
                ['f', 'ff', 'l', 'll', 'ss', 'j'],
                ['v', 'w', 'x', 'y', 'z', 'zz'],
                ['qu', 'ch', 'sh', 'th', 'ng', 'nk']
            ],
            3: [
                ['s', 'a', 't', 'p', 'i', 'n'],
                ['m', 'd', 'g', 'o', 'c', 'k'],
                ['ck', 'e', 'u', 'r', 'h', 'b'],
                ['f', 'ff', 'l', 'll', 'ss', 'j'],
                ['v', 'w', 'x', 'y', 'z', 'zz'],
                ['qu', 'ch', 'sh', 'th', 'ng', 'nk'],
                ['ai', 'ee', 'igh', 'oa', 'oo', 'ar'],
                ['or', 'ur', 'ow', 'oi', 'ear', 'air']
            ],
            4: [
                ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd'],
                ['g', 'o', 'c', 'k', 'ck', 'e', 'u', 'r'],
                ['h', 'b', 'f', 'ff', 'l', 'll', 'ss', 'j'],
                ['v', 'w', 'x', 'y', 'z', 'zz', 'qu', ''],
                ['ch', 'sh', 'th', 'ng', 'nk', 'wh', 'ph', ''],
                ['ai', 'ee', 'igh', 'oa', 'oo', 'ar', 'or', 'ur'],
                ['ow', 'oi', 'ear', 'air', 'ure', 'er', 'aw', 'au'],
                ['a_e', 'e_e', 'i_e', 'o_e', 'u_e', 'ey', 'ie', 'ea']
            ],
            5: [
                ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd'],
                ['g', 'o', 'c', 'k', 'ck', 'e', 'u', 'r'],
                ['h', 'b', 'f', 'ff', 'l', 'll', 'ss', 'j'],
                ['v', 'w', 'x', 'y', 'z', 'zz', 'qu', 'wh'],
                ['ch', 'sh', 'th', 'ng', 'nk', 'ph', 'tch', ''],
                ['ai', 'ee', 'igh', 'oa', 'oo', 'ar', 'or', 'ur'],
                ['ow', 'oi', 'ear', 'air', 'ure', 'er', 'aw', 'au'],
                ['a_e', 'e_e', 'i_e', 'o_e', 'u_e', 'ey', 'ie', 'ea'],
                ['ir', 'ou', 'oy', 'ew', 'ue', 'wh', 'oe', '']
            ],
            6: [
                ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd'],
                ['g', 'o', 'c', 'k', 'ck', 'e', 'u', 'r'],
                ['h', 'b', 'f', 'ff', 'l', 'll', 'ss', 'j'],
                ['v', 'w', 'x', 'y', 'z', 'zz', 'qu', 'wh'],
                ['ch', 'sh', 'th', 'ng', 'nk', 'ph', 'tch', 'dge'],
                ['ai', 'ee', 'igh', 'oa', 'oo', 'ar', 'or', 'ur'],
                ['ow', 'oi', 'ear', 'air', 'ure', 'er', 'aw', 'au'],
                ['a_e', 'e_e', 'i_e', 'o_e', 'u_e', 'ey', 'ie', 'ea'],
                ['ir', 'ou', 'oy', 'ew', 'ue', 'oe', 'kn', 'wr'],
                ['mb', 'gn', 'le', 'al', 'il', 'tion', 'sion', '']
            ]
        }

        chart = consonants_by_level.get(level, consonants_by_level[1])

        return cls(
            level=level,
            focus_graphemes=focus_graphemes,
            consonants=chart,
            vowels=[]  # Simplified - vowels integrated in main grid
        )


@dataclass
class PredictionPrompt:
    """Mid-story prediction prompt for embedded comprehension."""
    page_before: int  # Show after this page number
    prompt_text: str
    hint_text: str

    @classmethod
    def generate(cls, story_midpoint: int, character_name: str) -> 'PredictionPrompt':
        """Generate a prediction prompt for the story midpoint."""
        prompts = [
            f"What do you think {character_name} will do next?",
            f"What do you think will happen to {character_name}?",
            f"How do you think the story will end?",
            f"Who do you think {character_name} will meet?"
        ]
        hints = [
            "Look at the picture for clues!",
            "Think about what has happened so far.",
            "What would you do if you were in the story?",
            "Let's find out on the next page!"
        ]

        import random
        return cls(
            page_before=story_midpoint,
            prompt_text=random.choice(prompts),
            hint_text=random.choice(hints)
        )


@dataclass
class MorphologyActivity:
    """Morphology extension activity for Level 3+."""
    root_words: List[str]
    suffixes: List[str]
    prefix_words: List[Dict[str, str]]  # {"prefix": "un", "word": "happy", "meaning": "not happy"}

    @classmethod
    def for_level(cls, level: int, story_words: List[str]) -> Optional['MorphologyActivity']:
        """Generate morphology activity if appropriate for level."""
        if level < 3:
            return None

        # Level 3-4: Focus on common suffixes
        if level <= 4:
            return cls(
                root_words=["help", "look", "play", "want"],
                suffixes=["-ing", "-ed", "-s"],
                prefix_words=[]
            )

        # Level 5-6: Add prefixes
        return cls(
            root_words=["help", "look", "play", "want", "happy", "kind"],
            suffixes=["-ing", "-ed", "-s", "-er", "-ly"],
            prefix_words=[
                {"prefix": "un-", "word": "happy", "meaning": "not happy"},
                {"prefix": "re-", "word": "read", "meaning": "read again"}
            ]
        )


@dataclass
class BookStructure:
    """
    Complete 16-page book structure.

    Page layout:
    1: Front cover
    2: Parent guidance (inside front)
    3: Phonics chart
    4-11: Story pages (8 pages)
    12: Prediction prompt (mid-story reflection)
    13: Comprehension questions
    14: Worksheet
    15: Morphology/Extension (inside back)
    16: Back cover

    Note: For printing as A4 landscape 2-up:
    - Sheet 1 front: Page 16, Page 1
    - Sheet 1 back: Page 2, Page 15
    - Sheet 2 front: Page 14, Page 3
    - Sheet 2 back: Page 4, Page 13
    ... etc (booklet imposition)
    """

    title: str
    child_name: str
    level: int
    colour_code: str

    # Content
    parent_guidance: ParentGuidance
    phonics_chart: PhonicsChart
    story_pages: List[BookPage]
    prediction_prompt: PredictionPrompt
    questions: List[Dict]
    worksheet_content: Dict
    morphology_activity: Optional[MorphologyActivity]

    # Metadata
    focus_graphemes: List[str] = field(default_factory=list)
    tricky_words_used: List[str] = field(default_factory=list)

    def get_all_pages(self) -> List[BookPage]:
        """Get all pages in order."""
        pages = []

        # Page 1: Cover
        pages.append(BookPage(
            page_number=1,
            page_type=PageType.COVER,
            content={
                "title": self.title,
                "child_name": self.child_name,
                "level": self.level,
                "colour_code": self.colour_code,
                "focus_graphemes": self.focus_graphemes[:4]  # Show up to 4
            },
            illustration_required=True,
            illustration_brief=f"Cover illustration showing {self.child_name} in a bright, engaging scene related to the story theme."
        ))

        # Page 2: Parent guidance
        pages.append(BookPage(
            page_number=2,
            page_type=PageType.INSIDE_FRONT,
            content={
                "guidance": self.parent_guidance,
                "level_name": f"Level {self.level}",
                "focus_sounds": self.focus_graphemes
            }
        ))

        # Page 3: Phonics chart
        pages.append(BookPage(
            page_number=3,
            page_type=PageType.PHONICS_CHART,
            content={
                "chart": self.phonics_chart,
                "instruction": "Practise saying the sounds. The circled sounds are in this story."
            }
        ))

        # Pages 4-11: Story (8 pages)
        for i, story_page in enumerate(self.story_pages):
            pages.append(BookPage(
                page_number=4 + i,
                page_type=PageType.STORY,
                content=story_page.content,
                illustration_required=True,
                illustration_brief=story_page.illustration_brief
            ))

        # Page 12: Prediction prompt
        pages.append(BookPage(
            page_number=12,
            page_type=PageType.PREDICTION,
            content={
                "prompt": self.prediction_prompt.prompt_text,
                "hint": self.prediction_prompt.hint_text,
                "instruction": "Stop and think! Talk about your ideas before turning the page."
            }
        ))

        # Page 13: Questions
        pages.append(BookPage(
            page_number=13,
            page_type=PageType.QUESTIONS,
            content={
                "questions": self.questions,
                "instruction": "Talk about these questions together."
            }
        ))

        # Page 14: Worksheet
        pages.append(BookPage(
            page_number=14,
            page_type=PageType.WORKSHEET,
            content=self.worksheet_content
        ))

        # Page 15: Morphology/Extension
        pages.append(BookPage(
            page_number=15,
            page_type=PageType.INSIDE_BACK,
            content={
                "morphology": self.morphology_activity,
                "extension_prompt": "Can you find more words with these sounds in other books?"
            }
        ))

        # Page 16: Back cover
        pages.append(BookPage(
            page_number=16,
            page_type=PageType.BACK_COVER,
            content={
                "tricky_words": self.tricky_words_used,
                "tricky_words_label": "Tricky words in this story:",
                "website": "myphonicsbooks.com",
                "tagline": "Personalised phonics books for your child"
            }
        ))

        return pages

    def get_imposition_order(self) -> List[tuple]:
        """
        Get page pairs for booklet imposition (A4 landscape, fold in middle).

        Returns list of (left_page, right_page) tuples for each sheet.
        """
        # For a 16-page booklet:
        # Sheet 1 front: 16, 1
        # Sheet 1 back: 2, 15
        # Sheet 2 front: 14, 3
        # Sheet 2 back: 4, 13
        # Sheet 3 front: 12, 5
        # Sheet 3 back: 6, 11
        # Sheet 4 front: 10, 7
        # Sheet 4 back: 8, 9

        return [
            (16, 1),   # Sheet 1 front
            (2, 15),   # Sheet 1 back
            (14, 3),   # Sheet 2 front
            (4, 13),   # Sheet 2 back
            (12, 5),   # Sheet 3 front
            (6, 11),   # Sheet 3 back
            (10, 7),   # Sheet 4 front
            (8, 9),    # Sheet 4 back
        ]


# Colour codes for each level
LEVEL_COLOURS = {
    1: {"primary": "#E91E63", "secondary": "#FCE4EC", "name": "Pink"},      # Pink
    2: {"primary": "#FF9800", "secondary": "#FFF3E0", "name": "Orange"},    # Orange
    3: {"primary": "#FFEB3B", "secondary": "#FFFDE7", "name": "Yellow"},    # Yellow
    4: {"primary": "#4CAF50", "secondary": "#E8F5E9", "name": "Green"},     # Green
    5: {"primary": "#2196F3", "secondary": "#E3F2FD", "name": "Blue"},      # Blue
    6: {"primary": "#9C27B0", "secondary": "#F3E5F5", "name": "Purple"}     # Purple
}


def get_level_colour(level: int) -> Dict[str, str]:
    """Get colour scheme for a level."""
    return LEVEL_COLOURS.get(level, LEVEL_COLOURS[1])
