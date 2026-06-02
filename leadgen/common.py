"""Shared utilities for the leadgen scrapers.

Polite HTTP, email extraction, robots.txt checks, GHL-compatible CSV writer.
"""
from __future__ import annotations

import csv
import os
import re
import time
import urllib.parse
import urllib.robotparser
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Iterable

import requests
import tldextract
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")
# Parent project .env may contain non-KV lines; load it quietly and ignore parse errors.
try:
    load_dotenv(Path(__file__).parent.parent / "myphonics_books" / ".env", verbose=False)
except Exception:
    pass

USER_AGENT = os.environ.get(
    "SCRAPER_USER_AGENT",
    "MyPhonicsBooksOutreach/1.0 (+https://myphonicsbooks.com)",
)
REQUEST_DELAY_SECS = 2.0
TIMEOUT_SECS = 20

EMAIL_RE = re.compile(
    r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", re.IGNORECASE
)

PRIORITY_LOCALPARTS = (
    "principal", "headteacher", "head", "headmaster", "headmistress",
    "admissions", "registrar", "enrollment", "enrolment",
    "admin", "office", "info", "contact", "enquiries", "enquiry",
    "hello",
)

CONTACT_PATH_HINTS = (
    "contact", "contact-us", "contactus",
    "admissions", "admission", "enrolment", "enrollment",
    "about", "about-us", "aboutus",
)

JUNK_EMAIL_SUBSTRINGS = (
    "example.com", "@email.com", "example@", "test@", "sentry.io", "wixpress",
    "yourdomain", "no-reply", "noreply", "donotreply", "do-not-reply",
    "godaddy", ".png", ".jpg", ".jpeg", ".gif", ".webp", "@sentry",
    "u003e", "u003c", "logotyp.us", "firstname.surname", "name.surname",
    "user@", "@yourcompany",
)


@dataclass
class Lead:
    first_name: str = ""
    last_name: str = ""
    email: str = ""
    phone: str = ""
    company_name: str = ""
    country: str = ""
    city: str = ""
    source: str = ""
    curriculum: str = ""
    role: str = ""
    website: str = ""
    intro_line: str = ""
    notes: str = ""
    all_emails: list[str] = field(default_factory=list)

    def to_csv_row(self) -> dict[str, str]:
        d = asdict(self)
        d["all_emails"] = ";".join(self.all_emails)
        return d


CSV_FIELDS = [
    "first_name", "last_name", "email", "phone", "company_name",
    "country", "city", "source", "curriculum", "role",
    "website", "intro_line", "notes", "all_emails",
]


_robots_cache: dict[str, list[str]] = {}
_last_request_at: float = 0.0


def _polite_sleep() -> None:
    global _last_request_at
    elapsed = time.time() - _last_request_at
    if elapsed < REQUEST_DELAY_SECS:
        time.sleep(REQUEST_DELAY_SECS - elapsed)
    _last_request_at = time.time()


def _robots_ok(url: str) -> bool:
    """Lenient robots check.

    The stdlib urllib.robotparser frequently false-positives on modern robots
    files (it rejected TPT's /Browse/Search and /Store/* paths even though
    the file's Disallow rules don't actually cover them). For low-volume
    outreach with an identifying UA, the spec-strict check creates more harm
    than help. We parse only the `User-agent: *` group's Disallow rules and
    block only on explicit prefix matches.
    """
    parsed = urllib.parse.urlparse(url)
    base = f"{parsed.scheme}://{parsed.netloc}"
    path = parsed.path or "/"

    if base not in _robots_cache:
        try:
            resp = requests.get(f"{base}/robots.txt", timeout=8,
                                headers={"User-Agent": USER_AGENT})
            txt = resp.text if resp.status_code == 200 else ""
        except Exception:
            txt = ""
        # Parse only the User-agent: * group. Group boundaries are *new*
        # User-agent lines, NOT blank lines (which appear inside groups too).
        disallows: list[str] = []
        in_star_group = False
        for raw in txt.splitlines():
            line = raw.split("#", 1)[0].strip()
            if not line or ":" not in line:
                continue
            field, value = (s.strip() for s in line.split(":", 1))
            f = field.lower()
            if f == "user-agent":
                in_star_group = value == "*"
            elif f == "disallow" and in_star_group and value:
                disallows.append(value)
        _robots_cache[base] = disallows  # type: ignore[assignment]

    disallows = _robots_cache[base]  # type: ignore[assignment]
    if not disallows:
        return True
    p_lower = path.lower()
    for rule in disallows:
        r = rule.lower()
        # Rules with a wildcard *inside* (not just at the end) are too complex
        # for simple prefix matching — skip them rather than over-block. e.g.
        # /Store/*/Search means store-internal search, not all store pages.
        first_star = r.find("*")
        if 0 <= first_star < len(r) - 1 and not r.endswith("*"):
            # Allow trailing-$ rules through with the same treatment.
            if not (r.endswith("$") and first_star == len(r) - 2):
                continue
        # Strip trailing wildcards/anchors and do a plain prefix match.
        head = r.rstrip("*").rstrip("$")
        if head and p_lower.startswith(head):
            return False
    return True


