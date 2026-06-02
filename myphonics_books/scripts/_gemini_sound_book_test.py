"""Quick scratch: ask Gemini for photorealistic sandwich + spoon shots
for the Sound Book test. Saves to output/sound_books/_gemini_test/.
"""
from __future__ import annotations

import base64
import os
import sys
from pathlib import Path

import requests

BASE_DIR = Path(__file__).parent.parent

# Load .env minimally
for line in (BASE_DIR / ".env").read_text(encoding="utf-8").splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    k, _, v = line.partition("=")
    k, v = k.strip(), v.strip().strip('"').strip("'")
    if "#" in v:
        v = v.split("#", 1)[0].strip()
    if k and k not in os.environ:
        os.environ[k] = v

API_KEY = os.environ["GOOGLE_GEMINI_API_KEY"]
URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    f"gemini-2.5-flash-image:generateContent?key={API_KEY}"
)

OUT = BASE_DIR / "output" / "sound_books" / "_gemini_test"
OUT.mkdir(parents=True, exist_ok=True)

# Photorealistic, single-subject, picture-book friendly
PROMPTS = {
    "sandwich": (
        "A single ham and cheese sandwich on a wooden cutting board, "
        "photographed from a slight three-quarter overhead angle, soft "
        "natural daylight from the left, clean plain background, vivid "
        "colours, sharp focus, no text or logos, no people, no other "
        "objects competing. Style: bright children's picture book photo, "
        "instantly recognisable as a sandwich to a 4-year-old."
    ),
    "spoon": (
        "A single shiny silver spoon resting on a plain pale wooden "
        "surface, photographed from directly above, clean uncluttered "
        "background, soft daylight, vivid contrast, sharp focus, no text "
        "or logos, no other objects. Style: bright children's picture "
        "book photo, instantly recognisable as a spoon to a 4-year-old."
    ),
}


def generate(word: str, prompt: str) -> Path | None:
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }
    r = requests.post(URL, json=payload, timeout=90)
    if r.status_code != 200:
        print(f"[{word}] HTTP {r.status_code}: {r.text[:300]}")
        return None
    parts = (r.json().get("candidates") or [{}])[0].get("content", {}).get("parts", [])
    for part in parts:
        if "inlineData" in part:
            data = base64.b64decode(part["inlineData"]["data"])
            out = OUT / f"{word}.png"
            out.write_bytes(data)
            print(f"[{word}] saved {out.relative_to(BASE_DIR)} ({len(data)//1024} KB)")
            return out
    print(f"[{word}] no image in response: {r.json()}")
    return None


def main():
    for word, prompt in PROMPTS.items():
        generate(word, prompt)


if __name__ == "__main__":
    main()
