import { PRODUCT, STICKY_BAR_CTA } from '@/lib/constants';
import styles from './StickyBar.module.css';

export function StickyBar() {
  return (
    <div className={styles.stickyBar}>
      <span className={styles.sbName}>{PRODUCT.name}</span>
      <span className={styles.sbPrice}>
        {PRODUCT.price} €
      </span>
      <button className={styles.sbCta}>{STICKY_BAR_CTA}</button>
    </div>
  );
}
