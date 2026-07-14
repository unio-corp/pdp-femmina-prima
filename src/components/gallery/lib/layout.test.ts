import { describe, expect, test } from 'vitest';
import { isFullSpan } from './layout';

describe('isFullSpan', () => {
  test('single image is full span', () => {
    expect(isFullSpan(0, 1)).toBe(true);
  });

  test('even collections have no full-span cell', () => {
    expect(isFullSpan(0, 2)).toBe(false);
    expect(isFullSpan(1, 2)).toBe(false);
    expect(isFullSpan(11, 12)).toBe(false);
  });

  test('last image of an odd collection is full span', () => {
    expect(isFullSpan(6, 7)).toBe(true);
    expect(isFullSpan(2, 3)).toBe(true);
  });

  test('non-last images of an odd collection are not full span', () => {
    expect(isFullSpan(0, 7)).toBe(false);
    expect(isFullSpan(5, 7)).toBe(false);
  });
});
