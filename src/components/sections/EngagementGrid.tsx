import Image from 'next/image';
import { ENGAGEMENT_IMAGES } from '@/lib/constants';
import styles from './EngagementGrid.module.css';

export function EngagementGrid() {
  return (
    <section className={styles.grid}>
      {ENGAGEMENT_IMAGES.map((img, i) => (
        <div key={i} className={`${styles.item} ${img.isFullWidth ? styles.full : ''}`}>
          <Image src={img.src} alt={img.alt} fill className={styles.img} />
        </div>
      ))}
    </section>
  );
}
