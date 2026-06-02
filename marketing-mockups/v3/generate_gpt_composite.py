"""
Hybrid ad generator:
1. gpt-image-2 generates the background (text, lockup, CTA pill) at 1024x1536
   with 6 EMPTY light-grey rounded placeholder rectangles for the covers.
2. Pillow composites the REAL cover JPGs into those placeholder positions, so
   covers are pixel-perfect (not redrawn).

Grid coords are fixed so the layout is deterministic:
  grid box (relative to 1024x1536):
    left=64, top=720, total width=896, total height=640
    3 cols x 2 rows, gap=18
    cell w = (896 - 2*18) / 3 = 286.67
    cell h = (640 - 18) / 2 = 311
  Adjusted to integers: cell ~ 287x311 then aspect-cropped to 2:3 (287x430 would
  overflow). We keep cell 287x311 and centre-crop covers to that area.
"""
import asyncio
import base64
import os
import shutil
import sys
from pathlib import Path

from dotenv import load_dotenv
from openai import AsyncOpenAI
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(r"C:\Users\ASUS\myphonicsbooks\myphonics_books")
load_dotenv(ROOT / ".env")

DRIVE = Path(r"G:\My Drive\MyPhonicsBooks")
COVERS = DRIVE / "04_Books_PDFs" / "Covers"
LOGO = DRIVE / "01_Brand" / "mpb-lockup.png"
OUT_LOCAL = Path(r"C:\Users\ASUS\myphonicsbooks\marketing-mockups\v3\gpt_composite")
OUT_DRIVE = DRIVE / "02_Marketing" / "Mockups_v3" / "gpt_composite"

COVER_FILES = [
    "1_1_cover.jpg",
    "2_1_cover.jpg",
    "3_1_cover.jpg",
    "4_1_cover.jpg",
    "5_1_cover.jpg",
    "6_1_cover.jpg",
]

# Grid layout (1024x1536 canvas)
GRID = dict(
    left=72, top=760, width=880, height=640, cols=3, rows=2, gap=20, radius=22,
)


def cell_coords():
    g = GRID
    cell_w = (g["width"] - (g["cols"] - 1) * g["gap"]) // g["cols"]
    cell_h = (g["height"] - (g["rows"] - 1) * g["gap"]) // g["rows"]
    coords = []
    for r in range(g["rows"]):
        for c in range(g["cols"]):
            x = g["left"] + c * (cell_w + g["gap"])
            y = g["top"] + r * (cell_h + g["gap"])
            coords.append((x, y, cell_w, cell_h))
    return coords


CELLS = cell_coords()


def rounded_mask(size, radius):
    mask = Image.new("L", size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius=radius, fill=255)
    return mask


def fit_cover(cover_path: Path, size):
    img = Image.open(cover_path).convert("RGB")
    iw, ih = img.size
    tw, th = size
    src_ratio = iw / ih
    dst_ratio = tw / th
    if src_ratio > dst_ratio:
        # source wider than target → crop sides
        new_w = int(ih * dst_ratio)
        x0 = (iw - new_w) // 2
        img = img.crop((x0, 0, x0 + new_w, ih))
    else:
        new_h = int(iw / dst_ratio)
        y0 = (ih - new_h) // 2
        img = img.crop((0, y0, iw, y0 + new_h))
    return img.resize(size, Image.LANCZOS)


def paste_covers(bg: Image.Image) -> Image.Image:
    out = bg.convert("RGBA").copy()
    for (x, y, w, h), cover in zip(CELLS, COVER_FILES):
        c = fit_cover(COVERS / cover, (w, h)).convert("RGBA")
        # subtle shadow
        shadow = Image.new("RGBA", (w + 40, h + 40), (0, 0, 0, 0))
        sd = ImageDraw.Draw(shadow)
        sd.rounded_rectangle([20, 28, w + 20, h + 28], radius=GRID["radius"], fill=(0, 0, 0, 90))
        shadow = shadow.filter(ImageFilter.GaussianBlur(14))
        out.alpha_composite(shadow, (x - 20, y - 20))
        mask = rounded_mask((w, h), GRID["radius"])
        out.paste(c, (x, y), mask)
    return out.convert("RGB")


BG_BASE_STYLE = (
    "Vertical 2:3 (1024x1536) Instagram ad creative for MyPhonicsBooks, "
    "a UK phonics book brand for children aged 4-8. "
    "Clean, modern, premium editorial design. Generous whitespace, "
    "bold geometric sans-serif typography (Outfit / DM Sans style). British English. "
    "\n\n"
    "AT THE TOP: place the MyPhonicsBooks brand lockup (provided as input image) "
    "horizontally centred, large enough to be clearly legible, about 90-110 pixels tall, "
    "with the open-book icon to the left of the wordmark exactly as in the input. "
    "Do not redraw it. Preserve the exact pink-and-navy wordmark.\n\n"
    "CENTRE: leave a 3-column by 2-row GRID of EMPTY light-grey (#e2e8f0) rounded rectangles "
    "as PLACEHOLDERS for book covers. The grid must sit roughly between y=760 and y=1400 of the 1536-tall canvas, "
    "and span roughly x=72 to x=952 of the 1024-wide canvas, with ~20px gaps between cells. "
    "Each placeholder is a plain rounded rectangle, no content, no text. These are NOT covers — "
    "they are blank slots that will be filled later. Do not add any illustrations or characters in them.\n\n"
    "NO OTHER PHOTOS or characters anywhere in the ad. The grid is the ONLY decorative element besides text."
)


