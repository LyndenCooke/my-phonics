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


def trim(im: Image.Image) -> Image.Image:
    g = im.convert("L")
    px = g.load()
    w, h = g.size
    left, top, right, bottom = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            if px[x, y] < 243:
                left = min(left, x)
                top = min(top, y)
                right = max(right, x)
                bottom = max(bottom, y)
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

    # trace icon boxes: fragments in the left strip of section 2 (content can
    # split a box's white interior, so cluster fragments by y, then rebuild
    # any missing rows from the median pitch)
    frags = [c for c in comps
             if c[0] < 0.20 * W and 0.24 * H < c[1] < 0.78 * H
             and 0.10 * W < c[2] - c[0] < 0.28 * W and c[3] - c[1] < 0.11 * H]
    frags.sort(key=lambda c: c[1])
    rows = []
    for c in frags:
        if rows and c[1] - rows[-1][1] < 0.035 * H:
            r = rows[-1]
            rows[-1] = (min(r[0], c[0]), min(r[1], c[1]), max(r[2], c[2]), max(r[3], c[3]), 0)
        else:
            rows.append(c)
    # normalise to a uniform grid: a content-heavy image can shrink its row's
    # detected bbox, so every row gets the union x-range, the max height and
    # a fitted pitch
    if len(rows) >= 2:
        span = rows[-1][1] - rows[0][1]
        pitch = span / max(1, round(span / (0.085 * H)))
        x0 = min(r[0] for r in rows)
        x1 = max(r[2] for r in rows)
        h = max(r[3] - r[1] for r in rows)
        rows = [(x0, int(rows[0][1] + i * pitch), x1, int(rows[0][1] + i * pitch + h), 0) for i in range(n_rows)]

    # missing cards: a card's white interior is either ONE comp (image and
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
        words = [c for c in col if c[1] > 0.84 * H and c[3] - c[1] < 0.08 * H]
        imgs = [c for c in col if c not in words]
        col_data.append({
            "x0": x0, "x1": x1,
            "top": min((c[1] for c in imgs), default=None),
            "word_top": min((c[1] for c in words), default=None),
        })
    tops = sorted(d["top"] for d in col_data if d["top"] is not None)
    wts = sorted(d["word_top"] for d in col_data if d["word_top"] is not None)
    common_top = tops[len(tops) // 2] if tops else int(0.793 * H)
    common_wt = wts[len(wts) // 2] if wts else int(0.885 * H)
    cards = [(d["x0"], common_top, d["x1"], d["word_top"] or common_wt, 0) for d in col_data]
    # a card whose white interior merged into the panel comp leaves a gap in
    # the grid — rebuild missing columns from the pitch of the ones found
    n_cards = len(data["missing"])
    if 2 <= len(cards) < n_cards:
        xs = [c[0] for c in cards]
        span = xs[-1] - xs[0]
        pitch = span / max(1, round(span / (0.218 * W)))
        wmed = sorted(c[2] - c[0] for c in cards)[len(cards) // 2]
        first = xs[0] - round((xs[0] - 0.05 * W) / pitch) * pitch
        cards = [(int(first + i * pitch), common_top, int(first + i * pitch + wmed), common_wt, 0)
                 for i in range(n_cards)]

    if len(rows) != n_rows or len(cards) != len(data["missing"]):
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
