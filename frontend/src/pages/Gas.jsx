// src/pages/Gas.jsx
import React, { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { MapPin, ExternalLink, TrendingUp } from 'lucide-react'

// --- HELPER: COLOR SCALE ---
const getPriceColor = (price) => {
  if (price < 3.50) return '#48bb78' // Green (Cheap)
  if (price < 4.50) return '#d69e2e' // Yellow (Avg)
  return '#e53e3e' // Red (Expensive)
}

export default function Gas() {
  const { currentUser } = useOutletContext() || {}
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  const [stationStats, setStationStats] = useState([])
  const [chartData, setChartData] = useState([])
  const [stationsList, setStationsList] = useState([])

  useEffect(() => {
    if (currentUser) fetchGasData()
  }, [currentUser])

  async function fetchGasData() {
    setLoading(true)
    setErrorMsg(null)
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select(`
          id, purchase_date, store_name, total_amount, store_address,
          receipt_items ( name, price, quantity )
        `)
        .eq('discord_user_id', currentUser.discord_id)
        .in('receipt_type', ['Gas', 'Fuel', 'Transportation'])
        .order('purchase_date', { ascending: true })

      if (error) throw error

      if (data && data.length > 0) {
        processData(data)
      } else {
        console.warn("No Gas data found.")
      }
    } catch (err) {
      console.error("Error fetching gas data:", err)
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  function processData(data) {
    try {
        const stationMap = {}
        const dateMap = {}

        data.forEach(t => {
            if (!t.purchase_date) return;

            // 1. Calculate Unit Price
            let unitPrice = 0
            if (t.receipt_items && t.receipt_items.length > 0) {
                const fuelItem = t.receipt_items[0]
                const qty = Number(fuelItem.quantity) || 1
                unitPrice = (Number(fuelItem.price) || 0) / qty
            } else {
                unitPrice = Number(t.total_amount) || 0
            }

            // 2. Aggregate Station Stats
            const name = t.store_name || "Unknown Station"
            const address = t.store_address || name

            if (!stationMap[name]) {
                stationMap[name] = {
                    name,
                    address,
                    visits: 0,
                    totalPriceSum: 0,
                    lastDate: t.purchase_date
                }
            }
            stationMap[name].visits += 1
            stationMap[name].totalPriceSum += unitPrice
            // Keep track of most recent visit
            if (t.purchase_date > stationMap[name].lastDate) {
                stationMap[name].lastDate = t.purchase_date
            }

            // 3. Prepare Chart Data
            const dateKey = new Date(t.purchase_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            const rawDate = new Date(t.purchase_date)

            if (!dateMap[dateKey]) dateMap[dateKey] = { date: dateKey, rawDate }
            dateMap[dateKey][name] = unitPrice
        })

        // Finalize Station List (Sorted by Visits - Most Frequent First)
        const statsArray = Object.values(stationMap).map(s => ({
            ...s,
            avgPrice: s.totalPriceSum / (s.visits || 1)
        })).sort((a, b) => b.visits - a.visits)

        setStationStats(statsArray)
        setStationsList(statsArray.map(s => s.name))

        const chartArray = Object.values(dateMap).sort((a, b) => a.rawDate - b.rawDate)
        setChartData(chartArray)

    } catch (err) {
        console.error("Data processing error:", err)
        setErrorMsg("Error processing data: " + err.message)
    }
  }

  return (
    <div className="dashboard-container" style={{maxWidth: '1200px', margin: '0 auto', paddingBottom: '100px'}}>

      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#2d3748', margin: 0 }}>Gas Station Insights</h1>
        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <p style={{ color: '#718096', marginTop: '4px' }}>Track fuel prices and filling spots</p>
            {loading && <span style={{fontSize: '0.8rem', color: '#fe6b40', fontWeight: 'bold'}}>Updating...</span>}
        </div>
      </div>

      {errorMsg && (
          <div style={{ padding: '16px', background: '#fff5f5', color: '#c53030', borderRadius: '8px', marginBottom: '24px' }}>
              Error: {errorMsg}
          </div>
      )}

      {/* --- SPLIT LAYOUT: LIST vs CHART --- */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px', alignItems: 'start' }}>

        {/* LEFT: STATION STATS LIST (The "Safe Map" Alternative) */}
        <div>
            <h2 style={{fontSize: '1.25rem', fontWeight: '700', color: '#2d3748', marginBottom: '16px'}}>Top Stations</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {stationStats.map((station, idx) => (
                    <div key={idx} style={{
                        background: 'white', padding: '16px', borderRadius: '12px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)', border: '1px solid #edf2f7',
                        display: 'flex', flexDirection: 'column', gap: '8px'
                    }}>
                        {/* Header: Name & Price Badge */}
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <div style={{
                                    background: '#edf2f7', padding: '8px', borderRadius: '8px',
                                    color: '#4a5568'
                                }}>
                                    <MapPin size={18} />
                                </div>
                                <div>
                                    <div style={{fontWeight: '700', color: '#2d3748', fontSize: '0.95rem'}}>{station.name}</div>
                                    <div style={{fontSize: '0.8rem', color: '#718096'}}>{station.visits} Visits</div>
                                </div>
                            </div>
                            <div style={{
                                background: getPriceColor(station.avgPrice),
                                color: 'white', padding: '4px 8px', borderRadius: '6px',
                                fontSize: '0.75rem', fontWeight: '700'
                            }}>
                                ${station.avgPrice.toFixed(2)}
                            </div>
                        </div>

                        {/* Address Link */}
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(station.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                fontSize: '0.8rem', color: '#3182ce', textDecoration: 'none',
                                marginTop: '4px', fontWeight: '500'
                            }}
                        >
                            <ExternalLink size={12} />
                            View location
                        </a>
                    </div>
                ))}

                {stationStats.length === 0 && !loading && (
                    <div style={{color: '#a0aec0', fontStyle: 'italic', fontSize: '0.9rem'}}>No stations found.</div>
                )}
            </div>
        </div>

        {/* RIGHT: CHART SECTION */}
        <div>
            <h2 style={{fontSize: '1.25rem', fontWeight: '700', color: '#2d3748', marginBottom: '16px'}}>Price Trends</h2>
            <div style={{
                background: 'white', padding: '24px', borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.02)', height: '500px'
            }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf2f7" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#a0aec0', fontSize: 11}} dy={10} />
                        <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{fill: '#a0aec0', fontSize: 11}} tickFormatter={v => `$${v}`} />
                        <Tooltip contentStyle={{borderRadius: '8px'}} formatter={(value) => [`$${value.toFixed(2)}`]} />
                        <Legend wrapperStyle={{paddingTop: '20px'}}/>
                        {stationsList.map((stationName, idx) => (
                            <Line
                                key={stationName}
                                type="monotone"
                                dataKey={stationName}
                                stroke={`hsl(${idx * 60}, 70%, 50%)`}
                                strokeWidth={3}
                                connectNulls={true}
                                dot={{r: 4}}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>

      </div>
    </div>
  )
}