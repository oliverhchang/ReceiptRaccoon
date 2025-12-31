// src/components/DashboardWidgets/CategoryLineChart.jsx
import React, { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

const VALID_CATEGORIES = [
  "Fruits", "Vegetables", "Meat / Fish", "Dairy & Eggs",
  "Grains & Staples", "Frozen Foods", "Snacks & Sweets",
  "Condiments & Cooking Ingredients", "Toiletries/Cleaning", "Misc"
]

const CATEGORY_COLORS = {
  "Fruits": "#fe6b40",
  "Vegetables": "#3b82f6",
  "Meat / Fish": "#10b981",
  "Dairy & Eggs": "#f59e0b",
  "Grains & Staples": "#8b5cf6",
  "Frozen Foods": "#ec4899",
  "Snacks & Sweets": "#6366f1",
  "Condiments & Cooking Ingredients": "#14b8a6",
  "Toiletries/Cleaning": "#f97316",
  "Misc": "#64748b"
}

export default function CategoryLineChart({ transactions }) {
  const [selectedCategories, setSelectedCategories] = useState(["Meat / Fish", "Vegetables"])
  // 1. New State for Time View
  const [viewMode, setViewMode] = useState('monthly') // 'weekly', 'monthly', 'yearly'

  const chartData = useMemo(() => {
    if (!transactions) return []

    const groups = {}

    transactions.forEach(t => {
      if (!t.purchase_date) return
      const dateObj = new Date(t.purchase_date)

      let key = ''
      let sortTime = 0

      // 2. Logic to determine grouping key based on viewMode
      if (viewMode === 'weekly') {
        const d = new Date(dateObj)
        d.setDate(d.getDate() - d.getDay()) // Set to Sunday
        key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        sortTime = d.getTime()
      } else if (viewMode === 'monthly') {
        key = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        sortTime = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).getTime()
      } else if (viewMode === 'yearly') {
        key = dateObj.getFullYear().toString()
        sortTime = new Date(dateObj.getFullYear(), 0, 1).getTime()
      }

      // Initialize bucket if it doesn't exist
      if (!groups[key]) {
        groups[key] = { date: key, rawDate: sortTime }
        VALID_CATEGORIES.forEach(cat => groups[key][cat] = 0)
      }

      // Aggregate Items
      const items = t.receipt_items || []
      items.forEach(item => {
        if (VALID_CATEGORIES.includes(item.category)) {
          groups[key][item.category] += (item.price || 0)
        }
      })
    })

    return Object.values(groups).sort((a, b) => a.rawDate - b.rawDate)
  }, [transactions, viewMode]) // Recalculate when viewMode changes

  const toggleCategory = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* Header Row with Title and View Toggles */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#2d3748' }}>Multi-Category Overlay</h3>

        {/* View Mode Toggle Buttons */}
        <div style={{ background: '#f7fafc', padding: '4px', borderRadius: '8px', display: 'flex', gap: '4px' }}>
            {['weekly', 'monthly', 'yearly'].map(m => (
                <button
                    key={m}
                    onClick={() => setViewMode(m)}
                    style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'capitalize',
                        cursor: 'pointer',
                        background: viewMode === m ? 'white' : 'transparent',
                        color: viewMode === m ? '#2d3748' : '#718096',
                        boxShadow: viewMode === m ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                        transition: 'all 0.2s'
                    }}
                >
                    {m}
                </button>
            ))}
        </div>
      </div>

      {/* Category Pill Selectors */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
        {VALID_CATEGORIES.map(cat => {
          const isActive = selectedCategories.includes(cat)
          return (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: `1px solid ${isActive ? CATEGORY_COLORS[cat] : '#edf2f7'}`,
                backgroundColor: isActive ? CATEGORY_COLORS[cat] : 'transparent',
                color: isActive ? 'white' : '#a0aec0',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {cat}
            </button>
          )
        })}
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf2f7" />
            <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{fill: '#a0aec0', fontSize: 11}}
                dy={10}
                minTickGap={30}
            />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#a0aec0', fontSize: 11}} tickFormatter={v => `$${v}`} />

            <Tooltip
               contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
               formatter={(value) => [`$${(value || 0).toFixed(2)}`]}
               labelStyle={{ fontWeight: 'bold', color: '#2d3748', marginBottom: '5px' }}
            />
            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />

            {/* Dynamically render a Line for each selected category */}
            {selectedCategories.map(cat => (
              <Line
                key={cat}
                type="monotone"
                dataKey={cat}
                name={cat}
                stroke={CATEGORY_COLORS[cat]}
                strokeWidth={3}
                dot={{fill: CATEGORY_COLORS[cat], r: 4}}
                activeDot={{r: 6, strokeWidth: 0}}
                connectNulls={true}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}