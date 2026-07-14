import type { Product } from '@/types';
import type { ProductGalleryImage } from '@/components/gallery/types';

// Gli asset in public/uploads/0X-model.webp sono packshot quadrati 4000×4000.
const UPLOAD_WIDTH = 4000;
const UPLOAD_HEIGHT = 4000;

// Varianti ad alta risoluzione per la lightbox. Mappa esplicita: 04-zoom.jpg
// non esiste, quindi l'immagine 4 usa il fallback src previsto dal contratto.
const ZOOM_SOURCES: Readonly<Record<string, string>> = {
  '/uploads/01-model.webp': '/uploads/01-zoom.jpg',
  '/uploads/02-model.webp': '/uploads/02-zoom.jpg',
  '/uploads/03-model.webp': '/uploads/03-zoom.jpg',
};

/**
 * Adatta il tipo legacy ProductImage al contratto ProductGalleryImage
 * senza modificare i consumatori esistenti di PRODUCT.
 */
export function mapProductImages(product: Product): ProductGalleryImage[] {
  return product.images.map((image, index) => ({
    id: `${product.id}-media-${index + 1}`,
    src: image.src,
    zoomSrc: ZOOM_SOURCES[image.src],
    alt: image.alt,
    width: image.width ?? UPLOAD_WIDTH,
    height: image.height ?? UPLOAD_HEIGHT,
  }));
}
