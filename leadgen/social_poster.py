"""Social post generator for MyPhonicsBooks.

Reads `myphonics_books/data/story_summaries.json` (the source of truth for
completed books) and generates platform-specific social content per book:

  - Instagram caption (feed post, ~120 words, hook in first 2 lines, hashtags)
  - TikTok caption (short hook, video idea, hashtags)
  - YouTube Shorts (title, description, keywords, thumbnail idea)

Output: `output/social_posts/L{level}_{sub_level}_{slug}.md` per book. You
copy/paste into the GoHighLevel Social Planner (or Buffer / Ayrshare / direct
on each platform) and attach the matching book hero image from
`myphonics_books/output/images/L{n}_{sub_level}_B1/hero.png`.

Uses direct httpx POST to OpenAI (SDK hangs in this env — see write_email_variants.py).

Run:
    py -3.12 social_poster.py                     # all completed books
    py -3.12 social_poster.py --level 1           # just L1
    py -3.12 social_poster.py --book L1.3         # one specific book
    py -3.12 social_poster.py --regenerate        # overwrite existing files
    py -3.12 social_poster.py --model gpt-5-mini  # higher quality
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")
try:
    load_dotenv(Path(__file__).parent.parent / "myphonics_books" / ".env", verbose=False)
except Exception:
    pass


STORY_SUMMARIES_PATH = (
    Path(__file__).parent.parent / "myphonics_books" / "data" / "story_summaries.json"
)


BRAND = """\
MyPhonicsBooks is a small UK-built phonics programme. Print-at-home A5
decodable readers matched to Letters and Sounds. Every book is set in a
different contemporary culture (Birmingham, Nairobi, Yokohama, Cairo). Every
word is decodable at the level or a listed tricky word. 15 books across
L1-L3, 17 more in production. Founder: Lynden Cooke.
"""

PLATFORM_BRIEFS = {
    "instagram": """\
Instagram feed post.
- Caption: 80-140 words.
- HOOK in the first line (parents/teachers scroll fast; you have 1 second).
- Voice: warm, indie maker, NOT corporate. Specific over generic.
- One soft CTA at the end (e.g. "tap the link in bio for the free Level 1
  sample").
- 10-14 hashtags. Mix: 3-4 broad (#phonics #earlyreading), 4-5 niche
  (#decodablebooks #scienceofreading), 2-3 community (#teachersofinstagram
  #homeschoolmom), 1-2 brand (#myphonicsbooks).
- 'visual' field: ONE concrete shoot/design idea suitable for a small team.
  Eg. 'Book cover flat-lay on a wooden table with a child's hand turning the
  page'.""",
    "tiktok": """\
TikTok / Reel.
- 'caption' is the on-screen text + caption combined. Max 150 chars. Hook-led.
- Voice: punchy, not polished. TikTok punishes ad-speak.
- 'video_idea' is the 15-30 second shot description. Be concrete — what's on
  screen each beat. Example beats:
    [0-2s] Hook text on screen: 'Why your child's reading book is sabotaging them'
    [2-6s] Side-by-side: generic reader vs. our decodable
    [6-15s] Page flip showing matched word
    [15-25s] Result + soft CTA
- 4-6 hashtags. Mix #phonics #earlyreading #parentingtips #teachertok
  #scienceofreading #decodable.""",
    "youtube_short": """\
YouTube Short.
- 'title': 40-60 chars, SEO-targeted (parents search 'how to teach my child
  to read').
- 'description': 60-100 words. Include the YouTube-search keywords naturally
  and link to: 'Free sample at myphonicsbooks.com'.
- 5-8 'keywords' (single-word or two-word tags).
- 'thumbnail_idea': bold high-contrast text + book cover. Describe in one
  sentence.""",
}


def slugify(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "_", s)
    return s.strip("_")[:40] or "book"


def build_system_prompt() -> str:
    return f"""\
You write social media content for MyPhonicsBooks across three platforms in
ONE response: Instagram, TikTok, and YouTube Shorts.

# Brand
{BRAND}

# Platform briefs
## Instagram
{PLATFORM_BRIEFS["instagram"]}

## TikTok
{PLATFORM_BRIEFS["tiktok"]}

## YouTube Short
{PLATFORM_BRIEFS["youtube_short"]}

# Writing rules across all platforms
- British English (colour, mum, favourite).
- ASCII only. No em-dashes. No curly quotes. Straight quotes only.
- No emojis unless they belong to a hashtag or are explicitly part of the
  on-screen text (rare).
- No vague vendor phrases ("game-changing", "level up", "elevate",
  "perfect for", "carefully crafted", "I hope this finds you").
- Lean into the SPECIFIC book provided — its culture, theme, focus sounds —
  not generic phonics talk.

# Output format
Return STRICT JSON, no surrounding text, no code fences. Exact schema:

{{
  "instagram": {{
    "caption": "<full caption text>",
    "hashtags": ["<tag>", ...],
    "visual": "<one-sentence visual idea>"
  }},
  "tiktok": {{
    "caption": "<short on-screen + caption combined, max 150 chars>",
    "hashtags": ["<tag>", ...],
    "video_idea": "<concrete beat-by-beat description>"
  }},
  "youtube_short": {{
    "title": "<40-60 char title>",
    "description": "<60-100 word description>",
    "keywords": ["<keyword>", ...],
    "thumbnail_idea": "<one-sentence thumbnail idea>"
  }}
}}
"""


def book_context(book: dict, level_info: dict) -> str:
    bits = [
        f"Book level: L{book['sub_level']} (\"{level_info['name']}\")",
        f"Title: {book['title']}",
        f"Culture / setting: {book['culture']}",
        f"Theme: {book.get('theme', '(not specified)')}",
        f"Focus sounds taught in this book: {', '.join(book['focus_sounds'])}",
        f"Level colour: {level_info.get('colour', '')}",
        f"Words per book: ~{level_info.get('words_per_book', '')}",
    ]
    return "Write social content for this book:\n\n" + "\n".join(bits)


def normalise_ascii(text: str) -> str:
    return (
        text.replace("—", "-").replace("–", "-")
            .replace("‘", "'").replace("’", "'")
            .replace("“", '"').replace("”", '"')
            .replace("…", "...")
            .replace(" ", " ")
    )


def call_openai(model: str, system: str, user: str, timeout: int = 90) -> str:
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise RuntimeError("OPENAI_API_KEY not set")
    payload: dict = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "response_format": {"type": "json_object"},
    }
    if model.startswith(("gpt-5", "o")):
        payload["max_completion_tokens"] = 2500
    else:
        payload["max_tokens"] = 2500
        payload["temperature"] = 0.85
    r = httpx.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        json=payload,
        timeout=timeout,
    )
    if r.status_code != 200:
        raise RuntimeError(f"OpenAI {r.status_code}: {r.text[:500]}")
    return r.json()["choices"][0]["message"]["content"]


