'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ProductGalleryEvent, ProductGalleryProps } from './types';
import { normalizeInitialIndex, validateGalleryImages } from './lib/validate';
import { isFullSpan } from './lib/layout';
import { ProductImageTrigger } from './ProductImageTrigger';
import { GalleryNavigation } from './GalleryNavigation';
import { ProductGalleryLightbox } from './ProductGalleryLightbox';
import styles from './ProductGallery.module.css';

const MOBILE_QUERY = '(max-width: 767px)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
// Soglia di visibilità oltre la quale una slide diventa quella attiva (spec §4.2).
const ACTIVE_SLIDE_THRESHOLD = 0.6;

export function ProductGallery({
  images,
  productName,
  initialIndex,
  className,
  onEvent,
}: ProductGalleryProps) {
  const { images: validImages, issues } = useMemo(
    () => validateGalleryImages(images),
    [images]
  );

  const [activeIndex, setActiveIndex] = useState(() =>
    normalizeInitialIndex(initialIndex, validImages.length)
  );
  // null = lightbox chiusa; l'indice richiesto diventa l'initialIndex del dialog.
  const [requestedLightboxIndex, setRequestedLightboxIndex] = useState<number | null>(null);
  // Trigger che ha aperto la lightbox: destinatario del focus return,
  // invariante rispetto alla navigazione interna al dialog.
  const openerIndexRef = useRef<number | null>(null);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // Marker post-idratazione: i controlli richiedono JavaScript attivo e i
  // test E2E attendono questo attributo prima di interagire.
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => setIsHydrated(true), []);

  const listRef = useRef<HTMLUListElement>(null);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;
  // Metodo dell'azione utente in corso: consumato dall'observer per
  // distinguere button/keyboard dallo swipe nativo.
  const pendingMethodRef = useRef<'button' | 'keyboard' | null>(null);
  // Destinazione di uno scroll da pulsante ancora in corso: consente
  // pressioni rapide consecutive senza attendere la stabilizzazione
  // dell'observer (che resta l'unica fonte di activeIndex).
  const pendingTargetRef = useRef<number | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const emit = useCallback((event: ProductGalleryEvent) => {
    onEventRef.current?.(event);
  }, []);

  useEffect(() => {
    if (issues.length === 0) return;
    if (process.env.NODE_ENV !== 'production') {
      for (const issue of issues) console.error(issue.message);
    } else if (issues.some((issue) => issue.code === 'too-many')) {
      console.error('ProductGallery: raccolta oltre il limite, troncata a 20 immagini.');
    }
  }, [issues]);

  // Observer del carousel attivo solo sotto il breakpoint mobile.
  useEffect(() => {
    if (validImages.length <= 1) return;

    const mql = window.matchMedia(MOBILE_QUERY);
    let observer: IntersectionObserver | null = null;

    const setup = () => {
      const list = listRef.current;
      if (!list || observer) return;

      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.intersectionRatio < ACTIVE_SLIDE_THRESHOLD) continue;

            const nextIndex = Number((entry.target as HTMLElement).dataset.index);
            const prevIndex = activeIndexRef.current;
            if (Number.isNaN(nextIndex) || nextIndex === prevIndex) continue;

            setActiveIndex(nextIndex);
            emit({
              type: 'navigate',
              from: prevIndex,
              to: nextIndex,
              method: pendingMethodRef.current ?? 'swipe',
            });
            if (pendingTargetRef.current === nextIndex) {
              pendingMethodRef.current = null;
              pendingTargetRef.current = null;
            } else if (pendingTargetRef.current === null) {
              pendingMethodRef.current = null;
            }
          }
        },
        { root: list, threshold: ACTIVE_SLIDE_THRESHOLD }
      );

      for (const slide of list.querySelectorAll('li')) observer.observe(slide);
    };

    const teardown = () => {
      observer?.disconnect();
      observer = null;
      // Nessun target o metodo pendente deve sopravvivere al cambio breakpoint.
      pendingTargetRef.current = null;
      pendingMethodRef.current = null;
    };

    const onBreakpointChange = () => {
      if (mql.matches) {
        setup();
      } else {
        teardown();
      }
    };

    onBreakpointChange();
    mql.addEventListener('change', onBreakpointChange);

    return () => {
      mql.removeEventListener('change', onBreakpointChange);
      teardown();
    };
  }, [validImages.length, emit]);

  const step = useCallback((direction: 1 | -1) => {
    const list = listRef.current;
    if (!list) return;

    const slides = list.querySelectorAll<HTMLElement>('li');
    const base = pendingTargetRef.current ?? activeIndexRef.current;
    const target = Math.min(Math.max(base + direction, 0), slides.length - 1);
    if (target === base) return;

    pendingMethodRef.current = 'button';
    pendingTargetRef.current = target;
    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;
    // Scroll solo orizzontale sul contenitore: scrollIntoView potrebbe
    // spostare verticalmente la pagina.
    list.scrollTo({
      left: slides[target].offsetLeft,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }, []);

  // Apertura lightbox: memorizza indice richiesto e trigger di origine.
  // L'evento `open` è emesso dalla lightbox solo dopo showModal() reale.
  const requestLightbox = useCallback((index: number) => {
    openerIndexRef.current = index;
    setRequestedLightboxIndex(index);
  }, []);

  const handleLightboxClose = useCallback(() => {
    setRequestedLightboxIndex(null);
    const opener = openerIndexRef.current;
    openerIndexRef.current = null;
    if (opener !== null) triggerRefs.current[opener]?.focus();
  }, []);

  // Deduplica per indice: onError di next/image e la segnalazione di
  // dimensioni non valide non devono emettere due volte (Strict Mode incluso).
  const inlineErrorEmittedRef = useRef(new Set<number>());
  const reportInlineError = useCallback(
    (index: number) => {
      if (inlineErrorEmittedRef.current.has(index)) return;
      inlineErrorEmittedRef.current.add(index);
      emit({ type: 'error', index, mediaId: validImages[index].id, source: 'inline' });
    },
    [emit, validImages]
  );

  if (validImages.length === 0) return null;

  const total = validImages.length;

  return (
    <section
      className={className ? `${styles.gallery} ${className}` : styles.gallery}
      aria-label={`Immagini di ${productName}`}
      data-hydrated={isHydrated || undefined}
    >
      <ul className={styles.viewport} ref={listRef}>
        {validImages.map((image, index) => (
          <li
            // Chiave interna tollerante agli id duplicati (che la validazione
            // segnala ma non rimuove); il mediaId pubblico resta image.id.
            key={`${image.id}-${index}`}
            data-index={index}
            className={
              isFullSpan(index, total)
                ? `${styles.slide} ${styles.slideFullSpan}`
                : styles.slide
            }
          >
            <ProductImageTrigger
              image={image}
              index={index}
              total={total}
              productName={productName}
              isFullSpan={isFullSpan(index, total)}
              onActivate={requestLightbox}
              onError={reportInlineError}
              buttonRef={(element) => {
                triggerRefs.current[index] = element;
              }}
            />
          </li>
        ))}
      </ul>

      {total > 1 && (
        <GalleryNavigation activeIndex={activeIndex} total={total} onStep={step} />
      )}

      {requestedLightboxIndex !== null && (
        <ProductGalleryLightbox
          images={validImages}
          productName={productName}
          initialIndex={requestedLightboxIndex}
          onEvent={emit}
          onClose={handleLightboxClose}
        />
      )}
    </section>
  );
}
