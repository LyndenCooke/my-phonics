# ---------------------------------------------------------------------------
# L6 worksheet illustration set — Gemini generation (Part 1 of the asset build).
#
# Generates the commissioned asset list from docs/book_world_L6.md with
# gemini-2.5-flash-image (same REST pattern as
# myphonics_books/scripts/regen_l4_4_full.py), injecting the books' existing
# character reference images for consistency. Character consistency prompts are
# VERBATIM from the bible. Output is staged in public/clipart/_pending/ — the
# renderer never reads subfolders, so nothing goes live until human approval
# flips the real manifest.
#
# Usage:
#   python scripts/generate_l6_assets.py gen          # generate raw COLOUR sources (resumable)
#   python scripts/generate_l6_assets.py gen owl cat  # regenerate named keys only
#   python scripts/generate_l6_assets.py process      # bg removal + trim -> _pending/colour/ sources
#   python scripts/generate_l6_assets.py lineart      # convert colour sources -> line art (resumable)
#   python scripts/generate_l6_assets.py lineart owl  # reconvert named keys only
#   python scripts/generate_l6_assets.py finalise     # trim line art -> _pending/, cover copy, manifest
#   python scripts/generate_l6_assets.py sheet        # contact sheet grid -> output/contact_sheet_L6.png
#
# The WORKBOOK treatment is LINE ART (the manifest rule): the colour pass only
# exists to lock book-faithful shapes; `lineart` converts each colour source
# image-to-image into the one black line-art treatment, anchored on an approved
# existing line-art asset. The cover is the exception — it is a curated full
# colour scene lifted straight from a shipped book page (covers are the hooks),
# never a multi-character generation (crowded generations mess up characters).
# ---------------------------------------------------------------------------

import base64
import json
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests
from dotenv import dotenv_values
from PIL import Image, ImageDraw, ImageFont

ENGINE = Path(__file__).resolve().parent.parent
REPO = ENGINE.parent
BOOK_IMAGES = REPO / "myphonics_books" / "output" / "images"
PENDING = ENGINE / "public" / "clipart" / "_pending"
RAW = PENDING / "raw"
COLOUR = PENDING / "colour"
RAW_LINEART = PENDING / "raw_lineart"
OUT_SHEET = ENGINE / "output" / "contact_sheet_L6.png"

# The cover panel: one good scene straight off a shipped book page. The Brown
# Owl tree scene (owl perched, owlets in the hole, both characters looking up)
# ties directly to the booklet's owl sentences.
COVER_SOURCE = BOOK_IMAGES / "L4_2_B1" / "page6.png"

# These keys already have APPROVED line art in the live folder — the existing
# files are retained, never replaced by conversions (KEEP per the image plan).
KEEP_EXISTING = {"purse", "glue", "branch", "leaf", "moon"}

# Approved existing line-art assets as style anchors: a creature for creature
# conversions, an object for object conversions (an object converted against a
# creature reference can come back AS the creature — the purse became a monkey).
LINEART_STYLE_REF_CREATURE = ENGINE / "public" / "clipart" / "monkey.png"
LINEART_STYLE_REF_OBJECT = ENGINE / "public" / "clipart" / "glue.png"

LINEART_BASE = (
    "Convert the INPUT ILLUSTRATION (the second image) into clean black LINE ART "
    "for a children's phonics workbook, matching the line-art treatment of the "
    "FIRST image. The first image is ONLY a style reference — do NOT draw its "
    "subject. PURE BLACK AND WHITE: no colour anywhere, no grey fills, no tints, "
    "no watercolour wash, no hatching - just clean confident black outline strokes "
    "on a plain pure white background, with minimal interior detail lines. Keep "
    "the EXACT same subject, pose and composition as the INPUT illustration. "
    "Consistent medium line weight. No text, words, letters or numbers. "
)
LINEART_CREATURE = (
    LINEART_BASE
    + "Preserve each creature's tiny solid black filled dot eyes exactly as in the "
    "input - same tiny size, never bigger."
)
LINEART_OBJECT = (
    LINEART_BASE
    + "These are inanimate objects: NO eyes, NO face, NO added dots or spots of any "
    "kind - draw only the object's own outlines."
)

ENV = dotenv_values(REPO / "myphonics_books" / ".env")
API_KEY = ENV.get("GOOGLE_GEMINI_API_KEY")
MODEL = "gemini-2.5-flash-image"
BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
REQUEST_DELAY = 3
MAX_RETRIES = 4
BACKOFF_BASE = 6

# Billing route. The AI Studio key in myphonics_books/.env belongs to a project
# with no prepaid credit; the company's credits sit on the Google Cloud account
# (gcloud: hello@myphonicsbooks.co.uk), so Vertex AI is the default route. Set
# VERTEX_PROJECT = None to fall back to the AI Studio key.
VERTEX_PROJECT = "iron-entropy-496317-q9"
VERTEX_LOCATION = "global"

