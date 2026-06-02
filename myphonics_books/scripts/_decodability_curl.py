"""
Decodability review via direct curl POST — bypasses the openai SDK
which was hanging in the prior runs. One HTTP call per level.

Output: output/decodability_problems.md
"""

from __future__ import annotations

import ast
import json
import os
import subprocess
import sys
import time
from pathlib import Path

REPO = Path(__file__).parent.parent

sys.path.insert(0, str(REPO / "scripts"))
from v2_helpers import build_sound_buttoned_words  # noqa: E402


def load_api_key() -> str:
    if (REPO / ".env").exists():
        for line in (REPO / ".env").read_text(encoding="utf-8").splitlines():
            if line.startswith("OPENAI_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return os.environ.get("OPENAI_API_KEY", "")


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
        return build_sound_buttoned_words(words, cumulative) if words else []
    return {
        "file": py_path.name,
        "title": book.get("book_title", ""),
        "level": lvl,
        "sub": book.get("sub_level"),
        "story_words":   split_list(book.get("story_words", [])),
        "read_words":    split_list(book.get("read_words", [])),
        "writing_words": split_list(book.get("writing_words", [])),
        "tricky_words": book.get("tricky_words_used", []),
        "pronunciation_notes": [
            ex
            for note in (book.get("pronunciation_notes") or [])
            for ex in (note.get("examples") or [])
        ],
    }


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
        out.append("-- pronunciation_notes (already flagged):")
        for ex in b["pronunciation_notes"]:
            out.append(f"   {ex}")
    return "\n".join(out)


SYSTEM = (
    "You are a senior UK literacy specialist auditing decodable phonics "
    "books. You think in phonemes. You flag words that the child would "
    "mispronounce when sounding out, even if the spelling looks right on "
    "paper. You return short focused lists, not essays."
)


PROMPT = """\
The parent complained: a child sounding out 'capable' as c-a-p-(able)
arrives at /kap-uh-bul/, but the real word is /kayp-uh-bul/. The 'a' is
LONG because 'ca-' is an OPEN SYLLABLE before a single consonant + -able.
Same applies to table /tay-bul/, cable /kay-bul/, stable. The splitter
is correct on paper but the child says the wrong word.

Audit these L{level} books. Cumulative graphemes the child has been
taught at this level: {graphemes}

For EACH book, return ONLY a flat list of PROBLEM words: words a child
would NOT cleanly arrive at by sounding out with the listed graphemes.
Skip clean words. Skip tricky words. Ignore nonsense words.

Watch especially for:
- OPEN SYLLABLES making vowels go long (CV.CV pattern: a-ble, table)
- SCHWA reductions in unstressed syllables ("re" in remarkable)
- Silent letters or atypical letter values not in the level set
- Stress shifts that move the vowel value

For each problem word, give one line using this exact format:
PROBLEM | <file> | <word> | <one-sentence reason> | <decodable replacement>

End with a single line: DONE

BOOKS:
{books}
"""


def call_curl(model: str, api_key: str, prompt: str, timeout: int = 180) -> str:
    payload = json.dumps({
        "model": model,
        "instructions": SYSTEM,
        "input": prompt,
    })
    tmp = REPO / "output" / f"_payload_{model}.json"
    tmp.write_text(payload, encoding="utf-8")

    proc = subprocess.run(
        [
            "curl", "-sS", "--max-time", str(timeout),
            "-X", "POST", "https://api.openai.com/v1/responses",
            "-H", f"Authorization: Bearer {api_key}",
            "-H", "Content-Type: application/json",
            "--data-binary", f"@{tmp}",
        ],
        capture_output=True, text=True,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"curl rc={proc.returncode}: {proc.stderr}")
    obj = json.loads(proc.stdout)
    # Pull out output_text equivalent from the responses payload
    msgs = obj.get("output", [])
    for m in msgs:
        for c in m.get("content", []) or []:
            if c.get("type") == "output_text":
                return c.get("text", "")
    raise RuntimeError(f"no output_text in response: {proc.stdout[:500]}")


def main():
    api_key = load_api_key()
    if not api_key:
        sys.exit("No API key")

    graphemes_by_level = json.loads(
        (REPO / "data" / "graphemes_by_level.json").read_text(encoding="utf-8")
    )

    level_filter = None
    if len(sys.argv) > 1:
        spec = sys.argv[1]
        if "-" in spec:
            lo, hi = (int(x) for x in spec.split("-"))
            level_filter = set(range(lo, hi + 1))
        else:
            level_filter = {int(spec)}

    books = []
    for p in sorted((REPO / "data").glob("*_story_l*_book1.py")):
        try:
            b = collect(p, graphemes_by_level)
            if b and (not level_filter or b["level"] in level_filter):
                books.append(b)
        except Exception as e:
            print(f"  skip {p.name}: {e}", file=sys.stderr)

    by_level = {}
    for b in books:
        by_level.setdefault(b["level"], []).append(b)

    all_text = []
    for lvl in sorted(by_level):
        graphemes = graphemes_by_level[f"level_{lvl}"]["cumulative_graphemes"]
        books_block = "\n".join(render_book(b) for b in by_level[lvl])
        prompt = PROMPT.format(
            level=lvl, graphemes=graphemes, books=books_block,
        )
        print(
            f"L{lvl}: {len(by_level[lvl])} books, "
            f"{len(prompt):,} chars",
            file=sys.stderr,
        )

        text = None
        for model in ("gpt-4.1", "gpt-5-mini"):
            t0 = time.time()
            try:
                text = call_curl(model, api_key, prompt, timeout=240)
                dt = time.time() - t0
                print(f"   ok via {model} in {dt:.1f}s", file=sys.stderr)
                break
            except Exception as e:
                print(f"   {model} failed: {e}", file=sys.stderr)

        if not text:
            print(f"   L{lvl} FAILED", file=sys.stderr)
            continue

        all_text.append(f"\n# Level {lvl}\n\n{text}\n")

    out_dir = REPO / "output"
    out_dir.mkdir(exist_ok=True)
    full = "\n".join(all_text)
    (out_dir / "decodability_problems.md").write_text(full, encoding="utf-8")
    print(f"\nWrote {len(full):,} chars", file=sys.stderr)

    print("\n=== PROBLEMS ===\n", file=sys.stderr)
    for line in full.splitlines():
        if line.startswith("PROBLEM |"):
            print(line, file=sys.stderr)


if __name__ == "__main__":
    main()
