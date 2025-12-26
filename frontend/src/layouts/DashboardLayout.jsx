import React, { useEffect, useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, TrendingUp, Code, Settings, Search, Bell, ChevronDown } from 'lucide-react'
import { supabase } from '../supabaseClient'
import RightSidebar from '../components/RightSidebar';
import './DashboardLayout.css'

export default function DashboardLayout() {
  const [allUsers, setAllUsers] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      // 1. First, get all unique User IDs from the receipts table
      // This ensures we only care about people who actually uploaded something.
      const { data: receiptData, error: receiptError } = await supabase
        .from('receipts')
        .select('discord_user_id')

      if (receiptError) throw receiptError

      // Extract unique IDs (using Set to remove duplicates)
      const activeUserIds = [...new Set(receiptData.map(r => r.discord_user_id))]

      if (activeUserIds.length === 0) {
        console.log("No receipts found yet.")
        setAllUsers([])
        return
      }

      // 2. Now fetch details ONLY for these specific users
      const { data: activeUsers, error: userError } = await supabase
        .from('users')
        .select('*')
        .in('discord_id', activeUserIds) // <--- This is the magic filter

      if (userError) throw userError

      if (activeUsers && activeUsers.length > 0) {
        setAllUsers(activeUsers)
        // Optional: Keep your current selection if possible, otherwise default to first
        setCurrentUser(prev => prev || activeUsers[0])
      }

    } catch (error) {
      console.error("Error fetching active users:", error)
    }
  }

  const switchUser = (user) => {
    setCurrentUser(user)
    setIsDropdownOpen(false)
  }

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

        <div style={{marginTop: 'auto'}}>
          <NavLink to="/settings" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Settings size={22} /> Settings
          </NavLink>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="main-wrapper">
        <header className="top-header">
          <div className="search-container">
            <Search size={20} style={{position: 'absolute', left: '18px', top: '15px', color: '#cbd5e0'}}/>
            <input type="text" placeholder="Search receipts..." className="search-bar" />
          </div>

          <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
            <div style={{background: 'white', padding: '10px', borderRadius: '50%', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', cursor: 'pointer'}}>
              <Bell size={20} color="#a0aec0" />
            </div>

            {/* User Dropdown */}
            <div style={{position: 'relative'}}>
              <div className="user-profile" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <div style={{textAlign: 'right'}}>
                  <div style={{fontWeight: '700', fontSize: '0.9rem', color: '#2d3748'}}>
                    {currentUser ? currentUser.display_name : "Loading..."}
                  </div>
                  <div style={{fontSize: '0.75rem', color: '#a0aec0'}}>Switch User</div>
                </div>
                {currentUser ? (
                  <img src={currentUser.avatar_url} alt="avatar" className="avatar" style={{objectFit: 'cover'}} />
                ) : (
                  <div className="avatar">?</div>
                )}
                <ChevronDown size={16} color="#a0aec0" style={{marginLeft: '5px'}}/>
              </div>

              {isDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '60px', right: 0,
                  background: 'white', padding: '10px', borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)', zIndex: 100, width: '220px'
                }}>
                  {allUsers.map(user => (
                    <div
                      key={user.discord_id}
                      onClick={() => switchUser(user)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px', borderRadius: '8px', cursor: 'pointer',
                        background: currentUser?.discord_id === user.discord_id ? '#fff5f0' : 'transparent',
                        color: currentUser?.discord_id === user.discord_id ? '#fe6b40' : '#2d3748'
                      }}
                    >
                      <img src={user.avatar_url} alt="av" style={{width: '30px', height: '30px', borderRadius: '50%'}}/>
                      <span style={{fontSize: '0.9rem', fontWeight: '500'}}>{user.display_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* This is where Dashboard, Inflation, etc. will render */}
        <main className="page-content">
          <Outlet context={{ currentUser }} />
        </main>
      </div>

      <RightSidebar currentUser={currentUser} />
    </div>
  )
}