import React from 'react'
import PublicLayout from '../components/Layout/PublicLayout'

const FeaturesPage: any = () => {
  const features = [
    { name: 'Attendance', icon: '🧭' },
    { name: 'LMS', icon: '🎓' },
    { name: 'Academic Advising', icon: '🗺️' },
    { name: 'Risk Alerts', icon: '⚠️' },
    { name: 'AI Assistant', icon: '🤖' },
    { name: 'Gamification', icon: '🏅' },
    { name: 'Messaging', icon: '💬' },
    { name: 'Reports', icon: '📊' },
  ]
  return (
    <section style={styles.section}>
      <div style={styles.container}>
        <h1 style={styles.title}>CampusMind Features</h1>
        <p style={styles.description}>Explore the core capabilities that make CampusMind a holistic university platform.</p>
        <div style={styles.grid}>
          {features.map((f) => (
            <div key={f.name} style={styles.card}>
              <div style={styles.cardIcon}>{f.icon}</div>
              <div style={styles.cardTitle}>{f.name}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturesPage
FeaturesPage.getLayout = (page: React.ReactNode) => (
  <PublicLayout>{page}</PublicLayout>
)

const styles: { [key: string]: React.CSSProperties } = {
  section: { padding: '40px 20px' },
  container: { maxWidth: 1000, margin: '0 auto' },
  title: { fontSize: 32, marginBottom: 12 },
  description: { fontSize: 16, marginBottom: 20 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 },
  card: { padding: 14, border: '1px solid #e5e7eb', borderRadius: 8, textAlign: 'center', background: '#fff' },
  cardIcon: { fontSize: 28, marginBottom: 6 },
  cardTitle: { fontWeight: 600 },
}
