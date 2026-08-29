#!/usr/bin/env python3
"""Import record.club reviews as Hugo content files in content/albums/."""

import re
import urllib.request
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from pathlib import Path
from thumbs import THUMBS_ROOT, fetch_thumb, thumb_path

RECORDCLUB_USER = "nm"
RSS_URL = f"https://record.club/{RECORDCLUB_USER}/reviews/rss"
CONTENT_DIR = Path(__file__).parent.parent / "content" / "albums"
CONTENT_NS = "http://purl.org/rss/1.0/modules/content/"


def slug_from_url(url):
    parts = [p for p in url.rstrip("/").split("/") if p]
    return parts[-1] if parts else "unknown"


def strip_html(html):
    html = re.sub(r"<img[^>]*>", "", html)
    html = re.sub(r"<p>\s*Listened:.*?</p>", "", html, flags=re.IGNORECASE)
    html = re.sub(r"<br\s*/?>", "\n\n", html, flags=re.IGNORECASE)
    html = re.sub(r"</p\s*>", "\n\n", html, flags=re.IGNORECASE)
    html = re.sub(r"<[^>]+>", "", html)
    html = re.sub(r"(?<!\n)\n(?!\n)", "\n\n", html)
    html = re.sub(r"\n{3,}", "\n\n", html)
    return html.strip()


def parse_title_rating(raw):
    # "'Album' by Artist - ★★★" → ("Album by Artist", "★★★")
    raw = raw.strip()
    rating_match = re.search(r"(★+½?)$", raw)
    rating = rating_match.group(1) if rating_match else ""
    title = re.sub(r"\s*-\s*★.*$", "", raw).strip()
    title = re.sub(r"^'(.*)'", r"\1", title)
    return title, rating


def yaml_str(s):
    return s.replace("'", "''")


def main():
    CONTENT_DIR.mkdir(parents=True, exist_ok=True)

    req = urllib.request.Request(RSS_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resp:
        data = resp.read()

    # record.club appends HTML after the XML; truncate at </rss>
    end = data.find(b"</rss>")
    if end != -1:
        data = data[: end + len(b"</rss>")]

    root = ET.fromstring(data)

    new_count = 0
    for item in root.findall(".//item"):
        link = item.findtext("link", "").strip()
        slug = slug_from_url(link)
        out_path = CONTENT_DIR / f"{slug}.md"

        pub_date = item.findtext("pubDate", "")
        try:
            dt = parsedate_to_datetime(pub_date)
            date_iso = dt.isoformat()
        except Exception:
            date_iso = pub_date

        raw_title = item.findtext("title", "")
        title, rating = parse_title_rating(raw_title)

        encoded_el = item.find(f"{{{CONTENT_NS}}}encoded")
        image_url = ""
        review = ""
        if encoded_el is not None and encoded_el.text:
            img_match = re.search(r'<img[^>]+src="([^"]+)"', encoded_el.text)
            image_url = img_match.group(1) if img_match else ""
            review = strip_html(encoded_el.text).strip()

        existing_thumb = ""
        if out_path.exists():
            m = re.search(r'^thumb:\s*"([^"]+)"', out_path.read_text(), re.MULTILINE)
            existing_thumb = m.group(1) if m else ""

        lines = [
            "---",
            f"title: '{yaml_str(title)}'",
            f"date: {date_iso}",
            f'externalUrl: "{link}"',
        ]
        if image_url:
            lines.append(f'image: "{image_url}"')
            thumb_url = existing_thumb or thumb_path("albums", slug)
            if existing_thumb:
                lines.append(f'thumb: "{thumb_url}"')
            elif fetch_thumb(image_url, THUMBS_ROOT / "albums" / f"{slug}.webp"):
                lines.append(f'thumb: "{thumb_url}"')
        if rating:
            lines.append(f"rating: '{rating}'")
        lines += ["---", ""]
        if review:
            lines.append(review)

        out_path.write_text("\n".join(lines) + "\n")
        print(f"+ {slug}")
        new_count += 1

    print(f"\n{new_count} new album(s) imported.")


if __name__ == "__main__":
    main()
