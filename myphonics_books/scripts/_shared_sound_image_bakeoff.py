"""
Image bake-off: gpt-image-2 vs gemini-2.5-flash-image.

Generates one composite shared-sound page (the /ee/ family — 6 mnemonics)
via both models, using the same prompt and same style reference images
from existing books. Letters are baked into the image so we directly
test each model's letterform rendering.

Outputs:
  - output/sound_books/_bakeoff/ee_openai.png
  - output/sound_books/_bakeoff/ee_gemini.png
  - output/sound_books/_bakeoff/_run_log.md

Run:
  py -3.12 scripts/_shared_sound_image_bakeoff.py
"""

from __future__ import annotations

import base64
import json
import os
import sys
import time
from pathlib import Path

import requests

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

env_path = ROOT / ".env"
for line in env_path.read_text(encoding="utf-8").splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    k, _, v = line.partition("=")
    k = k.strip()
    v = v.strip().strip('"').strip("'")
    if "#" in v:
        v = v.split("#", 1)[0].strip()
    if k and k not in os.environ:
        os.environ[k] = v

from openai import OpenAI  # noqa: E402

OUT = ROOT / "output" / "sound_books" / "_bakeoff"
OUT.mkdir(parents=True, exist_ok=True)
IMG_DIR = ROOT / "output" / "images"

# Style reference images — three hero illustrations from existing books
# spanning the style range (L1, L4, L6).
REF_PATHS = [
    IMG_DIR / "L1_1_B1" / "hero_reference.png",
    IMG_DIR / "L4_1_B1" / "hero_reference.png",
    IMG_DIR / "L6_1_B1" / "hero_reference.png",
]
REF_PATHS = [p for p in REF_PATHS if p.exists()]
if not REF_PATHS:
    sys.exit("No style reference images found")
print(f"Using {len(REF_PATHS)} style reference(s):")
for p in REF_PATHS:
    print(f"  - {p.relative_to(ROOT)}")


# ─── Shared prompt ────────────────────────────────────────────

STYLE_PREAMBLE = (
    "Whimsical children's book illustration. Hand-drawn cartoon style with "
    "soft watercolour textured backgrounds and clean black-outlined characters and objects. "
    "CRITICAL EYE RULE: any character or animal with eyes MUST have eyes that are "
    "tiny solid black filled circles like dots drawn with a black marker pen. "
    "NO white around the black, NO iris, NO pupil, NO highlight, NO detail whatsoever. "
    "Just small simple black dots — cute and friendly like a teddy bear's eyes. "
    "Warm, friendly, inviting. Soft pastel colours with pops of bright colour. "
    "Simple rounded shapes, gentle lighting. Professional picture book quality. "
    "Match the art style of the reference images exactly."
)

LAYOUT_PROMPT = (
    "A children's phonics reference page showing the six different ways to spell the long 'ee' sound. "
    "The page has six clipart illustrations arranged in a clean 3-row x 2-column grid on a "
    "white background. Each clipart sits next to its spelling label in clear neat hand-drawn block letters. "
    "\n\n"
    "The six items, each with its letter label nearby:\n"
    "1. A friendly cartoon BEE (yellow and black, smiling) — label: ee\n"
    "2. A bright green LEAF — label: ea\n"
    "3. A green grassy FIELD with small wildflowers — label: ie\n"
    "4. A cartoon ATHLETE (child runner in sportswear, mid-stride) — label: e-e\n"
    "5. A cute cartoon BABY (sitting, holding a teddy bear) — label: y\n"
    "6. A golden vintage KEY — label: ey\n"
    "\n"
    "CRITICAL TEXT RULES: Each spelling label MUST be drawn clearly and legibly in lowercase letters. "
    "The labels must say EXACTLY: ee, ea, ie, e-e, y, ey. "
    "DO NOT garble, distort, or misspell the labels. "
    "NO OTHER TEXT, words, or numbers anywhere on the page — only the six spelling labels."
)

FULL_PROMPT = STYLE_PREAMBLE + "\n\n" + LAYOUT_PROMPT


# ─── OpenAI gpt-image-2 ───────────────────────────────────────

