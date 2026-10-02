"""
Flag clipart whose eyes break the house rule (solid black, no catchlight).

A catchlight is a small near-white blob almost entirely enclosed by near-black
pixels. Larger white areas (teeth, a cloud, the page) are ignored by size;
white shapes inside black outlines that are not enclosed by fill (a shirt
collar) are ignored by the ring test. It is a screen, not a judge: flagged
images get looked at, unflagged animals still get a zoomed look.

  py -3.12 scripts/worksheets/eye_check.py worksheet-forge/artcache/*.png
"""
import sys

import numpy as np
from PIL import Image
from scipy import ndimage


def catchlights(path):
    a = np.asarray(Image.open(path).convert("L"), dtype=np.int32)
    h, w = a.shape
    black = a < 60
    white = a > 200
    labels, n = ndimage.label(white)
    if n == 0:
        return []
    sizes = ndimage.sum(np.ones_like(a), labels, index=range(1, n + 1))
    max_area = h * w * 0.0002  # a catchlight is tiny next to the picture
    hits = []
    for i, area in enumerate(sizes, start=1):
        if area < 4 or area > max_area:
            continue
        blob = labels == i
        ring = ndimage.binary_dilation(blob, iterations=3) & ~blob
        if ring.sum() and black[ring].mean() > 0.92:
            ys, xs = np.where(blob)
            hits.append((int(xs.mean()), int(ys.mean()), int(area)))
    return hits


if __name__ == "__main__":
    flagged = 0
    for p in sys.argv[1:]:
        h = catchlights(p)
        if h:
            flagged += 1
            print(f"FLAG {p}  {len(h)} spot(s) at {h[:4]}")
    print(f"{flagged} flagged of {len(sys.argv) - 1}")
