"""
Split-screen comparison ads via gpt-image-2 + images.edit.

Two ads, both 1:1 square (1080-style, fits IG feed + cropable to story):

  01_split_money — Phonics tutor stack (worksheets + books, line-item prices
                   adding up) vs MyPhonicsBooks structured system (6 covers +
                   worksheet, single yearly price). Real covers fed as input.

  02_split_time  — 2 hrs/day chaotic worksheets pile vs 10 min/day phone with
                   a MyPhonicsBooks-branded widget tile on its home screen.
                   Real brand lockup fed as input so the widget icon is the
                   actual brand mark, not an AI invention.

Style brief from the brand owner: "Very simple. Not too much on the page.
Clear message. The split does the work."

Usage:
  py -3.12 generate_split_ads.py                 # both
  py -3.12 generate_split_ads.py 01              # just money
  py -3.12 generate_split_ads.py 02              # just time
"""
import asyncio
import base64
import io
import os
import shutil
import sys
from pathlib import Path

from dotenv import load_dotenv
from openai import AsyncOpenAI
from PIL import Image

ROOT = Path(r"C:\Users\ASUS\myphonicsbooks\myphonics_books")
load_dotenv(ROOT / ".env")

DRIVE = Path(r"G:\My Drive\MyPhonicsBooks")
COVERS_DIR = DRIVE / "04_Books_PDFs" / "Covers"
LOGO = DRIVE / "01_Brand" / "mpb-lockup.png"

OUT_LOCAL = Path(r"C:\Users\ASUS\myphonicsbooks\marketing-mockups\v4\split_ads")
OUT_DRIVE = DRIVE / "02_Marketing" / "Mockups_v4" / "split_ads"

COVERS = [COVERS_DIR / f"{i}_1_cover.jpg" for i in range(1, 7)]


