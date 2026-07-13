'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { NAV_LINKS } from '@/lib/constants';
import styles from './Header.module.css';

export function Header() {
  const navRef = useRef<HTMLElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [lastY, setLastY] = useState(0);
  const [ticking, setTicking] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const y = window.scrollY;
          setIsScrolled(y > 12);

          const delta = y - lastY;
          if (y > 80 && delta > 4) {
            setIsHidden(true);
          } else if (delta < -4 || y <= 80) {
            setIsHidden(false);
          }

          setLastY(y);
          setTicking(false);
        });
        setTicking(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastY, ticking]);

  return (
    <header
      ref={navRef}
      className={`${styles.navHeader} ${isScrolled ? styles.scrolled : ''} ${isHidden ? styles.hidden : ''}`}
    >
      <nav className={styles.navBar}>
        <div className={styles.navList}>
          {NAV_LINKS.map((link) => (
            <Link key={link.label} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
        <div className={styles.navLogo}>BOTTEGA VENETA</div>
        <div className={styles.navActions}>
          <button aria-label="Cerca">🔍</button>
          <button aria-label="Account">👤</button>
          <button aria-label="Carrello">🛒</button>
        </div>
      </nav>
    </header>
  );
}
