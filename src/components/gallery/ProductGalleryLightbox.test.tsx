import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductGalleryLightbox } from './ProductGalleryLightbox';
import type { ProductGalleryImage } from './types';

const IMAGES: readonly ProductGalleryImage[] = [
  { id: 'img-1', src: '/uploads/01.webp', zoomSrc: '/uploads/01.webp', alt: 'Prima immagine', width: 800, height: 1000 },
  { id: 'img-2', src: '/uploads/02.webp', zoomSrc: '/uploads/02.webp', alt: 'Seconda immagine', width: 800, height: 1000 },
  { id: 'img-3', src: '/uploads/03.webp', zoomSrc: '/uploads/03.webp', alt: 'Terza immagine', width: 800, height: 1000 },
];

function renderLightbox(overrides?: Partial<{ initialIndex: number }>) {
  const onEvent = vi.fn();
  const onClose = vi.fn();
  render(
    <ProductGalleryLightbox
      images={IMAGES}
      productName="Giacca"
      initialIndex={overrides?.initialIndex ?? 0}
      onEvent={onEvent}
      onClose={onClose}
    />
  );
  return { onEvent, onClose };
}

describe('ProductGalleryLightbox', () => {
  it('apre il dialog con showModal(), sposta il focus sul pulsante chiudi ed emette open una sola volta', async () => {
    const { onEvent } = renderLightbox();

    const dialog = screen.getByRole('dialog', { hidden: true });
    await waitFor(() => expect(dialog).toHaveAttribute('open'));

    const closeButton = screen.getByRole('button', { name: 'Chiudi galleria' });
    await waitFor(() => expect(closeButton).toHaveFocus());

    const openEvents = onEvent.mock.calls.filter(([event]) => event.type === 'open');
    expect(openEvents).toHaveLength(1);
    expect(openEvents[0][0]).toMatchObject({ type: 'open', index: 0, mediaId: 'img-1' });
  });

  it('chiude cliccando il pulsante ed emette close una sola volta', async () => {
    const user = userEvent.setup();
    const { onEvent, onClose } = renderLightbox();

    await user.click(screen.getByRole('button', { name: 'Chiudi galleria' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    const closeEvents = onEvent.mock.calls.filter(([event]) => event.type === 'close');
    expect(closeEvents).toHaveLength(1);
    expect(closeEvents[0][0]).toMatchObject({ type: 'close', index: 0, mediaId: 'img-1' });
  });

  it('chiude su Escape (evento cancel nativo del dialog) senza doppia emissione', async () => {
    const { onEvent, onClose } = renderLightbox();
    const dialog = screen.getByRole('dialog', { hidden: true });

    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));

    expect(onClose).toHaveBeenCalledTimes(1);
    const closeEvents = onEvent.mock.calls.filter(([event]) => event.type === 'close');
    expect(closeEvents).toHaveLength(1);
  });

  it('chiude al tap sul backdrop ma non se il pointerdown/up avviene su un elemento interno', async () => {
    const { onClose } = renderLightbox();
    const dialog = screen.getByRole('dialog', { hidden: true });
    const closeButton = screen.getByRole('button', { name: 'Chiudi galleria' });

    // pointerdown/up su un elemento interno (bottone): nessuna chiusura da backdrop.
    closeButton.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, clientX: 10, clientY: 10 })
    );
    closeButton.dispatchEvent(
      new PointerEvent('pointerup', { bubbles: true, clientX: 10, clientY: 10 })
    );
    expect(onClose).not.toHaveBeenCalled();

    // pointerdown/up direttamente sul backdrop (il dialog stesso), sotto la soglia di tap.
    dialog.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, clientX: 50, clientY: 50 })
    );
    dialog.dispatchEvent(
      new PointerEvent('pointerup', { bubbles: true, clientX: 51, clientY: 51 })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('naviga con le frecce da tastiera aggiornando indice e contatore, senza superare gli estremi', async () => {
    const { onEvent } = renderLightbox();
    const dialog = screen.getByRole('dialog', { hidden: true });

    dialog.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
    );
    await waitFor(() =>
      expect(screen.getByText('2 / 3', { selector: '.visuallyHidden, span' })).toBeTruthy()
    );

    const navigateEvents = onEvent.mock.calls
      .map(([event]) => event)
      .filter((event) => event.type === 'navigate');
    expect(navigateEvents).toEqual([{ type: 'navigate', from: 0, to: 1, method: 'keyboard' }]);

    dialog.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true })
    );
    dialog.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
    );

    // 'End' porta da 1 a 2 (ultimo indice); la successiva ArrowRight non
    // emette nulla perché è già al limite (target === from).
    const lastNavigate = onEvent.mock.calls
      .map(([event]) => event)
      .filter((event) => event.type === 'navigate')
      .at(-1);
    expect(lastNavigate).toMatchObject({ from: 1, to: 2 });
  });

  it('mostra lo stato di errore e non chiude il dialog se showModal() lancia', async () => {
    const dialogProto = HTMLDialogElement.prototype;
    const original = dialogProto.showModal;
    dialogProto.showModal = () => {
      throw new DOMException('InvalidStateError');
    };

    const onEvent = vi.fn();
    const onClose = vi.fn();
    render(
      <ProductGalleryLightbox
        images={IMAGES}
        productName="Giacca"
        initialIndex={0}
        onEvent={onEvent}
        onClose={onClose}
      />
    );

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    const errorEvents = onEvent.mock.calls
      .map(([event]) => event)
      .filter((event) => event.type === 'error');
    expect(errorEvents).toHaveLength(1);
    expect(errorEvents[0]).toMatchObject({ type: 'error', index: 0, mediaId: 'img-1', source: 'lightbox' });

    dialogProto.showModal = original;
  });

  it('chiude con Escape correttamente anche mentre zoomata, senza doppia emissione close', async () => {
    const { onEvent, onClose } = renderLightbox();
    const dialog = screen.getByRole('dialog', { hidden: true });

    // Zoom in via scorciatoia da tastiera ('+' → zoomSurfaceRef.current.zoomIn).
    dialog.dispatchEvent(
      new KeyboardEvent('keydown', { key: '+', bubbles: true, cancelable: true })
    );

    await waitFor(() => {
      const zoomEvents = onEvent.mock.calls.map(([event]) => event).filter((e) => e.type === 'zoom');
      expect(zoomEvents.length).toBeGreaterThan(0);
    });

    // Escape mentre lo stato è zoomato: chiusura pulita, un solo evento close.
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));

    expect(onClose).toHaveBeenCalledTimes(1);
    const closeEvents = onEvent.mock.calls.map(([event]) => event).filter((e) => e.type === 'close');
    expect(closeEvents).toHaveLength(1);
  });
});
