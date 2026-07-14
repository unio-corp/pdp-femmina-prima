# Product Gallery — Specifiche di implementazione

**Progetto:** PDP headless e-commerce  
**Componente:** `ProductGallery`  
**Stato:** specifica pronta per implementazione  
**Versione:** 1.0  
**Data:** 13 luglio 2026  
**Reference UX:** [Bottega Veneta — Madison Espresso](https://www.bottegaveneta.com/it-it/madison-espresso-876648V6JG02009.html)

---

## 1. Obiettivo

Implementare una galleria immagini prodotto immersiva, responsive e accessibile per la PDP, ispirata alla reference Bottega Veneta ma adattata alle decisioni di progetto.

Il componente deve:

- mostrare tutte le immagini prodotto prima delle informazioni commerciali e descrittive;
- usare una griglia continua su tablet e desktop;
- usare un carousel touch su mobile;
- mostrare sul carousel mobile un contatore numerico permanente;
- aprire ogni immagine in una lightbox fullscreen con zoom completo;
- mantenere buone prestazioni con immagini ad alta risoluzione;
- essere compatibile con Next.js App Router, TypeScript strict, Tailwind CSS, shadcn/ui e `next/image`;
- ricevere dati tramite props, senza API simulate e senza dipendenza diretta da Shopify o Sanity.

Questa specifica definisce un componente riutilizzabile nel design system **Beyond the Glass**, senza legarlo alla struttura della singola PDP.

---

## 2. Decisioni approvate

| Area | Decisione vincolante |
| --- | --- |
| Distribuzione | Galleria continua: tutte le immagini precedono le informazioni prodotto. |
| Mobile | Carousel con swipe/drag, controlli precedente/successiva e contatore sempre visibile nel formato `03 / 07`. |
| Lightbox | Zoom completo: fullscreen, zoom, pan, pinch-to-zoom, double tap, swipe, tastiera e caricamento mirato delle immagini adiacenti. |
| Ordine | L'array ricevuto tramite props è la sola fonte dell'ordine di visualizzazione. |
| Loop | Nessun loop infinito nel carousel o nella lightbox. |
| Immagini | Nessun ritaglio dei packshot: comportamento predefinito `object-fit: contain`. |

### 2.1 Differenze rispetto alla reference

La pagina Bottega Veneta analizzata presenta sette immagini: le prime due compaiono nel blocco iniziale e le immagini 3–7 ricompaiono dopo le informazioni prodotto. La soluzione richiesta mantiene l'esperienza visuale e l'apertura ingrandita, ma porta tutte le immagini in un unico flusso prima dei contenuti prodotto.

---

## 3. Scope

### 3.1 Incluso nella versione 1

- immagini raster `jpg`, `jpeg`, `png`, `webp` e `avif`;
- una raccolta da 1 a 20 immagini;
- layout responsive;
- carousel mobile basato su scroll snap nativo;
- navigazione con pulsanti precedente/successiva;
- contatore numerico;
- lightbox accessibile;
- zoom da 1× a 4×;
- pan dell'immagine quando ingrandita;
- pinch-to-zoom e double tap su dispositivi touch;
- zoom tramite click/pulsanti e rotella con modificatore su desktop;
- navigazione da tastiera;
- gestione del focus e blocco dello scroll della pagina;
- placeholder, lazy loading e gestione degli errori;
- eventi analytics disaccoppiati tramite callback;
- supporto a `prefers-reduced-motion`;
- test unitari, di integrazione, accessibilità ed end-to-end.

### 3.2 Fuori scope per la versione 1

- cambio colore/variante capace di sostituire immagini o altri contenuti;
- sincronizzazione della gallery con Shopify variant state;
- sequenza editoriale o layout controllati dal CMS;
- query, mutation o subscription verso Sanity;
- video, audio, modelli 3D, AR e media 360°;
- miniature persistenti;
- zoom al passaggio del mouse nella galleria inline;
- download e condivisione delle immagini;
- annotazioni, hotspot e contenuti sovrapposti;
- infinite loop o autoplay;
- virtualizzazione della griglia;
- gestione dei diritti degli asset o trasformazioni DAM lato componente.

> Nota: i tipi dati possono essere estesi in futuro, ma la versione 1 deve accettare esclusivamente immagini. Non inserire rami incompleti per video o media 3D nel codice di produzione.

---

## 4. Comportamento responsive

### 4.1 Breakpoint di riferimento

| Modalità | Viewport | Presentazione |
| --- | ---: | --- |
| Mobile | `< 768px` | Carousel orizzontale, una immagine per volta. |
| Tablet | `768–1023px` | Griglia continua a due colonne. |
| Desktop | `≥ 1024px` | Griglia continua a due colonne. |

I breakpoint devono usare i token del design system. I valori sopra costituiscono il fallback contrattuale se i token non sono ancora disponibili.

### 4.2 Mobile carousel

- Una slide occupa il 100% della larghezza disponibile.
- Il contenitore usa `overflow-x: auto`, `scroll-snap-type: x mandatory` e `overscroll-behavior-x: contain`.
- Ogni slide usa `scroll-snap-align: start` e `scroll-snap-stop: always`.
- Il rapporto del frame deriva da `width / height` dell'asset; il contenitore riserva lo spazio prima del caricamento.
- Altezza massima consigliata: `calc(100svh - var(--gallery-mobile-offset, 96px))`.
- Lo swipe deve seguire lo scroll nativo. Non intercettare `touchmove` quando lo zoom inline non è attivo.
- Il drag con mouse è opzionale solo se non compromette selezione, click o scroll; i pulsanti restano il meccanismo alternativo obbligatorio.
- I pulsanti precedente/successiva sono sempre disponibili, hanno target minimo 44 × 44 CSS px e risultano disabilitati agli estremi.
- Il contatore usa zeri iniziali solo quando il totale è almeno 10: `3 / 7`, `03 / 12`.
- Il contatore è aggiornato quando la slide supera il 60% di visibilità; usare `IntersectionObserver` con root sul carousel, non calcoli continui durante lo scroll.
- Al tap/click sull'immagine si apre la lightbox all'indice corrente.

### 4.3 Tablet e desktop

- Griglia a due colonne di uguale larghezza.
- Gap determinato dal token `--gallery-grid-gap`; fallback: `2px` mobile/tablet e `4px` desktop.
- Tutte le immagini sono renderizzate nello stesso blocco DOM, prima delle informazioni prodotto.
- Se il numero di immagini è dispari, l'ultima immagine occupa entrambe le colonne.
- Ogni cella conserva l'aspect ratio dell'asset e usa un fondo neutro definito dal design system.
- L'immagine usa `object-fit: contain` e `object-position: center`.
- L'intera area visibile dell'immagine è un pulsante semantico che apre la lightbox.
- Non mostrare frecce, punti, contatore o miniature nella griglia inline.

### 4.4 Quantità particolari

| Numero immagini | Risultato |
| ---: | --- |
| 0 | Non renderizzare il componente; loggare un warning soltanto in sviluppo. |
| 1 | Mobile: nessuno scorrimento e controlli nascosti; desktop: elemento full width. |
| 2 | Mobile: carousel; desktop: due colonne. |
| Dispari ≥ 3 | Ultimo elemento full width su tablet/desktop. |
| Oltre 20 | Validazione fallita in sviluppo; in produzione mostrare al massimo le prime 20 e inviare un errore osservabile. |

---

## 5. Lightbox fullscreen e zoom

### 5.1 Apertura e chiusura

- Apertura da click/tap sull'immagine o tramite `Enter`/`Space` quando il trigger è focalizzato.
- La lightbox si apre sull'indice selezionato, senza animazione di ingresso obbligatoria.
- Chiusura tramite pulsante, `Escape` o click sul backdrop solo quando l'immagine non è in pan e il puntatore non ha eseguito un drag.
- Alla chiusura, il focus torna esattamente al trigger che ha aperto la lightbox.
- Il contenuto sottostante diventa inerte e non è raggiungibile da tastiera o screen reader.
- Lo scroll della pagina viene bloccato preservando la posizione corrente; al termine viene ripristinato senza salto.

Implementare il contenitore con il componente `Dialog` di shadcn/ui, mantenendo il comportamento del pattern modal dialog WAI-ARIA.

### 5.2 Struttura visiva

- Overlay a viewport intera: `position: fixed; inset: 0`.
- Usare `100dvh` con fallback `100vh`.
- Immagine centrata nell'area disponibile e inizialmente contenuta senza ritaglio.
- Pulsante chiudi in alto a destra.
- Controlli precedente/successiva ai lati su desktop e nell'area inferiore su mobile.
- Contatore centrato o allineato in basso secondo i token del tema.
- Pulsanti zoom `−`, `+` e “Ripristina” sempre accessibili da tastiera; “Ripristina” può essere nascosto quando lo zoom è 1×.
- I controlli non devono coprire parti essenziali dell'immagine; usare safe-area inset su iOS.

### 5.3 Modello di zoom

| Azione | Risultato |
| --- | --- |
| Click su desktop | Alterna 1× e 2× centrando il punto cliccato. |
| Double tap | Alterna 1× e 2× centrando il punto toccato. |
| Pinch | Zoom continuo tra 1× e 4×. |
| Pulsanti `+`/`−` | Incrementi di 0,5×. |
| Rotella + `Ctrl`/`Meta` | Zoom continuo; la normale rotella senza modificatore non modifica lo zoom. |
| Pan | Consentito solo con zoom maggiore di 1×. |
| Pulsante Ripristina | Torna a 1× e azzera la traslazione. |
| Cambio immagine | Reimposta zoom e pan prima di mostrare il nuovo asset. |

Regole tecniche:

- applicare la trasformazione con `transform: translate3d(...) scale(...)`;
- mantenere `transform-origin: 0 0` oppure usare una matrice equivalente, purché il punto focale resti stabile durante lo zoom;
- usare Pointer Events e `setPointerCapture()` per unificare mouse, penna e touch;
- limitare il pan in modo che l'immagine non possa essere trascinata completamente fuori dall'area visibile;
- applicare `touch-action: none` solo sulla superficie zoomabile mentre la lightbox è aperta;
- usare `requestAnimationFrame` per aggiornare trasformazioni durante pinch e pan;
- non aggiornare React state a ogni pixel di movimento: mantenere i valori transitori in ref e committare lo stato al termine della gesture;
- una variazione inferiore a 6 CSS px è un tap; oltre tale soglia è un drag e non deve attivare il click;
- una doppia interazione deve avvenire entro 280 ms e 24 CSS px;
- se `prefers-reduced-motion: reduce`, eliminare interpolazioni di zoom, pan e cambio slide.

### 5.4 Navigazione tra immagini

- `ArrowRight`: immagine successiva.
- `ArrowLeft`: immagine precedente.
- `Home`: prima immagine.
- `End`: ultima immagine.
- `Escape`: chiude la lightbox.
- `+`/`=`: aumenta lo zoom.
- `-`: diminuisce lo zoom.
- `0`: ripristina zoom e pan.
- Swipe orizzontale: cambia immagine soltanto a zoom 1×.
- A zoom maggiore di 1×, il movimento orizzontale esegue pan e non cambia immagine.
- Nessun wrap: i controlli sono disabilitati sulla prima e sull'ultima immagine.

### 5.5 Caricamento nella lightbox

- Usare l'asset ad alta risoluzione `zoomSrc` quando presente; in caso contrario usare `src`.
- Al momento dell'apertura caricare l'immagine corrente.
- Dopo il caricamento della corrente, prefetch delle sole immagini `index - 1` e `index + 1`.
- Non precaricare l'intera collezione ad alta risoluzione.
- Annullare o ignorare richieste obsolete quando la lightbox viene chiusa rapidamente.
- Mostrare un indicatore discreto durante il caricamento, senza rimuovere i controlli di chiusura.
- In caso di errore, mostrare il placeholder, un messaggio accessibile “Immagine non disponibile” e mantenere utilizzabili precedente/successiva.

---

## 6. Contratto dati

```ts
export type ProductGalleryImage = Readonly<{
  id: string;
  src: string;
  zoomSrc?: string;
  alt: string;
  width: number;
  height: number;
  blurDataURL?: string;
  dominantColor?: string;
}>;

export type ProductGalleryEvent =
  | { type: 'open'; index: number; mediaId: string }
  | { type: 'close'; index: number; mediaId: string }
  | { type: 'navigate'; from: number; to: number; method: 'swipe' | 'button' | 'keyboard' }
  | { type: 'zoom'; index: number; scale: number; method: 'click' | 'double-tap' | 'pinch' | 'button' | 'wheel' | 'keyboard' }
  | { type: 'error'; index: number; mediaId: string; source: 'inline' | 'lightbox' };

export type ProductGalleryProps = Readonly<{
  images: readonly ProductGalleryImage[];
  productName: string;
  initialIndex?: number;
  className?: string;
  onEvent?: (event: ProductGalleryEvent) => void;
}>;
```

### 6.1 Regole di validazione

- `id` deve essere stabile e univoco nella raccolta.
- `src`, `alt`, `width` e `height` sono obbligatori.
- `width` e `height` devono essere interi positivi.
- `alt` deve descrivere il contenuto o l'angolazione dell'immagine, non ripetere soltanto il nome del prodotto.
- Se l'immagine è puramente duplicata, usare `alt: ""`; non duplicare descrizioni identiche.
- `initialIndex` deve essere normalizzato nell'intervallo disponibile.
- L'ordine di `images` è definitivo. Il componente non riordina, raggruppa o legge metadati editoriali.
- La versione 1 non espone `variantId`, `color`, `layout`, `role` o proprietà CMS.
- Le props passate dal Server Component al Client Component devono essere serializzabili; `onEvent` può essere collegato solo in un wrapper client.

---

## 7. Architettura dei componenti

```text
ProductGallery
├── ProductGalleryGrid            # tablet/desktop
│   └── ProductImageTrigger[]
├── ProductGalleryCarousel        # mobile
│   ├── ProductImageTrigger[]
│   └── GalleryNavigation
└── ProductGalleryLightbox
    ├── ZoomSurface
    ├── LightboxNavigation
    ├── GalleryCounter
    └── ImageLoadState
```

### 7.1 Responsabilità

| Modulo | Responsabilità |
| --- | --- |
| `ProductGallery` | Validazione, indice attivo, apertura/chiusura e coordinamento generale. |
| `ProductGalleryGrid` | Layout continuo tablet/desktop; nessuna logica di zoom. |
| `ProductGalleryCarousel` | Scroll snap, osservazione slide attiva e sincronizzazione dei controlli. |
| `ProductImageTrigger` | Rendering ottimizzato e trigger semantico della lightbox. |
| `ProductGalleryLightbox` | Dialog, focus, keyboard map, stato indice e prefetch adiacente. |
| `ZoomSurface` | Pointer Events, pinch, double tap, pan, limiti e trasformazioni. |
| `GalleryNavigation` | Pulsanti, stati disabled, contatore e label accessibili. |

### 7.2 Confine Server/Client

La pagina PDP rimane un Server Component e prepara il modello serializzabile delle immagini. L'interattività della galleria vive in un Client Component con `'use client'`.

Struttura consigliata:

```tsx
// Server Component
export function ProductMediaSection({ product }: Props) {
  const images = mapProductImages(product);

  return <ProductGallery images={images} productName={product.title} />;
}
```

Se è richiesto `onEvent`, aggiungere un adapter client che traduca l'evento tipizzato nel provider analytics dell'applicazione. Non importare SDK analytics nel componente del design system.

### 7.3 Stato minimo

```ts
type GalleryState = {
  activeIndex: number;
  isLightboxOpen: boolean;
  scale: number;
  translation: { x: number; y: number };
  lightboxStatus: 'idle' | 'loading' | 'ready' | 'error';
};
```

Non duplicare nello stato React:

- la lista immagini;
- larghezza e altezza già presenti nelle props;
- coordinate transitorie di ogni evento pointer;
- breakpoint rilevabili via CSS.

---

## 8. Rendering e stile

### 8.1 Regole immagini

- Usare `next/image` per tutte le immagini inline e, salvo incompatibilità del loader, anche nella lightbox.
- Impostare sempre `width` e `height` oppure un contenitore con aspect ratio stabile.
- Prima immagine: `preload={true}` soltanto se confermata come elemento LCP della viewport.
- Se il layout rende plausibili più candidati LCP, preferire `fetchPriority="high"` sulla prima immagine senza combinare `preload`, `loading` e `fetchPriority` sullo stesso elemento.
- Altre immagini: `loading="lazy"`.
- `sizes` per celle standard: `(max-width: 767px) 100vw, 50vw`.
- `sizes` per la cella finale full width: `(max-width: 767px) 100vw, 100vw`.
- Qualità inline: usare la qualità consentita dal progetto, fallback 75.
- `blurDataURL` deve essere molto piccolo; non generarlo nel browser.
- Consentire host remoti soltanto tramite `images.remotePatterns` con protocollo, host e pathname restrittivi.
- Vietato `unoptimized` come soluzione generale; ammetterlo solo per un loader/DAM già ottimizzato e documentato.

### 8.2 Crop e focal point

La versione 1 non applica crop editoriali. Il frame deve rispettare l'intera immagine:

```css
.galleryImage {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
}
```

Se gli asset includono spazio bianco incorporato, il componente non deve tentare di rimuoverlo tramite zoom automatico o rilevamento del soggetto.

### 8.3 Token richiesti

```css
--gallery-surface;
--gallery-overlay;
--gallery-control-bg;
--gallery-control-fg;
--gallery-control-border;
--gallery-focus-ring;
--gallery-grid-gap;
--gallery-control-size;
--gallery-z-modal;
--gallery-transition-duration;
--gallery-transition-easing;
```

Fallback minimi:

- controllo: 44 px;
- focus ring: 2 px con offset 2 px;
- overlay: nero al 92%;
- durata: 180 ms;
- easing: `cubic-bezier(0.2, 0, 0, 1)`;
- durata con reduced motion: 0 ms.

Non codificare colori di brand direttamente nel componente.

---

## 9. Accessibilità

Target: conformità **WCAG 2.2 AA**.

### 9.1 Semantica

- Contenitore: `<section aria-label="Immagini di {productName}">`.
- Ogni trigger inline è un `<button type="button">`, non un `div` cliccabile.
- Label trigger: `Apri immagine {n} di {totale} di {productName}`.
- Lightbox: `role="dialog"`, `aria-modal="true"` e nome accessibile.
- Pulsanti con label esplicite: “Immagine precedente”, “Immagine successiva”, “Aumenta zoom”, “Riduci zoom”, “Ripristina zoom”, “Chiudi galleria”.
- Il contatore visivo è accompagnato da testo accessibile `Immagine {n} di {totale}`.
- Lo stato aggiornato usa `aria-live="polite"`; evitare annunci durante ogni frame dello scroll.

### 9.2 Focus e tastiera

- Focus iniziale sul pulsante chiudi oppure sul titolo statico con `tabindex="-1"` se serve contesto aggiuntivo.
- Focus intrappolato nella lightbox.
- Ordine di tabulazione coerente con l'ordine visivo.
- Focus sempre visibile e non coperto.
- Ripristino del focus al trigger di origine.
- La lightbox resta completamente utilizzabile senza gesture.

### 9.3 Touch e input alternativi

- Target interattivi consigliati: almeno 44 × 44 CSS px.
- Swipe, drag e pinch hanno sempre un'alternativa tramite pulsanti o tastiera.
- Non bloccare il passaggio da touch a mouse, penna o tastiera.
- Nessuna funzione dipende esclusivamente da hover, precisione del puntatore o multi-touch.

### 9.4 Contrasto e movimento

- Testo e icone dei controlli: rapporto di contrasto minimo 4.5:1; componenti grafici e focus indicator almeno 3:1 rispetto agli adiacenti.
- I controlli restano leggibili sopra immagini chiare e scure tramite superficie opaca o semitrasparente verificata.
- Con `prefers-reduced-motion`, disabilitare transizioni non essenziali senza rimuovere informazioni o funzionalità.

---

## 10. Performance budget

I valori sono criteri di accettazione da misurare su una PDP rappresentativa, in produzione, con profilo mobile simulato e cache vuota.

| Metrica | Budget |
| --- | ---: |
| LCP p75 | ≤ 2,5 s |
| CLS p75 | ≤ 0,10 |
| INP p75 | ≤ 200 ms |
| JavaScript aggiuntivo gallery, gzip | obiettivo ≤ 30 kB; massimo 45 kB |
| Immagini richieste prima dell'interazione | prima immagine e sole immagini prossime alla viewport |
| Asset inline iniziale | obiettivo ≤ 250 kB sul candidato LCP mobile |
| Asset lightbox corrente | obiettivo ≤ 1,2 MB, salvo requisiti fotografici documentati |
| Risposta a pulsante precedente/successiva | feedback visivo ≤ 100 ms |

Regole:

- non montare il contenuto pesante della lightbox finché non viene aperta;
- caricare dinamicamente il modulo `ZoomSurface` se l'analisi bundle dimostra un beneficio netto;
- non importare librerie carousel: lo scroll snap nativo copre i requisiti della versione 1;
- non caricare `zoomSrc` durante il rendering inline;
- riservare dimensioni per prevenire layout shift;
- limitare gli observer a uno per carousel e disconnetterli all'unmount;
- verificare il bundle con gli strumenti previsti dal progetto e registrare il risultato nella pull request.

---

## 11. Gestione errori e casi limite

### 11.1 Asset non disponibile

- Mantenere il rapporto del frame.
- Mostrare superficie neutra e icona non decorativa.
- Visualizzare testo “Immagine non disponibile”.
- Inviare `ProductGalleryEvent` di tipo `error`.
- Non rimuovere l'elemento dall'array: la numerazione deve restare stabile.

### 11.2 JavaScript disabilitato o non idratato

- Le immagini devono rimanere visibili nel markup iniziale.
- Su mobile deve restare possibile lo scroll orizzontale nativo.
- Lightbox, pulsanti e zoom possono richiedere JavaScript; non nascondere le immagini in sua assenza.

### 11.3 Resize e cambio orientamento

- Ricalcolare i limiti del pan e ricentrare l'immagine.
- Conservare l'indice attivo.
- Se il nuovo viewport rende invalida la traslazione, limitarla senza animazione brusca.
- Usare `ResizeObserver` sulla superficie, non listener globali multipli.

### 11.4 Back/forward e URL

La versione 1 non scrive l'indice della lightbox nella URL e non aggiunge history entry. Il tasto Back del browser non è un comando di chiusura contrattuale.

---

## 12. Analytics

Il componente emette eventi tipizzati tramite `onEvent` ma non conosce il provider finale.

Eventi minimi:

| Evento | Quando | Proprietà minime |
| --- | --- | --- |
| `open` | Apertura lightbox | `index`, `mediaId` |
| `close` | Chiusura lightbox | `index`, `mediaId` |
| `navigate` | Indice cambiato per azione utente | `from`, `to`, `method` |
| `zoom` | Livello di zoom stabilizzato | `index`, `scale`, `method` |
| `error` | Fallimento asset | `index`, `mediaId`, `source` |

Non emettere eventi a ogni frame di pinch/pan. Per lo zoom, inviare l'evento al termine della gesture oppure con debounce di 300 ms.

---

## 13. Piano di test

### 13.1 Unit test

- normalizzazione `initialIndex`;
- formattazione contatore per 1–9 e 10+ immagini;
- precedente/successiva senza loop;
- calcolo del full span per raccolte dispari;
- clamp dello zoom tra 1× e 4×;
- clamp del pan ai limiti;
- distinzione tap/drag e double tap;
- reset zoom al cambio immagine;
- validazione dati e duplicati `id`;
- mapping degli eventi analytics.

### 13.2 Integration test

- apertura sull'immagine corretta;
- focus trap e focus return;
- navigazione completa da tastiera;
- aggiornamento contatore dopo scroll snap;
- pulsanti disabled agli estremi;
- caricamento di corrente e sole adiacenti in lightbox;
- blocco e ripristino scroll;
- errore immagine senza alterazione della sequenza;
- reduced motion;
- resize/orientation change.

### 13.3 Accessibilità automatizzata e manuale

- audit axe senza violazioni critical/serious;
- VoiceOver + Safari su macOS e iOS;
- navigazione solo tastiera su Chrome e Firefox;
- zoom pagina del browser al 200% e reflow al 400%;
- controllo contrasto di icone, testo, superfici e focus;
- verifica target touch;
- verifica che ogni gesture abbia un'alternativa semplice.

### 13.4 Matrice E2E minima

| Ambiente | Viewport/Input | Scenari |
| --- | --- | --- |
| Safari iOS corrente | iPhone, touch | swipe, contatore, lightbox, pinch, double tap, safe areas, rotazione. |
| Chrome Android corrente | smartphone, touch | swipe, controlli, pinch, error fallback. |
| Safari macOS corrente | desktop, mouse/tastiera | griglia, apertura, click zoom, tastiera, focus. |
| Chrome corrente | desktop, mouse/tastiera | griglia, wheel modifier, pan, performance. |
| Firefox corrente | desktop, mouse/tastiera | dialog, focus, scroll lock, immagini. |
| iPadOS Safari corrente | tablet, touch/tastiera | griglia, lightbox, pinch, orientation. |

Usare il framework E2E già adottato dal progetto; questa specifica non introduce una nuova dipendenza di test.

---

## 14. Criteri di accettazione

La funzionalità è completata quando:

- [ ] tutte le immagini ricevute vengono mostrate prima delle informazioni prodotto;
- [ ] su mobile la galleria è un carousel a una slide, con contatore e controlli sempre utilizzabili;
- [ ] su tablet/desktop la galleria è una griglia a due colonne e l'ultima immagine dispari è full width;
- [ ] la sequenza coincide esattamente con l'array `images`;
- [ ] nessun comportamento dipende da CMS, variante o colore;
- [ ] il click/tap apre la lightbox all'indice corretto;
- [ ] la lightbox supporta zoom 1×–4×, pan, pinch, double tap e reset;
- [ ] precedente/successiva non eseguono loop;
- [ ] tutte le azioni principali sono disponibili con tastiera e controlli non gestuali;
- [ ] focus trap, `Escape`, focus return e scroll lock funzionano;
- [ ] il cambio immagine reimposta zoom e pan;
- [ ] soltanto l'immagine corrente e le adiacenti vengono precaricate in alta risoluzione;
- [ ] le immagini non vengono ritagliate;
- [ ] un asset guasto non interrompe navigazione o numerazione;
- [ ] la prima immagine non produce layout shift percepibile;
- [ ] i budget di Core Web Vitals e bundle sono verificati;
- [ ] i test della sezione 13 passano negli ambienti concordati;
- [ ] nessuna violazione axe critical/serious resta aperta;
- [ ] gli eventi analytics rispettano il contratto e non generano spam durante le gesture.

---

## 15. Sequenza di implementazione consigliata

1. Definire tipi, validazione e fixture con 0, 1, 2, 7, 12 e 21 immagini.
2. Implementare il rendering responsive statico con `next/image`.
3. Implementare il carousel mobile con scroll snap, observer e controlli.
4. Integrare il dialog fullscreen e la gestione del focus.
5. Implementare `ZoomSurface` con test matematici per scale e limiti.
6. Aggiungere prefetch adiacente e stati loading/error.
7. Collegare eventi tipizzati e adapter analytics esterno.
8. Eseguire audit accessibilità, matrice input e reduced motion.
9. Misurare immagini, bundle e Core Web Vitals; correggere gli scostamenti.
10. Documentare il componente in Storybook con controlli e casi limite, se Storybook è già presente nel progetto.

---

## 16. Definition of Done

- codice TypeScript strict senza errori;
- nessun `any` non motivato;
- API pubblica documentata;
- esempi con una e sette immagini;
- test automatici e manuali completati;
- accessibilità WCAG 2.2 AA verificata;
- performance budget verificato in build di produzione;
- nessuna dipendenza runtime aggiunta senza approvazione;
- comportamento fuori scope non implementato parzialmente;
- review con design per layout, controlli, zoom e stati errore;
- review con sviluppo per contratto dati e boundary Server/Client.

---

## 17. Fonti tecniche

- [Bottega Veneta — Madison Espresso, reference PDP](https://www.bottegaveneta.com/it-it/madison-espresso-876648V6JG02009.html)
- [Next.js — Image Component](https://nextjs.org/docs/app/api-reference/components/image)
- [Next.js — Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [WAI-ARIA Authoring Practices — Modal Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [WCAG 2.2 — Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)
- [WCAG 2.2 — Understanding Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)

---

## 18. Riepilogo esecutivo per il team

La versione 1 è una galleria **image-only** e **prop-driven**. Su mobile usa un carousel nativo con contatore permanente; da tablet in avanti usa una griglia continua a due colonne. Tutte le immagini compaiono prima delle informazioni prodotto. La lightbox offre zoom completo senza loop e carica in alta risoluzione soltanto il media corrente e quelli adiacenti. Il componente non gestisce varianti colore, non legge il CMS e non decide l'ordine editoriale: rende l'array ricevuto così com'è.
