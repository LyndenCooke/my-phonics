"""Lesson slides: a 16:9 classroom slide deck from a JSON content file.

Sister pipeline to generate_lesson_overviews.py. Content is authored once in
data/lesson_slides/<deck>.json; a Jinja2 template lays out each slide type and
headless Chromium prints the deck to a widescreen PDF (one slide per page).
Illustrations are inline SVG macros in templates/lesson_slides_figures.html,
so a deck has no external image dependencies and prints identically anywhere.

Run:
  py -3.12 scripts/generate_lesson_slides.py ancient_greece_day
  py -3.12 scripts/generate_lesson_slides.py ancient_greece_day --png   # plus a PNG per slide
  py -3.12 scripts/generate_lesson_slides.py --list

Out: output/lesson_slides/<deck>.pdf (+ .html debug, + png/<deck>_NN.png with --png)
Deps: jinja2, playwright (chromium)

Slide types (field names as in the JSON):
  title, facts, timetable, costume_ideas, figure_steps, labelled_figure,
  cards, events, columns, voting, food, checklist, glossary, closing

House rules: British English; no em dashes; no emojis; every drawn character
has small solid black dot eyes.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

HERE = Path(__file__).resolve().parent
REPO = HERE.parent
DATA = REPO / "data" / "lesson_slides"
TEMPLATES = REPO / "templates"
OUT_DIR = REPO / "output" / "lesson_slides"
FONTS = REPO / "assets" / "fonts"

# 16:9 at 96 dpi: 13.333in x 7.5in, the same canvas as a widescreen PowerPoint.
W, H = 1280, 720

BANNED = ["—", "–"]  # em and en dashes are never used in house copy


def list_decks():
    return sorted(p.stem for p in DATA.glob("*.json"))


def lint(deck: dict):
    """Fail fast on house-style slips before anything is rendered."""
    text = json.dumps(deck, ensure_ascii=False)
    for ch in BANNED:
        if ch in text:
            raise SystemExit(f"House style: found a dash character {ch!r} in {deck['deck']}.json")
    for i, s in enumerate(deck["slides"], 1):
        if "type" not in s:
            raise SystemExit(f"Slide {i} has no type")


def render_html(deck: dict, use_webfonts=True) -> str:
    env = Environment(loader=FileSystemLoader(str(TEMPLATES)),
                      autoescape=select_autoescape(["html"]))
    return env.get_template("lesson_slides.html").render(
        D=deck, W=W, H=H,
        font_regular=(FONTS / "Andika-Regular.ttf").as_uri(),
        font_bold=(FONTS / "Andika-Bold.ttf").as_uri(),
        use_webfonts=use_webfonts,
    )


def _chromium_path() -> str | None:
    """Playwright's pinned Chromium if present, else any Chromium under
    PLAYWRIGHT_BROWSERS_PATH (sandboxes often ship one revision only)."""
    import os
    forced = os.environ.get("LESSON_SLIDES_CHROMIUM")
    if forced:
        return forced
    root = Path(os.environ.get("PLAYWRIGHT_BROWSERS_PATH", ""))
    if not root.is_dir():
        return None
    hits = sorted(root.glob("chromium-*/chrome-linux*/chrome")) + sorted(root.glob("chromium/chrome-linux*/chrome"))
    return str(hits[-1]) if hits else None


# Auto-fit: a slide whose content runs past the footer is scaled down
# uniformly (and centred) until it fits. Measured at natural height so flex
# children cannot hide their overflow. Decks are designed to fit, so this is
# a safety net that should only ever trim a few percent.
FIT_JS = """
() => {
  const out = [];
  document.querySelectorAll('section.slide').forEach((slide, idx) => {
    const c = slide.querySelector('.content');
    if (!c) return;
    const cs = getComputedStyle(slide);
    const padT = parseFloat(cs.paddingTop), padB = parseFloat(cs.paddingBottom);
    const avail = slide.clientHeight - padT - padB;
    const baseW = c.getBoundingClientRect().width;
    c.style.flex = 'none'; c.style.height = 'auto';
    const natural = c.getBoundingClientRect().height;
    if (natural <= avail + 0.5) { c.style.flex = ''; c.style.height = ''; return; }
    const k = Math.max(0.5, (avail / natural) * 0.995);
    c.style.height = avail / k + 'px';
    c.style.transform = 'translateX(' + ((1 - k) * baseW / 2) + 'px) scale(' + k + ')';
    out.push([String(idx + 1), k]);
  });
  return out;
}
"""


async def _print(html_path: Path, pdf_path: Path, png_dir: Path | None):
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        try:
            b = await p.chromium.launch()
        except Exception:
            alt = _chromium_path()
            if not alt:
                raise
            b = await p.chromium.launch(executable_path=alt)
        pg = await b.new_page(viewport={"width": W, "height": H}, device_scale_factor=1.5)
        await pg.goto(html_path.as_uri(), wait_until="networkidle")
        await pg.evaluate("document.fonts.ready")
        await pg.wait_for_timeout(300)
        shrunk = await pg.evaluate(FIT_JS)
        for name, k in shrunk:
            print(f"  auto-fit: slide {name} scaled to {k:.2f}")
        await pg.wait_for_timeout(100)
        await pg.pdf(path=str(pdf_path), width=f"{W}px", height=f"{H}px",
                     print_background=True, prefer_css_page_size=True,
                     margin=dict(top="0", bottom="0", left="0", right="0"))
        if png_dir:
            png_dir.mkdir(parents=True, exist_ok=True)
            slides = await pg.query_selector_all("section.slide")
            for i, el in enumerate(slides, 1):
                await el.screenshot(path=str(png_dir / f"{pdf_path.stem}_{i:02d}.png"))
        await b.close()


def render_deck(name: str, png=False) -> Path:
    src = DATA / f"{name}.json"
    if not src.exists():
        raise SystemExit(f"No deck called {name}. Available: {', '.join(list_decks())}")
    deck = json.loads(src.read_text(encoding="utf-8"))
    lint(deck)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    html_path = OUT_DIR / f"{name}.html"
    pdf_path = OUT_DIR / f"{name}.pdf"
    html_path.write_text(render_html(deck), encoding="utf-8")
    asyncio.run(_print(html_path, pdf_path, OUT_DIR / "png" if png else None))
    print(f"Rendered {len(deck['slides'])} slides -> {pdf_path}")
    return pdf_path


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("deck", nargs="?", help="deck name, e.g. ancient_greece_day")
    ap.add_argument("--png", action="store_true", help="also write one PNG per slide")
    ap.add_argument("--list", action="store_true", help="list available decks")
    args = ap.parse_args()
    if args.list or not args.deck:
        print("\n".join(list_decks()) or "No decks in data/lesson_slides")
        sys.exit(0)
    render_deck(args.deck, png=args.png)
