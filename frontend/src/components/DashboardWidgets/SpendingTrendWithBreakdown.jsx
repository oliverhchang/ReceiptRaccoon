import React, { useState, useEffect, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { startOfWeek, startOfMonth, startOfYear, format } from 'date-fns'

export default function SpendingTrendWithBreakdown({ transactions }) {
  // Options: 'trip', 'week', 'month', 'year'
  const [groupBy, setGroupBy] = useState('trip')
  const [selectedPoint, setSelectedPoint] = useState(null)

  // 1. Transform and Aggregate Data based on Toggle
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) return []

    // Plot individual grocery trips
    if (groupBy === 'trip') {
      return transactions.map(t => ({
        date: format(new Date(t.purchase_date), 'MMM d'),
        amount: t.total_amount || 0,
        label: t.store_name || 'Unknown Store',
        items: t.receipt_items || [],
        rawDate: t.purchase_date
      }))
    }

    // Aggregate by Week, Month, or Year
    const groups = {}
    transactions.forEach(t => {
      const d = new Date(t.purchase_date)
      let key = ""
      let label = ""

      if (groupBy === 'week') {
        key = format(startOfWeek(d), 'MMM d, yyyy')
        label = "Weekly Spending"
      } else if (groupBy === 'month') {
        key = format(startOfMonth(d), 'MMM yyyy')
        label = "Monthly Spending"
      } else if (groupBy === 'year') {
        key = format(startOfYear(d), 'yyyy')
        label = "Yearly Spending"
      }

      if (!groups[key]) {
        groups[key] = { date: key, amount: 0, items: [], label: label }
      }
      groups[key].amount += (t.total_amount || 0)
      groups[key].items.push(...(t.receipt_items || []))
    })

    // Sort aggregated data by date
    return Object.values(groups).sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [transactions, groupBy])

  // 2. Auto-select the latest data point when data or mode changes
  useEffect(() => {
    if (chartData.length > 0) {
      setSelectedPoint(chartData[chartData.length - 1])
    }
  }, [chartData])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* TIME RANGE SELECTOR */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        {['trip', 'week', 'month', 'year'].map(mode => (
          <button
            key={mode}
            onClick={() => setGroupBy(mode)}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              backgroundColor: groupBy === mode ? '#fe6b40' : '#edf2f7',
              color: groupBy === mode ? 'white' : '#718096',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: groupBy === mode ? '0 4px 12px rgba(254, 107, 64, 0.2)' : 'none'
            }}
          >
            {mode}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', height: '400px' }}>

        {/* LEFT: The Spending Chart */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              onClick={(state) => {
                if (state && state.activePayload) {
                  setSelectedPoint(state.activePayload[0].payload)
                }
              }}
            >
              <defs>
                <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fe6b40" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#fe6b40" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf2f7" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#a0aec0', fontSize: 11}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#a0aec0', fontSize: 11}} tickFormatter={v => `$${v}`} />
              <Tooltip
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                formatter={(value) => [`$${(value || 0).toFixed(2)}`, 'Total Spent']}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#fe6b40"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorTrend)"
                activeDot={{ r: 6, strokeWidth: 0 }}
                style={{ cursor: 'pointer' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* RIGHT: Breakdown Panel */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', overflowY: 'auto' }}>
          {selectedPoint ? (
            <div>
              <h3 style={{ margin: '0', fontSize: '1.1rem', color: '#2d3748' }}>{selectedPoint.date}</h3>
              <div style={{marginBottom: '20px'}}>
                <div style={{fontSize: '0.85rem', color: '#a0aec0', fontWeight: '500'}}>{selectedPoint.label}</div>
                <div style={{fontSize: '1.8rem', fontWeight: '800', color: '#fe6b40'}}>
                  ${(selectedPoint.amount || 0).toFixed(2)}
                </div>
              </div>

              <h4 style={{fontSize: '0.7rem', color: '#cbd5e0', textTransform: 'uppercase', letterSpacing: '1px', borderBottom:'1px solid #edf2f7', paddingBottom:'8px', marginBottom:'12px'}}>
                  Top Items in Period
              </h4>

              <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                {selectedPoint.items.slice(0, 15).map((item, idx) => (
                  <div key={idx} style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem'}}>
                    <span style={{color: '#4a5568', maxWidth:'140px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                      {item.name || 'Unknown Item'}
                    </span>
                    <span style={{fontWeight: '600', color: '#2d3748'}}>
                        ${(item.price || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
                {selectedPoint.items.length > 15 && (
                    <div style={{fontSize: '0.75rem', color:'#a0aec0', textAlign:'center', marginTop:'5px'}}>
                        + {selectedPoint.items.length - 15} more items
                    </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e0'}}>
              <p>Select a point to view spending</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}