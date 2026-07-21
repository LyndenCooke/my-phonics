"""
MyPhonicsBooks — Sound Book generator

Builds all (or a subset of) the 73 Sound Books defined in
data/sound_books/inventory.py into A5 PDFs under output/sound_books/L{n}/.

Pipeline per book:
  1. Build a book_data dict (level metadata + sounds + word_html + sound_buttons).
  2. Fetch a real photo for each word from Pexels (cached to disk).
  3. Render templates/sound_book.html via the existing render_book_html().
  4. Convert HTML to PDF via the existing async html_to_pdf().

Usage:
  py -3.12 scripts/generate_sound_books.py                    # all 73
  py -3.12 scripts/generate_sound_books.py --level 3          # one level
  py -3.12 scripts/generate_sound_books.py --sample           # 1-2 per level
  py -3.12 scripts/generate_sound_books.py --book L3.1        # one book
  py -3.12 scripts/generate_sound_books.py --skip-photos      # placeholders

Environment:
  PEXELS_API_KEY     required for real photos (falls back to Unsplash if
                     UNSPLASH_ACCESS_KEY is set and Pexels key absent)
"""

from __future__ import annotations

import argparse
import asyncio
import os
import re
import sys
import time
from pathlib import Path

# Local imports
BASE_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(BASE_DIR))

from scripts.generate_book import (  # noqa: E402
    render_book_html,
    html_to_pdf,
    image_to_data_uri,
)

from data.sound_books.inventory import (  # noqa: E402
    INVENTORY,
    LEVEL_COLOURS,
    LEVEL_NAMES,
    QUERY_OVERRIDES,
)


# ─── .env loader (no python-dotenv dependency) ──────────────────
def _load_env():
    env_path = BASE_DIR / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        k = k.strip()
        v = v.strip().strip('"').strip("'")
        # Strip trailing inline comments
        if "#" in v:
            v = v.split("#", 1)[0].strip()
        if k and k not in os.environ:
            os.environ[k] = v


_load_env()


# ─── Paths ───────────────────────────────────────────────────────
OUTPUT_DIR = BASE_DIR / "output" / "sound_books"
PHOTO_CACHE = OUTPUT_DIR / "_photo_cache"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
PHOTO_CACHE.mkdir(parents=True, exist_ok=True)


# ─── Grapheme tables for sound-button segmentation ──────────────
TRIGRAPHS = [
    "tion", "igh", "air", "ear", "ure", "ire", "ore", "oor",
    "dge", "are",
]
DIGRAPHS = [
    "sh", "ch", "th", "ng", "nk", "qu", "ck",
    "ff", "ll", "ss", "zz",
    "ay", "ee", "ow", "oo", "ar", "or", "ir", "ou", "oy",
    "ai", "ea", "ie", "oi", "aw", "oa", "ur", "er",
    "ew", "ue", "wr", "kn", "mb", "gn", "ph", "wh",
]
# Quad+ graphemes (suffixes treated as one unit for sound buttons)
QUADS = ["cious", "tious", "able", "ible", "ous"]


def derive_sound_buttons(word: str, focus_grapheme: str) -> list[str]:
    """Greedy left-to-right segmentation into phonemes.

    Returns a list of one of: "dot", "dash", "long-dash".

    Special handling:
    - Split digraphs (a-e, i-e, o-e, u-e): detect VCe / VCCe pattern at end.
    - Suffix graphemes (-cious, -tious, -able, -ible, -ous): treated as
      a single quad/long-dash phoneme attached at the end.
    """
    w = word.lower().strip()

    # ── Split digraph (focus_grapheme contains "-") ──
    if "-" in focus_grapheme:
        # Pattern: V + 1-2 consonants + e at the end
        if w.endswith("e") and len(w) >= 3:
            for cons_count in (1, 2):
                vowel_pos = len(w) - 2 - cons_count
                if vowel_pos < 0:
                    continue
                if w[vowel_pos] in "aiou":
                    middle = w[vowel_pos + 1:-1]
                    if all(c not in "aeiou" for c in middle):
                        # Split digraph confirmed
                        prefix = w[:vowel_pos]
                        prefix_buttons = _segment_simple(prefix)
                        middle_buttons = _segment_simple(middle)
                        # Order in the row: prefix … long-dash … middle
                        return prefix_buttons + ["long-dash"] + middle_buttons
        # Fall through if pattern didn't match

    # ── Suffix graphemes (L8) ──
    for suffix in sorted(QUADS, key=len, reverse=True):
        if w.endswith(suffix) and len(w) > len(suffix):
            prefix = w[: -len(suffix)]
            return _segment_simple(prefix) + ["long-dash"]

    return _segment_simple(w)


def _segment_simple(s: str) -> list[str]:
    """Greedy segmentation of `s` into dot/dash/long-dash phonemes."""
    out: list[str] = []
    i = 0
    while i < len(s):
        # Try trigraph first
        matched = False
        for tri in TRIGRAPHS:
            if s.startswith(tri, i):
                out.append("long-dash")
                i += len(tri)
                matched = True
                break
        if matched:
            continue
        # Try digraph
        for di in DIGRAPHS:
            if s.startswith(di, i):
                out.append("dash")
                i += 2
                matched = True
                break
        if matched:
            continue
        # Single letter
        out.append("dot")
        i += 1
    return out


def derive_word_html(word: str, focus_grapheme: str, colour: str) -> str:
    """Wrap the focus grapheme in the word with a coloured bold span.

    Handles split digraphs (a-e) by colouring the vowel and the final e.
    """
    if "-" in focus_grapheme:
        # Split digraph — colour the leading vowel and the silent trailing e
        v = focus_grapheme.split("-")[0]
        wl = word.lower()
        # Locate the v…e pattern matching split digraph rules
        if wl.endswith("e") and len(wl) >= 3:
            for cons_count in (1, 2):
                vowel_pos = len(wl) - 2 - cons_count
                if vowel_pos < 0:
                    continue
                if wl[vowel_pos] == v and all(
                    c not in "aeiou" for c in wl[vowel_pos + 1:-1]
                ):
                    pre = word[:vowel_pos]
                    vowel_char = word[vowel_pos]
                    middle = word[vowel_pos + 1:-1]
                    final_e = word[-1]
                    return (
                        f"{pre}"
                        f"<span style='color:{colour}; font-weight:normal;'>{vowel_char}</span>"
                        f"{middle}"
                        f"<span style='color:{colour}; font-weight:normal;'>{final_e}</span>"
                    )
        # Fall through if pattern not detected — show plain word
        return word

    # Simple case: highlight the first occurrence of the grapheme (case-insensitive)
    pattern = re.escape(focus_grapheme)
    m = re.search(pattern, word, flags=re.IGNORECASE)
    if not m:
        return word
    start, end = m.span()
    return (
        f"{word[:start]}"
        f"<span style='color:{colour}; font-weight:normal;'>{word[start:end]}</span>"
        f"{word[end:]}"
    )


