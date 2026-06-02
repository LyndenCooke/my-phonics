"""
Pedagogy review: ask an OpenAI model for a senior-pedagogue critique of
two design decisions in MyPhonicsBooks that the user has flagged as weak.

Run from `myphonics_books/`:
    py -3.12 scripts/_pedagogy_review.py

Output is printed and also saved to `output/pedagogy_review.md`.
"""

import os
import sys
from pathlib import Path

ENV_PATH = Path(__file__).parent.parent / ".env"
api_key = os.environ.get("OPENAI_API_KEY")
if not api_key and ENV_PATH.exists():
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        if line.startswith("OPENAI_API_KEY="):
            api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
            break
if not api_key:
    sys.exit("No OPENAI_API_KEY found in env or .env")

from openai import OpenAI

client = OpenAI(api_key=api_key)

SYSTEM = (
    "You are a senior literacy specialist (UK / British English) who has "
    "designed phonics intervention programmes used in primary schools. "
    "You combine systematic synthetic phonics expertise (Letters & Sounds, "
    "RWI, Phonics Bug) with classroom realism: parents at the kitchen "
    "table, ages 4-8, ten-minute attention spans, A5 print. You give "
    "concrete, implementable advice — exact wording, exact layout — not "
    "platitudes. You reason out loud about WHY each choice is the right "
    "one for the child. You push back on weak design instead of validating "
    "it. Do not list generic 'best practice' — every recommendation must be "
    "specific to the brief below and rewriteable into a Jinja2 template by "
    "an engineer."
)

