"""
Generate the MyPhonicsBooks phonics clipart asset library.

One isolated clipart image per grapheme, organised by our six product levels.
Cue words are drawn from words used in our published stories (see data/clipart_cues.json).
A reference interior image is injected so the output matches the MyPhonicsBooks book style
(soft watercolour-textured fills, clean black outlines), NOT flat poster clipart.

Backends:
    openai (default)  — gpt-image-2 via images.edit() with style reference
    gemini            — gemini-2.5-flash-image with inline style reference

Usage:
    py -3.12 scripts/generate_clipart.py                       # everything (skip existing)
    py -3.12 scripts/generate_clipart.py --test                # just nk=tank, style sanity check
    py -3.12 scripts/generate_clipart.py --level L1            # one level only
    py -3.12 scripts/generate_clipart.py --sound nk            # one specific grapheme
    py -3.12 scripts/generate_clipart.py --force               # overwrite existing PNGs
    py -3.12 scripts/generate_clipart.py --backend gemini      # switch backend
"""

import argparse
import asyncio
import base64
import datetime
import json
import os
import sys
import time
from pathlib import Path

import aiohttp
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent  # myphonics_books/
REPO_ROOT = ROOT.parent                          # repo root (worktree or main)

load_dotenv(ROOT / ".env")
load_dotenv(REPO_ROOT / ".env", override=False)
# If running from a git worktree under .claude/worktrees/<name>/, also check the main repo .env.
if ".claude" in REPO_ROOT.parts and "worktrees" in REPO_ROOT.parts:
    idx = REPO_ROOT.parts.index(".claude")
    main_repo = Path(*REPO_ROOT.parts[:idx])
    load_dotenv(main_repo / "myphonics_books" / ".env", override=False)
    load_dotenv(main_repo / ".env", override=False)

GEMINI_API_KEY = os.environ.get("GOOGLE_GEMINI_API_KEY", "")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

CUES_PATH = ROOT / "data" / "clipart_cues.json"
STYLE_REF_PATH = REPO_ROOT / "public" / "illustrations" / "1_1" / "page2.png"
OUT_DIR = REPO_ROOT / "assets" / "phonics" / "clipart"
MANIFEST_PATH = OUT_DIR / "manifest.json"

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
GEMINI_MODEL = "gemini-2.5-flash-image"
OPENAI_MODEL_CHEAP = "gpt-image-1"     # default — ~5x cheaper, very similar style for clipart
OPENAI_MODEL_HQ    = "gpt-image-2"     # premium — only when --hq flag is set

REQUEST_DELAY = 2  # seconds between requests
MAX_RETRIES = 3
BACKOFF_BASE = 5
DEFAULT_QUALITY = "medium"  # medium is plenty for clipart and ~3-5x faster than high

# Force unbuffered stdout so background batches show progress live
try:
    sys.stdout.reconfigure(line_buffering=True)
    sys.stderr.reconfigure(line_buffering=True)
except Exception:
    pass


# ─── Style ──────────────────────────────────────────────────────────────────

STYLE_DIRECTIVE = (
    "Match the MyPhonicsBooks interior illustration style: "
    "hand-drawn cartoon with clean black outlines and soft watercolour-textured fills, "
    "warm friendly modern children's picture book aesthetic, "
    "soft pastel palette with gentle subtle paper-grain texture. "
    "NOT flat vector clipart. NOT classroom poster style. NOT pencil sketch. "
    "NOT photographic. NOT Jolly Phonics style. NOT Read Write Inc style. "
    "Single isolated subject, centred in frame, generous padding around the edges. "
    "Plain solid soft cream background (#FFF9F5) with no scenery, no other objects, "
    "no patterns, no text, no letters, no numbers. "
    "Square 1:1 composition. Simple recognisable silhouette."
)

EYE_RULE = (
    "If the subject has eyes (animal, person, creature), the eyes MUST be tiny solid black filled "
    "circles like dots drawn with a black marker pen — NO white sclera, NO iris, NO pupil detail, "
    "NO highlights. Just two small black dots like a teddy bear or rag doll."
)


def build_prompt(cue: dict) -> str:
    return (
        f"Whimsical children's book illustration of {cue['subject']}. "
        f"This is a clipart card for the phonics sound \"{cue['sound']}\" with the cue word \"{cue['cue']}\". "
        f"{STYLE_DIRECTIVE} {EYE_RULE}"
    )


# ─── Filesystem ─────────────────────────────────────────────────────────────

def slugify(s: str) -> str:
    return s.replace("-", "_").replace(" ", "_").lower()


def out_path_for(level_key: str, cue: dict) -> Path:
    return OUT_DIR / level_key / f"{slugify(cue['sound'])}_{slugify(cue['cue'])}.png"


