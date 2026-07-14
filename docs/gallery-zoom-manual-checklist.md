# ProductGallery — Checklist verifiche manuali su dispositivo reale

Stato: **NON ESEGUITA**.

## Registro sessioni QA

| Data | Tester | Esito | Note |
| --- | --- | --- | --- |
| 2026-07-14 | Agente (sessione automatizzata) | NOT EXECUTED | Nessun dispositivo fisico disponibile alla sessione. Ambiente predisposto e verificato: build di produzione ok, server raggiungibile in LAN (`npm run start`, `http://<IP-locale>:3000`, IP ricavabile con `ipconfig getifaddr en0`). Nessun tunnel pubblico creato. Tutte le voci sotto restano da eseguire su dispositivo reale. |

## Come eseguire la sessione su dispositivo

1. `npm run build && npm run start` sul Mac (porta 3000, solo LAN).
2. Dal dispositivo, stessa rete Wi-Fi: aprire `http://<IP-del-Mac>:3000`.
3. Compilare le sezioni seguenti con PASS / FAIL / BLOCKED / NOT TESTED,
   più dispositivo, versione OS/browser, orientamento, input, passaggi di
   riproduzione, frequenza, eventuale evidenza, tester e data.
4. Al termine: arrestare il server (Ctrl+C). Le voci seguenti non sono automatizzabili in modo
affidabile nell'ambiente CI locale (Playwright non supporta WebKit su
macOS 13; pinch multi-touch reale non simulabile in modo attendibile) e
richiedono dispositivi fisici.

Copertura già garantita dai test automatici: matematica di zoom/pan/pinch e
classificazione gesture (Vitest, 83 test), pulsanti, tastiera, click zoom,
mouse pan, wheel, swipe e double tap sintetici (Playwright Chromium/Firefox).

## Safari iOS (iPhone)

- [ ] Pinch-to-zoom continuo da 1× a 4×; nessun superamento dei limiti.
- [ ] Il punto sotto il midpoint del pinch resta visivamente stabile.
- [ ] Pan con un dito dopo il pinch (scale > 1), senza swipe accidentale.
- [ ] Double tap alterna 1× ↔ 2× centrato sul punto toccato (≤280 ms, ≤24 px).
- [ ] Swipe orizzontale a 1× cambia immagine; nessun loop agli estremi.
- [ ] A scale > 1 lo stesso movimento esegue pan e non cambia immagine.
- [ ] Controlli non coperti dalla notch/home indicator (safe-area inset).
- [ ] Rotazione portrait ↔ landscape: scala conservata, pan ri-limitato, nessun salto.
- [ ] Zoom pagina browser (pinch fuori dal dialog) non in conflitto.
- [ ] Focus/VoiceOver: apertura, controlli zoom annunciati, chiusura con focus return.

## Chrome Android

- [ ] Pinch 1×–4× fluido, midpoint stabile.
- [ ] Pan a scale > 1; clamp ai bordi senza aree vuote.
- [ ] Double tap alterna 1× ↔ 2×.
- [ ] Swipe a 1× naviga; nessuno swipe a scale > 1.
- [ ] pointercancel (es. notifica in arrivo, gesto di sistema): la gesture si
      annulla senza stato incoerente né chiusura del dialog.
- [ ] Cambio rapido di immagine durante il caricamento: reset zoom corretto,
      nessun asset con trasformazione ereditata.
- [ ] Chiusura del dialog durante una gesture attiva: nessun errore console.
- [ ] TalkBack: apertura, controlli zoom e navigazione annunciati, contatore
      "Immagine n di totale", chiusura con focus return.

## iPadOS Safari

- [ ] Touch: pinch, pan, double tap, swipe come sopra.
- [ ] Apple Pencil (se disponibile): tap, double tap, pan a scale > 1.
- [ ] Tastiera hardware: +, -, 0, frecce, Home/End, Escape.
- [ ] Cambio orientamento con lightbox aperta e zoom attivo.
- [ ] Passaggio touch → tastiera → touch senza blocchi.

## Esito

Risultato atteso per ogni voce: comportamento conforme alla spec
(`docs/implementazioni/product-gallery-implementation-spec.md`, §4–§5) senza
errori console, blocchi o stati incoerenti.

| Dispositivo | Versione OS | Browser + versione | Tester | Data | Esito (PASS/FAIL) | Note |
| --- | --- | --- | --- | --- | --- | --- |
| iPhone (Safari iOS) | | | | | | |
| Android (Chrome) | | | | | | |
| iPad (iPadOS Safari) | | | | | | |
