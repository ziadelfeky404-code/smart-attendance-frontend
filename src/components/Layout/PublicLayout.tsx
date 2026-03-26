import React from 'react'
import Link from 'next/link'
import { NotificationIcon } from '../NotificationIcon'

type Props = {
  children: React.ReactNode
}

const PublicLayout: React.FC<Props> = ({ children }) => {
  // For the public layout, we fetch unread count and render a simple header with links
  // In a real app this could be fed from a global store or context
  const [count, setCount] = React.useState<number>(0)

  React.useEffect(() => {
    // Lazy fetch of unread count; ignore errors in public layout
    fetch('/api/notifications/unread-count')
      .then(res => res.ok ? res.json() : { count: 0 })
      .then((data: any) => setCount(data?.count ?? 0))
      .catch(() => setCount(0))
  }, [])

  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <div style={styles.brand}>
          <Link href="/">
            <a style={styles.brandLink}>CampusMind</a>
          </Link>
        </div>
        <nav style={styles.nav} aria-label="Main navigation">
          <Link href="/"><a style={styles.navLink}>Home</a></Link>
          <Link href="/about"><a style={styles.navLink}>About</a></Link>
          <Link href="/features"><a style={styles.navLink}>Features</a></Link>
          <Link href="/contact"><a style={styles.navLink}>Contact</a></Link>
          <Link href="/login"><a style={styles.navLink}>Login</a></Link>
        </nav>
        <div style={styles.actions}>
          <NotificationIcon count={count} />
        </div>
      </header>
      <main style={styles.main}>{children}</main>
      <footer style={styles.footer}>
        <div>© {new Date().getFullYear()} CampusMind. All rights reserved.</div>
      </footer>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    fontFamily: 'Inter, Roboto, Arial, sans-serif',
    color: '#1f2937',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 28px',
    borderBottom: '1px solid #e5e7eb',
    position: 'sticky',
    top: 0,
    background: '#fff',
    zIndex: 10,
  },
  brand: { display: 'flex', alignItems: 'center' },
  brandLink: { fontSize: 20, fontWeight: 700, color: '#111827', textDecoration: 'none' },
  nav: { display: 'flex', gap: 20, alignItems: 'center' },
  navLink: { color: '#374151', textDecoration: 'none', fontSize: 14 },
  actions: { display: 'flex', alignItems: 'center', gap: 12 },
  main: { flex: 1, padding: '40px 24px', maxWidth: 1100, margin: '0 auto' },
  footer: { padding: '20px 24px', textAlign: 'center', borderTop: '1px solid #e5e7eb', color: '#6b7280' },
};

export default PublicLayout
