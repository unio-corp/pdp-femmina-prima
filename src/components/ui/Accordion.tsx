'use client';

import { useState } from 'react';
import styles from './Accordion.module.css';

export interface AccordionItem {
  title: string;
  content?: string;
}

export interface AccordionProps {
  items: AccordionItem[];
}

export function Accordion({ items }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className={styles.accordion}>
      {items.map((item, i) => (
        <div key={i} className={styles.item}>
          <button
            className={styles.trigger}
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
          >
            <span>{item.title}</span>
            <span className={openIndex === i ? styles.iconOpen : ''}>{openIndex === i ? '−' : '＋'}</span>
          </button>
          {openIndex === i && item.content && <div className={styles.content}>{item.content}</div>}
        </div>
      ))}
    </div>
  );
}
