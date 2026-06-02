"""
Scroll-stopper ad generator for MyPhonicsBooks.

Uses gpt-image-2 to create 9:16 creatives in radically different styles +
formats (passport, plane ticket, prescription, museum placard, retro arcade,
origami, brutalist newspaper, etc.) — each one a thumb-stop scroll-killer.

Layout contract:
  - Final canvas: 1080x1920 (9:16, IG Story/Reels ready)
  - Top ~180px: clean band, no AI content (Canva-edit zone for brand lockup)
  - Bottom ~240px: clean band, no AI content (Canva-edit zone for pink CTA pill)
  - Middle ~1500px: the AI-generated creative scene
  - No real book covers used as input — the AI can suggest book shapes / paper
    books / abstract motifs, which the user can replace or keep in Canva.

Modes:
  python generate_scroll_stoppers.py             # generate all 10 curated concepts
  python generate_scroll_stoppers.py 03 07       # generate specific concept indices
  python generate_scroll_stoppers.py --random 5  # roll the dice 5 times (style x format)
"""
import asyncio
import base64
import io
import os
import random
import shutil
import sys
from pathlib import Path

from dotenv import load_dotenv
from openai import AsyncOpenAI
from PIL import Image

ROOT = Path(r"C:\Users\ASUS\myphonicsbooks\myphonics_books")
load_dotenv(ROOT / ".env")

OUT_LOCAL = Path(r"C:\Users\ASUS\myphonicsbooks\marketing-mockups\v3\scroll_stoppers")
OUT_DRIVE = Path(r"G:\My Drive\MyPhonicsBooks\02_Marketing\Mockups_v3\scroll_stoppers")

CANVAS_W, CANVAS_H = 1080, 1920
AI_W, AI_H = 1024, 1536  # gpt-image-2 portrait

# How tall the "edit bands" are in the FINAL 1080x1920 output
TOP_BAND = 180
BOTTOM_BAND = 240

# Prompt-side instruction for the model — describe the same bands in its 1024x1536 frame
def band_instruction():
    # AI output is 1024x1536. Final is 1080x1920. We resize AI to 1080 wide
    # → AI fills 1620 of 1920 height, leaving (1920-1620)/2 = 150 top + bottom.
    # We then crop top/bottom to expose the bands. So in AI's frame we want
    # clear bands of ~ (TOP_BAND - 150) and (BOTTOM_BAND - 150) ≈ 30 and 90 px
    # but that's tight. Better: ask AI to leave generous clear zones at top
    # (200px) and bottom (300px) of its own 1024x1536 frame, and then we
    # arrange the canvas around it.
    return (
        "CRITICAL LAYOUT RULE: "
        "Reserve the TOP 200 pixels of the 1024x1536 canvas as a perfectly clean, "
        "uniform white or off-white BAND — absolutely no graphics, no text, no shading, no decoration in that zone. "
        "Reserve the BOTTOM 320 pixels as another perfectly clean, uniform band — same rules. "
        "These bands are EDIT ZONES where a brand lockup and a CTA button will be added later in Canva. "
        "If you put anything in those zones the design is unusable. "
        "The CREATIVE SCENE must live entirely within the middle ~1016 pixels of canvas height."
    )


COMMON_NEG = (
    "No human faces with detailed eyes (inclusive simplified eyes only if any). "
    "No misspelled words. British English. No urgency language ('limited time', 'act now')."
)


