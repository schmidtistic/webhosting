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

**SchmidtWorx** is a family heritage/archive website. Static site, no build step. The only
external dependency is Google Fonts (Fraunces / Inter / JetBrains Mono), linked from each
page's `<head>`.

### Key files

- `index.html` — Home page. Self-contained: its own inline `<style>`, its own `<nav>`, and a
  `<header class="hero">`. It does **not** load `style.css` or `menu.js`, and
  `scripts/update-header.py` deliberately skips it (that script matches a bare `<header>`,
  and the home page's is `<header class="hero">`).
- `style.css` — Complete design system (CSS variables, all component styles)
- `scripts/menu.js` — Mobile menu toggle + active page detection
- `scripts/video-facade.js` — Poster stand-in for YouTube embeds (see "Video embeds" below)
- `scripts/update-header.py` — Inlines `components/header.html` into every page (run after any header change)
- `scripts/check-site.py` — Pre-merge check: dead internal links, case-only mismatches
  (fine on macOS, fatal on GitHub Pages), missing `#anchor` targets, duplicate ids,
  malformed markup, and headers that have drifted from the component. Run it before
  every merge to main:

  ```bash
  python3 scripts/check-site.py
  ```

  Exits non-zero on failure. Unreferenced assets are reported as a warning only —
  the section-divider sheets in the `-pages/` folders (reunion p02, p04, p11, p15,
  p24, p40) are unreferenced on purpose.
- `components/header.html` — Single source of truth for the site header/nav

### Content sections

- `Reflections/` — Written essays and reflections (collapsible `<details>` pattern)
- `LettersAndRecordings/` — "Recordings and Artifacts" in the nav. Mixed-media personal archive: recordings, video montages, readings read aloud, scanned documents and ephemera, and links into `Builds/`. Audio/video is just one slice — physical artifacts (report cards, letters, photos, etc.) are first-class citizens here too.
- `Builds/` — Per-build pages for physical projects (home theater, smart home, home gym, deck, etc.). Linked from `LettersAndRecordings/michael-schmidt.html` under "Spaces and Systems Built."
- Only `Builds/` has an `index.html` listing page. `Reflections/` and `LettersAndRecordings/`
  have no index — the home page links straight to the per-author pages. Don't add an index
  for them without also wiring it into `index.html`.

**Naming note:** the folder `LettersAndRecordings/` predates the current section name. On disk it's `LettersAndRecordings/`; in the nav and page titles it reads "Recordings and Artifacts." Don't invent a new section for artifact-style content — add it here.

### Retired code

`_to_delete/` holds retired files kept out of the deploy: the `editor/` UI and its
`functions/` Cloudflare Pages handlers (they POST to `/api/*`, which does not exist on GitHub
Pages), `data/*.json` that fed them, the superseded `Builds/theater-platform.html`,
`styleold.css`, and a 1.8 MB `favicon.svg`. Nothing in the live site references any of it.
`_to_delete/` is gitignored.

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
- `--serif: Fraunces`, `--sans: Inter`, `--mono: JetBrains Mono`, each with a local fallback
  stack (Iowan Old Style / Avenir Next / Menlo)

**Fonts are linked, not `@import`ed.** Every page carries this block in `<head>`, above the
stylesheet link:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:…" />
```

An `@import` at the top of `style.css` would serialise the font request behind the CSS
download and block rendering — it was removed on 2026-08-17. Keep it out.

The same block also carries the favicon and manifest links. If you add a page, copy the whole
block; `og:image` must point at `/og-image.png` (a real 1200×630 PNG — `og-image.svg` is the
source, but Facebook, LinkedIn and iMessage will not render SVG previews).

### Content patterns

Reflections pages use nested `<details>`/`<summary>` elements with custom +/− icons for collapsible essays. Cards use the `.section-card` and `.archive-card` classes defined in `style.css`.

Per-person pages in `LettersAndRecordings/` (e.g., `michael-schmidt.html`) organize content into Roman-numeral subsections by medium — currently I. Personal Messages, II. Documentary Interviews, III. Readings, IV. Videos and Montages, V. Spaces and Systems Built. New artifact types (scanned documents, ephemera, etc.) should be added as additional Roman-numeral sections on the same page rather than spawning new top-level sections. Individual entries inside each section use the `details-card` / `<details><summary>` pattern.

### Video embeds

**Never put a raw YouTube `<iframe>` inside a collapsed `<details>`.** A closed
`<details>` has no layout box, so the player initialises at zero size, fetches its
smallest poster, and upscales that blurry image when the section is expanded. Use the
facade instead — an empty div that `scripts/video-facade.js` fills with a
full-resolution poster and a play button, swapping in the real iframe on click:

```html
<div class="video-wrapper video-facade"
     data-video-id="9Psy1oRpZ6A"
     data-title="Message to Cooper">
  <noscript>
    <a class="video-facade-fallback"
       href="https://www.youtube.com/watch?v=9Psy1oRpZ6A"
       target="_blank" rel="noopener noreferrer">Watch &ldquo;Message to Cooper&rdquo; on YouTube</a>
  </noscript>
</div>
```

Any page using it needs `<script src="/scripts/video-facade.js"></script>` alongside
`menu.js`. Styles (`.video-facade-button`, `.video-facade-play`,
`.video-facade-fallback`) sit next to `.video-wrapper` in `style.css`.

The poster is `maxresdefault.jpg` (1280×720), which exists for anything uploaded at
720p or better; the script falls back to `hqdefault.jpg` on a 404, and `object-fit:
cover` crops that image's 4:3 letterbox bars. Because the poster URL is fixed rather
than negotiated by the player, collapse state no longer affects resolution — and the
page stops booting one player per video on every visit.

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
