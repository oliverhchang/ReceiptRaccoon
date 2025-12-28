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
  // 1. Change to an array to support multiple selections
  const [selectedCategories, setSelectedCategories] = useState(["Meat / Fish", "Vegetables"])

  const chartData = useMemo(() => {
    if (!transactions) return []

    // Group totals by date
    const dateMap = {}

    transactions.forEach(t => {
      const dateKey = new Date(t.purchase_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const rawDate = t.purchase_date

      if (!dateMap[dateKey]) {
        dateMap[dateKey] = { date: dateKey, rawDate: rawDate }
        // Initialize all valid categories to 0 for this date
        VALID_CATEGORIES.forEach(cat => dateMap[dateKey][cat] = 0)
      }

      const items = t.receipt_items || []
      items.forEach(item => {
        if (VALID_CATEGORIES.includes(item.category)) {
          dateMap[dateKey][item.category] += (item.price || 0)
        }
      })
    })

    return Object.values(dateMap).sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate))
  }, [transactions])

  const toggleCategory = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', height: '550px' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#2d3748' }}>Multi-Category Overlay</h3>

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

      <ResponsiveContainer width="100%" height="70%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf2f7" />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#a0aec0', fontSize: 11}} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{fill: '#a0aec0', fontSize: 11}} tickFormatter={v => `$${v}`} />

          <Tooltip
             contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
             formatter={(value) => [`$${(value || 0).toFixed(2)}`]} // Safety guard
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
              connectNulls={true} // Keeps line continuous if a date has $0 for that category
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}