import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'

// Placeholder pages (We will build the real ones next)
const Dashboard = () => <h1>🏠 Individual Dashboard</h1>
const Inflation = () => <h1>📈 Inflation Tracker</h1>
const CodePage = () => <h1>💻 Code Explanation</h1>
const SettingsPage = () => <h1>⚙️ Settings</h1>

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inflation" element={<Inflation />} />
          <Route path="/code" element={<CodePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App