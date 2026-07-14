import type { DuoCtaContent } from '@/types';
import styles from './DuoCTA.module.css';

type DuoCTAProps = Readonly<{
  content: DuoCtaContent;
}>;

export function DuoCTA({ content }: DuoCTAProps) {
  return (
    <section className={styles.duoRow}>
      <div className={`${styles.card} ${styles.light}`}>
        <div className={styles.label}>{content.left.label}</div>
      </div>
      <div className={`${styles.card} ${styles.dark}`}>
        <div className={styles.label}>{content.right.label}</div>
        <div className={styles.price}>{content.right.price}</div>
      </div>
    </section>
  );
}
