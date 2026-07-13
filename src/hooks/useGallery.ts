import { useCallback, useEffect, useRef, useState } from 'react';

export function useGallery(itemCount: number) {
  const galleryRef = useRef<HTMLUListElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPrev, setShowPrev] = useState(false);
  const [showNext, setShowNext] = useState(itemCount > 1);

  const updateVisibility = useCallback(() => {
    if (!galleryRef.current) return;

    const scrollLeft = galleryRef.current.scrollLeft;
    const maxScroll = galleryRef.current.scrollWidth - galleryRef.current.clientWidth;

    setShowPrev(scrollLeft > 4);
    setShowNext(scrollLeft < maxScroll - 4);
  }, []);

  const step = useCallback(
    (dir: 1 | -1) => {
      if (!galleryRef.current) return;

      const items = Array.from(galleryRef.current.querySelectorAll('li'));
      if (!items.length) return;

      const scrollLeft = galleryRef.current.scrollLeft;
      let idx = 0;

      items.forEach((li, i) => {
        if (li.offsetLeft <= scrollLeft + 4) idx = i;
      });

      const target = Math.max(0, Math.min(items.length - 1, idx + dir));
      setCurrentIndex(target);
      items[target].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    },
    []
  );

  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return;

    gallery.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('resize', updateVisibility);
    updateVisibility();

    return () => {
      gallery.removeEventListener('scroll', updateVisibility);
      window.removeEventListener('resize', updateVisibility);
    };
  }, [updateVisibility]);

  return { galleryRef, currentIndex, showPrev, showNext, step };
}