# ─── Photo fetching ──────────────────────────────────────────────
def _cache_dir(word: str, query: str) -> Path:
    safe = re.sub(r"[^a-z0-9]+", "_", f"{word}__{query}".lower()).strip("_")
    d = PHOTO_CACHE / safe
    d.mkdir(parents=True, exist_ok=True)
    return d


def _picked_path(word: str, query: str) -> Path:
    """The final chosen photo (symlinked / copied to a flat cache file)."""
    safe = re.sub(r"[^a-z0-9]+", "_", f"{word}__{query}".lower()).strip("_")
    return PHOTO_CACHE / f"{safe}.jpg"


def fetch_wikipedia_candidate(word: str) -> Path | None:
    """Fetch the lead/infobox image from the Wikipedia article for `word`.

    Wikipedia article lead images are curated to be representative,
    so they're often the cleanest single-subject shot available for
    common nouns ("Sun" → solar disk, "Spoon" → one spoon).
    """
    safe = re.sub(r"[^a-z0-9]+", "_", word.lower()).strip("_") or "x"
    folder = PHOTO_CACHE / safe
    folder.mkdir(parents=True, exist_ok=True)
    out_path = folder / "wiki_lead.jpg"
    if out_path.exists() and out_path.stat().st_size > 1000:
        return out_path

    import requests

    title = word.replace("_", " ").strip()
    headers = {"User-Agent": "MyPhonicsBooks/1.0 (lyndencooke@gmail.com)"}

    # pageimages gives a sized thumbnail (rasterized) and follows redirects
    api = "https://en.wikipedia.org/w/api.php"
    params = {
        "action": "query",
        "format": "json",
        "titles": title,
        "prop": "pageimages",
        "pithumbsize": 1024,
        "redirects": 1,
    }
    try:
        r = requests.get(api, params=params, headers=headers, timeout=20)
        r.raise_for_status()
        pages = (r.json().get("query") or {}).get("pages") or {}
        img_url = None
        for _, p in pages.items():
            thumb = (p.get("thumbnail") or {}).get("source")
            if thumb:
                img_url = thumb
                break
        if not img_url:
            return None

        img_r = requests.get(img_url, headers=headers, timeout=30)
        img_r.raise_for_status()
        raw = img_r.content
        # Convert to JPEG (Wikipedia images may be PNG/WebP with transparency)
        try:
            from PIL import Image
            from io import BytesIO
            img = Image.open(BytesIO(raw))
            if img.mode in ("RGBA", "LA", "P"):
                bg = Image.new("RGB", img.size, "white")
                if img.mode == "P":
                    img = img.convert("RGBA")
                bg.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)
                img = bg
            else:
                img = img.convert("RGB")
            img.save(out_path, format="JPEG", quality=90)
        except Exception:
            # If PIL can't decode (e.g. SVG), skip
            return None
        return out_path
    except Exception as e:
        print(f"   [wiki-error] {word!r}: {e}")
        return None


PEXELS_MIN_WIDTH = 800  # discard cached candidates smaller than this (blur fix)


def fetch_pexels_candidates(
    word: str,
    query: str,
    k: int = 10,
    refresh: bool = False,
) -> list[Path]:
    """Fetch up to k portrait candidates from Pexels into a per-word folder.

    Returns the list of cached candidate paths (sorted by Pexels rank).
    Re-uses cache when candidates already on disk AND meet PEXELS_MIN_WIDTH.
    Older caches at thumbnail resolution (medium, ~480px) are discarded
    because they upscale poorly to A5 portrait.
    """
    folder = _cache_dir(word, query)
    existing = sorted(folder.glob("cand_*.jpg"))

    # Cache-quality check: drop low-res candidates so we re-fetch at full size.
    # Probe inside its own `with` block so the file handle closes before
    # we try to unlink (Windows can't delete a file held open by PIL).
    if existing and not refresh:
        probed_width = None
        try:
            from PIL import Image
            with Image.open(existing[0]) as probe:
                probed_width = probe.size[0]
        except Exception:
            pass
        if probed_width is not None and probed_width < PEXELS_MIN_WIDTH:
            print(f"   [pexels-upgrade] {word!r} cached at "
                  f"{probed_width}px — re-fetching at full size")
            for p in existing:
                try:
                    p.unlink()
                except Exception as e:
                    print(f"   [pexels-upgrade-unlink-err] {p}: {e}")
            existing = []

    if refresh and existing:
        for p in existing:
            p.unlink()
        existing = []

    if len(existing) >= 3:
        return existing

    api_key = os.environ.get("PEXELS_API_KEY", "").strip()
    if not api_key or api_key.startswith("your_"):
        return []

    import requests

    url = "https://api.pexels.com/v1/search"
    # size=large filters results to those that have a large variant; we
    # then download the large/original URL for crisp A5 rendering.
    params = {"query": query, "per_page": k, "orientation": "portrait", "size": "large"}
    headers = {"Authorization": api_key}

    try:
        r = requests.get(url, params=params, headers=headers, timeout=25)
        if r.status_code == 429:
            print(f"   [rate-limit] Pexels 429 on '{query}' — sleeping 30s")
            time.sleep(30)
            r = requests.get(url, params=params, headers=headers, timeout=25)
        r.raise_for_status()
        photos = r.json().get("photos") or []
        if len(photos) < 3:
            # Top up with landscape candidates
            params2 = {"query": query, "per_page": k, "orientation": "landscape", "size": "large"}
            r2 = requests.get(url, params=params2, headers=headers, timeout=25)
            if r2.ok:
                photos += (r2.json().get("photos") or [])
    except Exception as e:
        print(f"   [pexels-error] {word!r} ({query!r}): {e}")
        return existing

    out: list[Path] = []
    for i, ph in enumerate(photos[:k]):
        path = folder / f"cand_{i:02d}.jpg"
        if path.exists() and path.stat().st_size > 0:
            out.append(path)
            continue
        # Prefer crisp large variants over the tiny medium thumbnail
        img_url = (
            ph["src"].get("large2x")
            or ph["src"].get("large")
            or ph["src"].get("original")
            or ph["src"].get("medium")
        )
        if not img_url:
            continue
        try:
            img_r = requests.get(img_url, timeout=30)
            img_r.raise_for_status()
            path.write_bytes(img_r.content)
            try:
                from PIL import Image
                with Image.open(path) as probe:
                    print(f"   [pexels-dl] {word!r} cand_{i:02d}: {probe.size} from {img_url[:80]}")
            except Exception:
                pass
            out.append(path)
        except Exception as e:
            print(f"   [pexels-dl-error] {img_url}: {e}")
    return out


