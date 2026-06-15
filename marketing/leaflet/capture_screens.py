"""Capture live-site screenshots for the A5 library leaflet."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

OUT = Path(__file__).parent / "assets"
OUT.mkdir(parents=True, exist_ok=True)

BASE = "https://myphonicsbooks.co.uk"


async def dismiss_overlays(page):
    try:
        for _ in range(6):
            btn = page.locator(
                "button:has-text('Next'), button:has-text('Got it'), "
                "button:has-text('Close'), button[aria-label='Close'], "
                "button:has-text('Skip')"
            )
            if await btn.count() > 0:
                await btn.first.click(timeout=2000)
                await asyncio.sleep(0.6)
            else:
                break
    except Exception:
        pass


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1180, "height": 820},
                                      device_scale_factor=2)

        # 1. Library grid
        print("library...")
        await page.goto(f"{BASE}/library", wait_until="networkidle", timeout=45000)
        await asyncio.sleep(3)
        await dismiss_overlays(page)
        await page.screenshot(path=str(OUT / "shot_library.png"))

        # 2. Interactive reader via deep link
        print("reader...")
        await page.goto(f"{BASE}/library?book=L1.1", wait_until="networkidle", timeout=45000)
        await asyncio.sleep(4)
        await dismiss_overlays(page)
        await page.screenshot(path=str(OUT / "shot_reader_p1.png"))
        # turn a page for a story spread
        try:
            nxt = page.locator("button[aria-label*='ext'], button:has-text('›'), button:has-text('>')")
            if await nxt.count() > 0:
                for _ in range(2):
                    await nxt.first.click(timeout=2000)
                    await asyncio.sleep(1.2)
        except Exception:
            pass
        await page.screenshot(path=str(OUT / "shot_reader_p3.png"))

        # 3. Assessment funnel
        print("assessment...")
        await page.goto(f"{BASE}/assessment", wait_until="networkidle", timeout=45000)
        await asyncio.sleep(3)
        await dismiss_overlays(page)
        await page.screenshot(path=str(OUT / "shot_assessment_intro.png"))
        # try to start the assessment to get a question screen
        try:
            start = page.locator(
                "button:has-text('Start'), button:has-text('Begin'), "
                "button:has-text('check'), a:has-text('Start')"
            )
            if await start.count() > 0:
                await start.first.click(timeout=3000)
                await asyncio.sleep(2.5)
                await page.screenshot(path=str(OUT / "shot_assessment_q.png"))
                # one more click deep if there is an age/level chooser
                opt = page.locator("button:has-text('3'), button:has-text('4'), button:has-text('Reception')")
                if await opt.count() > 0:
                    await opt.first.click(timeout=2000)
                    await asyncio.sleep(2.5)
                    await page.screenshot(path=str(OUT / "shot_assessment_q2.png"))
        except Exception as e:
            print("assessment deep:", e)

        await browser.close()
        print("done ->", OUT)


asyncio.run(main())
