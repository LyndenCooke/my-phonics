"""
Text-only review doc generator for MyPhonicsBooks.

For each book, emits a single markdown artifact at
    output/text_reviews/{book_slug}.md
containing:
  - Story-as-prose (all page text joined)
  - Per page: text + vision-API-generated image caption
  - Cumulative graphemes + tricky words available at this level
  - Per-page phonics + narrative analysis (single GPT-5 call after captions)
  - Top issues block

The point is to put EVERYTHING in plain text so a human can review a book
without opening the PDF. Captions are cached on disk so re-running is cheap.

Run from `myphonics_books/`:
    py -3.12 scripts/_text_review_doc.py             # every book
    py -3.12 scripts/_text_review_doc.py L2          # one level
    py -3.12 scripts/_text_review_doc.py L2.1        # one book
    py -3.12 scripts/_text_review_doc.py L2_1        # same thing
"""

from __future__ import annotations

import base64
import json
import os
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).parent.parent
ENV_PATH = ROOT / ".env"

api_key = os.environ.get("OPENAI_API_KEY")
if not api_key and ENV_PATH.exists():
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        if line.startswith("OPENAI_API_KEY="):
            api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
            break
if not api_key:
    sys.exit("No OPENAI_API_KEY found in env or .env")

import httpx

HTTP = httpx.Client(
    base_url="https://api.openai.com/v1",
    headers={"Authorization": f"Bearer {api_key}"},
    timeout=httpx.Timeout(connect=15.0, read=600.0, write=600.0, pool=15.0),
)

GRAPHEMES = json.loads((ROOT / "data" / "graphemes_by_level.json").read_text(encoding="utf-8"))
TRICKY = json.loads((ROOT / "data" / "tricky_words_by_level.json").read_text(encoding="utf-8"))

STORY_FILES: dict[str, Path] = {}
for p in (ROOT / "data").glob("*_story_l*_book*.py"):
    m = re.search(r"_l(\d+)_(\d+)_book", p.name)
    if m:
        STORY_FILES[f"L{m.group(1)}_{m.group(2)}"] = p


def load_story(level: int, sub: int) -> dict | None:
    key = f"L{level}_{sub}"
    path = STORY_FILES.get(key)
    if not path:
        return None
    ns: dict = {}
    exec(path.read_text(encoding="utf-8"), ns)
    for v in ns.values():
        if isinstance(v, dict) and f"L{level}_{sub}_B1" in v:
            return v[f"L{level}_{sub}_B1"]
    return None


CAPTION_SYSTEM = (
    "You describe children's-book illustrations in plain, literal prose. "
    "For each image, output 1-2 sentences naming: the characters present, "
    "what they are doing right now, the key objects in frame, the setting, "
    "and any time-of-day or weather cues. Be specific — say 'a tabby cat "
    "outside a 7-Eleven', not 'an animal at a store'. No headers, no bullets, "
    "no opinion. Just the literal description a sighted reader would give."
)


def caption_image(image_path: Path) -> str:
    data = image_path.read_bytes()
    b64 = base64.b64encode(data).decode("ascii")
    payload = {
        "model": "gpt-5-mini",
        "instructions": CAPTION_SYSTEM,
        "input": [{
            "role": "user",
            "content": [
                {"type": "input_text", "text": "Describe this illustration:"},
                {"type": "input_image", "image_url": f"data:image/png;base64,{b64}"},
            ],
        }],
        "reasoning": {"effort": "minimal"},
    }
    resp = HTTP.post("/responses", json=payload)
    if resp.status_code != 200:
        raise RuntimeError(f"caption HTTP {resp.status_code}: {resp.text[:300]}")
    return _extract_text(resp.json()).strip()


def _extract_text(data: dict) -> str:
    if isinstance(data.get("output_text"), str):
        return data["output_text"]
    chunks: list[str] = []
    for block in data.get("output", []) or []:
        if block.get("type") == "message":
            for c in block.get("content", []) or []:
                if c.get("type") in ("output_text", "text") and c.get("text"):
                    chunks.append(c["text"])
    return "\n".join(chunks).strip()


