"""
Generate illustrations for L6.4 "The Incredible Bush Walk" using Gemini API.

Setting: Blue Mountains, Australia — eucalyptus bush, red earth, blue haze
Main characters: Mia (9-10, green t-shirt, ponytail) and Tom (7-8, red t-shirt)
Side character: Dad (khaki hiking shirt, beard, sunhat)

Usage:
    py -3.12 scripts/generate_l6_4_images.py           # Generate all
    py -3.12 scripts/generate_l6_4_images.py hero       # Hero only
    py -3.12 scripts/generate_l6_4_images.py scenes     # Scenes only
"""

import asyncio, aiohttp, os, sys, base64
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

GEMINI_API_KEY = os.environ.get("GOOGLE_GEMINI_API_KEY")
BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
OUTPUT_DIR = Path(__file__).parent.parent / "output" / "images" / "L6_4_B1"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
EYE_REF_PATH = Path(__file__).parent.parent / "output" / "images" / "L4_1_B1" / "hero_reference.png"
REQUEST_DELAY = 3; MAX_RETRIES = 3; BACKOFF_BASE = 5

MIA_SKIN = "#E8C5A0"; MIA_HAIR = "#A0784C"
TOM_SKIN = "#E8C5A0"; TOM_HAIR = "#B5734A"

BASE_STYLE = (
    "Whimsical children's book illustration. Hand-drawn cartoon style with "
    "soft watercolour textured backgrounds and clean black-outlined characters. "
    "CRITICAL EYE RULE: Every character MUST have eyes that are tiny solid black "
    "filled circles like dots. NO white, NO iris, NO highlight. "
    "Warm, friendly. No text, words, letters, or numbers in the image."
)

# Mia is the hero (appears in every page)
MIA_HERO = {
    "description": (
        f"A cartoon girl character, about 9 years old, with light warm Australian "
        f"skin, hex colour {MIA_SKIN}. Light brown wavy hair (hex {MIA_HAIR}) "
        f"pulled back in a ponytail. "
        f"She wears a green t-shirt, khaki shorts, and brown hiking boots. "
        f"A small backpack on her back. "
        f"Solid black dot eyes — ZERO white. Confident adventurous expression. "
        f"NO rosy cheeks. Standing neutral pose, full body, plain cream background."
    ),
}

TOM_DESC = (
    "Australian boy Tom (7-8 years old, light warm skin #E8C5A0, sandy reddish-brown "
    "short hair #B5734A, red t-shirt, khaki shorts, brown hiking boots, small backpack, "
    "always carrying a small notebook)"
)

DAD_DESC = (
    "Australian dad (40s, skin #D4A574, short brown hair, neat beard, khaki hiking "
    "shirt, cargo shorts, brown sunhat, water bottle)"
)

BUSH_TRAIL = (
    "Blue Mountains bush walk trail: red-brown earth path winding through enormous "
    "eucalyptus gum trees with peeling bark, dappled golden sunlight through canopy, "
    "green ferns and undergrowth, distant sandstone cliffs with famous blue haze"
)

LYREBIRD = (
    "a magnificent lyrebird with long silvery-brown tail feathers fanned out in a "
    "gorgeous veil shape above its body, standing on a mossy mound, beak open mid-song"
)

