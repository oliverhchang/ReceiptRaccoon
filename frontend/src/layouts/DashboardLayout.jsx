import React, { useEffect, useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, TrendingUp, BookOpen, Settings, ChevronDown, Cpu } from 'lucide-react'
import { supabase } from '../supabaseClient'
import RightSidebar from '../components/RightSidebar';
import './DashboardLayout.css'

export default function DashboardLayout() {
  const [allUsers, setAllUsers] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [botOnline, setBotOnline] = useState(false)

  useEffect(() => {
    fetchUsers()
    checkBotStatus()
    const interval = setInterval(checkBotStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  async function checkBotStatus() {
    try {
      const { data, error } = await supabase
        .from('system_status')
        .select('last_heartbeat')
        .eq('service_name', 'discord_bot')
        .single()

      if (data && data.last_heartbeat) {
        const lastSeen = new Date(data.last_heartbeat).getTime()
        const now = new Date().getTime()
        const diffMinutes = (now - lastSeen) / 1000 / 60
        setBotOnline(diffMinutes < 2.5)
      }
    } catch (err) {
      console.error("Status check failed", err)
      setBotOnline(false)
    }
  }

  async function fetchUsers() {
    try {
      const { data: receiptData, error: receiptError } = await supabase
        .from('receipts')
        .select('discord_user_id')

      if (receiptError) throw receiptError

      const activeUserIds = [...new Set(receiptData.map(r => r.discord_user_id))]

      if (activeUserIds.length === 0) {
        setAllUsers([])
        return
      }

      const { data: activeUsers, error: userError } = await supabase
        .from('users')
        .select('*')
        .in('discord_id', activeUserIds)

      if (userError) throw userError

      if (activeUsers && activeUsers.length > 0) {
        setAllUsers(activeUsers)
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
        <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0' }}>
          {/* UPDATED LOGO: Now uses the PNG file next to the title */}
          <img
            src="/ReceiptRaccoon_Logo.png"
            alt="Receipt Raccoon Logo"
            style={{ width: '100px', height: '100px', objectFit: 'contain' }}
          />
          <span style={{
            fontSize: '2.7rem',
            fontWeight: '800',
            color: '#fe6b40',
            letterSpacing: '-0.5px',
            lineHeight: '1'
          }}>
            Receipt<br/>Raccoon
          </span>
        </div>

        <nav style={{display: 'flex', flexDirection: 'column'}}>
          <NavLink to="/" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <LayoutDashboard size={22} /> Dashboard
          </NavLink>
          <NavLink to="/inflation" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <TrendingUp size={22} /> Inflation
          </NavLink>
          <NavLink to="/code" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <BookOpen size={22} /> Instructions
          </NavLink>

          <NavLink to="/explanation" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Cpu size={22} /> Code Explanation
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
        <header className="top-header" style={{ justifyContent: 'flex-end' }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>

            {/* BOT STATUS INDICATOR */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '20px',
              background: 'white',
              boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
              border: botOnline ? '1px solid #c6f6d5' : '1px solid #fed7d7'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: botOnline ? '#48bb78' : '#f56565',
                boxShadow: botOnline ? '0 0 8px #48bb78' : 'none'
              }}></div>
              <span style={{
                fontSize: '0.85rem',
                fontWeight: '600',
                color: botOnline ? '#2f855a' : '#c53030'
              }}>
                {botOnline ? "Bot Online" : "Bot Offline"}
              </span>
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

        <main className="page-content">
          <Outlet context={{ currentUser }} />
        </main>
      </div>

      <RightSidebar currentUser={currentUser} />
    </div>
  )
}