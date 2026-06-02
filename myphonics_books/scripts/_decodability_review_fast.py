"""
Fast decodability review — asks the model to flag ONLY problem words,
not give a verdict on every word.  Much smaller output, returns in
seconds rather than minutes.

The user's complaint: "capable" is being treated as decodable but a
child would say /kap-uh-bul/ when the real word is /keɪ-puh-bul/.
Same problem for table/cable/stable.  These are open-syllable cases
where a single consonant before "-able" makes the vowel long.

Usage:
    py -3.12 scripts/_decodability_review_fast.py
    py -3.12 scripts/_decodability_review_fast.py 6        # one level
"""

from __future__ import annotations

import ast
import json
import os
import sys
from pathlib import Path

REPO = Path(__file__).parent.parent
ENV_PATH = REPO / ".env"

sys.path.insert(0, str(REPO / "scripts"))
from v2_helpers import build_sound_buttoned_words  # noqa: E402


def load_api_key() -> str:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key and ENV_PATH.exists():
        for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
            if line.startswith("OPENAI_API_KEY="):
                api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                break
    if not api_key:
        sys.exit("No OPENAI_API_KEY found in env or .env")
    return api_key


def extract_book_dict(py_path: Path) -> dict | None:
    tree = ast.parse(py_path.read_text(encoding="utf-8"))
    for node in tree.body:
        if isinstance(node, ast.Assign) and isinstance(node.value, ast.Dict):
            outer = ast.literal_eval(node.value)
            if outer and isinstance(outer, dict):
                first = next(iter(outer.values()))
                if isinstance(first, dict) and "level" in first:
                    return first
    return None


def collect(py_path: Path, graphemes_by_level: dict) -> dict | None:
    book = extract_book_dict(py_path)
    if not book:
        return None
    lvl = book.get("level")
    cumulative = graphemes_by_level.get(
        f"level_{lvl}", {}
    ).get("cumulative_graphemes", [])

    def split_list(words):
        if not words:
            return []
        return build_sound_buttoned_words(words, cumulative)

    return {
        "file":  py_path.name,
        "title": book.get("book_title", ""),
        "level": lvl,
        "sub":   book.get("sub_level"),
        "focus_graphemes": book.get("focus_graphemes", []),
        "story_words":   split_list(book.get("story_words", [])),
        "read_words":    split_list(book.get("read_words", [])),
        "writing_words": split_list(book.get("writing_words", [])),
        "pronunciation_notes": [
            ex
            for note in (book.get("pronunciation_notes") or [])
            for ex in (note.get("examples") or [])
        ],
        "tricky_words": book.get("tricky_words_used", []),
    }


SYSTEM = (
    "You are a senior UK literacy specialist auditing decodable phonics "
    "books. You think in phonemes. You flag words that the child would "
    "mispronounce when sounding out, even if the spelling looks right on "
    "paper. You return short focused lists, not essays."
)


PROMPT = """\
The parent complained: a child sounding out 'capable' as c-a-p-(able)
arrives at /kap-uh-bul/, but the real word is /keɪ-puh-bul/. The 'a' is
LONG because 'ca-' is an open syllable before a single consonant + -able.
Same problem applies to table /teɪ-bul/, cable /keɪ-bul/, stable. The
splitter is correct on paper but pedagogically broken — the child says
the wrong word and a tutor has to correct them.

Audit these books at L{level}. Cumulative graphemes the child has been
taught: {graphemes}

For EACH book, return ONLY a flat list of PROBLEM words: words that a
child would NOT cleanly arrive at by sounding out with the listed
graphemes. Skip clean words entirely. Skip listed tricky words. Ignore
nonsense words.

For each problem word, give:
  word | level | reason (1 short clause) | replacement (decodable swap)

Use this exact format, one word per line:
PROBLEM | <file> | <word> | <reason> | <replacement>

After the lines, end with a single line "DONE".

BOOKS:
{books}
"""


def render_book(b: dict) -> str:
    out = [f"\n## {b['file']} (L{b['level']}.{b['sub']}) — {b['title']}"]
    out.append(f"Tricky (skip): {b['tricky_words']}")
    for bucket in ("story_words", "read_words", "writing_words"):
        entries = b[bucket]
        if not entries:
            continue
        out.append(f"-- {bucket}:")
        for e in entries:
            out.append(f"   {e['word']:24s} split={'-'.join(e['phonemes'])}")
    if b["pronunciation_notes"]:
        out.append("-- pronunciation_notes (these are explicitly flagged to grown-ups already):")
        for ex in b["pronunciation_notes"]:
            out.append(f"   {ex}")
    return "\n".join(out)


def main():
    api_key = load_api_key()
    from openai import OpenAI
    client = OpenAI(api_key=api_key)

    graphemes_by_level = json.loads(
        (REPO / "data" / "graphemes_by_level.json").read_text(encoding="utf-8")
    )

    level_filter = None
    if len(sys.argv) > 1:
        spec = sys.argv[1]
        level_filter = (
            {int(x) for x in range(int(spec.split("-")[0]),
                                   int(spec.split("-")[1]) + 1)}
            if "-" in spec
            else {int(spec)}
        )

    books = []
    for p in sorted((REPO / "data").glob("*_story_l*_book1.py")):
        try:
            b = collect(p, graphemes_by_level)
            if b and (not level_filter or b["level"] in level_filter):
                books.append(b)
        except Exception as e:
            print(f"  skip {p.name}: {e}", file=sys.stderr)

    print(f"{len(books)} books", file=sys.stderr)

    # Group by level — issue one call per level so the model sees a stable
    # grapheme set per request.
    by_level = {}
    for b in books:
        by_level.setdefault(b["level"], []).append(b)

    all_text = []
    for lvl in sorted(by_level):
        graphemes = graphemes_by_level[f"level_{lvl}"]["cumulative_graphemes"]
        books_block = "\n".join(render_book(b) for b in by_level[lvl])
        prompt = PROMPT.format(level=lvl, graphemes=graphemes, books=books_block)

        print(
            f"  L{lvl}: {len(by_level[lvl])} books, {len(prompt):,} chars",
            file=sys.stderr,
        )

        text = None
        for model in ("gpt-5-mini", "gpt-4.1", "gpt-4o"):
            try:
                print(f"    -> {model}", file=sys.stderr)
                # NO reasoning effort — keep this snappy.
                r = client.responses.create(
                    model=model,
                    instructions=SYSTEM,
                    input=prompt,
                )
                text = r.output_text
                print(f"    ok ({model})", file=sys.stderr)
                break
            except Exception as e:
                print(
                    f"    {model} failed: {type(e).__name__}: {e}",
                    file=sys.stderr,
                )

        if not text:
            print(f"  L{lvl} FAILED", file=sys.stderr)
            continue

        all_text.append(f"\n# Level {lvl}\n\n{text}\n")

    out_dir = REPO / "output"
    out_dir.mkdir(exist_ok=True)
    full = "\n".join(all_text)
    (out_dir / "decodability_problems.md").write_text(full, encoding="utf-8")
    print(f"\nWrote {len(full):,} chars to decodability_problems.md", file=sys.stderr)

    # Print the actual problems found
    print("\n\n=== PROBLEMS FOUND ===\n", file=sys.stderr)
    for line in full.splitlines():
        if line.startswith("PROBLEM |"):
            print(line, file=sys.stderr)


if __name__ == "__main__":
    main()
