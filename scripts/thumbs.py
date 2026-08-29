#!/usr/bin/env python3
"""Shared helpers for building lightweight local thumbnails.

Downloads an image and encodes a small WebP thumbnail (default max 180px on the
longest side) with Pillow. Thumbnails live in static/thumbs/ and are committed
to the repo, so the grids stay dependency-free and fast.
"""

import io
import urllib.request
from pathlib import Path

from PIL import Image

THUMBS_ROOT = Path(__file__).resolve().parent.parent / "static" / "thumbs"

HEADERS = {"User-Agent": "Mozilla/5.0 (visusolis thumb fetcher)"}


def _encode(data, out_path, max_side, quality):
    img = Image.open(io.BytesIO(data))
    img = img.convert("RGB")
    img.thumbnail((max_side, max_side), Image.LANCZOS)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path, "WEBP", quality=quality, method=6)
    return out_path


def fetch_thumb(url, out_path, max_side=160, quality=70):
    """Download `url`, encode a WebP thumbnail <= max_side px, write out_path.

    Returns out_path on success, or None on failure.
    """
    out_path = Path(out_path)
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
        if not data:
            return None
        _encode(data, out_path, max_side, quality)
        if not out_path.exists() or out_path.stat().st_size == 0:
            return None
        return out_path
    except Exception:
        return None


def thumb_path(section, slug):
    """Local public URL for a section thumbnail."""
    return f"/thumbs/{section}/{slug}.webp"
