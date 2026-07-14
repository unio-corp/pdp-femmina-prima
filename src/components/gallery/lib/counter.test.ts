import { describe, expect, test } from 'vitest';
import { formatCounter } from './counter';

describe('formatCounter', () => {
  test('no leading zero when total is below 10', () => {
    expect(formatCounter(2, 7)).toBe('3 / 7');
  });

  test('first image of a small collection', () => {
    expect(formatCounter(0, 1)).toBe('1 / 1');
  });

  test('leading zero when total is 10 or more', () => {
    expect(formatCounter(2, 12)).toBe('03 / 12');
  });

  test('no padding needed for two-digit position', () => {
    expect(formatCounter(11, 12)).toBe('12 / 12');
  });

  test('last image of a small collection', () => {
    expect(formatCounter(6, 7)).toBe('7 / 7');
  });

  test('boundary at exactly 10 images', () => {
    expect(formatCounter(0, 10)).toBe('01 / 10');
  });
});
