"""
Generate illustrations for L6.1 "The Marvellous Neighbourhood" using Gemini API.

Setting: Contemporary Cairo, Egypt — Nile corniche, apartment blocks, local bakery,
         neighbourhood street, distant pyramids on the hazy horizon.
Main character: Yusuf (Egyptian boy, 8-9 years old, yellow t-shirt, grey trousers)
Side character: The storyteller (Egyptian man, 60s, white shirt, light trousers,
                small worn brown leather notebook)

Pipeline:
  1. Generate hero reference image (Yusuf, neutral pose, full body)
  2. Inject hero into every scene alongside scene-specific prompt
  3. Storyteller described consistently in all scene prompts

Usage:
    py -3.12 scripts/generate_l6_1_images.py           # Generate all images
    py -3.12 scripts/generate_l6_1_images.py hero       # Hero reference only
    py -3.12 scripts/generate_l6_1_images.py scenes     # Scenes only (hero must exist)
    py -3.12 scripts/generate_l6_1_images.py recolour   # Recolour existing hero skin
"""

import asyncio
import aiohttp
import os
import sys
import base64
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.environ.get("GOOGLE_GEMINI_API_KEY")
BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
OUTPUT_DIR = Path(__file__).parent.parent / "output" / "images" / "L6_1_B1"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Eye style reference — approved hero with correct solid black dot eyes
EYE_REF_PATH = Path(__file__).parent.parent / "output" / "images" / "L4_1_B1" / "hero_reference.png"

REQUEST_DELAY = 3
MAX_RETRIES = 3
BACKOFF_BASE = 5

# ─── Skin & Hair ──────────────────────────────────────────────────
SKIN_HEX = "#8B6B4A"   # Medium-dark Egyptian/Arab skin tone
HAIR_HEX = "#1A1A1A"   # Near-black, short

STORYTELLER_SKIN_HEX = "#B8956A"   # Medium brown skin (older man)

# ─── Style ────────────────────────────────────────────────────────
BASE_STYLE = (
    "Whimsical children's book illustration. Hand-drawn cartoon style with "
    "soft watercolour textured backgrounds and clean black-outlined characters. "
    "CRITICAL EYE RULE: Every character MUST have eyes that are tiny solid black "
    "filled circles like dots drawn with a black marker pen. "
    "NO white around the black, NO iris, NO pupil, NO highlight, NO detail. "
    "Just small simple black dots — cute and friendly like a teddy bear's eyes. "
    "Warm, friendly, inviting. Soft pastel backgrounds with pops of bright colour. "
    "Simple rounded shapes, gentle lighting. Professional picture book quality. "
    "No text, words, letters, or numbers in the image (EXCEPT handwritten labels "
    "inside a notebook page when the scene requires it)."
)

# ─── Character Descriptions ──────────────────────────────────────
YUSUF_HERO = {
    "description": (
        f"A cartoon boy character, about 8-9 years old, with medium-dark Egyptian "
        f"skin — warm brown with an olive undertone, hex colour {SKIN_HEX}. "
        f"He has short neat black hair (hex {HAIR_HEX}), slightly rounded at the top. "
        f"He wears a bright sunshine-yellow t-shirt (short sleeves, collarless) "
        f"and light grey cotton trousers (full length, lightweight, neat fit). "
        f"Simple white trainers on his feet. "
        f"He has small friendly dot eyes — solid black filled circles with ZERO white — "
        f"no white highlight, no white reflection, no white dot, no shine, no pupil "
        f"detail. Just 100% solid black circles like ink dots. "
        f"A lively, expressive face. ABSOLUTELY NO rosy cheeks, NO blush marks, "
        f"NO pink or red circles on face — clean smooth warm brown skin on cheeks. "
        f"Standing in a neutral pose, facing the viewer, full body visible from "
        f"head to toe. Arms slightly away from body, feet shoulder-width apart. "
        f"Plain light cream solid-colour background (no scenery, no objects, no patterns)."
    ),
    "short": "the boy in the bright yellow t-shirt and light grey trousers with short black hair",
}

