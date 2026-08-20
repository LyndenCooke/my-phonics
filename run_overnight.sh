#!/usr/bin/env bash
# Overnight: text-only suite A (10) then suite B (7), judges at medium,
# plausibility on Gemini, no full rejections (edit requests only).
set -u
S="C:/Users/ASUS/AppData/Local/Temp/claude/C--Users-ASUS/8d78c86b-8360-48ed-ae49-4f3113bd5c3f/scratchpad"
cd "C:/Users/ASUS/myphonicsbooks" || exit 1

# Wait for the dev server rather than assuming it is up.
for i in $(seq 1 60); do
  code=$(curl -s -m 5 -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/api/forge/health || true)
  [ "$code" = "200" ] && break
  sleep 5
done
echo "server health: ${code:-none}"

export FORGE_JUDGE_EFFORT=medium
rm -f text_only_A.jsonl text_only_B.jsonl

echo "######## SUITE A (10) ########"
HARD_TOTAL=6.5 CASES_FILE=text_only_cases_a.json node _test_text_only_x10.mjs text_only_A.jsonl
echo "######## SUITE B (7) ########"
HARD_TOTAL=5.0 CASES_FILE=text_only_cases_b.json node _test_text_only_x10.mjs text_only_B.jsonl
echo "######## DONE ########"
