'use client';

import { ReactNode, useState } from 'react';
import styles from './Tabs.module.css';

export interface TabItem {
  label: string;
  content: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultIndex?: number;
}

export function Tabs({ items, defaultIndex = 0 }: TabsProps) {
  const [activeIndex, setActiveIndex] = useState(defaultIndex);

  return (
    <div className={styles.tabs}>
      <div className={styles.list}>
        {items.map((item, i) => (
          <button
            key={i}
            className={`${styles.tab} ${activeIndex === i ? styles.active : ''}`}
            onClick={() => setActiveIndex(i)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className={styles.content}>{items[activeIndex].content}</div>
    </div>
  );
}
