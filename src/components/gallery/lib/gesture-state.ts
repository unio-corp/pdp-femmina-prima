import { clampScale, type Point, type ZoomTransform } from './zoom-math';
import {
  getPointerDistance,
  getPointerMidpoint,
  isDoubleTap,
  isTapMovement,
  type TapRecord,
} from './gesture';

export type GestureEvent =
  | { type: 'pointer-down'; pointerId: number; point: Point; pointerType: string }
  | { type: 'pointer-move'; pointerId: number; point: Point }
  | { type: 'pointer-up'; pointerId: number; point: Point; timestamp: number }
  | { type: 'pointer-cancel'; pointerId: number };

export type GestureResult =
  | { type: 'pinch-start' }
  | { type: 'pinch-move'; transform: ZoomTransform }
  | { type: 'pinch-end' }
  | { type: 'drag-start' }
  | { type: 'pan-move'; transform: ZoomTransform }
  | { type: 'pan-end' }
  | { type: 'drag-end'; dx: number; dy: number }
  | { type: 'zoom-to'; targetScale: 1 | 2; focalPoint: Point; method: 'click' | 'double-tap' };

type PointerRecord = Readonly<{ point: Point; pointerType: string }>;
type PinchState = Readonly<{ distance: number; imagePoint: Point; scale: number }>;
type GestureStart = Readonly<{ point: Point; transform: ZoomTransform; pointerType: string }>;

export type GestureState = Readonly<{
  pointers: ReadonlyMap<number, PointerRecord>;
  gestureStart: GestureStart | null;
  pinch: PinchState | null;
  didDrag: boolean;
  didPinch: boolean;
  lastTap: TapRecord | null;
}>;

export const INITIAL_GESTURE_STATE: GestureState = {
  pointers: new Map(),
  gestureStart: null,
  pinch: null,
  didDrag: false,
  didPinch: false,
  lastTap: null,
};

type DispatchOutcome = Readonly<{ state: GestureState; result: GestureResult | null }>;

function withPointer(
  pointers: ReadonlyMap<number, PointerRecord>,
  pointerId: number,
  record: PointerRecord
): ReadonlyMap<number, PointerRecord> {
  const next = new Map(pointers);
  next.set(pointerId, record);
  return next;
}

function withoutPointer(
  pointers: ReadonlyMap<number, PointerRecord>,
  pointerId: number
): ReadonlyMap<number, PointerRecord> {
  const next = new Map(pointers);
  next.delete(pointerId);
  return next;
}

function startPinch(pointers: ReadonlyMap<number, PointerRecord>, transform: ZoomTransform): PinchState {
  const [a, b] = [...pointers.values()];
  const midpoint = getPointerMidpoint(a.point, b.point);
  return {
    distance: Math.max(getPointerDistance(a.point, b.point), 1),
    imagePoint: {
      x: (midpoint.x - transform.x) / transform.scale,
      y: (midpoint.y - transform.y) / transform.scale,
    },
    scale: transform.scale,
  };
}

function dispatchPointerDown(
  state: GestureState,
  event: Extract<GestureEvent, { type: 'pointer-down' }>,
  transform: ZoomTransform
): DispatchOutcome {
  const pointers = withPointer(state.pointers, event.pointerId, {
    point: event.point,
    pointerType: event.pointerType,
  });

  if (pointers.size === 2) {
    return {
      state: {
        ...state,
        pointers,
        pinch: startPinch(pointers, transform),
        didPinch: true,
        lastTap: null,
      },
      result: { type: 'pinch-start' },
    };
  }

  return {
    state: {
      ...state,
      pointers,
      gestureStart: { point: event.point, transform, pointerType: event.pointerType },
      didDrag: false,
    },
    result: null,
  };
}

function dispatchPointerMove(
  state: GestureState,
  event: Extract<GestureEvent, { type: 'pointer-move' }>
): DispatchOutcome {
  const pointer = state.pointers.get(event.pointerId);
  if (!pointer) return { state, result: null };

  const pointers = withPointer(state.pointers, event.pointerId, { ...pointer, point: event.point });

  if (state.pinch && pointers.size >= 2) {
    const [a, b] = [...pointers.values()];
    const midpoint = getPointerMidpoint(a.point, b.point);
    const nextScale = clampScale(
      state.pinch.scale * (getPointerDistance(a.point, b.point) / state.pinch.distance)
    );
    const transform: ZoomTransform = {
      scale: nextScale,
      x: midpoint.x - state.pinch.imagePoint.x * nextScale,
      y: midpoint.y - state.pinch.imagePoint.y * nextScale,
    };
    return { state: { ...state, pointers }, result: { type: 'pinch-move', transform } };
  }

  const start = state.gestureStart;
  if (!start || pointers.size !== 1) return { state: { ...state, pointers }, result: null };

  const deltaX = event.point.x - start.point.x;
  const deltaY = event.point.y - start.point.y;

  // Soglia appena superata: prima notifica dell'interazione, un'unica volta.
  if (!state.didDrag && !isTapMovement(deltaX, deltaY)) {
    const nextState = { ...state, pointers, didDrag: true };
    if (start.transform.scale > 1) {
      const transform: ZoomTransform = {
        scale: start.transform.scale,
        x: start.transform.x + deltaX,
        y: start.transform.y + deltaY,
      };
      return { state: nextState, result: { type: 'pan-move', transform } };
    }
    return { state: nextState, result: { type: 'drag-start' } };
  }

  if (!state.didDrag) return { state: { ...state, pointers }, result: null };

  // Pan: solo oltre 1×. A 1× il movimento resta un candidato swipe silenzioso.
  if (start.transform.scale > 1) {
    const transform: ZoomTransform = {
      scale: start.transform.scale,
      x: start.transform.x + deltaX,
      y: start.transform.y + deltaY,
    };
    return { state: { ...state, pointers }, result: { type: 'pan-move', transform } };
  }

  return { state: { ...state, pointers }, result: null };
}

