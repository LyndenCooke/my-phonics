"""Author the per-level Grammar worksheet CONTENT via the OpenAI specialist.

The L6 booklet was hand-built as the exemplar. This authors the other levels'
content (L1-L5, L7, L8) from the scheme of work, constrained by each level's
DECODABLE graphemes + tricky words, mapped onto the 6 implemented worksheet
formats, in the exact GrammarUnit shape the flowy engine renders. It emits
worksheet-engine/src/data/grammar/l{n}.ts for each level.

This is a DRAFT generator — content must be decodability/pedagogy QA'd before
publishing (see grammar_scheme_of_work.md §4 + the Curriculum Ledger).

Usage:
    py -3.12 scripts/author_grammar.py 1 2 3 4 5 7 8     # levels
    py -3.12 scripts/author_grammar.py all
"""
from __future__ import annotations
import json, sys, re
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")
REPO = ROOT.parent
OUT_DIR = REPO / "worksheet-engine" / "src" / "data" / "grammar"

GRAPHEMES = json.loads((ROOT / "data" / "graphemes_by_level.json").read_text())
TRICKY = json.loads((ROOT / "data" / "tricky_words_by_level.json").read_text())

# Level chrome (matches the ledger colour system already baked into levelThemes).
LEVELS = {
    1: ("Foundations", "Level 1 · Ditties", "3 to 5 words"),
    2: ("First Punctuation", "Level 2 · First Sounds", "3 to 6 words"),
    3: ("Names and Questions", "Level 3 · Special Friends", "4 to 7 words"),
    4: ("Joining and Endings", "Level 4 · Longer Sounds", "4 to 8 words"),
    5: ("Word Building and Order", "Level 5 · New Spellings", "5 to 10 words"),
    7: ("Apostrophes and Cohesion", "Level 7 · Reading Together", "8 to 15 words"),
    8: ("Mastery and Year 3 Readiness", "Level 8 · Reading Champion", "varied"),
}

