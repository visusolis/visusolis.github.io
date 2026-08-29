#!/usr/bin/env python3
"""Create a new book review in content/books/.

Queries Open Library by ISBN to pull title, author and cover URL, writes a
Hugo markdown file (matching the films/albums front-matter shape), fetches a
lightweight local WebP thumbnail, and opens $EDITOR for the review body.

Usage:
    python3 scripts/new_book.py --isbn 9780141036144 [--rating "★★★★"] [--body B]

    --isbn     ISBN-10 or ISBN-13 (prompted if omitted)
    --rating   star string, e.g. '★★★★' or '★★★½' (prompted if omitted)
    --title    override the title Open Library returns
    --author   override the author Open Library returns
    --body     write the review body directly, skipping the editor
"""

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from thumbs import THUMBS_ROOT, fetch_thumb, thumb_path

ROOT = Path(__file__).resolve().parent.parent
BOOKS = ROOT / "content" / "books"

OL_BOOKS = "https://openlibrary.org/api/books?bibkeys=ISBN:{isbn}&format=json&jscmd=data"
HEADERS = {"User-Agent": "Mozilla/5.0 (visusolis book importer)"}


def slugify(text):
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug or datetime.now().strftime("%Y-%m-%d")


def unique_path(slug):
    path = BOOKS / f"{slug}.md"
    if not path.exists():
        return path
    for i in range(2, 100):
        cand = BOOKS / f"{slug}-{i}.md"
        if not cand.exists():
            return cand
    raise FileExistsError(f"too many colliding slugs for {slug}")


def query_openlibrary(isbn):
    req = urllib.request.Request(OL_BOOKS.format(isbn=isbn), headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return data.get(f"ISBN:{isbn}")


def edit_body():
    tmp = Path(tempfile.mktemp(suffix=".md"))
    editor = os.environ.get("EDITOR", "vim")
    subprocess.run([editor, str(tmp)])
    body = tmp.read_text() if tmp.exists() else ""
    tmp.unlink(missing_ok=True)
    return body.strip()



def to_stars(value):
    """Convert a numeric rating (0-5, may be .5) to star characters."""
    try:
        val = float(value)
    except (TypeError, ValueError):
        return value  # already stars or free text
    val = max(0, min(5, val))
    full = int(val)
    half = val - full >= 0.5
    return "\u2605" * full + ("\u00bd" if half else "")

def yaml_literal(value):
    return value.replace("'", "''")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--isbn")
    parser.add_argument("--rating")
    parser.add_argument("--title")
    parser.add_argument("--author")
    parser.add_argument("--body")
    parser.add_argument("--no-edit", action="store_true")
    args = parser.parse_args()

    isbn = args.isbn or input("ISBN: ").strip()
    meta = query_openlibrary(isbn)
    if meta is None:
        print(f"Open Library: no result for ISBN {isbn}", file=sys.stderr)
        sys.exit(1)

    title = args.title or meta.get("title") or input("Title: ").strip()
    authors = meta.get("authors") or []
    author = args.author or (authors[0]["name"] if authors else "") or input("Author: ").strip()
    rating = to_stars(args.rating or input("Rating (stars, e.g. 4 or 4.5): ").strip() or "4")

    cover = meta.get("cover") or {}
    image = cover.get("large") or cover.get("medium") or meta.get("thumbnail_url") or ""
    external = meta.get("url") or meta.get("info_url") or ""
    year = meta.get("publish_date") or meta.get("first_publish_year") or ""

    BOOKS.mkdir(parents=True, exist_ok=True)
    slug = slugify(f"{title} {author}")
    path = unique_path(slug)
    date = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S+00:00")

    body = args.body
    if body is None and not args.no_edit:
        print(f"writing {path.relative_to(ROOT)} — open editor for the review body")
        body = edit_body()

    title_line = f"{title} by {author}" if author else title
    front = (
        "---\n"
        f"title: '{yaml_literal(title_line)}'\n"
        f"date: {date}\n"
        f'externalUrl: "{external}"\n'
        f'image: "{image}"\n'
        'thumb: ""\n'
        f"rating: '{yaml_literal(rating)}'\n"
        f"author: '{yaml_literal(author)}'\n"
        "---\n\n"
    )
    path.write_text(front + (body or ""))

    if image:
        thumb_path_url = thumb_path("books", path.stem)
        if fetch_thumb(image, THUMBS_ROOT / "books" / f"{path.stem}.webp"):
            text = path.read_text().replace('thumb: ""', f'thumb: "{thumb_path_url}"')
            path.write_text(text)
            print(f"thumb: {thumb_path_url}")

    print(f"created {path.relative_to(ROOT)}")
    suffix = f", {year}" if year else ""
    print(f"  {title} ({author}) — {rating}{suffix}")


if __name__ == "__main__":
    main()
