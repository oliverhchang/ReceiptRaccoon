// src/components/DashboardWidgets/StoreBarChart.jsx
import React, { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'

export default function StoreBarChart({ transactions }) {

  const data = useMemo(() => {
    const storeMap = {}

    // 1. Group by Store Name
    transactions.forEach(t => {
      // Normalize name (trim spaces, handle nulls)
      const name = (t.store_name || "Unknown Store").trim()
      storeMap[name] = (storeMap[name] || 0) + t.total_amount
    })

    // 2. Convert to Array and Sort by Amount (High -> Low)
    const sorted = Object.keys(storeMap)
      .map(store => ({ name: store, amount: storeMap[store] }))
      .sort((a, b) => b.amount - a.amount)

    // 3. Take Top 5
    return sorted.slice(0, 5)
  }, [transactions])

  return (
    <div style={{
      background: 'white',
      padding: '24px',
      borderRadius: '16px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
      height: '480px'
    }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: '#2d3748' }}>
        Top Stores
      </h3>

      <ResponsiveContainer width="100%" height="85%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#edf2f7" />
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            axisLine={false}
            tickLine={false}
            width={120} // Give space for long store names
            tick={{fill: '#4a5568', fontSize: 13, fontWeight: 500}}
          />
          <Tooltip
             cursor={{fill: '#f7fafc'}}
             contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
             formatter={(value) => [`$${value.toFixed(2)}`, 'Spent']}
          />
          <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={32}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index === 0 ? '#fe6b40' : '#cbd5e0'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}