# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development

No build process — pure static HTML/CSS/JS. To run locally, serve from any HTTP server:

```bash
python3 -m http.server
# or
npx http-server
```

Deployment is via GitHub Pages (push to main).

## Architecture

**SchmidtWorx** is a family heritage/archive website. Static site with zero external dependencies.

### Key files

- `index.html` — Home page with hero and navigation to the two main sections
- `style.css` — Complete design system (CSS variables, all component styles)
- `scripts/menu.js` — Mobile menu toggle + active page detection
- `scripts/update-header.py` — Inlines `components/header.html` into every page (run after any header change)
- `components/header.html` — Single source of truth for the site header/nav

### Content sections

- `Reflections/` — Written essays and reflections (collapsible `<details>` pattern)
- `LettersAndRecordings/` — "Recordings and Artifacts" in the nav. Mixed-media personal archive: recordings, video montages, readings read aloud, scanned documents and ephemera, and links into `Builds/`. Audio/video is just one slice — physical artifacts (report cards, letters, photos, etc.) are first-class citizens here too.
- `Builds/` — Per-build pages for physical projects (home theater, smart home, home gym, deck, etc.). Linked from `LettersAndRecordings/michael-schmidt.html` under "Spaces and Systems Built."
- Each section has an `index.html` listing page and per-author content pages.

**Naming note:** the folder `LettersAndRecordings/` predates the current section name. On disk it's `LettersAndRecordings/`; in the nav and page titles it reads "Recordings and Artifacts." Don't invent a new section for artifact-style content — add it here.

### Header component pattern

`components/header.html` is the single source of truth for the nav. It is inlined directly into every page's `<header>` block — no dynamic fetch. This eliminates the layout shift that async injection causes.

**To update the header across all pages**, edit `components/header.html` then run:

```bash
python3 scripts/update-header.py
```

The script finds every `<header>…</header>` block in the repo and replaces it with the current contents of `components/header.html`. `menu.js` still runs on page load to set `aria-current="page"` on the active nav link and handle the mobile hamburger toggle.

### Design system

CSS variables defined in `:root`:
- `--bg: #121416`, `--fg: #f2eee6`, `--accent: #d7c3a0`, `--accent-strong: #e7b879`, `--muted: #b4ad9f`
- Breakpoints: 720px (reading width) and 860px (two-column layout, desktop nav)
- Serif headers (Iowan Old Style / Palatino), sans-serif body (Avenir Next / Segoe UI)

### Content patterns

Reflections pages use nested `<details>`/`<summary>` elements with custom +/− icons for collapsible essays. Cards use the `.section-card` and `.archive-card` classes defined in `style.css`.

Per-person pages in `LettersAndRecordings/` (e.g., `michael-schmidt.html`) organize content into Roman-numeral subsections by medium — currently I. Personal Messages, II. Documentary Interviews, III. Readings, IV. Videos and Montages, V. Spaces and Systems Built. New artifact types (scanned documents, ephemera, etc.) should be added as additional Roman-numeral sections on the same page rather than spawning new top-level sections. Individual entries inside each section use the `details-card` / `<details><summary>` pattern.

### Page scans (preserved documents)

Reflections pages built from a scanned source document — currently
`Reflections/ronald-schmidt.html` and `Reflections/kenneth-oswald-schmidt.html` — show
the original sheets alongside the transcription. Two parts:

1. Each `<summary>` carries a one-line teaser so the collapsed list is skimmable.
2. Each open entry ends with a strip of page thumbnails; clicking one opens a
   full-size viewer.

**Storage convention.** For a source document at `assets/<Name>.pdf`, its rendered
pages live in `assets/<Name>-pages/`:

```
assets/Schmidt-Reunion-1995.pdf
assets/Schmidt-Reunion-1995-pages/p01.jpg        1200px wide — the viewer
assets/Schmidt-Reunion-1995-pages/p01-thumb.jpg   320px wide — the strip
```

`NN` is the page's **1-based position in that PDF**, zero-padded to two digits.
That is the entire naming rule — no per-story folders, no slugs, no renumbering.
Any thumbnail on the site can be checked against its source by opening the PDF to
that page number.

Consequences worth knowing:

- A sheet holding two stories is referenced by both entries rather than duplicated
  (e.g. reunion p25 is both *Little Boy Lost* and *Growing Up*; p30, p33 likewise).
- A page can be referenced across documents. *Finches* appears on Kenneth's page but
  the sheet was kept with Ronald's papers, so it points at
  `Schmidt-Ronald-Stories-pages/p16.jpg`.
- `-pages/` folders are generated output. They are safe to delete and rebuild.

**Regenerating.** Never make these by hand:

```bash
python3 scripts/make-page-scans.py assets/Schmidt-Reunion-1995.pdf
python3 scripts/make-page-scans.py --all      # every PDF that already has a -pages/ folder
```

Requires poppler (`brew install poppler`) and Pillow.

⚠️ **If a source PDF is edited, page numbers shift.** Re-run the script, then re-check
every page number referenced in that document's HTML. Ronald's PDF had a duplicate
page removed on 2026-08-16, which moved the 80th-birthday sheets from 18–24 to 17–23.

**Markup and styling.** The strip markup is:

```html
<div class="scan-strip">
  <p class="scan-strip-label">The original pages · 2</p>
  <div class="scan-row">
    <button type="button" class="scan-page"
            data-src="/assets/<Name>-pages/p03.jpg"
            data-caption="Story Title — page 1 of 2">
      <img src="/assets/<Name>-pages/p03-thumb.jpg" alt="…" loading="lazy"
           width="320" height="414">
    </button>
  </div>
</div>
```

Every page using it needs one `.lightbox` block before the closing scripts, plus
`<script src="/scripts/page-scans.js"></script>`. Styles (`.entry-teaser`,
`.scan-strip`, `.scan-page`, `.lightbox`) live at the end of `style.css`; behaviour
lives in `scripts/page-scans.js`, which scopes the viewer to the `.scan-row` that was
clicked so the counter reads within one document.

Deliberately **no sepia or tinting** — the paper is already warm against the dark
background. What makes a scan read as an object is the contact edge, the cast shadow
and a half-degree rotation, all in CSS.