def pick_best_candidate(word: str, candidates: list[Path]) -> tuple[Path | None, int]:
    """Use gpt-4o vision to pick the best candidate for a children's picture book.

    Returns (chosen Path, confidence 0-10). Confidence reflects how well the
    chosen candidate matches the picture-book bar — used to decide whether to
    fall back to Gemini for non-living subjects.
    """
    if not candidates:
        return None, 0
    if len(candidates) == 1:
        return candidates[0], 5  # unknown — assume middling

    import requests
    tok, proj = _vertex_token_and_project()
    if not tok or not proj:
        print(f"   [vision-pick] no Vertex auth — candidate 0 for {word!r}")
        return candidates[0], 0
    ETHOS = (
        "\n\nABSOLUTE RULES for a Muslim / Islamic-ethos audience (UK + Gulf schools). "
        "These OVERRIDE everything above: give any violating candidate score 0 and never "
        "pick it unless EVERY candidate violates (then pick the least bad):\n"
        "- HARAM: no alcohol / beer / wine / cocktails / bars; no pork / ham / bacon / pig "
        "as food; no gambling.\n"
        "- MODESTY: no exposed legs, thighs, midriff, shoulders, cleavage; no bare arms above "
        "the elbow; no swimwear; no tight or revealing clothing — especially on women or girls. "
        "Awrah must be covered.\n"
        "- NO non-Islamic religious content: churches, crosses, temples, idols, statues of "
        "deities or Buddha, other faiths' festivals.\n"
        "PREFERENCE: where natural, favour culturally diverse, non-Western-default, modest "
        "depictions (e.g. a taqiyah / kufi / embroidered cap over a Western beach hat; a domed "
        "clay house / riad / yurt over a Western cottage; food and dress from around the world). "
        "Do not force it — recognisability comes first."
    )

    import base64

    def _data_uri(p: Path) -> str:
        b = p.read_bytes()
        return f"data:image/jpeg;base64,{base64.b64encode(b).decode('ascii')}"

    content = [
        {
            "type": "text",
            "text": (
                f"Pick ONE photo (best index 0-{len(candidates)-1}) for a "
                f"children's phonics picture book page teaching the word \"{word}\".\n\n"
                "The photo must look like a children's PICTURE BOOK illustration "
                f"of a {word} — bright, colourful, instantly recognisable to a "
                "4-year-old who is learning to read.\n\n"
                f"PREFER: vivid colour, single {word} filling most of the frame, "
                "clean uncluttered background, child-friendly mood. The kind of "
                f"photo where a child points and shouts '{word}!'.\n\n"
                "HARD KILL (score 0, never pick these even if every other "
                "candidate is bad):\n"
                "- ANY visible text, letters, words, slogans, embroidery, "
                "  watermarks, logos, brand names — even small or stylised. "
                "  A children's phonics book must not put unrelated text on the "
                "  picture, because the child is learning to read.\n"
                "- monochrome / black-and-white / scientific / encyclopaedic "
                f"  shots (e.g. greyscale solar disk for 'sun' — looks like moon)\n"
                "- NSFW or anything inappropriate for a small child\n\n"
                "STRONGLY DOWNRANK:\n"
                f"- wide landscapes where the {word} is a tiny element\n"
                "- night / dim / underexposed shots when a bright version exists\n"
                "- cluttered scenes with many other objects competing for attention\n"
                "- adults dominating the frame (unless the word IS the person)\n"
                "- abstract/artsy compositions where the subject is implied not shown\n\n"
                "Score each candidate 0-10 against the rules above. Reply on a "
                "single line in the exact format `INDEX,SCORE` where INDEX is "
                "the index of the highest scorer and SCORE is that candidate's "
                "score (0-10). Example: `3,8`. Nothing else."
            ),
        }
    ]
    for i, p in enumerate(candidates):
        content.append({"type": "text", "text": f"Candidate {i}:"})
        content.append({"type": "image_url", "image_url": {"url": _data_uri(p), "detail": "low"}})

    content[0]["text"] += ETHOS
    parts = []
    for item in content:
        if item.get("type") == "text":
            parts.append({"text": item["text"]})
        else:
            b64 = item["image_url"]["url"].split(",", 1)[1]
            parts.append({"inline_data": {"mime_type": "image/jpeg", "data": b64}})
    url = (f"https://{VERTEX_REGION}-aiplatform.googleapis.com/v1/projects/{proj}"
           f"/locations/{VERTEX_REGION}/publishers/google/models/gemini-2.5-flash:generateContent")
    import time
    try:
        hdrs = {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}
        body = {"contents": [{"role": "user", "parts": parts}],
                "generationConfig": {"temperature": 0, "maxOutputTokens": 64,
                                     "thinkingConfig": {"thinkingBudget": 0}}}
        r = None
        for attempt in range(6):
            r = requests.post(url, headers=hdrs, json=body, timeout=120)
            if r.status_code == 429:
                wait = 20 + attempt * 12
                print(f"   [vision-pick-429] {word!r}: wait {wait}s ({attempt+1}/6)")
                time.sleep(wait)
                continue
            break
        if r is None or r.status_code != 200:
            print(f"   [vision-pick-http {getattr(r,'status_code','?')}] {word!r}: {(r.text[:120] if r is not None else '')}")
            return candidates[0], 0
        reply = ""
        for c in r.json().get("candidates", []):
            for prt in c.get("content", {}).get("parts", []):
                reply += prt.get("text", "")
        reply = reply.strip()
        m = re.search(r"(\d+)\s*,\s*(\d+)", reply)
        if m:
            idx, score = int(m.group(1)), int(m.group(2))
            if 0 <= idx < len(candidates):
                print(f"   [vision-pick] {word!r} -> candidate {idx} (score {score}/10)")
                return candidates[idx], score
        m = re.search(r"\d+", reply)
        if m:
            idx = int(m.group())
            if 0 <= idx < len(candidates):
                print(f"   [vision-pick] {word!r} -> candidate {idx} (no score)")
                return candidates[idx], 5
        print(f"   [vision-pick-noparse] {word!r}: reply={reply!r}")
    except Exception as e:
        print(f"   [vision-pick-error] {word!r}: {e}")
    return candidates[0], 0


