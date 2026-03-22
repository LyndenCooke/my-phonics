"""
Download Spotlight Photos from Unsplash
========================================
Pre-downloads and caches real-life photos for Sound Spotlight pages.
Uses the Unsplash API to search for child-friendly, clear photos.

Usage:
    py -3.12 scripts/download_spotlight_photos.py              # Download all missing
    py -3.12 scripts/download_spotlight_photos.py sh nk ay      # Download specific graphemes
    py -3.12 scripts/download_spotlight_photos.py --check       # Report missing photos
    py -3.12 scripts/download_spotlight_photos.py --stats       # Show download stats

Requires: UNSPLASH_ACCESS_KEY in .env file
"""

import json
import os
import sys
import time
import urllib.request
import urllib.parse
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_DIR / "data"
PHOTOS_DIR = PROJECT_DIR / "assets" / "photos"

# Load .env manually (avoid dependency on python-dotenv)
ENV_FILE = PROJECT_DIR / ".env"
if ENV_FILE.exists():
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))

UNSPLASH_ACCESS_KEY = os.environ.get("UNSPLASH_ACCESS_KEY", "")
UNSPLASH_API = "https://api.unsplash.com"

# Photo size: 400x400 is good for A5 quadrant at 300dpi
PHOTO_SIZE = "small"  # Unsplash 'small' is 400px wide


def load_spotlight_words():
    """Load the spotlight words JSON."""
    with open(DATA_DIR / "spotlight_words.json") as f:
        data = json.load(f)
    # Remove metadata keys
    return {k: v for k, v in data.items() if not k.startswith("_")}


def get_photo_path(grapheme, word):
    """Return the expected photo file path."""
    # Sanitise grapheme for directory name (a-e → a_e)
    safe_grapheme = grapheme.replace("-", "_")
    return PHOTOS_DIR / safe_grapheme / f"{word}.jpg"


def search_unsplash(query, per_page=3):
    """Search Unsplash for photos matching the query."""
    if not UNSPLASH_ACCESS_KEY:
        print("  ERROR: UNSPLASH_ACCESS_KEY not set in .env")
        return []

    params = urllib.parse.urlencode({
        "query": query,
        "per_page": per_page,
        "orientation": "squarish",
        "content_filter": "high",  # Safe for children
    })
    url = f"{UNSPLASH_API}/search/photos?{params}"

    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Client-ID {UNSPLASH_ACCESS_KEY}")
    req.add_header("Accept-Version", "v1")

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())
            return data.get("results", [])
    except Exception as e:
        print(f"  ERROR searching '{query}': {e}")
        return []


def download_photo(photo_url, save_path):
    """Download a photo to the given path."""
    save_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        urllib.request.urlretrieve(photo_url, save_path)
        return True
    except Exception as e:
        print(f"  ERROR downloading to {save_path}: {e}")
        return False


def download_grapheme_photos(grapheme, word_list):
    """Download photos for all words under a grapheme."""
    downloaded = 0
    skipped = 0
    failed = 0

    for entry in word_list:
        word = entry["word"]
        search_term = entry["search"]
        photo_path = get_photo_path(grapheme, word)

        if photo_path.exists():
            skipped += 1
            continue

        print(f"  Searching: '{search_term}' for word '{word}'...")
        results = search_unsplash(search_term)

        if not results:
            print(f"    No results for '{search_term}'")
            failed += 1
            continue

        # Pick the first result
        photo = results[0]
        photo_url = photo["urls"].get(PHOTO_SIZE, photo["urls"]["regular"])
        photo_id = photo["id"]
        photographer = photo["user"]["name"]

        print(f"    Downloading from {photographer} (id: {photo_id})...")
        if download_photo(photo_url, photo_path):
            downloaded += 1
            # Save attribution
            attr_file = photo_path.with_suffix(".attr")
            attr_file.write_text(
                f"photo_id: {photo_id}\n"
                f"photographer: {photographer}\n"
                f"url: {photo['links']['html']}\n"
                f"search: {search_term}\n"
            )
        else:
            failed += 1

        # Rate limit: Unsplash free tier = 50 req/hour
        time.sleep(1.5)

    return downloaded, skipped, failed


