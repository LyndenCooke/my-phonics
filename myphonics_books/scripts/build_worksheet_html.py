"""Render a MyPhonicsBooks worksheet to PNG using HTML + SVG + Playwright.

Pixel-perfect control over baselines, distractor mapping, and illustrations.

Usage:
    py -3.12 scripts/build_worksheet_html.py
"""
from __future__ import annotations

import asyncio
import base64
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent
FONTS = ROOT / "assets" / "fonts"
OUT = REPO / "marketing-mockups" / "worksheet images" / "v2"
OUT.mkdir(parents=True, exist_ok=True)


# --- Inline SVG illustrations -----------------------------------------------
# Each ~80x80 viewBox, friendly cartoon style, transparent background.

SUN_SVG = """<svg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'>
<g stroke='#f59e0b' stroke-width='3' stroke-linecap='round'>
<line x1='40' y1='6' x2='40' y2='14'/><line x1='40' y1='66' x2='40' y2='74'/>
<line x1='6' y1='40' x2='14' y2='40'/><line x1='66' y1='40' x2='74' y2='40'/>
<line x1='16' y1='16' x2='22' y2='22'/><line x1='58' y1='58' x2='64' y2='64'/>
<line x1='64' y1='16' x2='58' y2='22'/><line x1='22' y1='58' x2='16' y2='64'/>
</g>
<circle cx='40' cy='40' r='18' fill='#fde047' stroke='#f59e0b' stroke-width='2'/>
<circle cx='34' cy='37' r='1.8' fill='#1f2937'/><circle cx='46' cy='37' r='1.8' fill='#1f2937'/>
<path d='M33 45 Q40 50 47 45' stroke='#1f2937' stroke-width='1.8' fill='none' stroke-linecap='round'/>
</svg>"""

# ANT — antennae on the HEAD (left/front), abdomen at the back (right).
ANT_SVG = """<svg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'>
<g fill='#7c2d12' stroke='#451a03' stroke-width='1.2'>
<ellipse cx='58' cy='45' rx='14' ry='10'/>
<ellipse cx='40' cy='42' rx='7' ry='6'/>
<ellipse cx='24' cy='40' rx='9' ry='7.5'/>
</g>
<g stroke='#451a03' stroke-width='1.6' fill='none' stroke-linecap='round'>
<path d='M19 35 Q15 22 12 18'/><circle cx='12' cy='18' r='1.6' fill='#451a03'/>
<path d='M22 33 Q20 20 18 14'/><circle cx='18' cy='14' r='1.6' fill='#451a03'/>
<path d='M30 47 L26 60'/><path d='M27 48 L20 58'/><path d='M24 48 L14 56'/>
<path d='M44 48 L42 60'/><path d='M40 49 L38 60'/><path d='M52 52 L52 62'/>
</g>
<circle cx='20' cy='37' r='1.4' fill='#fff'/>
<circle cx='20' cy='37' r='0.7' fill='#1f2937'/>
<path d='M16 42 Q20 45 24 43' stroke='#1f2937' stroke-width='1' fill='none' stroke-linecap='round'/>
</svg>"""

# HAND tapping a surface — pointing index finger, knocking the table from above.
# Friendly cartoon hand silhouette + motion arcs + tiny "Tap!" tag.
HAND_TAP_SVG = """<svg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'>
<!-- table surface -->
<rect x='2' y='62' width='76' height='5' rx='1.5' fill='#d4a373' stroke='#8b5a2b' stroke-width='0.8'/>
<rect x='2' y='66' width='76' height='4' fill='#a47148'/>
<!-- pointing hand (fist with index finger down, tapping table) -->
<g fill='#fcd9b6' stroke='#7c3a16' stroke-width='1.4' stroke-linejoin='round'>
  <!-- back of hand / palm -->
  <path d='M22 18 Q22 12 30 12 L48 12 Q56 12 56 20 L56 38 Q56 46 48 46 L30 46 Q22 46 22 38 Z'/>
  <!-- index finger pointing DOWN to the table -->
  <path d='M34 44 L34 60 Q34 64 38 64 Q42 64 42 60 L42 44 Z'/>
  <!-- folded thumb on the side -->
  <path d='M22 26 Q14 28 14 34 Q14 40 22 40'/>
  <!-- finger knuckle lines -->
</g>
<g stroke='#7c3a16' stroke-width='0.8' fill='none' stroke-linecap='round'>
  <path d='M30 22 Q34 24 38 22'/><path d='M30 30 Q34 32 38 30'/>
</g>
<!-- motion arcs near fingertip showing tap impact -->
<g stroke='#0ea5e9' stroke-width='1.6' fill='none' stroke-linecap='round'>
  <path d='M28 60 Q22 60 20 64'/>
  <path d='M48 60 Q54 60 56 64'/>
  <path d='M38 66 L38 70'/>
</g>
<!-- Tap! speech tag, top-right -->
<g transform='translate(52,2)'>
  <rect x='0' y='0' width='26' height='14' rx='7' fill='#fff' stroke='#0ea5e9' stroke-width='1.4'/>
  <text x='13' y='10' text-anchor='middle' font-family='Andika, sans-serif' font-size='9' font-weight='700' fill='#0ea5e9'>Tap!</text>
</g>
</svg>"""

