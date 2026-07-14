import { describe, expect, test } from 'vitest';
import { mapProductImages } from './gallery-adapter';
import type { Product } from '@/types';

const product: Product = {
  id: 'jacket-001',
  name: 'Giacca in mohair e lana',
  price: 4200,
  color: 'Double black',
  description: 'Descrizione',
  tag: 'Novità',
  preorderDate: '18 settembre',
  images: [
    { src: '/uploads/01-model.webp', alt: 'Vista frontale', format: 'webp' },
    { src: '/uploads/02-model.webp', alt: 'Vista laterale', format: 'webp' },
  ],
};

describe('mapProductImages', () => {
  test('maps legacy images to the gallery contract preserving order', () => {
    const result = mapProductImages(product);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 'jacket-001-media-1',
      src: '/uploads/01-model.webp',
      zoomSrc: '/uploads/01-zoom.jpg',
      alt: 'Vista frontale',
      width: 4000,
      height: 4000,
    });
    expect(result[1].id).toBe('jacket-001-media-2');
  });

  test('omits zoomSrc when no zoom asset exists', () => {
    const withUnknown: Product = {
      ...product,
      images: [{ src: '/uploads/04-model.webp', alt: 'Dettaglio', format: 'webp' }],
    };

    expect(mapProductImages(withUnknown)[0].zoomSrc).toBeUndefined();
  });

  test('generates stable unique ids', () => {
    const result = mapProductImages(product);
    const ids = new Set(result.map((image) => image.id));

    expect(ids.size).toBe(result.length);
    expect(mapProductImages(product)).toEqual(result);
  });
});
