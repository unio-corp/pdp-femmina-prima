'use client';

import { formatCounter } from './lib/counter';
import styles from './ProductGallery.module.css';

type GalleryNavigationProps = Readonly<{
  activeIndex: number;
  total: number;
  onStep: (direction: 1 | -1) => void;
}>;

const PrevIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    aria-hidden="true"
  >
    <polyline points="14,5 7,12 14,19" />
  </svg>
);

const NextIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    aria-hidden="true"
  >
    <polyline points="10,5 17,12 10,19" />
  </svg>
);

export function GalleryNavigation({ activeIndex, total, onStep }: GalleryNavigationProps) {
  return (
    <div className={styles.navigation}>
      <button
        type="button"
        className={styles.navButton}
        onClick={() => onStep(-1)}
        disabled={activeIndex <= 0}
        aria-label="Immagine precedente"
      >
        <PrevIcon />
      </button>

      <span className={styles.counter} aria-hidden="true">
        {formatCounter(activeIndex, total)}
      </span>
      <span className={styles.visuallyHidden} aria-live="polite">
        Immagine {activeIndex + 1} di {total}
      </span>

      <button
        type="button"
        className={styles.navButton}
        onClick={() => onStep(1)}
        disabled={activeIndex >= total - 1}
        aria-label="Immagine successiva"
      >
        <NextIcon />
      </button>
    </div>
  );
}
