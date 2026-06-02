"""Teachers Pay Teachers (TPT) seller scraper.

How it works:
  1. Search TPT for phonics-related keywords -> get product listing pages.
  2. From each product page, extract the seller's store URL.
  3. Visit the seller's TPT store page; extract the seller's linked external
     website (their blog / portfolio).
  4. Visit that external site; reuse common.py to find a contact email.

Output: leadgen/output/tpt_sellers.csv — GHL-import-ready.

TPT serves heavy HTML and hides some metadata behind Next.js __NEXT_DATA__
blocks. We parse both rendered HTML and the JSON payload to be robust.

Run:
    py -3.12 tpt_scraper.py
    py -3.12 tpt_scraper.py --queries "phonics,decodable readers,letters and sounds" --max-sellers 30
    py -3.12 tpt_scraper.py --skip-discovery  # use cached seller list only
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.parse
from pathlib import Path

from bs4 import BeautifulSoup

from common import (
    Lead,
    _root_domain,
    dedupe_leads,
    discover_contact_pages,
    extract_emails,
    fetch,
    write_leads_csv,
)


DEFAULT_QUERIES = [
    "phonics",
    "decodable readers",
    "letters and sounds",
    "science of reading",
    "kindergarten phonics",
    "first grade reading",
    "eyfs phonics",
    "synthetic phonics",
]

# TPT search URLs (use Browse/Search which works without auth)
TPT_SEARCH_URL = "https://www.teacherspayteachers.com/Browse/Search:{q}"

# Store-page URL pattern, e.g. /Store/Anna-Geiger
TPT_STORE_RE = re.compile(r"/[Ss]tore/[A-Za-z0-9\-_]+")


def discover_store_urls(query: str, max_results: int = 25) -> list[str]:
    """Search TPT for `query`, return up to max_results unique store URLs."""
    url = TPT_SEARCH_URL.format(q=urllib.parse.quote(query))
    html = fetch(url)
    if not html:
        return []
    # Store URLs appear both in rendered links and in __NEXT_DATA__ JSON.
    stores: list[str] = []
    seen: set[str] = set()

    # 1) Rendered <a href> scan. Normalise to canonical /Store/ casing so
    # downstream URLs are consistent.
    for match in TPT_STORE_RE.finditer(html):
        path = match.group(0)
        # canonicalise: TPT serves both /store/ and /Store/; force /Store/
        path = "/Store/" + path.split("/", 2)[2]
        full = "https://www.teacherspayteachers.com" + path
        if full not in seen:
            seen.add(full)
            stores.append(full)
            if len(stores) >= max_results:
                return stores

    # 2) __NEXT_DATA__ JSON payload
    soup = BeautifulSoup(html, "lxml")
    nd = soup.find("script", id="__NEXT_DATA__")
    if nd and nd.string:
        try:
            data = json.loads(nd.string)
            payload_str = json.dumps(data)
            for match in TPT_STORE_RE.finditer(payload_str):
                full = "https://www.teacherspayteachers.com" + match.group(0)
                if full not in seen:
                    seen.add(full)
                    stores.append(full)
                    if len(stores) >= max_results:
                        return stores
        except Exception:
            pass

    return stores[:max_results]


_SKIP_HOSTS = (
    "teacherspayteachers", "tpt.com", "ixl.com", "quizlet.com", "rosettastone.com",
    "wyzant.com", "education.com", "vocabulary.com", "thesaurus.com", "dictionary.com",
    "spanishdictionary.com", "frenchdictionary.com", "ingles.com", "abcya.com",
    "emmersion.ai",  # IXL-owned / cross-brand bar; not the seller's site
    "facebook.com", "twitter.com", "x.com", "instagram.com", "pinterest.com",
    "youtube.com", "youtu.be", "tiktok.com", "linkedin.com",
    "w3.org", "schema.org", "fonts.gstatic", "googleapis.com", "googletagmanager.com",
    "google-analytics.com", "doubleclick.net", "cloudfront.net", "amazonaws.com",
)

_INLINE_URL_RE = re.compile(
    r"https?://[a-zA-Z0-9\-\.]+\.[a-z]{2,}(?:/[^\s\"'<>)]*)?",
    re.IGNORECASE,
)


def _is_relevant_url(url: str) -> bool:
    host = urllib.parse.urlparse(url).netloc.lower()
    if not host:
        return False
    return not any(s in host for s in _SKIP_HOSTS)


def extract_external_link(store_url: str, html: str) -> tuple[str, str]:
    """From a TPT store page, return (seller_name, external_website_url).

    TPT (now IXL-owned) renders cross-brand promo anchors on every store page,
    so anchor-tag scans return IXL's own brands. The seller's actual website
    appears as BARE TEXT in their bio ("Please visit us at: example.com").
    We strip out all `<a>` tags before scanning, which leaves the bio text.
    """
    soup = BeautifulSoup(html, "lxml")

    # Seller display name
    name = ""
    h1 = soup.find("h1")
    if h1:
        name = h1.get_text(strip=True)
    if not name:
        title = soup.find("title")
        name = (title.get_text(strip=True) if title else "").split(" - ")[0]
        name = name.replace("TpT", "").replace("Teachers Pay Teachers", "").strip()

    # Remove anchors so we only see text. Bio URLs are bare text in TPT.
    text_soup = BeautifulSoup(html, "lxml")
    for a in text_soup.find_all("a"):
        a.decompose()
    plain = text_soup.get_text(" ", strip=True)

    candidates: list[str] = []
    for url_match in _INLINE_URL_RE.finditer(plain):
        u = url_match.group(0).rstrip(".,);")
        if _is_relevant_url(u) and u not in candidates:
            candidates.append(u)

    # __NEXT_DATA__ JSON payload sometimes has a dedicated seller-website field.
    nd = soup.find("script", id="__NEXT_DATA__")
    if nd and nd.string:
        try:
            blob = nd.string
            for url_match in re.finditer(
                r'"(?:website|homepage|blogUrl|websiteUrl|sellerUrl)":\s*"(https?://[^"]+)"',
                blob,
            ):
                u = url_match.group(1)
                if _is_relevant_url(u) and u not in candidates:
                    candidates.insert(0, u)
        except Exception:
            pass

    external = candidates[0] if candidates else ""
    return name, external


def find_lead_for_seller(store_url: str) -> Lead | None:
    html = fetch(store_url)
    if not html:
        return None
    name, external = extract_external_link(store_url, html)
    parts = (name or "").split(" ", 1)
    first = parts[0] if parts else ""
    last = parts[1] if len(parts) > 1 else ""

    lead = Lead(
        first_name=first,
        last_name=last,
        company_name=name,
        source="tpt",
        role="Teacher / Creator (TPT seller)",
        curriculum="phonics / early reading",
        website=external or store_url,
        notes=f"TPT store: {store_url}",
    )

    if not external:
        lead.notes += "; no external website linked from TPT store"
        return lead

    # Now go to the seller's external site and find an email.
    ext_html = fetch(external)
    if not ext_html:
        lead.notes += f"; external site unreachable ({external})"
        return lead

    all_emails: list[str] = []
    all_emails.extend(extract_emails(ext_html, domain_hint=external))
    for page in discover_contact_pages(external, ext_html):
        page_html = fetch(page)
        if not page_html:
            continue
        all_emails.extend(extract_emails(page_html, domain_hint=external))

    seen: set[str] = set()
    unique = []
    for e in all_emails:
        if e in seen:
            continue
        seen.add(e)
        unique.append(e)

    domain = _root_domain(external)
    same_domain = [e for e in unique if _root_domain(e.split("@", 1)[1]) == domain]
    other_domain = [e for e in unique if e not in same_domain]
    ranked = same_domain + other_domain

    if ranked:
        lead.email = ranked[0]
        lead.all_emails = ranked[:10]
    else:
        lead.notes += "; no email found on external site"
    return lead


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--queries", type=str, default="")
    ap.add_argument("--max-sellers", type=int, default=40,
                    help="Hard cap on total sellers to scrape per run")
    ap.add_argument("--per-query", type=int, default=15)
    ap.add_argument("--out", type=str, default="output/tpt_sellers.csv")
    args = ap.parse_args(argv)

    queries = (
        [q.strip() for q in args.queries.split(",") if q.strip()]
        if args.queries else DEFAULT_QUERIES
    )

    print(f"Discovering TPT stores across {len(queries)} queries...")
    seen_stores: set[str] = set()
    store_order: list[str] = []
    for q in queries:
        urls = discover_store_urls(q, max_results=args.per_query)
        new = [u for u in urls if u not in seen_stores]
        seen_stores.update(new)
        store_order.extend(new)
        print(f"  '{q}': {len(urls)} stores found ({len(new)} new). Total unique: {len(seen_stores)}")
        if len(seen_stores) >= args.max_sellers:
            break

    store_order = store_order[: args.max_sellers]
    print(f"\nScraping {len(store_order)} seller stores + their external sites...")
    leads: list[Lead] = []
    for i, store in enumerate(store_order, 1):
        name_hint = store.rsplit("/", 1)[-1]
        print(f"[{i}/{len(store_order)}] {name_hint}")
        lead = find_lead_for_seller(store)
        if lead is None:
            print("    -> FAIL: store page unreachable")
            continue
        status = lead.email or f"FAIL: {lead.notes}"
        print(f"    -> {status[:100]}")
        leads.append(lead)

    leads = dedupe_leads(leads)
    out_path = Path(__file__).parent / args.out
    n = write_leads_csv(leads, out_path)
    found = sum(1 for lead in leads if lead.email)
    print(f"\nWrote {n} rows ({found} with email) -> {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
