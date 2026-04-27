"""
Composite the MyPhonicsBooks lockup logo onto each generated poster.

Run after generate_full_poster.py — the AI-generated poster has no logo
(gpt-image-2 cannot reproduce our actual brand mark), so we overlay the
real PNG asset on top in the top-left corner.

Usage:
    py -3.12 scripts/brand_posters.py             # all six posters
    py -3.12 scripts/brand_posters.py --level L1  # one level
"""

import argparse
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
REPO_ROOT = ROOT.parent
CLIPART_DIR = REPO_ROOT / "assets" / "phonics" / "clipart"
LOGO_PATH = REPO_ROOT / "public" / "logo" / "mpb-lockup.png"

# Logo width as % of poster width — small but legible
LOGO_WIDTH_PCT = 0.14
# Margin from top-left corner (% of poster width)
MARGIN_PCT = 0.025


def brand_one(poster_path: Path) -> None:
    if not poster_path.exists():
        print(f"  [skip] {poster_path.name} (not generated yet)")
        return
    if not LOGO_PATH.exists():
        print(f"  [error] logo not found: {LOGO_PATH}")
        return

    poster = Image.open(poster_path).convert("RGBA")
    logo = Image.open(LOGO_PATH).convert("RGBA")

    # Resize logo while preserving aspect ratio
    target_w = int(poster.width * LOGO_WIDTH_PCT)
    scale = target_w / logo.width
    target_h = int(logo.height * scale)
    logo = logo.resize((target_w, target_h), Image.LANCZOS)

    margin = int(poster.width * MARGIN_PCT)
    poster.alpha_composite(logo, dest=(margin, margin))

    out = poster.convert("RGB")
    out.save(poster_path, "PNG", optimize=True)
    print(f"  [ok] branded {poster_path.relative_to(REPO_ROOT)}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--level", help="L1..L6; default = all")
    args = ap.parse_args()

    levels = [args.level] if args.level else ["L1", "L2", "L3", "L4", "L5", "L6"]
    for level in levels:
        level_key = level.lower().replace("l", "level_")
        poster = CLIPART_DIR / f"{level_key}_poster_oneshot.png"
        brand_one(poster)


if __name__ == "__main__":
    main()