USER = """
# Brief — REVISED with phonics-density constraint

I'm designing decodable phonics readers as printable A5 PDFs for ages 4-8,
British English, aligned to Letters & Sounds.  The number of books per
level is driven by phonics coverage, NOT curriculum pacing.  Hard fixed
distribution:

  L1  = 10 books  (Set 1 graphemes, ~30+ sounds — Phase 2)
  L2  = 6 books   (long vowels — Phase 3)
  L3  = 5 books   (split digraphs + clusters — Phase 4)
  L4  = 4 books   (complex vowels, multi-syllable — Phase 5a)
  L5  = 4 books   (final Set 3, comprehension focus — Phase 5b)
  L6  = 4 books   (suffixes, independent reading — Y2 secure)
                  ────────────────────────────────────────────
  TOTAL = 33 books

Each book is 16-20 pages.  The child can decode every word in their book;
this is the key constraint.

Page structure (current):
  1.  Cover
  2.  Guide for Grown-Ups
  3.  Sounds + Story Words (reference)
  4.  Trace & Form (letter formation + free-write lines)
  5-12. Story (6-8 pages with illustration)
  13. Sound Spotlight
  14. Read Words (sound-buttoned + handwriting practice)
  15. Tell the Story (4-image ordering + retell writing)
  16. Talk About It (3 comprehension questions + draw favourite part)
  17. Word Workshop (LCWC + Hunt + Grammar Spotlight)
  18. Listen and Write (parent-dictated phoneme boxes)
  19. Reading Star certificate
  20. Back cover

I want you to focus on ONE thing this consultation: design the WRITING
JOURNEY across all 33 books, with the grammar goals structure that
supports it.  Treat the previous reply you gave as superseded where it
proposed a 6/6/6/6/5/4 split — that was a misunderstanding of how the
levels are sized.

---

# What I want from you

(A) The WRITING JOURNEY — narrative arc.

   Tell me the story of a child's writing development across all 33 books
   as a coherent journey.  At each waypoint name what the child can DO as
   a writer, what's fragile, what just clicked.  Specifically:

   - L1.1 (entry):    what's the child writing? (probably nothing yet)
   - L1.5 (mid-L1):   what's emerging?
   - L1.10 (end-L1):  what's consolidated?  (transition to L2)
   - L2 endpoint, L3 endpoint, L4 endpoint, L5 endpoint, L6.4 (final).

   Write this as a 6–8 paragraph journey, not a table.  Give it a name.
   I want to be able to read this aloud to a parent and have them
   recognise their child somewhere on the path.

(B) The GRAMMAR GOALS STRUCTURE — the teaching mechanic.

   For each of the 33 books, give me:
   - focus_skill        — the new thing this book teaches
   - carry_review       — 1–2 prior skills quietly recapped
   - mastery_signal     — what the child does that proves it landed
   - five_touchpoints   — the five places in the book this skill manifests
                          (Guide for Grown-Ups tip / Reference Writing Tip /
                          Spot It margin nudge on a story page / Retell
                          scaffold note / Word Workshop Spotlight + Listen-
                          and-Write extension).  Per-book microcopy.

   Layout this as a table or per-level sub-list.  Keep it actionable for
   a developer who will paste it into a Python data file.

(C) The SCAFFOLD that supports the journey.

   For each phase of the journey (not each book), describe the writing
   scaffold the page should provide.  How does the retell scaffold,
   Writing Goals checklist, and Word Workshop change in shape — not just
   content — across the journey?  Should anything be added or removed?

(D) Push back on anything in this brief that's the wrong call.  Including
   the 33-book distribution if you think a different shape would serve
   the writing journey better even given the phonics-coverage constraint.

# Old problems for context (already partially solved)

# Problem 1 — The retell scaffold (CONTEXT — already partly addressed)

On page 15 ("Tell the Story") the child does picture ordering then writes
a retell.  My current scaffold for L2-L3 is THREE labelled steps, each
followed by writing lines:

    FIRST   firstly                    [3 ruled lines]
    THEN    next                       [3 ruled lines]
    LAST    in the end                 [3 ruled lines]

(The first word is the LABEL — bold, all caps, level-coloured.  The second
word is a small italic HINT in grey, intended as an alternative starter.)

The user has called out — correctly — that this models terrible writing.
We're asking the child to use capitals, finger spaces and full stops, but
the scaffold itself shows "FIRST  firstly" with no capital, no comma, no
full stop, AND two synonymous time-words in a row that don't compose into
a sentence.  We should be MODELLING the sentence the child will write.

Above the writing area we also show a "Writing Goals — tick when you
remember" strip with checkboxes:
  - "A  Capital at the start"
  - "⎵  Finger spaces"
  - ".  Full stop at the end"
  - "?  Question mark if it asks"  (L3+)
  - "+  Joining word (and / but / because)"  (L4+)
  - "★  A 'wow word' (adjective)"  (L5+)
  - '" "  Speech marks for what someone said'  (L6+)

Tasks I want from you:

  (1.a) Redesign the retell scaffold for L1, L2, L3, L4, L5, L6 — give me
        the EXACT label text, hint text, sentence starter (if any), and
        line count for each level.  Include the punctuation in the visible
        scaffold so the child sees the conventions they're supposed to
        practise.  Make L6 substantively different from L1 — don't just
        bolt on more lines.

  (1.b) Critique the Writing Goals strip too.  Should the icons be
        different?  Are the labels age-appropriate?  Is the carry-forward
        logic (L1 = 3 goals, L6 = 7 goals) sound, or do we hit cognitive
        overload?  Recommend a version per level.

---

# Problem 2 — Where grammar lives in the book

Right now grammar is bolted on as a single "Grammar Spotlight" box on
page 17, three short items.  L3.1's spotlight is "End Marks: . or ?" with
three sentences pulled from the story, each with the end mark stripped
and two tickbox choices.

The user is unhappy with this.  Quote: "lets maybe plan how we can
introduce grammer skills or smething else throughout the the pdf books
aswell so that the children are lowkey learning these skills too" —
i.e. grammar should THREAD through the whole book (story → reference →
activity → retell → spotlight → listen-and-write), not sit in one box.
And: "imagine each book is building upon eachother. yes some levels might
need a bit of repition, but level one could have multiple simple things"
— per-book ladder, not per-level.

Tasks I want from you:

  (2.a) Design the grammar/conventions curriculum spine for L1-L6 (33
        books).  For each level, name the strand(s) that level OWNS
        (e.g. "L1 = sentence boundaries: capitals, full stops, finger
        spaces").  For each sub-level book, name the focus skill PLUS
        which earlier skill(s) get a quick recap.  Be opinionated — tell
        me which strands belong where and why.

  (2.b) For each strand, name the FIVE places in the book where it
        manifests (e.g. on the reference page as a tip, embedded in the
        story sentences as a feature to notice, in the retell scaffold as
        an expected goal, in the Word Workshop as the spotlight task, in
        Listen-and-Write as a sentence-level dictation extension).  Give
        me concrete copy for at least two example books — I'd suggest
        L1.1 (where it all starts) and L3.1 (mid-curriculum, the book
        I'm currently iterating).

  (2.c) Push back on anything in my brief above that you think is the
        wrong call.  This is what I want most: I'm not looking for
        validation, I'm looking for the design decisions a literacy
        specialist would make differently.

---

# Constraints

- British English ('full stop' not 'period', 'colour', 'mum').
- Every word in every story is decodable at the level OR a known tricky
  word.  Grammar tasks must respect this.  If a grammar task needs words
  outside the decodable set, it has to come from the story itself
  (where every word is decodable by definition) or from a tricky word.
- No copyright text from real schemes (RWI, Letters & Sounds).
- A5 page = ~136mm wide x ~186mm of usable vertical content.  Things
  must fit.
- A child often works alone or with a parent at home — no teacher voice.

Format your response with clear headings so I can route each part to the
right code change.  Be opinionated.  Be specific.  Quote exact wording I
can paste into the template.
"""

OUT = Path("output/pedagogy_review_v2_writing_journey.md")


def call(model: str) -> str:
    print(f"  -> trying {model}", file=sys.stderr)
    r = client.responses.create(
        model=model,
        instructions=SYSTEM,
        input=USER,
        reasoning={"effort": "high"} if model.startswith(("gpt-5", "o")) else None,
    )
    return r.output_text


def main():
    for model in ("gpt-5", "gpt-5-mini", "gpt-4.1", "gpt-4o"):
        try:
            text = call(model)
            break
        except Exception as e:
            print(f"  {model} failed: {type(e).__name__}: {e}", file=sys.stderr)
    else:
        sys.exit("all models failed")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(f"# Pedagogy review (model: {model})\n\n{text}\n",
                   encoding="utf-8")
    print(f"\nSaved to {OUT}")
    print("\n" + "=" * 72)
    print(text)


if __name__ == "__main__":
    main()
