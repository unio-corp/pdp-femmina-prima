import type { Metadata, Viewport } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import '@/styles/globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: 'Giacca in mohair e lana — Double black · Bottega Veneta',
  description:
    'Giacca in tela di lana e morbido mohair, con revers in seta motivo Intrecciato. Novità, pre-ordina ora.',
  keywords: ['giacca', 'mohair', 'bottega veneta', 'abbigliamento', 'moda'],
  openGraph: {
    title: 'Giacca in mohair e lana',
    description:
      'Giacca in tela di lana e morbido mohair, con revers in seta motivo Intrecciato.',
    type: 'website',
    locale: 'it_IT',
  },
  robots: {
    index: true,
    follow: true,
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
        <Footer />
      </body>
    </html>
  );
}
