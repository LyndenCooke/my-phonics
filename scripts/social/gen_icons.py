"""
Generate the decorative assets for the social creatives once, with the OpenAI
image API (gpt-image-1, transparent background), into
marketing/social/assets/icons/. creative.py composites them; nothing is
generated on the daily run.

  py -3.12 scripts/social/gen_icons.py            # all (skips existing)
  py -3.12 scripts/social/gen_icons.py book star  # some
"""
import base64
import json
import os
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "marketing", "social", "assets", "icons")

STYLE = ("Flat vector sticker illustration for a children's education brand, thick rounded dark-navy (#1E2A4A) outline, "
         "smooth solid fills, soft highlight, slightly playful, centred, large, no text, no background, "
         "isolated on a transparent background.")
ICONS = {
    "book":     "An open picture book with pale-blue (#C8E0FF) and blue (#5B9EFF) pages.",
    "pencil":   "A yellow (#FFD60A) pencil with a pink (#E84B8A) eraser, tilted 45 degrees.",
    "star":     "A five-point yellow (#FFD60A) star.",
    "heart":    "A pink (#E84B8A) heart.",
    "download": "A download symbol: a bold white arrow pointing down into a white tray, pure white shapes only.",
    "sparkle":  "Three short thick pink (#E84B8A) motion strokes fanning out like a burst, an 'attention' accent mark.",
    "sparkle_green": "Three short thick green (#4ABD6D) motion strokes fanning out like a burst, an 'attention' accent mark.",
    "printer":  "A pink (#E84B8A) and white home printer with a sheet coming out of the top.",
}


def key():
    for line in open(os.path.join(ROOT, "myphonics_books", ".env"), encoding="utf-8"):
        if line.startswith("OPENAI_API_KEY="):
            return line.split("=", 1)[1].strip().strip('"')
    sys.exit("OPENAI_API_KEY not found in myphonics_books/.env")


def generate(name, prompt):
    body = json.dumps({"model": "gpt-image-1", "prompt": f"{prompt} {STYLE}", "size": "1024x1024",
                       "quality": "medium", "background": "transparent", "output_format": "png", "n": 1}).encode()
    req = urllib.request.Request("https://api.openai.com/v1/images/generations", data=body, method="POST",
                                 headers={"Authorization": f"Bearer {key()}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=180) as r:
        data = json.load(r)
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, f"{name}.png")
    open(path, "wb").write(base64.b64decode(data["data"][0]["b64_json"]))
    return path


if __name__ == "__main__":
    for name in (sys.argv[1:] or list(ICONS)):
        path = os.path.join(OUT, f"{name}.png")
        if os.path.exists(path):
            print("exists", path)
            continue
        print("generating", name, "->", generate(name, ICONS[name]))
