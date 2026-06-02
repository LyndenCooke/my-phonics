"""
Generate Instagram ad creatives using OpenAI gpt-image-1.
Each ad takes the brand lockup + 6 book covers as INPUT images, and the model
composes the creative (9:16-ish portrait, 1024x1536) around them.

Outputs go to marketing-mockups/v3/gpt/ and mirror to Drive.
"""
import asyncio
import base64
import os
import shutil
import sys
from pathlib import Path

from dotenv import load_dotenv
from openai import AsyncOpenAI

ROOT = Path(r"C:\Users\ASUS\myphonicsbooks\myphonics_books")
load_dotenv(ROOT / ".env")

DRIVE = Path(r"G:\My Drive\MyPhonicsBooks")
COVERS = DRIVE / "04_Books_PDFs" / "Covers"
LOGO = DRIVE / "01_Brand" / "mpb-lockup.png"
OUT_LOCAL = Path(r"C:\Users\ASUS\myphonicsbooks\marketing-mockups\v3\gpt")
OUT_DRIVE = DRIVE / "02_Marketing" / "Mockups_v3" / "gpt"

COVER_FILES = [
    "1_1_cover.jpg",
    "2_1_cover.jpg",
    "3_1_cover.jpg",
    "4_1_cover.jpg",
    "5_1_cover.jpg",
    "6_1_cover.jpg",
]

BASE_STYLE = (
    "Vertical 2:3 Instagram ad creative for MyPhonicsBooks, a UK phonics book "
    "brand for children aged 4-8. Clean, modern, parent-friendly design. "
    "White or very light background (or deep navy for the dark variant), generous whitespace, "
    "premium editorial typography (bold geometric sans-serif). "
    "Place the MyPhonicsBooks brand lockup (provided as input image 1) prominently at the top, "
    "horizontally centred, at a readable size. "
    "Display the SIX book covers (input images 2-7) preserved EXACTLY as provided — do NOT redraw, "
    "restyle, or alter them. Lay them out in a clean 3-column by 2-row grid in the middle of the ad, "
    "with subtle soft shadows under each cover. "
    "Add a pink (#E84B8A) pill-shaped call-to-action button near the bottom with the CTA text in white. "
    "Below the CTA include the small text 'myphonicsbooks.co.uk · UK curriculum aligned'. "
    "British English throughout. No human faces other than what is already in the cover illustrations. "
    "Make the keyword phrase in the headline appear in pink (#E84B8A) with a pink underline."
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
    theme = (
        "DARK variant: deep navy/indigo background (#0f172a), white text, "
        "pink keyword still in #E84B8A. Brand lockup recoloured white where needed for contrast."
        if ad["theme"] == "dark"
        else "LIGHT variant: near-white background (#fdfdfd), dark slate text (#0f172a), pink keyword in #E84B8A."
    )
    return (
        f"{BASE_STYLE}\n\n"
        f"{theme}\n\n"
        f"HEADLINE (large, bold, 3-4 lines, well below the lockup): \"{ad['headline']}\". "
        f"Render the phrase \"{ad['keyword']}\" in pink (#E84B8A) with a pink underline; "
        f"render the rest in the body colour for this theme.\n"
        f"SUBHEADING (smaller, regular weight, beneath the headline): \"{ad['sub']}\"\n"
        f"CTA BUTTON TEXT (white, in a pink pill): \"{ad['cta']}\" with a right-arrow icon.\n"
        f"All text must be spelled exactly as written, with no typos and no extra words. "
        f"Use Outfit or a similar bold geometric sans-serif. British English. No urgency language."
    )


async def gen_one(client: AsyncOpenAI, ad: dict, sem: asyncio.Semaphore):
    async with sem:
        prompt = build_prompt(ad)
        files = [open(LOGO, "rb")] + [open(COVERS / f, "rb") for f in COVER_FILES]
        try:
            print(f"[..] {ad['slug']} requesting…")
            result = await client.images.edit(
                model="gpt-image-2",
                image=files,
                prompt=prompt,
                size="1024x1536",
                quality="high",
            )
            b64 = result.data[0].b64_json
            out = OUT_LOCAL / f"{ad['slug']}.png"
            out.write_bytes(base64.b64decode(b64))
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
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("OPENAI_API_KEY not found", file=sys.stderr)
        sys.exit(1)
    client = AsyncOpenAI(api_key=api_key)

    # Restrict to a single slug if passed as arg
    todo = ADS
    if len(sys.argv) > 1:
        wanted = set(sys.argv[1:])
        todo = [a for a in ADS if a["slug"] in wanted]
        if not todo:
            print(f"No ads matched {wanted}", file=sys.stderr)
            sys.exit(1)

    sem = asyncio.Semaphore(3)  # 3 in flight at a time
    await asyncio.gather(*(gen_one(client, ad, sem) for ad in todo))


if __name__ == "__main__":
    asyncio.run(main())
