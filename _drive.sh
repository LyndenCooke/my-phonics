#!/bin/bash
ID=$1
API=http://localhost:8080/api/forge
for i in $(seq 1 110); do
  S=$(curl -s "$API/books/$ID" | python -c "
import json,sys
j=json.load(sys.stdin).get('book') or {}
pr=j.get('progress') or {}; job=pr.get('job') or {}
print(j.get('status'), pr.get('step'), round(job.get('cost') or 0,3))" 2>/dev/null)
  echo "$(date +%H:%M:%S) $S"
  case "$S" in
    generating*) sleep 25 ;;
    awaiting_imagery*) curl -s -X POST $API/approve-imagery -H "Content-Type: application/json" -d "{\"book_id\":\"$ID\"}" >/dev/null; echo ">> approved"; sleep 8 ;;
    failed*) curl -s -X POST $API/retry -H "Content-Type: application/json" -d "{\"book_id\":\"$ID\"}" >/dev/null; echo ">> retried"; sleep 12 ;;
    *) break ;;
  esac
done