def fetch_photo_pexels(
    word: str,
    query: str,
    repick: bool = False,
) -> tuple[Path | None, int]:
    """Fetch Pexels candidates + AI vision pick.

    Returns (path, confidence). Confidence is the picker's score for the
    chosen candidate (0-10); used by hybrid mode to decide on Gemini
    fallback. When a cached pick is reused, confidence is unknown (returned
    as 5) — re-run with repick=True to re-score.

    Wikipedia was previously included as a candidate but its lead images
    are encyclopaedic (e.g. monochrome solar disk for "sun") — bad fit for
    a children's picture book. Pexels-only with a strict child-friendly
    vision prompt produces better results.
    """
    picked_flat = _picked_path(word, query)
    if not repick and picked_flat.exists() and picked_flat.stat().st_size > 0:
        return picked_flat, 5  # cached — score unknown

    candidates = fetch_pexels_candidates(word, query, k=10)
    if not candidates:
        return None, 0
    chosen, score = pick_best_candidate(word, candidates)
    if chosen and chosen.exists():
        picked_flat.write_bytes(chosen.read_bytes())
        return picked_flat, score
    return None, 0


# ─── Hybrid policy: words that MUST use real photos ─────────────
#
# Living things (animals, insects, plants, humans) — AI generation is
# blocked because user preference is to use real photos for anything alive.
# Gemini may be used as a fallback ONLY for non-living subjects (objects,
# food, weather, abstract concepts) where Pexels returns poor candidates.
LIVING_WORDS = {
    # Animals (mammals)
    "alligator", "bear", "camel", "cat", "chicken", "chimpanzee", "cow",
    "dog", "dolphin", "elephant", "fox", "frog", "giraffe", "goat", "hare",
    "hedgehog", "horse", "iguana", "kangaroo", "koala", "lamb", "lion",
    "monkey", "mouse", "mule", "ostrich", "owl", "parrot", "penguin",
    "quail", "rabbit", "seal", "shark", "sheep", "snake", "snail", "tiger",
    "toad", "turtle", "unicorn", "whale", "zebra", "eagle", "crow", "duck",
    "octopus", "bird", "fish", "butterfly", "bee", "ant", "insect",
    "dinosaur",
    # People / professions
    "astronaut", "boy", "king", "queen", "knight", "nurse", "thief",
    # Plants / nature
    "apple", "banana", "carrot", "cherry", "corn", "flower", "grape",
    "lemon", "leaf", "mushroom", "onion", "orange", "peach", "pine",
    "pumpkin", "rose", "tree", "bamboo",
}


# ─── Gemini image gen ────────────────────────────────────────────
GEMINI_CACHE = OUTPUT_DIR / "_gemini_cache"
GEMINI_CACHE.mkdir(parents=True, exist_ok=True)

GEMINI_STYLE_SUFFIX = (
    " REAL PHOTOGRAPH ONLY — DSLR camera, 50mm lens, photorealistic, "
    "indistinguishable from a professional stock photo. "
    "Bright natural daylight, sharp focus, vivid saturated colours, clean "
    "uncluttered background, single subject centred and filling the frame. "
    "NOT a cartoon. NOT an illustration. NOT a drawing. NOT 3D-rendered. "
    "NOT a toy or plush version of the subject. NOT stylised. "
    "No text, no logos, no watermarks, no people unless the subject IS a "
    "person, no other objects competing for attention. Portrait orientation, "
    "3:4 aspect ratio."
)


def _gemini_prompt(word: str, query_hint: str | None) -> str:
    """Build the photoreal prompt for one word."""
    seed = (query_hint or word).strip()
    return f"A single {seed}.{GEMINI_STYLE_SUFFIX}"


def fetch_photo_gemini(word: str, query: str, repick: bool = False) -> Path | None:
    """Generate (or load cached) photorealistic image for `word` via Gemini.

    Cache key uses word + query so changing the query forces a re-gen.
    Returns a JPEG path (PNG converted to JPEG to keep PDF size sane).
    """
    safe = re.sub(r"[^a-z0-9]+", "_", f"{word}__{query}".lower()).strip("_")
    out = GEMINI_CACHE / f"{safe}.jpg"
    if not repick and out.exists() and out.stat().st_size > 0:
        return out

    api_key = os.environ.get("GOOGLE_GEMINI_API_KEY", "").strip()
    if not api_key:
        print(f"   [gemini-error] GOOGLE_GEMINI_API_KEY not set")
        return None

    import base64 as _b64
    import requests

    prompt = _gemini_prompt(word, query)
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.5-flash-image:generateContent?key={api_key}"
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }

    for attempt in range(3):
        try:
            r = requests.post(url, json=payload, timeout=120)
            if r.status_code == 429:
                wait = 5 * (2 ** attempt)
                print(f"   [gemini-rate] sleeping {wait}s")
                time.sleep(wait)
                continue
            if r.status_code != 200:
                print(f"   [gemini-http {r.status_code}] {word!r}: {r.text[:200]}")
                return None
            parts = (r.json().get("candidates") or [{}])[0].get("content", {}).get("parts", [])
            for part in parts:
                if "inlineData" in part:
                    raw = _b64.b64decode(part["inlineData"]["data"])
                    # Convert PNG -> JPEG for smaller PDFs
                    try:
                        from PIL import Image
                        from io import BytesIO
                        img = Image.open(BytesIO(raw)).convert("RGB")
                        img.save(out, format="JPEG", quality=88, optimize=True)
                    except Exception:
                        out.write_bytes(raw)
                    print(f"   [gemini-ok] {word!r} ({out.stat().st_size // 1024} KB)")
                    return out
            print(f"   [gemini-noimage] {word!r}")
            return None
        except Exception as e:
            print(f"   [gemini-error] {word!r}: {e}")
            time.sleep(3)
    return None


# ─── Cover centre letter tiles (Gemini via Vertex AI) ───────────
LETTER_CACHE = OUTPUT_DIR / "_letter_cache"
LETTER_CACHE.mkdir(parents=True, exist_ok=True)

# The standalone Gemini API key is billing-depleted, so letter tiles go through
# Vertex AI using the gcloud user's OAuth token (scope cloud-platform). Token is
# cached for the process lifetime (gcloud tokens last ~1 hour).
VERTEX_REGION = "us-central1"
VERTEX_IMAGE_MODEL = "gemini-2.5-flash-image"
_vertex_auth: dict[str, str] = {}


def _vertex_token_and_project() -> tuple[str | None, str | None]:
    if _vertex_auth.get("token") and _vertex_auth.get("project"):
        return _vertex_auth["token"], _vertex_auth["project"]
    import subprocess
    try:
        tok = subprocess.run(["gcloud", "auth", "print-access-token"],
                             capture_output=True, text=True, shell=True).stdout.strip()
        proj = subprocess.run(["gcloud", "config", "get-value", "project"],
                              capture_output=True, text=True, shell=True).stdout.strip()
        if tok and proj:
            _vertex_auth["token"], _vertex_auth["project"] = tok, proj
            return tok, proj
    except Exception as e:
        print(f"   [vertex-auth-error] {e}")
    return None, None


