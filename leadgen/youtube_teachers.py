"""YouTube teacher-channel email scraper.

Searches YouTube for phonics/early-reading channels, then pulls each channel's
public description (and recent video descriptions if needed) and extracts any
public business emails.

Why this works: many EYFS/KS1/phonics teachers who run YouTube channels publish
a contact email in their channel description for collabs and parent questions.
That's a public, intentional contact point — totally legitimate to use.

Requires a YouTube Data API v3 key. Setup:
  1. https://console.cloud.google.com -> New Project
  2. Library -> enable "YouTube Data API v3"
  3. Credentials -> Create Credentials -> API Key
  4. Add to .env:   YOUTUBE_API_KEY=AIza...

Quota: free tier = 10,000 units/day.
  - search.list   = 100 units / call
  - channels.list = 1 unit / call (up to 50 channels per call)
  - videos.list   = 1 unit / call (up to 50 videos per call)
A full run with the default queries uses ~1200 units.

Run:
    py -3.12 youtube_teachers.py
    py -3.12 youtube_teachers.py --queries "phonics teacher,EYFS reading"
    py -3.12 youtube_teachers.py --min-subs 500 --max-subs 500000
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")
try:
    load_dotenv(Path(__file__).parent.parent / "myphonics_books" / ".env", verbose=False)
except Exception:
    pass

from common import Lead, extract_emails, write_leads_csv


DEFAULT_QUERIES = [
    # UK phonics
    "phonics teacher",
    "EYFS phonics",
    "reception phonics teacher",
    "year 1 phonics",
    "letters and sounds",
    "decodable books teacher",
    "synthetic phonics",
    # US / international
    "kindergarten phonics teacher",
    "first grade reading teacher",
    "science of reading teacher",
    "early years educator phonics",
    # Parent-teacher hybrid (often homeschooling teachers)
    "phonics for homeschool",
    "teach my child to read",
]

# Channels with subs outside this range are usually either too small (no engagement)
# or too big to be individual creators (commercial / corporate brands).
DEFAULT_MIN_SUBS = 300
DEFAULT_MAX_SUBS = 800_000

# Teacher-likelihood keywords — boost rows that contain these in description.
TEACHER_KEYWORDS = (
    "teacher", "educator", "teaching", "classroom", "early years",
    "eyfs", "reception", "year 1", "year r", "ks1", "kindergarten",
    "first grade", "second grade", "elementary teacher", "primary teacher",
    "literacy specialist", "reading specialist", "homeschool mom",
    "homeschool mum", "literacy coach", "phonics specialist",
)

# Skip channels that look like big brands / aggregators (not individual teachers).
BRAND_BLOCKLIST = (
    "cocomelon", "supersimple", "super simple", "lingokids",
    "twinkl", "reading eggs", "readingiq", "abcmouse", "homer",
    "khan academy", "british council", "oxford university press",
    "scholastic", "nessy", "starfall", "literacy planet",
    "alphablocks", "numberblocks", "cbeebies", "pbs kids",
    "nat geo kids", "national geographic kids",
)


def looks_like_brand(title: str, description: str) -> bool:
    blob = (title + " " + description).lower()
    return any(b in blob for b in BRAND_BLOCKLIST)


def teacher_score(title: str, description: str) -> int:
    blob = (title + " " + description).lower()
    return sum(1 for kw in TEACHER_KEYWORDS if kw in blob)


def country_from_branding(branding: dict) -> str:
    return (branding.get("channel", {}) or {}).get("country", "") or ""


def search_channels(youtube, query: str, max_results: int = 50) -> list[str]:
    """Return up to max_results channel IDs matching `query`."""
    channel_ids: list[str] = []
    next_token: str | None = None
    while len(channel_ids) < max_results:
        req = youtube.search().list(
            q=query,
            type="channel",
            part="id",
            maxResults=min(50, max_results - len(channel_ids)),
            pageToken=next_token,
            relevanceLanguage="en",
        )
        resp = req.execute()
        for item in resp.get("items", []):
            cid = item.get("id", {}).get("channelId")
            if cid:
                channel_ids.append(cid)
        next_token = resp.get("nextPageToken")
        if not next_token:
            break
    return channel_ids


def fetch_channels(youtube, channel_ids: list[str]) -> list[dict]:
    """Batch-fetch channel snippet + statistics + brandingSettings."""
    out: list[dict] = []
    for i in range(0, len(channel_ids), 50):
        batch = channel_ids[i : i + 50]
        resp = youtube.channels().list(
            part="snippet,statistics,brandingSettings,contentDetails",
            id=",".join(batch),
            maxResults=50,
        ).execute()
        out.extend(resp.get("items", []))
    return out


def fetch_recent_video_descriptions(youtube, uploads_playlist_id: str, max_videos: int = 5) -> str:
    """Return concatenated descriptions of up to `max_videos` recent uploads."""
    if not uploads_playlist_id:
        return ""
    try:
        resp = youtube.playlistItems().list(
            part="contentDetails",
            playlistId=uploads_playlist_id,
            maxResults=max_videos,
        ).execute()
        vids = [it["contentDetails"]["videoId"] for it in resp.get("items", []) if it.get("contentDetails")]
        if not vids:
            return ""
        vresp = youtube.videos().list(
            part="snippet",
            id=",".join(vids),
            maxResults=len(vids),
        ).execute()
        return "\n\n".join(v["snippet"].get("description", "") for v in vresp.get("items", []))
    except Exception:
        return ""


def channel_to_lead(channel: dict, youtube, min_subs: int, max_subs: int) -> Lead | None:
    snip = channel.get("snippet", {}) or {}
    stats = channel.get("statistics", {}) or {}
    branding = channel.get("brandingSettings", {}) or {}
    content = channel.get("contentDetails", {}) or {}

    title = snip.get("title", "")
    description = snip.get("description", "")
    custom_url = snip.get("customUrl", "")
    country = snip.get("country") or country_from_branding(branding)

    subs_str = stats.get("subscriberCount", "0")
    subs = int(subs_str) if subs_str.isdigit() else 0
    if subs < min_subs or subs > max_subs:
        return None
    if looks_like_brand(title, description):
        return None

    score = teacher_score(title, description)
    # If the channel description doesn't clearly look like a teacher, pull recent
    # video descriptions and score those — they often reveal the persona.
    extra_text = ""
    if score == 0:
        uploads = (content.get("relatedPlaylists") or {}).get("uploads", "")
        extra_text = fetch_recent_video_descriptions(youtube, uploads)
        score = teacher_score(title, description + " " + extra_text)
        if score == 0:
            return None

    full_text = description + "\n" + extra_text
    emails = extract_emails(full_text)
    primary = emails[0] if emails else ""

    handle = (custom_url or channel.get("id", "")).lstrip("@")
    url = f"https://www.youtube.com/{'@' + handle if handle and not handle.startswith('UC') else 'channel/' + handle}"

    return Lead(
        company_name=title,
        email=primary,
        country=country,
        source="youtube_phonics_channel",
        curriculum="phonics / early reading",
        role="Teacher / Creator",
        website=url,
        notes=f"subs={subs}; teacher_score={score}" + ("; no email in desc" if not primary else ""),
        all_emails=emails[:10],
    )


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--queries", type=str, default="",
                    help="Comma-separated overrides (default: built-in phonics queries)")
    ap.add_argument("--per-query", type=int, default=50,
                    help="Max channels to pull per query (1 search.list call covers 50)")
    ap.add_argument("--min-subs", type=int, default=DEFAULT_MIN_SUBS)
    ap.add_argument("--max-subs", type=int, default=DEFAULT_MAX_SUBS)
    ap.add_argument("--out", type=str, default="output/youtube_teachers.csv")
    args = ap.parse_args(argv)

    api_key = os.environ.get("YOUTUBE_API_KEY")
    if not api_key:
        print("YOUTUBE_API_KEY not set in env. See youtube_teachers.py header for setup steps.")
        return 1

    from googleapiclient.discovery import build
    youtube = build("youtube", "v3", developerKey=api_key, cache_discovery=False)

    queries = (
        [q.strip() for q in args.queries.split(",") if q.strip()]
        if args.queries else DEFAULT_QUERIES
    )

    print(f"Searching {len(queries)} queries x up to {args.per_query} channels each...")
    seen_ids: set[str] = set()
    for q in queries:
        try:
            ids = search_channels(youtube, q, max_results=args.per_query)
            new = [i for i in ids if i not in seen_ids]
            seen_ids.update(new)
            print(f"  '{q}': {len(ids)} found, {len(new)} new (total unique: {len(seen_ids)})")
        except Exception as e:
            print(f"  '{q}': ERROR {e}")

    all_ids = list(seen_ids)
    print(f"\nFetching metadata for {len(all_ids)} channels...")
    channels = fetch_channels(youtube, all_ids)
    print(f"  Got {len(channels)} channel records.")

    leads: list[Lead] = []
    skipped_brand = 0
    skipped_subs = 0
    skipped_score = 0
    with_email = 0
    for i, ch in enumerate(channels, 1):
        title = (ch.get("snippet") or {}).get("title", "(no title)")
        # cheap pre-classification for stats
        snip = ch.get("snippet", {}) or {}
        if looks_like_brand(snip.get("title", ""), snip.get("description", "")):
            skipped_brand += 1
        lead = channel_to_lead(ch, youtube, args.min_subs, args.max_subs)
        if lead is None:
            # could be subs out of range OR teacher_score still 0 after video scan
            # we don't distinguish here; rerun with widened subs for debugging
            continue
        leads.append(lead)
        if lead.email:
            with_email += 1
        if i % 25 == 0:
            print(f"  processed {i}/{len(channels)} (kept {len(leads)}, {with_email} with email)")

    # Note: channel IDs are already deduped via seen_ids above; we deliberately
    # skip common.dedupe_leads here because it dedupes by website root-domain,
    # which collapses every youtube.com URL to a single row.
    out_path = Path(__file__).parent / args.out
    n = write_leads_csv(leads, out_path)
    found = sum(1 for lead in leads if lead.email)
    print(f"\nWrote {n} channels ({found} with public email) -> {out_path}")
    if skipped_brand:
        print(f"  ({skipped_brand} skipped as brand/aggregator)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
