export interface Product {
  id: string;
  name: string;
  price: number;
  color: string;
  description: string;
  tag: string;
  preorderDate: string;
  images: ProductImage[];
}

export interface ProductImage {
  src: string;
  alt: string;
  format: 'jpg' | 'webp';
  /** Dimensioni reali del file. Se assenti, l'adapter assume il packshot 4000x4000. */
  width?: number;
  height?: number;
}

export interface EngagementImage {
  src: string;
  alt: string;
  isFullWidth?: boolean;
}

export interface RecentlyViewedItem {
  name: string;
  price: number;
  bgColor: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface Breadcrumb {
  label: string;
  href?: string;
}

export interface DuoCtaCard {
  label: string;
  bgColor: string;
  textColor: string;
  price?: string;
}

export interface DuoCtaContent {
  left: DuoCtaCard;
  right: DuoCtaCard;
}
