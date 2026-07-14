export type ProductGalleryImage = Readonly<{
  id: string;
  src: string;
  zoomSrc?: string;
  alt: string;
  width: number;
  height: number;
  blurDataURL?: string;
  dominantColor?: string;
}>;

export type ProductGalleryEvent =
  | { type: 'open'; index: number; mediaId: string }
  | { type: 'close'; index: number; mediaId: string }
  | {
      type: 'navigate';
      from: number;
      to: number;
      method: 'swipe' | 'button' | 'keyboard';
    }
  | {
      type: 'zoom';
      index: number;
      scale: number;
      method: 'click' | 'double-tap' | 'pinch' | 'button' | 'wheel' | 'keyboard';
    }
  | {
      type: 'error';
      index: number;
      mediaId: string;
      source: 'inline' | 'lightbox';
    };

export type ProductGalleryProps = Readonly<{
  images: readonly ProductGalleryImage[];
  productName: string;
  initialIndex?: number;
  className?: string;
  onEvent?: (event: ProductGalleryEvent) => void;
}>;
