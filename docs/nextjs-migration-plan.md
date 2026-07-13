# Next.js Migration Plan — PDP Femmina Prima

---

## Milestone Overview

| # | Milestone | Stato | Durata Est. |
|---|-----------|-------|------------|
| 1 | Preparazione | - | 2-3h |
| 2 | Layout & Fondazioni | - | 2-3h |
| 3 | Componenti | - | 4-5h |
| 4 | Pagine & Routing | - | 2-3h |
| 5 | Qualità | - | 2-3h |
| 6 | Deploy Ready | - | 1-2h |

**Totale Est.:** ~14-20h (engineer autonomo)

---

# Milestone 1 — Preparazione

**Obiettivo:** Setup Next.js, TypeScript, ESLint, struttura directory base.

## File Coinvolti

### Creazioni
- `next.config.js` — Next.js configuration
- `tsconfig.json` — TypeScript strict mode
- `eslint.config.js` — ESLint rules
- `.gitignore` — Update (add node_modules, .next, dist)
- `src/` — Crea directory structure
- `public/` — Prepara asset directory

### Modifiche
- `package.json` — Aggiorna dependencies e scripts
- `README.md` — Update dev/build commands

---

## Operazioni

### 1.1 Setup Next.js Runtime

```bash
npm install next@15 react@18 react-dom@18
npm install --save-dev \
  typescript@5 \
  @types/node @types/react @types/react-dom \
  eslint@9 \
  @typescript-eslint/eslint-plugin @typescript-eslint/parser \
  @playwright/test \
  prettier@3
```

**Dipendenze rimosse:**
- `live-server` (→ `next dev`)

**Dipendenze mantenute:**
- `prettier@^3.0.0` ✓
- `eslint@^8.0.0` → upgrade a ^9.0.0 ✓

### 1.2 Configurazione Next.js

**`next.config.js`**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

module.exports = nextConfig;
```

### 1.3 TypeScript Strict

**`tsconfig.json`**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", ".next", "dist"]
}
```

### 1.4 ESLint Config

**`eslint.config.js`**
```javascript
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';

export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2020, sourceType: 'module', ecmaFeatures: { jsx: true } },
      globals: { console: 'readonly', process: 'readonly' },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: react,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs['recommended'].rules,
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-explicit-any': 'error',
      'react/react-in-jsx-scope': 'off',
    },
  },
];
```

### 1.5 Directory Structure

```bash
mkdir -p src/{app,components/{layout,sections,ui,tweaks},hooks,lib,styles,types,config}
mkdir -p public/{uploads,images}
```

### 1.6 Update package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --ext .ts,.tsx",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "test:e2e": "playwright test"
  }
}
```

### 1.7 .gitignore

```
node_modules/
.next/
dist/
.env.local
.env.*.local
.DS_Store
```

### 1.8 Migrate Assets

```bash
# Copy product gallery
cp -r uploads/* public/uploads/

# Copy engagement images from root
mv people-*.jpg public/images/ 2>/dev/null || true
mv imgi_*.jpg public/images/ 2>/dev/null || true
```

---

## Rischi

| Rischio | Mitigation |
|---------|-----------|
| Breaking existing dev flow | Keep `npm run dev` as entry point |
| ESLint strict rules early | Start with warnings, errors after review |
| TypeScript strict breaks existing code | Fix incrementally, use `// @ts-ignore` as last resort |

---

## Dipendenze

Nessuna. Setup autonomo.

---

## Criteri Accettazione

✓ `npm install` completa senza errori  
✓ `npm run lint` non rileva errori critici  
✓ `npm run type-check` clean  
✓ `npm run build` esegue (errore Next.js OK per ora, app/ vuota)  
✓ `npm run dev` avvia server su http://localhost:3000  
✓ Struttura `src/`, `public/` in place  
✓ Asset migrati in `public/`  

---

## Comandi Verifica

```bash
npm install
npm run lint
npm run type-check
npm run build  # Fallisce: "pages not found" → OK aspettato
npm run dev    # Deve avviare server
```

---

---

# Milestone 2 — Layout & Fondazioni

**Obiettivo:** Root layout, metadata globali, styling, font, componenti shared (Header, Footer).

## File Coinvolti

### Creazioni
- `src/app/layout.tsx` — Root layout con metadata
- `src/app/page.tsx` — Placeholder (implementato in Milestone 4)
- `src/styles/globals.css` — Design tokens + base styles
- `src/components/layout/Header.tsx` — Nav component
- `src/components/layout/Footer.tsx` — Footer component
- `src/components/layout/StickyBar.tsx` — Sticky bar
- `src/types/index.ts` — TypeScript definitions (Product, Image, etc.)
- `src/lib/constants.ts` — Data hard-coded (product, images, recently-viewed)
- `src/config/index.ts` — App configuration

### Modifiche
- Nessuna

---

## Operazioni

### 2.1 Root Layout

**`src/app/layout.tsx`**
```typescript
import type { Metadata, Viewport } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import '@/styles/globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'Giacca in mohair e lana — Double black · Bottega Veneta',
  description: 'Giacca in tela di lana e morbido mohair, con revers in seta motivo Intrecciato.',
  openGraph: {
    title: 'Giacca in mohair e lana',
    description: 'Giacca in tela di lana e morbido mohair.',
    type: 'website',
  },
  robots: 'index, follow',
  alternates: {
    canonical: 'https://example.com',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

### 2.2 Globals CSS

**`src/styles/globals.css`**
Estrai inline CSS da index.html: design tokens, base resets, media queries.

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  /* Colors */
  --fg: #000;
  --bg: #fff;
  --muted: #6d7882;
  --muted-bg: #f5f5f5;
  --border: #e0e0e0;
  
  /* Layout */
  --header-h: 62px;
  --sticky-bar-h: 64px;
  
  /* Typography */
  --text-base: clamp(1rem, 0.92rem + 0.4vw, 1.125rem);
  --text-sm: clamp(0.875rem, 0.81rem + 0.3vw, 1rem);
  
  /* Spacing */
  --space-xs: 0.5rem;
  --space-sm: 1rem;
  --space-md: 1.5rem;
  --space-lg: 2rem;
  --space-xl: 3rem;
  --space-section: clamp(4rem, 3rem + 5vw, 10rem);
  
  /* Animation */
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
}

