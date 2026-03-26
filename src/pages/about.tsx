import React from 'react'
import PublicLayout from '../components/Layout/PublicLayout'

const AboutPage: any = () => {
  return (
    <section style={styles.section}>
      <div style={styles.container}>
        <h1 style={styles.title}>About CampusMind</h1>
        <p style={styles.paragraph}>CampusMind is a smart, integrated university platform designed to streamline attendance, LMS, advising, risk monitoring, AI assistance, gamification, messaging, reporting and admin governance.</p>
      </div>
    </section>
  )
}

export default AboutPage

AboutPage.getLayout = (page: React.ReactNode) => (
  <PublicLayout>{page}</PublicLayout>
)

const styles: { [key: string]: React.CSSProperties } = {
  section: { padding: '40px 20px' },
  container: { maxWidth: 800, margin: '0 auto' as const },
  title: { fontSize: 32, marginBottom: 12 },
  paragraph: { fontSize: 16, color: '#374151' },
}