ANDIKA_BOLD = BASE_DIR / "assets" / "fonts" / "Andika-Bold.ttf"


def fetch_letter_tile(grapheme: str, colour: str, repick: bool = False) -> Path | None:
    """Render the centre-cell tile: the focus grapheme as a white letterform on
    the level colour, using the actual Andika teaching font (single-storey a/g).

    Rendered with PIL — NOT AI-generated — so the letterform is exactly the font
    children are taught with. Cached per (grapheme, colour).
    """
    safe = re.sub(r"[^a-z0-9]+", "_", f"{grapheme}__{colour}".lower()).strip("_")
    out = LETTER_CACHE / f"{safe}.jpg"
    if not repick and out.exists() and out.stat().st_size > 0:
        return out

    from PIL import Image, ImageDraw, ImageFont

    S = 600  # square tile, supersampled for crisp edges
    img = Image.new("RGB", (S, S), colour)
    draw = ImageDraw.Draw(img)

    # Fit the glyph(s) to ~68% of the tile (width and height).
    target = int(S * 0.68)
    size = S
    font = ImageFont.truetype(str(ANDIKA_BOLD), size)
    while size > 10:
        font = ImageFont.truetype(str(ANDIKA_BOLD), size)
        l, t, r, b = draw.textbbox((0, 0), grapheme, font=font)
        if (r - l) <= target and (b - t) <= target:
            break
        size -= 6

    l, t, r, b = draw.textbbox((0, 0), grapheme, font=font)
    x = (S - (r - l)) / 2 - l
    y = (S - (b - t)) / 2 - t
    draw.text((x, y), grapheme, font=font, fill=_on_color(colour))

    img.save(out, format="JPEG", quality=92, optimize=True)
    print(f"   [letter-andika] {grapheme!r}")
    return out


def get_letter_tile_uri(grapheme: str, colour: str, repick: bool = False) -> str | None:
    path = fetch_letter_tile(grapheme, colour, repick=repick)
    if path and path.exists():
        return image_to_data_uri(path)
    return None


# ─── Page 2 "All about" mouth/articulation images ───────────────
MOUTH_CACHE = OUTPUT_DIR / "_mouth_cache"
MOUTH_CACHE.mkdir(parents=True, exist_ok=True)


def get_mouth_uri(grapheme: str) -> str | None:
    """Return a data URI for the cached mouth/articulation image for this
    sound, or None if one hasn't been generated yet. Generated separately
    (Vertex) and dropped into _mouth_cache/{grapheme}.jpg.
    """
    safe = re.sub(r"[^a-z0-9]+", "_", grapheme.lower()).strip("_") or "x"
    path = MOUTH_CACHE / f"{safe}.jpg"
    if path.exists() and path.stat().st_size > 0:
        return image_to_data_uri(path)
    return None


# ─── Articulation map (page 2 mouth cutaway) ────────────────────
# Each phoneme is placed at its place of articulation as a (left%, top%)
# position over the shared cutaway image (_base_cutaway.jpg), plus a
# child-friendly cue. Percentages tuned to that illustration.
ARTIC_ZONES: dict[str, tuple[float, float, str]] = {
    "bilabial":     (27, 52, "Your lips press together."),
    "labiodental":  (30, 48, "Your top teeth touch your bottom lip."),
    "dental":       (33, 56, "Your tongue peeps between your teeth."),
    "alveolar":     (41, 45, "Your tongue taps behind your top teeth."),
    "postalveolar": (49, 44, "Your tongue lifts to the bumpy ridge."),
    "palatal":      (55, 46, "Your tongue rises to the roof."),
    "velar":        (62, 51, "The back of your tongue lifts up."),
    "glottal":      (67, 57, "A little puff comes from your throat."),
    "vowel":        (46, 55, "Your mouth opens and the sound flows out."),
}

ZONE_BY_GRAPHEME: dict[str, str] = {
    "p": "bilabial", "b": "bilabial", "m": "bilabial", "w": "bilabial",
    "wh": "bilabial", "mb": "bilabial",
    "f": "labiodental", "v": "labiodental", "ph": "labiodental", "ff": "labiodental",
    "th": "dental",
    "t": "alveolar", "d": "alveolar", "n": "alveolar", "s": "alveolar",
    "z": "alveolar", "l": "alveolar", "ss": "alveolar", "zz": "alveolar",
    "ll": "alveolar", "kn": "alveolar", "gn": "alveolar",
    "ous": "alveolar", "able": "alveolar", "ible": "alveolar",
    "sh": "postalveolar", "ch": "postalveolar", "j": "postalveolar",
    "r": "postalveolar", "wr": "postalveolar", "dge": "postalveolar",
    "ge": "postalveolar", "tion": "postalveolar", "cious": "postalveolar",
    "tious": "postalveolar",
    "y": "palatal",
    "k": "velar", "c": "velar", "g": "velar", "ng": "velar", "nk": "velar",
    "ck": "velar", "qu": "velar", "x": "velar",
    "h": "glottal",
}


def artic_for(grapheme: str) -> dict:
    """Map a grapheme to its articulation marker position + cue. Vowels and
    vowel digraphs/split digraphs default to the open-mouth cavity."""
    key = grapheme.lower().replace("-", "")
    zone = ZONE_BY_GRAPHEME.get(key, "vowel")
    left, top, cue = ARTIC_ZONES[zone]
    return {"left": left, "top": top, "cue": cue, "zone": zone}


# Shared cutaway base illustration (one friendly child-head profile reused for
# every sound; the level-coloured marker is overlaid at the articulation point).
def get_cutaway_uri() -> str | None:
    path = MOUTH_CACHE / "_base_cutaway.jpg"
    if path.exists() and path.stat().st_size > 0:
        return image_to_data_uri(path)
    return None


# ─── Page 2 "Sound Facts" ───────────────────────────────────────
# Word endings — abstract suffix patterns that aren't cleanly vowel/consonant.
SUFFIX_ENDINGS = {"ous", "cious", "tious", "able", "ible", "tion"}

