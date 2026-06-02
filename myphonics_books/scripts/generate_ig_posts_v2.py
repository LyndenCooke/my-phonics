"""Generate Instagram posts using gpt-image-1 multi-image edit so the model
itself composes the layout from the real book covers + real logo as references.

Test single post via:
    py -3.12 scripts/generate_ig_posts_v2.py --only 01
"""
from __future__ import annotations

import argparse
import base64
import io
import os
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI
from PIL import Image

ROOT = Path(r"C:\Users\ASUS\myphonicsbooks\myphonics_books")
load_dotenv(ROOT / ".env")

OUT_DIR = ROOT / "output/instagram_posts_v2"
OUT_DIR.mkdir(parents=True, exist_ok=True)
ASSETS = ROOT / "output/instagram_posts/_assets"
LOGO = ROOT / "phonics-fun-hub/public/logo/mpb-lockup.png"

W, H = 1080, 1350  # final Instagram 4:5 portrait

# Book covers we have (rasterised, 1680x2380, real branded cover art)
COVERS = {
    "L1": ASSETS / "cover_L1_3.png",
    "L2": ASSETS / "cover_L2_1.png",
    "L3": ASSETS / "cover_L3_3.png",
    "L4": ASSETS / "cover_L4_1.png",
    "L5": ASSETS / "cover_L5_1.png",
    "L6": ASSETS / "cover_L6_4.png",
}


def downscale(path: Path, max_dim: int = 1024) -> bytes:
    """Downscale an image to fit max_dim and return PNG bytes (smaller uploads)."""
    im = Image.open(path).convert("RGBA")
    if max(im.size) > max_dim:
        scale = max_dim / max(im.size)
        im = im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, format="PNG", optimize=True)
    buf.seek(0)
    return buf.getvalue()


def open_as_upload(path: Path, name: str, max_dim: int = 1024) -> tuple[str, bytes, str]:
    """Return a (filename, bytes, mimetype) tuple compatible with the OpenAI files API."""
    return (name, downscale(path, max_dim), "image/png")


