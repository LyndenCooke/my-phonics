"""Reddit intent radar — finds parents and teachers discussing phonics pain.

Output: NOT an email list. A queue of public Reddit posts/comments where
parents/teachers express phonics or early-reading frustration. You engage
organically (reply with a helpful comment that mentions MyPhonicsBooks and
the free Skool community), driving them into the existing parent funnel.

This complements the cold-email scrapers: those find creators with public
emails; this finds end-buyers with public intent signals.

Uses Reddit's public JSON endpoints (no auth required for read), with proper
User-Agent and rate limiting. Reddit allows this for low-volume reads; if
you push volume up later we'd switch to PRAW with OAuth credentials.

Run:
    py -3.12 reddit_intent.py
    py -3.12 reddit_intent.py --days 30 --min-score 5
    py -3.12 reddit_intent.py --subs Parenting,homeschool,Mommit
"""
from __future__ import annotations

import argparse
import csv
import json
import sys
import time
import urllib.parse
from pathlib import Path

import httpx


DEFAULT_SUBS = [
    # Parenting + early learning
    "Parenting", "Mommit", "Daddit", "beyondthebump",
    "preschool", "kindergarten", "ECEProfessionals",
    "homeschool", "homeschoolrecovery",
    # Reading-focused
    "ScienceOfReading",
    # UK
    "ukparenting",
]

DEFAULT_QUERIES = [
    "phonics",
    "letters and sounds",
    "decodable",
    "kid cant read",
    "child struggling to read",
    "teach my kid to read",
    "year 1 reading",
    "kindergarten reading",
    "phonics screening",
    "reading frustration",
    "science of reading",
]

# Posts that express intent / pain we can helpfully reply to
INTENT_KEYWORDS = (
    "struggling", "frustrated", "frustration", "stuck", "behind",
    "help", "advice", "tips", "recommend", "recommendations",
    "can't read", "cant read", "won't read", "wont read",
    "hates reading", "hates books", "doesn't like",
    "what should i", "how do i", "anyone tried", "anyone else",
    "decodable", "match the level", "matched to", "boring books",
)

USER_AGENT = "MyPhonicsBooksOutreach/1.0 (intent-radar; +https://myphonicsbooks.com)"


def search_subreddit(sub: str, query: str, limit: int = 25) -> list[dict]:
    """Use Reddit's public JSON search.

    Endpoint: https://www.reddit.com/r/{sub}/search.json?q={q}&restrict_sr=on
    """
    url = f"https://www.reddit.com/r/{sub}/search.json"
    params = {
        "q": query,
        "restrict_sr": "on",
        "sort": "new",
        "limit": str(limit),
        "t": "year",  # results from last year
    }
    try:
        r = httpx.get(url, params=params, headers={"User-Agent": USER_AGENT}, timeout=20)
    except httpx.RequestError:
        return []
    if r.status_code != 200:
        return []
    try:
        data = r.json()
    except json.JSONDecodeError:
        return []
    posts = []
    for child in (data.get("data") or {}).get("children", []) or []:
        d = child.get("data") or {}
        posts.append(d)
    return posts


def intent_score(text: str) -> int:
    t = (text or "").lower()
    return sum(1 for kw in INTENT_KEYWORDS if kw in t)


def post_is_recent(created_utc: float, days: int) -> bool:
    if days <= 0:
        return True
    return (time.time() - created_utc) <= days * 86400


def post_to_row(post: dict) -> dict:
    text = (post.get("title", "") + "\n\n" + (post.get("selftext", "") or "")).strip()
    score = post.get("score", 0)
    return {
        "subreddit": post.get("subreddit", ""),
        "title": (post.get("title") or "").replace("\n", " ").strip()[:280],
        "author": post.get("author", ""),
        "score": score,
        "num_comments": post.get("num_comments", 0),
        "created_utc": int(post.get("created_utc", 0)),
        "url": "https://www.reddit.com" + post.get("permalink", ""),
        "snippet": (post.get("selftext", "") or "").replace("\n", " ").strip()[:280],
        "intent_score": intent_score(text),
    }


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--subs", type=str, default="")
    ap.add_argument("--queries", type=str, default="")
    ap.add_argument("--days", type=int, default=180, help="Only posts newer than N days")
    ap.add_argument("--min-score", type=int, default=2,
                    help="Reddit score threshold (filters trolls/spam)")
    ap.add_argument("--min-intent", type=int, default=1,
                    help="Min intent-keyword matches (0 = include all)")
    ap.add_argument("--limit-per-pair", type=int, default=15)
    ap.add_argument("--out", type=str, default="output/reddit_intent.csv")
    args = ap.parse_args(argv)

    subs = (
        [s.strip() for s in args.subs.split(",") if s.strip()]
        if args.subs else DEFAULT_SUBS
    )
    queries = (
        [q.strip() for q in args.queries.split(",") if q.strip()]
        if args.queries else DEFAULT_QUERIES
    )

    print(f"Searching {len(subs)} subreddits x {len(queries)} queries ({len(subs)*len(queries)} requests)")
    seen_ids: set[str] = set()
    rows: list[dict] = []

    for sub in subs:
        sub_hits = 0
        for q in queries:
            posts = search_subreddit(sub, q, limit=args.limit_per_pair)
            for p in posts:
                pid = p.get("id")
                if not pid or pid in seen_ids:
                    continue
                seen_ids.add(pid)
                if p.get("score", 0) < args.min_score:
                    continue
                if not post_is_recent(p.get("created_utc", 0), args.days):
                    continue
                row = post_to_row(p)
                if row["intent_score"] < args.min_intent:
                    continue
                rows.append(row)
                sub_hits += 1
            time.sleep(1.0)  # be kind to Reddit
        print(f"  r/{sub}: {sub_hits} matching posts")

    # Sort by intent score desc, then recency desc
    rows.sort(key=lambda r: (r["intent_score"], r["created_utc"]), reverse=True)

    out_path = Path(__file__).parent / args.out
    out_path.parent.mkdir(parents=True, exist_ok=True)
    fields = [
        "subreddit", "title", "author", "score", "num_comments",
        "created_utc", "url", "snippet", "intent_score",
    ]
    with open(out_path, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in rows:
            w.writerow(r)
    print(f"\nWrote {len(rows)} engagement targets -> {out_path}")
    if rows:
        print("\nTop 5 by intent score:")
        for r in rows[:5]:
            print(f"  [{r['intent_score']}] r/{r['subreddit']} ({r['score']}^) - {r['title'][:80]}")
            print(f"     {r['url']}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
