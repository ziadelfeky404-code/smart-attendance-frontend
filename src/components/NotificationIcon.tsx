import React from 'react'

type Props = {
  count?: number
}

export const NotificationIcon: React.FC<Props> = ({ count = 0 }) => {
  return (
    <div style={styles.container} aria-label="Notifications">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.icon}>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {count > 0 && (
        <span style={styles.badge}>{count}</span>
      )}
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
  },
  icon: {
    color: '#374151',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    background: '#ef4444',
    color: '#fff',
    borderRadius: 999,
    padding: '2px 6px',
    fontSize: 11,
  },
}