def get_captions(level: int, sub: int, page_count: int) -> list[str]:
    """Caption every story-page image, caching on disk."""
    img_dir = ROOT / "output" / "images" / f"L{level}_{sub}_B1"
    cache_dir = ROOT / "output" / "text_reviews" / "_captions" / f"L{level}_{sub}_B1"
    cache_dir.mkdir(parents=True, exist_ok=True)

    captions: list[str] = []
    for i in range(1, page_count + 1):
        cache = cache_dir / f"page{i}.txt"
        img = img_dir / f"page{i}.png"
        if not img.exists():
            captions.append("(image file missing)")
            continue
        if cache.exists() and cache.stat().st_mtime > img.stat().st_mtime:
            captions.append(cache.read_text(encoding="utf-8").strip())
            continue
        print(f"    captioning page{i}…", flush=True)
        text = caption_image(img)
        cache.write_text(text, encoding="utf-8")
        captions.append(text)
    return captions


ANALYSIS_SYSTEM = (
    "You are a senior children's-book editor AND a UK phonics specialist "
    "(Letters & Sounds + RWI). You are reviewing a decodable phonics reader "
    "delivered entirely as text: source page text + an objective verbal "
    "description of each illustration. You read it as PROSE FIRST. "
    "Critique in this strict order of priority: "
    "(1) NARRATIVE COHERENCE — does the text actually tell a story? Does it "
    "read like a story or like phonics drills strung together? Do the pages "
    "follow a clear arc? "
    "(2) IMAGE-TEXT FIT — do the illustrations (per caption) tell the same "
    "story as the text? If the images show a boy looking for his cat and the "
    "text never mentions a boy or a cat, that is a critical narrative "
    "mismatch — say so loudly. "
    "(3) DENSITY — is the wording dense enough for this level, or does the "
    "page-by-page word count make this look like a lower-level book? "
    "(4) PHONICS — only NOW check decodability, tricky-word adherence, and "
    "tricky_words_used metadata accuracy. "
    "British English. Be terse, specific, actionable. Quote exact wording "
    "you would change. Always cite the page number. If something is fine, "
    "say so in one line — do not pad."
)


# Sub-level grapheme progression — L2 books introduce 2 sounds per sub-level.
# Used to compute the *actual* cumulative grapheme set available to the child
# at e.g. L2.1, which is strictly smaller than the L2-end cumulative.
L2_SUB_GRAPHEMES = {
    1: ["ay", "ee", "igh"],
    2: ["ow", "oo"],
    3: ["ar", "or"],
    4: ["air", "ir"],
    5: ["ou"],
    6: ["oy"],
}


def cumulative_graphemes_for(level: int, sub: int) -> list[str]:
    """Strict cumulative grapheme set at L{level}.{sub} — handles L2's per-sub progression."""
    if level == 1:
        return GRAPHEMES["level_1"]["cumulative_graphemes"]
    if level == 2:
        out = list(GRAPHEMES["level_1"]["cumulative_graphemes"])
        for s in range(1, sub + 1):
            out.extend(L2_SUB_GRAPHEMES.get(s, []))
        return out
    return GRAPHEMES.get(f"level_{level}", {}).get("cumulative_graphemes", [])


def active_tricky_at(level: int) -> tuple[list[str], list[str]]:
    """Returns (active, mastered) tricky words for this level.

    A tricky word is 'active' if it's in the cumulative list AND mastery_level
    is unset or >= level. Mastered = in cumulative but past its mastery level.
    """
    mastery = TRICKY.get("mastery_level", {})
    cumulative = TRICKY.get(f"level_{level}", {}).get("cumulative", [])
    active, mastered = [], []
    for w in cumulative:
        m = mastery.get(w)
        if not m:
            active.append(w)
            continue
        m_n = int(m.split("_")[1])
        if m_n >= level:
            active.append(w)
        else:
            mastered.append(w)
    return active, mastered