_token_cache = {"token": None, "at": 0.0}


def gcloud_token() -> str:
    """A gcloud access token, cached for 45 minutes (tokens last ~60)."""
    if _token_cache["token"] and time.time() - _token_cache["at"] < 45 * 60:
        return _token_cache["token"]
    out = subprocess.run(
        "gcloud auth print-access-token", capture_output=True, text=True, shell=True, check=True
    )
    _token_cache.update(token=out.stdout.strip(), at=time.time())
    return _token_cache["token"]


def endpoint_and_headers():
    if VERTEX_PROJECT:
        host = "aiplatform.googleapis.com" if VERTEX_LOCATION == "global" else f"{VERTEX_LOCATION}-aiplatform.googleapis.com"
        url = (
            f"https://{host}/v1/projects/{VERTEX_PROJECT}/locations/{VERTEX_LOCATION}"
            f"/publishers/google/models/{MODEL}:generateContent"
        )
        return url, {"Authorization": f"Bearer {gcloud_token()}"}
    return f"{BASE_URL}/models/{MODEL}:generateContent?key={API_KEY}", {}

# --- the book style, verbatim (book_world_L6.md section 1.1) -----------------
BASE_STYLE = (
    "Whimsical children's book illustration. Hand-drawn cartoon style with "
    "soft watercolour textured backgrounds and clean black-outlined characters. "
    "CRITICAL EYE RULE: Every character (human, animal, everyone) MUST have eyes that are "
    "tiny solid black filled circles like dots drawn with a black marker pen. "
    "NO white around the black, NO iris, NO pupil, NO highlight, NO detail whatsoever. "
    "Just small simple black dots - cute and friendly like a teddy bear's eyes. "
    "Warm, friendly, inviting. Soft pastel backgrounds with pops of bright colour. "
    "Simple rounded shapes, gentle lighting. Professional picture book quality. "
    "No text, words, letters, or numbers in the image."
)

# Worksheet-asset overrides (the user's style constraints): isolated subjects on
# a clean background so the PNG can be trimmed transparent, one line weight.
LINE_WEIGHT = "Consistent medium black outline line weight on every shape."
CLEAN_BG = (
    "Plain pure white background ONLY - no scenery, no backdrop, no floor, no ground, "
    "no shadows, no patterns, no vignette. The whole subject sits fully inside the "
    "frame with a clear margin on every side, nothing cropped at the edges."
)

# --- character consistency prompts, VERBATIM (book_world_L6.md) ---------------
HERO_PURSE = "A cartoon girl character, about 7 years old, with light olive skin and dark brown wavy hair tied in a ponytail. She wears a purple jumper with a small gold star pattern, a light blue zip-up jacket over the top, dark navy jeans, and white trainers. She has small friendly dot eyes, solid black, tiny and cute like a teddy bear - not too big, a warm determined expression, and rosy cheeks. Standing in a neutral pose, facing the viewer, full body visible from head to toe. Arms slightly away from body, feet shoulder-width apart. Plain light warm cream solid-colour background (no scenery, no objects, no patterns)."

HERO_OWL = "A cartoon girl character, about 6 years old, with medium brown skin (hex #8B6B4A) and curly dark brown hair in two puffs tied with navy blue hair bobbles. She wears a navy blue duffle coat with wooden toggle buttons, dark grey joggers, and brown lace-up boots. She has tiny solid black filled circle eyes (NO white, NO iris — just small dark dots). Friendly cheerful expression. Standing in a neutral pose, facing the viewer, full body visible from head to toe. Arms slightly away from body, feet shoulder-width apart. Plain light grey solid-colour background."

HERO_GLUE = "A cartoon girl character, about 7 years old, with medium brown skin and long straight dark hair in two braids. Round face, rosy cheeks. She wears a yellow t-shirt and blue denim dungarees with silver buckles, and white trainers. She has small friendly dot eyes, solid black, tiny and cute like a teddy bear - not too big, a cheerful mischievous expression. Standing in a neutral pose, facing the viewer, full body visible from head to toe. Arms slightly away from body, feet shoulder-width apart. Plain light warm cream solid-colour background (no scenery, no objects, no patterns)."

HERO_MONKEY = "A cartoon boy, about 5 years old, Malaysian, with medium brown skin (hex #8B6B4A). Short neat black hair (hex #0D0D0D). He wears small round glasses with thin dark frames. Bright orange cotton t-shirt, blue cotton TROUSERS (full-length, NOT shorts), simple brown sandals. Solid black dot eyes behind the glasses — ZERO white. Bright curious excited expression. NO rosy cheeks, NO blush marks. Standing neutral pose, full body, plain light cream background."

