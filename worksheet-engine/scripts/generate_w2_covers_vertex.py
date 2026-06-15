# ---------------------------------------------------------------------------
# generate_w2_covers_vertex.py — Vertex AI fallback for generate_w2_covers.py.
# Same job (workbook covers for all 8 levels in the style of the approved
# docs/cover_refs/favourite.png), but the OpenAI key has hit its billing hard
# limit, so generation runs on Vertex AI gemini-2.5-flash-image and the vision
# QA on gemini-2.5-flash, both with the gcloud OAuth token (account
# hello@myphonicsbooks.co.uk, project iron-entropy-496317-q9).
#
#   py -3.12 scripts/generate_w2_covers_vertex.py        # all levels
#   py -3.12 scripts/generate_w2_covers_vertex.py 3 7    # just these
# Output: public/covers/w2/l<n>.png  (+ output/_research/w2_cover_qa.json)
# ---------------------------------------------------------------------------
import base64
import io
import json
import subprocess
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import requests
from PIL import Image

HERE = Path(__file__).resolve().parent.parent
REF = HERE / "docs" / "cover_refs" / "favourite.png"
OUT = HERE / "public" / "covers" / "w2"
QA_OUT = HERE / "output" / "_research" / "w2_cover_qa.json"
OUT.mkdir(parents=True, exist_ok=True)
QA_OUT.parent.mkdir(parents=True, exist_ok=True)

PROJECT = "iron-entropy-496317-q9"
VERTEX = (f"https://us-central1-aiplatform.googleapis.com/v1/projects/{PROJECT}"
          "/locations/us-central1/publishers/google/models")

_token_lock = threading.Lock()
_token = {"value": None, "at": 0.0}


def token() -> str:
    with _token_lock:
        if not _token["value"] or time.time() - _token["at"] > 45 * 60:
            _token["value"] = subprocess.run(
                ["gcloud", "auth", "print-access-token"],
                capture_output=True, text=True, check=True, shell=True,
            ).stdout.strip().splitlines()[-1]
            _token["at"] = time.time()
        return _token["value"]


# Ledger colours + names mirror src/design/levelThemes.ts — keep in sync.
# Heroes are OBJECTS from that level's workbook books (Lynden 2026-06-13: no
# animals — the generated animal faces don't follow the house eye pattern —
# and a book object must keep its identifying feature in B/W line art, e.g.
# the L5 boat's stripes from 'The Boat with the Red Sail').
LEVELS = {
    1: {"name": "Ditties",          "hex": "#E84B8A", "colour": "vivid pink",
        "hero": "a mop standing in or leaning against a round bucket, from "
                "'The Mud on the Dog'",
        "skills": "sounds · grammar · spelling · big writes"},
    2: {"name": "First Sounds",     "hex": "#F97066", "colour": "warm coral",
        "hero": "a pair of cosy knitted socks side by side, each with a ribbed "
                "cuff, from 'The Red Socks'",
        "skills": "sounds · grammar · spelling · big writes"},
    3: {"name": "Special Friends",  "hex": "#F59E0B", "colour": "warm amber-orange",
        "hero": "a simple rectangular fish tank with pebbles, one water plant "
                "and a few rising bubbles (no fish), from 'The Fish in the Tank'",
        "skills": "sounds · grammar · spelling · big writes"},
    4: {"name": "Longer Sounds",    "hex": "#22C55E", "colour": "fresh green",
        "hero": "a simple farm barn with big double doors and a hay bale beside "
                "it, from 'Morning on the Farm'",
        "skills": "grammar · spelling · big writes · handwriting"},
    5: {"name": "New Spellings",    "hex": "#3B82F6", "colour": "bright blue",
        "hero": "a small sailing boat with a big triangular sail (a small "
                "second jib sail is fine) and ONE bold horizontal stripe along "
                "the hull, sitting on two simple wavy water lines, from 'The "
                "Boat with the Red Sail' (the hull stripe must be clearly "
                "visible even in white line art)",
        "skills": "grammar · spelling · big writes · handwriting"},
    6: {"name": "Building Fluency", "hex": "#6366F1", "colour": "indigo-violet",
        "hero": "a leafy fern with gracefully arching fronds growing from a "
                "small plant pot, from 'The Purple Purse' (the word fern is in "
                "the book)",
        "skills": "grammar · spelling · big writes · handwriting"},
    7: {"name": "Reading Together", "hex": "#8B5CF6", "colour": "rich purple",
        "hero": "a tall lighthouse with horizontal stripes standing on a small "
                "rock, from 'Before the Shore'",
        "skills": "grammar · spelling · big writes · handwriting"},
    8: {"name": "Reading Champion", "hex": "#14B8A6", "colour": "teal",
        "hero": "a row of three small friendly houses with pitched roofs, from "
                "'The Marvellous Neighbourhood'",
        "skills": "grammar · spelling · big writes · handwriting"},
}

A4 = 297 / 210  # crop target: full-bleed A4 portrait


