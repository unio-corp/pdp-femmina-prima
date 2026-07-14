'use client';

import type { RecentlyViewedItem } from '@/types';
import { Tabs } from '@/components/ui/Tabs';
import styles from './RecentlyViewed.module.css';

type RecentlyViewedProps = Readonly<{
  items: readonly RecentlyViewedItem[];
}>;

export function RecentlyViewed({ items }: RecentlyViewedProps) {
  const tabItems = [
    {
      label: 'Visti di recente',
      content: (
        <div className={styles.grid}>
          {items.map((item, i) => (
            <div key={i} className={styles.card}>
              <div className={styles.img} style={{ backgroundColor: item.bgColor }} />
              <p className={styles.name}>{item.name}</p>
              <p className={styles.price}>{item.price} €</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      label: 'Potrebbe piacerti anche…',
      content: (
        <div className={styles.grid}>
          {items
            .slice()
            .reverse()
            .map((item, i) => (
              <div key={i} className={styles.card}>
                <div className={styles.img} style={{ backgroundColor: item.bgColor }} />
                <p className={styles.name}>{item.name}</p>
                <p className={styles.price}>{item.price} €</p>
              </div>
            ))}
        </div>
      ),
    },
  ];

  return (
    <section className={styles.section}>
      <Tabs items={tabItems} />
    </section>
  );
}
