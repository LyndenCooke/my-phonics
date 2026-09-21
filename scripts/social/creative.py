"""
Branded 1080x1080 Facebook creatives on white, in the MyPhonicsBooks house
style: lavender kicker pill, big navy Outfit headline, sticker + burst accents,
the day's real sheets fanned with soft shadows, four benefit icons, a green
"Download for free" button and the logo lockup.

Decorative assets (icons, bursts) are generated once by gen_icons.py into
marketing/social/assets/icons/; nothing is generated on the daily run.

  render_creative(item, pages_png, out)   worksheet day (1-3 sheets; the story's
                                          booklet cutout behind them if the pack
                                          belongs to a book)
  render_book_creative(item, out)         book day (photographic booklet cutout)
"""
import io
import os

from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ASSETS = os.path.join(ROOT, "marketing", "social", "assets")
FONT = os.path.join(ASSETS, "Outfit.ttf")
ICONS = os.path.join(ASSETS, "icons")
LOGO = os.path.join(ROOT, "public", "logo", "mpb-lockup.png")
CUTOUTS = os.path.join(ROOT, "public", "shop", "cutouts")

W, H = 1080, 1080
WHITE = (255, 255, 255)
NAVY = (30, 42, 74)
INK = (86, 94, 118)
PINK = (232, 75, 138)
YELLOW = (255, 214, 10)
GREEN = (74, 189, 109)
GREEN_INK = (46, 150, 82)
LAVENDER = (228, 218, 250)
LEVEL_COLOURS = {1: (232, 75, 138), 2: (255, 122, 89), 3: (245, 166, 35), 4: (74, 189, 109),
                 5: (91, 158, 255), 6: (167, 142, 255), 7: (154, 92, 255), 8: (43, 138, 110)}
STICKER = {1: "Perfect for early readers!", 2: "Perfect for early readers!", 3: "Perfect for early readers!",
           4: "Great for Year 1!", 5: "Great for Year 1!", 6: "For confident readers!",
           7: "For confident readers!", 8: "For confident readers!"}
BENEFITS = [("book", "Builds reading skills"), ("pencil", "Fun and engaging"),
            ("star", "Ideal for home learning"), ("heart", "Supports confidence")]


# ---------------------------------------------------------------- helpers
def font(size, weight=800):
    f = ImageFont.truetype(FONT, size)
    try:
        f.set_variation_by_axes([weight])
    except Exception:
        pass
    return f


def icon(name, height):
    """A generated icon, cropped to its content and scaled to `height`."""
    im = Image.open(os.path.join(ICONS, f"{name}.png")).convert("RGBA")
    im = im.crop(im.getbbox())
    return im.resize((int(im.width * height / im.height), height), Image.LANCZOS)


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


def _shadowed(canvas, im, xy, blur=22, offset=(0, 18), alpha=80):
    x, y = xy
    sh = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    dark = Image.new("RGBA", im.size, (30, 25, 45, 255))
    dark.putalpha(im.split()[-1].point(lambda a: int(a * alpha / 255)))
    sh.alpha_composite(dark, (x + offset[0], y + offset[1]))
    canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)))
    canvas.alpha_composite(im, (x, y))


def _pill(d, text, cy, fill, colour, size=32, pad=(44, 15)):
    f = font(size, 800)
    tw = d.textlength(text, font=f)
    w, h = tw + pad[0] * 2, size + pad[1] * 2
    x0 = (W - w) / 2
    d.rounded_rectangle([x0, cy - h / 2, x0 + w, cy + h / 2], h / 2, fill=fill)
    d.text((x0 + pad[0], cy - h / 2 + pad[1] - 4), text, font=f, fill=colour)


