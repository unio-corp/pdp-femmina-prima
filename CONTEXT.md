# Context

Glossario dei concetti di dominio per `pdp-femmina-prima`. Aggiornato lazy quando un termine viene coniato o affinato in una sessione di lavoro.

## Gallery / Lightbox / Zoom

**GestureState** — lo stato che interpreta la topologia dei pointer (uno o due dita, mouse) durante un'interazione sulla `ZoomSurface`: pinch, pan, tap, doppio tap, swipe. Vive come reducer puro in `src/components/gallery/lib/gesture-state.ts` (`dispatch(state, event, transform) => { state, result }`). Non conosce mai lo stage (nessuna nozione di `stageWidth`/`stageSize`/`fittedSize`): riceve coordinate già proiettate in stage-space e restituisce risultati semantici (`pinch-move`, `pan-move`, `drag-end`, `zoom-to`, ecc.) che il chiamante (`ZoomSurface`) traduce in trasformazioni clampate e side effect (DOM, callback verso il parent).

**ZoomTransform** — `{ scale, x, y }`, il modello di trasformazione applicato all'immagine nella `ZoomSurface` (`src/components/gallery/lib/zoom-math.ts`). Origine del sistema di coordinate al centro dello stage.

**ProductGalleryImage** — la forma di un'immagine così come la consuma la gallery (`id`, `src`, `zoomSrc?`, `alt`, `width`, `height` obbligatori). Distinta da `ProductImage` in `src/types/index.ts` (il tipo grezzo del catalogo prodotto); `src/lib/gallery-adapter.ts` è l'adapter tra i due.
