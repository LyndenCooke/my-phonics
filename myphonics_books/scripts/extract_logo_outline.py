"""
Derive the "quiet maker's mark" corner logo for the Sound Cards from the
REAL brand mark (phonics-fun-hub/public/logo/mpb-mark-transparent.png —
the open book + star icon), rather than hand-drawing an approximation.

The source PNG is a flat-colour icon: a navy outline stroke (~#16324 2)
around pink/cream/gold fills. Thresholding on pixel brightness cleanly
separates the two — the outline cluster sits at brightness-sum < 250,
every fill colour is well above that — so this keeps only the linework
and drops the fills, giving a single-tone outline of the actual logo
with no API call needed (it's a deterministic pixel operation on a file
we already have, not something worth spending image-generation credits
on).

Run this again if the source logo file ever changes:
    py -3.12 scripts/extract_logo_outline.py
"""

import numpy as np
from PIL import Image
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
SOURCE = BASE_DIR / "phonics-fun-hub" / "public" / "logo" / "mpb-mark-transparent.png"
OUT = BASE_DIR / "assets" / "logo" / "mpb_mark_outline.png"

NAVY = (33, 54, 73)  # matches --ink / the cards' text colour
BRIGHTNESS_CUTOFF = 250  # outline cluster ~120-210, first fill cluster starts ~420
PAD = 12  # px padding kept around the cropped bounding box


def main():
    im = Image.open(SOURCE).convert("RGBA")
    arr = np.array(im)
    r, g, b, a = arr[..., 0], arr[..., 1], arr[..., 2], arr[..., 3]

    is_outline = (a > 10) & ((r.astype(int) + g + b) < BRIGHTNESS_CUTOFF)

    out = np.zeros_like(arr)
    out[..., 0] = NAVY[0]
    out[..., 1] = NAVY[1]
    out[..., 2] = NAVY[2]
    out[..., 3] = np.where(is_outline, a, 0)

    result = Image.fromarray(out, mode="RGBA")
    bbox = result.getbbox()
    if bbox:
        x0, y0, x1, y1 = bbox
        x0, y0 = max(0, x0 - PAD), max(0, y0 - PAD)
        x1, y1 = min(result.width, x1 + PAD), min(result.height, y1 + PAD)
        result = result.crop((x0, y0, x1, y1))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    result.save(OUT)
    print(f"Wrote {OUT} ({result.width}x{result.height})")


if __name__ == "__main__":
    main()
