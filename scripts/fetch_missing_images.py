#!/usr/bin/env python3
"""Fetch poster images for film pages that are missing an image field."""

import re
import time
import urllib.request
from pathlib import Path

CONTENT_DIR = Path(__file__).parent.parent / "content" / "films"
HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}


def fetch_poster(film_slug):
    url = f"https://letterboxd.com/film/{film_slug}/"
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode("utf-8", errors="replace")
        # Portrait poster: film-poster path OR sm/upload with portrait crop dimensions
        m = re.search(r"https://a\.ltrbxd\.com/resized/film-poster/[^\s\"']+", html)
        if not m:
            m = re.search(r"https://a\.ltrbxd\.com/resized/sm/upload/[^\s\"']*?-0-\d+-0-\d+-crop\.jpg[^\s\"']*", html)
        return m.group(0) if m else ""
    except Exception as e:
        print(f"  ! {film_slug}: {e}")
        return ""


def patch_image(path, image_url):
    text = path.read_text()
    # Insert image: after externalUrl line
    text = re.sub(
        r'(externalUrl: "[^"]*"\n)',
        f'\\1image: "{image_url}"\n',
        text,
        count=1,
    )
    path.write_text(text)


def main():
    missing = [p for p in sorted(CONTENT_DIR.glob("*.md")) if "image:" not in p.read_text()]
    print(f"{len(missing)} films missing images.")

    done = 0
    for path in missing:
        slug = path.stem
        image_url = fetch_poster(slug)
        if image_url:
            patch_image(path, image_url)
            print(f"+ {slug}")
            done += 1
        else:
            print(f"- {slug} (no poster found)")
        time.sleep(0.3)

    print(f"\n{done}/{len(missing)} images added.")


if __name__ == "__main__":
    main()
