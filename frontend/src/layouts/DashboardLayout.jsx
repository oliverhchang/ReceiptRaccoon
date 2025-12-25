import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, TrendingUp, Code, Settings, Search, Bell } from 'lucide-react'
import './DashboardLayout.css'
import RightSidebar from '../components/RightSidebar'

export default function DashboardLayout() {
  return (
    <div className="app-container">

      {/* LEFT SIDEBAR */}
      <aside className="sidebar">
        <div className="logo-container">
          <span>Receipt Raccoon</span>
        </div>

        <nav style={{display: 'flex', flexDirection: 'column'}}>
          <NavLink to="/" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <LayoutDashboard size={22} /> Dashboard
          </NavLink>

          <NavLink to="/inflation" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <TrendingUp size={22} /> Inflation
          </NavLink>

          <NavLink to="/code" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Code size={22} /> Code Guide
          </NavLink>
        </nav>

        {/* Separator for Settings at bottom */}
        <div style={{marginTop: 'auto'}}>
          <NavLink to="/settings" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Settings size={22} /> Settings
          </NavLink>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="main-wrapper">

        {/* TOP HEADER */}
        <header className="top-header">
          {/* Search Bar with Icon inside */}
          <div className="search-container">
            <Search size={20} style={{position: 'absolute', left: '18px', top: '15px', color: '#cbd5e0'}}/>
            <input type="text" placeholder="Search for 'Trader Joes'..." className="search-bar" />
          </div>

          <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
            {/* Notification Bell */}
            <div style={{background: 'white', padding: '10px', borderRadius: '50%', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', cursor: 'pointer'}}>
              <Bell size={20} color="#a0aec0" />
            </div>

            {/* Profile Pill */}
            <div className="user-profile">
              <div style={{textAlign: 'right'}}>
                <div style={{fontWeight: '700', fontSize: '0.9rem', color: '#2d3748'}}>Oliver Chang</div>
                <div style={{fontSize: '0.75rem', color: '#a0aec0'}}>Pro Plan</div>
              </div>
              <div className="avatar">OC</div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="page-content">
          <Outlet />
        </main>

      </div>
      <RightSidebar />
    </div>
  )
}