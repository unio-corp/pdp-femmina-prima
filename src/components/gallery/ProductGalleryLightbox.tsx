'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { ProductGalleryEvent, ProductGalleryImage } from './types';
import {
  canNavigate,
  clampLightboxIndex,
  getAdjacentIndexes,
  lightboxSrc,
  stepLightboxIndex,
} from './lib/lightbox';
import { formatCounter } from './lib/counter';
import { getZoomControlsState } from './lib/gesture';
import { MAX_SCALE, MIN_SCALE } from './lib/zoom-math';
import { ZoomSurface, type ZoomMethod, type ZoomSurfaceHandle } from './ZoomSurface';
import { GalleryNavigation } from './GalleryNavigation';
import styles from './ProductGalleryLightbox.module.css';

type CloseReason = 'button' | 'escape' | 'backdrop' | 'native';

type ProductGalleryLightboxProps = Readonly<{
  images: readonly ProductGalleryImage[];
  productName: string;
  initialIndex: number;
  onEvent: (event: ProductGalleryEvent) => void;
  onClose: () => void;
}>;

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

// Un tap resta tale sotto questa soglia di movimento (spec §5.3).
const TAP_THRESHOLD_PX = 6;

type BodyScrollLock = Readonly<{
  scrollY: number;
  overflow: string;
  paddingRight: string;
}>;

// overflow: hidden non tocca la posizione di scroll (nessun ripristino
// fragile); il padding compensa la scomparsa della scrollbar.
function lockBodyScroll(): BodyScrollLock {
  const { body } = document;
  const saved: BodyScrollLock = {
    scrollY: window.scrollY,
    overflow: body.style.overflow,
    paddingRight: body.style.paddingRight,
  };

  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  body.style.overflow = 'hidden';
  if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

  return saved;
}

function unlockBodyScroll(saved: BodyScrollLock): void {
  const { body } = document;
  body.style.overflow = saved.overflow;
  body.style.paddingRight = saved.paddingRight;
  // La posizione non viene alterata dal lock; ripristino difensivo.
  if (window.scrollY !== saved.scrollY) window.scrollTo(0, saved.scrollY);
}

const ZoomInIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    aria-hidden="true"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ZoomOutIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    aria-hidden="true"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ResetZoomIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    aria-hidden="true"
  >
    <polyline points="4,9 4,4 9,4" />
    <polyline points="20,15 20,20 15,20" />
    <line x1="4" y1="4" x2="10" y2="10" />
    <line x1="20" y1="20" x2="14" y2="14" />
  </svg>
);

const CloseIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    aria-hidden="true"
  >
    <line x1="5" y1="5" x2="19" y2="19" />
    <line x1="19" y1="5" x2="5" y2="19" />
  </svg>
);

