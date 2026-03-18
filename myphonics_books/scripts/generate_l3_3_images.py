"""
Generate illustrations for L3.3 "Reach for the Treat!" using Gemini API.

This book features TWO main characters (first in the series).
Strategy: Generate two separate hero references (boy + girl),
then inject both into every scene prompt using Gemini's dual-reference support.

Usage:
    py -3.12 scripts/generate_l3_3_images.py           # Generate all images
    py -3.12 scripts/generate_l3_3_images.py hero       # Hero references only
    py -3.12 scripts/generate_l3_3_images.py scenes     # Scenes only (heroes must exist)
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
OUTPUT_DIR = Path(__file__).parent.parent / "output" / "images" / "L3_3_B1"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Eye style reference — a previous hero with correct solid black dot eyes
EYE_REF_PATH = Path(__file__).parent.parent / "output" / "images" / "L4_1_B1" / "hero_reference.png"

REQUEST_DELAY = 3
MAX_RETRIES = 3
BACKOFF_BASE = 5

# ─── Style ────────────────────────────────────────────────────────

BASE_STYLE = (
    "Whimsical children's book illustration. Hand-drawn cartoon style with "
    "soft watercolour textured backgrounds and clean black-outlined characters. "
    "CRITICAL EYE RULE: Every character MUST have eyes that are "
    "tiny solid black filled circles like dots drawn with a black marker pen. "
    "NO white around the black, NO iris, NO pupil, NO highlight, NO detail. "
    "Just small simple black dots - cute and friendly like a teddy bear's eyes. "
    "Warm, friendly, inviting. Soft pastel backgrounds with pops of bright colour. "
    "Simple rounded shapes, gentle lighting. Professional picture book quality. "
    "No text, words, letters, or numbers in the image."
)

# ─── Character Descriptions ──────────────────────────────────────

BOY_HERO = {
    "description": (
        "A cartoon boy character, about 6 years old, with DEEP DARK BROWN skin — "
        "the colour of very dark chocolate or strong black coffee. Rich warm ebony "
        "brown. Much darker than medium brown. NO blue, NO grey — purely warm dark "
        "brown. He has a closely shaved head "
        "(buzz cut). He wears a bright yellow cotton t-shirt, comfortable green "
        "blue jeans, and brown sandals. He has small friendly dot eyes, "
        "solid black filled circles with ZERO white — no white highlight, no white reflection, "
        "no white dot, no shine, no pupil detail. Just 100% solid black circles like ink dots. "
        "A cheerful friendly expression. ABSOLUTELY NO rosy cheeks, NO blush marks, NO pink or red circles on face — clean smooth dark brown skin on cheeks. Standing in a neutral pose, "
        "facing the viewer, full body visible from head to toe. "
        "Arms slightly away from body, feet shoulder-width apart. "
        "Plain light cream solid-colour background (no scenery, no objects, no patterns)."
    ),
    "short": "the boy in the yellow t-shirt and blue jeans",
}

GIRL_HERO = {
    "description": (
        "A cartoon girl character, about 6 years old, with DEEP DARK BROWN skin — "
        "the colour of very dark chocolate or strong black coffee. Rich warm ebony "
        "brown. Much darker than medium brown. NO blue, NO grey — purely warm dark "
        "brown. She has natural black hair in "
        "neat cornrows with small colourful beads (red, yellow, blue) at the ends. "
        "She wears a bright coral/orange cotton dress with a bold geometric print, "
        "dark navy leggings underneath, and blue sandals. She has small friendly "
        "dot eyes, solid black filled circles with ZERO white — no white highlight, no white "
        "reflection, no white dot, no shine, no pupil detail. Just 100% solid black circles "
        "like ink dots. A bright curious expression. ABSOLUTELY NO rosy cheeks, NO blush marks, NO pink or red circles on face — clean smooth dark brown skin on cheeks. Standing in a neutral pose, "
        "facing the viewer, full body visible from head to toe. "
        "Arms slightly away from body, feet shoulder-width apart. "
        "Plain light cream solid-colour background (no scenery, no objects, no patterns)."
    ),
    "short": "the girl in the coral/orange print dress with cornrows",
}

# ─── Object & Setting Definitions ────────────────────────────────

MANGO = "ONE single large ripe golden-orange mango with a slight red blush, oval shaped — there is ONLY ONE mango on the tree, not multiple"
STICK = "a long thin brown wooden stick, natural with slight bends, about as tall as the girl"
TREE = "a large realistic tropical mango tree with thick gnarled brown trunk, spreading branches with dense clusters of elongated dark green leaves growing naturally from twigs — realistic foliage, NOT individual leaves floating or dangling separately"
SETTING = (
    "A residential compound in Accra, Ghana. Painted concrete houses (cream and "
    "pastel blue) visible in the background with low compound walls. Red laterite "
    "earth on the ground. Bright tropical sunshine, vivid blue sky. Bougainvillea "
    "with pink flowers growing on a wall"
)
ONE_MANGO_RULE = "IMPORTANT: There is ONLY ONE mango on this tree — just one single fruit. Do NOT draw multiple mangoes."

# ─── Skin & Hair Hex Colours ─────────────────────────────────────
SKIN_HEX = "#3A2518"   # Very dark chocolate brown
HAIR_HEX = "#0D0D0D"   # Near-black

# ─── Scene Prompts ────────────────────────────────────────────────

SCENES = [
    {
        "name": "cover",
        "chars": "both",
        "prompt": (
            f"Show both children from the reference images standing together under "
            f"{TREE}. {ONE_MANGO_RULE} {MANGO} hangs high above them on a branch. "
            f"The boy wears a bright yellow t-shirt and blue jeans. The girl wears "
            f"a coral/orange print dress with dark leggings. She holds {STICK}. "
            f"They are both grinning and pointing up at the single mango. {SETTING}. "
            f"Both children have skin colour {SKIN_HEX} (very dark chocolate brown). "
            f"Small simple solid black dot eyes with ZERO white. Portrait format, "
            f"3:4 aspect ratio."
        ),
    },
    {
        "name": "page1",
        "chars": "boy",
        "prompt": (
            f"Show the boy from the reference image standing ALONE beneath {TREE}, "
            f"looking up longingly. {ONE_MANGO_RULE} {MANGO} hangs high on a branch "
            f"far above his head. He reaches one hand up but cannot get close. He "
            f"wears a bright yellow t-shirt and blue jeans. Expression: wistful, wanting. "
            f"{SETTING}. Skin colour {SKIN_HEX} (very dark chocolate brown). "
            f"Small simple solid black dot eyes with ZERO white. Landscape format."
        ),
    },
    {
        "name": "page2",
        "chars": "boy",
        "prompt": (
            f"Show the boy from the reference image jumping in the air under {TREE}, "
            f"both hands stretched high above his head, fingers reaching toward the "
            f"branch. {ONE_MANGO_RULE} {MANGO} is on the branch above him. His feet "
            f"are off the ground mid-jump. Expression: frustrated, determined but "
            f"failing. Red dust kicking up from his jump. {SETTING}. "
            f"Skin colour {SKIN_HEX} (very dark chocolate brown). "
            f"Small simple solid black dot eyes with ZERO white. Landscape format."
        ),
    },
    {
        "name": "page3",
        "chars": "both",
        "prompt": (
            f"Show the girl from reference image 2 running into the yard carrying "
            f"{STICK}, looking up excitedly. {ONE_MANGO_RULE} {MANGO} hangs high "
            f"in {TREE}. The boy from reference image 1 stands nearby looking "
            f"surprised at her arrival. Girl wears coral/orange print dress with "
            f"dark leggings. Boy wears yellow t-shirt and blue jeans. Expression: "
            f"girl excited, boy surprised. {SETTING}. Both have skin colour "
            f"{SKIN_HEX} (very dark chocolate brown). Small simple solid black dot "
            f"eyes with ZERO white. Landscape format."
        ),
    },
    {
        "name": "page4",
        "chars": "both",
        "prompt": (
            f"Show the girl from reference image 2 standing on tiptoes under {TREE}, "
            f"reaching {STICK} up toward the branch. {ONE_MANGO_RULE} {MANGO} is on "
            f"the high branch — the stick almost reaches but not quite, tapping at "
            f"the branch. The boy from reference image 1 watches nearby. Expression: "
            f"girl frustrated, concentrating hard. {SETTING}. Both have skin colour "
            f"{SKIN_HEX} (very dark chocolate brown). Small simple solid black dot "
            f"eyes with ZERO white. Landscape format."
        ),
    },
    {
        "name": "page5",
        "chars": "both",
        "prompt": (
            f"Show both children from the reference images facing each other with "
            f"excited grins. The boy is gesturing upward with one hand, suggesting "
            f"his idea to lift her up. The girl holds {STICK} and is beaming. "
            f"{TREE} with {MANGO} visible high above them in the background. "
            f"{ONE_MANGO_RULE} Expression: both delighted, excited. "
            f"NO lightbulb, NO thought bubble, NO cartoon symbols — just the "
            f"characters and their expressions. {SETTING}. Both have skin colour "
            f"{SKIN_HEX} (very dark chocolate brown). Small simple solid black dot "
            f"eyes with ZERO white. Landscape format."
        ),
    },
    {
        "name": "page6",
        "chars": "both",
        "prompt": (
            f"Show the boy boosting the girl up high — she is sitting on his "
            f"shoulders. She swings {STICK} and strikes the branch of {TREE}. "
            f"The single mango is falling through the air away from the branch "
            f"toward the ground — the branch is now EMPTY with NO mango on it. "
            f"Do NOT show a mango still on the tree AND a mango falling — only "
            f"the falling one. Dramatic action moment. Expression: both determined "
            f"and excited. Red earth below. {SETTING}. Both have skin colour "
            f"{SKIN_HEX} (very dark chocolate brown). Small simple solid black dot "
            f"eyes with ZERO white. Landscape format."
        ),
    },
    {
        "name": "page7",
        "chars": "both",
        "prompt": (
            f"Show both children from the reference images sitting together on the "
            f"red earth under {TREE}, each holding a piece of the golden-orange "
            f"mango and eating it joyfully. Mango juice on their hands and big happy "
            f"smiles. {STICK} lies nearby on the ground. The tree has NO mangoes on "
            f"it now — they already picked the only one. Expression: pure happiness, "
            f"celebrating together. {SETTING}. Both have skin colour {SKIN_HEX} "
            f"(very dark chocolate brown). Small simple solid black dot eyes with "
            f"ZERO white. Landscape format."
        ),
    },
    {
        "name": "page8",
        "chars": "both",
        "prompt": (
            f"Show both children from the reference images standing together by "
            f"{TREE}, smiling warmly at each other. The girl is tying a large green "
            f"mango leaf onto {STICK} as a flag or marker. The boy watches happily. "
            f"The tree has NO mangoes — they already got the only one. Warm golden "
            f"sunset light. Expression: warm friendship, contentment, belonging. "
            f"{SETTING}. Both have skin colour {SKIN_HEX} (very dark chocolate brown). "
            f"Small simple solid black dot eyes with ZERO white. Landscape format."
        ),
    },
]


# ─── API Functions ────────────────────────────────────────────────

async def recolour_hero(
    session: aiohttp.ClientSession, hero_path: Path, output_path: Path
) -> Path | None:
    """Take an existing hero image and recolour skin/hair to target hex values."""
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"
    hero_b64 = base64.b64encode(hero_path.read_bytes()).decode("utf-8")

    parts = [
        {"inlineData": {"mimeType": "image/png", "data": hero_b64}},
        {"text": (
            f"Edit this character image. Change ONLY the skin colour and hair colour. "
            f"Keep everything else EXACTLY the same — same pose, same outfit, same eyes, same background, same style. "
            f"New SKIN colour: {SKIN_HEX} (very dark chocolate brown — much darker than current). "
            f"New HAIR colour: {HAIR_HEX} (near-black). "
            f"The skin should be noticeably darker than it currently is. "
            f"Do NOT change the clothes, eyes, expression, pose, or background."
        )},
    ]

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }

    print(f"  [recolour] Darkening skin to {SKIN_HEX}, hair to {HAIR_HEX}...")

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
                    print(f"  [recolour] No image data in response")
                    return None
                elif response.status == 429:
                    wait = BACKOFF_BASE * (2 ** attempt)
                    print(f"  [recolour] Rate limited. Waiting {wait}s...")
                    await asyncio.sleep(wait)
                    continue
                else:
                    text = await response.text()
                    print(f"  [recolour] API error {response.status}: {text[:300]}")
                    if attempt < MAX_RETRIES - 1:
                        await asyncio.sleep(BACKOFF_BASE * (2 ** attempt))
                    continue
        except Exception as e:
            print(f"  [recolour] Error: {e}")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(BACKOFF_BASE)
            continue
    return None


async def generate_hero_image(
    session: aiohttp.ClientSession, hero_info: dict, output_path: Path
) -> Path | None:
    """Generate a hero reference image using Gemini with eye-style reference."""
    full_prompt = f"{hero_info['description']} {BASE_STYLE}"
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"

    # Build parts — include eye style reference image if available
    parts = []
    if EYE_REF_PATH.exists():
        eye_b64 = base64.b64encode(EYE_REF_PATH.read_bytes()).decode("utf-8")
        parts.append({
            "text": "EYE STYLE REFERENCE — The new character MUST have the EXACT same eye style as this character. Look at the eyes: they are tiny solid black dots with no white highlights, no reflections, no detail. Copy this eye style exactly:"
        })
        parts.append({"inlineData": {"mimeType": "image/png", "data": eye_b64}})
        parts.append({
            "text": f"Now generate a NEW character (different person, different outfit, different skin tone) but with the SAME tiny solid black dot eye style as the reference above. Here is the character to generate: {full_prompt}"
        })
    else:
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
                        parts = candidates[0].get("content", {}).get("parts", [])
                        for part in parts:
                            if "inlineData" in part:
                                image_data = base64.b64decode(part["inlineData"]["data"])
                                output_path.write_bytes(image_data)
                                size_kb = len(image_data) / 1024
                                print(f"  [hero] Saved ({size_kb:.0f} KB) -> {output_path}")
                                return output_path
                    print(f"  [hero] No image data in response")
                    return None
                elif response.status == 429:
                    wait = BACKOFF_BASE * (2 ** attempt)
                    print(f"  [hero] Rate limited. Waiting {wait}s...")
                    await asyncio.sleep(wait)
                    continue
                else:
                    text = await response.text()
                    print(f"  [hero] API error {response.status}: {text[:300]}")
                    if attempt < MAX_RETRIES - 1:
                        wait = BACKOFF_BASE * (2 ** attempt)
                        await asyncio.sleep(wait)
                    continue
        except Exception as e:
            print(f"  [hero] Request error: {e}")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(BACKOFF_BASE)
            continue
    return None


async def generate_scene_image(
    session: aiohttp.ClientSession,
    boy_b64: str,
    girl_b64: str,
    eye_ref_b64: str | None,
    scene: dict,
) -> bytes | None:
    """Generate a scene image using Gemini with hero reference(s) + eye style reference."""
    full_prompt = f"{scene['prompt']} {BASE_STYLE}"
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"

    # Build parts — eye reference FIRST, then character references
    parts = []

    # Eye style reference injection
    if eye_ref_b64:
        parts.append({
            "text": "EYE STYLE REFERENCE — ALL characters in this scene MUST have the EXACT same eye style as this character. The eyes are tiny solid black dots with ZERO white — no highlights, no reflections, no sclera. Copy this eye style exactly:"
        })
        parts.append({"inlineData": {"mimeType": "image/png", "data": eye_ref_b64}})

    chars = scene.get("chars", "both")

    if chars in ("boy", "both"):
        parts.append({
            "text": "CHARACTER REFERENCE — BOY. Keep his exact appearance (dark brown skin, yellow t-shirt, blue jeans, buzz cut). Eyes must be solid black dots like the eye reference above:"
        })
        parts.append({"inlineData": {"mimeType": "image/png", "data": boy_b64}})

    if chars in ("girl", "both"):
        parts.append({
            "text": "CHARACTER REFERENCE — GIRL. Keep her exact appearance (dark brown skin, coral/orange print dress, cornrows with beads, dark leggings). Eyes must be solid black dots like the eye reference above:"
        })
        parts.append({"inlineData": {"mimeType": "image/png", "data": girl_b64}})

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
                    continue
                else:
                    text = await response.text()
                    print(f"    API error {response.status}: {text[:300]}")
                    if attempt < MAX_RETRIES - 1:
                        wait = BACKOFF_BASE * (2 ** attempt)
                        await asyncio.sleep(wait)
                    continue
        except Exception as e:
            print(f"    Request error: {e}")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(BACKOFF_BASE)
            continue
    return None


# ─── Main ─────────────────────────────────────────────────────────

async def main():
    mode = sys.argv[1].lower() if len(sys.argv) > 1 else "all"

    if not GEMINI_API_KEY:
        print("ERROR: GOOGLE_GEMINI_API_KEY not found in .env")
        sys.exit(1)

    print(f"\n{'='*55}")
    print(f'L3.3: "Reach for the Treat!" — Accra, Ghana')
    print(f"Output: {OUTPUT_DIR}")
    print(f"Mode: {mode}")
    print(f"{'='*55}")

    boy_hero_path = OUTPUT_DIR / "hero_boy.png"
    girl_hero_path = OUTPUT_DIR / "hero_girl.png"

    async with aiohttp.ClientSession() as session:
        # Recolour mode — darken existing heroes
        if mode == "recolour":
            if not boy_hero_path.exists() or not girl_hero_path.exists():
                print("ERROR: Hero images must exist first. Run with 'hero' mode.")
                sys.exit(1)
            result = await recolour_hero(session, boy_hero_path, boy_hero_path)
            if not result:
                print("FATAL: Could not recolour boy hero")
                sys.exit(1)
            await asyncio.sleep(REQUEST_DELAY)
            result = await recolour_hero(session, girl_hero_path, girl_hero_path)
            if not result:
                print("FATAL: Could not recolour girl hero")
                sys.exit(1)
            print("\nRecolour done.")
            return

        # Step 1: Generate hero references
        if mode in ("all", "hero"):
            if not boy_hero_path.exists() or mode == "hero":
                result = await generate_hero_image(session, BOY_HERO, boy_hero_path)
                if not result:
                    print("FATAL: Could not generate boy hero")
                    sys.exit(1)
                await asyncio.sleep(REQUEST_DELAY)

            if not girl_hero_path.exists() or mode == "hero":
                result = await generate_hero_image(session, GIRL_HERO, girl_hero_path)
                if not result:
                    print("FATAL: Could not generate girl hero")
                    sys.exit(1)
                await asyncio.sleep(REQUEST_DELAY)

        if mode == "hero":
            print("\nHero-only mode — done.")
            return

        # Step 2: Load hero references as base64
        if not boy_hero_path.exists() or not girl_hero_path.exists():
            print("ERROR: Hero references not found. Run with 'hero' first.")
            sys.exit(1)

        boy_b64 = base64.b64encode(boy_hero_path.read_bytes()).decode("utf-8")
        girl_b64 = base64.b64encode(girl_hero_path.read_bytes()).decode("utf-8")

        # Load eye style reference for scene generation too
        eye_ref_b64 = None
        if EYE_REF_PATH.exists():
            eye_ref_b64 = base64.b64encode(EYE_REF_PATH.read_bytes()).decode("utf-8")
            print(f"\n  Loaded hero references (boy: {len(boy_b64)//1024}KB, girl: {len(girl_b64)//1024}KB, eye ref: {len(eye_ref_b64)//1024}KB)")
        else:
            print(f"\n  Loaded hero references (boy: {len(boy_b64)//1024}KB, girl: {len(girl_b64)//1024}KB) — NO eye ref")

        # Step 3: Generate scenes
        generated = []
        for scene in SCENES:
            output_path = OUTPUT_DIR / f"{scene['name']}.png"

            if output_path.exists():
                print(f"  [{scene['name']}] Already exists, skipping")
                generated.append(str(output_path))
                continue

            print(f"  [{scene['name']}] Generating ({scene['chars']})...")
            image_bytes = await generate_scene_image(session, boy_b64, girl_b64, eye_ref_b64, scene)

            if image_bytes:
                output_path.write_bytes(image_bytes)
                size_kb = len(image_bytes) / 1024
                print(f"  [{scene['name']}] Saved ({size_kb:.0f} KB)")
                generated.append(str(output_path))
            else:
                print(f"  [{scene['name']}] FAILED")

            await asyncio.sleep(REQUEST_DELAY)

        total = len(SCENES)
        print(f"\nGenerated {len(generated)}/{total} images for L3.3")
        if len(generated) < total:
            print("WARNING: Some images failed. Delete failed files and re-run.")


if __name__ == "__main__":
    asyncio.run(main())
