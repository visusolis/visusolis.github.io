#!/usr/bin/env python3
"""Backfill lightweight local thumbnails for every media review.

Scans content/films/, content/albums/ and content/books/ markdown files,
downloads each entry's `image`, encodes a small WebP thumbnail, writes it to
static/thumbs/<section>/<slug>.webp, and stamps a `thumb:` front-matter entry
pointing at it. Idempotent: entries that already have a thumb (and whose file
exists) are skipped unless --force is given.

Usage:
    python3 scripts/fetch_thumbs.py [--max-side 180] [--quality 70] [--section films] [--force]

    --section   limit to one section (films | albums | books); default: all
    --force     re-fetch and overwrite even if a thumb already exists
    --dry-run   print what would be done without writing anything
"""

import argparse
import re
import sys
from pathlib import Path

from thumbs import THUMBS_ROOT, fetch_thumb, thumb_path

ROOT = Path(__file__).resolve().parent.parent
SECTIONS = ["films", "albums", "books"]

IMAGE_RE = re.compile(r"^image:\s*(\S+)\s*$", re.MULTILINE)
THUMB_RE = re.compile(r"^thumb:\s*.*$", re.MULTILINE)


def has_thumb(text):
    return bool(THUMB_RE.search(text))


def stamp_thumb(text, url):
    """Set the `thumb:` front-matter line to `url`, replacing any existing one."""
    text = THUMB_RE.sub("", text)
    lines = text.splitlines(keepends=True)
    for i, line in enumerate(lines):
        if IMAGE_RE.match(line):
            lines.insert(i + 1, f'thumb: "{url}"\n')
            return "".join(lines)
    return text


def process(section, max_side, quality, force, dry_run):
    content_dir = ROOT / "content" / section
    if not content_dir.is_dir():
        return 0, 0
    done = skipped = 0
    for md in sorted(content_dir.glob("*.md")):
        slug = md.stem
        raw = md.read_text()
        m = IMAGE_RE.search(raw)
        if not m:
            print(f"  skip {section}/{slug}: no image", file=sys.stderr)
            skipped += 1
            continue
        url = m.group(1).strip("\"'")
        out = THUMBS_ROOT / section / f"{slug}.webp"
        url_for_thumb = thumb_path(section, slug)
        if not force and has_thumb(raw) and out.exists():
            skipped += 1
            continue
        if dry_run:
            print(f"  would fetch {section}/{slug} -> {url_for_thumb}")
            done += 1
            continue
        if fetch_thumb(url, out, max_side=max_side, quality=quality):
            stale = out.with_suffix(".jpg")
            stale.unlink(missing_ok=True)
            md.write_text(stamp_thumb(raw, url_for_thumb))
            size = out.stat().st_size
            print(f"  + {section}/{slug} ({size//1024} KB) -> {url_for_thumb}")
            done += 1
        else:
            print(f"  ! FAILED {section}/{slug} ({url})", file=sys.stderr)
            skipped += 1
    return done, skipped


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--max-side", type=int, default=160)
    parser.add_argument("--quality", type=int, default=70)
    parser.add_argument("--section", choices=SECTIONS)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    sections = [args.section] if args.section else SECTIONS
    total = failed = 0
    for s in sections:
        print(f"[{s}]")
        d, f = process(s, args.max_side, args.quality, args.force, args.dry_run)
        total += d
        failed += f
    print(f"done: {total} processed, {failed} skipped/failed")


if __name__ == "__main__":
    main()
