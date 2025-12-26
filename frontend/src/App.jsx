// src/App.jsx
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import Dashboard from './pages/Dashboard'
import Inflation from './pages/Inflation'
import Instructions from './pages/Instructions'
import Settings from './pages/Settings'
import CodeExplanation from './pages/CodeExplanation' // <--- 1. IMPORT THE NEW PAGE

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
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