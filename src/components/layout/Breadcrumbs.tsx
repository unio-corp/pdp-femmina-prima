import Link from 'next/link';
import { BREADCRUMBS } from '@/lib/constants';
import styles from './Breadcrumbs.module.css';

export function Breadcrumbs() {
  return (
    <nav className={styles.breadcrumbs}>
      {BREADCRUMBS.map((item, i) => (
        <span key={i} className={styles.breadcrumbItem}>
          {item.href ? <Link href={item.href}>{item.label}</Link> : <span>{item.label}</span>}
          {i < BREADCRUMBS.length - 1 && <span className={styles.sep}>&gt;</span>}
        </span>
      ))}
    </nav>
  );
}
