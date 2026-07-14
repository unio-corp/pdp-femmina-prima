# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Agent skills

### Issue tracker

Issues live in GitHub Issues (`unio-corp/pdp-femmina-prima`, via `gh` CLI); external PRs are not treated as a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`) — no repo-specific remapping. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: `CONTEXT.md` + `docs/adr/` at repo root. See `docs/agents/domain.md`.

## Project Overview

**pdp-femmina-prima** is a Product Detail Page (PDP) for the Femmina Prime collection, built from the Bottega Veneta design system. It's a single-page HTML application with vanilla JavaScript and inline styling, exported from Claude Design.

## Architecture

### File Structure

- **`index.html`** — Main PDP page. Contains:
  - Inline CSS with design tokens (colors, spacing, typography, animation)
  - HTML sections: nav-header, product gallery (horizontal scroll), product-info, engagement grid, duo-cta, recently-viewed, footer, sticky-bar
  - Vanilla JS for scroll behavior (nav hide/show, gallery arrow controls)
  - React tweaks panel (imported from unpkg) for runtime section toggling

- **`src/styles/`** — Design tokens and global CSS (legacy, not currently imported in HTML)
  - `tokens.css` — CSS custom properties (light + dark mode via `prefers-color-scheme`)
  - `global.css` — Base resets and responsive utilities

- **`src/components/`** — Component CSS files (legacy, structured by feature)
  - `hero/css/hero.css`, `product-details/css/product-details.css`, `gallery/css/gallery.css`, `ui/buttons.css`, `ui/card.css`

- **`uploads/`** — Gallery images
  - `01-04-model.webp` — Product gallery (4-image scroll)
  - `01-mode.jpg`, `02-model.jpg`, etc. — Alternate formats and zoom variants

- **`package.json`** — Project metadata and dev tooling (prettier, eslint)

### Key Features

1. **Sticky Navigation** — Nav header scrolls transparent, turns white on scroll, hides on scroll-down via `requestAnimationFrame`
2. **Horizontal Gallery** — 4 product images, scroll-snap enabled, arrow buttons navigate via `scrollIntoView`
3. **Responsive Layout** — Media queries at 768px breakpoint; mobile: gallery single-column, duo-cta stacks
4. **React Tweaks Panel** — Loaded from unpkg; toggles sections (nav, gallery, product-info, sticky-bar, recently-viewed, footer, breadcrumbs) at runtime
5. **Design Tokens** — CSS custom properties for colors, spacing, typography, animation (defined in inline `<style>` block)

## Common Commands

```bash
npm run dev       # Start live-server on localhost:8080 (serves current directory)
npm run preview   # Start live-server on dist/ (for built output, when build is configured)
```

## Development Notes

- **Single-file HTML.** All content is in `index.html`; no bundler. Changes to inline CSS/JS take effect on save + browser refresh.
- **Inline CSS.** Design tokens and component styles are in the `<style>` block. No external CSS imports in the HTML (legacy `src/styles/` files are scaffolding, not used).
- **Vanilla JS.** Two behavior scripts:
  1. Nav header scroll behavior (lines ~674–696)
  2. Gallery scroll & arrow controls (lines ~700–733)
- **React tweaks panel** is the only external dependency (loaded from unpkg). It offers runtime config but does NOT modify the HTML structure—only CSS display properties.
- **Images.** Gallery sources (`uploads/01-04-*.webp`), engagement images (root: `people-*.jpg`, `imgi-*.jpg`). Paths are relative to `index.html`.
- **Responsive.** Breakpoint at 768px; full media query block at lines ~261–528 covers mobile hamburger nav, gallery single-column, duo-cta mobile layout.

## Styling Conventions

- **CSS custom properties.** All colors, spacing, typography, animation durations are defined at `:root` in the inline style block.
- **BEM naming** (legacy). Component CSS files use `.component-name__element--modifier`, but inline styles use simpler selectors (`.nav-header`, `.product-gallery`, etc.).
- **Responsive units.** `clamp()` for fluid typography and spacing; media queries for breakpoint-based layout shifts.
- **Dark mode.** Defined via `@media (prefers-color-scheme: dark)` at line ~530; swaps `--fg`, `--bg`, `--muted`, `--border` token values.

## Editing the PDP

1. **To change colors/spacing/animation:** Edit the `:root` custom properties in the `<style>` block (lines 9–17 for light mode, lines ~530+ for dark).
2. **To modify layout or add sections:** Edit the HTML in `<main>` (lines 554–647) and add corresponding CSS to the `<style>` block.
3. **To update gallery images:** Replace file paths in the `<ul class="product-gallery">` list (lines ~560–563) or add/remove `<li>` items.
4. **To adjust scroll behavior or gallery logic:** Edit the two vanilla JS script blocks (lines ~673+ and ~700+).
5. **To toggle sections at runtime:** Use the React tweaks panel UI (visible on page load); settings are NOT persisted.

## Build & Deployment

- **Current state:** `npm run build` is a placeholder. A real build would:
  - Copy `index.html` and `uploads/` to `dist/`
  - Optionally minify CSS and JS
  - Optimize images

- **Serve locally:** `npm run dev` starts live-server; navigate to http://localhost:8080.
- **Deploy:** Commit & push to GitHub; serve `index.html` + `uploads/` + media files from any static host.

## Known Limitations

- **React tweaks panel** requires unpkg CDN (react, react-dom, babel); no offline mode.
- **No build step.** Inline CSS scales with file size; large projects should migrate to CSS modules or external stylesheets.
- **Sticky positioning.** `.duo-row` uses `position: sticky` + `float: right`, which has layout quirks on some browsers; consider modern flexbox/grid for future refactors.
- **Gallery scroll snap.** Mobile Safari and older browsers may not support `scroll-snap-*` properties; fallback is manual arrow navigation.
