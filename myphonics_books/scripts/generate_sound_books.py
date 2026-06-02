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

    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key or api_key.startswith("your_"):
        return candidates[0]

    try:
        from openai import OpenAI
    except Exception:
        return candidates[0]

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

    try:
        client = OpenAI()
        resp = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": content}],
            temperature=0,
            max_tokens=20,
        )
        reply = (resp.choices[0].message.content or "").strip()
        m = re.search(r"(\d+)\s*,\s*(\d+)", reply)
        if m:
            idx, score = int(m.group(1)), int(m.group(2))
            if 0 <= idx < len(candidates):
                print(f"   [vision-pick] {word!r} -> candidate {idx} (score {score}/10)")
                return candidates[idx], score
        # Single-number fallback (idx only) — score unknown, assume 5
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


def fetch_photo_unsplash(word: str, query: str) -> Path | None:
    cache = _cache_path(word, query + "__unsplash")
    if cache.exists() and cache.stat().st_size > 0:
        return cache

    key = os.environ.get("UNSPLASH_ACCESS_KEY", "").strip()
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
            "instruction": sound.get("instruction") or "Say the sound. Can you think of a word with this sound?",
            "words": words_out,
        })

    # Total page count (cover + per-sound[sound page + word pages] + read-all + back)
    total_words = sum(len(s["words"]) for s in enriched_sounds)
    page_count = 1 + len(enriched_sounds) + total_words + 1 + 1

    return {
        "book_type": "sound_book",
        "level": level,
        "sub_level": entry["sub_level"],
        "book_number": entry["book_number"],
        "book_title": entry["title"],
        "level_colour": colour,
        "level_name": level_name,
        "page_count": page_count,
        "comparison_sounds": entry.get("comparison_sounds", []),
        "sounds": enriched_sounds,
        # No personalisation by default
        "child_name": None,
    }


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
