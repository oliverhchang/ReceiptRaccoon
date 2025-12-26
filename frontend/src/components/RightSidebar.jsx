import React, { useEffect, useState } from 'react'
import { Calendar as CalendarIcon, TrendingUp, ChevronLeft, ChevronRight, Edit2, Check, X } from 'lucide-react'
import { supabase } from '../supabaseClient'
import './RightSidebar.css'

export default function RightSidebar({ currentUser }) {
  const [loading, setLoading] = useState(false)
  const [viewDate, setViewDate] = useState(new Date())

  // State for Budget Editing
  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [newBudget, setNewBudget] = useState(2000)

  // State for Name Editing
  const [isEditingName, setIsEditingName] = useState(false)
  const [newName, setNewName] = useState("")

  const [stats, setStats] = useState({
    spent: 0,
    budget: 2000,
    receiptDays: []
  })

  // Re-fetch whenever User or Date changes
  useEffect(() => {
    if (currentUser) {
      fetchUserStats()
      // Initialize edit states
      setNewName(currentUser.display_name)
    }
  }, [currentUser, viewDate])

  async function fetchUserStats() {
    setLoading(true)

    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const startOfMonth = new Date(year, month, 1).toISOString()
    const endOfMonth = new Date(year, month + 1, 0).toISOString()

    try {
      // 1. Fetch Receipts
      const { data: receipts, error: receiptError } = await supabase
        .from('receipts')
        .select('total_amount, purchase_date')
        .eq('discord_user_id', currentUser.discord_id)
        .gte('purchase_date', startOfMonth)
        .lte('purchase_date', endOfMonth)

      if (receiptError) console.error(receiptError)

      // 2. Fetch User's Budget
      const { data: userData } = await supabase
        .from('users')
        .select('monthly_budget')
        .eq('discord_id', currentUser.discord_id)
        .single()

      const currentBudget = userData?.monthly_budget || 2000

      // 3. Process Totals
      const totalSpent = receipts?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0

      const days = receipts?.map(r => {
        if (!r.purchase_date) return null
        return parseInt(r.purchase_date.split('-')[2])
      }).filter(d => d !== null) || []

      setStats({
        spent: totalSpent,
        budget: currentBudget,
        receiptDays: days
      })

      setNewBudget(currentBudget)

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // --- SAVE FUNCTIONS ---

  async function saveBudget() {
    try {
      const { error } = await supabase
        .from('users')
        .update({ monthly_budget: newBudget })
        .eq('discord_id', currentUser.discord_id)

      if (error) throw error

      setStats(prev => ({ ...prev, budget: newBudget }))
      setIsEditingBudget(false)
    } catch (error) {
      console.error("Error saving budget:", error)
    }
  }

  async function saveName() {
    try {
      const { error } = await supabase
        .from('users')
        .update({ display_name: newName })
        .eq('discord_id', currentUser.discord_id)

      if (error) throw error

      // Note: This updates the local view immediately,
      // but you might need to refresh the page to see it update in the top-right dropdown.
      currentUser.display_name = newName
      setIsEditingName(false)

    } catch (error) {
      console.error("Error saving name:", error)
    }
  }

  // --- CALENDAR HELPERS ---
  const changeMonth = (offset) => {
    const newDate = new Date(viewDate)
    newDate.setMonth(newDate.getMonth() + offset)
    setViewDate(newDate)
  }

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(viewDate)
    const startDay = getFirstDayOfMonth(viewDate)
    const cells = []

    for (let i = 0; i < startDay; i++) {
      cells.push(<div key={`empty-${i}`} className="cal-day empty"></div>)
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const hasReceipt = stats.receiptDays.includes(d)
      cells.push(
        <div key={d} className={`cal-day ${hasReceipt ? 'active' : ''}`}>
          {d}
        </div>
      )
    }
    return cells
  }

  if (!currentUser) return <aside className="right-sidebar">Loading...</aside>

  const percentSpent = Math.min((stats.spent / stats.budget) * 100, 100)
  const monthLabel = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <aside className="right-sidebar">

      {/* PROFILE */}
      <div className="profile-card">
        <div className="profile-header">
          <img src={currentUser.avatar_url} alt="Profile" className="profile-avatar-large" />

          <div className="profile-info">

            {/* NAME EDIT SECTION */}
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '32px'}}>
              {isEditingName ? (
                <>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="name-input"
                    autoFocus
                  />
                  <button onClick={saveName} className="action-btn save"><Check size={14}/></button>
                  <button onClick={() => setIsEditingName(false)} className="action-btn cancel"><X size={14}/></button>
                </>
              ) : (
                <>
                  <h3>{currentUser.display_name}</h3>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="icon-btn"
                    title="Edit Name"
                  >
                    <Edit2 size={12} />
                  </button>
                </>
              )}
            </div>

            <span className="profile-handle">
                @{currentUser.handle || currentUser.display_name.toLowerCase().replace(/\s/g, '')}
            </span>
          </div>
        </div>
      </div>

      {/* BUDGET */}
      <div className="sidebar-section">
        <div className="section-header">
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <h4>Monthly Budget</h4>
            {!isEditingBudget && (
              <button onClick={() => setIsEditingBudget(true)} className="icon-btn" title="Edit Budget">
                <Edit2 size={14} />
              </button>
            )}
          </div>
          <TrendingUp size={16} color="#fe6b40" />
        </div>

        <div className="budget-card">
          <div className="budget-text">
            <span className="spent">
                ${stats.spent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </span>
            <span className="total" style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
               /
               {isEditingBudget ? (
                 <>
                   <span style={{fontSize: '1rem', color: '#a0aec0'}}>$</span>
                   <input
                      type="number"
                      value={newBudget}
                      onChange={(e) => setNewBudget(Number(e.target.value))}
                      className="budget-input"
                      autoFocus
                   />
                   <button onClick={saveBudget} className="action-btn save"><Check size={14}/></button>
                   <button onClick={() => setIsEditingBudget(false)} className="action-btn cancel"><X size={14}/></button>
                 </>
               ) : (
                 ` $${stats.budget.toLocaleString()}`
               )}
            </span>
          </div>

          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{
                  width: `${percentSpent}%`,
                  backgroundColor: percentSpent > 90 ? '#ef4444' : '#fe6b40'
              }}
            ></div>
          </div>
          <div style={{fontSize: '0.8rem', color: '#a0aec0', marginTop: '8px', textAlign: 'right'}}>
            {Math.round(percentSpent)}% used
          </div>
        </div>
      </div>

      {/* CALENDAR */}
      <div className="sidebar-section">
        <div className="section-header">
           <h4 style={{margin: 0}}>Grocery Trips</h4>
           <CalendarIcon size={16} color="#a0aec0" />
        </div>

        <div className="calendar-nav">
            <button onClick={() => changeMonth(-1)} className="nav-btn"><ChevronLeft size={16}/></button>
            <div className="month-label-container">
              <span className="month-label">{monthLabel}</span>
            </div>
            <button onClick={() => changeMonth(1)} className="nav-btn"><ChevronRight size={16}/></button>
        </div>

        <div className="mini-calendar">
          {['S','M','T','W','T','F','S'].map(d => <div key={d} className="cal-head">{d}</div>)}
          {renderCalendarDays()}
        </div>
      </div>

    </aside>
  )
}