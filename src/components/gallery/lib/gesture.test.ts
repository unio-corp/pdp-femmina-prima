import { describe, expect, test } from 'vitest';
import {
  DOUBLE_TAP_MS,
  DOUBLE_TAP_RADIUS_PX,
  TAP_THRESHOLD_PX,
  getPointerDistance,
  getPointerMidpoint,
  getSwipeDirection,
  getZoomControlsState,
  isDoubleTap,
  isTapMovement,
} from './gesture';

describe('getPointerDistance / getPointerMidpoint', () => {
  test('distanza euclidea', () => {
    expect(getPointerDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBeCloseTo(5);
  });

  test('midpoint', () => {
    expect(getPointerMidpoint({ x: 0, y: 10 }, { x: 20, y: 30 })).toEqual({ x: 10, y: 20 });
  });
});

describe('isTapMovement — soglia 6px', () => {
  test('sotto soglia è tap', () => {
    expect(isTapMovement(3, 4)).toBe(true); // 5px
  });

  test('sopra o uguale alla soglia è drag', () => {
    expect(isTapMovement(6, 0)).toBe(false);
    expect(isTapMovement(5, 5)).toBe(false); // ~7.07px
  });

  test('costante contrattuale', () => {
    expect(TAP_THRESHOLD_PX).toBe(6);
  });
});

describe('isDoubleTap — 280ms / 24px', () => {
  const first = { time: 1000, x: 100, y: 100 };

  test('valido entro tempo e distanza', () => {
    expect(isDoubleTap(first, { time: 1200, x: 110, y: 110 })).toBe(true);
  });

  test('fuori tempo', () => {
    expect(isDoubleTap(first, { time: 1000 + DOUBLE_TAP_MS + 1, x: 100, y: 100 })).toBe(
      false
    );
  });

  test('fuori distanza', () => {
    expect(
      isDoubleTap(first, { time: 1100, x: 100 + DOUBLE_TAP_RADIUS_PX + 1, y: 100 })
    ).toBe(false);
  });

  test('senza tap precedente', () => {
    expect(isDoubleTap(null, first)).toBe(false);
  });
});

describe('getSwipeDirection', () => {
  const STAGE_WIDTH = 1000; // soglia = max(48, 120) = 120

  test('swipe valido verso sinistra → next', () => {
    expect(getSwipeDirection(-200, 20, STAGE_WIDTH)).toBe('next');
  });

  test('swipe valido verso destra → previous', () => {
    expect(getSwipeDirection(200, -30, STAGE_WIDTH)).toBe('previous');
  });

  test('movimento sotto soglia non è swipe', () => {
    expect(getSwipeDirection(100, 0, STAGE_WIDTH)).toBeNull();
  });

  test('soglia minima assoluta 48px su stage stretti', () => {
    expect(getSwipeDirection(-50, 0, 320)).toBe('next'); // soglia = max(48, 38.4)
    expect(getSwipeDirection(-40, 0, 320)).toBeNull();
  });

  test('movimento prevalentemente verticale non è swipe', () => {
    expect(getSwipeDirection(150, 130, STAGE_WIDTH)).toBeNull();
  });

  test('rapporto orizzontale/verticale al limite', () => {
    expect(getSwipeDirection(150, 120, STAGE_WIDTH)).toBe('previous'); // 150 = 120*1.25
  });
});

describe('getZoomControlsState', () => {
  test('a 1×: solo aumenta', () => {
    expect(getZoomControlsState(1, 1, 4)).toEqual({
      canZoomIn: true,
      canZoomOut: false,
      canReset: false,
    });
  });

  test('intermedio: tutto attivo', () => {
    expect(getZoomControlsState(2.5, 1, 4)).toEqual({
      canZoomIn: true,
      canZoomOut: true,
      canReset: true,
    });
  });

  test('a 4×: aumenta disabilitato', () => {
    expect(getZoomControlsState(4, 1, 4)).toEqual({
      canZoomIn: false,
      canZoomOut: true,
      canReset: true,
    });
  });
});
