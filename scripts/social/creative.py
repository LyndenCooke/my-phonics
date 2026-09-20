"""
Branded 1080x1080 Facebook creative for a day's worksheets: up to three first
pages side by side in white cards on the MyPhonicsBooks cream, with a level
pill, the pack name, each sheet's name, a "Today:" line and the logo lockup.

    from creative import render_creative
    render_creative(item, page_pixmap_png_bytes, out_path)
"""
import io
import os

from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FONT = os.path.join(ROOT, "marketing", "social", "assets", "Outfit.ttf")
LOGO = os.path.join(ROOT, "public", "logo", "mpb-lockup.png")

W, H = 1080, 1080
CREAM = (255, 247, 238)
NAVY = (30, 42, 74)
INK = (90, 96, 112)
PINK = (232, 75, 138)
LEVEL_COLOURS = {1: (232, 75, 138), 2: (255, 122, 89), 3: (245, 166, 35), 4: (74, 189, 109),
                 5: (91, 158, 255), 6: (167, 142, 255), 7: (154, 92, 255), 8: (43, 138, 110)}


def font(size, weight=800):
    f = ImageFont.truetype(FONT, size)
    try:
        f.set_variation_by_axes([weight])
    except Exception:
        pass
    return f


def _rounded(im, radius):
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, im.width - 1, im.height - 1], radius, fill=255)
    out = im.convert("RGBA")
    out.putalpha(mask)
    return out


def _shadow(canvas, box, radius=28):
    x0, y0, x1, y1 = box
    sh = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle([x0, y0 + 14, x1, y1 + 14], radius, fill=(30, 20, 40, 60))
    canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(22)))


def _blobs(canvas, colour):
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for (cx, cy, r) in [(-40, H * 0.55, 260), (W + 40, H * 0.25, 220), (W * 0.9, H + 40, 240)]:
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=colour + (46,))
    canvas.alpha_composite(layer.filter(ImageFilter.GaussianBlur(40)))


def _fit(d, text, size, max_w, min_size=40):
    f = font(size)
    while d.textlength(text, font=f) > max_w and size > min_size:
        size -= 3
        f = font(size)
    return f


def _wrap(d, text, f, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if d.textlength(t, font=f) <= max_w:
            cur = t
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def render_creative(item, pages_png: list, out_path: str):
    """pages_png: 1-3 PNG byte strings, one per worksheet, shown side by side."""
    colour = LEVEL_COLOURS.get(item["level"], PINK)
    c = Image.new("RGBA", (W, H), CREAM + (255,))
    _blobs(c, colour)
    d = ImageDraw.Draw(c)

    pill = f"FREE WORKSHEETS  ·  LEVEL {item['level']} OF 8  ·  {item.get('level_name', '').upper()}"
    pf = font(26, 700)
    pw = d.textlength(pill, font=pf) + 56
    px = (W - pw) / 2
    d.rounded_rectangle([px, 40, px + pw, 40 + 52], 26, fill=colour)
    d.text((px + 28, 40 + 11), pill, font=pf, fill="white")

    head = item.get("headline") or item["title"]
    hf = _fit(d, head, 66, W - 120)
    d.text(((W - d.textlength(head, font=hf)) / 2, 108), head, font=hf, fill=NAVY)
    sub = item.get("subline", "")
    sf = font(30, 600)
    if sub:
        d.text(((W - d.textlength(sub, font=sf)) / 2, 108 + hf.size + 8), sub, font=sf, fill=INK)

    # Pages side by side in white cards, names underneath
    n = max(1, len(pages_png))
    top = 108 + hf.size + 56
    bottom = H - 235
    gap = 24
    card_w = (W - 80 - gap * (n - 1)) / n
    pad = 8
    names = [s["name"] for s in item.get("sheets", [])] or [item["title"]]
    for i, png in enumerate(pages_png):
        page = Image.open(io.BytesIO(png)).convert("RGB")
        scale = min((card_w - 2 * pad) / page.width, (bottom - top - 60 - 2 * pad) / page.height)
        page = page.resize((int(page.width * scale), int(page.height * scale)), Image.LANCZOS)
        cw, ch = page.width + 2 * pad, page.height + 2 * pad
        cx = int(40 + i * (card_w + gap) + (card_w - cw) / 2)
        cy = int(top + (bottom - 60 - top - ch) / 2)
        _shadow(c, (cx, cy, cx + cw, cy + ch), 22)
        ImageDraw.Draw(c).rounded_rectangle([cx, cy, cx + cw, cy + ch], 22, fill="white")
        c.alpha_composite(_rounded(page, 14), (cx + pad, cy + pad))
        d = ImageDraw.Draw(c)
        label = names[i] if i < len(names) else ""
        lf = _fit(d, label, 26, card_w - 10, min_size=18)
        d.text((cx + cw / 2 - d.textlength(label, font=lf) / 2, cy + ch + 14), label, font=lf, fill=NAVY)

    # "Today:" line
    d = ImageDraw.Draw(c)
    of_label = font(30, 800)
    of_body = font(30, 500)
    label = "Today: "
    body_lines = _wrap(d, item.get("objective", ""), of_body, W - 140 - d.textlength(label, font=of_label))
    y = H - 205
    if body_lines:
        first = body_lines[0]
        total = d.textlength(label, font=of_label) + d.textlength(first, font=of_body)
        x = (W - total) / 2
        d.text((x, y), label, font=of_label, fill=colour)
        d.text((x + d.textlength(label, font=of_label), y), first, font=of_body, fill=NAVY)
        for ln in body_lines[1:2]:
            y += 40
            d.text(((W - d.textlength(ln, font=of_body)) / 2, y), ln, font=of_body, fill=NAVY)

    lg = Image.open(LOGO).convert("RGBA")
    lh = 72
    lg = lg.resize((int(lg.width * lh / lg.height), lh), Image.LANCZOS)
    c.alpha_composite(lg, (int((W - lg.width) / 2), H - 108))
    c.convert("RGB").save(out_path, quality=90)
    return out_path
