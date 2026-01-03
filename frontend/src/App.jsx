// src/App.jsx
import React, { useState, useEffect } from 'react'
import 'leaflet/dist/leaflet.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient'

import DashboardLayout from './layouts/DashboardLayout'
import Dashboard from './pages/Dashboard'
import Inflation from './pages/Inflation'
import Instructions from './pages/Instructions'
import Settings from './pages/Settings'
import CodeExplanation from './pages/CodeExplanation'
import Grocery from './pages/Grocery'
import Gas from './pages/Gas'
// Note: We removed the "Login" page import

export default function App() {
  const [session, setSession] = useState(null)

  // We remove the 'loading' state blocking the UI.
  // The app loads immediately, session or not.

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* We pass the session (which might be null) to the layout */}
        <Route path="/" element={<DashboardLayout session={session} />}>
          <Route index element={<Dashboard />} />
          <Route path="grocery" element={<Grocery />} />
          <Route path="gas" element={<Gas />} />
          <Route path="inflation" element={<Inflation />} />
          <Route path="code" element={<Instructions />} />
          <Route path="explanation" element={<CodeExplanation />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}