"""Tight-crop the staged photorealistic composite mockups (bundles, sets,
workbooks, card decks, pens, sound-card deck, library box) in
public/shop/_realistic_staging/ — same "too much backdrop" problem as the
reader covers, fixed the same way (rembg bbox), but WITHOUT forcing a square
canvas: these tiles render in several differently-shaped containers across
PhysicalShop.tsx (w-40 h-40 pens, max-h-64 landscape library/family/deck
shots, ~4:5 grid cards for bundles/sets/workbooks/cards), so a natural-aspect
tight crop is the correct fix here, not the single-cover zoomed-square tile.

Writes cropped webp to public/shop/_realistic_staging_cropped/{sku}.webp for
review before promoting over the live public/shop/{sku}.webp.

Run:  py -3.12 scripts/crop_realistic_composites.py            # all staged
      py -3.12 scripts/crop_realistic_composites.py bn-l1 wc-l3
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image
from rembg import remove, new_session

ROOT = Path(__file__).resolve().parent.parent
STAGING_DIR = ROOT / "public" / "shop" / "_realistic_staging"
OUT_DIR = ROOT / "public" / "shop" / "_realistic_staging_cropped"

PAD_FRAC = 0.05  # a bit looser than the single-cover cutout pad — composites
                 # have soft contact shadows worth keeping a sliver of

_session = None


def session():
    global _session
    if _session is None:
        _session = new_session("isnet-general-use")
    return _session


def alpha_bbox(rgba: Image.Image, threshold: int = 10) -> tuple[int, int, int, int]:
    alpha = rgba.split()[-1]
    bbox = alpha.point(lambda a: 255 if a > threshold else 0).getbbox()
    if bbox is None:
        raise ValueError("empty alpha mask")
    return bbox


def expand_bbox(bbox, w, h, frac):
    x0, y0, x1, y1 = bbox
    bw, bh = x1 - x0, y1 - y0
    px, py = bw * frac, bh * frac
    return (
        max(0, int(x0 - px)), max(0, int(y0 - py)),
        min(w, int(x1 + px)), min(h, int(y1 + py)),
    )


def process(path: Path):
    sku = path.stem
    original = Image.open(path).convert("RGB")
    w, h = original.size
    cutout = remove(original, session=session())
    box = expand_bbox(alpha_bbox(cutout), w, h, PAD_FRAC)
    cropped = original.crop(box)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"{sku}.webp"
    cropped.save(out_path, quality=90)
    before_fill = ((box[2] - box[0]) * (box[3] - box[1])) / (w * h)
    print(f"[{sku}] {original.size} -> {cropped.size}  ({before_fill*100:.0f}% of original frame)")


def main():
    wanted = set(sys.argv[1:]) or None
    paths = sorted(STAGING_DIR.glob("*.png"))
    if wanted:
        paths = [p for p in paths if p.stem in wanted]
    for p in paths:
        process(p)
    print(f"\nDone: {len(paths)} composites cropped.")


if __name__ == "__main__":
    main()
