// src/components/DashboardWidgets/SpendingChart.jsx
import React from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function SpendingChart({ data }) {
  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', height: '400px' }}>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '1.1rem', color: '#2d3748' }}>Spending Trend</h3>

      <ResponsiveContainer width="100%" height="90%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fe6b40" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#fe6b40" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{fontSize: 12, fill: '#a0aec0'}}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{fontSize: 12, fill: '#a0aec0'}}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#fe6b40"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorSpent)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}