# 10 curated scroll-stopper concepts
CONCEPTS = [
    {
        "slug": "01_japanese_passport",
        "title": "Japanese minimalist reading passport",
        "prompt": (
            "Editorial flat-lay photograph, Japanese minimalist aesthetic. "
            "A single passport-style booklet titled 'READING PASSPORT' rests centred on warm cream paper, "
            "subtle paper grain, soft natural daylight from the left, deep crisp shadow. "
            "The cover is dusty rose / muji-style off-white linen with a small embossed open-book icon and a tiny "
            "navy serial number reading 'MPB · LV 1 → LV 6'. Six tiny circular ink stamps in muted colours "
            "(pink, amber, green, blue, purple, teal) arranged like a wabi-sabi grid in the lower third of the passport, "
            "each stamp printed with its level numeral. The composition is generous with whitespace, "
            "evoking Kinfolk magazine. Photographic, not illustrated. Sharp focus, shallow depth of field."
        ),
    },
    {
        "slug": "02_vintage_airline_ticket",
        "title": "Vintage Pan-Am airline ticket",
        "prompt": (
            "Hyper-real flat-lay of a vintage 1960s airline carbon-copy paper ticket on a kraft-paper desktop, "
            "with the headline 'BOARDING PASS · READING LEVELS' in classic monospaced typewriter font. "
            "Fields filled in by hand: 'FROM: Confused Reader · TO: Reading Champion · "
            "FARE: 3 free books · GATE: myphonicsbooks.co.uk · SEAT: At home · CLASS: All Levels'. "
            "Red 'BOARDED' stamp overlaid at a slight angle. Subtle coffee ring, tiny passport-photo "
            "of a smiling cartoon child (simplified inclusive eyes) clipped to the corner. "
            "Photographic, warm tungsten light, 35mm grain."
        ),
    },
    {
        "slug": "03_doctors_prescription",
        "title": "Doctor's prescription pad",
        "prompt": (
            "Close-up photograph of a doctor's prescription pad on a marble countertop, "
            "fountain pen and stethoscope just visible. "
            "Pre-printed letterhead reads 'MYPHONICSBOOKS CLINIC · 6 LEVELS · UK CURRICULUM ALIGNED'. "
            "Handwritten in clean blue ink: "
            "'Rx — 1 decodable book matched to reading level. Take nightly. "
            "Refill ×6 (Levels 1-6). Side effect: a confident reader.' "
            "Signed 'Dr. Phonics' with a tiny doodled smiley. "
            "Soft window light, photographic realism."
        ),
    },
    {
        "slug": "04_brutalist_newspaper",
        "title": "Brutalist newspaper front page",
        "prompt": (
            "Brutalist black-and-white tabloid newspaper front page, slightly creased, photographed from above. "
            "Masthead in giant condensed serif reads 'THE READING REPORT'. "
            "Banner headline taking up most of the page: '1 IN 4 LEAVE PRIMARY UNABLE TO READ'. "
            "Subhead: 'And the cause is sitting on the bedside table.' "
            "Below: a single oversized pink rectangle outlined like a missing photo with the caption "
            "'the wrong book'. Strict grid, heavy ink, halftone dots, deliberate misalignment. "
            "Date in corner: TODAY. No other graphics."
        ),
    },
    {
        "slug": "05_origami_paper_book",
        "title": "Paper-craft origami book scene",
        "prompt": (
            "Award-winning paper-craft photograph. An open book made entirely of folded white and pink paper "
            "stands upright on a soft cream surface. Tiny folded paper children — six of them, each in a different "
            "subtle pastel — step OUT of the open pages in a line, getting taller and more confident from left to right. "
            "Long soft shadows, studio softbox lighting. Wes Anderson colour palette: dusty pink, mustard, sage, sky, lavender, teal. "
            "Photorealistic paper textures, crisp folds, no digital sheen."
        ),
    },
    {
        "slug": "06_retro_arcade",
        "title": "Retro arcade high-score screen",
        "prompt": (
            "Bright, hyper-saturated photograph looking straight at a CRT arcade cabinet screen, scanlines visible, "
            "displaying a pixel-art high-score table titled 'READING LEVEL UP!'. "
            "Pixel font rows: 'LV1 — TAP TAP TAP — CLEARED'. 'LV2 — LONGER SOUNDS — CLEARED'. "
            "'LV3 — NEW SPELLINGS — IN PROGRESS'. 'LV4-6 — LOCKED'. "
            "Bright pink, cyan and yellow pixels on near-black. Tiny 8-bit kid sprite with a backpack standing "
            "beside the score column. Subtle CRT vignette and chromatic aberration. Photo of a real cabinet, not a screenshot."
        ),
    },
    {
        "slug": "07_museum_placard",
        "title": "Museum exhibit placard",
        "prompt": (
            "Photograph of a minimalist art-museum exhibit plaque, mounted on a stark off-white plaster wall, "
            "tasteful warm spotlight from above. Plaque is brushed brass with engraved black serif lettering: "
            "'EXHIBIT 4B · A CONFIDENT READER · Found at home, age 6. "
            "Method: one decodable book per night, matched to reading level. "
            "Collection: MyPhonicsBooks, UK, 2026.' "
            "Below the plaque, a tiny empty plinth in the shot suggesting the reader has walked off. "
            "Architectural digest aesthetic. Subtle shadow, premium feel."
        ),
    },
    {
        "slug": "08_botanical_print",
        "title": "Antique botanical reading-tree print",
        "prompt": (
            "An antique botanical illustration plate on aged ivory paper, in the style of 18th-century scientific engravings, "
            "but the specimen is a 'Reading Tree' — its roots labelled with single letter-sounds (s, a, t, p, i, n), "
            "its trunk labelled with digraphs (sh, ch, th, ai, ee), its branches with whole words, "
            "and at the top six small open books grow like fruit, each one in a different pastel level colour. "
            "Copperplate handwriting captions in faded sepia ink. Edge of the paper slightly torn. "
            "Caption at the bottom centre: 'Tabula Phonetica · 6 Gradus'. "
            "Photographed from directly above with raking light."
        ),
    },
    {
        "slug": "09_polaroid_stack",
        "title": "Polaroid stack on linen",
        "prompt": (
            "Overhead photograph of three Polaroid photos arranged on natural linen cloth, slightly overlapping. "
            "Each Polaroid shows the same open paper book glowing softly with warm light, photographed from a slightly different angle. "
            "Beneath the Polaroids, a small handwritten index card in blue ink reads: "
            "'The first book they read all by themselves.' "
            "Tiny soft props in the corners: a wooden pencil, dried flower, a child's drawing. "
            "Natural window light, shallow depth of field, photographic realism. "
            "No human faces."
        ),
    },
    {
        "slug": "10_prescription_label",
        "title": "Pharmacy prescription bottle",
        "prompt": (
            "Macro photograph of an amber pharmacy bottle standing on a white counter, soft daylight. "
            "The label is crisp white with bold black type. Pharmacy name: 'MYPHONICSBOOKS PHARMACY'. "
            "Patient: 'Early Reader'. "
            "Drug: 'DECODABLE BOOKS (Level-matched)'. "
            "Dosage: 'One book, every night, until reading champion'. "
            "Refills: '5 remaining (Levels 2-6)'. "
            "A small pink dot motif on the cap. "
            "Subtle prescription paperwork peeking out behind. Premium pharmaceutical aesthetic, photographic."
        ),
    },
]


