import React, { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const VALID_CATEGORIES = [
  "Fruits", "Vegetables", "Meat / Fish", "Dairy & Eggs",
  "Grains & Staples", "Frozen Foods", "Snacks & Sweets",
  "Condiments & Cooking Ingredients", "Toiletries/Cleaning", "Misc"
]

// Shared Color Mapping
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
  const [selectedCategory, setSelectedCategory] = useState("Meat / Fish")

  const chartData = useMemo(() => {
    const points = []
    transactions.forEach(t => {
      const relevantItems = t.receipt_items.filter(i => i.category === selectedCategory)
      if (relevantItems.length > 0) {
        const totalForCat = relevantItems.reduce((sum, i) => sum + i.price, 0)
        points.push({
          date: new Date(t.purchase_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          amount: totalForCat,
          rawDate: t.purchase_date
        })
      }
    })
    return points.sort((a,b) => new Date(a.rawDate) - new Date(b.rawDate))
  }, [transactions, selectedCategory])

  // Get the color for the currently selected category (fallback to gray)
  const activeColor = CATEGORY_COLORS[selectedCategory] || '#cbd5e0'

  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', height: '480px' }}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#2d3748' }}>Category Trends</h3>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#2d3748',
            color: 'white',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          {VALID_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf2f7" />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#a0aec0', fontSize: 12}} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{fill: '#a0aec0', fontSize: 12}} tickFormatter={v => `$${v}`} />
          <Tooltip
             contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
             formatter={(value) => [`$${value.toFixed(2)}`, selectedCategory]}
          />
          <Line
            type="monotone"
            dataKey="amount"
            stroke={activeColor}    // <--- Dynamic Line Color
            strokeWidth={3}
            dot={{fill: activeColor, r: 4}} // <--- Dynamic Dot Color
            activeDot={{r: 6}}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}