def fit_to_post(im: Image.Image) -> Image.Image:
    """Resize gpt-image-1 output (1024x1536, 2:3) to 1080x1350 (4:5) by scaling to height
    then padding sides with the edge colour — this preserves all content the model rendered.
    """
    scale = H / im.height
    new_w = int(im.width * scale)
    im2 = im.resize((new_w, H), Image.LANCZOS)
    if new_w >= W:
        x = (new_w - W) // 2
        return im2.crop((x, 0, x + W, H))
    # need to pad sides — sample edge colour
    left_px = im2.getpixel((0, H // 2))
    right_px = im2.getpixel((new_w - 1, H // 2))
    pad = (left_px[0] + right_px[0]) // 2, (left_px[1] + right_px[1]) // 2, (left_px[2] + right_px[2]) // 2
    canvas = Image.new("RGB", (W, H), pad)
    canvas.paste(im2, ((W - new_w) // 2, 0))
    return canvas


POSTS = {
    "01_hero_all_six": {
        "levels": ["L1", "L2", "L3", "L4", "L5", "L6"],
        "prompt": (
            "Design a polished modern Instagram post for the children's phonics book brand "
            "'My Phonics Books'. Canvas is portrait. IMPORTANT: keep ALL content (logo, "
            "headline, every book cover) inside the centre 4:5 region of the canvas — leave "
            "wide blank margins at the top and bottom (at least 12% top, 12% bottom) so nothing "
            "is clipped when cropped to 4:5.\n\n"
            "RULES FOR REFERENCE IMAGES — read carefully:\n"
            "1. The first reference image is the 'My Phonics Books' lockup logo. Reproduce it "
            "PIXEL-PERFECT — do not redraw the open-book mark, do not change the wordmark, do "
            "not change colours or spacing. Treat it as a sticker you are pasting onto the canvas.\n"
            "2. The next six reference images are existing finished book covers. Each one is a "
            "complete designed cover with a coloured banner at the top showing 'LEVEL X · NAME', "
            "an illustration in the middle, and a coloured banner at the bottom with the book "
            "title and subtitle. Reproduce each one PIXEL-PERFECT — do NOT change the title text, "
            "do NOT redraw the characters, do NOT alter the colour bands. Treat each cover as a "
            "sticker that you are placing onto the canvas.\n\n"
            "LAYOUT:\n"
            "- Logo: centred at the top of the safe 4:5 area, ~32% of canvas width.\n"
            "- Headline directly below logo: 'Decodable phonics books.' — bold modern "
            "sans-serif, deep navy #1f2937, large.\n"
            "- Subhead below headline: 'Print at home. Read tonight.' — smaller, semibold, "
            "indigo #312e81.\n"
            "- Below the subhead: the six covers in a 3-columns x 2-rows grid with even gaps. "
            "Add a gentle soft drop shadow under each cover.\n"
            "- Background: very soft hand-painted cream and pale blush watercolour wash, subtle, "
            "with faint pastel blooms in the four corners. Lots of negative space.\n\n"
            "ABSOLUTELY DO NOT: invent new book covers, draw extra characters, add extra letters "
            "or numbers, add stars/sparkles/scribbles, redraw the supplied logo, redraw the "
            "supplied covers, change cover titles, or apply a painterly filter to the covers."
        ),
    },
    "04_spotlight_L3": {
        "levels": ["L3"],
        "prompt": (
            "Design a polished modern Instagram post (vertical portrait, 4:5) for 'My Phonics Books'.\n\n"
            "USE THE SUPPLIED IMAGES EXACTLY — do not redraw them. Place the lockup logo at the top "
            "centred (small, ~30% width). Place the supplied book cover ('The Dream Team, Level 3') "
            "as a large hero element in the centre, faithfully showing the original artwork, green "
            "colour bands and title text. Cast a soft drop shadow under it.\n\n"
            "Above the cover, place a small pill-shaped chip with the text 'LEVEL 3 · NEW SPELLINGS' "
            "in white on the brand green (#22C55E).\n"
            "Below the cover, large bold navy headline: 'Magic-e words, new spellings.'\n"
            "Beneath that, smaller indigo line: 'When sh, ch and th aren't enough anymore.'\n\n"
            "Background: very pale mint watercolour wash, lots of empty space, gentle and friendly.\n\n"
            "Premium, airy, modern children's brand aesthetic. No extra books, no extra characters, "
            "no extra letters or numbers anywhere on the canvas."
        ),
    },
}


def build(post_id: str) -> Path:
    spec = POSTS[post_id]
    client = OpenAI()

    uploads = [open_as_upload(LOGO, "logo.png", max_dim=800)]
    for lvl in spec["levels"]:
        uploads.append(open_as_upload(COVERS[lvl], f"cover_{lvl}.png", max_dim=900))

    print(f"[{post_id}] sending {len(uploads)} reference image(s) to gpt-image-1...")
    resp = client.images.edit(
        model="gpt-image-2",
        image=uploads,
        prompt=spec["prompt"],
        size="1024x1536",
        quality="high",
        n=1,
    )
    raw = Image.open(io.BytesIO(base64.b64decode(resp.data[0].b64_json))).convert("RGB")
    final = fit_to_post(raw)
    out = OUT_DIR / f"{post_id}.png"
    final.save(out, optimize=True)
    print(f"  -> {out}  {final.size}")
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="post id, e.g. 01_hero_all_six or just 01")
    args = ap.parse_args()
    if args.only:
        match = [k for k in POSTS if k.startswith(args.only) or args.only == k]
        if not match:
            raise SystemExit(f"no matching post for --only {args.only}; have {list(POSTS)}")
        for k in match:
            build(k)
    else:
        for k in POSTS:
            build(k)


if __name__ == "__main__":
    main()