def prompt_for(n: int) -> str:
    L = LEVELS[n]
    return (
        "Recreate this exact children's workbook cover, keeping the identical layout, "
        "composition, hand-drawn white line-art illustration style, typography, white "
        "outlined badge, decorative corner stars, white Name/Class panel at the bottom "
        "left and the MyPhonicsBooks logo at the bottom — change ONLY the following:\n"
        f"1. The entire flat background colour becomes {L['colour']} (hex {L['hex']}) — "
        "one single solid flat colour everywhere, no gradients.\n"
        f"2. The badge at the top reads exactly: LEVEL {n} · {L['name'].upper()}\n"
        "3. The big main title reads exactly: Workbook\n"
        f"4. The decorated line under the title reads exactly: Level {n} · {L['name']}\n"
        f"5. The small dot-separated line under that reads exactly: {L['skills']}\n"
        f"6. The illustration becomes {L['hero']}, drawn as simple white line art with "
        "the same weight and charm as the reference illustration, one single subject. "
        "It is an OBJECT: no animals, no people, and absolutely no face or eyes drawn "
        "on it. It is drawn LARGE, filling the middle of the cover like the reference "
        "illustration, with its base sitting low, just above the white Name/Class "
        "panel, exactly where the reference illustration's base sits.\n"
        "Every word must be spelled exactly as given. Keep every element well inside "
        "the edges with generous breathing room — nothing may touch or sit near the "
        "top or bottom edge of the image."
    )


def crop_a4(png: bytes) -> bytes:
    im = Image.open(io.BytesIO(png)).convert("RGB")
    w, h = im.size
    want_h = round(w * A4)
    if h > want_h:
        top = (h - want_h) // 2
        im = im.crop((0, top, w, top + want_h))
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    return buf.getvalue()


def vertex(model: str, body: dict) -> dict:
    for attempt in range(6):
        r = requests.post(
            f"{VERTEX}/{model}:generateContent",
            headers={"Authorization": f"Bearer {token()}",
                     "Content-Type": "application/json"},
            json=body, timeout=300,
        )
        if r.status_code == 401:
            with _token_lock:
                _token["value"] = None  # stale token — refresh and retry
            continue
        if r.status_code == 429 and attempt < 5:
            time.sleep(20 * (attempt + 1))
            continue
        r.raise_for_status()
        return r.json()
    raise RuntimeError(f"{model}: out of retries")


def generate(n: int) -> bytes:
    ref_b64 = base64.b64encode(REF.read_bytes()).decode()
    out = vertex("gemini-2.5-flash-image", {
        "contents": [{"role": "user", "parts": [
            {"inlineData": {"mimeType": "image/png", "data": ref_b64}},
            {"text": prompt_for(n)},
        ]}],
        "generationConfig": {
            "responseModalities": ["IMAGE"],
            "imageConfig": {"aspectRatio": "2:3"},  # cropped down to A4 after
        },
    })
    for part in out["candidates"][0]["content"]["parts"]:
        data = part.get("inlineData", {}).get("data")
        if data:
            return base64.b64decode(data)
    raise RuntimeError(f"no image part in response: {json.dumps(out)[:300]}")


def qa(n: int, png: bytes) -> dict:
    L = LEVELS[n]
    expect = (
        f"badge 'LEVEL {n} · {L['name'].upper()}', title 'Workbook', "
        f"subtitle 'Level {n} · {L['name']}', skills line '{L['skills']}', "
        f"a Name/Class panel, a MyPhonicsBooks logo, and the illustration: {L['hero']}"
    )
    out = vertex("gemini-2.5-pro", {
        "contents": [{"role": "user", "parts": [
            {"text":
                "You are QA-checking a children's workbook cover. It must contain: "
                + expect + ". First TRANSCRIBE every piece of text on the cover "
                "letter by letter, exactly as printed. Then check: (1) each "
                "transcribed text matches the expected text EXACTLY — flag any "
                "misspelling, even one wrong/extra/missing letter (e.g. "
                "'Flucency' for 'Fluency'), but treat dot/bullet separator "
                "glyphs as equivalent, (2) there is ONE single hero illustration "
                "matching the description, (3) no element is cut off by any edge "
                "of the image, (4) the background is one flat solid colour, "
                "(5) the illustration is an object with NO face and NO eyes "
                "drawn on it (no animals, no people). "
                "Reply JSON: {\"transcription\": [strings], \"pass\": bool, "
                "\"problems\": [strings]}"},
            {"inlineData": {"mimeType": "image/png",
                            "data": base64.b64encode(png).decode()}},
        ]}],
        "generationConfig": {"temperature": 0,
                             "responseMimeType": "application/json"},
    })
    return json.loads(out["candidates"][0]["content"]["parts"][0]["text"])


def run(n: int) -> dict:
    last = None
    for attempt in range(1, 5):
        try:
            png = crop_a4(generate(n))
            verdict = qa(n, png)
            last = {"level": n, "attempt": attempt, **verdict}
            print(f"[L{n}] attempt {attempt}: "
                  f"{'PASS' if verdict.get('pass') else verdict.get('problems')}",
                  flush=True)
            # keep the latest attempt anyway so there is always something to eyeball
            (OUT / f"l{n}.png").write_bytes(png)
            if verdict.get("pass"):
                return last
        except Exception as e:  # noqa: BLE001 — log and retry, this is a batch tool
            print(f"[L{n}] attempt {attempt} ERROR: {e}", flush=True)
            last = {"level": n, "attempt": attempt, "pass": False, "problems": [str(e)]}
    return last


def main():
    levels = [int(a) for a in sys.argv[1:]] or list(LEVELS)
    with ThreadPoolExecutor(max_workers=1) as ex:
        results = list(ex.map(run, levels))
    QA_OUT.write_text(json.dumps(results, indent=2), encoding="utf-8")
    bad = [r for r in results if not r.get("pass")]
    print(f"\n{len(results) - len(bad)}/{len(results)} passed -> {OUT}")
    for r in bad:
        print(f"  L{r['level']} STILL FAILING: {r.get('problems')}")


if __name__ == "__main__":
    main()
