"""
Generate illustrations for L6.3 "It Looks Suspicious!" using Gemini API.

Setting: Amalfi Coast, Italy — colourful clifftop village, family kitchen
Main character: Luca (Italian boy, 7-8, light blue t-shirt, khaki shorts)
Side characters: Nonna (grandmother), Sofia (little sister, pages 7-8)

Usage:
    py -3.12 scripts/generate_l6_3_images.py           # Generate all
    py -3.12 scripts/generate_l6_3_images.py hero       # Hero only
    py -3.12 scripts/generate_l6_3_images.py scenes     # Scenes only
"""

import asyncio, aiohttp, os, sys, base64
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

GEMINI_API_KEY = os.environ.get("GOOGLE_GEMINI_API_KEY")
BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
OUTPUT_DIR = Path(__file__).parent.parent / "output" / "images" / "L6_3_B1"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
EYE_REF_PATH = Path(__file__).parent.parent / "output" / "images" / "L4_1_B1" / "hero_reference.png"
REQUEST_DELAY = 3; MAX_RETRIES = 3; BACKOFF_BASE = 5

SKIN_HEX = "#C4956A"; HAIR_HEX = "#1A1110"

BASE_STYLE = (
    "Whimsical children's book illustration. Hand-drawn cartoon style with "
    "soft watercolour textured backgrounds and clean black-outlined characters. "
    "CRITICAL EYE RULE: Every character MUST have eyes that are tiny solid black "
    "filled circles like dots. NO white, NO iris, NO highlight. "
    "Warm, friendly. No text, words, letters, or numbers in the image."
)

GIRL_HERO = {
    "description": (
        f"A cartoon boy character, about 7 years old, with medium olive Italian skin, "
        f"hex colour {SKIN_HEX}. Dark curly tousled hair (hex {HAIR_HEX}), short. "
        f"He wears a light blue t-shirt, khaki shorts that reach the knees, "
        f"and brown leather sandals. "
        f"Solid black dot eyes — ZERO white. Expressive curious face. "
        f"NO rosy cheeks, NO blush marks. Standing neutral pose, full body, "
        f"plain light cream background."
    ),
}

NONNA = (
    "Italian grandmother (60s, grey hair #A9A9A9 in neat bun, warm patient face "
    "with laugh lines, medium olive skin, floral apron over cream blouse, dark trousers)"
)

SOFIA = (
    "small Italian girl (4-5 years old, skin #C4956A, dark curly hair #1A1110 "
    "with bright yellow headband, pink t-shirt, denim shorts)"
)

KITCHEN = (
    "bright modern Italian kitchen: white tiled surfaces and splashback, "
    "open window showing colourful Amalfi Coast clifftop houses (pink, cream, "
    "yellow) cascading down to blue Mediterranean sea, warm golden sunlight"
)

