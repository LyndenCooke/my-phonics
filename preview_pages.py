"""
Preview book pages as screenshots for quality review.
Takes the debug HTML and captures screenshots of each page.
"""

import asyncio
from pathlib import Path


BASE_DIR = Path(__file__).parent
OUTPUT_DIR = BASE_DIR / "output" / "books"
PREVIEW_DIR = BASE_DIR / "output" / "previews"
PREVIEW_DIR.mkdir(parents=True, exist_ok=True)


async def capture_pages():
    from playwright.async_api import async_playwright

    html_path = OUTPUT_DIR / "debug_book.html"
    if not html_path.exists():
        print("No debug_book.html found. Run generate_book.py first.")
        return

    html_url = f"file:///{str(html_path).replace(chr(92), '/')}"

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 560, "height": 794})

        await page.goto(html_url, wait_until="networkidle")
        await page.wait_for_timeout(1000)

        # Get all .page elements
        pages = await page.query_selector_all(".page")
        print(f"Found {len(pages)} pages")

        for i, pg in enumerate(pages):
            screenshot_path = PREVIEW_DIR / f"page_{i+1:02d}.png"
            await pg.screenshot(path=str(screenshot_path))
            print(f"  Page {i+1}: {screenshot_path}")

        await browser.close()

    print(f"\nPreviews saved to: {PREVIEW_DIR}")


if __name__ == "__main__":
    asyncio.run(capture_pages())