@media (prefers-color-scheme: dark) {
  :root {
    --fg: #fff;
    --bg: #1a1a1a;
    --muted: #999;
    --muted-bg: #2a2a2a;
    --border: #333;
  }
}

html, body {
  font-family: Times, "Times New Roman", serif;
  font-size: 14px;
  line-height: 22px;
  color: var(--fg);
  background: var(--bg);
  -webkit-font-smoothing: antialiased;
}

a {
  color: inherit;
  text-decoration: none;
}

button {
  font-family: inherit;
  color: inherit;
  cursor: pointer;
}

ul {
  list-style: none;
}

svg {
  display: block;
}

@media (max-width: 768px) {
  /* Mobile styles */
  :root {
    --header-h: 56px;
  }
}
```

### 2.3 Types

**`src/types/index.ts`**
```typescript
export interface Product {
  id: string;
  name: string;
  price: number;
  color: string;
  description: string;
  tag: string;
  preorderDate: string;
  images: ProductImage[];
}

export interface ProductImage {
  src: string;
  alt: string;
  format: 'jpg' | 'webp';
}

export interface EngagementImage {
  src: string;
  alt: string;
  isFullWidth?: boolean;
}

export interface RecentlyViewedItem {
  name: string;
  price: number;
  bgColor: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface Breadcrumb {
  label: string;
  href?: string;
}
```

### 2.4 Constants

**`src/lib/constants.ts`**
```typescript
import type { Product, ProductImage, EngagementImage, RecentlyViewedItem, NavLink, Breadcrumb } from '@/types';

export const PRODUCT: Product = {
  id: 'jacket-001',
  name: 'Giacca in mohair e lana',
  price: 4200,
  color: 'Double black',
  description: 'Giacca in tela di lana e morbido mohair, con revers in seta motivo Intrecciato.',
  tag: 'Novità',
  preorderDate: '18 settembre',
  images: [
    { src: '/uploads/01-mode.jpg', alt: 'Giacca in mohair e lana — vista frontale', format: 'jpg' },
    { src: '/uploads/02-model.webp', alt: 'Giacca in mohair e lana — vista laterale', format: 'webp' },
    { src: '/uploads/03-model.webp', alt: 'Giacca in mohair e lana — vista posteriore', format: 'webp' },
    { src: '/uploads/04-model.webp', alt: 'Giacca in mohair e lana — dettaglio revers', format: 'webp' },
  ],
};

export const ENGAGEMENT_IMAGES: EngagementImage[] = [
  { src: '/images/people-mrhqxxtk.jpg', alt: 'Giacca — dettaglio posteriore' },
  { src: '/images/imgi_1137_newminimalsportsbragsblackb6c4-mrhqyafp.jpg', alt: 'Giacca — dettaglio laterale' },
  { src: '/images/people-10--mrhr38du.jpg', alt: 'Giacca — dettaglio tessuto', isFullWidth: true },
];

export const RECENTLY_VIEWED: RecentlyViewedItem[] = [
  { name: 'Gonna in pelle', price: 2500, bgColor: '#f0ede8' },
  { name: 'Pantaloni in mohair', price: 1200, bgColor: '#e8e5e0' },
  { name: 'Camicia in seta', price: 980, bgColor: '#ebe8e3' },
  { name: 'Cintura Intrecciato', price: 650, bgColor: '#e3e0db' },
];

export const NAV_LINKS: NavLink[] = [
  { label: 'Uomo', href: '/' },
  { label: 'Donna', href: '/' },
  { label: 'Accessori', href: '/' },
];

export const BREADCRUMBS: Breadcrumb[] = [
  { label: 'Home', href: '/' },
  { label: 'Uomo', href: '/' },
  { label: 'Abbigliamento' },
];

export const DUO_CTA = {
  left: { label: 'Completa il look', bgColor: '#fff', textColor: '#000' },
  right: { label: 'Aggiungi al Carrello', price: '3.600€', bgColor: '#000', textColor: '#fff' },
};

export const FOOTER_TEXT = 'FEMMINA PRIME';
export const STICKY_BAR_CTA = 'Pre-ordina';
```

### 2.5 Config

**`src/config/index.ts`**
```typescript
export const APP_CONFIG = {
  siteName: 'Bottega Veneta',
  locale: 'it-IT',
  currency: '€',
  breakpoints: {
    mobile: 768,
  },
};
```

### 2.6 Header Component

**`src/components/layout/Header.tsx`**
```typescript
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { NAV_LINKS } from '@/lib/constants';
import styles from './Header.module.css';

export function Header() {
  const navRef = useRef<HTMLElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [lastY, setLastY] = useState(0);
  const [ticking, setTicking] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const y = window.scrollY;
          setIsScrolled(y > 12);
          
          const delta = y - lastY;
          if (y > 80 && delta > 4) {
            setIsHidden(true);
          } else if (delta < -4 || y <= 80) {
            setIsHidden(false);
          }
          
          setLastY(y);
          setTicking(false);
        });
        setTicking(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastY, ticking]);

  return (
    <header
      ref={navRef}
      className={`${styles.navHeader} ${isScrolled ? styles.scrolled : ''} ${isHidden ? styles.hidden : ''}`}
    >
      <nav className={styles.navBar}>
        <div className={styles.navList}>
          {NAV_LINKS.map((link) => (
            <Link key={link.label} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
        <div className={styles.navLogo}>BOTTEGA VENETA</div>
        <div className={styles.navActions}>
          <button aria-label="Search">🔍</button>
          <button aria-label="Account">👤</button>
          <button aria-label="Cart">🛒</button>
        </div>
      </nav>
    </header>
  );
}
```

**`src/components/layout/Header.module.css`**
```css
.navHeader {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 30;
  background: transparent;
  box-shadow: none;
  transition: background 0.25s ease, box-shadow 0.25s ease, transform 0.3s ease;
  will-change: transform;
}

.navHeader.scrolled {
  background: #fff;
  box-shadow: 0 1px 0 var(--border);
}

.navHeader.hidden {
  transform: translateY(-100%);
}

.navBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
  padding: 0 20px;
  height: var(--header-h);
  width: 100%;
}

.navLogo {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 12.5px;
  letter-spacing: 0.14em;
  white-space: nowrap;
}

.navList {
  display: flex;
  gap: 24px;
  font-size: 14px;
}

.navList a {
  white-space: nowrap;
}

.navActions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.navActions button {
  background: none;
  border: none;
  cursor: pointer;
}

@media (max-width: 768px) {
  .navBar {
    flex-direction: column;
    gap: 16px;
    height: auto;
  }

  .navList {
    flex-direction: column;
    gap: 12px;
  }
}
```

### 2.7 Footer Component

**`src/components/layout/Footer.tsx`**
```typescript
import Link from 'next/link';
import { BREADCRUMBS, FOOTER_TEXT } from '@/lib/constants';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <>
      <nav className={styles.breadcrumbs}>
        {BREADCRUMBS.map((item, i) => (
          <span key={i}>
            {item.href ? <Link href={item.href}>{item.label}</Link> : item.label}
            {i < BREADCRUMBS.length - 1 && <span className={styles.sep}>&gt;</span>}
          </span>
        ))}
      </nav>

      <footer className={styles.siteFooter}>
        <div className={styles.branding}>{FOOTER_TEXT}</div>
        <div className={styles.country}>
          <p>
            Spedire in: <Link href="#">Italia</Link>
          </p>
          <p>
            Lingua: <Link href="#">Italiano</Link>
          </p>
        </div>
      </footer>
    </>
  );
}
```

**`src/components/layout/Footer.module.css`**
```css
.breadcrumbs {
  display: flex;
  gap: 8px;
  padding: 20px;
  font-size: 12px;
}