OWL_DESC = "a large tawny owl with rich dark brown feathers, lighter cream-brown chest markings, a round facial disc, small solid black dot eyes, and a sharp curved beak"
OWLETS_DESC = "two small fluffy baby owlets with pale brown downy feathers, darker brown markings, round faces like miniature versions of the mother owl, and small solid black dot eyes"
MONKEY_DESC = "A cartoon brown long-tailed macaque monkey. Pale pinkish-tan face, warm brown fur on body and limbs, long curved tail. Bright cheeky mischievous expression with a wide grin. Small rounded ears. Light tan chest/belly. Solid black dot eyes — ZERO white."
CAT_DESC = "a medium-sized ginger tabby cat with orange stripes, white chest, white paws, and white-tipped tail"
PURSE_DESC = "a small purple velvet purse with a gold clasp"

DOT_EYES = "Tiny solid black filled circle dot eyes - NO white, NO iris, NO pupil detail, NO shine."

# The single most enforced rule in the book pipeline — the eyes ARE the house
# identity. Stated at maximum strength for the creatures the model loves to
# give big anime eyes (owls especially).
DOT_EYES_STRICT = (
    "CRITICAL EYE RULE, the most important rule: the eyes are TINY round solid "
    "black filled dots, exactly like the reference image — small like a teddy "
    "bear's eyes. NOT large, NOT almond-shaped, NOT oval, NO white around or "
    "inside them, NO iris, NO shine. If the eyes are big, the image is wrong."
)

# Objects are OBJECTS. The kawaii face variant is banned (book_world_L6.md 1.3).
NO_FACE = (
    "The objects are plain inanimate objects, NOT characters: absolutely NO face, "
    "NO eyes, NO mouth, NO cheeks, NO expression on any object."
)

# --- reference images ---------------------------------------------------------
REF = {
    "hero_purse": BOOK_IMAGES / "L4_1_B1" / "hero_reference.png",
    "hero_owl": BOOK_IMAGES / "L4_2_B1" / "hero_reference.png",
    "hero_glue": BOOK_IMAGES / "L4_3_B1" / "hero_reference.png",
    "hero_monkey": BOOK_IMAGES / "L4_4_B1" / "hero_reference.png",
    # owl_ref_icon.png is the post-eye-fix shipped owl (brown tawny, TINY dot
    # eyes). owl_reference.png is a rejected pale big-eyed variant — never use it.
    "owl": BOOK_IMAGES / "L4_2_B1" / "owl_ref_icon.png",
    "cat": BOOK_IMAGES / "L4_3_B1" / "cat_reference.png",
    "monkey": BOOK_IMAGES / "L4_4_B1" / "monkey_reference.png",
    # known-good eye-style reference, reused by the 6.4 scripts
    "eyes": BOOK_IMAGES / "L4_1_B1" / "hero_reference.png",
    # this run's own owlets pair (colour source), injected so the owl-family
    # scene gets BOTH birds
    "owlets_pending": PENDING / "colour" / "owlets.png",
}

CHAR_REF_LABEL = "CHARACTER REFERENCE — generate THIS EXACT character, same face, hair, outfit and proportions:"
EYE_REF_LABEL = "EYE STYLE REFERENCE — copy these tiny solid black dot eyes exactly:"


def pose_change(action: str) -> str:
    return (
        " POSE CHANGE: instead of the neutral standing pose, "
        + action
        + " Everything else about the character stays exactly identical."
    )


