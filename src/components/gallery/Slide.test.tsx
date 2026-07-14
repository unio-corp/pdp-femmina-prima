import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Slide, type SlideHandle } from './Slide';
import type { ProductGalleryImage } from './types';

const IMAGE: ProductGalleryImage = {
  id: 'img-1',
  src: '/uploads/01.webp',
  alt: 'Prima immagine',
  width: 800,
  height: 1000,
};

describe('Slide', () => {
  it('getOffsetLeft riflette offsetLeft reale dell\'<li>, non un valore inventato', () => {
    const ref = createRef<SlideHandle>();
    render(
      <ul>
        <Slide
          ref={ref}
          image={IMAGE}
          index={0}
          total={3}
          productName="Giacca"
          isFullSpan={false}
          onActivate={vi.fn()}
          onError={vi.fn()}
        />
      </ul>
    );

    const li = screen.getByRole('listitem');
    Object.defineProperty(li, 'offsetLeft', { value: 340, configurable: true });

    expect(ref.current?.getOffsetLeft()).toBe(340);
  });

  it('getOffsetLeft torna 0 se il nodo non è (ancora) montato', () => {
    const ref = createRef<SlideHandle>();
    expect(ref.current).toBeNull();
    // Nessun mount: l'handle non esiste ancora, verificato dal null-check
    // che ProductGallery applica su slideRefs.current[index]?.getOffsetLeft().
  });

  it('focus() sposta il focus sul button interno, non su un nodo qualsiasi', async () => {
    const ref = createRef<SlideHandle>();
    render(
      <ul>
        <Slide
          ref={ref}
          image={IMAGE}
          index={0}
          total={3}
          productName="Giacca"
          isFullSpan={false}
          onActivate={vi.fn()}
          onError={vi.fn()}
        />
      </ul>
    );

    const button = screen.getByRole('button', { name: /Apri immagine 1 di 3/ });
    expect(button).not.toHaveFocus();

    ref.current?.focus();
    expect(button).toHaveFocus();
  });

  it('data-index resta sull\'<li> per l\'IntersectionObserver del genitore', () => {
    render(
      <ul>
        <Slide
          image={IMAGE}
          index={2}
          total={5}
          productName="Giacca"
          isFullSpan={false}
          onActivate={vi.fn()}
          onError={vi.fn()}
        />
      </ul>
    );

    expect(screen.getByRole('listitem')).toHaveAttribute('data-index', '2');
  });

  it('onActivate riceve il proprio index al click', async () => {
    const onActivate = vi.fn();
    render(
      <ul>
        <Slide
          image={IMAGE}
          index={4}
          total={5}
          productName="Giacca"
          isFullSpan={false}
          onActivate={onActivate}
          onError={vi.fn()}
        />
      </ul>
    );

    screen.getByRole('button', { name: /Apri immagine 5 di 5/ }).click();
    expect(onActivate).toHaveBeenCalledWith(4);
  });
});
