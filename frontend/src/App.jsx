import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout' // Check this path!
import Dashboard from './pages/Dashboard'

// Placeholder components for the other tabs (create these later)
const Inflation = () => <h1>Inflation Page (Coming Soon)</h1>
const CodeGuide = () => <h1>Code Guide (Coming Soon)</h1>

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* The Layout wraps all these pages */}
        <Route path="/" element={<DashboardLayout />}>

          {/* This loads inside the <Outlet /> of DashboardLayout */}
          <Route index element={<Dashboard />} />

          <Route path="inflation" element={<Inflation />} />
          <Route path="code" element={<CodeGuide />} />

        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App