import React, { useState, useEffect, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Filter } from 'lucide-react'
import { supabase } from '../../supabaseClient' // Adjust path if needed (../supabaseClient)

const CATEGORIES = [
  "All Categories",
  "Groceries",
  "Restaurants & Dining",
  "Transportation",
  "Home & Utilities",
  "Shopping & Entertainment",
  "Health",
  "Travel",
  "Personal & Family Care",
  "Education",
  "Business Expenses",
  "Finance",
  "Giving",
  "Cash, Checks & Misc",
  "Uncategorized"
];

export default function SpendingTrendWithBreakdown({ data, periodLabel = "Period", onHoverPeriod, currentUser }) {
  const [hoveredKey, setHoveredKey] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [budgetMap, setBudgetMap] = useState({})

  // --- 1. FETCH BUDGETS ---
  useEffect(() => {
    async function fetchBudgets() {
      if (!currentUser || !currentUser.discord_id) return;

      const { data, error } = await supabase
        .from('users')
        .select('category_budgets')
        .eq('discord_id', currentUser.discord_id)
        .single();

      if (data && data.category_budgets) {
        setBudgetMap(data.category_budgets);
      }
    }
    fetchBudgets();
  }, [currentUser]);

  // --- 2. CALCULATE ACTIVE BUDGET LINE ---
  const activeBudget = useMemo(() => {
    if (selectedCategory === "All Categories") {
      // Sum of all set budgets
      return Object.values(budgetMap).reduce((sum, val) => sum + (Number(val) || 0), 0);
    }
    // Specific category budget
    return Number(budgetMap[selectedCategory]) || 0;
  }, [selectedCategory, budgetMap]);

  // --- 3. FILTER DATA ---
  const filteredData = data.map(period => {
    if (selectedCategory === "All Categories") return period;

    const categoryTotal = period.items
      ? period.items
          .filter(item => item.category === selectedCategory)
          .reduce((sum, item) => sum + (item.price || 0), 0)
      : 0;

    const categoryItems = period.items
      ? period.items.filter(item => item.category === selectedCategory)
      : [];

    return {
      ...period,
      amount: categoryTotal,
      items: categoryItems
    };
  });

  const activeData = filteredData && filteredData.length > 0
    ? (hoveredKey ? filteredData.find(d => d.name === hoveredKey) : filteredData[filteredData.length - 1])
    : null;

  useEffect(() => {
    if (onHoverPeriod) {
        onHoverPeriod(activeData)
    }
  }, [activeData, onHoverPeriod])

  const topItems = activeData && activeData.items
    ? [...activeData.items].sort((a, b) => (b.price || 0) - (a.price || 0)).slice(0, 5)
    : []

  if (!data || data.length === 0) return <div style={{padding:'24px', background:'white'}}>No data available</div>

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: '32px',
      alignItems: 'start',
      height: '450px'
    }}>

      {/* CHART COLUMN */}
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

        {/* HEADER */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div style={{display:'flex', flexDirection:'column'}}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#2d3748' }}>
              Spending Trend
            </h3>
            {/* Show Budget text below title */}
            {activeBudget > 0 && (
                <span style={{fontSize: '0.8rem', color: '#718096', marginTop: '4px'}}>
                    Budget: <strong>${activeBudget.toLocaleString()}</strong>
                </span>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f7fafc',
              borderRadius: '8px',
              padding: '6px 12px',
              border: '1px solid #edf2f7'
            }}>
              <Filter size={14} color="#718096" style={{ marginRight: '8px' }} />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '0.85rem',
                  color: '#4a5568',
                  fontWeight: 500,
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  paddingRight: '16px'
                }}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* CHART */}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={filteredData}
            onMouseMove={(state) => {
                if (state.isTooltipActive && state.activeLabel) {
                    setHoveredKey(state.activeLabel)
                }
            }}
            onMouseLeave={() => setHoveredKey(null)}
          >
            <defs>
              <linearGradient id="colorSplit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fe6b40" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#fe6b40" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf2f7" />
            <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{fill: '#a0aec0', fontSize: 11}}
                dy={10}
                minTickGap={30}
            />
            <YAxis
                axisLine={false}
                tickLine={false}
                tick={{fill: '#a0aec0', fontSize: 12}}
                tickFormatter={v => `$${v}`}
            />
            <Tooltip
                cursor={{ stroke: '#fe6b40', strokeWidth: 1, strokeDasharray: '5 5' }}
                formatter={(value) => [`$${value.toFixed(2)}`, selectedCategory === "All Categories" ? 'Total Spent' : selectedCategory]}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Area
                type="monotone"
                dataKey="amount"
                stroke="#fe6b40"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorSplit)"
                activeDot={{ r: 6, strokeWidth: 0 }}
                animationDuration={500}
            />

            {/* --- 4. THE DOTTED BUDGET LINE --- */}
            {activeBudget > 0 && (
                <ReferenceLine
                    y={activeBudget}
                    stroke="#718096"
                    strokeDasharray="3 3"
                    strokeWidth={2}
                    label={{
                        position: 'insideTopRight',
                        value: 'Budget',
                        fill: '#718096',
                        fontSize: 12
                    }}
                />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ITEM LIST COLUMN */}
      <div style={{
          height: '100%',
          borderLeft: '1px solid #edf2f7',
          paddingLeft: '32px',
          display: 'flex',
          flexDirection: 'column'
      }}>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: '#2d3748' }}>
          Top Items
        </h3>
        <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: '#a0aec0', fontWeight: 500 }}>
          {periodLabel}: <span style={{color: '#2d3748', fontWeight: 'bold'}}>{activeData?.name || '-'}</span>
          {selectedCategory !== "All Categories" && (
            <span style={{display: 'block', fontSize: '0.75rem', color: '#fe6b40', marginTop: '2px'}}>
              ({selectedCategory})
            </span>
          )}
        </p>

        <div style={{ flex: 1, overflowY: 'auto' }}>
            {topItems.length > 0 ? (
                topItems.map((item, idx) => (
                    <div key={idx} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px',
                        paddingBottom: '12px',
                        borderBottom: idx === topItems.length - 1 ? 'none' : '1px solid #f7fafc'
                    }}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <div style={{
                                width: '24px', height: '24px', borderRadius: '50%',
                                background: '#fff5f0', color: '#fe6b40',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.75rem', fontWeight: 'bold',
                                flexShrink: 0
                            }}>
                                {idx + 1}
                            </div>
                            <div style={{display: 'flex', flexDirection: 'column'}}>
                                <span style={{
                                    fontSize: '0.9rem', color: '#4a5568', fontWeight: 500,
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '110px'
                                }}>
                                    {item.name || "Unknown Item"}
                                </span>
                                {item.store && (
                                    <span style={{fontSize: '0.7rem', color: '#a0aec0'}}>
                                        {item.store}
                                    </span>
                                )}
                            </div>
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#2d3748' }}>
                            ${(item.price || 0).toFixed(2)}
                        </span>
                    </div>
                ))
            ) : (
                <div style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#a0aec0',
                    fontSize: '0.9rem',
                    textAlign: 'center',
                    fontStyle: 'italic'
                }}>
                    No {selectedCategory !== "All Categories" ? selectedCategory.toLowerCase() : ''} purchases found.
                </div>
            )}
        </div>
      </div>
    </div>
  )
}