"""
Generate illustrations for L3.1 "The Big Bike Race" using Gemini API.

Setting: French countryside bike race — sunny rural roads, pine trees, stone gate, lake
Main character: Boy in green cycling jersey #9, white helmet, curly brown hair
Side characters: Other young cyclists, race marshal

Usage:
    py -3.12 scripts/generate_l3_1_images.py           # Generate all
    py -3.12 scripts/generate_l3_1_images.py hero       # Hero only
    py -3.12 scripts/generate_l3_1_images.py scenes     # Scenes only
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
OUTPUT_DIR = Path(__file__).parent.parent / "output" / "images" / "L3_1_B1"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

EYE_REF_PATH = Path(__file__).parent.parent / "output" / "images" / "L4_1_B1" / "hero_reference.png"

REQUEST_DELAY = 3
MAX_RETRIES = 3
BACKOFF_BASE = 5

SKIN_HEX = "#B8956A"   # Medium Mediterranean
HAIR_HEX = "#6B3A1F"   # Warm curly brown

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

# Character — matches existing hero reference
BOY_SHORT = "the boy in the green cycling jersey number 9 with white helmet"

# Setting descriptions
RACE_START = (
    "sunny French countryside — a stone starting gate on a rural road, "
    "rolling green hills, tall cypress trees, bright blue sky, "
    "colourful bunting strung across the gate"
)

COUNTRYSIDE_ROAD = (
    "sunny French countryside road — winding path through rolling green "
    "fields, tall pine trees lining the road, wildflowers on verges, "
    "distant stone farmhouses, bright warm sunshine, clear blue sky"
)

LAKE_SETTING = (
    "a beautiful still blue lake surrounded by green hills and pine trees, "
    "sunlight sparkling on the water surface, French countryside"
)

# Bike description for consistency
GREEN_BIKE = "a small bright green bicycle with black wheels and handlebars"

SCENES = [
    {
        "name": "cover",
        "prompt": (
            f"Show the boy from the reference image (green cycling jersey #9, "
            f"white helmet, curly brown hair) riding {GREEN_BIKE} fast along a "
            f"French countryside road. He grins with excitement, leaning forward "
            f"over the handlebars. Rolling green hills and tall pine trees behind "
            f"him, bright blue sky, warm sunshine. "
            f"Skin colour {SKIN_HEX}. "
            f"Eyes: tiny solid black dots ONLY, no white. Portrait format 3:4."
        ),
    },
    {
        "name": "page1",
        "prompt": (
            f"Show the boy from the reference image (green cycling jersey #9, "
            f"white helmet, curly brown hair) standing with {GREEN_BIKE} at a "
            f"starting line. {RACE_START}. Several other children on bikes line "
            f"up beside him (varied jerseys — red, blue, yellow). The boy looks "
            f"excited and nervous, gripping his handlebars tightly. A race "
            f"marshal in a yellow vest stands near the stone gate. "
            f"Skin colour {SKIN_HEX}. "
            f"Eyes: tiny solid black dots ONLY. Landscape format."
        ),
    },
    {
        "name": "page2",
        "prompt": (
            f"Show a race marshal (adult in yellow vest) holding a flag up at the "
            f"stone starting gate with bunting. The boy from the reference image "
            f"(green cycling jersey #9, white helmet) crouches forward on "
            f"{GREEN_BIKE}, gripping the handlebars tight, jaw set with "
            f"determination. Other child cyclists beside him ready to go. "
            f"{RACE_START}. Tense, exciting moment just before the race starts. "
            f"Skin colour {SKIN_HEX}. "
            f"Eyes: tiny solid black dots ONLY. Landscape format."
        ),
    },
    {
        "name": "page3",
        "prompt": (
            f"Show the boy from the reference image (green cycling jersey #9, "
            f"white helmet) riding {GREEN_BIKE} fast past a tall pine tree on a "
            f"French countryside road. He zooms past a wide stone gate (old "
            f"farmyard entrance). Bright warm sunshine, blue sky, green rolling "
            f"hills. His hair curls out from under the helmet. He looks happy "
            f"and free, mouth open with joy. "
            f"Skin colour {SKIN_HEX}. "
            f"Eyes: tiny solid black dots ONLY. Landscape format."
        ),
    },
    {
        "name": "page4",
        "prompt": (
            f"Show a dramatic scene: a girl cyclist (red jersey, black helmet) "
            f"has fallen off her bike on a stony section of road. She sits on "
            f"the ground giving a brave thumbs-up and smile. Loose stones "
            f"scattered on the path. The boy from the reference image (green "
            f"cycling jersey #9, white helmet) rides past on {GREEN_BIKE}, "
            f"looking back at her with concern but still pedalling. "
            f"{COUNTRYSIDE_ROAD} around them. "
            f"Skin colour {SKIN_HEX}. "
            f"Eyes: tiny solid black dots ONLY. Landscape format."
        ),
    },
    {
        "name": "page5",
        "prompt": (
            f"Show the boy from the reference image (green cycling jersey #9, "
            f"white helmet) riding {GREEN_BIKE} alongside {LAKE_SETTING}. "
            f"The lake shines brilliantly in the sunshine, light sparkling on "
            f"the water. The boy looks amazed at the beautiful view, mouth open. "
            f"He is about to turn his bike around at the halfway point. "
            f"Pine trees and green hills reflected in the lake. "
            f"Skin colour {SKIN_HEX}. "
            f"Eyes: tiny solid black dots ONLY. Landscape format."
        ),
    },
    {
        "name": "page6",
        "prompt": (
            f"Show the boy from the reference image (green cycling jersey #9, "
            f"white helmet) pedalling {GREEN_BIKE} with all his might on the "
            f"return road. He is sweating, face determined, leaning forward, "
            f"legs pushing hard on the pedals. {COUNTRYSIDE_ROAD}. "
            f"Other cyclists visible far behind him on the road. "
            f"Urgent, exciting atmosphere — racing to make it back in time. "
            f"Skin colour {SKIN_HEX}. "
            f"Eyes: tiny solid black dots ONLY. Landscape format."
        ),
    },
    {
        "name": "page7",
        "prompt": (
            f"Show the boy from the reference image (green cycling jersey #9, "
            f"white helmet) crossing the finish line at the stone gate with "
            f"bunting. He throws one arm in the air with a HUGE wide grin of "
            f"triumph, the other hand still on {GREEN_BIKE}. "
            f"Spectators (children and adults) cheer on both sides. "
            f"Colourful bunting flutters above. Bright sunshine. "
            f"The boy slides off his bike with pure joy. "
            f"Skin colour {SKIN_HEX}. "
            f"Eyes: tiny solid black dots ONLY. Landscape format."
        ),
    },
    {
        "name": "page8",
        "prompt": (
            f"Show the boy from the reference image (green cycling jersey #9, "
            f"white helmet) standing proudly holding up a flat round plate "
            f"(a prize plate/medal). He has a massive grin, waving at his "
            f"friends (other child cyclists in varied jerseys nearby). "
            f"{RACE_START} in background with bunting. Warm golden afternoon "
            f"light. Pure happiness and pride. French countryside setting. "
            f"Skin colour {SKIN_HEX}. "
            f"Eyes: tiny solid black dots ONLY. Landscape format."
        ),
    },
]


async def generate_scene_image(session, hero_b64, eye_ref_b64, scene):
    full_prompt = f"{scene['prompt']} {BASE_STYLE}"
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"
    parts = []
    if eye_ref_b64:
        parts.append({"text": "EYE STYLE REFERENCE — ALL characters: tiny solid black dots, ZERO white:"})
        parts.append({"inlineData": {"mimeType": "image/png", "data": eye_ref_b64}})
    parts.append({"text": f"CHARACTER REFERENCE — BOY. Keep exact appearance: skin {SKIN_HEX}, curly brown hair {HAIR_HEX}, green cycling jersey with number 9, white helmet, black shorts, white trainers:"})
    parts.append({"inlineData": {"mimeType": "image/png", "data": hero_b64}})
    parts.append({"text": f"SCENE TO GENERATE: {full_prompt}"})
    payload = {"contents": [{"parts": parts}], "generationConfig": {"responseModalities": ["IMAGE"]}}
    for attempt in range(MAX_RETRIES):
        try:
            async with session.post(url, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    for part in result.get("candidates", [{}])[0].get("content", {}).get("parts", []):
                        if "inlineData" in part:
                            return base64.b64decode(part["inlineData"]["data"])
                    return None
                elif response.status in (429, 503):
                    wait = BACKOFF_BASE * (2 ** attempt)
                    print(f"    {response.status}, waiting {wait}s...")
                    await asyncio.sleep(wait)
                else:
                    print(f"    Error {response.status}: {(await response.text())[:200]}")
                    await asyncio.sleep(BACKOFF_BASE * (2 ** attempt))
        except Exception as e:
            print(f"    {e}")
            await asyncio.sleep(BACKOFF_BASE)
    return None


async def main():
    mode = sys.argv[1].lower() if len(sys.argv) > 1 else "all"
    if not GEMINI_API_KEY:
        print("ERROR: GOOGLE_GEMINI_API_KEY not found"); sys.exit(1)
    print(f"\n{'='*55}")
    print(f'L3.1: "The Big Bike Race" — France')
    print(f"Output: {OUTPUT_DIR}\nMode: {mode}\n{'='*55}")
    hero_path = OUTPUT_DIR / "hero_reference.png"

    if not hero_path.exists():
        print("ERROR: hero_reference.png not found."); sys.exit(1)

    async with aiohttp.ClientSession() as session:
        hero_b64 = base64.b64encode(hero_path.read_bytes()).decode("utf-8")
        eye_ref_b64 = base64.b64encode(EYE_REF_PATH.read_bytes()).decode("utf-8") if EYE_REF_PATH.exists() else None
        print(f"\n  Loaded: hero ({len(hero_b64)//1024}KB), eye ref ({len(eye_ref_b64)//1024 if eye_ref_b64 else 0}KB)")
        print(f"\n  Generating {len(SCENES)} scenes...\n")
        generated, failed = [], []
        for scene in SCENES:
            out = OUTPUT_DIR / f"{scene['name']}.png"
            if out.exists() and mode != "scenes":
                print(f"  [{scene['name']}] exists, skip"); generated.append(scene['name']); continue
            print(f"  [{scene['name']}] Generating...")
            data = await generate_scene_image(session, hero_b64, eye_ref_b64, scene)
            if data:
                out.write_bytes(data); print(f"  [{scene['name']}] Saved ({len(data)//1024} KB)")
                generated.append(scene['name'])
            else:
                print(f"  [{scene['name']}] FAILED"); failed.append(scene['name'])
            await asyncio.sleep(REQUEST_DELAY)
        print(f"\n{'='*55}\nGenerated: {len(generated)}/{len(SCENES)}")
        if failed: print(f"Failed: {', '.join(failed)}")
        else: print("All images generated!")
        print(f"Output: {OUTPUT_DIR}\n{'='*55}")

if __name__ == "__main__":
    asyncio.run(main())
