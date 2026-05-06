"""
[STALE 2026-05-04] This script generates the OLD "Draw It Again!" art-class
images. The L3.4 illustrations were replaced with an autumn-walk scene
("What Min Saw") and this script no longer reflects what's in production.
Re-running it will produce the wrong images. Rewrite before use.

Generate illustrations for L3.4 "Draw It Again!" using Gemini API.

Setting: Seoul, South Korea — modern school art class
Main character: Min (Korean girl, 6-7, blue art smock, pink clip)
Side character: Korean boy classmate (green t-shirt)

Usage:
    py -3.12 scripts/generate_l3_4_images.py           # Generate all
    py -3.12 scripts/generate_l3_4_images.py hero       # Hero only
    py -3.12 scripts/generate_l3_4_images.py scenes     # Scenes only
"""

import asyncio, aiohttp, os, sys, base64
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

GEMINI_API_KEY = os.environ.get("GOOGLE_GEMINI_API_KEY")
BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
OUTPUT_DIR = Path(__file__).parent.parent / "output" / "images" / "L3_4_B1"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
EYE_REF_PATH = Path(__file__).parent.parent / "output" / "images" / "L4_1_B1" / "hero_reference.png"
REQUEST_DELAY = 3; MAX_RETRIES = 3; BACKOFF_BASE = 5

SKIN_HEX = "#F0D5B8"; HAIR_HEX = "#0D0D0D"

BASE_STYLE = (
    "Whimsical children's book illustration. Hand-drawn cartoon style with "
    "soft watercolour textured backgrounds and clean black-outlined characters. "
    "CRITICAL EYE RULE: Every character MUST have eyes that are tiny solid black "
    "filled circles like dots. NO white, NO iris, NO highlight. "
    "Warm, friendly. No text, words, letters, or numbers in the image."
)

GIRL_HERO = {
    "description": (
        f"A cartoon girl character, about 6 years old, with light warm beige East Asian "
        f"skin, hex colour {SKIN_HEX}. Straight black shoulder-length hair (hex {HAIR_HEX}) "
        f"with a small pink hair clip on one side. "
        f"She wears a light blue school art smock (short-sleeved, slightly paint-smudged) "
        f"over a pink t-shirt, dark navy leggings, and white trainers. "
        f"Solid black dot eyes — ZERO white. Cheerful curious expression. "
        f"NO rosy cheeks, NO blush marks. Standing neutral pose, full body, "
        f"plain light cream background."
    ),
}

BOY_DESC = (
    "Korean boy classmate (6-7 years old, light warm beige skin #EFD1AD, "
    "short straight black hair, light green t-shirt, grey shorts, white trainers)"
)

ART_ROOM = (
    "bright modern Korean school art room: clean white walls, flat wooden desks, "
    "colourful student artwork pinned to walls, large windows showing modern "
    "Seoul apartment buildings and autumn trees with golden leaves outside"
)

OIL_STICKS = "chunky colourful oil pastel sticks (red, green, blue, yellow) scattered on the desk"
HAWK_DRAWING = "a large bold drawing of a hawk with spread wings, sharp curved claws, and a long beak on white paper, done in thick oil pastel strokes"

