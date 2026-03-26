export type NotificationType = 'info' | 'warning' | 'success' | 'error' | 'message'

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  createdAt: string
  read: boolean
  link?: string | null
}
