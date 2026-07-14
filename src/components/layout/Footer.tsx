import Link from 'next/link';
import { FOOTER_TEXT } from '@/lib/constants';
import styles from './Footer.module.css';

export function Footer() {
  return (
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
  );
}
