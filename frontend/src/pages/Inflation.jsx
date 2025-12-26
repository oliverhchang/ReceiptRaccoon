// src/pages/Inflation.jsx
import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Globe, TrendingUp, DollarSign } from 'lucide-react'
import StatCard from '../components/DashboardWidgets/StatCard'
import ItemPriceChart from '../components/DashboardWidgets/ItemPriceChart'
import StoreBarChart from '../components/DashboardWidgets/StoreBarChart'

export default function Inflation() {
  const [loading, setLoading] = useState(true)
  const [globalStats, setGlobalStats] = useState({ totalSpent: 0, totalReceipts: 0 })
  const [allTransactions, setAllTransactions] = useState([])

  useEffect(() => {
    fetchGlobalData()
  }, [])

  async function fetchGlobalData() {
    setLoading(true)
    try {
      // 1. Fetch ALL receipts (No user filter)
      const { data: receipts, error } = await supabase
        .from('receipts')
        .select(`
          id, total_amount, purchase_date, store_name
        `)
        .order('purchase_date', { ascending: true })

      if (error) throw error

      if (receipts) {
        setAllTransactions(receipts)

        const totalSpent = receipts.reduce((sum, r) => sum + (r.total_amount || 0), 0)
        setGlobalStats({
          totalSpent,
          totalReceipts: receipts.length
        })
      }
    } catch (err) {
      console.error("Error fetching inflation data:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div style={{padding: '40px'}}>Loading Community Data...</div>

  return (
    <div className="dashboard-container" style={{maxWidth: '1200px', margin: '0 auto'}}>

      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#2d3748', margin: 0 }}>
          <span style={{color: '#805ad5'}}>Community</span> Inflation Tracker
        </h1>
        <p style={{ color: '#718096', marginTop: '4px' }}>
          Aggregated insights from all Receipt Raccoon users.
        </p>
      </div>

      {/* --- SECTION 1: GLOBAL STATS --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '48px' }}>
        <StatCard
          title="Server Total Spent"
          value={`$${globalStats.totalSpent.toLocaleString()}`}
          icon={Globe}
          color="#805ad5"
        />
        <StatCard
          title="Total Receipts Tracked"
          value={globalStats.totalReceipts}
          icon={TrendingUp}
          color="#d53f8c"
        />
        <StatCard
          title="Avg Receipt (Global)"
          value={`$${(globalStats.totalSpent / (globalStats.totalReceipts || 1)).toFixed(2)}`}
          icon={DollarSign}
          color="#319795"
        />
      </div>

      {/* --- SECTION 2: PRICE TRACKER --- */}
      <h2 style={{fontSize: '1.5rem', fontWeight: '700', color: '#2d3748', marginBottom: '24px'}}>Item Price History</h2>
      <div style={{ marginBottom: '48px' }}>
        <ItemPriceChart />
      </div>

      {/* --- SECTION 3: POPULAR STORES --- */}
      <h2 style={{fontSize: '1.5rem', fontWeight: '700', color: '#2d3748', marginBottom: '24px'}}>Most Popular Stores (Server-wide)</h2>
      <div style={{ marginBottom: '48px' }}>
        <StoreBarChart transactions={allTransactions} />
      </div>

    </div>
  )
}