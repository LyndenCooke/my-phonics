import os
import base64
import json
import urllib.request
from pathlib import Path
from dotenv import load_dotenv
import time

load_dotenv()

GEMINI_API_KEY = os.environ.get("GOOGLE_GEMINI_API_KEY")
BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
BOOK_DIR = Path(__file__).parent.parent / "output" / "images" / "L4_3_B1"

# The most extreme constraint on the eyes possible for page 3
PROMPT = (
    "Kawaii children's book illustration of a Mexican home staircase. "
    "A kawaii-style cartoon ginger tabby cat with orange stripes stands at the foot of colourful tiled stairs. "
    "A blue glue-covered card is stuck on the cat's back. The cat looks cross. "
    "Warm terracotta walls, decorative patterned tiles on stair risers. "
    "CRITICAL ART STYLE AND ABSOLUTELY CRITICAL EYE RULE: "
    "Kawaii/Sanrio style where the cat's eyes are completely SOLID BLACK DOTS with NO white parts. "
    "Draw exactly and ONLY a single, solid black pixel-dot for each eye. "
    "ZERO highlights. ZERO white sclera. ZERO color. "
    "No pupils, no iris, no sclera — just solid black shapes. "
    "If you draw even a speck of white in the eye, the image will be rejected. "
    "Flat colours, simple shapes. No text. Landscape orientation."
)

hero_path = BOOK_DIR / "hero_reference.png"
if not hero_path.exists():
    print(f"FATAL: No hero reference at {hero_path}")
    exit(1)

hero_base64 = base64.b64encode(hero_path.read_bytes()).decode("utf-8")
url = f"{BASE_URL}/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"

parts = [
    {"text": "REFERENCE IMAGE 1 (main character):"},
    {"inlineData": {"mimeType": "image/png", "data": hero_base64}},
    {"text": f"Generate scene: {PROMPT}"},
]

payload = {
    "contents": [{"parts": parts}],
    "generationConfig": {"responseModalities": ["IMAGE"]},
}

print("Generating 3 options for page 3...")
for i in range(1, 4):
    print(f"Generating option {i}...")
    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        resp = urllib.request.urlopen(req, timeout=120)
        result = json.loads(resp.read())
        
        candidates = result.get("candidates", [])
        if candidates:
            resp_parts = candidates[0].get("content", {}).get("parts", [])
            for part in resp_parts:
                if "inlineData" in part:
                    img_bytes = base64.b64decode(part["inlineData"]["data"])
                    out_path = BOOK_DIR / f"page3_v{i}.png"
                    out_path.write_bytes(img_bytes)
                    print(f"Saved {out_path.name}")
                    break
        time.sleep(2) # brief pause
    except Exception as e:
        print(f"Error on option {i}: {e}")

print("Done generating options. You can review them in output/images/L4_3_B1/")
