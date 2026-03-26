import React from 'react'

type Props = {
  children: React.ReactNode
  title?: string
  style?: React.CSSProperties
}

const Card: React.FC<Props> = ({ children, title, style }) => {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#fff', ...style }}>
      {title && <div style={{ fontWeight: 600, marginBottom: 6 }}>{title}</div>}
      {children}
    </div>
  )
}

export default Card
