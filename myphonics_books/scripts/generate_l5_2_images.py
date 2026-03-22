"""
Generate illustrations for L5.2 "Near the Door" using Gemini API.

Setting: Contemporary Stockholm suburb, Sweden — Nordic winter, snowy garden.
Main character: Swedish girl Astrid (5 years old, blonde braids, red wool jumper)
Side characters: Dad (grey wool sweater, brown hair), Red fox

Pipeline:
  1. Generate hero reference image (girl, neutral pose, full body)
  2. Inject hero into every scene alongside scene-specific prompt
  3. Dad and fox described in scene prompts (consistent description each time)

Usage:
    py -3.12 scripts/generate_l5_2_images.py           # Generate all images
    py -3.12 scripts/generate_l5_2_images.py hero       # Hero reference only
    py -3.12 scripts/generate_l5_2_images.py scenes     # Scenes only (hero must exist)
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
OUTPUT_DIR = Path(__file__).parent.parent / "output" / "images" / "L5_2_B1"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Eye style reference — approved hero with correct solid black dot eyes
EYE_REF_PATH = Path(__file__).parent.parent / "output" / "images" / "L4_1_B1" / "hero_reference.png"

REQUEST_DELAY = 3
MAX_RETRIES = 3
BACKOFF_BASE = 5

# ─── Skin & Hair ──────────────────────────────────────────────────
SKIN_HEX = "#F0D0B0"   # Light Northern European skin
HAIR_HEX = "#D4A843"   # Golden blonde

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
        f"A cartoon girl character, about 5 years old, with light Northern European "
        f"skin — fair peach tone, hex colour {SKIN_HEX}. "
        f"She has long straight golden blonde hair (hex {HAIR_HEX}) worn in two neat "
        f"braids that hang over her shoulders. "
        f"She wears a cosy hand-knitted red wool jumper (deep cherry red, chunky knit "
        f"texture visible), dark blue jeans, and thick grey woolly socks. "
        f"She has small friendly dot eyes — solid black filled circles with ZERO white — "
        f"no white highlight, no white reflection, no white dot, no shine, no pupil "
        f"detail. Just 100% solid black circles like ink dots. "
        f"A curious, bright expression. ABSOLUTELY NO rosy cheeks, NO blush marks, "
        f"NO pink or red circles on face — clean smooth fair skin on cheeks. "
        f"Standing in a neutral pose, facing the viewer, full body visible from "
        f"head to toe. Arms slightly away from body, feet shoulder-width apart. "
        f"Plain light cream solid-colour background (no scenery, no objects, no patterns)."
    ),
    "short": "the girl in the red wool jumper with two blonde braids",
}

# Dad description used consistently in all scene prompts
DAD_DESC = (
    "Swedish dad (35-40 years old, light skin hex #F0D0B0, short brown hair, "
    "friendly face with slight stubble, warm eyes, grey wool sweater with a "
    "subtle Scandinavian pattern at the neckline, dark trousers, woolly socks)"
)

# Fox description used consistently
FOX_DESC = (
    "a beautiful wild red fox with bright orange-red fur, white chest and "
    "belly, big pointed ears with black tips, bushy tail with white tip, "
    "dark intelligent eyes, small and slightly thin"
)

# Setting descriptions for consistency
SETTING_INDOOR = (
    "modern minimalist Scandinavian living room: pale wooden floors, white walls, "
    "sheepskin rug, wood-burning stove with warm orange glow, simple wooden "
    "furniture, snow visible through large windows, warm cosy lighting"
)

SETTING_DOOR = (
    "white painted front door of a modern Swedish wooden house, snowy garden "
    "visible outside with birch trees and a low wooden fence, bright winter "
    "daylight streaming in"
)

SETTING_GARDEN = (
    "snowy Swedish garden in winter: fresh white snow covering the ground, "
    "slender birch trees with bare branches, a low wooden fence, modern "
    "Scandinavian wooden house in background with snow on the roof"
)

# ─── Scene Prompts ────────────────────────────────────────────────
SCENES = [
    {
        "name": "cover",
        "prompt": (
            f"Show the girl from the reference image kneeling in white snow beside "
            f"{FOX_DESC}. She reaches out one hand gently toward the fox. "
            f"Behind them, a modern Scandinavian wooden house with a white door and "
            f"snow on the roof, birch trees around. Magical winter scene with soft "
            f"falling snowflakes. Girl wears red wool jumper and dark blue jeans. "
            f"Skin colour {SKIN_HEX}. "
            f"Eyes: tiny solid black dots ONLY, no white. Portrait format 3:4."
        ),
    },
    {
        "name": "page1",
        "prompt": (
            f"Show the girl from the reference image ALONE inside {SETTING_INDOOR}. "
            f"She is crouching on the pale wooden floor, pressing her ear against "
            f"a white front door, listening intently with wide curious eyes. "
            f"Snow visible through a nearby window. She looks excited and curious. "
            f"Girl wears red wool jumper, dark blue jeans, grey woolly socks. "
            f"Skin colour {SKIN_HEX}. "
            f"Eyes: tiny solid black dots ONLY, no white. Landscape format."
        ),
    },
    {
        "name": "page2",
        "prompt": (
            f"Show two characters inside {SETTING_INDOOR}: "
            f"1) {DAD_DESC} sitting in a cosy armchair by a wood-burning stove, "
            f"smiling knowingly with a twinkle in his eye. "
            f"2) The girl from the reference image (red wool jumper, blonde braids) "
            f"standing near the door, looking back at Dad with a questioning expression. "
            f"Warm orange glow from the stove. Snow falls outside the window. "
            f"Skin colour {SKIN_HEX} for both characters. "
            f"Eyes: tiny solid black dots ONLY. Landscape format."
        ),
    },
    {
        "name": "page3",
        "prompt": (
            f"Show the girl from the reference image (red wool jumper, blonde braids) "
            f"peering nervously through a frosty window beside the white front door. "
            f"Inside: {SETTING_INDOOR}. Outside the window: a mysterious dark shape "
            f"is visible in the snowy garden. Her expression shows curiosity mixed "
            f"with slight nervousness — biting her lip, hands pressed against glass. "
            f"Warm interior light, cold blue exterior. "
            f"Skin colour {SKIN_HEX}. "
            f"Eyes: tiny solid black dots ONLY. Landscape format."
        ),
    },
    {
        "name": "page4",
        "prompt": (
            f"Show two characters inside {SETTING_INDOOR}: "
            f"1) {DAD_DESC} gesturing encouragingly toward the white front door "
            f"from his armchair by the wood-burning stove, warm reassuring smile. "
            f"2) The girl from the reference image (red wool jumper, blonde braids) "
            f"standing hesitantly near the door, looking uncertain but building courage. "
            f"One hand reaching toward the door handle. "
            f"Skin colour {SKIN_HEX} for both characters. "
            f"Eyes: tiny solid black dots ONLY. Landscape format."
        ),
    },
    {
        "name": "page5",
        "prompt": (
            f"Show the girl from the reference image (red wool jumper, blonde braids) "
            f"standing at the wide-open white front door, face showing pure delight "
            f"and wonder — mouth open, eyes wide. She has just opened the door. "
            f"In the snowy garden beyond the doorstep, {FOX_DESC} sits in the white "
            f"snow looking up at her with bright eyes. {SETTING_GARDEN} visible behind "
            f"the fox. Bright winter daylight floods in through the open door. "
            f"Skin colour {SKIN_HEX}. "
            f"Eyes: tiny solid black dots ONLY. Landscape format."
        ),
    },
    {
        "name": "page6",
        "prompt": (
            f"Show three figures at the open white front door: "
            f"1) {DAD_DESC} standing behind the girl, one hand on her shoulder, "
            f"smiling warmly down at the fox. "
            f"2) The girl from the reference image (red wool jumper, blonde braids) "
            f"standing at the doorstep, beaming with joy. "
            f"3) {FOX_DESC} sitting in the white snow just beyond the doorstep, "
            f"looking up at them with bright trusting eyes. "
            f"{SETTING_GARDEN} in background. "
            f"Skin colour {SKIN_HEX} for human characters. "
            f"Eyes: tiny solid black dots ONLY. Landscape format."
        ),
    },
    {
        "name": "page7",
        "prompt": (
            f"Show three figures at the open front door of a Swedish wooden house: "
            f"1) {FOX_DESC} eating food from a small dish on the snowy doorstep, "
            f"tail fluffy and bright against the white snow. "
            f"2) The girl from the reference image (red wool jumper, blonde braids) "
            f"sitting on the pale wooden floor just inside the doorway, watching "
            f"the fox with pure wonder and a gentle smile. "
            f"3) {DAD_DESC} standing nearby in the doorway. "
            f"Warm interior light meets cold winter exterior. "
            f"Skin colour {SKIN_HEX} for human characters. "
            f"Eyes: tiny solid black dots ONLY. Landscape format."
        ),
    },
    {
        "name": "page8",
        "prompt": (
            f"Show the girl from the reference image (red wool jumper, blonde braids) "
            f"waving goodbye from the white front doorway of a Swedish wooden house. "
            f"{FOX_DESC} trots away through the snowy garden toward birch trees, "
            f"looking back over its shoulder. {DAD_DESC} stands behind the girl "
            f"with a warm proud smile, hand on her shoulder. "
            f"Soft golden winter light, peaceful snowy landscape. "
            f"Hopeful, warm ending. "
            f"Skin colour {SKIN_HEX} for human characters. "
            f"Eyes: tiny solid black dots ONLY. Landscape format."
        ),
    },
]


# ─── API Functions ────────────────────────────────────────────────

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
            f"light fair skin {SKIN_HEX}, golden blonde hair {HAIR_HEX} "
            f"in two braids, cosy red wool jumper, dark blue jeans, grey woolly socks. "
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
    print(f'L5.2: "Near the Door" — Stockholm, Sweden')
    print(f"Output: {OUTPUT_DIR}")
    print(f"Mode: {mode}")
    print(f"{'='*55}")

    hero_path = OUTPUT_DIR / "hero_reference.png"

    async with aiohttp.ClientSession() as session:

        # Step 1: Generate hero reference
        if mode in ("all", "hero"):
            if not hero_path.exists() or mode == "hero":
                result = await generate_hero_image(session, GIRL_HERO, hero_path)
                if not result:
                    print("FATAL: Could not generate hero reference")
                    sys.exit(1)
                print(f"\n*** HERO GENERATED ***")
                print(f"*** Please review: {hero_path} ***")
                print(f"*** Check: fair skin ({SKIN_HEX}), red jumper, blonde braids, solid black dot eyes ***")
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
