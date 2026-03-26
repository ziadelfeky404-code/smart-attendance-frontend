import React from 'react'
import DashboardLayout from '../../components/Layout/DashboardLayout'
import { NotificationsPanel } from '../../components/NotificationsPanel'

// Fallback: set role via localStorage, otherwise default to 'student'
const NotificationsPage: any = () => {
  // The pane renders via the shared NotificationsPanel component
  return (
    <div>
      <h2 style={{ margin: '0 0 12px' }}>Notifications</h2>
      <NotificationsPanel role={typeof window !== 'undefined' ? localStorage.getItem('cm_user_role') || 'student' : 'student'} />
    </div>
  )
}

export default NotificationsPage
NotificationsPage.getLayout = (page: React.ReactNode) => {
  const role = typeof window !== 'undefined' ? (localStorage.getItem('cm_user_role') || 'student') : 'student'
  // Use dashboard layout for protected area
  const Layout = DashboardLayout as any
  return <Layout role={role}>{page}</Layout>
}
