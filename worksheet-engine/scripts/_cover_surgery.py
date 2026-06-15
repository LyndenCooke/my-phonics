# ---------------------------------------------------------------------------
# _cover_surgery.py — deterministic pixel fixes for the W2 covers, used when
# gemini-2.5-flash-image won't converge on a word (it has a prior for
# 'Togther'/'handwiting'). The covers are white ink on one flat colour, so we
# can: (a) splice a missing letter into a line using a donor glyph from the
# SAME line (self-consistent typography), (b) recolour the flat background to
# the exact ledger hex by unmixing ink alpha, (c) enlarge the hero art in
# place. Run analyse() first, verify the printed glyph map, then splice.
# ---------------------------------------------------------------------------
import sys
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent.parent
COVERS = HERE / "public" / "covers" / "w2"
WHITE = np.array([255.0, 255.0, 255.0])


def load(n):
    im = Image.open(COVERS / f"l{n}.png").convert("RGB")
    return np.asarray(im).astype(float)


def save(arr, n):
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).save(COVERS / f"l{n}.png")


def bg_colour(arr):
    # most common colour in the four 40px corners — the flat background
    corners = np.concatenate([
        arr[:40, :40].reshape(-1, 3), arr[:40, -40:].reshape(-1, 3),
        arr[-40:, :40].reshape(-1, 3), arr[-40:, -40:].reshape(-1, 3)])
    vals, counts = np.unique(corners.astype(np.uint8).reshape(-1, 3), axis=0,
                             return_counts=True)
    return vals[counts.argmax()].astype(float)


def ink_alpha(arr, bg):
    # P = a*WHITE + (1-a)*bg  ->  a via projection onto (WHITE-bg)
    d = WHITE - bg
    a = ((arr - bg) @ d) / (d @ d)
    return np.clip(a, 0, 1)


def find_lines(alpha, y0, y1, thresh=0.30, min_h=8):
    """Text-line bands inside [y0,y1): runs of rows whose max ink > thresh."""
    rows = alpha[y0:y1].max(axis=1) > thresh
    lines, start = [], None
    for i, r in enumerate(rows):
        if r and start is None:
            start = i
        elif not r and start is not None:
            if i - start >= min_h:
                lines.append((y0 + start, y0 + i))
            start = None
    if start is not None:
        lines.append((y0 + start, y0 + len(rows)))
    return lines


def find_glyphs(alpha, band, thresh=0.30, min_gap=2):
    """Glyph clusters in a line band: runs of ink columns. Returns
    [(x0, x1), ...] and the gap widths between consecutive clusters."""
    strip = alpha[band[0]:band[1]]
    cols = strip.max(axis=0) > thresh
    clusters, start = [], None
    for i, c in enumerate(cols):
        if c and start is None:
            start = i
        elif not c and start is not None:
            clusters.append([start, i])
            start = None
    if start is not None:
        clusters.append([start, len(cols)])
    # merge clusters separated by < min_gap (broken glyphs)
    merged = [clusters[0]] if clusters else []
    for c in clusters[1:]:
        if c[0] - merged[-1][1] < min_gap:
            merged[-1][1] = c[1]
        else:
            merged.append(c)
    gaps = [merged[i + 1][0] - merged[i][1] for i in range(len(merged) - 1)]
    return merged, gaps


def analyse(n, y_frac=(0.04, 0.40)):
    arr = load(n)
    h = arr.shape[0]
    bg = bg_colour(arr)
    alpha = ink_alpha(arr, bg)
    print(f"L{n} size={arr.shape[1]}x{h} bg={bg.astype(int)}")
    for band in find_lines(alpha, int(h * y_frac[0]), int(h * y_frac[1])):
        glyphs, gaps = find_glyphs(alpha, band)
        widths = [g[1] - g[0] for g in glyphs]
        print(f"  band y={band} n_glyphs={len(glyphs)}")
        print(f"    widths={widths}")
        print(f"    gaps={gaps}")
        print(f"    x0s={[g[0] for g in glyphs]}")
    return arr, bg, alpha


