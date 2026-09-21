"""
Generate a few lifestyle backgrounds for the daily Facebook creatives with the
OpenAI image API (gpt-image-1), once, into marketing/social/assets/bg/.
No people, no faces, no text: the real book cutout / worksheet pages are
composited on top by creative.py.

Reads OPENAI_API_KEY from myphonics_books/.env (the books pipeline's env).

  py -3.12 scripts/social/gen_backgrounds.py            # all scenes (skips existing)
  py -3.12 scripts/social/gen_backgrounds.py table      # one scene
"""
import base64
import json
import os
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "marketing", "social", "assets", "bg")

STYLE = ("Soft, warm, natural light photograph, shallow depth of field, cosy British family home, "
         "muted pastel tones, plenty of clear empty space in the centre for a product to be placed on top. "
         "No people, no hands, no faces, no text, no logos, no books.")
SCENES = {
    "table":   "Top-down flat lay of a light wooden kitchen table with a few crayons, a small plant and a mug of tea at the edges.",
    "rug":     "Top-down view of a cream knitted rug on pale wooden floorboards, a soft toy rabbit and wooden blocks at the edges.",
    "desk":    "A child's white desk by a window with morning light, a pencil pot and a green plant at the edges, seen from slightly above.",
    "bed":     "Top-down view of a bed with a soft pale-yellow blanket and one cushion at the corner, gentle morning light.",
}


def key():
    for line in open(os.path.join(ROOT, "myphonics_books", ".env"), encoding="utf-8"):
        if line.startswith("OPENAI_API_KEY="):
            return line.split("=", 1)[1].strip().strip('"')
    sys.exit("OPENAI_API_KEY not found in myphonics_books/.env")


def generate(name, prompt):
    body = json.dumps({"model": "gpt-image-1", "prompt": f"{prompt} {STYLE}", "size": "1024x1536",
                       "quality": "medium", "n": 1}).encode()
    req = urllib.request.Request("https://api.openai.com/v1/images/generations", data=body, method="POST",
                                 headers={"Authorization": f"Bearer {key()}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=180) as r:
        data = json.load(r)
    png = base64.b64decode(data["data"][0]["b64_json"])
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, f"{name}.jpg")
    from PIL import Image
    import io
    Image.open(io.BytesIO(png)).convert("RGB").save(path, quality=88, optimize=True)
    return path


if __name__ == "__main__":
    wanted = sys.argv[1:] or list(SCENES)
    for name in wanted:
        path = os.path.join(OUT, f"{name}.jpg")
        if os.path.exists(path):
            print("exists", path)
            continue
        print("generating", name, "->", generate(name, SCENES[name]))
