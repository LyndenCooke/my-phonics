"""
Generate illustrations for L5.4 "A Place for Me" using Gemini API.

Setting: Salvador, Bahia, Brazil — Pelourinho district, contemporary street party.
Main character: British-European girl (ginger plait, teal hoodie, grey leggings)
Side character: Afro-Brazilian boy (natural afro, orange t-shirt, cargo shorts)

Pipeline:
  1. Generate hero reference image (girl, neutral pose, full body)
  2. Inject hero into every scene alongside scene-specific prompts
  3. Boy described in scene prompts (consistent description each time)

Usage:
    py -3.12 scripts/generate_l5_4_images.py           # Generate all images
    py -3.12 scripts/generate_l5_4_images.py hero      # Hero reference only
    py -3.12 scripts/generate_l5_4_images.py scenes    # Scenes only (hero must exist)
    py -3.12 scripts/generate_l5_4_images.py recolour  # Recolour existing hero skin
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
IMAGE_MODEL = "gemini-2.5-flash-image"  # Image generation model
OUTPUT_DIR = Path(__file__).parent.parent / "output" / "images" / "L5_4_B1"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Eye style reference — approved hero with correct solid black dot eyes
EYE_REF_PATH = Path(__file__).parent.parent / "output" / "images" / "L4_1_B1" / "hero_reference.png"

REQUEST_DELAY = 3
MAX_RETRIES = 3
BACKOFF_BASE = 5

# ─── Skin & Hair ──────────────────────────────────────────────────
GIRL_SKIN_HEX = "#F0D0B0"  # Light Northern European skin
GIRL_HAIR_HEX = "#D2691E"  # Reddish-ginger
BOY_SKIN_HEX = "#4E3524"   # Dark Afro-Brazilian
BOY_HAIR_HEX = "#0D0D0D"   # Near-black

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
        f"A cartoon girl character, about 6 years old, with fair/light Northern European "
        f"skin — peach tone, hex colour {GIRL_SKIN_HEX}. "
        f"She has reddish-ginger hair (hex {GIRL_HAIR_HEX}) worn in a long single plait "
        f"down her back, reaching to her waist. "
        f"She wears a teal/turquoise hoodie (long sleeves, reaching to hips), "
        f"grey leggings (full length, covering to ankles), and bright green trainers. "
        f"She has small friendly dot eyes — solid black filled circles with ZERO white — "
        f"no white highlight, no white reflection, no white dot, no shine, no pupil "
        f"detail. Just 100% solid black circles like ink dots. "
        f"A warm, friendly, expressive face. ABSOLUTELY NO rosy cheeks, NO blush marks, "
        f"NO pink or red circles on face — clean smooth light skin on cheeks. "
        f"Standing in a neutral pose, facing the viewer, full body visible from "
        f"head to toe. Arms slightly away from body, feet shoulder-width apart. "
        f"Plain light cream solid-colour background (no scenery, no objects, no patterns)."
    ),
    "short": "the girl in the teal hoodie, grey leggings, and ginger plait",
}

# Boy description used consistently in all scene prompts
BOY_DESC = (
    "Afro-Brazilian boy (6 years old, dark skin hex #4E3524 with warm undertone, "
    f"natural afro hairstyle with black-near-black hair hex {BOY_HAIR_HEX}, "
    "bright orange t-shirt with short sleeves, cargo shorts in khaki that reach "
    "to below the knee (modesty: full leg coverage), white trainers, warm welcoming "
    "expression with genuine smile)"
)

# Salvador street party setting
SETTING_DESC = (
    "Contemporary Salvador, Bahia street scene: colourful Pelourinho buildings "
    "(pastel yellow, blue, pink, orange), historic architecture with modern tropical feel, "
    "bright daylight, lively street party atmosphere with energy and celebration"
)

# ─── Recurring Objects ────────────────────────────────────────────
DRUMS_DESC = (
    "colourful painted wooden drums in red, blue, and bright yellow"
)
ACARAJE_DESC = (
    "golden-brown acarajé on a white paper plate with warm steam visible"
)
MURALS_DESC = (
    "colourful street art murals in bright turquoise, hot pink, sunshine yellow, and lime green"
)
VENDOR_STALL_DESC = (
    "bright yellow food vendor stall with tropical fruit and food items visible"
)

async def save_image(data: bytes, filename: str) -> Path:
    """Save image data to file."""
    filepath = OUTPUT_DIR / filename
    with open(filepath, "wb") as f:
        f.write(data)
    print(f"[OK] Saved: {filename}")
    return filepath

async def load_image_as_b64(image_path: Path) -> str:
    """Load image and convert to base64."""
    if not image_path.exists():
        print(f"[ERR] Image not found: {image_path}")
        return None
    with open(image_path, "rb") as f:
        return base64.standard_b64encode(f.read()).decode("utf-8")

async def generate_with_retry(
    session: aiohttp.ClientSession,
    prompt_parts: list,
    retries: int = MAX_RETRIES
) -> bytes:
    """Generate image with retry logic."""
    for attempt in range(retries):
        try:
            url = f"{BASE_URL}/models/{IMAGE_MODEL}:generateContent?key={GEMINI_API_KEY}"

            payload = {
                "contents": [{"parts": prompt_parts}],
                "generationConfig": {"responseModalities": ["IMAGE"]}
            }

            async with session.post(url, json=payload) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    # Check if response has expected structure
                    if ("candidates" in result and
                        len(result.get("candidates", [])) > 0 and
                        "content" in result["candidates"][0] and
                        "parts" in result["candidates"][0]["content"] and
                        len(result["candidates"][0]["content"].get("parts", [])) > 0):

                        part = result["candidates"][0]["content"]["parts"][0]
                        if "inlineData" in part and "data" in part["inlineData"]:
                            image_data = part["inlineData"]["data"]
                            import base64
                            return base64.b64decode(image_data)
                        elif "text" in part:
                            # API returned text instead of image (probably error/refusal)
                            print(f"  API response: {part['text'][:200]}")
                            return None
                        else:
                            print(f"  Response missing inlineData. Got: {list(part.keys())}")
                            return None
                    else:
                        print(f"  Response missing candidates/content/parts. Got keys: {list(result.keys())}")
                        return None
                elif resp.status == 429:
                    wait_time = BACKOFF_BASE ** attempt
                    print(f"  Rate limited. Waiting {wait_time}s...")
                    await asyncio.sleep(wait_time)
                else:
                    text = await resp.text()
                    print(f"  Error {resp.status}: {text[:200]}")
                    return None

        except Exception as e:
            print(f"  Attempt {attempt + 1} failed: {e}")
            if attempt < retries - 1:
                await asyncio.sleep(REQUEST_DELAY)

    return None

async def generate_hero(session: aiohttp.ClientSession, eye_ref_b64: str):
    """Generate hero reference image with eye style injection."""
    print("\n[Hero] Generating hero reference (girl)...")

    parts = [
        {"text": "EYE STYLE REFERENCE — This character has the exact eye style you must copy. Look carefully: tiny solid black dots with absolutely NO white, NO reflections, NO details. Just simple black dots like a marker dot. Copy this eye style EXACTLY for the new character:"},
        {"inlineData": {"mimeType": "image/png", "data": eye_ref_b64}},
        {"text": f"Now generate a DIFFERENT girl character with the SAME tiny solid black dot eye style. Here is the character: {GIRL_HERO['description']} {BASE_STYLE}"},
    ]

    image_data = await generate_with_retry(session, parts)
    if image_data:
        await save_image(image_data, "hero_reference.png")
        return True
    return False

async def generate_scenes(session: aiohttp.ClientSession, hero_b64: str):
    """Generate all 8 scene images with hero injection."""
    scenes = [
        {
            "name": "page1_alone.png",
            "action": "Girl standing alone in corner of busy Salvador street party, sad and uncertain expression.",
            "details": f"She wears a teal hoodie, grey leggings. People dancing and eating around her. {SETTING_DESC}. Tropical festive atmosphere.",
        },
        {
            "name": "page2_observing.png",
            "action": "Girl observing from the side as others dance, eat, and celebrate.",
            "details": f"{DRUMS_DESC} visible. {VENDOR_STALL_DESC}. Girl looking sad, excluded. Lively celebration around her.",
        },
        {
            "name": "page3_alone_sad.png",
            "action": "Girl alone with hand on heart, sad expression, while street party continues around her.",
            "details": f"{MURALS_DESC} on buildings. Other children dancing in background. Girl's loneliness emphasized.",
        },
        {
            "name": "page4_boy_approaches.png",
            "action": "Smiling boy approaches girl and extends his hand to her.",
            "details": f"{BOY_DESC}. Girl's expression changes to surprise and hope. {SETTING_DESC}.",
        },
        {
            "name": "page5_food_stall.png",
            "action": "Boy and girl together at food vendor stall. Girl holding {acaraje_description} and taking a bite, smiling for first time.",
            "details": f"{VENDOR_STALL_DESC}. Joy visible on girl's face. Tropical fruit visible. Both happy.",
        },
        {
            "name": "page6_exploring.png",
            "action": "Boy and girl walking hand-in-hand through colourful Salvador street.",
            "details": f"{MURALS_DESC} on buildings. {DRUMS_DESC} visible nearby. Historic pastel-coloured buildings in background. Both smiling, looking at surroundings.",
        },
        {
            "name": "page7_dancing.png",
            "action": "Boy and girl dancing together with other children joining in.",
            "details": f"Joyful celebration with colourful buildings as backdrop. {DRUMS_DESC} visible. Black speakers/sound equipment nearby. Everyone smiling and dancing. Tropical festive energy.",
        },
        {
            "name": "page8_evening.png",
            "action": "Evening scene: boy and girl sitting together holding hands, reluctant to part.",
            "details": f"Tropical evening sky with warm colours. Colourful buildings. {BOY_DESC} looking at girl with affection. Girl content, belonging. Street party winding down.",
        },
    ]

    for i, scene in enumerate(scenes, 1):
        print(f"\n[IMG] Generating scene {i}/8 ({scene['name']})...")

        scene_prompt = (
            f"Show {GIRL_HERO['short']} {scene['action']} "
            f"{scene['details']} "
            f"Whimsical children's book style, watercolour backgrounds, black-outlined characters. "
            f"Landscape 1024x768. "
            f"{BASE_STYLE}"
        )

        parts = [
            {"inlineData": {"mimeType": "image/png", "data": hero_b64}},
            {"text": f"Using the girl character shown above as reference for appearance and eye style, generate this scene: {scene_prompt}"},
        ]

        image_data = await generate_with_retry(session, parts)
        if image_data:
            await save_image(image_data, scene["name"])
        else:
            print(f"  [ERR] Failed to generate {scene['name']}")

async def recolour_hero_skin(session: aiohttp.ClientSession, hero_b64: str):
    """Recolour hero skin/hair if needed."""
    print("\n[ART] Recolouring hero skin/hair...")

    parts = [
        {"inlineData": {"mimeType": "image/png", "data": hero_b64}},
        {"text": f"Edit this character image. Change skin colour to {GIRL_SKIN_HEX} (light Northern European) and hair colour to {GIRL_HAIR_HEX} (reddish-ginger). Keep everything else EXACTLY the same — same pose, outfit, eyes, expression, background."},
    ]

    image_data = await generate_with_retry(session, parts)
    if image_data:
        await save_image(image_data, "hero_reference.png")
        return True
    return False

async def main():
    """Main workflow."""
    if not GEMINI_API_KEY:
        print("[ERR] GOOGLE_GEMINI_API_KEY not set in .env")
        sys.exit(1)

    command = sys.argv[1] if len(sys.argv) > 1 else "all"

    async with aiohttp.ClientSession() as session:
        # Load eye reference
        eye_ref_b64 = await load_image_as_b64(EYE_REF_PATH)
        if not eye_ref_b64:
            print(f"[ERR] Cannot load eye reference from {EYE_REF_PATH}")
            sys.exit(1)

        if command in ["all", "hero"]:
            success = await generate_hero(session, eye_ref_b64)
            if not success:
                print("[ERR] Failed to generate hero. Aborting.")
                sys.exit(1)
            if command == "hero":
                return

        if command in ["all", "scenes"]:
            # Reload hero for scene injection
            hero_path = OUTPUT_DIR / "hero_reference.png"
            hero_b64 = await load_image_as_b64(hero_path)
            if not hero_b64:
                print("[ERR] Hero image not found. Generate hero first.")
                sys.exit(1)
            await generate_scenes(session, hero_b64)

        if command == "recolour":
            hero_path = OUTPUT_DIR / "hero_reference.png"
            hero_b64 = await load_image_as_b64(hero_path)
            if not hero_b64:
                print("[ERR] Hero image not found.")
                sys.exit(1)
            await recolour_hero_skin(session, hero_b64)

    print("\n[OK] Image generation complete!")

if __name__ == "__main__":
    asyncio.run(main())