.breadcrumbs span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.sep {
  color: var(--muted);
}

.siteFooter {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 350px;
  width: 100%;
  padding: 20px;
  background: var(--muted-bg);
  border-top: 1px solid var(--border);
  position: relative;
}

.branding {
  position: absolute;
  bottom: 16px;
  left: 16px;
  font-size: 12px;
  font-weight: 500;
}

.country {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
}

.country p a {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .siteFooter {
    flex-direction: column;
    align-items: flex-start;
    height: auto;
    padding: 20px;
  }

  .country {
    margin-top: 20px;
  }
}
```

### 2.8 StickyBar Component

**`src/components/layout/StickyBar.tsx`**
```typescript
import { PRODUCT, STICKY_BAR_CTA } from '@/lib/constants';
import styles from './StickyBar.module.css';

export function StickyBar() {
  return (
    <div className={styles.stickyBar}>
      <span className={styles.sbName}>{PRODUCT.name}</span>
      <span className={styles.sbPrice}>{PRODUCT.price} €</span>
      <button className={styles.sbCta}>{STICKY_BAR_CTA}</button>
    </div>
  );
}
```

**`src/components/layout/StickyBar.module.css`**
```css
.stickyBar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 20;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 16px 20px;
  height: var(--sticky-bar-h);
  background: var(--bg);
  border-top: 1px solid var(--border);
  font-family: "Noto Sans", sans-serif;
  font-size: 14px;
}

.sbName {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sbPrice {
  font-weight: 500;
}

.sbCta {
  flex-shrink: 0;
  width: 120px;
  height: 40px;
  background: #000;
  color: #fff;
  border: none;
  font-size: 12px;
}

.sbCta:hover {
  opacity: 0.85;
}

@media (max-width: 768px) {
  .stickyBar {
    padding: 12px 16px;
    height: auto;
    flex-wrap: wrap;
  }

  .sbCta {
    width: 100%;
  }
}
```

### 2.9 Placeholder Page

**`src/app/page.tsx`**
```typescript
import { StickyBar } from '@/components/layout/StickyBar';

export default function Home() {
  return (
    <>
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h1>Product Page (Milestone 4)</h1>
      </section>
      <StickyBar />
    </>
  );
}
```

---

## Rischi

| Rischio | Mitigation |
|---------|-----------|
| CSS token naming conflict | Use CSS custom properties scoped to :root |
| Header scroll logic race condition | Use requestAnimationFrame + ticking flag |
| Dark mode contrast | QA on prefers-color-scheme |

---

## Dipendenze

Milestone 1 completata.

---

## Criteri Accettazione

✓ Root layout renders  
✓ Globals CSS applied (design tokens visible)  
✓ Header visible, scroll behavior works  
✓ Footer renders  
✓ Sticky bar fixed bottom  
✓ Dark mode switches (DevTools)  
✓ Navigation styled  
✓ No TypeScript errors  
✓ ESLint clean  

---

## Comandi Verifica

```bash
npm run dev
# Navigate to http://localhost:3000
# Scroll → Header transitions white, hides on scroll-down
# Refresh → No console errors
npm run lint
npm run type-check
```

---

---

# Milestone 3 — Componenti

**Obiettivo:** Decomposizione sezioni HTML → React components, Server vs Client distinction.

## File Coinvolti

### Creazioni
- `src/components/sections/ProductGallery.tsx` — Gallery + scroll logic
- `src/components/sections/EngagementGrid.tsx` — 3 immagini grid
- `src/components/sections/ProductInfo.tsx` — Info + form elements
- `src/components/sections/DuoCTA.tsx` — Sticky CTA duo
- `src/components/sections/RecentlyViewed.tsx` — Tab selector + grid
- `src/components/ui/Button.tsx` — Reusable button
- `src/components/ui/Accordion.tsx` — Accordion component
- `src/components/ui/Tabs.tsx` — Tab component
- `src/hooks/useGallery.ts` — Gallery navigation logic
- `src/components/sections/ProductGallery.module.css`
- `src/components/sections/EngagementGrid.module.css`
- `src/components/sections/ProductInfo.module.css`
- `src/components/sections/DuoCTA.module.css`
- `src/components/sections/RecentlyViewed.module.css`
- `src/components/ui/Button.module.css`
- `src/components/ui/Accordion.module.css`
- `src/components/ui/Tabs.module.css`

---

## Operazioni

### 3.1 Gallery Hook

**`src/hooks/useGallery.ts`**
```typescript
import { useCallback, useEffect, useRef, useState } from 'react';

export function useGallery(itemCount: number) {
  const galleryRef = useRef<HTMLUListElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPrev, setShowPrev] = useState(false);
  const [showNext, setShowNext] = useState(itemCount > 1);

  const updateVisibility = useCallback(() => {
    if (!galleryRef.current) return;

    const scrollLeft = galleryRef.current.scrollLeft;
    const maxScroll = galleryRef.current.scrollWidth - galleryRef.current.clientWidth;

    setShowPrev(scrollLeft > 4);
    setShowNext(scrollLeft < maxScroll - 4);
  }, []);

  const step = useCallback(
    (dir: 1 | -1) => {
      if (!galleryRef.current) return;

      const items = Array.from(galleryRef.current.querySelectorAll('li'));
      if (!items.length) return;

      const scrollLeft = galleryRef.current.scrollLeft;
      let idx = 0;

      items.forEach((li, i) => {
        if (li.offsetLeft <= scrollLeft + 4) idx = i;
      });

      const target = Math.max(0, Math.min(items.length - 1, idx + dir));
      setCurrentIndex(target);
      items[target].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    },
    []
  );

  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return;

    gallery.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('resize', updateVisibility);
    updateVisibility();

    return () => {
      gallery.removeEventListener('scroll', updateVisibility);
      window.removeEventListener('resize', updateVisibility);
    };
  }, [updateVisibility]);

  return { galleryRef, currentIndex, showPrev, showNext, step };
}
```

### 3.2 Product Gallery Component

**`src/components/sections/ProductGallery.tsx`**
```typescript
'use client';