SCENES = [
    {"name": "cover", "prompt": (
        f"Show the girl from the reference image (blue art smock, pink hair clip, "
        f"black hair) standing at a desk in {ART_ROOM}, holding a chunky oil pastel "
        f"stick, looking proudly at {HAWK_DRAWING} on her desk. {OIL_STICKS}. "
        f"Skin {SKIN_HEX}. Eyes: tiny solid black dots ONLY. Portrait format 3:4."
    )},
    {"name": "page1", "prompt": (
        f"Show the girl from the reference image (blue art smock, pink hair clip) "
        f"sitting at a desk in {ART_ROOM}, pulling {OIL_STICKS} out of a box onto "
        f"a big white sheet of paper. She looks excited and determined, gripping a "
        f"stick tightly. Skin {SKIN_HEX}. Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page2", "prompt": (
        f"Show the girl from the reference image (blue art smock, pink hair clip) "
        f"drawing intensely on white paper at her desk. She is mid-stroke, pressing "
        f"a bold oil pastel line. On the paper: the beginnings of {HAWK_DRAWING}. "
        f"Oil drips and smudges on the sheet. She is focused, tongue slightly out. "
        f"{ART_ROOM}. Skin {SKIN_HEX}. Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page3", "prompt": (
        f"Show two characters at a desk in {ART_ROOM}: "
        f"1) {BOY_DESC} standing and pointing at the hawk drawing on the paper, "
        f"face looking critical, one finger pointing down at the claws. "
        f"2) The girl from the reference image (blue art smock, pink hair clip) "
        f"sitting at the desk, looking upset and hurt — brows furrowed, mouth "
        f"turned down, hands in lap. The hawk drawing visible on paper between them. "
        f"Skin {SKIN_HEX}. Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page4", "prompt": (
        f"Show the girl from the reference image (blue art smock, pink hair clip) "
        f"at her desk in {ART_ROOM}. She has pushed the first drawing aside and "
        f"pulled out a FRESH big white sheet of paper. Her expression has changed "
        f"from hurt to determined — jaw set, eyes bright. She grips an oil pastel "
        f"stick firmly. The crumpled first attempt sits to one side. "
        f"Skin {SKIN_HEX}. Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page5", "prompt": (
        f"Show the girl from the reference image (blue art smock, pink hair clip) "
        f"drawing carefully and precisely on the fresh white paper. On the paper: "
        f"a BETTER version of the hawk — the claws look perfect, wings spread wide, "
        f"bold colourful oil pastel strokes. She looks calm, satisfied, focused. "
        f"Smooth confident strokes. {ART_ROOM}. "
        f"Skin {SKIN_HEX}. Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page6", "prompt": (
        f"Show two characters at the desk in {ART_ROOM}: "
        f"1) {BOY_DESC} leaning forward to look closely at the new hawk drawing, "
        f"his expression now impressed and admiring — mouth open, eyebrows raised. "
        f"He points at the claws with excitement. "
        f"2) The girl from the reference image (blue art smock, pink hair clip) "
        f"sits up proudly, quiet smile. The improved hawk drawing between them. "
        f"Skin {SKIN_HEX}. Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page7", "prompt": (
        f"Show two characters working together at the desk in {ART_ROOM}: "
        f"1) The girl from the reference image (blue art smock, pink hair clip) "
        f"2) {BOY_DESC} — both drawing on the SAME big sheet of paper with oil "
        f"pastels. They are adding a green lawn with soil and straw beneath the hawk. "
        f"Both are focused and happy, working as a team. {OIL_STICKS} everywhere. "
        f"Skin {SKIN_HEX}. Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page8", "prompt": (
        f"Show two characters standing proudly in {ART_ROOM}: "
        f"1) The girl from the reference image (blue art smock, pink hair clip) "
        f"2) {BOY_DESC} — both grinning widely, standing in front of their "
        f"completed artwork which is PINNED UP on the classroom wall. The artwork "
        f"shows the hawk with spread wings and claws above a green lawn. "
        f"Other classmates in the background clap and smile. "
        f"Skin {SKIN_HEX}. Eyes: tiny solid black dots. Landscape."
    )},
]

async def generate_hero_image(session, hero_info, output_path):
    full_prompt = f"{hero_info['description']} {BASE_STYLE}"
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"
    parts = []
    if EYE_REF_PATH.exists():
        eye_b64 = base64.b64encode(EYE_REF_PATH.read_bytes()).decode("utf-8")
        parts.append({"text": "EYE STYLE REFERENCE — copy tiny solid black dot eyes exactly:"})
        parts.append({"inlineData": {"mimeType": "image/png", "data": eye_b64}})
        parts.append({"text": f"Generate NEW character with SAME eye style: {full_prompt}"})
    else:
        parts.append({"text": full_prompt})
    payload = {"contents": [{"parts": parts}], "generationConfig": {"responseModalities": ["IMAGE"]}}
    print(f"  [hero] Generating...")
    for attempt in range(MAX_RETRIES):
        try:
            async with session.post(url, json=payload) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    for p in result.get("candidates", [{}])[0].get("content", {}).get("parts", []):
                        if "inlineData" in p:
                            data = base64.b64decode(p["inlineData"]["data"])
                            output_path.write_bytes(data)
                            print(f"  [hero] Saved ({len(data)//1024} KB)")
                            return output_path
                elif resp.status in (429, 503):
                    await asyncio.sleep(BACKOFF_BASE * (2 ** attempt))
                else:
                    print(f"  [hero] Error {resp.status}")
                    await asyncio.sleep(BACKOFF_BASE * (2 ** attempt))
        except Exception as e:
            print(f"  [hero] {e}"); await asyncio.sleep(BACKOFF_BASE)
    return None

async def generate_scene_image(session, hero_b64, eye_ref_b64, scene):
    full_prompt = f"{scene['prompt']} {BASE_STYLE}"
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"
    parts = []
    if eye_ref_b64:
        parts.append({"text": "EYE STYLE REFERENCE — tiny solid black dots, ZERO white:"})
        parts.append({"inlineData": {"mimeType": "image/png", "data": eye_ref_b64}})
    parts.append({"text": f"CHARACTER REFERENCE — GIRL. Keep: skin {SKIN_HEX}, black hair with pink clip, blue art smock over pink t-shirt, dark navy leggings:"})
    parts.append({"inlineData": {"mimeType": "image/png", "data": hero_b64}})
    parts.append({"text": f"SCENE TO GENERATE: {full_prompt}"})
    payload = {"contents": [{"parts": parts}], "generationConfig": {"responseModalities": ["IMAGE"]}}
    for attempt in range(MAX_RETRIES):
        try:
            async with session.post(url, json=payload) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    for p in result.get("candidates", [{}])[0].get("content", {}).get("parts", []):
                        if "inlineData" in p:
                            return base64.b64decode(p["inlineData"]["data"])
                    return None
                elif resp.status in (429, 503):
                    await asyncio.sleep(BACKOFF_BASE * (2 ** attempt))
                else:
                    print(f"    Error {resp.status}")
                    await asyncio.sleep(BACKOFF_BASE * (2 ** attempt))
        except Exception as e:
            print(f"    {e}"); await asyncio.sleep(BACKOFF_BASE)
    return None

async def main():
    mode = sys.argv[1].lower() if len(sys.argv) > 1 else "all"
    if not GEMINI_API_KEY: print("ERROR: No API key"); sys.exit(1)
    print(f"\n{'='*55}\nL3.4: \"Draw It Again!\" — Seoul, South Korea\nOutput: {OUTPUT_DIR}\nMode: {mode}\n{'='*55}")
    hero_path = OUTPUT_DIR / "hero_reference.png"
    async with aiohttp.ClientSession() as session:
        if mode in ("all", "hero"):
            if not hero_path.exists() or mode == "hero":
                if not await generate_hero_image(session, GIRL_HERO, hero_path):
                    print("FATAL: Hero failed"); sys.exit(1)
                await asyncio.sleep(REQUEST_DELAY)
        if mode == "hero": print("Hero done."); return
        if not hero_path.exists(): print("ERROR: No hero"); sys.exit(1)
        hero_b64 = base64.b64encode(hero_path.read_bytes()).decode("utf-8")
        eye_ref_b64 = base64.b64encode(EYE_REF_PATH.read_bytes()).decode("utf-8") if EYE_REF_PATH.exists() else None
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
