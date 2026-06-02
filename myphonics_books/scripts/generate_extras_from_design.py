"""Generate the bespoke grammar/spelling/tricky sheets for a level from a JSON
design produced by the per-level _lN_grammar_spelling_consult.py scripts.

Reads:  output/worksheet_plan/lN_grammar_spelling_design.json
Writes: marketing-mockups/worksheet images/v2/lN_<key>_v1.png  (one per sheet)

The level colour comes from LEVEL_COLOURS (memory: mpb-level-colours). House
style identical to the Sound Pack workflow but no character refs.

Usage:
  py -3.12 scripts/generate_extras_from_design.py 4
  py -3.12 scripts/generate_extras_from_design.py 4 sheet_1 sheet_3
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import re
import sys
import time
from pathlib import Path

from generate_worksheet_image import REF_DIR, EXTRA_REF_DIR, EXTRA_REF_FILES, OUT_DIR, LEVEL_COLOURS  # type: ignore
from openai import OpenAI

ROOT = Path(__file__).resolve().parents[1]
for line in (ROOT / ".env").read_text(encoding="utf-8", errors="ignore").splitlines():
    if line.startswith("OPENAI_API_KEY="):
        os.environ["OPENAI_API_KEY"] = line.split("=", 1)[1].strip()

DESIGN_DIR = ROOT / "output" / "worksheet_plan"


def safe_key(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", s.lower()).strip("_")


def build_house(level: int) -> str:
    colour = LEVEL_COLOURS[level]
    return f"""Printable A4 portrait phonics worksheet for MyPhonicsBooks.
Use the attached images for STYLE ONLY (rounded banner, soft pastel rounded
boxes, cute simple cartoons, grey footer). Do NOT copy their content. Do NOT
use pink banner for any level above L1 — Level {level} uses {colour}.

HOUSE STYLE (binding):
- Top banner solid colour {colour} (the Level {level} colour). Title on the left,
  two chips top-right: "Level {level}" and the sheet's skill chip.
- Footer left (grey, 9pt): "MyPhonicsBooks · decodable phonics practice".
- Generous airy white space. NO reward stars, NO star strips, NO clutter.
- Handwriting space uses full 3-zone guide lines: solid BASELINE, dashed
  MIDLINE at x-height, faint dotted TOPLINE. Lowercase single-storey 'a', no
  serifs. Every printed letter sits ON the baseline.
- Any cartoon character / animal has TWO SMALL PURE BLACK SOLID DOT EYES only.
- British English. NO TEXT BAKED INTO ANY PICTURE (no speech bubbles with text,
  no labels under pictures unless the worksheet explicitly requires them).
"""


def render_sections(sections: list) -> str:
    lines = []
    for i, sec in enumerate(sections, 1):
        lines.append(f"[{i}] \"{sec['heading']}\" — instruction: \"{sec['instruction']}\"")
        lines.append(f"    LAYOUT: {sec.get('layout', '')}")
        content = sec.get("content")
        if content is not None:
            lines.append(f"    EXACT CONTENT: {json.dumps(content, ensure_ascii=False)}")
    return "\n".join(lines)


def sheet_prompt(level: int, sheet: dict) -> str:
    house = build_house(level)
    img_dict_lines = "\n".join(f"  {w} = {d}" for w, d in sheet.get("image_dictionary", []))
    words = ", ".join(sheet.get("word_list", [])) if sheet.get("word_list") else "(no constraint listed)"
    return f"""{house}
Title: "{sheet['title']}"   Skill chip: "{sheet['skill_chip']}"

OBJECTIVE: {sheet['objective']}

LAYOUT — {len(sheet['sections'])} section(s):

{render_sections(sheet['sections'])}

WORD INVENTORY (ONLY these words/letters may appear printed anywhere on the
page; verify each one before drawing):
{words}

VISUAL DICTIONARY (use exactly these meanings for any picture):
{img_dict_lines if img_dict_lines else "  (no pictures on this sheet)"}
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
    ap.add_argument("level", type=int)
    ap.add_argument("keys", nargs="*", help="sheet_1..sheet_N; default all")
    ap.add_argument("--model", default="gpt-image-2")
    ap.add_argument("--size", default="1024x1536")
    ap.add_argument("--quality", default="high")
    ap.add_argument("--redo", action="store_true")
    args = ap.parse_args()

    design = json.loads((DESIGN_DIR / f"l{args.level}_grammar_spelling_design.json")
                        .read_text(encoding="utf-8"))
    targets = args.keys or list(design.keys())
    rf = refs()
    client = OpenAI()
    print(f"L{args.level}: {len(targets)} extra sheets")
    for k in targets:
        if k not in design:
            print(f"  skip {k}: not in design")
            continue
        sheet = design[k]
        # Use a stable filename derived from level + title slug
        slug = safe_key(sheet["title"])[:40]
        out_path = OUT_DIR / f"l{args.level}_{slug}_v1.png"
        if out_path.exists() and not args.redo:
            print(f"  cached {k} -> {out_path.name}")
            continue
        print(f"  generating {k}: {sheet['title']}")
        prompt = sheet_prompt(args.level, sheet)
        gen(client, prompt, out_path, rf, args.model, args.size, args.quality)
        print(f"    saved {out_path.name}")
        time.sleep(1)


if __name__ == "__main__":
    main()
