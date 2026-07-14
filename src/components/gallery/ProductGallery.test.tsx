import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductGallery } from './ProductGallery';
import type { ProductGalleryImage } from './types';

const IMAGES: readonly ProductGalleryImage[] = [
  { id: 'img-1', src: '/uploads/01.webp', alt: 'Prima immagine', width: 800, height: 1000 },
  { id: 'img-2', src: '/uploads/02.webp', alt: 'Seconda immagine', width: 800, height: 1000 },
  { id: 'img-3', src: '/uploads/03.webp', alt: 'Terza immagine', width: 800, height: 1000 },
];

function mockSlideOffsets(offsets: readonly number[]) {
  const items = screen.getAllByRole('listitem');
  items.forEach((li, index) => {
    Object.defineProperty(li, 'offsetLeft', { value: offsets[index], configurable: true });
  });
}

describe('ProductGallery — step() attraverso l\'interfaccia Slide', () => {
  it('"successiva" scrolla il contenitore all\'offsetLeft dello slide target, non un valore letto altrove', async () => {
    const user = userEvent.setup();
    render(<ProductGallery images={IMAGES} productName="Giacca" />);

    mockSlideOffsets([0, 400, 800]);
    const list = screen.getByRole('list');
    const scrollTo = vi.fn();
    Object.defineProperty(list, 'scrollTo', { value: scrollTo, configurable: true });

    await user.click(screen.getByRole('button', { name: 'Immagine successiva' }));

    expect(scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ left: 400 })
    );
  });

  it('non scrolla oltre l\'ultimo slide (clamp al limite)', async () => {
    const user = userEvent.setup();
    render(<ProductGallery images={IMAGES} productName="Giacca" initialIndex={2} />);

    mockSlideOffsets([0, 400, 800]);
    const list = screen.getByRole('list');
    const scrollTo = vi.fn();
    Object.defineProperty(list, 'scrollTo', { value: scrollTo, configurable: true });

    await user.click(screen.getByRole('button', { name: 'Immagine successiva' }));

    expect(scrollTo).not.toHaveBeenCalled();
  });
});

describe('ProductGallery — focus-return dalla lightbox attraverso l\'interfaccia Slide', () => {
  it('alla chiusura della lightbox il focus torna al trigger che l\'ha aperta, non a un nodo qualsiasi', async () => {
    const user = userEvent.setup();
    render(<ProductGallery images={IMAGES} productName="Giacca" />);

    const secondTrigger = screen.getByRole('button', { name: /Apri immagine 2 di 3/ });
    await user.click(secondTrigger);

    const closeButton = await screen.findByRole('button', { name: 'Chiudi galleria' });
    await user.click(closeButton);

    await waitFor(() => expect(secondTrigger).toHaveFocus());
  });
});
