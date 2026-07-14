import { describe, expect, test } from 'vitest';
import { dispatch, INITIAL_GESTURE_STATE, type GestureState } from './gesture-state';
import { IDENTITY_TRANSFORM, type ZoomTransform } from './zoom-math';

const AT_1X = IDENTITY_TRANSFORM;
const AT_2X: ZoomTransform = { scale: 2, x: 0, y: 0 };

describe('pinch', () => {
  test('due pointer avviano un pinch: pinch-start, didPinch true', () => {
    const first = dispatch(
      INITIAL_GESTURE_STATE,
      { type: 'pointer-down', pointerId: 1, point: { x: 0, y: 0 }, pointerType: 'touch' },
      AT_1X
    );
    expect(first.result).toBeNull();

    const second = dispatch(
      first.state,
      { type: 'pointer-down', pointerId: 2, point: { x: 100, y: 0 }, pointerType: 'touch' },
      AT_1X
    );
    expect(second.result).toEqual({ type: 'pinch-start' });
    expect(second.state.didPinch).toBe(true);
    expect(second.state.pinch).not.toBeNull();
  });

  test('pinch-move: allontanare i pointer aumenta la scala, focal point stabile', () => {
    let state: GestureState = INITIAL_GESTURE_STATE;
    state = dispatch(
      state,
      { type: 'pointer-down', pointerId: 1, point: { x: -50, y: 0 }, pointerType: 'touch' },
      AT_1X
    ).state;
    state = dispatch(
      state,
      { type: 'pointer-down', pointerId: 2, point: { x: 50, y: 0 }, pointerType: 'touch' },
      AT_1X
    ).state;

    // Raddoppia la distanza tra i due pointer.
    state = dispatch(state, { type: 'pointer-move', pointerId: 1, point: { x: -100, y: 0 } }, AT_1X).state;
    const moveOut = dispatch(state, { type: 'pointer-move', pointerId: 2, point: { x: 100, y: 0 } }, AT_1X);

    expect(moveOut.result?.type).toBe('pinch-move');
    if (moveOut.result?.type === 'pinch-move') {
      expect(moveOut.result.transform.scale).toBeCloseTo(2);
      expect(moveOut.result.transform.x).toBeCloseTo(0);
    }
  });

  test('pinch-move rispetta MAX_SCALE (clampScale)', () => {
    let state: GestureState = INITIAL_GESTURE_STATE;
    state = dispatch(
      state,
      { type: 'pointer-down', pointerId: 1, point: { x: -10, y: 0 }, pointerType: 'touch' },
      AT_1X
    ).state;
    state = dispatch(
      state,
      { type: 'pointer-down', pointerId: 2, point: { x: 10, y: 0 }, pointerType: 'touch' },
      AT_1X
    ).state;

    state = dispatch(state, { type: 'pointer-move', pointerId: 1, point: { x: -1000, y: 0 } }, AT_1X).state;
    const move = dispatch(state, { type: 'pointer-move', pointerId: 2, point: { x: 1000, y: 0 } }, AT_1X);

    expect(move.result?.type).toBe('pinch-move');
    if (move.result?.type === 'pinch-move') {
      expect(move.result.transform.scale).toBeLessThanOrEqual(4);
    }
  });

  test('fine pinch: rilascio di un dito emette pinch-end e passa a pan sul residuo', () => {
    let state: GestureState = INITIAL_GESTURE_STATE;
    state = dispatch(
      state,
      { type: 'pointer-down', pointerId: 1, point: { x: -50, y: 0 }, pointerType: 'touch' },
      AT_1X
    ).state;
    state = dispatch(
      state,
      { type: 'pointer-down', pointerId: 2, point: { x: 50, y: 0 }, pointerType: 'touch' },
      AT_2X
    ).state;

    const up = dispatch(state, { type: 'pointer-up', pointerId: 1, point: { x: -50, y: 0 }, timestamp: 0 }, AT_2X);
    expect(up.result).toEqual({ type: 'pinch-end' });
    expect(up.state.pinch).toBeNull();
    expect(up.state.gestureStart).not.toBeNull();
    expect(up.state.didPinch).toBe(true); // resta true per l'intera gestualità

    // Il rilascio finale del pointer residuo non produce tap/swipe/pan-end.
    const finalUp = dispatch(up.state, { type: 'pointer-up', pointerId: 2, point: { x: 50, y: 0 }, timestamp: 0 }, AT_2X);
    expect(finalUp.result).toBeNull();
    expect(finalUp.state).toEqual(INITIAL_GESTURE_STATE);
  });

  test('pointer-cancel di entrambi i pointer durante un pinch attivo emette pinch-end', () => {
    let state: GestureState = INITIAL_GESTURE_STATE;
    state = dispatch(
      state,
      { type: 'pointer-down', pointerId: 1, point: { x: -50, y: 0 }, pointerType: 'touch' },
      AT_1X
    ).state;
    state = dispatch(
      state,
      { type: 'pointer-down', pointerId: 2, point: { x: 50, y: 0 }, pointerType: 'touch' },
      AT_1X
    ).state;
    // Il pinch è ancora attivo (nessun pointerup intermedio l'ha già risolto).
    state = dispatch(state, { type: 'pointer-cancel', pointerId: 1 }, AT_1X).state;

    const cancel = dispatch(state, { type: 'pointer-cancel', pointerId: 2 }, AT_1X);
    expect(cancel.result).toEqual({ type: 'pinch-end' });
    expect(cancel.state).toEqual(INITIAL_GESTURE_STATE);
  });

  test('pointer-cancel dopo che il pinch è già stato risolto da un pointerup non ri-emette pinch-end', () => {
    let state: GestureState = INITIAL_GESTURE_STATE;
    state = dispatch(
      state,
      { type: 'pointer-down', pointerId: 1, point: { x: -50, y: 0 }, pointerType: 'touch' },
      AT_1X
    ).state;
    state = dispatch(
      state,
      { type: 'pointer-down', pointerId: 2, point: { x: 50, y: 0 }, pointerType: 'touch' },
      AT_1X
    ).state;
    state = dispatch(state, { type: 'pointer-up', pointerId: 1, point: { x: -50, y: 0 }, timestamp: 0 }, AT_1X).state;

    const cancel = dispatch(state, { type: 'pointer-cancel', pointerId: 2 }, AT_1X);
    expect(cancel.result).toBeNull();
    expect(cancel.state).toEqual(INITIAL_GESTURE_STATE);
  });
});