function dispatchPointerUp(
  state: GestureState,
  event: Extract<GestureEvent, { type: 'pointer-up' }>,
  transform: ZoomTransform
): DispatchOutcome {
  if (!state.pointers.has(event.pointerId)) return { state, result: null };
  const pointers = withoutPointer(state.pointers, event.pointerId);

  // Fine pinch: da due pointer a uno. Il pointer residuo può proseguire in pan.
  if (state.pinch) {
    const remaining = [...pointers.entries()][0];
    return {
      state: {
        ...state,
        pointers,
        pinch: null,
        gestureStart: remaining
          ? { point: remaining[1].point, transform, pointerType: remaining[1].pointerType }
          : null,
        didDrag: false,
      },
      result: { type: 'pinch-end' },
    };
  }

  if (pointers.size > 0) return { state: { ...state, pointers }, result: null };

  const start = state.gestureStart;
  // didPinch resta true per l'intera gestualità multi-pointer: il rilascio
  // del pointer residuo dopo un pinch non deve produrre tap/swipe/pan-end.
  if (!start || state.didPinch) return { state: INITIAL_GESTURE_STATE, result: null };

  if (state.didDrag) {
    if (start.transform.scale > 1) {
      return { state: INITIAL_GESTURE_STATE, result: { type: 'pan-end' } };
    }
    // Swipe: solo a 1× e solo touch/penna — i mouse non swipano.
    if (start.pointerType !== 'mouse') {
      return {
        state: INITIAL_GESTURE_STATE,
        result: { type: 'drag-end', dx: event.point.x - start.point.x, dy: event.point.y - start.point.y },
      };
    }
    return { state: INITIAL_GESTURE_STATE, result: null };
  }

  // Tap: click desktop → toggle immediato; touch/penna → solo al double tap.
  if (start.pointerType === 'mouse') {
    return {
      state: INITIAL_GESTURE_STATE,
      result: {
        type: 'zoom-to',
        targetScale: transform.scale === 1 ? 2 : 1,
        focalPoint: event.point,
        method: 'click',
      },
    };
  }

  const tap: TapRecord = { time: event.timestamp, x: event.point.x, y: event.point.y };
  if (isDoubleTap(state.lastTap, tap)) {
    return {
      state: INITIAL_GESTURE_STATE,
      result: {
        type: 'zoom-to',
        targetScale: transform.scale === 1 ? 2 : 1,
        focalPoint: event.point,
        method: 'double-tap',
      },
    };
  }
  return { state: { ...INITIAL_GESTURE_STATE, lastTap: tap }, result: null };
}

function dispatchPointerCancel(
  state: GestureState,
  event: Extract<GestureEvent, { type: 'pointer-cancel' }>
): DispatchOutcome {
  if (!state.pointers.has(event.pointerId)) return { state, result: null };
  const pointers = withoutPointer(state.pointers, event.pointerId);
  if (pointers.size > 0) return { state: { ...state, pointers }, result: null };

  if (state.pinch) return { state: INITIAL_GESTURE_STATE, result: { type: 'pinch-end' } };
  return { state: INITIAL_GESTURE_STATE, result: null };
}

/**
 * Reducer puro: interpreta la topologia dei pointer (pinch/pan/tap/swipe) a
 * partire da coordinate già proiettate in stage-space. Non conosce mai lo
 * stage (nessun clampTranslation/getPanBounds, nessuna stageWidth per lo
 * swipe): quella matematica resta nel chiamante, che possiede la geometria.
 */
export function dispatch(
  state: GestureState,
  event: GestureEvent,
  transform: ZoomTransform
): DispatchOutcome {
  switch (event.type) {
    case 'pointer-down':
      return dispatchPointerDown(state, event, transform);
    case 'pointer-move':
      return dispatchPointerMove(state, event);
    case 'pointer-up':
      return dispatchPointerUp(state, event, transform);
    case 'pointer-cancel':
      return dispatchPointerCancel(state, event);
  }
}
