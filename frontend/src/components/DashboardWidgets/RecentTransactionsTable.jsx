// src/components/DashboardWidgets/RecentTransactionsTable.jsx
import React, { useState } from 'react'
import { Eye, X } from 'lucide-react'

export default function RecentTransactionsTable({ transactions }) {
  const [selectedImage, setSelectedImage] = useState(null)

  // 1. Get the 5 most recent receipts
  // We reverse the array because the Dashboard fetches them old->new for the charts
  const recentReceipts = [...transactions].reverse().slice(0, 5)

  return (
    <>
      <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: '#2d3748' }}>
          Recent Transactions
        </h3>

        <table style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead>
            <tr style={{textAlign: 'left', color: '#a0aec0', fontSize: '0.85rem', borderBottom: '1px solid #edf2f7'}}>
              <th style={{padding: '12px'}}>Date</th>
              <th style={{padding: '12px'}}>Store</th>
              <th style={{padding: '12px'}}>Items</th>
              <th style={{padding: '12px'}}>Total</th>
              <th style={{padding: '12px', textAlign: 'right'}}>Receipt</th>
            </tr>
          </thead>
          <tbody>
            {recentReceipts.map((r) => (
              <tr key={r.id} style={{borderBottom: '1px solid #f7fafc', fontSize: '0.95rem', color: '#4a5568'}}>
                <td style={{padding: '12px'}}>
                  {new Date(r.purchase_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </td>
                <td style={{padding: '12px', fontWeight: '500'}}>{r.store_name || 'Unknown'}</td>
                <td style={{padding: '12px', color: '#718096', fontSize: '0.85rem'}}>
                   {r.receipt_items?.length || 0} items
                </td>
                <td style={{padding: '12px', fontWeight: '600'}}>${r.total_amount.toFixed(2)}</td>
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
            {recentReceipts.length === 0 && (
              <tr>
                <td colSpan={5} style={{padding: '20px', textAlign: 'center', color: '#a0aec0'}}>No receipts found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- IMAGE MODAL --- */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)} // Click background to close
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}
        >
          <div style={{position: 'relative', maxWidth: '500px', width: '100%'}} onClick={e => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={() => setSelectedImage(null)}
              style={{
                position: 'absolute', top: '-15px', right: '-15px',
                background: 'white', border: 'none', borderRadius: '50%',
                width: '32px', height: '32px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
              }}
            >
              <X size={18} color="#2d3748"/>
            </button>

            {/* The Image */}
            <img
              src={selectedImage}
              alt="Receipt"
              style={{
                width: '100%', borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                maxHeight: '80vh', objectFit: 'contain', background: 'white'
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}