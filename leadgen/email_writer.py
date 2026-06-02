"""OpenAI-powered email writer for GoHighLevel.

Reads a leads CSV and writes per-row personalised email content. Two modes:

  fields  (default) — Adds structured custom fields to each row:
                      intro_line, value_prop_line, ps_line.
                      Your GHL email template uses these as merge tags.
                      Cheap and reviewable.

  full    — Writes a complete subject + email body per row.
            Output goes into `subject` and `email_body` columns.
            Drop into GHL as raw email per contact.
            More expressive, harder to QA at scale.

Per-audience prompt profiles: schools, teachers, parents. Pick the one that
matches the source CSV (or override with --audience).

Default provider is OpenAI (gpt-5-mini via the Responses API). Anthropic
(claude-haiku-4-5) is available as --provider anthropic.

Run:
    py -3.12 email_writer.py output/youtube_teachers.csv --audience teachers
    py -3.12 email_writer.py output/international_schools.csv --audience schools
    py -3.12 email_writer.py output/teacher_blogs.csv --audience teachers --mode full
    py -3.12 email_writer.py output/*.csv --audience teachers --dry-run
    py -3.12 email_writer.py output/youtube_teachers.csv --audience teachers --regenerate
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")
try:
    load_dotenv(Path(__file__).parent.parent / "myphonics_books" / ".env", verbose=False)
except Exception:
    pass


# ----- Brand context shared across all audience prompts ------------------------

BRAND_BACKGROUND = """\
MyPhonicsBooks is a small UK-built phonics programme. It produces print-at-home
A5 decodable readers matched exactly to the Letters and Sounds progression. The
distinctive thing: every single book is set in a different contemporary culture
around the world (a child in Birmingham reads about a child in Nairobi, Yokohama,
Cairo). Every word in every story is either decodable at the level or a listed
tricky word. Currently 15 books across Levels 1-3; 17 more in production. Print,
fold, staple. The founder is Lynden Cooke. British English throughout.
"""

WRITING_RULES = """\
- British English (colour, organised, mum, favourite, neighbour).
- Warm, direct, peer-to-peer. NOT corporate. NOT salesy.
- No emojis. No exclamation marks. No corporate fillers ("synergy", "elevate").
- No "I hope this finds you well". No "I came across your website".
- No false claims of having read their work; only reference things actually in
  the recipient context.
- 1 idea per sentence. Short sentences win.
- Never invent facts about the recipient — only use the fields provided.
"""


# ----- Audience profiles -------------------------------------------------------

AUDIENCE_PROFILES: dict[str, dict] = {
    "schools": {
        "audience_desc": (
            "Admissions, Head, or Principal at an international school (typically "
            "British/American/IB curriculum) outside the UK. Decision-maker on "
            "literacy resources. Receives lots of vendor email — must feel "
            "human and curriculum-led, not pitchy."
        ),
        "offer": (
            "Free sample PDFs (Level 1 + Level 3) to share with their early-years "
            "team. No charge, no signup. The goal is curiosity, not a close."
        ),
    },
    "teachers": {
        "audience_desc": (
            "Individual EYFS / Reception / Year 1 / Kindergarten / 1st-grade "
            "teacher or teacher-creator. Discovered via their YouTube channel, "
            "blog, TPT store, or Instagram. Practical, time-poor, allergic to "
            "marketing-speak. Will respond to peer-to-peer messages from another "
            "indie maker in the same space."
        ),
        "offer": (
            "Free Level 1 + Level 3 sample PDFs to try with their class. Soft "
            "ask: if they try one, share honest feedback. Even softer ask: pass "
            "along to a colleague who teaches phonics."
        ),
    },
    "parents": {
        "audience_desc": (
            "Parent of a child aged 4-8 who is learning to read. Likely worried "
            "about reading progress, possibly frustrated with mismatched school "
            "books. NOT cold-emailed; this audience opts into the funnel via "
            "Skool/lead magnets. Email tone follows the existing PARENT_OUTREACH "
            "doc: fear (ethical) -> solution -> action. One message per email. "
            "Islamic-values-friendly. No faces in creative."
        ),
        "offer": (
            "Free 3 books matched to the child's decoding level + access to "
            "the Skool community for parent training and support."
        ),
    },
}


# ----- Prompt construction -----------------------------------------------------

def system_prompt(audience: str, mode: str) -> str:
    profile = AUDIENCE_PROFILES[audience]
    audience_desc = profile["audience_desc"]
    offer = profile["offer"]
    if mode == "fields":
        output_spec = """\
Return STRICT JSON with exactly these three keys:

  "intro_line":      ONE sentence. Opens the email warmly. Must reference one
                     concrete thing from the recipient context (their school's
                     country, their channel's niche, their blog's focus). 18-30
                     words. No flattery.

  "value_prop_line": ONE sentence. Connects MyPhonicsBooks to something specific
                     about the recipient (their curriculum, their grade, their
                     audience, their pain). 20-35 words. Concrete, not vague.

  "ps_line":         ONE short P.S. line. Soft secondary ask or human touch.
                     Maximum 20 words. Optional — you may return empty string
                     if no good P.S. fits.

Output: JSON only. No surrounding text. No code fences. No commentary.
"""
    else:  # full
        output_spec = """\
Return STRICT JSON with exactly these two keys:

  "subject":     The email subject line. Plain, specific, 4-10 words. No
                 clickbait, no "RE:", no "[" brackets.

  "email_body":  The full email body as plain text. Open with "Hi {name}," or
                 "Hi there," (use \\n for line breaks). 80-160 words. Sign off
                 from "Lynden / MyPhonicsBooks". End with the literal merge tag
                 {unsubscribe} on its own final line.

