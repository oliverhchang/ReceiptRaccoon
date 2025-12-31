// src/pages/Grocery.jsx
import React, { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../supabaseClient'

import { GROCERY_ITEM_COLORS, DEFAULT_COLOR } from '../assets/colors'

import CategoryLineChart from '../components/DashboardWidgets/CategoryLineChart'
import CategoryPieChart from '../components/DashboardWidgets/CategoryPieChart'
import ToiletriesTable from '../components/DashboardWidgets/ToiletriesTable'
// 1. IMPORT NEW WIDGET
import SubCategoryBreakdown from '../components/DashboardWidgets/SubCategoryBreakdown'

export default function Grocery() {
  const { currentUser } = useOutletContext()
  const [loading, setLoading] = useState(true)
  const [groceryTransactions, setGroceryTransactions] = useState([])
  const [itemPieData, setItemPieData] = useState([])

  useEffect(() => {
    if (currentUser) fetchGroceryData()
  }, [currentUser])

  async function fetchGroceryData() {
    setLoading(true)
    try {
      const { data: receipts, error } = await supabase
        .from('receipts')
        .select(`
          id, total_amount, purchase_date, store_name, image_url,
          receipt_items ( name, category, price ) 
        `)
        .eq('discord_user_id', currentUser.discord_id)
        .in('receipt_type', ['Groceries', 'Grocery'])
        .order('purchase_date', { ascending: true })

      if (error) console.error(error)

      if (receipts && receipts.length > 0) {
        setGroceryTransactions(receipts)

        const catMap = {}
        receipts.forEach(receipt => {
          receipt.receipt_items.forEach(item => {
            if (item.category) {
              catMap[item.category] = (catMap[item.category] || 0) + item.price
            }
          })
        })

        setItemPieData(Object.keys(catMap).map(cat => ({
            name: cat,
            value: catMap[cat],
            color: GROCERY_ITEM_COLORS[cat] || DEFAULT_COLOR
        })))

      } else {
        setGroceryTransactions([])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div style={{padding: '40px'}}>Loading Grocery Data...</div>

  return (
    <div className="dashboard-container" style={{maxWidth: '1200px', margin: '0 auto', paddingBottom: '100px'}}>

      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#2d3748', margin: 0 }}>Grocery Insights</h1>
        <p style={{ color: '#718096', marginTop: '4px' }}>Deep dive into your supermarket spending</p>
      </div>

      {/* 1. SPENDING ANALYSIS */}
      <div style={{marginBottom: '60px', height: '600px'}}>
         <CategoryLineChart transactions={groceryTransactions} />
      </div>

      {/* 2. CATEGORY BREAKDOWN (Pie) */}
      <div style={{marginBottom: '60px', height: '500px'}}>
         <CategoryPieChart data={itemPieData} />
      </div>

      {/* 3. NEW: SUB-CATEGORY DEEP DIVE */}
      <div style={{marginBottom: '60px'}}>
         <SubCategoryBreakdown transactions={groceryTransactions} />
      </div>

      {/* 4. FREQUENCY TRACKER */}
      <div style={{marginBottom: '60px'}}>
         <ToiletriesTable transactions={groceryTransactions} />
      </div>

    </div>
  )
}