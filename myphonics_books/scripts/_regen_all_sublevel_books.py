"""
One-shot regen of every sub-level pilot book across L2-L6 (or any levels passed
on the CLI).  Skips L1 by default because that was regen'd earlier in the
session.  Faster than spawning the interpreter once per book because we import
generate_pilot_books once and call generate_pilot_pdf in a loop.
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from generate_pilot_books import generate_pilot_pdf, get_pilot_stories  # noqa: E402

# All sub-levels with a source story.  L1.3 has no story so isn't here.
ALL_SUBLEVELS = {
    1: ["1.1", "1.2", "1.4", "1.5", "1.6", "1.7", "1.8", "1.9", "1.10"],
    2: ["2.1", "2.2", "2.3", "2.4", "2.5", "2.6"],
    3: ["3.1", "3.2", "3.3", "3.4", "3.5"],
    4: ["4.1", "4.2", "4.3", "4.4"],
    5: ["5.1", "5.2", "5.3", "5.4"],
    6: ["6.1", "6.2", "6.3", "6.4"],
}


async def main(levels: list[int]):
    stories = get_pilot_stories()
    total_ok = 0
    total_fail = 0
    for lvl in levels:
        for sub in ALL_SUBLEVELS.get(lvl, []):
            print(f"=== L{sub} ===", flush=True)
            try:
                out = await generate_pilot_pdf(sub, use_images=True)
                size_mb = out.stat().st_size / 1024 / 1024
                print(f"  done: {out.name} ({size_mb:.1f} MB)", flush=True)
                total_ok += 1
            except Exception as e:
                print(f"  ERROR L{sub}: {e}", flush=True)
                total_fail += 1
    print(f"\nRegenerated {total_ok} books ({total_fail} failed).")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        levels = [int(a) for a in sys.argv[1:]]
    else:
        levels = [2, 3, 4, 5, 6]
    asyncio.run(main(levels))
