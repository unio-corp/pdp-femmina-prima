import type { ProductGalleryImage } from '../types';

/** Normalizza un indice della lightbox nell'intervallo disponibile. */
export function clampLightboxIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(Math.max(Math.trunc(index), 0), total - 1);
}

/**
 * Indice risultante da un passo precedente/successiva. Nessun loop:
 * oltre gli estremi restituisce l'indice corrente.
 */
export function stepLightboxIndex(index: number, direction: 1 | -1, total: number): number {
  return clampLightboxIndex(index + direction, total);
}

/** Solo gli indici adiacenti esistenti: index - 1 e index + 1 (spec §5.5). */
export function getAdjacentIndexes(index: number, total: number): readonly number[] {
  const adjacent: number[] = [];
  if (index - 1 >= 0) adjacent.push(index - 1);
  if (index + 1 <= total - 1) adjacent.push(index + 1);
  return adjacent;
}

export function canNavigate(index: number, direction: 1 | -1, total: number): boolean {
  return stepLightboxIndex(index, direction, total) !== index;
}

/** Asset ad alta risoluzione: zoomSrc è obbligatorio (ripete src se non esiste una variante HD). */
export function lightboxSrc(image: ProductGalleryImage): string {
  return image.zoomSrc;
}

export function mediaIdAt(images: readonly ProductGalleryImage[], index: number): string {
  return images[clampLightboxIndex(index, images.length)]?.id ?? '';
}
