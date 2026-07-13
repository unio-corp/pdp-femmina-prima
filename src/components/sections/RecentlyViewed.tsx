'use client';

import { RECENTLY_VIEWED } from '@/lib/constants';
import { Tabs } from '@/components/ui/Tabs';
import styles from './RecentlyViewed.module.css';

const tabItems = [
  {
    label: 'Visti di recente',
    content: (
      <div className={styles.grid}>
        {RECENTLY_VIEWED.map((item, i) => (
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
        {RECENTLY_VIEWED.slice()
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

export function RecentlyViewed() {
  return (
    <section className={styles.section}>
      <Tabs items={tabItems} />
    </section>
  );
}