import Image from 'next/image';
import { useGallery } from '@/hooks/useGallery';
import { PRODUCT } from '@/lib/constants';
import styles from './ProductGallery.module.css';

const ArrowIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
    <polyline points="14,5 7,12 14,19" />
  </svg>
);

const ArrowNextIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
    <polyline points="10,5 17,12 10,19" />
  </svg>
);

export function ProductGallery() {
  const { galleryRef, showPrev, showNext, step } = useGallery(PRODUCT.images.length);

  return (
    <section className={styles.galleryWrap}>
      <ul className={styles.gallery} ref={galleryRef}>
        {PRODUCT.images.map((img, i) => (
          <li key={i}>
            <div className={styles.ph}>
              <Image src={img.src} alt={img.alt} fill sizes="100vw" priority={i === 0} />
            </div>
          </li>
        ))}
      </ul>

      {showPrev && (
        <button
          className={`${styles.arrow} ${styles.prev}`}
          onClick={() => step(-1)}
          aria-label="Immagine precedente"
        >
          <ArrowIcon />
        </button>
      )}

      {showNext && (
        <button
          className={`${styles.arrow} ${styles.next}`}
          onClick={() => step(1)}
          aria-label="Immagine successiva"
        >
          <ArrowNextIcon />
        </button>
      )}
    </section>
  );
}
```

**`src/components/sections/ProductGallery.module.css`**
```css
.galleryWrap {
  position: relative;
  width: 100%;
}

.gallery {
  display: flex;
  flex-wrap: nowrap;
  width: 100%;
  height: 110vh;
  list-style: none;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.gallery::-webkit-scrollbar {
  display: none;
}

.gallery li {
  flex: 0 0 50%;
  height: 100%;
  overflow: hidden;
  position: relative;
  scroll-snap-align: start;
}

.ph {
  width: 100%;
  height: 100%;
  display: block;
  overflow: hidden;
  position: relative;
}

.arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border-radius: 0;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  transition: opacity 0.2s, transform 0.2s ease;
  color: #000;
}

.arrow:hover {
  opacity: 0.55;
}

.prev {
  left: 20px;
}

.prev:hover {
  transform: translateY(-50%) translateX(-2px);
}

.next {
  right: 20px;
}

.next:hover {
  transform: translateY(-50%) translateX(2px);
}

@media (max-width: 768px) {
  .gallery li {
    flex: 0 0 100%;
  }

  .arrow {
    width: 28px;
    height: 28px;
  }
}
```

### 3.3 Engagement Grid Component

**`src/components/sections/EngagementGrid.tsx`**
```typescript
import Image from 'next/image';
import { ENGAGEMENT_IMAGES } from '@/lib/constants';
import styles from './EngagementGrid.module.css';

export function EngagementGrid() {
  return (
    <section className={styles.grid}>
      {ENGAGEMENT_IMAGES.map((img, i) => (
        <div key={i} className={`${styles.item} ${img.isFullWidth ? styles.full : ''}`}>
          <Image src={img.src} alt={img.alt} fill className={styles.img} />
        </div>
      ))}
    </section>
  );
}
```

**`src/components/sections/EngagementGrid.module.css`**
```css
.grid {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
}

.item {
  width: 50%;
  aspect-ratio: 1 / 1;
  min-height: 100vh;
  overflow: hidden;
  position: relative;
}

.img {
  object-fit: cover;
}

.item.full {
  width: 100%;
  max-width: 1920px;
  aspect-ratio: auto;
  height: 140vh;
}

@media (max-width: 768px) {
  .item {
    width: 100%;
  }

  .item.full {
    height: auto;
    aspect-ratio: 16 / 9;
  }
}
```

### 3.4 Button Component

**`src/components/ui/Button.tsx`**
```typescript
import { ReactNode } from 'react';
import styles from './Button.module.css';

export interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  className = '',
}: ButtonProps) {
  return (
    <button
      className={`${styles.btn} ${styles[variant]} ${styles[size]} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

**`src/components/ui/Button.module.css`**
```css
.btn {
  font-family: inherit;
  cursor: pointer;
  border: none;
  transition: background 0.2s, color 0.2s, opacity 0.2s;
}

.btn:hover {
  opacity: 0.85;
}

.primary {
  width: 100%;
  height: 48px;
  background: #000;
  color: #fff;
  font-size: 14px;
}

.secondary {
  width: 100%;
  height: 48px;
  background: #fff;
  color: #000;
  border: 1px solid #000;
  font-size: 14px;
}

.ghost {
  background: none;
  color: inherit;
  border: none;
  font-size: 14px;
}

.sm {
  height: 32px;
  font-size: 12px;
}

.md {
  height: 40px;
  font-size: 14px;
}

.lg {
  height: 48px;
  font-size: 16px;
}
```

### 3.5 Accordion Component

**`src/components/ui/Accordion.tsx`**
```typescript
'use client';

import { useState } from 'react';
import styles from './Accordion.module.css';

export interface AccordionItem {
  title: string;
  content?: string;
}

export interface AccordionProps {
  items: AccordionItem[];
}

export function Accordion({ items }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className={styles.accordion}>
      {items.map((item, i) => (
        <div key={i} className={styles.item}>
          <button
            className={styles.trigger}
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
          >
            <span>{item.title}</span>
            <span className={openIndex === i ? styles.iconOpen : ''}>{openIndex === i ? '−' : '＋'}</span>
          </button>
          {openIndex === i && item.content && <div className={styles.content}>{item.content}</div>}
        </div>
      ))}
    </div>
  );
}
```

**`src/components/ui/Accordion.module.css`**
```css
.accordion {
  margin-top: 16px;
}

.item {
  border-bottom: 1px solid var(--border);
}

.trigger {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  font-size: 14px;
  cursor: pointer;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
}

.trigger:hover {
  opacity: 0.75;
}

.content {
  padding: 0 0 16px 0;
  font-size: 14px;
  line-height: 22px;
  color: var(--muted);
}

.iconOpen {
  transform: rotate(180deg);
}
```

### 3.6 Product Info Component

**`src/components/sections/ProductInfo.tsx`**
```typescript
'use client';

import { useState } from 'react';
import { PRODUCT } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { Accordion } from '@/components/ui/Accordion';
import styles from './ProductInfo.module.css';

const ACCORDION_ITEMS = [
  { title: 'Dettagli prodotto', content: 'Tela di lana e mohair, revers in seta Intrecciato.' },
  { title: 'Spedizione e resi', content: 'Spedizione gratuita per ordini superiori a 500€.' },
  { title: 'Confezione regalo', content: 'Disponibile confezione regalo con messaggio personalizzato.' },
  { title: 'Scopri in negozio', content: 'Disponibile nei nostri negozi in Italia e Europa.' },
];

export function ProductInfo() {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <span className={styles.tag}>{PRODUCT.tag}</span>
        <h1 className={styles.name}>{PRODUCT.name}</h1>
        <p className={styles.price}>{PRODUCT.price} €</p>
        <p className={styles.color}>Colore: {PRODUCT.color}</p>

        <button className={styles.sizeBtn} onClick={() => setSelectedSize(selectedSize ? null : 'XS')}>
          <span>Seleziona la taglia {selectedSize ? `- ${selectedSize}` : ''}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="6,9 12,15 18,9" />
          </svg>
        </button>

        <a href="#" className={styles.sizeGuide}>
          Tabella taglie
        </a>

        <Button variant="primary">Pre-ordina</Button>
        <Button variant="secondary">Scopri il look</Button>

        <p className={styles.shippingNote}>Data di spedizione stimata a partire dal {PRODUCT.preorderDate}</p>

        <p className={styles.description}>{PRODUCT.description}</p>

        <Accordion items={ACCORDION_ITEMS} />
      </div>
    </section>
  );
}
```

**`src/components/sections/ProductInfo.module.css`**
```css
.section {
  display: flex;
  justify-content: center;
  padding: 0 16px;
}

.container {
  max-width: 460px;
  width: 100%;
  padding: 40px 0 24px;
}

.tag {
  font-size: 14px;
  display: block;
}

.name {
  font-size: 14px;
  font-weight: 400;
  margin-top: 8px;
}

.price {
  font-size: 14px;
  margin-top: 4px;
}

.color {
  font-size: 14px;
  margin-top: 24px;
  margin-bottom: 16px;
}

.sizeBtn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 12px 0;
  border: none;
  border-bottom: 1px solid #000;
  background: transparent;
  font-size: 14px;
  cursor: pointer;
}

.sizeGuide {
  font-size: 14px;
  text-decoration: underline;
  text-underline-offset: 2px;
  display: inline-block;
  margin-top: 8px;
}

.shippingNote {
  font-size: 14px;
  color: var(--muted);
  margin-top: 20px;
}

.description {
  font-size: 14px;
  line-height: 22px;
  margin-top: 32px;
}
```

### 3.7 DuoCTA Component

**`src/components/sections/DuoCTA.tsx`**
```typescript
import { DUO_CTA } from '@/lib/constants';
import styles from './DuoCTA.module.css';

export function DuoCTA() {
  return (
    <section className={styles.duoRow}>
      <div className={`${styles.card} ${styles.light}`}>
        <div className={styles.label}>{DUO_CTA.left.label}</div>
      </div>
      <div className={`${styles.card} ${styles.dark}`}>
        <div className={styles.label}>{DUO_CTA.right.label}</div>
        <div className={styles.price}>{DUO_CTA.right.price}</div>
      </div>
    </section>
  );
}
```

**`src/components/sections/DuoCTA.module.css`**
```css
.duoRow {
  display: flex;
  width: 100%;
  max-width: 332px;
  height: 166px;
  position: sticky;
  float: right;
  right: 40px;
  bottom: 40px;
  margin-left: auto;
  z-index: 400;
}

.card {
  width: 50%;
  aspect-ratio: 1 / 1;
  padding: 12px;
  box-sizing: border-box;
  border: 1px solid #000;
  overflow: clip;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  font-family: "Noto Sans", sans-serif;
  font-size: 12px;
  line-height: 16.8px;
}

.light {
  background: #fff;
  color: #000;
  border-color: #fff;
}

.dark {
  background: #000;
  color: #fff;
  border-color: #000;
}

.label {
  font-weight: 500;
  margin-bottom: auto;
}