def grapheme_set(level: int, sub: int) -> dict:
    key = f"level_{level}"
    active, mastered = active_tricky_at(level)
    return {
        "cumulative_graphemes": cumulative_graphemes_for(level, sub),
        "level_cumulative_graphemes": GRAPHEMES.get(key, {}).get("cumulative_graphemes", []),
        "active_tricky": active,
        "mastered_tricky": mastered,
        "new_tricky": TRICKY.get(key, {}).get("new_tricky_words", []),
        "level_name": GRAPHEMES.get(key, {}).get("name", ""),
    }


def build_text_doc(level: int, sub: int, story: dict, captions: list[str]) -> str:
    g = grapheme_set(level, sub)
    pages = story.get("story_pages", [])
    focus = ", ".join(story.get("focus_graphemes", []))

    lines: list[str] = [
        f"# {story.get('book_title', 'untitled')} — L{level}.{sub}",
        "",
        f"**Level:** L{level} ({g['level_name']}) — sub-level {sub}  ",
        f"**Focus graphemes:** {focus}  ",
        f"**Source story file:** `{STORY_FILES.get(f'L{level}_{sub}', '(missing)').name if STORY_FILES.get(f'L{level}_{sub}') else '(missing)'}`",
        "",
        "## Story as prose",
        "",
    ]
    prose = " ".join(p.get("text", "") for p in pages).strip()
    lines.append(f"> {prose}" if prose else "_(empty)_")
    lines += [
        "",
        f"_Page count: {len(pages)} · Word count: {len(prose.split())} · Avg words/page: {len(prose.split()) / max(len(pages), 1):.1f}_",
        "",
        "## Page-by-page",
        "",
    ]

    for i, p in enumerate(pages):
        text = p.get("text", "")
        cap = captions[i] if i < len(captions) else "(no caption)"
        wc = len(text.split())
        lines += [
            f"### Page {i + 1} ({wc} words)",
            "",
            f"**Text:** {text}",
            "",
            f"**Image:** {cap}",
            "",
        ]

    lines += [
        "## Phonics scheme available at this level",
        "",
        f"**Cumulative graphemes at L{level}.{sub} ({len(g['cumulative_graphemes'])}):** "
        + ", ".join(g["cumulative_graphemes"]),
        "",
        f"**Active tricky words ({len(g['active_tricky'])}):** "
        + ", ".join(g["active_tricky"]),
        "",
        f"**Mastered tricky words ({len(g['mastered_tricky'])} — allowed in text but reviewer should NOT flag them as 'tricky used' for QA):** "
        + (", ".join(g["mastered_tricky"]) if g["mastered_tricky"] else "(none)"),
        "",
        f"**New tricky words first introduced at L{level}:** " + ", ".join(g["new_tricky"]),
        "",
        "## Declared in the book data",
        "",
        f"**story_words:** {story.get('story_words', [])}  ",
        f"**tricky_words_used:** {story.get('tricky_words_used', [])}  ",
        f"**read_words:** {story.get('read_words', [])}  ",
        f"**writing_words:** {story.get('writing_words', [])}  ",
        "",
    ]

    return "\n".join(lines)


