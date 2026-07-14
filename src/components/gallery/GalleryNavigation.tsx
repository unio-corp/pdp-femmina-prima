'use client';

import styles from './GalleryNavigation.module.css';

/**
 * Puramente presentazionale: nessuna nozione di carousel/lightbox, stato di
 * caricamento o calcolo di limiti. Ogni chiamante calcola i propri booleani/
 * handler/testo (con formatCounter/canNavigate) — condiviso solo il markup
 * icone+bottoni+contatore, prima duplicato tra GalleryNavigation e i
 * controlli inline della lightbox.
 */
type GalleryNavigationProps = Readonly<{
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  counterText: string;
  liveText: string;
  /** Classe di posizionamento del wrapper, dal modulo CSS del chiamante. */
  className: string;
  /** Bordo/focus-ring per sfondi scuri (lightbox). Default: contesto chiaro. */
  onDarkBackground?: boolean;
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

export function GalleryNavigation({
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  counterText,
  liveText,
  className,
  onDarkBackground = false,
}: GalleryNavigationProps) {
  const navButtonClassName = onDarkBackground
    ? `${styles.navButton} ${styles.navButtonOnDark}`
    : styles.navButton;

  return (
    <div className={className}>
      <button
        type="button"
        className={navButtonClassName}
        onClick={onPrev}
        disabled={!canGoPrev}
        aria-label="Immagine precedente"
      >
        <PrevIcon />
      </button>

      <span className={styles.counter} aria-hidden="true">
        {counterText}
      </span>
      <span className={styles.visuallyHidden} aria-live="polite">
        {liveText}
      </span>

      <button
        type="button"
        className={navButtonClassName}
        onClick={onNext}
        disabled={!canGoNext}
        aria-label="Immagine successiva"
      >
        <NextIcon />
      </button>
    </div>
  );
}