# --- the commissioned asset list ----------------------------------------------
# category: scene (wide group), character, creature, object
# refs: list of (label, REF key) pairs injected before the prompt
ASSETS = {
    # the composed cover panel — keeps its full scene background (no removal)
    "cover_scene": {
        "category": "panel",
        "remove_bg": False,
        "aspect": "16:9",
        "refs": [
            (CHAR_REF_LABEL, "hero_purse"),
            (CHAR_REF_LABEL, "hero_owl"),
            (CHAR_REF_LABEL, "hero_glue"),
            (CHAR_REF_LABEL, "hero_monkey"),
            ("ANIMAL REFERENCE — this exact owl:", "owl"),
            ("ANIMAL REFERENCE — this exact monkey:", "monkey"),
        ],
        "prompt": (
            "One composed children's book cover scene, wide landscape format. The four child "
            "characters from the reference images stand together as a happy group in a leafy "
            "park clearing at warm golden dusk: the girl in the purple jumper with gold stars "
            "and light blue jacket holding up "
            + PURSE_DESC
            + ", the girl in the navy duffle coat looking up in wonder, the girl with braids in "
            "yellow t-shirt and blue dungarees holding a pot of bright blue glue, and the boy in "
            "the orange t-shirt with round glasses laughing. Above them "
            + OWL_DESC
            + " (the exact brown tawny owl from the reference image) perches on a bare winter "
            "oak branch, and the cheeky monkey from the reference sits on a low stone wall "
            "beside the boy. Soft watercolour background, gentle dusk sky with a small crescent "
            "moon. " + DOT_EYES_STRICT + " "
        ),
    },
    # foot band scenes (grammar_L6_image_plan.md placements)
    "scene_owl_branch": {
        "category": "scene",
        "remove_bg": True,
        "refs": [("ANIMAL REFERENCE — this exact owl:", "owl")],
        "prompt": (
            "The exact brown tawny owl from the reference image perched on a single long bare "
            "winter oak branch with textured bark, facing slightly left: "
            + OWL_DESC
            + ". Just the owl and the branch, grouped as one wide composition. "
            + DOT_EYES_STRICT + " "
        ),
    },
    "scene_cup_rug_glue": {
        "category": "scene",
        "lineart": "object",
        "remove_bg": True,
        "refs": [],
        "prompt": (
            "A small still life grouped as one moment, wide composition: a plain blue ceramic cup "
            "tipped over on its side with a small run of spilt tea, lying on a bright woven "
            "striped rug from a Mexican home, with a plain UNLABELLED pot of bright blue glue "
            "standing upright beside it. Nothing else. " + NO_FACE + " ABSOLUTELY NO text, "
            "NO letters, NO words, NO label, NO writing anywhere in the image. "
        ),
    },
    "scene_owl_owlets_moon": {
        "category": "scene",
        "remove_bg": True,
        "refs": [
            ("ANIMAL REFERENCE — this exact owl:", "owl"),
            ("OWLETS REFERENCE — include BOTH of these two owlets, side by side:", "owlets_pending"),
        ],
        "prompt": (
            "The exact brown tawny owl from the reference image ("
            + OWL_DESC
            + ") and "
            + OWLETS_DESC
            + " perched close together on a single long bare winter oak branch. There are exactly "
            "THREE birds: the large mother owl and TWO separate small owlets, both owlets "
            "snuggled side by side at the mother owl's side. A small warm crescent moon floats "
            "just above and to the right of them. One grouped moment, wide composition. "
            + DOT_EYES_STRICT + " "
        ),
    },
    "scene_review": {
        "category": "scene",
        "remove_bg": True,
        "refs": [("ANIMAL REFERENCE — this exact monkey:", "monkey")],
        "prompt": (
            MONKEY_DESC
            + " It sits contentedly on a low grey stone garden wall, holding a small open "
            "snack packet in its paws and calmly eating from it — the snack it cheekily "
            "stole in the story. One grouped moment, wide composition. " + NO_FACE + " "
            "No flowers, no plants, no coloured wash anywhere — only the monkey, the wall "
            "and the snack packet. ABSOLUTELY NO text, NO letters on the packet. "
        ),
    },
    # the four heroes, standing (verbatim prompts) and one action pose each
    "hero_purse_standing": {
        "category": "character",
        "remove_bg": True,
        "refs": [(CHAR_REF_LABEL, "hero_purse")],
        "prompt": HERO_PURSE,
    },
    "hero_purse_action": {
        "category": "character",
        "remove_bg": True,
        "refs": [(CHAR_REF_LABEL, "hero_purse")],
        "lineartNote": "Her jeans and jacket are WHITE with black outlines only — no grey or tinted fill anywhere.",
        "prompt": HERO_PURSE
        + pose_change(
            "she holds up " + PURSE_DESC + " in one hand, beaming with relief and joy."
        ),
    },
    "hero_owl_standing": {
        "category": "character",
        "remove_bg": True,
        "refs": [(CHAR_REF_LABEL, "hero_owl")],
        "prompt": HERO_OWL,
    },
    "hero_owl_action": {
        "category": "character",
        "remove_bg": True,
        "refs": [(CHAR_REF_LABEL, "hero_owl")],
        "prompt": HERO_OWL
        + pose_change(
            "she looks up and points high with one arm, mouth open in quiet wonder, as if "
            "she has just spotted an owl on a branch above her."
        ),
    },
    "hero_glue_standing": {
        "category": "character",
        "remove_bg": True,
        "refs": [(CHAR_REF_LABEL, "hero_glue")],
        "prompt": HERO_GLUE,
    },
    "hero_glue_action": {
        "category": "character",
        "remove_bg": True,
        "refs": [(CHAR_REF_LABEL, "hero_glue")],
        "prompt": HERO_GLUE
        + pose_change(
            "she holds a white handmade card with a blue bird drawing in both hands, a small "
            "dollop of bright blue glue on its front, with a cheeky caught-in-the-act grin."
        ),
    },
    "hero_monkey_standing": {
        "category": "character",
        "forceBw": True,
        "remove_bg": True,
        "refs": [(CHAR_REF_LABEL, "hero_monkey")],
        "lineartNote": (
            "His glasses are THIN empty circles; the eyes BEHIND them are tiny solid "
            "black dots exactly as in the input — the lenses must NOT be filled and the "
            "eyes must NOT grow into large ovals."
        ),
        "prompt": HERO_MONKEY,
    },
    "hero_monkey_action": {
        "category": "character",
        "forceBw": True,
        "remove_bg": True,
        "refs": [(CHAR_REF_LABEL, "hero_monkey")],
        "lineartNote": (
            "His glasses are THIN empty circles; the eyes BEHIND them are tiny solid "
            "black dots exactly as in the input — the lenses must NOT be filled and the "
            "eyes must NOT grow into large ovals."
        ),
        "prompt": HERO_MONKEY
        + pose_change(
            "he runs forward mid-stride, one hand reaching out, laughing as he chases "
            "something just out of frame."
        ),
    },
    # creatures
    "cat": {
        "category": "creature",
        "remove_bg": True,
        "refs": [("ANIMAL REFERENCE — this exact cat:", "cat")],
        "prompt": (
            CAT_DESC.capitalize()
            + ", sitting upright with its tail curled neatly around its front paws, facing "
            "slightly left. "
            + DOT_EYES
            + " "
        ),
    },
    "owlets": {
        "category": "creature",
        "remove_bg": True,
        "refs": [("ANIMAL REFERENCE — the owlets must look like miniature versions of this owl:", "owl")],
        "prompt": OWLETS_DESC.capitalize() + " huddled side by side as one little pair. " + DOT_EYES_STRICT + " ",
    },
    "owl": {
        "category": "creature",
        "remove_bg": True,
        "refs": [("ANIMAL REFERENCE — this exact owl:", "owl")],
        "prompt": (
            "The exact brown tawny owl from the reference image, perched upright, full body, "
            "facing slightly left: " + OWL_DESC + ". " + DOT_EYES_STRICT + " "
        ),
    },
    # objects (book-style redraws)
    "purse": {
        "category": "object",
        "remove_bg": True,
        "refs": [],
        "prompt": PURSE_DESC.capitalize() + ", closed, three-quarter view. ",
    },
    "glue": {
        "category": "object",
        "remove_bg": True,
        "refs": [],
        "prompt": "A plain pot of bright blue glue, lid on top, simple. " + NO_FACE + " ",
    },
    "branch": {
        "category": "object",
        "remove_bg": True,
        "refs": [],
        "prompt": (
            "A single long bare winter oak branch with thick textured bark and a few short "
            "twigs, lying horizontally. No leaves. "
        ),
    },
    "leaf": {
        "category": "object",
        "remove_bg": True,
        "refs": [],
        "prompt": (
            "A single plain fallen autumn oak leaf in warm brown and orange tones. Just the "
            "one leaf and nothing else — no acorns, no insects, no creatures, no other objects. "
            + NO_FACE + " "
        ),
    },
    "moon": {
        "category": "object",
        "remove_bg": True,
        "refs": [],
        "prompt": "A small crescent moon in warm soft yellow, plain and simple, no face. ",
    },
    "cup": {
        "category": "object",
        "remove_bg": True,
        "refs": [],
        "prompt": "A plain blue ceramic cup, simple, three-quarter view. " + NO_FACE + " ",
    },
    "card": {
        "category": "object",
        "remove_bg": True,
        "refs": [],
        "lineartNote": (
            "The main subject is the CARD. The bird is only a small simple child's drawing "
            "ON the card's front — keep it small and on the card; it may keep its one tiny "
            "dot eye."
        ),
        "prompt": (
            "A white handmade greeting card standing slightly open, with a child's drawing of "
            "a small blue bird on the front. "
        ),
    },
    "bird": {
        "category": "creature",
        "remove_bg": True,
        "refs": [(EYE_REF_LABEL, "eyes")],
        "lineartNote": (
            "The output must be strictly BLACK AND WHITE outline only — the bird must NOT "
            "stay blue or keep any colour."
        ),
        "prompt": (
            "A small round friendly blue bird, like a child's drawing of a bluebird, perched, "
            "side view. " + DOT_EYES + " "
        ),
    },
}


