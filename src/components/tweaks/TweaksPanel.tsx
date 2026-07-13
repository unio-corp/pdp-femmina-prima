'use client';

import { useEffect, useState } from 'react';
import styles from './TweaksPanel.module.css';

interface TweakState {
  itemsPerView: string;
  scrollSnap: boolean;
  showArrows: boolean;
  ctaColor: string;
  showNavHeader: boolean;
  showPGPP: boolean;
  showProductInfo: boolean;
  showSGPP: boolean;
  showDuoCTA: boolean;
  showStickyBar: boolean;
  showSiteFooter: boolean;
}

const DEFAULTS: TweakState = {
  itemsPerView: '2',
  scrollSnap: true,
  showArrows: false,
  ctaColor: '#000000',
  showNavHeader: true,
  showPGPP: true,
  showProductInfo: true,
  showSGPP: true,
  showDuoCTA: true,
  showStickyBar: true,
  showSiteFooter: true,
};

export function TweaksPanel() {
  const [tweaks, setTweaks] = useState<TweakState>(DEFAULTS);
  const [isOpen, setIsOpen] = useState(false);

  const setTweak = <K extends keyof TweakState>(key: K, value: TweakState[K]) => {
    setTweaks((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    document.documentElement.style.setProperty('--cta-color', tweaks.ctaColor);

    const nav = document.querySelector('header');
    if (nav) nav.style.display = tweaks.showNavHeader ? '' : 'none';
  }, [tweaks]);

  if (!isOpen) {
    return (
      <button
        className={styles.toggle}
        onClick={() => setIsOpen(true)}
        title="Open Tweaks Panel (Dev Only)"
      >
        ⚙️
      </button>
    );
  }

  return (
    <div className={styles.panel}>
      <button className={styles.close} onClick={() => setIsOpen(false)}>
        ✕
      </button>
      <h3>Tweaks (Dev)</h3>

      <label>
        Items per view:
        <select value={tweaks.itemsPerView} onChange={(e) => setTweak('itemsPerView', e.target.value)}>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
        </select>
      </label>

      <label>
        <input
          type="checkbox"
          checked={tweaks.scrollSnap}
          onChange={(e) => setTweak('scrollSnap', e.target.checked)}
        />
        Scroll snap
      </label>

      <label>
        <input
          type="checkbox"
          checked={tweaks.showArrows}
          onChange={(e) => setTweak('showArrows', e.target.checked)}
        />
        Show arrows
      </label>

      <label>
        CTA Color:
        <input
          type="color"
          value={tweaks.ctaColor}
          onChange={(e) => setTweak('ctaColor', e.target.value)}
        />
      </label>

      <hr />

      <label>
        <input
          type="checkbox"
          checked={tweaks.showNavHeader}
          onChange={(e) => setTweak('showNavHeader', e.target.checked)}
        />
        Show nav header
      </label>

      <label>
        <input
          type="checkbox"
          checked={tweaks.showPGPP}
          onChange={(e) => setTweak('showPGPP', e.target.checked)}
        />
        Show gallery (PGPP)
      </label>

      <label>
        <input
          type="checkbox"
          checked={tweaks.showProductInfo}
          onChange={(e) => setTweak('showProductInfo', e.target.checked)}
        />
        Show product info
      </label>

      <label>
        <input
          type="checkbox"
          checked={tweaks.showSGPP}
          onChange={(e) => setTweak('showSGPP', e.target.checked)}
        />
        Show engagement (SGPP)
      </label>

      <label>
        <input
          type="checkbox"
          checked={tweaks.showDuoCTA}
          onChange={(e) => setTweak('showDuoCTA', e.target.checked)}
        />
        Show duo CTA
      </label>

      <label>
        <input
          type="checkbox"
          checked={tweaks.showStickyBar}
          onChange={(e) => setTweak('showStickyBar', e.target.checked)}
        />
        Show sticky bar
      </label>

      <label>
        <input
          type="checkbox"
          checked={tweaks.showSiteFooter}
          onChange={(e) => setTweak('showSiteFooter', e.target.checked)}
        />
        Show footer
      </label>
    </div>
  );
}
