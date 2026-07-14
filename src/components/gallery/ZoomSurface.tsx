'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import {
  IDENTITY_TRANSFORM,
  SCALE_STEP,
  clampScale,
  clampTranslation,
  getContainedImageSize,
  getPanBounds,
  zoomAroundPoint,
  type Point,
  type Size,
  type ZoomTransform,
} from './lib/zoom-math';
import {
  getPointerDistance,
  getPointerMidpoint,
  getSwipeDirection,
  isDoubleTap,
  isTapMovement,
  type TapRecord,
} from './lib/gesture';
import styles from './ZoomSurface.module.css';

export type ZoomMethod = 'click' | 'double-tap' | 'pinch' | 'button' | 'wheel' | 'keyboard';

export type ZoomSurfaceHandle = Readonly<{
  zoomIn: (method: 'button' | 'keyboard') => void;
  zoomOut: (method: 'button' | 'keyboard') => void;
  reset: (method: 'button' | 'keyboard') => void;
}>;

type ZoomSurfaceProps = Readonly<{
  src: string;
  alt: string;
  reducedMotion: boolean;
  /** Chiamata durante interazioni significative: inibisce il backdrop close nel parent. */
  onSignificantInteraction: () => void;
  onLoad: () => void;
  onError: () => void;
  onNavigate: (direction: 'previous' | 'next') => void;
  onZoomCommit: (scale: number, method: ZoomMethod) => void;
}>;

const WHEEL_COMMIT_DEBOUNCE_MS = 300;
const WHEEL_SENSITIVITY = 0.002;
const COMMIT_ANIMATION_MS = 200;

type ActivePointer = { x: number; y: number; pointerType: string };

type PinchState = Readonly<{
  distance: number;
  imagePoint: Point;
  scale: number;
}>;

type GestureStart = Readonly<{
  x: number;
  y: number;
  transform: ZoomTransform;
  pointerType: string;
}>;

