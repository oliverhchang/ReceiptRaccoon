import React from 'react'

export default function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div style={{
      background: 'white',
      padding: '24px',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
    }}>
      <div style={{
        background: `${color}15`, // 15% opacity version of the color
        padding: '12px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={24} color={color} />
      </div>
      <div>
        <h4 style={{ margin: 0, color: '#a0aec0', fontSize: '0.85rem', fontWeight: '600' }}>
          {title}
        </h4>
        <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#2d3748' }}>
          {value}
        </span>
      </div>
    </div>
  )
}