"""
Generate illustrations for pilot books using Google Gemini 2.5 Flash Image.

HERO INJECTION PIPELINE (character consistency):
  1. Generate hero reference image (text-to-image via gemini-2.5-flash-image)
  2. Convert hero to base64 for inline data
  3. For each scene, send hero image + scene prompt to gemini-2.5-flash-image
  4. The model uses the hero as a visual reference for character appearance

Usage:
    python generate_gemini_images.py              # Generate all 6 books
    python generate_gemini_images.py test          # Test with 1 image
    python generate_gemini_images.py L1            # Generate 1 specific level
    python generate_gemini_images.py L1 hero       # Regenerate hero only
"""

import asyncio
import aiohttp
import os
import base64
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.environ.get("GOOGLE_GEMINI_API_KEY")
BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
OUTPUT_DIR = Path(__file__).parent.parent / "output" / "images"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ─── Image backend: direct Gemini key, else Vertex AI ────────────
# The .env Gemini key is billing-dead — it answers 401/403 on every image
# request.  Vertex AI serves the same model (gemini-2.5-flash-image) against
# the gcloud OAuth token, so we fall back to it automatically and stay there
# for the rest of the run.  Force one or the other with
# MPB_IMAGE_BACKEND=vertex|gemini.  Vertex needs: gcloud auth login, and a
# billing-enabled default project (gcloud config set project ...).
VERTEX_REGION = "us-central1"
VERTEX_MODEL = "gemini-2.5-flash-image"
_backend = os.environ.get("MPB_IMAGE_BACKEND", "").strip().lower()
USE_VERTEX = _backend == "vertex" or (_backend != "gemini" and not GEMINI_API_KEY)
_vertex_auth_cache: dict[str, str] = {}


def vertex_auth() -> tuple[str, str]:
    """(access token, project id) from the local gcloud login."""
    if _vertex_auth_cache:
        return _vertex_auth_cache["tok"], _vertex_auth_cache["proj"]
    import subprocess
    def _gcloud(*args: str) -> str:
        return subprocess.run(["gcloud", *args], capture_output=True,
                              text=True, shell=True).stdout.strip()
    tok = _gcloud("auth", "print-access-token")
    proj = _gcloud("config", "get-value", "project")
    if not tok or not proj:
        raise RuntimeError("Vertex fallback needs gcloud: run `gcloud auth login` "
                           "and `gcloud config set project <billing-enabled-project>`")
    _vertex_auth_cache.update(tok=tok, proj=proj)
    return tok, proj


def image_endpoint() -> tuple[str, dict[str, str]]:
    """(url, extra headers) for the image model on the active backend."""
    if USE_VERTEX:
        tok, proj = vertex_auth()
        url = (f"https://{VERTEX_REGION}-aiplatform.googleapis.com/v1/projects/{proj}"
               f"/locations/{VERTEX_REGION}/publishers/google/models/"
               f"{VERTEX_MODEL}:generateContent")
        return url, {"Authorization": f"Bearer {tok}"}
    return (f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent"
            f"?key={GEMINI_API_KEY}"), {}


def switch_to_vertex(status: int) -> bool:
    """Flip to Vertex after an auth failure on the direct key. True if flipped."""
    global USE_VERTEX
    if USE_VERTEX or status not in (401, 403):
        return False
    USE_VERTEX = True
    print(f"    Gemini key rejected ({status}) — switching to Vertex AI for the rest of this run")
    return True

# ─── Old id -> journey (8-level) id ──────────────────────────────
# SCENE_PROMPTS / HERO_PROMPTS are still keyed by each book's ORIGINAL id
# ("2.2" = Hot Food, Cool Moon), but output/images/ was renamed to JOURNEY
# numbering on 2026-07-15 — "2.2" now lives in L4_2_B1, while L2_2_B1 belongs
# to a completely different book (Run, Pup, Run).  Writing to L{old_id}_B1
# therefore overwrites the WRONG book's art: that is exactly what happened on
# 2026-07-22, when this book's night-market pages landed on Run, Pup, Run and
# had to be restored from a backup.  Always resolve the folder through here.
# Mirrors NEW_TO_OLD in generate_pilot_books.py (inverted).
OLD_TO_NEW = {
    "1.1": "1.1", "1.2": "1.2",
    "1.4": "2.1", "1.5": "2.2", "1.6": "2.3", "1.7": "2.4", "1.8": "2.5",
    "1.3": "3.1", "1.9": "3.2", "1.10": "3.3",
    "2.1": "4.1", "2.2": "4.2", "2.3": "4.3", "2.4": "4.4", "2.5": "4.5", "2.6": "4.6",
    "3.1": "5.1", "3.2": "5.2", "3.3": "5.3", "3.4": "5.4", "3.5": "5.5",
    "4.1": "6.1", "4.2": "6.2", "4.3": "6.3", "4.4": "6.4",
    "5.1": "7.1", "5.2": "7.2", "5.3": "7.3", "5.4": "7.4",
    "6.1": "8.1", "6.2": "8.2", "6.3": "8.3", "6.4": "8.4",
}


def book_dir_for(level) -> Path:
    """Image folder for a SCENE_PROMPTS key, in JOURNEY numbering."""
    journey_id = OLD_TO_NEW.get(str(level), str(level))
    return OUTPUT_DIR / f"L{journey_id.replace('.', '_')}_B1"

# Rate limiting
REQUEST_DELAY = 3  # seconds between requests
MAX_RETRIES = 3
BACKOFF_BASE = 5  # seconds for exponential backoff


# ─── Style & Characters ─────────────────────────────────────────

BASE_STYLE = (
    "Whimsical children's book illustration. Hand-drawn cartoon style with "
    "soft watercolour textured backgrounds and clean black-outlined characters. "
    "CRITICAL EYE RULE: Every character (human, animal, everyone) MUST have eyes that are "
    "tiny solid black filled circles like dots drawn with a black marker pen. "
    "NO white around the black, NO iris, NO pupil, NO highlight, NO detail whatsoever. "
    "Just small simple black dots - cute and friendly like a teddy bear's eyes. "
    "Warm, friendly, inviting. Soft pastel backgrounds with pops of bright colour. "
    "Simple rounded shapes, gentle lighting. Professional picture book quality. "
    "No text, words, letters, or numbers in the image. "
    "NO GLOW: characters sit directly on the background with a clean outline. NO "
    "coloured haze, halo, aura, glow, mist or soft cloud of colour around any "
    "character or object, and no drop shadow ringing them. (Added 2026-07-27 — "
    "a pale blue cloud kept appearing around the boy in L7.4.) "
    "FULL BLEED: the artwork fills the whole square edge to edge. NO border, NO "
    "frame, NO cream or white margin, NO rounded corners, NO painted-panel edge, "
    "NO vignette. (Added 2026-07-27 — some pages were coming back inside a cream "
    "rounded panel while their neighbours were edge-to-edge, so a single book "
    "mixed two framings.) "
    "MODEST DRESS - every character in every picture, adults and children, boys and girls: "
    "knees and shoulders are always covered. NO shorts, NO short skirts, NO sleeveless tops, "
    "NO low necklines, NO bare midriffs, NO swimwear. Boys wear full-length trousers; girls wear "
    "full-length trousers, or a skirt or dress that covers the knee, and sleeves at least to the elbow. "
    "Necklines are high and modest. This holds in hot weather, at the beach, at play and in sport - "
    "dress the character modestly anyway. If an outfit description mentions shorts or a sleeveless "
    "top, draw full-length trousers and sleeves instead. "
    "HOUSE VALUES - nothing in the picture may contradict Islamic values, in the foreground or "
    "the background: NO pork, bacon, ham or pig meat and no pigs; NO alcohol of any kind - no wine, "
    "beer or spirits, no bottles, glasses, barrels, bars or pubs, not even on a distant shelf or "
    "market stall; NO idols, religious statues, shrines or figures made for worship, and no "
    "devotional imagery of any faith; NO gambling, betting or cards; NO Halloween, Christmas or "
    "Easter imagery and no birthday parties (no cake with candles, party hats or wrapped "
    "birthday presents). AVOID FESTIVAL SCENES GENERALLY, religious festivals of every faith "
    "included - unless the scene explicitly describes a festival, draw ordinary everyday life. "
    "(Ordinary religious life is not a festival and is welcome in the background: a hijab, a "
    "prayer mat, a mosque along the street.) NO romantic contact and no physical contact between adult men and women who "
    "are not family; NO nudity or bathing scenes; NEVER depict a prophet. Mosques, prayer mats, "
    "hijabs, Ramadan and Eid are welcome, drawn with warmth and dignity. "
    "ANIMALS ARE REAL ANIMALS: they stand and move as their species does, never on two legs like "
    "a person, never in clothes, never talking or gesturing. Dogs are fine to draw. NOTHING "
    "MAGICAL: no sparkles, glows, floating objects, fairies or genies - everything happens for an "
    "ordinary physical reason."
)

