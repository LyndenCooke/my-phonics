"""Locate white-sclera eyes automatically and print ROIs for solidify_eye.py.

Reading eye coordinates off a rendered grid image works right up until it
doesn't: on 8.4 page 5 I read the grid twice, got two different answers for the
same file, and painted two black discs onto Tom's collar. Anything that goes
through my eyes and a rescaled screenshot can be off by tens of pixels.

So the coordinates are measured instead. A cartoon eye in this house style is a
small blob of NEAR-WHITE pixels that is (a) surrounded by a dark outline and
(b) contains dark pixels (the pupil) — that combination does not occur on skin,
sky or paper. Report each blob's bbox, padded, ready to paste into
solidify_eye.py.

    py -3.12 scripts/find_sclera.py IMAGE [--min 20] [--max 4000]
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image

WHITE = 205      # luminance at or above this is candidate sclera
DARK = 110       # luminance at or below this is outline/pupil
PAD = 3


def main():
    a = sys.argv[1:]
    if not a:
        sys.exit(__doc__)
    path = Path(a[0])

    def opt(flag, default):
        return int(a[a.index(flag) + 1]) if flag in a else default

    lo, hi = opt("--min", 20), opt("--max", 4000)

    im = Image.open(path).convert("RGB")
    arr = np.asarray(im).astype(float)
    lum = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
    white = lum >= WHITE
    dark = lum <= DARK

    # 4-connected flood fill over the white mask, iterative so big regions
    # (sky, paper) cannot blow the recursion limit.
    h, w = white.shape
    seen = np.zeros_like(white)
    out = []
    ys, xs = np.nonzero(white)
    for sy, sx in zip(ys, xs):
        if seen[sy, sx]:
            continue
        stack = [(sy, sx)]
        seen[sy, sx] = True
        pix = []
        while stack:
            y, x = stack.pop()
            pix.append((y, x))
            if len(pix) > hi:                      # too big to be an eye
                break
            for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= ny < h and 0 <= nx < w and white[ny, nx] \
                        and not seen[ny, nx]:
                    seen[ny, nx] = True
                    stack.append((ny, nx))
        if not (lo <= len(pix) <= hi):
            continue
        py = [p[0] for p in pix]
        px = [p[1] for p in pix]
        y0, y1, x0, x1 = min(py), max(py), min(px), max(px)
        bh, bw = y1 - y0 + 1, x1 - x0 + 1
        if bw > 60 or bh > 60:                     # eyes are small
            continue
        # An eye's white sits against a dark outline AND wraps a dark pupil.
        ring = lum[max(0, y0 - 2):y1 + 3, max(0, x0 - 2):x1 + 3]
        inner = dark[y0:y1 + 1, x0:x1 + 1]
        if (ring <= DARK).sum() < 6 or inner.sum() < 4:
            continue
        out.append((x0 - PAD, y0 - PAD, x1 + PAD + 1, y1 + PAD + 1, len(pix)))

    out.sort(key=lambda r: (r[1], r[0]))
    if not out:
        print("no white-sclera eyes found")
        return
    print("%d candidate eye(s) in %s:" % (len(out), path.name))
    for x0, y0, x1, y1, n in out:
        print("  bbox %4d %4d %4d %4d   (%d white px)" % (x0, y0, x1, y1, n))
    print("\npy -3.12 scripts/solidify_eye.py %s %s" % (
        path.as_posix(),
        " ".join("%d %d %d %d" % r[:4] for r in out)))


if __name__ == "__main__":
    main()
