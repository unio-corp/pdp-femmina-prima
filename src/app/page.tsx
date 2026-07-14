import { ProductGallery } from '@/components/gallery/ProductGallery';
import { mapProductImages } from '@/lib/gallery-adapter';
import { PRODUCT } from '@/lib/constants';
import { EngagementGrid } from '@/components/sections/EngagementGrid';
import { ProductInfo } from '@/components/sections/ProductInfo';
import { DuoCTA } from '@/components/sections/DuoCTA';
import { RecentlyViewed } from '@/components/sections/RecentlyViewed';
import { StickyBar } from '@/components/layout/StickyBar';

export default function Home() {
  return (
    <>
      <ProductGallery images={mapProductImages(PRODUCT)} productName={PRODUCT.name} />

      <section style={{ minHeight: '100vh' }}>
        <EngagementGrid />
      </section>

      <section style={{ minHeight: '100vh' }}>
        <ProductInfo />
      </section>

      <DuoCTA />

      <section style={{ minHeight: '100vh', paddingTop: 'var(--sticky-bar-h)' }}>
        <RecentlyViewed />
      </section>

      <StickyBar />
    </>
  );
}
