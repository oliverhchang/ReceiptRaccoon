// src/App.jsx
import React from 'react'
import 'leaflet/dist/leaflet.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import Dashboard from './pages/Dashboard'
import Inflation from './pages/Inflation'
import Instructions from './pages/Instructions'
import Settings from './pages/Settings'
import CodeExplanation from './pages/CodeExplanation'

// 1. IMPORT NEW PAGES
import Grocery from './pages/Grocery'
import Gas from './pages/Gas'


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />

          {/* 2. ADD NEW ROUTES HERE */}
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