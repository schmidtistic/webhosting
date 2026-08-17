#!/usr/bin/env python3
"""
check-site.py — pre-merge sanity check for the static site.

    python3 scripts/check-site.py

Checks every .html page for:
  * internal href/src/data-src targets that don't exist on disk
  * case-only mismatches (these work on macOS, break on GitHub Pages)
  * #anchor targets with no matching id
  * duplicate element ids
  * unclosed / mismatched tags
  * <header> blocks that have drifted from components/header.html
  * assets under assets/ that nothing references

Attribute scanning skips <script> and <style> blocks, so URLs built by string
concatenation in JS are not mistaken for broken links.

Exits non-zero if anything in the first six categories fails.
Unreferenced assets are reported but do not fail the run — section-divider
sheets in the -pages/ folders are unreferenced on purpose.
"""

import os, re, sys, html
from collections import defaultdict
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP = {'.git', '_to_delete', 'node_modules', '.aider.tags.cache.v4'}
VOID = {'area','base','br','col','embed','hr','img','input','link','meta',
        'param','source','track','wbr'}

ATTR = re.compile(r'(?:href|src|poster|data-src)\s*=\s*"([^"]*)"', re.I)
SCRIPT = re.compile(r'<(script|style)\b.*?</\1>', re.S | re.I)
ID   = re.compile(r'\sid\s*=\s*"([^"]+)"')
NAME = re.compile(r'<a[^>]+name\s*=\s*"([^"]+)"', re.I)


def walk():
    for dp, dn, fn in os.walk(ROOT):
        dn[:] = [d for d in dn if d not in SKIP]
        for f in fn:
            yield os.path.join(dp, f)


class Tags(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.err = [], []

    def handle_starttag(self, t, a):
        if t not in VOID:
            self.stack.append((t, self.getpos()))

    def handle_endtag(self, t):
        if t in VOID:
            return
        if not self.stack:
            self.err.append(('stray </%s>' % t, self.getpos()))
            return
        if self.stack[-1][0] == t:
            self.stack.pop()
            return
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == t:
                still = [x[0] for x in self.stack[i + 1:]]
                self.err.append(('</%s> closed while %s still open' % (t, still),
                                 self.getpos()))
                del self.stack[i:]
                return
        self.err.append(('stray </%s>' % t, self.getpos()))


def main():
    files = list(walk())
    pages = sorted(f for f in files if f.endswith('.html'))
    on_disk = {os.path.relpath(f, ROOT) for f in files}
    lower = {p.lower(): p for p in on_disk}

    ids, broken, casing, anchors, dupes, tagerr, drift = {}, [], [], [], [], [], []

    for p in pages:
        t = open(p, encoding='utf-8', errors='replace').read()
        found = ID.findall(t) + NAME.findall(t)
        ids[p] = set(found)
        seen = defaultdict(int)
        for i in found:
            seen[i] += 1
        dupes += [(os.path.relpath(p, ROOT), i, c) for i, c in seen.items() if c > 1]

        tp = Tags()
        tp.feed(t)
        tp.close()
        if tp.err or tp.stack:
            tagerr.append((os.path.relpath(p, ROOT), tp.err,
                           [(x, y[0]) for x, y in tp.stack]))

    for p in pages:
        rel = os.path.relpath(p, ROOT)
        # strip <script>/<style> so JS string concatenation isn't read as markup
        t = SCRIPT.sub('', open(p, encoding='utf-8', errors='replace').read())
        for raw in ATTR.findall(t):
            u = html.unescape(raw.strip())
            if not u or u.startswith(('http://', 'https://', '//', 'data:',
                                      'mailto:', 'tel:', 'javascript:')):
                continue
            if u.startswith('#'):
                if u[1:] and u[1:] not in ids[p]:
                    anchors.append((rel, u))
                continue
            path, _, frag = u.partition('#')
            if not path:
                continue
            tgt = (path.lstrip('/') if path.startswith('/')
                   else os.path.normpath(os.path.join(os.path.dirname(rel), path)))
            full = os.path.join(ROOT, tgt)
            if os.path.isdir(full):
                if not os.path.exists(os.path.join(full, 'index.html')):
                    broken.append((rel, u, 'directory without index.html'))
                continue
            if tgt not in on_disk:
                if tgt.lower() in lower:
                    casing.append((rel, u, lower[tgt.lower()]))
                else:
                    broken.append((rel, u, 'missing file'))
                continue
            if frag and tgt.endswith('.html'):
                tp = os.path.join(ROOT, tgt)
                if tp in ids and frag not in ids[tp]:
                    anchors.append((rel, u))

    # header drift
    hf = os.path.join(ROOT, 'components', 'header.html')
    if os.path.exists(hf):
        m = re.search(r'<header>.*?</header>',
                      open(hf, encoding='utf-8').read(), re.S)
        if m:
            norm = lambda s: re.sub(r'\s+', ' ', s).strip()
            ref = norm(m.group(0))
            for p in pages:
                if os.path.abspath(p) == os.path.abspath(hf):
                    continue
                t = open(p, encoding='utf-8', errors='replace').read()
                mm = re.search(r'<header>.*?</header>', t, re.S)
                if mm and norm(mm.group(0)) != ref:
                    drift.append(os.path.relpath(p, ROOT))

    # unreferenced assets (informational)
    blob = ''.join(open(f, encoding='utf-8', errors='replace').read()
                   for f in files
                   if f.endswith(('.html', '.css', '.js', '.json', '.md', '.webmanifest')))
    orphans = []
    adir = os.path.join(ROOT, 'assets')
    if os.path.isdir(adir):
        for dp, dn, fn in os.walk(adir):
            for f in fn:
                rp = os.path.relpath(os.path.join(dp, f), ROOT).replace('\\', '/')
                if '/' + rp not in blob and rp not in blob:
                    orphans.append(rp)

    fail = 0

    def section(title, rows, fmt, fatal=True):
        nonlocal fail
        rows = sorted(set(rows))
        flag = 'FAIL' if (rows and fatal) else ('warn' if rows else 'ok')
        print('%-34s %s (%d)' % (title, flag, len(rows)))
        for r in rows:
            print('    ' + fmt(r))
        if rows and fatal:
            fail = 1

    print('SchmidtWorx site check\n' + '=' * 60)
    section('broken internal links', broken,
            lambda r: '%s -> %s [%s]' % r)
    section('case mismatches', casing,
            lambda r: '%s -> %s (on disk: %s)' % r)
    section('missing anchor targets', anchors, lambda r: '%s -> %s' % r)
    section('duplicate ids', dupes, lambda r: '%s  id=%s x%d' % r)
    section('malformed html', tagerr,
            lambda r: '%s  %s %s' % (r[0], r[1][:3], r[2][:3]))
    section('header drift', drift, lambda r: r)
    section('unreferenced assets', orphans, lambda r: r, fatal=False)

    print('=' * 60)
    print('FAILED' if fail else 'PASS')
    return fail


if __name__ == '__main__':
    sys.exit(main())