def b64(path: Path) -> str:
    return base64.b64encode(path.read_bytes()).decode("utf-8")


def call_gemini(parts, aspect=None):
    # Vertex requires an explicit role on contents; AI Studio merely tolerates it.
    payload = {"contents": [{"role": "user", "parts": parts}], "generationConfig": {"responseModalities": ["IMAGE"]}}
    if aspect:
        payload["generationConfig"]["imageConfig"] = {"aspectRatio": aspect}
    for attempt in range(MAX_RETRIES):
        try:
            url, headers = endpoint_and_headers()
            resp = requests.post(url, json=payload, headers=headers, timeout=120)
            if resp.status_code == 200:
                result = resp.json()
                for p in result.get("candidates", [{}])[0].get("content", {}).get("parts", []):
                    if "inlineData" in p:
                        return base64.b64decode(p["inlineData"]["data"])
                print("    WARNING: 200 but no image in response")
                return None
            if resp.status_code in (429, 503):
                wait = BACKOFF_BASE * (2**attempt)
                print(f"    Rate limited ({resp.status_code}), waiting {wait}s...")
                time.sleep(wait)
            else:
                print(f"    Error {resp.status_code}: {resp.text[:200]}")
                time.sleep(BACKOFF_BASE * (2**attempt))
        except Exception as e:  # noqa: BLE001 — retry on any transport error
            print(f"    Exception: {e}")
            time.sleep(BACKOFF_BASE)
    return None


