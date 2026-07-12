# PDP Femmina Prima

Product Detail Page (PDP) statica per Bottega Veneta — design system e markup della pagina prodotto.

## Requisiti

- Node.js >= 18
- npm

## Configurazione

1. Clona il repository e installa le dipendenze:

   ```bash
   git clone <repo-url>
   cd pdp-femmina-prima
   npm install
   ```

2. Avvia il server di sviluppo locale:

   ```bash
   npm run dev
   ```

   Il comando usa [`live-server`](https://www.npmjs.com/package/live-server) e apre `index.html` con ricaricamento automatico ad ogni modifica.

3. Apri il browser all'indirizzo indicato in console (di default `http://127.0.0.1:8080`).

## Script disponibili

| Comando         | Descrizione                                        |
|-----------------|-----------------------------------------------------|
| `npm run dev`   | Avvia il server di sviluppo con live reload         |
| `npm run build` | Placeholder — build non ancora configurata          |
| `npm run preview` | Serve la cartella `dist/` (richiede una build)    |

## Struttura del progetto

```
.
├── index.html              # Markup della pagina prodotto
├── src/
│   ├── components/ui/      # Componenti CSS (bottoni, card, ...)
│   ├── scripts/main.js      # Logica JS della pagina
│   └── styles/              # Stili globali e design tokens
├── uploads/                 # Asset immagine dei prodotti
└── package.json
```

## Linting e formattazione

Il progetto include `eslint` e `prettier` come dipendenze di sviluppo. Puoi eseguirli manualmente, ad esempio:

```bash
npx eslint src/scripts
npx prettier --check .
```
