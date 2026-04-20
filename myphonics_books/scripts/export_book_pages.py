"""
Export book pages from debug HTML as JPGs for the phonics-fun-hub web reader.

Takes the debug HTML file and captures each page as a JPG screenshot.

Usage:
    python export_book_pages.py 1.2         # Export one book
    python export_book_pages.py 1.2 1.3 1.4 # Export multiple books
    python export_book_pages.py all         # Export all books with debug HTML
"""

import asyncio
import sys
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
OUTPUT_DIR = BASE_DIR / "output" / "books"
HUB_PAGES_DIR = BASE_DIR / "phonics-fun-hub" / "public" / "book-pages"
# Also export to dist
HUB_DIST_DIR = BASE_DIR / "phonics-fun-hub" / "dist" / "book-pages"


def find_debug_html(level_str: str) -> Path | None:
    """Find the debug HTML file for a given level like '1.2' or '1.7'."""
    # Convert "1.2" to "1_2"
    key = level_str.replace(".", "_")

    # Determine level folder
    main_level = level_str.split(".")[0]
    level_folder = OUTPUT_DIR / f"Level{main_level}"

    if not level_folder.exists():
        return None

    # Find the debug HTML matching this sub-level
    for f in level_folder.glob(f"debug_{key}_*.html"):
        return f

    return None


async def export_pages(level_str: str):
    """Export all pages from a book's debug HTML as JPGs."""
    from playwright.async_api import async_playwright

    debug_html = find_debug_html(level_str)
    if not debug_html:
        print(f"  [{level_str}] No debug HTML found — skipping")
        return

    # Output directory key: "1.2" -> "1_2"
    key = level_str.replace(".", "_")
    out_dir = HUB_PAGES_DIR / key
    out_dir.mkdir(parents=True, exist_ok=True)

    # Also create dist directory
    dist_dir = HUB_DIST_DIR / key
    dist_dir.mkdir(parents=True, exist_ok=True)

    html_url = f"file:///{str(debug_html).replace(chr(92), '/')}"

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        # A5 page proportions (148mm x 210mm = ~560 x 794px at 96dpi)
        page = await browser.new_page(viewport={"width": 560, "height": 794})

        await page.goto(html_url, wait_until="networkidle")
        await page.wait_for_timeout(2000)  # Wait for images to render

        # Get all .page elements
        pages = await page.query_selector_all(".page")
        total = len(pages)
        print(f"  [{level_str}] Found {total} pages in {debug_html.name}")

        for i, pg in enumerate(pages):
            page_num = i + 1
            # Save as JPG with good quality
            screenshot = await pg.screenshot(type="jpeg", quality=90, timeout=60000)

            # Save to public directory
            jpg_path = out_dir / f"p{page_num}.jpg"
            jpg_path.write_bytes(screenshot)

            # Also save to dist directory
            dist_path = dist_dir / f"p{page_num}.jpg"
            dist_path.write_bytes(screenshot)

        await browser.close()

    print(f"  [{level_str}] Exported {total} pages to {out_dir}")


async def main():
    levels = sys.argv[1:] if len(sys.argv) > 1 else []

    if not levels or levels[0] == "all":
        # Find all debug HTML files
        levels = []
        for level_dir in sorted(OUTPUT_DIR.glob("Level*")):
            for html in level_dir.glob("debug_*_*.html"):
                # Extract level key from filename like "debug_1_7_The_Jam_Jug.html"
                name = html.stem.replace("debug_", "")
                parts = name.split("_")
                if len(parts) >= 2 and parts[0].isdigit() and parts[1].isdigit():
                    levels.append(f"{parts[0]}.{parts[1]}")
        print(f"Found {len(levels)} books to export")

    for level in levels:
        await export_pages(level)

    print("\nDone!")


if __name__ == "__main__":
    asyncio.run(main())
