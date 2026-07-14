'use client';

import { useState } from 'react';
import type { Product } from '@/types';
import { Button } from '@/components/ui/Button';
import { Accordion } from '@/components/ui/Accordion';
import styles from './ProductInfo.module.css';

const ACCORDION_ITEMS = [
  { title: 'Dettagli prodotto', content: 'Tela di lana e mohair, revers in seta Intrecciato.' },
  { title: 'Spedizione e resi', content: 'Spedizione gratuita per ordini superiori a 500€.' },
  { title: 'Confezione regalo', content: 'Disponibile confezione regalo con messaggio personalizzato.' },
  { title: 'Scopri in negozio', content: 'Disponibile nei nostri negozi in Italia e Europa.' },
];

type ProductInfoProps = Readonly<{
  product: Product;
}>;

export function ProductInfo({ product }: ProductInfoProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <span className={styles.tag}>{product.tag}</span>
        <h1 className={styles.name}>{product.name}</h1>
        <p className={styles.price}>{product.price} €</p>
        <p className={styles.color}>Colore: {product.color}</p>

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

        <p className={styles.shippingNote}>Data di spedizione stimata a partire dal {product.preorderDate}</p>

        <p className={styles.description}>{product.description}</p>

        <Accordion items={ACCORDION_ITEMS} />
      </div>
    </section>
  );
}
