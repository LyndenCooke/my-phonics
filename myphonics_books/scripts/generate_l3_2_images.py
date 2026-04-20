"""
Generate illustrations for L3.2 "Lost at the Night Market" using Gemini API.

Setting: Bangkok night market, Thailand — colourful stalls, lanterns, noodle pots, stone elephants
Main character: Thai girl (~6 years old, pink t-shirt, dark leggings)
Side character: Mum (Thai woman, light blue blouse, dark trousers, hair in bun)

Pipeline:
  1. Generate hero reference image (girl, neutral pose, full body)
  2. Inject hero into every scene alongside scene-specific prompt
  3. Mum described in scene prompts (consistent description each time)

Usage:
    py -3.12 scripts/generate_l3_2_images.py           # Generate all images
    py -3.12 scripts/generate_l3_2_images.py hero       # Hero reference only
    py -3.12 scripts/generate_l3_2_images.py scenes     # Scenes only (hero must exist)
    py -3.12 scripts/generate_l3_2_images.py recolour   # Recolour existing hero skin
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
OUTPUT_DIR = Path(__file__).parent.parent / "output" / "images" / "L3_2_B1"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Eye style reference — approved hero with correct solid black dot eyes
EYE_REF_PATH = Path(__file__).parent.parent / "output" / "images" / "L4_1_B1" / "hero_reference.png"

REQUEST_DELAY = 3
MAX_RETRIES = 3
BACKOFF_BASE = 5

# ─── Skin & Hair ──────────────────────────────────────────────────
SKIN_HEX = "#D4A574"   # Light-medium East Asian
HAIR_HEX = "#1A1110"   # Near-black

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
    "No text, words, letters, or numbers in the image. "
    "CRITICAL COMPOSITION RULE: Characters must be INSIDE the scene, "
    "surrounded by and interacting with the environment — standing BETWEEN "
    "stalls, AMONG market elements, with objects overlapping and around them. "
    "Characters must NOT be standing on blank/plain ground in front of a "
    "backdrop. The setting must wrap AROUND the characters, not sit behind them."
)

# ─── Character Descriptions ──────────────────────────────────────
GIRL_HERO = {
    "description": (
        f"A cartoon girl character, about 6 years old, with light-medium East Asian "
        f"skin — warm golden-tan, hex colour {SKIN_HEX}. "
        f"She has straight dark black hair (hex {HAIR_HEX}) worn in a low ponytail "
        f"with a neat fringe/bangs across her forehead. "
        f"She wears a bright pink t-shirt, dark navy leggings that cover her legs "
        f"fully, and small white trainers. "
        f"She has small friendly dot eyes — solid black filled circles with ZERO white — "
        f"no white highlight, no white reflection, no white dot, no shine, no pupil "
        f"detail. Just 100% solid black circles like ink dots. "
        f"A cheerful, expressive face. ABSOLUTELY NO rosy cheeks, NO blush marks, "
        f"NO pink or red circles on face — clean smooth warm skin on cheeks. "
        f"Standing in a neutral pose, facing the viewer, full body visible from "
        f"head to toe. Arms slightly away from body, feet shoulder-width apart. "
        f"Plain light cream solid-colour background (no scenery, no objects, no patterns)."
    ),
    "short": "the girl in the bright pink t-shirt with dark hair in a low ponytail",
}

# Mum description used consistently in all scene prompts
MUM_DESC = (
    f"Thai woman (Mum), about 30, light-medium East Asian skin hex {SKIN_HEX}, "
    f"dark black hair (hex {HAIR_HEX}) in a neat high bun on top of her head "
    f"(NO ponytail, NO loose hair, NO short hair — always a HIGH BUN), "
    f"wearing a light sky-blue short-sleeve blouse with a small collar and "
    f"dark navy trousers, dark flat sandals, warm kind expression, "
    f"slim build, slightly taller than average"
)

# Setting descriptions
THAI_BG_PEOPLE = (
    "Background people in the market MUST look Thai — straight black hair, "
    "warm golden-tan East Asian skin (hex #D4A574), Thai facial features. "
    "Some vendors wear aprons over casual clothes. Shoppers in light summer "
    "clothes (t-shirts, shorts, sandals — typical Bangkok evening wear). "
    "ALL background people should be clearly Thai/East Asian, not Western."
)

NIGHT_MARKET = (
    "bustling Thai night market in Bangkok — rows of colourful market stalls "
    "with fabric canopies (red, orange, yellow), strings of warm paper lanterns "
    "hanging above, steam rising from noodle pots, tropical plants in pots, "
    "warm evening light, lively and vibrant atmosphere. " + THAI_BG_PEOPLE
)

STONE_ELEPHANTS_STALL = (
    "a market stall displaying rows of cute small carved stone elephant "
    "figurines in various poses (standing, sitting, trunk raised) on a "
    "wooden shelf, each about 10-15cm tall, smooth grey stone with simple "
    "carved details, charming Thai souvenir style"
)

NOODLE_STALL = (
    "a noodle stall with large steaming pots, bright overhead lights, "
    "bowls of noodles visible, colourful ingredients on display"
)

# ─── Scene Prompts ────────────────────────────────────────────────
SCENES = [
    {
        "name": "cover", "setting_ref": "market_setting",
        "prompt": (
            f"Show the girl from the reference image (bright pink t-shirt, dark "
            f"hair in low ponytail) walking BETWEEN two market stalls in a "
            f"colourful Thai night market. A stall canopy is on her left, a "
            f"noodle cart with steam on her right. Lanterns hang directly above "
            f"her. She smiles warmly, looking at the viewer. She is INSIDE the "
            f"market, not standing in front of it. {NIGHT_MARKET}. "
            f"Skin colour {SKIN_HEX}. "
            f"Eyes: tiny solid black dots ONLY, no white. Portrait format 3:4."
        ),
    },
    {
        "name": "page1", "setting_ref": "market_setting",
        "prompt": (
            f"Show two characters walking BETWEEN market stalls, hand-in-hand: "
            f"1) The girl from the reference image (bright pink t-shirt, dark hair "
            f"in low ponytail) looking up with wide excited eyes. "
            f"2) {MUM_DESC} holding the girl's hand firmly, smiling down at her. "
            f"They are walking DOWN A NARROW MARKET AISLE with stalls on both "
            f"sides — canopies overhead, steam from cooking pots, plants in pots "
            f"beside them. They are INSIDE the market surrounded by stalls. "
            f"Skin colour {SKIN_HEX} for both characters. "
            f"Eyes: tiny solid black dots ONLY. Landscape format."
        ),
    },
    {
        "name": "page2", "setting_ref": "elephant_stall",
        "prompt": (
            f"Show the girl from the reference image (bright pink t-shirt, dark "
            f"hair in low ponytail) and {MUM_DESC} browsing market stalls together. "
            f"On one side, {STONE_ELEPHANTS_STALL}. The girl points at the cute stone "
            f"elephants with delight. On the other side, {NOODLE_STALL} with bright "
            f"steaming pots. Green drinks in tall glasses visible on a counter. "
            f"{NIGHT_MARKET} around them with lanterns above. "
            f"IMPORTANT: It is NIGHT TIME — the sky must be dark blue/navy with "
            f"stars visible. Warm lantern glow provides the lighting. "
            f"Skin colour {SKIN_HEX} for both. "
            f"Eyes: tiny solid black dots ONLY. Landscape format."
        ),
    },
    {
        "name": "page3", "setting_ref": "market_setting",
        "prompt": (
            f"Show the girl from the reference image (bright pink t-shirt, dark "
            f"hair in low ponytail) looking scared and confused in a crowded Thai "
            f"night market. She has been bumped and separated from Mum. She spins "
            f"round, looking frantically in all directions. The crowd is shown as "
            f"simple blurred adult legs and bodies around her — she looks tiny among "
            f"them. The adults around her MUST be Thai — straight black hair, "
            f"warm golden-tan East Asian skin, Thai features, casual summer "
            f"clothes. Warm lantern light above, busy stall canopies. "
            f"Mum is NOT visible in this scene — the girl is alone. "
            f"Skin colour {SKIN_HEX}. "
            f"Eyes: tiny solid black dots ONLY. Landscape format."
        ),
    },
    {
        "name": "page4", "setting_ref": "dark_corner",
        "prompt": (
            f"Show the girl from the reference image (bright pink t-shirt, dark "
            f"hair in low ponytail) standing alone in a quieter, darker corner "
            f"of the night market. She cups her hands around her mouth, shouting. "
            f"Her face shows worry and determination. The area around her is dimmer "
            f"— fewer lanterns, shadows, a couple of closed stall shutters. "
            f"She looks small and vulnerable but brave. "
            f"A few Thai background people (black hair, golden-tan skin) walk "
            f"past in the distance, not noticing her — adults going about their "
            f"evening, making her feel even more alone in the crowd. "
            f"Skin colour {SKIN_HEX}. "
            f"Eyes: tiny solid black dots ONLY. Landscape format."
        ),
    },
    {
        "name": "page5", "setting_ref": "elephant_stall",
        "prompt": (
            f"Show the girl from the reference image (bright pink t-shirt, dark "
            f"hair in low ponytail) with a sudden look of recognition and hope. "
            f"She has spotted {STONE_ELEPHANTS_STALL} — the same stall from page 2! "
            f"She points at the cute stone elephants with one hand, eyes bright, mouth "
            f"open with relief. The stall is well-lit with warm lanterns. "
            f"She looks like she has just remembered the way. "
            f"IMPORTANT: It is NIGHT TIME — dark blue/navy sky with stars. "
            f"Skin colour {SKIN_HEX}. "
            f"Eyes: tiny solid black dots ONLY. Landscape format."
        ),
    },
    {
        "name": "page6", "setting_ref": "market_setting",
        "prompt": (
            f"Show the girl from the reference image (bright pink t-shirt, dark "
            f"hair in low ponytail) running TOWARDS the viewer's right where "
            f"{MUM_DESC} stands facing the girl with open arms, looking relieved. "
            f"The girl is on the LEFT side of the image running RIGHT towards Mum "
            f"on the RIGHT side. The girl reaches out one hand towards Mum. "
            f"Bright noodle stall lights and lanterns around them. "
            f"IMPORTANT: Girl runs TOWARDS Mum, NOT away from her. "
            f"It is NIGHT TIME — dark blue/navy sky with stars. "
            f"Any other people visible must be Thai — black hair, golden-tan "
            f"East Asian skin, casual summer clothes. "
            f"Skin colour {SKIN_HEX} for both. "
            f"Eyes: tiny solid black dots ONLY. Landscape format."
        ),
    },
    {
        "name": "page7", "setting_ref": "market_setting",
        "prompt": (
            f"Show an emotional reunion: the girl from the reference image (bright "
            f"pink t-shirt, dark hair in low ponytail) and {MUM_DESC} hugging "
            f"tightly. Mum kneels down and wraps her arms around the girl. The "
            f"girl clings on with a huge relieved smile, eyes squeezed shut with "
            f"happiness. Warm lantern light around them. {NIGHT_MARKET} softly "
            f"in the background. Any background people must be Thai — black hair, "
            f"golden-tan East Asian skin. A warm, safe, loving moment. "
            f"IMPORTANT: It is NIGHT TIME — dark blue/navy sky with stars visible "
            f"above the market stalls. Warm lantern glow provides the lighting. "
            f"Skin colour {SKIN_HEX} for both. "
            f"Eyes: tiny solid black dots ONLY. Landscape format."
        ),
    },
    {
        "name": "page8", "setting_ref": "market_setting",
        "prompt": (
            f"Show the girl from the reference image (bright pink t-shirt, dark "
            f"hair in low ponytail) and {MUM_DESC} sitting close together on "
            f"low wooden stools AT a noodle stall counter. They sit UNDER the "
            f"stall's canopy, with the steaming noodle pots and cooking equipment "
            f"visible directly behind them. They eat from steaming bowls of noodles "
            f"with chopsticks. Both are smiling warmly. Lanterns hang from the "
            f"canopy above. The dark night sky with moon visible above. "
            f"They are INSIDE the stall area, not floating in front of it. "
            f"A few other Thai customers (black hair, golden-tan skin) sit at "
            f"nearby stools or walk past in the background — the market is still "
            f"alive and busy around them. "
            f"Skin colour {SKIN_HEX} for both. "
            f"Eyes: tiny solid black dots ONLY. Landscape format."
        ),
    },
]


HERO_STYLE = (
    "Whimsical children's book illustration. Hand-drawn cartoon style with "
    "clean black-outlined character on a PLAIN LIGHT CREAM BACKGROUND. "
    "NO scenery, NO market, NO stalls, NO other people, NO objects behind. "
    "Just the character standing alone on a plain solid cream background. "
    "CRITICAL EYE RULE: tiny solid black filled circles for eyes, "
    "NO white, NO iris, NO highlight. Warm, friendly, simple."
)


async def generate_hero_image(session, eye_ref_b64):
    """Generate the hero reference image (text-to-image, no character ref needed)."""
    full_prompt = f"{GIRL_HERO['description']} {HERO_STYLE}"
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"
    parts = []
    if eye_ref_b64:
        parts.append({"text": "EYE STYLE REFERENCE — ALL characters: tiny solid black dots, ZERO white:"})
        parts.append({"inlineData": {"mimeType": "image/png", "data": eye_ref_b64}})
    parts.append({"text": f"GENERATE THIS CHARACTER: {full_prompt}"})
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


async def generate_scene_image(session, hero_b64, eye_ref_b64, scene, setting_refs):
    """Generate a scene image with hero + setting injection."""
    full_prompt = f"{scene['prompt']} {BASE_STYLE}"
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"
    parts = []
    if eye_ref_b64:
        parts.append({"text": "EYE STYLE REFERENCE — ALL characters: tiny solid black dots, ZERO white:"})
        parts.append({"inlineData": {"mimeType": "image/png", "data": eye_ref_b64}})
    # Inject setting reference if specified
    setting_key = scene.get("setting_ref")
    if setting_key and setting_key in setting_refs:
        parts.append({"text": (
            "SETTING REFERENCE — Use this EXACT environment: same ground texture, "
            "same stall style, same sky colour, same lanterns, same overall look. "
            "Place the characters INSIDE this setting:"
        )})
        parts.append({"inlineData": {"mimeType": "image/png", "data": setting_refs[setting_key]}})
    parts.append({
        "text": (
            f"CHARACTER REFERENCE — GIRL. Keep exact appearance: skin {SKIN_HEX}, "
            f"straight dark hair {HAIR_HEX} in low ponytail with fringe, "
            f"bright pink t-shirt, dark navy leggings, white trainers. "
            f"This is a THAI GIRL with straight black hair:"
        )
    })
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


async def recolour_hero(session, eye_ref_b64):
    """Edit existing hero to adjust skin/hair hex only."""
    hero_path = OUTPUT_DIR / "hero_reference.png"
    if not hero_path.exists():
        print("ERROR: hero_reference.png not found for recolour."); return
    hero_b64 = base64.b64encode(hero_path.read_bytes()).decode("utf-8")
    prompt = (
        f"Edit this character image: adjust the skin colour to exactly {SKIN_HEX} "
        f"and hair colour to exactly {HAIR_HEX}. Keep EVERYTHING else identical — "
        f"same pose, outfit, expression, background, proportions. Only change skin "
        f"and hair colour. Eyes must remain tiny solid black dots with NO white."
    )
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"
    parts = []
    if eye_ref_b64:
        parts.append({"text": "EYE STYLE REFERENCE:"})
        parts.append({"inlineData": {"mimeType": "image/png", "data": eye_ref_b64}})
    parts.append({"text": "IMAGE TO RECOLOUR:"})
    parts.append({"inlineData": {"mimeType": "image/png", "data": hero_b64}})
    parts.append({"text": prompt})
    payload = {"contents": [{"parts": parts}], "generationConfig": {"responseModalities": ["IMAGE"]}}
    async with session.post(url, json=payload) as response:
        if response.status == 200:
            result = await response.json()
            for part in result.get("candidates", [{}])[0].get("content", {}).get("parts", []):
                if "inlineData" in part:
                    data = base64.b64decode(part["inlineData"]["data"])
                    hero_path.write_bytes(data)
                    print(f"  Recoloured hero saved ({len(data)//1024} KB)")
                    return
        print(f"  Recolour failed: {response.status}")


async def main():
    mode = sys.argv[1].lower() if len(sys.argv) > 1 else "all"
    if not GEMINI_API_KEY:
        print("ERROR: GOOGLE_GEMINI_API_KEY not found"); sys.exit(1)

    print(f"\n{'='*55}")
    print(f'L3.2: "Lost at the Night Market" — Thailand')
    print(f"Output: {OUTPUT_DIR}\nMode: {mode}\n{'='*55}")

    hero_path = OUTPUT_DIR / "hero_reference.png"
    eye_ref_b64 = base64.b64encode(EYE_REF_PATH.read_bytes()).decode("utf-8") if EYE_REF_PATH.exists() else None

    async with aiohttp.ClientSession() as session:
        # ── Recolour mode ──
        if mode == "recolour":
            await recolour_hero(session, eye_ref_b64)
            return

        # ── Hero generation ──
        if mode in ("all", "hero"):
            print(f"\n  Generating hero reference...")
            data = await generate_hero_image(session, eye_ref_b64)
            if data:
                hero_path.write_bytes(data)
                print(f"  Hero saved ({len(data)//1024} KB)")
            else:
                print("  Hero generation FAILED"); sys.exit(1)
            if mode == "hero":
                print("  Hero only mode — done."); return
            await asyncio.sleep(REQUEST_DELAY)

        # ── Scene generation ──
        if not hero_path.exists():
            print("ERROR: hero_reference.png not found. Run with 'hero' first."); sys.exit(1)

        hero_b64 = base64.b64encode(hero_path.read_bytes()).decode("utf-8")

        # Load setting references
        setting_refs = {}
        for sname in ["market_setting", "elephant_stall", "dark_corner"]:
            spath = OUTPUT_DIR / f"{sname}.png"
            if spath.exists():
                setting_refs[sname] = base64.b64encode(spath.read_bytes()).decode("utf-8")
                print(f"  Loaded setting: {sname} ({len(setting_refs[sname])//1024}KB)")
            else:
                print(f"  WARNING: {sname}.png not found — run generate_l3_2_settings.py first")

        print(f"\n  Loaded: hero ({len(hero_b64)//1024}KB), eye ref ({len(eye_ref_b64)//1024 if eye_ref_b64 else 0}KB), {len(setting_refs)} settings")
        print(f"\n  Generating {len(SCENES)} scenes...\n")

        generated, failed = [], []
        for scene in SCENES:
            out = OUTPUT_DIR / f"{scene['name']}.png"
            if out.exists() and mode != "scenes":
                print(f"  [{scene['name']}] exists, skip"); generated.append(scene['name']); continue
            print(f"  [{scene['name']}] Generating (setting: {scene.get('setting_ref', 'none')})...")
            data = await generate_scene_image(session, hero_b64, eye_ref_b64, scene, setting_refs)
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
