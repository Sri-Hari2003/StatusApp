// src/App.tsx
import { Routes, Route } from 'react-router-dom'
import DashboardPage from './pages/dashboard'
import ServicesPage from './pages/services'

function App() {
  return (
    <Routes>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/services/:id" element={<ServicesPage />} /> 
    </Routes>
  )
}

export default App