# Storyteller description — used consistently in all scene prompts
STORYTELLER_DESC = (
    f"Egyptian storyteller man (60s, medium brown skin hex {STORYTELLER_SKIN_HEX}, "
    f"short neat grey hair, short grey beard, warm patient eyes, "
    f"white linen collared shirt slightly crumpled, light stone-coloured trousers, "
    f"brown leather sandals, carries a small worn brown leather notebook)"
)

# Setting descriptions for consistency
CAIRO_STEPS = (
    "front steps of a cream-coloured Cairo apartment block, "
    "busy Cairo street behind — cars, palm trees, market stalls in the distance, "
    "cream-coloured blocks lining the road, bright blue sky"
)

CAIRO_CORNICHE = (
    "Nile corniche in Cairo — a wide road running along the broad grey-green Nile. "
    "White-sailed feluccas (traditional wooden sailing boats with tall triangular white sails) "
    "drift on the water. Modern Cairo apartment blocks line the far bank. "
    "Palm trees and green lampposts along the road."
)

CAIRO_STREET = (
    "Cairo neighbourhood street — cream-coloured apartment blocks, a slim white "
    "minaret rising above the rooftops, palm trees, parked cars, vivid blue sky"
)

# Notebook description for consistency
NOTEBOOK = "small worn brown leather notebook"

