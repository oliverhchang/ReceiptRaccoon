import React, { useEffect, useState } from 'react'
import { Calendar as CalendarIcon, TrendingUp } from 'lucide-react'
import { supabase } from '../supabaseClient'
import './RightSidebar.css'

// Now accepts "currentUser" as a prop!
export default function RightSidebar({ currentUser }) {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    spent: 0,
    budget: 2000,
    receiptDays: []
  })

  // Whenever "currentUser" changes, re-fetch THEIR stats
  useEffect(() => {
    if (currentUser) {
      fetchUserStats()
    }
  }, [currentUser])

  async function fetchUserStats() {
    setLoading(true)
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

    try {
      // 1. Fetch Receipts ONLY for this specific user
      const { data: receipts, error } = await supabase
        .from('receipts')
        .select('total_amount, purchase_date')
        .eq('discord_user_id', currentUser.discord_id) // <--- CRITICAL FILTER
        .gte('purchase_date', startOfMonth)
        .lte('purchase_date', endOfMonth)

      if (error) console.error("Error fetching stats:", error)

      // 2. Calculate Totals
      const totalSpent = receipts?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0
      const days = receipts?.map(r => new Date(r.purchase_date).getDate()) || []

      setStats({
        spent: totalSpent,
        budget: currentUser.monthly_budget || 2000, // Use the user's custom budget
        receiptDays: days
      })

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // If no user is selected yet
  if (!currentUser) return <aside className="right-sidebar">Loading...</aside>

  const percentSpent = Math.min((stats.spent / stats.budget) * 100, 100)

  return (
    <aside className="right-sidebar">

      {/* 1. PROFILE (Uses the passed prop data directly) */}
      <div className="profile-card">
        <div className="profile-header">
          <img src={currentUser.avatar_url} alt="Profile" className="profile-avatar-large" />
          <div className="profile-info">
            <h3>{currentUser.display_name}</h3>
            <span className="profile-handle">@{currentUser.display_name.toLowerCase().replace(/\s/g, '')}</span>
            <span className="profile-location">📍 Sunnyvale, CA</span>
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
            <span className="spent">${stats.spent.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            <span className="total"> / ${stats.budget.toLocaleString()}</span>
          </div>

          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{width: `${percentSpent}%`, backgroundColor: percentSpent > 90 ? '#fe6b40' : ''}}
            ></div>
          </div>
        </div>
      </div>

      {/* 3. CALENDAR */}
      <div className="sidebar-section">
        <div className="section-header">
          <h4>Grocery Trips</h4>
          <CalendarIcon size={16} color="#a0aec0" />
        </div>

        <div className="mini-calendar">
          {['S','M','T','W','T','F','S'].map(d => <div key={d} className="cal-head">{d}</div>)}
          {Array.from({length: 31}, (_, i) => {
            const day = i + 1;
            const hasReceipt = stats.receiptDays.includes(day);
            return (
              <div key={day} className={`cal-day ${hasReceipt ? 'active' : ''}`}>
                {day}
              </div>
            )
          })}
        </div>
      </div>

    </aside>
  )
}