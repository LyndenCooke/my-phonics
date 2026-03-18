"""
Generate illustrations for L6.2 "You Are Remarkable" using Gemini API.

Setting: Contemporary Guilin, Guangxi, China — Yuanxiao Lantern Festival,
         Li River riverside park, karst limestone mountains, lantern stalls,
         red and gold paper lanterns, street food carts.
Main character: Chinese girl (8-9 years old, red padded jacket, dark jeans, two short plaits)
Side characters: Small lost boy (dark jacket, green buttons, stuffed panda),
                 security guard (yellow high-vis jacket),
                 mother (grey winter coat, pages 7-8 only)

Pipeline:
  1. Generate hero reference image (girl, neutral pose, full body)
  2. Inject hero into every scene alongside scene-specific prompt
  3. Side characters described consistently in all scene prompts

Usage:
    py -3.12 scripts/generate_l6_2_images.py           # Generate all images
    py -3.12 scripts/generate_l6_2_images.py hero       # Hero reference only
    py -3.12 scripts/generate_l6_2_images.py scenes     # Scenes only (hero must exist)
    py -3.12 scripts/generate_l6_2_images.py recolour   # Recolour existing hero skin
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
OUTPUT_DIR = Path(__file__).parent.parent / "output" / "images" / "L6_2_B1"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Eye style reference — approved hero with correct solid black dot eyes
EYE_REF_PATH = Path(__file__).parent.parent / "output" / "images" / "L4_1_B1" / "hero_reference.png"

REQUEST_DELAY = 3
MAX_RETRIES = 3
BACKOFF_BASE = 5

# ─── Skin & Hair ──────────────────────────────────────────────────
SKIN_HEX = "#D4A574"   # Light-medium East Asian skin tone
HAIR_HEX = "#1A1110"   # Very dark black-brown hair

SECURITY_SKIN_HEX = "#C8956A"   # Medium Chinese skin (middle-aged man)
MOTHER_SKIN_HEX = "#D4A574"     # Similar light-medium East Asian skin

# ─── Style ────────────────────────────────────────────────────────
BASE_STYLE = (
    "Whimsical children's book illustration. Hand-drawn cartoon style with "
    "soft watercolour textured backgrounds and clean black-outlined characters. "
    "CRITICAL EYE RULE: Every character MUST have eyes that are tiny solid black "
    "filled circles like dots drawn with a black marker pen. "
    "NO white around the black, NO iris, NO pupil, NO highlight, NO detail. "
    "Just small simple black dots — cute and friendly like a teddy bear's eyes. "
    "Warm, friendly, inviting. Soft backgrounds with pops of bright colour. "
    "Simple rounded shapes, gentle lighting. Professional picture book quality. "
    "No text, words, letters, or numbers in the image (EXCEPT handwritten text "
    "on a small piece of paper when the scene requires it)."
)

# ─── Character Descriptions ──────────────────────────────────────
GIRL_HERO = {
    "description": (
        f"A cartoon girl character, about 8-9 years old, with light-medium East Asian "
        f"skin — warm honey tone, hex colour {SKIN_HEX}. "
        f"She has straight dark hair (hex {HAIR_HEX}), worn in two short neat plaits "
        f"(pigtails), one on each side, hanging just below her ears. "
        f"She wears a bright red padded puffer jacket (short, hip-length, zippered, "
        f"with horizontal quilted panels — the kind of padded jacket Chinese children "
        f"wear in winter). Dark navy jeans (full-length, straight cut). "
        f"White trainers on her feet. "
        f"She has small friendly dot eyes — solid black filled circles with ZERO white — "
        f"no white highlight, no white reflection, no white dot, no shine, no pupil "
        f"detail. Just 100% solid black circles like ink dots. "
        f"A calm, warm, determined face. ABSOLUTELY NO rosy cheeks, NO blush marks, "
        f"NO pink or red circles on face — clean smooth warm honey skin on cheeks. "
        f"Standing in a neutral pose, facing the viewer, full body visible from "
        f"head to toe. Arms slightly away from body, feet shoulder-width apart. "
        f"Plain light cream solid-colour background (no scenery, no objects, no patterns)."
    ),
    "short": "the girl in the bright red padded puffer jacket and dark navy jeans with two short plaits",
}

# Side character descriptions — used consistently in all scene prompts
LOST_BOY_DESC = (
    "A tiny Chinese boy (3-4 years old, chubby face, light-medium skin, short black hair), "
    "wearing a dark navy jacket with small distinctive green buttons down the front, "
    "clutching a small stuffed black-and-white panda bear"
)

SECURITY_GUARD_DESC = (
    f"Chinese security guard (middle-aged man, skin {SECURITY_SKIN_HEX}, "
    f"short neat black hair, calm professional manner, "
    f"bright yellow high-visibility jacket, dark navy trousers)"
)

MOTHER_DESC = (
    f"Chinese woman in her early 30s (light-medium skin {MOTHER_SKIN_HEX}, "
    f"straight dark hair, warm tearful expression, "
    f"grey padded winter coat, dark trousers)"
)

# Setting description for consistency
GUILIN_FESTIVAL = (
    "Guilin Lantern Festival at night — Yuanxiao festival on the Li River. "
    "Hundreds of glowing red and gold paper lanterns float above the river and hang from stalls. "
    "Dramatic dark karst limestone mountains silhouetted against a deep blue-purple night sky. "
    "Modern city lights reflect in the broad Li River. Riverside park with stone paths."
)

RED_LANTERN_BRIDGE = (
    "a large bright round red paper lantern hanging from the arch of a stone bridge, "
    "casting warm red-gold light on the stone path below"
)

# ─── Scene Prompts ────────────────────────────────────────────────
SCENES = [
    {
        "name": "cover",
        "prompt": (
            f"Show the girl from the reference image holding the hand of {LOST_BOY_DESC}. "
            f"They stand together on a riverside stone path in Guilin at night. "
            f"Girl wears her bright red padded puffer jacket, dark jeans, white trainers "
            f"(skin {SKIN_HEX}). She looks calm, warm, and quietly determined. "
            f"The small boy looks up at her, calmer now, still holding his stuffed panda. "
            f"Behind them: {GUILIN_FESTIVAL} "
            f"Warm golden lantern light glowing all around them. "
            f"Eyes: tiny solid black dots ONLY, no white. Portrait format 3:4."
        ),
    },
    {
        "name": "page1",
        "prompt": (
            f"Wide shot of a Guilin riverside festival park at night. "
            f"{GUILIN_FESTIVAL} "
            f"Show the girl from the reference image (red padded jacket, dark jeans, "
            f"two short plaits, skin {SKIN_HEX}) standing mid-path, having just stopped "
            f"walking. She looks to one side with a concerned, alert expression. "
            f"On a nearby stone step, {LOST_BOY_DESC} sits ALONE, crying, face turned down. "
            f"Festival crowds of blurred figures walk past the crying boy, ignoring him. "
            f"Hundreds of lanterns glow in the sky. "
            f"Eyes on all characters: tiny solid black dots ONLY, no white. "
            f"Landscape format."
        ),
    },
    {
        "name": "page2",
        "prompt": (
            f"Close-up scene on a stone riverside path. "
            f"The girl from the reference image (red padded jacket, dark jeans, "
            f"skin {SKIN_HEX}) crouches DOWN to meet the eyes of {LOST_BOY_DESC}. "
            f"She crouches forward with a warm, gentle, determined expression. "
            f"The boy looks miserable — tearful, red-cheeked, hugging his panda tightly. "
            f"He shakes his head slightly. "
            f"Blurred festival-goers and warm lantern light behind them. "
            f"Eyes: tiny solid black dots ONLY, no white. Landscape format."
        ),
    },
    {
        "name": "page3",
        "prompt": (
            f"Stone riverside path at the Guilin Lantern Festival. "
            f"The girl from the reference image (red padded jacket, dark jeans, skin {SKIN_HEX}) "
            f"kneels on the path, holding up a small white piece of paper torn from a notebook "
            f"HIGH in one hand — arm raised above her head. "
            f"Her other hand steadies herself. Her face is calm, focused, purposeful. "
            f"Beside her, {LOST_BOY_DESC} sits on the path, watching her. "
            f"The small white paper note is clearly visible, held aloft. "
            f"Warm lantern light, festival crowds in background. "
            f"Eyes: tiny solid black dots ONLY, no white. Landscape format."
        ),
    },
    {
        "name": "page4",
        "prompt": (
            f"Guilin festival riverside — a row of brightly lit lantern stalls. "
            f"The girl from the reference image (red padded jacket, dark jeans, skin {SKIN_HEX}) "
            f"holds the hand of {LOST_BOY_DESC} and holds out her note to "
            f"an elderly Chinese woman behind a stall. "
            f"The stall shows steaming bowls of tangyuan — small white glutinous rice balls "
            f"in clear broth, in red and white ceramic bowls. A charming, festive stall. "
            f"The elderly woman (white hair, warm wrinkled face, dark padded jacket) shakes "
            f"her head kindly and points along the riverbank with one finger. "
            f"Warm golden lantern light. Karst mountains visible in background. "
            f"Eyes: tiny solid black dots ONLY, no white. Landscape format."
        ),
    },
    {
        "name": "page5",
        "prompt": (
            f"Near the entrance of a riverside festival park in Guilin. "
            f"The girl from the reference image (red padded jacket, dark jeans, skin {SKIN_HEX}) "
            f"stands before {SECURITY_GUARD_DESC} and holds out her small white note to him. "
            f"She speaks clearly, chin up, direct. {LOST_BOY_DESC} stands beside her, "
            f"holding her hand. The security guard reads the note seriously, "
            f"nodding, one hand near his radio. "
            f"Above and behind: {RED_LANTERN_BRIDGE}. "
            f"Eyes: tiny solid black dots ONLY, no white. Landscape format."
        ),
    },
    {
        "name": "page6",
        "prompt": (
            f"Night scene beside the stone bridge with a large round red paper lantern glowing above. "
            f"The girl from the reference image (red padded jacket, dark jeans, skin {SKIN_HEX}) "
            f"sits on a low stone wall. "
            f"Beside her: {LOST_BOY_DESC} — now calmer, holding a small orange roasted sweet "
            f"potato in both chubby hands, cheeks puffed, looking curious. "
            f"The boy holds his stuffed black-and-white panda OUT towards the girl with both arms, "
            f"offering it to her. The girl reaches out gently to take it with a warm smile. "
            f"The large round red lantern glows behind them, casting warm red-gold light. "
            f"Eyes: tiny solid black dots ONLY, no white. Landscape format."
        ),
    },
    {
        "name": "page7",
        "prompt": (
            f"Joyful reunion scene beside the stone bridge, red lantern glowing above. "
            f"{MOTHER_DESC} kneels on the stone path, arms wrapped tightly around "
            f"{LOST_BOY_DESC}, both of them crying with joy — the boy's face shows "
            f"pure overjoyed relief. "
            f"A Chinese man (30s, dark padded jacket) stands beside the mother, "
            f"gripping the hand of {SECURITY_GUARD_DESC} gratefully. "
            f"The girl from the reference image (red padded jacket, dark jeans, skin {SKIN_HEX}) "
            f"stands a little way to one side, watching the reunion with a quiet, warm smile. "
            f"Festival lanterns glow behind them. Karst mountains in background. "
            f"Eyes: tiny solid black dots ONLY, no white. Landscape format."
        ),
    },
    {
        "name": "page8",
        "prompt": (
            f"Guilin Lantern Festival riverside — night. "
            f"{MOTHER_DESC} kneels down to be face-to-face with the girl from the reference image "
            f"(red padded jacket, dark jeans, skin {SKIN_HEX}). "
            f"The mother holds BOTH of the girl's hands warmly and looks at her with deep "
            f"gratitude, tears still on her cheeks, speaking softly. "
            f"{LOST_BOY_DESC} stands close by, watching, holding his panda, calmer now. "
            f"The girl's expression is quietly proud and calm — not boastful, just steady. "
            f"Behind them: hundreds of glowing red and gold lanterns float above the Li River, "
            f"dramatic dark karst mountains silhouetted against the deep blue-purple night sky. "
            f"Eyes: tiny solid black dots ONLY, no white. Landscape format."
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
            f"New SKIN colour: {SKIN_HEX} (light-medium East Asian warm honey tone). "
            f"New HAIR colour: {HAIR_HEX} (very dark black-brown). "
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
            f"CHARACTER REFERENCE — THE GIRL. Keep her exact appearance: "
            f"light-medium East Asian skin {SKIN_HEX}, straight dark black hair {HAIR_HEX} "
            f"in two short plaits, bright red padded puffer jacket, dark navy jeans, "
            f"white trainers. Eyes must be solid black dots exactly like the eye reference above:"
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
    print(f'L6.2: "You Are Remarkable" — Guilin, China')
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
                result = await generate_hero_image(session, GIRL_HERO, hero_path)
                if not result:
                    print("FATAL: Could not generate hero reference")
                    sys.exit(1)
                print(f"\n*** HERO GENERATED ***")
                print(f"*** Please review: {hero_path} ***")
                print(f"*** Check: correct skin ({SKIN_HEX}), red puffer jacket, dark navy jeans, "
                      f"two short plaits, solid black dot eyes, NO rosy cheeks ***")
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
