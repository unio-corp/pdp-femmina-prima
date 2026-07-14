import type { Product } from '@/types';
import styles from './StickyBar.module.css';

type StickyBarProps = Readonly<{
  product: Pick<Product, 'name' | 'price'>;
  ctaLabel: string;
}>;

export function StickyBar({ product, ctaLabel }: StickyBarProps) {
  return (
    <div className={styles.stickyBar}>
      <span className={styles.sbName}>{product.name}</span>
      <span className={styles.sbPrice}>
        {product.price} €
      </span>
      <button className={styles.sbCta}>{ctaLabel}</button>
    </div>
  );
}
