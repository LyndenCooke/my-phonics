"""
Generate illustrations for L3.5 "The Boat with the Red Sail" using Gemini API.

Setting: Port of Spain, Trinidad — Gulf of Paria waterfront, colourful wooden
houses, traditional fishing pirogues (sailing boats).
Character: Afro-Trinidadian boy (Kai), skin #7B4A30, short natural afro,
           orange t-shirt, dark navy 3/4-length shorts, bare feet.
Side character: Dad (Afro-Trinidadian, skin #4E3222, yellow fisherman's jacket).

Strategy: Generate single hero reference (Kai), inject into every scene.
Eye reference injected from approved L4_1_B1 book.

Usage:
    py -3.12 scripts/generate_l3_5_images.py           # Generate all images
    py -3.12 scripts/generate_l3_5_images.py hero       # Hero only
    py -3.12 scripts/generate_l3_5_images.py scenes     # Scenes only (hero must exist)
    py -3.12 scripts/generate_l3_5_images.py recolour   # Recolour existing hero skin tone
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
OUTPUT_DIR = Path(__file__).parent.parent / "output" / "images" / "L3_5_B1"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Eye style reference — approved hero from L4.1 with correct solid black dot eyes
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

# Skin & Hair hex codes
KAI_SKIN_HEX = "#7B4A30"   # Medium-dark Caribbean brown, warm undertone
KAI_HAIR_HEX = "#0D0D0D"   # Near-black
DAD_SKIN_HEX = "#4E3222"   # Slightly darker than Kai
DAD_HAIR_HEX = "#0D0D0D"   # Near-black

KAI_HERO = {
    "description": (
        f"A cartoon boy character named Kai, about 6-7 years old, with medium-dark "
        f"Caribbean brown skin — the colour of warm toffee or caramel. Hex colour: {KAI_SKIN_HEX}. "
        f"NOT as dark as West African chocolate brown — a lighter warm Caribbean brown. "
        f"He has a short tight natural afro (soft black curls, about 2cm high). "
        f"Hair colour: {KAI_HAIR_HEX} (near-black). "
        f"He wears a bright orange cotton t-shirt with a small yellow star on the front, "
        f"dark navy trousers/capri-length pants that end at mid-calf (NOT short shorts — "
        f"the hem must be clearly BELOW the knee, about halfway down the lower leg), "
        f"and bare feet. "
        f"He has small friendly dot eyes — solid black filled circles with ZERO white. "
        f"No white highlight, no white reflection, no white dot, no shine, no pupil detail. "
        f"Just 100% solid black circles like ink dots. "
        f"A cheerful friendly expression. ABSOLUTELY NO rosy cheeks, NO blush marks, "
        f"NO pink or red circles on face — clean smooth {KAI_SKIN_HEX} brown skin on cheeks. "
        f"Standing in a neutral pose, facing the viewer, full body visible from head to toe. "
        f"Arms slightly away from body, feet shoulder-width apart. "
        f"Plain light cream solid-colour background (no scenery, no objects, no patterns)."
    ),
    "short": "Kai — the boy in the bright orange t-shirt with the short natural afro",
}

# ─── Object & Setting Definitions ────────────────────────────────

BOAT = (
    "A traditional Trinidadian wooden pirogue (fishing boat), "
    "painted sky-blue hull, a distinctive bold RED stripe running along the hull "
    "and on the triangular sail — this red stripe is the identifying feature. "
    "The sail is white with the red stripe diagonal across it. "
    "An outboard motor at the back. Traditional wooden construction."
)

SNAIL = (
    "A small brown garden snail with a swirled shell (brown and cream spiral pattern), "
    "moving slowly on the road"
)

SETTING_BASE = (
    "Port of Spain waterfront, Trinidad. Gulf of Paria — calm green-blue tropical water. "
    "A concrete dock with painted turquoise metal railings. "
    "Behind the dock: brightly painted wooden Trinidadian gingerbread houses "
    "(yellow, pink, turquoise, orange) with decorative wooden trim. "
    "Royal palm trees and coconut palms. "
    "Warm tropical atmosphere."
)

SETTING_RAIN = SETTING_BASE + " Warm tropical rain falling (heavy drops, not cold)."
SETTING_CLEARING = SETTING_BASE + " Rain just clearing, soft golden light breaking through clouds."

# ─── Scene Prompts ────────────────────────────────────────────────

SCENES = [
    {
        "name": "cover",
        "prompt": (
            f"Show Kai (the boy from the reference image, orange t-shirt, dark navy 3/4-length shorts, bare feet) "
            f"standing on a waterfront dock in Port of Spain, Trinidad, looking excitedly out to sea. "
            f"On the calm Gulf of Paria behind him, {BOAT} can be seen approaching in the distance. "
            f"The red stripe on the sail is clearly visible. "
            f"{SETTING_RAIN} "
            f"Kai's skin colour is {KAI_SKIN_HEX} (warm Caribbean brown). "
            f"Small simple solid black dot eyes with ZERO white. "
            f"Portrait format (3:4 aspect ratio). "
            f"ABSOLUTELY NO rosy cheeks, NO blush marks on face."
        ),
    },
    {
        "name": "page1",
        "prompt": (
            f"Show Kai (the boy from the reference image, orange t-shirt, dark navy 3/4-length shorts, bare feet) "
            f"standing at the waterfront dock, shoulders slightly drooped, looking out to the still calm sea. "
            f"The sea is empty — NO boat visible yet. "
            f"Warm tropical rain falls gently. "
            f"Expression: patient but sad, waiting. "
            f"{SETTING_RAIN} "
            f"Kai's skin colour is {KAI_SKIN_HEX} (warm Caribbean brown). "
            f"Small simple solid black dot eyes with ZERO white. "
            f"Landscape format. "
            f"ABSOLUTELY NO rosy cheeks, NO blush marks on face."
        ),
    },
    {
        "name": "page2",
        "prompt": (
            f"Show Kai (the boy from the reference image, orange t-shirt, dark navy 3/4-length shorts, bare feet) "
            f"standing on the waterfront road, hands on hips, looking down at {SNAIL}. "
            f"Kai has a frustrated, exasperated, comical expression — "
            f"he is comparing the slow snail to the missing boat. "
            f"The sea is visible in the background — still empty, no boat. "
            f"{SETTING_RAIN} "
            f"Kai's skin colour is {KAI_SKIN_HEX} (warm Caribbean brown). "
            f"Small simple solid black dot eyes with ZERO white. "
            f"Landscape format. "
            f"ABSOLUTELY NO rosy cheeks, NO blush marks on face."
        ),
    },
    {
        "name": "page3",
        "prompt": (
            f"Show Kai (the boy from the reference image, orange t-shirt, dark navy 3/4-length shorts, bare feet) "
            f"standing up on tiptoes at the dock railing, pointing excitedly out to sea. "
            f"Far in the distance on the water, a tiny boat shape is just visible on the foam. "
            f"His eyes are wide, expression: alert, hopeful, 'could it be?'. "
            f"The boat is very small and far away — just a suggestion of a shape. "
            f"{SETTING_RAIN} "
            f"Kai's skin colour is {KAI_SKIN_HEX} (warm Caribbean brown). "
            f"Small simple solid black dot eyes with ZERO white. "
            f"Landscape format. "
            f"ABSOLUTELY NO rosy cheeks, NO blush marks on face."
        ),
    },
    {
        "name": "page4",
        "prompt": (
            f"Show Kai (the boy from the reference image, orange t-shirt, dark navy 3/4-length shorts, bare feet) "
            f"leaning over the dock railing, shielding his eyes with one hand, pointing with the other. "
            f"{BOAT} is at MEDIUM distance on the water — roughly 80 metres away, clearly visible but "
            f"NOT at the dock. The boat is about one-quarter the height of the scene. "
            f"The RED STRIPE on the sail can be clearly seen from this distance. "
            f"Kai is on the foreground dock, the boat is mid-distance on the water behind him. "
            f"His expression: excited recognition — eyes wide, grinning, pointing at the red stripe. "
            f"{SETTING_RAIN} "
            f"Kai's skin colour is {KAI_SKIN_HEX} (warm Caribbean brown). "
            f"Small simple solid black dot eyes with ZERO white. "
            f"Landscape format. "
            f"ABSOLUTELY NO rosy cheeks, NO blush marks on face."
        ),
    },
    {
        "name": "page5",
        "prompt": (
            f"Show Kai (the boy from the reference image, orange t-shirt, dark navy 3/4-length shorts, bare feet) "
            f"clapping his hands together in excitement on the dock. "
            f"{BOAT} has moved closer — now about 30-40 metres from the dock, approaching but NOT yet arrived. "
            f"The boat is mid-sized in the scene — large enough to make out the wooden crate of silver fish "
            f"piled at the bow (kingfish and snapper, gleaming silver), but the boat hull has not touched the dock. "
            f"There is still a gap of open water between Kai on the dock and the boat. "
            f"Kai's expression: growing certainty, delighted clapping, leaning forward eagerly. "
            f"{SETTING_RAIN} "
            f"Kai's skin colour is {KAI_SKIN_HEX} (warm Caribbean brown). "
            f"Small simple solid black dot eyes with ZERO white. "
            f"Landscape format. "
            f"ABSOLUTELY NO rosy cheeks, NO blush marks on face."
        ),
    },
    {
        "name": "page6",
        "prompt": (
            f"Show Kai (the boy from the reference image, orange t-shirt, dark navy 3/4-length shorts, bare feet) "
            f"standing at the very edge of the dock with his hands cupped around his mouth, shouting joyfully. "
            f"{BOAT} has now pulled RIGHT UP alongside the dock — it is docked or just touching. "
            f"Standing tall in the boat is Dad: a broad-shouldered Afro-Trinidadian man, mid-30s, "
            f"dark brown skin ({DAD_SKIN_HEX}), very short close-cropped black hair, broad friendly face, "
            f"bright YELLOW waterproof fisherman's jacket, dark navy shorts, rubber boots. "
            f"Dad is standing up in the boat waving BOTH arms above his head, mouth open, calling out. "
            f"Dad is at roughly the same height as Kai since the boat sits low in the water. "
            f"Kai's expression: pure joy, shouting back. "
            f"{SETTING_RAIN} "
            f"Kai's skin {KAI_SKIN_HEX}, Dad's skin {DAD_SKIN_HEX}. "
            f"Small simple solid black dot eyes with ZERO white on BOTH characters. "
            f"Landscape format. "
            f"ABSOLUTELY NO rosy cheeks, NO blush marks on either face."
        ),
    },
    {
        "name": "page7",
        "prompt": (
            f"Show a joyful reunion scene on the dock. "
            f"Dad (Afro-Trinidadian man, mid-30s, dark brown skin {DAD_SKIN_HEX}, "
            f"bright YELLOW waterproof fisherman's jacket, dark shorts, rubber boots, "
            f"very short close-cropped hair, broad warm smile) "
            f"has scooped Kai (the boy from the reference image, orange t-shirt, dark navy 3/4-length shorts) "
            f"up off his feet in a huge bear hug. "
            f"They are spinning in a circle — pure joy! "
            f"Kai's face pressed against Dad's shoulder, HUGE grin. "
            f"{BOAT} is tied up at the dock in the background. "
            f"{SETTING_CLEARING} "
            f"Kai's skin {KAI_SKIN_HEX}, Dad's skin {DAD_SKIN_HEX}. "
            f"Small simple solid black dot eyes with ZERO white on BOTH characters. "
            f"Landscape format. "
            f"ABSOLUTELY NO rosy cheeks, NO blush marks on either face."
        ),
    },
    {
        "name": "page8",
        "prompt": (
            f"Show Kai (the boy from the reference image — EXACT same appearance: "
            f"medium-dark warm Caribbean brown skin hex {KAI_SKIN_HEX}, "
            f"short tight natural black afro curls, bright orange t-shirt with yellow star, "
            f"dark navy 3/4-length shorts) "
            f"sitting beside Dad (Afro-Trinidadian man, mid-30s, dark brown skin {DAD_SKIN_HEX}, "
            f"short close-cropped black hair, yellow fisherman's jacket, dark trousers, rubber boots) "
            f"on the dock edge, dangling their feet over the water. "
            f"Dad has his arm around Kai. "
            f"Both have warm, contented smiles. "
            f"CRITICAL: Kai's skin must be {KAI_SKIN_HEX} — medium-dark warm Caribbean brown "
            f"(NOT light tan, NOT pale — darker than caramel, like toffee or warm chocolate). "
            f"{BOAT} is tied up at the dock behind them. "
            f"The tropical rain has cleared — warm golden light, blue sky showing. "
            f"{SETTING_CLEARING} "
            f"Small simple solid black dot eyes with ZERO white on BOTH characters. "
            f"Landscape format. "
            f"ABSOLUTELY NO rosy cheeks, NO blush marks on either face."
        ),
    },
]


# ─── API Functions ────────────────────────────────────────────────

async def recolour_hero(
    session: aiohttp.ClientSession, hero_path: Path, output_path: Path
) -> "Path | None":
    """Recolour existing hero to target skin/hair hex values."""
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"
    hero_b64 = base64.b64encode(hero_path.read_bytes()).decode("utf-8")

    parts = [
        {"inlineData": {"mimeType": "image/png", "data": hero_b64}},
        {"text": (
            f"Edit this character image. Change ONLY the skin colour and hair colour. "
            f"Keep everything else EXACTLY the same — same pose, same outfit, same eyes, same background, same style. "
            f"New SKIN colour: {KAI_SKIN_HEX} (medium-dark warm Caribbean brown — like caramel or toffee). "
            f"New HAIR colour: {KAI_HAIR_HEX} (near-black). "
            f"Do NOT change the clothes, eyes, expression, pose, or background."
        )},
    ]

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }

    print(f"  [recolour] Setting skin to {KAI_SKIN_HEX}, hair to {KAI_HAIR_HEX}...")

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
    session: aiohttp.ClientSession, output_path: Path
) -> "Path | None":
    """Generate the Kai hero reference image with eye-style injection."""
    full_prompt = f"{KAI_HERO['description']} {BASE_STYLE}"
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"

    parts = []
    if EYE_REF_PATH.exists():
        eye_b64 = base64.b64encode(EYE_REF_PATH.read_bytes()).decode("utf-8")
        parts.append({
            "text": (
                "EYE STYLE REFERENCE — The new character MUST have the EXACT same eye style "
                "as this character. Look at the eyes: they are tiny solid black dots with "
                "no white highlights, no reflections, no detail. Copy this eye style exactly:"
            )
        })
        parts.append({"inlineData": {"mimeType": "image/png", "data": eye_b64}})
        parts.append({
            "text": (
                f"Now generate a NEW character (different person, different outfit) but with "
                f"the SAME tiny solid black dot eye style as the reference above. "
                f"Here is the character to generate: {full_prompt}"
            )
        })
    else:
        print(f"  WARNING: Eye reference not found at {EYE_REF_PATH}")
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
    hero_b64: str,
    eye_ref_b64: "str | None",
    scene: dict,
) -> "bytes | None":
    """Generate a scene using Gemini with hero reference + eye style injection."""
    full_prompt = f"{scene['prompt']} {BASE_STYLE}"
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"

    parts = []

    # Eye style reference first
    if eye_ref_b64:
        parts.append({
            "text": (
                "EYE STYLE REFERENCE — ALL characters in this scene MUST have the EXACT "
                "same eye style as this character. The eyes are tiny solid black dots with "
                "ZERO white — no highlights, no reflections, no sclera. "
                "Copy this eye style exactly:"
            )
        })
        parts.append({"inlineData": {"mimeType": "image/png", "data": eye_ref_b64}})

    # Hero reference (Kai)
    parts.append({
        "text": (
            f"CHARACTER REFERENCE — KAI. Keep his exact appearance: "
            f"skin colour {KAI_SKIN_HEX} (warm Caribbean brown), short tight natural afro, "
            f"bright orange t-shirt with yellow star, dark navy 3/4-length shorts, bare feet. "
            f"Eyes must be solid black dots like the eye reference above:"
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

    print(f"\n{'='*60}")
    print(f'L3.5: "The Boat with the Red Sail" — Port of Spain, Trinidad')
    print(f"Output: {OUTPUT_DIR}")
    print(f"Mode: {mode}")
    print(f"Eye ref: {'FOUND' if EYE_REF_PATH.exists() else 'NOT FOUND'}")
    print(f"{'='*60}")

    hero_path = OUTPUT_DIR / "hero_reference.png"

    async with aiohttp.ClientSession() as session:

        # Recolour mode — fix skin tone on existing hero
        if mode == "recolour":
            if not hero_path.exists():
                print("ERROR: Hero image must exist first. Run with 'hero' mode.")
                sys.exit(1)
            result = await recolour_hero(session, hero_path, hero_path)
            if not result:
                print("FATAL: Could not recolour hero")
                sys.exit(1)
            print("\nRecolour done.")
            return

        # Step 1: Generate hero reference
        if mode in ("all", "hero"):
            if not hero_path.exists() or mode == "hero":
                result = await generate_hero_image(session, hero_path)
                if not result:
                    print("FATAL: Could not generate hero. Check API key and try again.")
                    sys.exit(1)
                await asyncio.sleep(REQUEST_DELAY)

        if mode == "hero":
            print(f"\nHero saved to: {hero_path}")
            print("Review the hero image before running scenes.")
            return

        # Step 2: Load hero and eye references
        if not hero_path.exists():
            print("ERROR: Hero reference not found. Run with 'hero' first.")
            sys.exit(1)

        hero_b64 = base64.b64encode(hero_path.read_bytes()).decode("utf-8")
        eye_ref_b64 = None
        if EYE_REF_PATH.exists():
            eye_ref_b64 = base64.b64encode(EYE_REF_PATH.read_bytes()).decode("utf-8")
            print(f"\n  Loaded: hero ({len(hero_b64)//1024}KB), eye ref ({len(eye_ref_b64)//1024}KB)")
        else:
            print(f"\n  Loaded: hero ({len(hero_b64)//1024}KB) — WARNING: no eye ref!")

        # Step 3: Generate all scenes
        generated = []
        failed = []

        for scene in SCENES:
            output_path = OUTPUT_DIR / f"{scene['name']}.png"

            if output_path.exists():
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
        print(f"Generated {len(generated)}/{total} images for L3.5")
        if failed:
            print(f"FAILED: {', '.join(failed)}")
            print("Delete failed image files and re-run to retry.")
        else:
            print("All images generated successfully!")
        print(f"Output folder: {OUTPUT_DIR}")


if __name__ == "__main__":
    asyncio.run(main())