def rebuild_line(n, band, ops, protect=None, pad=1):
    """Edit one text line, then recentre its ink on the original centre.
    ops: list of ('cut', (x0, x1)) and ('insert', x, (d0, d1)) in ORIGINAL
    strip x-coords; donors are captured before any edit. protect=(pl, pr)
    bounds an editable zone whose outside (decorations) is left untouched."""
    arr = load(n)
    bg = bg_colour(arr)
    y0, y1 = band
    strip = arr[y0:y1].copy()
    pl, pr = protect if protect else (0, strip.shape[1])
    zone = strip[:, pl:pr].copy()
    alpha = ink_alpha(zone, bg)
    ink_cols = np.nonzero(alpha.max(axis=0) > 0.3)[0]
    old_centre = (ink_cols[0] + ink_cols[-1]) / 2

    donors = {id(op): strip[:, op[2][0] - pad:op[2][1] + pad].copy()
              for op in ops if op[0] == 'insert'}
    # apply right-to-left so earlier coordinates stay valid
    for op in sorted(ops, key=lambda o: -(o[1][0] if o[0] == 'cut' else o[1])):
        if op[0] == 'cut':
            c0, c1 = op[1][0] - pl, op[1][1] - pl
            zone = np.concatenate([zone[:, :c0], zone[:, c1:]], axis=1)
        else:
            x = op[1] - pl
            zone = np.concatenate([zone[:, :x], donors[id(op)], zone[:, x:]],
                                  axis=1)

    alpha = ink_alpha(zone, bg)
    ink_cols = np.nonzero(alpha.max(axis=0) > 0.3)[0]
    new_centre = (ink_cols[0] + ink_cols[-1]) / 2
    shift = int(round(old_centre - new_centre))

    out = np.tile(bg, (strip.shape[0], pr - pl, 1)).astype(float)
    dst0 = max(0, shift)
    src0 = max(0, -shift)
    width = min(zone.shape[1] - src0, out.shape[1] - dst0)
    out[:, dst0:dst0 + width] = zone[:, src0:src0 + width]
    strip[:, pl:pr] = out
    arr[y0:y1] = strip
    save(arr, n)
    print(f"L{n}: band {band} rebuilt ({len(ops)} op(s), recentred {shift:+d}px)")


def recolour(n, target_hex):
    """Re-composite ink over the exact ledger colour."""
    arr = load(n)
    bg = bg_colour(arr)
    a = ink_alpha(arr, bg)[..., None]
    target = np.array([int(target_hex[i:i + 2], 16) for i in (1, 3, 5)], float)
    save(a * WHITE + (1 - a) * target, n)
    print(f"L{n}: bg {bg.astype(int)} -> {target.astype(int)}")


def enlarge(n, y_frac, scale):
    """Scale the hero art region up in place, centred on its ink centroid."""
    arr = load(n)
    h, w = arr.shape[:2]
    bg = bg_colour(arr)
    y0, y1 = int(h * y_frac[0]), int(h * y_frac[1])
    region = arr[y0:y1]
    alpha = ink_alpha(region, bg)
    ys, xs = np.nonzero(alpha > 0.2)
    cx, cy = xs.mean(), ys.mean()
    big = np.asarray(Image.fromarray(region.astype(np.uint8)).resize(
        (int(region.shape[1] * scale), int(region.shape[0] * scale)),
        Image.LANCZOS)).astype(float)
    out = np.tile(bg, (y1 - y0, w, 1)).astype(float)
    ox = int(cx - cx * scale)
    oy = int(cy - cy * scale)
    sy0, sx0 = max(0, -oy), max(0, -ox)
    dy0, dx0 = max(0, oy), max(0, ox)
    sh = min(big.shape[0] - sy0, (y1 - y0) - dy0)
    sw = min(big.shape[1] - sx0, w - dx0)
    out[dy0:dy0 + sh, dx0:dx0 + sw] = big[sy0:sy0 + sh, sx0:sx0 + sw]
    arr[y0:y1] = out
    save(arr, n)
    print(f"L{n}: hero region y={y0}-{y1} scaled x{scale}")


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "analyse":
        analyse(int(sys.argv[2]))