export const ZoomSurface = forwardRef<ZoomSurfaceHandle, ZoomSurfaceProps>(
  function ZoomSurface(
    { src, alt, reducedMotion, onSignificantInteraction, onLoad, onError, onNavigate, onZoomCommit },
    ref
  ) {
    const stageRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const onSignificantInteractionRef = useRef(onSignificantInteraction);
    onSignificantInteractionRef.current = onSignificantInteraction;

    const transformRef = useRef<ZoomTransform>(IDENTITY_TRANSFORM);
    const committedScaleRef = useRef(1);
    const naturalSizeRef = useRef<Size>({ width: 0, height: 0 });
    const stageSizeRef = useRef<Size>({ width: 0, height: 0 });

    const pointersRef = useRef(new Map<number, ActivePointer>());
    const gestureStartRef = useRef<GestureStart | null>(null);
    const pinchRef = useRef<PinchState | null>(null);
    const didDragRef = useRef(false);
    const didPinchRef = useRef(false);
    const lastTapRef = useRef<TapRecord | null>(null);

    const rafRef = useRef<number | null>(null);
    const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const onZoomCommitRef = useRef(onZoomCommit);
    onZoomCommitRef.current = onZoomCommit;
    const onNavigateRef = useRef(onNavigate);
    onNavigateRef.current = onNavigate;
    const reducedMotionRef = useRef(reducedMotion);
    reducedMotionRef.current = reducedMotion;

    const fittedSize = useCallback(
      (): Size => getContainedImageSize(stageSizeRef.current, naturalSizeRef.current),
      []
    );

    const renderTransform = useCallback(() => {
      const image = imageRef.current;
      if (!image) return;
      const { scale, x, y } = transformRef.current;
      image.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
      image.style.cursor = scale > 1 ? 'grab' : '';
    }, []);

    const scheduleRender = useCallback(() => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        renderTransform();
      });
    }, [renderTransform]);

    // Applica una trasformazione stabile: aggiorna il valore committed,
    // il data attribute diagnostico e, se cambiata la scala, notifica il parent.
    const commitTransform = useCallback(
      (next: ZoomTransform, method: ZoomMethod | null, animate: boolean) => {
        const image = imageRef.current;
        const stage = stageRef.current;
        transformRef.current = next;

        if (image) {
          if (animate && !reducedMotionRef.current) {
            image.style.transition = `transform var(--gallery-transition-duration, 180ms) var(--gallery-transition-easing, cubic-bezier(0.2, 0, 0, 1))`;
            if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
            animationTimerRef.current = setTimeout(() => {
              if (imageRef.current) imageRef.current.style.transition = '';
            }, COMMIT_ANIMATION_MS);
          } else {
            image.style.transition = '';
          }
        }
        renderTransform();

        if (stage) stage.dataset.zoomScale = String(next.scale);
        if (method !== null && next.scale !== committedScaleRef.current) {
          committedScaleRef.current = next.scale;
          onZoomCommitRef.current(next.scale, method);
        } else {
          committedScaleRef.current = next.scale;
        }
      },
      [renderTransform]
    );

    const zoomTo = useCallback(
      (nextScale: number, focal: Point, method: ZoomMethod, animate: boolean) => {
        const next = zoomAroundPoint(
          transformRef.current,
          nextScale,
          focal,
          fittedSize(),
          stageSizeRef.current
        );
        commitTransform(next, method, animate);
      },
      [commitTransform, fittedSize]
    );

    const stepZoom = useCallback(
      (direction: 1 | -1, method: 'button' | 'keyboard') => {
        const current = transformRef.current.scale;
        const target = clampScale(current + direction * SCALE_STEP);
        if (target === current) return;
        zoomTo(target, { x: 0, y: 0 }, method, true);
      },
      [zoomTo]
    );

    useImperativeHandle(
      ref,
      () => ({
        zoomIn: (method) => stepZoom(1, method),
        zoomOut: (method) => stepZoom(-1, method),
        reset: (method) => {
          if (transformRef.current.scale === 1) return;
          zoomTo(1, { x: 0, y: 0 }, method, true);
        },
      }),
      [stepZoom, zoomTo]
    );

    // Coordinate pointer → sistema centrato sullo stage (non trasformato).
    const toStagePoint = useCallback((clientX: number, clientY: number): Point => {
      const stage = stageRef.current;
      if (!stage) return { x: 0, y: 0 };
      const rect = stage.getBoundingClientRect();
      return {
        x: clientX - rect.left - rect.width / 2,
        y: clientY - rect.top - rect.height / 2,
      };
    }, []);

    const clearGesture = useCallback(() => {
      gestureStartRef.current = null;
      pinchRef.current = null;
      didDragRef.current = false;
      didPinchRef.current = false;
      if (imageRef.current && transformRef.current.scale > 1) {
        imageRef.current.style.cursor = 'grab';
      }
    }, []);

    const startPinch = useCallback(() => {
      const points = [...pointersRef.current.values()];
      if (points.length < 2) return;
      const a = toStagePoint(points[0].x, points[0].y);
      const b = toStagePoint(points[1].x, points[1].y);
      const midpoint = getPointerMidpoint(a, b);
      const t = transformRef.current;
      pinchRef.current = {
        distance: Math.max(getPointerDistance(a, b), 1),
        imagePoint: {
          x: (midpoint.x - t.x) / t.scale,
          y: (midpoint.y - t.y) / t.scale,
        },
        scale: t.scale,
      };
      didPinchRef.current = true;
      lastTapRef.current = null;
      onSignificantInteractionRef.current();
    }, [toStagePoint]);

    const finalizePinch = useCallback(() => {
      if (!pinchRef.current) return;
      pinchRef.current = null;
      const t = transformRef.current;
      const next =
        t.scale <= 1.001
          ? IDENTITY_TRANSFORM
          : clampTranslation(t, getPanBounds(fittedSize(), stageSizeRef.current, t.scale));
      commitTransform(next, 'pinch', false);
    }, [commitTransform, fittedSize]);

    const handlePointerDown = useCallback(
      (event: React.PointerEvent<HTMLDivElement>) => {
        pointersRef.current.set(event.pointerId, {
          x: event.clientX,
          y: event.clientY,
          pointerType: event.pointerType,
        });
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch (error) {
          // Pointer sintetici (test) possono non supportare la capture:
          // logga comunque, un fallimento reale in produzione lascerebbe
          // altrimenti la gesture senza segnale diagnostico.
          console.error('ZoomSurface: setPointerCapture() non riuscito.', error);
        }

        if (pointersRef.current.size === 2) {
          startPinch();
          return;
        }

        gestureStartRef.current = {
          x: event.clientX,
          y: event.clientY,
          transform: transformRef.current,
          pointerType: event.pointerType,
        };
        didDragRef.current = false;
        if (transformRef.current.scale > 1 && imageRef.current) {
          imageRef.current.style.cursor = 'grabbing';
        }
      },
      [startPinch]
    );

    const handlePointerMove = useCallback(
      (event: React.PointerEvent<HTMLDivElement>) => {
        const pointer = pointersRef.current.get(event.pointerId);
        if (!pointer) return;
        pointer.x = event.clientX;
        pointer.y = event.clientY;

        // Pinch: due pointer attivi.
        if (pinchRef.current && pointersRef.current.size >= 2) {
          const points = [...pointersRef.current.values()];
          const a = toStagePoint(points[0].x, points[0].y);
          const b = toStagePoint(points[1].x, points[1].y);
          const midpoint = getPointerMidpoint(a, b);
          const pinch = pinchRef.current;

          const nextScale = clampScale(
            pinch.scale * (getPointerDistance(a, b) / pinch.distance)
          );
          const unclamped: ZoomTransform = {
            scale: nextScale,
            x: midpoint.x - pinch.imagePoint.x * nextScale,
            y: midpoint.y - pinch.imagePoint.y * nextScale,
          };
          transformRef.current = clampTranslation(
            unclamped,
            getPanBounds(fittedSize(), stageSizeRef.current, nextScale)
          );
          onSignificantInteractionRef.current();
          scheduleRender();
          return;
        }

        // Gesture a un pointer.
        const start = gestureStartRef.current;
        if (!start || pointersRef.current.size !== 1) return;

        const deltaX = event.clientX - start.x;
        const deltaY = event.clientY - start.y;
        if (!didDragRef.current && !isTapMovement(deltaX, deltaY)) {
          didDragRef.current = true;
          onSignificantInteractionRef.current();
        }
        if (!didDragRef.current) return;

        // Pan: solo oltre 1×. A 1× il movimento è un candidato swipe.
        if (start.transform.scale > 1) {
          transformRef.current = clampTranslation(
            {
              scale: start.transform.scale,
              x: start.transform.x + deltaX,
              y: start.transform.y + deltaY,
            },
            getPanBounds(fittedSize(), stageSizeRef.current, start.transform.scale)
          );
          scheduleRender();
        }
      },
      [toStagePoint, fittedSize, scheduleRender]
    );

    const handleTapOrClick = useCallback(
      (event: React.PointerEvent<HTMLDivElement>) => {
        const point = toStagePoint(event.clientX, event.clientY);

        if (event.pointerType === 'mouse') {
          // Click desktop: 1× → 2× sul punto; oltre 1× → reset.
          if (transformRef.current.scale === 1) {
            zoomTo(2, point, 'click', true);
          } else {
            zoomTo(1, { x: 0, y: 0 }, 'click', true);
          }
          return;
        }

        // Touch/penna: solo il double tap modifica lo zoom.
        const tap: TapRecord = { time: event.timeStamp, x: event.clientX, y: event.clientY };
        if (isDoubleTap(lastTapRef.current, tap)) {
          lastTapRef.current = null;
          if (transformRef.current.scale === 1) {
            zoomTo(2, point, 'double-tap', true);
          } else {
            zoomTo(1, { x: 0, y: 0 }, 'double-tap', true);
          }
        } else {
          lastTapRef.current = tap;
        }
      },
      [toStagePoint, zoomTo]
    );

    const handlePointerUp = useCallback(
      (event: React.PointerEvent<HTMLDivElement>) => {
        if (!pointersRef.current.has(event.pointerId)) return;
        pointersRef.current.delete(event.pointerId);
        try {
          event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {
          // Capture assente: nessuna azione.
        }

        // Fine pinch: da due pointer a uno. Il pointer residuo può proseguire in pan.
        if (pinchRef.current) {
          finalizePinch();
          const remaining = [...pointersRef.current.entries()][0];
          if (remaining) {
            gestureStartRef.current = {
              x: remaining[1].x,
              y: remaining[1].y,
              transform: transformRef.current,
              pointerType: remaining[1].pointerType,
            };
            didDragRef.current = false;
          }
          return;
        }

        if (pointersRef.current.size > 0) return;

        const start = gestureStartRef.current;
        if (start && !didPinchRef.current) {
          if (didDragRef.current) {
            if (start.transform.scale > 1) {
              // Fine pan: commit senza evento zoom (la scala non cambia).
              commitTransform(transformRef.current, null, false);
            } else if (start.pointerType !== 'mouse') {
              // Swipe: solo a 1× e solo touch/penna.
              const direction = getSwipeDirection(
                event.clientX - start.x,
                event.clientY - start.y,
                stageSizeRef.current.width
              );
              if (direction) onNavigateRef.current(direction);
            }
            lastTapRef.current = null;
          } else {
            handleTapOrClick(event);
          }
        }

        clearGesture();
      },
      [finalizePinch, commitTransform, handleTapOrClick, clearGesture]
    );

    const handlePointerCancel = useCallback(
      (event: React.PointerEvent<HTMLDivElement>) => {
        // lostpointercapture segue anche il release regolare del pointerup:
        // agisci solo se il pointer era ancora tracciato.
        if (!pointersRef.current.has(event.pointerId)) return;
        pointersRef.current.delete(event.pointerId);
        if (pointersRef.current.size === 0) {
          // Annulla la gesture: torna all'ultima trasformazione stabile.
          if (pinchRef.current) finalizePinch();
          lastTapRef.current = null;
          clearGesture();
          renderTransform();
        }
      },
      [finalizePinch, clearGesture, renderTransform]
    );

    // Wheel zoom solo con Ctrl/Meta; listener non-passive per preventDefault.
    useEffect(() => {
      const stage = stageRef.current;
      if (!stage) return;

      const handleWheel = (event: WheelEvent) => {
        if (!event.ctrlKey && !event.metaKey) return;
        event.preventDefault();

        const factor = Math.exp(-event.deltaY * WHEEL_SENSITIVITY);
        const nextScale = clampScale(transformRef.current.scale * factor);
        const focal = toStagePoint(event.clientX, event.clientY);
        const next = zoomAroundPoint(
          transformRef.current,
          nextScale,
          focal,
          getContainedImageSize(stageSizeRef.current, naturalSizeRef.current),
          stageSizeRef.current
        );
        transformRef.current = next;
        scheduleRender();

        if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
        wheelTimerRef.current = setTimeout(() => {
          commitTransform(transformRef.current, 'wheel', false);
        }, WHEEL_COMMIT_DEBOUNCE_MS);
      };

      stage.addEventListener('wheel', handleWheel, { passive: false });
      return () => stage.removeEventListener('wheel', handleWheel);
    }, [toStagePoint, scheduleRender, commitTransform]);

    // Misure dello stage: ResizeObserver, mai getBoundingClientRect
    // dell'immagine trasformata.
    useEffect(() => {
      const stage = stageRef.current;
      if (!stage) return;

      const measure = () => {
        stageSizeRef.current = {
          width: stage.clientWidth,
          height: stage.clientHeight,
        };
        // Dopo resize/rotazione: scala conservata, traslazione ri-limitata.
        const t = transformRef.current;
        transformRef.current = clampTranslation(
          t,
          getPanBounds(
            getContainedImageSize(stageSizeRef.current, naturalSizeRef.current),
            stageSizeRef.current,
            t.scale
          )
        );
        renderTransform();
      };

      measure();
      const observer = new ResizeObserver(measure);
      observer.observe(stage);
      return () => observer.disconnect();
    }, [renderTransform]);

    // Immagini già in cache possono non emettere onLoad.
    useEffect(() => {
      const image = imageRef.current;
      if (image?.complete && image.naturalWidth > 0) {
        naturalSizeRef.current = { width: image.naturalWidth, height: image.naturalHeight };
        onLoad();
      }
      // Solo al mount.
    }, []);

    // Cleanup completo: rAF, timer, pointer.
    useEffect(() => {
      const pointers = pointersRef.current;
      return () => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
        if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
        pointers.clear();
      };
    }, []);

    return (
      <div
        ref={stageRef}
        className={styles.surface}
        data-zoom-scale="1"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handlePointerCancel}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          className={styles.image}
          decoding="async"
          draggable={false}
          onLoad={(event) => {
            const image = event.currentTarget;
            naturalSizeRef.current = {
              width: image.naturalWidth,
              height: image.naturalHeight,
            };
            onLoad();
          }}
          onError={onError}
        />
      </div>
    );
  }
);