# ─── Scene Prompts ────────────────────────────────────────────────
SCENES = [
    {
        "name": "cover",
        "prompt": (
            f"Show the boy from the reference image on the Nile corniche in Cairo, "
            f"standing with arms spread wide and a huge delighted smile, "
            f"looking up at his neighbourhood. "
            f"{CAIRO_CORNICHE}. "
            f"Behind him: cream Cairo apartment blocks, a white minaret, "
            f"and — in the very far golden-hazy distance — the tiny silhouettes "
            f"of the three Giza pyramids, small and indistinct. "
            f"Warm golden afternoon light. Boy in yellow t-shirt, grey trousers, "
            f"white trainers. Skin colour {SKIN_HEX}. "
            f"Eyes: tiny solid black dots ONLY, no white. Portrait format 3:4."
        ),
    },
    {
        "name": "page1",
        "prompt": (
            f"Show the boy from the reference image sitting on {CAIRO_STEPS}. "
            f"He rests his chin on his hand, looking bored and glum. "
            f"He wears a bright yellow t-shirt and light grey cotton trousers. "
            f"BESIDE him (sitting down), {STORYTELLER_DESC} has just arrived "
            f"and is sitting on the step next to the boy with a friendly smile. "
            f"The storyteller holds his {NOTEBOOK}. "
            f"Boy's skin colour {SKIN_HEX}. "
            f"Eyes on BOTH characters: tiny solid black dots ONLY, no white. "
            f"Landscape format."
        ),
    },
    {
        "name": "page2",
        "prompt": (
            f"Show two characters sitting on apartment steps in Cairo: "
            f"1) The boy from the reference image (bright yellow t-shirt, light grey "
            f"trousers, short black hair, skin {SKIN_HEX}) — arms crossed, "
            f"looking sceptical. "
            f"2) {STORYTELLER_DESC} — leaning forward with sparkling eyes and "
            f"a warm smile, as if sharing a wonderful secret. "
            f"Cairo street behind them — cream-coloured blocks, palm trees, cars. "
            f"Eyes: tiny solid black dots ONLY, no white. Landscape format."
        ),
    },
    {
        "name": "page3",
        "prompt": (
            f"Show two characters standing together on the {CAIRO_CORNICHE}. "
            f"1) The boy from the reference image (bright yellow t-shirt, light grey "
            f"trousers, short black hair, skin {SKIN_HEX}) — staring at the broad "
            f"grey-green Nile with wide wondering eyes, mouth slightly open in awe. "
            f"2) {STORYTELLER_DESC} — standing beside him, one arm raised "
            f"gesturing toward the river in a grand, sweeping motion. "
            f"White-sailed feluccas visible on the Nile. "
            f"Eyes: tiny solid black dots ONLY. Landscape format."
        ),
    },
    {
        "name": "page4",
        "prompt": (
            f"Show two characters at the open doorway of a small neighbourhood "
            f"bakery in Cairo. The bakery is set in a cream-coloured building "
            f"with painted green shutters. "
            f"Inside the doorway: an older baker in a white apron holds out "
            f"a warm round golden flatbread (aish baladi). Steam rises from "
            f"a clay bread oven visible behind him. "
            f"1) The boy from the reference image (bright yellow t-shirt, light grey "
            f"trousers, skin {SKIN_HEX}) — eyes wide at the bread, mouth open. "
            f"2) {STORYTELLER_DESC} — standing beside the boy, smiling at the baker. "
            f"Warm golden tones fill the scene. "
            f"Eyes on ALL characters: tiny solid black dots ONLY. Landscape format."
        ),
    },
    {
        "name": "page5",
        "prompt": (
            f"Show two characters walking along a {CAIRO_STREET}. "
            f"1) The boy from the reference image (bright yellow t-shirt, light grey "
            f"trousers, short black hair, skin {SKIN_HEX}) — looking UP at the "
            f"slim white minaret rising above the rooftops, expression thoughtful "
            f"and curious (less bored now). "
            f"2) {STORYTELLER_DESC} — pointing upward at the minaret "
            f"with one finger, smiling warmly. "
            f"On a low sunny wall nearby: three street cats — one orange, one grey, "
            f"one white — lounging contentedly. "
            f"Eyes on ALL characters AND cats: tiny solid black dots ONLY. "
            f"Landscape format."
        ),
    },
    {
        "name": "page6",
        "prompt": (
            f"Show the boy from the reference image ALONE standing on an open "
            f"stretch of the Nile corniche, arms slightly spread, gazing around "
            f"him with wide amazed eyes and a look of pure wonder on his face. "
            f"He wears bright yellow t-shirt and light grey trousers (skin {SKIN_HEX}). "
            f"Behind him: Cairo skyline — cream apartment blocks, a white minaret, "
            f"and FAR in the golden dusty hazy distance the unmistakeable "
            f"silhouettes of the THREE GIZA PYRAMIDS — small and hazy but "
            f"clearly the three pyramids in a row. "
            f"The Nile shimmers to one side. Warm golden afternoon light. "
            f"Eyes: tiny solid black dots ONLY. Landscape format."
        ),
    },
    {
        "name": "page7",
        "prompt": (
            f"Show two characters in a Cairo neighbourhood: "
            f"1) The boy from the reference image (bright yellow t-shirt, light grey "
            f"trousers, short black hair, skin {SKIN_HEX}) — sitting on a low wall, "
            f"a {NOTEBOOK} open on his lap, a blue biro pen in his hand, "
            f"tongue slightly out in concentration as he writes. "
            f"The open notebook page is CLEARLY VISIBLE and shows a simple "
            f"hand-drawn neighbourhood map with these handwritten labels: "
            f"'The Marvellous Corniche', 'The Enormous Nile', 'The Famous Bakery', "
            f"'The Joyous Market', 'The Glorious Minaret'. "
            f"2) {STORYTELLER_DESC} — standing beside the boy, smiling warmly, "
            f"looking at the notebook with pride. "
            f"Cairo neighbourhood background (blocks, palm trees, minaret). "
            f"The notebook labels MUST be legible in the illustration. "
            f"Eyes: tiny solid black dots ONLY. Landscape format."
        ),
    },
    {
        "name": "page8",
        "prompt": (
            f"Show the boy from the reference image ALONE sitting happily on the "
            f"front steps of his cream-coloured Cairo apartment block. "
            f"He wears bright yellow t-shirt and light grey trousers (skin {SKIN_HEX}). "
            f"He holds the {NOTEBOOK} open on his lap and smiles contentedly "
            f"at the busy street. He looks HAPPY and at peace — not bored at all. "
            f"The notebook page shows 'My Marvellous Home' written at the bottom. "
            f"The Cairo street is alive around him: vendors, street cats, "
            f"distant minaret, palm trees catching golden evening light. "
            f"Warm glowing sunset colours fill the scene. "
            f"No storyteller in this scene — the boy is alone. "
            f"Eyes: tiny solid black dots ONLY. Landscape format."
        ),
    },
]


