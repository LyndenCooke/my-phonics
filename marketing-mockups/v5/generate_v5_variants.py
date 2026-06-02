"""
v5 variants — 3 iterations each on the three strongest v5 patterns.

Comment Reply (Zeely 2026 top-3): each variant tests a different objection.
Kid Demo (Motion 2026 42% of top spenders): each captures a different "moment".
Mockumentary (Motion 2026 comedy lift): each is a different deadpan joke.

All inherit v5's anti-polished-AI register — must read as real photo / screenshot /
documentary still, never as a marketing graphic.

Usage:
  py -3.12 generate_v5_variants.py              # all 9
  py -3.12 generate_v5_variants.py 01b 04c      # specific
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


# ─────────────────────────────────────────────────────────────────────────
# Shared prompt fragments — keep the visual register consistent.
# ─────────────────────────────────────────────────────────────────────────
COVER_FIDELITY = (
    "Treat the cover images provided as inputs as ground truth — preserve every "
    "illustration, the coloured top and bottom bands, the title text, the "
    "'LEVEL X' caption in the top band, and the 'MyPhonicsBooks' wordmark "
    "exactly. Covers must be tack-sharp and perfectly legible."
)


# ─────────────────────────────────────────────────────────────────────────
# COMMENT REPLY variants — each tests a different objection.
# ─────────────────────────────────────────────────────────────────────────
def comment_reply_prompt(
    *,
    cover_bullet: str,
    username: str,
    comment: str,
    reply: str,
    timestamp: str,
) -> str:
    return (
        "A photograph that LOOKS like a screenshot of an Instagram post — NOT an "
        "advertisement. Make it look like a real social-media moment someone "
        "scrolled past and stopped on.\n\n"

        f"MAIN IMAGE: a top-down phone-camera-style flat lay on a soft cream linen "
        f"surface showing {cover_bullet}. A child's small hand is just visible in "
        "the lower-right corner. Soft natural daylight, slightly imperfect framing "
        f"as if a parent took it one-handed. {COVER_FIDELITY}\n\n"

        "OVERLAY 1 — a single sceptical comment styled as a real Instagram comment "
        "card in the upper third of the photo. Small round anonymous grey profile "
        f"silhouette, username '{username}', comment text reading exactly: "
        f"'{comment}'. White card with soft shadow, small heart icon underneath, "
        f"tiny '{timestamp}' timestamp. Use Instagram's exact visual conventions.\n\n"

        "OVERLAY 2 — directly below the comment, a single calm reply in dark "
        "sans-serif type on a translucent cream chip, reading exactly: "
        f"'{reply}'. Quieter than the comment above.\n\n"

        "NO logo, NO CTA button, NO headline. The whole image must read as a "
        "candid social moment, not a polished ad. Square 1:1. British English."
    )


COMMENT_REPLY_VARIANTS = [
    {
        "slug": "01b_comment_reply_hates_books",
        "inputs": [COVERS[0], COVERS[1]],  # L1 pink + L2 amber
        "prompt_kwargs": dict(
            cover_bullet=(
                "two MyPhonicsBooks paperbacks (the Level 1 pink cover 'Tap! Tap! "
                "Tap!' and the Level 2 amber cover 'The Night Light' provided as "
                "inputs) lying slightly overlapped"
            ),
            username="rach.parenting",
            comment="but my kid hates books. this won't work.",
            reply="16 pages. real story. give it 4 nights.",
            timestamp="23m",
        ),
    },
    {
        "slug": "01c_comment_reply_reading_eggs",
        "inputs": [COVERS[2], COVERS[3]],  # L3 green + L4 blue
        "prompt_kwargs": dict(
            cover_bullet=(
                "two MyPhonicsBooks paperbacks (the Level 3 green cover 'The Big "
                "Bike Race' and the Level 4 blue cover 'The Purple Purse' provided "
                "as inputs) photographed at a slight angle"
            ),
            username="dadof3_uk",
            comment="isn't this just Reading Eggs but more expensive?",
            reply="reading eggs: £80/year forever. this: £39 once. then £0.",
            timestamp="1h",
        ),
    },
    {
        "slug": "01d_comment_reply_all_the_same",
        "inputs": [COVERS[1], COVERS[5]],  # L2 amber (Japan setting) + L6 teal (multicultural)
        "prompt_kwargs": dict(
            cover_bullet=(
                "two MyPhonicsBooks paperbacks (the Level 2 amber cover 'The Night "
                "Light' set in Tokyo and the Level 6 teal cover 'The Marvellous "
                "Neighbourhood' provided as inputs) lying slightly overlapped"
            ),
            username="kate.reads",
            comment="every UK phonics book looks exactly the same tbh",
            reply="we set them in tokyo, madrid, nairobi, karachi. open one.",
            timestamp="44m",
        ),
    },
]


# ─────────────────────────────────────────────────────────────────────────
# KID DEMO variants — different captured moments.
# ─────────────────────────────────────────────────────────────────────────
def kid_demo_prompt(
    *,
    scene: str,
    caption_l1: str,
    caption_l2: str,
    timestamp: str,
) -> str:
    return (
        "A photograph framed and styled as if it were a real iPhone photo "
        "screenshot — NOT a polished ad. Visual register: 'a parent's casual "
        "phone capture they'd actually share in a family WhatsApp group'.\n\n"

        "OUTER FRAME: thin iOS-style screenshot UI — a slim status bar across the "
        f"top showing the time '{timestamp}', a wifi icon and a battery icon on "
        "the right; a thin bottom UI bar with just the small grey iOS home "
        "indicator. The screenshot's wallpaper area inside the UI is the photo "
        "described below.\n\n"

        f"PHOTO ITSELF: {scene}\n\n"
        f"{COVER_FIDELITY}\n\n"

        "OVERLAY (caption styled like an iPhone screenshot annotation): a small "
        "hand-typed-looking text bubble in the lower-third of the photo (NOT "
        "covering the UI bars), in clean white type on a soft black translucent "
        "chip, reading exactly two lines:\n"
        f"  line 1: '{caption_l1}'\n"
        f"  line 2: '{caption_l2}'\n\n"

        "TREATMENT: slight ambient softness as if shot one-handed, no studio "
        "lighting, no logo, no CTA, no headline. Square 1:1. British English."
    )


KID_DEMO_VARIANTS = [
    {
        "slug": "04b_kid_demo_splash",
        "inputs": [COVERS[0]],  # L1 pink — Tap Tap Tap
        "prompt_kwargs": dict(
            scene=(
                "a candid, slightly imperfect overhead shot — taken with one hand "
                "by a parent — of a small child's RIGHT hand (only fingers visible, "
                "no face, age suggested by hand size to be about 4) with the index "
                "finger resting on a printed word in an open MyPhonicsBooks "
                "paperback. The Level 1 pink cover ('Tap! Tap! Tap!', provided as "
                "input) sits face-up to the left of the open book. The open page "
                "shows a simple decodable phonics sentence including the word "
                "'splash' which the finger is pointing at. Morning kitchen-table "
                "light, a soft toy partially in frame at the edge."
            ),
            caption_l1="He just sounded out 'splash'.",
            caption_l2="He's 4. First book, day 3.",
            timestamp="07:48",
        ),
    },
    {
        "slug": "04c_kid_demo_first_whole_book",
        "inputs": [COVERS[1], COVERS[2]],  # L2 + L3
        "prompt_kwargs": dict(
            scene=(
                "a candid overhead shot of a small child's hands closing the back "
                "cover of a MyPhonicsBooks paperback. The Level 2 amber cover ('The "
                "Night Light', provided as input) is the book they just finished, "
                "now lying closed under their palms. To the side, the Level 3 green "
                "cover ('The Big Bike Race', provided as input) sits face-up "
                "waiting. Soft evening lamp light. The child is partially visible "
                "(small shoulder in a blue jumper, no face). A small star sticker "
                "is stuck to the back cover of the closed book."
            ),
            caption_l1="First whole book without help.",
            caption_l2="She's 5. Eight nights from first page.",
            timestamp="19:14",
        ),
    },
    {
        "slug": "04d_kid_demo_read_to_sleep",
        "inputs": [COVERS[3]],  # L4 blue
        "prompt_kwargs": dict(
            scene=(
                "a candid bedtime photograph from a parent's perspective looking "
                "down at a small child propped up on a pillow, reading aloud from "
                "an open MyPhonicsBooks paperback. The Level 4 blue cover ('The "
                "Purple Purse', provided as input) is the open book they're "
                "reading. Soft bedside-lamp light. Only the child's hands, hair "
                "and shoulders visible (no face), wearing pyjamas with small "
                "stars. The parent's hand is visible at the bottom of the frame "
                "holding a corner of the duvet."
            ),
            caption_l1="She read me to sleep tonight.",
            caption_l2="Not the other way round.",
            timestamp="20:31",
        ),
    },
]


# ─────────────────────────────────────────────────────────────────────────
# MOCKUMENTARY variants — different deadpan subtitle jokes.
# ─────────────────────────────────────────────────────────────────────────
def mockumentary_prompt(
    *,
    scene: str,
    sub_l1: str,
    sub_l2: str,
) -> str:
    return (
        "A photograph styled as a frame grab from a TV documentary — visual "
        "register of an Apple TV+ or BBC docuseries still, NOT a marketing "
        "graphic. Cinematic depth of field, natural light, deadpan composition.\n\n"

        f"SCENE: {scene}\n\n"
        f"{COVER_FIDELITY} Cinematic shallow depth of field, sharp focus on the "
        "book and the child's hand, soft window-light bokeh in the background.\n\n"

        "DOCUMENTARY SUBTITLE OVERLAY: at the bottom of the frame (positioned "
        "where TV documentary lower-thirds sit), in clean small white sans-serif "
        "type with a faint soft black drop-shadow for legibility, reads exactly "
        "two lines:\n"
        f"  line 1 (slightly larger, all caps): '{sub_l1}'\n"
        f"  line 2 (smaller, italic): '{sub_l2}'\n\n"

        "TREATMENT: looks like a still from a documentary, not an ad. No logo, "
        "no CTA, no headline, no marketing copy. The deadpan subtitle is the "
        "entire payload. Warm natural light. Square 1:1. British English."
    )


MOCKUMENTARY_VARIANTS = [
    {
        "slug": "05b_mockumentary_cereal_boxes",
        "inputs": [COVERS[4], COVERS[5]],  # L5 + L6
        "prompt_kwargs": dict(
            scene=(
                "a 5-year-old girl with shoulder-length dark hair sitting at a "
                "Scottish-tenement kitchen table at breakfast, intently reading "
                "the back of a generic supermarket cereal box she's holding up "
                "with both small hands. Her face is mostly hidden behind the "
                "box. A MyPhonicsBooks paperback — the Level 5 purple cover "
                "('Before the Shore', provided as input) — lies open face-down "
                "on the table beside her bowl. The Level 6 teal cover ('The "
                "Marvellous Neighbourhood', provided as input) sits closed to "
                "the side. Soft morning window light through a Victorian sash "
                "window."
            ),
            sub_l1="SAFIA, 5, EDINBURGH.",
            sub_l2="Reads the back of cereal boxes for sport.",
        ),
    },
    {
        "slug": "05c_mockumentary_silent_e",
        "inputs": [COVERS[0], COVERS[1]],  # L1 + L2
        "prompt_kwargs": dict(
            scene=(
                "a young child with sandy hair, around primary-school age, "
                "sitting cross-legged on a warm-toned Bristol living-room rug, "
                "looking intently at an open MyPhonicsBooks paperback in their "
                "lap. The Level 1 pink cover ('Tap! Tap! Tap!', provided as "
                "input) is the book they're reading. The Level 2 amber cover "
                "('The Night Light', provided as input) sits closed beside "
                "them. Shown in 3/4 rear angle, face hidden by hair and angle, "
                "their expression one of deep concentration. Late afternoon "
                "natural light through tall Georgian windows behind, soft "
                "bokeh, cinematic depth of field."
            ),
            sub_l1="FREDDIE, 5, BRISTOL.",
            sub_l2="Convinced the silent E is plotting something.",
        ),
    },
    {
        "slug": "05d_mockumentary_charging_brother",
        "inputs": [COVERS[2], COVERS[3], COVERS[5]],  # L3 + L4 + L6
        "prompt_kwargs": dict(
            scene=(
                "a 7-year-old girl with neat plaits, wearing a school cardigan, "
                "sitting at a small Welsh kitchen table with three "
                "MyPhonicsBooks paperbacks fanned in front of her (Level 3 green "
                "'The Big Bike Race', Level 4 blue 'The Purple Purse', and "
                "Level 6 teal 'The Marvellous Neighbourhood', all provided as "
                "inputs). She is showing one of the books to a younger boy "
                "(her brother, about 4, only the back of his head visible) who "
                "is sitting opposite. On the table between them, a small "
                "handwritten cardboard sign in childish marker reads exactly "
                "'£2 / lesson'. Soft daylight through a window, slightly "
                "shallow depth of field, sharp focus on the sign and the girl."
            ),
            sub_l1="MIA, 7, CARDIFF.",
            sub_l2="Finished all six levels. Now charging her brother £2 a lesson.",
        ),
    },
]


# Assemble final ad list with rendered prompts.
ADS = []
for v in COMMENT_REPLY_VARIANTS:
    ADS.append({
        "slug": v["slug"],
        "size": "1024x1024",
        "inputs": v["inputs"],
        "prompt": comment_reply_prompt(**v["prompt_kwargs"]),
    })
for v in KID_DEMO_VARIANTS:
    ADS.append({
        "slug": v["slug"],
        "size": "1024x1024",
        "inputs": v["inputs"],
        "prompt": kid_demo_prompt(**v["prompt_kwargs"]),
    })
for v in MOCKUMENTARY_VARIANTS:
    ADS.append({
        "slug": v["slug"],
        "size": "1024x1024",
        "inputs": v["inputs"],
        "prompt": mockumentary_prompt(**v["prompt_kwargs"]),
    })


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
        todo = [a for a in ADS if any(w in a["slug"] for w in wanted)]
    if not todo:
        print("Nothing to generate", file=sys.stderr); sys.exit(1)

    print(f"Generating {len(todo)} v5 variants…")
    sem = asyncio.Semaphore(3)
    await asyncio.gather(*(gen_one(client, a, sem) for a in todo))


if __name__ == "__main__":
    asyncio.run(main())