STYLE_POOL = [
    "Japanese minimalist editorial flat-lay",
    "Vintage 1960s travel print poster",
    "Brutalist black-and-white newspaper",
    "Wes Anderson symmetrical pastel diorama",
    "Antique 18th-century botanical engraving",
    "Retro arcade pixel art CRT screen",
    "Hyper-real paper-craft origami scene",
    "Polaroid film photography flat-lay",
    "Mid-century modern advertising illustration",
    "Risograph two-colour zine print",
    "Vintage Penguin book cover design",
    "1970s science textbook diagram",
    "Bauhaus geometric poster",
    "Hand-cut paper collage like Matisse cutouts",
    "Architectural digest minimalist still life",
]

FORMAT_POOL = [
    "passport with stamps",
    "vintage airline boarding pass",
    "doctor's prescription pad",
    "pharmacy bottle label",
    "museum exhibit brass plaque",
    "art gallery placard",
    "antique map with reading levels as territories",
    "vinyl record cover",
    "magazine cover with a single bold headline",
    "high-score arcade screen",
    "library card catalogue drawer",
    "exam certificate with embossed seal",
    "tea-shop loyalty card",
    "Polaroid stack tied with twine",
    "old-school department store receipt",
    "vintage stamp collection page",
    "diary entry with handwritten notes",
    "pull tab from a 1990s magazine",
]

