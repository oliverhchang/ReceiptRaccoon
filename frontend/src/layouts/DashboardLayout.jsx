// src/layouts/DashboardLayout.jsx
import React, { useEffect, useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
// 1. ADDED 'Cpu' TO IMPORTS
import { LayoutDashboard, TrendingUp, BookOpen, Settings, ShoppingCart, Fuel, LogOut, LogIn, User, Cpu } from 'lucide-react'
import { supabase } from '../supabaseClient'
import RightSidebar from '../components/RightSidebar';
import './DashboardLayout.css'

export default function DashboardLayout({ session }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [botOnline, setBotOnline] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    checkBotStatus()
    if (session) {
      fetchMyProfile()
    } else {
      setCurrentUser(null)
    }

    const interval = setInterval(checkBotStatus, 30000)
    return () => clearInterval(interval)
  }, [session])

  async function checkBotStatus() {
    try {
      const { data } = await supabase.from('system_status').select('last_heartbeat').eq('service_name', 'discord_bot').single()
      if (data?.last_heartbeat) {
        const diff = (new Date().getTime() - new Date(data.last_heartbeat).getTime()) / 60000
        setBotOnline(diff < 2.5)
      }
    } catch (e) { setBotOnline(false) }
  }

  async function fetchMyProfile() {
    try {
      const discordId = session?.user?.user_metadata?.provider_id
      if (!discordId) return

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('discord_id', discordId)
        .single()

      if (data) setCurrentUser(data)
      if (error) console.error("Profile fetch error:", error)
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const handleLogin = async () => {
    setAuthLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: window.location.origin }
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setCurrentUser(null)
    window.location.reload()
  }

  return (
    <div className="app-container">
      {/* LEFT SIDEBAR */}
      <aside className="sidebar">
        <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0' }}>
          <img src="/ReceiptRaccoon_Logo.png" alt="Logo" style={{ width: '100px', height: '100px', objectFit: 'contain' }} />
          <span style={{ fontSize: '2.7rem', fontWeight: '800', color: '#fe6b40', letterSpacing: '-0.5px', lineHeight: '1' }}>
            Receipt<br/>Raccoon
          </span>
        </div>

        <nav style={{display: 'flex', flexDirection: 'column'}}>
          <NavLink to="/" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <LayoutDashboard size={22} /> Dashboard
          </NavLink>
          <NavLink to="/grocery" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <ShoppingCart size={22} /> Grocery
          </NavLink>
          <NavLink to="/gas" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Fuel size={22} /> Gas Station
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

            {/* Bot Status */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '20px',
              background: 'white', boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
              border: botOnline ? '1px solid #c6f6d5' : '1px solid #fed7d7'
            }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: botOnline ? '#48bb78' : '#f56565',
                boxShadow: botOnline ? '0 0 8px #48bb78' : 'none'
              }}></div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: botOnline ? '#2f855a' : '#c53030' }}>
                {botOnline ? "Bot Online" : "Bot Offline"}
              </span>
            </div>

            {/* DYNAMIC AUTH SECTION */}
            {currentUser ? (
              // 1. LOGGED IN VIEW
              <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                  <div style={{textAlign: 'right'}}>
                    <div style={{fontWeight: '700', fontSize: '0.9rem', color: '#2d3748'}}>
                      {currentUser.display_name}
                    </div>
                    <div style={{fontSize: '0.75rem', color: '#48bb78'}}>Active</div>
                  </div>
                  <img src={currentUser.avatar_url} alt="av" className="avatar" style={{border: '2px solid #48bb78'}} />

                  {/* 2. UPDATED LOGOUT BUTTON (More Intuitive) */}
                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: '#fff5f5', // Very light red bg
                        border: '1px solid #fc8181', // Red border
                        color: '#c53030', // Dark red text
                        padding: '8px 12px', borderRadius: '10px',
                        fontSize: '0.85rem', fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#fed7d7'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#fff5f5'}
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
              </div>
            ) : (
              // 2. GUEST VIEW (SIGN IN BUTTON)
              <button
                onClick={handleLogin}
                disabled={authLoading}
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: '#5865F2', color: 'white',
                    border: 'none', padding: '10px 20px', borderRadius: '12px',
                    fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(88, 101, 242, 0.3)',
                    transition: 'transform 0.1s'
                }}
              >
                {authLoading ? (
                    <span>Connecting...</span>
                ) : (
                    <>
                        <LogIn size={18} />
                        <span>Sign In</span>
                    </>
                )}
              </button>
            )}
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

