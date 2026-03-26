import React from 'react'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import { NotificationsPanel } from '../../../components/NotificationsPanel'

const StudentNotificationsPage: any = () => {
  return (
    <div>
      <h2 style={{ margin: '0 0 12px' }}>Student Notifications</h2>
      <NotificationsPanel role="student" />
    </div>
  )
}

export default StudentNotificationsPage
StudentNotificationsPage.getLayout = (page: React.ReactNode) => (
  <DashboardLayout role="student">{page}</DashboardLayout>
)
