"""One-off: ask OpenAI for senior-literacy review of TPT SATPIN worksheet design."""
import os
from pathlib import Path
from openai import OpenAI

env = Path(__file__).parent.parent / ".env"
for line in env.read_text().splitlines():
    if line.startswith("OPENAI_API_KEY="):
        os.environ["OPENAI_API_KEY"] = line.split("=", 1)[1].strip()

client = OpenAI()

prompt = """You are a senior systematic synthetic phonics (SSP) literacy consultant with classroom experience in UK Reception and Year 1.

I'm designing a free Teachers Pay Teachers (TPT) sampler for a decodable-book scheme called MyPhonicsBooks. The pack is built around the Level 1.1 book "Tap! Tap! Tap!" — SATPIN focus.

STORY CONTENT:
- Story words: sit, mat, tap, rat, bat, pat, cat, fat, naps
- Tricky words: I, the
- Read-aloud activity words: sat, pat, tap, nap
- Nonsense words from book: sap, tas, pim, nit, tib, pag, nas, sib, nat, pis, tup, sut
- Focus writing graphemes: s, a, t, p
- The story arc: child sits on a mat, hears tapping, guesses (rat? bat?), discovers a fat cat napping.

I need to design EXACTLY 5 one-page printable worksheets (A5) that:
1. Pedagogically scaffold from sound → blending → reading → writing → comprehension
2. Are tightly tied to THIS story (so teachers see real classroom value, not generic SATPIN)
3. Suit a child aged 4-5 at very early reading stage
4. Use British English

For each worksheet, give me:
- Title (child-friendly)
- Learning objective (one sentence, teacher-facing)
- Layout description (specific enough to implement in HTML/CSS — what's on page, where)
- Teacher note (one sentence)
- Sequence position (before/during/after reading the book)

Order the 5 worksheets so they form a coherent teaching sequence.

CONSTRAINTS:
- No grapheme outside SATPIN can be required for decoding (you may use 'I' and 'the' as tricky words)
- Letter formation lines for s, a, t, p only on the writing worksheet
- Keep it print-friendly: black/grey ink, no heavy fills
- Each page should be self-explanatory to the teacher

Reply in under 700 words. Be opinionated about the sequence — tell me which worksheet you'd cut if I could only have 4, and which you'd add if I could have 6. I trust your judgment on what a real teacher needs."""

resp = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": prompt}],
    temperature=0.4,
)
print(resp.choices[0].message.content)