describe('pan (drag a scala > 1×)', () => {
  test('drag oltre soglia a 2× emette pan-move con onSignificantInteraction implicito', () => {
    let state: GestureState = INITIAL_GESTURE_STATE;
    state = dispatch(
      state,
      { type: 'pointer-down', pointerId: 1, point: { x: 0, y: 0 }, pointerType: 'touch' },
      AT_2X
    ).state;

    const move = dispatch(state, { type: 'pointer-move', pointerId: 1, point: { x: 20, y: 0 } }, AT_2X);
    expect(move.result).toEqual({ type: 'pan-move', transform: { scale: 2, x: 20, y: 0 } });
    expect(move.state.didDrag).toBe(true);
  });

  test('movimento sotto soglia tap non produce alcun risultato', () => {
    let state: GestureState = INITIAL_GESTURE_STATE;
    state = dispatch(
      state,
      { type: 'pointer-down', pointerId: 1, point: { x: 0, y: 0 }, pointerType: 'touch' },
      AT_2X
    ).state;

    const move = dispatch(state, { type: 'pointer-move', pointerId: 1, point: { x: 2, y: 0 } }, AT_2X);
    expect(move.result).toBeNull();
    expect(move.state.didDrag).toBe(false);
  });

  test('rilascio dopo pan emette pan-end', () => {
    let state: GestureState = INITIAL_GESTURE_STATE;
    state = dispatch(
      state,
      { type: 'pointer-down', pointerId: 1, point: { x: 0, y: 0 }, pointerType: 'touch' },
      AT_2X
    ).state;
    state = dispatch(state, { type: 'pointer-move', pointerId: 1, point: { x: 30, y: 0 } }, AT_2X).state;

    const up = dispatch(state, { type: 'pointer-up', pointerId: 1, point: { x: 30, y: 0 }, timestamp: 0 }, AT_2X);
    expect(up.result).toEqual({ type: 'pan-end' });
    expect(up.state).toEqual(INITIAL_GESTURE_STATE);
  });
});

describe('swipe candidate (drag a scala 1×)', () => {
  test('drag touch a 1× emette drag-end con il delta grezzo', () => {
    let state: GestureState = INITIAL_GESTURE_STATE;
    state = dispatch(
      state,
      { type: 'pointer-down', pointerId: 1, point: { x: 0, y: 0 }, pointerType: 'touch' },
      AT_1X
    ).state;
    state = dispatch(state, { type: 'pointer-move', pointerId: 1, point: { x: -200, y: 5 } }, AT_1X).state;

    const up = dispatch(state, { type: 'pointer-up', pointerId: 1, point: { x: -200, y: 5 }, timestamp: 0 }, AT_1X);
    expect(up.result).toEqual({ type: 'drag-end', dx: -200, dy: 5 });
  });

  test('drag con mouse a 1× non emette drag-end (i mouse non swipano)', () => {
    let state: GestureState = INITIAL_GESTURE_STATE;
    state = dispatch(
      state,
      { type: 'pointer-down', pointerId: 1, point: { x: 0, y: 0 }, pointerType: 'mouse' },
      AT_1X
    ).state;
    state = dispatch(state, { type: 'pointer-move', pointerId: 1, point: { x: -200, y: 5 } }, AT_1X).state;

    const up = dispatch(state, { type: 'pointer-up', pointerId: 1, point: { x: -200, y: 5 }, timestamp: 0 }, AT_1X);
    expect(up.result).toBeNull();
  });
});