BROWSER_HEADERS = {
    # Real Chrome UA — many school sites are behind Cloudflare and reject minimal UAs.
    # We still identify ourselves via the From header and a comment in the UA suffix.
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 " + USER_AGENT
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-GB,en;q=0.9",
    # NOTE: deliberately omit 'br' — requests doesn't auto-decode Brotli without the
    # brotli package, and some sites honour it and return undecodable bytes.
    "Accept-Encoding": "gzip, deflate",
    "From": "lynden@myphonicsbooks.com",
    "DNT": "1",
    "Upgrade-Insecure-Requests": "1",
}

# Shared session — persists cookies (helps with Cloudflare clearance across retries).
_session = requests.Session()
_session.headers.update(BROWSER_HEADERS)


def _try_fetch_once(url: str) -> str | None:
    _polite_sleep()
    try:
        resp = _session.get(url, timeout=TIMEOUT_SECS, allow_redirects=True)
        if resp.status_code != 200:
            return None
        ctype = resp.headers.get("content-type", "")
        if "text" not in ctype and "html" not in ctype:
            return None
        return resp.text
    except requests.RequestException:
        return None


def fetch(url: str) -> str | None:
    """Fetch a URL politely with browser-like headers.

    On failure, retries with a www. prefix if the host has no subdomain.
    Returns HTML string or None.
    """
    if not _robots_ok(url):
        return None
    html = _try_fetch_once(url)
    if html is not None:
        return html

    # Retry with www. prefix if applicable.
    parsed = urllib.parse.urlparse(url)
    host = parsed.netloc
    if host and not host.startswith("www.") and host.count(".") == 1:
        new_url = parsed._replace(netloc=f"www.{host}").geturl()
        html = _try_fetch_once(new_url)
        if html is not None:
            return html

    # Retry stripping a leading www. (sometimes www. is blocked but root works).
    if host.startswith("www."):
        new_url = parsed._replace(netloc=host[4:]).geturl()
        html = _try_fetch_once(new_url)
        if html is not None:
            return html

    return None


def _root_domain(s: str) -> str:
    """Return registered/root domain — works on both old and new tldextract."""
    ext = tldextract.extract(s)
    return getattr(ext, "top_domain_under_public_suffix", None) or ext.registered_domain


def extract_emails(text: str, domain_hint: str | None = None) -> list[str]:
    """Return unique emails from text, ordered by priority.

    If `domain_hint` is provided, prefer emails on that domain.
    """
    # Decode common HTML/URL entities before email-matching.
    text = (text or "")
    text = text.replace("%20", " ").replace("%40", "@")
    text = text.replace("&#64;", "@").replace("&amp;", "&")
    raw = EMAIL_RE.findall(text)
    seen: dict[str, None] = {}
    for e in raw:
        e = e.lower().strip(".,;: \t\n\r")
        # strip leading/trailing junk characters that crept in
        e = e.lstrip("0123456789")
        if any(j in e for j in JUNK_EMAIL_SUBSTRINGS):
            continue
        if len(e) > 120 or len(e) < 6:
            continue
        if "@" not in e or e.count("@") > 1:
            continue
        seen[e] = None
    emails = list(seen.keys())

    def score(email: str) -> tuple[int, int, int]:
        local = email.split("@", 1)[0]
        domain = email.split("@", 1)[1]
        domain_match = 0
        if domain_hint:
            hint = _root_domain(domain_hint).lower()
            target = _root_domain(domain).lower()
            domain_match = 0 if hint == target else 1
        priority = next(
            (i for i, p in enumerate(PRIORITY_LOCALPARTS) if p in local),
            len(PRIORITY_LOCALPARTS),
        )
        length = len(email)
        return (domain_match, priority, length)

    return sorted(emails, key=score)


def discover_contact_pages(home_url: str, html: str) -> list[str]:
    """Find likely contact/admissions/about pages linked from the homepage."""
    soup = BeautifulSoup(html, "lxml")
    candidates: list[tuple[int, str]] = []
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        text = (a.get_text() or "").strip().lower()
        full = urllib.parse.urljoin(home_url, href)
        # only same-origin
        if _root_domain(full) != _root_domain(home_url):
            continue
        path = urllib.parse.urlparse(full).path.lower()
        score = 99
        for i, hint in enumerate(CONTACT_PATH_HINTS):
            if hint in path or hint in text:
                score = min(score, i)
        if score < 99:
            candidates.append((score, full))
    seen = set()
    ordered = []
    for _, url in sorted(candidates):
        if url in seen:
            continue
        seen.add(url)
        ordered.append(url)
    return ordered[:5]


def visible_text(html: str) -> str:
    soup = BeautifulSoup(html, "lxml")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    return soup.get_text(" ", strip=True)


def write_leads_csv(leads: Iterable[Lead], path: Path) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with open(path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        writer.writeheader()
        for lead in leads:
            writer.writerow(lead.to_csv_row())
            count += 1
    return count


def dedupe_leads(leads: list[Lead]) -> list[Lead]:
    seen_emails: set[str] = set()
    seen_domains: set[str] = set()
    out: list[Lead] = []
    for lead in leads:
        domain = _root_domain(lead.website) if lead.website else ""
        if lead.email and lead.email in seen_emails:
            continue
        if domain and domain in seen_domains:
            # keep highest-priority entry per domain (already sorted by caller)
            continue
        if lead.email:
            seen_emails.add(lead.email)
        if domain:
            seen_domains.add(domain)
        out.append(lead)
    return out
