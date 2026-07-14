import type { Point } from './zoom-math';

/** Sotto questa soglia di movimento un pointer è un tap (spec §5.3). */
export const TAP_THRESHOLD_PX = 6;
/** Finestra temporale massima del double tap. */
export const DOUBLE_TAP_MS = 280;
/** Distanza massima tra i due tap di un double tap. */
export const DOUBLE_TAP_RADIUS_PX = 24;
/** Rapporto minimo orizzontale/verticale perché un gesto sia swipe. */
export const SWIPE_AXIS_RATIO = 1.25;
/** Soglia minima assoluta dello swipe. */
export const SWIPE_MIN_DISTANCE_PX = 48;
/** Frazione della larghezza dello stage come soglia alternativa. */
export const SWIPE_STAGE_FRACTION = 0.12;

export function getPointerDistance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function getPointerMidpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function isTapMovement(deltaX: number, deltaY: number): boolean {
  return Math.hypot(deltaX, deltaY) < TAP_THRESHOLD_PX;
}

export type TapRecord = Readonly<{ time: number; x: number; y: number }>;

export function isDoubleTap(previous: TapRecord | null, current: TapRecord): boolean {
  if (!previous) return false;
  if (current.time - previous.time > DOUBLE_TAP_MS) return false;
  return getPointerDistance(previous, current) <= DOUBLE_TAP_RADIUS_PX;
}

export type SwipeDirection = 'previous' | 'next';

/**
 * Classifica un rilascio come swipe orizzontale. Restituisce null quando
 * il movimento è sotto soglia o prevalentemente verticale.
 * dx > 0 (verso destra) → immagine precedente.
 */
export function getSwipeDirection(
  deltaX: number,
  deltaY: number,
  stageWidth: number
): SwipeDirection | null {
  const threshold = Math.max(SWIPE_MIN_DISTANCE_PX, stageWidth * SWIPE_STAGE_FRACTION);
  if (Math.abs(deltaX) < threshold) return null;
  if (Math.abs(deltaX) < Math.abs(deltaY) * SWIPE_AXIS_RATIO) return null;
  return deltaX > 0 ? 'previous' : 'next';
}

export type ZoomControlsState = Readonly<{
  canZoomIn: boolean;
  canZoomOut: boolean;
  canReset: boolean;
}>;

export function getZoomControlsState(
  scale: number,
  min: number,
  max: number
): ZoomControlsState {
  return {
    canZoomIn: scale < max,
    canZoomOut: scale > min,
    canReset: scale > min,
  };
}
