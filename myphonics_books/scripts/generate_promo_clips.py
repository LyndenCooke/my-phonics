"""
MyPhonicsBooks promo video clip generator (fal.ai, pay-per-use).

Generates the six clips from the promo production pack via Seedance 2.0.
Reads FAL_KEY from the project .env. Saves mp4s to output/promo/.

Usage:
    py -3.12 scripts/generate_promo_clips.py            # fast tier (cheapest)
    py -3.12 scripts/generate_promo_clips.py --std      # standard tier (best quality)
    py -3.12 scripts/generate_promo_clips.py --clip 1   # single clip by number

Requires: pip install requests
Cost guide: fast tier roughly $0.24 per second of video at 720p (~$7 for all six).
"""

import argparse
import base64
import sys
import time
from pathlib import Path

import requests

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = PROJECT_ROOT / ".env"
OUT_DIR = PROJECT_ROOT / "output" / "promo"
COVER_PATH = PROJECT_ROOT / "output" / "images" / "L4_1_B1" / "cover.png"

ASPECT_RATIO = "3:4"   # portrait feed; change to "9:16" for Reels/Shorts
RESOLUTION = "720p"

CLIPS = [
    {
        "n": 1, "name": "01_hook", "duration": 4, "type": "text",
        "prompt": (
            "Warm naturalistic home interior, evening lamplight, British family "
            "kitchen. A child aged 5 sits at the kitchen table with a parent, "
            "staring down at an open reading book, frustrated and fidgeting. The "
            "parent looks gently concerned. Slow cinematic push-in on the child's "
            "face. Shallow depth of field, soft domestic realism, intimate "
            "documentary feel. No text overlays, no captions."
        ),
    },
    {
        "n": 2, "name": "02_problem", "duration": 5, "type": "text",
        "prompt": (
            "Close-up of a young child's finger moving under a line of text in a "
            "generic reading book, hesitating and stopping. The child looks up, "
            "discouraged. Muted colour grade, handheld feel, intimate. British "
            "home, evening light. No text overlays, no captions."
        ),
    },
    {
        "n": 3, "name": "03_mechanism", "duration": 7, "type": "image",
        "image": COVER_PATH,
        "prompt": (
            "Animate this children's book cover with gentle parallax: the "
            "character sways slightly, soft particles of warm light drift across "
            "the scene. Keep the illustration style exactly as the reference: "
            "flat colours, clean lines, small solid black dot eyes. Slow elegant "
            "zoom out revealing the book floating on a soft indigo gradient "
            "background. No new text."
        ),
    },
    {
        "n": 4, "name": "04_levels", "duration": 4, "type": "text",
        "prompt": (
            "A row of eight children's books fans out from left to right, each "
            "spine a different colour in this exact order: pink, coral, amber, "
            "green, blue, indigo, purple, teal. Flat illustrated children's book "
            "style, clean white background, smooth cascading motion as each book "
            "lands. No readable text on the books."
        ),
    },
    {
        "n": 5, "name": "05_happy_reader", "duration": 5, "type": "text",
        "prompt": (
            "Warm British family kitchen, bright golden hour light through a "
            "window. A child aged 5 reads aloud confidently from a printed A5 "
            "booklet with a colourful illustrated cover, beaming. The parent "
            "watches, visibly proud and relieved. Gentle slow motion, joyful and "
            "authentic. No text overlays, no captions."
        ),
    },
    {
        "n": 6, "name": "06_cta", "duration": 5, "type": "text",
        "prompt": (
            "Clean indigo to violet gradient background. A smartphone mockup "
            "shows a simple friendly children's quiz interface, then five "
            "illustrated children's book covers cascade out of the phone and "
            "stack neatly. Flat modern illustration style, rounded corners, soft "
            "shadows, smooth spring animations. Lower third of frame kept clear. "
            "No readable text."
        ),
    },
]


def load_fal_key() -> str:
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line.startswith("FAL_KEY=") or line.startswith("FAL_API_KEY="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit(f"No FAL_KEY found in {ENV_PATH}")


def submit(model: str, payload: dict, key: str) -> dict:
    r = requests.post(
        f"https://queue.fal.run/{model}",
        headers={"Authorization": f"Key {key}"},
        json=payload,
        timeout=60,
    )
    r.raise_for_status()
    return r.json()


def poll(status_url: str, response_url: str, key: str, label: str) -> dict:
    headers = {"Authorization": f"Key {key}"}
    while True:
        s = requests.get(status_url, headers=headers, timeout=60).json()
        status = s.get("status")
        if status == "COMPLETED":
            return requests.get(response_url, headers=headers, timeout=60).json()
        if status in ("FAILED", "ERROR", "CANCELLED"):
            sys.exit(f"{label}: generation failed: {s}")
        print(f"  {label}: {status.lower()} ...")
        time.sleep(8)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--std", action="store_true", help="standard tier (higher quality, higher cost)")
    ap.add_argument("--clip", type=int, help="generate a single clip by number 1-6")
    args = ap.parse_args()

    tier = "" if args.std else "fast/"
    key = load_fal_key()
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    clips = [c for c in CLIPS if not args.clip or c["n"] == args.clip]
    for clip in clips:
        label = clip["name"]
        print(f"Generating {label} ({clip['duration']}s) ...")
        payload = {
            "prompt": clip["prompt"],
            "aspect_ratio": ASPECT_RATIO,
            "resolution": RESOLUTION,
            "duration": clip["duration"],
        }
        if clip["type"] == "image":
            model = f"bytedance/seedance-2.0/{tier}image-to-video"
            b64 = base64.b64encode(clip["image"].read_bytes()).decode()
            payload["image_url"] = f"data:image/png;base64,{b64}"
        else:
            model = f"bytedance/seedance-2.0/{tier}text-to-video"

        job = submit(model, payload, key)
        result = poll(job["status_url"], job["response_url"], key, label)

        video_url = result.get("video", {}).get("url") or result.get("video_url")
        if not video_url:
            sys.exit(f"{label}: no video URL in response: {result}")
        out_path = OUT_DIR / f"{label}.mp4"
        out_path.write_bytes(requests.get(video_url, timeout=300).content)
        print(f"  saved {out_path}")

    print("\nDone. Clips are in output/promo/. Cut together in script order;")
    print("add voiceover and text overlays per the production pack.")


if __name__ == "__main__":
    main()
