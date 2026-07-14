import type { ProductGalleryImage } from '../types';

export const MAX_GALLERY_IMAGES = 20;

export type GalleryValidationIssue = Readonly<{
  code: 'empty' | 'too-many' | 'duplicate-id' | 'invalid-dimensions';
  message: string;
}>;

export type GalleryValidationResult = Readonly<{
  images: readonly ProductGalleryImage[];
  issues: readonly GalleryValidationIssue[];
}>;

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

/** Dimensioni sicure per next/image e aspect-ratio. */
export function hasValidDimensions(image: Pick<ProductGalleryImage, 'width' | 'height'>): boolean {
  return isPositiveInteger(image.width) && isPositiveInteger(image.height);
}

/**
 * Valida la raccolta senza mai rimuovere elementi (la numerazione deve
 * restare stabile), con la sola eccezione del limite massimo: oltre
 * MAX_GALLERY_IMAGES la lista viene troncata alle prime N.
 */
export function validateGalleryImages(
  images: readonly ProductGalleryImage[]
): GalleryValidationResult {
  const issues: GalleryValidationIssue[] = [];

  if (images.length === 0) {
    issues.push({ code: 'empty', message: 'ProductGallery: nessuna immagine ricevuta.' });
    return { images, issues };
  }

  let clamped = images;
  if (images.length > MAX_GALLERY_IMAGES) {
    issues.push({
      code: 'too-many',
      message: `ProductGallery: ricevute ${images.length} immagini, massimo ${MAX_GALLERY_IMAGES}. Mostrate solo le prime ${MAX_GALLERY_IMAGES}.`,
    });
    clamped = images.slice(0, MAX_GALLERY_IMAGES);
  }

  const seenIds = new Set<string>();
  for (const image of clamped) {
    if (seenIds.has(image.id)) {
      issues.push({
        code: 'duplicate-id',
        message: `ProductGallery: id duplicato "${image.id}".`,
      });
    }
    seenIds.add(image.id);

    if (!hasValidDimensions(image)) {
      issues.push({
        code: 'invalid-dimensions',
        message: `ProductGallery: dimensioni non valide per "${image.id}" (${image.width}×${image.height}).`,
      });
    }
  }

  return { images: clamped, issues };
}

export function normalizeInitialIndex(index: number | undefined, length: number): number {
  if (length <= 0 || index === undefined || Number.isNaN(index)) return 0;
  return Math.min(Math.max(Math.trunc(index), 0), length - 1);
}
