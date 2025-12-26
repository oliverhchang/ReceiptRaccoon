// src/App.jsx
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import Dashboard from './pages/Dashboard'
import Inflation from './pages/Inflation'
import Instructions from './pages/Instructions'
import Settings from './pages/Settings' // <--- 1. IMPORT YOUR NEW SETTINGS PAGE

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="inflation" element={<Inflation />} />
          <Route path="code" element={<Instructions />} />

          {/* 2. ADD THIS ROUTE HERE */}
          <Route path="settings" element={<Settings />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}