def _sticker(canvas, text, cx, cy, r=98, angle=-8):
    """Yellow round sticker with tilted navy text, plus two little yellow dashes."""
    pad = 24
    layer = Image.new("RGBA", (r * 2 + pad * 2, r * 2 + pad * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse([pad, pad, pad + r * 2, pad + r * 2], fill=YELLOW)
    f = font(29, 800)
    lines = _wrap(d, text, f, r * 2 - 46)
    lh = 34
    for i, ln in enumerate(lines):
        d.text((pad + r - d.textlength(ln, font=f) / 2, pad + r - len(lines) * lh / 2 + i * lh + 2), ln, font=f, fill=NAVY)
    layer = layer.rotate(angle, expand=True, resample=Image.BICUBIC)
    canvas.alpha_composite(layer, (int(cx - layer.width / 2), int(cy - layer.height / 2)))
    d = ImageDraw.Draw(canvas)
    for (x0, y0, x1, y1) in [(cx + r + 6, cy - r - 30, cx + r + 40, cy - r - 62), (cx + r + 26, cy - r + 4, cx + r + 66, cy - r - 10)]:
        d.line([(x0, y0), (x1, y1)], fill=YELLOW, width=12, joint="curve")


def _benefits(canvas, cy):
    d = ImageDraw.Draw(canvas)
    col_w = (W - 48) / 4
    f = font(24, 700)
    box = 78  # every icon sits in the same square so the captions align
    for i, (name, label) in enumerate(BENEFITS):
        x0 = 24 + i * col_w
        ic = icon(name, box)
        if ic.width > box:
            ic = ic.resize((box, int(ic.height * box / ic.width)), Image.LANCZOS)
        canvas.alpha_composite(ic, (int(x0 + (box - ic.width) / 2), int(cy - ic.height / 2)))
        lines = _wrap(d, label, f, col_w - box - 24)[:3]
        top = cy - 14.5 * len(lines)
        for j, ln in enumerate(lines):
            d.text((x0 + box + 14, top + j * 29), ln, font=f, fill=NAVY)


def _button(canvas, cy, label):
    d = ImageDraw.Draw(canvas)
    f = font(46, 800)
    tw = d.textlength(label, font=f)
    w, h = tw + 190, 96
    x0 = (W - w) / 2 - 50
    d.rounded_rectangle([x0, cy - h / 2 + 5, x0 + w, cy + h / 2 + 5], h / 2, fill=GREEN_INK)
    d.rounded_rectangle([x0, cy - h / 2, x0 + w, cy + h / 2], h / 2, fill=GREEN)
    dl = icon("download", 58)
    canvas.alpha_composite(dl, (int(x0 + 44), int(cy - dl.height / 2)))
    d = ImageDraw.Draw(canvas)
    d.text((x0 + 122, cy - h / 2 + 21), label, font=f, fill=WHITE)
    for name, x, flip in (("sparkle_green", x0 - 70, True), ("sparkle_green", x0 + w + 8, False)):
        b = icon(name, 54)
        b = b.rotate(-30 if flip else 30, expand=True, resample=Image.BICUBIC)
        canvas.alpha_composite(b, (int(x), int(cy - b.height / 2)))
    lg = Image.open(LOGO).convert("RGBA")
    lh = 54
    lg = lg.resize((int(lg.width * lh / lg.height), lh), Image.LANCZOS)
    canvas.alpha_composite(lg, (W - lg.width - 36, int(cy - lh / 2)))


def _header(canvas, item, kicker):
    d = ImageDraw.Draw(canvas)
    _pill(d, kicker, 64, LAVENDER, NAVY)
    burst = icon("sparkle", 96).rotate(25, expand=True, resample=Image.BICUBIC)
    canvas.alpha_composite(burst, (54, 150))
    _sticker(canvas, STICKER.get(item["level"], ""), W - 124, 150)
    d = ImageDraw.Draw(canvas)
    head = item.get("headline") or item["title"]
    max_w = W - 2 * 232
    hf = _fit(d, head, 90, max_w, min_size=62)
    lines = [head] if d.textlength(head, font=hf) <= max_w else _wrap(d, head, hf, max_w)[:2]
    y = 112
    for ln in lines:
        d.text(((W - d.textlength(ln, font=hf)) / 2, y), ln, font=hf, fill=NAVY)
        y += int(hf.size * 1.0)
    sub = item.get("subline", "")
    if sub:
        sf = font(33, 600)
        while d.textlength(sub, font=sf) > max_w + 60 and sf.size > 24:
            sf = font(sf.size - 2, 600)
        d.text(((W - d.textlength(sub, font=sf)) / 2, y + 10), sub, font=sf, fill=INK)
        y += 52
    return y + 26


def _cutout(item, width):
    path = os.path.join(CUTOUTS, f"r-l{item['level']}-{item.get('book_idx', 1)}.png")
    if not os.path.exists(path):
        return None
    im = Image.open(path).convert("RGBA")
    return im.resize((width, int(im.height * width / im.width)), Image.LANCZOS)


def _sheet(png, size):
    """A worksheet page as a white sheet of paper with a hairline edge."""
    page = Image.open(io.BytesIO(png)).convert("RGB").resize(size, Image.LANCZOS)
    paper = Image.new("RGBA", (size[0] + 2, size[1] + 2), (222, 222, 230, 255))
    paper.paste(page, (1, 1))
    return paper


# ---------------------------------------------------------------- renderers
def render_creative(item, pages_png: list, out_path: str):
    c = Image.new("RGBA", (W, H), WHITE + (255,))
    top = _header(c, item, "FREE PHONICS WORKSHEETS")
    band_top, band_bottom = top, H - 292
    n = max(1, min(3, len(pages_png)))

    if item.get("book_idx"):
        cut = _cutout(item, 330)
        if cut is not None:
            cut = cut.rotate(9, expand=True, resample=Image.BICUBIC)
            _shadowed(c, cut, (W - cut.width - 6, band_bottom - cut.height + 4), alpha=55)

    sheet_h = band_bottom - band_top - 44
    sheet_w = int(sheet_h / 1.414)
    spread = {1: 0, 2: 250, 3: 305}[n]
    angles = {1: [0], 2: [-4, 4], 3: [-7, 0, 7]}[n]
    cy = band_top + (band_bottom - band_top) / 2
    for i, png in enumerate(pages_png[:3]):
        sheet = _sheet(png, (sheet_w, sheet_h)).rotate(angles[i], expand=True, resample=Image.BICUBIC)
        cx = W / 2 + (i - (n - 1) / 2) * spread
        _shadowed(c, sheet, (int(cx - sheet.width / 2), int(cy - sheet.height / 2)), blur=26, offset=(0, 20), alpha=85)

    _benefits(c, H - 206)
    _button(c, H - 92, "Download for free")
    c.convert("RGB").save(out_path, quality=93)
    return out_path


def render_book_creative(item, out_path: str):
    c = Image.new("RGBA", (W, H), WHITE + (255,))
    top = _header(c, item, "FREE DECODABLE BOOK")
    band_top, band_bottom = top, H - 292
    cut = _cutout(item, 660)
    if cut is not None:
        cut = cut.rotate(-3, expand=True, resample=Image.BICUBIC)
        scale = min(1.0, (band_bottom - band_top - 10) / cut.height)
        if scale < 1:
            cut = cut.resize((int(cut.width * scale), int(cut.height * scale)), Image.LANCZOS)
        _shadowed(c, cut, (int((W - cut.width) / 2), int(band_top + (band_bottom - band_top - cut.height) / 2)), blur=30, offset=(0, 26), alpha=95)
    _benefits(c, H - 206)
    _button(c, H - 92, "Print it for free")
    c.convert("RGB").save(out_path, quality=93)
    return out_path
