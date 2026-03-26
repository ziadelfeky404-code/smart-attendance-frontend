import React from 'react'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import { NotificationsPanel } from '../../../components/NotificationsPanel'

const AdminNotificationsPage: any = () => {
  return (
    <div>
      <h2 style={{ margin: '0 0 12px' }}>Admin Notifications</h2>
      <NotificationsPanel role="admin" />
    </div>
  )
}

export default AdminNotificationsPage
AdminNotificationsPage.getLayout = (page: React.ReactNode) => (
  <DashboardLayout role="admin">{page}</DashboardLayout>
)