# Per-level units from grammar_scheme_of_work.md §5, each mapped to ONE of the
# six implemented formats: tickgrid | build | cloze | circle | match | rewrite.
UNITS = {
    1: [
        ("G-L1.1", "What is a word?", "Find each word", "A word is one unit you can point to.", "EYFS Literacy", ["word"], "circle"),
        ("G-L1.2", "Say a sentence", "Read it, then write it", "Say a whole idea, then write it.", "EYFS C&L", ["sentence"], "rewrite"),
        ("G-L1.3", "Finger spaces", "Write it again with finger spaces", "Leave a finger space between words.", "EYFS Literacy", ["word", "finger space"], "rewrite"),
    ],
    2: [
        ("G-L2.1", "Capital letters start sentences", "Write each sentence with a capital letter", "A sentence starts with a capital letter.", "Year 1 punctuation", ["capital letter", "sentence"], "rewrite"),
        ("G-L2.2", "Full stops end sentences", "Write each sentence with a full stop", "A sentence ends with a full stop.", "Year 1 punctuation", ["full stop"], "rewrite"),
        ("G-L2.3", "The word I", "Write each sentence with a capital I", "The word I is always a capital letter.", "Year 1 punctuation", ["capital letter"], "rewrite"),
        ("G-L2.4", "Is it a sentence?", "Tick the one that is a sentence", "A sentence makes a whole idea.", "Year 1 sentence", ["word", "sentence"], "tickgrid"),
    ],
    3: [
        ("G-L3.1", "Capital letters for names", "Tick the words that are names", "Names of people and places take a capital letter.", "Year 1 punctuation", ["capital letter", "name"], "tickgrid"),
        ("G-L3.2", "Question marks", "Write each question with a question mark", "A question ends with a question mark.", "Year 1 punctuation", ["question mark"], "rewrite"),
        ("G-L3.3", "Statement or question?", "Tick statement or question", "A statement tells; a question asks.", "Year 1 sentence", ["statement", "question"], "tickgrid"),
        ("G-L3.4", "Question words", "Draw a line to match the question to its answer", "Questions can start who, what, where, when.", "Year 1 sentence", ["question"], "match"),
    ],
    4: [
        ("G-L4.1", "Joining with and", "Write the two ideas as one, joined with and", "Join two ideas with and.", "Year 1 sentence", ["sentence"], "rewrite"),
        ("G-L4.2", "Choose the end mark", "Tick the right end mark", "Choose . or ? or ! to end the sentence.", "Year 1 punctuation", ["full stop", "question mark", "exclamation mark"], "tickgrid"),
        ("G-L4.3", "Capital letters for days", "Write each day with a capital letter", "Days of the week take a capital letter.", "Year 1 punctuation", ["capital letter"], "rewrite"),
        ("G-L4.4", "One and more than one", "Draw a line to match one to more than one", "Add -s or -es to make a plural.", "Year 1 word", ["singular", "plural"], "match"),
        ("G-L4.5", "Add -ing, -ed, -er", "Build the new word", "Add -ing, -ed or -er to the root word.", "Year 1 word", ["suffix"], "build"),
    ],
    5: [
        ("G-L5.1", "Double then add the ending", "Build the new word", "Some short words double the last letter before -ing or -ed.", "Year 1/2 word", ["suffix"], "build"),
        ("G-L5.2", "The prefix un-", "Draw a line to match the word to its un- word", "The prefix un- means not.", "Year 1 word", ["prefix"], "match"),
        ("G-L5.3", "Commas in a list", "Write each list with commas", "Use commas to separate items in a list.", "Year 2 punctuation", ["comma"], "rewrite"),
        ("G-L5.4", "Put it in order", "Write the three steps in order with First, Next, Then", "Order events with First, Next, Then.", "Year 1 text", ["sentence"], "rewrite"),
        ("G-L5.5", "Nouns and verbs", "Circle the noun. Underline the verb", "A noun is a thing; a verb is an action.", "Year 1/2 word classes", ["noun", "verb"], "circle"),
        ("G-L5.6", "Words before a noun", "Build the noun phrase", "A noun can have words before it.", "Year 1/2 word", ["noun"], "build"),
    ],
    7: [
        ("G-L7.1", "The possessive apostrophe", "Write each one with an apostrophe", "An apostrophe shows something belongs to one person.", "Year 2 punctuation", ["apostrophe"], "rewrite"),
        ("G-L7.2", "Which homophone?", "Write the best word in each gap", "Homophones sound the same but are spelled differently.", "Year 2 word", ["homophone"], "cloze"),
        ("G-L7.3", "Tell it in order", "Write the recount with time words", "Order a recount with first, next, then, after that, finally.", "Year 2 text", ["sentence"], "rewrite"),
        ("G-L7.4", "Was -ing", "Write each sentence in the was -ing form", "The progressive tense shows an action going on.", "Year 2 text", ["verb", "tense"], "rewrite"),
        ("G-L7.5", "Suffix sort", "Tick the suffix each word uses", "Suffixes -ness -ful -less -ly build new words.", "Year 2 word", ["suffix"], "tickgrid"),
        ("G-L7.6", "Build a recount", "Write three sentences with a list and time words", "Use commas in a list and time words in a recount.", "Year 2 punctuation/text", ["comma"], "rewrite"),
    ],
    8: [
        ("G-L8.3", "One or more than one owner", "Tick: one owner or more than one", "An apostrophe before -s shows one owner; after -s shows more.", "Year 2/3 punctuation", ["apostrophe", "singular", "plural"], "tickgrid"),
        ("G-L8.4", "Change the opener", "Write each sentence with a different opener", "You can open a sentence in different ways.", "Year 2/3 sentence", ["clause", "subordinate clause"], "rewrite"),
        ("G-L8.6", "Be a proofreader", "Write each sentence again, fixed", "Find and fix the mistakes.", "Year 2/3 text", ["sentence", "punctuation"], "rewrite"),
        ("G-L8.1", "Fronted adverbials", "Write each sentence with the opener and a comma", "Move the adverbial to the front and add a comma.", "Year 3 sentence", ["adverbial", "comma"], "rewrite"),
        ("G-L8.2", "Speech marks", "Write each line with speech marks", "Inverted commas go around the words someone says.", "Year 3 punctuation", ["inverted commas", "direct speech"], "rewrite"),
        ("G-L8.5", "Time, place and cause", "Write the best word in each gap", "Words like before, outside and because add time, place and cause.", "Year 3 sentence", ["conjunction", "preposition", "adverb"], "cloze"),
    ],
}

# Line-art decoration pool (objects that exist as line art). Assigned distinct
# within each booklet so no object repeats on the same level.
DECOR = ["owl", "tree", "leaf", "feather", "moon", "monkey", "banana", "coins", "paintbrush", "abc"]
DECOR_SIZE = {"tree": 56, "owl": 54, "monkey": 52, "feather": 44, "leaf": 46, "banana": 46,
              "moon": 40, "coins": 40, "paintbrush": 42, "abc": 44}