ADS = [
    {
        "slug": "01_split_money",
        "size": "1024x1024",
        "inputs": COVERS + [LOGO],
        "prompt": (
            "A square 1:1 editorial advertisement, split exactly down the middle by a thin clean "
            "vertical hairline. Two halves compared, photographed top-down as a flat-lay.\n\n"

            "LEFT HALF — slightly desaturated, cool light, mood is dull and a bit overwhelming. "
            "A small grey label at the top reads 'A PHONICS TUTOR'. Below the label, a tidy but "
            "crowded flat-lay on a neutral beige surface showing: a stack of three generic "
            "blue-and-white phonics workbooks (different titles, no MyPhonicsBooks branding), "
            "four photocopied A4 phonics worksheets fanned beside the stack, and three small "
            "kraft-paper price tags on string draped over the items reading exactly '£15', '£28' "
            "and '£22'. At the bottom of the left half, in small handwritten marker on a torn "
            "scrap of paper, reads exactly '+ tuition £40/hr'. Lighting is flat and a touch grey.\n\n"

            "RIGHT HALF — bright, warm, soft daylight from the upper-left, cream paper surface, "
            "mood is calm and confident. A small pink label at the top reads exactly "
            "'MYPHONICSBOOKS'. Below it, the SIX real MyPhonicsBooks paperback covers (Levels 1 "
            "through 6) provided as inputs, fanned in a neat overlapping arc with one printable "
            "phonics worksheet tucked under the arc so a corner of it shows. Below the books, a "
            "single small kraft-paper price tag on string reads exactly '£39 / year'. Beneath "
            "that, in tiny clean dark-grey sans-serif type, reads exactly 'all six levels · "
            "books + worksheets · used forever'. Treat the cover images as ground truth: preserve "
            "every illustration, the coloured top and bottom bands, the title text, the "
            "'LEVEL X · ...' caption in the top band, and the 'MyPhonicsBooks' wordmark on every "
            "cover. Do not invent new covers. Do not change titles. Covers must be tack-sharp.\n\n"

            "OUTPUT: 1024x1024 square, 35mm flat-lay product-photography feel, shallow depth of "
            "field, sharp focus on the books and tags. All text must be British English and "
            "perfectly spelled. No other text, no logos, no decorative flourishes, no CTA pill, "
            "no headline across the top — the split does the work."
        ),
    },
    {
        "slug": "02_split_time",
        "size": "1024x1024",
        "inputs": [LOGO] + COVERS[:3],
        "prompt": (
            "A square 1:1 editorial advertisement, split exactly down the middle by a thin clean "
            "vertical hairline. Two halves compared.\n\n"

            "LEFT HALF — slightly desaturated, cool light, dull mood. A small grey label at the "
            "top reads exactly '2 HOURS A DAY'. Below the label, a top-down flat-lay on a neutral "
            "beige desk showing: an open thick generic English-grammar workbook, three "
            "photocopied phonics worksheets stacked askew, a printed alphabet chart, a yellow "
            "pencil, and a small round analogue clock at the lower-right showing exactly two "
            "hours. In small grey handwritten marker beneath the pile, reads exactly: "
            "'random · unclear progress · screen + paper'. Lighting flat, slightly cool.\n\n"

            "RIGHT HALF — bright, clean, warm soft daylight, cream linen background, calm and "
            "modern mood. A small pink label at the top reads exactly '10 MINUTES A DAY'. Below "
            "the label, centred in the right half: a single modern smartphone (edge-to-edge "
            "screen, no visible Apple/Samsung logo, in a soft natural matte case) lying flat, "
            "shown straight-on from directly above. The phone's home screen shows a soft cream "
            "wallpaper, and in the CENTRE of the home screen sits ONE large rounded-square "
            "iOS-style widget tile (medium-large size, occupying about 60% of the screen width). "
            "The widget tile background is solid bright pink (#E84B8A). Inside the widget tile, "
            "centred, the MyPhonicsBooks open-book icon from the brand lockup input is rendered "
            "large and white. Under the icon, inside the widget, in clean white sans-serif type, "
            "reads exactly two lines: line 1 'MyPhonicsBooks', line 2 (smaller) '10 min today'. "
            "Use the brand-lockup input image as ground truth for the widget icon mark. No "
            "other phone-screen content visible — no status bar text, no app icons, just the "
            "single widget on the cream wallpaper. Below the phone, in small dark-grey sans-serif "
            "type, reads exactly: 'personalised · focused · gap targeting'.\n\n"

            "OUTPUT: 1024x1024 square, premium product-photography feel, sharp focus on the "
            "phone widget and the desk pile. All text must be British English and perfectly "
            "spelled. No other text, no logos elsewhere, no CTA pill, no headline across the "
            "top — the split does the work."
        ),
    },
]


def open_input_images(paths):
    return [open(p, "rb") for p in paths]


async def gen_one(client: AsyncOpenAI, ad: dict, sem: asyncio.Semaphore):
    async with sem:
        files = open_input_images(ad["inputs"])
        try:
            print(f"[..] {ad['slug']} requesting (inputs={len(files)})…")
            result = await client.images.edit(
                model="gpt-image-2",
                image=files,
                prompt=ad["prompt"],
                size=ad["size"],
                quality="high",
            )
            b64 = result.data[0].b64_json
            img = Image.open(io.BytesIO(base64.b64decode(b64))).convert("RGB")
            out = OUT_LOCAL / f"{ad['slug']}.png"
            img.save(out, "PNG")
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
    client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])

    todo = ADS
    if len(sys.argv) > 1:
        wanted = set(sys.argv[1:])
        todo = [a for a in ADS if a["slug"] in wanted
                or a["slug"].split("_")[0] in wanted]
    if not todo:
        print("Nothing to generate", file=sys.stderr); sys.exit(1)

    print(f"Generating {len(todo)} split-screen ads…")
    sem = asyncio.Semaphore(2)
    await asyncio.gather(*(gen_one(client, a, sem) for a in todo))


if __name__ == "__main__":
    asyncio.run(main())
