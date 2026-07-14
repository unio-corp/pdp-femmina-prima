'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { ProductGalleryImage } from './types';
import { hasValidDimensions } from './lib/validate';
import styles from './ProductGallery.module.css';

type ProductImageTriggerProps = Readonly<{
  image: ProductGalleryImage;
  index: number;
  total: number;
  productName: string;
  isFullSpan: boolean;
  onActivate: (index: number) => void;
  onError: (index: number) => void;
  /** Ref stabile al button: il parent la usa per il focus return della lightbox. */
  buttonRef: (element: HTMLButtonElement | null) => void;
}>;

export function ProductImageTrigger({
  image,
  index,
  total,
  productName,
  isFullSpan,
  onActivate,
  onError,
  buttonRef,
}: ProductImageTriggerProps) {
  const [hasError, setHasError] = useState(false);
  // Dimensioni non valide: mai passate ad aspect-ratio o next/image.
  // L'elemento resta in sequenza con lo stato di errore (numerazione stabile).
  const validDimensions = hasValidDimensions(image);
  const showError = hasError || !validDimensions;

  useEffect(() => {
    if (!validDimensions) onError(index);
    // Segnala al mount: le props sono statiche nella v1. La deduplica
    // dell'evento è a carico del parent (Strict Mode incluso).
  }, []);

  const sizes = isFullSpan ? '100vw' : '(max-width: 767px) 100vw, 50vw';

  return (
    <button
      type="button"
      ref={buttonRef}
      className={styles.trigger}
      style={{
        aspectRatio: validDimensions ? `${image.width} / ${image.height}` : '1 / 1',
      }}
      aria-label={`Apri immagine ${index + 1} di ${total} di ${productName}`}
      onClick={() => onActivate(index)}
    >
      {showError ? (
        <span className={styles.errorState} role="img" aria-label="Immagine non disponibile">
          <svg
            className={styles.errorIcon}
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" />
            <line x1="3" y1="21" x2="21" y2="3" />
          </svg>
          <span className={styles.errorText}>Immagine non disponibile</span>
        </span>
      ) : (
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes={sizes}
          priority={index === 0}
          placeholder={image.blurDataURL ? 'blur' : 'empty'}
          blurDataURL={image.blurDataURL}
          className={styles.image}
          onError={() => {
            setHasError(true);
            onError(index);
          }}
        />
      )}
    </button>
  );
}
