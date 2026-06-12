# Transcribe the approved Sound Pack sheets (Drive/TPT) into a JSON manifest
# so the W2 sound pages reuse EXACTLY the approved per-sound word lists.
# Vision model reads each sheet; results are spot-checked by hand afterwards.
import base64
import json
import os
import re
import sys
from pathlib import Path

import requests

HERE = Path(__file__).resolve().parent.parent
PACKS = HERE / "output" / "_research" / "soundpacks"
OUT = PACKS / "soundpack_manifest.json"

env = (HERE.parent / "myphonics_books" / ".env").read_text(encoding="utf-8")
KEY = re.search(r"OPENAI_API_KEY=(\S+)", env).group(1)

PROMPT = """This is a phonics worksheet called "The Sound <grapheme>".
Transcribe it exactly. Return JSON only:
{
  "grapheme": "...",                      // the focus sound, lowercase
  "trace_words": ["...", ...],            // section 2 words, top to bottom
  "trace_images": ["...", ...],           // what each section-2 picture shows, one or two lowercase words
  "missing": [                            // section 3 cards, left to right
    {"shown": "...",                      // EXACTLY the visible letters, use _ for the gap position
     "word": "...",                       // the full intended word
     "image": "..."}                      // what the picture shows
  ]
}
The gap in section 3 may be at the start, middle or end of the word."""


def transcribe(png: Path) -> dict:
    b64 = base64.b64encode(png.read_bytes()).decode()
    r = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {KEY}"},
        json={
            "model": "gpt-4o",
            "temperature": 0,
            "response_format": {"type": "json_object"},
            "messages": [{
                "role": "user",
                "content": [
                    {"type": "text", "text": PROMPT},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}", "detail": "high"}},
                ],
            }],
        },
        timeout=120,
    )
    r.raise_for_status()
    return json.loads(r.json()["choices"][0]["message"]["content"])


def main() -> None:
    results = {}
    if OUT.exists():
        results = json.loads(OUT.read_text(encoding="utf-8"))
    sheets = sorted(PACKS.glob("hi_sound_*.png"))
    for png in sheets:
        g = png.stem.replace("hi_sound_", "")
        if g in results:
            continue
        try:
            results[g] = transcribe(png)
            print(g, "ok:", results[g]["trace_words"], "|", [m["word"] for m in results[g]["missing"]])
        except Exception as e:  # noqa: BLE001 - record and carry on
            print(g, "FAILED:", e, file=sys.stderr)
        OUT.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"{len(results)}/{len(sheets)} sheets in {OUT}")


if __name__ == "__main__":
    main()