# Drawing pin (push-pin) — viewed at an angle so head and pin are both clear.
PIN_SVG = """<svg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'>
<!-- coloured dome head -->
<ellipse cx='40' cy='26' rx='20' ry='8' fill='#dc2626' stroke='#7f1d1d' stroke-width='1.4'/>
<path d='M20 26 Q20 14 40 14 Q60 14 60 26 Z' fill='#ef4444' stroke='#7f1d1d' stroke-width='1.4'/>
<!-- highlight on dome -->
<ellipse cx='32' cy='20' rx='6' ry='2.5' fill='#fecaca' opacity='0.9'/>
<!-- collar -->
<rect x='35' y='32' width='10' height='4' fill='#9ca3af' stroke='#4b5563' stroke-width='0.8'/>
<!-- metal pin shaft -->
<polygon points='37,36 43,36 40,68' fill='#9ca3af' stroke='#4b5563' stroke-width='1'/>
<!-- pin tip highlight -->
<line x1='40' y1='40' x2='40' y2='64' stroke='#e5e7eb' stroke-width='0.6'/>
</svg>"""

INK_SVG = """<svg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'>
<rect x='22' y='30' width='36' height='38' rx='4' fill='#1e3a8a' stroke='#1e1b4b' stroke-width='1.5'/>
<rect x='26' y='22' width='28' height='10' rx='2' fill='#1e293b' stroke='#0f172a' stroke-width='1.5'/>
<rect x='30' y='38' width='20' height='10' fill='#fff'/>
<text x='40' y='46' text-anchor='middle' font-family='Andika, sans-serif' font-size='7' font-weight='700' fill='#1e3a8a'>ink</text>
<ellipse cx='62' cy='22' rx='5' ry='3' fill='#1e3a8a'/>
<path d='M60 24 Q56 30 58 36' stroke='#1e3a8a' stroke-width='2' fill='none' stroke-linecap='round'/>
</svg>"""

NET_SVG = """<svg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'>
<line x1='14' y1='66' x2='44' y2='30' stroke='#92400e' stroke-width='4' stroke-linecap='round'/>
<ellipse cx='52' cy='28' rx='20' ry='14' fill='none' stroke='#0ea5e9' stroke-width='2.5'/>
<g stroke='#7dd3fc' stroke-width='0.8'>
<line x1='36' y1='22' x2='68' y2='22'/><line x1='34' y1='28' x2='70' y2='28'/>
<line x1='36' y1='34' x2='68' y2='34'/>
<line x1='44' y1='15' x2='44' y2='41'/><line x1='52' y1='14' x2='52' y2='42'/><line x1='60' y1='15' x2='60' y2='41'/>
</g>
</svg>"""

PICS = {
    "sun": SUN_SVG, "ant": ANT_SVG, "tap": HAND_TAP_SVG,
    "pin": PIN_SVG, "ink": INK_SVG, "net": NET_SVG,
}

# Per-column mapping: (correct_first_then_distractors_unordered, correct_index_after_shuffle)
# We hardcode positions so the correct answer varies between top/middle/bottom.
# Tuple = (sound, [pic_top, pic_middle, pic_bottom], correct_index_0_based)
COLUMNS = [
    ("s", ["pin", "sun", "net"], 1),
    ("a", ["sun", "ant", "net"], 1),
    ("t", ["ink", "pin", "tap"], 2),
    ("p", ["pin", "ant", "tap"], 0),
    ("i", ["ant", "ink", "sun"], 1),
    ("n", ["net", "pin", "ant"], 0),
]


def font_to_data_url(name: str) -> str:
    p = FONTS / name
    return "data:font/ttf;base64," + base64.b64encode(p.read_bytes()).decode()


