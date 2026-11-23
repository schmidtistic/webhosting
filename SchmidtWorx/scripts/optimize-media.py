#!/usr/bin/env python3
"""
optimize-media.py: keep photos and animated GIFs light before they ship.

    python3 scripts/optimize-media.py              # everything under assets/
    python3 scripts/optimize-media.py assets/HomeOffice
    python3 scripts/optimize-media.py --dry-run    # report only, change nothing

What it does
  * JPEG/PNG photos: honour the EXIF rotation, shrink the longest side to 2000px,
    re-save JPEGs at quality 82 (progressive), and strip all EXIF, GPS included.
    A file is only touched if it is over 2000px, over 1.2 MB, or carries GPS data,
    and only replaced when the result is at least 10% smaller (GPS files are always
    re-saved), so re-running is safe.
  * PNGs over 1 MB with no transparency become JPEGs. Every .html file that
    pointed at the old name is updated.
  * Animated GIFs become H.264 MP4s next to the original (needs ffmpeg). The page
    markup is NOT rewritten for you: swap the <img> for
      <video autoplay loop muted playsinline preload="metadata"
             aria-label="..."><source src="/assets/....mp4" type="video/mp4"></video>
  * Replaced originals move to _to_delete/media-originals/ (gitignored), and git
    history still has them.

Skipped on purpose: the generated *-pages/ scan folders, og-image, icons and the logo.
Requires Pillow.
"""

import io
import os
import shutil
import subprocess
import sys

from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RETIRE = os.path.join(ROOT, "_to_delete", "media-originals")
MAX_SIDE = 2000
JPEG_QUALITY = 82
BIG_BYTES = int(1.2 * 1024 * 1024)
PNG_TO_JPEG_BYTES = 1024 * 1024
MIN_SAVING = 0.9


def retire(path):
    os.makedirs(RETIRE, exist_ok=True)
    dest = os.path.join(RETIRE, os.path.basename(path))
    if os.path.exists(dest):
        os.remove(dest)
    shutil.move(path, dest)


def rewrite_refs(old_rel, new_rel):
    n = 0
    for dp, dn, fn in os.walk(ROOT):
        dn[:] = [d for d in dn if d not in {".git", "_to_delete", "node_modules"}]
        for f in fn:
            if not f.endswith(".html"):
                continue
            p = os.path.join(dp, f)
            t = open(p, encoding="utf-8").read()
            if old_rel in t:
                open(p, "w", encoding="utf-8").write(t.replace(old_rel, new_rel))
                n += 1
    return n


def optimize_photo(path, dry):
    ext = path.lower().rsplit(".", 1)[-1]
    old = os.path.getsize(path)
    im = Image.open(path)
    im.load()
    gps = ext != "png" and bool(im.getexif().get(0x8825))
    if max(im.size) <= MAX_SIDE and old <= BIG_BYTES and not gps:
        return None
    im = ImageOps.exif_transpose(im)
    if max(im.size) > MAX_SIDE:
        r = MAX_SIDE / max(im.size)
        im = im.resize((round(im.size[0] * r), round(im.size[1] * r)), Image.LANCZOS)
    buf = io.BytesIO()
    target = path
    if ext == "png":
        alpha = im.mode in ("RGBA", "LA") or "transparency" in im.info
        if old > PNG_TO_JPEG_BYTES and not alpha:
            im.convert("RGB").save(buf, "JPEG", quality=84, optimize=True, progressive=True)
            target = path.rsplit(".", 1)[0] + ".jpg"
        else:
            im.save(buf, "PNG", optimize=True)
    else:
        im.convert("RGB").save(buf, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
    new = len(buf.getvalue())
    if not (new < old * MIN_SAVING or gps):
        return None
    note = "%.2f -> %.2f MB%s" % (old / 1048576, new / 1048576, " (GPS stripped)" if gps else "")
    if dry:
        return note
    if target != path:
        retire(path)
    with open(target, "wb") as fh:
        fh.write(buf.getvalue())
    if target != path:
        rel = lambda p: "/" + os.path.relpath(p, ROOT).replace(os.sep, "/")
        n = rewrite_refs(rel(path), rel(target))
        note += ", now %s (%d page(s) updated)" % (os.path.basename(target), n)
    return note


def convert_gif(path, dry):
    if shutil.which("ffmpeg") is None:
        return "ffmpeg not found, skipped"
    out = path.rsplit(".", 1)[0] + ".mp4"
    if dry:
        return "would convert to " + os.path.basename(out)
    subprocess.check_call([
        "ffmpeg", "-y", "-loglevel", "error", "-i", path,
        "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-c:v", "libx264", "-crf", "27",
        "-preset", "veryfast", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", out])
    note = "%.2f -> %.2f MB as %s. Update the page markup to a <video> tag." % (
        os.path.getsize(path) / 1048576, os.path.getsize(out) / 1048576, os.path.basename(out))
    retire(path)
    return note


def main(argv):
    dry = "--dry-run" in argv
    targets = [a for a in argv if not a.startswith("--")] or ["assets"]
    changed = 0
    for t in targets:
        base = t if os.path.isabs(t) else os.path.join(ROOT, t)
        for dp, dn, fn in os.walk(base):
            if "-pages" in dp:
                continue
            for f in sorted(fn):
                p = os.path.join(dp, f)
                ext = f.lower().rsplit(".", 1)[-1]
                if ext in ("jpg", "jpeg", "png"):
                    note = optimize_photo(p, dry)
                elif ext == "gif":
                    note = convert_gif(p, dry)
                else:
                    continue
                if note:
                    changed += 1
                    print("%s: %s" % (os.path.relpath(p, ROOT), note))
    print("%s %d file(s)." % ("Would change" if dry else "Changed", changed))


if __name__ == "__main__":
    main(sys.argv[1:])
