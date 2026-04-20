"""
Generate illustrations for L5.2 "Near the Door" using Gemini API.

Setting: Snowy Swedish forest — journey/peek-reveal story.
Main character: Swedish girl Astrid (5 years old, blonde braids, red wool jumper
under a dark blue winter coat + Nordic hat + scarf + mittens for outdoor pages)
Side characters: Dad (bookend pages 1 + 8 only), red fox (pages 2-3),
snow hare (pages 4-5), red deer stag (pages 6-7)

Pipeline:
  1. Generate hero reference image (girl, neutral pose, full body, indoor outfit)
  2. Inject hero into every scene alongside scene-specific prompt
  3. Outdoor scenes re-specify the winter outerwear on top of the hero
  4. Each animal described consistently in its two adjacent scene prompts

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

# Dad description used consistently (appears only on pages 1 and 8)
DAD_DESC = (
    "Swedish dad (35-40 years old, light skin hex #F0D0B0, short brown hair, "
    "friendly face with slight stubble, warm kind eyes, grey wool sweater with a "
    "subtle Scandinavian pattern at the neckline, dark trousers, woolly socks, "
    "tiny solid black dot eyes)"
)

# Outdoor outfit — re-specified in every outdoor scene prompt so Gemini adds
# the winter outerwear on top of the hero reference (which shows indoor outfit)
OUTDOOR_OUTFIT = (
    "She is dressed for deep winter: her cosy red hand-knitted wool jumper is "
    "now worn UNDER a thick dark blue winter coat (knee-length, buttoned up), "
    "with a cream wool hat with a Nordic snowflake pattern pulled down over her "
    "head (braids still hanging out below the hat), a bright red wool scarf "
    "wrapped around her neck, dark blue wool mittens on her hands, and warm "
    "brown leather winter boots on her feet."
)

# Animal descriptions (used only on the pages where they appear)
FOX_DESC = (
    "a red fox: bright orange-red fur, white chest and belly, large pointed "
    "ears with black tips, thick bushy tail with a white tip, small sharp "
    "muzzle, tiny solid black dot eyes, delicate black legs"
)

HARE_DESC = (
    "a mountain hare in pure white winter coat (blending with the snow), long "
    "upright ears with distinct black tips, powerful bent back legs, small "
    "front paws, short white tail, tiny solid black dot eyes"
)

DEER_DESC = (
    "a majestic red deer stag: thick warm brown winter coat, tall branching "
    "antlers with 4-5 points per side rising up into the sky, strong neck, "
    "elegant legs, kind calm expression, tiny solid black dot eyes"
)

# Settings
SETTING_CABIN_INTERIOR = (
    "cosy Scandinavian log cabin interior: pale wooden floors, warm wooden "
    "walls, sheepskin rug, wood-burning stove with warm orange firelight glow, "
    "simple wooden armchair, minimalist Nordic decor, warm inviting lighting"
)

SETTING_FOREST_LIGHT = (
    "snowy Swedish forest with tall snow-covered pine trees, deep fresh white "
    "snow on the forest floor, soft dappled winter daylight filtering through "
    "the branches, gentle snowfall"
)

SETTING_FROZEN_STREAM = (
    "snowy Swedish forest beside a frozen stream with jagged patterns of pale "
    "blue-white ice, weathered grey boulders, deep untouched snow, birch and "
    "pine trees in the background, cold crisp winter air with visible breath"
)

SETTING_FOREST_DEEP = (
    "denser darker part of the Swedish pine forest: tall dark pine trunks "
    "close together, less light filtering down, pine needles dark against the "
    "snow, shadowy mysterious atmosphere, a broken branch on the snowy ground"
)

SETTING_FOREST_CLEARING = (
    "snowy forest clearing surrounded by dark pines, soft gentle snowfall, "
    "pale grey winter sky, quiet reverent atmosphere"
)

# ─── Scene Prompts ────────────────────────────────────────────────
# Journey structure: cabin → forest (clue/reveal x3) → cabin
# Pages with the girl outdoors add OUTDOOR_OUTFIT on top of the hero reference.
# CLUE pages (2, 4, 6) must show ONLY the body part hinted at — never the
# whole animal — so the reveal on the next page lands.
SCENES = [
    {
        "name": "cover",
        "prompt": (
            f"Mysterious, curiosity-filled winter book-cover scene. Show the girl "
            f"from the reference image standing alone in the centre of "
            f"{SETTING_FOREST_CLEARING}, her body half-turned as she looks ahead "
            f"into the misty snowy pines with a wondering, curious expression — as "
            f"if she can sense something wonderful just out of sight. {OUTDOOR_OUTFIT} "
            f"Small animal paw prints and hoof prints trail away through the fresh "
            f"snow off into the misty trees — tantalising hints that animals are "
            f"near, but NO animals are visible anywhere in the image. "
            f"The misty pines in the distance hint at hidden shapes but do not reveal "
            f"any animal. Soft snow falling, warm golden-blue winter light filtering "
            f"through the trees, a sense of quiet adventure and mystery. "
            f"Do NOT draw any fox, hare, deer, or any animal — just the girl, the "
            f"snowy forest, and the prints in the snow. "
            f"Skin colour {SKIN_HEX}. Eyes: tiny solid black dots ONLY, no white. "
            f"PORTRAIT format 3:4 (book cover)."
        ),
    },
    {
        "name": "page1",
        "prompt": (
            f"Show the girl from the reference image inside {SETTING_CABIN_INTERIOR}, "
            f"standing by an open wooden front door, in the act of pulling on her "
            f"thick dark blue winter coat over her red wool jumper. Her cream wool "
            f"hat with Nordic snowflake pattern is on her head, braids hanging down. "
            f"Her red wool scarf and dark blue mittens lie ready on a wooden bench "
            f"beside her. Brown winter boots on her feet. Through the open doorway: "
            f"a snowy path between tall snow-covered pine trees. "
            f"In the BACKGROUND of the cabin: {DAD_DESC} sits in a wooden armchair by "
            f"the wood-burning stove, warm firelight glowing around him, smiling at "
            f"her. Both characters skin colour {SKIN_HEX}. "
            f"Eyes: tiny solid black dots ONLY, no white. Landscape format."
        ),
    },
    {
        "name": "page2",
        "prompt": (
            f"Show the girl from the reference image walking alone in {SETTING_FOREST_LIGHT}. "
            f"{OUTDOOR_OUTFIT} Small boot prints trail behind her through the deep "
            f"fresh snow. She has stopped and is listening intently — head tilted, "
            f"one mittened hand raised near her ear, curious alert expression. "
            f"Beside a LARGE THICK pine tree trunk just ahead of her: sticking out "
            f"from behind the trunk near the ground is a single bushy FOX TAIL — "
            f"fluffy orange-red fur with a distinct WHITE TIP, curling out from "
            f"behind the tree. ONLY the tail is visible. The body, head, legs, and "
            f"ears of the fox are COMPLETELY HIDDEN behind the thick pine trunk. "
            f"Do NOT show any part of the fox's head, face, body, ears, or legs — "
            f"ONLY the fluffy orange-and-white tail peeking out from behind the "
            f"tree. The thick tree trunk blocks everything else from view. "
            f"Skin colour {SKIN_HEX}. Eyes: tiny solid black dots ONLY, no white. "
            f"Landscape format."
        ),
    },
    {
        "name": "page3",
        "prompt": (
            f"Show the girl from the reference image crouched low in the snow in "
            f"{SETTING_FOREST_LIGHT}, peeking around the side of a thick pine tree "
            f"trunk with a delighted surprised smile. {OUTDOOR_OUTFIT} "
            f"Now fully revealed in front of her, sitting calmly in the snow facing "
            f"her: {FOX_DESC}. The fox looks at her with quiet curiosity, not afraid. "
            f"Same snowy pine forest setting as the previous page. "
            f"Skin colour {SKIN_HEX}. Eyes: tiny solid black dots ONLY, no white. "
            f"Landscape format."
        ),
    },
    {
        "name": "page4",
        "prompt": (
            f"Show the girl from the reference image standing alert on a snowy "
            f"forest path. {OUTDOOR_OUTFIT} Her breath is visible as a soft white "
            f"puff in the cold air. "
            f"Just AHEAD of her, sitting on DEEP WHITE SNOW on the snowy forest "
            f"floor: a large weathered grey boulder. The boulder is clearly on "
            f"snow-covered solid ground — NOT in water, NOT in a stream. The snow "
            f"around the base of the boulder is deep and white. "
            f"Above the top of the boulder: TWO long white ears with distinct "
            f"black tips poke straight up — ONLY the ear tips visible, the rest "
            f"of the animal COMPLETELY HIDDEN behind the rock. Do NOT show the "
            f"full hare — only the two ear tips above the rock. "
            f"A frozen stream with pale blue-white ice may be visible in the "
            f"DISTANT BACKGROUND, but the rock and the girl are both on the snowy "
            f"bank WELL AWAY from the water. Snow-covered birch and pine trees "
            f"around. "
            f"Her expression is alert, curious, holding very still. "
            f"Skin colour {SKIN_HEX}. Eyes: tiny solid black dots ONLY, no white. "
            f"Landscape format."
        ),
    },
    {
        "name": "page5",
        "prompt": (
            f"Show the girl from the reference image tiptoeing quietly beside the "
            f"large grey boulder in {SETTING_FROZEN_STREAM}, peeking over the top of "
            f"the rock with wide delighted eyes, one mittened finger pressed to her "
            f"lips in a 'shh' gesture. {OUTDOOR_OUTFIT} "
            f"Now fully revealed: {HARE_DESC}, caught mid-leap bounding away across "
            f"deep WHITE SNOW on the forest floor — powerful back legs extended, "
            f"soft motion-blur lines showing quick movement. "
            f"CRITICAL: the hare is leaping ON THE DEEP SNOW on the snowy bank "
            f"BESIDE the frozen stream — NOT on the water, NOT on the ice of the "
            f"stream. The hare's feet touch fresh white snow, not the blue ice. "
            f"The frozen stream may be visible in the scene but the hare is clearly "
            f"on snowy ground away from the water. "
            f"Skin colour {SKIN_HEX}. Eyes: tiny solid black dots ONLY, no white. "
            f"Landscape format."
        ),
    },
    {
        "name": "page6",
        "prompt": (
            f"Winter forest scene. "
            f"FOREGROUND: the girl from the reference image stands in deep snow "
            f"to one side of the scene, small in frame, looking off across to "
            f"the other side with a curious, slightly wary expression. "
            f"{OUTDOOR_OUTFIT} "
            f"HER EYES must match the eye reference exactly — tiny solid black "
            f"filled dots, ZERO white, no iris, no pupil detail, no highlight. "
            f"MIDGROUND: a BROAD, WIDE, DOME-SHAPED snow dune — a huge wide "
            f"rounded mound of windswept snow, much WIDER than it is tall, "
            f"sitting on the snowy forest floor and filling the centre of the "
            f"scene. The dune is shaped like a long low hill or an igloo — "
            f"wide and broad with a gently rounded crest. The viewing angle "
            f"is from a LOW position, almost eye-level with the top of the "
            f"dune, so that the dune's crest acts as a horizon line blocking "
            f"everything behind it from view. "
            f"VISIBLE above the crest of the dune against the pale grey misty "
            f"sky: ONLY two tall branching antler-shapes (4-5 points per side), "
            f"dark silhouette like elegant bare winter branches. Just the "
            f"antlers — that is all. The antler bases appear to come from "
            f"BEHIND the crest of the dune, rising up into the sky. "
            f"DO NOT DRAW anywhere in the image: any deer head, any deer face, "
            f"any deer eyes, any deer ears, any deer muzzle, any deer nose, "
            f"any deer neck, any deer fur, any deer body, any deer legs, or "
            f"any silhouette of a deer. The ONLY part that hints at an animal "
            f"is the pair of antler shapes above the dune's crest. The image "
            f"must suggest 'something is hidden behind the dune' — not 'a deer "
            f"is standing behind the dune with its head peeking out.' Treat "
            f"the antlers as abstract branching shapes emerging from behind "
            f"the snow mound, with NOTHING else animal-like visible. "
            f"Dense dark misty pine forest in the far background, pale "
            f"atmospheric light. Skin colour {SKIN_HEX}. "
            f"Eyes (of the girl only): tiny solid black dots ONLY, no white. "
            f"Landscape format."
        ),
    },
    {
        "name": "page7",
        "prompt": (
            f"Show the girl from the reference image standing very still and small "
            f"in {SETTING_FOREST_CLEARING}, hands at her sides, looking up in awe. "
            f"{OUTDOOR_OUTFIT} "
            f"Now fully revealed, stepping out from between the dark pines: "
            f"{DEER_DESC}. The stag stands calm and still, meeting the girl's gaze "
            f"directly. Soft snow falling gently. Quiet reverent magical mood. "
            f"Skin colour {SKIN_HEX}. Eyes: tiny solid black dots ONLY, no white. "
            f"Landscape format."
        ),
    },
    {
        "name": "page8",
        "prompt": (
            f"View from OUTSIDE the Scandinavian log cabin, looking TOWARD the open "
            f"front door. The girl from the reference image walks TOWARD the door "
            f"from the snowy outside, her BACK toward the viewer (seen from behind "
            f"or three-quarter rear view), stepping INTO the warm cabin. {OUTDOOR_OUTFIT} "
            f"Her coat, hat and shoulders are lightly DUSTED with snowflakes from "
            f"her walk. Small fresh boot prints in the snow behind her lead up to "
            f"the door. "
            f"Framed in the open doorway ahead of her: {DAD_DESC} stands just inside "
            f"the cabin, holding the door wide open with one hand and welcoming her "
            f"in with a warm loving smile, the other hand reaching gently toward her. "
            f"Warm orange firelight glows from {SETTING_CABIN_INTERIOR} visible "
            f"behind Dad through the doorway. Outside (around the girl): snow "
            f"falling thickly in the late afternoon winter light, snow-covered pines "
            f"beyond the cabin. "
            f"CRITICAL: the girl is walking INTO the cabin (toward Dad, away from "
            f"the viewer) — she is NOT leaving the cabin, she is RETURNING home. "
            f"Both characters skin colour {SKIN_HEX}. "
            f"Eyes: tiny solid black dots ONLY, no white. Landscape format."
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

    # Hero reference — preserve face + hair identity; outerwear may be added
    # on top of the red jumper for outdoor scenes per the scene prompt.
    parts.append({
        "text": (
            f"CHARACTER REFERENCE — GIRL. Keep her EXACT face, skin tone, and hair: "
            f"light fair skin {SKIN_HEX}, golden blonde hair {HAIR_HEX} in two neat "
            f"braids, same friendly face. Her red wool jumper is always worn "
            f"underneath — but for outdoor winter scenes, follow the SCENE prompt "
            f"and add the winter coat, hat, scarf, mittens and boots ON TOP of the "
            f"jumper as described there. "
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
    print(f'L5.2: "Near the Door" — Snowy Swedish forest journey')
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
