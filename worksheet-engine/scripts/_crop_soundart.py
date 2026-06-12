# Crop the clipart out of the approved Sound Pack sheets (300 dpi rasters)
# into worksheet-engine/public/soundart/<grapheme>/<word>.png, keyed by the
# transcription manifest.
#
# The sheets drift a few px between packs, so instead of fixed geometry we
# DETECT the white rounded boxes (5 trace-word icon boxes at the left of
# section 2; 4 missing-word cards across section 3) on the pink panels, then
# trim inside them. Run with a grapheme argument to test one sheet and write
# a contact sheet; no argument = all sheets.
import json
import sys
from collections import deque
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent.parent
PACKS = HERE / "output" / "_research" / "soundpacks"
MANIFEST = json.loads((PACKS / "soundpack_manifest.json").read_text(encoding="utf-8"))
OUTROOT = HERE / "public" / "soundart"

DS = 4  # detection downsample (the pink box borders are only a few px wide)


def white_components(im: Image.Image):
    """Connected components of near-white pixels on the downsampled page."""
    small = im.resize((im.width // DS, im.height // DS)).convert("RGB")
    w, h = small.size
    px = small.load()
    mask = [[all(c > 233 for c in px[x, y]) for x in range(w)] for y in range(h)]
    seen = [[False] * w for _ in range(h)]
    comps = []
    for y0 in range(h):
        for x0 in range(w):
            if not mask[y0][x0] or seen[y0][x0]:
                continue
            q = deque([(x0, y0)])
            seen[y0][x0] = True
            minx, miny, maxx, maxy, n = x0, y0, x0, y0, 0
            while q:
                x, y = q.popleft()
                n += 1
                minx, miny = min(minx, x), min(miny, y)
                maxx, maxy = max(maxx, x), max(maxy, y)
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and mask[ny][nx] and not seen[ny][nx]:
                        seen[ny][nx] = True
                        q.append((nx, ny))
            comps.append((minx * DS, miny * DS, (maxx + 1) * DS, (maxy + 1) * DS, n * DS * DS))
    return comps


def word_text_top(sheet: Image.Image, x0: int, x1: int, y0: int, y1: int) -> int | None:
    """Find the top of the partial-word text at a card's bottom: the lowest
    contiguous band of NEAR-BLACK rows in the card column. The word glyphs
    are always near-black; pale clipart contributes no band at all, so the
    LAST band is the word whether it is the only band or not."""
    strip = sheet.crop((x0, y0, x1, y1)).convert("L").resize(((x1 - x0) // 4, (y1 - y0) // 4))
    px = strip.load()
    w, h = strip.size
    dark_rows = [any(px[x, y] < 120 for x in range(w)) for y in range(h)]
    bands = []
    start = None
    for y, d in enumerate(dark_rows):
        if d and start is None:
            start = y
        elif not d and start is not None:
            bands.append((start, y))
            start = None
    if start is not None:
        bands.append((start, h))
    # merge bands separated by tiny gaps (glyph holes)
    merged = []
    for b in bands:
        if merged and b[0] - merged[-1][1] < 6:
            merged[-1] = (merged[-1][0], b[1])
        else:
            merged.append(b)
    if not merged:
        return None
    top = y0 + merged[-1][0] * 4 - 14
    # the word never starts higher than ~0.85 of the page — a higher band is
    # a dark image with NO separable word band; give up
    return top if top > 0.85 * sheet.height else None


def trim(im: Image.Image) -> Image.Image:
    g = im.convert("L")
    px = g.load()
    w, h = g.size
    # row/column content profile
    row_has = [any(px[x, y] < 243 for x in range(w)) for y in range(h)]
    if not any(row_has):
        return im
    # strip a thin trace-line sliver at the bottom: a content band of a few
    # px separated from the artwork above by a clear white gap
    bottom = max(y for y in range(h) if row_has[y])
    band_top = bottom
    while band_top > 0 and row_has[band_top - 1]:
        band_top -= 1
    gap = 0
    y = band_top - 1
    while y >= 0 and not row_has[y]:
        gap += 1
        y -= 1
    # a line sliver is thin AND spans most of the crop width — artwork parts
    # (a chin, a dot) are narrow, so they survive
    band_h = bottom - band_top + 1
    if 0 < band_h <= 70 and gap >= 6 and y >= 0:
        cols = sum(1 for x in range(w) if any(px[x, yy] < 243 for yy in range(band_top, bottom + 1)))
        if cols >= 0.55 * w:
            bottom = max(yy for yy in range(y + 1) if row_has[yy])
    top = min(y for y in range(h) if row_has[y])
    left = min(x for x in range(w) if any(px[x, y] < 243 for y in range(top, bottom + 1)))
    right = max(x for x in range(w) if any(px[x, y] < 243 for y in range(top, bottom + 1)))
    if right <= left or bottom <= top:
        return im
    pad = 8
    return im.crop((max(0, left - pad), max(0, top - pad), min(w, right + pad), min(h, bottom + pad)))


def crop_sheet(g: str, contact: bool = False) -> bool:
    sheet = Image.open(PACKS / f"hi_sound_{g}.png").convert("RGB")
    W, H = sheet.size
    comps = white_components(sheet)

    data = MANIFEST[g]
    n_rows = len(data["trace_words"])

    # trace rows: anchor on BOTH the left icon boxes AND the right trace-text
    # boxes (an icon whose artwork floods its box can vanish from detection —
    # the m sheet lost its first row this way and every image shifted one
    # word). Cluster all section-2 boxes by y; each cluster is one row.
    # h > 0.04H drops the thin slivers the traced grey text cuts off the
    # bottom of each right box
    left = [c for c in comps
            if c[0] < 0.20 * W and 0.24 * H < c[1] < 0.72 * H
            and 0.10 * W < c[2] - c[0] < 0.28 * W and 0.04 * H < c[3] - c[1] < 0.11 * H]
    right = [c for c in comps
             if 0.20 * W < c[0] < 0.45 * W and 0.24 * H < c[1] < 0.72 * H
             and 0.20 * W < c[2] - c[0] < 0.36 * W and 0.04 * H < c[3] - c[1] < 0.11 * H]
    bands: list[list[tuple]] = []
    for c in sorted(left + right, key=lambda c: c[1]):
        if bands and c[1] - min(b[1] for b in bands[-1]) < 0.035 * H:
            bands[-1].append(c)
        else:
            bands.append([c])
    # the icon x-range is shared by every row; row y comes from each band
    lx = [c for b in bands for c in b if c[0] < 0.20 * W]
    x0 = min((c[0] for c in lx), default=int(0.055 * W))
    x1 = max((c[2] for c in lx), default=int(0.235 * W))
    h = max((c[3] - c[1] for c in lx), default=int(0.075 * H))
    ys = [min(c[1] for c in b) for b in bands]

    # fit the n_rows grid to the detected bands BY INDEX: a missed first row
    # plus a phantom band below (the section-3 header) otherwise shifts every
    # image one word down (the b/m sheets failed exactly this way). Choose the
    # grid offset that keeps all rows inside section 2 and matches the most
    # detected bands.
    diffs = [b - a for a, b in zip(ys, ys[1:]) if (b - a) < 0.11 * H]
    pitch = sorted(diffs)[len(diffs) // 2] if diffs else 0.085 * H
    best = None
    for k in range(3):
        y0g = ys[0] - k * pitch
        grid = [y0g + i * pitch for i in range(n_rows)]
        if grid[0] < 0.25 * H or grid[-1] > 0.715 * H:
            continue
        matched = sum(1 for y in ys if any(abs(y - gy) < 0.25 * pitch for gy in grid))
        if best is None or matched > best[0]:
            best = (matched, grid)
    grid = best[1] if best else [ys[0] + i * pitch for i in range(n_rows)]
    rows = [(x0, int(gy), x1, int(gy) + h, 0) for gy in grid]

    # missing cards, two template variants:
    #   1x4 row of slim cards, OR a 2x2 grid of bigger cards (ff/v/y sheets).
    # Try the 2x2 grid first: whole-card boxes detected directly.
    n_missing = len(data["missing"])
    grid_cards = [c for c in comps
                  if c[1] > 0.70 * H and 0.13 * W < c[2] - c[0] < 0.28 * W
                  and 0.08 * H < c[3] - c[1] < 0.20 * H]
    # across every template the card artwork ends above 0.885H and the word
    # text starts below it — one fixed cut, no detection
    CARD_CUT = int(0.886 * H)
    if len(grid_cards) == n_missing and n_missing >= 4:
        grid_cards.sort(key=lambda c: (round(c[1] / (0.06 * H)), c[0]))
        cards = [(c[0], c[1], c[2], CARD_CUT, 0) for c in grid_cards]
        return finish(g, sheet, rows, cards, data, contact)

    # 1x4 variant: a card's white interior is either ONE comp (image and
    # word area connected) or split by the artwork into fragments, with the
    # word area at the bottom its own comp. Cluster all card-strip comps by
    # x column, then take the image area = column top down to the word area.
    card_frags = [c for c in comps
                  if c[1] > 0.70 * H and 0.13 * W < c[2] - c[0] < 0.26 * W]
    card_frags.sort(key=lambda c: c[0])
    cols: list[list[tuple]] = []
    for c in card_frags:
        if cols and c[0] - cols[-1][0][0] < 0.08 * W:
            cols[-1].append(c)
        else:
            cols.append([c])
    # all cards share a top edge and a word-area line; a column whose artwork
    # swallowed its white space borrows the common values from its neighbours
    col_data = []
    for col in cols:
        x0 = min(c[0] for c in col)
        x1 = max(c[2] for c in col)
        # word boxes sit at the very bottom of the card — a tighter y bound
        # stops mid-card image fragments masquerading as the word area
        words = [c for c in col if c[1] > 0.87 * H and c[3] - c[1] < 0.06 * H]
        imgs = [c for c in col if c not in words]
        col_data.append({
            "x0": x0, "x1": x1,
            "top": min((c[1] for c in imgs), default=None),
            "word_top": min((c[1] for c in words), default=None),
        })
    tops = sorted(d["top"] for d in col_data if d["top"] is not None)
    common_top = tops[len(tops) // 2] if tops else int(0.793 * H)
    cards = [(d["x0"], common_top, d["x1"], CARD_CUT, 0) for d in col_data]
    # a card whose white interior merged into the panel comp leaves a gap in
    # the grid — rebuild missing columns from the pitch of the ones found
    n_cards = len(data["missing"])
    if 2 <= len(cards) < n_cards:
        xs = [c[0] for c in cards]
        span = xs[-1] - xs[0]
        pitch = span / max(1, round(span / (0.218 * W)))
        wmed = sorted(c[2] - c[0] for c in cards)[len(cards) // 2]
        first = xs[0] - round((xs[0] - 0.05 * W) / pitch) * pitch
        cards = [(int(first + i * pitch), common_top, int(first + i * pitch + wmed), CARD_CUT, 0)
                 for i in range(n_cards)]

    return finish(g, sheet, rows, cards, data, contact)


def finish(g: str, sheet: Image.Image, rows, cards, data, contact: bool) -> bool:
    if len(rows) != len(data["trace_words"]) or len(cards) != len(data["missing"]):
        print(f"{g}: DETECTION MISMATCH rows={len(rows)} cards={len(cards)}")
        return False

    outdir = OUTROOT / g
    outdir.mkdir(parents=True, exist_ok=True)
    tiles = []
    inset = 10
    for (x0, y0, x1, y1, _), word in zip(rows, data["trace_words"]):
        im = trim(sheet.crop((x0 + inset, y0 + inset, x1 - inset, y1 - inset)))
        im.save(outdir / f"{word.replace(' ', '_')}.png")
        tiles.append(im)
    for (x0, y0, x1, y1, _), miss in zip(cards, data["missing"]):
        # extra bottom inset keeps the card's write line out of the crop
        im = trim(sheet.crop((x0 + inset, y0 + inset, x1 - inset, y1 - 30)))
        im.save(outdir / f"{miss['word'].replace(' ', '_')}.png")
        tiles.append(im)

    if contact:
        cw = max(t.width for t in tiles) + 10
        ch = max(t.height for t in tiles) + 10
        board = Image.new("RGB", (cw * len(tiles), ch), "white")
        for i, t in enumerate(tiles):
            board.paste(t, (i * cw + 5, 5))
        board.save(PACKS / f"contact_{g}.png")
        print("contact sheet:", PACKS / f"contact_{g}.png")
    return True


def main() -> None:
    if len(sys.argv) > 1:
        crop_sheet(sys.argv[1], contact=True)
        return
    bad = [g for g in sorted(MANIFEST) if not crop_sheet(g)]
    print("done; mismatches:", bad or "none")


if __name__ == "__main__":
    main()
