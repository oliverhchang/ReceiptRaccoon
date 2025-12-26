import React, { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function SpendingTrendWithBreakdown({ transactions }) {
  // 1. Transform Data
  const data = transactions.map(t => ({
    date: new Date(t.purchase_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    amount: t.total_amount,
    store: t.store_name,
    items: t.receipt_items || [],
    rawDate: t.purchase_date,
    id: t.id // Unique ID for keying
  }))

  // 2. State for the selected trip (Right Panel)
  const [selectedTrip, setSelectedTrip] = useState(null)

  // 3. Effect: Default to the MOST RECENT trip on load
  useEffect(() => {
    if (data.length > 0) {
      setSelectedTrip(data[data.length - 1])
    }
  }, [transactions])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', height: '400px' }}>

      {/* LEFT: The Chart */}
      <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: '#2d3748' }}>
            Spending Trend <span style={{fontSize:'0.8rem', color:'#a0aec0', fontWeight:'normal'}}>(Click points to view details)</span>
        </h3>

        <ResponsiveContainer width="100%" height="85%">
          <AreaChart
            data={data}
            onClick={(state) => {
              // Recharts passes the clicked payload in `state.activePayload`
              if (state && state.activePayload && state.activePayload.length > 0) {
                setSelectedTrip(state.activePayload[0].payload)
              }
            }}
          >
            <defs>
              <linearGradient id="colorTrip" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fe6b40" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#fe6b40" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf2f7" />

            <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{fill: '#a0aec0', fontSize: 12}}
                dy={10}
            />
            <YAxis
                axisLine={false}
                tickLine={false}
                tick={{fill: '#a0aec0', fontSize: 12}}
                tickFormatter={v => `$${v}`}
            />

            {/* Custom Tooltip that doesn't block the click view */}
            <Tooltip
                cursor={{ stroke: '#fe6b40', strokeWidth: 1 }}
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                formatter={(value) => [`$${value.toFixed(2)}`, 'Total']}
            />

            <Area
                type="monotone"
                dataKey="amount"
                stroke="#fe6b40"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorTrip)"
                activeDot={{ r: 6, strokeWidth: 0 }} // Larger dot on hover/click
                style={{ cursor: 'pointer' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* RIGHT: The Breakdown Panel */}
      <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', overflowY: 'auto' }}>

        {selectedTrip ? (
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#2d3748' }}>
              {selectedTrip.date}
            </h3>
            <div style={{marginBottom: '20px'}}>
              <div style={{fontSize: '0.9rem', color: '#718096'}}>{selectedTrip.store}</div>
              <div style={{fontSize: '1.8rem', fontWeight: '800', color: '#fe6b40'}}>
                ${selectedTrip.amount.toFixed(2)}
              </div>
            </div>

            <h4 style={{fontSize: '0.75rem', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '1px', borderBottom:'1px solid #edf2f7', paddingBottom:'8px', marginBottom:'12px'}}>
                Items Purchased
            </h4>

            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              {selectedTrip.items.map((item, idx) => (
                <div key={idx} style={{display: 'flex', justifyContent: 'space-between', alignItems:'center', fontSize: '0.9rem'}}>
                  <span style={{color: '#4a5568', maxWidth:'140px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                    {item.name || 'Unknown Item'}
                  </span>
                  <span style={{fontWeight: '600', color: '#2d3748'}}>${item.price.toFixed(2)}</span>
                </div>
              ))}

              {selectedTrip.items.length === 0 && (
                 <div style={{color:'#cbd5e0', fontStyle:'italic', fontSize:'0.9rem'}}>No individual items found.</div>
              )}
            </div>
          </div>
        ) : (
          <div style={{height: '100%', display: 'flex', flexDirection:'column', alignItems: 'center', justifyContent: 'center', color: '#cbd5e0', textAlign: 'center'}}>
            <p>Select a trip from the chart to view details</p>
          </div>
        )}
      </div>

    </div>
  )
}