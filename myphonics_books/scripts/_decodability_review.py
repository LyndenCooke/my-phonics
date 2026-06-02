"""
Decodability review — one final OpenAI specialist pass over every word that
the books ask the child to sound out, to flag words that are NOT cleanly
decodable using a greedy grapheme split at that book's level.

User complaint that triggered this script:
  "It's saying 'recognise' should be sounded out... but 'capable' is the
  first word and you can't sound that out — the first syllable is /keɪp/
  not /kæp/, and the 'able' chunk has the wrong vowel for naive c-a-p-able."

What we send to the model, per book:
  - the book's level + cumulative graphemes
  - every word in story_words, read_words, writing_words, nonsense_words,
    plus any pronunciation_notes examples
  - the greedy phoneme split our renderer currently produces

What we ask back:
  - For each word: VERDICT = "clean" | "risky" | "not_decodable"
  - reason (one sentence — what would go wrong when a child sounds it out)
  - if risky/not_decodable: a replacement suggestion of equal level/utility

Output:
  output/decodability_review.md   — markdown for the user to read
  output/decodability_review.json — structured for downstream replacement
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


def load_graphemes() -> dict:
    return json.loads(
        (REPO / "data" / "graphemes_by_level.json").read_text(encoding="utf-8")
    )


def extract_book_dict(py_path: Path) -> dict | None:
    """Parse a story file and return the inner book dict.

    The story files have the shape
        STORY_BOOK1 = { "LX_Y_B1": { ...book fields... } }
    We grab the first value of the first module-level dict assignment.
    """
    tree = ast.parse(py_path.read_text(encoding="utf-8"))
    for node in tree.body:
        if isinstance(node, ast.Assign) and isinstance(node.value, ast.Dict):
            outer = ast.literal_eval(node.value)
            if outer and isinstance(outer, dict):
                first = next(iter(outer.values()))
                if isinstance(first, dict) and "level" in first:
                    return first
    return None


def collect_book(py_path: Path, cumulative_by_level: dict) -> dict:
    book = extract_book_dict(py_path) or {}
    level = book.get("level")
    sub = book.get("sub_level")
    cumulative = cumulative_by_level.get(
        f"level_{level}", {}
    ).get("cumulative_graphemes", [])

    def split_list(words):
        if not words:
            return []
        return build_sound_buttoned_words(words, cumulative)

    pron_examples = []
    for note in book.get("pronunciation_notes", []) or []:
        for ex in note.get("examples", []) or []:
            pron_examples.append(ex)

    return {
        "file": py_path.name,
        "title": book.get("book_title", ""),
        "level": level,
        "sub_level": sub,
        "focus_graphemes": book.get("focus_graphemes", []),
        "story_words": split_list(book.get("story_words", [])),
        "read_words": split_list(book.get("read_words", [])),
        "writing_words": split_list(book.get("writing_words", [])),
        "nonsense_words": split_list(book.get("nonsense_words", [])),
        "pronunciation_notes": pron_examples,
        "tricky_words_used": book.get("tricky_words_used", []),
    }


SYSTEM = (
    "You are a senior UK literacy specialist who designs systematic synthetic "
    "phonics programmes (Letters & Sounds, Read Write Inc, Phonics Bug). "
    "You are auditing whether each word in a child's decodable book can "
    "actually be sounded out using the graphemes the child has been taught "
    "at that level. You think in phonemes, not in spelling. You flag "
    "syllable-junction problems (open vs closed syllables that change the "
    "vowel sound), schwa reductions, silent letters that haven't been "
    "taught, and any cases where the renderer's greedy split is correct on "
    "paper but pedagogically broken (the child would arrive at the wrong "
    "spoken word). You give exact verdicts, not platitudes. British English."
)

USER_TEMPLATE = """\
# One final decodability audit — be brutal

I render every word in these books with a greedy longest-match phoneme
splitter, then draw one box per phoneme on the child's Listen-and-Write
page. The child reads the word by sounding out one box at a time.

The parent's specific complaint that triggered this audit:

> "It's saying 'recognise' should be sounded out even though 'nised'
> needs i-split-e with a d on the end. But then 'capable' is being
> shown as a word the child can sound out, which they clearly can't.
> The first syllable is /keɪp/ not /kap/, and the 'able' chunk needs
> to be ONE joined unit because that's the only way the vowel works.
> Check every single word and tell me which ones are properly
> decodable and which are not."

For EACH word below, give a JSON entry of the form:
{{
  "word": "capable",
  "verdict": "risky" | "clean" | "not_decodable",
  "reason": "one-sentence explanation of what goes wrong when a child
             at this level sounds it out using the listed graphemes",
  "replacement": "suggested decodable swap at the same level/utility
                  if the word is risky or not_decodable; else null"
}}

Rules:
- "clean" = every phoneme maps to a taught grapheme AND the resulting
  pronunciation is correct.
- "risky" = decodable on paper but the vowel/stress would be wrong
  (open syllable making a long vowel, schwa, etc.) — child would
  arrive at the wrong spoken word without an adult correction.
- "not_decodable" = needs a grapheme the child hasn't met, or a rule
  that isn't in the level's grapheme set.
- Nonsense words: just confirm whether the splitter's split matches
  what a child would actually say.
- If a word is a TRICKY word listed on the page (taught by sight),
  ignore it. The list of tricky words for each book is given below.

