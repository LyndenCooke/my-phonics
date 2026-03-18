"""
Generate illustrations for L5.3 "Sure She Can!" using Gemini API.

Setting: Jaipur, Rajasthan, India — rooftop, Makar Sankranti kite festival.
Main character: Indian girl (6 years old, yellow festival kurta)
Side character: Dadaji (grandfather, cream angrakha, saffron pagri)

Pipeline:
  1. Generate hero reference image (girl, neutral pose, full body)
  2. Inject hero into every scene alongside scene-specific prompt
  3. Dadaji described in scene prompts (consistent description each time)

Usage:
    py -3.12 scripts/generate_l5_3_images.py           # Generate all images
    py -3.12 scripts/generate_l5_3_images.py hero       # Hero reference only
    py -3.12 scripts/generate_l5_3_images.py scenes     # Scenes only (hero must exist)
    py -3.12 scripts/generate_l5_3_images.py recolour   # Recolour existing hero skin
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
OUTPUT_DIR = Path(__file__).parent.parent / "output" / "images" / "L5_3_B1"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Eye style reference — approved hero with correct solid black dot eyes
EYE_REF_PATH = Path(__file__).parent.parent / "output" / "images" / "L4_1_B1" / "hero_reference.png"

REQUEST_DELAY = 3
MAX_RETRIES = 3
BACKOFF_BASE = 5

# ─── Skin & Hair ──────────────────────────────────────────────────
SKIN_HEX = "#8B6B4A"   # Medium-dark South Asian skin
HAIR_HEX = "#0D0D0D"   # Near-black

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
    "No text, words, letters, or numbers in the image."
)

# ─── Character Descriptions ──────────────────────────────────────
GIRL_HERO = {
    "description": (
        f"A cartoon girl character, about 6 years old, with medium-dark South Asian "
        f"skin — warm brown with a golden undertone, hex colour {SKIN_HEX}. "
        f"She has dark black straight hair (hex {HAIR_HEX}) worn in two neat braids, "
        f"each tied at the end with a small bright yellow ribbon. "
        f"She wears a bright sunshine-yellow kurta (traditional Indian long top, "
        f"long sleeves, reaches mid-thigh) and matching bright yellow salwar "
        f"(loose trousers that cover the legs fully). Simple flat sandals. "
        f"She has small friendly dot eyes — solid black filled circles with ZERO white — "
        f"no white highlight, no white reflection, no white dot, no shine, no pupil "
        f"detail. Just 100% solid black circles like ink dots. "
        f"A cheerful, expressive face. ABSOLUTELY NO rosy cheeks, NO blush marks, "
        f"NO pink or red circles on face — clean smooth warm brown skin on cheeks. "
        f"Standing in a neutral pose, facing the viewer, full body visible from "
        f"head to toe. Arms slightly away from body, feet shoulder-width apart. "
        f"Plain light cream solid-colour background (no scenery, no objects, no patterns)."
    ),
    "short": "the girl in the bright yellow kurta and salwar with two black braids",
}

# Dadaji description used consistently in all scene prompts
DADAJI_DESC = (
    "elderly Indian grandfather (65+ years old, medium-dark South Asian skin "
    f"hex {SKIN_HEX}, short white-grey hair, short neat white beard, cream "
    "angrakha-style kurta with loose cream trousers, small saffron-orange "
    "Rajasthani pagri/turban on his head, warm patient expression)"
)

# Setting description used consistently in scene prompts
SETTING_DESC = (
    "Jaipur rooftop setting: flat rooftop of a traditional house, pink sandstone "
    "buildings visible all around, terracotta pots at edges, vivid clear blue "
    "winter sky with dozens of colourful diamond-shaped kites (red, green, blue, "
    "orange, yellow) visible at various heights"
)

# Kite descriptions for consistency
YELLOW_KITE = (
    "bright yellow diamond-shaped kite made of thin yellow paper on a "
    "crossed bamboo frame with a white string"
)
BAMBOO_STICKS = "two thin pale bamboo sticks, each about 40cm long"
TORN_PAPER = (
    "a large sheet of thin white paper with a long diagonal rip "
    "splitting it in two"
)

# ─── Scene Prompts ────────────────────────────────────────────────
SCENES = [
    {
        "name": "cover",
        "prompt": (
            f"Show the girl from the reference image on a Jaipur rooftop, "
            f"holding up {YELLOW_KITE} triumphantly with both hands. "
            f"She grins with pure joy. Beside her, {DADAJI_DESC} claps his hands "
            f"with delight. Pink sandstone buildings surround them. "
            f"Dozens of colourful kites fill a vivid blue winter sky. "
            f"Girl wears bright yellow kurta and salwar. Skin colour {SKIN_HEX}. "
            f"Eyes: tiny solid black dots ONLY, no white. Portrait format 3:4."
        ),
    },
    {
        "name": "page1",
        "prompt": (
            f"Show the girl from the reference image ALONE on a Jaipur rooftop, "
            f"standing at the edge looking up at the sky with wide wondering eyes "
            f"and open mouth. {SETTING_DESC}. Dozens of colourful kites "
            f"(red, green, blue, orange) fill the sky around her. "
            f"Girl wears bright yellow kurta and salwar. Skin colour {SKIN_HEX}. "
            f"No other character in this scene. "
            f"Eyes: tiny solid black dots ONLY, no white. Landscape format."
        ),
    },
    {
        "name": "page2",
        "prompt": (
            f"Show two characters on a Jaipur rooftop: "
            f"1) The girl from the reference image (bright yellow kurta and salwar, "
            f"two black braids) leaning forward with excitement and bright attention. "
            f"2) {DADAJI_DESC} sitting cross-legged nearby, smiling warmly. "
            f"He holds up {BAMBOO_STICKS} in one hand and a thin white sheet of "
            f"paper in the other. Blue sky with colourful kites behind them. "
            f"Skin colour {SKIN_HEX} for both characters. "
            f"Eyes: tiny solid black dots ONLY. Landscape format."
        ),
    },
    {
        "name": "page3",
        "prompt": (
            f"Show two characters on a Jaipur rooftop: "
            f"1) The girl from the reference image (bright yellow kurta and salwar, "
            f"two black braids) kneeling on the floor, carefully tying "
            f"{BAMBOO_STICKS} together in a cross (+) shape with white string. "
            f"Her tongue is slightly out in concentration. "
            f"2) {DADAJI_DESC} crouching beside her, pointing gently at the "
            f"crossing point of the sticks with one finger. "
            f"Blue sky with colourful kites behind them. Skin colour {SKIN_HEX}. "
            f"Eyes: tiny solid black dots ONLY. Landscape format."
        ),
    },
    {
        "name": "page4",
        "prompt": (
            f"Show two characters on a Jaipur rooftop: "
            f"1) The girl from the reference image (bright yellow kurta and salwar, "
            f"two black braids) pressing {TORN_PAPER} onto a bamboo cross frame "
            f"on the floor. The paper is clearly TORN with a long diagonal rip. "
            f"Her expression shows clear dismay and disappointment — brows "
            f"furrowed, mouth downturned. "
            f"2) {DADAJI_DESC} sitting nearby with a calm, patient expression. "
            f"Blue sky behind them. Skin colour {SKIN_HEX}. "
            f"Eyes: tiny solid black dots ONLY. Landscape format."
        ),
    },
    {
        "name": "page5",
        "prompt": (
            f"Show two characters on a Jaipur rooftop: "
            f"1) The girl from the reference image (bright yellow kurta and salwar, "
            f"two black braids) sitting with arms crossed and brow furrowed in "
            f"clear frustration. The crumpled torn paper lies on the floor beside "
            f"her. She looks away from Dadaji. "
            f"2) {DADAJI_DESC} sitting nearby looking at her with complete calm "
            f"and gentle patience, hands resting quietly in his lap. "
            f"Blue sky with kites behind them. Skin colour {SKIN_HEX}. "
            f"Eyes: tiny solid black dots ONLY. Landscape format."
        ),
    },
    {
        "name": "page6",
        "prompt": (
            f"Show two characters on a Jaipur rooftop: "
            f"1) The girl from the reference image (bright yellow kurta and salwar, "
            f"two black braids) kneeling on the floor, pressing a fresh sheet of "
            f"white paper carefully and slowly flat onto a bamboo cross frame. "
            f"Her expression shows calm focused determination — she is working "
            f"very carefully this time. A small round clay pot of paste sits "
            f"beside the frame. "
            f"2) {DADAJI_DESC} watching with a proud, encouraging smile. "
            f"Skin colour {SKIN_HEX}. "
            f"Eyes: tiny solid black dots ONLY. Landscape format."
        ),
    },
    {
        "name": "page7",
        "prompt": (
            f"Show two characters on a Jaipur rooftop: "
            f"1) The girl from the reference image (bright yellow kurta and salwar, "
            f"two black braids) RUNNING across the rooftop with arms raised high, "
            f"holding {YELLOW_KITE} aloft. White string trails behind her. "
            f"Her face is full of excitement and effort, mouth open with joy. "
            f"2) {DADAJI_DESC} standing at the rooftop edge, smiling and pointing "
            f"upward encouragingly. "
            f"{SETTING_DESC}. Skin colour {SKIN_HEX}. "
            f"Eyes: tiny solid black dots ONLY. Landscape format."
        ),
    },
    {
        "name": "page8",
        "prompt": (
            f"{YELLOW_KITE} soars very HIGH in a vivid clear blue sky above pink "
            f"Jaipur sandstone buildings. Other colourful kites (red, green, blue) "
            f"surround it. "
            f"Below on the rooftop: 1) The girl from the reference image (bright "
            f"yellow kurta and salwar, two black braids) throws both arms in the "
            f"air with a huge radiant smile of pure joy, face tilted up to the sky. "
            f"2) {DADAJI_DESC} claps his hands beside her with great joy. "
            f"On the neighbouring rooftop (visible in background), two people wave "
            f"and cheer. Skin colour {SKIN_HEX}. "
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
            f"New SKIN colour: {SKIN_HEX} (warm medium-dark South Asian brown). "
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
            f"CHARACTER REFERENCE — GIRL. Keep her exact appearance: "
            f"medium-dark South Asian skin {SKIN_HEX}, dark black hair {HAIR_HEX} "
            f"in two braids with yellow ribbons, bright yellow kurta and salwar. "
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

    print(f"\n{'='*55}")
    print(f'L5.3: "Sure She Can!" — Jaipur, India')
    print(f"Output: {OUTPUT_DIR}")
    print(f"Mode: {mode}")
    print(f"{'='*55}")

    hero_path = OUTPUT_DIR / "hero_reference.png"

    async with aiohttp.ClientSession() as session:

        # Recolour mode — adjust skin on existing hero
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
                result = await generate_hero_image(session, GIRL_HERO, hero_path)
                if not result:
                    print("FATAL: Could not generate hero reference")
                    sys.exit(1)
                print(f"\n*** HERO GENERATED ***")
                print(f"*** Please review: {hero_path} ***")
                print(f"*** Check: correct skin ({SKIN_HEX}), yellow kurta, two braids, solid black dot eyes ***")
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
        print(f"\n{'='*55}")
        print(f"Generated: {len(generated)}/{total}")
        if failed:
            print(f"Failed: {', '.join(failed)}")
            print("To retry: delete the failed files and re-run with 'scenes'")
        else:
            print("All images generated successfully!")
        print(f"Output: {OUTPUT_DIR}")
        print(f"{'='*55}")


if __name__ == "__main__":
    asyncio.run(main())