HOOK_POOL = [
    ("Reading more isn't the answer.", "Reading at the right level is."),
    ("1 in 4 leave primary school unable to read properly.", "Books matched to their level fix this."),
    ("What 'decodable' actually means.", "Every word uses only the sounds they've been taught."),
    ("Do you know their reading level?", "73% of parents don't. The 3-minute test does."),
    ("Phonics isn't about sounding out.", "It's about which words they're allowed to see."),
    ("Every UK school teaches phonics from Reception.", "Most home books don't match what's taught."),
    ("3 minutes. 3 free books.", "Matched to their exact reading level."),
    ("The book on the bedside table matters more than you think.", "Wrong level = stalled progress."),
]


def random_prompt(rng: random.Random):
    style = rng.choice(STYLE_POOL)
    fmt = rng.choice(FORMAT_POOL)
    hook_head, hook_sub = rng.choice(HOOK_POOL)
    return (
        f"{style} of a {fmt}. "
        f"The central object/scene must carry the headline (rendered as part of the artefact itself, e.g. printed on the "
        f"prescription, embossed on the passport, halftone-printed on the newspaper, engraved on the brass plaque): "
        f"\"{hook_head}\" with a smaller secondary line: \"{hook_sub}\". "
        f"Include a small understated MyPhonicsBooks signature somewhere subtle on the artefact. "
        f"Composition is centred and editorial. Premium feel. "
        f"{COMMON_NEG}"
    )


def full_prompt(concept_prompt: str) -> str:
    return (
        f"{concept_prompt}\n\n"
        f"{band_instruction()}\n\n"
        f"{COMMON_NEG}"
    )


def place_on_canvas(ai_bytes: bytes) -> Image.Image:
    """Resize gpt output to 1080 wide, centre on a 1080x1920 white canvas."""
    ai = Image.open(io.BytesIO(ai_bytes)).convert("RGB")
    # scale to 1080 wide
    new_w = CANVAS_W
    new_h = int(ai.height * (CANVAS_W / ai.width))
    ai = ai.resize((new_w, new_h), Image.LANCZOS)
    # centre on white 1080x1920 canvas
    canvas = Image.new("RGB", (CANVAS_W, CANVAS_H), "white")
    y_off = (CANVAS_H - new_h) // 2
    canvas.paste(ai, (0, y_off))
    return canvas


async def gen_one(client: AsyncOpenAI, slug: str, prompt: str, sem: asyncio.Semaphore):
    async with sem:
        try:
            print(f"[..] {slug} requesting…")
            result = await client.images.generate(
                model="gpt-image-2",
                prompt=prompt,
                size="1024x1536",
                quality="high",
                n=1,
            )
            ai_b64 = result.data[0].b64_json
            ai_bytes = base64.b64decode(ai_b64)
            final = place_on_canvas(ai_bytes)
            out = OUT_LOCAL / f"{slug}.png"
            final.save(out, "PNG")
            shutil.copy2(out, OUT_DRIVE / out.name)
            print(f"[ok] {out.name}")
            return out
        except Exception as e:
            print(f"[err] {slug}: {e}", file=sys.stderr)
            return None


async def main():
    OUT_LOCAL.mkdir(parents=True, exist_ok=True)
    OUT_DRIVE.mkdir(parents=True, exist_ok=True)
    api_key = os.environ["OPENAI_API_KEY"]
    client = AsyncOpenAI(api_key=api_key)

    args = sys.argv[1:]
    todo = []
    if args and args[0] == "--random":
        n = int(args[1]) if len(args) > 1 else 5
        rng = random.Random()
        for i in range(n):
            slug = f"rand_{i+1:02d}"
            todo.append((slug, full_prompt(random_prompt(rng))))
    elif args:
        wanted = set(args)
        for c in CONCEPTS:
            idx = c["slug"].split("_")[0]
            if c["slug"] in wanted or idx in wanted:
                todo.append((c["slug"], full_prompt(c["prompt"])))
    else:
        for c in CONCEPTS:
            todo.append((c["slug"], full_prompt(c["prompt"])))

    if not todo:
        print("Nothing to generate", file=sys.stderr)
        sys.exit(1)

    print(f"Generating {len(todo)} creatives…")
    sem = asyncio.Semaphore(3)
    await asyncio.gather(*(gen_one(client, slug, p, sem) for slug, p in todo))


if __name__ == "__main__":
    asyncio.run(main())
