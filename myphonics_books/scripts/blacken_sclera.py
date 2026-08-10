"""Remove white from eyes across a whole image, automatically.

The house rule is a solid black eye. When the model draws an eye with white in
it, the anatomy is always the same: a big black PUPIL, a small white SCLERA
crescent beside it, and a black outline around both. So the fix is not to guess
the eye's position and stamp an ellipse — it is simply to repaint the white part
black. Pupil and outline are already black, so the whole eye becomes solid.

That makes the fix automatic and safe: no coordinates to read, no ellipse to
size, and nothing outside the eye is touched.

Distinguishing an eye from other white things (teeth, clouds, a page of a
notebook) is done by demanding the white blob be small AND be touching a
substantial, compact black region — the pupil. Teeth touch only a thin outline,
so they are left alone.

    py -3.12 scripts/blacken_sclera.py IMAGE [IMAGE ...]        # apply
    py -3.12 scripts/blacken_sclera.py --dry IMAGE [IMAGE ...]  # report only
"""

import sys
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw

WHITE = 205          # lowering this to catch the anti-aliased rim made
                     # the tool nibble beaks and collars — keep it strict and
                     # fix the rim with the ellipse fill below instead
BLACK = 70           # luminance at/below = "black"
MIN_WHITE = 8        # ignore speckle
MAX_WHITE = 300      # measured: scleras are 60-110 px; trunks are thousands
ENCLOSED = 0.50      # measured: real scleras sit at 0.56-0.60; trunks far lower
MIN_PUPIL = 30       # the black region it touches must be a real pupil
TOUCH = 3            # search radius for adjacent black


def lum(p):
    return 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]


def blobs(mask, W, H, lo, hi):
    """Connected components of a boolean mask, sized between lo and hi."""
    seen = bytearray(W * H)
    out = []
    for y in range(H):
        for x in range(W):
            i = y * W + x
            if seen[i] or not mask[i]:
                continue
            q = deque([(x, y)])
            seen[i] = 1
            pts = []
            while q:
                cx, cy = q.popleft()
                pts.append((cx, cy))
                if len(pts) > hi:
                    break
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = cx + dx, cy + dy
                    if 0 <= nx < W and 0 <= ny < H:
                        j = ny * W + nx
                        if not seen[j] and mask[j]:
                            seen[j] = 1
                            q.append((nx, ny))
            if lo <= len(pts) <= hi:
                out.append(pts)
    return out


def process(path, dry=False):
    im = Image.open(path).convert("RGB")
    W, H = im.size
    px = im.load()
    lums = [0.0] * (W * H)
    for y in range(H):
        for x in range(W):
            lums[y * W + x] = lum(px[x, y])

    whitemask = bytearray(1 if v >= WHITE else 0 for v in lums)
    blackmask = bytearray(1 if v <= BLACK else 0 for v in lums)

    black_blobs = blobs(blackmask, W, H, MIN_PUPIL, 60000)
    black_id = {}
    for bi, pts in enumerate(black_blobs):
        for p in pts:
            black_id[p] = bi
    pupil_size = [len(p) for p in black_blobs]

    draw = ImageDraw.Draw(im)
    fixed = 0
    painted = 0
    for pts in blobs(whitemask, W, H, MIN_WHITE, MAX_WHITE):
        touching = set()
        for (x, y) in pts:
            for dx in range(-TOUCH, TOUCH + 1):
                for dy in range(-TOUCH, TOUCH + 1):
                    q = (x + dx, y + dy)
                    if q in black_id:
                        touching.add(black_id[q])
        if not touching:
            continue
        if max(pupil_size[t] for t in touching) < MIN_PUPIL:
            continue
        # THE discriminator: a sclera is almost entirely ringed by dark (pupil
        # on one side, eye outline on the other). A pale tree trunk or a patch
        # of sky touches dark only along one edge. Without this the tool
        # blackened half the forest.
        pset = set(pts)
        border = 0
        dark_border = 0
        for (x, y) in pts:
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                q = (x + dx, y + dy)
                if q in pset:
                    continue
                border += 1
                qx, qy = q
                if 0 <= qx < W and 0 <= qy < H and lums[qy * W + qx] <= 150:
                    dark_border += 1
        if not border or dark_border / border < ENCLOSED:
            continue
        fixed += 1
        painted += len(pts)
        if not dry:
            # Painting ONLY the white pixels leaves a pale anti-aliased rim
            # around the pupil. Instead fill the ellipse spanning the sclera
            # AND the pupil it touches: that is precisely the eye, and a solid
            # black oval is the house style anyway.
            sx0, sx1 = min(q[0] for q in pts), max(q[0] for q in pts)
            sy0, sy1 = min(q[1] for q in pts), max(q[1] for q in pts)
            cx, cy = (sx0 + sx1) / 2.0, (sy0 + sy1) / 2.0
            # The pupil may only be gathered from a tight window around the
            # sclera. Unbounded, a bird's eye merges with the black crest
            # feathers above it and the ellipse swallows half its head.
            reach = max(14, 2 * max(sx1 - sx0, sy1 - sy0))
            xs, ys = [sx0, sx1], [sy0, sy1]
            for t in touching:
                for (qx, qy) in black_blobs[t]:
                    if abs(qx - cx) <= reach and abs(qy - cy) <= reach:
                        xs.append(qx)
                        ys.append(qy)
            ex0, ey0 = min(xs) - 1, min(ys) - 1
            ex1, ey1 = max(xs) + 1, max(ys) + 1
            # Hard cap: an eye is never more than ~3x its sclera. Without this
            # a bird's eye outline, which is continuous with its crest and body
            # linework, drags the ellipse up over the top of its head.
            capw = 3 * (sx1 - sx0 + 1)
            caph = 3 * (sy1 - sy0 + 1)
            if (ex1 - ex0) > capw or (ey1 - ey0) > caph:
                ex0, ex1 = int(cx - capw / 2), int(cx + capw / 2)
                ey0, ey1 = int(cy - caph / 2), int(cy + caph / 2)
            draw.ellipse([ex0, ey0, ex1, ey1], fill=(0, 0, 0))

    if not dry and fixed:
        im.save(path)
    print("  %-14s %d white-in-eye region(s), %d px%s"
          % (Path(path).name, fixed, painted, "" if not dry else "  [dry]"))
    return fixed


if __name__ == "__main__":
    args = sys.argv[1:]
    dry = "--dry" in args
    files = [a for a in args if not a.startswith("--")]
    if not files:
        sys.exit(__doc__)
    total = sum(process(f, dry) for f in files)
    print("total regions: %d" % total)