describe('tap / click → zoom-to', () => {
  test('click mouse a 1× risolve target 2×', () => {
    let state: GestureState = INITIAL_GESTURE_STATE;
    state = dispatch(
      state,
      { type: 'pointer-down', pointerId: 1, point: { x: 10, y: 20 }, pointerType: 'mouse' },
      AT_1X
    ).state;

    const up = dispatch(state, { type: 'pointer-up', pointerId: 1, point: { x: 10, y: 20 }, timestamp: 0 }, AT_1X);
    expect(up.result).toEqual({
      type: 'zoom-to',
      targetScale: 2,
      focalPoint: { x: 10, y: 20 },
      method: 'click',
    });
  });

  test('click mouse oltre 1× risolve reset a 1×', () => {
    let state: GestureState = INITIAL_GESTURE_STATE;
    state = dispatch(
      state,
      { type: 'pointer-down', pointerId: 1, point: { x: 10, y: 20 }, pointerType: 'mouse' },
      AT_2X
    ).state;

    const up = dispatch(state, { type: 'pointer-up', pointerId: 1, point: { x: 10, y: 20 }, timestamp: 0 }, AT_2X);
    expect(up.result).toMatchObject({ type: 'zoom-to', targetScale: 1, method: 'click' });
  });

  test('singolo tap touch non risolve nulla, registra solo lastTap', () => {
    let state: GestureState = INITIAL_GESTURE_STATE;
    state = dispatch(
      state,
      { type: 'pointer-down', pointerId: 1, point: { x: 0, y: 0 }, pointerType: 'touch' },
      AT_1X
    ).state;

    const up = dispatch(state, { type: 'pointer-up', pointerId: 1, point: { x: 0, y: 0 }, timestamp: 1000 }, AT_1X);
    expect(up.result).toBeNull();
    expect(up.state.lastTap).toEqual({ time: 1000, x: 0, y: 0 });
  });

  test('double tap touch entro soglia risolve zoom-to', () => {
    let state: GestureState = INITIAL_GESTURE_STATE;
    state = dispatch(
      state,
      { type: 'pointer-down', pointerId: 1, point: { x: 0, y: 0 }, pointerType: 'touch' },
      AT_1X
    ).state;
    state = dispatch(state, { type: 'pointer-up', pointerId: 1, point: { x: 0, y: 0 }, timestamp: 1000 }, AT_1X)
      .state;

    state = dispatch(
      state,
      { type: 'pointer-down', pointerId: 2, point: { x: 5, y: 5 }, pointerType: 'touch' },
      AT_1X
    ).state;
    const up = dispatch(state, { type: 'pointer-up', pointerId: 2, point: { x: 5, y: 5 }, timestamp: 1150 }, AT_1X);

    expect(up.result).toEqual({
      type: 'zoom-to',
      targetScale: 2,
      focalPoint: { x: 5, y: 5 },
      method: 'double-tap',
    });
  });

  test('secondo tap oltre la finestra temporale non è double tap', () => {
    let state: GestureState = INITIAL_GESTURE_STATE;
    state = dispatch(
      state,
      { type: 'pointer-down', pointerId: 1, point: { x: 0, y: 0 }, pointerType: 'touch' },
      AT_1X
    ).state;
    state = dispatch(state, { type: 'pointer-up', pointerId: 1, point: { x: 0, y: 0 }, timestamp: 0 }, AT_1X).state;

    state = dispatch(
      state,
      { type: 'pointer-down', pointerId: 2, point: { x: 0, y: 0 }, pointerType: 'touch' },
      AT_1X
    ).state;
    const up = dispatch(state, { type: 'pointer-up', pointerId: 2, point: { x: 0, y: 0 }, timestamp: 5000 }, AT_1X);

    expect(up.result).toBeNull();
  });
});

describe('eventi orfani', () => {
  test('pointer-move per un pointerId sconosciuto è un no-op', () => {
    const move = dispatch(INITIAL_GESTURE_STATE, { type: 'pointer-move', pointerId: 99, point: { x: 0, y: 0 } }, AT_1X);
    expect(move.result).toBeNull();
    expect(move.state).toEqual(INITIAL_GESTURE_STATE);
  });

  test('pointer-up per un pointerId sconosciuto è un no-op', () => {
    const up = dispatch(
      INITIAL_GESTURE_STATE,
      { type: 'pointer-up', pointerId: 99, point: { x: 0, y: 0 }, timestamp: 0 },
      AT_1X
    );
    expect(up.result).toBeNull();
    expect(up.state).toEqual(INITIAL_GESTURE_STATE);
  });

  test('pointer-cancel per un pointerId sconosciuto è un no-op', () => {
    const cancel = dispatch(INITIAL_GESTURE_STATE, { type: 'pointer-cancel', pointerId: 99 }, AT_1X);
    expect(cancel.result).toBeNull();
    expect(cancel.state).toEqual(INITIAL_GESTURE_STATE);
  });
});