export function ProductGalleryLightbox({
  images,
  productName,
  initialIndex,
  onEvent,
  onClose,
}: ProductGalleryLightboxProps) {
  const total = images.length;
  const [lightboxIndex, setLightboxIndex] = useState(() =>
    clampLightboxIndex(initialIndex, total)
  );
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('loading');
  // Scala stabilizzata (commit): guida controlli zoom e stato accessibile.
  const [committedScale, setCommittedScale] = useState(1);
  const [reducedMotion, setReducedMotion] = useState(false);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const zoomSurfaceRef = useRef<ZoomSurfaceHandle>(null);
  const titleId = useId();

  const lightboxIndexRef = useRef(lightboxIndex);
  lightboxIndexRef.current = lightboxIndex;
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Guardie contro doppie emissioni (Strict Mode, cancel + close nativi).
  const openEmittedRef = useRef(false);
  const closeEmittedRef = useRef(false);
  // Il cleanup dell'effect di apertura chiude il dialog (Strict Mode smonta
  // e rimonta): quel close nativo non è una chiusura utente.
  const isEffectCleanupRef = useRef(false);
  const errorEmittedRef = useRef(new Set<number>());
  const prefetchedRef = useRef(new Set<string>());
  const prefetchImagesRef = useRef<HTMLImageElement[]>([]);

  // ZoomSurface la imposta (via onSignificantInteraction) durante pan/pinch
  // per invalidare la chiusura da backdrop.
  const didPointerInteractRef = useRef(false);
  const backdropPointerRef = useRef<{ x: number; y: number; onBackdrop: boolean } | null>(
    null
  );

  const handleSignificantInteraction = useCallback(() => {
    didPointerInteractRef.current = true;
  }, []);

  const closeLightbox = useCallback((reason: CloseReason) => {
    if (closeEmittedRef.current) return;
    closeEmittedRef.current = true;

    const index = lightboxIndexRef.current;
    onEventRef.current({
      type: 'close',
      index,
      mediaId: images[index]?.id ?? '',
    });

    const dialog = dialogRef.current;
    if (reason !== 'native' && dialog?.open) dialog.close();
    onCloseRef.current();
  }, [images]);

  // Apertura reale: showModal() dopo il mount, poi emissione open e focus
  // sul pulsante chiudi. Scroll lock legato allo stesso ciclo di vita.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    let lock: BodyScrollLock | null = null;
    isEffectCleanupRef.current = false;

    if (!dialog.open) {
      try {
        dialog.showModal();
      } catch (error) {
        console.error('ProductGalleryLightbox: showModal() non riuscito.', error);
        const index = lightboxIndexRef.current;
        onEventRef.current({
          type: 'error',
          index,
          mediaId: images[index]?.id ?? '',
          source: 'lightbox',
        });
        onCloseRef.current();
        return;
      }
    }

    lock = lockBodyScroll();

    if (!openEmittedRef.current) {
      openEmittedRef.current = true;
      const index = lightboxIndexRef.current;
      onEventRef.current({
        type: 'open',
        index,
        mediaId: images[index]?.id ?? '',
      });
    }
    closeButtonRef.current?.focus();

    return () => {
      isEffectCleanupRef.current = true;
      if (lock) unlockBodyScroll(lock);
      if (dialog.open) dialog.close();
    };
    // Solo al mount: l'apertura non deve ripetersi sui re-render.
  }, []);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);

  // Prefetch delle sole adiacenti, dopo il load dell'immagine corrente.
  useEffect(() => {
    if (loadStatus !== 'ready') return;

    for (const adjacentIndex of getAdjacentIndexes(lightboxIndex, total)) {
      const src = lightboxSrc(images[adjacentIndex]);
      if (prefetchedRef.current.has(src)) continue;
      prefetchedRef.current.add(src);

      const prefetchImage = new Image();
      prefetchImage.src = src;
      prefetchImagesRef.current.push(prefetchImage);
    }
  }, [loadStatus, lightboxIndex, total, images]);

  useEffect(() => {
    const prefetched = prefetchImagesRef.current;
    return () => {
      // Sgancia i riferimenti e invalida le callback obsolete; un download
      // già avviato dalla rete non è necessariamente annullabile.
      for (const prefetchImage of prefetched) prefetchImage.src = '';
      prefetched.length = 0;
    };
  }, []);

  const navigate = useCallback(
    (to: number, method: 'button' | 'keyboard' | 'swipe') => {
      const from = lightboxIndexRef.current;
      const target = clampLightboxIndex(to, total);
      if (target === from) return;

      setLightboxIndex(target);
      setLoadStatus('loading');
      // Reset automatico dello zoom al cambio immagine (la ZoomSurface è
      // rimontata via key): nessun evento zoom per questo reset.
      setCommittedScale(1);
      onEventRef.current({ type: 'navigate', from, to: target, method });
    },
    [total]
  );

  const handleZoomCommit = useCallback((scale: number, method: ZoomMethod) => {
    setCommittedScale(scale);
    const index = lightboxIndexRef.current;
    onEventRef.current({ type: 'zoom', index, scale, method });
  }, []);

  const handleSwipeNavigate = useCallback(
    (direction: 'previous' | 'next') => {
      const index = lightboxIndexRef.current;
      navigate(stepLightboxIndex(index, direction === 'next' ? 1 : -1, total), 'swipe');
    },
    [navigate, total]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDialogElement>) => {
      // Non interferire con scorciatoie browser o combinazioni con Alt.
      if (event.altKey || event.ctrlKey || event.metaKey) return;

      const index = lightboxIndexRef.current;
      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          navigate(stepLightboxIndex(index, 1, total), 'keyboard');
          break;
        case 'ArrowLeft':
          event.preventDefault();
          navigate(stepLightboxIndex(index, -1, total), 'keyboard');
          break;
        case 'Home':
          event.preventDefault();
          navigate(0, 'keyboard');
          break;
        case 'End':
          event.preventDefault();
          navigate(total - 1, 'keyboard');
          break;
        case '+':
        case '=':
          event.preventDefault();
          zoomSurfaceRef.current?.zoomIn('keyboard');
          break;
        case '-':
          event.preventDefault();
          zoomSurfaceRef.current?.zoomOut('keyboard');
          break;
        case '0':
          event.preventDefault();
          zoomSurfaceRef.current?.reset('keyboard');
          break;
      }
    },
    [navigate, total]
  );

  // Chiusura da backdrop: pointerdown e pointerup entrambi sul dialog,
  // movimento sotto soglia, nessuna interazione interna intercorsa.
  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDialogElement>) => {
    const onBackdrop = event.target === event.currentTarget;
    backdropPointerRef.current = { x: event.clientX, y: event.clientY, onBackdrop };
    // Reset solo per pointerdown che originano davvero sul backdrop: un
    // pointerdown che risale da un elemento interno (es. il secondo dito
    // di un pinch sulla ZoomSurface) non deve azzerare il flag e correre
    // contro onSignificantInteraction che lo imposta a true nello stesso evento.
    if (onBackdrop) didPointerInteractRef.current = false;
  }, []);

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDialogElement>) => {
      const start = backdropPointerRef.current;
      backdropPointerRef.current = null;
      if (!start?.onBackdrop) return;
      if (event.target !== event.currentTarget) return;
      if (didPointerInteractRef.current) return;

      const distance = Math.hypot(event.clientX - start.x, event.clientY - start.y);
      if (distance >= TAP_THRESHOLD_PX) return;

      closeLightbox('backdrop');
    },
    [closeLightbox]
  );

  const handlePointerCancel = useCallback(() => {
    backdropPointerRef.current = null;
  }, []);

  const currentImage = images[lightboxIndex];
  const currentSrc = lightboxSrc(currentImage);
  const zoomControls = getZoomControlsState(committedScale, MIN_SCALE, MAX_SCALE);
  const zoomPercent = Math.round(committedScale * 100);

  return (
    <dialog
      ref={dialogRef}
      className={styles.lightbox}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Escape: passa dalla chiusura centralizzata.
        event.preventDefault();
        closeLightbox('escape');
      }}
      onClose={() => {
        // Chiusura nativa non intercettata: nessuna seconda emissione.
        // Il close event è accodato in modo asincrono: ignora quelli del
        // cleanup Strict Mode (flag) e quelli obsoleti arrivati dopo che
        // showModal() ha già riaperto il dialog.
        if (isEffectCleanupRef.current) return;
        if (dialogRef.current?.open) return;
        closeLightbox('native');
      }}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <h2 id={titleId} className={styles.visuallyHidden}>
        Galleria immagini di {productName}
      </h2>

      <button
        type="button"
        ref={closeButtonRef}
        className={styles.closeButton}
        aria-label="Chiudi galleria"
        onClick={() => closeLightbox('button')}
      >
        <CloseIcon />
      </button>

      <figure className={styles.stage}>
        {loadStatus === 'error' ? (
          <span className={styles.errorState} role="img" aria-label="Immagine non disponibile">
            <span className={styles.errorText}>Immagine non disponibile</span>
          </span>
        ) : (
          <ZoomSurface
            key={currentImage.id}
            ref={zoomSurfaceRef}
            src={currentSrc}
            alt={currentImage.alt}
            reducedMotion={reducedMotion}
            onSignificantInteraction={handleSignificantInteraction}
            onLoad={() => {
              if (lightboxIndexRef.current === lightboxIndex) setLoadStatus('ready');
            }}
            onError={() => {
              if (lightboxIndexRef.current !== lightboxIndex) return;
              setLoadStatus('error');
              if (!errorEmittedRef.current.has(lightboxIndex)) {
                errorEmittedRef.current.add(lightboxIndex);
                onEventRef.current({
                  type: 'error',
                  index: lightboxIndex,
                  mediaId: currentImage.id,
                  source: 'lightbox',
                });
              }
            }}
            onNavigate={handleSwipeNavigate}
            onZoomCommit={handleZoomCommit}
          />
        )}
        {loadStatus === 'loading' && (
          <span className={styles.loadingIndicator} aria-hidden="true" />
        )}
      </figure>

      <div className={styles.zoomControls}>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => zoomSurfaceRef.current?.zoomOut('button')}
          disabled={!zoomControls.canZoomOut}
          aria-label="Riduci zoom"
        >
          <ZoomOutIcon />
        </button>
        <span className={styles.counter} aria-hidden="true">
          {zoomPercent}%
        </span>
        <span className={styles.visuallyHidden} aria-live="polite">
          Zoom {zoomPercent}%
        </span>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => zoomSurfaceRef.current?.zoomIn('button')}
          disabled={!zoomControls.canZoomIn}
          aria-label="Aumenta zoom"
        >
          <ZoomInIcon />
        </button>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => zoomSurfaceRef.current?.reset('button')}
          disabled={!zoomControls.canReset}
          aria-label="Ripristina zoom"
        >
          <ResetZoomIcon />
        </button>
      </div>

      <GalleryNavigation
        className={styles.controls}
        onDarkBackground
        canGoPrev={canNavigate(lightboxIndex, -1, total)}
        canGoNext={canNavigate(lightboxIndex, 1, total)}
        onPrev={() => navigate(stepLightboxIndex(lightboxIndex, -1, total), 'button')}
        onNext={() => navigate(stepLightboxIndex(lightboxIndex, 1, total), 'button')}
        counterText={formatCounter(lightboxIndex, total)}
        liveText={
          loadStatus === 'loading'
            ? `Caricamento immagine ${lightboxIndex + 1} di ${total}`
            : `Immagine ${lightboxIndex + 1} di ${total}`
        }
      />
    </dialog>
  );
}
