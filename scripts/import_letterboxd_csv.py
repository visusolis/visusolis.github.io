#!/usr/bin/env python3
"""Import full Letterboxd history from export ZIP into content/films/.

Usage: python3 scripts/import_letterboxd_csv.py /path/to/letterboxd-export.zip
"""

import csv
import io
import json
import re
import sys
import time
import urllib.request
import zipfile
from pathlib import Path

CONTENT_DIR = Path(__file__).parent.parent / "content" / "films"
CACHE_FILE = Path(__file__).parent / ".director_cache.json"
SLUG_CACHE_FILE = Path(__file__).parent / ".slug_cache.json"


def resolve_slug(short_url, slug_cache):
    """Follow short URL redirect to extract Letterboxd film slug."""
    if short_url in slug_cache:
        return slug_cache[short_url]
    try:
        req = urllib.request.Request(
            short_url,
            headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"},
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            final_url = resp.url
        # final_url looks like https://letterboxd.com/ebua/film/chungking-express/
        parts = [p for p in final_url.rstrip("/").split("/") if p]
        try:
            idx = parts.index("film")
            slug = "-".join(parts[idx + 1:]) if parts[idx + 1:] else parts[-1]
        except ValueError:
            slug = parts[-1]
    except Exception as e:
        print(f"  ! resolve failed for {short_url}: {e}")
        slug = ""
    slug_cache[short_url] = slug
    time.sleep(0.2)
    return slug


def fetch_director(film_url, dir_cache):
    if film_url in dir_cache:
        return dir_cache[film_url]
    try:
        req = urllib.request.Request(
            film_url,
            headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"},
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode("utf-8", errors="replace")
        match = re.search(r'Directed by">\s*<meta name="twitter:data1"\s+content="([^"]+)"', html)
        director = match.group(1) if match else ""
    except Exception:
        director = ""
    dir_cache[film_url] = director
    time.sleep(0.3)
    return director


def rating_stars(raw):
    if not raw:
        return ""
    try:
        val = float(raw)
        full = int(val)
        half = val - full >= 0.5
        return "★" * full + ("½" if half else "")
    except ValueError:
        return ""


def yaml_str(s):
    return s.replace("'", "''")


def clean_review(text):
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    return text.strip()


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 import_letterboxd_csv.py <path-to-zip>")
        sys.exit(1)

    zip_path = sys.argv[1]
    CONTENT_DIR.mkdir(parents=True, exist_ok=True)

    dir_cache = json.loads(CACHE_FILE.read_text()) if CACHE_FILE.exists() else {}
    slug_cache = json.loads(SLUG_CACHE_FILE.read_text()) if SLUG_CACHE_FILE.exists() else {}

    with zipfile.ZipFile(zip_path) as zf:
        with zf.open("reviews.csv") as f:
            rows = list(csv.DictReader(io.TextIOWrapper(f, encoding="utf-8")))

    print(f"Found {len(rows)} reviews in CSV.")

    new_count = 0
    skip_count = 0

    for row in rows:
        name = row["Name"].strip()
        year = row["Year"].strip()
        short_url = row["Letterboxd URI"].strip()
        rating_raw = row["Rating"].strip()
        review_text = clean_review(row.get("Review", ""))
        watched_date = row.get("Watched Date", "").strip() or row.get("Date", "").strip()

        if not short_url:
            print(f"  - skipping '{name}' (no URI)")
            continue

        slug = resolve_slug(short_url, slug_cache)
        if not slug:
            print(f"  - skipping '{name}' (could not resolve slug)")
            continue

        out_path = CONTENT_DIR / f"{slug}.md"
        if out_path.exists():
            skip_count += 1
            continue

        # Fetch director
        film_page_url = f"https://letterboxd.com/film/{slug}/"
        director = fetch_director(film_page_url, dir_cache)

        rating = rating_stars(rating_raw)

        if director:
            title_line = f"{name} by {director} ({year})" if year else f"{name} by {director}"
        else:
            title_line = f"{name} ({year})" if year else name

        # Use watched date for Hugo date field
        date_str = f"{watched_date}T00:00:00+00:00" if watched_date else "2000-01-01T00:00:00+00:00"

        diary_url = f"https://letterboxd.com/ebua/film/{slug}/"

        lines = [
            "---",
            f"title: '{yaml_str(title_line)}'",
            f"date: {date_str}",
            f'externalUrl: "{diary_url}"',
        ]
        if rating:
            lines.append(f"rating: '{rating}'")
        if director:
            lines.append(f"director: '{yaml_str(director)}'")
        lines += ["---", ""]
        if review_text:
            lines.append(review_text)

        out_path.write_text("\n".join(lines) + "\n")
        print(f"+ {slug} — {director or 'no director'}")
        new_count += 1

    CACHE_FILE.write_text(json.dumps(dir_cache, ensure_ascii=False, indent=2))
    SLUG_CACHE_FILE.write_text(json.dumps(slug_cache, ensure_ascii=False, indent=2))
    print(f"\n{new_count} imported, {skip_count} skipped (already exist).")


if __name__ == "__main__":
    main()
