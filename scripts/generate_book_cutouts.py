"""Post-process the 33 photorealistic reader covers (public/shop/r-l*.webp):

1. Background-removal cutout (rembg, isnet-general-use) -> tight-cropped
   transparent PNG at public/shop/cutouts/{sku}.png. For the landing-page
   floating/swipe carousel and for compositing into bundle shots.
2. Using the SAME alpha bounding box, crop the ORIGINAL (backgrounded) photo
   tighter around the booklet and pad it to a square canvas (backdrop colour
   sampled from the image's own corner) -> staged zoomed tile at
   public/shop/_zoomed_staging/{sku}.webp. Fixes the product looking small
   inside the shop grid's near-square card thumbnails.

Staging only — nothing under public/shop/ root is overwritten until the
zoomed tiles are reviewed and promoted (same pattern as generate_realistic_covers.py).

Run:  py -3.12 scripts/generate_book_cutouts.py            # all 33
      py -3.12 scripts/generate_book_cutouts.py r-l1-1 r-l6-1   # subset
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image
from rembg import remove, new_session

ROOT = Path(__file__).resolve().parent.parent
SHOP_DIR = ROOT / "public" / "shop"
CUTOUT_DIR = SHOP_DIR / "cutouts"
ZOOM_STAGING_DIR = SHOP_DIR / "_zoomed_staging"

TIGHT_PAD_FRAC = 0.02   # padding around alpha bbox for the transparent cutout
TILE_PAD_FRAC = 0.06    # padding around alpha bbox for the square shop tile (a bit looser)

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


def sample_backdrop(rgb: Image.Image) -> tuple[int, int, int]:
    corners = [rgb.getpixel((2, 2)), rgb.getpixel((rgb.width - 3, 2))]
    r = sum(c[0] for c in corners) // len(corners)
    g = sum(c[1] for c in corners) // len(corners)
    b = sum(c[2] for c in corners) // len(corners)
    return (r, g, b)


def process(sku_path: Path):
    sku = sku_path.stem
    print(f"[{sku}] ...")
    original = Image.open(sku_path).convert("RGB")
    w, h = original.size

    cutout = remove(original, session=session())  # RGBA
    tight = expand_bbox(alpha_bbox(cutout), w, h, TIGHT_PAD_FRAC)
    cutout_cropped = cutout.crop(tight)
    CUTOUT_DIR.mkdir(parents=True, exist_ok=True)
    cutout_cropped.save(CUTOUT_DIR / f"{sku}.png")

    tile_box = expand_bbox(alpha_bbox(cutout), w, h, TILE_PAD_FRAC)
    tile_crop = original.crop(tile_box)
    side = max(tile_crop.size)
    backdrop = sample_backdrop(tile_crop)
    canvas = Image.new("RGB", (side, side), backdrop)
    canvas.paste(tile_crop, ((side - tile_crop.width) // 2, (side - tile_crop.height) // 2))
    ZOOM_STAGING_DIR.mkdir(parents=True, exist_ok=True)
    canvas.save(ZOOM_STAGING_DIR / f"{sku}.webp", quality=90)

    print(f"   cutout {cutout_cropped.size}  tile {canvas.size}")


def main():
    wanted = set(sys.argv[1:]) or None
    paths = sorted(p for p in SHOP_DIR.glob("r-l*.webp") if p.stem != "r-lib")
    if wanted:
        paths = [p for p in paths if p.stem in wanted]
    for p in paths:
        process(p)
    print(f"\nDone: {len(paths)} covers processed.")


if __name__ == "__main__":
    main()
