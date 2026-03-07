#!/usr/bin/env python3
"""Build a draft PDF book from data/story_summaries.json.

Usage:
    python build_book.py 3.2
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from core.assemble_pdf import generate_book_pdf
from core.book_structure import (
    BookPage,
    BookStructure,
    MorphologyActivity,
    PageType,
    ParentGuidance,
    PhonicsChart,
    PredictionPrompt,
    LEVEL_COLOURS,
)


def parse_book_code(code: str) -> tuple[int, int]:
    m = re.fullmatch(r"\s*(\d+)\.(\d+)\s*", code)
    if not m:
        raise ValueError("Book code must be in the form <level>.<book>, e.g. 3.2")
    return int(m.group(1)), int(m.group(2))


def load_story(level: int, book_number: int) -> dict:
    with Path("data/story_summaries.json").open("r", encoding="utf-8") as f:
        data = json.load(f)

    level_key = f"level_{level}"
    if level_key not in data:
        raise KeyError(f"No data for {level_key}")

    for story in data[level_key]["stories"]:
        if int(story.get("book_number", -1)) == book_number:
            return story
    raise KeyError(f"No story for {level_key} book {book_number}")


def split_theme_into_pages(theme: str, pages: int = 8) -> list[str]:
    sentences = [s.strip() for s in theme.split(".") if s.strip()]
    if not sentences:
        return ["" for _ in range(pages)]
    if len(sentences) >= pages:
        return [f"{s}." for s in sentences[:pages]]

    # pad by reusing the last sentence so every page has text
    out = [f"{s}." for s in sentences]
    while len(out) < pages:
        out.append(out[-1])
    return out


def build_book(level: int, book_number: int) -> Path:
    story = load_story(level, book_number)
    title = story["title"]

    story_text = split_theme_into_pages(story.get("theme", ""), pages=8)
    story_pages = [
        BookPage(
            page_number=4 + idx,
            page_type=PageType.STORY,
            content={"text": text, "page_index": idx},
            illustration_required=False,
        )
        for idx, text in enumerate(story_text)
    ]

    focus_graphemes = story.get("focus_sounds", [])
    tricky_words = story.get("tricky_words_used", [])

    book = BookStructure(
        title=title,
        child_name="Reader",
        level=level,
        colour_code=LEVEL_COLOURS[level]["primary"],
        parent_guidance=ParentGuidance.for_level(level),
        phonics_chart=PhonicsChart.for_level(level, focus_graphemes=focus_graphemes),
        story_pages=story_pages,
        prediction_prompt=PredictionPrompt.generate(story_midpoint=7, character_name="the child"),
        questions=[
            {"type": "retrieval", "question": "What was discovered in the story?"},
            {"type": "inference", "question": "How did the child feel at the end?"},
            {"type": "vocabulary", "question": "Which words describe the key object?"},
            {"type": "prediction", "question": "What might happen next time?"},
        ],
        worksheet_content={
            "type": "word_writing",
            "words": story.get("activity_words", [])[:6],
            "instruction": "Write these words from the story:",
        },
        morphology_activity=MorphologyActivity.for_level(level, story.get("target_words", [])),
        focus_graphemes=focus_graphemes,
        tricky_words_used=tricky_words,
    )

    return generate_book_pdf(book)


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python build_book.py <level.book> (example: 3.2)")
        return 1
    level, book_number = parse_book_code(sys.argv[1])
    out = build_book(level, book_number)
    print(f"Built: {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
