"""International schools scraper.

Visits each school's public website, finds contact pages, extracts admissions/
admin/principal emails. Outputs GoHighLevel-compatible CSV.

Run:
    py -3.12 schools_scraper.py
    py -3.12 schools_scraper.py --limit 5     # test on first 5 seeds
    py -3.12 schools_scraper.py --countries Egypt,Vietnam
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path
from urllib.parse import urlparse

import tldextract

from common import (
    Lead,
    _root_domain,
    dedupe_leads,
    discover_contact_pages,
    extract_emails,
    fetch,
    visible_text,
    write_leads_csv,
)


SEEDS: list[dict] = [
    # Egypt --- British curriculum focus
    {"name": "New Cairo British International School", "country": "Egypt", "city": "Cairo", "website": "https://www.ncbis.co.uk/", "curriculum": "British"},
    {"name": "The British International School Cairo", "country": "Egypt", "city": "Cairo", "website": "https://bisc.edu.eg/", "curriculum": "British"},
    {"name": "Modern English School Cairo", "country": "Egypt", "city": "Cairo", "website": "https://www.mescairo.com/", "curriculum": "British/IB"},
    {"name": "British International College of Cairo", "country": "Egypt", "city": "Cairo", "website": "https://www.bicc.edu.eg/", "curriculum": "British"},
    {"name": "Cairo English School", "country": "Egypt", "city": "Cairo", "website": "https://www.cesegypt.com/", "curriculum": "British"},

    # Vietnam
    {"name": "British International School Vietnam (Hanoi)", "country": "Vietnam", "city": "Hanoi", "website": "https://www.nordangliaeducation.com/bis-hanoi", "curriculum": "British"},
    {"name": "British Vietnamese International School Hanoi", "country": "Vietnam", "city": "Hanoi", "website": "https://www.bvisvietnam.com/hanoi", "curriculum": "British"},
    {"name": "International School Ho Chi Minh City", "country": "Vietnam", "city": "Ho Chi Minh City", "website": "https://www.ishcmc.com/", "curriculum": "IB"},
    {"name": "Saigon South International School", "country": "Vietnam", "city": "Ho Chi Minh City", "website": "https://www.ssis.edu.vn/", "curriculum": "American"},

    # Thailand
    {"name": "Bangkok Patana School", "country": "Thailand", "city": "Bangkok", "website": "https://www.patana.ac.th/", "curriculum": "British"},
    {"name": "Harrow International School Bangkok", "country": "Thailand", "city": "Bangkok", "website": "https://www.harrowschool.ac.th/", "curriculum": "British"},
    {"name": "St Andrews International School Bangkok", "country": "Thailand", "city": "Bangkok", "website": "https://www.standrews.ac.th/", "curriculum": "British"},
    {"name": "Shrewsbury International School Bangkok", "country": "Thailand", "city": "Bangkok", "website": "https://www.shrewsbury.ac.th/", "curriculum": "British"},

    # Indonesia
    {"name": "British School Jakarta", "country": "Indonesia", "city": "Jakarta", "website": "https://www.bsj.sch.id/", "curriculum": "British"},
    {"name": "Australian Independent School Jakarta", "country": "Indonesia", "city": "Jakarta", "website": "https://www.ais-indonesia.com/", "curriculum": "Australian"},
    {"name": "Sekolah Pelita Harapan", "country": "Indonesia", "city": "Jakarta", "website": "https://www.sph.edu/", "curriculum": "IB"},

    # Malaysia
    {"name": "Alice Smith School Kuala Lumpur", "country": "Malaysia", "city": "Kuala Lumpur", "website": "https://www.alice-smith.edu.my/", "curriculum": "British"},
    {"name": "Garden International School", "country": "Malaysia", "city": "Kuala Lumpur", "website": "https://www.gardenschool.edu.my/", "curriculum": "British"},
    {"name": "Marlborough College Malaysia", "country": "Malaysia", "city": "Johor", "website": "https://www.marlboroughcollege.my/", "curriculum": "British"},

    # Kenya
    {"name": "Braeburn Schools Kenya", "country": "Kenya", "city": "Nairobi", "website": "https://www.braeburn.com/", "curriculum": "British"},
    {"name": "International School of Kenya", "country": "Kenya", "city": "Nairobi", "website": "https://www.isk.ac.ke/", "curriculum": "American/IB"},
    {"name": "Hillcrest International Schools", "country": "Kenya", "city": "Nairobi", "website": "https://www.hillcrest.ac.ke/", "curriculum": "British"},
    {"name": "Banda School", "country": "Kenya", "city": "Nairobi", "website": "https://www.bandaschool.com/", "curriculum": "British"},

    # Nigeria
    {"name": "British International School Lagos", "country": "Nigeria", "city": "Lagos", "website": "https://www.bislagos.org/", "curriculum": "British"},
    {"name": "Lekki British School", "country": "Nigeria", "city": "Lagos", "website": "https://www.lekkibritishschool.org/", "curriculum": "British"},
    {"name": "Greensprings School Lagos", "country": "Nigeria", "city": "Lagos", "website": "https://www.greenspringsschool.com/", "curriculum": "British"},

    # Ghana
    {"name": "Ghana International School", "country": "Ghana", "city": "Accra", "website": "https://www.gis.edu.gh/", "curriculum": "British/IB"},
    {"name": "Lincoln Community School", "country": "Ghana", "city": "Accra", "website": "https://www.lincoln.edu.gh/", "curriculum": "American/IB"},

    # South Africa
    {"name": "American International School of Johannesburg", "country": "South Africa", "city": "Johannesburg", "website": "https://www.aisj-jhb.com/", "curriculum": "American/IB"},
    {"name": "St Cyprians School", "country": "South Africa", "city": "Cape Town", "website": "https://www.stcyprians.co.za/", "curriculum": "South African"},
]


def find_email_for_school(school: dict) -> Lead:
    home = school["website"].rstrip("/") + "/"
    domain = _root_domain(home)
    lead = Lead(
        company_name=school["name"],
        country=school["country"],
        city=school["city"],
        website=home,
        curriculum=school.get("curriculum", ""),
        source="manual_seed",
        role="Headteacher/Admissions",
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

    # rank: same-domain emails first, then priority localparts
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
    ap.add_argument("--limit", type=int, default=0, help="Only process first N seeds")
    ap.add_argument("--countries", type=str, default="", help="Comma-separated country filter")
    ap.add_argument("--out", type=str, default="output/international_schools.csv")
    args = ap.parse_args(argv)

    seeds = SEEDS
    if args.countries:
        wanted = {c.strip().lower() for c in args.countries.split(",")}
        seeds = [s for s in seeds if s["country"].lower() in wanted]
    if args.limit:
        seeds = seeds[: args.limit]

    print(f"Processing {len(seeds)} schools...")
    leads: list[Lead] = []
    for i, school in enumerate(seeds, 1):
        print(f"[{i}/{len(seeds)}] {school['name']} ({school['country']})")
        lead = find_email_for_school(school)
        status = lead.email or f"FAIL: {lead.notes}"
        print(f"    -> {status}")
        leads.append(lead)

    leads = dedupe_leads(leads)
    out_path = Path(__file__).parent / args.out
    n = write_leads_csv(leads, out_path)
    found = sum(1 for l in leads if l.email)
    print(f"\nWrote {n} rows ({found} with email, {n - found} without) -> {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
