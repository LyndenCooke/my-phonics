"""
Senior-literacy review of the v3 Shared-Sound Mnemonic Map.

Sends `output/sound_books/shared_sound_map_v3.md` to a senior UK SSP
consultant persona for critique. Captures verdicts row-by-row plus
family-level and structural concerns.

Outputs:
  - output/sound_books/_map_review_transcript.md
  - output/sound_books/_map_review.json

Run:
  py -3.12 scripts/_shared_sound_map_review.py
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

env_path = ROOT / ".env"
for line in env_path.read_text(encoding="utf-8").splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    k, _, v = line.partition("=")
    k = k.strip()
    v = v.strip().strip('"').strip("'")
    if "#" in v:
        v = v.split("#", 1)[0].strip()
    if k and k not in os.environ:
        os.environ[k] = v

from openai import OpenAI  # noqa: E402

OUT = ROOT / "output" / "sound_books"
MAP_PATH = OUT / "shared_sound_map_v3.md"


SYSTEM = """You are a senior UK systematic synthetic phonics (SSP) literacy
consultant with 20+ years of Reception/KS1 classroom experience. You have led
both Letters & Sounds and Read Write Inc rollouts and assessed thousands of
phonics books and worksheets for major UK publishers.

You are reviewing a "Shared-Sound Mnemonic Map" for a children's phonics book
series called MyPhonicsBooks. The map is the source of truth for the page-3
"sound family" reference page of each Sound Book in the series. Each row pairs
one spelling (grapheme) with one mnemonic word, illustrated as clipart.

Your job: critique every row for pedagogical soundness, pictureability, and
fit with UK Reception/KS1 children. Be opinionated and specific.

Evaluation criteria for each mnemonic word:
1. PICTUREABILITY — is this a concrete single subject a 4-7 year-old will
   instantly name from a clean clipart? Abstract concepts FAIL.
2. PRONUNCIATION CLARITY — does the word unambiguously demonstrate the target
   phoneme in standard British English RP? Regional pronunciations FAIL.
3. DECODABILITY — by the level the spelling is first taught, is this word
   plausible vocabulary for the child? (It doesn't need to be fully decodable
   at that level — the picture carries it — but it shouldn't be obscure.)
4. ICONICITY — is this a first-thought, "of-course" association with the
   sound? Or is it forced?
5. BRITISH ENGLISH — colour not color, lorry not truck, etc.

Also flag at the family level:
- Missing spellings the curriculum should include but doesn't
- Spellings included that shouldn't be (too marginal, too late)
- Level placement issues (taught too early/late)

Also flag at the structural level:
- The four "*" additions to the Ledger (ey-key, ear-bear, ear-earth, tch-watch)
   — do you endorse adding these?
- The "dropped" phonemes — anything you'd reinstate?
- The overall family-of-multiple-spellings approach — sound?

Return STRICT JSON only — no commentary, no markdown fences. Schema:

{
  "row_verdicts": [
    {
      "phoneme": "/ee/",
      "spelling": "e-e",
      "current_mnemonic": "athlete",
      "verdict": "keep" | "swap" | "drop",
      "suggested_swap": "string or null",
      "reasoning": "one sentence, specific and pedagogical"
    },
    ...
  ],
  "family_concerns": [
    {
      "phoneme": "/ee/",
      "issue": "string describing missing/extra/level concern",
      "recommendation": "specific action"
    }
  ],
  "ledger_additions": [
    {
      "addition": "ey-key" | "ear-bear" | "ear-earth" | "tch-watch",
      "endorse": true | false,
      "reasoning": "one sentence"
    }
  ],
  "reinstate_dropped": [
    {
      "phoneme": "/sh/",
      "reasoning": "why this should have a shared-sound page after all"
    }
  ],
  "structural_concerns": [
    "string — overall issues with the approach or scoping"
  ],
  "overall_grade": "A" | "B" | "C" | "D" | "F",
  "summary": "2-3 sentence overall assessment"
}

Be ruthless. The user wants real critique, not validation."""


def main():
    map_md = MAP_PATH.read_text(encoding="utf-8")

    user_msg = (
        "Here is the v3 Shared-Sound Mnemonic Map for your review. "
        "Return the full JSON critique.\n\n"
        "---\n\n" + map_md
    )

    client = OpenAI()
    model = "gpt-4o"

    print(f"[review] calling {model} on {len(map_md)} char map ...")
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": user_msg},
        ],
        temperature=0.3,
        response_format={"type": "json_object"},
    )
    reply = resp.choices[0].message.content
    print(f"[review] got {len(reply)} chars back")

    transcript = (
        "# Shared-Sound Map v3 — senior-literacy review\n\n"
        f"Model: {model}\n\n"
        "## System\n\n```\n" + SYSTEM + "\n```\n\n"
        "## User\n\n(v3 map sent — see shared_sound_map_v3.md)\n\n"
        "## Reply\n\n```json\n" + reply + "\n```\n"
    )
    (OUT / "_map_review_transcript.md").write_text(transcript, encoding="utf-8")

    try:
        parsed = json.loads(reply)
    except json.JSONDecodeError as e:
        print(f"[review] WARNING: JSON parse failed: {e}")
        return

    (OUT / "_map_review.json").write_text(
        json.dumps(parsed, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    # Print compact summary so user can read result in terminal
    print()
    print(f"OVERALL GRADE: {parsed.get('overall_grade', '?')}")
    print(f"SUMMARY: {parsed.get('summary', '')}")
    print()

    swaps = [r for r in parsed.get("row_verdicts", []) if r.get("verdict") == "swap"]
    drops = [r for r in parsed.get("row_verdicts", []) if r.get("verdict") == "drop"]
    print(f"Row verdicts: {len(parsed.get('row_verdicts', []))} total, "
          f"{len(swaps)} swap, {len(drops)} drop")
    for r in swaps:
        print(f"  SWAP  {r['phoneme']:8s} {r['spelling']:6s} "
              f"{r['current_mnemonic']:12s} -> {r.get('suggested_swap')}")
        print(f"        {r['reasoning']}")
    for r in drops:
        print(f"  DROP  {r['phoneme']:8s} {r['spelling']:6s} "
              f"{r['current_mnemonic']:12s}")
        print(f"        {r['reasoning']}")

    print()
    print(f"Family concerns: {len(parsed.get('family_concerns', []))}")
    for fc in parsed.get("family_concerns", []):
        print(f"  {fc['phoneme']}: {fc['issue']}")
        print(f"     -> {fc['recommendation']}")

    print()
    print("Ledger additions endorsement:")
    for la in parsed.get("ledger_additions", []):
        flag = "OK" if la.get("endorse") else "REJECT"
        print(f"  [{flag}] {la['addition']}: {la['reasoning']}")

    reinstate = parsed.get("reinstate_dropped", [])
    if reinstate:
        print()
        print(f"Reinstate dropped phonemes: {len(reinstate)}")
        for r in reinstate:
            print(f"  {r['phoneme']}: {r['reasoning']}")

    structural = parsed.get("structural_concerns", [])
    if structural:
        print()
        print(f"Structural concerns: {len(structural)}")
        for s in structural:
            print(f"  - {s}")


if __name__ == "__main__":
    main()
