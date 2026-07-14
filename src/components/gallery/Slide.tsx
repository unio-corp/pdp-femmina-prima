'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';
import type { ProductGalleryImage } from './types';
import { ProductImageTrigger } from './ProductImageTrigger';
import styles from './ProductGallery.module.css';

/**
 * Interfaccia stretta verso il genitore: nessun nodo DOM grezzo esposto.
 * `getOffsetLeft` sostituisce la lettura diretta di `.offsetLeft` via
 * `querySelectorAll('li')` in ProductGallery.step(); `focus` sostituisce
 * l'array di ref bottone (`triggerRefs`) usato per il focus-return della
 * lightbox.
 */
export type SlideHandle = Readonly<{
  getOffsetLeft: () => number;
  focus: () => void;
}>;

type SlideProps = Readonly<{
  image: ProductGalleryImage;
  index: number;
  total: number;
  productName: string;
  isFullSpan: boolean;
  onActivate: (index: number) => void;
  onError: (index: number) => void;
}>;

export const Slide = forwardRef<SlideHandle, SlideProps>(function Slide(
  { image, index, total, productName, isFullSpan, onActivate, onError },
  ref
) {
  const liRef = useRef<HTMLLIElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useImperativeHandle(
    ref,
    () => ({
      getOffsetLeft: () => liRef.current?.offsetLeft ?? 0,
      focus: () => triggerRef.current?.focus(),
    }),
    []
  );

  return (
    <li
      ref={liRef}
      // Chiave/indice interno tollerante agli id duplicati (che la
      // validazione segnala ma non rimuove); il mediaId pubblico resta
      // image.id. Letto dall'IntersectionObserver del genitore, che deve
      // osservare nodi Element reali (vincolo dell'API, non un leak).
      data-index={index}
      className={isFullSpan ? `${styles.slide} ${styles.slideFullSpan}` : styles.slide}
    >
      <ProductImageTrigger
        ref={triggerRef}
        image={image}
        index={index}
        total={total}
        productName={productName}
        isFullSpan={isFullSpan}
        onActivate={onActivate}
        onError={onError}
      />
    </li>
  );
});
