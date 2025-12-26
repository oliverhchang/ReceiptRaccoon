// src/App.jsx
import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import Dashboard from './pages/Dashboard'
import Inflation from './pages/Inflation'
import Instructions from './pages/Instructions' // <--- IMPORT

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="inflation" element={<Inflation />} />

          {/* Mapped 'code' to instructions for now, or change sidebar link to /instructions */}
          <Route path="code" element={<Instructions />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App