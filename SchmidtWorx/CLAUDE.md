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
- `scripts/menu.js` — Header injection + mobile menu toggle + active page detection
- `components/header.html` — Reusable header, dynamically injected into `#header-placeholder` via Fetch API on every page

### Content sections

- `Reflections/` — Written essays and reflections (collapsible `<details>` pattern)
- `LettersAndRecordings/` — Audio/video archive
- Each section has an `index.html` listing page and per-author content pages

### Header component pattern

Every page has `<div id="header-placeholder"></div>` in the body. `menu.js` fetches `components/header.html` and injects it. This avoids repeating the nav markup without a build step. The script normalizes the current URL to set `aria-current="page"` on the matching nav link.

### Design system

CSS variables defined in `:root`:
- `--bg: #121416`, `--fg: #f2eee6`, `--accent: #d7c3a0`, `--accent-strong: #e7b879`, `--muted: #b4ad9f`
- Breakpoints: 720px (reading width) and 860px (two-column layout, desktop nav)
- Serif headers (Iowan Old Style / Palatino), sans-serif body (Avenir Next / Segoe UI)

### Content patterns

Reflections pages use nested `<details>`/`<summary>` elements with custom +/− icons for collapsible essays. Cards use the `.section-card` and `.archive-card` classes defined in `style.css`.
