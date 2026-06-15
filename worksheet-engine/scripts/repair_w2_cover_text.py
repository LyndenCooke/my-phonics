# ---------------------------------------------------------------------------
# repair_w2_cover_text.py — targeted text-repair pass for W2 covers whose art
# is right but whose text gemini-2.5-flash-image keeps garbling on full
# regeneration (generate_w2_covers_vertex.py). Sends the CURRENT near-miss
# cover back as the image input with a fix-only-the-spelling instruction,
# re-crops, and re-runs the strict QA. Usage:
#   py -3.12 scripts/repair_w2_cover_text.py 5 7
# ---------------------------------------------------------------------------
import base64
import json
import sys

import generate_w2_covers_vertex as g


def repair_prompt(n: int) -> str:
    L = g.LEVELS[n]
    return (
        "This is a children's workbook cover. Reproduce it EXACTLY as it is — "
        "identical layout, colours, illustration, typography, badge, stars, "
        "Name/Class panel and logo — correcting ONLY any misspelled words so "
        "that the text reads exactly:\n"
        f"- badge at the top: LEVEL {n} · {L['name'].upper()}\n"
        "- big main title: Workbook\n"
        f"- decorated line under the title: Level {n} · {L['name']}\n"
        f"- small dot-separated line: {L['skills']}\n"
        "- panel: Name / Class, logo: MyPhonicsBooks\n"
        "Every word must be spelled exactly as given. Do not redraw or move "
        "anything else."
    )


def run(n: int) -> dict:
    src = g.OUT / f"l{n}.png"
    last = None
    for attempt in range(1, 7):
        try:
            out = g.vertex("gemini-2.5-flash-image", {
                "contents": [{"role": "user", "parts": [
                    {"inlineData": {"mimeType": "image/png",
                                    "data": base64.b64encode(src.read_bytes()).decode()}},
                    {"text": repair_prompt(n)},
                ]}],
                "generationConfig": {
                    "responseModalities": ["IMAGE"],
                    "imageConfig": {"aspectRatio": "2:3"},
                },
            })
            png = None
            for part in out["candidates"][0]["content"]["parts"]:
                data = part.get("inlineData", {}).get("data")
                if data:
                    png = g.crop_a4(base64.b64decode(data))
                    break
            if png is None:
                raise RuntimeError("no image part in response")
            verdict = g.qa(n, png)
            last = {"level": n, "attempt": attempt, **verdict}
            print(f"[L{n}] repair {attempt}: "
                  f"{'PASS' if verdict.get('pass') else verdict.get('problems')}",
                  flush=True)
            if verdict.get("pass"):
                src.write_bytes(png)
                return last
            # NOTE: do not overwrite src on failure — keep feeding the model the
            # best-so-far original, not its own degraded output.
        except Exception as e:  # noqa: BLE001
            print(f"[L{n}] repair {attempt} ERROR: {e}", flush=True)
            last = {"level": n, "attempt": attempt, "pass": False, "problems": [str(e)]}
    return last


def main():
    levels = [int(a) for a in sys.argv[1:]]
    results = [run(n) for n in levels]
    bad = [r for r in results if not r.get("pass")]
    print(f"\n{len(results) - len(bad)}/{len(results)} repaired")
    for r in bad:
        print(f"  L{r['level']} STILL FAILING: {json.dumps(r.get('problems'))}")


if __name__ == "__main__":
    main()
