#!/usr/bin/env python3
"""Import Letterboxd diary entries as Hugo content files in content/films/."""

import json
import re
import time
import urllib.request
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from pathlib import Path

LETTERBOXD_USER = "ebua"
RSS_URL = f"https://letterboxd.com/{LETTERBOXD_USER}/rss/"
CONTENT_DIR = Path(__file__).parent.parent / "content" / "films"
CACHE_FILE = Path(__file__).parent / ".director_cache.json"
LB_NS = "https://letterboxd.com"


def slug_from_url(url):
    parts = [p for p in url.rstrip("/").split("/") if p]
    try:
        idx = parts.index("film")
        tail = parts[idx + 1:]
        return "-".join(tail) if tail else parts[-1]
    except ValueError:
        return parts[-1]


def film_page_url(diary_link):
    parts = diary_link.rstrip("/").split("/")
    try:
        idx = parts.index("film")
        return "https://letterboxd.com/" + "/".join(parts[idx:]) + "/"
    except ValueError:
        return None


def fetch_director(film_url, cache):
    if film_url in cache:
        return cache[film_url]
    try:
        req = urllib.request.Request(film_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode("utf-8", errors="replace")
        match = re.search(r'Directed by">\s*<meta name="twitter:data1"\s+content="([^"]+)"', html)
        director = match.group(1) if match else ""
    except Exception:
        director = ""
    cache[film_url] = director
    time.sleep(0.3)
    return director


def strip_html(html):
    html = re.sub(r"<img[^>]*>", "", html)
    html = re.sub(r"<br\s*/?>", "\n\n", html, flags=re.IGNORECASE)
    html = re.sub(r"</p\s*>", "\n\n", html, flags=re.IGNORECASE)
    html = re.sub(r"<[^>]+>", "", html)
    html = html.replace("&nbsp;", " ")
    html = html.replace("&#8203;", "")
    html = html.replace("&#039;", "'").replace("&apos;", "'")
    html = html.replace("&quot;", '"').replace("&lt;", "<").replace("&gt;", ">")
    html = html.replace("&amp;", "&")
    html = re.sub(r"(?<!\n)\n(?!\n)", "\n\n", html)
    html = re.sub(r"\n{3,}", "\n\n", html)
    return html.strip()


def yaml_str(s):
    return s.replace("'", "''")


def main():
    CONTENT_DIR.mkdir(parents=True, exist_ok=True)

    cache = {}
    if CACHE_FILE.exists():
        cache = json.loads(CACHE_FILE.read_text())

    req = urllib.request.Request(
        RSS_URL,
        headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"},
    )
    with urllib.request.urlopen(req) as resp:
        data = resp.read()

    root = ET.fromstring(data)

    new_count = 0
    for item in root.findall(".//item"):
        link = item.findtext("link", "").strip()
        if "/list/" in link:
            continue
        slug = slug_from_url(link)
        out_path = CONTENT_DIR / f"{slug}.md"

        pub_date = item.findtext("pubDate", "")
        try:
            dt = parsedate_to_datetime(pub_date)
            date_iso = dt.isoformat()
        except Exception:
            date_iso = pub_date

        film_title_el = item.find(f"{{{LB_NS}}}filmTitle")
        film_year_el = item.find(f"{{{LB_NS}}}filmYear")
        film_title = film_title_el.text if film_title_el is not None else ""
        film_year = film_year_el.text if film_year_el is not None else ""

        if not film_title:
            raw = item.findtext("title", "")
            film_title = re.sub(r",\s*\d{4}.*$", "", raw).strip()

        rating_el = item.find(f"{{{LB_NS}}}memberRating")
        rating = ""
        if rating_el is not None and rating_el.text:
            try:
                val = float(rating_el.text)
                full = int(val)
                half = val - full >= 0.5
                rating = "★" * full + ("½" if half else "")
            except ValueError:
                pass

        desc = item.findtext("description") or ""
        img_match = re.search(r'<img[^>]+src="([^"]+)"', desc)
        image_url = img_match.group(1) if img_match else ""
        review = strip_html(desc).strip()

        fp_url = film_page_url(link)
        director = fetch_director(fp_url, cache) if fp_url else ""

        if director:
            title_line = f"{film_title} by {director} ({film_year})" if film_year else f"{film_title} by {director}"
        else:
            title_line = f"{film_title} ({film_year})" if film_year else film_title

        lines = [
            "---",
            f"title: '{yaml_str(title_line)}'",
            f"date: {date_iso}",
            f'externalUrl: "{link}"',
        ]
        if image_url:
            lines.append(f'image: "{image_url}"')
        if rating:
            lines.append(f"rating: '{rating}'")
        if director:
            lines.append(f"director: '{yaml_str(director)}'")
        lines += ["---", ""]
        if review:
            lines.append(review)

        out_path.write_text("\n".join(lines) + "\n")
        print(f"+ {slug} ({director or 'no director'})")
        new_count += 1

    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2))
    print(f"\n{new_count} film(s) imported.")


if __name__ == "__main__":
    main()
