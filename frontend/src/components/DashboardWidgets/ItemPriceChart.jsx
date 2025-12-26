// src/components/DashboardWidgets/ItemPriceChart.jsx
import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../supabaseClient'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { X, ChevronDown, Search } from 'lucide-react'

const LINE_COLORS = ['#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#fe6b40']

export default function ItemPriceChart() {
  const [availableItems, setAvailableItems] = useState([])
  const [selectedItems, setSelectedItems] = useState(['Eggs'])
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(false)

  // -- NEW SEARCHABLE DROPDOWN STATE --
  const [searchTerm, setSearchTerm] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // 1. Fetch Item List on Mount
  useEffect(() => {
    fetchUniqueItems()

    // Click outside to close dropdown
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // 2. Fetch Prices when Selection Changes
  useEffect(() => {
    if (selectedItems.length > 0) {
      fetchPriceHistory(selectedItems)
    } else {
      setChartData([])
    }
  }, [selectedItems])

  async function fetchUniqueItems() {
    try {
      const { data, error } = await supabase
        .from('receipt_items')
        .select('name')
        .order('name', { ascending: true })

      if (error) throw error

      const unique = [...new Set(data.map(i => i.name).filter(n => n && n.trim().length > 0))]
      setAvailableItems(unique)
    } catch (err) {
      console.error("Error fetching items:", err)
    }
  }

  async function fetchPriceHistory(itemsToFetch) {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('receipt_items')
        .select(`
          name, price,
          receipts ( purchase_date )
        `)
        .in('name', itemsToFetch)
        .order('id', { ascending: true })

      if (error) throw error

      // Transform Data
      const rawPoints = []
      data.forEach(row => {
        if (!row.receipts || !row.receipts.purchase_date) return
        rawPoints.push({
          dateKey: new Date(row.receipts.purchase_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          rawDate: new Date(row.receipts.purchase_date),
          item: row.name,
          price: row.price
        })
      })

      rawPoints.sort((a, b) => a.rawDate - b.rawDate)

      const mergedMap = new Map()
      rawPoints.forEach(p => {
        const existing = mergedMap.get(p.dateKey) || { date: p.dateKey, rawDate: p.rawDate }
        existing[p.item] = p.price
        mergedMap.set(p.dateKey, existing)
      })

      setChartData(Array.from(mergedMap.values()))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // -- DROPDOWN LOGIC --
  const handleAddItem = (item) => {
    if (!selectedItems.includes(item)) {
      setSelectedItems([...selectedItems, item])
    }
    setSearchTerm('') // Clear input
    setIsDropdownOpen(false) // Close menu
  }

  const handleRemoveItem = (itemToRemove) => {
    setSelectedItems(selectedItems.filter(i => i !== itemToRemove))
  }

  // Filter the list based on what user is typing
  const filteredItems = availableItems.filter(item =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', minHeight: '500px' }}>

      <div style={{marginBottom: '20px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#2d3748' }}>Price Tracker</h3>
          {loading && <span style={{fontSize: '0.8rem', color: '#a0aec0'}}>Updating...</span>}
        </div>

        {/* --- SEARCHABLE DROPDOWN CONTAINER --- */}
        <div ref={dropdownRef} style={{position: 'relative', maxWidth: '400px'}}>

          {/* Input Box */}
          <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
            <Search size={16} color="#a0aec0" style={{position: 'absolute', left: '12px'}}/>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setIsDropdownOpen(true)
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="Search or Select item..."
              style={{
                width: '100%', padding: '10px 10px 10px 38px',
                borderRadius: '8px', border: '1px solid #e2e8f0',
                fontSize: '0.9rem', outline: 'none'
              }}
            />
            <ChevronDown size={16} color="#a0aec0" style={{position: 'absolute', right: '12px', pointerEvents: 'none'}}/>
          </div>

          {/* Floating List */}
          {isDropdownOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: 'white', border: '1px solid #e2e8f0',
              borderRadius: '8px', marginTop: '4px',
              maxHeight: '200px', overflowY: 'auto',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 50
            }}>
              {filteredItems.length > 0 ? (
                filteredItems.map(item => (
                  <div
                    key={item}
                    onClick={() => handleAddItem(item)}
                    style={{
                      padding: '10px 12px', cursor: 'pointer', fontSize: '0.9rem', color: '#4a5568',
                      borderBottom: '1px solid #f7fafc',
                      background: selectedItems.includes(item) ? '#f0fff4' : 'white' // Highlight if already selected
                    }}
                    onMouseOver={(e) => !selectedItems.includes(item) && (e.currentTarget.style.background = '#edf2f7')}
                    onMouseOut={(e) => !selectedItems.includes(item) && (e.currentTarget.style.background = 'white')}
                  >
                    {item} {selectedItems.includes(item) && '✓'}
                  </div>
                ))
              ) : (
                <div style={{padding: '12px', color: '#a0aec0', fontSize: '0.85rem', textAlign: 'center'}}>
                   No items found matching "{searchTerm}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* SELECTED CHIPS */}
        <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px'}}>
          {selectedItems.map((item, idx) => (
            <div key={item} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '4px 10px', borderRadius: '20px',
              background: `${LINE_COLORS[idx % LINE_COLORS.length]}15`,
              color: LINE_COLORS[idx % LINE_COLORS.length],
              fontSize: '0.85rem', fontWeight: '600'
            }}>
              {item}
              <button
                onClick={() => handleRemoveItem(item)}
                style={{border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex'}}
              >
                <X size={14} color={LINE_COLORS[idx % LINE_COLORS.length]} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CHART */}
      <div style={{height: '350px'}}>
        {selectedItems.length > 0 && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf2f7" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#a0aec0', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#a0aec0', fontSize: 12}} tickFormatter={v => `$${v}`} />
              <Tooltip
                 contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                 formatter={(value, name) => [`$${value.toFixed(2)}`, name]}
              />
              <Legend verticalAlign="top" height={36}/>
              {selectedItems.map((item, idx) => (
                <Line
                  key={item}
                  type="monotone"
                  dataKey={item}
                  stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                  strokeWidth={3}
                  dot={{fill: LINE_COLORS[idx % LINE_COLORS.length], r: 3}}
                  connectNulls={true}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
           <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0aec0'}}>
             {selectedItems.length === 0 ? "Select an item to begin" : "No price history found for these items."}
           </div>
        )}
      </div>
    </div>
  )
}