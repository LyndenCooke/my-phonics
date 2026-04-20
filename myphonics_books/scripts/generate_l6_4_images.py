"""
Generate illustrations for L6.4 "The Incredible Bush Walk" using Gemini API.

Setting: Blue Mountains, Australia — eucalyptus bush, red earth, blue haze
Main characters: Mia (9-10, green t-shirt, ponytail) and Tom (7-8, red t-shirt)
Side character: Dad (khaki hiking shirt, beard, sunhat)
Wardrobe rule: NO shorts anywhere — all characters wear long hiking trousers.

Usage:
    py -3.12 scripts/generate_l6_4_images.py           # Generate all (heroes + scenes)
    py -3.12 scripts/generate_l6_4_images.py hero       # Regenerate all 3 heroes
    py -3.12 scripts/generate_l6_4_images.py scenes     # All scenes (force)
    py -3.12 scripts/generate_l6_4_images.py page2      # Single scene by name
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
NOTEBOOK_REF_PATH = OUTPUT_DIR / "notebook_reference.png"
LYREBIRD_REF_PATH = OUTPUT_DIR / "lyrebird_reference.png"
REQUEST_DELAY = 3; MAX_RETRIES = 3; BACKOFF_BASE = 5

MIA_SKIN = "#E8C5A0"; MIA_HAIR = "#A0784C"
TOM_SKIN = "#E8C5A0"; TOM_HAIR = "#B5734A"
DAD_SKIN = "#D4A574"

BASE_STYLE = (
    "Whimsical children's book illustration. Hand-drawn cartoon style with "
    "soft watercolour textured backgrounds and clean black-outlined characters. "
    "CRITICAL EYE RULE: Every character AND every animal (including the lyrebird, "
    "rosella, and any other creature) MUST have eyes that are tiny solid black "
    "filled circles like dots. NO white sclera, NO iris, NO highlight, NO visible "
    "eyeball whites on animals — just a single small black dot per eye. "
    "CRITICAL WARDROBE RULE: NO shorts on any character. All children and adults "
    "wear LONG hiking trousers covering the full leg down to the ankles. "
    "Warm, friendly. No text, words, letters, or numbers in the image."
)

# ── Hero character descriptions ───────────────────────────────────────────────

MIA_HERO = {
    "name": "hero_mia",
    "description": (
        f"A cartoon girl character, about 9 years old, with light warm Australian "
        f"skin, hex colour {MIA_SKIN}. Light brown wavy hair (hex {MIA_HAIR}) "
        f"pulled back in a ponytail. "
        f"She wears a green t-shirt, long khaki hiking trousers (full length, covering "
        f"ankles — NOT shorts), and brown hiking boots. "
        f"A small backpack on her back. "
        f"Solid black dot eyes — ZERO white. Confident adventurous expression. "
        f"NO rosy cheeks. Standing neutral pose, full body, plain cream background."
    ),
}

TOM_HERO = {
    "name": "hero_tom",
    "description": (
        f"A cartoon boy character, about 7-8 years old, with light warm Australian "
        f"skin, hex colour {TOM_SKIN}. Sandy reddish-brown short hair (hex {TOM_HAIR}). "
        f"He wears a red t-shirt, long khaki hiking trousers (full length, covering "
        f"ankles — NOT shorts), and brown hiking boots. "
        f"A small backpack on his back. He holds a small notebook. "
        f"Solid black dot eyes — ZERO white. Curious, thoughtful expression. "
        f"NO rosy cheeks. Standing neutral pose, full body, plain cream background."
    ),
}

DAD_HERO = {
    "name": "hero_dad",
    "description": (
        f"A cartoon adult man character, about 40 years old, with medium-warm skin "
        f"hex colour {DAD_SKIN}. Short brown hair, neat brown beard. "
        f"He wears a khaki hiking shirt, long khaki cargo trousers (full length, "
        f"covering ankles — NOT shorts), and brown hiking boots. "
        f"He carries a water bottle. A brown wide-brim sunhat on his head. "
        f"Solid black dot eyes — ZERO white. Warm, friendly expression. "
        f"NO rosy cheeks. Standing neutral pose, full body, plain cream background."
    ),
}

# ── Shared setting / character text blocks ─────────────────────────────────────

BUSH_TRAIL = (
    "Blue Mountains bush walk trail: red-brown earth path winding through enormous "
    "eucalyptus gum trees with peeling bark, dappled golden sunlight through canopy, "
    "green ferns and undergrowth, distant sandstone cliffs with famous blue haze"
)

LYREBIRD = (
    "a magnificent lyrebird with long silvery-brown tail feathers fanned out in a "
    "gorgeous veil shape above its body, standing on a mossy mound, beak open mid-song. "
    "The lyrebird's eyes are tiny solid black dots ONLY — absolutely no white sclera, "
    "no visible eyeball whites, no scary staring eyes"
)

SCENES = [
    # "chars" lists which hero refs to inject — only those characters appear in the scene
    {"name": "cover", "chars": ["mia", "tom"], "lyrebird": True, "prompt": (
        f"Draw Mia and Tom from the reference images provided. "
        f"They stand SIDE BY SIDE on a red-brown earth bush walk trail in the Blue Mountains, "
        f"filling the lower half of the frame, both the same size. "
        f"Enormous eucalyptus trees rise around them. "
        f"Dramatic sandstone cliffs with famous blue haze behind them. "
        f"{LYREBIRD} partially visible among ferns beside the trail. "
        f"Tom points towards it with excitement, Mia looks amazed. "
        f"Bright daylight, warm golden tones. Eyes: tiny solid black dots ONLY. Portrait format 3:4."
    )},
    {"name": "page1", "chars": ["mia", "tom", "dad"], "prompt": (
        f"Draw Mia, Tom, and Dad from the reference images provided. "
        f"Setting: start of a bush walk trail in the Blue Mountains — wooden trailhead sign, "
        f"enormous eucalyptus trees overhead, red-brown earth, blue haze over sandstone peaks. "
        f"Mia stands confidently with hands on hips looking at the view. "
        f"Tom sits on a rock beside the trail, drawing quietly in his notebook — same size as Mia in frame. "
        f"Dad stands behind them, smiling. Bright morning sunlight. "
        f"Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page2", "chars": ["mia", "tom"], "prompt": (
        f"Draw Mia and Tom from the reference images provided. "
        f"{BUSH_TRAIL}. "
        f"IMPORTANT COMPOSITION: Both children are LARGE, filling most of the frame, "
        f"standing right next to each other — NOT one far behind the other. Equal size on screen. "
        f"Mia is on the left, arm raised pointing up at a crimson rosella "
        f"(bright red-and-blue parrot) perched on a gum tree branch above. "
        f"Tom is right beside her on the right, KNEELING on one knee, notebook open, "
        f"looking down at something near the ground. Natural kneeling pose. "
        f"Sandstone cliffs with blue haze through the trees behind them. "
        f"Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page3", "chars": ["mia", "tom"], "prompt": (
        f"Draw Mia and Tom from the reference images provided. "
        f"{BUSH_TRAIL}. "
        f"Mia stands on the trail turned back with an impatient expression, hands on hips. "
        f"Tom stands nearby, head tilted, listening intently with a curious expression, "
        f"notebook tucked under one arm. Both clearly visible, similar size. "
        f"Dense eucalyptus bush on both sides, ferns and undergrowth. "
        f"Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page4", "chars": ["tom"], "notebook": True, "lyrebird": True, "prompt": (
        f"Draw Tom from the reference image provided. "
        f"Magical forest clearing scene. Tom is kneeling on one knee beside a mossy log. "
        f"His notebook is PROPPED OPEN against the log in front of him like an easel — "
        f"resting on its own, NOT held in his hands. "
        f"Tom leans forward with ONE hand only, holding a pencil, sketching in the open notebook. "
        f"His other arm hangs naturally at his side. He has EXACTLY TWO ARMS AND TWO HANDS — "
        f"one hand holds the pencil, one hand is free at his side. "
        f"His face shows wonder and excitement as he looks up at the lyrebird in front of him. "
        f"In the clearing before him: {LYREBIRD}. "
        f"Dappled golden light through eucalyptus canopy. Ferns, moss, fallen leaves. "
        f"EYE RULE — every living creature in this image: eyes are ONLY tiny solid black filled "
        f"dots. NO white sclera, NO iris, NO highlight, NO colour in any eye — just black dots. "
        f"Landscape."
    )},
    {"name": "page5", "chars": ["mia", "tom"], "notebook": True, "lyrebird": True, "prompt": (
        f"Draw Mia and Tom from the reference images provided. "
        f"Both are KNEELING on both knees side by side behind a large fern — knees on the ground, "
        f"upright torso, natural comfortable kneeling pose. NOT squatting, NOT crouching. "
        f"Same size in frame, peering through the fern fronds together. "
        f"Mia's expression is amazed — mouth slightly open, eyebrows raised. "
        f"Tom looks quietly proud, one arm pointing towards {LYREBIRD} "
        f"displaying its fanned tail feathers in the dappled clearing beyond. "
        f"Soft golden light. Eucalyptus forest. Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page6", "chars": ["mia", "tom"], "notebook": True, "prompt": (
        f"Draw Mia and Tom from the reference images provided. "
        f"{BUSH_TRAIL}. "
        f"They walk side by side, both smiling, same size in frame. "
        f"Tom points at textured bark of a large gum tree while Mia leans in to look, genuinely interested. "
        f"Behind them the trail opens to a lookout with wooden railing — panoramic view of "
        f"blue-hazed mountain ranges and deep forested valleys. "
        f"Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page7", "chars": ["mia", "tom", "dad"], "notebook": True, "prompt": (
        f"Three characters from the reference images: "
        f"MIA (girl, GREEN t-shirt, brown ponytail, skin {MIA_SKIN}), "
        f"TOM (boy, RED t-shirt, reddish-brown short hair, skin {TOM_SKIN}), "
        f"and DAD (adult man with beard, khaki shirt, skin {DAD_SKIN}). "
        f"Indoor scene: modern visitor centre gallery, bright white walls with large "
        f"vibrant Aboriginal dot art paintings in red, gold, ochre, white. "
        f"Tom (red t-shirt) holds up his small tan-covered notebook open, showing pencil sketches. "
        f"Mia (green t-shirt, ponytail) stands beside Tom at EXACTLY THE SAME HEIGHT, heads level, "
        f"looking at his notebook with a warm smile. "
        f"Dad (bearded adult man) stands behind both children, noticeably taller as he is an adult, "
        f"smiling proudly, sunhat held at his side. "
        f"IMPORTANT: There are TWO children (Mia in green, Tom in red) — same height as each other. "
        f"Only ONE adult (Dad). No other people. NO animals, NO birds. "
        f"Eyes: tiny solid black dots. Landscape."
    )},
    {"name": "page8", "chars": ["mia", "tom"], "notebook": True, "prompt": (
        f"Draw Mia and Tom from the reference images provided. "
        f"Warm evening scene. Cosy holiday cabin living room near the Blue Mountains. "
        f"Tom sits on a sofa holding his open notebook — small, with a light tan kraft-brown card cover, "
        f"open to show pencil sketches inside — reading aloud from it, happy. "
        f"Mia sits right beside him, same size, leaning towards him with a warm smile of admiration. "
        f"CRITICAL: Both children are relaxing indoors — NO backpacks on their backs, NO boots on their feet. "
        f"Both Mia AND Tom are wearing WHITE SOCKS on their feet — clearly visible, no bare feet, no shoes. "
        f"Their hiking boots (unlaced, removed) and backpacks are shown piled near the door in the background. "
        f"Through the window: Blue Mountains dark silhouettes against a golden-pink sunset. "
        f"Soft warm lamp light inside. NO animals or birds in this scene. "
        f"Eyes: tiny solid black dots. Landscape."
    )},
]

# ── API helpers ────────────────────────────────────────────────────────────────

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
                            output_path.write_bytes(data)
                            print(f"  [{hero_info['name']}] Saved ({len(data)//1024} KB)")
                            return output_path
                elif resp.status in (429, 503):
                    await asyncio.sleep(BACKOFF_BASE * (2 ** attempt))
                else:
                    print(f"  [{hero_info['name']}] Error {resp.status}")
                    await asyncio.sleep(BACKOFF_BASE * (2 ** attempt))
        except Exception as e:
            print(f"  [{hero_info['name']}] {e}"); await asyncio.sleep(BACKOFF_BASE)
    return None


async def generate_scene_image(session, refs, scene):
    """refs = dict with keys: mia_b64, tom_b64, dad_b64, eye_b64 (all may be None).
    Only injects hero refs for characters listed in scene['chars']."""
    full_prompt = f"{scene['prompt']} {BASE_STYLE}"
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"
    chars = scene.get("chars", [])
    parts = []
    if refs.get("eye_b64"):
        parts.append({"text": "EYE STYLE REFERENCE — tiny solid black dots, ZERO white:"})
        parts.append({"inlineData": {"mimeType": "image/png", "data": refs["eye_b64"]}})
    if "mia" in chars and refs.get("mia_b64"):
        parts.append({"text": (
            f"CHARACTER REFERENCE — THIS IS MIA. She is a girl with light warm skin ({MIA_SKIN}), "
            f"light brown wavy hair in a ponytail ({MIA_HAIR}), green t-shirt, long khaki trousers, "
            f"brown hiking boots, small backpack. REPRODUCE THIS CHARACTER EXACTLY in the scene:"
        )})
        parts.append({"inlineData": {"mimeType": "image/png", "data": refs["mia_b64"]}})
    if "tom" in chars and refs.get("tom_b64"):
        parts.append({"text": (
            f"CHARACTER REFERENCE — THIS IS TOM. He is a boy with light warm skin ({TOM_SKIN}), "
            f"sandy reddish-brown short hair ({TOM_HAIR}), red t-shirt, long khaki trousers, "
            f"brown hiking boots, small backpack, always carries a small notebook with a "
            f"LIGHT TAN / KRAFT BROWN card cover. "
            f"CRITICAL: Tom's eyes must be drawn as TWO TINY SOLID BLACK FILLED CIRCLES — "
            f"like small ink dots. NO white part, NO sclera, NO iris, NO pupil ring, NO highlight. "
            f"Just two small black dots. REPRODUCE THIS CHARACTER with corrected dot eyes:"
        )})
        parts.append({"inlineData": {"mimeType": "image/png", "data": refs["tom_b64"]}})
    if "dad" in chars and refs.get("dad_b64"):
        parts.append({"text": (
            f"CHARACTER REFERENCE — THIS IS DAD. He is an adult man with medium-warm skin ({DAD_SKIN}), "
            f"short brown hair, neat beard, khaki hiking shirt, long khaki cargo trousers, "
            f"brown sunhat, carries a water bottle. REPRODUCE THIS CHARACTER EXACTLY in the scene:"
        )})
        parts.append({"inlineData": {"mimeType": "image/png", "data": refs["dad_b64"]}})
    if scene.get("notebook") and refs.get("notebook_b64"):
        parts.append({"text": (
            "PROP REFERENCE — TOM'S NOTEBOOK. This is the exact notebook Tom always carries. "
            "Match its size, shape, and cover colour EXACTLY every time it appears:"
        )})
        parts.append({"inlineData": {"mimeType": "image/png", "data": refs["notebook_b64"]}})
    if scene.get("lyrebird") and refs.get("lyrebird_b64"):
        parts.append({"text": (
            "ANIMAL REFERENCE — THE LYREBIRD. This is the exact lyrebird that appears in the story. "
            "Reproduce its species, body shape, and spectacular fanned tail feathers EXACTLY. "
            "Its eye must be a single tiny solid black dot — NO white, NO colour:"
        )})
        parts.append({"inlineData": {"mimeType": "image/png", "data": refs["lyrebird_b64"]}})
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
    print(f"\n{'='*55}\nL6.4: \"The Incredible Bush Walk\" — Blue Mountains\nOutput: {OUTPUT_DIR}\nMode: {mode}\n{'='*55}")

    hero_path_mia = OUTPUT_DIR / "hero_mia.png"
    hero_path_tom = OUTPUT_DIR / "hero_tom.png"
    hero_path_dad = OUTPUT_DIR / "hero_dad.png"
    # Legacy path support
    legacy = OUTPUT_DIR / "hero_reference.png"
    if legacy.exists() and not hero_path_mia.exists():
        import shutil; shutil.copy(legacy, hero_path_mia)
        print("  [mia] Copied from hero_reference.png")

    async with aiohttp.ClientSession() as session:
        if mode in ("all", "hero"):
            for hero, path in [(MIA_HERO, hero_path_mia), (TOM_HERO, hero_path_tom), (DAD_HERO, hero_path_dad)]:
                if not path.exists() or mode == "hero":
                    print(f"  [{hero['name']}] Generating...")
                    if not await generate_hero_image(session, hero, path):
                        print(f"FATAL: {hero['name']} hero failed"); sys.exit(1)
                    await asyncio.sleep(REQUEST_DELAY)
                else:
                    print(f"  [{hero['name']}] exists, skip")
        if mode == "hero": print("All heroes done."); return

        # Generate notebook reference if missing or explicitly requested
        if mode in ("all", "notebook") and (not NOTEBOOK_REF_PATH.exists() or mode == "notebook"):
            print("  [notebook] Generating notebook reference...")
            notebook_hero = {
                "name": "notebook",
                "description": (
                    "A standalone product-style illustration of a small A6 field notebook. "
                    "The notebook is shown closed, slightly angled, on a plain cream background. "
                    "It has a light tan / kraft-brown card cover — the colour of natural brown paper. "
                    "The cover is plain with no text, no title, no label. "
                    "The spine is visible on the left edge. The pages visible on the right edge are white. "
                    "The notebook is small — about the size a child could hold in one hand. "
                    "Clean, simple, cartoon illustration style. No characters, no hands, just the notebook."
                )
            }
            await generate_hero_image(session, notebook_hero, NOTEBOOK_REF_PATH)
            await asyncio.sleep(REQUEST_DELAY)
        if mode == "notebook": print("Notebook reference done."); return

        # Generate lyrebird reference if missing or explicitly requested
        if mode in ("all", "lyrebird") and (not LYREBIRD_REF_PATH.exists() or mode == "lyrebird"):
            print("  [lyrebird] Generating lyrebird reference...")
            lyrebird_hero = {
                "name": "lyrebird",
                "description": (
                    "A standalone illustration of a superb lyrebird, shown in full body on a plain cream background. "
                    "The lyrebird is in full display — its magnificent long silvery-brown tail feathers are fanned "
                    "out in a spectacular veil shape above and around its body, like an ornate lace fan. "
                    "The bird stands on a small mossy mound, beak open mid-song. "
                    "Brown-grey body feathers, long decorative lyre-shaped outer tail feathers framing the veil. "
                    "Its eye is a single tiny solid black dot — NO white sclera, NO colour, just a black dot. "
                    "Whimsical children's book cartoon style, clean black outlines, warm colours. "
                    "No characters, no background scenery — just the bird on cream."
                )
            }
            await generate_hero_image(session, lyrebird_hero, LYREBIRD_REF_PATH)
            await asyncio.sleep(REQUEST_DELAY)
        if mode == "lyrebird": print("Lyrebird reference done."); return

        for path, label in [(hero_path_mia, "Mia"), (hero_path_tom, "Tom"), (hero_path_dad, "Dad")]:
            if not path.exists(): print(f"ERROR: No hero for {label} — run 'hero' mode first"); sys.exit(1)

        refs = {
            "mia_b64": base64.b64encode(hero_path_mia.read_bytes()).decode("utf-8"),
            "tom_b64": base64.b64encode(hero_path_tom.read_bytes()).decode("utf-8"),
            "dad_b64": base64.b64encode(hero_path_dad.read_bytes()).decode("utf-8"),
            "eye_b64": base64.b64encode(EYE_REF_PATH.read_bytes()).decode("utf-8") if EYE_REF_PATH.exists() else None,
            "notebook_b64": base64.b64encode(NOTEBOOK_REF_PATH.read_bytes()).decode("utf-8") if NOTEBOOK_REF_PATH.exists() else None,
            "lyrebird_b64": base64.b64encode(LYREBIRD_REF_PATH.read_bytes()).decode("utf-8") if LYREBIRD_REF_PATH.exists() else None,
        }

        scene_names = [s['name'] for s in SCENES]
        if mode in scene_names:
            scenes_to_run = [s for s in SCENES if s['name'] == mode]
        else:
            scenes_to_run = SCENES

        print(f"\n  Generating {len(scenes_to_run)} scene(s)...\n")
        generated, failed = [], []
        for scene in scenes_to_run:
            out = OUTPUT_DIR / f"{scene['name']}.png"
            if out.exists() and mode not in ("scenes", scene['name']):
                print(f"  [{scene['name']}] exists, skip"); generated.append(scene['name']); continue
            print(f"  [{scene['name']}] Generating...")
            data = await generate_scene_image(session, refs, scene)
            if data:
                out.write_bytes(data); print(f"  [{scene['name']}] Saved ({len(data)//1024} KB)")
                generated.append(scene['name'])
            else:
                print(f"  [{scene['name']}] FAILED"); failed.append(scene['name'])
            await asyncio.sleep(REQUEST_DELAY)

        print(f"\n{'='*55}\nGenerated: {len(generated)}/{len(scenes_to_run)}")
        if failed: print(f"Failed: {', '.join(failed)}")
        else: print("All done!")
        print(f"Output: {OUTPUT_DIR}\n{'='*55}")

if __name__ == "__main__":
    asyncio.run(main())
