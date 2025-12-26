import React from 'react'

export default function ToiletriesTable({ transactions }) {
  // 1. Flatten all items, filter for "Toiletries"
  const toiletryItems = []
  transactions.forEach(t => {
    t.receipt_items.forEach(item => {
      if (item.category === "Toiletries/Cleaning") {
        toiletryItems.push({
          ...item,
          purchaseDate: new Date(t.purchase_date),
          formattedDate: new Date(t.purchase_date).toLocaleDateString()
        })
      }
    })
  })

  // Sort by newest first
  toiletryItems.sort((a,b) => b.purchaseDate - a.purchaseDate)

  // Calculate stats
  const today = new Date()
  const rows = toiletryItems.map(item => {
    const diffTime = Math.abs(today - item.purchaseDate)
    const daysSince = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const costPerDay = daysSince > 0 ? (item.price / daysSince) : item.price

    return { ...item, daysSince, costPerDay }
  })

  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: '#2d3748' }}>Toiletries Tracker</h3>

      <table style={{width: '100%', borderCollapse: 'collapse'}}>
        <thead>
          <tr style={{textAlign: 'left', color: '#a0aec0', fontSize: '0.85rem', borderBottom: '1px solid #edf2f7'}}>
            <th style={{padding: '12px'}}>Item</th>
            <th style={{padding: '12px'}}>Last Purchased</th>
            <th style={{padding: '12px'}}>Days Ago</th>
            <th style={{padding: '12px'}}>Cost / Day</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} style={{borderBottom: '1px solid #f7fafc', fontSize: '0.95rem', color: '#4a5568'}}>
              <td style={{padding: '12px', fontWeight: '500'}}>{row.name}</td>
              <td style={{padding: '12px'}}>{row.formattedDate}</td>
              <td style={{padding: '12px'}}>
                <span style={{
                    background: row.daysSince > 30 ? '#fff5f5' : '#f0fff4',
                    color: row.daysSince > 30 ? '#c53030' : '#2f855a',
                    padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold'
                }}>
                  {row.daysSince} days
                </span>
              </td>
              <td style={{padding: '12px'}}>${row.costPerDay.toFixed(2)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={4} style={{padding: '20px', textAlign: 'center', color: '#a0aec0'}}>No toiletries found yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}