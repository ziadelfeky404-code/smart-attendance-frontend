import React from 'react'
import PublicLayout from '../components/Layout/PublicLayout'

const ContactPage: any = () => {
  return (
    <section style={styles.section}>
      <div style={styles.container}>
        <h1 style={styles.title}>Contact CampusMind</h1>
        <p style={styles.description}>We’d love to hear from you. Reach out to discuss partnerships, features, or onboarding.</p>
        <form style={styles.form} onSubmit={(e) => e.preventDefault()}>
          <input style={styles.input} placeholder="Your email" />
          <textarea style={styles.textarea} placeholder="Message" rows={4} />
          <button style={styles.button} type="submit">Send</button>
        </form>
      </div>
    </section>
  )
}

export default ContactPage
ContactPage.getLayout = (page: React.ReactNode) => (
  <PublicLayout>{page}</PublicLayout>
)

const styles: { [key: string]: React.CSSProperties } = {
  section: { padding: '40px 20px' },
  container: { maxWidth: 720, margin: '0 auto' },
  title: { fontSize: 32, marginBottom: 12 },
  description: { fontSize: 16, marginBottom: 16 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: { padding: '12px', borderRadius: 6, border: '1px solid #d1d5db' },
  textarea: { padding: '12px', borderRadius: 6, border: '1px solid #d1d5db', resize: 'vertical' as any },
  button: { padding: '12px 16px', borderRadius: 6, border: 'none', background: '#111827', color: '#fff', fontWeight: 600, width: 120, alignSelf: 'flex-start' },
  sectionCopy: { color: '#6b7280' },
  formRow: { display: 'flex', gap: 12 },
  formLabel: { width: 100 },
  formInput: { flex: 1 },
  formActions: { display: 'flex', justifyContent: 'flex-end' },
  gridSpacer: { height: 20 },
  // Additional consolidated styles
  formCard: { padding: 12 },
}