def load_cues() -> dict:
    return json.loads(CUES_PATH.read_text(encoding="utf-8"))


def style_ref_bytes() -> bytes:
    if not STYLE_REF_PATH.exists():
        print(f"[error] style reference not found: {STYLE_REF_PATH}", file=sys.stderr)
        sys.exit(1)
    return STYLE_REF_PATH.read_bytes()


# ─── Gemini backend (async) ─────────────────────────────────────────────────

async def gen_gemini(
    session: aiohttp.ClientSession,
    cue: dict,
    style_ref_b64: str,
    level_key: str,
) -> tuple[Path | None, str]:
    if not GEMINI_API_KEY:
        return None, "[gemini] no GOOGLE_GEMINI_API_KEY"
    prompt = build_prompt(cue)
    url = f"{GEMINI_BASE_URL}/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{
            "parts": [
                {"text": "REFERENCE IMAGE — match this art style:"},
                {"inlineData": {"mimeType": "image/png", "data": style_ref_b64}},
                {"text": prompt},
            ]
        }],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }
    target = out_path_for(level_key, cue)
    target.parent.mkdir(parents=True, exist_ok=True)
    label = f"{level_key} {cue['sound']:>5}={cue['cue']}"
    for attempt in range(MAX_RETRIES):
        try:
            async with session.post(url, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    for part in result.get("candidates", [{}])[0].get("content", {}).get("parts", []):
                        if "inlineData" in part:
                            img = base64.b64decode(part["inlineData"]["data"])
                            target.write_bytes(img)
                            print(f"  [ok] {label:30s} -> {target.relative_to(REPO_ROOT)} ({len(img)/1024:.0f} KB)")
                            return target, prompt
                    print(f"  [no image] {label}")
                    return None, prompt
                body = await response.text()
                print(f"  [err {response.status}] {label}: {body[:300]}")
                if response.status == 429:
                    await asyncio.sleep(BACKOFF_BASE * (2 ** attempt))
                    continue
                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(BACKOFF_BASE * (2 ** attempt))
        except Exception as e:
            print(f"  [exc] {label}: {e}")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(BACKOFF_BASE)
    return None, prompt


# ─── OpenAI backend (sync, run via asyncio.to_thread) ───────────────────────

_openai_client = None

def get_openai_client():
    global _openai_client
    if _openai_client is None:
        from openai import OpenAI
        _openai_client = OpenAI(api_key=OPENAI_API_KEY)
    return _openai_client


def _gen_openai_sync(cue: dict, style_ref_path: Path, level_key: str, model: str) -> tuple[Path | None, str]:
    prompt = build_prompt(cue)
    target = out_path_for(level_key, cue)
    target.parent.mkdir(parents=True, exist_ok=True)
    label = f"{level_key} {cue['sound']:>5}={cue['cue']}"
    client = get_openai_client()
    quality = os.environ.get("CLIPART_QUALITY", DEFAULT_QUALITY)
    for attempt in range(MAX_RETRIES):
        try:
            with open(style_ref_path, "rb") as ref_file:
                resp = client.images.edit(
                    model=model,
                    image=ref_file,
                    prompt=(
                        "Create a NEW image, NOT a modification of the reference. "
                        "Use the reference ONLY for art style, not for content. "
                        + prompt
                    ),
                    size="1024x1024",
                    quality=quality,
                    background="auto",
                    output_format="png",
                    n=1,
                )
            data_b64 = resp.data[0].b64_json
            if not data_b64:
                print(f"  [no image] {label}")
                return None, prompt
            img = base64.b64decode(data_b64)
            target.write_bytes(img)
            print(f"  [ok] {label:30s} -> {target.relative_to(REPO_ROOT)} ({len(img)/1024:.0f} KB)")
            return target, prompt
        except Exception as e:
            msg = str(e)
            print(f"  [exc {attempt+1}/{MAX_RETRIES}] {label}: {msg[:300]}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(BACKOFF_BASE * (2 ** attempt))
    return None, prompt


async def gen_openai(cue: dict, style_ref_path: Path, level_key: str, model: str) -> tuple[Path | None, str]:
    if not OPENAI_API_KEY:
        return None, "[openai] no OPENAI_API_KEY"
    return await asyncio.to_thread(_gen_openai_sync, cue, style_ref_path, level_key, model)


# ─── Manifest ───────────────────────────────────────────────────────────────

def update_manifest(entries: list[dict], backend: str, model: str) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    if MANIFEST_PATH.exists():
        existing = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        existing_by_key = {(e["level"], e["sound"]): e for e in existing.get("entries", [])}
    else:
        existing_by_key = {}
    for e in entries:
        existing_by_key[(e["level"], e["sound"])] = e
    merged = sorted(existing_by_key.values(), key=lambda e: (e["level"], e["sound"]))
    payload = {
        "_note": "MyPhonicsBooks phonics clipart asset manifest. Generated by scripts/generate_clipart.py.",
        "model": model,
        "backend": backend,
        "style_reference": str(STYLE_REF_PATH.relative_to(REPO_ROOT)).replace("\\", "/"),
        "cue_source": str(CUES_PATH.relative_to(REPO_ROOT)).replace("\\", "/"),
        "last_updated": datetime.datetime.utcnow().isoformat() + "Z",
        "entries": merged,
    }
    MANIFEST_PATH.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


# ─── Main ───────────────────────────────────────────────────────────────────

async def run(args) -> int:
    if args.backend == "openai" and not OPENAI_API_KEY:
        print("[error] OPENAI_API_KEY not set", file=sys.stderr); return 1
    if args.backend == "gemini" and not GEMINI_API_KEY:
        print("[error] GOOGLE_GEMINI_API_KEY not set", file=sys.stderr); return 1

    cues = load_cues()

    # Pre-load style reference
    style_ref_b64 = base64.b64encode(style_ref_bytes()).decode("utf-8") if args.backend == "gemini" else None

    level_filter = args.level.lower().replace("l", "level_") if args.level else None
    sound_filter = args.sound

    work: list[tuple[str, dict]] = []
    for level_key, level_data in cues.items():
        if level_key.startswith("_"):
            continue
        if level_filter and level_key != level_filter:
            continue
        for cue in level_data["cues"]:
            if sound_filter and cue["sound"] != sound_filter:
                continue
            target = out_path_for(level_key, cue)
            if target.exists() and not args.force:
                print(f"  [skip] {level_key} {cue['sound']}={cue['cue']} (exists)")
                continue
            work.append((level_key, cue))

    if args.test:
        work = [(lk, c) for lk, c in work if c["sound"] == "nk"][:1] or work[:1]

    if not work:
        print("Nothing to do.")
        return 0

    if args.backend == "openai":
        openai_model = OPENAI_MODEL_HQ if args.hq else OPENAI_MODEL_CHEAP
        model = openai_model
    else:
        model = GEMINI_MODEL
    print(f"Generating {len(work)} clipart image(s) with {args.backend} ({model}).")
    print(f"Output: {OUT_DIR}")
    print(f"Style reference: {STYLE_REF_PATH.relative_to(REPO_ROOT)}\n")

    new_entries: list[dict] = []
    if args.backend == "openai":
        for level_key, cue in work:
            saved, prompt = await gen_openai(cue, STYLE_REF_PATH, level_key, openai_model)
            if saved is not None:
                new_entries.append(_entry(level_key, cue, saved, prompt, openai_model))
                update_manifest([new_entries[-1]], args.backend, openai_model)  # incremental save
            await asyncio.sleep(REQUEST_DELAY)
    else:
        async with aiohttp.ClientSession() as session:
            for level_key, cue in work:
                saved, prompt = await gen_gemini(session, cue, style_ref_b64, level_key)
                if saved is not None:
                    new_entries.append(_entry(level_key, cue, saved, prompt, GEMINI_MODEL))
                    update_manifest([new_entries[-1]], args.backend, GEMINI_MODEL)
                await asyncio.sleep(REQUEST_DELAY)

    print(f"\nDone. Generated: {len(new_entries)} / requested: {len(work)}")
    return 0 if len(new_entries) == len(work) else 1


def _entry(level_key: str, cue: dict, saved: Path, prompt: str, model: str) -> dict:
    return {
        "level": level_key,
        "sound": cue["sound"],
        "cue_word": cue["cue"],
        "subject": cue["subject"],
        "story_source": cue.get("story_source"),
        "filename": str(saved.relative_to(OUT_DIR)).replace("\\", "/"),
        "model": model,
        "prompt": prompt,
        "generated_at": datetime.datetime.utcnow().isoformat() + "Z",
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--backend", choices=["openai", "gemini"], default="openai")
    ap.add_argument("--hq", action="store_true", help="Use gpt-image-2 (premium) instead of gpt-image-1 (default, ~5x cheaper).")
    ap.add_argument("--test", action="store_true", help="Generate just the nk=tank test card.")
    ap.add_argument("--level", help="Level filter, e.g. L1, L2, L3 ...")
    ap.add_argument("--sound", help="Single grapheme to (re)generate, e.g. nk")
    ap.add_argument("--force", action="store_true", help="Overwrite existing PNGs.")
    args = ap.parse_args()
    sys.exit(asyncio.run(run(args)))


if __name__ == "__main__":
    main()
