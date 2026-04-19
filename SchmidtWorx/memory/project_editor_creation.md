---
name: EditorCreation — For Cooper admin editor
description: Summary of the admin editor built for the For Cooper page, architecture decisions, and what's next
type: project
---

Built a JSON-driven admin editor for `michael-schmidt-forward.html` on the `quotes-nav-integration` branch (EditorCreation work was discussed but branch wasn't checked out locally — all files were created directly).

## What was built

**`data/michael-schmidt-forward.json`** — Source of truth for the For Cooper page. Keys: `meta`, `hero`, `context`, `lessons`, `notes`, `videos`, `footer`.

**`functions/api/admin.js`** — Cloudflare Pages Function at `/api/admin?page=forward`. Uses `ADMIN_PASSWORD` env var (separate from Greg's `EDITOR_PASSWORD`). Has a `PAGES` registry at the top — adding future pages is one entry. Same GitHub API commit pattern as Greg's `/api/content`.

**`editor/admin.html`** — Mike's admin editor UI at `/editor/admin.html`. Four color-coded section cards: Page/Context (tan), Lessons (gold), Notes (blue), Videos (green). Each has editable section headers (kicker/heading/intro) plus add/edit/remove/reorder for entries. Live preview iframe. Lessons entries have a "draft" checkbox for coming-soon entries.

**`Reflections/michael-schmidt-forward.html`** — Updated to add kicker/heading/intro to the lessons section (was bare `#entries`, now `#lessons` with "Lessons / What I Know / One at a time.").

## Architecture rule
Once the editor publishes, the HTML is generated output — **don't edit `michael-schmidt-forward.html` directly in VS Code**. JSON is source of truth. Layout/CSS/structural changes go through `admin.js` renderer, then coordinate with Claude.

## Still needs
- `ADMIN_PASSWORD` env var added in Cloudflare Pages dashboard (alongside existing `EDITOR_PASSWORD` and `GITHUB_PAT`)
- Commit and push the branch to deploy

## Expandability
To add another page to the admin editor: add one entry to `PAGES` in `admin.js`, write a renderer function, create the JSON data file. The editor UI would need a page-picker dropdown added at the top.
