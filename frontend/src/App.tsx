// src/App.tsx
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import DashboardPage from './pages/dashboard'
import ServicesPage from './pages/services'
import SignInPage from './pages/SignInPage'
import OnboardingPage from './pages/OnboardingPage'
import PublicStatusPage from './pages/public'
import { AppSidebar } from './components/AppSidebar'
import { SidebarProvider } from './components/ui/sidebar'
import { SignedIn } from '@clerk/clerk-react'
import React, { useEffect, createContext, useContext, useState } from 'react'
import { useIsMobile } from './hooks/use-mobile'
import { useOrganization, useAuth } from '@clerk/clerk-react'

// Context for service count
const ServiceContext = createContext<{
  serviceCount: number;
  setServiceCount: (count: number) => void;
}>({
  serviceCount: 0,
  setServiceCount: () => {}
});

export const useServiceCount = () => useContext(ServiceContext);

function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const { serviceCount } = useServiceCount();
  const hasServices = serviceCount > 0;
  
  return (
    <SidebarProvider>
      <div className={isMobile ? 'flex flex-col h-screen w-full overflow-y-auto' : 'flex w-full'}>
        <AppSidebar />
        <main className={isMobile ? 'flex-1 flex flex-col min-w-0 pt-16' : hasServices ? 'min-w-0' : 'w-full'}>{children}</main>
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
  const [serviceCount, setServiceCount] = useState(0);

  useEffect(() => {
    if (authLoaded && !isSignedIn && location.pathname !== '/' && location.pathname !== '/public') {
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
    <ServiceContext.Provider value={{ serviceCount, setServiceCount }}>
      <Routes>
        <Route path="/" element={<SignInPage />} />
        <Route path="/public" element={<PublicStatusPage />} />
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
          path="/services"
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
    </ServiceContext.Provider>
  );
}

export default App
