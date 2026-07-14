import { describe, expect, test } from 'vitest';
import {
  MAX_GALLERY_IMAGES,
  hasValidDimensions,
  normalizeInitialIndex,
  validateGalleryImages,
} from './validate';
import type { ProductGalleryImage } from '../types';

function makeImage(overrides: Partial<ProductGalleryImage> = {}): ProductGalleryImage {
  return {
    id: 'img-1',
    src: '/uploads/01.webp',
    alt: 'Vista frontale',
    width: 4000,
    height: 4000,
    ...overrides,
  };
}

function makeImages(count: number): ProductGalleryImage[] {
  return Array.from({ length: count }, (_, i) =>
    makeImage({ id: `img-${i + 1}`, src: `/uploads/${i + 1}.webp` })
  );
}

describe('validateGalleryImages', () => {
  test('accepts a valid collection without issues', () => {
    const result = validateGalleryImages(makeImages(7));

    expect(result.images).toHaveLength(7);
    expect(result.issues).toHaveLength(0);
  });

  test('reports empty collection', () => {
    const result = validateGalleryImages([]);

    expect(result.images).toHaveLength(0);
    expect(result.issues.map((i) => i.code)).toContain('empty');
  });

  test('clamps collections above the maximum and reports too-many', () => {
    const result = validateGalleryImages(makeImages(MAX_GALLERY_IMAGES + 1));

    expect(result.images).toHaveLength(MAX_GALLERY_IMAGES);
    expect(result.issues.map((i) => i.code)).toContain('too-many');
  });

  test('preserves order when clamping', () => {
    const result = validateGalleryImages(makeImages(25));

    expect(result.images[0].id).toBe('img-1');
    expect(result.images[MAX_GALLERY_IMAGES - 1].id).toBe(`img-${MAX_GALLERY_IMAGES}`);
  });

  test('reports duplicate ids without removing entries', () => {
    const images = [makeImage({ id: 'dup' }), makeImage({ id: 'dup', src: '/uploads/02.webp' })];
    const result = validateGalleryImages(images);

    expect(result.images).toHaveLength(2);
    expect(result.issues.map((i) => i.code)).toContain('duplicate-id');
  });

  test('reports non-positive or non-integer dimensions without removing entries', () => {
    const images = [
      makeImage({ id: 'a', width: 0 }),
      makeImage({ id: 'b', height: -10 }),
      makeImage({ id: 'c', width: 100.5 }),
    ];
    const result = validateGalleryImages(images);

    expect(result.images).toHaveLength(3);
    expect(result.issues.filter((i) => i.code === 'invalid-dimensions')).toHaveLength(3);
  });
});

describe('hasValidDimensions', () => {
  test('accetta interi positivi', () => {
    expect(hasValidDimensions({ width: 4000, height: 4000 })).toBe(true);
  });

  test('rifiuta zero, negativi, decimali, NaN e Infinity', () => {
    expect(hasValidDimensions({ width: 0, height: 100 })).toBe(false);
    expect(hasValidDimensions({ width: 100, height: -5 })).toBe(false);
    expect(hasValidDimensions({ width: 100.5, height: 100 })).toBe(false);
    expect(hasValidDimensions({ width: NaN, height: 100 })).toBe(false);
    expect(hasValidDimensions({ width: Infinity, height: 100 })).toBe(false);
  });
});

describe('normalizeInitialIndex', () => {
  test('defaults to 0 when undefined', () => {
    expect(normalizeInitialIndex(undefined, 5)).toBe(0);
  });

  test('keeps in-range values', () => {
    expect(normalizeInitialIndex(3, 5)).toBe(3);
  });

  test('clamps values above the range', () => {
    expect(normalizeInitialIndex(9, 5)).toBe(4);
  });

  test('clamps negative values to 0', () => {
    expect(normalizeInitialIndex(-2, 5)).toBe(0);
  });

  test('truncates non-integer values', () => {
    expect(normalizeInitialIndex(2.7, 5)).toBe(2);
  });

  test('returns 0 for an empty collection', () => {
    expect(normalizeInitialIndex(3, 0)).toBe(0);
  });
});
