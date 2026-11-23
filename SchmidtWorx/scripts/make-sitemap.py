#!/usr/bin/env python3
"""
make-sitemap.py: regenerate sitemap.xml from the site's pages.

    python3 scripts/make-sitemap.py

Every page's URL is read from its <meta property="og:url"> tag (which must match
its canonical link). lastmod comes from the page's last git commit date, falling
back to the file's modification time. Pages left out on purpose: _to_delete/,
components/, editor/ and 404.html.

Run it after adding, renaming or removing a page, then commit sitemap.xml.
"""

import datetime
import glob
import os
import re
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_PREFIXES = ("_to_delete", "components", "editor")
SKIP_FILES = {"404.html"}
HOME = "https://schmidtworx.com/"
OG_URL = re.compile(r'<meta property="og:url" content="([^"]+)"')


def lastmod(rel):
    try:
        out = subprocess.check_output(
            ["git", "log", "-1", "--format=%cs", "--", rel],
            cwd=ROOT, stderr=subprocess.DEVNULL).decode().strip()
        if out:
            return out
    except Exception:
        pass
    mtime = os.path.getmtime(os.path.join(ROOT, rel))
    return datetime.date.fromtimestamp(mtime).isoformat()


def main():
    os.chdir(ROOT)
    entries = []
    for rel in sorted(glob.glob("**/*.html", recursive=True)):
        if rel.startswith(SKIP_PREFIXES) or rel in SKIP_FILES:
            continue
        m = OG_URL.search(open(rel, encoding="utf-8", errors="ignore").read())
        if not m:
            print("skipped (no og:url): " + rel)
            continue
        url = HOME if rel == "index.html" else m.group(1)
        entries.append((rel != "index.html", url, rel))
    entries.sort()

    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for _, url, rel in entries:
        lines += ["  <url>", "    <loc>%s</loc>" % url,
                  "    <lastmod>%s</lastmod>" % lastmod(rel), "  </url>"]
    lines.append("</urlset>")
    with open("sitemap.xml", "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines) + "\n")
    print("sitemap.xml written with %d URLs" % len(entries))


if __name__ == "__main__":
    main()
