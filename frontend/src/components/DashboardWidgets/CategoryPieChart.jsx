import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

export default function CategoryPieChart({ data }) {
  // Guard clause: If no data, show a message instead of crashing
  if (!data || data.length === 0) {
    return (
      <div style={{
        background: 'white', padding: '24px', borderRadius: '16px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.02)', height: '480px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0aec0'
      }}>
        No data available
      </div>
    )
  }

  return (
    <div style={{
      background: 'white',
      padding: '24px',
      borderRadius: '16px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
      height: '480px'
    }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: '#2d3748' }}>
        Spending Breakdown
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
                // CHANGE: We now use the color passed in the data object
                // If no color is provided, it falls back to gray
                fill={entry.color || '#cbd5e0'}
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