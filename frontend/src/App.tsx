// src/App.tsx
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import DashboardPage from './pages/dashboard'
import ServicesPage from './pages/services'
import SignInPage from './pages/SignInPage'
import OnboardingPage from './pages/OnboardingPage'
import { AppSidebar } from './components/AppSidebar'
import { SidebarProvider } from './components/ui/sidebar'
import { SignedIn } from '@clerk/clerk-react'
import React, { useEffect } from 'react'
import { useIsMobile } from './hooks/use-mobile'
import { useOrganization, useAuth } from '@clerk/clerk-react'


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
  const { isLoaded, membership } = useOrganization();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (authLoaded && !isSignedIn && location.pathname !== '/') {
      navigate('/', { replace: true });
    }
  }, [authLoaded, isSignedIn, location.pathname, navigate]);

  useEffect(() => {
    if (authLoaded && isSignedIn && isLoaded) {
      if (!membership && location.pathname !== '/onboarding') {
        navigate('/onboarding', { replace: true });
      } else if (membership && location.pathname === '/') {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [authLoaded, isSignedIn, isLoaded, membership, location.pathname, navigate]);

  return (
    <Routes>
      <Route path="/" element={<SignInPage />} />
      <Route
        path="/onboarding"
        element={
          <SignedIn>
            <OnboardingPage />
          </SignedIn>
        }
      />
      <Route
        path="/dashboard"
        element={
          <SignedIn>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </SignedIn>
        }
      />
      <Route
        path="/services/:id"
        element={
          <SignedIn>
            <AppLayout>
              <ServicesPage />
            </AppLayout>
          </SignedIn>
        }
      />
    </Routes>
  );
}

export default App