def check_missing():
    """Report which photos are missing."""
    data = load_spotlight_words()
    total = 0
    missing = 0
    present = 0

    print("=" * 60)
    print("SPOTLIGHT PHOTOS STATUS")
    print("=" * 60)

    for grapheme, info in sorted(data.items()):
        words = info["words"]
        total += len(words)
        grapheme_missing = []

        for entry in words:
            path = get_photo_path(grapheme, entry["word"])
            if path.exists():
                present += 1
            else:
                missing += 1
                grapheme_missing.append(entry["word"])

        if grapheme_missing:
            print(f"  {grapheme:>6}: MISSING {', '.join(grapheme_missing)}")
        else:
            print(f"  {grapheme:>6}: OK ({len(words)} photos)")

    print(f"\n  Total: {total} | Present: {present} | Missing: {missing}")
    return missing


def show_stats():
    """Show download statistics."""
    data = load_spotlight_words()
    total_words = sum(len(v["words"]) for v in data.values() if not isinstance(v, str))
    total_graphemes = len(data)

    photos_exist = 0
    for grapheme, info in data.items():
        for entry in info["words"]:
            if get_photo_path(grapheme, entry["word"]).exists():
                photos_exist += 1

    print(f"Graphemes: {total_graphemes}")
    print(f"Total words: {total_words}")
    print(f"Photos downloaded: {photos_exist}/{total_words}")
    print(f"Coverage: {photos_exist/total_words*100:.0f}%")


def generate_attribution():
    """Generate a combined attribution file."""
    attr_lines = [
        "# Unsplash Photo Attribution",
        "",
        "All photos used in Sound Spotlight pages are sourced from Unsplash",
        "and used under the Unsplash License (https://unsplash.com/license).",
        "",
    ]

    for attr_file in sorted(PHOTOS_DIR.rglob("*.attr")):
        lines = attr_file.read_text().splitlines()
        info = {}
        for line in lines:
            if ": " in line:
                k, v = line.split(": ", 1)
                info[k] = v

        word = attr_file.stem
        grapheme = attr_file.parent.name
        photographer = info.get("photographer", "Unknown")
        url = info.get("url", "")
        attr_lines.append(f"- **{grapheme}/{word}**: Photo by {photographer} ({url})")

    attr_path = PHOTOS_DIR / "ATTRIBUTION.md"
    attr_path.write_text("\n".join(attr_lines))
    print(f"Attribution file written to {attr_path}")


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    flags = [a for a in sys.argv[1:] if a.startswith("-")]

    if "--check" in flags:
        check_missing()
        return

    if "--stats" in flags:
        show_stats()
        return

    if not UNSPLASH_ACCESS_KEY:
        print("ERROR: Set UNSPLASH_ACCESS_KEY in .env file")
        print("Get a free key at https://unsplash.com/developers")
        sys.exit(1)

    data = load_spotlight_words()

    # Filter to specific graphemes if provided
    if args:
        graphemes = {g: data[g] for g in args if g in data}
        if not graphemes:
            print(f"No matching graphemes found for: {args}")
            print(f"Available: {', '.join(sorted(data.keys()))}")
            sys.exit(1)
    else:
        graphemes = data

    print("=" * 60)
    print("DOWNLOADING SPOTLIGHT PHOTOS")
    print("=" * 60)

    total_downloaded = 0
    total_skipped = 0
    total_failed = 0

    for grapheme in sorted(graphemes.keys()):
        info = graphemes[grapheme]
        print(f"\n[{grapheme}] (Level {info['decodable_at']})")
        d, s, f = download_grapheme_photos(grapheme, info["words"])
        total_downloaded += d
        total_skipped += s
        total_failed += f

    print(f"\n{'=' * 60}")
    print(f"DONE: {total_downloaded} downloaded, {total_skipped} skipped, {total_failed} failed")

    if total_downloaded > 0:
        generate_attribution()


if __name__ == "__main__":
    main()
