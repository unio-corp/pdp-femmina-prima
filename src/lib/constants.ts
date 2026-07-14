import type { Product, EngagementImage, RecentlyViewedItem, NavLink, Breadcrumb } from '@/types';

export const PRODUCT: Product = {
  id: 'jacket-001',
  name: 'Giacca in mohair e lana',
  price: 4200,
  color: 'Double black',
  description: 'Giacca in tela di lana e morbido mohair, con revers in seta motivo Intrecciato.',
  tag: 'Novità',
  preorderDate: '18 settembre',
  images: [
    { src: '/uploads/05-hd-zoom.jpg', alt: 'Giacca in mohair e lana — dettaglio HD', format: 'jpg', width: 2717, height: 3200 },
    { src: '/uploads/01-model.webp', alt: 'Giacca in mohair e lana — vista frontale', format: 'webp' },
    { src: '/uploads/02-model.webp', alt: 'Giacca in mohair e lana — vista laterale', format: 'webp' },
    { src: '/uploads/03-model.webp', alt: 'Giacca in mohair e lana — vista posteriore', format: 'webp' },
    { src: '/uploads/04-model.webp', alt: 'Giacca in mohair e lana — dettaglio revers', format: 'webp' },
    { src: '/uploads/05-hd-zoom.jpg', alt: 'Giacca in mohair e lana — dettaglio HD', format: 'jpg', width: 2717, height: 3200 },
  ],
};

export const ENGAGEMENT_IMAGES: EngagementImage[] = [
  { src: '/images/engagement-1.jpg', alt: 'Giacca — dettaglio posteriore' },
  { src: '/images/engagement-2.jpg', alt: 'Giacca — dettaglio laterale' },
  { src: '/images/engagement-3.jpg', alt: 'Giacca — dettaglio tessuto', isFullWidth: true },
];

export const RECENTLY_VIEWED: RecentlyViewedItem[] = [
  { name: 'Gonna in pelle', price: 2500, bgColor: '#f0ede8' },
  { name: 'Pantaloni in mohair', price: 1200, bgColor: '#e8e5e0' },
  { name: 'Camicia in seta', price: 980, bgColor: '#ebe8e3' },
  { name: 'Cintura Intrecciato', price: 650, bgColor: '#e3e0db' },
];

export const NAV_LINKS: NavLink[] = [
  { label: 'Novità', href: '/' },
  { label: 'Donna', href: '/' },
  { label: 'Uomo', href: '/' },
  { label: 'Borse', href: '/' },
  { label: 'Art of Living', href: '/' },
  { label: 'Fragranze', href: '/' },
  { label: 'Regali', href: '/' },
  { label: 'Craft in Motion', href: '/' },
];

export const BREADCRUMBS: Breadcrumb[] = [
  { label: 'Home', href: '/' },
  { label: 'Uomo', href: '/' },
  { label: 'Abbigliamento' },
];

export const DUO_CTA = {
  left: { label: 'Completa il look', bgColor: '#fff', textColor: '#000' },
  right: { label: 'Aggiungi al Carrello', price: '3.600€', bgColor: '#000', textColor: '#fff' },
};

export const FOOTER_TEXT = 'FEMMINA PRIME';
export const STICKY_BAR_CTA = 'Pre-ordina';
