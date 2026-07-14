/**
 * Modello di trasformazione della ZoomSurface.
 *
 * Sistema di coordinate: origine al centro dello stage. L'immagine è
 * renderizzata centrata alla sua dimensione "contained"; la trasformazione
 * applicata è `translate3d(x, y, 0) scale(scale)` con transform-origin al
 * centro. Un punto p dell'immagine (relativo al centro dell'immagine)
 * appare quindi in v = p * scale + t.
 */

export type ZoomTransform = Readonly<{
  scale: number;
  x: number;
  y: number;
}>;

export type Size = Readonly<{ width: number; height: number }>;
export type Point = Readonly<{ x: number; y: number }>;

export const MIN_SCALE = 1;
export const MAX_SCALE = 4;
export const SCALE_STEP = 0.5;

export const IDENTITY_TRANSFORM: ZoomTransform = { scale: 1, x: 0, y: 0 };

export function clampScale(
  scale: number,
  min: number = MIN_SCALE,
  max: number = MAX_SCALE
): number {
  return Math.min(Math.max(scale, min), max);
}

/** Dimensione dell'immagine contenuta nello stage (object-fit: contain). */
export function getContainedImageSize(stage: Size, intrinsic: Size): Size {
  if (
    stage.width <= 0 ||
    stage.height <= 0 ||
    intrinsic.width <= 0 ||
    intrinsic.height <= 0
  ) {
    return { width: 0, height: 0 };
  }

  const ratio = Math.min(stage.width / intrinsic.width, stage.height / intrinsic.height);
  return { width: intrinsic.width * ratio, height: intrinsic.height * ratio };
}

export type PanBounds = Readonly<{ maxX: number; maxY: number }>;

/**
 * Limiti simmetrici del pan: metà dell'eccedenza dell'immagine scalata
 * rispetto allo stage. Se l'immagine scalata è più piccola dello stage su
 * un asse, quel limite è 0 (l'asse resta centrato).
 */
export function getPanBounds(fitted: Size, stage: Size, scale: number): PanBounds {
  return {
    maxX: Math.max(0, (fitted.width * scale - stage.width) / 2),
    maxY: Math.max(0, (fitted.height * scale - stage.height) / 2),
  };
}

export function clampTranslation(transform: ZoomTransform, bounds: PanBounds): ZoomTransform {
  const clampAxis = (value: number, limit: number): number =>
    limit === 0 ? 0 : Math.min(Math.max(value, -limit), limit);

  return {
    scale: transform.scale,
    x: clampAxis(transform.x, bounds.maxX),
    y: clampAxis(transform.y, bounds.maxY),
  };
}

/** Punto dell'immagine (relativo al suo centro) sotto un punto dello stage. */
export function getPointInImageSpace(pointer: Point, transform: ZoomTransform): Point {
  return {
    x: (pointer.x - transform.x) / transform.scale,
    y: (pointer.y - transform.y) / transform.scale,
  };
}

/**
 * Applica una nuova scala mantenendo visivamente stabile il punto focale
 * (coordinate relative al centro dello stage), quindi limita la traslazione.
 * A scala 1 la trasformazione torna all'identità.
 */
export function zoomAroundPoint(
  current: ZoomTransform,
  nextScale: number,
  focalPoint: Point,
  fitted: Size,
  stage: Size,
  min: number = MIN_SCALE,
  max: number = MAX_SCALE
): ZoomTransform {
  const scale = clampScale(nextScale, min, max);
  if (scale === 1) return IDENTITY_TRANSFORM;

  const imagePoint = getPointInImageSpace(focalPoint, current);
  const unclamped: ZoomTransform = {
    scale,
    x: focalPoint.x - imagePoint.x * scale,
    y: focalPoint.y - imagePoint.y * scale,
  };

  return clampTranslation(unclamped, getPanBounds(fitted, stage, scale));
}
