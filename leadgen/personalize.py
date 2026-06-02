"""Add an `intro_line` column to a leads CSV using Claude.

Usage:
    py -3.12 personalize.py output/international_schools.csv
    py -3.12 personalize.py output/international_schools.csv --dry-run
    py -3.12 personalize.py output/international_schools.csv --only-missing
"""
from __future__ import annotations

import argparse
import csv
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


SYSTEM = (
    "You write a single short, warm, peer-to-peer intro sentence for a B2B "
    "cold email from MyPhonicsBooks (a small UK phonics programme with "
    "decodable books set in contemporary cultures worldwide) to an international "
    "school. The sentence must reference one concrete thing about the school "
    "(its country, city, or curriculum) and feel human, not flattering or "
    "salesy. 18-30 words. No emojis. No exclamation marks. No 'I hope this "
    "finds you well'. No 'I came across your website'. Output the sentence "
    "only — no quotes, no preamble."
)


def build_prompt(row: dict) -> str:
    bits = []
    if row.get("company_name"):
        bits.append(f"School: {row['company_name']}")
    if row.get("city"):
        bits.append(f"City: {row['city']}")
    if row.get("country"):
        bits.append(f"Country: {row['country']}")
    if row.get("curriculum"):
        bits.append(f"Curriculum: {row['curriculum']}")
    if row.get("website"):
        bits.append(f"Website: {row['website']}")
    return (
        "Write the intro sentence for this school:\n\n" + "\n".join(bits)
    )


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("csv_path", type=str)
    ap.add_argument("--dry-run", action="store_true", help="Print prompts, don't call API")
    ap.add_argument("--only-missing", action="store_true", default=True,
                    help="Skip rows that already have intro_line (default)")
    ap.add_argument("--regenerate", action="store_true",
                    help="Regenerate even if intro_line is already set")
    ap.add_argument("--model", default="claude-haiku-4-5-20251001",
                    help="Anthropic model — Haiku is fast/cheap and fine for this")
    args = ap.parse_args(argv)

    path = Path(args.csv_path)
    if not path.exists():
        print(f"File not found: {path}")
        return 1

    with open(path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames or []
        rows = list(reader)

    if "intro_line" not in fieldnames:
        fieldnames = list(fieldnames) + ["intro_line"]

    targets = []
    for i, row in enumerate(rows):
        if not row.get("email"):
            continue
        if row.get("intro_line") and not args.regenerate:
            continue
        targets.append(i)
    print(f"{len(targets)} of {len(rows)} rows need personalisation.")

    if args.dry_run:
        for i in targets[:3]:
            print("\n---")
            print(build_prompt(rows[i]))
        print("\n(dry run, no API calls)")
        return 0

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ANTHROPIC_API_KEY not set in env.")
        return 1

    from anthropic import Anthropic
    client = Anthropic(api_key=api_key)

    for n, i in enumerate(targets, 1):
        row = rows[i]
        try:
            resp = client.messages.create(
                model=args.model,
                max_tokens=200,
                system=SYSTEM,
                messages=[{"role": "user", "content": build_prompt(row)}],
            )
            text = (resp.content[0].text or "").strip().strip('"').strip("'")
            text = text.replace("\n", " ").strip()
            rows[i]["intro_line"] = text
            print(f"[{n}/{len(targets)}] {row['company_name']}: {text[:100]}")
        except Exception as e:
            print(f"[{n}/{len(targets)}] {row['company_name']}: ERROR {e}")
        time.sleep(0.3)

    with open(path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"\nUpdated {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
