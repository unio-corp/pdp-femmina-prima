import { describe, expect, test } from 'vitest';
import {
  canNavigate,
  clampLightboxIndex,
  getAdjacentIndexes,
  lightboxSrc,
  mediaIdAt,
  stepLightboxIndex,
} from './lightbox';
import type { ProductGalleryImage } from '../types';

function makeImage(id: string, zoomSrc?: string): ProductGalleryImage {
  return {
    id,
    src: `/uploads/${id}.webp`,
    zoomSrc,
    alt: id,
    width: 4000,
    height: 4000,
  };
}

describe('clampLightboxIndex', () => {
  test('keeps in-range values', () => {
    expect(clampLightboxIndex(2, 4)).toBe(2);
  });

  test('clamps below zero', () => {
    expect(clampLightboxIndex(-1, 4)).toBe(0);
  });

  test('clamps above the last index', () => {
    expect(clampLightboxIndex(9, 4)).toBe(3);
  });

  test('truncates decimals', () => {
    expect(clampLightboxIndex(1.9, 4)).toBe(1);
  });

  test('returns 0 for an empty collection', () => {
    expect(clampLightboxIndex(3, 0)).toBe(0);
  });
});

describe('stepLightboxIndex — nessun loop', () => {
  test('advances to the next index', () => {
    expect(stepLightboxIndex(1, 1, 4)).toBe(2);
  });

  test('goes back to the previous index', () => {
    expect(stepLightboxIndex(2, -1, 4)).toBe(1);
  });

  test('does not wrap past the last index', () => {
    expect(stepLightboxIndex(3, 1, 4)).toBe(3);
  });

  test('does not wrap before the first index', () => {
    expect(stepLightboxIndex(0, -1, 4)).toBe(0);
  });
});

describe('canNavigate — stato disabled dei controlli', () => {
  test('prev disabled on the first image', () => {
    expect(canNavigate(0, -1, 4)).toBe(false);
  });

  test('next disabled on the last image', () => {
    expect(canNavigate(3, 1, 4)).toBe(false);
  });

  test('both enabled in the middle', () => {
    expect(canNavigate(1, -1, 4)).toBe(true);
    expect(canNavigate(1, 1, 4)).toBe(true);
  });

  test('both disabled with a single image', () => {
    expect(canNavigate(0, -1, 1)).toBe(false);
    expect(canNavigate(0, 1, 1)).toBe(false);
  });
});

describe('getAdjacentIndexes', () => {
  test('first image: only the next one', () => {
    expect(getAdjacentIndexes(0, 4)).toEqual([1]);
  });

  test('middle image: previous and next', () => {
    expect(getAdjacentIndexes(1, 4)).toEqual([0, 2]);
  });

  test('last image: only the previous one', () => {
    expect(getAdjacentIndexes(3, 4)).toEqual([2]);
  });

  test('single image: no adjacents', () => {
    expect(getAdjacentIndexes(0, 1)).toEqual([]);
  });
});

describe('lightboxSrc', () => {
  test('prefers zoomSrc when present', () => {
    expect(lightboxSrc(makeImage('a', '/uploads/a-zoom.jpg'))).toBe('/uploads/a-zoom.jpg');
  });

  test('falls back to src without zoomSrc', () => {
    expect(lightboxSrc(makeImage('b'))).toBe('/uploads/b.webp');
  });
});

describe('mediaIdAt', () => {
  const images = [makeImage('a'), makeImage('b'), makeImage('c')];

  test('returns the id at the index', () => {
    expect(mediaIdAt(images, 1)).toBe('b');
  });

  test('clamps out-of-range indexes', () => {
    expect(mediaIdAt(images, 9)).toBe('c');
    expect(mediaIdAt(images, -1)).toBe('a');
  });

  test('returns empty string for an empty collection', () => {
    expect(mediaIdAt([], 0)).toBe('');
  });
});
