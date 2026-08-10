"""Overlay a labelled pixel grid so eye coordinates can be READ, not guessed.

Every time I estimated an eye's position from a fraction of the image I got it
wrong — the black disc landed on a beak, or on empty sky. Rendering the grid and
reading the numbers off it takes one extra step and is never wrong.

    py -3.12 scripts/grid_overlay.py IMAGE [--step 50] [--crop x0 y0 x1 y1]
                                            [--out FILE] [--scale 2]

Writes <name>_grid.png (or --out). Use with scripts/solidify_eye.py.
"""

import sys
from pathlib import Path

from PIL import Image, ImageDraw


def main():
    a = sys.argv[1:]
    if not a:
        sys.exit(__doc__)
    path = Path(a[0])

    def opt(flag, n, default=None):
        if flag in a:
            i = a.index(flag)
            return [int(v) for v in a[i + 1:i + 1 + n]]
        return default

    step = (opt("--step", 1) or [50])[0]
    scale = (opt("--scale", 1) or [1])[0]
    crop = opt("--crop", 4)
    out = None
    if "--out" in a:
        out = Path(a[a.index("--out") + 1])

    im = Image.open(path).convert("RGB")
    ox, oy = 0, 0
    if crop:
        ox, oy = crop[0], crop[1]
        im = im.crop(tuple(crop))
    if scale != 1:
        im = im.resize((im.width * scale, im.height * scale), Image.LANCZOS)

    d = ImageDraw.Draw(im)
    for gx in range(0, im.width, step * scale):
        d.line([(gx, 0), (gx, im.height)], fill=(255, 0, 0), width=1)
        d.text((gx + 2, 2), str(ox + gx // scale), fill=(255, 0, 0))
    for gy in range(0, im.height, step * scale):
        d.line([(0, gy), (im.width, gy)], fill=(0, 90, 255), width=1)
        d.text((2, gy + 2), str(oy + gy // scale), fill=(0, 90, 255))

    dest = out or path.with_name(path.stem + "_grid.png")
    im.save(dest)
    print("wrote %s  (red = x, blue = y, step %d, origin %d,%d)"
          % (dest.name, step, ox, oy))


if __name__ == "__main__":
    main()
