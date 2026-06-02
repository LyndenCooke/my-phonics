"""
v5 — research-grounded ad concepts via gpt-image-2 + images.edit.

Each concept maps to a specific named pattern in the May-2026 Meta/TikTok
creative research (Motion, Foxwell, Hott, Denney, Zeely):

  01_comment_reply   — Zeely 2026 top-3 TikTok format. Skeptical IG-style
                       comment overlay on top of a quiet product still.
  02_editorial_nostalgia — Ladybird / Janet & John register. UK parent 35-45
                       nostalgia trigger. Nostalgia = 100x search lift
                       (Poppi case, Motion 2025).
  03_founder_origin  — Foxwell "ugly ads" / Hott data: 72% ROAS lift,
                       90% revenue lift vs polished. Hands + handwritten
                       origin note, no face (avoids generic AI portrait).
  04_kid_demo        — Lo-fi demo / show-don't-tell. 42% of top spenders
                       (Motion 2026). Framed as a phone screenshot of a
                       captured "she just sounded it out" moment.
  05_mockumentary    — Comedy in 25% of $1M/mo spenders (Motion 2026).
                       Doc-style frame grab with deadpan subtitle.

Style brief overall: AVOID polished AI brand-ad look (burned out per Motion
2025). Each ad must read as a real photograph / real screenshot / real
editorial layout — not an obvious AI-generated marketing graphic.

Real assets fed as inputs:
  - 6 MPB cover JPGs (Drive: 04_Books_PDFs/Covers/{1..6}_1_cover.jpg)
  - Brand lockup (Drive: 01_Brand/mpb-lockup.png)
  - Real Night Light interior spread (rasterised from PDF)

Usage:
  py -3.12 generate_v5.py                  # all 5
  py -3.12 generate_v5.py 01               # just one
  py -3.12 generate_v5.py 01 03            # specific list
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
SPREAD_2_1 = ROOT / "output" / "books" / "Level2" / "_spreads_2_1" / "spread_06_07.png"

OUT_LOCAL = Path(__file__).parent
OUT_DRIVE = DRIVE / "02_Marketing" / "Mockups_v5"

COVERS = [COVERS_DIR / f"{i}_1_cover.jpg" for i in range(1, 7)]


ADS = [
    # ─────────────────────────────────────────────────────────────────────
    # 01 — COMMENT REPLY (Zeely 2026: top-3 TikTok format)
    # ─────────────────────────────────────────────────────────────────────
    {
        "slug": "01_comment_reply",
        "size": "1024x1024",
        "inputs": [COVERS[0], COVERS[1]],  # Level 1 pink + Level 2 amber
        "prompt": (
            "A photograph that LOOKS like a screenshot of an Instagram post — NOT like an "
            "advertisement. Make it look like a real social-media moment that someone scrolled "
            "past and stopped on.\n\n"

            "MAIN IMAGE: a top-down phone-camera-style flat lay on a soft cream linen surface "
            "showing two MyPhonicsBooks paperbacks — the Level 1 pink cover ('Tap! Tap! Tap!') "
            "and the Level 2 amber cover ('The Night Light') provided as inputs. A child's small "
            "hand is just visible in the lower-right corner, finger resting on the corner of one "
            "book. Soft natural daylight. Slightly imperfect framing — like a parent took it "
            "with one hand. Treat the cover images as ground truth — preserve every illustration, "
            "the coloured top and bottom bands, the title text, the 'LEVEL X' caption and the "
            "'MyPhonicsBooks' wordmark exactly. Covers must be tack-sharp.\n\n"

            "OVERLAY 1 — a single sceptical comment styled like an Instagram comment, "
            "positioned over the upper third of the photo. Small round profile circle (anonymous "
            "grey silhouette), username 'sarah_mum_of_two', and comment text reading exactly: "
            "'another phonics scam aimed at tired mums lol'. The comment looks like a real "
            "Instagram UI element — white card with soft shadow, small heart icon underneath, "
            "tiny '17m' timestamp. Use Instagram's exact visual conventions.\n\n"

            "OVERLAY 2 — directly below the comment, a single calm reply in dark sans-serif "
            "type on a translucent cream chip, reading exactly: 'no app. no subscription. £39 "
            "a year. that's it.' Smaller and quieter than the comment above it.\n\n"

            "NO logo, NO CTA button, NO headline. The whole image must read as a candid social "
            "moment, not a polished ad. Square 1:1. British English."
        ),
    },

    # ─────────────────────────────────────────────────────────────────────
    # 02 — EDITORIAL NOSTALGIA (Ladybird / Janet & John reference)
    # ─────────────────────────────────────────────────────────────────────
    {
        "slug": "02_editorial_nostalgia",
        "size": "1024x1024",
        "inputs": [COVERS[0], COVERS[1], COVERS[2]],
        "prompt": (
            "A photograph styled as a vintage British reading-primer editorial — the visual "
            "register of a 1970s Ladybird book or a Peter & Jane / Janet & John reissue. NOT a "
            "modern AI brand ad — this must look like an actual museum-style photograph of "
            "vintage children's books that happens to include the modern MyPhonicsBooks "
            "paperbacks.\n\n"

            "COMPOSITION: a centred still life on a warm aged-paper background with subtle "
            "deckle-edge texture. Three real MyPhonicsBooks paperbacks (Level 1 pink 'Tap! "
            "Tap! Tap!', Level 2 amber 'The Night Light', Level 3 green 'The Big Bike Race', "
            "all provided as inputs) arranged in a neat stepped stack at the centre, "
            "photographed slightly from above with soft directional lamplight. Beside the stack, "
            "a small folded card of cream paperboard with a hand-set typewriter-style serif "
            "inscription reading exactly two lines: line 1 (larger): 'The way Mum learned to "
            "read.', line 2 (smaller, underneath): 'Updated for kids born this century.' Lower "
            "right corner: a small embossed sticker in vintage red ink reading exactly: 'L1 — "
            "L6 · myphonicsbooks.co.uk'.\n\n"

            "TREATMENT: warm sepia-cream colour palette, gentle film-grain texture, slight "
            "vignette, the entire image carries the patina of a real 1970s educational "
            "photograph. The MyPhonicsBooks covers themselves stay in their MODERN bright "
            "colours — they're the only modern element in the frame, which is the point. "
            "Preserve every cover illustration, band colour, title, level caption and the "
            "'MyPhonicsBooks' wordmark exactly. No CTA, no headline overlay, no logo lockup, "
            "no decorative flourishes — pure editorial still life. Square 1:1."
        ),
    },

    # ─────────────────────────────────────────────────────────────────────
    # 03 — FOUNDER ORIGIN (Foxwell "ugly ads" / handwritten note + hands)
    # ─────────────────────────────────────────────────────────────────────
    {
        "slug": "03_founder_origin",
        "size": "1024x1024",
        "inputs": [COVERS[0], COVERS[1], LOGO],
        "prompt": (
            "A photograph that LOOKS like a real smartphone snap shared by a small-brand "
            "founder — NOT a polished agency ad. Slight imperfect framing, real kitchen "
            "lighting, a sense of authentic mid-thought capture.\n\n"

            "SCENE: a worn pine kitchen table, soft afternoon window light from the upper left, "
            "a half-drunk mug of tea on a coaster in the upper-right corner of the frame, a "
            "pair of adult women's hands (only hands and wrists visible, no face) holding open "
            "a notebook page. NEXT TO the notebook on the table sits one Level 1 pink "
            "MyPhonicsBooks paperback ('Tap! Tap! Tap!', provided as input) face-up, with one "
            "more Level 2 amber paperback beside it. Both covers must be exactly the input "
            "images — preserve illustration, bands, title, and 'MyPhonicsBooks' wordmark "
            "exactly.\n\n"

            "THE NOTEBOOK: open to a left-hand page filled with neat handwritten ballpoint "
            "script reading exactly the following — preserve line breaks and the British "
            "spelling:\n\n"
            "  'I'm a British teacher. I moved to Madrid in 2022.\n"
            "   My students' kids couldn't get UK phonics books here.\n"
            "   I couldn't find a single one that matched what they\n"
            "   actually teach in Reception. So I wrote them.\n"
            "   All six levels. £39 a year. — Lynden'\n\n"

            "On the right-hand notebook page, a small hand-drawn doodle of an open book and "
            "the words 'six levels' underlined twice. A single Polaroid-style print clipped to "
            "the upper-right corner of the notebook shows a faint thumbnail of the six-cover "
            "set (use the brand lockup input image as a visual cue for brand colours).\n\n"

            "TREATMENT: warm natural daylight, very slight motion blur on one hand to suggest "
            "candid capture, no studio polish, no logo lockup elsewhere in the frame, no CTA, "
            "no headline overlay. Square 1:1. Must read as 'a founder's kitchen-table moment', "
            "not as a marketing graphic."
        ),
    },

    # ─────────────────────────────────────────────────────────────────────
    # 04 — LO-FI KID DEMO (iPhone-screenshot framed "captured moment")
    # ─────────────────────────────────────────────────────────────────────
    {
        "slug": "04_kid_demo",
        "size": "1024x1024",
        "inputs": [SPREAD_2_1, COVERS[1]],  # the real Night Light spread + cover
        "prompt": (
            "A photograph framed and styled as if it were a real iPhone photo screenshot — NOT "
            "a polished ad. The visual register is 'a parent's casual phone capture they would "
            "actually share in a family WhatsApp group'.\n\n"

            "OUTER FRAME: thin iOS-style screenshot UI — a slim status bar across the top "
            "showing the time '19:42', a wifi icon and a battery icon on the right; a thin "
            "bottom UI bar with just the small grey iOS home indicator. The screenshot's "
            "wallpaper area inside the UI is the actual photo described below.\n\n"

            "PHOTO ITSELF: a candid, slightly imperfect overhead shot — taken with one hand — "
            "of a small child's RIGHT hand (only fingers and back of hand visible, no face, no "
            "arm, age suggested by hand size to be about 5) with the index finger resting "
            "directly on a printed word inside an open MyPhonicsBooks paperback. The open book "
            "shows the EXACT real interior spread provided as the input image (Night Light "
            "pp.6-7) — preserve the illustrations, the sentence text and layout exactly. The "
            "finger is pointing at the word 'dim' on the left-hand page. The closed Level 2 "
            "amber cover (provided as input) sits face-up to the left of the open book. Soft "
            "warm bedside-lamp glow.\n\n"

            "OVERLAY (caption styled like an iPhone screenshot annotation): a small "
            "hand-typed-looking text bubble in the lower-third of the photo (NOT the UI bars), "
            "in clean white type on a soft black translucent chip, reading exactly two lines: "
            "line 1: 'She just sounded out \"dim\".' line 2: 'She's 5. We started this book "
            "on Monday.'\n\n"

            "TREATMENT: slight ambient softness as if shot one-handed, no studio lighting, no "
            "logo, no CTA, no headline. The whole image reads as a real shared screenshot. "
            "Square 1:1. British English throughout."
        ),
    },

    # ─────────────────────────────────────────────────────────────────────
    # 05 — MOCKUMENTARY STILL (documentary frame + deadpan subtitle)
    # ─────────────────────────────────────────────────────────────────────
    {
        "slug": "05_mockumentary",
        "size": "1024x1024",
        "inputs": [COVERS[3], COVERS[5]],  # Level 4 blue + Level 6 teal
        "prompt": (
            "A photograph styled as a frame grab from a TV documentary — the visual register "
            "of an Apple TV+ or BBC docuseries still, NOT a marketing graphic. Slightly "
            "cinematic depth of field, natural light, deadpan composition.\n\n"

            "SCENE: a 6-year-old boy (back-of-head and 3/4 profile only, his face mostly hidden "
            "by the angle, dark short hair, wearing a plain navy school jumper) sitting at a "
            "small wooden desk in a sunlit corner of a UK living room. He's bent over a "
            "MyPhonicsBooks paperback — the Level 4 blue cover ('The Purple Purse', provided "
            "as input) lies open in front of him. The Level 6 teal cover ('The Marvellous "
            "Neighbourhood', provided as input) sits closed on the desk to his right. A small "
            "pot of crayons, a half-eaten biscuit on a plate, a tiny dinosaur figurine to the "
            "side. Cinematic shallow depth of field, sharp focus on the book and the child's "
            "hand, soft window-light bokeh in the background. Treat the cover images as ground "
            "truth — preserve illustrations, bands, titles and the 'MyPhonicsBooks' wordmark "
            "exactly.\n\n"

            "DOCUMENTARY SUBTITLE OVERLAY: at the bottom of the frame (positioned where TV "
            "documentary lower-thirds sit), in clean small white sans-serif type with a faint "
            "soft black drop-shadow for legibility, reads exactly two lines:\n"
            "  line 1 (slightly larger): 'ARLO, 6, MANCHESTER.'\n"
            "  line 2 (smaller, italic): 'Still can't say \"the\". Can spell "
            "\"tyrannosaurus\".'\n\n"

            "TREATMENT: looks like a still from a documentary, not an ad. No logo, no CTA, no "
            "headline, no marketing copy. The deadpan subtitle is the entire payload. Warm "
            "natural light. Square 1:1. British English."
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

    print(f"Generating {len(todo)} v5 ads…")
    sem = asyncio.Semaphore(3)
    await asyncio.gather(*(gen_one(client, a, sem) for a in todo))


if __name__ == "__main__":
    asyncio.run(main())
