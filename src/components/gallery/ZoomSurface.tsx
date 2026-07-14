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
import { getSwipeDirection } from './lib/gesture';
import { dispatch, INITIAL_GESTURE_STATE } from './lib/gesture-state';
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

    // Unico proprietario della topologia pointer (pinch/pan/tap/swipe):
    // vedi lib/gesture-state.ts. Sostituisce i sei ref precedenti
    // (pointersRef, gestureStartRef, pinchRef, didDragRef, didPinchRef,
    // lastTapRef) con un solo stato, interpretato da un reducer puro e testato.
    const gestureStateRef = useRef(INITIAL_GESTURE_STATE);

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
    // Unico punto che legge il DOM per la geometria: gesture-state.ts non
    // conosce mai lo stage, riceve solo coordinate già proiettate.
    const toStagePoint = useCallback((clientX: number, clientY: number): Point => {
      const stage = stageRef.current;
      if (!stage) return { x: 0, y: 0 };
      const rect = stage.getBoundingClientRect();
      return {
        x: clientX - rect.left - rect.width / 2,
        y: clientY - rect.top - rect.height / 2,
      };
    }, []);

    const resetCursorIfZoomed = useCallback(() => {
      if (imageRef.current && transformRef.current.scale > 1) {
        imageRef.current.style.cursor = 'grab';
      }
    }, []);

    // Settle del pinch: identità sotto una soglia trascurabile, altrimenti
    // traslazione ri-limitata alla geometria corrente dello stage.
    const finalizePinch = useCallback(() => {
      const t = transformRef.current;
      const next =
        t.scale <= 1.001
          ? IDENTITY_TRANSFORM
          : clampTranslation(t, getPanBounds(fittedSize(), stageSizeRef.current, t.scale));
      commitTransform(next, 'pinch', false);
    }, [commitTransform, fittedSize]);

    const handlePointerDown = useCallback(
      (event: React.PointerEvent<HTMLDivElement>) => {
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch (error) {
          // Pointer sintetici (test) possono non supportare la capture:
          // logga comunque, un fallimento reale in produzione lascerebbe
          // altrimenti la gesture senza segnale diagnostico.
          console.error('ZoomSurface: setPointerCapture() non riuscito.', error);
        }

        const point = toStagePoint(event.clientX, event.clientY);
        const { state, result } = dispatch(
          gestureStateRef.current,
          { type: 'pointer-down', pointerId: event.pointerId, point, pointerType: event.pointerType },
          transformRef.current
        );
        gestureStateRef.current = state;

        if (result?.type === 'pinch-start') {
          onSignificantInteractionRef.current();
          return;
        }

        if (transformRef.current.scale > 1 && imageRef.current) {
          imageRef.current.style.cursor = 'grabbing';
        }
      },
      [toStagePoint]
    );

    const handlePointerMove = useCallback(
      (event: React.PointerEvent<HTMLDivElement>) => {
        const point = toStagePoint(event.clientX, event.clientY);
        const { state, result } = dispatch(
          gestureStateRef.current,
          { type: 'pointer-move', pointerId: event.pointerId, point },
          transformRef.current
        );
        gestureStateRef.current = state;
        if (!result) return;

        switch (result.type) {
          case 'pinch-move':
          case 'pan-move': {
            transformRef.current = clampTranslation(
              result.transform,
              getPanBounds(fittedSize(), stageSizeRef.current, result.transform.scale)
            );
            onSignificantInteractionRef.current();
            scheduleRender();
            break;
          }
          case 'drag-start': {
            onSignificantInteractionRef.current();
            break;
          }
        }
      },
      [toStagePoint, fittedSize, scheduleRender]
    );

    const handlePointerUp = useCallback(
      (event: React.PointerEvent<HTMLDivElement>) => {
        const point = toStagePoint(event.clientX, event.clientY);
        const { state, result } = dispatch(
          gestureStateRef.current,
          { type: 'pointer-up', pointerId: event.pointerId, point, timestamp: event.timeStamp },
          transformRef.current
        );
        gestureStateRef.current = state;

        try {
          event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {
          // Capture assente: nessuna azione.
        }

        if (result) {
          switch (result.type) {
            case 'pinch-end':
              finalizePinch();
              break;
            case 'pan-end':
              // Fine pan: commit senza evento zoom (la scala non cambia).
              commitTransform(transformRef.current, null, false);
              break;
            case 'drag-end': {
              const direction = getSwipeDirection(result.dx, result.dy, stageSizeRef.current.width);
              if (direction) onNavigateRef.current(direction);
              break;
            }
            case 'zoom-to':
              zoomTo(result.targetScale, result.focalPoint, result.method, true);
              break;
          }
        }

        if (state.pointers.size === 0) resetCursorIfZoomed();
      },
      [toStagePoint, finalizePinch, commitTransform, zoomTo, resetCursorIfZoomed]
    );

    const handlePointerCancel = useCallback(
      (event: React.PointerEvent<HTMLDivElement>) => {
        // lostpointercapture segue anche il release regolare del pointerup:
        // agisce solo se il pointer era ancora tracciato (gestito dal reducer).
        const { state, result } = dispatch(
          gestureStateRef.current,
          { type: 'pointer-cancel', pointerId: event.pointerId },
          transformRef.current
        );
        gestureStateRef.current = state;

        if (result?.type === 'pinch-end') finalizePinch();
        if (state.pointers.size === 0) {
          resetCursorIfZoomed();
          renderTransform();
        }
      },
      [finalizePinch, resetCursorIfZoomed, renderTransform]
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

    // Cleanup completo: rAF, timer.
    useEffect(() => {
      return () => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
        if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
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
