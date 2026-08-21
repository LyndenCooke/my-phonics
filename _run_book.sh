#!/bin/bash
# Create + pay + drive one book through the real forge API (the same endpoints
# the /create-book wizard posts to), then report cost and gates.
set -e
API=http://localhost:8080/api/forge
ID=$(curl -s -X POST $API/books -H "Content-Type: application/json" -d @"$1" | python -c "import json,sys;print(json.load(sys.stdin)['book']['id'])")
echo "book_id=$ID"
curl -s -X POST $API/dev/simulate-pay -H "Content-Type: application/json" -d "{\"kind\":\"book\",\"book_id\":\"$ID\"}" > /dev/null
echo "$ID" > .last_book_id
for i in $(seq 1 120); do
  S=$(curl -s "$API/books/$ID" | python -c "
import json,sys
j=json.load(sys.stdin).get('book') or {}
pr=j.get('progress') or {}
job=pr.get('job') or {}
print(j.get('status'), pr.get('step'), pr.get('pct'), round(job.get('cost') or 0,2), str(pr.get('message'))[:45])
" 2>/dev/null)
  echo "$(date +%H:%M:%S) $S"
  case "$S" in
    generating*) sleep 25 ;;
    awaiting_imagery_approval*)
      curl -s -X POST $API/approve-imagery -H "Content-Type: application/json" -d "{\"book_id\":\"$ID\"}" > /dev/null
      echo ">> imagery approved"; sleep 10 ;;
    *) break ;;
  esac
done
