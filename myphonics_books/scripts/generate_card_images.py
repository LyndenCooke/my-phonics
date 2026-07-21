"""
MyPhonicsBooks — Sound Card illustrations (Tier 1 backs, --with-images).

One small icon per card, generated from its `image_prompt` field, via the
same Gemini 2.5 Flash Image text-to-image call scripts/generate_gemini_images.py
uses for hero references (no hero-injection needed here — these are
standalone objects, not a recurring character).

NOTE (2026-07): the GOOGLE_GEMINI_API_KEY in .env has previously hit its
billing cap (see reference_mpb_gemini_vertex_fallback memory) — sound-book
cover tiles were switched to calling Vertex AI directly with a gcloud OAuth
token as a fallback. If this module's calls start failing with 429/402,
that's the likely cause; port generate_via_vertex() following the same
pattern used for the sound-book cover letters rather than debugging the
Gemini key further.

Deliberately NOT invoked unless --with-images is passed — generate the
typographic layout first and get it signed off before spending credits.
"""

import asyncio
import base64
import os
import subprocess
from pathlib import Path

import aiohttp
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.environ.get("GOOGLE_GEMINI_API_KEY")
BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
MODEL = "gemini-2.5-flash-image"
VERTEX_REGION = "us-central1"

REQUEST_DELAY = float(os.environ.get("CARD_IMG_DELAY", "3"))
MAX_RETRIES = 3
BACKOFF_BASE = 5


def _vertex_token_and_project() -> tuple[str, str] | None:
    """gcloud OAuth token + project for the Vertex fallback (Gemini key is
    billing-depleted — see reference_mpb_gemini_vertex_fallback memory).
    Returns None if gcloud auth is unavailable so the caller can fall back."""
    try:
        tok = subprocess.run(
            ["gcloud", "auth", "print-access-token"],
            capture_output=True, text=True, timeout=60, shell=True,
        )
        proj = subprocess.run(
            ["gcloud", "config", "get-value", "project"],
            capture_output=True, text=True, timeout=60, shell=True,
        )
        token, project = tok.stdout.strip(), proj.stdout.strip()
        if tok.returncode == 0 and token and project and project != "(unset)":
            return token, project
    except Exception as exc:
        print(f"  [images] gcloud token unavailable: {exc}")
    return None

# Whether a face appears at all is decided per-word by cards_data.py's
# FACE_WORDS set (only living/character subjects get one — plain objects
# like sun, star, apple, sock, soap must not). This suffix must NOT force
# eyes onto every image the way it used to (2026-07-10 fix); the eye
# STYLE rule (solid black dot, no iris/pupil/highlight) is asserted
# per-word in the prompt itself, matching generate_gemini_images.py's
# BASE_STYLE, whenever a face is actually called for.
STYLE_SUFFIX = (
    " Whimsical children's book illustration, flat and simple, warm colours, "
    "no text, no letters, no numbers."
)


async def _generate_one(session: aiohttp.ClientSession, prompt: str, out_path: Path,
                        vertex: tuple[str, str] | None = None) -> bool:
    if vertex:
        token, project = vertex
        url = (f"https://{VERTEX_REGION}-aiplatform.googleapis.com/v1/projects/{project}"
               f"/locations/{VERTEX_REGION}/publishers/google/models/{MODEL}:generateContent")
        headers = {"Authorization": f"Bearer {token}"}
        # Vertex REQUIRES role:user in contents or it 400s.
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt + STYLE_SUFFIX}]}],
            "generationConfig": {"responseModalities": ["IMAGE"]},
        }
    else:
        url = f"{BASE_URL}/models/{MODEL}:generateContent?key={GEMINI_API_KEY}"
        headers = {}
        payload = {
            "contents": [{"parts": [{"text": prompt + STYLE_SUFFIX}]}],
            "generationConfig": {"responseModalities": ["IMAGE"]},
        }
    for attempt in range(MAX_RETRIES):
        try:
            async with session.post(url, json=payload, headers=headers) as response:
                if response.status == 200:
                    result = await response.json()
                    for part in result.get("candidates", [{}])[0].get("content", {}).get("parts", []):
                        if "inlineData" in part:
                            out_path.write_bytes(base64.b64decode(part["inlineData"]["data"]))
                            return True
                    print(f"    no image data in response for {out_path.stem}")
                    return False
                if response.status == 429:
                    wait = BACKOFF_BASE * (2 ** attempt)
                    print(f"    rate limited on {out_path.stem}, waiting {wait}s...")
                    await asyncio.sleep(wait)
                    continue
                text = await response.text()
                print(f"    API error {response.status} for {out_path.stem}: {text[:200]}")
                return False
        except Exception as exc:
            print(f"    request error for {out_path.stem}: {exc}")
            await asyncio.sleep(BACKOFF_BASE)
    return False


async def _generate_missing_images_async(cards: list[dict], out_dir: Path) -> None:
    # Prefer Vertex (Gemini standalone key is billing-depleted); fall back to
    # the Gemini key only if gcloud auth is unavailable.
    vertex = _vertex_token_and_project()
    if vertex:
        print(f"  [images] using Vertex AI (project {vertex[1]}, {VERTEX_REGION}).")
    elif GEMINI_API_KEY:
        print("  [images] Vertex unavailable — falling back to GOOGLE_GEMINI_API_KEY "
              "(may 429 if depleted).")
    else:
        print("  [images] no Vertex auth and no GOOGLE_GEMINI_API_KEY — skipping image "
              "generation, placeholders will be used.")
        return

    out_dir.mkdir(parents=True, exist_ok=True)
    pending = [c for c in cards if c.get("image_prompt")
               and not (out_dir / f"{c['card_id']}.png").exists()]
    print(f"  [images] {len(cards) - len(pending)} already generated, {len(pending)} to go...")

    # Bounded concurrency. Vertex rate-limits aggressively — 6-wide triggers a
    # 429 storm, so the default is a conservative 2 (sequential-with-backoff was
    # the standing guidance). Bump CARD_IMG_CONCURRENCY only if 429s stay rare.
    concurrency = int(os.environ.get("CARD_IMG_CONCURRENCY", "2"))
    sem = asyncio.Semaphore(concurrency)
    ok_count = 0

    async with aiohttp.ClientSession() as session:
        async def worker(card: dict) -> bool:
            async with sem:
                out_path = out_dir / f"{card['card_id']}.png"
                # Re-fetch the gcloud token per request rather than reusing the
                # one grabbed at start-up: gcloud user access tokens last ~1hr,
                # and a full deck's worth of rate-limited retries/backoff can
                # run long enough to cross that boundary, turning the back half
                # of a run into a wall of 401s (observed 2026-07-10).
                current_vertex = _vertex_token_and_project() or vertex
                ok = await _generate_one(session, card["image_prompt"], out_path, vertex=current_vertex)
                print(f"    {'OK' if ok else 'FAILED'}: {card['card_id']}", flush=True)
                await asyncio.sleep(REQUEST_DELAY)  # small stagger, not a full serialise
                return ok

        results = await asyncio.gather(*(worker(c) for c in pending))
        ok_count = sum(results)
    print(f"  [images] done: {ok_count}/{len(pending)} generated.")


def generate_missing_images(cards: list[dict], out_dir: Path) -> None:
    """Synchronous entry point used by generate_cards.py --with-images."""
    asyncio.run(_generate_missing_images_async(cards, out_dir))
