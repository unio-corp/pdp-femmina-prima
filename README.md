# PDP Femmina Prima

Next.js Product Detail Page (PDP) per Bottega Veneta — React components, design system, e SEO-ready configuration.

## Requisiti

- Node.js >= 18
- npm

## Configurazione

1. Clona il repository e installa le dipendenze:

   ```bash
   git clone https://github.com/unio-corp/pdp-femmina-prima.git
   cd pdp-femmina-prima
   npm install
   ```

2. Avvia il server di sviluppo locale:

   ```bash
   npm run dev
   ```

   Apri [http://localhost:3000](http://localhost:3000) nel browser.

## Script disponibili

| Comando | Descrizione |
|---------|-------------|
| `npm run dev` | Avvia server di sviluppo (Next.js) |
| `npm run build` | Build per produzione |
| `npm run start` | Avvia server di produzione |
| `npm run lint` | Esegui ESLint |
| `npm run type-check` | Verifica TypeScript |
| `npm run format` | Formatta con Prettier |
| `npm run test:e2e` | Esegui test E2E con Playwright |

## Struttura del progetto

```
src/
├── app/
│   ├── layout.tsx          # Root layout con metadata
│   └── page.tsx            # Product detail page
├── components/
│   ├── layout/             # Header, Footer, StickyBar
│   ├── sections/           # ProductGallery, ProductInfo, etc.
│   ├── ui/                 # Button, Tabs, Accordion
│   └── tweaks/             # Dev-time settings panel
├── hooks/
│   └── useGallery.ts       # Gallery navigation logic
├── lib/
│   └── constants.ts        # Product data, nav links, etc.
├── styles/
│   └── globals.css         # Design tokens, resets
└── types/
    └── index.ts            # TypeScript definitions
```

## Deployment

### Vercel (Recommended)

1. Push repository to GitHub
2. Connect repository to [Vercel](https://vercel.com)
3. Vercel detects Next.js automatically
4. Configure environment variables (see `.env.example`)
5. Deploy on push

### Self-hosted

```bash
npm run build
npm run start
```

Server deve supportare Node.js 18+.

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

## Environment Variables

Vedi `.env.example`:

```
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_SITE_NAME=Bottega Veneta
NEXT_PUBLIC_GA_ID=G_XXXXXXX
```

## Performance Targets

- **LCP**: < 2.5s
- **INP**: < 200ms
- **CLS**: < 0.1
- **JS Bundle**: < 150kb (gzipped)

## Development

### Linting

```bash
npm run lint
```

### Type checking

```bash
npm run type-check
```

### E2E tests

```bash
npm run test:e2e
```

Tests run against dev server at `http://localhost:3000`. Browsers (Chrome, Firefox, Safari) installed via Playwright.

### Code formatting

```bash
npm run format
```

## SEO

- `public/robots.txt` — Crawler directives
- `public/sitemap.xml` — URL list for indexing
- Metadata in `src/app/layout.tsx` — OpenGraph, Twitter Card, canonical URLs
