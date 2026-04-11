#!/usr/bin/env python3
"""
update-header.py
Reads components/header.html and inlines it into every .html page in the site.
Run this any time you change the header:
    python3 scripts/update-header.py
"""

import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HEADER_FILE = os.path.join(ROOT, "components", "header.html")
PLACEHOLDER = re.compile(r'<header>.*?</header>', re.DOTALL)

def main():
    header_html = open(HEADER_FILE).read().strip()

    html_files = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if not d.startswith('.')]
        for fname in filenames:
            if fname.endswith(".html"):
                html_files.append(os.path.join(dirpath, fname))

    updated = []
    skipped = []

    for fpath in sorted(html_files):
        # Don't rewrite the header component itself
        if os.path.abspath(fpath) == os.path.abspath(HEADER_FILE):
            continue

        content = open(fpath).read()

        if PLACEHOLDER.search(content):
            new_content = PLACEHOLDER.sub(header_html, content)
            if new_content != content:
                open(fpath, "w").write(new_content)
                updated.append(fpath.replace(ROOT + "/", ""))
        else:
            skipped.append(fpath.replace(ROOT + "/", ""))

    print(f"✓ Updated {len(updated)} file(s):")
    for f in updated:
        print(f"  {f}")

    if skipped:
        print(f"\n⚠ Skipped {len(skipped)} file(s) (no <header> block found):")
        for f in skipped:
            print(f"  {f}")

if __name__ == "__main__":
    main()
