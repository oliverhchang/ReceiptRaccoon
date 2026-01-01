// src/components/RightSidebar.jsx
import React, { useEffect, useState } from 'react'
import { Calendar as CalendarIcon, TrendingUp, ChevronLeft, ChevronRight, Edit2, Check, X, ChevronDown } from 'lucide-react'
import { supabase } from '../supabaseClient'
import './RightSidebar.css'
import MonthlyComparison from './DashboardWidgets/MonthlyComparison'

// 1. IMPORT COLORS
import { CATEGORY_COLORS, DEFAULT_COLOR } from '../assets/colors'

const VALID_CATEGORIES = [
  "Total",
  "Groceries",
  "Restaurants & Dining",
  "Transportation",
  "Home & Utilities",
  "Shopping & Entertainment",
  "Health",
  "Travel",
  "Personal & Family Care",
  "Education",
  "Business Expenses",
  "Finance",
  "Giving",
  "Cash, Checks & Misc",
  "Uncategorized"
]

export default function RightSidebar({ currentUser }) {
  const [loading, setLoading] = useState(false)
  const [viewDate, setViewDate] = useState(new Date())

  // Selection & Editing States
  const [selectedCategory, setSelectedCategory] = useState("Total")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [editBudgetAmount, setEditBudgetAmount] = useState(0)
  const [isEditingName, setIsEditingName] = useState(false)
  const [newName, setNewName] = useState("")

  // Data State
  const [stats, setStats] = useState({
    dayStyles: {}, // Changed from simple array to object map
    spendMap: {},
    budgetMap: {}
  })

  useEffect(() => {
    if (currentUser) {
      setNewName(currentUser.display_name)
      fetchUserStats()
    }
  }, [currentUser, viewDate])

  // --- DATA FETCHING ---
  async function fetchUserStats() {
    setLoading(true)
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const startOfMonth = new Date(year, month, 1).toISOString()
    const endOfMonth = new Date(year, month + 1, 0).toISOString()

    try {
      const { data: receipts, error: receiptError } = await supabase
        .from('receipts')
        .select('total_amount, purchase_date, receipt_type')
        .eq('discord_user_id', currentUser.discord_id)
        .gte('purchase_date', startOfMonth)
        .lte('purchase_date', endOfMonth)

      if (receiptError) console.error(receiptError)

      const { data: userData } = await supabase
        .from('users')
        .select('category_budgets')
        .eq('discord_id', currentUser.discord_id)
        .single()

      // Initialize Maps
      const spendMap = {}
      VALID_CATEGORIES.forEach(c => { if(c !== 'Total') spendMap[c] = 0 })

      // Logic: If multiple receipts on one day, color by the HIGHEST spend category
      const dailyMaxSpend = {} // { 5: { amount: 50, color: 'blue' } }
      const finalDayStyles = {}

      receipts?.forEach(r => {
        // 1. Process Spending Aggregates
        let cat = r.receipt_type || "Uncategorized"
        if (cat === "Grocery") cat = "Groceries" // Normalize

        if (spendMap[cat] !== undefined) {
            spendMap[cat] += (r.total_amount || 0)
        } else {
            spendMap["Uncategorized"] += (r.total_amount || 0)
        }

        // 2. Process Calendar Colors
        if (r.purchase_date) {
            const day = parseInt(r.purchase_date.split('-')[2])
            const amount = r.total_amount || 0

            // Determine Color
            const color = CATEGORY_COLORS[cat] || DEFAULT_COLOR

            // Check if this is the "dominant" receipt for the day
            if (!dailyMaxSpend[day] || amount > dailyMaxSpend[day].amount) {
                dailyMaxSpend[day] = { amount, color }
                finalDayStyles[day] = color
            }
        }
      })

      setStats({
        dayStyles: finalDayStyles,
        spendMap: spendMap,
        budgetMap: userData?.category_budgets || {}
      })

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // --- ACTIONS ---
  async function saveBudget() {
    try {
      const updatedMap = { ...stats.budgetMap }
      if (selectedCategory === "Total") {
         alert("Please select a specific category to edit its budget.")
         setIsEditingBudget(false)
         return
      } else {
         updatedMap[selectedCategory] = editBudgetAmount
      }

      const { error } = await supabase
        .from('users')
        .update({ category_budgets: updatedMap })
        .eq('discord_id', currentUser.discord_id)

      if (error) throw error
      setStats(prev => ({ ...prev, budgetMap: updatedMap }))
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
      currentUser.display_name = newName
      setIsEditingName(false)
    } catch (error) {
      console.error("Error saving name:", error)
    }
  }

  // --- HELPERS ---
  const getDisplayData = () => {
    if (selectedCategory === "Total") {
        const totalSpent = Object.values(stats.spendMap).reduce((a, b) => a + b, 0)
        const totalBudget = Object.values(stats.budgetMap).reduce((a, b) => a + (Number(b) || 0), 0)
        return { spent: totalSpent, budget: totalBudget }
    } else {
        return {
            spent: stats.spendMap[selectedCategory] || 0,
            budget: stats.budgetMap[selectedCategory] || 0
        }
    }
  }

  const currentData = getDisplayData()
  const percentSpent = currentData.budget > 0
    ? Math.min((currentData.spent / currentData.budget) * 100, 100)
    : (currentData.spent > 0 ? 100 : 0)

  const changeMonth = (offset) => {
    const newDate = new Date(viewDate)
    newDate.setMonth(newDate.getMonth() + offset)
    setViewDate(newDate)
  }
  const goToToday = () => setViewDate(new Date())
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()

  // --- RENDER CALENDAR ---
  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(viewDate)
    const startDay = getFirstDayOfMonth(viewDate)
    const cells = []

    // Empty cells for offset
    for (let i = 0; i < startDay; i++) {
      cells.push(<div key={`empty-${i}`} className="cal-day empty"></div>)
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const dayColor = stats.dayStyles[d] // Get the color if exists

      cells.push(
        <div
            key={d}
            className={`cal-day ${dayColor ? 'active' : ''}`}
            // Apply dynamic background color AND dynamic glow if active
            style={dayColor ? {
                backgroundColor: dayColor,
                borderColor: dayColor,
                color: 'white',
                // Add 50% opacity glow matching the color
                boxShadow: `0 0 8px ${dayColor}80`
            } : {}}
        >
            {d}
        </div>
      )
    }
    return cells
  }

  if (!currentUser) return <aside className="right-sidebar">Loading...</aside>

  const monthLabel = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <aside className="right-sidebar">
      {/* 1. PROFILE */}
      <div className="profile-card">
        <div className="profile-header">
          <img src={currentUser.avatar_url} alt="Profile" className="profile-avatar-large" />
          <div className="profile-info">
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '32px'}}>
              {isEditingName ? (
                <>
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="name-input" autoFocus />
                  <button onClick={saveName} className="action-btn save"><Check size={14}/></button>
                  <button onClick={() => setIsEditingName(false)} className="action-btn cancel"><X size={14}/></button>
                </>
              ) : (
                <>
                  <h3>{currentUser.display_name}</h3>
                  <button onClick={() => setIsEditingName(true)} className="icon-btn" title="Edit Name">
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

      {/* 2. BUDGET SECTION */}
      <div className="sidebar-section">
        <div className="section-header" style={{marginBottom: '15px'}}>
            <div style={{position: 'relative'}}>
            <button
                className="category-dropdown-btn"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
                <span>{selectedCategory === "Total" ? "Total Budget" : selectedCategory}</span>
                <ChevronDown size={14} style={{marginLeft: '8px', opacity: 0.6}}/>
            </button>

            {isDropdownOpen && (
                <div className="category-dropdown-menu">
                    {VALID_CATEGORIES.map(cat => {
                        const isSelected = selectedCategory === cat
                        return (
                            <div
                                key={cat}
                                className={`dropdown-item ${isSelected ? 'active' : ''}`}
                                onClick={() => {
                                    setSelectedCategory(cat)
                                    setIsDropdownOpen(false)
                                    setIsEditingBudget(false)
                                }}
                            >
                                <span>{cat}</span>
                                {isSelected && <Check size={14} />}
                            </div>
                        )
                    })}
                </div>
            )}
            </div>

            <div style={{display: 'flex', gap: '8px'}}>
            {selectedCategory !== "Total" && !isEditingBudget && (
                <button
                onClick={() => {
                    setEditBudgetAmount(currentData.budget || 0)
                    setIsEditingBudget(true)
                }}
                className="icon-btn"
                title={`Edit ${selectedCategory} Budget`}
                >
                <Edit2 size={14} />
                </button>
            )}
            <TrendingUp size={16} color="#fe6b40" />
            </div>
        </div>

        <div className="budget-card">
            <div className="budget-text">
                <span className="spent">
                    ${currentData.spent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </span>
                <span className="total" style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                /
                {isEditingBudget ? (
                    <>
                    <span style={{fontSize: '1rem', color: '#a0aec0'}}>$</span>
                    <input
                        type="number"
                        value={editBudgetAmount}
                        onChange={(e) => setEditBudgetAmount(Number(e.target.value))}
                        className="budget-input"
                        autoFocus
                    />
                    <button onClick={saveBudget} className="action-btn save"><Check size={14}/></button>
                    <button onClick={() => setIsEditingBudget(false)} className="action-btn cancel"><X size={14}/></button>
                    </>
                ) : (
                    ` $${(currentData.budget || 0).toLocaleString()}`
                )}
                </span>
            </div>
            <div className="progress-bar-bg">
                <div
                    className="progress-bar-fill"
                    style={{
                        width: `${percentSpent}%`,
                        backgroundColor: percentSpent > 100 ? '#ef4444' : '#fe6b40'
                    }}
                ></div>
            </div>
            <div style={{fontSize: '0.8rem', color: '#a0aec0', marginTop: '8px', textAlign: 'right'}}>
                {selectedCategory === "Total" ? "Total Used" : `${selectedCategory} Used`}
            </div>
        </div>
      </div>

      {/* 3. MONTHLY COMPARISON */}
      {currentUser && <MonthlyComparison currentUser={currentUser} />}

      {/* 4. CALENDAR */}
      <div className="sidebar-section">
        <div className="section-header">
           <h4 style={{margin: 0}}>Activity</h4>
           <button onClick={goToToday} className="today-btn">Today</button>
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