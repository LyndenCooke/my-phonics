"""
Generate illustrations for L3.5 "The Boat with the Red Sail" using Gemini API.

Setting: Port of Spain, Trinidad — Gulf of Paria waterfront, colourful wooden
houses, traditional fishing pirogues (sailing boats).
Character: Afro-Trinidadian boy (Kai), skin #7B4A30, short natural afro,
           orange t-shirt, dark navy three-quarter length trousers, bare feet.
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
KAI_SKIN_HEX = "#3A2518"   # Very dark rich brown, deep warm undertone
KAI_HAIR_HEX = "#0D0D0D"   # Near-black
DAD_SKIN_HEX = "#3A2518"   # Very dark rich brown, same depth as Kai
DAD_HAIR_HEX = "#0D0D0D"   # Near-black

KAI_HERO = {
    "description": (
        f"A cartoon boy character named Kai, about 6-7 years old, with very dark rich "
        f"brown skin — deep dark chocolate brown. Hex colour: {KAI_SKIN_HEX}. "
        f"This is VERY DARK skin — darker than milk chocolate, closer to dark chocolate. "
        f"He has short styled locs — small neat dreadlocks about 3-4cm long, arranged in "
        f"a decorative pattern with neat geometric partings visible on the scalp "
        f"(diamond or zigzag sections). The locs stick up from each section — "
        f"styled and intentional, not messy. A cool, cared-for Caribbean hairstyle. "
        f"Hair colour: {KAI_HAIR_HEX} (near-black). "
        f"He wears a bright orange cotton t-shirt with a small yellow star on the front, "
        f"and dark navy THREE-QUARTER LENGTH trousers — the hem ends HALFWAY DOWN "
        f"the lower leg, well below the knee but above the ankle. These are NOT shorts "
        f"(NOT above-knee), NOT full-length trousers (NOT at ankle). The trouser hem "
        f"should be at the WIDEST part of the calf muscle. "
        f"Bare feet — no shoes, no sandals. "
        f"He has small friendly dot eyes — solid black filled circles with ZERO white. "
        f"No white highlight, no white reflection, no white dot, no shine, no pupil detail. "
        f"Just 100% solid black circles like ink dots. "
        f"A cheerful friendly expression. ABSOLUTELY NO rosy cheeks, NO blush marks, "
        f"NO pink or red circles on face — clean smooth {KAI_SKIN_HEX} dark brown skin on cheeks. "
        f"Standing in a neutral pose, facing the viewer, full body visible from head to toe. "
        f"Arms slightly away from body, feet shoulder-width apart. "
        f"Plain light cream solid-colour background (no scenery, no objects, no patterns)."
    ),
    "short": "Kai — the boy in the bright orange t-shirt with short starter locs",
}

DAD_HERO = {
    "description": (
        f"A cartoon man character, about mid-30s, Afro-Trinidadian. "
        f"He has very dark rich brown skin — deep dark chocolate brown. Hex colour: {DAD_SKIN_HEX}. "
        f"Same dark depth as his son Kai. "
        f"Very short close-cropped black hair ({DAD_HAIR_HEX}), almost a buzz cut. "
        f"He has a short neat beard / stubble. Broad shoulders, strong build — a fisherman. "
        f"He wears a bright YELLOW waterproof fisherman's jacket (zipped up, slightly shiny), "
        f"a grey t-shirt visible at the collar, dark navy full-length trousers "
        f"(tucked into his boots), "
        f"and bright YELLOW rubber boots (Wellington boots) that come up to mid-calf. "
        f"He has small friendly dot eyes — solid black filled circles with ZERO white. "
        f"No white highlight, no white reflection, no white dot, no shine, no pupil detail. "
        f"Just 100% solid black circles like ink dots. "
        f"A broad warm friendly smile. ABSOLUTELY NO rosy cheeks, NO blush marks, "
        f"NO pink or red circles on face — clean smooth {DAD_SKIN_HEX} brown skin on cheeks. "
        f"Standing in a neutral pose, facing the viewer, full body visible from head to toe. "
        f"Arms slightly away from body, feet shoulder-width apart. "
        f"Plain light cream solid-colour background (no scenery, no objects, no patterns)."
    ),
    "short": "Dad — the man in the yellow fisherman's jacket and yellow rubber boots",
}

# ─── Object & Setting Definitions ────────────────────────────────

BOAT = (
    "A traditional Trinidadian wooden pirogue (fishing boat), "
    "painted sky-blue hull, a distinctive bold RED stripe running along the hull "
    "and on the triangular sail — this red stripe is the identifying feature. "
    "The sail is white with the red stripe diagonal across it. "
    "An outboard motor at the back. Traditional wooden construction."
)

BOAT_HERO = {
    "description": (
        "A traditional Trinidadian wooden pirogue (fishing boat). "
        "The hull is painted SKY-BLUE — a bright cheerful blue. "
        "A distinctive bold RED stripe runs horizontally along the side of the hull. "
        "The boat has a single triangular sail — the sail is WHITE with a bold RED stripe "
        "running diagonally across it. This red stripe is the key identifying feature. "
        "A small black outboard motor is mounted at the stern (back). "
        "The boat is wooden, hand-crafted, with visible planking. "
        "There is a wooden crate of silvery fish (kingfish and snapper) at the bow (front). "
        "The boat is shown from a 3/4 angle, floating on calm green-blue tropical water. "
        "Simple clean illustration style matching a children's picture book — "
        "soft watercolour background, clean black outlines, warm friendly feel. "
        "No people in this image. No text, words, letters, or numbers."
    ),
}

SNAIL = (
    "A small brown garden snail with a swirled shell (brown and cream spiral pattern), "
    "sitting on the ground — a cute, slow little creature"
)

SETTING_ROAD = (
    "A colourful residential road in Port of Spain, Trinidad. "
    "Brightly painted wooden Trinidadian gingerbread houses line both sides "
    "(yellow, pink, turquoise, orange) with decorative wooden trim and verandas. "
    "Royal palm trees and coconut palms between the houses. "
    "The road leads downhill toward the Gulf of Paria visible in the distance. "
    "Warm tropical atmosphere."
)

SETTING_TRAIL = (
    "A narrow tropical trail/path in Port of Spain, Trinidad. "
    "Lined with royal palm trees and lush green tropical plants (bougainvillea, ferns). "
    "Brightly painted wooden houses (yellow, turquoise, pink) visible through the palms. "
    "The path is slightly muddy from tropical rain. Puddles on the ground. "
    "Warm tropical atmosphere."
)

SETTING_COAST = (
    "Port of Spain waterfront, Trinidad. Gulf of Paria — calm green-blue tropical water. "
    "A concrete dock with painted turquoise metal railings. "
    "Behind the dock: brightly painted wooden Trinidadian gingerbread houses "
    "(yellow, pink, turquoise, orange) with decorative wooden trim. "
    "Royal palm trees and coconut palms. "
    "Warm tropical atmosphere."
)

SETTING_ROAD_RAIN = SETTING_ROAD + " Warm tropical rain falling (heavy drops, not cold)."
SETTING_TRAIL_RAIN = SETTING_TRAIL + " Warm tropical rain falling (heavy drops, not cold)."
SETTING_COAST_RAIN = SETTING_COAST + " Warm tropical rain falling (heavy drops, not cold)."
SETTING_COAST_CLEARING = SETTING_COAST + " Rain just clearing, soft golden light breaking through clouds."

# ─── Scene Prompts ────────────────────────────────────────────────

SCENES = [
    {
        "name": "cover",
        "prompt": (
            f"Show Kai (the boy from the reference image, orange t-shirt with yellow star, "
            f"dark navy three-quarter length trousers, bare feet) running DOWN a colourful "
            f"Trinidadian road TOWARD the sea in warm tropical rain. "
            f"He is viewed from behind at a slight angle — we see his back and profile as he runs "
            f"AWAY from the viewer, TOWARD the water ahead of him. "
            f"The road slopes downhill toward the Gulf of Paria visible at the end of the road. "
            f"On the sea in the distance, a small boat shape with a hint of red sail can be seen — "
            f"mysterious, far away, intriguing. "
            f"Brightly painted wooden Trinidadian houses (yellow, pink, turquoise) line both sides of the road. "
            f"Royal palm trees. Warm tropical rain falling. "
            f"Kai's skin colour is {KAI_SKIN_HEX} (warm Caribbean brown). "
            f"Portrait format (3:4 aspect ratio). "
            f"ABSOLUTELY NO rosy cheeks, NO blush marks on face."
        ),
    },
    {
        "name": "page1",
        "prompt": (
            f"Show Kai — EXACTLY as he appears in the hero reference image. "
            f"CRITICAL: Copy his appearance PRECISELY — very dark rich brown skin ({KAI_SKIN_HEX}), "
            f"short styled locs with neat geometric partings visible on the scalp (diamond/zigzag sections "
            f"with small locs sticking up from each section), bright orange t-shirt with a small YELLOW STAR "
            f"on the chest, dark navy three-quarter length trousers, bare feet. "
            f"He is sitting on a low concrete step outside a brightly painted Trinidadian house. "
            f"He is eating a piece of toast, looking up and out with a curious expression. "
            f"The road in front of him CURVES AWAY and disappears between the colourful houses — "
            f"you CANNOT see the sea from here. The coast feels far away and the route is unclear. "
            f"Just a winding road between brightly painted houses and palm trees. "
            f"Between two buildings in the distance, a small BOAT with a RED AND WHITE SAIL is visible "
            f"on a strip of blue sea — small but clearly there, like a clue waiting to be spotted. "
            f"{SETTING_ROAD_RAIN} "
            f"Small simple solid black dot eyes with ZERO white. "
            f"Landscape format. "
            f"ABSOLUTELY NO rosy cheeks, NO blush marks on face."
        ),
    },
    {
        "name": "page2",
        "prompt": (
            f"Show Kai (the boy from the reference image, orange t-shirt with yellow star, "
            f"dark navy three-quarter length trousers, bare feet) running DOWN a colourful main road "
            f"TOWARD the sea. He is viewed from behind at a slight angle — we see his back and side "
            f"profile as he runs AWAY from the viewer, TOWARD the water ahead of him. "
            f"He holds a light rain jacket/coat bunched in one hand, arm swinging. "
            f"Mid-stride, urgent running pose. "
            f"IMPORTANT SCALE: Kai is a small 6-year-old boy. He should be SMALL in the scene — "
            f"about one-third the height of the houses. The houses are full-sized two-storey "
            f"Trinidadian gingerbread houses that tower over him. Draw him at REALISTIC child scale. "
            f"Heavy tropical rain is falling. Colourful painted houses on both sides. "
            f"The road leads toward the sea but the route is long. "
            f"{SETTING_ROAD_RAIN} "
            f"CRITICAL: Kai's skin colour MUST be {KAI_SKIN_HEX} — very dark rich brown. "
            f"Small simple solid black dot eyes with ZERO white. "
            f"Landscape format. "
            f"ABSOLUTELY NO rosy cheeks, NO blush marks on face."
        ),
    },
    {
        "name": "page3",
        "prompt": (
            f"Show Kai (the boy from the reference image, orange t-shirt with yellow star, "
            f"dark navy three-quarter length trousers, bare feet) on a narrow tropical trail between palm trees "
            f"and brightly painted houses. He has stopped because {SNAIL} is sitting right in the "
            f"middle of the path, BLOCKING his way. "
            f"Kai's expression is impatient and comically annoyed — one hand pointing at the snail, "
            f"the other hand gesturing 'get out of my way!' "
            f"NO sea visible — the trail is surrounded by lush tropical plants, palm trees, and "
            f"colourful houses. The coast is still far away. "
            f"Rain falling. Puddles on the trail. "
            f"{SETTING_TRAIL_RAIN} "
            f"Kai's skin colour is {KAI_SKIN_HEX} (very dark rich brown). "
            f"Small simple solid black dot eyes with ZERO white. "
            f"Landscape format. "
            f"ABSOLUTELY NO rosy cheeks, NO blush marks on face."
        ),
    },
    {
        "name": "page4",
        "prompt": (
            f"Show Kai (the boy from the reference image, orange t-shirt with yellow star, "
            f"dark navy three-quarter length trousers, bare feet) having just SLIPPED and FALLEN into "
            f"a concrete roadside DRAIN filled with muddy brown water on the trail. "
            f"The drain is a narrow channel cut into the side of the path — he has slid into it. "
            f"He is sitting in the drain with muddy water around his legs. "
            f"IMPORTANT: A separate light-coloured coat/jacket is lying on the ground next to him, "
            f"completely COVERED IN MUD — brown splatters and stains all over the coat. "
            f"Mud splashed on his trousers and legs. "
            f"BUT Kai is still wearing his BRIGHT ORANGE t-shirt with YELLOW STAR — "
            f"the t-shirt is NOT muddy, NOT changed. It must be clearly ORANGE. "
            f"Expression: frustrated but determined — he WILL get up and keep going. "
            f"NO sea visible, NO boat visible — just the trail with palm trees, tropical plants, "
            f"and painted houses around him. The coast is still far away. "
            f"{SETTING_TRAIL_RAIN} "
            f"Kai's skin colour is {KAI_SKIN_HEX} (very dark rich brown). "
            f"Small simple solid black dot eyes with ZERO white. "
            f"Landscape format. "
            f"ABSOLUTELY NO rosy cheeks, NO blush marks on face."
        ),
    },
    {
        "name": "page5",
        "prompt": (
            f"Show Kai — EXACTLY as he appears in the hero reference image. "
            f"CRITICAL: Copy his appearance PRECISELY — very dark rich brown skin ({KAI_SKIN_HEX}), "
            f"short styled LOCS with neat geometric partings visible on the scalp (NOT an afro, NOT a buzz cut — "
            f"small dreadlocks sticking up from diamond/zigzag sections), bright orange t-shirt with a small "
            f"YELLOW STAR on the chest, dark navy three-quarter length trousers, bare feet. "
            f"He is arriving at the waterfront dock, out of breath "
            f"but thrilled. He is gripping the turquoise dock railing, leaning forward, pointing at "
            f"the boat. {BOAT} is sailing in from the sea — at medium distance, about 50 metres out. "
            f"The RED STRIPE on the sail is clearly visible. The boat is approaching but not yet docked. "
            f"Kai's expression: relief and excitement — he made it! He can see the red sail! "
            f"His clothes are a bit muddy from the fall but he doesn't care. "
            f"{SETTING_COAST_RAIN} "
            f"Kai's skin colour is {KAI_SKIN_HEX} (warm Caribbean brown). "
            f"Small simple solid black dot eyes with ZERO white. "
            f"Landscape format. "
            f"ABSOLUTELY NO rosy cheeks, NO blush marks on face."
        ),
    },
    {
        "name": "page6",
        "prompt": (
            f"ZOOMED IN view of the boat and the man on it. "
            f"{BOAT} is IN THE WATER, docked alongside a concrete pier/dock. The boat is FLOATING "
            f"on the green-blue sea — NOT on land, NOT on the sidewalk. "
            f"A big wooden crate of silvery fish (kingfish and snapper) sits at the front of the boat. "
            f"Standing UP inside the boat is Dad (from the Dad reference image): broad-shouldered "
            f"Afro-Trinidadian man, mid-30s, very dark brown skin ({DAD_SKIN_HEX}), very short "
            f"close-cropped black hair, short beard, bright YELLOW waterproof fisherman's jacket, "
            f"dark navy trousers tucked into yellow rubber boots. "
            f"Dad is STANDING IN THE BOAT with both arms raised high above his head, waving, "
            f"mouth open, calling out excitedly. He is the focus of the image. "
            f"The boat takes up most of the scene — this is a close-up/zoomed view. "
            f"Colourful Trinidadian houses and palm trees visible behind across the water. Rain falling. "
            f"{SETTING_COAST_RAIN} "
            f"Dad's skin {DAD_SKIN_HEX} — very dark rich brown. "
            f"Small simple solid black dot eyes with ZERO white. "
            f"Landscape format. "
            f"ABSOLUTELY NO rosy cheeks, NO blush marks on face."
        ),
    },
    {
        "name": "page7",
        "prompt": (
            f"Show a joyful reunion scene on the dock/sidewalk. SUNNY — bright warm sunshine, "
            f"blue sky, the rain has stopped. Golden warm light. "
            f"Dad (from the Dad reference image: Afro-Trinidadian man, mid-30s, very dark brown skin "
            f"{DAD_SKIN_HEX}, bright YELLOW waterproof fisherman's jacket, dark navy trousers, "
            f"yellow rubber boots, very short close-cropped hair, short beard, broad warm smile) "
            f"has scooped Kai (from the hero reference image — very dark brown skin {KAI_SKIN_HEX}, "
            f"short styled locs with geometric partings, orange t-shirt with yellow star, "
            f"dark navy three-quarter length trousers) up off his feet in a huge bear hug. "
            f"Dad is holding Kai in his arms, Kai's face close to Dad's, both with HUGE grins. "
            f"They are spinning in the sunshine — pure joy and happiness! "
            f"NO boat in this image. Just the two of them on the dock with colourful Trinidadian "
            f"houses and palm trees behind. Bright sunshine, blue sky. "
            f"Kai's skin {KAI_SKIN_HEX}, Dad's skin {DAD_SKIN_HEX} — both very dark rich brown. "
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
            f"short styled locs with geometric partings, bright orange t-shirt with yellow star, "
            f"dark navy three-quarter length trousers) and Dad (from the Dad reference image: "
            f"Afro-Trinidadian man, mid-30s, very dark brown skin {DAD_SKIN_HEX}, short close-cropped "
            f"black hair, short beard, yellow fisherman's jacket, dark navy trousers, yellow rubber boots) "
            f"strolling back up a colourful Trinidadian road together. "
            f"Dad carries a big crate of fish on one shoulder, other arm around Kai. "
            f"Both have warm, contented smiles, walking side by side. "
            f"ON THE GROUND beside the road, {SNAIL} is still sitting there on a trail/path — "
            f"the snail hasn't moved! This is a funny bookend detail. "
            f"The tropical rain has cleared — warm golden light, blue sky showing through clouds. "
            f"Brightly painted houses on both sides, palm trees, bougainvillea. "
            f"CRITICAL: Kai's skin must be {KAI_SKIN_HEX} — very dark rich brown. "
            f"{SETTING_ROAD.replace('Warm tropical atmosphere.', 'Rain just cleared, warm golden light, blue sky.')} "
            f"Small simple solid black dot eyes with ZERO white on BOTH characters. "
            f"Landscape format. "
            f"ABSOLUTELY NO rosy cheeks, NO blush marks on either face."
        ),
    },
]


# ─── API Functions ────────────────────────────────────────────────

SKIN_REF_PATH = Path(__file__).parent.parent / "output" / "images" / "L2_3_B1" / "hero_reference.png"

async def recolour_hero(
    session: aiohttp.ClientSession, hero_path: Path, output_path: Path
) -> "Path | None":
    """Recolour existing hero or remove rosy cheeks."""
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"
    hero_b64 = base64.b64encode(hero_path.read_bytes()).decode("utf-8")

    parts = []

    # Inject skin tone reference if available
    if SKIN_REF_PATH.exists():
        skin_ref_b64 = base64.b64encode(SKIN_REF_PATH.read_bytes()).decode("utf-8")
        parts.append({
            "text": (
                "SKIN TONE REFERENCE — Look at the ADULT MAN (the tall person) in this image. "
                "His skin tone is the TARGET darkness. The character I want you to edit must have "
                "skin AT LEAST as dark as this man, or even darker:"
            )
        })
        parts.append({"inlineData": {"mimeType": "image/png", "data": skin_ref_b64}})
        print(f"  [recolour] Using skin tone reference from L2.3")

    parts.append({"inlineData": {"mimeType": "image/png", "data": hero_b64}})
    parts.append({"text": (
        f"Edit this character image. Make these changes ONLY: "
        f"1. REMOVE any rosy cheeks, blush marks, pink spots, or reddish circles on the face. "
        f"   The cheeks must be the SAME colour as the rest of the face skin — clean, smooth, uniform. "
        f"2. Make the skin MUCH DARKER — target hex {KAI_SKIN_HEX}. This is very dark chocolate brown, "
        f"   like dark chocolate or espresso. Significantly darker than the current image. "
        f"   Match the skin tone of the adult man in the reference image above, or go DARKER. "
        f"   The skin should be deep, rich, dark brown ALL OVER — face, arms, hands, legs, feet. "
        f"3. Ensure hair colour is {KAI_HAIR_HEX} (near-black). "
        f"4. Keep the friendly SMILE — do NOT change the expression. "
        f"Keep everything else EXACTLY the same — same pose, same outfit, same eyes, same background, same style. "
        f"Do NOT change the clothes, eyes, hair style, expression, pose, or background."
    )})

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
    dad_b64: "str | None" = None,
    boat_b64: "str | None" = None,
) -> "bytes | None":
    """Generate a scene using Gemini with hero reference + eye style + optional Dad/boat injection."""
    full_prompt = f"{scene['prompt']} {BASE_STYLE}"
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"

    # Check if this scene includes Dad (pages 6, 7, 8)
    scene_has_dad = "Dad" in scene["prompt"] and "dad" != scene["name"]
    # Check if this scene includes the boat
    scene_has_boat = "boat" in scene["prompt"].lower() or "pirogue" in scene["prompt"].lower()

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

    # Hero reference (Kai) — inject TWICE to force character consistency
    parts.append({
        "text": (
            f"CHARACTER REFERENCE — KAI (the boy). This is the EXACT character you must draw. "
            f"Study this image carefully — his skin tone, his HAIR STYLE (short styled locs with "
            f"geometric partings on the scalp), his orange t-shirt with yellow star, his dark navy "
            f"three-quarter length trousers. Every detail must match:"
        )
    })
    parts.append({"inlineData": {"mimeType": "image/png", "data": hero_b64}})
    parts.append({
        "text": (
            f"Here is the SAME character again. You MUST match THREE things EXACTLY: "
            f"1. SKIN: Very dark rich brown ({KAI_SKIN_HEX}) — as dark as in this image. "
            f"Do NOT lighten the skin. Do NOT make it lighter than this reference. "
            f"2. HAIR: Short LOCS (small dreadlocks) with geometric partings on the scalp. "
            f"NOT an afro. NOT a buzz cut. The locs hang down and stick out from sections. "
            f"3. NO rosy cheeks, NO blush, NO pink marks on the face. Clean smooth dark skin. "
            f"Eyes: solid black dots, zero white:"
        )
    })
    parts.append({"inlineData": {"mimeType": "image/png", "data": hero_b64}})
    parts.append({
        "text": (
            f"FINAL CHECK — here is the character one more time. The skin in your output "
            f"must be THIS dark. Not lighter. Match this exact tone:"
        )
    })
    parts.append({"inlineData": {"mimeType": "image/png", "data": hero_b64}})

    # Dad reference (if scene includes Dad and we have a reference)
    if scene_has_dad and dad_b64:
        parts.append({
            "text": (
                f"CHARACTER REFERENCE — DAD (the man). Keep his EXACT appearance from this reference: "
                f"skin colour {DAD_SKIN_HEX} (dark brown), short close-cropped hair, short neat beard, "
                f"bright YELLOW waterproof fisherman's jacket, dark navy trousers, "
                f"bright YELLOW rubber boots. "
                f"Eyes must be solid black dots like the eye reference above:"
            )
        })
        parts.append({"inlineData": {"mimeType": "image/png", "data": dad_b64}})

    # Boat reference (if scene includes boat and we have a reference)
    if scene_has_boat and boat_b64:
        parts.append({
            "text": (
                "OBJECT REFERENCE — THE BOAT. This is the EXACT boat that must appear in the scene. "
                "Keep the SAME blue hull, SAME red stripe on the hull and sail, SAME outboard motor, "
                "SAME wooden construction. The boat must look identical every time it appears:"
            )
        })
        parts.append({"inlineData": {"mimeType": "image/png", "data": boat_b64}})

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

async def generate_boat_reference(
    session: aiohttp.ClientSession, output_path: Path
) -> "Path | None":
    """Generate the boat reference image."""
    full_prompt = f"{BOAT_HERO['description']} {BASE_STYLE}"
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"

    parts = [{"text": full_prompt}]

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }

    print(f"  [boat] Generating {output_path.name}...")

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
                                print(f"  [boat] Saved ({size_kb:.0f} KB) -> {output_path}")
                                return output_path
                    print(f"  [boat] No image data in response")
                    return None
                elif response.status == 429:
                    wait = BACKOFF_BASE * (2 ** attempt)
                    print(f"  [boat] Rate limited. Waiting {wait}s...")
                    await asyncio.sleep(wait)
                    continue
                else:
                    text = await response.text()
                    print(f"  [boat] API error {response.status}: {text[:300]}")
                    if attempt < MAX_RETRIES - 1:
                        wait = BACKOFF_BASE * (2 ** attempt)
                        await asyncio.sleep(wait)
                    continue
        except Exception as e:
            print(f"  [boat] Request error: {e}")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(BACKOFF_BASE)
            continue
    return None


async def generate_dad_hero(
    session: aiohttp.ClientSession, output_path: Path
) -> "Path | None":
    """Generate the Dad hero reference image with eye-style and skin tone injection from Kai."""
    full_prompt = f"{DAD_HERO['description']} {BASE_STYLE}"
    url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"

    hero_path = OUTPUT_DIR / "hero_reference.png"

    parts = []

    # Inject Kai as skin tone reference
    if hero_path.exists():
        kai_b64 = base64.b64encode(hero_path.read_bytes()).decode("utf-8")
        parts.append({
            "text": (
                "SKIN TONE REFERENCE — This is the son character (Kai). "
                "The Dad character you are about to generate MUST have the EXACT SAME "
                "skin tone darkness as this boy. They are father and son — same skin colour. "
                "Match his skin EXACTLY:"
            )
        })
        parts.append({"inlineData": {"mimeType": "image/png", "data": kai_b64}})
        print(f"  [dad_hero] Using Kai hero as skin tone reference")

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
                f"the SAME tiny solid black dot eye style AND the SAME skin tone as the references above. "
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

    print(f"  [dad_hero] Generating {output_path.name}...")

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
                                print(f"  [dad_hero] Saved ({size_kb:.0f} KB) -> {output_path}")
                                return output_path
                    print(f"  [dad_hero] No image data in response")
                    return None
                elif response.status == 429:
                    wait = BACKOFF_BASE * (2 ** attempt)
                    print(f"  [dad_hero] Rate limited. Waiting {wait}s...")
                    await asyncio.sleep(wait)
                    continue
                else:
                    text = await response.text()
                    print(f"  [dad_hero] API error {response.status}: {text[:300]}")
                    if attempt < MAX_RETRIES - 1:
                        wait = BACKOFF_BASE * (2 ** attempt)
                        await asyncio.sleep(wait)
                    continue
        except Exception as e:
            print(f"  [dad_hero] Request error: {e}")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(BACKOFF_BASE)
            continue
    return None


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
    dad_hero_path = OUTPUT_DIR / "dad_reference.png"
    boat_path = OUTPUT_DIR / "boat_reference.png"

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

        # Generate Kai hero reference
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

        # Generate Dad hero reference
        if mode in ("all", "dad"):
            if not dad_hero_path.exists() or mode == "dad":
                result = await generate_dad_hero(session, dad_hero_path)
                if not result:
                    print("FATAL: Could not generate Dad hero.")
                    sys.exit(1)
                await asyncio.sleep(REQUEST_DELAY)

        if mode == "dad":
            print(f"\nDad hero saved to: {dad_hero_path}")
            print("Review the Dad hero image before running scenes.")
            return

        # Generate boat reference
        if mode in ("all", "boat"):
            if not boat_path.exists() or mode == "boat":
                result = await generate_boat_reference(session, boat_path)
                if not result:
                    print("FATAL: Could not generate boat reference.")
                    sys.exit(1)
                await asyncio.sleep(REQUEST_DELAY)

        if mode == "boat":
            print(f"\nBoat reference saved to: {boat_path}")
            print("Review the boat image before running scenes.")
            return

        # Step 2: Load hero, dad, and eye references
        if not hero_path.exists():
            print("ERROR: Hero reference not found. Run with 'hero' first.")
            sys.exit(1)

        hero_b64 = base64.b64encode(hero_path.read_bytes()).decode("utf-8")
        dad_b64 = None
        if dad_hero_path.exists():
            dad_b64 = base64.b64encode(dad_hero_path.read_bytes()).decode("utf-8")
        boat_b64 = None
        if boat_path.exists():
            boat_b64 = base64.b64encode(boat_path.read_bytes()).decode("utf-8")
        eye_ref_b64 = None
        if EYE_REF_PATH.exists():
            eye_ref_b64 = base64.b64encode(EYE_REF_PATH.read_bytes()).decode("utf-8")
            print(f"\n  Loaded: hero ({len(hero_b64)//1024}KB)"
                  f"{f', dad ({len(dad_b64)//1024}KB)' if dad_b64 else ''}"
                  f"{f', boat ({len(boat_b64)//1024}KB)' if boat_b64 else ''}"
                  f", eye ref ({len(eye_ref_b64)//1024}KB)")
        else:
            print(f"\n  Loaded: hero ({len(hero_b64)//1024}KB) — WARNING: no eye ref!")

        # Determine which scenes to generate
        if mode.startswith("page") or mode == "cover":
            # Single scene mode: e.g. "page1", "page5", "cover"
            scene_names = [mode]
        elif mode == "scenes":
            scene_names = [s["name"] for s in SCENES]
        elif mode == "all":
            scene_names = [s["name"] for s in SCENES]
        else:
            print(f"Unknown mode: {mode}")
            print("Usage: hero | dad | scenes | cover | page1..page8 | all")
            sys.exit(1)

        # Generate requested scenes
        generated = []
        failed = []

        for scene in SCENES:
            if scene["name"] not in scene_names:
                continue

            output_path = OUTPUT_DIR / f"{scene['name']}.png"

            if output_path.exists() and mode not in (scene["name"],):
                print(f"  [{scene['name']}] Already exists, skipping")
                generated.append(scene['name'])
                continue

            # Delete existing if regenerating a specific scene
            if output_path.exists():
                output_path.unlink()
                print(f"  [{scene['name']}] Deleted old image")

            print(f"  [{scene['name']}] Generating...")
            image_bytes = await generate_scene_image(
                session, hero_b64, eye_ref_b64, scene,
                dad_b64=dad_b64, boat_b64=boat_b64,
            )

            if image_bytes:
                output_path.write_bytes(image_bytes)
                size_kb = len(image_bytes) / 1024
                print(f"  [{scene['name']}] Saved ({size_kb:.0f} KB)")
                generated.append(scene['name'])
            else:
                print(f"  [{scene['name']}] FAILED")
                failed.append(scene['name'])

            await asyncio.sleep(REQUEST_DELAY)

        total = len(scene_names)
        print(f"\n{'='*60}")
        print(f"Generated {len(generated)}/{total} images for L3.5")
        if failed:
            print(f"FAILED: {', '.join(failed)}")
            print("Re-run with the scene name to retry (e.g. 'page5').")
        else:
            print("All requested images generated successfully!")
        print(f"Output folder: {OUTPUT_DIR}")


if __name__ == "__main__":
    asyncio.run(main())
