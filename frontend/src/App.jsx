import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { Receipt, DollarSign, Calendar, MapPin, User } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function App() {
  const [receipts, setReceipts] = useState([])
  const [loading, setLoading] = useState(true)
  const [userMap, setUserMap] = useState({})

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)

    // 1. Get Receipts
    const { data: receiptData } = await supabase
      .from('receipts')
      .select('*')
      .order('purchase_date', { ascending: false })

    // 2. Get User Names (If the table exists)
    const { data: userData } = await supabase.from('users').select('*')
    const userLookup = {}
    if (userData) userData.forEach(u => userLookup[u.discord_id] = u.display_name)

    setReceipts(receiptData || [])
    setUserMap(userLookup)
    setLoading(false)
  }

  // --- ANALYTICS HELPERS ---
  const monthlyData = receipts.reduce((acc, curr) => {
    const dateStr = curr.purchase_date || curr.scan_date;
    const date = new Date(dateStr);
    const month = date.toLocaleString('default', { month: 'short' });

    const existing = acc.find(item => item.name === month);
    if (existing) existing.amount += curr.total_amount;
    else acc.push({ name: month, amount: curr.total_amount });
    return acc;
  }, []).reverse();

  const categoryData = []
  const catMap = {}
  receipts.forEach(r => {
    if (r.items && Array.isArray(r.items)) {
      r.items.forEach(item => {
        const cat = item.category || 'General';
        catMap[cat] = (catMap[cat] || 0) + (item.price || 0);
      })
    }
  })
  Object.keys(catMap).forEach(key => categoryData.push({ name: key, value: catMap[key] }))

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f5f5f7', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>🦝 Receipt Raccoon</h1>
        <button onClick={fetchData} style={{ padding: '10px 20px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Refresh</button>
      </div>

      {loading ? <p>Loading...</p> : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {/* GRAPHS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <h3>Spending Trend</h3>
              <div style={{ height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#8884d8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <h3>Categories</h3>
              <div style={{ height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill="#82ca9d" label>
                      {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* RECEIPT LIST */}
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <h3>Recent Receipts</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              {receipts.map((receipt) => (
                <div key={receipt.id} style={{ borderBottom: '1px solid #eee', padding: '15px 0', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <Receipt size={16}/> {receipt.store_name}
                    </h4>
                    <p style={{ margin: 0, color: '#888', fontSize: '0.9em' }}>
                      {receipt.purchase_date || new Date(receipt.scan_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold' }}>${receipt.total_amount.toFixed(2)}</div>
                    <div style={{ fontSize: '0.8em', color: '#666' }}>{userMap[receipt.discord_user_id] || 'User ' + receipt.discord_user_id.slice(0,4)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App