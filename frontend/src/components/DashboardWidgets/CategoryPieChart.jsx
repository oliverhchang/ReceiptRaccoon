import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

export default function CategoryPieChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div style={{
        background: 'white', padding: '24px', borderRadius: '16px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.02)', height: '480px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0aec0'
      }}>
        No data available
      </div>
    )
  }

  // Custom renderer for the labels with lines
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const RADIAN = Math.PI / 180;
    // Calculate the position for the label (outside the pie)
    const radius = outerRadius * 1.2;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Determine if text should align left or right based on position
    const textAnchor = x > cx ? 'start' : 'end';

    // Hide labels for very tiny slices (less than 3%) to prevent clutter
    if (percent < 0.03) return null;

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
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  return (
    <div style={{
      background: 'white',
      padding: '24px',
      borderRadius: '16px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
      height: '480px'
    }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: '#2d3748' }}>
        Spending Breakdown
      </h3>

      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            data={data}
            // Made radius smaller (80) to give room for the outside labels
            innerRadius={50}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            label={renderCustomizedLabel} // Use our custom label function
            labelLine={true} // Show the connector line
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || '#cbd5e0'}
                stroke="none"
              />
            ))}
          </Pie>
          <Tooltip
             formatter={(value) => `$${value.toFixed(2)}`}
             contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}
          />
          {/* Removed the <Legend /> component entirely */}
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}