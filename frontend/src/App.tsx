// src/App.tsx
import { Routes, Route, useLocation } from 'react-router-dom'
import DashboardPage from './pages/dashboard'
import ServicesPage from './pages/services'
import SignInPage from './pages/SignInPage'
import { AppSidebar } from './components/AppSidebar'
import { SidebarProvider } from './components/ui/sidebar'
import { SignedIn } from '@clerk/clerk-react'
import React from 'react'

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex w-full">
        <AppSidebar />
        <main className=" min-w-0">{children}</main>
      </div>
    </SidebarProvider>
  )
}

export function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
}

function App() {
  const location = useLocation();
  if (location.pathname === '/auth') {
    return <SignInPage />;
  }
  return (
    <SignedIn>
      <AppLayout>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/services/:id" element={<ServicesPage />} />
        </Routes>
      </AppLayout>
    </SignedIn>
  )
}

export default App
