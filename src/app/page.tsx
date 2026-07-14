import { ProductGallery } from '@/components/gallery/ProductGallery';
import { PRODUCT, ENGAGEMENT_IMAGES, DUO_CTA, RECENTLY_VIEWED, STICKY_BAR_CTA } from '@/lib/constants';
import { EngagementGrid } from '@/components/sections/EngagementGrid';
import { ProductInfo } from '@/components/sections/ProductInfo';
import { DuoCTA } from '@/components/sections/DuoCTA';
import { RecentlyViewed } from '@/components/sections/RecentlyViewed';
import { StickyBar } from '@/components/layout/StickyBar';

export default function Home() {
  return (
    <>
      <ProductGallery images={PRODUCT.images} productName={PRODUCT.name} />

      <section style={{ minHeight: '100vh' }}>
        <EngagementGrid images={ENGAGEMENT_IMAGES} />
      </section>

      <section style={{ minHeight: '100vh' }}>
        <ProductInfo product={PRODUCT} />
      </section>

      <DuoCTA content={DUO_CTA} />

      <section style={{ minHeight: '100vh', paddingTop: 'var(--sticky-bar-h)' }}>
        <RecentlyViewed items={RECENTLY_VIEWED} />
      </section>

      <StickyBar product={PRODUCT} ctaLabel={STICKY_BAR_CTA} />
    </>
  );
}
