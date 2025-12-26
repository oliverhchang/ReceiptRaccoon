import React, { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { Calendar, ShoppingBag, CreditCard } from 'lucide-react'

// Widgets
import StatCard from '../components/DashboardWidgets/StatCard'
import CategoryPieChart from '../components/DashboardWidgets/CategoryPieChart'
import SpendingTrendWithBreakdown from '../components/DashboardWidgets/SpendingTrendWithBreakdown'
import CategoryLineChart from '../components/DashboardWidgets/CategoryLineChart'
import ToiletriesTable from '../components/DashboardWidgets/ToiletriesTable'
import StoreBarChart from '../components/DashboardWidgets/StoreBarChart'
import RecentTransactionsTable from '../components/DashboardWidgets/RecentTransactionsTable'

export default function Dashboard() {
  const { currentUser } = useOutletContext()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [pieData, setPieData] = useState([])
  const [kpi, setKpi] = useState({ lastDate: '-', count: 0, avg: 0 })

  useEffect(() => {
    if (currentUser) fetchDashboardData()
  }, [currentUser])

  async function fetchDashboardData() {
    setLoading(true)
    try {
      const { data: receipts, error } = await supabase
        .from('receipts')
        .select(`
          id, total_amount, purchase_date, store_name, image_url, 
          receipt_items ( name, category, price ) 
        `)
        .eq('discord_user_id', currentUser.discord_id)
        .order('purchase_date', { ascending: true })

      if (error) console.error(error)

      if (receipts && receipts.length > 0) {
        setTransactions(receipts)

        // 1. Calculate Total Spent
        const totalSpent = receipts.reduce((sum, r) => sum + (r.total_amount || 0), 0)

        // 2. FIND THE LATEST DATE MANUALLY
        // We iterate through all receipts to find the actual maximum date string
        let latestDateStr = '';
        receipts.forEach(r => {
          if (r.purchase_date && (!latestDateStr || r.purchase_date > latestDateStr)) {
            latestDateStr = r.purchase_date;
          }
        });

        let displayDate = '-'
        if (latestDateStr) {
          // Splitting ensures no timezone shifts; YYYY-MM-DD -> MM/DD/YYYY
          const [year, month, day] = latestDateStr.split('-')
          if (year && month && day) {
            displayDate = `${month}/${day}/${year}`
          }
        }

        setKpi({
          lastDate: displayDate,
          count: receipts.length,
          avg: totalSpent / receipts.length
        })

        // 3. Category Pie Chart Processing
        const catMap = {}
        receipts.forEach(receipt => {
          receipt.receipt_items.forEach(item => {
            if (item.category) {
              catMap[item.category] = (catMap[item.category] || 0) + item.price
            }
          })
        })
        setPieData(Object.keys(catMap).map(cat => ({ name: cat, value: catMap[cat] })))
      } else {
        setTransactions([])
        setKpi({ lastDate: '-', count: 0, avg: 0 })
      }

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div style={{padding: '40px'}}>Loading Dashboard...</div>

  return (
    <div className="dashboard-container" style={{maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px'}}>

      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#2d3748', margin: 0 }}>Overview</h1>
        <p style={{ color: '#718096', marginTop: '4px' }}>Welcome back, {currentUser.display_name}</p>
      </div>

      {/* --- SECTION 1: KPI & OVERALL TREND --- */}
      <div style={{display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '60px'}}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          <StatCard title="Last Grocery Trip" value={kpi.lastDate} icon={Calendar} color="#fe6b40" />
          <StatCard title="Receipts Scanned" value={kpi.count} icon={ShoppingBag} color="#3b82f6" />
          <StatCard title="Average Trip" value={`$${kpi.avg.toFixed(2)}`} icon={CreditCard} color="#10b981" />
        </div>

        <SpendingTrendWithBreakdown transactions={transactions} />
      </div>

      <h2 style={{fontSize: '1.5rem', fontWeight: '700', color: '#2d3748', marginBottom: '24px'}}>Spending Analysis</h2>

      <div style={{marginBottom: '24px'}}>
         <CategoryLineChart transactions={transactions} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '60px' }}>
        <StoreBarChart transactions={transactions} />
        <CategoryPieChart data={pieData} />
      </div>

      <h2 style={{fontSize: '1.5rem', fontWeight: '700', color: '#2d3748', marginBottom: '24px'}}>Frequency Tracker</h2>
      <div style={{marginBottom: '60px'}}>
        <ToiletriesTable transactions={transactions} />
      </div>

      <h2 style={{fontSize: '1.5rem', fontWeight: '700', color: '#2d3748', marginBottom: '24px'}}>Recent Activity</h2>
      <div style={{marginBottom: '24px'}}>
        <RecentTransactionsTable transactions={transactions} />
      </div>
    </div>
  )
}