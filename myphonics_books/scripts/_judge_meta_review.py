"""
Meta-review: feed the v1 worksheets that the human user saw and called
'terrible' back to gpt-5.5 along with the user's verbatim complaint.
Ask the model: 'You are the strict pedagogy judge. What did you miss?
What dimensions should your judging framework include that the
four-dimension v2 framework (decodability / makes_sense / child_access
/ aesthetic) does not?' Save the response so the user can read it.
"""

import base64
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

import fitz  # PyMuPDF
from openai import OpenAI

env = ROOT / ".env"
for line in env.read_text(encoding="utf-8").splitlines():
    if line.startswith("OPENAI_API_KEY="):
        os.environ["OPENAI_API_KEY"] = line.split("=", 1)[1].strip()

client = OpenAI()

# ---- The actual user complaint, verbatim from the conversation ----
USER_FEEDBACK = """\
This is the verbatim feedback the product founder gave AFTER seeing the
shipped worksheets (paid TPT bundle for ages 4-7):

(1) "the worksheets are terrible most dont even make sense"
(2) "who approved them in the workflow"
(3) "what was the research behind"
(4) "GPT 4O? WHY NOT GPT 5.5 THATS WHY IM PAYING FOR THE API"
(5) "NOT JUST DECODABILITY, actually does it make sense and can kids
     access clearly without teacher input mostly not always."
(6) "does the aesthetic make sense?"
(7) "so much is wrong with that."

The previous judging framework rated worksheets on 4 dimensions:
  - decodability (every child-facing word is allowed at this level)
  - makes_sense (the task is coherent)
  - child_access (a 4-7yo can engage without teacher reading instructions)
  - aesthetic (warm, branded, not sterile)
"""


# ---- Sample of v1 worksheets to show the judge ----
SAMPLE_BUNDLES = [
    ("L1.1", "Tap! Tap! Tap!", "L1/1_1_Worksheets.pdf",
     ["s,a,t,p,i,n"], "Starting Stories"),
    ("L4.1", "The Purple Purse", "L4/4_1_Worksheets.pdf",
     ["ur,er"], "Building Fluency"),
]


def rasterize(pdf_path: Path) -> list[str]:
    """Return list of base64-encoded PNGs, one per page."""
    out = []
    with fitz.open(pdf_path) as d:
        for i in range(len(d)):
            pix = d[i].get_pixmap(dpi=110)
            png_bytes = pix.tobytes("png")
            out.append(base64.b64encode(png_bytes).decode("ascii"))
    return out


def main():
    OUT = ROOT / "output" / "worksheet_plan" / "_judge_meta_review.md"
    OUT.parent.mkdir(parents=True, exist_ok=True)

    transcript = "# gpt-5.5 meta-review of the v1 worksheets it judged (or would have judged)\n\n"
    transcript += USER_FEEDBACK + "\n\n"
    transcript += "---\n\n"

    for sub_level, title, rel_path, focus, level_name in SAMPLE_BUNDLES:
        full = ROOT / "output" / "worksheets" / rel_path
        if not full.exists():
            print(f"  skip {sub_level} (no file)")
            continue
        print(f"  reviewing {sub_level} {title}…")
        pages = rasterize(full)

        system = (
            "You are Dr. Eleanor Marsh, a Reception/KS1 literacy specialist "
            "with 28 years of UK classroom experience, an EdD in early "
            "literacy from UCL IOE, and a published reviewer for the Reading "
            "Reform Foundation. You judge worksheets ruthlessly. You were "
            "previously asked to evaluate phonics worksheets on four "
            "dimensions: decodability, makes_sense, child_access, aesthetic. "
            "These worksheets were SHIPPED. The founder saw them and "
            "complained. Your job now is METACOGNITIVE: identify what your "
            "judging framework MISSED, and propose specific additions or "
            "stricter thresholds. Be brutally honest about your own gaps."
        )

        content_blocks = [
            {
                "type": "text",
                "text": (
                    f"Worksheet bundle: {title} ({sub_level}, Level {level_name}, "
                    f"focus sounds: {focus}). Five pages attached.\n\n"
                    f"{USER_FEEDBACK}\n\n"
                    "Tasks for you now:\n\n"
                    "A) Look at every page and list EVERY pedagogical issue "
                    "you can see — including issues outside the four-dimension "
                    "framework. Specific. Page by page if helpful.\n\n"
                    "B) Identify which of these issues a STRICT four-dimension "
                    "judge (decodability / makes_sense / child_access / aesthetic) "
                    "would have caught. Which would have slipped through?\n\n"
                    "C) Propose CONCRETE additional judging criteria or stricter "
                    "thresholds we should add for the rebuild. Be specific — give "
                    "criterion name + the rule that triggers a fail. We will add "
                    "these to the v2 judge system prompt.\n\n"
                    "D) Identify any DIMENSION ENTIRELY MISSING from the v2 "
                    "framework that a senior literacy specialist would weight "
                    "heavily. E.g. cognitive load, scaffolding, formative-"
                    "assessment value, motivation, transferability, dignity of "
                    "the child, etc.\n\n"
                    "Write as a senior reviewer to the engineering team. ~600 words."
                ),
            }
        ]
        for png_b64 in pages:
            content_blocks.append(
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/png;base64,{png_b64}"},
                }
            )

        resp = client.chat.completions.create(
            model="gpt-5.5",
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": content_blocks},
            ],
        )
        review = resp.choices[0].message.content

        transcript += f"## {sub_level} — {title}\n\n{review}\n\n---\n\n"
        print(review[:400] + ("…" if len(review) > 400 else ""))
        print()

    OUT.write_text(transcript, encoding="utf-8")
    print(f"\nTranscript saved -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