def build_parts(spec):
    parts = []
    for label, ref_key in spec["refs"]:
        path = REF[ref_key]
        if not path.exists():
            print(f"    WARNING: reference {path} missing — generating without it")
            continue
        parts.append({"text": label})
        parts.append({"inlineData": {"mimeType": "image/png", "data": b64(path)}})
    suffix = BASE_STYLE + " " + LINE_WEIGHT
    if spec["remove_bg"]:
        suffix += " " + CLEAN_BG
    parts.append({"text": spec["prompt"] + suffix})
    return parts


def cmd_gen(only=None):
    if VERTEX_PROJECT:
        gcloud_token()  # fail fast if gcloud auth is unavailable
    elif not API_KEY:
        sys.exit("ERROR: GOOGLE_GEMINI_API_KEY not found in myphonics_books/.env")
    RAW.mkdir(parents=True, exist_ok=True)
    todo = {k: v for k, v in ASSETS.items() if (not only or k in only)}
    done = failed = skipped = 0
    for key, spec in todo.items():
        raw_path = RAW / f"{key}.png"
        if raw_path.exists() and not only:
            skipped += 1
            continue
        print(f"[{key}] generating ({spec['category']})...")
        data = call_gemini(build_parts(spec), aspect=spec.get("aspect"))
        if data:
            raw_path.write_bytes(data)
            print(f"[{key}] saved ({len(data) // 1024} KB)")
            done += 1
        else:
            print(f"[{key}] FAILED")
            failed += 1
        time.sleep(REQUEST_DELAY)
    print(f"\ngen done: {done} generated, {skipped} skipped (already on disk), {failed} failed")
    return failed


def remove_background(img: Image.Image) -> Image.Image:
    """Flood the near-uniform background to transparent from every border seed,
    then trim. Tolerant of the cream/grey reference backgrounds."""
    img = img.convert("RGBA")
    w, h = img.size
    # transparent WHITE, never a marker colour: resampling interpolates RGBA
    # channels independently, so any coloured fill bleeds visible fringes into
    # semi-transparent edge pixels when the image is later resized.
    fill = (255, 255, 255, 0)
    seeds = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)]
    for seed in seeds:
        if img.getpixel(seed)[3] != 0:
            ImageDraw.floodfill(img, seed, fill, thresh=48)
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    return img


def despeckle(img: Image.Image) -> Image.Image:
    """Drop tiny disconnected alpha components (floating twig fragments and
    removal residue), keeping every substantial part of the composition."""
    w, h = img.size
    alpha = img.getchannel("A").load()
    seen = [[False] * h for _ in range(w)]
    components = []
    for sx in range(w):
        for sy in range(h):
            if seen[sx][sy] or alpha[sx, sy] <= 40:
                continue
            stack, pixels = [(sx, sy)], []
            seen[sx][sy] = True
            while stack:
                x, y = stack.pop()
                pixels.append((x, y))
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[nx][ny] and alpha[nx, ny] > 40:
                        seen[nx][ny] = True
                        stack.append((nx, ny))
            components.append(pixels)
    if not components:
        return img
    largest = max(len(c) for c in components)
    keep_min = max(150, int(largest * 0.004))
    px = img.load()
    for c in components:
        if len(c) < keep_min:
            for x, y in c:
                px[x, y] = (0, 0, 0, 0)
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img


