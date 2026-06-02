"""
Generate v3 Instagram ad creatives at 9:16 (1080x1920).
One creative per hook type: contrarian, belief, shocking-fact, educational,
quick-fact, question, plus a simple CTA. Big logo, big headlines, big covers.
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


ADS = [
    {
        "slug": "01_contrarian",
        "theme": "light",
        "headline": 'Reading <span class="kw">more</span> isn\'t the answer.',
        "sub": 'Reading at the <strong>right level</strong> is. Books one level too hard kill confidence faster than reading too little.',
        "cta": "Find their reading level",
    },
    {
        "slug": "02_belief",
        "theme": "dark",
        "headline": 'Phonics isn\'t about <span class="kw">sounding out</span>.',
        "sub": 'It\'s about which words they\'re <strong>allowed to see</strong>. Every word uses only the sounds they\'ve been taught.',
        "cta": "See how it works",
    },
    {
        "slug": "03_shocking_fact",
        "theme": "light",
        "headline": '<span class="kw stat">1 in 4</span> leave primary school unable to read properly.',
        "sub": 'The biggest hidden cause: books at home that don\'t match what they\'ve been taught.',
        "cta": "Start them right",
    },
    {
        "slug": "04_educational",
        "theme": "light",
        "headline": 'What <span class="kw">"decodable"</span> actually means.',
        "sub": 'Every word uses <strong>only</strong> the sounds they\'ve been taught. No guessing. No memorising. Just reading.',
        "cta": "See a sample book",
    },
    {
        "slug": "05_quick_fact",
        "theme": "dark",
        "headline": '<span class="kw">Every UK school</span> teaches phonics from Reception.',
        "sub": 'But the books at home rarely match. That\'s why progress stalls between school and bedtime.',
        "cta": "Match books to their level",
    },
    {
        "slug": "06_question",
        "theme": "light",
        "headline": 'Do you know <span class="kw">their reading level</span>?',
        "sub": '73% of parents don\'t. The 3-minute assessment tells you exactly where they are.',
        "cta": "Find their level",
    },
    {
        "slug": "07_cta",
        "theme": "light",
        "headline": '3 minutes. <span class="kw">3 free books</span>.',
        "sub": 'Find their exact reading level and get 3 books matched to it. Free. No login.',
        "cta": "Get the free books",
    },
]


HTML_TEMPLATE = Template("""<!doctype html>
<html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1080px; height: 1920px; }
  body {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: $bg;
    color: $fg;
    padding: 72px 72px 72px;
    display: grid;
    grid-template-rows: auto 1fr auto;
    row-gap: 50px;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }
  .logo-wrap { display: flex; justify-content: center; }
  .logo { height: 100px; display: block; }
  .logo-wrap.dark .logo { filter: brightness(0) invert(1); }
  .middle { display: flex; flex-direction: column; min-height: 0; }
  h1 {
    font-family: 'Outfit', sans-serif;
    font-weight: 800;
    font-size: 92px;
    line-height: 1.02;
    letter-spacing: -0.02em;
  }
  .kw {
    color: $pink;
    position: relative;
    display: inline-block;
  }
  .kw.stat {
    font-size: 160px;
    line-height: 1;
    font-weight: 900;
    display: block;
    margin-bottom: 8px;
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
    line-height: 1.32;
    color: $sub_color;
    font-weight: 500;
  }
  .sub strong { color: $fg; font-weight: 700; }
  .covers {
    margin-top: auto;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  .cover {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 14px 36px rgba(0,0,0,.22);
    aspect-ratio: 2/3;
  }
  .cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .bottom { display: flex; flex-direction: column; align-items: center; gap: 20px; }
  .cta {
    display: inline-flex;
    align-items: center;
    gap: 18px;
    background: linear-gradient(90deg, #E84B8A, #c33574);
    color: white;
    font-family: 'Outfit', sans-serif;
    font-weight: 700;
    font-size: 42px;
    padding: 30px 56px;
    border-radius: 999px;
    box-shadow: 0 16px 40px rgba(232,75,138,.4);
  }
  .cta .arrow {
    width: 48px; height: 48px;
    border-radius: 50%;
    background: rgba(255,255,255,.22);
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 28px;
  }
  .footer {
    font-size: 24px;
    color: $sub_color;
    font-weight: 600;
  }
</style></head>
<body>
  <div class="logo-wrap $logo_class"><img class="logo" src="$logo"/></div>
  <div class="middle">
    <h1>$headline</h1>
    <div class="sub">$sub</div>
    $covers
  </div>
  <div class="bottom">
    <div class="cta">$cta <span class="arrow">&#8594;</span></div>
    <div class="footer">myphonicsbooks.co.uk &nbsp;·&nbsp; UK curriculum aligned</div>
  </div>
</body></html>
""")


def build_html(ad: dict) -> str:
    if ad["theme"] == "dark":
        params = dict(bg=INK, fg="#ffffff", sub_color="#cbd5e1", logo_class="dark")
    else:
        params = dict(bg="#fdfdfd", fg=INK, sub_color="#475569", logo_class="")
    return HTML_TEMPLATE.substitute(
        pink=PINK, logo=LOGO_URI,
        headline=ad["headline"], sub=ad["sub"],
        covers=covers_grid_html(), cta=ad["cta"],
        **params,
    )


async def main():
    OUT_LOCAL.mkdir(parents=True, exist_ok=True)
    OUT_DRIVE.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={"width": 1080, "height": 1920}, device_scale_factor=1)
        page = await ctx.new_page()
        outs = []
        for ad in ADS:
            html = build_html(ad)
            await page.set_content(html, wait_until="networkidle")
            out = OUT_LOCAL / f"{ad['slug']}.png"
            await page.screenshot(path=str(out), full_page=False,
                                  clip={"x": 0, "y": 0, "width": 1080, "height": 1920})
            print(f"[ok] {out.name}")
            outs.append(out)
        await browser.close()

    for o in outs:
        dest = OUT_DRIVE / o.name
        shutil.copy2(o, dest)
        print(f"[copied] {dest.name}")


if __name__ == "__main__":
    asyncio.run(main())
