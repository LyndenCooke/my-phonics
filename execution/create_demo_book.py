"""
Create a complete demo book for MyPhonicsBooks.

Generates:
1. Story text using Claude API (or sample text)
2. Illustrations using Gemini/DALL-E (or placeholders)
3. PDF of the book
4. Interactive HTML flipbook viewer

Usage:
    python -m execution.create_demo_book
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from jinja2 import Template

from execution.book_structure import (
    BookStructure, BookPage, PageType, LEVEL_COLOURS,
    ParentGuidance, PhonicsChart, PredictionPrompt, MorphologyActivity
)
from execution.generate_images import (
    ImageGenerator, ImageEngine, CharacterDescription, generate_book_illustrations
)


# Sample story for Level 1 "Lost Thing" template
SAMPLE_STORY_LEVEL_1 = {
    "child_name": "Emma",
    "friend_name": "Tom",
    "location": "the park",
    "interest": "dinosaurs",
    "lost_item": "toy dinosaur",
    "owner": "Ben",
    "pages": [
        "Emma was at the park. It was a hot day.",
        "Emma sat on a log. Then Emma got up. Emma ran and ran.",
        "Emma did stop. 'What is that?' said Emma.",
        "It was a toy dinosaur! Emma got it. 'This is not my toy,' said Emma.",
        "'I must find who it is for.' Emma ran to Tom. 'Is this toy for you?' said Emma.",
        "'No,' said Tom. 'But I can help you look.'",
        "Emma and Tom ran on. Then Emma did hear a sound. A boy was sad.",
        "It was Ben! 'My dinosaur!' said Ben. 'Thank you, Emma!'",
        "Emma was happy. It is good to help."
    ],
    "tricky_words_used": ["the", "was", "I", "to", "said", "you", "no", "my"],
    "focus_graphemes": ["a", "t", "s", "p", "i", "n"]
}


def create_book_structure(story_data: Dict, level: int = 1) -> BookStructure:
    """
    Create a BookStructure from story data.

    Args:
        story_data: Dict containing story content
        level: Reading level (1-6)

    Returns:
        Complete BookStructure ready for rendering
    """
    child_name = story_data["child_name"]
    colours = LEVEL_COLOURS[level]

    # Create parent guidance
    parent_guidance = ParentGuidance.for_level(level)

    # Create phonics chart
    phonics_chart = PhonicsChart.for_level(
        level=level,
        focus_graphemes=story_data.get("focus_graphemes", ["s", "a", "t", "p"])
    )

    # Create story pages
    story_pages = []
    for i, text in enumerate(story_data["pages"]):
        story_pages.append(BookPage(
            page_number=4 + i,
            page_type=PageType.STORY,
            content={"text": text, "page_index": i},
            illustration_required=True,
            illustration_brief=f"Scene {i+1}: {text[:50]}..."
        ))

    # Create prediction prompt (after page 4 of story, which is page 7 overall)
    prediction_prompt = PredictionPrompt.generate(
        story_midpoint=7,
        character_name=child_name
    )

    # Create questions
    questions = [
        {"type": "retrieval", "question": f"What did {child_name} find at {story_data['location']}?"},
        {"type": "inference", "question": f"How do you think {story_data['owner']} felt when {child_name} gave back the {story_data['lost_item']}?"},
        {"type": "vocabulary", "question": "What does 'help' mean in this story?"},
        {"type": "prediction", "question": f"What would {child_name} do if they found something again?"}
    ]

    # Create worksheet content
    if level <= 2:
        worksheet_content = {
            "type": "letter_formation",
            "graphemes": story_data.get("focus_graphemes", ["s", "a", "t", "p"])[:4],
            "instruction": "Trace the sounds, then write them yourself:"
        }
    elif level <= 4:
        worksheet_content = {
            "type": "word_writing",
            "words": ["help", "look", "find", "happy", "good", "park"],
            "instruction": "Write these words from the story:"
        }
    else:
        worksheet_content = {
            "type": "sentence_writing",
            "instruction": "Write a sentence about what happened in the story:"
        }

    # Create morphology activity
    morphology = MorphologyActivity.for_level(level, [])

    # Build title
    title = f"{child_name} and the Lost {story_data['lost_item'].title()}"

    return BookStructure(
        title=title,
        child_name=child_name,
        level=level,
        colour_code=colours["primary"],
        parent_guidance=parent_guidance,
        phonics_chart=phonics_chart,
        story_pages=story_pages,
        prediction_prompt=prediction_prompt,
        questions=questions,
        worksheet_content=worksheet_content,
        morphology_activity=morphology,
        focus_graphemes=story_data.get("focus_graphemes", []),
        tricky_words_used=story_data.get("tricky_words_used", [])
    )


def create_flipbook_data(book: BookStructure, illustrations: Dict[int, Path] = None) -> Dict:
    """
    Convert BookStructure to JSON data for the flipbook viewer.

    Args:
        book: BookStructure
        illustrations: Optional dict mapping page numbers to image paths

    Returns:
        Dict ready for JSON serialization
    """
    illustrations = illustrations or {}
    pages = []

    def get_relative_image_path(page_num: int) -> str:
        """Convert absolute path to relative path from demo folder."""
        if page_num not in illustrations or not illustrations[page_num]:
            return None
        # Images are in output/images/, HTML is in output/demo/
        # So relative path is ../images/filename.png
        img_path = illustrations[page_num]
        if isinstance(img_path, Path):
            return f"../images/{img_path.name}"
        # Handle string paths
        filename = str(img_path).replace("\\", "/").split("/")[-1]
        return f"../images/{filename}"

    # Page 1: Cover
    pages.append({
        "page_number": 1,
        "type": "cover",
        "title": book.title,
        "child_name": book.child_name,
        "level": book.level,
        "level_name": LEVEL_COLOURS[book.level]["name"],
        "graphemes": "  ".join(book.focus_graphemes[:4]),
        "illustration": get_relative_image_path(1)
    })

    # Page 2: Parent guidance
    pages.append({
        "page_number": 2,
        "type": "guidance",
        "guidance": {
            "before_reading": book.parent_guidance.before_reading,
            "during_reading": book.parent_guidance.during_reading,
            "if_stuck": book.parent_guidance.error_correction,
            "after_reading": book.parent_guidance.after_reading
        }
    })

    # Page 3: Phonics chart
    all_sounds = []
    for row in book.phonics_chart.consonants:
        all_sounds.extend([s for s in row if s])

    pages.append({
        "page_number": 3,
        "type": "phonics",
        "instruction": "Practise saying the sounds. The circled sounds are in this story.",
        "sounds": all_sounds[:36],  # Limit for display
        "focus_sounds": book.phonics_chart.focus_graphemes
    })

    # Pages 4-11: Story pages
    for i, story_page in enumerate(book.story_pages):
        page_num = 4 + i
        pages.append({
            "page_number": page_num,
            "type": "story",
            "text": story_page.content.get("text", ""),
            "illustration": get_relative_image_path(page_num)
        })

    # Page 12: Prediction prompt
    pages.append({
        "page_number": 12,
        "type": "prediction",
        "prompt": book.prediction_prompt.prompt_text,
        "hint": book.prediction_prompt.hint_text
    })

    # Page 13: Questions
    pages.append({
        "page_number": 13,
        "type": "questions",
        "questions": book.questions
    })

    # Page 14: Worksheet
    ws_data = {
        "page_number": 14,
        "type": "worksheet",
        "instruction": book.worksheet_content.get("instruction", "")
    }
    if "graphemes" in book.worksheet_content:
        ws_data["graphemes"] = book.worksheet_content["graphemes"]
    if "words" in book.worksheet_content:
        ws_data["words"] = book.worksheet_content["words"]
    pages.append(ws_data)

    # Page 15: Extension/Morphology
    ext_data = {
        "page_number": 15,
        "type": "extension",
        "graphemes": book.focus_graphemes[:4]
    }
    if book.morphology_activity:
        ext_data["morphology"] = {
            "root_words": book.morphology_activity.root_words[:4],
            "suffixes": book.morphology_activity.suffixes[:3]
        }
    pages.append(ext_data)

    # Page 16: Back cover
    pages.append({
        "page_number": 16,
        "type": "back_cover",
        "tricky_words": book.tricky_words_used,
        "tagline": "Personalised phonics books for your child"
    })

    return {
        "title": book.title,
        "child_name": book.child_name,
        "level": book.level,
        "pages": pages
    }


def render_flipbook_html(book: BookStructure, illustrations: Dict[int, Path] = None) -> str:
    """
    Render the flipbook HTML with book data.

    Args:
        book: BookStructure
        illustrations: Optional dict mapping page numbers to image paths

    Returns:
        Complete HTML string
    """
    # Load template
    template_path = Path(__file__).parent.parent / "templates" / "flipbook.html"
    with open(template_path, "r", encoding="utf-8") as f:
        template_content = f.read()

    # Get colours
    colours = LEVEL_COLOURS[book.level]

    # Prepare template data
    book_data = create_flipbook_data(book, illustrations)

    # Simple template replacement (avoiding Jinja dependency issues)
    html = template_content
    html = html.replace("{{ book_title }}", book.title)
    html = html.replace("{{ child_name }}", book.child_name)
    html = html.replace("{{ level_colour }}", colours["primary"])
    html = html.replace("{{ level_colour_dark }}", darken_colour(colours["primary"]))
    html = html.replace("{{ level_colour_light }}", colours["secondary"])
    html = html.replace("{{ total_pages }}", str(len(book_data["pages"])))
    html = html.replace("{{ book_data_json | safe }}", json.dumps(book_data, indent=2))

    return html


def darken_colour(hex_colour: str, factor: float = 0.8) -> str:
    """Darken a hex colour."""
    hex_colour = hex_colour.lstrip('#')
    r = int(hex_colour[0:2], 16)
    g = int(hex_colour[2:4], 16)
    b = int(hex_colour[4:6], 16)

    r = int(r * factor)
    g = int(g * factor)
    b = int(b * factor)

    return f"#{r:02x}{g:02x}{b:02x}"


def create_demo_book(
    child_name: str = "Emma",
    level: int = 1,
    use_ai_images: bool = False,
    output_dir: Path = None
) -> Dict[str, Path]:
    """
    Create a complete demo book with all outputs.

    Args:
        child_name: Name of the child protagonist
        level: Reading level (1-6)
        use_ai_images: Whether to generate AI images (requires API keys)
        output_dir: Output directory for files

    Returns:
        Dict with paths to generated files
    """
    output_dir = output_dir or Path("output/demo")
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Creating demo book for {child_name} at Level {level}...")

    # Use sample story data (in production, this would come from Claude)
    story_data = SAMPLE_STORY_LEVEL_1.copy()
    story_data["child_name"] = child_name

    # Create book structure
    print("Building book structure...")
    book = create_book_structure(story_data, level)

    # Generate illustrations
    illustrations = {}
    if use_ai_images:
        print("Generating AI illustrations (this may take a while)...")
        engine = ImageEngine.GEMINI if os.getenv("GEMINI_API_KEY") else ImageEngine.PLACEHOLDER
        illustrations = generate_book_illustrations(
            book_id=f"demo_{child_name}_{level}",
            child_name=child_name,
            character_description="a friendly child with a warm smile",
            title=book.title,
            theme="lost thing adventure",
            level=level,
            colour_code=LEVEL_COLOURS[level]["primary"],
            scene_briefs=[
                {"page_number": 4 + i, "description": page, "emotional_tone": "happy"}
                for i, page in enumerate(story_data["pages"])
            ],
            engine=engine
        )
    else:
        print("Using placeholder illustrations (set use_ai_images=True for AI-generated images)...")

    # Render flipbook HTML
    print("Rendering flipbook HTML...")
    html_content = render_flipbook_html(book, illustrations)

    # Save flipbook HTML
    html_path = output_dir / f"{child_name}_Level{level}_flipbook.html"
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Flipbook saved to: {html_path}")

    # Try to generate PDF (if ReportLab is available)
    pdf_path = None
    try:
        from execution.assemble_pdf import generate_book_pdf
        print("Generating PDF...")
        pdf_path = generate_book_pdf(book, illustrations)
        print(f"PDF saved to: {pdf_path}")
    except ImportError:
        print("ReportLab not available - skipping PDF generation")
    except Exception as e:
        print(f"PDF generation failed: {e}")

    # Save book data as JSON (for debugging/reference)
    json_path = output_dir / f"{child_name}_Level{level}_data.json"
    book_data = create_flipbook_data(book, illustrations)
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(book_data, f, indent=2, default=str)
    print(f"Book data saved to: {json_path}")

    print("\n[OK] Demo book created successfully!")
    print(f"Open the flipbook in your browser: {html_path.absolute()}")

    return {
        "html": html_path,
        "pdf": pdf_path,
        "json": json_path,
        "illustrations": illustrations
    }


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Create a demo phonics book")
    parser.add_argument("--name", default="Emma", help="Child's name")
    parser.add_argument("--level", type=int, default=1, help="Reading level (1-6)")
    parser.add_argument("--ai-images", action="store_true", help="Generate AI images")

    args = parser.parse_args()

    results = create_demo_book(
        child_name=args.name,
        level=args.level,
        use_ai_images=args.ai_images
    )