def binarise(img: Image.Image) -> Image.Image:
    """Force pure black and white (alpha kept): outlines stay black, every
    residual colour fill or tint flips to white. The deterministic guarantee
    behind the no-colour rule when a conversion keeps a tint."""
    img = img.convert("RGBA")
    px = img.load()
    w, h = img.size
    for x in range(w):
        for y in range(h):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            # black only where genuinely near-black (outlines, hair, dot eyes);
            # any colour FILL — even a dark one — flips to white, so tinted
            # clothing becomes white-with-outline like the rest of the set.
            px[x, y] = (0, 0, 0, a) if max(r, g, b) < 110 else (255, 255, 255, a)
    return img


def postprocess(img: Image.Image, remove_bg: bool, clean: bool = False, force_bw: bool = False) -> Image.Image:
    if remove_bg:
        img = remove_background(img)
    if clean:
        img = despeckle(img)
    if max(img.size) > 1200:
        scale = 1200 / max(img.size)
        img = img.resize((round(img.size[0] * scale), round(img.size[1] * scale)), Image.LANCZOS)
    # binarise LAST — after resizing — so resampling can never reintroduce a
    # tint into the visible pixels.
    if force_bw:
        img = binarise(img)
    return img


def cmd_process():
    """Trim the raw colour generations into _pending/colour/ — these are the
    book-faithful SOURCES the line-art conversion works from, not the final
    workbook assets."""
    COLOUR.mkdir(parents=True, exist_ok=True)
    count = 0
    for key, spec in ASSETS.items():
        raw_path = RAW / f"{key}.png"
        if not raw_path.exists():
            print(f"[{key}] no raw image — skipped")
            continue
        img = postprocess(Image.open(raw_path), spec["remove_bg"])
        img.save(COLOUR / f"{key}.png")
        count += 1
        print(f"[{key}] processed -> colour/{key}.png {img.size}")
    print(f"\nprocess done: {count} colour sources in {COLOUR}")


def lineart_kind(key: str, spec) -> str:
    """'creature' (preserve dot eyes) or 'object' (no eyes, no added dots)."""
    if spec.get("lineart"):
        return spec["lineart"]
    return "object" if spec["category"] == "object" else "creature"


def cmd_lineart(only=None):
    """Convert each colour source to the one black line-art treatment, anchored
    on an approved existing line-art asset. One subject per image — conversions
    keep the source composition, so nothing gets crowded."""
    RAW_LINEART.mkdir(parents=True, exist_ok=True)
    done = failed = skipped = 0
    for key, spec in ASSETS.items():
        if key == "cover_scene" or key in KEEP_EXISTING:
            continue  # the cover stays full colour; KEEP keys retain approved art
        if only and key not in only:
            continue
        src = COLOUR / f"{key}.png"
        out = RAW_LINEART / f"{key}.png"
        if out.exists() and not only:
            skipped += 1
            continue
        if not src.exists():
            print(f"[{key}] no colour source — skipped")
            continue
        kind = lineart_kind(key, spec)
        style_ref = LINEART_STYLE_REF_CREATURE if kind == "creature" else LINEART_STYLE_REF_OBJECT
        # the per-asset note leads the prompt — the model weights the opening most
        prompt = (spec.get("lineartNote", "") + " " if spec.get("lineartNote") else "")
        prompt += LINEART_CREATURE if kind == "creature" else LINEART_OBJECT
        print(f"[{key}] converting to line art ({kind})...")
        parts = [
            {"text": "LINE ART STYLE REFERENCE — match ONLY the drawing treatment of this image, never its subject:"},
            {"inlineData": {"mimeType": "image/png", "data": b64(style_ref)}},
            {"text": "INPUT ILLUSTRATION — convert THIS image:"},
            {"inlineData": {"mimeType": "image/png", "data": b64(src)}},
            {"text": prompt},
        ]
        data = call_gemini(parts)
        if data:
            out.write_bytes(data)
            print(f"[{key}] saved ({len(data) // 1024} KB)")
            done += 1
        else:
            print(f"[{key}] FAILED")
            failed += 1
        time.sleep(REQUEST_DELAY)
    print(f"\nlineart done: {done} converted, {skipped} skipped (already on disk), {failed} failed")
    return failed


