import React, { useState, useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { GROCERY_ITEM_COLORS } from '../../assets/colors'
import { ChevronDown } from 'lucide-react'

const CATEGORIES = Object.keys(GROCERY_ITEM_COLORS)

const SLICE_COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042',
  '#a855f7', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#84cc16'
];

export default function SubCategoryBreakdown({ transactions }) {
  const [selectedCategory, setSelectedCategory] = useState("Vegetables")

  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) return []

    const allItems = transactions.flatMap(t => t.receipt_items || [])
    const filteredItems = allItems.filter(item => item.category === selectedCategory)

    const itemMap = {}
    filteredItems.forEach(item => {
      const name = (item.name || "Unknown").trim()
      itemMap[name] = (itemMap[name] || 0) + (item.price || 0)
    })

    return Object.keys(itemMap)
      .map(name => ({ name: name, amount: itemMap[name] }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)
  }, [transactions, selectedCategory])

  // Custom Label Function
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const RADIAN = Math.PI / 180;
    // Push label out further (1.25x radius)
    const radius = outerRadius * 1.25;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const textAnchor = x > cx ? 'start' : 'end';

    // Hide labels for slices smaller than 3%
    if (percent < 0.03) return null;

    // Truncate long names (e.g., "Organic Bananas..." -> "Organic Bana...")
    const displayName = name.length > 15 ? name.substring(0, 14) + '...' : name;

    return (
      <text
        x={x}
        y={y}
        fill="#4a5568"
        textAnchor={textAnchor}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="500"
      >
        {`${displayName} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', height: '550px' }}>

      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#2d3748' }}>Item Deep Dive</h3>

        {/* DROPDOWN CONTAINER */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                    appearance: 'none',
                    backgroundColor: 'white',
                    border: '1px solid #cbd5e0',
                    borderRadius: '8px',
                    padding: '8px 36px 8px 16px',
                    fontSize: '0.95rem',
                    color: '#2d3748',
                    cursor: 'pointer',
                    outline: 'none',
                    fontWeight: '600',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    minWidth: '180px'
                }}
            >
                {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
            </select>

            <div style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: '#718096'
            }}>
                <ChevronDown size={16} />
            </div>
        </div>
      </div>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="85%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="amount"
              nameKey="name"
              cx="50%"
              cy="50%"
              // Reduced outerRadius from 120 to 90 to make room for labels
              outerRadius={90}
              innerRadius={60}
              paddingAngle={3}
              label={renderCustomizedLabel}
              labelLine={true}
            >
              {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={SLICE_COLORS[index % SLICE_COLORS.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip
                formatter={(value) => [`$${value.toFixed(2)}`, 'Spent']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            {/* Legend Removed */}
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div style={{height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0aec0', fontStyle: 'italic'}}>
            No items found for {selectedCategory}
        </div>
      )}
    </div>
  )
}