"""
Mama and Me — Mother's Day Gift Book Generator

Generates a personalised A5 PDF gift book from Safia to Aisha.
Uses the custom mama_book.html template with the Andika font.

Usage:
    python generate_mama_book.py                # Generate with placeholders
    python generate_mama_book.py --with-images  # Generate with images from output/images/mama_book/
"""

import asyncio
import sys
import base64
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

# ─── Paths ───────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent.parent
TEMPLATES_DIR = BASE_DIR / "templates"
FONTS_DIR = BASE_DIR / "assets" / "fonts"
OUTPUT_DIR = BASE_DIR / "output" / "books"
IMAGE_DIR = BASE_DIR / "output" / "images" / "mama_book"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def _font_to_data_uri(font_path: Path) -> str:
    """Convert a TTF font file to a base64 data URI."""
    raw = font_path.read_bytes()
    b64 = base64.b64encode(raw).decode("ascii")
    return f"data:font/truetype;base64,{b64}"


def image_to_data_uri(image_path: Path) -> str:
    """Convert a PNG/JPG image to a base64 data URI."""
    suffix = image_path.suffix.lower()
    mime = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
            ".webp": "image/webp"}.get(suffix, "image/png")
    raw = image_path.read_bytes()
    b64 = base64.b64encode(raw).decode("ascii")
    return f"data:{mime};base64,{b64}"


def build_book_data(use_images: bool = False) -> dict:
    """Build the complete template data dict."""
    # Import story data
    sys.path.insert(0, str(BASE_DIR))
    from data.mama_and_me_story import MAMA_AND_ME_STORY as story

    # Process story pages — embed images if available
    story_pages = []
    for i, page in enumerate(story["story_pages"]):
        img = None
        if use_images:
            img_path = IMAGE_DIR / f"page{i+1}.png"
            if img_path.exists():
                img = image_to_data_uri(img_path)
        story_pages.append({
            "text": page["text"],
            "scene": page.get("scene", f"Scene {i+1}"),
            "image": img,
        })

    # Cover image
    cover_img = None
    if use_images:
        cover_path = IMAGE_DIR / "cover.png"
        if cover_path.exists():
            cover_img = image_to_data_uri(cover_path)

    return {
        # Core
        "book_title": story["book_title"],
        "subtitle": story["subtitle"],
        "theme_colour": story["theme_colour"],
        "accent_colour": story["accent_colour"],
        "mama_name": story["mama_name"],
        "baby_name": story["baby_name"],
        "dad_name": story.get("dad_name", "Dad"),

        # Cover
        "cover_image": cover_img,

        # Sounds page
        "special_sounds": story["special_sounds"],
        "story_words": story["story_words"],
        "tricky_words_display": story["tricky_words_display"],

        # Story
        "story_pages": story_pages,

        # Activities
        "love_list": story["love_list"],
        "writing_words": story["writing_words"],

        # Certificate
        "certificate": story["certificate"],

        # Letter
        "final_letter": story["final_letter"],

        # Fonts (embedded as data URIs for Playwright)
        "font_regular": _font_to_data_uri(FONTS_DIR / "Andika-Regular.ttf"),
        "font_bold": _font_to_data_uri(FONTS_DIR / "Andika-Bold.ttf"),
        "font_italic": _font_to_data_uri(FONTS_DIR / "Andika-Italic.ttf"),
        "font_bold_italic": _font_to_data_uri(FONTS_DIR / "Andika-BoldItalic.ttf"),
    }


def render_html(book_data: dict) -> str:
    """Render the mama_book.html template with Jinja2."""
    env = Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=False,
    )
    template = env.get_template("mama_book.html")
    return template.render(**book_data)


async def html_to_pdf(html_content: str, output_path: Path) -> Path:
    """Convert HTML to PDF using Playwright."""
    from core.pdf_generator import get_pdf_generator

    generator = get_pdf_generator()
    return await generator.generate(html_content, output_path)


async def main():
    use_images = "--with-images" in sys.argv

    print("=" * 55)
    print("  Mama and Me — Mother's Day Gift Book")
    print("  A MyPhonicsBooks Special Edition")
    print("=" * 55)
    print(f"  Images: {'Yes' if use_images else 'Placeholders'}")
    print()

    # Build data
    print("[1/3] Building book data...")
    book_data = build_book_data(use_images)

    # Render HTML
    print("[2/3] Rendering HTML template...")
    html = render_html(book_data)

    # Save debug HTML
    debug_path = OUTPUT_DIR / "debug_mama_and_me.html"
    debug_path.write_text(html, encoding="utf-8")
    print(f"      Debug HTML: {debug_path}")

    # Generate PDF
    print("[3/3] Converting to PDF...")
    output_path = OUTPUT_DIR / "Mama_and_Me_Mothers_Day_2026.pdf"
    await html_to_pdf(html, output_path)

    size_kb = output_path.stat().st_size / 1024
    print()
    print(f"  Done! PDF: {output_path}")
    print(f"  Size: {size_kb:.0f} KB")
    print(f"  Pages: 18 (A5 format)")
    print()
    print("  Happy Mother's Day, Aisha! <3")
    print("=" * 55)

    return output_path


if __name__ == "__main__":
    asyncio.run(main())
