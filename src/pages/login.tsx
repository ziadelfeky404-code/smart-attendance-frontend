import React from 'react'
import PublicLayout from '../components/Layout/PublicLayout'
import Router from 'next/router'

const LoginPage: any = () => {
  const [role, setRole] = React.useState<string>('student')
  const [loading, setLoading] = React.useState<boolean>(false)

  const onLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      localStorage.setItem('cm_user_role', role)
      // Redirect to a role-specific default page
      const path = role === 'admin' ? '/admin/notifications' : role === 'doctor' ? '/doctor/notifications' : '/notifications'
      Router.push(path)
    }, 400)
  }

  return (
    <section style={styles.section}>
      <div style={styles.container}>
        <h1 style={styles.title}>Login</h1>
        <form onSubmit={onLogin} style={styles.form}>
          <label style={styles.label}>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} style={styles.select}>
            <option value="student">Student</option>
            <option value="doctor">Doctor</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p style={styles.note}>This is a simplified login for demonstration. No credentials required.</p>
      </div>
    </section>
  )
}

export default LoginPage
LoginPage.getLayout = (page: React.ReactNode) => (
  <PublicLayout>{page}</PublicLayout>
)

const styles: { [key: string]: React.CSSProperties } = {
  section: { padding: '40px 20px' },
  container: { maxWidth: 520, margin: '0 auto' },
  title: { fontSize: 32, marginBottom: 12 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  label: { fontSize: 14 },
  select: { padding: '10px', borderRadius: 6, border: '1px solid #d1d5db' },
  button: { padding: '12px 16px', borderRadius: 6, border: 'none', background: '#111827', color: '#fff', fontWeight: 600 },
  note: { marginTop: 8, color: '#6b7280', fontSize: 12 },
  sectionCopy: { color: '#6b7280' },
  containerSection: { padding: 0 },
}
