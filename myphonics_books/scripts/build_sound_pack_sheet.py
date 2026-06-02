"""Render a Sound-Pack worksheet sheet via HTML+SVG+Playwright.

Print-first, fixed-coordinate A4 layout. Same pipeline as the books
(Jinja2 → Chromium → PDF/PNG), but every block is absolutely positioned
in millimetres so the page never drifts based on content.

Content comes from `data/sound_packs/{sound}.json`. The template's
coordinate spec is at the top of `templates/sound_pack_sheet.html`.

Usage:
    py -3.12 scripts/build_sound_pack_sheet.py           # defaults to 'c'
    py -3.12 scripts/build_sound_pack_sheet.py --sound s
    py -3.12 scripts/build_sound_pack_sheet.py --sound c --pdf
"""
from __future__ import annotations

import argparse
import asyncio
import base64
import json
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

ROOT = Path(__file__).resolve().parents[1]
TEMPLATES = ROOT / "templates"
FONTS = ROOT / "assets" / "fonts"
IMAGES = ROOT.parent / "public" / "images" / "words"
DATA_DIR = ROOT / "data" / "sound_packs"
OUT = ROOT / "output" / "sound_pack_html"
OUT.mkdir(parents=True, exist_ok=True)


# ============================================================================
# Asset helpers
# ============================================================================

def font_data_url(name: str) -> str:
    data = (FONTS / name).read_bytes()
    return f"data:font/ttf;base64,{base64.b64encode(data).decode()}"


def img_data_url(path: Path) -> str:
    if not path.exists():
        return ""
    data = path.read_bytes()
    ext = path.suffix.lstrip(".").lower()
    mime = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg",
            "svg": "image/svg+xml", "webp": "image/webp"}.get(ext, "image/png")
    return f"data:{mime};base64,{base64.b64encode(data).decode()}"


def img_tag(image_name: str | None, word: str, fallback_svg: str) -> str:
    """Return an <img> for a real clipart, or an inline SVG fallback."""
    if image_name:
        p = IMAGES / image_name
        if p.exists():
            return f"<img alt='{word}' src='{img_data_url(p)}'/>"
    return fallback_svg or f"<svg viewBox='0 0 100 100'><rect width='100' height='100' fill='#fafafa' stroke='#ddd'/><text x='50' y='55' text-anchor='middle' font-family='Andika' font-size='14' fill='#aaa'>{word}</text></svg>"


# ============================================================================
# SVG: baseline guides + dotted-trace text
# ============================================================================
# All trace SVGs render INSIDE a fixed-mm cell, but the SVG viewBox is in its
# own (px-ish) units. The guides + letter heights are tuned so:
#   topline        → ascender cap
#   midline (dash) → x-height
#   baseline       → bold solid line
#   descender      → below-baseline limit (descenders for g, p, q, y)

GUIDE_FAINT  = "#f4c4d6"   # dashed guides (top/mid/desc)
GUIDE_BASE   = "#1f1f1f"   # solid baseline
TRACE_STROKE = "#9a9a9a"   # dotted-letter stroke
SOLID_FILL   = "#1f1f1f"   # solid model letter


def _guides(width: float, height: float, top: float, mid: float, base: float, desc: float, pad: float = 6) -> str:
    x1, x2 = pad, width - pad
    return (
        f"<line x1='{x1}' y1='{top}'  x2='{x2}' y2='{top}'  stroke='{GUIDE_FAINT}' stroke-width='1'   stroke-dasharray='3,3'/>"
        f"<line x1='{x1}' y1='{mid}'  x2='{x2}' y2='{mid}'  stroke='{GUIDE_FAINT}' stroke-width='1'   stroke-dasharray='3,3'/>"
        f"<line x1='{x1}' y1='{base}' x2='{x2}' y2='{base}' stroke='{GUIDE_BASE}'  stroke-width='1.6'/>"
        f"<line x1='{x1}' y1='{desc}' x2='{x2}' y2='{desc}' stroke='{GUIDE_FAINT}' stroke-width='1'   stroke-dasharray='3,3'/>"
    )


