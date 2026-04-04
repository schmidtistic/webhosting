# SchmidtWorx

A family archive website. Built slowly. Meant to last.

SchmidtWorx preserves writings, recordings, and artifacts from the Schmidt family — documents from those who came before, reflections from the present, and material intended for those who come after.

**Live site:** hosted via GitHub Pages from this repository.

---

## What's in here

| Path | Contents |
|------|----------|
| `SchmidtWorx/` | The entire website — HTML, CSS, JS, and assets |
| `SchmidtWorx/Reflections/` | Written essays and reflections, organized by author |
| `SchmidtWorx/LettersAndRecordings/` | Audio, video, and other recorded artifacts |
| `SchmidtWorx/assets/` | PDFs and other preserved documents |

## Running locally

No build step. Serve the `SchmidtWorx/` directory from any static file server:

```bash
cd SchmidtWorx
python3 -m http.server
```

Then open `http://localhost:8000`.

> Note: the site uses absolute paths (e.g. `/style.css`, `/scripts/menu.js`), so you must serve it from the root of `SchmidtWorx/` — opening `index.html` directly in a browser will break asset loading and the header component.

## Architecture

Pure static HTML/CSS/JS — zero dependencies, no build tooling, no framework.

The one non-obvious pattern: every page contains `<div id="header-placeholder"></div>`, and `scripts/menu.js` fetches `components/header.html` and injects it at load time. This keeps the nav in one place without a build step.

See `SchmidtWorx/CLAUDE.md` for deeper architecture notes.

## Adding content

**New reflection or recording page:** copy an existing author page as a template, add a link to it from the relevant `index.html`.

**New section:** add a card to `SchmidtWorx/index.html`, create a new directory with its own `index.html`, and add the nav link to `SchmidtWorx/components/header.html`.

## Repository

`https://github.com/schmidtistic/webhosting`
