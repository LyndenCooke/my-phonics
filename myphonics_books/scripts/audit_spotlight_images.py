"""Vision audit of every Sound Spotlight image the 33 books actually use.

Checks each unique image (assets/photos/{grapheme}/{word}.jpg) against the
house rules with Vertex Gemini vision:

  1. EYE RULE — any depicted eyes must be solid black filled ovals/dots:
     no white sclera, no catchlight, no glint, no coloured iris.
  2. STRAY FACE — objects must not have faces (the g/gum pack incident).
  3. CLARITY — the image must clearly depict its word; flag abstract or
     confusing depictions (the g/gap square-triangle diagram class).
  4. BUSYNESS — flag cluttered scenes / coloured backgrounds (1-5, flag >=4).

Sequential with backoff (per the Vertex etiquette in memory), checkpointed
to output/qa/spotlight_image_audit.checkpoint.json so re-runs only process
new/changed images (keyed by file mtime+size).

Run:  py -3.12 -X utf8 scripts/audit_spotlight_images.py [--limit N]
Out:  output/qa/spotlight_image_audit.md  (+ summary on stdout)
"""
from __future__ import annotations

import base64
import json
import re
import subprocess
import sys
import time
from pathlib import Path

import requests

BASE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE / "scripts"))
sys.path.insert(0, str(BASE))

PHOTOS = BASE / "assets" / "photos"
OUT_MD = BASE / "output" / "qa" / "spotlight_image_audit.md"
CHECKPOINT = BASE / "output" / "qa" / "spotlight_image_audit.checkpoint.json"
REGION = "us-central1"
# MPB_VISION_MODEL overrides — flash-lite has a separate quota pool, used
# when the day's calls exhaust gemini-2.5-flash (hit 2026-07-14).
import os
MODEL = os.environ.get("MPB_VISION_MODEL", "gemini-2.5-flash")

RUBRIC = """You are auditing a phonics flashcard image for a children's book.
The image illustrates the word: "{word}".

House rules to check:
1. EYE RULE: if ANY person, animal or character in the image has eyes, every
   eye must be a SOLID BLACK filled oval or dot — no white sclera, no white
   catchlight/glint/highlight, no coloured iris. Closed eyes (curved lines)
   are fine. If there are no eyes at all, this rule passes.
2. STRAY FACE: inanimate objects (food, packs, tools, letters...) must NOT
   have faces or eyes drawn on them.
3. CLARITY: the image should clearly and immediately depict "{word}" to a
   4-6 year old. Flag abstract diagrams or confusing depictions.
4. BUSYNESS: rate 1-5 how cluttered/busy it is (1 = one clean subject on a
   plain white background; 5 = busy scene, many objects, coloured or
   patterned background).

Reply with ONLY this JSON, no markdown fences:
{{"has_eyes": true/false, "eye_violation": true/false,
 "eye_detail": "<short: what the eyes look like, or 'none'>",
 "stray_face": true/false, "clear_depiction": true/false,
 "busyness": 1-5, "verdict": "pass"/"fail", "reason": "<one short sentence>"}}
Fail iff: eye_violation, stray_face, not clear_depiction, or busyness >= 4."""

_auth: dict = {}


def vertex_auth():
    if _auth:
        return _auth["tok"], _auth["proj"]
    tok = subprocess.run(["gcloud", "auth", "print-access-token"],
                         capture_output=True, text=True, shell=True).stdout.strip()
    proj = subprocess.run(["gcloud", "config", "get-value", "project"],
                          capture_output=True, text=True, shell=True).stdout.strip()
    if not tok or not proj:
        sys.exit("gcloud not authenticated")
    _auth.update(tok=tok, proj=proj)
    return tok, proj


def ask_vision(img_path: Path, word: str) -> dict | None:
    tok, proj = vertex_auth()
    url = (f"https://{REGION}-aiplatform.googleapis.com/v1/projects/{proj}"
           f"/locations/{REGION}/publishers/google/models/{MODEL}:generateContent")
    b64 = base64.b64encode(img_path.read_bytes()).decode()
    payload = {
        "contents": [{"role": "user", "parts": [
            {"inlineData": {"mimeType": "image/jpeg", "data": b64}},
            {"text": RUBRIC.format(word=word)},
        ]}],
        "generationConfig": {"temperature": 0.0, "maxOutputTokens": 2000},
    }
    headers = {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}
    for attempt in range(4):
        try:
            r = requests.post(url, json=payload, headers=headers, timeout=120)
        except requests.RequestException:
            time.sleep(5 * (attempt + 1))
            continue
        if r.status_code == 401 and attempt == 0:
            _auth.clear()  # token expired mid-run — refresh once
            tok, proj = vertex_auth()
            headers["Authorization"] = f"Bearer {tok}"
            continue
        if r.status_code == 429:
            time.sleep(10 * (2 ** attempt))
            continue
        if r.status_code != 200:
            time.sleep(3)
            continue
        try:
            text = r.json()["candidates"][0]["content"]["parts"][0]["text"]
            m = re.search(r"\{.*\}", text, re.DOTALL)
            return json.loads(m.group(0)) if m else None
        except Exception:
            return None
    return None