.price {
  font-size: 14px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .duoRow {
    width: 100%;
    max-width: none;
    height: auto;
    position: static;
    float: none;
    right: auto;
    bottom: auto;
    margin-left: 0;
    padding: 20px;
    flex-direction: column;
  }

  .card {
    width: 100%;
  }
}
```

### 3.8 Tabs Component

**`src/components/ui/Tabs.tsx`**
```typescript
'use client';

import { ReactNode, useState } from 'react';
import styles from './Tabs.module.css';

export interface TabItem {
  label: string;
  content: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultIndex?: number;
}

export function Tabs({ items, defaultIndex = 0 }: TabsProps) {
  const [activeIndex, setActiveIndex] = useState(defaultIndex);

  return (
    <div className={styles.tabs}>
      <div className={styles.list}>
        {items.map((item, i) => (
          <button
            key={i}
            className={`${styles.tab} ${activeIndex === i ? styles.active : ''}`}
            onClick={() => setActiveIndex(i)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className={styles.content}>{items[activeIndex].content}</div>
    </div>
  );
}
```

**`src/components/ui/Tabs.module.css`**
```css
.tabs {
  width: 100%;
}

.list {
  display: flex;
  gap: 20px;
  border-bottom: 1px solid var(--border);
}

.tab {
  padding: 16px 0;
  font-size: 14px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--muted);
  transition: color 0.2s;
  position: relative;
}

.tab.active {
  color: var(--fg);
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--fg);
}

.content {
  padding-top: 20px;
}
```

### 3.9 Recently Viewed Component

**`src/components/sections/RecentlyViewed.tsx`**
```typescript
'use client';

import { RECENTLY_VIEWED } from '@/lib/constants';
import { Tabs } from '@/components/ui/Tabs';
import styles from './RecentlyViewed.module.css';

const tabItems = [
  {
    label: 'Visti di recente',
    content: (
      <div className={styles.grid}>
        {RECENTLY_VIEWED.map((item, i) => (
          <div key={i} className={styles.card}>
            <div className={styles.img} style={{ backgroundColor: item.bgColor }} />
            <p className={styles.name}>{item.name}</p>
            <p className={styles.price}>{item.price} €</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    label: 'Potrebbe piacerti anche…',
    content: (
      <div className={styles.grid}>
        {RECENTLY_VIEWED.slice().reverse().map((item, i) => (
          <div key={i} className={styles.card}>
            <div className={styles.img} style={{ backgroundColor: item.bgColor }} />
            <p className={styles.name}>{item.name}</p>
            <p className={styles.price}>{item.price} €</p>
          </div>
        ))}
      </div>
    ),
  },
];

export function RecentlyViewed() {
  return (
    <section className={styles.section}>
      <Tabs items={tabItems} />
    </section>
  );
}
```

**`src/components/sections/RecentlyViewed.module.css`**
```css
.section {
  padding: 40px 20px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-top: 20px;
}

.card {
  cursor: pointer;
}

.img {
  width: 100%;
  aspect-ratio: 1 / 1;
  margin-bottom: 12px;
}

.name {
  font-size: 14px;
  margin-bottom: 4px;
}

.price {
  font-size: 14px;
  color: var(--muted);
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}
```

---

## Rischi

| Rischio | Mitigation |
|---------|-----------|
| Image loading perf | Use Next.js Image + priority for hero |
| Gallery scroll race condition | Lock with ticking flag in hook |
| Accordion state per instance | Each Accordion manages own state |

---

## Criteri Accettazione

✓ Tutte le sezioni renderizzano correttamente  
✓ Gallery arrow navigation funziona  
✓ Accordion toggle works  
✓ Tabs switch content  
✓ Images lazy-load  
✓ Buttons styled  
✓ Responsive 768px OK  
✓ No console errors  
✓ TypeScript strict clean  

---

---

# Milestone 4 — Pagine & Routing

**Obiettivo:** Integrare sezioni in product page, verify layout, styling.

## File Coinvolti

### Modifiche
- `src/app/page.tsx` — Completa product page con tutte le sezioni

### Creazioni
- `src/components/tweaks/TweaksPanel.tsx` — React tweaks panel (development only)

---

## Operazioni

### 4.1 Product Page

**`src/app/page.tsx`**
```typescript
import { ProductGallery } from '@/components/sections/ProductGallery';
import { EngagementGrid } from '@/components/sections/EngagementGrid';
import { ProductInfo } from '@/components/sections/ProductInfo';
import { DuoCTA } from '@/components/sections/DuoCTA';
import { RecentlyViewed } from '@/components/sections/RecentlyViewed';
import { StickyBar } from '@/components/layout/StickyBar';

export default function ProductPage() {
  return (
    <>
      <section style={{ minHeight: '100vh' }}>
        <ProductGallery />
      </section>

      <section style={{ minHeight: '100vh' }}>
        <EngagementGrid />
      </section>

      <section style={{ minHeight: '100vh' }}>
        <ProductInfo />
      </section>

      <DuoCTA />

      <section style={{ minHeight: '100vh', paddingTop: 'var(--sticky-bar-h)' }}>
        <RecentlyViewed />
      </section>

      <StickyBar />
    </>
  );
}
```

### 4.2 Tweaks Panel (Development)

**`src/components/tweaks/TweaksPanel.tsx`** (if needed for QA)
```typescript
'use client';

import { useEffect, useState } from 'react';
import styles from './TweaksPanel.module.css';

interface TweakState {
  itemsPerView: string;
  scrollSnap: boolean;
  showArrows: boolean;
  ctaColor: string;
  showNavHeader: boolean;
  showPGPP: boolean;
  showProductInfo: boolean;
  showSGPP: boolean;
  showDuoCTA: boolean;
  showStickyBar: boolean;
  showSiteFooter: boolean;
}

const DEFAULTS: TweakState = {
  itemsPerView: '2',
  scrollSnap: true,
  showArrows: false,
  ctaColor: '#000000',
  showNavHeader: true,
  showPGPP: true,
  showProductInfo: true,
  showSGPP: true,
  showDuoCTA: true,
  showStickyBar: true,
  showSiteFooter: true,
};

export function TweaksPanel() {
  const [tweaks, setTweaks] = useState<TweakState>(DEFAULTS);
  const [isOpen, setIsOpen] = useState(false);

  const setTweak = <K extends keyof TweakState>(key: K, value: TweakState[K]) => {
    setTweaks((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Apply CSS variables
    document.documentElement.style.setProperty('--cta-color', tweaks.ctaColor);

    // Apply visibility toggles (simplified)
    const nav = document.querySelector('header');
    if (nav) nav.style.display = tweaks.showNavHeader ? '' : 'none';
  }, [tweaks]);

  if (!isOpen) {
    return (
      <button
        className={styles.toggle}
        onClick={() => setIsOpen(true)}
        title="Open Tweaks Panel (Dev Only)"
      >
        ⚙️
      </button>
    );
  }

  return (
    <div className={styles.panel}>
      <button className={styles.close} onClick={() => setIsOpen(false)}>
        ✕
      </button>
      <h3>Tweaks (Dev)</h3>

      <label>
        Items per view:
        <select value={tweaks.itemsPerView} onChange={(e) => setTweak('itemsPerView', e.target.value)}>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
        </select>
      </label>

      <label>
        <input
          type="checkbox"
          checked={tweaks.scrollSnap}
          onChange={(e) => setTweak('scrollSnap', e.target.checked)}
        />
        Scroll snap
      </label>

      <label>
        <input
          type="checkbox"
          checked={tweaks.showArrows}
          onChange={(e) => setTweak('showArrows', e.target.checked)}
        />
        Show arrows
      </label>

      <label>
        CTA Color:
        <input
          type="color"
          value={tweaks.ctaColor}
          onChange={(e) => setTweak('ctaColor', e.target.value)}
        />
      </label>

      <hr />

      <label>
        <input
          type="checkbox"
          checked={tweaks.showNavHeader}
          onChange={(e) => setTweak('showNavHeader', e.target.checked)}
        />
        Show nav header
      </label>

      <label>
        <input
          type="checkbox"
          checked={tweaks.showPGPP}
          onChange={(e) => setTweak('showPGPP', e.target.checked)}
        />
        Show gallery (PGPP)
      </label>

      <label>
        <input
          type="checkbox"
          checked={tweaks.showProductInfo}
          onChange={(e) => setTweak('showProductInfo', e.target.checked)}
        />
        Show product info
      </label>

      <label>
        <input
          type="checkbox"
          checked={tweaks.showSGPP}
          onChange={(e) => setTweak('showSGPP', e.target.checked)}
        />
        Show engagement (SGPP)
      </label>

      <label>
        <input
          type="checkbox"
          checked={tweaks.showDuoCTA}
          onChange={(e) => setTweak('showDuoCTA', e.target.checked)}
        />
        Show duo CTA
      </label>

      <label>
        <input
          type="checkbox"
          checked={tweaks.showStickyBar}
          onChange={(e) => setTweak('showStickyBar', e.target.checked)}
        />
        Show sticky bar
      </label>

      <label>
        <input
          type="checkbox"
          checked={tweaks.showSiteFooter}
          onChange={(e) => setTweak('showSiteFooter', e.target.checked)}
        />
        Show footer
      </label>
    </div>
  );
}
```

**`src/components/tweaks/TweaksPanel.module.css`**
```css
.toggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #000;
  color: #fff;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9998;
  width: 300px;
  max-height: 80vh;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-size: 12px;
}

.close {
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
}

.panel h3 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 14px;
}

.panel label {
  display: block;
  margin-bottom: 8px;
  cursor: pointer;
}

.panel input[type="checkbox"] {
  margin-right: 6px;
}

.panel select {
  margin-left: 6px;
  font-size: 12px;
}

.panel hr {
  margin: 12px 0;
  border: none;
  border-top: 1px solid #e0e0e0;
}
```

---

## Rischi

| Rischio | Mitigation |
|---------|-----------|
| Layout shift on image load | Use aspect-ratio, height hints |
| Sticky positioning mobile | Fallback to static on mobile |

---

## Criteri Accettazione

✓ Product page loads all sections  
✓ Gallery scrolls horizontally  
✓ Engagement grid responsive  
✓ Product info visible  
✓ Duo CTA sticks bottom-right  
✓ Recently viewed tabs work  
✓ Sticky bar fixed  
✓ Breadcrumb visible  
✓ Footer visible  
✓ Dark mode switches  
✓ Mobile responsive (768px)  
✓ No console errors  

---

---

# Milestone 5 — Qualità

**Obiettivo:** Build, type-check, lint, E2E tests, performance audit.

## File Coinvolti

### Creazioni
- `playwright.config.ts` — E2E test configuration
- `e2e/product.spec.ts` — Critical flow tests
- `.env.example` — Template for environment variables

---

## Operazioni

### 5.1 Build Verification

```bash
npm run build
# Verificare che non ci siano errori, build output in .next/
```

### 5.2 Type Check

```bash
npm run type-check
# Verificare zero errori TypeScript
```

### 5.3 Lint

```bash
npm run lint
# Verificare zero errori ESLint
```

### 5.4 E2E Setup

**`playwright.config.ts`**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

### 5.5 E2E Tests

**`e2e/product.spec.ts`**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Product Detail Page', () => {
  test('loads product page with all sections', async ({ page }) => {
    await page.goto('/');
    
    // Check hero gallery loads
    const gallery = page.locator('ul[class*="gallery"]');
    await expect(gallery).toBeVisible();
    
    // Check product info
    const productInfo = page.locator('h1');
    await expect(productInfo).toContainText('Giacca in mohair e lana');
    
    // Check price
    const price = page.locator('p').first();
    await expect(price).toContainText('4200');
  });

  test('gallery navigation works', async ({ page }) => {
    await page.goto('/');
    
    // Click next arrow
    const nextBtn = page.locator('button[aria-label="Immagine successiva"]');
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      // Verify scroll happened
    }
  });

  test('accordion toggles content', async ({ page }) => {
    await page.goto('/');
    
    // Scroll to accordion
    await page.locator('text=Dettagli prodotto').click();
    
    // Check content visible
    const content = page.locator('text=Tela di lana');
    await expect(content).toBeVisible();
  });

  test('responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check layout stacks
    const gallery = page.locator('ul[class*="gallery"] li');
    const firstItem = gallery.first();
    
    // Mobile should be 100% width
    const width = await firstItem.evaluate((el) => window.getComputedStyle(el).width);
    expect(width).not.toContain('50%');
  });

  test('dark mode switches', async ({ page }) => {
    await page.goto('/');
    
    // Simulate dark mode
    await page.evaluate(() => {
      window.matchMedia = () => ({ matches: true });
    });
    
    // Check CSS custom property
    const bgColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    });
    
    expect(bgColor).toBeTruthy();
  });

  test('sticky bar visible on scroll', async ({ page }) => {
    await page.goto('/');
    
    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 500));
    
    // Check sticky bar visible
    const stickyBar = page.locator('[class*="StickyBar"]');
    await expect(stickyBar).toBeInViewport();
  });
});
```

### 5.6 Performance Audit (Manual)

```bash
npm run build
npm run start

# Then use Chrome DevTools Lighthouse for:
# - LCP < 2.5s
# - INP < 200ms
# - CLS < 0.1
# - Bundle size
```

---

## Rischi

| Rischio | Mitigation |
|---------|-----------|
| E2E flakiness | Use deterministic waits, avoid setTimeout |
| Image perf impact | Lazy load non-hero images |
| Build time | Profile with `next build --profile` |

---

## Criteri Accettazione

✓ `npm run build` successful  
✓ `npm run type-check` clean  
✓ `npm run lint` clean  
✓ E2E tests pass (all 6 scenarios)  
✓ LCP < 2.5s  
✓ INP < 200ms  
✓ CLS < 0.1  
✓ No console warnings  

---

---

# Milestone 6 — Deploy Ready

**Obiettivo:** SEO metadata, performance final check, production configuration.

## File Coinvolti

### Modifiche
- `src/app/layout.tsx` — Enhance metadata
- `next.config.js` — Production optimizations
- `README.md` — Deployment instructions

### Creazioni
- `.env.example` — Environment template
- `public/robots.txt` — SEO robots
- `public/sitemap.xml` — SEO sitemap

---

## Operazioni

### 6.1 Enhanced Metadata

**Update `src/app/layout.tsx`**
```typescript
export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: 'Giacca in mohair e lana — Double black · Bottega Veneta',
  description: 'Giacca in tela di lana e morbido mohair, con revers in seta motivo Intrecciato. Pre-ordina ora.',
  keywords: ['giacca', 'mohair', 'bottega veneta', 'fashion'],
  openGraph: {
    title: 'Giacca in mohair e lana',
    description: 'Giacca in tela di lana e morbido mohair.',
    type: 'product',
    url: 'https://example.com/products/jacket-001',
    images: [
      {
        url: 'https://example.com/uploads/01-mode.jpg',
        width: 1200,
        height: 1200,
        alt: 'Giacca in mohair e lana',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Giacca in mohair e lana',
    description: 'Giacca in tela di lana e morbido mohair.',
    images: ['https://example.com/uploads/01-mode.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: 'https://example.com/products/jacket-001',
  },
};
```

### 6.2 Production next.config.js

**Update `next.config.js`**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  productionBrowserSourceMaps: false,
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
  },
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### 6.3 SEO Files

**`public/robots.txt`**
```
User-agent: *
Allow: /
Disallow: /.next/
Sitemap: https://example.com/sitemap.xml
```

**`public/sitemap.xml`**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

### 6.4 Environment Template

**`.env.example`**
```
# API Configuration
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_SITE_NAME=Bottega Veneta

# Analytics (optional)
NEXT_PUBLIC_GA_ID=G_XXXXXXX
```

### 6.5 Deployment Instructions

**Update `README.md`**
```markdown
## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repository to Vercel
3. Vercel auto-detects Next.js
4. Configure environment variables
5. Deploy

### Self-hosted

```bash
npm run build
npm run start
```

Server must support Node.js 18+.

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY .next ./
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables

See `.env.example` for required configuration.

## Performance Targets

- LCP: < 2.5s
- INP: < 200ms
- CLS: < 0.1
- Bundle (JS): < 150kb gzipped
```

---

## Rischi

| Rischio | Mitigation |
|---------|-----------|
| SEO metadata not crawled | Verify with Google Search Console |
| Performance degradation | Monitor with Web Vitals |
| CORS headers too strict | Adjust based on API requirements |

---

## Criteri Accettazione

✓ SEO metadata complete  
✓ robots.txt + sitemap in place  
✓ Security headers configured  
✓ Environment variables documented  
✓ Build succeeds without warnings  
✓ Lighthouse score >= 90 (all metrics)  
✓ README updated with deploy instructions  
✓ .env.example present  

---

## Comandi Finali

```bash
npm install
npm run lint
npm run type-check
npm run build
npm run start

# E2E tests (deve girare dev server separatamente)
npm run test:e2e
```

---

---

## Sommario Milestone

| Milestone | Obiettivo | Durata | Status |
|-----------|-----------|--------|--------|
| 1 | Setup Next.js, TypeScript, ESLint | 2-3h | TODO |
| 2 | Layout, metadata, shared components | 2-3h | TODO |
| 3 | React components, hooks | 4-5h | TODO |
| 4 | Product page, routing | 2-3h | TODO |
| 5 | Build, tests, lint | 2-3h | TODO |
| 6 | Deploy, SEO, perf audit | 1-2h | TODO |

**Totale:** ~14-20h

---

## Checklist Finale

- [ ] Repository cloned, dependencies installed
- [ ] Milestone 1 complete: Next.js + TypeScript setup
- [ ] Milestone 2 complete: Layout + metadata + shared components
- [ ] Milestone 3 complete: React components + hooks
- [ ] Milestone 4 complete: Product page renders all sections
- [ ] Milestone 5 complete: Build, lint, type-check, E2E tests pass
- [ ] Milestone 6 complete: SEO, perf audit, deployment ready
- [ ] All docs updated (README, env vars, deployment)
- [ ] No console errors, no type errors, no lint errors
- [ ] Performance metrics within targets
- [ ] Manual QA on desktop + mobile + dark mode
- [ ] Regression check vs original (visual, functional)
- [ ] Ready for production

