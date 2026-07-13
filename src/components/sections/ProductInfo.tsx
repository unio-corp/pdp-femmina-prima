'use client';

import { useState } from 'react';
import { PRODUCT } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { Accordion } from '@/components/ui/Accordion';
import styles from './ProductInfo.module.css';

const ACCORDION_ITEMS = [
  { title: 'Dettagli prodotto', content: 'Tela di lana e mohair, revers in seta Intrecciato.' },
  { title: 'Spedizione e resi', content: 'Spedizione gratuita per ordini superiori a 500€.' },
  { title: 'Confezione regalo', content: 'Disponibile confezione regalo con messaggio personalizzato.' },
  { title: 'Scopri in negozio', content: 'Disponibile nei nostri negozi in Italia e Europa.' },
];

export function ProductInfo() {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <span className={styles.tag}>{PRODUCT.tag}</span>
        <h1 className={styles.name}>{PRODUCT.name}</h1>
        <p className={styles.price}>{PRODUCT.price} €</p>
        <p className={styles.color}>Colore: {PRODUCT.color}</p>

        <button className={styles.sizeBtn} onClick={() => setSelectedSize(selectedSize ? null : 'XS')}>
          <span>Seleziona la taglia {selectedSize ? `- ${selectedSize}` : ''}</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <polyline points="6,9 12,15 18,9" />
          </svg>
        </button>

        <a href="#" className={styles.sizeGuide}>
          Tabella taglie
        </a>

        <Button variant="primary">Pre-ordina</Button>
        <Button variant="secondary">Scopri il look</Button>

        <p className={styles.shippingNote}>Data di spedizione stimata a partire dal {PRODUCT.preorderDate}</p>

        <p className={styles.description}>{PRODUCT.description}</p>

        <Accordion items={ACCORDION_ITEMS} />
      </div>
    </section>
  );
}
