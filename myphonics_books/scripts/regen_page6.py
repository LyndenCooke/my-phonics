"""Regenerate ONLY page6 for L4.3 with hero injection (using requests, not aiohttp)."""
import os
import base64
import json
import urllib.request
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()
print("Loaded env")

GEMINI_API_KEY = os.environ.get("GOOGLE_GEMINI_API_KEY")
BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
BOOK_DIR = Path(__file__).parent.parent / "output" / "images" / "L4_3_B1"

BASE_STYLE = (
    "Whimsical children's book illustration. Hand-drawn cartoon style with "
    "soft watercolour textured backgrounds and clean black-outlined characters. "
    "CRITICAL EYE RULE: Every character (human, animal, everyone) MUST have eyes that are "
    "tiny solid black filled circles like dots drawn with a black marker pen. "
    "NO white around the black, NO iris, NO pupil, NO highlight, NO detail whatsoever. "
    "Just small simple black dots - cute and friendly like a teddy bear's eyes. "
    "Warm, friendly, inviting. Soft pastel backgrounds with pops of bright colour. "
    "Simple rounded shapes, gentle lighting. Professional picture book quality. "
    "No text, words, letters, or numbers in the image."
)

PROMPT = (
    "Full room view of a Mexican garden patio. A girl in yellow t-shirt and blue dungarees "
    "dives to catch a falling terracotta pot of blue flowers. On top of the garden wall, "
    "a medium-sized short-haired ginger tabby cat with orange stripes, white chest, white paws, "
    "and white-tipped tail sits looking guilty — blue glue smears still visible on its back. "
    "Lush patio with bougainvillea climbing the warm-coloured plastered walls, potted plants and cacti. "
    "Whimsical children's book illustration. "
    "ABSOLUTELY CRITICAL NON-NEGOTIABLE RULE FOR THE CAT: The cat's eyes are TWO TINY SOLID BLACK DOTS "
    "with ZERO colour, ZERO white, ZERO amber, ZERO yellow, ZERO green — just plain black filled circles "
    "like a stuffed toy's button eyes. The girl's eyes MUST also be tiny solid black filled dots. "
    "Every single eye in this entire image — human AND animal — is a plain solid black dot, nothing else. "
    "No text. Landscape orientation."
)

hero_path = BOOK_DIR / "hero_reference.png"
if not hero_path.exists():
    print(f"FATAL: No hero reference at {hero_path}")
    exit(1)

hero_base64 = base64.b64encode(hero_path.read_bytes()).decode("utf-8")
print(f"Hero loaded ({len(hero_base64)} chars)")

full_prompt = f"{PROMPT} {BASE_STYLE}"
url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"

parts = [
    {"text": "REFERENCE IMAGE 1 — This is the main character. Keep this character's exact appearance in the generated scene:"},
    {"inlineData": {"mimeType": "image/png", "data": hero_base64}},
    {"text": f"SCENE TO GENERATE: {full_prompt}"},
]

payload = {
    "contents": [{"parts": parts}],
    "generationConfig": {"responseModalities": ["IMAGE"]},
}

print("Calling Gemini API for page6...")
data = json.dumps(payload).encode("utf-8")
req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
try:
    resp = urllib.request.urlopen(req, timeout=120)
    result = json.loads(resp.read())
    candidates = result.get("candidates", [])
    if candidates:
        resp_parts = candidates[0].get("content", {}).get("parts", [])
        for part in resp_parts:
            if "inlineData" in part:
                img_bytes = base64.b64decode(part["inlineData"]["data"])
                out = BOOK_DIR / "page6.png"
                out.write_bytes(img_bytes)
                print(f"Saved page6.png ({len(img_bytes)/1024:.0f} KB)")
                exit(0)
    print("No image in response")
    print(json.dumps(result, indent=2)[:500])
except Exception as e:
    print(f"Error: {e}")
