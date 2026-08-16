#!/usr/bin/env python3
"""Generate web page-scans for a source PDF in assets/.

Usage:
    python3 scripts/make-page-scans.py assets/Schmidt-Reunion-1995.pdf
    python3 scripts/make-page-scans.py --all

Convention
----------
For a source document at `assets/<Name>.pdf`, every page is rendered into
`assets/<Name>-pages/`:

    pNN.jpg         1200px wide, quality 82  — what the page viewer opens
    pNN-thumb.jpg    320px wide, quality 80  — what the strip shows

NN is the page's 1-based position **in that PDF**, zero-padded to two
digits. That is the whole naming rule. Because the number is the PDF page
number, any thumbnail on the site can be checked against the source by
opening the PDF to that page.

Nothing else belongs in a `-pages/` folder — it is generated output and is
safe to delete and rebuild at any time.

If a source PDF is re-scanned or edited, re-run this script for it and then
re-check any page numbers referenced in HTML: removing a page shifts every
page after it.

Requires: pdftoppm (poppler) and Pillow.
"""

import argparse
import glob
import os
import shutil
import subprocess
import sys
import tempfile

FULL_WIDTH = 1200
FULL_QUALITY = 82
THUMB_WIDTH = 320
THUMB_QUALITY = 80
RENDER_DPI = 150

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(REPO, "assets")


def resize(img, width):
    from PIL import Image
    w, h = img.size
    return img.resize((width, round(h * width / w)), Image.LANCZOS)


def build(pdf_path):
    from PIL import Image

    if not os.path.isfile(pdf_path):
        sys.exit(f"no such file: {pdf_path}")
    if shutil.which("pdftoppm") is None:
        sys.exit("pdftoppm not found — install poppler (brew install poppler)")

    name = os.path.splitext(os.path.basename(pdf_path))[0]
    out = os.path.join(os.path.dirname(os.path.abspath(pdf_path)), name + "-pages")
    os.makedirs(out, exist_ok=True)

    # Clear stale output so a shortened PDF cannot leave orphan pages behind.
    # Not fatal if the filesystem refuses: pages are overwritten either way,
    # and the only risk is a leftover page beyond the PDF's new length.
    stale = []
    for old in glob.glob(os.path.join(out, "p*.jpg")):
        try:
            os.remove(old)
        except OSError:
            stale.append(os.path.basename(old))
    if stale:
        print(f"  warning: could not clear {len(stale)} existing file(s) in {out}; "
              "check for orphan pages if the PDF got shorter", file=sys.stderr)

    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(
            ["pdftoppm", "-r", str(RENDER_DPI), "-png", pdf_path, os.path.join(tmp, "pg")],
            check=True,
        )
        rendered = sorted(glob.glob(os.path.join(tmp, "pg-*.png")))
        if not rendered:
            sys.exit(f"pdftoppm produced no pages for {pdf_path}")

        for f in rendered:
            n = int(os.path.basename(f).split("-")[1].split(".")[0])
            img = Image.open(f).convert("RGB")
            resize(img, FULL_WIDTH).save(
                os.path.join(out, f"p{n:02d}.jpg"),
                quality=FULL_QUALITY, optimize=True, progressive=True,
            )
            resize(img, THUMB_WIDTH).save(
                os.path.join(out, f"p{n:02d}-thumb.jpg"),
                quality=THUMB_QUALITY, optimize=True,
            )

    total = sum(
        os.path.getsize(os.path.join(out, f)) for f in os.listdir(out)
    )
    rel = os.path.relpath(out, REPO)
    print(f"{rel}: {len(rendered)} pages, {len(rendered) * 2} files, {total / 1e6:.1f} MB")


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pdf", nargs="*", help="path to a PDF in assets/")
    ap.add_argument("--all", action="store_true",
                    help="rebuild every PDF in assets/ that already has a -pages/ folder")
    args = ap.parse_args()

    targets = list(args.pdf)
    if args.all:
        for pdf in sorted(glob.glob(os.path.join(ASSETS, "*.pdf"))):
            name = os.path.splitext(os.path.basename(pdf))[0]
            if os.path.isdir(os.path.join(ASSETS, name + "-pages")):
                targets.append(pdf)
    if not targets:
        ap.error("give a PDF path, or --all")

    for pdf in targets:
        build(pdf)


if __name__ == "__main__":
    main()
