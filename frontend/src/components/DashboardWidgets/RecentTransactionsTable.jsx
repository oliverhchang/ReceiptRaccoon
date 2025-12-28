// src/components/DashboardWidgets/RecentTransactionsTable.jsx
import React, { useState } from 'react'
import { Eye, X } from 'lucide-react'

export default function RecentTransactionsTable({ transactions }) {
  const [selectedImage, setSelectedImage] = useState(null)

  // 1. Get ALL receipts (removed .slice(0, 5))
  // We reverse to keep newest at the top, but show the full list
  const allReceipts = [...transactions].reverse()

  return (
    <>
      <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#2d3748' }}>
            All Transactions
          </h3>
          <span style={{ fontSize: '0.85rem', color: '#a0aec0' }}>{allReceipts.length} Total</span>
        </div>

        {/* Added overflowY and maxHeight to keep the dashboard usable if the list is very long */}
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
              <tr style={{textAlign: 'left', color: '#a0aec0', fontSize: '0.85rem', borderBottom: '1px solid #edf2f7'}}>
                <th style={{padding: '12px'}}>Date</th>
                <th style={{padding: '12px'}}>Store</th>
                <th style={{padding: '12px'}}>Items</th>
                <th style={{padding: '12px'}}>Total</th>
                <th style={{padding: '12px', textAlign: 'right'}}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {allReceipts.map((r) => (
                <tr key={r.id} style={{borderBottom: '1px solid #f7fafc', fontSize: '0.95rem', color: '#4a5568'}}>
                  <td style={{padding: '12px'}}>
                    {new Date(r.purchase_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td style={{padding: '12px', fontWeight: '500'}}>{r.store_name || 'Unknown'}</td>
                  <td style={{padding: '12px', color: '#718096', fontSize: '0.85rem'}}>
                     {r.receipt_items?.length || 0} items
                  </td>
                  <td style={{padding: '12px', fontWeight: '600'}}>
                    ${(r.total_amount || 0).toFixed(2)} {/* Safety Guard applied */}
                  </td>
                  <td style={{padding: '12px', textAlign: 'right'}}>
                    {r.image_url ? (
                      <button
                        onClick={() => setSelectedImage(r.image_url)}
                        style={{
                          background: '#edf2f7', border: 'none', borderRadius: '6px',
                          padding: '6px 10px', cursor: 'pointer', color: '#4a5568',
                          display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem',
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
                        onMouseOut={(e) => e.currentTarget.style.background = '#edf2f7'}
                      >
                        <Eye size={14} /> View
                      </button>
                    ) : (
                      <span style={{color: '#cbd5e0', fontSize: '0.8rem'}}>No Image</span>
                    )}
                  </td>
                </tr>
              ))}
              {allReceipts.length === 0 && (
                <tr>
                  <td colSpan={5} style={{padding: '20px', textAlign: 'center', color: '#a0aec0'}}>No receipts found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- IMAGE MODAL --- */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}
        >
          <div style={{position: 'relative', maxWidth: '600px', width: '100%'}} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              style={{
                position: 'absolute', top: '-40px', right: '0',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'white', display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <X size={24} /> <span>Close</span>
            </button>
            <img
              src={selectedImage}
              alt="Receipt"
              style={{
                width: '100%', borderRadius: '12px',
                maxHeight: '85vh', objectFit: 'contain', background: 'white'
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}