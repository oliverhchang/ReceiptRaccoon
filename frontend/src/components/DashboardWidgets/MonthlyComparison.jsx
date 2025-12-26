// src/components/DashboardWidgets/MonthlyComparison.jsx
import React, { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function MonthlyComparison({ currentUser }) {
  const [loading, setLoading] = useState(true)
  const [comparison, setComparison] = useState({ diff: 0, status: 'neutral', currentAmt: 0, lastAmt: 0 })

  useEffect(() => {
    if (currentUser) calculateComparison()
  }, [currentUser])

  async function calculateComparison() {
    try {
      const today = new Date()
      const currentYear = today.getFullYear()
      const currentMonth = today.getMonth() // 0-indexed (0 = Jan)
      const currentDay = today.getDate()

      // 1. Get Range for THIS Month (1st to Today)
      const startCurrent = new Date(currentYear, currentMonth, 1).toISOString()
      const endCurrent = new Date().toISOString()

      // 2. Get Range for LAST Month (1st to Same Day Number)
      // Note: Handle Jan (0) going back to Dec (11) of prev year correctly
      const lastMonthDate = new Date(currentYear, currentMonth - 1, 1)
      const startLast = lastMonthDate.toISOString()
      const endLast = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), currentDay).toISOString()

      // 3. Fetch Data
      const { data, error } = await supabase
        .from('receipts')
        .select('total_amount, purchase_date')
        .eq('discord_user_id', currentUser.discord_id)
        .gte('purchase_date', startLast) // Get everything from start of last month

      if (error) throw error

      // 4. Separate and Sum
      let thisMonthSum = 0
      let lastMonthSum = 0

      data.forEach(r => {
        const d = new Date(r.purchase_date)
        // Check if it belongs to current month window
        if (d >= new Date(startCurrent) && d <= new Date(endCurrent)) {
          thisMonthSum += r.total_amount
        }
        // Check if it belongs to last month window
        else if (d >= new Date(startLast) && d <= new Date(endLast)) {
          lastMonthSum += r.total_amount
        }
      })

      const diff = thisMonthSum - lastMonthSum

      setComparison({
        diff: Math.abs(diff),
        status: diff > 0 ? 'bad' : (diff < 0 ? 'good' : 'neutral'), // Positive diff = Spent MORE (Bad)
        currentAmt: thisMonthSum,
        lastAmt: lastMonthSum
      })

    } catch (err) {
      console.error("Comparison Error:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div style={{height: '100px', background: '#f7fafc', borderRadius: '12px', marginBottom: '20px'}}></div>

  const isGood = comparison.status === 'good'
  const isNeutral = comparison.status === 'neutral'

  return (
    <div style={{
      background: isGood ? '#f0fff4' : (isNeutral ? 'white' : '#fff5f5'),
      border: `1px solid ${isGood ? '#c6f6d5' : (isNeutral ? '#e2e8f0' : '#fed7d7')}`,
      padding: '20px',
      borderRadius: '16px',
      marginBottom: '24px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
    }}>
      <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px'}}>
        <div style={{
          background: isGood ? '#c6f6d5' : (isNeutral ? '#edf2f7' : '#fed7d7'),
          padding: '6px', borderRadius: '50%', display: 'flex'
        }}>
          {isGood ? <TrendingDown size={18} color="#2f855a"/> : (isNeutral ? <Minus size={18} color="#718096"/> : <TrendingUp size={18} color="#c53030"/>)}
        </div>
        <span style={{fontSize: '0.85rem', fontWeight: '600', color: isGood ? '#2f855a' : (isNeutral ? '#718096' : '#c53030')}}>
          {isGood ? 'On Track' : (isNeutral ? 'Steady' : 'Overspending')}
        </span>
      </div>

      <div style={{fontSize: '1.2rem', fontWeight: '800', color: '#2d3748', marginBottom: '4px'}}>
        {isNeutral ? 'Same as last month' : (
          <>
            ${comparison.diff.toFixed(2)} {isGood ? 'less' : 'more'}
          </>
        )}
      </div>

      <div style={{fontSize: '0.8rem', color: '#718096'}}>
        than this time last month
      </div>
    </div>
  )
}