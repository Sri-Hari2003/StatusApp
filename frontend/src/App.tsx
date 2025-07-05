// src/App.tsx
import { Routes, Route, useLocation } from 'react-router-dom'
import DashboardPage from './pages/dashboard'
import ServicesPage from './pages/services'
import SignInPage from './pages/SignInPage'
import { AppSidebar } from './components/AppSidebar'
import { SidebarProvider } from './components/ui/sidebar'
import { SignedIn } from '@clerk/clerk-react'
import React from 'react'
import { useIsMobile } from './hooks/use-mobile'
import { MOBILE_NAVBAR_HEIGHT } from './components/AppSidebar'

function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  return (
    <SidebarProvider>
      <div className={isMobile ? 'flex flex-col h-screen w-full overflow-y-auto' : 'flex w-full'}>
        <AppSidebar />
        <main className={isMobile ? 'flex-1 flex flex-col min-w-0 pt-16' : 'min-w-0'}>{children}</main>
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
