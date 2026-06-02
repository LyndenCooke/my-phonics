"""
Generate 9:16 (1080x1920) Instagram Story / Reels creative.
Shows all 6 levels with the message: 'Download your first free book today'.
"""
import asyncio
import base64
import shutil
from pathlib import Path
from string import Template
from playwright.async_api import async_playwright

DRIVE = Path(r"G:\My Drive\MyPhonicsBooks")
COVERS = DRIVE / "04_Books_PDFs" / "Covers"
LOGO = DRIVE / "01_Brand" / "mpb-lockup.png"
OUT_LOCAL = Path(r"C:\Users\ASUS\myphonicsbooks\marketing-mockups\v3")
OUT_DRIVE = DRIVE / "02_Marketing" / "Mockups_v3"

PINK = "#E84B8A"
INK = "#0f172a"
INDIGO = "#312e81"

COVER_FILES = [
    "1_1_cover.jpg",
    "2_1_cover.jpg",
    "3_1_cover.jpg",
    "4_1_cover.jpg",
    "5_1_cover.jpg",
    "6_1_cover.jpg",
]


def data_uri(path: Path) -> str:
    mime = "image/png" if path.suffix.lower() == ".png" else "image/jpeg"
    b64 = base64.b64encode(path.read_bytes()).decode()
    return f"data:{mime};base64,{b64}"


LOGO_URI = data_uri(LOGO)
COVER_URIS = [data_uri(COVERS / f) for f in COVER_FILES]


def covers_grid_html() -> str:
    return '<div class="covers">' + "".join(
        f'<div class="cover"><img src="{u}" alt=""/></div>' for u in COVER_URIS
    ) + '</div>'


HTML_TEMPLATE = Template("""<!doctype html>
<html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1080px; height: 1920px; }
  body {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #fdfdfd;
    color: $fg;
    padding: 100px 80px 100px;
    display: flex;
    flex-direction: column;
    -webkit-font-smoothing: antialiased;
  }
  .logo { height: 64px; display: block; margin: 0 auto; }
  h1 {
    font-family: 'Outfit', sans-serif;
    font-weight: 800;
    font-size: 96px;
    line-height: 1.02;
    letter-spacing: -0.02em;
    text-align: center;
    margin-top: 72px;
  }
  .kw {
    color: $pink;
    position: relative;
    display: inline-block;
  }
  .kw::after {
    content: '';
    position: absolute;
    left: 0; right: 0; bottom: -8px;
    height: 8px;
    background: $pink;
    border-radius: 4px;
    opacity: .85;
  }
  .sub {
    margin-top: 36px;
    font-size: 34px;
    line-height: 1.35;
    color: #475569;
    text-align: center;
    font-weight: 500;
  }
  .covers {
    margin-top: 70px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
  .cover {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 12px 32px rgba(0,0,0,.18);
    aspect-ratio: 2/3;
  }
  .cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .cta-wrap { margin-top: auto; display: flex; flex-direction: column; align-items: center; gap: 18px; }
  .cta {
    display: inline-flex;
    align-items: center;
    gap: 18px;
    background: linear-gradient(90deg, #E84B8A, #c33574);
    color: white;
    font-family: 'Outfit', sans-serif;
    font-weight: 700;
    font-size: 38px;
    padding: 28px 56px;
    border-radius: 999px;
    box-shadow: 0 16px 40px rgba(232,75,138,.35);
  }
  .cta .arrow {
    width: 44px; height: 44px;
    border-radius: 50%;
    background: rgba(255,255,255,.22);
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 26px;
  }
  .url {
    font-size: 24px;
    color: #475569;
    font-weight: 600;
  }
</style></head>
<body>
  <img class="logo" src="$logo"/>
  <h1>Download your first <span class="kw">free book</span> today.</h1>
  <div class="sub">6 reading levels. Every word matched to what they've been taught.</div>
  $covers
  <div class="cta-wrap">
    <div class="cta">Get the free book <span class="arrow">&#8594;</span></div>
    <div class="url">myphonicsbooks.co.uk</div>
  </div>
</body></html>
""")


async def main():
    html = HTML_TEMPLATE.substitute(
        fg=INK, pink=PINK, logo=LOGO_URI, covers=covers_grid_html(),
    )
    OUT_LOCAL.mkdir(parents=True, exist_ok=True)
    OUT_DRIVE.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={"width": 1080, "height": 1920}, device_scale_factor=1)
        page = await ctx.new_page()
        await page.set_content(html, wait_until="networkidle")
        out = OUT_LOCAL / "08_story_6_levels.png"
        await page.screenshot(path=str(out), full_page=False,
                              clip={"x": 0, "y": 0, "width": 1080, "height": 1920})
        await browser.close()
    shutil.copy2(out, OUT_DRIVE / out.name)
    print(f"[ok] {out.name}")


if __name__ == "__main__":
    asyncio.run(main())