def trace_letter_strip_svg(letter: str, count: int = 10) -> str:
    """Section 1 strip: solid model letter + (count-1) dotted copies on writing guides."""
    W, H = 1180, 150
    top, mid, base, desc = 30, 60, 115, 140
    inner_w = W - 30
    glyph_w = inner_w / count
    font_px = 72

    glyphs = []
    x = 30 + glyph_w / 2
    glyphs.append(
        f"<text x='{x:.1f}' y='{base}' text-anchor='middle' "
        f"font-family='Andika' font-size='{font_px}' font-weight='400' "
        f"fill='{SOLID_FILL}'>{letter}</text>"
    )
    x += glyph_w
    for _ in range(count - 1):
        glyphs.append(
            f"<text x='{x:.1f}' y='{base}' text-anchor='middle' "
            f"font-family='Andika' font-size='{font_px}' font-weight='400' "
            f"fill='none' stroke='{TRACE_STROKE}' stroke-width='2.4' "
            f"stroke-dasharray='0.1,5' stroke-linejoin='round' stroke-linecap='round'>"
            f"{letter}</text>"
        )
        x += glyph_w

    return (
        f"<svg class='trace-svg' viewBox='0 0 {W} {H}' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg'>"
        f"{_guides(W, H, top, mid, base, desc, pad=10)}"
        f"{''.join(glyphs)}"
        f"</svg>"
    )


def trace_word_svg(word: str, *, dotted: bool) -> str:
    """One word on a 4-line writing guide. dotted=True for tracing, False for blank-write."""
    W, H = 600, 130
    top, mid, base, desc = 18, 46, 100, 120
    font_px = 64
    label = ""
    if dotted:
        label = (
            f"<text x='{W/2:.1f}' y='{base}' text-anchor='middle' "
            f"font-family='Andika' font-size='{font_px}' font-weight='400' "
            f"fill='none' stroke='{TRACE_STROKE}' stroke-width='2.4' "
            f"stroke-dasharray='0.1,5' stroke-linejoin='round' stroke-linecap='round'>"
            f"{word}</text>"
        )
    return (
        f"<svg class='trace-svg' viewBox='0 0 {W} {H}' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg'>"
        f"{_guides(W, H, top, mid, base, desc, pad=8)}"
        f"{label}"
        f"</svg>"
    )


def missing_letter_svg(tail: str) -> str:
    """A writing strip showing '_ <tail>' where the leading sound is missing."""
    W, H = 400, 130
    top, mid, base, desc = 18, 46, 100, 120
    font_px = 58
    return (
        f"<svg class='trace-svg' viewBox='0 0 {W} {H}' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg'>"
        f"{_guides(W, H, top, mid, base, desc, pad=8)}"
        f"<text x='{W/2:.1f}' y='{base}' text-anchor='middle' "
        f"font-family='Andika' font-size='{font_px}' font-weight='400' "
        f"fill='{SOLID_FILL}' letter-spacing='4'>__ {tail}</text>"
        f"</svg>"
    )


# ============================================================================
# Inline SVG fallback cliparts (used when public/images/words/{word}.png missing)
# ============================================================================

FALLBACK_SVG = {
    "can": """
<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'>
<ellipse cx='50' cy='22' rx='28' ry='6' fill='#c0c0c0' stroke='#333' stroke-width='2'/>
<rect x='22' y='22' width='56' height='58' fill='#d8d8d8' stroke='#333' stroke-width='2'/>
<ellipse cx='50' cy='80' rx='28' ry='6' fill='#a8a8a8' stroke='#333' stroke-width='2'/>
<rect x='30' y='38' width='40' height='26' fill='#fff' stroke='#333' stroke-width='1.2'/>
<text x='50' y='56' text-anchor='middle' font-family='Andika' font-size='12' font-weight='700' fill='#c1121f'>BEANS</text>
</svg>""",
    "cot": """
<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'>
<rect x='10' y='40' width='80' height='40' fill='#deb887' stroke='#5a3a1a' stroke-width='2'/>
<rect x='10' y='52' width='80' height='6' fill='#fff' stroke='#5a3a1a' stroke-width='1'/>
<g stroke='#5a3a1a' stroke-width='2'>
<line x1='20' y1='40' x2='20' y2='20'/><line x1='32' y1='40' x2='32' y2='20'/>
<line x1='44' y1='40' x2='44' y2='20'/><line x1='56' y1='40' x2='56' y2='20'/>
<line x1='68' y1='40' x2='68' y2='20'/><line x1='80' y1='40' x2='80' y2='20'/>
<line x1='10' y1='20' x2='90' y2='20'/>
</g>
<line x1='10' y1='80' x2='10' y2='90' stroke='#5a3a1a' stroke-width='2'/>
<line x1='90' y1='80' x2='90' y2='90' stroke='#5a3a1a' stroke-width='2'/>
</svg>""",
    "cod": """
<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'>
<path d='M10 50 Q30 25 60 30 Q85 33 90 50 Q85 67 60 70 Q30 75 10 50 Z'
      fill='#8aa9c2' stroke='#37526b' stroke-width='2'/>
<polygon points='90,50 100,38 100,62' fill='#8aa9c2' stroke='#37526b' stroke-width='2'/>
<circle cx='30' cy='44' r='3' fill='#fff' stroke='#37526b'/>
<circle cx='30' cy='44' r='1.4' fill='#1f1f1f'/>
<path d='M22 52 Q26 56 32 54' fill='none' stroke='#37526b' stroke-width='1.2'/>
<path d='M40 40 Q50 42 60 40 M40 50 Q52 53 64 50 M40 58 Q52 60 62 58'
      fill='none' stroke='#37526b' stroke-width='1.2'/>
</svg>""",
    "camera": """
<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'>
<rect x='10' y='30' width='80' height='50' rx='6' fill='#2b2b2b' stroke='#000' stroke-width='2'/>
<rect x='34' y='22' width='28' height='12' rx='2' fill='#2b2b2b' stroke='#000' stroke-width='2'/>
<circle cx='50' cy='56' r='18' fill='#444' stroke='#000' stroke-width='2'/>
<circle cx='50' cy='56' r='12' fill='#1a1a1a' stroke='#666' stroke-width='1.2'/>
<circle cx='46' cy='52' r='3' fill='#aaa' opacity='0.6'/>
<circle cx='78' cy='38' r='2' fill='#e63971'/>
</svg>""",
}


