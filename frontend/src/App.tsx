// src/App.tsx
import { Routes, Route, useLocation } from 'react-router-dom'
import DashboardPage from './pages/dashboard'
import ServicesPage from './pages/services'
import SignInPage from './pages/SignInPage'
import { AppSidebar } from './components/AppSidebar'
import { SidebarProvider } from './components/ui/sidebar'

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </SidebarProvider>
  )
}

function App() {
  const location = useLocation();
  if (location.pathname === '/auth') {
    return <SignInPage />;
  }
  return (
    <AppLayout>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/services/:id" element={<ServicesPage />} />
      </Routes>
    </AppLayout>
  )
}

export default App