# Detailed character descriptions for hero image generation (text-to-image)
HERO_PROMPTS = {
    1: {
        # CHAR-A: British-Asian girl (casual home) - suits indoor fish/tank story
        "description": (
            "A cartoon girl character, about 5 years old, with warm brown skin and "
            "long straight black hair in two low bunches. She wears a soft pink t-shirt "
            "with a small flower print, comfortable blue joggers, and purple fluffy slippers. "
            "She has small friendly dot eyes, solid black, tiny and cute like a teddy bear - not too big, "
            "a cheerful smile, and rosy cheeks. Standing in a neutral pose, "
            "facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the girl in the pink t-shirt and purple slippers",
    },
    "1.1": {
        # CHAR-B: White British boy (casual home) - suits indoor tap/cat story (SATPIN)
        "description": (
            "A cartoon boy character, about 5 years old, with light skin and short sandy brown hair "
            "with a side parting. He wears a green striped t-shirt, comfortable navy blue joggers, and cosy socks. "
            "He has small friendly dot eyes, solid black, tiny and cute like a teddy bear - not too big, "
            "a friendly grin, and freckles. Standing in a neutral pose, "
            "facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light cream solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the boy in the green striped t-shirt with freckles",
    },
    "1.2": {
        # CHAR-D: British-Asian girl (outdoor adventure) - suits muddy dog story
        "description": (
            "A cartoon girl character, about 5 years old, with dark brown skin and short curly black hair. "
            "She wears a bright red jumper, dark blue denim dungarees, and blue wellies (wellington boots). "
            "She has small friendly dot eyes, solid black, tiny and cute like a teddy bear - not too big, "
            "a cheerful smile, and rosy cheeks. Standing in a neutral pose, "
            "facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light green solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the girl in the red jumper and blue dungarees with wellies",
    },
    2: {
        "description": (
            "A cartoon girl character, about 6 years old, with warm brown skin and "
            "a soft lilac hijab. She wears a bright yellow raincoat over a purple dress, "
            "and red wellies. She has tiny black dot eyes with NO white parts "
            "(no detailed irises or highlights), and a curious smile. "
            "Standing in a neutral pose, facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the girl in the yellow raincoat and lilac hijab",
    },
    3: {
        "description": (
            "A cartoon boy character, about 7 years old, with light skin, freckles, "
            "and messy blond hair poking out from under a green cycling helmet. "
            "He wears a green cycling jersey with a white stripe, black shorts, and white trainers. "
            "He has small friendly dot eyes, solid black, tiny and cute like a teddy bear - not too big, "
            "and an excited grin. Standing in a neutral pose, facing the viewer, "
            "full body visible from head to toe. Arms slightly away from body, feet shoulder-width apart. "
            "Plain light solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the boy in the green cycling jersey and helmet",
    },
    4: {
        "description": (
            "A cartoon girl character, about 7 years old, with olive skin and "
            "long dark brown hair in a thick plait over one shoulder. "
            "She wears an orange hoodie, dark grey leggings, and brown muddy boots. "
            "She has small friendly dot eyes, solid black, tiny and cute like a teddy bear - not too big, "
            "and a determined expression. Standing in a neutral pose, facing the viewer, "
            "full body visible from head to toe. Arms slightly away from body, feet shoulder-width apart. "
            "Plain light solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the girl in the orange hoodie with the plait",
    },
    5: {
        "description": (
            "A cartoon boy character, about 8 years old, with light brown skin and "
            "short curly brown hair. He wears a blue fleece jacket over a white t-shirt, "
            "khaki trousers, and brown walking boots. He has small simple oval eyes with "
            "solid dark fill (no detailed irises or highlights), and a calm thoughtful expression. "
            "Standing in a neutral pose, facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the boy in the blue fleece",
    },
    6: {
        "description": (
            "A cartoon girl character, about 8 years old, with East Asian features and "
            "a neat black bob haircut. She wears a teal cardigan over a white blouse, "
            "a dark blue pleated skirt, white socks, black shoes, and a woven sun hat. "
            "She has small friendly dot eyes, solid black, tiny and cute like a teddy bear - not too big, "
            "and a gentle curious expression. Standing in a neutral pose, facing the viewer, "
            "full body visible from head to toe. Arms slightly away from body, feet shoulder-width apart. "
            "Plain light solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the girl in the teal cardigan and sun hat",
    },
    "1.4": {
        # CHAR-C: Black British girl (smart casual) - suits indoor sock-hunting story
        "description": (
            "A cartoon girl character, about 6 years old, with dark brown skin and natural "
            "black hair in cute afro puffs with colourful bobbles (red and yellow). "
            "She wears a bright yellow cardigan over a white t-shirt, comfortable blue jeans, "
            "and white canvas shoes. She has small friendly dot eyes, solid black, tiny and cute "
            "like a teddy bear - not too big, a bright curious expression, and rosy cheeks. "
            "Standing in a neutral pose, facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light warm yellow solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the girl in the yellow cardigan with afro puffs",
    },
    "1.5": {
        # CHAR-L: Mixed heritage boy (pet owner) - suits outdoor puppy chase story
        "description": (
            "A cartoon boy character, about 6 years old, with medium brown skin and messy dark brown curls. "
            "He wears a red hoodie, blue jeans, and white trainers. "
            "He has small friendly dot eyes, solid black, tiny and cute like a teddy bear - not too big, "
            "an excited loving expression, and rosy cheeks. Standing in a neutral pose, "
            "facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light warm green solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the boy in the red hoodie with messy brown curls",
    },
    "1.6": {
        # CHAR-K: White British girl (pet owner) - suits fox/animal story
        "description": (
            "A cartoon girl character, about 6 years old, with light skin, long ginger hair "
            "in a single plait over one shoulder, and freckles on her cheeks. "
            "She wears a teal hoodie, dark grey leggings, and green trainers. "
            "She has small friendly dot eyes, solid black, tiny and cute like a teddy bear - not too big, "
            "a caring gentle expression, and rosy cheeks. Standing in a neutral pose, "
            "facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light warm peach solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the girl in the teal hoodie with ginger plait and freckles",
    },
    "1.7": {
        # Custom: Boy in white thobe at a Middle Eastern / North African market
        "description": (
            "A cartoon boy character, about 6 years old, with warm brown skin and short black hair. "
            "He wears a white thobe (long traditional dress) with a small white embroidered kufi cap. "
            "He has small friendly dot eyes, solid black, tiny and cute like a teddy bear - not too big, "
            "a cheeky happy expression, and rosy cheeks. Standing in a neutral pose, "
            "facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light warm sand solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the boy in the white thobe and kufi cap",
    },
    "1.8": {
        # Custom: Child in warm clothes at a Himalayan mountain village
        "description": (
            "A cartoon child character, about 6 years old, with warm tan skin and straight black hair "
            "in a short bob with a colourful woven headband (red and orange stripes). "
            "The child wears a thick maroon woolly jumper, brown trousers, and sturdy brown boots, "
            "with a bright orange scarf wrapped around the neck. "
            "The child has small friendly dot eyes, solid black, tiny and cute like a teddy bear - not too big, "
            "a warm curious expression, and rosy cheeks. Standing in a neutral pose, "
            "facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light warm cream solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the child in the maroon jumper with orange scarf and woven headband",
    },
    "1.9": {
        # Custom: Child in colourful kurta in a South Asian kitchen
        "description": (
            "A cartoon child character, about 6 years old, with warm brown skin and black hair, "
            "neatly parted to one side. "
            "The child wears a bright turquoise kurta (tunic) with gold trim at the neckline, "
            "comfortable white cotton trousers, and brown leather sandals. "
            "The child has small friendly dot eyes, solid black, tiny and cute like a teddy bear - not too big, "
            "an eager helpful expression, and rosy cheeks. Standing in a neutral pose, "
            "facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light warm peach solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the child in the turquoise kurta with gold trim",
    },
    "1.10": {
        # Custom: Caribbean child in tropical garden
        "description": (
            "A cartoon child character, about 6 years old, with dark brown skin and short natural "
            "black hair in small twists. "
            "The child wears a bright yellow sundress with small white flower print, "
            "dark navy blue leggings underneath the dress covering the legs fully, "
            "and colourful beaded sandals. "
            "The child has small friendly dot eyes, solid black, tiny and cute like a teddy bear - not too big, "
            "a joyful beaming expression, and rosy cheeks. Standing in a neutral pose, "
            "facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light warm sky blue solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the child in the yellow sundress with navy leggings and natural hair twists",
    },
    # ─── Level 2-6 Sub-level Hero Prompts ─────────────────────────
    "2.1": {
        # Japanese garden night lantern story — Japanese girl in pink yukata
        "description": (
            "A cartoon girl character, about 5-6 years old, Japanese, with warm light tan skin "
            "and shiny black hair styled in two odango buns (round buns on top of head) with soft pink ribbons. "
            "She wears a soft pink yukata (traditional Japanese summer robe) with a delicate white cherry blossom flower pattern, "
            "tied with a darker pink obi (wide sash) around her waist. Simple wooden geta sandals on her feet. "
            "She has small friendly dot eyes, solid black, tiny and cute like a teddy bear - not too big, "
            "a gentle curious expression, and rosy cheeks. Standing in a neutral pose, "
            "facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light warm cream solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the Japanese girl in the pink yukata with odango buns and pink ribbons",
    },
    "2.2": {
        # "Hot Food, Cool Moon" — white English girl in hijab (revert family),
        # UK street-food night market. Re-set 2026-07-22 (was zoo girl).
        "description": (
            "A cartoon girl character, about 5 years old, with light peachy skin "
            "(#F0D0B0 — white English). "
            "She wears a soft pink hijab (headscarf neatly framing her face, no hair visible), "
            "a mustard-yellow long-sleeved tunic top, navy blue trousers, "
            "and white trainers. "
            "ABSOLUTELY CRITICAL — HER EYES MUST BE TINY SOLID BLACK FILLED CIRCLES. "
            "Just two small black dots on the face like a teddy bear or ragdoll. "
            "There must be ZERO white in or around the eyes. NO pupils, NO iris, NO sclera, "
            "NO shine, NO highlights. Just plain tiny black filled dots. "
            "She has a cheerful excited expression. "
            "ABSOLUTELY NO rosy cheeks, NO blush marks. Standing in a neutral pose, "
            "facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light warm cream solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the girl in the soft pink hijab and mustard-yellow top",
    },
    "2.3": {
        # Kenyan highlands farm boy — journey story
        "description": (
            "A BLACK-SKINNED cartoon boy character, about 5 years old. "
            "His entire body — face, arms, hands, legs — is coloured with very dark black-brown paint (#1C110A). "
            "He has the darkest possible African skin. His skin is nearly the same shade as his black hair. "
            "Do NOT lighten his skin. Do NOT use medium brown. His skin must be DARK DARK DARK. "
            "ZERO rosy cheeks. ZERO blushing. ZERO pink anywhere on the face. Just dark brown skin. "
            "He has a closely shaved head (buzz cut) — very short black hair. "
            "He wears a bright orange t-shirt, dark blue trousers, and dusty brown boots. "
            "He has a colourful woven bracelet on one wrist. "
            "ABSOLUTELY CRITICAL — HIS EYES MUST BE TINY SOLID BLACK FILLED CIRCLES. "
            "Just two small black dots on the face like a gingerbread man. "
            "There must be ABSOLUTELY ZERO white in or around the eyes. NO white sclera. "
            "NO pupils, NO iris, NO shine, NO highlights. Just plain tiny solid black filled dots. "
            "He has a big cheerful smile. Standing in a neutral pose, "
            "facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light warm cream solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the boy in the orange t-shirt with the woven bracelet",
    },
    "2.4": {
        # Fair boy — air/ir story at a British village fair
        "description": (
            "A cartoon boy character, about 5-6 years old, mixed heritage with warm medium brown skin and "
            "curly dark brown hair that is a bit messy and wild. "
            "He wears a bright orange zip-up jacket with a small yellow lightning bolt on the chest, "
            "dark green cargo trousers with big pockets, and sturdy brown lace-up boots. "
            "ABSOLUTELY CRITICAL — HIS EYES MUST BE TINY SOLID BLACK FILLED CIRCLES. "
            "Just two small black dots on the face like a teddy bear or ragdoll. "
            "There must be ZERO white in or around the eyes. NO pupils, NO iris, NO sclera, "
            "NO shine, NO highlights. Just plain tiny black filled dots. "
            "He has an excited adventurous expression and rosy cheeks. Standing in a neutral pose, "
            "facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light warm cream solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the boy in the orange jacket with lightning bolt, green cargo trousers, and brown boots",
    },
    "2.5": {
        # Icelandic boy (Reykjavik winter) — lopapeysa sweater, snowy setting
        "description": (
            "A cartoon boy character, about 5 years old, with light skin, short blond hair, "
            "rosy pink cheeks from the cold, and a small nose. "
            "He wears a cream and brown lopapeysa (Icelandic wool sweater with distinctive "
            "circular yoke pattern in cream, rust, and dark brown), thick dark navy trousers, "
            "sturdy brown snow boots with thick soles, a knitted rust-brown woolly hat with "
            "a small cream pom-pom on top, and thick brown wool mittens. "
            "ABSOLUTELY CRITICAL — HIS EYES MUST BE TINY SOLID BLACK FILLED CIRCLES. "
            "Just two small black dots on the face like a teddy bear or ragdoll. "
            "There must be ZERO white in or around the eyes. NO pupils, NO iris, NO sclera, "
            "NO shine, NO highlights. Just plain tiny black filled dots. "
            "He has a cheerful smile and rosy cheeks. Standing in a neutral pose, "
            "facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light cool grey solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the boy in the cream lopapeysa sweater and rust-brown woolly hat",
    },
    "2.6": {
        # Moroccan night market girl — L2 review story
        "description": (
            "A cartoon girl character, about 5 years old, with warm brown skin and "
            "dark curly hair with a bright orange headband. "
            "She wears a turquoise tunic with gold trim over dark navy leggings, "
            "and yellow babouche slippers. "
            "She has small friendly dot eyes, solid black, tiny and cute like a teddy bear - not too big, "
            "a big cheerful smile. Standing in a neutral pose, "
            "facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light warm cream solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the girl in the turquoise tunic with orange headband",
    },
    "3.2": {
        # Contemporary Casablanca apartment — Moroccan girl with stone flute
        "description": (
            "A cartoon girl character, about 6 years old, with olive/light brown skin and "
            "dark brown curly hair in a loose ponytail. She wears a coral pink t-shirt, "
            "comfortable dark navy leggings, and soft brown house slippers. "
            "She has small friendly dot eyes, solid black, tiny and cute like a teddy bear - not too big, "
            "a warm curious smile, and rosy cheeks. Standing in a neutral pose, "
            "facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light warm cream solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the girl with olive skin, dark curly ponytail, coral pink t-shirt and dark leggings",
    },
    "3.1": {
        # French countryside bike race — brown-haired child in cycling gear
        "description": (
            "A cartoon boy character, about 7 years old, with light olive skin and "
            "brown wavy hair poking out from under a white cycling helmet with a green stripe. "
            "He wears a bright green cycling jersey with a white number '9' on the front, "
            "black cycling shorts, white socks, and white trainers. "
            "He has small friendly dot eyes, solid black, tiny and cute like a teddy bear - not too big, "
            "a determined excited grin, and freckles on his cheeks. Standing in a neutral pose, "
            "facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light warm cream solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the boy in the green cycling jersey and white helmet",
    },
    "4.1": {
        # Istanbul neighbourhood — Turkish girl in purple jumper (The Purple Purse)
        "description": (
            "A cartoon girl character, about 7 years old, with light olive skin and "
            "dark brown wavy hair tied in a ponytail. "
            "She wears a purple jumper with a small gold star pattern, a light blue zip-up jacket "
            "over the top, dark navy jeans, and white trainers. "
            "She has small friendly dot eyes, solid black, tiny and cute like a teddy bear - not too big, "
            "a warm determined expression, and rosy cheeks. Standing in a neutral pose, "
            "facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light warm cream solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the girl in the purple jumper with gold stars and light blue jacket",
    },
    "4.2": {
        # British woodland at dusk — mixed-race girl in navy duffle coat (The Brown Owl)
        "description": (
            "A cartoon girl character, about 6 years old, with medium brown skin and "
            "curly dark brown hair in two puffs tied with navy blue hair bobbles. "
            "She wears a navy blue duffle coat with wooden toggle buttons, dark grey "
            "joggers, and brown lace-up boots. "
            "She has small friendly dot eyes, solid black, tiny and cute like a teddy bear - not too big, "
            "a friendly cheerful expression and rosy cheeks. Standing in a neutral pose, "
            "facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light grey solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the girl with curly dark brown hair puffs in the navy blue duffle coat",
    },
    "4.3": {
        # Oaxaca modern home — Mexican girl in yellow t-shirt and dungarees (The New Glue)
        "description": (
            "A cartoon girl character, about 7 years old, with medium brown skin and "
            "long straight dark hair in two braids. Round face, rosy cheeks. "
            "She wears a yellow t-shirt and blue denim dungarees with silver buckles, "
            "and white trainers. "
            "She has small friendly dot eyes, solid black, tiny and cute like a teddy bear - not too big, "
            "a cheerful mischievous expression. Standing in a neutral pose, "
            "facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light warm cream solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the girl with braids in yellow t-shirt and blue dungarees",
    },
    "4.4": {
        # Malaysian boy at Masjid Putra — How Now?
        "description": (
            "Whimsical children's book illustration of a Malaysian boy character. "
            "About 5 years old, with warm medium brown skin and short neat black hair. "
            "Round friendly face with rosy cheeks and a cheerful smile. "
            "He wears a bright orange cotton t-shirt, blue knee-length shorts, "
            "and simple brown sandals. "
            "Detailed, warm illustration style with soft shading and clean outlines. "
            "He has small friendly dot eyes, solid black, tiny and cute — NO white, NO detail. "
            "Standing in a neutral pose, facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "The character should look like he belongs in a watercolour storybook scene. "
            "Plain light warm cream solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the boy in the orange t-shirt and blue shorts",
    },
    "5.1": {
        # North London Orthodox Jewish boy — "Before the Shore" flashback memory story
        "description": (
            "A cartoon boy character, about 5 years old, with light olive skin and "
            "short dark brown hair on top, with distinctive long curled payot (Jewish side curls) "
            "hanging in front of each ear. He wears a small dark navy kippah (skullcap) on top of his head, "
            "a white button-up collared shirt tucked into dark navy trousers, "
            "and black leather shoes. "
            "He has small friendly dot eyes, solid black, tiny and cute like a teddy bear - not too big, "
            "a warm gentle expression with a slight smile. Standing in a neutral pose, "
            "facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light warm cream solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the Orthodox Jewish boy in the white shirt and kippah with payot",
    },
    "5.2": {
        # Swedish girl — "Near the Door" (Stockholm winter, fox discovery)
        "description": (
            "A cartoon girl character, about 5 years old, with light skin and rosy pink cheeks. "
            "Long straight blonde hair styled in two neat braids that fall over her shoulders. "
            "Bright blue eyes that are small friendly dots, solid black, tiny and cute like a teddy bear. "
            "She wears a cosy hand-knitted red wool jumper with a subtle cable-knit pattern, "
            "dark blue jeans, and thick grey woolly socks. "
            "A warm, curious expression with a slight smile. Standing in a neutral pose, "
            "facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light cool grey solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the Swedish girl with blonde braids in the red jumper",
    },
    "6.1": {
        # English country garden — East Asian girl in blue cardigan
        "description": (
            "A cartoon girl character, about 8 years old, with East Asian features and "
            "long straight black hair in a neat plait down her back with a small blue ribbon. "
            "She wears a light blue cardigan over a white blouse with a peter pan collar, "
            "a dark blue pleated skirt, white tights, and black Mary Jane shoes. "
            "She carries a small brown satchel bag across one shoulder. "
            "She has small friendly dot eyes, solid black, tiny and cute like a teddy bear - not too big, "
            "a gentle curious expression with a slight smile. Standing in a neutral pose, "
            "facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light warm green solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the girl in the blue cardigan with black plait and brown satchel",
    },
    "5.3": {
        # Jaipur Indian girl — "Sure She Can!" kite-making story (Makar Sankranti)
        "description": (
            "A cartoon girl character, about 6 years old, with medium-dark South Asian skin (#8B6B4A) "
            "and dark black hair (#0D0D0D) in two neat braids hanging over her shoulders, "
            "each tied with a small bright yellow ribbon at the end. "
            "She wears a bright yellow kurta (traditional long top reaching below the knee) "
            "with matching bright yellow salwar (loose gathered trousers) and simple flat sandals. "
            # Emphatic wording 2026-07-27 — the mild version lost on the Dadaji
            # reference and shipped white sclera to all 8 pages.
            "ABSOLUTELY CRITICAL EYE RULE: her eyes are two TINY SOLID BLACK filled ovals, "
            "like dots made with a black marker pen. ZERO white, NO sclera, NO eyeball, "
            "NO pupil, NO iris, NO highlight, NO catchlight. Just two small solid black "
            "dots, exactly like a teddy bear's. "
            "She has a warm bright smile and an animated expressive face. "
            "Standing in a neutral pose, facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light warm cream solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the Indian girl in the bright yellow kurta and salwar with black braids and yellow ribbons",
    },
    "5.4": {
        # Visiting British boy — "A Place for Me" Cartagena market story
        "description": (
            "A cartoon boy character, about 6 years old, with light skin (#F0D0B0) and "
            "short straight brown hair with a side parting. "
            "He wears a bright blue t-shirt, khaki/beige long chino trousers that reach "
            "all the way to his ankles (FULL LENGTH, NOT shorts, NOT capris, NOT "
            "three-quarter length — the trousers go to his shoes), and white trainers. "
            "He has small friendly dot eyes, solid black, tiny and cute like a teddy bear - not too big, "
            "a gentle smile, and a curious open face. "
            "Standing in a neutral pose, facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light warm cream solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the British boy in the blue t-shirt and long khaki chinos with straight brown hair",
    },
}

# ─── Side Character Hero Prompts (secondary characters needing consistency) ───

SIDE_HERO_PROMPTS = {
    "1.7": {
        # Dad: adult man in white thobe at the market
        "description": (
            "A cartoon adult man character, about 35 years old, warm brown skin, "
            "short black hair with a neatly trimmed short beard. "
            "He wears a long white thobe (traditional ankle-length garment) and a white head covering "
            "(ghutra/keffiyeh). He has a warm, proud, fatherly expression. "
            "He has small friendly dot eyes, solid black, tiny and cute like a teddy bear — not too big. "
            "Standing in a neutral pose, facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light warm sand solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the dad in the white thobe and head covering",
        "filename": "side_hero_dad.png",
    },
    "1.8": {
        # Yak: fluffy pony-sized dark brown yak
        "description": (
            "A cartoon yak character. A fluffy dark brown yak with thick shaggy fur, "
            "small curved horns, a wide friendly face, and a stubby tail. "
            "The yak is about the size of a large pony — NOT enormous, NOT cow-sized. "
            "It has a gentle, slightly dopey, loveable expression. "
            "CRITICAL: The yak MUST have eyes that are tiny solid black filled circles — "
            "just two small black dots like a teddy bear. NO white around the black at all. "
            "Standing in a neutral pose, facing the viewer, full body visible. "
            "Plain light warm cream solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the fluffy dark brown yak",
        "filename": "side_hero_yak.png",
    },
    "1.9": {
        # Grandma: grey-haired grandmother in green shalwar kameez
        "description": (
            "A cartoon grandmother character, about 65 years old, with warm brown skin "
            "and GREY hair tied in a neat low bun at the back of her head. "
            "She has a round, kind face with warm smile lines and rosy cheeks. "
            "She wears a green shalwar kameez with a colourful floral dupatta "
            "draped over her shoulders (the dupatta has bright flowers — red, pink, yellow on green). "
            "Brown leather sandals. She has a warm, loving, grandmotherly smile. "
            "She has small friendly dot eyes, solid black, tiny and cute like a teddy bear — not too big. "
            "Standing in a neutral pose, facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body. "
            "Plain light warm peach solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the grandmother in the green shalwar kameez with grey hair bun",
        "filename": "side_hero_grandma.png",
    },
    "2.2": {
        # Mum: white English revert, sage-green hijab. Re-set 2026-07-22 (was dad/zoo).
        "description": (
            "A cartoon adult woman character, about 30 years old, with light peachy skin "
            "(#F0D0B0 — white English). "
            "She wears a soft sage-green hijab (headscarf neatly framing her face, no hair "
            "visible), a long-sleeved cream cardigan over a long navy blue dress, "
            "and comfortable flat shoes. "
            "ABSOLUTELY CRITICAL — HER EYES MUST BE TINY SOLID BLACK FILLED CIRCLES. "
            "Just two small black dots on the face like a teddy bear or ragdoll. "
            "There must be ZERO white in or around the eyes. NO pupils, NO iris, NO sclera, "
            "NO shine, NO highlights. Just plain tiny black filled dots. "
            "She has a warm, kind, motherly smile. "
            "ABSOLUTELY NO rosy cheeks, NO blush marks. "
            "Standing in a neutral pose, facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body. "
            "Plain light warm cream solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the mum in the sage-green hijab and cream cardigan",
        "filename": "side_hero_mum.png",
    },
    "2.3": {
        # Dad: Kenyan farmer dad — very dark skin, green shirt, brown trousers
        "description": (
            "A cartoon adult man character, about 30 years old. "
            "A BLACK-SKINNED man. His entire body — face, arms, hands — is coloured with "
            "very dark black-brown paint (#1C110A). He has the darkest possible African skin. "
            "His skin is nearly the same shade as his black hair. "
            "Do NOT lighten his skin. Do NOT use medium brown. His skin must be DARK DARK DARK. "
            "ZERO rosy cheeks. ZERO blushing. ZERO pink anywhere on the face. "
            "He has a closely shaved head (buzz cut) — very short black hair, same as his son. "
            "He wears a simple dark green shirt, brown trousers, and dark brown wellies. "
            "ABSOLUTELY CRITICAL — HIS EYES MUST BE TINY SOLID BLACK FILLED CIRCLES. "
            "Just two small black dots on the face like a gingerbread man. "
            "There must be ABSOLUTELY ZERO white in or around the eyes. NO white sclera. "
            "NO pupils, NO iris, NO shine, NO highlights. Just plain tiny solid black filled dots. "
            "He has a warm, kind, fatherly smile. Tall and strong build. "
            "Standing in a neutral pose, facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light warm cream solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the dad in the dark green shirt and brown trousers",
        "filename": "side_hero_dad.png",
    },
    "2.5": {
        # Mum: Icelandic mother (Reykjavik winter) — blue parka, grey lopapeysa
        "description": (
            "A cartoon adult woman character, about 35 years old, with light skin and "
            "shoulder-length blonde hair tucked under a knitted dark blue woolly hat. "
            "She wears a dark blue parka jacket over a grey lopapeysa (Icelandic wool sweater "
            "with a subtle circular yoke pattern), dark trousers, black snow boots, and dark mittens. "
            "ABSOLUTELY CRITICAL — HER EYES MUST BE TINY SOLID BLACK FILLED CIRCLES. "
            "Just two small black dots on the face like a teddy bear or ragdoll. "
            "There must be ZERO white in or around the eyes. NO pupils, NO iris, NO sclera, "
            "NO shine, NO highlights. Just plain tiny black filled dots. "
            "She has a warm, kind, motherly expression with a gentle smile. "
            "She is TALL — a fully grown adult woman, much taller than a child. "
            "Standing in a neutral pose, facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light cool grey solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the mum in the dark blue parka and dark blue woolly hat",
        "filename": "side_hero_mum.png",
    },
    "4.1": {
        # Dad: modern Turkish dad for The Purple Purse
        "description": (
            "A cartoon adult man character, about 35 years old, with light olive skin "
            "and short dark brown hair. He has a short neat beard. "
            "He wears a dark charcoal casual jacket over a grey shirt, dark jeans, "
            "and dark grey trainers. "
            "He has small friendly dot eyes, solid black, tiny and cute like a teddy bear — not too big. "
            "He has a warm, kind, fatherly expression with a slight smile. "
            "Standing in a neutral pose, facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light warm cream solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the dad in the dark jacket and grey shirt",
        "filename": "side_hero_dad.png",
    },
    "4.2": {
        # Mum: mixed-race British mum for The Brown Owl
        "description": (
            "A cartoon adult woman character, about 32 years old, with medium brown skin. "
            "HAIR: Her dark brown hair is pulled back tightly into a LOW BUN at the nape of her neck. "
            "The bun is clearly visible. NO loose hair, NO hair hanging down, NO curls around the face. "
            "Hair is neat and pulled back — a practical mum hairstyle for a woodland walk. "
            "She wears a dark green parka with the hood down, black trousers, "
            "and brown walking boots. "
            "ABSOLUTELY CRITICAL EYE RULE: Eyes MUST be tiny solid black filled circles like dots "
            "drawn with a black marker pen. NO white around the black, NO iris, NO pupil, "
            "NO highlight, NO detail whatsoever. Just small simple black dots. "
            "She has a warm, kind, motherly expression with a gentle smile. "
            "She is TALL — a fully grown adult woman, much taller than a child. "
            "Standing in a neutral pose, facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light warm grey solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the mum in the dark green parka with her dark hair in a tight low bun",
        "filename": "side_hero_mum.png",
    },
    "4.3": {
        # Dad: Mexican dad for The New Glue
        "description": (
            "A cartoon adult man character, about 35 years old, with medium brown skin "
            "and short dark hair. He has a neat dark moustache. "
            "He wears a cream button-up shirt with rolled-up sleeves, dark jeans, "
            "and brown leather sandals. "
            "He has small friendly dot eyes, solid black, tiny and cute like a teddy bear — not too big. "
            "He has a warm, friendly, fatherly expression with a slight smile. "
            "He is TALL — a fully grown adult man, much taller than a child. "
            "Standing in a neutral pose, facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light warm cream solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the dad in the cream shirt with rolled sleeves and moustache",
        "filename": "side_hero_dad.png",
    },
    "4.4": {
        # Mum: Malaysian Muslim mother in niqab for How Now?
        "description": (
            "Whimsical children's book illustration of a Malaysian Muslim mother character. "
            "About 30 years old, TALL — a fully grown adult woman, much taller than a child. "
            "She wears a flowing dark green abaya (long loose elegant dress) reaching her ankles, "
            "and a black niqab (face veil) covering everything except her warm brown eyes. "
            "The abaya has gentle folds and flows gracefully. "
            "Her eyes are small friendly dots, solid black, tiny and cute — NO white, NO detail. "
            "Her eyes convey warmth and kindness. "
            "Detailed, warm illustration style with soft shading and clean outlines. "
            "The character should look like she belongs in a watercolour storybook scene. "
            "She has a dignified, warm, motherly presence. "
            "Standing in a neutral pose, facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light warm cream solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the mum in the dark green abaya and black niqab",
        "filename": "side_hero_mum.png",
    },
    "5.1_dad": {
        # Dad: Orthodox Jewish father for Before the Shore
        "description": (
            "A cartoon adult man character, about 35 years old, with light olive skin and "
            "a full dark beard. He has payot (long curled side locks) visible below his black "
            "wide-brimmed fedora hat. "
            "He wears a long black frock coat over a white shirt and dark trousers, "
            "and black shoes. "
            "He has small friendly dot eyes, solid black, tiny and cute like a teddy bear — not too big. "
            "He has a warm, gentle, fatherly expression with a slight smile. "
            "He is TALL — a fully grown adult man, much taller than a child. "
            "Standing in a neutral pose, facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light warm cream solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the Orthodox Jewish dad in the black hat and long coat with beard and payot",
        "filename": "side_hero_dad.png",
    },
    # 5.1_mum REMOVED — story revised to boy + Dad only
    "5.3_dadaji": {
        # Dadaji: elderly Indian grandfather for Sure She Can! (Jaipur kite festival)
        "description": (
            "A cartoon elderly man character, about 65-70 years old, with medium-dark South Asian "
            "skin (#8B6B4A) and short white-grey hair. He has a short neatly trimmed white beard "
            "and a warm, patient, kind expression. "
            "He wears a saffron-orange Rajasthani pagri (turban) wrapped neatly on his head, "
            "a cream/white angrakha-style kurta (crossover front, tied at side), "
            "loose white trousers, and brown leather sandals. "
            # 2026-07-27: the mild wording ("small friendly dot eyes, solid black")
            # lost every time — the reference came back with big white sclera and
            # pupils, and hero injection then propagated that to all 8 pages.
            # Emphatic phrasing is what actually holds (same wording that worked
            # on L6.3 page 7).
            "ABSOLUTELY CRITICAL EYE RULE: his eyes are two TINY SOLID BLACK "
            "filled ovals, like dots made with a black marker pen. ZERO white, "
            "NO sclera, NO eyeball, NO pupil, NO iris, NO highlight, NO catchlight, "
            "NO shine. Do NOT draw realistic or expressive eyes — just two small "
            "solid black dots, exactly like a teddy bear's. "
            "He is TALL — a fully grown adult man, much taller than a child. "
            "Standing in a neutral pose, facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light warm cream solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the elderly Indian grandfather Dadaji in cream kurta and saffron pagri turban",
        "filename": "side_hero_dadaji.png",
    },
    "5.2_dad": {
        # Dad: Swedish father for Near the Door — cosy winter sweater
        "description": (
            "A cartoon adult man character, about 35 years old, with light skin and "
            "short brown hair with a friendly, slightly stubbly face. "
            "He wears a cosy grey wool sweater with a subtle Nordic pattern at the neckline, "
            "dark navy trousers, and thick woolly socks. "
            "He has small friendly dot eyes, solid black, tiny and cute like a teddy bear — not too big. "
            "He has a warm, kind, fatherly expression with a gentle smile. "
            "He is TALL — a fully grown adult man, much taller than a child. "
            "Standing in a neutral pose, facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light cool grey solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the Swedish dad in the grey wool sweater",
        "filename": "side_hero_dad.png",
    },
    "5.2_fox": {
        # Fox: Red fox for Near the Door
        "description": (
            "A cartoon red fox character. A beautiful wild red fox with bright orange-red fur, "
            "a white chest and belly, big pointed ears with black tips, a long bushy tail with "
            "a white tip, and a narrow friendly face. "
            "CRITICAL: The fox MUST have eyes that are tiny solid black filled circles — "
            "just two small black dots like a teddy bear. NO white around the black at all. "
            "The fox sits in a calm, alert pose, facing the viewer. "
            "Full body visible from head to tail tip. "
            "Plain light snowy white solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the red fox with the bushy tail",
        "filename": "side_hero_fox.png",
    },
    "5.4": {
        # Local Colombian boy for A Place for Me (Cartagena market) — primary side hero
        "description": (
            "A cartoon boy character, about 6 years old, with warm brown skin (#B8956A) "
            "and thick curly dark brown hair (visibly curly and wavy, DIFFERENT from straight hair). "
            "He wears a bright green t-shirt, dark blue long trousers, and brown sandals. "
            "He has small friendly dot eyes, solid black, tiny and cute like a teddy bear — not too big, "
            "a warm friendly smile, round cheeks, and an expressive animated face. "
            "Standing in a neutral pose, facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light warm cream solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the Colombian boy with curly dark hair in the green t-shirt and dark blue trousers",
        "filename": "side_hero_local_boy.png",
    },
    "5.4_dad": {
        # Dad: British visitor's father for A Place for Me
        "description": (
            "A cartoon adult man character, about 35 years old, with light skin and "
            "short brown hair with a side parting, a kind friendly face. "
            "He wears a casual light-coloured short-sleeved shirt and khaki long trousers, "
            "and brown casual shoes. "
            "He has small friendly dot eyes, solid black, tiny and cute like a teddy bear — not too big. "
            "He has a warm, kind, fatherly expression with a gentle smile. "
            "He is TALL — a fully grown adult man, much taller than a child. "
            "Standing in a neutral pose, facing the viewer, full body visible from head to toe. "
            "Arms slightly away from body, feet shoulder-width apart. "
            "Plain light warm cream solid-colour background (no scenery, no objects, no patterns)."
        ),
        "short": "the British dad in the casual shirt and khaki trousers",
        "filename": "side_hero_dad.png",
    },
}
# Alias: "5.4_local_boy" is the same as "5.4" (used in scene-level side_hero_key references)
SIDE_HERO_PROMPTS["5.4_local_boy"] = SIDE_HERO_PROMPTS["5.4"]

# Emphatic eye rule for L7.4's three characters (2026-07-28).  See L7.3: the
# mild wording let a reference sheet come back with white sclera, which hero
# injection then copied onto every page.  Dedupe by id() — "5.4_local_boy" is
# an alias of "5.4" above, so the same dict would otherwise be patched twice.
_EMPHATIC_EYES = (
    " ABSOLUTELY CRITICAL EYE RULE: the eyes are two TINY SOLID BLACK filled "
    "ovals, like dots made with a black marker pen. ZERO white, NO sclera, NO "
    "eyeball, NO pupil, NO iris, NO highlight, NO catchlight. Just two small "
    "solid black dots, exactly like a teddy bear's."
)
_seen_ids = set()
for _d in (HERO_PROMPTS["5.4"],
           SIDE_HERO_PROMPTS["5.4_dad"],
           SIDE_HERO_PROMPTS["5.4"]):
    if id(_d) in _seen_ids:
        continue
    _seen_ids.add(id(_d))
    if "ABSOLUTELY CRITICAL EYE RULE" not in _d["description"]:
        _d["description"] = _d["description"] + _EMPHATIC_EYES

# ─── Object Reference Prompts (key objects needing visual consistency) ────────

OBJECT_REF_PROMPTS = {
    "3.2": {
        "description": (
            "A small smooth pale sandy-coloured stone ocarina with a rounded oval shape. "
            "Three small finger holes on top and a curved mouthpiece at one end. "
            "Subtle warm brown veins running through the pale stone surface. "
            "The ocarina is about the size of a child's hand. "
            "Simple, clean illustration of just this single object on a plain white background. "
            "No hands, no person, no other objects. "
            "Whimsical children's book illustration style, hand-drawn with clean black outlines "
            "and soft watercolour texture."
        ),
        "short": "the pale sandy stone ocarina with three finger holes",
        "filename": "object_ref_flute.png",
    },
}


# ─── Scene Prompts per Level ────────────────────────────────────

SCENE_PROMPTS = {
    1: {
        "title": "The Fish in the Tank",
        # CHARACTER: CHAR-A (British-Asian girl, indoor casual)
        # - "pink t-shirt with flower print, blue joggers, purple fluffy slippers"
        #
        # KEY OBJECTS (MUST be identical in ALL prompts):
        # - FISH: "a small bright orange goldfish with flowing fins"
        # - BAG: "a clear plastic bag filled with water, tied at the top with a red twist-tie"
        # - CUP: "a small yellow plastic cup"
        # - TANK: "a rectangular glass fish tank with clear water and small colourful pebbles at the bottom"
        "scenes": [
            {
                # Cover — girl excited with fish in tank
                "name": "cover",
                "prompt": "Show the character from the reference image holding up a clear plastic bag filled with water, tied at the top with a red twist-tie, containing a small bright orange goldfish with flowing fins, looking excited. A rectangular glass fish tank with clear water and small colourful pebbles at the bottom visible on a table nearby. Cosy indoor home setting with warm lighting. Same character, same outfit (pink t-shirt with flower print, blue joggers, purple fluffy slippers), same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Portrait orientation.",
            },
            {
                # Page 1: "I have a fish! It is in a bag."
                "name": "page1",
                "prompt": "Show the character from the reference image holding up a clear plastic bag filled with water, tied at the top with a red twist-tie, containing a small bright orange goldfish with flowing fins. The girl looks excited and happy. Cosy indoor home setting. Same character, same outfit (pink t-shirt with flower print, blue joggers, purple fluffy slippers), same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
            {
                # Page 2: "The fish is sad. The bag is not big."
                "name": "page2",
                "prompt": "Show the character from the reference image looking concerned at a clear plastic bag filled with water, tied at the top with a red twist-tie, containing a small bright orange goldfish with flowing fins that looks cramped and sad. The bag looks too small for the fish. Cosy indoor home setting. Same character, same outfit (pink t-shirt with flower print, blue joggers, purple fluffy slippers), same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
            {
                # Page 3: "I get a cup. No! It is not big."
                "name": "page3",
                "prompt": "Show the character from the reference image holding up a small yellow plastic cup in one hand, looking at it with a disappointed frown and shaking her head. The cup is clearly way too small for a fish. The clear plastic bag filled with water, tied at the top with a red twist-tie, containing the small bright orange goldfish with flowing fins sits on a small table nearby. The girl is comparing the tiny cup to the fish bag, realising the cup is not big enough. Cosy indoor home setting with warm beige walls, a beige-pink sofa in the background (NOT green, NOT teal), wooden floor. Same character, same outfit (pink t-shirt with flower print, blue joggers, purple fluffy slippers), same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
            {
                # Page 4: "I get a tank. Yes! The fish can go in!"
                "name": "page4",
                "prompt": "Show the character from the reference image standing excitedly next to a rectangular glass fish tank with clear water and small colourful pebbles at the bottom, looking happy and nodding. The girl is about to transfer the small bright orange goldfish with flowing fins from the clear plastic bag filled with water, tied at the top with a red twist-tie. Cosy indoor home setting. Same character, same outfit (pink t-shirt with flower print, blue joggers, purple fluffy slippers), same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
            {
                # Page 5: "Wish, wish! The fish is in the tank!"
                "name": "page5",
                "prompt": "Show the character from the reference image watching happily as the small bright orange goldfish with flowing fins swims freely in a rectangular glass fish tank with clear water and small colourful pebbles at the bottom. Gentle water movement. The empty plastic bag is no longer visible. Cosy indoor home setting. Same character, same outfit (pink t-shirt with flower print, blue joggers, purple fluffy slippers), same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
            {
                # Page 6: "The fish is not sad. I am happy!"
                "name": "page6",
                "prompt": "Show the character from the reference image smiling joyfully next to a rectangular glass fish tank with clear water and small colourful pebbles at the bottom, containing a happy small bright orange goldfish with flowing fins swimming contentedly. The girl looks proud and happy, with her hands together in delight. Cosy indoor home setting. Same character, same outfit (pink t-shirt with flower print, blue joggers, purple fluffy slippers), same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
        ],
    },
    "1.1": {
        "title": "Tap! Tap! Tap!",
        # CHARACTER: CHAR-B (White British boy, indoor casual - HALAL COMPLIANT)
        # - "green striped t-shirt, navy blue joggers, cosy socks"
        #
        # KEY OBJECTS (MUST be identical in ALL prompts):
        # - MAT: "a soft, cosy, rectangular rug in warm orange and cream stripes"
        # - CAT: "a fat, fluffy orange tabby cat with darker orange stripes, a round body, a fluffy tail, white paws, and tiny black dot eyes with NO white parts"
        # - SETTING: "a bright, cosy living room with wooden floorboards, soft natural light from a window with cream curtains, warm beige walls"
        "scenes": [
            {
                # Cover — boy happy with cat on mat
                "name": "cover",
                "prompt": "Show the character from the reference image sitting happily on a soft, cosy, rectangular rug in warm orange and cream stripes, patting a fat, fluffy orange tabby cat with darker orange stripes, a round body, a fluffy tail, white paws, and tiny black dot eyes with NO white parts. The boy has a delighted expression, petting the cat gently. A bright, cosy living room with wooden floorboards, soft natural light from a window with cream curtains, warm beige walls. Same character, same outfit (green striped t-shirt, navy blue joggers, cosy socks), same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Portrait orientation.",
            },
            {
                # Page 1: "I sit at a mat. Tap, tap, tap!"
                "name": "page1",
                "prompt": "Show the character from the reference image sitting cross-legged on a soft, cosy, rectangular rug in warm orange and cream stripes. The boy looks surprised and curious, head tilted, listening to a mysterious tapping sound. One hand cupping his ear, wondering where the sound is coming from. A bright, cosy living room with wooden floorboards, soft natural light from a window with cream curtains, warm beige walls. No cat visible yet - the mystery has not been solved. Same character, same outfit (green striped t-shirt, navy blue joggers, cosy socks), same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
            {
                # Page 2: "Is it a rat? Is it a bat?"
                "name": "page2",
                "prompt": "Show the character from the reference image still sitting on a soft, cosy, rectangular rug in warm orange and cream stripes, looking thoughtful with a finger on his chin. Above his head, show TWO small thought bubbles: one containing a cartoon rat, one containing a cartoon bat. The boy has a puzzled, curious expression, trying to guess what is making the tapping sound. A bright, cosy living room with wooden floorboards, soft natural light from a window with cream curtains, warm beige walls. Same character, same outfit (green striped t-shirt, navy blue joggers, cosy socks), same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
            {
                # Page 3: "It is not a rat. It is not a bat."
                "name": "page3",
                "prompt": "Show the character from the reference image standing up from a soft, cosy, rectangular rug in warm orange and cream stripes, shaking his head with a slightly frustrated but amused expression. His hands are on his hips, looking determined to solve the mystery. Above his head, show thought bubbles with a rat and bat crossed out with red X marks. A bright, cosy living room with wooden floorboards, soft natural light from a window with cream curtains, warm beige walls. Same character, same outfit (green striped t-shirt, navy blue joggers, cosy socks), same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
            {
                # Page 4: "Tap, tap! I pat at it."
                "name": "page4",
                "prompt": "Show the character from the reference image kneeling next to a closed door, reaching out with both hands to pat or touch the door where the tapping sound is coming from. The boy has an excited, curious expression, about to discover the source of the mystery. The door is fully closed - NO cat visible, NO fur visible, NO animal peeking through. The mystery is still unsolved. A bright, cosy living room with wooden floorboards, soft natural light from a window with cream curtains, warm beige walls. Same character, same outfit (green striped t-shirt, navy blue joggers, cosy socks), same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
            {
                # Page 5: "It is a cat! A fat cat!"
                "name": "page5",
                "prompt": "Show the character from the reference image with arms spread wide in delighted surprise, eyes wide with joy, mouth open in an excited wow expression. In front of him stands a fat, fluffy orange tabby cat with darker orange stripes, a round body, a fluffy tail, white paws, and tiny black dot eyes with NO white parts. The cat looks friendly and content, perhaps rubbing against the boy's legs. A bright, cosy living room with wooden floorboards, soft natural light from a window with cream curtains, warm beige walls. Same character, same outfit (green striped t-shirt, navy blue joggers, cosy socks), same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them, on BOTH the boy AND the cat. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
            {
                # Page 6: "I pat the cat. The cat naps. I am happy!"
                "name": "page6",
                "prompt": "Show the character from the reference image sitting peacefully on a soft, cosy, rectangular rug in warm orange and cream stripes, gently patting a fat, fluffy orange tabby cat with darker orange stripes, a round body, a fluffy tail, white paws, and tiny black dot eyes with NO white parts. The cat is curled up, eyes closed, napping contentedly on the rug next to the boy. The boy has a peaceful, happy, satisfied smile, looking down at the sleeping cat with affection. A bright, cosy living room with wooden floorboards, soft natural light from a window with cream curtains, warm beige walls. Same character, same outfit (green striped t-shirt, navy blue joggers, cosy socks), same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
        ],
    },
    "1.2": {
        "title": "The Mud on the Dog",
        # CHARACTER: CHAR-D (British-Asian girl, outdoor adventure - HALAL COMPLIANT)
        # - "bright red jumper, dark blue denim dungarees, blue wellies"
        #
        # KEY OBJECTS (MUST be identical in ALL prompts):
        # - DOG: "a big, fluffy golden retriever with floppy ears, a waggy tail, a black button nose and matching small black button eyes (solid black, no white)"
        # - MUD: "thick brown squelchy mud"
        # - MOP: "a yellow sponge mop with a wooden handle"
        # - TUB: "a large blue plastic tub filled with soapy water"
        # - SETTING: "a sunny garden with green grass, a muddy patch of brown earth, and a wooden fence"
        # - MUM: "the girl's mum, a warm brown-skinned woman with long black hair in a ponytail, wearing a purple apron over casual clothes"
        "scenes": [
            {
                # Cover — girl happy with clean dog
                "name": "cover",
                "prompt": "Show the character from the reference image hugging a big, fluffy golden retriever with floppy ears, a waggy tail, a black button nose and matching small black button eyes (solid black, no white). Both look happy and clean. A sunny garden with green grass and a wooden fence in the background. Same character, same outfit (bright red jumper, dark blue denim dungarees, blue wellies), same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them, on BOTH the girl AND the dog. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Portrait orientation.",
            },
            {
                # Page 1: "I got a dog. It is a big dog."
                "name": "page1",
                "prompt": "Show the character from the reference image standing proudly next to a big, fluffy golden retriever with floppy ears, a waggy tail, a black button nose and matching small black button eyes (solid black, no white). The girl has a happy, proud expression. A sunny garden with green grass and a wooden fence. The dog is clean and fluffy. Same character, same outfit (bright red jumper, dark blue denim dungarees, blue wellies), same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them, on BOTH the girl AND the dog. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
            {
                # Page 2: "The dog ran in the mud. Mud, mud, mud!"
                "name": "page2",
                "prompt": "Show a big, fluffy golden retriever with floppy ears and tiny black dot eyes with NO white parts running joyfully through thick brown squelchy mud, splashing mud everywhere. The dog looks excited and playful. The character from the reference image watches with a shocked, worried expression in the background. A sunny garden with green grass, a muddy patch of brown earth, and a wooden fence. Same character, same outfit (bright red jumper, dark blue denim dungarees, blue wellies), same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
            {
                # Page 3: "The dog is a mess! Mud is on the dog."
                "name": "page3",
                "prompt": "Show the character from the reference image looking dismayed at a big, fluffy golden retriever with small black button eyes (no white) covered in thick brown squelchy mud. The dog is dripping with mud but still looks happy with its tongue out. The girl has her hands on her cheeks in an oh no expression. A sunny garden with green grass, a muddy patch of brown earth, and a wooden fence. Same character, same outfit (bright red jumper, dark blue denim dungarees, blue wellies), same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them, on BOTH the girl AND the dog. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
            {
                # Page 4: "I get a mop. I mop the dog."
                "name": "page4",
                "prompt": "A girl scrubs a very muddy dog with a mop. The big golden retriever is COMPLETELY COVERED in thick dark brown mud from head to tail - its fur is brown and clumpy with mud, dripping wet mud everywhere. The girl pushes a yellow sponge mop flat against the dog's muddy brown back, scrubbing hard. Both her hands grip the wooden mop handle. She has a determined hopeful face. The dog sits patiently. Garden setting with green grass and wooden fence. The girl wears bright red jumper, dark blue denim dungarees, blue wellies - same character and outfit as reference image. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them, on BOTH the girl AND the dog. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
            {
                # Page 5: "No! The mop is a mess! Mud is on me!"
                "name": "page5",
                "prompt": "Show the character from the reference image standing and looking shocked, with big brown mud splatters all over her face, her bright red jumper, and her dark blue dungarees. The girl is holding the yellow sponge mop with a wooden handle which is dripping with mud. The mop has flung mud onto the girl. The girl looks dismayed with her mouth open in surprise. The big, fluffy golden retriever still covered in mud sits nearby watching the girl, looking happy with tongue out. A sunny garden with green grass and a wooden fence. Same character (bright red jumper now splattered with mud, dark blue denim dungarees now splattered with mud, blue wellies), same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
            {
                # Page 6: "Mum got a tub. The dog sat in it. No mud! No mess!"
                "name": "page6",
                "prompt": "The girl from the reference image stands next to her mum, both looking happy. The big fluffy golden retriever with small black button eyes (no white) sits in a large blue plastic tub full of soapy bubbles, now clean. The dog is large - when sitting in the tub, its head is level with the girl's chest. The girl wears bright red jumper, dark blue denim dungarees, blue wellies - same as reference. Mum has warm brown skin, long black hair in ponytail, purple apron, small black dot eyes (no white). Sunny garden with green grass and wooden fence. Bubbles float in the air. Everyone smiles. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them, on ALL characters. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text. Landscape orientation.",
            },
        ],
    },
    "1.4": {
        "title": "The Red Socks",
        # CHARACTER: CHAR-C (Black British girl, smart casual)
        # - "bright yellow cardigan over white t-shirt, blue jeans, white canvas shoes"
        # - "dark brown skin, natural black hair in afro puffs with red and yellow bobbles"
        #
        # KEY OBJECTS (MUST be identical in ALL prompts):
        # - RED SOCKS: "a pair of bright red knitted socks with a small white stripe around the top"
        # - BED: "a small child's bed with a soft blue duvet and a white pillow"
        # - BAG: "a purple fabric drawstring bag, slightly open"
        # - HEN: "a plump brown speckled hen with a red comb, an orange beak, and tiny black dot eyes"
        # - HEN PEN: "a small wooden hen pen with chicken wire, straw on the floor, outdoors on green grass"
        # - NON-RED SOCK: "a single plain green sock"
        # - SETTING (indoor): "a cosy child's bedroom with warm peach walls, wooden floor, and soft natural light"
        # - SETTING (outdoor): "a sunny garden with green grass and a wooden fence"
        "scenes": [
            {
                # Cover — girl happy wearing red socks, kicking joyfully
                "name": "cover",
                "prompt": "Show the character from the reference image wearing a pair of bright red knitted socks with a small white stripe around the top, one foot kicked up in the air with a huge joyful smile, standing on green grass in a sunny garden. A plump brown speckled hen with a red comb, an orange beak, and tiny black dot eyes stands nearby looking surprised. Same character, same outfit (bright yellow cardigan over white t-shirt, blue jeans, white canvas shoes BUT shoes off, wearing the red socks), same dark brown skin, same afro puffs with red and yellow bobbles, same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them, on BOTH the girl AND the hen. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Portrait orientation.",
            },
            {
                # Page 1: "I have no socks! I am sad."
                "name": "page1",
                "prompt": "Show the character from the reference image sitting on a small child's bed with a soft blue duvet and a white pillow, looking down at her bare feet with a sad, pouty expression. Her shoes are off and her feet are bare - no socks at all. She looks disappointed. A cosy child's bedroom with warm peach walls, wooden floor, and soft natural light from a window. Same character, same outfit (bright yellow cardigan over white t-shirt, blue jeans, NO shoes, NO socks - bare feet), same dark brown skin, same afro puffs with red and yellow bobbles, same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
            {
                # Page 2: "I check the bed. I get a sock. Not red!"
                "name": "page2",
                "prompt": "Show the character from the reference image pulling a single plain green sock out from under a small child's bed with a soft blue duvet and a white pillow. The girl holds up the green sock with a disappointed frown, shaking her head - it is NOT the red sock she wants. She is kneeling beside the bed, reaching under it. A cosy child's bedroom with warm peach walls, wooden floor, and soft natural light. Same character, same outfit (bright yellow cardigan over white t-shirt, blue jeans, bare feet), same dark brown skin, same afro puffs with red and yellow bobbles, same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
            {
                # Page 3: "I check the bag. I get a sock. Not red!"
                "name": "page3",
                "prompt": "Show the character from the reference image pulling a single plain green sock out of a purple fabric drawstring bag, slightly open. The girl holds up the green sock with an even MORE disappointed expression, shoulders slumped - again NOT the red sock she wants. She is standing in the bedroom holding the bag open with one hand. A cosy child's bedroom with warm peach walls, wooden floor, and soft natural light. Same character, same outfit (bright yellow cardigan over white t-shirt, blue jeans, bare feet), same dark brown skin, same afro puffs with red and yellow bobbles, same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
            {
                # Page 4: "I check the hen pen. The hen has red socks!"
                "name": "page4",
                "prompt": "Show the character from the reference image looking over a small wooden hen pen with chicken wire, straw on the floor, outdoors on green grass. Inside the pen, a plump brown speckled hen with a red comb, an orange beak, and tiny black dot eyes is WEARING a pair of bright red knitted socks with a small white stripe around the top on its feet! The girl has wide surprised eyes and an open mouth, pointing at the hen in shock and amusement. A sunny garden with green grass and a wooden fence. Same character, same outfit (bright yellow cardigan over white t-shirt, blue jeans, bare feet), same dark brown skin, same afro puffs with red and yellow bobbles, same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them, on BOTH the girl AND the hen. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
            {
                # Page 5: "I get the socks. The hen pecks me! Peck, peck!"
                "name": "page5",
                "prompt": "Show the character from the reference image reaching into a small wooden hen pen with chicken wire and straw on the floor to grab a pair of bright red knitted socks with a small white stripe around the top. A plump brown speckled hen with a red comb, an orange beak, and tiny black dot eyes is pecking at the girl's hand, looking cross and protective of the socks! The girl is flinching and laughing, one hand reaching for the socks and the other pulled back. A sunny garden with green grass and a wooden fence. Same character, same outfit (bright yellow cardigan over white t-shirt, blue jeans, bare feet), same dark brown skin, same afro puffs with red and yellow bobbles, same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them, on BOTH the girl AND the hen. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
            {
                # Page 6: "Red socks on me! I can kick! I am so happy!"
                "name": "page6",
                "prompt": "Show the character from the reference image standing proudly on green grass wearing a pair of bright red knitted socks with a small white stripe around the top, one foot kicked up high in a triumphant kick, arms in the air celebrating, beaming with joy. The plump brown speckled hen with a red comb, an orange beak, and tiny black dot eyes watches from nearby looking slightly grumpy but accepting. A sunny garden with green grass and a wooden fence, bright sunshine. Same character, same outfit (bright yellow cardigan over white t-shirt, blue jeans, NO shoes, wearing the bright red socks), same dark brown skin, same afro puffs with red and yellow bobbles, same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them, on BOTH the girl AND the hen. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
        ],
    },
    "1.5": {
        "title": "Run, Pup, Run!",
        # CHARACTER: CHAR-L (Mixed heritage boy, pet owner)
        # - "red hoodie, blue jeans, white trainers"
        # - "medium brown skin, messy dark brown curls"
        #
        # KEY OBJECTS (MUST be identical in ALL prompts):
        # - PUP: "a small fluffy golden retriever puppy with floppy ears, a short waggy tail, and tiny black dot eyes"
        # - HUT: "a small wooden garden shed with a green door, slightly open"
        # - BUSH: "a big round green garden bush with small leaves"
        # - TUB: "a large blue plastic tub filled with water, sitting on the grass"
        # - SETTING: "a sunny garden with green grass, flower beds with bright flowers, and a wooden fence"
        "scenes": [
            {
                # Cover — boy hugging puppy in garden
                "name": "cover",
                "prompt": "Show the character from the reference image kneeling on green grass and hugging a small fluffy golden retriever puppy with floppy ears, a short waggy tail, and tiny black dot eyes. Both look joyful and loving. A sunny garden with green grass, flower beds with bright flowers, and a wooden fence. Same character, same outfit (red hoodie, blue jeans, white trainers), same medium brown skin, same messy dark brown curls, same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them, on BOTH the boy AND the puppy. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Portrait orientation.",
            },
            {
                # Page 1: "I have a pup. The pup can run!"
                "name": "page1",
                "prompt": "Show the character from the reference image standing in a sunny garden, smiling excitedly at a small fluffy golden retriever puppy with floppy ears, a short waggy tail, and tiny black dot eyes. The puppy is bounding energetically across the green grass, mid-run, looking playful. A sunny garden with green grass, flower beds with bright flowers, and a wooden fence. Same character, same outfit (red hoodie, blue jeans, white trainers), same medium brown skin, same messy dark brown curls, same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them, on BOTH the boy AND the puppy. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
            {
                # Page 2: "Run, pup, run! The pup hid in the hut."
                "name": "page2",
                "prompt": "Show the character from the reference image running towards a small wooden garden shed with a green door, slightly open. The small fluffy golden retriever puppy with floppy ears, a short waggy tail, and tiny black dot eyes is peeking out from inside the shed, its face visible in the doorway. The boy has an excited chasing expression with arms reaching forward. A sunny garden with green grass, flower beds with bright flowers, and a wooden fence. Same character, same outfit (red hoodie, blue jeans, white trainers), same medium brown skin, same messy dark brown curls, same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them, on BOTH the boy AND the puppy. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
            {
                # Page 3: "Run, pup, run! The pup hid in the bush."
                "name": "page3",
                "prompt": "Show the character from the reference image crouching down and peering into a big round green garden bush with small leaves. The small fluffy golden retriever puppy's waggy tail and back legs are sticking out of the bush, the rest of the puppy hidden inside. The boy has an amused grin, pointing at the puppy's tail poking out. A sunny garden with green grass, flower beds with bright flowers, and a wooden fence. Same character, same outfit (red hoodie, blue jeans, white trainers), same medium brown skin, same messy dark brown curls, same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
            {
                # Page 4: "Run, pup, run! The pup is in the tub!"
                "name": "page4",
                "prompt": "Show the character from the reference image looking shocked and laughing, hands on his cheeks in surprise. The small fluffy golden retriever puppy with floppy ears and tiny black dot eyes is sitting IN a large blue plastic tub filled with water on the grass, splashing happily, water droplets flying everywhere. The puppy looks pleased with itself. A sunny garden with green grass, flower beds with bright flowers, and a wooden fence. Same character, same outfit (red hoodie, blue jeans, white trainers), same medium brown skin, same messy dark brown curls, same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them, on BOTH the boy AND the puppy. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
            {
                # Page 5: "I rub the pup. Rub, rub, rub!"
                "name": "page5",
                "prompt": "Show the character from the reference image kneeling next to a large blue plastic tub filled with water on the grass, gently rubbing and scrubbing the small fluffy golden retriever puppy with both hands. The puppy is in the tub, wet and soapy, looking content with eyes half-closed enjoying the rub. Bubbles and water splashes around them. The boy has a caring, focused expression. A sunny garden with green grass and a wooden fence. Same character, same outfit (red hoodie, blue jeans, white trainers - sleeves pushed up), same medium brown skin, same messy dark brown curls, same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them, on BOTH the boy AND the puppy. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
            {
                # Page 6: "The pup and me! A big hug!"
                "name": "page6",
                "prompt": "Show the character from the reference image sitting on the green grass, arms wrapped around the small fluffy golden retriever puppy with floppy ears, a short waggy tail, and tiny black dot eyes in a big loving hug. Both look blissfully happy. The puppy is now clean and fluffy, nuzzling the boy's face. The boy beams with pure joy. A sunny garden with green grass, flower beds with bright flowers, and a wooden fence, warm golden sunshine. Same character, same outfit (red hoodie, blue jeans, white trainers), same medium brown skin, same messy dark brown curls, same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them, on BOTH the boy AND the puppy. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
        ],
    },
    "1.6": {
        "title": "Fox Fell Off!",
        # CHARACTER: CHAR-K (White British girl, pet owner) — appears as observer/helper
        # - "teal hoodie, dark grey leggings, green trainers"
        # - "light skin, long ginger hair in a single plait, freckles"
        #
        # ANIMAL PROTAGONIST: Fox is the main character, girl watches/helps
        # This is the personalisation swap character — she appears in every image
        #
        # KEY OBJECTS (MUST be identical in ALL prompts):
        # - FOX: "a small cute cartoon orange-red fox with a fluffy white-tipped tail, pointed ears, a black nose, and tiny black dot eyes"
        # - LOG: "a thick brown log lying on green grass"
        # - ROCK: "a single large smooth grey rock (boulder) on the green grass"
        #   (story text says ROCK — the old WALL object was a leftover from a
        #   pre-revision draft and produced art that contradicted the words)
        # - HILL: "a small green grassy hill with wildflowers"
        # - MAT: "a big fat soft purple cushion mat lying on the grass"
        # - SETTING: "a sunny countryside scene with green grass, wildflowers, blue sky with white clouds"
        "scenes": [
            {
                # Cover — girl hugging the fox, both happy
                "name": "cover",
                "prompt": "Show the character from the reference image sitting on green grass and gently hugging a small cute cartoon orange-red fox with a fluffy white-tipped tail, pointed ears, a black nose, and tiny black dot eyes. The fox looks happy and content. The girl has a caring loving expression. A sunny countryside scene with green grass, wildflowers, blue sky with white clouds. Same character, same outfit (teal hoodie, dark grey leggings, green trainers), same light skin, same long ginger hair in a single plait, same freckles, same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them, on BOTH the girl AND the fox. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Portrait orientation.",
            },
            {
                # Page 1: "I have a fox. Fox is on a log."
                "name": "page1",
                "prompt": "Show the character from the reference image standing nearby watching happily as a small cute cartoon orange-red fox with a fluffy white-tipped tail, pointed ears, a black nose, and tiny black dot eyes sits proudly on top of a thick brown log lying on green grass. The fox looks pleased with itself, balancing on the log. The girl watches with an amused smile. A sunny countryside scene with green grass, wildflowers, blue sky with white clouds. Same character, same outfit (teal hoodie, dark grey leggings, green trainers), same light skin, same ginger plait, same freckles, same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them, on BOTH the girl AND the fox. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
            {
                # Page 2: "Fox fell off the log! Oh, Fox!"
                "name": "page2",
                "prompt": "Show the small cute cartoon orange-red fox with a fluffy white-tipped tail, pointed ears, a black nose, and tiny black dot eyes tumbling off a thick brown log, legs in the air, looking surprised and silly. The fox is mid-fall, upside down. The character from the reference image stands nearby with hands on her cheeks, looking worried but also trying not to laugh. A sunny countryside scene with green grass, wildflowers. Same character, same outfit (teal hoodie, dark grey leggings, green trainers), same light skin, same ginger plait, same freckles, same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them, on BOTH the girl AND the fox. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
            {
                # Page 3: "Fox is on a rock. Fox fell off the rock!"
                "name": "page3",
                "prompt": "Show the small cute cartoon orange-red fox with a fluffy white-tipped tail, pointed ears, a black nose, and tiny black dot eyes tumbling backwards off a single large smooth grey rock (boulder) sitting on the green grass, legs splayed out comically, looking shocked. It must clearly be ONE big rounded rock, NOT a wall, NOT bricks, NOT stacked stones. The character from the reference image stands to the side, arms out as if trying to catch the fox, with a concerned amused expression. A sunny countryside scene with green grass, wildflowers, blue sky. Same character, same outfit (teal hoodie, dark grey leggings, green trainers), same light skin, same ginger plait, same freckles, same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them, on BOTH the girl AND the fox. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
            {
                # Page 4: "Fox is on a hill. Fox fell off the hill!"
                # Zoomed-out wide shot so the fall reads clearly (Lynden QA
                # 2026-07-01: close-up made the fox look like it was happily
                # jumping, not falling).
                "name": "page4",
                "prompt": "A zoomed-out wide view of a small green grassy hill with wildflowers, showing the WHOLE hill from bottom to top. The small cute cartoon orange-red fox with a fluffy white-tipped tail, pointed ears, a black nose, and tiny black dot eyes is halfway down the slope, clearly falling and tumbling head-over-heels — upside down, legs flailing, small curved motion lines behind it, a startled worried expression, definitely NOT smiling and NOT jumping. The character from the reference image stands small at the bottom of the hill with arms open ready to catch the fox, wincing. A sunny countryside scene with green grass, wildflowers, blue sky with white clouds. Same character, same outfit (teal hoodie, dark grey leggings, green trainers), same light skin, same ginger plait, same freckles, same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them, on BOTH the girl AND the fox. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
            {
                # Page 5: "I get a big, fat mat. Sit on it, Fox!"
                "name": "page5",
                "prompt": "Show the character from the reference image placing a big fat soft purple cushion mat on the green grass, gesturing to the small cute cartoon orange-red fox with a fluffy white-tipped tail, pointed ears, a black nose, and tiny black dot eyes to come sit on it. The girl looks determined and helpful, pointing at the mat. The fox looks uncertain, tilting its head. A sunny countryside scene with green grass, wildflowers, blue sky. Same character, same outfit (teal hoodie, dark grey leggings, green trainers), same light skin, same ginger plait, same freckles, same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them, on BOTH the girl AND the fox. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
            {
                # Page 6: "Fox is on the mat! Fox did not fall off! I hug Fox!"
                "name": "page6",
                "prompt": "Show the small cute cartoon orange-red fox with a fluffy white-tipped tail, pointed ears, a black nose, and tiny black dot eyes sitting happily and securely on a big fat soft purple cushion mat on the green grass, looking triumphant and proud. The character from the reference image kneels beside the fox, arms wrapped around it in a gentle hug, beaming with joy. Both look delighted that the fox finally did not fall off. A sunny countryside scene with green grass, wildflowers, blue sky with white clouds, warm golden light. Same character, same outfit (teal hoodie, dark grey leggings, green trainers), same light skin, same ginger plait, same freckles, same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them, on BOTH the girl AND the fox. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Landscape orientation.",
            },
        ],
    },
    "1.7": {
        "title": "The Jam Jug",
        # CHARACTER: Custom boy in white thobe and kufi cap at a market
        # - "white thobe, white embroidered kufi cap, warm brown skin, short black hair"
        #
        # KEY OBJECTS (MUST be identical in ALL prompts):
        # - VAN: "a small colourful painted van (blue and yellow) with an open back"
        # - JUGS: "large round clay jugs with cork stoppers, filled with colourful jam"
        # - RUG: "a beautiful woven rug with geometric patterns in red, orange, and gold"
        # - RAG: "a small white cotton cloth"
        # SETTING: vibrant outdoor market/souk with colourful fabric canopies, lanterns, spice stalls
        "scenes": [
            {
                # Cover: The Jam Jug
                "name": "cover",
                "prompt": "Show the character from the reference image standing proudly in front of a vibrant outdoor market stall, holding up a large round clay jug with a cork stopper filled with red jam. Behind him is a small colourful painted van (blue and yellow) with the back open, showing more clay jugs of jam. The market has colourful fabric canopies overhead (orange, red, purple), hanging brass lanterns, and a beautiful woven rug with geometric patterns in red, orange, and gold on the ground. Warm golden sunlight. Same character, same outfit (white thobe, white kufi cap), same warm brown skin, same short black hair, same appearance as reference. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — like two small dots drawn with a black marker pen. There must be NO white whatsoever in or around the eyes. No iris, no sclera, no highlights. Just plain black dots. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Portrait orientation.",
            },
            {
                # Page 1: "Dad has a van. The van has jam in big jugs."
                "name": "page1",
                "side_hero": True,
                "prompt": "Show the dad from the SECOND reference image (adult man in white thobe and white head covering) standing proudly beside a small colourful painted van (blue and yellow) with the back open. Inside the van are many large round clay jugs with cork stoppers, filled with different colourful jams (red, orange, golden). The child from the FIRST reference image stands beside his dad, looking excited. The dad MUST look exactly like the SECOND reference image — same face, same outfit, same beard. A vibrant outdoor market setting with colourful fabric canopies overhead, hanging brass lanterns, other market stalls in the background. A beautiful woven rug with geometric patterns in red, orange, and gold is spread on the ground in front of the van. Same boy character, same outfit (white thobe, white kufi cap), same warm brown skin, same appearance as FIRST reference. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — like two small dots drawn with a black marker pen. There must be NO white whatsoever in or around the eyes. No iris, no sclera, no highlights. Just plain black dots. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text. Landscape orientation.",
            },
            {
                # Page 2: "I dip in a jug. Fig jam! It is yum!"
                "name": "page2",
                "prompt": "Show the character from the reference image dipping his finger into the top of a large round clay jug with the cork stopper off, tasting the jam inside. His finger has golden-brown fig jam on it. He looks delighted, licking his lips. The market stall setting with more clay jugs of jam on a wooden table, colourful fabric canopy overhead, hanging brass lanterns. A beautiful woven rug with geometric patterns in red, orange, and gold on the ground. Same character, same outfit (white thobe, white kufi cap), same warm brown skin, same appearance as reference. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — like two small dots drawn with a black marker pen. There must be NO white whatsoever in or around the eyes. No iris, no sclera, no highlights. Just plain black dots. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text. Landscape orientation.",
            },
            {
                # Page 3: "I dip in a jug. Red jam! It is yum!"
                "name": "page3",
                "prompt": "Show the character from the reference image dipping his finger into a different large round clay jug, this one filled with bright red jam. He has a big happy smile and red jam on his finger. Multiple clay jugs are on the wooden table, each with different coloured jam. The vibrant market setting with colourful fabric canopies, brass lanterns, other stalls visible in background. A beautiful woven rug with geometric patterns in red, orange, and gold on the ground. Same character, same outfit (white thobe, white kufi cap), same warm brown skin, same appearance as reference. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — like two small dots drawn with a black marker pen. There must be NO white whatsoever in or around the eyes. No iris, no sclera, no highlights. Just plain black dots. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text. Landscape orientation.",
            },
            {
                # Page 4: "The jug tips! Jam on the rug! Oh, no!"
                "name": "page4",
                "prompt": "Show a large round clay jug tipping over on the wooden table, bright red jam spilling and splattering onto the beautiful woven rug with geometric patterns in red, orange, and gold on the ground! The character from the reference image looks shocked and worried, hands up by his face, mouth open in an 'oh no!' expression. Jam dripping down and making a big red mess on the rug. The vibrant market setting with colourful canopies and brass lanterns. Same character, same outfit (white thobe, white kufi cap), same warm brown skin, same appearance as reference. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — like two small dots drawn with a black marker pen. There must be NO white whatsoever in or around the eyes. No iris, no sclera, no highlights. Just plain black dots. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text. Landscape orientation.",
            },
            {
                # Page 5: "I get a wet rag. I mop it up."
                "name": "page5",
                "prompt": "Show the character from the reference image kneeling on the ground beside the beautiful woven rug with geometric patterns in red, orange, and gold, scrubbing the jam stain off the rug with a small white cotton cloth (wet rag). He looks focused and determined, working hard to clean. A bucket of water beside him. The vibrant market setting with colourful canopies and brass lanterns. Same character, same outfit (white thobe, white kufi cap, now slightly messy), same warm brown skin, same appearance as reference. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — like two small dots drawn with a black marker pen. There must be NO white whatsoever in or around the eyes. No iris, no sclera, no highlights. Just plain black dots. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text. Landscape orientation.",
            },
            {
                # Page 6: "No jam on the rug! I did it! I hug Dad."
                "name": "page6",
                "side_hero": True,
                "prompt": "Show the child from the FIRST reference image hugging the dad from the SECOND reference image warmly. The boy wraps his arms around the dad's waist, beaming with pride. The dad MUST look exactly like the SECOND reference image — same face, same white thobe, same white head covering, same beard. The dad hugs the boy back with a big proud smile. The beautiful woven rug with geometric patterns in red, orange, and gold is clean again on the ground — no jam stain! The vibrant market setting with colourful canopies, brass lanterns, warm golden sunlight. Clay jugs of jam neatly on the wooden table behind them. Same boy character, same outfit (white thobe, white kufi cap), same warm brown skin, same appearance as FIRST reference. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — like two small dots drawn with a black marker pen. There must be NO white whatsoever in or around the eyes. No iris, no sclera, no highlights. Just plain black dots. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text. Landscape orientation.",
            },
        ],
    },
    "1.8": {
        "title": "The Yak and the Box",
        # CHARACTER: Custom child in maroon jumper with orange scarf and woven headband
        # - "thick maroon woolly jumper, brown trousers, sturdy brown boots, bright orange scarf, red-orange woven headband"
        #
        # KEY OBJECTS (MUST be identical in ALL prompts):
        # - YAK: "a fluffy dark brown yak with shaggy fur and small curved horns — about the size of a large pony, its back level with the child's chest. NOT enormous, NOT taller than a person."
        # - BOX: "a square wooden box with a metal clasp and a zip-top cloth lid in bright blue"
        # - FIGS: "small round purple-brown figs"
        # - HUT: "a small stone hut with a flat stone roof"
        # SETTING: Himalayan mountain village, stone houses, prayer flags, snow-capped peaks, green terraces
        # EYES: MANDATORY — every character MUST have ONLY tiny solid black filled circles for eyes. ABSOLUTELY CRITICAL.
        # SIZE: The yak must be realistically proportioned — about pony-sized, NOT house-sized.
        "scenes": [
            {
                # Cover: The Yak and the Box
                "name": "cover",
                "side_hero": True,
                "prompt": "Show the child from the FIRST reference image standing beside the yak from the SECOND reference image. The yak MUST look exactly like the SECOND reference image — same fluffy dark brown shaggy fur, same small curved horns, same friendly face, same size (about a large pony, its back level with the child's chest, NOT taller than a person). The child has one hand resting on the yak's side, both looking at the viewer. Behind them is a stunning Himalayan mountain village: stone houses with flat roofs, colourful prayer flags strung between buildings (red, yellow, green, blue, white), snow-capped mountain peaks in the distance, green terraced fields. Warm golden morning light. Same child character, same outfit (maroon woolly jumper, brown trousers, brown boots, orange scarf, red-orange woven headband), same appearance as FIRST reference. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — like two small dots drawn with a black marker pen. There must be NO white whatsoever in or around the eyes. No iris, no sclera, no highlights. Just plain black dots like a teddy bear. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text. Portrait orientation.",
            },
            {
                # Page 1: "I have a yak. The yak is big!"
                "name": "page1",
                "side_hero": True,
                "prompt": "Show the child from the FIRST reference image standing next to the yak from the SECOND reference image. The yak MUST look exactly like the SECOND reference — same fluffy dark brown shaggy fur, same small curved horns, same friendly face. The yak is about the size of a large pony — its back is level with the child's chest, bigger than the child but NOT enormous, NOT taller than a person. The child looks at the yak with awe and affection. A Himalayan mountain village setting: stone houses, colourful prayer flags (red, yellow, green, blue, white), snow-capped peaks, green grass. Same child character, same outfit (maroon jumper, brown trousers, brown boots, orange scarf, red-orange headband), same appearance as FIRST reference. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — like two small dots drawn with a black marker pen. There must be NO white whatsoever in or around the eyes on BOTH child AND yak. No iris, no sclera, no highlights. Just plain black dots. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds. No text. Landscape orientation.",
            },
            {
                # Page 2: "I have a box. I zip it up. Six figs in the box."
                "name": "page2",
                "side_hero": True,
                "prompt": "Show the child from the FIRST reference image kneeling on the green grass, carefully zipping up a square wooden box with a metal clasp and a bright blue zip-top cloth lid. Inside the box (partially visible before zipping), six small round purple-brown figs are neatly arranged. The yak from the SECOND reference image watches from behind, curious — same fluffy dark brown shaggy fur, same small curved horns, pony-sized. Mountain village setting with stone houses, prayer flags, snow peaks. Same child character, same outfit (maroon jumper, brown trousers, brown boots, orange scarf, red-orange headband), same appearance as FIRST reference. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever in or around the eyes. Just plain black dots. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds. No text. Landscape orientation.",
            },
            {
                # Page 3: "The yak sat on the box! Oh, no!"
                "name": "page3",
                "side_hero": True,
                "prompt": "Show the yak from the SECOND reference image sitting right on top of the square wooden box with the bright blue zip-top lid! The yak MUST look exactly like the SECOND reference — same fluffy dark brown shaggy fur, same small curved horns, pony-sized, NOT enormous. The box is squished under the yak's weight. The yak is about the same height as the child when sitting. The child from the FIRST reference image stands nearby, hands up by face, looking shocked and worried. The yak looks oblivious and content sitting there. Mountain village setting with stone houses, prayer flags, snow peaks. Same child character, same outfit (maroon jumper, brown trousers, brown boots, orange scarf, red-orange headband), same appearance as FIRST reference. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever in or around the eyes on BOTH child AND yak. Just plain black dots. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds. No text. Landscape orientation.",
            },
            {
                # Page 4: "I fix the box. I set it on top of the hut."
                "name": "page4",
                "side_hero": True,
                "prompt": "Show the child from the FIRST reference image climbing up to place the square wooden box with the bright blue zip-top cloth lid on top of a small stone hut with a flat stone roof. The child reaches up, carefully setting the box on the roof where the yak cannot reach it. The yak from the SECOND reference image watches from the ground below, looking confused — same fluffy dark brown shaggy fur, same small curved horns, pony-sized, much shorter than the hut. The hut is clearly taller than the yak — the box is safely out of reach! A clever solution! Mountain village setting with stone houses, colourful prayer flags, snow-capped peaks. Same child character, same outfit (maroon jumper, brown trousers, brown boots, orange scarf, red-orange headband), same appearance as FIRST reference. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever in or around the eyes on BOTH child AND yak. Just plain black dots. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds. No text. Landscape orientation.",
            },
            {
                # Page 5: "The yak can not get it! I get the six figs."
                "name": "page5",
                "side_hero": True,
                "prompt": "Show the yak from the SECOND reference image standing on the ground, stretching its neck upward trying to reach the square wooden box with the bright blue zip-top cloth lid that sits on top of a small stone hut with a flat stone roof — but the yak CANNOT reach it because the hut is much taller than the yak! The yak MUST look exactly like the SECOND reference — same fluffy dark brown shaggy fur, same small curved horns, pony-sized, much shorter than the hut. The child from the FIRST reference image stands nearby with the box open, triumphantly holding out six small round purple-brown figs. The child looks clever and proud. Mountain village setting with stone houses, prayer flags, snow-capped peaks, warm golden light. Same child character, same outfit (maroon jumper, brown trousers, brown boots, orange scarf, red-orange headband), same appearance as FIRST reference. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever. Just plain black dots. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds. No text. Landscape orientation.",
            },
            {
                # Page 6: "I munch a fig. The big yak gets a fig. Yum!"
                "name": "page6",
                "side_hero": True,
                "prompt": "Show the child from the FIRST reference image and the yak from the SECOND reference image sitting together on green grass, both happily munching on small round purple-brown figs. The yak MUST look exactly like the SECOND reference — same fluffy dark brown shaggy fur, same small curved horns, pony-sized, NOT enormous. The child holds a fig and takes a bite, smiling. The yak munches on a fig too, looking content and gentle. They share the treat together like friends. Mountain village setting with stone houses, colourful prayer flags (red, yellow, green, blue, white), snow-capped peaks, warm golden sunlight. Same child character, same outfit (maroon jumper, brown trousers, brown boots, orange scarf, red-orange headband), same appearance as FIRST reference. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever in or around the eyes on BOTH child AND yak. Just plain black dots. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds. No text. Landscape orientation.",
            },
        ],
    },
    "1.9": {
        "title": "Chop, Chop, Chop!",
        # CHARACTER: Custom child in turquoise kurta in a South Asian kitchen
        # - "bright turquoise kurta with gold trim, white cotton trousers, brown leather sandals"
        # SAFETY: Grandmother does ALL chopping/cooking. Child only does safe helper tasks.
        #
        # KEY OBJECTS (MUST be identical in ALL prompts):
        # - GRANDMA: "a warm grandmother with GREY hair tied in a neat low bun, round face with warm smile lines, wearing a green shalwar kameez with a colourful floral dupatta always draped over her shoulders, warm brown skin"
        #   CRITICAL: Grandma MUST look IDENTICAL in every image — same grey hair bun, same green outfit, same dupatta.
        # - PAN: "a large round black iron pan (tava/griddle) on a gas stove"
        # - CHIPS: "thick-cut golden potato chips/wedges"
        # - DISH: "a large colourful ceramic dish with floral pattern"
        # SETTING: vibrant South Asian kitchen, brass pots, colourful spice jars, tiled walls with blue/white patterns
        # EYES: MANDATORY — every character MUST have ONLY tiny solid black filled circles for eyes, like two dots drawn with a black marker. Absolutely NO white around the eyes, NO iris, NO sclera. This is the MOST IMPORTANT visual rule.
        "scenes": [
            {
                # Cover: Chop, Chop, Chop!
                "name": "cover",
                "side_hero": True,
                "prompt": "Show the child from the FIRST reference image in a vibrant kitchen, standing beside the grandmother from the SECOND reference image. The grandmother MUST look exactly like the SECOND reference — same GREY hair in neat low bun, same round face with warm smile lines, same warm brown skin, same green shalwar kameez with colourful floral dupatta draped over her shoulders. The grandmother holds a knife and a chopping board with vegetables — she is the cook. The child stands beside her holding a large colourful ceramic dish with floral pattern, looking up eagerly as the helper. The kitchen has brass pots, colourful glass spice jars (turmeric yellow, chilli red, green), blue and white patterned tiles on the wall. Warm, steamy, inviting kitchen atmosphere. Same child character, same outfit (turquoise kurta with gold trim, white trousers, brown sandals), same appearance as FIRST reference. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — like two small dots drawn with a black marker pen. There must be NO white whatsoever in or around the eyes. No iris, no sclera, no highlights. Just plain black dots like a teddy bear. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text. Portrait orientation.",
            },
            {
                # Page 1: "Nan chops, chops, chops! This is fun!"
                "name": "page1",
                "side_hero": True,
                "prompt": "Show the grandmother from the SECOND reference image standing at a wooden kitchen counter, energetically chopping potatoes with a knife on a wooden chopping board. The grandmother MUST look exactly like the SECOND reference — same GREY hair in neat low bun, same round face, same warm brown skin, same green shalwar kameez with colourful floral dupatta. Potato pieces flying! She looks skilled and happy. The child from the FIRST reference image stands beside her watching excitedly, clapping hands together with joy — the child is NOT holding or touching any knife. A vibrant South Asian kitchen: brass pots on shelves, colourful glass spice jars, blue and white patterned tiles on the wall. Same child character, same outfit (turquoise kurta with gold trim, white trousers, brown sandals), same appearance as FIRST reference. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — like two dots from a black marker. NO white in or around eyes at all. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds. No text. Landscape orientation.",
            },
            {
                # Page 2: "Nan chops it thin. Nan chops it thick."
                "name": "page2",
                "side_hero": True,
                "prompt": "Show the grandmother from the SECOND reference image at the wooden counter, showing the child from the FIRST reference image two piles of chopped potato: one pile of thin slices on the left, one pile of thick chunky pieces on the right. The grandmother MUST look exactly like the SECOND reference — same GREY hair in neat low bun, same round face, same warm brown skin, same green shalwar kameez with colourful floral dupatta. The grandmother holds up one thin piece and one thick piece to show the child. The child points at them with a curious, fascinated expression — learning the difference. Vibrant South Asian kitchen with brass pots, spice jars, blue-white tiles. Same child character, same outfit (turquoise kurta with gold trim, white trousers), same appearance as FIRST reference. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds. No text. Landscape orientation.",
            },
            {
                # Page 3: "Chips in a hot pan. I got a big dish!"
                "name": "page3",
                "side_hero": True,
                "prompt": "Show the grandmother from the SECOND reference image carefully placing thick-cut golden potato chips into a large round black iron pan on a gas stove. The grandmother MUST look exactly like the SECOND reference — same GREY hair in neat low bun, same round face, same warm brown skin, same green shalwar kameez with colourful floral dupatta. Steam and sizzle rising from the hot pan! The child from the FIRST reference image stands at a safe distance from the stove, proudly holding up a large colourful ceramic dish with floral pattern, ready to receive the cooked chips. Vibrant South Asian kitchen with brass pots, colourful spice jars, blue-white tiles. Warm golden kitchen light. Same child character, same outfit (turquoise kurta with gold trim, white trousers), same appearance as FIRST reference. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds. No text. Landscape orientation.",
            },
            {
                # Page 4: "I got a chip. That chip is thick!"
                "name": "page4",
                "side_hero": True,
                "prompt": "Show the child from the FIRST reference image sitting at a low wooden table, holding up a thick chunky cooked golden potato chip with a big excited smile, examining how thick it is. The grandmother from the SECOND reference image sits beside the child at the table, smiling proudly — she MUST look exactly like the SECOND reference, same GREY hair in neat low bun, same round face, same warm brown skin, same green shalwar kameez with colourful floral dupatta. A plate of crispy thick-cut golden potato chips between them on the table. No knives or sharp objects visible — just cooked chips on a plate. Vibrant South Asian kitchen with brass pots, spice jars, blue-white tiles. Same child character, same outfit (turquoise kurta with gold trim, white trousers), same appearance as FIRST reference. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds. No text. Landscape orientation.",
            },
            {
                # Page 5: "I dip a chip in. Yum, yum, yum!"
                "name": "page5",
                "side_hero": True,
                "prompt": "Show the child from the FIRST reference image dipping a cooked thick-cut golden potato chip into a small colourful bowl of red dipping sauce, smiling happily with OPEN eyes while eating. The grandmother from the SECOND reference image sits beside the child at a low wooden table, also enjoying a chip, both smiling with OPEN eyes — she MUST look exactly like the SECOND reference, same GREY hair in neat low bun, same green shalwar kameez with colourful floral dupatta. A plate of crispy golden chips between them. Vibrant South Asian kitchen with brass pots, spice jars, blue-white tiles. Same child character, same outfit (turquoise kurta with gold trim, white trousers), same appearance as FIRST reference. ABSOLUTELY CRITICAL — THIS IS THE MOST IMPORTANT RULE: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — completely black, NO white anywhere in or around the eyes. Do NOT draw irises, do NOT draw white sclera, do NOT draw any eye detail. Just two small plain solid black dots like a teddy bear. Both the child AND the grandmother must have these plain black dot eyes. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds. No text. Landscape orientation.",
            },
            {
                # Page 6: "Chips with Nan! Munch, munch, munch!"
                "name": "page6",
                "side_hero": True,
                "prompt": "Show the child from the FIRST reference image and the grandmother from the SECOND reference image sitting together at a low wooden table, both happily munching on crispy thick-cut golden potato chips from a large colourful ceramic dish with floral pattern. The grandmother MUST look exactly like the SECOND reference — same GREY hair in neat low bun, same round face, same warm brown skin, same green shalwar kameez with colourful floral dupatta draped over her shoulders. Both are mid-munch, cheeks puffed, enjoying the food together with big smiles. Crumbs on the table, warm cosy scene. The vibrant South Asian kitchen glows warmly with brass pots, colourful spice jars, blue-white tiles. Same child character, same outfit (turquoise kurta with gold trim, white trousers), same appearance as FIRST reference. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds. No text. Landscape orientation.",
            },
        ],
    },
    "1.10": {
        "title": "Buzz and Sing!",
        # CHARACTER: Custom Caribbean child in yellow sundress with natural hair twists
        # - "bright yellow sundress with small white flower print, dark navy blue leggings, colourful beaded sandals, dark brown skin, small natural twists"
        #
        # KEY OBJECTS (MUST be identical in ALL prompts):
        # - BEE: "a cute round fuzzy bumble bee with yellow and black stripes, tiny transparent wings"
        # - BUG: "a small bright green bug/cricket"
        # - LOG: "a big brown fallen tree log with mossy patches"
        # - ROCK: "a large smooth grey-brown rock"
        # SETTING: lush Caribbean tropical garden, bright hibiscus flowers (red, pink, orange), palm trees,
        #   turquoise sea in background, colourful wooden house with tin roof, warm sunshine
        # STORY ARC: Garden full of sounds → sounds STOP (problem!) → child sings to bring them back → triumph
        # EYES: MANDATORY — every character MUST have ONLY tiny solid black filled circles for eyes. ABSOLUTELY CRITICAL.
        "scenes": [
            {
                # Cover: Buzz and Sing!
                "name": "cover",
                "prompt": "Show the character from the reference image sitting happily on a big brown fallen tree log with mossy patches in a lush Caribbean tropical garden, surrounded by nature. A cute round fuzzy bumble bee with yellow and black stripes and tiny transparent wings buzzes near bright red hibiscus flowers. A small bright green bug/cricket sits on a large smooth grey-brown rock nearby. The garden has bright hibiscus flowers (red, pink, orange), tall palm trees, a colourful wooden house with a blue tin roof in the background, and turquoise sea visible on the horizon. Warm tropical sunshine, bright colours everywhere. Same character, same outfit (bright yellow sundress with small white flower print, dark navy blue leggings, colourful beaded sandals), same dark brown skin, same natural hair in small twists, same appearance as reference. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — like two small dots drawn with a black marker pen. There must be NO white whatsoever in or around the eyes. No iris, no sclera, no highlights. Just plain black dots. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text. Portrait orientation.",
            },
            {
                # Page 1: "I sit on a big log. Buzz, buzz, buzz!"
                "name": "page1",
                "prompt": "Show the character from the reference image sitting happily on a big brown fallen tree log with mossy patches in a lush tropical garden. Three cute round fuzzy bumble bees with yellow and black stripes and tiny transparent wings buzz around bright red and pink hibiscus flowers nearby. The child swings her legs on the log, smiling at the bees. Palm trees sway gently, turquoise sea visible in the background. Warm tropical sunshine, everything bathed in golden light. Same character, same outfit (yellow sundress with white flower print, dark navy blue leggings, beaded sandals), same dark brown skin, same natural twists, same appearance as reference. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever. Just plain black dots on BOTH the child AND bees. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds. No text. Landscape orientation.",
            },
            {
                # Page 2: "A big bug sits on a rock. Hiss, hiss, hiss!"
                "name": "page2",
                "prompt": "Show the character from the reference image leaning forward curiously, looking at a small bright green bug/cricket sitting on top of a large smooth grey-brown ROCK. IMPORTANT: The bug MUST be on the ROCK (the grey-brown stone), NOT on the log. The rock and the log are SEPARATE objects — the rock is a large smooth grey-brown stone sitting on the ground, the log is a big brown fallen tree with mossy patches. The child sits on the log but leans forward to look at the bug on the ROCK. The bug appears to be making a hissing/chirping sound. The child looks fascinated, peering closely at the bug sitting on the large grey-brown rock. Lush tropical garden setting with hibiscus flowers (red, pink), palm trees, tropical plants with big green leaves, turquoise sea in background. Same character, same outfit (yellow sundress with white flower print, dark navy blue leggings, beaded sandals), same dark brown skin, same natural twists, same appearance as reference. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever. Just plain black dots. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds. No text. Landscape orientation.",
            },
            {
                # Page 3: "I sing a song. Ring, ring, ring!"
                "name": "page3",
                "prompt": "Show the character from the reference image standing up in the tropical garden, head tilted back, mouth open singing joyfully with arms spread wide. Decorative swirl shapes suggesting music and ringing sounds float in the air around her (but NO text or letters). Cute round bees buzz near flowers, a small green bug chirps on a rock. Bright hibiscus flowers, palm trees, sunshine, turquoise sea in background. The garden is alive with colour and sound — red, pink, orange flowers. Same character, same outfit (yellow sundress with white flower print, dark navy blue leggings, beaded sandals), same dark brown skin, same natural twists, same appearance as reference. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever. Just plain black dots. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds. No text or letters. Landscape orientation.",
            },
            {
                # Page 4: "Shh! It is hush. No buzz. No hiss."
                "name": "page4",
                "prompt": "Show the character from the reference image sitting alone on the big brown fallen tree log with mossy patches in the tropical garden, looking puzzled and concerned, one finger to her lips in a 'shh' gesture. The garden is QUIET and STILL — no bees buzzing, no bugs hissing. Empty flowers without any creatures on them. The large smooth grey-brown rock is empty — no bug. The child looks around searching for the missing sounds. A quieter, more subdued scene but still beautiful — slightly muted colours to show the silence. Palm trees, turquoise sea, hibiscus flowers still there but no creatures. Same character, same outfit (yellow sundress with white flower print, dark navy blue leggings, beaded sandals), same dark brown skin, same natural twists, same appearance as reference. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever. Just plain black dots. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds. No text. Landscape orientation.",
            },
            {
                # Page 5: "I sing quick! I sing a long song!"
                "name": "page5",
                "prompt": "Show the character from the reference image standing up energetically on the big brown fallen tree log with mossy patches, singing with great enthusiasm! Arms spread wide, mouth open in song, body full of energy and determination. Decorative swirl shapes suggesting loud, beautiful music radiate outward from the child (but NO text or letters). The child is trying to bring the sounds back by singing loudly! The garden is still empty of creatures but the child is taking ACTION. Bright tropical setting with hibiscus flowers (red, pink, orange), palm trees, turquoise sea, warm golden sunshine returning. Same character, same outfit (yellow sundress with white flower print, dark navy blue leggings, beaded sandals), same dark brown skin, same natural twists, same appearance as reference. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever. Just plain black dots. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds. No text or letters. Landscape orientation.",
            },
            {
                # Page 6: "Buzz! Hiss! Ring! I sing with the bugs!"
                "name": "page6",
                "prompt": "Show the character from the reference image standing joyfully in the tropical garden with ALL the garden friends returned! Cute round fuzzy bumble bees with yellow and black stripes buzz around bright hibiscus flowers, a small bright green bug/cricket sits on the large smooth grey-brown rock chirping happily. The child stands on or beside the big brown fallen tree log, arms wide open, mouth open singing, beaming with pure triumph — she brought the sounds back! The garden is alive again with sound and colour. Bright hibiscus flowers (red, pink, orange), palm trees, turquoise sea, warm golden sunshine. The most colourful, vibrant, joyful scene of all. Same character, same outfit (yellow sundress with white flower print, dark navy blue leggings, beaded sandals), same dark brown skin, same natural twists, same appearance as reference. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever. Just plain black dots on ALL characters including bees and bug. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds. No text. Landscape orientation.",
            },
        ],
    },
}

# ═══════════════════════════════════════════════════════════════════
# LEVEL 2.1 — "What Is in the Rock Pool?" (Scottish coast)
# ═══════════════════════════════════════════════════════════════════
SCENE_PROMPTS["2.1"] = {
    "title": "The Night Light",
    # CHARACTER: Japanese girl in pink yukata with odango buns
    # - "soft pink yukata with white cherry blossom pattern, darker pink obi, wooden geta sandals"
    # - "black hair in odango buns with pink ribbons"
    #
    # KEY OBJECTS (MUST be identical in ALL prompts):
    # - STONE LANTERN: "a traditional Japanese stone lantern (toro) made of grey stone with a square base, "
    #                  "a carved middle section, and a small roof — about waist-height to the child"
    # - SETTING: "a traditional Japanese garden with a curved wooden bridge, a still pond with lily pads, "
    #           "cherry blossom trees, stepping stones, and soft moss-covered ground"
    "scenes": [
    {
        # COVER: Girl in Japanese garden with lit lantern at night
        "name": "cover",
        "prompt": "BOOK COVER ILLUSTRATION. Show the character from the reference image standing in a beautiful traditional Japanese night garden, illuminated by a glowing traditional Japanese stone lantern (toro) made of grey stone with a square base. The child looks up at the lantern with wonder and joy. Cherry blossom trees in the background, a curved wooden bridge over a still pond, stars in the night sky. The lantern casts warm golden light on the child's face. Same character, same outfit (soft pink yukata with white cherry blossom pattern, darker pink obi, wooden geta sandals), same black hair in odango buns with pink ribbons. CRITICAL: Eyes MUST be tiny solid black filled circles — NO white whatsoever. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds. No text. Portrait orientation.",
    },
    {
        # Page 1: "The sun is up high."
        "name": "page1",
        "prompt": "Show the character from the reference image standing in a traditional Japanese garden in bright afternoon sunshine. The child stands on a curved wooden bridge over a still pond with lily pads, looking up at the sun high in a pale blue sky. Cherry blossom trees frame the scene. A traditional Japanese stone lantern (toro) made of grey stone with a square base is visible nearby, unlit. The garden is peaceful and sunlit. Same character, same outfit (soft pink yukata with white cherry blossom pattern, darker pink obi, wooden geta sandals), same black hair in odango buns with pink ribbons. CRITICAL: Eyes MUST be tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 2: "The day is ending."
        "name": "page2",
        "prompt": "Show the character from the reference image in the same traditional Japanese garden, now with an orange and pink sunset sky. The child stands by the still pond, watching the sun set on the horizon. Long shadows stretch across the garden. The cherry blossom trees are silhouetted against the colourful sky. The traditional Japanese stone lantern (toro) made of grey stone is still unlit in the twilight. The child has a slightly wistful expression, watching the day end. Same character, same outfit (soft pink yukata with white cherry blossom pattern, darker pink obi, wooden geta sandals), same black hair in odango buns with pink ribbons. CRITICAL: Eyes MUST be tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 3: "I sigh. It is dim."
        "name": "page3",
        "prompt": "Show the character from the reference image in the Japanese garden at twilight — deep blue and purple tones in the sky. The child looks around with a slightly worried expression, shoulders drooping in a gentle sigh. The garden is getting dark and hard to see. The traditional Japanese stone lantern (toro) made of grey stone is dark and unlit. The trees are becoming silhouettes. The pond reflects the darkening sky. The child can barely see the stepping stones. Same character, same outfit (soft pink yukata with white cherry blossom pattern, darker pink obi, wooden geta sandals), same black hair in odango buns with pink ribbons. CRITICAL: Eyes MUST be tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 4: "I need a light!"
        "name": "page4",
        "prompt": "Show the character from the reference image in the dark Japanese garden, looking at the unlit traditional Japanese stone lantern (toro) made of grey stone with hopeful anticipation. The child's hands are clasped together as if making a wish. Stars are beginning to appear in the deep blue sky. The lantern is the focus of the child's attention. The garden is very dim. Same character, same outfit (soft pink yukata with white cherry blossom pattern, darker pink obi, wooden geta sandals), same black hair in odango buns with pink ribbons. CRITICAL: Eyes MUST be tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 5: "A light! Up high! I can see!"
        "name": "page5",
        "prompt": "Show the character from the reference image delighted and excited as the traditional Japanese stone lantern (toro) made of grey stone has just lit up with a warm golden glow! The child points up at the lantern with joy, mouth open in excitement. The warm light illuminates the child's face and the nearby flowers. The garden is still dark but the single lantern shines brightly like a beacon. Same character, same outfit (soft pink yukata with white cherry blossom pattern, darker pink obi, wooden geta sandals), same black hair in odango buns with pink ribbons. CRITICAL: Eyes MUST be tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 6: "I see the way. The night is lit."
        "name": "page6",
        "prompt": "Show the character from the reference image walking confidently along a stone stepping path in the Japanese night garden. More traditional Japanese stone lanterns have lit up along the path, creating a trail of warm golden lights. The curved wooden bridge is now visible in the lantern light. The pond reflects the golden glow. The child smiles, walking happily now that they can see the way. Same character, same outfit (soft pink yukata with white cherry blossom pattern, darker pink obi, wooden geta sandals), same black hair in odango buns with pink ribbons. CRITICAL: Eyes MUST be tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 7: "Lights in the night. I can see!"
        "name": "page7",
        "prompt": "Show a wider view of the Japanese night garden now glowing with many lit traditional Japanese stone lanterns. The character from the reference image stands in the middle of the garden, arms spread wide, looking around in wonder at all the beautiful lights. The lanterns reflect in the still pond. Fireflies add extra sparkle. Stars fill the sky above. Cherry blossom petals catch the golden light. The scene is magical and warm. Same character, same outfit (soft pink yukata with white cherry blossom pattern, darker pink obi, wooden geta sandals), same black hair in odango buns with pink ribbons. CRITICAL: Eyes MUST be tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 8: "Day and night! I say 'Yay!'"
        "name": "page8",
        "prompt": "Show the character from the reference image jumping happily with arms raised in celebration in the beautiful lit Japanese night garden. All the traditional Japanese stone lanterns glow warmly around the child. The night sky is full of stars. The original stone lantern from the first pages is prominent in the foreground, now lit and beautiful. The child has a huge joyful smile. Cherry blossoms float in the air. The curved wooden bridge and pond are visible in the background, all illuminated by the magical lantern light. Same character, same outfit (soft pink yukata with white cherry blossom pattern, darker pink obi, wooden geta sandals), same black hair in odango buns with pink ribbons. CRITICAL: Eyes MUST be tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Landscape orientation.",
    },
]}

# ═══════════════════════════════════════════════════════════════════
# LEVEL 2.2 — "Hot Food, Cool Moon" (UK street-food night market)
# Story written 2026-07-22. White English revert family:
# girl in soft pink hijab (hero) + mum in sage-green hijab (side hero).
# ═══════════════════════════════════════════════════════════════════
# SETTING (use EXACT phrase): "a British street-food night market held in the
#   cobbled market square of an English town — red-brick Victorian terraced
#   buildings with grey slate roofs, sash windows and chimney pots line both
#   sides, rows of food stalls under striped canopies stand on the grey
#   cobblestones, triangular bunting and strings of warm glowing fairy lights
#   are strung between the buildings, a black cast-iron Victorian lamppost
#   glows nearby, and a dark blue evening sky sits above the rooftops"
#   The word "British" on its own does NOT read as Britain — the first version
#   (07-22) produced a generic placeless night market on bare sand, and only
#   page 1 looked English because it happened to mention a town street and
#   rooftops. Lynden's note: every spread must carry the architecture. Close-up
#   pages restate the brick terraces / slate roofs / chimney pots / cobbles
#   rather than just saying "market stalls behind her".
# KEY OBJECTS (identical wording in every prompt where they appear):
#   BOWL = "a white paper food bowl with a red rim, filled with a neat coiled
#           nest of short golden noodles that sits down inside the bowl below
#           the rim"  — and NO CHOPSTICKS anywhere in the book. Lynden, 07-22:
#           "the noodles are so weird ... chopsticks float in the air in every
#           picture". The prompts never asked for chopsticks; the model infers
#           them from "noodles" and then draws them unattached. Every scene now
#           bans them and requires any fork to be gripped in a closed hand.
#   WOK  = "a large black steel wok with gentle steam rising (no dramatic flames)"
#   MOON = "a big pale yellow full moon"
#   MAT  = "a red-and-white checked picnic blanket"
SCENE_PROMPTS["2.2"] = {
    "title": "Hot Food, Cool Moon",
    "scenes": [
    {
        # COVER
        "name": "cover",
        "side_hero": True,
        "prompt": "BOOK COVER ILLUSTRATION. Show the character from the reference image standing happily holding a white paper food bowl with a red rim, filled to the rim with a tidy rounded mound of curled golden noodles whose surface is UNBROKEN — absolutely no chopsticks, no fork and not one single noodle strand rising, lifting, standing up or dangling above the bowl, and nothing whatsoever floating unattached in the air above it, with her mum (from reference image 2) crouched warmly beside her. Behind them a British street-food night market held in the cobbled market square of an English town — red-brick Victorian terraced buildings with grey slate roofs, sash windows and chimney pots line both sides, rows of food stalls under striped canopies stand on the grey cobblestones, triangular bunting and strings of warm glowing fairy lights are strung between the buildings, a black cast-iron Victorian lamppost glows nearby, and a dark blue evening sky sits above the rooftops. A big pale yellow full moon glows above the stalls. Same girl, same outfit (soft pink hijab, mustard-yellow long-sleeved top, navy trousers, white trainers). The mum wears a soft sage-green hijab, cream cardigan, long navy dress. Cosy, glowing, joyful mood. The market is busy and staffed: a friendly stallholder stands behind EVERY stall serving customers, and ordinary shoppers browse between them — a mixed everyday British crowd of men, women, children, teenagers and older people, a range of skin tones and hair colours, in normal British clothes (coats, jumpers, jeans, caps, a pushchair, a dog on a lead). Only the girl and her mum wear a hijab — do NOT put hijabs or headscarves on the background women. No stall may be empty, bare or unattended. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever, no iris, no highlights. Every stall sign, price board and shop window MUST be completely BLANK — no letters, words, numbers or scribbled writing anywhere (invented lettering confuses an early reader). ABSOLUTELY NO CHOPSTICKS anywhere in the picture. Nothing may stick up out of the bowl and nothing may float unattached in the air — no chopsticks, no cutlery standing in the food, no noodle strands hanging in mid-air. Any utensil must be a small wooden fork held firmly in a character's fingers, with the hand clearly closed around the handle. No text. Portrait orientation.",
    },
    {
        # Page 1: "The sun dips low. I go with my mum to get food."
        "name": "page1",
        "side_hero": True,
        "prompt": "SUNSET SCENE — warm orange-pink sky, the sun dipping low behind rooftops. Show the character from the reference image walking hand-in-hand with her mum (from reference image 2) along a British town street towards a street-food night market visible ahead — food stalls under striped canopies with strings of fairy lights just switching on. The girl skips slightly, excited. Same girl, same outfit (soft pink hijab, mustard-yellow long-sleeved top, navy trousers, white trainers). The mum wears a soft sage-green hijab, cream cardigan, long navy dress. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever. Every stall sign, price board and shop window MUST be completely BLANK — no letters, words, numbers or scribbled writing anywhere (invented lettering confuses an early reader). ABSOLUTELY NO CHOPSTICKS anywhere in the picture. Nothing may stick up out of the bowl and nothing may float unattached in the air — no chopsticks, no cutlery standing in the food, no noodle strands hanging in mid-air. Any utensil must be a small wooden fork held firmly in a character's fingers, with the hand clearly closed around the handle. No text. Landscape orientation.",
    },
    {
        # Page 2: "It is night. Food shops in a row! Yum!"
        "name": "page2",
        "prompt": "NIGHT SCENE. Show the character from the reference image standing in a British street-food night market held in the cobbled market square of an English town — red-brick Victorian terraced buildings with grey slate roofs, sash windows and chimney pots line both sides, rows of food stalls under striped canopies stand on the grey cobblestones, triangular bunting and strings of warm glowing fairy lights are strung between the buildings, a black cast-iron Victorian lamppost glows nearby, and a dark blue evening sky sits above the rooftops. The stalls stretch away in a neat row, each glowing warmly with different food. The girl looks along the row with delight, hands clasped. Every stall sign, price board and shop window MUST be completely BLANK — no letters, no words, no numbers, no scribbled writing anywhere in the picture (invented lettering confuses an early reader). The market is busy and staffed: a friendly stallholder stands behind EVERY stall serving customers, and ordinary shoppers browse between them — a mixed everyday British crowd of men, women, children, teenagers and older people, a range of skin tones and hair colours, in normal British clothes (coats, jumpers, jeans, caps, a pushchair, a dog on a lead). Only the girl and her mum wear a hijab — do NOT put hijabs or headscarves on the background women. No stall may be empty, bare or unattended. Same girl, same outfit (soft pink hijab, mustard-yellow long-sleeved top, navy trousers, white trainers). ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever. Every stall sign, price board and shop window MUST be completely BLANK — no letters, words, numbers or scribbled writing anywhere (invented lettering confuses an early reader). ABSOLUTELY NO CHOPSTICKS anywhere in the picture. Nothing may stick up out of the bowl and nothing may float unattached in the air — no chopsticks, no cutlery standing in the food, no noodle strands hanging in mid-air. Any utensil must be a small wooden fork held firmly in a character's fingers, with the hand clearly closed around the handle. No text. Landscape orientation.",
    },
    {
        # Page 3: "I see a man at a big wok. Hiss! Pop! The food hops!"
        "name": "page3",
        "prompt": "NIGHT SCENE at a food stall. Show the character from the reference image watching a friendly street-food chef in an apron tossing noodles in a large black steel wok with gentle steam rising (no dramatic flames). Little pieces of food hop up from the wok mid-toss. The girl watches wide with wonder, up on her tiptoes at the counter. A striped canopy above the stall, and behind it red-brick Victorian terraced buildings with grey slate roofs and chimney pots, triangular bunting and strings of warm fairy lights, grey cobblestones underfoot, dark blue evening sky. Same girl, same outfit (soft pink hijab, mustard-yellow long-sleeved top, navy trousers, white trainers). ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever, including the chef. Every stall sign, price board and shop window MUST be completely BLANK — no letters, words, numbers or scribbled writing anywhere (invented lettering confuses an early reader). ABSOLUTELY NO CHOPSTICKS anywhere in the picture. Nothing may stick up out of the bowl and nothing may float unattached in the air — no chopsticks, no cutlery standing in the food, no noodle strands hanging in mid-air. Any utensil must be a small wooden fork held firmly in a character's fingers, with the hand clearly closed around the handle. No text. Landscape orientation.",
    },
    {
        # Page 4: "Mum gets me a bowl. Ooh! It is too hot!"
        "name": "page4",
        "side_hero": True,
        "prompt": "NIGHT SCENE. Show the mum (from reference image 2) smiling and handing the character from the reference image a white paper food bowl with a red rim, filled to the rim with a tidy rounded mound of curled golden noodles whose surface is UNBROKEN — absolutely no chopsticks, no fork and not one single noodle strand rising, lifting, standing up or dangling above the bowl, and nothing whatsoever floating unattached in the air above it, with visible curly steam lines rising from it. The girl reaches up for it with both hands, mouth in a little 'ooh'. If the moon is visible it must be the same big pale yellow FULL moon as the rest of the book — never a crescent. The market is busy and staffed: a friendly stallholder stands behind EVERY stall serving customers, and ordinary shoppers browse between them — a mixed everyday British crowd of men, women, children, teenagers and older people, a range of skin tones and hair colours, in normal British clothes (coats, jumpers, jeans, caps, a pushchair, a dog on a lead). Only the girl and her mum wear a hijab — do NOT put hijabs or headscarves on the background women. No stall may be empty, bare or unattended. A striped-canopy food stall behind them, and beyond it red-brick Victorian terraced buildings with grey slate roofs and chimney pots, triangular bunting and strings of warm fairy lights, grey cobblestones underfoot, dark blue evening sky. Same girl, same outfit (soft pink hijab, mustard-yellow long-sleeved top, navy trousers, white trainers). The mum wears a soft sage-green hijab, cream cardigan, long navy dress. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever. Every stall sign, price board and shop window MUST be completely BLANK — no letters, words, numbers or scribbled writing anywhere (invented lettering confuses an early reader). ABSOLUTELY NO CHOPSTICKS anywhere in the picture. Nothing may stick up out of the bowl and nothing may float unattached in the air — no chopsticks, no cutlery standing in the food, no noodle strands hanging in mid-air. Any utensil must be a small wooden fork held firmly in a character's fingers, with the hand clearly closed around the handle. No text. Landscape orientation.",
    },
    {
        # Page 5: "I huff and puff on it. Huff! Puff! This is no fun!"
        "name": "page5",
        "prompt": "NIGHT SCENE. Show the character from the reference image holding a white paper food bowl with a red rim, filled to the rim with a tidy rounded mound of curled golden noodles whose surface is UNBROKEN — absolutely no chopsticks, no fork and not one single noodle strand rising, lifting, standing up or dangling above the bowl, and nothing whatsoever floating unattached in the air above it, cheeks puffed out BLOWING across the top of it — small curved puff-of-air lines from her mouth and curly steam lines still rising from the bowl. She is NOT eating: the food is far too hot, so she holds the bowl away from her face, there is NO food in her mouth and NO noodles touching or near her lips. Her eyebrows tilt in comic frustration. The market is busy and staffed: a friendly stallholder stands behind EVERY stall serving customers, and ordinary shoppers browse between them — a mixed everyday British crowd of men, women, children, teenagers and older people, a range of skin tones and hair colours, in normal British clothes (coats, jumpers, jeans, caps, a pushchair, a dog on a lead). Only the girl and her mum wear a hijab — do NOT put hijabs or headscarves on the background women. No stall may be empty, bare or unattended. She stands on the grey cobblestones beside a striped-canopy market stall. Behind her, red-brick Victorian terraced buildings with grey slate roofs and chimney pots, striped stall canopies, triangular bunting and strings of warm fairy lights, all standing on grey cobblestones. Dark blue evening sky. Same girl, same outfit (soft pink hijab, mustard-yellow long-sleeved top, navy trousers, white trainers). ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever. Every stall sign, price board and shop window MUST be completely BLANK — no letters, words, numbers or scribbled writing anywhere (invented lettering confuses an early reader). ABSOLUTELY NO CHOPSTICKS anywhere in the picture. Nothing may stick up out of the bowl and nothing may float unattached in the air — no chopsticks, no cutlery standing in the food, no noodle strands hanging in mid-air. Any utensil must be a small wooden fork held firmly in a character's fingers, with the hand clearly closed around the handle. No text. Landscape orientation.",
    },
    {
        # Page 6: "Mum said, 'Sit with me. See the moon!'"
        "name": "page6",
        "side_hero": True,
        "prompt": "NIGHT SCENE at the edge of the market square. Show the mum (from reference image 2) sitting on a red-and-white checked picnic blanket, patting the space beside her and pointing up at a big pale yellow full moon in the dark blue evening sky. The character from the reference image walks over to her, still carefully holding a white paper food bowl with a red rim, filled to the rim with a tidy rounded mound of curled golden noodles whose surface is UNBROKEN — absolutely no chopsticks, no fork and not one single noodle strand rising, lifting, standing up or dangling above the bowl, and nothing whatsoever floating unattached in the air above it. They are on a small grassy green at the edge of the cobbled market square, with red-brick Victorian terraced buildings with slate roofs and chimney pots and the glowing striped stalls behind them. Calm, gentle mood — but the market behind them is still open and staffed: a stallholder stands behind every stall and a few ordinary British shoppers of different ages and skin tones are still browsing; no stall is empty or unattended. The girl carries the bowl level in BOTH hands with NOTHING sticking out of it — no fork and no chopsticks standing up in the noodles. Same girl, same outfit (soft pink hijab, mustard-yellow long-sleeved top, navy trousers, white trainers). The mum wears a soft sage-green hijab, cream cardigan, long navy dress. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever. Every stall sign, price board and shop window MUST be completely BLANK — no letters, words, numbers or scribbled writing anywhere (invented lettering confuses an early reader). ABSOLUTELY NO CHOPSTICKS anywhere in the picture. Nothing may stick up out of the bowl and nothing may float unattached in the air — no chopsticks, no cutlery standing in the food, no noodle strands hanging in mid-air. Any utensil must be a small wooden fork held firmly in a character's fingers, with the hand clearly closed around the handle. No text. Landscape orientation.",
    },
    {
        # Page 7: "The moon is big and yellow! Then I dig in. Not hot! Yum, yum, yum!"
        "name": "page7",
        "prompt": "NIGHT SCENE. Show the character from the reference image sitting cross-legged on a red-and-white checked picnic blanket happily eating a forkful of noodles, a small wooden fork gripped firmly in her fist with her fingers closed around the handle, lifting it from a white paper food bowl with a red rim — NO steam rising now, the food has cooled. Above her a big pale yellow full moon fills the dark blue evening sky. She beams with joy mid-bite. The market is busy and staffed: a friendly stallholder stands behind EVERY stall serving customers, and ordinary shoppers browse between them — a mixed everyday British crowd of men, women, children, teenagers and older people, a range of skin tones and hair colours, in normal British clothes (coats, jumpers, jeans, caps, a pushchair, a dog on a lead). Only the girl and her mum wear a hijab — do NOT put hijabs or headscarves on the background women. No stall may be empty, bare or unattended. They are on a small grassy green at the edge of the cobbled market square, with red-brick Victorian terraced buildings with slate roofs and chimney pots and the glowing striped stalls behind them. Same girl, same outfit (soft pink hijab, mustard-yellow long-sleeved top, navy trousers, white trainers). ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever. Every stall sign, price board and shop window MUST be completely BLANK — no letters, words, numbers or scribbled writing anywhere (invented lettering confuses an early reader). ABSOLUTELY NO CHOPSTICKS anywhere in the picture. Nothing may stick up out of the bowl and nothing may float unattached in the air — no chopsticks, no cutlery standing in the food, no noodle strands hanging in mid-air. Any utensil must be a small wooden fork held firmly in a character's fingers, with the hand clearly closed around the handle. No text. Landscape orientation.",
    },
    {
        # Page 8: "We sit low on the mat. The night is cool. I am with my mum. It is fun!"
        "name": "page8",
        "side_hero": True,
        "prompt": "NIGHT SCENE, calm and cosy. Show the character from the reference image and her mum (from reference image 2) sitting together on a red-and-white checked picnic blanket, the girl leaning snugly against her mum's side, both looking up at a big pale yellow full moon in the dark blue evening sky. The empty white paper food bowl with a red rim sits on the blanket beside them. They are on a small grassy green at the edge of the cobbled market square, with red-brick Victorian terraced buildings with slate roofs and chimney pots and the glowing striped stalls behind them. A beautiful quiet family moment. The market is busy and staffed: a friendly stallholder stands behind EVERY stall serving customers, and ordinary shoppers browse between them — a mixed everyday British crowd of men, women, children, teenagers and older people, a range of skin tones and hair colours, in normal British clothes (coats, jumpers, jeans, caps, a pushchair, a dog on a lead). Only the girl and her mum wear a hijab — do NOT put hijabs or headscarves on the background women. No stall may be empty, bare or unattended. Same girl, same outfit (soft pink hijab, mustard-yellow long-sleeved top, navy trousers, white trainers). The mum wears a soft sage-green hijab, cream cardigan, long navy dress. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever. Every stall sign, price board and shop window MUST be completely BLANK — no letters, words, numbers or scribbled writing anywhere (invented lettering confuses an early reader). ABSOLUTELY NO CHOPSTICKS anywhere in the picture. Nothing may stick up out of the bowl and nothing may float unattached in the air — no chopsticks, no cutlery standing in the food, no noodle strands hanging in mid-air. Any utensil must be a small wooden fork held firmly in a character's fingers, with the hand clearly closed around the handle. No text. Landscape orientation.",
    },
]}

# ═══════════════════════════════════════════════════════════════════
# LEVEL 2.3 — "Morning on the Farm" (Kenyan highlands farm)
# ═══════════════════════════════════════════════════════════════════
SCENE_PROMPTS["2.3"] = {
    "title": "Morning on the Farm",
    # SETTING: Kenyan highlands small farm. Lush green hills, red-brown earth,
    # banana trees, maize/corn fields, simple stone/wooden farmstead with
    # corrugated tin roof. Warm tropical light. NOT savanna/safari.
    # Object consistency: flashlight = bright yellow plastic battery-powered flashlight.
    # Kid (baby goat) = small white baby goat with floppy ears.
    # Jar = large glass jar with dried corn kernels inside.
    # Fork = garden fork (4 metal prongs, wooden handle).
    # EYE RULE: ALL characters (boy, dad, animals) must have tiny solid black dot eyes.
    # CHARACTER: Kenyan boy ~5yo with VERY DARK skin, buzz cut, orange t-shirt, blue trousers.
    # SECONDARY CHARACTER: Dad — tall Kenyan man, VERY DARK skin, buzz cut, dark green shirt,
    #   brown trousers, dark brown wellies. Present in every scene as secondary figure.
    # PROMPT RULES: Use "Show the character from the reference image" pattern for hero injection.
    "scenes": [
    {
        # COVER
        "name": "cover",
        "side_hero": True,
        "prompt": "BOOK COVER ILLUSTRATION. Show the character from the reference image standing at a wooden farm gate, looking excited and pointing ahead. His father (from reference image 2) stands behind him with a hand on the boy's shoulder, smiling warmly. Behind them a beautiful Kenyan highlands farm — rolling green hills, banana trees, a simple stone farmhouse with corrugated tin roof. A small white baby goat with floppy ears peeks through the gate. Same character, same outfit (bright orange t-shirt, dark blue trousers, dusty brown boots, colourful woven bracelet), same closely shaved buzz cut, same VERY DARK skin (deep dark brown-black). The father wears a dark green shirt, brown trousers, dark brown wellies — also VERY DARK skin. Warm sunny day. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — like two small dots drawn with a black marker pen. There must be NO white whatsoever in or around the eyes. No iris, no sclera, no highlights. Just plain black dots. No text. Portrait orientation.",
    },
    {
        # Page 1: "We go far in the car. I can see a farm!"
        "name": "page1",
        "side_hero": True,
        "prompt": "Show the character from the reference image sitting in the BACK SEAT of a small blue car, wearing a seat belt, looking out the window excitedly and pointing ahead at a Kenyan highlands farm visible through the windshield. His father (from reference image 2) is in the FRONT SEAT DRIVING — we see the father's hands on the steering wheel and part of his face/shoulders from behind. The boy is clearly a PASSENGER in the back, NOT the driver. Red-brown dirt road, stone farmhouse with tin roof ahead, banana trees, green rolling hills. Sunny day, bright blue sky. Same character, same outfit (orange t-shirt, blue trousers), same closely shaved buzz cut, same VERY DARK skin (deep dark brown-black). ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever. No text. Landscape orientation.",
    },
    {
        # Page 2: "The farm is big! I see a yard with corn in a jar."
        "name": "page2",
        "side_hero": True,
        "prompt": "Show the character from the reference image standing in a large open farmyard, looking around with amazement at how big it is. His father (from reference image 2) is visible in the mid-ground, leaning on a wooden fence with a smile, watching his son explore. A large glass jar filled with dried yellow corn kernels sits on a wooden table nearby. Red-brown earth, wooden fences, green tropical plants. Kenyan highlands with rolling hills behind. Same character, same outfit (orange t-shirt, dark blue trousers, dusty brown boots), same closely shaved buzz cut, same VERY DARK skin (deep dark brown-black, NOT medium brown). The father wears dark green shirt, brown trousers, dark brown wellies — same VERY DARK skin. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever. No text. Landscape orientation.",
    },
    {
        # Page 3: "I get a fork for the garden. I dig, dig, dig! Good food for the farm."
        "name": "page3",
        "side_hero": True,
        "prompt": "Show the character from the reference image digging energetically in red-brown earth with a garden fork (4 metal prongs, wooden handle), grinning with effort. His father (from reference image 2) works nearby in the garden, hoeing or carrying a bucket. A lush vegetable garden with rows of green leafy plants. Kenyan farmstead in the background. Bright sunny day. Same character, same outfit (orange t-shirt, dark blue trousers, dusty brown boots), same closely shaved buzz cut, same VERY DARK skin (deep dark brown-black). The father wears dark green shirt, brown trousers, wellies — same VERY DARK skin. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever. No text. Landscape orientation.",
    },
    {
        # Page 4: "Now it is dark. I look at the barn. I need to look in the barn!"
        "name": "page4",
        "side_hero": True,
        "prompt": "DUSK SCENE — orange-purple sunset sky. Show the character from the reference image standing in a farmyard next to his father (from reference image 2), both looking curiously at a large wooden barn. CRITICAL PROPORTIONS: The barn must be MUCH LARGER than the characters — at least 3-4 times the boy's height. The barn dominates the background. The boy points at the barn curiously, the father stands beside him. The barn door is slightly open. Warm orange sunset light. Mysterious and intriguing mood. Kenyan highlands, acacia trees in the distance. Same character, same outfit (orange t-shirt, blue trousers, dusty brown boots), same VERY DARK skin. Father in dark green shirt, brown trousers, same VERY DARK skin. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever. No text. Landscape orientation.",
    },
    {
        # Page 5: "I get a torch for the dark. I march to the big barn door."
        "name": "page5",
        "side_hero": True,
        "prompt": "NIGHT SCENE. Show the character from the reference image walking purposefully along a red-brown dirt path towards a big wooden barn, holding a bright yellow PLASTIC BATTERY-POWERED FLASHLIGHT (modern electric torch — NOT a fire torch, NOT flames, NOT medieval). The flashlight has a bright white beam cutting through the darkness. His father (from reference image 2) walks alongside the boy towards the barn. Stars in the night sky. The barn looms ahead. The boy has a brave, determined expression. Same character, same outfit (orange t-shirt, blue trousers, dusty brown boots), same closely shaved buzz cut, same VERY DARK skin. Father in dark green shirt, brown trousers, same VERY DARK skin. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever. ABSOLUTELY NO FIRE OR FLAMES ANYWHERE IN THIS IMAGE. No text. Landscape orientation.",
    },
    {
        # Page 6: "It is dark in the barn. I look far into a corner. I see a thing!"
        "name": "page6",
        "side_hero": True,
        "prompt": "INSIDE A DARK BARN. Show the character from the reference image shining a bright yellow PLASTIC BATTERY-POWERED FLASHLIGHT (modern electric torch — NOT fire, NOT flames) into a dark corner of the barn. The flashlight beam illuminates something in the far corner — a shape in the hay (partially hidden, mysterious). The boy leans forward, peering curiously. His father (from reference image 2) stands behind/beside the boy in the barn. Wooden barn walls, hay bales. Same character, same outfit (orange t-shirt, blue trousers), same closely shaved buzz cut, same VERY DARK skin. Father in dark green shirt, same VERY DARK skin. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever. ABSOLUTELY NO FIRE, NO CANDLES, NO FLAME TORCHES ANYWHERE. No text. Landscape orientation.",
    },
    {
        # Page 7: "A kid! Born this morning! Her mum is with her."
        "name": "page7",
        "side_hero": True,
        "prompt": "INSIDE THE BARN, warm morning light filtering through wooden slats. Show the character from the reference image kneeling in golden hay, looking delighted and amazed. His father (from reference image 2) crouches nearby, also looking at the animals with a warm proud smile. In front of them: a tiny newborn white baby goat (kid) with floppy ears lying in the hay next to its brown mother goat. The baby goat is very small and cute. Warm golden light fills the scene — from morning sunlight through barn walls, NOT from any fire or torch. Same character, same outfit (orange t-shirt, blue trousers), same VERY DARK skin. Father in dark green shirt, same VERY DARK skin. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever. ABSOLUTELY NO FIRE, NO FLAMING WALL TORCHES, NO OPEN FLAMES NEAR HAY. No text. Landscape orientation.",
    },
    {
        # Page 8: "I hug the warm kid with my dad. This farm is too good! I wish I had a farm!"
        "name": "page8",
        "side_hero": True,
        "prompt": "Warm golden morning light. Show the character from the reference image sitting in golden hay near the open barn door, gently hugging a tiny white baby goat (kid) against his chest, beaming with pure joy. His father (from reference image 2) sits beside the boy with his arm around the boy's shoulder, smiling proudly. The brown mother goat stands nearby. Warm morning sunlight streams through the open barn doors. Green Kenyan hills visible outside. A beautiful, warm family moment. Same character, same outfit (orange t-shirt, blue trousers), same closely shaved buzz cut, same VERY DARK skin. Father in dark green shirt, same VERY DARK skin. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever. No text. Landscape orientation.",
    },
]}

# ═══════════════════════════════════════════════════════════════════
# LEVEL 2.4 — "The Fair in the Air" (British village fair)
# ═══════════════════════════════════════════════════════════════════
SCENE_PROMPTS["2.4"] = {
    "title": "The Fair in the Air",
    # CHARACTER: Mixed heritage boy in orange jacket — outdoor explorer at a village fair
    # - "bright orange zip-up jacket with small yellow lightning bolt, dark green cargo trousers, brown boots"
    # - "curly dark brown messy hair, warm medium brown skin"
    #
    # KEY OBJECTS (MUST be identical in ALL prompts):
    # - PAIR OF TOY DUCKS: "a pair of cute yellow rubber toy ducks with orange beaks, small and round"
    # - FIR TREE: "a big dark green fir tree (conifer/evergreen) with a thick trunk, standing at the edge of the fair"
    # - FAIR STALL: "a colourful wooden fair stall with red and white striped awning, games and prizes on shelves"
    # - SIR (fair worker): "a kind-looking older man with a flat cap, brown apron, warm smile, ruddy cheeks"
    # SETTING: classic British village fair — green field, colourful bunting, stalls, balloons,
    #   a church spire in the background, blue sky with fluffy white clouds, breezy weather
    # EYES: MANDATORY — every character MUST have ONLY tiny solid black filled circles for eyes. ABSOLUTELY CRITICAL.
    "scenes": [
    {
        # COVER: Boy at the fair with things in the air
        "name": "cover",
        "prompt": "BOOK COVER ILLUSTRATION. Show the character from the reference image standing in a vibrant British village fair, looking up with excitement as colourful balloons and bunting blow in the breeze above him. Colourful wooden fair stalls with red and white striped awnings surround him. A big dark green fir tree stands at the edge of the fair. A church spire visible behind the stalls. Blue sky with fluffy white clouds. The child holds a pair of cute yellow rubber toy ducks with orange beaks. Same character, same outfit (bright orange zip-up jacket with small yellow lightning bolt on chest, dark green cargo trousers with big pockets, sturdy brown lace-up boots), same curly dark brown messy hair, same warm medium brown skin, same appearance as reference. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — like two small dots drawn with a black marker pen. There must be NO white whatsoever in or around the eyes. No iris, no sclera, no highlights. Just plain black dots. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text. Portrait orientation.",
    },
    {
        # Page 1: "I go to the fair! I can see it. The air is cool. The fair is so big!"
        "name": "page1",
        "prompt": "Show the character from the reference image arriving at a British village fair, walking through the entrance with wide-eyed excitement. The fair stretches out before him — colourful wooden stalls with red and white striped awnings, bunting strung between tall poles, balloons bobbing in the breeze. A cool breeze blows through the scene — bunting fluttering, the child's curly hair blowing. Green grassy field, a church spire in the background, blue sky with fluffy white clouds. Same character, same outfit (bright orange zip-up jacket with yellow lightning bolt, dark green cargo trousers, brown boots), same curly dark brown messy hair, same warm medium brown skin. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds. No text. Landscape orientation.",
    },
    {
        # Page 2: "The air is in my hair! It is such a gush! I put my hat on."
        "name": "page2",
        "prompt": "Show the character from the reference image near a carousel/merry-go-round at the British village fair. A strong gust of wind blows — his hair flies wildly and he presses a red woolly hat onto his head with both hands, grinning. Around him, streamers and bunting whip in the wind. The carousel has brightly painted horses. Different area of the fair from page 1 — we are now deeper inside the fair. Church spire visible in the distance. Blue sky with fast-moving clouds. Same character, same outfit (orange jacket with lightning bolt, green cargo trousers, brown boots), same warm medium brown skin, same appearance as reference. ABSOLUTELY CRITICAL — THIS IS THE MOST IMPORTANT RULE: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — completely black, NO white anywhere in or around the eyes. Do NOT draw irises, do NOT draw white sclera, do NOT draw any eye detail. Just two small plain solid black dots like a teddy bear. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds. No text. Landscape orientation.",
    },
    {
        # Page 3: "Look! Toy ducks, a pair! \"I can win!\" I say."
        "name": "page3",
        "prompt": "Show the character from the reference image at a different area of the fair — a row of game stalls with colourful canopies. He has spotted a pair of cute yellow rubber toy ducks with orange beaks hanging as prizes at one stall. He points up at the ducks on the prize hook, bouncing on his toes with excitement, mouth open saying something eagerly. The stall has a 'hook-a-duck' water game with floating rubber ducks. Warm afternoon light, other families visible at stalls further down the row. Church spire peeking above the stall roofs. Same character, same outfit (orange jacket with lightning bolt, green cargo trousers, brown boots), same warm medium brown skin, same appearance as reference. ABSOLUTELY CRITICAL — THIS IS THE MOST IMPORTANT RULE: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — completely black, NO white anywhere in or around the eyes. Do NOT draw irises, do NOT draw white sclera, do NOT draw any eye detail. Just two small plain solid black dots like a teddy bear. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds. No text. Landscape orientation.",
    },
    {
        # Page 4: "\"Yes!\" I say. I win the pair! I hug my pair. My pair is so good!"
        "name": "page4",
        "prompt": "Show the character from the reference image at the fair stall, jumping with joy and hugging a pair of cute yellow rubber toy ducks with orange beaks tightly to his chest. The stall worker smiles and claps. The child beams with pure happiness, squeezing the toy ducks lovingly. Colourful stalls, bunting, green field behind. Same character, same outfit (orange jacket with lightning bolt, green cargo trousers, brown boots), same curly dark brown messy hair, same warm medium brown skin. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds. No text. Landscape orientation.",
    },
    {
        # Page 5: "A big gush! My pair is up in the air! No! No! My pair!"
        "name": "page5",
        "prompt": "Show the character from the reference image at the fair, looking up in horror and reaching desperately as a strong gust of wind blows his pair of cute yellow rubber toy ducks with orange beaks UP into the air above the fair! The toy ducks tumble and spin high above the stalls. The child's mouth is open in shock, arms stretched upward trying to catch them. Bunting and ribbons blow wildly. Other fair items caught in the wind. Dramatic moment. Same character, same outfit (orange jacket with lightning bolt, green cargo trousers, brown boots), same curly dark brown messy hair, same warm medium brown skin. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds. No text. Landscape orientation.",
    },
    {
        # Page 6: "\"Sir! Sir! My pair is in the air!\" The sir said, \"I can see it! By the fir!\""
        "name": "page6",
        "prompt": "Show the character from the reference image near the food and drink area of the fair — a DIFFERENT part of the fair from previous scenes. The child has run up to a kind-looking older man (a fair worker) with a flat cap, brown apron, warm smile, and ruddy cheeks who is standing near a tea stall. The child pulls at the man's sleeve, face desperate and worried, pointing upward. The kind sir looks up and points into the distance towards a big dark green fir tree visible at the edge of the fair field. Church spire visible in the background. Warm afternoon light. Same character, same outfit (orange jacket with lightning bolt, green cargo trousers, brown boots), same warm medium brown skin, same appearance as reference. The sir MUST look IDENTICAL to this description: older man, flat cap, brown apron, ruddy cheeks, warm smile. ABSOLUTELY CRITICAL — THIS IS THE MOST IMPORTANT RULE: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — completely black, NO white anywhere in or around the eyes. Do NOT draw irises, do NOT draw white sclera, do NOT draw any eye detail. Just two small plain solid black dots like a teddy bear. BOTH the child AND the sir must have these plain black dot eyes. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds. No text. Landscape orientation.",
    },
    {
        # Page 7: "The sir ran to the big fir. My pair is in the fir! He got my pair down!"
        "name": "page7",
        "prompt": "Show the character from the reference image and the kind older man (flat cap, brown apron, ruddy cheeks) at a big dark green fir tree at the edge of the fair. The sir reaches up into the low branches of the fir tree and pulls out the pair of cute yellow rubber toy ducks with orange beaks that were caught in the branches. The child stands below looking up with relief and joy, hands clasped together in hope. Green fir tree with thick trunk dominates the scene. Fair visible in the background. Same character, same outfit (orange jacket with lightning bolt, green cargo trousers, brown boots), same curly dark brown messy hair, same warm medium brown skin. ABSOLUTELY CRITICAL: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — NO white whatsoever. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds. No text. Landscape orientation.",
    },
    {
        # Page 8: "I hug my pair. I sit in a chair. The fair is fun! My pair is back!"
        "name": "page8",
        "prompt": "Show the character from the reference image sitting on a wooden bench near the village green at the EDGE of the fair — a quiet, peaceful spot away from the busy stalls. The child hugs a pair of cute yellow rubber toy ducks with orange beaks tightly against his chest, holding them up high near his face with a beaming, contented smile. A striped deckchair sits nearby. The fair is visible in the background — distant stalls, bunting, a few balloons. Church spire visible. Late afternoon golden sunshine bathes the scene in warm light. No secondary characters — just the child alone with his pair, peaceful and happy. Same character, same outfit (orange jacket with lightning bolt, green cargo trousers, brown boots), same warm medium brown skin, same appearance as reference. ABSOLUTELY CRITICAL — THIS IS THE MOST IMPORTANT RULE: ALL characters MUST have eyes that are ONLY tiny solid black filled circles — completely black, NO white anywhere in or around the eyes. Do NOT draw irises, do NOT draw white sclera, do NOT draw any eye detail. Just two small plain solid black dots like a teddy bear. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds. No text. Landscape orientation.",
    },
]}

# ═══════════════════════════════════════════════════════════════════
# LEVEL 2.6 — "The Night Fair" (Moroccan Night Market)
# ═══════════════════════════════════════════════════════════════════
SCENE_PROMPTS["2.6"] = {
    "title": "The Night Fair",
    # SETTING: Moroccan night market / souk in Marrakech style. Warm lantern
    # light, colourful textiles, food stalls, terracotta architecture, star-
    # filled sky, decorative tiles, hanging brass lanterns.
    "scenes": [
    {"name": "cover", "prompt": "BOOK COVER ILLUSTRATION. A cheerful girl stands at the entrance of a Moroccan night market. Warm glowing lanterns hang above, colourful textiles and stalls behind her. Starry night sky. Portrait orientation."},
    {"name": "page1", "prompt": "A girl walks through a dark street towards a glowing Moroccan night market entrance. Brass lanterns light the archway, stars above. She looks excited. Landscape orientation."},
    {"name": "page2", "prompt": "A girl looks up in wonder at strings of colourful lights hanging high between buildings in a Moroccan souk. Warm glow everywhere, decorative tiles on walls. Landscape orientation."},
    {"name": "page3", "prompt": "A girl stands at a toy stall in a Moroccan market. A local boy holds up a small toy car to show her. Colourful toys on shelves, warm lantern light. Landscape orientation."},
    {"name": "page4", "prompt": "A girl sits at a food stall eating corn on a fork. Glass jars of colourful food line the counter. Warm Moroccan market scene with terracotta walls. Landscape orientation."},
    {"name": "page5", "prompt": "A girl peers into a shadowy corner of the market. A small colourful bird perches on a wooden beam in the dark. Warm lantern glow from behind. Landscape orientation."},
    {"name": "page6", "prompt": "A girl stands in an open courtyard of the market, wind in her curly hair. A large low moon hangs in the dark blue sky above Moroccan rooftops. Peaceful scene. Landscape orientation."},
    {"name": "page7", "prompt": "A crowd of people in a Moroccan market cheer and point. A man gestures excitedly showing the way. Colourful lanterns and textiles around. Energetic scene. Landscape orientation."},
    {"name": "page8", "prompt": "A happy girl waves goodbye at the market exit. A big moon hangs in the starry sky above Moroccan buildings. Warm lantern light behind her. She smiles peacefully. Landscape orientation."},
    ]
}

# ═══════════════════════════════════════════════════════════════════
# LEVEL 3.1 — "The Big Bike Race" (Rural France)
# ═══════════════════════════════════════════════════════════════════
SCENE_PROMPTS["3.1"] = {
    "title": "The Big Bike Race",
    "scenes": [
    {
        # COVER: Child on bike at starting line with French countryside
        "name": "cover",
        "prompt": "BOOK COVER ILLUSTRATION. Show the character from the reference image sitting on a green bicycle at a starting line, looking determined and excited. French countryside behind: rolling green hills, lavender fields in the distance, a stone farmhouse with blue shutters, plane trees lining a country road. Other bikes visible at the starting line. Same character, same outfit (plain green cycling jersey, white helmet with green stripe, black shorts), same brown wavy hair, same freckles. CRITICAL: Eyes MUST be tiny solid black filled circles — NO white. Absolutely NO numbers or letters visible anywhere in the image. Whimsical children's book illustration. No text. Portrait orientation.",
    },
    {
        # Page 1: "Nine bikes at the gate. I take my place."
        "name": "page1",
        "prompt": "Show the character from the reference image on a green bicycle at a stone gate, lined up with other young cyclists. A French stone wall with a wooden gate marks the start. Rolling green countryside with wildflowers behind. A man in a cap holds a flag, ready to start the race. The child looks focused but excited. Same character, same outfit (plain green cycling jersey, white helmet, black shorts), same brown wavy hair, same freckles. CRITICAL: ALL characters MUST have eyes that are tiny solid black filled circles — NO white. Absolutely NO numbers or letters visible anywhere in the image. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 2: "'Ride to the lake and come back!' said the man."
        "name": "page2",
        "prompt": "Show the character from the reference image cycling fast along a French country road. The flag has dropped and bikes are racing. Plane trees line the road. A wooden signpost points forward (NO TEXT ON SIGN). Wind blows through the child's hair under the helmet. Other cyclists are ahead and behind. Same character, same outfit (plain green cycling jersey, white helmet, black shorts), same brown wavy hair, same freckles. CRITICAL: Eyes MUST be tiny solid black filled circles — NO white. Absolutely NO numbers or text visible anywhere in the image. Whimsical children's book illustration, sense of speed and movement. No text. Landscape orientation.",
    },
    {
        # Page 3: "Past a pine tree, past a stone gate."
        "name": "page3",
        "prompt": "Show the character from the reference image cycling past a tall pine tree on one side and a stone gate with climbing roses on the other. The child is overtaking other cyclists, leaning forward with determination. French countryside: rolling hills, stone walls, a distant village with a church spire. Same character, same outfit (plain green cycling jersey, white helmet), same brown wavy hair, same freckles. CRITICAL: Eyes MUST be tiny solid black filled circles — NO white. Absolutely NO numbers or text visible anywhere. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 4: "A slide on some gravel! A rider came off."
        "name": "page4",
        "prompt": "Show the character from the reference image cycling past a scene where another young rider (a girl with dark hair in a ponytail, wearing a plain red jersey) has fallen off her bike on a gravel section. The fallen rider sits on the ground giving a brave thumbs up and smile. Scattered gravel on the path. The main character glances back with concern but keeps riding. French countryside background. CRITICAL: ALL characters MUST have eyes that are tiny solid black filled circles — NO white. Absolutely NO numbers or text visible anywhere. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 5: "The lake! I made it just in time."
        "name": "page5",
        "prompt": "Show the character from the reference image arriving at a beautiful French lake. The child is cycling on a dirt path right next to the water, NOT on the water. The lake sparkles in sunshine, reeds grow at the edges, and calm reflections shimmer on the surface. The child is turning the bike around a small flag pole marker on the dirt path next to the lake, face showing triumph and effort. No one is swimming. Same character, same outfit (plain green cycling jersey, white helmet), same brown wavy hair, same freckles. CRITICAL: Eyes MUST be tiny solid black filled circles — NO white. Absolutely NO numbers or text visible anywhere. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 6: "Back I rode! I could see the line."
        "name": "page6",
        "prompt": "Show the character from the reference image cycling at full speed on the return leg, neck and neck with another cyclist. The stone gate finish line is visible ahead in the distance. Trees blur past. The child grits teeth with determination, legs pumping. French countryside road with plane trees. Same character, same outfit (plain green cycling jersey, white helmet), same brown wavy hair, same freckles. CRITICAL: Eyes MUST be tiny solid black filled circles — NO white. Absolutely NO numbers or text visible anywhere. Whimsical children's book illustration, dynamic movement. No text. Landscape orientation.",
    },
    {
        # Page 7: "Past it! I was past the line!"
        "name": "page7",
        "prompt": "Show the character from the reference image crossing the finish line first, arms raised in celebration on the bike! Other cyclists behind. A small crowd of people cheer. French stone wall and gate mark the finish. Bunting and a small banner (NO TEXT ON BANNER). The child's face shows pure joy and triumph. Same character, same outfit (plain green cycling jersey, white helmet), same brown wavy hair, same freckles. CRITICAL: ALL characters MUST have eyes that are tiny solid black filled circles — NO white. Absolutely NO numbers or text visible anywhere. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 8: "I got a prize — a plate with my name on it."
        "name": "page8",
        "prompt": "Show the character from the reference image standing proudly, holding up a small decorative ceramic plate trophy high above their head. The plate has a simple bike design on it (NO TEXT OR NUMBERS on the plate). A kind man in a cap is beside the child, clapping. Other children and parents around them applaud. French countryside setting with stone buildings and flowers. The child beams with a wide, wide grin. Same character, same outfit (plain green cycling jersey, white helmet), same brown wavy hair, same freckles. CRITICAL: ALL characters MUST have eyes that are tiny solid black filled circles — NO white. Absolutely NO numbers or text visible anywhere. Whimsical children's book illustration. No text. Landscape orientation.",
    },
]}

# ═══════════════════════════════════════════════════════════════════
# LEVEL 3.2 — "The Stone Flute" (Contemporary Casablanca apartment)
# ═══════════════════════════════════════════════════════════════════
# KEY OBJECTS (use EXACT descriptions in every prompt):
# STONE_FLUTE: "a small smooth pale sandy-coloured stone ocarina with a rounded oval shape, three small finger holes on top, and a curved mouthpiece, with subtle warm brown veins in the stone"
# WOODEN_BOX: "a large old-looking wooden box with carved Moroccan geometric patterns on the lid, dark brown aged wood, brass corner fittings"
# SETTING: "A warm modern Moroccan apartment living room with zellige-patterned blue and white floor tiles, cream walls with an arched doorway visible, a low sofa with colourful cushions (deep blue, saffron yellow, coral), a carved wooden shelf, warm natural light from a window, potted green plants"
# MUM: "a warm, friendly woman with olive/light brown skin and dark curly hair tied back, wearing a comfortable loose teal tunic top over dark trousers"
# DAD: "a friendly man with olive/light brown skin and short dark hair, wearing a simple light grey casual djellaba (traditional Moroccan house robe)"
SCENE_PROMPTS["3.2"] = {
    "title": "The Stone Flute",
    "scenes": [
    {
        # COVER: Girl playing stone flute in Moroccan apartment
        "name": "cover",
        "prompt": "BOOK COVER ILLUSTRATION. Show the character from the reference image standing in a warm modern Moroccan apartment living room, holding a small smooth pale sandy-coloured stone ocarina with a rounded oval shape, three small finger holes on top, and a curved mouthpiece, with subtle warm brown veins in the stone, up to her lips and blowing gently. She has a joyful, proud expression. Background: zellige-patterned blue and white floor tiles, cream walls with an arched doorway, a low sofa with colourful cushions (deep blue, saffron yellow, coral), warm natural light from a window. Same character, same outfit (coral pink t-shirt, dark navy leggings, brown house slippers), same dark curly ponytail, same olive/light brown skin. CRITICAL: Eyes MUST be tiny solid black filled circles — NO white. Absolutely NO text, words, letters, or numbers visible anywhere. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. Portrait orientation.",
    },
    {
        # Page 1: "Mum has a huge box at home. 'This is for you,' she said. What can be inside?"
        "name": "page1",
        "prompt": "Show the character from the reference image looking excited and curious at a large old-looking wooden box with carved Moroccan geometric patterns on the lid, dark brown aged wood, brass corner fittings, that a warm friendly woman with olive/light brown skin and dark curly hair tied back, wearing a comfortable loose teal tunic top over dark trousers (Mum) is presenting to her. The box sits on the floor. Setting: a warm modern Moroccan apartment living room with zellige-patterned blue and white floor tiles, cream walls with an arched doorway visible, a low sofa with colourful cushions (deep blue, saffron yellow, coral), warm natural light from a window, potted green plants. Same character, same outfit (coral pink t-shirt, dark navy leggings, brown house slippers), same dark curly ponytail, same olive/light brown skin. CRITICAL: ALL characters MUST have eyes that are tiny solid black filled circles — NO white. Absolutely NO text, words, letters, or numbers visible anywhere. Whimsical children's book illustration. Landscape orientation.",
        "side_hero": True,
        "side_hero_action": "Mum kneels beside the box, smiling warmly, gesturing towards it.",
    },
    {
        # Page 2: "I take the top off the box. Inside is a stone flute! It looks old but so cute."
        "name": "page2",
        "prompt": "Show the character from the reference image lifting the lid off a large old-looking wooden box with carved Moroccan geometric patterns on the lid, dark brown aged wood, brass corner fittings. Inside the open box, resting on soft cloth, is a small smooth pale sandy-coloured stone ocarina with a rounded oval shape, three small finger holes on top, and a curved mouthpiece, with subtle warm brown veins in the stone. The child's face shows amazement and delight. Setting: a warm modern Moroccan apartment living room with zellige-patterned blue and white floor tiles, cream walls with an arched doorway, colourful cushions on a low sofa, warm natural light. Same character, same outfit (coral pink t-shirt, dark navy leggings, brown house slippers), same dark curly ponytail, same olive/light brown skin. CRITICAL: Eyes MUST be tiny solid black filled circles — NO white. Absolutely NO text, words, letters, or numbers visible anywhere. Whimsical children's book illustration. Landscape orientation.",
    },
    {
        # Page 3: "I blow into the flute. What a rude, flat note! That is not a tune at all."
        "name": "page3",
        "prompt": "Show the character from the reference image blowing hard into a small smooth pale sandy-coloured stone ocarina with a rounded oval shape, three small finger holes on top, and a curved mouthpiece, with subtle warm brown veins in the stone. Her cheeks are puffed out, blowing too hard. Wavy lines around the flute suggest a terrible squeaky sound. Her expression is surprised and slightly dismayed at the bad sound. Setting: a warm modern Moroccan apartment living room with zellige-patterned blue and white floor tiles, cream walls, colourful cushions on a low sofa, warm natural light. Same character, same outfit (coral pink t-shirt, dark navy leggings, brown house slippers), same dark curly ponytail, same olive/light brown skin. CRITICAL: Eyes MUST be tiny solid black filled circles — NO white. Absolutely NO text, words, letters, or numbers visible anywhere. Whimsical children's book illustration. Landscape orientation.",
    },
    {
        # Page 4: "'Close your lips,' spoke Mum. 'Blow soft and slow, like this.' She gave a cute, sweet note."
        "name": "page4",
        "prompt": "Show a warm friendly woman with olive/light brown skin and dark curly hair tied back, wearing a comfortable loose teal tunic top over dark trousers (Mum) demonstrating how to play a small smooth pale sandy-coloured stone ocarina with a rounded oval shape, three small finger holes on top, and a curved mouthpiece, with subtle warm brown veins in the stone. Mum holds the flute gently to her lips with the NARROW MOUTHPIECE END at her mouth, blowing softly. Small musical note symbols float in the air (just simple curved shapes, NO text). The character from the reference image watches Mum closely, leaning in with focused attention. Setting: a warm modern Moroccan apartment living room with zellige-patterned blue and white floor tiles, cream walls with arched doorway, colourful cushions. Same child character, same outfit (coral pink t-shirt, dark navy leggings, brown house slippers), same dark curly ponytail, same olive/light brown skin. ABSOLUTELY CRITICAL — EYES: Every single character in this image MUST have eyes that are TINY SOLID BLACK FILLED CIRCLES with ZERO white. No sclera, no iris, no highlights, no white at all. Just plain tiny black dots like a teddy bear. Absolutely NO text, words, letters, or numbers visible anywhere. Whimsical children's book illustration. Landscape orientation.",
        "side_hero": True,
        "side_hero_action": "Mum holds the stone ocarina to her lips and blows gently, demonstrating.",
    },
    {
        # Page 5: "I use the flute like Mum said. A cute note rose up! I play note, note, note!"
        "name": "page5",
        "prompt": "Show the character from the reference image playing a small smooth pale sandy-coloured stone ocarina with a rounded oval shape, three small finger holes on top, and a curved mouthpiece, with subtle warm brown veins in the stone, correctly now — lips gently on the mouthpiece, fingers on the holes, blowing softly. Her expression is delighted and proud as she produces lovely notes. Small simple musical note symbols float upward in the air (just curved shapes, NO text). Setting: a warm modern Moroccan apartment living room with zellige-patterned blue and white floor tiles, cream walls, colourful cushions on a low sofa, warm natural light from window. Same character, same outfit (coral pink t-shirt, dark navy leggings, brown house slippers), same dark curly ponytail, same olive/light brown skin. CRITICAL: Eyes MUST be tiny solid black filled circles — NO white. Absolutely NO text, words, letters, or numbers visible anywhere. Whimsical children's book illustration. Landscape orientation.",
    },
    {
        # Page 6: "Those notes make a tune at last! The tune fills up the room. It is huge and sweet!"
        "name": "page6",
        "prompt": "Show the character from the reference image playing a small smooth pale sandy-coloured stone ocarina. She holds the ocarina correctly with the NARROW MOUTHPIECE END at her lips and her fingers covering the holes on the WIDE ROUNDED BODY of the instrument. She blows into the narrow end with confidence and joy. Many simple musical note symbols swirl through the air filling the entire room (just curved shapes, NO text). The room feels alive with music. Setting: a warm modern Moroccan apartment living room with zellige-patterned blue and white floor tiles, cream walls with arched doorway, a low sofa with colourful cushions (deep blue, saffron yellow, coral), carved wooden shelf, potted green plants, warm golden light. Same character, same outfit (coral pink t-shirt, dark navy leggings, brown house slippers), same dark curly ponytail, same olive/light brown skin. ABSOLUTELY CRITICAL — EYES: Her eyes MUST be TINY SOLID BLACK FILLED CIRCLES with ZERO white. No sclera, no iris, no highlights, no white at all. Just plain tiny black dots like a teddy bear. Absolutely NO text, words, letters, or numbers visible anywhere. Whimsical children's book illustration. Landscape orientation.",
    },
    {
        # Page 7: "The tune woke Dad from his nap. 'What a cute stone flute!' said Dad. He gave me a huge smile."
        "name": "page7",
        "prompt": "Show the character from the reference image holding a small smooth pale sandy-coloured stone ocarina with a rounded oval shape, three small finger holes on top, and a curved mouthpiece, with subtle warm brown veins in the stone, while a friendly man with olive/light brown skin and short dark hair, wearing a simple light grey casual djellaba (traditional Moroccan house robe) (Dad) has just appeared in the arched doorway, rubbing his eyes from a nap but giving a huge warm smile. The child looks happy and a bit sheepish. Setting: a warm modern Moroccan apartment living room with zellige-patterned blue and white floor tiles, cream walls, colourful cushions, warm light. Same child character, same outfit (coral pink t-shirt, dark navy leggings, brown house slippers), same dark curly ponytail, same olive/light brown skin. CRITICAL: ALL characters MUST have eyes that are tiny solid black filled circles — NO white. Absolutely NO text, words, letters, or numbers visible anywhere. Whimsical children's book illustration. Landscape orientation.",
        "side_hero": True,
        "side_hero_action": "Dad stands in the arched doorway, rubbing one eye but smiling warmly at the child.",
    },
    {
        # Page 8: "We all sit close to Mum. I play my stone flute and smile. The best tune fills the room!"
        "name": "page8",
        "prompt": "Show the character from the reference image sitting on a low sofa with colourful cushions (deep blue, saffron yellow, coral), playing a small smooth pale sandy-coloured stone ocarina with a rounded oval shape, three small finger holes on top, and a curved mouthpiece, with subtle warm brown veins in the stone, with a big proud happy smile. On one side sits a warm friendly woman with olive/light brown skin and dark curly hair tied back, wearing a comfortable loose teal tunic top over dark trousers (Mum), and on the other side sits a friendly man with olive/light brown skin and short dark hair, wearing a simple light grey casual djellaba (Dad). Both parents lean in close, looking proud and happy. Simple musical note symbols float in the warm room. Setting: a warm modern Moroccan apartment living room with zellige-patterned blue and white floor tiles, cream walls with arched doorway, carved wooden shelf, potted green plants, warm golden light. Same child character, same outfit (coral pink t-shirt, dark navy leggings, brown house slippers), same dark curly ponytail, same olive/light brown skin. CRITICAL: ALL characters MUST have eyes that are tiny solid black filled circles — NO white. Absolutely NO text, words, letters, or numbers visible anywhere. Whimsical children's book illustration. Landscape orientation.",
        "side_hero": True,
        "side_hero_action": "Mum and Dad sit on either side of the child on the sofa, leaning in close, smiling proudly.",
    },
]}

# ═══════════════════════════════════════════════════════════════════
# LEVEL 4.1 — "The Purple Purse" (Modern Istanbul neighbourhood)
# ═══════════════════════════════════════════════════════════════════
SCENE_PROMPTS["4.1"] = {
    "title": "The Purple Purse",
    "scenes": [
    {
        # COVER: Girl on colourful modern Istanbul street with purple purse
        "name": "cover",
        "prompt": "BOOK COVER ILLUSTRATION. A girl on a colourful modern city street, holding a small purple velvet purse with a gold clasp close to her chest, smiling proudly. Green ferns and modern shops with colourful awnings behind. Warm afternoon light. Whimsical children's book illustration. CRITICAL: Eyes MUST be tiny solid black filled circles — NO white. No text. Portrait orientation.",
    },
    {
        # Page 1: Worried girl in apartment hallway, turning out pockets
        "name": "page1",
        "prompt": "A worried girl turns out her empty pockets in a modern apartment hallway with coat hooks and a shoe rack. She looks panicked. Modern tiled floor, warm lighting. Whimsical children's book illustration. CRITICAL: Eyes MUST be tiny solid black filled circles — NO white. No text. Landscape orientation.",
        "side_hero": True,
        "side_hero_action": "Dad stands nearby looking concerned, hands on hips.",
    },
    {
        # Page 2: Girl and Dad walk hand in hand down modern Istanbul street
        "name": "page2",
        "prompt": "A girl and a man walk hand in hand down a modern city street with colourful apartment buildings in cream and pastel tones. Balconies with flower boxes. A cat sits on a wall. She looks thoughtful, he looks determined. Whimsical children's book illustration. CRITICAL: Eyes MUST be tiny solid black filled circles — NO white. No text. Landscape orientation.",
        "side_hero": True,
        "side_hero_action": "Dad walks beside her, holding her hand.",
    },
    {
        # Page 3: Girl searches under park bench in ferns
        "name": "page3",
        "prompt": "A girl bends down to search under a wooden park bench surrounded by green ferns and bushes. She pushes aside leaves, looking frustrated. A green park with mature trees and dappled sunlight. Whimsical children's book illustration. CRITICAL: Eyes MUST be tiny solid black filled circles — NO white. No text. Landscape orientation.",
    },
    {
        # Page 4: Girl at counter of small corner shop, shopkeeper shakes head
        "name": "page4",
        "prompt": "A girl stands at the counter of a small corner shop with a colourful awning. A middle-aged shopkeeper in an apron shakes his head. Shelves of goods behind him. The girl looks sad and disappointed. Whimsical children's book illustration. CRITICAL: ALL characters MUST have eyes that are tiny solid black filled circles — NO white. No text. Landscape orientation.",
    },
    {
        # Page 5: Girl walks past old stone wall with ferns, church in background
        "name": "page5",
        "prompt": "A girl walks along a quiet street past an old stone wall covered in climbing ferns. A small stone church is visible in the background. She looks sad and worried, shoulders slumped. Afternoon light. Whimsical children's book illustration. CRITICAL: Eyes MUST be tiny solid black filled circles — NO white. No text. Landscape orientation.",
    },
    {
        # Page 6: Herb seller holds up purple purse at herb stall
        "name": "page6",
        "prompt": "The character from the reference image reaches excitedly for a small purple velvet purse with a gold clasp held up by a smiling woman in a headscarf at a street-side herb stall. The girl wears her purple jumper with gold stars and light blue jacket. Bunches of fresh herbs in wooden crates around the stall. Whimsical children's book illustration. CRITICAL: ALL characters MUST have eyes that are tiny solid black filled circles — NO white. No text. Landscape orientation.",
        "side_hero": True,
        "side_hero_action": "Dad watches from behind, smiling with relief.",
    },
    {
        # Page 7: Girl holds purse close, examining it with joy
        "name": "page7",
        "prompt": "A joyful girl holds a small purple velvet purse with a gold clasp close to her face, examining it with a huge smile. She turns it in her hands lovingly. Herb stall and modern street visible behind her. Whimsical children's book illustration. CRITICAL: Eyes MUST be tiny solid black filled circles — NO white. No text. Landscape orientation.",
        "side_hero": True,
        "side_hero_action": "Dad stands behind her, smiling proudly.",
    },
    {
        # Page 8: Girl and Dad walk home at golden hour, purse clutched to chest
        "name": "page8",
        "prompt": "A girl and a man walk home along a modern street at golden hour. She clutches a small purple velvet purse with a gold clasp to her chest, looking happy and relieved. Warm golden sunset light, colourful buildings, a cat watching from a windowsill. Whimsical children's book illustration. CRITICAL: ALL characters MUST have eyes that are tiny solid black filled circles — NO white. No text. Landscape orientation.",
        "side_hero": True,
        "side_hero_action": "Dad walks beside her with his hand on her shoulder.",
    },
]}

# ═══════════════════════════════════════════════════════════════════
# LEVEL 5.1 — "Before the Shore" (Orthodox Jewish London, flashback memory story)
# ═══════════════════════════════════════════════════════════════════
# CHARACTERS: Boy + Dad only (no Mum)
# CHARACTER: Orthodox Jewish boy — white shirt, kippah, payot, dark trousers
# DAD: Black hat, long coat, beard, payot (use side hero 5.1_dad)
# KEY OBJECTS:
# - STONE: "a smooth, flat, oval AMBER/HONEY-coloured stone with a thin white stripe, palm-sized"
#   (both stones look the same — one from the shore, one from the park)
# - WIRE: "thin silver craft wire"
# - SHELLS: "small seashells in pink, white, and cream colours"
# SETTINGS:
# - LONDON PARK: Victorian terraced houses (red brick, bay windows), autumn trees, wooden bench
# - BRITISH SHORE: Sandy beach with pebbles, grassy dunes, gentle waves, campfire on beach

SCENE_PROMPTS["5.1"] = {
    "title": "Before the Shore",
    "side_hero_key": "5.1_dad",
    "scenes": [
    {
        # COVER: Boy on bench holding stone, split scene (park and shore behind)
        "name": "cover",
        "prompt": "BOOK COVER ILLUSTRATION. Show the character from the reference image sitting on a wooden park bench, holding a smooth, flat, oval AMBER/HONEY-coloured stone with a thin white stripe up to the light with wonder. Behind him, the scene subtly splits: on one side, Victorian terraced houses and autumn trees (a London park); on the other side, a beach shore with gentle waves and sand. The boy looks thoughtful and dreamy. Same character, same outfit (white button-up shirt, dark navy trousers, black shoes, small dark navy kippah, payot visible), same light olive skin. CRITICAL: Eyes MUST be tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Portrait orientation.",
    },
    {
        # Page 1: "The boy went home from the park. He was tired, and his feet were sore."
        "name": "page1",
        "prompt": "Show the character from the reference image looking tired, sitting on a wooden park bench in a London park. He is picking up a smooth, flat, oval AMBER/HONEY-coloured stone with a thin white stripe from the ground near his feet. Victorian red-brick terraced houses with bay windows visible in the background. Autumn leaves scattered on the ground. Overcast British sky with soft light. The boy looks weary but curious. Same character, same outfit (white button-up shirt, dark navy trousers, black shoes, small dark navy kippah, payot visible). CRITICAL: Eyes MUST be tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 2: "The stone felt cool in his hand. It had a shine, like something from the shore."
        "name": "page2",
        "prompt": "Show the character from the reference image sitting on a wooden park bench with his eyes peacefully closed, holding a smooth, flat AMBER/HONEY-coloured stone with a thin white stripe in his cupped hands. A soft, dreamy glow or slight blur around the edges suggests he is remembering something. AUTUMN setting — trees with orange, red, brown and golden leaves. Fallen autumn leaves on the ground. Overcast British sky. NO spring blossom, NO pink trees, NO green summer trees — this is AUTUMN in London. Same character, same outfit (white shirt, dark trousers, kippah, payot). CRITICAL: Eyes when visible MUST be tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 3: FLASHBACK — "Before the cold came, he went with Dad to the shore."
        "name": "page3",
        "side_hero": True,
        "side_hero_key": "5.1_dad",
        "prompt": "FLASHBACK SCENE — warmer, golden tones. Show the boy character from the FIRST reference image running joyfully on a sandy British beach. The Orthodox Jewish dad from the SECOND reference image (black hat, long coat, beard, payot) runs alongside him. JUST THESE TWO CHARACTERS — no one else. Waves rolling onto the shore behind them. In the corner, a small beach campfire with orange flames. British seaside setting with some pebbles mixed in the sand and grassy dunes visible. Same boy character, same outfit (white shirt, dark trousers, kippah, payot). CRITICAL: ALL characters MUST have eyes that are tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 4: FLASHBACK — "The next day, he explored the rock pools. Dad helped him."
        "name": "page4",
        "side_hero": True,
        "side_hero_key": "5.1_dad",
        "prompt": "FLASHBACK SCENE — warmer, golden tones. Show the boy character from the FIRST reference image crouching beside a rocky tidal pool, his hands full of small seashells in pink, white, and cream colours. The Orthodox Jewish dad from the SECOND reference image (black hat, long coat, beard, payot) kneels beside him, helping him thread shells onto thin silver craft wire. Both are smiling happily. JUST THESE TWO CHARACTERS — no one else. Rocky shore with shallow pools of water reflecting blue sky. More shells scattered around. Same boy character, same outfit. CRITICAL: ALL characters MUST have eyes that are tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 5: FLASHBACK — "He spotted a stone by the shore."
        "name": "page5",
        "side_hero": True,
        "side_hero_key": "5.1_dad",
        "prompt": "FLASHBACK SCENE — warmer, golden tones. Show the boy character from the FIRST reference image holding up a SMALL smooth flat oval AMBER/HONEY-coloured stone with a thin white stripe (palm-sized, fits easily in one child's hand) that he just picked up from the shore edge. He holds it in ONE hand between thumb and fingers, smiling with delight. The stone is SMALL — no bigger than an egg or a biscuit. The Orthodox Jewish dad from the SECOND reference image (black hat, long coat, beard) stands nearby, gesturing encouragingly. JUST THESE TWO CHARACTERS — no one else. The calm sea is behind them with gentle waves. Same boy character, same outfit. CRITICAL: ALL characters MUST have eyes that are tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 6: PRESENT — "The boy sat up and looked around."
        "name": "page6",
        "prompt": "BACK TO PRESENT — cooler autumn tones. Show the character from the reference image sitting up alertly on the park bench, eyes open and bright, holding a smooth, flat AMBER/HONEY-coloured stone with a thin white stripe up to the light. Sunlight catches the stone's smooth surface. He looks thoughtful and happy, as if he has just had a wonderful idea. London park with Victorian terraced houses in the background. Autumn leaves. Same character, same outfit (white shirt, dark trousers, kippah, payot). CRITICAL: Eyes MUST be tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 7: "He ran home to get his shore stone. Now he had a pair!"
        "name": "page7",
        "prompt": "Show the character from the reference image sitting at a wooden table inside a cosy home. On the table in front of him are TWO smooth, flat, oval AMBER/HONEY-coloured stones, each with a thin white stripe — they look like a matching pair. He is carefully bending thin silver craft wire to make loops around the stones. His tongue sticks out slightly in concentration. Warm home interior with family photos visible on the wall behind him. Same character, same outfit. CRITICAL: Eyes MUST be tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 8: "He gave the stones to Dad."
        "name": "page8",
        "side_hero": True,
        "side_hero_key": "5.1_dad",
        "prompt": "Show the Orthodox Jewish dad from the SECOND reference image (black hat, long coat, beard, payot) receiving a handmade gift from the boy from the FIRST reference image. Dad holds up two smooth AMBER/HONEY-coloured stones threaded on thin silver craft wire as a charm. Each stone is plain amber with exactly ONE single thin white line across it — NOT multiple stripes, just ONE white line per stone. Dad is smiling warmly with joy. The boy looks proud and happy. Dad is attaching them to his bag. JUST THESE TWO CHARACTERS — no one else. Warm family moment in their cosy home — plain walls, sofa, family photos. NO religious objects, NO menorah, NO candelabra, NO extra stones on tables. Same characters, same outfits. CRITICAL: ALL characters MUST have eyes that are tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Landscape orientation.",
    },
]}

# ═══════════════════════════════════════════════════════════════════
# LEVEL 2.5 — "Round and Round" (Reykjavik, Iceland)
# ═══════════════════════════════════════════════════════════════════
SCENE_PROMPTS["2.5"] = {
    "title": "Round and Round",
    # CHARACTER: Icelandic boy (Reykjavik winter) — lopapeysa sweater, woolly hat
    # KEY OBJECTS:
    # - TOY CAR: "a small bright cherry red toy car, chunky, simple shape"
    # - HAT: "knitted rust-brown woolly hat with a small cream pom-pom on top"
    # - HOUSES: "colourful corrugated-iron houses (one red, one blue, one green, one yellow) with pitched roofs covered in snow"
    # - ROCK: "a big dark grey boulder dusted with snow"
    # - SHED: "a small wooden garden shed painted dark green, with snow on its pitched roof"
    # - MUM: "light skin, shoulder-length blonde hair under dark blue woolly hat, dark blue parka over grey lopapeysa, dark trousers, black snow boots, dark mittens"
    "scenes": [
        {
            "name": "cover",
            "side_hero": True,
            "prompt": "Show the character from the FIRST reference image standing in a snowy Reykjavik street, holding a small bright cherry red toy car close to his chest with a big joyful smile. Wind blowing snow gently around him. Colourful corrugated-iron houses (one red, one blue, one green, one yellow) with pitched roofs covered in snow behind him. Low golden winter sunlight. Mountains in the far distance. Snowy ground. Same boy character, same outfit (cream and brown lopapeysa sweater, dark navy trousers, brown snow boots, rust-brown woolly hat with cream pom-pom), same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them. Whimsical children's book illustration, hand-drawn cartoon style, soft watercolour textured backgrounds, clean black-outlined characters. No text, words, or letters in the image. Portrait orientation.",
        },
        {
            "name": "page1",
            "prompt": "Show the character from the reference image kneeling on a snowy path outside, excitedly pushing a small bright cherry red toy car along the ground with one hand. The boy has a huge delighted grin, leaning forward with energy. Circular tracks in the snow show the car has been zooming round and round. Snowy Reykjavik neighbourhood — colourful corrugated-iron houses (one red, one blue, one green, one yellow) with pitched roofs covered in snow. Low golden winter sunlight. Mountains in the distance. Same character, same outfit (cream and brown lopapeysa sweater, dark navy trousers, brown snow boots, rust-brown woolly hat with cream pom-pom), same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them. Whimsical children's book illustration. No text. Landscape orientation.",
        },
        {
            "name": "page2",
            "prompt": "Show the character from the reference image running along a snowy path between colourful corrugated-iron houses, pushing a small bright cherry red toy car ahead of him with great excitement. The boy is mid-stride, leaning forward, grinning with joy. Circular tracks and lines in the snow behind him show the car's path. Colourful corrugated-iron houses (one red, one blue, one green, one yellow) with pitched roofs covered in snow along the street. Low golden winter sunlight. Snowy ground. Same character, same outfit (cream and brown lopapeysa sweater, dark navy trousers, brown snow boots, rust-brown woolly hat with cream pom-pom), same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them. Whimsical children's book illustration. No text. Landscape orientation.",
        },
        {
            "name": "page3",
            "prompt": "Show the character from the reference image standing in a snowy Reykjavik street, looking panicked and upset, staring into the distance with arms spread out in dismay. Tracks in the snow lead away from him and disappear — the toy car has rolled too far and is nowhere to be seen. Colourful corrugated-iron houses (one red, one blue, one green, one yellow) with pitched roofs covered in snow line the street. Low golden winter light. Mountains in the distance. No toy car visible — it is lost. Same character, same outfit (cream and brown lopapeysa sweater, dark navy trousers, brown snow boots, rust-brown woolly hat with cream pom-pom), same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them. Whimsical children's book illustration. No text. Landscape orientation.",
        },
        {
            "name": "page4",
            "prompt": "Show the character from the reference image standing in the snowy street, cupping his hands around his mouth and shouting. He looks upset and frustrated, calling for help. His mouth is wide open, shouting. Snowy Reykjavik neighbourhood around him — colourful corrugated-iron houses (one red, one blue, one green, one yellow) with pitched roofs covered in snow. Wind blowing snow. Low golden winter light. Same character, same outfit (cream and brown lopapeysa sweater, dark navy trousers, brown snow boots, rust-brown woolly hat with cream pom-pom), same appearance as reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them. Whimsical children's book illustration. No text. Landscape orientation.",
        },
        {
            "name": "page5",
            "side_hero": True,
            "prompt": "Show the boy character from the FIRST reference image standing next to his Mum from the SECOND reference image in the snowy Reykjavik street. Mum has her hand on the boy's shoulder reassuringly. She looks warm and supportive. The boy looks up at her with hope. Snowy ground, colourful corrugated-iron houses (one red, one blue, one green, one yellow) in the background with snow on roofs. Low golden winter light. Same boy character, same outfit as first reference. Same mum character, same appearance as second reference. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them. Whimsical children's book illustration. No text. Landscape orientation.",
        },
        {
            "name": "page6",
            "side_hero": True,
            "prompt": "Show the boy character from the FIRST reference image and his Mum from the SECOND reference image searching in a snowy garden area. They are peering around a big dark grey boulder dusted with snow on one side, and a small wooden garden shed painted dark green with snow on its pitched roof on the other side. Both looking carefully, bending down and searching. The boy looks frustrated, Mum looks determined and encouraging. Colourful corrugated-iron houses visible in the background. Snowy ground. Same characters, same outfits as references. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them. Whimsical children's book illustration. No text. Landscape orientation.",
        },
        {
            "name": "page7",
            "side_hero": True,
            "prompt": "Show the boy character from the FIRST reference image jumping for joy with arms raised high, a huge delighted smile on his face. His Mum from the SECOND reference image is kneeling in the snow nearby, holding up a small bright cherry red toy car triumphantly. She is smiling proudly. They are near the small wooden garden shed painted dark green with snow on its pitched roof. The big dark grey boulder dusted with snow is visible nearby. Colourful corrugated-iron houses in the background. Snowy ground. Golden winter light. Same characters, same outfits as references. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them. Whimsical children's book illustration. No text. Landscape orientation.",
        },
        {
            "name": "page8",
            "side_hero": True,
            "prompt": "Show the boy character from the FIRST reference image hugging his Mum from the SECOND reference image tightly with one arm while clutching a small bright cherry red toy car to his chest with the other hand. Both are smiling warmly, standing in front of the bright red corrugated-iron house door. A warm glow of light comes from the open doorway behind them. Snow on the ground and on the roof. Other colourful corrugated-iron houses (blue, green, yellow) visible along the street. Warm, cosy, happy ending feeling. Same characters, same outfits as references. IMPORTANT: ALL characters must have tiny solid black dot eyes - just small black filled circles like a teddy bear, NO white around them. Whimsical children's book illustration. No text. Landscape orientation.",
        },
    ],
}

# ═══════════════════════════════════════════════════════════════════
# LEVEL 6.1 — "The Secret Garden" (English country garden)
# ═══════════════════════════════════════════════════════════════════
SCENE_PROMPTS["6.1"] = {
    "title": "The Secret Garden",
    "scenes": [
    {
        # COVER: Child at an iron gate, mysterious garden beyond
        "name": "cover",
        "prompt": "BOOK COVER ILLUSTRATION. Show the character from the reference image pushing open an old wrought iron gate, peering into a mysterious overgrown garden beyond. Enormous roses climb the gate posts. Dappled golden sunlight filters through ancient trees. A hint of a stone fountain visible through the foliage. The child looks curious and wonder-filled. Same character, same outfit (light blue cardigan, white blouse, dark blue skirt, white tights, black shoes, brown satchel), same long black plait with blue ribbon. CRITICAL: Eyes MUST be tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Portrait orientation.",
    },
    {
        # Page 1: "Grandmother said there was a famous garden."
        "name": "page1",
        "prompt": "Show the character from the reference image walking along a path with Grandmother towards a tall, thick green hedge with a hidden entrance. Grandmother is an elegant elderly East Asian woman with grey hair in a neat bun, wearing a navy blue coat and sensible shoes, with a kind warm smile. The hedge towers above them, mysterious and inviting. English countryside: rolling green lawns, old stone wall in background. Same character, same outfit (blue cardigan, white blouse, blue skirt, brown satchel), same black plait. CRITICAL: ALL characters MUST have eyes that are tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 2: "We walked through the iron gate along a path lined with enormous roses."
        "name": "page2",
        "prompt": "Show the character from the reference image and Grandmother walking along a winding stone path through the garden entrance. ENORMOUS climbing roses in deep pink, white, and red line both sides of the path, arching overhead. A small nervous robin with brown and red feathers hops on the stone path ahead of them. Dappled sunlight through leaves. The child looks up at the roses in awe. Same character, same outfit (blue cardigan, white blouse, blue skirt, brown satchel), same black plait. CRITICAL: ALL characters including the robin MUST have eyes that are tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 3: "An enormous oak tree... A mysterious fountain."
        "name": "page3",
        "prompt": "Show the character from the reference image standing in front of a MASSIVE ancient oak tree with gnarled branches spreading like arms. In its shade, a mysterious stone fountain features a lion's face with water pouring from its mouth into a mossy basin. The child pushes through leafy branches to reach the fountain, mouth open in amazement. Dappled light, ferns, wildflowers, moss on everything. Same character, same outfit (blue cardigan, white blouse, blue skirt, brown satchel), same black plait. CRITICAL: Eyes MUST be tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 4: "'This garden was once dangerous and wild,' said Grandmother."
        "name": "page4",
        "prompt": "Show Grandmother speaking to the character from the reference image, gesturing around the garden. In the background, one side shows the garden now — beautiful, trimmed, flowering. The other side hints at what it used to be — wild thorns, tangled dark paths, overgrown brambles. The child listens with wide eyes, imagining the transformation. Grandmother (elderly East Asian woman, grey bun, navy coat) speaks with expressive hands. Same character, same outfit (blue cardigan, brown satchel), same black plait. CRITICAL: ALL characters MUST have eyes that are tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 5: "A curious squirrel ran past my feet."
        "name": "page5",
        "prompt": "Show the character from the reference image sitting on an old stone bench near the fountain, watching a cute fluffy grey squirrel that has run right up to their feet. Light dances on the fountain water behind. Wildflowers grow around the bench legs. The garden is peaceful and still — even the birds are quiet. The child sits very still, entranced, watching the squirrel. Same character, same outfit (blue cardigan, white blouse, blue skirt, brown satchel), same black plait. CRITICAL: ALL characters including the squirrel MUST have eyes that are tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 6: "Grandmother bought me a gorgeous book about the garden."
        "name": "page6",
        "prompt": "Show the character from the reference image standing outside a charming little garden shop (stone cottage with flower boxes), holding a beautiful book about the garden close to their chest. The book cover has flowers and gold lettering. Grandmother stands beside them smiling warmly. The child looks thrilled, hugging the book. Garden visible in the background through the shop doorway. Same character, same outfit (blue cardigan, brown satchel), same black plait. CRITICAL: ALL characters MUST have eyes that are tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 7: "The famous garden glowed in the afternoon sun."
        "name": "page7",
        "prompt": "Show the character from the reference image standing at a viewpoint looking across the ENTIRE garden in warm afternoon golden sunlight. The garden stretches out gloriously — enormous roses in bloom everywhere, the oak tree towering, the fountain sparkling, winding paths, butterflies and bees. Everything glows with golden light. The child stands with arms slightly spread, taking it all in with joy in their heart. Same character, same outfit (blue cardigan, white blouse, blue skirt), same black plait. CRITICAL: Eyes MUST be tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 8: "'Can we come back?' I asked."
        "name": "page8",
        "prompt": "Show the character from the reference image and Grandmother walking out through the iron gate of the garden. The child looks back through the gate at the garden with a longing happy smile. Grandmother has her arm around the child. The garden is visible through the gate bars — roses, the oak tree, the fountain, golden light. The child holds the garden book in one hand. A warm, loving farewell scene. Same character, same outfit (blue cardigan, brown satchel), same black plait. CRITICAL: ALL characters MUST have eyes that are tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Landscape orientation.",
    },
]}

# ═══════════════════════════════════════════════════════════════════
# LEVEL 4.2 — "The Brown Owl" (British woodland at dusk)
# ═══════════════════════════════════════════════════════════════════
# CHARACTER: Mixed-race girl, ~6yo, curly dark brown hair in two puffs with navy bobbles,
#   navy blue duffle coat with wooden toggle buttons, dark grey joggers, brown lace-up boots
# SIDE CHARACTER: Mum — taller adult woman, medium brown skin, dark brown hair in low bun,
#   dark green parka, black trousers, brown walking boots
#
# KEY OBJECTS (MUST be identical in ALL prompts):
# - OWL: "a large tawny owl with rich dark brown feathers, lighter cream-brown chest markings,
#     a round facial disc, and a sharp curved beak"
# - TREE: "a tall mature oak tree with thick textured bark, bare winter branches,
#     and a dark oval hole about halfway up the trunk"
# - OWLETS: "two small fluffy baby owlets with pale brown downy feathers, darker brown markings,
#     round faces like miniature versions of the mother owl"
# - WOODLAND: "a woodland path through bare winter trees (oak, birch) with some evergreen pines,
#     fallen brown and orange leaves on the ground, twilight sky with deep blue and purple tones"
SCENE_PROMPTS["4.2"] = {
    "title": "The Brown Owl",
    # CONSISTENCY RULES FOR ALL SCENES:
    # - Mum: dark brown hair in TIGHT LOW BUN (never loose, never down)
    # - Owl eyes: tiny solid BLACK dots (never white, never detailed)
    # - Girl eyes: tiny solid BLACK dots (match hero reference)
    # - Mum eyes: tiny solid BLACK dots (match side hero reference)
    "scenes": [
    {
        # COVER: Girl at edge of woodland path at dusk, looking up at owl on branch
        "name": "cover",
        "prompt": "BOOK COVER ILLUSTRATION. Show the character from the reference image standing at the edge of a dark woodland path at dusk, looking up in wonder at a large tawny owl with rich dark brown feathers and lighter cream-brown chest markings perched on a bare oak branch above her. The owl stares back with tiny solid black dot eyes. Woodland path through bare winter trees with some evergreen pines, fallen brown and orange leaves on the ground, twilight sky with deep blue and purple tones. Same character, same outfit (navy blue duffle coat with wooden toggle buttons, dark grey joggers, brown lace-up boots), same curly dark brown hair in two puffs with navy bobbles. ABSOLUTELY CRITICAL EYE RULE — EVERY character (girl, owl, everyone) MUST have eyes that are tiny solid black filled circles like dots drawn with a black marker. The owl's eyes are tiny solid black dots — NO yellow, NO white, NO iris, NO detail. Just black dots. Whimsical children's book illustration. No text. Portrait orientation.",
    },
    {
        # Page 1: "It was getting dark. From deep in the trees came a loud howl, then a growl."
        "name": "page1",
        "prompt": "Show the character from the reference image pressing her face to a window at dusk, peering out into the dark. She looks curious and excited, hands pressed against the glass. Warm yellow lamplight inside contrasts with blue-grey twilight outside. Dark tree silhouettes visible through the window. She wears her navy blue duffle coat (ready to go outside). Same character, same outfit (navy duffle coat, dark grey joggers, brown boots), same curly dark brown hair puffs with navy bobbles. ABSOLUTELY CRITICAL EYE RULE: Eyes MUST be tiny solid black filled circles like dots drawn with a black marker. NO white, NO iris, NO detail. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 2: "We set off down the dark path together."
        "name": "page2",
        "prompt": "Show the character from the reference image and her Mum walking together down a woodland path through bare winter trees with some evergreen pines at twilight. Mum has her arm around the girl's shoulder. Mum is a TALL ADULT WOMAN (dark green parka, black trousers, brown boots) much taller than the child. IMPORTANT: Mum's dark brown hair is in a TIGHT LOW BUN at the nape of her neck — NOT loose, NOT hanging down. Fallen brown and orange leaves on the ground. Deep blue and purple twilight sky. The child wears her navy blue duffle coat and brown boots. Same character, same outfit, same curly dark brown hair puffs with navy bobbles. ABSOLUTELY CRITICAL EYE RULE: ALL characters MUST have eyes that are tiny solid black filled circles like dots drawn with a black marker. NO white, NO iris, NO detail. Whimsical children's book illustration. No text. Landscape orientation.",
        "side_hero": True,
        "side_hero_action": "Mum walks beside the girl. Mum's hair is in a tight low bun.",
    },
    {
        # Page 3: "A big brown owl sat on a bare branch. It stared down at us."
        "name": "page3",
        "prompt": "Show a small girl and her tall Mum both looking up in wonder at a large tawny owl with rich dark brown feathers and lighter cream-brown chest markings perched high on a bare branch of a tall mature oak tree. The owl has tiny solid black dot eyes — no yellow, no white. Woodland with bare winter trees, twilight sky with deep blue and purple tones. The GIRL has MEDIUM BROWN skin, curly dark brown hair in two puffs with navy bobbles, wears a NAVY BLUE duffle coat with toggle buttons, dark grey joggers, brown boots. MUM has MEDIUM BROWN skin (same warm tone as the girl), dark brown hair in a TIGHT LOW BUN, wears a DARK GREEN PARKA (NOT navy — GREEN), black trousers, brown walking boots. SKIN TONE: Both have warm MEDIUM BROWN skin — NOT light, NOT pale, NOT white. Match the reference images exactly. Mum is MUCH TALLER than the girl — the girl only reaches Mum s waist. Their outfits are DIFFERENT colours: girl=navy blue coat, mum=dark green parka. ABSOLUTELY CRITICAL EYE RULE: ALL characters AND the owl MUST have eyes that are tiny solid completely BLACK filled circles. The OWL S eyes are solid black dots — NO yellow, NO white, NO iris. Whimsical children s book illustration. No text. Landscape orientation.",
        "side_hero": True,
        "side_hero_action": "Mum has MEDIUM BROWN skin, DARK GREEN PARKA, hair in TIGHT LOW BUN.",
    },
    {
        # Page 4: "I stared at the owl. The owl stared right back."
        "name": "page4",
        "prompt": "Close-up composition: the character from the reference image, her Mum, and a large tawny owl with rich dark brown feathers. The girl stares up with wide-eyed wonder from below. The owl stares back from its bare branch, head tilted slightly — the owl has tiny solid black dot eyes, no yellow, no white. Mum (TALL ADULT WOMAN in dark green parka, black trousers, brown boots, dark hair in TIGHT LOW BUN) stands behind the child with a protective hand on the girl's shoulder. Bare branches frame the scene. Dusk woodland setting. Same character, same outfit (navy duffle coat, brown boots), same curly dark brown hair puffs with navy bobbles. ABSOLUTELY CRITICAL EYE RULE: ALL characters AND the owl MUST have eyes that are tiny solid black filled circles like dots. The OWL'S eyes are tiny black dots — NO yellow, NO white, NO iris. Whimsical children's book illustration. No text. Landscape orientation.",
        "side_hero": True,
        "side_hero_action": "Mum stands behind the child. Mum's hair is in a tight low bun.",
    },
    {
        # Page 5: "The owl spread its wings and swooped down. Wow!"
        "name": "page5",
        "prompt": "Show a large tawny owl with rich dark brown feathers in dramatic flight with wings spread wide, swooping down from the branch. The owl has tiny solid black dot eyes — no yellow, no white. The character from the reference image stands frozen below with mouth open in amazement. A tree stump visible on the ground nearby. Dynamic swooping motion captured. Dusk woodland setting with bare trees. Same character, same outfit (navy duffle coat, dark grey joggers, brown boots), same curly dark brown hair puffs with navy bobbles. ABSOLUTELY CRITICAL EYE RULE: ALL characters AND the owl MUST have eyes that are tiny solid black filled circles like dots. The OWL'S eyes are tiny black dots — NO yellow, NO white, NO iris. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 6: "Owlets! She must look after them!"
        "name": "page6",
        "prompt": "A nighttime woodland scene. In the centre, a tall mature oak tree with thick textured bark, bare winter branches, and a dark oval hole about halfway up the trunk. Two small fluffy baby owlets with pale brown downy feathers peek their heads out of the hole. A large tawny owl with rich dark brown feathers perches on a branch next to the hole. On the left, the GIRL (MEDIUM BROWN skin, curly dark brown hair in two puffs with navy bobbles, NAVY BLUE duffle coat with toggle buttons, dark grey joggers, brown boots) stands on tiptoes looking up, delighted. On the right, MUM (MEDIUM BROWN skin matching the girl, dark brown hair in TIGHT LOW BUN, DARK GREEN PARKA — not navy, black trousers, brown walking boots) points up at the owlets. Mum is TALLER than the girl. Dark blue twilight sky, bare winter trees in background. SKIN TONE: Both girl and Mum have warm MEDIUM BROWN skin — NOT light, NOT pale, NOT white. Match the reference images exactly. ABSOLUTELY CRITICAL EYE RULE: EVERY character — girl, Mum, mother owl, AND baby owlets — ALL have eyes that are tiny solid completely BLACK filled circles. The owls' eyes are solid black dots — NO yellow, NO white, NO iris whatsoever. Whimsical children's book illustration. No text. Landscape orientation.",
        "side_hero": True,
        "side_hero_action": "Mum has MEDIUM BROWN skin, dark hair in TIGHT LOW BUN, DARK GREEN PARKA.",
    },
    {
        # Page 7: "The owl swooped back up with a mouse in its claws."
        "name": "page7",
        "prompt": "A nighttime woodland scene. In the centre, a tall mature oak tree with a dark oval hole partway up. A large tawny owl with rich dark brown feathers and tiny solid black dot eyes flies up to the hole carrying a small grey mouse in its talons. Two small fluffy baby owlets with pale brown downy feathers and tiny solid black dot eyes lean out of the hole with open beaks, cheeping. Below the tree on the left, the character from the reference image watches with a big smile. On the right, Mum (dark green parka, dark hair in TIGHT LOW BUN) also smiles warmly. Dark blue night sky with stars. Bare winter trees in background. Same character, same outfit (navy duffle coat, dark grey joggers, brown boots), same curly dark brown hair puffs. ABSOLUTELY CRITICAL EYE RULE: EVERY character — girl, Mum, mother owl, AND baby owlets — MUST have eyes that are tiny solid black filled circles like dots. NO yellow owl eyes, NO white. Whimsical children's book illustration. No text. Landscape orientation.",
        "side_hero": True,
        "side_hero_action": "Mum smiles warmly. Mum's hair is in a tight low bun.",
    },
    {
        # Page 8: "We went home under the stars."
        "name": "page8",
        "prompt": "Show a small GIRL and her tall MUM walking home along a woodland path through bare winter trees at night. The girl holds her mum's hand and smiles contentedly. The GIRL has MEDIUM BROWN skin, curly dark brown hair in two puffs with navy bobbles, wears a NAVY BLUE duffle coat with toggle buttons, dark grey joggers, brown boots. MUM has MEDIUM BROWN skin (same tone as the girl), dark brown hair in a TIGHT LOW BUN at the nape of her neck, wears a DARK GREEN PARKA (NOT navy — GREEN), black trousers, brown walking boots. Mum is MUCH TALLER than the girl. SKIN TONE: Both have warm MEDIUM BROWN skin — NOT light, NOT pale, NOT white. Match the reference images exactly. A beautiful starry night sky above with a crescent moon. In the background, the silhouette of a tall oak tree with a dark oval hole visible against the stars. Warm, peaceful, safe atmosphere. ABSOLUTELY CRITICAL EYE RULE: ALL characters MUST have eyes that are tiny solid completely BLACK filled circles. NO white, NO iris, NO detail. Whimsical children's book illustration. No text. Landscape orientation.",
        "side_hero": True,
        "side_hero_action": "Mum has MEDIUM BROWN skin, dark hair in TIGHT LOW BUN, DARK GREEN PARKA.",
    },
]}

# ═══════════════════════════════════════════════════════════════════
# LEVEL 4.3 — "The New Glue" (Modern Oaxacan home, Mexico)
# ═══════════════════════════════════════════════════════════════════
# THE BEDROOM (pages 1 and 7 are the SAME room — pin it, don't just name a
# nationality).  Lynden 2026-07-26: "The image of the room and desk is
# different to the first image of the room and desk."  The two prompts used to
# say only "colourful bedroom" / "colourful Mexican bedroom", so the model
# invented a second room (tiles became floorboards, the low patchwork bed
# became a tall magenta one, the mountain picture became geometric wall art).
# Both prompts now carry this identical block — see
# feedback_mpb_setting_needs_architecture: list the drawable features, name the
# ground, every time.
GLUE_BEDROOM = (
    "THE ROOM: a child's bedroom with plain salmon-pink walls. The GROUND is a "
    "patterned floor of SQUARE TILES in cream and dusty pink, each with a small "
    "flower motif — NOT wooden floorboards. Against the right-hand wall is a LOW "
    "bed with NO headboard: white base, patchwork quilt of cream, soft blue and "
    "warm orange squares, three square patterned cushions. On the left wall is "
    "ONE large window with pale cream curtains. On the right wall hangs ONE "
    "framed picture of pink and blue mountains. In the foreground stands a LOW "
    "light-wood craft table with thick square legs, and a yellow ceramic pot of "
    "coloured pencils sits on the floor beside it."
)

SCENE_PROMPTS["4.3"] = {
    "title": "The New Glue",
    "scenes": [
    {
        # COVER: Girl with blue glue pot, ginger cat with glue on fur
        "name": "cover",
        "prompt": "BOOK COVER in kawaii children's book style. A cute cartoon girl in yellow t-shirt and blue dungarees holds a pot of bright blue glue with a mischievous grin. A kawaii-style cartoon ginger tabby cat sits beside her with blue glue smears on its fur, looking indignant. Colourful Mexican home interior — warm terracotta walls, potted plants, decorative tiles. CRITICAL ART STYLE: Kawaii/Sanrio style where ALL eyes are SOLID BLACK OVALS with NO white parts. The cat has two black oval eyes like Hello Kitty's friends. The girl has two black oval eyes. No pupils, no iris, no sclera — just solid black shapes. Flat colours, simple shapes. No text. Portrait orientation.",
    },
    {
        # Page 1: Girl at craft desk pressing glue on card
        "name": "page1",
        "prompt": "A girl at the low light-wood craft table presses blue glue on a white card. Blue glue spreads everywhere across the table top. Craft supplies — paper, scissors, glue tubes — scattered around. She looks surprised at the mess. " + GLUE_BEDROOM + " Whimsical children's book illustration. CRITICAL: Eyes MUST be tiny solid black filled circles — NO white. No text. Landscape orientation.",
    },
    {
        # Page 2: Card with blue glue flies down staircase toward cat at bottom
        "name": "page2",
        "prompt": "A white card covered in blue glue flies down a colourful tiled staircase. The card is mid-air, tumbling down the steps. At the bottom of the stairs, a ginger tabby cat with orange stripes sits peacefully, unaware of the card flying toward it. Warm-coloured hallway with painted terracotta walls and decorative patterned tiles on the stair risers. No people in this scene — just the flying card and the cat. Whimsical children's book illustration. CRITICAL: The cat MUST have eyes that are tiny solid black filled circles — NO white. No text. Landscape orientation.",
    },
    {
        # Page 3: Cat at bottom of stairs with card stuck on it — FULL ROOM VIEW
        "name": "page3",
        "prompt": "Kawaii children's book illustration of a Mexican home staircase. A kawaii-style cartoon ginger tabby cat with orange stripes stands at the foot of colourful tiled stairs. A blue glue-covered card is stuck on the cat's back. The cat looks cross. Warm terracotta walls, decorative patterned tiles on stair risers. CRITICAL ART STYLE: Kawaii/Sanrio style where the cat's eyes are SOLID BLACK OVALS with NO white parts — two black oval eyes like Hello Kitty's friends. No pupils, no iris, no sclera — just solid black shapes. Flat colours, simple shapes. No text. Landscape orientation.",
    },
    {
        # Page 4: Cat knocks blue cup off shelf in living room — blue glue still on cat
        "name": "page4",
        "prompt": "Full room view of a colourful Mexican living room. A medium-sized ginger tabby cat with orange stripes, white chest, white paws, and white-tipped tail leaps across the room and knocks a blue ceramic cup off a wooden shelf. The cat has blue glue smears visible on its back and fur from an earlier mess. Tea spills toward a bright woven striped rug below. Warm terracotta walls with colourful pottery and small ceramic animals on shelves. A green armchair with patterned cushions. Whimsical children's book illustration. CRITICAL: Eyes MUST be tiny solid black filled circles — NO white. No text. Landscape orientation.",
    },
    {
        # Page 5: Dad slips on wet kitchen floor — cat with blue glue runs past
        "name": "page5",
        "prompt": "Full room view of a Mexican kitchen. A man in a cream button-up shirt with rolled sleeves slips and falls on a wet floor while a medium-sized ginger tabby cat with orange stripes, white chest, white paws, and white-tipped tail runs past his feet. The cat has blue glue smears on its back. Blue and white Talavera patterned tiles on the wall behind. Modern kitchen with clay pots on a shelf. A puddle of spilt tea on the terracotta floor. Whimsical children's book illustration. CRITICAL: ALL characters MUST have eyes that are tiny solid black filled circles — NO white. No text. Landscape orientation.",
        "side_hero": True,
    },
    {
        # Page 6: Girl catches falling flower pot in garden — cat on wall with blue glue
        "name": "page6",
        "prompt": "Kawaii children's book illustration of a Mexican garden patio. A cute cartoon girl in yellow t-shirt and blue dungarees dives to catch a falling terracotta pot of blue flowers. On the garden wall, a kawaii-style cartoon ginger tabby cat with orange stripes sits looking guilty with blue glue smears on its back. Lush patio with bougainvillea, potted plants and cacti. ABSOLUTELY CRITICAL EYE RULE: The ginger cat MUST have tiny solid completely BLACK filled circles for eyes, like dots drawn with a black marker. ZERO white, NO sclera, NO highlights, NO reflections. Just solid black dots. Same for the girl. Flat colours, simple shapes, cute Japanese illustration style. No text. Landscape orientation.",
    },
    {
        # Page 7: Girl and Dad cleaning up, cat licking blue glue off fur
        "name": "page7",
        "prompt": "Full room view. A girl and a man with a moustache in a cream shirt clean up the sticky blue mess on the low light-wood craft table, both wiping it with cloths. Craft supplies scattered on the table. On the tiled floor in front of the table sits ONE medium-sized short-haired ginger tabby cat with orange stripes, white chest, white paws, and white-tipped tail, licking a blue glue stain off its fur, blue smudges on its back. They look tired but amused. This is the SAME bedroom as page 1. " + GLUE_BEDROOM + " Whimsical children's book illustration. ABSOLUTELY CRITICAL: Every eye on every character — girl, man, AND cat — MUST be tiny solid BLACK filled circles with ZERO white, ZERO highlights, ZERO sclera. No text. Landscape orientation.",
        "side_hero": True,
    },
    {
        # Page 8: Girl gives card to Mum at front entrance
        "name": "page8",
        "prompt": "A girl proudly gives a white handmade card with a blue bird drawing to a woman at the entrance of a colourful Mexican home. Warm afternoon light, potted plants and bougainvillea by the doorway, terracotta tiles. The woman smiles with delight. Whimsical children's book illustration. CRITICAL: ALL characters MUST have eyes that are tiny solid black filled circles — NO white. No text. Landscape orientation.",
    },
]}

# ═══════════════════════════════════════════════════════════════════
# LEVEL 4.4 — "How Now?" (Masjid Putra / Pink Mosque, Putrajaya, Malaysia)
# ═══════════════════════════════════════════════════════════════════
# CHARACTER: Malaysian boy in bright orange t-shirt and blue shorts
# SIDE CHARACTER: Mum in dark green abaya and black niqab (only eyes visible)
#
# KEY OBJECTS (MUST be identical in ALL prompts):
# - PINK MOSQUE: "Masjid Putra — stunning rose-pink granite mosque with multiple domes and tall minarets"
# - BLUE LAKE: "Putrajaya Lake — calm blue water reflecting the pink mosque"
# - MONKEY: "a brown long-tailed macaque monkey with pale face, brown fur, long tail"
# - SNACK: "a small snack bag/packet"
# - GARDENS: "manicured gardens with palm trees, tropical flowers, and hedges"
#
# SETTING: Masjid Putra, Putrajaya, Malaysia
# - Stunning rose-pink granite mosque with domes and minarets
# - Putrajaya Lake with reflections
# - Manicured gardens and palm trees
# - Calm, beautiful, peaceful atmosphere
SCENE_PROMPTS["4.4"] = {
    "title": "How Now?",
    "scenes": [
    {
        # COVER: Boy near pink mosque with monkey, Mum nearby
        "name": "cover",
        "prompt": "A Malaysian boy (about 5 years old, warm brown skin, short black hair, round cheerful face, bright orange cotton t-shirt, blue knee-length shorts, simple sandals) stands in the gardens near the stunning rose-pink Masjid Putra (Putra Mosque) in Putrajaya, Malaysia. The beautiful pink granite domes and tall minarets rise behind him against a bright blue sky. A cheeky brown long-tailed macaque monkey with pale face sits on a garden wall nearby. His mother (Malaysian woman, warm brown skin visible around eyes, flowing dark green abaya, black niqab covering face except warm brown eyes) stands beside him. Putrajaya Lake and palm trees in the background. Bright sunny day. Whimsical children's book illustration with soft watercolour textured background. ABSOLUTELY CRITICAL: All characters MUST have eyes that are tiny solid black filled dots — NO white sclera, NO iris detail, just simple black dots. Portrait orientation.",
    },
    {
        # Page 1: Boy and Mum arrive at the pink mosque
        "name": "page1",
        "prompt": "A Malaysian boy (about 5 years old, warm brown skin, short black hair, round cheerful face, bright orange cotton t-shirt, blue knee-length shorts) and his mother (Malaysian woman, warm brown skin around eyes, flowing dark green abaya, black niqab covering face except warm brown eyes) stand in the gardens looking up at the stunning Masjid Putra (Putra Mosque) in Putrajaya, Malaysia. The mosque has beautiful rose-pink granite domes and tall minarets against a bright blue sky. Manicured gardens with tropical flowers in the foreground. The boy looks amazed, pointing up at the pink domes. Warm morning light. Whimsical children's book illustration with soft watercolour texture. ABSOLUTELY CRITICAL: All characters MUST have eyes that are tiny solid black filled dots — NO white sclera, NO iris detail, just simple black dots. Landscape orientation.",
    },
    {
        # Page 2: Boy and Mum walk by the lake
        "name": "page2",
        "prompt": "A Malaysian boy (about 5 years old, warm brown skin, short black hair, bright orange cotton t-shirt, blue knee-length shorts) walks with his mother (Malaysian woman, warm brown skin around eyes, flowing dark green abaya, black niqab) along the edge of Putrajaya Lake. The beautiful rose-pink Masjid Putra mosque is reflected in the calm blue water. Palm trees and manicured gardens line the lakeside path. Other visitors (families, some women in hijab) stroll in the background. Peaceful morning atmosphere. The boy looks happy, walking beside Mum. Whimsical children's book illustration with soft watercolour texture. ABSOLUTELY CRITICAL: All characters MUST have eyes that are tiny solid black filled dots — NO white sclera, NO iris detail, just simple black dots. Landscape orientation.",
    },
    {
        # Page 3: Boy sees monkey on garden wall
        "name": "page3",
        "prompt": "A Malaysian boy (about 5 years old, warm brown skin, short black hair, bright orange cotton t-shirt, blue knee-length shorts) stops on the lakeside path near Masjid Putra, looking surprised at a brown long-tailed macaque monkey sitting on a low garden wall. The monkey has brown fur, a pale face, and a long curving tail. It turns its head to stare at the boy with a cheeky expression. The rose-pink mosque and blue lake visible in the background. Gardens and tropical plants around them. The boy looks amazed with his hands raised in surprise. Whimsical children's book illustration with soft watercolour texture. ABSOLUTELY CRITICAL: Boy MUST have eyes that are tiny solid black filled dots — NO white sclera, NO iris detail, just simple black dots. Landscape orientation.",
    },
    {
        # Page 4: Monkey steals snack and runs into garden
        "name": "page4",
        "prompt": "A cheeky brown long-tailed macaque monkey with pale face runs through the manicured gardens near Masjid Putra, holding a small snack packet in its paws. A Malaysian boy (about 5 years old, warm brown skin, short black hair, bright orange cotton t-shirt, blue knee-length shorts) chases after it with arms outstretched, looking determined. The monkey looks back with a mischievous grin. Pink flowering bushes and palm trees in the garden. The rose-pink mosque domes visible in the background. Action and movement in the scene. Whimsical children's book illustration with soft watercolour texture. ABSOLUTELY CRITICAL: Boy MUST have eyes that are tiny solid black filled dots — NO white sclera, NO iris detail, just simple black dots. Landscape orientation.",
    },
    {
        # Page 5: Boy chases monkey past a tree
        "name": "page5",
        "prompt": "A Malaysian boy (about 5 years old, warm brown skin, short black hair, bright orange cotton t-shirt, blue knee-length shorts) runs through the gardens of Masjid Putra, looking around a large palm tree. The brown tail of a macaque monkey is just visible disappearing behind the trunk. Colourful tropical flowers and manicured hedges in the garden. The stunning pink mosque with its domes and minarets rises in the background. The boy looks puzzled, searching for the monkey. Whimsical children's book illustration with soft watercolour texture. ABSOLUTELY CRITICAL: Boy MUST have eyes that are tiny solid black filled dots — NO white sclera, NO iris detail, just simple black dots. Landscape orientation.",
    },
    {
        # Page 6: Monkey sits by the lake munching
        "name": "page6",
        "prompt": "By the edge of Putrajaya Lake, a Malaysian boy (about 5 years old, warm brown skin, short black hair, bright orange cotton t-shirt, blue knee-length shorts) stands catching his breath, looking at a brown long-tailed macaque monkey with pale face sitting contentedly on the lakeside wall. The monkey is calmly eating the snack packet, looking unbothered. The beautiful rose-pink Masjid Putra mosque is reflected in the calm blue lake behind them. The boy has his hands on his hips, looking amused. Whimsical children's book illustration with soft watercolour texture. ABSOLUTELY CRITICAL: Boy MUST have eyes that are tiny solid black filled dots — NO white sclera, NO iris detail, just simple black dots. Landscape orientation.",
    },
    {
        # Page 7: Mum arrives, proud of boy
        "name": "page7",
        "prompt": "By Putrajaya Lake, a Malaysian boy (about 5 years old, warm brown skin, short black hair, bright orange cotton t-shirt, blue knee-length shorts) stands proudly with his mother (Malaysian woman, warm brown skin around eyes, flowing dark green abaya, black niqab covering face except warm brown eyes showing a warm smile). The mother's gown flows gently in the breeze. The brown long-tailed macaque monkey sits nearby on the wall, still munching. The stunning rose-pink Masjid Putra mosque and its reflection in the blue lake behind them. Both look happy. Warm tropical light. Whimsical children's book illustration with soft watercolour texture. ABSOLUTELY CRITICAL: All characters MUST have eyes that are tiny solid black filled dots — NO white sclera, NO iris detail, just simple black dots. Landscape orientation.",
    },
    {
        # Page 8: Boy and Mum sit by the lake looking at the mosque
        "name": "page8",
        "prompt": "A Malaysian boy (about 5 years old, warm brown skin, short black hair, bright orange cotton t-shirt, blue knee-length shorts) sits on a low wall by Putrajaya Lake with his mother (Malaysian woman, warm brown skin around eyes, flowing dark green abaya, black niqab covering face except warm brown eyes). They look out at the stunning view — the rose-pink Masjid Putra mosque with its domes and minarets reflected perfectly in the calm blue water. The brown long-tailed macaque monkey sits nearby contentedly. Both boy and mother look happy and peaceful. Warm golden afternoon light. Beautiful, serene scene. Whimsical children's book illustration with soft watercolour texture. ABSOLUTELY CRITICAL: All characters MUST have eyes that are tiny solid black filled dots — NO white sclera, NO iris detail, just simple black dots. Landscape orientation.",
    },
]}


# ═══════════════════════════════════════════════════════════════════════════════
# LEVEL 5.2: Near the Door
# ═══════════════════════════════════════════════════════════════════════════════
#
# MAIN CHARACTER: Swedish girl (Astrid)
# - Light skin with rosy cheeks from the cold
# - Long straight blonde hair in two braids
# - Cosy red wool jumper (hand-knitted style), dark blue jeans, thick woolly socks
#
# SIDE CHARACTER: Swedish Dad
# - Light skin, short brown hair, friendly face with slight stubble
# - Grey wool sweater (Scandinavian pattern at neckline), dark trousers
#
# ANIMAL: Red fox
# - Bright orange-red fur, white chest, big pointed ears with black tips
# - Bushy tail with white tip, dark intelligent eyes
#
# SETTING: Modern Scandinavian home in Stockholm suburb (winter)
# - Minimalist design, wood-burning stove, wooden floors, sheepskin rugs
# - White front door, snowy garden, birch trees
#
SCENE_PROMPTS["5.2"] = {
    "title": "Near the Door",
    "scenes": [
    {
        # COVER: Girl kneeling in snow beside red fox
        "name": "cover",
        "prompt": "A Swedish girl (about 5 years old, light skin with rosy cheeks, long straight blonde hair in two braids, cosy red hand-knitted wool jumper, dark blue jeans) kneels in the snow beside a beautiful red fox with bright orange-red fur, white chest, big pointed ears with black tips, and a bushy tail with white tip. Behind them, a modern Scandinavian wooden house painted dark red with a white front door, snow on the roof, birch trees with white bark. Magical winter scene with soft falling snow. Whimsical children's book illustration with soft watercolour texture. ABSOLUTELY CRITICAL: Girl MUST have eyes that are tiny solid black filled dots — NO white sclera, NO iris detail, just simple black dots. Portrait orientation.",
    },
    {
        # Page 1: Girl crouches by door, listening
        "name": "page1",
        "prompt": "A Swedish girl (about 5 years old, light skin with rosy cheeks, long straight blonde hair in two braids, cosy red hand-knitted wool jumper, dark blue jeans, thick woolly socks) crouches on a pale wooden floor inside a modern Scandinavian home, pressing her ear to a white front door. Minimalist decor with sheepskin rug, simple wooden furniture, snow visible through a nearby window. She looks curious and intent. Warm interior lighting. Whimsical children's book illustration with soft watercolour texture. ABSOLUTELY CRITICAL: Girl MUST have eyes that are tiny solid black filled dots — NO white sclera, NO iris detail, just simple black dots. Landscape orientation.",
    },
    {
        # Page 2: Dad sits by fire, smiling knowingly
        "name": "page2",
        "prompt": "A Swedish dad (light skin, short brown hair, friendly face with slight stubble, grey wool sweater with Scandinavian pattern at neckline, dark trousers, woolly socks) sits in a cosy armchair by a wood-burning stove with orange flames visible through glass door. Snow falls gently outside the window behind him. He has a warm, knowing smile. Modern minimalist Swedish living room with pale wooden floors and simple furniture. Whimsical children's book illustration with soft watercolour texture. ABSOLUTELY CRITICAL: Dad MUST have eyes that are tiny solid black filled dots — NO white sclera, NO iris detail, just simple black dots. Landscape orientation.",
    },
    {
        # Page 3: Girl peers nervously through frosty window
        "name": "page3",
        "prompt": "A Swedish girl (about 5 years old, light skin with rosy cheeks, long straight blonde hair in two braids, cosy red wool jumper) peers nervously through a frosty window beside the white front door. Outside in the snowy garden, a mysterious dark reddish shape is visible in the snow. Her expression shows curiosity mixed with slight apprehension. Warm interior contrasts with cold snowy exterior. Condensation on the cold window glass. Whimsical children's book illustration with soft watercolour texture. ABSOLUTELY CRITICAL: Girl MUST have eyes that are tiny solid black filled dots — NO white sclera, NO iris detail, just simple black dots. Landscape orientation.",
    },
    {
        # Page 4: Dad gestures encouragingly toward door
        "name": "page4",
        "prompt": "A Swedish dad (light skin, short brown hair, grey wool sweater with Scandinavian pattern) sits in his armchair by the wood-burning stove, gesturing encouragingly toward the front door with a warm, knowing smile. A Swedish girl (about 5 years old, blonde braids, red jumper, seen from behind) stands hesitantly near the white door. Cosy modern Swedish living room with warm firelight and pale wooden floors. Whimsical children's book illustration with soft watercolour texture. ABSOLUTELY CRITICAL: Dad MUST have eyes that are tiny solid black filled dots — NO white sclera, NO iris detail, just simple black dots. Landscape orientation.",
    },
    {
        # Page 5: Girl opens door to reveal fox in snow
        "name": "page5",
        "prompt": "A Swedish girl (about 5 years old, light skin with rosy cheeks, long straight blonde hair in two braids, cosy red wool jumper, dark blue jeans) has opened the white front door wide, revealing a beautiful red fox sitting in the snowy garden. The fox has bright orange-red fur, white chest, big pointed ears with black tips, and a bushy tail. The girl's face shows pure delight and wonder. Snow-covered garden with white-barked birch trees and a wooden fence. Bright winter daylight streaming in. Whimsical children's book illustration with soft watercolour texture. ABSOLUTELY CRITICAL: Girl MUST have eyes that are tiny solid black filled dots — NO white sclera, NO iris detail, just simple black dots. Landscape orientation.",
    },
    {
        # Page 6: Dad stands beside girl at open door
        "name": "page6",
        "prompt": "A Swedish dad (light skin, short brown hair, grey wool sweater) stands beside a Swedish girl (about 5 years old, blonde braids, red jumper) at the open white front door, one hand resting gently on her shoulder. A red fox with bright orange-red fur, white chest, and bushy tail sits in the snow looking up at them with bright dark eyes. Both humans are smiling warmly at the fox. Snowy Swedish garden with birch trees visible. Cold winter air meeting warm interior. Whimsical children's book illustration with soft watercolour texture. ABSOLUTELY CRITICAL: All characters MUST have eyes that are tiny solid black filled dots — NO white sclera, NO iris detail, just simple black dots. Landscape orientation.",
    },
    {
        # Page 7: Fox eats from dish, girl watches from doorway
        "name": "page7",
        "prompt": "A red fox with bright orange-red fur, white chest, and fluffy bushy tail eats food from a small dish on the snowy wooden doorstep. A Swedish girl (about 5 years old, light skin, blonde hair in two braids, red wool jumper) sits on the pale wooden floor just inside the doorway, watching with wonder. A Swedish dad (grey wool sweater) stands nearby with a warm smile. The fox's tail is bright against the white snow. Soft winter light. Whimsical children's book illustration with soft watercolour texture. ABSOLUTELY CRITICAL: All characters MUST have eyes that are tiny solid black filled dots — NO white sclera, NO iris detail, just simple black dots. Landscape orientation.",
    },
    {
        # Page 8: Girl waves goodbye as fox trots away
        "name": "page8",
        "prompt": "A Swedish girl (about 5 years old, light skin with rosy cheeks, long straight blonde hair in two braids, cosy red wool jumper) waves goodbye from the white doorway as a red fox with bright orange-red fur and bushy white-tipped tail trots away through the snowy garden toward white-barked birch trees. A Swedish dad (grey wool sweater) stands behind her with a warm smile, one hand on her shoulder. Soft winter light, peaceful snowy landscape, quiet ending. Whimsical children's book illustration with soft watercolour texture. ABSOLUTELY CRITICAL: All characters MUST have eyes that are tiny solid black filled dots — NO white sclera, NO iris detail, just simple black dots. Landscape orientation.",
    },
]}

# ═══════════════════════════════════════════════════════════════════
# LEVEL 5.3 — "Sure She Can!" (Jaipur, Rajasthan — Makar Sankranti kite festival)
# ═══════════════════════════════════════════════════════════════════
# CHARACTER: Indian girl — bright yellow kurta + salwar, black braids with yellow ribbons
# DADAJI: Elderly grandfather — cream angrakha kurta, saffron pagri turban, white beard
# KEY OBJECTS:
# - KITE: bright yellow diamond-shaped kite with bamboo cross frame and white string
#   (must be CONSISTENT across pages 4-8: same yellow colour, same diamond shape)
# - BAMBOO STICKS: two thin pale bamboo sticks
# - PAPER: thin white paper sheet
# - PASTE: small round clay pot of paste
# SETTING: Jaipur rooftop — pink sandstone buildings, blue winter sky, colourful kites

SCENE_PROMPTS["5.3"] = {
    "title": "Sure She Can!",
    "side_hero_key": "5.3_dadaji",
    "scenes": [
    {
        # COVER: Girl holds yellow kite triumphantly, Dadaji claps, Jaipur rooftop
        "name": "cover",
        "side_hero": True,
        "side_hero_key": "5.3_dadaji",
        "prompt": "BOOK COVER ILLUSTRATION. Show the girl character from the FIRST reference image holding up a bright yellow diamond-shaped kite triumphantly on a Jaipur rooftop. The elderly grandfather Dadaji from the SECOND reference image (cream angrakha kurta, saffron-orange pagri turban, white beard) stands beside her clapping joyfully. Pink sandstone buildings all around. Dozens of colourful kites fill a vivid blue winter sky. Celebratory, joyful mood. Same girl character, same outfit (bright yellow kurta, yellow salwar, black braids with yellow ribbons). CRITICAL: ALL characters MUST have eyes that are tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Portrait orientation.",
    },
    {
        # Page 1: Girl alone on rooftop watching kites
        "name": "page1",
        "prompt": "Wide-angle view from a Jaipur rooftop. Dozens of colourful kites — red, green, blue, orange — fill a clear vivid blue winter sky. Pink sandstone buildings with domed rooftops stretch across the background. Show the character from the reference image standing on the PINK SANDSTONE rooftop looking up at the kites. She is alone on the rooftop — no other people. Same character, same outfit (bright yellow kurta, yellow salwar, black braids with yellow ribbons, flat sandals). ABSOLUTELY CRITICAL EYE RULE: Her eyes MUST be tiny solid black filled circles like dots drawn with a marker — NO white sclera, NO white around the black, NO iris, NO pupil detail, NO highlights. Just small simple black dots like a teddy bear's eyes. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 2: Dadaji holds materials, girl leans forward excitedly
        "name": "page2",
        "side_hero": True,
        "side_hero_key": "5.3_dadaji",
        "prompt": "Show the girl character from the FIRST reference image and the elderly grandfather Dadaji from the SECOND reference image on a Jaipur rooftop. Dadaji (cream angrakha kurta, saffron pagri turban, white beard) sits cross-legged, smiling warmly, holding up a thin white paper sheet in one hand and two pale bamboo sticks in the other. The girl leans forward with excitement. JUST THESE TWO CHARACTERS. Blue sky with colourful kites behind them. Same girl outfit (bright yellow kurta, yellow salwar, black braids with yellow ribbons). CRITICAL: ALL characters MUST have eyes that are tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 3: Girl ties bamboo sticks in cross shape, Dadaji points
        "name": "page3",
        "side_hero": True,
        "side_hero_key": "5.3_dadaji",
        "prompt": "Show the girl character from the FIRST reference image kneeling on a PINK SANDSTONE Jaipur rooftop floor, carefully tying two thin pale bamboo sticks in a cross (+) shape with white string. Her tongue sticks out slightly in concentration. The elderly grandfather Dadaji from the SECOND reference image (cream angrakha kurta, saffron pagri turban, white beard) crouches beside her, pointing gently at the crossing point. JUST THESE TWO CHARACTERS. The rooftop is made of warm PINK sandstone tiles. Pink sandstone buildings with arched windows and domed rooftops visible in the background — this is JAIPUR, the Pink City. Blue sky with colourful kites. Same girl outfit. CRITICAL: ALL characters MUST have eyes that are tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 4: Paper rips! Girl dismayed, Dadaji calm
        "name": "page4",
        "side_hero": True,
        "side_hero_key": "5.3_dadaji",
        "prompt": "Show the girl character from the FIRST reference image kneeling on a PINK SANDSTONE Jaipur rooftop, pressing a large sheet of thin white paper onto a bamboo cross frame on the floor. The paper has a long diagonal rip running through it — it has clearly torn! Her expression shows dismay and disappointment — brows furrowed, mouth turned down. The elderly grandfather Dadaji from the SECOND reference image (cream angrakha kurta, saffron pagri turban, white beard) sits nearby looking calm and patient. JUST THESE TWO CHARACTERS. The rooftop is made of warm PINK sandstone tiles. Pink sandstone buildings with arched windows and domed rooftops visible in the background — this is JAIPUR, the Pink City. Blue sky with kites. Same girl outfit. CRITICAL: ALL characters MUST have eyes that are tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 5: Girl frustrated with crossed arms, Dadaji patient
        "name": "page5",
        "side_hero": True,
        "side_hero_key": "5.3_dadaji",
        "prompt": "Show the girl character from the FIRST reference image sitting on a PINK SANDSTONE Jaipur rooftop with arms crossed and brow furrowed in clear frustration. Crumpled torn paper lies beside her on the ground. The elderly grandfather Dadaji from the SECOND reference image (cream angrakha kurta, saffron pagri turban, white beard) sits nearby completely calm and patient, hands resting quietly in his lap, looking at her with gentle kindness. JUST THESE TWO CHARACTERS. The rooftop is made of warm PINK sandstone tiles. Pink sandstone buildings with arched windows and domed rooftops visible in the background — this is JAIPUR, the Pink City. Blue sky with colourful kites. Same girl outfit. CRITICAL: ALL characters MUST have eyes that are tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 6: Girl carefully pressing fresh paper, Dadaji watches proudly
        "name": "page6",
        "side_hero": True,
        "side_hero_key": "5.3_dadaji",
        "prompt": "Show the girl character from the FIRST reference image kneeling on a Jaipur rooftop, pressing a fresh sheet of thin white paper carefully and deliberately flat onto the bamboo cross frame. A small round clay pot of paste sits beside her. Her expression shows calm focused determination. The elderly grandfather Dadaji from the SECOND reference image (cream angrakha kurta, saffron pagri turban, white beard) watches with a proud smile. JUST THESE TWO CHARACTERS. Pink sandstone buildings visible. Blue sky with kites. Same girl outfit. CRITICAL: ALL characters MUST have eyes that are tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 7: Girl runs with bright yellow kite, Dadaji points upward
        "name": "page7",
        "side_hero": True,
        "side_hero_key": "5.3_dadaji",
        "prompt": "Show the girl character from the FIRST reference image running across a Jaipur rooftop, arms raised high, holding a bright yellow diamond-shaped kite aloft. The kite is a simple diamond shape made of yellow paper on a bamboo cross frame — NO green corners, NO tail, just plain bright yellow with bamboo cross visible through it. White string trails behind her. Her face is full of excitement and effort, mouth open with joy. The elderly grandfather Dadaji from the SECOND reference image (cream angrakha kurta, saffron pagri turban, white beard) stands at the rooftop edge smiling and pointing upward. JUST THESE TWO CHARACTERS. Pink sandstone buildings around them, colourful kites in blue sky. Same girl outfit. CRITICAL: ALL characters MUST have eyes that are tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Landscape orientation.",
    },
    {
        # Page 8: Kite soaring high, girl cheers, Dadaji claps, neighbours wave
        "name": "page8",
        "side_hero": True,
        "side_hero_key": "5.3_dadaji",
        "prompt": "A bright yellow diamond-shaped kite soars HIGH in a vivid clear blue sky above pink Jaipur sandstone buildings. The kite is plain bright yellow with bamboo cross visible — NO green, NO tail, same kite as previous page. Other colourful kites surround it. Below on the rooftop, the girl from the FIRST reference image throws both arms in the air with a huge radiant smile of pure joy. The elderly grandfather Dadaji from the SECOND reference image (cream angrakha kurta, saffron pagri turban, white beard) claps his hands beside her. On a neighbouring rooftop, two small people wave and cheer. Same girl outfit. CRITICAL: ALL characters MUST have eyes that are tiny solid black filled circles — NO white. Whimsical children's book illustration. No text. Landscape orientation.",
    },
]}

# The SETTING, as drawable features rather than a place name.  Every scene gets
# this verbatim so the ground, the parapet and the background kites stop
# drifting between pages (Lynden 2026-07-27: "the image settings and the object
# isn't really strong with consistency here").
JAIPUR_ROOFTOP = (
    "THE SETTING (identical in every scene): a flat rooftop terrace in Jaipur. "
    "The GROUND is paved with large square terracotta-pink stone tiles with "
    "visible joins. A LOW parapet wall of the same pink stone runs along the "
    "roof edge. Behind it stand pink sandstone Jaipur buildings with domed "
    "chhatri pavilions and scalloped arch windows, all in the same dusty rose "
    "pink. The sky is a clear bright blue winter sky with a few soft white "
    "clouds. BACKGROUND KITES: small, PLAIN SOLID-COLOUR diamond kites (red, "
    "green, blue, orange, pink) on thin dark string lines — no patterns, no "
    "stripes, no long ribbon tails, no bows. Warm midday light."
)

# The hero kite is THE recurring object of this book, so pin it on every scene
# that shows it finished — it was drifting (plain diamond on the cover, a small
# flap on page 7, a long ribbon tail on page 8).  Lynden 2026-07-27: "the image
# settings and the object isn't really strong with consistency here".
HERO_KITE = (
    "THE KITE (identical every time it appears): a plain BRIGHT YELLOW "
    "diamond-shaped kite made of thin yellow paper over a pale bamboo cross "
    "frame, the cross clearly visible through the paper, flown on a thin WHITE "
    "string. It is plain yellow all over — NO pattern, NO coloured corners, NO "
    "green, NO stripes. It has NO TAIL AT ALL: no ribbon, no bows, no streamer, "
    "no flap hanging from the bottom point."
)
for _sc in SCENE_PROMPTS["5.3"]["scenes"]:
    _sc["prompt"] = _sc["prompt"] + " " + JAIPUR_ROOFTOP
    if _sc["name"] in ("cover", "page7", "page8"):
        _sc["prompt"] = _sc["prompt"] + " " + HERO_KITE


# ═══════════════════════════════════════════════════════════════════
# LEVEL 5.4 — "A Place for Me" (Cartagena, Colombia — morning fruit market, lost and found)
# ═══════════════════════════════════════════════════════════════════
# CHARACTER: Visiting British boy — blue t-shirt, khaki trousers, straight brown hair
# SIDE HEROES:
# - LOCAL COLOMBIAN BOY: curly dark brown hair, warm brown skin, green t-shirt (use side hero 5.4_local_boy)
# - DAD: light skin, brown hair, casual shirt (use side hero 5.4_dad)
# SETTING: Cartagena walled old city — BOLD vivid colonial buildings (bright yellow,
# terracotta orange, cobalt blue), wooden balconies overflowing with pink bougainvillea,
# terracotta clay tile roofs, cobblestone streets, coconut palms, fruit market stalls

# The SETTING and the KEY OBJECT, as drawable features shared verbatim by every
# scene — the same fix used for 5.3's rooftop and 6.3's bedroom.
CARTAGENA_MARKET = (
    "THE SETTING (identical in every scene): a morning street market inside the "
    "walled old city of Cartagena, Colombia. The GROUND is a pale grey "
    "COBBLESTONE street. The buildings are two-storey Spanish colonial fronts in "
    "bold flat colours — bright yellow, terracotta orange and cobalt blue — with "
    "carved dark-wood balconies spilling pink bougainvillea, and terracotta "
    "clay-tile roofs. The market STANDS are simple wooden tables at adult waist "
    "height, shaded by big rectangular cloth awnings in red, green and blue, "
    "piled with tropical fruit. Warm early-morning light, clear pale blue sky."
)

# The local boy's hair drifted to a flat cropped cap on page6 (Lynden 2026-07-29:
# "the boy's afro when on the step is way too small") while pages 4 and 7 kept the
# reference's volume.  Pinned as a drawable feature on every scene he appears in.
LOCAL_BOY_HAIR = (
    "THE COLOMBIAN BOY'S HAIR (identical in every scene): a BIG, ROUND, "
    "VOLUMINOUS afro of tight dark-brown curls. It is a wide halo that is "
    "clearly WIDER THAN HIS FACE on both sides and rises about half a "
    "head-height above his crown, with a bumpy curly silhouette and a few loose "
    "curls springing out past the outline. It is NOT flat, NOT a short cropped "
    "cap, NOT smoothed down against his skull, and never smaller than in his "
    "reference image."
)

MANGO = (
    "THE MANGO (identical every time it appears): a large ripe mango, rounded "
    "and oval, with smooth GOLDEN-YELLOW skin blushed red-orange on one "
    "shoulder. It is NOT a banana, NOT a plantain, NOT crescent-shaped."
)

SCENE_PROMPTS["5.4"] = {
    "title": "A Place for Me",
    "side_hero_key": "5.4_local_boy",
    "scenes": [
    {
        # COVER: the boy alone in the crowd — must NOT duplicate page 3
        "name": "cover",
        "prompt": (
            "BOOK COVER ILLUSTRATION. The British boy from the reference image stands "
            "ALONE in the middle of the busy market street, small against the crowd, "
            "holding the strap of his bag with both hands and looking up and around "
            "with a worried face. Grown-ups walk past on both sides without noticing "
            "him; their bodies are cut off by the edges of the picture so he is the "
            "only whole figure. He is STANDING ON THE COBBLESTONES in the open street "
            "\u2014 NOT sitting, NOT on a step, NOT in a doorway. Portrait orientation."
        ),
    },
    {
        # Page 1: arriving with Dad, market just waking up
        "name": "page1",
        "prompt": (
            "The British boy from the FIRST reference image walks into the market "
            "street beside his dad from the SECOND reference image, both seen from "
            "behind and slightly to one side, the boy looking up at the stands with "
            "interest. The market is JUST OPENING: vendors are still laying fruit out "
            "on the wooden tables, and BIG RECTANGULAR SHEETS OF CLOTH IN RED, GREEN "
            "AND BLUE are strung above the stands as awnings, catching the early light. "
            "Only a few people about. Landscape orientation."
        ),
        "side_hero": True,
        "side_hero_key": "5.4_dad",
    },
    {
        # Page 2: the market fills up and Dad is gone
        "name": "page2",
        "prompt": (
            "The British boy from the reference image waits alone in a now-crowded "
            "market street. He stands on the open COBBLESTONES with a clear gap of "
            "empty ground between him and the nearest fruit table, holding the strap "
            "of his own bag with BOTH HANDS against his chest, chin lifted and heels "
            "raised slightly off the ground as he cranes to look past the grown-ups "
            "for his dad. His face is uncertain. "
            "CRITICAL — HIS HANDS AND BODY TOUCH NOTHING: he is not standing on, "
            "sitting on, leaning over, climbing on or reaching across the stall; he "
            "does not touch the fruit, the table, the awning or its posts, and no part "
            "of him overlaps the tabletop. "
            "CRITICAL — COMPOSITION: the view is from a slight angle, NOT symmetrical. "
            "The boy stands OFF-CENTRE, to one side of the picture, and the fruit stand "
            "with its awning sits to the OTHER side, angled away, so nothing is dead "
            "centre and no post rises behind his head. "
            "CRITICAL — THE CROWD: the shoppers are WALKING PAST in both directions "
            "and are seen mostly from BEHIND or in three-quarter view, busy with their "
            "own errands. NOBODY faces the viewer, nobody looks at the camera and "
            "nobody stares at the boy. They are NOT lined up in rows and NOT standing "
            "still. Vary them clearly — different heights, ages, builds, hair and "
            "clothing colours, some carrying baskets, some with children — with no two "
            "faces alike and no repeated figure. The nearest grown-ups are large and "
            "cut off by the edges of the picture, the ones further away are smaller, so "
            "the street has real depth and the boy looks small and hemmed in among "
            "them. Landscape orientation."
        ),
    },
    {
        # Page 3: looking left and right — STANDING, not sitting
        "name": "page3",
        "prompt": (
            "The British boy from the reference image stands alone in the middle of the "
            "cobblestone market street, turning his head sharply to look to one side, "
            "one hand raised to his chest. His eyes search the crowd and his mouth is a "
            "small worried line \u2014 he cannot find his dad. Wooden doors and market "
            "stands line the street behind him. He is STANDING UP in the open street: "
            "NOT sitting, NOT on a doorstep, NOT hugging his knees. Landscape orientation."
        ),
    },
    {
        # Page 4: the local boy appears at his side
        "name": "page4",
        "prompt": (
            "The British boy from the FIRST reference image stands in the market street "
            "and turns to look at the local Colombian boy from the SECOND reference "
            "image, who has just walked up beside him. The local boy has a big open "
            "grin and one hand raised in a friendly greeting; the British boy looks "
            "surprised, the worry just starting to lift. BOTH BOYS ARE STANDING on the "
            "cobblestones, facing each other, roughly the same height. Landscape orientation."
        ),
        "side_hero": True,
        "side_hero_key": "5.4_local_boy",
    },
    {
        # Page 5: the local boy holds up a mango — IN FRONT of the stall
        "name": "page5",
        "prompt": (
            "The two boys walk together past a fruit stand. The local Colombian boy "
            "from the SECOND reference image holds a big mango up in one hand at head "
            "height, grinning at his friend; the British boy from the FIRST reference "
            "image walks beside him, smiling back for the first time. "
            "CRITICAL: BOTH BOYS STAND IN FRONT OF the stall, on the shopper's side, "
            "as customers. Neither boy is behind the table and neither is a vendor. "
            "They are CHILDREN, not adults. Landscape orientation."
        ),
        "side_hero": True,
        "side_hero_key": "5.4_local_boy",
    },
    {
        # Page 6: eating the mangos on a doorway step at the SIDE of the street
        "name": "page6",
        "prompt": (
            "The British boy from the FIRST reference image and the local Colombian boy "
            "from the SECOND reference image sit side by side on the STONE DOORSTEP OF A "
            "BUILDING, each holding a large ripe MANGO in both hands and biting into it. "
            "Golden mango juice runs down the British boy's chin and he is laughing. "
            "CRITICAL \u2014 WHERE THEY ARE SITTING: the step is the entrance stoop of a "
            "colonial house at the EDGE of the street. It is a short flight of two or "
            "three worn pale stone steps that run along the front WALL of the building "
            "and lead up to a tall arched dark-wood door directly BEHIND the boys. The "
            "wall of the house is right at their backs and the door frame rises behind "
            "their heads; the boys sit on the top step with their feet resting on the "
            "step below. There must be NO free-standing stone block, bench, boulder, "
            "plinth or slab sitting on its own in the middle of the road \u2014 the step "
            "is ATTACHED to the building and the boys are tucked out of the way at the "
            "side of the street, in the cool shade of the doorway. "
            "The cobblestone street with its market stalls runs away to ONE SIDE of the "
            "picture, seen from a slight angle, so the doorway is not dead centre. "
            "CRITICAL: the fruit is MANGOES \u2014 big rounded golden-yellow ovals. They "
            "are NOT bananas and NOT plantains; no curved yellow fruit anywhere in the "
            "picture. Landscape orientation."
        ),
        "side_hero": True,
        "side_hero_key": "5.4_local_boy",
    },
    {
        # Page 7: the local boy points down the street
        "name": "page7",
        "prompt": (
            "ONLY TWO CHILDREN in this scene \u2014 no other people at all. The local "
            "Colombian boy from the SECOND reference image stands with one arm stretched "
            "straight out to the side, pointing off toward the right edge of the picture, "
            "his face bright with excitement. The British boy from the FIRST reference "
            "image stands next to him following the point, eyes wide with hope. Empty "
            "cobblestone street with colonial buildings behind them. Landscape orientation."
        ),
        "side_hero": True,
        "side_hero_key": "5.4_local_boy",
    },
    {
        # Page 8: Dad lifts him up — text says "picked me up"
        "name": "page8",
        "prompt": (
            "The dad (light skin, short brown hair, pale casual shirt with sleeves "
            "rolled, khaki trousers) has LIFTED the British boy from the FIRST reference "
            "image UP OFF THE GROUND in both arms and holds him in a tight hug, the "
            "boy's feet clear of the cobblestones and his arms round his dad's neck. "
            "Both faces show relief and joy. The local Colombian boy from the SECOND "
            "reference image stands nearby watching them with a warm smile, hands in "
            "his pockets. Landscape orientation."
        ),
        "side_hero": True,
        "side_hero_key": "5.4_local_boy",
    },
]}

for _sc in SCENE_PROMPTS["5.4"]["scenes"]:
    _sc["prompt"] = _sc["prompt"] + " " + CARTAGENA_MARKET
    if _sc.get("side_hero_key") == "5.4_local_boy":
        _sc["prompt"] = _sc["prompt"] + " " + LOCAL_BOY_HAIR
    if _sc["name"] in ("page5", "page6"):
        _sc["prompt"] = _sc["prompt"] + " " + MANGO


# ─── Gemini API Functions ───────────────────────────────────────

async def generate_hero_image(session: aiohttp.ClientSession, level: int | str) -> Path | None:
    """Generate a hero reference image using Gemini text-to-image."""
    hero = HERO_PROMPTS.get(level)
    if not hero:
        print(f"  No hero prompt for level {level}")
        return None

    # Journey-numbered folder (see book_dir_for / OLD_TO_NEW)
    book_dir = book_dir_for(level)
    book_dir.mkdir(parents=True, exist_ok=True)
    hero_path = book_dir / "hero_reference.png"

    full_prompt = f"{hero['description']} {BASE_STYLE}"

    url, headers = image_endpoint()

    payload = {
        "contents": [{"role": "user", "parts": [{"text": full_prompt}]}],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }

    print(f"  [hero] Generating reference image...")

    for attempt in range(MAX_RETRIES):
        try:
            async with session.post(url, json=payload, headers=headers) as response:
                if response.status == 200:
                    result = await response.json()
                    candidates = result.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        for part in parts:
                            if "inlineData" in part:
                                image_data = base64.b64decode(part["inlineData"]["data"])
                                hero_path.write_bytes(image_data)
                                size_kb = len(image_data) / 1024
                                print(f"  [hero] Saved ({size_kb:.0f} KB) -> {hero_path}")
                                return hero_path
                    print(f"  [hero] No image data in response")
                    return None
                elif response.status == 429:
                    wait = BACKOFF_BASE * (2 ** attempt)
                    print(f"  [hero] Rate limited. Waiting {wait}s...")
                    await asyncio.sleep(wait)
                    continue
                elif switch_to_vertex(response.status):
                    url, headers = image_endpoint()
                    continue
                else:
                    text = await response.text()
                    print(f"  [hero] API error {response.status}: {text[:300]}")
                    if attempt < MAX_RETRIES - 1:
                        wait = BACKOFF_BASE * (2 ** attempt)
                        print(f"  [hero] Retrying in {wait}s...")
                        await asyncio.sleep(wait)
                    continue
        except Exception as e:
            print(f"  [hero] Request error: {e}")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(BACKOFF_BASE)
            continue

    return None


async def generate_side_hero_image(
    session: aiohttp.ClientSession,
    side_hero_info: dict,
    output_path: Path,
) -> Path | None:
    """Generate a side character hero reference image using Gemini text-to-image.

    Used for secondary recurring characters (dad, yak, grandma, etc.)
    to maintain their visual consistency across pages.
    """
    full_prompt = f"{side_hero_info['description']} {BASE_STYLE}"

    url, headers = image_endpoint()

    payload = {
        "contents": [{"role": "user", "parts": [{"text": full_prompt}]}],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }

    print(f"  [side_hero] Generating reference image...")

    for attempt in range(MAX_RETRIES):
        try:
            async with session.post(url, json=payload, headers=headers) as response:
                if response.status == 200:
                    result = await response.json()
                    candidates = result.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        for part in parts:
                            if "inlineData" in part:
                                image_data = base64.b64decode(part["inlineData"]["data"])
                                output_path.write_bytes(image_data)
                                size_kb = len(image_data) / 1024
                                print(f"  [side_hero] Saved ({size_kb:.0f} KB) -> {output_path}")
                                return output_path
                    print(f"  [side_hero] No image data in response")
                    return None
                elif response.status == 429:
                    wait = BACKOFF_BASE * (2 ** attempt)
                    print(f"  [side_hero] Rate limited. Waiting {wait}s...")
                    await asyncio.sleep(wait)
                    continue
                elif switch_to_vertex(response.status):
                    url, headers = image_endpoint()
                    continue
                else:
                    text = await response.text()
                    print(f"  [side_hero] API error {response.status}: {text[:300]}")
                    if attempt < MAX_RETRIES - 1:
                        wait = BACKOFF_BASE * (2 ** attempt)
                        print(f"  [side_hero] Retrying in {wait}s...")
                        await asyncio.sleep(wait)
                    continue
        except Exception as e:
            print(f"  [side_hero] Request error: {e}")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(BACKOFF_BASE)
            continue

    return None


async def generate_scene_image(
    session: aiohttp.ClientSession,
    hero_base64: str,
    prompt: str,
    side_hero_base64: str | None = None,
    object_ref_base64: str | None = None,
) -> bytes | None:
    """Generate a scene image using Gemini with hero reference(s) and optional object ref.

    Supports dual hero injection: main character + optional side character
    (dad, yak, grandma, etc.) for consistent secondary characters.
    """

    full_prompt = f"{prompt} {BASE_STYLE}"

    url, headers = image_endpoint()

    # Build parts list with labels so the model knows what each reference is
    parts = [
        {"text": "REFERENCE IMAGE 1 — This is the main character. Keep this character's exact appearance in the generated scene:"},
        {"inlineData": {"mimeType": "image/png", "data": hero_base64}},
    ]
    if side_hero_base64:
        parts.append({"text": "REFERENCE IMAGE 2 — This is a secondary character who also appears in this scene:"})
        parts.append({"inlineData": {"mimeType": "image/png", "data": side_hero_base64}})
    if object_ref_base64:
        parts.append({"text": "REFERENCE IMAGE — KEY OBJECT. This object MUST appear with this EXACT shape, colour, and proportions wherever the story mentions it:"})
        parts.append({"inlineData": {"mimeType": "image/png", "data": object_ref_base64}})
    parts.append({"text": f"SCENE TO GENERATE: {full_prompt}"})

    payload = {
        "contents": [{"role": "user", "parts": parts}],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }

    for attempt in range(MAX_RETRIES):
        try:
            async with session.post(url, json=payload, headers=headers) as response:
                if response.status == 200:
                    result = await response.json()
                    candidates = result.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        for part in parts:
                            if "inlineData" in part:
                                return base64.b64decode(part["inlineData"]["data"])
                    print(f"    No image data in response")
                    return None
                elif response.status == 429:
                    wait = BACKOFF_BASE * (2 ** attempt)
                    print(f"    Rate limited. Waiting {wait}s...")
                    await asyncio.sleep(wait)
                    continue
                elif switch_to_vertex(response.status):
                    url, headers = image_endpoint()
                    continue
                else:
                    text = await response.text()
                    print(f"    API error {response.status}: {text[:300]}")
                    if attempt < MAX_RETRIES - 1:
                        wait = BACKOFF_BASE * (2 ** attempt)
                        print(f"    Retrying in {wait}s...")
                        await asyncio.sleep(wait)
                    continue
        except Exception as e:
            print(f"    Request error: {e}")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(BACKOFF_BASE)
            continue

    return None


# ─── Main Generation Functions ──────────────────────────────────

async def generate_book_images(level: int | str, hero_only: bool = False):
    """Generate all images for one pilot book with character consistency."""

    if level not in SCENE_PROMPTS:
        print(f"No scene prompts defined for level {level}")
        return []

    if level not in HERO_PROMPTS:
        print(f"No hero prompt defined for level {level}")
        return []

    book = SCENE_PROMPTS[level]
    # Journey-numbered folder (see book_dir_for / OLD_TO_NEW)
    book_dir = book_dir_for(level)
    book_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n{'='*55}")
    print(f"Level {level}: \"{book['title']}\"")
    print(f"Output: {book_dir}")
    print(f"Scenes: {len(book['scenes'])}")
    print(f"{'='*55}")

    async with aiohttp.ClientSession() as session:
        # Step 1: Generate or load hero reference image
        hero_path = book_dir / "hero_reference.png"
        if not hero_path.exists() or hero_only:
            hero_path_result = await generate_hero_image(session, level)
            if not hero_path_result:
                print("FATAL: Could not generate hero reference image")
                return []
            hero_path = hero_path_result

        if hero_only:
            print("Hero-only mode — stopping here.")
            return [str(hero_path)]

        # Step 2: Convert hero to base64 for inline data
        hero_base64 = base64.b64encode(hero_path.read_bytes()).decode("utf-8")
        print(f"  [upload] Hero converted to base64 ({len(hero_base64)} chars)")

        # Step 2b: Generate or load side hero reference(s) — supports multiple per book
        # Each scene can specify its own side_hero_key. Default is the book-level key.
        level_key = str(level)
        # Collect all unique side hero keys used across scenes
        side_hero_keys_used = set()
        if SIDE_HERO_PROMPTS.get(level_key):
            side_hero_keys_used.add(level_key)
        for scene in book["scenes"]:
            sk = scene.get("side_hero_key")
            if sk and sk in SIDE_HERO_PROMPTS:
                side_hero_keys_used.add(sk)

        # Pre-generate/load every side hero reference we'll need, keyed by side_hero_key
        side_hero_base64_by_key = {}
        for sk in side_hero_keys_used:
            info = SIDE_HERO_PROMPTS[sk]
            path = book_dir / info["filename"]
            if not path.exists():
                result = await generate_side_hero_image(session, info, path)
                if not result:
                    print(f"  [side_hero:{sk}] WARNING: Failed to generate — continuing without")
            if path.exists():
                b64 = base64.b64encode(path.read_bytes()).decode("utf-8")
                side_hero_base64_by_key[sk] = b64
                print(f"  [upload] Side hero '{sk}' ({info['short']}) converted to base64 ({len(b64)} chars)")

        # Default side hero (for scenes that don't specify a scene-level key)
        side_hero_base64 = side_hero_base64_by_key.get(level_key)

        # Step 2c: Generate or load object reference (if applicable)
        object_ref_base64 = None
        obj_ref_info = OBJECT_REF_PROMPTS.get(level_key)
        if obj_ref_info:
            obj_ref_path = book_dir / obj_ref_info["filename"]
            if not obj_ref_path.exists():
                print(f"  [object_ref] Generating object reference image...")
                obj_ref_result = await generate_side_hero_image(
                    session, obj_ref_info, obj_ref_path
                )
                if not obj_ref_result:
                    print(f"  [object_ref] WARNING: Failed to generate object ref — continuing without")
            if obj_ref_path.exists():
                object_ref_base64 = base64.b64encode(obj_ref_path.read_bytes()).decode("utf-8")
                print(f"  [object_ref] {obj_ref_info['short']} converted to base64 ({len(object_ref_base64)} chars)")

        # Step 3: Generate each scene with hero injection
        generated = []
        for scene in book["scenes"]:
            output_path = book_dir / f"{scene['name']}.png"

            # Skip if already exists
            if output_path.exists():
                print(f"  [{scene['name']}] Already exists, skipping")
                generated.append(str(output_path))
                continue

            # Determine if this scene needs a side hero injected
            # Use scene-specific side_hero_key if provided, else fall back to book default
            scene_side_hero = None
            if scene.get("side_hero"):
                scene_sk = scene.get("side_hero_key", level_key)
                scene_side_hero = side_hero_base64_by_key.get(scene_sk, side_hero_base64)
            hero_label = " + side hero" if scene_side_hero else ""
            obj_label = " + object ref" if object_ref_base64 else ""
            print(f"  [{scene['name']}] Generating with hero reference{hero_label}{obj_label}...")

            image_bytes = await generate_scene_image(
                session,
                hero_base64,
                scene["prompt"],
                side_hero_base64=scene_side_hero,
                object_ref_base64=object_ref_base64,
            )

            if image_bytes:
                output_path.write_bytes(image_bytes)
                size_kb = len(image_bytes) / 1024
                print(f"  [{scene['name']}] Saved ({size_kb:.0f} KB)")
                generated.append(str(output_path))
            else:
                print(f"  [{scene['name']}] FAILED")

            await asyncio.sleep(REQUEST_DELAY)

        print(f"\nGenerated {len(generated)}/{len(book['scenes'])} images for Level {level}")
        return generated


async def test_single():
    """Quick test — generate just the hero reference for L1."""
    print("Testing Gemini 2.5 Flash Image...")
    if not GEMINI_API_KEY:
        print("ERROR: GOOGLE_GEMINI_API_KEY not found in .env")
        return

    print(f"API Key: {GEMINI_API_KEY[:10]}...{GEMINI_API_KEY[-4:]}")

    async with aiohttp.ClientSession() as session:
        hero_path = await generate_hero_image(session, 1)
        if hero_path:
            print(f"\nSuccess! Hero image: {hero_path}")
        else:
            print("\nFAILED")


# ─── Entry Point ────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    if not GEMINI_API_KEY and not USE_VERTEX:
        print("ERROR: GOOGLE_GEMINI_API_KEY not found in .env")
        print("Set GOOGLE_GEMINI_API_KEY=your_key in .env, or use the Vertex")
        print("backend: gcloud auth login && MPB_IMAGE_BACKEND=vertex")
        sys.exit(1)
    print(f"Image backend: {'Vertex AI (' + VERTEX_REGION + ')' if USE_VERTEX else 'Gemini API key'}")

    if len(sys.argv) > 1:
        arg = sys.argv[1].lower()
        if arg == "test":
            asyncio.run(test_single())
        elif arg.startswith("l"):
            # Handle both L1, L2, etc. and L1.1, L1.2, etc.
            level_part = arg[1:]
            if "." in level_part:
                # Sub-level like "1.1" - keep as string
                level = level_part
            elif level_part.isdigit():
                # Main level like "1" - convert to int
                level = int(level_part)
            else:
                print("Usage: python generate_gemini_images.py [test|L1|L1.1|L2|...|L6] [hero]")
                sys.exit(1)
            if len(sys.argv) > 2:
                second_arg = sys.argv[2].lower()
                if second_arg == "hero":
                    asyncio.run(generate_book_images(level, hero_only=True))
                elif second_arg.startswith("page") or second_arg == "cover":
                    # Page regeneration: delete the named pages, then rerun the
                    # book (existing pages are skipped, so only these regenerate).
                    # Accepts several at once: ... L2.2 page2 page3 cover
                    book_dir = book_dir_for(level)
                    for page_name in (a.lower() for a in sys.argv[2:]):
                        page_path = book_dir / f"{page_name}.png"
                        if page_path.exists():
                            page_path.unlink()
                            print(f"Deleted {page_path} for regeneration")
                    asyncio.run(generate_book_images(level, hero_only=False))
                else:
                    print("Usage: python generate_gemini_images.py L4.3 [hero|page1|page2|...|cover]")
                    sys.exit(1)
            else:
                asyncio.run(generate_book_images(level, hero_only=False))
        else:
            print("Usage: python generate_gemini_images.py [test|L1|L1.1|L2|...|L6] [hero|page1|...|cover]")
    else:
        # Generate all 6 books
        async def generate_all():
            for level in SCENE_PROMPTS:
                await generate_book_images(level)
        asyncio.run(generate_all())
