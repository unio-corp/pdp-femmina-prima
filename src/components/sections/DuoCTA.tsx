import { DUO_CTA } from '@/lib/constants';
import styles from './DuoCTA.module.css';

export function DuoCTA() {
  return (
    <section className={styles.duoRow}>
      <div className={`${styles.card} ${styles.light}`}>
        <div className={styles.label}>{DUO_CTA.left.label}</div>
      </div>
      <div className={`${styles.card} ${styles.dark}`}>
        <div className={styles.label}>{DUO_CTA.right.label}</div>
        <div className={styles.price}>{DUO_CTA.right.price}</div>
      </div>
    </section>
  );
}
