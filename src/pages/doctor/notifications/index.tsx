import React from 'react'
import DashboardLayout from '../../../components/Layout/DashboardLayout'
import { NotificationsPanel } from '../../../components/NotificationsPanel'

const DoctorNotificationsPage: any = () => {
  return (
    <div>
      <h2 style={{ margin: '0 0 12px' }}>Doctor Notifications</h2>
      <NotificationsPanel role="doctor" />
    </div>
  )
}

export default DoctorNotificationsPage
DoctorNotificationsPage.getLayout = (page: React.ReactNode) => (
  <DashboardLayout role="doctor">{page}</DashboardLayout>
)
