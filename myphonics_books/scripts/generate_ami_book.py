"""
Ami — Gift Book Generator

Generates a personalised A5 PDF gift book for Ami (mother-in-law).
Uses the custom ami_book.html template with the Andika font.

Usage:
    python generate_ami_book.py                # Generate with placeholders
    python generate_ami_book.py --with-images  # Generate with images from output/images/ami_book/
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
IMAGE_DIR = BASE_DIR / "output" / "images" / "ami_book"
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
    from data.ami_book_story import AMI_BOOK_STORY as story

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
        "ami_name": story["ami_name"],
        "from_name": story["from_name"],

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
    """Render the ami_book.html template with Jinja2."""
    env = Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=False,
    )
    template = env.get_template("ami_book.html")
    return template.render(**book_data)


async def html_to_pdf(html_content: str, output_path: Path) -> Path:
    """Convert HTML to PDF using Playwright."""
    from core.pdf_generator import get_pdf_generator

    generator = get_pdf_generator()
    return await generator.generate(html_content, output_path)


def create_booklet(input_path: Path, output_path: Path):
    """Reorder PDF pages for saddle-stitch booklet printing (20 pages = 5 sheets)."""
    from pypdf import PdfReader, PdfWriter

    r = PdfReader(str(input_path))
    total = len(r.pages)

    if total != 20:
        print(f"  WARNING: Expected 20 pages, got {total}. Booklet may not fold correctly.")

    # Booklet imposition for 20 pages (5 sheets, saddle-stitch)
    booklet_order = [
        20, 1,   # Sheet 1 front
        2, 19,   # Sheet 1 back
        18, 3,   # Sheet 2 front
        4, 17,   # Sheet 2 back
        16, 5,   # Sheet 3 front
        6, 15,   # Sheet 3 back
        14, 7,   # Sheet 4 front
        8, 13,   # Sheet 4 back
        12, 9,   # Sheet 5 front
        10, 11,  # Sheet 5 back
    ]

    w = PdfWriter()
    for page_num in booklet_order:
        if page_num <= total:
            w.add_page(r.pages[page_num - 1])

    with open(str(output_path), 'wb') as f:
        w.write(f)


async def main():
    use_images = "--with-images" in sys.argv

    print("=" * 55)
    print("  Ami — Gift Book")
    print("  A MyPhonicsBooks Special Edition")
    print("=" * 55)
    print(f"  Images: {'Yes' if use_images else 'Placeholders'}")
    print()

    # Build data
    print("[1/4] Building book data...")
    book_data = build_book_data(use_images)

    # Render HTML
    print("[2/4] Rendering HTML template...")
    html = render_html(book_data)

    # Save debug HTML
    debug_path = OUTPUT_DIR / "debug_ami_book.html"
    debug_path.write_text(html, encoding="utf-8")
    print(f"      Debug HTML: {debug_path}")

    # Generate PDF
    print("[3/4] Converting to PDF...")
    output_path = OUTPUT_DIR / "Ami_Gift_Book_2026.pdf"
    await html_to_pdf(html, output_path)

    size_kb = output_path.stat().st_size / 1024
    print(f"      PDF: {output_path} ({size_kb:.0f} KB)")

    # Generate booklet version
    print("[4/4] Creating booklet version...")
    booklet_path = OUTPUT_DIR / "Ami_Gift_Book_BOOKLET.pdf"
    create_booklet(output_path, booklet_path)
    booklet_kb = booklet_path.stat().st_size / 1024
    print(f"      Booklet: {booklet_path} ({booklet_kb:.0f} KB)")

    print()
    print(f"  Done!")
    print(f"  Normal:  {output_path}")
    print(f"  Booklet: {booklet_path}")
    print(f"  Pages: 20 (A5 format)")
    print(f"  Sheets: 5 (print 2-up, double-sided, fold)")
    print()
    print("  JazakAllah khair, Ami.")
    print("=" * 55)

    return output_path


if __name__ == "__main__":
    asyncio.run(main())
