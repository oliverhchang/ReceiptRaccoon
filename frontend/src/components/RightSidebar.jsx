import React, { useEffect, useState } from 'react'
import { Calendar as CalendarIcon, TrendingUp } from 'lucide-react'
import { supabase } from '../supabaseClient' // Import the connection
import './RightSidebar.css'

export default function RightSidebar() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState({
    name: "Loading...",
    handle: "@...",
    location: "Sunnyvale, CA",
    budget: 0,
    spent: 0,
    avatarUrl: "https://cdn.discordapp.com/embed/avatars/0.png"
  })
  const [receiptDays, setReceiptDays] = useState([]) // Stores days you bought stuff

  useEffect(() => {
    fetchSidebarData()
  }, [])

  async function fetchSidebarData() {
    setLoading(true)

    // 1. Get the current month range (e.g., Dec 1st to Dec 31st)
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

    try {
      // A. Fetch User Settings (Budget & Avatar)
      // *Tip: For now we just grab the first user. Later we can filter by ID.*
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .limit(1)
        .single()

      // B. Fetch Receipts for THIS Month (to sum up spending)
      const { data: receipts, error: receiptError } = await supabase
        .from('receipts')
        .select('total_amount, purchase_date')
        .gte('purchase_date', startOfMonth)
        .lte('purchase_date', endOfMonth)

      if (userError && userError.code !== 'PGRST116') console.error("User Error:", userError)
      if (receiptError) console.error("Receipt Error:", receiptError)

      // C. Calculate Totals
      const totalSpent = receipts?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0

      // D. Find which days had receipts (for the calendar)
      const days = receipts?.map(r => new Date(r.purchase_date).getDate()) || []

      // E. Update State
      if (userData) {
        setUser({
          name: userData.display_name || "Raccoon User",
          handle: `@user_${userData.discord_id?.slice(0,4)}`,
          location: "Sunnyvale, CA", // Hardcoded for now
          budget: userData.monthly_budget || 2000,
          spent: totalSpent,
          avatarUrl: userData.avatar_url || "https://cdn.discordapp.com/embed/avatars/0.png"
        })
      } else {
        // Fallback if no user exists in table yet
        setUser(prev => ({ ...prev, spent: totalSpent, budget: 2000, name: "No User Found" }))
      }

      setReceiptDays(days)

    } catch (error) {
      console.error("Critical Error:", error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate Progress
  const percentSpent = Math.min((user.spent / (user.budget || 1)) * 100, 100)

  return (
    <aside className="right-sidebar">

      {/* 1. PROFILE */}
      <div className="profile-card">
        <div className="profile-header">
          <img src={user.avatarUrl} alt="Profile" className="profile-avatar-large" />
          <div className="profile-info">
            <h3>{user.name}</h3>
            <span className="profile-handle">{user.handle}</span>
            <span className="profile-location">📍 {user.location}</span>
          </div>
        </div>
      </div>

      {/* 2. BUDGET STATS */}
      <div className="sidebar-section">
        <div className="section-header">
          <h4>Monthly Budget</h4>
          <TrendingUp size={16} color="var(--raccoon-green-leaf)" />
        </div>

        <div className="budget-card">
          <div className="budget-text">
            {loading ? (
              <span>Calculating...</span>
            ) : (
              <>
                <span className="spent">${user.spent.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                <span className="total"> / ${user.budget.toLocaleString()}</span>
              </>
            )}
          </div>

          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{width: `${percentSpent}%`, backgroundColor: percentSpent > 90 ? 'red' : ''}}
            ></div>
          </div>

          <div className="budget-status">
            {percentSpent < 85 ? (
              <span className="status-good">👍 On Track</span>
            ) : (
              <span className="status-warning">⚠️ Watch Out!</span>
            )}
            <span className="percentage">{Math.round(percentSpent)}%</span>
          </div>
        </div>
      </div>

      {/* 3. CALENDAR */}
      <div className="sidebar-section">
        <div className="section-header">
          <h4>Grocery Trips (Dec)</h4>
          <CalendarIcon size={16} color="#a0aec0" />
        </div>

        <div className="mini-calendar">
          {['S','M','T','W','T','F','S'].map(d => <div key={d} className="cal-head">{d}</div>)}

          {/* Render 31 days (Simple view) */}
          {Array.from({length: 31}, (_, i) => {
            const day = i + 1;
            const hasReceipt = receiptDays.includes(day);
            return (
              <div key={day} className={`cal-day ${hasReceipt ? 'active' : ''}`}>
                {day}
              </div>
            )
          })}
        </div>
      </div>

      {/* 4. TIP */}
      <div className="raccoon-tip">
        <div className="tip-icon">💡</div>
        <div className="tip-content">
          <strong>Raccoon Tip:</strong>
          <p>This data is real! Upload a receipt to Discord to see the bar move.</p>
        </div>
      </div>

    </aside>
  )
}