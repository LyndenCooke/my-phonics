"""
Crop the individual sound cards out of each generated poster so the
interactive book and the printed sound mat use literally the same images.

Strategy:
  1. For each level, use the known grid (cols × rows) and the known header /
     tricky-words-strip percentages to compute approximate cell rectangles.
  2. Within each cell, locate the card's coloured border using a colour mask
     of the level colour — snap the crop to the actual card edges.
  3. Save each crop with the matching sound name from clipart_cues.json.

Output:  assets/phonics/clipart/level_X/cards/<sound>_<cue>.png

Usage:
    py -3.12 scripts/crop_poster_cards.py            # all six levels
    py -3.12 scripts/crop_poster_cards.py --level L1
"""

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
REPO_ROOT = ROOT.parent
CLIPART_DIR = REPO_ROOT / "assets" / "phonics" / "clipart"
CUES_PATH = ROOT / "data" / "clipart_cues.json"

LEVEL_COLOURS = {
    "level_1": (232, 75, 138),
    "level_2": (245, 158, 11),
    "level_3": (34, 197, 94),
    "level_4": (59, 130, 246),
    "level_5": (139, 92, 246),
    "level_6": (20, 184, 166),
}

# Per-level: (cols, rows, grid_top_pct, grid_bottom_pct, special_last)
# special_last == True means the bottom row only contains a single card on the left
# (used for L1 where 'nk' shares the bottom band with the tricky-words strip).
LEVEL_GRIDS = {
    "level_1": (6, 6, 0.10, 0.85, True),
    "level_2": (4, 3, 0.11, 0.84, False),  # last cell empty
    "level_3": (5, 2, 0.11, 0.78, False),
    "level_4": (3, 2, 0.11, 0.78, False),
    "level_5": (3, 3, 0.11, 0.84, False),
    "level_6": (5, 1, 0.11, 0.78, False),
}

COLOUR_TOLERANCE = 110


def slugify(s: str) -> str:
    return s.replace("-", "_").replace(" ", "_").lower()


def colour_mask(arr: np.ndarray, target: tuple[int, int, int], tol: int = COLOUR_TOLERANCE) -> np.ndarray:
    diff = np.abs(arr.astype(int) - np.array(target, dtype=int)).max(axis=2)
    return diff <= tol


def snap_to_border(cell: np.ndarray, target: tuple[int, int, int]) -> tuple[int, int, int, int]:
    """Within a cell crop, find the smallest box containing the border colour. Returns
    (x1, y1, x2, y2) relative to the cell. Falls back to the full cell if no match."""
    mask = colour_mask(cell, target)
    if not mask.any():
        return 0, 0, cell.shape[1], cell.shape[0]
    ys, xs = np.where(mask)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def crop_level(level_key: str) -> int:
    poster_path = CLIPART_DIR / f"{level_key}_poster_oneshot.png"
    if not poster_path.exists():
        print(f"  [skip] {level_key}: poster missing ({poster_path.name})")
        return 0

    cols, rows, gtop_pct, gbot_pct, special_last = LEVEL_GRIDS[level_key]
    target = LEVEL_COLOURS[level_key]
    cues = json.loads(CUES_PATH.read_text(encoding="utf-8"))[level_key]["cues"]

    img = Image.open(poster_path)
    arr = np.array(img.convert("RGB"))
    h, w = arr.shape[:2]

    grid_top = int(h * gtop_pct)
    grid_bot = int(h * gbot_pct)

    out_dir = CLIPART_DIR / level_key / "cards"
    out_dir.mkdir(parents=True, exist_ok=True)

    # Generate cell rectangles in row-major order.
    cells: list[tuple[int, int, int, int]] = []
    if special_last:
        # L1: cards 0..(cols*(rows-1)-1) in a uniform grid for rows-1 rows.
        # Plus 1 card in the bottom-left of row (rows-1).
        full_rows = rows - 1
        cell_h_full = (grid_bot - grid_top) / rows
        cell_w_full = w / cols
        for r in range(full_rows):
            for c in range(cols):
                x1 = int(c * cell_w_full)
                y1 = int(grid_top + r * cell_h_full)
                x2 = int((c + 1) * cell_w_full)
                y2 = int(grid_top + (r + 1) * cell_h_full)
                cells.append((x1, y1, x2, y2))
        # 31st card sits in bottom-left of the last row
        x1 = 0
        y1 = int(grid_top + full_rows * cell_h_full)
        x2 = int(cell_w_full)
        y2 = int(grid_top + rows * cell_h_full)
        cells.append((x1, y1, x2, y2))
    else:
        cell_h = (grid_bot - grid_top) / rows
        cell_w = w / cols
        for r in range(rows):
            for c in range(cols):
                x1 = int(c * cell_w)
                y1 = int(grid_top + r * cell_h)
                x2 = int((c + 1) * cell_w)
                y2 = int(grid_top + (r + 1) * cell_h)
                cells.append((x1, y1, x2, y2))

    n = min(len(cells), len(cues))
    for i in range(n):
        cx1, cy1, cx2, cy2 = cells[i]
        # Small inward inset so neighbouring borders aren't half-included.
        inset_x = int((cx2 - cx1) * 0.025)
        inset_y = int((cy2 - cy1) * 0.045)
        x1 = cx1 + inset_x
        y1 = cy1 + inset_y
        x2 = cx2 - inset_x
        y2 = cy2 - inset_y
        cue = cues[i]
        out_name = f"{slugify(cue['sound'])}_{slugify(cue['cue'])}.png"
        img.crop((x1, y1, x2, y2)).save(out_dir / out_name, "PNG")

    print(f"  [ok] {level_key}: cropped {n} cards -> {out_dir.relative_to(REPO_ROOT)}/")
    return n


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--level", help="L1..L6; default = all")
    args = ap.parse_args()
    levels = [args.level.lower().replace("l", "level_")] if args.level else \
             list(LEVEL_GRIDS.keys())
    total = 0
    for k in levels:
        total += crop_level(k)
    print(f"Done. Cropped {total} cards in total.")


if __name__ == "__main__":
    main()
