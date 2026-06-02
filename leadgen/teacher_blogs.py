"""Teacher-blog contact scraper.

Mirrors schools_scraper.py but seeded with individual EYFS/KS1/phonics teacher
blogs. Each blog typically has a public "contact" page with the teacher's
email — they publish it to receive parent/teacher inquiries about their
resources.

Run:
    py -3.12 teacher_blogs.py
    py -3.12 teacher_blogs.py --limit 5
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from common import (
    Lead,
    _root_domain,
    dedupe_leads,
    discover_contact_pages,
    extract_emails,
    fetch,
    write_leads_csv,
)


SEEDS: list[dict] = [
    # US / SoR (Science of Reading) — biggest active phonics-teacher blog scene
    {"name": "The Measured Mom", "person": "Anna Geiger", "country": "USA",
     "website": "https://www.themeasuredmom.com/", "niche": "phonics / SoR / printables"},
    {"name": "This Reading Mama", "person": "Becky Spence", "country": "USA",
     "website": "https://thisreadingmama.com/", "niche": "phonics / homeschool"},
    {"name": "Education to the Core", "person": "Janessa Fletcher", "country": "USA",
     "website": "https://educationtothecore.com/", "niche": "primary / phonics"},
    {"name": "Mrs Wills Kindergarten", "person": "Deedee Wills", "country": "USA",
     "website": "https://www.deedeewills.com/", "niche": "kindergarten / phonics"},
    {"name": "Tunstall's Teaching Tidbits", "person": "Reagan Tunstall", "country": "USA",
     "website": "https://www.tunstallsteachingtidbits.com/", "niche": "primary"},
    {"name": "Susan Jones Teaching", "person": "Susan Jones", "country": "USA",
     "website": "https://susanjonesteaching.com/", "niche": "k-2 / phonics"},
    {"name": "Mr Greg's Kindergarten", "person": "Greg Smedley-Warren", "country": "USA",
     "website": "https://www.thekindergartensmorgasboard.com/", "niche": "kindergarten"},
    {"name": "Mrs Winter's Bliss", "person": "Christina Winter", "country": "USA",
     "website": "https://www.mrswintersbliss.com/", "niche": "k-2 / phonics"},
    {"name": "Saddle Up for Second Grade", "person": "Amber Polk", "country": "USA",
     "website": "https://saddleupfor2ndgrade.com/", "niche": "2nd grade / reading"},
    {"name": "First Grade Roars", "person": "Heather", "country": "USA",
     "website": "https://www.firstgraderoars.com/", "niche": "1st grade"},
    {"name": "Sarahs First Grade Snippets", "person": "Sarah Paul", "country": "USA",
     "website": "https://www.sarahsfirstgradesnippets.com/", "niche": "1st grade / phonics"},
    {"name": "Make Take Teach", "person": "Julie Van Alst", "country": "USA",
     "website": "https://maketaketeach.com/", "niche": "phonics / orton-gillingham"},
    {"name": "Sound City Reading", "person": "Kathryn J Davis", "country": "USA",
     "website": "https://www.soundcityreading.net/", "niche": "phonics / synthetic"},
    {"name": "Reading Simplified", "person": "Marnie Ginsberg", "country": "USA",
     "website": "https://readingsimplified.com/", "niche": "phonics / SoR"},

    # UK
    {"name": "Phonics International", "person": "Debbie Hepplewhite", "country": "UK",
     "website": "https://www.phonicsinternational.com/", "niche": "phonics / SSP"},
    {"name": "Sounds-Write", "person": "Sounds-Write team", "country": "UK",
     "website": "https://sounds-write.co.uk/", "niche": "phonics / SSP"},
    {"name": "Reading Reform Foundation", "person": "RRF team", "country": "UK",
     "website": "https://www.rrf.org.uk/", "niche": "phonics advocacy / SSP"},

    # Australia / NZ
    {"name": "Top Teacher", "person": "Five Roses Pty Ltd", "country": "Australia",
     "website": "https://www.topteacher.com.au/", "niche": "early primary"},
    {"name": "Galen Goodwin Longstreth", "person": "Galen", "country": "Australia",
     "website": "https://www.galengoodwinlongstreth.com/", "niche": "early literacy / SoR"},
]


def find_email_for_blog(blog: dict) -> Lead:
    home = blog["website"].rstrip("/") + "/"
    domain = _root_domain(home)
    person = blog.get("person", "")
    parts = person.split(" ", 1) if person else ["", ""]
    first = parts[0] if parts else ""
    last = parts[1] if len(parts) > 1 else ""

    lead = Lead(
        first_name=first,
        last_name=last,
        company_name=blog["name"],
        country=blog.get("country", ""),
        website=home,
        curriculum=blog.get("niche", ""),
        source="manual_seed_blog",
        role="Teacher / Blogger",
    )

    html = fetch(home)
    if not html:
        lead.notes = "homepage unreachable"
        return lead

    all_emails: list[str] = []
    all_emails.extend(extract_emails(html, domain_hint=home))

    contact_pages = discover_contact_pages(home, html)
    for page in contact_pages:
        page_html = fetch(page)
        if not page_html:
            continue
        all_emails.extend(extract_emails(page_html, domain_hint=home))

    unique: list[str] = []
    seen: set[str] = set()
    for e in all_emails:
        if e in seen:
            continue
        seen.add(e)
        unique.append(e)

    same_domain = [
        e for e in unique
        if _root_domain(e.split("@", 1)[1]) == domain
    ]
    other_domain = [e for e in unique if e not in same_domain]
    ranked = same_domain + other_domain

    if ranked:
        lead.email = ranked[0]
        lead.all_emails = ranked[:10]
    else:
        lead.notes = f"no email found across {len(contact_pages) + 1} pages"
    return lead


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--out", type=str, default="output/teacher_blogs.csv")
    args = ap.parse_args(argv)

    seeds = SEEDS[: args.limit] if args.limit else SEEDS
    print(f"Processing {len(seeds)} teacher blogs...")
    leads: list[Lead] = []
    for i, blog in enumerate(seeds, 1):
        print(f"[{i}/{len(seeds)}] {blog['name']} ({blog.get('person', '')})")
        lead = find_email_for_blog(blog)
        status = lead.email or f"FAIL: {lead.notes}"
        print(f"    -> {status}")
        leads.append(lead)

    leads = dedupe_leads(leads)
    out_path = Path(__file__).parent / args.out
    n = write_leads_csv(leads, out_path)
    found = sum(1 for lead in leads if lead.email)
    print(f"\nWrote {n} rows ({found} with email) -> {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