# ─── API Functions ────────────────────────────────────────────────

async def recolour_hero(
    session: aiohttp.ClientSession, hero_path: Path, output_path: Path
) -> "Path | None":
    """Recolour existing hero image to target skin/hair hex values."""
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"
    hero_b64 = base64.b64encode(hero_path.read_bytes()).decode("utf-8")

    parts = [
        {"inlineData": {"mimeType": "image/png", "data": hero_b64}},
        {"text": (
            f"Edit this character image. Change ONLY the skin colour and hair colour. "
            f"Keep everything else EXACTLY the same — same pose, same outfit, same eyes, "
            f"same background, same style. "
            f"New SKIN colour: {SKIN_HEX} (warm medium-dark Egyptian/Arab brown with olive undertone). "
            f"New HAIR colour: {HAIR_HEX} (near-black). "
            f"Do NOT change the clothes, eyes, expression, pose, or background."
        )},
    ]

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }

    print(f"  [recolour] Adjusting skin to {SKIN_HEX}, hair to {HAIR_HEX}...")

    for attempt in range(MAX_RETRIES):
        try:
            async with session.post(url, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    candidates = result.get("candidates", [])
                    if candidates:
                        resp_parts = candidates[0].get("content", {}).get("parts", [])
                        for part in resp_parts:
                            if "inlineData" in part:
                                image_data = base64.b64decode(part["inlineData"]["data"])
                                output_path.write_bytes(image_data)
                                size_kb = len(image_data) / 1024
                                print(f"  [recolour] Saved ({size_kb:.0f} KB) -> {output_path}")
                                return output_path
                    print("  [recolour] No image data in response")
                    return None
                elif response.status == 429:
                    wait = BACKOFF_BASE * (2 ** attempt)
                    print(f"  [recolour] Rate limited. Waiting {wait}s...")
                    await asyncio.sleep(wait)
                elif response.status == 503:
                    wait = BACKOFF_BASE * (2 ** attempt)
                    print(f"  [recolour] Service unavailable. Waiting {wait}s...")
                    await asyncio.sleep(wait)
                else:
                    text = await response.text()
                    print(f"  [recolour] API error {response.status}: {text[:300]}")
                    if attempt < MAX_RETRIES - 1:
                        await asyncio.sleep(BACKOFF_BASE * (2 ** attempt))
        except Exception as e:
            print(f"  [recolour] Error: {e}")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(BACKOFF_BASE)
    return None


async def generate_hero_image(
    session: aiohttp.ClientSession, hero_info: dict, output_path: Path
) -> "Path | None":
    """Generate hero reference image with eye-style reference injection."""
    full_prompt = f"{hero_info['description']} {BASE_STYLE}"
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"

    parts = []
    if EYE_REF_PATH.exists():
        eye_b64 = base64.b64encode(EYE_REF_PATH.read_bytes()).decode("utf-8")
        parts.append({
            "text": (
                "EYE STYLE REFERENCE — The new character MUST have the EXACT same "
                "eye style as this character. Look at the eyes: they are tiny solid "
                "black dots with no white highlights, no reflections, no detail. "
                "Copy this eye style exactly:"
            )
        })
        parts.append({"inlineData": {"mimeType": "image/png", "data": eye_b64}})
        parts.append({
            "text": (
                f"Now generate a NEW character (different person, different outfit, "
                f"different skin tone) but with the SAME tiny solid black dot eye "
                f"style as the reference above. Here is the character to generate: "
                f"{full_prompt}"
            )
        })
    else:
        print("  WARNING: No eye reference found. Hero eyes may not be correct.")
        parts.append({"text": full_prompt})

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }

    print(f"  [hero] Generating {output_path.name}...")

    for attempt in range(MAX_RETRIES):
        try:
            async with session.post(url, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    candidates = result.get("candidates", [])
                    if candidates:
                        resp_parts = candidates[0].get("content", {}).get("parts", [])
                        for part in resp_parts:
                            if "inlineData" in part:
                                image_data = base64.b64decode(part["inlineData"]["data"])
                                output_path.write_bytes(image_data)
                                size_kb = len(image_data) / 1024
                                print(f"  [hero] Saved ({size_kb:.0f} KB) -> {output_path}")
                                return output_path
                    print("  [hero] No image data in response")
                    return None
                elif response.status == 429:
                    wait = BACKOFF_BASE * (2 ** attempt)
                    print(f"  [hero] Rate limited. Waiting {wait}s...")
                    await asyncio.sleep(wait)
                elif response.status == 503:
                    wait = BACKOFF_BASE * (2 ** attempt)
                    print(f"  [hero] Service unavailable. Waiting {wait}s...")
                    await asyncio.sleep(wait)
                else:
                    text = await response.text()
                    print(f"  [hero] API error {response.status}: {text[:300]}")
                    if attempt < MAX_RETRIES - 1:
                        await asyncio.sleep(BACKOFF_BASE * (2 ** attempt))
        except Exception as e:
            print(f"  [hero] Request error: {e}")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(BACKOFF_BASE)
    return None


async def generate_scene_image(
    session: aiohttp.ClientSession,
    hero_b64: str,
    eye_ref_b64: "str | None",
    scene: dict,
) -> "bytes | None":
    """Generate a scene image using Gemini with hero reference + eye style reference."""
    full_prompt = f"{scene['prompt']} {BASE_STYLE}"
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"

    parts = []

    # Eye style reference FIRST
    if eye_ref_b64:
        parts.append({
            "text": (
                "EYE STYLE REFERENCE — ALL characters in this scene MUST have the "
                "EXACT same eye style as this character. The eyes are tiny solid "
                "black dots with ZERO white — no highlights, no reflections, no "
                "sclera visible. Copy this eye style exactly:"
            )
        })
        parts.append({"inlineData": {"mimeType": "image/png", "data": eye_ref_b64}})

    # Hero reference
    parts.append({
        "text": (
            f"CHARACTER REFERENCE — YUSUF (the boy). Keep his exact appearance: "
            f"medium-dark Egyptian skin {SKIN_HEX}, short neat black hair {HAIR_HEX}, "
            f"bright yellow t-shirt, light grey cotton trousers, white trainers. "
            f"Eyes must be solid black dots exactly like the eye reference above:"
        )
    })
    parts.append({"inlineData": {"mimeType": "image/png", "data": hero_b64}})

    parts.append({"text": f"SCENE TO GENERATE: {full_prompt}"})

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }

    for attempt in range(MAX_RETRIES):
        try:
            async with session.post(url, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    candidates = result.get("candidates", [])
                    if candidates:
                        resp_parts = candidates[0].get("content", {}).get("parts", [])
                        for part in resp_parts:
                            if "inlineData" in part:
                                return base64.b64decode(part["inlineData"]["data"])
                    print(f"    No image data in response")
                    return None
                elif response.status == 429:
                    wait = BACKOFF_BASE * (2 ** attempt)
                    print(f"    Rate limited. Waiting {wait}s...")
                    await asyncio.sleep(wait)
                elif response.status == 503:
                    wait = BACKOFF_BASE * (2 ** attempt)
                    print(f"    Service unavailable. Waiting {wait}s...")
                    await asyncio.sleep(wait)
                else:
                    text = await response.text()
                    print(f"    API error {response.status}: {text[:300]}")
                    if attempt < MAX_RETRIES - 1:
                        await asyncio.sleep(BACKOFF_BASE * (2 ** attempt))
        except Exception as e:
            print(f"    Request error: {e}")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(BACKOFF_BASE)
    return None


# ─── Main ─────────────────────────────────────────────────────────

async def main():
    mode = sys.argv[1].lower() if len(sys.argv) > 1 else "all"

    if not GEMINI_API_KEY:
        print("ERROR: GOOGLE_GEMINI_API_KEY not found in .env")
        sys.exit(1)

    print(f"\n{'='*60}")
    print(f'L6.1: "The Marvellous Neighbourhood" — Cairo, Egypt')
    print(f"Output: {OUTPUT_DIR}")
    print(f"Mode: {mode}")
    print(f"{'='*60}")

    hero_path = OUTPUT_DIR / "hero_reference.png"

    async with aiohttp.ClientSession() as session:

        # Recolour mode
        if mode == "recolour":
            if not hero_path.exists():
                print("ERROR: hero_reference.png must exist. Run with 'hero' mode first.")
                sys.exit(1)
            result = await recolour_hero(session, hero_path, hero_path)
            if not result:
                print("FATAL: Could not recolour hero")
                sys.exit(1)
            print("\nRecolour done. Please review hero_reference.png before generating scenes.")
            return

        # Step 1: Generate hero reference
        if mode in ("all", "hero"):
            if not hero_path.exists() or mode == "hero":
                result = await generate_hero_image(session, YUSUF_HERO, hero_path)
                if not result:
                    print("FATAL: Could not generate hero reference")
                    sys.exit(1)
                print(f"\n*** HERO GENERATED ***")
                print(f"*** Please review: {hero_path} ***")
                print(f"*** Check: correct skin ({SKIN_HEX}), yellow t-shirt, grey trousers, "
                      f"solid black dot eyes, NO rosy cheeks ***")
                await asyncio.sleep(REQUEST_DELAY)

        if mode == "hero":
            print("\nHero-only mode — done. Review hero before running scenes.")
            return

        # Step 2: Load hero as base64
        if not hero_path.exists():
            print("ERROR: hero_reference.png not found. Run with 'hero' first.")
            sys.exit(1)

        hero_b64 = base64.b64encode(hero_path.read_bytes()).decode("utf-8")

        # Load eye reference
        eye_ref_b64 = None
        if EYE_REF_PATH.exists():
            eye_ref_b64 = base64.b64encode(EYE_REF_PATH.read_bytes()).decode("utf-8")
            print(f"\n  Loaded: hero ({len(hero_b64)//1024}KB), eye ref ({len(eye_ref_b64)//1024}KB)")
        else:
            print(f"\n  WARNING: Eye reference not found at {EYE_REF_PATH}")
            print(f"  Loaded: hero ({len(hero_b64)//1024}KB), NO eye ref")

        # Step 3: Generate scenes
        print(f"\n  Generating {len(SCENES)} scenes...\n")
        generated = []
        failed = []

        for scene in SCENES:
            output_path = OUTPUT_DIR / f"{scene['name']}.png"

            if output_path.exists() and mode != "scenes":
                print(f"  [{scene['name']}] Already exists, skipping")
                generated.append(scene['name'])
                continue

            print(f"  [{scene['name']}] Generating...")
            image_bytes = await generate_scene_image(session, hero_b64, eye_ref_b64, scene)

            if image_bytes:
                output_path.write_bytes(image_bytes)
                size_kb = len(image_bytes) / 1024
                print(f"  [{scene['name']}] Saved ({size_kb:.0f} KB)")
                generated.append(scene['name'])
            else:
                print(f"  [{scene['name']}] FAILED")
                failed.append(scene['name'])

            await asyncio.sleep(REQUEST_DELAY)

        total = len(SCENES)
        print(f"\n{'='*60}")
        print(f"Generated: {len(generated)}/{total}")
        if failed:
            print(f"Failed: {', '.join(failed)}")
            print("To retry: delete the failed files and re-run with 'scenes'")
        else:
            print("All images generated successfully!")
        print(f"Output: {OUTPUT_DIR}")
        print(f"{'='*60}")


if __name__ == "__main__":
    asyncio.run(main())
