import React from 'react'
import Link from 'next/link'

type Props = {
  children: React.ReactNode
  role?: string
}

const DashboardLayout: React.FC<Props> = ({ children, role = 'student' }) => {
  // Simple role-based left navigation
  const menu = [
    { path: '/', label: 'Dashboard' },
    { path: '/notifications', label: 'Notifications' },
    { path: '/profile', label: 'Profile' },
  ]

  return (
    <div style={styles.wrapper}>
      <aside style={styles.sidebar} aria-label="Sidebar">
        <div style={styles.brand}>CampusMind</div>
        <nav style={styles.menu}>
          {menu.map((m) => (
            <Link href={m.path} key={m.label}>
              <a style={styles.menuItem}>{m.label}</a>
            </Link>
          ))}
        </nav>
        <div style={styles.role}>Role: {role}</div>
      </aside>
      <main style={styles.content}>{children}</main>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
  },
  sidebar: {
    width: 240,
    borderRight: '1px solid #e5e7eb',
    padding: '16px',
    background: '#f8fafc',
    boxSizing: 'border-box',
  },
  brand: { fontWeight: 700, marginBottom: 12, fontSize: 16 },
  menu: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 },
  menuItem: { padding: '8px 12px', borderRadius: 6, color: '#374151', textDecoration: 'none' },
  content: {
    flex: 1,
    padding: '24px 32px',
  },
  role: { marginTop: 16, fontSize: 12, color: '#6b7280' },
};

export default DashboardLayout