Return ONE valid JSON object per book, keyed by file name, of the form:
{{
  "remarkable_story_l6_2_book1.py": {{
    "title": "You Are Remarkable",
    "level": 6, "sub_level": 2,
    "verdicts": [ {{...}}, {{...}}, ... ]
  }},
  ...
}}

The 33 books with their words and the splitter's current phoneme split:

{books_block}

Now give the JSON. Wrap it in ```json ... ``` so I can parse it.

After the JSON, add a SHORT executive summary (max 12 lines) listing
the top 10 most pedagogically risky words across all books and the
suggested replacements — this is what I will show the parent."""


def render_books_block(books, graphemes_by_level):
    """Render the per-book context block sent to the model."""
    lines = []
    for b in books:
        if not b.get("level"):
            continue
        lvl = b["level"]
        cum = graphemes_by_level.get(
            f"level_{lvl}", {}
        ).get("cumulative_graphemes", [])
        lines.append(
            f"\n## {b['file']}  —  '{b['title']}'  (L{lvl}.{b['sub_level']})"
        )
        lines.append(f"Focus graphemes: {b['focus_graphemes']}")
        lines.append(f"Cumulative graphemes (this level): {cum}")
        lines.append(f"Tricky words on the page: {b['tricky_words_used']}")
        for bucket in ("story_words", "read_words", "writing_words",
                       "nonsense_words"):
            entries = b.get(bucket) or []
            if not entries:
                continue
            lines.append(f"\n### {bucket}")
            for e in entries:
                phonemes = "-".join(e["phonemes"])
                lines.append(f"  {e['word']:24s}  -> {phonemes}")
        if b.get("pronunciation_notes"):
            lines.append("\n### pronunciation_notes (shown to grown-up)")
            for ex in b["pronunciation_notes"]:
                lines.append(f"  {ex}")
    return "\n".join(lines)


def call_model(client, model: str, prompt: str, effort: str = "medium") -> str:
    print(f"  -> trying {model} (effort={effort})", file=sys.stderr)
    r = client.responses.create(
        model=model,
        instructions=SYSTEM,
        input=prompt,
        reasoning={"effort": effort} if model.startswith(("gpt-5", "o")) else None,
    )
    return r.output_text


def main():
    api_key = load_api_key()
    from openai import OpenAI
    client = OpenAI(api_key=api_key)

    graphemes_by_level = load_graphemes()

    # CLI arg: optional level filter so caller can run a subset
    # py -3.12 scripts/_decodability_review.py 6      -> only L6 books
    # py -3.12 scripts/_decodability_review.py 1-3    -> L1, L2, L3 books
    level_filter = None
    if len(sys.argv) > 1:
        spec = sys.argv[1]
        if "-" in spec:
            lo, hi = (int(x) for x in spec.split("-"))
            level_filter = set(range(lo, hi + 1))
        else:
            level_filter = {int(spec)}

    suffix = sys.argv[2] if len(sys.argv) > 2 else ""

    story_files = sorted((REPO / "data").glob("*_story_l*_book1.py"))
    print(f"Found {len(story_files)} story files", file=sys.stderr)

    books = []
    for p in story_files:
        try:
            b = collect_book(p, graphemes_by_level)
            if level_filter and b.get("level") not in level_filter:
                continue
            books.append(b)
        except Exception as e:
            print(f"  skip {p.name}: {type(e).__name__}: {e}", file=sys.stderr)

    if level_filter:
        print(
            f"Filter {level_filter}: kept {len(books)} books",
            file=sys.stderr,
        )

    books_block = render_books_block(books, graphemes_by_level)
    prompt = USER_TEMPLATE.format(books_block=books_block)

    out_dir = REPO / "output"
    out_dir.mkdir(exist_ok=True)
    (out_dir / f"_decodability_prompt{suffix}.txt").write_text(
        prompt, encoding="utf-8",
    )
    print(f"Prompt size: {len(prompt):,} chars", file=sys.stderr)

    text = None
    # Faster fall-through: try mini first with medium effort.  If that fails,
    # try full gpt-5 medium, then non-reasoning fallbacks.
    attempts = [
        ("gpt-5-mini", "medium"),
        ("gpt-5",      "medium"),
        ("gpt-4.1",    None),
        ("gpt-4o",     None),
    ]
    for model, effort in attempts:
        try:
            text = call_model(client, model, prompt, effort or "medium")
            print(f"  ok ({model})", file=sys.stderr)
            break
        except Exception as e:
            print(f"  {model} failed: {type(e).__name__}: {e}", file=sys.stderr)

    if not text:
        sys.exit("All models failed")

    (out_dir / f"decodability_review{suffix}.md").write_text(
        text, encoding="utf-8",
    )

    try:
        start = text.index("```json")
        end = text.index("```", start + 7)
        json_blob = text[start + 7:end].strip()
        parsed = json.loads(json_blob)
        (out_dir / f"decodability_review{suffix}.json").write_text(
            json.dumps(parsed, indent=2), encoding="utf-8",
        )
        print(f"Parsed JSON for {len(parsed)} books", file=sys.stderr)
    except Exception as e:
        print(f"Could not extract JSON: {e}", file=sys.stderr)

    print("\n=== FIRST 2000 CHARS OF SPECIALIST OUTPUT ===\n", file=sys.stderr)
    print(text[:2000], file=sys.stderr)


if __name__ == "__main__":
    main()
