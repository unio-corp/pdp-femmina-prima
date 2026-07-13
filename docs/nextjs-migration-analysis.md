# Next.js Migration Analysis — PDP Femmina Prima

## Architettura Attuale

**Tipo:** Single-page HTML application con vanilla JavaScript e inline styling  
**Entry point:** `index.html` (865 linee)  
**Build tool:** Nessuno (live-server per dev)  
**Framework:** Vanilla JS + React (solo tweaks panel)  
**Stato:** Esportato da Claude Design, prototipo funzionale

### Struttura directory

```
.
├── index.html                          # Markup monolitico + inline CSS + JS inline
├── src/
│   ├── scripts/main.js                # Minimalista (6 linee, unused)
│   ├── styles/
│   │   ├── tokens.css                 # Design tokens (light/dark mode)
│   │   └── global.css                 # Reset + utilities (legacy, non usato)
│   └── components/
│       ├── ui/buttons.css, card.css
│       ├── gallery/css/gallery.css
│       ├── hero/css/hero.css
│       └── product-details/css/product-details.css
├── uploads/                           # Product gallery (4 immagini: .jpg + .webp)
├── public/                            # Root images (people-*.jpg, imgi-*.jpg)
├── package.json                       # Minimalista: prettier, eslint, live-server
├── CLAUDE.md                          # Architettura e linee guida
└── README.md                          # Setup e comandi

```

**Status:** Tutti i CSS legacy in `src/` NON sono importati. Inline style in `index.html` predomina. CSS files residuali = scaffolding non usato.

---

## Tecnologie Rilevate

| Tecnologia | Versione | Uso | Stato |
|---|---|---|---|
| HTML5 | - | Markup semantico | ✓ Attivo |
| CSS3 | - | Inline + media queries | ✓ Attivo |
| Vanilla JS | - | Nav scroll, gallery arrows | ✓ Attivo |
| React | 18.3.1 | Tweaks panel (unpkg CDN) | ✓ Attivo |
| React DOM | 18.3.1 | Runtime config UI | ✓ Attivo |
| Babel Standalone | 7.29.0 | JSX transform (CDN) | ✓ Attivo |
| Prettier | ^3.0.0 | Formatting | ✓ DevDep |
| ESLint | ^8.0.0 | Linting | ✓ DevDep |
| live-server | - | Dev server | ✓ DevDep |
| Node.js | >= 18 | Runtime | ✓ Richiesto |

**Nessuna dipendenza npm produttiva.** React e Babel via CDN per tweaks panel.

---

## Inventario Pagine

**Singola pagina**: `index.html` (PDP Femmina Prime — Giacca in mohair e lana)

### Sezioni

1. **Nav Header** — Fixed top, transparent → white on scroll, hide on scroll-down
2. **Product Gallery (PGPP)** — 4 immagini, horizontal scroll-snap, arrow navigation
3. **Engagement Images (SGPP)** — 3 immagini grid (50/50, full-width mobile stack)
4. **Product Info** — Titulo, prezzo, colore, taglia, CTA, accordion (Dettagli/Spedizione/Confezione/Negozio)
5. **Duo CTA** — 2 card sticky (Completa look + Aggiungi carrello)
6. **Recently Viewed** — 2 tab, 4 card grid (Visti recente + Potrebbe piacerti)
7. **Breadcrumbs** — Home > Uomo > Abbigliamento
8. **Footer** — Branding + country/language selector
9. **Sticky Bar** — Nome prodotto + prezzo + Pre-ordina (float bottom)

**Dati:** Hard-coded. Nessuna API, nessun CMS, nessuna fetch.

---

## Inventario Componenti

Nessun componente React. Solo template HTML.

### Parti reutilizzabili (candidate a component Next.js)

- Nav Header (header, nav-bar, nav-list)
- Product Gallery (ul.product-gallery, arrow buttons, scroll logic)
- Product Info (div.product-info, form-like buttons)
- Accordion (accordion-item + trigger)
- Duo CTA (2 card sticky float-right)
- Recently Viewed (tabs + grid)
- Footer (site-footer)
- Sticky Bar (sticky-bar)

**React Tweaks Panel** — Componente React esistente (JSX inline in HTML). Esercita controllo su visibility sezioni via data-screen-label + display CSS.

---

## Inventario Dipendenze

### Production
- Nessuna (React/Babel via CDN, non npm)

### DevDependencies
- `prettier@^3.0.0` — Formatter
- `eslint@^8.0.0` — Linter
- `live-server` (implied in npm run dev) — Dev server