def trace_strip_svg(label: str, letters: list[str], width_px: int = 920, height_px: int = 150) -> str:
    """Render one tracing strip: solid model + 4 dotted trace per letter, with 3-zone guides."""
    pad_left = 70
    top_y = 25
    mid_y = 60       # midline (x-height top)
    base_y = 115     # baseline
    desc_y = 140     # below-baseline limit
    inner_w = width_px - pad_left - 20
    n_glyphs = len(letters) * 5  # 1 solid + 4 dotted per letter
    glyph_w = inner_w / n_glyphs
    font_px = 70  # tuned so x-height ≈ baseline - midline = 55px; ascender reaches topline

    glyphs = []
    x = pad_left + glyph_w / 2
    for letter in letters:
        # Solid model letter
        glyphs.append(
            f"<text x='{x:.1f}' y='{base_y}' text-anchor='middle' "
            f"font-family='Andika' font-size='{font_px}' font-weight='400' "
            f"fill='#111827'>{letter}</text>"
        )
        x += glyph_w
        # 4 trace copies — clean light-grey outline (no dasharray; that breaks letter shape)
        for _ in range(4):
            glyphs.append(
                f"<text x='{x:.1f}' y='{base_y}' text-anchor='middle' "
                f"font-family='Andika' font-size='{font_px}' font-weight='400' "
                f"fill='none' stroke='#cbd5e1' stroke-width='1.6' "
                f"stroke-linejoin='round'>{letter}</text>"
            )
            x += glyph_w

    return f"""<svg viewBox='0 0 {width_px} {height_px}' xmlns='http://www.w3.org/2000/svg' style='display:block;width:100%;height:auto'>
<text x='28' y='{base_y - 18}' font-family='Andika' font-size='30' font-weight='700' fill='#E84B8A'>{label}</text>
<!-- topline -->
<line x1='{pad_left}' y1='{top_y}' x2='{width_px - 20}' y2='{top_y}' stroke='#d1d5db' stroke-width='0.8' stroke-dasharray='1.5,3'/>
<!-- midline (dashed) -->
<line x1='{pad_left}' y1='{mid_y}' x2='{width_px - 20}' y2='{mid_y}' stroke='#9ca3af' stroke-width='1' stroke-dasharray='5,4'/>
<!-- baseline (solid) -->
<line x1='{pad_left}' y1='{base_y}' x2='{width_px - 20}' y2='{base_y}' stroke='#374151' stroke-width='1.6'/>
<!-- descender-bound (very faint) -->
<line x1='{pad_left}' y1='{desc_y}' x2='{width_px - 20}' y2='{desc_y}' stroke='#e5e7eb' stroke-width='0.6' stroke-dasharray='1,3'/>
{''.join(glyphs)}
</svg>"""


