import React, { useState, useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { GROCERY_ITEM_COLORS } from '../../assets/colors'
// Import chevron icon for a custom look (optional, but good for UX)
import { ChevronDown } from 'lucide-react'

const CATEGORIES = Object.keys(GROCERY_ITEM_COLORS)

const SLICE_COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042',
  '#a855f7', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#84cc16'
];

export default function SubCategoryBreakdown({ transactions }) {
  const [selectedCategory, setSelectedCategory] = useState("Vegetables")

  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) return []

    const allItems = transactions.flatMap(t => t.receipt_items || [])
    const filteredItems = allItems.filter(item => item.category === selectedCategory)

    const itemMap = {}
    filteredItems.forEach(item => {
      const name = (item.name || "Unknown").trim()
      itemMap[name] = (itemMap[name] || 0) + (item.price || 0)
    })

    return Object.keys(itemMap)
      .map(name => ({ name: name, amount: itemMap[name] }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)
  }, [transactions, selectedCategory])

  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', height: '550px' }}>

      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#2d3748' }}>Item Deep Dive</h3>

        {/* IMPROVED DROPDOWN CONTAINER */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                    appearance: 'none', // Remove default browser arrow
                    backgroundColor: 'white',
                    border: '1px solid #cbd5e0',
                    borderRadius: '8px',
                    padding: '8px 36px 8px 16px', // Extra right padding for the icon
                    fontSize: '0.95rem',
                    color: '#2d3748',
                    cursor: 'pointer',
                    outline: 'none',
                    fontWeight: '600',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    minWidth: '180px'
                }}
            >
                {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
            </select>

            {/* Custom Arrow Icon positioned absolutely over the select box */}
            <div style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none', // Allows clicking through to the select
                color: '#718096'
            }}>
                <ChevronDown size={16} />
            </div>
        </div>
      </div>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="85%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="amount"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              innerRadius={60}
              paddingAngle={3}
              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={SLICE_COLORS[index % SLICE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
                formatter={(value) => [`$${value.toFixed(2)}`, 'Spent']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              wrapperStyle={{fontSize: '0.85rem', paddingLeft: '20px'}}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div style={{height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0aec0', fontStyle: 'italic'}}>
            No items found for {selectedCategory}
        </div>
      )}
    </div>
  )
}