def analyse(doc: str) -> tuple[str, str]:
    """Send the text doc to GPT-5 with the narrative-first prompt."""
    user_msg = (
        doc
        + "\n\n---\n\n"
        + "Produce a review in exactly this order, using the priority you were "
        "told to apply (narrative first, phonics last):\n\n"
        "## 1. Narrative coherence\n"
        "Does this text tell a story? Score 1–5. What is the story arc, if any? "
        "What feels missing — characters? motivation? payoff? Quote 2–3 lines "
        "that work or fail.\n\n"
        "## 2. Image-text fit\n"
        "Read the captions as a sequence. What story do the IMAGES tell? "
        "Compare to the text. Where do they diverge? Be specific per page.\n\n"
        "## 3. Density and pitch\n"
        "Word count per page table. Is this dense enough for the stated level "
        "or does it read like a lower level? Cite a sibling level's density "
        "for comparison if known.\n\n"
        "## 4. Phonics audit\n"
        "Decodability slips against the cumulative grapheme list shown above "
        "(use the sub-level list, not the level-end one). For tricky-word "
        "checks, ONLY flag words from the 'Active tricky words' set — ignore "
        "'Mastered tricky words' (those have been seen for at least two levels "
        "and should no longer be considered tricky for QA). Note any word in "
        "the text that uses a non-cumulative grapheme. Page → word → fix.\n\n"
        "## 5. Top 5 fixes — ranked by impact on the child's reading experience\n"
        "Page → exact replacement wording → why.\n\n"
        "Stay under ~900 words total. Bullets, not paragraphs."
    )

    for model in ("gpt-5", "gpt-5-mini", "gpt-4.1"):
        try:
            payload: dict = {
                "model": model,
                "instructions": ANALYSIS_SYSTEM,
                "input": [{"role": "user", "content": [
                    {"type": "input_text", "text": user_msg},
                ]}],
            }
            if model.startswith(("gpt-5", "o")):
                payload["reasoning"] = {"effort": "medium"}
            resp = HTTP.post("/responses", json=payload)
            if resp.status_code != 200:
                raise RuntimeError(f"HTTP {resp.status_code}: {resp.text[:300]}")
            text = _extract_text(resp.json())
            if not text:
                raise RuntimeError("empty output")
            return text, model
        except Exception as e:
            print(f"  ! {model} failed: {type(e).__name__}: {str(e)[:160]}",
                  file=sys.stderr)
    raise RuntimeError("All models failed.")


# ─── Targeting ────────────────────────────────────────────────────
def resolve_targets(arg: str | None) -> list[tuple[int, int]]:
    """Parse arg into a list of (level, sub) pairs."""
    if not arg:
        return sorted(
            (int(m.group(1)), int(m.group(2)))
            for k, _ in STORY_FILES.items()
            for m in [re.fullmatch(r"L(\d+)_(\d+)", k)]
            if m
        )
    a = arg.strip().upper().replace(".", "_")
    if re.fullmatch(r"L\d+", a):
        n = int(a[1:])
        return sorted(
            (lvl, sub) for lvl, sub in
            (
                tuple(int(x) for x in re.fullmatch(r"L(\d+)_(\d+)", k).groups())
                for k in STORY_FILES
            )
            if lvl == n
        )
    m = re.fullmatch(r"L(\d+)_(\d+)", a)
    if m:
        return [(int(m.group(1)), int(m.group(2)))]
    sys.exit(f"Could not parse target: {arg!r}")


def slug(level: int, sub: int, story: dict) -> str:
    title = story.get("book_title", "")
    safe = re.sub(r"[^A-Za-z0-9]+", "_", title).strip("_")
    return f"L{level}_{sub}_{safe}"


def main() -> None:
    arg = sys.argv[1] if len(sys.argv) > 1 else None
    targets = resolve_targets(arg)
    if not targets:
        sys.exit("No targets matched.")

    out_root = ROOT / "output" / "text_reviews"
    out_root.mkdir(parents=True, exist_ok=True)

    print(f"Generating text-review docs for {len(targets)} book(s)\n", flush=True)

    for i, (level, sub) in enumerate(targets, 1):
        print(f"[{i}/{len(targets)}] L{level}.{sub}", flush=True)
        story = load_story(level, sub)
        if not story:
            print("  ! story file not found, skipping", flush=True)
            continue

        page_count = len(story.get("story_pages", []))
        captions = get_captions(level, sub, page_count)

        doc = build_text_doc(level, sub, story, captions)
        print("  -> analysis", flush=True)
        t0 = time.time()
        try:
            analysis, model = analyse(doc)
        except Exception as e:
            print(f"  X analysis failed: {e}", flush=True)
            continue
        dt = time.time() - t0

        out_path = out_root / f"{slug(level, sub, story)}.md"
        out_path.write_text(
            doc
            + "\n## Analysis (`{}`)\n\n".format(model)
            + analysis
            + "\n",
            encoding="utf-8",
        )
        print(f"  saved {out_path.relative_to(ROOT)}  ({dt:.0f}s)", flush=True)


if __name__ == "__main__":
    main()
