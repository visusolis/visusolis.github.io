#!/usr/bin/env python3
"""Create a new thought post in content/thoughts/.

Prompts for title and place, opens $EDITOR to write the body, and writes a
Hugo markdown file with the exact timestamp front matter the site expects.

Usage:
    python3 scripts/new_thought.py [--title T] [--place P] [--body B]

    --title  thought title (prompted if omitted)
    --place  optional human-readable location label (prompted if omitted)
    --body   write body directly, skipping the editor
"""

import argparse
import os
import re
import subprocess
import sys
import tempfile
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
THOUGHTS = ROOT / "content" / "thoughts"


def slugify(text):
    """Kebab-case filename from free text."""
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug or datetime.now().strftime("%Y-%m-%d")


def unique_path(slug):
    """First non-colliding <slug>.md in the thoughts directory."""
    path = THOUGHTS / f"{slug}.md"
    n = 2
    while path.exists():
        path = THOUGHTS / f"{slug}-{n}.md"
        n += 1
    return path


def edit_body():
    """Open $EDITOR on a scratch file and return the written body."""
    editor = os.environ.get("EDITOR") or "vi"
    fd, tmp = tempfile.mkstemp(suffix=".md")
    os.close(fd)
    with open(tmp, "w") as f:
        f.write("\n")
    try:
        subprocess.run([editor, tmp], check=True)
        with open(tmp) as f:
            return f.read().strip()
    except subprocess.CalledProcessError:
        sys.exit("editor exited with an error; no thought created")
    finally:
        os.unlink(tmp)


def toml_literal(value):
    """Escape a value for a TOML single-quoted (literal) string."""
    return value.replace("'", "''")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--title", help="thought title")
    parser.add_argument("--place", help="optional location label")
    parser.add_argument("--body", help="thought body (skips editor)")
    args = parser.parse_args()

    title = args.title or input("Title (enter to skip): ").strip()
    if args.place is not None:
        place = args.place.strip()
    else:
        place = input("Place (optional): ").strip()

    if args.body is not None:
        body = args.body.strip()
    else:
        body = edit_body()
        if not body:
            sys.exit("empty body; no thought created")

    slug = slugify(title or "")
    if place:
        slug = f"{slugify(place.split()[0])}-{slug}" if title else slugify(place.split()[0])
    path = unique_path(slug)

    now = datetime.now().astimezone().isoformat(timespec="seconds")
    front = ["+++", f"title = '{toml_literal(title)}'", f"date = {now}"]
    if place:
        front.append(f"place = '{toml_literal(place)}'")
    front.append("+++")

    path.write_text("\n".join(front) + "\n\n" + body + "\n")
    print(f"created {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