def collect_usage() -> dict:
    """unique image path -> {word, books[]} for every spotlight image used."""
    from generate_pilot_books import get_pilot_stories, LEVEL_KEYS, NEW_TO_OLD
    spotlight = json.load(open(BASE / "data" / "spotlight_words.json", encoding="utf-8"))
    stories = get_pilot_stories()
    used: dict[str, dict] = {}
    for new_id in sorted(NEW_TO_OLD, key=lambda k: [int(p) for p in k.split(".")]):
        story = stories.get(LEVEL_KEYS.get(NEW_TO_OLD[new_id]))
        if not story:
            continue
        ssw = story.get("spotlight_words") or {}
        for g in story.get("focus_graphemes", []):
            words = (ssw.get(g)
                     or [w["word"] if isinstance(w, dict) else w
                         for w in spotlight.get(g, {}).get("words", [])])[:4]
            for w in words:
                p = PHOTOS / g.replace("-", "_") / f"{w}.jpg"
                if p.exists():
                    entry = used.setdefault(str(p), {"word": w, "books": []})
                    if new_id not in entry["books"]:
                        entry["books"].append(new_id)
    return used


def main():
    limit = None
    if "--limit" in sys.argv:
        limit = int(sys.argv[sys.argv.index("--limit") + 1])
    used = collect_usage()
    cp = json.load(open(CHECKPOINT, encoding="utf-8")) if CHECKPOINT.exists() else {}
    items = sorted(used.items())
    if limit:
        items = items[:limit]
    done = 0
    for path_s, meta in items:
        p = Path(path_s)
        stamp = f"{p.stat().st_mtime_ns}:{p.stat().st_size}"
        key = str(p.relative_to(BASE)).replace("\\", "/")
        prev = cp.get(key, {})
        # Skip only entries with a REAL verdict — stored API errors must
        # retry on the next run (they were wrongly treated as done before).
        if (prev.get("stamp") == stamp
                and (prev.get("result") or {}).get("verdict") in ("pass", "fail")):
            continue
        result = ask_vision(p, meta["word"])
        cp[key] = {"stamp": stamp, "word": meta["word"], "books": meta["books"],
                   "result": result or {"verdict": "error", "reason": "no response"}}
        done += 1
        CHECKPOINT.parent.mkdir(parents=True, exist_ok=True)
        json.dump(cp, open(CHECKPOINT, "w", encoding="utf-8"), indent=1)
        r_safe = result or {}
        v = r_safe.get("verdict", "error")
        print(f"[{done}] {key} ({meta['word']}): {v}"
              + (f" — {r_safe.get('reason', '')}" if v != "pass" else ""))
        time.sleep(0.5)

    # ---- report ----------------------------------------------------------
    # Checkpoint entries persist for words that later leave the curriculum
    # (kept so a returning word skips a re-check); the report must only show
    # images a book currently uses, matching audit_release.py.
    used_keys = {str(Path(p).relative_to(BASE)).replace("\\", "/") for p in used}
    fails, errors = [], []
    for key, entry in sorted(cp.items()):
        if key not in used_keys:
            continue
        r = entry.get("result") or {}
        if r.get("verdict") == "fail":
            fails.append((key, entry))
        elif r.get("verdict") != "pass":
            errors.append((key, entry))
    checked = sum(1 for k in cp if k in used_keys)
    lines = ["# Sound Spotlight image audit (vision)", "",
             f"{checked} in-use images checked — {len(fails)} FAIL, {len(errors)} errors.",
             "Regenerate failures with `regen_spotlight_vertex.py` (eye rule is baked",
             "into its STYLE prompt). Re-run this audit after any regen — the",
             "checkpoint keys off file mtime, so changed images re-check automatically.", ""]
    if fails:
        lines.append("| Image | Word | Books | Why it fails |")
        lines.append("|---|---|---|---|")
        for key, e in fails:
            r = e["result"]
            why = r.get("reason", "")
            extra = []
            if r.get("eye_violation"):
                extra.append(f"eyes: {r.get('eye_detail', '?')}")
            if r.get("stray_face"):
                extra.append("stray face on object")
            if not r.get("clear_depiction", True):
                extra.append("unclear depiction")
            if r.get("busyness", 0) >= 4:
                extra.append(f"busyness {r['busyness']}/5")
            lines.append(f"| {key} | {e['word']} | {', '.join('L' + b for b in e['books'])} "
                         f"| {why} ({'; '.join(extra)}) |")
    if errors:
        lines += ["", "## Errors (re-run to retry)", ""]
        lines += [f"- {key}" for key, _ in errors]
    OUT_MD.write_text("\n".join(lines), encoding="utf-8")
    print(f"\nWrote {OUT_MD}")
    print(f"{checked} in-use checked, {len(fails)} fail, {len(errors)} errors")
    return 0


if __name__ == "__main__":
    sys.exit(main())