SCENES = [
    {"name": "cover", "prompt": (
        f"Show the girl from the reference image (green t-shirt, ponytail, khaki shorts, "
        f"hiking boots) and {TOM_DESC} standing together on a red-brown earth bush walk "
        f"trail in the Blue Mountains. Enormous eucalyptus trees rise around them. "
        f"Dramatic sandstone cliffs and mountain peaks with famous blue haze behind them. "
        f"{LYREBIRD} partially visible among ferns beside the trail. Tom points towards "
        f"it with excitement, Mia looks amazed. Bright daylight, warm golden tones. "
        f"Eyes: tiny solid black dots ONLY. Portrait format 3:4."
    )},
    {"name": "page1", "prompt": (
        f"Start of a bush walk trail in the Blue Mountains. A wooden sign marks the "
        f"trailhead. Enormous eucalyptus trees tower overhead, red-brown earth underfoot. "
        f"Blue haze over distant sandstone mountain peaks. "
        f"The girl from the reference image (green t-shirt, ponytail, khaki shorts, "
        f"skin {MIA_SKIN}) stands confidently with hands on hips looking at the view. "
        f"{TOM_DESC} sits on a rock beside the trail, drawing quietly in his notebook. "
        f"{DAD_DESC} stands behind them, smiling. Bright morning sunlight. "
        f"Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page2", "prompt": (
        f"{BUSH_TRAIL}. The girl from the reference image (green t-shirt, ponytail) "
        f"strides ahead on the trail, one arm pointing up at a gorgeous crimson rosella "
        f"(bright red and blue parrot) perched in a gum tree branch. She looks confident. "
        f"{TOM_DESC} crouches far behind her beside a mossy fallen log, peering at "
        f"something small near the ground, notebook open. Sandstone cliffs with blue "
        f"haze visible through gaps in trees. "
        f"Skin {MIA_SKIN}. Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page3", "prompt": (
        f"{BUSH_TRAIL}. The girl from the reference image (green t-shirt, ponytail) "
        f"stands on the trail ahead, turned back with an impatient expression, hands "
        f"on hips. {TOM_DESC} has stopped on the trail behind her, head tilted to one "
        f"side, listening intently with a curious expression. His notebook is tucked "
        f"under one arm. Dense eucalyptus bush on both sides, ferns and undergrowth. "
        f"Skin {MIA_SKIN}. Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page4", "prompt": (
        f"Magical forest clearing scene. {TOM_DESC} crouches behind a large green fern, "
        f"peering through the fronds with wide eyes and open mouth, sketching rapidly in "
        f"his notebook. In the clearing before him, {LYREBIRD}. Dappled golden light "
        f"through eucalyptus canopy. Ferns, moss, fallen leaves on forest floor. "
        f"Skin {TOM_SKIN}. Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page5", "prompt": (
        f"{TOM_DESC} and the girl from the reference image (green t-shirt, ponytail) "
        f"crouch side by side behind a large fern, peering through the fronds together. "
        f"The girl's expression has changed from impatient to amazed — mouth slightly "
        f"open, eyebrows raised. Tom looks quietly proud, pointing towards {LYREBIRD} "
        f"still displaying its fanned tail feathers in the dappled clearing beyond. "
        f"Soft golden light. Eucalyptus forest. "
        f"Skin {MIA_SKIN}. Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page6", "prompt": (
        f"{BUSH_TRAIL}. {TOM_DESC} and the girl from the reference image (green t-shirt, "
        f"ponytail) walk side by side, both smiling. Tom points at textured bark of a "
        f"large gum tree while the girl leans in to look, genuinely interested. In the "
        f"background, the trail opens to a lookout with wooden railing, revealing a "
        f"glorious panoramic view of blue-hazed mountain ranges and deep forested valleys "
        f"under bright blue sky. "
        f"Skin {MIA_SKIN}. Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page7", "prompt": (
        f"Inside a modern Blue Mountains visitor centre gallery. Bright, well-lit space "
        f"with white walls displaying large vibrant Aboriginal dot art paintings — swirling "
        f"patterns of red, gold, ochre, and white depicting landscapes and animals. "
        f"{TOM_DESC} holds up his open notebook showing nature sketches, comparing them "
        f"to the gallery art. The girl from the reference image (green t-shirt, ponytail) "
        f"stands beside him, looking at his drawings with a warm respectful smile. "
        f"{DAD_DESC} stands behind them, smiling proudly, sunhat in hand. "
        f"Skin {MIA_SKIN}. Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page8", "prompt": (
        f"Warm evening scene. A cosy holiday cabin living room near the Blue Mountains. "
        f"{TOM_DESC} sits on a sofa holding his open notebook and reading aloud, happy. "
        f"The girl from the reference image (green t-shirt, ponytail) sits beside him, "
        f"leaning towards him with a warm genuine smile of admiration. "
        f"Through a window behind them, the Blue Mountains are dark silhouettes against "
        f"a golden-pink sunset sky with traces of blue haze. Soft warm lamp light inside. "
        f"Hiking backpacks and boots by the door. "
        f"Skin {MIA_SKIN}. Eyes: tiny solid black dots. Landscape."
    )},
]

async def generate_hero_image(session, hero_info, output_path):
    full_prompt = f"{hero_info['description']} {BASE_STYLE}"
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"
    parts = []
    if EYE_REF_PATH.exists():
        eye_b64 = base64.b64encode(EYE_REF_PATH.read_bytes()).decode("utf-8")
        parts.append({"text": "EYE STYLE REFERENCE — copy tiny solid black dot eyes:"})
        parts.append({"inlineData": {"mimeType": "image/png", "data": eye_b64}})
        parts.append({"text": f"Generate NEW character with SAME eye style: {full_prompt}"})
    else:
        parts.append({"text": full_prompt})
    payload = {"contents": [{"parts": parts}], "generationConfig": {"responseModalities": ["IMAGE"]}}
    for attempt in range(MAX_RETRIES):
        try:
            async with session.post(url, json=payload) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    for p in result.get("candidates", [{}])[0].get("content", {}).get("parts", []):
                        if "inlineData" in p:
                            data = base64.b64decode(p["inlineData"]["data"])
                            output_path.write_bytes(data); print(f"  [hero] Saved ({len(data)//1024} KB)")
                            return output_path
                elif resp.status in (429, 503):
                    await asyncio.sleep(BACKOFF_BASE * (2 ** attempt))
                else:
                    print(f"  [hero] Error {resp.status}"); await asyncio.sleep(BACKOFF_BASE * (2 ** attempt))
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
    parts.append({"text": f"CHARACTER REFERENCE — MIA (girl). Keep: light warm skin {MIA_SKIN}, brown wavy ponytail {MIA_HAIR}, green t-shirt, khaki shorts, hiking boots:"})
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
                    print(f"    Error {resp.status}"); await asyncio.sleep(BACKOFF_BASE * (2 ** attempt))
        except Exception as e:
            print(f"    {e}"); await asyncio.sleep(BACKOFF_BASE)
    return None

async def main():
    mode = sys.argv[1].lower() if len(sys.argv) > 1 else "all"
    if not GEMINI_API_KEY: print("ERROR: No API key"); sys.exit(1)
    print(f"\n{'='*55}\nL6.4: \"The Incredible Bush Walk\" — Blue Mountains, Australia\nOutput: {OUTPUT_DIR}\nMode: {mode}\n{'='*55}")
    hero_path = OUTPUT_DIR / "hero_reference.png"
    async with aiohttp.ClientSession() as session:
        if mode in ("all", "hero"):
            if not hero_path.exists() or mode == "hero":
                print("  [hero] Generating...")
                if not await generate_hero_image(session, MIA_HERO, hero_path):
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
