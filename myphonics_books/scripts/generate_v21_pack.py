"""Generate one v2.1 worksheet pack (6 A4 sheets) from a curated JSON spec.

Reads output/worksheet_plan/v21_packs/{book_id}_pack.json (page-by-page content)
and produces output/worksheet_plan/v21_packs/imgs/{book_id}/page_{n}.png — one
image per page via gpt-image-2 images.edit, using the same style + tracing
reference images the Sound Pack workflow uses (memory: mpb-sound-pack-workflow).

Banner colour is auto-picked from LEVEL_COLOURS based on the pack's level
(memory: mpb-level-colours).

Usage:
  py -3.12 scripts/generate_v21_pack.py L1_1                   # all 6 pages
  py -3.12 scripts/generate_v21_pack.py L1_1 --pages 3 5       # just two pages
  py -3.12 scripts/generate_v21_pack.py L1_1 --redo
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import time
from pathlib import Path

from generate_worksheet_image import REF_DIR, EXTRA_REF_DIR, EXTRA_REF_FILES, LEVEL_COLOURS  # type: ignore
from openai import OpenAI

ROOT = Path(__file__).resolve().parents[1]
for line in (ROOT / ".env").read_text(encoding="utf-8", errors="ignore").splitlines():
    if line.startswith("OPENAI_API_KEY="):
        os.environ["OPENAI_API_KEY"] = line.split("=", 1)[1].strip()

PACKS_DIR = ROOT / "output" / "worksheet_plan" / "v21_packs"
IMG_ROOT = PACKS_DIR / "imgs"
IMG_ROOT.mkdir(parents=True, exist_ok=True)


def build_house(level: int, book_id: str, book_title: str) -> str:
    colour = LEVEL_COLOURS[level]
    return f"""Printable A4 portrait phonics worksheet for MyPhonicsBooks.
Use the attached images for STYLE ONLY (rounded banner, soft pastel rounded
boxes, cute simple cartoons, grey footer). Do NOT copy their content.

HOUSE STYLE (binding):
- Top banner: solid colour {colour} (the LEVEL {level} colour — NOT pink unless
  level 1). Sheet title on the left in white. Two chips top-right: "Level {level}"
  and the skill chip named below.
- Footer left (grey, 9pt): "MyPhonicsBooks · decodable phonics practice".
  Footer right (grey, 9pt): "Pack {book_id.replace('_','.')} · {book_title}".
- Generous airy white space. NO reward stars, NO star strips, NO extra clutter.
- Any handwriting space uses full 3-zone guide lines: solid BASELINE, dashed
  MIDLINE at x-height, faint dotted TOPLINE. Lowercase single-storey 'a', no
  serifs. Every printed letter sits ON the baseline.
- Any cartoon character or animal has TWO SMALL PURE BLACK SOLID DOT EYES only
  — NO whites, NO pupils, NO sparkles, NO eyelashes. British English.
- NO TEXT BAKED INTO ANY PICTURE. NEVER draw a water tap when the word 'tap'
  means the ACTION of tapping.
"""


def page_prompt(level: int, book_id: str, book_title: str, page: dict) -> str:
    house = build_house(level, book_id, book_title)
    # Format sections
    sec_lines = []
    for i, sec in enumerate(page["sections"], 1):
        sec_lines.append(f"[{i}] \"{sec['heading']}\" — instruction: \"{sec['instruction']}\"")
        sec_lines.append(f"    LAYOUT: {sec['layout']}")
        sec_lines.append(f"    EXACT CONTENT (the printed words/letters on this section): {sec['content']}")
    sections_md = "\n".join(sec_lines)
    img_dict = "\n".join(f"  {w} = {d}" for w, d in page.get("image_dictionary", []))
    return f"""{house}
Title: "{page['title']}"   Skill chip: "{page['skill_chip']}"

OBJECTIVE: {page['objective']}

LAYOUT — {len(page['sections'])} section(s):

{sections_md}

WORD INVENTORY (ONLY these words/letters may appear anywhere on the page;
verify each one before drawing):
{page['word_inventory']}

VISUAL DICTIONARY (use exactly these meanings for any picture):
{img_dict if img_dict else "  (no pictures on this page)"}
"""


def refs() -> list[Path]:
    rs = sorted(REF_DIR.glob("ChatGPT Image*.png"))
    for extra in EXTRA_REF_FILES:
        p = EXTRA_REF_DIR / extra
        if p.exists():
            rs.append(p)
    return rs


def gen(client, prompt, out_path, ref_files, model, size, quality, max_retries=5):
    last = None
    for attempt in range(1, max_retries + 1):
        opened = [open(r, "rb") for r in ref_files]
        try:
            r = client.images.edit(model=model, image=opened, prompt=prompt,
                                    size=size, quality=quality, n=1)
            out_path.write_bytes(base64.b64decode(r.data[0].b64_json))
            return out_path
        except Exception as e:  # noqa: BLE001
            last = e
            w = min(2 ** attempt, 30)
            print(f"    attempt {attempt} failed ({type(e).__name__}); retry {w}s")
            time.sleep(w)
        finally:
            for fh in opened:
                fh.close()
    raise RuntimeError(f"failed: {last}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("book_id")
    ap.add_argument("--pages", type=int, nargs="*", help="subset; default all 6")
    ap.add_argument("--model", default="gpt-image-2")
    ap.add_argument("--size", default="1024x1536")
    ap.add_argument("--quality", default="high")
    ap.add_argument("--redo", action="store_true")
    args = ap.parse_args()

    spec = json.loads((PACKS_DIR / f"{args.book_id}_pack.json").read_text(encoding="utf-8"))
    level = spec["level"]
    book_title = spec["book_title"]
    out_dir = IMG_ROOT / args.book_id
    out_dir.mkdir(parents=True, exist_ok=True)

    targets = args.pages or [p["page_num"] for p in spec["pages"]]
    rf = refs()
    client = OpenAI()
    print(f"{args.book_id} (L{level}, {book_title}) — pages {targets}")

    for page in spec["pages"]:
        if page["page_num"] not in targets:
            continue
        out_path = out_dir / f"page_{page['page_num']:02d}.png"
        if out_path.exists() and not args.redo:
            print(f"  cached page {page['page_num']}")
            continue
        prompt = page_prompt(level, args.book_id, book_title, page)
        print(f"  page {page['page_num']}: {page['title']} ({page['skill_chip']})")
        gen(client, prompt, out_path, rf, args.model, args.size, args.quality)
        print(f"    saved {out_path.name}")
        time.sleep(1)


if __name__ == "__main__":
    main()