FORMAT_SPEC = """Each unit object MUST include these common fields:
  id (kebab e.g. "g-l4-1"), code (e.g. "G-L4.1"), name, doInstruction, objective,
  ncLink, terminology (string[]), anchorBook (use "Level <n> readers"),
  s1: { prompt, answer, note? }  // the worked "I do" example, already solved
  weDoCount (1 or 2), apply: { prompt }  // a short "use it in writing" task,
  format, and the payload for that format:

  tickgrid: { "columns": string[], "rows": [{ "text": string, "answer": <one column> }] }   // 6 rows max
  build:    { "wordBank": string[], "rows": [{ "base": string, "answer": string }] }          // 4 rows
  cloze:    { "wordBank": string[], "bankNote"?: string, "rows": [{ "before": string, "after": string, "answer": string }] }  // 4 rows
  circle:   { "targets": [{ "label": string, "mark": "circle"|"underline" }], "rows": [{ "text": string, "finds": [{ "word": string, "target": string }] }] }  // 4 rows
  match:    { "pairs": [{ "left": string, "right": string }] }   // 5 pairs
  rewrite:  { "rows": [{ "text": string, "answer": string }] }   // 4 rows; text = the prompt the child fixes, answer = the corrected version

For cloze, put "___" in the s1.prompt where the gap is. For rewrite/tickgrid the
s1.prompt is the example item and s1.answer is the worked answer."""

SYS = "You are a senior UK systematic-synthetic-phonics and primary-grammar specialist. You author decodable grammar worksheet content. You only ever use words a child could decode at the given level. British English. Output STRICT JSON only."


def prompt_for(level: int) -> str:
    gk = f"level_{level}"
    graph = GRAPHEMES[gk]["cumulative_graphemes"]
    tricky = TRICKY[gk]["cumulative"]
    name, subtitle, band = LEVELS[level]
    units = UNITS[level]
    unit_lines = "\n".join(
        f'  {c}: name="{n}" do="{do}" objective="{o}" nc="{nc}" terminology={t} format={fmt}'
        for (c, n, do, o, nc, t, fmt) in units
    )
    return f"""Author the Grammar worksheet content for {name} ({subtitle}).

DECODABLE RULE (hard): every example word must be built ONLY from these cumulative
graphemes, OR be one of the cumulative tricky words. Do not use any other words.
Graphemes: {graph}
Tricky words allowed: {tricky}
Sentence-length band: {band}. British English. Keep it simple and warm for a young child.

Produce one unit object per spec below, in order, each matching its format:
{unit_lines}

{FORMAT_SPEC}

Return STRICT JSON: {{ "units": [ ... ] }} with no commentary."""


def emit_ts(level: int, units: list) -> str:
    name, subtitle, _band = LEVELS[level]
    pool = DECOR[level % len(DECOR):] + DECOR[: level % len(DECOR)]  # rotate per level
    for i, u in enumerate(units):
        u.setdefault("level", level)
        u["levelLabel"] = f"L{level}"
        u["strand"] = "Grammar"
        u["levelSubtitle"] = subtitle
        key = pool[i % len(pool)]
        u["decorations"] = [{"key": key, "xMm": 204 - DECOR_SIZE[key], "yMm": 283 - DECOR_SIZE[key], "sizeMm": DECOR_SIZE[key]}]
    body = json.dumps(units, ensure_ascii=False, indent=2)
    return (
        "import type { GrammarUnit } from '@/data/grammarSchema';\n\n"
        f"// L{level} GRAMMAR — DRAFT content authored by scripts/author_grammar.py via the\n"
        "// OpenAI specialist, constrained to this level's decodable graphemes + tricky\n"
        "// words (grammar_scheme_of_work.md §5). NEEDS decodability/pedagogy QA before publish.\n\n"
        f"const units: GrammarUnit[] = {body};\n\nexport default units;\n"
    )


def author(level: int, client: OpenAI):
    print(f"-> L{level} authoring...")
    for model in ("gpt-4.1", "gpt-4o", "gpt-4o-mini"):
        try:
            r = client.chat.completions.create(
                model=model, temperature=0.4,
                response_format={"type": "json_object"},
                messages=[{"role": "system", "content": SYS}, {"role": "user", "content": prompt_for(level)}],
            )
            data = json.loads(r.choices[0].message.content)
            units = data["units"]
            (OUT_DIR / f"l{level}.ts").write_text(emit_ts(level, units), encoding="utf-8")
            print(f"   OK L{level} ({len(units)} units) via {model}")
            return True
        except Exception as e:
            print(f"   ! {model} failed: {str(e)[:160]}")
    return False


def main():
    arg = sys.argv[1:] or ["all"]
    levels = [1, 2, 3, 4, 5, 7, 8] if arg == ["all"] else [int(x) for x in arg]
    client = OpenAI()
    for lv in levels:
        author(lv, client)


if __name__ == "__main__":
    main()