def format_markdown(book: dict, content: dict) -> str:
    ig = content.get("instagram", {})
    tt = content.get("tiktok", {})
    yt = content.get("youtube_short", {})

    def fmt_tags(tags) -> str:
        if isinstance(tags, list):
            return " ".join(t if t.startswith("#") else f"#{t}" for t in tags)
        return str(tags or "")

    return f"""\
# L{book['sub_level']} - {book['title']}

**Culture:** {book['culture']}
**Focus sounds:** {", ".join(book['focus_sounds'])}
**Theme:** {book.get('theme', '')}
**Hero image:** `myphonics_books/output/images/L{book['sub_level'].replace('.','_')}_B1/hero.png`

---

## Instagram (feed post)

{ig.get('caption', '').strip()}

{fmt_tags(ig.get('hashtags'))}

**Visual idea:** {ig.get('visual', '')}

---

## TikTok / Reel

**Caption:** {tt.get('caption', '').strip()}

**Hashtags:** {fmt_tags(tt.get('hashtags'))}

**Video idea:**
{tt.get('video_idea', '')}

---

## YouTube Short

**Title:** {yt.get('title', '')}

**Description:**
{yt.get('description', '').strip()}

**Keywords:** {", ".join(yt.get('keywords', [])) if isinstance(yt.get('keywords'), list) else yt.get('keywords', '')}

**Thumbnail idea:** {yt.get('thumbnail_idea', '')}
"""


def parse_book_arg(s: str) -> tuple[str, str]:
    """Parse 'L1.3' or 'L1' style book selectors."""
    s = s.upper().strip()
    if s.startswith("L"):
        s = s[1:]
    if "." in s:
        level, sub = s.split(".", 1)
        return level, f"{level}.{sub}"
    return s, ""


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--level", type=str, default="", help="e.g. 1 to only do L1")
    ap.add_argument("--book", type=str, default="", help="e.g. L1.3 for a single book")
    ap.add_argument("--model", type=str, default="gpt-4o")
    ap.add_argument("--regenerate", action="store_true",
                    help="Overwrite existing per-book files")
    ap.add_argument("--out", type=str, default="output/social_posts")
    args = ap.parse_args(argv)

    if not STORY_SUMMARIES_PATH.exists():
        print(f"story_summaries.json not found at {STORY_SUMMARIES_PATH}")
        return 1

    with open(STORY_SUMMARIES_PATH, encoding="utf-8") as f:
        data = json.load(f)

    if args.book:
        filt_level, filt_sub = parse_book_arg(args.book)
    else:
        filt_level = args.level.strip() or ""
        filt_sub = ""

    out_dir = Path(__file__).parent / args.out
    out_dir.mkdir(parents=True, exist_ok=True)
    system = build_system_prompt()

    todo: list[tuple[dict, dict]] = []
    for level_key in sorted(data.keys()):
        if not level_key.startswith("level_"):
            continue
        level_num = level_key.split("_", 1)[1]
        if filt_level and level_num != filt_level:
            continue
        level_info = data[level_key]
        books = level_info.get("completed_books") or []
        for book in books:
            sub = book.get("sub_level", "")
            if filt_sub and sub != filt_sub:
                continue
            slug = slugify(book.get("title", ""))
            out_path = out_dir / f"L{sub.replace('.', '_')}_{slug}.md"
            if out_path.exists() and not args.regenerate:
                continue
            todo.append((book, level_info))

    print(f"{len(todo)} books to generate social content for (model={args.model})")
    n_ok = 0
    for n, (book, level_info) in enumerate(todo, 1):
        sub = book["sub_level"]
        slug = slugify(book["title"])
        out_path = out_dir / f"L{sub.replace('.', '_')}_{slug}.md"
        user = book_context(book, level_info)
        try:
            t0 = time.time()
            text = normalise_ascii(call_openai(args.model, system, user))
            content = json.loads(text)
            md = format_markdown(book, content)
            out_path.write_text(md, encoding="utf-8")
            n_ok += 1
            elapsed = time.time() - t0
            print(f"[{n}/{len(todo)}] L{sub} {book['title']} ({elapsed:.1f}s) -> {out_path.name}")
        except json.JSONDecodeError as e:
            print(f"[{n}/{len(todo)}] L{sub} {book['title']}: JSON parse error: {e}")
        except Exception as e:
            print(f"[{n}/{len(todo)}] L{sub} {book['title']}: ERROR {e}")
        time.sleep(0.2)

    print(f"\n{n_ok}/{len(todo)} books done. Files in {out_dir}/")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