# Use prompts from story data directly
SCENES = [
    {"name": "cover", "prompt": (
        f"Italian boy (skin {SKIN_HEX}, dark curly hair, light blue t-shirt, khaki "
        f"shorts, brown sandals) holds a piece of bruschetta up to his nose, sniffing "
        f"it with a suspicious but curious expression. Behind him, {NONNA} smiles "
        f"warmly holding a wooden spoon. Through an open window: colourful Amalfi "
        f"Coast houses cascade down to blue Mediterranean sea, lemon groves on hillside. "
        f"Warm golden kitchen light. Eyes: tiny solid black dots ONLY. Portrait 3:4."
    )},
    {"name": "page1", "prompt": (
        f"Show the boy from the reference image (light blue t-shirt, khaki shorts, "
        f"dark curly hair) standing in {KITCHEN} with arms crossed, leaning back "
        f"suspiciously, looking at a glass dish on the bench. {NONNA} stands beside "
        f"the bench smiling warmly, gesturing towards the dish which holds fresh red "
        f"tomatoes, green basil leaves, and white mozzarella. "
        f"Skin {SKIN_HEX}. Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page2", "prompt": (
        f"Close-up in {KITCHEN}. {NONNA} holds a large bright yellow lemon in one "
        f"hand and has just sliced it on a wooden chopping board. The boy from the "
        f"reference image (dark curly hair, light blue t-shirt) leans in slightly, "
        f"nose lifted, sniffing the air with reluctantly curious expression. A lemon "
        f"tree with bright fruit visible through the open kitchen door. Warm sunlight. "
        f"Skin {SKIN_HEX}. Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page3", "prompt": (
        f"{NONNA} drizzles olive oil from a small glass bottle over a dish of sliced "
        f"red tomatoes and green basil on the tiled bench in {KITCHEN}. A grater and "
        f"half a lemon sit nearby. The boy from the reference image (dark curly hair, "
        f"light blue t-shirt) holds a piece of crusty bread close to his face, "
        f"inspecting it with narrowed eyes — but nose lifted, smelling something good. "
        f"Amalfi Coast view through window. "
        f"Skin {SKIN_HEX}. Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page4", "prompt": (
        f"{NONNA} stirs a large pot of steaming pasta on a modern stove with a wooden "
        f"spoon, steam rising, in {KITCHEN}. A halved lemon and small cream jug on the "
        f"bench. The boy from the reference image (dark curly hair, light blue t-shirt, "
        f"khaki shorts) has moved RIGHT BESIDE Nonna, looking into the pot with wide "
        f"curious eyes despite his crossed arms. Warm kitchen light, tiled splashback. "
        f"Skin {SKIN_HEX}. Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page5", "prompt": (
        f"Bright Italian kitchen table set with three dishes: a plate of bruschetta "
        f"(crusty bread with red tomatoes and green basil), a bowl of creamy lemon "
        f"pasta, and a small glass cup of pale yellow granita with lemon slice and "
        f"mint leaf. {NONNA} places the granita down with a knowing smile. The boy "
        f"from the reference image (dark curly hair, light blue t-shirt) sits at the "
        f"table, expression shifting from suspicious to hungry. Amalfi Coast through window. "
        f"Skin {SKIN_HEX}. Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page6", "prompt": (
        f"Close-up at kitchen table. The boy from the reference image (dark curly hair, "
        f"light blue t-shirt) holds bruschetta with a big bite taken out, eyes wide "
        f"with surprise and delight, mouth open in amazed smile. Bowl of half-eaten "
        f"lemon pasta with fork in front of him. {NONNA} watches from across the table "
        f"with warm knowing satisfied smile, chin resting on her hand. "
        f"Skin {SKIN_HEX}. Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page7", "prompt": (
        f"Italian kitchen doorway. {SOFIA} stands in the doorway pointing at the table "
        f"with a suspicious squint. The boy from the reference image (dark curly hair, "
        f"light blue t-shirt) sits at the table grinning widely, nearly empty plate "
        f"and bowl in front of him. The untouched glass of pale yellow granita with "
        f"lemon slice sits on the table where Sofia points. {NONNA} stands by the "
        f"stove smiling. Skin {SKIN_HEX}. Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page8", "prompt": (
        f"Warm golden scene. The boy from the reference image (dark curly hair, light "
        f"blue t-shirt, khaki shorts) kneels down to hold the small glass of pale "
        f"yellow granita out to {SOFIA}, who takes a lick, face lighting up with joy. "
        f"Behind them, {NONNA} stands in the open kitchen doorway watching with deeply "
        f"warm content smile. Through the doorway: lemon groves with bright yellow "
        f"fruit cascade down the Amalfi clifftop, colourful houses visible below against "
        f"deep blue Mediterranean sea. Golden afternoon light. "
        f"Skin {SKIN_HEX}. Eyes: tiny solid black dots. Landscape."
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
    parts.append({"text": f"CHARACTER REFERENCE — BOY. Keep: olive skin {SKIN_HEX}, dark curly hair {HAIR_HEX}, light blue t-shirt, khaki shorts, brown sandals:"})
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
    print(f"\n{'='*55}\nL6.3: \"It Looks Suspicious!\" — Amalfi Coast, Italy\nOutput: {OUTPUT_DIR}\nMode: {mode}\n{'='*55}")
    hero_path = OUTPUT_DIR / "hero_reference.png"
    async with aiohttp.ClientSession() as session:
        if mode in ("all", "hero"):
            if not hero_path.exists() or mode == "hero":
                print("  [hero] Generating...")
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