Output: JSON only. No surrounding text. No code fences. No commentary.
"""
    return f"""You write a single short, personalised cold/warm email for MyPhonicsBooks.

# Brand
{BRAND_BACKGROUND}

# Audience for this email
{audience_desc}

# What we are offering them
{offer}

# Writing rules
{WRITING_RULES}

# Output format
{output_spec}"""


def context_block(row: dict) -> str:
    """Build the recipient-context block the model sees."""
    # Only include non-empty fields to avoid leaking placeholders.
    fields = [
        ("Recipient name", " ".join(filter(None, [row.get("first_name", ""), row.get("last_name", "")])).strip()),
        ("Role", row.get("role", "")),
        ("Organisation / channel / blog", row.get("company_name", "")),
        ("Country", row.get("country", "")),
        ("City", row.get("city", "")),
        ("Curriculum / niche", row.get("curriculum", "")),
        ("Website", row.get("website", "")),
        ("Source we found them on", row.get("source", "")),
        ("Notes", row.get("notes", "")),
    ]
    lines = [f"{label}: {value}" for label, value in fields if value]
    return "Recipient context:\n" + ("\n".join(lines) if lines else "(no context available)")


# ----- Providers ---------------------------------------------------------------

def call_openai(model: str, system: str, user: str) -> str:
    from openai import OpenAI
    client = OpenAI()
    is_reasoning_model = model.startswith(("gpt-5", "o"))
    kwargs: dict = {
        "model": model,
        "input": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    }
    if is_reasoning_model:
        # Email writing is not heavy reasoning; "low" is plenty and ~4x cheaper.
        kwargs["reasoning"] = {"effort": "low"}
    r = client.responses.create(**kwargs)
    return r.output_text


def call_anthropic(model: str, system: str, user: str) -> str:
    from anthropic import Anthropic
    client = Anthropic()
    r = client.messages.create(
        model=model,
        max_tokens=1000,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return r.content[0].text


def parse_json(text: str) -> dict | None:
    text = text.strip()
    if text.startswith("```"):
        # strip fenced code if model ignored instructions
        text = text.strip("`")
        if text.lstrip().startswith("json"):
            text = text.lstrip()[4:]
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # last-ditch: try to slice out the first {...} block
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            try:
                return json.loads(text[start : end + 1])
            except json.JSONDecodeError:
                return None
        return None


# ----- Main loop ---------------------------------------------------------------

FIELDS_KEYS = ("intro_line", "value_prop_line", "ps_line")
FULL_KEYS = ("subject", "email_body")


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("csv_path", type=str)
    ap.add_argument("--audience", choices=AUDIENCE_PROFILES.keys(), required=True)
    ap.add_argument("--mode", choices=("fields", "full"), default="fields")
    ap.add_argument("--provider", choices=("openai", "anthropic"), default="openai")
    ap.add_argument("--model", type=str, default="",
                    help="Override model. Defaults: openai=gpt-5-mini, anthropic=claude-haiku-4-5-20251001")
    ap.add_argument("--dry-run", action="store_true", help="Print prompts, don't call API")
    ap.add_argument("--regenerate", action="store_true",
                    help="Regenerate even if target fields are already set")
    ap.add_argument("--only-with-email", action="store_true", default=True,
                    help="Skip rows that don't have an email address (default)")
    ap.add_argument("--include-no-email", action="store_true",
                    help="Generate for all rows regardless of email column")
    args = ap.parse_args(argv)

    path = Path(args.csv_path)
    if not path.exists():
        print(f"File not found: {path}")
        return 1

    model = args.model
    if not model:
        model = "gpt-5-mini" if args.provider == "openai" else "claude-haiku-4-5-20251001"

    needed_key = "OPENAI_API_KEY" if args.provider == "openai" else "ANTHROPIC_API_KEY"
    if not args.dry_run and not os.environ.get(needed_key):
        print(f"{needed_key} not set in env.")
        return 1

    target_keys = FIELDS_KEYS if args.mode == "fields" else FULL_KEYS

    with open(path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames or [])
        rows = list(reader)

    for key in target_keys:
        if key not in fieldnames:
            fieldnames.append(key)

    system = system_prompt(args.audience, args.mode)

    targets: list[int] = []
    for i, row in enumerate(rows):
        if not args.include_no_email and not row.get("email"):
            continue
        if not args.regenerate and all(row.get(k) for k in target_keys):
            continue
        targets.append(i)

    print(
        f"{len(targets)} of {len(rows)} rows need writing "
        f"(mode={args.mode}, audience={args.audience}, provider={args.provider}, model={model})"
    )

    if args.dry_run:
        for i in targets[:2]:
            print("\n--- SYSTEM ---")
            print(system[:600] + ("..." if len(system) > 600 else ""))
            print("\n--- USER ---")
            print(context_block(rows[i]))
        print("\n(dry run, no API calls)")
        return 0

    caller = call_openai if args.provider == "openai" else call_anthropic
    n_ok = 0
    for n, i in enumerate(targets, 1):
        row = rows[i]
        user = context_block(row)
        try:
            text = caller(model, system, user)
            parsed = parse_json(text)
            if parsed is None:
                raise ValueError(f"non-JSON response: {text[:200]!r}")
            for key in target_keys:
                rows[i][key] = (parsed.get(key, "") or "").strip()
            n_ok += 1
            sample = rows[i][target_keys[0]][:90]
            print(f"[{n}/{len(targets)}] {row.get('company_name', '(no name)')[:50]}: {sample}")
        except Exception as e:
            print(f"[{n}/{len(targets)}] {row.get('company_name', '(no name)')[:50]}: ERROR {e}")
        time.sleep(0.15)

    with open(path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"\n{n_ok}/{len(targets)} rows written. Updated {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
