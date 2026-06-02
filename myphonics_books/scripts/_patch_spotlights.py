"""
Splice the new structured `spotlight` sub-objects from
output/spotlight_items.json into data/grammar_spotlights.py, inserting
each one after the entry's `workshop_listen_write` line.

Idempotent: if an entry already has a `spotlight` key, it is skipped.

Run from `myphonics_books/`:
    py -3.12 scripts/_patch_spotlights.py
"""

import json
import re
import sys
from pathlib import Path

BASE = Path(__file__).parent.parent
JSON_PATH = BASE / "output" / "spotlight_items.json"
PY_PATH = BASE / "data" / "grammar_spotlights.py"

if not JSON_PATH.exists():
    sys.exit(f"Missing {JSON_PATH}")

items = json.loads(JSON_PATH.read_text(encoding="utf-8"))
src = PY_PATH.read_text(encoding="utf-8")

added, skipped, missing = [], [], []

# Locate each entry's text region by matching   "X.Y": {  ...  },
ENTRY_RE = re.compile(
    r'^(?P<indent>    )"(?P<key>\d+\.\d+)":\s*\{\n'
    r'(?P<body>(?:.*\n)*?)'
    r'^    \},\n',
    re.MULTILINE,
)

new_src_parts = []
last_end = 0
for m in ENTRY_RE.finditer(src):
    new_src_parts.append(src[last_end:m.start()])
    key = m.group("key")
    body = m.group("body")
    block = m.group(0)

    if '"spotlight":' in body:
        # Already has structured spotlight — keep as-is.
        skipped.append(key)
        new_src_parts.append(block)
        last_end = m.end()
        continue

    if key not in items:
        missing.append(key)
        new_src_parts.append(block)
        last_end = m.end()
        continue

    spotlight_dict = items[key]
    # Render the sub-object as Python literal with 8-space indent so it
    # nests inside the entry consistently with the rest of the file.
    spotlight_repr = json.dumps(spotlight_dict, indent=4, ensure_ascii=False)
    spotlight_lines = spotlight_repr.split("\n")
    rendered = "        \"spotlight\": " + spotlight_lines[0] + "\n"
    for line in spotlight_lines[1:]:
        rendered += "        " + line + "\n"
    # Replace the trailing JSON-style indentation (4 sp) with our 8-sp +
    # ensure each line has +4 sp so it lives at the right depth.  Easier
    # path: rebuild via re-indent.
    rendered_lines = ["        \"spotlight\": " + spotlight_lines[0]]
    for line in spotlight_lines[1:]:
        rendered_lines.append("        " + line)
    # Add trailing comma to the closing brace line (last line is "}")
    rendered_lines[-1] = rendered_lines[-1] + ","
    new_block_body = body.rstrip("\n") + "\n" + "\n".join(rendered_lines) + "\n    },\n"
    new_block = f'    "{key}": {{\n' + new_block_body
    new_src_parts.append(new_block)
    last_end = m.end()
    added.append(key)

new_src_parts.append(src[last_end:])
new_src = "".join(new_src_parts)

PY_PATH.write_text(new_src, encoding="utf-8")
print(f"Added spotlight to {len(added)} entries: {sorted(added, key=lambda s: tuple(int(x) for x in s.split('.')))}")
print(f"Skipped (already had one): {skipped}")
if missing:
    print(f"!!! No JSON for: {missing}")