ADS = [
    {
        "slug": "01_contrarian",
        "theme": "light",
        "headline": "Reading MORE isn't the answer.",
        "keyword": "MORE",
        "sub": "Reading at the RIGHT LEVEL is. Books one level too hard kill confidence faster than reading too little.",
        "cta": "Find their reading level",
    },
    {
        "slug": "02_belief",
        "theme": "dark",
        "headline": "Phonics isn't about SOUNDING OUT.",
        "keyword": "SOUNDING OUT",
        "sub": "It's about which words they're ALLOWED TO SEE. Every word uses only the sounds they've been taught.",
        "cta": "See how it works",
    },
    {
        "slug": "03_shocking_fact",
        "theme": "light",
        "headline": "1 IN 4 leave primary school unable to read properly.",
        "keyword": "1 IN 4",
        "sub": "The biggest hidden cause: books at home that don't match what they've been taught.",
        "cta": "Start them right",
    },
    {
        "slug": "04_educational",
        "theme": "light",
        "headline": 'What "DECODABLE" actually means.',
        "keyword": '"DECODABLE"',
        "sub": "Every word uses ONLY the sounds they've been taught. No guessing. No memorising. Just reading.",
        "cta": "See a sample book",
    },
    {
        "slug": "05_quick_fact",
        "theme": "dark",
        "headline": "EVERY UK SCHOOL teaches phonics from Reception.",
        "keyword": "EVERY UK SCHOOL",
        "sub": "But the books at home rarely match. That's why progress stalls between school and bedtime.",
        "cta": "Match books to their level",
    },
    {
        "slug": "06_question",
        "theme": "light",
        "headline": "Do you know THEIR READING LEVEL?",
        "keyword": "THEIR READING LEVEL",
        "sub": "73% of parents don't. The 3-minute assessment tells you exactly where they are.",
        "cta": "Find their level",
    },
    {
        "slug": "07_cta",
        "theme": "light",
        "headline": "3 minutes. 3 FREE BOOKS.",
        "keyword": "3 FREE BOOKS",
        "sub": "Find their exact reading level and get 3 books matched to it. Free. No login.",
        "cta": "Get the free books",
    },
]


def build_prompt(ad):
    if ad["theme"] == "dark":
        theme = ("DARK variant: deep navy background (#0f172a). White text. "
                 "Pink keyword #E84B8A. Brand lockup is rendered with the wordmark in WHITE "
                 "(open-book icon stays pink); preserve its silhouette. "
                 "Placeholder grid cells are dark slate (#1e293b).")
    else:
        theme = ("LIGHT variant: near-white background (#fdfdfd). Dark slate text (#0f172a). "
                 "Pink keyword #E84B8A. Brand lockup preserved exactly as the input. "
                 "Placeholder grid cells are light grey (#e2e8f0).")
    return (
        f"{BG_BASE_STYLE}\n\n"
        f"{theme}\n\n"
        f"HEADLINE (large, bold, ~90-110pt, 2-3 lines, positioned between the lockup and the grid): "
        f"\"{ad['headline']}\". "
        f"Render the phrase \"{ad['keyword']}\" in pink #E84B8A with a pink underline. "
        f"Render the rest in the body colour for this theme.\n\n"
        f"SUBHEADING (smaller, regular weight, ~32pt, beneath the headline, ~28px gap): "
        f"\"{ad['sub']}\"\n\n"
        f"BELOW THE GRID: a pink (#E84B8A) PILL-SHAPED CTA BUTTON with white text reading "
        f"\"{ad['cta']} →\", centred horizontally, large and tappable. "
        f"Beneath the CTA, very small grey text: 'myphonicsbooks.co.uk · UK curriculum aligned'.\n\n"
        f"All text must be spelled EXACTLY as written, no typos, no extra punctuation."
    )


async def gen_one(client: AsyncOpenAI, ad: dict, sem: asyncio.Semaphore):
    async with sem:
        prompt = build_prompt(ad)
        files = [open(LOGO, "rb")]
        try:
            print(f"[..] {ad['slug']} requesting background…")
            result = await client.images.edit(
                model="gpt-image-2",
                image=files,
                prompt=prompt,
                size="1024x1536",
                quality="high",
            )
            b64 = result.data[0].b64_json
            bg = Image.open(__import__("io").BytesIO(base64.b64decode(b64)))
            final = paste_covers(bg)
            out = OUT_LOCAL / f"{ad['slug']}.png"
            final.save(out, "PNG")
            shutil.copy2(out, OUT_DRIVE / out.name)
            print(f"[ok] {out.name}")
            return out
        except Exception as e:
            print(f"[err] {ad['slug']}: {e}", file=sys.stderr)
            return None
        finally:
            for f in files:
                f.close()


async def main():
    OUT_LOCAL.mkdir(parents=True, exist_ok=True)
    OUT_DRIVE.mkdir(parents=True, exist_ok=True)
    api_key = os.environ["OPENAI_API_KEY"]
    client = AsyncOpenAI(api_key=api_key)

    todo = ADS
    if len(sys.argv) > 1:
        wanted = set(sys.argv[1:])
        todo = [a for a in ADS if a["slug"] in wanted]

    sem = asyncio.Semaphore(3)
    await asyncio.gather(*(gen_one(client, ad, sem) for ad in todo))


if __name__ == "__main__":
    asyncio.run(main())
