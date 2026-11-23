# SchmidtWorx

A family archive website. Built slowly. Meant to last.

SchmidtWorx preserves writings, recordings, and artifacts from the Schmidt family: documents from those who came before, reflections from the present, and material intended for those who come after.

**Live site:** https://schmidtworx.com, hosted on Cloudflare Pages. Pushing to `main` deploys it.

---

## What's in here

| Path | Contents |
|------|----------|
| `SchmidtWorx/` | The entire website, served as the web root |
| `SchmidtWorx/index.html` | Home page (self-contained, with its own styles and nav) |
| `SchmidtWorx/Reflections/` | Written essays and reflections, organized by author, plus the For Cooper and Inspiration pages |
| `SchmidtWorx/LettersAndRecordings/` | "Recordings and Artifacts": recordings, documentary interviews, readings, videos, scanned documents |
| `SchmidtWorx/Builds/` | One page per physical build (theater, smart home, gym, deck, and so on) |
| `SchmidtWorx/assets/` | Photos, video, audio, and preserved PDFs with their rendered page scans |
| `SchmidtWorx/components/` | `header.html`, the single source of truth for the site nav |
| `SchmidtWorx/scripts/` | Browser scripts plus maintenance tools (see below) |
| `SchmidtWorx/functions/` | Cloudflare Pages Function behind the admin editor |
| `SchmidtWorx/editor/` and `SchmidtWorx/data/` | The password-gated For Cooper editor and its JSON source |
| `SchmidtWorx/robots.txt`, `sitemap.xml`, `404.html` | Crawler basics and the not-found page |

## Running locally

No build step. Serve the `SchmidtWorx/` directory from any static file server:

```bash
cd SchmidtWorx
python3 -m http.server
```

Then open `http://localhost:8000`.

> Note: the site uses absolute paths (for example `/style.css` and `/scripts/menu.js`), so it must be served from the root of `SchmidtWorx/`. Opening `index.html` directly in a browser will break asset loading. The admin editor's `/api/admin` route only works on Cloudflare Pages, not on a plain local server.

## Architecture

Pure static HTML, CSS, and JavaScript. No framework, no build tooling. The only external dependency is Google Fonts.

The shared header is inlined into every page rather than fetched at load time, which avoids layout shift. Edit `components/header.html`, then run `python3 scripts/update-header.py` to push the change to every page. `scripts/menu.js` handles the mobile menu and marks the active link.

The For Cooper page is generated: `data/michael-schmidt-forward.json` is the source of truth, and the admin editor commits both the JSON and the rendered HTML through `functions/api/admin.js`. Greg's page and the other Reflections pages are hand-authored HTML.

## Maintenance tools

Run these from `SchmidtWorx/`:

```bash
python3 scripts/check-site.py        # broken links, case mismatches, bad anchors, header drift
python3 scripts/update-header.py     # re-inline components/header.html everywhere
python3 scripts/make-sitemap.py      # regenerate sitemap.xml after adding or removing pages
python3 scripts/optimize-media.py    # shrink photos, strip GPS data, convert GIFs to MP4
python3 scripts/make-page-scans.py   # render PDF pages for the scanned-document pages
```

Run `check-site.py` before every merge to `main`.

See `SchmidtWorx/CLAUDE.md` for deeper architecture notes and conventions.