def run_openai() -> tuple[Path, dict]:
    print("\n[openai] calling gpt-image-2 images.edit ...")
    t0 = time.time()
    client = OpenAI()
    opened = [open(p, "rb") for p in REF_PATHS]
    try:
        result = client.images.edit(
            model="gpt-image-2",
            image=opened,
            prompt=FULL_PROMPT,
            size="1024x1024",
            quality="high",
            n=1,
        )
    finally:
        for fh in opened:
            fh.close()
    dt = time.time() - t0

    b64 = result.data[0].b64_json
    out_path = OUT / "ee_openai.png"
    out_path.write_bytes(base64.b64decode(b64))

    usage = getattr(result, "usage", None)
    usage_dict = {}
    if usage:
        usage_dict = {
            "input_tokens": getattr(usage, "input_tokens", None),
            "output_tokens": getattr(usage, "output_tokens", None),
        }

    print(f"[openai] saved {out_path.name} in {dt:.1f}s — {out_path.stat().st_size // 1024} KB")
    return out_path, {"model": "gpt-image-2", "elapsed_s": round(dt, 1), "usage": usage_dict}


# ─── Gemini gemini-2.5-flash-image ────────────────────────────

def run_gemini() -> tuple[Path, dict]:
    print("\n[gemini] calling gemini-2.5-flash-image generateContent ...")
    api_key = os.environ["GOOGLE_GEMINI_API_KEY"]
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.5-flash-image:generateContent?key={api_key}"
    )

    parts = []
    for idx, p in enumerate(REF_PATHS, 1):
        parts.append({"text": f"STYLE REFERENCE IMAGE {idx} — match this art style exactly (line weight, palette, eye style, character feel):"})
        parts.append({
            "inlineData": {
                "mimeType": "image/png",
                "data": base64.b64encode(p.read_bytes()).decode("ascii"),
            }
        })
    parts.append({"text": FULL_PROMPT})

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }

    t0 = time.time()
    r = requests.post(url, json=payload, timeout=180)
    dt = time.time() - t0

    if r.status_code != 200:
        print(f"[gemini] HTTP {r.status_code}: {r.text[:400]}")
        return None, {"model": "gemini-2.5-flash-image", "error": r.text[:400], "elapsed_s": round(dt, 1)}

    cands = r.json().get("candidates") or [{}]
    resp_parts = cands[0].get("content", {}).get("parts", [])
    out_path = OUT / "ee_gemini.png"
    saved = False
    for part in resp_parts:
        if "inlineData" in part:
            out_path.write_bytes(base64.b64decode(part["inlineData"]["data"]))
            saved = True
            break

    if not saved:
        print(f"[gemini] no image in response: {json.dumps(r.json())[:400]}")
        return None, {"model": "gemini-2.5-flash-image", "error": "no image in response", "elapsed_s": round(dt, 1)}

    print(f"[gemini] saved {out_path.name} in {dt:.1f}s — {out_path.stat().st_size // 1024} KB")
    return out_path, {"model": "gemini-2.5-flash-image", "elapsed_s": round(dt, 1)}


def main():
    log = {
        "prompt": FULL_PROMPT,
        "refs": [str(p.relative_to(ROOT)) for p in REF_PATHS],
        "runs": [],
    }

    # OpenAI
    try:
        _, meta = run_openai()
        log["runs"].append(meta)
    except Exception as e:
        print(f"[openai] EXCEPTION: {e}")
        log["runs"].append({"model": "gpt-image-2", "exception": str(e)})

    # Gemini
    try:
        _, meta = run_gemini()
        log["runs"].append(meta)
    except Exception as e:
        print(f"[gemini] EXCEPTION: {e}")
        log["runs"].append({"model": "gemini-2.5-flash-image", "exception": str(e)})

    (OUT / "_run_log.md").write_text(
        "# Shared-sound image bake-off — run log\n\n"
        "## Prompt\n\n```\n" + FULL_PROMPT + "\n```\n\n"
        "## References\n\n" + "\n".join(f"- {r}" for r in log["refs"]) + "\n\n"
        "## Runs\n\n```json\n" + json.dumps(log["runs"], indent=2) + "\n```\n",
        encoding="utf-8",
    )
    print(f"\nLog: {OUT / '_run_log.md'}")
    print(f"Outputs in: {OUT}")


if __name__ == "__main__":
    main()
