"""
Generate a complete MyPhonicsBooks phonics poster as a SINGLE image using gpt-image-2.

This is the alternative to assembling 36 individual cliparts via HTML — instead we ask
gpt-image-2 to render the entire chart in one pass, with reference images for art style
and the signature tiny-dot-eye treatment.

Trade-offs vs assembled approach:
+ One inference, one cohesive style
+ gpt-image-2 is purpose-built for posters / infographics / text-rich images
- Less flexible (can't tweak a single tile without regenerating the whole chart)
- Text rendering for 36 letters + 36 cue words has higher error risk than HTML

Output: assets/phonics/clipart/level_1_poster_oneshot.png

Usage:
    py -3.12 scripts/generate_full_poster.py            # uses gpt-image-2 high quality
    py -3.12 scripts/generate_full_poster.py --quality medium
"""

import argparse
import base64
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
REPO_ROOT = ROOT.parent
load_dotenv(ROOT / ".env")
load_dotenv(REPO_ROOT / ".env", override=False)
if ".claude" in REPO_ROOT.parts and "worktrees" in REPO_ROOT.parts:
    idx = REPO_ROOT.parts.index(".claude")
    main_repo = Path(*REPO_ROOT.parts[:idx])
    load_dotenv(main_repo / "myphonics_books" / ".env", override=False)

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
if not OPENAI_API_KEY:
    print("[error] OPENAI_API_KEY not set", file=sys.stderr)
    sys.exit(1)

CUES_PATH = ROOT / "data" / "clipart_cues.json"
CLIPART_DIR = REPO_ROOT / "assets" / "phonics" / "clipart"
OUT_PATH = CLIPART_DIR / "level_1_poster_oneshot.png"

# References — book interior for art style, clipart for the eye-dot treatment
REF_PATHS = [
    REPO_ROOT / "public" / "illustrations" / "1_1" / "page2.png",
    CLIPART_DIR / "level_1" / "d_dog.png",
    CLIPART_DIR / "level_1" / "m_mud.png",
]


def grid_hint(n: int) -> str:
    return {
        31: "6 columns × 6 rows (the last row is partial — the final card sits next to the tricky-words strip)",
        21: "7 columns × 3 rows (perfect fit, no empty cells)",
        20: "5 columns × 4 rows (perfect fit, no empty cells)",
        11: "4 columns × 3 rows (one empty cell at bottom right)",
        10: "5 columns × 2 rows (perfect fit, no empty cells)",
         9: "3 columns × 3 rows (perfect fit, no empty cells)",
         6: "3 columns × 2 rows (perfect fit, no empty cells)",
         5: "5 columns × 1 row (a single horizontal row of larger cards)",
    }.get(n, f"a balanced grid that fits {n} cards in a landscape layout")


def build_prompt(cues: list[dict], level_num: str, level_name: str, level_colour: str, tricky_words: list[str] | None) -> str:
    n = len(cues)
    # In combined mode each cue carries its own per-card colour and level tag for
    # rendering. A leading "[Lx]" tag tells the model which border colour to use.
    cells = " | ".join(
        (f"[L{c.get('level_num', level_num)} · {c['sound']} → {c['cue']}]"
         if c.get("per_card_colour") else
         f"[{c['sound']} → {c['cue']}]")
        for c in cues
    )
    tricky = " · ".join(tricky_words) if tricky_words else ""
    layout = grid_hint(n)
    is_combined = any(c.get("per_card_colour") for c in cues)

    return (
        "Create a clean, calm landscape phonics chart for early-reader children, "
        "designed to be printed A3 and stuck on classroom and home walls. "
        "ART STYLE: Match the FIRST reference image — hand-drawn cartoon, clean black "
        "outlines, soft watercolour-textured fills, warm friendly modern children's "
        "picture book aesthetic. NOT flat vector clipart, NOT classroom-poster style, "
        "NOT photographic, NOT pencil sketch. "
        "EYE STYLE: For any creature on the chart, eyes MUST be tiny solid black filled "
        "circles like dots from a black marker — NO white sclera, NO iris, NO pupil "
        "detail. Just two small black dots like a teddy bear, EXACTLY as shown in the "
        "second and third reference images. "
        "BACKGROUND: Soft cream `#FFF9F5` for the whole poster. "
        f"TOP HEADER: A small calm centred header reading exactly: 'Level {level_num} · "
        f"{level_name}' in dark navy bold. Nothing else at the top — no ribbon, no "
        "logo, no banner, no decorative pills. The header is small and unobtrusive. "
        f"CARD GRID: Exactly {n} cards arranged as {layout}. Each card is a soft "
        "white rounded rectangle (~6mm radius) with a clean coloured border about "
        "1mm thick. "
        + (
            "The border colour is DIFFERENT for each card depending on which level "
            "the sound belongs to (see the [Lx · ...] prefix in the cards list "
            "below): L1=#E84B8A pink, L2=#F59E0B amber, L3=#22C55E green, "
            "L4=#3B82F6 blue, L5=#8B5CF6 purple, L6=#14B8A6 teal. Apply the "
            "matching colour to each card's border so teachers can see at a glance "
            "which level a sound belongs to. "
            if is_combined else
            f"The border uses the level colour {level_colour} — this border "
            f"identifies the chart as Level {level_num}. "
        )
        + "No drop shadow, no fill colour, no internal accent line. Generous airy "
        "spacing between cards. "
        "EACH CARD IS LANDSCAPE-ORIENTED with two halves SIDE BY SIDE: "
        "LEFT HALF — the lowercase phonics sound, very large and bold, in BLACK (NOT "
        "pink — letters must be solid black). Use a single-storey 'a' shape and "
        "single-storey 'g' shape suitable for early-reader handwriting (the 'a' is "
        "open at the top, no overhang, like the IPA letter ɑ; the 'g' is a simple "
        "loop, not the typeset double-loop). The black letter should fill most of "
        "the height of the card and feel like the dominant element. "
        "RIGHT HALF — a small isolated illustration of the cue word in the matching "
        "art style described above, centred in the right half. "
        "Beneath the illustration, a small lowercase cue word in dark navy. "
        "Spell every cue word and every sound EXACTLY as written below. Do not "
        "invent, abbreviate, pluralise, or substitute any letter or word. "
        f"CARDS in order (left-to-right, top-to-bottom): {cells}\n"
        + (
            "BOTTOM STRIP: After the grid, a generous full-width strip with a very "
            f"soft pastel tinted background — a faded version of the level colour "
            f"{level_colour} (roughly 90% white mixed with 10% of the level colour, so "
            "the tint is whisper-soft, not saturated). The strip is taller than a single "
            "line of text — it has room to breathe. "
            "INSIDE THE STRIP: A short label in dark navy bold on the LEFT reading "
            "exactly 'Tricky words' (no other words, no colon, no 'learn by heart', no "
            "explanation — teachers know what these are). "
            "To the right of the label, the tricky words appear as a row of small "
            f"individual rounded pill-shaped chips: {tricky}. Each chip has a soft white "
            f"background and a thin outline in the level colour {level_colour}. The "
            "tricky words inside the chips are CLEARLY READABLE — bolder and a bit "
            "larger than the cue words on the cards above (around the same size as the "
            "small cue word but a touch bigger). Lowercase except for the word 'I' "
            "which is always capital. Even spacing between chips. "
            if tricky_words else
            "NO BOTTOM STRIP. The grid uses the full poster height below the header — "
            "make the cards as large as possible, generously spaced. There is no "
            "tricky-words section on this combined chart. "
        )
        + "Nothing else on the poster — no brand mark, no URL, no page numbers."
    )


