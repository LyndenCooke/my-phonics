"""Generate low-key affiliate-offer emails per audience type.

The pitch: 40% commission on sales they drive through their channel/audience.
This is a creator-partner offer, not a freebie hand-out — so all three
audience flavours are people with a public audience to recommend through.

  - youtuber   — phonics / early-reading / homeschool YouTube creators
  - teacher    — teacher with an audience: blog, TPT store, IG, YouTube
  - parent     — parent influencer / mum blogger / mum YouTube creator

Generates N variants per audience (default 3) so you can A/B test.
Each variant = a complete subject line + body, ready to paste into GHL.

Uses direct httpx POST to OpenAI (bypasses the SDK which was hanging on this
machine — kept for reliability).

Run:
    py -3.12 write_email_variants.py                          # all 3 audiences x 3 variants
    py -3.12 write_email_variants.py --audience teacher --n 5
    py -3.12 write_email_variants.py --model gpt-5-mini
"""
from __future__ import annotations

import argparse
import os
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


BRAND = """\
MyPhonicsBooks is a small, indie-made UK phonics programme. Print-at-home A5
decodable readers matched to the Letters and Sounds progression. The unusual
bit: every book is set in a different contemporary culture around the world
(Birmingham, Nairobi, Yokohama, Cairo, etc.). Every word in every story is
either decodable at the level or a listed tricky word. 15 books built so far
across Levels 1-3, 17 more in production. Founder: Lynden Cooke.
"""

CORE_OFFER = """\
The offer in every email: become an affiliate partner and earn 40% commission
on any sales they drive through their channel / audience. The books are
print-at-home digital products, so the margin supports a generous split.
40% is a strong rate — well above industry standard for ed-tech (10-20% is
typical) — and that's worth landing without being pushy. We send them sample
PDFs to look at before they commit, plus an affiliate link that tracks sales.
No exclusivity, no minimums, no fees.
"""

WRITING_RULES = """\
- British English (colour, organised, mum, favourite).
- Warm, casual, peer-to-peer. Indie maker reaching out, NOT a sales rep.
- No emojis. No exclamation marks. No flattery.
- Lead with the partnership / 40% angle clearly but without hype. Numbers
  carry the weight; we don't need to dress them up.
- 90-140 words for the body. Short sentences. One idea per sentence.
- Open with "Hi there," (we don't know the name).
- The call-to-action is soft: "would you be up for a quick look at the sample
  PDFs and an affiliate link?" — not "sign up now".
- Sign off "Cheers, Lynden / MyPhonicsBooks".
- End with the literal placeholder line {unsubscribe} on its own.
- ASCII only. Specifically: use straight quotes (' "), use regular hyphens
  (-), NEVER em-dash, NEVER en-dash, NEVER curly quotes.

BANNED OPENINGS (do not use ANY of these — they are vendor-pitch tells):
- "I hope this..."   "Hope this..."   "I hope you..."
- "I'm reaching out..."   "I wanted to reach out..."
- "I came across your..."   "I stumbled upon..."   "I noticed your..."
- "Your content perfectly aligns..."
- "I know your audience..."

BANNED PHRASES anywhere in the email:
- "piques your interest"   "catches your interest"   "sparks your interest"
- "I wanted to introduce..."   "Let me introduce..."
- "select few creators"   "carefully selected"   "hand-picked"
- "in need"   "make a difference"   "elevate"   "synergy"
- "perfectly aligns"   "perfect fit"

If you find yourself reaching for any of these, rewrite from scratch instead.
"""

AUDIENCES: dict[str, str] = {
    "youtuber": """\
Audience: A YouTube creator in the phonics / early-reading / EYFS / homeschool
/ "teach my kid to read" niche. They have an audience that trusts their book
and curriculum recommendations — that audience is exactly our buyer. They
already get pitch emails so the message must feel like a real partnership
offer from another small indie maker, not a generic creator-deal blast.

What makes the affiliate angle work for them: their audience is parents and
homeschool teachers who buy phonics resources regularly. A single recommended
video can drive hundreds of sales — at 40% they earn meaningfully, and we
get distribution to exactly the right buyer.

Worth landing in the email: the cultural-diversity angle (every book set in
a different contemporary culture) is the differentiator that makes the books
actually worth recommending — not just another decodable reader.""",
    "teacher": """\
Audience: A teacher with a real audience — they run a blog, a TPT (Teachers
Pay Teachers) store, an Instagram, or a YouTube channel that other teachers
and homeschool parents follow. They are time-poor, allergic to vendor
pitches, and protective of their audience's trust. They will not recommend
anything mediocre, but they will champion something that fits the science
of reading and saves their followers time.

What makes the affiliate angle work for them: they already share resources
with their following, often for free. A 40% commission on a product they
genuinely like is unusual generosity in the ed-tech space (most TPT
affiliate-style deals are 10-15%) and that itself is worth noting.

The tone they respond to: another teacher / indie maker reaching out, not a
salesperson. Acknowledge they get pitched constantly. Make it clear we're
sending samples first so they can decide whether the books actually deserve
a recommendation.""",
    "parent": """\
Audience: A parent influencer — a mum (or dad) who runs a blog, YouTube
channel, Instagram account, or TikTok focused on parenting, homeschool,
early learning, or reading. Their following is other parents in the same
stage. They share recommendations, routines, and resources. Their audience
trusts them more than they trust brands.

What makes the affiliate angle work for them: their followers are buying
phonics resources for their own kids right now. A book recommendation tied
to a clear affiliate link converts well in this niche. 40% commission is
generous and worth pointing out plainly.

Tone: parent-to-parent, indie-maker honest. The hook is that finally there
is a decodable reader range that doesn't feel boring or generic (each book
opens a cultural window). No fear-mongering about reading struggles. No
"your followers need this". Just: here is the offer, here are samples,
have a look.""",
}


