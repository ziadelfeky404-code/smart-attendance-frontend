import { Notification } from '../types/Notification'
import { apiFetch } from '../utils/api'

type NotificationsResponse = {
  items: Notification[]
  total: number
  page: number
  pageSize: number
}

export async function getNotifications(params: {
  page?: number
  pageSize?: number
  unreadOnly?: boolean
  role?: string
  type?: string
  dateFrom?: string
  dateTo?: string
}): Promise<NotificationsResponse> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 5
  const q = new URLSearchParams()
  q.append('page', String(page))
  q.append('pageSize', String(pageSize))
  if (params.unreadOnly) q.append('unread', 'true')
  if (params.type) q.append('type', params.type)
  if (params.dateFrom) q.append('dateFrom', params.dateFrom)
  if (params.dateTo) q.append('dateTo', params.dateTo)
  if (params.role) q.append('role', params.role)

  const resp = await apiFetch<NotificationsResponse>(`/api/notifications?${q.toString()}`)
  return resp
}

export async function getUnreadCount(): Promise<number> {
  const resp = await apiFetch<{ count: number }>(`/api/notifications/unread-count`)
  return resp?.count ?? 0
}

export async function readNotification(id: string): Promise<void> {
  await apiFetch<void>(`/api/notifications/${id}/read`, { method: 'PATCH' })
}

export async function readAllNotifications(): Promise<void> {
  await apiFetch<void>(`/api/notifications/read-all`, { method: 'PATCH' })
}

export async function deleteNotification(id: string): Promise<void> {
  await apiFetch<void>(`/api/notifications/${id}`, { method: 'DELETE' })
}