def generate(quality: str, level_key: str = "level_1", combined: list[str] | None = None) -> Path:
    from openai import OpenAI

    client = OpenAI(api_key=OPENAI_API_KEY)
    cues_root = json.loads(CUES_PATH.read_text(encoding="utf-8"))

    if combined:
        # Build a combined chart (no tricky words, per-card border colours)
        cues = []
        for k in combined:
            data = cues_root[k]
            level_num_per = k.replace("level_", "")
            for c in data["cues"]:
                cues.append({**c, "level_num": level_num_per, "per_card_colour": True})
        nums = ", ".join(k.replace("level_", "") for k in combined)
        level_num = nums
        level_name = "Sounds reference (combined chart)"
        level_colour = "#3B3B45"  # neutral fallback for header
        tricky_words = None
        out_label = "_".join(k.replace("level_", "L") for k in combined) + "_combined"
    else:
        cues_data = cues_root[level_key]
        cues = cues_data["cues"]
        level_num = level_key.replace("level_", "")
        level_name = cues_data["name"]
        level_colour = cues_data["colour"]
        tricky_path = ROOT / "data" / "tricky_words_by_level.json"
        tricky_words = json.loads(tricky_path.read_text(encoding="utf-8"))[level_key]["new_tricky_words"]
        out_label = level_key + "_poster_oneshot"

    prompt = build_prompt(cues, level_num, level_name, level_colour, tricky_words)
    global OUT_PATH
    OUT_PATH = CLIPART_DIR / f"{out_label}.png"

    for p in REF_PATHS:
        if not p.exists():
            print(f"[error] missing reference: {p}", file=sys.stderr)
            sys.exit(1)

    print(f"Generating one-shot L1 poster with gpt-image-2 (quality={quality})")
    print(f"References: {[p.name for p in REF_PATHS]}")
    print(f"Prompt length: {len(prompt)} chars")

    files = [open(p, "rb") for p in REF_PATHS]
    try:
        resp = client.images.edit(
            model="gpt-image-2",
            image=files,
            prompt=prompt,
            size="1536x1024",      # landscape, max for gpt-image-2
            quality=quality,        # 'medium' or 'high'
            background="auto",
            output_format="png",
            n=1,
        )
    finally:
        for f in files:
            f.close()

    img_b64 = resp.data[0].b64_json
    if not img_b64:
        print("[error] no image in response", file=sys.stderr)
        sys.exit(1)
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_bytes(base64.b64decode(img_b64))
    print(f"[ok] saved: {OUT_PATH.relative_to(REPO_ROOT)} ({OUT_PATH.stat().st_size/1024:.0f} KB)")

    # Composite the MyPhonicsBooks logo onto the top-left (gpt-image-2 cannot
    # reproduce our actual brand mark, so we overlay the real PNG asset).
    try:
        sys.path.insert(0, str(ROOT / "scripts"))
        from brand_posters import brand_one  # type: ignore
        brand_one(OUT_PATH)
    except Exception as e:
        print(f"  [warn] logo composite failed: {e}")

    return OUT_PATH


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--quality", choices=["medium", "high"], default="high")
    ap.add_argument("--level", default="L1", help="L1..L6")
    ap.add_argument("--combined", help="Comma-sep level list for a combined chart, e.g. 'L2,L3' or 'L4,L5,L6'")
    args = ap.parse_args()
    if args.combined:
        levels = [k.strip().lower().replace("l", "level_") for k in args.combined.split(",")]
        generate(args.quality, combined=levels)
    else:
        level_key = args.level.lower().replace("l", "level_")
        generate(args.quality, level_key=level_key)


if __name__ == "__main__":
    main()