# Sounds with a clear positional tendency (tag, example word). Default = anywhere.
POSITION_BY_GRAPHEME: dict[str, tuple[str, str]] = {
    "qu": ("start", "queen"), "wh": ("start", "wheel"),
    "wr": ("start", "write"), "kn": ("start", "knee"),
    "ng": ("end", "ring"), "nk": ("end", "pink"), "ck": ("end", "duck"),
    "ff": ("end", "cliff"), "ll": ("end", "bell"), "ss": ("end", "grass"),
    "zz": ("end", "buzz"), "dge": ("end", "bridge"), "ge": ("end", "cage"),
    "mb": ("end", "lamb"), "gn": ("end", "sign"), "tion": ("end", "station"),
    "cious": ("end", "delicious"), "tious": ("end", "nutritious"),
    "ous": ("end", "famous"), "able": ("end", "table"), "ible": ("end", "visible"),
}


def sound_facts(grapheme: str) -> dict:
    """Build the adaptive fact list for page 2. Returns is_single + a list of
    (tag, text) facts: letter-type, vowel/consonant, and typical position."""
    key = grapheme.lower()
    is_single = len(grapheme) == 1
    is_split = "-" in grapheme
    n = len(grapheme.replace("-", ""))

    if is_split:
        type_tag, type_text = "Split digraph", "a vowel split by another letter (a–e)."
    elif n == 1:
        type_tag, type_text = "Single letter", "one letter making one sound."
    elif n == 2:
        type_tag, type_text = "Digraph", "two letters that make one sound."
    elif n == 3:
        type_tag, type_text = "Trigraph", "three letters that make one sound."
    else:
        type_tag, type_text = f"{n} letters", "several letters making one sound."

    if artic_for(grapheme)["zone"] == "vowel":
        cat_tag, cat_text = "Vowel sound", "open your mouth and let it flow."
    else:
        cat_tag, cat_text = "Consonant sound", "shape it with your lips, teeth or tongue."

    pos, example = POSITION_BY_GRAPHEME.get(key, ("anywhere", ""))
    if pos == "start":
        pos_tag, pos_text = "At the start", f"often begins a word, like “{example}”."
    elif pos == "end":
        pos_tag, pos_text = "At the end", f"often ends a word, like “{example}”."
    else:
        pos_tag, pos_text = "Anywhere", "can appear anywhere in a word."

    if key in SUFFIX_ENDINGS:
        # A suffix IS a word ending — "Trigraph + Word ending" was redundant, so
        # collapse to one Suffix fact plus its position.
        facts = [
            {"tag": "Suffix", "text": f"a word ending made of {n} letters."},
            {"tag": pos_tag, "text": pos_text},
        ]
    else:
        facts = [
            {"tag": type_tag, "text": type_text},
            {"tag": cat_tag, "text": cat_text},
            {"tag": pos_tag, "text": pos_text},
        ]

    return {"is_single": is_single, "facts": facts}


def fetch_photo_unsplash(word: str, query: str) -> Path | None:
    key = os.environ.get("UNSPLASH_ACCESS_KEY", "").strip()
    if not key:
        return None

    cache = _picked_path(word, query + "__unsplash")
    if cache.exists() and cache.stat().st_size > 0:
        return cache

    if not key:
        return None

    import requests

    try:
        r = requests.get(
            "https://api.unsplash.com/search/photos",
            params={"query": query, "per_page": 1, "orientation": "portrait"},
            headers={"Authorization": f"Client-ID {key}"},
            timeout=20,
        )
        r.raise_for_status()
        results = r.json().get("results") or []
        if not results:
            return None
        img_url = (
            results[0]["urls"].get("regular")
            or results[0]["urls"].get("small")
        )
        if not img_url:
            return None
        img_r = requests.get(img_url, timeout=30)
        img_r.raise_for_status()
        cache.write_bytes(img_r.content)
        return cache
    except Exception as e:
        print(f"   [unsplash-error] {word!r} ({query!r}): {e}")
        return None


HYBRID_FALLBACK_THRESHOLD = 7  # Pexels score below this → try Gemini (non-living only)


def get_photo_uri(
    word: str,
    query_hint: str | None,
    skip: bool,
    repick: bool = False,
    engine: str = "pexels",
) -> str | None:
    """Return a base64 data URI for the word's photo, or None.

    engine="pexels"  -> Pexels candidates + AI vision pick (with Unsplash fallback)
    engine="gemini"  -> Gemini 2.5 Flash Image photorealistic gen
    engine="hybrid"  -> Pexels first; if word isn't a living thing AND the
                       picker scores the best Pexels pick below
                       HYBRID_FALLBACK_THRESHOLD, regenerate via Gemini.
                       Living things (animals, people, plants) always use
                       Pexels — per user preference, AI gen is blocked for
                       anything alive.
    """
    if skip:
        return None
    query = (query_hint or QUERY_OVERRIDES.get(word.lower()) or word).strip()

    if engine == "gemini":
        path = fetch_photo_gemini(word, query, repick=repick)
    elif engine == "hybrid":
        path, score = fetch_photo_pexels(word, query, repick=repick)
        is_living = word.lower() in LIVING_WORDS
        if path is None or (score < HYBRID_FALLBACK_THRESHOLD and not is_living):
            if is_living:
                print(f"   [hybrid] {word!r} low Pexels score ({score}) but is "
                      f"living — keeping Pexels pick")
            else:
                print(f"   [hybrid] {word!r} Pexels score {score} < "
                      f"{HYBRID_FALLBACK_THRESHOLD} — using Gemini")
                gemini_path = fetch_photo_gemini(word, query, repick=repick)
                if gemini_path:
                    path = gemini_path
        path = path or fetch_photo_unsplash(word, query)
    else:  # pexels (default)
        path, _ = fetch_photo_pexels(word, query, repick=repick)
        path = path or fetch_photo_unsplash(word, query)

    if path and path.exists():
        return image_to_data_uri(path)
    return None


# ─── Build a single book ─────────────────────────────────────────
def _on_color(hex_colour: str) -> str:
    """Pick a readable text colour (near-black or white) to sit ON the given
    level colour. Light levels (e.g. amber) get dark text — white-on-amber
    reads badly."""
    h = hex_colour.lstrip("#")
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    yiq = (r * 299 + g * 587 + b * 114) / 1000
    return "#1a1a2e" if yiq >= 150 else "#ffffff"


