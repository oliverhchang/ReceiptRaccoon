// src/pages/Dashboard.jsx
import React from 'react'
import { useOutletContext } from 'react-router-dom'

export default function Dashboard() {
  const { currentUser } = useOutletContext()

  return (
    <div className="dashboard-container">
      <h1 style={{fontSize: '2rem', fontWeight: '800', color: '#2d3748', marginBottom: '10px'}}>
        Individual Dashboard
      </h1>

      {currentUser ? (
        <div style={{color: '#718096'}}>
          Viewing data for <strong>{currentUser.display_name}</strong>
        </div>
      ) : (
        <div>Loading user...</div>
      )}

      {/* Widgets / Charts Area */}
      <div style={{marginTop: '40px', padding: '40px', background: 'white', borderRadius: '20px', minHeight: '300px'}}>
        <h3>Spending Trends</h3>
        <p style={{color: '#a0aec0'}}>Graph coming soon...</p>
      </div>
    </div>
  )
}