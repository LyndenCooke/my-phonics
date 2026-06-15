"""Render the A5 leaflet HTML to PDF + per-side PNGs (300 DPI)."""
import asyncio
from pathlib import Path

import fitz
from playwright.async_api import async_playwright

HERE = Path(__file__).parent
OUT = HERE / "output"
OUT.mkdir(exist_ok=True)
PDF = OUT / "MyPhonicsBooks_Library_Leaflet_A5.pdf"


JOURNEY_PDF = OUT / "MyPhonicsBooks_Journey_EndPage_A5.pdf"


async def render():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        for html, pdf in [(HERE / "leaflet.html", PDF),
                          (HERE / "journey_page.html", JOURNEY_PDF)]:
            await page.goto(html.as_uri(), wait_until="networkidle")
            await asyncio.sleep(2)  # let webfonts settle
            await page.pdf(path=str(pdf), width="148mm", height="210mm",
                           print_background=True, margin={"top": "0", "bottom": "0",
                                                          "left": "0", "right": "0"})
        await browser.close()


asyncio.run(render())

doc = fitz.open(PDF)
names = ["front", "back"]
for i, pg in enumerate(doc):
    px = pg.get_pixmap(matrix=fitz.Matrix(300 / 72, 300 / 72))
    out = OUT / f"leaflet_{names[i] if i < 2 else i}.png"
    px.save(out)
    print(out, px.width, "x", px.height)
print("PDF:", PDF, f"{PDF.stat().st_size/1e6:.1f} MB, {len(doc)} pages")

jdoc = fitz.open(JOURNEY_PDF)
jdoc[0].get_pixmap(matrix=fitz.Matrix(300 / 72, 300 / 72)).save(OUT / "journey_endpage.png")
print("PDF:", JOURNEY_PDF, f"{JOURNEY_PDF.stat().st_size/1e6:.1f} MB")
