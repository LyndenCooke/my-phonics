"""Pass 3 — asset existence check.

Parses the React source for every referenced public asset path
(/sounds/, /illustrations/, /book-pages/, /covers/, /images/) and
verifies the file exists in ./public. Since Vercel serves the
./public directory verbatim, a missing file locally means a 404 in
production.

Run:  py -3.12 review/stress_test/_check_assets.py
"""
from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
PUBLIC = ROOT / "public"
REPORT = Path(__file__).parent / "03_assets.md"

# Paths to scan. Phonics-fun-hub is LEGACY so we skip it.
SCAN_ROOTS = [
    ROOT / "src",
    ROOT / "supabase" / "functions",
]

# Regex matches quoted strings starting with an asset prefix.
ASSET_PATTERN = re.compile(
    r"""['"`](/(?:sounds|illustrations|book-pages|covers|images)/[^'"`]+)['"`]"""
)

# Template-literal substitution heuristic — things like `/sounds/${x}.mp3`.
TEMPLATE_PATTERN = re.compile(
    r"""`(/(?:sounds|illustrations|book-pages|covers|images)/[^`]*\$\{[^`]*}[^`]*)`"""
)


def main() -> int:
    references: dict[str, list[str]] = defaultdict(list)
    template_hits: list[tuple[Path, str]] = []

    for root in SCAN_ROOTS:
        for path in root.rglob("*"):
            if not path.is_file():
                continue
            if path.suffix not in {".ts", ".tsx", ".js", ".jsx"}:
                continue
            try:
                text = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue
            for match in ASSET_PATTERN.finditer(text):
                references[match.group(1)].append(str(path.relative_to(ROOT)))
            for match in TEMPLATE_PATTERN.finditer(text):
                template_hits.append((path.relative_to(ROOT), match.group(1)))

    missing: dict[str, list[str]] = {}
    present_count = 0
    for ref, callers in references.items():
        # Strip query string if any.
        clean = ref.split("?", 1)[0]
        target = PUBLIC / clean.lstrip("/")
        if target.is_file():
            present_count += 1
        else:
            missing[clean] = sorted(set(callers))

    # Phoneme audio sweep — scan interactiveBookData for every phoneme used.
    interactive = ROOT / "src" / "lib" / "interactiveBookData.ts"
    phoneme_re = re.compile(r"""phonemes:\s*\[([^\]]*)]""", re.S)
    phonemes_referenced: set[str] = set()
    if interactive.is_file():
        text = interactive.read_text(encoding="utf-8")
        for match in phoneme_re.finditer(text):
            for part in re.findall(r"""['"]([^'"]+)['"]""", match.group(1)):
                phonemes_referenced.add(part.lower())

    missing_phonemes: list[str] = []
    for ph in sorted(phonemes_referenced):
        key = ph.replace("-", "_")
        candidate = PUBLIC / "sounds" / f"{key}.mp3"
        if not candidate.is_file():
            missing_phonemes.append(ph)

    # Cover sweep from bookCatalog
    catalog = ROOT / "src" / "lib" / "bookCatalog.ts"
    cover_re = re.compile(r"""cover_image_url:\s*['"]([^'"]+)['"]""")
    cover_paths: set[str] = set()
    if catalog.is_file():
        for match in cover_re.finditer(catalog.read_text(encoding="utf-8")):
            cover_paths.add(match.group(1))

    missing_covers = []
    for cover in sorted(cover_paths):
        if cover.startswith("http"):
            continue  # external, skip
        target = PUBLIC / cover.lstrip("/")
        if not target.is_file():
            missing_covers.append(cover)

    lines: list[str] = []
    lines.append("# Pass 3 — Asset existence sweep\n")
    lines.append(f"Scanned directories: {[str(p.relative_to(ROOT)) for p in SCAN_ROOTS]}\n")
    lines.append(f"Public root: `{PUBLIC.relative_to(ROOT)}`\n")

    lines.append("## Summary\n")
    lines.append(f"- Static asset references found: **{len(references)}**")
    lines.append(f"- Present in ./public: **{present_count}**")
    lines.append(f"- Missing: **{len(missing)}**")
    lines.append(f"- Phonemes referenced in interactiveBookData: **{len(phonemes_referenced)}**")
    lines.append(f"- Phonemes missing audio: **{len(missing_phonemes)}**")
    lines.append(f"- Book covers referenced: **{len(cover_paths)}**")
    lines.append(f"- Book covers missing: **{len(missing_covers)}**")
    lines.append("")

    lines.append("## Missing static assets\n")
    if not missing:
        lines.append("_None — every referenced image / audio file exists._\n")
    else:
        for ref, callers in sorted(missing.items()):
            lines.append(f"### `{ref}`")
            for caller in callers:
                lines.append(f"- referenced by `{caller}`")
            lines.append("")

    lines.append("## Missing phoneme audio\n")
    if not missing_phonemes:
        lines.append("_None — all phonemes have a matching `.mp3`._\n")
    else:
        for ph in missing_phonemes:
            lines.append(f"- `{ph}` (expected `/sounds/{ph.replace('-', '_')}.mp3`)")
        lines.append("")

    lines.append("## Missing book covers\n")
    if not missing_covers:
        lines.append("_None — every book cover resolves._\n")
    else:
        for cover in missing_covers:
            lines.append(f"- `{cover}`")
        lines.append("")

    lines.append("## Dynamic template references (not auto-verified)\n")
    if not template_hits:
        lines.append("_None._\n")
    else:
        lines.append(
            "These references use template literals so the exact path is "
            "computed at runtime. The asset existence can't be checked "
            "statically; rely on Pass 2 runtime reader walk for coverage.\n"
        )
        for path, tmpl in template_hits[:40]:
            lines.append(f"- `{tmpl}` in `{path}`")
        if len(template_hits) > 40:
            lines.append(f"- ... and {len(template_hits) - 40} more")
        lines.append("")

    REPORT.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {REPORT} ({REPORT.stat().st_size} bytes)")
    print(
        json.dumps(
            {
                "refs": len(references),
                "present": present_count,
                "missing": len(missing),
                "phonemes_missing": len(missing_phonemes),
                "covers_missing": len(missing_covers),
            },
            indent=2,
        )
    )
    return 1 if (missing or missing_phonemes or missing_covers) else 0


if __name__ == "__main__":
    raise SystemExit(main())