def build_html() -> str:
    font_reg = font_to_data_url("Andika-Regular.ttf")
    font_bold = font_to_data_url("Andika-Bold.ttf")

    # Sound-hunt columns
    col_html = []
    for sound, pics, _correct in COLUMNS:
        cells = "".join(
            f"<div class='pic-cell'>{PICS[k]}</div>" for k in pics
        )
        col_html.append(
            f"<div class='hunt-col'><div class='letter-cell'>{sound}</div>{cells}</div>"
        )

    strip1 = trace_strip_svg("1", ["s", "a", "t"])
    strip2 = trace_strip_svg("2", ["p", "i", "n"])

    return f"""<!DOCTYPE html>
<html lang='en-GB'><head><meta charset='UTF-8'>
<style>
@font-face {{ font-family:'Andika'; src:url('{font_reg}') format('truetype'); font-weight:400 }}
@font-face {{ font-family:'Andika'; src:url('{font_bold}') format('truetype'); font-weight:700 }}
* {{ margin:0; padding:0; box-sizing:border-box }}
html, body {{ font-family:'Andika', sans-serif; color:#111827; background:#fff }}
.page {{
  width: 210mm; height: 297mm; padding: 14mm 14mm 12mm;
  display: flex; flex-direction: column; gap: 6mm;
  background: #fff;
}}
/* Banner */
.banner {{
  background: #E84B8A; border-radius: 14mm; padding: 6mm 8mm;
  display: flex; align-items: center; gap: 6mm; color: #fff;
  box-shadow: 0 2px 0 #be185d;
}}
.roundel {{ width: 22mm; height: 22mm; border-radius: 50%; background: #fff; flex: 0 0 22mm;
  display: flex; align-items: center; justify-content: center; overflow: hidden; }}
.banner h1 {{ font-size: 22pt; font-weight: 700; flex: 1; letter-spacing: 0.2px; line-height: 1.1; white-space: nowrap }}
.chips {{ display: flex; flex-direction: column; gap: 2mm; align-items: flex-end }}
.chip {{ background: #fff; color: #be185d; font-weight: 700; font-size: 9pt;
        padding: 2mm 4mm; border-radius: 4mm; white-space: nowrap }}

/* Activity wrapper */
.activity {{ flex: 1; display: flex; flex-direction: column; gap: 3mm }}
.activity.fixed-tall {{ flex: 0 0 auto }}
.act-head {{ display: flex; align-items: center; gap: 3mm }}
.num {{ width: 9mm; height: 9mm; border-radius: 50%; background: #E84B8A; color: #fff;
       font-weight: 700; font-size: 14pt; display: flex; align-items: center; justify-content: center; }}
.act-head h2 {{ font-size: 18pt; font-weight: 700; color: #111827 }}
.instruction {{ font-size: 11pt; color: #4b5563; margin-left: 12mm }}

/* Section 1: sound-hunt grid */
.hunt-grid {{
  margin-top: 2mm;
  display: grid; grid-template-columns: repeat(6, 1fr); gap: 3mm;
  padding: 4mm; border: 1.5pt solid #fbcfe8; border-radius: 6mm;
  background: #fdf2f8;
}}
.hunt-col {{ display: flex; flex-direction: column; gap: 2.5mm; align-items: center }}
.letter-cell {{
  width: 16mm; height: 16mm; background: #fff; border: 1.5pt solid #fbcfe8;
  border-radius: 4mm; display: flex; align-items: center; justify-content: center;
  font-size: 24pt; font-weight: 700; color: #be185d;
}}
.pic-cell {{
  width: 22mm; height: 22mm; background: #fff; border: 1pt solid #f9a8d4;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  padding: 2mm;
}}
.pic-cell svg {{ width: 100%; height: 100%; }}

/* Section 2: tracing strips */
.trace-box {{
  margin-top: 2mm; padding: 6mm 4mm; border: 1.5pt solid #fbcfe8;
  border-radius: 6mm; background: #fdf2f8;
  display: flex; flex-direction: column; gap: 8mm;
}}
.trace-box svg {{ display: block; width: 100%; height: auto; }}

/* Footer */
.footer {{
  display: flex; justify-content: space-between; align-items: center;
  font-size: 9pt; color: #6b7280; padding-top: 3mm;
  border-top: 0.5pt solid #e5e7eb;
}}
</style></head>
<body>
<div class='page'>

  <header class='banner'>
    <div class='roundel'>
      <svg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'>
        <circle cx='28' cy='40' r='14' fill='#fde047' stroke='#92400e' stroke-width='1.5'/>
        <circle cx='24' cy='38' r='1.8' fill='#1f2937'/><circle cx='32' cy='38' r='1.8' fill='#1f2937'/>
        <path d='M24 44 Q28 47 32 44' stroke='#1f2937' stroke-width='1.4' fill='none' stroke-linecap='round'/>
        <ellipse cx='56' cy='48' rx='16' ry='13' fill='#f97316' stroke='#7c2d12' stroke-width='1.5'/>
        <polygon points='44,38 48,44 42,46' fill='#f97316' stroke='#7c2d12' stroke-width='1'/>
        <polygon points='68,38 64,44 70,46' fill='#f97316' stroke='#7c2d12' stroke-width='1'/>
        <circle cx='52' cy='46' r='1.4' fill='#1f2937'/><circle cx='60' cy='46' r='1.4' fill='#1f2937'/>
        <path d='M52 52 Q56 54 60 52' stroke='#1f2937' stroke-width='1.2' fill='none' stroke-linecap='round'/>
      </svg>
    </div>
    <h1>1. Tap! Tap! Sound Hunt</h1>
    <div class='chips'>
      <span class='chip'>Level 1 · SATPIN</span>
      <span class='chip'>Tap! Tap! Tap!</span>
    </div>
  </header>

  <section class='activity'>
    <div class='act-head'><span class='num'>1</span><h2>Say and Find</h2></div>
    <p class='instruction'>Circle the picture that starts with the sound.</p>
    <div class='hunt-grid'>
      {''.join(col_html)}
    </div>
  </section>

  <section class='activity fixed-tall'>
    <div class='act-head'><span class='num'>2</span><h2>Trace and Write</h2></div>
    <p class='instruction'>Trace each letter. Then write one more.</p>
    <div class='trace-box'>
      {strip1}
      {strip2}
    </div>
  </section>

  <footer class='footer'>
    <span>MyPhonicsBooks · decodable phonics practice</span>
    <span>Worksheet 1 of 5</span>
  </footer>

</div>
</body></html>"""


async def render():
    from playwright.async_api import async_playwright

    html = build_html()
    out_path = OUT / "worksheet_01_html.png"

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1240, "height": 1754},
                                      device_scale_factor=2)
        await page.set_content(html, wait_until="domcontentloaded")
        await page.evaluate("() => document.fonts.ready")
        await page.wait_for_timeout(300)
        # Screenshot just the .page element
        el = await page.query_selector(".page")
        await el.screenshot(path=str(out_path), omit_background=False)
        await browser.close()

    print(f"Saved: {out_path}")


if __name__ == "__main__":
    asyncio.run(render())
