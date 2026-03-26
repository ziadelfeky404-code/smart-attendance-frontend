import React from 'react'
import PublicLayout from '../components/Layout/PublicLayout'

const features = [
  { title: 'Attendance', icon: '🧭' },
  { title: 'LMS', icon: '🎓' },
  { title: 'Academic Advising', icon: '🗺️' },
  { title: 'Risk Monitoring', icon: '⚠️' },
  { title: 'AI Assistant', icon: '🤖' },
  { title: 'Gamification', icon: '🏅' },
  { title: 'Messaging', icon: '💬' },
  { title: 'Reports', icon: '📊' },
]

const HomePage: any = () => {
  return (
    <div>
      <section style={styles.hero}> 
        <div style={styles.heroContent}>
          <h1 style={styles.title}>CampusMind</h1>
          <p style={styles.description}>A smart university platform combining Attendance, LMS, Academic Advising, Risk Monitoring, AI Assistant, Gamification, Messaging, Reports and Admin Systems.</p>
          <div style={styles.actions}>
            <a href="/login" style={styles.button}>Login</a>
            <a href="/features" style={styles.buttonOutline}>Features</a>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Features Overview</h2>
        <div style={styles.grid}>
          {features.map((f) => (
            <div key={f.title} style={styles.card}>
              <div style={styles.cardIcon}>{f.icon}</div>
              <div style={styles.cardTitle}>{f.title}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>How it works</h2>
        <div style={styles.workGrid}>
          <div style={styles.workCard}>
            <h3>Student Journey</h3>
            <p>Enroll, learn, track progress, receive guidance and feedback.</p>
          </div>
          <div style={styles.workCard}>
            <h3>Advisor Workflow</h3>
            <p>Coordinate academic plans, monitor risk, and adjust recommendations.</p>
          </div>
          <div style={styles.workCard}>
            <h3>Admin Workflow</h3>
            <p>Oversee platform health, reports, and governance modules.</p>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>System Modules</h2>
        <div style={styles.grid}>
          {features.map((f) => (
            <div key={f.title} style={styles.moduleCard}>
              <div style={styles.moduleIcon}> {f.icon} </div>
              <div style={styles.moduleTitle}>{f.title}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Dashboards & Previews</h2>
        <div style={styles.previewGrid}>
          {new Array(3).fill(0).map((_, idx) => (
            <div key={idx} style={styles.previewBox}>Screenshot Placeholder {idx + 1}</div>
          ))}
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Contact</h2>
        <p>For partnership and inquiries, reach out via email or form on the contact page.</p>
      </section>
    </div>
  )
}

export default HomePage

HomePage.getLayout = (page: React.ReactNode) => (
  <PublicLayout>{page}</PublicLayout>
)

const styles: { [key: string]: React.CSSProperties } = {
  hero: {
    background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 60%, #8b5cf6 100%)',
    color: '#fff',
    padding: '60px 20px',
  },
  heroContent: { maxWidth: 1100, margin: '0 auto', textAlign: 'center' },
  title: { fontSize: 48, lineHeight: 1.1, margin: '0 0 12px' },
  description: { fontSize: 18, opacity: 0.95 },
  actions: { marginTop: 20, display: 'flex', justifyContent: 'center', gap: 12 },
  button: { padding: '12px 20px', background: '#fff', color: '#111827', borderRadius: 6, textDecoration: 'none', fontWeight: 600 },
  buttonOutline: { padding: '12px 20px', border: '1px solid #fff', color: '#fff', borderRadius: 6, textDecoration: 'none', fontWeight: 600 },
  section: { padding: '40px 20px' },
  sectionTitle: { fontSize: 28, marginBottom: 16 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 },
  card: { padding: 14, textAlign: 'center', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' },
  cardIcon: { fontSize: 28, marginBottom: 8 },
  cardTitle: { fontWeight: 600 },
  workGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 },
  workCard: { padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' },
  moduleCard: { padding: 12, textAlign: 'center', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' },
  moduleIcon: { fontSize: 20, marginBottom: 6 },
  moduleTitle: { fontWeight: 600 },
  previewGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 },
  previewBox: { height: 180, background: '#e5e7eb', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' },
  sectionCopy: { color: '#6b7280' },
}
