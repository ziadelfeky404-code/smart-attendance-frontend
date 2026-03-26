import React from 'react'
import {
  getNotifications as apiGetNotifications,
  readNotification as apiReadNotification,
  readAllNotifications as apiReadAllNotifications,
  deleteNotification as apiDeleteNotification,
} from '../api/notifications'
import { Notification } from '../types/Notification'

type Props = {
  role?: string
}

// Lightweight wrapper around API-driven notifications list
export const NotificationsPanel: React.FC<Props> = ({ role = 'student' }) => {
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [loading, setLoading] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string | null>(null)
  const [page, setPage] = React.useState<number>(1)
  const [pageSize, setPageSize] = React.useState<number>(5)
  const [total, setTotal] = React.useState<number>(0)
  const [unreadOnly, setUnreadOnly] = React.useState<boolean>(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const resp = await (apiGetNotifications as any)({ page, pageSize, unreadOnly, role })
      const items = resp?.items ?? []
      setNotifications(items)
      setTotal(resp?.total ?? 0)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    load()
  }, [page, pageSize, unreadOnly, role])

  const markRead = async (id: string) => {
    try {
      await (apiReadNotification as any)(id)
      await load()
    } catch {
      // ignore
    }
  }

  const markAll = async () => {
    try {
      await (apiReadAllNotifications as any)()
      await load()
    } catch {
      // ignore
    }
  }

  const remove = async (id: string) => {
    try {
      await (apiDeleteNotification as any)(id)
      await load()
    } catch {
      // ignore
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div>
      <div style={styles.controls}>
        <label style={styles.checkboxLabel}>
          <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} /> Unread only
        </label>
        <button style={styles.button} onClick={markAll} disabled={loading}>Mark all as read</button>
      </div>
      {loading && <div style={styles.message}>Loading notifications...</div>}
      {error && (
        <div style={styles.error}>
          <span>{error}</span>
          <button style={styles.btn} onClick={load}>Retry</button>
        </div>
      )}
      {!loading && !error && notifications.length === 0 && (
        <div style={styles.empty}>No notifications{unreadOnly ? ' (unread only)' : ''}.</div>
      )}
      <ul style={styles.list}>
        {notifications.map((n) => (
          <li key={n.id} style={styles.item}>
            <div style={styles.itemHeader}>
              <strong style={n.read ? styles.readTitle : styles.unreadTitle}>{n.title}</strong>
              <span style={styles.type}>{n.type}</span>
              <span style={styles.date}>{new Date(n.createdAt).toLocaleString()}</span>
            </div>
            <div style={styles.messageBlock}>{n.message}</div>
            {n.link && (
              <a href={n.link} style={styles.link}>Open</a>
            )}
            <div style={styles.actionsRow}>
              {!n.read && (
                <button style={styles.actionBtn} onClick={() => markRead(n.id)}>Mark as read</button>
              )}
              <button style={styles.actionBtn} onClick={() => remove(n.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
      <div style={styles.pagination}>
        <button style={styles.pageBtn} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
          Prev
        </button>
        <span style={styles.pageInfo}>Page {page} of {totalPages}</span>
        <button style={styles.pageBtn} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
          Next
        </button>
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  controls: { display: 'flex', gap: 12, alignItems: 'center', margin: '8px 0 12px' },
  checkboxLabel: { fontSize: 14, color: '#374151' },
  button: { padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff' },
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 },
  item: { padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' },
  itemHeader: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 },
  unreadTitle: { color: '#111' },
  readTitle: { color: '#6b7280' },
  type: { padding: '2px 6px', borderRadius: 4, background: '#f1f5f9', fontSize: 12 },
  date: { marginLeft: 'auto', fontSize: 12, color: '#6b7280' },
  messageBlock: { marginTop: 6, color: '#374151' },
  link: { display: 'inline-block', marginTop: 6, color: '#2563eb' },
  actionsRow: { display: 'flex', gap: 8, marginTop: 8 },
  actionBtn: { padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff' },
  pagination: { display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  pageBtn: { padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb' },
  pageInfo: { fontSize: 12, color: '#6b7280' },
  empty: { padding: 20, textAlign: 'center', color: '#6b7280' },
  error: { padding: 10, color: '#b91c1c' },
  btn: { marginLeft: 8, padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff' },
}
