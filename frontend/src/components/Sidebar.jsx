import React from 'react'
import { LayoutDashboard, TrendingUp, Code, Settings } from 'lucide-react'
import './Sidebar.css'

export default function Sidebar() {
  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <h2>Receipt Raccoon</h2>
      </div>

      <ul className="sidebar-menu">
        <li className="active">
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </li>
        <li>
          <TrendingUp size={20} />
          <span>Inflation</span>
        </li>
        <li>
          <Code size={20} />
          <span>Code Guide</span>
        </li>
      </ul>

      <div className="sidebar-footer">
        <div className="menu-item">
          <Settings size={20} />
          <span>Settings</span>
        </div>
      </div>
    </nav>
  )
}