def build_book_data(
    entry: dict,
    skip_photos: bool = False,
    repick: bool = False,
    engine: str = "pexels",
) -> dict:
    level = entry["level"]
    colour = LEVEL_COLOURS[level]
    level_name = f"L{level} — {LEVEL_NAMES[level]}"

    enriched_sounds: list[dict] = []
    for sound in entry["sounds"]:
        focus = sound["grapheme"]
        words_out = []
        for w in sound["words"]:
            if isinstance(w, dict):
                word_str = w["word"]
                query_hint = w.get("query")
            else:
                word_str = w
                query_hint = None
            photo_uri = get_photo_uri(word_str, query_hint, skip_photos, repick=repick, engine=engine)
            words_out.append({
                "word": word_str,
                "word_html": derive_word_html(word_str, focus, colour),
                "sound_buttons": derive_sound_buttons(word_str, focus),
                "photo": photo_uri,
            })
        enriched_sounds.append({
            "grapheme": focus,
            "capital": focus[0].upper() + focus[1:] if focus else focus,
            "facts": sound_facts(focus),
            "instruction": sound.get("instruction") or "Say the sound. Can you think of a word with this sound?",
            "words": words_out,
        })

    # Total page count (cover + per-sound[sound page + word pages] + read-all + back)
    total_words = sum(len(s["words"]) for s in enriched_sounds)
    page_count = 1 + len(enriched_sounds) + total_words + 1 + 1

    # ── Cover 3x3 grid tiles ──
    # Centre cell holds the grapheme(s); the 8 surrounding cells show the
    # book's own word photos. Single-sound books carry only 6 photos, so we top
    # up with decorative cover-only extras for that sound (see COVER_EXTRA_WORDS);
    # any still-spare cells become on-brand accent tiles on a balanced diagonal.
    # Combined-sound books (12/18 photos) already fill all 8.
    extra_photos: list[str] = []
    cover_centre_img: str | None = None
    if len(enriched_sounds) == 1 and not skip_photos:
        focus = enriched_sounds[0]["grapheme"]
        # AI-generated centre letter tile (skip split digraphs like "a-e").
        if "-" not in focus:
            cover_centre_img = get_letter_tile_uri(focus, colour, repick=repick)
        # Top up the grid to 8 cells. Fetch only as many extras as needed.
        book_id = f"L{level}.{entry['sub_level']}"
        have = sum(1 for s in enriched_sounds for w in s["words"] if w.get("photo"))
        need = max(0, 8 - have)
        for extra_word in COVER_EXTRA_WORDS.get(book_id, []):
            if len(extra_photos) >= need:
                break
            uri = get_photo_uri(extra_word, None, skip_photos, repick=repick, engine=engine)
            if uri:
                extra_photos.append(uri)
    cover_tiles = _build_cover_tiles(enriched_sounds, extra_photos)

    return {
        "book_type": "sound_book",
        "level": level,
        "sub_level": entry["sub_level"],
        "book_number": entry["book_number"],
        "book_title": entry["title"],
        "level_colour": colour,
        "level_on_color": _on_color(colour),
        "level_name": level_name,
        "page_count": page_count,
        "comparison_sounds": entry.get("comparison_sounds", []),
        "sounds": enriched_sounds,
        "cover_tiles": cover_tiles,
        "cover_centre_img": cover_centre_img,
        # No personalisation by default
        "child_name": None,
    }


# The 8 surround cells in reading order (centre is rendered separately):
#   0(TL) 1(TM) 2(TR)
#   3(ML)  ··   4(MR)
#   5(BL) 6(BM) 7(BR)
# When fewer than 8 photos exist, accent tiles fill the corners first
# (TL, BR, TR, BL) so the spares sit on a balanced diagonal.
_ACCENT_PRIORITY = [0, 7, 2, 5, 1, 6, 3, 4]


# Extra image-able words used ONLY to top up the cover grid to 8 cells on
# single-sound books (which carry just 6 word photos). These never appear on an
# inside page — they are decorative cover fill, so they don't have to be
# decodable, just strongly photographable AND containing the target sound, and
# NOT already in that book's six word pages. Keyed by book id ("L{level}.{sub}")
# so the two "oo" books (long vs short) get the right words. Ordered best-first;
# only as many as needed (usually 2) are fetched. A few abstract suffix sounds
# (-ous/-cious/-tious/-ible) have no concrete image-able words, so those keep
# their accent tiles.
COVER_EXTRA_WORDS: dict[str, list[str]] = {
    "L1.1": ["seal", "snail", "scissors"],
    "L1.2": ["avocado", "acorn", "arrow"],
    "L1.3": ["tomato", "tractor", "telephone"],
    "L1.4": ["panda", "pineapple", "parachute"],
    "L1.5": ["ink", "inchworm", "inkpot"],
    "L1.6": ["nut", "needle", "nail"],
    "L1.7": ["mug", "map", "magnet"],
    "L1.8": ["doll", "donut", "diamond"],
    "L1.9": ["gift", "gorilla", "glasses"],
    "L1.10": ["olive", "otter", "ox"],
    "L2.1": ["cake", "cup", "crab"],
    "L2.2": ["ketchup", "kiwi", "kayak"],
    "L2.3": ["truck", "brick", "chick"],
    "L2.4": ["elbow", "elf", "eggplant"],
    "L2.5": ["umpire", "umbrellabird"],
    "L2.6": ["ring", "rope", "rug"],
    "L2.7": ["hand", "honey", "hippo"],
    "L2.8": ["bus", "bell", "bicycle"],
    "L2.9": ["fox", "fan", "fork"],
    "L2.10": ["leg", "lock", "log"],
    "L2.13": ["jar", "jam", "jug"],
    "L3.1": ["shrimp", "shed", "brush"],
    "L3.2": ["skunk", "blanket", "ankle"],
    "L3.3": ["cheetah", "church", "peach"],
    "L3.4": ["thimble", "moth", "bath"],
    "L3.5": ["finger", "fang", "gong"],
    "L3.6": ["squirrel", "squid", "square"],
    "L4.1": ["crayon", "spray", "subway"],
    "L4.2": ["queen", "green", "knee"],
    "L4.3": ["knight", "lightning", "highway"],
    "L4.4": ["rainbow", "pillow", "elbow"],
    "L4.5": ["igloo", "boot", "broom"],
    "L4.6": ["cookie", "hood", "brook"],
    "L4.7": ["arm", "barn", "scarf"],
    "L4.8": ["horn", "fort", "thorn"],
    "L4.9": ["airplane", "eclair", "staircase"],
    "L4.10": ["girl", "circle", "squirrel"],
    "L4.11": ["mountain", "fountain", "scout"],
    "L4.12": ["oyster", "cowboy", "joystick"],
    "L5.1": ["whale", "flame", "skateboard"],
    "L5.2": ["knife", "dice", "vine"],
    "L5.3": ["phone", "cone", "dome"],
    "L5.4": ["costume", "perfume"],
    "L5.5": ["peanut", "teapot", "seahorse"],
    "L5.6": ["cookie", "genie", "zombie"],
    "L5.7": ["oil", "toilet", "coil"],
    "L5.8": ["strawberry", "hawk", "prawn"],
    "L5.9": ["sailboat", "braid", "nail"],
    "L5.10": ["soap", "toast", "coach"],
    "L6.1": ["turtle", "hamburger", "curtain"],
    "L6.2": ["ladder", "finger", "sticker"],
    "L6.3": ["square", "mare", "hardware"],
    "L6.4": ["clown", "brownie", "flower"],
    "L7.1": ["campfire", "vampire", "bonfire"],
    "L7.2": ["seashore", "scoreboard"],
    "L7.3": ["earring", "beard", "spear"],
    "L7.4": ["doormat", "doorbell", "doorknob"],
    "L7.5": ["treasure", "sculpture", "furniture"],
    "L7.6": ["potion", "lotion", "dictionary"],
    # L8 books are combined (multi-sound), so they fill all 8 cells from their
    # own words and need no extras.
}


