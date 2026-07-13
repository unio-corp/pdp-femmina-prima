import Link from 'next/link';
import { BREADCRUMBS, FOOTER_TEXT } from '@/lib/constants';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <>
      <nav className={styles.breadcrumbs}>
        {BREADCRUMBS.map((item, i) => (
          <span key={i} className={styles.breadcrumbItem}>
            {item.href ? <Link href={item.href}>{item.label}</Link> : <span>{item.label}</span>}
            {i < BREADCRUMBS.length - 1 && <span className={styles.sep}>&gt;</span>}
          </span>
        ))}
      </nav>

      <footer className={styles.siteFooter}>
        <div className={styles.branding}>{FOOTER_TEXT}</div>
        <div className={styles.country}>
          <p>
            Spedire in: <Link href="#">Italia</Link>
          </p>
          <p>
            Lingua: <Link href="#">Italiano</Link>
          </p>
        </div>
      </footer>
    </>
  );
}
