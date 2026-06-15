"""Second pass: unlocked library, story page, real assessment question."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

OUT = Path(__file__).parent / "assets"
BASE = "https://myphonicsbooks.co.uk"


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1180, "height": 820},
                                      device_scale_factor=2)

        # Unlock library with teacher code
        print("teachers unlock...")
        await page.goto(f"{BASE}/teachers", wait_until="networkidle", timeout=45000)
        await asyncio.sleep(2)
        try:
            inp = page.locator("input").first
            await inp.fill("TPT-TEACHERS")
            btn = page.locator("button:has-text('Unlock'), button:has-text('Go'), button:has-text('Submit'), button:has-text('Enter'), button[type='submit']")
            await btn.first.click(timeout=3000)
            await asyncio.sleep(3)
        except Exception as e:
            print("unlock:", e)
        await page.screenshot(path=str(OUT / "shot_teachers_after.png"))

        # Unlocked library
        print("library unlocked...")
        await page.goto(f"{BASE}/teachers/library", wait_until="networkidle", timeout=45000)
        await asyncio.sleep(3)
        await page.screenshot(path=str(OUT / "shot_library_unlocked.png"))

        # Reader: get to an actual story page (past front matter)
        print("reader story page...")
        await page.goto(f"{BASE}/library?book=L1.1", wait_until="networkidle", timeout=45000)
        await asyncio.sleep(4)
        nxt = page.locator("button[aria-label*='ext'], button:has-text('›'), button:has-text('>')")
        for i in range(5):
            try:
                await nxt.first.click(timeout=2000)
                await asyncio.sleep(1.0)
            except Exception:
                break
        await page.screenshot(path=str(OUT / "shot_reader_story.png"))
        for i in range(2):
            try:
                await nxt.first.click(timeout=2000)
                await asyncio.sleep(1.0)
            except Exception:
                break
        await page.screenshot(path=str(OUT / "shot_reader_story2.png"))

        # Assessment: 3-minute check -> skip birthdate -> question screen
        print("assessment question...")
        await page.goto(f"{BASE}/assessment", wait_until="networkidle", timeout=45000)
        await asyncio.sleep(3)
        try:
            await page.locator("text=3").first.click(timeout=3000)
            await asyncio.sleep(2)
            for _ in range(3):
                skip = page.locator("text=Skip")
                cont = page.locator("button:has-text('Continue'), button:has-text('Start')")
                if await skip.count() > 0:
                    await skip.first.click(timeout=2000)
                    await asyncio.sleep(2)
                elif await cont.count() > 0:
                    await cont.first.click(timeout=2000)
                    await asyncio.sleep(2)
                await page.screenshot(path=str(OUT / f"shot_assessment_step{_}.png"))
        except Exception as e:
            print("assessment:", e)

        await browser.close()
        print("done")


asyncio.run(main())
