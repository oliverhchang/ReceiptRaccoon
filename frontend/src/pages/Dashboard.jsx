// src/pages/Dashboard.jsx
import React, { useEffect, useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { Calendar, ShoppingBag, CreditCard } from 'lucide-react'

// IMPORT COLORS
import { CATEGORY_COLORS, DEFAULT_COLOR } from '../assets/colors'

// Widgets
import StatCard from '../components/DashboardWidgets/StatCard'
import SpendingTrendWithBreakdown from '../components/DashboardWidgets/SpendingTrendWithBreakdown'
import StoreBarChart from '../components/DashboardWidgets/StoreBarChart'
import CategoryPieChart from '../components/DashboardWidgets/CategoryPieChart'
import SpendingMap from '../components/DashboardWidgets/SpendingMap'
import RecentTransactionsTable from '../components/DashboardWidgets/RecentTransactionsTable'

export default function Dashboard() {
  const { currentUser } = useOutletContext() // Ensure this context provides currentUser
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState([])

  // VIEW MODE: Weekly / Monthly / Yearly
  const [viewMode, setViewMode] = useState('monthly')

  // DATA STATES
  const [processedGraphData, setProcessedGraphData] = useState([])

  // Track which data point is active
  const [focusedPeriod, setFocusedPeriod] = useState(null)

  const [kpi, setKpi] = useState({ lastDate: '-', count: 0, avg: 0 })

  useEffect(() => {
    if (currentUser) fetchDashboardData()
  }, [currentUser])

  // Recalculate Graph Data when View Mode changes
  useEffect(() => {
    if (transactions.length > 0) {
      processDataByMode(transactions, viewMode)
    }
  }, [viewMode, transactions])

  // --- PIE CHART DATA CALCULATION ---
  const activePieData = useMemo(() => {
    let itemsToProcess = []

    // 1. Determine which items to aggregate
    if (focusedPeriod && focusedPeriod.items) {
        itemsToProcess = focusedPeriod.items
    } else {
        // Fallback: If no focus, use the items from the LAST period in the graph
        if (processedGraphData.length > 0) {
             const lastData = processedGraphData[processedGraphData.length - 1]
             itemsToProcess = lastData.items
        }
    }

    // 2. Aggregate by High-Level Category
    const typeMap = {}
    itemsToProcess.forEach(item => {
        let type = item.category || "Uncategorized" // In our new processDataByMode, 'category' IS the high-level type
        if (type === "Grocery") type = "Groceries"
        typeMap[type] = (typeMap[type] || 0) + (item.price || item.total_amount || 0)
    })

    // 3. Map to Recharts format and Inject Colors
    return Object.keys(typeMap).map(type => ({
        name: type,
        value: typeMap[type],
        color: CATEGORY_COLORS[type] || DEFAULT_COLOR
    }))

  }, [focusedPeriod, processedGraphData, transactions])


  async function fetchDashboardData() {
    setLoading(true)
    try {
      const { data: receipts, error } = await supabase
        .from('receipts')
        .select(`
            id, total_amount, purchase_date, store_name, store_address, image_url, receipt_type,
            receipt_items ( name, price, category )
        `)
        .eq('discord_user_id', currentUser.discord_id)
        .order('purchase_date', { ascending: true })

      if (error) console.error(error)

      if (receipts && receipts.length > 0) {
        setTransactions(receipts)

        // Global KPIs
        const totalSpent = receipts.reduce((sum, r) => sum + (r.total_amount || 0), 0)
        let latestDateStr = ''
        receipts.forEach(r => {
           if (r.purchase_date && (!latestDateStr || r.purchase_date > latestDateStr)) latestDateStr = r.purchase_date
        })
        setKpi({
          lastDate: latestDateStr ? new Date(latestDateStr).toLocaleDateString() : '-',
          count: receipts.length,
          avg: totalSpent / receipts.length
        })
      } else {
        setTransactions([])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function processDataByMode(data, mode) {
    const groups = {}

    data.forEach(t => {
      if (!t.purchase_date) return
      const dateObj = new Date(t.purchase_date)

      let key = ''
      let sortTime = 0

      if (mode === 'weekly') {
        const d = new Date(dateObj)
        d.setDate(d.getDate() - d.getDay())
        key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        sortTime = d.getTime()
      } else if (mode === 'monthly') {
        key = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        sortTime = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).getTime()
      } else if (mode === 'yearly') {
        key = dateObj.getFullYear().toString()
        sortTime = new Date(dateObj.getFullYear(), 0, 1).getTime()
      }

      if (!groups[key]) {
        groups[key] = {
            name: key,
            amount: 0,
            items: [],
            sortTime: sortTime
        }
      }

      groups[key].amount += (t.total_amount || 0)

      // --- CRITICAL FIX FOR FILTERING ---
      // The Chart Widget filters by 'category', but the Dropdown uses Receipt Types (e.g. "Groceries").
      // The items in the DB have low-level categories (e.g. "Fruits").
      // We must OVERWRITE 'category' here to be the Receipt Type so they match.

      if (t.receipt_items && t.receipt_items.length > 0) {
         const itemsWithType = t.receipt_items.map(i => ({
             name: i.name,
             price: i.price,
             store: t.store_name, // Pass store name for context
             // Align category with Receipt Type (normalize "Grocery" -> "Groceries")
             category: (t.receipt_type === "Grocery" ? "Groceries" : t.receipt_type) || "Uncategorized"
         }))
         groups[key].items.push(...itemsWithType)
      } else {
         // Handle manual receipts that might have no items
         groups[key].items.push({
             name: t.store_name,
             price: t.total_amount,
             store: t.store_name,
             category: (t.receipt_type === "Grocery" ? "Groceries" : t.receipt_type) || "Uncategorized"
         })
      }
    })

    const graphArray = Object.values(groups).sort((a, b) => a.sortTime - b.sortTime)
    setProcessedGraphData(graphArray)

    // Default focus to latest
    if(graphArray.length > 0) {
        setFocusedPeriod(graphArray[graphArray.length - 1])
    }
  }

  if (loading) return <div style={{padding: '40px'}}>Loading Dashboard...</div>

  return (
    <div className="dashboard-container" style={{maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px'}}>

      <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#2d3748', margin: 0 }}>Overview</h1>
          <p style={{ color: '#718096', marginTop: '4px' }}>Welcome back, {currentUser?.display_name || 'User'}</p>
        </div>

        <div style={{ background: 'white', padding: '4px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', gap: '4px' }}>
            {['weekly', 'monthly', 'yearly'].map(m => (
                <button
                    key={m}
                    onClick={() => setViewMode(m)}
                    style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        textTransform: 'capitalize',
                        cursor: 'pointer',
                        background: viewMode === m ? '#fff5f0' : 'transparent',
                        color: viewMode === m ? '#fe6b40' : '#718096',
                        transition: 'all 0.2s'
                    }}
                >
                    {m}
                </button>
            ))}
        </div>
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '60px'}}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          <StatCard title="Last Receipt" value={kpi.lastDate} icon={Calendar} color="#fe6b40" />
          <StatCard title="Receipts Scanned" value={kpi.count} icon={ShoppingBag} color="#3b82f6" />
          <StatCard title="Average Spend" value={`$${kpi.avg.toFixed(2)}`} icon={CreditCard} color="#10b981" />
        </div>

        {/* Updated Widget with currentUser passed in */}
        <SpendingTrendWithBreakdown
            data={processedGraphData}
            periodLabel={viewMode === 'weekly' ? 'Week of' : viewMode === 'monthly' ? 'Month' : 'Year'}
            onHoverPeriod={(period) => setFocusedPeriod(period)}
            currentUser={currentUser}
        />
      </div>

      <h2 style={{fontSize: '1.5rem', fontWeight: '700', color: '#2d3748', marginBottom: '24px'}}>Spending Habits</h2>

      {/* 1. Bar Chart and Pie Chart Side-by-Side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <StoreBarChart transactions={transactions} />

        <div style={{position: 'relative'}}>
            <CategoryPieChart data={activePieData} />
            <div style={{
                position: 'absolute', top: '24px', right: '24px',
                fontSize: '0.75rem', fontWeight: 'bold',
                background: '#edf2f7', padding: '4px 8px', borderRadius: '4px', color: '#718096'
            }}>
                {focusedPeriod ? focusedPeriod.name : 'Latest'}
            </div>
        </div>
      </div>

      {/* 2. Map (Full Width) */}
      <div style={{marginBottom: '60px'}}>
        <SpendingMap transactions={transactions} />
      </div>

      <h2 style={{fontSize: '1.5rem', fontWeight: '700', color: '#2d3748', marginBottom: '24px'}}>Recent Activity</h2>
      <div style={{marginBottom: '24px'}}>
        <RecentTransactionsTable transactions={transactions} />
      </div>
    </div>
  )
}