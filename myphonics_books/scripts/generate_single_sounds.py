"""Data-driven single-sound worksheet generator.

Reads output/worksheet_plan/single_sound_words_L{level}.json (a curated word
bank), builds each grapheme's prompt with the proven build_sound_prompt(), and
renders it via gpt-image-2 images.edit using the SAME style + tracing reference
images the SATPIN single-sound pack used (no book characters).

Usage:
  py -3.12 scripts/generate_single_sounds.py 2                 # all graphemes in L2 json
  py -3.12 scripts/generate_single_sounds.py 2 v z             # only these graphemes
  py -3.12 scripts/generate_single_sounds.py 2 --redo          # regenerate even if cached
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import time
from pathlib import Path

# Reuse the proven prompt builder + reference-image config from the main script.
from generate_worksheet_image import (  # type: ignore
    build_sound_prompt,
    REF_DIR,
    EXTRA_REF_DIR,
    EXTRA_REF_FILES,
    OUT_DIR,
)
from openai import OpenAI

ROOT = Path(__file__).resolve().parents[1]
for line in (ROOT / ".env").read_text(encoding="utf-8", errors="ignore").splitlines():
    if line.startswith("OPENAI_API_KEY="):
        os.environ["OPENAI_API_KEY"] = line.split("=", 1)[1].strip()

PLAN_DIR = ROOT / "output" / "worksheet_plan"


def load_words(level: int) -> dict:
    path = PLAN_DIR / f"single_sound_words_L{level}.json"
    return json.loads(path.read_text(encoding="utf-8"))


def ref_image_paths() -> list[Path]:
    refs = sorted(REF_DIR.glob("ChatGPT Image*.png"))
    for extra in EXTRA_REF_FILES:
        p = EXTRA_REF_DIR / extra
        if p.exists():
            refs.append(p)
    return refs


def out_filename(grapheme: str) -> str:
    safe = grapheme.replace(" ", "_")
    return f"sound_{safe}_v1.png"


def gen_one(client: OpenAI, grapheme: str, spec: dict, refs: list[Path],
            model: str, size: str, quality: str, max_retries: int = 5) -> Path:
    # Allow disambiguating keys like 'oo_long'/'oo_short' for graphemes with multiple
    # pronunciations. The actual printed grapheme strips the _long/_short suffix.
    letter_to_print = spec.get("letter") or grapheme.split("_")[0]
    prompt = build_sound_prompt(
        letter=letter_to_print,
        sound_name=spec["sound_name"],
        s2_words=[tuple(w) for w in spec["s2_words"]],
        s3_words=[tuple(w) for w in spec["s3_words"]],
        letter_specific_rule=spec.get("rule", ""),
        position=spec.get("position", "start"),
        level=spec.get("level", 2),
    )
    out_path = OUT_DIR / out_filename(grapheme)
    last_err = None
    for attempt in range(1, max_retries + 1):
        opened = [open(r, "rb") for r in refs]
        try:
            result = client.images.edit(
                model=model, image=opened, prompt=prompt,
                size=size, quality=quality, n=1,
            )
            out_path.write_bytes(base64.b64decode(result.data[0].b64_json))
            return out_path
        except Exception as e:  # noqa: BLE001
            last_err = e
            wait = min(2 ** attempt, 30)
            print(f"    {grapheme}: attempt {attempt}/{max_retries} failed "
                  f"({type(e).__name__}); retry in {wait}s")
            time.sleep(wait)
        finally:
            for fh in opened:
                fh.close()
    raise RuntimeError(f"{grapheme} failed after {max_retries}: {last_err}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("level", type=int)
    ap.add_argument("graphemes", nargs="*", help="subset; default = all in json")
    ap.add_argument("--model", default="gpt-image-2")
    ap.add_argument("--size", default="1024x1536")
    ap.add_argument("--quality", default="high")
    ap.add_argument("--redo", action="store_true")
    args = ap.parse_args()

    words = load_words(args.level)
    targets = args.graphemes or list(words.keys())
    refs = ref_image_paths()
    if not refs:
        print("ERROR: no reference images found", file=sys.stderr)
        return 2

    client = OpenAI()
    print(f"L{args.level}: {len(targets)} graphemes, {len(refs)} refs, "
          f"{args.model} {args.size} q={args.quality}")
    for g in targets:
        if g not in words:
            print(f"  SKIP {g}: not in L{args.level} json")
            continue
        out_path = OUT_DIR / out_filename(g)
        if out_path.exists() and not args.redo:
            print(f"  cached {g} -> {out_path.name}")
            continue
        print(f"  generating {g} ...")
        gen_one(client, g, words[g], refs, args.model, args.size, args.quality)
        print(f"    saved {out_path.name}")
        time.sleep(1)
    return 0


if __name__ == "__main__":
    sys.exit(main())