def _build_cover_tiles(
    enriched_sounds: list[dict],
    extra_photos: list[str] | None = None,
) -> list[dict]:
    """Return exactly 8 tile dicts for the cover surround.

    Each tile is either {"photo": <data-uri>} or {"accent": True}. Photos are
    gathered round-robin across the book's sounds (so combined books show a
    spread of both sounds), then topped up with `extra_photos` (decorative
    cover-only images), capped at 8. Any still-empty cells fall back to accent
    tiles at balanced corner positions.
    """
    # Round-robin across sounds for variety on combined books.
    per_sound = [[w["photo"] for w in s["words"] if w.get("photo")]
                 for s in enriched_sounds]
    photos: list[str] = []
    i = 0
    while len(photos) < 8 and any(i < len(p) for p in per_sound):
        for p in per_sound:
            if i < len(p):
                photos.append(p[i])
                if len(photos) >= 8:
                    break
        i += 1

    # Top up short books with decorative extras before falling back to accents.
    for extra in (extra_photos or []):
        if len(photos) >= 8:
            break
        if extra and extra not in photos:
            photos.append(extra)

    # Drop any accidental duplicate photos (e.g. an extra word that resolved to
    # a photo already shown) so the grid never repeats the same image.
    photos = list(dict.fromkeys(photos))

    tiles: list[dict | None] = [None] * 8
    # Accent positions are the surround slots NOT taken by photos.
    n_accent = max(0, 8 - len(photos))
    accent_slots = set(_ACCENT_PRIORITY[:n_accent])
    pi = 0
    for slot in range(8):
        if slot in accent_slots:
            tiles[slot] = {"accent": True}
        elif pi < len(photos):
            tiles[slot] = {"photo": photos[pi]}
            pi += 1
        else:
            tiles[slot] = {"accent": True}
    return tiles  # type: ignore[return-value]


def book_filename(entry: dict) -> Path:
    level = entry["level"]
    sub = entry["sub_level"]
    title = entry["title"]
    # Clean a slug from the title sound part
    after_colon = title.split(":", 1)[1].strip() if ":" in title else title
    slug = re.sub(r"[^a-zA-Z0-9]+", "_", after_colon).strip("_").lower() or "book"
    folder = OUTPUT_DIR / f"L{level}"
    folder.mkdir(parents=True, exist_ok=True)
    return folder / f"L{level}_{sub:02d}_{slug}.pdf"


async def generate_one(
    entry: dict,
    skip_photos: bool = False,
    repick: bool = False,
    engine: str = "pexels",
) -> Path:
    print(f"[build] {entry['title']}  (L{entry['level']}, sub {entry['sub_level']})  engine={engine}")
    data = build_book_data(entry, skip_photos=skip_photos, repick=repick, engine=engine)
    html = render_book_html(data)
    out = book_filename(entry)
    # Optional: also save the HTML next to the PDF for debugging
    html_path = out.with_suffix(".html")
    html_path.write_text(html, encoding="utf-8")
    await html_to_pdf(html, out)
    print(f"   [ok] wrote {out.relative_to(BASE_DIR)}  ({out.stat().st_size // 1024} KB)")
    return out


# ─── CLI ─────────────────────────────────────────────────────────
def _select_inventory(args) -> list[dict]:
    if args.book:
        # Format: L{level}.{sub}
        m = re.fullmatch(r"L?(\d+)\.(\d+)", args.book, flags=re.IGNORECASE)
        if not m:
            raise SystemExit(f"--book must look like L3.1 (got {args.book!r})")
        lv, sub = int(m.group(1)), int(m.group(2))
        return [b for b in INVENTORY if b["level"] == lv and b["sub_level"] == sub]
    if args.level:
        return [b for b in INVENTORY if b["level"] == args.level]
    if args.sample:
        # First two books from each level
        out: list[dict] = []
        by_level: dict[int, list[dict]] = {}
        for b in INVENTORY:
            by_level.setdefault(b["level"], []).append(b)
        for lv in sorted(by_level):
            out.extend(by_level[lv][:1 if lv in (1, 2) else 1])  # 1 per level keeps it tractable
        return out
    return list(INVENTORY)


async def main_async(args):
    selected = _select_inventory(args)
    if not selected:
        print("No books matched selection.")
        return

    print(f"Selected {len(selected)} book(s).")
    for entry in selected:
        try:
            await generate_one(entry, skip_photos=args.skip_photos, repick=args.repick, engine=args.engine)
        except Exception as e:
            print(f"   [FAIL] {entry['title']}: {e}")
            if args.fail_fast:
                raise


def main():
    p = argparse.ArgumentParser(description="Generate MyPhonicsBooks Sound Books.")
    p.add_argument("--level", type=int, help="Only build books from this level (1-8)")
    p.add_argument("--book", type=str, help="Build a single book by ID, e.g. L3.1")
    p.add_argument("--sample", action="store_true",
                   help="Build one book per level (8 books) to verify pipeline")
    p.add_argument("--skip-photos", action="store_true",
                   help="Skip Pexels/Unsplash; render with placeholder boxes")
    p.add_argument("--repick", action="store_true",
                   help="Re-run vision picker against cached candidates (overrides "
                        "the flat picked-photo cache; doesn't re-hit Pexels)")
    p.add_argument("--engine", choices=["pexels", "gemini", "hybrid"], default="pexels",
                   help="Image source: pexels (real photos + AI pick), "
                        "gemini (AI-generated photoreal), or hybrid (Pexels "
                        "first, Gemini fallback for non-living words when "
                        "Pexels score is low). Default: pexels")
    p.add_argument("--fail-fast", action="store_true",
                   help="Stop on the first failure (default: continue)")
    args = p.parse_args()
    asyncio.run(main_async(args))


if __name__ == "__main__":
    main()
