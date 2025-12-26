import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

// Same mapping as LineChart
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

export default function CategoryPieChart({ data }) {
  return (
    <div style={{
      background: 'white',
      padding: '24px',
      borderRadius: '16px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
      height: '480px'
    }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: '#2d3748' }}>
        Category Breakdown
      </h3>

      <ResponsiveContainer width="100%" height="80%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CATEGORY_COLORS[entry.name] || '#cbd5e0'} // <--- Consistent Lookup
              />
            ))}
          </Pie>
          <Tooltip
             formatter={(value) => `$${value.toFixed(2)}`}
             contentStyle={{borderRadius: '8px', border: 'none'}}
          />
          <Legend
            verticalAlign="bottom"
            height={80}
            wrapperStyle={{ paddingTop: '20px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}