def build_system_prompt(audience_brief: str, n_variants: int) -> str:
    return f"""\
You write short, low-key, peer-to-peer outreach emails for MyPhonicsBooks.
These are affiliate-partnership invitations — not freebie hand-outs.

# Brand
{BRAND}

# Audience for this run
{audience_brief}

# Core offer (must be clear in every variant)
{CORE_OFFER}

# Writing rules
{WRITING_RULES}

# Task
Write {n_variants} different variants of the same email. They should test
genuinely different angles or openings, not just reworded versions of one
template. Vary:
- the opening line / hook
- which part of the offer leads (the 40% commission? the cultural-diversity
  angle? the sample PDFs? a question about their audience?)
- the closing soft ask (or no soft ask)

# Output format — EXACTLY this, no preamble, no commentary
Separate the variants with a line that is exactly:
===VARIANT===

For each variant write the subject line on the first line as:
Subject: <subject>

Then a blank line, then the email body. End the body with the literal line:
{{unsubscribe}}

Do not number the variants. Do not write any commentary outside the variant
blocks.
"""


def call_openai(model: str, system: str, user: str, timeout: int = 60) -> str:
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise RuntimeError("OPENAI_API_KEY not set in env.")
    payload: dict = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    }
    # gpt-5 family on chat.completions uses 'max_completion_tokens'; gpt-4 uses 'max_tokens'.
    if model.startswith(("gpt-5", "o")):
        payload["max_completion_tokens"] = 2000
    else:
        payload["max_tokens"] = 2000
        payload["temperature"] = 0.9  # encourage variety; reasoning models don't accept this

    r = httpx.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        json=payload,
        timeout=timeout,
    )
    if r.status_code != 200:
        raise RuntimeError(f"OpenAI {r.status_code}: {r.text[:500]}")
    data = r.json()
    return data["choices"][0]["message"]["content"]


def normalise_ascii(text: str) -> str:
    """Replace common non-ASCII chars the model sneaks in despite instructions."""
    repl = {
        "—": "-",  # em dash
        "–": "-",  # en dash
        "‘": "'",  # left single quote
        "’": "'",  # right single quote / apostrophe
        "“": '"',  # left double quote
        "”": '"',  # right double quote
        "…": "...",  # ellipsis
        " ": " ",  # non-breaking space
    }
    for k, v in repl.items():
        text = text.replace(k, v)
    return text


def split_variants(text: str) -> list[str]:
    text = normalise_ascii(text)
    parts = [p.strip() for p in text.split("===VARIANT===")]
    return [p for p in parts if p]


def write_variant_file(audience: str, idx: int, content: str, out_dir: Path) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"{audience}_v{idx}.txt"
    path.write_text(content + "\n", encoding="utf-8")
    return path


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--audience", choices=list(AUDIENCES) + ["all"], default="all")
    ap.add_argument("--n", type=int, default=3, help="Number of variants per audience")
    ap.add_argument("--model", type=str, default="gpt-4o",
                    help="OpenAI model. gpt-4o = fast/cheap, gpt-5 = higher quality")
    ap.add_argument("--out", type=str, default="output/email_variants")
    ap.add_argument("--dry-run", action="store_true", help="Print prompt, don't call API")
    args = ap.parse_args(argv)

    audiences = list(AUDIENCES) if args.audience == "all" else [args.audience]
    out_dir = Path(__file__).parent / args.out

    for audience in audiences:
        brief = AUDIENCES[audience]
        system = build_system_prompt(brief, args.n)
        user = f"Write {args.n} variants for audience: {audience}."

        if args.dry_run:
            print(f"\n========== {audience.upper()} ==========")
            print(system)
            continue

        print(f"\n========== {audience.upper()} ({args.n} variants, model={args.model}) ==========")
        t0 = time.time()
        try:
            text = call_openai(args.model, system, user, timeout=90)
        except Exception as e:
            print(f"FAIL: {e}")
            continue
        elapsed = time.time() - t0
        variants = split_variants(text)
        print(f"got {len(variants)} variants in {elapsed:.1f}s")

        if len(variants) < args.n:
            print(
                f"WARNING: expected {args.n} variants but got {len(variants)}. "
                "Model may have ignored the separator — saving raw output as fallback."
            )
            (out_dir / f"_raw_{audience}.txt").write_text(text, encoding="utf-8")

        for i, v in enumerate(variants, 1):
            path = write_variant_file(audience, i, v, out_dir)
            preview = v.splitlines()[0][:80] if v else ""
            print(f"  -> {path.name} | {preview}")

    print(f"\nAll variants written to {out_dir}/")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
