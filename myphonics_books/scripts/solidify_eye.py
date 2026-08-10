"""Force an eye to a solid black fill — deterministic, no model involved.

House rule (Lynden, non-negotiable, restated 2026-08-05): every eye on every
living thing — child, adult, bird, any animal — is a single solid black filled
shape. No white, no sclera, no iris, no ring, no catchlight. This is an Islamic
business and the look is fixed.

The model will not do this for animals. It obeys for humans and hands birds a
pale iris and a highlight every time, and a corrective generation pass damages
the rest of the frame. So the eye is fixed in pixels instead.

METHOD — row-span fill (per feedback_mpb_eye_style_rule; the approach that
works). Inside a TIGHT ROI around one eye, walk each row, find the leftmost and
rightmost dark outline pixels, and fill everything between them black. That
follows the eye's real outline whatever its shape, and cannot leak: it is bounded
by the outline the artist already drew.

Do NOT use centroid-plus-radius. It fails two ways, both of which I hit: the
centroid gets dragged off by a nearby dark line (a beak, a branch) so the disc
lands askew, and the radius derived from "bright pixels nearby" swallows pale
head feathers and blacks out half the bird.

    py -3.12 scripts/solidify_eye.py IMAGE x0 y0 x1 y1 [x0 y0 x1 y1 ...]

ROI is in PIXELS and should hug the eye — a few px of outline on every side,
nothing else dark inside it. Use scripts/grid_overlay.py to read coordinates.
"""

import sys
from pathlib import Path

from PIL import Image, ImageDraw

DARK = 110          # luminance at or below this counts as outline/pupil
MIN_RUN = 2         # ignore 1px speckle when hunting the outline


def lum(p):
    return 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]


def solidify(im, box):
    """Fill the eye's bounding box with a solid black ELLIPSE.

    Row-span fill (leftmost..rightmost dark pixel per row) sounds right and is a
    trap: any other dark thing inside the ROI becomes one end of the span and the
    fill bridges to it. On a lyrebird whose open beak crossed the ROI it welded
    beak and eye into one black mass and left the white highlight untouched.

    The house style is literally "a solid black filled oval", so once the eye's
    bounding box is known the honest primitive is an inscribed ellipse: exactly
    the right shape, no dependence on what else is nearby, no leak. Getting the
    box right is the whole job — read it off scripts/grid_overlay.py, never
    estimate it from a fraction of the image.
    """
    x0, y0, x1, y1 = box
    ImageDraw.Draw(im).ellipse([x0, y0, x1, y1], fill=(0, 0, 0))
    return (x1 - x0) * (y1 - y0)


def main():
    if len(sys.argv) < 6 or (len(sys.argv) - 2) % 4:
        sys.exit(__doc__)
    path = Path(sys.argv[1])
    coords = [int(v) for v in sys.argv[2:]]
    boxes = [tuple(coords[i:i + 4]) for i in range(0, len(coords), 4)]
    im = Image.open(path).convert("RGB")
    for b in boxes:
        n = solidify(im, b)
        print("  black ellipse in bbox %s (%d px box)" % (b, n))
    im.save(path)
    print("saved", path.name)


if __name__ == "__main__":
    main()
