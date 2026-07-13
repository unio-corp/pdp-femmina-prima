import { ProductGallery } from '@/components/sections/ProductGallery';
import { EngagementGrid } from '@/components/sections/EngagementGrid';
import { ProductInfo } from '@/components/sections/ProductInfo';
import { DuoCTA } from '@/components/sections/DuoCTA';
import { RecentlyViewed } from '@/components/sections/RecentlyViewed';
import { StickyBar } from '@/components/layout/StickyBar';

export default function Home() {
  return (
    <>
      <section style={{ minHeight: '100vh' }}>
        <ProductGallery />
      </section>

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
