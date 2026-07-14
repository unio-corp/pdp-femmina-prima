import type { Metadata, Viewport } from 'next';
import { Header } from '@/components/layout/Header';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Footer } from '@/components/layout/Footer';
import '@/styles/globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: 'Giacca in mohair e lana — Double black · Bottega Veneta',
  description:
    'Giacca in tela di lana e morbido mohair, con revers in seta motivo Intrecciato. Novità, pre-ordina ora.',
  keywords: ['giacca', 'mohair', 'bottega veneta', 'abbigliamento', 'moda', 'lusso'],
  openGraph: {
    title: 'Giacca in mohair e lana',
    description:
      'Giacca in tela di lana e morbido mohair, con revers in seta motivo Intrecciato.',
    type: 'website',
    url: 'https://example.com/products/jacket-001',
    locale: 'it_IT',
    images: [
      {
        url: 'https://example.com/uploads/01-mode.jpg',
        width: 1200,
        height: 1200,
        alt: 'Giacca in mohair e lana',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Giacca in mohair e lana',
    description: 'Giacca in tela di lana e morbido mohair.',
    images: ['https://example.com/uploads/01-mode.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: 'https://example.com/products/jacket-001',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Breadcrumbs />
        <Footer />
      </body>
    </html>
  );
}