### CDN (External)
- `react@18.3.1` (unpkg)
- `react-dom@18.3.1` (unpkg)
- `@babel/standalone@7.29.0` (unpkg)
- Nessun SRI non verificabile per react/react-dom; Babel ha SRI

**Incompatibilità potenziali con Next.js:**
- React/ReactDOM via CDN diventa npm dependency
- Babel standalone non necessario (Next.js include built-in JSX)
- `live-server` → `next dev`

---

## Asset e Media

### Immagini prodotto (uploads/)
- `01-mode.jpg` — Hero primo carosello
- `01-mode-sm.jpg` — Variante small
- `01-model.webp` — Variante WebP
- `02-model.webp`, `03-model.webp`, `04-model.webp` — Carosello gallery
- `03-zoom-sm.jpg`, `01-zoom.jpg` — Zoom variants
- `*.json` files — Metadata (Claude Design export artifacts)

### Immagini root
- `people-*.jpg` — Engagement section
- `imgi_1137_newminimalsportsbragsblackb6c4-*.jpg` — Engagement section
- `people-10-*.jpg` — Engagement full-width

**Totale:** ~15 immagini (prodotto + engagement), mix JPG/WebP

### Font
- Inline: `Times, "Times New Roman", serif` (system font)
- Engagement: `"Noto Sans", sans-serif` (system fallback)
- **Nessun font woff/ttf importato.** Stile tipografico predefinito.

---

## Design System / Styling

### Token CSS (inline in index.html)

```css
:root {
  --fg: #000;                    /* Text color */
  --bg: #fff;                    /* Background */
  --muted: #6d7882;              /* Secondary text */
  --muted-bg: #f5f5f5;           /* Secondary background */
  --border: #e0e0e0;             /* Border color */
  --header-h: 62px;              /* Nav height */
  --sticky-bar-h: 64px;          /* Sticky bar height */
  /* + animation, gallery, responsive */
}
```

### Dark mode
```css
@media (prefers-color-scheme: dark) {
  :root {
    --fg: #fff;
    --bg: #1a1a1a;
    --muted: #999;
    --muted-bg: #2a2a2a;
    --border: #333;
  }
}
```

### Breakpoint
- `max-width: 768px` → Mobile stack (hamburger nav, single-column gallery, duo-cta inline, grid single-column)

### Typography
- Base: `14px/22px Times serif`
- Display: `clamp()` per scaling responsive (nessuna font-size hardcoded)
- Label: `11px` (uppercase, letterspacing)

### Animazioni
- Nav scroll/hide: `transition: background 0.25s, box-shadow 0.25s, transform 0.3s`
- Gallery arrows: `opacity 0.2s, transform 0.2s`
- Smooth scroll: `scroll-behavior: smooth`
- No GSAP, no external animation library

---

## Comportamento Interattivo

### 1. Nav Header Scroll
```javascript
// Transparent → white on scroll (y > 12px)
// Hide on scroll-down (delta > 4px && y > 80px)
// Show on scroll-up or y <= 80px
// Uso: requestAnimationFrame per perf
```

### 2. Gallery Carousel
```javascript
// Horizontal scroll-snap
// Arrow buttons navigate step-by-step (scrollIntoView smooth)
// Button visibility: hidden when at bounds
// Responsive: flex-basis 50% desktop, 100% mobile
```

### 3. React Tweaks Panel
```javascript
// Runtime toggles: itemsPerView, scrollSnap, showArrows, ctaColor, bodyFont
// Component toggles: nav, PGPP, product-info, SGPP, duo-cta, sticky-bar, footer
// Toggles modify display:none via data-screen-label selectors
// NOT persisted (in-memory only)
```

### 4. Accordion (static)
- Dummy buttons, nessun toggle logic implementato

---

## SEO & Metadata

### Title & Meta
```html
<title>Giacca in mohair e lana — Double black · Bottega Veneta</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
```

**Mancanti:** Description, canonical, og:*, robots, structured data.

### Semantic HTML
- Sezioni con `<section data-screen-label="...">`
- Header, main, footer, nav
- **Nessun h1** (h2 .product-name)
- Breadcrumb nav

**Accessibilità:** Button label aria-label (gallery arrows), semantic nav, button type explicit.

---

## Variabili d'Ambiente

**Nessuna.** Tutti i dati hard-coded.

---

## Stato & Logica

### Client-side state
- Nav scroll position (window.scrollY)
- Gallery scroll position (scrollLeft)
- Tweaks panel state (React useState)

### No server-side state

### Data handling
- Nessuna API
- Nessuna fetch
- Nessun CMS

