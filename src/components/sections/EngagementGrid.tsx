import Image from 'next/image';
import type { EngagementImage } from '@/types';
import styles from './EngagementGrid.module.css';

type EngagementGridProps = Readonly<{
  images: readonly EngagementImage[];
}>;

export function EngagementGrid({ images }: EngagementGridProps) {
  return (
    <section className={styles.grid}>
      {images.map((img, i) => (
        <div key={i} className={`${styles.item} ${img.isFullWidth ? styles.full : ''}`}>
          <Image src={img.src} alt={img.alt} fill className={styles.img} />
        </div>
      ))}
    </section>
  );
}
