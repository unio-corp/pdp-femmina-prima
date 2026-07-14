import { describe, expect, test } from 'vitest';
import {
  IDENTITY_TRANSFORM,
  MAX_SCALE,
  MIN_SCALE,
  SCALE_STEP,
  clampScale,
  clampTranslation,
  getContainedImageSize,
  getPanBounds,
  getPointInImageSpace,
  zoomAroundPoint,
} from './zoom-math';

const STAGE = { width: 1000, height: 800 };

describe('clampScale', () => {
  test('limita sotto il minimo', () => {
    expect(clampScale(0.5)).toBe(1);
  });

  test('limita sopra il massimo', () => {
    expect(clampScale(5.2)).toBe(4);
  });

  test('mantiene valori validi', () => {
    expect(clampScale(2.5)).toBe(2.5);
  });

  test('step contrattuale 0.5 tra 1 e 4', () => {
    expect(SCALE_STEP).toBe(0.5);
    expect(clampScale(MIN_SCALE + SCALE_STEP)).toBe(1.5);
    expect(clampScale(MAX_SCALE + SCALE_STEP)).toBe(4);
  });
});

describe('getContainedImageSize', () => {
  test('landscape limitato dalla larghezza', () => {
    const fitted = getContainedImageSize(STAGE, { width: 2000, height: 1000 });
    expect(fitted.width).toBeCloseTo(1000);
    expect(fitted.height).toBeCloseTo(500);
  });

  test('portrait limitato dall’altezza', () => {
    const fitted = getContainedImageSize(STAGE, { width: 900, height: 1125 });
    expect(fitted.height).toBeCloseTo(800);
    expect(fitted.width).toBeCloseTo(640);
  });

  test('quadrata in stage landscape', () => {
    const fitted = getContainedImageSize(STAGE, { width: 4000, height: 4000 });
    expect(fitted.width).toBeCloseTo(800);
    expect(fitted.height).toBeCloseTo(800);
  });

  test('dimensioni non valide → zero', () => {
    expect(getContainedImageSize(STAGE, { width: 0, height: 100 })).toEqual({
      width: 0,
      height: 0,
    });
  });
});

describe('getPanBounds / clampTranslation', () => {
  const fitted = { width: 800, height: 800 };

  test('a scala 1 nessun margine di pan', () => {
    const bounds = getPanBounds(fitted, STAGE, 1);
    expect(bounds.maxX).toBe(0);
    expect(bounds.maxY).toBe(0);

    const clamped = clampTranslation({ scale: 1, x: 120, y: -80 }, bounds);
    expect(clamped.x).toBe(0);
    expect(clamped.y).toBe(0);
  });

  test('immagine scalata più larga dello stage: pan orizzontale limitato', () => {
    const bounds = getPanBounds({ width: 1000, height: 500 }, STAGE, 2);
    expect(bounds.maxX).toBeCloseTo(500);
    expect(bounds.maxY).toBeCloseTo(100);

    const clamped = clampTranslation({ scale: 2, x: 900, y: -900 }, bounds);
    expect(clamped.x).toBeCloseTo(500);
    expect(clamped.y).toBeCloseTo(-100);
  });

  test('immagine scalata più alta dello stage: pan verticale limitato', () => {
    const bounds = getPanBounds({ width: 640, height: 800 }, STAGE, 2);
    expect(bounds.maxY).toBeCloseTo(400);
    expect(bounds.maxX).toBeCloseTo(140);
  });

  test('asse più piccolo dello stage resta centrato', () => {
    // 800 * 1.2 = 960 < 1000: nessun pan orizzontale consentito.
    const bounds = getPanBounds(fitted, STAGE, 1.2);
    expect(bounds.maxX).toBe(0);
    expect(bounds.maxY).toBeCloseTo((800 * 1.2 - 800) / 2);
  });
});

describe('zoomAroundPoint', () => {
  const fitted = { width: 800, height: 800 };

  test('zoom intorno al centro non trasla', () => {
    const next = zoomAroundPoint(IDENTITY_TRANSFORM, 2, { x: 0, y: 0 }, fitted, STAGE);
    expect(next.scale).toBe(2);
    expect(next.x).toBeCloseTo(0);
    expect(next.y).toBeCloseTo(0);
  });

  test('zoom intorno a un punto non centrale mantiene stabile il focal point', () => {
    const focal = { x: 200, y: -100 };
    const next = zoomAroundPoint(IDENTITY_TRANSFORM, 2, focal, fitted, STAGE);

    // Il punto immagine sotto il focal deve riproiettarsi sul focal.
    const imagePoint = getPointInImageSpace(focal, IDENTITY_TRANSFORM);
    expect(imagePoint.x * next.scale + next.x).toBeCloseTo(focal.x, 5);
    expect(imagePoint.y * next.scale + next.y).toBeCloseTo(focal.y, 5);
  });

  test('stabilità del focal point su zoom incrementali', () => {
    const focal = { x: -150, y: 120 };
    const step1 = zoomAroundPoint(IDENTITY_TRANSFORM, 1.5, focal, fitted, STAGE);
    const imagePoint = getPointInImageSpace(focal, step1);
    const step2 = zoomAroundPoint(step1, 3, focal, fitted, STAGE);

    expect(imagePoint.x * step2.scale + step2.x).toBeCloseTo(focal.x, 5);
    expect(imagePoint.y * step2.scale + step2.y).toBeCloseTo(focal.y, 5);
  });

  test('il risultato resta dentro i limiti di pan', () => {
    const corner = { x: 500, y: 400 };
    const next = zoomAroundPoint(IDENTITY_TRANSFORM, 4, corner, fitted, STAGE);
    const bounds = getPanBounds(fitted, STAGE, 4);

    expect(Math.abs(next.x)).toBeLessThanOrEqual(bounds.maxX + 1e-9);
    expect(Math.abs(next.y)).toBeLessThanOrEqual(bounds.maxY + 1e-9);
  });

  test('scala 1 → identità (reset di x/y)', () => {
    const zoomed = { scale: 2, x: 200, y: -100 };
    expect(zoomAroundPoint(zoomed, 1, { x: 50, y: 50 }, fitted, STAGE)).toEqual(
      IDENTITY_TRANSFORM
    );
  });

  test('scala oltre il massimo viene limitata a 4', () => {
    const next = zoomAroundPoint(IDENTITY_TRANSFORM, 9, { x: 0, y: 0 }, fitted, STAGE);
    expect(next.scale).toBe(4);
  });
});
