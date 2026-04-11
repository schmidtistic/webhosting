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
- `LettersAndRecordings/` — Audio/video archive
- Each section has an `index.html` listing page and per-author content pages

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
