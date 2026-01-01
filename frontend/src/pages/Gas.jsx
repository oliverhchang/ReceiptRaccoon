// src/pages/Gas.jsx
import React, { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { MapPin, ExternalLink, DollarSign, Calendar, Gauge } from 'lucide-react'

// --- CONSTANTS ---
const MPG_ESTIMATE = 25
// Fallback price if quantity is missing (to estimate gallons)
const AVG_PRICE_FALLBACK = 4.00

const getPriceColor = (price) => {
  if (price < 3.50) return '#48bb78' // Green
  if (price < 4.50) return '#d69e2e' // Yellow
  return '#e53e3e' // Red
}

export default function Gas() {
  const { currentUser } = useOutletContext() || {}
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  const [stationStats, setStationStats] = useState([])
  const [chartData, setChartData] = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [stationsList, setStationsList] = useState([])

  // CHANGED: 'totalSpent' -> 'milesDriven'
  const [kpis, setKpis] = useState({ avgPrice: 0, milesDriven: 0, lastFill: '-' })

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
      if (data && data.length > 0) processData(data)
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
        const monthMap = {}

        let globalSumPrice = 0
        let globalCount = 0
        let globalGallons = 0  // Accumulator for gallons
        let lastDateObj = null

        data.forEach(t => {
            if (!t.purchase_date) return;
            const tDate = new Date(t.purchase_date)
            if (!lastDateObj || tDate > lastDateObj) lastDateObj = tDate

            let unitPrice = 0
            let gallons = 0

            // 1. Calculate Unit Price & Gallons
            if (t.receipt_items && t.receipt_items.length > 0) {
                const fuelItem = t.receipt_items[0]
                gallons = Number(fuelItem.quantity) || 0
                // If gallons is 0 (bad data), estimate it from total / fallback price
                if (gallons === 0 && t.total_amount) gallons = t.total_amount / AVG_PRICE_FALLBACK

                // Calculate price per gallon
                unitPrice = gallons > 0 ? (Number(fuelItem.price) || t.total_amount) / gallons : 0
            } else {
                // Fallback for receipts with no items
                unitPrice = Number(t.total_amount) || 0 // Likely inaccurate if it's total, but we keep logic safe
                gallons = t.total_amount / AVG_PRICE_FALLBACK // Estimate gallons
            }

            // Global KPI Accumulators
            if (unitPrice > 0 && unitPrice < 10) { // Filter outliers
                globalSumPrice += unitPrice
                globalCount++
            }
            globalGallons += gallons

            // 2. Aggregate Station Stats
            const name = t.store_name || "Unknown Station"
            const address = t.store_address || name

            if (!stationMap[name]) {
                stationMap[name] = { name, address, visits: 0, totalPriceSum: 0, lastDate: t.purchase_date }
            }
            stationMap[name].visits += 1
            stationMap[name].totalPriceSum += unitPrice
            if (t.purchase_date > stationMap[name].lastDate) stationMap[name].lastDate = t.purchase_date

            // 3. Prepare Charts
            const dateKey = tDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            if (!dateMap[dateKey]) dateMap[dateKey] = { date: dateKey, rawDate: tDate }
            dateMap[dateKey][name] = unitPrice

            const monthKey = tDate.toLocaleDateString('en-US', { year: '2-digit', month: 'short' })
            const sortKey = tDate.getFullYear() * 100 + tDate.getMonth()

            if (!monthMap[monthKey]) monthMap[monthKey] = { name: monthKey, sort: sortKey, total: 0 }
            monthMap[monthKey].total += (t.total_amount || 0)
        })

        // Finalize Arrays
        const statsArray = Object.values(stationMap).map(s => ({
            ...s,
            avgPrice: s.totalPriceSum / (s.visits || 1)
        })).sort((a, b) => b.visits - a.visits)

        setStationStats(statsArray)
        setStationsList(statsArray.map(s => s.name))
        setChartData(Object.values(dateMap).sort((a, b) => a.rawDate - b.rawDate))
        setMonthlyData(Object.values(monthMap).sort((a, b) => a.sort - b.sort))

        // Finalize KPIs
        setKpis({
            avgPrice: globalCount ? (globalSumPrice / globalCount).toFixed(2) : "0.00",
            // CALCULATION: Total Gallons * MPG Constant
            milesDriven: (globalGallons * MPG_ESTIMATE).toLocaleString(undefined, {maximumFractionDigits: 0}),
            lastFill: lastDateObj ? lastDateObj.toLocaleDateString() : '-'
        })

    } catch (err) {
        console.error("Data processing error:", err)
        setErrorMsg(err.message)
    }
  }

  return (
    <div className="dashboard-container" style={{maxWidth: '1200px', margin: '0 auto', paddingBottom: '100px'}}>

      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#2d3748', margin: 0 }}>Gas Station Insights</h1>
        <p style={{ color: '#718096', marginTop: '4px' }}>Track fuel prices and filling spots</p>
      </div>

      {/* --- KPI CARDS --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
          <StatCard
            title="Avg Price / Gal"
            value={`$${kpis.avgPrice}`}
            icon={<DollarSign size={20} color="white"/>}
            color="#48bb78"
          />
          {/* CHANGED CARD: Miles Driven */}
          <StatCard
            title="Est. Miles Driven"
            value={`${kpis.milesDriven} mi`}
            icon={<Gauge size={20} color="white"/>}
            color="#ed8936"
          />
          <StatCard
            title="Last Fill-up"
            value={kpis.lastFill}
            icon={<Calendar size={20} color="white"/>}
            color="#3182ce"
          />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px', alignItems: 'start' }}>

        {/* LEFT: STATION LIST */}
        <div>
            <h2 style={{fontSize: '1.25rem', fontWeight: '700', color: '#2d3748', marginBottom: '16px'}}>Top Stations</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {stationStats.map((station, idx) => (
                    <div key={idx} style={{
                        background: 'white', padding: '16px', borderRadius: '12px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)', border: '1px solid #edf2f7'
                    }}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <div style={{background: '#edf2f7', padding: '8px', borderRadius: '8px', color: '#4a5568'}}>
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

                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(station.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                fontSize: '0.8rem', color: '#3182ce', textDecoration: 'none',
                                marginTop: '8px', fontWeight: '500'
                            }}
                        >
                            <ExternalLink size={12} />
                            View location
                        </a>
                    </div>
                ))}
                {stationStats.length === 0 && !loading && (
                    <div style={{color: '#a0aec0', fontStyle: 'italic', fontSize: '0.9rem'}}>No gas receipts found.</div>
                )}
            </div>
        </div>

        {/* RIGHT: CHARTS */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '32px'}}>

            {/* MONTHLY SPEND */}
            <div>
                <h2 style={{fontSize: '1.25rem', fontWeight: '700', color: '#2d3748', marginBottom: '16px'}}>Monthly Spend</h2>
                <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf2f7" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#a0aec0', fontSize: 11}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#a0aec0', fontSize: 11}} tickFormatter={v => `$${v}`} />
                            <Tooltip cursor={{fill: '#f7fafc'}} contentStyle={{borderRadius: '8px'}} formatter={(value) => [`$${value.toFixed(2)}`, 'Total Spent']} />
                            <Bar dataKey="total" fill="#ed8936" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* PRICE TREND */}
            <div>
                <h2 style={{fontSize: '1.25rem', fontWeight: '700', color: '#2d3748', marginBottom: '16px'}}>Price Trends ($/gal)</h2>
                <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', height: '400px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf2f7" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#a0aec0', fontSize: 11}} dy={10} />
                            <YAxis domain={['dataMin - 0.2', 'dataMax + 0.2']} axisLine={false} tickLine={false} tick={{fill: '#a0aec0', fontSize: 11}} tickFormatter={v => `$${v}`} />
                            <Tooltip contentStyle={{borderRadius: '8px'}} formatter={(value) => [`$${value.toFixed(2)}`]} />
                            <Legend wrapperStyle={{paddingTop: '20px'}}/>
                            {stationsList.map((stationName, idx) => (
                                <Line
                                    key={stationName}
                                    type="monotone"
                                    dataKey={stationName}
                                    stroke={`hsl(${idx * 50 + 200}, 70%, 50%)`}
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
    </div>
  )
}

function StatCard({ title, value, icon, color }) {
    return (
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 10px ${color}40` }}>
                {icon}
            </div>
            <div>
                <div style={{ color: '#718096', fontSize: '0.9rem', fontWeight: '600' }}>{title}</div>
                <div style={{ color: '#2d3748', fontSize: '1.5rem', fontWeight: '800', marginTop: '2px' }}>{value}</div>
            </div>
        </div>
    )
}