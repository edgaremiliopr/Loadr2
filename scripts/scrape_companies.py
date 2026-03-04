#!/usr/bin/env python3
"""Starter scraper for Florida carrier / shipper research.

Uses Scrapling 0.4.1 to fetch public pages and enrich a seed list with:
- page title
- emails
- phone numbers
- forklift / piggyback / moffett keyword hits

Usage:
  python scripts/scrape_companies.py research/seed-targets.csv
"""

from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path

from scrapling.fetchers import Fetcher

KEYWORDS = [
    "truck-mounted forklift",
    "truck mounted forklift",
    "piggyback forklift",
    "piggyback",
    "moffett",
    "jobsite delivery",
    "self-unload",
    "liftgate",
]

EMAIL_RE = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.IGNORECASE)
PHONE_RE = re.compile(
    r"(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}"
)


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def extract_keywords(text: str) -> list[str]:
    lowered = text.lower()
    return [keyword for keyword in KEYWORDS if keyword in lowered]


def scrape(url: str) -> dict[str, object]:
    page = Fetcher.get(url, stealthy_headers=True, timeout=30000)
    text = normalize_text(page.get_all_text())
    title = page.css_first("title").text if page.css_first("title") else ""
    emails = sorted(set(EMAIL_RE.findall(text)))
    phones = sorted(set(PHONE_RE.findall(text)))

    return {
        "url": url,
        "title": normalize_text(title),
        "emails": emails,
        "phones": phones,
        "keyword_hits": extract_keywords(text),
        "text_preview": text[:500],
    }


def run(seed_file: Path) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []

    with seed_file.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            website = row.get("website")
            if not website:
                continue

            result = scrape(website)
            rows.append(
                {
                    "segment": row.get("segment"),
                    "company": row.get("company"),
                    "city": row.get("city"),
                    "notes": row.get("notes"),
                    **result,
                }
            )

    return rows


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python scripts/scrape_companies.py research/seed-targets.csv")
        return 1

    seed_path = Path(sys.argv[1]).resolve()
    output_path = seed_path.with_suffix(".json")
    results = run(seed_path)
    output_path.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"Wrote {len(results)} records to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
