import React, { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function SpendingTrendWithBreakdown({ data, periodLabel = "Period", onHoverPeriod }) {
  const [hoveredKey, setHoveredKey] = useState(null)

  // Find the active data object (either hovered or the latest one)
  const activeData = data && data.length > 0
    ? (hoveredKey ? data.find(d => d.name === hoveredKey) : data[data.length - 1])
    : null;

  // REPORT HOVER TO PARENT
  // Whenever activeData changes, we tell Dashboard.jsx about it
  useEffect(() => {
    if (onHoverPeriod) {
        onHoverPeriod(activeData)
    }
  }, [activeData, onHoverPeriod])


  const topItems = activeData && activeData.items
    ? [...activeData.items].sort((a, b) => (b.price || 0) - (a.price || 0)).slice(0, 5)
    : []

  if (!data || data.length === 0) return <div style={{padding:'24px', background:'white'}}>No data available</div>

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: '32px',
      alignItems: 'start',
      height: '400px'
    }}>

      {/* CHART */}
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: '#2d3748' }}>
          Spending Trend
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            onMouseMove={(state) => {
                if (state.isTooltipActive && state.activeLabel) {
                    setHoveredKey(state.activeLabel)
                }
            }}
            onMouseLeave={() => setHoveredKey(null)}
          >
            <defs>
              <linearGradient id="colorSplit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fe6b40" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#fe6b40" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf2f7" />
            <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{fill: '#a0aec0', fontSize: 11}}
                dy={10}
                minTickGap={30}
            />
            <YAxis
                axisLine={false}
                tickLine={false}
                tick={{fill: '#a0aec0', fontSize: 12}}
                tickFormatter={v => `$${v}`}
            />
            <Tooltip
                cursor={{ stroke: '#fe6b40', strokeWidth: 1, strokeDasharray: '5 5' }}
                formatter={(value) => [`$${value.toFixed(2)}`, 'Spent']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Area
                type="monotone"
                dataKey="amount"
                stroke="#fe6b40"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorSplit)"
                activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ITEM LIST */}
      <div style={{
          height: '100%',
          borderLeft: '1px solid #edf2f7',
          paddingLeft: '32px',
          display: 'flex',
          flexDirection: 'column'
      }}>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: '#2d3748' }}>
          Top Items
        </h3>
        <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: '#a0aec0', fontWeight: 500, textTransform: 'uppercase' }}>
          {periodLabel}: {activeData?.name || '-'}
        </p>

        <div style={{ flex: 1, overflowY: 'auto' }}>
            {topItems.length > 0 ? (
                topItems.map((item, idx) => (
                    <div key={idx} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px',
                        paddingBottom: '12px',
                        borderBottom: idx === topItems.length - 1 ? 'none' : '1px solid #f7fafc'
                    }}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <div style={{
                                width: '24px', height: '24px', borderRadius: '50%',
                                background: '#fff5f0', color: '#fe6b40',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.75rem', fontWeight: 'bold',
                                flexShrink: 0
                            }}>
                                {idx + 1}
                            </div>
                            <span style={{
                                fontSize: '0.9rem', color: '#4a5568', fontWeight: 500,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px'
                            }}>
                                {item.name || "Unknown Item"}
                            </span>
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#2d3748' }}>
                            ${(item.price || 0).toFixed(2)}
                        </span>
                    </div>
                ))
            ) : (
                <div style={{ color: '#a0aec0', fontSize: '0.9rem', fontStyle: 'italic' }}>
                    No items found.
                </div>
            )}
        </div>
      </div>
    </div>
  )
}