def cmd_finalise():
    """Trim line art into _pending/ (the staged workbook assets), copy the
    curated cover scene, and write the manifest."""
    entries = []
    for key, spec in ASSETS.items():
        if key == "cover_scene":
            img = postprocess(Image.open(COVER_SOURCE), remove_bg=False)
            img.save(PENDING / "cover_scene.png")
            entries.append(
                {
                    "key": key,
                    "file": "_pending/cover_scene.png",
                    "category": "panel",
                    "treatment": "book colour art, curated (the hook)",
                    "source": str(COVER_SOURCE.relative_to(REPO)),
                    "status": "pending-approval",
                    "generatedAt": datetime.now(timezone.utc).isoformat(),
                }
            )
            print(f"[cover_scene] curated from {COVER_SOURCE.name} {img.size}")
            continue
        if key in KEEP_EXISTING:
            # already-approved live line art is retained; clear any stale staging
            (PENDING / f"{key}.png").unlink(missing_ok=True)
            entries.append(
                {
                    "key": key,
                    "file": f"{key}.png (live, approved)",
                    "category": spec["category"],
                    "treatment": "existing approved line art retained (manifest status ok)",
                    "status": "approved",
                }
            )
            print(f"[{key}] retained existing approved line art")
            continue
        raw_path = RAW_LINEART / f"{key}.png"
        if not raw_path.exists():
            print(f"[{key}] no line art — skipped")
            continue
        # every line-art final is binarised: pure black outlines, no colour
        # fringing or tint can survive the conversion (the cover never gets here)
        img = postprocess(Image.open(raw_path), remove_bg=True, clean=True, force_bw=True)
        img.save(PENDING / f"{key}.png")
        entries.append(
            {
                "key": key,
                "file": f"_pending/{key}.png",
                "colourSource": f"_pending/colour/{key}.png",
                "category": spec["category"],
                "treatment": "line-art (workbook)",
                "model": MODEL,
                "billing": f"vertex/{VERTEX_PROJECT}/{VERTEX_LOCATION}" if VERTEX_PROJECT else "ai-studio-key",
                "styleRef": str(
                    (LINEART_STYLE_REF_CREATURE if lineart_kind(key, spec) == "creature" else LINEART_STYLE_REF_OBJECT).relative_to(REPO)
                ),
                "references": [str(REF[r].relative_to(REPO)) for _, r in spec["refs"]],
                "colourPrompt": spec["prompt"] + BASE_STYLE + " " + LINE_WEIGHT + (" " + CLEAN_BG if spec["remove_bg"] else ""),
                "lineartPrompt": (LINEART_CREATURE if lineart_kind(key, spec) == "creature" else LINEART_OBJECT)
                + " " + spec.get("lineartNote", ""),
                "status": "pending-approval",
                "generatedAt": datetime.now(timezone.utc).isoformat(),
            }
        )
        print(f"[{key}] finalised -> {key}.png {img.size}")
    (PENDING / "manifest.json").write_text(json.dumps(entries, indent=2), encoding="utf-8")
    print(f"\nfinalise done: {len(entries)} assets, manifest at {PENDING / 'manifest.json'}")


def cmd_sheet():
    cell, pad, label_h = 300, 14, 26
    # pending finals, plus the retained approved assets (from the live folder)
    # so consistency can be judged side by side
    live = ENGINE / "public" / "clipart"
    files = {}
    for k in ASSETS:
        if k in KEEP_EXISTING and (live / f"{k}.png").exists():
            files[f"{k} (existing, kept)"] = live / f"{k}.png"
        elif (PENDING / f"{k}.png").exists():
            files[k] = PENDING / f"{k}.png"
    keys = list(files)
    cols = 5
    rows = (len(keys) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * (cell + pad) + pad, rows * (cell + label_h + pad) + pad), (244, 244, 248))
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype(str(ENGINE / "public" / "fonts" / "Andika-Regular.ttf"), 17)
    except OSError:
        font = ImageFont.load_default()
    for i, key in enumerate(keys):
        cx = pad + (i % cols) * (cell + pad)
        cy = pad + (i // cols) * (cell + label_h + pad)
        draw.rectangle([cx, cy, cx + cell, cy + cell], fill=(255, 255, 255), outline=(200, 200, 210))
        img = Image.open(files[key]).convert("RGBA")
        scale = min((cell - 16) / img.size[0], (cell - 16) / img.size[1])
        img = img.resize((max(1, round(img.size[0] * scale)), max(1, round(img.size[1] * scale))), Image.LANCZOS)
        sheet.paste(img, (cx + (cell - img.size[0]) // 2, cy + (cell - img.size[1]) // 2), img)
        draw.text((cx + 4, cy + cell + 4), key, fill=(30, 30, 40), font=font)
    OUT_SHEET.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT_SHEET)
    print(f"contact sheet: {OUT_SHEET} ({len(keys)} assets)")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    if cmd == "gen":
        sys.exit(1 if cmd_gen(only=sys.argv[2:] or None) else 0)
    elif cmd == "process":
        cmd_process()
    elif cmd == "lineart":
        sys.exit(1 if cmd_lineart(only=sys.argv[2:] or None) else 0)
    elif cmd == "finalise":
        cmd_finalise()
    elif cmd == "sheet":
        cmd_sheet()
    else:
        sys.exit(f"unknown command {cmd}")
