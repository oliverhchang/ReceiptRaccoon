// src/components/RightSidebar.jsx
import React, { useEffect, useState } from 'react'
import { Calendar as CalendarIcon, TrendingUp, ChevronLeft, ChevronRight, Edit2, Check, X, ChevronDown } from 'lucide-react'
import { supabase } from '../supabaseClient'
import './RightSidebar.css'
import MonthlyComparison from './DashboardWidgets/MonthlyComparison'

// Consistent with your Discord Bot
const VALID_CATEGORIES = [
  "Total", // Special view
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

  // New: Selection State
  const [selectedCategory, setSelectedCategory] = useState("Total")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // State for Budget Editing
  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [editBudgetAmount, setEditBudgetAmount] = useState(0)

  // State for Name Editing
  const [isEditingName, setIsEditingName] = useState(false)
  const [newName, setNewName] = useState("")

  // Data State
  const [stats, setStats] = useState({
    receiptDays: [],
    // Maps category name -> amount spent
    spendMap: {},
    // Maps category name -> budget limit
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
      // 1. Fetch Receipts
      const { data: receipts, error: receiptError } = await supabase
        .from('receipts')
        .select('total_amount, purchase_date, receipt_type')
        .eq('discord_user_id', currentUser.discord_id)
        .gte('purchase_date', startOfMonth)
        .lte('purchase_date', endOfMonth)

      if (receiptError) console.error(receiptError)

      // 2. Fetch User Budgets
      const { data: userData } = await supabase
        .from('users')
        .select('category_budgets')
        .eq('discord_id', currentUser.discord_id)
        .single()

      // 3. Initialize Spend Map based on your VALID_CATEGORIES list
      const spendMap = {}
      VALID_CATEGORIES.forEach(c => { if(c !== 'Total') spendMap[c] = 0 })

      const days = []

      receipts?.forEach(r => {
        // Track days for calendar
        if (r.purchase_date) {
            const day = parseInt(r.purchase_date.split('-')[2])
            if (!days.includes(day)) days.push(day)
        }

        // --- THE FIX IS HERE ---
        let cat = r.receipt_type || "Uncategorized"

        // Map singular "Grocery" from DB to plural "Groceries" for UI
        if (cat === "Grocery") cat = "Groceries"

        // Aggregate Spending
        // We check if the category exists in our map; if not, we put it in Uncategorized
        if (spendMap[cat] !== undefined) {
            spendMap[cat] += (r.total_amount || 0)
        } else {
            spendMap["Uncategorized"] = (spendMap["Uncategorized"] || 0) + (r.total_amount || 0)
        }
      })

      // 4. Update State
      setStats({
        receiptDays: days,
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
      // Create a copy of the current map
      const updatedMap = { ...stats.budgetMap }

      if (selectedCategory === "Total") {
         // If editing "Total", we can't easily distribute it.
         // Strategy: Maybe we just prevent editing Total?
         // OR we treat "Total" as a "General Fund" fallback?
         // For better UX: Let's block editing Total directly, or warn them.
         // But for this snippet, let's assume we save it as a "Global Target"
         // or we force them to pick a category.

         // Let's force them to pick a category to edit, OR save it to "Uncategorized"
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

  // --- HELPER: GET CURRENT DISPLAY DATA ---
  const getDisplayData = () => {
    if (selectedCategory === "Total") {
        // Sum up everything
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

  // --- CALENDAR HELPERS ---
  const changeMonth = (offset) => {
    const newDate = new Date(viewDate)
    newDate.setMonth(newDate.getMonth() + offset)
    setViewDate(newDate)
  }
  const goToToday = () => setViewDate(new Date())
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
        <div key={d} className={`cal-day ${hasReceipt ? 'active' : ''}`}>{d}</div>
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

  {/* DROPDOWN HEADER */}
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
                          {/* Visual Checkmark for the selected item */}
                          {isSelected && <Check size={14} />}
                      </div>
                  )
              })}
          </div>
      )}
    </div>

    {/* Rest of the header (Edit Button + Icon) */}
    <div style={{display: 'flex', gap: '8px'}}>
       {selectedCategory !== "Total" && !isEditingBudget && (
        <button
          onClick={() => {
              // Pre-fill the edit input with the current budget for this category
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

  {/* BUDGET CARD (No changes needed here from previous step) */}
  <div className="budget-card">
     {/* ... existing budget card code ... */}
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