# ============================================================================
# Build template context from JSON
# ============================================================================

def build_context(data: dict) -> dict:
    trace_words = []
    for w in data["trace_words"]:
        word = w["word"]
        trace_words.append({
            "word": word,
            "pic": img_tag(w.get("image"), word, FALLBACK_SVG.get(word, "")),
            "trace_svg": trace_word_svg(word, dotted=True),
            "blank_svg": trace_word_svg(word, dotted=False),
        })

    missing_words = []
    for m in data["missing_words"]:
        word = m["answer"]
        missing_words.append({
            "word": word,
            "pic": img_tag(m.get("image"), word, FALLBACK_SVG.get(word, "")),
            "svg": missing_letter_svg(m["tail"]),
        })

    return {
        "sound": data["sound"],
        "level": data["level"],
        "level_color": data["level_color"],
        "chip_bg": data.get("chip_bg", "#FFF1C8"),
        "banner_title": data.get("banner_title", f"The Sound  {data['sound']}"),
        "trace_letter_svg": trace_letter_strip_svg(
            data["trace_letter"]["letter"],
            count=data["trace_letter"].get("count", 10),
        ),
        "trace_words": trace_words,
        "missing_words": missing_words,
    }


def render_html(ctx: dict) -> str:
    env = Environment(loader=FileSystemLoader(str(TEMPLATES)),
                      autoescape=select_autoescape(disabled_extensions=("html",)))
    tpl = env.get_template("sound_pack_sheet.html")
    return tpl.render(
        font_regular=font_data_url("Andika-Regular.ttf"),
        font_bold=font_data_url("Andika-Bold.ttf"),
        **ctx,
    )


# ============================================================================
# Render
# ============================================================================

async def rasterize(html: str, out_png: Path, *, also_pdf: Path | None = None) -> None:
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(
            viewport={"width": 1240, "height": 1754},
            device_scale_factor=2,
        )
        await page.set_content(html, wait_until="domcontentloaded")
        await page.evaluate("() => document.fonts.ready")
        await page.wait_for_timeout(400)
        el = await page.query_selector(".page")
        await el.screenshot(path=str(out_png), omit_background=False)
        if also_pdf is not None:
            await page.pdf(path=str(also_pdf), format="A4",
                           print_background=True,
                           margin={"top": "0", "right": "0", "bottom": "0", "left": "0"})
        await browser.close()


async def main_async(sound: str, write_pdf: bool) -> None:
    data_path = DATA_DIR / f"{sound}.json"
    if not data_path.exists():
        raise SystemExit(f"No data file: {data_path}")
    data = json.loads(data_path.read_text(encoding="utf-8"))

    ctx = build_context(data)
    html = render_html(ctx)

    html_path = OUT / f"sound_{sound}.html"
    html_path.write_text(html, encoding="utf-8")
    print(f"Saved HTML: {html_path}")

    png_path = OUT / f"sound_{sound}.png"
    pdf_path = OUT / f"sound_{sound}.pdf" if write_pdf else None
    await rasterize(html, png_path, also_pdf=pdf_path)
    print(f"Saved PNG : {png_path}")
    if pdf_path is not None:
        print(f"Saved PDF : {pdf_path}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--sound", default="c", help="grapheme name (matches data/sound_packs/{name}.json)")
    ap.add_argument("--pdf", action="store_true", help="also write A4 PDF")
    args = ap.parse_args()
    asyncio.run(main_async(args.sound, args.pdf))


if __name__ == "__main__":
    main()