---

## Build & Deploy

### Current
- `npm run dev` → live-server
- `npm run build` → placeholder echo
- `npm run preview` → live-server dist/ (dist/ non esiste)

**Status:** No build pipeline. No optimization. Direct HTML serve.

---

## Problemi & Incompatibilità

### Blockers per Next.js

1. **React via CDN** — Deve diventare npm dependency
2. **Babel standalone** — Non necessario in Next.js (built-in JSX)
3. **Inline CSS gigante** — Deve essere estratto in moduli/file separati
4. **Monolitic HTML** — Deve essere decomposto in layout + pages + components
5. **Absolute positioning sticky** — `.duo-row` usa `position: sticky + float: right`, layout fragile su alcuni browser
6. **Hard-coded dati** — Candidato per props o data layer
7. **No type safety** — Vanilla JS, nessun TypeScript

### Minor issues
- Legacy CSS files non usati (src/styles/*, src/components/*/css/*.css)
- main.js inutilizzato
- Nessun build, nessun compression, nessuna optimization
- Dark mode works ma non esplicitamente testato
- Responsive solo 768px breakpoint (no intermediate breakpoints)

### Regressione risks
- Gallery scroll-snap mobile Safari (older browsers)
- Sticky positioning cross-browser
- React tweaks panel CDN dependency
- Inline script timing (must run after DOM ready, currently no defer)

---

## Parti Riutilizzabili Senza Modifiche

1. **Design tokens** (colori, spacing, animation values) → CSS modules o app.css
2. **Layout semantico** (structure HTML)
3. **Tipografia** (font stack, responsive clamp values)
4. **Media queries** (768px breakpoint strategy)
5. **Immagini** (structure rimane, paths relative → public/)
6. **Accessibility attributes** (aria-label su buttons)

---

## Parti da Adattare

1. **React tweaks panel** → Porting da CDN JSX a Next.js component (Server + Client)
2. **Gallery logic** → JavaScript → React hook (useGallery)
3. **Nav scroll logic** → useEffect hook (useNavScroll)
4. **Accordion** → Interactive component (toggle + collapse)
5. **Route strategy** → App Router structure
6. **Image paths** → Migrazione a public/, next/image compatibility

---

## Parti da Riscrivere

1. **Build pipeline** — Configurare Next.js con TypeScript, ESLint
2. **Type definitions** — Aggiungere TypeScript strict mode
3. **Test framework** — Setup Playwright E2E
4. **Component API** — Pensare props/composition, non inline styling
5. **Data structure** — JSON o TypeScript types, non inline template

---

## Codice Obsoleto / Inutilizzato

- `src/scripts/main.js` — 6 linee, nessun uso
- `src/styles/global.css` — Non importato
- `src/styles/tokens.css` — Non importato (duplicato inline)
- `src/components/*/css/*.css` — Non importati
- `.agents/skills/` directory — Project-local skills (non codice runtime)
- `uploads/*.json` — Metadata file artifacts

---

## Rischi Tecnici

| Rischio | Severità | Mitigation |
|---------|----------|-----------|
| Layout shift sticky positioning | MEDIUM | Test su tutti browser, considerare modern flex/grid |
| Gallery scroll-snap mobile | MEDIUM | Fallback arrow navigation (già implementato) |
| React CDN → npm migration | LOW | Diretto upgrade a npm dependencies |
| Dati hard-coded → API | MEDIUM | Separare layer dati, mock per demo |
| TypeScript strict mode | LOW | Gradual adoption, no blockers |
| Responsive breakpoint singolo | LOW | Aggiungere intermediate breakpoints se necessario |

---

## Debito Tecnico

1. **No build optimization** — Image lazy loading, bundle split, minification necessari
2. **No error boundaries** — React error handling missing in tweaks panel
3. **No loading states** — UX per async data (quando sarà implementato)
4. **No 404/error pages** — App Router richiede error.tsx, not-found.tsx
5. **No tests** — Build E2E suite Playwright

---

## Strategia Migrazione Consigliata

### Approccio: Incremental + Structural

**Fase 1 (Fondazioni):** Setup Next.js, TypeScript, struttura directory, configurazione  
**Fase 2 (Layout):** Root layout, metadata, styling globale, font, header/footer shared  
**Fase 3 (Componenti):** Decomposizione HTML → React components, Server vs Client  
**Fase 4 (Pagine):** Product page, routing, dati structure  
**Fase 5 (Qualità):** Build, lint, type-check, E2E tests  
**Fase 6 (Deployment):** Production readiness, SEO, performance audit  

**Non rifare everything subito.** Mantieni HTML structure, stili, asset. Muovi pezzi alla volta.

---

## Struttura Next.js Proposta

```
src/
├── app/
│   ├── layout.tsx                 # Root layout (nav, footer, metadata)
│   ├── page.tsx                   # Product page (PDP)
│   ├── error.tsx                  # Error boundary
│   └── not-found.tsx              # 404
├── components/
│   ├── layout/
│   │   ├── Header.tsx             # Nav header (scroll logic)
│   │   ├── Footer.tsx
│   │   └── StickyBar.tsx          # Sticky bar
│   ├── sections/
│   │   ├── ProductGallery.tsx     # PGPP (gallery + arrows)
│   │   ├── EngagementGrid.tsx     # SGPP (3 images)
│   │   ├── ProductInfo.tsx        # Product details + accordion
│   │   ├── DuoCTA.tsx             # Sticky cards
│   │   └── RecentlyViewed.tsx     # Tabs + grid
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Accordion.tsx
│   │   └── Tabs.tsx
│   └── tweaks/
│       └── TweaksPanel.tsx        # React tweaks (development only)
├── hooks/
│   ├── useNavScroll.ts            # Nav visibility on scroll
│   └── useGallery.ts              # Gallery navigation logic
├── lib/
│   ├── constants.ts               # Product data, config
│   └── utils.ts                   # Utility functions
├── styles/
│   ├── globals.css                # Design tokens, base styles
│   ├── layout.module.css          # Shared layout styles
│   └── components/                # CSS modules per component
├── types/
│   └── index.ts                   # TypeScript definitions
└── config/
    └── index.ts                   # App config

public/
├── uploads/                       # Product gallery images
├── images/                        # Engagement images
├── favicon.ico
└── ...

next.config.js
tsconfig.json
eslint.config.js
playwright.config.ts
```

---

## File da Creare/Modificare

### Creazioni nuove
- `next.config.js` — Next.js config
- `tsconfig.json` — TypeScript strict
- `eslint.config.js` — ESLint rules
- `playwright.config.ts` — E2E testing
- `src/app/layout.tsx` — Root layout
- `src/app/page.tsx` — PDP page
- `src/components/layout/Header.tsx` — Nav component
- `src/components/sections/*.tsx` — Section components
- `src/hooks/*.ts` — Custom hooks
- `src/lib/constants.ts` — Data (product, images)
- `src/types/index.ts` — TypeScript definitions
- `.gitignore` — Node + build artifacts
- Tutta la struttura `src/components/`, `src/hooks/`, `src/lib/`, `src/styles/`

### Modifiche
- `package.json` — Add Next.js, React, TypeScript, test framework
- `README.md` — Update setup, build, dev commands

### Da rimuovere (eventually)
- `src/scripts/main.js` (logica migrate in hooks)
- `src/styles/` legacy (consolidato in globals.css + modules)
- `src/components/*/css/` (CSS modules)
- `index.html` (sostituito da app structure)
- Live-server command (Next.js dev server)

---

## Dipendenze Nuove

### Runtime
```json
{
  "next": "^15.x",
  "react": "^18.x",
  "react-dom": "^18.x"
}
```

### DevDependencies
```json
{
  "typescript": "^5.x",
  "eslint": "^9.x",
  "@typescript-eslint/eslint-plugin": "^7.x",
  "@typescript-eslint/parser": "^7.x",
  "prettier": "^3.x",
  "@playwright/test": "^1.x"
}
```

### Optional (NOT required unless needed)
- `zod` — Schema validation (if API data validation needed)
- `clsx` — Conditional classNames
- `lucide-react` — Icons (currently using inline SVG)

**No animation library required.** Mantieni CSS animations + transition.

---

## Criteri di Completamento

✓ Tutte le sezioni visibili e funzionanti  
✓ Gallery scroll + arrow navigation operativa  
✓ Nav scroll behavior (show/hide + white bg)  
✓ Sticky bar float bottom  
✓ Duo CTA sticky positioning  
✓ Responsive 768px breakpoint OK  
✓ Design tokens CSS preservati  
✓ Immagini responsive e lazy-load  
✓ Accessibility maintained (aria-label, semantic HTML)  
✓ TypeScript strict mode (no any)  
✓ ESLint passing  
✓ Build Next.js successful  
✓ No console errors  
✓ E2E tests for critical flows  
✓ SEO metadata updated  

---

## Domande Bloccanti

**Nessuna.** Architettura chiara, dati disponibili inline, nessuna dependency esterna complessa.

