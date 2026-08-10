"""Conversational image generation: one persistent chat session per book.

Usage: py -3.12 gen_chat.py <session.json> <out.png> <prompt text> [ref1.png ref2.png ...]

Turn structure: refs (if any) + text are appended as a user turn; the model's
image reply is saved to out.png AND appended to the session history, so later
turns see every earlier image natively — like working in the app.
"""
from __future__ import annotations

import base64
import json
import subprocess
import sys
import time
from pathlib import Path

import requests

REGION = "us-central1"
MODEL = "gemini-2.5-flash-image"


def auth() -> tuple[str, str]:
    tok = subprocess.run(["gcloud", "auth", "print-access-token"],
                         capture_output=True, text=True, shell=True).stdout.strip()
    proj = subprocess.run(["gcloud", "config", "get-value", "project"],
                          capture_output=True, text=True, shell=True).stdout.strip()
    if not tok or not proj:
        sys.exit("gcloud not authenticated")
    return tok, proj


def main() -> None:
    session_path, out_path, prompt = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3]
    ref_paths = sys.argv[4:]

    history = json.loads(session_path.read_text()) if session_path.exists() else []

    parts = []
    for rp in ref_paths:
        parts.append({"inlineData": {
            "mimeType": "image/png",
            "data": base64.b64encode(Path(rp).read_bytes()).decode()}})
    parts.append({"text": prompt})
    history.append({"role": "user", "parts": parts})

    tok, proj = auth()
    url = (f"https://{REGION}-aiplatform.googleapis.com/v1/projects/{proj}"
           f"/locations/{REGION}/publishers/google/models/{MODEL}:generateContent")
    payload = {
        "contents": history,
        "generationConfig": {"responseModalities": ["IMAGE"],
                             "imageConfig": {"aspectRatio": "4:3"}},
    }
    headers = {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}

    for attempt in range(4):
        r = requests.post(url, json=payload, headers=headers, timeout=300)
        if r.status_code == 429:
            wait = 15 * (2 ** attempt)
            print(f"rate-limited, sleeping {wait}s")
            time.sleep(wait)
            continue
        if r.status_code != 200:
            sys.exit(f"HTTP {r.status_code}: {r.text[:500]}")
        model_parts = (r.json().get("candidates") or [{}])[0].get("content", {}).get("parts", [])
        img = next((p for p in model_parts if "inlineData" in p), None)
        if not img:
            sys.exit("no image in response: " + json.dumps(r.json())[:400])
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_bytes(base64.b64decode(img["inlineData"]["data"]))
        history.append({"role": "model", "parts": [img]})
        session_path.write_text(json.dumps(history))
        print(f"saved {out_path} ({out_path.stat().st_size // 1024} KB); "
              f"session now {len(history)} turns, {session_path.stat().st_size // 1024} KB")
        return
    sys.exit("gave up after retries")


if __name__ == "__main__":
    main()
