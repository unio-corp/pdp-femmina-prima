'use client';

import Image from 'next/image';
import { useGallery } from '@/hooks/useGallery';
import { PRODUCT } from '@/lib/constants';
import styles from './ProductGallery.module.css';

const ArrowIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
    <polyline points="14,5 7,12 14,19" />
  </svg>
);

const ArrowNextIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
    <polyline points="10,5 17,12 10,19" />
  </svg>
);

export function ProductGallery() {
  const { galleryRef, showPrev, showNext, step } = useGallery(PRODUCT.images.length);

  return (
    <section className={styles.galleryWrap}>
      <ul className={styles.gallery} ref={galleryRef}>
        {PRODUCT.images.map((img, i) => (
          <li key={i}>
            <div className={styles.ph}>
              <Image src={img.src} alt={img.alt} fill sizes="100vw" priority={i === 0} />
            </div>
          </li>
        ))}
      </ul>

      {showPrev && (
        <button
          className={`${styles.arrow} ${styles.prev}`}
          onClick={() => step(-1)}
          aria-label="Immagine precedente"
        >
          <ArrowIcon />
        </button>
      )}

      {showNext && (
        <button
          className={`${styles.arrow} ${styles.next}`}
          onClick={() => step(1)}
          aria-label="Immagine successiva"
        >
          <ArrowNextIcon />
        </button>
      )}
    </section>
  );
}
