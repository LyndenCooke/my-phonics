"""
Compare PDF output between Playwright and DocRaptor backends.

Generates the same book with both engines for visual comparison.
"""

import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

from generate_book import render_book_html, OUTPUT_DIR, FONTS_DIR, _font_to_data_uri
from generate_test_books import build_test_book
from core.pdf_generator import PlaywrightPDFGenerator, DocRaptorPDFGenerator


async def compare_backends():
    print("PDF Backend Comparison")
    print("=" * 50)
    print()

    # Build Level 2 test book (standard 16-page template)
    book_data = build_test_book(2, "Emma")

    # Embed fonts
    book_data["font_regular"] = _font_to_data_uri(FONTS_DIR / "Andika-Regular.ttf")
    book_data["font_bold"] = _font_to_data_uri(FONTS_DIR / "Andika-Bold.ttf")
    book_data["font_italic"] = _font_to_data_uri(FONTS_DIR / "Andika-Italic.ttf")
    book_data["font_bold_italic"] = _font_to_data_uri(FONTS_DIR / "Andika-BoldItalic.ttf")
    book_data["fonts_dir"] = str(FONTS_DIR).replace("\\", "/")

    html = render_book_html(book_data)

    # Generate with Playwright
    print("1. Generating with Playwright (Chromium)...")
    pw = PlaywrightPDFGenerator()
    pw_path = OUTPUT_DIR / "Compare_Playwright.pdf"
    await pw.generate(html, pw_path)
    print(f"   -> {pw_path.name} ({pw_path.stat().st_size / 1024:.1f} KB)")

    # Generate with DocRaptor
    print("2. Generating with DocRaptor (Prince XML)...")
    api_key = os.environ.get("DOCRAPTOR_API_KEY", "5YUi_8zTn7VjoIuhzKc0")
    try:
        dr = DocRaptorPDFGenerator(api_key=api_key)
        dr_path = OUTPUT_DIR / "Compare_DocRaptor.pdf"
        await dr.generate(html, dr_path)
        print(f"   -> {dr_path.name} ({dr_path.stat().st_size / 1024:.1f} KB)")
    except Exception as e:
        print(f"   DocRaptor error: {e}")
        return

    print()
    print("Done! Compare these two files:")
    print(f"  - Playwright: {pw_path}")
    print(f"  - DocRaptor:  {dr_path}")


if __name__ == "__main__":
    asyncio.run(compare_backends())
